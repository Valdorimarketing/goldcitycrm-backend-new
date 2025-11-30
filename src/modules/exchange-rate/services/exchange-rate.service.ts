import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Currency } from 'src/modules/currencies/entities/currency.entity';

// Export edilen interface'ler
export interface ExchangeRates {
  [key: string]: number;
}

export interface CachedRates {
  rates: ExchangeRates;
  lastUpdated: Date;
  baseCurrency: string;
}

export interface ExchangeRatesResponse {
  rates: ExchangeRates;
  lastUpdated: Date;
  baseCurrency: string;
}

@Injectable()
export class ExchangeRateService {
  private readonly logger = new Logger(ExchangeRateService.name);
  
  // In-memory cache
  private cachedRates: CachedRates | null = null;
  
  // Cache süresi: 12 saat (milisaniye)
  private readonly CACHE_DURATION = 12 * 60 * 60 * 1000;
  
  // Base currency (tüm kurlar buna göre hesaplanır) - USD
  private readonly BASE_CURRENCY = 'USD';

  constructor(
    private readonly httpService: HttpService,
    @InjectRepository(Currency)
    private readonly currencyRepository: Repository<Currency>,
  ) {
    // Uygulama başladığında kurları çek
    this.initializeRates();
  }

  /**
   * Uygulama başladığında kurları yükle
   */
  private async initializeRates(): Promise<void> {
    try {
      await this.fetchAndCacheRates();
      this.logger.log('Exchange rates initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize exchange rates', error);
    }
  }

  /**
   * Her gün saat 09:00 ve 15:00'te kurları güncelle
   * Türkiye saati için UTC+3 = 06:00 ve 12:00 UTC
   */
  @Cron('0 6,12 * * *') // UTC 06:00 ve 12:00 = TR 09:00 ve 15:00
  async scheduledRateUpdate(): Promise<void> {
    this.logger.log('Scheduled exchange rate update started');
    await this.fetchAndCacheRates();
  }

  /**
   * Döviz kurlarını API'den çeker ve cache'ler
   * Frankfurter.app - Tamamen ücretsiz, limitsiz, kayıt gerektirmez
   * Kurlar USD bazında hesaplanır (1 EUR = X USD, 1 TRY = X USD)
   */
  async fetchAndCacheRates(): Promise<CachedRates> {
    try {
      // Frankfurter.app API - USD bazlı kurları çek
      const response = await firstValueFrom(
        this.httpService.get('https://api.frankfurter.app/latest', {
          params: {
            from: 'USD',
            to: 'EUR,TRY,GBP'
          },
          timeout: 10000
        })
      );

      const data = response.data;
      
      // USD bazlı kurlar: 1 USD = X EUR/TRY/GBP
      // Biz ters istiyoruz: 1 EUR/TRY/GBP = X USD
      const ratesInUsd: ExchangeRates = {
        USD: 1,
        EUR: 1 / (data.rates.EUR || 0.92), // 1 EUR = ~1.09 USD
        TRY: 1 / (data.rates.TRY || 34.5), // 1 TRY = ~0.029 USD
        GBP: 1 / (data.rates.GBP || 0.79), // 1 GBP = ~1.27 USD
      };

      this.cachedRates = {
        rates: ratesInUsd,
        lastUpdated: new Date(),
        baseCurrency: this.BASE_CURRENCY,
      };

      // Veritabanındaki currency tablosunu da güncelle
      await this.updateDatabaseRates(ratesInUsd);

      this.logger.log(`Exchange rates updated (USD base): EUR=${ratesInUsd.EUR.toFixed(4)}, TRY=${ratesInUsd.TRY.toFixed(4)}, GBP=${ratesInUsd.GBP.toFixed(4)}`);

      return this.cachedRates;
    } catch (error) {
      this.logger.error('Failed to fetch exchange rates from primary API, trying fallback...', error);
      
      // Fallback: exchangerate.host (ücretsiz, kayıt gerektirmez)
      return this.fetchFromFallbackApi();
    }
  }

  /**
   * Fallback API - exchangerate.host
   */
  private async fetchFromFallbackApi(): Promise<CachedRates> {
    try {
      const response = await firstValueFrom(
        this.httpService.get('https://api.exchangerate.host/latest', {
          params: {
            base: 'USD',
            symbols: 'EUR,TRY,GBP'
          },
          timeout: 10000
        })
      );

      const data = response.data;
      
      // USD bazlı kurlar - ters çevir
      const ratesInUsd: ExchangeRates = {
        USD: 1,
        EUR: 1 / (data.rates?.EUR || 0.92),
        TRY: 1 / (data.rates?.TRY || 34.5),
        GBP: 1 / (data.rates?.GBP || 0.79),
      };

      this.cachedRates = {
        rates: ratesInUsd,
        lastUpdated: new Date(),
        baseCurrency: this.BASE_CURRENCY,
      };

      await this.updateDatabaseRates(ratesInUsd);

      this.logger.log(`Exchange rates updated from fallback API (USD base)`);

      return this.cachedRates;
    } catch (error) {
      this.logger.error('Fallback API also failed, using last cached or default rates', error);
      
      // Her iki API de başarısız olursa, varsayılan değerler kullan
      if (!this.cachedRates) {
        this.cachedRates = {
          rates: {
            USD: 1,
            EUR: 1.09,    // 1 EUR = ~1.09 USD
            TRY: 0.029,   // 1 TRY = ~0.029 USD
            GBP: 1.27,    // 1 GBP = ~1.27 USD
          },
          lastUpdated: new Date(),
          baseCurrency: this.BASE_CURRENCY,
        };
      }
      
      return this.cachedRates;
    }
  }

  /**
   * Veritabanındaki currency tablosunu güncelle
   */
  private async updateDatabaseRates(rates: ExchangeRates): Promise<void> {
    try {
      for (const [code, rate] of Object.entries(rates)) {
        await this.currencyRepository.update(
          { code },
          { rateToTRY: rate } // number olarak gönder, string değil
        );
      }
    } catch (error) {
      this.logger.error('Failed to update database rates', error);
    }
  }

  /**
   * Mevcut kurları döndürür (cache'den veya yeniden çeker)
   */
  async getRates(): Promise<CachedRates> {
    // Cache yoksa veya süresi dolmuşsa yeniden çek
    if (!this.cachedRates || this.isCacheExpired()) {
      return this.fetchAndCacheRates();
    }
    return this.cachedRates;
  }

  /**
   * Cache süresi dolmuş mu kontrol et
   */
  private isCacheExpired(): boolean {
    if (!this.cachedRates) return true;
    const now = new Date().getTime();
    const lastUpdated = this.cachedRates.lastUpdated.getTime();
    return (now - lastUpdated) > this.CACHE_DURATION;
  }

  /**
   * Belirli bir para birimini USD'ye çevirir
   */
  async convertToUsd(amount: number, fromCurrency: string): Promise<number> {
    const rates = await this.getRates();
    const rate = rates.rates[fromCurrency] || 1;
    return amount * rate;
  }

  /**
   * Birden fazla para birimindeki tutarları USD'ye çevirip toplar
   */
  async calculateGrandTotalInUsd(amounts: { [currency: string]: number }): Promise<{
    grandTotalUsd: number;
    convertedAmounts: { [currency: string]: { original: number; inUsd: number; rate: number } };
    rates: ExchangeRates;
    lastUpdated: Date;
  }> {
    const ratesData = await this.getRates();
    const rates = ratesData.rates;
    
    let grandTotalUsd = 0;
    const convertedAmounts: { [currency: string]: { original: number; inUsd: number; rate: number } } = {};

    for (const [currency, amount] of Object.entries(amounts)) {
      const rate = rates[currency] || 1;
      const inUsd = amount * rate;
      
      convertedAmounts[currency] = {
        original: amount,
        inUsd,
        rate,
      };
      
      grandTotalUsd += inUsd;
    }

    return {
      grandTotalUsd,
      convertedAmounts,
      rates,
      lastUpdated: ratesData.lastUpdated,
    };
  }

  /**
   * Sadece kurları döndürür (frontend için)
   */
  async getExchangeRatesForFrontend(): Promise<ExchangeRatesResponse> {
    const ratesData = await this.getRates();
    return {
      rates: ratesData.rates,
      lastUpdated: ratesData.lastUpdated,
      baseCurrency: ratesData.baseCurrency,
    };
  }

  /**
   * Kurları manuel olarak güncelle (admin endpoint için)
   */
  async forceRefreshRates(): Promise<CachedRates> {
    this.logger.log('Force refreshing exchange rates...');
    return this.fetchAndCacheRates();
  }
}