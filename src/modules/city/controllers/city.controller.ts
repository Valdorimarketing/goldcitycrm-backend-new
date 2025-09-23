import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { CityService } from '../services/city.service';
import {
  CreateCityDto,
  UpdateCityDto,
  CityResponseDto,
} from '../dto/create-city.dto';
import { City } from '../entities/city.entity';

@Controller('cities')
export class CityController {
  constructor(private readonly cityService: CityService) {}

  @Post()
  async create(@Body() createCityDto: CreateCityDto): Promise<CityResponseDto> {
    return this.cityService.createCity(createCityDto);
  }

  @Get()
  async findAll(
    @Query('name') name?: string,
    @Query('state') state?: string,
    @Query('country') country?: string,
  ): Promise<City[]> {
    if (name) {
      return this.cityService.getCitiesByName(name);
    }
    if (state) {
      return this.cityService.getCitiesByState(+state);
    }
    if (country) {
      return this.cityService.getCitiesByCountry(+country);
    }
    return this.cityService.getAllCities();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<City> {
    return this.cityService.getCityById(+id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCityDto: UpdateCityDto,
  ): Promise<CityResponseDto> {
    return this.cityService.updateCity(+id, updateCityDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<City> {
    return this.cityService.deleteCity(+id);
  }
}
