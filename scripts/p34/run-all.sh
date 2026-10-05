#!/usr/bin/env bash
# P34 (05/10) — lot B: every bench and test of the repository that runs LOCALLY against the production build
# (http://localhost:3100, started with scripts/p34/fake-all-providers.mjs: no paid call, nothing written to Supabase,
# no alert sent). Benches that target www, a remote/paid service or a real AI call are NOT run (listed in the report).
# One summary line per run in $1 (default $TEMP/p34-run.log); full outputs in $TEMP/p34-out/.
# Usage: bash scripts/p34/run-all.sh [logfile]
L="${1:-$TEMP/p34-run.log}"; : > "$L"
OUT="$TEMP/p34-out"; mkdir -p "$OUT"
O=http://localhost:3100
line() { echo "$(date +%H:%M) $1" >> "$L"; }
# run <name> <timeout s> <command…>: full output kept, the last result lines summarised
run() {
  local name="$1" t="$2"; shift 2
  local f="$OUT/$(echo "$name" | tr ' /' '__').log"
  timeout "$t" "$@" > "$f" 2>&1; local code=$?
  local fails; fails=$(grep -ac "^FAIL\|^ *FAIL " "$f")
  local last; last=$(grep -aE "passed|ALL PASS|FAIL|failed|Error" "$f" | tail -2 | tr '\n' ' ' | cut -c1-220)
  line "$name | exit $code | FAIL lines $fails | $last"
}

# ---- Node tests (no browser) ----
export TESSDATA_PREFIX="$(cygpath -w "$TEMP/p33-tessdata")"
for t in scripts/csv-tests/*.test.mjs scripts/media-tests/*.test.mjs scripts/p21/*.test.mjs scripts/p23/*.test.mjs scripts/p24/*.test.mjs scripts/p25/*.test.mjs scripts/p26/e1/*.test.mjs scripts/p27/*.test.mjs scripts/p30/*.test.mjs scripts/p31/*.test.mjs scripts/p32/*.test.mjs scripts/p33/*.test.mjs scripts/sql-to-csv-tests/*.test.mjs; do
  run "node $(basename "$t")" 600 node "$t"
done
run "node p33 sanitize" 300 node scripts/p33/sanitize.test.mjs "$TEMP/p33-review-redact"

# ---- every page, 3 engines + Safari 16.4 simulation ----
for b in chromium firefox webkit; do run "$b all-pages-load" 2400 node scripts/browser-tests/all-pages-load.mjs $O --browser=$b; done
run "webkit safari16 all-pages-load" 2400 node scripts/browser-tests/all-pages-load.mjs $O --browser=webkit --safari16
run "webkit safari16-pdf" 1800 node scripts/browser-tests/safari16-pdf.mjs $O --browser=webkit

# ---- tool lots and audits, 3 engines ----
for b in chromium firefox webkit; do
  for s in adds-lot dev-lot image-lot gif-lot av-lot pdf-lot tiff-lot pdfjs-decoders; do run "$b p24 $s" 1500 node scripts/p24/$s.mjs $O --browser=$b --cors-shim; done
  for a in image-audit-2 gif-audit-2 pdf-audit-2 av-audit-2 misc-audit-2; do run "$b $a" 2400 node scripts/browser-tests/$a.mjs $O --browser=$b; done
  run "$b keyboard" 900 node scripts/p27/keyboard-check.mjs $O --browser=$b
  run "$b p31 download-names" 1800 node scripts/p31/download-names.mjs $O --browser=$b
  run "$b p31 size-preflight" 900 node scripts/p31/size-preflight.mjs $O --browser=$b
  run "$b p31 pdf-to-jpg" 900 node scripts/p31/pdf-to-jpg-webkit.mjs $O --browser=$b
  run "$b p21 compressor-formats" 900 node scripts/browser-tests/p21-compressor-formats.mjs $O --browser=$b
  run "$b p21 jpg-to-pdf-formats" 900 node scripts/browser-tests/p21-jpg-to-pdf-formats.mjs $O --browser=$b
  run "$b p21 audio-formats" 1500 node scripts/browser-tests/p21-audio-formats.mjs $O --browser=$b
  run "$b p21 pdf-to-images" 900 node scripts/browser-tests/p21-pdf-to-images.mjs $O --browser=$b
  run "$b text-tools" 900 node scripts/browser-tests/text-tools.mjs $O --browser=$b
done
run "webkit iphone p31 download-names" 1800 node scripts/p31/download-names.mjs $O --browser=webkit --device=iphone
run "chromium code-formatter-page" 900 node scripts/p31/code-formatter-page.mjs $O
for d in iphone ipad; do
  run "webkit $d download-guard" 1800 node scripts/browser-tests/download-guard.mjs $O --browser=webkit --device=$d
  run "chromium $d big-image" 1800 node scripts/browser-tests/big-image.mjs $O --browser=chromium --device=$d
  run "webkit $d RAW" 1800 node scripts/browser-tests/p22-raw.mjs $O --browser=webkit --device=$d
done
run "chromium download-guard" 1800 node scripts/browser-tests/download-guard.mjs $O --browser=chromium
run "chromium p20 drop/pages" 900 node scripts/browser-tests/p20-01-10.mjs $O
run "webkit layout iphone+ipad" 3600 node scripts/browser-tests/p21-layout.mjs $O --browser=webkit --device=both
run "p31 layout-iphone 390+375" 3600 node scripts/p31/layout-iphone.mjs $O --viewport=both
for b in chromium firefox; do run "$b p33 pdf-reduce" 1800 node scripts/p33/pdf-reduce.mjs $O --browser=$b; done
for e in webkit chromium; do run "$e p33 ocr-fallback" 1800 node scripts/p33/ocr-fallback.mjs $O --browser=$e --route-origin=http://127.0.0.1:3498; done
run "chromium desktop p33 ocr-fallback" 1800 node scripts/p33/ocr-fallback.mjs $O --browser=chromium --device=desktop --route-origin=http://127.0.0.1:3498
for e in webkit chromium; do run "$e p33 redact-truth kit" 600 node scripts/p33/redact-truth.mjs $O --browser=$e; done
for e in webkit chromium; do run "$e p32 pdf-render-fallback" 1200 node scripts/p32/pdf-render-fallback.mjs $O --browser=$e --route-origin=http://127.0.0.1:3498; done
# ---- robustness of every tool (longest last) ----
for b in chromium firefox webkit; do run "$b robustness (all tools)" 5400 node scripts/browser-tests/p21-robustness.mjs $O --browser=$b --pool=3; done
line DONE
