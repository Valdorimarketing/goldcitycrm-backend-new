/**
 * Google Pub/Sub Message Structure
 */
export interface PubSubMessage {
  message: {
    data: string; // Base64 encoded JSON
    messageId: string;
    publishTime: string;
    attributes?: Record<string, string>;
  };
  subscription: string;
}

/**
 * Gmail Watch Notification Data
 * (Pub/Sub message içindeki decoded data)
 */
export interface GmailWatchNotification {
  emailAddress: string;
  historyId: string;
}

/**
 * Gmail Message Structure (Simplified)
 */
export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet: string;
  historyId: string;
  internalDate: string;
  payload: GmailMessagePayload;
  sizeEstimate: number;
  raw?: string; // Base64url encoded
}

/**
 * Gmail Message Payload
 */
export interface GmailMessagePayload {
  partId?: string;
  mimeType: string;
  filename?: string;
  headers: GmailMessageHeader[];
  body?: GmailMessageBody;
  parts?: GmailMessagePayload[];
}

/**
 * Gmail Message Header
 */
export interface GmailMessageHeader {
  name: string;
  value: string;
}

/**
 * Gmail Message Body
 */
export interface GmailMessageBody {
  attachmentId?: string;
  size: number;
  data?: string; // Base64url encoded
}

/**
 * Parsed Email Data
 */
export interface ParsedEmailData {
  messageId: string;
  threadId: string;
  historyId: string;
  from: {
    email: string;
    name: string;
  };
  to: string[];
  subject: string;
  snippet: string;
  body: {
    text: string;
    html: string;
  };
  date: Date;
  labels: string[];
  hasAttachments: boolean;
  attachmentCount: number;
}

/**
 * Gmail Mapping Config
 */
export interface GmailMappingConfig {
  defaultStatusId: number; // Customer status ID
  defaultSourceId: number; // Customer source ID (Gmail)
  defaultUserId?: number; // Auto-assign to user
  autoAssign: boolean; // Otomatik kullanıcıya atama
  skipDuplicates: boolean; // Aynı email ile duplicate kontrolü
  skipInternal: boolean; // İç email'leri (örn: @company.com) atla
  internalDomains: string[]; // İç domain listesi (örn: ['company.com'])
  processOnlyLabels?: string[]; // Sadece belirli label'lı emailleri işle
  excludeLabels?: string[]; // Bu label'lı emailleri atla (SPAM, TRASH vb.)
}

/**
 * Customer Creation Result
 */
export interface CustomerCreationResult {
  success: boolean;
  customerId?: number;
  action: 'created' | 'updated' | 'skipped';
  message: string;
}
