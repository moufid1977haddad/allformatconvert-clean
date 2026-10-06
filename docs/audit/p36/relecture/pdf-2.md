# P36 — relecture indépendante « pdf-2 » (20 pages PDF)

Relecteur indépendant, lecture seule. Code relu directement : chaque `page.jsx` / `layout.tsx`, fichiers voisins
(`config.js`, workers, `splitPlan.js`), `app/lib/*` importés (pdfDecrypt, pdfUnlock, pdfImages, pdfCarryOver, pdfRedact,
redactSanitize, serverPageRender, serverPageOcr, officeUpload, mediaJob, reportError, isMobileDevice, canvasLimit,
pdfTextImage, pdfActualText, codeTools), routes `app/api/{pdf-compress,pdf-ocr,pdf-repair,convert-to-pdf,media/ticket}`,
`lib/{pdfOcr.js,quota/*,media/stagedRoute.ts,providers/convertApi.js}`, `services/pdf-tools/{py/compress.py,src/*}`,
`services/media-processing/app/{jobs.py,main.py}`, rapports cités (`RAPPORT-ecarts-marche.md` §3a,
`RAPPORT-qualite-2-29-09.md`, `RAPPORT-p28-gotenberg-04-10.md`). Valeurs des `${…}` calculées depuis le code
(production : service média configuré) : `SERVER_MAX_LABEL` = 200 MB ; `OFFICE_STAGED_THRESHOLD_BYTES` = 4 MB ;
`pdfToolsMaxLabel()` = 44 MB ; `officeMaxLabel` = 100 MB (documents) / 60 MB (tableurs) ; `LANGUAGES.length` = 102 ;
`LOCAL_OCR_LIMIT_LABEL` = `LOCAL_PAGE_LIMIT_LABEL` = « 20 seconds » ; `STAGED_MAX_BYTES` = 44 MB.

Contrôles automatiques relancés : `node scripts/p36/content-verify.mjs --only=pdf-tools/` → 0 défaut (39 pages, max
14,3 %). Les défauts ci-dessous sont ceux qu'aucun contrôle automatique ne voit.

Gravité : **G** = grave (affirmation fausse sur le traitement ou le résultat), **M** = moyen, **m** = mineur.

## Relevé

| Page | Endroit | Phrase (citation courte) | Problème | Preuve (fichier:ligne ou calcul) | Correction proposée |
|---|---|---|---|---|---|
| pdf-compare | specs « Scanned PDFs » | « the page names the file and suggests PDF OCR » | [1] m — quand AUCUN des deux PDF n'a de texte, la page ne nomme aucun fichier (« Neither PDF has text… ») | `pdf-compare/page.jsx:94` | « No text to compare: the page says which file has none (or that neither has) and suggests PDF OCR » |
| pdf-compare | FAQ 1 | « Both. A line found only… » | [6] m — la réponse ne commence pas par Yes / No / un chiffre | règle 2d.4 | Question « Does it also show which words changed inside a line? » → « Yes. … » |
| pdf-compress | About | « resample each picture from the size it is displayed at … and keep the new JPEG only when it is smaller » | [1] M — (a) seules les images 8 bits RVB / gris d'au moins 64×64 sans masque à clé de couleur sont traitées (CMJN, indexées, 16 bits, masques : intactes) ; (b) une image n'est réduite que si elle dépasse 1,3 × la cible ; (c) une image réduite est gardée en JPEG **sans** comparaison de taille, une image non réduite seulement si le JPEG fait < 95 % de l'ancienne | `services/pdf-tools/py/compress.py:88-119` (l. 111 seuil 1/1,3 ; l. 118 test 0,95 seulement si taille inchangée) | « …resample the larger pictures from the size they are displayed at (150 / 72 dpi) and re-encode them as JPEG; a picture that is not resized is replaced only when the JPEG is smaller; CMYK and indexed pictures are left as they are » |
| pdf-compress | FAQ 2 | « converts Type 1 fonts only after checking that every glyph outline stays identical » | [1] M — le code compare la liste des glyphes et leurs **boîtes englobantes** à 0,5 unité près (BoundsPen), pas les contours | `compress.py:152-174` | « …only after checking that every glyph is still there with the same outline bounds » |
| pdf-compress | privacy | « where the upload and the result stay until your first complete download or the end of the service's retention time » | [3] m — le fichier envoyé est effacé dès que le résultat est déposé (ou dès l'échec / « not smaller ») ; seul le résultat attend le téléchargement complet ou la durée de conservation | `services/media-processing/app/jobs.py:216-255` (`_drop_input`), `main.py:240` ; `app/api/pdf-compress/route.ts:76` (`discard`) | « …uploaded in chunks to our media service; the upload is deleted as soon as the compressed file is ready, and that file after your first complete download or at the end of the service's retention time » |
| pdf-compress | specs « Larger files » | « refused on a phone or tablet » | [1] m — `isMobileDevice()` lit `userAgentData.mobile` (faux sur une tablette Android sous Chrome) et cherche « Mobile » dans l'UA (absent sur tablette Android Firefox) : ces tablettes ont le chemin ordinateur (jusqu'à 700 MB dans le navigateur) | `app/lib/isMobileDevice.js:5-9` | « refused on a phone or iPad » |
| pdf-compress | FAQ 1 | « It depends on the file. » | [6] M — anti-motif « It depends » (gabarit 2e) et ne commence pas par Yes / No / un chiffre | gabarit §2d.4, §2e | Commencer par le chiffre : « From 15% to 79% in our test of 23 September 2026: … » |
| pdf-compress | FAQ 3 | « Only if it opens without a password. » | [6] m — ne commence pas par Yes / No | §2d.4 | « Yes, if it opens without a password. … » |
| pdf-compress | privacy | (97 mots) | [6] m — section `privacy` > 90 mots (consigne de rédaction 40-90) | décompte du source | Raccourcir (la phrase « not by a third party » ou la dernière peuvent fusionner) |
| pdf-compress | méta + specs | « fonts are optimised » ; « structure-only optimisation » | [6] m — orthographe britannique, l'anglais demandé est américain | `layout.tsx:6,10` ; `page.jsx:248` | « optimized » ; « optimization » |
| pdf-crop | FAQ 3 | « The top is the edge you see… » | [6] m — ne commence pas par Yes / No / un chiffre | §2d.4 | Question « Is the top the edge I see on a rotated page? » → « Yes. … » |
| pdf-crop | FAQ 4 | « Nothing is saved. » | [6] m — idem | §2d.4 | Question « Can the margins be larger than the page? » → « No. Nothing is saved… » |
| pdf-crop (+ number-pages, forms, watermark) | About, dernière phrase | « Cropping runs in your browser with pdf-lib. » / « It all runs in your browser with pdf-lib. » | [5] m — quasi identique à la phrase de forms / watermark (« Everything runs in your browser with pdf-lib. », similarité 0,75) : phrase-gabarit qui reste vraie sur une autre page | comparaison de phrases sur tout `app/tools/*/page.jsx` | Fondre le lieu de traitement dans une phrase propre à l'outil (ex. crop : « pdf-lib changes the crop box in your browser ») |
| pdf-delete-pages | FAQ 1 | « Type them all in one go… » | [6] m — ne commence pas par Yes / No / un chiffre | §2d.4 | « Can I remove several pages at once? » → « Yes. Type them… » |
| pdf-editor | specs « Added text » | « size 6 to 72 » | [1] m — `min`/`max` du champ ne sont pas imposés : une taille tapée hors de 6-72 est utilisée telle quelle | `pdf-editor/page.jsx:457` ; `pdfEditor.worker.js:49-55` (aucune borne) | « Helvetica, Latin characters only; size field 6 to 72 » ou supprimer la plage |
| pdf-editor | howTo 1 | « a thumbnail of each page appears in the left panel » | [1] m — sous la largeur `lg` (téléphone, tablette en portrait) le panneau est au-dessus de la page, pas à gauche | `page.jsx:390` (`grid-cols-1 lg:grid-cols-[220px_1fr]`) | « …appears in the page panel » |
| pdf-editor | specs « Size limits » | « lower on phones and tablets » | [1] m — tablettes Android : limites ordinateur (même cause que compress) | `isMobileDevice.js:5-9` | « lower on phones and iPads » |
| pdf-editor (+ split, merge) | specs « Size limits » / « Size limit » / « Total size » | « Shown above the upload area; lower on phones and tablets » | [5] m — valeur **identique** sur pdf-editor et pdf-split, quasi identique sur pdf-merge (« A combined cap is shown above… », 0,82) | `pdf-editor/page.jsx:530`, `pdf-split/page.jsx:237`, `pdf-merge/page.jsx:266` | Donner la vraie valeur calculée : `${MAX_PAGES} pages / ${MAX_FILE_SIZE_LABEL}` (ordinateur) et `${MOBILE_…}` (téléphone, iPad) — différents par outil (merge : total des fichiers) |
| pdf-editor | FAQ 3 | « Text and pictures each have their own ✕ button… » | [6] m — ne commence pas par Yes / No | §2d.4 | « Can I remove something I added? » → « Yes. … » |
| pdf-editor | FAQ 4 | « Because added text uses the standard Helvetica font… » | [6] m — idem | §2d.4 | « Can I add Cyrillic, Greek or Arabic text? » → « No. … » |
| pdf-extract-text | privacy | « only a cleaned error description, without the file name or any text, is reported to us » | [3] m — le rapport envoie aussi l'extension du fichier, une tranche de taille et le navigateur | `app/lib/reportError.js:143-154` ; appel `pdf-extract-text/page.jsx:59` (avec `file`) | « …a cleaned error description, with the file type and an approximate size but never the file name or any text, is reported to us » |
| pdf-extract-text | FAQ 2 | « Most files store one column after the other; some interleave them » | [4] m — généralité sans mesure dans le dépôt | aucun rapport | Supprimer « Most files… » ; garder « Some PDFs interleave columns, and then their lines alternate. » |
| pdf-extract-text | FAQ 2 | « Not always. » | [6] m — commencer par « No » | §2d.4 | « No, not always. … » |
| pdf-forms | About + specs « Left unchanged » | « Read-only fields, signatures and push buttons are left alone » | [1] m — avec « Flatten the form » coché, `form.flatten()` aplatit **tous** les champs, ceux-là compris | `pdf-forms/page.jsx:96` | Ajouter « …unless you flatten the form, which turns every field into page content » |
| pdf-forms (+ watermark) | About, dernière phrase | « Everything runs in your browser with pdf-lib. » | [5] M — phrase **identique** sur pdf-forms et pdf-watermark | `pdf-forms/page.jsx:160`, `pdf-watermark/page.jsx:222` | Phrase propre à chaque outil (forms : « pdf-lib reads and fills the fields in your browser » ; watermark : « pdf-lib draws the mark in your browser ») |
| pdf-forms | FAQ 1 | « Because the PDF has no AcroForm fields… » | [6] m — ne commence pas par Yes / No | §2d.4 | « Can it fill a scan or a PDF with drawn boxes? » → « No. … » |
| pdf-forms | FAQ 3 | « Not with the standard PDF form font… » | [6] m — commencer par « No » | §2d.4 | « No. The standard PDF form font… » |
| pdf-forms | FAQ 4 | « Only when the values must stay as they are. » | [6] m — idem | §2d.4 | « Yes, but only when… » |
| pdf-merge | FAQ 3 (+ FAQ 1) | « other image formats are re-encoded as JPEG, or PNG when transparent » ; « a picture other than JPEG is re-encoded on the way » | [1] M — un PNG (opaque ou non) est intégré tel quel sans perte (`embedPng`) ; HEIC et TIFF sont décodés en PNG (sans perte) ; seuls WebP, GIF, BMP, AVIF et les JPEG à orientation miroir (EXIF 2/4/5/7) passent en JPEG q92 (PNG si transparence) | `app/lib/pdfImages.js:263` (PNG), `:92` (HEIC→PNG), `:86` (TIFF→PNG), `:247` + `:27-42` (miroir / uprightImage) | « JPEG and PNG pictures are embedded without re-encoding; HEIC and TIFF become lossless PNG; WebP, GIF, BMP and AVIF are re-encoded as JPEG, or PNG when transparent » |
| pdf-merge | specs « Usage limits » + FAQ 2 | « Conversions of .docx files are limited per network per hour and per day… » | [1] M — tout fichier Office de plus de 4 MB (pas seulement .docx) passe par un ticket d'envoi limité par réseau, par heure et par jour | `app/lib/officeUpload.js:46` ; `app/api/media/ticket/route.js:24-42` (seau `office_rate`) | « .docx conversions are limited per network per hour and per day within a monthly site budget; any Office file over 4 MB also counts against a per-network hourly and daily upload limit » |
| pdf-merge | About + FAQ 1 | « an image … becomes one page » ; « Each image becomes one page » | [1] m — un TIFF à plusieurs pages donne une page par image | `pdfImages.js:86`, `:264` (`morePages`) | « …becomes one page (a multi-page TIFF, one page per image) » |
| pdf-merge | specs « Total size » | « lower on phones and tablets » | [1] m — tablettes Android : limites ordinateur | `isMobileDevice.js:5-9` | « lower on phones and iPads » |
| pdf-number-pages | tips | « Choose the Big margin when the document already has a footer, so the number does not overlap it. » | [4] M — non vérifiable et souvent faux : Big = 54 pt du bord, donc **plus près** du corps de page où se trouve un pied de page ; aucun test | `pdf-number-pages/page.jsx:24` (`big: 54`), `:93` | « If the number overlaps a footer, try another margin or a top position. » (ou supprimer) |
| pdf-number-pages | FAQ 3 | « so numbers sit on the outer edge » | [1] m — vrai seulement avec une position à droite ; avec une position à gauche, les numéros impairs vont au bord intérieur | `page.jsx:91` | « …with a right-hand position, numbers then sit on the outer edge » |
| pdf-number-pages | FAQ 1 | « Tick Skip the first page (cover)… » | [6] m — ne commence pas par Yes / No | §2d.4 | « Can I start on page 2 with the number 1? » → « Yes. Tick… » |
| pdf-number-pages | FAQ 2 | « {p} is the last number written… » | [6] m — idem | §2d.4 | « Is {p} the total number of pages? » → « No. {p} is… » |
| pdf-number-pages | FAQ 3 | « It mirrors left and right positions… » | [6] m — idem | §2d.4 | « Can numbers alternate sides like a printed book? » → « Yes. … » |
| pdf-ocr | privacy + specs « On iPhone and iPad » | « a page that makes no progress for 20 seconds, and the pages after it, are recognized by our own OCR service » | [3] M — le PDF part aussi **immédiatement**, sans attendre 20 s, quand le moteur ne démarre pas ou qu'une étape échoue (erreur) sur iPhone / iPad | `pdf-ocr/page.jsx:160-168`, `:201-206` ; `app/lib/serverPageOcr.js:6` | « …a page that fails, or makes no progress for 20 seconds, and the pages after it… » ; specs : « A page that fails or is not recognized within 20 seconds… » |
| pdf-ocr | FAQ 4 | « Because the OCR engine and the data… » | [6] m — ne commence pas par Yes / No / un chiffre | §2d.4 | « Is the first run slower? » → « Yes. The engine… » |
| pdf-organize (+ reorder-pages) | About / privacy | « The new PDF is built in your browser with pdf-lib. » / « The new file is built in your browser with pdf-lib. » | [5] M — quasi identiques (similarité 0,89) sur deux pages jumelles | `pdf-organize/page.jsx:137`, `pdf-reorder-pages/page.jsx:115` | Une formulation propre à chacune (organize : « pdf-lib rebuilds the list you arranged… » ; reorder : déjà dit dans `privacy`, supprimer de l'About) |
| pdf-organize | FAQ 2 | « A bookmark that points to a removed page is dropped… » | [6] m — ne commence pas par Yes / No | §2d.4 | « Are bookmarks of removed pages kept? » → « No. … » |
| pdf-organize | FAQ 3 | « A blank page takes the visible size… » | [6] m — idem | §2d.4 | « Is a blank page the size of its neighbor? » → « Yes. … » |
| pdf-protect (+ unlock) | About, dernière phrase | « Encryption runs in your browser with @cantoo/pdf-lib. » / « Decryption runs in your browser with @cantoo/pdf-lib. » | [5] m — quasi identiques (0,78) sur deux pages jumelles | `pdf-protect/page.jsx:102`, `pdf-unlock/page.jsx:73` | Fondre dans une phrase propre (protect : « the file is encrypted in your browser before you download it ») |
| pdf-protect | FAQ 1 | « Every file gets AES-128. » | [6] m — commencer par le chiffre | §2d.4 | « 128-bit AES for every file. … » |
| pdf-protect | FAQ 2 | « Because copying is blocked by default… » | [6] m — ne commence pas par Yes / No | §2d.4 | « Can people copy text from my protected PDF? » → « No, not by default. … » |
| pdf-protect | privacy | (37 mots) | [6] m — < 40 mots (consigne de rédaction) | décompte | Ajouter un fait vrai (ex. le mot de passe des permissions aléatoire est créé dans le navigateur) |
| pdf-redact | specs « Pages without a match » + FAQ 4 | « Copied, minus stamps, attachments, media and links… » ; « Their text, images and ordinary links stay as they are » | [1] G — le fichier rendu perd **tous** ses signets (outline non copié), titre / auteur (Info non copié) et ses champs de formulaire ne fonctionnent plus (pas d'AcroForm, `/Parent` retiré des widgets) ; liens « launch » et fichiers distants retirés aussi | `pdf-redact/page.jsx:80` (`PDFDocument.create()`), `:138-145` (copyPages seul) ; `app/lib/redactSanitize.js:16-18` | Ajouter : « The redacted file keeps no bookmarks, document properties or fillable form fields. » (specs + FAQ 4) |
| pdf-redact | privacy | « a page with a match that the device cannot draw within 20 seconds is drawn by our own PDF service » | [3] M — le PDF part aussi immédiatement si le dessin échoue (erreur), sans attendre 20 s | `pdf-redact/page.jsx:175-179` ; `serverPageRender.js:6-7` | « …a page with a match that the device fails to draw, or does not draw within 20 seconds… » |
| pdf-redact | specs « On iPhone and iPad » | « drawn by our PDF service, up to 300 pages per hour… » | [1] m — limite par appareil absente : le service ne dessine que les PDF jusqu'à 44 MB (au-delà, échec) | `app/lib/serverPageRender.js:19`, `:43-46` | « …drawn by our PDF service, for PDFs up to 44 MB, up to 300 pages… » |
| pdf-redact | FAQ 1 | « Removed. » | [6] m — question à alternative, réponse sans Yes / No | §2d.4 | « Is the text really removed, not just covered? » → « Yes. … » |
| pdf-redact | FAQ 2 | « Mostly. » | [6] m — idem | §2d.4 | « Yes, mostly. … » |
| pdf-redact | FAQ 4 | « Their text, images and ordinary links… » | [6] m — idem | §2d.4 | « Do pages without a match stay as they were? » → « Yes, except… » (avec la correction ci-dessus) |
| pdf-reorder-pages | FAQ 1 | « Click Reverse order… » | [6] m — ne commence pas par Yes / No | §2d.4 | « Can I reverse the page order? » → « Yes. … » |
| pdf-reorder-pages | FAQ 2 | « Nothing is built. » | [6] m — idem | §2d.4 | « Can I type a page that does not exist? » → « No. … » |
| pdf-reorder-pages | privacy | (35 mots) | [6] m — < 40 mots | décompte | Compléter (ex. « a PDF that asks for a password to open is refused ») |
| pdf-repair | privacy | « where it and the result stay until your first complete download or the end of the service's retention time » | [3] m — même inexactitude que compress : le fichier envoyé est effacé dès le dépôt du résultat ou l'échec | `jobs.py:216-255` ; `lib/media/stagedRoute.ts:136,144,157` (`discard`) | Même correction que pdf-compress |
| pdf-repair (+ compress) | privacy + FAQ 4 | « uploaded in chunks to our media service, where it and the result stay until … » ; « each network may start a limited number of those uploads per hour and per day » | [5] m — quasi identiques à pdf-compress (privacy 0,69 ; FAQ 0,62) | `pdf-repair/page.jsx:192,197` ; `pdf-compress/page.jsx:252,257` | Reformuler une des deux pages |
| pdf-repair | FAQ 1 | « Pages that were overwritten or cut off cannot be recovered; in that case you get an explanation, with the exit codes … instead of a broken file » | [1] M — un fichier tronqué est souvent reconstruit et **livré** avec les pages restantes (méthode « rebuilt ») ; l'explication avec codes de sortie ne vient que si aucune méthode ne réussit ou si toutes changent le texte | `services/pdf-tools/src/repair.js:177-178` (note rebuilt:object-order), `:231`, `:254-268` | « Pages that were overwritten or cut off are lost: you get the pages that remain, with a note, or, when nothing usable can be rebuilt, an explanation with the exit codes… » |
| pdf-repair | specs « Text check » | « Ghostscript and Poppler must read the same text as in the damaged file » | [1] m — seuls les lecteurs qui ouvrent le fichier abîmé sont comparés ; si aucun ne l'ouvre, une réparation structurelle est livrée sans contrôle (avec avertissement) | `repair.js:158-165`, `:231` ; `pdf-repair/page.jsx:147-149` | « The text read by Ghostscript and Poppler must match the damaged file's; if neither can open it, the page warns that the text could not be checked » |
| pdf-repair | FAQ 2 | « Not without telling you. » | [6] m — commencer par « No » | §2d.4 | « No. A repaired file is delivered only… » |
| pdf-repair | FAQ 3 | « qpdf, the first one tried… » | [6] m — ne commence pas par Yes / No / un chiffre | §2d.4 | « Does qpdf keep my file closest to the original? » → « Yes. … » |
| pdf-rotate | privacy | « Only the rotation value of each chosen page changes, so everything else in the file is copied as it was. » | [1] M — un PDF qui s'ouvre sans mot de passe mais porte des restrictions est déchiffré puis enregistré **sans** chiffrement ni restrictions ; pdf-lib réécrit aussi la structure du fichier | `pdf-rotate/page.jsx:36` (`openablePdfBytes`) ; `app/lib/pdfDecrypt.js:41-53` | « Only the rotation value of each chosen page changes; a PDF with print or copy restrictions is decrypted in your browser first, so the copy has none. » |
| pdf-rotate | FAQ 2 | « The angle you choose is added… » | [6] m — ne commence pas par Yes / No | §2d.4 | « Does the angle replace a page's current rotation? » → « No. It is added… » |
| pdf-rotate | privacy | (38 mots) | [6] m — < 40 mots | décompte | Corrigé par la phrase ci-dessus |
| pdf-sign | About + FAQ 4 | « cropped to its ink on a transparent background » ; « The background between and around the strokes is transparent » | [1] M — faux pour une signature importée avec « Remove white background » décoché (image opaque entière posée, recouvre le texte) ou sur un papier plus sombre que le seuil 170-225 (fond gardé en partie) | `pdf-sign/page.jsx:152-170` (seuils), `:99` (recadrage sur l'alpha) | About : « …a drawn or typed signature is cropped to its ink on a transparent background; an uploaded one keeps its background unless "Remove white background" is ticked » ; FAQ 4 : idem |
| pdf-sign | FAQ 2 | « Choose "Where I drag it on the page"… » | [6] m — ne commence pas par Yes / No | §2d.4 | « Can I put the signature in an exact spot? » → « Yes. … » |
| pdf-split | specs « Size limit » | « lower on phones and tablets » | [1] m — tablettes Android : limites ordinateur | `isMobileDevice.js:5-9` | « lower on phones and iPads » |
| pdf-split | specs « Part names » | « …or the bookmark title » | [1] m — une partie par signet s'appelle nom du fichier + numéro + titre (ex. `report_01 Chapter.pdf`), pas le titre seul ; pair / impair → `report_odd.pdf` | `pdf-split/splitPlan.js:48`, `:83-88` | « Your file name plus the pages (report_1-3.pdf), odd / even, or a number and the bookmark title » |
| pdf-split | FAQ 2 | « Choose Select pages… » | [6] m — ne commence pas par Yes / No | §2d.4 | « Can I extract only some pages into one PDF? » → « Yes. … » |
| pdf-split | privacy | (28 mots) | [6] m — < 40 mots | décompte | Compléter (ex. limites d'appareil, mot de passe) |
| pdf-unlock | FAQ 2 | « It means the password does not match the file. » | [6] m — ne commence pas par Yes / No | §2d.4 | « Does "Wrong password?" mean the password does not match? » → « Yes. … » |
| pdf-unlock | FAQ 3 | « Because it is not protected… » | [6] m — idem | §2d.4 | « Do I get a file for a PDF that is not protected? » → « No. … » |
| pdf-unlock | privacy | (27 mots) | [6] m — < 40 mots | décompte | Compléter (ex. le mot de passe du propriétaire marche aussi, rien n'est gardé après fermeture de l'onglet) |
| pdf-watermark | About + specs « Text » | « stamps text in any language » ; « Any script » | [4] m — le texte hors Helvetica est dessiné avec les polices du système du visiteur (`system-ui, "Segoe UI", "Noto Sans"`) : une écriture sans police installée donne des carrés | `app/lib/pdfTextImage.js:12` | « Text in most scripts (drawn with your device's fonts) » |
| pdf-watermark | FAQ 2 | « Over the content suits most documents… » | [6] m — ne commence pas par Yes / No | §2d.4 | « Can the watermark go under the text? » → « Yes. … » |
| pdf-watermark | privacy | (39 mots) | [6] m — < 40 mots | décompte | Ajouter un fait vrai |

Notes (non comptées) :
- La valeur de specs « Your file name followed by -….pdf » se répète sur 6 pages (delete-pages, number-pages, protect,
  reorder-pages, rotate, watermark) avec seul le suffixe qui change : c'est un fait propre à chaque outil, gardé.
- La question « Are bookmarks and form fields kept? » est identique sur pdf-merge et pdf-unlock, mais les réponses
  diffèrent réellement (gabarit §2d.5) : gardé.
- Les règles §2d.3 (« How do I… » permis) et §2d.4 (réponse commençant par Yes / No / chiffre) se contredisent pour les
  questions « How / What / Why » ; appliqué ici à la lettre (défauts [6] « m »), le propriétaire peut lever ce point.
- Vérifié juste (extraits) : Redact patrons (9-15 chiffres, 13-19 + Luhn), quotas 300 / 1 000 pages (constantes de
  `lib/quota/config.js`, pas d'environnement), OCR 102 langues, jsdelivr, `textonly_pdf=1`, couche non doublée (≥ 50 %),
  OCR 0,8 % (rapport 29/09), compress 200 MB / 700 MB / 100 MB et chiffres du 23/09, Lossless identique au pixel, tx
  installé, ConvertAPI `StoreFile=false`, Merge LibreOffice de secours, Unlock par mot de passe propriétaire (code de
  `@cantoo/pdf-lib`), Protect AES-128 (V = 4 contrôlé), Repair 248 fichiers (rapport P28), étiquettes citées (contrôle
  `instructions.mjs` à zéro, relu à la main).

## Bilan

- Pages relues : **20**.
- Défauts : **76** (G 1 · M 13 · m 62).
  - [1] Exactitude : **21**
  - [2] Libellés : **0**
  - [3] Lieu de traitement (`privacy`) : **5**
  - [4] Invérifiable : **3**
  - [5] Générique / dupliqué : **6**
  - [6] Structure (FAQ Yes / No / chiffre, longueur `privacy`, anglais américain) : **41**
  - [7] Exemple : **0** (pages fichier, sans exemple)
- Pages **sans aucun défaut** : aucune.

## Deuxième passe (06/10)

Relu à nouveau en entier : les 20 `layout.tsx` (titre, méta, openGraph), toutes les props `SeoContent`, les sous-titres
et notes d'interface modifiés (liste « Corrections après relecture » de `redaction/pdf-2.md`), les imports ajoutés
(`STAGED_MAX_BYTES` exporté par `app/lib/serverPageRender.js:19`, bien importé dans Redact et OCR). Code revérifié pour
chaque nouvelle phrase (pdfImages HEIC / TIFF / PNG, rapports d'erreur, `withTempDir`, `_drop_input`, `discard`,
`isMobileDevice`, `splitPlan.partName`, pdfSplit.worker `openablePdfBytes`, `form.flatten`, seuils de Sign).
Contrôles : `content-verify --only=pdf-tools/` 0 défaut (max 9,5 %) ; `instructions.mjs` 0 écart ; `privacy-claims.mjs`
0 échec. Règle FAQ appliquée selon les précisions du 06/10 (`CONSIGNES-REDACTION.md`). Les 76 défauts de la première
passe sont corrigés ; l'écart « Size limit » sans 700 MB / 2 000 pages est accepté (les trois lignes renvoient à la
limite affichée, ce qui est exact : `pdf-editor/page.jsx:371-373`, `pdf-merge/page.jsx:195`, `pdf-split/page.jsx:147`).

| Page | Endroit | Phrase (citation courte) | Problème | Preuve (fichier:ligne ou calcul) | Correction proposée |
|---|---|---|---|---|---|
| pdf-compress | FAQ 1 | « 15.2% to 78.8% smaller in our test of 23 September 2026 » | [1] M — fourchette fausse : dans ce même test, Lossless sur le PDF de six photos n'a gagné que 0,1 % ; la fourchette réelle est 0,1 % à 78,8 % | `docs/audit/RAPPORT-ecarts-marche.md:98` (« Nous sans perte » : −0,1 %) | « 0.1% to 78.8% smaller in our test… » et ajouter « Lossless saved only 0.1% on the photos » |
| pdf-compare | FAQ 2 | « The page names the file that has no text » | [1] m — la question porte sur DEUX PDF scannés : dans ce cas la page ne nomme aucun fichier (« Neither PDF has text to compare… ») | `pdf-compare/page.jsx:94` | « The page says that neither PDF has text; run both through PDF OCR… » |
| pdf-compress | note d'interface « Extreme » | « Images reduced to screen resolution (72 dpi). » | [1] m — seules les images au-delà de 1,3 × la cible sont réduites (la note « Recommended » corrigée dit « Larger images ») ; incohérent entre les deux cartes | `pdf-compress/page.jsx:20` ; `services/pdf-tools/py/compress.py:106-112` | « Smallest file. Larger images reduced to 72 dpi and saved as JPEG. » |
| pdf-merge | FAQ 3 | (73 mots) | [6] m — réponse > 70 mots | décompte du source | Retirer « and the page warns you when that happens » ou fondre la phrase .docx |
| pdf-reorder-pages | About | (aucune phrase sur le lieu de traitement) | [6] m — l'About ne dit plus où le fichier est traité (gabarit §2c : obligatoire) ; la phrase a été supprimée au lieu d'être reformulée | `pdf-reorder-pages/page.jsx:115` | Ajouter une phrase propre : « Your browser copies the pages into the new file. » |
| pdf-reorder-pages | FAQ 2 | « No. Nothing is built: A number past the last page… » | [6] m — majuscule après deux-points (anglais incorrect) | `pdf-reorder-pages/page.jsx` FAQ 2 | « No. Nothing is built: a number past the last page… » |
| pdf-repair | FAQ 3 | « Yes. qpdf, the first method tried, it rebuilds the cross-reference table… » | [6] m — phrase agrammaticale (sujet doublé) | `pdf-repair/page.jsx` FAQ 3 | « Yes. qpdf, the first method tried, rebuilds the cross-reference table… » |
| pdf-unlock | privacy | « The unlocked copy exists only in this tab until you download it, and closing the tab discards it. » | [5] m — phrase quasi identique à image-tools/add-border-to-image (« The framed copy lives only in this tab until you download it; closing the tab discards it », 0,67), vraie sur n'importe quel outil navigateur | comparaison de phrases sur `app/tools/*/page.jsx` | Remplacer par un fait propre à Unlock (ex. « The password is never stored, not even in this tab, once the copy is made. » si vérifié, sinon supprimer) |
| pdf-rotate / pdf-watermark | howTo, dernière étape | « Click "Rotate PDF" and take the -rotated.pdf copy with the "Download" button. » / « Click "Add Watermark" and take the -watermarked.pdf copy with the "Download" button. » | [5] m — nouvelle formule-gabarit, quasi identique entre les deux pages (0,64) | `pdf-rotate/page.jsx`, `pdf-watermark/page.jsx` (howTo 4) | Dire ce qu'on obtient de propre : rotate « …the pages you listed come out turned » ; watermark « …each page in the range carries the mark » |

Bilan deuxième passe : **9 défauts** (G 0 · M 1 · m 8) — [1] 3 · [2] 0 · [3] 0 · [4] 0 · [5] 2 · [6] 4 · [7] 0.
Pages sans aucun défaut : pdf-crop, pdf-delete-pages, pdf-editor, pdf-extract-text, pdf-forms, pdf-number-pages,
pdf-ocr, pdf-organize, pdf-protect, pdf-redact, pdf-sign, pdf-split (12 pages).

## Troisième passe (06/10)

Pages touchées relues en entier (méta, About, étapes, specs, privacy, FAQ, astuces, chaînes d'interface) : pdf-compare,
pdf-compress (dont la note « Extreme » : « Larger images reduced to 72 dpi and saved as JPEG », conforme à
`compress.py:106-112`), pdf-merge, pdf-reorder-pages, pdf-repair, pdf-unlock, pdf-rotate, pdf-watermark.
Vérifié : fourchette « 0.1% to 78.8% » et preuve ajoutée (`RAPPORT-ecarts-marche.md:98`, motif de `preuves/pdf-2.json`
présent) ; FAQ 2 de Compare conforme au message « Neither PDF has text » (`page.jsx:94`) ; méta Compare 154 caractères ;
FAQ 3 de Merge 65 mots ; About de Reorder (105 mots) avec lieu de traitement ; Repair FAQ 3 grammaticale ; privacy
d'Unlock (48 mots) exacte (`@cantoo/pdf-lib` dérive la clé d'un mot de passe vide, `pdfUnlock.js:13-14`) et sans
phrase partagée ; dernières étapes de Rotate et Watermark distinctes. Contrôles : `content-verify --only=pdf-tools/`
0 échec, `instructions.mjs` 0 écart, `privacy-claims.mjs` 0 échec ; aucune nouvelle phrase dupliquée.

**0 défaut.** Les 20 pages pdf-2 sont sans défaut.
