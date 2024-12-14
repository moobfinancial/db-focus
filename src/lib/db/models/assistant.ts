import { z } from 'zod';

export const AssistantSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Name is required"),
  firstMessage: z.string().optional(),
  systemPrompt: z.string().optional(),
  voiceProvider: z.string().optional(),
  voiceId: z.string().optional(),
  voiceSettings: z.object({
    speed: z.number().min(0.5).max(2).optional(),
    pitch: z.number().min(0.5).max(2).optional(),
    stability: z.number().min(0).max(1).optional(),
    volume: z.number().min(0).max(1).optional()
  }).optional(),
  llmProvider: z.string().optional(),
  llmModel: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
});

export type Assistant = z.infer<typeof AssistantSchema>;

export async function createAssistant(assistant: Assistant) {
  // Implement database insertion logic
  // This is a placeholder - replace with actual database interaction
  try {
    // Example using Prisma or another ORM
    const newAssistant = await prisma.assistant.create({
      data: {
        ...assistant,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    return newAssistant;
  } catch (error) {
    console.error('Failed to create assistant:', error);
    throw new Error('Failed to create assistant');
  }
}

export async function getAssistantById(id: string) {
  // Retrieve assistant by ID
  try {
    const assistant = await prisma.assistant.findUnique({
      where: { id }
    });
    return assistant;
  } catch (error) {
    console.error('Failed to retrieve assistant:', error);
    throw new Error('Failed to retrieve assistant');
  }
}

export async function listAssistants() {
  // List all assistants
  try {
    const assistants = await prisma.assistant.findMany();
    return assistants;
  } catch (error) {
    console.error('Failed to list assistants:', error);
    throw new Error('Failed to list assistants');
  }
}
