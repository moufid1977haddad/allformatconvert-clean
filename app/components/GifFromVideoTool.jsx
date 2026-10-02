'use client';
import MediaServiceTool from './MediaServiceTool';

// Video -> animated GIF on the media-processing service (ffmpeg palettegen/paletteuse, Lanczos scaling,
// proportions always kept). Options modelled on the reference site (ezgif): start, length, width, frame rate.
// The service validates every value again (services/media-processing/app/ffmpeg_ops.py, gif_options).
// P24 (03/10): 160 and 360 px too — our service already accepts them (services/media-processing GIF_WIDTHS)
const WIDTHS = [160, 240, 320, 360, 400, 480, 540, 600, 640, 720, 800, 960, 1080];
const FPS = [5, 8, 10, 12, 15, 20, 25, 30];
export const GIF_MAX_SECONDS = 60;

export default function GifFromVideoTool({ title, subtitle, seo, tool, extra }) {
  return (
    <MediaServiceTool
      op="convert"
      tool={tool}
      title={title}
      subtitle={subtitle}
      buttonLabel="Make GIF"
      initialParams={{ start: '0', length: '5', width: '480', fps: '10' }}
      buildParams={(p, { duration } = {}) => {
        // P24 review (03/10): times are checked, never changed silently — 90 s became 60 s, 0.1 s became 0.2 s, and a
        // part running past the end of the video gave a shorter GIF without a word
        const start = Number(p.start), length = Number(p.length);
        if (!Number.isFinite(start) || start < 0) throw new Error('Start must be a number of seconds, 0 or more.');
        if (!Number.isFinite(length) || length < 0.2) throw new Error('Length must be at least 0.2 seconds.');
        if (length > GIF_MAX_SECONDS) throw new Error(`A GIF here lasts at most ${GIF_MAX_SECONDS} seconds; choose a shorter length (or several GIFs).`);
        let len = length, _note = '';
        if (Number.isFinite(duration)) {
          if (start >= duration) throw new Error(`This video lasts ${duration.toFixed(1)} s: the start (${start} s) is after its end.`);
          if (start + length > duration + 0.05) { len = Math.max(0.2, Math.floor((duration - start) * 10) / 10); _note = `The video ends ${len} s after the start: the GIF lasts ${len} s, not ${length} s.`; }
        }
        return { target: 'gif', gifStart: start, gifDuration: len, gifWidth: Number(p.width), gifFps: Number(p.fps), _note };
      }}
      outName={(name) => name.replace(/\.[^.]+$/, '') + '.gif'}
      controls={({ params, setParams, disabled }) => {
        const field = 'w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-sm';
        const set = (k) => (e) => setParams({ ...params, [k]: e.target.value });
        return (
          <div className="space-y-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <label className="text-sm text-neutral-600">Start (seconds)
                <input type="number" min="0" step="0.1" value={params.start} onChange={set('start')} disabled={disabled} className={field} />
              </label>
              <label className="text-sm text-neutral-600">Length (seconds)
                <input type="number" min="0.2" max={GIF_MAX_SECONDS} step="0.1" value={params.length} onChange={set('length')} disabled={disabled} className={field} />
              </label>
              <label className="text-sm text-neutral-600">Width
                <select value={params.width} onChange={set('width')} disabled={disabled} className={field}>
                  {WIDTHS.map((w) => <option key={w} value={w}>{w} px</option>)}
                </select>
              </label>
              <label className="text-sm text-neutral-600">Frames per second
                <select value={params.fps} onChange={set('fps')} disabled={disabled} className={field}>
                  {FPS.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </label>
            </div>
            <p className="text-xs text-neutral-500">Up to {GIF_MAX_SECONDS} seconds. The height follows the video, so vertical and square videos keep their shape; a video narrower than the chosen width is never enlarged. Smaller width and fewer frames per second make a lighter GIF.</p>
          </div>
        );
      }}
      seo={seo}
      extra={extra}
    />
  );
}
