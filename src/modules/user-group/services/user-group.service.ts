import { Injectable } from '@nestjs/common';
import { BaseService } from '../../../core/base/services/base.service';
import { UserGroup } from '../entities/user-group.entity';
import { UserGroupRepository } from '../repositories/user-group.repository';
import { CreateUserGroupDto } from '../dto/create-user-group.dto';
import { UpdateUserGroupDto } from '../dto/update-user-group.dto';
import { UserGroupResponseDto } from '../dto/user-group-response.dto';
import { User } from '../../user/entities/user.entity';
import { BaseQueryFilterDto } from '../../../core/base/dtos/base.query.filter.dto';
import { SelectQueryBuilder } from 'typeorm';

@Injectable()
export class UserGroupService extends BaseService<UserGroup> {
  constructor(private readonly userGroupRepository: UserGroupRepository) {
    super(userGroupRepository, UserGroup);
  }

  async findByFiltersBaseQuery(
    filters: BaseQueryFilterDto,
  ): Promise<SelectQueryBuilder<UserGroup>> {
    return this.userGroupRepository.findByFiltersBaseQuery(filters);
  }

  async createUserGroup(
    createDto: CreateUserGroupDto,
  ): Promise<UserGroupResponseDto> {
    return super.create(createDto, UserGroupResponseDto);
  }

  async updateUserGroup(
    id: number,
    updateDto: UpdateUserGroupDto,
  ): Promise<UserGroupResponseDto> {
    return super.update(updateDto, id, UserGroupResponseDto);
  }

  async getUsersByGroupId(groupId: number): Promise<User[]> {
    const userGroup = await this.userGroupRepository.findByIdWithUsers(groupId);
    if (!userGroup) {
      throw new Error('User group not found');
    }
    return userGroup.users;
  }
}
