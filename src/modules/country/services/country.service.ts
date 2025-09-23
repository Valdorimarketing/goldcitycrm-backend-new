import { Injectable } from '@nestjs/common';
import { BaseService } from '../../../core/base/services/base.service';
import { Country } from '../entities/country.entity';
import { CountryRepository } from '../repositories/country.repository';
import {
  CreateCountryDto,
  UpdateCountryDto,
  CountryResponseDto,
} from '../dto/create-country.dto';

@Injectable()
export class CountryService extends BaseService<Country> {
  constructor(private readonly countryRepository: CountryRepository) {
    super(countryRepository, Country);
  }

  async createCountry(
    createCountryDto: CreateCountryDto,
  ): Promise<CountryResponseDto> {
    return this.create(createCountryDto, CountryResponseDto);
  }

  async updateCountry(
    id: number,
    updateCountryDto: UpdateCountryDto,
  ): Promise<CountryResponseDto> {
    return this.update(updateCountryDto, id, CountryResponseDto);
  }

  async getCountryById(id: number): Promise<Country> {
    return this.findOneById(id);
  }

  async getAllCountries(): Promise<Country[]> {
    return this.findAll();
  }

  async getCountriesByName(name: string): Promise<Country[]> {
    return this.countryRepository.findByName(name);
  }

  async deleteCountry(id: number): Promise<Country> {
    return this.remove(id);
  }
}
