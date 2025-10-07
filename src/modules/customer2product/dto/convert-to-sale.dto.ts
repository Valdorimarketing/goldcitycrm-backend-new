import {
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsString,
  IsArray,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ConvertToSaleDto {
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  customerId: number;

  @IsNotEmpty()
  @IsArray()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  customer2ProductIds: number[];

  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  userId: number;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  responsibleUser?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  followerUser?: number;

  @IsOptional()
  @IsDateString()
  maturityDate?: Date;
}
