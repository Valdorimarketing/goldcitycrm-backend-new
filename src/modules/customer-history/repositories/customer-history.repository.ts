import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepositoryAbstract } from '../../../core/base/repositories/base.repository.abstract';
import { CustomerHistory } from '../entities/customer-history.entity';

@Injectable()
export class CustomerHistoryRepository extends BaseRepositoryAbstract<CustomerHistory> {
  constructor(
    @InjectRepository(CustomerHistory)
    private readonly customerHistoryRepository: Repository<CustomerHistory>,
  ) {
    super(customerHistoryRepository);
  }
}