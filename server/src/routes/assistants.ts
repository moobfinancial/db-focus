import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { openRouter } from '../lib/llm/openrouter';
import { validateAssistant } from '../lib/validation';
import { LLMProvider, VoiceProvider } from '@prisma/client';

const router = Router();

// Get all assistants
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        },
      });
    }

    const assistants = await prisma.assistant.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: {
        items: assistants,
        total: assistants.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ASSISTANTS_ERROR',
        message: 'Failed to fetch assistants',
      },
    });
  }
});

// Get available LLM models
router.get('/models', authenticate, async (req: Request, res: Response) => {
  try {
    const models = await openRouter.getModels();
    res.json({ success: true, data: models });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_MODELS_ERROR',
        message: 'Failed to fetch available models',
      },
    });
  }
});

// Create assistant
router.post('/', authenticate, async (req: Request, res: Response) => {
  console.group('Assistant Creation Process');
  try {
    if (!req.user) {
      console.warn('No authenticated user found');
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        },
      });
    }

    console.log('Received assistant creation request with body:', JSON.stringify(req.body, null, 2));

    const validation = validateAssistant(req.body);
    if (!validation.success) {
      console.error('Assistant validation failed:', {
        error: validation.error,
        receivedData: req.body
      });
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid assistant data',
          details: validation.error.issues.map(issue => ({
            path: issue.path.join('.'),
            message: issue.message,
            code: issue.code
          })),
        },
      });
    }

    const provider = validation.data.provider?.toUpperCase();
    const voiceProvider = validation.data.voiceProvider?.toUpperCase();

    if (!Object.values(LLMProvider).includes(provider as LLMProvider)) {
      throw new Error(`Invalid provider: ${provider}`);
    }
    if (!Object.values(VoiceProvider).includes(voiceProvider as VoiceProvider)) {
      throw new Error(`Invalid voice provider: ${voiceProvider}`);
    }

    const assistantData = {
      ...validation.data,
      provider: provider as LLMProvider,
      voiceProvider: voiceProvider as VoiceProvider,
      userId: req.user.id,
      voiceSettings: validation.data.voiceSettings || undefined
    };

    console.log('Creating assistant with data:', JSON.stringify(assistantData, null, 2));
    console.log('Assistant data being sent to database:', JSON.stringify(assistantData, null, 2));
    const assistant = await prisma.assistant.create({
      data: assistantData,
    });

    console.log('Assistant created successfully:', assistant);

    res.status(201).json({ 
      success: true, 
      data: assistant 
    });
  } catch (error) {
    console.error('Error creating assistant:', error);
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'DUPLICATE_ASSISTANT',
            message: 'An assistant with this name already exists',
            details: error.message
          },
        });
      }
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_ASSISTANT_ERROR',
        message: 'Failed to create assistant',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  } finally {
    console.groupEnd();
  }
});

// Delete assistant
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        },
      });
    }

    const assistant = await prisma.assistant.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!assistant) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ASSISTANT_NOT_FOUND',
          message: 'Assistant not found',
        },
      });
    }

    await prisma.assistant.delete({
      where: { id: req.params.id },
    });

    res.json({ success: true, data: null });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_ASSISTANT_ERROR',
        message: 'Failed to delete assistant',
      },
    });
  }
});

// Update assistant
router.put('/:id', authenticate, async (req: Request, res: Response) => {
  console.group('Assistant Update Request');
  try {
    if (!req.user) {
      console.log('Unauthorized: No user found in request');
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        },
      });
    }

    const { id } = req.params;
    console.log('Update request details:', {
      assistantId: id,
      userId: req.user.id,
      requestBody: req.body
    });

    const existingAssistant = await prisma.assistant.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!existingAssistant) {
      console.log('Assistant not found or does not belong to user:', {
        assistantId: id,
        userId: req.user.id
      });
      return res.status(404).json({
        success: false,
        error: {
          code: 'ASSISTANT_NOT_FOUND',
          message: 'Assistant not found or does not belong to you',
        },
      });
    }

    console.log('Found existing assistant:', existingAssistant);

    const validation = validateAssistant(req.body);
    if (!validation.success) {
      console.error('Validation failed:', {
        errors: validation.error.issues,
        receivedData: req.body
      });
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid assistant data',
          details: validation.error.issues.map(issue => ({
            path: issue.path.join('.'),
            message: issue.message,
            code: issue.code
          })),
        },
      });
    }

    const updateData = {
      ...validation.data,
      provider: validation.data.provider?.toUpperCase() as LLMProvider,
      voiceProvider: validation.data.voiceProvider?.toUpperCase() as VoiceProvider,
    };

    console.log('Attempting to update assistant with data:', updateData);

    const updatedAssistant = await prisma.assistant.update({
      where: { id },
      data: updateData,
    });

    console.log('Successfully updated assistant:', updatedAssistant);

    res.json({
      success: true,
      data: updatedAssistant,
    });
  } catch (error: unknown) {
    console.error('Error updating assistant:', error);
    
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as { code: string; meta?: unknown; message: string };
      console.error('Prisma error:', {
        code: prismaError.code,
        meta: prismaError.meta,
        message: prismaError.message
      });
      return res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Database error occurred while updating assistant',
          details: prismaError.message
        },
      });
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_ASSISTANT_ERROR',
        message: 'Failed to update assistant',
        details: errorMessage
      },
    });
  } finally {
    console.groupEnd();
  }
});

// Test assistant
router.post('/:id/test', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        },
      });
    }

    const { message } = req.body;
    const assistant = await prisma.assistant.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!assistant) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ASSISTANT_NOT_FOUND',
          message: 'Assistant not found',
        },
      });
    }

    const response = await openRouter.chat({
      model: assistant.model,
      messages: [
        { role: 'system', content: assistant.systemPrompt },
        { role: 'user', content: message },
      ],
    });

    res.json({ success: true, data: response });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'TEST_ASSISTANT_ERROR',
        message: 'Failed to test assistant',
      },
    });
  }
});

export default router;