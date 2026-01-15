import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsISO8601, IsNumber, ValidateNested, IsInt, IsString, IsBoolean } from 'class-validator';

class FollowupItem {
  @IsInt()
  offset: number;

  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsBoolean()
  done?: boolean;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  kind?: 'day' | 'month';
}

class FollowupsDto {
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => FollowupItem)
  days?: FollowupItem[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => FollowupItem)
  months?: FollowupItem[];
}

export class CreateScheduleDto {
  @IsNotEmpty()
  @IsNumber()
  customer_id: number;

  @IsNotEmpty()
  @IsNumber()
  operation_type_id: number;

  @IsNotEmpty()
  @IsISO8601()
  scheduled_at: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => FollowupsDto)
  followups?: FollowupsDto;
}

export class UpdateFollowupItemDto {
  @IsNotEmpty()
  @IsString()
  kind: 'day' | 'month';

  @IsNotEmpty()
  @IsInt()
  offset: number;

  @IsOptional()
  @IsBoolean()
  done?: boolean;

  @IsOptional()
  @IsString()
  note?: string;
}

export class OperationTypeDto {
  id: number;
  code: number;
  name: string;
  description?: string;
}
