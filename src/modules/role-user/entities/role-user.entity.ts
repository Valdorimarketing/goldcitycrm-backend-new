import { Entity, Column } from 'typeorm';
import { CustomBaseEntity } from '../../../core/base/entities/base.entity';
import { Expose } from 'class-transformer';

@Entity('roleuser')
export class RoleUser extends CustomBaseEntity {
  @Column({ type: 'int' })
  @Expose()
  role: number;

  @Column({ type: 'int' })
  @Expose()
  user: number;

  constructor(partial?: Partial<RoleUser>) {
    super(partial);
  }
} 