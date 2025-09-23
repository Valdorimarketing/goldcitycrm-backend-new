import { IsNumber, IsNotEmpty } from 'class-validator';
import { Expose, Type } from 'class-transformer';

export class CreateDoctorToHospitalDto {
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  @Expose()
  doctorId: number;

  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  @Expose()
  hospitalId: number;
}
