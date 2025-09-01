import { Entity, Column } from 'typeorm';
import { CustomBaseEntity } from '../../../core/base/entities/base.entity';
import { Expose } from 'class-transformer';

@Entity('sales')
export class Sales extends CustomBaseEntity {
  @Column({ type: 'int', nullable: true })
  @Expose()
  customer: number;

  @Column({ type: 'int', nullable: true })
  @Expose()
  user: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @Expose()
  title: string;

  @Column({ type: 'int', nullable: true, name: 'responsible_user' })
  @Expose()
  responsibleUser: number;

  @Column({ type: 'int', nullable: true, name: 'follower_user' })
  @Expose()
  followerUser: number;

  @Column({ type: 'timestamp', nullable: true, name: 'maturity_date' })
  @Expose()
  maturityDate: Date;

  @Column({ type: 'text', nullable: true })
  @Expose()
  description: string;

  constructor(partial?: Partial<Sales>) {
    super(partial);
  }
} 