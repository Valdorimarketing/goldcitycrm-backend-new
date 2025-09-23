import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { BaseRepositoryAbstract } from '../../../core/base/repositories/base.repository.abstract';
import { ActionList } from '../entities/action-list.entity';

@Injectable()
export class ActionListRepository extends BaseRepositoryAbstract<ActionList> {
  constructor(
    @InjectRepository(ActionList)
    private readonly actionListRepository: Repository<ActionList>,
  ) {
    super(actionListRepository);
  }

  create(data: DeepPartial<ActionList>): ActionList {
    return this.actionListRepository.create(data);
  }

  async updateOne(id: number, data: DeepPartial<ActionList>): Promise<void> {
    await this.actionListRepository.update(id, data);
  }

  async findOne(options: any): Promise<ActionList> {
    return await this.actionListRepository.findOne(options);
  }
}
