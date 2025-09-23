import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BaseRepositoryAbstract } from '../../../core/base/repositories/base.repository.abstract';
import { Branch2Hospital } from '../entities/branch2hospital.entity';

@Injectable()
export class Branch2HospitalRepository extends BaseRepositoryAbstract<Branch2Hospital> {
  constructor(private dataSource: DataSource) {
    super(dataSource.getRepository(Branch2Hospital));
  }
}
