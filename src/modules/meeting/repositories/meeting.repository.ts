import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepositoryAbstract } from '../../../core/base/repositories/base.repository.abstract';
import { Meeting } from '../entities/meeting.entity';
import { instanceToPlain } from 'class-transformer';

@Injectable()
export class MeetingRepository extends BaseRepositoryAbstract<Meeting> {
  constructor(
    @InjectRepository(Meeting)
    private readonly meetingRepository: Repository<Meeting>,
  ) {
    super(meetingRepository);
  }


  async getByCustomer(): Promise<Record<string, any>[]> {
    const data: Meeting[] = await this.getRepository().find({
      relations: ['customerData'],
    });

    const plain = instanceToPlain(data, { excludeExtraneousValues: true });
    return Array.isArray(plain) ? plain : [plain];
  }


  async findByCustomer(customer: number): Promise<Meeting[]> {
    return this.getRepository().find({
      where: { customer },
      relations: ['salesProduct', 'hospital', 'doctor', 'branch'],
    });
  }

  async findByUser(user: number): Promise<Meeting[]> {
    return this.getRepository().find({
      where: { user },
      relations: ['salesProduct', 'hospital', 'doctor'],
    });
  }

  async findByStatus(meetingStatus: number): Promise<Meeting[]> {
    return this.getRepository().find({
      where: { meetingStatus },
      relations: ['salesProduct', 'hospital', 'doctor'],
    });
  }

  async findBySalesProduct(salesProductId: number): Promise<Meeting[]> {
    return this.getRepository().find({
      where: { salesProductId },
      relations: ['salesProduct', 'hospital', 'doctor'],
    });
  }

  async findOneWithSalesProduct(id: number): Promise<Meeting> {
    const data = this.getRepository().findOne({
      where: { id },
      relations: ['salesProduct', 'hospital', 'doctor', 'customerData', 'branch'],
    });
     const plain = instanceToPlain(data, { excludeExtraneousValues: true }) as any;
     return plain;
  }
}
