import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, IsNull, EntityManager, FindManyOptions, FindOneOptions } from 'typeorm';
import { BaseRepositoryAbstract } from 'src/core/base/repositories/base.repository.abstract';
import { CustomerEngagement, CustomerEngagementRole } from '../entities/customer-engagement.entity';

@Injectable()
export class CustomerEngagementRepository extends BaseRepositoryAbstract<CustomerEngagement> {
  constructor(
    @InjectRepository(CustomerEngagement)
    private readonly engagementRepo: Repository<CustomerEngagement>,
  ) {
    super(engagementRepo);
  }

  // ✅ TypeORM Repository metodlarını expose et
  get manager(): EntityManager {
    return this.engagementRepo.manager;
  }


  async findOne(options?: FindOneOptions<CustomerEngagement>): Promise<CustomerEngagement | null> {
    return this.engagementRepo.findOne(options);
  }
  
  async find(options?: FindManyOptions<CustomerEngagement>): Promise<CustomerEngagement[]> {
    return this.engagementRepo.find(options);
  }

  async count(options?: FindManyOptions<CustomerEngagement>): Promise<number> {
    return this.engagementRepo.count(options);
  }

  async findOneBy(options?: FindOneOptions<CustomerEngagement>): Promise<CustomerEngagement | null> {
    return this.engagementRepo.findOne(options);
  }

  async findActiveEngagement(
    customerId: number,
    role?: CustomerEngagementRole,
    userId?: number,
  ): Promise<CustomerEngagement | null> {
    const qb = this.engagementRepo
      .createQueryBuilder('engagement')
      .leftJoinAndSelect('engagement.user', 'user')
      .where('engagement.customer_id = :customerId', { customerId })
      .andWhere('engagement.released_at IS NULL')
      .orderBy('engagement.assigned_at', 'DESC');

    if (role) {
      qb.andWhere('engagement.role = :role', { role });
    }

    if (userId) {
      qb.andWhere('engagement.user_id = :userId', { userId });
    }

    return qb.getOne();
  }

  async closeActiveEngagements(
    customerId: number,
    role?: CustomerEngagementRole,
  ): Promise<void> {
    console.log('🔒 closeActiveEngagements çağrıldı:', {
      customerId,
      role,
    });

    const qb = this.engagementRepo
      .createQueryBuilder()
      .update(CustomerEngagement)
      .set({ releasedAt: new Date() })
      .where('customer_id = :customerId', { customerId })
      .andWhere('released_at IS NULL');

    if (role) {
      qb.andWhere('role = :role', { role });
    }

    const result = await qb.execute();
    console.log('✅ Kapatılan engagement sayısı:', result.affected);
  }

  async insertEngagement(
    customerId: number,
    userId: number,
    role: CustomerEngagementRole,
    assignedAt: Date,
    meta?: any,
    whoCanSee?: number[],
  ): Promise<CustomerEngagement> {
    const entity = this.engagementRepo.create({
      customer: { id: customerId } as any,
      user: { id: userId } as any,
      role,
      assignedAt,
      meta,
      whoCanSee: whoCanSee || [userId],
    });

    return this.engagementRepo.save(entity);
  }

  async addUserToWhoCanSee(engagementId: number, userId: number): Promise<void> {
    const engagement = await this.engagementRepo.findOne({
      where: { id: engagementId },
    });

    if (engagement) {
      const currentWhoCanSee = engagement.whoCanSee || [];
      if (!currentWhoCanSee.includes(userId)) {
        currentWhoCanSee.push(userId);
        await this.engagementRepo.update(engagementId, {
          whoCanSee: currentWhoCanSee,
        });
      }
    }
  }

  async removeUserFromWhoCanSee(engagementId: number, userId: number): Promise<void> {
    const engagement = await this.engagementRepo.findOne({
      where: { id: engagementId },
    });

    if (engagement) {
      const currentWhoCanSee = engagement.whoCanSee || [];
      const filtered = currentWhoCanSee.filter((id) => id !== userId);
      await this.engagementRepo.update(engagementId, {
        whoCanSee: filtered,
      });
    }
  }

  async findForUserStats(
    userId: number,
    role: CustomerEngagementRole,
    startDate?: Date,
    endDate?: Date,
  ): Promise<CustomerEngagement[]> {
    const qb = this.engagementRepo
      .createQueryBuilder('engagement')
      .where('engagement.user_id = :userId', { userId })
      .andWhere('engagement.role = :role', { role });

    if (startDate && endDate) {
      qb.andWhere(
        'engagement.assigned_at BETWEEN :startDate AND :endDate',
        { startDate, endDate },
      );
    }

    return qb.getMany();
  }
}