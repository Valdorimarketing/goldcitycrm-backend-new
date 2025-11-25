import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepositoryAbstract } from 'src/core/base/repositories/base.repository.abstract'; 
import { CustomerCallLog } from '../entities/customer-call-log.entity';

@Injectable()
export class CustomerCallLogRepository extends BaseRepositoryAbstract<CustomerCallLog> {
  constructor(
    @InjectRepository(CustomerCallLog)
    private readonly callLogRepo: Repository<CustomerCallLog>,
  ) {
    super(callLogRepo);
  }

  // ✅ registerCall için kullanacağımız insert metodu
  async insertCallLog(params: {
    customerId: number;
    userId: number;
    engagementId: number;
    startedAt: Date;
    endedAt?: Date | null;
    note?: string;
    direction?: any;
  }): Promise<CustomerCallLog> {
    const entity = this.callLogRepo.create({
      customer: { id: params.customerId } as any,
      user: { id: params.userId } as any,
      engagement: { id: params.engagementId } as any,
      startedAt: params.startedAt,
      endedAt: params.endedAt ?? null,
      note: params.note,
      direction: params.direction,
    });

    return this.callLogRepo.save(entity);
  }
}
