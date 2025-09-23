import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { CustomBaseEntity } from '../../../core/base/entities/base.entity';
import { Expose } from 'class-transformer';
import { User } from '../../user/entities/user.entity';

@Entity('customer_note')
export class CustomerNote extends CustomBaseEntity {
  @Column({ type: 'int' })
  @Expose()
  customer: number;

  @Column({ type: 'int', nullable: true, default: 1 })
  @Expose()
  user: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user' })
  @Expose()
  userRelation: User;

  @Column({ type: 'text' })
  @Expose()
  note: string;

  @Column({ type: 'boolean', default: false, name: 'is_reminding' })
  @Expose()
  isReminding: boolean;

  @Column({ type: 'timestamp', nullable: true, name: 'reminding_at' })
  @Expose()
  remindingAt: Date;

  @Column({ type: 'varchar', nullable: true, name: 'note_type' })
  @Expose()
  noteType: string;

  constructor(partial?: Partial<CustomerNote>) {
    super(partial);
  }
}
