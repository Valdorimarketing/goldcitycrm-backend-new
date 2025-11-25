import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Expose } from 'class-transformer';
import { Customer } from 'src/modules/customer/entities/customer.entity';
import { User } from 'src/modules/user/entities/user.entity';
import { CustomBaseEntity } from 'src/core/base/entities/base.entity';

export enum CustomerEngagementRole {
  SALES = 'SALES',
  DOCTOR = 'DOCTOR',
}

@Entity('customer_engagement')
export class CustomerEngagement extends CustomBaseEntity {
  @ManyToOne(() => Customer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  @Expose()
  customer: Customer;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  @Expose()
  user: User;

  @Column({
    type: 'enum',
    enum: CustomerEngagementRole,
    name: 'role',
  })
  @Expose()
  role: CustomerEngagementRole;

  // İlk atama tarihi (firstSetDate)
  @Column({ type: 'datetime', name: 'assigned_at' })
  @Expose()
  assignedAt: Date;

  // İlk dokunuş (ilk not, ilk status değişimi, ilk aksiyon)
  @Column({ type: 'datetime', name: 'first_touch_at', nullable: true })
  @Expose()
  firstTouchAt: Date | null;

  // İlk arama tarihi (firstCallDate)
  @Column({ type: 'datetime', name: 'first_call_at', nullable: true })
  @Expose()
  firstCallAt: Date | null;

  // En son etkileşim tarihi (her aksiyonda güncellenebilir)
  @Column({ type: 'datetime', name: 'last_touch_at', nullable: true })
  @Expose()
  lastTouchAt: Date | null;

  // Bu atamanın bittiği an (başka user’a geçtiği, kapandığı vs.)
  @Column({ type: 'datetime', name: 'released_at', nullable: true })
  @Expose()
  releasedAt: Date | null;

  @Column({ type: 'json', nullable: true, name: 'who_can_see' })
  whoCanSee: number[]; // User ID array'i

  // Gerekirse ek veriler (status id, kanal, vb.)
  @Column({ type: 'json', nullable: true })
  @Expose()
  meta: any;

  constructor(partial?: Partial<CustomerEngagement>) {
    super(partial);
  }
}
