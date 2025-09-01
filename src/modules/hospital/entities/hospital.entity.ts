import { Entity, Column, OneToMany } from 'typeorm';
import { CustomBaseEntity } from '../../../core/base/entities/base.entity';
import { Doctor2Hospital } from '../../doctor/entities/doctor2hospital.entity';

@Entity('hospital')
export class Hospital extends CustomBaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @OneToMany(() => Doctor2Hospital, (doctor2Hospital) => doctor2Hospital.hospital)
  doctorRelations: Doctor2Hospital[];
}