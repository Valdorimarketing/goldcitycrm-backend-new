import {
  DeepPartial,
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import { BaseRepositoryInterface } from '../interfaces/base.repository.interface';
import { CustomHttpException } from '../../utils/custom-http.exception';
import { BaseQueryFilterDto } from '../dtos/base.query.filter.dto';

interface HasId {
  id: number;
}

export abstract class BaseRepositoryAbstract<T extends HasId>
  implements BaseRepositoryInterface<T>
{
  private entity: Repository<T>;
  readonly entityName: string;

  protected constructor(entity: Repository<T>) {
    this.entity = entity;
    this.entityName = entity.metadata.name;
  }

  protected getRepository(): Repository<T> {
    return this.entity;
  }

  protected createQueryBuilder(alias?: string): SelectQueryBuilder<T> {
    return this.entity.createQueryBuilder(
      alias || this.entityName.toLowerCase(),
    );
  }

  public async save(data: DeepPartial<T>): Promise<T> {
    return await this.entity.save(data);
  }

  public async saveMany(data: DeepPartial<T>[]): Promise<T[]> {
    return await this.entity.save(data);
  }

  public async findOneById(id: any): Promise<T> {
    const options: FindOptionsWhere<T> = { id: id } as FindOptionsWhere<T>;
    const entity = await this.entity.findOneBy(options);
    if (!entity) {
      throw CustomHttpException.notFound(this.entityName);
    }
    return entity;
  }

  public async findByIdBaseQuery(id: any): Promise<SelectQueryBuilder<T>> {
    const queryBuilder = this.createQueryBuilder();
    queryBuilder.where({ id: id });
    return queryBuilder;
  }

  public async findByFiltersBaseQuery(
    filters: BaseQueryFilterDto,
  ): Promise<SelectQueryBuilder<T>> {
    const queryBuilder = this.createQueryBuilder();

    if (filters.limit && filters.page) {
      queryBuilder.take(filters.limit);
      queryBuilder.skip((filters.page - 1) * filters.limit);
    } else {
      queryBuilder.take(10);
      queryBuilder.skip(0);
    }

    if (filters.startDate && filters.endDate) {
      queryBuilder.andWhere(
        'entity.createdAt BETWEEN :startDate AND :endDate',
        {
          startDate: new Date(filters.startDate),
          endDate: new Date(filters.endDate),
        },
      );
    }

    if (filters.order) {
      queryBuilder.orderBy(
        'entity.createdAt',
        filters.order.toUpperCase() as 'ASC' | 'DESC',
      );
    }

    return queryBuilder;
  }

  public async findByCondition(filterCondition: FindOneOptions<T>): Promise<T> {
    return await this.entity.findOne(filterCondition);
  }

  public async findAll(options?: FindManyOptions<T>): Promise<T[]> {
    return await this.entity.find(options);
  }

  public async remove(data: T): Promise<T> {
    return await this.entity.remove(data);
  }

  public async deleteByCondition(
    condition: FindOptionsWhere<T>,
  ): Promise<void> {
    await this.entity.delete(condition);
  }

  public async update(id: number, data: DeepPartial<T>): Promise<void> {
    await this.entity.update(id, data as any);
  }

  public async removeByCondition(
    condition: FindOptionsWhere<T>,
  ): Promise<void> {
    await this.entity.delete(condition);
  }
}
