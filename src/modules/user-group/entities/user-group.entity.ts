import { Entity, Column, OneToMany } from 'typeorm';
import { CustomBaseEntity } from '../../../core/base/entities/base.entity';
import { Expose } from 'class-transformer';
import { User } from '../../user/entities/user.entity';

@Entity('user_group')
export class UserGroup extends CustomBaseEntity {
  @Column({ type: 'varchar', length: 255 })
  @Expose()
  name: string;

  @OneToMany(() => User, (user) => user.userGroup)
  @Expose()
  users: User[];

  constructor(partial?: Partial<UserGroup>) {
    super(partial);
  }
}
