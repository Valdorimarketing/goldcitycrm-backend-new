import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { CustomBaseEntity } from '../../../core/base/entities/base.entity';
import { Doctor } from '../../doctor/entities/doctor.entity';
import { Branch } from '../../branch/entities/branch.entity';
import { Expose } from 'class-transformer';

@Entity('doctor2branch')
export class DoctorToBranch extends CustomBaseEntity {
  @Column({ name: 'doctor' })
  @Expose()
  doctorId: number;

  @Column({ name: 'branch' })
  @Expose()
  branchId: number;

  @ManyToOne(() => Doctor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'doctor' })
  @Expose()
  doctor: Doctor;

  @ManyToOne(() => Branch, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'branch' })
  @Expose()
  branch: Branch;
}
