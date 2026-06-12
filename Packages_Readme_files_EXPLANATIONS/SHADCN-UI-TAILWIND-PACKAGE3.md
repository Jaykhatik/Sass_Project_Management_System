# 🎨 Shadcn/UI & Tailwind CSS (Package 3)

## What is it?
**Shadcn/UI** is not a traditional component library that you install via npm (like Material UI). Instead, it is a collection of beautifully designed, accessible components that you generate directly into your project's codebase. It heavily relies on **Tailwind CSS** for styling.

## Why do we need it in our project?
To build a premium, modern SaaS platform, you need polished user interfaces (like select dropdowns, date pickers, modals, and complex buttons).
1. **Speed:** Instead of spending hours styling a custom dropdown to look professional and work perfectly on all screen readers, you just type `npx shadcn@latest add select`.
2. **Customizability:** Because the code is copied *into* your project (into `src/components/ui`), you own the code. You can tweak the padding, colors, and animations exactly how you want.
3. **Tailwind Merging:** It uses helpers like `clsx` and `tailwind-merge` to ensure that when you pass custom classes to a component, they merge safely without CSS conflicts.

## Basic Usage Example

**1. Adding a Component:**
```bash
npx shadcn@latest add button
```

**2. Using it in your App:**
```tsx
import { Button } from "@/components/ui/button"

export default function Page() {
  return (
    <Button variant="destructive" size="lg">
      Delete Project
    </Button>
  )
}
```
