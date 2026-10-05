# P36 Lot 2 — audit « pdf-2 » (20 outils PDF)

Source du texte servi : `docs/audit/p36/contenu-avant.json`. Code lu : `app/tools/pdf-tools/<outil>/{page.jsx,layout.tsx,config.js,*.worker.js,splitPlan.js}`, `app/components/{SeoContent.tsx,FileDownload.jsx,UploadPrompt.jsx}`, `app/lib/{pdfDecrypt,pdfUnlock,pageRange,pdfCropBox,pdfTextLayout,pdfActualText,pdfImages,officeUpload,mediaJob,serverPageRender,serverPageOcr,pdfRedact,fileChecks,isMobileDevice,canvasLimit,useToolError,reportError,codeTools}.js`, `lib/quota/{limits,guard,config,pdfOcrRateLimit}.js`, `lib/pdfOcr.js`, routes `app/api/{pdf-compress,pdf-repair,pdf-ocr,pdf-render,convert-to-pdf,media/ticket}`, services `services/pdf-tools/{src,py}`, `services/media-processing/app/jobs.py`.

## Remarque préalable (non comptée comme défaut) — valeurs qui dépendent du build

Le HTML extrait dit « 4 MB » pour les fichiers Office de Merge PDF (FAQ 4) et pour PDF Repair (interface, étape 1, FAQ 5). Ces textes sont calculés par `officeMaxLabel()` / `pdfToolsMaxLabel()` : 4 Mo quand `NEXT_PUBLIC_MEDIA_SERVICE_URL` est absent du build, sinon 100 Mo (Word/PowerPoint), 60 Mo (tableurs), 44 Mo (Repair) (`app/lib/officeUpload.js:16-17,111-112`, `lib/quota/limits.js:53,64,80,93`). Le build qui a servi à `contenu-avant.json` n'avait donc pas cette variable. Le rédacteur doit garder l'expression calculée, jamais un chiffre en dur. **Conséquence réelle pour Compress** (défaut compté plus bas) : son texte « 200 MB » est une constante (`page.jsx:15`) alors que le plafond serveur réel tombe à 4 Mo sans cette variable (`page.jsx:45`).

Phrase « Yes, it's (completely) free with no signup required » : classée **GÉNÉRIQUE** sur les outils 100 % navigateur ; classée **TROMPEUR** sur les outils où une partie des cas passe par une route ou un ticket limité par réseau (Compress, Merge, Repair, Redact, OCR n'a pas cette FAQ).

---

## /tools/pdf-tools/pdf-compare

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| pdf-compare | titre | « Compare PDF — Extract the Text Content Online Free » | MINCE | La fonction principale est le marquage ligne par ligne des différences (Myers, espaces ignorés) avec numéro de page et mots changés : `page.jsx:51-65,95-104` | Titre qui dit « comparer deux PDF et marquer les différences » |
| pdf-compare | méta | « then displays both extractions side by side as text » | TROMPEUR | Le résultat affiché d'abord est la liste des différences rouge/vert + compte « N line(s) only in … » (`page.jsx:92-104`), les deux textes ensuite (`page.jsx:106-117`) | Dire : lignes propres à chaque PDF en rouge/vert, mots changés, page de chaque ligne, puis textes complets |
| pdf-compare | FAQ 2 | « using the Myers diff algorithm (as Diffchecker and git) » | INVÉRIFIABLE | Le code utilise jsdiff `diffArrays` (`app/lib/codeTools.js:49-54`) ; rien dans le dépôt sur l'algorithme de Diffchecker | Retirer « as Diffchecker and git » |
| pdf-compare | FAQ 4 | « those panels will come out empty » | TROMPEUR | Si un PDF n'a pas de texte, les deux zones de texte ne s'affichent pas (`text1 && text2`, `page.jsx:106`) et un message nomme le fichier et renvoie à PDF OCR (`page.jsx:94`) | Citer le message réel et le renvoi à PDF OCR |
| pdf-compare | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | — | Remplacer par un fait propre à l'outil (ex. : aucune limite de taille codée, rien n'est envoyé) |

## /tools/pdf-tools/pdf-compress

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| pdf-compress | interface (téléphone) | « Larger files, up to 100 MB on this device, get a lighter in-browser optimisation » | FAUX | Sur téléphone, voie navigateur seulement si taille > plafond serveur (200 Mo) mais tout fichier > max(200, 100) = 200 Mo est refusé : la voie navigateur est inatteignable (`page.jsx:45-49,58-61`) | Sur téléphone : « jusqu'à 200 Mo, au-delà refusé » (quand le service est configuré) |
| pdf-compress | FAQ 5 | « (100 MB / 300 pages on phones and tablets), get the in-browser structure-only optimisation » | FAUX | Même logique `page.jsx:45-49,58-61` | Même correction |
| pdf-compress | interface / about / FAQ 4 / FAQ 5 / astuce 4 | « Files up to 200 MB are compressed with our full engine » | TROMPEUR | Libellé constant (`page.jsx:15`) ; plafond réel `serverMax` = 4 Mo si `NEXT_PUBLIC_MEDIA_SERVICE_URL` absent (`page.jsx:45`), et le build extrait n'avait pas cette variable (voir remarque) | Afficher la valeur calculée `serverMax`, pas la constante |
| pdf-compress | FAQ 6 | « Does it work on password-protected PDFs? No. » | TROMPEUR | Un PDF à restrictions seules (s'ouvre sans mot de passe) est compressé : pikepdf l'ouvre sans mot de passe (`services/pdf-tools/py/compress.py:285`), voie navigateur déchiffre (`app/lib/pdfDecrypt.js:41-54`) ; seul un PDF à mot de passe d'ouverture est refusé (`services/pdf-tools/src/compress.js:33-38`) | Distinguer : mot de passe d'ouverture → refusé (message réel) ; restrictions seules → traité |
| pdf-compress | FAQ 1 | « Yes, it's free with no signup required. » | TROMPEUR | > 4 Mo : envoi par ticket `/api/media/ticket`, limité par réseau à l'heure et au jour (`app/api/media/ticket/route.js:34-42` ; `page.jsx:95,111-121`) | Dire la limite par réseau pour les fichiers > 4 Mo |
| pdf-compress | FAQ 4 | « deleted after you download the result (or automatically after a short time if you don't) » | INVÉRIFIABLE | ≤ 4 Mo : dossier supprimé à la fin de la requête (`services/pdf-tools/src/server.js:28-41`) ; > 4 Mo : résultat supprimé après le 1er téléchargement complet ou au bout de `MEDIA_JOB_TTL_SECONDS` (`services/media-processing/app/jobs.py:6-13`), valeur en variable Railway (README : 900 s) | Décrire les deux cas ; la durée exacte doit être confirmée par le propriétaire |
| pdf-compress | FAQ 3 | « Lossless does not: nothing is re-encoded » | TROMPEUR | Au niveau Lossless aussi, les polices Type 1 sont converties en CFF par tx et les sous-ensembles TrueType fusionnés (`compress.py:301-306`) ; seules les images ne sont pas touchées (`compress.py:28-29,287`) | « aucune image ré-encodée ; polices converties à contours prouvés identiques ; rendu identique » |
| pdf-compress | astuce 1 | « Scanned documents and photo-heavy PDFs shrink the most with Recommended or Extreme » | TROMPEUR | Mesure du dépôt : 6 photos −15,2 % en Recommended contre −40,6 % pour l'article texte (`docs/audit/RAPPORT-ecarts-marche.md:97-98`) | « Les photos gagnent surtout avec Extreme (−79 % mesuré) » |
| pdf-compress | astuce 2 | « Text-only PDFs (reports, papers) often shrink a lot even with Lossless » | INVÉRIFIABLE | Une seule mesure (1 article, −35,4 %) `RAPPORT-ecarts-marche.md:97` | Citer la mesure unique au lieu de « often » |

## /tools/pdf-tools/pdf-crop

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| pdf-crop | interface (sous-titre) | « Crop and resize PDF pages » | TROMPEUR | Seule la CropBox change (`page.jsx:46`), aucune mise à l'échelle | « Trim the margins of PDF pages » |
| pdf-crop | astuce 4 | « Use the same margins across a batch of similarly formatted documents » | GÉNÉRIQUE | Un fichier à la fois (`page.jsx:65`) | Supprimer ou remplacer par un fait (ex. recadrage cumulatif, contenu caché gardé) |
| pdf-crop | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | — | Fait propre à l'outil |

## /tools/pdf-tools/pdf-delete-pages

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| pdf-delete-pages | titre | « Remove the Page Numbers You Specify » | TROMPEUR | Se lit « enlever les numéros de page » ; le code supprime des pages (`page.jsx:53`) | « Delete pages from a PDF by number or range » |
| pdf-delete-pages | méta / about | « removes the page numbers you specify » | TROMPEUR | Idem | Idem |
| pdf-delete-pages | about | (2 phrases seulement) | MINCE | Manquent : plages « 5-7 », « 10- » (`app/lib/pageRange.js:4-19`), au moins une page doit rester (`page.jsx:52`), nom `<nom>-edited.pdf` (`page.jsx:89`), PDF protégé (`app/lib/pdfDecrypt.js:32-53`) | Ajouter ces faits |
| pdf-delete-pages | astuce 4 | « Keep your original file until … — the tool can't undo a deletion » | GÉNÉRIQUE | Le fichier d'origine n'est jamais modifié (copie téléchargée) | Supprimer |
| pdf-delete-pages | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | — | Fait propre |

## /tools/pdf-tools/pdf-editor

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| pdf-editor | astuce 2 | « for straight lines or boxes, use the Highlight tool instead » | FAUX | Highlight dessine un rectangle plein à 35 % d'opacité (`pdfEditor.worker.js:59-67`, `page.jsx:192`), ni trait ni cadre | « Highlight trace un rectangle de couleur transparent » |
| pdf-editor | FAQ 6 | « Yes, each item has its own remove (✕) button » | TROMPEUR | ✕ seulement pour textes et images (`page.jsx:460,469`) ; traits et surlignages : uniquement « Clear annotations on this page » (`page.jsx:476-484`) | Le dire |
| pdf-editor | titre / méta / about / interface | « Annotations » / « freehand or highlight annotations » | TROMPEUR | Dessinés dans le contenu de la page (drawLine / drawRectangle), pas des annotations PDF modifiables (`pdfEditor.worker.js:59-79`) | « traits et surlignages dessinés sur la page (définitifs) » |
| pdf-editor | méta | « to any PDF » | TROMPEUR | Plafonds 700 Mo / 2 000 pages, 100 Mo / 300 pages sur téléphone (`config.js:23-32`, `page.jsx:82-98`) ; PDF à mot de passe d'ouverture : échec de lecture (`page.jsx:92,123-125`) | Retirer « any », dire les plafonds |
| pdf-editor | about / FAQ 2 | « browsers have no reliable way… » / « No browser-based tool can do this cleanly » | INVÉRIFIABLE | Aucune preuve dans le dépôt | « Cet outil ne modifie pas le texte existant » sans généralisation |
| pdf-editor | FAQ 4 | « measured limits to keep editing reliable in a browser tab » | INVÉRIFIABLE | Mesure seulement en commentaire, sur le chemin d'enregistrement sous Node (`config.js:1-22`), pas sur le rendu des vignettes de toutes les pages (`page.jsx:101-119`) ; aucun rapport dans `docs/audit/` | Donner les plafonds sans « measured », ou produire le rapport |
| pdf-editor | astuce 4 | « the dedicated PDF tools … are faster than this full editor » | INVÉRIFIABLE | Aucune mesure ; l'éditeur ne fait ni fusion, ni filigrane, ni numérotation | Remplacer par « l'éditeur ne fait pas X : utiliser … » |
| pdf-editor | FAQ (absence) | — | MINCE | Non dit : texte ajouté limité aux lettres latines (`pdfEditor.worker.js:128-133`) ; Extract Selected n'inclut ni ajouts ni rotations (`pdfEditor.worker.js:97-108`) | Ajouter ces deux faits |
| pdf-editor | FAQ 1 | « Yes, completely free with no signup required. » | GÉNÉRIQUE | — | Fait propre |

## /tools/pdf-tools/pdf-extract-text

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| pdf-extract-text | astuce 4 | « multi-column layouts are read line by line across the columns » | FAUX | Le texte suit l'ordre des objets du fichier, sans remise en ordre (`app/lib/pdfTextLayout.js:15-35`) | « Les colonnes sortent dans l'ordre où le fichier les enregistre » |
| pdf-extract-text | about / FAQ 5 | « those pages come out blank » / « scanned pages … come out blank » | TROMPEUR | PDF sans aucun texte : pas de résultat, message « This PDF has no text layer… Use PDF OCR… » (`page.jsx:52`) ; vide seulement pour les pages scannées d'un PDF mixte | Citer le message réel |
| pdf-extract-text | étape 2 | « pull the text content from every page » | TROMPEUR | Seulement les pages du champ « Pages (empty: all) » (`page.jsx:42,78-80`) | « toutes les pages, ou celles indiquées » |
| pdf-extract-text | FAQ 2 | « PDF files only. » | GÉNÉRIQUE | `accept=".pdf"` (`page.jsx:75`) | Fusionner dans un fait utile |
| pdf-extract-text | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | — | Fait propre |

## /tools/pdf-tools/pdf-forms

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| pdf-forms | titre | « PDF Forms — Read the Existing Fillable Fields Online Free » | MINCE | La tâche est de remplir (et aplatir) (`page.jsx:73-105,147`) | « Fill PDF forms … » |
| pdf-forms | méta | « lets you type a value into each one » | MINCE | Cases, boutons radio, listes, aplatissement facultatif (`page.jsx:120-147`) | Les citer |
| pdf-forms | FAQ 3 | « and filled like a text field » | TROMPEUR | Chaque type a son propre contrôle ; les boutons radio sont une liste déroulante (`page.jsx:126-142`) | « choisi dans une liste » |
| pdf-forms | interface | bouton « Fill and Download PDF » | TROMPEUR | Le bouton prépare le fichier ; le téléchargement se fait avec « Download » (`page.jsx:151-155`) | Libellé « Fill PDF » ou dire les deux clics (l'étape 3-4 le dit déjà) |
| pdf-forms | FAQ / astuces (absence) | — | MINCE | Formulaires XFA : message dédié (`page.jsx:57-59,150`) non mentionné | Ajouter |
| pdf-forms | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | — | Fait propre |

## /tools/pdf-tools/pdf-merge

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| pdf-merge | interface / FAQ 1 | « Free, no signup » / « Yes, completely free with no signup required. » | TROMPEUR | .docx → `guardPaidRoute` : limite par réseau heure/jour + plafond mensuel du site (`app/api/convert-to-pdf/route.ts:206-207`, `lib/quota/guard.js:15-37`) ; Office > 4 Mo : ticket limité par réseau (`app/api/media/ticket/route.js:34-42`) | Dire ces limites pour les fichiers Office |
| pdf-merge | FAQ 5 | « retains the full quality of all original files including images, fonts, and formatting » | TROMPEUR | Images non JPEG ré-encodées en JPEG q92 (`app/lib/pdfImages.js:23-41`) ; Office converti, repli LibreOffice annoncé comme différent (`page.jsx:243-246`) | Vrai pour les PDF seulement ; dire les deux exceptions |
| pdf-merge | méta / about | « instantly » | INVÉRIFIABLE | Aucune mesure ; conversion serveur des fichiers Office ; l'astuce 3 dit « may take a few seconds » | Supprimer |
| pdf-merge | FAQ 4 | « measured limits to keep merging reliable » | INVÉRIFIABLE | Mesure seulement en commentaire (`config.js:1-31`), aucun rapport dans `docs/audit/` | Retirer « measured » ou produire le rapport |
| pdf-merge | FAQ 2 | « and deleted after conversion » | TROMPEUR | Office > 4 Mo : déposé sur le service média, supprimé après le 1er téléchargement complet ou au TTL (`app/lib/officeUpload.js:46-51`, `services/media-processing/app/jobs.py:6-13`) | Préciser |
| pdf-merge | FAQ 4 | question « How many PDF files can I merge at once? » | MINCE | La réponse ne dit pas qu'il n'y a pas de limite de nombre de fichiers (aucune dans `page.jsx:145-188`) | Le dire |
| pdf-merge | about | « No software installation required » / « Perfect for combining reports, contracts, invoices, scans and photos » | GÉNÉRIQUE | — | Supprimer |

## /tools/pdf-tools/pdf-number-pages

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| pdf-number-pages | titre | « PDF Number Pages — Stamp a “current / Total” Label (e.g » | TROMPEUR | Titre tronqué (`layout.tsx:5`) ; 5 formats dont texte libre (`page.jsx:17-23`) | Titre complet citant formats et options |
| pdf-number-pages | méta | « stamps a current/total label onto every page » | TROMPEUR | 5 formats ; pages de/à, couverture sautée (`page.jsx:17-23,68-69`) | Corriger |
| pdf-number-pages | astuce 3 | « set 'First number' to 1 if the second page should be page 1 » | TROMPEUR | C'est déjà le défaut : First number = 1 et la page 2 le reçoit quand la couverture est sautée (`page.jsx:33,68,80`) | « La page 2 devient la page 1 par défaut ; mettez 2 pour garder la numérotation du document » |
| pdf-number-pages | astuce 1 | « the most common, professional-looking placement » | INVÉRIFIABLE | Aucune preuve | Dire seulement que c'est la position par défaut (`page.jsx:30`) |
| pdf-number-pages | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | — | Fait propre |

## /tools/pdf-tools/pdf-ocr

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| pdf-ocr | FAQ 3 | « roughly 4-16% of characters » | INVÉRIFIABLE | Aucun rapport ; le seul chiffre du dépôt : 0,8 % CER à 7 pt (`docs/audit/RAPPORT-qualite-2-29-09.md:60`) | Citer la mesure réelle avec son fichier, ou aucun chiffre |
| pdf-ocr | méta / interface | « scanned PDFs and photographed pages of text » | FORMAT | Seul le PDF est accepté (`page.jsx:295` `accept=".pdf"`) : une photo JPG/PNG doit d'abord être mise en PDF | « photographed pages inside a PDF » + renvoi Image to PDF |
| pdf-ocr | FAQ 6 | « When our OCR service takes over on an iPhone or iPad, it accepts PDFs up to 44 MB. » | TROMPEUR | Non dit : 300 pages/heure et 1 000/jour par réseau, 3 000/heure pour tous (`lib/quota/config.js:55-57`, `lib/quota/pdfOcrRateLimit.js:8-20`) ; 44 Mo seulement si service média configuré, sinon ~4 Mo (`app/lib/serverPageOcr.js:59-62`) | Ajouter les limites de pages |
| pdf-ocr | FAQ 7 / about | « Not on a computer: everything happens locally » | TROMPEUR | Le relais serveur ne concerne qu'iPhone/iPad (`app/lib/serverPageRender.js:23-26`, `app/lib/canvasLimit.js:13-17`) ; Android n'envoie rien non plus | « Sur ordinateur et Android, rien n'est envoyé ; sur iPhone/iPad… » |
| pdf-ocr | FAQ 1 | « Does this actually perform OCR now? … it no longer just reads an existing text layer » | MINCE | Renvoie à une ancienne version ; aucune information pour le visiteur | Remplacer par une vraie question (ex. différence avec Extract Text) |

## /tools/pdf-tools/pdf-organize

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| pdf-organize | about | « it does not merge, split, compress, or rotate PDFs » | FAUX | Bouton Rotate (+90° par page) `page.jsx:59,81,120` | Retirer « or rotate » ; dire qu'il tourne, duplique, insère des pages blanches |
| pdf-organize | FAQ 2 | « this tool only reorders and removes pages inside a single PDF » | TROMPEUR | Fait aussi Rotate, Duplicate, Blank after (`page.jsx:59-61,120-122`) | Liste complète |
| pdf-organize | titre | « PDF Organize — Let You Reorder Online Free » | MINCE | Titre cassé | Titre complet |
| pdf-organize | méta | « reorder and remove pages … using Up, Down, and Remove buttons » | MINCE | Omet Rotate, Duplicate, Blank after (`page.jsx:120-122`) | Les citer |
| pdf-organize | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | — | Fait propre |

## /tools/pdf-tools/pdf-protect

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| pdf-protect | FAQ 4 | « a random owner password is used, so nobody can lift the restrictions » | FAUX | Avec le mot de passe d'ouverture, PDF Unlock de ce site enlève chiffrement et restrictions (`app/lib/pdfUnlock.js:13,33`) ; l'astuce 3 dit elle-même qu'on peut les contourner | « personne ne connaît le mot de passe de permissions ; les restrictions ne sont pas une protection forte » |
| pdf-protect | étapes 2-3 | « Type a password into the field. » / « Click 'Protect PDF' » | TROMPEUR | Par défaut, sans ouvrir Permissions : copie, modification, commentaires et réorganisation des pages INTERDITS (`page.jsx:13`) | Dire les permissions par défaut |
| pdf-protect | FAQ 2 | « AES-128, the PDF standard's AES cipher » | TROMPEUR | Le standard prévoit aussi AES-256 ; le site choisit 128 (`page.jsx:38-41`) | « AES-128 (l'AES-256 révision 5, dépréciée, n'est pas utilisé) » |
| pdf-protect | FAQ 1 | « Yes, it's free with no signup required. » | GÉNÉRIQUE | — | Fait propre |

## /tools/pdf-tools/pdf-redact

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| pdf-redact | about | « Pages with no match are left untouched » | TROMPEUR | Tampons, pièces jointes, médias, liens vers une page caviardée ou exécutant un script retirés de ces pages (`page.jsx:134,249` ; la FAQ 3 le dit) | Reprendre la FAQ 3 |
| pdf-redact | astuce 4 | « left completely untouched » | TROMPEUR | Idem | Idem |
| pdf-redact | FAQ 1 | « Yes, it's completely free with no signup required. » | TROMPEUR | iPhone/iPad : pages dessinées par le service limitées à 300/h et 1 000/jour par réseau (`lib/quota/config.js:48-51`, `app/api/pdf-render/route.ts:3,14`) | Le dire pour iPhone/iPad |
| pdf-redact | FAQ 10 | « Not on a computer: matching and redaction both happen locally » | TROMPEUR | Seul iPhone/iPad peut envoyer (`app/lib/serverPageRender.js:23-26`) ; Android n'envoie rien | « Sur ordinateur et Android… » |
| pdf-redact | titre | « PDF Redact — Search Your Pdf's Text for a Keyword Online » | MINCE | Titre cassé (« Pdf's ») ; ne dit pas caviarder, plusieurs termes et motifs (`page.jsx:272-281`) | Titre complet |

## /tools/pdf-tools/pdf-reorder-pages

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| pdf-reorder-pages | FAQ 2 | « For thumbnails you drag, use Organize PDF. » | FAUX | Organize n'a ni vignette ni glisser : liste « Page N » + Up/Down (`app/tools/pdf-tools/pdf-organize/page.jsx:115-124`) | Aucun outil du site n'a de vignettes à glisser ; l'Editor a des vignettes avec flèches |
| pdf-reorder-pages | astuce 3 | « invalid ones are skipped » | FAUX | Refusés avec phrase, bouton désactivé (`app/lib/pageRange.js:28-34` ; `page.jsx:96,101`) | « un numéro invalide est signalé, rien n'est créé » |
| pdf-reorder-pages | titre | « Let You Rearrange a Pdf's Pages Online » | MINCE | Titre cassé | Titre complet |
| pdf-reorder-pages | about | (2 phrases) | MINCE | Omet plages dans les deux sens « 5-1 », Reverse order / Odd pages, then even, doublons permis, pages omises signalées (`page.jsx:21-22,91-98`) | Ajouter |
| pdf-reorder-pages | astuce 4 | « download and check the result on a short document » | GÉNÉRIQUE | — | Supprimer |
| pdf-reorder-pages | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | — | Fait propre |

## /tools/pdf-tools/pdf-repair

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| pdf-repair | about / FAQ 4 | « deleted immediately after processing — never stored, logged, or kept » | TROMPEUR | > 4 Mo (service média configuré) : fichier et résultat sur le service média jusqu'au 1er téléchargement complet ou au TTL (`page.jsx:57-70`, `services/media-processing/app/jobs.py:6-13`) | Décrire les deux cas |
| pdf-repair | FAQ 4 | « one of the few tools on this site that actually sends your file to a server » | TROMPEUR | La politique de confidentialité liste des dizaines d'outils serveur (`app/privacy/page.jsx:48-52`) | Retirer « one of the few » |
| pdf-repair | FAQ 1 | « Yes, completely free with no signup required. » | TROMPEUR | > 4 Mo : ticket média limité par réseau heure/jour (`app/api/media/ticket/route.js:34-42`) | Le dire |
| pdf-repair | étape 2 | « Your file uploads with a real progress bar » | TROMPEUR | La barre ne suit que l'envoi, libellé « Uploading… » pendant toute la réparation (`page.jsx:62,79-81,127`) | « la barre suit l'envoi ; la réparation peut durer jusqu'à 230 s » |

## /tools/pdf-tools/pdf-rotate

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| pdf-rotate | titre | « PDF Rotate — Rotate Every Page Online Free » | TROMPEUR | Pages au choix (`page.jsx:40,70-71`) | « all or selected pages » |
| pdf-rotate | méta | « rotates every page of a PDF » | TROMPEUR | Idem | Idem |
| pdf-rotate | interface (sous-titre) | « Rotate all pages of a PDF in your browser » | TROMPEUR | Idem | Idem |
| pdf-rotate | astuce 2 | « stay sharp at any angle » | TROMPEUR | Seulement 90°, 180°, 270° (`page.jsx:65`) | « à chacun des trois angles » |
| pdf-rotate | astuce 1 | « download and check a page or two » | GÉNÉRIQUE | — | Supprimer |
| pdf-rotate | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | — | Fait propre |

## /tools/pdf-tools/pdf-sign

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| pdf-sign | about | « You can only draw a signature, not type or upload an image of one » | FAUX | Modes Draw / Type / Upload image (`page.jsx:314,319-330`) ; la même phrase dit plus haut qu'on peut taper ou téléverser | Supprimer la phrase |
| pdf-sign | FAQ 4 | « anything under or around the strokes stays visible » | FAUX | L'encre est opaque : ce qui est sous les traits est couvert (`page.jsx:94-105,291`) ; l'astuce 3 le dit | « ce qui est autour des traits reste visible » |
| pdf-sign | étape 3 | « drag the signature where it goes on the page shown (or pick a corner) » | TROMPEUR | Position par défaut « Bottom right » ; la page ne s'affiche qu'après avoir choisi « Where I drag it on the page » (`page.jsx:40,193-194,348`) | Dire de choisir d'abord cette position |
| pdf-sign | titre | « PDF Sign — Let You Draw a Signature Online Free » | MINCE | Titre cassé ; omet Type et Upload | Titre complet |
| pdf-sign | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | — | Fait propre |

## /tools/pdf-tools/pdf-split

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| pdf-split | about | « the ways the leading online splitter does for free » | INVÉRIFIABLE | « leading » sans preuve (la source citée en commentaire est un relevé d'iLovePDF, `splitPlan.js:3`) | Décrire les modes sans comparaison |
| pdf-split | about | (liste des modes) | MINCE | Omet Odd / even pages et By bookmarks (`page.jsx:19-20`) | Les ajouter |
| pdf-split | FAQ 3 | « Not yet — pages are chosen by number » | INVÉRIFIABLE | Promesse d'une fonction future, rien dans le code | « Non : … » |
| pdf-split | FAQ 6 | « measured limits to keep splitting reliable » | INVÉRIFIABLE | Commentaire seulement (`config.js:1-16`), pas de rapport | Retirer « measured » ou produire le rapport |
| pdf-split | titre | « PDF Split — Create a Separate PDF File Online Free » | MINCE | Ne dit aucun mode | Titre avec les modes |
| pdf-split | FAQ 2 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | — | Fait propre |

## /tools/pdf-tools/pdf-unlock

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| pdf-unlock | astuce 2 | « you can leave the password field blank and it will still process normally » | FAUX | PDF non chiffré : aucun fichier, message « This PDF is not protected… nothing to remove. » (`page.jsx:29-32`) | Citer le message réel |
| pdf-unlock | étape 2 | « Type the PDF's password into the field. » | TROMPEUR | Inutile pour un PDF à restrictions seules (champ « Password (if required) », `page.jsx:61` ; `app/lib/pdfUnlock.js:11-13`) | « si le PDF en demande un à l'ouverture » |
| pdf-unlock | astuce 4 | « Keep your original protected file as a backup… » | GÉNÉRIQUE | L'original n'est pas modifié | Supprimer |
| pdf-unlock | FAQ 1 | « Yes, it's free with no signup required. » | GÉNÉRIQUE | — | Fait propre |

## /tools/pdf-tools/pdf-watermark

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| pdf-watermark | titre | « PDF Watermark — Stamp a Diagonal, Semi-transparent Text » | TROMPEUR | Texte OU image, rotation None/45/90/180/270, opacité 10-100 % (`page.jsx:19,153-157,203-206`) | Titre complet |
| pdf-watermark | méta | « stamps a diagonal, semi-transparent text watermark across every page » | TROMPEUR | Idem + pages de/à (`page.jsx:77-80`) | Corriger |
| pdf-watermark | astuce 2 | « A mosaic is harder to crop out than a single stamp. » | INVÉRIFIABLE | Aucune preuve | Supprimer ou décrire la mosaïque (rangées décalées, `page.jsx:109-113`) |
| pdf-watermark | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | — | Fait propre |

---

## Synthèse du lot pdf-2 (20 outils lus)

| Type | Nombre |
|---|---|
| FAUX | 11 |
| INVÉRIFIABLE | 14 |
| TROMPEUR | 44 |
| GÉNÉRIQUE | 22 |
| MINCE | 16 |
| LIBELLÉ | 0 |
| FORMAT | 1 |
| **Total** | **108** |

Les plus graves : Organize dit ne pas tourner les pages alors qu'il a un bouton Rotate ; Protect promet que « personne ne peut lever les restrictions » alors que PDF Unlock du même site les lève avec le mot de passe d'ouverture ; Compress annonce sur téléphone une voie navigateur jusqu'à 100 Mo qui ne peut pas s'exécuter, et un plafond serveur de 200 Mo qui tombe à 4 Mo sans `NEXT_PUBLIC_MEDIA_SERVICE_URL`.
