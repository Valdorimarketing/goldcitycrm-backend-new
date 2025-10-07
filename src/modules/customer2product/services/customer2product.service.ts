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

@Injectable()
export class Customer2ProductService extends BaseService<Customer2Product> {
  constructor(
    private readonly customer2ProductRepository: Customer2ProductRepository,
    private readonly customerService: CustomerService,
    private readonly customerRepository: CustomerRepository,
    private readonly productService: ProductService,
    private readonly customerHistoryService: CustomerHistoryService,
    @InjectRepository(Sales)
    private readonly salesRepository: Repository<Sales>,
    @InjectRepository(SalesProduct)
    private readonly salesProductRepository: Repository<SalesProduct>,
  ) {
    super(customer2ProductRepository, Customer2Product);
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

    const entity = {
      customer,
      product,
      note: createDto.note,
      price: createDto.price,
      discount: createDto.discount,
      offer: createDto.offer,
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

      // Collect unique customer IDs to update their status
      customerIds.add(customer.id);

      // Track products for each customer for history logging
      if (!customerProductMap.has(customer.id)) {
        customerProductMap.set(customer.id, []);
      }
      customerProductMap.get(customer.id).push(product.name);

      entities.push({
        customer,
        product,
        note: item.note,
        price: item.price,
        discount: item.discount,
        offer: item.offer,
      });
    }

    // Update all affected customers' status to 7
    for (const customerId of customerIds) {
      await this.customerRepository.update(customerId, { status: 7 });
    }

    const results = await this.customer2ProductRepository.bulkCreate(entities);

    // Log to customer history for each customer
    for (const [customerId, productNames] of customerProductMap.entries()) {
      await this.customerHistoryService.logCustomerAction(
        customerId,
        CustomerHistoryAction.CUSTOMER_UPDATED,
        `${productNames.length} adet ürün ile toplu eşleştirme yapıldı: ${productNames.join(', ')}`,
        bulkCreateDto,
        null,
        (bulkCreateDto as any).user || null,
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
    if (updateDto.discount !== undefined)
      updateData.discount = updateDto.discount;
    if (updateDto.offer !== undefined) updateData.offer = updateDto.offer;

    await this.customer2ProductRepository.update(id, updateData);
    const result = await this.findById(id);

    // Log to customer history
    const customerId =
      updateDto.customer !== undefined
        ? updateDto.customer
        : existing.customer?.id || (existing as any).customer;

    await this.customerHistoryService.logCustomerAction(
      customerId,
      CustomerHistoryAction.CUSTOMER_UPDATED,
      `'${productName}' ürünü ile ilgili bilgiler güncellendi`,
      updateDto,
      result,
      (updateDto as any).user || null,
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
    // If customer filter is present, use the optimized findByCustomer method
    if (options.customer) {
      return await this.findByCustomer(+options.customer);
    }

    // Otherwise, build a query with relations
    const queryBuilder = this.customer2ProductRepository
      .getQueryBuilder('cp')
      .leftJoinAndSelect('cp.product', 'product')
      .leftJoinAndSelect('cp.customer', 'customer');

    // Apply pagination if present
    if (options.limit && options.page) {
      queryBuilder.take(options.limit);
      queryBuilder.skip((options.page - 1) * options.limit);
    } else {
      queryBuilder.take(10);
      queryBuilder.skip(0);
    }

    // Apply date filters if present
    if (options.startDate && options.endDate) {
      queryBuilder.andWhere('cp.createdAt BETWEEN :startDate AND :endDate', {
        startDate: new Date(options.startDate),
        endDate: new Date(options.endDate),
      });
    }

    // Apply ordering if present
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
    // Verify customer exists
    const customer = await this.customerService.findById(convertDto.customerId);
    if (!customer) {
      throw new NotFoundException(
        `Customer with ID ${convertDto.customerId} not found`,
      );
    }

    // Fetch all customer2product records
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

    // Create sales record
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

    // Create sales_product records for each customer2product
    const salesProducts = [];
    for (const cp of customer2Products) {
      const salesProduct = await this.salesProductRepository.save({
        sales: sales.id,
        product: cp.product.id,
        currency: 'TRY', // Default currency
        price: cp.price || 0,
        discount: cp.discount || 0,
        vat: 0, // Can be calculated or set to 0
        totalPrice: (cp.price || 0) - (cp.discount || 0),
      });
      salesProducts.push(salesProduct);

      // Update customer2product record
      await this.customer2ProductRepository.update(cp.id, {
        isSold: true,
        saleId: sales.id,
      });
    }

    // Log to customer history
    await this.customerHistoryService.logCustomerAction(
      convertDto.customerId,
      CustomerHistoryAction.SALE_CREATED,
      `${customer2Products.length} adet ürün satışa çevrildi: ${productNames}`,
      convertDto,
      sales,
      convertDto.userId,
      sales.id,
    );

    return sales;
  }
}
