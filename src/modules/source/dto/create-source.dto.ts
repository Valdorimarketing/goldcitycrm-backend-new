import { IsString, IsOptional, MaxLength } from 'class-validator';
import { Expose } from 'class-transformer';

export class CreateSourceDto {
  @IsString()
  @MaxLength(255)
  @Expose()
  name: string;

  @IsString()
  @IsOptional()
  @Expose()
  description?: string;
}
