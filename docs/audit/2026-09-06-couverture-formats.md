# Audit couverture de formats — Phase 1 (scan, aucun code)

Date : 2026-09-06. Règle permanente posée par l'utilisateur : chaque outil doit couvrir le
MAXIMUM de formats (pas 1-2), et deux critères comptent à égalité — QUALITÉ du résultat et
COUVERTURE des formats. Ce document est l'état des lieux Phase 1 (diagnostic seul, aucune
modification de code). Phase 2 (combler les écarts, famille par famille, avec preuve sur
fichier réel) attend le feu vert explicite de l'utilisateur après lecture de ce tableau.

**Statut de ce document : 7 familles sur 8 terminées (audio, documents, GIF, texte, PDF,
image, données). La famille VIDÉO est en cours — ce document contient les constats déjà
établis par lecture directe du code, mais le benchmark concurrentiel et le tableau final
formel restent à compléter.** Ce fichier est écrit maintenant (avant la fin du scan vidéo)
pour ne rien perdre à l'approche d'un compactage de contexte.

## Incident méthodologique à noter

Le scan a été fait via des sous-agents "fork" en parallèle (un par famille). L'un d'eux
(vidéo, 1ère tentative) a mal tourné : il a fait naître 14 agents non autorisés puis s'est
mis en boucle de réapparition sous le même nom après avoir été arrêté. Une 2ème tentative de
fork pour vidéo a échoué différemment (l'agent a cru devoir "coordonner" les autres familles
au lieu de faire son propre travail). Sur consigne explicite de l'utilisateur ("une seule
retentative, puis fais-le toi-même"), le scan vidéo est donc fait directement, en lisant le
code moi-même dans la conversation. Un bug a été signalé côté outil (feedback local, non
envoyé). Le fork de la famille "données" a eu le même problème de "context bleed" à sa
1ère tentative (résultat vide/confus) — une 2ème tentative de fork a réussi normalement.

---

## FAMILLE AUDIO (terminé)

### Moteurs identifiés
- ffmpeg.wasm (`@ffmpeg/ffmpeg` 0.12.15, core non-GPL) : audio-booster, audio-compressor, audio-converter, audio-merger, audio-splitter, audio-trimmer
- Web Audio API / `OfflineAudioContext` + encodeur WAV maison : audio-equalizer, voice-recorder, audio-waveform
- `<audio>`/`MediaRecorder` seul, pas de moteur de conversion : audio-metadata
- API serveur `/api/ai-transcribe` (Whisper OpenAI) : audio-to-text (mode fichier), audio-transcriber (ai-tools)
- `webkitSpeechRecognition` navigateur : audio-to-text (mode micro)

### Concurrents de référence
- CloudConvert — https://cloudconvert.com/audio-converter — 21 formats dont MP3, FLAC, AAC, WAV, OGG, M4A, WMA, AIFF, AMR, AU, CAF, MP2, WV, OGA…
- FreeConvert — https://www.freeconvert.com/audio-converter — WAV, FLAC, WMA, M4A, ALAC, OGG, AAC, AMR, AIFF + extraction depuis MP4/MKV/AVI/WMV/MOV

Les deux gardent un backend serveur pour l'encodage — pas de preuve "100% navigateur + plus
de formats que nous" ici : l'écart vient bien de notre code, pas d'un désavantage d'architecture.

### Tableau des écarts

| outil | ce que j'accepte | ce que les concurrents acceptent | ce qui manque | cause probable | difficulté |
|---|---|---|---|---|---|
| audio-booster, audio-compressor, audio-merger, audio-splitter | `audio/*` en entrée, sortie **toujours forcée en MP3** sans choix | Sortie au choix ou conservée dans le format source | Aucune sortie autre que MP3 ; une source WAV/FLAC lossless est systématiquement dégradée | **limite arbitraire jamais remise en question** — `output.mp3` codé en dur alors que ffmpeg.wasm sait déjà encoder wav/aac/flac/ogg/m4a/opus (audio-converter le prouve) | facile |
| audio-trimmer | Trim en `-c copy` (pas de réencodage) mais nomme systématiquement le fichier `.mp3` | — | Un trim WAV/FLAC produit un fichier étiqueté `.mp3` dont le flux réel n'est pas du MP3 (le FAQ l'admet) | limite de mon code — extension codée en dur au lieu d'être dérivée du codec réel | facile |
| audio-converter | 7 formats de sortie (mp3, wav, aac, flac, ogg, m4a, opus) | CloudConvert : 21 formats dont WMA, AIFF, AMR, AU, CAF ; FreeConvert : + ALAC | WMA, AIFF, ALAC, AMR au minimum | WMA/AIFF/ALAC : limite arbitraire (encodeurs natifs ffmpeg déjà présents, jamais exposés dans l'UI). AMR : limite réelle probable (libopencore-amr non-libre, absente du build ffmpeg.wasm standard — à vérifier) | WMA/AIFF/ALAC : facile · AMR : difficile |
| audio-merger | Fusionne en `-c copy` en supposant même codec ; noms forcés `.mp3` | Réencodage auto pour fusionner des formats mixtes | Le FAQ prévient lui-même que mélanger des formats peut échouer | limite de mon code — pas de détection de codec ni de réencodage de repli | moyen |
| audio-transcriber / audio-to-text (fichier) | Plafond réel 10 Mo (`MAX_AUDIO_UPLOAD_BYTES`), FAQ affiche "~25 Mo" (plafond Whisper) | Whisper API accepte jusqu'à 25 Mo | Écart de 15 Mo entre texte affiché et limite réelle ; pas de chunking pour fichiers longs | limite arbitraire mais documentée/volontaire (coût) — le texte FAQ ment sur le chiffre | facile (corriger texte) / difficile (chunking) |

Note : `audio-to-text` (audio-tools) et `audio-transcriber` (ai-tools) sont deux implémentations quasi identiques du même pipeline Whisper — duplication à signaler, pas un écart de format.

---

## FAMILLE DOCUMENTS (terminé)

Scope : `app/tools/file-tools/*` + `app/tools/converter-tools/mobi-to-epub`.

### Moteurs
- file-converter : aucune lib, réécriture texte à la main (txt/csv/json/html)
- zip-creator / zip-extractor : JSZip
- tar-extractor : parsing TAR fait à la main, octet par octet, aucune lib
- file-encryptor : XOR maison (pas une vraie lib de chiffrement — problème de QUALITÉ)
- file-splitter / file-comparator / file-metadata : agnostiques au format
- mobi-to-epub : `@lingo-reader/mobi-parser` + JSZip

### Concurrents
- CloudConvert — cloudconvert.com/archive-converter, /rar-converter, /7z-converter
- Calibre `ebook-convert` — manual.calibre-ebook.com/generated/en/ebook-convert.html

### Tableau des écarts

| outil | ce que j'accepte | ce que les concurrents acceptent | ce qui manque | cause probable | difficulté |
|---|---|---|---|---|---|
| tar-extractor | `.tar` non compressé uniquement | CloudConvert : TAR, TAR.GZ, TAR.BZ2, TAR.7Z, TGZ | `.tar.gz`/`.tgz` (et bz2/xz) — FAQ dit explicitement de décompresser soi-même avant | **limite arbitraire jamais remise en question** — `DecompressionStream('gzip')` est une API native du navigateur, aucune lib à ajouter | facile |
| zip-extractor | `.zip` uniquement | CloudConvert convertit ZIP ↔ RAR ↔ 7Z | Lecture RAR / 7Z | limite réelle actuelle (JSZip ne décode ni RAR ni 7Z), contournable avec libarchive.js / 7z-wasm | difficile |
| mobi-to-epub | `.mobi/.azw/.azw3` entrée, EPUB sortie uniquement | Calibre accepte aussi PRC, LIT, FB2 en entrée, et EPUB→MOBI/AZW3 en retour | `.prc` (même binaire MOBI6) ; conversion retour EPUB→MOBI | `.prc` : limite de mon code (parser lirait un `.prc` identique, seule la regex l'exclut). Retour EPUB→MOBI : limite réelle (pas d'équivalent kindlegen client-side) | facile (.prc) / difficile (retour) |
| file-metadata | nom/taille/type MIME/date/extension — propriétés filesystem only | Metadata2Go/Jimpl lisent EXIF/IPTC/XMP images, ID3 audio, propriétés PDF/Office | Toute métadonnée embarquée dans le fichier | limite arbitraire — libs client-side existent (exifr, music-metadata-browser, pdf-lib) non branchées | moyen |
| zip-creator | sortie `.zip` seule, pas de choix de niveau de compression | Choix du niveau usuel chez les concurrents | Choix du niveau | limite arbitraire jamais remise en question | facile |

Hors tableau (qualité, pas couverture) : file-encryptor en XOR (pas AES) ; file-converter
("File Converter", nom générique) ne convertit en réalité que du texte brut — écart de
portée totale face à un vrai convertisseur universel, à trancher par l'utilisateur (outil
texte-only assumé, ou à étendre ?).

---

## FAMILLE GIF (terminé)

Scope : `app/tools/gif-tools/*` (11 outils : apng-to-gif, avi-to-gif, gif-compressor,
gif-maker, gif-to-apng, gif-to-mp4, image-to-gif, mov-to-gif, mp4-to-gif, video-to-gif,
webm-to-gif).

### Moteurs
- gifenc + `<canvas>` : gif-maker, image-to-gif, apng-to-gif, avi-to-gif, mov-to-gif, mp4-to-gif, webm-to-gif, video-to-gif
- Décodage via `<video>` natif (PAS ffmpeg) : avi-to-gif, mov-to-gif, mp4-to-gif, webm-to-gif, video-to-gif
- ffmpeg.wasm : **gif-to-mp4 uniquement** — seul outil du dossier à l'utiliser, alors qu'il est déjà chargé et fonctionnel dans ce même dossier
- omggif/gifuct + upng-js : gif-to-apng
- gifsicle (wasm) : gif-compressor

### Concurrents
- ezgif — ezgif.com/video-to-gif — accepte MP4/WebM/AVI/MPEG/MKV/FLV/OGG/OGV/MOV/M4V/WMV/ASF/3GP/SWF, jusqu'à 60s à 5fps (200MB max)
- CloudConvert — cloudconvert.com/gif-converter — entrée vidéo très large + sortie alternative WEBP/AVIF/MP4/WEBM/MOV/AVI

### Tableau des écarts

| outil | ce que j'accepte | ce que les concurrents acceptent | ce qui manque | cause probable | difficulté |
|---|---|---|---|---|---|
| (famille — pas d'outil dédié) | MP4/WebM/AVI/MOV via 4 outils séparés | ezgif/CloudConvert : + MKV, FLV, WMV, OGV/OGG, 3GP, MPEG, ASF, M4V | Aucun outil ne convertit MKV/FLV/WMV/OGV/3GP/MPEG en GIF, alors que ffmpeg.wasm (décode tous ces conteneurs) est déjà chargé dans `gif-to-mp4` du même dossier | **limite de mon code qui interroge le mauvais composant** | moyen |
| avi-to-gif | `accept="video/avi,video/x-msvideo"`, décodage réel via `<video>` natif → échoue sur la plupart des codecs AVI (documenté) | ezgif/CloudConvert décodent l'AVI côté serveur quel que soit le codec | Quasi-totalité des vrais fichiers AVI | **limite de mon code** — même anti-pattern déjà corrigé une fois sur video-watermark (commit a2c2176a) mais jamais reporté ici | difficile |
| mov-to-gif | `accept="video/quicktime,video/mov"`, décodage `<video>` natif → échoue sur ProRes (documenté) | ezgif/CloudConvert décodent ProRes côté serveur | Fichiers MOV ProRes (très courants exports Mac/iPhone) | limite de mon code | difficile |
| avi/mov/mp4/webm-to-gif | Cap dur : 10 frames max, 5 premières secondes, downscale forcé 480×270 | ezgif : jusqu'à 60s à résolution native | Durée complète, résolution native, plus de frames | limite arbitraire jamais remise en question (aucune contrainte gifenc/canvas ne l'impose) | moyen |
| video-to-gif | `<video>` natif, capé 10s, FPS 1-15 réglable, résolution native | ezgif : jusqu'à 60s | Durée >10s | limite arbitraire jamais remise en question | facile |
| (sortie, toute la famille) | Sortie GIF uniquement (sauf 2 outils dédiés à sens unique) | CloudConvert propose WEBP/AVIF/MP4/MOV/AVI en alternative depuis la même pipeline | Sortie WebP animé (qualité bien supérieure au GIF 256 couleurs) jamais proposée | limite arbitraire — la frame est déjà en ImageData, l'encodage WebP animé est faisable en JS/wasm | moyen |

gif-compressor, gif-to-apng, apng-to-gif, gif-maker, image-to-gif : pas d'écart significatif.

Preuve interne demandée par la règle : `gif-to-mp4` du même dossier utilise déjà ffmpeg.wasm
avec succès, alors que 4 autres outils du même dossier utilisent `<video>` natif pour le même
type de problème (lire un conteneur vidéo) — preuve directe que la limite vient du code.

---

## FAMILLE TEXTE (terminé)

Scope : `app/tools/text-tools/*` (17 outils). Constat principal : **aucun des 17 outils
n'accepte de fichier** (grep exhaustif `accept=`, `type="file"`, `FileReader` : zéro
résultat). Tous fonctionnent en texte collé → texte affiché.

### Tableau des écarts (2 gaps réels)

| outil | ce que j'accepte | ce que les concurrents acceptent | ce qui manque | cause probable | difficulté |
|---|---|---|---|---|---|
| text-comparator | texte collé uniquement | Diffchecker.com : compare DOC/DOCX/PDF/PPTX/TXT/CSV/Markdown déposés en upload, cross-format, OCR pour PDF scanné | upload de fichier, extraction multi-format, comparaison cross-format | limite arbitraire — pdf.js existe déjà ailleurs dans le repo (pdf-tools) | difficile |
| word-counter, character-counter | texte collé uniquement | wordcounter.net, wordcountcounter.com (100% client-side, mammoth.js + PDF.js — preuve que c'est faisable sans serveur) | upload .docx/.pdf/.txt avec extraction avant comptage | limite arbitraire — un concurrent le fait déjà côté navigateur | moyen |

Sources : wordcounter.net, wordcountcounter.com, diffchecker.com/word-pdf-compare.

Noté hors-format (qualité) : `word-counter` découpe via `text.split(/\s+/)` — ne marche pas
pour chinois/japonais/thaï (pas d'espaces). Les 15 autres outils texte n'ont aucune dimension
format pertinente (opérations pures sur chaîne).

---

## FAMILLE PDF (terminé)

Scope : `app/tools/pdf-tools/*` (39 outils) + backends (`/api/convert-to-pdf`,
`/api/convert-html-to-pdf`, `/api/pdf-repair`, `/api/pdf-to-pdfa`, `/api/pdf-to-word`,
`services/pdf-tools/*`, `services/gotenberg/*`).

État "Coming Soon" : seuls `pdf-to-excel` et `pdf-to-ppt` restent des stubs. `pdf-repair`
(qpdf→Ghostscript) et `pdf-to-pdfa` (Ghostscript+veraPDF, 1b/2b/3b) ont shippé et sont
solides — aucun écart trouvé sur ces deux-là.

### Moteurs
Gotenberg/LibreOffice (Office→PDF), Gotenberg/Chromium (HTML→PDF), ConvertAPI (docx→pdf,
feature-flaggé), Ghostscript+qpdf+veraPDF (repair, PDF/A), pdf-lib (édition/merge/split
client), pdf.js (rendu/OCR/extraction), tesseract.js (OCR), AI Gateway/OpenAI (traduction,
résumé).

### Concurrents
iLovePDF (ilovepdf.com), PDF24 (tools.pdf24.org).

### Tableau des écarts

| outil | ce que j'accepte | ce que les concurrents acceptent | ce qui manque | cause probable | difficulté |
|---|---|---|---|---|---|
| html-to-pdf | Upload HTML statique converti via `window.print()` (impression navigateur) | iLovePDF/PDF24 : rendu Chromium complet (JS exécuté, CSS/images distantes), URL en entrée | Le vrai moteur Chromium (Gotenberg `/forms/chromium/convert/html`) existe déjà dans ce repo (sert epub-to-pdf/mobi-to-pdf) mais html-to-pdf ne l'appelle pas | **limite de mon code qui interroge le mauvais composant** — cas exact décrit par la règle | facile — brancher sur `/api/convert-html-to-pdf` |
| word-to-pdf | `.docx` uniquement, FAQ dit ".doc non supporté" | iLovePDF accepte DOC et DOCX | Le backend accepte déjà `doc` et le route vers Gotenberg/LibreOffice — seul le frontend bloque et ment | limite de mon code | facile |
| ppt-to-pdf | `.pptx` uniquement | Concurrents acceptent PPT et PPTX | Backend route déjà `ppt` vers Gotenberg — frontend bloque seul | limite de mon code | facile |
| pdf-ocr | 2 langues (English, French) codées en dur | iLovePDF : ~90+ langues | tesseract.js (moteur réel) télécharge dynamiquement n'importe quel `.traineddata` — seule la liste UI est restreinte | **limite arbitraire jamais remise en question** | facile |
| pdf-to-image/pdf-to-jpg | Sortie PNG uniquement, échelle fixe 2x, pas de ZIP, un PDF à la fois | PDF24 : choix PNG/JPG, DPI/qualité, lot + ZIP | `canvas.toDataURL('image/jpeg', q)` déjà dispo (même API que PNG) | limite arbitraire (JPG/DPI) ; lot+ZIP = vrai ajout de fonctionnalité | facile (JPG) / moyen (lot+ZIP) |
| pdf-translate | 10 langues, 5 pages, 3000 caractères max, sortie texte brut | Offres IA concurrentes traduisent documents complets avec mise en page | Pas de limite technique du LLM à 10 langues/5 pages/3000 caractères — plafonds client pour le coût | limite arbitraire (probablement voulue pour le coût, jamais documentée comme choix produit assumé) | moyen — lever le plafond a un impact coût direct |
| excel-to-pdf | `.xlsx,.xls,.csv` | Concurrents ajoutent souvent `.ods` | Gotenberg/LibreOffice sait ouvrir `.ods` nativement, ni frontend ni `ALLOWED_EXTENSIONS` ne l'incluent | limite de mon code | facile |
| image-to-pdf | `.jpg,.jpeg,.png` uniquement | iLovePDF/PDF24 acceptent aussi BMP, GIF, WEBP, TIFF | BMP/GIF/WEBP décodables nativement par canvas/img sans lib. TIFF nécessite un vrai décodeur | BMP/GIF/WEBP : limite arbitraire. TIFF : limite réelle (pas de décodeur natif navigateur) | facile (BMP/GIF/WEBP) / difficile (TIFF) |
| pdf-merge | PDF uniquement | iLovePDF mélange PDF + images + Office (conversion auto puis fusion) | Fonctionnalité absente, nécessiterait de chaîner Gotenberg avant pdf-lib | limite arbitraire / feature manquante | moyen |

### Non-écarts vérifiés
pdf-to-pdfa, pdf-repair, epub-to-pdf/mobi-to-pdf (vrai pipeline Gotenberg/Chromium),
pdf-merge/split/compress (plafonds documentés et mesurés), tous les outils page-par-page
PDF→PDF (rotate/crop/watermark…) acceptent correctement `.pdf` uniquement.

### Tests manuels à faire après correction de cette famille
1. Uploader un vrai `.doc` binaire sur Word to PDF une fois l'accept élargi.
2. Uploader un `.ppt` binaire sur PPT to PDF.
3. OCR un PDF scanné dans une langue nouvellement ajoutée (allemand/arabe), vérifier visuellement.
4. HTML to PDF : HTML avec CSS externe + image distante + JS, vérifier que le rendu Chromium les inclut.
5. PDF to Image : vérifier le nouveau JPG et que le ZIP contient toutes les pages dans l'ordre.
6. Excel to PDF avec un vrai `.ods` LibreOffice.

---

## FAMILLE IMAGE (terminé)

Scope : `app/tools/image-tools/*` (~37 outils) + ai-tools (background-remover,
image-captioner, image-generator, image-upscaler) + qr-scanner/qr-generator/barcode-generator.

### Moteurs
La quasi-totalité des outils mono-format décodent via `new Image()` + `<canvas>` 2D (gère
nativement JPG/PNG/WebP/GIF 1ère frame/BMP/ICO/SVG/AVIF sur navigateurs récents). heic-to-jpg/
heic-to-png utilisent un vrai décodeur HEIC dédié ; tiff-to-jpg/tiff-to-png un vrai décodeur
TIFF (UTIF) dédié — pas de faux-décodeur ici. `image-converter` tourne en Web Worker via
`createImageBitmap` + `OffscreenCanvas.convertToBlob` (sortie limitée par l'API navigateur à
PNG/JPEG/WebP/AVIF). background-remover/image-captioner ne décodent rien côté client
(octets bruts vers remove.bg / API vision).

### Concurrents
CloudConvert (cloudconvert.com/image-converter, 48 formats dont HEIC/TIFF/BMP/AVIF/ICO/ICNS/
EPS + RAW + PSD/XCF) ; Squoosh (squoosh.app, Google, 100% client/WASM — encode MozJPEG/WebP/
AVIF/JPEG XL/OxiPNG/QOI). **Squoosh prouve le cas visé par la règle : tout se fait dans le
navigateur et supporte quand même plus de formats de sortie (JPEG XL, QOI) que notre
image-converter — ce n'est pas une limite technique, c'est une limite de notre code.**

### Tableau des écarts

| outil | ce que j'accepte | ce que les concurrents acceptent | ce qui manque | cause probable | difficulté |
|---|---|---|---|---|---|
| image-converter (sortie) | WebP/PNG/JPG/AVIF seulement | CloudConvert : 48 formats dont TIFF/BMP/GIF/ICO/HEIC ; Squoosh : + JPEG XL, QOI | Sortie TIFF/BMP/GIF/ICO (encodables côté client sans lib) + JPEG XL (encodeur wasm) | limite arbitraire jamais remise en question | moyen |
| image-converter — bug de contenu | FAQ affirme accepter le TIFF en entrée, mais `createImageBitmap` ne décode PAS le TIFF (échec réel) | — | Décodeur UTIF déjà présent dans le repo (tiff-to-jpg/png) mais pas branché ici | **limite de mon code qui interroge le mauvais composant** + texte mensonger à corriger immédiatement | facile (texte) / moyen (brancher UTIF) |
| image-converter (entrée) | pas de HEIC/HEIF | CloudConvert : HEIC/HEIF entrée et sortie | HEIC en entrée | heic2any déjà utilisé par heic-to-jpg/png, pas branché ici — limite de mon code | facile-moyen |
| png-to-ico | produit un PNG renommé `.ico` (pas un vrai conteneur, documenté honnêtement) | CloudConvert/favicon.io/RealFaviconGenerator : vrai conteneur ICO multi-résolution | Writer ICONDIR/ICONDIRENTRY autour du PNG déjà produit (format ICO moderne accepte du PNG brut) | limite arbitraire jamais remise en question | facile |
| qr-generator, barcode-generator | Sortie PNG uniquement (`canvas.toDataURL()`) | qr-code-generator.com : PNG, SVG, JPG, EPS | Export SVG (essentiel pour impression/agrandissement) | limite arbitraire — un QR/barcode est trivialement dessinable en SVG | facile |
| convertisseurs mono-paire (jpg-to-png, png-to-jpg, webp-to-jpg, etc.) | `accept` restreint à l'extension nommée | CloudConvert/Squoosh acceptent n'importe quelle source vers n'importe quelle cible | Chaque page plus étroite que le générique — choix produit/SEO valable mais à noter | limite arbitraire, impact mineur (image-converter généraliste existe en parallèle) | facile |

Hors écart : heic-to-jpg/png, tiff-to-jpg/png (décodeurs dédiés corrects), svg-to-png,
filtres/éditions (blur, vignette, rotate, crop, etc. — pas de notion de format au-delà de
l'input générique).

**Non approfondi (à creuser en Phase 2 si famille prioritaire)** : image-generator (formats
de sortie non vérifiés), image-upscaler, image-captioner (formats acceptés par le modèle
vision), duplicate-image-finder / image-comparison / image-metadata (accept générique, pas
de gap visible mais non vérifié en profondeur).

---

## FAMILLE DONNÉES (terminé)

Scope : sous-ensemble format de données de `app/tools/developer-tools/*` (csv-to-excel,
csv-to-json, csv-to-sql, csv-to-tsv, excel-to-csv, excel-to-json, json-to-csv, json-to-xml,
json-to-yaml, json-to-toml, toml-to-json, tsv-to-csv, xml-to-json, yaml-to-json, env-to-json,
sql-to-csv, xml-formatter, json-formatter, json-minifier). Hors périmètre (aucune dimension
format) : générateurs de code (json-to-csharp/go/php/python/rust/typescript), formatters
JS/CSS/HTML, sql-formatter, url-encoder/parser, hash/jwt/uuid/password generators,
cron-expression, number-base-converter, timestamp-converter, aspect-ratio, color-picker.

### Moteurs
- csv-to-excel/excel-to-csv/excel-to-json : lib `xlsx` (SheetJS). CSV lu/écrit via
  `app/lib/csvParser.js`, parseur RFC 4180 maison **partagé par tous les outils CSV**, mais
  délimiteur `,` codé en dur.
- json-to-xml, json-to-yaml, json-to-toml, toml-to-json, xml-to-json, yaml-to-json,
  env-to-json, xml-formatter : **aucune librairie** — parsing/stringification maison, sur
  7 outils d'affilée.

### Concurrents
CloudConvert (cloudconvert.com/xls-converter, /csv-converter — NUMBERS, ODS, XLSM, ET, PAGES
en entrée) ; CodeBeautify.org (json-to-yaml, xmltojson — sortie YAML liste correcte,
confirmée par comparaison directe).

### Tableau des écarts

| outil | ce que j'accepte | ce que les concurrents acceptent | ce qui manque | cause probable | difficulté |
|---|---|---|---|---|---|
| json-to-yaml | Stringifier YAML maison | CodeBeautify produit des listes YAML valides (`- item`) avec quoting correct | Tableaux JSON convertis en clés numérotées au lieu de listes YAML ; valeurs avec `: ` non quotées → **YAML invalide** (bug de qualité, documenté dans le FAQ mais pas corrigé) | **limite de mon code qui interroge le mauvais composant** — `js-yaml` (`dump()`) est minuscule et 100% client, jamais utilisée | facile — remplacer par `js-yaml` |
| xml-to-json | Parsing maison qui ignore les attributs XML | fast-xml-parser/xml2js préservent les attributs (`@_attr`) | Toute donnée portée par un attribut est perdue silencieusement | limite de mon code — `fast-xml-parser` léger et client-side | facile-moyen |
| json-to-xml, json-to-toml, toml-to-json, yaml-to-json, xml-formatter | Parsing/génération maison, cas limites non garantis (namespaces XML, YAML multi-doc, TOML tables imbriquées) | Libs standards gèrent ces cas | Robustesse non testée cas par cas — le pattern "aucune lib sur 7 outils" est le signal le plus fort de risque | limite de mon code (aucune lib branchée alors que le bundle le permettrait) | moyen |
| csv-to-json, csv-to-sql, csv-to-excel | `.csv` uniquement, délimiteur virgule codé en dur dans le parseur partagé | Tout parseur CSV sérieux détecte le délimiteur | Import direct d'un `.tsv` ou CSV point-virgule (courant en Europe) — un seul fichier partagé à corriger règle toute la famille | **limite arbitraire jamais remise en question** | facile |
| excel-to-csv, excel-to-json | `.xlsx,.xls` (+`.csv`) | CloudConvert accepte aussi ODS, XLSM, NUMBERS, ET | `.ods` — SheetJS (déjà utilisé) sait déjà lire l'ODS, seul `accept` restreint | limite de mon code qui interroge le mauvais composant | facile |
| excel-to-csv, excel-to-json | Seule la 1ère feuille du classeur convertie (assumé au FAQ), pas de sélecteur | Concurrents proposent un choix ou traitent toutes les feuilles | Données silencieusement perdues sur classeur multi-feuilles | limite arbitraire — `workbook.SheetNames` trivial à exposer | moyen |
| csv-to-excel | Sortie `.xlsx` uniquement | CloudConvert produit XLS et XLSX au choix | Pas de sortie `.xls` legacy | limite arbitraire — `bookType: 'xls'` déjà supporté par SheetJS | facile |

**Constat transversal le plus important** : sur 7 outils de conversion structurée
(JSON/XML/YAML/TOML/ENV), aucun n'utilise de librairie de parsing établie — tout est écrit à
la main. C'est un problème de QUALITÉ ET de couverture simultanément (json-to-yaml produit du
YAML invalide sur les tableaux, xml-to-json perd les attributs).

---

## FAMILLE VIDÉO (EN COURS — constats déjà établis par lecture directe du code)

Scope : `app/tools/video-tools/*` (15 outils : media-player, screen-recorder,
subtitle-generator, video-compressor, video-converter, video-filter, video-merger,
video-metadata, video-resizer, video-rotator, video-screenshot, video-to-audio, video-to-gif,
video-trimmer, video-watermark).

### Constat central (déjà confirmé par lecture de code, le plus gros écart pressenti par
l'utilisateur)

**Un seul outil sur 15 utilise un vrai moteur de conversion (ffmpeg.wasm) : `video-watermark`**
(535 lignes, déjà corrigé récemment — commits a2c2176a, 767ac0ac, d6eed607 — allowlist de
codecs prouvée sur fichiers réels, cap 120s).

**Les 8 autres outils de transformation vidéo (video-converter, video-compressor,
video-trimmer, video-merger, video-resizer, video-rotator, video-filter, screen-recorder)
utilisent tous le même pattern faible : décodage via l'élément `<video>` natif du navigateur
+ `captureStream()` + `MediaRecorder` pour ré-enregistrer la vidéo EN TEMPS RÉEL.**

Conséquences directes de ce pattern, confirmées par lecture de code (video-converter,
video-compressor lus intégralement ; video-filter/merger/resizer/rotator/trimmer/
screen-recorder confirmés par grep sur `MediaRecorder`/`captureStream`) :
- **Sortie toujours WebM, jamais d'autre format** — même sur `video-converter`, dont le nom
  promet une conversion générale mais qui ne propose AUCUN sélecteur de format de sortie
  (son propre FAQ l'admet : "WebM only — despite the tool's name, there's no format
  selector for MP4, AVI, MOV, or other targets").
- **Format d'entrée limité à ce que l'élément `<video>` du navigateur sait décoder** — pas de
  passage par ffmpeg alors que ffmpeg.wasm est déjà chargé et fonctionnel dans ce même
  dossier (video-watermark). Tout conteneur/codec qu'un navigateur ne lit pas nativement
  (AVI avec codecs anciens, WMV, FLV, MKV avec pistes non supportées, ProRes dans un .mov)
  échoue silencieusement ou avec une erreur peu claire.
- **Traitement en temps réel** (durée du traitement = durée de la vidéo) au lieu d'un
  traitement par frame quasi instantané comme ffmpeg — problème de QUALITÉ/performance en
  plus du problème de couverture.
- `video-compressor` : calcul de bitrate cible proportionnel à la source (déjà une bonne
  logique), mais reste capé par le même moteur MediaRecorder single-pass sans look-ahead.

Autres outils vus :
- `video-to-audio` : n'utilise ni ffmpeg ni MediaRecorder mais `AudioContext.decodeAudioData`
  directement sur les octets vidéo → sortie **toujours WAV mono** (downmix forcé, un seul
  canal extrait), pas de MP3/AAC/OGG, alors que ffmpeg (déjà dans le repo) ferait ça
  correctement en stéréo et dans n'importe quel format.
- `video-to-gif` (dans video-tools, distinct des outils du dossier gif-tools) : extraction de
  frames via `<canvas>` + décodage `<video>` natif — même limite d'entrée que les gif-tools
  déjà documentée dans la famille GIF ci-dessus (AVI/MOV ProRes échouent).
- `subtitle-generator` : en réalité un **générateur SRT manuel** (l'utilisateur tape les
  timestamps et le texte à la main) — pas de transcription automatique, pas de lecture de
  fichier vidéo du tout. Sortie `.srt` uniquement (pas de VTT/ASS). Écart mineur, pas un
  problème de décodage vidéo.
- `media-player`, `video-metadata`, `video-screenshot` : accept="video/*" (ou "audio/*,video/*"
  pour media-player), lecture/affichage via `<video>` natif — pas encore vérifié en détail
  si video-metadata expose moins d'info que ffprobe (codec, bitrate réel) faute de temps
  avant ce commit d'urgence ; à re-vérifier à la reprise du scan.

### Concurrents de référence (recherche partielle déjà faite)
- **CloudConvert** — https://cloudconvert.com/video-converter — formats confirmés : 3G2,
  3GP, 3GPP, AVI, CAVS, DV, DVR, FLV, M2TS, M4V, MKV, MOD, MOV, MP4, MPEG, MPG, MTS, MXF, OGG,
  OGV, RM, RMVB, SWF, TS, VOB, WEBM, WMV, WTV — traite "ANY to ANY" (entrée et sortie).
- **FreeConvert** — https://www.freeconvert.com/video-converter — annonce "plus de 60
  formats" en entrée (M2TS, MTS, MPEG, SWF, MOD, M4V, QT, RM, MPG, 3GPP, DIVX, VOB, DVR-MS,
  RMVB, ASF, 3G2, TS, MPV, WTV, XVID, MXF, M1V, F4P, F4V, MOV, FLV, WMV, MKV, WEBM, 3GP, AVI,
  MP4, OGV) ; sortie explicitement citée : MP4, MOV, MKV, WebM, AVI (liste probablement non
  exhaustive selon la page).
- Les deux sont des services serveur (pas de preuve "100% navigateur + plus de formats" ici,
  contrairement à Squoosh en image) — mais ça ne change rien à la conclusion : ffmpeg.wasm
  (déjà dans le bundle du site, prouvé fonctionnel sur video-watermark) peut réellement
  couvrir la quasi-totalité de cette liste côté navigateur, donc l'écart est bien un écart de
  CODE, pas un écart d'architecture ou de technologie disponible.

### Reste à faire pour clore la famille vidéo (reprise après ce commit)
1. Construire le tableau des écarts formel (mêmes colonnes que les autres familles) à partir
   des constats ci-dessus — l'essentiel de la matière est déjà là.
2. Vérifier video-metadata en détail (quelles infos il expose vs ffprobe).
3. Vérifier media-player et video-screenshot pour tout gap d'entrée résiduel.
4. Un 2e concurrent à froid pour confirmer FreeConvert (liste de sortie semblait incomplète
   sur la page fetchée).

---

## Prochaine étape

Une fois la famille vidéo complétée et son tableau formel ajouté ci-dessus, ce document sera
présenté comme le tableau des écarts complet de la Phase 1, trié par ampleur, avant tout
passage en Phase 2 (correction), conformément à la consigne de l'utilisateur.
