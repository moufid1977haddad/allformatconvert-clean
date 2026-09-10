'use client';

import { useEffect } from 'react';
import { reportToolError } from './lib/reportError';

// Root error boundary for the whole app (excluding the root layout itself,
// which only global-error.jsx can catch). Without this file, an uncaught
// client render error fell through to Next's built-in default screen,
// which (a) replaces the entire <html>, dropping Navbar/Footer and the
// Google Translate widget, and (b) was never reported to tool_errors.
export default function Error({ error, reset }) {
  useEffect(() => {
    const tool = (typeof window !== 'undefined'
      ? window.location.pathname.split('/').filter(Boolean).pop()
      : null) || 'unknown';
    reportToolError({ tool, source: 'browser', error });
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md text-center">
        <p className="text-4xl mb-4" aria-hidden="true">⚠️</p>
        <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
        <p className="text-neutral-500 mb-6">
          If you were downloading a file, check your browser&apos;s downloads folder first — it may have already saved successfully.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-5 py-2.5 font-semibold transition"
          >
            Try again
          </button>
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                if (window.history.length > 1) window.history.back();
                else window.location.href = '/';
              }
            }}
            className="border border-neutral-300 hover:border-neutral-400 rounded-xl px-5 py-2.5 font-semibold transition"
          >
            Go back to the previous page
          </button>
        </div>
      </div>
    </div>
  );
}
