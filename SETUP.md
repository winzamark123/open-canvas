# Authentication & Database Setup Guide

## Prerequisites

### ⚠️ IMPORTANT: Upgrade Node.js First

This project requires **Node.js 22.x**. You currently have Node.js 18.16.0.

**Upgrade Node.js:**

```bash
# Using nvm (recommended)
nvm install 22
nvm use 22

# Or download from https://nodejs.org/
```

Verify installation:

```bash
node -v  # Should show v22.x.x
```

## Step 1: Install Dependencies

After upgrading Node.js, install the required packages:

```bash
cd /Users/wincheng/Desktop/VSCoding.nosync/open-canvas

# Install Clerk for authentication
yarn add -W @clerk/clerk-react

# Install Drizzle ORM and PostgreSQL client
yarn add -W drizzle-orm pg

# Install dev dependencies
yarn add -W -D drizzle-kit tsx @types/pg dotenv
```

## Step 2: Set Up Environment Variables

Create a `.env.local` file in the project root:

```bash
# Database
DATABASE_URL=postgres://excalidraw_user:local_dev_password@localhost:5432/excalidraw_db

# Clerk Authentication
# Get these from https://dashboard.clerk.com
VITE_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
CLERK_SECRET_KEY=sk_test_YOUR_KEY_HERE
CLERK_WEBHOOK_SECRET=whsec_YOUR_KEY_HERE

# OpenAI (for image generation)
OPENAI_API_KEY=sk-YOUR_KEY_HERE

# Stripe (for payments - add later)
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_KEY_HERE
```

### Getting Clerk Keys:

1. Go to https://dashboard.clerk.com
2. Create a new application (or use existing)
3. Navigate to **API Keys** in the sidebar
4. Copy:
   - **Publishable Key** → `VITE_CLERK_PUBLISHABLE_KEY`
   - **Secret Key** → `CLERK_SECRET_KEY`
5. For webhooks (later):
   - Go to **Webhooks** → Create endpoint
   - Copy **Signing Secret** → `CLERK_WEBHOOK_SECRET`

## Step 3: Start PostgreSQL with Docker

```bash
# Start PostgreSQL container
yarn docker:up

# Verify it's running
docker ps

# View logs
yarn docker:logs
```

## Step 4: Set Up Database Schema

```bash
# Generate migration files from schema
yarn db:generate

# Run migrations to create tables
yarn db:migrate

# Seed default plans (free, pro, enterprise)
yarn db:seed
```

## Step 5: Start Development Server

```bash
yarn start
```

The app will be available at http://localhost:3000

## What's Implemented

### ✅ Docker + PostgreSQL

- PostgreSQL 16 running in Docker container
- Persistent data storage with volumes
- Health checks for reliability

### ✅ Drizzle ORM

- Type-safe database schema
- Migrations system
- Database tables:
  - `users` - User accounts synced from Clerk
  - `plans` - Subscription tiers (free/pro/enterprise)
  - `user_subscriptions` - User subscription status
  - `image_generations` - Track image generation usage

### ✅ Clerk Authentication

- Sign-in/sign-up UI in top-right corner
- JWT-based authentication
- User session management
- Shows "Sign In" button when not authenticated
- Shows user avatar/menu when authenticated

## Available Commands

### Docker Commands

```bash
yarn docker:up      # Start PostgreSQL
yarn docker:down    # Stop PostgreSQL
yarn docker:logs    # View PostgreSQL logs
```

### Database Commands

```bash
yarn db:generate    # Generate migrations from schema changes
yarn db:migrate     # Apply migrations to database
yarn db:seed        # Seed default data
yarn db:studio      # Open Drizzle Studio (database GUI)
yarn db:push        # Push schema directly (dev only, skips migrations)
```

## Testing the Setup

### 1. Verify Docker PostgreSQL

```bash
yarn docker:up
docker ps  # Should show excalidraw-postgres running
```

### 2. Verify Database Connection

```bash
# Connect to PostgreSQL
docker exec -it excalidraw-postgres psql -U excalidraw_user -d excalidraw_db

# List tables
\dt

# You should see: users, plans, user_subscriptions, image_generations

# Exit
\q
```

### 3. Verify Clerk Integration

1. Start the app: `yarn start`
2. Open http://localhost:3000
3. Look for "Sign In" button in top-right corner
4. Click it - should open Clerk modal (if keys are configured)

## Database Schema Overview

### Users Table

- Stores user accounts from Clerk
- Links to subscriptions and image generations
- Clerk ID is the unique identifier

### Plans Table

- Three tiers: free (10 images), pro (100 images), enterprise (unlimited)
- Configurable pricing and limits
- Stripe price IDs for payment integration

### User Subscriptions Table

- Links users to their plan
- Tracks Stripe subscription status
- Manages billing periods

### Image Generations Table

- Tracks every image generated
- Links to user and project
- Used for usage limits and analytics

## Next Steps

### Phase 1: Usage Tracking (Current)

- [x] Set up infrastructure
- [ ] Implement localStorage tracking for non-authenticated users
- [ ] Implement database tracking for authenticated users
- [ ] Add usage limit checks before image generation

### Phase 2: API Integration

- [ ] Create `/api/webhooks/clerk` for user sync
- [ ] Update `/api/generate-image` to check usage limits
- [ ] Add usage tracking after successful generation

### Phase 3: Stripe Integration

- [ ] Set up Stripe account
- [ ] Add Stripe checkout flow
- [ ] Handle subscription webhooks
- [ ] Update plans with real Stripe price IDs

### Phase 4: Deployment

- [ ] Deploy to Vercel (frontend + API)
- [ ] Deploy PostgreSQL to Railway
- [ ] Update environment variables for production
- [ ] Test end-to-end flow

## Troubleshooting

### Node.js Version Error

```
error excalidraw-monorepo@: The engine "node" is incompatible
```

**Solution:** Upgrade to Node.js 22.x (see Prerequisites)

### PostgreSQL Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:** Make sure Docker is running: `yarn docker:up`

### Clerk Error in Browser

```
Clerk: publishableKey is not set
```

**Solution:** Add `VITE_CLERK_PUBLISHABLE_KEY` to `.env.local`

### Migration Error

```
error: relation "users" already exists
```

**Solution:** Database already has tables. Either:

- Drop and recreate: `yarn docker:down -v && yarn docker:up`
- Or skip migration if tables are correct

## Useful Resources

- [Clerk Documentation](https://clerk.com/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)
- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app)

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│  Frontend (React + Excalidraw)                          │
│  - ClerkProvider wraps app                              │
│  - Sign In/Up UI in LayerUI                             │
│  - User session management                              │
└──────────────────┬──────────────────────────────────────┘
                   │
                   │ (JWT tokens)
                   ▼
┌─────────────────────────────────────────────────────────┐
│  Clerk (SaaS Authentication)                            │
│  - User authentication                                  │
│  - JWT token generation                                 │
│  - Webhooks for user events                             │
└──────────────────┬──────────────────────────────────────┘
                   │
                   │ (Webhooks)
                   ▼
┌─────────────────────────────────────────────────────────┐
│  Vercel API Routes (/api)                               │
│  - /api/generate-image (usage check + generation)       │
│  - /api/webhooks/clerk (user sync)                      │
│  - /api/webhooks/stripe (payments)                      │
└──────────────────┬──────────────────────────────────────┘
                   │
                   │ (SQL queries via Drizzle)
                   ▼
┌─────────────────────────────────────────────────────────┐
│  PostgreSQL Database                                    │
│  - Docker (local dev)                                   │
│  - Railway (production)                                 │
│  - Tables: users, plans, subscriptions, generations     │
└─────────────────────────────────────────────────────────┘
```
