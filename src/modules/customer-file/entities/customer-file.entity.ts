import { Entity, Column } from 'typeorm';
import { CustomBaseEntity } from '../../../core/base/entities/base.entity';
import { Expose } from 'class-transformer';

@Entity('customer_file')
export class CustomerFile extends CustomBaseEntity {
  @Column({ type: 'int' })
  @Expose()
  customer: number;

  @Column({ type: 'varchar', length: 255 })
  @Expose()
  file: string;

  @Column({ type: 'text', nullable: true })
  @Expose()
  description: string;

  constructor(partial?: Partial<CustomerFile>) {
    super(partial);
  }
}
