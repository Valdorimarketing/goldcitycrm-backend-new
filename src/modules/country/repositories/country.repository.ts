import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepositoryAbstract } from '../../../core/base/repositories/base.repository.abstract';
import { Country } from '../entities/country.entity';

@Injectable()
export class CountryRepository extends BaseRepositoryAbstract<Country> {
  constructor(
    @InjectRepository(Country)
    private readonly countryRepository: Repository<Country>,
  ) {
    super(countryRepository);
  }

  async findByName(name: string): Promise<Country[]> {
    return this.getRepository()
      .createQueryBuilder('country')
      .where('country.name LIKE :name', { name: `%${name}%` })
      .getMany();
  }
}
