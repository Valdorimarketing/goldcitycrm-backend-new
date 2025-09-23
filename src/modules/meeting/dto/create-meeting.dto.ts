import { IsOptional, IsString, IsNumber, IsDateString } from 'class-validator';
import { Expose, Type } from 'class-transformer';

export class CreateMeetingDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Expose()
  customer?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Expose()
  meetingLocation?: number;

  @IsOptional()
  @IsDateString()
  @Expose()
  remindingAt?: Date;

  @IsOptional()
  @IsDateString()
  @Expose()
  startTime?: Date;

  @IsOptional()
  @IsDateString()
  @Expose()
  endTime?: Date;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Expose()
  user?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Expose()
  meetingStatus?: number;

  @IsOptional()
  @IsString()
  @Expose()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Expose()
  salesProductId?: number;
}

export class UpdateMeetingDto extends CreateMeetingDto {}

export class MeetingResponseDto {
  @Expose()
  id: number;

  @Expose()
  customer: number;

  @Expose()
  meetingLocation: number;

  @Expose()
  remindingAt: Date;

  @Expose()
  startTime: Date;

  @Expose()
  endTime: Date;

  @Expose()
  user: number;

  @Expose()
  meetingStatus: number;

  @Expose()
  description: string;

  @Expose()
  salesProductId: number;

  @Expose()
  salesProduct?: any;

  @Expose()
  createdAt: Date;

  @Expose()
  updatesAt: Date;
}
