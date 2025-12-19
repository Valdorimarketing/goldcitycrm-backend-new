import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BranchService } from './services/branch.service';
import { BranchController } from './controllers/branch.controller';
import { Branch } from './entities/branch.entity';
import { BranchTranslation } from './entities/branch-translation.entity';
import { Branch2Hospital } from './entities/branch2hospital.entity';
import { BranchRepository } from './repositories/branch.repository';
import { BranchTranslationRepository } from './repositories/branch-translation.repository';
import { Branch2HospitalRepository } from './repositories/branch2hospital.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([Branch, BranchTranslation, Branch2Hospital]),
  ],
  controllers: [BranchController],
  providers: [
    BranchService,
    BranchRepository,
    BranchTranslationRepository,
    Branch2HospitalRepository,
  ],
  exports: [BranchService],
})
export class BranchModule {}