#!/usr/bin/env bash
# P37 — rebuild every PDF Redact review fixture under %TEMP% (they were lost when %TEMP% was wiped on 06/10 ~21:05).
# Needs LibreOffice (soffice), Tesseract, Playwright. Run from the repo root:  bash scripts/p37/review/regen-fixtures.sh
# NOT regenerable: the 31 P33 trap PDFs of %TEMP%\p33-review-redact (their makers lived in %TEMP% too); only
# r6/smask-none.pdf is rebuilt here.
set -e
mkdir -p "$TEMP/p37-review-redact"
git show 3324ed50:app/lib/pdfRedact.js > "$TEMP/p37-review-redact/pdfRedact.head.mjs"
node scripts/p37/make-arabic-fixtures.mjs
node scripts/p37/redact-box-fit.test.mjs --keep
node scripts/p37/make-smask-none.mjs
node scripts/p37/review/fit-adversarial.mjs; RED=1 node scripts/p37/review/fit-adversarial.mjs
node scripts/p37/review/ocr-scan.mjs && node scripts/p37/review/ocr-variants.mjs
RED=1 node scripts/p37/review/ocr-scan.mjs && RED=1 node scripts/p37/review/ocr-variants.mjs
node scripts/p37/review/make-arabic-two-pages.mjs
M=scripts/p37/review/make-arabic-pages.mjs
node $M salam "قال سلام للجميع في الاجتماع" "زارنا سالم أمس في المكتب"
node $M rab "يا رب احفظنا" "عنوان البريد والشركة"
node $M one "قال سلام للجميع/زارنا سالم أمس/السلام عليكم ورحمة الله وبركاته"
node $M mixed "تقرير شهر مارس الماضي" "رسالة السلام 2025 للجميع"
node $M mixed2 "رسالة السلام 2025 للجميع"
node $M tatweel "تقرير شهر مارس الماضي" "قال المديــر العام كلمته"
node $M lo-latin-wrap "تقرير شهر مارس الماضي" "اجتماع شركة/Microsoft في الرياض"
node $M s-lowrap "تقرير شهر مارس الماضي/اجتماع شركة/Microsoft في الرياض"
node $M s-lolatin "تقرير شهر مارس الماضي/اجتماع شركة Microsoft Azure في الرياض"
node $M s-tatweel "تقرير شهر مارس الماضي/قال المديــر العام كلمته"
node $M s-mixed-lo "تقرير شهر مارس الماضي/رسالة السلام 2025 للجميع"
for n in 10 11 12 13 14 15 16; do fill=$(for i in $(seq 1 $n); do printf 'كلمة '; done); node $M wrap$n "تقرير شهر مارس الماضي" "${fill}${fill}${fill}السلام عليكم ورحمة"; done
C=scripts/p37/review/make-chrome-arabic.mjs
node $C c-wrap Arial "تقرير شهر مارس الماضي" "وصل الوفد في شهر/أبريل إلى الرياض"
node $C c-mixed Arial "تقرير شهر مارس الماضي" "رسالة السلام 2025 للجميع"
node $C c-latin Arial "تقرير شهر مارس الماضي" "اجتماع شركة Microsoft Azure في الرياض"
node $C c-harakat Arial "تقرير شهر مارس الماضي" "قَالَ المُدِيرُ العَامُّ كَلِمَتَهُ"
node $C s-latin Arial "تقرير شهر مارس الماضي//اجتماع شركة Microsoft Azure في الرياض"
node $C s-wrap Arial "تقرير شهر مارس الماضي//وصل الوفد في شهر/أبريل إلى الرياض"
node $C s-harakat Arial "تقرير شهر مارس الماضي//قَالَ المُدِيرُ العَامُّ كَلِمَتَهُ"
node $C s-mixed Arial "تقرير شهر مارس الماضي//رسالة السلام 2025 للجميع"
echo "fixtures rebuilt"
