import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepositoryAbstract } from '../../../core/base/repositories/base.repository.abstract';
import { Hospital } from '../entities/hospital.entity';

@Injectable()
export class HospitalRepository extends BaseRepositoryAbstract<Hospital> {
  constructor(
    @InjectRepository(Hospital)
    private readonly hospitalRepository: Repository<Hospital>,
  ) {
    super(hospitalRepository);
  }
}