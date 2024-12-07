import express, { Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';

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

const router = express.Router();

// Get all goals for a user
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const goals = await prisma.goal.findMany({
      where: { userId: req.user.id },
      include: {
        contact: true
      }
    });
    res.json(goals);
  } catch (error) {
    next(error);
  }
});

// Create a new goal
router.post('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const { 
      title, 
      description, 
      status,
      contactId 
    } = req.body;

    const goalData: Prisma.GoalUncheckedCreateInput = {
      title,
      description,
      status: status || 'ACTIVE',
      userId: req.user.id,
      contactId: contactId || null
    };

    const goal = await prisma.goal.create({
      data: goalData,
      include: {
        contact: true
      }
    });

    res.status(201).json(goal);
  } catch (error) {
    next(error);
  }
});

// Get a specific goal
router.get('/:goalId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const { goalId } = req.params;
    const goal = await prisma.goal.findUnique({
      where: { 
        id: goalId
      },
      include: {
        contact: true
      }
    });

    if (!goal || goal.userId !== req.user.id) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    res.json(goal);
  } catch (error) {
    next(error);
  }
});

// Update a goal
router.put('/:goalId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const { goalId } = req.params;
    const { 
      title, 
      description, 
      status,
      contactId 
    } = req.body;

    const goalData: Prisma.GoalUncheckedUpdateInput = {
      title,
      description,
      status,
      contactId: contactId || null
    };

    const goal = await prisma.goal.update({
      where: { 
        id: goalId
      },
      data: goalData,
      include: {
        contact: true
      }
    });

    if (goal.userId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    res.json(goal);
  } catch (error) {
    next(error);
  }
});

// Delete a goal
router.delete('/:goalId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const { goalId } = req.params;

    const goal = await prisma.goal.findUnique({
      where: { id: goalId }
    });

    if (!goal || goal.userId !== req.user.id) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    await prisma.goal.delete({
      where: { id: goalId }
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
