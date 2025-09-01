import { Expose } from 'class-transformer';

export class FraudAlertResponseDto {
  @Expose()
  id: number;

  @Expose()
  user: number;

  @Expose()
  message: string;

  @Expose()
  isRead: boolean;

  @Expose()
  isChecked: boolean;

  @Expose()
  createdAt: Date;

  @Expose()
  updatesAt: Date;
}