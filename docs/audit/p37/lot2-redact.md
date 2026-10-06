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

## 10. Relecture n° 3 (00184b46 : GO avec conditions, aucune fuite) — corrections R1 à R3

| Défaut | Correction | Test : avant (copie de 00184b46) → après |
|---|---|---|
| R1 un terme arabe trouvé à l'envers dans les glyphes (« رب » noircissait « بر » dans « وبركاته ») | `glyphTermMatches` suit le vrai sens du dessin (position des glyphes le long de la ligne). Pour un terme de droite à gauche dessiné vers la droite (cas usuel), seule la forme inversée est acceptée, dans le texte où les glyphes RTL sont inversés. Pour un dessin vers la gauche, ou un seul glyphe, seule la forme telle quelle. Un terme latin n'est cherché que tel quel ; une ligature latine (« ﬁ ») n'est plus inversée. (Une première version exigeait aussi que les glyphes confirment le terme trouvé dans le texte : remplacée par la décision du contrôleur, voir plus bas.) | `redact-review2.test.mjs` : one.pdf « رب » : ok 1 occurrence → **aucune correspondance** |
| R2 refus sur une forme voisine (« سالم » page 2, terme « سلام ») | Contrôle final = le terme tel que tapé dans le texte, plus la recherche par glyphes (avec le sens du dessin). Les chaînes du fichier et le texte des annotations sont en ordre de lecture (aucun glyphe lu) : `matchesText` cherche le terme tel que tapé. Les formes permutées ne servent plus qu'à la couche invisible (côté sûr). Le cas « D4 annotations » du test D1-D6 est réécrit dans ce sens. | salam.pdf : **REFUSED** → **ok**, « سلام » absent, « سالم » présent |
| R3 mémoire de la passe 1 | `page.cleanup()` après la passe 1 pour une page sans correspondance (page et banc Node). | `node --expose-gc scripts/p37/pass1-cleanup-cost.mjs` (300 pages denses) : mémoire gardée **+20 Mo → -1 Mo** ; temps 6,4 s → 6,1 s |

### Relances (code final), toutes sans fuite
- `redact-review-fixes` tout PASS ; `redact-review2` tout PASS (3 FAIL sur 00184b46) ; box-fit 15/15 ; `review/fit-adversarial` 19/19 ; `ocr-scan` 4/4 et `ocr-variants` 2/2 à 100 % ; arabe 4/4.
- 31 pièges avec OCR : 31 ok (seul signal : r2/g5, connu).
- `review-traps.txt` 5/5 ; `review/traps-r2.txt` 3/3 ; `review/traps-r3.txt` : salam ok, one « nomatch » (juste), rab ok (pages 1 et 2), 0 signal.
- Navigateur, sans build : `redact-canvas-check.mjs --review` → Chromium et WebKit tout PASS.
- content-verify 0, instructions 0, privacy-claims 0, ESLint 0 erreur. Texte de la page inchangé.

### Décision du contrôleur (06/10) : jamais de fuite silencieuse
- Ma première version de R1 ignorait un terme arabe trouvé dans le texte de PDF.js si les glyphes ne le confirmaient pas, en passe 1 comme au contrôle final. Risque : un mot vraiment dessiné, mais dans un ordre inhabituel, restait visible sans signal. Le contrôleur l'a refusé : une fuite silencieuse est pire qu'un sur-noircissement ou un refus.
- Règle appliquée : le terme EXACT tel que tapé, trouvé dans le texte de PDF.js (comme avant P37), est TOUJOURS noirci en passe 1 et TOUJOURS cherché au contrôle final (refus s'il reste). Aucune confirmation par les glyphes n'est demandée pour lui. Seules les formes PERMUTÉES (lam-alef, lectures inversées) passent par les glyphes, avec le sens du dessin. R1 (glyphes) et R2 (« سالم » ne fait plus refuser « سلام ») restent corrigés.
- Conséquence acceptée et visible : quand PDF.js lit un morceau « رب » dans « البريد » (rab.pdf, page 2), ce morceau est noirci. C'est un sur-noircissement, comme avant P37, et le résumé compte la page.
- Test (`redact-review2.test.mjs`, cas « decision ») : la page 2 de rab.pdf, seule, devient un PDF. Son texte (ToUnicode lu par PDF.js) contient « رب », mais ses glyphes ne lisent pas ce mot. Avec la règle précédente (copie de travail rejouée) : « No match found », le PDF restait tel quel → **FAIL**. Avec la règle actuelle : noirci, « رب » absent du texte du résultat → **PASS**.
- Relances après ce changement, toutes sans fuite :
  - `redact-review-fixes` et `redact-review2` : tout PASS. box-fit 15/15 ; fit-adversarial 19/19 ; ocr-scan et ocr-variants à 100 % ; arabe 4/4.
  - 31 pièges avec OCR : 31 ok, seul signal r2/g5 (connu). review-traps 5/5 ; traps-r2 3/3 ; traps-r3 : 2 ok + 1 nomatch, 0 signal.
  - Navigateur : `redact-canvas-check --review` tout PASS en Chromium et en WebKit.
  - Contrôles de contenu 0 ; ESLint 0 erreur.

### Commandes pour le contrôleur (après rebuild)
- `node scripts/p35/redact-bench.mjs <origin> --list=scripts/p37/review/traps-r3.txt --root=%TEMP%\p37-review-redact --browser=chromium` (puis webkit) : attendu salam ok, one nomatch, rab ok (pages 1 et 2), 0 fuite.
- `node scripts/p37/review/real-page-review.mjs <origin> --browser=chromium` et `--browser=webkit --device=iphone` : 21/21. Puis les commandes des §6, §8 et §9.

## 11. Relecture n° 4 (3ad97d78 : NO-GO) — F1, fuite silencieuse d'un terme lam-alef mêlé de chiffres ou coupé en fin de ligne

### Défaut
- Le terme « السلام 2025 » (mêlé de chiffres) ou « السلام عليكم » (coupé en fin de ligne) : PDF.js lit « السالم ». Le terme exact n'est donc pas dans le texte, et les glyphes ne le trouvaient pas non plus (chiffres inversés ; deux morceaux non contigus). Le contrôle final, rétréci par R2, ne le voyait pas davantage.
- Résultat : avec « مارس » en plus, le fichier était livré et pdftotext lisait encore le terme. Seul, l'outil disait « No match found ».

### Correction (`app/lib/pdfRedact.js`), comme proposé par la relecture
1. `confirmedTermSpans` (passe 1 ET contrôle final) accepte aussi une forme lam-alef trouvée dans le texte de PDF.js, mais seulement si le run concerné dessine un glyphe à plusieurs caractères de droite à gauche (« لا », ligature « الله »). « سالم », sans ligature, ne déclenche rien, donc R2 reste corrigé. Si les glyphes de la page n'ont pas pu être lus, toutes ces formes sont acceptées (côté sûr).
   - Seules les formes lam-alef servent ici (`matchSpans(…, { forms: 'ligature' })`), jamais la lecture entièrement inversée. Celle-ci reprenait le « بر » de « وبركاته » pour « رب » (R1). Une lecture dans l'ordre du dessin est trouvée par les glyphes.
2. `glyphTermMatches` : la forme dessinée d'un terme de droite à gauche est construite avec `bidiReorder` (chiffres et latin gardent leur ordre), et non par un simple envers.

### Tests (échec avant → succès après)
- `redact-review2.test.mjs`, 3 nouveaux cas F1. Sur une copie de 3ad97d78 : **3 FAIL**. Avec la correction : **PASS**.

  | Fichier | Avant | Après |
  |---|---|---|
  | mixed.pdf (« مارس » + « السلام 2025 ») | ok, mais pdftotext lit encore le terme | ok, absent |
  | mixed2.pdf (« السلام 2025 » seul) | « nomatch » | ok, absent |
  | wrap15.pdf (« مارس » + « السلام عليكم ») | ok, mais pdftotext lit encore le terme | ok, absent |

- Les autres fixtures coupées de la relecture (wrap10 à wrap14, wrap16) : ok, terme absent.
- R1 et R2 tiennent : one.pdf « رب » → nomatch ; salam.pdf ok, « سالم » visible (N5 et R2 PASS).
- Nouvelle liste `scripts/p37/traps-r4.txt` (plusieurs termes par ligne, séparés par « | »). `redact-traps-node.mjs` accepte maintenant ce format. Node : 4 ok, 1 nomatch (one.pdf, juste), 0 fuite.

### Relances, toutes sans fuite
- `redact-review-fixes` et `redact-review2` : tout PASS. box-fit 15/15 ; fit-adversarial 19/19 ; ocr-scan 4/4 et ocr-variants 2/2 à 100 % ; arabe 4/4.
- 31 pièges avec OCR : 31 ok (seul signal : r2/g5, connu). review-traps 5/5, traps-r2 3/3, traps-r3 2 ok + 1 nomatch : 0 fuite.
- Navigateur (code de la page, sans build) : `redact-canvas-check --review` tout PASS en Chromium et en WebKit.
- content-verify 0 ; instructions 0 ; privacy-claims 0 ; ESLint 0 erreur. Texte de la page inchangé.

### Risque restant
- Une page dont les glyphes ne peuvent pas être lus accepte toutes les formes lam-alef : sur-noircissement ou refus possible, jamais une fuite.
- Un run qui contient un lam-alef ET un autre mot proche (« سالم ») : ce mot peut être noirci, ou le fichier refusé. C'est le côté sûr.

### Commandes pour le contrôleur (après rebuild)
- Le banc vraie page (`redact-bench.mjs`) ne prend qu'un terme par fichier. Pour F1, utiliser le script du relecteur, avec deux termes :
  - `node scripts/p37/review/real-page-terms.mjs <origin> %TEMP%\p37-review-redact\ar3\mixed.pdf "مارس|السلام 2025" --browser=chromium` (puis `--browser=webkit`)
  - `node scripts/p37/review/real-page-terms.mjs <origin> %TEMP%\p37-review-redact\ar3\wrap15.pdf "مارس|السلام عليكم" --browser=chromium` (puis webkit)
  - `node scripts/p37/review/real-page-terms.mjs <origin> %TEMP%\p37-review-redact\ar3\mixed2.pdf "السلام 2025" --browser=chromium` (puis webkit)
  - Attendu : fichier livré sans le terme (pdftotext) ; jamais « No match found ».
- Puis les commandes des §6, §8, §9 et §10.

## 12. Relecture n° 5 (e839c5b9 : GO avec conditions, F1 vérifié) — fuites préexistantes L1 à L4

Les quatre cas se testent avec « مارس » en page 1 et le terme en page 2. Avant (copie de e839c5b9), les 6 cas de `redact-review2.test.mjs` donnaient « ok » avec le terme encore lu par pdftotext : 6 fuites silencieuses. Après : aucune.

| Défaut | Correction | Fixture, terme | Avant → après |
|---|---|---|---|
| L1 lettres persanes et ourdoues (Chrome : « ﯾ » lu « ی », « ﮫ » lu « ھ ») | `norm` (exporté, et la même fonction dans les bancs) replie ی ى → ي, ک → ك, ھ ہ ە ۀ → ه, des deux côtés (« على » trouve aussi « علي » : sur-noircissement, côté sûr) | ar5\c-harakat.pdf « المدير العام » ; ar5\c-wrap.pdf « الرياض » | fuite → **noirci** |
| L3 tatweel (kashida U+0640) | `norm` le supprime, ainsi que les marques de direction U+200E, U+200F, U+202A-U+202E, U+2066-U+2069 | ar3\tatweel.pdf « المدير العام » | fuite → **noirci** |
| L2 mot latin dans une ligne arabe | Contrôle final : `readingOrderText` reconstruit l'ordre de lecture de chaque page à partir des glyphes. Lignes de haut en bas, coupées aux grands blancs, morceaux arabes remis en ordre de lecture par `bidiReorder`. Tous les termes y sont cherchés (`readingOrderHit`) ; s'il en reste un, le fichier est **refusé**. | ar5\c-latin.pdf et ar3\lo-latin-wrap.pdf « شركة Microsoft » | fuite → **refusé** |
| L4 phrase coupée en fin de ligne | Même reconstruction (lignes jointes) | ar5\c-wrap.pdf « شهر أبريل » | fuite → **refusé** |

- L2 et L4 sont faits dans leur version minimale demandée : le fichier est refusé, jamais livré. Ces termes ne sont pas encore noircis : il faudrait la même reconstruction en passe 1, avec un placement des boîtes.
- Texte de la page : l'arabe n'est annoncé que pour la couche invisible (« Arabic included » / « Arabic words included, as the PDF's own text gives them »). Aucune promesse sur la recherche arabe. Contrôles : content-verify 0, instructions 0, privacy-claims 0.

### Angle mort des bancs, trouvé en passant (important)
- `scripts/p35/redact-bench.mjs` (banc vraie page) et `scripts/p37/redact-traps-node.mjs` appelaient `pdftotext` sans `-enc UTF-8`. Le pdftotext de Git (xpdf) sort alors du Latin-1 : **le texte arabe n'atteignait jamais leur contrôle pdftotext.** Corrigé (`-enc UTF-8`). Leur `norm` replie aussi maintenant les lettres et retire tatweel et marques de direction.
- Conséquence : les résultats arabes « 0 fuite » de ces deux bancs dans les rounds précédents ne valaient que pour leurs contrôles PDF.js et flux bruts. Les tests arabes dédiés (`redact-review2`, `redact-arabic-layer`, `arabic-terms.mjs`) utilisaient bien `-enc UTF-8` : ils restent valables.
- `redact-traps-node.mjs` ne contrôle plus qu'un fichier livré (statut ok), comme le banc vraie page : un fichier refusé n'est jamais donné.

### Relances (code et bancs corrigés), toutes sans fuite
- `redact-review2` tout PASS (6 FAIL sur e839c5b9). `redact-review-fixes` tout PASS. box-fit 15/15 ; fit-adversarial 19/19 ; ocr-scan 4/4 et ocr-variants 2/2 à 100 % ; arabe 4/4.
- 31 pièges avec OCR : 31 ok (seul signal : r2/g5, connu).
- Avec le pdftotext UTF-8, 0 fuite partout :
  - review-traps 5/5 ; traps-r2 3/3 ; traps-r3 2 ok + 1 nomatch ; traps-r4 4 ok + 1 nomatch ;
  - nouvelle liste `scripts/p37/traps-r5.txt` : 3 ok + 3 REFUSED ;
  - les 10 PDF arabes de `%TEMP%\p37-arabic` avec « مارس » : 9 ok + 1 nomatch (juste).
- Faux refus nouveaux : aucun sur ces suites, ni sur le kit iPhone, le PDF « difficile » de P33, la fixture de géométrie, `lo-Arial-names`, les PDF Chrome et Text to PDF.
- Navigateur : `redact-canvas-check --review` tout PASS en Chromium et en WebKit. ESLint 0 erreur.

### Risque restant
- La reconstruction en ordre de lecture peut joindre deux colonnes d'une même ligne, ou deux lignes voisines. Un terme formé à cheval sur elles peut alors faire refuser un fichier à tort. C'est le côté sûr, mais l'utilisateur ne reçoit pas de fichier. Aucun cas trouvé dans les suites.
- L2/L4 complets (noircir au lieu de refuser) : reconstruction en passe 1, puis correspondance des positions vers les glyphes pour placer les boîtes. Estimation : 1 à 1,5 jour, avec les tests et une relecture.

### Commandes pour le contrôleur (après rebuild)
- Relancer le banc vraie page arabe, maintenant que pdftotext lit l'arabe : les commandes des §8 à §11, et pour L1-L4 :
  - `node scripts/p37/review/real-page-terms.mjs <origin> %TEMP%\p37-review-redact\ar5\c-harakat.pdf "مارس|المدير العام"` (attendu : livré, terme absent)
  - `node scripts/p37/review/real-page-terms.mjs <origin> %TEMP%\p37-review-redact\ar3\tatweel.pdf "مارس|المدير العام"` (attendu : livré, terme absent)
  - `node scripts/p37/review/real-page-terms.mjs <origin> %TEMP%\p37-review-redact\ar5\c-latin.pdf "مارس|شركة Microsoft"` (attendu : refusé, « could not be redacted safely »)
  - `node scripts/p37/review/real-page-terms.mjs <origin> %TEMP%\p37-review-redact\ar5\c-wrap.pdf "مارس|شهر أبريل"` (attendu : refusé)
  - chacune avec `--browser=chromium` puis `--browser=webkit`.

## 13. Relecture n° 6 (1a968394 : GO avec conditions) — C1, L5, faux refus par jonction de colonnes

Toutes les corrections sont testées dans `scripts/p37/redact-review6.test.mjs`. Sur une copie de 1a968394 : **11 FAIL**. Après : **tout PASS**.

| Point | Correction | Avant → après |
|---|---|---|
| C1 `/SMask /None` faisait planter toute rédaction (P33) | `redactSanitize.js` : `gs.lookupMaybe(PDFName.of('SMask'), PDFDict, PDFName)`, seul le cas dictionnaire est traité. Nouveau piège `r6/smask-none.pdf` (`scripts/p37/make-smask-none.mjs`), ajouté à `scripts/p35/traps.txt` (32 pièges). | 7 fichiers (le piège et emro-rc67, emro-rc72, lb-abl-annual, ma-bo-6279, ma-bo-7116, wb-ok-content) : « Expected instance of PDFDict, but got instance of PDFName » → noircis (ma-bo-6279 « 6279 » : refusé, le numéro est aussi dans les données du fichier, comportement attendu) |
| L5 (1) « ں » (U+06BA, police de repli de Chrome) | `norm` replie ں → ن (et les bancs aussi) | test unitaire FAIL → PASS |
| L5 (2) texte illisible annoncé | `unreadableShare` : part des glyphes sans texte lisible (vide, contrôle, zone privée). Une page au-dessus de 1 % (et 3 glyphes au moins) est nommée dans le résumé et dans « No match found » : « Pages …: part of the text cannot be read …, so a term there may not be found. Check these pages, or run PDF OCR first. » | wb-ok-content : pages signalées (avant : rien) ; un PDF bien lu : aucune page |
| Faux refus par jonction de colonnes (wiki-ar-oman « ريال ») | `readingOrderHit` cherche chaque morceau de ligne à part (séparateur que `norm` garde), plus deux jonctions : avec le morceau de la ligne suivante dans la même colonne, et d'une ligne à l'autre quand les deux sont d'un seul morceau (paragraphe coupé). Les deux cellules d'une ligne de tableau ne se joignent plus, et L2/L4 restent attrapés (`redact-review2` tout PASS). Deuxième cause, sur une page noircie : deux mots invisibles gardés côte à côte, lus ensemble par PDF.js (« عبري » + « ا لفن »). Si le contrôle final trouve un terme dans le TEXTE d'une page noircie, ce texte ne peut venir que de sa couche invisible (la page est une image) : la page perd sa couche (`removeInvisibleWords`, couche dans son propre flux), et le fichier est vérifié de nouveau, une fois par page. Le résumé le dit. La couche invisible est aussi vérifiée dans l'ordre des lignes et dans l'ordre où PDF.js la relit. | wiki-ar-oman « ريال » : REFUSED → **ok**, terme absent (pages 14 et 22 sans texte sélectionnable) |

- Texte de la page :
  - nouvelle FAQ « Can it miss a word that is in the PDF? » : oui, quand le PDF ne dit pas quelles lettres sont certains caractères (certains PDF arabes) ; les pages sont listées ; si un terme reste lisible, aucun fichier n'est donné ;
  - la FAQ sur le texte sélectionnable précise qu'une page peut ne garder aucun mot.
  - L'arabe reste annoncé seulement pour la couche invisible. Contrôles : content-verify 0, instructions 0, privacy-claims 0.

### Faux refus et mots manqués (`review/corpus-words.mjs`)
| Corpus | Mots | Trouvés | Refusés | Manqués | Faux refus |
|---|---|---|---|---|---|
| 37 PDF arabes (lot 4) | 1 249 | 1 198 | 10 | 41 | 1 → **0** |
| 24 PDF de `scripts/p27/pdfa-corpus` | 432 | 408 | 0 | 24 | **0** |

Les mots manqués restants :
- PDF dont PDF.js lit mal le texte : wb-ok-content, ma-bo, polices de repli de Chrome. Les pages concernées sont maintenant signalées, sauf ma-bo, où des lettres manquent sans caractère illisible.
- Dans le corpus p27, des mots accentués de LibreOffice (« être »). Le script du relecteur ne passe pas par `withActualTextUnicode`, alors que la page, elle, les trouve (vu à la relecture n° 6).

### Relances, toutes sans fuite
- `redact-review-fixes`, `redact-review2`, `redact-review6` : tout PASS. box-fit 15/15 ; fit-adversarial 19/19 ; ocr-scan 4/4 et ocr-variants 2/2 à 100 % ; arabe 4/4.
- 32 pièges avec OCR : 32 ok (seul signal : r2/g5, connu).
- review-traps 5/5 ; traps-r2 3/3 ; traps-r3 2 ok + 1 nomatch ; traps-r4 4 ok + 1 nomatch ; traps-r5 3 ok + 3 refusés : 0 fuite.
- Navigateur (code de la page) : Chromium et WebKit tout PASS. ESLint 0 erreur.

### L5 à long terme : estimation chiffrée
- But : une page signalée illisible (part > 1 %) n'est plus seulement annoncée. Elle est aussi cherchée par l'OCR serveur déjà en place (pdf-tools : Tesseract, langues ara+eng, la file d'attente de P35). Les mots trouvés par l'OCR donnent leurs boîtes, et la page est noircie.
- Travail :
  1. appel de l'OCR serveur pour les seules pages signalées, avec les termes ; retour des mots avec leurs boîtes (format hOCR / TSV de Tesseract), conversion en coordonnées de la page : 1 jour ;
  2. correspondance des termes sur le texte OCR (même `norm`), boîtes noires avec la marge élargie (l'OCR n'est pas exact au pixel), comptage dans le résumé : 0,5 jour ;
  3. contrôle final : si l'OCR d'une page noircie lit encore un terme, refus : 0,5 jour ;
  4. textes de la page et de confidentialité (la page est alors envoyée au service), quotas, tests (Node et vraie page, Chromium et WebKit, corpus arabe) et relecture : 1 à 1,5 jour.
- Total : **3 à 3,5 jours**. Coût d'exploitation : celui de l'OCR serveur actuel, seulement pour les pages signalées.
- Limite : la qualité de Tesseract sur l'arabe de petite taille. Une page signalée et non trouvée par l'OCR reste annoncée.

### Commandes pour le contrôleur (après rebuild)
- `node scripts/p35/redact-bench.mjs <origin> --list=scripts/p35/traps.txt --root=%TEMP%\p33-review-redact --browser=chromium --ocr` (puis webkit) : 32 ok, dont `r6/smask-none.pdf`.
- `node scripts/p37/review/real-page-terms.mjs <origin> scripts\audit\results\arabe-corpus\pdfs\wiki-ar-oman.pdf "ريال"` : livré, plus de refus.
- `node scripts/p37/review/real-page-terms.mjs <origin> scripts\audit\results\arabe-corpus\pdfs\wb-ok-content.pdf "zzqq"` : « No match found » avec la phrase « part of the text cannot be read » et la liste des pages.
- `node scripts/p37/review/real-page-terms.mjs <origin> scripts\audit\results\arabe-corpus\pdfs\emro-rc67.pdf "2020"` : plus d'erreur « Expected instance… ».
- Puis les commandes des §8 à §12.

## 14. Relecture n° 7 (b3b44dcb : GO avec conditions) — S1, terme encore visible sur une page noircie

### Défaut
Un terme manqué par la passe 1, sur une page noircie pour un AUTRE terme, restait lisible sur l'image. Exemple : ar5\s-wrap.pdf, « مارس » et « شهر / أبريل » coupé en fin de ligne, sur la même page. Le contrôle final ne lisait plus que la couche invisible filtrée de cette page : il ne voyait rien, et le fichier était livré.

### Correction (comme proposé)
- `visibleTermLeft(glyphs, quads, terms)` (`app/lib/pdfRedact.js`) part des glyphes ORIGINAUX de chaque page noircie (ceux de la passe 1, sinon relus). Il retire ceux dont le centre est sous une boîte noire, puis cherche les termes dans le reste, dans l'ordre du dessin (`glyphTermMatches`) et dans l'ordre de lecture reconstruit (`readingOrderHit`).
- S'il reste un terme, le fichier est **refusé**, et aucune boîte n'est ajoutée à l'aveugle. Message : « a term can still be read on page N (written in a way the search could not place, for example a phrase split across two lines, or a Latin word inside Arabic text). No file is given. »
- Si les glyphes d'une page noircie ne peuvent pas être lus, refus aussi (côté sûr).
- Ce contrôle se fait page par page en passe 2, donc avant l'enregistrement, avant le contrôle final et avant tout retrait de couche invisible. La page et le banc Node font la même chose.

### Tests (`scripts/p37/redact-review7.test.mjs`)
| Fixture (« مارس » + le terme, même page) | Avant (copie de b3b44dcb) | Après |
|---|---|---|
| ar5\s-wrap.pdf « شهر أبريل » (Chromium, coupé) | **ok, terme visible** (fuite) | REFUSED « can still be read on page 1 » |
| ar5\s-latin.pdf « شركة Microsoft » (Chromium) | REFUSED, mais par la couche invisible (« still drawn », fragile) | REFUSED par le contrôle des glyphes visibles |
| ar3\s-lowrap.pdf, ar3\s-lolatin.pdf (LibreOffice) | ok, terme absent | ok, terme absent |

### Faux refus
- `review/corpus-words.mjs` (le compte du relecteur, pages copiées) : **0** sur les 37 PDF arabes et **0** sur les 24 PDF p27.
- Nouveau `scripts/p37/corpus-visible.mjs`. Il compte les refus du nouveau contrôle sur les pages noircies : chaque mot lu par pdftotext et trouvé par la passe 1 est noirci, puis on regarde ce qui reste visible.
  - 37 PDF arabes : 1 205 mots, 3 refus. 24 PDF p27 : 424 mots, 0 refus.
  - Les 3 refus sont de **vraies** fuites évitées, pas de faux refus : emro-rc67 p3 « لمنظمة », who-a65div4 p1 « الصحة » et « العمل » (avec tatweel). Dans chaque cas, le mot entier est encore lisible, dans une ligne où la passe 1 n'a mis aucune boîte (« المكتب الإقليمي لمنظمة الصحة العالمية », « جمعية الصحة العالمية »). Le texte de PDF.js ne le trouvait pas à cet endroit. Avant, ces fichiers étaient livrés avec le mot visible.
- Autres PDF ordinaires (kit iPhone, PDF difficile de P33, fixture de géométrie, wiki-ar-oman « ريال », emro-rc67 « 2020 ») : toujours ok.

### Relances, toutes sans fuite
- `redact-review-fixes`, `redact-review2`, `redact-review6`, `redact-review7` : tout PASS. box-fit 15/15 ; fit-adversarial 19/19 ; ocr-scan 4/4 et ocr-variants 2/2 à 100 % ; arabe 4/4.
- 32 pièges avec OCR : 32 ok (seul signal : r2/g5, connu).
- review-traps 5/5 ; traps-r2 3/3 ; traps-r3 2 ok + 1 nomatch ; traps-r4 4 ok + 1 nomatch ; traps-r5 3 ok + 3 refusés ; 10 PDF arabes : 9 ok + 1 nomatch.
- Navigateur (code de la page) : Chromium et WebKit tout PASS. content-verify 0, instructions 0, privacy-claims 0, ESLint 0 erreur.

### Risque restant
- Le contrôle refuse le fichier au lieu de noircir ce qu'il trouve. Ajouter des boîtes demanderait de placer les glyphes restants et de vérifier de nouveau (même chantier que L2/L4 complets, estimé au §12).
- Un mot formé par l'ordre de lecture reconstruit à cheval sur deux lignes d'un seul morceau (règle du §13) peut faire refuser à tort. Aucun cas dans les corpus.

### Commandes pour le contrôleur (après rebuild)
- `node scripts/p37/review/real-page-terms.mjs <origin> %TEMP%\p37-review-redact\ar5\s-wrap.pdf "مارس|شهر أبريل"` (puis `--browser=webkit`) : attendu refusé, « can still be read on page 1 ».
- `node scripts/p37/review/real-page-terms.mjs <origin> %TEMP%\p37-review-redact\ar5\s-latin.pdf "مارس|شركة Microsoft"` : refusé.
- `node scripts/p37/review/real-page-terms.mjs <origin> %TEMP%\p37-review-redact\ar3\s-lowrap.pdf "مارس|شركة Microsoft"` et `s-lolatin.pdf` : livrés, termes absents.
- Puis les commandes des §8 à §13.
