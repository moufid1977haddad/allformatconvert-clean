// The REAL media-processing service, started locally with a real ffmpeg and a throwaway secret (in memory only), for
// browser tests of the tools that use it -- never the production service. The site under test must be built or run
// with NEXT_PUBLIC_MEDIA_SERVICE_URL=http://localhost:<port>. /api/media/ticket is answered in the browser with a
// ticket minted by the site's own lib/media/ticket.js (its rate limit would need the production database).
// Env: MEDIA_FFMPEG (path to ffmpeg). Python: services/media-processing/.venv (flask).
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { randomBytes } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { mintTicket } = require('../../../lib/media/ticket.js');

export async function startLocalMediaService({ origin, port = 8621, ffmpeg = process.env.MEDIA_FFMPEG } = {}) {
  if (!ffmpeg || !fs.existsSync(ffmpeg)) throw new Error('Set MEDIA_FFMPEG to a local ffmpeg binary.');
  const secret = randomBytes(32).toString('base64url');
  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'local-media-'));
  const svcDir = path.resolve('services/media-processing');
  const py = path.join(svcDir, '.venv/Scripts/python.exe');
  const proc = spawn(py, ['-m', 'app.main'], {
    cwd: svcDir,
    env: { ...process.env, PORT: String(port), MEDIA_TICKET_SECRET: secret, ALLOWED_ORIGINS: origin,
      MEDIA_MAX_CONCURRENT_JOBS: '2', MEDIA_MAX_QUEUED_JOBS: '10', MEDIA_MAX_FILE_BYTES: String(1024 ** 3), MEDIA_MAX_DURATION_SECONDS: '7200',
      MEDIA_JOB_TTL_SECONDS: '900', MEDIA_FFMPEG_TIMEOUT_SECONDS: '1500', MEDIA_WORK_DIR: work, MEDIA_FFMPEG_PATH: ffmpeg, MEDIA_CHUNK_BYTES: String(8 * 1024 * 1024) },
    stdio: 'ignore',
  });
  let up = false;
  for (let i = 0; i < 60 && !up; i++) { try { up = (await fetch(`http://127.0.0.1:${port}/health`)).ok; } catch {} if (!up) await new Promise((r) => setTimeout(r, 500)); }
  if (!up) { proc.kill(); throw new Error('The local media service did not start.'); }
  const jobs = [];
  return {
    jobs, // one entry per ticket asked by the page: { op }
    async routeTickets(ctxOrPage) {
      await ctxOrPage.route('**/api/media/ticket', async (route) => {
        const body = JSON.parse(route.request().postData() || '{}');
        jobs.push({ op: body.op });
        const t = mintTicket({ secret, op: body.op, maxBytes: 1024 ** 3 });
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ jid: t.jid, ticket: t.ticket, expiresAt: t.expiresAt }) });
      });
    },
    stop() { proc.kill(); try { fs.rmSync(work, { recursive: true, force: true }); } catch {} },
  };
}
