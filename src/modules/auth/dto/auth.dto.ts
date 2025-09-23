import { IsEmail, IsString, MinLength } from 'class-validator';
import { Expose } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  @IsEmail()
  @Expose()
  email: string;

  @ApiProperty({
    example: 'password123',
    description: 'User password (min 6 characters)',
  })
  @IsString()
  @MinLength(6)
  @Expose()
  password: string;
}

export class RegisterDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  @IsEmail()
  @Expose()
  email: string;

  @ApiProperty({
    example: 'password123',
    description: 'User password (min 6 characters)',
  })
  @IsString()
  @MinLength(6)
  @Expose()
  password: string;

  @ApiProperty({ example: 'John Doe', description: 'User full name' })
  @IsString()
  @Expose()
  name: string;

  @ApiPropertyOptional({ example: 'user', description: 'User role' })
  @IsString()
  @Expose()
  role?: string;
}

export class AuthResponseDto {
  @ApiProperty({ description: 'JWT access token' })
  @Expose()
  access_token: string;

  @ApiProperty({
    description: 'User information',
    example: {
      id: 1,
      email: 'user@example.com',
      name: 'John Doe',
      role: 'user',
      isActive: true,
    },
  })
  @Expose()
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
    isActive: boolean;
  };
}
