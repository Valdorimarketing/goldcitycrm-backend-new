import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';

// Entities
import { Customer } from '../customer/entities/customer.entity';
import { GmailLog } from './entities/gmail-log.entity';

// Services & Controllers
import { GmailService } from './services/gmail.service';
import { GmailController } from './controllers/gmail.controller';
import { GmailGateway } from './gateways/gmail.gateway';

// External Modules
import { CustomerModule } from '../customer/customer.module';
import { NotificationModule } from '../notification/notification.module';
import { CustomerEngagementModule } from '../customer-engagement/customer-engagement.module';

@Module({
  imports: [
    // TypeORM entities
    TypeOrmModule.forFeature([
      GmailLog,
      Customer,
    ]),

    // Config module (environment variables)
    ConfigModule,

    // Event emitter for WebSocket broadcasting
    EventEmitterModule.forRoot(),

    // Related modules
    forwardRef(() => CustomerModule),
    NotificationModule,
    forwardRef(() => CustomerEngagementModule),
  ],
  controllers: [
    GmailController,
  ],
  providers: [
    GmailService,
    GmailGateway,
  ],
  exports: [
    GmailService,
    GmailGateway,
  ],
})
export class GmailModule {}
