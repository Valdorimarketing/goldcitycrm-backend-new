/**
 * WhatConverts API'den gelen lead verisi yapısı
 * Referans: https://www.whatconverts.com/api/leads/
 */
export interface WhatConvertsLead {
  // Temel Kimlik Bilgileri
  account_id: number;
  profile_id: number;
  profile: string;
  lead_id: number;
  user_id: string;

  // Lead Tipi ve Durumu
  lead_type: WhatConvertsLeadType;
  lead_status: 'Repeat' | 'Unique';
  date_created: string; // ISO 8601 format
  last_updated: string;

  // Değerlendirme
  quotable: 'Yes' | 'No' | 'Pending' | 'Not Set';
  quote_value: number;
  sales_value: number;
  spotted_keywords: string;
  lead_score: number;
  lead_state: string;

  // Spam/Duplicate Kontrolü
  spam: boolean;
  duplicate: boolean;

  // Kaynak Bilgileri (UTM)
  lead_source: string;
  lead_medium: string;
  lead_campaign: string;
  lead_content: string;
  lead_keyword: string;

  // URL Bilgileri
  lead_url: string;
  landing_url: string;

  // Cihaz Bilgileri
  operating_system: string;
  browser: string;
  device_type: string;
  device_make: string;
  ip_address: string;

  // İletişim Bilgileri
  contact_name: string;
  contact_company_name: string;
  contact_email_address: string;
  contact_phone_number: string;
  email_address: string;
  phone_number: string;

  // Konum Bilgileri
  city: string;
  state: string;
  zip: string;
  country: string;

  // Telefon Araması Bilgileri (phone_call tipi için)
  tracking_number?: string;
  destination_number?: string;
  caller_number?: string;
  caller_name?: string;
  call_duration?: string;
  call_duration_seconds?: number;
  answer_status?: 'Answered' | 'No Answer' | 'Busy';
  call_status?: 'In Progress' | 'Completed';
  line_type?: string;
  phone_name?: string;
  recording?: string;
  play_recording?: string;
  voicemail?: string;
  play_voicemail?: string;
  call_transcription?: string;
  voicemail_transcription?: string;

  // SMS Bilgileri (text_message tipi için)
  message?: string;

  // Chat Bilgileri (chat tipi için)
  chat_status?: 'In Progress' | 'Completed';

  // Event Bilgileri (event tipi için)
  event_category?: string;
  event_action?: string;
  event_label?: string;

  // Transaction Bilgileri (transaction tipi için)
  transaction_id?: string;
  transaction_tax?: number;
  transaction_shipping?: number;

  // Email Bilgileri (email tipi için)
  sender_name?: string;
  email_subject?: string;
  email_message?: string;

  // Form Bilgileri (web_form tipi için)
  form_name?: string;

  // Entegrasyon ID'leri
  gclid?: string;
  msclkid?: string;
  unbounce_page_id?: string;
  unbounce_variant_id?: string;
  unbounce_visitor_id?: string;
  salesforce_user_id?: number;
  roistat_visit_id?: string;
  hubspot_visitor_id?: string;
  facebook_browser_id?: string;
  facebook_click_id?: string;
  vwo_account_id?: string;
  vwo_experiment_id?: string;
  vwo_variant_id?: string;
  vwo_user_id?: string;
  google_analytics_client_id?: string;

  // Ek Alanlar
  notes?: string;
  additional_fields?: Record<string, any>;
  field_mappings?: Record<string, any>;

  // AI Analiz (varsa)
  lead_analysis?: {
    'Keyword Detection'?: string;
    'Lead Summary'?: string;
    'Intent Detection'?: string;
    'Sentiment Detection'?: string;
    'Topic Detection'?: string;
  };

  // Customer Journey (Elite plan)
  customer_journey?: WhatConvertsCustomerJourney[];
}

export type WhatConvertsLeadType =
  | 'appointment'
  | 'chat'
  | 'email'
  | 'event'
  | 'other'
  | 'phone_call'
  | 'text_message'
  | 'transaction'
  | 'web_form'
  | 'Phone Call'
  | 'Web Form'
  | 'Email'
  | 'Chat'
  | 'Text Message'
  | 'Event'
  | 'Transaction'
  | 'Appointment'
  | 'Other';

export interface WhatConvertsCustomerJourney {
  type: 'attribution' | 'lead';
  date_created: string;
  lead_source?: string;
  lead_medium?: string;
  lead_campaign?: string;
  lead_content?: string;
  lead_keyword?: string;
  lead_id?: number;
  lead_type?: string;
  lead_url?: string;
  page_views?: {
    order: number;
    page_url: string;
  }[];
}

/**
 * Webhook payload yapısı
 */
export interface WhatConvertsWebhookPayload {
  event: 'lead.created' | 'lead.updated' | 'lead.deleted';
  lead: WhatConvertsLead;
  timestamp: string;
  webhook_id?: string;
}

/**
 * API List Response
 */
export interface WhatConvertsApiResponse {
  page_number: number;
  leads_per_page: number;
  total_pages: number;
  total_leads: number;
  leads: WhatConvertsLead[];
}

/**
 * Lead -> Customer mapping config
 */
export interface LeadMappingConfig {
  defaultStatusId: number;
  defaultSourceId: number;
  defaultUserId?: number;
  autoAssign: boolean;
  skipDuplicates: boolean;
  skipSpam: boolean;
}

/**
 * Webhook işlem sonucu
 */
export interface WebhookProcessResult {
  success: boolean;
  customerId?: number;
  leadId: number;
  action: 'created' | 'updated' | 'skipped' | 'error';
  message: string;
  timestamp: Date;
}