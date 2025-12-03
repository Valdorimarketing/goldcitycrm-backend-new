// src/modules/sales-sheet-sync/sales-sheet-sync.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesSheetSyncService } from './services/sync.service';
import { GoogleOAuthSettingsService } from './services/google-oauth-settings.service';
import { GoogleSpreadsheetService } from './services/google-spreadsheet.service';
import { GoogleOAuthSettings } from './entities/google-oauth-settings.entity';
import { GoogleSpreadsheet } from './entities/google-spreadsheet.entity';
import { SheetsSyncAdminController, GoogleAuthController } from './controller/sync.controller';
import { ExchangeRateModule } from '../exchange-rate/exchange-rate.module';
import { SpreadsheetController } from './controller/spreadsheet.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([GoogleOAuthSettings, GoogleSpreadsheet]),
    ExchangeRateModule,
  ],
  controllers: [SheetsSyncAdminController, GoogleAuthController, SpreadsheetController],
  providers: [SalesSheetSyncService, GoogleOAuthSettingsService, GoogleSpreadsheetService],
  exports: [SalesSheetSyncService, GoogleOAuthSettingsService, GoogleSpreadsheetService],
})
export class SalesSheetSyncModule {}