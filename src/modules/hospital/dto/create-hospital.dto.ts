import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { Expose } from 'class-transformer';

export class CreateHospitalDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Expose()
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Expose()
  code: string;

  @IsString()
  @IsOptional()
  @Expose()
  address?: string;

  @IsString()
  @IsOptional()
  @Expose()
  description?: string;
}
