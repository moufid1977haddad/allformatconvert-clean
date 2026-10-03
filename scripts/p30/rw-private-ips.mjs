// P30 lot 5: the private-network addresses (DNS name and IPs) of the services of one Railway project/environment, read
// from Railway's public GraphQL API with the logged-in CLI's token (read in-process, never printed). Read-only.
// Used to probe, from the isolated project, whether those addresses can be reached at all.
//   node scripts/p30/rw-private-ips.mjs <projectId> <environmentId>
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const [projectId, environmentId] = process.argv.slice(2);
const cfg = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.railway', 'config.json'), 'utf8'));
const token = cfg.user.accessToken || cfg.user.token;
const gql = (query, variables) => fetch('https://backboard.railway.com/graphql/v2', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ query, variables }) }).then((r) => r.json());
const nets = await gql('query($e:String!){privateNetworks(environmentId:$e){publicId networkId name dnsName}}', { e: environmentId });
if (nets.errors) { console.log('privateNetworks:', nets.errors[0].message); process.exit(1); }
const proj = await gql('query($p:String!){project(id:$p){services{edges{node{id name}}}}}', { p: projectId });
for (const n of nets.data.privateNetworks) {
  console.log('network', n.name, n.dnsName);
  for (const { node: s } of proj.data.project.services.edges) {
    const ep = await gql('query($e:String!,$n:String!,$s:String!){privateNetworkEndpoint(environmentId:$e,privateNetworkId:$n,serviceId:$s){dnsName privateIps}}', { e: environmentId, n: n.publicId, s: s.id });
    if (ep.errors) { console.log(' ', s.name, 'error', ep.errors[0].message); continue; }
    console.log(' ', s.name, ep.data.privateNetworkEndpoint?.dnsName, (ep.data.privateNetworkEndpoint?.privateIps || []).join(' '));
  }
}
