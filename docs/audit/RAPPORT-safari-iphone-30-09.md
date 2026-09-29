# RAPPORT — Défauts iPhone du 29/09, audit des 4 causes iOS, appels IA réels, écarts fermés (30/09)

Branche **locale** `safari-iphone-30-09`, partie de `master` = `9139aacb` (repère `restauration-avant-safari-iphone-30-09`).
**Aucune poussée, aucune préversion, aucune mise en production, aucune poussée forcée.** 28 commits, 159 fichiers.
Le service média de production et www n'ont servi à aucun outil média : service ffmpeg **local** (`lib/local-media-service.mjs`,
billets signés d'une clé jetable). www n'a reçu que les appels IA payants de la partie 3.

## En bref

| Partie | Résultat |
|---|---|
| 1 — défauts iPhone A à I | **9/9 corrigés en local**, chacun reproduit puis prouvé sur Chromium, Firefox et WebKit (tableau ci-dessous) |
| 1 — audit des 4 causes iOS | **0 URL data: de téléchargement**, **0 sortie WebM par défaut**, **0 canvas > 16,7 Mpx** dans les outils image/PDF/QR/GIF/upscaler/détourage, **PDF enregistré au lieu d'ouvert** sur tout le site |
| 2 — feuilles | `tests-safari-proprietaire.md` (colonne iPhone, §10 défauts A-I, test 34 corrigé) et `plan-de-travail.md` (bloquant 9, P1, P8 approuvé, **P15**) à jour |
| 3 — appels IA réels sur www | **≈ 0,04 $** dépensés (plafond 2 $) ; **AI Detector faux → refait** ; export SRT/VTT ajouté ; le reste correct |
| 4 — écarts du 29/09 | **fermés tous les trois** : signets dans PDF Organize, placement libre dans PDF Sign, Text to PDF au-delà du latin |
| Tests finaux | build de production local sans erreur ; **238 pages propres × 3 moteurs** ; toutes les suites des outils modifiés **vertes** sur les moteurs qui ont les API nécessaires ; service média 106/106 |

## Commits (dans l'ordre)

| Commit | Objet |
|---|---|
| `cd0c2ad9` | A — Image Converter : 50 Mpx téléphone / 100 ordinateur, bandes + encodeurs WebAssembly, WebP libwebp, AVIF depuis le raster, HEIC natif |
| `413ecb5b` | F — pont de téléchargement iOS (service worker, `Content-Disposition: attachment`) pour tout le site |
| `eba28da3` | E + canvas — 20 outils image : bandes au-delà de 16,7 Mpx, Blob nommé d'après l'original |
| `06a4f263` | C — Background Remover : recomposition par bandes de 4 Mpx dans un seul PNG |
| `75a2dd59` | B — QR Scanner : bouton « Paste image » + zone de collage éditable |
| `02c3e5d7` | G — Barcode Generator : SVG plein écran à l'ouverture, taille en mm à l'impression |
| `f084b383` | H — unités décimales sur tout le site (33 fichiers) |
| `c2df3e0d` | D — Video Rotator/Resizer/Filter/Merger, Screen Recorder : MP4, `playsinline`, plus de temps réel |
| `72bcd5a4` | Image Resizer par bandes ; service média : paramètres additifs + revue de sécurité |
| `ebe861ff` | Image Compressor par bandes |
| `193c47e3` | HEIC to JPG/PNG : décodage natif de Safari |
| `e50a4404` | TIFF to JPG/PNG : encodage sans canvas au-delà de 16,7 Mpx, transparence sur blanc |
| `d79011db` | Image Cropper par bandes |
| `4b4ea8b0` | Image Editor, SVG/GIF/ICO to PNG, Image Comparison : plus de canvas pleine taille |
| `2a7cb1f4` | PDF to JPG/Image (ZIP de toutes les pages), Audio Waveform, Video Screenshot : Blob au lieu de data: |
| `056fa10c` | Voice Recorder : .m4a là où le navigateur le peut |
| `1f19ff6e` | I — Image Upscaler : phrase claire ; résultat > 16,7 Mpx écrit en flux PNG |
| `3b519f1e` | Image to PDF / JPG to PDF : photos redressées par bandes, JPEG intégré |
| `14eae511` | QR Scanner : photo décodée à 12 Mpx au plus |
| `ba6128f2` | PDF Editor, Video Watermark : image insérée par bandes, logo ≤ 2048 px |
| `b0df6e1a` | I — tests `playsinline` et première image du résultat de Video Trimmer |
| `7bf28782` | Image to GIF : 1920 px de côté au plus (comme ezgif) |
| `4909a88b` | docs — bloquant 9, P1, P8, P15, feuille Safari |
| `10d3fe9f` | Audio Transcriber / Audio to Text : export SRT et VTT |
| `fdf4842c` | Text to PDF : toutes les écritures courantes (Noto, fontkit) |
| `058ef5af` | AI Detector : méthode RAIDAR, seuils mesurés |
| `d713c20d` | PDF Organize : les signets suivent leur page |
| `ab0d0f75` | PDF Sign : placement libre (glisser, redimensionner) |
| *(ce commit)* | ce rapport, bilan des tests finaux |

## Partie 1 — défauts iPhone A à I

« Preuve » = test automatique rejoué sur les 3 moteurs de Playwright, avec les iOS simulés par
`__forceSafariCanvasCap` (plafond de canvas de 16 777 216 px imposé) et `__forceAttachmentDownload` (chemin de
téléchargement iOS forcé). **Ce que seul un vrai Safari confirmera** est dit ligne par ligne.

| # | Défaut vu sur iPhone | Cause | Correctif | Preuve | Seul Safari réel confirmera |
|---|---|---|---|---|---|
| A | Image Converter : photo d'iPhone refusée (« plafond 12 Mpx »), WebP désactivé, AVIF et HEIC→JPG en échec, avertissement WebP hors de propos | plafond fixé à 12 Mpx ; une image entière sur un seul canvas, alors qu'iOS refuse tout canvas de plus de 16 777 216 px ; `toBlob('image/webp')` de Safari rend du PNG ; HEIC décodé par heic2any sur un canvas unique | 50 Mpx sur téléphone, 100 sur ordinateur ; au-delà du plafond iOS : décodage **par bandes** (`createImageBitmap` recadré, sondé), encodage **sans canvas** — MozJPEG, **libwebp** (le moyen de Squoosh), AVIF, PNG en flux ; HEIC décodé par Safari lui-même ; avertissement WebP seulement quand WebP est choisi et non natif | `big-image.mjs` (12/24/48 Mpx, tous formats, bandes forcées), `big-image-webkit-bands.mjs`, `heic-tools.mjs` | la mémoire réelle d'un iPhone avec 24 et 48 Mpx ; le décodage HEIC natif (WebKit de Playwright n'a pas HEIC) |
| B | QR Scanner : pas de « Coller » à l'appui long | iOS ne propose « Coller » que dans une zone éditable | bouton **Paste image** (`navigator.clipboard.read`) + zone de collage `contentEditable` | `qr-paste-button.mjs` (vrai presse-papiers Chromium) | la feuille d'autorisation de collage d'iOS |
| C | Background Remover : onglet Safari tué au « Download PNG » (12 Mpx) | canvas pleine taille + URL data: du PNG + copie en double | recomposition par bandes de 4 Mpx écrites dans **un seul** PNG (`createPngWriter`), pleine résolution, aperçu réduit | `bg-remover-bands.mjs` (12/24/48 Mpx, pixels comparés) | la mémoire réelle de l'iPhone |
| D | Video Rotator / Merger / Resizer / Filter / Screen Recorder : WebM illisible par Photos, source en plein écran, traitement en temps réel, fichiers plus lourds | réenregistrement de la lecture par `MediaRecorder` (WebM, durée réelle, débit élevé) ; `<video>` sans `playsinline` | Rotator : **matrice de rotation MP4/MOV réécrite** (instantané, sans perte) ; Merger : jonction **sans réencodage** (ffmpeg.wasm) si les clips se ressemblent, sinon clips alignés sur le service ; Resizer et Filter : **service ffmpeg** (filtre identique au CSS) ; Screen Recorder : MP4 là où le navigateur l'enregistre, sinon « Make an MP4 » ; `playsinline` partout | `video-tools-mp4.mjs` (service local réel, sorties relues par ffprobe : H.264/AAC, son présent), `screen-recorder-mp4.mjs`, `run_edit_tests.py` (service) | la lecture dans Photos ; **exige le déploiement du service d'abord** (P15 ①) |
| E | Brightness & Contrast, Image Blur : « Download » n'enregistre rien | lien `<a download>` vers une **URL data:**, ignoré par iOS | **toutes** les URL data: de téléchargement du site remplacées par des Blob nommés d'après l'original (`photo-brightness.jpg`) | `data-url-downloads.mjs`, `image-tools-big.mjs` | la feuille d'enregistrement d'iOS |
| F | PDF : « Download » ouvre le PDF au lieu de l'enregistrer | Safari iOS affiche un PDF `blob:` dans sa visionneuse | sur iOS, chaque lien de téléchargement du site (blob: ou data:) passe par le service worker `/zipdl/` qui répond avec `Content-Disposition: attachment` — le moyen d'iLovePDF et de Smallpdf | `ios-download.mjs` (en-tête lu, nom de fichier, octets identiques, 3 moteurs) | **le test 39** sur iPhone |
| G | Barcode Generator : SVG minuscule à l'ouverture | SVG dimensionné en mm, ouvert seul à sa taille physique | style réservé à l'écran (`@media screen` : remplit la fenêtre) ; taille exacte en mm gardée à l'impression | `barcode-svg-open.mjs` (écran et impression mesurés) | l'aperçu de Fichiers d'iOS |
| H | 4,91 MB affiché pour 5 151 217 octets (5,2 MB dans Fichiers) | unités binaires (1024 × 1024) | unités **décimales** partout (1 MB = 1 000 000 octets), comme Apple (support 102119) et Squoosh — `app/lib/formatBytes.js`, 33 fichiers | tests unitaires + suites | — |
| I | Upscaler « made on your device » obscur ; aperçu du résultat de Video Trimmer blanc | phrase ; `<video>` du résultat sans première image chargée sur iOS | phrase claire (« Running on your device: your image is not uploaded. ») ; sur iOS, chaque `<video>` du site reçoit `playsinline` et recharge sa première image (`IosVideoFirstFrame`, étendu dans `c2df3e0d`) ; aperçus en `preload="metadata"` | `ios-video-first-frame.mjs`, `upscaler-ios-stream.mjs` | l'aperçu sur iPhone |

## Partie 1 — audit systématique des 4 causes iOS (tout le site)

**1. URL data: de téléchargement — 0 restante.** Remplacées par un Blob nommé d'après l'original : les 20 outils image
(`eba28da3`), Image Resizer, Compressor, Cropper, Editor, HEIC/TIFF/SVG/GIF/ICO to PNG/JPG, Image Comparison, Background
Remover, Upscaler, PDF to JPG/Image, Audio Waveform, Video Screenshot, Image to PDF, JPG to PDF. Les `toDataURL` /
`readAsDataURL` restants (10 fichiers) ne servent pas à télécharger : HTML d'ebook, image envoyée à l'IA, outils Base64
(le résultat est le texte), aperçus, logo du QR. Et même un lien data: oublié serait servi en pièce jointe sur iOS par le pont.

**2. Sortie WebM — 0 par défaut.** Video Rotator/Resizer/Filter/Merger : MP4. Screen Recorder et Voice Recorder : MP4 / M4A
là où le navigateur l'enregistre (Safari, Chrome/Edge 126+) ; WebM seulement sous Firefox, avec conversion MP4 proposée
par le service. Video Converter/Compressor : le format choisi par le visiteur.

**3. Canvas au-delà de 16,7 Mpx — traités** : Image Converter, les 20 outils image, Resizer, Compressor, Cropper,
Editor (aperçu réduit, export peint par bandes), HEIC/TIFF/SVG/GIF/ICO, Comparison, Background Remover, Upscaler (flux PNG),
Image to PDF / JPG to PDF / PDF Editor (image redressée par bandes), QR Scanner (12 Mpx), Image to GIF (1920 px),
Video Watermark (logo 2048 px), PDF Sign (aperçu 3 Mpx).

**4. PDF (et tout fichier) ouvert au lieu d'enregistré** : pont iOS pour **tout** le site (`IosDownloadBridge` dans
`app/layout.tsx`, `public/zipdl/sw.js`).

## Partie 2 — feuilles du propriétaire

- `claude/tests-safari-proprietaire.md` : colonne de verdict iPhone du 29/09 (RÉUSSI 1-8, 11, 13, 15, 31, 34, 39 ;
  ÉCHOUÉ 9, 10, 25, 30, 36), textes des tests 9/10/11/25/30 à jour, §10 (défauts A-I et leur état). **Test 34 :** la
  valeur de la page était juste (4,91 MB = 5 151 217 octets en binaire) ; c'est la valeur attendue de la feuille qui était
  fausse — corrigée (la page affiche désormais 5,2 MB, comme Fichiers).
- `claude/plan-de-travail.md` : bloquant 9 (tableau A-I, audit), P1 (à refaire sur iPhone après P15 : **9, 10, 25, 30,
  36, 39** ; Mac 9-30 et séance E en cours par safaridriver), **P8 approuvé le 29/09** (Gotenberg 3 répliques, à lancer
  plusieurs jours avant la date de lancement, non fixée, coût notifié avant), **P15 = déployer cette branche**, résultats
  des parties 3 et 4.

## Partie 3 — appels IA réels sur www

Faits depuis Playwright sur **www** (jamais depuis le serveur local : la clé de service Supabase n'est jamais dans
l'environnement de l'agent). Coût estimé par appel à partir des longueurs envoyées et reçues, aux prix de gpt-4o-mini,
Whisper et de l'image ; **l'image est comptée à sa réservation de 0,03 $**, son coût exact est dans les journaux Vercel
(ligne `[openai-image] cost_micros`).

| Outil | Contrôle | Résultat | Coût |
|---|---|---|---|
| PDF AI Summary | résumé dans la langue du document | **OK** (PDF français → français, espagnol → espagnol) | < 0,001 $ |
| AI Chatbot | contexte gardé sur 3 messages | **OK** | < 0,001 $ |
| AI Detector | un texte humain, un texte d'IA | **FAUX** : « 70 % humain » pour un texte écrit par une IA, en anglais et en français → **refait** (ci-dessous) | < 0,001 $ |
| Audio Transcriber | parole connue | **42/42 mots** ; **export SRT et VTT ajouté** (les sites de transcription l'offrent ; segments horodatés de Whisper transmis par la route, sans coût en plus) | ≈ 0,002 $ |
| Image Generator | une image | **OK** | 0,03 $ (réservation) |
| AI Detector — étalonnage | 20 textes (11 humains : classiques, Wikipédia, français du propriétaire ; 9 d'IA : gpt-4o-mini et Claude, anglais et français) | seuils mesurés, voir ci-dessous | ≈ 0,005 $ |
| **Total** | | | **≈ 0,04 $** (plafond 2 $) |

**AI Detector, nouvelle méthode — RAIDAR (Mao et al., ICLR 2024)** : le modèle est prié de « polir » le texte ; la page
mesure la part modifiée (1 − distance de Levenshtein / longueur). Un modèle touche peu un texte écrit par un modèle et
réécrit davantage un texte humain. Mesuré sur www : similarité des textes humains 0,545-0,884, des textes d'IA 0,760-0,961.
Seuils : **≥ 0,90 → IA** (4 textes d'IA sur 9, **0 humain sur 11**) ; **< 0,80 → humain** (9 humains sur 11, 1 IA sur 9) ;
entre les deux, **pas de verdict**. 40 mots minimum. La page affiche cette précision telle quelle. **À revérifier sur www
après P15 (≈ 0,02 $).**

## Partie 4 — écarts du 29/09, par valeur pour le visiteur

| Écart | Fait | Moyen des concurrents | Preuve |
|---|---|---|---|
| PDF Organize perdait les signets | les signets suivent leur page ; celui d'une page supprimée disparaît et ses enfants remontent ; destinations nommées rendues explicites ; liens web gardés | Acrobat, PDFWix : signets mis à jour à la nouvelle position | `converter-tests/13-pdf-organize.mjs` 9/9 (Poppler `pdftohtml -xml`), `pdf-audit-2.mjs` pdf.js ×3 moteurs |
| PDF Sign sans placement libre | la page choisie est affichée telle qu'on la voit (zone de recadrage, rotation) ; la signature s'y glisse et s'y redimensionne (souris, doigt, flèches, + / −) ; même endroit relatif sur chaque page choisie ; les coins restent proposés | Smallpdf, iLovePDF, Sejda | `pdf-audit-2.mjs` `pdf-sign-drag` ×3 moteurs : page tournée à 90°, glissée à 10 % / 10 %, élargie à 40 % → dans le PDF au même endroit, droite, à ± 1 % |
| Text to PDF latin seulement | latin étendu, grec, cyrillique, vietnamien, arabe et hébreu (droite à gauche), hindi, tamoul, thaï, chinois, japonais, coréen ; polices Noto (OFL) en sous-ensemble (PDF ~50 Ko) ; CJK par tranches Google Fonts ; bengali et emoji **refusés proprement** (pas de PDF faux) | police Unicode intégrée | `text-to-pdf-unicode.mjs` ×3 moteurs, texte relu par Poppler |

Reste connu (non demandé) : signature tapée ou importée dans PDF Sign, Password Generator (une classe de chaque),
URL Decoder (« + » = espace), bengali dans Text to PDF.

## Tests finaux

Build **de production local** (`npm run build` : 273 routes générées, 0 erreur ; 1 avertissement de traçage NFT sur
`next.config.ts`, déjà présent avant cette branche), servi par `next start` sur `localhost:3100`, avec le **service
média local** pour les outils vidéo. Journaux : `$CLAUDE_JOB_DIR/tmp/final/`.

| Suite | Chromium | Firefox | WebKit |
|---|---|---|---|
| **238 pages** (`all-pages-load`) | **238 propres** | **238 propres** | **238 propres** |
| `qualite-29-09` (bancs du 29/09) | 76/76 | 76/76 | 75/75 + 1 impossible (pas de Web Audio) |
| `pdf-audit-2` (dont signets et placement libre) | 31/31 | 31/31 | 31/31 |
| `misc-audit-2` (dont AI Detector) | 17/17 | 17/17 | 17/17 |
| `image-audit-2` | 13/13 | 13/13 | 13/13 |
| `gif-audit-2` | 7/7 | 7/7 | 7/7 |
| `text-to-pdf-unicode` | 5/5 | 5/5 | 5/5 |
| `image-tools-big` (20 outils, bandes) | 21/21 | 21/21 | 21/21 |
| `big-image` (Image Converter 12/24/48 Mpx) | 21/21 | 21/21 | impossible* → `big-image-webkit-bands` 1/1 |
| `bg-remover-bands` | 3/3 | 3/3 | 3/3 |
| `image-resizer-big` · `image-editor-big` | 3/3 · 3/3 | 3/3 · 3/3 | 3/3 · 3/3 |
| `image-compressor-big` | 1/1 | 1/1 | impossible* (la page affiche son message, pas de blocage) |
| `heic-tools` | 4/4 | 4/4 | 2/2 |
| `tiff-tools-big` | 4/4 | 4/4 | — |
| `pdf-images-big` · `qr-scanner-big-photo` | 1/1 · 1/1 | 1/1 · 1/1 | 1/1 · 1/1 |
| `ios-download` (pont iOS) | 3/3 | 3/3 | 2/2 |
| `data-url-downloads` | 6/6 | 6/6 | 4/4 |
| `qr-paste-button` · `barcode-svg-open` | 4/4 · 3/3 | 2/2 · 3/3 | 2/2 · 3/3 |
| `transcript-exports` | 6/6 | 6/6 | 6/6 |
| `video-tools-mp4` (service local réel, ffprobe) | 8/8 | 8/8 | 8/8 |
| `av-audit-2` | 8/8 | 7/7 | — |
| `voice-recorder-m4a` | 1/1 | 1/1 | — |
| `screen-recorder-mp4` · `upscaler-ios-stream` · `ios-video-first-frame` | 2/2 · 2/2 · 1/1 | — | — |

\* Le WebKit de Playwright n'a pas `OffscreenCanvas` (Safari réel l'a depuis 16.4) : Image Converter et Image
Compressor y affichent « needs Safari 16.4 or later » au lieu de traiter. C'est pourquoi le chemin iPhone par bandes est
prouvé sous Firefox et WebKit par `big-image-webkit-bands` et les options `--bands`. **Le vrai Safari reste à passer (P15 ③).**
Les « — » marquent un moteur que le test ne vise pas (API absente de ce moteur dans Playwright).

Hors navigateur : `converter-tests/13-pdf-organize.mjs` **9/9** (Poppler) ; service média `run_tests.py` **106/106**
et `run_edit_tests.py` **ALL PASS** (vrai ffmpeg).

Tests ajustés pendant la passe finale, à cause des changements voulus de cette branche : `qualite-29-09` (Text to PDF
écrit le cyrillique, seul l'emoji est refusé et nommé ; JPG to PDF nomme le PDF d'après la photo) ;
`image-compressor-big` (s'arrête sur le message de la page au lieu d'attendre 10 min). Premier passage de
`qualite-29-09` sous Firefox : `ascii-art` en échec de sélecteur, **réussi au second passage** (instabilité du test, outil non modifié).

## Ce que le propriétaire doit faire, dans l'ordre

1. **Lire ce rapport**, puis demander le déploiement **P15** dans le terminal quand il le souhaite (rien n'est poussé).
2. **P15 ① — le service `media-processing` d'abord**, via `master` seul (`services/media-processing/app/ffmpeg_ops.py`
   et ses tests) : paramètres **additifs** `rotate`, `fit`, `filter`, `fps`, `forConcat` et lecture des WebM sans durée.
   Un service plus ancien **ignorerait** ces paramètres et rendrait une vidéo non tournée ou non redimensionnée sans le
   dire : le site ne doit pas partir avant. Vérifier sur le service : `run_tests.py` (106) et `run_edit_tests.py`.
3. **P15 ② — puis le site** : poussée de la branche (préversion), bancs de ce rapport ×3 moteurs sur la préversion,
   fusion **sans poussée forcée**, vérification sur www. Aucune migration SQL, aucune variable d'environnement nouvelle.
4. **P15 ③ — passe iPhone** : tests **9, 10, 25, 30, 36, 39** de `tests-safari-proprietaire.md` (et photos de 24 et
   48 Mpx dans Image Converter et Background Remover).
5. **AI Detector sur www** après le déploiement : un texte humain et un texte d'IA (≈ 0,02 $).
6. Tests Mac 9 à 30 et séance E (en cours par safaridriver) : reporter les verdicts dans la feuille.
7. **P8** (Gotenberg 3 répliques) : approuvé, à lancer plusieurs jours avant la date de lancement (non fixée) — coût
   notifié avant.
