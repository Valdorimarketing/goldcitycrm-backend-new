import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

// notification.entity.ts
@Entity()
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  message: string;

  @Column({ default: false })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
