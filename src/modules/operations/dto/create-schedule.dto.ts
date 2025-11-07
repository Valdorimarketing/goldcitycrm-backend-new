import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsISO8601, IsNumber, ValidateNested, IsInt } from 'class-validator';

class OffsetItem {
  @IsInt()
  offset: number;
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
  @Type(() => Object)
  followups?: {
    days?: OffsetItem[],
    months?: OffsetItem[]
  }
}

export class OperationTypeDto {
  id: number;
  code: number;
  name: string;
  description?: string;
}
