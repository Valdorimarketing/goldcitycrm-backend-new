import { IsOptional, IsString } from 'class-validator';
import { BaseQueryFilterDto } from '../../../core/base/dtos/base.query.filter.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class BranchQueryFilterDto extends BaseQueryFilterDto {
  @ApiPropertyOptional({
    description: 'Search term for name, code or description',
    example: 'cardiology',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
