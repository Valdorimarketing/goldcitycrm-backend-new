import {
  Controller,
  Get,
  Patch,
  UseGuards,
  Body,
  Request,
  UseInterceptors,
  UploadedFile,
  Post,
} from '@nestjs/common'; 
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'; 
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ProfileService } from '../services/profile.service';
import { UpdateProfileDto } from '../dto/update-profile.dto';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  async getProfile(@Request() req) {
    return this.profileService.getProfile(req.user.id);
  }

  @Patch()
  async updateProfile(@Request() req, @Body() updateDto: UpdateProfileDto) {
    return this.profileService.updateProfile(req.user.id, updateDto);
  }

  @Post('avatar')
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
  async uploadAvatar(@Request() req, @UploadedFile() file: Express.Multer.File) {
    const avatarUrl = `/uploads/avatars/${file.filename}`;
    return this.profileService.updateAvatar(req.user.id, avatarUrl);
  }
}
