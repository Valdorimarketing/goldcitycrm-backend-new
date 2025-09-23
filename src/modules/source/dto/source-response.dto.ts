import { Expose } from 'class-transformer';

export class SourceResponseDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  description: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
