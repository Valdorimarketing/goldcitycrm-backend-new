import { Entity, Column } from 'typeorm';
import { CustomBaseEntity } from '../../../core/base/entities/base.entity';
import { Expose } from 'class-transformer';

@Entity('meeting_status')
export class MeetingStatus extends CustomBaseEntity {
  @Column({ type: 'varchar', length: 255 })
  @Expose()
  name: string;

  constructor(partial?: Partial<MeetingStatus>) {
    super(partial);
  }
} 