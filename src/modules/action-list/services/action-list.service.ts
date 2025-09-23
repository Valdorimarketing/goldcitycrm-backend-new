import { Injectable } from '@nestjs/common';
import { BaseService } from '../../../core/base/services/base.service';
import { ActionList } from '../entities/action-list.entity';
import { ActionListRepository } from '../repositories/action-list.repository';
import { CreateActionListDto } from '../dto/create-action-list.dto';
import { UpdateActionListDto } from '../dto/update-action-list.dto';

@Injectable()
export class ActionListService extends BaseService<ActionList> {
  constructor(private readonly actionListRepository: ActionListRepository) {
    super(actionListRepository, ActionList);
  }

  async createActionList(
    createActionListDto: CreateActionListDto,
  ): Promise<ActionList> {
    const actionList = this.actionListRepository.create({
      ...createActionListDto,
      user: { id: createActionListDto.user } as any,
      product: { id: createActionListDto.product } as any,
    });
    return await this.actionListRepository.save(actionList);
  }

  async updateActionList(
    id: number,
    updateActionListDto: UpdateActionListDto,
  ): Promise<ActionList> {
    const updateData: any = { ...updateActionListDto };

    if (updateActionListDto.user) {
      updateData.user = { id: updateActionListDto.user };
    }

    if (updateActionListDto.product) {
      updateData.product = { id: updateActionListDto.product };
    }

    await this.actionListRepository.updateOne(id, updateData);
    return this.findById(id);
  }

  async findAll(): Promise<ActionList[]> {
    return await this.actionListRepository.findAll({
      relations: ['user', 'product'],
    });
  }

  async findById(id: number): Promise<ActionList> {
    return await this.actionListRepository.findOne({
      where: { id },
      relations: ['user', 'product'],
    });
  }
}
