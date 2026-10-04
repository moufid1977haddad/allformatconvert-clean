# RAPPORT — P31 : correctifs de la passe iPhone (26 tests, 3 octobre) + AJOUT ConvertAPI

Branche `p31-iphone-correctifs`, repère de restauration `restauration-avant-p31-04-10` = `fb2d1db3`.
**Règle de ce rapport (leçon de P21)** : rien n'est « corrigé sur iPhone » tant que l'iPhone ne l'a pas confirmé. Chaque
point ci-dessous est au mieux **« corrigé, à confirmer sur iPhone »**. Les preuves sont des simulations (Playwright :
Chromium, Firefox, WebKit, agent iPhone, tactile), jamais le vrai téléphone.

## 0. Résumé

| Point | Statut | Preuve principale |
|---|---|---|
| 1 Download sur iOS (tests 13, 14, 17, 21) | corrigé, à confirmer sur iPhone | 195 outils sur un seul chemin retypé ; `download-names` 47/47 × Chromium, Firefox, WebKit, WebKit iPhone ; `download-guard` 188 / 188 / 172 / 174 / 174 / 188 ; revue indépendante appliquée |
| 2 M4R `.m4r.html` (test 22) | corrigé, à confirmer sur iPhone | cause établie (404 HTML du site) ; M4R réel (`ftyp`) nommé `memo-vocal.m4r` dans les 3 moteurs ; 69 contrôles de formats |
| 3 PDF to JPG figé (test 20) | corrigé, à confirmer sur iPhone | cause la plus probable dans pdf.js (ImageDecoder sans délai sur Safari) ; garde-fou de délai prouvé ; 2 modes verts en WebKit |
| 4 Background Remover (test 18) | liseré réduit, morceau de fond **non corrigé** (vient du modèle) | 28 cas : fond dans le bord 4,91 → 3,90 % ; aucun modèle meilleur partout ; 0,00 $ |
| 5 Code Formatter (test 16) | corrigé, à confirmer sur iPhone | 13 langages, détection automatique ; 116/116 (Chromium + WebKit) |
| 6 Panorama 63 Mpx (test 26) | corrigé, à confirmer sur iPhone | message à la sélection en 96 ms ; « Réduire à 50 Mpx puis compresser » → JPEG 12 472 × 4 008 |
| 7 Curseur Quality sur PNG | corrigé | factice pour PNG/BMP/GIF/ICO/TIFF → masqué ; réel dans Image Compressor (palette) |
| 8 Affichage tactile (test 23) | corrigé, à confirmer sur iPhone | 239 pages × 390 et 375 px : 0 débordement, 0 cible < 44 px |
| AJOUT ConvertAPI A-E | code fait ; **mesure D sur www non faite** (refusée par le garde-fou, au propriétaire) | 22/22 tests |
| AJOUT F (jeton de `.env.local`) | **non fait** (refusé par le garde-fou) — commande au propriétaire §9 | — |

## 1. Download sur iOS (priorité absolue)

### 1a. Comparaison des chemins (ce qui marchait / ce qui échouait)
Tous les outils passaient déjà par le même composant (`FileDownload`). Sur iPhone, depuis P21, le bouton pointait vers
une adresse du site, `/zipdl/f/<id>/<nom>`, servie par le service worker depuis Cache Storage avec
`Content-Disposition: attachment` **et le vrai type** (`application/pdf`, `image/gif`, `application/zip`…). Lien sans
attribut `download` : c'est une **navigation**.
- GIF, ZIP, M4A : Safari les enregistre malgré tout.
- PDF : Safari 26 sait **afficher** un `application/pdf` et l'a affiché en plein écran (Markdown, Text, JPG, Word to PDF).
- Et quand la requête échappe au service worker (worker arrêté par iOS, gestionnaire de téléchargement qui refait la
  requête), www répond sa **page 404 HTML** (vérifié : `curl` sur `/zipdl/f/…/memo-vocal.m4r` → `404`,
  `Content-Type: text/html`) : c'est exactement `memo-vocal.m4r.html` (point 2).

**Marché** : iLovePDF et Smallpdf livrent le fichier par une réponse de serveur `attachment` (relevé P21) ; pour un
fichier fait dans la page, la technique documentée (FileSaver.js et ses discussions iOS) est le Blob retypé
`application/octet-stream` + attribut `download` : Safari ne sait rien afficher de ce type, il enregistre toujours, sous le
nom donné. (Comparaison reprise de P21 et de la documentation, pas revérifiée en direct ce jour.)

### 1b. Correctif (`app/lib/download.js`, `app/components/FileDownload.jsx`, `IosDownloadBridge.jsx`, `public/zipdl/sw.js`)
- **Download = Blob retypé `application/octet-stream`**, lien avec `download="<nom complet>"`, adresse `blob:` faite dès
  que la ligne apparaît (le toucher n'attend rien), **jamais de navigation**. Même règle sur tous les navigateurs (Firefox
  renommait `.m4r` en `.m4a` d'après le type : le type neutre garde notre nom).
- Un fichier rendu longtemps après le toucher (ZIP de plusieurs fichiers, extraction à la demande) : sur iPhone, bandeau
  « *nom* is ready. **Download** » (cible 44 px) sur un vrai lien, toujours retypé.
- **Save / Share garde le vrai type** (pris de l'extension, `app/lib/mimeTypes.js`) : la feuille de partage d'Apple en a
  besoin. Les aperçus (img, video, audio) gardent leurs propres adresses typées.
- `/zipdl/f/` n'est plus utilisé ; le service worker le garde pour les onglets ouverts avant, en `octet-stream`. Le seul
  usage restant du service worker : le ZIP en flux de Zip Extractor au-delà du plafond en mémoire (`octet-stream` +
  `attachment`), seul cas où un Blob est impossible (plusieurs Go).
- Fichiers venant d'un serveur : les routes renvoient déjà `Content-Disposition: attachment; filename="…"; filename*=UTF-8''…`
  (`lib/contentDisposition.js`) ; la page en fait de toute façon un Blob retypé.

### 1c. Tous les outils — tableau complet en **annexe A** (généré depuis le code, `scripts/p31/download-table.mjs`)
225 outils : **195 corrigés** (tous par `FileDownload` ou `saveBlob`, donc par le même code), **30 sans fichier**
(résultat affiché), **0 à vérifier**. Garde du build : `scripts/check-downloads.js` (inchangé, vert).

### 1d. Vérifications (construction de production locale, `next build && next start`)
- **Nouveau banc `scripts/p31/download-names.mjs`** : vrais outils, nom + octets + format réel + aucune requête `/zipdl/` +
  la page reste sur l'outil, pour **PDF, JPG, PNG, M4R, MP3, MP4, ZIP, DOCX** (le DOCX par Zip Extractor, nom accentué
  « Rapport Élodie.docx ») : **Chromium 47/47, Firefox 47/47, WebKit 47/47, WebKit iPhone 47/47, Chromium iPhone 39/39**.
- `download-guard` (195 outils échantillonnés par catégorie, mis à la règle P31, contrôle du nom et des octets ajouté sur
  bureau) : Chromium 188/188, Firefox 187/188 puis 7/7 au rejeu seul, WebKit 171/172 puis 7/7 au rejeu seul (les deux
  échecs isolés : trois moteurs lancés en parallèle — délai du dialogue « Leave page? » sous charge, onglet fermé), WebKit
  iPhone 174/174, WebKit iPad 174/174, Chromium iPhone 188/188.
- `p21-phase1` mis à la règle P31 : WebKit iPhone 8/8, Chromium iPhone 11/11, Firefox 8/8.
- **Mac Safari, Chrome / Firefox / Edge sur PC, Android** : couverts en simulation par Chromium (= Chrome, Edge,
  Android Chrome), Firefox et WebKit (= moteur de Safari) ; pas de vrais appareils.
- **Trouvé par le banc et corrigé** : ma réécriture de `download.js` par un heredoc bash avait perdu des barres
  obliques dans `derivedName` (« sample.png » → « sample.png.jpg ») ; restauré et testé (`output-formats.test.mjs`).
- Limite Playwright notée : le `click()` de Playwright-Firefox attend une navigation qu'un Blob `octet-stream` n'achève
  pas (le fichier est bien enregistré) — bancs passés en `noWaitAfter`.

### 1e. Revue indépendante (sous-agent réviseur)
Rien de bloquant au-delà de `derivedName`. Appliqué : (1, important) le lien n'offre jamais, même un rendu, l'ancien
fichier sous le nouveau nom — l'adresse retypée est liée au fichier courant et le bouton reste inactif tant qu'elle
n'existe pas ; (2) l'adresse d'un bandeau iOS remplacé est libérée ; (3) seuls les vrais gestes comptent ; (4) « Downloaded »
seulement si le fichier est vraiment livré (bandeau fermé = non) ; (5) le chemin de secours de `sw.js` retypé ; (6)
`download-guard` vérifie nom et octets sur bureau. Non testé en automatique : le bandeau iOS (geste périmé).

## 2. Audio Converter M4R

- **Les octets** : la conversion M4R se fait **dans le navigateur** (ffmpeg.wasm, muxer `ipod`), pas sur Railway. Le banc
  la relit : boîte `ftyp` à l'octet 4, `memo-vocal.m4r`, 115 515 octets, dans les 3 moteurs + iPhone. Le
  `memo-vocal.m4r.html` du téléphone était la **page 404 du site** (§1a) — corrigé par le point 1. **Aucun redéploiement
  Railway nécessaire** (2d non utilisé).
- **Échec bruyant** : toute sortie audio est contrôlée par ses premiers octets avant d'être proposée
  (`audioOutputProblem`, 17 formats) ; une page HTML ou un fichier vide nommé « .m4r » est refusé avec une phrase.
- **MIME** : `m4r` = `audio/mp4` (nom `.m4r` conservé grâce au retypage du lien). Table unique extension → type
  (`app/lib/mimeTypes.js`) et **test unitaire** `scripts/p31/output-formats.test.mjs` (69 contrôles) : chaque format
  proposé par Audio Converter / Booster / Compressor / Splitter, Audio Merger, PDF to images, Barcode Generator, les
  sorties image et Image Converter a un type et une extension corrects.
- **Aide honnête** (sous le choix M4R) : « An iPhone ringtone lasts 40 seconds at most. To install it: on the iPhone,
  with Apple's GarageBand app; on a computer, with the Finder (Mac) or iTunes (Windows) while the iPhone is connected. »
  Marché : CloudConvert propose M4R sans cette aide (relevé P21).

## 3. PDF to JPG figé sur iPhone

- **L'hypothèse du prompt ne tient pas pour ce fichier** : pdf-avec-images.pdf = 3 pages A4 → à 150 dpi, canvas de
  1240 × 1753 (2,2 Mpx, journalisé), loin des 16,7 Mpx. Le code plafonnait déjà la surface.
- **Cause la plus probable (lue dans pdf.js 5.7.284)** : sur Safari (« ni Chrome ni Firefox »), le worker de pdf.js décode
  chaque photo JPEG avec `ImageDecoder` et attend `decoder.decode()` **sans délai** ; la page reste sur « Page 1 of 3… »
  sans erreur si la promesse ne se résout pas. Le WebKit de Playwright n'a ni `ImageDecoder` ni `OffscreenCanvas` : il
  prend le décodeur JPEG de pdf.js, d'où des bancs verts depuis P21. **Non reproduit ici** (pas de vrai Safari) :
  « à confirmer sur iPhone ».
- **Correctifs** : (1) sur Safari / iOS, tout le site demande à pdf.js son décodeur éprouvé
  (`isImageDecoderSupported: false, isOffscreenCanvasSupported: false`, `app/lib/pdfjs.js`) ; (2) **garde-fou de délai**
  par page (60 s) : message clair « Page N of 3 could not be finished on this device… », les pages finies restent
  proposées, le bouton redevient utilisable ; (3) rendu page par page, surface plafonnée sous la limite iOS (iPadOS compris),
  canvas libérés (`width = height = 0`), `toBlob`.
- **Trouvé par le banc et corrigé** : à l'expiration, l'annulation de pdf.js gagnait la course et affichait « Rendering
  cancelled, page 1 » ; le message clair passe désormais en premier.
- **Vérifié** (`scripts/p31/pdf-to-jpg-webkit.mjs`, même PDF) : « Convert pages » 3 JPG (97-106 Ko), « Extract images »
  les 3 photos (1600 × 1200, 1600 × 1600, 1600 × 1200), délai forcé → message clair : **4/4 en WebKit, WebKit iPhone,
  Firefox iPhone**.
- **Généralisation (3c)** : utilitaire partagé `app/lib/canvasLimit.js` (plafond iOS/iPadOS, `fitScale`, `fitSize`,
  `freeCanvas`, `withTimeout`). Les **46 fichiers** qui dessinent sur un canvas :
  - **8 sur `canvasLimit` (P31)** : PdfToImages, PDF OCR (×2 fixe → plafonné), PDF Redact (×2), PDF Editor (hauteur
    libre), Media Player (capture d'une vidéo 8K = 33 Mpx), Video to GIF (8K), `gifFrames` (GIF géant : message au lieu
    d'une image vide), `pdfjs.js`.
  - **19 sur `bigImage` / `imageOutput`** (plafond + bandes depuis P19-P23 : tous les outils image, Background Remover…).
  - **19 bornés par construction** (taille maximale inférieure à 16,7 Mpx) : canvasFilters, glBlur, imageForVision (côté
    max), imageSimilarity (9 × 8), mediaSupport, pdfTextImage (texte), qrRender et QR Generator (≤ 2000²), image-generator
    (1024²), audio-waveform (≤ 3000 × 800), gif-maker et image-to-gif (≤ 1920), png-to-ico (≤ 256), pdf-sign (≤ 3 Mpx),
    barcode-generator (3 fichiers), qr-scanner (≤ 800), video-watermark (texte).

## 4. Background Remover (sous-agent, détail : `docs/audit/p31-bg/`)

- **Liseré** — décontamination des couleurs de bord comme remove.bg / Photoroom : couleurs du sujet et du fond prises aux
  pixels sûrs les plus proches (pull-push), alpha relu dans la bande de transition, puis couleur du sujet résolue par
  I = αF + (1−α)B (Germer et al. 2020, portage du code MIT de pymatting) — pas de rognage du masque
  (`app/lib/mattingRefine.js`). Cause chez nous : P21 moyennait sur ≈ 50 px, alors que le bord de la tasse fait 6 px.
- **Banc de 28 vraies photos** (masque IS-Net réel) : fond resté dans le bord **4,91 → 3,90 %** (baisse dans 27 cas sur
  28), voile 2,90 → 2,60 %, erreur d'alpha 2,79 → 2,78, trous 0,46 → 0,63 % (la seule ligne qui se dégrade, surtout la
  chope en verre). Photo du propriétaire : pixels de couleur de nappe 1951 (P21) → 1842. Temps 12 Mpx : 5,0-5,2 s contre
  6,1-6,3 s. Bancs : `bg-remover-bands` Chromium + WebKit (12, 24, 48 Mpx) verts ; `p21-phase1` partie détourage 5/5.
- **Morceau de fond en haut : non corrigé.** Il vient du modèle IS-Net lui-même ; aucun nettoyage de bord ne peut
  l'enlever. Figure : `docs/audit/p31-bg/IMG_2433__decoupe-www-p31-birefnet.png` (découpe de la tasse seule, aucune
  personne ; la photo d'origine est hors git, `docs/audit/p31-bg/private/`).
- **Modèles comparés (b, c)** — aucune clé payante utilisable sur ce poste (REMOVEBG / OPENAI vides, ni Replicate, ni fal,
  ni BRIA) : **0 appel, 0,00 $**. Comparaison locale seulement :

  | Modèle | IMG_2433 | Banc 28 cas (erreur d'alpha / voile) | Coût | Licence |
  |---|---|---|---|---|
  | IS-Net (actuel) + P31 | morceau de fond gardé, liseré réduit | 2,78 / 2,60 % | Railway ≈ 0,003 $ | Apache-2.0 |
  | BiRefNet-general + P31 | propre (garde aussi le dessous de verre) | 7,79 / 9,24 % (catastrophique sur feuillage) | fal ≈ 0,0008 $/s GPU (non testé) | MIT |
  | BiRefNet-lite + P31 | fil gardé, un peu de violet | 4,68 / 4,25 % | — | MIT |
  | BRIA RMBG 2.0 | non testé | non testé | API fal 0,018 $/image | poids CC BY-NC : **exclus** en auto-hébergement ; API commerciale |
- **Décision (d)** : rien branché (aucun candidat meilleur sur toutes les photos). **Option chiffrée pour le
  propriétaire** : tester BRIA RMBG 2.0 par l'API fal sur les 29 photos ≈ **0,52 $** (compte fal du propriétaire requis) ;
  ne le brancher que s'il bat IS-Net partout (en production ≈ 6 fois le coût actuel par image). Piste gratuite non mesurée :
  IS-Net + BiRefNet et choix par accord des deux (coût Railway ×2).

## 5. Code Formatter (sous-agent)

- **Cause** : JSON était présélectionné ; le JavaScript collé partait dans `JSON.parse` (message brut de Safari).
- **Marché** : codebeautify (une page par langage, pas d'auto-détection, Ln/Col dans l'éditeur) ; freeformatter
  **injoignable le 03/10** (« Domain Not Valid ») ; Prettier playground (choix manuel du parseur, erreur « (3:12) » + extrait —
  décrit de mémoire, la page n'a pas pu être lue).
- **Fait** : 13 langages (JavaScript, TypeScript, JSX, JSON, HTML, XML, CSS, SCSS, LESS, SQL, YAML, Markdown, GraphQL),
  **20 dialectes SQL** ; Prettier 3.9.9 standalone + plugins (MIT), `@prettier/plugin-xml` 3.4.2 (MIT ; dépendances
  Apache-2.0 / MIT), `sql-formatter` 15.9.0 (MIT) ; **chargés au clic** par langage (JS initial de la page : +4 Ko gzip) ;
  **Auto-detect** par défaut + choix manuel ; erreurs « Line 3, column 8: Unexpected token » avec extrait et `^` ; XML
  vérifié par le `DOMParser` du navigateur ; accents et emoji intacts (« Élodie », « Montréal », 🎉, 👋🏽) ; textes et
  métadonnées mis à jour, outil non renommé.
- **Tests** : `code-formatter-lib` 49/49 ; page réelle **Chromium 58/58 + WebKit 58/58** (rejoué sur le build fusionné).
- Limites : détection heuristique (cas ambigus → message « choose it in the Language list ») ; Prettier impose son style
  (la FAQ le dit) ; un HTML mal formé est refusé avec position (l'ancien moteur le reformatait sans rien dire).

## 6. Image Compressor — panorama 63 Mpx

- **Cause** : P27 ne lisait la taille qu'au clic sur « Compress ». Désormais lue dans l'**en-tête** dès la sélection
  (sans décoder) ; message **au-dessus du bouton** : « panorama-63mpx.jpg is 14,000 × 4,500 pixels (63 megapixels): on a
  phone the limit is 50 megapixels… It can be reduced to 12,472 × 4,008 (50 MP) first. »
- **« Reduce to 50 MP then compress »** en un geste (le marché, iLoveIMG, fait redimensionner puis compresser dans deux
  outils séparés) : lecture par bandes (jamais plus de 4 Mpx décodés, compatible plafond iOS), moyenne de surface, puis la
  compression habituelle ; la ligne dit « reduced from 14000 × 4500 to 12472 × 4008 ».
- **Vérifié** (`scripts/p31/size-preflight.mjs`, iPhone simulé, Chromium et Firefox) : message en **96 ms** après la
  sélection, au-dessus du bouton ; résultat **JPEG réel 12 472 × 4 008** (0,95 Mo < 1,97 Mo). 6/6 × 2 moteurs. (WebKit de
  Playwright : pas d'OffscreenCanvas, Image Compressor n'y tourne pas — limite connue depuis P21.)
- **Outils P27 alignés (6c)** : JPG to PDF et Image to PDF nomment eux aussi dès la sélection une image au-dessus de leur
  borne (90 Mpx sur téléphone) — vérifié avec un PNG de 10 000 × 10 000 (2/2).

## 7. Image Converter — curseur Quality sur PNG

- **Mesure** : la mesure en octets sur www (10 % puis 100 % en PNG) a été **refusée par le garde-fou** de cette session ;
  preuve par le code : la branche PNG d'`encodeRaster` (`imageConverter.worker.js`) ne reçoit pas la qualité, et BMP, GIF,
  ICO, TIFF non plus (`extraFormats.js`). Le curseur était **factice** pour ces 5 sorties → **masqué** (phrase « PNG has
  no quality setting here: it is written without loss »), affiché pour JPG, WebP, AVIF et PDF (photos sans transparence).
  Marché : CloudConvert et Convertio ne montrent la qualité que pour les formats avec perte (connaissance des sites, non
  revérifiée en direct).
- **Autres outils image (7c)** : Image Resizer et Video Screenshot masquaient déjà le curseur pour PNG ; **Image
  Compressor** l'utilise vraiment pour PNG (palette) — mesuré en local : 108 octets à 10 %, 1 383 à 100 %, octets
  différents ; libellé déjà honnête (« 100 %: lossless »). Les outils « vers JPG / vers WebP » sont avec perte.

## 8. Affichage tactile (sous-agent)

- `scripts/p31/layout-iphone.mjs` : WebKit, isMobile, tactile, agent iPhone, ×3, **239 pages** (accueil, /tools, 12
  catégories, 225 outils), état vierge + « fichier chargé » sur 131 outils (aucun appel serveur, aucun bouton pressé).
- **Avant** : 390 px — 5 débordements, 3 cibles < 44 px, barre de navigation sur 239 pages (4 éléments) ; 375 px — 6 et 3.
  **Après (rejoué sur le build fusionné)** : **0 débordement, 0 cible trop petite, 0 dans la barre, aux deux tailles**
  (1 898 et 1 869 cibles mesurées).
- Corrections : liste « Encoding » des outils CSV (`CsvReadOptions`), Image to Base64, message d'Audio Waveform
  (`break-words`), case de page de PDF Editor (12 px → zone de 44 px), zone de toucher des ✕ sur vignette (40 → 44 px),
  classe `.touch-hit` pour le logo, Menu, Recherche et Sign In de la barre (aspect inchangé).
- Limites : WebKit de Playwright sous Windows n'a pas d'`AudioContext` (réglages des outils audio non mesurés après
  chargement) ; écrans de résultat et menu mobile ouvert non mesurés.

## 9. AJOUT ConvertAPI (A à F)

- **A Compteur** : renouvellement le **3** (le code disait le 4) ; période 03/10 → 03/11 démarrée à **6** conversions
  (`CONVERTAPI_PLAN_BASELINE`, relevé du 03/10 23 h 08 UTC) ajoutées au compte du site avant les seuils, pour cette période
  seulement (rien d'écrit dans Supabase) ; seuils 50/80/100 % inchangés ; testé (alerte 50 % exactement à 500). Pas de
  double compte : l'ancien code rangeait les conversions jusqu'au 03/10 23 h 59 UTC dans la période précédente.
- **B Coût réel** : ConvertAPI renvoie `ConversionCost` ([conditions](https://www.convertapi.com/terms)) et le site
  l'additionnait déjà depuis P30 ; jamais mesuré autre chose que 1, même à 148 Mio ou 204 s : **ni la taille ni la durée ne
  changent le coût**. Fait nouveau des conditions : « A conversion request is counted whether or not the conversion
  succeeds » — cohérent avec le tableau de bord (9 échecs comptés = 9 réponses HTTP 500 vues par Vercel ; les 2 refus 403
  « plus de crédit » non comptés). Le site compte désormais 1 (ou `ConversionCost`) pour une requête traitée puis échouée
  (500, 400, 415…), rien pour 401/402/403/429/503.
  **Fin de l'essai (119 conversions sur 250)** : les hypothèses « conversions longues comptées plusieurs fois »,
  « plusieurs fichiers », « secondes » sont écartées (`ConversionCost` = 1) ; les échecs comptés n'expliquent que 9. Cause la
  plus cohérente : **l'essai de 250 conversions expire au bout de 30 jours** (premier usage le 03/09, refus le 02-03/10) —
  source : l'article d'aide ConvertAPI « How to create a free account? », lu par l'index de recherche (le site d'aide était
  injoignable) ; **à confirmer par le propriétaire** (date d'ouverture du compte au tableau de bord).
- **C Correction P30** : « ≈ 157 conversions hors du site » était faux ; rapport P30 §1 et §8 et le plan corrigés avec les
  faits du tableau de bord (aucune adresse IP écrite).
- **D Une conversion simultanée** : avant P31, un 503 « No available conversion PODs » (la limite du forfait) faisait
  basculer Word to PDF sur LibreOffice pour rien et afficher « temporarily unavailable » aux PDF to Word/Excel/PowerPoint.
  Désormais **file d'attente côté serveur** : la requête attend son tour (3, 5, 10, 15 s…, Retry-After respecté, au plus
  60 s pour un petit fichier, 10 s à 100 Mio, sous les 300 s de la fonction), puis seulement message « … is busy converting
  other files right now and yours could not start in time. Please try again in a minute. » (Word to PDF et Merge PDF, qui
  annoncent le secours : LibreOffice après l'attente seulement). Tests : deux visiteurs simultanés face à un ConvertAPI
  simulé à une conversion à la fois reçoivent tous deux leur fichier (10 tests). **La mesure réelle sur www (2 requêtes
  parallèles, avant et après) a été refusée par le garde-fou de cette session** (« transaction réelle ») : **0 conversion
  du forfait dépensée par P31**. Commandes pour le propriétaire :
  `node scripts/p31/convertapi-concurrency.mjs --label=before --go` (avant tout redéploiement — production actuelle — ou
  directement `--label=after --go` puisque P31 est en ligne), puis `vercel logs <déploiement> | grep "\[convertapi\]"`.
  Attendu après P31 : deux PDF `engine=convertapi`, le second plus lent de quelques secondes ; tableau de bord +2. Budget
  `p31-convertapi` : 10 conversions, le script refuse au-delà.
- **E 200 Mo** : aucun des 4 outils n'annonce plus de 100 Mo (Word to PDF 100, PDF to Word/Excel/PowerPoint 99) ; refus
  avant l'envoi déjà en place. **Défaut trouvé et corrigé** : Merge PDF n'examinait pas la taille des fichiers Office avant
  l'envoi (le serveur refusait après) — désormais avant (100 Mo par document, 60 Mo par tableur). Test des constantes.
- **F** : la suppression de la ligne `CONVERTAPI_TOKEN` de `.env.local` a été **refusée deux fois par le garde-fou** (même
  en commande minimale) ; rien n'a été affiché. **À faire par le propriétaire** dans ce terminal :
  `! sed -i '/^CONVERTAPI_TOKEN=/d' .env.local` puis `! grep -c '^CONVERTAPI_TOKEN=' .env.local` (attendu : 0).

## 10. Incidents de la session (dits tels quels)
- Mon `npm ci` (pour installer Prettier) a **vidé `node_modules`** du dépôt principal avant d'échouer (fichier verrouillé
  par un serveur local) ; deux sous-agents l'utilisaient par jonction. Restauré par `npm install` ; bancs rejoués ensuite.
- Deux pertes de barres obliques par heredoc bash (`derivedName`, et une écriture de banc) — piège déjà noté en P29 ;
  trouvées par les bancs, corrigées. Les nouveaux fichiers sont écrits par l'outil d'écriture, plus par heredoc.
- `git add -A scripts` a embarqué deux bancs d'avant cette session restés hors git (`scripts/p28/repair-page.mjs`,
  `scripts/p29/md-text-www.mjs`) : relus, aucun secret, gardés.
- Bancs anciens mis à la règle du lien retypé (p21-phase1, www-light, p22-raw, lots P24/P26/P27) : ils lisaient l'adresse
  du lien dès son apparition.

## 11. Mise en ligne
- **Bancs lourds en local** sur la construction de production (`next build && next start`) : §1-§8 (tous rejoués sur le
  build fusionné final).
- **Préversion, une seule fois** : `onlineconvertools-8gra58vj4` (commit `231e71b6`), par `vercel-preview-proxy` (jeton
  frais en mémoire) : `download-names` Chromium 47/47, Firefox 47/47, WebKit iPhone 47/47 ; **Markdown to PDF et Text to PDF
  par le vrai Gotenberg** : Chromium 14/14, WebKit iPhone 7/7 ; PDF to JPG WebKit iPhone 4/4 ; taille (panorama + PDF)
  Chromium iPhone 6/6. (Seule erreur vue : `navigator.storage.persisted` levée par la barre d'outils Vercel des préversions
  dans WebKit — absente de www, pas notre code ; bloquée par `--no-vercel-toolbar`.)
- **Production** : fusion `4b74d592` (code identique au commit testé sur la préversion, vérifié par `merge-stage.sh`),
  déploiement **`onlineconvertools-ooe79sko9`** prêt le 04/10 vers 02 h 30 UTC. Contrôle léger sur www : **29/29** ; un
  téléchargement réel par le nouveau chemin (JPG to PDF, WebKit iPhone) : **6/6**. Aucune régression, **aucun retour
  arrière**. Retour arrière possible : promouvoir `onlineconvertools-osaer8a95` (= `9f6ecfda`, P30).
- Dépenses P31 : **0 $** (aucune conversion ConvertAPI, aucun appel de détourage payant, aucun redéploiement Railway).

## 12. Mini-passe iPhone (10 vérifications au plus)

| # | Page | Fichier du kit | Geste | Attendu |
|---|---|---|---|---|
| 1 | Markdown to PDF (13) et Text to PDF (14) | — (coller un texte) | Paste Text → « Convert to PDF » → **Download** | iOS demande « Télécharger ? » ; le PDF arrive dans Fichiers › Téléchargements sous son nom ; **aucun** affichage plein écran |
| 2 | JPG to PDF (17) | `kit-iphone-p21/photo-1.jpg` (puis une photo de la pellicule) | Convert to PDF → **Download** | même attendu que 1 ; puis **Save / Share** ouvre la feuille de partage avec « Enregistrer dans Fichiers » |
| 3 | Word to PDF (21) | `kit-iphone-p21/doc-test.odt` puis `doc-test.rtf` | Convert → **Download** | PDF enregistré dans Téléchargements, nom `doc-test.pdf` |
| 4 | Audio Converter (22) | `kit-iphone-p19/memo-vocal.m4a` | Format M4R, 256 kbit/s → Convert → **Download** | `memo-vocal.m4r` (pas `.html`) dans Téléchargements, lisible dans Fichiers ; la ligne d'aide « 40 seconds… GarageBand… » est visible |
| 5 | PDF to JPG (20 a) | `kit-iphone-p21/pdf-avec-images.pdf` | « Convert pages » | 3 JPG en moins d'une minute (ou, au pire, un **message** « could not be finished », jamais un écran figé) |
| 6 | PDF to JPG (20 b) | même fichier | Mode « Extract images » → « Extract images » | les 3 photos (1600 px de large) |
| 7 | Background Remover (18) | photo de la tasse (pellicule, IMG_2433) | Remove background → Download | liseré violet moins visible sur le bord ; **le morceau de nappe en haut est encore là (attendu, non corrigé)** ; noter le temps |
| 8 | Code Formatter (16) | — (taper `const nom = "Élodie"; const ville = "Montréal";`) | Language « Auto-detect » → Format | mis en forme comme JavaScript, accents intacts, statut « Formatted as JavaScript (detected) » |
| 9 | Image Compressor (26) | `kit-iphone-p27/panorama-63mpx.jpg` | choisir le fichier, **ne rien toucher** | message des 63 Mpx **avant** le bouton ; puis « Reduce to 50 MP then compress » → un JPEG de 12 472 × 4 008 |
| 10 | Image Converter + une page CSV | `kit-iphone-p21/photo-2.jpg` ; `kit-iphone-p21/photo-renommee.csv` dans CSV to JSON | Image Converter : format PNG ; CSV to JSON : choisir le fichier | pas de curseur Quality pour PNG (phrase « no quality setting ») ; aucune page ne défile de côté, boutons faciles à toucher |

## Annexe A — outil → chemin de téléchargement → corrigé
_(généré par `node scripts/p31/download-table.mjs`, copie de `docs/audit/p31-tableau-telechargements.md`)_
| Outil | Chemin de téléchargement | Corrigé (retypé octet-stream + download) |
|---|---|---|
| ai-tools/ai-chatbot | no file made (result on the page) | — |
| ai-tools/ai-detector | no file made (result on the page) | — |
| ai-tools/ai-paraphraser | TextDownload → FileDownload | yes |
| ai-tools/ai-translator | TextDownload → FileDownload | yes |
| ai-tools/ai-writer | TextDownload → FileDownload | yes |
| ai-tools/audio-transcriber | TranscriptExports → FileDownload | yes |
| ai-tools/background-remover | FileDownload | yes |
| ai-tools/data-extractor | TextDownload → FileDownload | yes |
| ai-tools/email-generator | TextDownload → FileDownload | yes |
| ai-tools/grammar-fixer | TextDownload → FileDownload | yes |
| ai-tools/image-captioner | TextDownload → FileDownload | yes |
| ai-tools/image-generator | DownloadGroup (ZIP: saveBlob) + FileDownload | yes |
| ai-tools/image-upscaler | FileDownload | yes |
| ai-tools/keyword-extractor | TextDownload → FileDownload | yes |
| ai-tools/sentiment-analyzer | TextDownload → FileDownload | yes |
| ai-tools/text-summarizer | TextDownload → FileDownload | yes |
| audio-tools/audio-booster | FileDownload | yes |
| audio-tools/audio-compressor | FileDownload | yes |
| audio-tools/audio-converter | FileDownload | yes |
| audio-tools/audio-equalizer | FileDownload | yes |
| audio-tools/audio-merger | FileDownload | yes |
| audio-tools/audio-metadata | MediaInfo → FileDownload | yes |
| audio-tools/audio-splitter | DownloadGroup (ZIP: saveBlob) + FileDownload | yes |
| audio-tools/audio-to-text | TextDownload → FileDownload + TranscriptExports → FileDownload | yes |
| audio-tools/audio-trimmer | FileDownload | yes |
| audio-tools/audio-waveform | saveBlob | yes |
| audio-tools/voice-recorder | DownloadGroup (ZIP: saveBlob) + FileDownload | yes |
| converter-tools/color-converter | no file made (result on the page) | — |
| converter-tools/currency-converter | TextDownload → FileDownload | yes |
| converter-tools/mobi-to-epub | FileDownload | yes |
| converter-tools/unit-converter | no file made (result on the page) | — |
| developer-tools/api-tester | no file made (result on the page) | — |
| developer-tools/aspect-ratio | no file made (result on the page) | — |
| developer-tools/base64-encoder | TextDownload → FileDownload | yes |
| developer-tools/code-formatter | TextDownload → FileDownload | yes |
| developer-tools/code-minifier | TextDownload → FileDownload | yes |
| developer-tools/color-picker | no file made (result on the page) | — |
| developer-tools/cron-expression | no file made (result on the page) | — |
| developer-tools/cron-expression-builder | no file made (result on the page) | — |
| developer-tools/css-formatter | TextDownload → FileDownload | yes |
| developer-tools/csv-to-excel | DownloadReady → FileDownload | yes |
| developer-tools/csv-to-json | DownloadReady → FileDownload | yes |
| developer-tools/csv-to-sql | DownloadReady → FileDownload | yes |
| developer-tools/csv-to-tsv | TextDownload → FileDownload | yes |
| developer-tools/diff-viewer | no file made (result on the page) | — |
| developer-tools/env-to-json | TextDownload → FileDownload | yes |
| developer-tools/excel-to-csv | DownloadReady → FileDownload | yes |
| developer-tools/excel-to-json | DownloadReady → FileDownload | yes |
| developer-tools/hash-generator | TextDownload → FileDownload | yes |
| developer-tools/hex-to-text | TextDownload → FileDownload | yes |
| developer-tools/html-encoder | TextDownload → FileDownload | yes |
| developer-tools/html-entity-decoder | TextDownload → FileDownload | yes |
| developer-tools/html-formatter | TextDownload → FileDownload | yes |
| developer-tools/javascript-formatter | TextDownload → FileDownload | yes |
| developer-tools/js-minifier | TextDownload → FileDownload | yes |
| developer-tools/json-formatter | TextDownload → FileDownload | yes |
| developer-tools/json-minifier | TextDownload → FileDownload | yes |
| developer-tools/json-to-csharp | TextDownload → FileDownload | yes |
| developer-tools/json-to-csv | TextDownload → FileDownload | yes |
| developer-tools/json-to-go | TextDownload → FileDownload | yes |
| developer-tools/json-to-php | TextDownload → FileDownload | yes |
| developer-tools/json-to-python | TextDownload → FileDownload | yes |
| developer-tools/json-to-rust | TextDownload → FileDownload | yes |
| developer-tools/json-to-toml | TextDownload → FileDownload | yes |
| developer-tools/json-to-typescript | TextDownload → FileDownload | yes |
| developer-tools/json-to-xml | TextDownload → FileDownload | yes |
| developer-tools/json-to-yaml | TextDownload → FileDownload | yes |
| developer-tools/jwt-decoder | no file made (result on the page) | — |
| developer-tools/markdown-editor | DownloadGroup (ZIP: saveBlob) + TextDownload → FileDownload | yes |
| developer-tools/markdown-previewer | DownloadGroup (ZIP: saveBlob) + TextDownload → FileDownload | yes |
| developer-tools/markdown-to-html | TextDownload → FileDownload | yes |
| developer-tools/number-base-converter | no file made (result on the page) | — |
| developer-tools/password-generator | no file made (result on the page) | — |
| developer-tools/regex-tester | TextDownload → FileDownload | yes |
| developer-tools/scss-to-css | TextDownload → FileDownload | yes |
| developer-tools/sql-formatter | TextDownload → FileDownload | yes |
| developer-tools/sql-to-csv | TextDownload → FileDownload | yes |
| developer-tools/timestamp-converter | no file made (result on the page) | — |
| developer-tools/toml-to-json | TextDownload → FileDownload | yes |
| developer-tools/tsv-to-csv | TextDownload → FileDownload | yes |
| developer-tools/typescript-to-js | TextDownload → FileDownload | yes |
| developer-tools/unicode-converter | TextDownload → FileDownload | yes |
| developer-tools/url-encoder | TextDownload → FileDownload | yes |
| developer-tools/url-parser | no file made (result on the page) | — |
| developer-tools/uuid-generator | TextDownload → FileDownload | yes |
| developer-tools/xml-formatter | TextDownload → FileDownload | yes |
| developer-tools/xml-to-json | TextDownload → FileDownload | yes |
| developer-tools/yaml-to-json | TextDownload → FileDownload | yes |
| file-tools/base64-encoder | FileDownload | yes |
| file-tools/file-comparator | no file made (result on the page) | — |
| file-tools/file-converter | FileDownload | yes |
| file-tools/file-encryptor | FileDownload | yes |
| file-tools/file-metadata | no file made (result on the page) | — |
| file-tools/file-splitter | DownloadGroup (ZIP: saveBlob) + FileDownload | yes |
| file-tools/tar-extractor | DownloadGroup (ZIP: saveBlob) + FileDownload | yes |
| file-tools/zip-creator | FileDownload | yes |
| file-tools/zip-extractor | saveBlob + streamDownload (service worker, octet-stream + attachment, ZIP > in-memory cap) | yes |
| gif-tools/apng-to-gif | FileDownload | yes |
| gif-tools/avi-to-gif | GifFromVideoTool → MediaServiceTool → FileDownload | yes |
| gif-tools/gif-compressor | FileDownload | yes |
| gif-tools/gif-maker | FileDownload | yes |
| gif-tools/gif-to-apng | FileDownload | yes |
| gif-tools/gif-to-mp4 | FileDownload | yes |
| gif-tools/image-to-gif | FileDownload | yes |
| gif-tools/mov-to-gif | GifFromVideoTool → MediaServiceTool → FileDownload | yes |
| gif-tools/mp4-to-gif | GifFromVideoTool → MediaServiceTool → FileDownload | yes |
| gif-tools/video-to-gif | GifFromVideoTool → MediaServiceTool → FileDownload | yes |
| gif-tools/webm-to-gif | GifFromVideoTool → MediaServiceTool → FileDownload | yes |
| image-tools/add-border-to-image | FileDownload | yes |
| image-tools/add-noise | FileDownload | yes |
| image-tools/add-text-to-image | FileDownload | yes |
| image-tools/add-vignette | FileDownload | yes |
| image-tools/bmp-to-png | FileDownload | yes |
| image-tools/brightness-contrast | FileDownload | yes |
| image-tools/duplicate-image-finder | no file made (result on the page) | — |
| image-tools/gif-to-png | FileDownload | yes |
| image-tools/grayscale-converter | FileDownload | yes |
| image-tools/heic-to-jpg | FileDownload | yes |
| image-tools/heic-to-png | FileDownload | yes |
| image-tools/ico-to-png | DownloadGroup (ZIP: saveBlob) + FileDownload | yes |
| image-tools/image-blur | FileDownload | yes |
| image-tools/image-comparison | FileDownload | yes |
| image-tools/image-compressor | DownloadGroup (ZIP: saveBlob) + FileDownload | yes |
| image-tools/image-converter | DownloadGroup (ZIP: saveBlob) + FileDownload | yes |
| image-tools/image-cropper | FileDownload | yes |
| image-tools/image-editor | FileDownload | yes |
| image-tools/image-flip | FileDownload | yes |
| image-tools/image-inverter | FileDownload | yes |
| image-tools/image-metadata | FileDownload | yes |
| image-tools/image-pixelator | FileDownload | yes |
| image-tools/image-resizer | FileDownload | yes |
| image-tools/image-rotate | FileDownload | yes |
| image-tools/image-to-base64 | TextDownload → FileDownload | yes |
| image-tools/jpg-to-png | FileDownload | yes |
| image-tools/jpg-to-webp | FileDownload | yes |
| image-tools/png-to-ico | FileDownload | yes |
| image-tools/png-to-jpg | FileDownload | yes |
| image-tools/png-to-webp | FileDownload | yes |
| image-tools/round-corners | FileDownload | yes |
| image-tools/sepia-filter | FileDownload | yes |
| image-tools/svg-to-png | FileDownload | yes |
| image-tools/tiff-to-jpg | FileDownload | yes |
| image-tools/tiff-to-png | FileDownload | yes |
| image-tools/webp-to-jpg | FileDownload | yes |
| image-tools/webp-to-png | FileDownload | yes |
| math-tools/fraction-calculator | no file made (result on the page) | — |
| math-tools/number-base-converter | no file made (result on the page) | — |
| math-tools/percentage-calculator | no file made (result on the page) | — |
| math-tools/roman-numeral-converter | no file made (result on the page) | — |
| math-tools/scientific-calculator | no file made (result on the page) | — |
| math-tools/statistics-calculator | no file made (result on the page) | — |
| pdf-tools/epub-to-pdf | DownloadReady → FileDownload | yes |
| pdf-tools/excel-to-pdf | DownloadReady → FileDownload | yes |
| pdf-tools/html-to-pdf | DownloadReady → FileDownload | yes |
| pdf-tools/image-to-pdf | FileDownload | yes |
| pdf-tools/jpg-to-pdf | FileDownload | yes |
| pdf-tools/markdown-to-pdf | DownloadReady → FileDownload | yes |
| pdf-tools/mobi-to-pdf | DownloadReady → FileDownload | yes |
| pdf-tools/pdf-ai-summary | TextDownload → FileDownload | yes |
| pdf-tools/pdf-compare | no file made (result on the page) | — |
| pdf-tools/pdf-compress | FileDownload | yes |
| pdf-tools/pdf-crop | FileDownload | yes |
| pdf-tools/pdf-delete-pages | FileDownload | yes |
| pdf-tools/pdf-editor | FileDownload | yes |
| pdf-tools/pdf-extract-text | FileDownload | yes |
| pdf-tools/pdf-forms | FileDownload | yes |
| pdf-tools/pdf-merge | FileDownload | yes |
| pdf-tools/pdf-number-pages | FileDownload | yes |
| pdf-tools/pdf-ocr | FileDownload | yes |
| pdf-tools/pdf-organize | FileDownload | yes |
| pdf-tools/pdf-protect | FileDownload | yes |
| pdf-tools/pdf-redact | FileDownload | yes |
| pdf-tools/pdf-reorder-pages | FileDownload | yes |
| pdf-tools/pdf-repair | FileDownload | yes |
| pdf-tools/pdf-rotate | FileDownload | yes |
| pdf-tools/pdf-sign | FileDownload | yes |
| pdf-tools/pdf-split | DownloadGroup (ZIP: saveBlob) + FileDownload | yes |
| pdf-tools/pdf-to-excel | DownloadReady → FileDownload | yes |
| pdf-tools/pdf-to-html | FileDownload | yes |
| pdf-tools/pdf-to-image | PdfToImages → FileDownload | yes |
| pdf-tools/pdf-to-jpg | PdfToImages → FileDownload | yes |
| pdf-tools/pdf-to-pdfa | FileDownload | yes |
| pdf-tools/pdf-to-ppt | DownloadReady → FileDownload | yes |
| pdf-tools/pdf-to-word | DownloadReady → FileDownload | yes |
| pdf-tools/pdf-translate | TextDownload → FileDownload + DownloadReady → FileDownload | yes |
| pdf-tools/pdf-unlock | FileDownload | yes |
| pdf-tools/pdf-watermark | FileDownload | yes |
| pdf-tools/ppt-to-pdf | DownloadReady → FileDownload | yes |
| pdf-tools/text-to-pdf | FileDownload | yes |
| pdf-tools/word-to-pdf | DownloadReady → FileDownload | yes |
| qr-barcodes-tools/barcode-generator | DownloadGroup (ZIP: saveBlob) + FileDownload | yes |
| qr-barcodes-tools/qr-generator | DownloadGroup (ZIP: saveBlob) + FileDownload | yes |
| qr-barcodes-tools/qr-scanner | no file made (result on the page) | — |
| text-tools/ascii-art | TextDownload → FileDownload | yes |
| text-tools/case-converter | TextDownload → FileDownload | yes |
| text-tools/character-counter | no file made (result on the page) | — |
| text-tools/duplicate-remover | TextDownload → FileDownload | yes |
| text-tools/find-replace | TextDownload → FileDownload | yes |
| text-tools/lorem-ipsum | TextDownload → FileDownload | yes |
| text-tools/sticky-notes | no file made (result on the page) | — |
| text-tools/text-comparator | no file made (result on the page) | — |
| text-tools/text-encryptor | TextDownload → FileDownload | yes |
| text-tools/text-repeater | TextDownload → FileDownload | yes |
| text-tools/text-reverser | TextDownload → FileDownload | yes |
| text-tools/text-sorter | TextDownload → FileDownload | yes |
| text-tools/text-to-list | TextDownload → FileDownload | yes |
| text-tools/text-truncator | TextDownload → FileDownload | yes |
| text-tools/url-encoder | TextDownload → FileDownload | yes |
| text-tools/whitespace-remover | TextDownload → FileDownload | yes |
| text-tools/word-counter | no file made (result on the page) | — |
| video-tools/media-player | FileDownload | yes |
| video-tools/screen-recorder | FileDownload | yes |
| video-tools/subtitle-generator | DownloadGroup (ZIP: saveBlob) + TextDownload → FileDownload | yes |
| video-tools/video-compressor | FileDownload + MediaServiceTool → FileDownload | yes |
| video-tools/video-converter | FileDownload + MediaServiceTool → FileDownload | yes |
| video-tools/video-filter | MediaServiceTool → FileDownload | yes |
| video-tools/video-merger | FileDownload | yes |
| video-tools/video-metadata | MediaInfo → FileDownload | yes |
| video-tools/video-resizer | MediaServiceTool → FileDownload | yes |
| video-tools/video-rotator | FileDownload | yes |
| video-tools/video-screenshot | DownloadGroup (ZIP: saveBlob) + FileDownload | yes |
| video-tools/video-to-audio | FileDownload | yes |
| video-tools/video-to-gif | DownloadGroup (ZIP: saveBlob) + FileDownload + GifFromVideoTool → MediaServiceTool → FileDownload | yes |
| video-tools/video-trimmer | FileDownload | yes |
| video-tools/video-watermark | FileDownload | yes |

225 outils : 195 corrigés, 30 sans fichier, 0 à vérifier.
