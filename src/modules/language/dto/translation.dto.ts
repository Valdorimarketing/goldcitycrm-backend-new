// src/language/dto/translation.dto.ts

import { IsString, IsNotEmpty, IsNumber, IsOptional, MaxLength, IsObject, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTranslationKeyDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  keyName: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class CreateTranslationDto {
  @IsNumber()
  @IsNotEmpty()
  languageId: number;

  @IsNumber()
  @IsNotEmpty()
  translationKeyId: number;

  @IsString()
  @IsNotEmpty()
  value: string;
}

export class UpdateTranslationDto {
  @IsString()
  @IsOptional()
  value?: string;
}

export class BulkTranslationDto {
  @IsString()
  @IsNotEmpty()
  keyName: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsObject()
  @IsNotEmpty()
  translations: Record<string, string>; // { "tr": "Merhaba", "en": "Hello" }
}

export class BulkCreateTranslationsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkTranslationDto)
  items: BulkTranslationDto[];
}

export class GetTranslationsDto {
  @IsString()
  @IsOptional()
  languageCode?: string;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  keys?: string[];
}