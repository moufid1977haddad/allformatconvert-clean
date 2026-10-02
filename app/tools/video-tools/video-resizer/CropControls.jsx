'use client';
// P25 (03/10, E5): free crop, as 123apps' "Crop video" and Kapwing offer it — a box over the picture, moved and resized
// with the mouse or a finger, aspect presets, and exact numbers. The crop is made on our ffmpeg service in the picture
// as it is SHOWN (a phone video's rotation applied), the same coordinates this preview uses.
import { useEffect, useRef, useState } from 'react';

const RATIOS = [['free', 'Free'], ['1:1', '1:1'], ['16:9', '16:9'], ['9:16', '9:16'], ['4:5', '4:5'], ['4:3', '4:3']];
const evenDown = (n) => Math.max(0, 2 * Math.floor(n / 2));

export function clampCrop(c, src, ratio) {
  if (!src) return c;
  let w = Math.min(Math.max(16, c.w), src.w), h = Math.min(Math.max(16, c.h), src.h);
  if (ratio !== 'free') {
    const [a, b] = ratio.split(':').map(Number);
    if (w / h > a / b) w = h * a / b; else h = w * b / a;
  }
  w = Math.max(16, evenDown(w)); h = Math.max(16, evenDown(h));
  const x = evenDown(Math.min(Math.max(0, c.x), src.w - w));
  const y = evenDown(Math.min(Math.max(0, c.y), src.h - h));
  return { x, y, w, h };
}

export default function CropControls({ file, src, crop, ratio, onChange, disabled }) {
  const [url, setUrl] = useState(null);
  const boxRef = useRef(null);
  const drag = useRef(null);
  useEffect(() => {
    if (!file) return undefined;
    const u = URL.createObjectURL(file); setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  if (!src) return <p className="text-sm text-neutral-500">Reading the video&apos;s size… (if this stays, this browser cannot show this format: type the crop in pixels below)</p>;

  const set = (next, r = ratio) => onChange(clampCrop(next, src, r), r);
  const pct = (v, total) => `${(v / total) * 100}%`;
  const toSrc = (dx, dy) => {
    const r = boxRef.current.getBoundingClientRect();
    return [dx * src.w / r.width, dy * src.h / r.height];
  };
  const start = (kind) => (e) => {
    if (disabled) return;
    e.preventDefault(); e.stopPropagation();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    drag.current = { kind, x: e.clientX, y: e.clientY, crop };
  };
  const move = (e) => {
    const d = drag.current; if (!d) return;
    const [dx, dy] = toSrc(e.clientX - d.x, e.clientY - d.y);
    if (d.kind === 'move') set({ ...d.crop, x: d.crop.x + dx, y: d.crop.y + dy });
    else set({ ...d.crop, w: d.crop.w + dx, h: ratio === 'free' ? d.crop.h + dy : d.crop.h + dx * (d.crop.h / d.crop.w) });
  };
  const end = () => { drag.current = null; };
  const field = (k, label) => (
    <label className="block text-xs text-neutral-500">{label}
      <input type="number" min="0" step="2" disabled={disabled} value={crop[k]} data-crop={k}
        onChange={(e) => onChange({ ...crop, [k]: Number(e.target.value) || 0 }, ratio)} onBlur={() => set(crop)}
        className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2 text-neutral-900" />
    </label>
  );
  return (
    <div className="space-y-3">
      <div ref={boxRef} className="relative mx-auto select-none touch-none" style={{ aspectRatio: `${src.w} / ${src.h}`, maxHeight: '18rem', maxWidth: '100%' }}
        onPointerMove={move} onPointerUp={end} onPointerCancel={end}>
        {url && <video src={url} muted playsInline preload="metadata" className="absolute inset-0 w-full h-full object-fill rounded-lg bg-neutral-800" />}
        <div className="absolute inset-0 bg-black/50 rounded-lg pointer-events-none" style={{ clipPath: `polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 0, ${pct(crop.x, src.w)} ${pct(crop.y, src.h)}, ${pct(crop.x, src.w)} ${pct(crop.y + crop.h, src.h)}, ${pct(crop.x + crop.w, src.w)} ${pct(crop.y + crop.h, src.h)}, ${pct(crop.x + crop.w, src.w)} ${pct(crop.y, src.h)}, ${pct(crop.x, src.w)} ${pct(crop.y, src.h)})` }} />
        <div role="slider" aria-label="Cropped area (drag to move)" aria-valuetext={`${crop.w}×${crop.h} at ${crop.x}, ${crop.y}`} tabIndex={0} data-crop-box
          onPointerDown={start('move')} className="absolute border-2 border-white shadow cursor-move"
          style={{ left: pct(crop.x, src.w), top: pct(crop.y, src.h), width: pct(crop.w, src.w), height: pct(crop.h, src.h) }}>
          <div onPointerDown={start('resize')} data-crop-handle aria-hidden="true" className="absolute -right-2 -bottom-2 w-5 h-5 bg-white border-2 border-indigo-600 rounded-full cursor-nwse-resize" />
        </div>
      </div>
      <div className="flex flex-wrap gap-2 justify-center" role="radiogroup" aria-label="Crop shape">
        {RATIOS.map(([v, l]) => (
          <button key={v} type="button" role="radio" aria-checked={ratio === v} disabled={disabled} onClick={() => set(crop, v)}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${ratio === v ? 'bg-indigo-600 text-white' : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200'}`}>{l}</button>
        ))}
        <button type="button" disabled={disabled} onClick={() => set({ x: 0, y: 0, w: src.w, h: src.h }, 'free')} className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-neutral-100 text-neutral-800 hover:bg-neutral-200">Whole picture</button>
      </div>
      <div className="grid grid-cols-4 gap-2">{field('x', 'Left')}{field('y', 'Top')}{field('w', 'Width')}{field('h', 'Height')}</div>
      <p className="text-xs text-neutral-500 text-center">The kept area: {crop.w}×{crop.h} px of {src.w}×{src.h}. The result keeps that size (no scaling).</p>
    </div>
  );
}
