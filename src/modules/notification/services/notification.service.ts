import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Notification } from '../entities/notification.entity'

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
  ) { }

  async createForUser(userId: number, message: string) {
    const notif = this.notificationRepo.create({ userId, message })
    return this.notificationRepo.save(notif)
  }

  async findAllForUser(userId: number) {
    return this.notificationRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    })
  }

  async markAsRead(id: number) {
    await this.notificationRepo.update(id, { isRead: true })
  }

  async markAllAsRead(userId: number) {
    await this.notificationRepo.update(
      { userId, isRead: false },
      { isRead: true }
    )
  }

  async deleteAll(userId: number) {
    await this.notificationRepo.delete({ userId, isRead: true });
  }


}
