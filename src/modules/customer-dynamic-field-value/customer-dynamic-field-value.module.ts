import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerDynamicFieldValue } from './entities/customer-dynamic-field-value.entity';
import { CustomerDynamicFieldValueRepository } from './repositories/customer-dynamic-field-value.repository';
import { CustomerDynamicFieldValueService } from './services/customer-dynamic-field-value.service';
import { CustomerDynamicFieldValueController } from './controllers/customer-dynamic-field-value.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CustomerDynamicFieldValue])],
  controllers: [CustomerDynamicFieldValueController],
  providers: [
    CustomerDynamicFieldValueRepository,
    CustomerDynamicFieldValueService,
  ],
  exports: [
    CustomerDynamicFieldValueRepository,
    CustomerDynamicFieldValueService,
  ],
})
export class CustomerDynamicFieldValueModule {}
