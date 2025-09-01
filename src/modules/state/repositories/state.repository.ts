import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepositoryAbstract } from '../../../core/base/repositories/base.repository.abstract';
import { State } from '../entities/state.entity';

@Injectable()
export class StateRepository extends BaseRepositoryAbstract<State> {
  constructor(
    @InjectRepository(State)
    private readonly stateRepository: Repository<State>,
  ) {
    super(stateRepository);
  }

  async findByName(name: string): Promise<State[]> {
    return this.getRepository()
      .createQueryBuilder('state')
      .where('state.name LIKE :name', { name: `%${name}%` })
      .getMany();
  }

  async findByCountry(countryId: number): Promise<State[]> {
    return this.getRepository().find({
      where: { country: countryId },
    });
  }
} 