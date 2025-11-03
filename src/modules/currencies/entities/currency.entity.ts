import { Expose } from 'class-transformer';
import { Product } from 'src/modules/product/entities/product.entity';
import {
  Entity,
  Column,
  OneToMany,
} from 'typeorm';
import { CustomBaseEntity } from '../../../core/base/entities/base.entity';

@Entity({ name: 'currencies' })
export class Currency extends CustomBaseEntity {
  @Column({ unique: true })
  @Expose()
  code: string; // TRY, USD, EUR gibi

  @Column()
  @Expose()
  name: string; // Türk Lirası, Amerikan Doları vs

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  @Expose()
  rateToTRY?: number; // opsiyonel, güncel kuru tutmak istersen

  @Column({ default: true })
  @Expose()
  isActive: boolean;

  @OneToMany(() => Product, (product) => product.currency, { nullable: true })
  products: Product[];

  constructor(partial?: Partial<Currency>) {
    super(partial);
  }
}
