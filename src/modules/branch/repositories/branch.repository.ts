import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
      // ✅ EXPLICIT JOIN - naming strategy sorununu çözer
      .leftJoin('branch.translations', 'translations')
      .leftJoin('translations.language', 'language')
      .leftJoin(
        'branch.translations',
        'currentTranslation',
        'currentTranslation.languageId = :languageId',
        { languageId },
      )
      .leftJoin('branch.branch2Hospitals', 'branch2Hospitals')
      .leftJoin('branch2Hospitals.hospital', 'hospital')
      // ✅ MANUALLY SELECT - translations'ı almak için
      .addSelect([
        'translations.id',
        'translations.branchId',
        'translations.languageId',
        'translations.name',
        'language.id',
        'language.code',
        'language.name',
        'currentTranslation.name',
        'branch2Hospitals.id',
        'branch2Hospitals.hospitalId',
        'branch2Hospitals.branchId',
        'hospital.id',
        'hospital.name',
        'hospital.code',
        'hospital.address',
      ]);

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
        '(currentTranslation.name LIKE :search OR branch.code LIKE :search OR branch.description LIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    // Get results
    const [items, total] = await queryBuilder.getManyAndCount();

    // Map virtual name property
    items.forEach((branch) => {
      const currentTrans = branch.translations?.find(
        (t) => t.languageId === languageId,
      );
      if (currentTrans) {
        branch.name = currentTrans.name;
      } else {
        branch.name = branch.translations?.[0]?.name || '';
      }
    });

    return { items, total };
  }

  async findByIdWithTranslations(
    id: number,
    languageId?: number,
  ): Promise<Branch> {
    const queryBuilder = this.branchRepository
      .createQueryBuilder('branch')
      .where('branch.id = :id', { id })
      .leftJoin('branch.translations', 'translations')
      .leftJoin('translations.language', 'language')
      .leftJoin('branch.branch2Hospitals', 'branch2Hospitals')
      .leftJoin('branch2Hospitals.hospital', 'hospital')
      .addSelect([
        'translations.id',
        'translations.branchId',
        'translations.languageId',
        'translations.name',
        'language.id',
        'language.code',
        'language.name',
        'branch2Hospitals.id',
        'branch2Hospitals.hospitalId',
        'branch2Hospitals.branchId',
        'hospital.id',
        'hospital.name',
        'hospital.code',
        'hospital.address',
      ]);

    const result = await queryBuilder.getOne();

    if (result && languageId) {
      const currentTrans = result.translations?.find(
        (t) => t.languageId === languageId,
      );
      if (currentTrans) {
        result.name = currentTrans.name;
      }
    }

    return result;
  }
}