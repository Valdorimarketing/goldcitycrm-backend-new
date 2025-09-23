import { Entity, Column, OneToMany } from 'typeorm';
import { CustomBaseEntity } from '../../../core/base/entities/base.entity';
import { Expose } from 'class-transformer';
import { Branch2Hospital } from '../../branch/entities/branch2hospital.entity';

@Entity('hospitals')
export class Hospital extends CustomBaseEntity {
  @Column({ type: 'varchar', length: 255 })
  @Expose()
  name: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  @Expose()
  code: string;

  @Column({ type: 'text', nullable: true })
  @Expose()
  address: string;

  @Column({ type: 'text', nullable: true })
  @Expose()
  description: string;

  @OneToMany(
    () => Branch2Hospital,
    (branch2Hospital) => branch2Hospital.hospital,
  )
  branch2Hospitals: Branch2Hospital[];
}
