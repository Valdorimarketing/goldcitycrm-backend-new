import { Injectable } from '@nestjs/common';
import { BaseService } from '../../../core/base/services/base.service';
import { Meeting } from '../entities/meeting.entity';
import { MeetingRepository } from '../repositories/meeting.repository';
import {
  CreateMeetingDto,
  UpdateMeetingDto,
  MeetingResponseDto,
} from '../dto/create-meeting.dto';
import { plainToInstance } from 'class-transformer';
import { CustomerHistoryService } from '../../customer-history/services/customer-history.service';
import { CustomerHistoryAction } from '../../customer-history/entities/customer-history.entity';

@Injectable()
export class MeetingService extends BaseService<Meeting> {
  constructor(
    private readonly meetingRepository: MeetingRepository,
    private readonly customerHistoryService: CustomerHistoryService,
  ) {
    super(meetingRepository, Meeting);
  }

  async createMeeting(
    createMeetingDto: CreateMeetingDto,
  ): Promise<MeetingResponseDto> {
    const meeting = await this.create(createMeetingDto, MeetingResponseDto);

    // Log to customer history
    if (createMeetingDto.customer) {
      await this.customerHistoryService.logCustomerAction(
        createMeetingDto.customer,
        CustomerHistoryAction.MEETING_CREATED,
        `Toplantı planlandı: ${createMeetingDto.description || 'Yeni Toplantı'}`,
        createMeetingDto,
        null,
        createMeetingDto.user,
        meeting.id,
      );
    }

    // If salesProductId is provided, fetch the meeting with relation
    if (createMeetingDto.salesProductId) {
      const meetingWithRelation =
        await this.meetingRepository.findOneWithSalesProduct(meeting.id);
      return plainToInstance(MeetingResponseDto, meetingWithRelation, {
        excludeExtraneousValues: true,
      });
    }

    return meeting;
  }

  async updateMeeting(
    id: number,
    updateMeetingDto: UpdateMeetingDto,
  ): Promise<MeetingResponseDto> {
    // Get current meeting to check for status change
    const currentMeeting = await this.findOneById(id);
    const oldStatus = currentMeeting?.meetingStatus;

    const meeting = await this.update(updateMeetingDto, id, MeetingResponseDto);

    // Check for meeting status change
    if (
      updateMeetingDto.meetingStatus &&
      oldStatus !== updateMeetingDto.meetingStatus &&
      currentMeeting?.customer
    ) {
      await this.customerHistoryService.logCustomerAction(
        currentMeeting.customer,
        CustomerHistoryAction.MEETING_STATUS_CHANGE,
        `Toplantı durumu ${oldStatus || 'Yok'}'dan ${updateMeetingDto.meetingStatus}'e değiştirildi`,
        { oldStatus, newStatus: updateMeetingDto.meetingStatus },
        null,
        updateMeetingDto.user,
        id,
      );
    }

    // If salesProductId is provided or changed, fetch the meeting with relation
    if (updateMeetingDto.salesProductId !== undefined) {
      const meetingWithRelation =
        await this.meetingRepository.findOneWithSalesProduct(meeting.id);
      return plainToInstance(MeetingResponseDto, meetingWithRelation, {
        excludeExtraneousValues: true,
      });
    }

    return meeting;
  }

  async getMeetingById(id: number): Promise<Meeting> {
    return this.meetingRepository.findOneWithSalesProduct(id);
  }

  async getAllMeetings(): Promise<Meeting[]> {
    return this.findAll();
  }

  async getMeetingsByCustomer(customer: number): Promise<Meeting[]> {
    return this.meetingRepository.findByCustomer(customer);
  }

  async getMeetingsByUser(user: number): Promise<Meeting[]> {
    return this.meetingRepository.findByUser(user);
  }

  async getMeetingsByStatus(meetingStatus: number): Promise<Meeting[]> {
    return this.meetingRepository.findByStatus(meetingStatus);
  }

  async getMeetingsBySalesProduct(salesProductId: number): Promise<Meeting[]> {
    return this.meetingRepository.findBySalesProduct(salesProductId);
  }

  async deleteMeeting(id: number): Promise<Meeting> {
    return this.remove(id);
  }
}
