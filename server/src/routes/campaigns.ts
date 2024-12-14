import { Router, Request, Response } from 'express';
import { Prisma, Campaign, CampaignStatus } from '@prisma/client';
import type { ApiResponse, PaginatedResponse, RequestUser } from '../types/schema';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';

const router = Router();

interface RequestWithUser extends Request {
  user?: RequestUser;
}

// Add authentication middleware to all routes
router.use(authenticate);

// Get paginated campaigns
router.get('/', async (req: RequestWithUser, res: Response) => {
  try {
    const { page = 1, pageSize = 10, search, status } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);

    const where: Prisma.CampaignWhereInput = {
      userId: req.user?.id,
      ...(search && {
        OR: [
          { name: { contains: String(search), mode: Prisma.QueryMode.insensitive } },
          { description: { contains: String(search), mode: Prisma.QueryMode.insensitive } },
        ],
      }),
      ...(status && { status: status as CampaignStatus }),
    };

    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        skip,
        take: Number(pageSize),
        orderBy: { createdAt: 'desc' },
        include: {
          contacts: true,
        },
      }),
      prisma.campaign.count({ where }),
    ]);

    const response: ApiResponse<PaginatedResponse<Campaign>> = {
      success: true,
      data: {
        items: campaigns,
        total,
        page: Number(page),
        pageSize: Number(pageSize),
        totalPages: Math.ceil(total / Number(pageSize)),
      },
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch campaigns',
      },
    });
  }
});

// Get campaign by ID
router.get('/:id', async (req: RequestWithUser, res: Response) => {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: {
        id: req.params.id,
        userId: req.user?.id,
      },
      include: {
        contacts: true,
      },
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Campaign not found',
        },
      });
    }

    res.json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    console.error('Error fetching campaign:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch campaign',
      },
    });
  }
});

// Create campaign
router.post('/', async (req: RequestWithUser, res: Response) => {
  try {
    const { name, description, startDate, endDate, status } = req.body;

    const campaign = await prisma.campaign.create({
      data: {
        name,
        description,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        status: status as CampaignStatus || CampaignStatus.DRAFT,
        userId: req.user?.id as string,
        metrics: {
          totalCalls: 0,
          successfulCalls: 0,
          failedCalls: 0,
          averageDuration: 0,
        },
      },
      include: {
        contacts: true,
      },
    });

    res.json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create campaign',
      },
    });
  }
});

// Update campaign
router.put('/:id', async (req: RequestWithUser, res: Response) => {
  try {
    const { name, description, startDate, endDate, status, metrics } = req.body;

    const campaign = await prisma.campaign.update({
      where: {
        id: req.params.id,
        userId: req.user?.id,
      },
      data: {
        name,
        description,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : null,
        status: status as CampaignStatus,
        metrics,
      },
      include: {
        contacts: true,
      },
    });

    res.json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    console.error('Error updating campaign:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update campaign',
      },
    });
  }
});

// Delete campaign
router.delete('/:id', async (req: RequestWithUser, res: Response) => {
  try {
    await prisma.campaign.delete({
      where: {
        id: req.params.id,
        userId: req.user?.id,
      },
    });

    res.json({
      success: true,
      data: null,
    });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete campaign',
      },
    });
  }
});

// Add contacts to campaign
router.post('/:id/contacts', async (req: RequestWithUser, res: Response) => {
  try {
    const { contactIds } = req.body;

    if (!Array.isArray(contactIds)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'contactIds must be an array',
        },
      });
    }

    const campaign = await prisma.campaign.update({
      where: {
        id: req.params.id,
        userId: req.user?.id,
      },
      data: {
        contacts: {
          connect: contactIds.map(id => ({ id })),
        },
      },
      include: {
        contacts: true,
      },
    });

    res.json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    console.error('Error adding contacts to campaign:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to add contacts to campaign',
      },
    });
  }
});

// Remove contacts from campaign
router.delete('/:id/contacts', async (req: RequestWithUser, res: Response) => {
  try {
    const { contactIds } = req.body;

    if (!Array.isArray(contactIds)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'contactIds must be an array',
        },
      });
    }

    const campaign = await prisma.campaign.update({
      where: {
        id: req.params.id,
        userId: req.user?.id,
      },
      data: {
        contacts: {
          disconnect: contactIds.map(id => ({ id })),
        },
      },
      include: {
        contacts: true,
      },
    });

    res.json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    console.error('Error removing contacts from campaign:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to remove contacts from campaign',
      },
    });
  }
});

export default router;