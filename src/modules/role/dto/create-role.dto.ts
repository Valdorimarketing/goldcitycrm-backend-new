import { IsString, IsNotEmpty } from 'class-validator';
import { Expose } from 'class-transformer';

export class CreateRoleDto {
  @IsNotEmpty()
  @IsString()
  @Expose()
  name: string;
}

export class UpdateRoleDto {
  @IsString()
  @Expose()
  name?: string;
}

export class RoleResponseDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatesAt: Date;
} 