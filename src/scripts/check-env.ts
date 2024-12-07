import * as dotenv from 'dotenv';
import * as path from 'path';

// Explicitly load .env file
const envPath = path.resolve('/Users/boommac/Documents/db-focus/.env');
dotenv.config({ path: envPath });

console.log('Environment Variables:');
console.log('CARTESIA_API_KEY:', process.env.CARTESIA_API_KEY);
console.log('VITE_CARTESIA_API_KEY:', process.env.VITE_CARTESIA_API_KEY);
console.log('Full process.env:', JSON.stringify(process.env, null, 2));
