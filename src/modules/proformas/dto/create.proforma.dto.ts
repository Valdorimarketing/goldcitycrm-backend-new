import { 
  IsString, 
  IsNumber, 
  IsOptional, 
  IsDateString, 
  IsArray, 
  ValidateNested,
  IsEnum
} from 'class-validator';
import { Type } from 'class-transformer';

export class TreatmentItemDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  procedure: string;

  @IsString()
  visitType: string;

  @IsString()
  estimatedCost: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateProformaDto {
  @IsOptional()
  @IsNumber()
  patientId?: number;

  @IsOptional()
  @IsNumber()
  saleId?: number;

  @IsDateString()
  date: string;

  // GENERAL INFORMATION
  @IsOptional()
  @IsString()
  patientName?: string;

  @IsOptional()
  @IsString()
  hospital?: string;

  @IsOptional()
  @IsString()
  physicianName?: string;

  @IsOptional()
  @IsString()
  physicianDepartment?: string;

  @IsOptional()
  @IsString()
  age?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  comedNo?: string;

  // ADDITIONAL INFO (Optional)
  @IsOptional()
  @IsString()
  additionalInfo?: string;

  @IsOptional()
  @IsString()
  physicianOpinion?: string;

  // TREATMENT ITEMS
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TreatmentItemDto)
  treatmentItems: TreatmentItemDto[];

  @IsNumber()
  grandTotal: number;

  @IsOptional()
  @IsString()
  currency?: string;

  // Services Included (Optional)
  @IsOptional()
  @IsArray()
  servicesIncluded?: string[];

  // BANK INFORMATION (with defaults)
  @IsOptional()
  @IsString()
  bankName?: string;

  @IsOptional()
  @IsString()
  receiverName?: string;

  @IsOptional()
  @IsString()
  branchName?: string;

  @IsOptional()
  @IsString()
  branchCode?: string;

  @IsOptional()
  @IsString()
  bankCurrency?: string;

  @IsOptional()
  @IsString()
  iban?: string;

  @IsOptional()
  @IsString()
  swiftCode?: string;

  // Hospital Contact
  @IsOptional()
  @IsString()
  hospitalAddress?: string;

  @IsOptional()
  @IsString()
  hospitalPhone?: string;

  @IsOptional()
  @IsString()
  hospitalEmail?: string;

  @IsOptional()
  @IsEnum(['draft', 'sent', 'paid', 'cancelled'])
  status?: string;
}