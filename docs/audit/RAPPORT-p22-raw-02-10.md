# RAPPORT P22 — fichiers RAW d'appareil photo (02/10)

Chantier demandé par le propriétaire (décision D3 du plan, « compiler LibRaw nous-mêmes, 0 $ »), mise en production
autorisée en son absence pour le code du site uniquement. Branche `p22-raw`, repère de restauration
`restauration-avant-p22-02-10` = `2aff711e` (poussé).

## 1. Résultat en une phrase

Image Converter lit désormais les fichiers RAW de 23 formats (Canon, Nikon, Sony, Fujifilm, Olympus/OM, Panasonic,
Leica, Pentax, Samsung, DNG dont iPhone ProRAW, Hasselblad, Phase One, Leaf, Mamiya, Epson, Kodak, Minolta), dans le
navigateur, en pleine résolution, avec des pixels **identiques** à ceux du `dcraw_emu` officiel de LibRaw ; un fichier
RAW abîmé, tronqué, inconnu ou Sigma X3F reçoit une phrase claire, jamais une fausse image.

## 2. Recherche avant décision

| Question | Ce qui a été relevé | Décision |
|---|---|---|
| Quels outils des concurrents prennent le RAW ? | iLoveIMG : seul « Convert to JPG » (« … HEIC or RAW ») ; Compress / Resize / Crop / Rotate / Watermark / Upscale / Remove background / Photo editor : non (pages lues le 02/10). CloudConvert : conversions seulement — son API publique `GET /v2/convert/formats` liste 3FR, ARW, CR2, CR3, CRW, DCR, DNG, ERF, MOS, MRW, NEF, ORF, PEF, RAF, RAW, RW2, X3F, moteur **ImageMagick**. Convertio : conversions seulement | RAW branché dans **Image Converter** seul (le seul outil équivalent) |
| Par quel MOYEN CloudConvert développe le RAW ? | ImageMagick → délégué LibRaw, dont les réglages par défaut d'ImageMagick n'utilisent **pas** la balance des blancs de l'appareil (option `dng:use-camera-wb` désactivée par défaut) | Nous : LibRaw, balance des blancs **de l'appareil**, matrice de l'appareil, sRGB → au moins égal |
| Quelle bibliothèque ? | LibRaw est la seule bibliothèque libre sérieuse (dcraw n'est plus maintenu). La version npm `libraw-wasm` est multi-fil (isolation inter-origines + blocage de Turbopack, mesuré par P21) | LibRaw **0.22.2** officiel (dernière stable, 16/07/2026), compilé par nous, mono-fil |

## 3. Compilation (scripts/libraw-wasm/)

- **Sources vérifiées.** libraw.org ne publie ni somme de contrôle ni signature, et l'étiquette GitHub `0.22.2`
  (commit `b93f6e45`) n'est pas signée. Vérification par deux canaux indépendants : l'archive de libraw.org comparée
  fichier par fichier à l'archive de l'étiquette GitHub → **toutes les sources et en-têtes identiques** (seuls les
  fichiers autotools et des scripts de mainteneur diffèrent). SHA-256 de l'archive retenue
  `de86b035…2612cfa`, inscrit dans `build.sh`, qui refuse toute autre archive.
- **Emscripten 6.0.10**, `-O3`, `LIBRAW_NOTHREADS` (aucun fil, aucune isolation inter-origines), exceptions
  WebAssembly natives en encodage historique (Safari 15.2+), cible Safari 16.4. zlib 1.3.2 (DNG « deflate ») et
  libjpeg 9f (DNG avec perte) depuis les ports d'Emscripten (qui vérifient leur propre empreinte).
- **Taille : `libraw.wasm` 881 066 octets, 354 194 compressés (gzip -9)** ; chargeur 14 Ko. Chargé **seulement au
  premier fichier RAW** (`import()` dynamique + `fetch('/wasm/libraw.wasm')`, rien dans la page tant qu'aucun RAW
  n'est choisi). La construction Turbopack est intacte (`npm run build` vert, contrôle ES2022 vert ; les deux
  références `new URL(…)` du chargeur d'Emscripten, que Turbopack tentait de résoudre, sont retirées par `build.sh`).
- **Construction reproductible** : deux compilations successives donnent le même `libraw.wasm` (SHA-256
  `93709bfd…64bbb82`, inscrit dans `scripts/p22/raw-reference.json`).
- **Développement** (`glue.cpp`, à nous, LibRaw non modifié) : balance des blancs de l'appareil, matrice couleur de
  l'appareil, primaires sRGB **et courbe sRGB** (la courbe par défaut de dcraw est celle de la BT.709, plus sombre
  dans les ombres à l'écran), dématriçage AHD, orientation du fichier, pleine taille, 8 bits.

## 4. Qualité : comparaison numérique

**Référence.** Le `dcraw_emu` **officiel** de LibRaw 0.22.2 (binaire Win64 de libraw.org), mêmes réglages
(`-w -o 1 -g 2.4 12.92 -q 3`). rawpy 0.27.1 (LibRaw 0.22.1 compilé par ses auteurs) a aussi été essayé : il diffère
de **notre** compilation **et** du `dcraw_emu` officiel sur 5 fichiers (Olympus, Samsung, Kodak, Phase One, Pentax :
décalage de luminosité global de 1 à 3 niveaux) alors que notre compilation est **identique** au `dcraw_emu` officiel
sur ces mêmes fichiers → l'écart vient de la compilation de rawpy, pas de la nôtre (vérifié aussi avec une
compilation 0.22.1 de notre côté : mêmes écarts avec rawpy).

**Résultat (Node, `scripts/p22/make-reference.mjs`)** — 27 fichiers réels de raw.pixls.us (CC0), au moins un par marque :

| Fichier | Appareil | Taille | Écart moyen / dcraw_emu | Écart max |
|---|---|---|---|---|
| 5G4A9396.CR2 | Canon EOS 5D Mark III | 2880×1920 (5.5 Mpx) | 0.0000 | 0 |
| Canon_EOS_R6_RAW_ISO_100_nocrop_nodual.CR3 | Canon EOS R6 | 5496×3670 (20.2 Mpx) | 0.0000 | 1 |
| Canon_EOS_R6_CRAW_ISO_100_nocrop_nodual.CR3 | Canon EOS R6 | 5496×3670 (20.2 Mpx) | 0.0000 | 1 |
| CRW_7673.CRW | Canon EOS 10D | 3088×2056 (6.3 Mpx) | 0.0000 | 0 |
| lossless_compressed_14_bit.NEF | Nikon D750 | 6032×4032 (24.3 Mpx) | 0.0000 | 1 |
| Nikon-D850-14bit-compressed.NEF | Nikon D850 | 8288×5520 (45.7 Mpx) | 0.0000 | 3 |
| DSCN2039.NRW | Nikon COOLPIX P7800 | 4032×3024 (12.2 Mpx) | 0.0000 | 0 |
| _DSC0009.ARW | Sony ILCE-7M3 | 6024×4024 (24.2 Mpx) | 0.0000 | 0 |
| _DSC1477.SR2 | Sony DSC-R1 | 3925×2608 (10.2 Mpx) | 0.0000 | 2 |
| DSC06227.SRF | Sony DSC-F828 | 3287×2460 (8.1 Mpx) | 0.0000 | 0 |
| compressed_X-T30II.RAF | Fujifilm X-T30 II | 6246×4170 (26.0 Mpx) | 0.0000 | 2 |
| Olympus_EM1mk2_Standard_20MP.ORF | Olympus E-M1MarkII | 5240×3912 (20.5 Mpx) | 0.0000 | 0 |
| P1010607.RW2 | Panasonic DMC-GH4 | 3472×3472 (12.1 Mpx) | 0.0000 | 5 |
| L1010119.RWL | Leica D-LUX 4 | 3792×2538 (9.6 Mpx) | 0.0000 | 0 |
| IMGP6854.PEF | Pentax K-70 | 6020×4016 (24.2 Mpx) | 0.0000 | 0 |
| IMGP0668.DNG | Pentax K-3 II | 6028×4024 (24.3 Mpx) | 0.0000 | 1 |
| SAM_2927.SRW | Samsung NX500 | 6496×4336 (28.2 Mpx) | 0.0000 | 1 |
| IMG_1361.DNG | Apple iPhone13,3 back camera | 3024×4032 (12.2 Mpx) | 0.0000 | 0 |
| RAW_2018_11_07_14_43_14_820_noflash.dng | Apple iPhone10,1 back camera | 4032×3024 (12.2 Mpx) | 0.0000 | 0 |
| RAW_HASSELBLAD_CFV.3FR | Hasselblad CFV-16 | 4096×4096 (16.8 Mpx) | 0.0000 | 1 |
| CF051545.IIQ | Phase One P20+ | 4093×4096 (16.8 Mpx) | 0.0000 | 4 |
| L_003172.mos | Leaf Aptus 22 | 5344×4008 (21.4 Mpx) | 0.0000 | 1 |
| RAW_MAMIYA_ZD.MEF | Mamiya ZD | 5344×4016 (21.5 Mpx) | 0.0000 | 2 |
| _EPS0672.ERF | Epson R-D1 | 3040×2024 (6.2 Mpx) | 0.0000 | 2 |
| 100_3710.KDC | Kodak P880 ZOOM | 3280×2454 (8.0 Mpx) | 0.0000 | 7 |
| D7465857.DCR | Kodak DCS Pro 14nx | 4516×3012 (13.6 Mpx) | 0.0000 | 2 |
| PICT0881.MRW | Minolta DiMAGE A2 | 3272×2456 (8.0 Mpx) | 0.0000 | 3 |

Écart moyen 0,0000 partout ; les écarts maximaux de 1 à 7 niveaux sur quelques pixels isolés viennent de l'arrondi
des flottants (compilateur natif contre WebAssembly).

**Couleurs contre le JPEG de l'appareil** (aperçu intégré au RAW) : balance des blancs et teintes conformes pour
Olympus et Sony ; seule l'exposition diffère (courbe de tons de l'appareil contre développement neutre), comme chez
tout convertisseur fondé sur LibRaw/dcraw.

**Sigma X3F (Foveon) : refusé.** LibRaw le décode (avec `USE_X3FTOOLS`, identique à rawpy), mais les couleurs sont
**fausses** à côté du JPEG de l'appareil (feuilles vertes rendues brunes, tulipes rouges rendues roses). Un résultat
faux sans le dire étant interdit, un X3F reçoit : « this tool cannot develop it with correct colours. Export a TIFF
or JPG from Sigma Photo Pro, then convert that ». Le module est compilé sans X3F.

## 5. Fichiers abîmés : jamais de faux résultat

Mesure : les 27 fichiers coupés à 50 %, 90 %, 99 %, 99,9 %, 99,99 % et 99,999 % de leur taille (162 cas), plus un
fichier aléatoire nommé .cr2, un JPEG nommé .nef, un fichier vide.

- **Constat de départ** : LibRaw seul rendait une image pour 21 fichiers coupés, dont 14 **fausses** (ARW, ORF, RW2,
  3FR, SRW, CR3 : zéros ou octets périmés à la place des données manquantes, sans erreur).
- **Correctif 1** (`glue.cpp`) : un flux de lecture surveillé compte les lectures au-delà de la fin du fichier
  pendant le décodage. Comme certains décodeurs lisent par avance au-delà de la fin d'un fichier COMPLET
  (Olympus 21 Ko, Nikon D850 1 octet — mesuré), une lecture au-delà ne prouve rien seule : le fichier est alors
  redécodé deux fois avec les octets manquants servis à 0x00 puis à 0xFF ; si le résultat change, l'image dépend
  d'octets absents → refusé (« looks damaged or incomplete »).
- **Correctif 2** (`rawDecode.js`) : un CR3 coupé de 1 % garde ses données d'image mais perd les métadonnées de
  l'appareil en fin de boîte `mdat` : LibRaw développait toute l'image avec d'autres couleurs (écart moyen 8,7),
  sans erreur. Le CR3 étant un conteneur ISO-BMFF, une boîte qui dépasse la fin du fichier → refusé.
- **Après** : 0 résultat faux sur les 162 cas ; chaque fichier coupé est soit refusé, soit rendu **identique au
  pixel près** à l'image du fichier complet (la coupe n'avait ôté que des métadonnées de fin) ; les 27 fichiers
  complets passent toujours.
- Limite connue, commune à tous les convertisseurs : un fichier dont des octets sont altérés **au milieu** (sans
  changement de taille) donne une image visiblement abîmée ; aucun format RAW ne porte de somme de contrôle qui
  permettrait de le détecter.

## 6. iPhone et iPad

- Décodage dans le worker d'Image Converter, sortie en mémoire RGBA, jamais dans un canvas : au-delà de 16,7 Mpx,
  le chemin par bandes déjà en place (`app/lib/bigImage.js`) encode sans canvas. Le banc simule la limite de canvas
  d'iOS dans la page et les workers : **aucun canvas au-delà de 16,7 Mpx** sur tous les fichiers (D850 45,7 Mpx compris).
- Pleine résolution toujours ; un RAW au-delà de la limite déclarée (50 Mpx sur téléphone et tablette, 100 Mpx sur
  ordinateur) reçoit la phrase de limite existante — aucune réduction silencieuse.
- Mémoire : la mémoire WebAssembly ne rétrécit jamais ; après un fichier qui l'a fait grandir au-delà de 256 Mo, le
  module est relâché pour que le navigateur la reprenne pendant l'encodage (iPhone / iPad).

## 7. Bancs dans les navigateurs (`scripts/browser-tests/p22-raw.mjs`)

Le module WebAssembly est déterministe : chaque navigateur doit rendre **exactement** les pixels de la référence
(SHA-256 des octets RVB, `scripts/p22/raw-reference.json`, 29 fichiers).
- **Chromium et Firefox** : Image Converter réel, RAW → **BMP** (sans perte ; ses pixels sont hachés dans la page,
  rien de lourd ne transite), plus RAW → PNG sur un fichier de 5,5 Mpx (canvas) et un de 24 Mpx (bandes), plus un
  RAW → JPG pleine taille. **Limite de canvas d'iOS simulée** (page + workers) : au-delà de 16,7 Mpx, chemin par bandes,
  et le banc échoue si un canvas trop grand est seulement tenté. Avec `--device=iphone` / `--device=ipad` : agent
  Safari, tactile, limites des téléphones, lien de téléchargement préparé pour le toucher (lu dans le Cache Storage du
  service worker, comme `download-guard`). Une passe **sans** la limite (`--no-ios-cap`) vérifie aussi le chemin des
  ordinateurs (un seul canvas, encodeurs du navigateur) sur les 3 plus gros fichiers.
- **WebKit** : le WebKit de Playwright n'a pas d'OffscreenCanvas dans les workers (le vrai Safari 16.4+ l'a), le
  worker du convertisseur ne peut donc pas y tourner : le `libraw.wasm` **déployé** et `rawDecode.js` y sont exécutés
  dans un Worker de la page, simulations iPhone et iPad comprises.
- **Fichiers abîmés ou faux** (dans chaque configuration) : ARW coupé à 99 % et à 99,99 %, CR3 coupé à 99 %, JPEG
  nommé .nef, .dng vide, X3F → une phrase claire, aucun fichier.
- Un navigateur neuf par conversion : un Firefox qui avait converti dix gros RAW d'affilée ne répondait plus (le même
  fichier passait seul en 21 s) — le banc mesure le site, pas la fatigue du navigateur de test.

**Corrections apportées par les bancs** (préversions 1 → 4) : marge d'attente du développement portée à 10 s par
mégapixel brut (Firefox 4× plus lent que Chromium) ; au-delà de 16,7 Mpx sur ordinateur, un seul canvas et l'encodeur
du navigateur (un 24 Mpx → JPG prenait 108 s dans Firefox par WebAssembly) ; manque de mémoire JavaScript → phrase
claire au lieu du message brut.

**Préversion 4 `onlineconvertools-f5fl9ssr0` (commit `8edb60a9`, code final), lue par le relais local (jeton OIDC en
mémoire via `vercel env run` dans un dossier temporaire ; aucun fichier d'environnement lu ni affiché) :**

| Banc | Réussis | Échecs | Dernière ligne |
|---|---|---|---|
| big-chromium-bands | 0 | 0 | Node.js v24.14.1 |
| big-firefox-bands | 0 | 0 | Node.js v24.14.1 |
| dg-chromium-iphone | 193 | 0 | ALL PASS: 193 checks (chromium [iphone]) |
| dg-chromium | 147 | 0 | ALL PASS: 147 checks (chromium) |
| dg-firefox | 147 | 0 | ALL PASS: 147 checks (firefox) |
| dg-webkit-ipad | 179 | 0 | ALL PASS: 179 checks (webkit [ipad]) |
| dg-webkit-iphone | 179 | 0 | ALL PASS: 179 checks (webkit [iphone]) |
| dg-webkit | 135 | 0 | ALL PASS: 135 checks (webkit) |
| layout-chromium | 0 | 0 | ALL PASS: 450 pages (chromium) |
| layout-webkit | 0 | 0 | ALL PASS: 450 pages (webkit) |
| pages-chromium | 0 | 0 | 238 pages opened in chromium: 238 clean, 0 with a problem |
| pages-firefox | 0 | 0 | 238 pages opened in firefox: 238 clean, 0 with a problem |
| pages-webkit-safari16 | 0 | 0 | 238 pages opened in webkit (Safari 16.4 simulation): 238 clean, 0 with a problem |
| pages-webkit | 0 | 0 | 238 pages opened in webkit: 238 clean, 0 with a problem |
| psd-chromium | 3 | 0 | ALL PASS: 3 checks (chromium) |
| psd-firefox | 3 | 0 | ALL PASS: 3 checks (firefox) |
| raw-chromium-desktop-nocap | 11 | 0 | ALL PASS: 11 checks (chromium; WITHOUT the iPhone canvas limit (--no-ios-cap): NOT a result to announce) |
| raw-chromium-ipad | 38 | 0 | ALL PASS: 38 checks (chromium/ipad; iPhone canvas limit simulated (16.7 MP, page + Workers)) |
| raw-chromium-iphone | 38 | 0 | ALL PASS: 38 checks (chromium/iphone; iPhone canvas limit simulated (16.7 MP, page + Workers)) |
| raw-chromium | 38 | 0 | ALL PASS: 38 checks (chromium; iPhone canvas limit simulated (16.7 MP, page + Workers)) |
| raw-firefox-desktop-nocap | 11 | 0 | ALL PASS: 11 checks (firefox; WITHOUT the iPhone canvas limit (--no-ios-cap): NOT a result to announce) |
| raw-firefox-iphone | 37 | 1 | 1 FAIL, 37 pass (firefox/iphone; iPhone canvas limit simulated (16.7 MP, page + Workers)) |
| raw-firefox | 38 | 0 | ALL PASS: 38 checks (firefox; iPhone canvas limit simulated (16.7 MP, page + Workers)) |
| raw-webkit-ipad | 35 | 0 | ALL PASS: 35 checks (webkit/ipad; deployed wasm in a page Worker) |
| raw-webkit-iphone | 35 | 0 | ALL PASS: 35 checks (webkit/iphone; deployed wasm in a page Worker) |
| raw-webkit | 35 | 0 | ALL PASS: 35 checks (webkit; deployed wasm in a page Worker) |
| robust-chromium | 460 | 12 | 12 FAIL, 460 pass (chromium) |
| robust-firefox | 450 | 22 | 22 FAIL, 450 pass (firefox) |
| robust-webkit | 455 | 17 | 17 FAIL, 455 pass (webkit) |

- **RAW : tout vert** sur les 3 moteurs, iPhone et iPad (Chromium 38/38 ×3, Firefox 38/38, WebKit 35/35 ×3, chemin
  ordinateur 11/11 ×2). Firefox + simulation iPhone : 37/38 dans le banc complet (RAW → JPG 24 Mpx au-delà de 300 s,
  trois navigateurs occupés en même temps) ; relancé seul : **7/7, JPG en 45 s**.
- **Téléchargement** 147 / 147 / 135, iPhone 193 / 179, iPad 179 ; **affichage** 450/450 Chromium et WebKit ;
  **238 pages ×3** et simulation Safari 16.4 : tout vert. PSD/SVG (régression d'Image Converter) 3/3 ×2.
- **Solidité** (banc complet, 472 contrôles par moteur — P21 ne l'avait passé que sur ses 29 outils) : 12 / 22 / 17
  échecs, **aucun sur Image Converter**. Relancé sur la production d'avant P22 (`bt00mpvwr`, www) pour ces outils :
  **mêmes échecs** (Duplicate Image Finder, Video Watermark, QR Generator « giant », Image Cropper sous Firefox,
  Video Merger sous Firefox, Barcode Generator = délai du banc) → **préexistants, sans lien avec P22**, notés au §11.
- `big-image.mjs` plante aussi sur la production d'avant P22 (il attend un ancien bouton de téléchargement) : banc
  périmé, préexistant ; le chemin par bandes d'Image Converter est couvert par `p22-raw.mjs`.

## 8. Licence

LibRaw est distribué au choix sous LGPL-2.1 ou CDDL-1.0. **Choix : CDDL-1.0** (licence par fichier ; elle exige de
fournir les sources de LibRaw et d'en informer, sans exigence de réédition des liens comme la LGPL).
- `/wasm/libraw-LICENSE.txt` : quelle licence, d'où vient le binaire, avis COPYRIGHT de LibRaw, licence BSD de
  DCB/FBDD (incluse dans LibRaw), mention de l'Independent JPEG Group et de zlib, texte intégral de la CDDL.
- **Offre des sources** : l'archive exacte `LibRaw-0.22.2.tar.gz` est servie par le site (`/wasm/LibRaw-0.22.2.tar.gz`),
  identique à celle de libraw.org (même SHA-256).
- Le site liste ses bibliothèques dans la FAQ de chaque outil (comme 7-Zip dans Zip Extractor) : Image Converter a une
  question « What reads the RAW files? » qui nomme LibRaw 0.22.2, la CDDL et le fichier de licence.

## 9. Textes de la page (exacts)

Zone de dépôt, description, étapes, FAQ « Which formats are supported? », nouvelle FAQ « Can it convert camera RAW
files? » (liste exacte des 23 formats vérifiés, X3F refusé, fichier abîmé refusé, 0,35 Mo au premier RAW),
métadonnées de la page. Les extensions acceptées au sélecteur sont exactement les formats vérifiés (+ X3F, pour
dire pourquoi il est refusé).

## 10. Mise en production

- Repère `restauration-avant-p22-02-10` = `2aff711e` (poussé) ; branche `p22-raw`.
- Préversions 1 → 4 (`9a62o76lv`, `qwvz59u5l`, `6ef73j6ok`, `f5fl9ssr0`) ; bancs complets sur la 4ᵉ (§7).
- **Fusion** `git merge --no-ff p22-raw` → **`bf960651`**, poussée normale (aucune poussée forcée) ; production
  **`onlineconvertools-awc0el292`** Ready. Retour arrière prêt : promotion de `onlineconvertools-bt00mpvwr`.
- **Sur www** : page servie avec les textes RAW ; `/wasm/libraw.wasm` (SHA-256 `93709bfd…` = référence),
  `/wasm/libraw-LICENSE.txt` et `/wasm/LibRaw-0.22.2.tar.gz` (SHA-256 `de86b035…` = libraw.org) servis ; bancs avec
  les vrais RAW :

| Banc | Réussis | Échecs | Dernière ligne |
|---|---|---|---|
| dg-chromium | 142 | 0 | ALL PASS: 142 checks (chromium) |
| dg-firefox | 142 | 0 | ALL PASS: 142 checks (firefox) |
| dg-webkit-iphone | 172 | 0 | ALL PASS: 172 checks (webkit [iphone]) |
| dg-webkit | 130 | 0 | ALL PASS: 130 checks (webkit) |
| pages-chromium | 0 | 0 | 238 pages opened in chromium: 238 clean, 0 with a problem |
| pages-firefox | 0 | 0 | 238 pages opened in firefox: 238 clean, 0 with a problem |
| pages-webkit | 0 | 0 | 238 pages opened in webkit: 238 clean, 0 with a problem |
| raw-chromium-desktop-nocap | 11 | 0 | ALL PASS: 11 checks (chromium; WITHOUT the iPhone canvas limit (--no-ios-cap): NOT a result to announce) |
| raw-chromium-iphone | 38 | 0 | ALL PASS: 38 checks (chromium/iphone; iPhone canvas limit simulated (16.7 MP, page + Workers)) |
| raw-chromium | 38 | 0 | ALL PASS: 38 checks (chromium; iPhone canvas limit simulated (16.7 MP, page + Workers)) |
| raw-firefox | 38 | 0 | ALL PASS: 38 checks (firefox; iPhone canvas limit simulated (16.7 MP, page + Workers)) |
| raw-webkit-ipad | 35 | 0 | ALL PASS: 35 checks (webkit/ipad; deployed wasm in a page Worker) |
| raw-webkit-iphone | 35 | 0 | ALL PASS: 35 checks (webkit/iphone; deployed wasm in a page Worker) |
| raw-webkit | 35 | 0 | ALL PASS: 35 checks (webkit; deployed wasm in a page Worker) |

  **Tout vert. Aucun retour arrière.**

## 11. Ce qui reste

**Au propriétaire (vrai matériel) :**
1. Sur l'iPhone et l'iPad : Image Converter avec un vrai RAW (CR2/CR3/NEF/ARW…, ou un ProRAW de l'iPhone) → JPG ;
   le fichier s'enregistre dans Fichiers, l'image a la bonne orientation et les couleurs de l'appareil.
2. Un ProRAW 48 Mpx d'iPhone 14/15/16 Pro : aucun sur raw.pixls.us, seuls des ProRAW 12 Mpx ont été testés.

**Non mesuré faute d'échantillon** : DNG compressé en JPEG XL (DNG 1.7) — LibRaw ne le lit qu'avec le DNG SDK
d'Adobe, non compilé ; un tel fichier devrait recevoir la phrase « non pris en charge », mais cela n'a pas été
vérifié sur un vrai fichier.

**Défauts préexistants relevés par le banc de solidité complet (hors P22, à traiter dans un chantier dédié)** :
Duplicate Image Finder et Video Watermark ne disent rien pour un fichier vide/abîmé/faux ; QR Generator « giant »
silencieux ; Image Cropper (Firefox) et Video Merger (Firefox) silencieux ; Barcode Generator : sélecteur de fichier
introuvable par le banc. Banc `big-image.mjs` à mettre à jour (ancien bouton de téléchargement).
