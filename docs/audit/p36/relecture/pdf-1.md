# P36 — contrôle n° 2 : relecture indépendante du lot « pdf-1 » (19 pages)

Relu le 2026-10-05 par le réviseur indépendant « pdf-1 », en lecture seule. Textes lus dans les fichiers de travail actuels
(`app/tools/pdf-tools/<outil>/page.jsx` props de `<SeoContent>` et `layout.tsx` `metadata`). Chaque affirmation a été
comparée au code lui-même (pages, `app/lib/officeUpload.js`, `app/lib/mediaJob.js`, `app/lib/pdfImages.js`,
`app/lib/textPdf.js`, `app/lib/ebookHtml.js`, `app/components/PdfToImages.jsx`, `app/lib/serverPageRender.js`, routes
`app/api/*`, `lib/media/*`, `lib/quota/*`, `lib/officeSymbolFonts.js`, `services/media-processing`, `services/pdf-tools`,
`services/gotenberg`, `node_modules/@lingo-reader/*`) et aux rapports datés du dépôt. Les fiches de faits et le compte rendu
des rédacteurs n'ont servi qu'à s'orienter.

Valeurs calculées des `${…}` (service média configuré, comme sur www) : `officeMaxLabel()` et
`officeMaxLabel(MAX_HTML_STAGED_BYTES)` = 100 MB ; `officeMaxLabel(MAX_SPREADSHEET_STAGED_BYTES)` = 60 MB ;
`officeMaxLabel(MAX_PDF_TO_WORD_STAGED_BYTES)` = 99 MB ; `pdfToolsMaxLabel()` = 44 MB ;
`Math.round(OFFICE_STAGED_THRESHOLD_BYTES / 1048576)` = 4 ; `TAG_CHECK_MAX_BYTES / 1048576` = 20 ;
`MAX_DECODED_MP_COMPUTER` = 268 ; `PHONE_MAX_MP` = 48 ; `MAX_PAGE_POINTS` = 14,400 ; `MAX_PDF_TRANSLATE_PAGES` = 5 ;
`MAX_PDF_TRANSLATE_CHARS` = 3,000 ; `languages.length` = 10 ; `docLanguages.length` = 133 ; `MAX_PROMPT_CHARS` = 8,000.
Tous concordent avec les constantes du code. Les chiffres écrits en dur (`preuves/pdf-1.json`) ont été revérifiés à la
source : tous exacts (20/60/300 URL, 5 MB/150/3 MB/25 MB, 5 redirections, ports 80/443, 60 s EPUB, 9-24 pt, 200 Mpx
WebKit, 150/300/72 dpi, 60 s/20 s, 300/1 000 pages, 44 MB, 16 px, 92/80, 20 pages/20 MB/20 pages par jour, 30 000 lignes
du 03/10, 18-19/09 et 23/09). Le plafond du billet média (`MEDIA_TICKET_MAX_BYTES`, documenté à 1 GiB) ne réduit pas les
100 MB affichés.

Structure (point 6) mesurée sur les 19 pages : titres 52-57 caractères, méta 136-154 caractères et différentes du texte
About, About 75-97 mots, 3-4 étapes, 3-5 FAQ. Aucune page n'a d'exemple (point 7 sans objet : outils de fichiers).

## Relevé des défauts

Gravité : **G** = faux dans un cas courant ou promesse trompeuse ; **M** = faux dans un cas particulier ; **m** = imprécision ou doublon.

| # | Page | Endroit | Phrase (citation courte) | Problème | Preuve (fichier:ligne ou calcul) | Correction proposée |
|---|---|---|---|---|---|---|
| 1 | epub-to-pdf | FAQ 3 | « A chapter that is damaged or stored in an unsupported form is skipped, and the page then says how many chapters are missing » | **G — 1. Exactitude.** Le cas « chapitre sauté et compté » n'arrive jamais : `loadChapter()` de @lingo-reader ne renvoie jamais une valeur vide. Un fichier de chapitre absent donne un chapitre VIDE sans avertissement ; une entrée de manifeste absente ou une entrée ZIP abîmée lève une exception qui arrête toute la conversion (message d'erreur, aucun PDF). Le compteur `skipped` est du code mort. | `epub-to-pdf/page.jsx:189` (`if (!chapter)`) ; `node_modules/@lingo-reader/epub-parser/dist/index.browser.mjs:83-87` (fichier absent → `new Uint8Array()`), `:765-795` (`transformHTML` renvoie toujours un objet), `:1020-1024` (`this.manifest[id].href` → TypeError) | « Yes, when the book is intact. A chapter file missing from the book comes out as an empty page, and a damaged book stops with an error message instead of a PDF. » (ou corriger le code pour compter réellement les chapitres) |
| 2 | epub-to-pdf | FAQ 2 | « …unless the book's own first page already shows it, so it never appears twice » | **M — 1/4.** « never » n'est pas garanti : le test compare le base64 exact de la MÊME image (`includes`). Une première page qui montre la couverture depuis un autre fichier (autre résolution, autre format) la laisse en double. | `app/lib/ebookHtml.js:63` (`firstPageShowsCover`) | « …unless the book's first page already shows the same cover image. » (supprimer « so it never appears twice ») |
| 3 | epub-to-pdf | About | « with their images, style sheets and embedded fonts » | **m — 1.** Les polices « obscurcies » (IDPF / Adobe, fréquentes dans les EPUB de Sigil/calibre et des éditeurs, sans DRM) ne sont pas décodées par @lingo-reader : leurs octets bruts sont inlinés, la police est inutilisable et le texte retombe sur la police serif. | `index.browser.mjs:684-701` (« lingo-reader doesn't handle font obfuscation and it doesn't read the font file ») | « …style sheets and embedded fonts (obfuscated fonts excepted)… » |
| 4 | epub-to-pdf | Étape 2 | « the button shows "Parsing EPUB file..." … then "Rendering PDF..." » | **m — 2. Libellés.** Pour un livre dont le HTML préparé dépasse 4 MB (chemin par morceaux), le bouton n'affiche pas « Rendering PDF... » mais « Preparing... », « Uploading N% », « Converting... », « Downloading N% ». | `epub-to-pdf/page.jsx:246` ; `app/lib/officeUpload.js:29-37,46` ; `app/lib/mediaJob.js:79,106,132` | « …then "Rendering PDF..." (for a large book, the upload and conversion progress). » |
| 5 | epub-to-pdf | Confidentialité | « keeps the PDF until your first complete download or a time limit » | **m — 3. Lieu de traitement.** Le PDF n'attend pas le clic « Download » : la page le télécharge elle-même dès la fin de la conversion, et le service le supprime après ce premier transfert complet. Le texte promet moins que le code mais ne décrit pas ce qu'il fait. (Même défaut aux lignes 6 à 16.) | `app/lib/mediaJob.js:267` (`downloadResult` appelé dans `runStagedConversion`) ; `services/media-processing/app/main.py:214-240` (`jobs.delete_output` après un téléchargement complet) ; `jobs.py:7-9` | « …and deletes the PDF as soon as this page has received it, right after the conversion (or after a time limit if it never does). » |
| 6 | excel-to-pdf | Confidentialité | « the PDF is held there until it has been downloaded once or a time limit has passed » | m — 3, même cause que la ligne 5. | idem ligne 5 | idem ligne 5 |
| 7 | html-to-pdf | Confidentialité | « keeps the PDF until your first full download or a time limit » | m — 3, idem. | idem ligne 5 | idem ligne 5 |
| 8 | markdown-to-pdf | Confidentialité | « keeps the PDF until one complete download or a time limit » | m — 3, idem. | idem ligne 5 | idem ligne 5 |
| 9 | mobi-to-pdf | Confidentialité | « holds the PDF until it has been downloaded once, or until a time limit » | m — 3, idem. | idem ligne 5 | idem ligne 5 |
| 10 | ppt-to-pdf | Confidentialité | « stores the PDF only until you download it once or a time limit runs out » | m — 3, idem. | idem ligne 5 | idem ligne 5 |
| 11 | word-to-pdf | Confidentialité | « keeps the PDF until your first complete download or until a time limit passes » | m — 3, idem. | idem ligne 5 | idem ligne 5 |
| 12 | pdf-to-excel | Confidentialité | « keeps the workbook until it has been downloaded once or a time limit. » | m — 3, idem ; **et 6. Anglais** : « until … or a time limit » sans verbe est agrammatical. | idem ligne 5 | « …deletes the workbook as soon as this page has received it, or after a time limit. » |
| 13 | pdf-to-ppt | Confidentialité | « keeps the presentation until your first complete download or until a time limit » | m — 3, idem. | idem ligne 5 | idem ligne 5 |
| 14 | pdf-to-word | Confidentialité | « keeps the Word file until your first full download or a time limit » | m — 3, idem. | idem ligne 5 | idem ligne 5 |
| 15 | pdf-to-pdfa | Confidentialité | « keeps the PDF/A until your first full download or a time limit » | m — 3, idem (chemin `runStagedToolResult`). | `app/lib/mediaJob.js:289-296` ; `main.py:214-240` | idem ligne 5 |
| 16 | pdf-translate | Confidentialité | « the translated PDF waits on the media service until your first full download or a time limit » | m — 3, idem (`alwaysStage`). | `officeUpload.js:46` ; `mediaJob.js:267` | idem ligne 5 |
| 17 | excel-to-pdf | About | « Formulas are recalculated, so the PDF shows current values. » | **M — 4. Invérifiable (probablement faux pour un classeur enregistré par Excel).** Aucun réglage de recalcul n'est passé à LibreOffice (seul `singlePageSheets` est transmis ; rien dans `services/gotenberg`). Le recalcul mesuré l'a été sur des classeurs écrits par openpyxl, dont les formules n'ont pas de résultat enregistré ; pour un fichier enregistré par Excel, LibreOffice garde par défaut les résultats stockés (une fonction comme TODAY() montre la date d'enregistrement). | `app/api/convert-to-pdf/route.ts:147-151` (`officeOptions`) ; grep « recalc » vide dans `services/gotenberg` ; `docs/audit/RAPPORT-fidelite-office.md:63-64` ; `docs/audit/fixtures-fidelite/generate_fixtures.py:592-601` | « Formula results are printed as they are stored in the workbook; in our test files, formulas saved without a result were calculated. » (ou mesurer sur un classeur enregistré par Excel avec TODAY()) |
| 18 | excel-to-pdf | FAQ 3 | « The other formats were checked to convert, not measured. » | m — 4. Aucune preuve pour .xlt ni .csv : absents des 23 fichiers de `fixtures-p21-office` et de la liste de `gotenberg-compare.mjs` (seul .xls y figure). | `docs/audit/fixtures-p21-office/` (sheet.ods/.ots/.xlsb/.xlsm/.xltm/.xltx seulement) ; `scripts/p27/gotenberg-compare.mjs:34-45` | « The other formats, except .xlt and .csv, were checked to convert… » (ou les tester) |
| 19 | excel-to-pdf | Astuce | « the page names the font when your workbook uses one, so you can swap it before converting » | **M — 1.** (a) La détection Wingdings/Webdings ne lit que les .xlsx (rien pour .xls, .xlsm, .xlsb, .xlt*, .csv, .ods, .ots) ; (b) le nom n'apparaît qu'APRÈS la conversion, dans le bloc « PDF ready ». | `lib/officeSymbolFonts.js:22-41,91` (motifs docx/pptx/xlsx seulement, sinon `[]`) ; `excel-to-pdf/page.jsx:88-95` (avis dans `done`) | « For an .xlsx file, the result names Wingdings or Webdings when the workbook uses them: replace the font and convert again. » |
| 20 | html-to-pdf | FAQ 2 | « The one difference was the font: Georgia became Liberation Serif. » | m — 1. Le rapport cité relève deux substitutions : Georgia → Liberation Serif **et** Arial → Liberation Sans. | `docs/audit/RAPPORT-fidelite-office.md:189-190` | « The differences were the fonts: Georgia became Liberation Serif and Arial Liberation Sans. » |
| 21 | image-to-pdf | About | « JPEG photos are embedded as they are, while other formats are first drawn upright » | m — 1. Les PNG (et les pages TIFF, converties en PNG) ne sont pas redessinés : pdf-lib les intègre tels quels (`embedPng`). | `app/lib/pdfImages.js:263-265` | « …JPEG and PNG pictures keep their pixels, TIFF pages too; WebP, GIF, BMP, AVIF and HEIC are first drawn upright. » |
| 22 | image-to-pdf | FAQ 2 | « HEIC, WebP, AVIF, BMP and GIF pictures are redrawn first, as JPEG for photos… » | M — 1. Dans Chrome, Edge et Firefox, un HEIC passe par heic2any vers un **PNG**, puis est intégré sans perte (PNG) ; seul Safari le redessine en JPEG 92. | `app/lib/pdfImages.js:91-94` (`toType: 'image/png'`), `:263` | « WebP, AVIF, BMP and GIF pictures — and HEIC in Safari — are redrawn first, as JPEG for photos or PNG with transparency; elsewhere a HEIC becomes a lossless PNG page. » |
| 23 | image-to-pdf | Formats et limites (« Picture size on a computer ») | « JPEG: not limited by pixels, since it is not decoded » | m — 1. Un JPEG miroir (EXIF 2, 4, 5, 7) est décodé et soumis à la borne de 268 Mpx (48 au téléphone). | `app/lib/pdfImages.js:247-250` (`assertDecodable` puis `embedUpright`) | « JPEG: not limited by pixels (mirrored photos excepted)… » |
| 24 | image-to-pdf | Formats et limites (« On phones and tablets ») + FAQ 4 | « On phones and tablets … a larger picture can be reduced to 48 MP » | m — 1. (a) Une tablette Android sous Chrome/Edge est traitée comme un ordinateur (`userAgentData.mobile` = false) : borne 268 Mpx, pas de « Reduce » ; (b) un TIFF trop grand n'est jamais réductible. | `app/lib/isMobileDevice.js:5` ; `app/lib/pdfImages.js:151` (`reducible` exclut le TIFF) | « On phones and iPads… a larger picture other than a TIFF can be reduced to 48 MP » |
| 25 | jpg-to-pdf | Formats et limites (« JPEG photos ») | « Not decoded, so not limited by pixels » | m — 1. Même cas que la ligne 23 (JPEG miroir décodé et borné). | `app/lib/pdfImages.js:247-250` | « Not decoded (mirrored photos excepted), so not limited by pixels… » |
| 26 | jpg-to-pdf | FAQ 2 | « Only mirrored JPEGs and pictures in other formats are drawn again before they are added. » | m — 1. Les PNG (et TIFF, et HEIC hors Safari, via PNG) ne sont pas redessinés : intégrés par `embedPng`. | `app/lib/pdfImages.js:91-94,263` | « Only mirrored JPEGs and WebP, GIF, BMP or AVIF pictures (HEIC in Safari) are drawn again; PNG keeps its pixels. » |
| 27 | jpg-to-pdf | Formats et limites (« Other formats ») + FAQ 3 | « 48 MP on a phone or tablet » / « On a phone or tablet, a picture above 48 megapixels has to be reduced first » | m — 1. Même cas que la ligne 24 (tablette Android = ordinateur, TIFF non réductible). | `app/lib/isMobileDevice.js:5` ; `pdfImages.js:151` | « on a phone or an iPad » |
| 28 | jpg-to-pdf | FAQ 1 | « each becomes one page, in the order of the selection » | m — 1/4. L'ordre est celui de la liste que renvoie la fenêtre de fichiers du système (`Array.from(e.target.files)`), pas l'ordre des clics ; c'est la liste affichée sous la zone qui fait foi. | `jpg-to-pdf/page.jsx:22` | « …each becomes one page, in the order listed under the upload area. » |
| 29 | text-to-pdf | Étape 1 | « or "Upload File" to load a .txt file into the text box » | **M — 1/2.** En mode « Upload File », la zone de texte est remplacée par la zone de dépôt : le texte du fichier n'est chargé dans aucune zone de texte visible. | `text-to-pdf/page.jsx:78-86` (`mode === 'paste' ? <TextArea…> : <div…upload>`) | « Choose "Paste Text" and type, or "Upload File" to pick a .txt file. » |
| 30 | text-to-pdf | Confidentialité | « the text is sent to our Chromium service, which returns the PDF » | m — 3. Quand le HTML dépasse 4 MB, il passe d'abord, par morceaux, par le service média (chemin de `convertOffice`), comme les autres pages le disent ; non mentionné ici. | `text-to-pdf/page.jsx:48-53` ; `app/lib/officeUpload.js:46-55` | Ajouter : « Above 4 MB of text, it goes in parts through our media service, which deletes it after printing. » |
| 31 | word-to-pdf | About + FAQ 3 | « Fields are not recalculated » / « No field is recalculated during conversion » | **M — 1.** Vrai pour ConvertAPI (.docx), faux ou non mesuré pour LibreOffice : sur le même document, le repli LibreOffice a **recalculé** le sommaire ; .doc, .odt, .rtf, .wpd… passent tous par LibreOffice. | `docs/audit/RAPPORT-fidelite-office.md:48` (ConvertAPI : TOC non recalculée) ; `docs/audit/RAPPORT-p30-convertapi-alertes-04-10.md:118` (« LibreOffice le recalcule ») ; `app/api/convert-to-pdf/route.ts:43-58` | « With a .docx (ConvertAPI), fields are not recalculated… Our LibreOffice service, used for the other formats and as backup, can update a table of contents. » |
| 32 | word-to-pdf | Étape 3 + FAQ 2 | « a note under it tells you if a symbol font … was involved » / « the page warns you when a file uses them » | **G — 1.** La détection Wingdings/Webdings n'existe que dans le chemin LibreOffice et pour les seuls .docx/.xlsx/.pptx. Un .docx converti normalement (ConvertAPI) n'est jamais examiné ; .doc, .docm, .odt, .ott, .rtf, .wpd, .dot* non plus. L'avertissement n'apparaît donc que pour un .docx fait par le convertisseur de secours. Que ConvertAPI ne reproduise pas Wingdings n'est pas mesuré non plus. | `app/api/convert-to-pdf/route.ts:195-260` (`handleConvertApi`, sans détection) vs `:330-334` (`handleGotenberg`) ; `lib/officeSymbolFonts.js:22-41,91` | Étape 3 : « …a note under it tells you if our backup converter made the PDF. » FAQ 2 : retirer la phrase Wingdings ou la limiter à « With our LibreOffice backup, Wingdings and Webdings symbols are not reproduced. » |
| 33 | word-to-pdf | Étape 2 | « the button shows the upload percentage, then "Converting..." » | m — 2. Jusqu'à 4 MB (requête directe) le bouton n'affiche que « Converting... » ; le pourcentage n'existe qu'au-delà de 4 MB (chemin par morceaux). | `app/lib/officeUpload.js:29-31,46,59-60` ; `word-to-pdf/page.jsx:84` | « Click "Convert to PDF": the button shows "Converting..." (and the upload percentage first for a file over 4 MB). » |
| 34 | word-to-pdf | FAQ 3 | Q « Why is the table of contents out of date in my PDF? » R « No field is recalculated… » | m — 6. Question en « Why » : la réponse commence par « No » sans répondre par oui ou non. | — | Q « Is the table of contents updated during conversion? » R « No with ConvertAPI (.docx)… » (à fusionner avec la correction de la ligne 31) |
| 35 | ppt-to-pdf | Étape 2 | « wait while the button shows the upload and the conversion » | m — 2. Même cause que la ligne 33 : aucune progression d'envoi n'est affichée jusqu'à 4 MB. | `app/lib/officeUpload.js:29-31,46` ; `ppt-to-pdf/page.jsx:79` | « …the button shows "Converting..." (with the upload percentage first for a deck over 4 MB). » |
| 36 | pdf-to-word | FAQ 4 | Q « What if the .doc step fails? » R « No conversion is lost… » | m — 6. Même tournure : question ouverte, « No » détourné. | — | Q « Do I still get a file if the .doc step fails? » R « Yes: you receive the .docx… » |
| 37 | pdf-to-image | Formats et limites (« Time per page ») + Confidentialité | « on iPhone and iPad, 20 seconds before our service takes over » / « when a page is not drawn within 20 seconds, the PDF is sent to our own PDF service » | M — 1/3. (a) Le PDF est aussi envoyé AUSSITÔT quand le dessin échoue sur l'appareil (toute erreur, ex. pas de contexte de canevas), sans attendre 20 s ; (b) dès qu'une page est passée par le service, **toutes les pages suivantes** y vont directement, sans essai sur l'appareil. | `app/components/PdfToImages.jsx:98,117,126-139` (`remote = true` dans le `catch`) | « …when a page fails or is not drawn within 20 seconds, our PDF service draws it and every page after it… » |
| 38 | pdf-to-jpg | FAQ 4 | « The device draws each page first … A note above the button explains this before you start. » | **M — 1.** (a) La note est rendue **sous** le bouton, pas au-dessus ; (b) « each page first » est faux après le premier recours au service (pages suivantes envoyées directement). | `app/components/PdfToImages.jsx:245-248` (bouton puis note `data-server-render-note`) ; `:98,117,138` | « …our PDF service draws that page and the following ones… A note below the button explains this before you start. » |
| 39 | pdf-to-jpg | Formats et limites (« On iPhone and iPad ») + Confidentialité | « A page not drawn within 20 seconds is drawn by our service » / « a page the device has not drawn after 20 seconds » | M — 1/3. Même cause que la ligne 37 (échec immédiat, pages suivantes). | `PdfToImages.jsx:98,117,126-139` | idem ligne 37 |
| 40 | pdf-ai-summary | About + FAQ 1 | « Under the summary, the page says… » / « the note under the summary says it covers the first part » | **M — 1.** La note de couverture est affichée **au-dessus** du résumé (entre l'étiquette « Summary » et la zone de texte). | `pdf-ai-summary/page.jsx:88-90` | « Above the summary, the page says… » / « the note above the summary… » |
| 41 | pdf-to-excel, pdf-to-ppt, pdf-to-word, pdf-to-html, pdf-to-image, pdf-to-jpg, pdf-translate, pdf-ai-summary (8 pages) | Étape 1 | « Click or drop a PDF on the upload area. » | m — 5. Phrase **identique** sur 8 pages. | comparaison des props SeoContent (Jaccard 1,0) | Une première étape propre à chaque outil (ex. « Click or drop the PDF whose tables you want in Excel. ») |
| 42 | text-to-pdf, image-to-pdf | Étape 3 | « Click "Convert to PDF", then click "Download" when "Done!" appears. » | m — 5. Phrase identique sur les deux pages. | idem | Différencier (ex. Text to PDF : « …the PDF of your text… ») |
| 43 | ppt-to-pdf, mobi-to-pdf | Étape 3 | « When "PDF ready" is shown, click "Download" to save the PDF. » | m — 5. Phrase identique sur les deux pages. | idem | Différencier (« …to save the slides as a PDF », « …to save the book… ») |
| 44 | mobi-to-pdf (jumelle epub-to-pdf) | About | « The book is then assembled into one HTML document and printed by our Chromium service, each chapter on a new page and the text selectable. » | m — 5. Quasi identique à la phrase d'EPUB to PDF (« That material is assembled into one HTML document and printed by our Chromium service, with selectable text and each chapter starting on a new page »). | Jaccard 0,74 | Réécrire l'une des deux autour de ce qui est propre (MOBI : texte compressé PalmDOC/KF8 décodé ; EPUB : style sheets du livre) |
| 45 | pdf-translate (jumelle ai-tools/ai-translator) | FAQ 3 (question) | « Which languages can I translate into? » | m — 5. Question identique à celle d'AI Translator. | `app/tools/ai-tools/ai-translator/page.jsx` (SeoContent) | « Which languages can a PDF be translated into? » |
| 46 | mobi-to-pdf (jumelle converter-tools/mobi-to-epub) | FAQ 1 (question) | « Can I convert Kindle books bought from Amazon? » | m — 5. Quasi identique à MOBI to EPUB (« Can I convert Kindle books bought from a store? »). | Jaccard 0,70 | « Can a Kindle book bought from Amazon become a PDF? » |

## Observation hors du périmètre (texte d'interface, non compté)
- `pdf-to-word/page.jsx:71`, sous-titre de l'outil : « Scanned PDFs are not supported. » — le compte rendu des rédacteurs dit
  cette phrase « retirée partout » comme invérifiable ; elle reste dans l'interface, au-dessus d'un texte SEO qui ne la
  reprend plus.

## Totaux

Pages relues : **19**.

Défauts : **46 lignes, 47 manquements** (la ligne 12 porte deux manquements, 3 et 6 ; le doublon de la ligne 41 couvre 8 pages).

| Point de la liste | Nombre |
|---|---|
| 1. Exactitude | 20 (lignes 1, 2, 3, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 31, 32, 37, 38, 39, 40) |
| 2. Libellés | 3 (lignes 4, 33, 35) ; la ligne 29 relève aussi de ce point |
| 3. Lieu de traitement | 13 (lignes 5-16, 30) ; les lignes 37 et 39 relèvent aussi de ce point |
| 4. Invérifiable | 2 (lignes 17, 18) ; les lignes 2 et 28 relèvent aussi de ce point |
| 5. Générique / dupliqué | 6 (lignes 41-46) |
| 6. Structure / anglais | 3 (lignes 12 [anglais], 34, 36) |
| 7. Exemple | 0 (aucun exemple sur ces pages) |

Les plus graves : ligne 1 (EPUB : chapitres « sautés et comptés » qui n'existent pas), ligne 32 (Word : avertissement
Wingdings promis mais jamais émis pour un .docx normal ni pour les autres formats), ligne 31 (Word : « aucun champ
recalculé » faux côté LibreOffice), ligne 17 (Excel : « formulas are recalculated » non prouvé), lignes 38/40 (note dite
au-dessus / en dessous à l'inverse de l'écran), ligne 29 (Text to PDF : « load a .txt file into the text box »).

Pages **sans aucun défaut** : **aucune**. (pdf-to-html n'a que le doublon de l'étape 1, ligne 41 ; pdf-to-pdfa que la
ligne 15 ; markdown-to-pdf que la ligne 8.)

## Deuxième passe (06/10)

J'ai relu entièrement les 19 pages après les corrections : props de `<SeoContent>`, `metadata`, et aussi le sous-titre et
la note sous le H1. J'ai appliqué la même liste de contrôle, plus les précisions de la fin de
`CONSIGNES-REDACTION.md` : ouverture des FAQ, tablettes Android, rapports d'erreur, phrases génériques bannies,
sous-titres.

**Les 46 corrections ont été revérifiées dans le code : toutes sont exactes.**
- **EPUB to PDF :** chapitre manquant vide ou erreur, `index.browser.mjs:83-87,1020-1024` ; même image de couverture, `ebookHtml.js:63` ; polices obscurcies ; progression du chemin par morceaux.
- **Suppression du résultat :** « dès que la page l'a reçu, ou après un délai », sur les 12 pages, `mediaJob.js:267,292` et `main.py:214-240`.
- **Excel to PDF :** résultats stockés ; .xlt et .csv exclus ; avis limité aux .xlsx et affiché dans le résultat.
- **HTML to PDF :** deux substitutions de polices.
- **Image to PDF / JPG to PDF :** PNG et TIFF gardent leurs pixels ; HEIC en PNG hors Safari, `pdfImages.js:91-94,263` ; JPEG miroir exceptés ; « phones, iPhone and iPad » et « computer or an Android tablet », `isMobileDevice.js:5` ; TIFF non réductible, `pdfImages.js:151` ; ordre de la liste.
- **Text to PDF :** étape 1 ; passage par le service média, `text-to-pdf/page.jsx:48-53`.
- **Word to PDF :**
  - Champs : ConvertAPI ne les recalcule pas, LibreOffice peut le faire (rapport P30 du 04/10).
  - Wingdings : seulement avec LibreOffice.
  - Étape 3 : seul le convertisseur de secours est annoncé.
  - Pourcentage d'envoi au-delà de 4 MB.
  - FAQ reformulées.
- **PowerPoint to PDF :** pourcentage d'envoi au-delà de 4 MB.
- **PDF to Word :** FAQ « Do I still get a file… ».
- **PDF to Image / PDF to JPG :** échec immédiat ou 20 s, puis cette page et les suivantes, `PdfToImages.jsx:98,117,126-139` ; note « below the button », `:245-248`.
- **AI PDF Summary :** « Above the summary », `page.jsx:88-90`.
- **Doublons :** lignes 41 à 46 réécrites.
- **Rapports d'erreur (Image to PDF, PDF to HTML) :** message nettoyé, nom de l'outil, navigateur et version. Conforme à `reportError.js:142-155` : aucun fichier n'est joint par `reportShownMessage` ; le seul autre champ est la catégorie d'erreur.
- **Sous-titre de PDF to Word :** « Scanned PDFs were not tested. »

**Ouverture des FAQ :** conforme sur les 19 pages. Les questions fermées commencent par Yes, No ou un chiffre ; les
questions Which ou What commencent par la réponse directe.

**Structure :** titres 52-57 caractères, méta 136-154, About 71-103 mots, 3-4 étapes, 3-5 FAQ.

**Défauts restants : 6.** Tous relèvent du point 5 et sont de gravité m. Aucun défaut d'exactitude ni de confidentialité.

| # | Page | Endroit | Phrase (citation courte) | Problème | Preuve (fichier:ligne ou calcul) | Correction proposée |
|---|---|---|---|---|---|---|
| R1 | epub-to-pdf, excel-to-pdf, mobi-to-pdf, ppt-to-pdf | Étape 1 | « Click or drop an .epub file / a spreadsheet / a .mobi, .azw or .azw3 file / a presentation on the upload area. » | **5.** Gabarit banni « Click or drop a … on the upload area » repris tel quel. Seul le nom change ; rien n'est propre à l'outil. | `CONSIGNES-REDACTION.md`, dernière précision ; `epub-to-pdf/page.jsx:265`, `excel-to-pdf/page.jsx:105`, `mobi-to-pdf/page.jsx:276`, `ppt-to-pdf/page.jsx:102` | Dire ce qui est propre à l'outil, comme sur les pages PDF→ : « Click or drop the ebook (.epub, without DRM) you want to print », « …the workbook whose sheets you want in a PDF », « …the Kindle book (.mobi, .azw, .azw3) to turn into pages », « …the deck whose slides you want as PDF pages » |
| R2 | pdf-to-html, pdf-to-word, pdf-to-pdfa | Dernière étape | « click "Download" to save the .html file. » / « …to save the file. » / « …to save the PDF/A file. » | **5.** Phrase bannie « Click "Download" to save the … file. » | `pdf-to-html/page.jsx:110`, `pdf-to-word/page.jsx:111`, `pdf-to-pdfa/page.jsx:244` | Par exemple : « …"Download" gives you the text as one .html page per PDF », « …"Download" saves the editable document in the format you chose », « …"Download" keeps the validated PDF/A copy » |
| R3 | html-to-pdf, excel-to-pdf, markdown-to-pdf | Étape 3 | « Click "Convert to PDF", then click "Download" when / once "PDF ready" appears / is shown. » | **5.** Phrase quasi identique sur 3 pages (Jaccard 0,80 et 0,73). | `html-to-pdf/page.jsx:176`, `excel-to-pdf/page.jsx:107`, `markdown-to-pdf/page.jsx:136` | Différencier comme text-to-pdf et ppt-to-pdf l'ont été (« …"Download" saves the printed web page », « …the sheets as one PDF », « …the rendered Markdown ») |
| R4 | pdf-to-html | About, dernière phrase | « The whole job runs in your browser with PDF.js. » | **5.** Variante des phrases bannies « Everything runs in your browser. » ; quasi identique à PDF Compare (« The comparison runs in your browser with PDF.js. », Jaccard 0,73). La confidentialité le dit déjà. | `pdf-to-html/page.jsx:105` | Retirer, ou fusionner : « PDF.js reads the text layer inside this tab, and the .html is written there too. » |
| R5 | epub-to-pdf + mobi-to-pdf ; image-to-pdf + jpg-to-pdf | Sous-titre et note sous le H1 (chaînes d'interface) | « Convert EPUB ebooks to PDF » / « Convert MOBI ebooks to PDF » ; « Convert JPG, PNG, HEIC, WebP, GIF, BMP, TIFF or AVIF images to a PDF file » / « …to one PDF » | **5.** Sous-titres quasi identiques entre pages jumelles. La note de taille est mot pour mot la même sur Image et JPG to PDF. Cette note dit aussi « on a phone (a larger one can be reduced… first) », alors que la borne vaut sur iPhone et iPad et qu'un TIFF ne peut pas être réduit. | `epub-to-pdf/page.jsx:235`, `mobi-to-pdf/page.jsx:246` ; `image-to-pdf/page.jsx:67-68`, `jpg-to-pdf/page.jsx:55-56` ; `pdfImages.js:151` ; `isMobileDevice.js:5` | Sous-titres propres : « Print a DRM-free EPUB as a PDF » / « Turn a Kindle MOBI, AZW or AZW3 book into a PDF » ; « Combine pictures of any format, added in several rounds, into one PDF » / « Put a batch of photos in one PDF without recompressing the JPEGs ». Note : « …48 on phones, iPhone and iPad (a larger one, unless a TIFF, can be reduced first) », formulée différemment sur chaque page. |
| R6 | pdf-to-word, pdf-ai-summary (jumelles hors lot : ai-tools/background-remover, ai-tools/ai-chatbot) | FAQ « Is there a usage limit? » | « When a limit is reached, the page says when you can try again. » ; « Every summary is a paid request to OpenAI, so each network gets an hourly and a daily allowance, counted together with… » | **5.** Quasi identiques à Background Remover (« When a limit is reached, the page says when to try again. », 0,77) et à AI Chatbot (« Every reply is a paid request to OpenAI, so each connection gets… », 0,71). | Comparaison des props SeoContent du site | Reformuler avec ce qui est propre : « …the message gives the time of the next free conversion » ; « Each summary costs us an OpenAI request on up to 8,000 characters, so… » |

**Totaux de la deuxième passe :**
- **Par point :** 1 : 0, 2 : 0, 3 : 0, 4 : 0, 5 : 6, 6 : 0, 7 : 0.
- **Pages touchées :** epub-to-pdf, excel-to-pdf, mobi-to-pdf, ppt-to-pdf, html-to-pdf, markdown-to-pdf, pdf-to-html, pdf-to-word, pdf-to-pdfa, image-to-pdf, jpg-to-pdf, pdf-ai-summary.
- **Pages sans aucun défaut :** text-to-pdf, word-to-pdf, pdf-to-excel, pdf-to-image, pdf-to-jpg, pdf-to-ppt, pdf-translate (7).

## Troisième passe (06/10)

J'ai relu les 13 pages touchées : epub-to-pdf, excel-to-pdf, mobi-to-pdf, ppt-to-pdf, pdf-to-pdfa, pdf-to-html,
pdf-to-word, html-to-pdf, markdown-to-pdf, image-to-pdf, jpg-to-pdf, pdf-ai-summary et pdf-translate. J'ai relu à la fois
le texte de `<SeoContent>`, les `metadata`, le sous-titre et la note sous le H1.

Les six défauts de la deuxième passe sont corrigés, chacun vérifié dans le code :
- **R1, première étape :** elle est propre à l'outil sur epub, excel, mobi et ppt. pdf-to-pdfa a été corrigée aussi (« the PDF to archive, up to 44 MB »).
- **R2, dernière étape :** les trois phrases « Download … » de pdf-to-html, pdf-to-word et pdf-to-pdfa sont différenciées et exactes. pdf-to-word livre bien le format choisi, ou le .docx avec un avis en cas d'échec du .doc.
- **R3, étape 3 :** html, excel et markdown ont maintenant des étapes 3 distinctes.
- **R4, About de pdf-to-html :** la phrase « The whole job runs… » est retirée. Il reste 76 mots, et la section confidentialité dit toujours où le traitement a lieu.
- **R5, sous-titres :** ceux d'EPUB, MOBI, Image et JPG to PDF sont propres à chaque page et uniques sur le site (vérifié par recherche).
- **R5, notes de taille :** elles sont réécrites différemment sur Image et JPG to PDF et sont exactes. Les JPEG miroirs sont décodés (`pdfImages.js:247-250`). La limite de 48 Mpx vaut « on phones, iPhone and iPad » (`isMobileDevice.js:5`). Un TIFF ne peut pas être réduit (`pdfImages.js:151`). Les « 200 megapixels » de JPG to PDF sont prouvés (RAPPORT-p33 :151-152, WebKit).
- **R6, FAQ de limite d'usage :** pdf-to-word et pdf-ai-summary sont reformulées. Le message de limite donne bien les minutes à attendre (« Try again in about N minutes », `guard.js:22`) ou la date de remise à zéro du budget mensuel (`guard.js:33`). Les 8 000 caractères correspondent bien à `MAX_PROMPT_CHARS`.

Aucune phrase nouvelle n'est fausse, invérifiable, bannie ou dupliquée. Les plus proches voisines, entre 0,71 et 0,75,
sont des tournures de question ou des paraphrases déjà examinées et acceptées en deuxième passe. La structure est
inchangée et dans les bornes.

**0 défaut.** Les 19 pages du lot pdf-1 sont maintenant sans défaut.
