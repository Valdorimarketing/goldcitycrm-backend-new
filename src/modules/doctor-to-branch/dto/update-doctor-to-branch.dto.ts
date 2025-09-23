import { PartialType } from '@nestjs/mapped-types';
import { CreateDoctorToBranchDto } from './create-doctor-to-branch.dto';

export class UpdateDoctorToBranchDto extends PartialType(
  CreateDoctorToBranchDto,
) {}
