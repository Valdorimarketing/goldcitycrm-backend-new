import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { CustomBaseEntity } from '../../../core/base/entities/base.entity';
import { Exclude, Expose } from 'class-transformer';
import { UserGroup } from '../../user-group/entities/user-group.entity';
import { Customer } from '../../customer/entities/customer.entity'; // 🔹 ekle

@Entity('user')
export class User extends CustomBaseEntity {
  @Column({ type: 'varchar', length: 255, unique: true })
  @Expose()
  email: string;

  @Column({ type: 'varchar', length: 255 })
  @Exclude()
  password: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @Expose()
  role: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @Expose()
  name: string;

  @Column({ type: 'timestamp', nullable: true, name: 'last_active_time' })
  @Expose()
  lastActiveTime: Date;

  @Column({ type: 'boolean', default: true })
  @Expose()
  isActive: boolean;

  @Column({ type: 'int', nullable: true })
  @Expose()
  userGroupId: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  @Expose()
  avatar: string;

  @ManyToOne(() => UserGroup, (userGroup) => userGroup.users)
  @JoinColumn({ name: 'userGroupId' })
  @Expose()
  userGroup: UserGroup;

  @OneToMany(() => Customer, (customer) => customer.relevantUserData)
  @Expose()
  customers: Customer[];

  constructor(partial?: Partial<User>) {
    super(partial);
  }
}
