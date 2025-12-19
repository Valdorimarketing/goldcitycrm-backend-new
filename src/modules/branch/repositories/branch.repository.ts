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



  async findAllPaginated(
    filters: BranchQueryFilterDto,
  ): Promise<{ items: Branch[]; total: number }> {
    const languageId = filters.languageId || 1;

    const queryBuilder = this.branchRepository
      .createQueryBuilder('branch')
      .leftJoin(
        'branch.translations',
        'translation',
        'translation.languageId = :languageId',
        { languageId },
      )
      .leftJoinAndSelect('branch.branch2Hospitals', 'branch2Hospitals')
      .leftJoinAndSelect('branch2Hospitals.hospital', 'hospital')
      .addSelect('translation.name', 'branch_name');

    // Apply pagination
    if (filters.page && filters.limit) {
      queryBuilder.skip((filters.page - 1) * filters.limit);
      queryBuilder.take(filters.limit);
    }

    // Apply ordering
    if (filters.order) {
      queryBuilder.orderBy('branch.createdAt', filters.order);
    } else {
      queryBuilder.orderBy('branch.createdAt', 'DESC');
    }

    // Hospital filter
    if (filters.hospitalId) {
      queryBuilder.andWhere('branch2Hospitals.hospitalId = :hospitalId', {
        hospitalId: filters.hospitalId,
      });
    }

    // Search functionality
    if (filters.search) {
      queryBuilder.andWhere(
        '(translation.name LIKE :search OR branch.code LIKE :search OR branch.description LIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    // Get raw and entities
    const rawAndEntities = await queryBuilder.getRawAndEntities();

    // Map translation names to branch entities
    const items = rawAndEntities.entities.map((branch, index) => {
      const raw = rawAndEntities.raw[index];
      branch.name = raw.branch_name || '';
      return branch;
    });

    // Get total count
    const totalQuery = this.branchRepository
      .createQueryBuilder('branch')
      .leftJoin(
        'branch.translations',
        'translation',
        'translation.languageId = :languageId',
        { languageId },
      )
      .leftJoin('branch.branch2Hospitals', 'branch2Hospitals');

    // Apply same filters to count query
    if (filters.hospitalId) {
      totalQuery.andWhere('branch2Hospitals.hospitalId = :hospitalId', {
        hospitalId: filters.hospitalId,
      });
    }

    if (filters.search) {
      totalQuery.andWhere(
        '(translation.name LIKE :search OR branch.code LIKE :search OR branch.description LIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    const total = await totalQuery.getCount();

    return { items, total };
  }

  async findByIdWithTranslations(
    id: number,
    languageId?: number,
  ): Promise<Branch> {
    const queryBuilder = this.branchRepository
      .createQueryBuilder('branch')
      .where('branch.id = :id', { id })
      .leftJoinAndSelect('branch.branch2Hospitals', 'branch2Hospitals')
      .leftJoinAndSelect('branch2Hospitals.hospital', 'hospital');

    if (languageId) {
      queryBuilder.leftJoinAndSelect(
        'branch.translations',
        'translation',
        'translation.languageId = :languageId',
        { languageId },
      );
    } else {
      queryBuilder.leftJoinAndSelect('branch.translations', 'translation');
    }

    return queryBuilder.getOne();
  }
}