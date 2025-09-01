import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Customer } from '../../customer/entities/customer.entity';
import { CustomerDynamicField } from '../../customer-dynamic-field/entities/customer-dynamic-field.entity';

@Entity('customer_dynamic_field_value')
export class CustomerDynamicFieldValue {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  customer: number;

  @Column({ type: 'int' })
  customer_dynamic_field: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  file: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 100 })
  type: string;

  @Column({ type: 'text', nullable: true })
  options_data: string;

  @Column({ type: 'int', default: 0 })
  order: number;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updates_at' })
  updates_at: Date;

  // Relations
  @ManyToOne(() => Customer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer' })
  customerRelation: Customer;

  @ManyToOne(() => CustomerDynamicField, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_dynamic_field' })
  customerDynamicFieldRelation: CustomerDynamicField;
}

