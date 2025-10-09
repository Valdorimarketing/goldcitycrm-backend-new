import { Entity, Column } from 'typeorm';
import { CustomBaseEntity } from '../../../core/base/entities/base.entity';
import { Expose } from 'class-transformer';

export enum CustomerHistoryAction {
  STATUS_CHANGE = 'Durum Değiştirildi',
  NOTE_ADDED = 'Not Eklendi',
  SALE_CREATED = 'Satış Oluşturuldu',
  MEETING_CREATED = 'Görüşme Oluşturuldu',
  FILE_ADDED = 'Dosya Eklendi',
  FILE_DELETED = 'Dosya Silindi',
  MEETING_STATUS_CHANGE = 'Görüşme Durumu Değiştirildi',
  PAYMENT_CREATED = 'Ödeme Oluşturuldu',
  CUSTOMER_UPDATED = 'Müşteri Güncellendi',
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
