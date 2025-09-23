import { Injectable } from '@nestjs/common';
import { BaseService } from '../../../core/base/services/base.service';
import { Source } from '../entities/source.entity';
import { SourceRepository } from '../repositories/source.repository';
import { LogMethod } from '../../../core/decorators/log.decorator';

@Injectable()
export class SourceService extends BaseService<Source> {
  constructor(public readonly sourceRepository: SourceRepository) {
    super(sourceRepository, Source);
  }

  @LogMethod()
  async findByName(name: string): Promise<Source | null> {
    return this.sourceRepository.findOne({ where: { name } });
  }
}
