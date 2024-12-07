import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Get all goals for a contact
router.get('/contacts/:contactId/goals', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  const { contactId } = req.params;

  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const goals = await prisma.contactGoal.findMany({
      where: {
        contactId,
        contact: {
          userId: req.user.id
        }
      },
      include: {
        goal: true
      }
    });
    res.json(goals);
  } catch (error) {
    next(error);
  }
});

// Update contact goal status
router.patch('/contacts/:contactId/goals/:goalId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  const { contactId, goalId } = req.params;
  const { progress, feedback, status } = req.body;

  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const contactGoal = await prisma.contactGoal.update({
      where: {
        contactId_goalId: {
          contactId,
          goalId
        }
      },
      data: {
        ...(progress !== undefined && { progress }),
        ...(feedback && { feedback: { push: feedback } }),
        ...(status && { status }),
        lastUpdated: new Date()
      },
      include: {
        goal: true
      }
    });

    res.json(contactGoal);
  } catch (error) {
    next(error);
  }
});

// Remove a goal from a contact
router.delete('/contacts/:contactId/goals/:goalId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  const { contactId, goalId } = req.params;

  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await prisma.contactGoal.delete({
      where: {
        contactId_goalId: {
          contactId,
          goalId
        }
      }
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
