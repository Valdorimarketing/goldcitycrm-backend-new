import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  MaxLength,
  IsArray,
} from 'class-validator';
import { Expose, Type } from 'class-transformer';

export class CreateDoctorDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Expose()
  name: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Expose()
  branchId?: number;

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  @Expose()
  branchIds?: number[];

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  @Expose()
  hospitalIds?: number[];
}
