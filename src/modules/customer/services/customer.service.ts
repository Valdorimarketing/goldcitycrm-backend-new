import { Injectable, BadRequestException } from '@nestjs/common';
import { BaseService } from '../../../core/base/services/base.service';
import { Customer } from '../entities/customer.entity';
import { CustomerRepository } from '../repositories/customer.repository';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomerResponseDto,
  TodayAssignmentDto,
  MyTodayAssignmentDto,
} from '../dto/create-customer.dto';
import { CustomerQueryFilterDto } from '../dto/customer-query-filter.dto';
import { Between, DataSource, SelectQueryBuilder } from 'typeorm';
import { CustomerDynamicFieldValueService } from '../../customer-dynamic-field-value/services/customer-dynamic-field-value.service';
import { CreateCustomerDynamicFieldValueDto } from '../../customer-dynamic-field-value/dto/create-customer-dynamic-field-value.dto';
import { CustomerStatusChangeRepository } from '../../customer-status-change/repositories/customer-status-change.repository';
import { FraudAlertService } from '../../fraud-alert/services/fraud-alert.service';
import { CustomerHistoryService } from '../../customer-history/services/customer-history.service';
import { CustomerHistoryAction } from '../../customer-history/entities/customer-history.entity';
import { StatusRepository } from '../../status/repositories/status.repository';
import { Customer2ProductRepository } from '../../customer2product/repositories/customer2product.repository';
import { CustomerEngagementService } from 'src/modules/customer-engagement/services/customer-engagement.service';
import { CustomerEngagementRole } from 'src/modules/customer-engagement/entities/customer-engagement.entity';
import { StatusService } from 'src/modules/status/services/status.service';
import { Customer2DoctorService } from 'src/modules/customer2doctor/services/customer2doctor.service';
import { UserService } from 'src/modules/user/services/user.service';

@Injectable()
export class CustomerService extends BaseService<Customer> {
  constructor(
    private readonly customerRepository: CustomerRepository,
    private readonly customerHistoryService: CustomerHistoryService,
    private readonly customer2ProductRepository: Customer2ProductRepository,
    private readonly customerStatusChangeRepository: CustomerStatusChangeRepository,
    private readonly fraudAlertService: FraudAlertService,
    private readonly customerDynamicFieldValueService: CustomerDynamicFieldValueService,
    private readonly userService: UserService,
    private readonly statusService: StatusService,
    private readonly statusRepository: StatusRepository,
    private readonly customer2DoctorService: Customer2DoctorService,
    private readonly customerEngagementService: CustomerEngagementService,
    private readonly dataSource: DataSource
  ) {
    super(customerRepository, Customer);
  }

  async findByFiltersBaseQuery(
    filters: CustomerQueryFilterDto,
  ): Promise<SelectQueryBuilder<Customer>> {
    return this.customerRepository.findByFiltersBaseQuery(filters);
  }

  private async findAvailableDoctorUser() {
    // Role enum'ınıza göre değiştirin
    const doctors = await this.userService.getUsersByRole('doctor');

    // Aktif olan ilk doktoru döndür
    const activeDoctor = doctors.find(d => d.isActive === true);

    return activeDoctor || null;
  }

  async createCustomer(
    createCustomerDto: CreateCustomerDto,
  ): Promise<CustomerResponseDto> {
    const customer = await this.create(createCustomerDto, CustomerResponseDto);

    // Handle dynamic fields if provided
    if (
      createCustomerDto.dynamicFields &&
      createCustomerDto.dynamicFields.length > 0
    ) {
      const dynamicFieldValues: CreateCustomerDynamicFieldValueDto[] =
        createCustomerDto.dynamicFields.map((field) => ({
          customer: customer.id,
          customer_dynamic_field: field.customer_dynamic_field,
          file: field.file,
          name: field.name,
          type: field.type,
          options_data: field.options_data,
          order: field.order || 0,
        }));

      await this.customerDynamicFieldValueService.createMany(
        dynamicFieldValues,
      );
    }

    return customer;
  }

  async getMyTodayAssignments(userId: number): Promise<MyTodayAssignmentDto> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Kullanıcıya bugün atanan engagementları çek
    const result = await this.dataSource
      .getRepository('customer_engagement')
      .createQueryBuilder('engagement')
      // Toplam atama sayısı
      .select('COUNT(DISTINCT engagement.customer)', 'totalCount')
      // Yeni Data: URL null olmayan
      .addSelect(
        'SUM(CASE WHEN customer.url IS NOT NULL THEN 1 ELSE 0 END)',
        'newDataCount'
      )
      // Dinamik Arama: Status "Tekrar Aranacak" olan
      .addSelect(
        `SUM(CASE WHEN status.name = 'TEKRAR ARANACAK' THEN 1 ELSE 0 END)`,
        'dynamicSearchCount'
      )
      // Eski Data: URL null olan
      .addSelect(
        'SUM(CASE WHEN customer.url IS NULL THEN 1 ELSE 0 END)',
        'oldDataCount'
      )
      .leftJoin('customer', 'customer', 'customer.id = engagement.customer')
      .leftJoin('status', 'status', 'status.id = customer.status')
      .where('engagement.assignedAt BETWEEN :startOfDay AND :endOfDay', {
        startOfDay,
        endOfDay,
      })
      .andWhere('engagement.user = :userId', { userId })
      .andWhere('engagement.role = :role', { role: 'SALES' })
      .getRawOne();

    return {
      totalCount: parseInt(result?.totalCount || '0', 10),
      newDataCount: parseInt(result?.newDataCount || '0', 10),
      dynamicSearchCount: parseInt(result?.dynamicSearchCount || '0', 10),
      oldDataCount: parseInt(result?.oldDataCount || '0', 10),
    };
  }

  async getTodayAssignments(): Promise<TodayAssignmentDto[]> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // CustomerEngagement tablosundan bugünkü atamaları çek ve customer bilgilerini JOIN et
    const results = await this.dataSource
      .getRepository('customer_engagement')
      .createQueryBuilder('engagement')
      .select('user.id', 'salesRepId')
      .addSelect('user.name', 'salesRepName')
      // Toplam atama sayısı
      .addSelect('COUNT(DISTINCT engagement.customer)', 'totalCount')
      // Yeni Data: URL null olmayan
      .addSelect(
        'SUM(CASE WHEN customer.url IS NOT NULL THEN 1 ELSE 0 END)',
        'newDataCount'
      )
      // Dinamik Arama: Status "Tekrar Aranacak" olan (status ID'sini bulmanız gerekecek)
      // Örnek: status.name = 'TEKRAR ARANACAK' veya status.id = X
      .addSelect(
        `SUM(CASE WHEN status.name = 'TEKRAR ARANACAK' THEN 1 ELSE 0 END)`,
        'dynamicSearchCount'
      )
      // Eski Data: URL null olan
      .addSelect(
        'SUM(CASE WHEN customer.url IS NULL THEN 1 ELSE 0 END)',
        'oldDataCount'
      )
      .leftJoin('user', 'user', 'user.id = engagement.user')
      .leftJoin('customer', 'customer', 'customer.id = engagement.customer')
      .leftJoin('status', 'status', 'status.id = customer.status')
      .where('engagement.assignedAt BETWEEN :startOfDay AND :endOfDay', {
        startOfDay,
        endOfDay,
      })
      .andWhere('engagement.role = :role', { role: 'SALES' })
      .groupBy('user.id')
      .addGroupBy('user.name')
      .orderBy('totalCount', 'DESC')
      .getRawMany();

    return results.map((result) => ({
      salesRepId: result.salesRepId,
      salesRepName: `${result.salesRepName || ''} ${result.salesRepSurname || ''}`.trim(),
      totalCount: parseInt(result.totalCount, 10),
      newDataCount: parseInt(result.newDataCount, 10) || 0,
      dynamicSearchCount: parseInt(result.dynamicSearchCount, 10) || 0,
      oldDataCount: parseInt(result.oldDataCount, 10) || 0,
    }));
  }



  // customers.service.ts
  async getDynamicSearchUserStats() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const results = await this.dataSource
      .createQueryBuilder()
      .select('u.id', 'id')
      .addSelect('u.name', 'name')
      .addSelect('COUNT(c.id)', 'total')
      .addSelect(`SUM(CASE WHEN c.remindingDate < :now THEN 1 ELSE 0 END)`, 'overdue')
      .addSelect(`SUM(CASE WHEN c.remindingDate >= :today AND c.remindingDate < :tomorrow THEN 1 ELSE 0 END)`, 'today')
      .addSelect(`SUM(CASE WHEN c.remindingDate >= :tomorrow THEN 1 ELSE 0 END)`, 'upcoming')
      .from('user', 'u')
      .leftJoin('customer', 'c', 'c.relevantUser = u.id AND c.status IN (:...remindableStatuses)')
      .where('u.role = :role', { role: 'user' })
      .setParameters({ now, today, tomorrow, remindableStatuses: [2] })
      .groupBy('u.id, u.name')
      .getRawMany();

    return results.map(r => ({
      id: r.id,
      name: r.name,
      total: parseInt(r.total) || 0,
      overdue: parseInt(r.overdue) || 0,
      today: parseInt(r.today) || 0,
      upcoming: parseInt(r.upcoming) || 0
    }));
  }


  /**
     * Müşterileri Excel veya CSV formatında dışa aktarır
     * 
     * @param format - 'excel' veya 'csv'
     * @param userId - İşlemi yapan kullanıcı ID'si (yetki kontrolü için)
     * @param filters - Filtreleme parametreleri
     * @param selectedColumns - Dışa aktarılacak sütunlar
     * @param exportAll - true ise pagination olmadan tüm filtrelenmiş kayıtları al
     */
  async exportCustomers(
    format: 'excel' | 'csv',
    userId: number,
    filters: CustomerQueryFilterDto,
    selectedColumns?: string[],
    exportAll?: boolean
  ): Promise<Buffer> {
    return this.customerRepository.exportCustomers(
      format,
      userId,
      filters,
      selectedColumns,
      exportAll
    );
  }


  async updateCustomer(
    id: number,
    updateCustomerDto: UpdateCustomerDto,
  ): Promise<CustomerResponseDto> {

    //-- 1) Mevcut müşteri verisini alıyoruz
    const currentCustomer = await this.findOneById(id);
    const oldStatus = currentCustomer?.status;
    const previousRelevantUser = currentCustomer?.relevantUser;

    //-- 2) Status değişimi varsa reminding_date yönetimi
    if (updateCustomerDto.status) {
      const status = await this.statusRepository.findOneById(updateCustomerDto.status);

      if (status?.isSale) {
        const customerProducts =
          await this.customer2ProductRepository.findByCustomer(id);

        if (!customerProducts || customerProducts.length === 0) {
          throw new BadRequestException(
            'Durumu satışa çekemezsiniz. Müşteriye hizmet girilmemiş',
          );
        }


        // ✅ SATIŞA ÇEKİLDİYSE AKTİF ENGAGEMENT'I KAPAT
        await this.customerEngagementService.releaseCustomer(id, 'SATILDI');
      }

      if (status?.isRemindable && status.remindingDay) {
        const today = new Date();
        const remindingDate = new Date(today);
        remindingDate.setDate(today.getDate() + status.remindingDay);
        updateCustomerDto.remindingDate = remindingDate;
      } else {
        updateCustomerDto.remindingDate = null;
      }
    }

    // ✅ let yerine const kullanmayın, scope sorunu olabilir
    let engagementHandled = false;

    console.log('🎯 BAŞLANGIÇ - engagementHandled:', engagementHandled);

    //------------------------------------------------------------
    //-- 3) ENGAGEMENT YÖNETİMİ
    //------------------------------------------------------------
    if (updateCustomerDto.status && oldStatus !== updateCustomerDto.status) {
      console.log('🔄 Status değişikliği tespit edildi');

      const newStatus = await this.statusService.findOneById(updateCustomerDto.status);
      const oldStatusEntity = oldStatus ? await this.statusRepository.findOneById(oldStatus) : null;

      console.log('📊 Status kontrol:', {
        isDoctor: newStatus?.isDoctor,
        wasDoctor: oldStatusEntity?.isDoctor,
      });

      console.log('📊 Status detayları:', {
        oldStatus: {
          id: oldStatusEntity?.id,
          name: oldStatusEntity?.name,
          isDoctor: oldStatusEntity?.isDoctor,
        },
        newStatus: {
          id: newStatus?.id,
          name: newStatus?.name,
          isDoctor: newStatus?.isDoctor,
        },
      });

      //--- ÖZEL DURUM 1: SALES → DOCTOR GEÇİŞİ
      if (newStatus?.isDoctor && !oldStatusEntity?.isDoctor) {
        console.log('🏥 DOCTOR GEÇİŞİ TETİKLENDİ');

        const doctorUser = await this.findAvailableDoctorUser();

        if (doctorUser) {
          const previousEngagement = await this.customerEngagementService.getActiveEngagement(id);
          const firstCallAt = (previousEngagement as any)?.firstCallAt || null;
          const previousSalesUserId = (previousEngagement as any)?.user?.id || previousRelevantUser;

          await this.customerEngagementService.closeSalesEngagements(id);

          const whoCanSee = [doctorUser.id];
          if (previousSalesUserId && previousSalesUserId !== doctorUser.id) {
            whoCanSee.push(previousSalesUserId);
          }

          await this.customerEngagementService.startEngagement(
            {
              customer: id,
              user: doctorUser.id,
              role: CustomerEngagementRole.DOCTOR,
              assignedAt: new Date(),
              meta: {
                inheritedFirstCallAt: firstCallAt,
                previousSalesUser: previousSalesUserId,
              },
            } as any,
            whoCanSee,
          );

          engagementHandled = true;
          console.log('✅ DOCTOR engagement açıldı, engagementHandled:', engagementHandled);
        }
      }
      //--- ÖZEL DURUM 2: DOCTOR → SALES GERİ DÖNÜŞÜ
      else if (oldStatusEntity?.isDoctor && !newStatus?.isDoctor) {
        console.log('👤 SALES GERİ DÖNÜŞÜ TETİKLENDİ');

        await this.customerEngagementService.closeDoctorEngagements(id);

        if (previousRelevantUser) {
          await this.customerEngagementService.startEngagement(
            {
              customer: id,
              user: previousRelevantUser,
              role: CustomerEngagementRole.SALES,
              assignedAt: new Date(),
              meta: {
                returnedFromDoctor: true,
              },
            } as any,
            [previousRelevantUser],
          );

          engagementHandled = true;
          console.log('✅ SALES engagement açıldı, engagementHandled:', engagementHandled);
        }
      }
      //--- DİĞER TÜM DURUM DEĞİŞİKLİKLERİ
      else {
        console.log('📝 Normal durum değişikliği');

        await this.customerEngagementService.closeAllEngagements(id);

        if (updateCustomerDto.user) {
          await this.customerEngagementService.registerStatusChange(id, updateCustomerDto.user);
        }

        engagementHandled = true;
        console.log('✅ Engagement kapatıldı, engagementHandled:', engagementHandled);
      }
    }

    console.log('🔍 BÖLÜM 4 ÖNCESİ - engagementHandled:', engagementHandled);

    //------------------------------------------------------------
    //-- 4) SATIŞÇI ATAMASI
    //------------------------------------------------------------
    // ✅ Extra kontrol: Eğer doktor sürecine girildiyse atla
    const isDoctorProcess = updateCustomerDto.status &&
      (await this.statusService.findOneById(updateCustomerDto.status))?.isDoctor;

    if (
      !engagementHandled &&
      !isDoctorProcess && // ✅ YENİ KONTROL - Doktor sürecinde atla
      updateCustomerDto.relevantUser &&
      updateCustomerDto.relevantUser !== previousRelevantUser
    ) {
      console.log('👤 BÖLÜM 4 ÇALIŞIYOR - Yeni kullanıcı ataması');

      await this.customerEngagementService.closeSalesEngagements(id);

      await this.customerEngagementService.startEngagement(
        {
          customer: id,
          user: updateCustomerDto.relevantUser,
          role: CustomerEngagementRole.SALES,
          assignedAt: new Date(),
        } as any,
        [updateCustomerDto.relevantUser],
      );

      console.log('👤 Yeni kullanıcıya SALES engagement açıldı');
    } else {
      console.log('⏭️ BÖLÜM 4 ATLANDI', {
        engagementHandled,
        isDoctorProcess, // ✅ Log'a ekle
        hasRelevantUser: !!updateCustomerDto.relevantUser,
        userChanged: updateCustomerDto.relevantUser !== previousRelevantUser,
      });
    }


    //------------------------------------------------------------
    //-- 5) Asıl müşteri güncellemesini yapıyoruz
    //------------------------------------------------------------
    const customer = await this.update(
      updateCustomerDto,
      id,
      CustomerResponseDto,
    );

    //------------------------------------------------------------
    //-- 6) Customer History Loglama
    //------------------------------------------------------------
    await this.customerHistoryService.logCustomerAction(
      id,
      CustomerHistoryAction.CUSTOMER_UPDATED,
      'Müşteri bilgileri güncellendi',
      updateCustomerDto,
      customer,
      updateCustomerDto.user,
    );

    //------------------------------------------------------------
    //-- 7) Status Change Loglama + Fraud Check
    //------------------------------------------------------------
    if (
      updateCustomerDto.status &&
      oldStatus !== updateCustomerDto.status &&
      updateCustomerDto.user
    ) {
      // ✅ oldStatus ve newStatus'u number'a çevir
      const oldStatusId = typeof oldStatus === 'string' ? parseInt(oldStatus, 10) : (oldStatus || 0);
      const newStatusId = typeof updateCustomerDto.status === 'string'
        ? parseInt(updateCustomerDto.status, 10)
        : updateCustomerDto.status;

      await this.customerStatusChangeRepository.create({
        user_id: updateCustomerDto.user,
        customer_id: id,
        old_status: oldStatusId,
        new_status: newStatusId,
      });

      const oldStatusName = oldStatus
        ? (await this.statusRepository.findOneById(oldStatus))?.name
        : 'Belirtilmemiş';

      const newStatusName = (
        await this.statusRepository.findOneById(updateCustomerDto.status)
      )?.name || 'Belirtilmemiş';

      await this.customerHistoryService.logCustomerAction(
        id,
        CustomerHistoryAction.STATUS_CHANGE,
        `Durum değiştirildi: ${oldStatusName} -> ${newStatusName}`,
        { oldStatus: oldStatus || 0, newStatus: updateCustomerDto.status },
        null,
        updateCustomerDto.user,
      );

      const uniqueCustomerChanges =
        await this.customerStatusChangeRepository.getUniqueCustomerChangesCount(
          updateCustomerDto.user,
          updateCustomerDto.status,
          5,
        );

      if (uniqueCustomerChanges >= 3) {
        await this.fraudAlertService.createFraudAlert({
          userId: updateCustomerDto.user,
          message: `Kullanıcı ${updateCustomerDto.user} son 5 dakika içinde ${uniqueCustomerChanges} farklı müşterinin durumunu ${updateCustomerDto.status} olarak değiştirdi.`,
          isRead: false,
          isChecked: false,
        });
      }
    }

    //------------------------------------------------------------
    //-- 8) Dynamic Fields Yönetimi
    //------------------------------------------------------------
    if (updateCustomerDto.dynamicFields) {
      await this.customerDynamicFieldValueService.deleteByCustomerId(id);

      if (updateCustomerDto.dynamicFields.length > 0) {
        const dynamicFieldValues = updateCustomerDto.dynamicFields.map((field) => ({
          customer: id,
          customer_dynamic_field: field.customer_dynamic_field,
          file: field.file,
          name: field.name,
          type: field.type,
          options_data: field.options_data,
          order: field.order || 0,
        }));

        await this.customerDynamicFieldValueService.createMany(dynamicFieldValues);
      }
    }

    return customer;
  }


























  async getCustomerById(id: number, userId?: number): Promise<Customer> {
    console.log('🔍 getCustomerById çağrıldı:', { id, userId });

    const customer = await this.customerRepository.findOneWithDynamicFields(id);

    // Get active engagement for this customer
    const activeEngagement = await this.customerEngagementService.getActiveEngagement(id) as any;


    if (activeEngagement && userId) {
      // ✅ whoCanSee kontrolü
      const whoCanSee = activeEngagement.whoCanSee || [];
      const canViewEngagement = whoCanSee.includes(userId);


      if (canViewEngagement) {

        console.log('👀 Profile view kaydediliyor...');

        // Profile view = First Touch
        await this.customerEngagementService.registerProfileView(id, userId);

        (customer as any).activeEngagement = {
          id: activeEngagement.id,
          userId: activeEngagement.user?.id,
          userName: activeEngagement.user?.name,
          role: activeEngagement.role,
          assignedAt: activeEngagement.assignedAt,
          startedAt: activeEngagement.startedAt,
          firstTouchAt: activeEngagement.firstTouchAt,
          firstCallAt: activeEngagement.firstCallAt,
          lastTouchAt: activeEngagement.lastTouchAt,
        };
      }
    }

    return customer;
  }



  async getAllCustomers(): Promise<Customer[]> {
    return this.findAll();
  }

  async getCustomersByEmail(email: string): Promise<Customer[]> {
    return this.customerRepository.findByEmail(email);
  }

  async getCustomersByPhone(phone: string): Promise<Customer[]> {
    return this.customerRepository.findByPhone(phone);
  }

  async getCustomersByStatus(status: number): Promise<Customer[]> {
    return this.customerRepository.findByStatus(status);
  }

  async getActiveCustomers(): Promise<Customer[]> {
    return this.customerRepository.findActiveCustomers();
  }

  async deleteCustomer(id: number): Promise<Customer> {
    // Delete dynamic field values first
    await this.customerDynamicFieldValueService.deleteByCustomerId(id);

    // Delete customer
    return this.remove(id);
  }

  async checkPhoneExists(phone: string): Promise<boolean> {
    const customers = await this.customerRepository.findByPhone(phone);
    return customers.length > 0;
  }
}