// Generic functional-audit runner. Drives each tool page with a strategy
// picked by its category (file-upload / paste-text / form-generator /
// recorder / stub), and records a structured pass/fail verdict plus any
// console/page errors seen along the way. Designed to run against a subset
// of tools (pilot) or the full tool-config.json list.
//
// Usage: node scripts/audit/runners/run-audit.js [--slugs=a,b,c] [--base=http://localhost:3000]
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const FIXTURES_DIR = path.join(__dirname, '..', 'fixtures', 'files');
const CONFIG_PATH = path.join(__dirname, '..', 'tool-config.json');
const RESULTS_DIR = path.join(__dirname, '..', 'results');

const args = Object.fromEntries(process.argv.slice(2).map(a => {
  const [k, v] = a.replace(/^--/, '').split('=');
  return [k, v ?? true];
}));
const BASE_URL = args.base || 'http://localhost:3000';
const ONLY_SLUGS = args.slugs ? args.slugs.split(',') : null;

const ACTION_TEXT_RE = /convert|download|generate|create|calculate|format|encode|decode|compress|merge|split|extract|encrypt|decrypt|apply|save|export|process|build|translate|summarize|analyze|detect|remove|upscale|caption|transcribe|paraphrase|fix|run|submit|send|ask|search|scan|check|count|sort|compare|shorten|minify|beautify|validate|resize|crop|rotate|flip|trim|join|repair|unlock|protect|sign|redact|watermark|upscale|colorize|parse|calculate|equals|=/i;

// Maps an <input accept="..."> value or extension to a fixture file we can offer.
const EXT_TO_FIXTURE = {
  '.pdf': 'sample.pdf', '.docx': 'sample.docx', '.doc': 'sample.docx',
  '.xlsx': 'sample.xlsx', '.xls': 'sample.xls', '.csv': 'sample.csv', '.tsv': 'sample.tsv',
  '.txt': 'sample.txt', '.json': 'sample.json', '.xml': 'sample.xml', '.yaml': 'sample.yaml', '.yml': 'sample.yaml',
  '.md': 'sample.md', '.markdown': 'sample.md', '.html': 'sample.html', '.htm': 'sample.html',
  '.sql': 'sample.sql', '.toml': 'sample.toml', '.log': 'sample.log',
  '.wav': 'sample.wav', '.gif': 'sample.gif', '.bmp': 'sample.bmp', '.ico': 'sample.ico',
  '.zip': 'sample.zip', '.epub': 'sample.epub', '.tar': 'sample.tar',
  '.png': 'sample.png', '.jpg': 'sample.jpg', '.jpeg': 'sample.jpg', '.webp': 'sample.webp', '.svg': 'sample.svg',
  '.webm': 'sample.webm',
  '.heic': 'sample.heic', '.heif': 'sample.heic', '.tif': 'sample.tiff', '.tiff': 'sample.tiff',
  '.mobi': 'sample.mobi', '.azw': 'sample.mobi', '.azw3': 'sample.mobi', '.pptx': 'sample.pptx',
};
const MIME_TO_FIXTURE = {
  'image/*': 'sample.png', 'image/png': 'sample.png', 'image/jpeg': 'sample.jpg', 'image/gif': 'sample.gif', 'image/apng': 'sample.gif',
  'audio/*': 'sample.wav', 'video/*': 'sample.webm', 'video/webm': 'sample.webm',
  'video/avi': 'sample-real.avi', 'video/x-msvideo': 'sample-real.avi',
  'video/mov': 'sample.mov', 'video/quicktime': 'sample.mov', 'video/mp4': 'sample.mp4',
  'text/csv': 'sample.csv',
};

function pickFixture(acceptedFileTypes) {
  if (!acceptedFileTypes || acceptedFileTypes.length === 0) return { file: 'sample.txt', gap: false };
  for (const a of acceptedFileTypes) {
    const key = a.toLowerCase();
    if (EXT_TO_FIXTURE[key]) return { file: EXT_TO_FIXTURE[key], gap: false };
    if (MIME_TO_FIXTURE[key]) return { file: MIME_TO_FIXTURE[key], gap: false };
  }
  return { file: null, gap: true, requested: acceptedFileTypes };
}

const PASTE_SAMPLES = [
  { test: /json/i, value: '{\n  "name": "Audit",\n  "count": 3,\n  "tags": ["a", "b"]\n}' },
  { test: /xml/i, value: '<root><item id="1">Audit</item><item id="2">Fixture</item></root>' },
  { test: /yaml/i, value: 'name: Audit\ncount: 3\ntags:\n  - a\n  - b' },
  { test: /toml/i, value: 'name = "Audit"\ncount = 3' },
  { test: /csv/i, value: 'name,age,city\n"Smith, John",34,"New York"\nJane,29,Boston' },
  { test: /tsv/i, value: 'name\tage\tcity\nJohn\t34\tNY' },
  { test: /html/i, value: '<div class="x"><p>Audit fixture</p></div>' },
  { test: /markdown/i, value: '# Audit\n\nSome **bold** text and a [link](https://example.com).' },
  { test: /sql/i, value: "SELECT * FROM users WHERE id = 1;" },
  { test: /regex/i, value: '\\d+' },
  { test: /cron/i, value: '*/5 * * * *' },
  { test: /base64/i, value: 'SGVsbG8gQXVkaXQ=' },
  { test: /url/i, value: 'https://example.com/path?query=audit%20fixture&x=1' },
  { test: /hex/i, value: '48656c6c6f' },
  { test: /jwt/i, value: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U' },
  { test: /unicode/i, value: 'Héllo Wörld 你好' },
  { test: /color/i, value: '#3355ff' },
  { test: /diff|compar/i, value: 'line one\nline two\nline three' },
  { test: /timestamp/i, value: '1700000000' },
];
function pickPasteSample(labelOrSlug) {
  const hit = PASTE_SAMPLES.find(s => s.test.test(labelOrSlug));
  return hit ? hit.value : 'Audit fixture sample text. Lorem ipsum dolor sit amet, consectetur adipiscing elit.';
}

async function collectErrors(page) {
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push('console.error: ' + msg.text()); });
  return errors;
}

async function waitForChange(page, beforeSnapshot, timeoutMs = 8000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const after = await snapshot(page);
    if (after !== beforeSnapshot) return after;
    await page.waitForTimeout(300);
  }
  return null;
}

async function snapshot(page) {
  return page.evaluate(() => {
    const textareas = [...document.querySelectorAll('textarea')].map(t => t.value).join('|');
    const imgs = document.querySelectorAll('img[src^="blob:"], img[src^="data:"]').length;
    const canvases = [...document.querySelectorAll('canvas')].map(c => { try { return c.toDataURL().length; } catch { return 0; } }).join(',');
    const preOut = [...document.querySelectorAll('pre, [data-output]')].map(e => e.textContent).join('|');
    // Catch-all: many result-only tools (password/UUID generators, etc.) just
    // render the output into a plain <div>/<span>, not a textarea/pre. A
    // whole-page visible-text length + sample catches those without needing
    // per-tool selectors, at the cost of also picking up on unrelated DOM
    // churn (acceptable here since we only use it as a change signal, not
    // to judge correctness of the content itself).
    const bodyText = document.body.innerText || '';
    return JSON.stringify({ textareas, imgs, canvases, preOut, bodyTextLen: bodyText.length, bodyTextSample: bodyText.slice(0, 2000) });
  });
}

async function findActionButton(page) {
  const buttons = page.locator('button:visible');
  const count = await buttons.count();
  for (let i = 0; i < count; i++) {
    const btn = buttons.nth(i);
    const text = (await btn.textContent() || '').trim();
    if (ACTION_TEXT_RE.test(text)) {
      const disabled = await btn.isDisabled().catch(() => false);
      if (!disabled) return { btn, text };
    }
  }
  return null;
}

async function runFileUpload(page, tool) {
  const fixture = pickFixture(tool.acceptedFileTypes);
  if (fixture.gap) return { verdict: 'fixture-gap', detail: `no local fixture for accept=${JSON.stringify(fixture.requested)}` };
  let input = page.locator('input[type="file"]').first();
  if (await input.count() === 0) {
    // Some tools mount the file input only after switching to an "upload"
    // mode (e.g. a mic-vs-file toggle) -- try clicking one before giving up.
    const toggle = page.locator('button:visible', { hasText: /upload|file/i }).first();
    if (await toggle.count() > 0) {
      await toggle.click().catch(() => {});
      await page.waitForTimeout(300);
      input = page.locator('input[type="file"]').first();
    }
  }
  if (await input.count() === 0) return { verdict: 'fail', detail: 'category=file-upload but no <input type=file> found (checked for an upload-mode toggle too)' };
  const allowsMultiple = await input.getAttribute('multiple') !== null;
  const before = await snapshot(page);
  const downloadPromise = page.waitForEvent('download', { timeout: 9000 }).catch(() => null);
  const fixturePath = path.join(FIXTURES_DIR, fixture.file);
  // Tools whose input allows `multiple` often require >=2 files before their
  // action button enables (e.g. PDF Merge). Uploading the same fixture twice
  // satisfies that generically without needing a per-tool file count.
  await input.setInputFiles(allowsMultiple ? [fixturePath, fixturePath] : fixturePath);
  await page.waitForTimeout(500);
  const action = await findActionButton(page);
  if (action) await action.btn.click().catch(() => {});
  const [download, changed] = await Promise.all([downloadPromise, waitForChange(page, before, 8000)]);
  if (download) {
    const dlPath = await download.path().catch(() => null);
    const size = dlPath ? fs.statSync(dlPath).size : 0;
    return { verdict: size > 0 ? 'pass' : 'fail', detail: `download: ${download.suggestedFilename()} (${size} bytes)` };
  }
  if (changed) return { verdict: 'pass', detail: 'in-page output changed after upload' };
  if (!action) return { verdict: 'review', detail: 'no enabled action button found after upload -- may need a specific file count/combo, needs manual check' };
  return { verdict: 'fail', detail: 'action button clicked but no download and no visible output change' };
}

async function runPasteText(page, tool) {
  const textarea = page.locator('textarea').first();
  if (await textarea.count() === 0) return { verdict: 'fail', detail: 'category=paste-text but no <textarea> found' };
  const sample = pickPasteSample(tool.label + ' ' + tool.slug);
  const before = await snapshot(page);
  await textarea.fill(sample);
  await page.waitForTimeout(300);
  const action = await findActionButton(page);
  const downloadPromise = page.waitForEvent('download', { timeout: 6000 }).catch(() => null);
  if (action) await action.btn.click().catch(() => {});
  const [download, changed] = await Promise.all([downloadPromise, waitForChange(page, before, 6000)]);
  if (download) {
    const dlPath = await download.path().catch(() => null);
    const size = dlPath ? fs.statSync(dlPath).size : 0;
    return { verdict: size > 0 ? 'pass' : 'fail', detail: `download: ${download.suggestedFilename()} (${size} bytes)` };
  }
  if (changed) return { verdict: 'pass', detail: 'output changed after paste + action' };
  if (!action) return { verdict: 'review', detail: 'no action button found and no auto-update detected -- may be a live-transform tool needing manual check' };
  return { verdict: 'fail', detail: 'action button clicked but no output change detected' };
}

async function runDualMode(page, tool) {
  // Tools with an independent paste-or-upload toggle (e.g. Text to PDF):
  // the textarea is usually the default-visible mode, so try it first
  // exactly like a plain paste-text tool.
  const textarea = page.locator('textarea:not([readonly])').first();
  if (await textarea.count() > 0) {
    const result = await runPasteText(page, tool);
    if (result.verdict === 'pass') return result;
  }
  // Fall back to switching into upload mode and trying the file-upload flow.
  const toggle = page.locator('button:visible', { hasText: /upload|file/i }).first();
  if (await toggle.count() > 0) {
    await toggle.click().catch(() => {});
    await page.waitForTimeout(300);
    return runFileUpload(page, tool);
  }
  return { verdict: 'review', detail: 'dual-mode tool: neither the default textarea flow nor a file-mode toggle produced a clear result -- needs manual check' };
}

async function runFormGenerator(page, tool) {
  const before = await snapshot(page);
  // Best-effort generic fill of any visible text/number inputs.
  const inputs = page.locator('input[type="text"]:visible, input[type="number"]:visible, input:not([type]):visible');
  const n = await inputs.count();
  for (let i = 0; i < Math.min(n, 5); i++) {
    const inp = inputs.nth(i);
    const type = await inp.getAttribute('type');
    await inp.fill(type === 'number' ? '42' : 'audit test').catch(() => {});
  }
  const action = await findActionButton(page);
  const downloadPromise = page.waitForEvent('download', { timeout: 6000 }).catch(() => null);
  if (action) await action.btn.click().catch(() => {});
  const [download, changed] = await Promise.all([downloadPromise, waitForChange(page, before, 6000)]);
  if (download) {
    const dlPath = await download.path().catch(() => null);
    const size = dlPath ? fs.statSync(dlPath).size : 0;
    return { verdict: size > 0 ? 'pass' : 'fail', detail: `download: ${download.suggestedFilename()} (${size} bytes)` };
  }
  if (changed) return { verdict: 'pass', detail: 'output changed after fill + action' };
  if (!action) return { verdict: 'review', detail: 'no recognizable action button -- needs manual/custom test' };
  return { verdict: 'fail', detail: 'action button clicked but no output change detected' };
}

async function runRecorder(page, tool) {
  const recordBtn = page.locator('button:visible', { hasText: /record|start/i }).first();
  if (await recordBtn.count() === 0) return { verdict: 'review', detail: 'no record/start button found by text match -- needs manual check' };
  const before = await snapshot(page);
  await recordBtn.click().catch(() => {});
  await page.waitForTimeout(1500);
  const stopBtn = page.locator('button:visible', { hasText: /stop/i }).first();
  const downloadPromise = page.waitForEvent('download', { timeout: 6000 }).catch(() => null);
  if (await stopBtn.count() > 0) await stopBtn.click().catch(() => {});
  const [download, changed] = await Promise.all([downloadPromise, waitForChange(page, before, 5000)]);
  if (download) return { verdict: 'pass', detail: `download after record/stop: ${download.suggestedFilename()}` };
  if (changed) return { verdict: 'pass', detail: 'output changed after record/stop' };
  return { verdict: 'fail', detail: 'record+stop produced no download and no visible output' };
}

async function runStub(page, tool) {
  const hasComingSoon = await page.locator('text=Coming Soon').count() > 0;
  return hasComingSoon
    ? { verdict: 'stub-ok', detail: 'confirmed "Coming Soon" placeholder, as expected' }
    : { verdict: 'review', detail: 'classified as stub by source scan but "Coming Soon" not found on live page -- may have shipped since' };
}

const RUNNERS = {
  'file-upload': runFileUpload,
  'paste-text': runPasteText,
  'dual-mode': runDualMode,
  'form-generator': runFormGenerator,
  'canvas-only': runFormGenerator,
  'recorder': runRecorder,
  'stub': runStub,
};

async function auditOne(browser, tool) {
  const context = await browser.newContext({ acceptDownloads: true, permissions: ['microphone', 'camera'] });
  const page = await context.newPage();
  const errors = await collectErrors(page);
  const apiResponses = [];
  if (tool.callsInternalApi) {
    page.on('response', (r) => { if (r.url().includes('/api/')) apiResponses.push({ url: r.url(), status: r.status() }); });
  }
  const result = { slug: tool.slug, urlPath: tool.urlPath, category: tool.category, label: tool.label };
  try {
    const resp = await page.goto(BASE_URL + tool.urlPath, { waitUntil: 'networkidle', timeout: 30000 });
    result.httpStatus = resp ? resp.status() : null;
    if (!resp || resp.status() >= 400) {
      result.verdict = 'fail'; result.detail = `page load status ${result.httpStatus}`;
    } else {
      const runner = RUNNERS[tool.category] || runFormGenerator;
      const outcome = await runner(page, tool);
      Object.assign(result, outcome);
    }
  } catch (e) {
    result.verdict = 'fail';
    result.detail = 'runner threw: ' + e.message;
  }
  result.consoleErrors = errors.slice(0, 10);
  if (tool.callsInternalApi) {
    result.apiResponses = apiResponses;
    const apiError = apiResponses.find(r => r.status >= 400);
    if (apiResponses.length === 0) {
      result.apiNote = 'tool source calls /api/* but no such request was observed during the run';
    } else if (apiError) {
      // An error response can still change on-page text (e.g. rendering the
      // error message), which the generic change-detection would otherwise
      // read as success -- override that here so a real backend failure
      // isn't reported as a pass.
      result.verdict = 'api-error';
      result.detail = `internal API call failed: ${apiError.url} -> ${apiError.status}`;
      result.apiNote = 'at least one /api/* call returned an error status (this may be a local-dev-only gap if the relevant provider key is not set in .env.local, not necessarily broken in production)';
    }
  }
  await context.close();
  return result;
}

async function warmUp(browser, tools) {
  // Next dev compiles each route (and its dynamic imports, e.g. `await
  // import('xlsx')`) on first request. Hitting every URL once before timing
  // anything keeps that cold-compile latency out of the actual audit run,
  // instead of it masquerading as "no output changed" failures.
  console.log(`Warming up ${tools.length} route(s)...`);
  const page = await browser.newPage();
  for (const tool of tools) {
    await page.goto(BASE_URL + tool.urlPath, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
  }
  await page.close();
  console.log('Warmup done.\n');
}

(async () => {
  const allTools = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  const tools = ONLY_SLUGS ? allTools.filter(t => ONLY_SLUGS.includes(t.slug)) : allTools;
  console.log(`Auditing ${tools.length} tool(s) against ${BASE_URL}...`);

  const browser = await chromium.launch({
    // Fake device + fake UI let getUserMedia() resolve with a synthetic
    // audio/video feed instead of hanging on a real-hardware/permission
    // prompt -- needed for the 2 recorder-category tools (voice/screen
    // recorder), harmless no-ops for every other tool.
    args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'],
  });
  if (!args['no-warmup']) await warmUp(browser, tools);
  const results = [];
  for (const tool of tools) {
    process.stdout.write(`  ${tool.urlPath} ... `);
    const r = await auditOne(browser, tool);
    console.log(`${r.verdict}${r.detail ? ' — ' + r.detail : ''}`);
    results.push(r);
  }
  await browser.close();

  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  const outPath = path.join(RESULTS_DIR, `run-${Date.now()}.json`);
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));

  const tally = results.reduce((acc, r) => { acc[r.verdict] = (acc[r.verdict] || 0) + 1; return acc; }, {});
  console.log('\n--- Summary ---');
  console.log(JSON.stringify(tally, null, 2));
  console.log('Full results ->', outPath);
})();
