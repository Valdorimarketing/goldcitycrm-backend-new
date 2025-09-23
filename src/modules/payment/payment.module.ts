import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentController } from './controllers/payment.controller';
import { Payment } from './entities/payment.entity';
import { PaymentRepository } from './repositories/payment.repository';
import { PaymentService } from './services/payment.service';
import { CustomerHistoryModule } from '../customer-history/customer-history.module';
import { SalesModule } from '../sales/sales.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment]),
    CustomerHistoryModule,
    SalesModule,
  ],
  controllers: [PaymentController],
  providers: [PaymentService, PaymentRepository],
  exports: [PaymentService, PaymentRepository],
})
export class PaymentModule {}
