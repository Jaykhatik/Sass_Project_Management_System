# 🎨 Phase 3 — Core UI Shell & Layout

A complete, beginner-friendly explanation of how we built the main app shell — the sidebar, header, routing, and layout — for this SaaS Project Management System.

---

## 🧠 The Big Picture

Think of Phase 3 like **building the frame of a house** before putting furniture in it.

Phase 2 gave us a database full of data. Phase 3 builds the **visual container** that will hold and display that data across every page.

```
Browser loads /dashboard
       │
       ▼
┌─────────────────────────────────────────────┐
│  src/app/layout.tsx  (Root Layout)           │
│  ┌──────────────────────────────────────┐   │
│  │  src/app/(dashboard)/dashboard/      │   │
│  │  layout.tsx  (Dashboard Layout)      │   │
│  │  ┌──────────┬───────────────────┐   │   │
│  │  │ Sidebar  │   Header          │   │   │
│  │  │          ├───────────────────┤   │   │
│  │  │  Nav     │   page.tsx        │   │   │
│  │  │  Links   │   (Dashboard      │   │   │
│  │  │          │    content)       │   │   │
│  │  └──────────┴───────────────────┘   │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

---

## Step 1 — Route Groups: How the Folder Structure Works

Next.js has two special folder naming conventions we use here:

### `(parentheses)` = Route Groups
Any folder wrapped in `()` is **invisible to the URL**. It exists purely to organize code and share layouts.

```
src/app/
├── (dashboard)/          ← URL ignores this folder name
│   └── dashboard/        ← URL sees this: /dashboard
│       ├── layout.tsx    ← Sidebar + Header wrapper
│       └── page.tsx      ← Dashboard content
├── layout.tsx            ← Root HTML wrapper (applies to everything)
└── page.tsx              ← Redirects to /dashboard
```

**Why use route groups?**  
Later in the project, we'll add `(auth)/` for login/signup pages. Those pages should NOT have a sidebar. Route groups let us have two separate layouts for two types of pages, without affecting their URLs.

```
src/app/
├── (dashboard)/          ← Layout WITH sidebar
│   └── dashboard/
└── (auth)/               ← Layout WITHOUT sidebar (coming later)
    ├── login/
    └── signup/
```

---

## Step 2 — Root Layout (`src/app/layout.tsx`)

This is the outermost wrapper for your **entire application**. Every single page goes inside this.

```tsx
export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ReduxProvider>    {/* ← Redux store available everywhere */}
          {children}
        </ReduxProvider>
      </body>
    </html>
  );
}
```

**Why `suppressHydrationWarning`?**  
Browser extensions (password managers, ad blockers) inject hidden attributes like `fdprocessedid` into buttons and inputs. React panics when the server-rendered HTML doesn't match what the browser shows. `suppressHydrationWarning` tells React: *"Don't worry about minor attribute differences caused by extensions."*

**Why is `ReduxProvider` here?**  
Redux needs to be available on every single page — the sidebar, the header, every component — so we wrap everything at the very root.

---

## Step 3 — Dashboard Layout (`(dashboard)/dashboard/layout.tsx`)

This is the layout that wraps every dashboard page. It:
1. Fetches the workspace from the database
2. Renders the `<Sidebar>` and `<Header>` around the page content

```tsx
export default async function DashboardLayout({ children }) {
  // Fetch the workspace from Prisma (Server Component — runs on server)
  const workspace = await prisma.workspace.findUnique({
    where: { slug: 'demo-workspace' },
  });

  if (!workspace) notFound(); // Shows 404 if workspace doesn't exist

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar workspaceSlug={workspace.slug} />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {children}           {/* ← page.tsx renders here */}
        </main>
      </div>
    </div>
  );
}
```

> **Server Component:** Notice there is no `'use client'` at the top. This component runs on the server, fetches the database, and sends finished HTML to the browser. This is faster and more secure.

---

## Step 4 — The Sidebar (`src/components/shared/Sidebar.tsx`)

The sidebar is a **Client Component** (`'use client'`) because it needs interactivity — Redux state for the mobile toggle.

### Key Features:

**1. Active Link Highlighting**
```tsx
const pathname = usePathname(); // Gets current URL from Next.js
const isActive = pathname === link.href; // True if we're on this page
```
The current page's link gets a solid colored background. All others are grey.

**2. Mobile Drawer (Hamburger Menu)**
On small screens, the sidebar hides off-screen to the left. When you press the hamburger button in the Header, it slides in smoothly.

```tsx
// This is Redux state controlling whether mobile sidebar is open
const isSidebarOpen = useSelector((state) => state.ui.isSidebarOpen);

// CSS transition handles the animation
className={cn(
  "transition-[transform] duration-300 ease-in-out",
  isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
)}
```
- `translate-x-0` = visible (slid in)
- `-translate-x-full` = hidden (slid off-screen to the left)
- `md:translate-x-0` = on desktop, always show regardless of Redux state

**3. Dark Overlay**
When the mobile sidebar opens, a dark blurred background appears. Clicking it closes the sidebar.

```tsx
<div
  className={cn(
    "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-all duration-300 md:hidden",
    isSidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
  )}
  onClick={close}
/>
```
Using `opacity` + `pointer-events` instead of conditional rendering makes the fade-in/out **smooth instead of abrupt**.

**4. Logout Button**
Styled with a red hover effect. Currently logs to console — will connect to real `signOut()` in Phase 14 when authentication is built.

---

## Step 5 — The Header (`src/components/shared/Header.tsx`)

Also a Client Component, because the hamburger button needs to dispatch to Redux.

```tsx
const dispatch = useDispatch();

<button onClick={() => dispatch(toggleSidebar())}>
  <Menu />   {/* Hamburger icon */}
</button>
```

`toggleSidebar()` flips `isSidebarOpen` between `true` and `false` in the Redux `uiSlice`. The Sidebar reads that value and shows/hides itself.

---

## Step 6 — Redux Slices (`src/store/slices/`)

We created two slices for the Redux store:

### `workspaceSlice.ts`
Stores the currently active workspace ID and slug. Will be populated after authentication is built.

```typescript
state = {
  currentWorkspaceId: null,
  currentWorkspaceSlug: null,
}
```

### `uiSlice.ts`
Controls UI state that needs to be shared across components.

```typescript
state = {
  isSidebarOpen: false,   // Mobile sidebar open/closed
  theme: 'system',         // Light / Dark / System
}

// Actions:
toggleSidebar()     // Flip open/closed
setSidebarOpen(bool) // Set explicitly
setTheme('dark')    // Change theme
```

**Why do we need Redux for this?**
The `Header` (which has the hamburger button) and the `Sidebar` (which opens/closes) are completely separate components — they have no parent-child relationship. Redux lets them share state without prop-drilling through many levels of components.

---

## Step 7 — Error Utilities (`src/lib/errors.ts`)

Custom error classes so our API routes and server actions can throw meaningful, typed errors instead of generic JavaScript `Error` objects.

```typescript
throw new NotFoundError('Workspace not found');
// vs plain: throw new Error('not found')  ← no status code, no code identifier
```

| Class | HTTP Status | When to Use |
|---|---|---|
| `AppError` | 500 | Generic base class |
| `NotFoundError` | 404 | Resource doesn't exist |
| `UnauthorizedError` | 401 | Not logged in |
| `ForbiddenError` | 403 | Logged in but no permission |
| `BadRequestError` | 400 | Invalid user input |
| `PlanLimitError` | 402 | Free plan limit reached |
| `ConflictError` | 409 | Duplicate record (e.g., slug taken) |

---

## Step 8 — Error & Loading Files

### `src/app/loading.tsx`
Next.js automatically shows this while a page is loading (during server-side data fetching).

```
User navigates → loading.tsx shows instantly → page.tsx finishes loading → loading.tsx disappears
```

### `src/app/error.tsx`
If any page or layout throws an error at runtime, Next.js catches it and renders this instead of a blank screen. It has a "Try again" button that calls `reset()` to retry the failed component.

### `src/app/global-error.tsx`
Last-resort fallback. Only triggers if `src/app/layout.tsx` itself crashes. Since it replaces the root layout, it must include its own `<html>` and `<body>` tags.

```
Normal crash → error.tsx      (nested inside your layout, has sidebar/header)
Layout crash → global-error.tsx  (full page takeover, no layout)
```

---

## ✅ Phase 3 Final Checklist

| # | What Was Built | File |
|---|---|---|
| 1 | Route groups for dashboard | `src/app/(dashboard)/dashboard/` |
| 2 | Sidebar with nav links, mobile drawer, logout button | `src/components/shared/Sidebar.tsx` |
| 3 | Header with search bar, hamburger button, user avatar | `src/components/shared/Header.tsx` |
| 4 | Dashboard layout fetching workspace from Prisma | `(dashboard)/dashboard/layout.tsx` |
| 5 | Placeholder dashboard page with real DB data | `(dashboard)/dashboard/page.tsx` |
| 6 | `workspaceSlice` + `uiSlice` in Redux store | `src/store/slices/` |
| 7 | Error classes (`AppError`, `NotFoundError`, etc.) | `src/lib/errors.ts` |
| 8 | Route error boundary + loading skeleton | `src/app/error.tsx`, `loading.tsx` |
| 9 | Global error boundary | `src/app/global-error.tsx` |
| 10 | Hydration error fix (`suppressHydrationWarning`) | `src/app/layout.tsx` |
