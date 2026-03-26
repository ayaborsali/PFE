import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

console.log('📋 Vérification configuration LinkedIn:');
console.log('========================================');
console.log('Client ID:', process.env.LINKEDIN_CLIENT_ID ? '✅ ' + process.env.LINKEDIN_CLIENT_ID.substring(0, 10) + '...' : '❌ Manquant');
console.log('Client Secret:', process.env.LINKEDIN_CLIENT_SECRET ? '✅ Présent' : '❌ Manquant');
console.log('Redirect URI:', process.env.LINKEDIN_REDIRECT_URI || '❌ Manquant');
console.log('Company ID:', process.env.LINKEDIN_COMPANY_ID || '❌ Manquant');
console.log('');

if (process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET) {
  console.log('✅ Configuration complète!');
  console.log('');
  console.log('🔗 URL de test (copie et ouvre dans ton navigateur):');
  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${process.env.LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.LINKEDIN_REDIRECT_URI)}&scope=openid%20profile%20email%20w_member_social`;
  console.log(authUrl);
  console.log('');
  console.log('⚠️  Après avoir ouvert le lien, autorise l\'application');
  console.log('📝 Tu seras redirigé vers: http://localhost:5000/auth/linkedin/callback?code=...');
  console.log('🔑 Le code dans l\'URL est ton code d\'autorisation');
} else {
  console.log('❌ Configuration incomplète');
  console.log('');
  console.log('Vérifie ton fichier .env contient:');
  console.log('LINKEDIN_CLIENT_ID=ton_client_id');
  console.log('LINKEDIN_CLIENT_SECRET=ton_client_secret');
  console.log('LINKEDIN_REDIRECT_URI=http://localhost:5000/auth/linkedin/callback');
}