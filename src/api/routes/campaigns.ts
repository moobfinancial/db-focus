import { Router, Request, Response } from 'express';
import { PrismaClient, Prisma, Campaign, CampaignStatus } from '@prisma/client';
import type { ApiResponse, PaginatedResponse } from '../../../server/src/types/schema';

const prisma = new PrismaClient();

interface RequestWithUser extends Request {
  user: {
    id: string;
  };
}

const router = Router();

// Get paginated campaigns
router.get('/', async (req: RequestWithUser, res: Response) => {
  try {
    const { page = 1, pageSize = 10, search, status } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);

    const where: Prisma.CampaignWhereInput = {
      userId: req.user.id,
      ...(search && {
        OR: [
          { name: { contains: String(search), mode: Prisma.QueryMode.insensitive } },
          { description: { contains: String(search), mode: Prisma.QueryMode.insensitive } },
        ],
      }),
      ...(status && { status: status as CampaignStatus }),
    };

    const include: Prisma.CampaignInclude = {
      contacts: true,
      assistant: true,
    };

    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        skip,
        take: Number(pageSize),
        orderBy: { createdAt: 'desc' },
        include,
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
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch campaigns',
        details: error,
      },
    });
  }
});

// Get campaign by ID
router.get('/:id', async (req: RequestWithUser, res: Response) => {
  try {
    const include: Prisma.CampaignInclude = {
      contacts: true,
      assistant: true,
    };

    const campaign = await prisma.campaign.findUnique({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
      include,
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
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch campaign',
        details: error,
      },
    });
  }
});

// Create new campaign
router.post('/', async (req: RequestWithUser, res: Response) => {
  try {
    const { name, description, startDate, endDate, status, assistantId, contacts, goals, metrics } = req.body;

    // Validate required fields
    if (!name || !startDate || !status || !assistantId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields',
          details: {
            name: !name ? 'Name is required' : null,
            startDate: !startDate ? 'Start date is required' : null,
            status: !status ? 'Status is required' : null,
            assistantId: !assistantId ? 'Assistant is required' : null,
          },
        },
      });
    }

    const include: Prisma.CampaignInclude = {
      contacts: true,
      assistant: true,
    };

    const campaign = await prisma.campaign.create({
      data: {
        name,
        description,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        status: status as CampaignStatus,
        userId: req.user.id,
        metrics: metrics || {
          totalCalls: 0,
          successfulCalls: 0,
          failedCalls: 0,
          averageDuration: 0,
        },
        goals: goals || [],
        assistant: {
          connect: { id: assistantId },
        },
        ...(contacts?.length && {
          contacts: {
            connect: contacts.map((id: string) => ({ id })),
          },
        }),
      },
      include,
    });

    res.status(201).json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create campaign',
        details: error,
      },
    });
  }
});

// Update campaign
router.put('/:id', async (req: RequestWithUser, res: Response) => {
  try {
    const { name, description, startDate, endDate, status, assistantId, contacts, goals, metrics } = req.body;

    const include: Prisma.CampaignInclude = {
      contacts: true,
      assistant: true,
    };

    const campaign = await prisma.campaign.update({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
      data: {
        name,
        description,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        status: status as CampaignStatus,
        metrics: metrics || {
          totalCalls: 0,
          successfulCalls: 0,
          failedCalls: 0,
          averageDuration: 0,
        },
        goals: goals || [],
        assistant: {
          connect: { id: assistantId },
        },
        ...(contacts && {
          contacts: {
            set: contacts.map((id: string) => ({ id })),
          },
        }),
      },
      include,
    });

    res.json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update campaign',
        details: error,
      },
    });
  }
});

// Update campaign status
router.patch('/:id/status', async (req: RequestWithUser, res: Response) => {
  try {
    const { status } = req.body;

    if (!['DRAFT', 'SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid status',
        },
      });
    }

    const include: Prisma.CampaignInclude = {
      contacts: true,
      assistant: true,
    };

    const campaign = await prisma.campaign.update({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
      data: { status: status as CampaignStatus },
      include,
    });

    res.json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update campaign status',
        details: error,
      },
    });
  }
});

// Update campaign metrics
router.patch('/:id/metrics', async (req: RequestWithUser, res: Response) => {
  try {
    const { metrics } = req.body;

    const include: Prisma.CampaignInclude = {
      contacts: true,
      assistant: true,
    };

    const campaign = await prisma.campaign.update({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
      data: { metrics },
      include,
    });

    res.json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update campaign metrics',
        details: error,
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
        userId: req.user.id,
      },
    });

    res.json({
      success: true,
      data: null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete campaign',
        details: error,
      },
    });
  }
});

// Add contacts to campaign
router.post('/:id/contacts', async (req: RequestWithUser, res: Response) => {
  try {
    const { contactIds } = req.body;

    const include: Prisma.CampaignInclude = {
      contacts: true,
      assistant: true,
    };

    const campaign = await prisma.campaign.update({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
      data: {
        contacts: {
          connect: contactIds.map((id: string) => ({ id })),
        },
      },
      include,
    });

    res.json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to add contacts to campaign',
        details: error,
      },
    });
  }
});

// Remove contacts from campaign
router.delete('/:id/contacts', async (req: RequestWithUser, res: Response) => {
  try {
    const { contactIds } = req.body;

    const include: Prisma.CampaignInclude = {
      contacts: true,
      assistant: true,
    };

    const campaign = await prisma.campaign.update({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
      data: {
        contacts: {
          disconnect: contactIds.map((id: string) => ({ id })),
        },
      },
      include,
    });

    res.json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to remove contacts from campaign',
        details: error,
      },
    });
  }
});

export default router;