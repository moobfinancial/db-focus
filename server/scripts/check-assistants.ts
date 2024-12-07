import { prisma } from '../src/lib/prisma';

async function checkAssistants() {
  try {
    const assistants = await prisma.assistant.findMany({
      include: {
        user: {
          select: {
            email: true
          }
        }
      }
    });
    
    console.log('Found assistants:', JSON.stringify(assistants, null, 2));
    console.log('Total assistants:', assistants.length);
  } catch (error) {
    console.error('Error fetching assistants:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAssistants();
