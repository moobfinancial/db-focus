import { Cartesia } from '/Users/boommac/Documents/db-focus/cartesia-sdk/src/index.ts';
import type { Voice } from '../../types';

// Safe environment variable retrieval
const getEnvVar = (key: string): string | undefined => {
  // Check if running in browser with Vite
  if (typeof window !== 'undefined' && import.meta?.env) {
    return (import.meta.env as Record<string, string>)[key];
  }
  
  // Fallback to process.env for server-side
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  
  return undefined;
};

export class CartesiaApi {
  private client: Cartesia;

  constructor() {
    // Prioritize Vite environment variables, then fallback to Node.js env
    const apiKey = 
      getEnvVar('VITE_CARTESIA_API_KEY') || 
      getEnvVar('CARTESIA_API_KEY');
    
    // Enhanced logging for environment variable debugging
    console.log('Environment Variable Check:');
    console.log('VITE_CARTESIA_API_KEY:', !!getEnvVar('VITE_CARTESIA_API_KEY') ? 'Present' : 'Not Set');
    console.log('CARTESIA_API_KEY:', !!getEnvVar('CARTESIA_API_KEY') ? 'Present' : 'Not Set');
    
    if (!apiKey) {
      console.error('No Cartesia API key found in environment variables');
      throw new Error('No Cartesia API key found. Please set VITE_CARTESIA_API_KEY or CARTESIA_API_KEY');
    }
    
    this.client = new Cartesia({ apiKey });
  }

  async getVoices(): Promise<Voice[]> {
    try {
      const voices = await this.client.voices.list();
      
      return voices.map(voice => ({
        id: voice.id,
        name: voice.name,
        gender: voice.metadata?.gender || 'neutral',
        language: voice.metadata?.language || 'English',
        nationality: voice.metadata?.accent || '',
        provider: 'Cartesia',
        traits: Object.entries(voice.metadata || {})
          .filter(([key]) => !['gender', 'language', 'accent'].includes(key))
          .map(([key, value]) => `${key}: ${value}`),
        isCloned: voice.type === 'custom',
        audioUrl: voice.sampleUrl || ''
      }));
    } catch (error) {
      console.error('Cartesia API Error:', error);
      return [];
    }
  }

  async previewVoice(voiceId: string): Promise<string> {
    try {
      const voice = await this.client.voices.get(voiceId);
      return voice.sampleUrl || '';
    } catch (error) {
      console.error('Cartesia preview error:', error);
      return '';
    }
  }
}

export const cartesiaApi = new CartesiaApi();
