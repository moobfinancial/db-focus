import { Router } from 'express';
import type { ApiResponse } from '@/types/schema';
import cors from 'cors';

const router = Router();

const DAILY_BOTS_BASE_URL = 'https://api.dailybots.com/v1';
const ELEVENLABS_BASE_URL = 'https://api.elevenlabs.io/v1';
const RTVI_BASE_URL = 'https://api.rtvi.io/v1';

// Utility function to handle API errors
function handleApiError(error: any) {
  console.error('API Error:', error);
  if (error.response) {
    return {
      code: 'PROVIDER_ERROR',
      message: `API error: ${error.response.status} ${error.response.statusText}`,
      details: error.response.data
    };
  }
  if (error.request) {
    return {
      code: 'NETWORK_ERROR',
      message: 'Network request failed',
      details: error.message
    };
  }
  return {
    code: 'UNKNOWN_ERROR',
    message: 'An unexpected error occurred',
    details: error.message
  };
}

// Utility function for making API requests with timeout
async function makeApiRequest(url: string, options: RequestInit = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

router.use(cors());

// Daily Bots routes
router.get('/dailybots/voices', async (req, res) => {
  try {
    console.log('Fetching Daily Bots voices...');
    const { provider } = req.query;

    const PROVIDER_VOICES = {
      'eleven-labs': [
        {
          id: 'rachel',
          name: 'Rachel',
          description: 'Professional female voice',
          language: 'English',
          gender: 'female',
          style: 'professional',
          provider: 'ElevenLabs',
          previewUrl: 'https://example.com/rachel_preview.mp3'
        },
        {
          id: 'domi',
          name: 'Domi',
          description: 'Articulate male voice',
          language: 'English',
          gender: 'male',
          style: 'clear',
          provider: 'ElevenLabs',
          previewUrl: 'https://example.com/domi_preview.mp3'
        }
      ],
      'cartesia': [
        {
          id: 'default',
          name: 'Default Voice',
          description: 'Standard Cartesia voice',
          language: 'English',
          gender: 'neutral',
          style: 'neutral',
          provider: 'Cartesia',
          previewUrl: 'https://example.com/cartesia_default.mp3'
        },
        {
          id: 'professional',
          name: 'Professional Voice',
          description: 'Professional tone Cartesia voice',
          language: 'English',
          gender: 'neutral',
          style: 'professional',
          provider: 'Cartesia',
          previewUrl: 'https://example.com/cartesia_professional.mp3'
        }
      ],
      'dailybots': [
        {
          id: 'male_1',
          name: 'Professional Male Voice',
          description: 'A clear, professional male voice',
          language: 'English',
          gender: 'male',
          style: 'professional',
          provider: 'DailyBots'
        },
        {
          id: 'female_1',
          name: 'Friendly Female Voice',
          description: 'A warm, friendly female voice',
          language: 'English',
          gender: 'female',
          style: 'friendly',
          provider: 'DailyBots'
        }
      ]
    };

    const providerLower = (provider as string)?.toLowerCase();
    const voices = providerLower ? PROVIDER_VOICES[providerLower] || [] : [];

    const response: ApiResponse = {
      success: true,
      data: voices.map((voice: any) => ({
        id: voice.id,
        name: voice.name,
        description: voice.description || '',
        language: voice.language || 'English',
        gender: voice.gender || 'neutral',
        style: voice.style || 'default',
        provider: voice.provider,
        previewUrl: voice.previewUrl || ''
      }))
    };

    res.json(response);
  } catch (error) {
    const apiError = handleApiError(error);
    res.status(500).json({ success: false, error: apiError });
  }
});

// ElevenLabs routes
router.get('/elevenlabs/voices', async (req, res) => {
  try {
    console.log('Fetching ElevenLabs voices...');
    const data = await makeApiRequest(`${ELEVENLABS_BASE_URL}/voices`, {
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
      }
    });

    const response: ApiResponse = {
      success: true,
      data: data.voices.map((voice: any) => ({
        id: voice.voice_id,
        name: voice.name,
        provider: 'elevenlabs',
        previewUrl: `/api/providers/elevenlabs/voices/${voice.voice_id}/preview`
      }))
    };

    res.json(response);
  } catch (error) {
    const apiError = handleApiError(error);
    res.status(500).json({ success: false, error: apiError });
  }
});

router.get('/elevenlabs/voices/:id/preview', async (req, res) => {
  try {
    console.log(`Fetching ElevenLabs voice preview for ID: ${req.params.id}`);
    const response = await fetch(
      `${ELEVENLABS_BASE_URL}/voices/${req.params.id}/preview`,
      {
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch preview: ${response.status} ${response.statusText}`);
    }

    const audioBuffer = await response.arrayBuffer();
    res.set('Content-Type', 'audio/mpeg');
    res.send(Buffer.from(audioBuffer));
  } catch (error) {
    const apiError = handleApiError(error);
    res.status(500).json({ success: false, error: apiError });
  }
});

// RTVI routes
router.get('/rtvi/voices', async (req, res) => {
  try {
    console.log('Fetching RTVI voices...');
    const data = await makeApiRequest(`${RTVI_BASE_URL}/voices`, {
      headers: {
        'Authorization': `Bearer ${process.env.RTVI_API_KEY}`,
      }
    });

    const response: ApiResponse = {
      success: true,
      data: data.voices.map((voice: any) => ({
        id: voice.id,
        name: voice.name,
        provider: 'rtvi',
        previewUrl: voice.preview_url
      }))
    };

    res.json(response);
  } catch (error) {
    const apiError = handleApiError(error);
    res.status(500).json({ success: false, error: apiError });
  }
});

export default router;
