import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';  
import { User } from '../user/entities/user.entity';
import { UserRepository } from '../user/repositories/user.repository';
import { ProfileController } from './controller/profile.controller';
import { ProfileService } from './services/profile.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [ProfileController],
  providers: [ProfileService, UserRepository],
  exports: [ProfileService],
})
export class ProfileModule {}
