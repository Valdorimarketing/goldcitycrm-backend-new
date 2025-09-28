import { IsOptional, IsString, IsNumber, IsNotEmpty } from 'class-validator';
import { Expose, Type } from 'class-transformer';

export class CreatePaymentDto {
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  @Expose()
  customerId: number;

  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  @Expose()
  payType: number;

  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  @Expose()
  amount: number;

  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  @Expose()
  calculatedAmount: number;

  @IsOptional()
  @IsString()
  @Expose()
  description?: string;
}

export class UpdatePaymentDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Expose()
  customerId?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Expose()
  payType?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Expose()
  amount?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Expose()
  calculatedAmount?: number;

  @IsOptional()
  @IsString()
  @Expose()
  description?: string;
}

export class PaymentResponseDto {
  @Expose()
  id: number;

  @Expose()
  customerId: number;

  @Expose()
  customer?: any;

  @Expose()
  payType: number;

  @Expose()
  amount: number;

  @Expose()
  calculatedAmount: number;

  @Expose()
  description: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatesAt: Date;
}
