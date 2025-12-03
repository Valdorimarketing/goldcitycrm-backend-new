// src/modules/sales-sheet-sync/services/sales-sheet-sync.service.ts

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { google, sheets_v4 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { ExchangeRateService } from '../../exchange-rate/services/exchange-rate.service';
import { GoogleOAuthSettingsService } from './google-oauth-settings.service';

@Injectable()
export class SalesSheetSyncService implements OnModuleInit {
  private readonly logger = new Logger(SalesSheetSyncService.name);
  private oauth2Client: OAuth2Client | null = null;
  private sheets: sheets_v4.Sheets | null = null;
  private spreadsheetId: string = '';
  private isInitialized: boolean = false;

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly exchangeRateService: ExchangeRateService,
    private readonly settingsService: GoogleOAuthSettingsService,
  ) { }

  /**
   * Module başlatıldığında OAuth'u initialize et
   */
  async onModuleInit(): Promise<void> {
    await this.initOAuth();
  }

  /**
   * OAuth2 Client'ı veritabanındaki ayarlarla başlat
   */
  async initOAuth(): Promise<{ success: boolean; message: string }> {
    try {
      const settings = await this.settingsService.getAllSettings();

      this.logger.log('=== Google OAuth Config (from DB) ===');
      this.logger.log(`Client ID: ${settings.clientId ? settings.clientId.substring(0, 20) + '...' : 'NOT SET!'}`);
      this.logger.log(`Client Secret: ${settings.clientSecret ? '***SET***' : 'NOT SET!'}`);
      this.logger.log(`Redirect URI: ${settings.redirectUri}`);
      this.logger.log(`Spreadsheet ID: ${settings.spreadsheetId}`);
      this.logger.log(`Is Configured: ${settings.isConfigured}`);
      this.logger.log('=====================================');

      if (!settings.clientId || !settings.clientSecret) {
        this.isInitialized = false;
        return {
          success: false,
          message: 'Client ID or Client Secret not configured',
        };
      }

      this.spreadsheetId = settings.spreadsheetId;

      this.oauth2Client = new google.auth.OAuth2(
        settings.clientId,
        settings.clientSecret,
        settings.redirectUri,
      );

      if (settings.refreshToken) {
        this.oauth2Client.setCredentials({
          refresh_token: settings.refreshToken,
        });
        this.sheets = google.sheets({ version: 'v4', auth: this.oauth2Client });
        this.isInitialized = true;
        this.logger.log('Google Sheets OAuth initialized with refresh token from DB');
        return {
          success: true,
          message: 'OAuth initialized successfully',
        };
      } else {
        this.isInitialized = false;
        this.logger.warn('Refresh token not set. Run OAuth flow to get one.');
        return {
          success: false,
          message: 'Refresh token not configured',
        };
      }
    } catch (error) {
      this.logger.error('Failed to initialize Google OAuth', error);
      this.isInitialized = false;
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * OAuth'u yeniden başlat (ayarlar değiştiğinde)
   */
  async reinitialize(): Promise<{ success: boolean; message: string }> {
    this.oauth2Client = null;
    this.sheets = null;
    this.isInitialized = false;
    return this.initOAuth();
  }

  /**
   * Servis durumunu al
   */
  async getStatus(): Promise<{
    isInitialized: boolean;
    isConfigured: boolean;
    lastSync: string | null;
    lastTokenRefresh: string | null;
    spreadsheetId: string;
  }> {
    const settings = await this.settingsService.getAllSettings();
    const lastSync = await this.settingsService.getLastSync();

    return {
      isInitialized: this.isInitialized,
      isConfigured: settings.isConfigured,
      lastSync,
      lastTokenRefresh: settings.lastTokenRefresh,
      spreadsheetId: settings.spreadsheetId,
    };
  }

  /**
   * OAuth URL'i oluştur
   */
  getAuthUrl(): string {
    if (!this.oauth2Client) {
      throw new Error('OAuth2 Client not initialized. Configure settings first.');
    }

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.file',
      ],
      prompt: 'consent',
    });
  }

  /**
   * Authorization code ile token al ve kaydet
   */
  async getTokenFromCode(code: string): Promise<any> {
    if (!this.oauth2Client) {
      throw new Error('OAuth2 Client not initialized');
    }

    const { tokens } = await this.oauth2Client.getToken(code);

    if (tokens.refresh_token) {
      // Refresh token'ı veritabanına kaydet
      await this.settingsService.updateRefreshToken(tokens.refresh_token);

      // OAuth'u yeniden başlat
      await this.reinitialize();
    }

    this.logger.log('Google OAuth tokens received and saved to database');

    return tokens;
  }

  /**
   * Sayfa adını oluştur
   */
  private getSheetName(month?: string): string {
    if (!month || month === 'all') {
      return 'CRM_Sales_All';
    }
    return `CRM_Sales_${month.replace('-', '_')}`;
  }

  /**
   * Sayfa var mı kontrol et, yoksa oluştur
   */
  private async ensureSheetExists(sheetName: string): Promise<void> {
    if (!this.sheets) return;

    try {
      const spreadsheet = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
      });

      const existingSheets = spreadsheet.data.sheets?.map(s => s.properties?.title) || [];

      if (!existingSheets.includes(sheetName)) {
        await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId: this.spreadsheetId,
          requestBody: {
            requests: [
              {
                addSheet: {
                  properties: { title: sheetName },
                },
              },
            ],
          },
        });
        this.logger.log(`Created new sheet: ${sheetName}`);
      }
    } catch (error) {
      this.logger.error(`Failed to ensure sheet exists: ${sheetName}`, error);
    }
  }

  /**
   * Her 30 dakikada bir sync et
   */
  @Cron('*/30 * * * *', { name: 'sales-sheet-sync' })
  async syncSalesToSheet(): Promise<void> {
    if (!this.sheets || !this.isInitialized) {
      this.logger.warn('Google Sheets not initialized. Skipping sync.');
      return;
    }

    this.logger.log('Starting sales data sync to Google Sheets...');

    try {
      // Tüm veriler
      await this.syncMonthData();

      // Son 6 ay
      const now = new Date();
      for (let i = 0; i < 6; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        await this.syncMonthData(month);
      }

      // Son sync zamanını güncelle
      await this.settingsService.updateLastSync();

      this.logger.log('Sales data synced to Google Sheets successfully');
    } catch (error) {
      this.logger.error('Failed to sync sales data to Google Sheets', error);
    }
  }

  /**
   * Belirli bir ay için sync
   */
  private async syncMonthData(month?: string): Promise<void> {
    const sheetName = this.getSheetName(month);
    await this.ensureSheetExists(sheetName);

    const salesData = await this.getSalesData(month);
    await this.writeToSheet(sheetName, salesData);

    this.logger.log(`Synced data to sheet: ${sheetName}`);
  }

  /**
   * Manuel senkronizasyon
   */
  async manualSync(): Promise<{ success: boolean; message: string; data?: any }> {
    if (!this.sheets || !this.isInitialized) {
      return {
        success: false,
        message: 'Google Sheets not initialized. Configure OAuth settings first.',
      };
    }

    try {
      await this.syncSalesToSheet();

      // Son sync zamanını güncelle
      await this.settingsService.updateLastSync();

      return {
        success: true,
        message: 'All sheets synced successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Satış verilerini veritabanından çek
   */
  /**
   * Satış verilerini veritabanından çek
   */
  async getSalesData(month?: string): Promise<any> {
    const ratesData = await this.exchangeRateService.getExchangeRatesForFrontend();
    const rates = ratesData.rates;

    let dateFilter = '';
    const params: any[] = [];

    if (month && month !== 'all') {
      const [year, monthNum] = month.split('-');
      const startDate = `${year}-${monthNum}-01`;
      const nextMonthDate = new Date(parseInt(year), parseInt(monthNum), 1);
      const endDate = nextMonthDate.toISOString().split('T')[0];

      // MySQL için ? kullan (PostgreSQL için $1, $2)
      dateFilter = `AND s.created_at >= ? AND s.created_at < ?`;
      params.push(startDate, endDate);
    }

    const query = `
    SELECT 
      COALESCE(spc.code, pc.code) as currencyCode,
      COUNT(DISTINCT s.id) as salesCount,
      COALESCE(SUM(sp.total_price), 0) as totalSales,
      COALESCE(SUM(sp.paid_amount), 0) as totalPaid,
      COALESCE(SUM(sp.total_price - sp.paid_amount), 0) as totalRemaining
    FROM sales s
    INNER JOIN sales_product sp ON sp.sales = s.id
    LEFT JOIN product p ON sp.product = p.id
    LEFT JOIN currencies pc ON p.currency_id = pc.id
    LEFT JOIN currencies spc ON sp.currency = spc.id
    WHERE COALESCE(spc.code, pc.code) IS NOT NULL
    ${dateFilter}
    GROUP BY COALESCE(spc.code, pc.code)
  `;

    const statsByCurrency = await this.dataSource.query(query, params);


    const eurStats = statsByCurrency.find((s: any) => s.currencyCode === 'EUR');
    const usdStats = statsByCurrency.find((s: any) => s.currencyCode === 'USD');

    const eurTotalSales = parseFloat(eurStats?.totalSales) || 0;
    const eurTotalPaid = parseFloat(eurStats?.totalPaid) || 0;
    const eurTotalRemaining = parseFloat(eurStats?.totalRemaining) || 0;

    const usdTotalSales = parseFloat(usdStats?.totalSales) || 0;
    const usdTotalPaid = parseFloat(usdStats?.totalPaid) || 0;
    const usdTotalRemaining = parseFloat(usdStats?.totalRemaining) || 0;

    const eurRateToUsd = rates.EUR || 1.09;

    const totalSalesUsd = (eurTotalSales * eurRateToUsd) + usdTotalSales;
    const totalPaidUsd = (eurTotalPaid * eurRateToUsd) + usdTotalPaid;
    const totalRemainingUsd = (eurTotalRemaining * eurRateToUsd) + usdTotalRemaining;

    return {
      totalSalesUsd: Math.round(totalSalesUsd * 100) / 100,
      totalPaidUsd: Math.round(totalPaidUsd * 100) / 100,
      totalRemainingUsd: Math.round(totalRemainingUsd * 100) / 100,
      eurTotalSales,
      eurTotalPaid,
      eurTotalRemaining,
      eurRateToUsd,
      usdTotalSales,
      usdTotalPaid,
      usdTotalRemaining,
      exchangeRates: {
        EUR: rates.EUR || 1.09,
        USD: rates.USD || 1,
        TRY: rates.TRY || 0.029,
      },
      lastUpdated: new Date().toISOString(),
      month: month || 'all',
    };
  }

  /**
   * Aya göre satış verilerini getir (Public API için)
   */
  async getSalesDataByMonth(month?: string): Promise<any> {
    return this.getSalesData(month);
  }

  /**
   * Google Sheets'e yaz
   */
  private async writeToSheet(sheetName: string, data: any): Promise<void> {
    if (!this.sheets) {
      throw new Error('Google Sheets not initialized');
    }

    const values = [
      ['Alan', 'Değer'],
      ['Son Güncelleme', data.lastUpdated],
      ['Dönem', data.month === 'all' ? 'Tümü' : data.month],
      ['', ''],
      ['=== GENEL TOPLAM (USD) ===', ''],
      ['Toplam Satış (USD)', data.totalSalesUsd],
      ['Kasaya Giren (USD)', data.totalPaidUsd],
      ['Beklenen (USD)', data.totalRemainingUsd],
      ['', ''],
      ['=== EUR DETAY ===', ''],
      ['EUR Toplam Satış', data.eurTotalSales],
      ['EUR Kasaya Giren', data.eurTotalPaid],
      ['EUR Beklenen', data.eurTotalRemaining],
      ['EUR/USD Kur', data.eurRateToUsd],
      ['', ''],
      ['=== USD DETAY ===', ''],
      ['USD Toplam Satış', data.usdTotalSales],
      ['USD Kasaya Giren', data.usdTotalPaid],
      ['USD Beklenen', data.usdTotalRemaining],
      ['', ''],
      ['=== KURLAR ===', ''],
      ['EUR Rate', data.exchangeRates.EUR],
      ['USD Rate', data.exchangeRates.USD],
      ['TRY Rate', data.exchangeRates.TRY],
    ];

    await this.sheets.spreadsheets.values.update({
      spreadsheetId: this.spreadsheetId,
      range: `${sheetName}!A1:B24`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values },
    });
  }
}