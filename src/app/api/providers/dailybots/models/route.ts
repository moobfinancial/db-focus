import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5175';
const ALLOWED_ORIGINS = [
  'http://localhost:3000', 
  'http://localhost:3001', 
  'http://localhost:5175', 
  'http://localhost:5176', 
  FRONTEND_URL
];

// Logging function
function logRequest(message: string, details?: any) {
  console.log(`[Daily Bots Models Route] ${message}`, details || '');
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin') || '';
  const isAllowedOrigin = ALLOWED_ORIGINS.includes(origin);

  logRequest('OPTIONS request received', { origin, isAllowedOrigin });

  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': isAllowedOrigin ? origin : ALLOWED_ORIGINS[0],
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function GET(request: NextRequest) {
  const headersList = headers();
  const origin = headersList.get('origin') || request.headers.get('origin') || '';
  const isAllowedOrigin = ALLOWED_ORIGINS.includes(origin);

  logRequest('GET request received', { 
    origin, 
    isAllowedOrigin,
    fullHeaders: Object.fromEntries(headersList.entries())
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

    logRequest('Returning models', { modelCount: models.length });

    return NextResponse.json(models, {
      headers: {
        'Access-Control-Allow-Origin': isAllowedOrigin ? origin : ALLOWED_ORIGINS[0],
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
  } catch (error) {
    logRequest('Error processing request', { error });
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      }, 
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': isAllowedOrigin ? origin : ALLOWED_ORIGINS[0],
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      }
    );
  }
}
