#!/usr/bin/env bash
# P34 (05/10) — lot B: the benches that failed in run-all.sh, re-run after the bench-side fixes (link address awaited,
# exact "Mode" label) and with the arguments they need; then the second wave (run-more.sh).
L="${1:-$TEMP/p34-run.log}"; OUT="$TEMP/p34-out"; O=http://localhost:3100
line() { echo "$(date +%H:%M) $1" >> "$L"; }
run() { local name="$1" t="$2"; shift 2; local f="$OUT/re_$(echo "$name" | tr ' /' '__').log"; timeout "$t" "$@" > "$f" 2>&1; local code=$?; line "RERUN $name | exit $code | FAIL lines $(grep -ac '^FAIL\|^ *FAIL ' "$f") | $(grep -aE 'passed|ALL PASS|FAIL|failed|Error' "$f" | tail -2 | tr '\n' ' ' | cut -c1-220)"; }
export TESSDATA_PREFIX="$(cygpath -w "$TEMP/p33-tessdata")"
run "node ocr-service" 600 node scripts/p33/ocr-service.test.mjs
run "chromium p24 dev-lot" 1500 node scripts/p24/dev-lot.mjs $O --browser=chromium --cors-shim
for b in chromium firefox webkit; do run "$b image-audit-2" 2400 node scripts/browser-tests/image-audit-2.mjs $O --browser=$b; run "$b p21 pdf-to-images" 900 node scripts/browser-tests/p21-pdf-to-images.mjs $O --browser=$b; done
run "firefox misc-audit-2" 2400 node scripts/browser-tests/misc-audit-2.mjs $O --browser=firefox
for s in adds-lot dev-lot gif-lot tiff-lot; do run "webkit p24 $s" 1500 node scripts/p24/$s.mjs $O --browser=webkit --cors-shim; done
run "webkit gif-audit-2" 2400 node scripts/browser-tests/gif-audit-2.mjs $O --browser=webkit
run "webkit av-audit-2" 2400 node scripts/browser-tests/av-audit-2.mjs $O --browser=webkit
line "DONE rerun"
bash scripts/p34/run-more.sh "$L"
