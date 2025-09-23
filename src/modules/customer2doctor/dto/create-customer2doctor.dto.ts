import { IsInt, IsOptional, IsString } from 'class-validator';
import { Expose } from 'class-transformer';

export class CreateCustomer2DoctorDto {
  @IsInt()
  @Expose()
  doctorId: number;

  @IsInt()
  @Expose()
  customerId: number;

  @IsOptional()
  @IsString()
  @Expose()
  note?: string;

  @IsOptional()
  @IsString()
  @Expose()
  doctorComment?: string;

  @IsOptional()
  @IsInt()
  @Expose()
  user?: number;
}
