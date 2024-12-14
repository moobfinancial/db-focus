import { 
  defaultBotProfile, 
  defaultMaxDuration, 
  defaultServices 
} from '@/config/rtvi.config';

const ALLOWED_ORIGINS = [
  'http://localhost:5176', 
  'http://localhost:3000', 
  'http://localhost:5173'
];

export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin') || '';
  const isAllowedOrigin = ALLOWED_ORIGINS.includes(origin);

  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': isAllowedOrigin ? origin : ALLOWED_ORIGINS[0],
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin') || '';
  const isAllowedOrigin = ALLOWED_ORIGINS.includes(origin);

  // CORS headers function to reduce repetition
  const getCorsHeaders = () => ({
    'Access-Control-Allow-Origin': isAllowedOrigin ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });

  try {
    const { services, config, rtvi_client_version } = await request.json();

    // Validate required parameters
    if (!services || !config || !process.env.DAILY_BOTS_API_URL) {
      return new Response(`Services, config, or Daily Bots API URL not found`, {
        status: 400,
        headers: getCorsHeaders(),
      });
    }

    // Construct payload matching Daily Bots example
    const payload = {
      bot_profile: defaultBotProfile,
      max_duration: defaultMaxDuration,
      services: { ...defaultServices, ...services },
      api_keys: {
        openai: process.env.OPENAI_API_KEY,
        grok: process.env.GROK_API_KEY,
        gemini: process.env.GEMINI_API_KEY,
      },
      config: [...config],
      rtvi_client_version,
    };

    // Make request to Daily Bots API
    const req = await fetch(process.env.DAILY_BOTS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.DAILY_BOTS_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    // Parse response
    const res = await req.json();

    // Handle non-200 status codes
    if (!req.ok) {
      return Response.json(
        { error: 'Daily Bots API request failed', details: res }, 
        { 
          status: req.status,
          headers: getCorsHeaders()
        }
      );
    }

    // Successful response
    return Response.json(res, {
      headers: getCorsHeaders()
    });

  } catch (error) {
    // Catch any unexpected errors
    console.error('Daily Bots API Connection Error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: getCorsHeaders()
    });
  }
}
