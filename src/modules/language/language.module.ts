import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LanguageController } from './language.controller';
import { LanguageService } from './language.service';
import { Language } from './entities/language.entity';
import { Translation } from './entities/translation.entity';
import { TranslationKey } from './entities/translation-key.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Language, Translation, TranslationKey])],
  controllers: [LanguageController],
  providers: [LanguageService],
  exports: [LanguageService],
})
export class LanguageModule {}