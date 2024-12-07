import { rest } from 'msw';

const API_URL = 'http://localhost:3000/api';

export const handlers = [
  // Login handler
  rest.post(`${API_URL}/auth/login`, async (req, res, ctx) => {
    const { email, password } = await req.json();

    if (email === 'admin@example.com' && password === 'admin123') {
      return res(
        ctx.status(200),
        ctx.json({
          success: true,
          data: {
            user: {
              id: '1',
              email: 'admin@example.com',
              name: 'Admin User',
              role: 'ADMIN',
            },
            token: 'mock-jwt-token',
          },
        })
      );
    }

    return res(
      ctx.status(401),
      ctx.json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
      })
    );
  }),

  // Register handler
  rest.post(`${API_URL}/auth/register`, async (req, res, ctx) => {
    const { email, password, name } = await req.json();

    if (!email || !password || !name) {
      return res(
        ctx.status(400),
        ctx.json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'All fields are required',
          },
        })
      );
    }

    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          user: {
            id: '2',
            email,
            name,
            role: 'USER',
          },
          token: 'mock-jwt-token',
        },
      })
    );
  }),

  // Me handler
  rest.get(`${API_URL}/auth/me`, (req, res, ctx) => {
    const token = req.headers.get('Authorization');

    if (!token || !token.startsWith('Bearer ')) {
      return res(
        ctx.status(401),
        ctx.json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        })
      );
    }

    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          user: {
            id: '1',
            email: 'admin@example.com',
            name: 'Admin User',
            role: 'ADMIN',
          },
        },
      })
    );
  }),
];
