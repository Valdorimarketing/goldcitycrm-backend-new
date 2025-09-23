import { Injectable } from '@nestjs/common';
import { DoctorToHospital } from '../entities/doctor-to-hospital.entity';
import { DoctorToHospitalRepository } from '../repositories/doctor-to-hospital.repository';
import { BaseService } from '../../../core/base/services/base.service';
import { LogMethod } from '../../../core/decorators/log.decorator';
import { BaseQueryFilterDto } from '../../../core/base/dtos/base.query.filter.dto';
import { SelectQueryBuilder } from 'typeorm';

@Injectable()
export class DoctorToHospitalService extends BaseService<DoctorToHospital> {
  constructor(
    private readonly doctorToHospitalRepository: DoctorToHospitalRepository,
  ) {
    super(doctorToHospitalRepository, DoctorToHospital);
  }

  @LogMethod()
  async findWithRelations(id: number): Promise<DoctorToHospital> {
    return this.doctorToHospitalRepository.findWithRelations(id);
  }

  @LogMethod()
  async findAllWithRelations(): Promise<DoctorToHospital[]> {
    return this.doctorToHospitalRepository.findAllWithRelations();
  }

  @LogMethod()
  async findByDoctorId(doctorId: number): Promise<DoctorToHospital[]> {
    return this.doctorToHospitalRepository.findByDoctorId(doctorId);
  }

  @LogMethod()
  async findByHospitalId(hospitalId: number): Promise<DoctorToHospital[]> {
    return this.doctorToHospitalRepository.findByHospitalId(hospitalId);
  }

  async findByFiltersBaseQuery(
    filters: BaseQueryFilterDto,
  ): Promise<SelectQueryBuilder<DoctorToHospital>> {
    return this.doctorToHospitalRepository.findByFiltersBaseQuery(filters);
  }
}
