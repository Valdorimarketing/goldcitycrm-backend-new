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


  async findOneWithCurrency(id: number): Promise<Product> {
    return this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.currency', 'currency')
      .where('product.id = :id', { id })
      .getOne();
  }


  async findByFiltersBaseQuery(
    filters: ProductQueryFilterDto,
  ): Promise<SelectQueryBuilder<Product>> {
    const queryBuilder = this.createQueryBuilder('product')
      .leftJoinAndSelect('product.currency', 'currency'); // currency ilişkisini çek

    // Currency filtreleri
    if (filters.currencyId) {
      queryBuilder.andWhere('currency.id = :currencyId', { currencyId: filters.currencyId });
    }
    if (filters.currencyCode) {
      queryBuilder.andWhere('currency.code = :currencyCode', { currencyCode: filters.currencyCode });
    }

    // Ürün ismi arama
    if (filters.search) {
      queryBuilder.andWhere('product.name LIKE :search', { search: `%${filters.search}%` });
    }

    // Fiyat aralığı
    if (filters.minPrice != null) {
      queryBuilder.andWhere('product.price >= :minPrice', { minPrice: filters.minPrice });
    }
    if (filters.maxPrice != null) {
      queryBuilder.andWhere('product.price <= :maxPrice', { maxPrice: filters.maxPrice });
    }

    // Pagination
    const limit = filters.limit || 10;
    const page = filters.page || 1;
    queryBuilder.take(limit).skip((page - 1) * limit);

    // Order
    if (filters.order) {
      queryBuilder.orderBy('product.created_at', filters.order.toUpperCase() as 'ASC' | 'DESC');
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
