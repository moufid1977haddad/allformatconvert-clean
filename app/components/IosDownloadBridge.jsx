'use client';
import { useEffect } from 'react';
import { isIosDevice, purgeLegacyStaged, saveBlob, nativeClick } from '../lib/download';

// iPhone / iPad: any "Download" of the site that is still a blob: or data: link under its real type (a FileDownload
// row whose file is not read yet, or a link a tool clicks from code) is caught, on iOS only, and saved the site's way
// (app/lib/download.js): the same bytes retyped application/octet-stream behind a download link — Safari then saves
// the file to Downloads instead of opening a PDF or a video in its viewer, or saving nothing from a data: link. Links
// already retyped (data-ocv-retyped) are left alone. Blob URLs are revoked a minute late on iOS, since tools revoke
// them right after the click and the file is read after that.
export default function IosDownloadBridge() {
  useEffect(() => {
    if (!(isIosDevice() || window.__forceAttachmentDownload === true)) return undefined;
    purgeLegacyStaged();
    const isFileLink = (a) => a && a.hasAttribute('download') && !a.hasAttribute('data-ocv-retyped') && /^(blob|data):/i.test(a.href);
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
