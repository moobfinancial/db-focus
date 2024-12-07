import { Router, Request, Response, NextFunction } from 'express';
import axios from 'axios';
import type { ApiResponse } from '../types/schema';

const router = Router();

const DAILY_BOTS_URL = process.env.DAILY_BOTS_URL || '';
const ELEVENLABS_BASE_URL = process.env.ELEVENLABS_API_URL;
const RTVI_BASE_URL = process.env.RTVI_API_URL;

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
    code: 'REQUEST_ERROR',
    message: 'Error setting up the request',
    details: error.message
  };
}

// Utility function for making external API requests
async function makeExternalApiRequest(url: string, headers: Record<string, string> = {}) {
  try {
    const response = await axios.get(url, {
      headers: {
        'Accept': 'application/json',
        ...headers
      },
      timeout: 10000 // 10-second timeout
    });

    return response.data;
  } catch (error) {
    console.error(`Error fetching from external API: ${url}`, error);
    throw error;
  }
}

// CORS middleware for this router to ensure specific headers
router.use((req: Request, res: Response, next: NextFunction) => {
  const allowedOrigins = [
    'http://localhost:3000', 
    'http://localhost:5173', 
    'https://talkai247.com'  // Add your production domain
  ];
  
  const origin = req.headers.origin || '';
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

// Detailed logging for API key and URL
console.log('Daily Bots URL:', DAILY_BOTS_URL);
console.log('Daily Bots API Key:', process.env.DAILY_BOTS_API_KEY ? 'Key Present' : 'Key Missing');

// Daily Bots voices route
router.get('/dailybots/voices', async (req: Request, res: Response) => {
  try {
    console.log('Attempting to fetch Daily Bots voices...');
    
    const apiKey = process.env.DAILY_BOTS_API_KEY;
    const baseUrl = DAILY_BOTS_URL || '';

    if (!apiKey) {
      console.error('Daily Bots API Key is missing!');
      return res.status(500).json({
        success: false,
        error: {
          code: 'CONFIG_ERROR',
          message: 'Daily Bots API Key is not configured',
          details: 'Please set DAILY_BOTS_API_KEY in your environment variables'
        }
      });
    }

    if (!baseUrl) {
      console.error('Daily Bots URL is missing!');
      return res.status(500).json({
        success: false,
        error: {
          code: 'CONFIG_ERROR',
          message: 'Daily Bots URL is not configured',
          details: 'Please set DAILY_BOTS_URL in your environment variables'
        }
      });
    }

    console.log(`Sending request to: ${baseUrl}/voices`);
    
    try {
      const data = await makeExternalApiRequest(`${baseUrl}/voices`, {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      });

      console.log('Raw voices data received:', JSON.stringify(data, null, 2));

      // Flexible data extraction to handle different API response structures
      const voices = data.voices || data.data || [];

      const response: ApiResponse = {
        success: true,
        data: voices.map((voice: any) => ({
          id: voice.id || voice.uuid,
          name: voice.name || voice.title,
          language: voice.language || voice.lang || 'Unknown',
          gender: voice.gender || 'Unknown',
          previewUrl: voice.preview_url || voice.sample_url || voice.audio_url,
          provider: 'dailybots'
        }))
      };

      res.json(response);
    } catch (fetchError) {
      console.error('Error fetching voices from Daily Bots:', fetchError);
      const apiError = handleApiError(fetchError);
      res.status(500).json({ 
        success: false, 
        error: apiError 
      });
    }
  } catch (error) {
    console.error('Daily Bots API Error - Full Error:', error);
    const apiError = handleApiError(error);
    res.status(500).json({ 
      success: false, 
      error: apiError 
    });
  }
});

// ElevenLabs voices route
router.get('/elevenlabs/voices', async (req: Request, res: Response) => {
  try {
    console.log('Fetching ElevenLabs voices...');
    const response: ApiResponse = {
      success: true,
      data: [
        {
          id: 'elevenlabs-voice-1',
          name: 'English Female Voice',
          language: 'English',
          gender: 'female',
          previewUrl: 'https://example.com/elevenlabs-voice-1-preview.mp3',
          provider: 'elevenlabs'
        }
      ]
    };

    res.json(response);
  } catch (error) {
    console.error('ElevenLabs API Error:', error);
    const apiError = handleApiError(error);
    res.status(500).json({ 
      success: false, 
      error: apiError 
    });
  }
});

// Detailed logging for RTVI API key and URL
console.log('RTVI Base URL:', RTVI_BASE_URL);
console.log('RTVI API Key:', process.env.RTVI_API_KEY ? 'Key Present' : 'Key Missing');

// RTVI voices route
router.get('/rtvi/voices', async (req: Request, res: Response) => {
  try {
    console.log('Attempting to fetch RTVI voices...');
    
    // Provide a clear message about RTVI voice integration
    const response: ApiResponse = {
      success: true,
      data: [
        {
          id: 'rtvi-voice-1',
          name: 'RTVI Voice (Placeholder)',
          language: 'English',
          gender: 'Neutral',
          previewUrl: null,
          provider: 'rtvi',
          message: 'RTVI voice integration is not fully implemented. Please check documentation or contact support.'
        }
      ]
    };

    res.json(response);
  } catch (error) {
    console.error('RTVI Voices Retrieval Error:', error);
    const apiError = handleApiError(error);
    res.status(500).json({ 
      success: false, 
      error: apiError 
    });
  }
});

export default router;
