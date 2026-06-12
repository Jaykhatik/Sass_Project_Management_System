# 🖼️ Lucide React (Package 4)

## What is it?
**Lucide** is a beautiful and consistent icon toolkit. `lucide-react` is the specific package that provides these icons as React components.

## Why do we need it in our project?
A Project Management dashboard requires numerous visual cues: menus, settings gears, trash cans, user avatars, and checkmarks.
1. **Consistency:** All Lucide icons share the same base design language, stroke width, and corner radius, ensuring your UI looks highly cohesive and premium.
2. **Customizability:** Because they are inline SVGs, you can easily alter their size and color using standard Tailwind text utility classes (e.g., `text-red-500` makes the icon red).
3. **Shadcn Integration:** Lucide is the default icon library utilized by `shadcn/ui`.

## Basic Usage Example

```tsx
import { Trash, Settings, PlusCircle } from "lucide-react"

export default function ActionMenu() {
  return (
    <div className="flex gap-4">
      <button className="flex items-center text-red-500">
        <Trash className="w-4 h-4 mr-2" /> Delete
      </button>
      
      <button className="flex items-center text-blue-500">
        <PlusCircle className="w-4 h-4 mr-2" /> New Task
      </button>
    </div>
  )
}
```
