// P24 deployment helper (Vercel REST through the logged-in CLI: `vercel api`, no token handled here).
// node scripts/p24/vdeploy.mjs find <git-branch|sha>   → newest deployment for that branch or commit
// node scripts/p24/vdeploy.mjs prod                    → deployment serving www
import { execFileSync } from 'node:child_process';
const api = (path) => JSON.parse(execFileSync('vercel api "' + path + '"', { encoding: 'utf8', shell: true, maxBuffer: 64 << 20, env: { ...process.env, MSYS_NO_PATHCONV: '1' }, stdio: ['ignore', 'pipe', 'ignore'] }));
const show = (d) => console.log([d.uid || d.id, d.url, d.target || 'preview', d.state || d.readyState, new Date(d.created || d.createdAt).toISOString(), (d.meta?.githubCommitSha || '').slice(0, 8), d.meta?.githubCommitRef].join(' '));
const [cmd, arg] = process.argv.slice(2);
if (cmd === 'prod') show(api('/v13/deployments/www.onlineconvertools.com'));
else if (cmd === 'find') {
  const list = api('/v6/deployments?app=onlineconvertools&limit=40').deployments;
  const d = list.find((x) => x.meta?.githubCommitRef === arg || (x.meta?.githubCommitSha || '').startsWith(arg));
  if (d) show(d); else console.log('none');
}
