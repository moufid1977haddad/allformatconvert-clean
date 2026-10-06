# P36 — rédaction, lot « convert-qr-math » (12 outils) — 06/10/2026

Base : audit `docs/audit/p36/audit/convert-qr-math.md` (85 défauts), fiche `docs/audit/p36/faits/convert-qr-math.json`,
consignes `CONSIGNES-REDACTION.md` (+ Précisions 06/10), gabarit §2-§3. Toutes les pages passent au format P36 :
About → Example (calcul/conversion) → How to (`howToTitle`) → `specs` → `privacy` → FAQ → Tips → Related.

## Contrôles (06/10, après la dernière modification)
- `node scripts/p36/content-verify.mjs --only=converter-tools/` : 4 pages, 4 réécrites, **0 défaut**
- `… --only=qr-barcodes-tools/` : 3 pages, 3 réécrites, **0 défaut**
- `… --only=math-tools/` : 6 pages, 6 réécrites (dont number-base-converter, lot dev-encode), **0 défaut** ;
  part maximale de phrases identiques entre pages réécrites du site : 14,3 % (paire hors lot)
- `node scripts/content-checks/instructions.mjs` : 225 pages, 1 742 libellés, **0 écart**
- `node scripts/content-checks/privacy-claims.mjs` : **0 échec**
- Incident : pendant la rédaction, `docs/audit/p36/preuves/audio.json` (autre lot) n'était pas du JSON valide et faisait
  planter content-verify pour tout le site ; j'ai vérifié mes pages avec une copie du script dans mon dossier de travail
  qui saute ce fichier. Le fichier a été corrigé depuis par son auteur : les passages finaux ci-dessus sont ceux du vrai script.

## Fichiers modifiés
Pour chacun des 12 outils : `layout.tsx` (title.absolute, description, openGraph.title/description seulement) et
`page.jsx` (props de `<SeoContent>` seulement — vérifié par `git diff -U0` : tous les blocs modifiés sont dans
`<SeoContent>`). Plus deux fichiers voisins qui portent l'objet `SEO` :
- `qr-barcodes-tools/barcode-generator/seo.js` et `math-tools/percentage-calculator/seo.js` : `title`, `description`,
  `faqs` (et `example` pour Percentage) retirés et réécrits en clair dans `layout.tsx` / `page.jsx`, car
  content-verify ne lit que des chaînes littérales (C1 « title not a plain string ») et les props de `<SeoContent>`
  (un `faqs={SEO.faqs}` comptait pour 0 FAQ). `SEO.related` reste la source des liens ; notes corrigées (Barcode :
  « QR Scanner » → « QR Code Scanner » ; Percentage : note Unit Converter « length, weight, temperature, speed, area and
  volume » → 12 catégories). `SEO.path` reste utilisé par les deux `layout.tsx` (canonical inchangé).
- **Aucune chaîne d'interface modifiée** (l'audit n'a trouvé aucune phrase FAUSSE dans l'interface de ces outils ; les
  défauts d'interface relevés — sous-titre « Advanced scientific calculator » GÉNÉRIQUE, invite « Click or drop a MOBI
  file here » qui ne nomme pas AZW/AZW3/PRC (prop `what` de `UploadPrompt`, `mobi-to-epub/page.jsx:375`) — ne sont pas
  FAUX et restent au propriétaire).
- `docs/audit/p36/preuves/convert-qr-math.json` : 11 preuves (chiffres avec unité écrits en dur), toutes vérifiées.
  Les autres chiffres sont calculés depuis les constantes (`${MAX_BATCH}`, `${MAX_LABELS}`, `${ALL.length}`,
  `${MIN_SIZE}`, `${MAX_SIZE}`, `${MAX_LOGO_BYTES / 1024 / 1024}`).

## Exemples exécutés
Commande : `node ex1.mjs` (dossier de travail de la session, non versionné). Le script importe les bibliothèques réelles
(`app/lib/exactNumbers.js`, `mathTools.js`, `qrPayload.js`, et `barcode-generator/render.js` + `symbologies.js`
copiés en `.mjs` avec le seul chemin d'import corrigé) ; pour Color Converter et Unit Converter, dont les fonctions
vivent dans `page.jsx`, il évalue les lignes mêmes du fichier (`color-converter/page.jsx:10-77`,
`unit-converter/page.jsx:15-55`) avec `new Function`, sans les recopier. Percentage Calculator : les expressions des
six panneaux (`page.jsx:35-86` avant réécriture, inchangées) recopiées telles quelles avec `formatSignificant` importé.
Toutes les sorties citées dans les blocs `example` et dans les FAQ (ex. 2^60 → 1152921504610000000, 10 → −5 = −150 %,
Q3 exclusif 6,5, 1 GiB = 1073.741824 MB, charge Wi-Fi `WIFI:T:WPA;S:Cafe Wi-Fi;P:tea\;time;;`) sont celles de ce script.
Pas d'exemple pour Currency Converter (taux du jour : un chiffre serait faux le lendemain), MOBI to EPUB (fichier, aucun
résultat mesuré daté dans le dépôt), QR Code Scanner (image). Barcode Generator : exemple écrit (expectedRead) puis
retiré pour rester sous ~770 mots ; la FAQ garde le fait.

## Par outil
Mots = texte SEO visible estimé depuis le source (avant : `seoWords` de contenu-avant.json, sur www).

| Outil | Titre (car.) | Méta (car.) | Mots avant → après |
|---|---|---|---|
| color-converter | Color Converter — HEX, RGB, HSL, HSV & CMYK with Alpha (54) | 143 | 436 → ~660 |
| currency-converter | Currency Converter — Daily Rates and 10-Year Rate History (57) | 149 | 520 → ~620 |
| mobi-to-epub | MOBI to EPUB Converter — Also AZW3, AZW and PRC, No Upload (58) | 145 | 468 → ~575 |
| unit-converter | Unit Converter — 12 Categories with Exact Factors (49) | 141 | 398 → ~640 |
| barcode-generator | Barcode Generator — 37 Types: EAN-13, UPC, Code 128, SVG/PDF (60) | 142 | 928 → ~770 |
| qr-generator | QR Code Generator — URL, Wi-Fi, vCard, Logo; PNG, SVG, PDF (58) | 149 | 510 → ~695 |
| qr-scanner | QR Code Scanner — Camera, Photo or Screenshot; Barcodes Too (59) | 144 | 476 → ~585 |
| fraction-calculator | Fraction Calculator — Mixed Numbers, Steps, Exact Decimals (58) | 146 | 398 → ~640 |
| percentage-calculator | Percentage Calculator — % of, % Change, % Difference (52) | 143 | 782 → ~690 |
| roman-numeral-converter | Roman Numeral Converter — 1 to 3999, Standard Form Only (55) | 150 | 287 → ~440 |
| scientific-calculator | Scientific Calculator — Degrees or Radians, log, ln, n!, Ans (60) | 146 | 368 → ~615 |
| statistics-calculator | Statistics Calculator — SD, Quartiles, Skewness, Outliers (57) | 145 | 383 → ~650 |

Défauts de l'audit supprimés (renvoi aux lignes de l'audit) — tous les 85 traités ; les principaux :
- **color** : titre/méta sans HSV/CMYK (FORMAT) ; « most online converters », « most design tools » (INVÉRIFIABLE) retirés ;
  FAQ gratuité et astuce banale supprimées.
- **currency** : « 24 Major World » (FAUX) → 166 avec la date du relevé (RAPPORT-licence §5) ; « currencies never sent »
  (FAUX) → `privacy` dit que les deux codes vont à api.frankfurter.dev ; « each with its full name » nuancé (noms du
  navigateur) ; « every currency with a published daily rate » retiré.
- **mobi-to-epub** : « standards-compliant », « reliably », « opens in standard e-reader apps » retirés ; nouvelle FAQ
  qui dit que l'OPF n'a pas `dcterms:modified` ; détection MOBI6/KF8 décrite comme le code le fait (extension puis repli) ;
  DRM « non détecté » ; specs avec « None set by the page » pour la taille.
- **unit** : « Six Categories » (FAUX) → 12 ; étape 1 avec Fuel economy ; ligne de facteur « sauf température et
  consommation » ; astuce Kelvin incomplète remplacée.
- **barcode** : « Every code is scanned back » → limité aux types lisibles, les 5 non relus nommés en FAQ ; résolution
  « written in » du GIF (FAUX) → « GIF does not » ; libellés « Many (ZIP or labels) », « Generate Barcode » etc. ;
  limite CSV de 5 MB dite ; `privacy` mentionne le message d'erreur de lot qui peut citer des valeurs.
- **qr-generator** : « Instantly », « Any Text », « Unlike most generators », « the way a phone camera does »,
  « phones join the network » retirés ; relecture décrite sur le dessin PNG ; PDF « Rounded → carrés » et logo PNG ≤ 512 px dits.
- **qr-scanner** : « Decode Any QR Code Image », « instantly » retirés ; codes-barres dans titre et méta ; liste des formats
  complétée (Code 93, Codabar) ; FAQ « install software » et gratuité supprimées.
- **fraction** : titre sans « divides » corrigé ; « × ou ÷ » → boutons « * » « / » ; FAQ « first 100 digits » reformulée
  (période coupée après 100 chiffres).
- **percentage** : « exact results » (FAUX) retiré ; FAQ « computes change, not difference » (FAUX) remplacée ;
  « three panels » ×3 (FAUX) → six ; « never below −100 % » (FAUX) → FAQ qui donne −150 % ; formule avec |X|.
- **roman** : FAQ 2 et astuce 4 (FAUX : « IIII accepté ») → validation stricte ; titre coupé et About d'une phrase refaits.
- **scientific** : titre coupé refait ; « scientific notation for very large results » (TROMPEUR) → seuil 1e21 avec
  l'exemple 2^60.
- **statistics** : titre coupé refait ; « — with the reason » (FAUX) → seulement pour moyennes géo/harmo, quartiles,
  asymétrie, kurtosis ; « any entry listed » → les cinq premières ; `privacy` dit que le message d'erreur part ;
  séparateur point-virgule ajouté.

## Points laissés de côté ou à surveiller
- Currency : les noms absents (FOK, KID…) ont été mesurés avec l'ICU de Node 24, pas dans un navigateur : la page dit
  « in some browsers ». Le chiffre 166 dépend de l'API (relevé du 23/09, rapport cité).
- MOBI : effet réel d'un fichier DRM non mesuré (« may fail or come out unreadable »).
- Barcode : le « 37 » du titre et de la méta est écrit en dur dans `layout.tsx` (content-verify exige une
  chaîne simple) ; il faudra le changer à la main si la liste des types change (`symbologies.js`).
- Le propriétaire pourrait corriger dans l'interface (hors de mon droit, pas FAUX) : l'invite de MOBI to EPUB qui ne
  nomme que MOBI, et le sous-titre « Advanced scientific calculator ».

## Corrections après relecture (06/10)

Relecture : `docs/audit/p36/relecture/convert-qr-math.md`, 30 défauts. **Tous acceptés après vérification dans le code ;
aucun contesté.** Une précision : pour D-CU3 (« 8 of the 166 » sans rapport daté), un rapport daté existe —
`docs/audit/RAPPORT-p25-decisions-03-10.md:30-32` (« Couverture mesurée : 158 de nos 166 devises », 03/10) ; la page le
date donc « when we checked on October 3, 2026 », et le 166 de la méta est retiré (« world currencies »).

| Défaut | Correction |
|---|---|
| D-QR1 | `qr-generator/page.jsx` example : `P:tea\;time` ; la chaîne évaluée est égale à `buildPayload(...)` (vérifié en Node : `true`). |
| D-BC1 | étape 3 : « "Module width", "Resolution (dpi)", "Bar height" and "Rotation" » (Rotation est dans Size, `page.jsx:354-355`). |
| D-BC2 | méta + OG : « as PNG or as SVG, PDF and EPS at the exact print size » (145 car.). |
| D-BC3 | **chaîne d'interface** `barcode-generator/page.jsx:264` : « Every code is scanned back before you download it. » → « Codes of the {ALL.filter((s) => s.zxing).length} types a browser reader can decode are scanned back before you download them. » (32 de 37, calculé). |
| D-BC4 | FAQ 1 : Code 11 « its C check digit (and K over 10 characters) » ; preuve C3 ajoutée (`symbologies.js`, indice de Code 11). |
| D-BC5 | « millimeters ». |
| D-CU1 | specs Amount : « amounts and results below 1 show up to four significant digits instead of 0.00 » (`page.jsx:22-29`). |
| D-CU2 | FAQ 1 commence par « The rates change once a day: … ». |
| D-CU3 | méta sans chiffre ; specs History et FAQ 4 datés du 3 octobre 2026 (rapport ci-dessus). |
| D-CU4 | « read one point, a day, or a week or a month on 5Y and 10Y » (`RateHistory.jsx:13`). |
| D-CU5 | astuce : liste des devises les plus utilisées, sinon changer « To ». |
| D-CU6 | **chaîne d'interface** `currency-converter/RateHistory.jsx:140` : « the live rate above » → « the daily rate above ». |
| D-MO1 | astuce : « MOBI to PDF reads the same .mobi, .azw and .azw3 files, but not .prc » (`mobi-to-pdf/page.jsx:250`). |
| D-FR1 | FAQ 4 : un 0 dans la case dénominateur donne aussi Cannot divide by zero ; seule une fraction tapée dans une case (1/0) est citée dans l'erreur (vérifié `page.jsx:25`, `mathTools.js:151,170`). |
| D-CC1, D-UC1, D-PC1, D-DUP | les trois `privacy` réécrites, chacune propre à l'outil (formats / facteurs / six panneaux) ; plus de « no error reports » : elles disent que le filet d'erreurs (`app/tools/ToolErrorWatch.jsx`, `app/error.jsx`) peut envoyer le message nettoyé, le nom de l'outil et le nom et la version majeure du navigateur (`app/lib/reportError.js:134-144`). |
| D-DATE | 8 légendes : « run in Node on October 6, 2026 ». |
| D-QS1 | specs et astuce : seules les images de plus de 12 mégapixels sont réduites (`qr-scanner/page.jsx:68`). |
| D-UC2 | specs « Some of the units », avec Pa to MPa, mbar, J to MJ. |

Appliqué aussi, d'après les « Précisions pour les corrections après relecture » :
- phrases de fin bannies retirées des About (« The conversion runs in your browser. », « It all runs… », « It runs… »,
  « Everything is worked out… », « …the work is done in your browser », « All of it is calculated… », « The calculations
  run… », « everything runs in your browser ») et remplacées par un fait propre à l'outil ;
- toutes les mentions de rapport d'erreur (currency, mobi, barcode, qr-generator, qr-scanner, fraction, roman,
  scientific, statistics) disent ce qui part : message nettoyé, nom de l'outil, nom et version majeure du navigateur ;
  plus de « only the message » ;
- MOBI étape 3 réécrite (plus de « click "Download" to save the … file »).

Chaînes d'interface modifiées (total) : `barcode-generator/page.jsx:264` (sous-titre), `currency-converter/RateHistory.jsx:140`.

Contrôles après corrections : content-verify converter-tools 4/4, qr-barcodes-tools 3/3, math-tools 6/6 réécrites,
**0 défaut** ; instructions.mjs **0 écart** (un passage intermédiaire a montré 1 écart venu d'un autre lot en cours
d'écriture, disparu au passage suivant) ; privacy-claims **0 échec** ; preuves : 12, toutes trouvées.
Bugs de code (non corrigés, plan) : aucun nouveau relevé par la relecture dans ce lot.

### Textes d'interface corrigés (consigne ajoutée le 06/10 : textes invérifiables ou trompeurs)
Liste complète des chaînes d'interface modifiées dans ce lot (aucun libellé de bouton, aucune logique) :
1. `qr-barcodes-tools/barcode-generator/page.jsx:264` — « Every code is scanned back before you download it. » →
   « Codes of the {ALL.filter((s) => s.zxing).length} types a browser reader can decode are scanned back before you download them. » (faux pour 5 des 37 types).
2. `converter-tools/currency-converter/RateHistory.jsx:140` — « …differ slightly from the live rate above. » → « …from the daily rate above. »
3. `converter-tools/mobi-to-epub/page.jsx:372` (sous-titre) — « Convert MOBI ebooks to EPUB format » → « Convert DRM-free MOBI, AZW, AZW3 and PRC ebooks to EPUB ».
4. `converter-tools/mobi-to-epub/page.jsx:375` (invite de la zone de dépôt, prop `what` d'UploadPrompt) — « a MOBI file » →
   « a MOBI, AZW, AZW3 or PRC file » (le sélecteur accepte `.mobi,.azw,.azw3,.prc`, `page.jsx:376`).
5. `math-tools/scientific-calculator/page.jsx:115` (sous-titre) — « Advanced scientific calculator » → « Degrees or radians, log and ln, powers, factorials, Ans and memory ».
6. `math-tools/percentage-calculator/page.jsx:26` (sous-titre) — « Calculate percentages easily » → « Six percentage calculations that update as you type ».
7. `qr-barcodes-tools/qr-generator/page.jsx:111` (sous-titre) — « Every code is scanned back before you download it. » →
   « The PNG drawing is scanned back before you can download the files. » (SVG et PDF ne sont pas relus, `app/lib/qrRender.js:117-136`).
8. `qr-barcodes-tools/qr-scanner/page.jsx:159` (sous-titre) — « Scan QR codes with your camera or from an image » →
   « Scan QR codes with your camera, or QR codes and barcodes from an image » (zxing lit tous ses formats dans une image, `scan.worker.js:12`).
Les autres sous-titres et messages du lot ont été relus : vrais, laissés tels quels.

## Corrections après deuxième passe (06/10)

| Défaut | Correction |
|---|---|
| D2-1 | Color About, dernière phrase : « …with nothing to install » (générique, formules non affichées) → « The page derives all five notations from one RGB value, so a HEX code typed with transparency keeps its alpha in rgba() and hsla() as well. » (`page.jsx:81-110`). |
| D2-2 | Color méta + OG : « Runs in your browser. » → « …see its WCAG grade as text on white and black, with a Copy button per format. » (152 car.). |
| D2-3 | QR Scanner méta + OG : « Decoded in your browser. » → « …up to 20 in one picture, read on your device. » (140 car.). |
| D2-4 | Unit et Percentage `privacy` : phrases distinctes (« Should the converter crash, … never the value or the units you chose » / « A crash of the calculator is reported … never the numbers in the six panels »). |
| D2-5 | **chaîne d'interface** `barcode-generator/symbologies.js:24` (indice Code 128) : « Any text (ASCII). The most widely used general-purpose barcode. » → « Any text (ASCII), with letters, digits and symbols. » |
| D2-6 | déjà corrigé avant la deuxième passe : `mobi-to-epub/page.jsx:375` `what="a MOBI, AZW, AZW3 or PRC file"`. |

**Liste complète des chaînes d'interface modifiées dans ce lot (toutes phases) :**
1. `qr-barcodes-tools/barcode-generator/page.jsx:264` — sous-titre : « Every code is scanned back… » → « Codes of the {32} types a browser reader can decode are scanned back before you download them. »
2. `qr-barcodes-tools/barcode-generator/symbologies.js:24` — indice Code 128 (ci-dessus).
3. `converter-tools/currency-converter/RateHistory.jsx:140` — « live rate above » → « daily rate above ».
4. `converter-tools/mobi-to-epub/page.jsx:372` — sous-titre → « Convert DRM-free MOBI, AZW, AZW3 and PRC ebooks to EPUB ».
5. `converter-tools/mobi-to-epub/page.jsx:375` — invite de dépôt → « a MOBI, AZW, AZW3 or PRC file ».
6. `math-tools/scientific-calculator/page.jsx:115` — sous-titre → « Degrees or radians, log and ln, powers, factorials, Ans and memory ».
7. `math-tools/percentage-calculator/page.jsx:26` — sous-titre → « Six percentage calculations that update as you type ».
8. `qr-barcodes-tools/qr-generator/page.jsx:111` — sous-titre : « Every code is scanned back… » → « The PNG drawing is scanned back before you can download the files. »
9. `qr-barcodes-tools/qr-scanner/page.jsx:159` — sous-titre → « Scan QR codes with your camera, or QR codes and barcodes from an image ».

Contrôles : content-verify converter-tools 4/4, qr-barcodes-tools 3/3, math-tools 6/6, **0 défaut** ; instructions.mjs
**0 écart** ; privacy-claims : **0 échec sur mes outils** (2 échecs au moment du passage, sur ai-tools/image-captioner et
ai-tools/text-summarizer, lot « ai »).
