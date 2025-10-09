import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { BaseRepositoryAbstract } from '../../../core/base/repositories/base.repository.abstract';
import { Product } from '../entities/product.entity';
import { ProductQueryFilterDto } from '../dto/product-query-filter.dto';

@Injectable()
export class ProductRepository extends BaseRepositoryAbstract<Product> {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {
    super(productRepository);
  }

  async findByFiltersBaseQuery(
    filters: ProductQueryFilterDto,
  ): Promise<SelectQueryBuilder<Product>> {
    const queryBuilder = await super.findByFiltersBaseQuery(filters);

    // Search functionality
    if (filters.search) {
      queryBuilder.andWhere('product.name LIKE :search', {
        search: `%${filters.search}%`,
      });
    }

    // Price range filter
    if (filters.minPrice !== undefined && filters.minPrice !== null) {
      queryBuilder.andWhere('product.price >= :minPrice', {
        minPrice: filters.minPrice,
      });
    }

    if (filters.maxPrice !== undefined && filters.maxPrice !== null) {
      queryBuilder.andWhere('product.price <= :maxPrice', {
        maxPrice: filters.maxPrice,
      });
    }

    return queryBuilder;
  }

  async findByName(name: string): Promise<Product[]> {
    return this.getRepository()
      .createQueryBuilder('product')
      .where('product.name LIKE :name', { name: `%${name}%` })
      .getMany();
  }

  async findByPriceRange(
    minPrice: number,
    maxPrice: number,
  ): Promise<Product[]> {
    return this.getRepository()
      .createQueryBuilder('product')
      .where('product.price >= :minPrice AND product.price <= :maxPrice', {
        minPrice,
        maxPrice,
      })
      .getMany();
  }
}
