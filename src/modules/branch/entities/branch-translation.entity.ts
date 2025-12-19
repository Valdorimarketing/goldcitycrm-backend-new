import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { CustomBaseEntity } from '../../../core/base/entities/base.entity';
import { Branch } from './branch.entity';
import { Language } from '../../language/entities/language.entity';

@Entity('branch_translations')
@Index(['branchId', 'languageId'], { unique: true })
export class BranchTranslation extends CustomBaseEntity {
  @Column({ name: 'branch_id' })
  branchId: number;

  @Column({ name: 'language_id' })
  languageId: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @ManyToOne(() => Branch, (branch) => branch.translations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @ManyToOne(() => Language, { eager: true })
  @JoinColumn({ name: 'language_id' })
  language: Language;
}