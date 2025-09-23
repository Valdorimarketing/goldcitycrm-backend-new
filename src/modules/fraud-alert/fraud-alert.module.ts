import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FraudAlert } from './entities/fraud-alert.entity';
import { FraudAlertController } from './controllers/fraud-alert.controller';
import { FraudAlertService } from './services/fraud-alert.service';
import { FraudAlertRepository } from './repositories/fraud-alert.repository';

@Module({
  imports: [TypeOrmModule.forFeature([FraudAlert])],
  controllers: [FraudAlertController],
  providers: [FraudAlertService, FraudAlertRepository],
  exports: [FraudAlertService],
})
export class FraudAlertModule {}
