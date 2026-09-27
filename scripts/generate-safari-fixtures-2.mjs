// Fixtures added on 27/09/2026 to claude/tests-safari-proprietaire.md (tools created or changed since 19/09).
// - archives: copied from the ZIP Extractor's test set (scripts/browser-tests/archive-fixtures.mjs <dir>, run first):
//   RAR made by WinRAR (node-unrar.js test suite), RAR with encrypted headers (password 1234), 7z with encrypted data
//   (password data-only), a RAR split in 3 volumes, a ZIP made by Windows' tar.exe;
// - audio: three pure tones (A 440 Hz 5 s FLAC, B 1000 Hz 3 s MP3, C 2500 Hz 4 s WAV) made by a native ffmpeg, so the
//   order and the crossfade of Audio Merger can be heard, and a 12 s WAV for the Audio Trimmer;
// - a small 800x600 JPEG (ffmpeg test pattern) for the AI Image Upscaler.
// Usage: node scripts/generate-safari-fixtures-2.mjs <archive-fixtures dir> <ffmpeg>
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const [arch, FF] = process.argv.slice(2);
const OUT = path.resolve('docs/audit/fixtures-safari');
for (const [from, to] of [['FolderTest.rar', 'safari-winrar.rar'], ['HeaderEnc1234.rar', 'safari-rar-password-1234.rar'],
  ['aes-data-only.7z', 'safari-7z-password-data-only.7z'], ['r5.part1.rar', 'safari-split.part1.rar'], ['r5.part2.rar', 'safari-split.part2.rar'],
  ['r5.part3.rar', 'safari-split.part3.rar'], ['tree.zip', 'safari-tree.zip']]) fs.copyFileSync(path.join(arch, from), path.join(OUT, to));
const tone = (hz, secs, name, extra) => execFileSync(FF, ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'lavfi', '-i', `sine=frequency=${hz}:sample_rate=44100:duration=${secs}`,
  '-af', 'volume=4', '-ac', '2', ...extra, path.join(OUT, name)]);
tone(440, 5, 'safari-tone-A-5s.flac', ['-sample_fmt', 's16']);
tone(1000, 3, 'safari-tone-B-3s.mp3', ['-b:a', '192k']);
tone(2500, 4, 'safari-tone-C-4s.wav', ['-c:a', 'pcm_s16le']);
tone(660, 12, 'safari-tone-12s.wav', ['-c:a', 'pcm_s16le']);
// A 0.48 Mpx picture for the AI upscaler (it refuses more than 1 Mpx, and says so).
execFileSync(FF, ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'testsrc2=size=800x600:rate=1', '-frames:v', '1', '-q:v', '3', path.join(OUT, 'safari-small-800x600.jpg')]);
for (const f of fs.readdirSync(OUT).filter((f) => /\.(rar|7z|zip|flac|mp3|wav)$/.test(f))) console.log(f, fs.statSync(path.join(OUT, f)).size);
