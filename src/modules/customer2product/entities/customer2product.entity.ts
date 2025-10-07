import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { CustomBaseEntity } from '../../../core/base/entities/base.entity';
import { Customer } from '../../customer/entities/customer.entity';
import { Product } from '../../product/entities/product.entity';

@Entity('customer2product')
export class Customer2Product extends CustomBaseEntity {
  @ManyToOne(() => Product, { eager: true })
  @JoinColumn({ name: 'product' })
  product: Product;

  @ManyToOne(() => Customer, { eager: true })
  @JoinColumn({ name: 'customer' })
  customer: Customer;

  @Column({ type: 'text', nullable: true })
  note: string;

  @Column({ type: 'float', nullable: true })
  price: number;

  @Column({ type: 'float', nullable: true })
  discount: number;

  @Column({ type: 'float', nullable: true })
  offer: number;

  @Column({ type: 'int', nullable: true, name: 'sale_id' })
  saleId: number;

  @Column({ type: 'boolean', default: false, name: 'is_sold' })
  isSold: boolean;
}
