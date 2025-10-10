import { IsString, IsNotEmpty } from 'class-validator';
import { Expose } from 'class-transformer';

export class CreateMeetingStatusDto {
  @IsNotEmpty()
  @IsString()
  @Expose()
  name: string;
}

export class UpdateMeetingStatusDto {
  @IsString()
  @Expose()
  name?: string;
}

export class MeetingStatusResponseDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatesAt: Date;
}
