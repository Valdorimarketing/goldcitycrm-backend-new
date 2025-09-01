import { Injectable } from '@nestjs/common';
import { Branch } from '../entities/branch.entity';
import { BranchRepository } from '../repositories/branch.repository';
import { CreateBranchDto } from '../dto/create-branch.dto';
import { UpdateBranchDto } from '../dto/update-branch.dto';
import { BaseQueryFilterDto } from '../../../core/base/dtos/base.query.filter.dto';

@Injectable()
export class BranchService {
  constructor(private readonly branchRepository: BranchRepository) {}

  async create(createBranchDto: CreateBranchDto): Promise<Branch> {
    return this.branchRepository.save(createBranchDto);
  }

  async findAll(): Promise<Branch[]> {
    return this.branchRepository.findAll();
  }

  async paginate(query: BaseQueryFilterDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await this.branchRepository.findAll({
      skip,
      take: limit,
      order: { id: query.order || 'DESC' },
    }).then(async (items) => {
      const allItems = await this.branchRepository.findAll();
      return [items, allItems.length];
    });

    return {
      data,
      meta: {
        page,
        limit,
        total,
      },
    };
  }

  async findById(id: number): Promise<Branch> {
    return this.branchRepository.findOneById(id);
  }

  async update(id: number, updateBranchDto: UpdateBranchDto): Promise<Branch> {
    const branch = await this.findById(id);
    Object.assign(branch, updateBranchDto);
    return this.branchRepository.save(branch);
  }

  async remove(id: number): Promise<void> {
    const branch = await this.findById(id);
    await this.branchRepository.remove(branch);
  }
}