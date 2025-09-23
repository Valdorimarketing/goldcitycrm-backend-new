import { DeepPartial, FindManyOptions, SelectQueryBuilder } from 'typeorm';
import { IBaseService } from '../interfaces/base.service.interface';
import { BaseRepositoryAbstract } from '../repositories/base.repository.abstract';
import { plainToInstance } from 'class-transformer';
import { LogMethod } from '../../decorators/log.decorator';
import { BaseQueryFilterDto } from '../dtos/base.query.filter.dto';
import { CustomHttpException } from '../../utils/custom-http.exception';
import { PaginatedResponse } from '../interfaces/paginated-response.interface';
import { PaginationDto } from '../dtos/pagination.dto';

interface HasId {
  id: number;
}

export abstract class BaseService<T extends HasId> implements IBaseService<T> {
  protected readonly repository: BaseRepositoryAbstract<T>;
  public entityClass: new (partial?: any) => T;

  protected constructor(
    repository: BaseRepositoryAbstract<T>,
    entityClass: new (partial?: any) => T,
  ) {
    this.repository = repository;
    this.entityClass = entityClass;
  }

  public async paginate<D, E>(
    queryBuilder: SelectQueryBuilder<E>,
    filters: BaseQueryFilterDto,
    dtoClass: new (...args: any[]) => D,
    queryData?: D[] | null,
  ): Promise<PaginatedResponse<D>> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const [entities, total] = await queryBuilder.getManyAndCount();
    const data = plainToInstance(dtoClass, entities, {
      excludeExtraneousValues: true,
    });
    const meta: PaginationDto = { page, limit, total };
    return { data: queryData ?? data, meta };
  }

  @LogMethod()
  public async create<D extends DeepPartial<T>, E>(
    createDto: D,
    responseDtoClass: new () => E,
  ): Promise<E> {
    const savedEntity = await this.repository.save(createDto);
    return plainToInstance(responseDtoClass, savedEntity, {
      excludeExtraneousValues: true,
    });
  }

  public async createMany(data: DeepPartial<T>[]): Promise<T[]> {
    return this.repository.saveMany(data);
  }

  public async updateMany(data: DeepPartial<T>[]): Promise<T[]> {
    return this.repository.saveMany(data);
  }

  @LogMethod()
  public async update<D, E>(
    updateDto: D,
    id: number,
    responseDtoClass: new () => E,
  ): Promise<E> {
    const entity = await this.repository.findOneById(id);
    if (!entity) {
      throw CustomHttpException.notFound(this.entityClass.name);
    }
    Object.assign(entity, updateDto);
    const savedEntity = await this.repository.save(entity);
    return plainToInstance(responseDtoClass, savedEntity, {
      excludeExtraneousValues: true,
    });
  }

  @LogMethod()
  public async findOneById(id: number): Promise<T> {
    return await this.repository.findOneById(id);
  }

  @LogMethod()
  public async findAll(options?: FindManyOptions<T>): Promise<T[]> {
    return this.repository.findAll(options);
  }

  @LogMethod()
  public async findById(id: number): Promise<T> {
    const query = await this.repository.findByIdBaseQuery(id);
    return query.getOne();
  }

  @LogMethod()
  public async findByFilters(options: BaseQueryFilterDto): Promise<T[]> {
    const query = await this.repository.findByFiltersBaseQuery(options);
    return query.getMany();
  }

  @LogMethod()
  public async remove(id: number): Promise<T> {
    const data = await this.repository.findOneById(id);
    return this.repository.remove(data);
  }
}
