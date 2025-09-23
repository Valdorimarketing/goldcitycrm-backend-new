import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { CustomBaseEntity } from '../../../core/base/entities/base.entity';
import { Expose } from 'class-transformer';
import { SalesProduct } from '../../sales-product/entities/sales-product.entity';

@Entity('meeting')
export class Meeting extends CustomBaseEntity {
  @Column({ type: 'int' })
  @Expose()
  customer: number;

  @Column({ type: 'int', name: 'meeting_location' })
  @Expose()
  meetingLocation: number;

  @Column({ type: 'timestamp', nullable: true, name: 'reminding_at' })
  @Expose()
  remindingAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'start_time' })
  @Expose()
  startTime: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'end_time' })
  @Expose()
  endTime: Date;

  @Column({ type: 'int' })
  @Expose()
  user: number;

  @Column({ type: 'int', name: 'meeting_status' })
  @Expose()
  meetingStatus: number;

  @Column({ type: 'text', nullable: true })
  @Expose()
  description: string;

  @Column({ type: 'int', nullable: true, name: 'sales_product_id' })
  @Expose()
  salesProductId: number;

  @ManyToOne(() => SalesProduct, { nullable: true })
  @JoinColumn({ name: 'sales_product_id' })
  @Expose()
  salesProduct: SalesProduct;

  constructor(partial?: Partial<Meeting>) {
    super(partial);
  }
}
