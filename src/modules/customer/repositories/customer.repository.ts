import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { BaseRepositoryAbstract } from '../../../core/base/repositories/base.repository.abstract';
import { Customer } from '../entities/customer.entity';
import { CustomerQueryFilterDto } from '../dto/customer-query-filter.dto';
import { instanceToPlain } from 'class-transformer';
import { endOfDay, startOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays } from 'date-fns';

@Injectable()
export class CustomerRepository extends BaseRepositoryAbstract<Customer> {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {
    super(customerRepository);
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

    // 🟢 Status filter
    if (filters.status !== undefined && filters.status !== null) {
      queryBuilder.andWhere('customer.status = :status', {
        status: filters.status,
      });
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
      filters.dateFilter !== 'all' || // 👈 all ise tarih filtresi uygulanmaz
      filters.startDate ||
      filters.endDate
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

      // 👇 'all' değilse ve tarih aralıkları varsa where koşullarını uygula
      if (filters.dateFilter !== 'all') {
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
