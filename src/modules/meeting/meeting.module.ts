import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MeetingController } from './controllers/meeting.controller';
import { Meeting } from './entities/meeting.entity';
import { MeetingRepository } from './repositories/meeting.repository';
import { MeetingService } from './services/meeting.service';
import { CustomerHistoryModule } from '../customer-history/customer-history.module';

@Module({
  imports: [TypeOrmModule.forFeature([Meeting]), CustomerHistoryModule],
  controllers: [MeetingController],
  providers: [MeetingService, MeetingRepository],
  exports: [MeetingService, MeetingRepository],
})
export class MeetingModule {}
