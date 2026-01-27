import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Customer } from '../customer/entities/customer.entity';
import { CustomerNote } from '../customer-note/entities/customer-note.entity';
import { CustomerHistory } from '../customer-history/entities/customer-history.entity';
import { Source } from '../source/entities/source.entity';
import { Status } from '../status/entities/status.entity';
import { User } from '../user/entities/user.entity';
import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import {
  AnalysisResultDto,
  ColumnAnalysisDto,
  ImportProgressDto,
  ImportExcelDto,
} from './dto/excel-import.dto';

interface KisilerExcelRow {
  Adi: string;
  Soyadi: string;
  Email: string;
  Telefon: string;
  DogumGunu: string;
  KimlikNumarasi: number;
  Şehir: string;
  Adres: string;
  Aciklama: string;
  KayitTarihi: string;
  Segment: string;
  Kaynak: string;
  'Atanan Kullanıcı': string;
}

interface NotlarExcelRow {
  KayitTarihi: string;
  DinamikAramaTarihi: string;
  Icerik: string;
  Segment: string;
  Kişi: string;
  'Sorumlu Kullanıcı': string;
}

interface SyncResult {
  success: boolean;
  kisiler: {
    totalRows: number;
    processedCount: number;
    createdCustomers: number;
    updatedCustomers: number;
    createdNotes: number;
    createdHistories: number;
    skippedCount: number;
    skippedReasons: {
      noPhoneOrEmail: number;
      duplicatePhone: number;
      duplicateEmail: number;
    };
    userAssignments: Record<string, number>;
    statusDistribution: Record<string, number>;
    sourceDistribution: Record<string, number>;
  };
  notlar: {
    totalRows: number;
    processedCount: number;
    createdNotes: number;
    createdHistories: number;
    skippedCount: number;
    skippedReasons: {
      noContent: number;
      customerNotFound: number;
      duplicateNote: number;
    };
    userDistribution: Record<string, number>;
  };
  errors: string[];
  newSourcesCreated: string[];
}

@Injectable()
export class ExcelSyncService {
  private readonly logger = new Logger(ExcelSyncService.name);

  // Segment -> Status ID Mapping
  private readonly segmentMapping: Record<string, number> = {
    'Tekrar Aranacak': 2,
    'Tekrar Aranacak 2': 2,
    'HAVUZ/Tekrar Aranacak': 2,
    'Genel Havuz': 1,
    'İlgilenmiyor': 9,
    'Satıldı': 3,
    'Süreci Biten Satıldı': 3,
    'Ekime Uygun Değil': 25,
    'Kısa Vade Düşünecek': 13,
    'Orta Vade Düşünecek': 15,
    'Uzun Vade Düşünecek': 16,
    'Düşünceli Uzun Vade': 16,
    '5 Kez Ulaşılamadı': 24,
    'Müsait Değil': 30,
    'Görüşme Planlandı': 27,
    'Potansiyel Sıcak': 17,
    'Sıcak Alacak': 26,
    'Başka Yerde Yaptırmış': 32,
    'Op. İptal': 18,
    'Op. Ertelendi': 19,
    'Yanlış Kayıt': 20,
    'Çok Pahalı': 10,
    'Ara Sıcak': 26,
    'Takip': 2,
    'PRP/KÖK HÜCRE Satış': 3,
    'İlaç Satış': 3,
    'Fotoğraf Analiz': 1,
    'Fotoğraf Gönderecek': 1,
    'Fotoğraf Göndermedi': 1,
    'Gün Belirleme': 27,
    'Revizyon': 1,
  };

  // Kaynak -> Source ID Mapping
  private readonly sourceMapping: Record<string, number> = {
    'Facebook': 1,
    'Telefon': 6,
    'Mail': 7,
    'WhatsApp': 3,
    'WhatsApp-G': 3,
    'İG-WhatsApp': 3,
    'Referans': 9,
    'Tanıdık': 9,
    'Adwords': 2,
    'Form': 4,
    'Reklam': 2,
  };

  private readonly newSources: string[] = ['Acente', 'Diğer', 'Instagram', 'Çatkapı'];

  private readonly statusNames: Record<number, string> = {
    1: 'YENİ',
    2: 'TEKRAR ARANACAK',
    3: 'SATILDI',
    9: 'İLGİLENMİYOR',
    10: 'PAHALI',
    13: 'KISA VADE ARANACAK',
    15: 'ORTA VADE ARANACAK',
    16: 'UZUN VADE ARANACAK',
    17: 'POTANSİYEL SICAK',
    18: 'OPERASYON İPTAL',
    19: 'OPERASYON ERTELEME',
    20: 'YANLIŞ KAYIT- BAŞVURUSU YOK',
    24: '5 KEZ ULAŞILAMADI',
    25: 'OPERASYONA UYGUN DEĞİL',
    26: 'SICAK ALACAK',
    27: 'GÖRÜŞME PLANLANDI',
    30: 'MÜSAİT DEĞİL',
    32: 'BAŞKA YERDE YAPTIRMIŞ',
  };

  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(CustomerNote)
    private readonly customerNoteRepository: Repository<CustomerNote>,
    @InjectRepository(CustomerHistory)
    private readonly customerHistoryRepository: Repository<CustomerHistory>,
    @InjectRepository(Source)
    private readonly sourceRepository: Repository<Source>,
    @InjectRepository(Status)
    private readonly statusRepository: Repository<Status>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  // ============================================
  // Excel File Analysis & Import Methods
  // ============================================

  private importJobs = new Map<string, {
    status: 'pending' | 'analyzing' | 'importing' | 'completed' | 'failed';
    progress: number;
    currentStep: string;
    processedRows: number;
    totalRows: number;
    errors: string[];
    createdCustomers: number;
    updatedCustomers: number;
    createdNotes: number;
    skippedCount: number;
    skippedReasons: {
      noPhoneOrEmail: number;
      duplicatePhone: number;
      duplicateEmail: number;
    };
  }>();

  private readonly fieldMappingSuggestions: Record<string, string[]> = {
    name: ['ad', 'adi', 'name', 'first_name', 'firstname', 'isim', 'ad_soyad'],
    surname: ['soyad', 'soyadi', 'surname', 'last_name', 'lastname'],
    email: ['email', 'e-mail', 'eposta', 'e-posta', 'mail'],
    phone: ['telefon', 'phone', 'tel', 'mobile', 'cep', 'gsm'],
    birthDate: ['dogumgunu', 'dogum_tarihi', 'birthdate', 'birth_date', 'dogum', 'dtarihi'],
    identityNumber: ['tc', 'tckimlik', 'kimliknumarasi', 'identity', 'tc_no', 'tcno', 'kimlik'],
    address: ['adres', 'address'],
    city: ['sehir', 'city', 'il', 'şehir'],
    description: ['aciklama', 'description', 'not', 'note', 'notlar'],
    segment: ['segment', 'durum', 'status'],
    source: ['kaynak', 'source', 'kanal'],
    assignedUser: ['atanan', 'kullanici', 'user', 'sorumlu', 'atanan_kullanici'],
    createdAt: ['kayittarihi', 'kayit_tarihi', 'created_at', 'createdat', 'olusturma_tarihi', 'tarih'],
  };

  async analyzeExcelFile(fileId: string): Promise<AnalysisResultDto> {
    const filePath = path.join(process.cwd(), 'uploads', 'excel-imports', fileId);

    if (!fs.existsSync(filePath)) {
      throw new HttpException('Dosya bulunamadı', HttpStatus.NOT_FOUND);
    }

    try {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (rows.length === 0) {
        throw new HttpException('Excel dosyası boş', HttpStatus.BAD_REQUEST);
      }

      const headers = rows[0] as string[];
      const dataRows = rows.slice(1).filter(row => row.some(cell => cell !== undefined && cell !== null && cell !== ''));
      const rowCount = dataRows.length;

      const columns: ColumnAnalysisDto[] = headers.map((header, index) => {
        const columnValues = dataRows
          .map(row => row[index])
          .filter(v => v !== undefined && v !== null && v !== '');
        const sampleValues = columnValues.slice(0, 5).map(v => String(v));

        return {
          name: String(header || `Sütun ${index + 1}`),
          sampleValues,
          suggestedMapping: this.suggestMapping(String(header || '')),
          dataType: this.detectDataType(columnValues),
          emptyCount: dataRows.length - columnValues.length,
          uniqueCount: new Set(columnValues.map(String)).size,
          totalCount: columnValues.length,
        };
      });

      const validationResults = await this.validateExcelData(dataRows, columns);
      const estimatedImportTime = Math.ceil(rowCount * 0.05);
      const stats = fs.statSync(filePath);

      const fileNameParts = fileId.split('-');
      fileNameParts.pop();
      const originalName = fileNameParts.join('-') || fileId;

      return {
        success: true,
        fileId,
        fileName: originalName,
        fileSize: stats.size,
        rowCount,
        columns,
        estimatedImportTime,
        validationResults,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`Excel analiz hatası: ${error.message}`);
      throw new HttpException(`Dosya analiz edilemedi: ${error.message}`, HttpStatus.BAD_REQUEST);
    }
  }

  private suggestMapping(header: string): string | null {
    if (!header) return null;

    const normalizedHeader = header.toLowerCase()
      .replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ]/g, '')
      .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
      .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c');

    for (const [field, aliases] of Object.entries(this.fieldMappingSuggestions)) {
      if (aliases.some(alias => {
        const normalizedAlias = alias.replace(/[^a-z0-9]/g, '');
        return normalizedHeader.includes(normalizedAlias) || normalizedAlias.includes(normalizedHeader);
      })) {
        return field;
      }
    }
    return null;
  }

  private detectDataType(values: any[]): 'string' | 'number' | 'date' | 'email' | 'phone' {
    if (values.length === 0) return 'string';

    const sample = values.slice(0, 100);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const emailMatches = sample.filter(v => emailRegex.test(String(v))).length;
    if (emailMatches > sample.length * 0.7) return 'email';

    const phoneRegex = /^[\d\s\-+()]{10,}$/;
    const phoneMatches = sample.filter(v => phoneRegex.test(String(v).replace(/\D/g, ''))).length;
    if (phoneMatches > sample.length * 0.7) return 'phone';

    const numberMatches = sample.filter(v => !isNaN(Number(v)) && v !== '').length;
    if (numberMatches > sample.length * 0.9) return 'number';

    const dateMatches = sample.filter(v => {
      if (typeof v === 'number' && v > 25569 && v < 50000) return true;
      const date = new Date(String(v));
      return !isNaN(date.getTime()) && String(v).length > 4;
    }).length;
    if (dateMatches > sample.length * 0.7) return 'date';

    return 'string';
  }

  private async validateExcelData(rows: any[][], columns: ColumnAnalysisDto[]): Promise<{
    errors: string[];
    warnings: string[];
    duplicatePhones: number;
    duplicateEmails: number;
    missingRequiredFields: number;
    existingPhonesInDb: number;
    existingEmailsInDb: number;
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let duplicatePhones = 0;
    let duplicateEmails = 0;
    let missingRequiredFields = 0;

    const phoneIndex = columns.findIndex(c => c.suggestedMapping === 'phone');
    const emailIndex = columns.findIndex(c => c.suggestedMapping === 'email');

    const phones = new Set<string>();
    const emails = new Set<string>();
    const phoneList: string[] = [];
    const emailList: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const phone = phoneIndex >= 0 ? this.cleanPhone(row[phoneIndex]) : null;
      const email = emailIndex >= 0 ? this.cleanEmail(row[emailIndex]) : null;

      if (phone) {
        if (phones.has(phone)) {
          duplicatePhones++;
        } else {
          phones.add(phone);
          phoneList.push(phone);
        }
      }

      if (email) {
        if (emails.has(email)) {
          duplicateEmails++;
        } else {
          emails.add(email);
          emailList.push(email);
        }
      }

      if (!phone && !email) {
        missingRequiredFields++;
      }
    }

    let existingPhonesInDb = 0;
    let existingEmailsInDb = 0;

    if (phoneList.length > 0) {
      const phonesToCheck = phoneList.slice(0, 1000);
      existingPhonesInDb = await this.customerRepository
        .createQueryBuilder('c')
        .where('c.phone IN (:...phones)', { phones: phonesToCheck })
        .getCount();

      if (existingPhonesInDb > 0) {
        warnings.push(`${existingPhonesInDb} telefon numarası veritabanında zaten mevcut`);
      }
    }

    if (emailList.length > 0) {
      const emailsToCheck = emailList.slice(0, 1000);
      existingEmailsInDb = await this.customerRepository
        .createQueryBuilder('c')
        .where('c.email IN (:...emails)', { emails: emailsToCheck })
        .getCount();

      if (existingEmailsInDb > 0) {
        warnings.push(`${existingEmailsInDb} e-posta adresi veritabanında zaten mevcut`);
      }
    }

    if (duplicatePhones > 0) {
      warnings.push(`Dosyada ${duplicatePhones} mükerrer telefon numarası var`);
    }

    if (duplicateEmails > 0) {
      warnings.push(`Dosyada ${duplicateEmails} mükerrer e-posta adresi var`);
    }

    if (missingRequiredFields > 0) {
      warnings.push(`${missingRequiredFields} satırda telefon ve e-posta bilgisi eksik`);
    }

    if (phoneIndex < 0 && emailIndex < 0) {
      errors.push('Telefon veya e-posta sütunu tespit edilemedi');
    }

    return {
      errors,
      warnings,
      duplicatePhones,
      duplicateEmails,
      missingRequiredFields,
      existingPhonesInDb,
      existingEmailsInDb,
    };
  }

  async startImport(importDto: ImportExcelDto): Promise<string> {
    const jobId = uuidv4();

    this.importJobs.set(jobId, {
      status: 'pending',
      progress: 0,
      currentStep: 'Başlatılıyor...',
      processedRows: 0,
      totalRows: 0,
      errors: [],
      createdCustomers: 0,
      updatedCustomers: 0,
      createdNotes: 0,
      skippedCount: 0,
      skippedReasons: {
        noPhoneOrEmail: 0,
        duplicatePhone: 0,
        duplicateEmail: 0,
      },
    });

    this.executeImportJob(jobId, importDto).catch(error => {
      this.logger.error(`Import job ${jobId} failed: ${error.message}`);
      const job = this.importJobs.get(jobId);
      if (job) {
        job.status = 'failed';
        job.errors.push(error.message);
      }
    });

    return jobId;
  }

  private async executeImportJob(jobId: string, importDto: ImportExcelDto): Promise<void> {
    const job = this.importJobs.get(jobId);
    if (!job) return;

    try {
      job.status = 'analyzing';
      job.currentStep = 'Dosya okunuyor...';

      const kisilerPath = path.join(process.cwd(), 'uploads', 'excel-imports', importDto.kisilerFileId);

      if (!fs.existsSync(kisilerPath)) {
        throw new Error('Kisiler dosyası bulunamadı');
      }

      let notlarPath: string | undefined;
      if (importDto.notlarFileId) {
        notlarPath = path.join(process.cwd(), 'uploads', 'excel-imports', importDto.notlarFileId);
        if (!fs.existsSync(notlarPath)) {
          throw new Error('Notlar dosyası bulunamadı');
        }
      }

      job.status = 'importing';
      job.currentStep = 'Müşteriler aktarılıyor...';

      const result = await this.syncExcelDataWithProgress(
        kisilerPath,
        notlarPath,
        jobId,
        importDto.updateExisting,
        importDto.fieldsToUpdate
      );

      job.status = 'completed';
      job.progress = 100;
      job.currentStep = 'Tamamlandı';
      job.createdCustomers = result.kisiler.createdCustomers;
      job.updatedCustomers = result.kisiler.updatedCustomers;
      job.createdNotes = result.kisiler.createdNotes + result.notlar.createdNotes;
      job.skippedCount = result.kisiler.skippedCount + result.notlar.skippedCount;
      job.skippedReasons = result.kisiler.skippedReasons;
      job.errors = result.errors;

    } catch (error) {
      job.status = 'failed';
      job.currentStep = 'Hata oluştu';
      job.errors.push(error.message);
      this.logger.error(`Import job ${jobId} failed: ${error.message}`);
    }
  }

  private async syncExcelDataWithProgress(
    kisilerPath: string,
    notlarPath: string | undefined,
    jobId: string,
    updateExisting?: boolean,
    fieldsToUpdate?: string[]
  ): Promise<SyncResult> {
    const job = this.importJobs.get(jobId);
    const result: SyncResult = {
      success: false,
      kisiler: {
        totalRows: 0,
        processedCount: 0,
        createdCustomers: 0,
        updatedCustomers: 0,
        createdNotes: 0,
        createdHistories: 0,
        skippedCount: 0,
        skippedReasons: {
          noPhoneOrEmail: 0,
          duplicatePhone: 0,
          duplicateEmail: 0,
        },
        userAssignments: {},
        statusDistribution: {},
        sourceDistribution: {},
      },
      notlar: {
        totalRows: 0,
        processedCount: 0,
        createdNotes: 0,
        createdHistories: 0,
        skippedCount: 0,
        skippedReasons: {
          noContent: 0,
          customerNotFound: 0,
          duplicateNote: 0,
        },
        userDistribution: {},
      },
      errors: [],
      newSourcesCreated: [],
    };

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const workbook = XLSX.readFile(kisilerPath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows: KisilerExcelRow[] = XLSX.utils.sheet_to_json(worksheet);
      result.kisiler.totalRows = rows.length;

      if (job) {
        job.totalRows = rows.length;
      }

      const createdSources = await this.createNewSources(queryRunner);
      result.newSourcesCreated = createdSources;

      const allSources = await queryRunner.manager.find(Source);
      const dynamicSourceMapping = { ...this.sourceMapping };
      for (const source of allSources) {
        if (this.newSources.includes(source.name) || source.name === 'Diğer') {
          dynamicSourceMapping[source.name] = source.id;
        }
      }

      // Build dynamic user mapping from database
      const dynamicUserMapping = await this.buildDynamicUserMapping(queryRunner);

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        try {
          const customerResult = await this.processKisilerRow(
            row,
            dynamicSourceMapping,
            dynamicUserMapping,
            queryRunner,
            updateExisting,
            fieldsToUpdate
          );

          if (customerResult.created) {
            result.kisiler.createdCustomers++;
            result.kisiler.createdHistories += customerResult.historyCount;
            if (customerResult.noteCreated) {
              result.kisiler.createdNotes++;
            }
            if (customerResult.statusName) {
              result.kisiler.statusDistribution[customerResult.statusName] =
                (result.kisiler.statusDistribution[customerResult.statusName] || 0) + 1;
            }
          } else if (customerResult.updated) {
            result.kisiler.updatedCustomers++;
            result.kisiler.createdHistories += customerResult.historyCount;
          } else if (customerResult.skipped) {
            result.kisiler.skippedCount++;
            if (customerResult.skipReason === 'noPhoneOrEmail') {
              result.kisiler.skippedReasons.noPhoneOrEmail++;
            } else if (customerResult.skipReason === 'duplicatePhone') {
              result.kisiler.skippedReasons.duplicatePhone++;
            } else if (customerResult.skipReason === 'duplicateEmail') {
              result.kisiler.skippedReasons.duplicateEmail++;
            }
          }

          result.kisiler.processedCount++;

          if (job) {
            job.processedRows = i + 1;
            job.progress = Math.round(((i + 1) / rows.length) * (notlarPath ? 80 : 100));
            job.createdCustomers = result.kisiler.createdCustomers;
            job.updatedCustomers = result.kisiler.updatedCustomers;
            job.skippedCount = result.kisiler.skippedCount;
          }

        } catch (error) {
          result.errors.push(`Satır ${i + 2}: ${error.message}`);
        }
      }

      if (notlarPath) {
        if (job) {
          job.currentStep = 'Notlar aktarılıyor...';
        }
        const customerNameMap = await this.buildCustomerNameMap(queryRunner);
        await this.processNotlarExcel(notlarPath, customerNameMap, dynamicUserMapping, queryRunner, result);

        if (job) {
          job.progress = 100;
          job.createdNotes = result.kisiler.createdNotes + result.notlar.createdNotes;
        }
      }

      await queryRunner.commitTransaction();
      result.success = true;

    } catch (error) {
      await queryRunner.rollbackTransaction();
      result.errors.push(`Genel hata: ${error.message}`);
      throw error;
    } finally {
      await queryRunner.release();
    }

    return result;
  }

  getJobStatus(jobId: string): ImportProgressDto {
    const job = this.importJobs.get(jobId);

    if (!job) {
      throw new HttpException('İş bulunamadı', HttpStatus.NOT_FOUND);
    }

    return {
      status: job.status,
      progress: job.progress,
      currentStep: job.currentStep,
      processedRows: job.processedRows,
      totalRows: job.totalRows,
      errors: job.errors,
      createdCustomers: job.createdCustomers,
      updatedCustomers: job.updatedCustomers,
      createdNotes: job.createdNotes,
      skippedCount: job.skippedCount,
      skippedReasons: job.skippedReasons,
    };
  }

  // ============================================
  // Helper Methods
  // ============================================

  private async buildCustomerNameMap(queryRunner: any): Promise<Map<string, number>> {
    const customers = await queryRunner.manager.find(Customer, {
      select: ['id', 'name', 'surname'],
    });

    const nameMap = new Map<string, number>();

    for (const customer of customers) {
      const fullName = `${customer.name || ''} ${customer.surname || ''}`.trim().toLowerCase();
      if (fullName) {
        nameMap.set(fullName, customer.id);
      }

      if (customer.name) {
        const onlyName = customer.name.trim().toLowerCase();
        if (!nameMap.has(onlyName)) {
          nameMap.set(onlyName, customer.id);
        }
      }
    }

    return nameMap;
  }

  /**
   * Build dynamic user mapping from database
   * Maps user names to their IDs for Excel import
   */
  private async buildDynamicUserMapping(queryRunner: any): Promise<Record<string, number>> {
    const users = await queryRunner.manager.find(User, {
      select: ['id', 'name'],
      where: { isActive: true },
    });

    const userMapping: Record<string, number> = {};

    for (const user of users) {
      // Name mapping (e.g., "Arij" or "Arij Korkmaz")
      if (user.name) {
        const name = user.name.trim();
        if (name) {
          userMapping[name] = user.id;

          // Also add lowercase version for case-insensitive matching
          userMapping[name.toLowerCase()] = user.id;
        }
      }
    }

    this.logger.log(`Dinamik kullanıcı eşleştirmesi oluşturuldu: ${Object.keys(userMapping).length} kullanıcı`);
    return userMapping;
  }

  private async createNewSources(queryRunner: any): Promise<string[]> {
    const createdSources: string[] = [];

    for (const sourceName of this.newSources) {
      const existing = await queryRunner.manager.findOne(Source, {
        where: { name: sourceName },
      });

      if (!existing) {
        const newSource = queryRunner.manager.create(Source, {
          name: sourceName,
          description: `Excel import - ${sourceName}`,
        });
        await queryRunner.manager.save(newSource);
        createdSources.push(sourceName);
        this.logger.log(`Yeni kaynak oluşturuldu: ${sourceName}`);
      }
    }

    return createdSources;
  }

  private async processKisilerRow(
    row: KisilerExcelRow,
    sourceMapping: Record<string, number>,
    userMapping: Record<string, number>,
    queryRunner: any,
    updateExisting?: boolean,
    fieldsToUpdate?: string[],
  ): Promise<{
    created: boolean;
    updated: boolean;
    noteCreated: boolean;
    skipped: boolean;
    skipReason?: string;
    historyCount: number;
    assignedUser?: string;
    statusName?: string;
    sourceName?: string;
  }> {
    const result = {
      created: false,
      updated: false,
      noteCreated: false,
      skipped: false,
      skipReason: undefined as string | undefined,
      historyCount: 0,
      assignedUser: undefined as string | undefined,
      statusName: undefined as string | undefined,
      sourceName: undefined as string | undefined,
    };

    const phone = this.cleanPhone(row.Telefon);
    const email = this.cleanEmail(row.Email);

    if (!phone && !email) {
      result.skipped = true;
      result.skipReason = 'noPhoneOrEmail';
      return result;
    }

    // Check for existing customer by phone or email
    let existingCustomer: Customer | null = null;

    if (phone) {
      existingCustomer = await queryRunner.manager.findOne(Customer, {
        where: { phone },
      });
    }

    if (!existingCustomer && email) {
      existingCustomer = await queryRunner.manager.findOne(Customer, {
        where: { email },
      });
    }

    // If existing customer found and updateExisting is enabled, update the customer
    if (existingCustomer && updateExisting && fieldsToUpdate && fieldsToUpdate.length > 0) {
      const updateData: Partial<Customer> = {};
      const updatedFields: string[] = [];

      // Map Excel fields to customer fields
      const fieldMapping: Record<string, { excelField: keyof KisilerExcelRow; getValue: () => any }> = {
        name: { excelField: 'Adi', getValue: () => row.Adi || null },
        surname: { excelField: 'Soyadi', getValue: () => row.Soyadi || null },
        email: { excelField: 'Email', getValue: () => this.cleanEmail(row.Email) },
        phone: { excelField: 'Telefon', getValue: () => this.cleanPhone(row.Telefon) },
        birthDate: { excelField: 'DogumGunu', getValue: () => this.parseDate(row.DogumGunu) },
        identityNumber: { excelField: 'KimlikNumarasi', getValue: () => row.KimlikNumarasi || null },
        address: { excelField: 'Adres', getValue: () => this.cleanAddress(row.Adres) },
        status: { excelField: 'Segment', getValue: () => row.Segment ? this.segmentMapping[row.Segment] : null },
        sourceId: { excelField: 'Kaynak', getValue: () => row.Kaynak ? sourceMapping[row.Kaynak] : null },
        relevantUser: { excelField: 'Atanan Kullanıcı', getValue: () => {
          const atanan = row['Atanan Kullanıcı']?.trim();
          return atanan ? (userMapping[atanan] || userMapping[atanan.toLowerCase()]) : null;
        }},
      };

      for (const field of fieldsToUpdate) {
        const mapping = fieldMapping[field];
        if (mapping) {
          const newValue = mapping.getValue();
          if (newValue !== null && newValue !== undefined) {
            (updateData as any)[field] = newValue;
            updatedFields.push(field);
          }
        }
      }

      if (updatedFields.length > 0) {
        await queryRunner.manager.update(Customer, existingCustomer.id, updateData);

        // Create history for update
        const updateHistory = queryRunner.manager.create(CustomerHistory, {
          customer: existingCustomer.id,
          user: 1,
          action: 'Müşteri Güncellendi',
          description: `Excel import ile güncellendi. Güncellenen alanlar: ${updatedFields.join(', ')}`,
          requestData: JSON.stringify({
            source: 'excel_import_update',
            updatedFields,
            newValues: updateData,
          }),
          responseData: null,
        });
        await queryRunner.manager.save(updateHistory);
        result.historyCount++;

        result.updated = true;
        return result;
      }

      // No fields to update, skip
      result.skipped = true;
      result.skipReason = 'duplicatePhone';
      return result;
    }

    // If existing customer found but updateExisting is not enabled, skip
    if (existingCustomer) {
      result.skipped = true;
      result.skipReason = phone && existingCustomer.phone === phone ? 'duplicatePhone' : 'duplicateEmail';
      return result;
    }

    const statusId = row.Segment ? this.segmentMapping[row.Segment] : 1;
    const statusName = this.statusNames[statusId] || 'YENİ';
    result.statusName = statusName;

    const sourceId = row.Kaynak ? sourceMapping[row.Kaynak] : null;
    result.sourceName = row.Kaynak || undefined;

    const atananKullanici = row['Atanan Kullanıcı']?.trim();
    const relevantUser = atananKullanici
      ? (userMapping[atananKullanici] || userMapping[atananKullanici.toLowerCase()])
      : null;

    if (relevantUser && row['Atanan Kullanıcı']) {
      result.assignedUser = row['Atanan Kullanıcı'];
    }

    const birthDate = this.parseDate(row.DogumGunu);
    const createdAt = this.parseDateTime(row.KayitTarihi);

    const customer = queryRunner.manager.create(Customer, {
      name: row.Adi || null,
      surname: row.Soyadi || null,
      email: email,
      phone: phone,
      birthDate: birthDate,
      identityNumber: row.KimlikNumarasi || null,
      address: this.cleanAddress(row.Adres),
      status: statusId,
      sourceId: sourceId,
      relevantUser: relevantUser,
      isActive: true,
      createdAt: createdAt || new Date(),
    });

    const savedCustomer = await queryRunner.manager.save(customer);
    result.created = true;

    // History: Müşteri Oluşturuldu
    const createHistory = queryRunner.manager.create(CustomerHistory, {
      customer: savedCustomer.id,
      user: 1,
      action: 'Müşteri Oluşturuldu',
      description: `Excel import - ${row.Adi || ''} ${row.Soyadi || ''}`.trim(),
      requestData: JSON.stringify({
        source: 'excel_import',
        originalData: {
          name: row.Adi,
          surname: row.Soyadi,
          email: email,
          phone: phone,
          segment: row.Segment,
          kaynak: row.Kaynak,
          atananKullanici: row['Atanan Kullanıcı'],
        },
      }),
      responseData: JSON.stringify({
        id: savedCustomer.id,
        name: savedCustomer.name,
        surname: savedCustomer.surname,
        email: savedCustomer.email,
        phone: savedCustomer.phone,
        status: statusId,
        sourceId: sourceId,
        relevantUser: relevantUser,
      }),
    });
    await queryRunner.manager.save(createHistory);
    result.historyCount++;

    if (statusId && statusId !== 1) {
      const statusChangeHistory = queryRunner.manager.create(CustomerHistory, {
        customer: savedCustomer.id,
        user: 1,
        action: 'Durum Değiştirildi',
        description: `Durum değiştirildi: YENİ -> ${statusName}`,
        requestData: JSON.stringify({
          oldStatus: 1,
          newStatus: statusId,
          oldStatusName: 'YENİ',
          newStatusName: statusName,
        }),
        responseData: null,
      });
      await queryRunner.manager.save(statusChangeHistory);
      result.historyCount++;
    }

    if (relevantUser) {
      const assignHistory = queryRunner.manager.create(CustomerHistory, {
        customer: savedCustomer.id,
        user: 1,
        action: 'Müşteri Güncellendi',
        description: `Kullanıcıya atandı: ${row['Atanan Kullanıcı']}`,
        requestData: JSON.stringify({
          relevantUser: relevantUser,
          relevantUserName: row['Atanan Kullanıcı'],
        }),
        responseData: null,
      });
      await queryRunner.manager.save(assignHistory);
      result.historyCount++;
    }

    if (row.Aciklama && row.Aciklama.trim()) {
      const customerNote = queryRunner.manager.create(CustomerNote, {
        customer: savedCustomer.id,
        note: row.Aciklama.trim(),
        user: 1,
        isReminding: false,
        noteType: 'import',
      });
      const savedNote = await queryRunner.manager.save(customerNote);
      result.noteCreated = true;

      const noteHistory = queryRunner.manager.create(CustomerHistory, {
        customer: savedCustomer.id,
        user: 1,
        action: 'Not Eklendi',
        relatedId: savedNote.id,
        description: row.Aciklama.trim().substring(0, 100) + (row.Aciklama.length > 100 ? '...' : ''),
        requestData: JSON.stringify({
          customer: savedCustomer.id,
          note: row.Aciklama.trim(),
          isReminding: false,
          noteType: 'import',
        }),
        responseData: null,
      });
      await queryRunner.manager.save(noteHistory);
      result.historyCount++;
    }

    return result;
  }

  private async processNotlarExcel(
    filePath: string,
    customerNameMap: Map<string, number>,
    userMapping: Record<string, number>,
    queryRunner: any,
    result: SyncResult,
  ): Promise<void> {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows: NotlarExcelRow[] = XLSX.utils.sheet_to_json(worksheet);

    result.notlar.totalRows = rows.length;
    this.logger.log(`Notlar.xlsx: ${rows.length} satır okundu`);

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const noteResult = await this.processNotlarRow(row, customerNameMap, userMapping, queryRunner);

        if (noteResult.created) {
          result.notlar.createdNotes++;
          result.notlar.createdHistories++;

          if (noteResult.userName) {
            result.notlar.userDistribution[noteResult.userName] =
              (result.notlar.userDistribution[noteResult.userName] || 0) + 1;
          }
        } else if (noteResult.skipped) {
          result.notlar.skippedCount++;

          if (noteResult.skipReason === 'noContent') {
            result.notlar.skippedReasons.noContent++;
          } else if (noteResult.skipReason === 'customerNotFound') {
            result.notlar.skippedReasons.customerNotFound++;
          } else if (noteResult.skipReason === 'duplicateNote') {
            result.notlar.skippedReasons.duplicateNote++;
          }
        }

        result.notlar.processedCount++;
      } catch (error) {
        const errorMsg = `Notlar Satır ${i + 2}: ${error.message}`;
        result.errors.push(errorMsg);
        this.logger.error(errorMsg);
      }
    }
  }

  private async processNotlarRow(
    row: NotlarExcelRow,
    customerNameMap: Map<string, number>,
    userMapping: Record<string, number>,
    queryRunner: any,
  ): Promise<{
    created: boolean;
    skipped: boolean;
    skipReason?: string;
    userName?: string;
  }> {
    const result = {
      created: false,
      skipped: false,
      skipReason: undefined as string | undefined,
      userName: undefined as string | undefined,
    };

    if (!row.Icerik || !row.Icerik.trim()) {
      result.skipped = true;
      result.skipReason = 'noContent';
      return result;
    }

    const kisiName = (row.Kişi || '').trim().toLowerCase();
    if (!kisiName) {
      result.skipped = true;
      result.skipReason = 'customerNotFound';
      return result;
    }

    const customerId = customerNameMap.get(kisiName);
    if (!customerId) {
      result.skipped = true;
      result.skipReason = 'customerNotFound';
      return result;
    }

    const userName = row['Sorumlu Kullanıcı'];
    const userId = userName ? userMapping[userName] : null;
    result.userName = userName || 'Sistem';

    const noteContent = row.Icerik.trim();
    const createdAt = this.parseDateTime(row.KayitTarihi);
    const remindingAt = this.parseDateTime(row.DinamikAramaTarihi);
    const isReminding = !!remindingAt;

    let existingNote = null;

    if (createdAt) {
      existingNote = await queryRunner.manager.findOne(CustomerNote, {
        where: {
          customer: customerId,
          noteType: 'import',
          createdAt: createdAt,
        },
      });
    } else {
      existingNote = await queryRunner.manager
        .createQueryBuilder(CustomerNote, 'note')
        .where('note.customer = :customerId', { customerId })
        .andWhere('note.noteType = :noteType', { noteType: 'import' })
        .andWhere('note.createdAt IS NULL')
        .andWhere('MD5(note.note) = MD5(:noteContent)', { noteContent })
        .getOne();
    }

    if (existingNote) {
      result.skipped = true;
      result.skipReason = 'duplicateNote';
      return result;
    }

    const customerNote = queryRunner.manager.create(CustomerNote, {
      customer: customerId,
      note: noteContent,
      user: userId || 1,
      isReminding: isReminding,
      remindingAt: remindingAt,
      noteType: 'import',
      createdAt: createdAt || new Date(),
    });

    const savedNote = await queryRunner.manager.save(customerNote);

    const noteHistory = queryRunner.manager.create(CustomerHistory, {
      customer: customerId,
      user: userId || 1,
      action: 'Not Eklendi',
      relatedId: savedNote.id,
      description: noteContent.substring(0, 100) + (noteContent.length > 100 ? '...' : ''),
      requestData: JSON.stringify({
        customer: customerId,
        note: noteContent,
        isReminding: isReminding,
        remindingAt: remindingAt,
        segment: row.Segment,
        source: 'excel_import_notlar',
      }),
      responseData: null,
      createdAt: createdAt || new Date(),
    });

    await queryRunner.manager.save(noteHistory);

    result.created = true;
    return result;
  }

  private cleanPhone(phone: any): string | null {
    if (!phone) return null;

    let phoneStr = String(phone).trim();
    phoneStr = phoneStr.replace(/\D/g, '');

    if (phoneStr.length < 10) return null;

    return phoneStr;
  }

  private cleanEmail(email: any): string | null {
    if (!email) return null;

    const emailStr = String(email).trim().toLowerCase();

    if (!emailStr.includes('@') || !emailStr.includes('.')) {
      return null;
    }

    return emailStr;
  }

  private cleanAddress(address: any): string | null {
    if (!address) return null;

    const addrStr = String(address).trim();

    if (addrStr === 'NULL - NULL - NULL' || addrStr.toLowerCase() === 'null') {
      return null;
    }

    return addrStr;
  }

  private parseDate(dateValue: any): string | null {
    if (!dateValue) return null;

    try {
      if (typeof dateValue === 'number') {
        const date = this.excelDateToJSDate(dateValue);
        return date.toISOString().split('T')[0];
      }

      const dateStr = String(dateValue).trim();
      if (!dateStr || dateStr.toLowerCase() === 'null') return null;

      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }

      return null;
    } catch {
      return null;
    }
  }

  private parseDateTime(dateValue: any): Date | null {
    if (!dateValue) return null;

    try {
      if (typeof dateValue === 'number') {
        return this.excelDateToJSDate(dateValue);
      }

      const dateStr = String(dateValue).trim();
      if (!dateStr || dateStr.toLowerCase() === 'null') return null;

      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date;
      }

      return null;
    } catch {
      return null;
    }
  }

  private excelDateToJSDate(serial: number): Date {
    const utcDays = Math.floor(serial - 25569);
    const utcValue = utcDays * 86400;
    const dateInfo = new Date(utcValue * 1000);

    const fractionalDay = serial - Math.floor(serial) + 0.0000001;
    let totalSeconds = Math.floor(86400 * fractionalDay);

    const seconds = totalSeconds % 60;
    totalSeconds -= seconds;

    const hours = Math.floor(totalSeconds / (60 * 60));
    const minutes = Math.floor(totalSeconds / 60) % 60;

    return new Date(
      dateInfo.getFullYear(),
      dateInfo.getMonth(),
      dateInfo.getDate(),
      hours,
      minutes,
      seconds
    );
  }
}
