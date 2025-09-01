import { IsEmail, IsString, MinLength } from 'class-validator';
import { Expose } from 'class-transformer';

export class LoginDto {
  @IsEmail()
  @Expose()
  email: string;

  @IsString()
  @MinLength(6)
  @Expose()
  password: string;
}

export class RegisterDto {
  @IsEmail()
  @Expose()
  email: string;

  @IsString()
  @MinLength(6)
  @Expose()
  password: string;

  @IsString()
  @Expose()
  name: string;

  @IsString()
  @Expose()
  role?: string;
}

export class AuthResponseDto {
  @Expose()
  access_token: string;

  @Expose()
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
    isActive: boolean;
  };
} 