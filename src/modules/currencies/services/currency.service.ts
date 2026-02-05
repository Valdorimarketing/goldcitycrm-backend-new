import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Currency } from '../entities/currency.entity';

@Injectable()
export class CurrencyService implements OnModuleInit {
  private readonly logger = new Logger(CurrencyService.name);

  constructor(
    @InjectRepository(Currency)
    private readonly currencyRepo: Repository<Currency>,
  ) {}

  // 🌱 Seed işlemi (modül ilk yüklendiğinde)
  async onModuleInit() {
    const count = await this.currencyRepo.count();
    if (count === 0) {
      this.logger.log('Currency table is empty. Seeding default currencies...');
      await this.currencyRepo.save([
        { code: 'TRY', name: 'Türk Lirası', rateToTRY: 1 },
        { code: 'USD', name: 'Amerikan Doları', rateToTRY: 35.2 },
        { code: 'EUR', name: 'Euro', rateToTRY: 38.5 },
        { code: 'GBP', name: 'İngiliz Sterlini', rateToTRY: 44.0 },
      ]);
      this.logger.log('✅ Default currencies (TRY, USD, EUR, GBP) successfully seeded.');
    } else {
      this.logger.log('✅ Currency table already seeded.');
    }
  }

  async findAll(): Promise<Currency[]> {
    return this.currencyRepo.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Currency> {
    const currency = await this.currencyRepo.findOne({ where: { id } });
    if (!currency) throw new NotFoundException('Currency not found');
    return currency;
  }

  async create(data: Partial<Currency>): Promise<Currency> {
    const newCurrency = this.currencyRepo.create(data);
    return this.currencyRepo.save(newCurrency);
  }

  async update(id: number, data: Partial<Currency>): Promise<Currency> {
    const currency = await this.findOne(id);
    Object.assign(currency, data);
    return this.currencyRepo.save(currency);
  }

  async delete(id: number): Promise<void> {
    await this.currencyRepo.delete(id);
  }
}
