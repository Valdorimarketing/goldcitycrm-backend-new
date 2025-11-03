import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { CustomBaseEntity } from '../../../core/base/entities/base.entity';
import { Expose, Type } from 'class-transformer';
import { Product } from '../../product/entities/product.entity';
import { Sales } from '../../sales/entities/sales.entity'; 
import { Currency } from '../../currencies/entities/currency.entity';
import { IsNumber } from 'class-validator';

@Entity('sales_product')
export class SalesProduct extends CustomBaseEntity {
  @Column({ type: 'int' })
  @Expose()
  sales: number;

  @ManyToOne(() => Sales, (sales) => sales.salesProducts, {
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'sales' })
  @Expose()
  salesDetails: Sales;

  @Column({ type: 'int' })
  @Expose()
  product: number;

  @ManyToOne(() => Product, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'product' })
  @Expose()
  productDetails: Product; 
  
  @Type(() => Number)
  @IsNumber()
  @ManyToOne(() => Currency, { eager: true })
  @JoinColumn({ name: 'currency' })
  @Expose()
  currency?: number;

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
