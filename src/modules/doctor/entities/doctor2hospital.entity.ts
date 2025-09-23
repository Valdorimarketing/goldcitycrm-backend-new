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

  @ManyToOne(() => Doctor, (doctor) => doctor.doctor2Hospitals)
  @JoinColumn({ name: 'doctor' })
  doctor: Doctor;

  @ManyToOne(() => Hospital)
  @JoinColumn({ name: 'hospital' })
  hospital: Hospital;
}
