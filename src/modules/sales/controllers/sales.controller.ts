import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SalesService } from '../services/sales.service';
import { CreateSalesDto, UpdateSalesDto } from '../dto/create-sales.dto';
import { SalesQueryFilterDto } from '../dto/sales-query-filter.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ExchangeRateService } from 'src/modules/exchange-rate/services/exchange-rate.service';

@ApiTags('Sales')
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService, private readonly exchangeRateService: ExchangeRateService) { }

  // ============================================
  // CRUD ENDPOINTS
  // ============================================

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new sale' })
  create(@Body() createDto: CreateSalesDto) {
    return this.salesService.createSales(createDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all sales with filters' })
  findAll(@Query() query: SalesQueryFilterDto) {
    return this.salesService.getUserSalesWithDetails(query);
  }

  /**
   * Vue sayfasındaki loadSalesData() bu endpoint'i çağırır
   * Response: { data: Sales[], meta: { total, page, limit } }
   */
  @Get('user/details')
  async getUserSalesWithDetails(@Query() query: SalesQueryFilterDto) {
    return this.salesService.getUserSalesWithDetails(query);
  }

  // ============================================
  // DASHBOARD STATISTICS ENDPOINTS
  // Vue sayfasındaki kartlar bu endpoint'leri kullanır
  // ============================================

  /**
   * Para birimi bazında istatistikler
   * Vue'daki availableCurrencies ve getStatsByCurrency() bu veriyi kullanır
   */
  @Get('stats/by-currency')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get sales statistics grouped by currency' })
  @ApiQuery({ name: 'userId', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Returns sales statistics grouped by currency',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          currencyCode: { type: 'string', example: 'EUR' },
          salesCount: { type: 'number', example: 15 },
          totalSales: { type: 'number', example: 50000 },
          totalPaid: { type: 'number', example: 35000 },
          totalRemaining: { type: 'number', example: 15000 },
          completedCount: { type: 'number', example: 8 },
          partialCount: { type: 'number', example: 5 },
          unpaidCount: { type: 'number', example: 2 },
        },
      },
    },
  })
  async getStatsByCurrency(@Query('userId') userId?: number) {
    return this.salesService.getSalesStatsByCurrency(userId ? +userId : undefined);
  }

  /**
   * Aylık istatistikler
   * Vue'daki getMonthlyStats() bu veriyi kullanır
   */
  @Get('stats/monthly')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get monthly sales statistics by currency' })
  @ApiQuery({ name: 'userId', required: false, type: Number })
  @ApiQuery({ name: 'year', required: false, type: Number })
  @ApiQuery({ name: 'month', required: false, type: Number })
  async getMonthlyStats(
    @Query('userId') userId?: number,
    @Query('year') year?: number,
    @Query('month') month?: number,
  ) {
    return this.salesService.getMonthlySalesStats(
      userId ? +userId : undefined,
      year ? +year : undefined,
      month ? +month : undefined,
    );
  }

  /**
   * Dashboard için tüm istatistikler - ANA ENDPOINT
   * Vue sayfası bu tek endpoint'i çağırarak tüm dashboard verilerini alır
   * 
   * Response:
   * {
   *   byCurrency: [{ currencyCode, salesCount, totalSales, totalPaid, totalRemaining, completedCount, partialCount, unpaidCount }],
   *   monthly: [{ currencyCode, totalSales, totalPaid, ... }],
   *   paymentStatus: { completed, partial, unpaid, total },
   *   summary: { totalSalesAllCurrencies, totalPaidAllCurrencies, totalRemainingAllCurrencies }
   * }
   */
  @Get('stats/dashboard')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all dashboard statistics - main endpoint for Vue page' })
  @ApiQuery({ name: 'userId', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Returns comprehensive dashboard statistics',
    schema: {
      type: 'object',
      properties: {
        byCurrency: {
          type: 'array',
          description: 'Statistics grouped by currency for cards',
          items: {
            type: 'object',
            properties: {
              currencyCode: { type: 'string' },
              salesCount: { type: 'number' },
              totalSales: { type: 'number' },
              totalPaid: { type: 'number' },
              totalRemaining: { type: 'number' },
              completedCount: { type: 'number' },
              partialCount: { type: 'number' },
              unpaidCount: { type: 'number' },
            },
          },
        },
        monthly: {
          type: 'array',
          description: 'Monthly statistics for current month cards',
        },
        paymentStatus: {
          type: 'object',
          description: 'Overall payment status counts',
          properties: {
            completed: { type: 'number' },
            partial: { type: 'number' },
            unpaid: { type: 'number' },
            total: { type: 'number' },
          },
        },
        summary: {
          type: 'object',
          description: 'Summary totals by currency',
          properties: {
            totalSalesAllCurrencies: { type: 'object' },
            totalPaidAllCurrencies: { type: 'object' },
            totalRemainingAllCurrencies: { type: 'object' },
          },
        },
      },
    },
  })
  async getDashboardStats(@Query('userId') userId?: number) {
    return this.salesService.getDashboardStats(userId ? +userId : undefined);
  }

  /**
   * Tarih aralığına göre istatistikler
   */
  @Get('stats/by-date-range')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get sales statistics by date range' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  @ApiQuery({ name: 'userId', required: false, type: Number })
  async getStatsByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('userId') userId?: number,
  ) {
    return this.salesService.getSalesStatsByDateRange(
      new Date(startDate),
      new Date(endDate),
      userId ? +userId : undefined,
    );
  }

  /**
   * Günlük satış trendi
   */
  @Get('stats/daily-trend')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get daily sales trend for charts' })
  @ApiQuery({ name: 'userId', required: false, type: Number })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Number of days (default: 30)' })
  async getDailyTrend(
    @Query('userId') userId?: number,
    @Query('days') days?: number,
  ) {
    return this.salesService.getDailySalesTrend(
      userId ? +userId : undefined,
      days ? +days : 30,
    );
  }

  // ============================================
  // TEAM STATISTICS
  // ============================================

  @Get('teams/summary')
  @ApiOperation({ summary: 'Get all teams sales summary' })
  async getTeamsSummary() {
    return this.salesService.getAllTeamsSummary();
  }

  // ============================================
  // INDIVIDUAL SALE OPERATIONS
  // ============================================

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get a sale by ID' })
  findOne(@Param('id') id: string) {
    return this.salesService.getSalesById(+id);
  }

  @Get(':id/products')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get products of a sale' })
  async getSalesProducts(@Param('id') id: string) {
    return this.salesService.getSalesProducts(+id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update a sale' })
  update(@Param('id') id: string, @Body() updateDto: UpdateSalesDto) {
    return this.salesService.updateSales(+id, updateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete a sale' })
  remove(@Param('id') id: string) {
    return this.salesService.deleteSales(+id);
  }



  @Get('stats/dashboard-with-grand-total')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get dashboard statistics with grand total in TRY' })
  @ApiQuery({ name: 'userId', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Returns comprehensive dashboard statistics with grand total',
    schema: {
      type: 'object',
      properties: {
        byCurrency: { type: 'array' },
        monthly: { type: 'array' },
        paymentStatus: { type: 'object' },
        summary: { type: 'object' },
        grandTotal: {
          type: 'object',
          properties: {
            totalSalesInTry: { type: 'number', example: 1500000 },
            totalPaidInTry: { type: 'number', example: 1200000 },
            totalRemainingInTry: { type: 'number', example: 300000 },
            breakdown: { type: 'array' },
          },
        },
        exchangeRates: {
          type: 'object',
          properties: {
            TRY: { type: 'number', example: 1 },
            EUR: { type: 'number', example: 36.5 },
            USD: { type: 'number', example: 34.5 },
          },
        },
        ratesLastUpdated: { type: 'string', format: 'date-time' },
      },
    },
  })
  
  async getDashboardStatsWithGrandTotal(@Query('userId') userId?: number) {
    // Önce döviz kurlarını al
    const ratesData = await this.exchangeRateService.getExchangeRatesForFrontend();

    // Dashboard istatistiklerini kurlarla birlikte hesapla
    const stats = await this.salesService.getDashboardStatsWithGrandTotal(
      userId ? +userId : undefined,
      ratesData.rates
    );

    return {
      ...stats,
      exchangeRates: ratesData.rates,
      ratesLastUpdated: ratesData.lastUpdated,
    };
  }


}