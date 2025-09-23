import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepositoryAbstract } from '../../../core/base/repositories/base.repository.abstract';
import { FraudAlert } from '../entities/fraud-alert.entity';

@Injectable()
export class FraudAlertRepository extends BaseRepositoryAbstract<FraudAlert> {
  constructor(
    @InjectRepository(FraudAlert)
    private readonly fraudAlertRepository: Repository<FraudAlert>,
  ) {
    super(fraudAlertRepository);
  }

  async findByUser(userId: number): Promise<FraudAlert[]> {
    return this.getRepository().find({
      where: { user: userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findUnread(userId?: number): Promise<FraudAlert[]> {
    const where: any = { isRead: false };
    if (userId) {
      where.user = userId;
    }
    return this.getRepository().find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async findUnchecked(userId?: number): Promise<FraudAlert[]> {
    const where: any = { isChecked: false };
    if (userId) {
      where.user = userId;
    }
    return this.getRepository().find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async markAsRead(id: number): Promise<FraudAlert> {
    await this.getRepository().update(id, { isRead: true });
    return this.findOneById(id);
  }

  async markAsChecked(id: number): Promise<FraudAlert> {
    await this.getRepository().update(id, { isChecked: true });
    return this.findOneById(id);
  }

  async markAllAsRead(userId?: number): Promise<void> {
    const where: any = { isRead: false };
    if (userId) {
      where.user = userId;
    }
    await this.getRepository().update(where, { isRead: true });
  }

  async markAllAsChecked(userId?: number): Promise<void> {
    const where: any = { isChecked: false };
    if (userId) {
      where.user = userId;
    }
    await this.getRepository().update(where, { isChecked: true });
  }
}
