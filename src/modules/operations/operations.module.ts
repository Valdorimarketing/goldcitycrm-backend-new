// operations.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OperationType } from './entities/operation-type.entity';
import { OperationFollowup } from './entities/operation-followup.entity';
import { CustomerNote } from '../customer-note/entities/customer-note.entity'; // EKLENDİ
import { OperationsService } from './services/operations.service';
import { OperationsController } from './controllers/operations.controller';
import { CustomerHistory } from '../customer-history/entities/customer-history.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OperationType,
      OperationFollowup,
      CustomerHistory,
      CustomerNote
    ]),
  ],
  controllers: [OperationsController],
  providers: [OperationsService],
  exports: [OperationsService],
})
export class OperationsModule {}