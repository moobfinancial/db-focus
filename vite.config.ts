import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import express from 'express';

const dailyBotsModels = [
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

export default defineConfig(({ mode }) => {
  // Load env file based on `mode`
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    // Explicitly define environment variables
    define: {
      'process.env.VITE_CARTESIA_API_KEY': JSON.stringify(env.VITE_CARTESIA_API_KEY),
      'process.env.CARTESIA_API_KEY': JSON.stringify(env.CARTESIA_API_KEY)
    },
    
    plugins: [
      react(),
      {
        name: 'cors-plugin',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
            if (req.method === 'OPTIONS') {
              res.statusCode = 204;
              res.end();
            } else {
              next();
            }
          });
        }
      },
      {
        name: 'custom-server',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (req.url === '/api/providers/dailybots/models') {
              const origin = req.headers.origin || '';
              const ALLOWED_ORIGINS = [
                'http://localhost:3000', 
                'http://localhost:3001', 
                'http://localhost:5175', 
                'http://localhost:5176',
                'http://localhost:5179'
              ];
              const isAllowedOrigin = ALLOWED_ORIGINS.includes(origin);

              res.setHeader('Access-Control-Allow-Origin', isAllowedOrigin ? origin : ALLOWED_ORIGINS[0]);
              res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
              res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
              
              if (req.method === 'OPTIONS') {
                res.statusCode = 204;
                res.end();
                return;
              }

              if (req.method === 'GET') {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(dailyBotsModels));
                return;
              }
            }
            next();
          });
        }
      }
    ],
    
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
          ws: true,
        }
      },
      port: parseInt(env.VITE_PORT || '5175'),
      open: true,
    },
  };
});