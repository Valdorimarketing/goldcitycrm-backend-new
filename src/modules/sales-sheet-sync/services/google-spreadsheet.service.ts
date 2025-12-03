// src/modules/sales-sheet-sync/services/google-spreadsheet.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { google, sheets_v4 } from 'googleapis'; 
import { GoogleOAuthSettingsService } from './google-oauth-settings.service';
import { GoogleSpreadsheet } from '../entities/google-spreadsheet.entity';

export interface SheetInfo {
  sheetId: number;
  title: string;
  index: number;
  rowCount: number;
  columnCount: number;
}

export interface SpreadsheetInfo {
  spreadsheetId: string;
  title: string;
  sheets: SheetInfo[];
}

export interface SheetData {
  sheetName: string;
  headers: string[];
  rows: any[][];
  rowCount: number;
  columnCount: number;
}

@Injectable()
export class GoogleSpreadsheetService {
  private readonly logger = new Logger(GoogleSpreadsheetService.name);
  private sheets: sheets_v4.Sheets | null = null;

  constructor(
    @InjectRepository(GoogleSpreadsheet)
    private readonly spreadsheetRepo: Repository<GoogleSpreadsheet>,
    private readonly settingsService: GoogleOAuthSettingsService,
  ) {
    this.initSheets();
  }

  /**
   * Google Sheets API'yi başlat
   */
  async initSheets(): Promise<void> {
    try {
      const settings = await this.settingsService.getAllSettings();

      if (!settings.clientId || !settings.clientSecret || !settings.refreshToken) {
        this.logger.warn('Google OAuth not configured');
        return;
      }

      const oauth2Client = new google.auth.OAuth2(
        settings.clientId,
        settings.clientSecret,
        settings.redirectUri,
      );

      oauth2Client.setCredentials({
        refresh_token: settings.refreshToken,
      });

      this.sheets = google.sheets({ version: 'v4', auth: oauth2Client });
      this.logger.log('Google Sheets API initialized');
    } catch (error) {
      this.logger.error('Failed to initialize Google Sheets API', error);
    }
  }

  /**
   * Sheets API'yi yeniden başlat
   */
  async reinitialize(): Promise<void> {
    this.sheets = null;
    await this.initSheets();
  }

  /**
   * Sheets API hazır mı?
   */
  isReady(): boolean {
    return this.sheets !== null;
  }

  // ==================== SPREADSHEET CRUD ====================

  /**
   * Tüm spreadsheet'leri listele
   */
  async getAllSpreadsheets(): Promise<GoogleSpreadsheet[]> {
    return this.spreadsheetRepo.find({
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Aktif spreadsheet'leri listele
   */
  async getActiveSpreadsheets(): Promise<GoogleSpreadsheet[]> {
    return this.spreadsheetRepo.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  /**
   * Key ile spreadsheet bul
   */
  async getByKey(key: string): Promise<GoogleSpreadsheet | null> {
    return this.spreadsheetRepo.findOne({ where: { key } });
  }

  /**
   * ID ile spreadsheet bul
   */
  async getById(id: number): Promise<GoogleSpreadsheet | null> {
    return this.spreadsheetRepo.findOne({ where: { id } });
  }

  /**
   * Yeni spreadsheet ekle
   */
  async create(data: {
    key: string;
    spreadsheetId: string;
    name: string;
    description?: string;
    isReadOnly?: boolean;
  }): Promise<GoogleSpreadsheet> {
    const spreadsheet = this.spreadsheetRepo.create({
      key: data.key,
      spreadsheetId: data.spreadsheetId,
      name: data.name,
      description: data.description || '',
      isReadOnly: data.isReadOnly ?? true,
      isActive: true,
    });

    return this.spreadsheetRepo.save(spreadsheet);
  }

  /**
   * Spreadsheet güncelle
   */
  async update(id: number, data: Partial<GoogleSpreadsheet>): Promise<GoogleSpreadsheet | null> {
    await this.spreadsheetRepo.update(id, data);
    return this.getById(id);
  }

  /**
   * Spreadsheet sil
   */
  async delete(id: number): Promise<boolean> {
    const result = await this.spreadsheetRepo.delete(id);
    return result.affected > 0;
  }

  /**
   * Last sync güncelle
   */
  async updateLastSync(key: string): Promise<void> {
    await this.spreadsheetRepo.update({ key }, { lastSync: new Date() });
  }

  // ==================== GOOGLE SHEETS API ====================

  /**
   * Spreadsheet bilgilerini al (sayfalar dahil)
   */
  async getSpreadsheetInfo(spreadsheetId: string): Promise<SpreadsheetInfo | null> {
    if (!this.sheets) {
      throw new Error('Google Sheets API not initialized');
    }

    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId,
      });

      const data = response.data;

      return {
        spreadsheetId: data.spreadsheetId,
        title: data.properties?.title || '',
        sheets: data.sheets?.map(sheet => ({
          sheetId: sheet.properties?.sheetId || 0,
          title: sheet.properties?.title || '',
          index: sheet.properties?.index || 0,
          rowCount: sheet.properties?.gridProperties?.rowCount || 0,
          columnCount: sheet.properties?.gridProperties?.columnCount || 0,
        })) || [],
      };
    } catch (error) {
      this.logger.error(`Failed to get spreadsheet info: ${spreadsheetId}`, error);
      throw error;
    }
  }

  /**
   * Key ile spreadsheet bilgilerini al
   */
  async getSpreadsheetInfoByKey(key: string): Promise<SpreadsheetInfo | null> {
    const spreadsheet = await this.getByKey(key);
    if (!spreadsheet) {
      throw new Error(`Spreadsheet not found: ${key}`);
    }

    return this.getSpreadsheetInfo(spreadsheet.spreadsheetId);
  }

  /**
   * Sayfa içeriğini oku
   */
  async readSheet(spreadsheetId: string, sheetName: string, range?: string): Promise<SheetData> {
    if (!this.sheets) {
      throw new Error('Google Sheets API not initialized');
    }

    try {
      const fullRange = range ? `${sheetName}!${range}` : sheetName;

      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range: fullRange,
      });

      const values = response.data.values || [];
      const headers = values[0] || [];
      const rows = values.slice(1);

      return {
        sheetName,
        headers,
        rows,
        rowCount: rows.length,
        columnCount: headers.length,
      };
    } catch (error) {
      this.logger.error(`Failed to read sheet: ${sheetName}`, error);
      throw error;
    }
  }

  /**
   * Key ile sayfa içeriğini oku
   */
  async readSheetByKey(key: string, sheetName: string, range?: string): Promise<SheetData> {
    const spreadsheet = await this.getByKey(key);
    if (!spreadsheet) {
      throw new Error(`Spreadsheet not found: ${key}`);
    }

    return this.readSheet(spreadsheet.spreadsheetId, sheetName, range);
  }

  /**
   * Sayfaya yaz
   */
  async writeSheet(
    spreadsheetId: string,
    sheetName: string,
    values: any[][],
    range?: string,
  ): Promise<void> {
    if (!this.sheets) {
      throw new Error('Google Sheets API not initialized');
    }

    try {
      const fullRange = range ? `${sheetName}!${range}` : `${sheetName}!A1`;

      await this.sheets.spreadsheets.values.update({
        spreadsheetId,
        range: fullRange,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values },
      });

      this.logger.log(`Written to sheet: ${sheetName}`);
    } catch (error) {
      this.logger.error(`Failed to write sheet: ${sheetName}`, error);
      throw error;
    }
  }

  /**
   * Key ile sayfaya yaz
   */
  async writeSheetByKey(
    key: string,
    sheetName: string,
    values: any[][],
    range?: string,
  ): Promise<void> {
    const spreadsheet = await this.getByKey(key);
    if (!spreadsheet) {
      throw new Error(`Spreadsheet not found: ${key}`);
    }

    if (spreadsheet.isReadOnly) {
      throw new Error(`Spreadsheet is read-only: ${key}`);
    }

    await this.writeSheet(spreadsheet.spreadsheetId, sheetName, values, range);
    await this.updateLastSync(key);
  }

  /**
   * Yeni sayfa oluştur
   */
  async createSheet(spreadsheetId: string, sheetName: string): Promise<void> {
    if (!this.sheets) {
      throw new Error('Google Sheets API not initialized');
    }

    try {
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId,
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

      this.logger.log(`Created sheet: ${sheetName}`);
    } catch (error) {
      // Sayfa zaten varsa hata verme
      if (error.message?.includes('already exists')) {
        this.logger.warn(`Sheet already exists: ${sheetName}`);
        return;
      }
      throw error;
    }
  }

  /**
   * Sayfa var mı kontrol et
   */
  async sheetExists(spreadsheetId: string, sheetName: string): Promise<boolean> {
    const info = await this.getSpreadsheetInfo(spreadsheetId);
    return info?.sheets.some(s => s.title === sheetName) || false;
  }

  /**
   * Sayfa yoksa oluştur
   */
  async ensureSheetExists(spreadsheetId: string, sheetName: string): Promise<void> {
    const exists = await this.sheetExists(spreadsheetId, sheetName);
    if (!exists) {
      await this.createSheet(spreadsheetId, sheetName);
    }
  }
}