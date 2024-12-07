import request from 'supertest';
import app from '../index';
import { prisma } from '../lib/prisma';
import jwt from 'jsonwebtoken';

// Mock the Prisma client and JWT verification
jest.mock('../lib/prisma', () => ({
  prisma: {
    goal: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    contactGoal: {
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

// Mock JWT secret (use the same secret as in your actual auth middleware)
const JWT_SECRET = process.env.JWT_SECRET || 'test_secret';

describe('Goals Routes Authentication', () => {
  let validUserToken: string;
  // @ts-ignore - This variable will be used in future tests
  let invalidUserToken: string;

  beforeAll(() => {
    // Create a valid user token
    validUserToken = jwt.sign(
      { 
        id: 'user123', 
        email: 'test@example.com', 
        role: 'USER' 
      }, 
      JWT_SECRET, 
      { expiresIn: '1h' }
    );

    // Create an invalid user token
    invalidUserToken = jwt.sign(
      { 
        id: 'user456', 
        email: 'invalid@example.com', 
        role: 'INVALID' 
      }, 
      'wrong_secret'
    );
  });

  // Test GET /goals route
  describe('GET /goals', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get('/goals')
        .expect(401);
      
      expect(response.body.message).toBe('Unauthorized');
    });

    it('should return goals for authenticated user', async () => {
      // Mock the Prisma findMany method
      (prisma.goal.findMany as jest.Mock).mockResolvedValue([
        { id: 'goal1', userId: 'user123', title: 'Test Goal' }
      ]);

      const response = await request(app)
        .get('/goals')
        .set('Authorization', `Bearer ${validUserToken}`)
        .expect(200);
      
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body[0].title).toBe('Test Goal');
    });
  });

  // Test POST /goals route
  describe('POST /goals', () => {
    const validGoalData = {
      type: 'PERSONAL',
      title: 'Test Goal',
      priority: 1,
      description: 'A test goal',
      prompt: 'Goal prompt',
      successCriteria: 'Success criteria',
      category: 'HEALTH'
    };

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/goals')
        .send(validGoalData)
        .expect(401);
      
      expect(response.body.message).toBe('Unauthorized');
    });

    it('should create a goal for authenticated user', async () => {
      // Mock the Prisma create method
      (prisma.goal.create as jest.Mock).mockResolvedValue({
        ...validGoalData,
        id: 'newGoal123',
        userId: 'user123'
      });

      const response = await request(app)
        .post('/goals')
        .set('Authorization', `Bearer ${validUserToken}`)
        .send(validGoalData)
        .expect(201);
      
      expect(response.body.id).toBe('newGoal123');
      expect(response.body.userId).toBe('user123');
    });
  });

  // Test PUT /goals/:goalId route
  describe('PUT /goals/:goalId', () => {
    const updateGoalData = {
      title: 'Updated Goal',
      priority: 2
    };

    it('should require authentication', async () => {
      const response = await request(app)
        .put('/goals/goal123')
        .send(updateGoalData)
        .expect(401);
      
      expect(response.body.message).toBe('Unauthorized');
    });

    it('should update a goal for authenticated user', async () => {
      // Mock the Prisma update method
      (prisma.goal.update as jest.Mock).mockResolvedValue({
        ...updateGoalData,
        id: 'goal123',
        userId: 'user123'
      });

      const response = await request(app)
        .put('/goals/goal123')
        .set('Authorization', `Bearer ${validUserToken}`)
        .send(updateGoalData)
        .expect(200);
      
      expect(response.body.title).toBe('Updated Goal');
    });
  });

  // Test POST /goals/contact route
  describe('POST /goals/contact', () => {
    const contactGoalData = {
      goalId: 'goal123',
      contactId: 'contact456'
    };

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/goals/contact')
        .send(contactGoalData)
        .expect(401);
      
      expect(response.body.message).toBe('Unauthorized');
    });

    it('should create a contact goal for authenticated user', async () => {
      // Mock the Prisma create method
      (prisma.contactGoal.create as jest.Mock).mockResolvedValue({
        ...contactGoalData,
        id: 'contactGoal789',
        userId: 'user123'
      });

      const response = await request(app)
        .post('/goals/contact')
        .set('Authorization', `Bearer ${validUserToken}`)
        .send(contactGoalData)
        .expect(201);
      
      expect(response.body.id).toBe('contactGoal789');
    });
  });
});
