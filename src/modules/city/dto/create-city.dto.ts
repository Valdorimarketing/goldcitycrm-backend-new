import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { Expose, Type } from 'class-transformer';

export class CreateCityDto {
  @IsNotEmpty()
  @IsString()
  @Expose()
  name: string;

  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  @Expose()
  state: number;
}

export class UpdateCityDto {
  @IsOptional()
  @IsString()
  @Expose()
  name?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Expose()
  state?: number;
}

export class CityResponseDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  state: number;

  @Expose()
  createdAt: Date;

  @Expose()
  updatesAt: Date;
} 