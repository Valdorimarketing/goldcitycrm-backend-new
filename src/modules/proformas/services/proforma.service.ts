import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Proforma } from '../entities/proforma.entity';
import { CreateProformaDto } from '../dto/create.proforma.dto';
import { UpdateProformaDto } from '../dto/update.proforma.dto';
import * as fs from 'fs';
import * as path from 'path';
import { User } from 'src/modules/user/entities/user.entity';

@Injectable()
export class ProformaService {
  constructor(
    @InjectRepository(Proforma)
    private readonly proformaRepository: Repository<Proforma>,

    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) { }

  /**
   * Generate unique proforma number
   */
  private async generateProformaNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const lastProforma = await this.proformaRepository
      .createQueryBuilder('proforma')
      .where('proforma.proforma_number LIKE :year', { year: `PRF-${year}-%` })
      .orderBy('proforma.id', 'DESC')
      .getOne();

    let sequence = 1;
    if (lastProforma) {
      const lastNumber = lastProforma.proformaNumber.split('-').pop();
      sequence = parseInt(lastNumber) + 1;
    }

    return `PRF-${year}-${sequence.toString().padStart(4, '0')}`;
  }

  /**
   * Create new proforma
   */
  async create(createProformaDto: CreateProformaDto, userId: number): Promise<Proforma> {
    const proformaNumber = await this.generateProformaNumber();

    // ✅ Estimated Cost'ları topla ve Grand Total'ı hesapla
    let calculatedGrandTotal = 0;
    if (createProformaDto.treatmentItems && createProformaDto.treatmentItems.length > 0) {
      calculatedGrandTotal = createProformaDto.treatmentItems.reduce((sum, item) => {
        // Örnek: "24.000 USD" veya "24000" formatını parse et
        const cost = this.parseEstimatedCost(item.estimatedCost);
        return sum + cost;
      }, 0);
    }

    // ✅ Eğer manuel grand total girilmişse onu kullan, yoksa hesaplanan değeri kullan
    const finalGrandTotal = createProformaDto.grandTotal || calculatedGrandTotal;

    const proforma = this.proformaRepository.create({
      ...createProformaDto,
      proformaNumber,
      grandTotal: finalGrandTotal,
      created_by: userId,
    });

    return await this.proformaRepository.save(proforma);
  }

  /**
   * ✅ Estimated Cost string'ini sayıya çevir
   * Örnek: "24.000 USD" -> 24000
   * Örnek: "24,000.50 EUR" -> 24000.5
   */
  private parseEstimatedCost(costString: string): number {
    if (!costString) return 0;

    // Sayı olmayan karakterleri temizle (para birimi, nokta, virgül)
    const cleaned = costString
      .replace(/[A-Z₺$€£]/gi, '') // Para birimi sembolleri
      .replace(/\./g, '') // Bin ayırıcı nokta
      .replace(/,/g, '.') // Virgülü noktaya çevir
      .trim();

    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }

  /**
   * ✅ İndirme izni kontrolü
   * - Admin ve doctor rolleri her zaman indirebilir
   * - User rolü sadece downloadApproved=true ise indirebilir
   * @param proforma - Kontrol edilecek proforma
   * @param userId - Kullanıcının ID'si
   * @returns boolean - İndirme izni var mı?
   */
  async canUserDownloadProforma(proforma: Proforma, userId: number): Promise<boolean> {
    if (!userId) return false;

    // User'ı ID ile database'den çek
    const user = await this.userRepository.findOne({
      where: { id: userId }
    });

    if (!user) return false;

    const userRole = user.role?.toLowerCase();


    // Admin ve doctor her zaman indirebilir
    if (userRole === 'admin' || userRole === 'doctor') {
      return true;
    }

    // User rolü için onay kontrolü
    if (userRole === 'user') {
      return proforma.downloadApproved === true;
    }

    return false;
  }

  /**
   * ✅ İndirme onayı ver (sadece admin ve doctor yapabilir)
   */
  async approveDownload(id: number, approverId: number): Promise<Proforma> {
    const proforma = await this.findOne(id);

    proforma.downloadApproved = true;
    proforma.approvedBy = approverId;
    proforma.approvedAt = new Date();

    return await this.proformaRepository.save(proforma);
  }

  /**
   * ✅ İndirme onayını iptal et
   */
  async revokeDownload(id: number): Promise<Proforma> {
    const proforma = await this.findOne(id);

    proforma.downloadApproved = false;
    proforma.approvedBy = null;
    proforma.approvedAt = null;

    return await this.proformaRepository.save(proforma);
  }

  /**
   * Generate HTML preview (for debugging)
   */
  async generateHTMLPreview(id: number): Promise<string> {
    const proforma = await this.findOne(id);
    return await this.generateHTML(proforma);
  }

  /**
   * Get all proformas with filters
   */



  // ============================================================
  // PROFORMA SERVICE GÜNCELLEMESI
  // ============================================================
  // Dosya: src/modules/proforma/services/proforma.service.ts
  // 
  // Aşağıdaki findAll metodunu mevcut proforma.service.ts dosyanızdaki
  // findAll metodunun yerine kopyalayın
  // ============================================================

  /**
   * Get all proformas with filters
   */
  async findAll(filters?: {
    status?: string;
    patientId?: number;
    saleId?: number;
    startDate?: Date;
    endDate?: Date;
    proformaNumber?: string;
    patientName?: string;
    createdBy?: string;
    minAmount?: number;
    maxAmount?: number;
    currency?: string;
    downloadApproved?: boolean;
  }): Promise<Proforma[]> {

    const query = this.proformaRepository
      .createQueryBuilder('proforma')
      .leftJoinAndSelect('proforma.createdBy', 'createdBy')
      .leftJoinAndSelect('proforma.approver', 'approver')
      .orderBy('proforma.createdAt', 'DESC');

    if (filters?.status) {
      query.andWhere('proforma.status = :status', { status: filters.status });
    }

    if (filters?.patientId) {
      query.andWhere('proforma.patient_id = :patientId', { patientId: filters.patientId });
    }

    if (filters?.saleId) {
      query.andWhere('proforma.sale_id = :saleId', { saleId: filters.saleId });
    }

    if (filters?.startDate) {
      query.andWhere('proforma.date >= :startDate', { startDate: filters.startDate });
    }

    if (filters?.endDate) {
      query.andWhere('proforma.date <= :endDate', { endDate: filters.endDate });
    }

    // ✅ Proforma numarasına göre filtreleme (LIKE ile kısmi eşleşme)
    if (filters?.proformaNumber) {
      query.andWhere('proforma.proforma_number LIKE :proformaNumber', {
        proformaNumber: `%${filters.proformaNumber}%`
      });
    }

    // ✅ Hasta adına göre filtreleme (LIKE ile kısmi eşleşme)
    if (filters?.patientName) {
      query.andWhere('proforma.patient_name LIKE :patientName', {
        patientName: `%${filters.patientName}%`
      });
    }

    // ✅ Oluşturan kişiye göre filtreleme (isim ile LIKE)
    if (filters?.createdBy) {
      query.andWhere('createdBy.name LIKE :createdBy', {
        createdBy: `%${filters.createdBy}%`
      });
    }

    // ✅ Minimum tutara göre filtreleme
    if (filters?.minAmount !== undefined && filters?.minAmount !== null) {
      query.andWhere('proforma.grand_total >= :minAmount', { minAmount: filters.minAmount });
    }

    // ✅ Maximum tutara göre filtreleme
    if (filters?.maxAmount !== undefined && filters?.maxAmount !== null) {
      query.andWhere('proforma.grand_total <= :maxAmount', { maxAmount: filters.maxAmount });
    }

    // ✅ Para birimine göre filtreleme
    if (filters?.currency) {
      query.andWhere('proforma.currency = :currency', { currency: filters.currency });
    }

    // ✅ İndirme onayına göre filtreleme
    if (filters?.downloadApproved !== undefined && filters?.downloadApproved !== null) {
      query.andWhere('proforma.download_approved = :downloadApproved', {
        downloadApproved: filters.downloadApproved
      });
    }

    return await query.orderBy('proforma.created_at', 'DESC').getMany();
  }

  /**
   * Get single proforma by ID
   */
  async findOne(id: number): Promise<Proforma> {
    const proforma = await this.proformaRepository.findOne({
      where: { id },
      relations: ['createdBy', 'approver'],
    });

    if (!proforma) {
      throw new NotFoundException(`Proforma with ID ${id} not found`);
    }

    return proforma;
  }

  /**
   * Get proforma by proforma number
   */
  async findByProformaNumber(proformaNumber: string): Promise<Proforma> {
    const proforma = await this.proformaRepository.findOne({
      where: { proformaNumber },
    });

    if (!proforma) {
      throw new NotFoundException(`Proforma ${proformaNumber} not found`);
    }

    return proforma;
  }

  /**
   * Update proforma
   */
  async update(id: number, updateProformaDto: UpdateProformaDto): Promise<Proforma> {
    const proforma = await this.findOne(id);

    // ✅ Eğer treatmentItems güncelleniyorsa, grand total'ı yeniden hesapla
    if (updateProformaDto.treatmentItems) {
      const calculatedGrandTotal = updateProformaDto.treatmentItems.reduce((sum, item) => {
        const cost = this.parseEstimatedCost(item.estimatedCost);
        return sum + cost;
      }, 0);

      // Manuel grand total girilmemişse hesaplanan değeri kullan
      if (!updateProformaDto.grandTotal) {
        updateProformaDto.grandTotal = calculatedGrandTotal;
      }
    }

    updateProformaDto.downloadApproved = false;

    Object.assign(proforma, updateProformaDto);

    return await this.proformaRepository.save(proforma);
  }

  /**
   * Delete proforma
   */
  async remove(id: number): Promise<void> {
    const proforma = await this.findOne(id);
    await this.proformaRepository.remove(proforma);
  }

  /**
   * Get proforma data from patient and sale
   */
  async getProformaDataFromSale(saleId: number): Promise<any> {
    return {
      patientId: null,
      patientName: null,
      hospital: 'Liv Hospital Vadistanbul',
      physicianName: null,
      physicianDepartment: null,
      age: null,
      country: null,
      comedNo: null,
      treatmentItems: [],
      grandTotal: 0,
      currency: 'USD',
      language: 'tr',
      bankName: 'DENİZ BANK',
      receiverName: 'Samsun Medikal Grup Özel Sağlık Hizmetleri A.Ş. Vadi Branch',
      branchName: 'AVRUPA KURUMSAL, Istanbul – Turkey',
      branchCode: '3390',
      bankCurrency: 'USD',
      iban: 'TR07 0013 4000 0033 4739 9000 78',
      swiftCode: 'DENITRIS',
    };
  }

  /**
   * Generate HTML for PDF - WITH LANGUAGE SUPPORT
   */

  /**
 * Generate HTML for PDF - WITH AGGRESSIVE PATH FINDING
 */



  private async generateHTML(proforma: Proforma): Promise<string> {
    let html: string;

    // ✅ Template seçimi - templateType'a göre
    let templateName: string;

    switch (proforma.templateType) {
      case 'medical-red':
        templateName = 'proforma-template-medical-red.html';
        break;
      case 'istinye-blue':
        templateName = 'proforma-template-istinye-blue.html';
        break;
      case 'liv-blue':
      default:
        templateName = 'proforma-template.html';
        break;
    }

    console.log(`🎨 Selected template: ${templateName} (Type: ${proforma.templateType})`);

    // 🔥 Path kombinasyonları - HER OLASI YER
    const basePaths = [
      process.cwd(),
      __dirname,
      path.join(__dirname, '..'),
      path.join(__dirname, '../..'),
      path.join(__dirname, '../../..'),
      path.join(__dirname, '../../../..'),
      '/app',
      '/usr/src/app',
    ];

    const templatePaths = [
      'templates',
      'src/templates',
      'dist/templates',
      'modules/proforma/templates',
      'src/modules/proforma/templates',
      'dist/modules/proforma/templates',
    ];

    const paths: string[] = [];

    // Tüm kombinasyonları oluştur
    for (const base of basePaths) {
      for (const template of templatePaths) {
        paths.push(path.join(base, template, templateName));
      }
      // Direkt base path'e de bak
      paths.push(path.join(base, templateName));
    }

    let templateFound = false;

    // Önce normal arama
    for (const templatePath of paths) {
      try {
        if (fs.existsSync(templatePath)) {
          html = fs.readFileSync(templatePath, 'utf-8');
          console.log('✅ Template found at:', templatePath);
          templateFound = true;
          break;
        }
      } catch (error) {
        // Sessizce devam et
        continue;
      }
    }

    // 🔥 Eğer hala bulunamadıysa, RECURSIVE SEARCH yap
    if (!templateFound) {
      console.log('⚠️ Standard paths failed, trying recursive search...');

      const searchDirs = [
        process.cwd(),
        '/app',
        '/usr/src/app',
      ];

      for (const searchDir of searchDirs) {
        if (!fs.existsSync(searchDir)) continue;

        const foundPath = this.recursiveSearch(searchDir, templateName, 5); // Max 5 level
        if (foundPath) {
          try {
            html = fs.readFileSync(foundPath, 'utf-8');
            console.log('✅ Template found via recursive search at:', foundPath);
            templateFound = true;
            break;
          } catch (error) {
            console.error('❌ Error reading found file:', error.message);
          }
        }
      }
    }

    // 🔥 HALA BULUNAMADIYSA, detaylı debug bilgisi ver
    if (!templateFound) {
      paths.slice(0, 20).forEach(p => console.error('  -', p));

      this.listDirectories(process.cwd(), 2);

      throw new Error(`Template file not found: ${templateName}. Searched ${paths.length} locations.`);
    }

    // ✅ Template'e göre farklı replacement stratejileri
    if (proforma.templateType === 'medical-red' || proforma.templateType === 'istinye-blue') {
      return this.fillNewStyleTemplate(html, proforma);
    } else {
      return this.fillLivBlueTemplate(html, proforma);
    }
  }



  /**
 * ✅ Liv Blue Template (mevcut) için replacement
 */

  /**
 * ✅ Liv Blue Template (mevcut) için replacement - PARAGRAF DÜZENLEME İLE
 */
  /**
   * ✅ Liv Blue Template (mevcut) için replacement - PARAGRAF DÜZENLEME VE BİN AYIRICI İLE
   */
  private fillLivBlueTemplate(html: string, proforma: Proforma): string {
    // Basic Info
    html = html.replace('{{PROFORMA_NUMBER}}', proforma.proformaNumber);
    html = html.replace('{{DATE}}', new Date(proforma.date).toLocaleDateString('en-US'));
    html = html.replace('{{CURRENCY}}', proforma.currency);

    // GENERAL INFORMATION
    html = html.replace(/{{PATIENT_NAME}}/g, this.escapeHtml(proforma.patientName || '-'));
    html = html.replace(/{{HOSPITAL}}/g, this.escapeHtml(proforma.hospital || 'Liv Hospital Vadistanbul'));
    html = html.replace('{{PHYSICIAN_NAME}}', this.escapeHtml(proforma.physicianName || '-'));
    html = html.replace('{{PHYSICIAN_DEPARTMENT}}', this.escapeHtml(proforma.physicianDepartment || '-'));
    html = html.replace('{{AGE}}', this.escapeHtml(proforma.age || '-'));
    html = html.replace('{{COUNTRY}}', this.escapeHtml(proforma.country || '-'));
    html = html.replace('{{COMED_NO}}', this.escapeHtml(proforma.comedNo || '-'));

    // Optional Fields
    const hasAdditionalInfo = proforma.additionalInfo && proforma.additionalInfo.trim().length > 0;
    html = html.replace('{{ADDITIONAL_INFO_DISPLAY}}', hasAdditionalInfo ? 'block' : 'none');
    html = html.replace('{{ADDITIONAL_INFO}}', this.escapeHtml(proforma.additionalInfo || ''));

    // ✅ PHYSICIAN'S OPINION - PARAGRAF DÜZENLEME İLE
    const hasPhysicianOpinion = proforma.physicianOpinion && proforma.physicianOpinion.trim().length > 0;
    html = html.replace('{{PHYSICIAN_OPINION_DISPLAY}}', hasPhysicianOpinion ? 'block' : 'none');

    if (hasPhysicianOpinion) {
      const formattedOpinion = this.formatPhysicianOpinion(proforma.physicianOpinion);
      html = html.replace('{{PHYSICIAN_OPINION}}', formattedOpinion);
    } else {
      html = html.replace('{{PHYSICIAN_OPINION}}', '');
    }

    // Treatment Items (Eski stil - visitType var, quantity yok)
    const treatmentRows = proforma.treatmentItems
      .map((item) => `
    <tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 10.5px;">${this.escapeHtml(item.procedure)}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 10.5px;">${this.escapeHtml(proforma.physicianDepartment || '-')}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 10.5px;">${this.escapeHtml(item.visitType || '-')}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align: center; font-size: 10.5px; min-width: 140px;">${this.escapeHtml(item.estimatedCost)}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 10.5px;">${this.escapeHtml(item.notes || '')}</td>
    </tr>
  `)
      .join('');
    html = html.replace('{{TREATMENT_ITEMS}}', treatmentRows);

    // ✅ Grand Total - BİN AYIRICI İLE
    const grandTotalValue = this.toNumber(proforma.grandTotal);
    html = html.replace('{{GRAND_TOTAL}}', `${this.formatCurrency(grandTotalValue, proforma.currency)} ${proforma.currency}`);

    // Services Included
    const hasServices = proforma.servicesIncluded && proforma.servicesIncluded.length > 0;
    html = html.replace('{{SERVICES_DISPLAY}}', hasServices ? 'block' : 'none');

    if (hasServices) {
      const servicesList = proforma.servicesIncluded
        .map((service) => `<li>${this.escapeHtml(service)}</li>`)
        .join('');
      html = html.replace('{{SERVICES_INCLUDED}}', `<ul>${servicesList}</ul>`);
    } else {
      html = html.replace('{{SERVICES_INCLUDED}}', '');
    }

    // Bank Information
    html = html.replace('{{BANK_NAME}}', this.escapeHtml(proforma.bankName || '-'));
    html = html.replace('{{RECEIVER_NAME}}', this.escapeHtml(proforma.receiverName || '-'));
    html = html.replace('{{BRANCH_NAME}}', this.escapeHtml(proforma.branchName || '-'));
    html = html.replace('{{BRANCH_CODE}}', this.escapeHtml(proforma.branchCode || '-'));
    html = html.replace(/{{BANK_CURRENCY}}/g, proforma.bankCurrency || proforma.currency);
    html = html.replace('{{IBAN}}', this.escapeHtml(proforma.iban || '-'));
    html = html.replace('{{SWIFT_CODE}}', this.escapeHtml(proforma.swiftCode || '-'));

    // Hospital Contact Info
    html = html.replace('{{HOSPITAL_ADDRESS}}', this.escapeHtml(proforma.hospitalAddress || '-'));
    html = html.replace('{{HOSPITAL_PHONE}}', this.escapeHtml(proforma.hospitalPhone || '-'));
    html = html.replace('{{HOSPITAL_EMAIL}}', this.escapeHtml(proforma.hospitalEmail || '-'));

    return html;
  }


  /**
 * ✅ Medical Red & Istinye Blue Template için replacement
 * Bu template'lerde farklı tablo yapısı var (Unit Price, Quantity, Total)
 */

  /**
 * ✅ Medical Red & Istinye Blue Template için replacement - BİN AYIRICI İLE
 * Bu template'lerde farklı tablo yapısı var (Unit Price, Quantity, Total)
 */
  private fillNewStyleTemplate(html: string, proforma: Proforma): string {
    // Basic Info
    html = html.replace('{{PROFORMA_NUMBER}}', proforma.proformaNumber);
    html = html.replace('{{DATE}}', new Date(proforma.date).toLocaleDateString('en-US'));
    html = html.replace('{{CURRENCY}}', proforma.currency);

    // GENERAL INFORMATION
    html = html.replace(/{{PATIENT_NAME}}/g, this.escapeHtml(proforma.patientName || '-'));
    html = html.replace(/{{HOSPITAL}}/g, this.escapeHtml(proforma.hospital || 'Liv Hospital Vadistanbul'));
    html = html.replace('{{PHYSICIAN_NAME}}', this.escapeHtml(proforma.physicianName || '-'));
    html = html.replace('{{PHYSICIAN_DEPARTMENT}}', this.escapeHtml(proforma.physicianDepartment || '-'));
    html = html.replace('{{AGE}}', this.escapeHtml(proforma.age || '-'));
    html = html.replace('{{COUNTRY}}', this.escapeHtml(proforma.country || '-'));
    html = html.replace('{{COMED_NO}}', this.escapeHtml(proforma.comedNo || '-'));

    // Optional Fields
    const hasAdditionalInfo = proforma.additionalInfo && proforma.additionalInfo.trim().length > 0;
    html = html.replace('{{ADDITIONAL_INFO_DISPLAY}}', hasAdditionalInfo ? 'block' : 'none');
    html = html.replace('{{ADDITIONAL_INFO}}', this.escapeHtml(proforma.additionalInfo || ''));

    // ✅ PHYSICIAN'S OPINION - PARAGRAF DÜZENLEME İLE
    const hasPhysicianOpinion = proforma.physicianOpinion && proforma.physicianOpinion.trim().length > 0;
    html = html.replace('{{PHYSICIAN_OPINION_DISPLAY}}', hasPhysicianOpinion ? 'block' : 'none');

    if (hasPhysicianOpinion) {
      const formattedOpinion = this.formatPhysicianOpinion(proforma.physicianOpinion);
      html = html.replace('{{PHYSICIAN_OPINION}}', formattedOpinion);
    } else {
      html = html.replace('{{PHYSICIAN_OPINION}}', '');
    }

    // ✅ YENİ TABLO YAPISI: Treatment Items with Unit Price, Quantity, Total - BİN AYIRICI İLE
    const treatmentRows = proforma.treatmentItems
      .map((item) => {
        const costMatch = item.estimatedCost.match(/[\d,]+\.?\d*/);
        const unitPrice = costMatch ? parseFloat(costMatch[0].replace(/,/g, '')) : 0;
        const quantity = item.quantity || 1;
        const total = unitPrice * quantity;

        return `
    <tr>
      <td>${this.escapeHtml(item.procedure)}</td>
      <td style="text-align: center;">${this.formatCurrency(unitPrice, proforma.currency)} ${proforma.currency}</td>
      <td style="text-align: center;">${quantity}</td>
      <td style="text-align: right;">${this.formatCurrency(total, proforma.currency)} ${proforma.currency}</td>
      <td>${this.escapeHtml(item.notes || '-')}</td>
    </tr>
  `;
      })
      .join('');

    html = html.replace('{{TREATMENT_ITEMS}}', treatmentRows);

    // ✅ Grand Total - formatCurrency ile bin ayırıcılı
    const grandTotalValue = this.toNumber(proforma.grandTotal);
    html = html.replace('{{GRAND_TOTAL}}', `${this.formatCurrency(grandTotalValue, proforma.currency)} ${proforma.currency}`);

    // Services Included
    const hasServices = proforma.servicesIncluded && proforma.servicesIncluded.length > 0;
    html = html.replace('{{SERVICES_DISPLAY}}', hasServices ? 'block' : 'none');

    if (hasServices) {
      const servicesList = proforma.servicesIncluded
        .map((service) => `<li>${this.escapeHtml(service)}</li>`)
        .join('');
      html = html.replace('{{SERVICES_INCLUDED}}', `<ul>${servicesList}</ul>`);
    } else {
      html = html.replace('{{SERVICES_INCLUDED}}', '');
    }

    // Bank Information
    html = html.replace('{{BANK_NAME}}', this.escapeHtml(proforma.bankName || '-'));
    html = html.replace('{{RECEIVER_NAME}}', this.escapeHtml(proforma.receiverName || '-'));
    html = html.replace('{{BRANCH_NAME}}', this.escapeHtml(proforma.branchName || '-'));
    html = html.replace('{{BRANCH_CODE}}', this.escapeHtml(proforma.branchCode || '-'));
    html = html.replace(/{{BANK_CURRENCY}}/g, proforma.bankCurrency || proforma.currency);
    html = html.replace('{{IBAN}}', this.escapeHtml(proforma.iban || '-'));
    html = html.replace('{{SWIFT_CODE}}', this.escapeHtml(proforma.swiftCode || '-'));

    // Hospital Contact Info
    html = html.replace('{{HOSPITAL_ADDRESS}}', this.escapeHtml(proforma.hospitalAddress || '-'));
    html = html.replace('{{HOSPITAL_PHONE}}', this.escapeHtml(proforma.hospitalPhone || '-'));
    html = html.replace('{{HOSPITAL_EMAIL}}', this.escapeHtml(proforma.hospitalEmail || '-'));

    return html;
  }

  /**
   * ✅ YENİ: Physician Opinion paragraflarını düzenle
   * Her paragrafı ayrı <p> tag'i içine al ve page-break koruması ekle
   */
  private formatPhysicianOpinion(opinion: string): string {
    if (!opinion) return '';

    // Satır sonlarına göre paragrafları ayır
    const paragraphs = opinion
      .split(/\n\n+/)  // Çift newline ile ayır
      .map(p => p.trim())
      .filter(p => p.length > 0);

    if (paragraphs.length === 0) return this.escapeHtml(opinion);

    // Her paragrafı ayrı <p> tag'i içinde wrap et
    // Son paragraflar için özel class ekle (sayfa kırılması kontrolü için)
    const formattedParagraphs = paragraphs.map((para, index) => {
      const isLastTwo = index >= paragraphs.length - 2;
      const isLast = index === paragraphs.length - 1;

      let className = 'opinion-paragraph';
      if (isLast) {
        className += ' keep-with-previous-two';
      } else if (isLastTwo) {
        className += ' keep-with-next';
      }

      return `<p class="${className}">${this.escapeHtml(para)}</p>`;
    }).join('\n');

    return formattedParagraphs;
  }

  /**
   * 🔥 Recursive file search
   */
  private recursiveSearch(dir: string, filename: string, maxDepth: number): string | null {
    if (maxDepth <= 0) return null;

    try {
      const files = fs.readdirSync(dir);

      for (const file of files) {
        const fullPath = path.join(dir, file);

        try {
          const stat = fs.statSync(fullPath);

          if (stat.isFile() && file === filename) {
            return fullPath;
          }

          if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
            const found = this.recursiveSearch(fullPath, filename, maxDepth - 1);
            if (found) return found;
          }
        } catch (error) {
          // Skip inaccessible files/dirs
          continue;
        }
      }
    } catch (error) {
      // Skip inaccessible directories
      return null;
    }

    return null;
  }

  /**
   * 🔥 List directories for debugging
   */
  private listDirectories(dir: string, maxDepth: number, indent: string = ''): void {
    if (maxDepth <= 0) return;

    try {
      const items = fs.readdirSync(dir);

      for (const item of items) {
        if (item.startsWith('.') || item === 'node_modules') continue;

        const fullPath = path.join(dir, item);

        try {
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory()) {
            console.error(`${indent}📁 ${item}`);
            this.listDirectories(fullPath, maxDepth - 1, indent + '  ');
          } else if (item.endsWith('.html')) {
            console.error(`${indent}📄 ${item}`);
          }
        } catch (error) {
          continue;
        }
      }
    } catch (error) {
      // Skip
    }
  }


  /**
   * Helper: Safely convert to number
   */
  private toNumber(value: any): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseFloat(value) || 0;
    return 0;
  }

  /**
   * ✅ Format currency with thousand separators
   * USD/EUR: 10,550.00 (comma separator, dot decimal)
   * TRY: 10.550,00 (dot separator, comma decimal)
   */
  private formatCurrency(amount: number, currency: string): string {
    if (currency === 'TRY') {
      // Türk Lirası için Avrupa formatı: 10.550,00
      return amount.toLocaleString('tr-TR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    } else {
      // USD, EUR için ABD formatı: 10,550.00
      return amount.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    }
  }

  /**
   * Helper: Escape HTML
   */
  private escapeHtml(text: string): string {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

}