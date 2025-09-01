import { Entity, Column, CreateDateColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity('customer_status_change')
export class CustomerStatusChange {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  user_id: number;

  @Column({ type: 'int' })
  customer_id: number;

  @Column({ type: 'int' })
  old_status: number;

  @Column({ type: 'int' })
  new_status: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}