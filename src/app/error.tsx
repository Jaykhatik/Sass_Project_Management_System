'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Error Boundary caught:', error);
  }, [error]);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in-95 duration-300">
      <div className="w-16 h-16 bg-destructive/10 text-destructive flex items-center justify-center rounded-2xl mb-6">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
      <p className="text-muted-foreground mb-8 max-w-md">
        We encountered an unexpected error while trying to load this section. 
        Please try again.
      </p>
      <button
        onClick={() => reset()}
        className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium shadow-sm hover:bg-primary/90 transition-colors active:scale-95"
      >
        Try again
      </button>
    </div>
  );
}
