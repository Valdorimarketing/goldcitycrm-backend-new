import {
  SOURCE_PATTERNS,
  GOOGLE_FORM_FIELDS,
  PARSING_PATTERNS,
  GMAIL_DEFAULTS,
} from '../constants/gmail.constants';

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { google } from 'googleapis';

// Entities
import { GmailLog, WebhookLogStatus } from '../entities/gmail-log.entity';
import { Customer } from '../../customer/entities/customer.entity';

// DTOs
import {
  GmailWebhookResponseDto,
  GmailMappingConfigDto,
  GmailWatchSetupDto,
} from '../dto/gmail-webhook.dto';

// Interfaces
import {
  PubSubMessage,
  GmailWatchNotification,
  GmailMessage,
  ParsedEmailData,
  GmailMappingConfig,
  CustomerCreationResult,
} from '../interfaces/gmail.interface';

// Services
import { CustomerService } from '../../customer/services/customer.service';
import { CreateCustomerDto } from '../../customer/dto/create-customer.dto';
import { NotificationService } from '../../notification/services/notification.service';

@Injectable()
export class GmailService {
  private readonly logger = new Logger(GmailService.name);
  private gmail: any;
  private oauth2Client: any;

  // Varsayılan mapping config
  private mappingConfig: GmailMappingConfig = {
    defaultStatusId: 1,
    defaultSourceId: 10,
    defaultUserId: undefined,
    autoAssign: false,
    skipDuplicates: true,
    skipInternal: true,
    internalDomains: [],
    processOnlyLabels: undefined,
    excludeLabels: ['SPAM', 'TRASH'],
  };

  constructor(
    @InjectRepository(GmailLog)
    private readonly gmailLogRepository: Repository<GmailLog>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    private readonly customerService: CustomerService,
    private readonly notificationService: NotificationService,
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: ConfigService,
  ) {
    this.initializeGmailClient();
    this.loadMappingConfig();
  }

  private initializeGmailClient(): void {
    try {
      const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
      const clientSecret = this.configService.get<string>(
        'GOOGLE_CLIENT_SECRET',
      );
      const redirectUri = this.configService.get<string>('GOOGLE_REDIRECT_URI');
      const refreshToken = this.configService.get<string>(
        'GOOGLE_REFRESH_TOKEN',
      );

      if (!clientId || !clientSecret || !refreshToken) {
        this.logger.warn(
          '⚠️ Gmail credentials not found in environment variables',
        );
        return;
      }

      this.oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        redirectUri,
      );

      this.oauth2Client.setCredentials({
        refresh_token: refreshToken,
      });

      this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

      this.logger.log('✅ Gmail API client initialized successfully');
    } catch (error) {
      this.logger.error(
        `❌ Failed to initialize Gmail client: ${error.message}`,
        error.stack,
      );
    }
  }

  private loadMappingConfig(): void {
    const statusId = this.configService.get<number>('GMAIL_DEFAULT_STATUS_ID');
    const sourceId = this.configService.get<number>('GMAIL_DEFAULT_SOURCE_ID');
    const userId = this.configService.get<number>('GMAIL_DEFAULT_USER_ID');
    const autoAssign = this.configService.get<string>('GMAIL_AUTO_ASSIGN');
    const skipDuplicates = this.configService.get<string>(
      'GMAIL_SKIP_DUPLICATES',
    );
    const skipInternal = this.configService.get<string>('GMAIL_SKIP_INTERNAL');
    const internalDomains = this.configService.get<string>(
      'GMAIL_INTERNAL_DOMAINS',
    );

    if (statusId) this.mappingConfig.defaultStatusId = statusId;
    if (sourceId) this.mappingConfig.defaultSourceId = sourceId;
    if (userId) this.mappingConfig.defaultUserId = userId;
    if (autoAssign !== undefined)
      this.mappingConfig.autoAssign = autoAssign === 'true';
    if (skipDuplicates !== undefined)
      this.mappingConfig.skipDuplicates = skipDuplicates === 'true';
    if (skipInternal !== undefined)
      this.mappingConfig.skipInternal = skipInternal === 'true';
    if (internalDomains) {
      this.mappingConfig.internalDomains = internalDomains
        .split(',')
        .map((d) => d.trim());
    }

    this.logger.log(
      `Gmail mapping config loaded: ${JSON.stringify(this.mappingConfig)}`,
    );
  }

  async updateMappingConfig(
    config: GmailMappingConfigDto,
  ): Promise<GmailMappingConfig> {
    this.mappingConfig = {
      ...this.mappingConfig,
      ...config,
    };
    this.logger.log(
      `Gmail mapping config updated: ${JSON.stringify(this.mappingConfig)}`,
    );
    return this.mappingConfig;
  }

  getMappingConfig(): GmailMappingConfig {
    return this.mappingConfig;
  }

  async processWebhook(
    payload: PubSubMessage,
    webhookIp?: string,
  ): Promise<GmailWebhookResponseDto> {
    const startTime = Date.now();

    try {
      const notification = this.decodePubSubMessage(payload);

      if (!notification || !notification.historyId) {
        this.logger.error('Invalid Pub/Sub payload: missing historyId');
        throw new BadRequestException('Invalid Pub/Sub payload');
      }

      this.logger.log(
        `📥 Processing Gmail notification - historyId: ${notification.historyId}`,
      );

      const newMessages = await this.fetchNewMessages(notification.historyId);

      if (!newMessages || newMessages.length === 0) {
        this.logger.log('No new messages to process');
        return this.createResponse(
          true,
          'No new messages',
          undefined,
          'skipped',
        );
      }

      this.logger.log(`📧 Found ${newMessages.length} new message(s)`);

      const results: GmailWebhookResponseDto[] = [];

      for (const message of newMessages) {
        const result = await this.processMessage(
          message,
          payload,
          webhookIp,
          startTime,
        );
        results.push(result);
      }

      const successCount = results.filter((r) => r.success).length;
      return this.createResponse(
        true,
        `Processed ${successCount}/${results.length} messages successfully`,
        undefined,
        'created',
      );
    } catch (error) {
      this.logger.error(
        `❌ Error processing webhook: ${error.message}`,
        error.stack,
      );
      return this.createResponse(false, error.message, undefined, 'error');
    }
  }

  private async processMessage(
    message: GmailMessage,
    pubsubPayload: PubSubMessage,
    webhookIp: string,
    startTime: number,
  ): Promise<GmailWebhookResponseDto> {
    const log = new GmailLog({
      messageId: message.id,
      threadId: message.threadId,
      historyId: message.historyId,
      rawPubsubPayload: pubsubPayload,
      rawGmailData: message,
      webhookIp,
      labels: message.labelIds || [],
      status: WebhookLogStatus.PROCESSING,
    });

    try {
      const parsedEmail = await this.parseEmailMessage(message);

      log.fromEmail = parsedEmail.from.email;
      log.fromName = parsedEmail.from.name;
      log.toEmail = parsedEmail.to.join(', ');
      log.subject = parsedEmail.subject;
      log.snippet = parsedEmail.snippet;
      log.body = parsedEmail.body.text || parsedEmail.body.html;
      log.emailDate = parsedEmail.date;
      log.hasAttachments = parsedEmail.hasAttachments;
      log.attachmentCount = parsedEmail.attachmentCount;

      if (this.shouldExcludeMessage(parsedEmail)) {
        log.status = WebhookLogStatus.SKIPPED;
        log.message = `Message skipped due to excluded labels: ${parsedEmail.labels.join(', ')}`;
        await this.saveLog(log, startTime);

        return this.createResponse(
          false,
          'Message excluded',
          message.id,
          'skipped',
        );
      }

      if (
        this.mappingConfig.skipInternal &&
        this.isInternalEmail(parsedEmail.from.email)
      ) {
        log.status = WebhookLogStatus.SKIPPED;
        log.message = `Internal email skipped: ${parsedEmail.from.email}`;
        await this.saveLog(log, startTime);

        return this.createResponse(
          false,
          'Internal email skipped',
          message.id,
          'skipped',
        );
      }

      // Body'den lead bilgilerini parse et
      const leadData =
        this.parseStructuredLeadData(parsedEmail.body.text) ||
        this.parseGoogleFormSubmission(parsedEmail.body.text);

      // Duplicate kontrolü için email belirle
      let emailToCheck = parsedEmail.from.email;

      if (leadData?.email) {
        emailToCheck = leadData.email;
        this.logger.log(
          `📧 Using lead email for duplicate check: ${emailToCheck}`,
        );
      } else {
        this.logger.log(
          `📧 Using sender email for duplicate check: ${emailToCheck}`,
        );
      }

      if (this.mappingConfig.skipDuplicates) {
        const existingCustomer = await this.customerRepository.findOne({
          where: { email: emailToCheck },
        });

        if (existingCustomer) {
          log.status = WebhookLogStatus.DUPLICATE;
          log.customerId = existingCustomer.id;
          log.message = `Customer already exists with email: ${emailToCheck}`;
          await this.saveLog(log, startTime);

          await this.addNoteToExistingCustomer(
            existingCustomer.id,
            parsedEmail,
          );

          return this.createResponse(
            true,
            'Existing customer found, note added',
            message.id,
            'updated',
            existingCustomer.id,
          );
        }
      }

      const customerDto = this.mapEmailToCustomer(parsedEmail);

      const customer = await this.customerService.createCustomer(customerDto);

      log.status = WebhookLogStatus.SUCCESS;
      log.customerId = customer.id;
      log.message = `Customer created successfully with ID: ${customer.id}`;
      await this.saveLog(log, startTime);

      await this.sendNotifications(customer, parsedEmail);

      this.eventEmitter.emit('gmail.lead.created', {
        customerId: customer.id,
        messageId: message.id,
        from: parsedEmail.from.email,
        subject: parsedEmail.subject,
      });

      this.logger.log(
        `✅ Email ${message.id} -> Customer ${customer.id} created`,
      );

      return this.createResponse(
        true,
        'Customer created successfully',
        message.id,
        'created',
        customer.id,
      );
    } catch (error) {
      this.logger.error(
        `❌ Error processing message ${message.id}: ${error.message}`,
        error.stack,
      );

      log.status = WebhookLogStatus.ERROR;
      log.message = 'Error processing email';
      log.errorDetail = error.message;
      await this.saveLog(log, startTime);

      return this.createResponse(false, error.message, message.id, 'error');
    }
  }

  private detectSourceFromSubject(subject: string): number {
    const subjectLower = subject.toLowerCase();

    for (const [sourceKey, config] of Object.entries(SOURCE_PATTERNS)) {
      const hasMatch = config.patterns.some((pattern) =>
        subjectLower.includes(pattern.toLowerCase()),
      );

      if (hasMatch) {
        const sourceId = this.configService.get<number>(config.sourceIdEnv);

        if (sourceId) {
          this.logger.log(`📍 Source detected: ${sourceKey} (ID: ${sourceId})`);
          return sourceId;
        }
      }
    }

    const defaultSourceId = this.configService.get<number>(
      'GMAIL_DEFAULT_SOURCE_ID',
      GMAIL_DEFAULTS.defaultSourceId,
    );

    this.logger.log(`📧 Source: Direct Gmail (ID: ${defaultSourceId})`);
    return defaultSourceId;
  }

  private parseGoogleFormSubmission(bodyText: string): {
    name: string;
    surname: string;
    phone: string;
    email: string;
  } | null {
    try {
      const lines = bodyText
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      const data: any = {};

      for (const line of lines) {
        const colonIndex = line.indexOf(':');
        if (colonIndex === -1) continue;

        const key = line.substring(0, colonIndex).trim().toLowerCase();
        const value = line.substring(colonIndex + 1).trim();

        if (!value || value === '-' || value === 'Not Specified') continue;

        data[key] = value;
      }

      let fullName = '';
      let email = '';
      let phone = '';

      for (const fieldName of GOOGLE_FORM_FIELDS.name) {
        if (data[fieldName]) {
          fullName = data[fieldName];
          break;
        }
      }

      for (const fieldName of GOOGLE_FORM_FIELDS.email) {
        if (data[fieldName]) {
          email = data[fieldName];
          break;
        }
      }

      for (const fieldName of GOOGLE_FORM_FIELDS.phone) {
        if (data[fieldName]) {
          phone = data[fieldName];
          break;
        }
      }

      const nameParts = fullName.split(/\s+/);
      const firstName = nameParts[0] || 'Lead';
      const lastName = nameParts.slice(1).join(' ') || '';

      if (!email && !fullName) {
        return null;
      }

      return {
        name: firstName,
        surname: lastName,
        phone: phone ? this.normalizePhone(phone) : undefined,
        email: email || undefined,
      };
    } catch (error) {
      this.logger.error(`Error parsing Google Form: ${error.message}`);
      return null;
    }
  }

  private mapEmailToCustomer(email: ParsedEmailData): CreateCustomerDto {
    let structuredData = null;

    if (email.subject.toLowerCase().includes('form submission')) {
      structuredData = this.parseGoogleFormSubmission(email.body.text);
      if (structuredData) {
        this.logger.log('📝 Parsed Google Form submission');
      }
    }

    if (!structuredData) {
      structuredData = this.parseStructuredLeadData(email.body.text);
      if (structuredData) {
        this.logger.log('📝 Parsed structured lead data');
      }
    }

    let firstName: string;
    let lastName: string;
    let phone: string;
    let customerEmail: string;

    if (structuredData) {
      firstName = structuredData.name;
      lastName = structuredData.surname;
      phone = structuredData.phone;
      customerEmail = structuredData.email || email.from.email;
    } else {
      this.logger.log('📧 Using classic parsing');
      const nameParts = email.from.name.split(' ');
      firstName = nameParts[0] || 'Unknown';
      lastName = nameParts.slice(1).join(' ') || '';
      const phoneMatch = email.body.text.match(
        /(?:\+?\d{1,4})?[\s\-\.]?(?:\(?\d{1,4}\)?)?[\s\-\.]?\d{1,4}[\s\-\.]?\d{1,4}[\s\-\.]?\d{1,9}/,
      );
      phone = phoneMatch ? this.normalizePhone(phoneMatch[0]) : undefined;
      customerEmail = email.from.email;
    }

    const detectedSourceId = this.detectSourceFromSubject(email.subject);

    return {
      name: firstName,
      surname: lastName,
      email: customerEmail,
      phone,
      status: this.mappingConfig.defaultStatusId,
      sourceId: detectedSourceId,
      relevantUser: this.mappingConfig.autoAssign
        ? this.mappingConfig.defaultUserId
        : undefined,
      description: this.buildEmailDescription(email, structuredData),
    };
  }

  private normalizePhone(phone: string): string {
    if (!phone) return undefined;

    let cleaned = phone.replace(/\D/g, '');

    if (
      cleaned.length < GMAIL_DEFAULTS.minPhoneLength ||
      cleaned.length > GMAIL_DEFAULTS.maxPhoneLength
    ) {
      return undefined;
    }

    if (!phone.startsWith('+')) {
      if (cleaned.startsWith('0') && cleaned.length === 11) {
        cleaned = '90' + cleaned.substring(1);
      } else if (cleaned.length === 10) {
        cleaned = '90' + cleaned;
      }
      return '+' + cleaned;
    }

    return phone;
  }

  private decodePubSubMessage(payload: PubSubMessage): GmailWatchNotification {
    try {
      const data = Buffer.from(payload.message.data, 'base64').toString(
        'utf-8',
      );
      return JSON.parse(data);
    } catch (error) {
      this.logger.error(`Error decoding Pub/Sub message: ${error.message}`);
      return null;
    }
  }

  private async fetchNewMessages(historyId: string): Promise<GmailMessage[]> {
    try {
      this.logger.log(`🔍 Fetching history from historyId: ${historyId}`);

      // 1️⃣ Önce History API'yi dene
      const response = await this.gmail.users.history.list({
        userId: 'me',
        startHistoryId: historyId,
        historyTypes: ['messageAdded'],
        maxResults: 100,
      });

      const messageIds: string[] = [];

      if (response.data.history && response.data.history.length > 0) {
        // History'den mesaj ID'lerini çıkar
        response.data.history.forEach((historyItem: any) => {
          if (historyItem.messagesAdded) {
            historyItem.messagesAdded.forEach((item: any) => {
              messageIds.push(item.message.id);
            });
          }
        });

        this.logger.log(
          `📧 Found ${messageIds.length} messages from History API`,
        );
      }

      // 2️⃣ History API'de mesaj yoksa, direkt son mesajları kontrol et
      if (messageIds.length === 0) {
        this.logger.warn(
          `⚠️ No messages in History API, checking recent messages...`,
        );

        const recentMessages = await this.getRecentUnprocessedMessages();

        if (recentMessages.length > 0) {
          this.logger.log(
            `📧 Found ${recentMessages.length} recent unprocessed messages`,
          );
          return recentMessages;
        }

        return [];
      }

      // 3️⃣ Mesaj detaylarını al
      const messages: GmailMessage[] = [];
      for (const messageId of messageIds) {
        const message = await this.gmail.users.messages.get({
          userId: 'me',
          id: messageId,
          format: 'full',
        });
        messages.push(message.data);
      }

      return messages;
    } catch (error) {
      this.logger.error(
        `❌ Error fetching new messages: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }

  /**
   * ✅ YENİ: Son mesajları al ve daha önce işlenmemişleri bul
   */
  private async getRecentUnprocessedMessages(): Promise<GmailMessage[]> {
    try {
      // Son 10 mesajı al
      const listResponse = await this.gmail.users.messages.list({
        userId: 'me',
        maxResults: 10,
        labelIds: ['INBOX'],
      });

      if (
        !listResponse.data.messages ||
        listResponse.data.messages.length === 0
      ) {
        return [];
      }

      const messages: GmailMessage[] = [];

      for (const msg of listResponse.data.messages) {
        // Bu mesaj daha önce işlendi mi kontrol et
        const existingLog = await this.gmailLogRepository.findOne({
          where: { messageId: msg.id },
        });

        if (existingLog) {
          this.logger.debug(`⏭️ Message ${msg.id} already processed, skipping`);
          continue;
        }

        // İşlenmemiş mesajı al
        const message = await this.gmail.users.messages.get({
          userId: 'me',
          id: msg.id,
          format: 'full',
        });

        messages.push(message.data);
        this.logger.log(`✅ Found unprocessed message: ${msg.id}`);
      }

      return messages;
    } catch (error) {
      this.logger.error(
        `Error getting recent unprocessed messages: ${error.message}`,
      );
      return [];
    }
  }

  /**
   * ✅ YENİ: Son mesajları direkt çek (History API çalışmazsa)
   */
  private async fetchLatestMessages(): Promise<GmailMessage[]> {
    try {
      this.logger.log('📬 Falling back to latest messages fetch');

      const response = await this.gmail.users.messages.list({
        userId: 'me',
        maxResults: 5,
        labelIds: ['INBOX'],
        q: 'is:unread', // Sadece okunmamış
      });

      if (!response.data.messages || response.data.messages.length === 0) {
        this.logger.log('📭 No unread messages in INBOX');
        return [];
      }

      this.logger.log(
        `📧 Found ${response.data.messages.length} unread message(s)`,
      );

      const messages: GmailMessage[] = [];
      for (const msg of response.data.messages) {
        const message = await this.gmail.users.messages.get({
          userId: 'me',
          id: msg.id,
          format: 'full',
        });
        messages.push(message.data);
      }

      return messages;
    } catch (error) {
      this.logger.error(`Error fetching latest messages: ${error.message}`);
      return [];
    }
  }

  private async parseEmailMessage(
    message: GmailMessage,
  ): Promise<ParsedEmailData> {
    const headers = message.payload.headers || [];

    const getHeader = (name: string): string => {
      const header = headers.find(
        (h) => h.name.toLowerCase() === name.toLowerCase(),
      );
      return header ? header.value : '';
    };

    const fromHeader = getHeader('From');
    const fromMatch =
      fromHeader.match(/^(.+?)\s*<([^>]+)>$/) || fromHeader.match(/^([^<]+)$/);
    const fromName = fromMatch ? fromMatch[1].trim().replace(/"/g, '') : '';
    const fromEmail =
      fromMatch && fromMatch[2] ? fromMatch[2].trim() : fromHeader.trim();

    const toHeader = getHeader('To');
    const toEmails = toHeader.split(',').map((email) => {
      const match = email.match(/<([^>]+)>/);
      return match ? match[1].trim() : email.trim();
    });

    const body = this.extractEmailBody(message.payload);

    const hasAttachments = this.checkHasAttachments(message.payload);
    const attachmentCount = this.countAttachments(message.payload);

    return {
      messageId: message.id,
      threadId: message.threadId,
      historyId: message.historyId,
      from: {
        name: fromName,
        email: fromEmail,
      },
      to: toEmails,
      subject: getHeader('Subject'),
      snippet: message.snippet || '',
      body: {
        text: body.text,
        html: body.html,
      },
      date: new Date(parseInt(message.internalDate)),
      labels: message.labelIds || [],
      hasAttachments,
      attachmentCount,
    };
  }

  private extractEmailBody(payload: any): { text: string; html: string } {
    let text = '';
    let html = '';

    const extractFromPart = (part: any) => {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        text = Buffer.from(part.body.data, 'base64').toString('utf-8');
      } else if (part.mimeType === 'text/html' && part.body?.data) {
        html = Buffer.from(part.body.data, 'base64').toString('utf-8');
      }

      if (part.parts) {
        part.parts.forEach(extractFromPart);
      }
    };

    if (payload.body?.data) {
      text = Buffer.from(payload.body.data, 'base64').toString('utf-8');
    }

    if (payload.parts) {
      payload.parts.forEach(extractFromPart);
    }

    return { text, html };
  }

  private checkHasAttachments(payload: any): boolean {
    const checkPart = (part: any): boolean => {
      if (part.filename && part.filename.length > 0) {
        return true;
      }
      if (part.parts) {
        return part.parts.some(checkPart);
      }
      return false;
    };

    return checkPart(payload);
  }

  private countAttachments(payload: any): number {
    let count = 0;

    const countPart = (part: any) => {
      if (part.filename && part.filename.length > 0) {
        count++;
      }
      if (part.parts) {
        part.parts.forEach(countPart);
      }
    };

    countPart(payload);
    return count;
  }

  private shouldExcludeMessage(email: ParsedEmailData): boolean {
    if (
      !this.mappingConfig.excludeLabels ||
      this.mappingConfig.excludeLabels.length === 0
    ) {
      return false;
    }

    return email.labels.some((label) =>
      this.mappingConfig.excludeLabels.includes(label),
    );
  }

  private isInternalEmail(email: string): boolean {
    if (
      !this.mappingConfig.internalDomains ||
      this.mappingConfig.internalDomains.length === 0
    ) {
      return false;
    }

    const domain = email.split('@')[1]?.toLowerCase();
    return this.mappingConfig.internalDomains.some(
      (d) => domain === d.toLowerCase(),
    );
  }

  private parseStructuredLeadData(bodyText: string): {
    name: string;
    surname: string;
    phone: string;
    email: string;
  } | null {
    try {
      const lines = bodyText
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      if (lines.length < 2) {
        return null;
      }

      let fullName = '';
      let phone = '';
      let email = '';

      for (const line of lines) {
        if (PARSING_PATTERNS.email.test(line)) {
          email = line;
          continue;
        }

        if (PARSING_PATTERNS.phone.test(line)) {
          phone = this.normalizePhone(line);
          continue;
        }

        if (!fullName && line.length > 2 && PARSING_PATTERNS.name.test(line)) {
          fullName = line;
        }
      }

      if (!fullName && !email) {
        return null;
      }

      const nameParts = fullName.split(/\s+/);
      const firstName = nameParts[0] || 'Lead';
      const lastName = nameParts.slice(1).join(' ') || '';

      return {
        name: firstName,
        surname: lastName,
        phone: phone || undefined,
        email: email || undefined,
      };
    } catch (error) {
      this.logger.error(`Error parsing structured lead data: ${error.message}`);
      return null;
    }
  }

  private buildEmailDescription(
    email: ParsedEmailData,
    structuredData?: any,
  ): string {
    const lines: string[] = [];

    lines.push(`📧 Gmail Lead - ${new Date().toLocaleString('tr-TR')}`);
    lines.push('---');

    if (structuredData) {
      lines.push(`👤 Lead Bilgileri:`);
      lines.push(`   İsim: ${structuredData.name} ${structuredData.surname}`);
      if (structuredData.phone) {
        lines.push(`   Telefon: ${structuredData.phone}`);
      }
      if (structuredData.email) {
        lines.push(`   Email: ${structuredData.email}`);
      }
      lines.push('');
    }

    lines.push(`📬 Email Konusu: ${email.subject}`);
    lines.push(`📅 Tarih: ${email.date.toLocaleString('tr-TR')}`);
    lines.push(`📨 Gönderen: ${email.from.name} <${email.from.email}>`);

    if (email.labels && email.labels.length > 0) {
      lines.push(`🏷️ Etiketler: ${email.labels.join(', ')}`);
    }

    if (email.hasAttachments) {
      lines.push(`📎 ${email.attachmentCount} adet dosya eki var`);
    }

    lines.push('');
    lines.push('💬 Email İçeriği:');
    lines.push(email.snippet || email.body.text.substring(0, 500));

    const fullDescription = lines.join('\n');

    if (fullDescription.length > GMAIL_DEFAULTS.maxDescriptionLength) {
      return (
        fullDescription.substring(0, GMAIL_DEFAULTS.maxDescriptionLength - 3) +
        '...'
      );
    }

    return fullDescription;
  }

  private async addNoteToExistingCustomer(
    customerId: number,
    email: ParsedEmailData,
  ): Promise<void> {
    try {
      const customer = await this.customerRepository.findOne({
        where: { id: customerId },
      });

      if (customer) {
        const newNote = `\n\n---\n${this.buildEmailDescription(email)}`;
        customer.description = (customer.description || '') + newNote;
        await this.customerRepository.save(customer);
      }
    } catch (error) {
      this.logger.error(
        `Error adding note to customer ${customerId}: ${error.message}`,
      );
    }
  }

  private async sendNotifications(
    customer: any,
    email: ParsedEmailData,
  ): Promise<void> {
    try {
      if (customer.relevantUser) {
        await this.notificationService.createForUser(
          customer.relevantUser,
          `📧 Yeni Gmail lead: ${customer.name} - ${email.subject}`,
        );
      }
    } catch (error) {
      this.logger.error(`Error sending notification: ${error.message}`);
    }
  }

  private async saveLog(log: GmailLog, startTime: number): Promise<void> {
    log.processingTimeMs = Date.now() - startTime;
    await this.gmailLogRepository.save(log);
  }

  private createResponse(
    success: boolean,
    message: string,
    messageId?: string,
    action?: 'created' | 'updated' | 'skipped' | 'error',
    customerId?: number,
  ): GmailWebhookResponseDto {
    return {
      success,
      message,
      messageId,
      customerId,
      action,
      timestamp: new Date(),
    };
  }

  async setupGmailWatch(setupDto: GmailWatchSetupDto): Promise<any> {
    try {
      const response = await this.gmail.users.watch({
        userId: 'me',
        requestBody: {
          topicName: setupDto.topicName,
          labelIds: setupDto.labelIds || ['INBOX'],
          labelFilterAction: setupDto.labelFilterAction || 'include',
        },
      });

      this.logger.log(
        `✅ Gmail watch setup successful - Expires: ${response.data.expiration}`,
      );
      return response.data;
    } catch (error) {
      this.logger.error(
        `❌ Error setting up Gmail watch: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async stopGmailWatch(): Promise<void> {
    try {
      await this.gmail.users.stop({
        userId: 'me',
      });

      this.logger.log('✅ Gmail watch stopped successfully');
    } catch (error) {
      this.logger.error(
        `❌ Error stopping Gmail watch: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getLogs(query: {
    page?: number;
    limit?: number;
    status?: string;
    fromEmail?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const qb = this.gmailLogRepository
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.customer', 'customer')
      .orderBy('log.createdAt', 'DESC');

    if (query.status) {
      qb.andWhere('log.status = :status', { status: query.status });
    }

    if (query.fromEmail) {
      qb.andWhere('log.fromEmail LIKE :email', {
        email: `%${query.fromEmail}%`,
      });
    }

    if (query.startDate) {
      qb.andWhere('log.createdAt >= :startDate', {
        startDate: new Date(query.startDate),
      });
    }

    if (query.endDate) {
      qb.andWhere('log.createdAt <= :endDate', {
        endDate: new Date(query.endDate),
      });
    }

    const [logs, total] = await qb.skip(skip).take(limit).getManyAndCount();

    return {
      data: logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getStats(days: number = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await this.gmailLogRepository
      .createQueryBuilder('log')
      .select('log.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('log.createdAt >= :startDate', { startDate })
      .groupBy('log.status')
      .getRawMany();

    const total = await this.gmailLogRepository
      .createQueryBuilder('log')
      .where('log.createdAt >= :startDate', { startDate })
      .getCount();

    const topSenders = await this.gmailLogRepository
      .createQueryBuilder('log')
      .select('log.fromEmail', 'email')
      .addSelect('COUNT(*)', 'count')
      .where('log.createdAt >= :startDate', { startDate })
      .andWhere('log.fromEmail IS NOT NULL')
      .groupBy('log.fromEmail')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    return {
      period: `${days} days`,
      total,
      byStatus: stats,
      topSenders,
    };
  }

  async retryLead(logId: number): Promise<GmailWebhookResponseDto> {
    const log = await this.gmailLogRepository.findOne({
      where: { id: logId },
    });

    if (!log) {
      throw new BadRequestException('Log not found');
    }

    if (!log.rawPubsubPayload || !log.rawGmailData) {
      throw new BadRequestException('Raw payload not available for retry');
    }

    log.retryCount += 1;
    await this.gmailLogRepository.save(log);

    const startTime = Date.now();
    return this.processMessage(
      log.rawGmailData as any,
      log.rawPubsubPayload as any,
      log.webhookIp,
      startTime,
    );
  }
}
