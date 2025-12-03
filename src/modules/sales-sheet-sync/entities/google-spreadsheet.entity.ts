// src/modules/sales-sheet-sync/entities/google-spreadsheet.entity.ts

import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('google_spreadsheets')
export class GoogleSpreadsheet {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  key: string; // unique identifier: "crm_sales", "inventory", "reports" vb.

  @Column({ type: 'varchar', length: 255 })
  spreadsheetId: string; // Google Sheets ID

  @Column({ type: 'varchar', length: 100 })
  name: string; // Görünen ad

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  isReadOnly: boolean; // Sadece okuma mı yoksa yazma da var mı

  @Column({ type: 'timestamp', nullable: true })
  lastSync: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}