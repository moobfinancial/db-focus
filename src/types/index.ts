export interface Assistant {
  id: string;
  name: string;
  firstMessage: string;
  systemPrompt: string;
  tools: any[];
  modes: string[];
  provider: string;
  model: string;
  voice?: {
    provider: string;
    voiceId: string;
    settings: {
      speed: number;
      pitch: number;
      stability: number;
      volume: number;
    };
  };
  providerConfig?: {
    dailyBots?: {
      apiKey: string;
      projectId: string;
      customSettings: any;
    };
    rtvi?: {
      apiKey: string;
      organizationId: string;
      customSettings: any;
    };
  };
}

export interface ApiError {
  code: 'API_ERROR' | 'NETWORK_ERROR' | 'UNKNOWN_ERROR';
  message: string;
  details?: string;
}

export interface Voice {
  id: string;
  name: string;
  gender: string;
  nationality: string;
  language: string;
  provider: string;
  traits: string[];
  isCloned: boolean;
  audioUrl?: string;
}

export interface Model {
  id: string;
  name: string;
  description: string;
  provider: string;
  pricing: {
    prompt: number;
    completion: number;
  };
  context_length: number;
  features?: string[];
  capabilities?: string[];
}
