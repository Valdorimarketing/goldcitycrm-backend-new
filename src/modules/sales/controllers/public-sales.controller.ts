import {
  Controller,
  Get,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ExchangeRateService } from '../../exchange-rate/services/exchange-rate.service';

// Public Response Interface
export interface PublicSalesSummaryResponse {
  success: boolean;
  data: {
    totalSales: number;
    totalPaid: number;
    totalRemaining: number;
    currency: string;
    breakdown: {
      EUR: {
        totalSales: number;
        totalPaid: number;
        totalRemaining: number;
        rateToUsd: number;
        inUsd: number;
      };
      USD: {
        totalSales: number;
        totalPaid: number;
        totalRemaining: number;
        rateToUsd: number;
        inUsd: number;
      };
    };
    exchangeRates: {
      EUR: number;
      USD: number;
      TRY: number;
    };
    lastUpdated: string;
  };
}

@ApiTags('Public Sales')
@Controller('public/sales')
export class PublicSalesController {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly exchangeRateService: ExchangeRateService,
  ) {}

  /**
   * Dışarıya açık endpoint - EUR ve USD toplam satış özeti
   * Auth gerektirmez
   * 
   * Response:
   * {
   *   success: true,
   *   data: {
   *     totalSales: 150000,        // USD cinsinden toplam
   *     totalPaid: 120000,         // USD cinsinden kasaya giren
   *     totalRemaining: 30000,     // USD cinsinden beklenen
   *     currency: "USD",
   *     breakdown: {
   *       EUR: { totalSales: 20000, rateToUsd: 1.09, inUsd: 21800 },
   *       USD: { totalSales: 100000, rateToUsd: 1, inUsd: 100000 }
   *     },
   *     exchangeRates: { EUR: 1.09, USD: 1, TRY: 0.029 },
   *     lastUpdated: "2025-01-15T09:00:00Z"
   *   }
   * }
   */
  @Get('summary')
  @ApiOperation({ 
    summary: 'Get public sales summary in USD (EUR + USD combined)',
    description: 'Returns total sales, paid and remaining amounts for EUR and USD currencies, converted to USD using current exchange rates. No authentication required.'
  })
  @ApiResponse({
    status: 200,
    description: 'Returns public sales summary',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            totalSales: { type: 'number', example: 150000, description: 'Total sales in USD' },
            totalPaid: { type: 'number', example: 120000, description: 'Total paid in USD' },
            totalRemaining: { type: 'number', example: 30000, description: 'Total remaining in USD' },
            currency: { type: 'string', example: 'USD' },
            breakdown: {
              type: 'object',
              properties: {
                EUR: {
                  type: 'object',
                  properties: {
                    totalSales: { type: 'number', example: 20000 },
                    totalPaid: { type: 'number', example: 15000 },
                    totalRemaining: { type: 'number', example: 5000 },
                    rateToUsd: { type: 'number', example: 1.09 },
                    inUsd: { type: 'number', example: 21800 },
                  },
                },
                USD: {
                  type: 'object',
                  properties: {
                    totalSales: { type: 'number', example: 100000 },
                    totalPaid: { type: 'number', example: 80000 },
                    totalRemaining: { type: 'number', example: 20000 },
                    rateToUsd: { type: 'number', example: 1 },
                    inUsd: { type: 'number', example: 100000 },
                  },
                },
              },
            },
            exchangeRates: {
              type: 'object',
              properties: {
                EUR: { type: 'number', example: 1.09 },
                USD: { type: 'number', example: 1 },
                TRY: { type: 'number', example: 0.029 },
              },
            },
            lastUpdated: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  })
  async getPublicSalesSummary(): Promise<PublicSalesSummaryResponse> {
    // Döviz kurlarını al
    const ratesData = await this.exchangeRateService.getExchangeRatesForFrontend();
    const rates = ratesData.rates;

    // Para birimi bazında istatistikleri direkt SQL ile al
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
    
    console.log('Stats by currency (raw SQL):', statsByCurrency);

    // EUR ve USD verilerini bul
    const eurStats = statsByCurrency.find((s: any) => s.currencyCode === 'EUR');
    const usdStats = statsByCurrency.find((s: any) => s.currencyCode === 'USD');

    // EUR değerleri
    const eurTotalSales = parseFloat(eurStats?.totalSales) || 0;
    const eurTotalPaid = parseFloat(eurStats?.totalPaid) || 0;
    const eurTotalRemaining = parseFloat(eurStats?.totalRemaining) || 0;

    // USD değerleri
    const usdTotalSales = parseFloat(usdStats?.totalSales) || 0;
    const usdTotalPaid = parseFloat(usdStats?.totalPaid) || 0;
    const usdTotalRemaining = parseFloat(usdStats?.totalRemaining) || 0;

    // EUR'u USD'ye çevir
    const eurRateToUsd = rates.EUR || 1.09;
    const eurInUsd = {
      totalSales: eurTotalSales * eurRateToUsd,
      totalPaid: eurTotalPaid * eurRateToUsd,
      totalRemaining: eurTotalRemaining * eurRateToUsd,
    };

    // Toplam (USD cinsinden)
    const totalSales = eurInUsd.totalSales + usdTotalSales;
    const totalPaid = eurInUsd.totalPaid + usdTotalPaid;
    const totalRemaining = eurInUsd.totalRemaining + usdTotalRemaining;

    return {
      success: true,
      data: {
        totalSales: Math.round(totalSales * 100) / 100,
        totalPaid: Math.round(totalPaid * 100) / 100,
        totalRemaining: Math.round(totalRemaining * 100) / 100,
        currency: 'USD',
        breakdown: {
          EUR: {
            totalSales: eurTotalSales,
            totalPaid: eurTotalPaid,
            totalRemaining: eurTotalRemaining,
            rateToUsd: eurRateToUsd,
            inUsd: Math.round(eurInUsd.totalSales * 100) / 100,
          },
          USD: {
            totalSales: usdTotalSales,
            totalPaid: usdTotalPaid,
            totalRemaining: usdTotalRemaining,
            rateToUsd: 1,
            inUsd: usdTotalSales,
          },
        },
        exchangeRates: {
          EUR: rates.EUR || 1.09,
          USD: rates.USD || 1,
          TRY: rates.TRY || 0.029,
        },
        lastUpdated: ratesData.lastUpdated.toISOString(),
      },
    };
  }
}