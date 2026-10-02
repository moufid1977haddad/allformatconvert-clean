#!/usr/bin/env bash
# P25: local regression of one lot on the local production build (http://localhost:3100): the lot's own bench, the P24
# developer bench, then the robustness bench of every tool, ×3 engines. One summary line per run in $1.
# Usage: bash scripts/p25/regress.sh <logfile> [lot bench, default lot1]
L="${1:-$TEMP/p25-regress.log}"; LOT="${2:-lot1}"; : > "$L"
O=http://localhost:3100
line() { echo "$1" >> "$L"; }
for b in chromium firefox webkit; do
  r=$(timeout 1500 node scripts/p25/$LOT.mjs $O --browser=$b 2>&1 | grep -E "FAIL|passed|Error" | tail -3 | tr '\n' ' '); line "$b $LOT: $r"
  r=$(timeout 1500 node scripts/p24/dev-lot.mjs $O --browser=$b 2>&1 | grep -E "ALL PASS|FAIL|passed|Error" | tail -2 | tr '\n' ' '); line "$b dev-lot: $r"
done
for b in chromium firefox webkit; do
  r=$(timeout 3600 node scripts/browser-tests/p21-robustness.mjs $O --browser=$b --pool=3 2>&1 | grep -E "^FAIL|ALL PASS|FAIL," | tail -6 | tr '\n' ' '); line "$b robustness (all tools): $r"
done
line DONE
