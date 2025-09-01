import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { CustomBaseEntity } from '../../../core/base/entities/base.entity';
import { Doctor } from './doctor.entity';
import { Hospital } from '../../hospital/entities/hospital.entity';

@Entity('doctor2hospital')
export class Doctor2Hospital extends CustomBaseEntity {
  @Column({ name: 'doctor' })
  doctorId: number;

  @Column({ name: 'hospital' })
  hospitalId: number;

  @ManyToOne(() => Doctor, (doctor) => doctor.hospitalRelations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'doctor' })
  doctor: Doctor;

  @ManyToOne(() => Hospital, (hospital) => hospital.doctorRelations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'hospital' })
  hospital: Hospital;
}