import {
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsDate,
  IsNotEmpty,
} from 'class-validator';
import { Expose, Type } from 'class-transformer';

export class CreateCustomerNoteDto {
  @IsNotEmpty()
  @IsNumber()
  @Expose()
  customer: number;

  @IsNotEmpty()
  @IsString()
  @Expose()
  note: string;

  @IsOptional()
  @IsBoolean()
  @Expose()
  isReminding?: boolean;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  @Expose()
  remindingAt?: Date;

  @IsOptional()
  @IsString()
  @Expose()
  noteType?: string;
}

export class UpdateCustomerNoteDto {
  @IsOptional()
  @IsNumber()
  @Expose()
  customer?: number;

  @IsOptional()
  @IsString()
  @Expose()
  note?: string;

  @IsOptional()
  @IsBoolean()
  @Expose()
  isReminding?: boolean;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  @Expose()
  remindingAt?: Date;

  @IsOptional()
  @IsString()
  @Expose()
  noteType?: string;
}

export class CustomerNoteResponseDto {
  @Expose()
  id: number;

  @Expose()
  customer: number;

  @Expose()
  user: number;

  @Expose()
  note: string;

  @Expose()
  isReminding: boolean;

  @Expose()
  remindingAt: Date;

  @Expose()
  noteType: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatesAt: Date;
}
