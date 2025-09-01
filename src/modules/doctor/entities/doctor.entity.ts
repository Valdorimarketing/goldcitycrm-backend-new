import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { CustomBaseEntity } from '../../../core/base/entities/base.entity';
import { Branch } from '../../branch/entities/branch.entity';
import { Doctor2Hospital } from './doctor2hospital.entity';
import { Doctor2Branch } from './doctor2branch.entity';

@Entity('doctor')
export class Doctor extends CustomBaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'branch', nullable: true })
  branchId: number;

  @ManyToOne(() => Branch, (branch) => branch.doctors)
  @JoinColumn({ name: 'branch' })
  branch: Branch;

  @OneToMany(() => Doctor2Hospital, (doctor2Hospital) => doctor2Hospital.doctor, { cascade: true })
  hospitalRelations: Doctor2Hospital[];

  @OneToMany(() => Doctor2Branch, (doctor2Branch) => doctor2Branch.doctor, { cascade: true })
  branchRelations: Doctor2Branch[];
}