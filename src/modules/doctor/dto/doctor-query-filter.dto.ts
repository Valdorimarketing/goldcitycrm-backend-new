import { IsOptional, IsString } from 'class-validator';
import { BaseQueryFilterDto } from '../../../core/base/dtos/base.query.filter.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class DoctorQueryFilterDto extends BaseQueryFilterDto {
  @ApiPropertyOptional({
    description: 'Search term for doctor name',
    example: 'Dr. Smith',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
