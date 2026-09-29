// Subtitle Generator (audit 2, 29/09). Before: ",000" was appended to whatever was typed, so "00:00:05.500" became
// "00:00:05.500,000" and "1:05" became "1:05,000" -- invalid SRT timings, written without a word; there was no way
// to give milliseconds, an end before its start or an empty line went through, and cues kept the typing order.
// Now a time is read as [[HH:]MM:]SS[.,mmm] (Subtitle Edit accepts the same), validated, written as HH:MM:SS,mmm
// (SRT) or HH:MM:SS.mmm (WebVTT), and cues are sorted by start time.

// "1:05.5" -> 65500 ms; null when not a time.
export function parseTime(s) {
  const m = String(s).trim().match(/^(?:(\d+):)?(?:(\d{1,2}):)?(\d{1,2})(?:[.,](\d{1,3}))?$/);
  if (!m) return null;
  let [, a, b, sec, frac] = m;
  let h = 0, min = 0;
  if (a !== undefined && b !== undefined) { h = +a; min = +b; } else if (a !== undefined) { min = +a; }
  if (+sec > 59 || ((a !== undefined && b !== undefined) && min > 59)) return null;
  const ms = frac ? Math.round(+(`0.${frac}`) * 1000) : 0;
  return ((h * 60 + min) * 60 + +sec) * 1000 + ms;
}

export function formatTime(ms, sep = ',') {
  const p = (n, w = 2) => String(n).padStart(w, '0');
  const h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, s = Math.floor(ms / 1000) % 60;
  return `${p(h)}:${p(m)}:${p(s)}${sep}${p(ms % 1000, 3)}`;
}

// rows: [{ start, end, text }] as typed. Returns { srt, vtt } or { error }.
export function buildSubtitles(rows) {
  const cues = [];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (!r.text.trim()) continue;
    const a = parseTime(r.start), b = parseTime(r.end);
    if (a === null) return { error: `Subtitle ${i + 1}: "${r.start}" is not a time (use HH:MM:SS, MM:SS or HH:MM:SS.mmm).` };
    if (b === null) return { error: `Subtitle ${i + 1}: "${r.end}" is not a time (use HH:MM:SS, MM:SS or HH:MM:SS.mmm).` };
    if (b <= a) return { error: `Subtitle ${i + 1}: it ends (${r.end}) before or when it starts (${r.start}).` };
    cues.push({ a, b, text: r.text.trim() });
  }
  if (!cues.length) return { error: 'Type the text of at least one subtitle.' };
  cues.sort((x, y) => x.a - y.a);
  const srt = cues.map((c, i) => `${i + 1}\n${formatTime(c.a)} --> ${formatTime(c.b)}\n${c.text}\n`).join('\n');
  const vtt = 'WEBVTT\n\n' + cues.map((c) => `${formatTime(c.a, '.')} --> ${formatTime(c.b, '.')}\n${c.text}\n`).join('\n');
  return { srt, vtt, count: cues.length };
}
