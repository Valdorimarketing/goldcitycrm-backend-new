import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateGmailLogTable1234567890123 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // gmail_log tablosunu oluştur
    await queryRunner.createTable(
      new Table({
        name: 'gmail_log',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'message_id',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'thread_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'history_id',
            type: 'bigint',
            isNullable: true,
          },
          {
            name: 'from_email',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'from_name',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'to_email',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'subject',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'snippet',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'body',
            type: 'longtext',
            isNullable: true,
          },
          {
            name: 'email_date',
            type: 'datetime',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['success', 'error', 'skipped', 'duplicate', 'spam', 'processing'],
            default: "'processing'",
          },
          {
            name: 'customer_id',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'raw_pubsub_payload',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'raw_gmail_data',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'message',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'error_detail',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'webhook_ip',
            type: 'varchar',
            length: '45',
            isNullable: true,
          },
          {
            name: 'processing_time_ms',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'retry_count',
            type: 'int',
            default: 0,
          },
          {
            name: 'labels',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'has_attachments',
            type: 'tinyint',
            default: 0,
          },
          {
            name: 'attachment_count',
            type: 'int',
            default: 0,
          },
          {
            name: 'created_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // İndeksleri oluştur
    await queryRunner.createIndex(
      'gmail_log',
      new TableIndex({
        name: 'idx_gmail_log_message_id',
        columnNames: ['message_id'],
      }),
    );

    await queryRunner.createIndex(
      'gmail_log',
      new TableIndex({
        name: 'idx_gmail_log_from_email',
        columnNames: ['from_email'],
      }),
    );

    await queryRunner.createIndex(
      'gmail_log',
      new TableIndex({
        name: 'idx_gmail_log_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'gmail_log',
      new TableIndex({
        name: 'idx_gmail_log_customer_id',
        columnNames: ['customer_id'],
      }),
    );

    await queryRunner.createIndex(
      'gmail_log',
      new TableIndex({
        name: 'idx_gmail_log_created_at',
        columnNames: ['created_at'],
      }),
    );

    // Foreign key - customer tablosuna
    await queryRunner.createForeignKey(
      'gmail_log',
      new TableForeignKey({
        columnNames: ['customer_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'customers',
        onDelete: 'SET NULL',
        name: 'fk_gmail_log_customer',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Foreign key'i sil
    await queryRunner.dropForeignKey('gmail_log', 'fk_gmail_log_customer');

    // Tabloyu sil
    await queryRunner.dropTable('gmail_log');
  }
}
