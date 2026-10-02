'use client';
import { useEffect } from 'react';
import { reportToolError } from '../lib/reportError';
import { toolSlugFromPath } from '../lib/useToolError';

// P25 (03/10): the safety net under every tool page (mounted by app/tools/layout.tsx): an exception nobody caught
// or a promise rejection nobody handled on /tools/<category>/<tool> is reported, so a tool with no error message of
// its own still reaches tool_errors. Render crashes go through app/error.jsx; messages a tool shows, through
// useToolError. Only our own code counts: errors from another origin (Google Translate, ads, browser extensions)
// arrive as "Script error." without a file of ours and are skipped, as are cancellations and ResizeObserver notices.
const IGNORED = /^(Script error\.?|ResizeObserver loop|.*AbortError)/i;

function fromOurCode(filename) {
  if (!filename) return true; // a rejection has no file; an inline handler reports none
  try { return new URL(filename, window.location.href).origin === window.location.origin; } catch { return false; }
}

export default function ToolErrorWatch() {
  useEffect(() => {
    const onError = (ev) => {
      const tool = toolSlugFromPath(window.location.pathname);
      if (!tool || !fromOurCode(ev.filename)) return;
      const error = ev.error instanceof Error ? ev.error : new Error(String(ev.message || 'unknown error'));
      if (IGNORED.test(error.message) || error.name === 'AbortError') return;
      reportToolError({ tool, error, errorType: 'Uncaught' + (/^[A-Za-z]{1,40}$/.test(error.name) ? error.name : 'Error') });
    };
    const onRejection = (ev) => {
      const tool = toolSlugFromPath(window.location.pathname);
      if (!tool) return;
      const r = ev.reason;
      const error = r instanceof Error ? r : new Error(typeof r === 'string' ? r : 'non-error rejection');
      if (IGNORED.test(error.message) || error.name === 'AbortError') return;
      reportToolError({ tool, error, errorType: 'Unhandled' + (/^[A-Za-z]{1,40}$/.test(error.name) ? error.name : 'Error') });
    };
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => { window.removeEventListener('error', onError); window.removeEventListener('unhandledrejection', onRejection); };
  }, []);
  return null;
}
