import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { CustomBaseEntity } from '../../../core/base/entities/base.entity';
import { Expose } from 'class-transformer';
import { Customer } from '../../customer/entities/customer.entity';

@Entity('payment')
export class Payment extends CustomBaseEntity {
  @Column({ type: 'int', nullable: true, name: 'customer_id' })
  @Expose()
  customerId: number;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  @Expose()
  customer: Customer;

  @Column({ type: 'int', name: 'pay_type' })
  @Expose()
  payType: number;

  @Column({ type: 'float' })
  @Expose()
  amount: number;

  @Column({ type: 'float', name: 'calculated_amount' })
  @Expose()
  calculatedAmount: number;

  @Column({ type: 'text', nullable: true })
  @Expose()
  description: string;

  constructor(partial?: Partial<Payment>) {
    super(partial);
  }
}
