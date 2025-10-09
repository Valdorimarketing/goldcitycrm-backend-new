import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { BaseRepositoryAbstract } from '../../../core/base/repositories/base.repository.abstract';
import { Hospital } from '../entities/hospital.entity';
import { HospitalQueryFilterDto } from '../dto/hospital-query-filter.dto';

@Injectable()
export class HospitalRepository extends BaseRepositoryAbstract<Hospital> {
  constructor(
    @InjectRepository(Hospital)
    private readonly hospitalRepository: Repository<Hospital>,
  ) {
    super(hospitalRepository);
  }

  async findByFiltersBaseQuery(
    filters: HospitalQueryFilterDto,
  ): Promise<SelectQueryBuilder<Hospital>> {
    const queryBuilder = await super.findByFiltersBaseQuery(filters);

    // Search functionality
    if (filters.search) {
      queryBuilder.andWhere(
        '(hospital.name LIKE :search OR hospital.code LIKE :search OR hospital.address LIKE :search OR hospital.description LIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    return queryBuilder;
  }
}
