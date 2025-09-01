import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Doctor } from './entities/doctor.entity';
import { Doctor2Hospital } from './entities/doctor2hospital.entity';
import { Doctor2Branch } from './entities/doctor2branch.entity';
import { DoctorController } from './controllers/doctor.controller';
import { DoctorService } from './services/doctor.service';
import { DoctorRepository } from './repositories/doctor.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Doctor, Doctor2Hospital, Doctor2Branch])],
  controllers: [DoctorController],
  providers: [DoctorService, DoctorRepository],
  exports: [DoctorService],
})
export class DoctorModule {}