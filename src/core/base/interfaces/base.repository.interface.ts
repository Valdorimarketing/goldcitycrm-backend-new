import {
  DeepPartial,
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  SelectQueryBuilder,
} from 'typeorm';
import { BaseQueryFilterDto } from '../dtos/base.query.filter.dto';

export interface BaseRepositoryInterface<T> {
  save(data: DeepPartial<T>): Promise<T>;
  saveMany(data: DeepPartial<T>[]): Promise<T[]>;
  findOneById(id: any): Promise<T>;
  findByIdBaseQuery(id: any): Promise<SelectQueryBuilder<T>>;
  findByFiltersBaseQuery(filters: BaseQueryFilterDto): Promise<SelectQueryBuilder<T>>;
  findByCondition(filterCondition: FindOneOptions<T>): Promise<T>;
  findAll(options?: FindManyOptions<T>): Promise<T[]>;
  remove(data: T): Promise<T>;
  deleteByCondition(condition: FindOptionsWhere<T>): Promise<void>;
} 