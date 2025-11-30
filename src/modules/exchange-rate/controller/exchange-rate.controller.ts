import {
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { 
  ExchangeRateService, 
  ExchangeRatesResponse, 
  CachedRates 
} from '../services/exchange-rate.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Exchange Rates')
@Controller('exchange-rates')
export class ExchangeRateController {
  constructor(private readonly exchangeRateService: ExchangeRateService) {}

  /**
   * Güncel döviz kurlarını döndürür
   * Frontend bu endpoint'i kullanarak kurları alır
   */
  @Get()
  @ApiOperation({ summary: 'Get current exchange rates' })
  @ApiResponse({
    status: 200,
    description: 'Returns current exchange rates',
    schema: {
      type: 'object',
      properties: {
        rates: {
          type: 'object',
          properties: {
            TRY: { type: 'number', example: 1 },
            EUR: { type: 'number', example: 36.5 },
            USD: { type: 'number', example: 34.5 },
            GBP: { type: 'number', example: 43.5 },
          },
        },
        lastUpdated: { type: 'string', format: 'date-time' },
        baseCurrency: { type: 'string', example: 'TRY' },
      },
    },
  })
  async getRates(): Promise<ExchangeRatesResponse> {
    return this.exchangeRateService.getExchangeRatesForFrontend();
  }

  /**
   * Kurları manuel olarak günceller (sadece admin)
   */
  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Force refresh exchange rates (admin only)' })
  async forceRefresh(): Promise<{ success: boolean; message: string; data: CachedRates }> {
    const rates = await this.exchangeRateService.forceRefreshRates();
    return {
      success: true,
      message: 'Exchange rates refreshed successfully',
      data: rates,
    };
  }
}