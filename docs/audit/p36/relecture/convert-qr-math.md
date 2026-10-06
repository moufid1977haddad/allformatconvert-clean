# P36 — contrôle n° 2, relecture indépendante « convert-qr-math » (12 pages) — 05/10/2026 (date système)

Relu : props `<SeoContent>` de chaque `page.jsx`, `metadata` de chaque `layout.tsx`, `seo.js` voisins (Barcode Generator,
Percentage Calculator), preuves `docs/audit/p36/preuves/convert-qr-math.json`. Code lu par moi-même : pages, `render.js`,
`symbologies.js`, `labels.js`, `read.worker.js`, `batch.worker.js`, `scan.worker.js`, `RateHistory.jsx`,
`app/lib/{exactNumbers,mathTools,qrPayload,qrRender,reportError,useToolError}.js`, `app/tools/ToolErrorWatch.jsx`,
`app/tools/layout.tsx`, `app/error.jsx`, `app/components/{SeoContent.tsx,FileDownload.jsx,FileDropBridge.jsx}`,
`node_modules/@lingo-reader/mobi-parser` 0.4.6.

Vérifications exécutées (dossier de travail de la session, aucun fichier du site modifié) :
- **Exemples refaits en Node avec le code de l'outil** : Color (lignes 10-77 de la page évaluées), Unit (lignes 15-55 +
  `formatSignificant`), QR Generator (`buildPayload`), Fraction (`parseFraction`/`fractionOp`/`describeFraction`/
  `fractionSteps`/`mixedFraction`), Percentage (expressions des six panneaux + `formatSignificant`), Roman
  (`toRoman`/`fromRoman`), Scientific (`evaluateExpression`, mathjs du dépôt), Statistics (`parseNumberList`/
  `statistics`/`formatStat`). Toutes les sorties calculées sont identiques au texte **sauf QR Generator** (voir D-QR1 :
  le texte du code est juste, la chaîne JS affichée perd sa barre oblique inverse).
- **Comptes refaits** : 37 types de codes-barres (14 + 9 + 6 + 8, `symbologies.js`), dont 32 avec lecteur zxing (5 `zxing: null`) ;
  12 catégories d'unités (109 unités) ; 20 devises « POPULAR » ; 23 cases du tableau Statistics ; 8 types de contenu QR.
- **Devises (lecture publique gratuite, 2 GET)** : `open.er-api.com/v6/latest/USD` = 166 devises ; `api.frankfurter.dev/v2/currencies`
  = 165, dont 8 des 166 absentes (BGN CLF FOK HRK KID SLL TVD ZWL), ZWG depuis 2024-09-02 ; noms ICU absents pour FOK GGP IMP JEP KID TVD.
  Les chiffres 166 et 8 sont donc **vrais aujourd'hui**.
- `content-verify.mjs` (3 catégories) : 0 défaut ; `instructions.mjs` : 0 écart ; `privacy-claims.mjs` : 0 échec.
  Ces contrôles automatiques ne voient pas les défauts ci-dessous.

## Défauts

| # | Page | Endroit | Phrase (citation courte) | Problème | Preuve (fichier:ligne ou calcul) | Correction proposée |
|---|---|---|---|---|---|---|
| D-QR1 | qr-generator | `example.output` | `'WIFI:T:WPA;S:Cafe Wi-Fi;P:tea\;time;;…'` | **7 – Exemple faux à l'affichage.** Dans une chaîne JS entre apostrophes, `\;` vaut `;` : la page affiche `P:tea;time;;`, alors que `buildPayload` produit `P:tea\;time;;`. L'exemple, censé montrer l'échappement, montre précisément l'inverse (un `;` non échappé qui couperait le mot de passe). | `qr-generator/page.jsx:194` ; Node : `buildPayload('wifi',{ssid:'Cafe Wi-Fi',password:'tea;time',encryption:'WPA'})` → `WIFI:T:WPA;S:Cafe Wi-Fi;P:tea\;time;;` ; la chaîne source évaluée → `WIFI:T:WPA;S:Cafe Wi-Fi;P:tea;time;;` | Doubler la barre : `P:tea\\;time;;` (ou gabarit `String.raw`), puis vérifier le rendu. |
| D-BC1 | barcode-generator | `howTo[2]` | « colors, rotation and the text line are under "Text and colours" » | **2 – Libellé / emplacement faux** : « Rotation » est dans le bloc « Size », pas dans « Text and colours ». | `barcode-generator/page.jsx:341-355` (Rotation dans `<details>` Size), `:372-391` (Text and colours sans rotation) | « …set "Module width", "Resolution (dpi)", "Bar height" and "Rotation"; colors and the text line are under "Text and colours". » |
| D-BC2 | barcode-generator | `metadata.description` + `openGraph.description` | « at an exact print size as PNG, SVG, PDF or EPS » | **1 – Faux pour PNG** : en raster le module est arrondi au nombre entier de pixels le plus proche (la FAQ de la page le dit elle-même) ; seuls SVG/PDF/EPS gardent la largeur exacte. | `render.js:38-39` (`px = round(xMm*dpi/25.4)`, `rasterXmm`) ; `page.jsx:359` ; FAQ `page.jsx:467` | « …at a set print size, exact in SVG, PDF and EPS, as PNG, SVG, PDF or EPS… » (rester ≤ 155 car.). |
| D-BC3 | barcode-generator | interface (sous-titre H1) | « Every code is scanned back before you download it. » | **1 – Chaîne d'interface FAUSSE** (le rédacteur avait le droit de la corriger) : 5 types sur 37 ne sont jamais relus ; la FAQ réécrite le reconnaît, le sous-titre non. | `page.jsx:264` ; `symbologies.js:33-35,52-53` (`zxing: null` : MSI, Pharmacode, Code 11, EAN-5, EAN-2) ; `page.jsx:118`, `:416` | « …Every code of the 32 types with a browser reader is scanned back before you download it. » (texte calculé : `${ALL.filter(s=>s.zxing).length}`). |
| D-BC4 | barcode-generator | `faqs[0].a` | « Code 39, Interleaved 2 of 5 and Code 11 can add an optional one » | **1 – Imprécis** : pour Code 11 l'option ajoute deux caractères de contrôle (C, puis K au-delà de 10 caractères), comme l'indice de la page le dit. | `symbologies.js:35` (indice « C, and K over 10 characters ») ; `render.js:65` | « …Code 39 and Interleaved 2 of 5 can add an optional check digit, Code 11 its C (and K over 10 characters) check digits… » |
| D-BC5 | barcode-generator | `description` (About) | « in millimetres, mils or pixels » | **6 – Anglais** : orthographe britannique ; la consigne demande l'anglais américain (« millimeters » ; le libellé d'interface « Millimetres (print) » n'est pas cité ici). | `page.jsx:447` | « millimeters » |
| D-CU1 | currency-converter | `specs` « Amount » | « amounts below 1 keep at least four significant digits » | **1 – Faux** : `formatMoney` fixe un **maximum** (4 chiffres significatifs, plafonné à 12 décimales), pas un minimum : 0.5 USD s'affiche « 0.50 », et une valeur sous ~1e-9 tombe à 0. La règle s'applique aussi au **résultat**, pas seulement au montant saisi. | `currency-converter/page.jsx:22-29` (`max = 1 - floor(log10(abs)) + 2`, `maximumFractionDigits: min(max,12)`, `minimumFractionDigits: min(digits,max)`) | « Any number, negative included; values below 1 show up to four significant digits instead of 0.00 » |
| D-CU2 | currency-converter | `faqs[0].a` | « Once a day. ExchangeRate-API… » | **6 – Structure** : la réponse doit commencer par Yes / No / un chiffre. | `page.jsx:162` ; CONSIGNES-RELECTURE §6 | « 1 update a day: ExchangeRate-API publishes… » ou reformuler la question en oui/non. |
| D-CU3 | currency-converter | `metadata.description`, `specs` « History », `faqs[3].a` | « between 166 currencies » ; « 8 of the 166 currencies » | **4 – Invérifiable dans le code / sans date** : 166 et 8 viennent de deux API tierces ; seul l'About date le 166 (rapport du 23/09) ; aucun rapport daté du dépôt ne donne les 8 (seulement la fiche de faits, qui n'est pas une preuve). Vrais aujourd'hui (relevé ci-dessus), mais ils deviendront faux sans changement de code. | `page.jsx:8,12` (aucune constante) ; `RateHistory.jsx:44-45` ; `docs/audit/RAPPORT-licence-et-ameliorations.md:124,126` (166 seulement) | Méta : « …between about 160 currencies… » ou sans chiffre ; specs / FAQ : « 8 of the 166 currencies when we checked on <date> », avec un rapport daté dans `docs/audit/`. |
| D-CU4 | currency-converter | `faqs[2].a` | « touch or hover the line to read one day » | **1 – Imprécis** : sur 5Y et 10Y les points sont hebdomadaires et mensuels (`group=week/month`) ; le survol donne un point de semaine ou de mois, pas un jour. | `RateHistory.jsx:13,49,120-127` | « …touch or hover the line to read one point (a day, or a week or month on 5Y and 10Y) ». |
| D-CU5 | currency-converter | `tips[1]` | « open the list of other currencies instead of changing "To" each time » | **1 – Promesse trop large** : la liste dépliable ne contient que les 20 devises « POPULAR » (moins la devise From) ; la devise d'une étape de voyage peut ne pas y être. | `page.jsx:14,129` | « …open the list of the 20 most used currencies… ; for any other, change "To". » |
| D-CU6 | currency-converter | interface (`RateHistory.jsx`) | « they can differ slightly from the live rate above » | **1 – Chaîne d'interface fausse**, contraire au nouvel About (« not a live market quote ») : le taux du haut est un taux quotidien publié, pas un taux en direct. | `RateHistory.jsx:140` ; `page.jsx:8,58-62` | « …from the daily rate above ». (Hors des props SEO : à signaler au propriétaire / rédacteur.) |
| D-MO1 | mobi-to-epub | `tips[0]` | « MOBI to PDF reads the same files. » | **1 – Faux** : MOBI to PDF n'accepte pas `.prc` (`accept=".mobi,.azw,.azw3"`), alors que cette page accepte `.prc`. | `mobi-to-pdf/page.jsx:250` vs `mobi-to-epub/page.jsx:376` | « MOBI to PDF reads the same .mobi, .azw and .azw3 files. » |
| D-FR1 | fraction-calculator | `faqs[3].a` | « a 0 typed as a denominator is reported as an error naming the entry » | **1 – Faux dans le cas courant** : un 0 tapé dans la case du dénominateur donne « Cannot divide by zero. », sans nommer l'entrée ; le message qui nomme l'entrée n'apparaît que pour une fraction tapée dans une case, comme « 1/0 ». | `fraction-calculator/page.jsx:25` (`fractionOp(parseFraction(n), parseFraction(d), '/')`) ; `mathTools.js:170` ; Node : n=1, d=0 → `Cannot divide by zero.` ; case « 1/0 » → `"1/0": the denominator cannot be zero.` | « …a 0 in a denominator box also shows Cannot divide by zero, and a fraction typed in a box with a 0 denominator, such as 1/0, is reported with that entry… » |
| D-CC1 | color-converter | `privacy` | « this page sends no error reports » | **3 – Promesse fausse** : `ToolErrorWatch`, monté sous toutes les pages d'outils, signale toute promesse rejetée non gérée ; `copy()` appelle `navigator.clipboard.writeText` sans `catch`, donc un refus du presse-papiers (NotAllowedError) part à `/api/report-error` ; un plantage de rendu part aussi par `app/error.jsx`. | `color-converter/page.jsx:104` ; `app/tools/layout.tsx:26` ; `app/tools/ToolErrorWatch.jsx:27-36` ; `app/error.jsx:13-19` | « …are not sent to our server or to anyone else. If a Copy button fails, only that error, without your color, goes to our error log. » |
| D-UC1 | unit-converter | `privacy` | « the page sends no error reports » | **3 – Promesse absolue que le code ne garantit pas** : le filet `ToolErrorWatch` + `app/error.jsx` couvre aussi cette page (aucun chemin courant ici, mais la phrase est inconditionnelle). | `app/tools/layout.tsx:26` ; `ToolErrorWatch.jsx:20-36` ; `app/error.jsx:13-19` | Supprimer la proposition, ou « the page reports nothing you type ». |
| D-PC1 | percentage-calculator | `privacy` | « this page sends no error reports » | **3 – Même défaut que D-UC1.** | idem | idem |
| D-DUP | unit-converter, percentage-calculator, color-converter | `privacy`, 2e phrase | « The values you type are not sent to our server or anywhere else, and the page sends no error reports. » / « The numbers you type are not sent to our server or anywhere else, and this page sends no error reports. » / « The colors you type or pick are not sent to our server or to anyone else, and this page sends no error reports. » | **5 – Phrases quasi identiques** sur trois pages (un mot change) : générique, réutilisable telle quelle sur toute page de calcul. | `unit-converter/page.jsx:185`, `percentage-calculator/page.jsx:115`, `color-converter/page.jsx:204` | Une phrase propre à chaque outil (ce qui est calculé, par exemple les facteurs pour Unit, les six formules pour Percentage), avec la correction D-CC1 / D-UC1 / D-PC1. |
| D-DATE | color-converter, unit-converter, qr-generator, fraction-calculator, percentage-calculator, roman-numeral-converter, scientific-calculator, statistics-calculator | `example.caption` | « run in Node on 06/10/2026 » | **6 – Anglais (américain)** : « 06/10/2026 » se lit 10 juin 2026 aux États-Unis ; Currency écrit déjà « September 23, 2026 ». | les 8 `page.jsx`, ligne de `caption` (color :183, unit :164, qr :190, fraction :117, percentage :95, roman :66, scientific :169, statistics :77) | « October 6, 2026 » (ou la date du jour réel d'exécution). |
| D-QS1 | qr-scanner | `specs` « Image input » et `tips[0]` | « reduced to 12 megapixels before reading » ; « pictures are cut down to 12 megapixels » | **1 – Imprécis** : seules les images de plus de 12 Mpx sont réduites (`k = min(1, …)`) ; une photo plus petite est lue telle quelle. | `qr-scanner/page.jsx:68` | « …pictures above 12 megapixels are reduced to 12 before reading » (même chose dans l'astuce). |
| D-UC2 | unit-converter | `specs` « Units » | « Pa, bar, atm, psi, mmHg, inHg, torr; J, Wh, kWh, cal, kcal, BTU, eV, ft·lbf » | **1 – Liste présentée comme complète mais incomplète** : kPa, MPa et mbar (Pressure), kJ et MJ (Energy) existent, et l'exemple de la même page utilise justement kPa ; Speed, Area, Volume et Time n'y figurent pas du tout. | `unit-converter/page.jsx:26-27` ; `example` :166 (« 1 psi → kPa ») | Préfixer « Among them: » ou compléter (« Pa to MPa, mbar, bar… ; J to MJ… »). |

## Points vérifiés sans défaut (extraits)
- Color : exemple #3b82f6 → rgb(59, 130, 246) / hsl(217, 91%, 60%) / hsv(217, 76%, 96%) / cmyk(76%, 47%, 0%, 4%) / 3.67:1 AA large text only / 5.70:1 AA — identique ; #663399 = rebeccapurple.
- Unit : 6 conversions identiques (1.609344 ; 39370.0787402 ; 37.7777777778 ; 29.4018229167 ; 1073.741824 ; 6.89475729317) ; 12 catégories ; règles de saisie (« 1,000 » ambigu, espaces de milliers) conformes à `page.jsx:66-75`.
- Barcode : 37 types, 32 relus, 5 000 codes / 5 000 étiquettes, 5 MB (`5e6`), 72-2400 dpi, pHYs PNG / JFIF JPG / GIF sans résolution, 0.33 mm par défaut, minimum GS1 0.264 mm, rouleaux 40 × 30 mm à 4 × 6 in, wasm servi depuis `/wasm/zxing_reader.wasm` (présent dans `public/wasm`).
- QR Generator : 200-2000 px, logo ≤ 2 MiB, 22 % de la largeur, PNG ≤ 512 px dans le PDF, page de 288 pt = 4 in, arrondis → carrés dans le PDF, contraste ≥ 3:1, zone de silence 4 modules.
- QR Scanner : zxing-cpp puis jsQR, 20 codes max, délai 20 s, inversion (zxing `tryInvert`, jsQR `attemptBoth`), lien seulement http/https, `noreferrer`.
- MOBI : EPUB 3 (OPF 3.0), nav + NCX, couverture de secours EXTH 201, repli KF8 ↔ MOBI6 selon l'extension, PalmDOC / HUFF-CDIC (bibliothèque : compressions 1, 2, 17480), langue « unknown » possible, pas de `dcterms:modified`.
- Fraction / Percentage / Roman / Scientific / Statistics : tous les exemples et chiffres des FAQ refaits en Node, identiques (9/4 = 2 1/4 = 2.25 ; 3.(142857) ; −16.66666667 % ; −150 % ; 0.00005 ; MMXXVI ; 1994 ; 2^60 → 1152921504610000000 ; 3.33333333333e-13 ; s = 2.1380899353 ; Q3 5.5 / 6.5 ; aberrant 9 ; 1,000 → 1 et 0).
- Structure : 12 titres ≤ 60 car. (49-60), 12 méta 141-150 car. ≠ About, About 86-110 mots, 3-4 étapes, 3-5 FAQ de 31-60 mots ; pas de bourrage relevé.

## Bilan
- Pages relues : **12**.
- Défauts par point de la liste :
  1. Exactitude : **11** (D-BC2, D-BC3, D-BC4, D-CU1, D-CU4, D-CU5, D-CU6, D-MO1, D-FR1, D-QS1, D-UC2 ; D-BC3 et D-CU6 sont des chaînes d'interface, hors props SEO ; D-QS1 couvre 2 endroits, compté 1)
  2. Libellés : **1** (D-BC1)
  3. Lieu de traitement : **3** (D-CC1, D-UC1, D-PC1)
  4. Invérifiable : **1** (D-CU3)
  5. Générique / dupliqué : **3** (D-DUP, trois pages)
  6. Structure / anglais : **10** (D-CU2, D-BC5, D-DATE × 8 pages)
  7. Exemple : **1** (D-QR1)
  - **Total : 30 défauts** (11 + 1 + 3 + 1 + 3 + 10 + 1).
- Pages **sans aucun défaut** : **aucune**. Sans le défaut de format de date (D-DATE), seules roman-numeral-converter, scientific-calculator et statistics-calculator seraient sans défaut.

## Deuxième passe (06/10/2026)

Relu en entier : les 12 pages (props `<SeoContent>`, `layout.tsx`, `seo.js`), plus les chaînes d'interface visibles
(sous-titres, notes, indices, messages), avec la liste de contrôle et les « Précisions pour les corrections après
relecture » de `CONSIGNES-REDACTION.md`.

**Les 30 défauts de la première passe sont corrigés, et chaque correction est vérifiée dans le code.** Points notables :
- D-QR1 : la chaîne évaluée rend bien `WIFI:T:WPA;S:Cafe Wi-Fi;P:tea\;time;;`, ce qui est égal à `buildPayload(...)`.
- D-CU3 : le rapport daté existe, `docs/audit/RAPPORT-p25-decisions-03-10.md:31-32` (158 de 166, la même liste de 8).
- D-BC3 et D-CU6 : les chaînes d'interface sont corrigées (`page.jsx:264` et `RateHistory.jsx:140`).
- D-CC1, D-UC1 et D-PC1 : le contenu du rapport d'erreur (message nettoyé, nom de l'outil, nom et version du
  navigateur) est conforme à `reportError.js:134-144`.

Les exemples des 8 pages sont inchangés et refaits en Node : ils sont identiques. Contrôles relancés :
content-verify (3 catégories) 0, instructions.mjs 0, privacy-claims.mjs 0.

Note pour le contrôleur : le compte rendu du rédacteur annonce 2 chaînes d'interface modifiées. En réalité les
sous-titres de qr-generator (:111), qr-scanner (:159), percentage-calculator (:26) et scientific-calculator (:115)
ont aussi changé. Les quatre nouveaux sous-titres sont exacts (vérifiés dans le code), mais ils manquent à sa liste.

| # | Page | Endroit | Phrase (citation courte) | Problème | Preuve | Correction proposée |
|---|---|---|---|---|---|---|
| D2-1 | color-converter | `description` (About), dernière phrase | « computed by the page itself, from the formulas shown in its code, with nothing to install » | **5 – Remplissage générique** (« with nothing to install » vaut pour toute page) et **1 – trompeur** : la page ne montre pas de formule au visiteur, elles ne sont que dans le code source. | `color-converter/page.jsx:181` ; aucune formule affichée (`:115-177`) | « …computed by the page from the values you type, and CMYK uses K = 1 − max(R, G, B). » (ou toute phrase propre à l'outil sans « nothing to install »). |
| D2-2 | color-converter | `metadata.description` + `openGraph.description` | « …on white and on black. Runs in your browser. » | **5 – Phrase courte générique bannie partout** (Précisions 06/10). La même phrase figure dans 9 `layout.tsx` du site. | `color-converter/layout.tsx:6,10` ; grep `Runs in your browser.` dans `app/tools/**/layout.tsx` : 9 fichiers | Remplacer par un fait propre (par ex. « …with a WCAG grade for text on white and on black. »), en restant entre 110 et 155 caractères. |
| D2-3 | qr-scanner | `metadata.description` + `openGraph.description` | « …up to 20 in one picture. Decoded in your browser. » | **5 – Même type de phrase courte générique** en fin de méta. | `qr-scanner/layout.tsx:6,10` | « …up to 20 in one picture, read on your device with zxing-cpp and jsQR. » (≤ 155 caractères). |
| D2-4 | unit-converter, percentage-calculator | `privacy`, 2e phrase | « If the page itself crashes, our error watch sends the cleaned error message, the tool's name and your browser's name and major version. » | **5 – Phrase identique mot pour mot sur deux pages.** | `unit-converter/page.jsx` (privacy), `percentage-calculator/page.jsx` (privacy) ; grep : ces 2 fichiers seulement | Garder l'information, mais formuler chaque phrase autour de ce qui est propre à l'outil (par ex. Unit : « …never the value or units you chose » ; Percentage : « …never the numbers in the six panels »). |
| D2-5 | barcode-generator | interface, indice de Code 128 (affiché sous « Barcode type », type par défaut) | « The most widely used general-purpose barcode. » | **4 – Superlatif invérifiable** dans un texte d'interface (Précisions 06/10 : à corriger). | `barcode-generator/symbologies.js:24` ; `page.jsx:277` | « Any text (ASCII); used for shipping and inventory labels. » ou seulement « Any text (ASCII). » |
| D2-6 | mobi-to-epub | interface, invite de la zone de dépôt | « Click or drop a MOBI file here » (`UploadPrompt what="a MOBI file"`) | **1 – Trompeur** : la zone accepte aussi .azw, .azw3 et .prc (About, étape 1 et specs le disent). L'invite laisse croire qu'un fichier AZW3 est refusé. | `mobi-to-epub/page.jsx:375-376` (`accept=".mobi,.azw,.azw3,.prc"`) | `what="a MOBI, AZW, AZW3 or PRC ebook"`. |

**Bilan de la deuxième passe** : 12 pages relues, **6 lignes de défaut, soit 7 défauts** (D2-4 porte sur 2 pages).
Par point : 1 → 1 (D2-6) ; 4 → 1 (D2-5) ; 5 → 5 (D2-1, D2-2, D2-3, D2-4 × 2). D2-1 est compté sous le point 5 mais
relève aussi du point 1. Points 2, 3, 6 et 7 : 0.
Pages **sans aucun défaut** : currency-converter, qr-generator, fraction-calculator, roman-numeral-converter,
scientific-calculator, statistics-calculator.

## Troisième passe (06/10/2026)

Pages touchées relues en entier, texte et chaînes d'interface : color-converter, unit-converter,
percentage-calculator, qr-scanner, barcode-generator et mobi-to-epub. Résultat de chaque correction :
- **D2-1, nouvelle dernière phrase de l'About de Color Converter : exacte.** L'état garde un seul RGB, d'où sont
  calculées les quatre autres notations, et un alpha séparé. Un HEX à 4 ou 8 chiffres règle cet alpha, que rgba() et
  hsla() reprennent (`page.jsx:81-110`, `:15-16`, `:74`, `:107`).
- **D2-2, méta et OG de Color Converter (152 caractères) : exactes.** Il y a bien un bouton Copy par format :
  rgb, hsl, hsv et cmyk, plus « Copy HEX » (`:148`, `:166`, `:176`).
- **D2-3, méta et OG de QR Scanner : exactes.** Le décodage se fait sur l'appareil, par zxing-wasm servi depuis `/wasm`
  et par jsQR.
- **D2-4, privacy de Unit et de Percentage : corrigée.** Les deux phrases sont maintenant distinctes, et chacune décrit
  exactement ce qu'envoient `ToolErrorWatch` et `reportError.js`.
- **D2-5, indice de Code 128 : exact.** « Any text (ASCII), with letters, digits and symbols. » Seule cette chaîne a
  changé dans `symbologies.js` (git diff vérifié) ; il reste 37 types, dont 32 relus, recomptés en Node.
- **D2-6, MOBI to EPUB : exact.** L'invite rend « Click or drop a MOBI, AZW, AZW3 or PRC file here », ce qui
  correspond à `accept`. Le sous-titre « DRM-free MOBI, AZW, AZW3 and PRC » décrit l'entrée prévue, conforme à l'About.

Les autres sous-titres changés (liste du rédacteur, n° 1 à 9) sont tous vérifiés exacts.
content-verify, relancé sur les 3 catégories : 0 défaut.

**0 défaut.** Les 12 pages sont sans défaut.
