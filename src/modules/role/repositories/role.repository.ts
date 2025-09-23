import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepositoryAbstract } from '../../../core/base/repositories/base.repository.abstract';
import { Role } from '../entities/role.entity';

@Injectable()
export class RoleRepository extends BaseRepositoryAbstract<Role> {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {
    super(roleRepository);
  }

  async findByName(name: string): Promise<Role> {
    return this.getRepository().findOne({
      where: { name },
    });
  }
}
