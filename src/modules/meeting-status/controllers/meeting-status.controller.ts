import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { MeetingStatusService } from '../services/meeting-status.service';
import {
  CreateMeetingStatusDto,
  UpdateMeetingStatusDto,
  MeetingStatusResponseDto,
} from '../dto/create-meeting-status.dto';
import { MeetingStatus } from '../entities/meeting-status.entity';

@Controller('meeting-statuses')
export class MeetingStatusController {
  constructor(private readonly meetingStatusService: MeetingStatusService) {}

  @Post()
  async create(
    @Body() createMeetingStatusDto: CreateMeetingStatusDto,
  ): Promise<MeetingStatusResponseDto> {
    return this.meetingStatusService.createMeetingStatus(
      createMeetingStatusDto,
    );
  }

  @Get()
  async findAll(@Query('name') name?: string): Promise<MeetingStatus[]> {
    if (name) {
      const meetingStatus =
        await this.meetingStatusService.getMeetingStatusByName(name);
      return meetingStatus ? [meetingStatus] : [];
    }
    return this.meetingStatusService.getAllMeetingStatuses();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<MeetingStatus> {
    return this.meetingStatusService.getMeetingStatusById(+id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateMeetingStatusDto: UpdateMeetingStatusDto,
  ): Promise<MeetingStatusResponseDto> {
    return this.meetingStatusService.updateMeetingStatus(
      +id,
      updateMeetingStatusDto,
    );
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<MeetingStatus> {
    return this.meetingStatusService.deleteMeetingStatus(+id);
  }
}
