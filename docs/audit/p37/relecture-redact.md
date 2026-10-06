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
