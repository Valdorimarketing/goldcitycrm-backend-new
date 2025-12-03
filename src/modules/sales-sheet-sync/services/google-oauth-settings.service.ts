// src/modules/sales-sheet-sync/services/google-oauth-settings.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GoogleOAuthSettings } from '../entities/google-oauth-settings.entity';

export interface OAuthSettingsDto {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  refreshToken: string;
  spreadsheetId: string;
  lastTokenRefresh: string | null;
  isConfigured: boolean;
}

@Injectable()
export class GoogleOAuthSettingsService {
  private readonly logger = new Logger(GoogleOAuthSettingsService.name);

  // Default değerler (ilk kurulum için)
  private readonly defaults = {
    client_id: '',
    client_secret: '',
    redirect_uri: 'https://vcrmapi.mlpcare.com/auth/google/callback',
    refresh_token: '',
    spreadsheet_id: '1f_JfLaps2oPiumzxC1A__kGVE09HidJc8IY9pYraMB8',
    last_token_refresh: null,
    last_sync: null,
  };

  constructor(
    @InjectRepository(GoogleOAuthSettings)
    private readonly settingsRepo: Repository<GoogleOAuthSettings>,
  ) {
    this.initializeDefaults();
  }

  /**
   * Default ayarları veritabanına ekle (yoksa)
   */
  private async initializeDefaults(): Promise<void> {
    try {
      for (const [key, value] of Object.entries(this.defaults)) {
        const existing = await this.settingsRepo.findOne({ where: { key } });
        if (!existing) {
          await this.settingsRepo.save({
            key,
            value: value || '',
            description: this.getDescription(key),
          });
        }
      }
      this.logger.log('Google OAuth settings initialized');
    } catch (error) {
      this.logger.error('Failed to initialize settings', error);
    }
  }

  /**
   * Ayar açıklamalarını döndür
   */
  private getDescription(key: string): string {
    const descriptions: Record<string, string> = {
      client_id: 'Google OAuth Client ID',
      client_secret: 'Google OAuth Client Secret',
      redirect_uri: 'OAuth Redirect URI',
      refresh_token: 'Google OAuth Refresh Token',
      spreadsheet_id: 'Google Sheets Spreadsheet ID',
      last_token_refresh: 'Last token refresh timestamp',
      last_sync: 'Last sync timestamp',
    };
    return descriptions[key] || '';
  }

  /**
   * Tek bir ayar değerini al
   */
  async get(key: string): Promise<string | null> {
    const setting = await this.settingsRepo.findOne({ where: { key } });
    return setting?.value || null;
  }

  /**
   * Tek bir ayar değerini kaydet
   */
  async set(key: string, value: string): Promise<void> {
    let setting = await this.settingsRepo.findOne({ where: { key } });
    
    if (setting) {
      setting.value = value;
    } else {
      setting = this.settingsRepo.create({
        key,
        value,
        description: this.getDescription(key),
      });
    }
    
    await this.settingsRepo.save(setting);
    this.logger.log(`Setting updated: ${key}`);
  }

  /**
   * Tüm OAuth ayarlarını al
   */
  async getAllSettings(): Promise<OAuthSettingsDto> {
    const settings = await this.settingsRepo.find();
    const map = new Map(settings.map(s => [s.key, s.value]));

    const clientId = map.get('client_id') || '';
    const clientSecret = map.get('client_secret') || '';
    const refreshToken = map.get('refresh_token') || '';

    return {
      clientId,
      clientSecret,
      redirectUri: map.get('redirect_uri') || this.defaults.redirect_uri,
      refreshToken,
      spreadsheetId: map.get('spreadsheet_id') || this.defaults.spreadsheet_id,
      lastTokenRefresh: map.get('last_token_refresh') || null,
      isConfigured: !!(clientId && clientSecret && refreshToken),
    };
  }

  /**
   * OAuth ayarlarını toplu güncelle
   */
  async updateSettings(data: Partial<OAuthSettingsDto>): Promise<OAuthSettingsDto> {

    if (data.clientId !== undefined) {
      await this.set('client_id', data.clientId);
    }
    if (data.clientSecret !== undefined) {
      await this.set('client_secret', data.clientSecret);
    }
    if (data.redirectUri !== undefined) {
      await this.set('redirect_uri', data.redirectUri);
    }
    if (data.refreshToken !== undefined) {
      await this.set('refresh_token', data.refreshToken);
      await this.set('last_token_refresh', new Date().toISOString());
    }
    if (data.spreadsheetId !== undefined) {
      await this.set('spreadsheet_id', data.spreadsheetId);
    }

    return this.getAllSettings();
  }

  /**
   * Refresh token'ı güncelle
   */
  async updateRefreshToken(token: string): Promise<void> {
    await this.set('refresh_token', token);
    await this.set('last_token_refresh', new Date().toISOString());
  }

  /**
   * Son sync zamanını güncelle
   */
  async updateLastSync(): Promise<void> {
    await this.set('last_sync', new Date().toISOString());
  }

  /**
   * Son sync zamanını al
   */
  async getLastSync(): Promise<string | null> {
    return this.get('last_sync');
  }
}