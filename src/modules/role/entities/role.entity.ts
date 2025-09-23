import { Entity, Column } from 'typeorm';
import { CustomBaseEntity } from '../../../core/base/entities/base.entity';
import { Expose } from 'class-transformer';

@Entity('role')
export class Role extends CustomBaseEntity {
  @Column({ type: 'varchar', length: 255 })
  @Expose()
  name: string;

  constructor(partial?: Partial<Role>) {
    super(partial);
  }
}
