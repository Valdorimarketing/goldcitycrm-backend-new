import { IsOptional, IsString, IsNumber, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
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
  @Type(() => Boolean)
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
  @Type(() => Boolean)
  @IsBoolean()
  isFirst?: boolean;
}
