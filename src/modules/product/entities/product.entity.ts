import { Entity, Column } from 'typeorm';
import { CustomBaseEntity } from '../../../core/base/entities/base.entity';
import { Expose } from 'class-transformer';

@Entity('product')
export class Product extends CustomBaseEntity {
  @Column({ type: 'varchar', length: 255 })
  @Expose()
  name: string;

  @Column({ type: 'float', nullable: true })
  @Expose()
  price: number;

  @Column({ type: 'json', nullable: true, name: 'action_list' })
  @Expose()
  actionList: Array<{
    dayOffset: number;
    actionType: string;
    description: string;
  }>;

  constructor(partial?: Partial<Product>) {
    super(partial);
  }
} 