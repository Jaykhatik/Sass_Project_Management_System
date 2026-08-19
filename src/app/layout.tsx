
import "./globals.css";
import { ReduxProvider } from "@/components/providers/redux-provider";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});


import { Toaster } from "react-hot-toast";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ReduxProvider>
          <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
          {children}
        </ReduxProvider>
      </body>
    </html>
  );
}
