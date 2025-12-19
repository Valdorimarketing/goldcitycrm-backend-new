import { IsOptional, IsString, IsNumber } from 'class-validator';
import { BaseQueryFilterDto } from '../../../core/base/dtos/base.query.filter.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class BranchQueryFilterDto extends BaseQueryFilterDto {
  @ApiPropertyOptional({
    description: 'Search term for name, code or description',
    example: 'cardiology',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Language ID for translations',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  languageId?: number;
  
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  hospitalId?: number;
}