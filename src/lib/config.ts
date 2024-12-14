import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env files
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Configuration interface for type safety
interface ConfigInterface {
  // Daily.co API
  dailyApiKey: string;

  // Voice Providers
  playhtApiKey?: string;
  playhtUserId?: string;
  elevenlabsApiKey?: string;
  deepgramApiKey?: string;
  cartesiaApiKey?: string;
  neetsApiKey?: string;

  // AI Providers
  groqApiKey?: string;
  openaiApiKey?: string;

  // Database and Server
  databaseUrl: string;
  port: number;
  nodeEnv: string;
}

// Configuration object with type checking and default values
export const config: ConfigInterface = {
  // Daily.co API
  dailyApiKey: process.env.DAILY_API_KEY || '',

  // Voice Provider Keys
  playhtApiKey: process.env.PLAYHT_API_KEY,
  playhtUserId: process.env.PLAYHT_USER_ID,
  elevenlabsApiKey: process.env.ELEVENLABS_API_KEY,
  deepgramApiKey: process.env.DEEPGRAM_API_KEY,
  cartesiaApiKey: process.env.CARTESIA_API_KEY,
  neetsApiKey: process.env.NEETS_API_KEY,

  // AI Provider Keys
  groqApiKey: process.env.GROQ_API_KEY,
  openaiApiKey: process.env.OPENAI_API_KEY,

  // Database and Server Configuration
  databaseUrl: process.env.DATABASE_URL || 'postgresql://localhost/dbfocus',
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development'
};

// Validation function to ensure critical configurations are present
export function validateConfig() {
  const missingKeys: string[] = [];

  // Check for critical configuration keys
  if (!config.dailyApiKey) missingKeys.push('DAILY_API_KEY');
  if (!config.databaseUrl) missingKeys.push('DATABASE_URL');

  if (missingKeys.length > 0) {
    console.error('Missing critical configuration:', missingKeys);
    throw new Error(`Missing configuration: ${missingKeys.join(', ')}`);
  }
}

// Run validation on import
validateConfig();
