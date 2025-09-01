import { Injectable } from '@nestjs/common';
import { BaseService } from '../../../core/base/services/base.service';
import { Meeting } from '../entities/meeting.entity';
import { MeetingRepository } from '../repositories/meeting.repository';
import { CreateMeetingDto, UpdateMeetingDto, MeetingResponseDto } from '../dto/create-meeting.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class MeetingService extends BaseService<Meeting> {
  constructor(
    private readonly meetingRepository: MeetingRepository,
  ) {
    super(meetingRepository, Meeting);
  }

  async createMeeting(createMeetingDto: CreateMeetingDto): Promise<MeetingResponseDto> {
    const meeting = await this.create(createMeetingDto, MeetingResponseDto);
    
    // If salesProductId is provided, fetch the meeting with relation
    if (createMeetingDto.salesProductId) {
      const meetingWithRelation = await this.meetingRepository.findOneWithSalesProduct(meeting.id);
      return plainToInstance(MeetingResponseDto, meetingWithRelation, {
        excludeExtraneousValues: true,
      });
    }
    
    return meeting;
  }

  async updateMeeting(id: number, updateMeetingDto: UpdateMeetingDto): Promise<MeetingResponseDto> {
    const meeting = await this.update(updateMeetingDto, id, MeetingResponseDto);
    
    // If salesProductId is provided or changed, fetch the meeting with relation
    if (updateMeetingDto.salesProductId !== undefined) {
      const meetingWithRelation = await this.meetingRepository.findOneWithSalesProduct(meeting.id);
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