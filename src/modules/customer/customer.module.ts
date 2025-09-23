import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerController } from './controllers/customer.controller';
import { Customer } from './entities/customer.entity';
import { CustomerRepository } from './repositories/customer.repository';
import { CustomerService } from './services/customer.service';
import { CustomerDynamicFieldValueModule } from '../customer-dynamic-field-value/customer-dynamic-field-value.module';
import { CustomerStatusChange } from '../customer-status-change/entities/customer-status-change.entity';
import { CustomerStatusChangeRepository } from '../customer-status-change/repositories/customer-status-change.repository';
import { FraudAlertModule } from '../fraud-alert/fraud-alert.module';
import { CustomerHistoryModule } from '../customer-history/customer-history.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Customer, CustomerStatusChange]),
    CustomerDynamicFieldValueModule,
    FraudAlertModule,
    CustomerHistoryModule,
  ],
  controllers: [CustomerController],
  providers: [
    CustomerService,
    CustomerRepository,
    CustomerStatusChangeRepository,
  ],
  exports: [CustomerService, CustomerRepository],
})
export class CustomerModule {}
