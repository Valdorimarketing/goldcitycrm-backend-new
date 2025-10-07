import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { CustomerController } from './controllers/customer.controller';
import { Customer } from './entities/customer.entity';
import { CustomerRepository } from './repositories/customer.repository';
import { CustomerService } from './services/customer.service';
import { CustomerDynamicFieldValueModule } from '../customer-dynamic-field-value/customer-dynamic-field-value.module';
import { CustomerStatusChange } from '../customer-status-change/entities/customer-status-change.entity';
import { CustomerStatusChangeRepository } from '../customer-status-change/repositories/customer-status-change.repository';
import { FraudAlertModule } from '../fraud-alert/fraud-alert.module';
import { CustomerHistoryModule } from '../customer-history/customer-history.module';
import { Status } from '../status/entities/status.entity';
import { StatusRepository } from '../status/repositories/status.repository';
import { Customer2Product } from '../customer2product/entities/customer2product.entity';
import { Customer2ProductRepository } from '../customer2product/repositories/customer2product.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Customer,
      CustomerStatusChange,
      Status,
      Customer2Product,
    ]),
    MulterModule.register({
      storage: diskStorage({
        destination: './uploads/customers',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
    CustomerDynamicFieldValueModule,
    FraudAlertModule,
    CustomerHistoryModule,
  ],
  controllers: [CustomerController],
  providers: [
    CustomerService,
    CustomerRepository,
    CustomerStatusChangeRepository,
    StatusRepository,
    Customer2ProductRepository,
  ],
  exports: [CustomerService, CustomerRepository],
})
export class CustomerModule {}
