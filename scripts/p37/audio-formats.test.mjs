// P37 lot 1, bugs 6 and 7.
//  6. Audio Converter / Video to Audio: "Standard — 128 kbps" was written at 192 kbps for AC3 and MP2 (floor in
//     buildOutputSpec). Every offered bitrate must reach ffmpeg as chosen, and be a legal bitrate of the codec.
//  7. `.ac3` was missing from AUDIO_ACCEPT (the file picker of the 9 audio tools and Media Player), although these tools
//     decode AC3 with ffmpeg.wasm. Every "Input formats" entry of those pages must be in the picker's list.
// Run: node scripts/p37/audio-formats.test.mjs  |  SRC_REV=HEAD node scripts/p37/audio-formats.test.mjs
import { load, source, check, done } from './lot1-load.mjs';

const fmts = await load('app/lib/audioFormats.js');
const AC3_TABLE = [32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 384, 448, 512, 576, 640]; // ATSC A/52 frmsizecod
const MP2_MPEG1 = [32, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 384]; // ISO 11172-3 Layer II, 32/44.1/48 kHz
for (const value of ['ac3', 'mp2', 'mp3', 'aac', 'm4a', 'ogg', 'wma']) {
  for (const [kbps, label] of fmts.AUDIO_BITRATES) {
    const args = fmts.buildOutputSpec(value, kbps).extraArgs;
    const i = args.indexOf('-b:a');
    const written = i >= 0 ? parseInt(args[i + 1], 10) : null;
    const legal = value === 'ac3' ? AC3_TABLE.includes(kbps) : value === 'mp2' ? MP2_MPEG1.includes(kbps) : true;
    check(`${value.toUpperCase()} "${label}": -b:a ${kbps}k`, written === kbps && legal, `written ${written}k${legal ? '' : ', not a legal bitrate'}`);
  }
}

// --- picker list vs the formats each page announces
const ms = source('app/lib/mediaSupport.js');
const accept = (ms.match(/export const AUDIO_ACCEPT =\s*'([^']*)'/) || [])[1] || '';
const exts = new Set(accept.split(',').filter((t) => t.startsWith('.')).map((t) => t.slice(1).toUpperCase()));
check('AUDIO_ACCEPT lists .ac3', exts.has('AC3'), accept);
const PAGES = ['audio-booster', 'audio-compressor', 'audio-converter', 'audio-equalizer', 'audio-merger', 'audio-metadata', 'audio-splitter', 'audio-trimmer', 'audio-waveform']
  .map((t) => `app/tools/audio-tools/${t}/page.jsx`).concat('app/tools/video-tools/media-player/page.jsx');
for (const p of PAGES) {
  const m = source(p).match(/label: `Input formats`, value: `(?:Audio: )?([^`.]*)/);
  const listed = m ? m[1].split(/,\s*/).map((s) => s.trim().split(' ')[0].toUpperCase()).filter(Boolean) : [];
  const missing = listed.filter((x) => !exts.has(x));
  check(`${p.split('/').slice(-2, -1)[0]}: announced inputs all in the picker, AC3 announced`, listed.length > 5 && !missing.length && listed.includes('AC3'), missing.length ? `not in picker: ${missing.join(', ')}` : listed.join(','));
}
done('audio-formats');
