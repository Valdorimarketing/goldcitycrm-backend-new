import { Entity, Column } from 'typeorm';
import { CustomBaseEntity } from '../../../core/base/entities/base.entity';
import { Expose } from 'class-transformer';

@Entity('language')
export class Language extends CustomBaseEntity {
  @Column({ type: 'varchar', length: 255 })
  @Expose()
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @Expose()
  flag: string;

  constructor(partial?: Partial<Language>) {
    super(partial);
  }
} 