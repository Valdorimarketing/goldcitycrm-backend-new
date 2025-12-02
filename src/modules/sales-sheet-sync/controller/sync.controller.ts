// src/modules/sales-sheet-sync/controllers/sales-sheet-sync.controller.ts

import { Controller, Get, Post, Query, Redirect, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { SalesSheetSyncService } from '../services/sync.service';

@ApiTags('Sales Sheet Sync')
@Controller('sales/sheet-sync')
export class SalesSheetSyncController {
  constructor(private readonly salesSheetSyncService: SalesSheetSyncService) {}

  /**
   * Manuel olarak Google Sheets'e senkronize et
   */
  @Post('sync')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Manually sync sales data to Google Sheets' })
  async manualSync() {
    return this.salesSheetSyncService.manualSync();
  }
}

/**
 * Google OAuth Controller
 * Refresh token almak için kullanılır
 */
@ApiTags('Google Auth')
@Controller('auth/google')
export class GoogleAuthController {
  constructor(private readonly salesSheetSyncService: SalesSheetSyncService) {}

  /**
   * Google OAuth sayfasına yönlendir
   * Tarayıcıdan bu URL'e git: http://localhost:3001/auth/google
   */
  @Get()
  @Redirect()
  @ApiOperation({ summary: 'Redirect to Google OAuth' })
  redirectToGoogle() {
    const url = this.salesSheetSyncService.getAuthUrl();
    return { url };
  }

  /**
   * Google OAuth callback
   * Google bu URL'e code ile döner
   */
  @Get('callback')
  @ApiOperation({ summary: 'Google OAuth callback' })
  async handleCallback(@Query('code') code: string) {
    if (!code) {
      return {
        success: false,
        message: 'No authorization code provided',
      };
    }

    try {
      const tokens = await this.salesSheetSyncService.getTokenFromCode(code);
      
      return {
        success: true,
        message: 'Authorization successful! Add the refresh_token to your .env file',
        refresh_token: tokens.refresh_token,
        instructions: [
          '1. Copy the refresh_token above',
          '2. Add to .env: GOOGLE_REFRESH_TOKEN=<token>',
          '3. Restart the NestJS server',
          '4. Test with POST /sales/sheet-sync/sync',
        ],
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to get tokens',
        error: error.message,
      };
    }
  }
}