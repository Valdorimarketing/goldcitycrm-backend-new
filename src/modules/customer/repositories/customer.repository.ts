import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepositoryAbstract } from '../../../core/base/repositories/base.repository.abstract';
import { Customer } from '../entities/customer.entity';

@Injectable()
export class CustomerRepository extends BaseRepositoryAbstract<Customer> {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {
    super(customerRepository);
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

  async findOneWithDynamicFields(id: number): Promise<Customer> {
    return this.getRepository().findOne({
      where: { id },
      relations: ['dynamicFieldValues', 'dynamicFieldValues.customerDynamicFieldRelation'],
    });
  }
} 