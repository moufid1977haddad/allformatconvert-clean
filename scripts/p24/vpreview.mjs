// P24: create a Vercel PREVIEW deployment of one commit (branch already pushed), through the logged-in CLI.
// node scripts/p24/vpreview.mjs <branch> <full-sha>   → prints the deployment id and URL
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const [ref, sha] = process.argv.slice(2);
if (!ref || !/^[0-9a-f]{40}$/.test(sha || '')) { console.error('usage: vpreview.mjs <branch> <40-char sha>'); process.exit(2); }
const body = { name: 'onlineconvertools', project: 'onlineconvertools', target: undefined, gitSource: { type: 'github', repoId: 1244155525, ref, sha } };
const f = path.join(os.tmpdir(), `vpreview-${Date.now()}.json`);
fs.writeFileSync(f, JSON.stringify(body));
const out = execSync(`vercel api "/v13/deployments?forceNew=1&skipAutoDetectionConfirmation=1" -X POST --input "${f}"`, { encoding: 'utf8', env: { ...process.env, MSYS_NO_PATHCONV: '1' }, stdio: ['ignore', 'pipe', 'pipe'] });
const j = JSON.parse(out);
console.log(j.id, j.url, j.readyState, j.target || 'preview');
