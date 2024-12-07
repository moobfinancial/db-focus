import express, { Request, Response, NextFunction } from 'express';
import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { generateToken } from '../lib/jwt';
import { hashPassword, comparePasswords } from '../lib/auth';
import { validateLoginInput, validateRegisterInput } from '../lib/validation';
import { authenticate } from '../middleware/auth';

// Extend the Express Request interface to include custom properties
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
      token?: string;
    }
  }
}

const router = Router();

// Register
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('Registration attempt received:', JSON.stringify(req.body, null, 2));

    const validation = validateRegisterInput(req.body);
    if (!validation.success) {
      console.error('Registration validation failed:', validation.error);
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: validation.error.issues,
        },
      });
    }

    const { email, password, name } = validation.data;

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    // Check for existing user
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      console.warn(`Registration attempt with existing email: ${normalizedEmail}`);
      return res.status(409).json({
        success: false,
        error: {
          code: 'EMAIL_EXISTS',
          message: 'Email already registered',
        },
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user with comprehensive settings
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        name,
        role: 'USER',
        settings: {
          defaultTransparencyLevel: 'FULL',
          recordingEnabled: true,
          webSearchEnabled: false,
          preferredVoice: 'male',
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    console.log(`User registered successfully: ${user.email}`);

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      user,
      token,
    });
  } catch (error) {
    console.error('Registration error:', error);
    next(error);
  }
});

// Login
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('Login attempt received:', JSON.stringify({ email: req.body.email, hasPassword: !!req.body.password }, null, 2));

    const validation = validateLoginInput(req.body);
    if (!validation.success) {
      console.error('Login validation failed:', validation.error);
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid login credentials',
          details: validation.error.issues,
        },
      });
    }

    const { email, password } = validation.data;
    const normalizedEmail = email.trim().toLowerCase();

    console.log('Normalized Email:', normalizedEmail);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        password: true,
        role: true,
        name: true,
        createdAt: true,
        updatedAt: true
      }
    });

    console.log('User found:', user);

    if (!user) {
      console.error('Login failed: User not found:', normalizedEmail);
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
    }

    // Verify password
    const isValidPassword = await comparePasswords(password, user.password);
    if (!isValidPassword) {
      console.error('Login failed: Invalid password for user:', normalizedEmail);
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
    }

    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    // Remove sensitive data
    const { password: _, ...safeUser } = user;

    console.log('Login successful for user:', normalizedEmail);
    
    res.json({
      success: true,
      user: safeUser,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    next(error);
  }
});

// Get current user
router.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, role: true }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
});

export default router;