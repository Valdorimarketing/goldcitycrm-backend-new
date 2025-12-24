import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WhatConvertsLog, WebhookLogStatus } from '../entities/whatconverts-log.entity';
import { WebhookResponseDto, LeadMappingConfigDto } from '../dto/whatconverts-webhook.dto';
import { WhatConvertsLead, LeadMappingConfig } from '../interfaces/whatconverts.interface';
import { Customer } from '../../customer/entities/customer.entity';
import { CustomerService } from '../../customer/services/customer.service';
import { CreateCustomerDto } from '../../customer/dto/create-customer.dto';
import { NotificationService } from '../../notification/services/notification.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WhatConvertsService {
  private readonly logger = new Logger(WhatConvertsService.name);

  // Varsayılan mapping config - .env veya DB'den alınabilir
  private mappingConfig: LeadMappingConfig = {
    defaultStatusId: 1,      // "Yeni" status ID
    defaultSourceId: 4,     // "WhatConverts" source ID - Source tablosunda oluşturulmalı
    defaultUserId: undefined,
    autoAssign: false,
    skipDuplicates: true,
    skipSpam: true,
  };

  constructor(
    @InjectRepository(WhatConvertsLog)
    private readonly logRepository: Repository<WhatConvertsLog>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    private readonly customerService: CustomerService,
    private readonly notificationService: NotificationService,
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: ConfigService,
  ) {
    // Config'den mapping ayarlarını yükle
    this.loadMappingConfig();
  }

  /**
   * .env'den mapping ayarlarını yükle
   */
  private loadMappingConfig(): void {
    const statusId = this.configService.get<number>('WHATCONVERTS_DEFAULT_STATUS_ID');
    const sourceId = this.configService.get<number>('WHATCONVERTS_DEFAULT_SOURCE_ID');
    const userId = this.configService.get<number>('WHATCONVERTS_DEFAULT_USER_ID');
    const autoAssign = this.configService.get<string>('WHATCONVERTS_AUTO_ASSIGN');
    const skipDuplicates = this.configService.get<string>('WHATCONVERTS_SKIP_DUPLICATES');
    const skipSpam = this.configService.get<string>('WHATCONVERTS_SKIP_SPAM');

    if (statusId) this.mappingConfig.defaultStatusId = statusId;
    if (sourceId) this.mappingConfig.defaultSourceId = sourceId;
    if (userId) this.mappingConfig.defaultUserId = userId;
    if (autoAssign !== undefined) this.mappingConfig.autoAssign = autoAssign === 'true';
    if (skipDuplicates !== undefined) this.mappingConfig.skipDuplicates = skipDuplicates === 'true';
    if (skipSpam !== undefined) this.mappingConfig.skipSpam = skipSpam === 'true';

    this.logger.log(`Mapping config loaded: ${JSON.stringify(this.mappingConfig)}`);
  }

  /**
   * Mapping config'i güncelle (admin panel için)
   */
  async updateMappingConfig(config: LeadMappingConfigDto): Promise<LeadMappingConfig> {
    this.mappingConfig = {
      ...this.mappingConfig,
      ...config,
    };
    this.logger.log(`Mapping config updated: ${JSON.stringify(this.mappingConfig)}`);
    return this.mappingConfig;
  }

  /**
   * Mevcut mapping config'i getir
   */
  getMappingConfig(): LeadMappingConfig {
    return this.mappingConfig;
  }

  /**
   * Webhook'tan gelen lead'i işle
   */
  async processWebhook(
    payload: any,
    webhookIp?: string,
  ): Promise<WebhookResponseDto> {
    const startTime = Date.now();

    // Lead verisini çıkar (wrapper varsa veya direkt geldiyse)
    const leadData = this.extractLeadData(payload);

    if (!leadData || !leadData.lead_id) {
      this.logger.error('Invalid webhook payload: missing lead_id');
      throw new BadRequestException('Invalid webhook payload: missing lead_id');
    }

    this.logger.log(`📥 Processing webhook for lead_id: ${leadData.lead_id}`);

    // Log kaydı oluştur
    const log = new WhatConvertsLog({
      leadId: leadData.lead_id,
      accountId: leadData.account_id,
      profileId: leadData.profile_id,
      leadType: this.normalizeLeadType(leadData.lead_type),
      eventType: payload.event || 'lead.created',
      rawPayload: payload,
      contactPhone: leadData.contact_phone_number || leadData.phone_number || leadData.caller_number,
      contactEmail: leadData.contact_email_address || leadData.email_address,
      contactName: leadData.contact_name || leadData.caller_name,
      leadSource: leadData.lead_source,
      leadMedium: leadData.lead_medium,
      leadCampaign: leadData.lead_campaign,
      leadUrl: leadData.lead_url,
      landingUrl: leadData.landing_url,
      webhookIp,
    });

    try {
      // 1. Spam kontrolü
      if (this.mappingConfig.skipSpam && leadData.spam) {
        log.status = WebhookLogStatus.SPAM;
        log.message = 'Lead marked as spam, skipped';
        await this.saveLog(log, startTime);

        return this.createResponse(false, 'Lead skipped (spam)', leadData.lead_id, 'skipped');
      }

      // 2. Duplicate kontrolü (WhatConverts tarafında)
      if (this.mappingConfig.skipDuplicates && leadData.duplicate) {
        log.status = WebhookLogStatus.DUPLICATE;
        log.message = 'Lead marked as duplicate by WhatConverts, skipped';
        await this.saveLog(log, startTime);

        return this.createResponse(false, 'Lead skipped (duplicate)', leadData.lead_id, 'skipped');
      }

      // 3. Telefon numarası ile mevcut müşteri kontrolü
      const phone = this.normalizePhone(
        leadData.contact_phone_number || leadData.phone_number || leadData.caller_number
      );

      if (phone) {
        const existingCustomer = await this.customerRepository.findOne({
          where: { phone },
        });

        if (existingCustomer) {
          log.status = WebhookLogStatus.DUPLICATE;
          log.customerId = existingCustomer.id;
          log.message = `Customer already exists with phone: ${phone}`;
          await this.saveLog(log, startTime);

          // Mevcut müşteriye not ekle (opsiyonel)
          await this.addNoteToExistingCustomer(existingCustomer.id, leadData);

          return this.createResponse(
            true,
            'Existing customer found, note added',
            leadData.lead_id,
            'updated',
            existingCustomer.id,
          );
        }
      }

      // 4. Lead'i Customer'a dönüştür
      const customerDto = await this.mapLeadToCustomer(leadData);

      // 5. Customer oluştur
      const customer = await this.customerService.createCustomer(customerDto);

      log.status = WebhookLogStatus.SUCCESS;
      log.customerId = customer.id;
      log.message = `Customer created successfully with ID: ${customer.id}`;
      await this.saveLog(log, startTime);

      // 6. Bildirim gönder
      await this.sendNotifications(customer, leadData);

      // 7. Event emit et (WebSocket için)
      this.eventEmitter.emit('whatconverts.lead.created', {
        customerId: customer.id,
        leadId: leadData.lead_id,
        leadType: leadData.lead_type,
        source: leadData.lead_source,
      });

      this.logger.log(`✅ Lead ${leadData.lead_id} -> Customer ${customer.id} created`);

      return this.createResponse(
        true,
        'Customer created successfully',
        leadData.lead_id,
        'created',
        customer.id,
      );

    } catch (error) {
      this.logger.error(`❌ Error processing lead ${leadData.lead_id}: ${error.message}`, error.stack);

      log.status = WebhookLogStatus.ERROR;
      log.message = 'Error processing webhook';
      log.errorDetail = error.message;
      await this.saveLog(log, startTime);

      return this.createResponse(false, error.message, leadData.lead_id, 'error');
    }
  }

  /**
   * Lead verisini payload'dan çıkar
   */
  private extractLeadData(payload: any): WhatConvertsLead {
    // WhatConverts bazen lead'i wrapper içinde, bazen direkt gönderir
    if (payload.lead && payload.lead.lead_id) {
      return payload.lead;
    }

    // Direkt lead verisi geldiyse
    if (payload.lead_id) {
      return payload;
    }

    return null;
  }

  /**
   * Lead tipini normalize et
   */
  private normalizeLeadType(leadType: string): string {
    if (!leadType) return 'other';

    const typeMap: Record<string, string> = {
      'Phone Call': 'phone_call',
      'Web Form': 'web_form',
      'Email': 'email',
      'Chat': 'chat',
      'Text Message': 'text_message',
      'Event': 'event',
      'Transaction': 'transaction',
      'Appointment': 'appointment',
      'Other': 'other',
    };

    return typeMap[leadType] || leadType.toLowerCase().replace(' ', '_');
  }

  /**
   * Telefon numarasını normalize et (E.164 format)
   */
  private normalizePhone(phone: string): string {
    if (!phone) return null;

    // Sadece rakamları al
    let cleaned = phone.replace(/\D/g, '');

    if (!cleaned) return null;

    // Türkiye numarası kontrolü
    if (cleaned.startsWith('90') && cleaned.length === 12) {
      return cleaned; // 905551234567
    }

    if (cleaned.startsWith('0') && cleaned.length === 11) {
      return `9${cleaned}`; // 05551234567 -> 905551234567
    }

    if (cleaned.length === 10 && !cleaned.startsWith('0')) {
      return `90${cleaned}`; // 5551234567 -> 905551234567
    }

    // US/Diğer formatlar
    if (cleaned.startsWith('1') && cleaned.length === 11) {
      return cleaned; // 13057785260
    }

    // 10 haneli US numarası
    if (cleaned.length === 10) {
      return `1${cleaned}`; // 3057785260 -> 13057785260
    }

    return cleaned;
  }

  /**
   * İsmi parçala (ad/soyad)
   */
  private parseName(fullName: string): { name: string; surname: string } {
    if (!fullName) return { name: '', surname: '' };

    const parts = fullName.trim().split(' ');

    if (parts.length === 1) {
      return { name: parts[0], surname: '' };
    }

    const surname = parts.pop();
    const name = parts.join(' ');

    return { name, surname };
  }

  /**
   * Lead'i Customer DTO'ya dönüştür
   */


  /**
 * Lead'i Customer DTO'ya dönüştür
 */
  private async mapLeadToCustomer(lead: WhatConvertsLead): Promise<CreateCustomerDto> {
    const { name, surname } = this.parseName(lead.contact_name || lead.caller_name);
    const phone = this.normalizePhone(
      lead.contact_phone_number || lead.phone_number || lead.caller_number
    );
    const email = lead.contact_email_address || lead.email_address;

    // Message oluştur (lead tipine göre)
    const message = this.buildLeadMessage(lead);

    // Description oluştur (additional fields dahil)
    const description = this.buildLeadDescription(lead);

    // ✅ URL'i kısalt (website sütunu için)
    const websiteUrl = this.truncateUrl(lead.lead_url, 255);

    const customerDto: CreateCustomerDto = {
      name: name || 'WC Lead',
      surname: surname || '',
      phone: phone,
      email: email,

      // Kaynak ve Durum
      sourceId: this.mappingConfig.defaultSourceId,
      status: this.mappingConfig.defaultStatusId,

      // URL bilgileri - ✅ KISALTILMIŞ
      url: this.truncateUrl(lead.landing_url || lead.lead_url, 500), // url sütunu için
      website: websiteUrl, // website sütunu için (255 char)

      // Konum
      district: lead.city,
      address: [lead.city, lead.state, lead.country].filter(Boolean).join(', '),

      // Açıklamalar
      message: message,
      description: description,

      // İlgili işlem (kampanya bilgisi)
      relatedTransaction: lead.lead_campaign || lead.lead_source,

      // Aktif
      isActive: true,

      // Kullanıcı ataması (opsiyonel)
      relevantUser: this.mappingConfig.defaultUserId,

      // ✅ Dynamic fields'ı GÖNDERMİYORUZ - description'a eklendi
      dynamicFields: [],
    };

    return customerDto;
  }

  /**
   * URL'i belirtilen uzunluğa kısalt
   */
  private truncateUrl(url: string, maxLength: number): string {
    if (!url) return null;
    if (url.length <= maxLength) return url;

    // URL'i kısalt ve "..." ekle
    return url.substring(0, maxLength - 3) + '...';
  }

  /**
   * Lead tipine göre mesaj oluştur
   */
  private buildLeadMessage(lead: WhatConvertsLead): string {
    const parts: string[] = [];

    // Lead tipi
    parts.push(`[${lead.lead_type || 'Lead'}]`);

    // Form/Email mesajı
    if (lead.message) {
      parts.push(lead.message);
    }

    if (lead.email_message) {
      parts.push(`Email: ${lead.email_message}`);
    }

    if (lead.email_subject) {
      parts.push(`Konu: ${lead.email_subject}`);
    }

    // Telefon transcription
    if (lead.call_transcription) {
      parts.push(`Arama Özeti: ${lead.call_transcription.substring(0, 500)}`);
    }

    // Notes
    if (lead.notes) {
      parts.push(`Not: ${lead.notes}`);
    }

    return parts.join('\n\n');
  }

  /**
   * Lead için açıklama oluştur
   */
  /**
 * Lead için açıklama oluştur
 */
  private buildLeadDescription(lead: WhatConvertsLead): string {
    const lines: string[] = [
      `📥 WhatConverts Lead #${lead.lead_id}`,
      `📅 Tarih: ${lead.date_created}`,
      `🎯 Tip: ${lead.lead_type}`,
    ];

    if (lead.lead_source) {
      lines.push(`📊 Kaynak: ${lead.lead_source}`);
    }

    if (lead.lead_medium) {
      lines.push(`📢 Medium: ${lead.lead_medium}`);
    }

    if (lead.lead_campaign) {
      lines.push(`🎪 Kampanya: ${lead.lead_campaign}`);
    }

    if (lead.lead_keyword) {
      lines.push(`🔑 Anahtar Kelime: ${lead.lead_keyword}`);
    }

    if (lead.landing_url) {
      lines.push(`🌐 Landing Page: ${lead.landing_url}`);
    }

    if (lead.device_type) {
      lines.push(`📱 Cihaz: ${lead.device_type} (${lead.device_make || '-'})`);
    }

    if (lead.call_duration_seconds) {
      const minutes = Math.floor(lead.call_duration_seconds / 60);
      const seconds = lead.call_duration_seconds % 60;
      lines.push(`📞 Arama Süresi: ${minutes}:${seconds.toString().padStart(2, '0')}`);
    }

    // Lead analysis varsa
    if (lead.lead_analysis) {
      if (lead.lead_analysis['Lead Summary']) {
        lines.push(`\n📝 AI Özet: ${lead.lead_analysis['Lead Summary']}`);
      }
      if (lead.lead_analysis['Sentiment Detection']) {
        lines.push(`😊 Duygu: ${lead.lead_analysis['Sentiment Detection']}`);
      }
    }



    if (lead.additional_fields && Object.keys(lead.additional_fields).length > 0) {
      lines.push('\n📋 Form Verileri:');
      Object.entries(lead.additional_fields).forEach(([key, value]) => {
        const cleanValue = typeof value === 'string'
          ? value.replace(/<[^>]*>/g, '').trim()
          : value;

        if (cleanValue && cleanValue !== '') {
          lines.push(`  • ${key}: ${cleanValue}`);
        }
      });
    }

    // ✅ MAX LENGTH kontrolü ekle (description sütunu TEXT ise 65535 char)
    const fullDescription = lines.join('\n');

    // Eğer çok uzunsa kısalt
    if (fullDescription.length > 10000) {
      return fullDescription.substring(0, 9997) + '...';
    }

    return fullDescription;


  }


  /**
   * Mevcut müşteriye not ekle
   */
  private async addNoteToExistingCustomer(customerId: number, lead: WhatConvertsLead): Promise<void> {
    try {
      // CustomerHistoryService veya CustomerNoteService kullanılabilir
      // Şimdilik description'a ekleme yapıyoruz
      const customer = await this.customerRepository.findOne({
        where: { id: customerId },
      });

      if (customer) {
        const newNote = `\n\n---\n📥 WhatConverts Lead #${lead.lead_id} (${new Date().toLocaleString('tr-TR')})\n${this.buildLeadMessage(lead)}`;

        customer.description = (customer.description || '') + newNote;
        await this.customerRepository.save(customer);
      }
    } catch (error) {
      this.logger.error(`Error adding note to customer ${customerId}: ${error.message}`);
    }
  }

  /**
   * Bildirim gönder
   */
  private async sendNotifications(customer: any, lead: WhatConvertsLead): Promise<void> {
    try {
      // Atanan kullanıcıya bildirim
      if (customer.relevantUser) {
        await this.notificationService.createForUser(
          customer.relevantUser,
          `🆕 Yeni lead geldi: ${customer.name || 'Müşteri'} - ${lead.lead_type} (${lead.lead_source || 'Bilinmiyor'})`,
        );
      }

      // Admin'lere bildirim (opsiyonel)
      // await this.notificationService.createForAdmins(...);

    } catch (error) {
      this.logger.error(`Error sending notification: ${error.message}`);
    }
  }

  /**
   * Log kaydet
   */
  private async saveLog(log: WhatConvertsLog, startTime: number): Promise<void> {
    log.processingTimeMs = Date.now() - startTime;
    await this.logRepository.save(log);
  }

  /**
   * Response oluştur
   */
  private createResponse(
    success: boolean,
    message: string,
    leadId: number,
    action: 'created' | 'updated' | 'skipped' | 'error',
    customerId?: number,
  ): WebhookResponseDto {
    return {
      success,
      message,
      leadId,
      customerId,
      action,
      timestamp: new Date(),
    };
  }

  /**
   * Log listele (admin panel için)
   */
  async getLogs(query: {
    page?: number;
    limit?: number;
    status?: string;
    leadType?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const qb = this.logRepository.createQueryBuilder('log')
      .leftJoinAndSelect('log.customer', 'customer')
      .orderBy('log.createdAt', 'DESC');

    if (query.status) {
      qb.andWhere('log.status = :status', { status: query.status });
    }

    if (query.leadType) {
      qb.andWhere('log.leadType = :leadType', { leadType: query.leadType });
    }

    if (query.startDate) {
      qb.andWhere('log.createdAt >= :startDate', { startDate: new Date(query.startDate) });
    }

    if (query.endDate) {
      qb.andWhere('log.createdAt <= :endDate', { endDate: new Date(query.endDate) });
    }

    const [logs, total] = await qb
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data: logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * İstatistikler (dashboard için)
   */
  async getStats(days: number = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await this.logRepository
      .createQueryBuilder('log')
      .select('log.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('log.createdAt >= :startDate', { startDate })
      .groupBy('log.status')
      .getRawMany();

    const byType = await this.logRepository
      .createQueryBuilder('log')
      .select('log.leadType', 'leadType')
      .addSelect('COUNT(*)', 'count')
      .where('log.createdAt >= :startDate', { startDate })
      .groupBy('log.leadType')
      .getRawMany();

    const bySource = await this.logRepository
      .createQueryBuilder('log')
      .select('log.leadSource', 'source')
      .addSelect('COUNT(*)', 'count')
      .where('log.createdAt >= :startDate', { startDate })
      .andWhere('log.leadSource IS NOT NULL')
      .groupBy('log.leadSource')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    const total = await this.logRepository
      .createQueryBuilder('log')
      .where('log.createdAt >= :startDate', { startDate })
      .getCount();

    return {
      period: `${days} days`,
      total,
      byStatus: stats,
      byType,
      bySource,
    };
  }

  /**
   * Lead'i yeniden işle (retry)
   */
  async retryLead(logId: number): Promise<WebhookResponseDto> {
    const log = await this.logRepository.findOne({
      where: { id: logId },
    });

    if (!log) {
      throw new BadRequestException('Log not found');
    }

    if (!log.rawPayload) {
      throw new BadRequestException('Raw payload not available for retry');
    }

    log.retryCount += 1;
    await this.logRepository.save(log);

    return this.processWebhook(log.rawPayload, log.webhookIp);
  }
}