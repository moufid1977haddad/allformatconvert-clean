// P26: latest deployment of one Railway service (id, status, time, commit), read through the logged-in CLI.
//   node scripts/p26/rw-deploy-state.mjs <service> [--wait-new=<old-deployment-id>]  (bounded: 15 min)
import { execFileSync } from 'node:child_process';
const [svc] = process.argv.slice(2);
const old = process.argv.find((a) => a.startsWith('--wait-new='))?.split('=')[1];
const read = () => {
  const j = JSON.parse(execFileSync('npx', ['-y', '@railway/cli@latest', 'status', '--json'], { encoding: 'utf8', shell: true, stdio: ['ignore', 'pipe', 'ignore'] }));
  const id = j.services.edges.find((e) => e.node.name === svc).node.id;
  const inst = j.environments.edges[0].node.serviceInstances.edges.map((e) => e.node).find((n) => n.serviceId === id);
  const d = inst.latestDeployment;
  return { id: d.id, status: d.status, createdAt: d.createdAt, commit: (d.meta?.commitHash || '').slice(0, 8), active: (inst.activeDeployments || []).map((a) => a.id.slice(0, 8) + ':' + a.status).join(',') };
};
const t0 = Date.now();
let s = read();
while (old && (s.id === old || !/SUCCESS|FAILED|CRASHED|REMOVED|SLEEPING/.test(s.status)) && Date.now() - t0 < 15 * 60e3) {
  await new Promise((r) => setTimeout(r, 15000));
  s = read();
}
console.log(svc, s.id, s.status, s.createdAt, 'commit', s.commit, 'active', s.active);
