import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { BaseRepositoryAbstract } from '../../../core/base/repositories/base.repository.abstract';
import { Customer } from '../entities/customer.entity';
import { CustomerQueryFilterDto } from '../dto/customer-query-filter.dto';
import { instanceToPlain } from 'class-transformer';

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

    // Search functionality
    if (filters.search) {
      queryBuilder.andWhere(
        '(customer.name LIKE :search OR customer.surname LIKE :search OR customer.email LIKE :search OR customer.phone LIKE :search OR customer.identity_number LIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    // Status filter
    if (filters.status !== undefined && filters.status !== null) {
      queryBuilder.andWhere('customer.status = :status', {
        status: filters.status,
      });
    }

    // Active state filter
    if (filters.isActive !== undefined && filters.isActive !== null) {
      queryBuilder.andWhere('customer.isActive = :isActive', {
        isActive: filters.isActive,
      });
    }

    // Relevant user filter
    if (filters.relevantUser !== undefined && filters.relevantUser !== null) {
      queryBuilder.andWhere('customer.relevant_user = :relevantUser', {
        relevantUser: filters.relevantUser,
      });
    }

    // Join status table if any status property filter is applied
    const needsStatusJoin =
      (filters.isFirst !== undefined && filters.isFirst !== null) ||
      (filters.isDoctor !== undefined && filters.isDoctor !== null) ||
      (filters.isPricing !== undefined && filters.isPricing !== null);

    if (needsStatusJoin) {
      queryBuilder.leftJoin('status', 'status', 'customer.status = status.id');
    }

    // Filter by status.is_first property
    if (filters.isFirst !== undefined && filters.isFirst !== null) {
      queryBuilder.andWhere('status.is_first = :isFirst', {
        isFirst: filters.isFirst,
      });
    }

    // Filter by status.is_doctor property
    if (filters.isDoctor !== undefined && filters.isDoctor !== null) {
      queryBuilder.andWhere('status.is_doctor = :isDoctor', {
        isDoctor: filters.isDoctor,
      });
    }

    // Filter by status.is_pricing property
    if (filters.isPricing !== undefined && filters.isPricing !== null) {
      queryBuilder.andWhere('status.is_pricing = :isPricing', {
        isPricing: filters.isPricing,
      });
    }

    // Filter by whether relevant_user is filled or empty
    if (
      filters.hasRelevantUser !== undefined &&
      filters.hasRelevantUser !== null
    ) {
      if (filters.hasRelevantUser) {
        queryBuilder.andWhere('customer.relevant_user IS NOT NULL');
      } else {
        queryBuilder.andWhere('customer.relevant_user IS NULL');
      }
    }

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
        'relevantUserData',
        'dynamicFieldValues',
        'dynamicFieldValues.customerDynamicFieldRelation',
      ],
    });

    return instanceToPlain(data, { excludeExtraneousValues: true });
  }
} 
