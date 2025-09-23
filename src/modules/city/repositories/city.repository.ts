import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepositoryAbstract } from '../../../core/base/repositories/base.repository.abstract';
import { City } from '../entities/city.entity';

@Injectable()
export class CityRepository extends BaseRepositoryAbstract<City> {
  constructor(
    @InjectRepository(City)
    private readonly cityRepository: Repository<City>,
  ) {
    super(cityRepository);
  }

  async findByName(name: string): Promise<City[]> {
    return this.getRepository()
      .createQueryBuilder('city')
      .where('city.name LIKE :name', { name: `%${name}%` })
      .getMany();
  }

  async findByState(stateId: number): Promise<City[]> {
    return this.getRepository().find({
      where: { state: stateId },
    });
  }

  async findByCountry(countryId: number): Promise<City[]> {
    return this.getRepository()
      .createQueryBuilder('city')
      .innerJoin('state', 'state', 'state.id = city.state')
      .where('state.country = :countryId', { countryId })
      .getMany();
  }
}
