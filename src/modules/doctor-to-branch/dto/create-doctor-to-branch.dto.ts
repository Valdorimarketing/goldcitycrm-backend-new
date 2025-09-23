import { IsNumber, IsNotEmpty } from 'class-validator';
import { Expose, Type } from 'class-transformer';

export class CreateDoctorToBranchDto {
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  @Expose()
  doctorId: number;

  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  @Expose()
  branchId: number;
}
