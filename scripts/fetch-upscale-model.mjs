// Build step: the AI Image Upscaler's model for the IN-BROWSER path (WebGPU), served by the site at
// /models/4xNomos2_hq_mosr-web.onnx. Downloaded from the author's official release, checked by SHA-256 (the
// same file the Railway service uses, services/background-removal/Dockerfile), then patched in one place:
// the export names the OUTPUT dimensions "width"/"height" like the input although the output is 4x larger.
// CPU runtimes ignore that; ONNX Runtime's WebGPU provider trusts it and fails ("Shape mismatch attempting
// to re-use buffer", measured 28/09). Only those two names change (same byte length; weights untouched).
// Model: 4xNomos2_hq_mosr by Philip Hofmann, CC BY 4.0 (credited on the tool page); MoSR architecture, MIT.
// No silent fallback: any mismatch fails the build.
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const URL_ = 'https://github.com/Phhofm/models/releases/download/4xNomos2_hq_mosr/4xNomos2_hq_mosr_fp32.onnx';
const SHA_ORIGINAL = 'f31fde6bd0e3475759aa5677d37b43b4e660d75e3629cd096bbc590feb746808';
const OUT = path.resolve('public/models/4xNomos2_hq_mosr-web.onnx');

const sha = (b) => createHash('sha256').update(b).digest('hex');
if (fs.existsSync(OUT) && fs.existsSync(OUT + '.sha256') && fs.readFileSync(OUT + '.sha256', 'utf8').trim() === sha(fs.readFileSync(OUT))) {
  console.log('upscale model: present and verified');
  process.exit(0);
}
const res = await fetch(URL_);
if (!res.ok) throw new Error(`upscale model download failed: HTTP ${res.status}`);
const b = Buffer.from(await res.arrayBuffer());
if (sha(b) !== SHA_ORIGINAL) throw new Error('upscale model: SHA-256 mismatch, refusing to ship it');
const out = b.lastIndexOf(Buffer.from('output'));
const w = b.indexOf(Buffer.from('width'), out);
const h = b.indexOf(Buffer.from('height'), out);
if (out < 0 || w < 0 || h < 0 || w - out > 60 || h - out > 60 || b.indexOf(Buffer.from('width'), w + 1) !== -1 || b.indexOf(Buffer.from('height'), h + 1) !== -1) {
  throw new Error('upscale model: output declaration not where expected, refusing to patch');
}
Buffer.from('out_w').copy(b, w);
Buffer.from('out_h4').copy(b, h);
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, b);
fs.writeFileSync(OUT + '.sha256', sha(b) + '\n');
console.log(`upscale model: downloaded, verified, output dims renamed -> ${path.relative(process.cwd(), OUT)} (${b.length} bytes)`);
