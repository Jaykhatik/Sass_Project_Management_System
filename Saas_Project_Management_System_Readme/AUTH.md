# 🔐 Authentication

This document covers the authentication system built on **NextAuth.js v5** (Auth.js).

---

## Table of Contents

- [Overview](#overview)
- [Providers](#providers)
- [Session Strategy](#session-strategy)
- [Middleware & Route Protection](#middleware--route-protection)
- [User Registration Flow](#user-registration-flow)
- [OAuth Flow](#oauth-flow)
- [Magic Link Flow](#magic-link-flow)
- [Password Reset Flow](#password-reset-flow)
- [Role & Permission Checks](#role--permission-checks)
- [Security Considerations](#security-considerations)

---

## Overview

Authentication is handled by **NextAuth.js v5** configured in `src/lib/auth.ts`. Sessions are stored in the PostgreSQL database (no JWT, no Redis).

```
src/
├── lib/
│   └── auth.ts          ← NextAuth config
├── app/
│   ├── api/
│   │   └── auth/
│   │       └── [...nextauth]/route.ts
│   └── (auth)/
│       ├── login/page.tsx
│       ├── register/page.tsx
│       ├── forgot-password/page.tsx
│       └── reset-password/page.tsx
└── middleware.ts          ← Protects all /dashboard routes
```

---

## Providers

### 1. Credentials (Email + Password)

- Passwords are hashed with **bcrypt** (12 salt rounds)
- Login returns a session; failed attempts are tracked (no lockout by default, configurable)
- Account must have `emailVerified = true` to log in

### 2. Google OAuth

Requires:
```env
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

### 3. GitHub OAuth

Requires:
```env
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
```

### 4. Magic Link (Email OTP)

- User enters email → receives a 6-digit OTP or a one-click link
- OTP expires in 10 minutes
- Implemented via the `Resend` email provider

---

## Session Strategy

Sessions use **database sessions** (not JWT). Each session is a row in the `sessions` table, linked to a user.

**Session shape** (accessible via `useSession()` or `auth()`):

```typescript
interface Session {
  user: {
    id: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
  };
  expires: string;
}
```

**Workspace context** is NOT stored in the session. The active workspace is read from the URL (`/[workspace]/...`) and membership is verified per request in middleware.

---

## Middleware & Route Protection

`src/middleware.ts` runs on every request matching the configured pattern.

```typescript
// src/middleware.ts
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Not logged in → redirect to login
  if (!req.auth && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Logged in on auth pages → redirect to dashboard
  if (req.auth && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
```

**Workspace membership** is verified in a separate server-side helper used in layouts and API routes:

```typescript
// src/lib/workspace-auth.ts
export async function requireWorkspaceMember(
  workspaceId: string,
  userId: string,
  minimumRole: Role = "member"
): Promise<WorkspaceMember> {
  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });

  if (!member) throw new UnauthorizedError("Not a workspace member");
  if (!hasMinimumRole(member.role, minimumRole)) {
    throw new ForbiddenError("Insufficient permissions");
  }

  return member;
}
```

---

## User Registration Flow

```
1. User fills out /register form
2. POST /api/auth/register
   - Validate email uniqueness
   - Hash password (bcrypt, 12 rounds)
   - Create user (emailVerified: false)
   - Send verification email (Resend)
   - Return 201
3. User clicks link in email
   - GET /api/auth/verify-email?token=...
   - Mark emailVerified: true
   - Redirect to login
4. User logs in via /api/auth/signin
```

---

## OAuth Flow

```
1. User clicks "Continue with Google"
2. NextAuth redirects to Google consent screen
3. Google returns code to /api/auth/callback/google
4. NextAuth creates or links account in DB
5. Session created → redirect to /dashboard
```

If an email already exists with credentials, the OAuth account is **automatically linked** to the existing user (configurable).

---

## Magic Link Flow

```
1. User enters email at /login (magic link tab)
2. POST /api/auth/magic-link
   - Generate 6-digit OTP (stored in DB, expires 10min)
   - Send email via Resend
3. User enters OTP or clicks link
4. POST /api/auth/magic-link/verify
   - Validate token
   - Create session
   - Redirect to dashboard
```

---

## Password Reset Flow

```
1. User visits /forgot-password
2. POST /api/auth/forgot-password { email }
   - Generate secure reset token (UUID)
   - Store hashed token + expiry in DB
   - Send email with /reset-password?token=... link
3. User visits reset link
4. POST /api/auth/reset-password { token, newPassword }
   - Validate token (not expired, not used)
   - Hash new password
   - Update user
   - Invalidate all existing sessions
```

---

## Role & Permission Checks

Roles per workspace (ordered by permission level):

| Role | Description |
|---|---|
| `owner` | Full access, billing, delete workspace |
| `admin` | Manage members, projects, settings |
| `member` | Create/edit tasks and projects |
| `guest` | Read-only access |

Role utility:

```typescript
// src/lib/roles.ts
const ROLE_HIERARCHY: Record<Role, number> = {
  owner: 4,
  admin: 3,
  member: 2,
  guest: 1,
};

export function hasMinimumRole(userRole: Role, required: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[required];
}
```

---

## Security Considerations

- **CSRF**: NextAuth.js handles CSRF tokens on all mutations automatically
- **Rate limiting**: Login attempts are rate-limited by IP using a PostgreSQL counter (no Redis). Table: `rate_limit_buckets`
- **Password policy**: Min 8 chars, at least one number enforced client + server
- **Session expiry**: Sessions expire after 30 days; active sessions are refreshed on each request
- **Secure cookies**: `httpOnly`, `sameSite=lax`, `secure` in production
- **Email verification**: Required before login for credentials accounts
- **Token hashing**: Reset and verification tokens are stored as SHA-256 hashes
