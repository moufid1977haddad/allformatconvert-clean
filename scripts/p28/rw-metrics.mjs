// P28: memory and CPU of Railway services over the last <hours> (Railway's public GraphQL API, the logged-in CLI's
// token read in-process -- never printed). Average and max per service, and the idle cost at Railway's rates
// (10 $/GB/month of memory, 20 $/vCPU/month).
//   node scripts/p28/rw-metrics.mjs <hours> <service>... [--split=<ISO time>]  (before / after a deployment)
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const split = process.argv.find((a) => a.startsWith('--split='))?.slice(8);
const [hours, ...names] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const cfg = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.railway', 'config.json'), 'utf8'));
const token = cfg.user.accessToken || cfg.user.token;
const st = JSON.parse(execFileSync('npx', ['-y', '@railway/cli@latest', 'status', '--json'], { encoding: 'utf8', shell: true, stdio: ['ignore', 'pipe', 'ignore'] }));
const env = st.environments.edges[0].node.id;
const q = `query($p:String!,$s:String!,$e:String!,$start:DateTime!){metrics(projectId:$p,serviceId:$s,environmentId:$e,startDate:$start,measurements:[MEMORY_USAGE_GB,CPU_USAGE],sampleRateSeconds:300){measurement values{ts value}}}`;
for (const name of names) {
  const s = st.services.edges.find((e) => e.node.name === name).node.id;
  const r = await fetch('https://backboard.railway.com/graphql/v2', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: q, variables: { p: st.id, s, e: env, start: new Date(Date.now() - hours * 3600e3).toISOString() } }) }).then((x) => x.json());
  if (r.errors) { console.log(name, 'error', r.errors[0].message); continue; }
  for (const [label, keep] of split ? [['before', (t) => t < Date.parse(split)], ['after', (t) => t >= Date.parse(split)]] : [['', () => true]]) {
  const out = {};
  for (const m of r.data.metrics) {
    const v = m.values.filter((x) => keep(typeof x.ts === "number" ? x.ts * 1000 : Date.parse(x.ts))).map((x) => x.value);
    out[m.measurement] = { avg: v.reduce((a, b) => a + b, 0) / (v.length || 1), max: Math.max(...v, 0), last: v.at(-1) ?? 0 };
  }
  const mem = out.MEMORY_USAGE_GB || {}, cpu = out.CPU_USAGE || {};
  console.log(`${name}${label ? ' ' + label : ''}: memory avg ${mem.avg?.toFixed(3)} GB max ${mem.max?.toFixed(3)} last ${mem.last?.toFixed(3)} | cpu avg ${cpu.avg?.toFixed(3)} vCPU max ${cpu.max?.toFixed(3)} | idle cost at last value ≈ ${((mem.last || 0) * 10 + (cpu.last || 0) * 20).toFixed(2)} $/month`);
  }
}
