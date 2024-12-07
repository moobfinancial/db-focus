import * as dotenv from 'dotenv';
import { cartesiaApi } from '../lib/api/cartesia.js';

// Explicitly load .env file
dotenv.config({ path: '/Users/boommac/Documents/db-focus/.env' });

async function main() {
  console.log('Testing Cartesia API...');
  
  console.log('Full process.env:', JSON.stringify(process.env, null, 2));

  console.log('VITE_CARTESIA_API_KEY:', process.env.VITE_CARTESIA_API_KEY);
  console.log('CARTESIA_API_KEY:', process.env.CARTESIA_API_KEY);

  const apiKey = process.env.CARTESIA_API_KEY || process.env.VITE_CARTESIA_API_KEY;
  console.log('Cartesia API Key:', apiKey);

  try {
    const voices = await cartesiaApi.getVoices();
    console.log('Voices found:', voices.length);

    if (voices.length > 0) {
      console.log('First voice details:');
      console.log(JSON.stringify(voices[0], null, 2));

      if (voices[0].id) {
        const previewUrl = await cartesiaApi.previewVoice(voices[0].id);
        console.log('Preview URL:', previewUrl);
      }
    }
  } catch (error) {
    console.error('Error testing Cartesia API:', error);
  }
}

main().catch(console.error);
