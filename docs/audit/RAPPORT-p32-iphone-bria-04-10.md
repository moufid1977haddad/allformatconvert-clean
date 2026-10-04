# RAPPORT — P32 : deux pannes iPhone restantes + essai BRIA (Background Remover) + interligne arabe

Branche `p32-iphone-bria`, repère de restauration `restauration-avant-p32-04-10` = `39e4ff69`.
**Règle (leçon de P21 et P31)** : rien n'est « corrigé sur iPhone » tant que l'iPhone ne l'a pas confirmé. Les simulations
WebKit de P31 n'avaient reproduit **aucune** des deux pannes ; celles de P32 non plus. Statut maximal ici : **« corrigé, à
confirmer sur iPhone »**.

## 0. Résumé

| Point | Statut | Preuve principale |
|---|---|---|
| 1 PDF to JPG, mode Pages sur iPhone | **corrigé, à confirmer sur iPhone** : bascule automatique vers un rendu serveur (Poppler `pdftoppm`, pdf-tools) si l'appareil n'a pas dessiné la page en 20 s ou a échoué | service 25/25, route 22/22, navigateur WebKit iPhone 13/13, Chromium iPhone 13/13, Chromium bureau 4/4 ; revue de sécurité indépendante (§1f) |
| 1e Autres outils qui rendent des pages | PDF to Image (même composant) et PDF Redact protégés ; OCR, Editor, Sign : rendu non livré, non modifiés | inventaire §1e |
| 2 Image Compressor, panorama 63 Mpx | **corrigé, à confirmer sur iPhone** : cause mesurée (MozJPEG qualité 95 en 4:4:4 dans la page, 1 050 Mio jamais rendus, puis 765 Mio dans le worker) ; réduction dans le worker, un seul encodage, cible 48 Mpx sur téléphone | pic panorama après ≤ référence 48 Mpx (Firefox 953-958 contre 961-963 Mo ; Chromium privée 1 803 contre 1 826) |
| 3 BRIA RMBG 2.0 | **non branché** : pas meilleur sur toutes les photos (mieux 4, égal 6, mixte 9, moins bien 9) ; enlève bien la nappe d'IMG_2433 mais garde le dessous de verre | 29 photos × 3 modèles ; **0,638 $ réservés, ≈ 0,54 $ facturés** sur 1 $ |
| 4 Text to PDF, interligne arabe | pas d'écart propre à l'arabe mesuré (pas fixe 19,20 pt) ; défaut voisin corrigé : l'arabe du service était en DejaVu Sans au lieu de Noto | mesures §4 |

## 1. PDF to JPG — mode « Pages to images » inutilisable sur iPhone

### 1a. Marché
iLovePDF, Smallpdf et PDF24 rendent les pages **sur leurs serveurs** (fichiers supprimés après 2 h, 1 h et 1 h selon
leurs propres pages : [iLovePDF](https://www.ilovepdf.com/blog/files-safe-with-ilovepdf),
[Smallpdf](https://smallpdf.com/blog/is-smallpdf-safe), [PDF24](https://tools.pdf24.org/en/pdf-to-jpg)). Nous gardons
l'appareil en premier (aucun envoi sur ordinateur) et le serveur en secours sur iPhone / iPad seulement.

### 1b. Cause — hypothèses classées (aucune prouvée : aucune simulation ne reproduit la panne)
Faits : pdf.js **5.7.284** (build « legacy »), worker **module** (`pdf.worker.mjs`, `new Worker(…, {type:'module'})`,
Safari ≥ 15) ; P31 a coupé `ImageDecoder` et `OffscreenCanvas` du worker sur Safari / iOS (`app/lib/pdfjs.js`) ; le PDF du
kit = 3 pages A4 (ReportLab), une photo JPEG 1600 × 1200 (DCT) par page, **texte en Helvetica et Helvetica-Bold non
incorporées** (relevé `pdffonts`). Le mode « Extract images » (même document, même worker, même décodeur JPEG) **marche**
sur l'iPhone ; le mode Pages s'arrête au bout de 60 s sur la page 1.

1. **Le chargement de police côté page ne se termine pas sur iOS 26** (le plus cohérent avec l'asymétrie). Pour une
   police non incorporée, pdf.js charge sa police standard (`standard_fonts/`, ajoutée par P24) et la donne à la page ;
   la page crée un `FontFace` à partir des octets et **attend `nativeFontFace.loaded`** avant de résoudre l'objet police
   (`FontLoader.bind`, `pdf.mjs` l. 14 355-14 389 ; `commonObjs.resolve` dans le gestionnaire « Font », l. 22 776-22 793).
   Le **rendu** attend cet objet ; `getOperatorList()` (le mode Extract) **ne l'attend pas**. Si cette promesse ne se
   résout pas sous iOS 26, on obtient exactement : Extract marche, Pages reste sur « Page 1 of 3 ». Non prouvé (aucun
   appareil) ; aucun ticket pdf.js trouvé pour ce cas précis.
2. **Le dessin des images sur le fil principal** (sans OffscreenCanvas depuis P31, les pixels décodés passent en brut puis
   `putImageData` + réductions successives de pdf.js) : coûteux mais borné (2,2 Mpx ici) — peu probable qu'il dure 60 s.
3. **`ImageDecoder` sans délai (hypothèse de P31)** : **écartée pour ce constat** — le décodeur est coupé depuis P31 et la
   panne persiste ; Extract, qui décode les mêmes JPEG, marche.
4. **Itération asynchrone de `ReadableStream` absente avant Safari 27** (cause réelle d'un lecteur pdf.js 6 sur iOS 26,
   [gamma-reader #29](https://github.com/bencode/gamma-reader/pull/29)) : **écartée** — elle touche `getTextContent`, pas le
   rendu canvas, et le site la complète déjà (`app/lib/polyfills.js`, P24).
Tickets pdf.js iOS relus : [#15734](https://github.com/mozilla/pdf.js/issues/15734) (un PDF bloque le rendu sous iOS 16),
[#9053](https://github.com/mozilla/pdf.js/issues/9053) (rendu figé, iOS 10-11), [#19697](https://github.com/mozilla/pdf.js/issues/19697)
et [#19699](https://github.com/mozilla/pdf.js/issues/19699) (iOS 18, chargement), [#11865](https://github.com/mozilla/pdf.js/issues/11865)
(FontFace / iOS) : aucun ne décrit iOS 26 + pdf.js 5.7.
**Visualiseur officiel de pdf.js 5.7.284** (archive `pdfjs-5.7.284-dist.zip` de mozilla/pdf.js, SHA-256 `6d1b8125…db8715`),
même PDF, `scripts/p32/pdfjs-official-viewer.mjs` : **WebKit (agent iPhone) : 3 pages rendues en 2,8 / 3,6 / 4,0 s, aucune
erreur ; Chromium : 1,0 / 1,1 / 1,2 s**. Le WebKit de Playwright n'a ni `ImageDecoder` ni `OffscreenCanvas` et rend sans
peine : la panne est propre au vrai Safari d'iOS 26, d'où le correctif garanti ci-dessous, indépendant de la cause.

### 1c. Correctif garanti — rendu serveur en secours (iOS et iPadOS seulement)
- **Page** (`app/components/PdfToImages.jsx`, `app/lib/serverPageRender.js`) : sur iPhone / iPad (iPadOS compris), chaque
  page a **20 s** pour être dessinée par l'appareil ; à l'expiration ou à l'échec, cette page **et les suivantes** sont
  dessinées par `/api/pdf-render` — **même dpi, même qualité JPEG, mêmes pages**. JPG, PNG et TIFF sont faits par le
  serveur ; WebP et BMP sont encodés dans la page à partir de son PNG. Sur ordinateur : rien ne change (aucun envoi ; le
  message de P31 après 60 s).
- **Avis honnêtes**, au format de celui de Text to PDF (`text-xs text-neutral-600`) : **avant** (iPhone / iPad, mode
  Pages) « On iPhone and iPad, a page your device cannot draw within 20 seconds is drawn by our own PDF service instead:
  your PDF is sent there, then deleted. » ; **après** « This device could not draw pages 1, 2 and 3, so our own PDF service
  drew them: your PDF was sent there, then deleted. » ; chaque ligne porte « drawn by our PDF service ». Échec du service
  aussi : « Page 2 of 3 could not be drawn on this device, and our PDF service could not draw it either: … », les pages
  finies restent proposées.
- **Textes de confidentialité** : description et FAQ de PDF to JPG (« Is my PDF uploaded? » : non sur ordinateur, sur
  iPhone / iPad seulement si…), PDF to Image, PDF Redact, et la politique (`/privacy`, liste « Sent to our own servers ») ;
  plus aucun « the PDF is not uploaded » sans réserve sur ces pages. La garde `privacy-claims` du build est verte.
- **Service** (`services/pdf-tools/src/render.js`, `server.js`) : `POST /v1/render-page` (multipart) et
  `/v1/render-page-staged` (le PDF déjà sur le service média, au-delà de 4 Mo) ; `pdfinfo` (nombre de pages, CropBox) puis
  `pdftoppm -cropbox -r <dpi> -f n -l n -singlefile` (`-jpeg -jpegopt quality=…`, `-png`, `-tiff lzw`) ; aucun shell,
  paramètres validés (page, dpi 36-600, format, qualité 1-100) ; **40 Mpx au plus** par page (au-delà : dpi abaissé et
  dit) ; **4 Mo au plus** en sortie (réponse Vercel ~4,5 Mo : page redessinée plus bas, deux fois au plus, dpi réel
  renvoyé) ; **2 rendus à la fois**, file de 20 s puis 503 ; délai 50 s ; dossier temporaire par requête supprimé sur
  tous les chemins ; journal sans nom de fichier ; `/health` contrôle `pdftoppm` et `pdfinfo` ; image Docker :
  `fonts-urw-base35` (polices standard de Ghostscript, pour les PDF qui n'incorporent pas Helvetica/Times).
- **Route** `/api/pdf-render` (`lib/pdfRender.js`) — **mêmes limites que les autres points d'entrée pdf-tools** : taille
  (corps direct ≤ 4 Mo, sinon envoi en morceaux par le service média, ticket limité par visiteur comme pour Repair / PDF/A
  / Compress, ≤ 44 Mo = `MAX_PDFTOOLS_STAGED_BYTES`, objet `pdf-render` du ticket), une page par requête, **débit par IP**
  300 pages/h et 1 000/jour (`pdf_render`, IP hachée, heure et jour pris ensemble, compté seulement après validation) ;
  configuration absente = 500 avec une phrase (aucun repli silencieux) ; panne du limiteur = 503 (fermé) ; le nom du
  fichier du visiteur n'est pas transmis.

### 1d. Vérifications (locales, construction de production)
- `scripts/p32/render-service.test.mjs` (vrai Poppler) : **25/25** — page 1 du kit en JPG 150 dpi = 1241 × 1754 (186 ms),
  PNG 300 dpi 2481 × 3508, TIFF, qualité appliquée, plafond de pixels, page hors limites (« This PDF has 3 pages »),
  PDF protégé (phrase Unlock), non-PDF, clé absente ou fausse, injection dans `page` refusée, sortie trop lourde → dpi
  abaissé et dit, file pleine → 503, 4 rendus parallèles, aucun dossier temporaire laissé.
- `scripts/p32/pdf-render-route.test.mjs` (vrai service local + faux service média, limiteur en mémoire : **aucun appel
  Supabase**) : **22/22** — chemin direct et chemin en morceaux (deux pages lues sur le même dépôt), refus avant comptage,
  429 heure / jour avec Retry-After, limiteur en panne → 503, non configuré → 500, service injoignable → 502 + alerte,
  réponse non image refusée.
- `scripts/p32/pdf-render-fallback.mjs` (vraie page, vraie route `lib/pdfRender.js` servie par
  `scripts/p32/local-render-route.mjs`, délai de l'appareil forcé à 1 ms par le crochet de test) : **WebKit iPhone 13/13,
  Chromium iPhone 13/13, Chromium bureau 4/4** — 3 JPG par le service (1241 × 1754), avis avant / après, WebP et TIFF,
  panne du service en page 2 (page 1 gardée, bouton libre), Redact (page 2 dessinée par le service, PDF de 3 pages, **plus
  aucun texte en page 2**), rendu normal = 0 appel, Extract = 0 appel, bureau = 0 appel et message de P31.
- Banc P31 `pdf-to-jpg-webkit.mjs` : WebKit 4/4, Chromium 4/4 (rien de cassé).
- Limite : l'interception de Playwright ne transmet pas la partie fichier d'un multipart — d'où le petit serveur de la
  vraie route pour le banc local.

### 1e. Outils qui rendent des pages PDF sur le téléphone (inventaire : `page.render(` dans `app/`)
| Outil | Le rendu est-il le résultat livré ? | P32 |
|---|---|---|
| PDF to JPG | oui (une image par page) | **protégé** |
| PDF to Image (PNG, JPG, WebP, TIFF, BMP) | oui (même composant `PdfToImages`) | **protégé** |
| PDF Redact | oui (la page trouvée est remplacée par son image noircie) | **protégé** : page dessinée par le service (PNG, même densité, rotation remise), noircissement toujours fait dans la page |
| PDF OCR | non (texte reconnu + calque invisible sur les pages d'origine) | non modifié — mais il dépend du même rendu : **à vérifier sur iPhone** (P2) |
| PDF Editor (miniatures, page affichée) | non (PDF refait par pdf-lib) | non modifié |
| PDF Sign (aperçu de placement) | non | non modifié |
| PDF Organize, Compare, Extract Text, to HTML, Translate, AI Summary | pas de `page.render` (texte ou miniatures sans canvas) | — |

### 1f. Revue de sécurité indépendante (sous-agent réviseur, sur `39e4ff69..5a01c99f`) — « GO avec conditions »
Aucune injection (aucun shell, entiers revérifiés des deux côtés, formats en liste fermée, noms de fichiers fixes),
aucune traversée, aucune SSRF (adresse du service média prise de la configuration, jid du ticket signé), aucune confusion
de tickets (rôle, op, jid ; ticket d'un plafond plus grand refusé), nettoyage sur tous les chemins, pas de fuite (phrases
fixes, pas de stderr ni de nom de fichier), déclenchement impossible sur ordinateur, rotation de Redact vérifiée. Tests
rejoués par le réviseur : 25/25 et 22/22. **Appliqué** (commit `34022c61`) :
1. *(condition bloquante)* les méta-descriptions de PDF to JPG et PDF to Image disaient encore « in your browser, no
   upload » → « in your browser on a computer (on iPhone or iPad, a page the device cannot draw is drawn by our PDF
   service, then deleted) » ; FAQ « free » idem.
2. plafond **global** horaire (3 000 pages/h tous visiteurs), pris atomiquement avec l'heure et le jour du visiteur
   (`lib/quota/pdfRenderRateLimit.js`) ;
3. `pdfinfo` dans la même limite de 2 rendus ; **plafond mémoire 1,5 Go par processus Poppler** (`prlimit --as`, Linux),
   contre un JPEG 2000 / JBIG2 qui annoncerait 50 000 × 50 000 pixels ;
4. un refus de clé ou de quota du service (401/403/429) = 500 au visiteur + **alerte** (jamais « Invalid API key ») ;
5. l'avis « your PDF was sent … then deleted » aussi quand le service échoue après l'envoi ;
6. formulaire posté par un autre site (`Sec-Fetch-Site: cross-site`) refusé, sans compter.
Tests après corrections : service 25/25, route **25/25** (+ autre site, clé refusée, plafond global).
**Reporté (P2)** : test d'alignement du noircissement de Redact sur une page dessinée par Poppler avec une police
TrueType non incorporée et une CropBox décalée ; fichier déposé gardé jusqu'au TTL du service média si l'onglet est fermé
en cours ; ticket navigateur de 15 min pour un très long PDF rendu page par page ; confirmation explicite avant envoi
pour Redact (non exigée par le cahier des charges, à décider par le propriétaire).

## 2. Image Compressor — panorama 63 Mpx (sous-agent ; corrigé, à confirmer sur iPhone)

### 2a. Cause (mesurée)
Avec « Reduce to 50 MP then compress », la **page** encodait l'image réduite en JPEG **qualité 95** avec son propre
MozJPEG ; au-dessus de 90, MozJPEG passe en 4:4:4 (`auto_subsample`) et prend **1 050 Mio** de mémoire WebAssembly,
**jamais rendus** tant que la page vit ; puis le worker de compression redécodait ce JPEG et prenait **765 Mio** de plus.
Cohérent avec l'iPhone : l'encodage côté page à « 99 % », puis l'onglet tué à « Compressing… ».

### 2b. Mesures (pic mémoire de l'onglet, Mo ; navigateur neuf par mesure, agent iPhone, plafond de canvas iOS simulé ;
pic Windows du processus de l'onglet, page + workers + WebAssembly : `scripts/p32/compressor-peak-memory.mjs`)
| Chemin | Moteur | Mémoire vive (PeakWorkingSet) | Mémoire privée (PeakPaged) |
|---|---|---|---|
| Photo 48 Mpx, « Compress » (**référence**, passe sur l'iPhone) | Chromium ×3 | 1 389-1 392 | 1 826 |
| idem | Firefox ×4 | 961-963 | 1 076-1 080 |
| Panorama **avant** | Chromium ×4 | 2 524-2 719 | 2 928-3 125 |
| Panorama **avant** | Firefox ×2 | 2 121-2 141 | 2 377-2 403 |
| Panorama **après** | Chromium ×6 | 1 490-1 568 | **1 802-1 803** |
| Panorama **après** | Firefox ×4 | **953-958** | **1 005-1 077** |
Firefox découpe nativement chaque bande au décodage, comme Safari : après correction le panorama est **sous la référence
sur les deux mesures**. Chromium : mémoire privée sous la référence, mémoire vive +7 % (mémoire partagée : Chromium décode
la source entière une fois à cause de son découpage des photos tournées ; Safari ne le fait pas). Mémoire de l'encodeur
(Node, même module et mêmes options, `scripts/p32/mozjpeg-heap.mjs`) : 48 Mpx 748 Mio ; panorama avant 1 050 (page) + 765
(worker) ; **après 738 Mio**. Décompte par le code (chemin WebKit) : 48 Mpx ≈ 934 Mio à l'encodage ; panorama après ≈ 921 ;
avant ≈ 2 200. **Rien n'est mesuré dans WebKit** (pas d'OffscreenCanvas dans le WebKit de Playwright sous Windows : Image
Compressor n'y tourne pas, limite connue).

### 2c. Correctif
- **Réduction dans le worker** (`reduceToRGBA`, `app/lib/reduceImage.js`, même moyenne de surface, bandes de 4 Mpx) : les
  pixels réduits vont **directement** à l'encodeur ; plus de JPEG intermédiaire ni de MozJPEG dans la page ; un seul
  encodage, à la qualité choisie (919 Ko au lieu de 948 : une génération JPEG de moins).
- **Cible réduite sur téléphone : 48 Mpx au lieu de 50** (12 220 × 3 927) : la mémoire de l'encodeur suit le nombre de
  pixels et la seule taille prouvée sur l'iPhone est 48,8 Mpx. Borne affichée inchangée (50 Mpx) ; message « …(48 MP, the
  size of a 48 MP phone photo) first », bouton « Reduce to 48 MP then compress ». Ordinateur : inchangé (140 Mpx).
- **Lots** : un worker neuf avant chaque grande image (> 16,7 Mpx), la mémoire de l'encodeur précédent est rendue.
- Marché : iLoveIMG fait redimensionner puis compresser dans deux outils (relevé P31).

### 2d. Autres outils (« Reduce to … » / avis à la sélection) : seuls JPG to PDF et Image to PDF
| Fichier (JPG to PDF / Image to PDF) | Avant (Firefox / Chromium) | Après | Bilan |
|---|---|---|---|
| Panorama JPEG du kit | 128 / 136 | 128 / 136 | non concerné (JPEG intégré tel quel) |
| Même panorama en PNG 63 Mpx | 846 / 814 | 844 / 811 | non concerné (sous la référence) |
| Même panorama en WebP 63 Mpx (vaut pour HEIC, AVIF, BMP, GIF, JPEG miroirs) | 1 849 / 1 605 | **1 467 / 1 468** | réduit (encodage 4:2:0 q92 des images décodées par bandes, encodeur 1 299 → 939 Mio) mais **encore au-dessus** de la référence (961) |
**Décision du propriétaire** pour ce dernier cas : borne téléphone ~40-48 Mpx pour ces formats (au lieu de 90), ou PDF en
bandes, ou PNG (fichier ~7 fois plus gros) — chacune change le résultat livré. **Serveur libvips** : non nécessaire pour
Image Compressor (le chemin local tient) ; non chiffré.

### 2e. Tests (construction de production locale)
`size-preflight` 6/6 Chromium + 6/6 Firefox ; `e2e-image-compressor` 4/4 × 2 ; `image-compressor-big` 1/1 × 2 ;
`p21-compressor-formats` 3/3 × 2 ; `reduce-unit` 8/8 ; lot iPhone simulé (48 Mpx + panorama + PNG) correct × 2.
Risques : décodage interne d'une bande par WebKit non mesuré ; qualité ≥ 90 sur téléphone = 4:4:4 (≈ 5,4 × la taille RGBA,
vrai aussi pour la photo 48 Mpx, jamais essayé sur l'iPhone) ; aperçu `<img>` du fichier d'origine à 63 Mpx (Safari le
décode probablement réduit, non vérifié).

## 3. Background Remover — essai BRIA RMBG 2.0 via fal (sous-agent ; détail `docs/audit/p32-bg/`)

- **Clé** : `FAL_KEY` présente dans `.env.local` (vérifié par `scripts/p32/fal-env.mjs`, qui n'affiche jamais la valeur ;
  la lecture directe des noms par `grep` est refusée par le garde-fou, comme en P31). Aucune trace de la clé dans les
  fichiers produits (contrôle par programme).
- **Photos** : les 28 cas P21/P31 (alpha de vérité) + **IMG_2433** (présente dans Téléchargements, copiée dans
  `docs/audit/p32-bg/private/`, ignorée par git, jamais commitée). Même copie envoyée aux trois modèles que la page
  (côté long 1024 px, JPEG 0,92), puis la même finition P31 (`app/lib/mattingRefine.js`). IS-Net retrouve les chiffres de
  P31 (fond dans le bord 3,86 % contre 3,90 ; IMG_2433 : 1 842 pixels violets, identique).
- **Licences** : BRIA sur fal — page du modèle « Commercial use with licensed training data »
  ([fal](https://fal.ai/models/fal-ai/bria/background/remove)) ; poids CC BY-NC 4.0
  ([Hugging Face](https://huggingface.co/briaai/RMBG-2.0)) donc auto-hébergement exclu ; aucun texte de BRIA ne nomme fal
  (la mention « Commercial License included » est celle de l'API de BRIA elle-même). BiRefNet v2 sur fal : « Commercial
  use » ([fal](https://fal.ai/models/fal-ai/birefnet/v2/api)), poids MIT.

| Modèle (+ finition P31), moyenne 28 cas | Fond dans le bord | Erreur d'alpha | Voile | Fond gardé | Sujet perdu | Temps / appel | Coût / image |
|---|---|---|---|---|---|---|---|
| IS-Net (actuel) | **3,86 %** | **2,71** | **2,45 %** | **2,25 %** | 0,31 % | 2,08 s (local) | ≈ 0,003 $ (Railway) |
| BRIA RMBG 2.0 (fal) | 7,18 % | 9,29 | 11,85 % | 11,26 % | **0,00 %** | 1,41 s (méd. 1,18, max 3,70) | 0,018 $ |
| BiRefNet v2 Light (fal) | 6,94 % | 7,51 | 8,94 % | 8,45 % | **0,00 %** | 0,73 s | ≤ 0,0006 $ |

- **BRIA nettement meilleur sur toutes les photos ? Non.** Mieux sur 4 (cup__leaf, teacup__green, helmet__violet,
  helmet__green : trous d'aération du casque vraiment détourés), égal sur 6, mixte sur 9, **moins bien sur 9**
  (teacup__leaf/field, china-cup__leaf, cat-fur × 4, cat-short__leaf/field). Défaut principal : BRIA (comme BiRefNet)
  **garde un second objet du fond** (grenouille des fonds « leaf », branche des fonds « field » ; jusqu'à +125 % d'aire sur
  cat-short__leaf) — réserve : ces fonds sont des montages. Avantage : il ne coupe jamais le sujet.
- **IMG_2433** (zone au-dessus du bord de la tasse, 11 535 px) : morceau de nappe opaque **IS-Net 1 419 px (12,3 %)**, BRIA
  **0 px**, BiRefNet **0 px** ; ~420 pixels violets communs aux trois (reflet bleu de la nappe sur l'anse, partie du sujet).
  Mais BRIA et BiRefNet **gardent le dessous de verre noir** (~13 400 px de plus), qu'IS-Net enlève — figure
  `docs/audit/p32-bg/IMG_2433__decoupe-modeles-p32.png` (découpes seules, aucune personne).
- **Décision (3e)** : **rien branché, rien changé**. Option chiffrée pour le propriétaire : BRIA en production = 0,018 $
  par image, **18 $ pour 1 000** (≈ 6 fois IS-Net, ≈ 3 $). Ce qui reste du morceau de fond sur IMG_2433 avec le modèle
  actuel : **1 419 px opaques de nappe + le fil** au-dessus du bord. Piste non mesurée : BRIA en second avis seulement
  quand IS-Net garde un morceau de fond en haut (il faudrait savoir détecter ce cas).
- **Dépense** (registre `docs/audit/depenses-fournisseurs.jsonl`, chantier P32, 58 lignes) : **0,638 $ réservés** (BRIA
  29 × 0,018 = 0,522 $, chaque réponse `x-fal-billable-units: 1` ; BiRefNet 29 × 0,004 $ réservés par prudence pour
  ≤ 21,2 s × 0,0008 $ = **≤ 0,017 $** réels) → **≈ 0,54 $ facturés**, aucun refus, aucune erreur de crédit. L'API d'usage
  de fal répond 403 avec cette clé : le montant n'a pas pu être relu côté fal (à voir au tableau de bord fal).

## 4. Text to PDF — espace sous la ligne arabe (sous-agent)

- **Reproduit** avec « Bonjour / مرحبا بالعالم / Hello / Élodie à Montréal / سلام عليكم ورحمة الله / Dernière ligne » (A4,
  12 pt). Le cas du propriétaire (latin + arabe sans emoji) est mis en page **dans le navigateur** (pdf-lib + Noto,
  `app/lib/textPdf.js`) ; avec un emoji ou une écriture rare, par le service (Gotenberg/Chromium).
- **Mesures** (lignes de base lues par pdf.js, encre par `pdftoppm` à 288 dpi) : navigateur **19,20 pt partout** (1,6 ×
  12) ; service 19,50 / 18,75 en alternance **selon la parité de la ligne, pas l'écriture** (arrondi au pixel de
  Chromium). Le blanc réel sous l'arabe est même **plus petit** (5,25 pt contre 7,5-10,5) car ses lettres descendent plus
  bas ; rien n'est coupé ; l'arabe touche la marge droite (x max = 545,0 = 595 − 50).
- **Cause de l'impression** : très probablement l'alignement — sous une ligne alignée à droite, la ligne suivante est
  alignée à gauche, la largeur sous le texte arabe reste vide ; effet typographique normal, identique dans Word. Le
  défaut classique (`line-height: normal` avec les métriques de Noto Sans Arabic, 2,112 em) n'existe pas chez nous
  (pas fixe) — témoin mesuré sur Gotenberg : 21,75 pt sous l'arabe contre 16,50 avec `normal`. Marché (de mémoire, non
  revérifié) : Word et Google Docs calent l'interligne simple sur la plus grande police de la ligne, une ligne arabe y est
  plus haute.
- **Corrigé au passage** : sur le service, l'arabe et l'hébreu étaient dessinés en **DejaVu Sans** (secours de Chromium),
  contraire à la promesse « polices Noto » ; la liste de polices nomme maintenant Noto Sans Arabic et Noto Sans Hebrew
  (`textToHtmlDocument`, commit `af134abe`) ; même pas après correctif, aucun rognage, emoji compris.
- **Tests** : script de remplacement des bancs `text-to-pdf-*` sur `lib/textPdf.js` (Node + vrai Gotenberg) : 11/11.
  Le sous-agent a joint Gotenberg (`gotenberg-v2`) avec des identifiants lus par la CLI Railway, restés en mémoire
  (lecture seule, aucun déploiement ni réglage Railway touché) — signalé ici tel quel.
- Si le propriétaire voit toujours plus d'espace : capture et texte exact (une ligne vide en trop viendrait d'un retour à
  la ligne).

## 5. Mise en ligne
_(à compléter)_

## 6. Mini-passe iPhone (5 vérifications, fichiers déjà sur l'iPhone)

| # | Page | Fichier | Geste précis | Résultat attendu |
|---|---|---|---|---|
| 1 | PDF to JPG | `kit-iphone-p21/pdf-avec-images.pdf` | Mode « Pages to images », JPG, Normal 150 dpi, High (92), Pages vide → « Convert pages » ; attendre | La phrase grise « On iPhone and iPad, a page your device cannot draw within 20 seconds… » est visible **avant** de toucher. Puis **3 JPG en moins d'une minute** : soit dessinés par le téléphone (aucune mention), soit après ~20 s « Page 1 of 3: drawing it on our PDF service… » puis « This device could not draw pages 1, 2 and 3, so our own PDF service drew them: your PDF was sent there, then deleted. » et chaque ligne « drawn by our PDF service ». Noter lequel des deux (c'est la preuve qui manque sur la cause). **Download** d'une page → `pdf-avec-images-page-1.jpg` dans Téléchargements |
| 2 | PDF Redact | même PDF | Texte à noircir : `photo-2` → « Redact PDF » → Download | Un PDF de 3 pages ; en page 2, « photo-2.jpg » noirci et le reste lisible ; si le téléphone n'a pas dessiné la page, le résumé finit par « …so our own PDF service drew it before the blacking out: your PDF was sent there, then deleted. » |
| 3 | Image Compressor | `kit-iphone-p27/panorama-63mpx.jpg` | Choisir le fichier → message ambre « …reduced to 12,220 × 3,927 (48 MP…) » → « Reduce to 48 MP then compress » | « Reducing to 48 MP… », puis « Compressing… », puis une ligne « 2.0 MB → ~919 KB … reduced from 14000 × 4500 to 12220 × 3927 » avec Download ; **la page ne se recharge pas** |
| 4 | Image Compressor (contre-épreuve) | `kit-iphone-p19/photo-48mpx.jpg` | Choisir → « Compress » | toujours ≈ 501 Ko, sans rechargement |
| 5 | Background Remover + Text to PDF | IMG_2433 (Photos) ; texte collé `Bonjour` / `مرحبا بالعالم` / `Hello` | Remove background → regarder le haut de la tasse ; Text to PDF : A4, 12 pt → Convert → Save / Share → Fichiers, zoomer | Détourage **inchangé** (modèle IS-Net gardé) : le morceau de nappe en haut est encore là — attendu, BRIA non branché. Text to PDF : arabe collé à la marge droite, lignes de base régulières ; si l'espace sous l'arabe paraît encore plus grand, envoyer une capture et le texte exact |
