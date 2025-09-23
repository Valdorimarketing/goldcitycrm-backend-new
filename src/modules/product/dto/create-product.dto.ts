import {
  IsOptional,
  IsString,
  IsNumber,
  IsNotEmpty,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Expose, Type } from 'class-transformer';

export class ActionListItemDto {
  @IsNumber()
  @Expose()
  dayOffset: number;

  @IsString()
  @Expose()
  actionType: string;

  @IsString()
  @Expose()
  description: string;
}

export class CreateProductDto {
  @IsNotEmpty()
  @IsString()
  @Expose()
  name: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Expose()
  price?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ActionListItemDto)
  @Expose()
  actionList?: ActionListItemDto[];
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @Expose()
  name?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Expose()
  price?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ActionListItemDto)
  @Expose()
  actionList?: ActionListItemDto[];
}

export class ProductResponseDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  price: number;

  @Expose()
  createdAt: Date;

  @Expose()
  updatesAt: Date;

  @Expose()
  actionList: ActionListItemDto[];
}
