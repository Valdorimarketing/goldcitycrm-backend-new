import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Customer } from '../../customer/entities/customer.entity';
import { Product } from '../../product/entities/product.entity';

@Entity('customer2product')
export class Customer2Product {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Customer, { eager: true })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @ManyToOne(() => Product, { eager: true })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ type: 'text', nullable: true })
  note: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price: number;

  /**
   * Alınan Tutar - Müşteriden alınan ön ödeme veya kısmi ödeme tutarı
   * Eski adı: discount
   */
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'paid_amount' })
  paidAmount: number;

  /**
   * Teklif Tutarı - Müşteriye sunulan toplam tutar
   */
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  offer: number;

  /**
   * Ödeme tamamlandı mı?
   * true: Tüm ödeme alındı (paidAmount >= offer)
   * false: Kısmi ödeme veya ödeme alınmadı
   */
  @Column({ type: 'boolean', default: false, name: 'is_pay_completed' })
  isPayCompleted: boolean;

  @Column({ type: 'boolean', default: false, name: 'is_sold' })
  isSold: boolean;

  @Column({ type: 'int', nullable: true, name: 'sale_id' })
  saleId: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updates_at' })
  updatesdAt: Date;
}