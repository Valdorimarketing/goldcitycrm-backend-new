import { PartialType } from '@nestjs/mapped-types';
import { CreateCustomer2DoctorDto } from './create-customer2doctor.dto';

export class UpdateCustomer2DoctorDto extends PartialType(
  CreateCustomer2DoctorDto,
) {}
