import { Request, Response } from 'express';

const ALLOWED_ORIGINS = [
  'http://localhost:3000', 
  'http://localhost:3001', 
  'http://localhost:5175', 
  'http://localhost:5176',
  'http://localhost:5179'
];

export function getDailyBotsModels(req: Request, res: Response) {
  const origin = req.headers.origin || '';
  const isAllowedOrigin = ALLOWED_ORIGINS.includes(origin);

  console.log('[Daily Bots Models Route] GET request received', { 
    origin, 
    isAllowedOrigin
  });

  try {
    const models = [
      { 
        id: 'gpt-3.5-turbo', 
        name: 'GPT-3.5 Turbo',
        pricing: {
          prompt: 0.0015,
          completion: 0.002
        },
        context_length: 4096,
        capabilities: ['text generation', 'conversation']
      },
      { 
        id: 'gpt-4', 
        name: 'GPT-4',
        pricing: {
          prompt: 0.03,
          completion: 0.06
        },
        context_length: 8192,
        capabilities: ['advanced reasoning', 'complex tasks']
      },
      { 
        id: 'gpt-4-turbo', 
        name: 'GPT-4 Turbo',
        pricing: {
          prompt: 0.01,
          completion: 0.03
        },
        context_length: 128000,
        capabilities: ['large context', 'advanced reasoning']
      },
    ];

    console.log('[Daily Bots Models Route] Returning models', { modelCount: models.length });

    res.header('Access-Control-Allow-Origin', isAllowedOrigin ? origin : ALLOWED_ORIGINS[0]);
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    res.json(models);
  } catch (error) {
    console.error('[Daily Bots Models Route] Error processing request', { error });
    
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

export function optionsDailyBotsModels(req: Request, res: Response) {
  const origin = req.headers.origin || '';
  const isAllowedOrigin = ALLOWED_ORIGINS.includes(origin);

  console.log('[Daily Bots Models Route] OPTIONS request received', { origin, isAllowedOrigin });

  res.header('Access-Control-Allow-Origin', isAllowedOrigin ? origin : ALLOWED_ORIGINS[0]);
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Max-Age', '86400');
  
  res.status(204).send();
}
