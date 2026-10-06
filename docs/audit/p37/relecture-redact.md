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

---

# Relecture n° 2 — commit 9cdaf2a5 (corrections D1-D6, canvasInk)

Date : 06/10/2026. Même rôle, mêmes règles. Vraie page : build de production sur http://localhost:3137 (servi par le contrôleur, je ne l'ai ni lancé ni arrêté).
Nouveaux scripts : `scripts/p37/review/ocr-variants.mjs`, `real-page-review.mjs`, `canvas-ink-fallback.mjs`, `traps-r2.txt`. `fit-adversarial.mjs`, `ocr-scan.mjs` et `ocr-variants.mjs` acceptent `RED=1` (texte rouge, pour juger le noir sur la vraie page).

## Verdict : GO avec conditions

D1 à D6 sont corrigés et vérifiés, en Node et sur la vraie page (Chromium et WebKit iPhone). Avant la mise en ligne, il faut corriger N1 et N2 : ce sont deux petits correctifs, sur la même famille que D1. N4 est préexistant : à planifier avant d'annoncer l'arabe.

## 1. Corrections vérifiées
| Défaut | Ma preuve | Résultat |
|---|---|---|
| D1 couche OCR (mode 3) | `ocr-scan.mjs` (Node) ; `real-page-review.mjs` ocr-times12, ocr-times12-sub | 100 % couvert en Node. Vraie page : 0 px non noir en Chromium et en WebKit iPhone |
| D2 contour | stroke-tr2-w2-24, stroke-tr1-w3-36, stroke-tr2-w1-12 | 0 px, en Node et sur la vraie page (2 moteurs) |
| D3 Type 3 | type3-overhang, type3-bbox-zero (nouvelle) | 0 px (FontBBox nulle : ligne entière) |
| D4 lam-alef, un mot | `arabic-terms.mjs two-pages.pdf "مارس" + "السلام"` ; bench vraie page `traps-r2.txt` | pdftotext : « السلام » absent. Vraie page : ok, 0 fuite |
| D5, D6 | `redact-review-fixes.test.mjs` | 10/10 PASS |

- Non-régression : box-fit 15/15. Arabe 4/4. 31 pièges avec `--ocr` : 31 ok (seul signal : r2/g5, connu). Mes 19 fixtures en Node : 18 PASS (seul échec : N3).
- `redact-real-page.mjs` sur localhost:3137 en Chromium : 15/15 boîtes et 4/4 arabe PASS. Les 3 échecs vus sur dbf86202 sont corrigés (canvasInk).
- Mode suivi à travers q/Q et formulaires : le mode fait partie de l'état empilé (`push`/`pop`), comme dans le PDF. Tr 7 est traité comme invisible (marge élargie, côté sûr). Fixture form-sets-tr3-then-visible : PASS.

## 2. Nouveaux défauts

### N1 — MOYENNE (même famille que D1, non couverte) : texte OCR caché autrement que par le mode 3
- Repro : `node scripts/p37/review/ocr-variants.mjs` après `ocr-scan.mjs` (avec `RED=1` pour la vraie page). Même couche Tesseract, cachée autrement :
  - « under-image » : texte en mode 0, dessiné AVANT le scan, que l'image opaque recouvre (mode « texte sous l'image » de certains logiciels d'OCR et scanners) ;
  - « alpha-0 » : texte en mode 0 avec un ExtGState `/ca 0`.
- Résultat : 105 px de l'encre du mot non noircis, sur la vraie page, en Chromium ET en WebKit iPhone (94,7 %). Les queues des jambages sont visibles. Statut « ok », aucun signal. HEAD P35 : 100 %.
- Cause : `glyphsOfOperatorList` ne regarde que `Tr`. Les cas « opacité de remplissage 0 » et « image peinte plus tard par-dessus » laissent `invisible = false`, d'où une boîte serrée sur des glyphes que personne ne voit.
- Correctif : (1) suivre `ca` dans `setGState`, et traiter `ca == 0` comme invisible ; (2) marquer invisible un glyphe recouvert par une image peinte après lui (`paintImageXObject`, `paintInlineImageXObject`, `paintImageMaskXObject`… dont le rectangle, par le CTM courant, contient le glyphe). Variante plus simple : sur une page qui peint une image après du texte, garder l'ancienne marge pour ce texte.
- À confirmer sur un vrai PDF « texte sous l'image » (ABBYY, scanner multifonction) : je n'en ai pas.

### N2 — FAIBLE-MOYENNE : canvasInk mesure avec une police de repli sans le dire
- Repro : `node scripts/p37/review/canvas-ink-fallback.mjs --browser=chromium` (et `webkit`). Pour une face non chargée (`g_d0_f9`), canvasInk ne renvoie pas null. Il renvoie l'encre de la police de repli : caractère privé → [0,12, -0,01, 0,66, 0,64] en Chromium, et une autre boîte en WebKit.
- Quand : PDF.js met `font.disableFontFace = true` quand le navigateur refuse la police (pdf.mjs l. 7850-7851). Il dessine alors le glyphe comme un chemin (l. 11674), avec sa vraie forme. La mesure, elle, porte sur un autre glyphe. L'encre réelle (dépassement italique, accent haut) peut sortir de la boîte. Pour une police re-mesurée, l'avance mesurée (5e valeur) est fausse aussi : le décalage D5 est alors mal calculé.
- La version dbf86202 exigeait que la face soit chargée (`loadedFaces.has(loadedName)`). Cette garde a disparu.
- Aussi : un dessin vide (`x1 < 0`) donne une encre nulle acceptée (`canvasInk`). Un canvas épuisé (mémoire sur iPhone) produirait cela pour chaque glyphe.
- Correctif : renvoyer null si `font.disableFontFace`, ou si la face (`loadedName`, hors police système) n'est pas dans `document.fonts` à l'état « loaded ». Renvoyer null aussi pour un dessin vide d'un caractère qui n'est pas un espace.

### N3 — FAIBLE : Type 3 dont la /FontBBox est fausse (non nulle mais trop petite)
- Repro : `fit-adversarial.mjs --only=type3-bbox-too-small`. Node : 800 px non couverts. Vraie page : 850 px, en Chromium et en WebKit.
- Cause : la FontBBox est prise pour vraie (`glyphRects`, branche Type 3). Une boîte nulle donne la ligne entière, mais une boîte fausse non nulle passe. C'est une erreur du producteur, mais HEAD couvrait ce cas.
- Correctif : réunir la FontBBox et la boîte d1 de chaque glyphe (`charProcOperatorList`), ou les limites des chemins de la procédure. Sinon, ligne entière.

### N4 — ÉLEVÉE, PRÉEXISTANTE (reste de D4) : phrase arabe
- Le plafond de 64 formes écarte justement la forme lue par PDF.js. Pour « السلام عليكم ورحمة الله وبركاته لا إله إلا الله », `termVariants` donne 64 formes, sans celle de PDF.js. La forme « tout inversé » est générée en dernier (`mask` maximal), puis coupée par `slice(0, 64)`. Sans compter `if (forms.size > 32) break`, qui saute la deuxième substitution.
- Plus large : PDF.js découpe une longue ligne arabe en morceaux dans le désordre (« كاتهالالهاالهللا » + « السالمعليكمورحمةهللاوبر »). Une phrase à cheval sur ces morceaux n'est trouvée sous aucune forme.
- Conséquence : vraie page, phrase « وبركاته لا إله إلا الله » seule → « No match found », alors qu'elle est dans le fichier. Node, avec « مارس » en plus (sur une autre page) : statut **ok**, fichier livré, **pdftotext lit encore la phrase** (fuite silencieuse, comme D4).
- Correctif : (1) générer d'abord la forme tout inversée et son envers, puis les mélanges ; (2) chercher aussi les termes dans les glyphes dès la passe 1 (liste d'opérations par page), pour qu'une page trouvée par les glyphes seuls soit noircie et comptée ; (3) faire de même dans `verifyRedacted`, ou y ajouter une lecture triée par position.

### N5 — FAIBLE (sur-noircissement, visible) : les variantes touchent d'autres mots
- `matchSpans` avec variantes : « سلام » noircit aussi « سالم » (Salem, un autre nom propre) ; « سلامة » → « سالمة » ; « فلاح » → « فالح » ; « علي » → « يلع » (forme inversée, possible à cheval sur deux mots, car les espaces sont ignorés).
- Pas de fuite, mais de vrais mots effacés et comptés comme des occurrences. C'est grave dans un acte où « سالم » est une autre personne.
- Correctif : n'accepter une forme permutée que là où la géométrie le justifie (glyphe lam-alef à plusieurs caractères, ou run lu dans l'ordre du dessin). Garder toutes les formes pour `verifyRedacted`, où le sur-signalement est sans danger.

## 3. Points vérifiés sans défaut
- Le plafond de 64 laisse passer la forme de PDF.js pour un mot seul (jusqu'à 4 lam-alef : 32 formes, forme incluse).
- `glyphTermQuads` : un glyphe n'est couvert qu'une fois ; « unbounded » couvre l'opération de texte entière.
- canvasInk avec une police système (Helvetica) : même encre en Chromium et en WebKit ([0,04, -0,22, 0,53, 0,55]).

## 4. À ajouter aux bancs
- `RED=1` pour fabriquer les fixtures, puis `node scripts/p37/review/real-page-review.mjs <origin> --browser=chromium` et `--browser=webkit --device=iphone`. Attendu après N1 et N3 : 21/21 (aujourd'hui 18/21 dans les deux moteurs).
- `node scripts/p35/redact-bench.mjs <origin> --list=scripts/p37/review/traps-r2.txt --root=%TEMP%\p37-review-redact --browser=chromium`.

---

# Relecture n° 3 — commit 00184b46 (corrections N1-N5)

Date : 06/10/2026. Même rôle, mêmes règles. Vraie page : build de production de 00184b46 sur http://localhost:3137 (servi par le contrôleur).
Nouveaux scripts : `scripts/p37/review/make-arabic-pages.mjs`, `traps-r3.txt`, `pass1-cost.mjs`. Fixtures : `%TEMP%\p37-review-redact\ar3\`.

## Verdict : GO avec conditions

Aucune fuite trouvée : ni texte, ni pixel, ni couche invisible. N1 à N5 sont corrigés. Il reste deux défauts d'exactitude en arabe (R1, R2) : l'outil noircit ou refuse à tort. Ce ne sont pas des fuites, mais ce sont des résultats faux. Condition : corriger R1 (petit correctif) avant d'annoncer l'arabe. R2 est une décision du propriétaire. R3 est conseillé pour l'iPhone.

## 1. Corrections vérifiées
| Défaut | Preuve | Résultat |
|---|---|---|
| N1 texte OCR sous l'image, `/ca 0` | `ocr-variants.mjs` (Node) ; `real-page-review.mjs` ocr-under-image, ocr-alpha-0 | 100 % couvert en Node ; vraie page : voir §4 |
| N2 canvasInk et police de repli | `canvas-ink-fallback.mjs`, Chromium et WebKit | face non chargée → null (avant : boîte fausse) ; Helvetica système inchangée |
| N3 Type 3, FontBBox fausse | fit-adversarial type3-bbox-too-small | 0 px (avant : 800 px en Node, 850 px sur la vraie page) |
| N4 phrase arabe | `redact-review2.test.mjs` ; `traps-r2.txt` en Node avec `--ocr` | phrase seule et avec « مارس » : ok, absente de pdftotext. La forme PDF.js est parmi les 2 premières |
| N5 « سلام » / « سالم » | `redact-review2.test.mjs` ; `ar3/one.pdf` | « سالم » n'est plus noirci ; « السلام » l'est |

- Non-régression Node : `fit-adversarial` 19/19. box-fit 15/15. Arabe 4/4. `redact-review-fixes` et `redact-review2` : tout PASS. 31 pièges avec `--ocr` : 31 ok (seul signal : r2/g5, connu). `traps-r2.txt` : 3/3 ok, 0 fuite.
- Suivi de `ca` / `CA` : il fait partie de l'état empilé, donc q/Q, formulaires et groupes le rétablissent comme le PDF. Un formulaire peint avec `ca 0` transmet 0 à son texte (invisible, côté sûr).
- Image qui recouvre du texte : le test se fait au centre du glyphe, avec le CTM courant (y compris dans un formulaire). Pour les variantes groupées ou répétées, tous les glyphes déjà dessinés sont marqués (côté sûr). Un logo, une signature ou un masque d'image posé sur du texte élargit seulement la boîte. Pas de fuite possible par ce chemin.

## 2. Défauts restants

### R1 — FAIBLE-MOYENNE : la recherche par glyphes noircit le mot ARABE INVERSÉ
- Repro : `node scripts/p37/review/make-arabic-pages.mjs one "قال سلام للجميع/زارنا سالم أمس/السلام عليكم ورحمة الله وبركاته"`, puis le terme « رب ».
  - Le fichier ne contient pas « رب ». Pourtant le résultat est « ok, 1 occurrence » et « بر » est noirci au milieu de « وبركاته ». Image : `%TEMP%\p37-review-redact\one-rab-painted.png`.
  - `rab.pdf` (page 2 : « عنوان البريد والشركة », sans « رب ») : la page 2 est noircie aussi. Vraie page Chromium : « ok pages 1,2 ».
- Cause : `glyphTermMatches` cherche le terme ET son envers dans l'ordre du dessin. L'arabe est dessiné de gauche à droite (ordre visuel). L'envers du terme y correspond donc à l'ordre de lecture, ce qui est juste. Le terme tel quel, lui, y correspond au mot lu à l'envers, ce qui est faux.
- Risque : surtout les termes de 2 ou 3 lettres, et les correspondances à cheval sur deux mots, puisque les espaces sont ignorés. Le compteur du résumé est faussé, et un vrai mot est effacé sans raison.
- Correctif : pour un terme RTL, regarder le sens réel du dessin dans la correspondance (abscisses le long de la ligne). Si les glyphes avancent vers la droite, n'accepter que l'envers ; garder la forme telle quelle seulement pour un dessin de droite à gauche.

### R2 — MOYENNE (utilisabilité, côté sûr) : refus de fichier sur une forme voisine
- Le risque gardé par l'auteur est confirmé. Repro : `make-arabic-pages.mjs salam "قال سلام للجميع في الاجتماع" "زارنا سالم أمس في المكتب"`, terme « سلام » → REFUSED, « a term is still in the text of page 2 ». Même résultat sur la vraie page (Chromium, `traps-r3.txt`).
- Le message est faux pour l'utilisateur : la page 2 ne contient pas « سلام », mais « سالم », un autre nom. Il ne reçoit aucun fichier.
- Portée : toutes les formes (permutées et inversées) de `termVariants` servent au contrôle final. Un terme court refusera tout document qui contient, ailleurs, son envers en ordre de lecture ou sa forme lam-alef permutée. Pour les termes de 4 lettres ou plus, c'est rare ; pour les noms avec « لا » (سلام, فلاح, علاء, صلاح), c'est fréquent.
- Gravité : pas de fuite, pas de silence. Mais l'outil devient inutilisable sur ces documents.
- Correction possible (décision du propriétaire) : dans `verifyRedacted`, chercher le terme exact dans le texte, plus la recherche par glyphes (avec R1 corrigé). Celle-ci voit déjà les formes que PDF.js lit de travers, là où le dessin les montre. Ne garder les formes permutées dans le texte que pour un run dont la géométrie montre un glyphe à plusieurs caractères.

### R3 — FAIBLE (iPhone) : coût de la recherche par glyphes en passe 1
- `pass1-cost.mjs` (Node), 300 pages denses (2,1 M glyphes) : texte 1,9 s, glyphes 2,4 s (8 ms par page). Le temps est acceptable. Mais le tas grossit de 85 Mo : chaque page garde sa liste d'opérations dans PDF.js.
- Sur iPhone, cette mémoire s'ajoute au grand canvas de la passe 2. La page ne libère pas les pages sans correspondance.
- Correctif : appeler `page.cleanup()` après la passe 1 pour une page sans correspondance, et ne garder que `glyphs` pour les pages touchées.
- Fausse correspondance latine : la botte de foin « inversée » renverse aussi les ligatures latines (« ﬁ » devient « if »). Un terme comme « if » est alors trouvé dans « office ». C'est rare et du côté sûr. Il suffit de n'inverser que les glyphes de droite à gauche.

## 3. Points vérifiés sans défaut
- Délai de 20 s par page en passe 1 : en cas d'échec, le contrôle final relit les glyphes. Un terme encore dessiné donne un refus, pas un fichier.
- Page trouvée par les glyphes seuls : elle est noircie, comptée, et sa couche invisible n'a pas le terme (la nouvelle recherche garde toutes les formes).
- Motifs automatiques (e-mail, téléphone, carte) : toujours par le texte seul, comme avant (dit par l'auteur).
- PDF arabe de Chrome (chrome-Arial) : « مارس » est maintenant noirci, et absent de pdftotext et de `-layout`.

## 4. Vraie page (localhost:3137, build 00184b46)
- `real-page-review.mjs` : **Chromium 21/21, WebKit iPhone 21/21** (avant : 18/21 dans chaque moteur). OCR sous l'image et `ca 0` : 0 px non noir.
- `redact-bench.mjs traps-r2.txt` (Chromium) : 3 ok, 0 fuite (« السلام » ; la phrase « وبركاته لا إله إلا الله », avant « No match found » ; OCR sous l'image).
- `redact-bench.mjs traps-r3.txt` (Chromium) : salam.pdf REFUSED (R2) ; rab.pdf et one.pdf « ok » avec un faux noircissement (R1). 0 fuite.

---

# Relecture n° 4 — commit 3ad97d78 (corrections R1-R3, décision du contrôleur)

Date : 06/10/2026. Même rôle, mêmes règles. Vraie page : build de production de 3ad97d78 sur http://localhost:3137 (servi par le contrôleur).
Nouveaux scripts : `scripts/p37/review/real-page-terms.mjs` (plusieurs termes sur la vraie page). Fixtures : `%TEMP%\p37-review-redact\ar3\mixed.pdf`, `mixed2.pdf`, `wrap15.pdf` (faites par `make-arabic-pages.mjs`).

## Verdict : NO-GO en l'état

Il y a une fuite silencieuse, nouvelle par rapport à 00184b46. Elle vient du contrôle final rétréci (R2). Le correctif est petit (§3).

## 1. Ce qui est corrigé et tient
- R1 : « رب » ne noircit plus le « بر » de « وبركاته » (one.pdf : « nomatch », juste). Une ligature latine n'est plus inversée.
- R2 : salam.pdf est « ok », « سالم » reste visible.
- R3 : `page.cleanup()` après la passe 1 pour les pages sans correspondance.
- Décision du contrôleur : le terme exact trouvé dans le texte de PDF.js est toujours noirci et toujours contrôlé. Vérifié (rab.pdf : pages 1 et 2 noircies).
- Suites Node, toutes sans fuite :
  - 31 pièges avec `--ocr` : 31 ok (seul signal : r2/g5, connu).
  - `review-traps` 5/5 ok ; `traps-r2` 3/3 ok ; `traps-r3` : 2 ok, 1 nomatch (juste).
  - `fit-adversarial` 19/19 ; `ocr-scan` 4/4 à 100 % ; `ocr-variants` 2/2 à 100 %.
  - box-fit 15/15 ; arabe 4/4 ; `redact-review-fixes` et `redact-review2` : tout PASS.

## 2. Défaut F1 — ÉLEVÉE, régression de 00184b46 → 3ad97d78 : fuite silencieuse d'un terme arabe avec lam-alef que les glyphes ne trouvent pas
Le contrôle final ne cherche plus les formes permutées dans le texte de PDF.js : seulement le terme exact, plus les glyphes. Or la recherche par glyphes ne trouve pas deux cas courants :
- **Terme mêlé de chiffres ou de latin** : « السلام 2025 ». `glyphTermMatches` inverse tout le terme, chiffres compris (« 5202… »). Or les chiffres sont dessinés de gauche à droite.
- **Phrase coupée en fin de ligne** : « السلام عليكم » sur deux lignes. Dans l'ordre du dessin, les deux morceaux ne se suivent pas.

Dans les deux cas, PDF.js lit « السالم » (lam-alef inversé). Le terme exact n'est donc pas dans le texte, et seule une forme permutée le trouverait. En 00184b46, le contrôle final cherchait toutes les formes et refusait le fichier.

Mesures :
| Fixture | Exact (texte) | Toutes les formes (texte) | Glyphes |
|---|---|---|---|
| mixed.pdf p. 2, « السلام 2025 » | 0 | 2 | 0 |
| wrap15.pdf p. 2, « السلام عليكم » (coupé en fin de ligne) | 0 | 2 | 0 |

Repro, **vraie page Chromium** (`real-page-terms.mjs`) :
- `mixed.pdf`, termes « مارس » et « السلام 2025 » : « Blacked out 1 occurrence (page 1: 1) », fichier livré, **pdftotext lit « السلام 2025 »**.
- `wrap15.pdf`, termes « مارس » et « السلام عليكم » : idem, **pdftotext lit « السلام عليكم »**.
- `mixed2.pdf`, « السلام 2025 » seul : « No match found ». C'est faux aussi : le terme est dans le fichier, et l'utilisateur peut croire qu'il n'y est pas.
- Même résultat en Node (`arabic-terms.mjs`).

## 3. Correctif proposé (sans rouvrir R2)
1. Au contrôle final ET en passe 1, accepter une forme permutée trouvée dans le texte de PDF.js quand la page dessine un glyphe à plusieurs caractères de droite à gauche (« لا », « الله ») à cet endroit. Version simple : le run de PDF.js qui porte la correspondance contient un tel glyphe (`itemGeometry` / `glyphs` de la page). « سالم » (sans ligature) ne déclenche rien, donc R2 reste corrigé. « السالم » (ligature inversée) est noirci en passe 1, ou refusé au contrôle.
2. Dans `glyphTermMatches`, construire la forme dessinée d'un terme RTL avec `bidiReorder` (chiffres et latin gardent leur ordre) au lieu d'un simple envers.
3. Ajouter `mixed.pdf` et `wrap15.pdf` (avec « مارس ») aux tests (`redact-review2.test.mjs`) et au banc vraie page. Le banc à un seul terme ne voit pas la fuite : il faut deux termes.



---

# Relecture n° 5 — commit e839c5b9 (correction F1)

(Section ajoutée au round 6 : au round 5, l'écriture de cette section avait échoué. Le résumé avait bien été rendu au contrôleur.)

Verdict rendu : **GO avec conditions**.
- F1 est corrigé : sur la vraie page Chromium, mixed.pdf et wrap15.pdf donnent un fichier sans le terme.
- Quatre fuites silencieuses ont été trouvées en arabe. Elles existaient avant P37 : la recherche les avait déjà.
  - **L1 (élevée)** : lettres persanes que Chromium écrit (ﯾ lu ی, ﮫ lu ھ). Tout terme avec ي ou ه médian échouait.
  - **L2** : terme mêlé de latin, coupé dans l'ordre visuel.
  - **L3** : tatweel.
  - **L4** : phrase coupée en fin de ligne.
- Fixtures : `%TEMP%\p37-review-redact\ar5\` (`make-chrome-arabic.mjs`) et `ar3\`.

---

# Relecture n° 6 — commit 1a968394 (L1-L4, contrôle final en ordre de lecture)

Date : 06/10/2026. Même rôle, mêmes règles. Vraie page : build de production de 1a968394 sur http://localhost:3137.
Nouveaux scripts :
- `scripts/p37/review/corpus-words.mjs` : chaque mot lu par pdftotext sur de vrais PDF, passé aux détecteurs de la page ;
- `bad-unicode-share.mjs` ;
- `real-page-terms.mjs` (déjà là).
Corpus : les 37 PDF arabes publics du lot 4 (`scripts/audit/results/arabe-corpus/pdfs`) et les 24 PDF de `scripts/p27/pdfa-corpus`.

## Verdict : GO avec conditions

L1 à L4 sont corrigés : sur la vraie page, en Chromium et en WebKit, chaque cas est noirci ou refusé. Je n'ai trouvé aucun nouveau faux refus notable. Deux défauts restent. Ils existaient avant P37, mais ils touchent de vrais documents :
- **C1 (bloquant pour la mise en ligne, simple)** : un plantage sur environ 10 % des vrais PDF (`/SMask /None`).
- **L5 (à annoncer ou atténuer)** : des PDF dont PDF.js lit mal le texte.

## 1. L1 à L4 vérifiés
Vraie page (`real-page-terms.mjs`, « مارس » en page 1, le terme en page 2), **Chromium et WebKit, mêmes résultats** :
| Cas | Résultat |
|---|---|
| c-harakat « المدير العام » (L1) | 2 occurrences, pdftotext ne lit plus le terme |
| c-wrap « الرياض » (L1) | idem |
| tatweel « المدير العام » (L3) | idem |
| c-latin « شركة Microsoft » (L2) | REFUSED, « a term is still drawn on page 2 » |
| lo-latin-wrap « شركة Microsoft » (L4) | REFUSED |
| c-wrap « شهر أبريل » (L4) | REFUSED |

L2 et L4 sont refusés, pas noircis : c'est la version minimale annoncée par l'auteur. Pas de fuite, mais pas de fichier non plus.

## 2. Faux refus (`corpus-words.mjs`)
Méthode : chaque mot pdftotext d'une page, trouvé sur sa page, est cherché sur les autres pages du document. Un faux refus = `readingOrderHit` le voit sur une page où pdftotext ne le lit pas comme mot et où la passe 1 ne le trouve pas.
- 37 PDF arabes, 1 249 mots : **1 faux refus** (wiki-ar-oman p2, « ريال », formé à travers deux colonnes ou cellules).
- 24 PDF latins (p27), 652 mots : **0**.
- Le risque est réel mais faible. `norm` retire tous les espaces : couper les morceaux à 1,5 em (`readingOrderText`) n'empêche donc pas de joindre deux colonnes. Pour le réduire : joindre les morceaux d'une ligne et les lignes avec un séparateur que `norm` garde (par exemple « \u0001 », retiré seulement pour les termes coupés), ou chercher un terme uniquement dans un même morceau ou deux lignes voisines d'une même colonne.

## 3. Défauts restants

### C1 — ÉLEVÉE (préexistant, P33) : « Redaction failed: Expected instance of e, but got instance of e »
- `app/lib/redactSanitize.js`, `prunedResources`, l. 104 : `gs.lookupMaybe(PDFName.of('SMask'), PDFDict)` lève une exception quand `/SMask` vaut le nom `/None`. C'est la valeur ordinaire écrite par Word, InDesign et beaucoup d'outils.
- Fichiers touchés : emro-rc67, emro-rc72, lb-abl-annual, ma-bo-6279, ma-bo-7116, wb-ok-content, soit **au moins 6 sur 61** vrais PDF. La redaction échoue avec un message incompréhensible, même pour un terme latin (« ISSN », « 2014 ») ; confirmé sur la vraie page Chromium. Pas de fuite (aucun fichier n'est donné), mais l'outil est inutilisable sur ces PDF.
- Correctif : `gs.lookupMaybe(PDFName.of('SMask'), PDFDict, PDFName)`, et ne traiter que le cas `PDFDict`. Ajouter un PDF avec `/SMask /None` aux pièges.

### L5 — ÉLEVÉE pour l'arabe (préexistant) : texte que PDF.js lit mal, alors que pdftotext le lit
- Corpus arabe : sur 1 249 mots lus par pdftotext, **41 ne sont trouvés ni par la passe 1 ni par le contrôle final**. Cas réels :
  - wb-ok-content (rapport de la Banque mondiale, 16 mots sur 29) : ToUnicode cassée, PDF.js lit des caractères de contrôle. 38,9 % des glyphes n'ont pas de texte lisible.
  - ma-bo-6279 et ma-bo-7116 (Bulletin officiel du Maroc) : PDF.js perd des lettres (« السنة » lu « النة », « عشرة » lu « عشة »).
  - Chrome avec police de repli (p27-chrome-calibri : « مرحبا », « رسمية ») : glyphes lus « \u0000 », et « ں » (U+06BA) pour ن.
- Conséquences, vérifiées sur la vraie page :
  - terme seul : « No match found » ;
  - avec un autre terme sur la même page (p27-chrome-calibri, « Ελλάδας » + « مرحبا بالعالم ») : « Blacked out 1 occurrence », et l'expression arabe reste **visible sur l'image** (non noircie) ;
  - avec un autre terme sur une autre page : le terme reste dans le fichier (même schéma que D4).
- Le contrôle final repose aussi sur PDF.js : il ne peut pas le voir.
- Atténuations proposées :
  1. Ajouter ں → ن au repli de `norm`.
  2. Signal honnête : compter, par page, les glyphes dessinés sans texte lisible (vide, contrôle, zone privée ; `bad-unicode-share.mjs`). Au-delà de ~1 %, dire dans le résumé, et dans « No match found », que le texte de ces pages ne peut pas être lu de façon fiable, et que des termes peuvent y être manqués (avec la liste des pages). Ce signal attrape wb-ok-content ; il ne voit pas ma-bo (lettres perdues sans caractère de contrôle).
  3. À plus long terme : passer ces pages à l'OCR serveur (déjà disponible) pour la recherche.

## 4. Suites relancées (bancs corrigés, pdftotext en UTF-8), sans fuite
- 31 pièges avec `--ocr` : 31 ok (r2/g5 connu). `traps-r4` et `traps-r5` de l'auteur : ok ou REFUSED attendus.
- fit-adversarial 19/19 ; ocr-scan et ocr-variants à 100 % ; box-fit 15/15 ; arabe 4/4 ; `redact-review2` tout PASS.
- Accents (p27-lo-cambria-accents) : trouvés par la page grâce à `withActualTextUnicode` (mon scan brut, sans ActualText, les donnait manqués : faux signal de mon script, pas de l'outil).


---

# Relecture n° 7 — commit b3b44dcb (C1, ں, pages illisibles, jonctions, couche retirée)

Date : 06/10/2026. Même rôle, mêmes règles. Vraie page : build de production de b3b44dcb sur http://localhost:3137.
Fixtures nouvelles :
- `%TEMP%\p37-review-redact\ar5\s-wrap.pdf` et `s-latin.pdf` (Chromium) ;
- `ar3\s-lowrap.pdf` et `s-lolatin.pdf` (LibreOffice).
Ces quatre fixtures ont « مارس » et le terme visé sur la MÊME page.
`paint-boxes.mjs` est corrigé (état graphique du PDF isolé par q/Q) et accepte plusieurs termes (« a|b »).

## Verdict : GO avec conditions

Les corrections du round 6 tiennent, en Node et sur la vraie page.

Condition de mise en ligne (S1) : une fuite **visible** et silencieuse reste possible quand le terme manqué par la passe 1 est sur une page **déjà noircie** pour un autre terme. Le contrôle final ne regarde pas les pixels d'une page noircie, seulement sa couche invisible. Le nouveau retrait de couche ne crée pas ce trou, mais il peut supprimer le dernier signal (§3).

## 1. Vérifié
- C1 : emro-rc67 « 2020 » → 64 occurrences, fichier livré (vraie page). Piège `r6/smask-none.pdf` : 32 pièges `--ocr` : 32 ok (r2/g5 connu).
- ں → ن : `redact-review6` PASS.
- Pages illisibles : wb-ok-content « zzqq » → « No match found … Pages 1, 4, 5, … : part of the text cannot be read … » (vraie page).
- Jonctions : wiki-ar-oman « ريال » → livré, 34 occurrences, le terme absent de pdftotext (vraie page ; avant : refusé).
- **Pas de régression L2/L4** (vraie page, terme en page 2) : c-latin, c-wrap, lo-latin-wrap → toujours REFUSED (« still drawn on page 2 »).
- Suites Node : `redact-review2`, `redact-review6`, `redact-review-fixes` tout PASS ; box-fit 15/15 ; arabe 4/4 ; fit-adversarial 19/19 ; ocr-variants 100 %.
- Retrait de couche (`removeInvisibleWords`) :
  - Une page noircie ne contient que l'image et la couche. Un terme lu dans son TEXTE ne peut donc venir que de la couche : l'attribution est juste.
  - Si le retrait échoue (référence non trouvée), la vérification relancée retrouve le terme, la page est déjà dans `layerless`, la boucle s'arrête, et le fichier est refusé : côté sûr.
  - La vérification relancée n'est jamais sautée : chaque retrait est suivi de `save` puis `verify`.

## 2. Défaut S1 — ÉLEVÉE (préexistant dans son principe, révélé maintenant) : terme manqué sur une page déjà noircie
- Repro, **vraie page Chromium ET WebKit** : `ar5\s-wrap.pdf`, une seule page (« تقرير شهر مارس الماضي » puis « وصل الوفد في شهر » / « أبريل إلى الرياض » avec retour à la ligne), termes « مارس » et « شهر أبريل ».
  - Résultat : « Blacked out 1 occurrence (page 1: 1) », fichier livré. Sur l'image, **« شهر / أبريل » reste lisible, sans boîte** (`%TEMP%\p37-review-redact\s-wrap-real.png`, et en Node `s-wrap-painted.png`).
  - Le même terme sur une page non noircie est refusé (c-wrap) : le contrôle par ordre de lecture ne protège donc que les pages copiées.
- Cause : la passe 1 ne trouve pas ce terme (Chromium, phrase coupée en fin de ligne : ni le texte de PDF.js ni les glyphes dans l'ordre du dessin). La page est noircie pour « مارس » seulement. `textLayerWords` retire ensuite de la couche les mots qui formeraient le terme (côté sûr pour le texte). Le contrôle final ne lit alors plus que cette couche filtrée : il ne voit rien, et l'image garde le terme.
- Lien avec le nouveau mécanisme : quand la couche, relue par PDF.js, forme le terme alors que la passe 1 l'avait manqué (même famille L2/L4), `removeInvisibleWords` retire la couche, la re-vérification passe, et le fichier est livré avec le terme visible. Avant b3b44dcb, ce cas était refusé. Je n'ai pas construit de fixture qui passe par là : `lineOrders` retire en général ces mots avant. Mais rien ne l'exclut.
- Correctif proposé (couvre les deux) : pour chaque page noircie, au contrôle final (ou dès la passe 2), lancer `readingOrderHit` et `glyphTermMatches` sur les glyphs ORIGINAUX de la page (`hit.glyphs`, déjà gardés), après avoir retiré ceux dont le centre est sous une boîte noire (`quads`).
  - S'il reste un terme, refuser (ou mieux, ajouter ses boîtes).
  - Faire ce contrôle AVANT de retirer une couche : un terme encore lisible dans les glyphes non couverts n'est pas une fausse jonction de la couche.

## 3. Points annexes
- s-latin (Chromium, même page, « شركة Microsoft ») : refusé, pas de fuite. Le contrôle a vu le terme par les glyphes invisibles de la couche (« drawn »), ce qui est fragile : si la couche n'avait pas gardé ces mots, ce cas fuirait comme S1.
- s-lowrap et s-lolatin (LibreOffice, même page) : le terme est trouvé par le texte et noirci. Pas de fuite.
- Pages illisibles : le signal attrape wb-ok-content, pas les Bulletins marocains (lettres perdues sans caractère illisible, déjà noté au round 6).
