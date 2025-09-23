import { Type } from 'class-transformer';
import { IsArray, ValidateNested, ArrayMinSize } from 'class-validator';
import { CreateCustomer2ProductDto } from './create-customer2product.dto';

export class BulkCreateCustomer2ProductDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateCustomer2ProductDto)
  items: CreateCustomer2ProductDto[];
}
