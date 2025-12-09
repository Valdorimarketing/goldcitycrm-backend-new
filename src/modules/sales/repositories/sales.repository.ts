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
   * Tüm takımların satış özetini getirir (avatar dahil)
   */



  // sales.repository.ts
  async findAllTeamsSalesSummary(): Promise<{ success: boolean; data: any }> {
    try {
      const result = await this.dataSource
        .createQueryBuilder()
        .select('t.id', 'teamId')
        .addSelect('t.name', 'teamName')
        .addSelect('u.id', 'userId')
        .addSelect('u.name', 'userName')
        .addSelect('u.avatar', 'avatar')
        .addSelect("COALESCE(pc.code, spc.code, 'TRY')", 'currencyCode') // ✅ Hem product hem sp currency
        .addSelect('COALESCE(SUM(sp.total_price), 0)', 'totalSales')
        .addSelect('COALESCE(SUM(sp.paid_amount), 0)', 'totalPaid')
        .addSelect('COUNT(sp.id)', 'productCount') // ✅ YENİ: Ürün sayısı
        .from('teams', 't')
        .leftJoin('user', 'u', 'u.userTeamId = t.id')
        .leftJoin('sales', 's', 's.user = u.id')
        .leftJoin('sales_product', 'sp', 'sp.sales = s.id')
        .leftJoin('product', 'p', 'sp.product = p.id') // ✅ Product tablosu join
        .leftJoin('currencies', 'pc', 'p.currency_id = pc.id') // ✅ Product currency
        .leftJoin('currencies', 'spc', 'sp.currency = spc.id') // ✅ Sales Product currency
        .groupBy('t.id')
        .addGroupBy('t.name')
        .addGroupBy('u.id')
        .addGroupBy('u.name')
        .addGroupBy('u.avatar')
        .addGroupBy("COALESCE(pc.code, spc.code, 'TRY')") // ✅ Currency'yi de grupla
        .orderBy('t.name', 'ASC')
        .addOrderBy('u.name', 'ASC')
        .getRawMany();

      // Takımlara göre grupla
      const teamsMap = new Map<number, any>();
      const grandTotalsByCurrency: {
        [key: string]: {
          totalSales: number;
          totalPaid: number;
          productCount: number; // ✅ YENİ
        }
      } = {};

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
          let member = team.members.find((m: any) => m.userId === row.userId);
          if (!member) {
            member = {
              userId: row.userId,
              name: row.userName,
              userName: row.userName,
              avatar: row.avatar,
              salesByCurrency: {}, // ✅ salesByCurrency kullan (index.html ile uyumlu)
            };
            team.members.push(member);
          }

          const currencyCode = row.currencyCode || 'TRY';
          const sales = parseFloat(row.totalSales) || 0;
          const paid = parseFloat(row.totalPaid) || 0;
          const productCount = parseInt(row.productCount) || 0; // ✅ YENİ

          if (sales > 0 || paid > 0 || productCount > 0) {
            // Member salesByCurrency (index.html'de bu aranıyor)
            if (!member.salesByCurrency[currencyCode]) {
              member.salesByCurrency[currencyCode] = {
                totalSales: 0,
                totalPaid: 0,
                productCount: 0, // ✅ YENİ
              };
            }
            member.salesByCurrency[currencyCode].totalSales += sales;
            member.salesByCurrency[currencyCode].totalPaid += paid;
            member.salesByCurrency[currencyCode].productCount += productCount; // ✅ YENİ

            // Team totalsByCurrency
            if (!team.totalsByCurrency[currencyCode]) {
              team.totalsByCurrency[currencyCode] = {
                totalSales: 0,
                totalPaid: 0,
                productCount: 0, // ✅ YENİ
              };
            }
            team.totalsByCurrency[currencyCode].totalSales += sales;
            team.totalsByCurrency[currencyCode].totalPaid += paid;
            team.totalsByCurrency[currencyCode].productCount += productCount; // ✅ YENİ

            // Grand totals
            if (!grandTotalsByCurrency[currencyCode]) {
              grandTotalsByCurrency[currencyCode] = {
                totalSales: 0,
                totalPaid: 0,
                productCount: 0, // ✅ YENİ
              };
            }
            grandTotalsByCurrency[currencyCode].totalSales += sales;
            grandTotalsByCurrency[currencyCode].totalPaid += paid;
            grandTotalsByCurrency[currencyCode].productCount += productCount; // ✅ YENİ
          }
        }
      });

      return {
        success: true,
        data: {
          teams: Array.from(teamsMap.values()),
          grandTotalsByCurrency,
          goalsByCurrency: { // ✅ Frontend için hedefler
            EUR: 50000,
            USD: 50000,
          },
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



  /**
 * Sales Repository - findUserSalesGroupedByCurrency metodu
 * 
 * Bu metodu sales.repository.ts içine ekle
 */

  /**
   * Satışları para birimi bazında gruplar ve ayrı kayıtlar olarak döndürür
   * 
   * ÖRN: ID 48 satışta 1 EUR + 1 USD ürün var
   * SONUÇ: 2 ayrı kayıt döner:
   *   - ID 48 (EUR): 2500 EUR
   *   - ID 48 (USD): 580 USD
   */
  async findUserSalesGroupedByCurrency(
    filters: SalesQueryFilterDto,
  ): Promise<any[]> {
    const queryBuilder = this.salesRepository.createQueryBuilder('sales');

    queryBuilder
      .leftJoinAndSelect('sales.customerDetails', 'customer')
      .leftJoinAndSelect('sales.userDetails', 'user')
      .leftJoinAndSelect('user.userTeam', 'userTeam')
      .leftJoinAndSelect('sales.responsibleUserDetails', 'responsibleUser')
      .leftJoinAndSelect('sales.salesProducts', 'salesProducts')
      .leftJoinAndSelect('salesProducts.productDetails', 'product')
      .leftJoinAndSelect('product.currency', 'productCurrency')
      .leftJoinAndSelect('salesProducts.currency', 'spCurrency')
      .orderBy('sales.createdAt', 'DESC');

    // Filters
    if (filters.user !== undefined && filters.user !== null) {
      queryBuilder.andWhere('sales.user = :userId', { userId: filters.user });
    }

    if (filters.customer !== undefined && filters.customer !== null) {
      queryBuilder.andWhere('sales.customer = :customerId', {
        customerId: filters.customer,
      });
    }

    if (filters.responsibleUser !== undefined && filters.responsibleUser !== null) {
      queryBuilder.andWhere('sales.responsible_user = :responsibleUserId', {
        responsibleUserId: filters.responsibleUser,
      });
    }

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

    // Tüm satışları getir
    const allSales = await queryBuilder.getMany();

    // Para birimlerine göre grupla
    const groupedSales: any[] = [];

    for (const sale of allSales) {
      // Para birimlerine göre ürünleri grupla
      const productsByCurrency = new Map<string, any[]>();

      for (const sp of sale.salesProducts || []) {
        // Para birimi belirleme önceliği:
        // 1. sp.currency.code (salesProduct'ın kendi currency'si)
        // 2. sp.spCurrency.code (join ile gelen)
        // 3. sp.productDetails.currency.code (ürünün varsayılan currency'si)
        // 4. 'TRY' (fallback)
        const currency = sp.currency?.code ||
          sp.spCurrency?.code ||
          sp.productDetails?.currency?.code ||
          'TRY';

        if (!productsByCurrency.has(currency)) {
          productsByCurrency.set(currency, []);
        }
        productsByCurrency.get(currency).push(sp);
      }

      // Her para birimi için ayrı kayıt oluştur
      for (const [currency, products] of productsByCurrency.entries()) {
        const totalAmount = products.reduce((sum, p) => sum + (parseFloat(p.totalPrice) || 0), 0);
        const paidAmount = products.reduce((sum, p) => sum + (parseFloat(p.paidAmount) || 0), 0);
        const remainingAmount = totalAmount - paidAmount;
        const isFullyPaid = products.length > 0 && products.every(p => p.isPayCompleted === true);

        // Currency filter kontrolü (frontend'den gelen)
        if (filters.currency && filters.currency !== currency) {
          continue;
        }

        // Payment status filter kontrolü
        if (filters.paymentStatus && filters.paymentStatus !== 'all') {
          if (filters.paymentStatus === 'completed' && !isFullyPaid) continue;
          if (filters.paymentStatus === 'partial' && (isFullyPaid || paidAmount === 0)) continue;
          if (filters.paymentStatus === 'unpaid' && (isFullyPaid || paidAmount > 0)) continue;
        }

        groupedSales.push({
          id: sale.id,
          createdAt: sale.createdAt,
          updatesAt: sale.updatesAt,
          customer: sale.customer,
          customerDetails: sale.customerDetails,
          user: sale.user,
          userDetails: sale.userDetails,
          title: sale.title,
          responsibleUser: sale.responsibleUser,
          responsibleUserDetails: sale.responsibleUserDetails,
          followerUser: sale.followerUser,
          maturityDate: sale.maturityDate,
          description: sale.description,
          salesProducts: products, // ← Sadece bu para birimindeki ürünler
          // Hesaplanan değerler (frontend için)
          currency,
          totalAmount,
          paidAmount,
          remainingAmount,
          isFullyPaid,
        });
      }
    }

    return groupedSales;
  }


  /**
   * Son satışları minimal ilişkilerle getirir (index2.html için optimize)
   */
  /**
   * Son satışları minimal ilişkilerle getirir (index2.html için optimize)
   */
  async findRecentSalesOptimized(limit: number = 10): Promise<Sales[]> {
    return this.salesRepository
      .createQueryBuilder('sales')
      // User bilgileri
      .leftJoinAndSelect('sales.userDetails', 'user')
      .leftJoin('user.userTeam', 'userTeam')
      .addSelect(['userTeam.id', 'userTeam.name'])

      // Sales Products
      .leftJoinAndSelect('sales.salesProducts', 'sp')

      // Sales Product'ın kendi currency'si (eğer override edildiyse)
      .leftJoin('sp.currency', 'spCurrency')
      .addSelect(['spCurrency.id', 'spCurrency.code'])

      // Product bilgileri
      .leftJoin('sp.productDetails', 'product')
      .addSelect(['product.id', 'product.name'])

      // Product'ın default currency'si
      .leftJoin('product.currency', 'productCurrency')
      .addSelect(['productCurrency.id', 'productCurrency.code'])

      .orderBy('sales.createdAt', 'DESC')
      .take(limit)
      .getMany();
  }


  async findUserSalesWithRelations(
    filters: SalesQueryFilterDto,
  ): Promise<SelectQueryBuilder<Sales>> {
    const queryBuilder = this.salesRepository.createQueryBuilder('sales');

    queryBuilder
      .leftJoinAndSelect('sales.customerDetails', 'customer')
      .leftJoinAndSelect('sales.userDetails', 'user')
      .leftJoinAndSelect('user.userTeam', 'userTeam')  // ← Ekle
      .leftJoinAndSelect('sales.responsibleUserDetails', 'responsibleUser')
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
      .leftJoin('currencies', 'c', 'sp.currency = c.id')
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
      .leftJoin('currencies', 'c', 'sp.currency = c.id')
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
   * Dashboard için tüm istatistikleri getirir (Genel Toplam dahil)
   * Vue sayfasının ana veri kaynağı - USD bazında hesaplama
   */
  async getDashboardStatsWithGrandTotal(
    userId?: number,
    exchangeRates?: { [key: string]: number }
  ): Promise<{
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
    grandTotal: {
      totalSalesInUsd: number;
      totalPaidInUsd: number;
      totalRemainingInUsd: number;
      breakdown: {
        currency: string;
        totalSales: number;
        totalPaid: number;
        totalRemaining: number;
        rate: number;
        totalSalesInUsd: number;
        totalPaidInUsd: number;
        totalRemainingInUsd: number;
      }[];
    };
    exchangeRates: { [key: string]: number };
    ratesLastUpdated: Date;
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

    // =====================================================
    // GENEL TOPLAM HESAPLAMA (USD bazında)
    // Kurlar: 1 EUR = X USD, 1 TRY = X USD formatında
    // =====================================================
    const defaultRates = { USD: 1, EUR: 1.09, TRY: 0.029, GBP: 1.27 };
    const rates = exchangeRates || defaultRates;

    let totalSalesInUsd = 0;
    let totalPaidInUsd = 0;
    let totalRemainingInUsd = 0;
    const breakdown: any[] = [];

    byCurrency.forEach((stat) => {
      const rate = rates[stat.currencyCode] || 1;
      const salesInUsd = stat.totalSales * rate;
      const paidInUsd = stat.totalPaid * rate;
      const remainingInUsd = stat.totalRemaining * rate;

      totalSalesInUsd += salesInUsd;
      totalPaidInUsd += paidInUsd;
      totalRemainingInUsd += remainingInUsd;

      breakdown.push({
        currency: stat.currencyCode,
        totalSales: stat.totalSales,
        totalPaid: stat.totalPaid,
        totalRemaining: stat.totalRemaining,
        rate,
        totalSalesInUsd: salesInUsd,
        totalPaidInUsd: paidInUsd,
        totalRemainingInUsd: remainingInUsd,
      });
    });

    const grandTotal = {
      totalSalesInUsd,
      totalPaidInUsd,
      totalRemainingInUsd,
      breakdown,
    };

    return {
      byCurrency,
      monthly,
      paymentStatus,
      summary,
      grandTotal,
      exchangeRates: rates,
      ratesLastUpdated: new Date(),
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
      .leftJoin('currencies', 'c', 'sp.currency = c.id')
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
      .leftJoin('currencies', 'c', 'sp.currency = c.id')
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