# Phase 14 - Authentication

> **Goal:** Add real login and signup so the app uses signed-in users, protects dashboard routes, and creates workspaces for new users.

## What This Phase Does

- lets a user sign up with name, email, and password
- lets a user log in with email and password
- stores an access token and refresh token in secure cookies
- redirects signed-out users away from protected dashboard pages
- redirects signed-in users away from login and signup pages
- creates a first workspace for a new user
- creates a welcome project after signup
- keeps the current workspace tied to the signed-in user

## Main Files

| File | What it does |
|---|---|
| `src/lib/auth.ts` | Core auth helper functions for password hashing, token creation, refresh, cookie handling, and session lookup |
| `src/app/api/auth/register/route.ts` | Registers a new user, creates their workspace, creates a welcome project, and sets auth cookies |
| `src/app/api/auth/login/route.ts` | Checks email/password, creates tokens, and signs the user in |
| `src/app/api/auth/logout/route.ts` | Deletes the session and clears auth cookies |
| `src/app/api/auth/me/route.ts` | Returns the current signed-in user |
| `src/app/(auth)/login/page.tsx` | Login UI |
| `src/app/(auth)/signup/page.tsx` | Signup UI |
| `src/middleware.ts` | Protects dashboard routes and keeps auth pages public |
| `src/app/(dashboard)/dashboard/layout.tsx` | Stops signed-out users from entering the dashboard shell |
| `src/app/(dashboard)/dashboard/page.tsx` | Loads the current user workspace and dashboard data |
| `src/app/(dashboard)/dashboard/projects/page.tsx` | Loads projects for the current workspace |
| `src/app/(dashboard)/dashboard/members/page.tsx` | Loads workspace members for the current workspace |
| `src/app/(dashboard)/dashboard/settings/page.tsx` | Loads workspace settings for the current workspace |

## How The Auth System Works

### 1. Signup

1. The user fills the signup form.
2. The frontend sends the data to `POST /api/auth/register`.
3. The route validates the input.
4. The password is hashed.
5. A new user is created.
6. A first workspace is created for that user.
7. A welcome project is created.
8. An access token and refresh token are created.
9. Both tokens are saved as secure cookies.
10. The user is sent to the dashboard.

### 2. Login

1. The user fills the login form.
2. The frontend sends the data to `POST /api/auth/login`.
3. The route checks the email and password.
4. If the password is correct, new tokens are created.
5. The tokens are stored in cookies.
6. The user is sent to the dashboard.

### 3. Session Check

1. Server pages call `getSessionUser()` from `src/lib/auth.ts`.
2. If the access token is valid, the user is returned.
3. If the access token is expired, the refresh token is checked.
4. If the refresh token is still valid, a new access token is created.
5. The user stays signed in without logging in again.

### 4. Route Protection

1. `src/middleware.ts` checks the request path.
2. If the user is not signed in and tries `/dashboard`, they are sent to `/login`.
3. If the user is signed in and tries `/login` or `/signup`, they are sent to `/dashboard`.
4. This prevents direct access by typing `/dashboard` in the browser.

### 5. Workspace Flow After Login

1. The app finds the user’s first workspace with `getPrimaryWorkspaceForUser()`.
2. Dashboard pages use that workspace ID.
3. Projects, members, and settings load from the signed-in user’s workspace.
4. New project creation uses the logged-in user as the creator.

## Token Strategy

| Token | Time | Purpose |
|---|---|---|
| Access token | 15 minutes | Used for normal signed-in access |
| Refresh token | 30 days | Used to create a new access token silently |

## API Table

| Method | Route | What it does |
|---|---|---|
| `POST` | `/api/auth/register` | Create user, workspace, welcome project, and session |
| `POST` | `/api/auth/login` | Log in existing user |
| `POST` | `/api/auth/logout` | Log out user and clear tokens |
| `GET` | `/api/auth/me` | Return current signed-in user |

## Simple File Details

### `src/lib/auth.ts`

This file is the center of the auth system.

It handles:
- password hashing
- password checking
- access token creation
- refresh token creation
- token refresh
- cookie storage
- reading the current user from cookies
- finding the user’s workspace

### `src/app/api/auth/register/route.ts`

This route handles signup.

It:
- checks name, email, and password
- prevents duplicate emails
- creates the user
- creates a workspace for the user
- creates a welcome project
- creates access and refresh tokens
- stores the cookies

### `src/app/api/auth/login/route.ts`

This route handles login.

It:
- checks email and password
- verifies the password hash
- creates a new auth session
- stores access and refresh cookies

### `src/app/api/auth/logout/route.ts`

This route handles logout.

It:
- removes the session from the database
- clears both cookies

### `src/app/api/auth/me/route.ts`

This route returns the current user.

It is useful when the UI wants to know who is signed in.

### `src/middleware.ts`

This file protects the app routes.

It makes sure:
- signed-out users cannot enter `/dashboard`
- signed-in users do not stay on `/login` or `/signup`

### `src/app/(auth)/login/page.tsx`

This is the login screen.

It:
- takes email and password
- sends the login request
- redirects to the dashboard

### `src/app/(auth)/signup/page.tsx`

This is the signup screen.

It:
- takes name, email, and password
- sends the signup request
- redirects to the dashboard after success

## Important Note

This Phase 14 version already gives you a smooth working auth flow with protected routes.

Still planned for later if you want full enterprise auth:
- Google OAuth
- GitHub OAuth
- forgot password
- reset password
- email verification
- invitation email flow

## Done When

- user can sign up successfully
- user can log in successfully
- dashboard routes are protected
- login and signup pages are public
- access token refresh works
- the app uses the signed-in user’s workspace
