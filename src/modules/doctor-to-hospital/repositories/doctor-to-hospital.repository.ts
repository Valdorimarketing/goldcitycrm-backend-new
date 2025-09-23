import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepositoryAbstract } from '../../../core/base/repositories/base.repository.abstract';
import { DoctorToHospital } from '../entities/doctor-to-hospital.entity';

@Injectable()
export class DoctorToHospitalRepository extends BaseRepositoryAbstract<DoctorToHospital> {
  constructor(
    @InjectRepository(DoctorToHospital)
    private readonly doctorToHospitalRepository: Repository<DoctorToHospital>,
  ) {
    super(doctorToHospitalRepository);
  }

  async findWithRelations(id: number): Promise<DoctorToHospital> {
    return this.doctorToHospitalRepository.findOne({
      where: { id },
      relations: ['doctor', 'hospital'],
    });
  }

  async findAllWithRelations(): Promise<DoctorToHospital[]> {
    return this.doctorToHospitalRepository.find({
      relations: ['doctor', 'hospital'],
    });
  }

  async findByDoctorId(doctorId: number): Promise<DoctorToHospital[]> {
    return this.doctorToHospitalRepository.find({
      where: { doctorId },
      relations: ['hospital'],
    });
  }

  async findByHospitalId(hospitalId: number): Promise<DoctorToHospital[]> {
    return this.doctorToHospitalRepository.find({
      where: { hospitalId },
      relations: ['doctor'],
    });
  }
}
