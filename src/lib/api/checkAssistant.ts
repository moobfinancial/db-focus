import { prisma } from './client';

async function checkAssistantExists(assistantId: string) {
    const assistant = await prisma.assistant.findUnique({
        where: { id: assistantId },
    });
    console.log(assistant ? 'Assistant found:' : 'Assistant not found:', assistant);
}

// Call the function with the provided ID
checkAssistantExists('cm4a9cvdk0002qxxgt0nmgccz');
