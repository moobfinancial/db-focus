import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { hashPassword, comparePasswords } from '../lib/auth';
import { generateToken } from '../lib/jwt';
import app from '../index'; // Adjust this import to your actual server app

const prisma = new PrismaClient();

describe('Authentication System', () => {
  let adminUser: any;
  let validToken: string;

  beforeAll(async () => {
    try {
      // Ensure a test admin user exists
      const existingUser = await prisma.user.findUnique({ 
        where: { email: 'admin@example.com' } 
      });

      if (!existingUser) {
        console.log('Creating new admin user');
        adminUser = await prisma.user.create({
          data: {
            email: 'admin@example.com',
            password: await hashPassword('admin123'),
            name: 'Test Admin',
            role: 'ADMIN',
            settings: {
              defaultTransparencyLevel: 'FULL',
              recordingEnabled: true,
              webSearchEnabled: false,
              preferredVoice: 'male'
            }
          }
        });
      } else {
        console.log('Admin user already exists');
        adminUser = existingUser;
      }

      console.log('Admin user details:', JSON.stringify(adminUser, null, 2));

      // Verify password
      const passwordMatch = await comparePasswords('admin123', adminUser.password);
      console.log('Password verification:', passwordMatch);

      // Generate a valid token for tests
      validToken = generateToken({
        id: adminUser.id,
        email: adminUser.email
      });

      console.log('Valid token generated');
    } catch (error) {
      console.error('Error in beforeAll setup:', error);
      throw error;
    }
  }, 10000);

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Login Route', () => {
    it('should reject login with incorrect credentials', async () => {
      console.log('Attempting login with incorrect credentials');
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'wrongpassword'
        });

      console.log('Login response for incorrect credentials:', response.status, JSON.stringify(response.body, null, 2));

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should successfully login with correct credentials', async () => {
      console.log('Attempting login with correct credentials');
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'admin123'
        });

      console.log('Login response for correct credentials:', response.status, JSON.stringify(response.body, null, 2));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.email).toBe('admin@example.com');
    });

    it('should normalize email inputs', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: '  ADMIN@example.com  ',
          password: 'admin123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Authentication Middleware', () => {
    it('should reject requests without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', '');

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject requests with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalidtoken');

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });

    it('should allow access with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('admin@example.com');
    });
  });

  describe('Role-Based Access Control', () => {
    it('should prevent non-admin access to admin routes', async () => {
      // Create a non-admin user
      const nonAdminUser = await prisma.user.create({
        data: {
          email: 'user@example.com',
          password: await hashPassword('password123'),
          name: 'Test User',
          role: 'USER',
          settings: {}
        }
      });

      const nonAdminToken = generateToken({
        id: nonAdminUser.id,
        email: nonAdminUser.email
      });

      const response = await request(app)
        .get('/api/admin/dashboard')  // Adjust this to match your actual admin route
        .set('Authorization', `Bearer ${nonAdminToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('FORBIDDEN');

      // Clean up
      await prisma.user.delete({ where: { id: nonAdminUser.id } });
    });
  });
});
