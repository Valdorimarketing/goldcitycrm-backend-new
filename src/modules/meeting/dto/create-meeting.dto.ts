// dto/create-meeting.dto.ts

import { IsInt, IsOptional, IsString, IsDateString } from 'class-validator';
import { Expose } from 'class-transformer';

export class CreateMeetingDto {
  @IsInt()
  @Expose()
  customer: number;

  @IsInt()
  @IsOptional()
  @Expose()
  hospitalId?: number;

  @IsInt()
  @IsOptional()
  @Expose()
  branchId?: number;

  @IsInt()
  @IsOptional()
  @Expose()
  doctorId?: number;

  @IsDateString()
  @IsOptional()
  @Expose()
  remindingAt?: Date;

  @IsDateString()
  @IsOptional()
  @Expose()
  startTime?: Date;

  @IsDateString()
  @IsOptional()
  @Expose()
  endTime?: Date;

  @IsInt()
  @Expose()
  user: number;

  // ✅ DÜZELTİLDİ: meetingStatus → meetingStatusId
  @IsInt()
  @IsOptional()
  @Expose()
  meetingStatusId?: number;

  @IsString()
  @IsOptional()
  @Expose()
  description?: string;

  @IsInt()
  @IsOptional()
  @Expose()
  salesProductId?: number;
}

export class UpdateMeetingDto {
  @IsInt()
  @IsOptional()
  @Expose()
  customer?: number;

  @IsInt()
  @IsOptional()
  @Expose()
  hospitalId?: number;

  @IsInt()
  @IsOptional()
  @Expose()
  branchId?: number;

  @IsInt()
  @IsOptional()
  @Expose()
  doctorId?: number;

  @IsDateString()
  @IsOptional()
  @Expose()
  remindingAt?: Date;

  @IsDateString()
  @IsOptional()
  @Expose()
  startTime?: Date;

  @IsDateString()
  @IsOptional()
  @Expose()
  endTime?: Date;

  @IsInt()
  @IsOptional()
  @Expose()
  user?: number;

  // ✅ DÜZELTİLDİ: meetingStatus → meetingStatusId
  @IsInt()
  @IsOptional()
  @Expose()
  meetingStatusId?: number;

  @IsString()
  @IsOptional()
  @Expose()
  description?: string;

  @IsInt()
  @IsOptional()
  @Expose()
  salesProductId?: number;
}

export class MeetingResponseDto {
  @Expose()
  id: number;

  @Expose()
  customer: number;

  @Expose()
  customerData?: any;

  @Expose()
  hospitalId?: number;

  @Expose()
  hospital?: any;

  @Expose()
  branchId?: number;

  @Expose()
  branch?: any;

  @Expose()
  doctorId?: number;

  @Expose()
  doctor?: any;

  @Expose()
  remindingAt?: Date;

  @Expose()
  startTime?: Date;

  @Expose()
  endTime?: Date;

  @Expose()
  user: number;

  // ✅ DÜZELTİLDİ: Hem ID hem relation
  @Expose()
  meetingStatusId?: number;

  @Expose()
  meetingStatus?: any;

  @Expose()
  description?: string;

  @Expose()
  salesProductId?: number;

  @Expose()
  salesProduct?: any;

  @Expose()
  createdAt?: Date;

  @Expose()
  updatedAt?: Date;
}