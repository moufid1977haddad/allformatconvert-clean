// Subtitle Generator (audit 2, 29/09): app/lib/subtitleTime.js. The old page appended ",000" to whatever was typed.
// Oracle: the SRT timing grammar (HH:MM:SS,mmm --> HH:MM:SS,mmm) and WebVTT's (HH:MM:SS.mmm).
// Run: node scripts/converter-tests/14-subtitles.mjs
import assert from 'node:assert/strict';
const { parseTime, formatTime, buildSubtitles } = await import(new URL('../../app/lib/subtitleTime.js', import.meta.url));
const old = (rows) => rows.map((s, i) => i + 1 + '\n' + s.start + ',000 --> ' + s.end + ',000\n' + s.text + '\n').join('\n');
const SRT_TIME = /^\d{2}:\d{2}:\d{2},\d{3} --> \d{2}:\d{2}:\d{2},\d{3}$/;
let passed = 0; const tests = [];
const test = (n, f) => tests.push([n, f]);
test('the OLD page wrote invalid timings for "00:00:05.500" and "1:05" (the defect is real)', () => {
  const lines = old([{ start: '00:00:05.500', end: '1:05', text: 'Hi' }]).split('\n');
  assert.equal(SRT_TIME.test(lines[1]), false);
});
test('times are read in the usual forms', () => {
  assert.equal(parseTime('00:00:05'), 5000);
  assert.equal(parseTime('00:00:05.5'), 5500);
  assert.equal(parseTime('00:00:05,250'), 5250);
  assert.equal(parseTime('1:05'), 65000);
  assert.equal(parseTime('1:02:03.004'), 3723004);
  assert.equal(parseTime('7'), 7000);
  for (const bad of ['', 'abc', '00:61', '1:2:3:4', '00:00:5.1234']) assert.equal(parseTime(bad), null, bad);
});
test('SRT and WebVTT output: valid timings, sorted by start, empty rows skipped', () => {
  const r = buildSubtitles([{ start: '1:05', end: '1:07.25', text: 'Second' }, { start: '0:01', end: '0:02,5', text: 'First' }, { start: '', end: '', text: '  ' }]);
  assert.equal(r.srt, '1\n00:00:01,000 --> 00:00:02,500\nFirst\n\n2\n00:01:05,000 --> 00:01:07,250\nSecond\n');
  assert.equal(r.vtt, 'WEBVTT\n\n00:00:01.000 --> 00:00:02.500\nFirst\n\n00:01:05.000 --> 00:01:07.250\nSecond\n');
  assert.equal(formatTime(3723004), '01:02:03,004');
});
test('wrong input is refused with the row number', () => {
  assert.match(buildSubtitles([{ start: '0:05', end: '0:04', text: 'x' }]).error, /Subtitle 1: it ends/);
  assert.match(buildSubtitles([{ start: '5 sec', end: '0:04', text: 'x' }]).error, /"5 sec" is not a time/);
  assert.match(buildSubtitles([{ start: '0:01', end: '0:02', text: '' }]).error, /at least one/);
});
for (const [n, f] of tests) { try { await f(); passed++; console.log('ok  ', n); } catch (e) { console.log('FAIL', n, '\n     ', e.message.split('\n')[0]); } }
console.log(`\n${passed}/${tests.length} passed`);
process.exit(passed === tests.length ? 0 : 1);
