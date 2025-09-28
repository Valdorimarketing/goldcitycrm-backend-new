import { Expose, Type } from 'class-transformer';

export class UserInfo {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  email: string;
}

export class FraudAlertResponseDto {
  @Expose()
  id: number;

  @Expose()
  userId: number;

  @Expose()
  @Type(() => UserInfo)
  user: UserInfo;

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
