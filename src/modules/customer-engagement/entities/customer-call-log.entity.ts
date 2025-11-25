import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm'; 
import { Expose } from 'class-transformer';
import { Customer } from 'src/modules/customer/entities/customer.entity';
import { User } from 'src/modules/user/entities/user.entity';
import { CustomerEngagement } from './customer-engagement.entity';
import { CustomBaseEntity } from 'src/core/base/entities/base.entity';

export enum CallDirection {
  OUTBOUND = 'OUTBOUND',
  INBOUND = 'INBOUND',
}

@Entity('customer_call_log')
export class CustomerCallLog extends CustomBaseEntity {
  @ManyToOne(() => Customer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  @Expose()
  customer: Customer;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  @Expose()
  user: User;

  @ManyToOne(() => CustomerEngagement, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'engagement_id' })
  @Expose()
  engagement: CustomerEngagement | null;

  @Column({ type: 'datetime', name: 'started_at' })
  @Expose()
  startedAt: Date;

  @Column({ type: 'datetime', name: 'ended_at', nullable: true })
  @Expose()
  endedAt: Date | null;

  @Column({
    type: 'enum',
    enum: CallDirection,
    default: CallDirection.OUTBOUND,
  })
  @Expose()
  direction: CallDirection;

  @Column({ type: 'text', nullable: true })
  @Expose()
  note: string | null;

  constructor(partial?: Partial<CustomerCallLog>) {
    super(partial);
  }
}
