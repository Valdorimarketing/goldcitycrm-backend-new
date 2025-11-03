import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { CurrencyService } from '../services/currency.service';
import { Currency } from '../entities/currency.entity';

@Controller('currencies')
export class CurrencyController {
  constructor(private readonly currencyService: CurrencyService) {}

  @Get()
  async getAll(): Promise<Currency[]> {
    return this.currencyService.findAll();
  }

  @Get(':id')
  async getOne(@Param('id') id: number): Promise<Currency> {
    return this.currencyService.findOne(id);
  }

  @Post()
  async create(@Body() data: Partial<Currency>): Promise<Currency> {
    return this.currencyService.create(data);
  }

  @Patch(':id')
  async update(@Param('id') id: number, @Body() data: Partial<Currency>): Promise<Currency> {
    return this.currencyService.update(id, data);
  }

  @Delete(':id')
  async remove(@Param('id') id: number): Promise<void> {
    return this.currencyService.delete(id);
  }
}
