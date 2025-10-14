import { IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { BaseQueryFilterDto } from '../../../core/base/dtos/base.query.filter.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

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
}
