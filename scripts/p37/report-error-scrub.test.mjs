// P37 lot 1, item 1: what app/lib/reportError.js's sanitizer lets through to /api/report-error.
// Run: node --import ./scripts/p37/misc-ext-loader.mjs scripts/p37/report-error-scrub.test.mjs
// Messages are the real texts the browser builds (V8's JSON.parse and RegExp errors, captured with Node 24).
import { sanitizeErrorMessage as s } from '../../app/lib/reportError.js';

const JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
const cases = [
  // secrets and tokens
  ['V8 JSON excerpt of a pasted header', 'Unexpected token \'B\', ..."ization": Bearer sk_"... is not valid JSON', 'Unexpected token \'[text]\', "[text]" is not valid JSON'],
  ['V8 JSON excerpt of an API key', 'Unexpected token \'s\', ...""apiKey": sk-proj-Ab"... is not valid JSON', 'Unexpected token \'[text]\', "[text]" is not valid JSON'],
  ['bare JWT', `Token rejected: ${JWT}`, 'Token rejected: [secret]'],
  ['Authorization header', 'Request failed with header Authorization: Bearer abc123.def456-ghi', 'Request failed with header Authorization: [secret]'],
  ['Bearer token in brackets', '401 Unauthorized (Bearer 9f8e7d6c5b4a)', '401 Unauthorized (Bearer [secret])'],
  ['OpenAI-style key', 'Invalid API key: sk-proj-AbCdEf1234567890XyZ', 'Invalid API key: [secret]'],
  ['Stripe-style key', 'Stripe error for sk_live_51HxYzAbCdEfGh', 'Stripe error for [secret]'],
  ['GitHub token', 'GitHub token ghp_1234567890abcdefghijABCDEFGHIJklmnop expired', 'GitHub token [secret] expired'],
  ['AWS access key id', 'AWS key AKIAIOSFODNN7EXAMPLE denied', 'AWS key [secret] denied'],
  ['long hex string', 'Checksum mismatch: 9e107d9d372bb6826bd81d3542a419d6', 'Checksum mismatch: [secret]'],
  ['long base64 string', 'Bad input dGhpcyBpcyBhIHNlY3JldCBwYXNzd29yZA== in field', 'Bad input [secret] in field'],
  ['UUID', 'Session 123e4567-e89b-12d3-a456-426614174000 not found', 'Session [secret] not found'],
  ['password in a query', 'Login failed: password=hunter2', 'Login failed: password=[secret]'],
  ['password in JSON', 'Bad body {"password":"hunter2"}', 'Bad body {"password":"[secret]"}'],
  ['token in a query string', 'Bad parameter ?token=abc123XYZ&lang=en', 'Bad parameter ?token=[secret]&lang=en'],
  // URLs and e-mail addresses
  ['URL without scheme, with a token', 'Could not load www.example.com/api?access_token=abc123', 'Could not load [url]'],
  ['URL with scheme and token', 'Could not load https://intranet.example.com/a/b?token=abc', 'Could not load [url]'],
  ['e-mail with plus and capitals', 'Invite failed for John.Doe+test@Example.CO.UK.', 'Invite failed for [email].'],
  ['URL-encoded e-mail', 'Bad recipient mailto%3Ajane%40example.org', 'Bad recipient [email]'],
  // regular expressions typed in Regex Tester: the whole pattern goes, not a fragment of it
  ['regex with named groups', 'Invalid regular expression: /(?<n>x)(?<n>y)/g: Duplicate capture group name', 'Invalid regular expression: /[pattern]/g: Duplicate capture group name'],
  ['regex with a double quote', 'Invalid regular expression: /a"b(/g: Unterminated group', 'Invalid regular expression: /[pattern]/g: Unterminated group'],
  ['regex with slashes', 'Invalid regular expression: /secret/path/(x/g: Unterminated group', 'Invalid regular expression: /[pattern]/g: Unterminated group'],
  ['regex with angle brackets', 'Invalid regular expression: /<tag>(/g: Unterminated group', 'Invalid regular expression: /[pattern]/g: Unterminated group'],
  ['regex, lower-case reason', 'Invalid regular expression: /x{2,1}/g: numbers out of order in {} quantifier', 'Invalid regular expression: /[pattern]/g: numbers out of order in {} quantifier'],
  // Barcode Generator's batch message, values now quoted by the page (P37 item 5)
  ['barcode batch values', 'No code could be made: line 1: “12AB” — EAN-13 must contain only digits · line 2: “my sku” — EAN-13 must be 12 or 13 digits', 'No code could be made: line 1: “[text]” — EAN-13 must contain only digits · line 2: “[text]” — EAN-13 must be 12 or 13 digits'],
  // debugging information that must survive
  ['plain message', 'Unexpected token in stream', 'Unexpected token in stream'],
  ['Safari regex message', 'Invalid regular expression: missing )', 'Invalid regular expression: missing )'],
  ['error code', 'net::ERR_INSUFFICIENT_RESOURCES', 'net::ERR_INSUFFICIENT_RESOURCES'],
  ['short hex code', 'Decoder failed with code 0x80004005', 'Decoder failed with code 0x80004005'],
  ['long API name', 'AudioWorkletProcessor construction failed', 'AudioWorkletProcessor construction failed'],
  ['the word token', 'The access token expired, sign in again', 'The access token expired, sign in again'],
  ['the word Bearer', 'Missing Bearer prefix', 'Missing Bearer prefix'],
  ['JSON position', 'Expected double-quoted property name in JSON at position 149 (line 1 column 150)', 'Expected double-quoted property name in JSON at position 149 (line 1 column 150)'],
  ['undefined is not JSON', '"undefined" is not valid JSON', '"undefined" is not valid JSON'],
  ['existing: unix path', 'ENOENT: no such file or directory, open /tmp/abc123/input.mp3', 'ENOENT: no such file or directory, open [path]'],
];

let fail = 0;
for (const [name, input, want] of cases) {
  const got = s(input, null);
  const ok = got === want;
  if (!ok) fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `\n      got:  ${got}\n      want: ${want}`}`);
}
const t0 = Date.now();
s(('a1'.repeat(1000)) + ' ' + 'eyJ'.repeat(300) + '/'.repeat(500), null);
const slow = Date.now() - t0 > 500;
if (slow) fail++;
console.log(`${slow ? 'FAIL' : 'PASS'}  no slow regex on 2000 hostile characters (${Date.now() - t0} ms)`);
console.log(`\n${cases.length + 1 - fail}/${cases.length + 1} passed`);
process.exit(fail ? 1 : 0);
