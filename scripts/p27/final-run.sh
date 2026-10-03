#!/usr/bin/env bash
# P27 lot 2: every heavy bench on the LOCAL production build (http://localhost:3100) -- Vercel usage rule: heavy work
# local, once on the preview, light on www. 3 engines, iPhone and iPad simulation (download, robustness, layout, RAW),
# the Node tests. One summary line per run in $1 (default $TEMP/p27-final.log).
# Usage: bash scripts/p27/final-run.sh [logfile]
L="${1:-$TEMP/p27-final.log}"; : > "$L"
O=http://localhost:3100
line() { echo "$(date +%H:%M) $1" >> "$L"; }
for t in decimal-comma json-text jwt-verify pdf-editor-worker pdf-merge-worker pdf-split-worker pdf-split-bookmarks redact-patterns strip-metadata; do
  r=$(timeout 300 node scripts/p24/$t.test.mjs 2>&1 | grep -E "passed|FAIL|all passed" | tail -1); line "node $t: $r"
done
for b in chromium firefox webkit; do
  r=$(timeout 2400 node scripts/browser-tests/all-pages-load.mjs $O --browser=$b 2>&1 | tail -1); line "$b all pages: $r"
done
r=$(timeout 2400 node scripts/browser-tests/all-pages-load.mjs $O --browser=webkit --safari16 2>&1 | tail -1); line "webkit safari16 all pages: $r"
for b in chromium firefox webkit; do
  for s in adds-lot dev-lot image-lot gif-lot av-lot pdf-lot tiff-lot pdfjs-decoders; do
    r=$(timeout 1500 node scripts/p24/$s.mjs $O --browser=$b 2>&1 | grep -E "ALL PASS|FAIL|passed|Error" | tail -2 | tr '\n' ' '); line "$b $s: $r"
  done
  r=$(timeout 900 node scripts/p27/keyboard-check.mjs $O --browser=$b 2>&1 | tail -1); line "$b keyboard: $r"
done
for d in iphone ipad; do
  r=$(timeout 1800 node scripts/browser-tests/download-guard.mjs $O --browser=webkit --device=$d 2>&1 | grep -E "ALL PASS|FAIL" | tail -2 | tr '\n' ' '); line "webkit $d download-guard: $r"
  r=$(timeout 1800 node scripts/browser-tests/big-image.mjs $O --browser=webkit --device=$d 2>&1 | tail -1); line "webkit $d big-image: $r"
  r=$(timeout 1800 node scripts/browser-tests/p22-raw.mjs $O --browser=webkit --device=$d 2>&1 | grep -E "ALL PASS|FAIL" | tail -2 | tr '\n' ' '); line "webkit $d RAW: $r"
done
r=$(timeout 3600 node scripts/browser-tests/p21-layout.mjs $O --browser=webkit --device=both 2>&1 | tail -2 | tr '\n' ' '); line "webkit layout iphone+ipad: $r"
r=$(timeout 1800 node scripts/browser-tests/download-guard.mjs $O --browser=chromium 2>&1 | grep -E "ALL PASS|FAIL" | tail -2 | tr '\n' ' '); line "chromium download-guard: $r"
r=$(timeout 900 node scripts/browser-tests/p20-01-10.mjs $O 2>&1 | grep -E "ALL PASS|FAIL" | tail -2 | tr '\n' ' '); line "chromium p20 drop/pages: $r"
V="$(cygpath -w "$TEMP/verapdf/verapdf.bat")"
for b in chromium firefox webkit; do
  r=$(timeout 1800 node scripts/p26/e2/pdfa-page.mjs $O "$TEMP/p26/e2page" "$V" --cors-shim --browser=$b 2>&1 | tail -1); line "$b PDF/A page: $r"
  r=$(timeout 1800 node scripts/p26/e1/word-page.mjs $O "$TEMP/p26/e1pdf" "$TEMP/p27/wordpage2-$b" --browser=$b 2>&1 | tail -1); line "$b PDF to Word page: $r"
done
for b in chromium firefox webkit; do
  r=$(timeout 5400 node scripts/browser-tests/p21-robustness.mjs $O --browser=$b --pool=3 2>&1 | grep -E "^FAIL|ALL PASS|FAIL," | tail -6 | tr '\n' ' '); line "$b robustness (all tools): $r"
done
line DONE
