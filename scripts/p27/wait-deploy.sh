# P27: wait (bounded) for the Vercel deployment of a branch to leave BUILDING/QUEUED; prints "id url state sha".
#   bash scripts/p27/wait-deploy.sh <branch> [seconds=900] [sha-prefix]
# By branch, not only by commit: a commit already deployed on another branch has its own (maybe failed) deployment.
# Note: Vercel clones the last 10 commits; the project's ignoreCommand diffs against the branch's last deployed commit,
# so a branch pushed more than 10 commits after its last deployment fails with "bad object" — push to a new branch.
branch=$1; end=$(( $(date +%s) + ${2:-900} )); sha=${3:-}
while [ $(date +%s) -lt $end ]; do
  line=$(MSYS_NO_PATHCONV=1 vercel api "/v6/deployments?projectId=onlineconvertools&limit=20" 2>/dev/null | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{const j=JSON.parse(d);const x=j.deployments.find(x=>x.meta?.githubCommitRef==='$branch'&&(x.meta?.githubCommitSha||'').startsWith('$sha'));if(x)console.log(x.uid,x.url,x.state||x.readyState,(x.meta.githubCommitSha||'').slice(0,8))}catch{}})")
  case "$line" in *READY*|*ERROR*|*CANCELED*) echo "$line"; exit 0;; esac
  sleep 15
done
echo "TIMEOUT $line"
