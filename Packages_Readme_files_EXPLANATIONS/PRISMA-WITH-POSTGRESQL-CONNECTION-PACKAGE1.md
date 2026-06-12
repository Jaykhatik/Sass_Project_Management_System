# Prisma + PostgreSQL + Next.js Setup & Migration Guide

This guide explains how this project connects Next.js with **PostgreSQL** using **Prisma** from start to end, and how to successfully manage database migrations.

---

## 📦 Installation — From Scratch

These are ALL the commands you need to install and configure Prisma with
PostgreSQL in a new Next.js project, in the exact order to run them.

---

### Step 1 — Create a Next.js Project

```bash
npx create-next-app@latest my-app
cd my-app
```

### Step 2 — Install Prisma + PostgreSQL Packages

```bash
npm install prisma --save-dev

"OR"

npm install prisma @prisma/client @prisma/adapter-pg

"OR"

npm install prisma @prisma/client @prisma/adapter-pg pg
```

| Package              | What it does                                                        |
| :------------------- | :------------------------------------------------------------------ |
| `prisma`             | Prisma CLI — used in your terminal for migrations, generate, studio |
| `@prisma/client`     | The auto-generated type-safe client your code imports               |
| `@prisma/adapter-pg` | PostgreSQL connection adapter required for Neon DB                  |

---

### Step 3 — Initialize Prisma

```bash
npx prisma init
```

**What this creates:**

```
your-project/
├── prisma/
│   └── schema.prisma    ← Edit this to define your models
└── .env                 ← Add your DATABASE_URL here
```

---

### Step 4 — Configure `prisma.config.ts` (for Next.js .env.local support)

Create `prisma.config.ts` in your project root so that Prisma CLI picks up
your connection string from both `.env` and `.env.local`:

```typescript
// prisma.config.ts
import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
```

> 💡 Install `dotenv` if not already present:
>
> ```bash
> npm install dotenv
> ```

---

### Step 5 — Set Up Environment Variables

Create `.env.local` in your project root and paste your Neon DB connection string:

```env
# .env.local
DATABASE_URL="postgresql://<user>:<password>@<host>.neon.tech/<dbname>?sslmode=require"
```

example : DATABASE_URL="postgresql://postgres:admin123@localhost:5432/SassPMS-DB"

---

### Step 6 — Configure `prisma/schema.prisma`

Open `prisma/schema.prisma` and set it up for PostgreSQL:

```prisma
datasource db {
  provider = "postgresql"
  // No url needed here — prisma.config.ts handles it
}

generator client {
  provider = "prisma-client-js"
  // No custom output — uses standard node_modules/@prisma/client
}
```

### Step 7 — Define Your Models

Add your models to `schema.prisma`. Example:

```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

```

---

### Step 8 — Run Your First Migration

```bash
npx prisma migrate dev --name init
```

This will:

1. Compare your `schema.prisma` with the empty database.
2. Generate `prisma/migrations/<timestamp>_init/migration.sql`.
3. Run that SQL against your Neon DB (creates all tables).
4. Generate the Prisma Client into `node_modules/@prisma/client`.

---

### Step 9 — Set Up the Prisma Client in Your App

Create `src/lib/prisma.ts`:

```typescript
// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

declare global {
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
  const adapter = new PrismaPg(pool);
  
  return new PrismaClient({ adapter });
}

const prisma = global.__prisma ?? createPrismaClient();
if (process.env.NODE_ENV !== "production") global.__prisma = prisma;

export default prisma;
```

### Step 9 — initialize the client

```bash
npx prisma generate
```
