import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { CustomBaseEntity } from '../../../core/base/entities/base.entity';
import { Doctor } from './doctor.entity';
import { Branch } from '../../branch/entities/branch.entity';

@Entity('doctor2branch')
export class Doctor2Branch extends CustomBaseEntity {
  @Column({ name: 'doctor' })
  doctorId: number;

  @Column({ name: 'branch' })
  branchId: number;

  @ManyToOne(() => Doctor, (doctor) => doctor.doctor2Branches)
  @JoinColumn({ name: 'doctor' })
  doctor: Doctor;

  @ManyToOne(() => Branch)
  @JoinColumn({ name: 'branch' })
  branch: Branch;
}
