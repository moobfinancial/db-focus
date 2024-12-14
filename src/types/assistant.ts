export type LLMProvider = 'DAILY_BOTS' | 'OPEN_ROUTER' | 'ANTHROPIC' | 'OPEN_AI';
export type VoiceProvider = 'CARTESIA' | 'ELEVEN_LABS' | 'DEEP_GRAM';

export interface Assistant {
  id: string;
  userId: string;
  name: string;
  systemPrompt: string;
  firstMessage: string | null;
  provider: LLMProvider;
  model: string;
  tools: string[];
  voiceProvider: VoiceProvider;
  voiceId: string;
  voiceSettings: {
    speed?: number;
    pitch?: number;
    stability?: number;
    volume?: number;
    sampleRate?: number;
  } | null;
  language: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}
