import { IsOptional, IsNumber, IsString, IsEnum, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { BaseQueryFilterDto } from '../../../core/base/dtos/base.query.filter.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Ödeme durumu filtresi
 * Vue sayfasındaki paymentFilter select box'ı bu enum'u kullanır
 */
export enum PaymentStatusFilter {
  ALL = 'all',
  COMPLETED = 'completed',
  PARTIAL = 'partial',
  UNPAID = 'unpaid',
}

export class SalesQueryFilterDto extends BaseQueryFilterDto {
  @ApiPropertyOptional({
    description: 'Filter by user ID',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  user?: number;

  @ApiPropertyOptional({
    description: 'Filter by customer ID',
    example: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  customer?: number;

  @ApiPropertyOptional({
    description: 'Filter by responsible user ID',
    example: 2,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  responsibleUser?: number;

  @ApiPropertyOptional({
    description: 'Filter by currency code (e.g., TRY, EUR, USD)',
    example: 'EUR',
  })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({
    description: 'Filter by payment status',
    enum: PaymentStatusFilter,
    example: PaymentStatusFilter.COMPLETED,
  })
  @IsOptional()
  @IsEnum(PaymentStatusFilter)
  paymentStatus?: PaymentStatusFilter;

  @ApiPropertyOptional({
    description: 'Start date filter (YYYY-MM-DD)',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date filter (YYYY-MM-DD)',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}