import { PartialType } from '@nestjs/mapped-types';
import { CreateDoctorToHospitalDto } from './create-doctor-to-hospital.dto';

export class UpdateDoctorToHospitalDto extends PartialType(
  CreateDoctorToHospitalDto,
) {}
