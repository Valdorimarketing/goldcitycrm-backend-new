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
  PROCESSING = 'processing',
}

/**
 * Gmail Webhook Log Entity
 */
@Entity('gmail_log')
export class GmailLog {
  @PrimaryGeneratedColumn()
  @Expose()
  id: number;

  // Gmail mesaj ID (unique)
  @Column({ type: 'varchar', length: 255, name: 'message_id' })
  @Index('idx_gmail_log_message_id')
  @Expose()
  messageId: string;

  // Gmail thread ID
  @Column({ type: 'varchar', length: 255, name: 'thread_id', nullable: true })
  @Expose()
  threadId: string;

  // Gmail history ID (watch için)
  @Column({ type: 'bigint', name: 'history_id', nullable: true })
  @Expose()
  historyId: string;

  // Email gönderen
  @Column({ type: 'varchar', length: 255, name: 'from_email', nullable: true })
  @Index('idx_gmail_log_from_email')
  @Expose()
  fromEmail: string;

  @Column({ type: 'varchar', length: 255, name: 'from_name', nullable: true })
  @Expose()
  fromName: string;

  // Email alıcı
  @Column({ type: 'varchar', length: 255, name: 'to_email', nullable: true })
  @Expose()
  toEmail: string;

  // Email konusu
  @Column({ type: 'text', name: 'subject', nullable: true })
  @Expose()
  subject: string;

  // Email içeriği (snippet)
  @Column({ type: 'text', name: 'snippet', nullable: true })
  @Expose()
  snippet: string;

  // Email tam içeriği (HTML veya plain text)
  @Column({ type: 'longtext', name: 'body', nullable: true })
  @Expose()
  body: string;

  // Email gönderim tarihi
  @Column({ type: 'datetime', name: 'email_date', nullable: true })
  @Expose()
  emailDate: Date;

  // İşlem durumu
  @Column({
    type: 'enum',
    enum: WebhookLogStatus,
    default: WebhookLogStatus.PROCESSING,
  })
  @Index('idx_gmail_log_status')
  @Expose()
  status: WebhookLogStatus;

  // Oluşturulan customer ID
  @Column({ type: 'int', name: 'customer_id', nullable: true })
  @Index('idx_gmail_log_customer_id')
  @Expose()
  customerId: number;

  @ManyToOne(() => Customer, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  // Raw Google Pub/Sub payload
  @Column({ type: 'json', name: 'raw_pubsub_payload', nullable: true })
  @Expose()
  rawPubsubPayload: Record<string, any>;

  // Raw Gmail mesaj verisi
  @Column({ type: 'json', name: 'raw_gmail_data', nullable: true })
  @Expose()
  rawGmailData: Record<string, any>;

  // İşlem mesajı
  @Column({ type: 'text', nullable: true })
  @Expose()
  message: string;

  // Hata detayı
  @Column({ type: 'text', name: 'error_detail', nullable: true })
  @Expose()
  errorDetail: string;

  // Webhook IP (Pub/Sub request IP)
  @Column({ type: 'varchar', length: 45, name: 'webhook_ip', nullable: true })
  @Expose()
  webhookIp: string;

  // İşlem süresi (ms)
  @Column({ type: 'int', name: 'processing_time_ms', nullable: true })
  @Expose()
  processingTimeMs: number;

  // Tekrar deneme sayısı
  @Column({ type: 'int', name: 'retry_count', default: 0 })
  @Expose()
  retryCount: number;

  // Email etiketleri (labels)
  @Column({ type: 'json', name: 'labels', nullable: true })
  @Expose()
  labels: string[];

  // Attachment var mı?
  @Column({ type: 'boolean', name: 'has_attachments', default: false })
  @Expose()
  hasAttachments: boolean;

  // Attachment sayısı
  @Column({ type: 'int', name: 'attachment_count', default: 0 })
  @Expose()
  attachmentCount: number;

  @CreateDateColumn({ name: 'created_at' })
  @Index('idx_gmail_log_created_at')
  @Expose()
  createdAt: Date;

  constructor(partial?: Partial<GmailLog>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }
}
