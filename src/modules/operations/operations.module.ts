import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OperationsController } from './controllers/operations.controller';
import { OperationsService } from './services/operations.service';
import { OperationType } from './entities/operation-type.entity';
import { OperationFollowup } from './entities/operation-followup.entity';

@Module({
  imports: [TypeOrmModule.forFeature([OperationType, OperationFollowup])],
  controllers: [OperationsController],
  providers: [OperationsService],
  exports: [OperationsService],
})
export class OperationsModule {}
