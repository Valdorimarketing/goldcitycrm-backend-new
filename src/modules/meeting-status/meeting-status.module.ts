import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MeetingStatusController } from './controllers/meeting-status.controller';
import { MeetingStatus } from './entities/meeting-status.entity';
import { MeetingStatusRepository } from './repositories/meeting-status.repository';
import { MeetingStatusService } from './services/meeting-status.service';

@Module({
  imports: [TypeOrmModule.forFeature([MeetingStatus])],
  controllers: [MeetingStatusController],
  providers: [MeetingStatusService, MeetingStatusRepository],
  exports: [MeetingStatusService, MeetingStatusRepository],
})
export class MeetingStatusModule {}
