'use client';
import { forwardRef, useState } from 'react';

// P27 (phase 7): a text field that never freezes the page with a very large text.
//
// Measured (scripts/p27/big-single-line.mjs, Chromium, this machine): 20 MB of text in an ordinary <textarea> --
// a CSV file loaded into CSV to TSV, a JSON pasted into JSON Formatter or Case Converter -- froze the tab 5.9 to 8.5 s
// on the way in, then 1.3 to 2.9 s for EACH key typed; a bare <textarea> alone costs 3.2-4.4 s, on one line or many,
// so the field itself is the problem, not the tool. Code editors (CodeMirror, Monaco) avoid it by drawing only the
// visible lines; for a text that size nobody edits by hand, the market's tools show a preview and work on the whole.
//
// Same here: up to LIMIT characters nothing changes (an ordinary <textarea>, every prop passed through). Above it the
// field shows the first PREVIEW characters, read-only, says how large the text is and that the tool works on ALL of it
// (the tool keeps the full text in its own state, as before), and offers "Edit here anyway" (the full text in the
// field, slow) and, for an editable field, "Clear". A paste that would go above LIMIT does not go through the field:
// the tool receives the new text exactly as a paste would have produced it (same onChange event shape).
const LIMIT = 1_000_000;
const PREVIEW = 20_000;

const fmt = (n) => (n >= 1024 * 1024 ? `${(n / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`);

function TextArea({ value, onChange, readOnly, className = '', ...rest }, ref) {
  const [editAnyway, setEditAnyway] = useState(false);
  const text = typeof value === 'string' ? value : value == null ? '' : String(value);
  const large = text.length > LIMIT;

  const onPaste = (e) => {
    // uncontrolled fields (no value prop, e.g. Code Formatter) and read-only ones are left to the browser
    if (readOnly || !onChange || value === undefined) return rest.onPaste?.(e);
    const pasted = e.clipboardData?.getData('text') ?? '';
    const el = e.currentTarget;
    const start = el.selectionStart ?? text.length;
    const end = el.selectionEnd ?? text.length;
    const next = text.slice(0, start) + pasted + text.slice(end);
    if (next.length <= LIMIT) return rest.onPaste?.(e);
    e.preventDefault();
    setEditAnyway(false);
    onChange({ target: { value: next, name: el.name, id: el.id }, currentTarget: { value: next, name: el.name, id: el.id }, type: 'change' });
  };

  if (!large || editAnyway) {
    return <textarea ref={ref} value={value} onChange={onChange} readOnly={readOnly} className={className} {...rest} onPaste={onPaste} />;
  }
  const bytes = new Blob([text]).size;
  return (
    <div className="space-y-2" data-large-text={text.length}>
      <textarea
        ref={ref}
        {...rest}
        className={className}
        value={`${text.slice(0, PREVIEW)}\n…`}
        readOnly
        aria-label={rest['aria-label'] ? `${rest['aria-label']} (preview)` : 'Text preview'}
      />
      <p className="text-xs text-neutral-600 dark:text-neutral-400" role="note">
        This text is {fmt(bytes)} ({text.length.toLocaleString()} characters): only its beginning is shown, because a text
        box this large freezes the browser. {readOnly ? 'Copy and download use the whole text.' : 'The tool works on the whole text.'}
      </p>
      <div className="flex gap-2 text-xs">
        <button type="button" onClick={() => setEditAnyway(true)} className="px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800">
          {readOnly ? 'Show it all here (slow)' : 'Edit here anyway (slow)'}
        </button>
        {!readOnly && onChange && (
          <button type="button" onClick={() => onChange({ target: { value: '' }, currentTarget: { value: '' }, type: 'change' })} className="px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800">
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

export default forwardRef(TextArea);
