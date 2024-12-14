import * as dotenv from 'dotenv';
import { Cartesia } from '/Users/boommac/Documents/db-focus/cartesia-sdk/src/index.ts';

// Explicitly load .env file
dotenv.config({ path: '/Users/boommac/Documents/db-focus/.env' });

async function testCartesiaSDK() {
  const apiKey = process.env.CARTESIA_API_KEY || process.env.VITE_CARTESIA_API_KEY;
  console.log('Cartesia API Key:', apiKey);

  if (!apiKey) {
    console.error('No API key found');
    return;
  }

  try {
    const client = new Cartesia({ apiKey });
    
    console.log('Fetching voices...');
    const voices = await client.voices.list();
    
    console.log('Voices found:', voices.length);
    if (voices.length > 0) {
      console.log('First voice details:');
      console.log(JSON.stringify(voices[0], null, 2));

      if (voices[0].id) {
        console.log('Fetching voice details...');
        const voiceDetails = await client.voices.get(voices[0].id);
        console.log('Voice details:', JSON.stringify(voiceDetails, null, 2));
      }
    }
  } catch (error) {
    console.error('Error testing Cartesia SDK:', error);
  }
}

testCartesiaSDK().catch(console.error);
