# RAPPORT P23 — erreurs réelles des visiteurs (D2) et solidité des derniers outils (02/10)

Chantier demandé par le propriétaire, mise en production autorisée y compris en son absence (code du site seulement).
Branche `p23-02-10`, repère de restauration `restauration-avant-p23-02-10` = `df92da33`.

## 1. Erreurs réelles des visiteurs (D2, phase 2 de P21)

**Source** : les deux exports CSV de `docs/audit/p21-tool_errors-lecture.sql` posés par le propriétaire dans
Téléchargements le 01/10 à 18 h 27 et 18 h 28 (heure locale). Lus sur place, **ni copiés ni commités** ; ce rapport
n'en garde que des comptes et des causes.

**Ce qu'ils contiennent** (depuis la purge du 28/09) : **5 lignes, un seul outil, une seule cause.**

| Outil | Navigateur | Extensions (taille) | Lignes | Quand (UTC) | Message |
|---|---|---|---|---|---|
| Image Converter | Safari 27 (iPhone) | HEIC (0-1 Mo) ×2, JPG/JPEG (1-10 Mo) ×3 | 5 | 28/09, 23 h 31 → 23 h 56 | « [fichier] is 12 megapixels, more than the 12-megapixel limit » |

**Cause, vérifiée dans le code d'avant** : jusqu'au 29/09, Image Converter plafonnait les téléphones à
`MOBILE_MAX_MEGAPIXELS = 12` (`git show cd0c2ad9^:app/tools/image-tools/image-converter/config.ts`). Une photo
d'iPhone fait 4032 × 3024 = **12,19 Mpx** : refusée, et le message arrondissait à « 12 megapixels, more than the 12 »
— phrase incohérente en plus d'un refus à tort. C'est la séance iPhone du propriétaire du 28/09 au soir.

**Déjà corrigée** par `cd0c2ad9` (29/09, 04 h 23 UTC, soit 27 minutes après la dernière ligne) : 50 Mpx sur téléphone,
100 sur ordinateur, décodage par bandes au-delà des 16,7 Mpx de canvas d'iOS ; le message donne maintenant les
dimensions et une décimale.

**Reproduction sur le code actuel** : banc `big-image.mjs`, remis à jour (§3), avec l'agent et l'écran d'un iPhone
et le plafond de canvas d'iOS simulé : la photo de 12,2 Mpx (le cas exact) **et** 24 Mpx tournée (EXIF 6) **et**
48 Mpx → JPG, PNG, WebP : **9/9**, pixels comparés à la source (PSNR 37,6 à 39 dB en JPG/WebP, identiques en PNG).

**Aucune ligne depuis le 28/09 à 23 h 56.** Ce silence n'est pas une preuve d'absence de défaut, pour deux raisons
notées ici pour qu'on ne les oublie pas :
- la chaîne d'enregistrement n'a pas changé depuis le 28/09 (`git log` sur `app/api/report-error`,
  `lib/reportError.js`, `app/lib/reportError.js`) et elle fonctionnait ce jour-là (ces 5 lignes en sont la preuve) ;
  Claude ne peut pas l'essayer sans écrire dans Supabase (interdit) ;
- seuls **24 fichiers** appellent `reportToolError` (21 outils, la page d'erreur générale et deux composants
  partagés) ; une erreur dans un autre outil n'arrive pas dans `tool_errors`. Le trafic d'avant lancement est
  par ailleurs presque nul.

**D2 : clos** — la seule cause remontée est reproduite, corrigée depuis le 29/09 et couverte par un banc.

## 2. Solidité — ce que P22 avait relevé, et ce que le banc a trouvé en plus

### 2.1 Comment les concurrents formulent ces messages (relevé en direct le 02/10, `scripts/p23/rival-messages.mjs`)

| Site | Fichier vide | Fichier abîmé (512 octets aléatoires) | Autre type |
|---|---|---|---|
| iLoveIMG (Crop, Watermark) | **rien** | accepté sans un mot (les réglages s'affichent) | — |
| Clideo (Merge video) | — | « Error: Something went wrong, please try again » | — |
| goQR (API, texte de 5 000 caractères) | — | — | une image SVG **cassée** (`width="NAN"`), sans message |
| base64.guru (photo de 2 Mo) | — | — | les 2,6 millions de caractères dans le champ (le même gel que le nôtre sous Safari) |

Aucun ne dit **ce qui ne va pas avec ce fichier-là et quoi faire**. Notre règle, retenue pour toutes les phrases
ci-dessous : une phrase qui nomme le fichier quand il y en a plusieurs, dit la cause réelle (vide, abîmé, autre
type, trop grand, format que ce navigateur ne lit pas) et le geste suivant (le rechoisir, l'enregistrer en JPG/PNG,
le convertir en MP4 avec notre Video Converter, une version plus petite…).

### 2.2 État réel avant correction (banc complet `p21-robustness.mjs`, construction locale de `df92da33`)

Le banc a d'abord été corrigé de deux angles morts (« can't » non reconnu, bouton « Find Duplicates » jamais
cliqué). Sur 472 cas par moteur : **Chromium 8 échecs, Firefox 17, WebKit 14** (dont 6 dus à la charge : trois
navigateurs en même temps, un sélecteur de fichier non atteint en 10 s ou une phrase arrivée après 45 s). En regardant la page elle-même (`scripts/p23/probe-text.mjs`), et pas seulement le verdict :

| Outil | Ce que la page faisait vraiment | Moteurs |
|---|---|---|
| Duplicate Image Finder | fichier vide « comparé » comme les autres ; image illisible dite seulement après le clic | 3 |
| Video Watermark | **pas muet, mais faux** : pour un fichier vide ou un PDF renommé .mp4, « this isn't necessarily a broken file… your browser can't play this codec » | 3 |
| Video Merger | l'erreur JavaScript brute **« can't access property "find", e.streams is undefined »** (ffprobe ne rend pas de `streams` sur un fichier qu'il ne lit pas) | Firefox |
| Image Cropper | Chromium : « probably too large for this device » (faux : le fichier est vide ou abîmé) ; Firefox : **« CanvasRenderingContext2D.drawImage: Passed-in image is "broken" »** ; WebKit : rien | 3 |
| QR Generator « giant » | **pas un silence** : « The logo is larger than 2 MB » (l'image du banc pèse 2,6 Mo, pas 1,8) — tournure que le banc ne reconnaissait pas | — |
| Barcode Generator | le banc n'ouvrait pas le mode « Many » où se trouve l'import CSV ; l'import lisait n'importe quel fichier comme du texte | — |
| **Image to Base64** (trouvé par P23) | une **vraie photo de 2 Mo fige la page 84 s sous WebKit** (Chromium 2,9 s) : 2,6 millions de caractères dans le champ | WebKit |
| **JPG to PDF** (trouvé par P23) | 900 Mpx : WebKit **figé** ; Firefox fait un vrai PDF mais sa page mesure 30 000 points (Acrobat ne dépasse pas 14 400) ; Chromium « could not be read (Array buffer allocation failed) » | 3 |
| Audio Trimmer | pas muet : « could not be read (no audio stream) » après le chargement de ffmpeg (~30 s sous Firefox), au-delà du délai du banc sous charge | — |

**Nouveau cas ajouté au banc : « bomb »** — un PNG blanc de 20 000 × 20 000 (400 Mpx) qui ne pèse que **49 Ko**, sous
toutes les limites de poids. Premier passage (Chromium, 50 outils d'image) : 6 échecs — **Image Compressor bloqué
sans fin sur « Compressing… »**, **GIF Compressor : erreur brute « Failed to execute 'createObjectURL' »**, GIF Maker
et QR Scanner (en fait : attente d'une 2ᵉ image, et « No QR code found » non reconnu par le banc), Image Cropper et
PNG to ICO (vrais résultats que le banc ne savait pas vérifier sur une image noire → bombe blanche, pixels vérifiés).

### 2.3 Corrections (cause racine, pas seulement le message)

| Outil | Correction |
|---|---|
| `app/lib/fileChecks.js` (partagé) | `unreadableImageMessage` (vide / autre type / HEIC ou TIFF hors navigateur / .svgz / trop grand d'après l'en-tête / abîmé), `imageHeaderSize` (PNG, GIF, JPEG, WebP, BMP, TIFF lus dans l'en-tête, sans décoder), `videoFileProblem` (vide, ou signature forte d'un autre type), `unreadableVideoMessage` (abîmé ≠ codec non lu), `decodedText` (UTF-16 / UTF-8 / ANSI) |
| Image Cropper | vide dit à la sélection ; `onError` de l'image → la phrase exacte ; message d'un fichier précédent ignoré |
| Duplicate Image Finder | vides écartés et nommés ; image illisible dite dès sa vignette ; au-delà de 268 Mpx (surface maximale d'un canvas) comparée à l'identique sans décodage, et dit |
| Video Watermark | vide / image / PDF renommé dit à la sélection ; fichier qui ne commence pas comme une vidéo dit « abîmé, pas une vidéo ou format non lu », sinon codec, avec Video Converter |
| Video Merger | `signature()` protégé (fini « e.streams is undefined ») ; fichiers refusés nommés à l'ajout ; phrase précise au lieu de « has no video that can be read » |
| QR Generator | logo vide, illisible ou au-delà de 100 Mpx d'après l'en-tête : une phrase (avant : silence sur un PNG géant de moins de 2 Mo) ; toute erreur d'ouverture rattrapée |
| Barcode Generator | import CSV vérifié (`textFileProblem`) et **décodé selon son encodage** (un export Excel « Texte Unicode » donnait un NUL entre chaque caractère → codes-barres faux) |
| Image to Base64, Base64 Encoder | aperçu limité à **100 000 caractères** (mesuré, `scripts/p23/textarea-cost.mjs` : WebKit 0,27 s pour 100 000, 6,9 s pour 1 000 000, contre 0,28 s pour Chromium) ; « Copy » et « Download » donnent tout. Les sorties à lignes courtes (CSV, texte de PDF) ne sont pas concernées : 3 Mo en 0,5 s sous WebKit, mesuré |
| JPG to PDF, Image to PDF, PDF Merge (`pdfImages.js`) | page bornée à **14 400 points** (limite d'Acrobat), l'image garde tous ses pixels ; PNG et images redessinées bornés à 268 Mpx avant décodage (TIFF compris), le JPEG intégré sans décodage reste sans borne ; manque de mémoire dit comme tel |
| Image Compressor | borne 268 Mpx lue dans l'en-tête (une photo Galaxy de 200 Mpx et un panorama iPhone passent) ; la file ne peut plus rester bloquée si un fichier devient illisible |
| GIF Compressor | vide, pas un GIF (`GIF8`), image géante dits avant gifsicle ; résultat vide → phrase |
| QR Scanner | la cause exacte si l'image ne s'ouvre pas ; une autre panne n'accuse plus l'image ; SVG sans dimensions lu |
| GIF Maker | « Add at least one more image to make an animation » avec une seule image |

**Banc** (`p21-robustness.mjs`) rendu plus exigeant : une erreur JavaScript brute affichée est un **échec**
(« RAW-ERROR ») ; un résultat tiré de l'image géante ou de la bombe n'est compté juste que s'il est vérifié (PDF
ouvert, image entière, page ≤ 14 400 pt ; image ouverte, pixels blancs et opaques) ; « can't », « larger than »,
« no … found » reconnus ; mode « Many » de Barcode Generator ouvert ; jamais de clic sur « Scan with camera ».

**Réviseur indépendant** (lecture seule, deux passages, uniquement « refuser un bon fichier / accepter un mauvais sans
le dire ») : **rien de grave**. Retenu et corrigé : import CSV UTF-16/ANSI de Barcode Generator (moyen) ; file
d'Image Compressor bloquable (moyen) ; une borne « téléphone » de 50 Mpx non mesurée pour ces outils qui aurait refusé
de vraies photos Android de 64 à 200 Mpx ou un panorama iPhone (moyen → 268 Mpx partout) ; MJPEG, DV, TS à 204
octets, WTV, .svgz, dimensions WebP/BMP/TIFF, TIFF géant borné avant décodage, messages d'un fichier précédent,
QR Scanner (faibles). Tests unitaires : `scripts/p23/media-checks.test.mjs` (aucune vraie vidéo refusée — MP4, MOV,
WebM, AVI réels et 20 débuts de conteneurs, dont un .mts dont l'horodatage commence par « BM » ; encodages ;
dimensions ; JPEG tronqué) et `scripts/p21/file-checks.test.mjs` : verts.

## 3. Banc `big-image.mjs` remis à jour

Il attendait l'ancien bouton « Download » (`div.bg-green-50 button`) et plantait sur toutes les versions depuis
FileDownload. Il lit maintenant la ligne de téléchargement partagée (`[data-file-download]`, lien préparé
`/zipdl/` sur iPhone/iPad lu dans le cache du service worker), choisit le format par son libellé, prend
`--device=iphone|ipad` (agent, écran, toucher, donc la limite de 50 Mpx des téléphones). Le WebKit de Playwright
n'a pas d'OffscreenCanvas dans les workers : Image Converter y refuse (« needs Safari 16.4 or later ») — limite du
robot, pas du site ; le chemin iPhone est mesuré sous Chromium et Firefox avec le plafond de canvas d'iOS simulé, et
le décodage par bandes sous WebKit par `big-image-webkit-bands.mjs`.

## 4. Préversion

Accès par le relais local (`vercel-preview-proxy.mjs`, jeton OIDC en mémoire via `vercel env run` dans un dossier
temporaire ne contenant que `.vercel/project.json` ; aucun fichier d'environnement lu, écrit ni affiché). Barre
d'outils Vercel coupée (absente de www). **Aucun appel payant** : le banc de solidité joue toutes les routes `/api/`
et coupe tout envoi vers un autre hôte. Lanceur : `scripts/p23/run-benches.mjs`.

**Préversion `onlineconvertools-o9kndcu5v` (`0899706a`)** — affichage, RAW, PSD, grandes images (le commit suivant ne
touche pas Image Converter ni la mise en page, vérifié par `git diff 0899706a bf5f65e2 --stat`) :

| Banc | Réussis | Échecs | Fin | Dernière ligne |
|---|---|---|---|---|
| layout-chromium | 0 | 0 | 0 | ALL PASS: 450 pages (chromium) |
| layout-webkit | 0 | 0 | 0 | ALL PASS: 450 pages (webkit) |
| raw-chromium | 38 | 0 | 0 | ALL PASS: 38 checks (chromium; iPhone canvas limit simulated (16.7 MP, page + Workers)) |
| raw-firefox | 38 | 0 | 0 | ALL PASS: 38 checks (firefox; iPhone canvas limit simulated (16.7 MP, page + Workers)) |
| raw-webkit | 35 | 0 | 0 | ALL PASS: 35 checks (webkit; deployed wasm in a page Worker) |
| raw-chromium-iphone | 38 | 0 | 0 | ALL PASS: 38 checks (chromium/iphone; iPhone canvas limit simulated (16.7 MP, page + Workers)) |
| raw-chromium-ipad | 38 | 0 | 0 | ALL PASS: 38 checks (chromium/ipad; iPhone canvas limit simulated (16.7 MP, page + Workers)) |
| raw-webkit-iphone | 35 | 0 | 0 | ALL PASS: 35 checks (webkit/iphone; deployed wasm in a page Worker) |
| raw-webkit-ipad | 35 | 0 | 0 | ALL PASS: 35 checks (webkit/ipad; deployed wasm in a page Worker) |
| psd-chromium | 3 | 0 | 0 | ALL PASS: 3 checks (chromium) |
| psd-firefox | 3 | 0 | 0 | ALL PASS: 3 checks (firefox) |
| big-chromium-iphone | 9 | 0 | 0 | all passed (chromium iphone) |
| big-firefox-iphone | 4 | 0 | 0 | all passed (firefox iphone) |
| big-chromium-ipad-bands | 9 | 0 | 0 | all passed (chromium ipad) |

Le banc de solidité sur cette préversion a fait remonter 6 vrais défauts sous WebKit/Firefox (Add Noise et HEIC to PNG
sans fin sur la bombe, PNG to ICO muet, Image Metadata en erreur brute exifr, lignes d'état non annoncées) — corrigés
par `bf5f65e2` (borne dans `loadRaster`, partagée par 22 outils d'image) — et deux fois **la mort du navigateur de
test** (mémoire, cas géants quatre à la fois) : le banc note désormais les cas en cours, relance le navigateur et
rejoue ces cas seuls à la fin.

**Préversion finale `onlineconvertools-2zwsdkyvj` (`bf5f65e2`, code de la production)** :

| Banc | Réussis | Échecs | Fin | Dernière ligne |
|---|---|---|---|---|
| dg-chromium | 142 | 0 | 0 | ALL PASS: 142 checks (chromium) |
| dg-firefox | 142 | 0 | 0 | ALL PASS: 142 checks (firefox) |
| dg-webkit | 130 | 0 | 0 | ALL PASS: 130 checks (webkit) |
| dg-chromium-iphone | 186 | 0 | 0 | ALL PASS: 186 checks (chromium [iphone]) |
| dg-webkit-iphone | 172 | 0 | 0 | ALL PASS: 172 checks (webkit [iphone]) |
| dg-webkit-ipad | 172 | 0 | 0 | ALL PASS: 172 checks (webkit [ipad]) |
| pages-chromium | 0 | 0 | 0 | 238 pages opened in chromium: 238 clean, 0 with a problem |
| pages-firefox | 0 | 0 | 0 | 238 pages opened in firefox: 238 clean, 0 with a problem |
| pages-webkit | 0 | 0 | 0 | 238 pages opened in webkit: 238 clean, 0 with a problem |
| pages-webkit-safari16 | 0 | 0 | 0 | 238 pages opened in webkit (Safari 16.4 simulation): 238 clean, 0 with a problem |
| robust-chromium | 522 | 0 | 0 | ALL PASS: 522 checks (chromium) |
| robust-firefox | 512 | 10 | 1 | 10 FAIL, 512 pass (firefox) |
| robust-webkit | 518 | 4 | 1 | 4 FAIL, 518 pass (webkit) |

Les échecs Firefox (10) et WebKit (4) sont des délais du banc sous charge (deux voies de bancs en même temps :
sélecteur de fichier non atteint en 10 s, phrase après 45 s). **Repassés au banc avec 2 pages à la fois** : Firefox,
les 10 outils, tous cas : **43/43** ; WebKit, les 3 outils, tous cas : **15/15**. Vus à la main, chacun donne la
bonne phrase (ex. GIF to MP4 sous WebKit : « Conversion failed: this is not a GIF file (or it is empty)… »).

**Solidité, total** : Chromium 522/522 ; Firefox 512 + 10 repassés ; WebKit 518 + 4 repassés — **tous les outils qui
prennent un fichier (132), jusqu’à 7 cas chacun selon leur type (vide, abîmé, autre type, PDF protégé, géant 900 Mpx, bombe
400 Mpx, vidéo sans son), 3 moteurs**. Avant P23, sur la production d'avant : 8 / 17 / 14 échecs sur 472 cas (sans la
bombe, avec un banc moins exigeant).

## 5. Mise en production

- Repère `restauration-avant-p23-02-10` = `df92da33` (poussé) ; branche `p23-02-10`.
- Préversions `e67mwah3f` (`906e9940`), `o9kndcu5v` (`0899706a`), **`2zwsdkyvj` (`bf5f65e2`)** — bancs du §4.
- **Fusion** `git merge --no-ff p23-02-10` → **`19af4a2b`**, poussée normale (aucune poussée forcée) ; production
  **`onlineconvertools-jg0rho9ri`** Ready. Retour arrière prêt (non utilisé) : promotion de `onlineconvertools-awc0el292`.
- **Sur www** : le nouveau code est servi (Image Cropper : « This file is empty (0 bytes): there is no picture in it… » ;
  Image Pixelator sur la bombe : « This image is 20,000 × 20,000 pixels (400 megapixels): more than a browser can
  process… »), puis :

| Banc | Réussis | Échecs | Fin | Dernière ligne |
|---|---|---|---|---|
| dg-chromium | 142 | 0 | 0 | ALL PASS: 142 checks (chromium) |
| dg-firefox | 142 | 0 | 0 | ALL PASS: 142 checks (firefox) |
| dg-webkit | 130 | 0 | 0 | ALL PASS: 130 checks (webkit) |
| dg-chromium-iphone | 186 | 0 | 0 | ALL PASS: 186 checks (chromium [iphone]) |
| dg-webkit-iphone | 172 | 0 | 0 | ALL PASS: 172 checks (webkit [iphone]) |
| dg-webkit-ipad | 172 | 0 | 0 | ALL PASS: 172 checks (webkit [ipad]) |
| pages-chromium | 0 | 0 | 0 | 238 pages opened in chromium: 238 clean, 0 with a problem |
| pages-firefox | 0 | 0 | 0 | 238 pages opened in firefox: 238 clean, 0 with a problem |
| pages-webkit | 0 | 0 | 0 | 238 pages opened in webkit: 238 clean, 0 with a problem |
| raw-chromium | 38 | 0 | 0 | ALL PASS: 38 checks (chromium; iPhone canvas limit simulated (16.7 MP, page + Workers)) |
| raw-webkit-iphone | 35 | 0 | 0 | ALL PASS: 35 checks (webkit/iphone; deployed wasm in a page Worker) |
| big-chromium-iphone | 9 | 0 | 0 | all passed (chromium iphone) |
| robust-chromium | 522 | 0 | 0 | ALL PASS: 522 checks (chromium) |
| robust-firefox | 514 | 8 | 1 | 8 FAIL, 514 pass (firefox) |
| robust-webkit | 518 | 4 | 1 | 4 FAIL, 518 pass (webkit) |

Repassés seuls (délais du banc sous charge, la phrase arrive) : Firefox 8 outils, tous cas **35/35** ; WebKit
PNG to ICO, PNG to JPG, PDF to PowerPoint, tous cas **14/14**. **Aucun retour arrière.**

## 6. Ce qui reste

- **D2 à refaire après le lancement**, quand il y aura du trafic (même requête `p21-tool_errors-lecture.sql`) ; et
  seuls 24 fichiers remontent leurs erreurs dans `tool_errors` : brancher `reportToolError` partout est un chantier
  à part (aucune donnée ne dit encore qu'il compte).
- Sous charge (plusieurs navigateurs de test à la fois), quelques outils mettent plus de 45 s à afficher leur phrase
  sous Firefox/WebKit (ffmpeg, PDF to PowerPoint par le service) ; seuls, tous répondent. Pas un défaut visiteur.
- Bornes « téléphone » propres à Image Compressor et aux PDF : 268 Mpx partout aujourd'hui (une borne plus basse n'a
  pas été mesurée sur un vrai téléphone) — à mesurer avec le propriétaire (photo Android 108 Mpx, panorama iPhone).
- Champs texte **modifiables** remplis par un gros fichier d'une seule ligne : non mesuré (les sorties à lignes
  courtes sont rapides, mesuré).
