import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepositoryAbstract } from '../../../core/base/repositories/base.repository.abstract';
import { Product } from '../entities/product.entity';

@Injectable()
export class ProductRepository extends BaseRepositoryAbstract<Product> {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {
    super(productRepository);
  }

  async findByName(name: string): Promise<Product[]> {
    return this.getRepository()
      .createQueryBuilder('product')
      .where('product.name LIKE :name', { name: `%${name}%` })
      .getMany();
  }

  async findByPriceRange(minPrice: number, maxPrice: number): Promise<Product[]> {
    return this.getRepository()
      .createQueryBuilder('product')
      .where('product.price >= :minPrice AND product.price <= :maxPrice', {
        minPrice,
        maxPrice,
      })
      .getMany();
  }
} 