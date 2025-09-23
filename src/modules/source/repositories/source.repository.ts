import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOneOptions, SelectQueryBuilder } from 'typeorm';
import { BaseRepositoryAbstract } from '../../../core/base/repositories/base.repository.abstract';
import { Source } from '../entities/source.entity';

@Injectable()
export class SourceRepository extends BaseRepositoryAbstract<Source> {
  constructor(
    @InjectRepository(Source)
    repository: Repository<Source>,
  ) {
    super(repository);
  }

  async findOne(options: FindOneOptions<Source>): Promise<Source | null> {
    return this.getRepository().findOne(options);
  }

  public createSourceQueryBuilder(alias?: string): SelectQueryBuilder<Source> {
    return this.createQueryBuilder(alias || 'source');
  }
}
