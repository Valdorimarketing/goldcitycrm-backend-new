import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { CustomBaseEntity } from '../../../core/base/entities/base.entity';
import { Expose } from 'class-transformer';
import { Customer } from '../../customer/entities/customer.entity';
import { User } from '../../user/entities/user.entity';
import { SalesProduct } from '../../sales-product/entities/sales-product.entity';

@Entity('sales')
export class Sales extends CustomBaseEntity {
  @Column({ type: 'int', nullable: true })
  @Expose()
  customer: number;

  @ManyToOne(() => Customer, {
    nullable: true,
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'customer' })
  @Expose()
  customerDetails: Customer;

  @Column({ type: 'int', nullable: true })
  @Expose()
  user: number;

  @ManyToOne(() => User, {
    nullable: true,
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'user' })
  @Expose()
  userDetails: User;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @Expose()
  title: string;

  @Column({ type: 'int', nullable: true, name: 'responsible_user' })
  @Expose()
  responsibleUser: number;

  @ManyToOne(() => User, {
    nullable: true,
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'responsible_user' })
  @Expose()
  responsibleUserDetails: User;

  @Column({ type: 'int', nullable: true, name: 'follower_user' })
  @Expose()
  followerUser: number;

  @ManyToOne(() => User, {
    nullable: true,
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'follower_user' })
  @Expose()
  followerUserDetails: User;

  @Column({ type: 'timestamp', nullable: true, name: 'maturity_date' })
  @Expose()
  maturityDate: Date;

  @Column({ type: 'text', nullable: true })
  @Expose()
  description: string;

  @OneToMany(() => SalesProduct, (salesProduct) => salesProduct.salesDetails)
  @Expose()
  salesProducts: SalesProduct[];

  constructor(partial?: Partial<Sales>) {
    super(partial);
  }
}
