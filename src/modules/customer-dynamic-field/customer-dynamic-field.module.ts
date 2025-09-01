import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerDynamicFieldService } from './services/customer-dynamic-field.service';
import { CustomerDynamicFieldController } from './controllers/customer-dynamic-field.controller';
import { CustomerDynamicFieldRepository } from './repositories/customer-dynamic-field.repository';
import { CustomerDynamicField } from './entities/customer-dynamic-field.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CustomerDynamicField])],
  controllers: [CustomerDynamicFieldController],
  providers: [CustomerDynamicFieldService, CustomerDynamicFieldRepository],
  exports: [CustomerDynamicFieldService],
})
export class CustomerDynamicFieldModule {}

