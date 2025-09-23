import { Injectable } from '@nestjs/common';
import { BaseService } from '../../../core/base/services/base.service';
import { Role } from '../entities/role.entity';
import { RoleRepository } from '../repositories/role.repository';
import {
  CreateRoleDto,
  UpdateRoleDto,
  RoleResponseDto,
} from '../dto/create-role.dto';

@Injectable()
export class RoleService extends BaseService<Role> {
  constructor(private readonly roleRepository: RoleRepository) {
    super(roleRepository, Role);
  }

  async createRole(createRoleDto: CreateRoleDto): Promise<RoleResponseDto> {
    return this.create(createRoleDto, RoleResponseDto);
  }

  async updateRole(
    id: number,
    updateRoleDto: UpdateRoleDto,
  ): Promise<RoleResponseDto> {
    return this.update(updateRoleDto, id, RoleResponseDto);
  }

  async getRoleById(id: number): Promise<Role> {
    return this.findOneById(id);
  }

  async getAllRoles(): Promise<Role[]> {
    return this.findAll();
  }

  async getRoleByName(name: string): Promise<Role> {
    return this.roleRepository.findByName(name);
  }

  async deleteRole(id: number): Promise<Role> {
    return this.remove(id);
  }
}
