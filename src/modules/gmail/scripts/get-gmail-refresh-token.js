/**
 * ═══════════════════════════════════════════════════════════════
 * Gmail Refresh Token Helper Script
 * ═══════════════════════════════════════════════════════════════
 * 
 * Bu script ile Gmail API için gerekli refresh token'ı alabilirsiniz.
 * 
 * Kullanım:
 * 1. GOOGLE_CLIENT_ID ve GOOGLE_CLIENT_SECRET değerlerini doldurun
 * 2. Script'i çalıştırın: node get-gmail-refresh-token.js
 * 3. Tarayıcıda açılan URL'e gidin ve Google hesabınızla giriş yapın
 * 4. Authorization code'u alın ve script'e yapıştırın
 * 5. Refresh token'ı .env dosyanıza ekleyin
 */

const { google } = require('googleapis');
const readline = require('readline');

// ═══════════════════════════════════════════════════════════════
// BURAYA GOOGLE CLOUD CONSOLE'DAN ALDIĞINIZ BİLGİLERİ YAZIN
// ═══════════════════════════════════════════════════════════════
const CLIENT_ID = '217976708541-4e2dkfgnuv30qj0m949ei1idfbcqth8n.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI = 'http://localhost:3000/auth/google/callback';

// Gmail API scope'ları
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.labels',
];

// ═══════════════════════════════════════════════════════════════
// OAuth2 Client oluştur
// ═══════════════════════════════════════════════════════════════
const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

/**
 * 1. Authorization URL oluştur
 */
function generateAuthUrl() {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent', // Force refresh token
  });

  console.log('\n════════════════════════════════════════════════════════════');
  console.log('📧 Gmail API Authorization');
  console.log('════════════════════════════════════════════════════════════\n');
  console.log('1️⃣  Aşağıdaki URL\'i tarayıcınızda açın:\n');
  console.log(authUrl);
  console.log('\n2️⃣  Google hesabınızla giriş yapın ve izinleri onaylayın');
  console.log('3️⃣  Redirect edilen URL\'deki "code" parametresini kopyalayın\n');
  console.log('════════════════════════════════════════════════════════════\n');
}

/**
 * 2. Authorization code ile token al
 */
async function getTokens(code) {
  try {
    console.log('\n⏳ Token alınıyor...\n');
    
    const { tokens } = await oauth2Client.getToken(code);
    
    console.log('✅ Başarılı! Token bilgileri:\n');
    console.log('════════════════════════════════════════════════════════════');
    console.log('Access Token:', tokens.access_token.substring(0, 50) + '...');
    console.log('Refresh Token:', tokens.refresh_token);
    console.log('Token Type:', tokens.token_type);
    console.log('Expiry Date:', new Date(tokens.expiry_date).toLocaleString());
    console.log('════════════════════════════════════════════════════════════\n');
    
    console.log('📝 .env dosyanıza ekleyin:\n');
    console.log(`GOOGLE_CLIENT_ID=${CLIENT_ID}`);
    console.log(`GOOGLE_CLIENT_SECRET=${CLIENT_SECRET}`);
    console.log(`GOOGLE_REDIRECT_URI=${REDIRECT_URI}`);
    console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
    console.log('\n════════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Hata:', error.message);
    console.error('\nLütfen authorization code\'u kontrol edin ve tekrar deneyin.');
  }
}

/**
 * Main function
 */
async function main() {
  // Readline interface oluştur
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  // Authorization URL'i göster
  generateAuthUrl();

  // Authorization code al
  rl.question('Authorization code\'u buraya yapıştırın: ', async (code) => {
    await getTokens(code.trim());
    rl.close();
  });
}

// Script'i çalıştır
main();
