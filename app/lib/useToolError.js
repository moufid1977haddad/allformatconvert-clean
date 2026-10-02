'use client';
// P25 (03/10): every message a tool SHOWS as an error reaches tool_errors (P23 found that only 24 files reported
// theirs). Drop-in for `useState` on a tool's error state: `const [error, setError] = useToolError('')`. Setting a
// non-empty text both shows it (as before) and reports it, as errorType "ToolMessage" so a visitor's mistake ("Please
// choose a file") can be told apart from a thrown failure. The tool is named from the address (/tools/<category>/<tool>).
// Only the shown text travels, through the same sanitizer as every report (no file, no file content, no file name,
// no quoted text, URL, e-mail or long number), and reportToolError's own caps apply.
import { useCallback, useRef, useState } from 'react';
import { reportToolError, failureReportedRecently } from './reportError';

export function toolSlugFromPath(pathname) {
  const m = /^\/tools\/[a-z0-9-]+\/([a-z0-9-]{1,60})(?:\/|$)/.exec(pathname || '');
  return m ? m[1] : null;
}

// A cancellation the visitor asked for is not an error.
const NOT_AN_ERROR = /^\s*(cancell?ed|stopped)\b/i;

export function reportShownMessage(value) {
  if (typeof window === 'undefined') return;
  const tool = toolSlugFromPath(window.location.pathname);
  if (!tool || !value) return;
  const text = typeof value === 'string' ? value : (value && typeof value.message === 'string' ? value.message : '');
  if (typeof value === 'string' && !value.trim()) return;
  if (NOT_AN_ERROR.test(text)) return;
  // Deferred a tick: a catch block that reports the thrown error itself, before or after showing its message, has
  // done so by then, and the message is not sent a second time for the same failure.
  setTimeout(() => {
    if (!failureReportedRecently(tool, 3000)) reportToolError({ tool, error: text || 'non-text message', errorType: 'ToolMessage' });
  }, 0);
}

/**
 * @param {any} [initial]
 * @returns {[any, (value: any) => void]}
 */
export function useToolError(initial = '') {
  const [error, setErrorState] = useState(initial);
  const last = useRef(initial);
  const setError = useCallback((value) => {
    if (typeof value === 'function') {
      setErrorState((prev) => { const next = value(prev); last.current = next; return next; });
      return;
    }
    // Reported once per change: re-setting the same text (a retry that fails the same way) is deduplicated by
    // reportToolError anyway.
    if (value && value !== last.current) reportShownMessage(value);
    last.current = value;
    setErrorState(value);
  }, []);
  return /** @type {[any, (value: any) => void]} */ ([error, setError]);
}
