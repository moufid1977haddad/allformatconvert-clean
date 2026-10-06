# P36 — contrôle n° 2 : relecture indépendante des 12 pages de catégorie (06/10)

Pages relues : `app/tools/<cat>/page.jsx` + `layout.tsx` pour ai-tools, audio-tools, converter-tools, developer-tools,
file-tools, gif-tools, image-tools, math-tools, pdf-tools, qr-barcodes-tools, text-tools, video-tools (réécrites,
compte rendu `docs/audit/p36/redaction/categories.md`). Chaque carte, sous-titre, About, étape, FAQ, conseil et
métadonnée a été confronté au code des outils (pages, composants, `app/lib`, `app/api`, `lib/quota`, `lib/ai`,
`services/*`), branche « service média configuré » (www).

Contrôles mécaniques (script local) : titres 41-60 car., descriptions 127-152 car., openGraph = metadata, 12 titres et 12
descriptions uniques, About 72-113 mots, 4 étapes, 4 FAQ, 4 conseils partout ; aucune phrase commune à deux pages de
catégorie. Phrases identiques à une autre page du site : voir lignes « 5 » ci-dessous (cartes = sous-titre de l'outil).

| Page | Endroit | Phrase (citation courte) | Problème | Preuve | Correction proposée |
|---|---|---|---|---|---|
| ai-tools | About | « the upscaler runs on your device when your browser has WebGPU » | 1 — condition incomplète : il faut aussi une image sans transparence et un résultat que le navigateur peut tenir ; le serveur sert aussi quand le visiteur le choisit | `ai-tools/image-upscaler/page.jsx:100-102, 165, 207` | « …runs on your device when your browser has WebGPU, the image has no transparency and the result fits in memory; otherwise, or if you choose it, it uses our server. » |
| ai-tools | FAQ 2 | « We do not save what you send » | 3 — promesse excessive : l'image d'Image Upscaler (mode serveur) et son résultat restent sur le service média jusqu'au téléchargement ou l'expiration ; un audio > 4 MB d'Audio Transcriber passe par le service média | `image-upscaler/page.jsx:211` ; `app/lib/officeUpload.js:46, 99-100` ; `lib/quota/limits.js:82` | « We do not keep your text; files that pass through our media service (Image Upscaler on the server, audio over 4 MB) are deleted after your download or when the job expires. » |
| ai-tools | FAQ 1 | « 2,000 words a day per visitor » | 1 — l'allocation est comptée en mots facturés, chaque analyse arrondie à la centaine supérieure (3 analyses de 40 mots = 300) | `lib/ai/pangram.js:56-58` ; `app/api/ai-detect/route.ts:46` ; `ai-detector/page.jsx:88` | « …2,000 words a day per visitor, each analysis rounded up to the next hundred words… » |
| ai-tools | Carte Data Extractor | « Pull names, dates and prices out of pasted text » | 1 — le modèle reçoit « Extract structured data… (JSON or table format) », aucun champ nommé : « names, dates and prices » est inventé | `lib/ai/toolPrompts.js:33-35` | « Turn pasted text into structured data, as JSON or a table » |
| ai-tools | Étape 3 | « a model can make mistakes, invent facts or misjudge a text » | 5 — générique, valable sur toute page IA | — | « Check facts in AI Writer and AI Chatbot answers, and read AI Detector's verdict as an estimate. » |
| audio-tools | About | « Audio to Text sends a file through our server to OpenAI's Whisper » | 3 — incomplet : au-delà de 4 MB le fichier passe d'abord par morceaux par notre service média | `app/lib/officeUpload.js:99-100` ; `audio-tools/audio-to-text/page.jsx:212` | « …a file over 4 MB first goes to our media service, which deletes it once read. » |
| audio-tools | FAQ « Is my audio uploaded? » | « Audio to Text sends a file through our server to OpenAI » | 3 — même omission (« Only in two cases » sans l'étape service média) | `officeUpload.js:99-100` | Ajouter « (files over 4 MB pass through our media service first, deleted once read) ». |
| audio-tools | FAQ « Is there a file size limit? » | « No fixed limit in the editing tools: the whole file is loaded into your device memory » | 1 — Audio Metadata a un plafond fixe de 2 GB pour la copie nettoyée et lit le fichier par morceaux | `app/components/MetadataStripper.jsx:11, 28` ; `audio-metadata/page.jsx:60, 66` | « No fixed limit in the editing tools except Audio Metadata's clean copy (2 GB)… » |
| audio-tools | FAQ (question) | « Is there a file size limit? » | 5 — question identique sur deux autres pages | `developer-tools/hash-generator/page.jsx` ; `video-tools/video-to-audio/page.jsx` | « How large an audio file can these tools edit? » |
| audio-tools | Conseil 3 | « Audio Compressor never raises the bitrate above the source's own » | 1 — vrai seulement si ffmpeg lit le débit source ; sinon le débit choisi est appliqué tel quel | `audio-compressor/page.jsx:60-61` | « …does not encode above the source's bitrate when ffmpeg can read it… » |
| audio-tools | Étape 3 | « download that engine from unpkg.com on first use » | 1 — le moteur est chargé à chaque passage (`new FFmpeg()` + `load()`), sauf cache du navigateur | `audio-converter/page.jsx:71-83` ; `@ffmpeg/ffmpeg` const.js:4 | « …fetch that engine from unpkg.com, unless your browser has it cached. » |
| audio-tools | Étape 3 | « Set the options, such as output format, bitrate, cut times or gain » | 5 — même gabarit « Set the options, such as … » qu'image-tools, pdf-tools et video-tools (seule la liste change) | `app/tools/{image,pdf,video}-tools/page.jsx` étape 3 | Étape propre à l'audio, ex. « In Audio Splitter, choose equal parts, a part length or silence detection. » (libellés à reprendre du code) |
| audio-tools | Étape 4 | « Download the result in the format you chose » | 1 — plusieurs outils n'ont pas de choix de format (Trimmer garde le format source ou WAV avec fondu, Equalizer = WAV, Waveform = PNG) | `audio-trimmer/page.jsx:212` ; `audio-waveform/page.jsx:150` ; audio-equalizer | « Download the result: Audio Splitter gives one file per part, Equalizer a WAV, Waveform a PNG, Audio to Text TXT, SRT or VTT. » |
| converter-tools | Étape 3 | « the amount in 20 popular currencies » | 1 — la liste retire la devise de départ : 19 lignes avec USD par défaut | `currency-converter/page.jsx:14, 129` | « the amount in up to 20 popular currencies » |
| converter-tools | Étape 4 | « Copy the value you need » | 2 — seul Color Converter a des boutons Copy ; Currency et Unit Converter n'en ont pas | `color-converter/page.jsx:104, 194` ; aucun « copy » dans currency/unit/mobi | « Click Copy in Color Converter, select the result in the other converters, or download the EPUB. » |
| converter-tools | Conseil 3 | « 8 currencies, including BGN and HRK, have no history » | 4 — chiffre d'une vérification ponctuelle, sans date (la page de l'outil la date) | `currency-converter/page.jsx:155, 165` | « …8 currencies when we checked on October 3, 2026… » |
| developer-tools | About, phrase 3 | « API Tester is the one tool that sends something » | 3 / 1 — faux : Markdown Previewer et Markdown Editor affichent le HTML et DOMPurify garde `<img>`, donc le navigateur charge chaque image liée depuis son hôte (dit dans leurs propres textes de confidentialité) | `markdown-previewer/page.jsx:29, 60` ; `markdown-editor/page.jsx:29, 60` | « API Tester sends your request to the address you type; Markdown Previewer and Markdown Editor let your browser load the pictures your Markdown links to. » |
| developer-tools | FAQ 1 | « No, with one exception: API Tester sends the request… » | 3 / 1 — même omission (deux exceptions) | idem | « No, with two exceptions: … » |
| developer-tools | FAQ 1 | « only an error message they display, cleaned, reaches our error log » | 3 — « only » trop étroit : les plantages non rattrapés sont aussi signalés (ToolErrorWatch / `app/error.jsx`) | `app/tools/ToolErrorWatch.jsx:25, 33, 35-36` ; `app/lib/reportError.js:133` | « …an error message they display, or an unexpected crash, reaches our error log, cleaned, with the tool name and your browser's name and version; your code is not part of it. » |
| developer-tools | FAQ 1 | « reaches our error log with the tool name and your browser's name and version » | 5 — quasi identique à la FAQ de text-tools | `text-tools/page.jsx` FAQ 1 | Reformuler l'une des deux (ex. « pasted JSON or code is not part of it »). |
| developer-tools | FAQ 2 | « Because the request leaves your browser, which enforces CORS » | 6 — réponse « Why » qui commence par « Because » (§2d.4 précisé 06/10) | CONSIGNES-REDACTION, précisions 06/10 | « The browser enforces CORS: if the API does not allow calls from other websites, the browser blocks the response… » |
| developer-tools | FAQ 2 | « Postman and curl do not apply this rule. » | 4 — affirmation sur des logiciels tiers sans preuve dans le dépôt | aucune | Supprimer. |
| developer-tools | Cartes SCSS to CSS, TypeScript to JS | « Compile SCSS to CSS with Dart Sass » / « Strip TypeScript types » | 5 — reprennent mot pour mot (ou presque) le sous-titre de leur page d'outil | `scss-to-css/page.jsx:20` ; `typescript-to-js/page.jsx:19` | « SCSS or indented Sass to expanded or compressed CSS » (vérifier `codeTools.js:73-75`) ; « Remove TypeScript types, keep the JavaScript » |
| file-tools | FAQ « Is there a size limit? » | « The others read the whole file into memory, so your device sets the limit. » | 1 — faux pour File Comparator (lecture par blocs de 8 MiB) et File Metadata (premiers octets ; plafond 300 MB pour les détails PDF/ZIP) ; File Splitter a aussi un plafond de 1 000 parties | `file-comparator/page.jsx:19-27` ; `file-metadata/page.jsx:23, 87` ; `lib/embeddedMetadata.js:4, 26, 41` ; `file-splitter/config.js:30` | « …File Metadata does not read PDF or ZIP details above 300 MB. File Encryptor, Base64 Encoder and TAR Extractor load the whole file, so your device sets their limit. » |
| file-tools | Étape 4 | « Save each file on its own, or all of them in one ZIP when the tool offers it. » | 5 — générique | — | « ZIP Extractor and TAR Extractor offer every file in one ZIP; ZIP Extractor can also save to a folder. » |
| gif-tools | Carte GIF Maker | « per-frame order, delay and crop » | 1 — le recadrage n'est pas par image (un seul réglage `fit` pour toutes) | `gif-maker/page.jsx:14, 28, 98, 149` | « Build a GIF: reorder frames, set each one's delay, choose the size » |
| gif-tools | Étape 3 | « GIF Maker also gives each frame its own duration and crop » | 1 — même erreur sur le recadrage ; Image to GIF ne permet pas de réordonner (seulement retirer) | `gif-maker/page.jsx:72, 140, 149` ; `image-to-gif/page.jsx:52` | « Add the images in the order you want (GIF Maker can also move frames) and set the delay; GIF Maker can give a frame its own duration. » |
| gif-tools | Étape 2 | « the clip is then uploaded and converted on our server » | 1 / 3 — c'est toute la vidéo qui est envoyée ; le service coupe l'extrait | `MediaServiceTool.jsx:96` ; `GifFromVideoTool.jsx:44` | « …the whole video file is then uploaded, and our server cuts and converts the clip. » |
| gif-tools | FAQ « Are my videos uploaded? » | « our own media service, never a third party » | 3 — le service tourne chez Railway (hébergeur), comme le disent les pages d'outils | `mp4-to-gif/page.jsx` (privacy « hosted on Railway ») | « …our own media service (ffmpeg on Railway), not an outside conversion company… » |
| gif-tools | FAQ « Is there a limit on conversions? » | « the page says when you can try again » | 1 — le message horaire dit seulement « Please try again later » | `app/api/media/ticket/route.js:38-41` | « …and the page says when the hourly or daily limit is reached. » |
| gif-tools | FAQ « Why is my GIF larger… » | « Because a GIF stores every frame … without the compression between frames » | 6 / 1 — commence par « Because » ; et le GIF a une compression inter-images simple (zone modifiée), ce qui lui manque c'est la prédiction de mouvement | précisions 06/10 ; FAQ de `mp4-to-gif/page.jsx` | « A GIF keeps at most 256 colors per frame and has no motion prediction, unlike MP4, so it grows fast with length and width… » |
| gif-tools | Conseil 4 | « Image to GIF gives every frame the shape of the first image; use GIF Maker when your pictures need cropping » | 1 — Image to GIF propose aussi « Crop to fill (keep proportions) » ; GIF Maker ajoute la taille de sortie, l'ordre et les durées | `image-to-gif/page.jsx:12, 108-109` ; `gif-maker/page.jsx:14` | « Image to GIF sizes the GIF from the first image; use GIF Maker to choose the output size or reorder frames. » |
| gif-tools | Cartes vidéo→GIF ×5 | « Turn up to 60 s of a/an … into a GIF » | 5 — cinq cartes jumelles quasi identiques, rien de propre à chacune | `gif-tools/page.jsx:6-14` | Une particularité réelle par carte (Video to GIF : liste des formats acceptés ; MOV : vidéos iPhone/QuickTime…), « 60 s » une seule fois. |
| gif-tools | Conseil 1 | « every extra second adds frames and size to the GIF » | 5 — générique | — | Supprimer, ou le rattacher aux réglages par défaut réels de l'outil. |
| image-tools | About | « The two image tools that use a server, Background Remover and Image Upscaler » | 3 — Image Captioner envoie aussi l'image (à OpenAI via notre serveur) | `ai-tools/image-captioner/page.jsx:47` (`/api/ai-vision`) | « …Image Captioner sends the image to OpenAI through our server, Background Remover to our own service, and Image Upscaler uses our server when it does not run on your device. » |
| image-tools | FAQ « Are my images uploaded? » | « Only Background Remover and Image Upscaler, in AI Tools, send an image » | 3 — omet Image Captioner | idem | Nommer Image Captioner et OpenAI. |
| image-tools | FAQ « Are my images uploaded? » | « the upscaler does so only when it cannot run on your device » | 3 — aussi quand le visiteur clique pour utiliser le serveur | `image-upscaler/page.jsx:165, 207` | « …or when you choose our server. » |
| image-tools | FAQ GPS | « saves a copy without metadata for JPG, PNG and WebP files » | 1 — la suppression ne vaut que pour JPG et PNG ; les métadonnées WebP ne sont pas lues | `image-metadata/page.jsx:97, 117` | « …for JPG and PNG files; WebP metadata is not read. » |
| image-tools | FAQ GPS | « shows the EXIF, GPS, IPTC and XMP data of an image » | 1 — lit JPEG, HEIC/HEIF, TIFF, PNG, AVIF, pas WebP | `image-metadata/page.jsx:97` | « …of a JPG, HEIC, TIFF, PNG or AVIF image… » |
| image-tools | Conseil 1 | « check Image Metadata Viewer for GPS coordinates and save a copy without them » | 1 — une photo HEIC (format iPhone par défaut) est refusée pour la suppression | `image-metadata/page.jsx:117` | Ajouter « for JPG and PNG; convert a HEIC photo to JPG first ». |
| image-tools | FAQ « How many images… » | « the other tools take one image at a time » | 1 — Image Comparison en prend deux | `image-comparison/page.jsx` (2 `type="file"`) | « …Image Comparison takes two; the other tools take one image at a time. » |
| image-tools | Étape 4 | « with several images, Image Converter offers them in one ZIP » | 1 — Image Compressor aussi | `image-compressor/page.jsx:299` (`zipName="compressed-images.zip"`) | « …Image Compressor and Image Converter offer them in one ZIP. » |
| image-tools | Carte Image Compressor | « Compress up to 20 images, format kept » | 1 — BMP et autres formats lisibles ressortent en JPG | `image-compressor/page.jsx:335, 345` | « Compress up to 20 JPG, PNG, WebP, AVIF or SVG images, format kept » |
| image-tools | About | « Every tool on this page edits the image in your browser, with the canvas API » | 1 — Metadata Viewer, Duplicate Finder, Image to Base64 n'éditent rien ; Compressor utilise WebAssembly (MozJPEG, SVGO), Blur WebGL2 | `image-compressor/page.jsx:335` ; pages image-blur, image-to-base64 | « Every tool on this page works on the image in your browser, with the canvas API, WebGL or WebAssembly code loaded from our site… » |
| image-tools | Étape 3 | « Set the options, such as quality, size in pixels, angle or effect strength. » | 5 — gabarit commun avec audio/pdf/video | étape 3 des 4 pages | « Set the Quality slider in PNG to JPG, the angle in Image Rotate or the radius in Image Blur. » (libellés à vérifier) |
| image-tools | FAQ formats | « Each tool page lists what it opens. » | 5 — phrase de remplissage | — | Supprimer. |
| image-tools | Cartes Image Flip, HEIC to JPG, HEIC to PNG | « Flip images horizontally or vertically » / « Convert iPhone HEIC photos to JPG/PNG » | 5 — identiques (ou à « format » près) au sous-titre de la page de l'outil | `image-flip/page.jsx:43` ; `heic-to-jpg/page.jsx:55` ; `heic-to-png/page.jsx:53` | Carte reformulée sur un fait propre (ex. HEIC to JPG : réglage de qualité ; Flip : axe et aperçu), différente du sous-titre. |
| math-tools | FAQ précision | « Number Base Converter is exact and shows 40 digits after the point » | 1 — 40 chiffres seulement si la fraction ne se termine pas ; sinon affichage complet plus court | `number-base-converter/page.jsx:15, 25` | « …stops at 40 digits after the point, marked …, when a fraction never ends » |
| math-tools | Conseil 2 | « type a mixed number as 1 3/4 » | 2 — l'interface a une case séparée « Whole number » ; on ne tape pas « 1 3/4 » | `fraction-calculator/page.jsx:46, 126` | « …put the 1 of 1 3/4 in the whole-number box, then 3 over 4 » |
| math-tools | FAQ « Why… 3999? » | « Because standard Roman numerals… » | 6 — réponse « Why » qui commence par « Because » | précisions 06/10 | « MMMCMXCIX (3999) is the largest standard form: there is no symbol above M, and M repeats at most three times. » |
| math-tools | Conseil 4 | « a change of +50 % » | 6 — typographie française (espace avant %) ; l'outil affiche « 50% » sans signe + | `percentage-calculator/page.jsx:55` | « a change of 50% » |
| pdf-tools | FAQ 2 (confidentialité) | « can pass a page the device does not finish to our pdf-tools service » | 3 — c'est le PDF entier qui est envoyé (direct < 4 MB, via service média au-delà) ; pour l'OCR, la page en échec et toutes les suivantes | `app/lib/serverPageRender.js:58-59, 66` ; `app/lib/serverPageOcr.js:63, 82` ; `app/components/PdfToImages.jsx:189` | « …on iPhone and iPad, PDF OCR, Redact PDF, PDF to Image and PDF to JPG send the whole PDF to our pdf-tools service when the device cannot finish a page; it is deleted afterwards. » |
| pdf-tools | FAQ 2 | « These do: Word, Excel, PowerPoint, HTML, EPUB and MOBI to PDF… » | 3 — EPUB et MOBI to PDF n'envoient pas le fichier, seulement du HTML construit dans le navigateur | `epub-to-pdf/page.jsx:215, 276` ; `mobi-to-pdf/page.jsx:226, 286` | Classer EPUB et MOBI avec Markdown : « send HTML built in your browser, not the original file ». |
| pdf-tools | FAQ 2 | « AI PDF Summary sends the extracted text » | 3 — omet Translate PDF « Text only », qui envoie aussi le texte extrait à OpenAI via notre serveur | `pdf-translate/page.jsx:75-80, 143` | « AI PDF Summary and Translate PDF (text mode) send the extracted text to OpenAI. » |
| pdf-tools | FAQ 2 | réponse entière | 6 — 90 mots (règle 25-70) | décompte | Raccourcir en intégrant les trois corrections ci-dessus. |
| pdf-tools | FAQ 1 (limites) | « The tools that run in your browser have no such count. » / allocation ConvertAPI + AI PDF Summary | 1 — incomplet : Translate PDF texte partage l'allocation `/api/ai` ; Translate « Whole PDF » a 20 pages par document, un compte de pages par jour et son budget ; HTML to PDF par URL a sa propre limite horaire/journalière ; le rendu et l'OCR serveur iPhone/iPad comptent des pages par heure et par jour | `pdf-translate/page.jsx:75-80` ; `lib/quota/pdfTranslate.js:19, 37` ; `app/api/pdf-translate-document/route.ts:6, 13` ; `lib/quota/urlPdfRateLimit.js:31-33` ; `lib/quota/pdfRenderRateLimit.js:14-16` ; `lib/quota/pdfOcrRateLimit.js:12` | Ajouter ces cas sans chiffre (sauf 20 pages, constante du code). |
| pdf-tools | Carte PDF Editor | « add text, images & annotations » | 1 — stylo et surligneur sont dessinés dans le contenu de la page, pas en annotations PDF | `pdf-editor/page.jsx:516` | « Rearrange pages, add text, pictures, pen and highlights » |
| pdf-tools | Carte Redact PDF | « Black out words, emails and numbers in the pixels » | 1 — seuls les numéros de téléphone et de carte (Luhn) sont détectés | `app/lib/pdfRedact.js:56-62` | « Black out words, emails, phone and card numbers in the pixels » |
| pdf-tools | Étape 2 | « Read the size limit and the processing note on the tool page… they differ between tools. » | 5 — générique (même idée qu'ai-tools étape 2) | — | Étape propre au PDF (où chaque famille d'outils traite le fichier). |
| pdf-tools | Étape 3 | « Set the options, such as page ranges, rotation angle, compression level or output format. » | 5 — gabarit commun avec audio/image/video | étape 3 des 4 pages | « Type page numbers and ranges such as 2, 5-7 in Split, Rotate, Delete Pages or Crop. » (syntaxe à vérifier dans le code) |
| qr-barcodes-tools | FAQ lot + Étape 3 | « 5,000 per ZIP or per PDF sheet of labels » | 1 — la limite est 5 000 étiquettes par PDF, un PDF contient plusieurs planches | `barcode-generator/labels.js:24` ; `barcode-generator/page.jsx:310, 457` | « 5,000 per ZIP or per PDF of label sheets » |
| qr-barcodes-tools | About, dernière phrase | « All three work in your browser. » | 5 — phrase courte générique bannie | précisions 06/10 | « They draw and decode codes on your device with bwip-js, zxing-cpp and jsQR; no code or picture is uploaded. » |
| qr-barcodes-tools | FAQ scanner | « The live camera reads QR codes only. » | 5 — phrase identique sur la page QR Scanner | `qr-scanner/page.jsx:238` | « Camera mode uses jsQR, which decodes QR codes alone. » |
| text-tools | Conseil 1 | « Run Whitespace Remover before Duplicate Remover, so lines that differ only by spaces are treated as duplicates » | 1 — Duplicate Remover a déjà « Ignore surrounding spaces » ; Whitespace Remover n'aide que pour les espaces internes | `duplicate-remover/page.jsx:33` | « Tick "Ignore surrounding spaces" in Duplicate Remover; for doubled spaces inside lines, run Whitespace Remover first. » |
| text-tools | FAQ Sticky Notes | « Yes, in this browser only… » | 1 — omet l'effacement par Safari après 7 jours sans visite, que la page de l'outil mentionne | `sticky-notes/page.jsx` (description) | Ajouter la réserve Safari. |
| text-tools | FAQ « Is my text sent to a server? » | « Only an error message shown by a tool, cleaned, reaches our error log » | 3 — « only » : les plantages non affichés sont aussi signalés (ToolErrorWatch / `app/error.jsx`) | précisions 06/10 ; `app/lib/reportError.js` | « …An error message shown by a tool, or a crash of the page, sends us the cleaned message, the tool name and your browser's name and version, never your text. » |
| video-tools | Carte Screen Recorder | « Record a screen, window or tab with its sound » | 1 — son seulement sur Chrome/Edge et pour un onglet ou l'écran entier ; pas pour une fenêtre ; aucun son sur Firefox/Safari | `screen-recorder/page.jsx` (specs + FAQ « Does it record sound? ») | « Record a screen, window or tab, with tab sound on Chrome and Edge » |
| video-tools | layout.tsx description (+ OG) | « Re-encoding runs on our own media service; extraction runs in your browser. » | 1 / 3 — faux dans les deux sens : Video Watermark, Video to Audio et les coupes précises courtes de Trimmer réencodent dans le navigateur (ffmpeg.wasm) | `video-watermark/page.jsx:286-416` ; `video-to-audio/page.jsx:47` ; `video-trimmer/page.jsx:25-29` | « 15 video tools to compress, convert, trim, merge, rotate, resize and record; some upload to our media service, the rest work in your browser. » (110-155 car.) |
| video-tools | Étape 2 | « the tools that use our media service accept up to 1 GB per file » | 1 — Trimmer (300 / 100 MB) et Merger (2 GB / 700 MB au total) ont d'autres limites | `video-trimmer/page.jsx:40-41` ; `video-merger/page.jsx:60` ; `MediaServiceTool.jsx:21` | « Compressor, Converter, Filter, Resizer, Rotator and Video to GIF accept up to 1 GB; each page shows its own limit. » |
| video-tools | Étape 3 | « Set the options, such as codec, target format, cut points or rotation, and start the job. » | 5 — gabarit commun avec audio/image/pdf | étape 3 des 4 pages | Étape propre (choix « Compatible everywhere » / « Instant, lossless » de Rotator, ou « Precise cut » de Trimmer). |
| video-tools | FAQ 1 (Rotator) | « Video Rotator does in its "Compatible everywhere" mode » | 3 — incomplet : les fichiers autres que MP4/MOV/M4V/3GP/3G2 n'ont pas le choix et sont toujours envoyés | `video-rotator/page.jsx:27, 33, 79-80, 123` | « …in its default "Compatible everywhere" mode, and always for WebM, MKV, AVI and other non-MP4/MOV files » |
| video-tools | FAQ 1 (Merger) | « Video Merger when the clips differ » | 3 — envoi aussi quand les clips sont identiques mais pas H.264/HEVC + AAC, ou sans en-tête de codec | `video-merger/page.jsx:25-26, 38, 97` | « …unless all clips are H.264 or HEVC with AAC sound and identical settings » |
| video-tools | FAQ 1 (Trimmer) | « Video Trimmer for a long precise cut » | 3 — l'envoi dépend du temps local estimé (durée × résolution × navigateur) > 45 s, pas de la longueur seule | `video-trimmer/page.jsx:23-29` | « …for a "Precise cut" the page estimates would take over about 45 seconds in your browser » |
| video-tools | FAQ 3 | « merging clips that differ counts one job per clip » | 1 — même condition incomplète | `video-merger/page.jsx:97-110` | « …clips that cannot be joined as they are count one job per clip » |
| video-tools | FAQ 4 | « Yes, for MP4, MOV, M4V, 3GP and 3G2 files » | 1 — la réécriture sans perte peut échouer (`rotateIsoBmff` renvoie null) et la page refuse alors | `video-rotator/page.jsx:62-63` ; `mp4Rotate.js:71` | Ajouter « when the file's rotation setting can be rewritten ». |
| video-tools | Conseil 1 | « choose a precise cut » | 2 — le libellé est la case « Precise cut » | `video-trimmer/page.jsx:268-269` | « tick "Precise cut" for a frame-exact start » |
| video-tools | Conseil 2 | « Clips with the same H.264 or HEVC encoding settings are joined … without re-encoding or upload » | 1 — il faut aussi un son AAC (ou aucun), mêmes taille, cadence, rotation et un en-tête de codec | `video-merger/page.jsx:25-38` | « Clips from the same camera, H.264 or HEVC with AAC sound and identical settings, are joined… » |
| les 12 pages | Chiffres écrits en dur | ex. video 18, 22, 60 s, 2 min, 1 GB, 300/100 MB, 2 GB/700 MB ; pdf 102, 200 MB, 100 MB, 4 MB ; qr 37, 5,000, 5 MB ; file 5 GB, 1.9 GB… | 6 (C3) — aucune entrée `/tools/<catégorie>` dans `docs/audit/p36/preuves/*.json` ; `content-verify.mjs` ne couvre pas les pages de catégorie. Valeurs revérifiées à la main (justes, sauf défauts listés) | `grep '"/tools/[a-z-]*-tools"' docs/audit/p36/preuves/*.json` : 0 | Ajouter les preuves par page de catégorie ou calculer depuis les constantes. |

## Bilan

Pages relues : 12 (24 fichiers ; 206 cartes).

Défauts : **78** (une ligne = un défaut ; la ligne « les 12 pages » compte pour 1).

| Point | Nombre |
|---|---|
| 1 Exactitude | 34 |
| 2 Libellés | 3 |
| 3 Lieu de traitement / confidentialité | 17 |
| 4 Invérifiable | 2 |
| 5 Générique / dupliqué | 16 |
| 6 Structure | 6 |
| 7 Exemple | 0 |

(Comptage par point principal de chaque ligne ; les lignes marquées « 1 / 3 » ou « 6 / 1 » sont comptées sous le premier
point.)

Par page : ai-tools 5, audio-tools 8, converter-tools 3, developer-tools 7, file-tools 2, gif-tools 9, image-tools 13,
math-tools 4, pdf-tools 9, qr-barcodes-tools 3, text-tools 3, video-tools 11 (+ 1 ligne commune aux 12).

Vérifié juste (extraits) : 13 outils via OpenAI (gpt-4o-mini, whisper-1, gpt-image-2), Pangram 40-1 000 mots, 8 000
caractères / 1 000 jetons, 5 images/jour, 1 024 px ; 18 formats audio, 14 du Merger, 25 MB Whisper, Opus sur le service
média ; 60 s / 1 GB vidéo→GIF ; 22 cibles vidéo, 7 filtres, 2 min Watermark, Screen Recorder absent sur iPhone/iPad,
règles de suppression du service média ; 39 outils PDF, routage Gotenberg / pdf-tools / ConvertAPI / Google, 200 MB et
100 MB, 102 langues OCR ; 37 outils image, seuls Compressor/Converter/Duplicate Finder en `multiple`, aucun envoi dans
`image-tools` ; aucun appel réseau en dehors d'API Tester (hors images Markdown) dans developer-tools, 56 cartes sur 58
exactes ; Frankfurter (codes de devise) ; 12 / 10 chiffres, 1-3999, 23 statistiques ; 37 types de codes-barres, CSV
5 MB, 20 codes par image ; 1 000 000 caractères, AES-256-GCM / PBKDF2 600 000, `$1`.

**Pages sans aucun défaut : aucune.**

## Deuxième passe (06/10)

Relu à nouveau en entier : les 12 `page.jsx` et `layout.tsx` (cartes, sous-titres, About, étapes, FAQ, conseils,
métadonnées) et `docs/audit/p36/preuves/categories.json`. Les 78 défauts de la première passe sont corrigés
correctement. Contestation acceptée : la carte SCSS to CSS ne doit pas citer la syntaxe indentée, car la page ne passe que
`style` et `scssToCss` prend `syntax = 'scss'` par défaut (`scss-to-css/page.jsx:14` ; `app/lib/codeTools.js:73-75`).

Contrôles mécaniques : titres 41-60 car., descriptions 127-152 car. (vidéo 143), openGraph identique, About 72-115 mots,
4/4/4 partout. Les 83 preuves sont vérifiées par script : chaque `claim` figure dans la page ou le layout, chaque
`pattern` trouve sa valeur dans `file`, et aucun nombre avec unité n'est sans preuve (hors classes CSS). Les preuves
faibles (0.2 s, 150 images PNG, « 4 more filters ») ont été recalculées dans le code et sont justes.

| Page | Endroit | Phrase (citation courte) | Problème | Preuve | Correction proposée |
|---|---|---|---|---|---|
| ai-tools | FAQ 1, dernière phrase | « The page says when a limit is reached. » | 5 — phrase identique sur une autre page du site | `audio-tools/audio-to-text/page.jsx` (même phrase) | « Each tool shows a message when its hourly, daily or word allowance runs out. » |
| audio-tools | FAQ « Is my audio uploaded? » | « No, except in two cases… leaves the microphone mode to your browser's speech service » | 3 — cache un troisième envoi : dans Chrome, le son du micro part chez Google (l'About le dit, pas cette FAQ) | `audio-tools/page.jsx` About ; mode micro d'`audio-to-text` | « …in its microphone mode your browser's speech service does the recognition, which in Chrome sends the audio to Google. » |
| gif-tools | Conseil 1 | « the page sets the loop count and compression with gifsicle in your browser » | 1 — gifsicle ne tourne que si l'on choisit un nombre de boucles autre que « Forever » ou une compression ; avec les valeurs par défaut, rien ne tourne | `app/components/GifFromVideoTool.jsx:24-28` (`if (loop === 'forever' && !lossy) return null`) | « If you choose a loop count or compression, the page applies it with gifsicle in your browser, not on our server. » |
| gif-tools | Carte MOV to GIF | « iPhone and QuickTime MOV clips to a GIF » | 5 — presque identique au sous-titre de la page de l'outil (« iPhone and QuickTime MOV clips to animated GIF… ») | `gif-tools/mov-to-gif/page.jsx:10` | « MOV videos from an iPhone or a Mac, turned into a GIF » |
| image-tools | Conseil 1 | « convert it with HEIC to JPG, then save a copy without GPS coordinates in Image Metadata Viewer » | 1 — la 2e étape est inutile : HEIC to JPG ne recopie déjà pas l'EXIF ni le GPS | `image-tools/heic-to-jpg/page.jsx:98` | « Before posting an iPhone photo, convert it with HEIC to JPG: the JPG keeps no EXIF or GPS data. Check any other JPG or PNG in Image Metadata Viewer. » |
| image-tools | FAQ « Are my images uploaded? » | « Background Remover sends a reduced copy » | 3 — la copie n'est réduite que si la photo dépasse 1 024 px ; sinon c'est une copie JPEG à sa taille | `ai-tools/background-remover/page.jsx:21, 37` (`Math.min(1, RESIZE_TARGET_PX / …)`) | « …a JPEG copy of at most 1,024 px… » |
| image-tools | Carte Image Resizer | « by 25, 50 or 75 % » | 6 — espace français avant % (corrigé ailleurs en « 50% ») | `image-tools/page.jsx` (carte) ; `claim` de la preuve | « 25, 50 or 75% », et mettre à jour le `claim` de la preuve |
| video-tools | FAQ 1 (Screen Recorder) | « and Screen Recorder for an MP4 » | 3 — l'MP4 est enregistré directement, sans envoi, dans Safari et Chrome/Edge 126+ ; l'envoi n'a lieu que pour un WebM (Firefox) quand on clique « Make an MP4 » | `video-tools/screen-recorder/page.jsx:11-17, 166, 174` | « and Screen Recorder when you click "Make an MP4" on a WebM recording » |
| video-tools | FAQ 1 (Trimmer) | « Video Trimmer for a "Precise cut" estimated at over 45 seconds locally » | 3 — une vidéo de largeur ou hauteur impaire reste toujours dans le navigateur ; seul le morceau coupé depuis l'image clé précédant le début est envoyé, pas le fichier entier | `video-tools/video-trimmer/page.jsx:19-27` | « Video Trimmer, for a "Precise cut" estimated at over 45 seconds in your browser, sends only the piece around the start » |
| video-tools | Conseil 2 (Merger) | « all H.264 or HEVC, with AAC sound or none, and share size, frame rate and rotation » | 1 — conditions de copie encore incomplètes : même codec (pas de mélange H.264/HEVC), même profil, format de pixels et en-tête de codec ; pour le son, même fréquence et même nombre de canaux | `video-tools/video-merger/page.jsx:37-39, 103` | « Clips with identical settings (all H.264 or all HEVC, AAC sound or none, same size, frame rate, rotation, profile and sound format), such as clips from one camera, are joined… » |
| video-tools | FAQ 2, 1re phrase | « 1 GB per file for the tools that use our media service. » | 1 — contredit la phrase suivante : Trimmer (300/100 MB) et Merger (2 GB/700 MB) utilisent aussi le service | `video-trimmer/page.jsx:40-41` ; `video-merger/page.jsx:60` | « 1 GB per file for Compressor, Converter, Filter, Resizer, Rotator and Video to GIF. » |
| pdf-tools | About, phrase 2 + FAQ 2 | « Excel, PowerPoint, HTML, Markdown, EPUB and MOBI to PDF … » / « EPUB, MOBI and Markdown to PDF send HTML built on the page » | 3 — Text to PDF manque : quand le texte contient des emoji, du bengali ou des caractères absents des polices, il part vers notre service Chromium (Gotenberg) | `pdf-tools/text-to-pdf/page.jsx:53` (`/api/convert-html-to-pdf`), `:132` | Ajouter « and Text to PDF when the text needs a font we do not have » (FAQ 2 ≤ 70 mots) |
| pdf-tools | FAQ 1 | « Yes, for the tools that call a server. » | 1 — trop large : les envois directs (≤ 4 MB) vers Gotenberg et pdf-tools ne sont pas comptés (Excel/PowerPoint/HTML/Text/Markdown/EPUB/MOBI to PDF, Word hors .docx, Compress, Repair, PDF/A) ; seule la branche ConvertAPI appelle `guardPaidRoute` | `app/api/convert-to-pdf/route.ts:195-207` ; aucune garde dans `app/api/convert-html-to-pdf`, `app/api/pdf-compress` | « Yes, for some server tools. … Files of 4 MB or less sent to our LibreOffice, Chromium or pdf-tools service are not counted, nor are the tools that run in your browser. » |
| pdf-tools | FAQ 4 (Redact) | « an invisible text layer keeps the other words searchable » | 1 — trop fort : la FAQ de l'outil dit « Yes, mostly » (mots collés à un cadre, texte vertical, lettres absentes de la police standard) | `pdf-tools/pdf-redact/page.jsx:315` | « …keeps most of the other words searchable. » |
| pdf-tools | Carte Translate PDF | « Translate a PDF's text, or the whole file » | 4 — le mode « fichier entier » n'apparaît que si le serveur annonce Google Cloud Translation configuré ; l'About nuance (« when offered »), pas la carte | `pdf-tools/pdf-translate/page.jsx:16-17` | « Translate a PDF's text, or the whole file when offered » |
| file-tools | FAQ « Is there a size limit? » | « File Encryptor, File Converter and TAR Extractor load the whole file. » | 1 — liste incomplète : Base64 Encoder lit aussi tout le fichier en mémoire, sans plafond | `file-tools/base64-encoder/page.jsx:49` (`readAsDataURL(file)`) | « File Encryptor, File Converter, Base64 Encoder and TAR Extractor load the whole file. » |

### Bilan de la deuxième passe

Pages relues : 12. Défauts restants : **16**.

| Point | Nombre |
|---|---|
| 1 Exactitude | 7 |
| 2 Libellés | 0 |
| 3 Lieu de traitement / confidentialité | 5 |
| 4 Invérifiable | 1 |
| 5 Générique / dupliqué | 2 |
| 6 Structure | 1 |
| 7 Exemple | 0 |

Par page : video-tools 4, pdf-tools 4, image-tools 3, gif-tools 2, ai-tools 1, audio-tools 1, file-tools 1.

**Pages sans aucun défaut : converter-tools, developer-tools, math-tools, qr-barcodes-tools, text-tools.**

## Troisième passe (06/10)

Relu à nouveau en entier : les 7 pages touchées (ai, audio, file, gif, image, pdf, video : `page.jsx` et `layout.tsx`)
et les 84 preuves. Le script de preuves ne signale rien : chaque claim figure sur la page, chaque pattern trouve sa valeur
et aucun nombre avec unité n'est sans preuve. Les métadonnées n'ont pas changé et restent dans les limites. Aucune phrase de
ces pages n'est commune à une autre page de catégorie ni à une page d'outil.

Les 16 corrections de la deuxième passe sont justes. Les routes que la FAQ 1 de pdf-tools dit « non comptées » ne
s'appliquent bien aucune garde pour un envoi direct : `convert-html-to-pdf`, `pdf-compress`, `pdf-repair`, `pdf-to-pdfa` et la
branche non-ConvertAPI de `convert-to-pdf`. Seules `pdf-render` et `pdf-ocr` ont une limite.

| Page | Endroit | Phrase (citation courte) | Problème | Preuve | Correction proposée |
|---|---|---|---|---|---|
| pdf-tools | About | paragraphe entier (128 mots) | 6 — l'About dépasse 120 mots (règle 60-120) depuis l'ajout de Text to PDF | décompte du texte rendu de `pdf-tools/page.jsx` (About) | Raccourcir, par exemple en retirant la liste des opérations du navigateur (« including merging PDFs and images, splitting… ») |
| pdf-tools | FAQ 2, dernière phrase | « On iPhone and iPad, four tools may too. » | 3 — la phrase est devenue vague en raccourcissant : elle ne dit plus quels outils, quoi (le PDF entier) ni où (notre service pdf-tools) | `app/lib/serverPageRender.js:58-59` ; `app/lib/serverPageOcr.js:63, 82` | « On iPhone and iPad, PDF OCR, Redact, PDF to Image and PDF to JPG may send the whole PDF to our pdf-tools service. » (≤ 70 mots, en raccourcissant la première liste) |
| pdf-tools | FAQ 1, dernière phrase | « Smaller files sent to our LibreOffice, Chromium or pdf-tools service are not counted. » | 1 — prise à la lettre, la phrase contredit la précédente : les replis iPhone/iPad (pdf-tools) et HTML to PDF depuis une adresse (Chromium) sont comptés | `app/api/pdf-render/route.ts:14` ; `app/api/pdf-ocr/route.ts:16` ; `lib/quota/urlPdfRateLimit.js:31-33` | « Other files of 4 MB or less sent to our LibreOffice, Chromium or pdf-tools service are not counted. » |
| video-tools | Conseil 2 (Merger) | « identical settings (all H.264 or all HEVC, AAC sound or none, same size, frame rate, rotation, profile and sound format) » | 1 — la parenthèse se lit comme la liste complète, mais la copie exige aussi le même format de pixels et le même en-tête de codec | `video-tools/video-merger/page.jsx:37-39` (`v.pix_fmt`, `v.extradata_hash \|\| v.extradata_size`) | « …profile, pixel format, codec header and sound format… », ou « such as clips from one camera and one app » sans liste fermée |

### Bilan de la troisième passe

Pages relues : 7. Défauts restants : **4**, tous sur pdf-tools (3) et video-tools (1).

| Point | Nombre |
|---|---|
| 1 Exactitude | 2 |
| 3 Confidentialité | 1 |
| 6 Structure | 1 |
| 2, 4, 5, 7 | 0 |

**Pages sans aucun défaut** :
- ai-tools, audio-tools, file-tools, gif-tools et image-tools, en plus de :
- converter-tools, developer-tools, math-tools, qr-barcodes-tools et text-tools, sans défaut depuis la deuxième passe.

## Quatrième passe (06/10)

pdf-tools et video-tools relus en entier (texte rendu, cartes, métadonnées, preuves).

Les 4 défauts de la troisième passe sont corrigés :
- **pdf-tools About** : 113 mots.
- **pdf-tools FAQ 2** (70 mots) : la dernière phrase nomme les quatre outils, dit ce qui part (le PDF entier) et où (notre
  service pdf-tools) (`serverPageRender.js:58-59`, `serverPageOcr.js:63, 82`). Les nouvelles formules de la première liste
  sont justes : « the Office and HTML converters » et « Merge PDF's Office files » (`pdf-merge/page.jsx:17-18, 124, 270`,
  seuls les fichiers Office sont envoyés).
- **pdf-tools FAQ 1** (68 mots) : « Other files of 4 MB or less… are not counted » ne contredit plus les cas comptés nommés
  juste avant.
- **video-tools, conseil Merger** : la liste ajoute le format de pixels et l'en-tête de codec, ce qui correspond à la clé de
  copie (`video-merger/page.jsx:37-39`).

Contrôles :
- Métadonnées inchangées : pdf 56/144, vidéo 53/143.
- FAQ entre 38 et 70 mots ; aucune réponse ne commence par « Because ».
- Le script de preuves ne signale rien.
- Aucun doublon de phrase avec une autre page.

**0 défaut.** Les 12 pages de catégorie sont maintenant sans défaut.
