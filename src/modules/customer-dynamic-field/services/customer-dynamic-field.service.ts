import { Injectable } from '@nestjs/common';
import { BaseService } from '../../../core/base/services/base.service';
import { CustomerDynamicField } from '../entities/customer-dynamic-field.entity';
import { CustomerDynamicFieldRepository } from '../repositories/customer-dynamic-field.repository';
import { CreateCustomerDynamicFieldDto } from '../dto/create-customer-dynamic-field.dto';
import { UpdateCustomerDynamicFieldDto } from '../dto/update-customer-dynamic-field.dto';

@Injectable()
export class CustomerDynamicFieldService extends BaseService<CustomerDynamicField> {
  constructor(
    private customerDynamicFieldRepository: CustomerDynamicFieldRepository,
  ) {
    super(customerDynamicFieldRepository, CustomerDynamicField);
  }
}
