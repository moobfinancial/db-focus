import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '/Users/boommac/Documents/db-focus/.env' });

async function createAdminUser() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    const client = await pool.connect();

    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Check if user exists
    const checkUserQuery = `
      SELECT * FROM "User" WHERE email = $1
    `;
    const checkResult = await client.query(checkUserQuery, ['admin@example.com']);

    if (checkResult.rows.length === 0) {
      // Insert user
      const insertQuery = `
        INSERT INTO "User" (
          id, email, password, name, role, "createdAt", "updatedAt", settings
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW(), $5
        )
      `;
      
      const settings = {
        defaultTransparencyLevel: 'FULL',
        recordingEnabled: true,
        webSearchEnabled: false,
        preferredVoice: 'male'
      };

      await client.query(insertQuery, [
        'admin@example.com', 
        hashedPassword, 
        'Admin User', 
        'ADMIN',
        JSON.stringify(settings)
      ]);

      console.log('Admin user created successfully');
    } else {
      console.log('Admin user already exists');
    }

    client.release();
  } catch (error) {
    console.error('Error creating admin user:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

createAdminUser();
