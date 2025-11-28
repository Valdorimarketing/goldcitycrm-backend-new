import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { Sales } from '../entities/sales.entity';
import { BaseRepositoryAbstract } from '../../../core/base/repositories/base.repository.abstract';
import { SalesQueryFilterDto } from '../dto/sales-query-filter.dto';

@Injectable()
export class SalesRepository extends BaseRepositoryAbstract<Sales> {
  constructor(
    @InjectRepository(Sales)
    private readonly salesRepository: Repository<Sales>,
    private readonly dataSource: DataSource,
  ) {
    super(salesRepository);
  }

  // ============================================
  // TEMEL SORGULAR
  // ============================================

  /**
   * Müşteriye göre satışları getirir
   */
  async findByCustomer(customerId: number): Promise<Sales[]> {
    return this.salesRepository.find({
      where: { customer: customerId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Kullanıcıya göre satışları getirir
   */
  async findByUser(userId: number): Promise<Sales[]> {
    return this.salesRepository.find({
      where: { user: userId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Sorumlu kullanıcıya göre satışları getirir
   */
  async findByResponsibleUser(userId: number): Promise<Sales[]> {
    return this.salesRepository.find({
      where: { responsibleUser: userId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Randevusu olmayan satışları getirir
   */
  async findSalesWithoutAppointment(): Promise<Sales[]> {
    return this.createQueryBuilder('sales')
      .leftJoin('sales.salesProducts', 'sp')
      .leftJoin('meeting', 'm', 'm.salesProductId = sp.id')
      .where('m.id IS NULL')
      .orderBy('sales.createdAt', 'DESC')
      .getMany();
  }

  // ============================================
  // TAKIM İSTATİSTİKLERİ
  // ============================================

  /**
   * Tüm takımların satış özetini getirir
   */
  async findAllTeamsSalesSummary(): Promise<{ success: boolean; data: any }> {
    try {
      const result = await this.dataSource
        .createQueryBuilder()
        .select('t.id', 'teamId')
        .addSelect('t.name', 'teamName')
        .addSelect('u.id', 'userId')
        .addSelect('u.name', 'userName')
        .addSelect('c.code', 'currencyCode')
        .addSelect('COALESCE(SUM(sp.total_price), 0)', 'totalSales')
        .addSelect('COALESCE(SUM(sp.paid_amount), 0)', 'totalPaid')
        .from('team', 't')
        .leftJoin('user', 'u', 'u.team_id = t.id')
        .leftJoin('sales', 's', 's.user = u.id')
        .leftJoin('sales_product', 'sp', 'sp.sales = s.id')
        .leftJoin('product', 'p', 'sp.product = p.id')
        .leftJoin('currency', 'c', 'p.currency_id = c.id')
        .groupBy('t.id')
        .addGroupBy('t.name')
        .addGroupBy('u.id')
        .addGroupBy('u.name')
        .addGroupBy('c.code')
        .orderBy('t.name', 'ASC')
        .addOrderBy('u.name', 'ASC')
        .getRawMany();

      // Takımlara göre grupla
      const teamsMap = new Map<number, any>();
      const grandTotalsByCurrency: { [key: string]: number } = {};

      result.forEach((row) => {
        if (!row.teamId) return;

        if (!teamsMap.has(row.teamId)) {
          teamsMap.set(row.teamId, {
            id: row.teamId,
            name: row.teamName,
            members: [],
            totalsByCurrency: {},
          });
        }

        const team = teamsMap.get(row.teamId);

        if (row.userId) {
          let member = team.members.find((m: any) => m.id === row.userId);
          if (!member) {
            member = {
              id: row.userId,
              name: row.userName,
              salesByCurrency: {},
            };
            team.members.push(member);
          }

          if (row.currencyCode) {
            member.salesByCurrency[row.currencyCode] = {
              totalSales: parseFloat(row.totalSales) || 0,
              totalPaid: parseFloat(row.totalPaid) || 0,
            };

            if (!team.totalsByCurrency[row.currencyCode]) {
              team.totalsByCurrency[row.currencyCode] = { totalSales: 0, totalPaid: 0 };
            }
            team.totalsByCurrency[row.currencyCode].totalSales += parseFloat(row.totalSales) || 0;
            team.totalsByCurrency[row.currencyCode].totalPaid += parseFloat(row.totalPaid) || 0;

            if (!grandTotalsByCurrency[row.currencyCode]) {
              grandTotalsByCurrency[row.currencyCode] = 0;
            }
            grandTotalsByCurrency[row.currencyCode] += parseFloat(row.totalSales) || 0;
          }
        }
      });

      return {
        success: true,
        data: {
          teams: Array.from(teamsMap.values()),
          grandTotalsByCurrency,
        },
      };
    } catch (error) {
      console.error('Error fetching team sales summary:', error);
      return { success: false, data: null };
    }
  }

  // ============================================
  // SATIŞ LİSTESİ (Vue sayfası için)
  // ============================================

  /**
   * Filtrelere göre satışları ilişkileriyle birlikte getirir
   * Vue sayfasındaki loadSalesData() fonksiyonu bu endpoint'i kullanır
   */
  async findUserSalesWithRelations(
    filters: SalesQueryFilterDto,
  ): Promise<SelectQueryBuilder<Sales>> {
    const queryBuilder = this.salesRepository.createQueryBuilder('sales');

    // Mevcut entity ilişkilerini kullan
    queryBuilder
      .leftJoinAndSelect('sales.customerDetails', 'customer')
      .leftJoinAndSelect('sales.userDetails', 'user')
      .leftJoinAndSelect('sales.responsibleUserDetails', 'responsibleUser')
      .leftJoinAndSelect('sales.followerUserDetails', 'followerUser')
      .leftJoinAndSelect('sales.salesProducts', 'salesProducts')
      .leftJoinAndSelect('salesProducts.productDetails', 'product')
      .leftJoinAndSelect('product.currency', 'productCurrency')
      .leftJoinAndSelect('salesProducts.currency', 'spCurrency')
      .orderBy('sales.createdAt', 'DESC');

    // User filter
    if (filters.user !== undefined && filters.user !== null) {
      queryBuilder.andWhere('sales.user = :userId', { userId: filters.user });
    }

    // Customer filter
    if (filters.customer !== undefined && filters.customer !== null) {
      queryBuilder.andWhere('sales.customer = :customerId', {
        customerId: filters.customer,
      });
    }

    // Responsible user filter
    if (filters.responsibleUser !== undefined && filters.responsibleUser !== null) {
      queryBuilder.andWhere('sales.responsible_user = :responsibleUserId', {
        responsibleUserId: filters.responsibleUser,
      });
    }

    // Currency filter
    if (filters.currency) {
      queryBuilder.andWhere(
        `EXISTS (
          SELECT 1 FROM sales_product sp 
          LEFT JOIN currency c ON sp.currency = c.id 
          WHERE sp.sales = sales.id AND c.code = :currencyCode
        )`,
        { currencyCode: filters.currency },
      );
    }

    // Date filters
    if (filters.startDate) {
      queryBuilder.andWhere('sales.createdAt >= :startDate', {
        startDate: new Date(filters.startDate),
      });
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      queryBuilder.andWhere('sales.createdAt <= :endDate', { endDate });
    }

    // Payment status filter (Vue'dan gelen)
    if (filters.paymentStatus && filters.paymentStatus !== 'all') {
      if (filters.paymentStatus === 'completed') {
        // Tüm ürünleri tamamlanmış satışlar
        queryBuilder.andWhere(
          `NOT EXISTS (
            SELECT 1 FROM sales_product sp 
            WHERE sp.sales = sales.id AND sp.is_pay_completed = false
          )`,
        );
      } else if (filters.paymentStatus === 'partial') {
        // En az bir ödeme yapılmış ama tamamlanmamış
        queryBuilder.andWhere(
          `EXISTS (
            SELECT 1 FROM sales_product sp 
            WHERE sp.sales = sales.id AND sp.paid_amount > 0 AND sp.is_pay_completed = false
          )`,
        );
      } else if (filters.paymentStatus === 'unpaid') {
        // Hiç ödeme yapılmamış
        queryBuilder.andWhere(
          `NOT EXISTS (
            SELECT 1 FROM sales_product sp 
            WHERE sp.sales = sales.id AND (sp.paid_amount > 0 OR sp.is_pay_completed = true)
          )`,
        );
      }
    }

    return queryBuilder;
  }

  // ============================================
  // DASHBOARD İSTATİSTİKLERİ (Vue sayfası için)
  // ============================================

  /**
   * Para birimi bazında satış istatistiklerini getirir
   * Vue'daki getStatsByCurrency() fonksiyonu bu veriyi kullanır
   */
  async getSalesStatsByCurrency(userId?: number): Promise<any[]> {
    const queryBuilder = this.dataSource
      .createQueryBuilder()
      .select('c.code', 'currencyCode')
      .addSelect('COUNT(DISTINCT s.id)', 'salesCount')
      .addSelect('COALESCE(SUM(sp.total_price), 0)', 'totalSales')
      .addSelect('COALESCE(SUM(sp.paid_amount), 0)', 'totalPaid')
      .addSelect('COALESCE(SUM(sp.total_price - sp.paid_amount), 0)', 'totalRemaining')
      .addSelect('SUM(CASE WHEN sp.is_pay_completed = true THEN 1 ELSE 0 END)', 'completedCount')
      .addSelect('SUM(CASE WHEN sp.is_pay_completed = false AND sp.paid_amount > 0 THEN 1 ELSE 0 END)', 'partialCount')
      .addSelect('SUM(CASE WHEN sp.is_pay_completed = false AND (sp.paid_amount = 0 OR sp.paid_amount IS NULL) THEN 1 ELSE 0 END)', 'unpaidCount')
      .from('sales', 's')
      .innerJoin('sales_product', 'sp', 'sp.sales = s.id')
      .leftJoin('currency', 'c', 'sp.currency = c.id')
      .where('c.code IS NOT NULL')
      .groupBy('c.code');

    if (userId) {
      queryBuilder.andWhere('s.user = :userId', { userId });
    }

    const results = await queryBuilder.getRawMany();

    return results.map((row) => ({
      currencyCode: row.currencyCode || 'TRY',
      salesCount: parseInt(row.salesCount) || 0,
      totalSales: parseFloat(row.totalSales) || 0,
      totalPaid: parseFloat(row.totalPaid) || 0,
      totalRemaining: parseFloat(row.totalRemaining) || 0,
      completedCount: parseInt(row.completedCount) || 0,
      partialCount: parseInt(row.partialCount) || 0,
      unpaidCount: parseInt(row.unpaidCount) || 0,
    }));
  }

  /**
   * Aylık satış istatistiklerini para birimi bazında getirir
   * Vue'daki getMonthlyStats() fonksiyonu bu veriyi kullanır
   */
  async getMonthlySalesStatsByCurrency(
    userId?: number,
    year?: number,
    month?: number,
  ): Promise<any[]> {
    const now = new Date();
    const targetYear = year || now.getFullYear();
    const targetMonth = month || now.getMonth() + 1;

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    const queryBuilder = this.dataSource
      .createQueryBuilder()
      .select('c.code', 'currencyCode')
      .addSelect('COUNT(DISTINCT s.id)', 'salesCount')
      .addSelect('COALESCE(SUM(sp.total_price), 0)', 'totalSales')
      .addSelect('COALESCE(SUM(sp.paid_amount), 0)', 'totalPaid')
      .addSelect('COALESCE(SUM(sp.total_price - sp.paid_amount), 0)', 'totalRemaining')
      .addSelect('SUM(CASE WHEN sp.is_pay_completed = true THEN 1 ELSE 0 END)', 'completedCount')
      .addSelect('SUM(CASE WHEN sp.is_pay_completed = false AND sp.paid_amount > 0 THEN 1 ELSE 0 END)', 'partialCount')
      .addSelect('SUM(CASE WHEN sp.is_pay_completed = false AND (sp.paid_amount = 0 OR sp.paid_amount IS NULL) THEN 1 ELSE 0 END)', 'unpaidCount')
      .from('sales', 's')
      .innerJoin('sales_product', 'sp', 'sp.sales = s.id')
      .leftJoin('currency', 'c', 'sp.currency = c.id')
      .where('s.created_at BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('c.code IS NOT NULL')
      .groupBy('c.code');

    if (userId) {
      queryBuilder.andWhere('s.user = :userId', { userId });
    }

    const results = await queryBuilder.getRawMany();

    return results.map((row) => ({
      currencyCode: row.currencyCode || 'TRY',
      salesCount: parseInt(row.salesCount) || 0,
      totalSales: parseFloat(row.totalSales) || 0,
      totalPaid: parseFloat(row.totalPaid) || 0,
      totalRemaining: parseFloat(row.totalRemaining) || 0,
      completedCount: parseInt(row.completedCount) || 0,
      partialCount: parseInt(row.partialCount) || 0,
      unpaidCount: parseInt(row.unpaidCount) || 0,
    }));
  }

  /**
   * Dashboard için tüm istatistikleri getirir
   * Vue sayfasının ana veri kaynağı
   * 
   * Response yapısı:
   * {
   *   byCurrency: [{ currencyCode, salesCount, totalSales, totalPaid, totalRemaining, completedCount, partialCount, unpaidCount }],
   *   monthly: [{ currencyCode, totalSales, totalPaid, ... }],
   *   paymentStatus: { completed, partial, unpaid, total },
   *   summary: { totalSalesAllCurrencies, totalPaidAllCurrencies, totalRemainingAllCurrencies }
   * }
   */
  async getDashboardStats(userId?: number): Promise<{
    byCurrency: any[];
    monthly: any[];
    paymentStatus: {
      completed: number;
      partial: number;
      unpaid: number;
      total: number;
    };
    summary: {
      totalSalesAllCurrencies: { [key: string]: number };
      totalPaidAllCurrencies: { [key: string]: number };
      totalRemainingAllCurrencies: { [key: string]: number };
    };
  }> {
    // Para birimi bazında istatistikler
    const byCurrency = await this.getSalesStatsByCurrency(userId);

    // Aylık istatistikler
    const monthly = await this.getMonthlySalesStatsByCurrency(userId);

    // Genel ödeme durumu
    let completedTotal = 0;
    let partialTotal = 0;
    let unpaidTotal = 0;

    byCurrency.forEach((stat) => {
      completedTotal += stat.completedCount;
      partialTotal += stat.partialCount;
      unpaidTotal += stat.unpaidCount;
    });

    const paymentStatus = {
      completed: completedTotal,
      partial: partialTotal,
      unpaid: unpaidTotal,
      total: completedTotal + partialTotal + unpaidTotal,
    };

    // Özet
    const summary = {
      totalSalesAllCurrencies: {} as { [key: string]: number },
      totalPaidAllCurrencies: {} as { [key: string]: number },
      totalRemainingAllCurrencies: {} as { [key: string]: number },
    };

    byCurrency.forEach((stat) => {
      summary.totalSalesAllCurrencies[stat.currencyCode] = stat.totalSales;
      summary.totalPaidAllCurrencies[stat.currencyCode] = stat.totalPaid;
      summary.totalRemainingAllCurrencies[stat.currencyCode] = stat.totalRemaining;
    });

    return {
      byCurrency,
      monthly,
      paymentStatus,
      summary,
    };
  }

  /**
   * Tarih aralığına göre satış istatistiklerini getirir
   */
  async getSalesStatsByDateRange(
    startDate: Date,
    endDate: Date,
    userId?: number,
  ): Promise<any[]> {
    const queryBuilder = this.dataSource
      .createQueryBuilder()
      .select('c.code', 'currencyCode')
      .addSelect('COUNT(DISTINCT s.id)', 'salesCount')
      .addSelect('COALESCE(SUM(sp.total_price), 0)', 'totalSales')
      .addSelect('COALESCE(SUM(sp.paid_amount), 0)', 'totalPaid')
      .addSelect('COALESCE(SUM(sp.total_price - sp.paid_amount), 0)', 'totalRemaining')
      .from('sales', 's')
      .innerJoin('sales_product', 'sp', 'sp.sales = s.id')
      .leftJoin('currency', 'c', 'sp.currency = c.id')
      .where('s.created_at BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('c.code IS NOT NULL')
      .groupBy('c.code');

    if (userId) {
      queryBuilder.andWhere('s.user = :userId', { userId });
    }

    const results = await queryBuilder.getRawMany();

    return results.map((row) => ({
      currencyCode: row.currencyCode || 'TRY',
      salesCount: parseInt(row.salesCount) || 0,
      totalSales: parseFloat(row.totalSales) || 0,
      totalPaid: parseFloat(row.totalPaid) || 0,
      totalRemaining: parseFloat(row.totalRemaining) || 0,
    }));
  }

  /**
   * Günlük satış trendini getirir
   */
  async getDailySalesTrend(userId?: number, days: number = 30): Promise<any[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const queryBuilder = this.dataSource
      .createQueryBuilder()
      .select('DATE(s.created_at)', 'date')
      .addSelect('c.code', 'currencyCode')
      .addSelect('COUNT(DISTINCT s.id)', 'salesCount')
      .addSelect('COALESCE(SUM(sp.total_price), 0)', 'totalSales')
      .addSelect('COALESCE(SUM(sp.paid_amount), 0)', 'totalPaid')
      .from('sales', 's')
      .innerJoin('sales_product', 'sp', 'sp.sales = s.id')
      .leftJoin('currency', 'c', 'sp.currency = c.id')
      .where('s.created_at BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('c.code IS NOT NULL')
      .groupBy('DATE(s.created_at)')
      .addGroupBy('c.code')
      .orderBy('DATE(s.created_at)', 'ASC');

    if (userId) {
      queryBuilder.andWhere('s.user = :userId', { userId });
    }

    const results = await queryBuilder.getRawMany();

    return results.map((row) => ({
      date: row.date,
      currencyCode: row.currencyCode || 'TRY',
      salesCount: parseInt(row.salesCount) || 0,
      totalSales: parseFloat(row.totalSales) || 0,
      totalPaid: parseFloat(row.totalPaid) || 0,
    }));
  }
}