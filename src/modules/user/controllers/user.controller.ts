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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { UserService } from '../services/user.service';
import {
  CreateUserDto,
  UpdateUserDto,
  UserResponseDto,
} from '../dto/create-user.dto';
import { User } from '../entities/user.entity';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Post()
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return this.userService.createUser(createUserDto);
  }

  @Post(':id/avatar')
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: './uploads/avatars',
        filename: (req, file, cb) => {
          const uniqueName = `${Date.now()}${extname(file.originalname)}`;
          cb(null, uniqueName);
        },
      }),
    }),
  )
  async uploadAvatar(@Param('id') id: number, @UploadedFile() file: Express.Multer.File) {
    const avatarUrl = `/uploads/avatars/${file.filename}`;
    return this.userService.updateUser(id, { avatar: avatarUrl });
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
