import { IsNotEmpty, IsOptional, IsString, IsNumber, IsArray } from 'class-validator';
import { Expose, Type } from 'class-transformer';

export class CreateDoctorDto {
  @IsNotEmpty()
  @IsString()
  @Expose()
  name: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Expose()
  branchId?: number;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  @Expose()
  hospitalIds?: number[];

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  @Expose()
  branchIds?: number[];
}