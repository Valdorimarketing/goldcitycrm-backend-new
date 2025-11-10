import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { BaseRepositoryAbstract } from '../../../core/base/repositories/base.repository.abstract';
import { Sales } from '../entities/sales.entity';
import { SalesQueryFilterDto } from '../dto/sales-query-filter.dto';

@Injectable()
export class SalesRepository extends BaseRepositoryAbstract<Sales> {
  constructor(
    @InjectRepository(Sales)
    private readonly salesRepository: Repository<Sales>,
  ) {
    super(salesRepository);
  }

  async findByCustomer(customerId: number): Promise<Sales[]> {
    return this.getRepository().find({
      where: { customer: customerId },
    });
  }

  async findByUser(userId: number): Promise<Sales[]> {
    return this.getRepository().find({
      where: { user: userId },
    });
  }

  async findByResponsibleUser(userId: number): Promise<Sales[]> {
    return this.getRepository().find({
      where: { responsibleUser: userId },
    });
  }

  async findSalesWithoutAppointment(): Promise<Sales[]> {
    return this.getRepository()
      .createQueryBuilder('sales')
      .where((qb) => {
        const subQuery = qb
          .subQuery()
          .select('1')
          .from('meeting', 'meeting')
          .where('meeting.customer = sales.customer')
          .getQuery();
        return `NOT EXISTS ${subQuery}`;
      })
      .andWhere('sales.customer IS NOT NULL')
      .orderBy('sales.createdAt', 'DESC')
      .getMany();
  }

  async findUserSalesWithRelations(
    filters: SalesQueryFilterDto,
  ): Promise<SelectQueryBuilder<Sales>> {
    const queryBuilder = await super.findByFiltersBaseQuery(filters);

    // Add relations
    queryBuilder
      .innerJoinAndSelect('sales.customerDetails', 'customer')
      .leftJoinAndSelect('sales.userDetails', 'user')
      .leftJoinAndSelect('sales.responsibleUserDetails', 'responsibleUser')
      .leftJoinAndSelect('sales.followerUserDetails', 'followerUser')
      .leftJoinAndSelect('sales.salesProducts', 'salesProducts')
      .leftJoinAndSelect('salesProducts.productDetails', 'product')
      .leftJoinAndSelect('product.currency', 'productCurrency')
      .orderBy('sales.createdAt', 'DESC');



    // User filter
    if (filters.user !== undefined && filters.user !== null) {
      queryBuilder.andWhere('sales.user = :userId', { userId: filters.user });
    }

    // Customer filter
    if (filters.customer !== undefined && filters.customer !== null) {
      queryBuilder.andWhere('sales.customer = :customerId', {
        customerId: filters.customer,
      });
    }

    // Responsible user filter
    if (
      filters.responsibleUser !== undefined &&
      filters.responsibleUser !== null
    ) {
      queryBuilder.andWhere('sales.responsible_user = :responsibleUserId', {
        responsibleUserId: filters.responsibleUser,
      });
    }

    return queryBuilder;
  }
}
