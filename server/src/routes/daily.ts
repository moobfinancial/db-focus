import express, { Request, Response } from 'express';
import axios from 'axios';
import { z } from 'zod';
import { PrismaClient, Prisma } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import { LLMProvider, VoiceProvider } from '@prisma/client';
import crypto from 'crypto';

const router = express.Router();
const prisma = new PrismaClient();

// Helper function to generate a random string
function generateRandomString(length: number): string {
  return crypto.randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length);
}

// Default configurations
const defaultBotProfile = "voice_2024_10";
const defaultMaxDuration = 600;
const defaultServices = {
  llm: "openai",
  tts: "cartesia",
  stt: "deepgram"
};

// Define types for configuration
interface ConfigOption {
  name: string;
  value: any;
}

interface ServiceConfig {
  service: string;
  options: ConfigOption[];
}

interface RequestBody {
  assistantId: string;
  config: ServiceConfig[];
  services: Record<string, string>;
  rtvi_client_version?: string;
}

// Validation schema
const requestSchema = z.object({
  assistantId: z.string(),
  config: z.array(z.object({
    service: z.string(),
    options: z.array(z.object({
      name: z.string(),
      value: z.any()
    }))
  })).default([]),
  services: z.record(z.string()).default({}),
  rtvi_client_version: z.string().optional()
});

// Error types for better error handling
const DailyBotsError = {
  INITIALIZATION_REQUIRED: 'INITIALIZATION_REQUIRED',
  MICROPHONE_PERMISSION_REQUIRED: 'MICROPHONE_PERMISSION_REQUIRED',
  INVALID_CONFIG: 'INVALID_CONFIG',
  API_ERROR: 'API_ERROR',
  CONCURRENT_BOTS_LIMIT: 'CONCURRENT_BOTS_LIMIT',
} as const;

// Define a custom type for authenticated request that ensures user is defined
interface AuthenticatedRequest extends Request {
  user: NonNullable<Request['user']>;
}

// Type guard to check if request is authenticated
function isAuthenticated(req: Request): req is AuthenticatedRequest {
  return req.user !== undefined;
}

// Track active bot sessions
interface BotSession {
  id: string;
  startTime: Date;
  userId: string;
  assistantId: string;
}

const activeBotSessions = new Map<string, BotSession>();
const MAX_SESSION_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

// Clean up stale sessions
function cleanupStaleSessions() {
  const now = new Date();
  for (const [sessionId, session] of activeBotSessions.entries()) {
    if (now.getTime() - session.startTime.getTime() > MAX_SESSION_DURATION) {
      activeBotSessions.delete(sessionId);
    }
  }
}

// Check if user has active sessions
function getUserActiveSessions(userId: string): number {
  cleanupStaleSessions();
  return Array.from(activeBotSessions.values()).filter(session => session.userId === userId).length;
}

// Start a DailyBot session
router.post('/start-bot', authenticate, async (req: Request, res: Response) => {
  if (!isAuthenticated(req)) {
    return res.status(401).json({
      success: false,
      error: {
        type: 'AUTHENTICATION_ERROR',
        message: 'User not authenticated'
      }
    });
  }

  try {
    const { services, config, rtvi_client_version } = req.body as RequestBody;

    // Validate request body
    const validationResult = requestSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          type: DailyBotsError.INVALID_CONFIG,
          message: 'Invalid request configuration'
        }
      });
    }

    // Check concurrent sessions limit
    const activeSessions = getUserActiveSessions(req.user.id);
    if (activeSessions >= 3) { // Assuming max 3 concurrent sessions
      return res.status(429).json({
        success: false,
        error: {
          type: DailyBotsError.CONCURRENT_BOTS_LIMIT,
          message: 'Maximum concurrent bot sessions reached'
        }
      });
    }

    // Check required environment variables
    if (!process.env.DAILY_BOTS_URL || !process.env.DAILY_BOTS_API_KEY) {
      throw new Error('Missing required environment variables: DAILY_BOTS_URL or DAILY_BOTS_API_KEY');
    }

    // Prepare payload for DailyBots
    const payload = {
      room_name: generateRandomString(10),
      bot_profile: defaultBotProfile,
      max_duration: defaultMaxDuration,
      services: {
        llm: process.env.OPENAI_API_KEY ?? '',
        cartesia: process.env.CARTESIA_API_KEY ?? '',
        deepgram: process.env.DEEPGRAM_API_KEY ?? ''
      },
      config: config,
      rtvi_client_version: rtvi_client_version
    };

    // Call DailyBots API
    const dailyBotsResponse = await axios.post(
      process.env.DAILY_BOTS_URL as string,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.DAILY_BOTS_API_KEY}`
        }
      }
    );

    // Create new session
    const session = await prisma.voiceSession.create({
      data: {
        userId: req.user.id,
        assistantId: 'default', // You'll need to handle this based on your needs
        sessionId: dailyBotsResponse.data.session_id,
        botSessionId: dailyBotsResponse.data.bot_session_id,
        roomUrl: dailyBotsResponse.data.room_url,
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() + defaultMaxDuration * 1000),
        rtviClientVersion: rtvi_client_version,
        services: services,
        config: config.length > 0 ? JSON.parse(JSON.stringify(config)) : null,
        metrics: {
          startTime: new Date().toISOString(),
          provider: services.llm || defaultServices.llm,
          model: config.find((c: ServiceConfig) => c.service === 'llm')?.options.find((o: ConfigOption) => o.name === 'model')?.value
        }
      }
    });

    // Return success response
    return res.json({
      success: true,
      data: {
        ...dailyBotsResponse.data,
        sessionId: session.id,
        config: {
          maxDuration: defaultMaxDuration,
          services: { ...defaultServices, ...services }
        }
      }
    });

  } catch (error) {
    console.error('Error details:', error instanceof Error ? error.message : String(error));
    if (axios.isAxiosError(error) && error.response?.data) {
      return res.status(error.response.status).json({
        success: false,
        error: {
          type: DailyBotsError.API_ERROR,
          message: error.response.data.message || 'Error calling DailyBots API'
        }
      });
    }
    return res.status(500).json({
      success: false,
      error: {
        type: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred'
      }
    });
  }
});

// Alias /start to /start-bot for backward compatibility
router.post('/start', authenticate, async (req: Request, res: Response) => {
  if (!isAuthenticated(req)) {
    return res.status(401).json({
      success: false,
      error: {
        type: 'AUTHENTICATION_ERROR',
        message: 'User not authenticated'
      }
    });
  }

  try {
    console.log('Received request at /start endpoint:', JSON.stringify(req.body, null, 2));
    
    // Provide default values if not present
    const requestWithDefaults = {
      ...req.body,
      config: req.body.config || [],
      services: req.body.services || {}
    };
    
    // Validate request body
    const validationResult = requestSchema.safeParse(requestWithDefaults);
    
    if (!validationResult.success) {
      console.error('Validation errors:', validationResult.error);
      return res.status(400).json({
        success: false,
        error: {
          type: DailyBotsError.INVALID_CONFIG,
          message: 'Invalid request configuration',
          details: validationResult.error.errors
        }
      });
    }

    const validatedData = validationResult.data as RequestBody;

    // Get assistant details
    const assistant = await prisma.assistant.findUnique({
      where: { id: validatedData.assistantId },
      select: {
        id: true,
        systemPrompt: true,
        voiceId: true,
        provider: true,
        voiceProvider: true
      }
    });

    if (!assistant) {
      return res.status(404).json({
        success: false,
        error: {
          type: 'ASSISTANT_NOT_FOUND',
          message: 'Assistant not found'
        }
      });
    }

    if (!process.env.DAILY_BOTS_URL) {
      throw new Error('DAILY_BOTS_URL environment variable is not set');
    }

    // Check required environment variables
    if (!process.env.DAILY_BOTS_URL || !process.env.DAILY_BOTS_API_KEY) {
      throw new Error('Missing required environment variables: DAILY_BOTS_URL or DAILY_BOTS_API_KEY');
    }

    // Construct payload using rtvi properties and defaults
    const payload = {
      room_name: generateRandomString(10),
      bot_profile: defaultBotProfile,
      max_duration: defaultMaxDuration,
      services: {
        llm: process.env.OPENAI_API_KEY ?? '',
        cartesia: process.env.CARTESIA_API_KEY ?? '',
        deepgram: process.env.DEEPGRAM_API_KEY ?? ''
      },
      config: validatedData.config,
      rtvi_client_version: validatedData.rtvi_client_version
    };

    console.log('Payload being sent to DailyBots API:', JSON.stringify(payload, null, 2));

    const botResponse = await axios.post(process.env.DAILY_BOTS_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DAILY_BOTS_API_KEY}`
      }
    });

    // Create a session record in the database
    const session = await prisma.voiceSession.create({
      data: {
        assistantId: validatedData.assistantId,
        userId: req.user.id,
        sessionId: botResponse.data.session_id,
        botSessionId: botResponse.data.bot_session_id,
        status: 'ACTIVE',
        startedAt: new Date(),
        expiresAt: new Date(Date.now() + defaultMaxDuration * 1000),
        services: validatedData.services,
        config: validatedData.config.length > 0 ? JSON.parse(JSON.stringify(validatedData.config)) : null,
        roomUrl: botResponse.data.room_url
      }
    });

    res.json({
      success: true,
      sessionId: session.sessionId,
      botSessionId: botResponse.data.bot_session_id,
      token: botResponse.data.token,
      room_url: botResponse.data.room_url,
      config: {
        maxDuration: defaultMaxDuration,
        services: { ...defaultServices, ...validatedData.services }
      }
    });
  } catch (error) {
    console.error('Error details:', error instanceof Error ? error.message : String(error));
    if (axios.isAxiosError(error) && error.response?.data) {
      console.error('DailyBots API error:', {
        status: error.response.status,
        statusText: error.response.statusText,
        error: JSON.stringify(error.response.data)
      });

      if (typeof error.response.data === 'object' && error.response.data !== null) {
        const dailyBotsError = error.response.data as { error?: string, info?: string };
        
        if (dailyBotsError.error === 'exceeded-plan') {
          return res.status(429).json({
            success: false,
            error: {
              type: DailyBotsError.CONCURRENT_BOTS_LIMIT,
              message: dailyBotsError.info || 'Maximum concurrent Daily Bots limit exceeded',
            }
          });
        }
      }

      return res.status(error.response.status).json({
        success: false,
        error: {
          type: DailyBotsError.API_ERROR,
          message: 'Failed to start bot session',
          details: error.response.data
        }
      });
    }
    res.status(500).json({
      success: false,
      error: {
        type: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred'
      }
    });
  }
});

// Start a Daily.co call with DailyBots integration
router.post('/start', authenticate, async (req: Request, res: Response) => {
  if (!isAuthenticated(req)) {
    return res.status(401).json({
      success: false,
      error: {
        type: 'AUTHENTICATION_ERROR',
        message: 'User not authenticated'
      }
    });
  }

  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          type: 'AUTHENTICATION_ERROR',
          message: 'User not authenticated',
        },
      });
    }

    console.log('Received request body:', req.body);
    const validation = requestSchema.safeParse(req.body);
    if (!validation.success) {
      console.error('Validation error:', validation.error);
      return res.status(400).json({ 
        success: false,
        error: {
          type: DailyBotsError.INVALID_CONFIG,
          message: 'Invalid request configuration',
          details: validation.error.format()
        }
      });
    }

    const { services, config, rtvi_client_version } = validation.data as RequestBody;

    // Fetch assistant data from database
    const assistant = await prisma.assistant.findUnique({
      where: {
        id: 'assistantId', // Assuming assistantId is the ID of the assistant
        userId: req.user.id
      }
    });

    if (!assistant) {
      return res.status(404).json({
        success: false,
        error: {
          type: 'ASSISTANT_NOT_FOUND',
          message: 'Assistant not found'
        }
      });
    }

    // Verify required environment variables
    const requiredEnvVars = {
      DAILY_API_KEY: process.env.DAILY_API_KEY,
      DAILY_BOTS_URL: process.env.DAILY_BOTS_URL,
      DAILY_BOTS_API_KEY: process.env.DAILY_BOTS_API_KEY,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      CARTESIA_API_KEY: process.env.CARTESIA_API_KEY,
      DEEPGRAM_API_KEY: process.env.DEEPGRAM_API_KEY
    };

    const missingEnvVars = Object.entries(requiredEnvVars)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (missingEnvVars.length > 0) {
      console.error('Missing required environment variables:', missingEnvVars);
      return res.status(500).json({
        success: false,
        error: {
          type: 'CONFIGURATION_ERROR',
          message: 'Missing required API keys',
          details: missingEnvVars
        }
      });
    }

    try {
      interface VoiceSettings {
        voiceId?: string;
        speed?: number;
        pitch?: number;
        stability?: number;
        volume?: number;
      }

      // Start DailyBots session
      const voiceSettings = config.find((config) => config.service === 'tts')?.options.find((option) => option.name === 'settings')?.value as VoiceSettings | undefined;
      
      // Log the full request body and RTVI config
      console.log('Full request body:', JSON.stringify(req.body, null, 2));
      console.log('RTVI config:', JSON.stringify(config, null, 2));
      console.log('Voice settings:', JSON.stringify(voiceSettings, null, 2));

      // Check required environment variables
      if (!process.env.DAILY_BOTS_URL || !process.env.DAILY_BOTS_API_KEY) {
        throw new Error('Missing required environment variables: DAILY_BOTS_URL or DAILY_BOTS_API_KEY');
      }

      const payload = {
        room_name: generateRandomString(10),
        bot_profile: defaultBotProfile,  // Required bot profile
        max_duration: defaultMaxDuration,
        services: {
          llm: process.env.OPENAI_API_KEY ?? '',
          cartesia: process.env.CARTESIA_API_KEY ?? '',
          deepgram: process.env.DEEPGRAM_API_KEY ?? ''
        },
        config: config,
        rtvi_client_version: rtvi_client_version
      };

      console.log('Payload being sent to DailyBots API:', JSON.stringify(payload, null, 2));

      const botResponse = await axios.post(process.env.DAILY_BOTS_URL, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.DAILY_BOTS_API_KEY}`
        }
      });

      // Create a session record in the database
      const session = await prisma.voiceSession.create({
        data: {
          assistantId: 'assistantId', // Assuming assistantId is the ID of the assistant
          userId: req.user.id,
          sessionId: botResponse.data.session_id,
          botSessionId: botResponse.data.bot_session_id,
          status: 'ACTIVE',
          startedAt: new Date(),
          expiresAt: new Date(Date.now() + defaultMaxDuration * 1000),
          services: config.length > 0 ? JSON.parse(JSON.stringify(config)) : null,
          config: payload.config ? JSON.parse(JSON.stringify(payload.config)) : null,
          roomUrl: botResponse.data.room_url
        }
      });

      res.json({
        success: true,
        sessionId: session.sessionId,
        botSessionId: botResponse.data.bot_session_id,
        token: botResponse.data.token,
        room_url: botResponse.data.room_url,
        config: {
          maxDuration: defaultMaxDuration,
          services: { ...defaultServices, ...services }
        }
      });
    } catch (error) {
      console.error('Error details:', error instanceof Error ? error.message : String(error));
      if (axios.isAxiosError(error) && error.response?.data) {
        console.error('DailyBots API error:', {
          status: error.response.status,
          statusText: error.response.statusText,
          error: JSON.stringify(error.response.data)
        });

        // Handle specific DailyBots API errors
        if (typeof error.response.data === 'object' && error.response.data !== null) {
          const dailyBotsError = error.response.data as { error?: string, info?: string };
          
          if (dailyBotsError.error === 'exceeded-plan') {
            return res.status(429).json({
              success: false,
              error: {
                type: DailyBotsError.CONCURRENT_BOTS_LIMIT,
                message: dailyBotsError.info || 'Maximum concurrent Daily Bots limit exceeded',
              }
            });
          }
        }

        // Handle other API errors
        return res.status(error.response.status).json({
          success: false,
          error: {
            type: DailyBotsError.API_ERROR,
            message: 'Failed to start bot session',
            details: error.response.data
          }
        });
      }

      // Handle non-API errors
      return res.status(500).json({
        success: false,
        error: {
          type: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred'
        }
      });
    }
  } catch (error) {
    console.error('Error starting Daily.co call:', error instanceof Error ? error.message : String(error));
    return res.status(500).json({
      error: `Failed to start Daily.co call: ${error instanceof Error ? error.message : String(error)}`
    });
  }
});

// Resume session endpoint
router.post('/resume/:sessionId', authenticate, async (req: Request, res: Response) => {
  if (!isAuthenticated(req)) {
    return res.status(401).json({
      success: false,
      error: {
        type: 'AUTHENTICATION_ERROR',
        message: 'User not authenticated'
      }
    });
  }

  try {
    const session = await prisma.voiceSession.findUnique({
      where: { 
        id: req.params.sessionId,
        userId: req.user.id 
      },
      include: {
        assistant: true
      }
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: {
          type: 'SESSION_NOT_FOUND',
          message: 'Session not found'
        }
      });
    }

    if (session.status === 'ENDED') {
      return res.status(400).json({
        success: false,
        error: {
          type: 'SESSION_ENDED',
          message: 'Session has already ended'
        }
      });
    }

    // Update session status
    await prisma.voiceSession.update({
      where: { id: session.id },
      data: {
        status: 'ACTIVE',
        pausedAt: null
      }
    });

    return res.json({
      success: true,
      data: {
        sessionId: session.id,
        botSessionId: session.botSessionId,
        roomUrl: session.roomUrl,
        config: {
          maxDuration: defaultMaxDuration,
          services: session.services
        }
      }
    });
  } catch (error) {
    console.error('Error resuming session:', error);
    return res.status(500).json({
      success: false,
      error: {
        type: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to resume session'
      }
    });
  }
});

// End a bot session
router.post('/end-session', authenticate, async (req: Request, res: Response) => {
  if (!isAuthenticated(req)) {
    return res.status(401).json({
      success: false,
      error: {
        type: 'AUTHENTICATION_ERROR',
        message: 'User not authenticated'
      }
    });
  }

  const { sessionId } = req.body;

  if (!sessionId) {
    return res.status(400).json({
      success: false,
      error: {
        type: 'INVALID_REQUEST',
        message: 'Session ID is required'
      }
    });
  }

  const session = activeBotSessions.get(sessionId);

  if (!session) {
    return res.status(404).json({
      success: false,
      error: {
        type: 'SESSION_NOT_FOUND',
        message: 'Bot session not found'
      }
    });
  }

  if (session.userId !== req.user.id) {
    return res.status(403).json({
      success: false,
      error: {
        type: 'FORBIDDEN',
        message: 'You do not have permission to end this session'
      }
    });
  }

  // Remove the session
  activeBotSessions.delete(sessionId);

  res.json({
    success: true,
    message: 'Bot session ended successfully'
  });
});

// Control endpoints
router.post('/pause/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const session = await prisma.voiceSession.findUnique({
      where: { sessionId }
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Pause the DailyBots session
    await axios.post(`${process.env.DAILY_BOTS_URL}/pause/${session.botSessionId}`, {}, {
      headers: {
        'Authorization': `Bearer ${process.env.DAILY_BOTS_API_KEY}`
      }
    });

    // Update session status in database
    await prisma.voiceSession.update({
      where: { sessionId },
      data: {
        status: 'PAUSED',
        pausedAt: new Date()
      }
    });

    res.json({ 
      success: true,
      message: 'Session paused'
    });
  } catch (error) {
    console.error('Error pausing session:', error instanceof Error ? error.message : String(error));
    res.status(500).json({ error: 'Failed to pause session' });
  }
});

router.post('/resume/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const session = await prisma.voiceSession.findUnique({
      where: { sessionId }
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Resume the DailyBots session
    await axios.post(`${process.env.DAILY_BOTS_URL}/resume/${session.botSessionId}`, {}, {
      headers: {
        'Authorization': `Bearer ${process.env.DAILY_BOTS_API_KEY}`
      }
    });

    // Update session status in database
    await prisma.voiceSession.update({
      where: { sessionId },
      data: {
        status: 'ACTIVE',
        pausedAt: null 
      }
    });

    res.json({ 
      success: true,
      message: 'Session resumed'
    });
  } catch (error) {
    console.error('Error resuming session:', error instanceof Error ? error.message : String(error));
    res.status(500).json({ error: 'Failed to resume session' });
  }
});

router.post('/end/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    
    // Get the session from our database
    const session = await prisma.voiceSession.findUnique({
      where: { sessionId }
    });

    // Check if session exists and has a room URL
    if (!session || !session.roomUrl) {
      return res.status(404).json({
        success: false,
        error: {
          message: !session ? 'Session not found' : 'Session has no room URL'
        }
      });
    }

    // Call Daily Bots API to end the session
    const response = await axios.post(
      `${process.env.DAILY_BOTS_URL}/end`,
      { room_url: session.roomUrl },
      {
        headers: {
          'Authorization': `Bearer ${process.env.DAILY_BOTS_API_KEY}`
        }
      }
    );

    // Clean up the Daily.co room
    try {
      await axios.delete(`https://api.daily.co/v1/rooms/${session.roomUrl.split('/').pop()}`, {
        headers: {
          'Authorization': `Bearer ${process.env.DAILY_API_KEY}`
        }
      });
    } catch (error) {
      console.error('Error deleting Daily.co room:', error instanceof Error ? error.message : String(error));
      // Continue with cleanup even if room deletion fails
    }

    // Update session status in database
    await prisma.voiceSession.update({
      where: { sessionId },
      data: {
        status: 'ENDED',
        endedAt: new Date()
      }
    });

    res.json({ 
      success: true,
      message: 'Session ended and resources cleaned up'
    });
  } catch (error) {
    console.error('Error in end session flow:', error instanceof Error ? error.message : String(error));
    res.status(500).json({ error: 'Failed to end session properly' });
  }
});

export default router;
