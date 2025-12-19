// src/language/language.service.ts

import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Like } from 'typeorm';
import { Language } from './entities/language.entity';
import { Translation } from './entities/translation.entity';
import { TranslationKey } from './entities/translation-key.entity';
import { CreateLanguageDto, UpdateLanguageDto } from './dto/language.dto';
import {
  CreateTranslationKeyDto,
  CreateTranslationDto,
  UpdateTranslationDto,
  BulkCreateTranslationsDto,
  GetTranslationsDto,
} from './dto/translation.dto';

@Injectable()
export class LanguageService {
  constructor(
    @InjectRepository(Language)
    private languageRepository: Repository<Language>,
    @InjectRepository(Translation)
    private translationRepository: Repository<Translation>,
    @InjectRepository(TranslationKey)
    private translationKeyRepository: Repository<TranslationKey>,
  ) {}

  // ==================== LANGUAGE OPERATIONS ====================

  async createLanguage(createLanguageDto: CreateLanguageDto): Promise<Language> {
    const exists = await this.languageRepository.findOne({
      where: { code: createLanguageDto.code },
    });

    if (exists) {
      throw new ConflictException(`Language with code '${createLanguageDto.code}' already exists`);
    }

    // Eğer default olarak işaretleniyorsa, diğerlerini default olmaktan çıkar
    if (createLanguageDto.isDefault) {
      await this.languageRepository.update({ isDefault: true }, { isDefault: false });
    }

    const language = this.languageRepository.create(createLanguageDto);
    return await this.languageRepository.save(language);
  }

  async getAllLanguages(activeOnly: boolean = false): Promise<Language[]> {
    const where = activeOnly ? { isActive: true } : {};
    return await this.languageRepository.find({
      where,
      order: { isDefault: 'DESC', name: 'ASC' },
    });
  }

  async getLanguageById(id: number): Promise<Language> {
    const language = await this.languageRepository.findOne({ where: { id } });
    if (!language) {
      throw new NotFoundException(`Language with ID ${id} not found`);
    }
    return language;
  }

  async getLanguageByCode(code: string): Promise<Language> {
    const language = await this.languageRepository.findOne({ where: { code } });
    if (!language) {
      throw new NotFoundException(`Language with code '${code}' not found`);
    }
    return language;
  }

  async getDefaultLanguage(): Promise<Language> {
    const language = await this.languageRepository.findOne({ where: { isDefault: true } });
    if (!language) {
      // Fallback: TR dilini default yap
      const trLanguage = await this.languageRepository.findOne({ where: { code: 'tr' } });
      if (trLanguage) {
        trLanguage.isDefault = true;
        return await this.languageRepository.save(trLanguage);
      }
      throw new NotFoundException('No default language found');
    }
    return language;
  }

  async updateLanguage(id: number, updateLanguageDto: UpdateLanguageDto): Promise<Language> {
    const language = await this.getLanguageById(id);

    // Eğer default olarak işaretleniyorsa, diğerlerini default olmaktan çıkar
    if (updateLanguageDto.isDefault === true) {
      await this.languageRepository.update({ isDefault: true }, { isDefault: false });
    }

    Object.assign(language, updateLanguageDto);
    return await this.languageRepository.save(language);
  }

  async deleteLanguage(id: number): Promise<void> {
    const language = await this.getLanguageById(id);

    if (language.isDefault) {
      throw new BadRequestException('Cannot delete the default language');
    }

    await this.languageRepository.delete(id);
  }

  // ==================== TRANSLATION KEY OPERATIONS ====================

  async createTranslationKey(createTranslationKeyDto: CreateTranslationKeyDto): Promise<TranslationKey> {
    const exists = await this.translationKeyRepository.findOne({
      where: { keyName: createTranslationKeyDto.keyName },
    });

    if (exists) {
      throw new ConflictException(`Translation key '${createTranslationKeyDto.keyName}' already exists`);
    }

    const translationKey = this.translationKeyRepository.create(createTranslationKeyDto);
    return await this.translationKeyRepository.save(translationKey);
  }

  async getAllTranslationKeys(): Promise<TranslationKey[]> {
    return await this.translationKeyRepository.find({
      order: { keyName: 'ASC' },
    });
  }

  async getTranslationKeyById(id: number): Promise<TranslationKey> {
    const key = await this.translationKeyRepository.findOne({ where: { id } });
    if (!key) {
      throw new NotFoundException(`Translation key with ID ${id} not found`);
    }
    return key;
  }

  async getTranslationKeyByName(keyName: string): Promise<TranslationKey> {
    const key = await this.translationKeyRepository.findOne({ where: { keyName } });
    if (!key) {
      throw new NotFoundException(`Translation key '${keyName}' not found`);
    }
    return key;
  }

  async deleteTranslationKey(id: number): Promise<void> {
    await this.getTranslationKeyById(id);
    await this.translationKeyRepository.delete(id);
  }

  // ==================== TRANSLATION OPERATIONS ====================

  async createTranslation(createTranslationDto: CreateTranslationDto): Promise<Translation> {
    // Check if language exists
    await this.getLanguageById(createTranslationDto.languageId);

    // Check if translation key exists
    await this.getTranslationKeyById(createTranslationDto.translationKeyId);

    // Check if translation already exists
    const exists = await this.translationRepository.findOne({
      where: {
        languageId: createTranslationDto.languageId,
        translationKeyId: createTranslationDto.translationKeyId,
      },
    });

    if (exists) {
      throw new ConflictException('Translation already exists for this language and key');
    }

    const translation = this.translationRepository.create(createTranslationDto);
    return await this.translationRepository.save(translation);
  }

  async updateTranslation(
    languageId: number,
    translationKeyId: number,
    updateTranslationDto: UpdateTranslationDto,
  ): Promise<Translation> {
    let translation = await this.translationRepository.findOne({
      where: { languageId, translationKeyId },
    });

    if (!translation) {
      // Translation doesn't exist, create it (upsert behavior)
      translation = this.translationRepository.create({
        languageId,
        translationKeyId,
        value: updateTranslationDto.value,
      });
    } else {
      // Translation exists, update it
      Object.assign(translation, updateTranslationDto);
    }

    return await this.translationRepository.save(translation);
  }

  async deleteTranslation(languageId: number, translationKeyId: number): Promise<void> {
    const translation = await this.translationRepository.findOne({
      where: { languageId, translationKeyId },
    });

    if (!translation) {
      throw new NotFoundException('Translation not found');
    }

    await this.translationRepository.delete(translation.id);
  }

  // ==================== BULK OPERATIONS ====================

  async bulkCreateTranslations(bulkCreateDto: BulkCreateTranslationsDto): Promise<any> {
    const results = [];

    for (const item of bulkCreateDto.items) {
      try {
        // Create or get translation key
        let translationKey = await this.translationKeyRepository.findOne({
          where: { keyName: item.keyName },
        });

        if (!translationKey) {
          translationKey = await this.translationKeyRepository.save({
            keyName: item.keyName,
            description: item.description,
          });
        }

        // Create translations for each language
        for (const [langCode, value] of Object.entries(item.translations)) {
          const language = await this.languageRepository.findOne({ where: { code: langCode } });

          if (!language) {
            results.push({
              key: item.keyName,
              language: langCode,
              success: false,
              error: `Language '${langCode}' not found`,
            });
            continue;
          }

          // Check if translation exists
          const existingTranslation = await this.translationRepository.findOne({
            where: {
              languageId: language.id,
              translationKeyId: translationKey.id,
            },
          });

          if (existingTranslation) {
            // Update existing
            existingTranslation.value = value;
            await this.translationRepository.save(existingTranslation);
            results.push({
              key: item.keyName,
              language: langCode,
              success: true,
              action: 'updated',
            });
          } else {
            // Create new
            await this.translationRepository.save({
              languageId: language.id,
              translationKeyId: translationKey.id,
              value,
            });
            results.push({
              key: item.keyName,
              language: langCode,
              success: true,
              action: 'created',
            });
          }
        }
      } catch (error) {
        results.push({
          key: item.keyName,
          success: false,
          error: error.message,
        });
      }
    }

    return {
      total: bulkCreateDto.items.length,
      results,
    };
  }

  // ==================== GET TRANSLATIONS ====================

  async getTranslations(getTranslationsDto: GetTranslationsDto): Promise<any> {
    const { languageCode, keys } = getTranslationsDto;

    // Get language
    let language: Language;
    if (languageCode) {
      language = await this.getLanguageByCode(languageCode);
    } else {
      language = await this.getDefaultLanguage();
    }

    // Build query
    const queryBuilder = this.translationRepository
      .createQueryBuilder('translation')
      .leftJoinAndSelect('translation.translationKey', 'translationKey')
      .where('translation.languageId = :languageId', { languageId: language.id });

    if (keys && keys.length > 0) {
      queryBuilder.andWhere('translationKey.keyName IN (:...keys)', { keys });
    }

    const translations = await queryBuilder.getMany();

    // Format response
    const formatted: Record<string, string> = {};
    translations.forEach((translation) => {
      formatted[translation.translationKey.keyName] = translation.value;
    });

    return {
      language: {
        code: language.code,
        name: language.name,
      },
      translations: formatted,
    };
  }

  async getAllTranslationsFormatted(): Promise<any> {
    const languages = await this.getAllLanguages(true);
    const translationKeys = await this.getAllTranslationKeys();

    const result: any = {};

    for (const language of languages) {
      result[language.code] = {};

      for (const key of translationKeys) {
        const translation = await this.translationRepository.findOne({
          where: {
            languageId: language.id,
            translationKeyId: key.id,
          },
        });

        result[language.code][key.keyName] = translation ? translation.value : '';
      }
    }

    return result;
  }

  async getTranslationsByLanguage(languageCode: string): Promise<any> {
    const language = await this.getLanguageByCode(languageCode);

    const translations = await this.translationRepository
      .createQueryBuilder('translation')
      .leftJoinAndSelect('translation.translationKey', 'translationKey')
      .where('translation.languageId = :languageId', { languageId: language.id })
      .getMany();

    const formatted: Record<string, string> = {};
    translations.forEach((translation) => {
      formatted[translation.translationKey.keyName] = translation.value;
    });

    return {
      language: {
        code: language.code,
        name: language.name,
      },
      translations: formatted,
    };
  }

  // ✅ YENİ: Export translations
  async exportTranslations(languageCode: string): Promise<any> {
    return await this.getTranslationsByLanguage(languageCode);
  }

  // ✅ YENİ: Search translations
  async searchTranslations(query: string, languageCode?: string): Promise<any[]> {
    const queryBuilder = this.translationKeyRepository
      .createQueryBuilder('key')
      .leftJoinAndSelect('key.translations', 'translation')
      .leftJoinAndSelect('translation.language', 'language');

    // Search by key name or description
    queryBuilder.where(
      'key.keyName LIKE :query OR key.description LIKE :query',
      { query: `%${query}%` },
    );

    // Filter by language if provided
    if (languageCode) {
      queryBuilder.andWhere('language.code = :code', { code: languageCode });
    }

    const keys = await queryBuilder.getMany();

    return keys.map((key) => ({
      id: key.id,
      keyName: key.keyName,
      description: key.description,
      translations: key.translations?.reduce(
        (acc, t) => {
          if (t.language) {
            acc[t.language.code] = t.value;
          }
          return acc;
        },
        {} as Record<string, string>,
      ) || {},
    }));
  }
}