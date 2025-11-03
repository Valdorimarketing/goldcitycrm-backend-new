import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserService } from '../services/user.service';
import {
  CreateUserDto,
  UpdateUserDto,
  UserResponseDto,
} from '../dto/create-user.dto';
import { User } from '../entities/user.entity';
import { AuthGuard } from '@nestjs/passport';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return this.userService.createUser(createUserDto);
  }

  @Get()
  async findAll(@Query('role') role?: string): Promise<User[]> {
    if (role) {
      return this.userService.getUsersByRole(role);
    }
    return this.userService.getAllUsers();
  }

  
  @UseGuards(AuthGuard('jwt'))
  @Get('update-last-active')
  async updateLastActiveTime(@Req() req) {   
    return this.userService.updateLastActiveTime(req.user.id);
  }


  
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<User> {
    return this.userService.getUserById(+id);
  }

  
  


  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.userService.updateUser(+id, updateUserDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<User> {
    return this.userService.deleteUser(+id);
  }
}
