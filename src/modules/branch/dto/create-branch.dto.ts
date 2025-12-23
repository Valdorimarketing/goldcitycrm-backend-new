import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  IsArray,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { Expose, Type, Transform } from 'class-transformer';

export class BranchTranslationDto {
  @IsNumber()
  @Expose()
  @Transform(({ value }) => parseInt(value, 10))
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
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value.map(v => parseInt(v, 10));
    }
    return value;
  })
  hospitalIds?: number[];
}