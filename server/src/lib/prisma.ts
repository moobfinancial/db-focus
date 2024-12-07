import { PrismaClient } from '@prisma/client';

// Extend the global object to avoid multiple PrismaClient instances
declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}
