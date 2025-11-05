import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiKey } from '../entities/api-key.entity';

@Injectable()
export class ApiKeyService {
  constructor(
    @InjectRepository(ApiKey)
    private readonly apiKeyRepository: Repository<ApiKey>,
  ) {}

  async validateKey(key: string, secret: string): Promise<boolean> {
    const found = await this.apiKeyRepository.findOne({
      where: { key, secret, is_active: true },
    });
    return !!found;
  }
}
