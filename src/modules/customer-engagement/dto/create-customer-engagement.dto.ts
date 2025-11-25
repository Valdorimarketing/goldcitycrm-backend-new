import { IsNumber, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { Expose } from 'class-transformer';
import { CustomerEngagementRole } from '../entities/customer-engagement.entity';

export class CreateCustomerEngagementDto {
  @IsNotEmpty()
  @IsNumber()
  @Expose()
  customer: number;

  @IsNotEmpty()
  @IsNumber()
  @Expose()
  user: number;

  @IsNotEmpty()
  @IsEnum(CustomerEngagementRole)
  @Expose()
  role: CustomerEngagementRole;

  @IsOptional()
  @Expose()
  assignedAt?: Date;

  @IsOptional()
  @Expose()
  meta?: any;

  @Expose()
  whoCanSee?: number[];
}

export class UpdateCustomerEngagementDto {
  @IsOptional()
  @Expose()
  firstTouchAt?: Date | null;

  @IsOptional()
  @Expose()
  firstCallAt?: Date | null;

  @IsOptional()
  @Expose()
  lastTouchAt?: Date | null;

  @IsOptional()
  @Expose()
  releasedAt?: Date | null;

  @IsOptional()
  @Expose()
  meta?: any;

  @Expose()
  whoCanSee?: number[];
}

export class CustomerEngagementResponseDto {
  @Expose()
  id: number;

  @Expose()
  customer: number;

  @Expose()
  user: number;

  @Expose()
  role: CustomerEngagementRole;

  @Expose()
  assignedAt: Date;

  @Expose()
  firstTouchAt: Date | null;

  @Expose()
  firstCallAt: Date | null;

  @Expose()
  lastTouchAt: Date | null;

  @Expose()
  releasedAt: Date | null;

  @Expose()
  meta: any;
  
  @Expose()
  whoCanSee?: number[];

  @Expose()
  createdAt: Date;

  @Expose()
  updatesAt: Date;
}
