// Plain-Node checks for the pure (non-browser) helpers in
// app/lib/reportError.js -- run with `node scripts/error-reporting-tests/01-sanitize.js`.
const assert = require('node:assert');
const { sanitizeErrorMessage, sizeBucket, extOf, parseBrowserLabel } = require('../../app/lib/reportError.js');

// Real filename must never survive.
assert.strictEqual(
  sanitizeErrorMessage('Failed to decode C:\\Users\\alice\\Documents\\vacation-photo.tiff', 'vacation-photo.tiff'),
  'Failed to decode [path]'
);
assert.strictEqual(
  sanitizeErrorMessage("Could not read 'my-secret-report.pdf'", 'my-secret-report.pdf'),
  "Could not read '[file]'"
);
// Unix-style path swept even without knowing the real filename.
assert.strictEqual(
  sanitizeErrorMessage('ENOENT: no such file or directory, open /tmp/abc123/input.mp3', null),
  'ENOENT: no such file or directory, open [path]'
);
// Generic message with no path/filename passes through unchanged.
assert.strictEqual(sanitizeErrorMessage('Unexpected token in stream', null), 'Unexpected token in stream');
// Truncation.
assert.ok(sanitizeErrorMessage('x'.repeat(5000), null).length <= 300);
// Non-string input never throws.
assert.strictEqual(sanitizeErrorMessage(null, null), '');
assert.strictEqual(sanitizeErrorMessage(undefined, null), '');

assert.strictEqual(sizeBucket(500 * 1024), '0-1MB');
assert.strictEqual(sizeBucket(5 * 1024 * 1024), '1-10MB');
assert.strictEqual(sizeBucket(30 * 1024 * 1024), '10-50MB');
assert.strictEqual(sizeBucket(100 * 1024 * 1024), '50-200MB');
assert.strictEqual(sizeBucket(500 * 1024 * 1024), '200MB+');
assert.strictEqual(sizeBucket('not a number'), null);

assert.strictEqual(extOf('photo.TIFF'), 'tiff');
assert.strictEqual(extOf('no-extension'), 'unknown');
assert.strictEqual(extOf(null), null);

assert.strictEqual(parseBrowserLabel('Mozilla/5.0 ... Chrome/129.0.0.0 Safari/537.36'), 'Chrome 129');
assert.strictEqual(parseBrowserLabel('Mozilla/5.0 ... Firefox/131.0'), 'Firefox 131');
assert.strictEqual(parseBrowserLabel('Mozilla/5.0 ... Edg/129.0.0.0'), 'Edge 129');
assert.strictEqual(parseBrowserLabel('garbage'), 'unknown');

console.log('All app/lib/reportError.js sanitizer checks passed.');
