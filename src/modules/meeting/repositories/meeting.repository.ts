import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepositoryAbstract } from '../../../core/base/repositories/base.repository.abstract';
import { Meeting } from '../entities/meeting.entity';

@Injectable()
export class MeetingRepository extends BaseRepositoryAbstract<Meeting> {
  constructor(
    @InjectRepository(Meeting)
    private readonly meetingRepository: Repository<Meeting>,
  ) {
    super(meetingRepository);
  }

  async findByCustomer(customer: number): Promise<Meeting[]> {
    return this.getRepository().find({
      where: { customer },
      relations: ['salesProduct'],
    });
  }

  async findByUser(user: number): Promise<Meeting[]> {
    return this.getRepository().find({
      where: { user },
      relations: ['salesProduct'],
    });
  }

  async findByStatus(meetingStatus: number): Promise<Meeting[]> {
    return this.getRepository().find({
      where: { meetingStatus },
      relations: ['salesProduct'],
    });
  }

  async findBySalesProduct(salesProductId: number): Promise<Meeting[]> {
    return this.getRepository().find({
      where: { salesProductId },
      relations: ['salesProduct'],
    });
  }

  async findOneWithSalesProduct(id: number): Promise<Meeting> {
    return this.getRepository().findOne({
      where: { id },
      relations: ['salesProduct'],
    });
  }
}