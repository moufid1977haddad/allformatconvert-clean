#!/usr/bin/env bash
# P37 — every PDF Redact check on the real page of a local production build, Chromium and WebKit (iPhone):
# box fit + Arabic layer, the reviewer's 21 fixtures, the 31 trap PDFs of P33 (with OCR), the reviewer's trap lists,
# the invisible text layer. Summary lines only.   bash scripts/p37/redact-final-bench.sh http://localhost:3137
O="$1"
T="$(cygpath -w "$TEMP")"
node scripts/p37/redact-box-fit.test.mjs --keep 2>/dev/null | tail -1
node scripts/p37/make-arabic-fixtures.mjs >/dev/null 2>&1
for b in "chromium" "webkit --device=iphone"; do
  echo "== real-page $b"; node scripts/p37/redact-real-page.mjs "$O" --browser=$b 2>&1 | grep -vE "^PASS" | grep -v "^$"
  echo "== review21 $b"; node scripts/p37/review/real-page-review.mjs "$O" --browser=$b 2>&1 | grep -vE "^PASS" | tail -3
done
for b in chromium webkit; do
  echo "== traps31 $b"; node scripts/p35/redact-bench.mjs "$O" --list=scripts/p35/traps.txt --root="$T\\p33-review-redact" --browser=$b --ocr 2>&1 | grep -E "PDFs|leak|ERROR|REFUSED|nomatch" | grep -vE "\] ok "
  for l in scripts/p37/review-traps.txt scripts/p37/review/traps-r2.txt scripts/p37/review/traps-r3.txt; do
    echo "== $l $b"; node scripts/p35/redact-bench.mjs "$O" --list=$l --root="$T\\p37-review-redact" --browser=$b --ocr 2>&1 | grep -vE "^\s*$"
  done
done
echo "== text-layer"
node scripts/p35/redact-text-layer.mjs "$O" --browser=webkit --device=iphone 2>&1 | tail -1
node scripts/p35/redact-text-layer.mjs "$O" --browser=chromium --device=desktop 2>&1 | tail -1
# F1 (relecture n° 4): lam-alef term with digits / wrapped, with a second term found elsewhere
for b in chromium "webkit --device=iphone"; do
  echo "== F1 $b"
  node scripts/p37/review/real-page-terms.mjs "$O" "$T\p37-review-redact\ar3\mixed.pdf" "مارس|السلام 2025" --browser=$b 2>&1 | tail -2
  node scripts/p37/review/real-page-terms.mjs "$O" "$T\p37-review-redact\ar3\wrap15.pdf" "مارس|السلام عليكم" --browser=$b 2>&1 | tail -2
  node scripts/p37/review/real-page-terms.mjs "$O" "$T\p37-review-redact\ar3\mixed2.pdf" "السلام 2025" --browser=$b 2>&1 | tail -2
done
# L1-L4 (relecture n° 5): Chromium presentation forms, tatweel -> redacted; Latin inside / wrapped -> refused
for b in chromium "webkit --device=iphone"; do
  echo "== L1-L4 $b"
  node scripts/p37/review/real-page-terms.mjs "$O" "$T\p37-review-redact\ar5\c-harakat.pdf" "مارس|المدير العام" --browser=$b 2>&1 | tail -2
  node scripts/p37/review/real-page-terms.mjs "$O" "$T\p37-review-redact\ar3\tatweel.pdf" "مارس|المدير العام" --browser=$b 2>&1 | tail -2
  node scripts/p37/review/real-page-terms.mjs "$O" "$T\p37-review-redact\ar5\c-latin.pdf" "مارس|شركة Microsoft" --browser=$b 2>&1 | tail -2
  node scripts/p37/review/real-page-terms.mjs "$O" "$T\p37-review-redact\ar5\c-wrap.pdf" "مارس|شهر أبريل" --browser=$b 2>&1 | tail -2
done
for b in chromium webkit; do for l in scripts/p37/traps-r4.txt scripts/p37/traps-r5.txt; do echo "== $l $b"; node scripts/p35/redact-bench.mjs "$O" --list=$l --root="$T\p37-review-redact" --browser=$b --ocr 2>&1 | grep -vE "^\s*$"; done; done
# relecture n° 6: C1 (/SMask /None), column-join false refusal, unreadable pages announced
C=scripts/audit/results/arabe-corpus/pdfs
for b in chromium "webkit --device=iphone"; do
  echo "== R6 $b"
  node scripts/p37/review/real-page-terms.mjs "$O" "$C/wiki-ar-oman.pdf" "ريال" --browser=$b 2>&1 | tail -2
  node scripts/p37/review/real-page-terms.mjs "$O" "$C/wb-ok-content.pdf" "zzqq" --browser=$b 2>&1 | tail -2
  node scripts/p37/review/real-page-terms.mjs "$O" "$C/emro-rc67.pdf" "2020" --browser=$b 2>&1 | tail -2
done
# relecture n° 7 (S1): term missed on a page that is redacted for another term -> refused
for b in chromium "webkit --device=iphone"; do
  echo "== S1 $b"
  node scripts/p37/review/real-page-terms.mjs "$O" "$T\p37-review-redact\ar5\s-wrap.pdf" "مارس|شهر أبريل" --browser=$b 2>&1 | tail -2
  node scripts/p37/review/real-page-terms.mjs "$O" "$T\p37-review-redact\ar5\s-latin.pdf" "مارس|شركة Microsoft" --browser=$b 2>&1 | tail -2
  node scripts/p37/review/real-page-terms.mjs "$O" "$T\p37-review-redact\ar3\s-lowrap.pdf" "مارس|شركة Microsoft" --browser=$b 2>&1 | tail -2
  node scripts/p37/review/real-page-terms.mjs "$O" "$T\p37-review-redact\ar3\s-lolatin.pdf" "مارس|شركة Microsoft" --browser=$b 2>&1 | tail -2
done
