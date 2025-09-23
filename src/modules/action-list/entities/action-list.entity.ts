import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { CustomBaseEntity } from '../../../core/base/entities/base.entity';
import { User } from '../../user/entities/user.entity';
import { Product } from '../../product/entities/product.entity';
import { Expose } from 'class-transformer';

@Entity('action_list')
export class ActionList extends CustomBaseEntity {
  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user' })
  @Expose()
  user: User;

  @ManyToOne(() => Product, { nullable: false })
  @JoinColumn({ name: 'product' })
  @Expose()
  product: Product;

  @Column({ type: 'int', nullable: true })
  @Expose()
  plannedDate: number;

  @Column({ type: 'varchar', length: 255 })
  @Expose()
  name: string;

  @Column({ type: 'text', nullable: true })
  @Expose()
  description: string;
}
