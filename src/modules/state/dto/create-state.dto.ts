import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { Expose, Type } from 'class-transformer';

export class CreateStateDto {
  @IsNotEmpty()
  @IsString()
  @Expose()
  name: string;

  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  @Expose()
  country: number;
}

export class UpdateStateDto {
  @IsOptional()
  @IsString()
  @Expose()
  name?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Expose()
  country?: number;
}

export class StateResponseDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  country: number;

  @Expose()
  createdAt: Date;

  @Expose()
  updatesAt: Date;
}
