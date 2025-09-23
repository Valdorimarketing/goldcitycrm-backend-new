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
import { CountryService } from '../services/country.service';
import {
  CreateCountryDto,
  UpdateCountryDto,
  CountryResponseDto,
} from '../dto/create-country.dto';
import { Country } from '../entities/country.entity';

@Controller('countries')
export class CountryController {
  constructor(private readonly countryService: CountryService) {}

  @Post()
  async create(
    @Body() createCountryDto: CreateCountryDto,
  ): Promise<CountryResponseDto> {
    return this.countryService.createCountry(createCountryDto);
  }

  @Get()
  async findAll(@Query('name') name?: string): Promise<Country[]> {
    if (name) {
      return this.countryService.getCountriesByName(name);
    }
    return this.countryService.getAllCountries();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Country> {
    return this.countryService.getCountryById(+id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCountryDto: UpdateCountryDto,
  ): Promise<CountryResponseDto> {
    return this.countryService.updateCountry(+id, updateCountryDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<Country> {
    return this.countryService.deleteCountry(+id);
  }
}
