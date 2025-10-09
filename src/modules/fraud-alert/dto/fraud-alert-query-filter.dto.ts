import { IsOptional, IsString, IsNumber, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { BaseQueryFilterDto } from '../../../core/base/dtos/base.query.filter.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FraudAlertQueryFilterDto extends BaseQueryFilterDto {
  @ApiPropertyOptional({
    description: 'Search term for message content',
    example: 'suspicious activity',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by user ID',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  userId?: number;

  @ApiPropertyOptional({
    description: 'Filter by read status',
    example: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isRead?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by checked status',
    example: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isChecked?: boolean;
}
