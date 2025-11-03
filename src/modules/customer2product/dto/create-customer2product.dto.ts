import { IsNotEmpty, IsOptional, IsNumber, IsString } from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { User } from 'src/modules/user/entities/user.entity';

export class CreateCustomer2ProductDto {
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  product: number;

  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  customer: number;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  price?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  discount?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  offer?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Expose()
  user?: User;
}
