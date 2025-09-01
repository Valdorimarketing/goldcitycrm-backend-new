import { Entity, Column } from 'typeorm';
import { CustomBaseEntity } from '../../../core/base/entities/base.entity';
import { Expose } from 'class-transformer';

@Entity('fraud_alert')
export class FraudAlert extends CustomBaseEntity {
  @Column({ type: 'int', nullable: true })
  @Expose()
  user: number;

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