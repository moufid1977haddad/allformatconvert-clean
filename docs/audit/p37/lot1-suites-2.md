# P37 lot 1 — suites 2 (EPUB to PDF, File Metadata)

Date : 06/10. Suites du lot 1 image/fichier (`docs/audit/p37/lot1-image-file.md`). Tout est testé en Node. Pas de
build, pas de commit, rien poussé.

| # | Outil | Gravité | État |
|---|-------|---------|------|
| 1 | EPUB to PDF : entrée du spine vers un id absent | 2 | corrigé, testé |
| 2 | File Metadata : WebP non lus | 1 | corrigé, testé |

## 1. EPUB to PDF : itemref vers un id inconnu — gravité 2

**Constat.** Dans le fichier OPF, un `<itemref idref="…">` du spine peut nommer un id absent du manifest. Le parseur
(@lingo-reader/epub-parser, `parseSpine`) lit `manifest[idref].href` sans contrôle. `initEpubFile` lève alors une
TypeError brute : « Cannot read properties of undefined (reading 'href') ». La page affichait ce message et aucun
PDF n'était produit. Même chose si l'itemref nomme un item du manifest sans `href` ou sans `media-type` (le parseur
ignore cet item). calibre (`ebook-convert`) signale l'entrée et continue.

**Reproduction.** Un EPUB à 3 chapitres dont le spine contient en plus `<itemref idref="c9"/>`.

**Correction.**
- `app/lib/epubChapters.js` : nouvelle fonction `dropUnknownSpineItems(zip)`. Elle lit `META-INF/container.xml`,
  puis l'OPF (noms cherchés sans tenir compte de la casse, comme le parseur). Elle garde les ids du manifest qui ont
  `id`, `href` et `media-type`. Elle retire du spine les itemref qui nomment un autre id, et les compte. L'OPF n'est
  réécrit que s'il y a une entrée à retirer. Si le paquet ne se lit pas ici, rien ne change : le parseur donne son
  erreur comme avant.
- `app/tools/pdf-tools/epub-to-pdf/page.jsx` : le ZIP est ouvert avec JSZip avant le parseur (il l'était déjà, mais
  après). S'il y a des entrées retirées, le parseur reçoit le livre réécrit. Le nombre retiré s'ajoute au compteur
  existant. Le message existant s'affiche : « N chapter(s) of this book could not be read (damaged or in an
  unsupported form) and is/are missing from the PDF. » Si toutes les entrées sont inconnues : « No readable chapters
  found in this file. » Un ZIP illisible donne « This EPUB could not be read (its contents are damaged or not
  standard). » au lieu du message brut de JSZip. Le même objet JSZip sert ensuite au compteur et à la couverture (une
  seule lecture du fichier).

**Test.** `node scripts/p37/lot1/epub-bad-itemref.test.mjs --legacy` (page d'avant) puis sans option.
- Avant : 4 échecs sur 5. Les 4 livres fautifs : « ERROR "Cannot read properties of undefined (reading 'href')" (no
  PDF) ». Sorties : `scripts/p37/lot1/out-epub-bad-itemref-before.txt`.
- Après : 5 sur 5. Livre intact : 3 chapitres, compteur 0 (pas de réécriture). Un id inconnu : 3 chapitres, compteur
  1. Deux ids inconnus (dont une forme `<itemref …></itemref>`) : 3 chapitres, compteur 2. Item sans media-type :
  2 chapitres, compteur 1. Tous inconnus : « No readable chapters found in this file. ». Un id avec `&amp;` entre
  apostrophes est bien gardé. Sorties : `out-epub-bad-itemref-after.txt`.
- `node scripts/p37/lot1/epub-missing-chapter.test.mjs` : toujours ALL PASS (3/3).

**Texte de la page.**
- FAQ « Does the PDF include every chapter? » : « A chapter whose file is missing or damaged is left out, … » →
  « A chapter whose file is missing or damaged, or whose entry in the reading order points to nothing in the book,
  is left out, … ».
- layout.tsx et page de catégorie PDF : rien sur ce point, inchangés.

## 2. File Metadata ne lit pas les WebP — gravité 1

**Constat.** La page disait elle-même « WebP photos are not read ». exifr 7.1.3 n'a pas de lecteur WebP :
`exifr.parse` lève « Unknown file format », l'erreur était avalée, et la page disait « No metadata found inside this
file » pour un WebP avec appareil et position GPS. Faux négatif pour la vie privée (même défaut qu'Image Metadata,
corrigé au lot 1).

**Reproduction.** Un WebP écrit par libvips (sharp) depuis `scripts/converter-tests/fixtures/exif-gps.jpg`, avec
EXIF + GPS, XMP et profil ICC.

**Correction.** `app/lib/embeddedMetadata.js` (lecteur de la page) :
- pour un WebP (reconnu à ses octets), les morceaux EXIF, XMP et ICC passent par `app/lib/webpMetadata.js`
  (`parseWebpMetadata`, non modifié, partagé avec Image Metadata). Les groupes sont fusionnés en un seul objet, la
  forme que donne `exifr.parse` par défaut. L'affichage est donc le même que pour un JPEG : Camera (EXIF),
  Authoring, Location (GPS). Comme pour les autres formats, le profil ICC est lu mais la page n'en montre pas de
  ligne.
- le fichier n'est pas chargé en entier : on lit les en-têtes des morceaux, puis seulement l'en-tête RIFF et les
  morceaux de métadonnées. Pas de plafond de taille donc, et le texte « 300 MB » (PDF et ZIP) reste exact.
- un WebP coupé donne la note existante « Could not be read: the file may be damaged or cut short. ».
- JPEG, PNG, TIFF, HEIC, AVIF : même appel `exifr.parse` qu'avant, mêmes options.

**Test.** `node scripts/p37/lot1/file-metadata-webp.test.mjs --legacy` (lecteur d'avant, copié dans le test) puis
sans option.
- Avant : 5 échecs. WebP avec GPS : « nothing (page: "No metadata found inside this file") ». WebP coupé : aucune
  note. Sorties : `scripts/p37/lot1/out-file-metadata-before.txt`.
- Après : 9 sur 9. JPEG : groupes identiques à avant. WebP : GPS 48.858400 / 2.294500 comme le JPEG source, marque
  et modèle, Authoring (Software=P37Test, Artist=Jane Doe venus du XMP), tous les groupes identiques à un JPEG écrit
  par libvips avec les mêmes métadonnées. Seuls 1 260 octets sur 16 160 sont lus (l'image, 14 914 octets, ne l'est
  pas). WebP sans métadonnées : rien, sans note. WebP coupé : note « cut short ». Sorties :
  `out-file-metadata-after.txt`.
- `node scripts/p37/lot1/image-metadata-webp.test.mjs` : toujours ALL PASS.

**Texte de la page** (`app/tools/file-tools/file-metadata/page.jsx`).
- Specs « Inside metadata » : « JPEG, PNG, TIFF, HEIC and AVIF photos (EXIF, GPS), PDF, DOCX, XLSX, PPTX,
  OpenDocument, ZIP, MP3 (ID3); WebP photos are not read » → « JPEG, PNG, TIFF, HEIC, AVIF and WebP photos (EXIF,
  GPS, XMP), PDF, DOCX, XLSX, PPTX, OpenDocument, ZIP, MP3 (ID3) ».
- FAQ « Does it show the GPS location of a photo? » : « … for JPEG, PNG, TIFF, HEIC and AVIF files (not WebP). » →
  « … for JPEG, PNG, TIFF, HEIC, AVIF and WebP files. ».
- layout.tsx (« EXIF and GPS ») et page de catégorie fichiers : ne parlent pas des WebP, inchangés.

## Contrôles

- `node scripts/p36/content-verify.mjs --only=pdf-tools/epub-to-pdf --verbose` : 0 échec.
- `node scripts/p36/content-verify.mjs --only=file-tools/file-metadata --verbose` : 0 échec.
- `node scripts/content-checks/instructions.mjs` : 225 pages, 0 écart.
- `node scripts/content-checks/privacy-claims.mjs` : 2 échecs, tous deux sur `pdf-tools/pdf-compress` (« Optimizing
  in your browser… »). Ce n'est pas une page de ce lot ; le fichier est modifié par un autre agent en parallèle.
  0 échec sur les deux pages de ce lot.
- Preuves `docs/audit/p36/preuves` (pdf-1.json, gif-file.json) : toujours valides, aucune nouvelle valeur chiffrée.
- Syntaxe JSX des deux pages vérifiée avec sucrase. Pas de build (règle).

## Reste à faire (propriétaire)

- Essai navigateur des deux pages après build (EPUB avec un itemref inconnu ; WebP de téléphone avec GPS).
