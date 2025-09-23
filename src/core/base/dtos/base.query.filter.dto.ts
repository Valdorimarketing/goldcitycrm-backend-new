import { IsOptional, IsNumber, IsString, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class BaseQueryFilterDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsString()
  order?: 'ASC' | 'DESC';

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
