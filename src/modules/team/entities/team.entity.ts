import { Expose } from 'class-transformer';
import { CustomBaseEntity } from '../../../core/base/entities/base.entity'; 
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { User } from 'src/modules/user/entities/user.entity';

@Entity({ name: 'teams' })
export class Team extends CustomBaseEntity { 
  @Column({ length: 100 })
  @Expose()
  name: string;

  @Column({ nullable: true })
  @Expose()
  description?: string;

  @Column({ default: true })
  @Expose()
  isActive: boolean; 

  
  @OneToMany(() => User, (user) => user.userTeam)
  @Expose()
  users: User[];
}
