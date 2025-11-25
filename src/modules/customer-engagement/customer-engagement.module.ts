import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerEngagementRepository } from './repositories/customer-engagement.repository';
import { CustomerCallLogRepository } from './repositories/customer-call-log.repository';
import { CustomerEngagementService } from './services/customer-engagement.service';
import { CustomerEngagementController } from './controllers/customer-engagement.controller'; // ✅ Import
import { CustomerCallLog } from './entities/customer-call-log.entity';
import { CustomerEngagement } from './entities/customer-engagement.entity';
import { CustomerModule } from '../customer/customer.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CustomerEngagement, CustomerCallLog]),
    forwardRef(() => CustomerModule),
  ],
  controllers: [CustomerEngagementController],
  providers: [
    CustomerEngagementRepository,
    CustomerCallLogRepository,
    CustomerEngagementService,
  ],
  exports: [CustomerEngagementService],
})
export class CustomerEngagementModule {}