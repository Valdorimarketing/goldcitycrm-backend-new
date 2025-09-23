import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Branch } from './entities/branch.entity';
import { Branch2Hospital } from './entities/branch2hospital.entity';
import { BranchController } from './controllers/branch.controller';
import { BranchService } from './services/branch.service';
import { BranchRepository } from './repositories/branch.repository';
import { Branch2HospitalRepository } from './repositories/branch2hospital.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Branch, Branch2Hospital])],
  controllers: [BranchController],
  providers: [BranchService, BranchRepository, Branch2HospitalRepository],
  exports: [BranchService],
})
export class BranchModule {}
