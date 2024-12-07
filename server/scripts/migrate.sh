#!/bin/bash

# Step 1: Create migration
echo "Creating migration..."
npx prisma migrate dev --create-only --name update_voice_session_schema

# Step 2: Apply migration
echo "Applying migration..."
npx prisma migrate deploy

# Step 3: Generate Prisma Client
echo "Generating Prisma Client..."
npx prisma generate
