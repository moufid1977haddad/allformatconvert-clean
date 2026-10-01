'use client';
import { useEffect, useState } from 'react';

// "Click or drop a file here" (P20, 01/10): about 95 tool pages said it, but only 8 handled a drop -- on the others a
// dropped file was opened by the browser in place of the page. Like IosDownloadBridge, one site-wide rule instead of
// 95 edits: a file dropped on an upload area goes to that area's file input, exactly as if it had been chosen in the
// picker (same `change` event, so each tool's own checks run). The market's upload areas all take a drop (iLovePDF,
// Smallpdf, Squoosh).
//   - Upload area = the nearest element around the drop point that holds exactly one enabled file input; a drop
//     elsewhere on the page goes to the page's only file input, if it has just one.
//   - The input's `accept` is applied as the picker applies it; a file it refuses is not passed on and the visitor is
//     told which files the tool takes. One file for an input without `multiple`.
//   - Pages with their own drop handling (they call preventDefault) are left alone.
const enabledInputs = (root) => [...root.querySelectorAll('input[type="file"]:not([disabled])')];

function targetInput(target) {
  let el = target instanceof Element ? target : null;
  for (let depth = 0; el && el !== document.body && depth < 10; depth++, el = el.parentElement) {
    const inputs = enabledInputs(el);
    if (inputs.length === 1) return inputs[0];
    if (inputs.length > 1) return null;
  }
  const all = enabledInputs(document);
  return all.length === 1 ? all[0] : null;
}

export function accepts(accept, file) {
  const tokens = (accept || '').split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
  if (!tokens.length) return true;
  const name = file.name.toLowerCase();
  const type = (file.type || '').toLowerCase();
  return tokens.some((t) => (t.startsWith('.') ? name.endsWith(t) : t.endsWith('/*') ? type.startsWith(t.slice(0, -1)) : type === t));
}

const hasFiles = (e) => Boolean(e.dataTransfer) && [...(e.dataTransfer.types || [])].includes('Files');

export default function FileDropBridge() {
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let marked = null;
    const mark = (el) => {
      if (marked === el) return;
      if (marked) marked.removeAttribute('data-drop-over');
      marked = el;
      if (el) el.setAttribute('data-drop-over', '');
    };
    const zoneOf = (input) => (input && input.parentElement) || null;

    const onDragOver = (e) => {
      if (e.defaultPrevented || !hasFiles(e)) return;
      const input = targetInput(e.target);
      if (!input) { mark(null); return; }
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      mark(zoneOf(input));
    };
    const onDragLeave = (e) => { if (!e.relatedTarget) mark(null); };
    const onDrop = (e) => {
      mark(null);
      if (e.defaultPrevented || !hasFiles(e)) return;
      const input = targetInput(e.target);
      if (!input) return;
      e.preventDefault();
      const dropped = [...e.dataTransfer.files];
      const ok = dropped.filter((f) => accepts(input.accept, f));
      if (!ok.length) {
        const list = input.accept.split(',').map((t) => t.trim()).filter(Boolean);
        setNotice(`This tool doesn't take ${dropped.length > 1 ? 'these files' : `“${dropped[0]?.name || 'this file'}”`}. It accepts: ${list.slice(0, 10).join(', ')}${list.length > 10 ? '…' : ''}`);
        return;
      }
      setNotice(ok.length < dropped.length ? `${dropped.length - ok.length} file(s) skipped: not a type this tool takes.` : '');
      const dt = new DataTransfer();
      (input.multiple ? ok : ok.slice(0, 1)).forEach((f) => dt.items.add(f));
      input.files = dt.files;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    };
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('drop', onDrop);
    };
  }, []);

  useEffect(() => {
    if (!notice) return undefined;
    const t = setTimeout(() => setNotice(''), 6000);
    return () => clearTimeout(t);
  }, [notice]);

  if (!notice) return null;
  return (
    <div role="status" data-drop-notice className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[10000] max-w-[calc(100vw-32px)] rounded-xl bg-neutral-900 text-white text-sm px-4 py-3 shadow-lg">
      {notice}
    </div>
  );
}
