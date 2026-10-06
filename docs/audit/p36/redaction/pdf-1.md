# P36 — Rédaction du lot « pdf-1 » (19 outils) — compte rendu

Fichiers modifiés : `app/tools/pdf-tools/<outil>/layout.tsx` (titre, méta, openGraph identiques) et `page.jsx` (props de
`<SeoContent>` seulement, une ligne d'import de constante sur 13 pages, une chaîne d'interface sur pdf-translate) pour les 19
outils ; `docs/audit/p36/preuves/pdf-1.json` ; ce compte rendu. Fins de ligne CRLF conservées.
Sources des faits : `docs/audit/p36/faits/pdf-1.json` ; défauts supprimés : `docs/audit/p36/audit/pdf-1.md`.
Branche décrite : service média configuré (`NEXT_PUBLIC_MEDIA_SERVICE_URL` défini sur www). Les tailles viennent des
expressions du code (`officeMaxLabel(…)`, `pdfToolsMaxLabel()`, `OFFICE_STAGED_THRESHOLD_BYTES / 1048576`,
`MAX_PROMPT_CHARS`, `PHONE_MAX_MP`, `MAX_DECODED_MP_COMPUTER`, `MAX_PAGE_POINTS`, `TAG_CHECK_MAX_BYTES`,
`MAX_PDF_TRANSLATE_*`, `languages.length`, `docLanguages.length`). Les autres chiffres sont prouvés dans `preuves/pdf-1.json`
(36 preuves : constantes de `lib/quota/config.js`, `lib/urlFetch/*`, `PdfToImages.jsx`, `serverPageRender.js`,
`pdfTranslate.js`, rapports datés `RAPPORT-p24-couverture-03-10.md`, `RAPPORT-fidelite-office.md`).

## Imports ajoutés (aucun changement de comportement)
- `OFFICE_STAGED_THRESHOLD_BYTES` depuis `@/lib/quota/limits` : word-to-pdf, ppt-to-pdf, pdf-to-pdfa (nouvelle ligne) ;
  excel-to-pdf, html-to-pdf, epub-to-pdf, mobi-to-pdf, markdown-to-pdf, pdf-to-word, pdf-to-excel, pdf-to-ppt (ajout à
  l'import existant).
- `MAX_PAGE_POINTS` (ajout à l'import `pdfImages`) : image-to-pdf, jpg-to-pdf.
- `officeMaxLabel` (ajout à l'import `officeUpload`) : text-to-pdf.

## Chaîne d'interface modifiée (une seule)
- pdf-translate `page.jsx`, sous-titre : « Translate PDF content to any language with AI » (FAUX : 10 langues en mode texte,
  Google en mode PDF entier) → « Translate the text of a PDF into another language ».

## Par outil (titre / méta avec longueurs ; mots SEO avant → après, estimés sur le source)

| Outil | Titre (car.) | Méta (car.) | Mots avant → après | Défauts de l'audit supprimés |
|---|---|---|---|---|
| word-to-pdf | Word to PDF Converter — DOCX, DOC, ODT, RTF & WPD Free (54) | 142 | 671 → ~556 | FORMAT titre/méta ; « deleted… we don't store or log it » (×2) ; « free, no signup » ; FAQ « install software » ; FAQ « previous in-browser converter » ; astuce générique |
| excel-to-pdf | Excel to PDF — XLSX, XLS, CSV & ODS, One Page per Sheet (55) | 142 | 618 → ~470 | FORMAT ; « deleted immediately » (×2) ; « free » ; astuce « every sheet in original order » (invérifiable) ; astuce qui ignorait la case « Fit each sheet on one page » |
| ppt-to-pdf | PowerPoint to PDF — PPTX, PPT, PPS & ODP Slides Free (52) | 138 | 726 → ~415 | FORMAT ; « deleted immediately » (×2) ; « free » ; « install software » ; « each slide… » remplacé par « every slide in our test decks », diapositives masquées et notes dites non testées ; FAQ historique ; astuce générique |
| html-to-pdf | HTML to PDF Converter — From a URL, a File or Pasted Code (57) | 148 | 741 → ~570 | FORMAT (mode URL absent du titre) ; FAQ quota vague → 20/heure, 60/jour, 300/heure tous visiteurs (URL) et limite > 4 Mo (fichier) ; « discarded immediately » ; astuce générique ; limites du mode URL ajoutées (MINCE) |
| epub-to-pdf | EPUB to PDF — Convert an Ebook to a Printable PDF Free (54) | 141 | 385 → ~443 | titre tronqué ; « deletes right after » ; « high-fidelity / rough print-dialog » ; « come through correctly » ; « free » ; « discarded immediately » ; astuce générique ; limites ajoutées (contenu préparé, 60 s, chapitres sautés, couverture non doublée) |
| mobi-to-pdf | MOBI to PDF — Kindle MOBI, AZW & AZW3 Books to PDF Free (55) | 147 | 445 → ~400 | titre tronqué ; « deletes right after » ; « high-fidelity » ; « come through correctly » ; « free » ; « discarded immediately » ; astuce générique ; **astuce de retrait de DRM supprimée** |
| markdown-to-pdf | Markdown to PDF — .md Files with Tables and Code to PDF (55) | 136 | 374 → ~428 | FORMAT (.markdown, .txt dits) ; « same way the reference converters » ; « free » ; « then discarded » ; « A4 PDF » → A4 par défaut + autres tailles ; astuce générique. « Clickable links » retiré (non mesuré) |
| text-to-pdf | Text to PDF — TXT to PDF with Emoji and World Scripts (53) | 149 | 566 → ~461 | « any language » ; « Not for Latin… » → exception symboles (flèche, coche) ; « font and layout are fixed » (FAUX) ; « free » |
| image-to-pdf | Image to PDF — Combine JPG, PNG, HEIC & More in One PDF (55) | 153 | 551 → ~491 | titre tronqué ; « exact pixel size » (×2) → « Fit to each picture », un pixel = un point, plafond `MAX_PAGE_POINTS` ; « Is my data secure » ; « on a phone » → téléphones et tablettes |
| jpg-to-pdf | JPG to PDF Converter — Photos to One PDF, A4 or Letter (54) | 143 | 546 → ~449 | « original pixel dimensions » (×2) ; « at full size » (HEIC > 48 MP) ; « on a phone » ; FAQ « free » ; FAQ identiques à image-to-pdf réécrites |
| pdf-to-word | PDF to Word Converter — Editable DOCX, DOC or RTF Free (54) | 151 | 652 → ~484 | « scanned PDFs are not supported » (invérifiable, retiré partout ; astuce PDF OCR) ; « deleted… don't store or log » (×2) ; « free » → limite par réseau + budget mensuel ; « install software » ; « OCR performed elsewhere » → PDF OCR du site ; astuce générique |
| pdf-to-excel | PDF to Excel Converter — Tables to an Editable XLSX Free (56) | 154 | 361 → ~407 | méta « free, no signup, 99 MB » ; FAQ « free » ; « leading online PDF converter » → iLovePDF, 23/09/2026 ; « deleted afterwards » (×2) ; FAQ « Up to 99 MB » (taille désormais calculée par `officeMaxLabel`) |
| pdf-to-ppt | PDF to PowerPoint — Each Page as an Editable PPTX Slide (55) | 154 | 294 → ~341 | idem pdf-to-excel (6 défauts) ; page MINCE complétée (ordre des pages, texte éditable, limite) |
| pdf-to-html | PDF to HTML — Extract PDF Text into a Simple HTML Page (54) | 146 | 366 → ~308 | FAQ « free » générique |
| pdf-to-image | PDF to Image — Pages as PNG, JPG, WebP, TIFF or BMP Free (56) | 147 | 490 → ~470 | « limited to 300 an hour » → 300/heure et 1 000/jour par visiteur ; PDF ≤ 44 Mo pour le repli ; 16 px |
| pdf-to-jpg | PDF to JPG — Every Page as a JPG, or Its Embedded Images (56) | 137 | 534 → ~448 | « 300 an hour » ; étape « Pick the format » (un seul format) ; texte copié de pdf-to-image réécrit (qualité 92/80, absence de transparence) |
| pdf-to-pdfa | PDF to PDF/A Converter — 1b to 3a, Checked by veraPDF (53) | 145 | 1 072 → ~547 | « industry-reference validator » ; « full PDF/A specification » ; « deleted immediately… never stored, logged » (×2) ; « one of the few tools » ; « free » ; étape « Click 'Convert' » → bouton « Convert to PDF/A-… » ; « most commonly required / widely accepted » |
| pdf-translate | PDF Translate — Translate a PDF's Text or the Whole File (56) | 151 | 358 → ~462 | sous-titre « any language with AI » (FAUX, chaîne d'interface corrigée) ; « no direct download option » (FAUX) ; « no PDF download » ; « daily limits » → limites réelles par mode ; texte servi limité au mode texte → les deux modes décrits en texte statique (le mode PDF entier « offered only when… set up ») ; « scanned pages translated too » retiré ; « we keep neither » |
| pdf-ai-summary | AI PDF Summary — Summarize a PDF's Text with GPT-4o mini (56) | 144 | 318 → ~345 | titre et méta « send your file » (FAUX) ; FAQ limite sans le budget mensuel |

Total : les 106 défauts de l'audit sont traités (supprimés ou corrigés). Aucun exemple : ce sont des outils de fichiers ; les
seuls résultats cités sont mesurés et datés dans un rapport du dépôt (fidélité Office 18-19/09/2026, HTML 19/09/2026, PDF to
Word 19/09/2026, PDF to Excel/PowerPoint contre iLovePDF 23/09/2026, Excel feuille longue 03/10/2026).

## Contrôles (06/10, après la dernière modification)
- `node scripts/p36/content-verify.mjs --only=pdf-tools/` : 39 pages, 39 réécrites, **0 défaut** ; part maximale de phrases
  identiques entre pages réécrites 14,3 % (pdf-to-excel / pdf-to-word).
- `node scripts/content-checks/instructions.mjs` : 4 écarts sur le site, **aucun dans pdf-1** (audio-compressor,
  api-tester, image-inverter, png-to-ico).
- `node scripts/content-checks/privacy-claims.mjs` : **aucun échec dans pdf-1** (3 phrases corrigées après le premier passage :
  markdown-to-pdf, mobi-to-pdf, pdf-to-pdfa). Les échecs restants sont sur pdf-compress, pdf-merge et d'autres pages hors lot.

## Points laissés de côté (non vérifiables)
- Fichiers PDF scannés dans PDF to Word / Excel / PowerPoint : comportement de ConvertAPI non mesuré ; rien n'est promis,
  seule l'astuce « run PDF OCR first » reste.
- Diapositives masquées et notes (PowerPoint to PDF), macros (.xlsm, .pptm) : non testées, dit ou non écrit.
- Délai de suppression sur le service média : la valeur `MEDIA_JOB_TTL_SECONDS` est dans l'environnement ; les pages disent
  « until your first complete download or a time limit », sans chiffre. Rien n'est affirmé sur un délai côté Gotenberg ou
  ConvertAPI (seul `StoreFile=false` est dit).
- pdf-translate : la disponibilité du mode « Whole PDF (layout kept) » en production dépend de variables d'environnement ;
  le texte le présente comme proposé « only when our Google Cloud Translation service is set up ».
- Liens cliquables dans Markdown to PDF : retirés, faute de mesure.

## Corrections après relecture (06/10)

Relecture : `docs/audit/p36/relecture/pdf-1.md` (46 lignes). Chaque ligne revérifiée dans le code ; **aucune rejetée** (preuves
relues : `@lingo-reader/epub-parser` `index.browser.mjs:83-87,684-701,1020-1024` ; `app/lib/mediaJob.js:267` ;
`RAPPORT-p30-convertapi-alertes-04-10.md:118` ; `PdfToImages.jsx:126-139,245-248` ; `lib/officeSymbolFonts.js` ;
`pdfImages.js:91-94,247-250,263-265` ; `isMobileDevice.js:5` ; `text-to-pdf/page.jsx:78-86` ; `pdf-ai-summary/page.jsx:88-90`).
Script appliqué : remplacements exacts, chacun trouvé une seule fois.

| # | Page | Correction |
|---|---|---|
| 1 | epub-to-pdf | Corrigée : FAQ 3 → « Yes, when the book is intact. A chapter file missing from the book comes out as an empty page, and a damaged book stops with an error message instead of a PDF. » (le compteur `skipped` est du code mort : bogue laissé au plan) |
| 2 | epub-to-pdf | Corrigée : « …unless the book's first page already shows the same cover image. » (« never appears twice » retiré) |
| 3 | epub-to-pdf | Corrigée : « embedded fonts (obfuscated fonts excepted) » |
| 4 | epub-to-pdf | Corrigée : étape 2 ajoute « or, for a large book, the upload and conversion progress » |
| 5-16 | 12 pages serveur | Corrigées : le résultat est supprimé « as soon as this page has received it / fetched it, or after a time limit » (formulation propre à chaque page) ; ligne 12 : phrase verbale rétablie |
| 17 | excel-to-pdf | Corrigée : « Formula results are printed as they are stored in the workbook; in our test files, formulas saved without a result were calculated. » ; FAQ 3 « showed the right values » |
| 18 | excel-to-pdf | Corrigée : « The other formats, except .xlt and .csv, were checked to convert » |
| 19 | excel-to-pdf | Corrigée : astuce limitée aux .xlsx, avis affiché dans le résultat (« convert again ») |
| 20 | html-to-pdf | Corrigée : Georgia → Liberation Serif et Arial → Liberation Sans |
| 21 | image-to-pdf | Corrigée : JPEG (sauf miroir), PNG et pages TIFF gardent leurs pixels ; WebP, GIF, BMP, AVIF et HEIC sous Safari redessinés ; ailleurs HEIC → page PNG sans perte |
| 22 | image-to-pdf | Corrigée : FAQ 2 réécrite de même |
| 23 | image-to-pdf | Corrigée : « (mirrored photos excepted) » |
| 24 | image-to-pdf | Corrigée : « On phones, iPhone and iPad » ; « other than a TIFF » ; FAQ 4 « computer or an Android tablet », « unless it is a TIFF » |
| 25 | jpg-to-pdf | Corrigée : « Not decoded (mirrored photos excepted) » |
| 26 | jpg-to-pdf | Corrigée : « Only mirrored JPEGs and WebP, GIF, BMP or AVIF pictures, plus HEIC in Safari, are drawn again; PNG and TIFF keep their pixels. » |
| 27 | jpg-to-pdf | Corrigée : « on phones, iPhone and iPad » / « computer or an Android tablet » |
| 28 | jpg-to-pdf | Corrigée : « in the order listed under the upload area » |
| 29 | text-to-pdf | Corrigée : « or "Upload File" to pick a .txt file » |
| 30 | text-to-pdf | Corrigée : ajout du passage par le service média au-delà de 4 Mo de HTML (`${…}`), import `OFFICE_STAGED_THRESHOLD_BYTES` |
| 31 | word-to-pdf | Corrigée : About « With a .docx, fields are not recalculated… our LibreOffice service, used for the other formats, can update it » ; FAQ 3 (test du 4 octobre 2026) |
| 32 | word-to-pdf | Corrigée : étape 3 ne parle plus que du convertisseur de secours ; FAQ 2 « When our LibreOffice service makes the PDF, Wingdings and Webdings symbols are not reproduced. » |
| 33 | word-to-pdf | Corrigée : « shows "Converting...", preceded by the upload percentage for a file over 4 MB » (`${…}`) |
| 34 | word-to-pdf | Corrigée : Q « Is the table of contents updated during conversion? » R « No for a .docx converted by ConvertAPI… » |
| 35 | ppt-to-pdf | Corrigée : « the button reads "Converting...", after an upload percentage for a deck over 4 MB » |
| 36 | pdf-to-word | Corrigée : Q « Do I still get a file if the .doc step fails? » R « Yes: you receive the .docx… » |
| 37 | pdf-to-image | Corrigée : spécification et confidentialité : échec immédiat ou 20 s, puis cette page et toutes les suivantes par le service |
| 38 | pdf-to-jpg | Corrigée : « after a failure or 20 seconds… that page and the following ones… A note below the button… » |
| 39 | pdf-to-jpg | Corrigée : spécification et confidentialité, même correction que 37 |
| 40 | pdf-ai-summary | Corrigée : « Above the summary » (About et FAQ 1) |
| 41 | 8 pages PDF | Corrigée : première étape propre à chaque outil (tables en Excel, pages en diapositives, texte en HTML, à traduire, à résumer…) |
| 42 | text-to-pdf, image-to-pdf | Corrigée : étapes 3 différenciées |
| 43 | ppt-to-pdf, mobi-to-pdf | Corrigée : étapes 3 différenciées |
| 44 | mobi-to-pdf | Corrigée : « Our Chromium service then prints the decoded chapters, each starting a new page, as a PDF whose text you can select. » |
| 45 | pdf-translate | Corrigée : « Which languages can a PDF be translated into? » |
| 46 | mobi-to-pdf | Corrigée : « Can a Kindle book bought from Amazon become a PDF? » |
| hors relevé | pdf-to-word | Sous-titre d'interface (`page.jsx`) : « Scanned PDFs are not supported. » → « Scanned PDFs were not tested. » (chaîne d'interface) ; image-to-pdf et pdf-to-html : la phrase sur les rapports d'erreur dit maintenant ce qui part (message nettoyé, nom de l'outil, nom et version du navigateur) |

Chaînes d'interface modifiées au total : sous-titre pdf-translate (phase 2), sous-titre pdf-to-word (phase 3).
Bogue de code signalé, non corrigé (plan) : EPUB to PDF, compteur de chapitres sautés jamais atteint (`epub-to-pdf/page.jsx:189`).

Contrôles après corrections : `content-verify --only=pdf-tools/` 39 pages, **0 défaut** ; `instructions.mjs` 1 écart sur le
site (video-tools/video-screenshot), **0 dans pdf-1** ; `privacy-claims.mjs` **0 échec dans pdf-1**.

## Corrections après deuxième passe (06/10)

| # | Pages | Correction |
|---|---|---|
| R1 | epub-to-pdf, excel-to-pdf, mobi-to-pdf, ppt-to-pdf (+ pdf-to-pdfa, même gabarit) | Corrigée : première étape propre à l'outil (« the DRM-free ebook (.epub) you want to print », « the workbook whose sheets you want in a PDF », « the Kindle book (.mobi, .azw or .azw3) to turn into pages », « the deck whose slides you want as PDF pages », « the PDF to archive, up to … ») |
| R2 | pdf-to-html, pdf-to-word, pdf-to-pdfa | Corrigée : « "Download" gives you the text as one .html page » ; « "Download" saves the editable document in the format you chose » ; « "Download" then keeps the validated PDF/A copy » |
| R3 | html-to-pdf, excel-to-pdf, markdown-to-pdf | Corrigée : étapes 3 différenciées (« saves the printed page », « saves the sheets as one PDF », « saves the rendered Markdown ») |
| R4 | pdf-to-html | Corrigée : phrase « The whole job runs in your browser with PDF.js. » retirée de l'About (la confidentialité le dit déjà) |
| R5 | epub-to-pdf, mobi-to-pdf, image-to-pdf, jpg-to-pdf | Corrigée (chaînes d'interface, dans `page.jsx`, aucun composant partagé) : sous-titres « Print a DRM-free EPUB ebook as a PDF » / « Turn a Kindle MOBI, AZW or AZW3 book into a PDF » / « Combine JPG, PNG, HEIC, WebP, GIF, BMP, TIFF or AVIF pictures, added in several rounds, into one PDF » / « Put a batch of photos in one PDF without recompressing the JPEGs » ; notes de taille réécrites différemment sur les deux pages et rendues exactes : JPEG miroirs décodés (`pdfImages.js:247-250`), borne `PHONE_MAX_MP` « on phones, iPhone and iPad » (`isMobileDevice.js:5`), TIFF non réductible (`pdfImages.js:151`) ; la mention « measured up to 200 megapixels » reste sur JPG to PDF (preuve C3) |
| R6 | pdf-to-word, pdf-ai-summary | Corrigée : « The limit message says how long to wait, or, for the monthly budget, the date it resets. » (`guard.js:22,33`) ; « Each summary costs us an OpenAI request on up to 8,000 characters (`${MAX_PROMPT_CHARS}`)… Reaching one shows how many minutes to wait, or the date the monthly budget resets. » |

Chaînes d'interface modifiées au total : sous-titres pdf-translate, pdf-to-word, epub-to-pdf, mobi-to-pdf, image-to-pdf,
jpg-to-pdf ; notes de taille image-to-pdf et jpg-to-pdf.

Contrôles : `content-verify --only=pdf-tools/` 39 pages, **0 défaut** ; `instructions.mjs` **0 écart** sur le site ;
`privacy-claims.mjs` **0 échec dans pdf-1**.
