import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Proforma } from '../entities/proforma.entity';
import { CreateProformaDto } from '../dto/create.proforma.dto';
import { UpdateProformaDto } from '../dto/update.proforma.dto';
import * as puppeteer from 'puppeteer';
import { PDFDocument } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ProformaService {
  constructor(
    @InjectRepository(Proforma)
    private readonly proformaRepository: Repository<Proforma>,
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

    const proforma = this.proformaRepository.create({
      ...createProformaDto,
      proformaNumber,
      createdBy: userId,
    });

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
    const query = this.proformaRepository.createQueryBuilder('proforma');

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
    const proforma = await this.proformaRepository.findOne({ where: { id } });

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
    // This would integrate with your existing patient and sales modules
    // For now, returning a structure with new fields
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
      // Bank defaults
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
   * Generate PDF from proforma (with blank page removal)
   */


  /**
 * Generate PDF from proforma (OPTIMIZED - prevents extra pages)
 */

  /**
  * Generate PDF from proforma - FINAL PROFESSIONAL VERSION
  * - Full width images (no margins)
  * - Optimized page breaks
  * - High quality rendering
  */
  /**
  * Generate PDF from proforma - FIXED: margin to prevent blank pages
  */
  async generatePDF(id: number): Promise<Uint8Array> {
    console.log('🔍 PDF Generation Started for ID:', id);

    const proforma = await this.findOne(id);
    console.log('✅ Proforma found:', proforma.proformaNumber);

    const html = await this.generateHTML(proforma);
    console.log('✅ HTML Generated, length:', html.length);

    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });

    try {
      const page = await browser.newPage();

      await page.setViewport({
        width: 794,
        height: 1123,
        deviceScaleFactor: 2,
      });

      await page.setContent(html, {
        waitUntil: 'networkidle0',
        timeout: 30000,
      });

      await page.addStyleTag({
        content: `
        @page {
          size: A4;
          margin: 0;
        }
        
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
        }
        
        /* FIX: Minimal margin prevents blank pages */
        .image-page {
          margin: 0 !important;
          padding: 1px !important;
          width: 100% !important;
          page-break-after: always;
          page-break-inside: avoid;
        }
        
        .image-page img {
          width: calc(100% - 1px) !important;
          max-width: calc(100% - 1px) !important;
          height: auto !important;
          display: block !important;
          margin: 0 auto !important;
          padding: 0 !important;
          object-fit: contain !important;
        }
        
        .content-page {
          padding: 40px 60px !important;
          box-sizing: border-box !important;
        }
        
        .content-page.first {
          page-break-before: always;
        }
        
        .page-break {
          page-break-before: always;
        }
        
        .no-break {
          page-break-inside: avoid !important;
        }
      `
      });

      await page.evaluate(() => {
        return Promise.all(
          Array.from(document.images)
            .filter(img => !img.complete)
            .map(img => new Promise(resolve => {
              img.onload = resolve;
              img.onerror = resolve;
            }))
        );
      });

      console.log('✅ All images loaded');

      let pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '1mm',
          right: '1mm',
          bottom: '1mm',
          left: '1mm',
        },
        preferCSSPageSize: true,
        displayHeaderFooter: false,
      });

      console.log('✅ PDF Generated by Puppeteer, size:', pdf.length);

      pdf = await this.removeBlankPages(pdf);
      console.log('✅ Final PDF size:', pdf.length);

      return pdf;
    } finally {
      await browser.close();
    }
  }
  /**
   * Remove blank pages from PDF
   */

  private async removeBlankPages(pdfBytes: Uint8Array): Promise<Uint8Array> {
    console.log('🔍 Checking for blank/empty pages...');

    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    const totalPages = pages.length;

    console.log('📄 Total pages before cleanup:', totalPages);

    const nonEmptyPages: number[] = [];

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];

      // Get page dimensions
      const { width, height } = page.getSize();

      // Get page contents
      const contents = page.node.normalizedEntries().Contents;

      // Check 1: Completely blank (no contents at all)
      const isCompletelyBlank = !contents || (Array.isArray(contents) && contents.length === 0);

      if (isCompletelyBlank) {
        console.log(`⚠️ Page ${i + 1}: COMPLETELY BLANK - will be removed`);
        continue;
      }

      // Check 2: Has content - try to estimate content size
      try {

        // No text, but might have graphics
        console.log(`⚠️ Page ${i + 1}: No text, checking graphics...`);

        // If page has operations (drawings, images), keep it
        if (contents && (!Array.isArray(contents) || contents.length > 0)) {
          console.log(`✅ Page ${i + 1}: Has graphics/operations - keeping`);
          nonEmptyPages.push(i);
        } else {
          console.log(`⚠️ Page ${i + 1}: MINIMAL CONTENT - will be removed`);
        }

      } catch (error) {
        // If we can't analyze, keep the page (safe default)
        console.log(`⚠️ Page ${i + 1}: Cannot analyze - keeping (safe default)`);
        nonEmptyPages.push(i);
      }
    }

    // If all pages are blank, return original (error case)
    if (nonEmptyPages.length === 0) {
      console.warn('⚠️ All pages appear blank! Returning original PDF');
      return pdfBytes;
    }

    // If no pages were removed, return original
    if (nonEmptyPages.length === totalPages) {
      console.log('✅ No blank pages found');
      return pdfBytes;
    }

    // Create new PDF with only non-empty pages
    console.log('🔧 Creating new PDF with', nonEmptyPages.length, 'pages...');

    const newPdf = await PDFDocument.create();

    for (const pageIndex of nonEmptyPages) {
      const [copiedPage] = await newPdf.copyPages(pdfDoc, [pageIndex]);
      newPdf.addPage(copiedPage);
    }

    const result = await newPdf.save();

    console.log('✅ Blank page removal complete');
    console.log(`📊 Pages: ${totalPages} → ${nonEmptyPages.length} (removed ${totalPages - nonEmptyPages.length})`);

    return result;
  }

  /**
   * Generate HTML for PDF
   */


  /**
 * Generate HTML for PDF - WITH DEBUG INFO
 */
  private async generateHTML(proforma: Proforma): Promise<string> {
    // Template loading (same as before)
    const templatePath = path.join(__dirname, '../templates/proforma-template.html');
    let html: string;

    try {
      html = fs.readFileSync(templatePath, 'utf-8');
      console.log('✅ Template loaded from:', templatePath);
    } catch (error) {
      const altTemplatePath = path.join(process.cwd(), 'templates/proforma-template.html');
      try {
        html = fs.readFileSync(altTemplatePath, 'utf-8');
        console.log('✅ Template loaded from:', altTemplatePath);
      } catch (altError) {
        const srcTemplatePath = path.join(process.cwd(), 'src/templates/proforma-template.html');
        html = fs.readFileSync(srcTemplatePath, 'utf-8');
        console.log('✅ Template loaded from:', srcTemplatePath);
      }
    }

    console.log('📏 Original template size:', html.length, 'chars');

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

    // DEBUG: Check physician opinion length
    if (hasPhysicianOpinion) {
      console.log('📝 Physician Opinion length:', proforma.physicianOpinion.length, 'chars');
      if (proforma.physicianOpinion.length > 1000) {
        console.warn('⚠️ PHYSICIAN OPINION TOO LONG! This might cause extra pages.');
        console.warn('   Consider truncating or paginating.');
      }
    }

    html = html.replace('{{PHYSICIAN_OPINION}}', this.escapeHtml(proforma.physicianOpinion || ''));

    // Treatment Items
    console.log('💊 Treatment items count:', proforma.treatmentItems?.length || 0);

    const treatmentRows = proforma.treatmentItems
      .map((item) => `
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 10.5px;">${this.escapeHtml(item.procedure)}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 10.5px;">${this.escapeHtml(item.visitType)}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align: center; font-size: 10.5px;">${this.escapeHtml(item.estimatedCost)}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 10.5px;">${this.escapeHtml(item.notes || '')}</td>
      </tr>
    `)
      .join('');
    html = html.replace('{{TREATMENT_ITEMS}}', treatmentRows);

    // Grand Total
    const grandTotalValue = this.toNumber(proforma.grandTotal);
    html = html.replace('{{GRAND_TOTAL}}', `${proforma.currency} ${grandTotalValue.toFixed(2)}`);

    // Services Included
    const hasServices = proforma.servicesIncluded && proforma.servicesIncluded.length > 0;
    html = html.replace('{{SERVICES_DISPLAY}}', hasServices ? 'block' : 'none');

    console.log('🎁 Services included count:', proforma.servicesIncluded?.length || 0);

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

    console.log('📏 Final HTML size:', html.length, 'chars');
    console.log('📊 Size increase:', html.length - 28239, 'chars'); // Your original size

    // Check for remaining placeholders
    const remainingPlaceholders = html.match(/{{[A-Z_]+}}/g);
    if (remainingPlaceholders && remainingPlaceholders.length > 0) {
      console.warn('⚠️ Unfilled placeholders found:', remainingPlaceholders);
    }

    console.log('✅ HTML placeholders replaced successfully');

    return html;
  }


  /**
   * Save PDF to file system
   */
  async savePDFToFile(id: number): Promise<string> {
    const pdf = await this.generatePDF(id);
    const proforma = await this.findOne(id);

    const uploadsDir = path.join(process.cwd(), 'uploads/proformas');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filename = `${proforma.proformaNumber}.pdf`;
    const filepath = path.join(uploadsDir, filename);

    fs.writeFileSync(filepath, pdf);

    // Update proforma with PDF URL
    proforma.pdfUrl = `/uploads/proformas/${filename}`;
    await this.proformaRepository.save(proforma);

    return proforma.pdfUrl;
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