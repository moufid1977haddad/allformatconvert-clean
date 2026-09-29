# RAPPORT — P16 : photos d'iPhone (> 16,7 Mpx) dans les outils image, fin de la vérification de P15 (30/09)

Branche `p16-photos-iphone-30-09` partie de `master` = `92b8e8a0` (repère **`restauration-avant-p16`**, poussé).
Service `media-processing` **non modifié** (reste `d914f612`, Railway `be919256`). Aucune migration, aucune variable nouvelle.
Aucune poussée forcée.

## En bref

| Étape | Résultat |
|---|---|
| 1 — fin de la vérification de P15 sur www | **tout PASS** : D/K (Rotator, Merger, Resizer), L (Trimmer), 238 pages Chromium, AI Detector sans verdict faux |
| 2 — défaut E | **cause trouvée et corrigée** ; simulation iPhone **obligatoire et active par défaut** dans tous les bancs image ; 3 moteurs × 12/24/48 Mpx verts en local et sur la préversion |
| 3 — déploiement | préversion `onlineconvertools-bqleypwvq` verte ×3 ; fusion `333e7950` sans poussée forcée ; production `onlineconvertools-aw2y2owe3` (alias www) ; **tout PASS sur www** (chaque outil image à 24 et 48 Mpx, simulation iPhone, 3 moteurs) |

## Étape 1 — P15 sur www (production `0b6cb6cf`, service `be919256`)

Source des contrôles D/K : vidéo verticale **1080×1920, 30 i/s, H.264/AAC, 5 s** (`scripts/browser-tests/p16-video-www.mjs`), chaque sortie relue par `ffprobe -count_frames`.

| Contrôle | Attendu | Mesuré sur www | |
|---|---|---|---|
| D/K Video Rotator 90° | 1920×1080, 150 images, 5,000 s, 30 i/s, son | 1920×1080, 30 i/s, 150 images, image 5,000 s, son 5,000 s, H.264/AAC (sans envoi : matrice réécrite) | PASS |
| D/K Video Merger, deux fois le même clip | 10 s, 300 images | 1080×1920, 30 i/s, 300 images, image 10,000 s, son 10,021 s | PASS |
| D/K Video Merger, **deux sources différentes** (1080×1920 30 i/s 5 s + 1280×720 25 i/s 3 s) | somme exacte 8 s, 240 images, taille et cadence du 1ᵉʳ | 1080×1920, 30 i/s, 240 images, image 8,000 s, son 8,021 s (2 billets) | PASS |
| D/K Video Resizer 480p, vidéo verticale | 480×854, 150 images, 5 s, son | 480×854, 30 i/s, 150 images, image 5,000 s, son 5,013 s (1 billet) | PASS |
| L Video Trimmer coupe précise 1 → 5 s | 120 images, 4,000 s image et son | Chromium (dans la page) et Firefox (service) : 120 images, 4,000 s / 4,000 s, 1ʳᵉ image n° 30, MOV à son en avance compris | PASS ×2 |
| 238 pages sous **Chromium** | propres | 238 propres | PASS |
| AI Detector (4 appels réels, ≈ 0,0003 $) | pas de verdict faux | humain EN « pas de verdict » (18 %), IA EN « pas de verdict » (14 %), humain FR « humain » (26 %), IA FR « pas de verdict » (16 %) | PASS (aucun verdict faux) — voir la limite ci-dessous |

Son un peu plus long que l'image (+13 à +21 ms) : dernière trame AAC (1 024 échantillons), sous la tolérance de 50 ms du banc, comme au 30/09.

**AI Detector — limite, pas un défaut de déploiement.** La méthode RAIDAR donne ce que l'étalonnage du 30/09 annonçait (verdict « IA » seulement ≤ 10 % de changement ; 4 textes d'IA sur 9 reconnus, 0 humain accusé) : aucun faux verdict, mais les textes d'IA courts tombent souvent en « pas de verdict ». Les détecteurs du marché (GPTZero, etc.) utilisent des classifieurs entraînés ; améliorer le taux de reconnaissance est un chantier de recherche à part (noté au plan, bloquant 5), pas une correction de P16.

## Étape 2 — défaut E

### La cause (mesurée)

Sur www, le chemin iPhone simulé (`image-tools-big --ios`) échouait **sous Chromium seulement** ; Firefox et WebKit passaient (Inverter, Brightness & Contrast : 24,5 Mpx, identique au chemin normal). `decodeToRaster` (`app/lib/bigImage.js`) décode par bandes avec `createImageBitmap(blob, 0, y, W, h)`, **à condition** qu'une sonde prouve le recadrage juste ; Chromium rend en miroir le recadrage d'un JPEG tourné, la sonde échoue, et le code, au lieu de se replier, décodait l'image entière puis levait `too-big-for-canvas` → « Could not load this image ». Sur un vrai iPhone la sonde passe (WebKit) : le défaut touchait tout moteur dont le recadrage n'est pas fiable, et rendait la simulation fausse. Même défaut dans les Workers d'Image Converter et d'Image Compressor : la simulation n'y arrivait jamais (seul le drapeau de la page était posé), ils utilisaient donc un canvas pleine taille sans que le banc le voie.

### Le moyen des concurrents (recherché avant de choisir)

- **iLoveIMG** : la photo est **envoyée** à ses serveurs (UE) et traitée là (sa page Sécurité ; fichiers effacés après 2 h) — pas de limite de canvas, mais l'image quitte l'appareil.
- **Photopea** : ses propres décodeurs et des calques en tuiles ; WebGL désactivé au-delà de la limite (ticket photopea #4303).
- **Squoosh** : encodeurs WebAssembly (MozJPEG, libwebp, AVIF), mais le décodage passe par un canvas : il bute sur la limite iOS de 16 777 216 px, comme toutes les bibliothèques à canvas unique (browser-image-resizer #88, react-pdf #1149, pqina « Canvas area exceeds the maximum limit »).

**Choix (au moins égal à chacun)** : décodage natif du navigateur par bandes (le principe des tuiles de Photopea), jamais un canvas au-delà de 16,7 Mpx, encodage WebAssembly de Squoosh (MozJPEG, libwebp) ou PNG en flux, **pleine résolution et sans envoi** (mieux qu'iLoveIMG sur la confidentialité, mieux que Squoosh sur iPhone). Deux niveaux de décodage : recadrage natif quand la sonde le prouve juste (le moins de mémoire, cas de Safari), sinon **une ImageBitmap entière** (pas un canvas : aucune limite de 16,7 Mpx) recopiée bande par bande — le moyen que `forEachBand` (Background Remover) utilisait déjà.

### Ce qui a changé

| Fichier | Changement |
|---|---|
| `app/lib/bigImage.js` | `decodeToRaster` : repli ImageBitmap + bandes au lieu de l'erreur ; dimensions inconnues relues sur l'ImageBitmap puis bandes ; `simulateIosCanvasCap()` (tests seulement) pour les Workers |
| `image-converter/page.tsx` + `imageConverter.worker.js`, `image-compressor/page.jsx` + `compress.worker.js` | la page transmet la simulation au Worker (`canvasCap`), qui refuse alors tout canvas > 16,7 Mpx comme iOS |
| `scripts/browser-tests/lib/ios-canvas-cap.mjs` (nouveau) | **la simulation, obligatoire et active par défaut** : tout canvas > 16 777 216 px sans contexte, dessin/lecture d'un canvas agrandi au-delà refusés, `toBlob`/`toDataURL` vides — comme iOS ; chaque refus est compté et **un outil qui a essayé un canvas trop grand échoue même s'il affiche un résultat** ; `--no-ios-cap` l'enlève pour un essai et chaque résumé l'écrit (« NOT a result to announce ») |
| les 20 bancs image | simulation appliquée à chaque contexte (`image-tools-big`, `image-tools-rest-big`, `big-image`, `big-image-webkit-bands`, `bg-remover-bands`, `image-resizer-big`, `image-editor-big`, `image-compressor-big`, `heic-tools`, `tiff-tools-big`, `pdf-images-big`, `qr-scanner-big-photo`, `image-audit-2`, `gif-audit-2`, `data-url-downloads`, `image-converter-formats`, `e2e-image-compressor`, `image-resizer`, `e2e-avif`, `upscaler-ios-stream`) ; `pdf-images-big` ne dispense plus Chromium |
| `image-tools-big.mjs` | le résultat vérifié est **toujours le chemin iPhone**, à **12, 24 et 48 Mpx** ; la passe « ordinateur » ne sert plus que de référence de pixels ; seuil JPEG = ce que libjpeg donne lui-même à qualité 92 sur la mire, − 0,3 dB (le seuil fixe de 35 dB était au-dessus de libjpeg : 34,91 dB à 12 Mpx) |
| `image-tools-rest-big.mjs` (nouveau) | les outils image qu'aucun banc ne passait avec une photo d'iPhone : Image Comparison, PNG to ICO, Duplicate Image Finder, Image Metadata, Image to Base64, GIF Maker, Image to GIF, Image Captioner (appel payant simulé par le banc : rien dépensé), SVG to PNG à la taille de la photo |

Contrôle de la simulation elle-même (3 moteurs) : canvas 5712×4284 → contexte `null` ; 4096×4096 → accepté ; canvas agrandi à 5000×5000 après coup → `getImageData` refusé ; `OffscreenCanvas(8064, 6048)` → `null`.

Inventaire (tous les outils qui acceptent une image) : les 39 outils de la catégorie image, Background Remover, Upscaler, Captioner, Image to PDF, JPG to PDF, PDF Editor, GIF Maker, Image to GIF, QR Scanner, QR Generator (logo), Video Watermark (logo). Hors bancs : PDF Editor et Video Watermark (image réduite à 2048 px avant tout canvas, lu dans le code), QR Generator (logo réduit), GIF to PNG / ICO to PNG (sources petites par nature ; même `drawToRaster` par bandes que SVG to PNG, testé à 48 Mpx).

### Tests — simulation iPhone active, photos de 12, 24 et 48 Mpx

| Banc | Local Chromium | Local Firefox | Local WebKit | Préversion Chromium | Préversion Firefox | Préversion WebKit |
|---|---|---|---|---|---|---|
| `image-tools-big` (21 outils × 3 tailles) | 63/63 | 63/63 | 63/63 | 63/63 | 63/63 | 63/63 |
| `image-tools-rest-big` (9 outils × 3 tailles) | 27/27 | 27/27 | 27/27 | 27/27 | 27/27 | 27/27 |
| `big-image` (Image Converter) | 21/21 | 21/21 | impossible* | 21/21 | 21/21 | impossible* |
| `big-image-webkit-bands` | — | 1/1 | 1/1 | — | 1/1 | 1/1 |
| `bg-remover-bands` | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 | 3/3 |
| `image-resizer-big` · `image-editor-big` | 3/3 · 3/3 | 3/3 · 3/3 | 3/3 · 3/3 | 3/3 · 3/3 | 3/3 · 3/3 | 3/3 · 3/3 |
| `image-compressor-big` | 1/1 | 1/1 | impossible* | 1/1 | 1/1 (rejoué seul : 1ᵉʳ essai, délai de chargement du relais) | impossible* |
| `heic-tools` | 4/4 | 4/4 | 2/2 | 4/4 | 4/4 | 2/2 |
| `tiff-tools-big` | 4/4 | 4/4 | — | 4/4 | 4/4 | — |
| `pdf-images-big` · `qr-scanner-big-photo` | 1/1 · 1/1 | 1/1 · 1/1 | 1/1 · 1/1 | 1/1 · 1/1 | 1/1 · 1/1 | 1/1 · 1/1 |
| `image-audit-2` · `gif-audit-2` | 13/13 · 11/11 | 13/13 · 11/11 | 13/13 · 11/11 | 13/13 · 11/11 | 13/13 · 11/11 | 13/13 · 11/11 |
| `data-url-downloads` | 6/6 | 6/6 | 4/4 | 6/6 | 6/6 | 4/4 |
| 238 pages | — | — | — | 238 propres | 238 propres | 238 propres |

\* Le WebKit de Playwright n'a pas `OffscreenCanvas` (Safari réel l'a depuis 16.4) : Image Converter et Image Compressor y affichent « needs Safari 16.4 or later ». Leur chemin par bandes est prouvé sous WebKit par `big-image-webkit-bands`. Les « — » : moteur que le banc ne vise pas.
Aussi : `image-resizer` 2/2 et `e2e-avif` (Chromium, local).

**Temps mesurés sur le chemin iPhone (48 Mpx, 3 moteurs en parallèle sur la même machine)** : filtres 4-6 s ; JPEG/WebP par WebAssembly 29-36 s sous WebKit, 118-148 s sous Firefox (encodeur WASM plus lent sous Firefox, machine chargée). Seul un vrai iPhone donnera le temps et la mémoire réels (48 Mpx = 194 Mo de pixels en mémoire, plus la sortie).

## Étape 3 — déploiement

- Repère : `restauration-avant-p16` = `92b8e8a0` (site identique à P15 `0b6cb6cf` + le rapport P15), poussé. Service : inchangé (Railway `be919256`).
- Préversion : `onlineconvertools-bqleypwvq` (pointe `227a2a73`), relais local à jeton OIDC en mémoire : tableau ci-dessus.
- Fusion : `git merge --no-ff` → **`333e7950`**, poussée normale ; production **`onlineconvertools-aw2y2owe3`** (`dpl_4DdFLygozyt2wP3uB4ptmLUeSUhc`), Ready, alias www vérifié.

### Vérification sur www (production `onlineconvertools-aw2y2owe3`), simulation iPhone active

| Banc | Chromium | Firefox | WebKit |
|---|---|---|---|
| `image-tools-big` — **chacun des 21 outils à 24 et 48 Mpx** (dont Brightness & Contrast et Image Blur, le contrôle E qui échouait) | **42/42** | **42/42** | **42/42** |
| `image-tools-rest-big` — les 9 autres outils à 24 et 48 Mpx | **18/18** | **18/18** | **18/18** |
| `big-image` (Image Converter 12/24/48 Mpx) | 21/21 | 21/21 | impossible* (`big-image-webkit-bands` 1/1) |
| `bg-remover-bands` (12/24/48 Mpx) | 3/3 | 3/3 | 3/3 |
| `image-resizer-big` · `image-editor-big` · `image-compressor-big` | 3/3 · 3/3 · 1/1 | 3/3 · 3/3 · 1/1 | 3/3 · 3/3 · impossible* |
| `heic-tools` · `tiff-tools-big` · `pdf-images-big` · `qr-scanner-big-photo` | 4/4 · 4/4 · 1/1 · 1/1 | 4/4 · 4/4 · 1/1 · 1/1 | 2/2 · — · 1/1 · 1/1 |
| `image-audit-2` · `gif-audit-2` · `data-url-downloads` | 13/13 · 11/11 · 6/6 | 13/13 · 11/11 · 6/6 | 13/13 · 11/11 · 4/4 |
| 238 pages (après déploiement) | 238 propres | — | — |

**Aucun échec sur www : aucun retour arrière nécessaire.**

## Retour arrière (si un jour nécessaire)

- Site : `vercel promote https://onlineconvertools-b64j6mp96-moufid.vercel.app --yes` (P15 tel qu'il était avant P16), puis `git revert -m 1 333e7950` poussé normalement (jamais de poussée forcée).
- Service : rien à faire (P16 ne l'a pas touché).

## Tests à refaire

**(1) Banc Safari du MacBook** (`tests-safari-scripts/run.sh`, Safari 17.6) : J (Tar `t.tar.gz`) ; K (Rotator 90°, Merger de deux sources différentes, Resizer 480p d'une vidéo verticale : durée, i/s, 480×854 par ffprobe) ; L (Trimmer coupe précise 1 → 5 s : 120 images) ; 9, 10, 25, 30, 36, 39 ; **Brightness & Contrast, Image Blur, Inverter, Sepia, PNG to JPG, JPG to WebP et Image Converter avec une photo de 24 Mpx et une de 48 Mpx** (sur Mac un canvas pleine taille est permis : ce passage vérifie que rien n'a régressé, pas le chemin iPhone).

**(2) iPhone, par le propriétaire** (photos prises par l'iPhone en 24 Mpx, et en 48 Mpx si l'appareil le permet — Réglages → Appareil photo → Formats → « Résolution » / ProRAW) : **Brightness & Contrast, Image Blur, Inverter, Sepia, Grayscale, Image Rotate, Image Cropper, PNG to JPG, JPG to WebP** (défaut E : l'image doit être traitée à pleine taille, puis « Download » doit l'enregistrer, aucun « Could not load this image ») ; Image Converter et Background Remover à 24 et 48 Mpx ; Image Compressor et Image Resizer à 24 Mpx ; noter le temps et si l'onglet se recharge (mémoire) ; puis les tests 9, 10, 25, 30, 36, 39 de la feuille.
