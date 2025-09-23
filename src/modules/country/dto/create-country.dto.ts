import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { Expose } from 'class-transformer';

export class CreateCountryDto {
  @IsNotEmpty()
  @IsString()
  @Expose()
  name: string;
}

export class UpdateCountryDto {
  @IsOptional()
  @IsString()
  @Expose()
  name?: string;
}

export class CountryResponseDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatesAt: Date;
}
