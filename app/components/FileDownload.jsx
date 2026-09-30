'use client';
import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from 'react';
import { formatBytes } from '../lib/formatBytes';
import { isIosDevice, saveBlob } from '../lib/download';

// THE download of the site (P18, 01/10). Every file a tool makes is offered through this component, so every tool
// shows the same thing: the file's name, its format and size, a "Download" button — and, when a tool makes several
// files, "Download all (ZIP)" above them, as iLovePDF and Smallpdf do.
//
// Why: an iPad visitor (Split PDF, 29/09) saw "Done! 1 PDF" and only the file's name, which opened the PDF in Safari
// when touched — no button said "Download". The owner saw the same on other tools. Result links had grown tool by
// tool (~110 of them, a dozen styles).
//
// iPhone / iPad: the Download link is saved as an attachment by IosDownloadBridge (app/lib/download.js), and a second
// button, "Save / Share", opens Apple's share sheet with the file itself (Save to Files, AirDrop, Mail, WhatsApp) —
// navigator.share({ files }), available on iOS / iPadOS 15+. It needs the File ready BEFORE the tap (the tap's
// permission does not survive an await), hence the file is read when the row appears.
//
// A result not yet downloaded makes the browser ask before the page is left or reloaded (beforeunload).
//
// For tests: every row is [data-file-download] with data-name / data-bytes; the link is [data-download]; the ZIP
// button [data-download-all]; window.__fileDownloads lists what is on screen.

const pending = new Set(); // ids of files shown and never downloaded or shared
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
 * "Leave page?" question for it (a text result still on screen). `linkProps`: extra attributes of the link (test hooks).
 * @param {{ blob?: Blob | null, href?: string | null, name: string, note?: string, primary?: boolean, guard?: boolean, linkProps?: Record<string, string>, className?: string }} props
 */
export function FileDownload({ blob: blobProp, href, name, note, primary = true, guard = true, linkProps, className = '' }) {
  const id = useId();
  const group = useContext(GroupContext);
  const [blob, setBlob] = useState(blobProp || null);
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
  const [canShare, setCanShare] = useState(false); // decided in the browser (the server cannot know the device)
  useEffect(() => { setCanShare(file ? shareSupported(file) : false); }, [file]);

  useEffect(() => { setSaved(false); }, [url, name]);
  useEffect(() => {
    markPending(id, guard && !saved && !!url);
    return () => markPending(id, false);
  }, [id, guard, saved, url]);

  useEffect(() => {
    if (!group || !blob) return undefined;
    return group.register(id, { name, blob, markSaved: () => setSaved(true) });
  }, [group, id, name, blob]);

  useEffect(() => {
    if (typeof window === 'undefined' || !url) return undefined;
    const list = (window.__fileDownloads ||= []);
    const entry = { name, url, bytes: blob ? blob.size : null };
    list.push(entry);
    return () => { const i = list.indexOf(entry); if (i >= 0) list.splice(i, 1); };
  }, [name, url, blob]);

  const share = useCallback(async () => {
    try { await navigator.share({ files: [file], title: name }); setSaved(true); }
    catch (e) { if (e && e.name !== 'AbortError') saveBlob(file, name); }
  }, [file, name]);

  if (!url) return null;
  const fmt = formatLabel(name, blob && blob.type);
  const btn = primary
    ? 'bg-green-700 hover:bg-green-600 text-white'
    : 'bg-white dark:bg-neutral-800 border border-green-700 text-green-800 dark:text-green-400 hover:bg-green-50 dark:hover:bg-neutral-700';
  return (
    <div data-file-download data-name={name} data-bytes={blob ? blob.size : ''} className={`flex flex-col sm:flex-row sm:items-center gap-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-3 text-left ${className}`}>
      <div className="min-w-0 flex-1">
        <div className="font-semibold text-neutral-900 dark:text-neutral-100 break-all text-sm">{name}</div>
        <div className="text-xs text-neutral-600 dark:text-neutral-400">
          <span className="font-semibold">{fmt}</span>{blob ? ` · ${formatBytes(blob.size)}` : ''}{note ? ` · ${note}` : ''}{saved ? ' · Downloaded ✓' : ''}
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
        <a {...linkProps} href={url} download={name} data-download onClick={() => setSaved(true)} aria-label={`Download ${name}`}
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
 * `zipName` is the archive's name.
 * @param {{ zipName?: string, children?: import("react").ReactNode, className?: string }} props
 */
export function DownloadGroup({ zipName = 'files.zip', children, className = '' }) {
  const items = useRef(new Map());
  const [count, setCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const register = useCallback((id, item) => {
    items.current.set(id, item);
    setCount(items.current.size);
    return () => { items.current.delete(id); setCount(items.current.size); };
  }, []);
  const ctx = useMemo(() => ({ register }), [register]);
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
      for (const it of items.current.values()) it.markSaved();
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
 * A text result offered as a file (formatters, converters, generators): same row, from the text itself.
 * @param {{ text?: string | null, name: string, type?: string, className?: string }} props
 */
export function TextDownload({ text, name, type = 'text/plain;charset=utf-8', className = '' }) {
  const blob = useMemo(() => (text ? new Blob([text], { type }) : null), [text, type]);
  if (!blob) return null;
  return <FileDownload blob={blob} name={name} primary={false} guard={false} className={className} />;
}

export default FileDownload;
