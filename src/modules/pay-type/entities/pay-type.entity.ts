import { Entity, Column } from 'typeorm';
import { CustomBaseEntity } from '../../../core/base/entities/base.entity';
import { Expose } from 'class-transformer';

@Entity('pay_type')
export class PayType extends CustomBaseEntity {
  @Column({ type: 'varchar', length: 255 })
  @Expose()
  name: string;

  @Column({ type: 'boolean', default: false, name: 'is_cache' })
  @Expose()
  isCache: boolean;

  @Column({ type: 'text', nullable: true })
  @Expose()
  description: string;

  constructor(partial?: Partial<PayType>) {
    super(partial);
  }
}
