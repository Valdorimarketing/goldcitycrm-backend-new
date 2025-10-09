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
import { CustomHttpException } from '../../../core/utils/custom-http.exception';

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
    // Check if user group with same name already exists
    const existingGroup = await this.userGroupRepository.findByName(
      createDto.name,
    );
    if (existingGroup) {
      throw CustomHttpException.conflict(
        'Bu isimde bir kullanıcı grubu zaten mevcut',
      );
    }

    return super.create(createDto, UserGroupResponseDto);
  }

  async updateUserGroup(
    id: number,
    updateDto: UpdateUserGroupDto,
  ): Promise<UserGroupResponseDto> {
    // Check if updating name to a name that already exists
    if (updateDto.name) {
      const existingGroup = await this.userGroupRepository.findByName(
        updateDto.name,
      );
      if (existingGroup && existingGroup.id !== id) {
        throw CustomHttpException.conflict(
          'Bu isimde bir kullanıcı grubu zaten mevcut',
        );
      }
    }

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
