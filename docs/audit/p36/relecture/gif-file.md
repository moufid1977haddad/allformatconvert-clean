# P36 — relecture indépendante, lot gif-file (19 pages)

Relu le 2026-10-05 sur la branche `p36` (copie de travail non commitée). Chaque affirmation a été confrontée au code lu
directement (pages, `app/components/GifFromVideoTool.jsx`, `MediaServiceTool.jsx`, `FileDownload.jsx`,
`IosOriginalNote.jsx`, `app/lib/mediaJob.js`, `app/api/media/ticket/route.js`, `lib/media/ticket.js`,
`services/media-processing/app/{jobs,main,ffmpeg_ops,config}.py`, `app/lib/{gifEncode,gifFrames,canvasLimit,fileSignature,
embeddedMetadata,textCrypto,tarReader,csvEncoding,isMobileDevice,useToolError,reportError}.js`, workers ZIP, modules
`node_modules/exifr`, `gifsicle-wasm-browser`, `@ffmpeg/ffmpeg`, `public/wasm/7zz.*`). Fiches de faits et comptes rendus
des rédacteurs non utilisés comme preuve.

Contrôles automatiques relancés (lecture seule) : `content-verify.mjs --only=gif-tools/` et `--only=file-tools/` :
0 défaut ; `instructions.mjs` : 0 mismatch ; `privacy-claims.mjs` : 0 failure. Comparaison de phrases propre au réviseur
(AST des props SEO + `metadata`, tout le site, identiques et quasi identiques par Jaccard de mots ≥ 0,6 ; jumeaux vidéo→GIF
à ≥ 0,4) : **aucune phrase identique ni quasi identique entre les cinq pages vidéo→GIF et `video-tools/video-to-gif`**
dans le texte SEO (max 0,42, avi/webm). Les doublons restants viennent du `subtitle` des pages (hors props SEO, voir D-27, D-28).

## Vérifications par format des pages vidéo→GIF (toutes justes sauf lignes du tableau)
- Moteur : ffmpeg du service média (Railway, `services/media-processing/README.md:6`), palettegen `stats_mode=diff` + paletteuse
  `dither=bayer` (`ffmpeg_ops.py:574`), `-an` (pas de son), largeur `min(w,iw)` jamais agrandie, hauteur `-2` paire
  (`ffmpeg_ops.py:323,574`) ; 13 largeurs 160-1080, 8 fps, 0,2-60 s (`GifFromVideoTool.jsx:8-10,37-38` = `ffmpeg_ops.py:301-317`).
- Contrôle de durée MP4/MOV/WebM : fait dans la page seulement si le navigateur lit la durée (`MediaServiceTool.jsx:55-58`,
  `GifFromVideoTool.jsx:40-43`) ; sinon le service refuse un début hors vidéo (« The start time is outside the video. »,
  `ffmpeg_ops.py:314-315`) et un extrait qui dépasse la fin est raccourci par `-t` sans note. WebM sans durée (MediaRecorder) :
  `Infinity` → NaN côté page, durée mesurée côté service (`ffmpeg_ops.py:276-282`). Juste.
- AVI : pas d'aperçu lisible, donc pas de contrôle local ; refus serveur du début hors vidéo ; durée maximale de source
  refusée avec message (`jobs.py:195-197`). Juste.
- MOV / iPhone : note iOS « Photo Library » / Files (`IosOriginalNote.jsx:20`), bouton « Save / Share » sur iOS
  (`FileDownload.jsx:91-95,213-216`), 1 GB identique partout (`MediaServiceTool.jsx:21,76`). Juste.
- WebM VP8/VP9/AV1 : ffmpeg n8.1.2 BtbN GPL (`Dockerfile:9-23`, libvpx, décodage AV1 exercé par `tests/run_p25_edit_tests.py:185-189`). Juste.
- Suppression : entrée effacée à la fin du traitement, succès ou échec (`jobs.py:271,400,407-408`), sortie effacée après un
  téléchargement complet (`main.py:228-240`), balayage TTL (`jobs.py:411-425`), aucun nom ni contenu en journal
  (`jobs.py:12-13,406` ; le service ne reçoit jamais le nom). « Plays » / « Compression » par gifsicle dans la page
  (`GifFromVideoTool.jsx:23-31`). Limites horaire/journalière par connexion sans chiffre (`ticket/route.js:36-42`). Juste.

## Défauts

| # | Page | Endroit | Phrase (citation courte) | Problème | Preuve (fichier:ligne ou calcul) | Correction proposée |
|---|------|---------|--------------------------|----------|----------------------------------|---------------------|
| D-1 | gif-tools/mp4-to-gif | FAQ 1 | « Browsers play MP4, so the page reads the video's duration first and refuses a start time … before anything is uploaded » | 1 — Faux pour tous les MP4 : la durée n'est lue que si ce navigateur décode le MP4 (HEVC/AV1 en MP4 souvent non) ; sinon aucun refus avant envoi, c'est le service qui refuse après l'envoi. | `MediaServiceTool.jsx:55-58` (durée seulement sur `loadedmetadata`, sinon NaN) ; `GifFromVideoTool.jsx:40` (`if (Number.isFinite(duration))`) ; `ffmpeg_ops.py:314-315` | « Yes. … When your browser can play the MP4, the page reads its duration and refuses a start after the end before uploading; otherwise our server refuses it with a message. » |
| D-2 | gif-tools/mp4-to-gif | FAQ 2 | « The GIF is made shorter, and the page tells you … a short GIF never arrives without a word » | 1 — La note n'existe que si la durée a été lue dans la page ; pour un MP4 que le navigateur ne lit pas, le GIF est raccourci par `-t` sans note. | `GifFromVideoTool.jsx:40-42` (`_note` seulement si durée finie) ; `ffmpeg_ops.py:573` (`-t` sans contrôle de fin) | Ajouter « when your browser can read the MP4's duration; otherwise the GIF simply stops where the video ends ». |
| D-3 | gif-tools/mp4-to-gif | FAQ 2 | « The GIF is made shorter, and the page tells you. » | 6 — La réponse ne commence ni par Yes / No ni par un chiffre. | Consigne §6 | Reformuler la question (« Is the GIF shortened if the clip runs past the end? ») et commencer par « Yes. ». |
| D-4 | gif-tools/mp4-to-gif | FAQ 3 | « Will the GIF be larger than the MP4? Yes, often. » | 4 — Invérifiable, et souvent faux pour ce que la page compare : « Before » = tout le MP4, « After » = un extrait de 5 s par défaut ; aucun rapport mesuré. | `MediaServiceTool.jsx:166-168` (avant = `file.size` du MP4 entier) ; `GifFromVideoTool.jsx:20` (longueur 5 s par défaut) | « It can be: second for second, a GIF is usually heavier than MP4 … » ou retirer « often » et dire seulement ce qui rend le GIF lourd. |
| D-5 | gif-tools/mov-to-gif | FAQ 1 | « so the phone only uploads the file and receives the GIF » | 1 — Pas seulement : la page lit la durée du MOV et, si « Plays » ou « Compression » est changé, gifsicle tourne sur le téléphone. | `GifFromVideoTool.jsx:23-31` (gifsicle dans la page) ; `MediaServiceTool.jsx:105` | « …so the phone uploads the file and receives the GIF; only "Plays" and "Compression", if changed, are applied on the phone. » |
| D-6 | gif-tools/avi-to-gif | About + méta | « Web browsers do not play AVI, so the work is done by ffmpeg on our server » / « Browsers cannot play AVI, so ffmpeg on our server reads it » | 1 — Lien de cause faux : la conversion se fait sur le serveur pour tous les formats (MP4 compris), pas parce que l'AVI est illisible. | `MediaServiceTool.jsx:96` (`runMediaJob` pour tout fichier) ; `GifFromVideoTool.jsx:14-15` | « ffmpeg on our server reads the AVI, which web browsers cannot play » (sans « so »). |
| D-7 | gif-tools/gif-compressor | privacy | « the GIF is read from your device and the smaller copy is written back there » | 3 — Le résultat reste dans la mémoire de la page jusqu'à « Download » (rien n'est écrit sur l'appareil), et il peut être plus gros (la FAQ 3 le dit). | `page.jsx:39-45` (Blob en mémoire) ; `page.jsx:78-85` (« Larger by ») | « …the GIF is read from your device and the compressed copy stays in this page until you download it… » |
| D-8 | gif-tools/gif-to-mp4 | privacy | « The ffmpeg.wasm engine itself is downloaded from unpkg.com the first time you convert » | 3 — Chaque clic sur « Convert to MP4 » crée un `new FFmpeg()` et appelle `load()`, qui redemande le cœur à unpkg.com (cache HTTP éventuel) : pas seulement la première fois. | `page.jsx:31,36` ; `node_modules/@ffmpeg/ffmpeg/dist/esm/const.js:4` (`CORE_URL` unpkg) | « …is fetched from unpkg.com each time you convert (your browser may reuse its cached copy); that request carries nothing about your file. » |
| D-9 | gif-tools/gif-to-mp4 | Étape 2 | « the first time, the ffmpeg.wasm engine is downloaded before the conversion starts » | 1 — Même cause que D-8 : chargé à chaque conversion. | `page.jsx:29-36` | « the ffmpeg.wasm engine is loaded before each conversion (faster once your browser has cached it). » |
| D-10 | gif-tools/gif-maker | About + FAQ 1/5 | « An animated GIF you add is split into its frames, … each keeping its own duration » / « arrive with their original durations already filled in » | 1 — Une image de GIF dont le délai est sous 20 ms (ex. 10 ms, fréquent) est préremplie mais ignorée : la « Frame Delay » commune la remplace. | `gifFrames.js:36` (délai brut, 0 → 100) ; `gif-maker/page.jsx:105-106` (`own >= 20 ? own : delay`) | Ajouter « (a delay under 20 ms uses "Frame Delay" instead) ». |
| D-11 | file-tools/file-metadata | Specs « Inside metadata » + FAQ 2 | « JPEG, PNG, WebP, TIFF, HEIC and AVIF photos (EXIF, GPS) » / « for JPEG, PNG, WebP, TIFF, HEIC and AVIF files » | 1 — Faux pour WebP : exifr 7.1.3 n'a aucun lecteur WebP (jpeg, tiff, heic, avif, png seulement) ; `exifr.parse` échoue, attrapé → « No metadata found inside this file ». | `embeddedMetadata.js:11-13,103` ; `node_modules/exifr/dist/full.esm.mjs` (`.set("jpeg"/"tiff"/"heic"/"avif"/"png")`, aucun `webp`) ; `node_modules/exifr/README.md:41` | Retirer WebP des deux phrases (« JPEG, PNG, TIFF, HEIC and AVIF »). |
| D-12 | file-tools/file-metadata | FAQ 3 | « Yes for DOCX, XLSX, PPTX and OpenDocument files: title, author, last modified by, company and similar fields » | 1 — Pour OpenDocument seuls titre, auteur, créé, modifié et générateur sont lus ; ni « last modified by » ni « company ». | `embeddedMetadata.js:50-53` (Office) vs `:56` (OpenDocument) | « …DOCX, XLSX and PPTX: title, author, last modified by, company…; OpenDocument: title, author, dates and generator. » |
| D-13 | file-tools/file-splitter | Specs « Parts » + FAQ 2 | « Up to 1,000 per split » / « at most 1,000 parts per split » | 1 — Vrai seulement pour « By size » : en « Into equal parts », aucun contrôle de `MAX_CHUNKS` (l'attribut `max` du champ n'empêche pas de taper 5000). | `file-splitter/page.jsx:63-70` (pas de test `n > MAX_CHUNKS`) ; `:72-78` (test seulement par taille) ; `:124` (`max` HTML seul) | Dire « Up to 1,000 parts when splitting by size » ou faire corriger le code (hors rédaction). |
| D-14 | file-tools/file-splitter | FAQ 1 + About | « a part from another split, is refused with a message » / « refuses a … mismatched part » | 1 — Le contrôle ne regarde que noms et tailles : une partie d'une autre découpe du même nom, de même taille de morceau (ex. autre version du fichier), passe et donne un fichier faux. | `file-splitter/page.jsx:26-35` (base de nom, numéros, tailles ; aucun contenu ni empreinte) | « …a part whose size does not fit the split is refused » ; ne pas promettre la détection d'une autre découpe. |
| D-15 | file-tools/zip-creator | Specs « On phones and tablets » + FAQ 2 | « Up to 100 MB in total » / « 100 MB on a phone or tablet » | 1 — Les tablettes Android sous Chrome/Edge/Samsung Internet ne sont pas détectées : `userAgentData.mobile` y vaut false → plafond ordinateur de 700 MB. | `app/lib/isMobileDevice.js:4-5` ; `zip-creator/page.jsx:29-33` | « on phones and iPads » ou faire corriger la détection (hors rédaction). |
| D-16 | file-tools/zip-extractor | Specs « Per extracted file » + FAQ 3 | « 300 MB on a phone or tablet » | 1 — Même détection : tablette Android sous Chromium = 1.9 GB par fichier. | `isMobileDevice.js:4-5` ; `zip-extractor/page.jsx:61,69-71` | Comme D-15. |
| D-17 | file-tools/zip-extractor | Specs « "Download all as ZIP" » | « Streamed to disk in Chrome and Edge » | 1 — Seulement là où `showSaveFilePicker` existe (ordinateur) ; Chrome Android ne l'a pas et construit le ZIP en mémoire (≤ 1.9 GB) comme Firefox. | `zip-extractor/page.jsx:174-180` | « Streamed to disk in Chrome and Edge on a computer; elsewhere built in memory up to 1.9 GB, then streamed… » |
| D-18 | file-tools/file-comparator | About | « its byte number and its hexadecimal offset, the way the cmp command reports it » | 1 — `cmp` donne le numéro d'octet (base 1) et le numéro de ligne, pas de décalage hexadécimal. | `file-comparator/page.jsx:62` (octet + `0x…`) ; sortie de cmp : « differ: byte N, line M » | « …its byte number, as the cmp command counts it, and its hexadecimal offset. » |
| D-19 | file-tools/file-converter | FAQ 2 | « the picker accepts only .txt, .csv, .json, .html and .md, so rename a .tsv file first » | 1 — `accept` ne fait que filtrer la boîte de dialogue ; sur ordinateur (Chrome, Firefox) « All files » permet de choisir un .tsv, traité de la même façon. | `file-converter/page.jsx:60` (`accept`) ; `:15,22-35` (aucun contrôle d'extension) | « Yes. The picker lists .txt, .csv, .json, .html and .md; choose "All files" or rename the .tsv… » |
| D-20 | file-tools/file-encryptor | About + étape 5 | « Decrypt reverses it and gives the original name back » / « or the original name back » | 1 — Seulement si le nom finit par « .encrypted » ; sinon le fichier reçoit « .decrypted » en plus. | `file-encryptor/page.jsx:53` | « …gives the original name back when the file ends in .encrypted (otherwise .decrypted is added). » |
| D-21 | file-tools/file-encryptor | FAQ 1 | « What happens if I type the wrong password? » → « Decryption is refused… » | 6 — La réponse ne commence ni par Yes / No ni par un chiffre. | Consigne §6 | « Is a wrong password detected? » → « Yes, for files made by the current AES version: … ». |
| D-22 | gif-tools/image-to-gif | About + titre | « Image to GIF is the quick way… » / « Quick Looping GIF That Keeps Transparency » | 4 — « quick » sans mesure ni rapport. | aucun rapport dans `docs/audit` ; consigne §4 | « the simple way » / titre « Image to GIF — Looping GIF That Keeps Transparency ». |
| D-23 | gif-tools/gif-maker | méta description + OG | « pick fit, crop or stretch, and repeats » | 6 — Anglais fautif (« pick … repeats »). | `gif-maker/layout.tsx:6,10` | « …set each duration, choose fit, crop or stretch, and the number of repeats. » (≤ 155 car.) |
| D-24 | gif-tools/avi-to-gif | subtitle (visible sous le H1) | « Convert a AVI clip into an animated GIF » | 6 — « a AVI » → « an AVI ». Chaîne hors props SEO (prop `subtitle`), à corriger par un développeur. | `avi-to-gif/page.jsx:10` | « Convert an AVI clip… » |
| D-25 | gif-tools/apng-to-gif ↔ gif-tools/gif-to-apng | méta description (+ OG) | « Convert an animated PNG to an animated GIF in your browser. » / « Convert an animated GIF to an animated PNG (APNG) in your browser. » | 5 — Phrases quasi identiques (Jaccard 0,90). | `apng-to-gif/layout.tsx:6` ; `gif-to-apng/layout.tsx:6` | Ouvrir l'une des méta sur son vrai différenciateur (ex. APNG→GIF : « Turn an APNG into a GIF for apps that do not show APNG… »). |
| D-26 | gif-tools/apng-to-gif ↔ gif-tools/gif-to-apng | Étape 3 ; specs « Timing » / FAQ 2 | « Check the (animated) result and the number of frames shown under it. » ; « a frame without a delay gets / is given 100 ms » | 5 — Quasi identiques (0,91 et 0,67). | `apng-to-gif/page.jsx:76,89` ; `gif-to-apng/page.jsx:101,109` | Réécrire une des deux pages (ex. « The frame count appears in green under the preview »). |
| D-27 | gif-tools/mp4-to-gif, mov-to-gif, avi-to-gif, webm-to-gif | subtitle (visible) | « Convert a(n) MP4/MOV/AVI/WebM clip into an animated GIF — choose the start, length, width and frame rate » | 5 — Même phrase sur les 4 jumeaux, au mot du format près (contraire à la consigne « aucune phrase commune » entre jumeaux). Hors props SEO. | `mp4-to-gif/page.jsx:10`, `mov-to-gif/page.jsx:10`, `avi-to-gif/page.jsx:10`, `webm-to-gif/page.jsx:10` | Un sous-titre propre à chaque format (ex. MOV : « iPhone and QuickTime clips to GIF, portrait kept »). |
| D-28 | gif-tools/video-to-gif ↔ video-tools/video-to-gif | subtitle (visible) | « Turn a clip of any video into an animated GIF — … » | 5 — Première proposition identique sur les deux homonymes. Hors props SEO. | `gif-tools/video-to-gif/page.jsx:10` ; `video-tools/video-to-gif/page.jsx:101` | Sous-titre propre (ex. « Any of 17 video formats to one animated GIF, six settings »). |
| D-29 | gif-tools/gif-compressor, gif-to-apng, gif-to-mp4 | Étape 1 | « Choose a .gif file; it plays in the preview box. » | 5 — Phrase identique sur trois pages. | `gif-compressor/page.jsx:96` ; `gif-to-apng/page.jsx:99` ; `gif-to-mp4/page.jsx:99` | Une étape 1 propre à chaque outil. |
| D-30 | gif-tools/gif-maker ↔ gif-tools/image-to-gif | Dernière étape | « Click "Download" to save animated.gif. » | 5 — Identique sur les deux pages jumelles. | `gif-maker/page.jsx:188` ; `image-to-gif/page.jsx:131` | Varier (ex. Image to GIF : « …the looping GIF, animated.gif »). |
| D-31 | gif-tools/gif-to-apng ↔ gif-tools/gif-to-mp4 | Specs « Frame size » | « Up to ${…} megapixels per frame » | 5 — Valeur de spec identique (apng-to-gif quasi identique). | `gif-to-apng/page.jsx:107` ; `gif-to-mp4/page.jsx:107` ; `apng-to-gif/page.jsx:82` | Préciser propre à l'outil (ex. « …read from the GIF header before ffmpeg loads »). |
| D-32 | gif-tools/gif-to-apng ↔ gif-tools/gif-to-mp4 | privacy (1re phrase) | « The GIF is converted (by ffmpeg.wasm) on this page and is not uploaded. » | 5 — Quasi identique (0,77). | `gif-to-apng/page.jsx:111` (« …decoded and the APNG encoded… ») ; `gif-to-mp4/page.jsx:111` | Reformuler l'une (ex. « ffmpeg.wasm encodes the MP4 inside this tab; the GIF never leaves it. »). |
| D-33 | gif-tools/gif-compressor ↔ file-tools/file-comparator | privacy (dernière phrase) | « If an error (message) appears, only its message / that text, cleaned of file names, is reported to our error log. » | 5 — Quasi identique (0,83). | `gif-compressor/page.jsx:110` ; `file-comparator/page.jsx:88` | Varier une des deux formulations. |
| D-34 | file-tools/file-metadata ↔ ai-tools/audio-transcriber | Étape 1 | « …there is no button to press. » | 5 — Proposition identique. | `file-metadata/page.jsx:79` ; `ai-tools/audio-transcriber/page.jsx:69` | « Choose any file; the rows appear at once. » |
| D-35 | file-tools/file-metadata ↔ file-tools/base64-encoder | Specs « Files » | « One at a time, of any type » / « One file of any type at a time » | 5 — Quasi identique (0,88). | `file-metadata/page.jsx:88` ; `base64-encoder/page.jsx:104` | « One file per reading; choosing another replaces the result ». |
| D-36 | file-tools/file-converter ↔ developer-tools/csv-to-tsv | FAQ 3 | « A file with a byte-order mark or valid UTF-8 is read as such » | 5 — Quasi identique à csv-to-tsv (« …is recognised », 0,73). | `file-converter/page.jsx:89` ; `csv-to-tsv/page.jsx:129` | Reformuler (ex. « UTF-8, with or without a BOM, and UTF-16 with a BOM are decoded directly »). |

## Remarques hors décompte (textes partagés ou preuves manquantes, exacts)
- Composants partagés identiques sur les six pages vidéo→GIF, non modifiables par les rédacteurs : ligne d'en-tête de
  `MediaServiceTool.jsx:135` (« works in every browser, including Safari and iPhone » : invérifiable ; « deleted … as soon as
  you have downloaded the result » : c'est la récupération par la page, `main.py:240`, pas le téléchargement par le visiteur) et
  paragraphe d'aide `GifFromVideoTool.jsx:85`. À signaler au propriétaire.
- `gifEncode.js:57` : le message d'erreur dit « 16 megapixels at most » alors que les pages disent, à juste titre, 16.8
  (16 777 216 px).
- Chiffres écrits en dur, exacts mais sans entrée dans `preuves/gif-file.json` : « 8 MiB » (file-comparator,
  `page.jsx:22`), « 0.2 s/seconds » (avi, webm, `GifFromVideoTool.jsx:37`), « 46 signatures » (file-metadata,
  `fileSignature.js` : 46 lignes comptées), « 50 to 1000 ms / 20 to 10000 ms » (gif-maker `:140,165`), « 100 ms »
  (apng-to-gif, gif-to-apng, gif-to-mp4).
- Orthographe britannique (« colour », « optimised ») sur les pages GIF alors que les consignes demandent l'américain ;
  l'interface elle-même dit « Colours » (libellé de référence), donc pas compté.

## Totaux
- Pages relues : **19** (11 GIF, 8 fichiers) ; plus `video-tools/video-to-gif` lue pour la comparaison des jumeaux.
- Défauts : **36**.
  - Point 1 (exactitude) : **16** — D-1, D-2, D-5, D-6, D-9, D-10, D-11, D-12, D-13, D-14, D-15, D-16, D-17, D-18, D-19, D-20.
  - Point 2 (libellés) : **0**.
  - Point 3 (lieu de traitement) : **2** — D-7, D-8.
  - Point 4 (invérifiable) : **2** — D-4, D-22.
  - Point 5 (générique / dupliqué) : **12** — D-25 à D-36.
  - Point 6 (structure / anglais) : **4** — D-3, D-21, D-23, D-24.
  - Point 7 (exemple) : **0** (aucune de ces pages n'a d'exemple).
  - Total : 16 + 0 + 2 + 2 + 12 + 4 + 0 = **36**.
- Pages **sans aucun défaut** : `file-tools/tar-extractor`.
- Pages dont le seul défaut est hors props SEO (sous-titre) : `gif-tools/webm-to-gif` (D-27), `gif-tools/video-to-gif` (D-28).

## Deuxième passe (2026-10-06)

J'ai relu les 19 pages en entier : props SEO, `metadata` et chaînes d'interface de chaque page, dont les 11 chaînes modifiées. Les règles sont les mêmes qu'au premier passage, plus les précisions du 06/10 de `CONSIGNES-REDACTION.md`. Les composants partagés (`MediaServiceTool.jsx`, `GifFromVideoTool.jsx`, `gifEncode.js`) ne sont pas comptés.

Les 36 défauts du premier passage sont corrigés, et je les ai vérifiés dans le code. Contrôles relancés :
- `instructions.mjs` : 0 mismatch.
- `privacy-claims.mjs` : 0 failure.
- `content-verify.mjs` : **1 échec C6 par catégorie** (D2-2 et D2-3 ci-dessous).
- Jumeaux vidéo→GIF et `video-tools/video-to-gif` : aucune phrase identique ou quasi identique, sous-titres compris (tous différents maintenant).
- Rapports d'erreur : chaque phrase qui en parle correspond à `reportError.js`.

| # | Page | Endroit | Phrase (citation courte) | Problème | Preuve (fichier:ligne ou calcul) | Correction proposée |
|---|------|---------|--------------------------|----------|----------------------------------|---------------------|
| D2-1 | gif-tools/mp4-to-gif | FAQ 3 (nouvelle) | « Every frame is stored as a full picture with a limited palette » | 1 — Faux pour ce GIF. L'encodeur GIF de ffmpeg a par défaut `gifflags=+offsetting+transdiff` : chaque image n'enregistre que le rectangle qui a changé, avec des pixels transparents pour ce qui reste identique. Et `-O2` de gifsicle optimise aussi quand « Plays » ou « Compression » est utilisé. | `ffmpeg_ops.py:574` (aucun `-gifflags`, donc les options par défaut de libavcodec/gif.c) ; `GifFromVideoTool.jsx:28` | « Each frame is a picture of up to 256 colors and GIF compression is weak, while an MP4 compresses the motion between frames, so a GIF grows fast with width, frame rate and length. » |
| D2-2 | gif-tools/image-to-gif | About, dernière phrase | « Everything runs in your browser with gifenc. » | 5 — Phrase générique bannie par la précision du 06/10. Échec C6 de `content-verify`. | `image-to-gif/page.jsx:124` ; `content-verify --only=gif-tools/` : `FAIL C6` | La supprimer (le lieu de traitement est déjà dans `privacy`) ou dire ce qui est propre à l'outil : « gifenc encodes the GIF in this tab. » |
| D2-3 | file-tools/file-splitter | About, dernière phrase | « Everything happens in your browser. » | 5 — Même phrase bannie. Échec C6. | `file-splitter/page.jsx:145` ; `content-verify --only=file-tools/` : `FAIL C6` | Supprimer, ou écrire « The parts are byte ranges cut by this page from your file. » |
| D2-4 | file-tools/file-converter | FAQ 3 | « other files are read with the code page that matches your browser language, so the page uses the Windows code page of your browser language, so a file saved… » | 6 — Phrase cassée : proposition répétée, deux « so » enchaînés. | `file-converter/page.jsx:89` | « …other files are read with the Windows code page of your browser language, so a file saved by Notepad or Excel on such a system decodes correctly. » |
| D2-5 | file-tools/file-comparator ↔ file-tools/zip-creator | privacy, dernière phrase | « If the comparison fails, our error log receives the cleaned message, the tool name and your browser, never the files or their names » / « If zipping fails, our error log receives the cleaned message with the tool and browser names, without your files or their names » | 5 — Quasi identiques (Jaccard 0,74). Le doublon est apparu avec la correction. | `file-comparator/page.jsx:88` ; `zip-creator/page.jsx:179` | Reformuler l'une, par exemple pour zip-creator : « A failed archive leaves a cleaned error line in our log (tool, browser); the files never travel. » |
| D2-6 | gif-tools/apng-to-gif ↔ gif-tools/gif-to-apng | Étape 1 | « …; a preview appears in the box. » / « …; it appears in the box as a preview. » | 5 — Quasi identiques (0,75) entre les deux pages jumelles. Le doublon est apparu avec la correction. | `apng-to-gif/page.jsx:74` ; `gif-to-apng/page.jsx:99` | Pour l'une, par exemple : « Choose an animated .gif; its first frames play in the box. » |
| D2-7 | gif-tools/apng-to-gif, gif-tools/gif-to-apng | Libellé de spec ; About | « Colours » (libellé de spec d'apng-to-gif) ; « Colours and transparency stay exactly as in the GIF » (gif-to-apng) | 6 — Orthographe britannique restée dans des textes SEO passés à l'américain (consigne « anglais américain »). Ce ne sont pas des libellés d'interface : l'interface de ces deux outils n'a pas d'option « Colours ». | `apng-to-gif/page.jsx:84` ; `gif-to-apng/page.jsx:96` | « Colors ». |
| D2-8 | file-tools/zip-creator | méta description + OG | « Up to 700 MB, or 100 MB on phones. » | 1 — Incomplet : l'iPad a aussi le plafond de 100 MB (détecté comme mobile). Un lecteur sur iPad attend 700 MB. | `isMobileDevice.js:9` (Macintosh + tactile = mobile) ; `zip-creator/page.jsx:32` | « …Up to 700 MB, or 100 MB on phones and iPad. » (vérifier ≤ 155 caractères) |

Totaux de la deuxième passe :
- Pages relues : 19.
- Défauts : **8**.
  - Point 1 : 2 (D2-1, D2-8).
  - Point 2 : 0.
  - Point 3 : 0.
  - Point 4 : 0.
  - Point 5 : 4 (D2-2, D2-3, D2-5, D2-6).
  - Point 6 : 2 (D2-4, D2-7).
  - Point 7 : 0.
- Pages sans aucun défaut (11) :
  - gif-tools : avi-to-gif, gif-compressor, gif-maker, gif-to-mp4, mov-to-gif, video-to-gif, webm-to-gif.
  - file-tools : file-encryptor, file-metadata, tar-extractor, zip-extractor.
