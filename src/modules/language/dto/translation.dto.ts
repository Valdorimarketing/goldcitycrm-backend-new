import { 
  IsString, 
  IsNotEmpty, 
  IsInt, 
  IsOptional, 
  IsArray, 
  ValidateNested,
  IsObject 
} from 'class-validator';
import { Type } from 'class-transformer';

// Translation Key DTO
export class CreateTranslationKeyDto {
  @IsString()
  @IsNotEmpty()
  keyName: string;

  @IsString()
  @IsOptional()
  description?: string;
}

// Single Translation DTO
export class CreateTranslationDto {
  @IsInt()
  @IsNotEmpty()
  languageId: number;

  @IsInt()
  @IsNotEmpty()
  translationKeyId: number;

  @IsString()
  @IsNotEmpty()
  value: string;
}

export class UpdateTranslationDto {
  @IsString()
  @IsNotEmpty()
  value: string;

  @IsString()
  @IsOptional()
  description?: string;
}

// Bulk Translation Item
export class BulkTranslationItemDto {
  @IsString()
  @IsNotEmpty()
  keyName: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsObject()
  @IsNotEmpty()
  translations: Record<string, string>; // { "tr": "değer", "en": "value" }
}

// ✅ Bulk Create DTO - DOĞRU FORMAT
export class BulkCreateTranslationsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkTranslationItemDto)
  items: BulkTranslationItemDto[];
}

// Get Translations DTO
export class GetTranslationsDto {
  @IsString()
  @IsOptional()
  languageCode?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  keys?: string[];
}