import { Injectable } from '@nestjs/common';
import { Hospital } from '../entities/hospital.entity';
import { HospitalRepository } from '../repositories/hospital.repository';
import { BaseService } from '../../../core/base/services/base.service';
import { LogMethod } from '../../../core/decorators/log.decorator';
import { BaseQueryFilterDto } from '../../../core/base/dtos/base.query.filter.dto';
import { SelectQueryBuilder } from 'typeorm';

@Injectable()
export class HospitalService extends BaseService<Hospital> {
  constructor(private readonly hospitalRepository: HospitalRepository) {
    super(hospitalRepository, Hospital);
  }

  @LogMethod()
  async findByCode(code: string): Promise<Hospital | null> {
    return this.hospitalRepository.findByCondition({ where: { code } });
  }

  async findByFiltersBaseQuery(
    filters: BaseQueryFilterDto,
  ): Promise<SelectQueryBuilder<Hospital>> {
    return this.hospitalRepository.findByFiltersBaseQuery(filters);
  }
}
