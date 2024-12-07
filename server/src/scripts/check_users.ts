import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../lib/auth';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function checkOrCreateAdminUser() {
  try {
    console.log('Attempting to find or create admin user...');
    
    const existingUser = await prisma.user.findUnique({
      where: { email: 'admin@example.com' }
    });

    if (existingUser) {
      console.log('Admin user already exists:', existingUser);
      return existingUser;
    }

    const hashedPassword = await hashPassword('admin123');

    const newUser = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        password: hashedPassword,
        name: 'Admin User',
        role: 'ADMIN',
        settings: {
          defaultTransparencyLevel: 'FULL',
          recordingEnabled: true,
          webSearchEnabled: false,
          preferredVoice: 'male',
        },
      }
    });

    console.log('Created new admin user:', newUser);
    return newUser;
  } catch (error) {
    console.error('Error checking/creating admin user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkOrCreateAdminUser();
