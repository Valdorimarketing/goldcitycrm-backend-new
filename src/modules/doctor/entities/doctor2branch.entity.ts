import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { CustomBaseEntity } from '../../../core/base/entities/base.entity';
import { Doctor } from './doctor.entity';
import { Branch } from '../../branch/entities/branch.entity';
import { Expose } from 'class-transformer'; // ✅ Import eklendi

@Entity('doctor2branch')
export class Doctor2Branch extends CustomBaseEntity {
  @Column({ name: 'doctor' })
  @Expose() // ✅ Eklendi
  doctorId: number;

  @Column({ name: 'branch' })
  @Expose() // ✅ Eklendi
  branchId: number;

  @ManyToOne(() => Doctor, (doctor) => doctor.doctor2Branches)
  @JoinColumn({ name: 'doctor' })
  @Expose() // ✅ Eklendi
  doctor: Doctor;

  @ManyToOne(() => Branch)
  @JoinColumn({ name: 'branch' })
  @Expose() // ✅ Eklendi
  branch: Branch;
}