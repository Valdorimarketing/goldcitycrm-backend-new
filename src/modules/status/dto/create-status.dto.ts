import { IsOptional, IsString, IsBoolean, IsNumber } from 'class-validator';
import { Expose } from 'class-transformer';

export class CreateStatusDto {
  @IsOptional()
  @IsString()
  @Expose()
  name?: string;

  @IsOptional()
  @IsString()
  @Expose()
  description?: string;

  @IsOptional()
  @IsBoolean()
  @Expose()
  isRemindable?: boolean;

  @IsOptional()
  @IsNumber()
  @Expose()
  remindingDay?: number;

  @IsOptional()
  @IsBoolean()
  @Expose()
  isDoctor?: boolean;

  @IsOptional()
  @IsBoolean()
  @Expose()
  isPricing?: boolean;

  @IsOptional()
  @IsString()
  @Expose()
  color?: string;

  @IsOptional()
  @IsBoolean()
  @Expose()
  isActive?: boolean;
}
