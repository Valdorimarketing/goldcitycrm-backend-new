import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { RoleService } from '../services/role.service';
import {
  CreateRoleDto,
  UpdateRoleDto,
  RoleResponseDto,
} from '../dto/create-role.dto';
import { Role } from '../entities/role.entity';

@Controller('roles')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  async create(@Body() createRoleDto: CreateRoleDto): Promise<RoleResponseDto> {
    return this.roleService.createRole(createRoleDto);
  }

  @Get()
  async findAll(@Query('name') name?: string): Promise<Role[]> {
    if (name) {
      const role = await this.roleService.getRoleByName(name);
      return role ? [role] : [];
    }
    return this.roleService.getAllRoles();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Role> {
    return this.roleService.getRoleById(+id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ): Promise<RoleResponseDto> {
    return this.roleService.updateRole(+id, updateRoleDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<Role> {
    return this.roleService.deleteRole(+id);
  }
}
