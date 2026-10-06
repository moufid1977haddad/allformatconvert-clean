# P36 — relecture indépendante « image-1 » (18 pages)

Relu le 2026-10-05, en lecture seule. J'ai vérifié chaque affirmation dans le code lui-même : pages, layouts, `app/lib/imageOutput.js`, `bigImage.js`, `tiffDecode.js`, `fileChecks.js`, `gifFrames.js`, `icoEntries.js`, `canvasLimit.js`, `mediaSupport.js`, `reportError.js`, `useToolError.js`, `FileDownload.jsx`, `AnimatedImageNote.jsx`, `image-converter/{config.ts,extraFormats.js,imageConverter.worker.js}`, `image-compressor/compress.worker.js`, `tiff-to-*/…worker.js`, `rawDecode.js`, `rawFormats.js`, `reduceImage.js`, `app/api/report-error/route.js`, plus `public/wasm/*` pour les tailles.
Les valeurs écrites en `${…}` ont été calculées depuis le code : 268 Mpx = `RASTER_MAX_PIXELS` 268 435 456 ; 16,7 Mpx ; 16 383 px ; 32 767 px ; 20 s ; 100 / 50 Mpx ; 100 MB ; 140 / 48 Mpx ; 20 fichiers ; 100 000 caractères. Toutes ces valeurs sont justes ; les défauts relevés ci-dessous portent sur autre chose.
J'ai recalculé en Node l'exemple d'Image to Base64 : 69 octets, Base64 identique, PNG valide (CRC justes, pixel ff 00 00). J'ai comparé les phrases avec les 225 pages du site (Jaccard sur les mots ; identiques et ≥ 0,75 retenues).

## Défauts

| # | Page | Endroit | Phrase (citation courte) | Problème | Preuve (fichier:ligne ou calcul) | Correction proposée |
|---|---|---|---|---|---|---|
| 1 | bmp-to-png | specs « Largest image », FAQ 2 | « 268 megapixels » | **1** Plafond du code présenté comme valable partout. Sur iPhone/iPad, 268 Mpx = 1,07 Go de RGBA en bandes : le site n'a prouvé que 48 Mpx sur téléphone, et il écrit lui-même qu'un navigateur peut refuser d'ouvrir une image dès 100 Mpx | imageOutput.js:77-82 ; bigImage.js decodeToRaster (tampon W×H×4) ; fileChecks.js:199-200 ; reduceImage.js:19 (48 Mpx « the one size proven ») ; image-compressor/page.jsx:15-16 (onglet rechargé vers 1,5-2 Go) | « 268 megapixels on a computer; on a phone or iPad, much less (memory) » ou donner la limite téléphone prouvée |
| 2 | jpg-to-png | specs « Largest photo » | « 268 megapixels » | **1** Même défaut que #1 (téléphone) | idem #1 | idem #1 |
| 3 | jpg-to-webp | specs « Largest photo », FAQ 2 | « 268 megapixels… » | **1** Même défaut que #1. Sur iPhone s'ajoute l'encodage libwebp en WebAssembly sur tout le tampon | idem #1 ; bigImage.js encodeWebpWasm | idem #1 |
| 4 | png-to-jpg | specs « Largest image » | « 268 megapixels » | **1** Même défaut que #1 (MozJPEG wasm sur iPhone : environ 4 × la taille RGBA, bigImage.js:211-214) | idem #1 | idem #1 |
| 5 | png-to-webp | specs « Largest image », FAQ 3 | « 268 megapixels… » | **1** Même défaut que #1 | idem #1 | idem #1 |
| 6 | webp-to-jpg | specs « Largest image » | « 268 megapixels » | **1** Même défaut que #1 | idem #1 | idem #1 |
| 7 | webp-to-png | specs « Largest image » | « 268 megapixels » | **1** Même défaut que #1 | idem #1 | idem #1 |
| 8 | heic-to-jpg | specs « Largest photo » | « In Safari, 268 megapixels » | **1** « Safari » inclut l'iPhone, l'appareil principal des HEIC. Seul 48 Mpx y est prouvé | idem #1 ; heic-to-jpg/page.jsx:89 | « In Safari on a Mac, 268 MP; on iPhone and iPad, photos up to 48 MP are proven » |
| 9 | heic-to-png | specs « Largest photo » | « 268 megapixels in Safari » | **1** Même défaut que #8 | heic-to-png/page.jsx:82 | idem #8 |
| 10 | svg-to-png | specs « Largest PNG » | « 32,767 px per side and 268 megapixels » | **1** Sur iPhone, `drawToRaster` construit le résultat en bandes dans un tampon de W×H×4 octets (1,07 Go à 268 Mpx), puis l'encode en PNG : même problème de mémoire que #1 | svg-to-png/page.jsx:134 ; imageOutput.js drawToRaster ; mediaSupport.js:49-56 | Préciser « on a computer » et la limite téléphone |
| 11 | gif-to-png | specs « On a computer » | « Frame extraction up to 268 megapixels per GIF » | **1** 268 Mpx est le plafond d'un seul canvas. Or **toutes** les images sont gardées en mémoire (un ImageData plein format par frame) avant l'encodage : la limite réelle dépend de frames × pixels, et un GIF animé bien plus petit peut déjà saturer la mémoire | gifFrames.js:36 (`frames.push({ imageData: ctx.getImageData(0,0,width,height) })`) ; canvasLimit.js maxCanvasPixels | « up to 268 MP per frame; a long or large animation can run out of memory first » |
| 12 | bmp-to-png | FAQ « Why is my BMP file refused? » | « the message on screen says which of the two applies » | **1** Les messages ne font pas la différence entre fichier abîmé et type de bitmap non lisible. Si le décodage échoue alors que les dimensions sont lues : « may be corrupted or in a format your browser cannot open ». Sinon : « may be damaged, or not an image renamed » | imageOutput.js:84-88 ; fileChecks.js:214 | « …the message gives the size when the bitmap is too large; otherwise it says the file is damaged or unreadable here » |
| 13 | bmp-to-png | meta + titre | « with identical pixels » / « Same Pixels » | **1** Sans réserve, ce qui est faux pour un BMP 32 bits à transparence partielle : le passage par le canvas, en alpha prémultiplié, arrondit ces pixels (jusqu'à 13 niveaux à alpha 10). L'About dit, lui, avec raison « as your browser shows them » | bigImage.js:105-114 (createImageBitmap → canvas) ; calcul : max \|c − round(round(c·a/255)·255/a)\| = 13 pour a = 10, 127 pour a = 1 | « same pixels as your browser displays them » |
| 14 | webp-to-png | FAQ 1 | « Half-transparent edge colours can be rounded by one step » | **1** Une seule « step » n'est vraie qu'à partir d'environ 50 % d'opacité. Les bords anticrénelés presque transparents bougent beaucoup plus | calcul #13 (a = 128 : 1 ; a = 64 : 2 ; a = 32 : 4 ; a = 10 : 13) | « …can change slightly, more for nearly transparent pixels » |
| 15 | png-to-webp | About + FAQ 2 | « half-transparent edge pixels can move by one step » / « rounded by one step » | **1** Même défaut que #14. Le mode lossless lit aussi `out.rgba()`, issu du canvas | png-to-webp/page.jsx:60, 76 ; calcul #13 | idem #14 |
| 16 | png-to-webp | FAQ 2 | « Yes for an opaque image: every pixel is identical » | **1** Le PNG est décodé par `createImageBitmap(blob)` sans `colorSpaceConversion:'none'`. Un PNG avec iCCP ou gAMA est donc converti en sRGB avant l'encodage, et ses pixels ne sont plus ceux du fichier | bigImage.js:105 | « identical to the PNG as your browser displays it » |
| 17 | tiff-to-png | FAQ 1 | « Yes for 8-bit grey or RGB TIFFs » | **1** Un TIFF RGB 8 bits **avec alpha** passe par `putImageData` puis `convertToBlob`. Les pixels semi-transparents sont arrondis (alpha prémultiplié), donc la copie n'est pas exacte | tiffToPng.worker.js:40-41 ; calcul #13 | « Yes for opaque 8-bit TIFFs; semi-transparent pixels can be rounded » |
| 18 | tiff-to-png | About + FAQ 1 | « brought down to 8 bits » / « reduced to 8 bits » | **1** Incomplet sur ce qui change l'image : les valeurs réellement présentes (min-max) sont **étirées** jusqu'au noir et au blanc, aussi pour 2, 4, 6, 10-32 bits, ce qui modifie le contraste. TIFF to JPG le dit ; TIFF to PNG, qui se présente comme lossless, ne le dit pas | tiffDecode.js:36-46, 106-115 | Ajouter « its darkest and brightest values are stretched to black and white » |
| 19 | jpg-to-webp | About | « Chrome, Edge and Firefox use their own WebP encoder for the lossy mode » | **1** Faux sur iPhone et iPad, où Chrome, Edge et Firefox tournent sur WebKit et n'ont pas d'encodeur WebP. Le repli libwebp s'applique, comme dans Safari | imageOutput.js:139 (try checkedBlob, sinon encodeWebpWasm) | « On a computer, Chrome, Edge and Firefox…; Safari and every iPhone/iPad browser use libwebp » |
| 20 | heic-to-jpg | About + meta | « Chrome, Edge and Firefox cannot open HEIC, so they use… heic2any » / « other browsers use heic2any » | **1** Le code choisit selon que `imageDims(file)` réussit ou non, pas selon le nom du navigateur. Sur iPhone et iPad, Chrome, Edge et Firefox (WebKit) décodent eux-mêmes le HEIC | heic-to-jpg/page.jsx:35-39 | « Browsers that can open HEIC (Safari, any iPhone/iPad browser) decode it themselves; others use heic2any » |
| 21 | heic-to-png | About | « Safari decodes HEIC natively, while Chrome, Edge and Firefox load the heic2any library » | **1** Même défaut que #20 | heic-to-png/page.jsx:33-37 | idem #20 |
| 22 | image-converter | privacy | « and, outside Safari, HEIC photos are opened on the page first » | **1** Même cause que #20 : la règle est `isHeic(file) && !dims`. Chrome sur iPhone décode le HEIC dans le worker | image-converter/page.tsx:142 | « in browsers that cannot open HEIC » |
| 23 | image-to-base64 | FAQ 3 | « Chrome, Edge and Firefox do not display HEIC or TIFF » | **1** Faux sur iPhone et iPad (moteur WebKit) | — (moteur imposé par iOS ; même logique que #20) | « on a computer, Chrome, Edge and Firefox… » |
| 24 | image-to-base64 | About + FAQ 2-3 | « its exact bytes are encoded » / « encoded byte for byte » | **1** Sur iPhone, une photo prise dans la Photothèque arrive déjà convertie par iOS (HEIC devenu JPEG) : on encode alors les octets de ce JPEG, pas ceux de l'original. La page n'affiche pas `IosOriginalNote`, contrairement à Image Compressor | IosOriginalNote.jsx:3-6, 18 ; image-to-base64/page.jsx (aucun IosOriginalNote) | Dire « the bytes of the file the browser receives » et ajouter l'avertissement iPhone (ou `<IosOriginalNote kind="photo" />`) |
| 25 | heic-to-jpg | privacy | « the heic2any script, downloaded with this page » | **1** Le script n'est pas chargé avec la page : `import('heic2any')` ne part qu'au clic sur Convert, et seulement si le navigateur ne lit pas le HEIC | heic-to-jpg/page.jsx:37 | « downloaded from our site when you convert » |
| 26 | image-converter | FAQ 3 | « downloads about 0.3 MB for WebP and about 1 MB for AVIF » | **1** Les deux chiffres ne sont pas mesurés sur la même base. Fichiers bruts : webp_enc.wasm 0,28 Mo, avif_enc.wasm **3,49 Mo**. Compressés gzip : 0,11 / 1,12 Mo. Compressés brotli : 0,09 / 0,84 Mo. Quelle que soit la base, l'un des deux chiffres est faux d'un facteur 3 environ. Les deux phrases d'interface (page.tsx:326, 331) reprennent ces mêmes chiffres | `public/wasm/` (ls -l ; gzip -c \| wc -c ; zlib.brotliCompressSync) | Une seule base, par exemple « about 0.1 MB for WebP and about 1 MB for AVIF (compressed) », ou mesurer le transfert réel sur www |
| 27 | image-converter | howTo 3 | « For JPG, WebP or AVIF, set the "Quality" slider; the lossless formats have no slider. » | **1** Le curseur existe aussi pour **PDF**, avec la mention « (photos without transparency) ». GIF, qui n'est pas sans perte (256 couleurs), n'a pas de curseur | page.tsx:20 (`QUALITY_FORMATS = ['jpg','webp','avif','pdf']`), 354-356 | « For JPG, WebP, AVIF or PDF, set "Quality"; PNG, GIF, BMP, TIFF and ICO have none » |
| 28 | image-converter | specs « Output formats » | « ICO (16 px up to 256 px, never above the image's own size) » | **1** Une image de moins de 16 px reçoit quand même une icône de 16 px, donc plus grande qu'elle | extraFormats.js:113-115 (`if (!sizes.length) sizes.push(16)`) | « …never above the image's own size, except a 16 px minimum » |
| 29 | image-compressor | About | « without changing their format or their dimensions » | **1** Absolu, alors que « Reduce to N MP then compress » change les dimensions d'une image trop grande (c'est dit plus bas, dans les specs) | page.jsx:135-145, 291 | « …without changing their format or, unless you choose to reduce an oversized image, their dimensions » |
| 30 | image-compressor | FAQ 2 | « Yes, slightly, below the top of the slider » | **1** Laisse entendre qu'en haut du curseur rien ne se perd. En réalité, JPG, WebP et AVIF sont réencodés avec perte même à 100 ; seul le PNG à 100 est sans perte | compress.worker.js encodeJpeg / encodeWebp / encodeAvif (pas de mode sans perte) ; encodePng (`quality < 100`) | « Yes for JPG, WebP and AVIF, at every setting; a PNG at 100 is repacked without loss… » |
| 31 | image-compressor | privacy | « When an image fails, the message shown for it is logged for us » | **3** Faux : les erreurs propres à chaque image (`update(it.id, { status:'error' })`) ne passent ni par `setError`/`useToolError` ni par `reportToolError`, que la page n'importe même pas. Seuls « Up to 20 images… » et l'arrêt du worker sont journalisés | page.jsx:153, 158, 162, 175, 186, 200, 228 (update) ; 118, 240 (seuls setError) | Retirer la phrase, ou dire « Only a page-level error (too many files, engine stopped) is logged… » |
| 32 | svg-to-png | privacy | « When an error is displayed, its text alone is reported » | **3** Ce n'est pas vrai pour toutes les erreurs : « could not render SVG », taille invalide et taille trop grande s'affichent sans être signalés. Seuls les deux `catch` appellent `reportShownMessage` | svg-to-png/page.jsx:60, 62, 78-81 | « Some error messages are reported… » ou signaler tous les messages dans le code |
| 33 | tiff-to-jpg | About | « 1 to 32-bit grey and RGB… are read » | **4** Aucun TIFF 32 bits **flottant** n'a été validé : le code le laisse au traitement d'UTIF2, « no real float32 TIFF was available to validate » | tiffDecode.js:28-35, 46 | « 1 to 32-bit integer grey and RGB » |
| 34 | tiff-to-png | About | « reads 1 to 32-bit grey and RGB images » | **4** Même défaut que #33 | idem | idem |
| 35 | heic-to-jpg / jpg-to-png | FAQ | « Is the photo's location data kept? » | **5** Question identique sur deux pages | heic-to-jpg/page.jsx:97 ; jpg-to-png/page.jsx:64 | Reformuler l'une, par exemple « Does the JPG carry the iPhone's GPS position? » |
| 36 | jpg-to-webp / png-to-webp (paire) | howTo dernière étape | « Click "Download" to save the WebP file. » | **5** Phrase identique sur une paire de formats, ce que la consigne interdit | jpg-to-webp/page.jsx:64 ; png-to-webp/page.jsx:66 | Différencier, par exemple « …to save the WebP, named after your photo » |
| 37 | png-to-ico / png-to-jpg | howTo 1 | « Click the upload area and pick a .png file. » | **5** Phrase identique | png-to-ico/page.jsx:159 ; png-to-jpg/page.jsx:63 | Différencier (« pick the square PNG for your icon »…) |
| 38 | gif-to-png / tiff-to-png | FAQ | « Are transparent areas kept? » | **5** Question identique (deux pages « → PNG ») | gif-to-png/page.jsx:95 ; tiff-to-png/page.jsx:193 | Reformuler l'une |
| 39 | image-converter | About (dernière phrase) | « The conversion runs in your browser. » | **5** Phrase identique sur 5 autres pages (color-converter, hex-to-text, json-to-csv, unicode-converter, grayscale-converter) | comparaison sur les 225 pages | Phrase propre à l'outil (« …in a background worker of your browser, one file after another ») |
| 40 | jpg-to-webp | meta | « Done in your browser. » | **5** Identique à json-to-php et add-text-to-image | add-text-to-image/layout.tsx:6 | Fin propre à l'outil |
| 41 | png-to-webp | meta | « In your browser. » | **5** Fragment générique, identique sur 8 pages développeur (excel-to-csv, json-to-xml…) | comparaison sur les 225 pages | idem |
| 42 | image-compressor | About (dernière phrase) | « Everything runs in your browser. » | **5** Identique à json-formatter | comparaison sur les 225 pages | idem |
| 43 | 13 pages (jpg-to-png, jpg-to-webp, gif-to-png, png-to-webp, webp-to-jpg, webp-to-png, heic-to-jpg, heic-to-png, tiff-to-jpg, tiff-to-png, bmp-to-png, png-to-ico, png-to-jpg) | howTo 1 | « Click the upload area and pick/choose a .X file » | **5** Gabarit quasi identique (Jaccard 0,67-0,83 entre paires) ; seule l'extension change | lignes : jpg-to-png:50, jpg-to-webp:61, gif-to-png:80, png-to-webp:63, webp-to-jpg:71, webp-to-png:61, heic-to-jpg:81, heic-to-png:75, tiff-to-jpg:183, tiff-to-png:178, bmp-to-png:50 | Première étape propre à chaque outil (ce qui s'affiche après le choix, le réglage à faire avant…) |
| 44 | heic-to-png / jpg-to-webp (+ heic-to-jpg) | FAQ | « Does it work in Safari on an iPhone? » / « Does it work in Safari and on an iPhone? » / « Does it work on an iPhone? » | **5** Questions quasi identiques (0,89 / 0,75) | heic-to-png:89 ; jpg-to-webp:76 ; heic-to-jpg:95 | Questions précises (« Are 48 MP iPhone photos converted whole? », « Can Safari make a real WebP? ») |
| 45 | bmp-to-png / webp-to-png (+ audio-converter) | FAQ | « Can I convert several BMP / WebP files at once? » | **5** Quasi identiques (0,78 entre elles, 0,88 avec audio-converter) ; les réponses suivent aussi le même schéma (« No. This page takes one… Image Converter accepts a batch… ZIP ») | bmp-to-png:64 ; webp-to-png:73 | Différencier question et réponse |
| 46 | heic-to-jpg / png-to-jpg (paire « → JPG ») | FAQ (réponse) | « This page converts one photo at a time. » / « …one image at a time. » | **5** Quasi identiques (0,78) | heic-to-jpg:96 ; png-to-jpg:77 | Reformuler l'une |
| 47 | png-to-jpg / webp-to-jpg (paire) | meta + howTo | « Encoded in your browser, not uploaded. » / « Decoded and encoded in your browser, not uploaded. » ; « …"Download" to save the JPG. » | **5** Quasi identiques (0,75) dans une paire de formats | png-to-jpg/layout.tsx:6, page.jsx:66 ; webp-to-jpg/layout.tsx:6, page.jsx:74 | Différencier |
| 48 | image-to-base64 | meta | « Copy it, or save it as a .txt file. » | **5** Quasi identique (0,88) à ascii-art et text-to-list (« Copy it or save a .txt file. ») | image-to-base64/layout.tsx:6 | Fin propre (« …or download it as name.base64.txt ») |
| 49 | image-converter | FAQ 5 (question) | « Can I combine several images into one PDF? » | **5** Quasi identique (0,78) à jpg-to-pdf (« Can I combine several JPGs into one PDF? ») | page.tsx:443 | « Does PDF output merge the batch into one file? » |
| 50 | ico-to-png | FAQ 1 | « The largest image in the icon… » | **6** La réponse ne commence ni par Yes/No ni par un chiffre | ico-to-png/page.jsx:100 | Question fermée : « Does "Convert" give the largest size? » → « Yes… » |
| 51 | ico-to-png | FAQ 3 | « It is left out and the page says… » | **6** idem | ico-to-png/page.jsx:102 | « Are the other sizes still offered if one image is damaged? » → « Yes… » |
| 52 | image-converter | FAQ 4 | « PNG and TIFF are written without loss. » | **6** idem | page.tsx:442 | « Do PNG and TIFF keep every pixel? » → « Yes… » |
| 53 | png-to-ico | FAQ 2 | « It depends on the "Image that is not square" choice. » | **6** idem | png-to-ico/page.jsx:173 | « Is a rectangular image stretched? » → « No… » |
| 54 | png-to-jpg | FAQ 1 | « They take the colour chosen… » | **6** idem | png-to-jpg/page.jsx:75 | « Can I choose the colour of the transparent parts? » → « Yes… » |
| 55 | tiff-to-jpg | FAQ 2 | « Because the TIFF carries a colour profile… » | **6** idem | tiff-to-jpg/page.jsx:198 | « Is the TIFF's colour profile applied? » → « No… » |
| 56 | tiff-to-jpg | FAQ 3 | « It is converted to 8 bits per channel… » | **6** idem | tiff-to-jpg/page.jsx:199 | « Can I convert a 16-bit TIFF? » → « Yes… » |
| 57 | webp-to-jpg | FAQ 2 | « It is filled with the colour picked… » | **6** idem | webp-to-jpg/page.jsx:84 | « Can I pick the colour of a transparent background? » → « Yes… » |
| 58 | webp-to-jpg | FAQ 3 | « Only the first frame is kept… » | **6** idem | webp-to-jpg/page.jsx:85 | « Does the JPG keep an animated WebP's motion? » → « No… » |
| 59 | image-compressor | FAQ 1 | « Choose "To a size of", type 100… » | **6** idem | image-compressor/page.jsx:352 | « Can I compress an image to 100 KB? » → « Yes… » |
| 60 | image-compressor | FAQ 3 | « With SVGO, which removes… » | **6** idem | image-compressor/page.jsx:354 | « Does an SVG stay a vector file? » → « Yes… » |

## Remarques hors décompte (à connaître, non comptées comme défauts de texte)
- **Bogue de code, svg-to-png/page.jsx:115** : `<img src={result}>` reçoit l'objet `{ blob, url, name }` au lieu de `result.url`, si bien que l'aperçu du PNG ne s'affiche pas. Le texte de la page ne promet aucun aperçu ; le défaut existait avant P36. Le bouton Download, lui, fonctionne (`result.url`).
- Libellés cités par leur début : « Extract all frames » (vrai libellé « Extract all frames (ZIP of PNGs) ») et « Download all » (vrai libellé « Download all (N files, ZIP) »). Le début correspond exactement, c'est la convention du site : je ne les compte pas.
- Certaines cellules de specs sont identiques d'une page à l'autre (« PNG (.png), one file », « TIFF (.tif, .tiff), one file », « JPG, quality 10 to 100 », « JPG, JPEG (.jpg, .jpeg) »). Ce sont des données de tableau, pas des phrases : je ne les compte pas.
- Exemple d'Image Compressor : les chiffres correspondent à `docs/audit/RAPPORT-ecarts-marche.md:116-118`, rapport daté du 23/09. Je ne peux pas les remesurer en lecture seule.
- Les deux phrases d'interface modifiées dans image-converter/page.tsx sont justes :
  - « it is written without lossy compression. » s'affiche pour PNG, BMP, TIFF et ICO. Aucune compression avec perte : BMP brut, TIFF non compressé, ICO en entrées PNG (extraFormats.js:1-9). C'est plus exact que l'ancien « without loss », qui était faux pour ICO (redimensionné) et BMP (alpha aplati).
  - « Local — Conversion happens in your browser » : aucun envoi au serveur dans le worker ni sur la page. Seuls partent les rapports d'erreur sans fichier.
  - En revanche, les deux lignes d'aide non modifiées (page.tsx:326, 331), avec « about 0.3 MB » et « about 1 MB », portent l'incohérence du défaut #26.
- Vérifié juste (extraits) :
  - Libellés : Convert, Convert to JPG/PNG/ICO, Quality, JPG quality, Transparent areas become, Lossless, Every size in this icon, Page, Cancel, Width (px), Keep the SVG's proportions, Background / Transparent / Colour, 512/1024/2048 px wide, Output, Copy Base64, By quality, To a size of, Output format, Download.
  - Valeurs par défaut : 80, 92, 85, 90, 78, 512 px, tailles ICO 16/32/48/256, cible 100 KB.
  - Comportements : avertissements pour les animations (WebP, APNG, GIF), recherche de qualité 10-95 en 8 essais, refus des animations par le compresseur, ZIP `gif-frames.zip`, `converted-images.zip` et `compressed-images.zip`, noms `icon-32x32-32bit.png`, `.base64.txt` et `favicon.ico`.
  - Traitement TIFF : délai de 20 s puis temps proportionnel aux pixels ; refus du stockage planaire et du CMYK autre que 8 bits ; vignettes non comptées comme pages ; profil de couleur signalé.
  - Rapports d'erreur anonymes (aucune IP : route.js:63-84, aucun champ IP).

## Bilan
- Pages relues : **18**.
- Défauts par point de la liste :
  1. Exactitude : **30** (#1-30)
  2. Libellés : **0**
  3. Lieu de traitement / confidentialité : **2** (#31, 32)
  4. Invérifiable : **2** (#33, 34)
  5. Générique / dupliqué : **15** (#35-49)
  6. Structure : **11** (#50-60 : réponses de FAQ qui ne commencent ni par Yes/No ni par un chiffre). Titres ≤ 60 caractères (49-60), méta 138-149, About 82-114 mots, 3-5 étapes, 3-5 FAQ : tout est conforme.
  7. Exemple : **0** (Base64 recalculé, exact)
- **Total : 60 défauts.**
- Pages **sans aucun défaut** : **aucune**.

## Deuxième passe (06/10)

J'ai relu entièrement les 18 pages après les « Corrections après relecture » : métadonnées, About, étapes, specs,
privacy, FAQ, conseils et exemples. J'ai aussi relu les chaînes d'interface modifiées : image-converter/page.tsx
(sous-titre, ligne de limites, notes WebP et AVIF, cartes « Private » et « Local », note « without lossy
compression ») et le sous-titre d'image-to-base64.

J'ai recalculé les valeurs `${…}`, `PHONE_MAX_MP` = 48 compris (reduceImage.js:19).

Les 60 défauts de la première passe sont corrigés, à l'exception de #45 (question de lot de bmp-to-png, voir ci-dessous).

Points vérifiés :
- Structure : titres de 49 à 60 caractères, méta de 129 à 149, About de 85 à 118 mots, 3 à 5 étapes, 3 à 5 FAQ.
- FAQ : chaque question fermée commence par Yes ou No ; chaque question « Why » commence par la réponse directe,
  conformément à la précision du 06/10.
- Rapports d'erreur : leur contenu correspond à reportError.js:142-155. Les plantages passent par
  ToolErrorWatch (app/tools/layout.tsx:26). La phrase de svg-to-png correspond à page.jsx:75 et :84.
- Le chiffre « about 1 MB » pour AVIF est prouvé : imageConverter.worker.js:12-13 indique 1,1 Mo sur le réseau.
- Comparaison avec les 225 pages : même seuil qu'en première passe, phrases identiques et similarité ≥ 0,75.

| # | Page | Endroit | Phrase (citation courte) | Problème | Preuve (fichier:ligne ou calcul) | Correction proposée |
|---|---|---|---|---|---|---|
| 1 | tiff-to-png | About | « a lossless format that every browser displays, which Chrome, Edge and Firefox cannot do with TIFF » | **1** Faux sur iPhone et iPad. Chrome, Edge et Firefox y tournent sur WebKit, qui affiche le TIFF. C'est la même correction que les #19-23, déjà faite ailleurs. | tiff-to-png/page.jsx:175 ; règle déjà appliquée dans heic-to-jpg About | « …which Chrome, Edge and Firefox on a computer cannot do with TIFF » |
| 2 | tiff-to-png | FAQ 1 | « Partly transparent pixels can be rounded slightly » | **1** « slightly » n'est vrai que pour les pixels peu transparents. Les autres pages précisent bien « more for nearly transparent pixels ». | tiff-to-png/page.jsx:191 ; tiffToPng.worker.js:40-41 ; calcul : écart de 13 à alpha 10, de 127 à alpha 1 | « …can change slightly, more for nearly transparent pixels » |
| 3 | image-converter | note d'interface WebP + FAQ 3 | « downloaded once, the first time you choose WebP » / « …the first time you choose its format » | **1** Choisir le format dans le menu ne déclenche aucun téléchargement. Le fichier wasm est récupéré par le worker au moment de la conversion, et un nouveau worker est créé à chaque clic sur Convert. De plus, sur Chrome, Edge et Firefox d'ordinateur, une image WebP de 30 Mpx ou moins utilise l'encodeur du navigateur et ne télécharge rien. | page.tsx:326, 441 ; imageConverter.worker.js encodeRaster (NATIVE_WEBP_MAX_PIXELS, config.ts:21) ; page.tsx handleConvert (`new Worker` à chaque conversion) | « …downloaded from our site when you first convert to WebP » |
| 4 | bmp-to-png | FAQ 3 (question) | « Can I convert several BMP files at once? » | **5** Toujours quasi identique (0,88) à audio-converter, « Can I convert several files at once? ». C'était le #45 : webp-to-png a été corrigé, bmp-to-png non. | bmp-to-png/page.jsx:65 | Par exemple « Does Image Converter take a whole folder of bitmaps? » |
| 5 | heic-to-png / jpg-to-png (paire « → PNG ») | FAQ (question) | « Does the PNG keep the photo's camera data? » / « Does the PNG keep the camera's EXIF data? » | **5** Quasi identiques (0,78), au sein d'une paire de formats. | heic-to-png/page.jsx:89 ; jpg-to-png/page.jsx:65 | Reformuler l'une, par exemple « Is the iPhone's location removed from the PNG? » |
| 6 | heic-to-png / jpg-to-webp | About (phrase) | « One photo per conversion. » | **5** Phrase identique sur deux pages. | heic-to-png/page.jsx:73 ; jpg-to-webp/page.jsx:59 | La retirer, ou la dire avec ce qui est propre à l'outil |
| 7 | png-to-webp | privacy (dernière phrase) | « If something fails, the cleaned error wording, the tool's name and your browser's name and version are reported to us. » | **5** Quasi identique (0,76) à audio-merger, « If a merge fails, the cleaned error message, the tool name and your browser's name and version are reported to us. » | png-to-webp/page.jsx:75 ; audio-tools/audio-merger/page.jsx:430 | Tournure propre, par exemple « A failed WebP encode sends… » |
| 8 | ico-to-png / jpg-to-webp | privacy (dernière phrase) | « When an error is shown, its cleaned wording, the tool's name and your browser's name and version are logged so that we can fix failures. » / « If an error message is shown, its cleaned text, … are logged so that we can fix the cause. » | **5** Quasi identiques (0,75). | ico-to-png/page.jsx:98 ; jpg-to-webp/page.jsx:73 | Différencier l'une des deux |

Non comptés (comme en première passe) :
- Les cellules de specs identiques (« PNG (.png), one file », « JPG, quality 10 to 100 »…), qui sont des données de tableau.
- « Click "Convert" and check the preview. » (webp-to-png) face à « Check the preview and click… » (grayscale et sepia) : même vocabulaire, mais pas la même phrase.
- Les bogues de code déjà signalés par le rédacteur et qui restent au plan :
  - aperçu de svg-to-png, page.jsx:114 ;
  - plancher de qualité PDF à 50 %, extraFormats.js:159 ;
  - OffscreenCanvas dans tiff-to-jpg.

**Bilan de la deuxième passe** : 18 pages relues, **8 défauts**.

| Point de la liste | Défauts |
|---|---|
| 1 Exactitude | 3 |
| 2 Libellés | 0 |
| 3 Lieu de traitement | 0 |
| 4 Invérifiable | 0 |
| 5 Générique / dupliqué | 5 |
| 6 Structure | 0 |
| 7 Exemple | 0 |

**Pages sans aucun défaut (10)** : gif-to-png, heic-to-jpg, image-compressor, image-to-base64 (exemple recalculé, exact),
png-to-ico, png-to-jpg, svg-to-png, tiff-to-jpg, webp-to-jpg, webp-to-png.

Pages encore en défaut (8, en comptant les deux pages de chaque paire) : tiff-to-png, image-converter, bmp-to-png,
heic-to-png, jpg-to-png, jpg-to-webp, png-to-webp, ico-to-png.
