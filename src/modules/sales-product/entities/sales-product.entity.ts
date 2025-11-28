import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { CustomBaseEntity } from '../../../core/base/entities/base.entity';
import { Expose } from 'class-transformer';
import { Product } from '../../product/entities/product.entity';
import { Currency } from '../../currencies/entities/currency.entity';

@Entity('sales_product')
export class SalesProduct extends CustomBaseEntity {
  @Column({ type: 'int' })
  @Expose()
  sales: number;

  /**
   * Sales ilişkisi - Sales entity'deki @OneToMany('SalesProduct', 'salesDetails') ile eşleşir
   * String-based relation ile circular import önlenir
   */
  @ManyToOne('Sales', 'salesProducts', { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'sales' })
  @Expose()
  salesDetails: any;

  @Column({ type: 'int' })
  @Expose()
  product: number;

  /**
   * Alınan Tutar - Müşteriden tahsil edilen ödeme tutarı
   */
  @Column({ type: 'float', nullable: true, default: 0, name: 'paid_amount' })
  @Expose()
  paidAmount: number;

  /**
   * Ödeme tamamlandı mı?
   * true: Tüm ödeme alındı (paidAmount >= totalPrice)
   * false: Kısmi ödeme veya ödeme alınmadı
   */
  @Column({ type: 'boolean', default: false, name: 'is_pay_completed' })
  @Expose()
  isPayCompleted: boolean;

  @ManyToOne(() => Product, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'product' })
  @Expose()
  productDetails: Product;

  /**
   * Para birimi ID (foreign key column)
   */
  @Column({ type: 'int', nullable: true, name: 'currency' })
  @Expose()
  currencyId?: number;

  /**
   * Para birimi ilişkisi
   */
  @ManyToOne(() => Currency, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'currency' })
  @Expose()
  currency?: Currency;

  @Column({ type: 'float', nullable: true })
  @Expose()
  price: number;

  @Column({ type: 'float', nullable: true })
  @Expose()
  discount: number;

  @Column({ type: 'float', nullable: true })
  @Expose()
  vat: number;

  /**
   * Toplam fiyat (teklif tutarı)
   */
  @Column({ type: 'float', nullable: true, name: 'total_price' })
  @Expose()
  totalPrice: number;

  /**
   * Kalan tutar hesaplama (virtual)
   */
  get remainingAmount(): number {
    return Math.max(0, (this.totalPrice || 0) - (this.paidAmount || 0));
  }

  constructor(partial?: Partial<SalesProduct>) {
    super(partial);
  }
}