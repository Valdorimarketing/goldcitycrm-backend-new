import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Expose } from 'class-transformer';

export class CreateUserGroupDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  @Expose()
  name: string;
}
