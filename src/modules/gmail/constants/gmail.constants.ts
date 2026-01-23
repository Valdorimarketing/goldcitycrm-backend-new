/**
 * Gmail Module Constants
 * 
 * Source detection patterns ve diğer sabit değerler
 */

export interface SourcePattern {
  patterns: string[];
  sourceIdEnv: string;
  description?: string;
}

export interface SourcePatternConfig {
  [key: string]: SourcePattern;
}

/**
 * Email subject'inden source belirleme için pattern'ler
 */
export const SOURCE_PATTERNS: SourcePatternConfig = {
  facebook: {
    patterns: [
      'drguderhair',
      'dr guduer',
      'dr güduer',
      'guduer',
      'güduer',
      'gc tr datalar',
      'facebook',
      'fb form',
    ],
    sourceIdEnv: 'GMAIL_FACEBOOK_SOURCE_ID',
    description: 'Facebook form submissions',
  },

  googleForm: {
    patterns: [
      'new form submission',
      'form submission',
      'google form',
      'google forms',
    ],
    sourceIdEnv: 'GMAIL_GOOGLE_FORM_SOURCE_ID',
    description: 'Google Forms submissions',
  },

  instagram: {
    patterns: [
      'instagram',
      'dm from instagram',
      'instagram message',
      'ig message',
    ],
    sourceIdEnv: 'GMAIL_INSTAGRAM_SOURCE_ID',
    description: 'Instagram DM submissions',
  },

  whatsapp: {
    patterns: [
      'whatsapp',
      'whatsapp business',
      'wa message',
      'whatsapp message',
    ],
    sourceIdEnv: 'GMAIL_WHATSAPP_SOURCE_ID',
    description: 'WhatsApp Business messages',
  },

  website: {
    patterns: [
      'website contact',
      'web form',
      'contact form',
      'inquiry from website',
    ],
    sourceIdEnv: 'GMAIL_WEBSITE_SOURCE_ID',
    description: 'Website contact form',
  },
};

/**
 * Email body parsing için regex pattern'ler
 */
export const PARSING_PATTERNS = {
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  phone: /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/,
  name: /^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/,
};

/**
 * Google Form field name mapping
 */
export const GOOGLE_FORM_FIELDS = {
  name: ['full name', 'name', 'customer name', 'your name', 'patient name'],
  email: ['email address', 'email', 'e-mail', 'your email'],
  phone: [
    'whatsapp number',
    'phone number',
    'phone',
    'telephone',
    'mobile',
    'mobile number',
    'contact number',
  ],
  message: ['message', 'your message', 'comments', 'notes', 'additional info'],
  country: ['country', 'your country', 'nationality'],
};

/**
 * Default configuration values
 */
export const GMAIL_DEFAULTS = {
  maxDescriptionLength: 10000,
  maxPhoneLength: 15,
  minPhoneLength: 8,
  defaultStatusId: 1,
  defaultSourceId: 10,
};