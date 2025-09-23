import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { CustomBaseEntity } from '../../../core/base/entities/base.entity';
import { Hospital } from '../../hospital/entities/hospital.entity';
import { Branch } from './branch.entity';

@Entity('branch2hospital')
export class Branch2Hospital extends CustomBaseEntity {
  @Column({ name: 'hospital' })
  hospitalId: number;

  @Column({ name: 'branch' })
  branchId: number;

  @ManyToOne(() => Hospital, (hospital) => hospital.branch2Hospitals)
  @JoinColumn({ name: 'hospital' })
  hospital: Hospital;

  @ManyToOne(() => Branch, (branch) => branch.branch2Hospitals)
  @JoinColumn({ name: 'branch' })
  branch: Branch;
}
