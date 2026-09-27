// Full technical report of an audio or video file, read by ffprobe (ffmpeg.wasm) in the browser -- nothing is
// uploaded. The file is MOUNTED (WORKERFS: read from disk in pieces, never copied into memory), so its size does not
// matter. Used by Audio Metadata and Video Metadata (28/09/2026: they showed only name, size, type, duration and
// size from the browser's player -- nothing at all for a format the player cannot read -- while the reference,
// metadata2go.com, shows codec, bitrate, tags… after uploading the file, up to 75 MB).
// Returns { json, cover } where json is ffprobe's -show_format -show_streams -show_chapters output and cover a Blob
// of the embedded cover picture (audio files), or null. Throws when ffprobe cannot read the file.
export async function probeMedia(file) {
  const { FFmpeg } = await import('@ffmpeg/ffmpeg');
  const ffmpeg = new FFmpeg();
  try {
    await ffmpeg.load();
    await ffmpeg.createDir('/in');
    await ffmpeg.mount('WORKERFS', { files: [file] }, '/in');
    const src = '/in/' + file.name;
    await ffmpeg.ffprobe(['-v', 'error', '-show_format', '-show_streams', '-show_chapters', '-of', 'json', src, '-o', '/probe.json']);
    let json;
    try { json = JSON.parse(new TextDecoder().decode(await ffmpeg.readFile('/probe.json'))); } catch { json = null; }
    if (!json || !json.format || !Array.isArray(json.streams) || !json.streams.length) throw new Error('this file has no audio or video stream that can be read');
    let cover = null;
    const pic = json.streams.find((s) => s.disposition && s.disposition.attached_pic);
    if (pic) {
      const ext = pic.codec_name === 'png' ? 'png' : 'jpg';
      await ffmpeg.exec(['-v', 'error', '-i', src, '-map', `0:${pic.index}`, '-c', 'copy', '-frames:v', '1', `/cover.${ext}`]).catch(() => {});
      try { const data = await ffmpeg.readFile(`/cover.${ext}`); if (data.length) cover = new Blob([data.buffer], { type: ext === 'png' ? 'image/png' : 'image/jpeg' }); } catch { cover = null; }
    }
    return { json, cover };
  } finally {
    ffmpeg.terminate();
  }
}

const num = (x) => (x === undefined || x === null || x === '' || x === 'N/A' ? null : Number(x));
const clock = (s) => { if (!Number.isFinite(s)) return null; const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60; return `${h ? h + ':' : ''}${h ? String(m).padStart(2, '0') : m}:${sec.toFixed(3).padStart(6, '0')}`; };
const rate = (r) => { if (!r || r === '0/0') return null; const [a, b] = String(r).split('/').map(Number); return b ? +(a / b).toFixed(3) : a; };
const bits = (b) => (Number.isFinite(b) ? (b >= 1e6 ? `${(b / 1e6).toFixed(2)} Mbit/s` : `${Math.round(b / 1000)} kbit/s`) : null);

// ffprobe's output as labelled sections for the page (and the same data for the JSON report).
export function describeProbe(json, file) {
  const f = json.format || {};
  const general = [
    ['File', file.name],
    ['Size', `${(file.size / 1048576).toFixed(2)} MB (${file.size.toLocaleString('en-US')} bytes)`],
    ['Container', f.format_long_name || f.format_name],
    ['Duration', clock(num(f.duration))],
    ['Overall bitrate', bits(num(f.bit_rate))],
    ['Streams', String(json.streams.length)],
  ];
  const tags = Object.entries(f.tags || {}).map(([k, v]) => [k, String(v)]);
  const streams = json.streams.map((s) => {
    const rows = [['Codec', [s.codec_long_name || s.codec_name, s.profile].filter(Boolean).join(' — ')]];
    if (s.codec_type === 'audio') {
      rows.push(['Sample rate', s.sample_rate ? `${Number(s.sample_rate).toLocaleString('en-US')} Hz` : null], ['Channels', [s.channels, s.channel_layout].filter(Boolean).join(' — ')],
        ['Bit depth', num(s.bits_per_raw_sample) || num(s.bits_per_sample) ? `${num(s.bits_per_raw_sample) || num(s.bits_per_sample)} bit` : null], ['Sample format', s.sample_fmt]);
    }
    if (s.codec_type === 'video') {
      const rotation = (s.side_data_list || []).find((d) => d.rotation !== undefined)?.rotation ?? s.tags?.rotate;
      rows.push(['Resolution', s.width && s.height ? `${s.width} × ${s.height}` : null], ['Display aspect', s.display_aspect_ratio && s.display_aspect_ratio !== '0:1' ? s.display_aspect_ratio : null],
        ['Frame rate', rate(s.avg_frame_rate) ? `${rate(s.avg_frame_rate)} fps` : null], ['Pixel format', s.pix_fmt], ['Color', [s.color_space, s.color_transfer, s.color_primaries].filter(Boolean).join(' / ') || null],
        ['Rotation', rotation !== undefined && rotation !== null && Number(rotation) !== 0 ? `${rotation}°` : null], ['Cover picture', s.disposition?.attached_pic ? 'yes' : null]);
    }
    rows.push(['Bitrate', bits(num(s.bit_rate))], ['Duration', clock(num(s.duration))], ['Language', s.tags?.language && s.tags.language !== 'und' ? s.tags.language : null], ['Title', s.tags?.title || null]);
    return { title: `Stream ${s.index} — ${s.codec_type || 'data'}`, rows: rows.filter(([, v]) => v !== null && v !== undefined && v !== '') };
  });
  const chapters = (json.chapters || []).map((c) => [clock(num(c.start_time)), c.tags?.title || '']);
  return { general: general.filter(([, v]) => v), tags, streams, chapters };
}
