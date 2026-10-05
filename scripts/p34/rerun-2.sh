#!/usr/bin/env bash
# P34 (05/10) — lot B, after the clean fixes (CSV to SQL example and answers, privacy date) and the remaining bench
# fixes: rebuild, restart the local production build with the fake providers, re-run what they touch.
L="${1:-$TEMP/p34-run.log}"; OUT="$TEMP/p34-out"; O=http://localhost:3100
line() { echo "$(date +%H:%M) $1" >> "$L"; }
run() { local name="$1" t="$2"; shift 2; local f="$OUT/re2_$(echo "$name" | tr ' /' '__').log"; timeout "$t" "$@" > "$f" 2>&1; local code=$?; line "RERUN2 $name | exit $code | FAIL lines $(grep -ac '^FAIL\|^ *FAIL ' "$f") | $(grep -aE 'passed|ALL PASS|FAIL|failed|Error' "$f" | tail -2 | tr '\n' ' ' | cut -c1-220)"; }
netstat -ano | grep ":3100 " | grep LISTEN | awk '{print $5}' | sort -u | while read pid; do taskkill //F //PID $pid >/dev/null; done
npm run build > "$TEMP/p34-build.log" 2>&1; line "BUILD exit $? $(tail -1 "$TEMP/p34-build.log")"
export FAKE_LOG="$(cygpath -w "$TEMP/p34-fake.log")"
(NODE_OPTIONS="--import=file:///C:/Users/moufi/Desktop/onlineconvertools/scripts/p34/fake-all-providers.mjs" npx next start -p 3100 > "$TEMP/p34-next.log" 2>&1 &)
sleep 12
run "seo-pages-29-09" 900 node scripts/browser-tests/seo-pages-29-09.mjs $O
run "prelancement-01-10" 900 node scripts/browser-tests/prelancement-01-10.mjs $O
run "qualite-29-09" 1500 node scripts/browser-tests/qualite-29-09.mjs $O
run "improvement-17" 900 node scripts/browser-tests/improvement-17.mjs $O
run "qr-paste-button" 600 node scripts/browser-tests/qr-paste-button.mjs $O
for b in chromium firefox webkit; do run "$b image-audit-2" 2400 node scripts/browser-tests/image-audit-2.mjs $O --browser=$b; run "$b p21 pdf-to-images" 900 node scripts/browser-tests/p21-pdf-to-images.mjs $O --browser=$b; done
run "webkit p24 dev-lot" 1500 node scripts/p24/dev-lot.mjs $O --browser=webkit --cors-shim
run "webkit p24 gif-lot" 1500 node scripts/p24/gif-lot.mjs $O --browser=webkit --cors-shim
run "chromium all-pages-load" 2400 node scripts/browser-tests/all-pages-load.mjs $O --browser=chromium
R="$TEMP/p33-review-redact"
for f in h1-toc-link-to-kept-page h2-checkbox-other-state h3-button-down-appearance h4-link-appearance; do run "redact-truth $f" 600 node scripts/p33/redact-truth.mjs $O --browser=chromium --pdf="$R/r3/$f.pdf" --terms=ZORGLUB-77; done
run "redact-truth site-fidelite Calibri" 600 node scripts/p33/redact-truth.mjs $O --browser=webkit --pdf=scripts/p27/pdfa-corpus/site-fidelite-01_docx.pdf --terms=Calibri
line "DONE rerun2"
