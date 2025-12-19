import { Injectable } from '@nestjs/common';
import { Branch } from '../entities/branch.entity';
import { BranchRepository } from '../repositories/branch.repository';
import { BranchTranslationRepository } from '../repositories/branch-translation.repository';
import { BaseService } from '../../../core/base/services/base.service';
import { LogMethod } from '../../../core/decorators/log.decorator';
import { BranchQueryFilterDto } from '../dto/branch-query-filter.dto';
import { Branch2HospitalRepository } from '../repositories/branch2hospital.repository';
import { CreateBranchDto } from '../dto/create-branch.dto';
import { UpdateBranchDto } from '../dto/update-branch.dto';

@Injectable()
export class BranchService extends BaseService<Branch> {
  constructor(
    private readonly branchRepository: BranchRepository,
    private readonly branchTranslationRepository: BranchTranslationRepository,
    private readonly branch2HospitalRepository: Branch2HospitalRepository,
  ) {
    super(branchRepository, Branch);
  }

  // Helper method to map translations to name
  mapTranslationsToName(branch: Branch): Branch {
    if (branch && branch.translations && branch.translations.length > 0) {
      branch.name = branch.translations[0].name;
    }
    return branch;
  }

  mapManyTranslationsToName(branches: Branch[]): Branch[] {
    return branches.map((branch) => this.mapTranslationsToName(branch));
  }

  @LogMethod()
  async findByCode(code: string): Promise<Branch | null> {
    const branch = await this.branchRepository.findByCondition({
      where: { code },
    });
    return this.mapTranslationsToName(branch);
  }

  @LogMethod()
  async findAllPaginated(filters: BranchQueryFilterDto) {
    const { items, total } =
      await this.branchRepository.findAllPaginated(filters);

    const page = filters.page || 1;
    const limit = filters.limit || 20;

    return {
      data: items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  @LogMethod()
  async createBranch(createBranchDto: CreateBranchDto): Promise<Branch> {
    const { hospitalIds, translations, ...branchData } = createBranchDto;

    const branch = await this.branchRepository.save(branchData);

    // Save translations
    if (translations && translations.length > 0) {
      const translationEntities = translations.map((t) => ({
        branchId: branch.id,
        languageId: t.languageId,
        name: t.name,
      }));
      await this.branchTranslationRepository.saveMany(translationEntities);
    }

    // Save hospital relations
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
    const { hospitalIds, translations, ...branchData } = updateBranchDto;

    await this.branchRepository.update(id, branchData);

    // Update translations
    if (translations !== undefined) {
      await this.branchTranslationRepository.deleteByBranchId(id);
      if (translations.length > 0) {
        const translationEntities = translations.map((t) => ({
          branchId: id,
          languageId: t.languageId,
          name: t.name,
        }));
        await this.branchTranslationRepository.saveMany(translationEntities);
      }
    }

    // Update hospital relations
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
  async findById(id: number, languageId?: number): Promise<Branch> {
    const branch = await this.branchRepository.findByIdWithTranslations(
      id,
      languageId,
    );
    return this.mapTranslationsToName(branch);
  }

  @LogMethod()
  async findAllWithHospitals(query?: BranchQueryFilterDto): Promise<Branch[]> {
    const languageId = query?.languageId || 1;

    // Use repository to get branches with translations
    const { items } = await this.branchRepository.findAllPaginated({
      ...query,
      languageId,
      page: 1,
      limit: 1000, // Get all for now
    });

    return items;
  }
}