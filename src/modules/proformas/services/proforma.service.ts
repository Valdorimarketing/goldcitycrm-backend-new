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
  async findAll(filters?: {
    status?: string;
    patientId?: number;
    saleId?: number;
    startDate?: Date;
    endDate?: Date;
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

    // ✅ Dil bazlı template seçimi
    const templateName = "proforma-template.html";
 

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

    const hasPhysicianOpinion = proforma.physicianOpinion && proforma.physicianOpinion.trim().length > 0;
    html = html.replace('{{PHYSICIAN_OPINION_DISPLAY}}', hasPhysicianOpinion ? 'block' : 'none');
    html = html.replace('{{PHYSICIAN_OPINION}}', this.escapeHtml(proforma.physicianOpinion || ''));

    // Treatment Items
    const treatmentRows = proforma.treatmentItems
      .map((item) => `
    <tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 10.5px;">${this.escapeHtml(item.procedure)}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 10.5px;">${this.escapeHtml(proforma.physicianDepartment || '-')}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 10.5px;">${this.escapeHtml(item.visitType)}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align: center; font-size: 10.5px; min-width: 140px;">${this.escapeHtml(item.estimatedCost)}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 10.5px;">${this.escapeHtml(item.notes || '')}</td>
    </tr>
  `)
      .join('');
    html = html.replace('{{TREATMENT_ITEMS}}', treatmentRows);

    // Grand Total
    const grandTotalValue = this.toNumber(proforma.grandTotal);
    html = html.replace('{{GRAND_TOTAL}}', `${grandTotalValue.toFixed(2)} ${proforma.currency}`);

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

    console.log('✅ HTML generated successfully');

    return html;
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