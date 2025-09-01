import { PartialType } from '@nestjs/mapped-types';
import { CreateCustomerDynamicFieldDto } from './create-customer-dynamic-field.dto';

export class UpdateCustomerDynamicFieldDto extends PartialType(CreateCustomerDynamicFieldDto) {}
