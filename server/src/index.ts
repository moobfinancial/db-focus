import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import fs from 'fs';
import { errorHandler } from './middleware/error';
import authRoutes from './routes/auth';
import contactRoutes from './routes/contacts';
import goalRoutes from './routes/goals';
import providersRoutes from './routes/providers';
import assistantsRoutes from './routes/assistants';
import dailyRoutes from './routes/daily';
import campaignsRoutes from './routes/campaigns';

// Configure dotenv
dotenv.config();

// Log environment variables (safely)
console.log('Environment Check:');
console.log('- Daily Bots URL:', process.env.DAILY_BOTS_URL ? '✓' : '✗');
console.log('- Daily Bots API Key:', process.env.DAILY_BOTS_API_KEY ? '✓' : '✗');
console.log('- OpenAI API Key:', process.env.OPENAI_API_KEY ? '✓' : '✗');
console.log('- Cartesia API Key:', process.env.CARTESIA_API_KEY ? '✓' : '✗');
console.log('- Deepgram API Key:', process.env.DEEPGRAM_API_KEY ? '✓' : '✗');

// Verify required environment variables
const requiredEnvVars = {
  'DAILY_BOTS_URL': process.env.DAILY_BOTS_URL,
  'DAILY_BOTS_API_KEY': process.env.DAILY_BOTS_API_KEY,
  'OPENAI_API_KEY': process.env.OPENAI_API_KEY,
  'CARTESIA_API_KEY': process.env.CARTESIA_API_KEY,
  'DEEPGRAM_API_KEY': process.env.DEEPGRAM_API_KEY
};

const missingEnvVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:');
  missingEnvVars.forEach(key => console.error(`- ${key}`));
  process.exit(1);
}

// Optional API keys (log presence but don't require)
const optionalApiKeys = {
  'GROK_API_KEY': process.env.GROK_API_KEY,
  'GEMINI_API_KEY': process.env.GEMINI_API_KEY
};

Object.entries(optionalApiKeys).forEach(([key, value]) => {
  console.log(`- ${key}: ${value ? '✓' : '(optional)'}`);
});

const app = express();
const port = process.env.PORT || 3000;

// Configure CORS
app.use(cors({
  origin: ['http://localhost:5175', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
  ],
}));

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "same-origin" },
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      fontSrc: ["'self'", "data:"],
      connectSrc: ["'self'", "https://api.example.com"],
      frameSrc: ["'self'", "https://example.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: ["'upgrade-insecure-requests'"]
    }
  } : false
}));

app.use(morgan('combined', {
  stream: {
    write: (message) => {
      fs.appendFileSync('/Users/boommac/Documents/db-focus/server/logs/server.log', message);
    }
  }
}));

app.use(express.json()); // JSON parsing middleware
app.use(express.urlencoded({ extended: true })); // URL-encoded parsing

// Simple middleware for request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} from origin: ${req.headers.origin || 'no origin'}`);
  next();
});

// Remove X-Powered-By header for security
app.disable('x-powered-by');

// API Routes with /api prefix
const apiRouter = express.Router();

// Add routes to the API router
apiRouter.use('/auth', authRoutes);
apiRouter.use('/contacts', contactRoutes);
apiRouter.use('/goals', goalRoutes);
apiRouter.use('/providers', providersRoutes);
apiRouter.use('/assistants', assistantsRoutes);
apiRouter.use('/daily', dailyRoutes);
apiRouter.use('/campaigns', campaignsRoutes);

// Mount the API router
app.use('/api', apiRouter);

// Error handling
app.use(errorHandler);

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app;