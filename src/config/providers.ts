import { LLMProvider } from '@/types/assistant';

export interface ModelProvider {
  id: LLMProvider;
  name: string;
  apiEndpoint?: string;  // Optional API endpoint for fetching models
  mockModels?: Model[];  // Optional mock models for development
}

export interface Model {
  id: string;
  name: string;
  description: string;
  context_length: number;
  pricing: {
    prompt: number;
    completion: number;
  };
  capabilities: string[];
}

export interface TTSProvider {
  name: string;
  voices: {
    value: string;
    label: string;
  }[];
}

export const PROVIDERS: ModelProvider[] = [
  {
    id: 'OPEN_AI',
    name: 'OpenAI',
    mockModels: [
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        description: 'Fast and affordable GPT model',
        context_length: 4096,
        pricing: { prompt: 0.0015, completion: 0.002 },
        capabilities: ['text generation', 'conversation']
      },
      {
        id: 'gpt-4',
        name: 'GPT-4',
        description: 'Advanced reasoning model',
        context_length: 8192,
        pricing: { prompt: 0.03, completion: 0.06 },
        capabilities: ['advanced reasoning', 'complex tasks']
      }
    ]
  },
  {
    id: 'ANTHROPIC',
    name: 'Anthropic',
    mockModels: [
      {
        id: 'claude-2',
        name: 'Claude 2',
        description: 'Advanced language model with strong reasoning capabilities',
        context_length: 100000,
        pricing: { prompt: 0.008, completion: 0.024 },
        capabilities: ['text generation', 'analysis', 'coding']
      },
      {
        id: 'claude-instant',
        name: 'Claude Instant',
        description: 'Fast and efficient language model',
        context_length: 100000,
        pricing: { prompt: 0.0008, completion: 0.0024 },
        capabilities: ['text generation', 'conversation']
      }
    ]
  }
];

export const TTS_PROVIDERS: TTSProvider[] = [
  {
    name: 'Cartesia',
    voices: [
      { value: 'default', label: 'Default Voice' },
      { value: 'professional_male', label: 'Professional Male' },
      { value: 'professional_female', label: 'Professional Female' }
    ]
  },
  {
    name: 'Eleven Labs',
    voices: [
      { value: 'rachel', label: 'Rachel' },
      { value: 'john', label: 'John' },
      { value: 'sarah', label: 'Sarah' }
    ]
  },
  {
    name: 'Play HT',
    voices: [
      { value: 'male1', label: 'Male Voice 1' },
      { value: 'female1', label: 'Female Voice 1' }
    ]
  }
];
