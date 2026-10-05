#!/usr/bin/env bash
# P34 (05/10) — lot B, second wave: the one-tool benches of scripts/browser-tests that run locally with only an origin
# (list: scripts/p34/more-benches.txt; their default engine), against the same local production build with the fake
# providers. Benches needing a second origin (reference sites), a directory or a www/paid target are not run here.
# Usage: bash scripts/p34/run-more.sh [logfile]
L="${1:-$TEMP/p34-run.log}"
OUT="$TEMP/p34-out"; mkdir -p "$OUT"
O=http://localhost:3100
line() { echo "$(date +%H:%M) $1" >> "$L"; }
while read -r b; do
  [ -z "$b" ] && continue
  f="$OUT/more_$b.log"
  timeout 1500 node "scripts/browser-tests/$b.mjs" $O > "$f" 2>&1; code=$?
  fails=$(grep -ac "^FAIL\|^ *FAIL " "$f")
  last=$(grep -aE "passed|ALL PASS|FAIL|failed|Error" "$f" | tail -2 | tr '\n' ' ' | cut -c1-220)
  line "more $b | exit $code | FAIL lines $fails | $last"
done < scripts/p34/more-benches.txt
line "DONE more"
