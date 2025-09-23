import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepositoryAbstract } from '../../../core/base/repositories/base.repository.abstract';
import { Status } from '../entities/status.entity';

@Injectable()
export class StatusRepository extends BaseRepositoryAbstract<Status> {
  constructor(
    @InjectRepository(Status)
    private readonly statusRepository: Repository<Status>,
  ) {
    super(statusRepository);
  }

  async findActive(): Promise<Status[]> {
    return this.getRepository().find({
      where: { isActive: true },
      order: { id: 'ASC' },
    });
  }
}
