import { Injectable } from '@nestjs/common';
import { BaseService } from '../../../core/base/services/base.service';
import { Sales } from '../entities/sales.entity';
import { SalesRepository } from '../repositories/sales.repository';
import {
  CreateSalesDto,
  UpdateSalesDto,
  SalesResponseDto,
} from '../dto/create-sales.dto';
import { SalesQueryFilterDto } from '../dto/sales-query-filter.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Meeting } from '../../meeting/entities/meeting.entity';
import { Product } from '../../product/entities/product.entity';
import { SalesProduct } from '../../sales-product/entities/sales-product.entity';
import { CustomerNote } from '../../customer-note/entities/customer-note.entity';
import { CustomerHistoryService } from '../../customer-history/services/customer-history.service';
import { CustomerHistoryAction } from '../../customer-history/entities/customer-history.entity';
import { PaginatedResponse } from '../../../core/base/interfaces/paginated-response.interface';
import { LogMethod } from '../../../core/decorators/log.decorator';
import { SalesGateway } from '../sales.gateway';

@Injectable()
export class SalesService extends BaseService<Sales> {
  constructor(
    private readonly salesRepository: SalesRepository,
    @InjectRepository(Meeting)
    private readonly meetingRepository: Repository<Meeting>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(SalesProduct)
    private readonly salesProductRepository: Repository<SalesProduct>,
    @InjectRepository(CustomerNote)
    private readonly customerNoteRepository: Repository<CustomerNote>,
    private readonly customerHistoryService: CustomerHistoryService,
    private readonly salesGateway: SalesGateway,
  ) {
    super(salesRepository, Sales);
  }

  // ============================================
  // TAKIM İSTATİSTİKLERİ
  // ============================================

  /**
   * Tüm takımları ve üyelerini ciro bilgileriyle birlikte döndürür
   */
  async getAllTeamsSummary() {
    const { success, data } =
      await this.salesRepository.findAllTeamsSalesSummary();

    if (!success) {
      throw new Error('Team summary fetch failed');
    }

    return {
      success: true,
      data,
    };
  }

  // ============================================
  // CRUD İŞLEMLERİ
  // ============================================

  /**
   * Yeni satış oluşturur ve WebSocket ile bildirir
   */
  async createSales(
    createSalesDto: CreateSalesDto,
    userId?: number,
  ): Promise<SalesResponseDto> {
    const sales = await this.create(createSalesDto, SalesResponseDto);

    // Log to customer history
    if (createSalesDto.customer) {
      await this.customerHistoryService.logCustomerAction(
        createSalesDto.customer,
        CustomerHistoryAction.SALE_CREATED,
        `Satış oluşturuldu: ${createSalesDto.title || 'Yeni Satış'} - ${createSalesDto.description || ''}`,
        createSalesDto,
        null,
        userId || createSalesDto.user,
        sales.id,
      );
    }

    // WebSocket ile bildir
    this.salesGateway.notifyNewSale(sales);

    return sales;
  }

  /**
   * Satış günceller
   */
  async updateSales(
    id: number,
    updateSalesDto: UpdateSalesDto,
  ): Promise<SalesResponseDto> {
    return this.update(updateSalesDto, id, SalesResponseDto);
  }

  /**
   * ID'ye göre satış getirir
   */
  async getSalesById(id: number): Promise<Sales> {
    return this.findOneById(id);
  }

  /**
   * Tüm satışları getirir
   */
  async getAllSales(): Promise<Sales[]> {
    return this.findAll();
  }

  /**
   * Satış siler
   */
  async deleteSales(id: number): Promise<Sales> {
    return this.remove(id);
  }

  // ============================================
  // SATIŞ SORGULARI
  // ============================================

  /**
   * Müşteriye göre satışları getirir
   */
  async getSalesByCustomer(customerId: number): Promise<Sales[]> {
    return this.salesRepository.findByCustomer(customerId);
  }

  /**
   * Kullanıcıya göre satışları getirir
   */
  async getSalesByUser(userId: number): Promise<Sales[]> {
    return this.salesRepository.findByUser(userId);
  }

  /**
   * Sorumlu kullanıcıya göre satışları getirir
   */
  async getSalesByResponsibleUser(userId: number): Promise<Sales[]> {
    return this.salesRepository.findByResponsibleUser(userId);
  }

  /**
   * Randevusu olmayan satışları getirir
   */
  async getSalesWithoutAppointment(): Promise<Sales[]> {
    return this.salesRepository.findSalesWithoutAppointment();
  }

  /**
   * Filtrelere göre satışları detaylarıyla getirir
   * Vue sayfasındaki loadSalesData() bu endpoint'i çağırır
   * 
   * Response yapısı (Vue'un beklediği):
   * {
   *   data: [
   *     {
   *       id, customer, customerDetails: { name, surname },
   *       salesProducts: [
   *         { totalPrice, paidAmount, isPayCompleted, currency: { code }, productDetails: { currency: { code } } }
   *       ],
   *       title, description, createdAt
   *     }
   *   ],
   *   meta: { total, page, limit }
   * }
   */
  async getUserSalesWithDetails(
    filters: SalesQueryFilterDto,
  ): Promise<PaginatedResponse<Sales>> {
    const queryBuilder =
      await this.salesRepository.findUserSalesWithRelations(filters);
    return this.paginate(queryBuilder, filters, Sales);
  }

  // ============================================
  // SATIŞ ÜRÜNLERİ
  // ============================================

  /**
   * Satışa ait ürünleri getirir
   */
  async getSalesProducts(salesId: number): Promise<SalesProduct[]> {
    return this.salesProductRepository
      .createQueryBuilder('sp')
      .leftJoinAndSelect('sp.productDetails', 'product')
      .leftJoinAndSelect('product.currency', 'productCurrency')
      .leftJoinAndSelect('sp.currency', 'spCurrency')
      .where('sp.sales = :salesId', { salesId })
      .getMany();
  }

  /**
   * Müşteriye ait tüm satış ürünlerini getirir
   */
  async getCustomerSalesProducts(customerId: number): Promise<SalesProduct[]> {
    const sales = await this.salesRepository.findByCustomer(customerId);

    if (sales.length === 0) {
      return [];
    }

    const salesIds = sales.map((sale) => sale.id);

    return this.salesProductRepository
      .createQueryBuilder('sp')
      .leftJoinAndSelect('sp.productDetails', 'product')
      .leftJoinAndSelect('product.currency', 'productCurrency')
      .leftJoinAndSelect('sp.currency', 'spCurrency')
      .where('sp.sales IN (:...salesIds)', { salesIds })
      .getMany();
  }

  // ============================================
  // ACTION LIST İŞLEMLERİ
  // ============================================

  /**
   * Satış ürünleri için action list'leri işler
   */
  private async processActionLists(
    salesId: number,
    userId?: number,
  ): Promise<void> {
    const salesProducts = await this.salesProductRepository.find({
      where: { sales: salesId },
    });

    for (const salesProduct of salesProducts) {
      const meeting = await this.meetingRepository.findOne({
        where: { salesProductId: salesProduct.id },
      });

      if (!meeting) continue;

      const product = await this.productRepository.findOne({
        where: { id: salesProduct.product },
      });

      if (!product || !product.actionList) continue;

      const sales = await this.salesRepository.findOneById(salesId);
      if (!sales) continue;

      for (const action of product.actionList) {
        const noteDate = new Date(meeting.startTime);
        noteDate.setDate(noteDate.getDate() + action.dayOffset);

        const customerNote = this.customerNoteRepository.create({
          customer: sales.customer,
          user: userId || sales.user,
          note: `${action.description} - ${product.name}`,
          isReminding: true,
          remindingAt: noteDate,
          noteType: 'Şablon Araması',
        });

        await this.customerNoteRepository.save(customerNote);
      }
    }
  }

  // ============================================
  // DASHBOARD İSTATİSTİK METODLARI
  // Vue sayfasındaki kartlar bu metodları kullanır
  // ============================================

  /**
   * Para birimi bazında satış istatistiklerini getirir
   * Vue'daki getStatsByCurrency() fonksiyonu bu veriyi kullanır
   */
  @LogMethod()
  async getSalesStatsByCurrency(userId?: number): Promise<any[]> {
    return this.salesRepository.getSalesStatsByCurrency(userId);
  }

  /**
   * Aylık satış istatistiklerini getirir
   * Vue'daki getMonthlyStats() fonksiyonu bu veriyi kullanır
   */
  @LogMethod()
  async getMonthlySalesStats(
    userId?: number,
    year?: number,
    month?: number,
  ): Promise<any[]> {
    return this.salesRepository.getMonthlySalesStatsByCurrency(
      userId,
      year,
      month,
    );
  }

  /**
   * Dashboard için tüm istatistikleri getirir
   * Vue sayfasının ana veri kaynağı - loadDashboardStats() bu endpoint'i çağırır
   * 
   * Response yapısı:
   * {
   *   byCurrency: [{ currencyCode, salesCount, totalSales, totalPaid, totalRemaining, completedCount, partialCount, unpaidCount }],
   *   monthly: [{ currencyCode, totalSales, totalPaid, ... }],
   *   paymentStatus: { completed, partial, unpaid, total },
   *   summary: { totalSalesAllCurrencies, totalPaidAllCurrencies, totalRemainingAllCurrencies }
   * }
   */
  @LogMethod()
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
    return this.salesRepository.getDashboardStats(userId);
  }

  /**
   * Belirli bir tarih aralığındaki satış istatistiklerini getirir
   */
  @LogMethod()
  async getSalesStatsByDateRange(
    startDate: Date,
    endDate: Date,
    userId?: number,
  ): Promise<any[]> {
    return this.salesRepository.getSalesStatsByDateRange(
      startDate,
      endDate,
      userId,
    );
  }

  /**
   * Günlük satış trendini getirir
   */
  @LogMethod()
  async getDailySalesTrend(userId?: number, days: number = 30): Promise<any[]> {
    return this.salesRepository.getDailySalesTrend(userId, days);
  }
}