import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { Expose } from 'class-transformer';

export class CreateStatusDto {
  @IsOptional()
  @IsString()
  @Expose()
  name?: string;

  @IsOptional()
  @IsString()
  @Expose()
  description?: string;

  @IsOptional()
  @IsString()
  @Expose()
  color?: string;

  @IsOptional()
  @IsBoolean()
  @Expose()
  isActive?: boolean;
}
