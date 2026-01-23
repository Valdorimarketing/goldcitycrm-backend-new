import { IsString, IsNumber, IsOptional, IsBoolean, IsObject, IsArray, IsNotEmpty, IsEnum } from 'class-validator';
import { Type, Expose } from 'class-transformer';

/**
 * Pub/Sub Message DTO
 */
export class PubSubMessageDto {
  @IsObject()
  @Expose()
  message: {
    data: string;
    messageId: string;
    publishTime: string;
    attributes?: Record<string, string>;
  };

  @IsString()
  @Expose()
  subscription: string;
}

/**
 * Gmail Watch Notification DTO
 */
export class GmailWatchNotificationDto {
  @IsString()
  @Expose()
  emailAddress: string;

  @IsString()
  @Expose()
  historyId: string;
}

/**
 * Webhook Response DTO
 */
export class GmailWebhookResponseDto {
  @Expose()
  success: boolean;

  @Expose()
  message: string;

  @IsOptional()
  @Expose()
  customerId?: number;

  @IsOptional()
  @Expose()
  messageId?: string;

  @IsOptional()
  @Expose()
  action?: 'created' | 'updated' | 'skipped' | 'error';

  @Expose()
  timestamp: Date;
}

/**
 * Gmail Mapping Config DTO
 */
export class GmailMappingConfigDto {
  @IsNumber()
  @IsNotEmpty()
  @Expose()
  defaultStatusId: number;

  @IsNumber()
  @IsNotEmpty()
  @Expose()
  defaultSourceId: number;

  @IsOptional()
  @IsNumber()
  @Expose()
  defaultUserId?: number;

  @IsOptional()
  @IsBoolean()
  @Expose()
  autoAssign?: boolean = false;

  @IsOptional()
  @IsBoolean()
  @Expose()
  skipDuplicates?: boolean = true;

  @IsOptional()
  @IsBoolean()
  @Expose()
  skipInternal?: boolean = true;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Expose()
  internalDomains?: string[] = [];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Expose()
  processOnlyLabels?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Expose()
  excludeLabels?: string[] = ['SPAM', 'TRASH'];
}

/**
 * Gmail Log Query DTO
 */
export class GmailLogQueryDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  @IsEnum(['success', 'error', 'skipped', 'duplicate', 'spam', 'processing'])
  status?: 'success' | 'error' | 'skipped' | 'duplicate' | 'spam' | 'processing';

  @IsOptional()
  @IsString()
  fromEmail?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}

/**
 * Gmail Watch Setup DTO
 */
export class GmailWatchSetupDto {
  @IsString()
  @IsNotEmpty()
  @Expose()
  topicName: string; // Pub/Sub topic adı (örn: projects/your-project/topics/gmail-notifications)

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Expose()
  labelIds?: string[] = ['INBOX']; // Hangi label'ları izleyeceğiz

  @IsOptional()
  @IsString()
  @Expose()
  labelFilterAction?: 'include' | 'exclude' = 'include';
}
