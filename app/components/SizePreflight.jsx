'use client';
import { useEffect, useState } from 'react';
import { decodedSizeProblems } from '../lib/pdfImages';

// P31 (03/10): images over the PDF tools' size bound (phone: 90 MP, computer: 268 MP) are named as soon as they are
// chosen, before the Convert button — read from each file's header, nothing decoded (as Image Compressor does).
export default function SizePreflight({ files }) {
  const [problems, setProblems] = useState([]);
  useEffect(() => {
    let alive = true;
    setProblems([]);
    if (files && files.length) decodedSizeProblems(files).then((p) => { if (alive) setProblems(p); }).catch(() => {});
    return () => { alive = false; };
  }, [files]);
  if (!problems.length) return null;
  return (
    <div role="alert" data-size-preflight className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 space-y-1">
      {problems.map((m) => <p key={m} className="break-words">{m}</p>)}
    </div>
  );
}
