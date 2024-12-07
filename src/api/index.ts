import express from 'express';
import cors from 'cors';
import { authenticate } from './middleware/auth';
import { errorHandler } from './middleware/error';
import usersRouter from './routes/users';
import assistantsRouter from './routes/assistants';
import providersRouter from './routes/providers';
import contactsRouter from './routes/contacts';

const app = express();

// CORS configuration
const allowedOrigins = process.env.NODE_ENV === 'development'
  ? ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176']
  : [process.env.FRONTEND_URL];

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Debug logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  console.log('Headers:', req.headers);
  next();
});

// Pre-flight requests
app.options('*', cors());

// Authentication
app.use(authenticate);

// Routes
app.use('/api/users', usersRouter);
app.use('/api/assistants', assistantsRouter);
app.use('/api/providers', providersRouter);
app.use('/api/contacts', contactsRouter);

// Error handling
app.use(errorHandler);

export default app;