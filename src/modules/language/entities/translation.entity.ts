import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Language } from './language.entity';
import { TranslationKey } from './translation-key.entity';

@Entity('translations')
export class Translation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'language_id' })
  languageId: number;

  @Column({ name: 'translation_key_id' })
  translationKeyId: number;

  @Column({ type: 'text' })
  value: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Language, language => language.translations)
  @JoinColumn({ name: 'language_id' })
  language: Language;

  @ManyToOne(() => TranslationKey, translationKey => translationKey.translations)
  @JoinColumn({ name: 'translation_key_id' })
  translationKey: TranslationKey;
}