import { Entity, Column } from 'typeorm';
import { CustomBaseEntity } from '../../../core/base/entities/base.entity';
import { Expose } from 'class-transformer';

@Entity('payment')
export class Payment extends CustomBaseEntity {
  @Column({ type: 'int' })
  @Expose()
  sales: number;

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
