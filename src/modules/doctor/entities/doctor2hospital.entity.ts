import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { CustomBaseEntity } from '../../../core/base/entities/base.entity';
import { Doctor } from './doctor.entity';
import { Hospital } from '../../hospital/entities/hospital.entity';
import { Expose } from 'class-transformer'; // ✅ Import eklendi

@Entity('doctor2hospital')
export class Doctor2Hospital extends CustomBaseEntity {
  @Column({ name: 'doctor' })
  @Expose()
  doctorId: number;

  @Column({ name: 'hospital' })
  @Expose()
  hospitalId: number;

  @ManyToOne(() => Doctor, (doctor) => doctor.doctor2Hospitals)
  @JoinColumn({ name: 'doctor' })
  @Expose()
  doctor: Doctor;

  @ManyToOne(() => Hospital)
  @JoinColumn({ name: 'hospital' })
  @Expose()
  hospital: Hospital;
}