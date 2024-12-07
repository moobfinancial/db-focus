import { NextRequest, NextResponse } from 'next/server';
import { createAssistant, AssistantSchema } from '@/lib/db/models/assistant';
import { dailyBotsApi } from '@/api/dailybots';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate the assistant data
    const validatedAssistant = AssistantSchema.parse(body);

    // Create the assistant in the database
    const savedAssistant = await createAssistant(validatedAssistant);

    // Optional: Create the assistant in DailyBots
    try {
      const dailyBotsAssistant = await dailyBotsApi.createAssistant({
        name: savedAssistant.name,
        systemPrompt: savedAssistant.systemPrompt,
        firstMessage: savedAssistant.firstMessage
      });

      // Update the local assistant with DailyBots ID if needed
      // This is optional and depends on your specific requirements
    } catch (dailyBotsError) {
      console.warn('Failed to create assistant in DailyBots:', dailyBotsError);
      // Optionally, you might want to handle this differently
    }

    return NextResponse.json(savedAssistant, { status: 201 });
  } catch (error) {
    console.error('Assistant creation error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to create assistant', 
        details: error instanceof Error ? error.message : String(error) 
      }, 
      { status: 400 }
    );
  }
}

export async function GET() {
  try {
    const assistants = await listAssistants();
    return NextResponse.json(assistants);
  } catch (error) {
    console.error('Failed to list assistants:', error);
    return NextResponse.json(
      { 
        error: 'Failed to retrieve assistants', 
        details: error instanceof Error ? error.message : String(error) 
      }, 
      { status: 500 }
    );
  }
}
