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
    private readonly customerHistoryService: CustomerHistoryService
  ) {
    super(salesRepository, Sales);
  }

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
    

    // Action lists are now processed when meeting is created
    // await this.processActionLists(sales.id, userId);

    return sales;
  }

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

  async updateSales(
    id: number,
    updateSalesDto: UpdateSalesDto,
  ): Promise<SalesResponseDto> {
    return this.update(updateSalesDto, id, SalesResponseDto);
  }

  async getSalesById(id: number): Promise<Sales> {
    return this.findOneById(id);
  }

  async getAllSales(): Promise<Sales[]> {
    return this.findAll();
  }

  async getSalesByCustomer(customerId: number): Promise<Sales[]> {
    return this.salesRepository.findByCustomer(customerId);
  }

  async getSalesByUser(userId: number): Promise<Sales[]> {
    return this.salesRepository.findByUser(userId);
  }

  async getSalesByResponsibleUser(userId: number): Promise<Sales[]> {
    return this.salesRepository.findByResponsibleUser(userId);
  }

  async getSalesWithoutAppointment(): Promise<Sales[]> {
    return this.salesRepository.findSalesWithoutAppointment();
  }

  async getUserSalesWithDetails(
    filters: SalesQueryFilterDto,
  ): Promise<PaginatedResponse<Sales>> {
    const queryBuilder =
      await this.salesRepository.findUserSalesWithRelations(filters);
    return this.paginate(queryBuilder, filters, Sales);
  }

  async deleteSales(id: number): Promise<Sales> {
    return this.remove(id);
  }

  async getSalesProducts(salesId: number): Promise<SalesProduct[]> {
    return this.salesProductRepository
      .createQueryBuilder('sp')
      .leftJoinAndSelect('sp.productDetails', 'product')
      .where('sp.sales = :salesId', { salesId })
      .getMany();
  }

  async getCustomerSalesProducts(customerId: number): Promise<SalesProduct[]> {
    // Get all sales for the customer
    const sales = await this.salesRepository.findByCustomer(customerId);

    if (sales.length === 0) {
      return [];
    }

    // Get all sales IDs
    const salesIds = sales.map((sale) => sale.id);

    // Get all sales products for these sales with product details
    return this.salesProductRepository
      .createQueryBuilder('sp')
      .leftJoinAndSelect('sp.productDetails', 'product')
      .where('sp.sales IN (:...salesIds)', { salesIds })
      .getMany();
  }


}
