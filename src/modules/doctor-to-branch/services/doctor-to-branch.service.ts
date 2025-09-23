import { Injectable } from '@nestjs/common';
import { DoctorToBranch } from '../entities/doctor-to-branch.entity';
import { DoctorToBranchRepository } from '../repositories/doctor-to-branch.repository';
import { BaseService } from '../../../core/base/services/base.service';
import { LogMethod } from '../../../core/decorators/log.decorator';
import { BaseQueryFilterDto } from '../../../core/base/dtos/base.query.filter.dto';
import { SelectQueryBuilder } from 'typeorm';

@Injectable()
export class DoctorToBranchService extends BaseService<DoctorToBranch> {
  constructor(
    private readonly doctorToBranchRepository: DoctorToBranchRepository,
  ) {
    super(doctorToBranchRepository, DoctorToBranch);
  }

  @LogMethod()
  async findWithRelations(id: number): Promise<DoctorToBranch> {
    return this.doctorToBranchRepository.findWithRelations(id);
  }

  @LogMethod()
  async findAllWithRelations(): Promise<DoctorToBranch[]> {
    return this.doctorToBranchRepository.findAllWithRelations();
  }

  @LogMethod()
  async findByDoctorId(doctorId: number): Promise<DoctorToBranch[]> {
    return this.doctorToBranchRepository.findByDoctorId(doctorId);
  }

  @LogMethod()
  async findByBranchId(branchId: number): Promise<DoctorToBranch[]> {
    return this.doctorToBranchRepository.findByBranchId(branchId);
  }

  async findByFiltersBaseQuery(
    filters: BaseQueryFilterDto,
  ): Promise<SelectQueryBuilder<DoctorToBranch>> {
    return this.doctorToBranchRepository.findByFiltersBaseQuery(filters);
  }
}
