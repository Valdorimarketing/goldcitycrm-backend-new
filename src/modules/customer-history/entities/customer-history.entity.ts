import { Entity, Column } from 'typeorm';
import { CustomBaseEntity } from '../../../core/base/entities/base.entity';
import { Expose } from 'class-transformer';

export enum CustomerHistoryAction {
  STATUS_CHANGE = 'STATUS_CHANGE',
  NOTE_ADDED = 'NOTE_ADDED',
  SALE_CREATED = 'SALE_CREATED',
  MEETING_CREATED = 'MEETING_CREATED',
  FILE_ADDED = 'FILE_ADDED',
  MEETING_STATUS_CHANGE = 'MEETING_STATUS_CHANGE',
  PAYMENT_CREATED = 'PAYMENT_CREATED',
  CUSTOMER_UPDATED = 'CUSTOMER_UPDATED',
}

@Entity('customer_history')
export class CustomerHistory extends CustomBaseEntity {
  @Column({ type: 'int' })
  @Expose()
  customer: number;

  @Column({ type: 'int', nullable: true })
  @Expose()
  user: number;

  @Column({ type: 'varchar', length: 255 })
  @Expose()
  action: string;

  @Column({ type: 'int', nullable: true, name: 'related_id' })
  @Expose()
  relatedId: number;

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
