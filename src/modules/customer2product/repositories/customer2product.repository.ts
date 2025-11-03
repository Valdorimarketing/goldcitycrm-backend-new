import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Customer2Product } from '../entities/customer2product.entity';
import { BaseRepositoryAbstract } from '../../../core/base/repositories/base.repository.abstract';

@Injectable()
export class Customer2ProductRepository extends BaseRepositoryAbstract<Customer2Product> {
  constructor(private dataSource: DataSource) {
    super(dataSource.getRepository(Customer2Product));
  }

  async bulkCreate(
    entities: Partial<Customer2Product>[],
  ): Promise<Customer2Product[]> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const savedEntities = await queryRunner.manager.save(
        Customer2Product,
        entities,
      );
      await queryRunner.commitTransaction();
      return savedEntities;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findByCustomer(customerId: number): Promise<Customer2Product[]> {
    return this.createQueryBuilder('cp')
      .leftJoinAndSelect('cp.product', 'product') 
      .leftJoinAndSelect('cp.customer', 'customer')
      .leftJoinAndSelect('product.currency', 'currency')
      .where('cp.customer = :customerId', { customerId })
      .getMany();
  }

  async findUnsoldByCustomer(customerId: number): Promise<Customer2Product[]> {
    return this.createQueryBuilder('cp')
      .leftJoinAndSelect('cp.product', 'product')
      .leftJoinAndSelect('cp.customer', 'customer')
      .leftJoinAndSelect('product.currency', 'currency')
      .where('cp.customer = :customerId', { customerId })
      .andWhere('cp.is_sold = :isSold', { isSold: false })
      .getMany();
  }

  async findByIdsAndCustomer(
    ids: number[],
    customerId: number,
  ): Promise<Customer2Product[]> {
    return this.createQueryBuilder('cp')
      .leftJoinAndSelect('cp.product', 'product')
      .leftJoinAndSelect('cp.customer', 'customer')
      .leftJoinAndSelect('product.currency', 'currency')
      .whereInIds(ids)
      .andWhere('cp.customer = :customerId', { customerId })
      .andWhere('cp.is_sold = :isSold', { isSold: false })
      .getMany();
  }

  async findByProduct(productId: number): Promise<Customer2Product[]> {
    return this.createQueryBuilder('cp')
      .leftJoinAndSelect('cp.product', 'product')
      .leftJoinAndSelect('cp.customer', 'customer')
      .leftJoinAndSelect('product.currency', 'currency')
      .where('cp.product = :productId', { productId })
      .getMany();
  }

  getQueryBuilder(alias?: string) {
    return this.createQueryBuilder(alias || 'cp');
  }
}
