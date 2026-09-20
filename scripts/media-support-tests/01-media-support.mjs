// Tests for app/lib/mediaSupport.js -- the guards against the "silent lie" class
// found on real Safari 17.6 (docs/audit/RAPPORT-safari-defauts.md).
// Fakes reproduce the MEASURED Safari behaviours:
//   - toDataURL('image/webp') silently returns a PNG data URL
//   - an oversized canvas returns "data:,"
//   - MediaRecorder.isTypeSupported('video/webm') === false, mp4 === true
//   - HTMLMediaElement has no captureStream
// Run: node scripts/media-support-tests/01-media-support.mjs
import assert from 'node:assert/strict';

const PNG_URL = 'data:image/png;base64,' + 'A'.repeat(64);
const WEBP_URL = 'data:image/webp;base64,' + 'A'.repeat(64);
const JPEG_URL = 'data:image/jpeg;base64,' + 'A'.repeat(64);

let passed = 0;
const test = async (name, fn) => {
  try {
    await fn();
    passed++;
    console.log('  PASS', name);
  } catch (e) {
    console.error('  FAIL', name, '\n', e);
    process.exitCode = 1;
  }
};

// ---- fake browser globals -------------------------------------------------
const setBrowser = ({ mediaRecorderTypes = null, elementCapture = false, canvasWebp = true } = {}) => {
  globalThis.window = {};
  globalThis.document = {
    createElement: () => ({
      width: 0,
      height: 0,
      toDataURL: (type) => (type === 'image/webp' && !canvasWebp ? PNG_URL : type === 'image/webp' ? WEBP_URL : type === 'image/jpeg' ? JPEG_URL : PNG_URL),
    }),
  };
  if (mediaRecorderTypes) {
    globalThis.MediaRecorder = { isTypeSupported: (t) => mediaRecorderTypes.includes(t) };
  } else {
    delete globalThis.MediaRecorder;
  }
  globalThis.HTMLMediaElement = function () {};
  globalThis.HTMLMediaElement.prototype = elementCapture ? { captureStream() {} } : {};
};

const m = await import('../../app/lib/mediaSupport.js?fresh=' + Math.random());

console.log('checkedDataURL');
await test('returns a normal PNG data URL', () => {
  assert.equal(m.checkedDataURL({ toDataURL: () => PNG_URL }, 'image/png'), PNG_URL);
});
await test('REFUSES "data:," (Safari oversized canvas 32000x24000)', () => {
  assert.throws(() => m.checkedDataURL({ toDataURL: () => 'data:,' }, 'image/png'), m.OutputError);
});
await test('REFUSES a PNG returned when WebP was requested (Safari)', () => {
  assert.throws(() => m.checkedDataURL({ toDataURL: () => PNG_URL }, 'image/webp'), /cannot encode WEBP.*produced PNG/);
});
await test('accepts a real WebP when WebP was requested', () => {
  assert.equal(m.checkedDataURL({ toDataURL: () => WEBP_URL }, 'image/webp'), WEBP_URL);
});
await test('passes quality through for JPEG', () => {
  let seen;
  m.checkedDataURL({ toDataURL: (t, q) => ((seen = [t, q]), JPEG_URL) }, 'image/jpeg', 0.9);
  assert.deepEqual(seen, ['image/jpeg', 0.9]);
});

console.log('checkedBlob');
await test('REFUSES an empty blob', async () => {
  const c = { toBlob: (cb) => cb(new Blob([], { type: 'image/png' })) };
  await assert.rejects(m.checkedBlob(c, 'image/png'), m.OutputError);
});
await test('REFUSES a null blob (canvas too large)', async () => {
  await assert.rejects(m.checkedBlob({ toBlob: (cb) => cb(null) }, 'image/png'), m.OutputError);
});
await test('REFUSES a PNG blob when WebP was requested (OffscreenCanvas in Safari)', async () => {
  const c = { convertToBlob: async () => new Blob([new Uint8Array(10)], { type: 'image/png' }) };
  await assert.rejects(m.checkedBlob(c, 'image/webp', 0.8), /cannot encode WEBP/);
});
await test('accepts a real WebP blob', async () => {
  const c = { convertToBlob: async () => new Blob([new Uint8Array(10)], { type: 'image/webp' }) };
  const b = await m.checkedBlob(c, 'image/webp', 0.8);
  assert.equal(b.size, 10);
});

console.log('canvas size guard');
await test('rejects the measured Safari failure size 32000x24000', () => {
  assert.match(m.canvasSizeProblem(32000, 24000), /768 megapixels/);
});
await test('rejects > 32767 on one side', () => assert.ok(m.canvasSizeProblem(40000, 10)));
await test('accepts an ordinary 4000x3000 photo', () => assert.equal(m.canvasSizeProblem(4000, 3000), ''));
await test('accepts a 74 MP image (proven background-remover ceiling)', () => assert.equal(m.canvasSizeProblem(10000, 7400), ''));
await test('rejects 0 / NaN', () => {
  assert.ok(m.canvasSizeProblem(0, 100));
  assert.ok(m.canvasSizeProblem(NaN, 100));
});

console.log('extFromMime / naming after the real blob type');
await test('mp4 recording is named .mp4, not .webm', () => assert.equal(m.extFromMime('video/mp4;codecs=avc1'), 'mp4'));
await test('webm stays webm', () => assert.equal(m.extFromMime('video/webm;codecs=vp9,opus'), 'webm'));
await test('Safari audio/mp4 is .m4a', () => assert.equal(m.extFromMime('audio/mp4'), 'm4a'));
await test('unknown type falls back, never lies', () => assert.equal(m.extFromMime('application/x-foo', 'bin'), 'bin'));

console.log('finishRecording');
await test('voice-recorder case: Safari records MP4 -> blob typed audio/mp4, ext m4a (was labelled audio/webm)', () => {
  const { blob, ext } = m.finishRecording([new Blob([new Uint8Array(20)])], { mimeType: 'audio/mp4' }, 'audio/webm');
  assert.equal(blob.type, 'audio/mp4');
  assert.equal(ext, 'm4a');
});
await test('REFUSES an empty recording', () => {
  assert.throws(() => m.finishRecording([], { mimeType: 'video/webm' }, 'video/webm'), m.OutputError);
});
await test('falls back to the requested mime only when the recorder reports none', () => {
  const { ext } = m.finishRecording([new Blob([new Uint8Array(5)])], {}, 'video/webm;codecs=vp8');
  assert.equal(ext, 'webm');
});

console.log('Safari 17.6 capability matrix (measured)');
await test('Safari 17.6: no <video>.captureStream -> 3 video tools say so BEFORE running', () => {
  setBrowser({ mediaRecorderTypes: ['video/mp4', 'video/mp4;codecs=avc1.42E01E,mp4a.40.2'], elementCapture: false });
  const s = m.videoReRecordSupport({ fromMediaElement: true });
  assert.equal(s.ok, false);
  assert.match(s.reason, /Safari/);
});
await test('Safari 17.6: canvas-based tools pick MP4 instead of throwing on video/webm', () => {
  setBrowser({ mediaRecorderTypes: ['video/mp4', 'video/mp4;codecs=avc1.42E01E,mp4a.40.2'] });
  const s = m.videoReRecordSupport();
  assert.equal(s.ok, true);
  assert.equal(s.ext, 'mp4');
});
await test('Chrome: WebM is picked, element capture available', () => {
  setBrowser({ mediaRecorderTypes: ['video/webm;codecs=vp9,opus', 'video/webm', 'video/mp4'], elementCapture: true });
  const s = m.videoReRecordSupport({ fromMediaElement: true });
  assert.equal(s.ok, true);
  assert.equal(s.ext, 'webm');
});
await test('no MediaRecorder at all -> explicit refusal, no crash', () => {
  setBrowser({ mediaRecorderTypes: null });
  assert.equal(m.videoReRecordSupport().ok, false);
});
await test('Safari: canEncodeImageType(webp) is false; PNG always true', () => {
  setBrowser({ canvasWebp: false });
  assert.equal(m.canEncodeImageType('image/webp'), false);
  assert.equal(m.canEncodeImageType('image/png'), true);
});
await test('Chrome: canEncodeImageType(webp) is true', () => {
  const m2 = null; // fresh cache needed: probe cached above, so re-import
  return import('../../app/lib/mediaSupport.js?fresh=' + Math.random()).then((mod) => {
    setBrowser({ canvasWebp: true });
    assert.equal(mod.canEncodeImageType('image/webp'), true);
  });
});


console.log('video frame / GIF guards');
await test('assertVideoReadable refuses a 0x0 video (undecoded codec)', () => {
  assert.throws(() => m.assertVideoReadable({ videoWidth: 0, videoHeight: 0 }), m.OutputError);
  assert.doesNotThrow(() => m.assertVideoReadable({ videoWidth: 640, videoHeight: 360 }));
});
await test('assertFrameNotBlank refuses a fully transparent frame, accepts a single painted pixel', () => {
  const blank = new Uint8ClampedArray(4 * 1000);
  assert.throws(() => m.assertFrameNotBlank(blank), m.OutputError);
  const one = new Uint8ClampedArray(4 * 1000); one[4 * 777 + 3] = 255;
  assert.doesNotThrow(() => m.assertFrameNotBlank(one));
});
await test('gifBlobFromBytes accepts GIF89a, refuses empty / non-GIF bytes', () => {
  const ok = new Uint8Array(40); ok.set([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
  assert.equal(m.gifBlobFromBytes(ok).type, 'image/gif');
  assert.throws(() => m.gifBlobFromBytes(new Uint8Array(0)), m.OutputError);
  assert.throws(() => m.gifBlobFromBytes(new Uint8Array(40)), m.OutputError);
});

console.log('accept lists (coverage rule)');
await test('VIDEO_ACCEPT lets iPhone .mov through, plus the wildcard', () => {
  assert.ok(m.VIDEO_ACCEPT.split(',').includes('.mov'));
  assert.ok(m.VIDEO_ACCEPT.split(',').includes('video/*'));
  assert.ok(m.VIDEO_ACCEPT.split(',').includes('.mp4'));
});

console.log(`\n${passed} passed${process.exitCode ? ', WITH FAILURES' : ''}`);
