import {
  IsOptional,
  IsString,
  IsEmail,
  IsNotEmpty,
  IsBoolean,
  MinLength,
} from 'class-validator';
import { Expose } from 'class-transformer';

export class CreateUserDto {
  @IsNotEmpty()
  @IsEmail()
  @Expose()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  @Expose()
  password: string;

  @IsNotEmpty()
  @IsString()
  @Expose()
  name: string;

  @IsOptional()
  @IsString()
  @Expose()
  role?: string;

  @IsOptional()
  @IsBoolean()
  @Expose()
  isActive?: boolean;
}

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  @Expose()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  @Expose()
  password?: string;

  @IsOptional()
  @IsString()
  @Expose()
  name?: string;

  @IsOptional()
  @IsString()
  @Expose()
  role?: string;

  @IsOptional()
  @IsBoolean()
  @Expose()
  isActive?: boolean;
}

export class UserResponseDto {
  @Expose()
  id: number;

  @Expose()
  email: string;

  @Expose()
  name: string;

  @Expose()
  role: string;

  @Expose()
  isActive: boolean;

  @Expose()
  createdAt: Date;

  @Expose()
  updatesAt: Date;
}
