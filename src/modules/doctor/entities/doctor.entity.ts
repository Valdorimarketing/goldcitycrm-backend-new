import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { CustomBaseEntity } from '../../../core/base/entities/base.entity';
import { Branch } from '../../branch/entities/branch.entity';
import { Expose } from 'class-transformer';
import { Doctor2Branch } from './doctor2branch.entity';
import { Doctor2Hospital } from './doctor2hospital.entity';
import { Customer2Doctor } from '../../customer2doctor/entities/customer2doctor.entity';

@Entity('doctors')
export class Doctor extends CustomBaseEntity {
  @Column({ type: 'varchar', length: 255 })
  @Expose()
  name: string;

  @Column({ name: 'branch', nullable: true })
  @Expose()
  branchId: number;

  @ManyToOne(() => Branch)
  @JoinColumn({ name: 'branch' })
  @Expose()
  branch: Branch;

  @OneToMany(() => Doctor2Branch, (doctor2Branch) => doctor2Branch.doctor)
  doctor2Branches: Doctor2Branch[];

  @OneToMany(() => Doctor2Hospital, (doctor2Hospital) => doctor2Hospital.doctor)
  doctor2Hospitals: Doctor2Hospital[];

  @OneToMany(() => Customer2Doctor, (customer2doctor) => customer2doctor.doctor)
  customer2doctors: Customer2Doctor[];
}
