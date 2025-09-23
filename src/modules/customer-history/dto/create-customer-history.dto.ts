import { IsOptional, IsString, IsNumber, IsNotEmpty } from 'class-validator';
import { Expose } from 'class-transformer';

export class CreateCustomerHistoryDto {
  @IsNotEmpty()
  @IsNumber()
  @Expose()
  customer: number;

  @IsOptional()
  @IsNumber()
  @Expose()
  user?: number;

  @IsNotEmpty()
  @IsString()
  @Expose()
  action: string;

  @IsOptional()
  @IsNumber()
  @Expose()
  relatedId?: number;

  @IsOptional()
  @IsString()
  @Expose()
  description?: string;

  @IsOptional()
  @IsString()
  @Expose()
  requestData?: string;

  @IsOptional()
  @IsString()
  @Expose()
  responseData?: string;
}

export class UpdateCustomerHistoryDto {
  @IsOptional()
  @IsNumber()
  @Expose()
  customer?: number;

  @IsOptional()
  @IsString()
  @Expose()
  action?: string;

  @IsOptional()
  @IsString()
  @Expose()
  description?: string;

  @IsOptional()
  @IsString()
  @Expose()
  requestData?: string;

  @IsOptional()
  @IsString()
  @Expose()
  responseData?: string;
}

export class CustomerHistoryResponseDto {
  @Expose()
  id: number;

  @Expose()
  customer: number;

  @Expose()
  user: number;

  @Expose()
  action: string;

  @Expose()
  relatedId: number;

  @Expose()
  description: string;

  @Expose()
  requestData: string;

  @Expose()
  responseData: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatesAt: Date;
}
