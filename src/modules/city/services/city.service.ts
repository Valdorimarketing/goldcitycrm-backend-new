import { Injectable } from '@nestjs/common';
import { BaseService } from '../../../core/base/services/base.service';
import { City } from '../entities/city.entity';
import { CityRepository } from '../repositories/city.repository';
import { CreateCityDto, UpdateCityDto, CityResponseDto } from '../dto/create-city.dto';

@Injectable()
export class CityService extends BaseService<City> {
  constructor(private readonly cityRepository: CityRepository) {
    super(cityRepository, City);
  }

  async createCity(createCityDto: CreateCityDto): Promise<CityResponseDto> {
    return this.create(createCityDto, CityResponseDto);
  }

  async updateCity(id: number, updateCityDto: UpdateCityDto): Promise<CityResponseDto> {
    return this.update(updateCityDto, id, CityResponseDto);
  }

  async getCityById(id: number): Promise<City> {
    return this.findOneById(id);
  }

  async getAllCities(): Promise<City[]> {
    return this.findAll();
  }

  async getCitiesByName(name: string): Promise<City[]> {
    return this.cityRepository.findByName(name);
  }

  async getCitiesByState(stateId: number): Promise<City[]> {
    return this.cityRepository.findByState(stateId);
  }

  async getCitiesByCountry(countryId: number): Promise<City[]> {
    return this.cityRepository.findByCountry(countryId);
  }

  async deleteCity(id: number): Promise<City> {
    return this.remove(id);
  }
} 