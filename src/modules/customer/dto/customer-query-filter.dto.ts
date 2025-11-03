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
    description: 'Filter by status ID',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  status?: number;

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

  @ApiPropertyOptional({
    description:
      'Filter by whether relevant_user is filled or empty. true: has relevant_user (NOT NULL), false: no relevant_user (IS NULL)',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
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
