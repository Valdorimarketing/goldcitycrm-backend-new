import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Doctor } from './entities/doctor.entity';
import { Doctor2Branch } from './entities/doctor2branch.entity';
import { Doctor2Hospital } from './entities/doctor2hospital.entity';
import { DoctorController } from './controllers/doctor.controller';
import { DoctorService } from './services/doctor.service';
import { DoctorRepository } from './repositories/doctor.repository';
import { Doctor2BranchRepository } from './repositories/doctor2branch.repository';
import { Doctor2HospitalRepository } from './repositories/doctor2hospital.repository';
import { BranchModule } from '../branch/branch.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Doctor, Doctor2Branch, Doctor2Hospital]),
    BranchModule,
  ],
  controllers: [DoctorController],
  providers: [
    DoctorService,
    DoctorRepository,
    Doctor2BranchRepository,
    Doctor2HospitalRepository,
  ],
  exports: [DoctorService],
})
export class DoctorModule {}
