import request from 'supertest';
import app from '../index';
import { prisma } from '../lib/prisma';
import { hashPassword } from '../lib/auth';

describe('Authentication Login', () => {
  let testUser: { 
    id: string, 
    email: string, 
    password: string 
  };

  beforeAll(async () => {
    // Create a test user with a known password
    const hashedPassword = await hashPassword('testpassword123');
    testUser = await prisma.user.create({
      data: {
        email: 'testlogin@example.com',
        password: hashedPassword,
        name: 'Test User',
        settings: {
          defaultTransparencyLevel: 'FULL',
          recordingEnabled: true,
          webSearchEnabled: false,
          preferredVoice: 'male',
        },
      }
    });
  });

  afterAll(async () => {
    // Clean up test user
    await prisma.user.delete({
      where: { id: testUser.id }
    });
  });

  it('should not allow login with incorrect password', async () => {
    console.log('Test: Incorrect password login');
    const response = await request(app)
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: 'wrongpassword'
      });

    console.log('Response status:', response.status);
    console.log('Response body:', response.body);

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('should not allow login with non-existent email', async () => {
    console.log('Test: Non-existent email login');
    const response = await request(app)
      .post('/auth/login')
      .send({
        email: 'nonexistent@example.com',
        password: 'anypassword'
      });

    console.log('Response status:', response.status);
    console.log('Response body:', response.body);

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('should allow login with correct credentials', async () => {
    console.log('Test: Correct credentials login');
    const response = await request(app)
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: 'testpassword123'
      });

    console.log('Response status:', response.status);
    console.log('Response body:', response.body);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.email).toBe(testUser.email);
    expect(response.body.data.token).toBeDefined();
  });
});
