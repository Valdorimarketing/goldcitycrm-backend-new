import { IsNotEmpty, IsString, IsOptional, IsInt } from 'class-validator';
import { Expose } from 'class-transformer';

export class CreateActionListDto {
  @IsNotEmpty()
  @IsInt()
  @Expose()
  user: number;

  @IsNotEmpty()
  @IsInt()
  @Expose()
  product: number;

  @IsOptional()
  @IsInt()
  @Expose()
  plannedDate?: number;

  @IsNotEmpty()
  @IsString()
  @Expose()
  name: string;

  @IsOptional()
  @IsString()
  @Expose()
  description?: string;
}