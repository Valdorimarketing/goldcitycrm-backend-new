import { IsString, IsNumber, IsOptional, IsBoolean, IsObject, ValidateNested, IsEnum, IsNotEmpty } from 'class-validator';
import { Type, Expose } from 'class-transformer';

/**
 * Webhook Event Types
 */
export enum WebhookEventType {
  LEAD_CREATED = 'lead.created',
  LEAD_UPDATED = 'lead.updated',
  LEAD_DELETED = 'lead.deleted',
}

/**
 * Lead Type Enum
 */
export enum LeadType {
  PHONE_CALL = 'phone_call',
  WEB_FORM = 'web_form',
  EMAIL = 'email',
  CHAT = 'chat',
  TEXT_MESSAGE = 'text_message',
  EVENT = 'event',
  TRANSACTION = 'transaction',
  APPOINTMENT = 'appointment',
  OTHER = 'other',
}

/**
 * Lead Data DTO
 */
export class WhatConvertsLeadDto {
  @IsNumber()
  @Expose()
  lead_id: number;

  @IsNumber()
  @Expose()
  account_id: number;

  @IsNumber()
  @Expose()
  profile_id: number;

  @IsOptional()
  @IsString()
  @Expose()
  profile?: string;

  @IsOptional()
  @IsString()
  @Expose()
  user_id?: string;

  @IsOptional()
  @IsString()
  @Expose()
  lead_type?: string;

  @IsOptional()
  @IsString()
  @Expose()
  lead_status?: string;

  @IsOptional()
  @IsString()
  @Expose()
  date_created?: string;

  @IsOptional()
  @IsString()
  @Expose()
  last_updated?: string;

  // İletişim Bilgileri
  @IsOptional()
  @IsString()
  @Expose()
  contact_name?: string;

  @IsOptional()
  @IsString()
  @Expose()
  contact_company_name?: string;

  @IsOptional()
  @IsString()
  @Expose()
  contact_email_address?: string;

  @IsOptional()
  @IsString()
  @Expose()
  contact_phone_number?: string;

  @IsOptional()
  @IsString()
  @Expose()
  email_address?: string;

  @IsOptional()
  @IsString()
  @Expose()
  phone_number?: string;

  // Kaynak Bilgileri
  @IsOptional()
  @IsString()
  @Expose()
  lead_source?: string;

  @IsOptional()
  @IsString()
  @Expose()
  lead_medium?: string;

  @IsOptional()
  @IsString()
  @Expose()
  lead_campaign?: string;

  @IsOptional()
  @IsString()
  @Expose()
  lead_content?: string;

  @IsOptional()
  @IsString()
  @Expose()
  lead_keyword?: string;

  // URL Bilgileri
  @IsOptional()
  @IsString()
  @Expose()
  lead_url?: string;

  @IsOptional()
  @IsString()
  @Expose()
  landing_url?: string;

  // Konum
  @IsOptional()
  @IsString()
  @Expose()
  city?: string;

  @IsOptional()
  @IsString()
  @Expose()
  state?: string;

  @IsOptional()
  @IsString()
  @Expose()
  zip?: string;

  @IsOptional()
  @IsString()
  @Expose()
  country?: string;

  @IsOptional()
  @IsString()
  @Expose()
  ip_address?: string;

  // Telefon Bilgileri
  @IsOptional()
  @IsString()
  @Expose()
  caller_number?: string;

  @IsOptional()
  @IsString()
  @Expose()
  caller_name?: string;

  @IsOptional()
  @IsString()
  @Expose()
  tracking_number?: string;

  @IsOptional()
  @IsNumber()
  @Expose()
  call_duration_seconds?: number;

  @IsOptional()
  @IsString()
  @Expose()
  call_transcription?: string;

  // Form/Message
  @IsOptional()
  @IsString()
  @Expose()
  message?: string;

  @IsOptional()
  @IsString()
  @Expose()
  form_name?: string;

  @IsOptional()
  @IsString()
  @Expose()
  email_subject?: string;

  @IsOptional()
  @IsString()
  @Expose()
  email_message?: string;

  // Değerlendirme
  @IsOptional()
  @IsString()
  @Expose()
  quotable?: string;

  @IsOptional()
  @IsNumber()
  @Expose()
  quote_value?: number;

  @IsOptional()
  @IsNumber()
  @Expose()
  sales_value?: number;

  @IsOptional()
  @IsNumber()
  @Expose()
  lead_score?: number;

  @IsOptional()
  @IsString()
  @Expose()
  lead_state?: string;

  // Spam/Duplicate
  @IsOptional()
  @IsBoolean()
  @Expose()
  spam?: boolean;

  @IsOptional()
  @IsBoolean()
  @Expose()
  duplicate?: boolean;

  // Cihaz Bilgileri
  @IsOptional()
  @IsString()
  @Expose()
  operating_system?: string;

  @IsOptional()
  @IsString()
  @Expose()
  browser?: string;

  @IsOptional()
  @IsString()
  @Expose()
  device_type?: string;

  @IsOptional()
  @IsString()
  @Expose()
  device_make?: string;

  // Entegrasyon ID'leri
  @IsOptional()
  @IsString()
  @Expose()
  gclid?: string;

  @IsOptional()
  @IsString()
  @Expose()
  google_analytics_client_id?: string;

  // Notes
  @IsOptional()
  @IsString()
  @Expose()
  notes?: string;

  // Ek Alanlar
  @IsOptional()
  @IsObject()
  @Expose()
  additional_fields?: Record<string, any>;

  @IsOptional()
  @IsObject()
  @Expose()
  lead_analysis?: Record<string, any>;
}

/**
 * Webhook Payload DTO
 */
export class WhatConvertsWebhookDto {
  @IsOptional()
  @IsEnum(WebhookEventType)
  @Expose()
  event?: WebhookEventType;

  @ValidateNested()
  @Type(() => WhatConvertsLeadDto)
  @Expose()
  lead?: WhatConvertsLeadDto;

  @IsOptional()
  @IsString()
  @Expose()
  timestamp?: string;

  @IsOptional()
  @IsString()
  @Expose()
  webhook_id?: string;

  // WhatConverts bazen lead'i direkt gönderir (event wrapper olmadan)
  // Bu durumda lead_id root seviyede olacak
  @IsOptional()
  @IsNumber()
  @Expose()
  lead_id?: number;

  @IsOptional()
  @IsNumber()
  @Expose()
  account_id?: number;

  @IsOptional()
  @IsNumber()
  @Expose()
  profile_id?: number;
}

/**
 * Webhook Response DTO
 */
export class WebhookResponseDto {
  @Expose()
  success: boolean;

  @Expose()
  message: string;

  @IsOptional()
  @Expose()
  customerId?: number;

  @IsOptional()
  @Expose()
  leadId?: number;

  @IsOptional()
  @Expose()
  action?: 'created' | 'updated' | 'skipped' | 'error';

  @Expose()
  timestamp: Date;
}

/**
 * Mapping Config DTO - Admin panelden ayarlanabilir
 */
export class LeadMappingConfigDto {
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
  skipSpam?: boolean = true;
}

/**
 * Log Query DTO
 */
export class WhatConvertsLogQueryDto {
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
  status?: 'success' | 'error' | 'skipped';

  @IsOptional()
  @IsString()
  leadType?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}