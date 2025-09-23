import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Customer } from '../../customer/entities/customer.entity';
import { CustomerDynamicField } from '../../customer-dynamic-field/entities/customer-dynamic-field.entity';
import { Expose } from 'class-transformer';

@Entity('customer_dynamic_field_value')
export class CustomerDynamicFieldValue {
  @PrimaryGeneratedColumn()
  @Expose()
  id: number;

  @Column({ type: 'int' })
  @Expose()
  customer: number;

  @Column({ type: 'int' })
  @Expose()
  customer_dynamic_field: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @Expose()
  file: string;

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

  @CreateDateColumn({ name: 'created_at' })
  @Expose()
  created_at: Date;

  @UpdateDateColumn({ name: 'updates_at' })
  @Expose()
  updates_at: Date;

  // Relations
  @ManyToOne(() => Customer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer' })
  @Expose()
  customerRelation: Customer;

  @ManyToOne(() => CustomerDynamicField, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_dynamic_field' })
  @Expose()
  customerDynamicFieldRelation: CustomerDynamicField;
}
