import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';

// Entities
import { Customer } from '../customer/entities/customer.entity';

// Gateways

// External Modules
import { CustomerModule } from '../customer/customer.module';
import { NotificationModule } from '../notification/notification.module';
import { CustomerEngagementModule } from '../customer-engagement/customer-engagement.module';
import { WhatConvertsLog } from './entities/whatconverts-log.entity';
import { WhatConvertsGateway } from './gateways/whatconverts.gateway';
import { WhatConvertsService } from './services/whatconverts.service';
import { WhatConvertsController } from './controllers/whatconverts.controller';

@Module({
  imports: [
    // TypeORM entities
    TypeOrmModule.forFeature([
      WhatConvertsLog,
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
    WhatConvertsController,
  ],
  providers: [
    WhatConvertsService,
    WhatConvertsGateway,
  ],
  exports: [
    WhatConvertsService,
    WhatConvertsGateway,
  ],
})
export class WhatConvertsModule {}