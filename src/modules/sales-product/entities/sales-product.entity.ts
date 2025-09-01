import { Entity, Column } from 'typeorm';
import { CustomBaseEntity } from '../../../core/base/entities/base.entity';
import { Expose } from 'class-transformer';

@Entity('sales_product')
export class SalesProduct extends CustomBaseEntity {
  @Column({ type: 'int' })
  @Expose()
  sales: number;

  @Column({ type: 'int' })
  @Expose()
  product: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @Expose()
  currency: string;

  @Column({ type: 'float', nullable: true })
  @Expose()
  price: number;

  @Column({ type: 'float', nullable: true })
  @Expose()
  discount: number;

  @Column({ type: 'float', nullable: true })
  @Expose()
  vat: number;

  @Column({ type: 'float', nullable: true, name: 'total_price' })
  @Expose()
  totalPrice: number;

  constructor(partial?: Partial<SalesProduct>) {
    super(partial);
  }
} 