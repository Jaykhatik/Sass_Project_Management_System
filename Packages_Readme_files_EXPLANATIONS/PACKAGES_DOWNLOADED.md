# 📦 Packages Downloaded (Phase 1 & Core Setup)

This document provides a detailed, simple explanation of all the packages required for Phase 1 (and the core of the app), broken down by what they do and exactly why we need them, aligned with our Redux architecture (Plan A) but using Tailwind CSS & shadcn/ui for UI components.

---

## ✅ Quick Install Status

| # | Package | Status |
|---|---------|--------|
| 1 | `prisma` & `@prisma/client` | ✅ Installed |
| 2 | `@reduxjs/toolkit` & `react-redux` | ✅ Installed |
| 3 | `lucide-react` | ✅ Installed |
| 4 | `@types/node` & `@types/react` | ✅ Installed |
| 5 | `clsx` & `tailwind-merge` | ⏳ Pending |
| 6 | `shadcn/ui` | ⏳ Pending |
| 7 | `zod` | ⏳ Pending |

---

## 🗄️ Database & Backend Tools

### 1. [x] `prisma` & `@prisma/client`
*   **What it is:** A tool that lets you talk to your PostgreSQL database using clean, easy-to-read JavaScript/TypeScript instead of writing raw, complex SQL queries.
*   **Why you need it:** Imagine you want to get all tasks for a project. Without Prisma, you'd have to write `SELECT * FROM tasks WHERE project_id = 1`. With Prisma, you just write `prisma.task.findMany(...)`. It makes saving, finding, and updating data much faster, safer, and prevents errors because it knows exactly what your database looks like.

## 🧠 State & Data Management

### 2. [x] `@reduxjs/toolkit` & `react-redux`
*   **What it is:** The official, opinionated toolset for Redux, used for global state management and data fetching (via RTK Query).
*   **Why you need it:** Instead of using Redis for caching or separate tools for fetching, RTK Query handles all polling, caching, and background data updates for your notifications and task feeds. Redux Toolkit will efficiently store your global UI state (like whether the sidebar is open, or which workspace is currently active) and provide it to any component in the app.

## 🎨 Styling & User Interface

### 3. [ ] `clsx` & `tailwind-merge`
*   **What they are:** Little helpers for Tailwind CSS. They combine CSS classes together safely.
*   **Why you need them:** In React, you often want buttons to change color based on their state (e.g., turning red if it's a "Delete" button). Sometimes, you accidentally apply conflicting rules like `bg-blue-500` and `bg-red-500` at the same time. These two packages work together to delete the wrong one and keep the right one, ensuring your UI doesn't break when combining styles.

### 4. [x] `lucide-react`
*   **What it is:** A massive collection of beautiful, clean icons (like home buttons, trash cans, settings gears).
*   **Why you need it:** You need icons to make your dashboard look like a premium SaaS product. `lucide-react` is the official icon set used by `shadcn/ui`, and it lets you add an icon just by typing `<TrashIcon />`.

### 5. [ ] `shadcn/ui` (The component library)
*   **What it is:** A collection of pre-designed, professional-looking building blocks (buttons, popups, menus, cards). 
*   **Why you need it:** Instead of spending hours designing a calendar dropdown or a fancy button from scratch, `shadcn/ui` gives you the code for them instantly. You use the command `npx shadcn-ui@latest add button input...` to literally copy-paste perfect, accessible UI elements directly into your project so you can focus on making the app work, not just making it look pretty.

## 🛡️ Safety & Validation

### 6. [ ] `zod`
*   **What it is:** A strict bouncer for your data. It checks information to make sure it's exactly what you expect.
*   **Why you need it:** If a user tries to create a task, `zod` checks: "Is the title at least 3 letters long? Is the due date an actual date? Is the priority set to High, Medium, or Low?" If the user types something wrong, `zod` catches it immediately and throws a helpful error *before* it accidentally crashes your database.

## 🛠️ Developer Tools

### 7. [x] `@types/node` & `@types/react`
*   **What they are:** "Dictionaries" for TypeScript.
*   **Why you need them:** Since you are using TypeScript, your code editor (like VS Code) needs to know the exact rules and vocabulary of Node.js and React. These packages give your editor "autocomplete" superpowers and will put a red squiggly line under your code if you make a typo, saving you hours of hunting for bugs.
