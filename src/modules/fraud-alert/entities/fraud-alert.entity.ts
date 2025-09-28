import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { CustomBaseEntity } from '../../../core/base/entities/base.entity';
import { Expose } from 'class-transformer';
import { User } from '../../user/entities/user.entity';

@Entity('fraud_alert')
export class FraudAlert extends CustomBaseEntity {
  @Column({ type: 'int', nullable: true, name: 'user_id' })
  @Expose()
  userId: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id' })
  @Expose()
  user: User;

  @Column({ type: 'text', nullable: true })
  @Expose()
  message: string;

  @Column({ type: 'boolean', default: false, name: 'is_read' })
  @Expose()
  isRead: boolean;

  @Column({ type: 'boolean', default: false, name: 'is_checked' })
  @Expose()
  isChecked: boolean;

  constructor(partial?: Partial<FraudAlert>) {
    super(partial);
  }
}
