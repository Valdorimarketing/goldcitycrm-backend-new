// src/language/language.controller.ts

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  ParseBoolPipe,
} from '@nestjs/common';
import { LanguageService } from './language.service';
import { CreateLanguageDto, UpdateLanguageDto } from './dto/language.dto';
import {
  CreateTranslationKeyDto,
  CreateTranslationDto,
  UpdateTranslationDto,
  BulkCreateTranslationsDto,
  GetTranslationsDto,
} from './dto/translation.dto';

@Controller('languages')
export class LanguageController {
  constructor(private readonly languageService: LanguageService) {}

  // ==================== LANGUAGE ENDPOINTS (Specific routes first!) ====================

  @Post()
  async createLanguage(@Body() createLanguageDto: CreateLanguageDto) {
    return await this.languageService.createLanguage(createLanguageDto);
  }

  @Get()
  async getAllLanguages(@Query('activeOnly', new ParseBoolPipe({ optional: true })) activeOnly?: boolean) {
    return await this.languageService.getAllLanguages(activeOnly || false);
  }

  // Specific routes BEFORE :id param routes
  @Get('default')
  async getDefaultLanguage() {
    return await this.languageService.getDefaultLanguage();
  }

  @Get('code/:code')
  async getLanguageByCode(@Param('code') code: string) {
    return await this.languageService.getLanguageByCode(code);
  }

  // ==================== TRANSLATION KEY ENDPOINTS ====================

  @Post('keys')
  async createTranslationKey(@Body() createTranslationKeyDto: CreateTranslationKeyDto) {
    return await this.languageService.createTranslationKey(createTranslationKeyDto);
  }

  @Get('keys/all')
  async getAllTranslationKeys() {
    return await this.languageService.getAllTranslationKeys();
  }

  @Get('keys/name/:keyName')
  async getTranslationKeyByName(@Param('keyName') keyName: string) {
    return await this.languageService.getTranslationKeyByName(keyName);
  }

  @Get('keys/:id')
  async getTranslationKeyById(@Param('id', ParseIntPipe) id: number) {
    return await this.languageService.getTranslationKeyById(id);
  }

  @Delete('keys/:id')
  async deleteTranslationKey(@Param('id', ParseIntPipe) id: number) {
    await this.languageService.deleteTranslationKey(id);
    return { message: 'Translation key deleted successfully' };
  }

  // ==================== TRANSLATION ENDPOINTS (Specific routes first!) ====================

  @Post('translations')
  async createTranslation(@Body() createTranslationDto: CreateTranslationDto) {
    return await this.languageService.createTranslation(createTranslationDto);
  }

  @Post('translations/bulk')
  async bulkCreateTranslations(@Body() bulkCreateDto: BulkCreateTranslationsDto) {
    return await this.languageService.bulkCreateTranslations(bulkCreateDto);
  }

  @Post('translations/get')
  async getTranslations(@Body() getTranslationsDto: GetTranslationsDto) {
    return await this.languageService.getTranslations(getTranslationsDto);
  }

  @Get('translations/all')
  async getAllTranslationsFormatted() {
    return await this.languageService.getAllTranslationsFormatted();
  }

  // ✅ YENİ: Frontend'in beklediği endpoint
  @Get('translations/keys')
  async getTranslationKeysForFrontend() {
    return await this.languageService.getAllTranslationKeys();
  }

  // ✅ YENİ: Export endpoint
  @Get('translations/export/:code')
  async exportTranslations(@Param('code') code: string) {
    return await this.languageService.exportTranslations(code);
  }

  // ✅ YENİ: Search endpoint
  @Get('translations/search')
  async searchTranslations(
    @Query('query') query: string,
    @Query('languageCode') languageCode?: string,
  ) {
    return await this.languageService.searchTranslations(query, languageCode);
  }

  @Get('translations/language/:languageCode')
  async getTranslationsByLanguage(@Param('languageCode') languageCode: string) {
    return await this.languageService.getTranslationsByLanguage(languageCode);
  }

  @Put('translations/:languageId/:translationKeyId')
  async updateTranslation(
    @Param('languageId', ParseIntPipe) languageId: number,
    @Param('translationKeyId', ParseIntPipe) translationKeyId: number,
    @Body() updateTranslationDto: UpdateTranslationDto,
  ) {
    return await this.languageService.updateTranslation(languageId, translationKeyId, updateTranslationDto);
  }

  @Delete('translations/:languageId/:translationKeyId')
  async deleteTranslation(
    @Param('languageId', ParseIntPipe) languageId: number,
    @Param('translationKeyId', ParseIntPipe) translationKeyId: number,
  ) {
    await this.languageService.deleteTranslation(languageId, translationKeyId);
    return { message: 'Translation deleted successfully' };
  }

  // ==================== GENERIC :id ROUTES (Must be LAST!) ====================

  @Get(':id')
  async getLanguageById(@Param('id', ParseIntPipe) id: number) {
    return await this.languageService.getLanguageById(id);
  }

  @Put(':id')
  async updateLanguage(@Param('id', ParseIntPipe) id: number, @Body() updateLanguageDto: UpdateLanguageDto) {
    return await this.languageService.updateLanguage(id, updateLanguageDto);
  }

  @Delete(':id')
  async deleteLanguage(@Param('id', ParseIntPipe) id: number) {
    await this.languageService.deleteLanguage(id);
    return { message: 'Language deleted successfully' };
  }
}