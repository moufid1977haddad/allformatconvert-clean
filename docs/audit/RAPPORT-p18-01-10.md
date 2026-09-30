# RAPPORT — P18 : prélancement en production, PDF sur Safari 16.4-18, téléchargement unique sur tout le site, Video to GIF, Code Formatter, MOBI de test (01/10)

Travail seul, à la demande du propriétaire (chantier et mises en production demandés). **Aucune poussée forcée.** Aucun
secret lu ni affiché (seuls des noms de variables). Aucun outil supprimé ni renommé. Aucune dépense hors de celle
notifiée (Pangram, étape 7 : voir §7).

## En bref

| Étape | Résultat |
|---|---|
| 1 — prélancement en production | fusion **`61b066d8`**, production `aa2m00i4k` ; www : 238 pages ×3 propres, `prelancement-01-10` ALL PASS ×3 ; **Lighthouse mobile sur www : accueil 61 → 84, pages outils 53-54 → 85-91 (médiane 90)**, accessibilité / bonnes pratiques / SEO 100 ; le même jour iLovePDF 79 / 69 |
| 2 — PDF sur Safari ≤ 18.1 | build **legacy** de PDF.js (page + worker) ; **2ᵉ défaut trouvé** (itération des flux absente avant Safari 26.4 : tous les outils texte PDF) ; polyfills du site ; audit syntaxe + API sur tout le build ; simulation Safari 16.4 dans les bancs. **Plancher garanti : Safari / iOS / iPadOS 16.4** |
| 3 — téléchargement | **un composant** pour **191 outils** (nom, format, taille, Download, ZIP, « Save / Share » iPhone/iPad, question avant de quitter) ; 34 outils sans fichier listés ; **garde de build + banc** ; **Markdown to PDF = vrai PDF** |
| 4 — Video to GIF | fait un **GIF animé** (GIF89a, 30 images, vérifié sur www) ; l'extraction d'images reste en option |
| 4 bis — Text to PDF | **emoji en couleur et toutes les écritures courantes** (bengali, gurmukhi… 24 écritures relues par Poppler), par notre Chromium et les polices Noto (OFL), seulement quand le texte en a besoin, annoncé avant l'envoi |
| 5 — Code Formatter | **non reproduit** (≈ 0,5-0,7 s sous WebKit, même en simulation 16.4) : les 151 s viennent du banc du Mac |
| 6 — MOBI de test | `safari-book.mobi` relu par **KindleUnpack 8/8** ; AZW3 non fabriqué (Calibre requis) |
| Déploiement 2-5 | fusion **`106dbfdf`** (production `cwubuit2i`), puis **`7a13f02c`** (4 bis, production `78ysb2kft`) ; **tout vert sur www, aucun retour arrière** |
| 7 — AI Detector sur www | **non lancé** (fini vers 14 h, avant 20 h) : commande en ligne 2 du tableau de tête ; **0 $ dépensé** |

## 1. Étape 1 — `prelancement-01-10` en production

- Repère **`restauration-avant-prelancement-01-10`** = `04dbd0a2` (poussé). Préversion `onlineconvertools-jw8cuokp9`
  (branche `preview/prelancement-01-10` = `ff4c303e` : la pointe `315b32ca` ne touche que la documentation et aurait
  été annulée par l'`ignoreCommand` de Vercel).
- Bancs sur la préversion (relais local à jeton OIDC en mémoire) :

| Banc | Chromium | Firefox | WebKit |
|---|---|---|---|
| `prelancement-01-10.mjs` | ALL PASS | ALL PASS | ALL PASS (1 erreur de prélecture annulée au rechargement, voir ci-dessous) |
| `all-pages-load.mjs` (238 pages) | 238/238 | 238/238 | 238/238 |
| `seo-pages-29-09.mjs` | 10/10 | 10/10 | 10/10 |
| `pdf-audit-2.mjs` | 31/31 | 31/31 | 31/31 |

- Fusion `git merge --no-ff` → **`61b066d8`**, poussée normale ; production **`onlineconvertools-aa2m00i4k`**, Ready ;
  `<main id="main-content">` servi sur www (preuve que le nouveau code est en ligne).
- **Sur www** : `all-pages-load` **238/238 propres sous Chromium, Firefox et WebKit** ; `prelancement-01-10` ALL PASS
  ×3 moteurs.
- **Écart du banc corrigé (pas du site)** : sous WebKit, le contrôle « Sticky Notes » recharge la page ; les prélectures
  de liens encore en vol sont rejetées par WebKit (« … due to access control checks »), **y compris sur www** : elles
  appartiennent à la page quittée. Le banc ne compte désormais que les erreurs de la page rechargée (ALL PASS sur www).
  Les bancs `prelancement-01-10` et `seo-pages-29-09` acceptent aussi `--no-vercel-toolbar` (barre de commentaires de
  Vercel sur les préversions, qui lève `navigator.storage.persisted` sous WebKit — connue depuis le 28/09).

### Lighthouse mobile sur www (même banc et profil que le 30/09 : Moto G Power émulé, 4G lente simulée, processeur ×4)

Performance (/100) : www avant = 30/09 sur www ; build avant / après = build local du 30/09 (`avant-mobile.json`,
`apres-mobile.json`) ; **www après = 30/09 après la mise en production** (`docs/audit/perf/www-apres-p18-mobile.json`).

| Page | www avant | build avant | build après | **www après** | A11y / BP / SEO | LCP | TBT | CLS | JS |
|---|---|---|---|---|---|---|---|---|---|
| Accueil | 61 | 53 | 86 | **84** | 100 / 100 / 100 | 2,9 s | 448 ms | 0 | 476 Ko |
| PDF Tools (catégorie) | — | 55 | 86 | **90** | 100 / 100 / 100 | 2,9 s | 245 ms | 0 | 557 Ko |
| Image Tools (catégorie) | — | 59 | 87 | **88** | 100 / 100 / 100 | 3,0 s | 307 ms | 0 | 601 Ko |
| Developer Tools (catégorie) | — | 64 | 85 | **89** | 100 / 100 / 100 | 3,0 s | 280 ms | 0 | 552 Ko |
| Image Compressor | 53 | 60 | 83 | **88** | 100 / 100 / 100 | 3,0 s | 309 ms | 0 | 532 Ko |
| PDF Compress | 54 | 54 | 82 | **90** | 100 / 100 / 100 | 3,0 s | 264 ms | 0,011 | 531 Ko |
| PDF Merge | — | 59 | 83 | **90** | 100 / 100 / 100 | 2,9 s | 263 ms | 0,018 | 526 Ko |
| JPG to PNG | — | 49 | 82 | **87** | 100 / 100 / 100 | 2,9 s | 342 ms | 0 | 533 Ko |
| Video Compressor | — | 57 | 83 | **88** | 100 / 100 / 100 | 2,9 s | 305 ms | 0 | 535 Ko |
| JSON Formatter | — | 50 | 77 | **85** | 100 / 100 / 100 | 3,0 s | 384 ms | 0 | 524 Ko |
| QR Generator | — | 59 | 85 | **90** | 100 / 100 / 100 | 2,9 s | 271 ms | 0 | 530 Ko |
| Audio Converter | — | 56 | 77 | **91** | 100 / 100 / 100 | 2,9 s | 234 ms | 0 | 535 Ko |
| Word to PDF | — | 54 | 83 | **89** | 100 / 100 / 100 | 3,0 s | 271 ms | 0 | 530 Ko |
| Percentage Calculator | — | 54 | 86 | **90** | 100 / 100 / 100 | 2,9 s | 257 ms | 0 | 526 Ko |
| iLovePDF, accueil (même jour, mêmes conditions) | 79 | | | **79** | 93 / 100 | 4,5 s | 270 ms | 0 | 270 Ko |
| iLovePDF, Compress PDF | 71 | | | **69** | 83 / 77 | 4,1 s | 660 ms | 0 | 686 Ko |

**Lecture honnête.** Sur www, les pages outils dépassent le build local (85-91 contre 77-86) : le CDN de Vercel sert plus
vite que `next start`, surtout pour le LCP (≈ 2,9 s contre 3,8 s) ; l'accueil perd 2 points (TBT 448 ms, au lieu de
207 en local : Google Analytics et le script du menu, chargés au repos, tombent pendant la mesure). **Au-dessus
d'iLovePDF partout, le même jour** (accueil 84 contre 79, pages outils 85-91 contre 69) ; FreeConvert, 123apps et
TinyWow étaient déjà en dessous le 30/09 (`RAPPORT-prelancement-01-10.md` §2.4).

## 2. Étape 2 — les outils PDF sur Safari 16.4 à 18

**Cause (relue dans le paquet installé, pdfjs-dist 5.7.284).** La build « moderne » de PDF.js appelle, sans
polyfill, `Promise.try` (Safari 18.2), `Promise.withResolvers` (17.4), les méthodes de `Set` (17.0), les aides
d'itérateur (18.4), `Uint8Array.fromBase64`/`toHex` (18.2), `URL.parse` (18.0), `Math.sumPrecise`… — dans la page **et**
dans son worker. Mozilla l'annonce : cibles de la build moderne « Safari >= 18 » (`gulpfile.mjs`, relu le 01/10).

**Choix, par la recherche : la build « legacy » de PDF.js, pas un polyfill maison.** C'est le moyen que Mozilla livre
pour les navigateurs plus anciens (et celui que recommandent react-pdf et les intégrateurs) : Babel + core-js
**embarqués dans la bibliothèque ET dans son worker** — le worker est un espace JavaScript séparé : un polyfill chargé
par la page ne l'atteint jamais, il aurait fallu réécrire le chargement du worker. Relu dans
`legacy/build/pdf.worker.mjs` : `es.promise.try`, `es.promise.with-resolvers`, `es.set.*`, `es.iterator.*`,
`es.uint8-array.*`, `web.url.parse`, `es.math.sum-precise` y sont. Coût : +0,19 Mo pour la page, +0,17 Mo pour le worker,
chargés seulement à l'usage d'un outil PDF. Un seul chargeur pour les 13 outils qui utilisent PDF.js :
`app/lib/pdfjs.js` (Compare, Editor, Extract Text, OCR, Organize, Redact, PDF to HTML, PDF to Image, PDF to JPG, Sign,
AI Summary, Translate, PDF to Excel).

**Deuxième défaut, trouvé par la simulation et non par le Mac : la build legacy seule ne suffisait pas.**
`page.getTextContent()` lit un `ReadableStream` par `for await`, et **Safari n'a l'itération asynchrone des flux qu'à
partir de 26.4** (core-js ne couvre pas les flux ; confirmé par plusieurs correctifs publics « PDF.js getTextContent
Safari »). Tous les outils qui lisent le texte (Extract Text, Compare, Redact, PDF to HTML, OCR, AI Summary, Translate)
auraient encore échoué sur Safari 17 et 18 après le correctif du Mac. Ajouté selon la norme WHATWG (lire jusqu'à la fin,
libérer le verrou, annuler si la boucle est quittée) dans `app/lib/polyfills.js`, seulement si absent.

**Polyfills du site** (`app/lib/polyfills.js`, chargés avant l'interactivité par `instrumentation-client.js`, l'endroit
que documente Next.js pour les polyfills) : `Promise.withResolvers`, `Promise.try`, `Object.groupBy`, `Map.groupBy`,
`URL.canParse`, `URL.parse`, `Blob/Response.bytes()`, itération de `ReadableStream`. Chacun n'est posé que s'il manque.

**Audit de tout le site** (sur le build de production, `.next/static` + `public/`, 412 fichiers) :
- **Syntaxe** (`scripts/compat/check-syntax-es2022.mjs`) : 0 fichier au-delà d'ES2022 (niveau complet de Safari 16.4) —
  **désormais exécuté à la fin de chaque `npm run build`** (le build échoue sinon).
- **API** (`scripts/compat/scan-modern-apis.mjs`, 34 API datées d'après MDN / notes de version WebKit, chaque occurrence
  avec son contexte) : hors PDF.js, toutes les occurrences sont **détectées avant usage** (`requestIdleCallback`,
  `showSaveFilePicker`/`createWritable` du ZIP Extractor, `startViewTransition` de React, `Float16Array` d'onnxruntime,
  `ImageDecoder` de PDF.js), **ou des noms homonymes** (`.bytes()` de l'encodeur GIF, `.union()` de zod/luxon, `toBase64`
  de Supabase), ou **des polyfills core-js eux-mêmes**. Workers audités à part (ils ne reçoivent pas les polyfills de la
  page) : seul celui de PDF.js en avait besoin, couvert par la build legacy ; son `for await` sur un flux de
  décompression est dans un `try/catch` avec repli.
- **Vérifié en exécution** : simulation **Safari 16.4 / iOS 16.4** (`scripts/browser-tests/lib/safari16-sim.mjs`) qui
  **retire** ces API dans la page **et dans chaque Worker** (chaque script de `/_next/static` est réécrit pour commencer
  par les retirer). Contre la production de ce jour (build moderne) : **rouge** (PDF Editor bloqué sur « Reading PDF… »,
  Extract Text et PDF to Image sans résultat) ; contre la branche : **vert** (voir §8).

**Version minimale garantie : Safari 16.4 / iOS 16.4 / iPadOS 16.4** — le plancher de Next.js lui-même
(`node_modules/next/dist/docs/03-architecture/supported-browsers.md`), tenu par : syntaxe ES2022 vérifiée à chaque build,
polyfills ci-dessus, simulation 16.4 dans les bancs. **Prouvé sur un vrai Safari : 17.6 seulement** (le Mac) ; 16.4 est
garanti par le code et la simulation, pas par un appareil.

## 3. Étape 3 — un vrai téléchargement sur chaque outil

**Le moyen des concurrents, relevé** : iLovePDF et Smallpdf montrent, à la fin, un grand bouton « Download » et, pour
plusieurs fichiers, un ZIP ; leur fichier vient d'une réponse serveur « Content-Disposition: attachment » (ce que notre
service worker `/zipdl/` fait déjà sur iOS depuis P15). Sur iPhone, le partage (`navigator.share` avec fichiers, iOS 15+)
ouvre la feuille d'Apple : Enregistrer dans Fichiers, Photos, AirDrop, Mail, WhatsApp.

**Un seul composant pour tout le site : `app/components/FileDownload.jsx`.**
- `FileDownload` : une ligne par fichier — **nom, format, taille**, bouton **« Download »** (lien réel, donc aussi
  « Enregistrer sous » au clic droit) ; sur **iPhone et iPad**, bouton **« Save / Share »** (la feuille de partage reçoit
  le vrai fichier, préparé avant le toucher car la permission du geste ne survit pas à une attente) ; « Downloaded ✓ »
  une fois fait.
- `DownloadGroup` : dès deux fichiers, **« Download all (N files, ZIP) »** (client-zip, noms en double numérotés).
  L'ancien « Download all » d'Image Converter lançait un téléchargement par fichier, ce que Safari iPhone arrête après
  le premier.
- `TextDownload` : un résultat texte offert comme fichier (`.json`, `.csv`, `.ts`, `.sql`, `.txt`…).
- **Avant de quitter la page**, si un fichier affiché n'a été ni téléchargé ni partagé, le navigateur demande
  (`beforeunload`) ; jamais pour un résultat texte encore à l'écran.
- **iPad** : la détection d'iPadOS 13+ (Safari s'y présente comme un Mac : « Macintosh » + `maxTouchPoints > 1`) était
  déjà juste depuis P15 (`app/lib/download.js`, déployé le 30/09 ; le signalement de l'iPad date du 29/09, avant) ; elle
  est maintenant **prouvée** par une simulation iPad (agent « Macintosh », 5 points de contact) : « Save / Share »
  présent, téléchargement par la réponse « attachment » de `/zipdl/`. Les quatre détections iOS du site (téléchargement,
  note iPhone, première image vidéo, agrandisseur) reconnaissent l'iPad.

**Les 225 outils, un par un** (`scripts/check-downloads.js`, exécuté par `npm run build`, qui échoue sinon) :
**191 outils offrent leurs fichiers par ce composant** ; **34 ne produisent aucun fichier** (calculatrices,
compteurs, visionneuses, détecteur d'IA…), chacun listé avec sa raison ; aucune ligne de téléchargement écrite à la
main hors du composant, sauf deux exceptions motivées dans la garde : **ZIP Extractor** (extraction à la demande dans
des archives de plusieurs Go et « Download all » en flux — sa liste montre déjà nom et taille) et **Audio Waveform**
(exporte la vue affichée, zoom compris, au moment où on le demande). Migration : 94 liens convertis par un script
(`scripts/compat/codemod-downloads.mjs`), 59 outils à résultat texte équipés (`codemod-text-downloads.mjs`), le reste à
la main (Split, PDF to Image/JPG, Image Compressor, Image Converter, Audio/File Splitter, TAR Extractor, QR et Barcode
Generator, Video Screenshot, Voice Recorder, Subtitle Generator, Hash Generator, Extract Text, Audio to Text, les
transcriptions TXT/SRT/VTT, rapport JSON des métadonnées, Image Editor : « Save image » prépare la photo en pleine
taille puis la ligne de téléchargement, Image Generator : WebP et PNG).

**Markdown to PDF produit un vrai PDF.** Il n'ouvrait que la boîte d'impression (sur iPhone : aucun fichier ; la page
disait « Use Save as PDF in the print dialog »). Les convertisseurs de référence (markdowntopdf.com, CloudConvert,
l'extension « Markdown PDF » de VS Code) rendent le Markdown en HTML et l'impriment avec un Chromium sans écran : PDF
vectoriel, texte sélectionnable, liens cliquables. Même moyen ici : Markdown → HTML (CommonMark + tableaux GitHub,
`marked`) **nettoyé par DOMPurify dans le navigateur** (aucun script d'un .md ne s'exécute nulle part), puis notre
Chromium (Gotenberg, route déjà utilisée par HTML to PDF), A4, feuille de style type GitHub. Textes, métadonnées et
**politique de confidentialité** mis à jour (l'outil envoie désormais le HTML à notre serveur). Nombre d'outils
entièrement locaux recompté : **174** (51 utilisent un serveur dans au moins un cas ; 173 et 52 après l'étape 4 bis) → le kit Product Hunt passe de
« about 175 » à **« about 170 »** (arrondi par défaut, jamais au-dessus du compte).

**Garde-fou permanent en exécution : `scripts/browser-tests/download-guard.mjs`** — 24 outils de toutes les catégories,
chacun jusqu'à son fichier : lien « Download » **visible**, nom, format et taille affichés, **fichier réel** (premiers
octets du format, taille affichée = taille réelle), ZIP réel pour les lots, question avant de quitter puis plus de
question après téléchargement ; `--device=iphone|ipad` : « Save / Share » remet le vrai fichier à la feuille de partage,
« Download » passe par la réponse « attachment ». Split PDF (le cas de l'iPad : « Done! 1 PDF ») en tête.

## 4. Étape 4 — Video Tools › Video to GIF fait un GIF animé

L'outil capturait des images PNG une à une et ne faisait **aucun GIF** (sa propre FAQ le reconnaissait). Il fait
désormais **un GIF animé** par la voie éprouvée de GIF Tools › Video to GIF (même composant `GifFromVideoTool` :
ffmpeg `palettegen`/`paletteuse`, mise à l'échelle Lanczos, proportions gardées, sur notre service média, comme
ezgif) : début, durée (60 s max), largeur, images/s. **L'extraction d'images reste en option** sous le bouton
(« Or extract frames as PNG images ») : début, 1-15 images/s, 1-10 s, dans le navigateur, chaque image en vrai PNG
(plus de `data:` URL) avec sa ligne de téléchargement, et le ZIP. Nom et adresse de l'outil inchangés ; titre,
description, FAQ et métadonnées réécrits pour dire ce qu'il fait.

## 4 bis. Étape 4 bis (ajoutée en cours) — Text to PDF : emoji et toutes les écritures

**Avant** : « These characters have no glyph in the fonts used (emoji…) », et le bengali refusé (fontkit ne forme pas
ses conjointes). **Le moyen des références** : polices de repli par caractère + mise en forme HarfBuzz (documentation de
fpdf2, « Fonts and Unicode » / « Emojis ») — exactement ce que fait un moteur de navigateur. **Mesuré sur la production
avant de construire** (sonde HTML envoyée à notre Chromium/Gotenberg, lue par Poppler et rendue en image) : ses polices
Noto installées (SIL OFL) couvrent **24 écritures** et **Noto Color Emoji** — emoji en couleur avec teinte de peau,
drapeaux, familles ; bengali, gurmukhi, gujarati, oriya, telugu, kannada, malayalam, cinghalais, birman, khmer, lao,
amharique, géorgien, arménien correctement formés ; chaque caractère relu.

**Fait** (`app/lib/textPdf.js`, page Text to PDF) : le texte que les polices du navigateur savent dessiner (latin,
grec, cyrillique, arabe, hébreu, devanagari, tamoul, thaï, chinois / japonais / coréen) **reste fait dans le
navigateur** comme avant ; un texte avec **emoji ou une autre écriture** est imprimé par notre Chromium (A4, marges et
corps identiques, `dir="auto"` par paragraphe pour l'arabe et l'hébreu, variante CJK choisie selon le texte). La page
**le dit avant l'envoi** ; politique de confidentialité, textes et métadonnées mis à jour. Aucune police ajoutée à la
page ; seuls les glyphes utilisés entrent dans le PDF.

**Vérifié** (`scripts/browser-tests/text-to-pdf-scripts.mjs`, lecture par Poppler, la référence) — préversion **et
www**, Chromium, Firefox, WebKit : la phrase du propriétaire relue **« Hello 👋🏽 world. Élodie à Montréal. বাংলা. 中文.
العربية. »** ; la ligne de 24 écritures + 🇫🇷 ❤️ 🎉 relue en entier ; un texte latin / cyrillique / chinois ne part
vers aucun serveur. (pdf.js rend l'arabe en formes de présentation dans l'ordre visuel et certains idéogrammes en
radicaux : limite de ce lecteur, pas du fichier.) Nombre d'outils entièrement locaux : **173** (« about 170 » reste
exact).

## 5. Étape 5 — Code Formatter, 151 s sur le Mac

**Non reproduit.** Sous WebKit (Playwright), sur www et en local, avec et sans la simulation Safari 16.4
(`scripts/browser-tests/code-formatter-speed.mjs`) : le JSON collé d'un coup, tapé touche par touche comme un « send
keys » de WebDriver, puis tapé avec 20 ms entre les touches — **le formatage répond en ≈ 1 s** (dont l'attente du banc),
le résultat est exact (identifiant à 20 chiffres et `1.10` gardés). Le code du chemin JSON est une simple boucle sur le
texte (`app/lib/jsonText.js`), sans expression régulière, sans import, sans réseau : rien ne peut y prendre des minutes
sur 90 caractères. **Conclusion : les 151 s viennent du banc du Mac** (le temps de saisie ou une attente du script
`tests-safari-scripts`, que je ne peux pas lire depuis ce poste), pas de l'outil. **À faire sur le Mac** : repasser
Code Formatter en relevant séparément le temps de saisie et le temps entre le clic « Format » et le résultat.

## 6. Étape 6 — un vrai MOBI de test

`docs/audit/fixtures-safari/safari-book.mobi` (47 605 octets), fabriqué par `make-safari-mobi.mjs` d'après la
description publique du format (MobileRead : PDB, MOBI, EXTH) : titre et auteur en EXTH, 3 chapitres de texte UTF-8
(accents, guillemets typographiques, euro) répartis sur 3 enregistrements de 4 096 octets comme dans un vrai livre,
gras, italique, liste, une photo JPEG, sauts de page. **Relu par KindleUnpack** (la bibliothèque de référence, paquet
Python `mobi`) : `verify-safari-mobi.py` **8/8** (3 chapitres, 60 paragraphes, caractères exacts, styles, liste, photo
extraite, photo référencée, titre et auteur). Utilisé aussi par `download-guard.mjs` (MOBI to EPUB : EPUB réel).
**AZW3 : non fabriqué.** Le seul écrivain AZW3 maintenu est Calibre (KindleGen d'Amazon est abandonné) ; l'installer
sur ce poste sort du cadre (logiciel à télécharger et exécuter). Commande pour le Mac si Calibre y est :
`ebook-convert safari-book.mobi safari-book.azw3`, puis relire avec `python verify-safari-mobi.py safari-book.azw3`.

## 7. Étape 7 — vérification AI Detector sur www

**Non lancée** : ce chantier s'est terminé vers 14 h (heure de ce poste), avant 20 h 00 (00 h 00 UTC). **Aucune dépense
Pangram.** La commande reste en ligne 2 du tableau de tête du plan, pour le propriétaire :
`node scripts/ai-detector/www-check-p17.mjs` (dans le dossier du dépôt, après 20 h ; attendu « RESULT: both verdicts
right » ; code 2 = limite du jour pas encore remise à zéro, rien facturé).

## 8. Déploiement des étapes 2 à 5 (et 4 bis)

**Étapes 2 à 5.** Repère **`restauration-avant-p18-01-10`** = `61b066d8` (poussé). Préversion
`onlineconvertools-2iix8vjd9` (branche `preview/p18-01-10`), relais local à jeton OIDC en mémoire :

| Banc | Chromium | Firefox | WebKit |
|---|---|---|---|
| `safari16-pdf` (13 outils PDF.js, simulation Safari 16.4, worker compris) | ALL PASS | ALL PASS (1 lenteur de clic sous charge, repassé seul : PASS) | ALL PASS |
| `download-guard --service` (24 outils, fichiers réels, ZIP, question avant de quitter, Markdown to PDF) | 121/121 | 119/121 sous charge → repassé seul 17/17 (le dialogue de Firefox arrivait après 700 ms) | 110/110 (2 outils sans OffscreenCanvas dans ce WebKit, sautés et dits) |
| `download-guard --device=iphone` / `--device=ipad` | 142 / 142 (build local) | | 136 / 136 |
| `prelancement-01-10` | ALL PASS | ALL PASS | ALL PASS |
| `qualite-29-09` | 76/76 | 76/76 | 74/75 → api-tester (premier appel lent par le relais) revérifié seul : PASS ; outil non modifié |
| `pdf-audit-2` / `misc-audit-2` | 31/31 · 25/25 | 31/31 · 25/25 | 31/31 · 25/25 |
| `transcript-exports` / `barcode-generator` | PASS · PASS | PASS · PASS | PASS · PASS |
| `all-pages-load` (238 pages) | 238/238 | 238/238 | 238/238, et **238/238 en simulation Safari 16.4** |
| `video-to-gif-p18 --real-service` | GIF89a 30 images 320 px ; 15 PNG + ZIP | | (pas de H.264 dans ce WebKit) |
| `code-formatter-speed --safari16` | | | formatage 0,5-0,7 s |

Rouge avant / vert après : la simulation contre la production du matin (build moderne de PDF.js) bloquait PDF Editor
sur « Reading PDF… » et laissait Extract Text et PDF to Image sans résultat.

Fusion `git merge --no-ff` → **`106dbfdf`**, poussée normale ; production **`onlineconvertools-cwubuit2i`**, Ready.
**Sur www** : `safari16-pdf` sous WebKit **ALL PASS** (les 13 outils PDF, dont les 9 du Mac) ; `download-guard
--service` Chromium **121/121** (24 outils de toutes les catégories, Markdown to PDF compris) et iPhone simulé sous
WebKit **130/130** ; Video to GIF **GIF animé réel** (service de production) + extraction ; Code Formatter 0,55-0,67 s ;
238 pages Chromium propres. **Un seul écart, dans le banc** : sous charge (3 navigateurs en parallèle), le contrôle
« après Download, plus de question » d'Image Compressor a une fois fermé la page avant que React ait noté le
téléchargement ; repassé seul 3 fois : PASS ; le banc attend désormais que chaque ligne affiche « Downloaded ». Ce
n'était pas un échec du site : **pas de retour arrière**.

**Étape 4 bis.** Repère **`restauration-avant-p18-texte-pdf`** = `106dbfdf` (poussé). Préversion
`onlineconvertools-a5kgy0ykl` : `text-to-pdf-scripts` ALL PASS ×3, `text-to-pdf-unicode` ×2, `download-guard`
(Text / Markdown to PDF) WebKit 10/10. Fusion **`7a13f02c`**, production **`onlineconvertools-78ysb2kft`** ; sur www :
`text-to-pdf-scripts` **ALL PASS ×3 moteurs**, 238 pages Chromium propres.

**Retour arrière (si un jour nécessaire)** : `git revert -m 1 7a13f02c` puis `git revert -m 1 106dbfdf`, poussés
normalement (jamais de poussée forcée) ; ou `vercel promote` de la production précédente (`onlineconvertools-aa2m00i4k`
pour revenir juste après le prélancement). Pour le prélancement lui-même : `git revert -m 1 61b066d8`.

**Garde-fous ajoutés au build** (`npm run build`) : `scripts/check-downloads.js` (chaque outil qui fait un fichier
passe par le composant, ou figure dans la liste « aucun fichier » avec sa raison) et
`scripts/compat/check-syntax-es2022.mjs` (aucun script servi au-delà d'ES2022, le niveau de Safari 16.4).

## 9. À repasser sur le banc Safari du Mac (et l'iPhone)

**Attention au banc du Mac** : toutes les lignes de téléchargement du site ont changé. Chaque fichier est une ligne
`[data-file-download]` (attribut `data-name`) dont le lien est **`a[data-download]`** (texte « Download ») ; plusieurs
fichiers → bouton `[data-download-all]` ; sur iPhone / iPad, bouton `[data-share]` (« Save / Share »). Les sélecteurs
par libellé (« Download PNG », « Download Signed PDF », « Download .txt »…) du banc `tests-safari-scripts` sont à
remplacer par ceux-ci.

1. **Les 9 outils PDF qui échouaient** : Compare PDF, PDF Editor, Extract Text, PDF OCR, Organize PDF, Redact PDF,
   PDF to HTML, PDF to Image, PDF to JPG — plus les autres utilisateurs de PDF.js : **PDF Sign** (aperçu),
   **PDF to Excel** (PDF sans tableau), **PDF AI Summary** et **PDF Translate** (payants : jusqu'à l'envoi seulement).
2. **Téléchargement** (nouvelle ligne commune) : **Split PDF** avec un seul résultat (le cas de l'iPad) et « Every
   page » (ZIP), PDF to JPG (ZIP), Image Converter à 2 images (« Download all (ZIP) » — l'ancien bouton n'enregistrait
   que la première sur Safari), Image Compressor, Image Editor (« Save image » puis Download), QR Generator (PNG / SVG /
   PDF), Barcode Generator, Hash Generator (checksums.txt), Audio to Text / Audio Transcriber (TXT / SRT / VTT), un
   formateur (JSON Formatter : Download .json), et quitter la page sans télécharger (Safari doit demander).
3. **Markdown to PDF** : un fichier `.pdf` est téléchargé (plus de boîte d'impression).
4. **Video Tools › Video to GIF** : « Make GIF » donne un `.gif` animé ; l'option d'extraction donne des PNG et un ZIP.
5. **Text to PDF** : « Hello 👋🏽 world. Élodie à Montréal. বাংলা. 中文. العربية. » → PDF avec l'emoji en couleur ; la
   phrase « sent to our PDF service » apparaît avant la conversion.
6. **Code Formatter** : relever séparément le temps de saisie et le temps entre « Format » et le résultat.
7. **MOBI to EPUB** et **MOBI to PDF** avec `docs/audit/fixtures-safari/safari-book.mobi`.
8. **iPhone / iPad (propriétaire)** : sur un outil de chaque catégorie, « Save / Share » ouvre la feuille d'Apple
   (Enregistrer dans Fichiers, Photos pour une image, AirDrop) ; « Download » enregistre dans Fichiers › Téléchargements
   sans ouvrir le PDF ; plus la liste de `RAPPORT-p16-photos-iphone-30-09.md` et `RAPPORT-p17-30-09.md`.

**Non testables ici, dits comme tels** : le vrai Safari (seulement sa simulation 16.4 et le WebKit de Playwright, qui
n'a ni OffscreenCanvas ni H.264 sous Windows) ; la feuille de partage réelle d'iOS (simulée : elle reçoit le vrai
fichier) ; l'AZW3.
