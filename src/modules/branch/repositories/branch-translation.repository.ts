import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepositoryAbstract } from '../../../core/base/repositories/base.repository.abstract';
import { BranchTranslation } from '../entities/branch-translation.entity';

@Injectable()
export class BranchTranslationRepository extends BaseRepositoryAbstract<BranchTranslation> {
  constructor(
    @InjectRepository(BranchTranslation)
    private readonly branchTranslationRepository: Repository<BranchTranslation>,
  ) {
    super(branchTranslationRepository);
  }

  async findByBranchAndLanguage(
    branchId: number,
    languageId: number,
  ): Promise<BranchTranslation | null> {
    return this.findByCondition({
      where: { branchId, languageId },
    });
  }

  async deleteByBranchId(branchId: number): Promise<void> {
    await this.branchTranslationRepository.delete({ branchId });
  }
}