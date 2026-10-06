# P36 — rédaction du lot pdf-2 (20 outils PDF)

Fichiers modifiés : `app/tools/pdf-tools/<outil>/layout.tsx` (title.absolute, description, openGraph.title/description) et `page.jsx` (props de `<SeoContent>` seulement) des 20 outils, plus 3 imports en tête et une chaîne d'interface (ci-dessous). Preuves des chiffres écrits en dur : `docs/audit/p36/preuves/pdf-2.json`. Branche décrite : service média configuré (www).

## Contrôles (06/10)
- `node scripts/p36/content-verify.mjs --only=pdf-tools/` : 39 pages, 0 échec ; part maximale de phrases identiques 14,3 % (paire pdf-1).
- `node scripts/content-checks/instructions.mjs` : 225 pages, 1 735 libellés, 0 écart.
- `node scripts/content-checks/privacy-claims.mjs` : 0 échec.

## Chaîne d'interface modifiée (phrase FAUSSE de l'audit)
- `pdf-compress/page.jsx:179` : sur téléphone, « Larger files, up to 100 MB on this device, get a lighter in-browser optimisation » (voie impossible : tout fichier > 200 Mo est refusé, `page.jsx:45-49,58`) devient « Larger files cannot be compressed on this device. » ; l'ordinateur garde « Larger files, up to ${browserMaxLabel}, get a lighter in-browser optimisation (structure only). ». Seules les chaînes du ternaire existant `isMobile ? … : …` ont changé.

## Imports ajoutés (aucun changement de comportement)
- `pdf-merge/page.jsx:11` : `OFFICE_STAGED_THRESHOLD_BYTES` (même module que les deux constantes déjà importées).
- `pdf-repair/page.jsx:6` : `import { OFFICE_STAGED_THRESHOLD_BYTES } from '@/lib/quota/limits'`.
- `pdf-ocr/page.jsx:17` : `STAGED_MAX_BYTES` ajouté à l'import existant de `serverPageRender`.

## Par outil (titre / méta en caractères ; mots SEO avant → après, estimés depuis le source)

| Outil | Titre (car.) | Méta (car.) | Mots | Retiré (renvoi audit pdf-2.md) |
|---|---|---|---|---|
| pdf-compare | Compare Two PDFs — Line-by-Line Text Differences (48) | 152 | 308 → ~480 | titre MINCE, méta TROMPEUR, « as Diffchecker and git », « panels will come out empty », FAQ gratuité |
| pdf-compress | Compress PDF — Extreme, Recommended or Lossless (47) | 146 | 464 → ~610 | voie navigateur sur téléphone (FAUX ×2), « password-protected: No », « free, no signup », « nothing is re-encoded », astuces 1-2, « short time » |
| pdf-crop | Crop PDF — Trim Page Margins in Points (38) | 143 | 324 → ~430 | astuce « batch », FAQ gratuité (sous-titre « resize » : TROMPEUR d'interface, non modifié — voir réserves) |
| pdf-delete-pages | Delete Pages from PDF — Type Pages or Ranges (44) | 149 | 265 → ~390 | « Remove the Page Numbers » (titre, méta, about), about mince, astuce générique, FAQ gratuité |
| pdf-editor | PDF Editor — Add Text, Images, Pen and Highlights (49) | 146 | 483 → ~560 | Highlight « lines or boxes » (FAUX), ✕ par élément, « annotations », « any PDF », « No browser-based tool… », « measured limits » et chiffres 2 000 p. / 700 Mo, « faster » |
| pdf-extract-text | Extract Text from PDF — Copy It or Save as TXT (46) | 147 | 317 → ~410 | colonnes « across the columns » (FAUX), « come out blank », « every page », FAQ génériques |
| pdf-forms | Fill PDF Forms — Text, Checkboxes, Lists, Flatten (49) | 145 | 402 → ~460 | titre « Read… », méta mince, « filled like a text field », XFA ajouté, FAQ gratuité |
| pdf-merge | Merge PDF — Combine PDFs, Images and Office Files (49) | 142 | 449 → ~590 | « instantly », « Perfect for… », « No software installation », « free, no signup » sans limite, « full quality », « measured limits » et chiffres 2 000 p. / 700 Mo, « deleted after conversion » |
| pdf-number-pages | Add Page Numbers to PDF — Formats, Range, Margins (49) | 144 | 334 → ~460 | titre tronqué, méta « current/total… every page », astuce 3 (déjà le défaut), « professional-looking », FAQ gratuité |
| pdf-ocr | PDF OCR — Searchable PDF from Scans, 100+ Languages (51) | 139 | 812 → ~610 | « 4-16% » (remplacé par la mesure 0,8 % du 29/09), FAQ « now », « Not on a computer » (Android précisé), limites de pages iPhone ajoutées, photo seule refusée dite |
| pdf-organize | Organize PDF Pages — Reorder, Rotate, Duplicate (47) | 140 | 415 → ~400 | « does not … rotate » (FAUX), FAQ 2, titre cassé, méta mince, FAQ gratuité |
| pdf-protect | Protect PDF with a Password — AES-128 Encryption (48) | 138 | 326 → ~420 | « nobody can lift the restrictions » (FAUX), permissions par défaut dites, « the PDF standard's AES cipher », FAQ gratuité |
| pdf-redact | Redact PDF — Black Out Words, Emails, Phones, Cards (51) | 141 | 1094 → ~630 | « left (completely) untouched » ×2, « free, no signup », « Not on a computer », titre cassé |
| pdf-reorder-pages | Reorder PDF Pages — Type the New Page Order (43) | 148 | 303 → ~400 | « Organize = thumbnails you drag » (FAUX), « invalid ones are skipped » (FAUX), titre cassé, about mince, génériques |
| pdf-repair | Repair PDF — Fix Broken Structure, Text Checked (46) | 140 | 653 → ~525 | « deleted immediately » (gros fichiers), « one of the few tools », « free, no signup », « real progress bar » |
| pdf-rotate | Rotate PDF Pages — All Pages or Just the Ones You List (54) | 142 | 214 → ~335 | « every page » (titre, méta), « any angle », génériques |
| pdf-sign | Sign PDF — Draw, Type or Upload Your Signature (46) | 143 | 505 → ~450 | « You can only draw » (FAUX), « anything under … stays visible » (FAUX), étape 3 (position par défaut), titre cassé |
| pdf-split | Split PDF — Ranges, Every N Pages, Bookmarks, ZIP (49) | 142 | 510 → ~445 | « leading online splitter », « Not yet », « measured limits » et chiffres, titre mince, FAQ gratuité |
| pdf-unlock | Unlock PDF — Remove a Password You Know (39) | 137 | 259 → ~360 | astuce 2 « process normally » (FAUX), étape 2, génériques |
| pdf-watermark | Watermark PDF — Text or Logo, Mosaic, Opacity (45) | 139 | 367 → ~435 | titre et méta « diagonal, semi-transparent text … every page », « harder to crop out » |

## Chiffres
Calculés depuis le code (`${…}`) : plafonds Compress (`SERVER_MAX_LABEL`, `OFFICE_STAGED_THRESHOLD_BYTES / MIB`), Merge (`officeMaxLabel(...)`), Repair (`pdfToolsMaxLabel()`), OCR (`LANGUAGES.length`, `LOCAL_OCR_LIMIT_LABEL`, `STAGED_MAX_BYTES`), Redact (`LOCAL_PAGE_LIMIT_LABEL`). Écrits en dur avec preuve (`preuves/pdf-2.json`) : 150/72 dpi (compress.py), mesures du 23/09 (RAPPORT-ecarts-marche.md), 25 MB (pdfActualText.js), 0,8 % (RAPPORT-qualite-2-29-09.md), 300 / 1 000 pages (lib/quota/config.js), 90 seconds (pdf-ocr), 248 fichiers (RAPPORT-p28), 10 % / 30 % / 25 % (pdf-watermark).
Non écrits, faute de rapport : 700 Mo / 2 000 pages (Editor, Merge, Split, et voie navigateur de Compress) — les pages renvoient à la limite affichée au-dessus de la zone d'envoi ; 4-16 % (OCR).

## Exemples
Aucun : outils de fichiers ; les seuls résultats chiffrés cités (Compress, OCR, Repair) viennent de rapports datés du dépôt et sont dans la FAQ.

## Réserves / non vérifié
- Durée de conservation sur le service média : variable Railway `MEDIA_JOB_TTL_SECONDS` (README : 900 s) ; écrit seulement « the end of the service's retention time », sans chiffre.
- Valeurs horaires/journalières des tickets média et de `guardPaidRoute` : variables d'environnement, écrites sans chiffre.
- Sous-titres d'interface TROMPEURS (pas FAUX) laissés tels quels, selon la consigne : Crop « Crop and resize PDF pages », Rotate « Rotate all pages of a PDF in your browser », bouton Forms « Fill and Download PDF ».
- Compress : sans `NEXT_PUBLIC_MEDIA_SERVICE_URL`, `SERVER_MAX_LABEL` (constante 200 MB) resterait faux ; décrit ici pour la branche configurée (www).
- Compress, PDF à restrictions seules : « compressed like any other file » repose sur `pikepdf.open` sans mot de passe (`compress.py:285`) ; non testé en réel dans ce lot.

## Corrections après relecture (06/10)

Relecture : `docs/audit/p36/relecture/pdf-2.md` (76 défauts). Chaque point a été revérifié dans le code ; tous sont corrigés, sauf l'écart signalé ci-dessous.

### Exactitude [1] et lieu de traitement [3] — confirmés et corrigés
- Compress : sélection des images réencodées (`services/pdf-tools/py/compress.py:88-119` : 8 bits RVB/gris, ≥ 64×64, réduction au-delà de 1,3×, image non réduite gardée seulement si le JPEG fait < 95 %) → About réécrit (« larger pictures… CMYK, indexed or masked pictures are left as they are ») ; polices : contrôle des boîtes englobantes (`compress.py:152-174`) → « same outline bounds » ; fichier envoyé effacé dès le dépôt du résultat (`services/media-processing/app/jobs.py:216-255`) → privacy corrigée ; « phones, iPhone and iPad » (`app/lib/isMobileDevice.js:5-9`) ; « optimized » en anglais américain dans le texte SEO.
- Repair : même correction de suppression ; FAQ 1 (pages restantes livrées avec note, `services/pdf-tools/src/repair.js:177-178,231`) ; specs « Text check » (cas « unverifiable », `repair.js:158-165`).
- Redact : fichier rendu sans signets, propriétés ni champs actifs (`pdf-redact/page.jsx:80,138-145`) → specs + FAQ 4 ; relais iPhone/iPad aussi sur échec immédiat (`page.jsx:175-179`) ; plafond 44 MB calculé (`${STAGED_MAX_BYTES}`, import ajouté depuis `app/lib/serverPageRender.js`).
- OCR : relais aussi sur échec immédiat (`pdf-ocr/page.jsx:160-168,201-206`) ; « Android device ».
- Merge : traitement réel des images (`app/lib/pdfImages.js:92` HEIC→PNG seulement si le navigateur ne l'ouvre pas, `:86` TIFF→PNG multipages, `:263` PNG tel quel, `:247` JPEG miroir) ; limite d'envoi de tout fichier Office > 4 MB (`app/lib/officeUpload.js:46`, `app/api/media/ticket/route.js:24-42`).
- Editor (taille de texte non bornée, `page.jsx:457`), Forms (aplatissement de tous les champs, `page.jsx:96`), Number Pages (bord extérieur seulement avec position à droite, `page.jsx:91` ; astuce « Big margin » supprimée), Sign (fond conservé si « Remove white background » décoché, `page.jsx:152-170`), Split (noms des parties, `splitPlan.js:48,83-88`), Rotate (copie déchiffrée, `pdfDecrypt.js:41-53`), Watermark (polices de l'appareil, `app/lib/pdfTextImage.js:12`), Compare (cas « neither »), Extract Text (contenu exact du rapport d'erreur, `app/lib/reportError.js:142-155`).

### Générique / dupliqué [5] et structure [6]
- Dernières phrases « … runs in your browser with pdf-lib » remplacées par une phrase propre à chaque outil (crop, number-pages, forms, watermark, organize, reorder supprimée, protect, unlock, rotate, sign, compare).
- Privacy de Repair reformulée (plus de phrases communes avec Compress) ; valeurs « Size limit » d'Editor, Merge, Split rendues différentes.
- Toutes les réponses de FAQ fermées commencent par Yes / No / le chiffre ; les questions « How/What/Why » restantes commencent par la réponse directe (aucun « Because », « It depends »).
- Privacy portées dans 40-90 mots (Compress raccourcie ; Protect, Reorder, Rotate, Split, Unlock, Watermark complétées avec des faits vérifiés : génération aléatoire dans le navigateur `pdf-protect/page.jsx:45`, refus des PDF à mot de passe `pdfDecrypt.js:32-53`, copie déchiffrée).
- Étapes finales « Click "Download" to save the … » reformulées (delete, merge, organize, reorder, rotate, watermark).

### Écart volontaire avec la relecture
- Editor / Merge / Split « Size limit » : la relecture propose d'écrire les valeurs `${MAX_PAGES}` / `${MAX_FILE_SIZE_LABEL}`. Non fait : consigne du coordinateur (phase 2) de ne pas écrire 700 MB / 2 000 pages sans rapport dans `docs/audit/` (mesure seulement en commentaire, `config.js:1-31`). Les valeurs restent affichées par l'interface au-dessus de la zone d'envoi.

### Chaînes d'interface modifiées (phase 3)
- `pdf-crop/page.jsx:60` sous-titre « Crop and resize PDF pages » → « Trim the margins of PDF pages ».
- `pdf-rotate/page.jsx:56` « Rotate all pages of a PDF in your browser » → « Rotate all or some pages of a PDF in your browser ».
- `pdf-compress/page.jsx:178` « Reduce PDF file size while keeping it sharp » → « Reduce PDF file size at the level you choose ».
- `pdf-compress/page.jsx:21` note Recommended « Good quality, good compression. Images at 150 dpi. » → « Larger images resampled to 150 dpi and saved as JPEG. ».
- `pdf-compress/page.jsx:22` note Lossless « Identical look, nothing re-encoded. … » → « Identical look, images untouched. Fonts and structure optimised. ».
- `pdf-extract-text/page.jsx:71` « Extract all text content from your PDF » → « Extract the selectable text of your PDF, page by page ».
- `pdf-merge/page.jsx:194` « … into one PDF. Free, no signup » → « … into one PDF » (les .docx sont limités par réseau).
- `pdf-merge/page.jsx:195` « Merging runs in the background — this tab stays responsive. » → « PDFs and images are merged by a background worker in this tab. » (la préparation des images et l'envoi Office se font hors du worker, `page.jsx:110-143`).
- Libellés de boutons inchangés (ex. « Fill and Download PDF »).

### Preuve ajoutée
- `preuves/pdf-2.json` : « 128-bit » (Protect, `pdf-protect/page.jsx` « Encrypted with AES-128 »).

## Corrections après deuxième passe (06/10)
- Compress FAQ 1 : fourchette « 0.1% to 78.8% », avec Lossless −0,1 % sur les photos (`docs/audit/RAPPORT-ecarts-marche.md:98`) ; preuve « 0.1% » ajoutée à `preuves/pdf-2.json`.
- Compress, note d'interface Extreme (`pdf-compress/page.jsx:20`) : « Smallest file. Images reduced to screen resolution (72 dpi). » → « Smallest file. Larger images reduced to 72 dpi and saved as JPEG. » (`compress.py:106-112`).
- Compare : FAQ 2 pour deux scans (« neither PDF has text », `page.jsx:94`) ; méta « Runs in your browser. » → « Read locally by PDF.js. » (C6).
- Merge FAQ 3 ramenée sous 70 mots.
- Reorder : phrase de lieu de traitement remise dans l'About ; minuscule après deux-points en FAQ 2.
- Repair FAQ 3 : sujet doublé corrigé.
- Unlock privacy : phrase générique remplacée par un fait propre (PDF à restrictions seules ouvert avec un mot de passe vide, `app/lib/pdfUnlock.js:13`, `pdf-unlock/page.jsx:28`).
- Rotate / Watermark, dernière étape : résultat propre à chaque outil (pages listées tournées ; marque sur chaque page de la plage).
- Contrôles : content-verify 0 échec, instructions 0 écart, privacy-claims 0 échec.
