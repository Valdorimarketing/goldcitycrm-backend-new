import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  IsArray,
  IsNumber,
} from 'class-validator';
import { Expose } from 'class-transformer';

export class CreateBranchDto {
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
  description?: string;

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  @Expose()
  hospitalIds?: number[];
}
