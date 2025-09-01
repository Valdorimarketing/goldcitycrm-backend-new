import { Entity, Column, OneToMany } from 'typeorm';
import { CustomBaseEntity } from '../../../core/base/entities/base.entity';
import { Doctor } from '../../doctor/entities/doctor.entity';
import { Doctor2Branch } from '../../doctor/entities/doctor2branch.entity';

@Entity('branch')
export class Branch extends CustomBaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @OneToMany(() => Doctor, (doctor) => doctor.branch)
  doctors: Doctor[];

  @OneToMany(() => Doctor2Branch, (doctor2Branch) => doctor2Branch.branch)
  doctorRelations: Doctor2Branch[];
}