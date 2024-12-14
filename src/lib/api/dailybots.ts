import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { apiClient } from './client';

// Define interfaces for bot configuration
export interface DailyBotServiceConfig {
  service: string;
  options: Array<{
    name: string;
    value: any;
  }>;
}

export interface DailyBotStartRequest {
  bot_profile: string;
  max_duration?: number;
  services?: Record<string, string>;
  config: DailyBotServiceConfig[];
}

export interface DailyBotsAssistant {
  id: string;
  userId?: string;
  name: string;
  modes?: string[];
  firstMessage?: string;
  systemPrompt?: string;
  provider?: string;
  model?: string;
  language?: string;
  tools?: string[];
  voiceProvider?: string;
  voiceId?: string;
  voiceSettings?: {
    speed?: number;
    pitch?: number;
    stability?: number;
    volume?: number;
  };
  botProfile?: string;
  llmProvider?: string;
  ttsProvider?: string;
  dailyBotsSessionId?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  isActive?: boolean;
}

export interface DailyBotStartResponse {
  session_id: string;
}

// DailyBots API Service
export const dailyBotsApi = {
  // Base URL for DailyBots API
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',

  // Generate a local assistant ID if not provided
  generateAssistantId(): string {
    return uuidv4();
  },

  // Validate configuration
  validateConfig() {
    const apiKey = process.env.DAILY_BOTS_API_KEY || process.env.VITE_DAILYBOTS_API_KEY;
    return !!apiKey;
  },

  // Convert our Assistant model to DailyBots bot start configuration
  convertAssistantToBotConfig(assistant: DailyBotsAssistant): DailyBotStartRequest {
    const botProfile = assistant.botProfile || 'voice_2024_10';

    return {
      bot_profile: botProfile,
      max_duration: 300,
      services: {
        tts: assistant.ttsProvider || assistant.voiceProvider || 'cartesia',
        llm: assistant.llmProvider || 'openai',
        stt: 'deepgram'
      },
      config: [
        {
          service: 'llm',
          options: [
            { name: 'model', value: 'gpt-4-turbo-preview' },
            {
              name: 'initial_messages',
              value: assistant.systemPrompt ? [
                {
                  role: 'system',
                  content: assistant.systemPrompt
                }
              ] : []
            }
          ]
        },
        {
          service: 'tts',
          options: [
            { 
              name: 'voice', 
              value: assistant.voiceId || '3f4ade23-6eb4-4279-ab05-6a144947c4d5'
            },
            {
              name: 'speed',
              value: assistant.voiceSettings?.speed || 1
            },
            {
              name: 'pitch',
              value: assistant.voiceSettings?.pitch || 1
            },
            {
              name: 'stability',
              value: assistant.voiceSettings?.stability || 1
            },
            {
              name: 'volume',
              value: assistant.voiceSettings?.volume || 1
            }
          ]
        },
        {
          service: 'stt',
          options: [
            { name: 'model', value: 'nova-2-general' },
            { name: 'language', value: 'en' },
            {
              name: 'vad_config',
              value: {
                pause_threshold: 1000,
                silence_threshold: 500
              }
            }
          ]
        }
      ]
    };
  },

  // List all assistants
  async listAssistants(): Promise<DailyBotsAssistant[]> {
    try {
      const response = await apiClient.get('/assistants');
      
      if (!response.data || !response.data.success) {
        throw new Error('Failed to fetch assistants: ' + (response.data?.error?.message || 'Unknown error'));
      }

      return response.data.data.items;
    } catch (error) {
      console.error('Error listing assistants:', error);
      throw error;
    }
  },

  // Start a bot based on assistant configuration
  async startBot(assistant: DailyBotsAssistant): Promise<DailyBotsAssistant> {
    // Ensure the assistant has an ID
    if (!assistant.id) {
      assistant.id = this.generateAssistantId();
    }

    // Validate configuration before making the API call
    if (!this.validateConfig()) {
      throw new Error('DailyBots configuration is incomplete');
    }

    try {
      const apiKey = process.env.DAILY_BOTS_API_KEY || process.env.VITE_DAILYBOTS_API_KEY;
      const apiUrl = `${this.baseUrl}/bots/start`;

      // Convert assistant to bot configuration
      const botConfig = this.convertAssistantToBotConfig(assistant);

      console.log('Starting DailyBots Bot:', {
        id: assistant.id,
        name: assistant.name,
        botProfile: botConfig.bot_profile
      });

      const response = await axios.post<DailyBotStartResponse>(apiUrl, botConfig, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000  // 10 seconds
      });

      // Update the assistant with the Daily.co session ID
      assistant.dailyBotsSessionId = response.data.session_id;
      assistant.createdAt = new Date();
      assistant.updatedAt = new Date();

      console.log('DailyBots Bot Start Response:', response.data);

      // Return the updated assistant
      return assistant;
    } catch (error) {
      console.error('Error starting DailyBots bot:', error);
      
      // Provide more detailed error information
      if (axios.isAxiosError(error)) {
        console.error('Axios Error Details:', {
          response: error.response?.data,
          status: error.response?.status,
          headers: error.response?.headers,
          request: error.request,
          message: error.message
        });
      } else {
        console.error('Unknown Error:', error);
      }

      throw error;
    }
  },

  // Create a new assistant
  async createAssistant(assistant: DailyBotsAssistant): Promise<DailyBotsAssistant> {
    try {
      console.log('Creating Assistant:', {
        id: assistant.id,
        name: assistant.name,
        systemPrompt: assistant.systemPrompt,
        firstMessage: assistant.firstMessage
      });

      const response = await apiClient.post('/assistants', {
        name: assistant.name,
        systemPrompt: assistant.systemPrompt,
        firstMessage: assistant.firstMessage || 'Hello! How can I assist you today?',
        provider: assistant.provider || 'ANTHROPIC',
        model: assistant.model || 'claude-instant',
        tools: assistant.tools || [],
        voiceProvider: assistant.voiceProvider || 'CARTESIA',
        voiceId: assistant.voiceId,
        voiceSettings: assistant.voiceSettings || {
          speed: 1,
          pitch: 1,
          stability: 0.75,
          volume: 0.75
        }
      });

      console.log('Assistant Creation Response:', response.data);

      // Validate response
      if (!response.data || !response.data.success) {
        throw new Error('Failed to create assistant: ' + (response.data?.error?.message || 'Unknown error'));
      }

      // Return the created assistant
      return response.data.data;
    } catch (error) {
      console.error('Error creating assistant:', error);
      throw error;
    }
  }
};
