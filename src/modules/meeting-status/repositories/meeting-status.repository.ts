import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepositoryAbstract } from '../../../core/base/repositories/base.repository.abstract';
import { MeetingStatus } from '../entities/meeting-status.entity';

@Injectable()
export class MeetingStatusRepository extends BaseRepositoryAbstract<MeetingStatus> {
  constructor(
    @InjectRepository(MeetingStatus)
    private readonly meetingStatusRepository: Repository<MeetingStatus>,
  ) {
    super(meetingStatusRepository);
  }

  async findByName(name: string): Promise<MeetingStatus> {
    return this.getRepository().findOne({
      where: { name },
    });
  }
}
