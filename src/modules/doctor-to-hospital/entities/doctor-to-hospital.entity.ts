import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { CustomBaseEntity } from '../../../core/base/entities/base.entity';
import { Doctor } from '../../doctor/entities/doctor.entity';
import { Hospital } from '../../hospital/entities/hospital.entity';
import { Expose } from 'class-transformer';

@Entity('doctor2hospital')
export class DoctorToHospital extends CustomBaseEntity {
  @Column({ name: 'doctor' })
  @Expose()
  doctorId: number;

  @Column({ name: 'hospital' })
  @Expose()
  hospitalId: number;

  @ManyToOne(() => Doctor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'doctor' })
  @Expose()
  doctor: Doctor;

  @ManyToOne(() => Hospital, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'hospital' })
  @Expose()
  hospital: Hospital;
}
