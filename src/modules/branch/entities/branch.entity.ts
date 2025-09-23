import { Entity, Column, OneToMany } from 'typeorm';
import { CustomBaseEntity } from '../../../core/base/entities/base.entity';
import { Expose } from 'class-transformer';
import { Branch2Hospital } from './branch2hospital.entity';

@Entity('branches')
export class Branch extends CustomBaseEntity {
  @Column({ type: 'varchar', length: 255 })
  @Expose()
  name: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  @Expose()
  code: string;

  @Column({ type: 'text', nullable: true })
  @Expose()
  description: string;

  @OneToMany(() => Branch2Hospital, (branch2Hospital) => branch2Hospital.branch)
  branch2Hospitals: Branch2Hospital[];
}
