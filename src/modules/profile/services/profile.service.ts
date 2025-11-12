import { Injectable, NotFoundException } from '@nestjs/common'; 
import { UserRepository } from 'src/modules/user/repositories/user.repository';
import { UpdateProfileDto } from '../dto/update-profile.dto';

@Injectable()
export class ProfileService {
  constructor(private readonly userRepository: UserRepository) {}


  async getProfile(userId: number) {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundException('Kullanıcı bulunamadı');
    return user;
  }

  async updateProfile(userId: number, updateDto: UpdateProfileDto) {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundException('Kullanıcı bulunamadı');

    Object.assign(user, updateDto);
    return await this.userRepository.saveUser(user);
  }

  async updateAvatar(userId: number, avatarUrl: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundException('Kullanıcı bulunamadı');

    user.avatar = avatarUrl;
    return await this.userRepository.saveUser(user);
  }
}
