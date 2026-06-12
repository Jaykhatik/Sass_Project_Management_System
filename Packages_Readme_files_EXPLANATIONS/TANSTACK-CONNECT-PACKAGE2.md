# ⚡ How to Setup TanStack React Query (For Beginners)

Think of TanStack React Query like a super-smart memory bank for your app. It fetches data from your database and "remembers" it, so your app is incredibly fast.

Here is the exact step-by-step process to set it up from scratch.

---

### Step 1: Download the Engine
First, you need to download the package into your project. Open your terminal (command line) and type:

```bash
npm install @tanstack/react-query
```

---

### Step 2: Create the "Battery" (Provider File)
Even though you downloaded it, your app doesn't know how to turn it on yet. We need to create a small "battery" file to power it up.

1. Go into your `src` folder.
2. Inside `src`, look for (or create) a folder named `components`.
3. Inside `components`, create another folder named `providers`.
4. Create a new file in there named `query-provider.tsx`.

Now, open `query-provider.tsx` and copy-paste this exact code:

```tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // This line turns on the engine and keeps it running!
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

---

### Step 3: Plug the Battery into your App
Now that we have our battery (`QueryProvider`), we need to plug it into the main root of your entire application so every single page gets power.

1. Open your main layout file. This is located at `src/app/layout.tsx`.
2. First, **import** the battery you just created at the top of the file:
   ```tsx
   import { QueryProvider } from "@/components/providers/query-provider";
   ```
3. Next, find the `<body>` tags in that file. Wrap whatever is inside those tags with `<QueryProvider>`.

It should look exactly like this when you are done:

```tsx
import "./globals.css";
import { QueryProvider } from "@/components/providers/query-provider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        
        {/* We plug it in here! */}
        <QueryProvider>
          {children}
        </QueryProvider>
        
      </body>
    </html>
  );
}
```

**🎉 That's it! You are fully connected.** 
You don't need to do anything else right now. Later, when we tell the app to grab a list of Tasks or Projects, TanStack Query will automatically step in, fetch it, and remember it for you!
