import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepositoryAbstract } from '../../../core/base/repositories/base.repository.abstract';
import { CustomerFile } from '../entities/customer-file.entity';

@Injectable()
export class CustomerFileRepository extends BaseRepositoryAbstract<CustomerFile> {
  constructor(
    @InjectRepository(CustomerFile)
    private readonly customerFileRepository: Repository<CustomerFile>,
  ) {
    super(customerFileRepository);
  }
}
