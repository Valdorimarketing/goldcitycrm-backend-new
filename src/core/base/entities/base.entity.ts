import {
  BaseEntity,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Expose } from 'class-transformer';

export class CustomBaseEntity extends BaseEntity {
  @PrimaryGeneratedColumn()
  @Expose()
  id: number;

  @CreateDateColumn({ name: 'created_at' })
  @Expose()
  createdAt: Date;

  @UpdateDateColumn({ name: 'updates_at' }) // SQL'de updates_at olarak tanımlanmış
  @Expose()
  updatesAt: Date;

  constructor(partial?: any) {
    super();
    if (partial) {
      Object.assign(this, partial);
    }
  }

  setPartial(partial: any) {
    Object.assign(this, partial);
  }
} 