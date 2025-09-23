import { Injectable } from '@nestjs/common';
import { Branch } from '../entities/branch.entity';
import { BranchRepository } from '../repositories/branch.repository';
import { BaseService } from '../../../core/base/services/base.service';
import { LogMethod } from '../../../core/decorators/log.decorator';
import { BaseQueryFilterDto } from '../../../core/base/dtos/base.query.filter.dto';
import { SelectQueryBuilder } from 'typeorm';
import { Branch2HospitalRepository } from '../repositories/branch2hospital.repository';
import { CreateBranchDto } from '../dto/create-branch.dto';
import { UpdateBranchDto } from '../dto/update-branch.dto';
import { Branch2Hospital } from '../entities/branch2hospital.entity';

@Injectable()
export class BranchService extends BaseService<Branch> {
  constructor(
    private readonly branchRepository: BranchRepository,
    private readonly branch2HospitalRepository: Branch2HospitalRepository,
  ) {
    super(branchRepository, Branch);
  }

  @LogMethod()
  async findByCode(code: string): Promise<Branch | null> {
    return this.branchRepository.findByCondition({ where: { code } });
  }

  async findByFiltersBaseQuery(
    filters: BaseQueryFilterDto,
  ): Promise<SelectQueryBuilder<Branch>> {
    return this.branchRepository.findByFiltersBaseQuery(filters);
  }

  @LogMethod()
  async createBranch(createBranchDto: CreateBranchDto): Promise<Branch> {
    const { hospitalIds, ...branchData } = createBranchDto;

    const branch = await this.branchRepository.save(branchData);

    if (hospitalIds && hospitalIds.length > 0) {
      const branch2Hospitals = hospitalIds.map((hospitalId) => ({
        branchId: branch.id,
        hospitalId,
      }));

      await this.branch2HospitalRepository.saveMany(branch2Hospitals);
    }

    return this.findById(branch.id);
  }

  @LogMethod()
  async updateBranch(
    id: number,
    updateBranchDto: UpdateBranchDto,
  ): Promise<Branch> {
    const { hospitalIds, ...branchData } = updateBranchDto;

    await this.branchRepository.update(id, branchData);

    if (hospitalIds !== undefined) {
      await this.branch2HospitalRepository.removeByCondition({
        branchId: id,
      });

      if (hospitalIds.length > 0) {
        const branch2Hospitals = hospitalIds.map((hospitalId) => ({
          branchId: id,
          hospitalId,
        }));

        await this.branch2HospitalRepository.saveMany(branch2Hospitals);
      }
    }

    return this.findById(id);
  }

  @LogMethod()
  async findById(id: number): Promise<Branch> {
    return this.branchRepository.findByCondition({
      where: { id },
      relations: ['branch2Hospitals', 'branch2Hospitals.hospital'],
    });
  }

  @LogMethod()
  async findAllWithHospitals(query?: BaseQueryFilterDto): Promise<Branch[]> {
    const queryBuilder = await this.findByFiltersBaseQuery(query || {});
    queryBuilder
      .leftJoinAndSelect('branch.branch2Hospitals', 'branch2Hospitals')
      .leftJoinAndSelect('branch2Hospitals.hospital', 'hospital');

    return queryBuilder.getMany();
  }
}
