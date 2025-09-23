import { Injectable } from '@nestjs/common';
import { BaseService } from '../../../core/base/services/base.service';
import { Sales } from '../entities/sales.entity';
import { SalesRepository } from '../repositories/sales.repository';
import {
  CreateSalesDto,
  UpdateSalesDto,
  SalesResponseDto,
} from '../dto/create-sales.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Meeting } from '../../meeting/entities/meeting.entity';
import { Product } from '../../product/entities/product.entity';
import { SalesProduct } from '../../sales-product/entities/sales-product.entity';
import { CustomerNote } from '../../customer-note/entities/customer-note.entity';
import { CustomerHistoryService } from '../../customer-history/services/customer-history.service';
import { CustomerHistoryAction } from '../../customer-history/entities/customer-history.entity';

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
        `Sale created: ${createSalesDto.title || 'New Sale'} - ${createSalesDto.description || ''}`,
        createSalesDto,
        null,
        userId || createSalesDto.user,
        sales.id,
      );
    }

    await this.processActionLists(sales.id, userId);

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

  async deleteSales(id: number): Promise<Sales> {
    return this.remove(id);
  }

  async testActionListFeature(): Promise<any> {
    const testResults = {
      steps: [],
      createdNotes: [],
    };

    try {
      testResults.steps.push('1. Sales kaydı oluşturuluyor...');
      const sales = await this.salesRepository.save({
        customer: 1,
        user: 1,
        title: 'Test Saç Ekimi Operasyonu',
        responsibleUser: 1,
        followerUser: 1,
        maturityDate: new Date('2025-08-25T10:00:00.000Z'),
        description: 'Action-list test için otomatik oluşturuldu',
      });
      testResults.steps.push(`✅ Sales oluşturuldu. ID: ${sales.id}`);

      testResults.steps.push('2. Sales-Product kaydı oluşturuluyor...');
      const salesProduct = await this.salesProductRepository.save({
        sales: sales.id,
        product: 9,
        currency: 'TRY',
        price: 15000,
        discount: 0,
        vat: 18,
        totalPrice: 17700,
      });
      testResults.steps.push(
        `✅ Sales-Product oluşturuldu. ID: ${salesProduct.id}`,
      );

      testResults.steps.push('3. Meeting kaydı oluşturuluyor...');
      const meetingDate = new Date('2025-08-25T10:00:00.000Z');
      const meeting = await this.meetingRepository.save({
        customer: 1,
        meetingLocation: 1,
        startTime: meetingDate,
        endTime: new Date('2025-08-25T12:00:00.000Z'),
        user: 1,
        meetingStatus: 1,
        description: 'Saç ekimi operasyonu',
        salesProductId: salesProduct.id,
      });
      testResults.steps.push(
        `✅ Meeting oluşturuldu. Tarih: ${meetingDate.toLocaleDateString('tr-TR')}`,
      );

      testResults.steps.push('4. Action-list işleniyor...');
      await this.processActionLists(sales.id, 1);
      testResults.steps.push('✅ Action-list işlendi (User ID: 1)');

      testResults.steps.push(
        '5. Oluşan customer-note kayıtları kontrol ediliyor...',
      );
      const notes = await this.customerNoteRepository.find({
        where: {
          customer: 1,
          noteType: 'Şablon Araması',
        },
        order: {
          remindingAt: 'ASC',
        },
      });

      testResults.createdNotes = notes.map((note) => ({
        id: note.id,
        user: note.user,
        note: note.note,
        remindingAt: note.remindingAt,
        formattedDate: new Date(note.remindingAt).toLocaleDateString('tr-TR'),
      }));

      testResults.steps.push(
        `✅ ${notes.length} adet customer-note kaydı oluşturuldu`,
      );

      return {
        success: true,
        message: 'Test başarıyla tamamlandı!',
        ...testResults,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Test sırasında hata oluştu',
        error: error.message,
        ...testResults,
      };
    }
  }
}
