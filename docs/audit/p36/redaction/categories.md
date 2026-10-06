# P36 — Réécriture des 12 pages de catégorie (06/10)

Fichiers modifiés : `app/tools/<catégorie>/page.jsx` et `app/tools/<catégorie>/layout.tsx` pour les 12 catégories.
Seules des chaînes de texte ont changé : descriptions des cartes, sous-titre sous le H1 (le compteur `{tools.length}` /
`{tools.filter(...).length}` est conservé), paragraphe « About », 4 étapes, 4 FAQ, 4 conseils, et dans `layout.tsx`
`title.absolute`, `description`, `openGraph.title`, `openGraph.description`. Aucune URL, aucun lien, aucun outil, aucune
classe ni logique touchés : l'arbre syntaxique (TypeScript), textes remplacés par un jeton, est identique à `HEAD` pour
les 12 `page.jsx` ; pour les `layout.tsx`, le diff ne contient que les 4 chaînes.

Sources des faits : `docs/audit/p36/faits/*.json` (fichier:ligne), pages d'outils réécrites (sections « specs »,
« privacy », FAQ), et vérifications dans le code : `lib/quota/limits.js` (25 MiB Whisper, 100 MiB Office, 200 MiB
Compress, 4 MiB seuil d'envoi par morceaux), `lib/quota/imageGen.js:13` (5 images/jour), `lib/quota/aiDetect.js:17`
(2 000 mots/jour), `lib/ai/pangram.js:18-19` (40-1 000 mots), `app/api/ai/route.ts:35` (1 000 jetons), `MAX_PROMPT_CHARS`
8 000, `app/tools/ai-tools/background-remover/page.jsx:21` (1 024 px), `app/tools/video-tools/video-merger/page.jsx:60`
(2e9 / 700e6 octets), `app/tools/image-tools/image-compressor` `MAX_FILES = 20`, routes gardées par `guardPaidRoute`
(ai, ai-image, ai-transcribe, ai-vision, remove-bg, word-to-pdf .docx, pdf-to-word/excel/ppt via `lib/pdfToOfficeRoute`),
AI Detector et Image Upscaler hors garde partagée (budgets propres). Limites dont la valeur est en variable
d'environnement (heure/jour par connexion, budget mensuel, service média) : décrites sans chiffre.

## Contrôles
- `node scripts/content-checks/privacy-claims.mjs` : 53 outils envoient des données ; **0 failure** (2 phrases corrigées
  en cours de route : « AI PDF Summary extracts the text on your device… » et « Other output formats are made in your
  browser… », rendues explicitement restreintes).
- `node scripts/content-checks/instructions.mjs` : 225 pages, 1 763 libellés, **0 mismatch**.
- Syntaxe : `ts.createSourceFile(...).parseDiagnostics` = 0 pour les 24 fichiers.
- Métadonnées : titres ≤ 60, descriptions 110-155, openGraph identique, 12 titres et 12 descriptions uniques.
- Aucune phrase des nouveaux textes n'est commune à deux pages de catégorie (hors « Yes. » / « No. »).

## Par catégorie (mots visibles de `page.jsx`, titres de cartes compris ; métadonnées à part)

| Catégorie | Titre (car.) | Méta (car.) | Mots page avant → après | Mots méta avant → après |
|---|---|---|---|---|
| ai-tools | 59 | 138 | 550 → 711 | 43 → 53 |
| audio-tools | 54 | 148 | 521 → 629 | 49 → 56 |
| converter-tools | 57 | 145 | 332 → 480 | 41 → 59 |
| developer-tools | 60 | 137 | 722 → 1 026 | 44 → 53 |
| file-tools | 60 | 149 | 408 → 548 | 46 → 57 |
| gif-tools | 53 | 127 | 451 → 583 | 48 → 62 |
| image-tools | 59 | 149 | 634 → 758 | 53 → 63 |
| math-tools | 58 | 140 | 330 → 438 | 45 → 46 |
| pdf-tools | 56 | 144 | 887 → 946 | 47 → 61 |
| qr-barcodes-tools | 41 | 151 | 362 → 441 | 60 → 65 |
| text-tools | 58 | 145 | 448 → 563 | 46 → 55 |
| video-tools | 53 | 152 | 500 → 654 | 47 → 56 |

La hausse vient surtout des cartes (58 descriptions sur Developer Tools) et de faits précis remplaçant des formules.

### ai-tools
Faux / invérifiable retiré : « comprehensive… powerful artificial intelligence utilities » ; étape « browse the home page
dashboard » ; « OpenAI does not use API data to train its models » (rien dans le dépôt) ; conseil « new AI tools are
frequently added » ; carte Data Extractor « from documents » (texte collé seulement). Ancienne FAQ des limites imprécise :
AI Detector et Image Upscaler n'utilisent PAS l'allocation partagée (budgets propres) — corrigé. Ajouté : 13 outils →
OpenAI, AI Detector → Pangram, Background Remover → copie JPEG ≤ 1 024 px vers notre service, Upscaler sur l'appareil
avec WebGPU sinon notre serveur ; limites 8 000 caractères / 1 000 jetons / 40-1 000 mots.

### audio-tools
Retiré : « supports all major audio formats… seamless conversion » ; conseil « Batch process multiple audio files
simultaneously » (faux : un fichier par passage, sauf Merger) ; « audio preview feature » ; « stable internet connection
… large file uploads » (la plupart n'envoient rien) ; « especially on phones » (non mesuré) ; « deleted as soon as you
have downloaded » (incomplet : ou après un délai) ; carte Metadata « any audio file ». Ajouté : exceptions Opus (service
média, libopus, compte par connexion et par heure/jour, une tâche par partie dans Splitter) et Audio to Text (OpenAI ;
micro = service vocal du navigateur), 25 MB.

### converter-tools
Retiré (faux) : « instantly converts between multiple file formats… images, documents » et FAQ « supports PDF, JPG, PNG,
MP4, DOCX » (la page n'a que 4 convertisseurs) ; **« your amount and currencies are never sent »** — faux : le graphique
d'historique envoie les deux codes de devise à Frankfurter (`RateHistory.jsx:51`) ; « Convert button », « dropdown »,
conseils « batch conversion », « preview », « clear your browser cache ». Méta « instantly… file formats » remplacée.

### developer-tools
Retiré (faux) : « debugging and performance analysis » (aucun outil de ce type) ; « supports Java, C++, PHP, Ruby… » ;
conseils « batch processing », « keyboard shortcuts », « documentation and tutorial section » (inexistants) ; carte
« Generate secure passwords » (invérifiable). Cartes précisées (CSS Formatter minifie aussi ; SQL to CSV = lignes
INSERT ; Cron Expression vs Builder distingués). Ajouté : API Tester seul à envoyer (vers l'adresse saisie), CORS.

### file-tools
Retiré (faux) : « convert, compress… documents, images, videos » et FAQ « PDF, Word, Excel, images, videos, audio » ;
« accessible from any device » ; conseils « batch upload », « compress heavy documents… faster processing », « preview
feature », « keyboard shortcuts » ; cartes « Compare two files side by side » (c'est un verdict octet par octet),
« Encode and decode Base64 » (l'outil fichier encode seulement), « Convert files to different formats » (texte seulement).
Ajouté : limites 5 GB (Splitter), 700 MB / 100 MB (ZIP Creator), 1,9 GB / 300 MB (ZIP Extractor), « phones, iPhone and
iPad » (règle `isMobileDevice`).

### gif-tools
Retiré (faux) : édition de GIF existants (« removing frames, adding text, applying filters, resizing ») ; carte GIF to
MP4 « MP4/WebM » (MP4 seulement) ; « 100% free » ; « generous size limit » ; conseils « 600x600px for social media »,
« 50-100ms », « batch processing ». Omission corrigée : les 5 outils vidéo→GIF envoient la vidéo à notre service média
(supprimée en fin de traitement, GIF supprimé après lecture par la page ou délai), compte par connexion, 60 s, 1 GB.

### image-tools
Retiré : « professional-grade results instantly », « 100% free », « virtually any image type », « share it directly with
others using the provided links » (faux, aucun lien de partage), « any device », conseil « batch processing… multiple
images » (3 outils seulement acceptent plusieurs fichiers : Compressor, Converter, Duplicate Finder — vérifié par
`multiple` dans le code), « WebP… without sacrificing quality ». Méta : 37 outils (compte des cartes).

### math-tools
Retiré (faux) : « algebra, geometry, calculus » ; « step-by-step solutions » (Fraction Calculator seulement) ; « sharing
options / copying the URL » ; « Click the 'Calculate' button » (3 outils calculent à la frappe) ; « fully responsive…
seamlessly » ; « 100% free » ; méta « solve complex problems instantly ». Ajouté : précision (12 / 10 chiffres, exact),
1-3999, 23 statistiques.

### pdf-tools
Retiré : « work instantly » ; **« deleted… automatically after 15 minutes at most »** (durée en variable d'environnement,
pas dans le code) ; chiffres 700/100/99/60/45 MB non revérifiés (la FAQ renvoie à la limite affichée par chaque page,
avec deux chiffres prouvés : 200 MB Compress, 100 MB Word/PowerPoint) ; **« tools that run on our servers have an hourly
and daily limit per connection »** — inexact : Gotenberg/pdf-tools en envoi direct (≤ 4 MB) n'ont pas de compte ;
corrigé (ConvertAPI + AI PDF Summary = allocation partagée + budget ; > 4 MB = compte du service média) ; « fully
responsive » ; conseil « batch process ». Cartes : PDF Forms « create » (faux), Crop « resize » (faux), Translate « any
language » (invérifiable), Sign « electronic signature » (c'est une image). Ajouté : repli iPhone/iPad des 4 outils
(OCR, Redact, PDF to Image, PDF to JPG), Google Cloud Translation pour Translate « whole PDF ».

### qr-barcodes-tools
Retiré : « instantly », « manage QR codes » ; FAQ « calendar events » (type inexistant) ; « advanced features may include
analytics in future updates » ; « Generate QR codes instantly ». Ajouté : codes statiques sans redirection, 37 types,
5 000 par ZIP/planche, CSV ≤ 5 MB, 20 codes par image, caméra = QR seulement.

### text-tools
Retiré : « powerful », « instantly », « fast and efficient », « ensuring complete privacy and security » ; carte « Find
and replace text instantly » ; conseil « share it with colleagues ». Ajouté : aperçu au-delà de 1 000 000 caractères,
stockage local de Sticky Notes, AES-256-GCM / PBKDF2 600 000, `$1` en remplacement regex (`find-replace/page.jsx:56`).

### video-tools
Retiré : « professional-grade functionality » ; « all major video formats including WMV, FLV » ; « any modern browser » ;
conseils « batch processing », « compress before uploading to speed up processing », « filters… to enhance video
quality » ; carte Subtitle Generator « Generate subtitles » (trompeur : saisie manuelle) ; « no watermark » non répété ;
suppression « right after your download » complétée (« or when the job expires »). Ajouté : liste exacte des outils et
modes qui envoient au service média, 1 GB, 300/100 MB (Trimmer), 2 GB / 700 MB (Merger), 2 min (Watermark), rotation sans
réencodage (MP4/MOV/M4V/3GP/3G2), Screen Recorder indisponible sur iPhone/iPad.

## Points laissés de côté / à surveiller
- Les mots ont augmenté (sections FAQ/conseils gardées à 4 éléments pour ne pas toucher la structure).
- `app/tools/image-tools/layout.tsx` a maintenant des fins de ligne LF dans la copie de travail (index en LF, Git les
  normalise ; aucun effet sur le contenu).
- Non vérifié dans le code : capacité des formats Whisper (renvoyé à OpenAI), durée max du service média (variable).

## Corrections après relecture (06/10)

Relecture : `docs/audit/p36/relecture/categories.md` (78 défauts). Les 78 sont traités ; chacun a été revérifié dans le code
avant correction. Mêmes fichiers autorisés ; seules des chaînes changent (arbre syntaxique des 12 `page.jsx` identique à
`HEAD` une fois les textes neutralisés ; `parseDiagnostics` = 0 sur les 24 fichiers).

Contrôles : `privacy-claims.mjs` 0 failure ; `instructions.mjs` 0 mismatch (225 pages, 1 763 libellés) ; FAQ toutes entre
25 et 70 mots, aucune réponse ouvrant par « Because / It depends / Once » ; aucune phrase commune à deux pages de catégorie
(hors « Yes. » / « No. ») ; titres ≤ 60, descriptions 110-155 (vidéo : 143), openGraph identiques.

Chiffres : `docs/audit/p36/preuves/categories.json` (83 preuves, clé `/tools/<catégorie>`), vérifiées par script : chaque
`pattern` trouve sa valeur dans `file` ET chaque `claim` figure mot pour mot dans la page ou le layout de la catégorie.
Les décomptes sans unité ont été vérifiés en exécutant le code : 14 formats de l'Audio Merger
(`app/lib/audioMerge.js` `MERGE_FORMATS`), 37 types de codes-barres (`barcode-generator/symbologies.js` `ALL.length`),
102 langues OCR (`lib/ocrLanguageCodes.js` `LANGUAGES.length`), 16 / 11 / 39 / 37 / 15 cartes (pages de catégorie).

Par page (résumé de ce qui a changé) :
- **ai-tools (5)** : condition complète de l'Upscaler sur l'appareil (WebGPU, pas de transparence, résultat qui tient en
  mémoire, sinon ou au choix : serveur) ; FAQ 2 réécrite (« We keep no text », fichiers du service média supprimés à la
  livraison ou à l'expiration) ; 2 000 mots/jour « each analysis rounded up to the next 100 words » (`lib/ai/pangram.js:56-58`) ;
  carte Data Extractor « structured data, as JSON or a table » (`lib/ai/toolPrompts.js:33-35`) ; étape 3 propre aux outils
  (AI Writer/Chatbot, verdict d'AI Detector) ; « when to try again » retiré (message horaire « try again later »).
- **audio-tools (8)** : passage par le service média au-delà de 4 MB pour Audio to Text (About + FAQ) ; question de taille
  renommée et plafond de 2 GB de la copie nettoyée d'Audio Metadata (`MetadataStripper.jsx`) ; conseil Compressor « when
  ffmpeg can read it » (`audio-compressor/page.jsx:60-61`) ; moteur ffmpeg.wasm « unless your browser has it cached » ;
  étapes 3-4 propres à l'audio (Splitter, Merger ; Equalizer WAV, Waveform PNG) ; FAQ « No, except in two cases ».
- **converter-tools (3)** : « up to 20 popular currencies » ; « Click Copy in Color Converter, select the result in the
  other converters » ; 8 devises sans historique datées « when we checked on October 3, 2026 » ; FAQ taux ouverte par
  « Daily: ».
- **developer-tools (7)** : deux exceptions (API Tester ; images liées chargées par Markdown Previewer/Editor,
  `markdown-previewer/page.jsx:60`) dans About et FAQ ; rapports d'erreur : message affiché OU plantage, nom de l'outil,
  nom et version du navigateur ; FAQ CORS sans « Because » ni Postman/curl ; cartes SCSS to CSS et TypeScript to JS
  distinctes du sous-titre. **Relecteur en partie inexact** : il proposait « SCSS or indented Sass » ; la page ne passe
  que `style` (`scss-to-css/page.jsx:14`) et dit que la syntaxe indentée n'est pas acceptée (`scss-to-css/page.jsx:36`) :
  carte « SCSS to expanded or compressed CSS ».
- **file-tools (2)** : FAQ de taille exacte (5 GB et 1 000 parties ; 700/100 MB ; 1,9 GB/300 MB ; File Metadata 300 MB
  `app/lib/embeddedMetadata.js:4` ; seuls File Encryptor, File Converter et TAR Extractor chargent tout le fichier) ;
  étape 4 propre (ZIP de ZIP/TAR Extractor, dossier dans Chrome/Edge) ; le conseil « dossier » devenu un conseil File
  Splitter (contrôle des parties).
- **gif-tools (9)** : cinq cartes vidéo→GIF différenciées (60 s une seule fois) ; GIF Maker sans « crop par image »
  (`gif-maker/page.jsx:14, 149` : un seul réglage d'ajustement) ; toute la vidéo est envoyée, le serveur coupe ; « our own
  media service (ffmpeg on Railway), not an outside conversion company » ; « says when the hourly or daily limit is
  reached » (`app/api/media/ticket/route.js:38-41`) ; FAQ taille sans « Because », « no motion prediction » ; conseils 1 et
  4 réécrits (gifsicle dans le navigateur ; Image to GIF dimensionné par la 1re image).
- **image-tools (13)** : Image Captioner nommé (OpenAI) dans About et FAQ ; Upscaler « unless it runs on your device » ;
  métadonnées : lecture JPG/HEIC/TIFF/PNG/AVIF, suppression JPG et PNG seulement, WebP non lu
  (`image-metadata/page.jsx:97, 117`) ; conseil HEIC → JPG d'abord ; Image Comparison prend deux images ; ZIP aussi pour
  Image Compressor ; carte Compressor avec ses formats ; About « works on the image… canvas API, WebGL or WebAssembly » ;
  étape 3 propre ; phrase de remplissage supprimée ; cartes Flip/HEIC to JPG/HEIC to PNG distinctes des sous-titres.
- **math-tools (4)** : 40 chiffres « when a fraction never ends » ; conseil Fraction Calculator avec la case du nombre
  entier, numérateur et dénominateur séparés (`fraction-calculator/page.jsx:25, 46`) ; FAQ 3999 sans « Because » ;
  « a change of 50% ».
- **pdf-tools (9)** : FAQ 2 réécrite (≤ 70 mots) : EPUB/MOBI/Markdown envoient du HTML construit sur la page, Translate
  texte nommé, repli iPhone/iPad = le PDF entier ; FAQ 1 : traduction texte dans l'allocation partagée, comptes propres
  (traduction PDF entier, HTML depuis une adresse, replis iPhone/iPad), service média au-delà de 4 MB ; cartes PDF Editor
  (stylo et surligneur, pas d'annotations PDF) et Redact (e-mails, téléphones, cartes, `app/lib/pdfRedact.js:56-62`) ;
  étapes 2 et 3 propres au PDF (syntaxe « 1, 3, 5-7 », « 3, 1, 2 ») ; Google Cloud Translation « when offered ».
- **qr-barcodes-tools (3)** : « 5,000 per ZIP or per PDF of label sheets » (`config.js:2 MAX_BATCH`, `labels.js:24
  MAX_LABELS`) ; dernière phrase de l'About : bibliothèques qrcode, bwip-js, zxing-wasm, jsQR (imports vérifiés) ; caméra
  « decodes with jsQR, which reads QR codes alone » ; FAQ suivi des scans allongée à 25 mots minimum.
- **text-tools (3)** : conseil « Ignore surrounding spaces » (`duplicate-remover/page.jsx:33`) ; réserve Safari 7 jours
  (`sticky-notes/page.jsx`) ; rapports d'erreur (message ou plantage, outil, navigateur, jamais le texte).
- **video-tools (11)** : carte Screen Recorder « sound in Chrome and Edge » ; méta réécrite (« some upload to our media
  service, the others work in your browser », 143 car.) ; étape 2 : 1 GB pour Compressor, Converter, Filter, Resizer,
  Rotator, Video to GIF ; étape 3 propre (« Compatible everywhere » / « Instant, lossless », « Precise cut ») ; FAQ 1 :
  Rotator obligatoire en « Compatible everywhere » pour les miroirs et les formats hors MP4/MOV/M4V/3GP/3G2
  (`video-rotator/page.jsx:62-63`), Merger « unless all clips can be copied as they are » (`video-merger/page.jsx:25-38`),
  Trimmer « Precise cut estimated at over 45 seconds locally » (`video-trimmer/page.jsx:23-29`) ; FAQ 3 et 4 précisées
  (copie impossible ; réglage de rotation réécrivable) ; conseils : 150 images PNG de Video to GIF, conditions exactes de
  copie du Merger.
- **Les 12 pages, chiffres** : preuves ajoutées (ci-dessus) ; « 4 MB » retiré de la FAQ IA lors du raccourcissement.

Mots visibles des `page.jsx` (première version → après corrections) : ai 711 → 733, audio 629 → 676, converter 480 → 496,
developer 1 026 → 1 042, file 548 → 568, gif 583 → 600, image 758 → 824, math 438 → 452, pdf 946 → 945, qr 441 → 477,
text 563 → 576, video 654 → 691.

## Corrections après deuxième passe (06/10)

Les 16 défauts de la section « Deuxième passe » de `docs/audit/p36/relecture/categories.md` sont corrigés, chacun revérifié
dans le code :
- **ai-tools** : fin de la FAQ 1 « Each tool says when a limit is reached. » (phrase unique sur le site).
- **audio-tools** : la FAQ « Is my audio uploaded? » nomme le service vocal du navigateur en mode micro (« Google's in
  Chrome »).
- **gif-tools** : conseil gifsicle conditionné au choix d'un nombre de boucles ou d'une compression
  (`GifFromVideoTool.jsx:24-25`) ; carte MOV to GIF distincte du sous-titre de l'outil.
- **image-tools** : conseil HEIC to JPG (le JPG ne recopie ni EXIF ni GPS, `heic-to-jpg/page.jsx:98`) ; Background
  Remover « a JPEG copy of at most 1,024 px » (`background-remover/page.jsx:21, 37`) ; « 25, 50 or 75% ».
- **video-tools** : Screen Recorder envoie seulement pour « Make an MP4 » (WebM, Firefox ; MP4 natif ailleurs,
  `screen-recorder/page.jsx:11-17`) ; Trimmer envoie seulement le morceau autour d'une « Precise cut » estimée à plus de
  45 s ; Rotator : « required for mirrors and for formats without a rotation setting » ; conditions de copie du Merger
  complètes (codec unique, profil, format du son, `video-merger/page.jsx:37-39`) ; « 1 GB » limité à Compressor,
  Converter, Filter, Resizer, Rotator et Video to GIF.
- **pdf-tools** : Text to PDF ajouté (About et FAQ 2 : texte qui demande une police absente → Chromium,
  `text-to-pdf/page.jsx:53`) ; FAQ 1 « Yes, for some server tools », fichiers ≤ 4 MB envoyés à LibreOffice, Chromium ou
  pdf-tools non comptés (`app/api/convert-to-pdf/route.ts:195-207`) ; Redact « keeps most of the other words searchable »
  (`pdf-redact/page.jsx:315`) ; carte Translate PDF « when offered ».
- **file-tools** : Base64 Encoder ajouté aux outils qui chargent tout le fichier (`base64-encoder/page.jsx:49`).

FAQ ramenées à 70 mots ou moins (ai, audio, file, pdf, video). Preuves : 84 (claim « 25, 50 or 75% » mis à jour, « 1,024 px »
ajouté pour image-tools), 0 problème au script de vérification. `privacy-claims.mjs` 0 failure, `instructions.mjs`
0 mismatch, `parseDiagnostics` 0, structure des `page.jsx` identique à `HEAD`. Mots des `page.jsx` (première version →
maintenant) : audio 629 → 681, gif 583 → 603, image 758 → 837, pdf 946 → 965, video 654 → 699, autres inchangés depuis la
correction précédente.

## Corrections après troisième passe (06/10)

Les 4 défauts de la section « Troisième passe » sont corrigés :
- **pdf-tools, About** : la liste des opérations du navigateur est retirée ; 113 mots (≤ 120).
- **pdf-tools, FAQ 2** : la dernière phrase nomme les quatre outils, ce qui part et où : « On iPhone and iPad, OCR, Redact,
  PDF to Image and PDF to JPG may send the whole PDF to our pdf-tools service. » (`app/lib/serverPageRender.js:58-59`,
  `app/lib/serverPageOcr.js:63, 82`). La première liste est raccourcie (« the Office and HTML converters », « Merge PDF's
  Office files ») ; la réponse fait 70 mots.
- **pdf-tools, FAQ 1** : « Other files of 4 MB or less sent to our LibreOffice, Chromium or pdf-tools service are not
  counted. » La phrase ne contredit plus les cas comptés nommés juste avant (adresse web : `lib/quota/urlPdfRateLimit.js` ;
  replis iPhone/iPad : `app/api/pdf-render`, `app/api/pdf-ocr`). 68 mots.
- **video-tools, conseil Merger** : la liste ajoute le format de pixels et l'en-tête de codec
  (`video-merger/page.jsx:37-39` : `pix_fmt`, `extradata_hash || extradata_size`).

Contrôles : `privacy-claims.mjs` 0 failure ; `instructions.mjs` 0 mismatch ; `parseDiagnostics` 0 sur les 24 fichiers ;
structure des 12 `page.jsx` identique à `HEAD` ; preuves inchangées (84), script de vérification 0 problème.
