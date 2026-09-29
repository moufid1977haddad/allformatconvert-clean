'use client';
import { useEffect } from 'react';
import { attachmentPathActive, prepareAttachmentDownloads, saveBlob, nativeClick } from '../lib/download';

// iPhone / iPad (owner, 30/09): every "Download" of the site that is a blob: or data: link -- ~110 of them across the
// tools, JSX links and links clicked from code alike -- is turned, site-wide and on iOS only, into the download a
// server gives (app/lib/download.js): Safari then saves the file to Downloads instead of opening a PDF or a video in
// its viewer, or saving nothing from a data: link. Blob URLs are revoked a minute late on iOS, since tools revoke
// them right after the click and the file is read after that.
export default function IosDownloadBridge() {
  useEffect(() => {
    if (!attachmentPathActive()) return undefined;
    prepareAttachmentDownloads();
    const isFileLink = (a) => a && a.hasAttribute('download') && /^(blob|data):/i.test(a.href);
    const handle = (a) => {
      const href = a.href, name = a.getAttribute('download') || 'download';
      fetch(href).then((r) => r.blob()).then((blob) => saveBlob(blob, name)).catch(() => nativeClick.call(a));
    };
    const origRevoke = URL.revokeObjectURL;
    URL.revokeObjectURL = (url) => { setTimeout(() => origRevoke.call(URL, url), 60000); };
    HTMLAnchorElement.prototype.click = function click() {
      if (isFileLink(this)) { handle(this); return; }
      nativeClick.call(this);
    };
    const onClick = (e) => {
      const a = e.target instanceof Element ? e.target.closest('a') : null;
      if (!isFileLink(a) || e.defaultPrevented) return;
      e.preventDefault();
      handle(a);
    };
    document.addEventListener('click', onClick, true);
    return () => {
      document.removeEventListener('click', onClick, true);
      HTMLAnchorElement.prototype.click = nativeClick;
      URL.revokeObjectURL = origRevoke;
    };
  }, []);
  return null;
}
