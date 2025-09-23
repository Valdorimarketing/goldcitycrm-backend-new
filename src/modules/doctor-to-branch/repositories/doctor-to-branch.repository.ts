import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepositoryAbstract } from '../../../core/base/repositories/base.repository.abstract';
import { DoctorToBranch } from '../entities/doctor-to-branch.entity';

@Injectable()
export class DoctorToBranchRepository extends BaseRepositoryAbstract<DoctorToBranch> {
  constructor(
    @InjectRepository(DoctorToBranch)
    private readonly doctorToBranchRepository: Repository<DoctorToBranch>,
  ) {
    super(doctorToBranchRepository);
  }

  async findWithRelations(id: number): Promise<DoctorToBranch> {
    return this.doctorToBranchRepository.findOne({
      where: { id },
      relations: ['doctor', 'branch'],
    });
  }

  async findAllWithRelations(): Promise<DoctorToBranch[]> {
    return this.doctorToBranchRepository.find({
      relations: ['doctor', 'branch'],
    });
  }

  async findByDoctorId(doctorId: number): Promise<DoctorToBranch[]> {
    return this.doctorToBranchRepository.find({
      where: { doctorId },
      relations: ['branch'],
    });
  }

  async findByBranchId(branchId: number): Promise<DoctorToBranch[]> {
    return this.doctorToBranchRepository.find({
      where: { branchId },
      relations: ['doctor'],
    });
  }
}
