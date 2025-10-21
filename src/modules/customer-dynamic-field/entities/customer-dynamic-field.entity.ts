import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Expose } from 'class-transformer';

@Entity('customer_dynamic_field')
export class CustomerDynamicField {
  @PrimaryGeneratedColumn()
  @Expose()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  @Expose()
  name: string;

  @Column({ type: 'varchar', length: 100 })
  @Expose()
  type: string;

  @Column({ type: 'text', nullable: true })
  @Expose()
  options_data: string;

  @Column({ type: 'int', default: 0 })
  @Expose()
  order: number;

  @Column({ type: 'boolean', default: false })
  @Expose()
  is_required: boolean;

  @CreateDateColumn({ name: 'created_at' })
  @Expose()
  created_at: Date;

  @UpdateDateColumn({ name: 'updates_at' })
  @Expose()
  updates_at: Date;
}
