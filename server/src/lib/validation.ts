import { z } from 'zod';

const loginSchema = z.object({
  email: z.string()
    .trim()
    .toLowerCase()
    .email('Invalid email format')
    .min(5, 'Email must be at least 5 characters'),
  password: z.string()
    .trim()
    .min(1, 'Password is required')
});

const registerSchema = loginSchema.extend({
  name: z.string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be at most 50 characters')
});

const voiceSettingsSchema = z.object({
  speed: z.number().optional().default(1),
  pitch: z.number().optional().default(1),
  stability: z.number().optional().default(0.75),
  volume: z.number().optional().default(0.75),
  sampleRate: z.number().optional().default(24000)
}).optional();

const allowedTools = ['Calendar Integration', 'Scraping Tool', 'Send SMS'] as const;

const llmProviderEnum = z.enum(['DAILY_BOTS', 'OPEN_ROUTER', 'ANTHROPIC', 'OPEN_AI']);
const voiceProviderEnum = z.enum(['CARTESIA', 'ELEVEN_LABS', 'DEEP_GRAM']);
const toolsEnum = z.enum(allowedTools);

const assistantSchema = z.object({
  name: z.string()
    .trim()
    .min(2, 'Assistant name must be at least 2 characters')
    .max(50, 'Assistant name must be at most 50 characters'),
  systemPrompt: z.string()
    .trim()
    .min(10, 'System prompt must be at least 10 characters')
    .max(1000, 'System prompt must be at most 1000 characters'),
  firstMessage: z.string()
    .trim()
    .max(500, 'First message must be at most 500 characters')
    .optional(),
  provider: llmProviderEnum
    .transform(val => val.toUpperCase() as keyof typeof llmProviderEnum)
    .optional()
    .default('DAILY_BOTS'),
  model: z.string()
    .optional()
    .default('dailybots-default'),
  tools: z.array(toolsEnum)
    .optional()
    .default([]),
  voiceProvider: voiceProviderEnum
    .transform(val => val.toUpperCase() as keyof typeof voiceProviderEnum)
    .optional()
    .default('CARTESIA'),
  voiceId: z.string()
    .optional()
    .default('professional_male'),
  voiceSettings: voiceSettingsSchema
    .optional()
    .default({
      speed: 1,
      pitch: 1,
      stability: 0.75,
      volume: 0.75,
      sampleRate: 24000
    })
});

export const validateLoginInput = (data: unknown) => {
  return loginSchema.safeParse(data);
};

export const validateRegisterInput = (data: unknown) => {
  return registerSchema.safeParse(data);
};

export const validateAssistant = (data: unknown) => {
  return assistantSchema.safeParse(data);
};
