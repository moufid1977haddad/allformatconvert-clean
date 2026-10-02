#!/usr/bin/env bash
# P24: wait (bounded) for the production deployment of a master commit, then show what www serves.
# Usage: bash scripts/p24/wait-prod.sh <short-sha>
sha="$1"; r=none
for i in $(seq 1 12); do r=$(node scripts/p24/vdeploy.mjs find "$sha" 2>/dev/null); [ "$r" != "none" ] && break; timeout 10 tail -f /dev/null; done
echo "$r"; u=$(echo "$r" | awk '{print $2}')
[ -n "$u" ] && [ "$u" != "none" ] && vercel inspect "$u" --wait --timeout 25m 2>&1 | grep -E "^\s+status" | head -1
node scripts/p24/vdeploy.mjs prod 2>/dev/null
