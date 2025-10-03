import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepositoryAbstract } from '../../../core/base/repositories/base.repository.abstract';
import { UserGroup } from '../entities/user-group.entity';

@Injectable()
export class UserGroupRepository extends BaseRepositoryAbstract<UserGroup> {
  constructor(
    @InjectRepository(UserGroup)
    private readonly userGroupRepository: Repository<UserGroup>,
  ) {
    super(userGroupRepository);
  }

  async findByIdWithUsers(id: number): Promise<UserGroup> {
    return this.userGroupRepository.findOne({
      where: { id },
      relations: ['users'],
    });
  }
}
