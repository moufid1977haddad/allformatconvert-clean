'use client';
import { useEffect, useState } from 'react';
import { decodedSizeProblems, PHONE_MAX_MP } from '../lib/pdfImages';

// P31 (03/10): images over the PDF tools' size bound (phone: 48 MP since P33, computer: 268 MP) are named as soon as
// they are chosen, before the Convert button — read from each file's header, nothing decoded (as Image Compressor does).
// P33 (05/10): on a phone, the same amber message and the same one-gesture button as Image Compressor: "Reduce to 48 MP
// then convert to PDF" (onReduce: the page converts with the pictures over the bound reduced first).
export default function SizePreflight({ files, onReduce, busy = false }) {
  const [problems, setProblems] = useState([]);
  useEffect(() => {
    let alive = true;
    setProblems([]);
    if (files && files.length) decodedSizeProblems(files).then((p) => { if (alive) setProblems(p); }).catch(() => {});
    return () => { alive = false; };
  }, [files]);
  if (!problems.length) return null;
  return (
    <div role="alert" data-size-preflight className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 space-y-2">
      {problems.map((p) => <p key={p.message} className="break-words">{p.message}</p>)}
      {onReduce && problems.some((p) => p.reducible) && (
        <button type="button" onClick={onReduce} disabled={busy} data-reduce-then-convert className="w-full min-h-[44px] rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-60 text-white font-semibold px-4 py-2">
          Reduce to {PHONE_MAX_MP} MP then convert to PDF
        </button>
      )}
    </div>
  );
}
