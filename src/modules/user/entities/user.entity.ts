import { Entity, Column, OneToMany } from 'typeorm';
import { CustomBaseEntity } from '../../../core/base/entities/base.entity';
import { Expose } from 'class-transformer';

@Entity('user')
export class User extends CustomBaseEntity {
  @Column({ type: 'varchar', length: 255, unique: true })
  @Expose()
  email: string;

  @Column({ type: 'varchar', length: 255 })
  password: string; // Not exposed for security

  @Column({ type: 'varchar', length: 255, nullable: true })
  @Expose()
  role: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @Expose()
  name: string;

  @Column({ type: 'boolean', default: true })
  @Expose()
  isActive: boolean;

  constructor(partial?: Partial<User>) {
    super(partial);
  }
}
