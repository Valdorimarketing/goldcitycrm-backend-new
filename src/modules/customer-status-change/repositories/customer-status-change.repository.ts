import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { CustomerStatusChange } from '../entities/customer-status-change.entity';

@Injectable()
export class CustomerStatusChangeRepository {
  constructor(
    @InjectRepository(CustomerStatusChange)
    private readonly repository: Repository<CustomerStatusChange>,
  ) {}

  async create(data: {
    user_id: number;
    customer_id: number;
    old_status: number;
    new_status: number;
  }): Promise<CustomerStatusChange> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async getRecentChanges(
    userId: number,
    newStatus: number,
    minutes: number = 5,
  ): Promise<CustomerStatusChange[]> {
    const timeAgo = new Date();
    timeAgo.setMinutes(timeAgo.getMinutes() - minutes);

    return this.repository.find({
      where: {
        user_id: userId,
        new_status: newStatus,
        createdAt: MoreThanOrEqual(timeAgo),
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async getUniqueCustomerChangesCount(
    userId: number,
    newStatus: number,
    minutes: number = 5,
  ): Promise<number> {
    const timeAgo = new Date();
    timeAgo.setMinutes(timeAgo.getMinutes() - minutes);

    const result = await this.repository
      .createQueryBuilder('change')
      .select('COUNT(DISTINCT change.customer_id)', 'count')
      .where('change.user_id = :userId', { userId })
      .andWhere('change.new_status = :newStatus', { newStatus })
      .andWhere('change.createdAt >= :timeAgo', { timeAgo })
      .getRawOne();

    return parseInt(result.count, 10);
  }
}
