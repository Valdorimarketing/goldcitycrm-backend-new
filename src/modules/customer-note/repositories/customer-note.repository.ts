import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepositoryAbstract } from '../../../core/base/repositories/base.repository.abstract';
import { CustomerNote } from '../entities/customer-note.entity';

@Injectable()
export class CustomerNoteRepository extends BaseRepositoryAbstract<CustomerNote> {
  constructor(
    @InjectRepository(CustomerNote)
    private readonly customerNoteRepository: Repository<CustomerNote>,
  ) {
    super(customerNoteRepository);
  }
}