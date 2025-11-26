import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { BaseRepositoryAbstract } from '../../../core/base/repositories/base.repository.abstract';
import { Customer } from '../entities/customer.entity';
import { CustomerQueryFilterDto } from '../dto/customer-query-filter.dto';
import { instanceToPlain } from 'class-transformer';
import { endOfDay, startOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays } from 'date-fns';
import { User } from 'src/modules/user/entities/user.entity';

@Injectable()
export class CustomerRepository extends BaseRepositoryAbstract<Customer> {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    private dataSource: DataSource
  ) {
    super(customerRepository);
  }


  async exportCustomers(
    format: 'excel' | 'csv',
    userId: number,
    filters: CustomerQueryFilterDto,
    selectedColumns?: string[]
  ): Promise<Buffer> {

    const queryBuilder = this.customerRepository.createQueryBuilder('customer')
      .leftJoinAndSelect('customer.source', 'source')
      .leftJoinAndSelect('customer.statusData', 'statusData')
      .leftJoinAndSelect('customer.relevantUserData', 'relevantUserData')
      .leftJoinAndSelect('customer.referanceCustomerData', 'referanceCustomerData')
      .orderBy('customer.createdAt', 'DESC');

    // Kullanıcı admin değilse sadece kendi müşterilerini görsün
    const user = await this.dataSource.getRepository(User).findOne({
      where: { id: userId },
      select: ['id', 'role']
    });

    const customers = await queryBuilder.getMany();

    if (format === 'excel') {
      return this.generateExcel(customers, selectedColumns);
    } else {
      return this.generateCSV(customers, selectedColumns);
    }
  }


  async getMyTodayAssignments(userId: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Bugün atanan tüm müşteriler
    const todayAssignments = await this.customerRepository
      .createQueryBuilder('customer')
      .where('customer.relevantUser = :userId', { userId })
      .andWhere('customer.createdAt >= :today', { today })
      .andWhere('customer.createdAt < :tomorrow', { tomorrow })
      .getMany();

    // 7 günden eski kayıtları "eski data" olarak say
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    let newDataCount = 0;
    let dynamicSearchCount = 0;
    let oldDataCount = 0;

    todayAssignments.forEach(customer => {
      const createdDate = new Date(customer.createdAt);

      // Eğer müşteri 7 günden önce oluşturulmuşsa -> Eski Data
      if (createdDate < sevenDaysAgo) {
        oldDataCount++;
      }
      // Müşteri source'una göre dinamik arama mı değil mi?
      // Bu kısmı kendi source yapınıza göre ayarlayın
      else if (customer.sourceId === 2) {
        dynamicSearchCount++;
      }
      // Diğerleri yeni data
      else {
        newDataCount++;
      }
    });

    return {
      totalCount: todayAssignments.length,
      newDataCount,
      dynamicSearchCount,
      oldDataCount
    };
  }

  private generateExcel(customers: Customer[], selectedColumns?: string[]): Promise<Buffer> {
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Müşteriler');

    // Tüm sütun tanımları
    const allColumns = [
      { key: 'id', header: 'ID', width: 10 },
      { key: 'name', header: 'Ad', width: 20 },
      { key: 'surname', header: 'Soyad', width: 20 },
      { key: 'title', header: 'Unvan', width: 15 },
      { key: 'email', header: 'E-posta', width: 30 },
      { key: 'gender', header: 'Cinsiyet', width: 10 },
      { key: 'birthDate', header: 'Doğum Tarihi', width: 15 },
      { key: 'patient', header: 'Hastalık', width: 20 },
      { key: 'phone', header: 'Telefon', width: 15 },
      { key: 'source', header: 'Kaynak', width: 15 },
      { key: 'job', header: 'Meslek', width: 15 },
      { key: 'identityNumber', header: 'TC Kimlik No', width: 15 },
      { key: 'referanceCustomer', header: 'Referans Müşteri', width: 20 },
      { key: 'status', header: 'Durum', width: 15 },
      { key: 'website', header: 'Web Sitesi', width: 30 },
      { key: 'country', header: 'Ülke', width: 15 },
      { key: 'state', header: 'İl', width: 15 },
      { key: 'city', header: 'İlçe', width: 15 },
      { key: 'district', header: 'Mahalle', width: 15 },
      { key: 'postalCode', header: 'Posta Kodu', width: 12 },
      { key: 'address', header: 'Adres', width: 40 },
      { key: 'url', header: 'URL', width: 30 },
      { key: 'checkupPackage', header: 'Checkup Paketi', width: 20 },
      { key: 'relevantUser', header: 'Atanan Kullanıcı', width: 20 },
      { key: 'description', header: 'Açıklama', width: 40 },
      { key: 'relatedTransaction', header: 'İlgilenilen Konu', width: 30 },
      { key: 'remindingDate', header: 'Hatırlatma Tarihi', width: 18 },
      { key: 'isActive', header: 'Aktif', width: 10 },
      { key: 'createdAt', header: 'Eklenme Tarihi', width: 18 },
      { key: 'updatedAt', header: 'Güncellenme Tarihi', width: 18 },
    ];

    // Seçilen sütunları filtrele
    const columns = selectedColumns && selectedColumns.length > 0
      ? allColumns.filter(col => selectedColumns.includes(col.key))
      : allColumns;

    worksheet.columns = columns;

    // Başlık satırı stilini ayarla
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Verileri ekle
    customers.forEach((customer) => {
      const rowData = {};

      columns.forEach(col => {
        switch (col.key) {
          case 'id':
            rowData[col.key] = customer.id;
            break;
          case 'name':
            rowData[col.key] = customer.name || '-';
            break;
          case 'surname':
            rowData[col.key] = customer.surname || '-';
            break;
          case 'title':
            rowData[col.key] = customer.title || '-';
            break;
          case 'email':
            rowData[col.key] = customer.email || '-';
            break;
          case 'gender':
            rowData[col.key] = customer.gender || '-';
            break;
          case 'birthDate':
            rowData[col.key] = customer.birthDate || '-';
            break;
          case 'patient':
            rowData[col.key] = customer.patient || '-';
            break;
          case 'phone':
            rowData[col.key] = customer.phone || '-';
            break;
          case 'source':
            rowData[col.key] = customer.source?.name || '-';
            break;
          case 'job':
            rowData[col.key] = customer.job || '-';
            break;
          case 'identityNumber':
            rowData[col.key] = customer.identityNumber || '-';
            break;
          case 'referanceCustomer':
            rowData[col.key] = customer.referanceCustomerData?.name || '-';
            break;
          case 'status':
            rowData[col.key] = customer.statusData?.name || '-';
            break;
          case 'website':
            rowData[col.key] = customer.website || '-';
            break;
          case 'country':
            rowData[col.key] = customer.country || '-';
            break;
          case 'state':
            rowData[col.key] = customer.state || '-';
            break;
          case 'city':
            rowData[col.key] = customer.city || '-';
            break;
          case 'district':
            rowData[col.key] = customer.district || '-';
            break;
          case 'postalCode':
            rowData[col.key] = customer.postalCode || '-';
            break;
          case 'address':
            rowData[col.key] = customer.address || '-';
            break;
          case 'url':
            rowData[col.key] = customer.url || '-';
            break;
          case 'checkupPackage':
            rowData[col.key] = customer.checkup_package || '-';
            break;
          case 'relevantUser':
            rowData[col.key] = customer.relevantUserData?.name || '-';
            break;
          case 'description':
            rowData[col.key] = customer.description || '-';
            break;
          case 'relatedTransaction':
            rowData[col.key] = customer.relatedTransaction || '-';
            break;
          case 'remindingDate':
            rowData[col.key] = customer.remindingDate
              ? new Date(customer.remindingDate).toLocaleDateString('tr-TR')
              : '-';
            break;
          case 'isActive':
            rowData[col.key] = customer.isActive ? 'Aktif' : 'Pasif';
            break;
          case 'createdAt':
            rowData[col.key] = customer.createdAt
              ? new Date(customer.createdAt).toLocaleDateString('tr-TR')
              : '-';
            break;
          case 'updatedAt':
            rowData[col.key] = customer.updatesAt
              ? new Date(customer.updatesAt).toLocaleDateString('tr-TR')
              : '-';
            break;
        }
      });

      worksheet.addRow(rowData);
    });

    return workbook.xlsx.writeBuffer();
  }



  private generateCSV(customers: Customer[], selectedColumns?: string[]): Buffer {
    // Tüm sütunlar
    const allColumnsMap = {
      id: 'ID',
      name: 'Ad',
      surname: 'Soyad',
      title: 'Unvan',
      email: 'E-posta',
      gender: 'Cinsiyet',
      birthDate: 'Doğum Tarihi',
      patient: 'Hastalık',
      phone: 'Telefon',
      source: 'Kaynak',
      job: 'Meslek',
      identityNumber: 'TC Kimlik No',
      referanceCustomer: 'Referans Müşteri',
      status: 'Durum',
      website: 'Web Sitesi',
      country: 'Ülke',
      state: 'İl',
      city: 'İlçe',
      district: 'Mahalle',
      postalCode: 'Posta Kodu',
      address: 'Adres',
      url: 'URL',
      checkupPackage: 'Checkup Paketi',
      relevantUser: 'Atanan Kullanıcı',
      description: 'Açıklama',
      relatedTransaction: 'İlgilenilen Konu',
      remindingDate: 'Hatırlatma Tarihi',
      isActive: 'Aktif',
      createdAt: 'Eklenme Tarihi',
      updatedAt: 'Güncellenme Tarihi',
    };

    // Seçilen sütunları al
    const columnsToExport = selectedColumns && selectedColumns.length > 0
      ? selectedColumns
      : Object.keys(allColumnsMap);

    const headers = columnsToExport.map(key => allColumnsMap[key]);

    const rows = customers.map((customer) => {
      return columnsToExport.map(key => {
        switch (key) {
          case 'id': return customer.id;
          case 'name': return customer.name || '-';
          case 'surname': return customer.surname || '-';
          case 'title': return customer.title || '-';
          case 'email': return customer.email || '-';
          case 'gender': return customer.gender || '-';
          case 'birthDate': return customer.birthDate || '-';
          case 'patient': return customer.patient || '-';
          case 'phone': return customer.phone || '-';
          case 'source': return customer.source?.name || '-';
          case 'job': return customer.job || '-';
          case 'identityNumber': return customer.identityNumber || '-';
          case 'referanceCustomer': return customer.referanceCustomerData?.name || '-';
          case 'status': return customer.statusData?.name || '-';
          case 'website': return customer.website || '-';
          case 'country': return customer.country || '-';
          case 'state': return customer.state || '-';
          case 'city': return customer.city || '-';
          case 'district': return customer.district || '-';
          case 'postalCode': return customer.postalCode || '-';
          case 'address': return customer.address || '-';
          case 'url': return customer.url || '-';
          case 'checkupPackage': return customer.checkup_package || '-';
          case 'relevantUser': return customer.relevantUserData?.name || '-';
          case 'description': return customer.description || '-';
          case 'relatedTransaction': return customer.relatedTransaction || '-';
          case 'remindingDate':
            return customer.remindingDate
              ? new Date(customer.remindingDate).toLocaleDateString('tr-TR')
              : '-';
          case 'isActive': return customer.isActive ? 'Aktif' : 'Pasif';
          case 'createdAt':
            return customer.createdAt
              ? new Date(customer.createdAt).toLocaleDateString('tr-TR')
              : '-';
          case 'updatedAt':
            return customer.updatesAt
              ? new Date(customer.updatesAt).toLocaleDateString('tr-TR')
              : '-';
          default: return '-';
        }
      });
    });

    // CSV içeriğini oluştur
    const csvContent = [
      headers.join(','),
      ...rows.map(row =>
        row.map(cell =>
          typeof cell === 'string' && cell.includes(',')
            ? `"${cell}"`
            : cell
        ).join(',')
      )
    ].join('\n');

    // UTF-8 BOM ekleyerek Türkçe karakterlerin doğru görünmesini sağla
    const BOM = '\uFEFF';
    return Buffer.from(BOM + csvContent, 'utf-8');
  }



  async findByFiltersBaseQuery(
    filters: CustomerQueryFilterDto,
  ): Promise<SelectQueryBuilder<Customer>> {
    const queryBuilder = await super.findByFiltersBaseQuery(filters);

    // 🧩 SOURCE RELATION & FILTER 
    queryBuilder.leftJoinAndSelect('customer.source', 'source');
    queryBuilder.leftJoinAndSelect('customer.relevantUserData', 'relevantUserData');
    queryBuilder.leftJoinAndSelect('customer.statusData', 'statusData');

    // 🔍 Search filter
    if (filters.search) {
      queryBuilder.andWhere(
        `(customer.name LIKE :search 
      OR customer.surname LIKE :search 
      OR customer.email LIKE :search 
      OR customer.url LIKE :search 
      OR customer.checkup_package LIKE :search 
      OR customer.phone LIKE :search 
      OR customer.identity_number LIKE :search)`,
        { search: `%${filters.search}%` },
      );
    }

      // 🟢 Status filter - Çoklu ID desteği
    if (filters.status !== undefined && filters.status !== null) {
      const statusValue = String(filters.status); // ✅ String'e çevir
      
      // Virgül içeriyorsa çoklu status
      if (statusValue.includes(',')) {
        const statusIds = statusValue.split(',').map(id => parseInt(id.trim(), 10));
        queryBuilder.andWhere('customer.status IN (:...statusIds)', { statusIds });
      } 
      // Tek status
      else {
        const statusId = parseInt(statusValue, 10);
        queryBuilder.andWhere('customer.status = :status', { status: statusId });
      }
    }

    // 🟣 Active filter
    if (filters.isActive !== undefined && filters.isActive !== null) {
      queryBuilder.andWhere('customer.isActive = :isActive', {
        isActive: filters.isActive,
      });
    }

    // 👤 Relevant user filter
    if (filters.relevantUser !== undefined && filters.relevantUser !== null) {
      queryBuilder.andWhere('customer.relevant_user = :relevantUser', {
        relevantUser: filters.relevantUser,
      });
    }

    // 🔗 Status table join (only if status-related filters exist)
    const needsStatusJoin =
      filters.isFirst !== undefined ||
      filters.isDoctor !== undefined ||
      filters.isPricing !== undefined;

    if (needsStatusJoin) {
      queryBuilder.leftJoin('status', 'status', 'customer.status = status.id');
    }

    // 🔹 Status-based filters
    if (filters.isFirst !== undefined && filters.isFirst !== null) {
      queryBuilder.andWhere('status.is_first = :isFirst', {
        isFirst: filters.isFirst,
      });
    }

    if (filters.isDoctor !== undefined && filters.isDoctor !== null) {
      queryBuilder.andWhere('status.is_doctor = :isDoctor', {
        isDoctor: filters.isDoctor,
      });
    }

    if (filters.isPricing !== undefined && filters.isPricing !== null) {
      queryBuilder.andWhere('status.is_pricing = :isPricing', {
        isPricing: filters.isPricing,
      });
    }

    // 🔗 Relevant user filled/empty filter
    if (filters.hasRelevantUser !== undefined && filters.hasRelevantUser !== null) {
      if (filters.hasRelevantUser) {
        queryBuilder.andWhere(
          'customer.relevant_user IS NOT NULL AND customer.relevant_user != 0',
        );
      } else {
        queryBuilder.andWhere(
          '(customer.relevant_user IS NULL OR customer.relevant_user = 0)',
        );
      }
    }

    // 📆 Date filtering
    if (
      filters.dateFilter &&
      filters.dateFilter !== 'all' && // ✅ AND operatörü
      (filters.dateFilter !== 'custom' || filters.startDate || filters.endDate)
    ) {
      const now = new Date();
      let startDate: Date | undefined;
      let endDate: Date | undefined;

      switch (filters.dateFilter) {
        case 'today':
          endDate = endOfDay(now);
          break;
        case 'today-only':
          startDate = startOfDay(now);
          endDate = endOfDay(now);
          break;
        case 'tomorrow':
          startDate = startOfDay(addDays(now, 1));
          endDate = endOfDay(addDays(now, 1));
          break;
        case 'week':
          startDate = startOfWeek(now, { weekStartsOn: 1 });
          endDate = endOfWeek(now, { weekStartsOn: 1 });
          break;
        case 'month':
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
          break;
        case 'overdue':
          endDate = startOfDay(now);
          break;
        case 'custom':
          if (filters.startDate) startDate = new Date(filters.startDate);
          if (filters.endDate) endDate = new Date(filters.endDate);
          break;
      }

      // Tarih aralıkları belirlendiyse uygula
      if (startDate || endDate) {
        if (startDate && endDate) {
          queryBuilder.andWhere(
            'customer.reminding_date BETWEEN :startDate AND :endDate',
            { startDate, endDate },
          );
        } else if (startDate) {
          queryBuilder.andWhere('customer.reminding_date >= :startDate', {
            startDate,
          });
        } else if (endDate) {
          queryBuilder.andWhere('customer.reminding_date <= :endDate', {
            endDate,
          });
        }
      }
    }

    // 📋 Order
    queryBuilder.orderBy('customer.id', 'DESC');

    return queryBuilder;
  }

  async findByEmail(email: string): Promise<Customer[]> {
    return this.getRepository().find({
      where: { email },
    });
  }

  async findByPhone(phone: string): Promise<Customer[]> {
    return this.getRepository().find({
      where: { phone },
    });
  }

  async findByStatus(status: number): Promise<Customer[]> {
    return this.getRepository().find({
      where: { status },
    });
  }

  async findActiveCustomers(): Promise<Customer[]> {
    return this.getRepository().find({
      where: { isActive: true },
    });
  }



  async findOneWithDynamicFields(id: number): Promise<any> {
    const data = await this.getRepository().findOne({
      where: { id },
      relations: [
        'referanceCustomerData',
        'relevantUserData',
        'dynamicFieldValues',
        'dynamicFieldValues.customerDynamicFieldRelation',
      ],
    });

    return instanceToPlain(data, { excludeExtraneousValues: true });
  }
} 
