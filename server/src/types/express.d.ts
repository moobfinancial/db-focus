import { User as PrismaUser } from '@prisma/client';

// Extend Express Request interface
declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      role: string;
    }

    interface Request {
      user?: User;
      token?: string;
      file?: Multer.File;
    }
  }
}
