// src/modules/sales-sheet-sync/controllers/spreadsheet.controller.ts

import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { GoogleSpreadsheetService } from '../services/google-spreadsheet.service';

// DTOs
export class CreateSpreadsheetDto {
  @IsString()
  key: string;

  @IsString()
  spreadsheetId: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isReadOnly?: boolean;
}

export class UpdateSpreadsheetDto {
  @IsOptional()
  @IsString()
  spreadsheetId?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isReadOnly?: boolean;
}

@ApiTags('Google Spreadsheets')
@Controller('spreadsheets')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SpreadsheetController {
  constructor(private readonly spreadsheetService: GoogleSpreadsheetService) {}

  /**
   * Tüm spreadsheet'leri listele
   */
  @Get()
  @ApiOperation({ summary: 'List all spreadsheets' })
  async list() {
    const spreadsheets = await this.spreadsheetService.getAllSpreadsheets();
    return {
      success: true,
      data: spreadsheets,
    };
  }

  /**
   * Aktif spreadsheet'leri listele
   */
  @Get('active')
  @ApiOperation({ summary: 'List active spreadsheets' })
  async listActive() {
    const spreadsheets = await this.spreadsheetService.getActiveSpreadsheets();
    return {
      success: true,
      data: spreadsheets,
    };
  }

  /**
   * Spreadsheet detayı (key ile)
   */
  @Get('by-key/:key')
  @ApiOperation({ summary: 'Get spreadsheet by key' })
  @ApiParam({ name: 'key', example: 'crm_sales' })
  async getByKey(@Param('key') key: string) {
    const spreadsheet = await this.spreadsheetService.getByKey(key);
    
    if (!spreadsheet) {
      return {
        success: false,
        error: 'Spreadsheet not found',
      };
    }

    return {
      success: true,
      data: spreadsheet,
    };
  }

  /**
   * Spreadsheet detayı (ID ile)
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get spreadsheet by ID' })
  async getById(@Param('id') id: number) {
    const spreadsheet = await this.spreadsheetService.getById(id);
    
    if (!spreadsheet) {
      return {
        success: false,
        error: 'Spreadsheet not found',
      };
    }

    return {
      success: true,
      data: spreadsheet,
    };
  }

  /**
   * Yeni spreadsheet ekle
   */
  @Post()
  @ApiOperation({ summary: 'Create new spreadsheet' })
  async create(@Body() dto: CreateSpreadsheetDto) {
    try {
      const spreadsheet = await this.spreadsheetService.create(dto);
      return {
        success: true,
        data: spreadsheet,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Spreadsheet güncelle
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update spreadsheet' })
  async update(@Param('id') id: number, @Body() dto: UpdateSpreadsheetDto) {
    try {
      const spreadsheet = await this.spreadsheetService.update(id, dto);
      return {
        success: true,
        data: spreadsheet,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Spreadsheet sil
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete spreadsheet' })
  async delete(@Param('id') id: number) {
    const deleted = await this.spreadsheetService.delete(id);
    return {
      success: deleted,
      message: deleted ? 'Spreadsheet deleted' : 'Spreadsheet not found',
    };
  }

  /**
   * Google'dan spreadsheet bilgilerini al (sayfalar dahil)
   */
  @Get('by-key/:key/info')
  @ApiOperation({ summary: 'Get spreadsheet info from Google (sheets list)' })
  @ApiParam({ name: 'key', example: 'crm_sales' })
  async getInfo(@Param('key') key: string) {
    try {
      const info = await this.spreadsheetService.getSpreadsheetInfoByKey(key);
      return {
        success: true,
        data: info,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Sayfa içeriğini oku
   */
  @Get('by-key/:key/sheet/:sheetName')
  @ApiOperation({ summary: 'Read sheet content' })
  @ApiParam({ name: 'key', example: 'crm_sales' })
  @ApiParam({ name: 'sheetName', example: 'CRM_Sales_All' })
  @ApiQuery({ name: 'range', required: false, example: 'A1:Z100' })
  async readSheet(
    @Param('key') key: string,
    @Param('sheetName') sheetName: string,
    @Query('range') range?: string,
  ) {
    try {
      const data = await this.spreadsheetService.readSheetByKey(key, sheetName, range);
      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * API durumunu kontrol et
   */
  @Get('status/check')
  @ApiOperation({ summary: 'Check Google Sheets API status' })
  async checkStatus() {
    const isReady = this.spreadsheetService.isReady();
    return {
      success: true,
      data: {
        apiReady: isReady,
      },
    };
  }

  /**
   * API'yi yeniden başlat
   */
  @Post('reinitialize')
  @ApiOperation({ summary: 'Reinitialize Google Sheets API' })
  async reinitialize() {
    await this.spreadsheetService.reinitialize();
    return {
      success: true,
      message: 'Google Sheets API reinitialized',
      apiReady: this.spreadsheetService.isReady(),
    };
  }
}