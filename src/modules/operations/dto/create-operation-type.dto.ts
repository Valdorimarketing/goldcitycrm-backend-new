import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateOperationTypeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}
