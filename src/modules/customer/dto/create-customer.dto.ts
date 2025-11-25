import {
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsEmail,
} from 'class-validator';
import { Expose, Type } from 'class-transformer';

export class CreateCustomerDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Expose()
  user?: number;

  @IsOptional()
  @IsString()
  @Expose()
  name?: string;

  @IsOptional()
  @IsString()
  @Expose()
  surname?: string;

  @IsOptional()
  @IsString()
  @Expose()
  title?: string;

  @IsOptional()
  @IsEmail()
  @Expose()
  email?: string;

  @IsOptional()
  @IsString()
  @Expose()
  gender?: string;

  @IsOptional()
  @IsString()
  @Expose()
  birthDate?: string;

  @IsOptional()
  @IsString()
  @Expose()
  phone?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Expose()
  sourceId?: number;

  @IsOptional()
  @IsString()
  @Expose()
  job?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Expose()
  identityNumber?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Expose()
  referanceCustomer?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Expose()
  language?: number;

  @IsOptional()
  @IsBoolean()
  @Expose()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Expose()
  status?: number;

  @IsOptional()
  @IsString()
  @Expose()
  website?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Expose()
  country?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Expose()
  state?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Expose()
  city?: number;

  @IsOptional()
  @IsString()
  @Expose()
  district?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Expose()
  postalCode?: number;

  @IsOptional()
  @IsString()
  @Expose()
  address?: string;

  @IsOptional()
  @IsString()
  @Expose()
  url?: string;

  @IsOptional()
  @IsString()
  @Expose()
  message?: string;

  @IsOptional()
  @IsString()
  @Expose()
  checkup_package?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Expose()
  relevantUser?: number;

  @IsOptional()
  @IsString()
  @Expose()
  description?: string;

  @IsOptional()
  @IsString()
  @Expose()
  image?: string;

  @IsOptional()
  @IsString()
  @Expose()
  relatedTransaction?: string;

  @IsOptional()
  @Type(() => Date)
  @Expose()
  remindingDate?: Date;

  @IsOptional()
  @Expose()
  dynamicFields?: any[];
}

export class UpdateCustomerDto extends CreateCustomerDto {}

export class CustomerResponseDto {
  @Expose()
  id: number;

  @Expose()
  user: number;

  @Expose()
  name: string;

  @Expose()
  surname: string;

  @Expose()
  title: string;

  @Expose()
  email: string;

  @Expose()
  gender: string;

  @Expose()
  birthDate: string;

  @Expose()
  patient: string;

  @Expose()
  phone: string;

  @Expose()
  sourceId: number;

  @Expose()
  job: string;

  @Expose()
  identityNumber: number;

  @Expose()
  referanceCustomer: number;

  @Expose()
  language: number;

  @Expose()
  isActive: boolean;

  @Expose()
  status: number;

  @Expose()
  website: string;

  @Expose()
  country: number;

  @Expose()
  state: number;

  @Expose()
  city: number;

  @Expose()
  district: string;

  @Expose()
  postalCode: number;

  @Expose()
  address: string;

  @Expose()
  url: string;

  @Expose()
  message: string;
 
  @Expose()
  checkup_package?: string;

  @Expose()
  relevantUser: number;

  @Expose()
  description: string;

  @Expose()
  image: string;

  @Expose()
  relatedTransaction: string;

  @Expose()
  remindingDate: Date;

  @Expose()
  createdAt: Date;

  @Expose()
  updatesAt: Date;

  @Expose()
  dynamicFieldValues?: any[];
}

export class CheckPhoneResponseDto {
  @Expose()
  exists: boolean;

  @Expose()
  phone: string;
}


export class TodayAssignmentDto {
  @Expose()
  salesRepId: string;
  
  @Expose()
  salesRepName: string;

  @Expose()
  count: number;
}