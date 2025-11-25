import { IsNumber, IsNotEmpty, IsOptional, IsEnum, IsString } from 'class-validator';
import { Expose } from 'class-transformer';
import { CallDirection } from '../entities/customer-call-log.entity';

export class CreateCustomerCallLogDto {
  @IsNotEmpty()
  @IsNumber()
  @Expose()
  customer: number;

  @IsNotEmpty()
  @IsNumber()
  @Expose()
  user: number;

  @IsOptional()
  @IsNumber()
  @Expose()
  engagement?: number;

  @IsNotEmpty()
  @Expose()
  startedAt: Date;

  @IsOptional()
  @Expose()
  endedAt?: Date | null;

  @IsOptional()
  @IsEnum(CallDirection)
  @Expose()
  direction?: CallDirection;

  @IsOptional()
  @IsString()
  @Expose()
  note?: string;
}

export class UpdateCustomerCallLogDto {
  @IsOptional()
  @Expose()
  endedAt?: Date | null;

  @IsOptional()
  @IsString()
  @Expose()
  note?: string;
}

export class CustomerCallLogResponseDto {
  @Expose()
  id: number;

  @Expose()
  customer: number;

  @Expose()
  user: number;

  @Expose()
  engagement: number | null;

  @Expose()
  startedAt: Date;

  @Expose()
  endedAt: Date | null;

  @Expose()
  direction: CallDirection;

  @Expose()
  note: string | null;

  @Expose()
  createdAt: Date;

  @Expose()
  updatesAt: Date;
}
