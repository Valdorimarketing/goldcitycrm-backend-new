import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepositoryAbstract } from '../../../core/base/repositories/base.repository.abstract';
import { User } from '../entities/user.entity';

@Injectable()
export class UserRepository extends BaseRepositoryAbstract<User> {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    super(userRepository);
  }

  async findByRole(role: string): Promise<User[]> {
    return this.getRepository().find({
      where: { role },
    });
  }

  async findByEmail(email: string): Promise<User> {
    return this.getRepository().findOne({
      where: { email },
    });
  }
}
