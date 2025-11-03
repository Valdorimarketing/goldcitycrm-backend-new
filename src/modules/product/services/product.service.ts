import { Injectable, NotFoundException } from '@nestjs/common';
import { BaseService } from '../../../core/base/services/base.service';
import { Product } from '../entities/product.entity';
import { ProductRepository } from '../repositories/product.repository';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductResponseDto,
} from '../dto/create-product.dto';
import { ProductQueryFilterDto } from '../dto/product-query-filter.dto';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { Currency } from 'src/modules/currencies/entities/currency.entity';

@Injectable()
export class ProductService extends BaseService<Product> {


  constructor(
    private readonly productRepository: ProductRepository,
    private readonly dataSource: DataSource,
  ) {
    super(productRepository, Product); // 👈 Burada BaseService constructor çağrısı
  }

  async updateProduct(
    id: number,
    updateProductDto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    const product = await this.productRepository.findOneWithCurrency(id);

    if (!product) throw new NotFoundException(`Product not found`);

    if (updateProductDto.name !== undefined) product.name = updateProductDto.name;
    if (updateProductDto.price !== undefined) product.price = updateProductDto.price;

    if (updateProductDto.currencyId !== undefined) {
      const currency = await this.dataSource.manager.findOne(Currency, {
        where: { id: updateProductDto.currencyId },
      });

      if (!currency) throw new NotFoundException(`Currency not found`);
      product.currency = currency;
    }

    const updated = await this.productRepository.save(product);

    return {
      id: updated.id,
      name: updated.name,
      price: updated.price,
      currencyId: updated.currency?.id,
      createdAt: updated.createdAt,
      updatesAt: updated.updatesAt,
      actionList: updated.actionList || [],
    } as ProductResponseDto;
  }

  async findByFiltersBaseQuery(
    filters: ProductQueryFilterDto,
  ): Promise<SelectQueryBuilder<Product>> {
    return this.productRepository.findByFiltersBaseQuery(filters);
  }



  async createProduct(
    createProductDto: CreateProductDto,
  ): Promise<ProductResponseDto> {
    // Currency entity’sini bul
    const currency = await this.dataSource.manager.findOne(Currency, {
      where: { id: createProductDto.currencyId },
    });
    if (!currency) throw new NotFoundException('Currency not found');

    // Product entity instance oluştur


    const product = new Product();
    product.name = createProductDto.name;
    product.price = createProductDto.price;
    product.currency = currency;
    product.actionList = createProductDto.actionList || [];

    const saved = await this.productRepository.save(product);

 

    return {
      id: saved.id,
      name: saved.name,
      price: saved.price,
      currencyId: saved.currency?.id,
      createdAt: saved.createdAt,
      updatesAt: saved.updatesAt,
      actionList: saved.actionList || [],
    } as ProductResponseDto;
  }


  async getProductById(id: number): Promise<Product> {
    return this.findOneById(id);
  }

  async getAllProducts(): Promise<Product[]> {
    return this.findAll();
  }

  async getProductsByName(name: string): Promise<Product[]> {
    return this.productRepository.findByName(name);
  }

  async getProductsByPriceRange(
    minPrice: number,
    maxPrice: number,
  ): Promise<Product[]> {
    return this.productRepository.findByPriceRange(minPrice, maxPrice);
  }

  async deleteProduct(id: number): Promise<Product> {
    return this.remove(id);
  }
}
