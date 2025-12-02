// src/modules/sales-sheet-sync/services/sales-sheet-sync.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { google, sheets_v4 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { ExchangeRateService } from '../../exchange-rate/services/exchange-rate.service';

@Injectable()
export class SalesSheetSyncService {
  private readonly logger = new Logger(SalesSheetSyncService.name);
  private oauth2Client: OAuth2Client;
  private sheets: sheets_v4.Sheets | null = null;
  private readonly spreadsheetId: string = '1f_JfLaps2oPiumzxC1A__kGVE09HidJc8IY9pYraMB8';
  private readonly sheetName: string = 'CRM_Sales';

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly exchangeRateService: ExchangeRateService,
  ) {
    this.initOAuth();
  }

  /**
   * OAuth2 Client'ı başlat
   */
  private initOAuth(): void {
    try {
      // HARDCODED - Kendi değerlerini buraya yaz
      const clientId = '864538142426-ulfsvk0n1bf0asbbu9hd0j93sd8cag88.apps.googleusercontent.com';
      const clientSecret = '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';
      const redirectUri = 'http://localhost:3001/auth/google/callback';
      const refreshToken = '1//03DhNsh_OFZgNCgYIARAAGAMSNwF-L9Ir2tILBpCkSQwbbHXVlR6Ka3UMBcPli5Ob9zopNZecpxLtv532L2nLnHxXuv59kRFKFwE'; // OAuth'dan aldıktan sonra buraya yapıştır

      // Debug log
      this.logger.log('=== Google OAuth Config ===');
      this.logger.log(`Client ID: ${clientId ? clientId.substring(0, 20) + '...' : 'NOT SET!'}`);
      this.logger.log(`Client Secret: ${clientSecret ? '***SET***' : 'NOT SET!'}`);
      this.logger.log(`Redirect URI: ${redirectUri}`);
      this.logger.log(`Sheets ID: ${this.spreadsheetId}`);
      this.logger.log('===========================');

      if (!clientId || !clientSecret || clientId.includes('BURAYA')) {
        this.logger.error('Google OAuth credentials not configured! Edit sync.service.ts');
        return;
      }

      this.oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        redirectUri
      );

      // Refresh token varsa ayarla
      if (refreshToken) {
        this.oauth2Client.setCredentials({
          refresh_token: refreshToken,
        });
        this.sheets = google.sheets({ version: 'v4', auth: this.oauth2Client });
        this.logger.log('Google Sheets OAuth initialized with refresh token');
      } else {
        this.logger.warn('GOOGLE_REFRESH_TOKEN not set. Run /auth/google to get one.');
      }
    } catch (error) {
      this.logger.error('Failed to initialize Google OAuth', error);
    }
  }

  /**
   * OAuth URL'i oluştur (ilk kez token almak için)
   */
  public getAuthUrl(): string {
    if (!this.oauth2Client) {
      throw new Error(
        'OAuth2 Client not initialized. Check your .env file:\n' +
        '- GOOGLE_CLIENT_ID\n' +
        '- GOOGLE_CLIENT_SECRET\n' +
        '- GOOGLE_REDIRECT_URI'
      );
    }

    const scopes = [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.file',
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
    });
  }

  /**
   * Authorization code ile token al
   */
  public async getTokenFromCode(code: string): Promise<any> {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);
      this.sheets = google.sheets({ version: 'v4', auth: this.oauth2Client });
      
      this.logger.log('Google OAuth tokens received');
      this.logger.log(`Refresh Token: ${tokens.refresh_token}`);
      this.logger.log('Add this to your .env file as GOOGLE_REFRESH_TOKEN');
      
      return tokens;
    } catch (error) {
      this.logger.error('Failed to get tokens', error);
      throw error;
    }
  }

  /**
   * Her 30 dakikada bir satış verilerini Google Sheets'e yaz
   */
  @Cron('*/30 * * * *', { name: 'sales-sheet-sync' })
  async syncSalesToSheet(): Promise<void> {
    if (!this.sheets) {
      this.logger.warn('Google Sheets not initialized. Skipping sync.');
      return;
    }

    this.logger.log('Starting sales data sync to Google Sheets...');
    
    try {
      const salesData = await this.getSalesData();
      await this.writeToSheet(salesData);
      this.logger.log('Sales data synced to Google Sheets successfully');
    } catch (error) {
      this.logger.error('Failed to sync sales data to Google Sheets', error);
    }
  }

  /**
   * Manuel senkronizasyon
   */
  public async manualSync(): Promise<{ success: boolean; message: string; data?: any }> {
    if (!this.sheets) {
      return {
        success: false,
        message: 'Google Sheets not initialized. Get refresh token first via /auth/google',
      };
    }

    try {
      const salesData = await this.getSalesData();
      await this.writeToSheet(salesData);
      return {
        success: true,
        message: 'Sales data synced to Google Sheets successfully',
        data: salesData,
      };
    } catch (error) {
      this.logger.error('Manual sync failed', error);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Satış verilerini veritabanından çek
   */
  private async getSalesData(): Promise<any> {
    const ratesData = await this.exchangeRateService.getExchangeRatesForFrontend();
    const rates = ratesData.rates;

    const statsByCurrency = await this.dataSource.query(`
      SELECT 
        COALESCE(spc.code, pc.code) as "currencyCode",
        COUNT(DISTINCT s.id) as "salesCount",
        COALESCE(SUM(sp.total_price), 0) as "totalSales",
        COALESCE(SUM(sp.paid_amount), 0) as "totalPaid",
        COALESCE(SUM(sp.total_price - sp.paid_amount), 0) as "totalRemaining"
      FROM sales s
      INNER JOIN sales_product sp ON sp.sales = s.id
      LEFT JOIN product p ON sp.product = p.id
      LEFT JOIN currencies pc ON p.currency_id = pc.id
      LEFT JOIN currencies spc ON sp.currency = spc.id
      WHERE COALESCE(spc.code, pc.code) IS NOT NULL
      GROUP BY COALESCE(spc.code, pc.code)
    `);

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
    };
  }

  /**
   * Google Sheets'e yaz
   */
  private async writeToSheet(data: any): Promise<void> {
    if (!this.sheets) {
      throw new Error('Google Sheets not initialized');
    }

    const values = [
      ['Alan', 'Değer'],
      ['Son Güncelleme', data.lastUpdated],
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
      range: `${this.sheetName}!A1:B23`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values },
    });
  }
}