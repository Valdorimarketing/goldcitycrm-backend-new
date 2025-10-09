import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { BaseRepositoryAbstract } from '../../../core/base/repositories/base.repository.abstract';
import { Branch } from '../entities/branch.entity';
import { BranchQueryFilterDto } from '../dto/branch-query-filter.dto';

@Injectable()
export class BranchRepository extends BaseRepositoryAbstract<Branch> {
  constructor(
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
  ) {
    super(branchRepository);
  }

  async findByFiltersBaseQuery(
    filters: BranchQueryFilterDto,
  ): Promise<SelectQueryBuilder<Branch>> {
    const queryBuilder = await super.findByFiltersBaseQuery(filters);

    // Search functionality
    if (filters.search) {
      queryBuilder.andWhere(
        '(branch.name LIKE :search OR branch.code LIKE :search OR branch.description LIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    return queryBuilder;
  }
}
