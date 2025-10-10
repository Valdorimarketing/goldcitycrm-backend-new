import { Injectable } from '@nestjs/common';
import { BaseService } from '../../../core/base/services/base.service';
import { MeetingStatus } from '../entities/meeting-status.entity';
import { MeetingStatusRepository } from '../repositories/meeting-status.repository';
import {
  CreateMeetingStatusDto,
  UpdateMeetingStatusDto,
  MeetingStatusResponseDto,
} from '../dto/create-meeting-status.dto';

@Injectable()
export class MeetingStatusService extends BaseService<MeetingStatus> {
  constructor(
    private readonly meetingStatusRepository: MeetingStatusRepository,
  ) {
    super(meetingStatusRepository, MeetingStatus);
  }

  async createMeetingStatus(
    createMeetingStatusDto: CreateMeetingStatusDto,
  ): Promise<MeetingStatusResponseDto> {
    return this.create(createMeetingStatusDto, MeetingStatusResponseDto);
  }

  async updateMeetingStatus(
    id: number,
    updateMeetingStatusDto: UpdateMeetingStatusDto,
  ): Promise<MeetingStatusResponseDto> {
    return this.update(updateMeetingStatusDto, id, MeetingStatusResponseDto);
  }

  async getMeetingStatusById(id: number): Promise<MeetingStatus> {
    return this.findOneById(id);
  }

  async getAllMeetingStatuses(): Promise<MeetingStatus[]> {
    return this.findAll();
  }

  async getMeetingStatusByName(name: string): Promise<MeetingStatus> {
    return this.meetingStatusRepository.findByName(name);
  }

  async deleteMeetingStatus(id: number): Promise<MeetingStatus> {
    return this.remove(id);
  }
}
