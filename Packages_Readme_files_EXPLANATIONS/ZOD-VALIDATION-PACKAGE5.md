# 🛡️ Zod (Package 5)

## What is it?
**Zod** is a strict, TypeScript-first schema declaration and validation library. It allows you to create an exact "shape" of what your data should look like and immediately verify if incoming data matches that shape.

## Why do we need it in our project?
In our SaaS app, users will be constantly submitting forms (creating tasks, inviting members, updating projects). We cannot blindly trust what the user submits.
1. **Security & Stability:** If a user submits a task due date, we must ensure it's actually a valid date string. If they type a password, we must ensure it's at least 8 characters long. Zod prevents bad data from reaching our database.
2. **Form Integration:** Zod works perfectly with form libraries (like React Hook Form) to display real-time, helpful error messages directly under the input fields (e.g., *"Task title must be at least 3 characters"*).
3. **Type Inference:** You define the rules once in Zod, and it automatically generates the TypeScript Types for you!

## Basic Usage Example

**1. Defining a Schema:**
```typescript
import { z } from "zod"

export const TaskSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
  dueDate: z.string().datetime(),
})

// Automatically generate the TypeScript Type!
export type TaskType = z.infer<typeof TaskSchema>
```

**2. Validating Data:**
```typescript
const result = TaskSchema.safeParse({
  title: "A", 
  priority: "URGENT", // Error! Not in enum
})

if (!result.success) {
  console.log(result.error.issues) // Returns exactly what went wrong
}
```
