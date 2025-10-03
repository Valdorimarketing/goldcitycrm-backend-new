import { Expose } from 'class-transformer';

export class UserGroupResponseDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatesAt: Date;
}
