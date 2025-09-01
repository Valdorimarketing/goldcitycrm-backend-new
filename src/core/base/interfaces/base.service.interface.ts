import { DeepPartial, FindManyOptions, SelectQueryBuilder } from 'typeorm';
import { BaseQueryFilterDto } from '../dtos/base.query.filter.dto';
import { PaginatedResponse } from './paginated-response.interface';

export interface IBaseService<T> {
  create<D extends DeepPartial<T>, E>(createDto: D, responseDtoClass: new () => E): Promise<E>;
  update<D, E>(updateDto: D, id: number, responseDtoClass: new () => E): Promise<E>;
  findOneById(id: number): Promise<T>;
  findAll(options?: FindManyOptions<T>): Promise<T[]>;
  findById(id: number): Promise<T>;
  findByFilters(options: BaseQueryFilterDto): Promise<T[]>;
  remove(id: number): Promise<T>;
  paginate<D, E>(
    queryBuilder: SelectQueryBuilder<E>,
    filters: BaseQueryFilterDto,
    dtoClass: new (...args: any[]) => D,
    queryData?: D[] | null,
  ): Promise<PaginatedResponse<D>>;
} 