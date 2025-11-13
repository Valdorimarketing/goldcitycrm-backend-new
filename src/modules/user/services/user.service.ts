import { Injectable } from '@nestjs/common';
import { BaseService } from '../../../core/base/services/base.service';
import { User } from '../entities/user.entity';
import { UserRepository } from '../repositories/user.repository';
import {
  CreateUserDto,
  UpdateUserDto,
  UserResponseDto,
} from '../dto/create-user.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserService extends BaseService<User> {
  constructor(private readonly userRepository: UserRepository) {
    super(userRepository, User);
  }

  async createUser(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    // Password'u hash'le
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const userData = {
      ...createUserDto,
      password: hashedPassword,
      isActive: createUserDto.isActive ?? true,
    };

    return this.create(userData, UserResponseDto);
  }

  async createUserWithPassword(userData: any): Promise<User> {
    return this.userRepository.save(userData);
  }

  async updateUser(
    id: number,
    updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const userData = { ...updateUserDto };

    // Eğer password güncelleniyorsa hash'le
    if (updateUserDto.password) {
      const hashedPassword = await bcrypt.hash(updateUserDto.password, 10);
      userData.password = hashedPassword;
    }

    console.log(userData);
    

    return this.update(userData, id, UserResponseDto);
  }

async updateLastActiveTime(userId: number): Promise<User> {
  const user = await this.getUserById(userId);  
  
  user.lastActiveTime = new Date();
  return this.userRepository.save(user);
}


  async getUserById(id: number): Promise<User> {
    return this.findOneById(id);
  }

  async getAllUsers(): Promise<User[]> {
    return this.userRepository.findAll()
  }
  async getUsersByRole(role: string): Promise<User[]> {
    return this.userRepository.findByRole(role);
  }

  async findByEmail(email: string): Promise<User> {
    return this.userRepository.findByEmail(email);
  }

  async deleteUser(id: number): Promise<User> {
    return this.remove(id);
  }
 

}
