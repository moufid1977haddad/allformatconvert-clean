// P37 lot 1, bug 1: Video Converter sent a "Resolution" limit together with a speed or a mirror; our video service
// refuses that pair ("Choose either a size or a maximum height.") only after the whole upload.
// The service's rule is read from services/media-processing/app/ffmpeg_ops.py and replayed here; the page must refuse
// every such request before the upload (MediaServiceTool `problem` -> "Convert" disabled, run() returns).
// Run: node scripts/p37/video-converter.test.mjs  |  SRC_REV=HEAD node scripts/p37/video-converter.test.mjs
import { load, source, check, done } from './lot1-load.mjs';

const py = source('services/media-processing/app/ffmpeg_ops.py');
check('service rule still present (filters and max_h -> refused)', /if filters and max_h:\s*\n\s*raise ValueError\("Choose either a size or a maximum height\."\)/.test(py));
// filters = the -vf chain of edit_options(): mirror (flip) and speed (setpts); volume/fades/crf are not in it
const serviceRefuses = (req) => !!req.maxHeight && (req.flip != null || (req.speed != null && req.speed !== 1));

const base = { target: 'mp4', quality: 'medium', maxHeight: '', flip: '', speed: '1', volume: '100', fadeIn: '0', fadeOut: '0', fadeVideo: false, crf: '' };
const CASES = [
  ['720p + 2x speed (MP4)', { maxHeight: '720', speed: '2' }],
  ['1080p + mirror (MOV)', { target: 'mov', maxHeight: '1080', flip: 'h' }],
  ['480p + speed + mirror (H.265)', { target: 'h265', maxHeight: '480', speed: '0.5', flip: 'hv' }],
  ['720p + fades + volume (MP4)', { maxHeight: '720', fadeIn: '2', fadeOut: '2', fadeVideo: true, volume: '150' }],
  ['720p + exact CRF (AV1)', { target: 'av1', maxHeight: '720', crf: '30' }],
  ['720p alone (MKV)', { target: 'mkv', maxHeight: '720' }],
  ['720p + speed left set, then MKV chosen (no edits sent)', { target: 'mkv', maxHeight: '720', speed: '2' }],
  ['MP3 + resolution + speed left set (audio: no height, no edits)', { target: 'mp3', maxHeight: '720', speed: '2' }],
  ['2x speed alone (MP4)', { speed: '2' }],
];

// The request itself is built by the same code at HEAD and now (moved, unchanged, into convertParams.js); the check
// before the upload (editConflict) exists only since P37.
const { buildConvertParams } = await import('../../app/tools/video-tools/video-converter/convertParams.js');
let editConflict = () => null;
try { ({ editConflict } = await load('app/tools/video-tools/video-converter/convertParams.js')); } catch { /* not there before P37 */ }
const msTool = source('app/components/MediaServiceTool.jsx');
const page = source('app/tools/video-tools/video-converter/page.jsx');
const gated = /if \(!file \|\| busy \|\| blocked\) return;/.test(msTool) && /disabled=\{!file \|\| !!blocked\}/.test(msTool) && /problem=\{editConflict\}/.test(page);
check('page refuses before upload (problem prop wired, run() and button gated)', gated);

for (const [label, over] of CASES) {
  const p = { ...base, ...over };
  const req = buildConvertParams(p);
  const refused = serviceRefuses(req);
  const said = gated ? editConflict(p) : null;
  check(`${label}: service ${refused ? 'refuses' : 'accepts'} -> page ${said ? 'blocks before upload' : 'lets it go'}`, refused === !!said, said || JSON.stringify(req));
}
done('video-converter');
