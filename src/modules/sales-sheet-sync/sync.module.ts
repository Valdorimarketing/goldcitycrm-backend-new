import { Module } from '@nestjs/common';
import { ExchangeRateModule } from '../exchange-rate/exchange-rate.module';
import { SalesSheetSyncService } from './services/sync.service';
import { GoogleAuthController, SalesSheetSyncController } from './controller/sync.controller';

@Module({
  imports: [ExchangeRateModule],
  controllers: [SalesSheetSyncController, GoogleAuthController],
  providers: [SalesSheetSyncService],
  exports: [SalesSheetSyncService],
})
export class SalesSheetSyncModule {}