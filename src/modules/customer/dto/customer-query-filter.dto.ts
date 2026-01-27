import { IsOptional, IsString, IsNumber, IsBoolean, IsDateString } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { BaseQueryFilterDto } from '../../../core/base/dtos/base.query.filter.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CustomerQueryFilterDto extends BaseQueryFilterDto {
  @ApiPropertyOptional({
    description:
      'Search term for name, surname, email, phone, or identity number',
    example: 'john',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ 
    description: 'Status ID (single number or comma-separated string)',
    examples: [2, '2,11,12,13']
  })
  @IsOptional()
  status?: number | string;

  
  @ApiPropertyOptional({
    description: 'Filter by active state',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by relevant user ID',
    example: 15,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  relevantUser?: number;

  @ApiPropertyOptional({
    description: 'Filter by multiple relevant user IDs (comma-separated or single)',
    examples: [56, '56,57,58'],
  })
  @IsOptional()
  relevantUsers?: number | string;

  @ApiPropertyOptional({
    description: 'Filter by source ID',
    example: 4,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sourceId?: number;

  @ApiPropertyOptional({
    description: 'Filter customers by status.is_first property',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean()
  isFirst?: boolean;

  @ApiPropertyOptional({
    description: 'Filter customers by status.is_doctor property',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean()
  isDoctor?: boolean;

  @ApiPropertyOptional({
    description: 'Filter customers by status.is_pricing property',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean()
  isPricing?: boolean;

  @IsOptional()
  @IsBoolean()
  hasRelevantUser?: boolean;

  @ApiPropertyOptional({
    description: 'Date filter keyword (today, week, month, overdue, custom, all)',
    example: 'today',
  })
  @IsOptional()
  @IsString()
  dateFilter?: string;

  @ApiPropertyOptional({
    description: 'Start date for custom range (YYYY-MM-DD)',
    example: '2025-10-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for custom range (YYYY-MM-DD)',
    example: '2025-10-31',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;


}
