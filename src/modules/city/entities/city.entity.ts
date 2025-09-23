import { Entity, Column } from 'typeorm';
import { CustomBaseEntity } from '../../../core/base/entities/base.entity';
import { Expose } from 'class-transformer';

@Entity('city')
export class City extends CustomBaseEntity {
  @Column({ type: 'varchar', length: 255 })
  @Expose()
  name: string;

  @Column({ type: 'int' })
  @Expose()
  state: number;

  constructor(partial?: Partial<City>) {
    super(partial);
  }
}
