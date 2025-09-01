import { PartialType } from '@nestjs/mapped-types';
import { CreateFraudAlertDto } from './create-fraud-alert.dto';

export class UpdateFraudAlertDto extends PartialType(CreateFraudAlertDto) {}