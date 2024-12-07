import axios, { AxiosRequestConfig } from 'axios';

// Get the base API URL from environment variables
const API_BASE_URL = 'http://localhost:3000/api';

// Create an axios instance with base configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Define a more specific error type
interface ApiError extends Error {
  response?: {
    status: number;
    data: ErrorResponse;
  };
}

interface ErrorResponse {
  error?: {
    message?: string;
    code?: string;
  };
}

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
  (config) => {
    // Ensure headers object exists
    config.headers = config.headers || {};
    
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      config: error.config
    });

    // Handle network errors
    if (!error.response) {
      return Promise.reject({
        ...error,
        message: 'Network error. Please check your connection.'
      });
    }

    // Handle specific HTTP status codes
    switch (error.response.status) {
      case 401:
        // Handle unauthorized
        console.warn('Unauthorized request - clearing token');
        localStorage.removeItem('token');
        break;
      case 403:
        console.warn('Forbidden request');
        break;
      case 429:
        console.warn('Rate limit exceeded');
        break;
    }

    return Promise.reject(error);
  }
);

// Generic API request wrapper with improved type safety
async function apiRequest<T = any>(
  method: 'get' | 'post' | 'put' | 'delete',
  url: string, 
  data?: any, 
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await apiClient.request<T>({
    method,
    url,
    data,
    ...config
  });
  return response.data;
}

// Specific method shortcuts with return type annotations
const get = <T = any>(url: string, config?: AxiosRequestConfig) => 
  apiRequest<T>('get', url, undefined, config);

const post = <T = any>(url: string, data: any, config?: AxiosRequestConfig) => 
  apiRequest<T>('post', url, data, config);

const put = <T = any>(url: string, data: any, config?: AxiosRequestConfig) => 
  apiRequest<T>('put', url, data, config);

const del = <T = any>(url: string, config?: AxiosRequestConfig) => 
  apiRequest<T>('delete', url, undefined, config);

// DailyBots API functions
interface StartConversationSuccess {
  success: true;
  daily: any;
  sessionId: string;
}

interface StartConversationError {
  success: false;
  error: string;
}

type StartConversationResponse = StartConversationSuccess | StartConversationError;

interface VoiceSettings {
  speed?: number;
  pitch?: number;
  stability?: number;
  volume?: number;
  voiceId?: string;
}

const dailybotsApi = {
  startConversation: async (
    id: string, 
    options: {
      maxDuration?: number;
      pauseThreshold?: number;
      silenceThreshold?: number;
      voiceSettings?: VoiceSettings;
      systemPrompt?: string;
      firstMessage?: string;
    }
  ): Promise<StartConversationResponse> => {
    try {
      // First, request microphone permissions
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop()); // Stop the test stream
      } catch (error) {
        console.error('Microphone permission denied:', error);
        return {
          success: false,
          error: 'Microphone permission is required for the conversation'
        };
      }

      // Initialize Daily.co frame first
      const daily = await (window as any).DailyIframe.createFrame({
        iframeStyle: {
          position: 'fixed',
          top: '-100px',
          left: '-100px',
          width: '1px',
          height: '1px',
          border: 'none'
        },
        showLeaveButton: false,
        showFullscreenButton: false
      });

      // Prepare RTVI configuration
      const rtviConfig = {
        bot_profile: "voice_2024_10",
        max_duration: options.maxDuration || 300,
        services: {
          tts: "cartesia",
          llm: "openai",
          stt: "deepgram"
        },
        config: [
          {
            service: "llm",
            options: [
              { name: "model", value: "gpt-4-turbo-preview" },
              {
                name: "initial_messages",
                value: options.systemPrompt ? [
                  {
                    role: "system",
                    content: options.systemPrompt
                  }
                ] : []
              }
            ]
          },
          {
            service: "tts",
            options: [
              { name: "voice", value: options.voiceSettings?.voiceId || "3f4ade23-6eb4-4279-ab05-6a144947c4d5" },
              { name: "speed", value: options.voiceSettings?.speed || 1 },
              { name: "pitch", value: options.voiceSettings?.pitch || 1 },
              { name: "stability", value: options.voiceSettings?.stability || 1 },
              { name: "volume", value: options.voiceSettings?.volume || 1 }
            ]
          },
          {
            service: "stt",
            options: [
              { name: "model", value: "nova-2-general" },
              { name: "language", value: "en" },
              { 
                name: "vad_config", 
                value: {
                  pause_threshold: options.pauseThreshold || 1000,
                  silence_threshold: options.silenceThreshold || 500
                }
              }
            ]
          }
        ]
      };

      const payload = {
        assistantId: id,
        rtvi: {
          services: rtviConfig.services,
          config: rtviConfig.config
        }
      };

      console.log('Starting conversation with params:', payload);
      
      // Make the API call after Daily.co frame is initialized
      const response = await post<{ sessionId: string; roomUrl: string; token: string }>('/daily/start', payload);

      // Configure the frame with the room URL and token
      await daily.setNetworkTopology('sfu');
      await daily.properties.setOutputDevice({ outputDeviceId: 'default' });
      await daily.properties.setInputDevice({ audioDeviceId: 'default' });
      
      // Join the meeting
      await daily.join({ url: response.roomUrl, token: response.token });

      return {
        success: true,
        daily,
        sessionId: response.sessionId
      };
    } catch (error) {
      console.error('Error starting conversation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to start conversation'
      };
    }
  },
  
  // Pause the conversation
  pauseConversation: async (sessionId: string) => {
    return apiRequest('post', `/daily/pause/${sessionId}`);
  },

  // Resume the conversation
  resumeConversation: async (sessionId: string) => {
    return apiRequest('post', `/daily/resume/${sessionId}`);
  },

  // End the conversation and leave the call
  endConversation: async (sessionId: string, daily: any) => {
    try {
      await daily.leave();
      daily.destroy();
    } catch (error) {
      console.error('Error leaving Daily call:', error);
    }
    return apiRequest('post', `/daily/end/${sessionId}`);
  }
};

// Function to check if an assistant exists via API
async function checkAssistantExists(assistantId: string) {
  try {
    const response = await get(`/assistants/${assistantId}`);
    return response.exists;
  } catch (error) {
    return false;
  }
}

export {
  apiClient,
  dailybotsApi,
  checkAssistantExists,
  get,
  post,
  put,
  del as delete,
  type StartConversationResponse
};