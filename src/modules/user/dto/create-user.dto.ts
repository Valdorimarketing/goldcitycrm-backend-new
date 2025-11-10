import {
  IsOptional,
  IsString,
  IsEmail,
  IsNotEmpty,
  IsBoolean,
  IsNumber,
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
  @IsString()
  @Expose()
  avatar?: string;

  @IsOptional()
  @IsBoolean()
  @Expose()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  @Expose()
  userGroupId?: number;
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
  @IsString()
  @Expose()
  avatar?: string;

  @IsOptional()
  @IsBoolean()
  @Expose()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  @Expose()
  userGroupId?: number;
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
  avatar: string;

  @Expose()
  isActive: boolean;

  @Expose()
  userGroupId: number;

  @Expose()
  createdAt: Date;

  @Expose()
  updatesAt: Date;
}
