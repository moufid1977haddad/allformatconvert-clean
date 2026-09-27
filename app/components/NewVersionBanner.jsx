'use client';
import { useEffect, useState } from 'react';
import { isChunkLoadError, reloadOnceForNewVersion } from '../lib/chunkError';

// Page-wide: when a code file of the old version can no longer be loaded (see
// app/lib/chunkError.js), reload once automatically; if that already happened,
// show a banner instead of letting a tool fail with a technical message.
export default function NewVersionBanner() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onChunk = () => { if (!reloadOnceForNewVersion()) setShow(true); };
    const onError = (e) => { if (isChunkLoadError(e.error || e.message)) onChunk(); };
    const onRejection = (e) => { if (isChunkLoadError(e.reason)) { e.preventDefault(); onChunk(); } };
    window.addEventListener('oct:new-version', onChunk);
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('oct:new-version', onChunk);
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);
  if (!show) return null;
  return (
    <div role="alert" className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[1000] max-w-md w-[calc(100%-2rem)] bg-neutral-900 text-white rounded-xl shadow-lg px-4 py-3 flex items-center gap-3 text-sm" data-new-version>
      <span className="flex-1">This site was just updated. Reload the page to continue.</span>
      <button type="button" onClick={() => window.location.reload()} className="bg-white text-neutral-900 rounded-lg px-3 py-1.5 font-semibold">Reload</button>
    </div>
  );
}
