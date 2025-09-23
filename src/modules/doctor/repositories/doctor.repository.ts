import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepositoryAbstract } from '../../../core/base/repositories/base.repository.abstract';
import { Doctor } from '../entities/doctor.entity';

@Injectable()
export class DoctorRepository extends BaseRepositoryAbstract<Doctor> {
  constructor(
    @InjectRepository(Doctor)
    private readonly doctorRepository: Repository<Doctor>,
  ) {
    super(doctorRepository);
  }

  async findWithRelations(id: number): Promise<Doctor> {
    return this.doctorRepository.findOne({
      where: { id },
      relations: [
        'branch',
        'doctor2Branches',
        'doctor2Branches.branch',
        'doctor2Hospitals',
        'doctor2Hospitals.hospital',
      ],
    });
  }

  async findAllWithRelations(): Promise<Doctor[]> {
    return this.doctorRepository.find({
      relations: ['branch'],
    });
  }
}
