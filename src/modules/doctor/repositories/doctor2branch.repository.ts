import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BaseRepositoryAbstract } from '../../../core/base/repositories/base.repository.abstract';
import { Doctor2Branch } from '../entities/doctor2branch.entity';

@Injectable()
export class Doctor2BranchRepository extends BaseRepositoryAbstract<Doctor2Branch> {
  constructor(private dataSource: DataSource) {
    super(dataSource.getRepository(Doctor2Branch));
  }

  async findDoctorIdsByBranchId(branchId: number): Promise<number[]> {
    const results = await this.getRepository()
      .createQueryBuilder('d2b')
      .select('d2b.doctorId', 'doctorId')
      .where('d2b.branchId = :branchId', { branchId })
      .getRawMany();

    return results.map((r) => r.doctorId);
  }
}
