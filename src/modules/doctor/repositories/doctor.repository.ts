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

  public createQueryBuilder(alias?: string) {
    return super.createQueryBuilder(alias);
  }

  async findWithRelations(id: number): Promise<Doctor> {
    return this.doctorRepository.findOne({
      where: { id },
      relations: ['branch', 'hospitalRelations', 'hospitalRelations.hospital', 'branchRelations', 'branchRelations.branch'],
    });
  }

  async findAllWithRelations(): Promise<Doctor[]> {
    return this.doctorRepository.find({
      relations: ['branch', 'hospitalRelations', 'hospitalRelations.hospital', 'branchRelations', 'branchRelations.branch'],
    });
  }
}