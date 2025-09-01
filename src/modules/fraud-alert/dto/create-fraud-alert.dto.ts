import { IsOptional, IsNumber, IsString, IsBoolean } from 'class-validator';
import { Expose, Type } from 'class-transformer';

export class CreateFraudAlertDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Expose()
  user?: number;

  @IsOptional()
  @IsString()
  @Expose()
  message?: string;

  @IsOptional()
  @IsBoolean()
  @Expose()
  isRead?: boolean;

  @IsOptional()
  @IsBoolean()
  @Expose()
  isChecked?: boolean;
}