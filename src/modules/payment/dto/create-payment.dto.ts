import { IsOptional, IsString, IsNumber, IsNotEmpty } from 'class-validator';
import { Expose, Type } from 'class-transformer';

export class CreatePaymentDto {
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  @Expose()
  sales: number;

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
  sales?: number;

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
  sales: number;

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
