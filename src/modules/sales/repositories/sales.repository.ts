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
    // UserRepository'yi kaldırdık
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
      .leftJoinAndSelect('user.userTeam', 'team')
      .leftJoinAndSelect('sales.responsibleUserDetails', 'responsibleUser')
      .leftJoinAndSelect('sales.followerUserDetails', 'followerUser')
      .leftJoinAndSelect('sales.salesProducts', 'salesProducts')
      .leftJoinAndSelect('salesProducts.productDetails', 'product')
      .leftJoinAndSelect('product.currency', 'productCurrency')
      .leftJoinAndSelect('salesProducts.currency', 'currency') // <-- burası önemli
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


  async findAllTeamsSalesSummary(): Promise<any> {
    const userRepository = this.getRepository().manager.getRepository('User');

    const qb = userRepository
      .createQueryBuilder('user')
      .innerJoin('user.userTeam', 'team')
      .leftJoin('sales', 'sales', 'sales.user = user.id')
      .leftJoin('sales.salesProducts', 'sp', 'sp.sales = sales.id')
      .leftJoin('sp.productDetails', 'product')
      .leftJoin('product.currency', 'productCurrency') // 🔥 currency burada!
      .select([
        'team.id AS teamId',
        'team.name AS teamName',
        'user.id AS userId',
        'user.name AS userName',
        'user.avatar AS avatar',
        'COUNT(DISTINCT sales.id) AS salesCount',
        'COALESCE(productCurrency.code, \'TRY\') AS currencyCode', // 🔥 ana para birimi
        'COALESCE(SUM(sp.totalPrice), 0) AS totalRevenue',
      ])
      .where('user.userTeamId IS NOT NULL')
      .groupBy('team.id, team.name, user.id, user.name, user.avatar, productCurrency.code')
      .orderBy('team.id', 'ASC')
      .addOrderBy('totalRevenue', 'DESC');

    const raw = await qb.getRawMany();

    // Aşağıda senin currency bazlı grouping kodun var
    const teamsMap = new Map();
    const grandTotalsByCurrency: any = {};

    for (const row of raw) {
      const teamId = row.teamId;
      const currency = row.currencyCode;
      const revenue = parseFloat(row.totalRevenue) || 0;

      if (!teamsMap.has(teamId)) {
        teamsMap.set(teamId, {
          id: teamId,
          name: row.teamName,
          totalsByCurrency: {},
          members: []
        });
      }

      const team = teamsMap.get(teamId);

      // Team currency total
      team.totalsByCurrency[currency] =
        (team.totalsByCurrency[currency] || 0) + revenue;

      // Member grouping
      let member = team.members.find(m => m.userId == row.userId);
      if (!member) {
        member = {
          userId: row.userId,
          userName: row.userName,
          avatar: row.avatar,
          salesCount: parseInt(row.salesCount),
          totalsByCurrency: {}
        };
        team.members.push(member);
      }

      member.totalsByCurrency[currency] =
        (member.totalsByCurrency[currency] || 0) + revenue;

      // Grand total
      grandTotalsByCurrency[currency] =
        (grandTotalsByCurrency[currency] || 0) + revenue;
    }

    return {
      success: true,
      data: {
        teams: [...teamsMap.values()],
        grandTotalsByCurrency
      }
    };
  }




}