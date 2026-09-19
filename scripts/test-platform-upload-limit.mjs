// Run: node scripts/test-platform-upload-limit.mjs  (no network, no secrets)
import assert from 'node:assert/strict';
import limits from '../lib/quota/limits.js';

const { MAX_PLATFORM_UPLOAD_BYTES, MAX_PLATFORM_IMAGE_BASE64_SOURCE_BYTES, checkPlatformUploadSize } = limits;
const MB = 1024 * 1024;

// The declared ceiling must stay below the largest size measured to pass on
// production (4,412,819 bytes, 2026-09-19) and the base64 one must stay below it once x1.33.
assert.ok(MAX_PLATFORM_UPLOAD_BYTES < 4412819);
assert.ok(Math.ceil((MAX_PLATFORM_IMAGE_BASE64_SOURCE_BYTES * 4) / 3) < 4412819);

assert.equal(checkPlatformUploadSize(null).ok, true);
assert.equal(checkPlatformUploadSize({ size: MAX_PLATFORM_UPLOAD_BYTES }).ok, true);
const over = checkPlatformUploadSize({ size: 12.3 * MB });
assert.equal(over.ok, false);
assert.match(over.message, /12\.3 MB/);          // says the real size
assert.match(over.message, /up to 4 MB/);        // says the real limit
assert.match(over.message, /hosting platform/);  // says the real reason
assert.doesNotMatch(over.message, /Conversion failed/);
assert.equal(checkPlatformUploadSize({ size: 3.5 * MB }, MAX_PLATFORM_IMAGE_BASE64_SOURCE_BYTES).ok, false);
console.log('platform upload limit: all assertions passed');
