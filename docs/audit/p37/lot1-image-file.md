# P37 — Lot 1 image / fichier : 5 défauts (06/10)

Outils : Image Metadata Viewer, SVG to PNG, TIFF to JPG, Image Converter (sortie PDF), EPUB to PDF.
Ordre de travail : gravité 1, puis 2, puis 3. Rien n'est commité ni déployé.

Gravité : 1 = résultat faux ou perte de données ; 2 = échec ou plantage ; 3 = gêne.

| # | Outil | Gravité | État |
|---|---|---|---|
| 1 | Image Metadata (WebP) | 1 | corrigé, testé |
| 4 | Image Converter (qualité PDF < 50 %) | 1 | corrigé, testé |
| 5 | EPUB to PDF (chapitre absent, compteur) | 1 (+2) | corrigé, testé |
| 3 | TIFF to JPG (OffscreenCanvas) | 2 | corrigé, testé |
| 2 | SVG to PNG (aperçu) | 3 | corrigé, testé |

Tous les tests se lancent depuis la racine du dépôt. Les sorties « avant » et « après » sont gardées dans
`scripts/p37/lot1/out-*-before.txt` et `out-*-after.txt`.

---

## 1. Image Metadata ne lit pas les WebP — gravité 1

**Constat.** exifr 7.1.3 n'a pas de lecteur WebP. Sur un WebP, `exifr.parse` lève « Unknown file format ». La page
avalait l'erreur et disait « No embedded metadata ». Un WebP avec un GPS était donc dit « sans métadonnées » : faux
négatif pour la vie privée. Le bouton « Remove metadata » ne s'affichait jamais pour un WebP.

**Reproduction.** Un WebP écrit par libvips (sharp 0.34) à partir de `scripts/converter-tests/fixtures/exif-gps.jpg`,
avec EXIF + GPS, XMP et profil ICC. Un second WebP construit à la main : le bloc TIFF de l'APP1 du JPEG mis tel quel
dans un morceau `EXIF` (forme de la spécification), un morceau `XMP ` de longueur impaire (octet de bourrage) placé
avant l'image.

**Correction.**
- `app/lib/webpMetadata.js` (nouveau) : lit les morceaux RIFF `EXIF`, `XMP ` et `ICCP`. L'en-tête « Exif\0\0 »
  facultatif (libvips l'écrit) est retiré. Chaque contenu passe par les analyseurs d'exifr (`parse` pour le TIFF,
  `segmentParsers` xmp et icc). La sortie a la même forme que pour un JPEG. Un WebP coupé donne une erreur, donc le
  message « damaged or cut short ».
- `app/tools/image-tools/image-metadata/page.jsx` : un WebP (reconnu à ses octets) passe par ce module ; la position
  GPS vient du groupe GPS lu. Les autres formats ne changent pas.
- La suppression marchait déjà pour WebP (`app/lib/stripMetadata.js`) ; le bouton s'affiche maintenant.

**Test.** `node scripts/p37/lot1/image-metadata-webp.test.mjs --legacy` (logique d'avant) puis sans option.
- Avant : 10 échecs. Les deux WebP : « no metadata [exifr: Unknown file format] ». WebP coupé : aucun message.
- Après : tout passe. GPS 48.858400 / 2.294500 en tête, appareil, XMP, ICC ; le groupe GPS est identique à celui du
  JPEG ; WebP sans métadonnées : « none found » sans erreur ; WebP coupé : message « cut short » ; « Remove metadata »
  sur le WebP : EXIF et XMP retirés, ICC gardé, image valide 800x600. JPEG : inchangé.
- Non-régression : `node scripts/p24/strip-metadata.test.mjs` → all passed.

**Marché.** ExifTool lit les métadonnées d'un WebP dans ces mêmes morceaux (EXIF, XMP, ICC_Profile). libvips écrit
le morceau EXIF avec l'en-tête « Exif\0\0 » (mesuré ici), d'où la double lecture.

**Textes de la page (avant → après).**
- Interface : « No embedded metadata (EXIF, GPS, IPTC, XMP, ICC) found in this file. The metadata of WebP files is not
  read here. » → « No embedded metadata (EXIF, GPS, IPTC, XMP, ICC) found in this file. »
- About : « It reads JPEG, HEIC/HEIF, TIFF, PNG and AVIF files with the exifr library; WebP metadata is not read, so a
  WebP is shown as having none. » → « It reads JPEG, HEIC/HEIF, TIFF, PNG, AVIF and WebP files with the exifr library;
  for a WebP, the page first takes the EXIF, XMP and ICC blocks out of the file. »
- About : « For JPG and PNG, Remove metadata makes a copy… » → « For JPG, PNG and WebP, Remove metadata makes a copy… »
- Specs « WebP files » : « Their metadata is not read: the page says the file has none, even if it holds camera or GPS
  data » → « EXIF (with GPS), XMP and the ICC color profile are read »
- Specs « Removal » : « JPG and PNG; … » → « JPG, PNG and WebP; … »
- FAQ 3 : « No. Removal works on JPG and PNG only. A HEIC or TIFF file is refused with a message, and a WebP never
  shows the "Remove metadata" button, because its metadata is not read here. Convert the photo to JPG with Image
  Converter first. » → « Yes for WebP, no for HEIC and TIFF. Removal works on JPG, PNG and WebP. A HEIC or TIFF file is
  refused with a message: convert the photo to JPG with Image Converter first, then check the copy here. »
- Méta (layout.tsx, description et openGraph) : « …remove it from a JPG or PNG without re-encoding… » → « …remove it
  from a JPG, PNG or WebP without re-encoding… » (146 caractères).
- Page de catégorie `app/tools/image-tools/page.jsx`, FAQ GPS : « Yes, for JPG and PNG files. … of a JPG, HEIC, TIFF,
  PNG or AVIF image, and saves a copy without metadata for JPG and PNG; WebP metadata is not read. » → « Yes, for JPG,
  PNG and WebP files. … of a JPG, HEIC, TIFF, PNG, AVIF or WebP image, and saves a copy without metadata for JPG, PNG
  and WebP. »

---

## 4. Image Converter : qualité PDF ignorée sous 50 % — gravité 1

**Constat.** Le curseur « Quality » va de 10 à 100 % et s'affiche pour PDF. `extraFormats.js` faisait
`Math.max(0.5, quality / 100)` : 10 %, 20 %… 49 % donnaient tous le JPEG à 50 %, sans le dire.

**Correction.** `app/tools/image-tools/image-converter/extraFormats.js` : `q = quality / 100`. L'autre appelant
(`app/components/PdfToImages.jsx`) n'utilise que TIFF et BMP : comportement inchangé.

**Test.** `node scripts/p37/lot1/image-converter-pdf-quality.test.mjs` : vrai encodeur `encodeExtra('pdf', …)`
(chemin MozJPEG sans canvas), le JPEG dans le PDF est comparé octet par octet à MozJPEG à la même qualité.
- Avant : 5 échecs. PDF de 4 130 octets pour 10, 20, 30, 49 et 50 %.
- Après : tout passe. 1 782 / 2 005 / 2 652 / 4 062 / 4 130 octets ; le JPEG intérieur est celui de la qualité demandée.
- Non-régression : `node scripts/p31/output-formats.test.mjs` → 69 checks, ALL PASS.

**Marché.** Comportement attendu évident : un réglage affiché doit s'appliquer (pour JPG, WebP et AVIF, le même
curseur s'applique déjà de 10 à 100 %).

**Textes.** Aucune phrase ne décrivait le plancher de 50 %. Rien à changer (contrôles à 0).

---

## 5. EPUB to PDF : chapitre absent = page blanche ; compteur jamais atteint — gravité 1 (+ 2)

**Constat.** `loadChapter()` de @lingo-reader ne renvoie jamais de valeur vide. Le compteur « N chapters could not be
read » était du code mort.
- Fichier de chapitre absent du ZIP : le lecteur lit 0 octet, d'où un chapitre vide, donc une page blanche, sans un mot.
- Entrée ZIP abîmée : exception, tout le livre s'arrête avec le message brut « Bug : uncompressed data size mismatch ».

**Correction.**
- `app/lib/epubChapters.js` (nouveau) : avant de lire un chapitre, vérifie que son fichier est dans le ZIP (même règle
  que le lecteur : nom sans casse) ; une lecture qui lève une erreur est aussi écartée. Les deux cas sont comptés.
- `app/tools/pdf-tools/epub-to-pdf/page.jsx` : la boucle passe par ce module ; le ZIP n'est ouvert qu'une fois pour la
  liste des noms et la couverture (`extractCoverImage(zip)`). Le message existant « N chapter(s) of this book could not
  be read … missing from the PDF » s'affiche enfin.

**Test.** `node scripts/p37/lot1/epub-missing-chapter.test.mjs --legacy` puis sans option (vrai lecteur
@lingo-reader, build Node, mêmes fonctions `loadChapter`/`readResource` que le build navigateur).
- Avant : 2 échecs. Chapitre 2 absent : « Chapter 1 | BLANK PAGE | Chapter 3 ; counter: 0 ». Chapitre 2 abîmé :
  « ERROR "Bug : uncompressed data size mismatch" (no PDF) ».
- Après : tout passe. « Chapter 1 | Chapter 3 ; counter: 1 » dans les deux cas ; livre intact : 3 chapitres, 0.

**Marché.** calibre (moteur d'ebook-convert, utilisé par CloudConvert) avertit d'un élément du spine introuvable et
continue sans lui. Nous faisons pareil, et nous le disons à l'écran.

**Textes (FAQ 3).** « Yes, when the book is intact. A chapter file missing from the book comes out as an empty page,
and a damaged book stops with an error message instead of a PDF. » → « Yes, when the book is intact. A chapter whose
file is missing or damaged is left out, and the page then says how many chapters are missing from the PDF. A book whose
package cannot be opened stops with an error message instead. »

---

## 3. TIFF to JPG : OffscreenCanvas sans test — gravité 2

**Constat.** Le worker faisait `new OffscreenCanvas` sans vérifier qu'il existe (Safari avant 16.4, WebKit de
Playwright sous Windows). Résultat : « OffscreenCanvas is not defined », affiché comme « This TIFF file couldn't be
read… corrupted ». Le worker de TIFF to PNG teste déjà `typeof OffscreenCanvas` et écrit le fichier depuis les pixels ;
`app/lib/tiffDecode.js` n'utilise pas OffscreenCanvas.

**Correction.** `app/tools/image-tools/tiff-to-jpg/tiffToJpg.worker.js` : même règle que TIFF to PNG. Sans
OffscreenCanvas, le JPEG est écrit par MozJPEG (WebAssembly), comme au-delà de 16,7 Mpx.

**Test.** `node scripts/p37/lot1/tiff-to-jpg-no-offscreen.test.mjs` : le vrai module du worker, dans Node (pas
d'OffscreenCanvas), fichiers `/wasm/` servis depuis `public/wasm`.
- Avant : « worker messages: decoded, error "OffscreenCanvas is not defined" » → FAIL.
- Après : « decoded, done » ; JPEG 64x48 ; partie transparente sur le fond choisi (0,255,1) ; partie opaque gardée
  (199,100,59). ALL PASS.

**Marché.** Sans objet : alignement sur notre propre TIFF to PNG.

**Textes (privacy).** « …written as a JPG, by the browser or by MozJPEG in WebAssembly for images over 16.7 megapixels.
» → « …for images over 16.7 megapixels and in browsers whose workers cannot draw images. » (le chiffre reste calculé
depuis `CANVAS_MAX_PIXELS`).

---

## 2. SVG to PNG : aperçu cassé — gravité 3

**Constat.** `result` contient l'objet `{ blob, url, name }` de `resultOf()`. L'aperçu faisait `<img src={result}>` :
React écrit « [object Object] », l'image est cassée. Le bouton Download marchait (`result.url`).

**Correction.** `app/tools/image-tools/svg-to-png/page.jsx` : `src={result.url}`.

**Test.** `node scripts/p37/lot1/svg-to-png-preview.test.mjs` : lit l'expression `src` de l'aperçu dans la page et
l'évalue avec le vrai objet de `resultOf()`.
- Avant : « {result} -> "[object Object]" » → FAIL.
- Après : « {result.url} -> "blob:…" » → PASS.
- Preuve navigateur : cas `svg` du script Playwright ci-dessous (naturalWidth 512, naturalHeight 256).

**Textes (étape 4).** « Click "Convert to PNG", then "Download". » → « Click "Convert to PNG", check the preview of the
PNG, then click "Download". »

---

## Contrôles des textes (06/10)

- `node scripts/p36/content-verify.mjs --only=<page> --verbose` : 0 défaut pour image-tools/image-metadata,
  image-tools/svg-to-png, image-tools/tiff-to-jpg, image-tools/image-converter, pdf-tools/epub-to-pdf.
- `node scripts/content-checks/instructions.mjs` : 225 pages, 1 763 libellés, 0 écart.
- `node scripts/content-checks/privacy-claims.mjs` : 53 outils, 0 échec.
- Le passage complet de content-verify montre 2 échecs C3 sur audio-converter et video-to-audio
  (`app/lib/audioFormats.js`, modifié par un autre agent) : hors de ce lot.
- Aucun nouveau chiffre écrit en dur : pas de preuve à ajouter dans `docs/audit/p36/preuves/`.

## Preuve navigateur (à lancer par le contrôleur)

`scripts/p37/lot1/lot1-browser.pw.mjs <origin> [--browser=chromium|webkit|firefox] [--only=svg,meta,tiff,pdfq,epub]`.
Sur un build local seulement. Le cas `epub` répond lui-même à `/api/convert-html-to-pdf` (aucun appel à Gotenberg) et
vérifie le HTML envoyé. WebKit sous Windows n'a pas d'OffscreenCanvas : c'est le cas exact du défaut 3.

## Reporté (non corrigé)

- **EPUB : `itemref` qui pointe vers une entrée de manifeste absente.** Le lecteur lève une TypeError à l'ouverture
  (« Cannot read properties of undefined (reading 'href') ») et la page l'affiche brute. Correction : traduire les
  erreurs internes du lecteur en une phrase. Estimation : 30 min + test. Gravité 3.
- **File Metadata (`app/tools/file-tools/file-metadata`)** dit « WebP photos are not read » : vrai pour cet outil, qui a
  son propre lecteur. Il pourrait réutiliser `app/lib/webpMetadata.js`. Estimation : 1 h + test + texte. Hors de ce lot.
- **WebP : IPTC.** Le format WebP n'a pas de morceau IPTC ; rien à lire.
