import { IsString, IsOptional, IsNumber, IsNotEmpty } from 'class-validator';

export class CreateCustomerDynamicFieldValueDto {
  @IsNumber()
  @IsNotEmpty()
  customer: number;

  @IsNumber()
  @IsNotEmpty()
  customer_dynamic_field: number;

  @IsString()
  @IsOptional()
  file?: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsOptional()
  options_data?: string;

  @IsNumber()
  @IsOptional()
  order?: number;
}
