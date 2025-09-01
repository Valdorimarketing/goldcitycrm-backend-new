import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BaseRepositoryAbstract } from '../../../core/base/repositories/base.repository.abstract';
import { CustomerDynamicFieldValue } from '../entities/customer-dynamic-field-value.entity';

@Injectable()
export class CustomerDynamicFieldValueRepository extends BaseRepositoryAbstract<CustomerDynamicFieldValue> {
  constructor(private dataSource: DataSource) {
    super(dataSource.getRepository(CustomerDynamicFieldValue));
  }

  async findByCustomerId(customerId: number): Promise<CustomerDynamicFieldValue[]> {
    return this.getRepository().find({
      where: { customer: customerId },
      relations: ['customerDynamicFieldRelation'],
      order: { order: 'ASC' }
    });
  }

  async deleteByCustomerId(customerId: number): Promise<void> {
    await this.getRepository().delete({ customer: customerId });
  }
}

