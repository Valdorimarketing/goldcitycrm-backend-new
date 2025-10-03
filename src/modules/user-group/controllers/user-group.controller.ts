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
import { UserGroupService } from '../services/user-group.service';
import { CreateUserGroupDto } from '../dto/create-user-group.dto';
import { UpdateUserGroupDto } from '../dto/update-user-group.dto';
import { BaseQueryFilterDto } from '../../../core/base/dtos/base.query.filter.dto';
import { UserGroupResponseDto } from '../dto/user-group-response.dto';

@Controller('user-group')
export class UserGroupController {
  constructor(private readonly userGroupService: UserGroupService) {}

  @Post()
  create(@Body() createUserGroupDto: CreateUserGroupDto) {
    return this.userGroupService.createUserGroup(createUserGroupDto);
  }

  @Get()
  async findAll(@Query() query: BaseQueryFilterDto) {
    const queryBuilder =
      await this.userGroupService.findByFiltersBaseQuery(query);
    return this.userGroupService.paginate(
      queryBuilder,
      query,
      UserGroupResponseDto,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userGroupService.findById(+id);
  }

  @Get(':id/users')
  getUsersByGroupId(@Param('id') id: string) {
    return this.userGroupService.getUsersByGroupId(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateUserGroupDto: UpdateUserGroupDto,
  ) {
    return this.userGroupService.updateUserGroup(+id, updateUserGroupDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userGroupService.remove(+id);
  }
}
