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

  /**
   * Müşteriye ait tüm ürün eşleştirmelerini getirir
   */
  async findByCustomer(customerId: number): Promise<Customer2Product[]> {
    // Debug: Önce raw query ile kontrol edelim
    const rawResult = await this.dataSource.query(
      `SELECT * FROM customer2product WHERE customer_id = ?`,
      [customerId]
    );
    console.log('=== DEBUG: Raw Query Result ===');
    console.log('Customer ID:', customerId);
    console.log('Raw result count:', rawResult?.length || 0);
    console.log('Raw result:', JSON.stringify(rawResult, null, 2));

    // TypeORM Query Builder ile dene
    const qb = this.createQueryBuilder('cp')
      .leftJoinAndSelect('cp.product', 'product')
      .leftJoinAndSelect('cp.customer', 'customer')
      .leftJoinAndSelect('product.currency', 'currency')
      .where('cp.customer_id = :customerId', { customerId });

    // SQL'i logla
    console.log('=== DEBUG: Generated SQL ===');
    console.log(qb.getSql());
    console.log('Parameters:', { customerId });

    const result = await qb.getMany();
    console.log('=== DEBUG: QueryBuilder Result ===');
    console.log('Result count:', result?.length || 0);

    return result;
  }

  /**
   * Müşteriye ait satılmamış ürün eşleştirmelerini getirir
   */
  async findUnsoldByCustomer(customerId: number): Promise<Customer2Product[]> {
    return this.createQueryBuilder('cp')
      .leftJoinAndSelect('cp.product', 'product')
      .leftJoinAndSelect('cp.customer', 'customer')
      .leftJoinAndSelect('product.currency', 'currency')
      .where('cp.customer_id = :customerId', { customerId })
      .andWhere('cp.is_sold = :isSold', { isSold: false })
      .getMany();
  }

  /**
   * Belirli ID'lere ve müşteriye ait satılmamış eşleştirmeleri getirir
   */
  async findByIdsAndCustomer(
    ids: number[],
    customerId: number,
  ): Promise<Customer2Product[]> {
    return this.createQueryBuilder('cp')
      .leftJoinAndSelect('cp.product', 'product')
      .leftJoinAndSelect('cp.customer', 'customer')
      .leftJoinAndSelect('product.currency', 'currency')
      .whereInIds(ids)
      .andWhere('cp.customer_id = :customerId', { customerId })
      .andWhere('cp.is_sold = :isSold', { isSold: false })
      .getMany();
  }

  /**
   * Ürüne göre eşleştirmeleri getirir
   */
  async findByProduct(productId: number): Promise<Customer2Product[]> {
    return this.createQueryBuilder('cp')
      .leftJoinAndSelect('cp.product', 'product')
      .leftJoinAndSelect('cp.customer', 'customer')
      .leftJoinAndSelect('product.currency', 'currency')
      .where('cp.product_id = :productId', { productId })
      .getMany();
  }

  getQueryBuilder(alias?: string) {
    return this.createQueryBuilder(alias || 'cp');
  }
}