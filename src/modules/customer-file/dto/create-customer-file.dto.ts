import { IsOptional, IsString, IsNumber, IsNotEmpty } from 'class-validator';
import { Expose } from 'class-transformer';

export class CreateCustomerFileDto {
  @IsNotEmpty()
  @IsNumber()
  @Expose()
  customer: number;

  @IsNotEmpty()
  @IsString()
  @Expose()
  file: string;

  @IsOptional()
  @IsString()
  @Expose()
  description?: string;
}

export class UpdateCustomerFileDto {
  @IsOptional()
  @IsNumber()
  @Expose()
  customer?: number;

  @IsOptional()
  @IsString()
  @Expose()
  file?: string;

  @IsOptional()
  @IsString()
  @Expose()
  description?: string;
}

export class CustomerFileResponseDto {
  @Expose()
  id: number;

  @Expose()
  customer: number;

  @Expose()
  file: string;

  @Expose()
  description: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatesAt: Date;
}
