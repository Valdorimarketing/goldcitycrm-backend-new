import { Entity, Column } from 'typeorm';
import { CustomBaseEntity } from '../../../core/base/entities/base.entity';
import { Expose } from 'class-transformer';

@Entity('status')
export class Status extends CustomBaseEntity {
  @Column({ type: 'varchar', length: 255 })
  @Expose()
  name: string;

  @Column({ type: 'text', nullable: true })
  @Expose()
  description: string;

  @Column({ type: 'boolean', default: false, name: 'is_remindable' })
  @Expose()
  isRemindable: boolean;

  @Column({ type: 'boolean', default: false, name: 'is_first' })
  @Expose()
  isFirst: boolean;

  @Column({ type: 'boolean', default: false, name: 'is_closed' })
  @Expose()
  isClosed: boolean;

  @Column({ type: 'boolean', default: false, name: 'is_sale' })
  @Expose()
  isSale: boolean;

  @Column({ type: 'varchar', length: 7, nullable: true })
  @Expose()
  color: string;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  @Expose()
  isActive: boolean;

  constructor(partial?: Partial<Status>) {
    super(partial);
  }
} 