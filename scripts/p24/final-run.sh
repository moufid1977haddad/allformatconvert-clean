#!/usr/bin/env bash
# P24 final verification on the final local build (http://localhost:3100): every P24 bench ×3 engines, the Node
# tests, then the full robustness bench ×3 (every tool). One summary line per run in $1 (default $TEMP/p24-final.log).
# Usage: bash scripts/p24/final-run.sh [logfile]
L="${1:-$TEMP/p24-final.log}"; : > "$L"
O=http://localhost:3100
line() { echo "$1" >> "$L"; }
for t in decimal-comma json-text jwt-verify pdf-editor-worker pdf-merge-worker pdf-split-worker pdf-split-bookmarks redact-patterns strip-metadata; do
  r=$(timeout 300 node scripts/p24/$t.test.mjs 2>&1 | grep -E "passed|FAIL|all passed" | tail -1); line "node $t: $r"
done
r=$(npx -y esbuild app/lib/pdfImages.js --bundle --format=esm --platform=node --outfile="$TEMP/p24-pdfImages.mjs" --log-level=error --external:sharp && node scripts/p24/pdf-images-exif.test.mjs "file:///$(cygpath -m "$TEMP/p24-pdfImages.mjs")" 2>&1 | tail -1); line "node pdf-images-exif: $r"
for b in chromium firefox webkit; do
  for s in adds-lot dev-lot image-lot gif-lot av-lot pdf-lot tiff-lot pdfjs-decoders; do
    r=$(timeout 1500 node scripts/p24/$s.mjs $O --browser=$b 2>&1 | grep -E "ALL PASS|FAIL|passed|Error" | tail -2 | tr '\n' ' '); line "$b $s: $r"
  done
done
for b in chromium firefox webkit; do
  r=$(timeout 3600 node scripts/browser-tests/p21-robustness.mjs $O --browser=$b --pool=3 2>&1 | grep -E "^FAIL|ALL PASS|FAIL," | tail -6 | tr '\n' ' '); line "$b robustness (all tools): $r"
done
line DONE
