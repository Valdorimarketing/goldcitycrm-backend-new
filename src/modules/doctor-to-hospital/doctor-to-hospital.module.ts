import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoctorToHospital } from './entities/doctor-to-hospital.entity';
import { DoctorToHospitalRepository } from './repositories/doctor-to-hospital.repository';
import { DoctorToHospitalService } from './services/doctor-to-hospital.service';
import { DoctorToHospitalController } from './controllers/doctor-to-hospital.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DoctorToHospital])],
  controllers: [DoctorToHospitalController],
  providers: [DoctorToHospitalService, DoctorToHospitalRepository],
  exports: [DoctorToHospitalService],
})
export class DoctorToHospitalModule {}
