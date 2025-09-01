import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BaseRepositoryAbstract } from '../../../core/base/repositories/base.repository.abstract';
import { CustomerDynamicField } from '../entities/customer-dynamic-field.entity';

@Injectable()
export class CustomerDynamicFieldRepository extends BaseRepositoryAbstract<CustomerDynamicField> {
  constructor(private dataSource: DataSource) {
    super(dataSource.getRepository(CustomerDynamicField));
  }
}
