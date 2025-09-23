import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoctorToBranch } from './entities/doctor-to-branch.entity';
import { DoctorToBranchRepository } from './repositories/doctor-to-branch.repository';
import { DoctorToBranchService } from './services/doctor-to-branch.service';
import { DoctorToBranchController } from './controllers/doctor-to-branch.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DoctorToBranch])],
  controllers: [DoctorToBranchController],
  providers: [DoctorToBranchService, DoctorToBranchRepository],
  exports: [DoctorToBranchService],
})
export class DoctorToBranchModule {}
