import { IsOptional, IsString, IsNumber, IsDateString } from 'class-validator';
import { Expose, Type } from 'class-transformer';

export class CreateSalesDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Expose()
  customer?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Expose()
  user?: number;

  @IsOptional()
  @IsString()
  @Expose()
  title?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Expose()
  responsibleUser?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Expose()
  followerUser?: number;

  @IsOptional()
  @IsDateString()
  @Expose()
  maturityDate?: string;

  @IsOptional()
  @IsString()
  @Expose()
  description?: string;
}

export class UpdateSalesDto extends CreateSalesDto {}

export class SalesResponseDto {
  @Expose()
  id: number;

  @Expose()
  customer: number;

  @Expose()
  user: number;

  @Expose()
  title: string;

  @Expose()
  responsibleUser: number;

  @Expose()
  followerUser: number;

  @Expose()
  maturityDate: Date;

  @Expose()
  description: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatesAt: Date;
} 