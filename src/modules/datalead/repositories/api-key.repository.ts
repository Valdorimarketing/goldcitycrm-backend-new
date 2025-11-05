import { EntityRepository, Repository } from 'typeorm';
import { ApiKey } from '../entities/api-key.entity';

@EntityRepository(ApiKey)
export class ApiKeyRepository extends Repository<ApiKey> {
  async findActiveKey(key: string, secret: string): Promise<ApiKey | null> {
    return this.findOne({ where: { key, secret, is_active: true } });
  }
}
