'use client';
import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from 'react';
import { formatBytes } from '../lib/formatBytes';
import { attachmentPathActive, isIosDevice, saveBlob, stageAttachment, unstageAttachment } from '../lib/download';

// THE download of the site (P18, 01/10). Every file a tool makes is offered through this component, so every tool
// shows the same thing: the file's name, its format and size, a "Download" button — and, when a tool makes several
// files, "Download all (ZIP)" above them, as iLovePDF and Smallpdf do.
//
// Why: an iPad visitor (Split PDF, 29/09) saw "Done! 1 PDF" and only the file's name, which opened the PDF in Safari
// when touched — no button said "Download". The owner saw the same on other tools. Result links had grown tool by
// tool (~110 of them, a dozen styles).
//
// iPhone / iPad: the Download link points, as soon as the row appears, at a real address of the site that answers
// with the file as an attachment (stageAttachment, app/lib/download.js) — touching it saves the file at once, as on
// iLovePDF. Until P21 the file was read and handed over AFTER the tap: fine for Split PDF's small parts, but JPG to
// PDF with a phone photo took longer than the second iOS gives a tap, and Safari opened the PDF (owner's iPhone,
// 02/10). That link is a plain one, without the download attribute, exactly like iLovePDF's: a navigation always
// goes through the service worker (a download-attribute link may be fetched by the browser's download manager
// directly, bypassing it). Before the address is ready (a fraction of a second), IosDownloadBridge still handles
// the tap. A second
// button, "Save / Share", opens Apple's share sheet with the file itself (Save to Files, AirDrop, Mail, WhatsApp) —
// navigator.share({ files }), available on iOS / iPadOS 15+. It needs the File ready BEFORE the tap (the tap's
// permission does not survive an await), hence the file is read when the row appears.
//
// A result not yet downloaded makes the browser ask before the page is left or reloaded (beforeunload). ONE rule for
// the whole site (owner, P19, 01/10): every file a visitor made and has not taken arms the question — text results
// (formatters, checksums) and generators (QR, barcode) included; until P19 they were exempt, so leaving QR Generator,
// JSON Formatter or Hash Generator lost the file without a word. As MDN advises, the question is armed only once the
// visitor has done something on the page: a sample result shown at load (Markdown Editor) never arms it. "Taken" =
// downloaded, shared, zipped, or — for a text result — copied (Copy button or Ctrl+C). Several formats of ONE result
// (QR PNG / SVG / PDF) are one file: <DownloadGroup alternatives> — taking any of them clears them all.
//
// For tests: every row is [data-file-download] with data-name / data-bytes / data-taken ("1" once taken); the link
// is [data-download]; the ZIP
// button [data-download-all]; window.__fileDownloads lists what is on screen.

const pending = new Set(); // ids of files shown and never downloaded or shared

// Has the visitor done anything yet? A result present before the first gesture is a sample, not their file.
let userActed = false;
const textRows = new Set(); // { text, markSaved } of text results on screen: copying one counts as taking it
function textTaken(copied) {
  const t = String(copied || '').trim();
  if (!t) return;
  for (const row of textRows) if (row.text.trim() === t) row.markSaved();
}
if (typeof window !== 'undefined') {
  const acted = () => { userActed = true; };
  for (const ev of ['pointerdown', 'keydown', 'input', 'change', 'paste', 'drop']) window.addEventListener(ev, acted, { capture: true, passive: true });
  // Ctrl+C, or "Copy" of the context menu, on a selection or inside a text box
  document.addEventListener('copy', () => {
    let sel = '';
    try {
      const el = document.activeElement;
      sel = el && typeof el.selectionStart === 'number' && typeof el.value === 'string'
        ? el.value.slice(el.selectionStart, el.selectionEnd) : String(window.getSelection() || '');
    } catch { sel = String(window.getSelection() || ''); }
    textTaken(sel);
  }, true);
  // the tools' "Copy" buttons (navigator.clipboard.writeText)
  const cb = navigator.clipboard;
  if (cb && typeof cb.writeText === 'function' && !cb.__fileDownloadWrapped) {
    const orig = cb.writeText.bind(cb);
    try {
      cb.writeText = (t) => orig(t).then((r) => { textTaken(t); return r; });
      cb.__fileDownloadWrapped = true;
    } catch { /* clipboard object not writable here: copying a text result then does not clear the question */ }
  }
}
function onBeforeUnload(e) {
  if (!pending.size) return undefined;
  e.preventDefault();
  e.returnValue = ''; // Chrome, Safari: the browser shows its own "Leave page?" message
  return '';
}
function markPending(id, on) {
  const had = pending.size > 0;
  if (on) pending.add(id); else pending.delete(id);
  if (typeof window === 'undefined') return;
  if (!had && pending.size) window.addEventListener('beforeunload', onBeforeUnload);
  if (had && !pending.size) window.removeEventListener('beforeunload', onBeforeUnload);
}

const extOf = (name) => (/\.([A-Za-z0-9]{1,8})$/.exec(name || '') || [])[1];
export function formatLabel(name, type) {
  const ext = extOf(name);
  if (ext) return ext.toUpperCase();
  const sub = String(type || '').split('/')[1];
  return sub ? sub.split(/[+;]/)[0].toUpperCase() : 'FILE';
}

// iPhone / iPad Safari, or any engine when a test sets window.__forceShareButton.
function shareSupported(file) {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') return false;
  if (!(isIosDevice() || window.__forceShareButton === true)) return false;
  try { return typeof navigator.share === 'function' && (!navigator.canShare || navigator.canShare({ files: [file] })); } catch { return false; }
}

const GroupContext = createContext(null);

/**
 * One file made by a tool. Give `blob` (preferred) or `href` (a blob:/data: URL the tool already made).
 * `name` is the file name offered. `note` is an optional line under the name (e.g. "3 pages"). `guard` = false: no
 * "Leave page?" question for it — no tool uses it since P19 (one rule for the site, see above). `text`: the text of a
 * text result (copying it counts as taking it). `linkProps`: extra attributes of the link (test hooks).
 * @param {{ blob?: Blob | null, href?: string | null, name: string, note?: string, primary?: boolean, guard?: boolean, text?: string, linkProps?: Record<string, string>, className?: string }} props
 */
export function FileDownload({ blob: blobProp, href, name, note, primary = true, guard = true, text, linkProps, className = '' }) {
  const id = useId();
  const group = useContext(GroupContext);
  const [blob, setBlob] = useState(blobProp || null);
  // false, or how the file was taken: 'downloaded', 'copied', or 'sibling' (another format of the same result was)
  const [saved, setSaved] = useState(false);
  // The address of a file given as a Blob is made in the browser only (after the first render), never while the page
  // is rendered on the server: a text result that exists from the start (Markdown Editor) would otherwise carry a
  // server-side address into the page. Freed a minute after it is replaced (Safari may still be reading it).
  const [ownUrl, setOwnUrl] = useState(null);
  useEffect(() => {
    if (!blobProp || href) { setOwnUrl(null); return undefined; }
    const u = URL.createObjectURL(blobProp);
    setOwnUrl(u);
    return () => { setTimeout(() => URL.revokeObjectURL(u), 60000); };
  }, [blobProp, href]);
  const url = href || ownUrl;

  // Read the file when only its address is known: its size and type are shown, and Share needs the file itself.
  useEffect(() => {
    if (blobProp) { setBlob(blobProp); return undefined; }
    let alive = true;
    setBlob(null);
    if (url) fetch(url).then((r) => r.blob()).then((b) => { if (alive) setBlob(b); }).catch(() => {});
    return () => { alive = false; };
  }, [blobProp, url]);

  const file = useMemo(() => (blob ? new File([blob], name, { type: blob.type || 'application/octet-stream' }) : null), [blob, name]);

  // iPhone / iPad: the file made ready at a real address before any tap (see the header).
  const [stagedUrl, setStagedUrl] = useState(null);
  useEffect(() => {
    setStagedUrl(null);
    if (!blob || !attachmentPathActive()) return undefined;
    let alive = true, made = null;
    stageAttachment(blob, name).then((u) => { made = u; if (alive) setStagedUrl(u); else unstageAttachment(u); }).catch(() => {});
    return () => { alive = false; if (made) { const u = made; setTimeout(() => unstageAttachment(u), 60000); } };
  }, [blob, name]);
  const [canShare, setCanShare] = useState(false); // decided in the browser (the server cannot know the device)
  useEffect(() => { setCanShare(file ? shareSupported(file) : false); }, [file]);

  useEffect(() => { setSaved(false); }, [url, name]);
  // A result already on screen before the visitor's first gesture is a sample (Markdown Editor's example): no question
  // for it. Once they change it, the new result is theirs.
  const sampleUrl = useRef(null);
  const markSaved = useCallback((how) => {
    setSaved(how === 'copied' ? 'copied' : 'downloaded');
    if (group && group.alternatives) group.takenAll();
  }, [group]);
  useEffect(() => {
    if (url && !userActed) sampleUrl.current = url;
    const isSample = !!url && url === sampleUrl.current;
    markPending(id, guard && !saved && !!url && !isSample);
    return () => markPending(id, false);
  }, [id, guard, saved, url]);

  useEffect(() => {
    if (!text) return undefined;
    const row = { text, markSaved: () => markSaved('copied') };
    textRows.add(row);
    return () => { textRows.delete(row); };
  }, [text, markSaved]);

  useEffect(() => {
    if (!group || !blob) return undefined;
    return group.register(id, { name, blob, markSaved: (how) => setSaved((s) => (s && s !== 'sibling' ? s : how)) });
  }, [group, id, name, blob]);

  useEffect(() => {
    if (typeof window === 'undefined' || !url) return undefined;
    const list = (window.__fileDownloads ||= []);
    const entry = { name, url, bytes: blob ? blob.size : null };
    list.push(entry);
    return () => { const i = list.indexOf(entry); if (i >= 0) list.splice(i, 1); };
  }, [name, url, blob]);

  const share = useCallback(async () => {
    try { await navigator.share({ files: [file], title: name }); markSaved('downloaded'); }
    catch (e) { if (e && e.name !== 'AbortError') saveBlob(file, name); }
  }, [file, name, markSaved]);

  if (!url) return null;
  const fmt = formatLabel(name, blob && blob.type);
  const btn = primary
    ? 'bg-green-700 hover:bg-green-600 text-white'
    : 'bg-white dark:bg-neutral-800 border border-green-700 text-green-800 dark:text-green-400 hover:bg-green-50 dark:hover:bg-neutral-700';
  return (
    <div data-file-download data-name={name} data-bytes={blob ? blob.size : ''} data-taken={saved ? '1' : ''} className={`flex flex-col sm:flex-row sm:items-center gap-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-3 text-left ${className}`}>
      <div className="min-w-0 flex-1">
        <div className="font-semibold text-neutral-900 dark:text-neutral-100 break-all text-sm">{name}</div>
        <div className="text-xs text-neutral-600 dark:text-neutral-400">
          <span className="font-semibold">{fmt}</span>{blob ? ` · ${formatBytes(blob.size)}` : ''}{note ? ` · ${note}` : ''}{saved === 'downloaded' ? ' · Downloaded ✓' : saved === 'copied' ? ' · Copied ✓' : ''}
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
        <a {...linkProps} href={stagedUrl || url} download={stagedUrl ? undefined : name} data-download data-staged={stagedUrl ? '1' : undefined} onClick={() => markSaved('downloaded')} aria-label={`Download ${name}`}
          className={`flex-1 sm:flex-none text-center rounded-lg px-4 py-2 font-semibold text-sm transition ${btn}`}>
          Download
        </a>
        {canShare && (
          <button type="button" onClick={share} data-share aria-label={`Save or share ${name}`}
            className="flex-1 sm:flex-none rounded-lg px-4 py-2 font-semibold text-sm transition bg-neutral-800 hover:bg-neutral-700 text-white">
            Save / Share
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Several files from one run. Renders "Download all (N files, ZIP)" as soon as two or more are ready, then the rows.
 * `zipName` is the archive's name. `alternatives`: the rows are several formats of ONE result (QR PNG / SVG / PDF,
 * AI image WebP / PNG) — taking any of them counts as taking the result, so "Leave page?" is no longer asked.
 * @param {{ zipName?: string, alternatives?: boolean, children?: import("react").ReactNode, className?: string }} props
 */
export function DownloadGroup({ zipName = 'files.zip', alternatives = false, children, className = '' }) {
  const items = useRef(new Map());
  const [count, setCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const register = useCallback((id, item) => {
    items.current.set(id, item);
    setCount(items.current.size);
    return () => { items.current.delete(id); setCount(items.current.size); };
  }, []);
  const takenAll = useCallback(() => { for (const it of items.current.values()) it.markSaved('sibling'); }, []);
  const ctx = useMemo(() => ({ register, alternatives, takenAll }), [register, alternatives, takenAll]);
  const downloadAll = async () => {
    setBusy(true);
    try {
      const { downloadZip } = await import('client-zip');
      const seen = new Map();
      const entries = [...items.current.values()].map(({ name, blob }) => {
        // two files of the same name would overwrite each other in the archive
        const n = seen.get(name) || 0; seen.set(name, n + 1);
        const unique = n ? name.replace(/(\.[^.]*)?$/, (ext) => ` (${n + 1})${ext || ''}`) : name;
        return { name: unique, input: blob, lastModified: new Date() };
      });
      const zip = await downloadZip(entries).blob();
      await saveBlob(new Blob([zip], { type: 'application/zip' }), zipName);
      for (const it of items.current.values()) it.markSaved('downloaded');
    } finally { setBusy(false); }
  };
  return (
    <GroupContext.Provider value={ctx}>
      <div className={`space-y-2 ${className}`}>
        {count > 1 && (
          <button type="button" onClick={downloadAll} disabled={busy} data-download-all
            className="w-full bg-green-700 hover:bg-green-600 disabled:opacity-60 text-white rounded-xl px-6 py-3 font-semibold transition">
            {busy ? 'Preparing the ZIP…' : `Download all (${count} files, ZIP)`}
          </button>
        )}
        {children}
      </div>
    </GroupContext.Provider>
  );
}

/**
 * A text result offered as a file (formatters, converters, generators): same row, from the text itself. Guarded like
 * any file since P19; copying the text counts as taking it.
 * @param {{ text?: string | null, name: string, type?: string, className?: string }} props
 */
export function TextDownload({ text, name, type = 'text/plain;charset=utf-8', className = '' }) {
  const blob = useMemo(() => (text ? new Blob([text], { type }) : null), [text, type]);
  if (!blob) return null;
  return <FileDownload blob={blob} name={name} text={text} primary={false} className={className} />;
}

export default FileDownload;
