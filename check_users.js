import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // First, check existing users
  const existingUsers = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true
    }
  })
  console.log('Existing Users:', JSON.stringify(existingUsers, null, 2))

  // If no users, create a default admin user
  if (existingUsers.length === 0) {
    const hashedPassword = await bcrypt.hash('admin123', 10)
    const newUser = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        name: 'Admin User',
        password: hashedPassword,
        role: 'ADMIN',
        settings: {
          defaultTransparencyLevel: 'FULL',
          recordingEnabled: true,
          webSearchEnabled: true,
          preferredVoice: 'male'
        }
      }
    })
    console.log('Created new admin user:', JSON.stringify(newUser, null, 2))
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
