import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepositoryAbstract } from '../../../core/base/repositories/base.repository.abstract';
import { Sales } from '../entities/sales.entity';

@Injectable()
export class SalesRepository extends BaseRepositoryAbstract<Sales> {
  constructor(
    @InjectRepository(Sales)
    private readonly salesRepository: Repository<Sales>,
  ) {
    super(salesRepository);
  }

  async findByCustomer(customerId: number): Promise<Sales[]> {
    return this.getRepository().find({
      where: { customer: customerId },
    });
  }

  async findByUser(userId: number): Promise<Sales[]> {
    return this.getRepository().find({
      where: { user: userId },
    });
  }

  async findByResponsibleUser(userId: number): Promise<Sales[]> {
    return this.getRepository().find({
      where: { responsibleUser: userId },
    });
  }
}
