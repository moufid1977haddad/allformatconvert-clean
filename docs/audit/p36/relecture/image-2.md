# P36 — relecture indépendante, lot image-2 (19 pages)

Relu le 2026-10-05 sur la branche `p36` (arbre de travail), texte des props `<SeoContent>` de `page.jsx` / `page.tsx` et
`metadata` de `layout.tsx`, comparé au code de chaque outil et aux bibliothèques importées : `app/lib/imageOutput.js`,
`app/lib/bigImage.js`, `app/lib/canvasFilters.js`, `app/lib/glBlur.js`, `app/lib/blurParallel.js`,
`app/lib/imageSimilarity.js`, `app/lib/stripMetadata.js`, `app/lib/fileChecks.js`, `app/lib/mediaSupport.js`,
`app/lib/animatedImage.js`, `app/lib/useToolError.js`, `app/lib/reportError.js`, `app/api/report-error/route.js`,
`app/components/FileDownload.jsx`, `AnimatedImageNote.jsx`, `UploadPrompt.jsx`, `node_modules/exifr` 7.1.3.
Contrôles automatiques relancés (lecture seule) : `scripts/p36/content-verify.mjs --only=image-tools/` (0 échec),
`scripts/content-checks/instructions.mjs` (0 libellé faux), `privacy-claims.mjs` (0 échec). Comparaison des phrases sur
les 225 pages faite à part (phrases identiques après normalisation, et n-grammes de 8 mots communs).

Structure mesurée : titres 46-59 caractères, méta 134-150, openGraph identiques, About 84-118 mots, 4 étapes partout,
3 à 5 FAQ. Aucun libellé de bouton faux. Les chiffres « 268 megapixels », « 16.7 megapixels », « quality 92 »,
« 100 megapixels », « 16,383 », « 32,767 » sont exacts. La mention « 48 megapixel photos were tested in a simulated iPhone
on 30 September 2026 » (Image Blur) est prouvée par `docs/audit/RAPPORT-p17-30-09.md:12, 208`.

## Défauts

| Page | Endroit | Phrase (citation courte) | Problème | Preuve (fichier:ligne ou calcul) | Correction proposée |
|---|---|---|---|---|---|
| image-metadata | About | « It reads JPEG, HEIC/HEIF, TIFF, PNG, WebP and AVIF with the exifr library » | (1) FAUX pour WebP : exifr 7.1.3 n'a pas d'analyseur WebP ; sur un WebP, `exifr.parse` lève « Unknown file format », que la page avale en silence et affiche « No embedded metadata (EXIF, GPS, IPTC, XMP, ICC) in this file. », même si le WebP contient un GPS | `node_modules/exifr/dist/full.esm.mjs` : analyseurs enregistrés `jpeg`, `tiff`, `heic`, `avif`, `png` seulement ; essai Node : WebP VP8X + morceau EXIF (Make=ABC) → `Unknown file format`, le même EXIF dans un JPEG → `{"ifd0":{"Make":"ABC"}}` ; `image-metadata/page.jsx:61` (erreur ignorée), `:86` (message « No embedded metadata ») | Retirer WebP de la liste. **Défaut de l'outil à signaler aussi** : un WebP avec GPS est dit « sans métadonnées » (faux négatif de confidentialité) ; soit lire le morceau `EXIF`/`XMP ` du WebP soi-même (`stripMetadata.js` sait déjà les trouver), soit dire « WebP: metadata not read » |
| image-metadata | About | « For JPG, PNG and WebP, Remove metadata makes a copy… » | (1) FAUX pour WebP : le bouton « Remove metadata » n'apparaît que si exifr a trouvé des métadonnées, ce qui n'arrive jamais pour un WebP | `image-metadata/page.jsx:75` (`embedded.length > 0`) + ligne précédente | « For JPG and PNG, … » (ou corriger l'outil d'abord) |
| image-metadata | specs « Metadata read from » | « JPEG, HEIC/HEIF, TIFF, PNG, WebP and AVIF » | (1) FAUX pour WebP | idem exifr | « JPEG, HEIC/HEIF, TIFF, PNG and AVIF » |
| image-metadata | specs « Removal » | « JPG, PNG and WebP; … » | (1) FAUX pour WebP (bouton jamais affiché) | `page.jsx:75` | « JPG and PNG; … » |
| image-metadata | FAQ 3 | « Removal works on JPG, PNG and WebP only. » | (1) FAUX pour WebP | `page.jsx:75` | « Removal works on JPG and PNG only. » et ajouter WebP à la phrase HEIC/TIFF |
| image-metadata | méta description | « remove it from JPG, PNG or WebP without re-encoding » | (1) FAUX pour WebP | `page.jsx:75` | « … remove it from a JPG or PNG without re-encoding … » (110-155 caractères) |
| image-metadata | About | « gives the file name, size, type, pixel size and last-modified date of any image » | (1) faux pour une image que le navigateur n'affiche pas (HEIC hors Safari, TIFF) : ni dimensions ni date, une note à la place | `page.jsx:43` (`img.onerror` → name, size, type, note) | « … of any image the browser can display » |
| image-metadata | privacy | « that message alone is reported to us » | (3) promet moins que le code : le rapport contient aussi le nom de l'outil, le navigateur et sa version majeure, et la requête est comptée par réseau (empreinte d'IP) pour la limite | `app/lib/reportError.js:142-155` (`tool`, `browser`, `errorType`) ; `app/api/report-error/route.js:22` → `lib/quota/toolErrorRateLimit.js:3, 12` (`clientIpBucketId`) | « …the text of that message is reported to us, with the browser's name and version, never the photo or its metadata. » |
| image-metadata | FAQ 4 | « The last-modified line… » | (6) la réponse ne commence pas par Yes / No / un chiffre | — | « No, not necessarily: the last-modified line… » |
| round-corners | FAQ 4 | « A WebP is saved as PNG in both modes, which keeps its transparency » | (1) FAUX en mode « Corners in » : tout le canevas est d'abord rempli de la couleur, donc la transparence du WebP (et d'un PNG) est remplie, pas gardée | `round-corners/page.jsx:44` (`fillRect(0, 0, W, H)` avant `drawSource`) | « No. A WebP is saved as PNG in both modes; with "Transparent corners (PNG)" its transparency is kept, with "Corners in" it is filled with the color. » |
| round-corners | privacy | « We only receive the text of an error message » | (3) « only » faux : outil, navigateur + version, compteur par réseau | `reportError.js:142-155` ; `toolErrorRateLimit.js:12` | « …its text is reported to us, with the browser name, never the picture. » |
| round-corners | étape 1 | « Click the upload box and choose the picture. » | (5) phrase identique sur image-flip, image-inverter, image-pixelator, image-rotate | comparaison des 225 pages | étape propre : « Click the upload box and choose the picture whose corners you want to round. » |
| round-corners | About | « Processing stays in your browser. » | (5) phrase identique sur brightness-contrast | idem | « The corners are cut in your browser. » |
| round-corners | FAQ 2 | « Because transparent corners need… » | (6) ne commence pas par Yes / No / un chiffre | — | reformuler la question (« Can a rounded JPG stay a JPG? » → « Yes, with "Corners in"… ») |
| image-editor | About | « Save image renders the full-size result in the photo's own format » | (1) faux pour GIF, BMP, AVIF, HEIC… : enregistrés en PNG | `image-editor/page.tsx:224` → `imageOutput.js:122-125` (`encodeRasterLike` : JPEG/WebP sinon PNG) | « …in the photo's format for JPG, PNG and WebP (PNG for other formats, and once the corners are rounded) » |
| image-editor | specs « Output format » et FAQ 3 | « The photo's format (JPG at quality 92, PNG, WebP) » / « A JPG stays a JPG …, a WebP stays a WebP, a PNG stays a PNG » | (1) incomplet : ne dit pas qu'un GIF / BMP / AVIF sort en PNG, alors que la FAQ répond à « What format… is the saved image? » | `imageOutput.js:122-125` | ajouter « GIF, BMP and other formats are saved as PNG » |
| image-editor | FAQ 2 | « on a computer, the saved file is the preview as last applied » | (1) faux dans un cas : rotation passée à 90/270° sans « Apply » sur une photo non carrée → les dimensions du canevas ne correspondent plus, le fichier est repeint avec les réglages courants, pas l'aperçu | `page.tsx:206` (test `canvas.width === W && height === H`) puis `:207-221` (`paint` avec l'état courant) | « Click "Apply" before "Save image" as well, so the preview shows what you save. » |
| image-editor | FAQ 3 | « The full pixel size of your photo… » | (6) ne commence pas par Yes / No / un chiffre | — | reformuler (« Is the saved image full size? » → « Yes. … ») |
| image-blur | About | « or on all your processor cores when that is not available » | (1) faux : 6 workers au plus, et une petite image (une seule tranche) est floutée sur la page, sans worker | `app/lib/blurParallel.js:19` (`Math.min(6, cores)`), `:20` (`tasks.length < 2` → `applyGaussianBlur` sur la page) | « …or, when that is not available, on up to six processor cores » |
| image-blur | privacy | « or in background workers on its processor cores » | (1) même cas : petite image sans WebGL2 → calcul sur la page, pas dans des workers | `blurParallel.js:20` | « …or on its processor » |
| image-blur | About | « the smooth blur photo editors use » | (4) affirmation sur d'autres logiciels, sans preuve dans le code ou un rapport | — | supprimer la proposition |
| image-blur | étape 4 | « to keep the blurred picture in its original format » | (1) faux pour GIF / BMP / AVIF (PNG) | `imageOutput.js:122-125` | « …in the same format (PNG for GIF, BMP or AVIF) » |
| image-blur | étape 1 | « Click the upload box and choose the photo. » | (5) identique sur add-text-to-image, sepia-filter | comparaison | étape propre à l'outil |
| image-blur | About | « JPG, PNG and WebP keep their format; other formats become PNG. » | (5) quasi identique à add-vignette / image-cropper (« …, other formats become PNG ») et aux 8 autres filtres (voir ligne « famille ») | comparaison | déplacer le format dans `specs` seulement, ou formuler propre à l'outil |
| image-inverter | About | « Inverting the result again gives the original colors back. » | (1) inconditionnel : faux pour un JPG (re-compression) et approché pour les pixels semi-transparents ; la FAQ 1 le nuance, l'About non | `encodeRasterLike` JPEG q 92 ; FAQ 1 de la même page | « …gives the original colors back (exactly for an opaque PNG). » |
| image-inverter | étape 4 | « Click "Download" to save it in the original format. » | (1) faux pour GIF / BMP / AVIF (PNG) ; (5) identique sur image-flip | `imageOutput.js:122-125` ; comparaison | « Click "Download": the negative keeps the original's format (PNG for GIF, BMP or AVIF). » formulé autrement que Flip |
| image-inverter | méta description | « Transparency and format are kept » | (1) format non gardé pour GIF / BMP / AVIF | idem | « …JPG, PNG and WebP keep their format… » |
| image-inverter | privacy | « Only the words of an error message… are reported to us. » | (3) « Only » faux (outil, navigateur, compteur par réseau) | `reportError.js:142-155` ; `toolErrorRateLimit.js:12` | retirer « Only », nommer ce qui part |
| image-inverter | étape 1 | « Click the upload box and choose the picture. » | (5) identique sur 4 pages | comparaison | étape propre |
| image-inverter | About | « JPG, PNG and WebP keep their format and pixel size; GIF, BMP and AVIF come back as PNG. » | (5) quasi identique à image-flip et à la famille | comparaison | voir ligne « famille » |
| image-flip | étape 4 | « Click "Download" to save it in the original format. » | (1) faux pour GIF / BMP / AVIF ; (5) identique sur image-inverter | `imageOutput.js:122-125` | phrase propre + exception PNG |
| image-flip | méta description | « …that keeps the original format » | (1) faux pour GIF / BMP / AVIF | idem | « …that keeps JPG, PNG and WebP in their format » |
| image-flip | étape 1 | « Click the upload box and choose the picture. » | (5) identique sur 4 pages | comparaison | étape propre |
| image-flip | About | « JPG, PNG and WebP keep their format and transparency; other formats become PNG. » | (5) quasi identique (famille) | comparaison | voir ligne « famille » |
| image-flip | FAQ 2 | « …a JPG is saved again at quality 92, which adds one round of lossy compression » | (5) quasi identique à la même phrase sur add-border, add-vignette, brightness-contrast, grayscale, image-rotate | comparaison | une seule page garde ce fait en FAQ ; ailleurs il est dans `specs` (« quality 92 ») |
| image-flip | FAQ 1 | « Click "Flip Both Ways". » | (6) ne commence pas par Yes / No / un chiffre | — | « Can I flip both ways at once? » → « Yes: click "Flip Both Ways"… » |
| image-flip | FAQ 2 | « The pixels are only moved, never resampled. » | (6) idem | — | « Only for JPG and WebP: … » ou « No for a PNG… » |
| image-pixelator | étape 4 | « …click "Download" to save it in the original format. » | (1) faux pour GIF / BMP / AVIF | `imageOutput.js:122-125` | ajouter l'exception PNG |
| image-pixelator | méta description | « The format is kept » | (1) idem | idem | « JPG, PNG and WebP keep their format » |
| image-pixelator | privacy | « its text is reported to us, nothing else » | (3) « nothing else » faux (outil, navigateur + version, compteur par réseau) | `reportError.js:142-155` ; `toolErrorRateLimit.js:12` | « …its text and the browser's name are reported to us, never the picture » |
| image-pixelator | étape 1 | « Click the upload box and choose the picture. » | (5) identique sur 4 pages | comparaison | étape propre |
| image-pixelator | About | « JPG, PNG and WebP keep their format, other formats are saved as PNG… » | (5) quasi identique à add-noise et à la famille | comparaison | voir ligne « famille » |
| image-pixelator | FAQ 2 | « Pixels give the same block size… » | (6) ne commence pas par Yes / No / un chiffre | — | reformuler en question fermée |
| sepia-filter | étape 4 | « …save the toned picture in its original format. » | (1) faux pour GIF / BMP / AVIF | `imageOutput.js:122-125` | ajouter l'exception |
| sepia-filter | méta description | « Format kept, done in your browser. » | (1) idem | idem | « JPG, PNG and WebP stay in their format… » |
| sepia-filter | étape 1 | « Click the upload box and choose the photo. » | (5) identique sur add-text-to-image, image-blur | comparaison | étape propre |
| sepia-filter | About | « Transparency is untouched, and JPG, PNG and WebP keep their format. » | (5) quasi identique à grayscale-converter (« Transparency is kept, and JPG, PNG and WebP keep their format. ») | comparaison | formuler autrement ou garder dans `specs` |
| sepia-filter | FAQ 1 | « It mixes the sepia result… » | (6) ne commence pas par Yes / No / un chiffre | — | « What does 50 do? » → « 50 puts each pixel halfway… » |
| add-noise | étape 4 | « …to keep the file in its original format. » | (1) faux pour GIF / BMP / AVIF | `imageOutput.js:122-125` | ajouter l'exception |
| add-noise | méta description | « Format and full size are kept » | (1) format non gardé pour GIF / BMP / AVIF | idem | « Full size kept; JPG, PNG and WebP keep their format » |
| add-noise | About | « JPG, PNG and WebP keep their format; other formats are saved as PNG. » | (5) quasi identique à image-pixelator et à la famille | comparaison | voir ligne « famille » |
| add-noise | tip 1 | « Each click on "Add Noise" restarts from your original photo… » | (5) quasi identique au tip 1 d'add-border (« Each click on "Add Border" starts again from your original file… ») | comparaison | garder ce conseil sur une seule des deux pages |
| add-noise | FAQ 2 | « Gray grain adds the same random amount… » | (6) ne commence pas par Yes / No / un chiffre | — | question fermée (« Does colored noise change the hue? » → « Yes… ») |
| add-border-to-image | étape 4 | « …save it in the format of the original » | (1) faux pour GIF / BMP / AVIF (l'About le dit pourtant) | `imageOutput.js:122-125` | « …in the original's format (PNG for GIF, BMP or AVIF) » |
| add-border-to-image | FAQ 4 | « A JPG is saved again as a JPG at quality 92, which is a lossy step, while a PNG stays lossless. » | (5) quasi identique sur 5 autres filtres | comparaison | voir image-flip FAQ 2 |
| add-border-to-image | tip 1 | « Each click on "Add Border" starts again from your original file… » | (5) quasi identique à add-noise tip 1 | comparaison | voir add-noise |
| add-border-to-image | FAQ 3 | « Its transparent areas stay transparent. » | (6) ne commence pas par Yes / No / un chiffre | — | « Does a transparent logo stay transparent? » → « Yes. … » |
| add-border-to-image | FAQ 4 | « A little. » | (6) idem (question fermée : la réponse est « Yes, a little ») | — | « Yes, a little. … » |
| add-text-to-image | étape 4 | « …save the image in its original format. » | (1) faux pour GIF / BMP / AVIF (la spec dit PNG) | `imageOutput.js:122-125` | ajouter l'exception |
| add-text-to-image | privacy | « we receive the error message alone » | (3) « alone » faux (outil, navigateur + version, compteur par réseau) | `reportError.js:142-155` ; `toolErrorRateLimit.js:12` | « …we receive the error message, cleaned of quoted text, and the browser's name » |
| add-text-to-image | étape 1 | « Click the upload box and choose the photo. » | (5) identique sur image-blur, sepia-filter | comparaison | étape propre |
| add-text-to-image | About | « JPG, PNG and WebP keep their format. » | (5) phrase identique sur brightness-contrast | comparaison | formuler autrement ou laisser à `specs` |
| add-text-to-image | FAQ 3 | « Because the size is counted… » | (6) ne commence pas par Yes / No / un chiffre | — | « Is the size measured on the preview? » → « No. … » |
| add-text-to-image | FAQ 4 | « Choose "Impact (memes)"… » | (6) idem | — | « Can I make a classic meme caption? » → « Yes: … » |
| add-vignette | étape 1 | « Click the upload box and pick the picture. » | (5) quasi identique à add-border (« …and pick the picture to frame. ») | comparaison | étape propre |
| add-vignette | About | « JPG, PNG and WebP keep their format, other formats become PNG. » | (5) phrase identique sur image-cropper | comparaison | voir ligne « famille » |
| add-vignette | FAQ 4 | « A JPG is saved again at quality 92, one more lossy step, while a PNG stays lossless. » | (5) quasi identique sur 5 autres filtres | comparaison | voir image-flip FAQ 2 |
| add-vignette | FAQ 4 | « It is not resized… » | (6) ne commence pas par Yes / No / un chiffre | — | « No, not resized; … » |
| brightness-contrast | privacy | « Only the text of an error message… is reported to us. » | (3) « Only » faux | `reportError.js:142-155` ; `toolErrorRateLimit.js:12` | retirer « Only », nommer ce qui part |
| brightness-contrast | About | « JPG, PNG and WebP keep their format. » | (5) identique sur add-text-to-image | comparaison | formuler autrement |
| brightness-contrast | About | « Processing stays in your browser. » | (5) identique sur round-corners | comparaison | phrase propre (« The three sliders are applied in your browser. ») |
| brightness-contrast | FAQ 4 | « a JPG is encoded again at quality 92, which is lossy, while a PNG stays lossless » | (5) quasi identique sur 5 autres filtres | comparaison | voir image-flip FAQ 2 |
| brightness-contrast | FAQ 3 | « Brightness at 0 gives a black picture… » | (6) ne commence pas par Yes / No / un chiffre | — | « What does 0 do? » → « 0 gives… » (commence par le chiffre) |
| brightness-contrast | FAQ 4 | « Only through saving. » | (6) idem | — | « Yes, only through saving: … » |
| grayscale-converter | étape 4 | « the file keeps the original format » | (1) faux pour GIF / BMP / AVIF (la spec dit PNG) | `imageOutput.js:122-125` | ajouter l'exception |
| grayscale-converter | privacy | « Only the text of a displayed error is reported to us » | (3) « Only » faux | `reportError.js:142-155` ; `toolErrorRateLimit.js:12` | retirer « Only », nommer ce qui part |
| grayscale-converter | FAQ 1 | « matches how modern screens and CSS compute gray » | (4) les écrans ne « calculent » pas de gris ; seule la partie CSS est vérifiable (poids du filtre CSS `grayscale()`) | `grayscale-converter/page.jsx:22` (poids 0.2126 / 0.7152 / 0.0722) | « …uses the same weights as the CSS grayscale() filter… » |
| grayscale-converter | About | « The conversion runs in your browser. » | (5) phrase identique sur 6 autres pages (color-converter, hex-to-text, json-to-csv, unicode-converter, image-converter, case-converter) | comparaison | phrase propre (« The gray values are computed in your browser. ») |
| grayscale-converter | About | « Transparency is kept, and JPG, PNG and WebP keep their format. » | (5) quasi identique à sepia-filter | comparaison | voir sepia |
| grayscale-converter | FAQ 4 | « A JPG is saved again at quality 92, which is lossy; a PNG stays lossless. » | (5) quasi identique sur 5 autres filtres | comparaison | voir image-flip FAQ 2 |
| grayscale-converter | FAQ 1 | « Rec. 709 luminance, the default… » | (6) ne commence pas par Yes / No / un chiffre | — | reformuler en question fermée ou commencer par « 709 (Rec. 709)… » |
| grayscale-converter | FAQ 4 | « The pixel size stays the same… » | (6) idem ; la question fermée (« Does it reduce quality? ») n'a pas de oui/non | — | « Only for a JPG: … » → « Yes, slightly for a JPG… » |
| image-cropper | étape 4 | « …save the cropped file in the original format. » | (1) faux pour GIF / BMP / AVIF (la FAQ 3 dit PNG) | `imageOutput.js:122-125` | ajouter l'exception |
| image-cropper | privacy | « only the message text reaches us » | (3) « only » faux | `reportError.js:142-155` ; `toolErrorRateLimit.js:12` | nommer ce qui part |
| image-cropper | About | « JPG, PNG and WebP keep their format, other formats become PNG. » | (5) identique sur add-vignette | comparaison | formuler autrement |
| image-cropper | FAQ 3 | « The same as the original… » | (6) ne commence pas par Yes / No / un chiffre | — | « Does the crop keep my format? » → « Yes for JPG, PNG and WebP; … » |
| image-rotate | étape 1 | « Click the upload box and choose the picture. » | (5) identique sur 4 pages | comparaison | étape propre |
| image-rotate | FAQ 1 | « A PNG stays lossless; a JPG or WebP is saved again at quality 92, one more lossy compression. » | (5) quasi identique sur 5 autres filtres | comparaison | voir image-flip FAQ 2 |
| image-rotate | FAQ 1 | « Quarter turns move pixels exactly… » | (6) ne commence pas par Yes / No / un chiffre | — | « No for the pixels: quarter turns… » |
| image-rotate | FAQ 2 | « For any angle other than a quarter turn… » | (6) idem | — | « Does the canvas grow? » → « Yes, for any angle… » |
| image-rotate | FAQ 3 | « Clockwise. » | (6) idem | — | « Does it turn clockwise? » → « Yes. … » |
| duplicate-image-finder | About | « Everything is computed in your browser. » | (5) phrase identique sur developer-tools/hash-generator | comparaison | « The fingerprints and hashes are computed in your browser. » |
| duplicate-image-finder | FAQ 2 | « Normal, the default, accepts up to six differing bits… » | (6) ne commence pas par Yes / No / un chiffre | — | commencer par le chiffre : « 6 differing bits (Normal, the default)… » |
| image-comparison | FAQ 3 | « A pixel whose red, green, blue or transparency value differs… » | (6) ne commence pas par Yes / No / un chiffre | — | « 16 out of 255: a pixel counts as changed when… » |
| image-resizer | FAQ 3 | « The original's by default… » | (6) ne commence pas par Yes / No / un chiffre | — | « Does it keep my format? » → « Yes by default… » |
| image-resizer | FAQ 4 | « Usually, when you shrink the picture… » | (6) idem | — | « Yes, usually: … » |
| famille des filtres (add-noise, add-text-to-image, add-vignette, brightness-contrast, grayscale-converter, image-blur, image-cropper, image-flip, image-inverter, image-pixelator, sepia-filter) | About | « JPG, PNG and WebP keep their format[; / , other formats become / are saved as PNG] » | (5) la même phrase, à la ponctuation ou à 3 mots près, sur 11 pages bâties sur le même gabarit (consigne : aucune phrase identique entre filtres) ; comptée une fois par page dans les lignes ci-dessus | comparaison (n-gramme « jpg png and webp keep their format other » sur 5 pages ; phrase exacte sur 2 paires) | sortir le format de l'About (il est déjà dans `specs` « Output format ») ou l'écrire avec ce que fait l'outil (« The negative is saved as… ») |

Note hors liste (défaut de l'outil, pas du texte) : Image Metadata Viewer dit « No embedded metadata (EXIF, GPS, IPTC,
XMP, ICC) in this file. » pour tout WebP, y compris un WebP qui contient un GPS (`page.jsx:59-61, 86` ; exifr sans WebP).
Le message d'erreur de `encodeWebpWasm` propose « Choose JPG, PNG or AVIF » alors que Image Resizer n'offre pas AVIF
(`bigImage.js:224`) — texte d'interface, pas de la page relue.

## Bilan

- Pages relues : **19**.
- Défauts : **98** au total.
  - (1) Exactitude : **29** (dont 7 sur image-metadata : WebP annoncé lu et nettoyable alors qu'exifr ne lit pas WebP ;
    10 étapes finales et 5 méta « format gardé » faux pour GIF / BMP / AVIF ; round-corners transparence en mode couleur ;
    Image Blur « all your processor cores » ; Image Editor format et aperçu).
  - (2) Libellés : **0**.
  - (3) Lieu de traitement / promesse de confidentialité : **8** (« only / alone / nothing else » sur le rapport d'erreur,
    qui contient aussi l'outil, le navigateur et sa version, et est compté par réseau) : add-text-to-image,
    brightness-contrast, grayscale-converter, image-cropper, image-inverter, image-metadata, image-pixelator, round-corners.
  - (4) Invérifiable : **2** (image-blur « the smooth blur photo editors use », grayscale-converter « how modern screens…
    compute gray »).
  - (5) Générique / dupliqué : **34** (étape 1 identique sur 8 pages + 1 quasi ; About « JPG, PNG and WebP keep their
    format… » sur 11 pages ; phrase de traitement identique sur 4 pages ; FAQ « JPG saved again at quality 92 » sur 6 ;
    étape 4 identique Flip / Inverter ; tip « Each click… starts again » sur 2).
  - (6) Structure : **25** réponses de FAQ qui ne commencent pas par Yes / No / un chiffre. Titres, méta, About, étapes
    et nombre de FAQ conformes partout.
  - (7) Exemple : **0** (aucune page d'image n'a d'exemple ; non exigé).
- Défauts par page : add-border-to-image 5, add-noise 5, add-text-to-image 6, add-vignette 4, brightness-contrast 6,
  duplicate-image-finder 2, grayscale-converter 8, image-blur 6, image-comparison 1, image-cropper 4, image-editor 4,
  image-flip 8, image-inverter 7, image-metadata 9, image-pixelator 6, image-resizer 2, image-rotate 5, round-corners 5,
  sepia-filter 5.
- Pages **sans aucun défaut** : **aucune**.

## Deuxième passe (06/10)

J'ai relu en entier les 19 pages corrigées : texte SEO, `metadata` et chaînes d'interface (sous-titres sous le H1, zones
d'envoi, messages). J'ai appliqué la même liste de contrôle et les précisions de fin de `CONSIGNES-REDACTION.md`.
Contrôles relancés : `content-verify --only=image-tools/` donne 0 échec, `instructions.mjs` donne 0 libellé faux,
`privacy-claims.mjs` donne 0 échec. Aucune phrase de mes pages n'est identique à une phrase d'une autre page.
Toutes les FAQ commencent bien (Yes / No / chiffre, ou réponse directe pour « Which / What »).

Les 98 défauts de la première passe sont corrigés. La nouvelle chaîne d'interface d'Image Metadata (`page.jsx:86`) est
exacte. Il reste 19 défauts, en majorité nés des nouvelles formulations.

| Page | Endroit | Phrase (citation courte) | Problème | Preuve (fichier:ligne ou calcul) | Correction proposée |
|---|---|---|---|---|---|
| add-border-to-image | étape 4 | « keeps the original's format, or becomes a PNG for a GIF, BMP or AVIF » | (1) La phrase dit que tous les formats sauf GIF, BMP et AVIF sont gardés. C'est faux : tout ce qui n'est pas JPEG ou WebP sort en PNG, y compris HEIC (ouvert par Safari), TIFF (Safari), SVG et ICO. | `app/lib/imageOutput.js:122-125` ; `sourceTypeOf` `:244-248` | « …keeps the format of a JPG, PNG or WebP; any other picture becomes a PNG » |
| add-text-to-image | étape 4 | « a GIF, BMP or AVIF photo comes back as a PNG, other photos keep their format » | (1) Même défaut : « other photos » inclut HEIC, TIFF et SVG, qui sortent en PNG. | idem | « …JPG, PNG and WebP keep their format, any other photo comes back as PNG » |
| image-pixelator | étape 4 | « GIF, BMP and AVIF originals come back as PNG, the others keep their format » | (1) Même défaut. | idem | idem |
| image-rotate | About | « presets … keep the original format » … « GIF, BMP and AVIF files are saved as PNG » | (1) Même défaut : HEIC, TIFF et SVG sortent aussi en PNG. | idem | « …JPG, PNG and WebP keep their format; every other format is saved as PNG » |
| add-noise | méta description | « JPG, PNG and WebP stay as they are » | (1) Faux au sens littéral : l'image reçoit du grain et un JPG ou WebP est ré-encodé. C'est le format qui est gardé. | `add-noise/page.jsx:59` | « …JPG, PNG and WebP keep their format » |
| image-flip | étape 4 | « JPG, PNG and WebP stay as they were » | (1) Même ambiguïté : l'image est retournée, seul le format reste. | `image-flip/page.jsx` (flip + `encodeRasterLike`) | « …JPG, PNG and WebP keep their format » |
| image-inverter | méta description | « JPG, PNG and WebP stay in format » | (6) Anglais incorrect. | — | « …JPG, PNG and WebP keep their format » |
| add-vignette | FAQ 4 | « only the brightness of the outer area changes » | (1) Faux dans deux cas. Un JPG ou WebP est ré-encodé en entier à la qualité 92, donc tous les pixels peuvent bouger. Avec « Clear centre » à 0 (réglage par défaut), l'assombrissement commence dès le centre. | `add-vignette/page.jsx` (`addColorStop(0, …)`, `size` = 0 par défaut) ; `imageOutput.js:122-140` | « No. … nothing is cropped or scaled; a JPG or WebP is saved again at quality 92. » |
| duplicate-image-finder | privacy | « reported to us along with the browser's name and version » | (3) Le nom de l'outil n'est pas cité. La précision du 06/10 demande de dire exactement ce qui part : message nettoyé, nom de l'outil, nom et version du navigateur. | `app/lib/reportError.js:142-155` (champ `tool`) | ajouter « the tool's name » |
| image-comparison | privacy | « reported to us with the browser's name and version » | (3) Même manque. | idem | idem |
| image-flip | privacy | « the cleaned text of that message and the browser's name and version » | (3) Même manque. | idem | idem |
| image-metadata | privacy | « reported to us with the browser's name and version » | (3) Même manque. | idem | idem |
| image-resizer | privacy | « reported to us with your browser's name and version » | (3) Même manque. | idem | idem |
| round-corners | privacy | « we receive its cleaned text with the browser's name and version » | (3) Même manque. | idem | idem |
| sepia-filter | privacy | « reach us as cleaned text, with the browser's name and version » | (3) Même manque. | idem | idem |
| brightness-contrast / image-metadata | privacy | « If an error message is displayed, its cleaned text is reported to us with … » | (5) Les 13 premiers mots sont identiques sur les deux pages : phrase quasi identique. | comparaison par n-grammes de 8 mots | reformuler l'une des deux, par exemple en même temps que la correction (3) d'Image Metadata |
| image-rotate | privacy | « …is reported to us as cleaned text, with the tool and browser names and the browser version, without the picture » | (5) Quasi identique à la phrase d'add-vignette (« …reported to us as cleaned text, with the tool and browser names and the browser version, never with the picture »). Les deux pages sont des filtres du même gabarit. | comparaison | formulation propre |
| image-editor | privacy | « …reported to us as cleaned text with the tool and browser names and the browser version, without the photo » | (5) Même phrase quasi identique (add-vignette, image-rotate). | comparaison | formulation propre |
| image-editor | interface (zone d'envoi) | « Click or drop an image here » | (1) Chaîne codée en dur, affichée aussi sur téléphone, où l'on ne peut ni cliquer ni déposer un fichier. Les autres pages utilisent `UploadPrompt`, qui affiche « Choose an image » sur écran tactile. La rédactrice l'a vu mais l'a laissé tel quel. | `image-editor/page.tsx:266` ; `app/components/UploadPrompt.jsx` | `<UploadPrompt what="an image" />` |

**Bilan de la deuxième passe**
- 19 pages relues ; **19 défauts restants**.
- Par point : (1) 9 · (2) 0 · (3) 7 · (4) 0 · (5) 3 · (6) 1 · (7) 0.
- Pages **sans aucun défaut** : grayscale-converter, image-blur, image-cropper.
- Défauts du code déjà connus, hors texte, à mettre au plan :
  - Image Metadata ne lit pas les métadonnées des WebP.
  - Le message d'erreur WebP (`bigImage.js:224`) propose AVIF, qu'Image Resizer n'offre pas.
  - Dans Image Editor, la bordure reste carrée par-dessus les coins arrondis.
