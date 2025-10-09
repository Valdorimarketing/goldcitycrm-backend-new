import { IsOptional, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { BaseQueryFilterDto } from '../../../core/base/dtos/base.query.filter.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ProductQueryFilterDto extends BaseQueryFilterDto {
  @ApiPropertyOptional({
    description: 'Search term for product name',
    example: 'Product A',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Minimum price filter',
    example: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minPrice?: number;

  @ApiPropertyOptional({
    description: 'Maximum price filter',
    example: 1000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxPrice?: number;
}
