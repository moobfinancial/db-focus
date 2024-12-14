import axios from 'axios';
import { getEnvVar } from '@/config/env';
import type { Voice } from '../../types';

class ElevenLabsApi {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = getEnvVar('ELEVENLABS_API_KEY', 'ELEVENLABS_API_KEY');
    this.baseUrl = 'https://api.elevenlabs.io/v1';
  }

  async getVoices(): Promise<Voice[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/voices`, {
        headers: {
          'xi-api-key': this.apiKey,
          'Accept': 'application/json'
        }
      });

      return response.data.voices.map((voice: any) => ({
        id: voice.voice_id,
        name: voice.name,
        gender: voice.labels?.gender || 'neutral',
        language: voice.labels?.language || 'English',
        nationality: voice.labels?.accent || '',
        provider: 'ElevenLabs',
        traits: Object.entries(voice.labels || {})
          .filter(([key]) => !['gender', 'language', 'accent'].includes(key))
          .map(([key, value]) => `${key}: ${value}`),
        isCloned: voice.category === 'cloned',
        audioUrl: voice.preview_url || ''
      }));
    } catch (error) {
      console.error('ElevenLabs API Error:', error);
      return [];
    }
  }

  async previewVoice(voiceId: string): Promise<string> {
    try {
      const response = await axios.get(`${this.baseUrl}/voices/${voiceId}/samples`, {
        headers: {
          'xi-api-key': this.apiKey,
          'Accept': 'application/json'
        }
      });

      // Return the first sample's audio URL
      return response.data.samples[0]?.audio_url || '';
    } catch (error) {
      console.error('ElevenLabs preview error:', error);
      return '';
    }
  }
}

export const elevenLabsApi = new ElevenLabsApi();
