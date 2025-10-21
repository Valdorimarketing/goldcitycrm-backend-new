import { IsString, IsOptional, IsNumber, IsNotEmpty, IsBoolean } from 'class-validator';

export class CreateCustomerDynamicFieldDto {
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

  @IsBoolean()
  @IsOptional()
  is_required?: boolean;
}
