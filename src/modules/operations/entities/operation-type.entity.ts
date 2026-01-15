import { CustomBaseEntity } from 'src/core/base/entities/base.entity';
import { Entity, Column, OneToMany } from 'typeorm';
import { OperationFollowup } from './operation-followup.entity';

@Entity('operation_types')
export class OperationType extends CustomBaseEntity {

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int', nullable: true })
  created_by?: number;

  @Column({ default: true })
  active: boolean

  @OneToMany(() => OperationFollowup, followup => followup.operation_type_id)
  followups: OperationFollowup[]
}
