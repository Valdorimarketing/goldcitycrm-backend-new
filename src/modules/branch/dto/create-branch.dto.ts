import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  IsArray,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { Expose, Type } from 'class-transformer';

class BranchTranslationDto {
  @IsNumber()
  @Expose()
  languageId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Expose()
  name: string;
}

export class CreateBranchDto {
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
  @ValidateNested({ each: true })
  @Type(() => BranchTranslationDto)
  @Expose()
  translations: BranchTranslationDto[];

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  @Expose()
  hospitalIds?: number[];
}