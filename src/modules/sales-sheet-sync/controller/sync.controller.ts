// src/modules/sales-sheet-sync/controllers/sync.controller.ts

import { Controller, Get, Post, Put, Body, Query, Redirect, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { SalesSheetSyncService } from '../services/sync.service';
import { GoogleOAuthSettingsService } from '../services/google-oauth-settings.service';
import { IsString, IsOptional } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  clientId?: string;

  @IsOptional()
  @IsString()
  clientSecret?: string;

  @IsOptional()
  @IsString()
  redirectUri?: string;

  @IsOptional()
  @IsString()
  spreadsheetId?: string;
}



/**
 * Admin Controller - JWT Auth gerekli
 */
@ApiTags('Sheets Sync Admin')
@Controller('sales-sheet-sync')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SheetsSyncAdminController {
  constructor(
    private readonly syncService: SalesSheetSyncService,
    private readonly settingsService: GoogleOAuthSettingsService,
  ) { }

  /**
   * Servis durumunu al
   */
  @Get('status')
  @ApiOperation({ summary: 'Get sync service status' })
  async getStatus() {
    const status = await this.syncService.getStatus();
    const settings = await this.settingsService.getAllSettings();

    return {
      success: true,
      data: {
        ...status,
        settings: {
          clientId: settings.clientId ? `${settings.clientId.substring(0, 20)}...` : null,
          clientSecretSet: !!settings.clientSecret,
          redirectUri: settings.redirectUri,
          refreshTokenSet: !!settings.refreshToken,
          spreadsheetId: settings.spreadsheetId,
        },
      },
    };
  }

  /**
   * Tüm ayarları al (hassas veriler maskelenmiş)
   */
  @Get('settings')
  @ApiOperation({ summary: 'Get OAuth settings (masked)' })
  async getSettings() {
    const settings = await this.settingsService.getAllSettings();

    return {
      success: true,
      data: {
        clientId: settings.clientId,
        clientSecretSet: !!settings.clientSecret,
        redirectUri: settings.redirectUri,
        refreshTokenSet: !!settings.refreshToken,
        spreadsheetId: settings.spreadsheetId,
        lastTokenRefresh: settings.lastTokenRefresh,
        isConfigured: settings.isConfigured,
      },
    };
  }

  /**
 * Manuel sync tetikle (GET)
 */
  @Get('sync')
  @ApiOperation({ summary: 'Trigger manual sync to Google Sheets (GET)' })
  async manualSync() {
    return this.syncService.manualSync();
  }

  
  /**
 * Manuel reinitialize tetikle (GET)
 */
  @Get('reinitialize')
  @ApiOperation({ summary: 'Trigger manual reinitialize to Google Sheets (GET)' })
  async reInitialize() {
    const initResult = await this.syncService.reinitialize();
    return initResult
  }

  /**
   * Ayarları güncelle
   */
  @Put('settings')
  @ApiOperation({ summary: 'Update OAuth settings' })
  async updateSettings(@Body() dto: UpdateSettingsDto) {

    console.log('dto:  ', dto);


    const updated = await this.settingsService.updateSettings(dto);
    const initResult = await this.syncService.reinitialize();

    return {
      success: true,
      message: 'Settings updated',
      data: {
        clientId: updated.clientId,
        clientSecretSet: !!updated.clientSecret,
        redirectUri: updated.redirectUri,
        refreshTokenSet: !!updated.refreshToken,
        spreadsheetId: updated.spreadsheetId,
        isConfigured: updated.isConfigured,
      },
      oauthStatus: initResult,
    };
  }

  /**
   * Client credentials güncelle
   */
  @Put('credentials')
  @ApiOperation({ summary: 'Update client credentials' })
  async updateCredentials(@Body() body: { clientId: string; clientSecret: string }) {
    await this.settingsService.updateSettings({
      clientId: body.clientId,
      clientSecret: body.clientSecret,
    });

    const initResult = await this.syncService.reinitialize();

    return {
      success: true,
      message: 'Credentials updated',
      oauthStatus: initResult,
    };
  }

  /**
   * Spreadsheet ID güncelle
   */
  @Put('spreadsheet')
  @ApiOperation({ summary: 'Update spreadsheet ID' })
  async updateSpreadsheet(@Body() body: { spreadsheetId: string }) {
    await this.settingsService.updateSettings({
      spreadsheetId: body.spreadsheetId,
    });

    const initResult = await this.syncService.reinitialize();

    return {
      success: true,
      message: 'Spreadsheet ID updated',
      oauthStatus: initResult,
    };
  }

  /**
   * OAuth URL al
   */
  @Get('auth-url')
  @ApiOperation({ summary: 'Get Google OAuth URL' })
  async getAuthUrl() {
    try {
      const url = this.syncService.getAuthUrl();
      return {
        success: true,
        url,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Manuel sync tetikle
   */
  @Post('sync')
  @ApiOperation({ summary: 'Trigger manual sync to Google Sheets' })
  async triggerSync() {
    return this.syncService.manualSync();
  }

  /**
   * OAuth'u yeniden başlat
   */
  @Post('reinitialize')
  @ApiOperation({ summary: 'Reinitialize OAuth client' })
  async reinitialize() {
    const result = await this.syncService.reinitialize();
    return {
      success: result.success,
      message: result.message,
    };
  }

  /**
   * Bağlantı testi
   */
  @Get('test-connection')
  @ApiOperation({ summary: 'Test Google Sheets connection' })
  async testConnection() {
    try {
      const data = await this.syncService.getSalesData();
      return {
        success: true,
        message: 'Connection successful',
        sampleData: {
          totalSalesUsd: data.totalSalesUsd,
          lastUpdated: data.lastUpdated,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

/**
 * Google OAuth Controller - Public (Auth gerektirmez)
 */
@ApiTags('Google Auth')
@Controller('auth/google')
export class GoogleAuthController {
  constructor(
    private readonly syncService: SalesSheetSyncService,
    private readonly settingsService: GoogleOAuthSettingsService,
  ) { }

  /**
   * Google OAuth sayfasına yönlendir
   */
  @Get()
  @Redirect()
  @ApiOperation({ summary: 'Redirect to Google OAuth' })
  redirectToGoogle() {
    try {
      const url = this.syncService.getAuthUrl();
      return { url };
    } catch (error) {
      return { url: `/auth/google/error?message=${encodeURIComponent(error.message)}` };
    }
  }

  /**
   * Google OAuth callback
   */
  @Get('callback')
  @ApiOperation({ summary: 'Google OAuth callback' })
  async handleCallback(@Query('code') code: string, @Query('error') error: string) {
    if (error) {
      return {
        success: false,
        error: error,
      };
    }

    if (!code) {
      return {
        success: false,
        message: 'No authorization code provided',
      };
    }

    try {
      const tokens = await this.syncService.getTokenFromCode(code);

      return {
        success: true,
        message: 'Authorization successful! Refresh token saved to database.',
        hasRefreshToken: !!tokens.refresh_token,
      };
    } catch (err) {
      return {
        success: false,
        message: 'Failed to get tokens',
        error: err.message,
      };
    }
  }

  /**
   * OAuth hata sayfası
   */
  @Get('error')
  @ApiOperation({ summary: 'OAuth error page' })
  handleError(@Query('message') message: string) {
    return {
      success: false,
      error: message || 'Unknown error',
    };
  }
}