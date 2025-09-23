import { PartialType } from '@nestjs/mapped-types';
import { CreateCustomerDynamicFieldValueDto } from './create-customer-dynamic-field-value.dto';

export class UpdateCustomerDynamicFieldValueDto extends PartialType(
  CreateCustomerDynamicFieldValueDto,
) {}
