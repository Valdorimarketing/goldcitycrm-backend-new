import {
  Entity,
  Column,
  CreateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Expose } from 'class-transformer';

@Entity('customer_status_change')
export class CustomerStatusChange {
  @PrimaryGeneratedColumn()
  @Expose()
  id: number;

  @Column({ type: 'int' })
  @Expose()
  user_id: number;

  @Column({ type: 'int' })
  @Expose()
  customer_id: number;

  @Column({ type: 'int' })
  @Expose()
  old_status: number;

  @Column({ type: 'int' })
  @Expose()
  new_status: number;

  @CreateDateColumn({ name: 'created_at' })
  @Expose()
  createdAt: Date;
}
