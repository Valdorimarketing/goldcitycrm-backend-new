import { Entity, Column } from 'typeorm';
import { CustomBaseEntity } from '../../../core/base/entities/base.entity';

@Entity('api_keys')
export class ApiKey extends CustomBaseEntity {
  @Column({ type: 'varchar', length: 255, unique: true })
  key: string;

  @Column({ type: 'varchar', length: 255 })
  secret: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;
}
