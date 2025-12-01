// whatconverts-log.entity.ts - Güncellenmiş versiyon

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Expose } from 'class-transformer';
import { Customer } from '../../customer/entities/customer.entity';

/**
 * Webhook işlem durumu
 */
export enum WebhookLogStatus {
  SUCCESS = 'success',
  ERROR = 'error',
  SKIPPED = 'skipped',
  DUPLICATE = 'duplicate',
  SPAM = 'spam',
}

/**
 * WhatConverts Webhook Log Entity
 */
@Entity('whatconverts_log')
export class WhatConvertsLog {
  @PrimaryGeneratedColumn()
  @Expose()
  id: number;

  @Column({ type: 'int', name: 'lead_id' })
  @Index('idx_wc_log_lead_id')
  @Expose()
  leadId: number;

  @Column({ type: 'int', name: 'account_id', nullable: true })
  @Expose()
  accountId: number;

  @Column({ type: 'int', name: 'profile_id', nullable: true })
  @Expose()
  profileId: number;

  @Column({ type: 'varchar', length: 50, name: 'lead_type', nullable: true })
  @Expose()
  leadType: string;

  @Column({ type: 'varchar', length: 50, name: 'event_type', nullable: true })
  @Expose()
  eventType: string;

  @Column({
    type: 'enum',
    enum: WebhookLogStatus,
    default: WebhookLogStatus.SUCCESS,
  })
  @Index('idx_wc_log_status')
  @Expose()
  status: WebhookLogStatus;

  @Column({ type: 'int', name: 'customer_id', nullable: true })
  @Index('idx_wc_log_customer_id')
  @Expose()
  customerId: number;

  @ManyToOne(() => Customer, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ type: 'json', name: 'raw_payload', nullable: true })
  @Expose()
  rawPayload: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  @Expose()
  message: string;

  @Column({ type: 'text', name: 'error_detail', nullable: true })
  @Expose()
  errorDetail: string;

  @Column({ type: 'varchar', length: 255, name: 'contact_phone', nullable: true })
  @Expose()
  contactPhone: string;

  @Column({ type: 'varchar', length: 255, name: 'contact_email', nullable: true })
  @Expose()
  contactEmail: string;

  @Column({ type: 'varchar', length: 255, name: 'contact_name', nullable: true })
  @Expose()
  contactName: string;

  @Column({ type: 'varchar', length: 100, name: 'lead_source', nullable: true })
  @Expose()
  leadSource: string;

  @Column({ type: 'varchar', length: 100, name: 'lead_medium', nullable: true })
  @Expose()
  leadMedium: string;

  @Column({ type: 'varchar', length: 255, name: 'lead_campaign', nullable: true })
  @Expose()
  leadCampaign: string;

  @Column({ type: 'text', name: 'lead_url', nullable: true })
  @Expose()
  leadUrl: string;

  @Column({ type: 'text', name: 'landing_url', nullable: true })
  @Expose()
  landingUrl: string;

  @Column({ type: 'varchar', length: 45, name: 'webhook_ip', nullable: true })
  @Expose()
  webhookIp: string;

  @Column({ type: 'int', name: 'processing_time_ms', nullable: true })
  @Expose()
  processingTimeMs: number;

  @Column({ type: 'int', name: 'retry_count', default: 0 })
  @Expose()
  retryCount: number;

  @CreateDateColumn({ name: 'created_at' })
  @Index('idx_wc_log_created_at')
  @Expose()
  createdAt: Date;

  constructor(partial?: Partial<WhatConvertsLog>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }
}