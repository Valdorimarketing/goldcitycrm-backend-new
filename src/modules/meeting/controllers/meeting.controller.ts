import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MeetingService } from '../services/meeting.service';
import { CreateMeetingDto, UpdateMeetingDto, MeetingResponseDto } from '../dto/create-meeting.dto';
import { Meeting } from '../entities/meeting.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUserId } from '../../../core/decorators/current-user.decorator';

@Controller('meetings')
@UseGuards(JwtAuthGuard)
export class MeetingController {
  constructor(private readonly meetingService: MeetingService) {}

  @Post()
  async create(
    @Body() createMeetingDto: CreateMeetingDto,
    @CurrentUserId() userId: number,
  ): Promise<MeetingResponseDto> {
    const dtoWithUser = {
      ...createMeetingDto,
      user: userId,
    };
    return this.meetingService.createMeeting(dtoWithUser);
  }

  @Get()
  async findAll(
    @Query('customer') customer?: string,
    @Query('user') user?: string,
    @Query('status') status?: string,
    @Query('salesProductId') salesProductId?: string,
  ): Promise<Meeting[]> {
    if (customer) {
      return this.meetingService.getMeetingsByCustomer(+customer);
    }
    if (user) {
      return this.meetingService.getMeetingsByUser(+user);
    }
    if (status) {
      return this.meetingService.getMeetingsByStatus(+status);
    }
    if (salesProductId) {
      return this.meetingService.getMeetingsBySalesProduct(+salesProductId);
    }
    return this.meetingService.getAllMeetings();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Meeting> {
    return this.meetingService.getMeetingById(+id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateMeetingDto: UpdateMeetingDto,
    @CurrentUserId() userId: number,
  ): Promise<MeetingResponseDto> {
    const dtoWithUser = {
      ...updateMeetingDto,
      user: userId,
    };
    return this.meetingService.updateMeeting(+id, dtoWithUser);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<Meeting> {
    return this.meetingService.deleteMeeting(+id);
  }
}