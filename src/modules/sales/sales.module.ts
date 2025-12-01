import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesController } from './controllers/sales.controller';
import { SalesService } from './services/sales.service';
import { Sales } from './entities/sales.entity';
import { SalesRepository } from './repositories/sales.repository';
import { SalesGateway } from './sales.gateway';
import { Meeting } from '../meeting/entities/meeting.entity';
import { Product } from '../product/entities/product.entity';
import { SalesProduct } from '../sales-product/entities/sales-product.entity';
import { CustomerNote } from '../customer-note/entities/customer-note.entity';
import { CustomerHistoryModule } from '../customer-history/customer-history.module';
import { UserModule } from '../user/user.module';
import { Team } from '../team/entities/team.entity';
import { ExchangeRateModule } from '../exchange-rate/exchange-rate.module';
import { PublicSalesController } from './controllers/public-sales.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Sales,
      Meeting,
      Product,
      SalesProduct,
      CustomerNote,
      Team,
    ]),
    CustomerHistoryModule,
    UserModule,
    ExchangeRateModule
  ],
  controllers: [SalesController, PublicSalesController],
  providers: [SalesService, SalesRepository, SalesGateway],
  exports: [SalesService, SalesRepository, SalesGateway],
})
export class SalesModule {}