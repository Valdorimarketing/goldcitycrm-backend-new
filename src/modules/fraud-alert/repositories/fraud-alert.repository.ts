import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { BaseRepositoryAbstract } from '../../../core/base/repositories/base.repository.abstract';
import { FraudAlert } from '../entities/fraud-alert.entity';
import { FraudAlertQueryFilterDto } from '../dto/fraud-alert-query-filter.dto';

@Injectable()
export class FraudAlertRepository extends BaseRepositoryAbstract<FraudAlert> {
  constructor(
    @InjectRepository(FraudAlert)
    private readonly fraudAlertRepository: Repository<FraudAlert>,
  ) {
    super(fraudAlertRepository);
  }

  async findByFiltersBaseQuery(
    filters: FraudAlertQueryFilterDto,
  ): Promise<SelectQueryBuilder<FraudAlert>> {
    const queryBuilder = await super.findByFiltersBaseQuery(filters);

    // Get the alias used by base query builder (should be lowercase entity name)
    const alias = queryBuilder.alias;

    // Add user relation
    queryBuilder.leftJoinAndSelect(`${alias}.user`, 'user');

    // Search functionality
    if (filters.search) {
      queryBuilder.andWhere(`${alias}.message LIKE :search`, {
        search: `%${filters.search}%`,
      });
    }

    // User filter
    if (filters.userId !== undefined && filters.userId !== null) {
      queryBuilder.andWhere(`${alias}.userId = :userId`, {
        userId: filters.userId,
      });
    }

    // Read status filter
    if (filters.isRead !== undefined && filters.isRead !== null) {
      queryBuilder.andWhere(`${alias}.isRead = :isRead`, {
        isRead: filters.isRead,
      });
    }

    // Checked status filter
    if (filters.isChecked !== undefined && filters.isChecked !== null) {
      queryBuilder.andWhere(`${alias}.isChecked = :isChecked`, {
        isChecked: filters.isChecked,
      });
    }

    return queryBuilder;
  }

  async findByUser(userId: number): Promise<FraudAlert[]> {
    return this.getRepository().find({
      where: { userId: userId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findUnread(userId?: number): Promise<FraudAlert[]> {
    const where: any = { isRead: false };
    if (userId) {
      where.userId = userId;
    }
    return this.getRepository().find({
      where,
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findUnchecked(userId?: number): Promise<FraudAlert[]> {
    const where: any = { isChecked: false };
    if (userId) {
      where.userId = userId;
    }
    return this.getRepository().find({
      where,
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findAll(): Promise<FraudAlert[]> {
    return this.getRepository().find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOneById(id: number): Promise<FraudAlert> {
    const entity = await this.getRepository().findOne({
      where: { id } as any,
      relations: ['user'],
    });
    if (!entity) {
      throw new Error(`${this.entityName} not found`);
    }
    return entity;
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
      where.userId = userId;
    }
    await this.getRepository().update(where, { isRead: true });
  }

  async markAllAsChecked(userId?: number): Promise<void> {
    const where: any = { isChecked: false };
    if (userId) {
      where.userId = userId;
    }
    await this.getRepository().update(where, { isChecked: true });
  }
}
