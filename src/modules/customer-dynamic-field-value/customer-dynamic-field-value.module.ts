import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerDynamicFieldValue } from './entities/customer-dynamic-field-value.entity';
import { CustomerDynamicFieldValueRepository } from './repositories/customer-dynamic-field-value.repository';
import { CustomerDynamicFieldValueService } from './services/customer-dynamic-field-value.service';

@Module({
  imports: [TypeOrmModule.forFeature([CustomerDynamicFieldValue])],
  providers: [CustomerDynamicFieldValueRepository, CustomerDynamicFieldValueService],
  exports: [CustomerDynamicFieldValueRepository, CustomerDynamicFieldValueService],
})
export class CustomerDynamicFieldValueModule {}
