import { Entity, Column } from 'typeorm';
import { CustomBaseEntity } from '../../../core/base/entities/base.entity';
import { Expose } from 'class-transformer';

@Entity('customer_history')
export class CustomerHistory extends CustomBaseEntity {
  @Column({ type: 'int' })
  @Expose()
  customer: number;

  @Column({ type: 'varchar', length: 255 })
  @Expose()
  action: string;

  @Column({ type: 'text', nullable: true })
  @Expose()
  description: string;

  @Column({ type: 'text', nullable: true, name: 'request_data' })
  @Expose()
  requestData: string;

  @Column({ type: 'text', nullable: true, name: 'response_data' })
  @Expose()
  responseData: string;

  constructor(partial?: Partial<CustomerHistory>) {
    super(partial);
  }
} 