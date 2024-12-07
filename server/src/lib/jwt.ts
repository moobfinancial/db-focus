import * as jwt from 'jsonwebtoken';
import { User } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret';

if (!process.env.JWT_SECRET) {
  console.warn('JWT_SECRET is not set. Using fallback secret which is insecure!');
}

export const generateToken = (user: { id: string; email: string; role?: string }) => {
  return jwt.sign(
    { 
      userId: user.id, 
      email: user.email,
      role: user.role
    }, 
    JWT_SECRET, 
    { 
      expiresIn: '24h',
      algorithm: 'HS256'
    }
  );
};

export const verifyToken = (token: string) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
      maxAge: '24h'
    });

    if (typeof decoded !== 'object' || !decoded) {
      throw new Error('Invalid token structure');
    }

    return decoded;
  } catch (error) {
    console.error('Token verification error:', error);
    throw error;
  }
};
