# P37 lot 2 points 2 et 3 — PDF Redact : boîte noire ajustée au texte, arabe gardé dans la couche invisible

Date : 06/10/2026. Branche p37. Rien n'est commité, construit ni déployé par moi (le contrôleur commite et lance les bancs navigateur).

## 1. Point 2 — boîte noire trop large

### Reproduction
- Cas iPhone (06/10) : `kit-iphone-p21/pdf-avec-images.pdf`, page 2, ligne « Image d'origine : photo-2.jpg » en Helvetica 14, une seule opération Tj.
- Cause : la position de « photo-2 » dans la ligne était mesurée sur le texte avec une police du navigateur, puis la boîte était élargie de 15 % de la taille de police de chaque côté (plus 4 % si la police n'était pas chargée), et de -0,3 à 1,05 fois la taille en hauteur. D'où « : » et « .j » couverts, et le « p » de « jpg » coupé.
- Banc reproductible : `scripts/p37/redact-box-fit.test.mjs`. 15 PDF construits trois fois avec le MÊME flux de contenu, seul le mode de rendu du texte change (0 = dessiné, 3 = invisible) : ligne entière, correspondance seule, voisins seuls (mots de la ligne, une ligne au-dessus, une en dessous). Poppler (pdftoppm 288 dpi) dessine les deux derniers : ce sont les vrais pixels d'encre de la correspondance et des voisins, sans dépendre de l'outil.
- Cas couverts : Helvetica 14 et 6 pt, Times-Italic 12, Courier-Bold 36, TrueType simple (Liberation Sans, WinAnsi), Type 0 (Noto Sans, Noto Serif Italic, Noto Naskh Arabic de droite à gauche), crénage TJ dans et autour de la correspondance, espacement des caractères Tc 1,5, des mots Tw 4, échelle horizontale Tz 70, montée Ts 3, page /Rotate 90 avec texte tourné de 30°, texte dans un formulaire XObject agrandi 1,3 fois.
- Critères : 100 % des pixels d'encre de la correspondance dans une boîte ; le pixel de voisin le plus enfoncé dans une boîte à au plus max(2 % de la taille de police, 0,5 pt) + 0,25 pt.

### Résultats
| | Fixtures réussies | Encre de la correspondance couverte | Encre des voisins sous une boîte |
|---|---|---|---|
| Avant (code de HEAD, mesure Node Helvetica) | **1/15** | 100 % partout | jusqu'à 10,68 pt d'enfoncement, 315 à 7 876 px (Helvetica 14 : 394 px, 5,57 pt) |
| Après | **15/15** | 100 % partout | 0 px sur 14 fixtures ; Noto Serif Italic : 10 px à 0,49 pt (marge permise 0,75 pt) |

(La seule fixture qui passait avant : Courier-Bold 36, où l'écart entre caractères dépasse l'ancienne marge.)

### Conception (`app/lib/pdfRedact.js`)
- `glyphsOfOperatorList` : chaque glyphe dessiné est placé à partir de la liste d'opérations de PDF.js (`page.getOperatorList`, annotations exclues), avec exactement l'arithmétique du dessin canvas de PDF.js 5.7 (largeurs de la police, Tc, Tw, Tz, décalages TJ, Ts, matrices du texte et de la page, formulaires, groupes, polices Type 3).
- `itemGeometry` : chaque caractère d'un « run » de texte PDF.js est relié à son glyphe, seulement si trois conditions tiennent : les glyphes sont sur la ligne de base du run et dans sa largeur ; ils remplissent le run d'un bout à l'autre ; ils épellent exactement le texte du run (dans l'ordre du dessin, ou inversé pour la droite-à-gauche). Sinon, ce run garde l'ancienne estimation élargie (côté sûr).
- Boîte = avance des glyphes des caractères trouvés × hauteur de la police (ascendante / descendante), réunie avec l'encre réelle du glyphe (italique qui dépasse, accent), plus une marge de max(2 % de la taille de police, 1 pixel de l'image de la page). Hauteur uniforme par la police, pas par l'encre : une boîte collée à l'encre trahirait la forme du mot (lettres montantes, descendantes).
- Encre du glyphe : sur la page, `measureText` du canvas dans la police que PDF.js a chargée pour dessiner (même caractère, même gras / italique). Inconnue (alors 15 % de marge comme avant) pour une page dessinée par notre service (iPhone), une police Type 3, une police « re-mesurée » par PDF.js, une police non chargée. Dans le banc Node : fontkit sur la police convertie par PDF.js.
- Filet de sécurité `glyphTermQuads` : les termes sont aussi cherchés dans le texte des glyphes eux-mêmes (ordre du dessin, mêmes règles : casse, accents, espaces, traits d'union ; à l'envers pour un terme de droite à gauche), et ces glyphes sont noircis en plus. Trouvé grâce au piège f4b : « Mu » + tréma reculé + « ller » ; PDF.js place le run « ller » 6 pt trop à gauche ; l'ancienne estimation (même code qu'à HEAD) laissait voir la queue du « r ». Corrigé.
- Droite-à-gauche : PDF.js donne le texte d'un run arabe dans l'ordre de lecture, l'inverse du dessin. Une position mesurée depuis le bord gauche dans ce texte est donc en miroir. Un run de droite à gauche non relié à ses glyphes est maintenant noirci en entier (avant : mesure possiblement en miroir ; non prouvé en navigateur, la mesure Node couvrait le run entier).
- Retrait du contenu : inchangé. La page touchée reste une image ; aucun opérateur de texte d'origine n'est recopié. Le resserrement de la boîte ne touche que les pixels.

### Comparaison marché
- Adobe Acrobat (« Find Text & Redact ») : la marque couvre les boîtes des caractères trouvés ; à l'application, tout caractère touché par la zone est supprimé. Un fil de la communauté Adobe signale des zones qui débordent sur les lignes voisines en petite police, sans réglage de hauteur ([community.adobe.com](https://community.adobe.com/questions-9/text-surrounding-redaction-area-disappears-1301565)).
- MuPDF / PyMuPDF : `search_for(quads=True)` donne les quadrilatères des caractères ; `apply_redactions` supprime un caractère si sa boîte touche le rectangle ; pas de marge ajoutée ([pymupdf.readthedocs.io](https://pymupdf.readthedocs.io/en/latest/page.html), [technetexperts.com](https://www.technetexperts.com/pymupdf-redaction-removes-adjacent-text/)).
- Nous : même principe (boîtes des caractères, hauteur de la police), plus l'encre réelle et une marge d'un pixel. Différence : un voisin partiellement couvert est seulement noirci en partie (image), pas supprimé.

## 2. Point 3 — arabe dans la couche invisible

### Reproduction
- Fixtures : `scripts/p37/make-arabic-fixtures.mjs` (7 lignes : arabe, arabe + chiffres + latin, lam-alef, harakat, adresse e-mail). LibreOffice sans interface : Arial, Tahoma, Times New Roman, Segoe UI, Noto Naskh Arabic ; Chromium (Playwright) : Noto Naskh Arabic, Tahoma, Arial ; notre Text to PDF.
- Test : `scripts/p37/redact-arabic-layer.test.mjs` (relecture Node du pipeline). On noircit « مارس », puis pdftotext et PDF.js lisent le résultat : le mot doit être absent (texte et flux bruts : UTF-8, UTF-16BE, inversé) ; chaque ligne doit être lue entière et dans l'ordre (la ligne du mot en deux morceaux autour du trou ; la basmala, toute en harakat, est hors critère).

### Résultats (4 fixtures notées : LibreOffice Arial, Tahoma, Times New Roman, Segoe UI)
| | « مارس » absent (pdftotext / PDF.js / brut) | Lignes lues dans l'ordre (pdftotext / PDF.js) | Mots dans la couche |
|---|---|---|---|
| Avant (HEAD) | 4/4 oui | **0/7 et 0/7** sur chaque fixture | 5 (chiffres et latin seulement) |
| Après | 4/4 oui | **7/7 et 7/7** sur chaque fixture | 51 à 54 |

### Conception
- `invisibleTextFont` : police Type 0 (CIDFontType2, Identity-H) construite à la main. Un code par caractère, sa ToUnicode rend ce caractère, son glyphe est le glyphe nominal du caractère dans Noto Sans Arabic, police réduite (fontkit) aux glyphes écrits. Pas de mise en forme (shaping) : la couche est invisible, seul le texte rendu compte ; et les grappes mises en forme (lam-alef, lettre + haraka) sont relues dans le mauvais ordre par PDF.js et Poppler (ETUDE-EDITEUR-PDF-ARABE.md §4). Chaque mot est écrit dans l'ordre du dessin (`bidiReorder` : groupes inversés, chiffres et latin gardent leur ordre) à sa vraie place (géométrie du point 2).
- Grappes : PDF.js inverse caractère par caractère tout le run ; un glyphe lam-alef dont la ToUnicode dit « لا » devient « ال » (« السالم » pour « السلام », « هللا » pour « الله »). Quand la géométrie montre ce cas, la couche réécrit la grappe dans son ordre : on lit « السلام » et « الله ».
- Police : **Noto Sans Arabic**, déjà livrée par le site (`public/fonts/noto/NotoSansArabic-Regular.ttf`, 235 Ko, `OFL.txt` à côté, utilisée par Text to PDF), au lieu d'ajouter Noto Naskh Arabic. Raison : la couche est invisible, la forme des glyphes ne compte pas ; même famille et même licence SIL OFL 1.1 ; aucun nouveau fichier, et le cache du navigateur sert les deux outils. Chargée seulement si une page noircie garde un mot arabe (fontkit en import dynamique, comme Text to PDF). Poids dans le PDF : sous-ensemble ; exemple LibreOffice Arial : 35 Ko → 8,6 Ko après rédaction.
- Si la police ne se télécharge pas, les mots arabes ne sont pas gardés et le résumé le dit (« Arabic words were not kept as selectable text: … »).
- Caractères de contrôle (codes d'une police sans texte, lus par PDF.js) : retirés des mots de la couche.

### Fixtures non notées (signalées)
- LibreOffice Noto Naskh Arabic : PDF.js lit déjà mal l'original (lettres sans points, runs en morceaux). La couche reprend cette lecture : 1/7 ligne (pdftotext), 0/7 (PDF.js). Le mot est bien supprimé.
- **Notre Text to PDF** : la ToUnicode de pdf-lib est fausse pour l'arabe mis en forme (pdftotext de l'original : « تقرتر » pour « تقرير »). La couche reprend cette lecture (0/7). Le run n'étant pas relié à ses glyphes, la boîte couvre le run entier (« وحدة في شهر مارس الماضي »). Défaut de Text to PDF, hors de ce lot : à traiter (ToUnicode par couple glyphe/texte, étude §4).
- **Chromium (3 polices)** : PDF.js lit un glyphe par run, dans l'ordre du dessin ; Redact ne trouve aucun mot arabe (« No match found »). Pas de fuite silencieuse (l'outil dit qu'il n'a rien trouvé), mais l'arabe des PDF « Enregistrer en PDF » de Chrome ne peut pas être noirci. Défaut préexistant, hors de ce lot.

## 3. Fuites (relecture Node, 31 PDF piégés de traps.txt)
`node scripts/p37/redact-traps-node.mjs --list=scripts/p35/traps.txt --root=%TEMP%\p33-review-redact --ocr`
- 31/31 « ok », 0 refus, 0 erreur.
- pdftotext, PDF.js, flux bruts : 0 fuite. Seul signal : r2/g5 « Adobe » trouvé dans `/Registry (Adobe)` des polices — faux positif connu (rapport P33 §7), identique à HEAD.
- OCR (Tesseract, boîtes peintes sur l'image Poppler à 144 dpi) : 0 fuite. Le terme était lisible par l'OCR avant rédaction sur 29 des 38 pages noircies ; pour les pièges à accents et à espacement (illisibles par l'OCR), contrôle à l'œil des images : tout couvert (f4b corrigé par le filet de sécurité).
- Placement exact : 34 correspondances sur 41 ; les autres (pièges accents superposés, zéro-largeur) gardent l'estimation élargie.
- Mots gardés dans la couche : plus qu'avant (ex. « Supplier: » et « Inc. » autour de « Adobe », « golf » et « hotel » autour de SECRET-42), car les voisins ne touchent plus la boîte.

## 4. Texte de la page (app/tools/pdf-tools/pdf-redact/page.jsx)
- À propos : « Each black box is fitted to the glyphs of the matched letters, so the words beside them stay readable. »
- Spécifications : « Pages with a match » + « Arabic included » ; nouvelle ligne « Black boxes » : « The matched letters' glyphs plus 2% of the font size or one pixel, whichever is larger; where a line's glyphs cannot be tied to its text, 15% of the font size on each side, or the whole line ».
- FAQ « Will the rest… searchable? » : mots gardés « in reading order, Arabic words included, as the PDF's own text gives them » ; non gardés : mots qui touchent une boîte, texte vertical, grec, cyrillique, hébreu, écritures asiatiques.
- Résumé affiché après la rédaction : « Arabic » retiré de la liste des écritures perdues (« Hebrew » ajouté, exact) ; « words touching a black box ».
- layout.tsx : inchangé (toujours exact).
- docs/audit/p36/preuves/pdf-2.json : preuves ajoutées pour « 2% » et « 15% » (motifs dans app/lib/pdfRedact.js).
- Contrôles, tous à 0 : `content-verify --only=pdf-tools/pdf-redact` 0 failure (et `--only=pdf-tools/` : 39 pages, 0) ; `instructions.mjs` 0 mismatch ; `privacy-claims.mjs` 0 failure. ESLint : 0 message sur les fichiers touchés.

## 5. Risques restants
- Pas encore vu sur la vraie page : la mesure d'encre par canvas (Chromium, WebKit) et la lecture des polices par `commonObjs`. Bancs navigateur à lancer (§6). Si la liste d'opérations ne répond pas en 20 s, la page revient à l'ancienne estimation pour toute la page.
- Page dessinée par notre service (iPhone, repli) : positions exactes, encre inconnue → 15 % de marge par glyphe (comme avant).
- Le filet de sécurité par glyphes cherche les termes, pas les motifs automatiques (e-mail, téléphone, carte).
- Boîte de hauteur = police : avec un interligne plus serré que la police (Noto Naskh à 1,25), la boîte peut mordre la ligne voisine (comme Acrobat). La fixture arabe utilise l'interligne réel des producteurs (1,70 em).
- Arabe : la couche reprend la lecture de PDF.js ; elle est fausse là où PDF.js lit mal l'original (Noto Naskh LibreOffice, notre Text to PDF). Chrome : aucune recherche arabe possible (préexistant).
- Avec un trou de rédaction dans une ligne arabe, pdftotext (mode normal) sort parfois le morceau de gauche sur sa propre ligne, avant le reste (même comportement avec tout trou ; `-layout` donne l'ordre visuel).

## 6. Commandes pour le contrôleur (après `next build` + `next start`, origine = http://localhost:3000 par exemple)
1. Fixtures (une fois) :
   - `node scripts/p37/redact-box-fit.test.mjs --keep` (crée %TEMP%\p37-box-fit, attendu 15/15)
   - `node scripts/p37/make-arabic-fixtures.mjs` (crée %TEMP%\p37-arabic ; LibreOffice requis pour les fixtures notées)
2. Banc des 31 pièges sur la vraie page :
   - `node scripts/p35/redact-bench.mjs <origin> --list=scripts/p35/traps.txt --root=%TEMP%\p33-review-redact --browser=chromium --ocr`
   - `node scripts/p35/redact-bench.mjs <origin> --list=scripts/p35/traps.txt --root=%TEMP%\p33-review-redact --browser=webkit --ocr`
   - attendu : 31 ok, seul signal r2/g5 « raw » (faux positif connu).
3. Boîte ajustée + arabe sur la vraie page :
   - `node scripts/p37/redact-real-page.mjs <origin> --browser=chromium`
   - `node scripts/p37/redact-real-page.mjs <origin> --browser=webkit --device=iphone`
   - attendu : 15 fixtures de boîte PASS (encre du mot 100 % noire, voisins ≤ marge + 0,5 pt), 4 fixtures arabes PASS.
4. Couche invisible P35 (non-régression) : `node scripts/p35/redact-text-layer.mjs <origin> --browser=webkit --device=iphone` puis `--browser=chromium --device=desktop`.
5. Tests Node (sans serveur) : `node scripts/p37/redact-box-fit.test.mjs` ; `node scripts/p37/redact-arabic-layer.test.mjs` ; `node scripts/p37/redact-traps-node.mjs --list=scripts/p35/traps.txt --root=%TEMP%\p33-review-redact --ocr`.

## 7. Fichiers
Modifiés : `app/lib/pdfRedact.js`, `app/tools/pdf-tools/pdf-redact/page.jsx`, `scripts/p35/harness.mjs`, `docs/audit/p36/preuves/pdf-2.json`, `scripts/p37/redact-box-fit.test.mjs` (créé avant l'interruption), `scripts/p37/redact-traps-node.mjs` (idem).
Créés : `scripts/p37/make-arabic-fixtures.mjs`, `scripts/p37/redact-arabic-layer.test.mjs`, `scripts/p37/redact-real-page.mjs`, `docs/audit/p37/lot2-redact.md`.
Non modifiés : `app/lib/redactSanitize.js`, `app/tools/pdf-tools/pdf-redact/layout.tsx`, aucune police ajoutée sous public/.

## 8. Corrections après relecture (relecture indépendante de dbf86202 : NO-GO, docs/audit/p37/relecture-redact.md)

Tous dans `app/lib/pdfRedact.js` (et l'appel dans la page). Chaque point a un test qui échoue avant et passe après.

| Défaut | Correction | Test : avant (dbf86202) → après |
|---|---|---|
| D1 couche OCR invisible (mode 3) : jambages du scan visibles | Le mode de rendu est suivi. Un glyphe en mode 3 ou 7 n'a pas d'encre propre : marge d'avant (15 % de chaque côté, -0,3 à 1,05 em). | `review/ocr-scan.mjs` : « photography » 94,31 % → **100 %**, « graph » 93,31 % → **100 %**. `redact-review-fixes.test.mjs` D1 : FAIL → PASS |
| D2 texte en contour (modes 1, 2, 5, 6) | La moitié de l'épaisseur du trait (× échelle de la matrice) est ajoutée à la marge, dans les boîtes de texte et dans le filet. | `review/fit-adversarial.mjs` : stroke-tr2-w2-24 17 px → 0, stroke-tr1-w3-36 48 px → 0 ; test D2 FAIL → PASS |
| D3 Type 3, encre hors de l'avance | Encre = /FontBBox × /FontMatrix ; boîte vide ou démesurée → ligne entière. | type3-overhang 300 px (97,2 %) → 0 (100 %) |
| D4 lam-alef (préexistant P33) : « السلام » jamais trouvé → fuite page 2 | `termVariants` : chaque « لا » cherché aussi en « ال », « الله » aussi en « هللا », et le terme arabe aussi à l'envers (≤ 64 formes). Utilisé par `matchSpans` (donc la recherche, la couche et `verifyRedacted`), `matchesText` (annotations, données) et le filet par glyphes. Le filet cherche aussi un texte où chaque glyphe à plusieurs caractères est inversé. | `review/arabic-terms.mjs two-pages.pdf "مارس\|السلام"` : pdftotext lisait « السلام » → **absent** ; test D4 (3 cas) FAIL → PASS ; un terme latin n'a qu'une forme |
| D5 police re-mesurée par PDF.js (glyphe centré ou serré) | L'encre suit le dessin de PDF.js (décalage de la moitié de l'écart, et la version serrée). Si le glyphe dessiné n'est pas connu, la ligne entière est noircie. | test D5 (2 cas) FAIL → PASS |
| D6 run RTL palindrome relié en miroir | Un run `dir: rtl` essaie d'abord les ordres inversés. | test D6 FAIL → PASS |

### Défaut trouvé sur la vraie page (build dbf86202 sur localhost:3137, signalé par le contrôleur)
- `redact-real-page.mjs` : 3 FAIL en Chromium (times-italic-12, wordspacing-tw-4, hscale-tz-70 : voisins noircis à 1,25 pt, limite 1,00). Couverture du mot : 100 % partout.
- Cause, vue dans Chromium et WebKit : PDF.js dessine les polices standard (Helvetica, Times…) comme **polices système** (`systemFontInfo`, « 100px Helvetica, g_d0_sf2, sans-serif »). La page les excluait de la mesure d'encre, donc retour aux 15 % de marge. Cela touchait aussi le cas iPhone d'origine (Helvetica).
- Second problème trouvé en mesurant : dans WebKit, `measureText` renvoie la boîte d'avance comme « encre » (« 2 » Helvetica : 0 à 55,6 = avance). Un dépassement italique aurait été manqué sur iPhone.
- Correction : `canvasInk` dessine le glyphe sur un petit canvas (400 × 400) avec exactement la chaîne de police de PDF.js (face propre ou police système), puis lit les pixels (+1 px à 100 px de chaque côté). Même résultat quel que soit le moteur. `pageGlyphGeometry` est maintenant partagé par la page et le banc Node.
- Vérification sans build : `scripts/p37/redact-canvas-check.mjs` sert PDF.js et `app/lib/pdfRedact.js` à une page vide, rejoue la passe 2 de la page dans le navigateur, puis contrôle comme `redact-real-page.mjs`. Résultat : **Chromium 15/15, WebKit 15/15**, voisins noircis 0 pt (Noto Serif Italic : 0,50 pt). Sur la vraie page dbf86202 : 1,00 à 1,25 pt.
- Texte de la page : la ligne « Black boxes » dit maintenant « half the outline width for outlined text » et « 15% … for invisible text over a scan (an OCR layer) ». Preuve « 15% » mise à jour dans pdf-2.json.

### Relances (code final)
- `redact-review-fixes.test.mjs` : tout PASS (avant, sur dbf86202 : 8 FAIL sur 10).
- `redact-box-fit.test.mjs` 15/15. `review/fit-adversarial.mjs` **16/16**. `review/ocr-scan.mjs` 4/4 à 100 %.
- `redact-arabic-layer.test.mjs` 4/4.
- 31 pièges avec OCR : 31 ok, 0 fuite (seul signal : r2/g5, le faux positif connu). Fixtures de la relecture (`scripts/p37/review-traps.txt`) : 5/5 ok, 0 fuite.
- content-verify (pdf-redact) 0 ; instructions 0 ; privacy-claims 0 ; ESLint 0.

### Limite toujours ouverte
PDF arabes de Chrome : PDF.js mélange l'ordre du dessin et l'ordre de lecture dans des runs d'un ou deux glyphes. Même avec les formes inversées, « مارس » n'est pas trouvé (« No match found » ; l'outil le dit, pas de fuite silencieuse).

### Commandes à ajouter pour le contrôleur (après rebuild)
- `node scripts/p37/redact-real-page.mjs <origin> --browser=chromium` et `--browser=webkit --device=iphone` : attendu 15 + 4 PASS.
- `node scripts/p35/redact-bench.mjs <origin> --list=scripts/p37/review-traps.txt --root=%TEMP%\p37-review-redact --browser=chromium --ocr` (puis `--browser=webkit`) : attendu 5 ok, 0 fuite.
- Sans build : `node scripts/p37/redact-canvas-check.mjs --browser=chromium` puis `--browser=webkit`.

## 9. Relecture n° 2 (9cdaf2a5 : GO avec conditions) — corrections N1 à N5

Chaque point a un test qui échoue avant et passe après. « Avant » = 9cdaf2a5, soit les chiffres de la relecture, soit une copie de ses fichiers rejouée par mon test (`--harness` / `--impl`).

| Défaut | Correction (`app/lib/pdfRedact.js`, page, banc Node) | Test : avant → après |
|---|---|---|
| N1 couche OCR cachée autrement que par le mode 3 | (1) L'opacité `ca` / `CA` de `setGState` est suivie. Un texte rempli avec `ca 0` (ou en contour avec `CA 0`) est invisible. (2) Un glyphe recouvert ensuite par une image (`paintImageXObject`, image en ligne, masque…, rectangle de l'image par le CTM) est marqué invisible. Pour les variantes « répétées » ou « groupées », tous les glyphes déjà dessinés le sont (côté sûr). Un glyphe invisible a une encre inconnue, d'où l'ancienne marge. | `review/ocr-variants.mjs` : under-image et alpha-0, 94,7 % (vraie page, relecture) → **100 %** (Node, et navigateur Chromium et WebKit via `redact-canvas-check.mjs --review`) |
| N2 canvasInk mesure une police de repli | Renvoie null si `font.disableFontFace`, si la face (hors police système) n'est pas « loaded » dans `document.fonts`, ou si un caractère visible ne dessine rien (seul un espace peut être vide). `inkOf` reçoit le texte du glyphe. | `review/canvas-ink-fallback.mjs` : face non chargée, avant [0,12, -0,01, 0,66, 0,64] → **null** en Chromium et en WebKit ; Helvetica système inchangée |
| N3 Type 3, /FontBBox fausse non nulle | Encre = union de la FontBBox et des bornes d1 du glyphe (PDF.js le découpe à ces bornes). Sans d1 (d0) : ligne entière. | `fit-adversarial --only=type3-bbox-too-small` : 800 px (Node), 850 px (vraie page) → **0** |
| N4 phrase arabe (fuite silencieuse) | (1) `termVariants` donne d'abord la forme lue par PDF.js et son envers, puis les mélanges (64 au plus). (2) Les termes sont aussi cherchés dans les glyphes dessinés dès la passe 1 (`pageGlyphs` + `glyphTermMatches`, 20 s par page). Une page trouvée par les glyphes seuls est noircie et comptée, et ses glyphes sont réutilisés en passe 2. (3) `verifyRedacted` refuse aussi un fichier dont une page dessine encore un terme (`glyphHit`). | `redact-review2.test.mjs` : « وبركاته لا إله إلا الله » seule : nomatch → **ok, absente** ; avec « مارس » : ok mais pdftotext la lisait → **absente** ; forme PDF.js dans les 2 premières : FAIL → PASS |
| N5 sur-noircissement par les formes permutées | Le texte est cherché avec le terme tel que tapé (`matchSpans(…, { forms: 'exact' })`). Les formes lues de travers ne sont trouvées que dans les glyphes, là où le dessin les montre : le terme, et son envers s'il est de droite à gauche, sur le texte des glyphes dans l'ordre du dessin ou avec chaque grappe inversée. Toutes les formes restent dans le contrôle final, la couche invisible et les annotations. | Même test, nouveau PDF `lo-Arial-names.pdf` : « سلام » noircissait « سالم » → **plus** ; « فلاح » noircissait « فالح » → **plus** ; « السلام » et « الفلاح » restent noircis |

### Effet en plus
Les PDF arabes faits par Chrome sont maintenant noircis : la recherche par glyphes trouve « مارس » (avant : « No match found »). Contrôle Node : « مارس » absent de pdftotext, de PDF.js et des flux bruts, pour les 3 polices Chrome. La couche invisible de ces PDF reste pauvre : PDF.js lit leur texte en désordre.

### Relances (code final)
- `redact-review-fixes.test.mjs` tout PASS ; `redact-review2.test.mjs` tout PASS (9cdaf2a5 : 5 FAIL).
- box-fit 15/15 ; `review/fit-adversarial.mjs` 19/19 ; `review/ocr-scan.mjs` et `ocr-variants.mjs` 100 %.
- Arabe 4/4 notées.
- 31 pièges avec OCR : 31 ok, 0 fuite (seul signal : r2/g5, faux positif connu). `review/traps-r2.txt` 3/3 ok, 0 fuite. `review-traps.txt` 5/5.
- Navigateur, sans build : `redact-canvas-check.mjs --review` (mes 15 fixtures et les 21 fixtures rouges de la relecture, avec le code de la page) → **Chromium tout PASS, WebKit tout PASS**.
- content-verify 0 ; instructions 0 ; privacy-claims 0 ; ESLint 0 erreur. Texte de la page inchangé : la ligne « Black boxes » (« invisible text over a scan ») couvre aussi ces cas.

### Risques restants
- Le contrôle final garde toutes les formes (demande de la relecture). Un fichier dont une page non noircie contient « سالم » sera donc REFUSÉ si l'on noircit « سلام ». C'est le côté sûr : aucun fichier n'est donné, et le message le dit. Pour éviter ces refus, il faudrait limiter le contrôle final au terme exact plus la recherche par glyphes : décision du propriétaire.
- Recherche par glyphes en passe 1 : une liste d'opérations de plus par page, donc plus lent sur les gros PDF (20 s au plus par page). En cas d'échec, le contrôle final la refait.
- Les motifs automatiques (e-mail, téléphone, carte) ne sont pas cherchés dans les glyphes.
- Pas de vrai PDF « texte sous l'image » (ABBYY, scanner) testé : seulement la fixture construite par la relecture.

### Commandes pour le contrôleur (après rebuild)
- `RED=1` fixtures (déjà dans %TEMP%) ; `node scripts/p37/review/real-page-review.mjs <origin> --browser=chromium` et `--browser=webkit --device=iphone` : attendu **21/21**.
- `node scripts/p35/redact-bench.mjs <origin> --list=scripts/p37/review/traps-r2.txt --root=%TEMP%\p37-review-redact --browser=chromium` (puis webkit) : attendu 3 ok, 0 fuite.
- Puis les commandes des §6 et §8 (real-page 15 + 4, 31 pièges, review-traps).
