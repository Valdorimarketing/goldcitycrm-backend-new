import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { CustomBaseEntity } from '../../../core/base/entities/base.entity'; 
import { Expose } from 'class-transformer';
import { Currency } from 'src/modules/currencies/entities/currency.entity';

@Entity('product')
export class Product extends CustomBaseEntity {
  @Column({ type: 'varchar', length: 255 })
  @Expose()
  name: string;

  @Column({ type: 'float', nullable: true })
  @Expose()
  price: number;

  @ManyToOne(() => Currency, (currency) => currency.products, { nullable: true })
  @JoinColumn({ name: 'currency_id' })
  @Expose()
  currency?: Currency; 

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
