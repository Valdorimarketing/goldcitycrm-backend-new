import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CountryController } from './controllers/country.controller';
import { Country } from './entities/country.entity';
import { CountryRepository } from './repositories/country.repository';
import { CountryService } from './services/country.service';

@Module({
  imports: [TypeOrmModule.forFeature([Country])],
  controllers: [CountryController],
  providers: [CountryService, CountryRepository],
  exports: [CountryService, CountryRepository],
})
export class CountryModule {} 