import { Injectable, NotFoundException } from '@nestjs/common';
import { Customer2Product } from '../entities/customer2product.entity';
import { Customer2ProductRepository } from '../repositories/customer2product.repository';
import { BaseService } from '../../../core/base/services/base.service';
import { CreateCustomer2ProductDto } from '../dto/create-customer2product.dto';
import { UpdateCustomer2ProductDto } from '../dto/update-customer2product.dto';
import { BulkCreateCustomer2ProductDto } from '../dto/bulk-create-customer2product.dto';
import { CustomerService } from '../../customer/services/customer.service';
import { CustomerRepository } from '../../customer/repositories/customer.repository';
import { ProductService } from '../../product/services/product.service';
import { LogMethod } from '../../../core/decorators/log.decorator';
import { BaseQueryFilterDto } from '../../../core/base/dtos/base.query.filter.dto';

@Injectable()
export class Customer2ProductService extends BaseService<Customer2Product> {
  constructor(
    private readonly customer2ProductRepository: Customer2ProductRepository,
    private readonly customerService: CustomerService,
    private readonly customerRepository: CustomerRepository,
    private readonly productService: ProductService,
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

    return await this.customer2ProductRepository.save(entity);
  }

  @LogMethod()
  async bulkCreate(
    bulkCreateDto: BulkCreateCustomer2ProductDto,
  ): Promise<Customer2Product[]> {
    const entities = [];
    const customerIds = new Set<number>();

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

    return await this.customer2ProductRepository.bulkCreate(entities);
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
    }

    if (updateDto.note !== undefined) updateData.note = updateDto.note;
    if (updateDto.price !== undefined) updateData.price = updateDto.price;
    if (updateDto.discount !== undefined)
      updateData.discount = updateDto.discount;
    if (updateDto.offer !== undefined) updateData.offer = updateDto.offer;

    await this.customer2ProductRepository.update(id, updateData);
    return await this.findById(id);
  }

  @LogMethod()
  async findByCustomer(customerId: number): Promise<Customer2Product[]> {
    return await this.customer2ProductRepository.findByCustomer(customerId);
  }

  @LogMethod()
  async findByProduct(productId: number): Promise<Customer2Product[]> {
    return await this.customer2ProductRepository.findByProduct(productId);
  }

  @LogMethod()
  async findByFilters(options: BaseQueryFilterDto & { customer?: number }): Promise<Customer2Product[]> {
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
      queryBuilder.andWhere(
        'cp.createdAt BETWEEN :startDate AND :endDate',
        {
          startDate: new Date(options.startDate),
          endDate: new Date(options.endDate),
        },
      );
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
}
