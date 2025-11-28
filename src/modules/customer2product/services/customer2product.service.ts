import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer2Product } from '../entities/customer2product.entity';
import { Customer2ProductRepository } from '../repositories/customer2product.repository';
import { BaseService } from '../../../core/base/services/base.service';
import { CreateCustomer2ProductDto } from '../dto/create-customer2product.dto';
import { UpdateCustomer2ProductDto } from '../dto/update-customer2product.dto';
import { BulkCreateCustomer2ProductDto } from '../dto/bulk-create-customer2product.dto';
import { ConvertToSaleDto } from '../dto/convert-to-sale.dto';
import { CustomerService } from '../../customer/services/customer.service';
import { CustomerRepository } from '../../customer/repositories/customer.repository';
import { ProductService } from '../../product/services/product.service';
import { LogMethod } from '../../../core/decorators/log.decorator';
import { BaseQueryFilterDto } from '../../../core/base/dtos/base.query.filter.dto';
import { CustomerHistoryService } from '../../customer-history/services/customer-history.service';
import { CustomerHistoryAction } from '../../customer-history/entities/customer-history.entity';
import { Sales } from '../../sales/entities/sales.entity';
import { SalesProduct } from '../../sales-product/entities/sales-product.entity';
import { SalesGateway } from 'src/modules/sales/sales.gateway';

@Injectable()
export class Customer2ProductService extends BaseService<Customer2Product> {
  constructor(
    private readonly customer2ProductRepository: Customer2ProductRepository,
    private readonly customerService: CustomerService,
    private readonly customerRepository: CustomerRepository,
    private readonly productService: ProductService,
    private readonly customerHistoryService: CustomerHistoryService,
    private readonly gateway: SalesGateway,
    @InjectRepository(Sales)
    private readonly salesRepository: Repository<Sales>,
    @InjectRepository(SalesProduct)
    private readonly salesProductRepository: Repository<SalesProduct>,
  ) {
    super(customer2ProductRepository, Customer2Product);
  }

  /**
   * isPayCompleted değerini hesaplar
   * 
   * KURALLAR:
   * 1. offer (toplam tutar) 0 veya boş ise -> false (henüz fiyat belirlenmemiş)
   * 2. paidAmount >= offer ise -> true (tam ödeme alındı)
   * 3. paidAmount < offer ise -> false (kısmi veya hiç ödeme yok)
   * 
   * NOT: Bu değer ASLA dışarıdan manuel olarak true yapılmamalı,
   * her zaman paidAmount ve offer değerlerine göre hesaplanmalı.
   */
  private calculateIsPayCompleted(paidAmount: number, offer: number): boolean {
    const paid = paidAmount || 0;
    const total = offer || 0;

    // Toplam tutar 0 veya belirlenmemişse, ödeme tamamlanmış sayılmaz
    if (total <= 0) {
      return false;
    }

    // Alınan tutar >= toplam tutar ise ödeme tamamlanmış
    return paid >= total;
  }

  @LogMethod()
  async createCustomer2Product(
    createDto: CreateCustomer2ProductDto,
  ): Promise<Customer2Product> {
    const customer = await this.customerService.findById(createDto.customer);
    if (!customer) {
      throw new NotFoundException(
        `Customer with ID ${createDto.customer} not found`,
      );
    }

    const product = await this.productService.findById(createDto.product);
    if (!product) {
      throw new NotFoundException(
        `Product with ID ${createDto.product} not found`,
      );
    }

    // Update customer status to 7
    customer.status = 7;
    await this.customerRepository.update(customer.id, { status: 7 });

    const paidAmount = createDto.paidAmount || 0;
    const offer = createDto.offer || 0;

    // isPayCompleted HER ZAMAN hesaplanır, dışarıdan gelen değer yok sayılır
    // Bu, yanlışlıkla true gönderilmesini engeller
    const isPayCompleted = this.calculateIsPayCompleted(paidAmount, offer);

    const entity = {
      customer,
      product,
      note: createDto.note,
      price: createDto.price,
      paidAmount: paidAmount,
      offer: offer,
      isPayCompleted: isPayCompleted,
    };

    const result = await this.customer2ProductRepository.save(entity);

    // Log to customer history
    const productName = product?.name || 'Bilinmeyen Ürün';
    await this.customerHistoryService.logCustomerAction(
      createDto.customer,
      CustomerHistoryAction.CUSTOMER_UPDATED,
      `'${productName}' ürünü ile eşleştirme yapıldı`,
      createDto,
      result,
      (createDto as any).user || null,
    );

    return result;
  }

  @LogMethod()
  async bulkCreate(
    bulkCreateDto: BulkCreateCustomer2ProductDto,
  ): Promise<Customer2Product[]> {
    const entities = [];
    const customerIds = new Set<number>();
    const customerProductMap = new Map<number, string[]>();

    for (const item of bulkCreateDto.items) {
      const customer = await this.customerService.findById(item.customer);
      if (!customer) {
        throw new NotFoundException(
          `Customer with ID ${item.customer} not found`,
        );
      }

      const product = await this.productService.findById(item.product);
      if (!product) {
        throw new NotFoundException(
          `Product with ID ${item.product} not found`,
        );
      }

      customerIds.add(customer.id);

      if (!customerProductMap.has(customer.id)) {
        customerProductMap.set(customer.id, []);
      }
      customerProductMap.get(customer.id).push(product.name);

      const paidAmount = item.paidAmount || 0;
      const offer = item.offer || 0;

      // isPayCompleted HER ZAMAN hesaplanır
      const isPayCompleted = this.calculateIsPayCompleted(paidAmount, offer);

      entities.push({
        customer,
        product,
        note: item.note,
        price: item.price,
        paidAmount: paidAmount,
        offer: offer,
        isPayCompleted: isPayCompleted,
        user: item.user,
      });
    }

    for (const customerId of customerIds) {
      await this.customerRepository.update(customerId, { status: 7 });
    }

    const results = await this.customer2ProductRepository.bulkCreate(entities);

    for (const [customerId, productNames] of customerProductMap.entries()) {
      await this.customerHistoryService.logCustomerAction(
        customerId,
        CustomerHistoryAction.CUSTOMER_UPDATED,
        `${productNames.length} adet ürün ile toplu eşleştirme yapıldı: ${productNames.join(', ')}`,
        bulkCreateDto,
        null,
        (bulkCreateDto as any).items[0].user || null,
      );
    }

    return results;
  }

  @LogMethod()
  async updateCustomer2Product(
    id: number,
    updateDto: UpdateCustomer2ProductDto,
  ): Promise<Customer2Product> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundException(`Customer2Product with ID ${id} not found`);
    }


    console.log('[DEBUG] existing:', existing);

    const updateData: Partial<Customer2Product> = {};
    let productName = existing.product?.name || 'Bilinmeyen Ürün';

    if (updateDto.customer !== undefined) {
      const customer = await this.customerService.findById(updateDto.customer);
      if (!customer) {
        throw new NotFoundException(
          `Customer with ID ${updateDto.customer} not found`,
        );
      }
      updateData.customer = customer;
    }

    if (updateDto.product !== undefined) {
      const product = await this.productService.findById(updateDto.product);
      if (!product) {
        throw new NotFoundException(
          `Product with ID ${updateDto.product} not found`,
        );
      }
      updateData.product = product;
      productName = product.name;
    }

    if (updateDto.note !== undefined) updateData.note = updateDto.note;
    if (updateDto.price !== undefined) updateData.price = updateDto.price;
    if (updateDto.paidAmount !== undefined) updateData.paidAmount = updateDto.paidAmount;
    if (updateDto.offer !== undefined) updateData.offer = updateDto.offer;

    // isPayCompleted HER ZAMAN yeniden hesaplanır
    // Dışarıdan gelen isPayCompleted değeri YOK SAYILIR
    // Bu sayede manuel olarak true yapılamaz
    const newPaidAmount = updateDto.paidAmount ?? existing.paidAmount ?? 0;
    const newOffer = updateDto.offer ?? existing.offer ?? 0;
    updateData.isPayCompleted = this.calculateIsPayCompleted(newPaidAmount, newOffer);

    await this.customer2ProductRepository.update(id, updateData);
    const result = await this.findById(id);

    // =====================================================
    // SALES_PRODUCT GÜNCELLEME
    // Eğer bu kayıt satışa çevrildiyse, sales_product'ı da güncelle
    // =====================================================
    if (existing.isSold && existing.saleId) {
      // Product ID'yi bul - updateDto, existing veya existing.product'tan
      const productId = updateDto.product
        || (typeof existing.product === 'object' ? existing.product?.id : existing.product)
        || (existing as any).product_id;

      console.log('[DEBUG] productId:', productId);

      if (productId) {
        const salesProduct = await this.salesProductRepository.findOne({
          where: {
            sales: existing.saleId,
            product: productId,
          },
        });

        if (salesProduct) {
          await this.salesProductRepository.update(salesProduct.id, {
            paidAmount: result.paidAmount,
            totalPrice: result.offer,
            isPayCompleted: result.isPayCompleted,
          });
        }
      }
    }

    // Log to customer history
    const customerId =
      updateDto.customer !== undefined
        ? updateDto.customer
        : existing.customer?.id || (existing as any).customer;

    if (updateDto.paidAmount !== undefined) {
      const remainingAmount = (result.offer || 0) - (result.paidAmount || 0);
      await this.customerHistoryService.logCustomerAction(
        customerId,
        CustomerHistoryAction.CUSTOMER_UPDATED,
        `'${productName}' ürünü için ödeme güncellendi. Alınan: ${result.paidAmount}, Kalan: ${remainingAmount}${result.isPayCompleted ? ' (Ödeme Tamamlandı)' : ''}`,
        updateDto,
        result,
        (updateDto as any).user || null,
      );
    } else {
      await this.customerHistoryService.logCustomerAction(
        customerId,
        CustomerHistoryAction.CUSTOMER_UPDATED,
        `'${productName}' ürünü ile ilgili bilgiler güncellendi`,
        updateDto,
        result,
        (updateDto as any).user || null,
      );
    }

    return result;
  }

  /**
   * Belirli bir customer2product için ödeme durumunu günceller
   */
  @LogMethod()
  async updatePaymentStatus(
    id: number,
    paidAmount: number,
    userId?: number,
  ): Promise<Customer2Product> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundException(`Customer2Product with ID ${id} not found`);
    }

    if (existing.isSold) {
      console.warn(
        `[WARNING] Customer2Product #${id} satışa çevrilmiş. ` +
        `Ödeme güncellemesi için SalesProductService kullanılmalıdır.`
      );
    }

    const offer = existing.offer || 0;
    // isPayCompleted hesaplanır
    const isPayCompleted = this.calculateIsPayCompleted(paidAmount, offer);

    await this.customer2ProductRepository.update(id, {
      paidAmount,
      isPayCompleted,
    });

    const result = await this.findById(id);

    const customerId = existing.customer?.id || (existing as any).customer;
    const productName = existing.product?.name || 'Bilinmeyen Ürün';
    const remainingAmount = offer - paidAmount;

    await this.customerHistoryService.logCustomerAction(
      customerId,
      CustomerHistoryAction.CUSTOMER_UPDATED,
      `'${productName}' için ödeme alındı. Alınan: ${paidAmount}, Kalan: ${remainingAmount}${isPayCompleted ? ' (Ödeme Tamamlandı)' : ''}`,
      { paidAmount, isPayCompleted },
      result,
      userId || null,
    );

    return result;
  }

  @LogMethod()
  async findByCustomer(customerId: number): Promise<Customer2Product[]> {
    return await this.customer2ProductRepository.findByCustomer(customerId);
  }

  @LogMethod()
  async findUnsoldByCustomer(customerId: number): Promise<Customer2Product[]> {
    return await this.customer2ProductRepository.findUnsoldByCustomer(
      customerId,
    );
  }

  @LogMethod()
  async findByProduct(productId: number): Promise<Customer2Product[]> {
    return await this.customer2ProductRepository.findByProduct(productId);
  }

  @LogMethod()
  async findByFilters(
    options: BaseQueryFilterDto & { customer?: number },
  ): Promise<Customer2Product[]> {
    if (options.customer) {
      return await this.findByCustomer(+options.customer);
    }

    const queryBuilder = this.customer2ProductRepository
      .getQueryBuilder('cp')
      .leftJoinAndSelect('cp.product', 'product')
      .leftJoinAndSelect('cp.customer', 'customer');

    if (options.limit && options.page) {
      queryBuilder.take(options.limit);
      queryBuilder.skip((options.page - 1) * options.limit);
    } else {
      queryBuilder.take(10);
      queryBuilder.skip(0);
    }

    if (options.startDate && options.endDate) {
      queryBuilder.andWhere('cp.createdAt BETWEEN :startDate AND :endDate', {
        startDate: new Date(options.startDate),
        endDate: new Date(options.endDate),
      });
    }

    if (options.order) {
      queryBuilder.orderBy(
        'cp.createdAt',
        options.order.toUpperCase() as 'ASC' | 'DESC',
      );
    }

    return await queryBuilder.getMany();
  }

  @LogMethod()
  async convertToSale(convertDto: ConvertToSaleDto): Promise<Sales> {
    const customer = await this.customerService.findById(convertDto.customerId);
    if (!customer) {
      throw new NotFoundException(
        `Customer with ID ${convertDto.customerId} not found`,
      );
    }

    const customer2Products =
      await this.customer2ProductRepository.findByIdsAndCustomer(
        convertDto.customer2ProductIds,
        convertDto.customerId,
      );

    if (customer2Products.length === 0) {
      throw new NotFoundException(
        'Seçili ürünlerden satışa çevrilebilecek ürün bulunamadı',
      );
    }

    const productNames = customer2Products
      .map((cp) => cp.product.name)
      .join(', ');

    const sales = await this.salesRepository.save({
      customer: convertDto.customerId,
      user: convertDto.userId,
      title: convertDto.title || `Satış - ${productNames}`,
      description: convertDto.description,
      responsibleUser: convertDto.responsibleUser,
      followerUser: convertDto.followerUser,
      maturityDate: convertDto.maturityDate,
    });

    // sales_product kayıtları oluştur
    // isPayCompleted değeri HESAPLANARAK aktarılır, doğrudan kopyalanmaz
    const salesProducts = [];
    for (const cp of customer2Products) {
      const paidAmount = cp.paidAmount || 0;
      const totalPrice = cp.offer || 0;

      // isPayCompleted yeniden hesaplanır
      const isPayCompleted = this.calculateIsPayCompleted(paidAmount, totalPrice);

      const salesProduct = await this.salesProductRepository.save({
        sales: sales.id,
        product: cp.product.id,
        price: cp.price || 0,
        paidAmount: paidAmount,
        vat: 0,
        totalPrice: totalPrice,
        isPayCompleted: isPayCompleted, // Hesaplanmış değer
      });
      salesProducts.push(salesProduct);

      await this.customer2ProductRepository.update(cp.id, {
        isSold: true,
        saleId: sales.id,
      });
    }

    await this.customerHistoryService.logCustomerAction(
      convertDto.customerId,
      CustomerHistoryAction.SALE_CREATED,
      `${customer2Products.length} adet ürün satışa çevrildi: ${productNames}`,
      convertDto,
      sales,
      convertDto.userId,
      sales.id,
    );

    this.gateway.notifyNewSale(sales);

    return sales;
  }
}