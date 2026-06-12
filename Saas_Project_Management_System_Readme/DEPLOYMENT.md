# 🚢 Deployment Guide

This document covers deploying the SaaS Project Management System to production.

---

## Table of Contents

- [Environment Variables](#environment-variables)
- [Deploy to Vercel (Recommended)](#deploy-to-vercel-recommended)
- [Deploy with Docker](#deploy-with-docker)
- [PostgreSQL Setup](#postgresql-setup)
- [Database Migrations in Production](#database-migrations-in-production)
- [File Storage (S3 / R2)](#file-storage-s3--r2)
- [Email (Resend)](#email-resend)
- [Monitoring & Logging](#monitoring--logging)
- [Performance Checklist](#performance-checklist)

---

## Environment Variables

Create a `.env.local` for development and configure these in your hosting platform for production.

```env
# ─── App ────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=https://app.yourdomain.com

# ─── Database ───────────────────────────────────────────
DATABASE_URL=postgresql://user:password@host:5432/saas_pm?sslmode=require

# ─── Auth (NextAuth.js) ──────────────────────────────────
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
NEXTAUTH_URL=https://app.yourdomain.com

# ─── OAuth Providers ────────────────────────────────────
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...

# ─── Email (Resend) ──────────────────────────────────────
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@yourdomain.com

# ─── File Storage (S3 or Cloudflare R2) ─────────────────
S3_BUCKET_NAME=your-bucket
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_ENDPOINT=https://...          # R2: https://accountid.r2.cloudflarestorage.com
NEXT_PUBLIC_CDN_URL=https://cdn.yourdomain.com

# ─── Stripe ─────────────────────────────────────────────
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_PRO_MONTHLY_PRICE_ID=price_...
STRIPE_BUSINESS_MONTHLY_PRICE_ID=price_...
```

Generate `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

---

## Deploy to Vercel (Recommended)

### 1. Connect Repository

```bash
# Install Vercel CLI
npm i -g vercel

# Link project
vercel link

# Deploy
vercel --prod
```

Or connect via [vercel.com/new](https://vercel.com/new) → Import Git repository.

### 2. Configure Environment Variables

In the Vercel dashboard → Settings → Environment Variables, add all variables from the section above.

### 3. Configure Build Settings

```json
// vercel.json
{
  "buildCommand": "pnpm prisma generate && pnpm build",
  "installCommand": "pnpm install"
}
```

### 4. Database Migrations on Deploy

Add a Vercel deploy hook or use the `postbuild` script:

```json
// package.json
{
  "scripts": {
    "postbuild": "prisma migrate deploy"
  }
}
```

> ⚠️ `migrate deploy` (not `migrate dev`) for production — applies pending migrations without creating new ones.

---

## Deploy with Docker

### Dockerfile

```dockerfile
FROM node:20-alpine AS base
RUN npm i -g pnpm

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm prisma generate
RUN pnpm build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000
ENV PORT 3000
CMD ["node", "server.js"]
```

### next.config.ts

```typescript
const nextConfig = {
  output: "standalone",
};
```

### docker-compose.yml

```yaml
version: "3.9"

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:password@db:5432/saas_pm
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
      NEXTAUTH_URL: http://localhost:3000
      # ... other env vars
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: saas_pm
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
```

```bash
# Build and run
docker-compose up --build

# Run migrations
docker-compose exec app pnpm prisma migrate deploy
```

---

## PostgreSQL Setup

### Managed Options (Recommended for Production)

| Provider | Notes |
|---|---|
| **Neon** | Serverless Postgres, generous free tier, great for Vercel |
| **Supabase** | Postgres + extras (auth, storage), has free tier |
| **Railway** | Simple setup, affordable |
| **RDS (AWS)** | Enterprise-grade, more configuration |

### Connection Pooling

For serverless deployments (Vercel), use **connection pooling** to avoid exhausting DB connections:

- **Neon**: Built-in serverless driver — use `@neondatabase/serverless`
- **Supabase**: Use the pooler URL (port 6543) instead of direct connection

```env
# Neon example
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/saas_pm?sslmode=require
```

### Prisma with Neon

```typescript
// src/lib/db.ts
import { PrismaClient } from "@prisma/client";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

// Required for Neon serverless
if (process.env.NODE_ENV !== "production") {
  neonConfig.webSocketConstructor = ws;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

---

## Database Migrations in Production

```bash
# Check pending migrations
pnpm prisma migrate status

# Apply migrations (safe, idempotent)
pnpm prisma migrate deploy

# Never use in production:
# pnpm prisma migrate dev       ← creates migrations, resets DB
# pnpm prisma migrate reset     ← drops and recreates DB
```

For zero-downtime migrations, ensure migrations are **backward compatible** (add columns as nullable before backfilling).

---

## File Storage (S3 / R2)

### AWS S3 Setup

1. Create an S3 bucket
2. Enable public access for uploaded files (or use CloudFront)
3. Create an IAM user with `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject`
4. Add credentials to environment variables

### Cloudflare R2 (Cheaper)

R2 has no egress fees — ideal for file attachments.

1. Create R2 bucket in Cloudflare dashboard
2. Create API token with R2 read/write permissions
3. Use R2 endpoint: `https://<account-id>.r2.cloudflarestorage.com`
4. Set `S3_ENDPOINT` in env vars (R2 is S3-compatible)

### Upload Helper

```typescript
// src/lib/s3.ts
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const s3 = new S3Client({
  region: process.env.S3_REGION!,
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
});

export async function getPresignedUploadUrl(key: string, mimeType: string) {
  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME!,
    Key: key,
    ContentType: mimeType,
  });
  return getSignedUrl(s3, command, { expiresIn: 300 }); // 5 minutes
}
```

---

## Email (Resend)

1. Sign up at [resend.com](https://resend.com)
2. Verify your sending domain
3. Add `RESEND_API_KEY` to environment
4. Update `EMAIL_FROM` to use your verified domain

```typescript
// src/lib/email.ts
import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendInvitationEmail(to: string, inviteUrl: string, workspaceName: string) {
  await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to,
    subject: `You've been invited to ${workspaceName}`,
    html: `<p>Click <a href="${inviteUrl}">here</a> to accept the invitation.</p>`,
  });
}
```

---

## Monitoring & Logging

### Recommended Tools

| Tool | Purpose |
|---|---|
| **Sentry** | Error tracking (Next.js SDK) |
| **Vercel Analytics** | Web vitals & page performance |
| **PostHog** | Product analytics & feature flags |
| **Axiom / Logtail** | Log aggregation |
| **Better Stack** | Uptime monitoring |

### Sentry Setup

```bash
pnpm add @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

---

## Performance Checklist

- [ ] PostgreSQL connection pooling enabled (Neon/Supabase pooler)
- [ ] All `workspaceId` queries use indexes (see [DATABASE.md](./DATABASE.md#indexes--performance))
- [ ] Next.js Image Optimization configured for CDN domain
- [ ] Static assets on CDN (Vercel handles this automatically)
- [ ] `prisma generate` runs at build time (not runtime)
- [ ] Long-running queries identified via `EXPLAIN ANALYZE`
- [ ] Notifications polled at reasonable interval (e.g., every 30s with React Query)
- [ ] File uploads go directly to S3 via presigned URLs (not through Next.js server)
- [ ] Rate limiting on auth endpoints (table-based, see [AUTH.md](./AUTH.md#security-considerations))
