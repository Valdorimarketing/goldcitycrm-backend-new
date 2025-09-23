import { PartialType } from '@nestjs/mapped-types';
import { CreateCustomer2ProductDto } from './create-customer2product.dto';

export class UpdateCustomer2ProductDto extends PartialType(
  CreateCustomer2ProductDto,
) {}
