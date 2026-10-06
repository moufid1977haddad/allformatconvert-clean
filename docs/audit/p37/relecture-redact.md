# P37 lot 2 — Relecture indépendante de PDF Redact (commit dbf86202)

Date : 06/10/2026. Relecteur indépendant (je n'ai pas écrit ce code). Aucun code app/ modifié, aucun build, aucun serveur, aucune requête externe.
Scripts de relecture : `scripts/p37/review/`. Fixtures et sorties : `%TEMP%\p37-review-redact\`.
Comparaison « HEAD » = `app/lib/pdfRedact.js` du commit 3324ed50 (P35), copié dans `%TEMP%\p37-review-redact\pdfRedact.head.mjs`.

## Verdict : NO-GO en l'état. GO dès que D1 est corrigé (D2 conseillé dans le même lot). D4 est préexistant mais à planifier avant d'annoncer l'arabe.

D1 est une régression : une fuite visible et silencieuse, sur le chemin que l'outil recommande lui-même (« run PDF OCR first »).

## 1. Tests de l'auteur, relancés
- `redact-box-fit.test.mjs` : 15/15 PASS (identique au rapport).
- `redact-arabic-layer.test.mjs` : 4/4 fixtures notées PASS.
- `redact-traps-node.mjs --ocr` (31 pièges) : 31 « ok », 0 fuite OCR. Seul signal : r2/g5 « raw » (faux positif connu `/Registry (Adobe)`).

## 2. Mes fixtures (`scripts/p37/review/fit-adversarial.mjs`)
Même méthode que box-fit : même flux, mode de rendu changé, encre vraie dessinée par Poppler à 288 dpi. HEAD calculé sur le même fichier.

| Fixture | Nouveau : encre non couverte | HEAD |
|---|---|---|
| stroke-tr2-w2-24 (contour 2 pt, 24 pt) | **17 px** | 0 |
| stroke-tr1-w3-36 (contour 3 pt, 36 pt) | **48 px** | 0 |
| stroke-tr2-w1-12 (faux gras Word) | 0 | 0 |
| negative-font-size (Tf -14) | 0 (repli élargi) | 0 |
| flipped-ctm-generator, shear-synthetic-italic, shadow-offset-2pt, fake-bold-double-0.4, tz-300-tc-neg, rise-inside-match | 0 | 0 |
| type0-narrow-widths (/W 250), type0-accents-stacked (ỄỂỆ), ligature-calibri, italic-ttf-overhang (Times Italic fjfjf) | 0 | 0 |
| type3-overhang (encre 25 % hors avance) | **300 px (2,8 %)** | 0 |
| type3-big-matrix-size1 | 0 | 0 |

Couche invisible : aucun mot partiel, aucun terme dans pdftotext sur ces 16 fixtures.

## 3. Défauts

### D1 — ÉLEVÉE, régression : PDF passé à l'OCR, les jambages du mot restent visibles
- Repro : `node scripts/p37/review/ocr-scan.mjs`. La page vectorielle est rastérisée à 300 dpi (le « scan »), puis Tesseract crée le PDF image + texte invisible (la même couche que notre PDF OCR, GlyphLessFont).
  - « photography » (Times 12) : **126 px non couverts, 94,31 %**. HEAD : 100 %.
  - « graph » dans « photography » : 72 px non couverts, 93,31 %. HEAD : 100 %.
  - Image : `%TEMP%\p37-review-redact\ocr-times12-painted.png`. Les queues de p, g, p, y dépassent sous la boîte noire. La forme du mot reste lisible en partie.
  - Pas de signal : statut « ok », pdftotext propre. Seuls les pixels fuient.
- Cause : la boîte suit les glyphes **invisibles** (Tr 3), pas l'encre du scan. `glyphsOfOperatorList` (pdfRedact.js l. 222-256) ignore `OPS.setTextRenderingMode`. GlyphLessFont a une descente de -0,0005 em. `glyphRects` (l. 325) la ramène à -0,1 em. L'« encre » du glyphe vide vaut [0, 0, 0,5, 1] (l. 329-331). Boîte = -1,1 pt à 11 pt, alors que les jambages descendent à -2,6 pt. Même chose en navigateur (`measureText` du même glyphe, mêmes ascent/descent).
- Correctif : suivre le mode de rendu dans `glyphsOfOperatorList`. Un glyphe en mode 3 (invisible) a une encre inconnue : `pad: true` dans `itemChars` / `exactBox` (l. 499) et branche élargie dans `glyphTermQuads` (l. 371). Ainsi on retrouve l'ancienne marge (15 % de côté, -0,3 à 1,05 em). Ajouter cette fixture OCR à `redact-box-fit.test.mjs` et à `redact-real-page.mjs`.

### D2 — MOYENNE-FAIBLE, régression : texte en contour à trait épais
- Repro : `node scripts/p37/review/fit-adversarial.mjs --only=stroke-tr1-w3-36` (48 px). Image : `%TEMP%\p37-review-redact\stroke-painted.png` (liseré sous le « p »).
- Cause : en mode 1, 2, 5 ou 6, l'encre dépasse le contour du glyphe de lineWidth/2. La marge vaut max(2 %, 1 px). `OPS.setLineWidth` et `Tr` ne sont pas suivis (l. 222-256).
- Correctif : en mode trait, ajouter lineWidth/2 (multiplié par l'échelle du CTM) à la marge, dans `exactBox` et dans `glyphTermQuads`.

### D3 — FAIBLE, régression : police Type 3 dont l'encre dépasse l'avance de plus de 15 % em
- Repro : `fit-adversarial.mjs --only=type3-overhang` (300 px). Cas réels possibles : polices bitmap TeX, italiques Type 3 de Matplotlib.
- Cause : `inkOf` renvoie null pour le Type 3. Chaque glyphe reçoit seulement 15 % de marge (l. 499, l. 371). HEAD couvrait le run entier.
- Correctif : encre Type 3 = `font.bbox` × `fontMatrix` (ou les bornes d1 de chaque glyphe). Sinon, run entier comme avant.

### D4 — ÉLEVÉE, PRÉEXISTANTE (P33, pas introduite par dbf86202) : mots arabes avec lam-alef jamais trouvés
- PDF.js lit « السالم » pour « السلام », et « االجتماع » ou « هللا » (LibreOffice Arial). pdftotext lit juste.
- `matchSpans` : 0 correspondance pour السلام, الاجتماع, سلام. Le filet `glyphTermQuads` : 0 aussi. La botte de foin y garde « لا » dans l'ordre logique au milieu de l'ordre du dessin (l. 353, 358). « الله » n'est trouvé que par le filet, et seulement sur une page déjà touchée par un autre terme.
- Conséquences :
  1. Terme seul : « No match found for “السلام” », alors que le mot est dans le texte du fichier.
  2. **Fuite silencieuse** : `node scripts/p37/review/make-arabic-two-pages.mjs`, puis `node scripts/p37/review/arabic-terms.mjs %TEMP%\p37-review-redact\ar2\two-pages.pdf "مارس|السلام"`. Résultat : statut **ok**, fichier livré, **pdftotext lit « السلام »**. La page 2 est copiée telle quelle. `verifyRedacted` (PDF.js) ne le voit pas.
  3. Même page : le mot reste visible sur l'image. La couche le retire (`textLayerWords` le retrouve dans le texte corrigé, l. 590-595). Le résumé compte 1 occurrence.
- Correctif : chercher aussi la variante de PDF.js (chaque « لا » inversé en « ال », over-redaction = côté sûr). À faire dans `matchSpans`, dans `verifyRedacted` et pour les annotations. Dans `glyphTermQuads`, ajouter une botte de foin où le texte d'un glyphe à plusieurs caractères est inversé pour les runs RTL.
- À traiter avant d'annoncer « Arabic included » au-delà de la couche de texte.

### D5 — À VÉRIFIER EN NAVIGATEUR : police non incorporée « remeasure »
- PDF.js centre un glyphe plus large que son avance (/Widths) : il dépasse de (largeur mesurée - avance)/2 de chaque côté (pdf.mjs l. 11871-11882). L'encre est inconnue, d'où 15 % par glyphe. Si /Widths ≤ ~70 % du glyphe de remplacement (police étroite non incorporée), un glyphe du milieu déborde. HEAD couvrait le run entier.
- Non testable avec Poppler (il ne centre pas). Correctif : marge max(15 %, débordement), ou run entier pour `font.remeasure`.

### D6 — TRÈS FAIBLE : run RTL palindrome
- `itemChars` essaie d'abord l'ordre du dessin (l. 430). Si le texte d'un run RTL se lit pareil dans les deux sens, les caractères sont reliés en miroir. Une correspondance partielle serait alors noircie du mauvais côté.
- Correctif : pour un run RTL, essayer d'abord les ordres inversés.

## 4. Points vérifiés sans défaut
- Taille de police négative : le run n'est pas relié (exact 0), donc repli élargi. Couvert à 100 %.
- Ombre et double impression (faux gras) : le texte et les glyphes ne collent plus, donc repli élargi. Les deux copies sont trouvées et noircies.
- Ligature « ffi » à cheval sur la limite : tout le glyphe est noirci.
- Couche invisible arabe : « مارس », « 1250 », « Microsoft » et « ارس » sont absents de pdftotext, de `-layout` et des flux bruts. Aucun mot partiel. La ToUnicode partagée ne porte que des caractères isolés.
- Replis : délai de 20 s pour les glyphes, puis boîtes élargies (côté sûr). Échec de la police arabe : dit dans le résumé. Page dessinée par le service : encre inconnue, donc marge élargie.

## 5. À ajouter aux bancs du contrôleur (vraie page)
- Fixture OCR (D1) : `%TEMP%\p37-review-redact\ocr\times12-ocr.pdf`, terme « photography ». Attendu après correctif : 100 % de l'encre du scan couverte.
- `%TEMP%\p37-review-redact\fit\stroke-tr1-w3-36-full.pdf` et `type3-overhang-full.pdf`, terme « photo-2 ».
- `%TEMP%\p37-review-redact\ar2\two-pages.pdf`, termes « مارس » et « السلام » (D4).
