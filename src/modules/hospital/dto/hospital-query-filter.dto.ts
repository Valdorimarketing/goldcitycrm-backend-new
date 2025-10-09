import { IsOptional, IsString } from 'class-validator';
import { BaseQueryFilterDto } from '../../../core/base/dtos/base.query.filter.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class HospitalQueryFilterDto extends BaseQueryFilterDto {
  @ApiPropertyOptional({
    description: 'Search term for name, code, address or description',
    example: 'hospital',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
