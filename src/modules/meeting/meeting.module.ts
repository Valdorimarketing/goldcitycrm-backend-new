import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MeetingController } from './controllers/meeting.controller';
import { Meeting } from './entities/meeting.entity';
import { MeetingRepository } from './repositories/meeting.repository';
import { MeetingService } from './services/meeting.service';
import { CustomerHistoryModule } from '../customer-history/customer-history.module';
import { MeetingStatusModule } from '../meeting-status/meeting-status.module';
import { Product } from '../product/entities/product.entity';
import { SalesProduct } from '../sales-product/entities/sales-product.entity';
import { CustomerNote } from '../customer-note/entities/customer-note.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Meeting, Product, SalesProduct, CustomerNote]),
    CustomerHistoryModule,
    MeetingStatusModule,
  ],
  controllers: [MeetingController],
  providers: [MeetingService, MeetingRepository],
  exports: [MeetingService, MeetingRepository],
})
export class MeetingModule {}
