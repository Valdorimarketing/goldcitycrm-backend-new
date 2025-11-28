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

@ApiTags('Sales')
@Controller('sales')
@UseGuards(JwtAuthGuard)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  // ============================================
  // CRUD ENDPOINTS
  // ============================================

  @Post()
  @ApiOperation({ summary: 'Create a new sale' })
  create(@Body() createDto: CreateSalesDto) {
    return this.salesService.createSales(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all sales with filters' })
  findAll(@Query() query: SalesQueryFilterDto) {
    return this.salesService.getUserSalesWithDetails(query);
  }

  /**
   * Vue sayfasındaki loadSalesData() bu endpoint'i çağırır
   * Response: { data: Sales[], meta: { total, page, limit } }
   */
  @Get('user/details')
  @ApiOperation({ summary: 'Get user sales with full details including salesProducts' })
  @ApiQuery({ name: 'user', required: false, type: Number, description: 'Filter by user ID' })
  @ApiQuery({ name: 'customer', required: false, type: Number, description: 'Filter by customer ID' })
  @ApiQuery({ name: 'currency', required: false, type: String, description: 'Filter by currency code (TRY, EUR, USD)' })
  @ApiQuery({ name: 'paymentStatus', required: false, enum: ['all', 'completed', 'partial', 'unpaid'], description: 'Filter by payment status' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'End date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
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
  @ApiOperation({ summary: 'Get a sale by ID' })
  findOne(@Param('id') id: string) {
    return this.salesService.getSalesById(+id);
  }

  @Get(':id/products')
  @ApiOperation({ summary: 'Get products of a sale' })
  async getSalesProducts(@Param('id') id: string) {
    return this.salesService.getSalesProducts(+id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a sale' })
  update(@Param('id') id: string, @Body() updateDto: UpdateSalesDto) {
    return this.salesService.updateSales(+id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a sale' })
  remove(@Param('id') id: string) {
    return this.salesService.deleteSales(+id);
  }
}