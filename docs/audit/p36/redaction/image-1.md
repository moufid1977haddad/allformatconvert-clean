# P36 — rédaction du lot « image-1 » (18 outils) — compte rendu

Écrit le 06/10/2026. Base : `docs/audit/p36/faits/image-1.json` (faits, fichier:ligne) et `docs/audit/p36/audit/image-1.md`
(149 défauts). Chaque page reçoit `howToTitle`, `specs`, `privacy`, une FAQ de 3 à 5 questions et 1 à 2 astuces. Les
chiffres viennent des constantes du code via `${…}` quand la page peut les importer, sinon d'une preuve dans
`docs/audit/p36/preuves/image-1.json`.

## Fichiers modifiés
- `app/tools/image-tools/<outil>/layout.tsx` (×18) : `title.absolute`, `description`, `openGraph.title`, `openGraph.description` seulement.
- `app/tools/image-tools/<outil>/page.jsx|tsx` (×18) : props de `<SeoContent>` seulement. Imports ajoutés (constantes déjà
  exportées, aucun effet sur le comportement) :
  - `RASTER_MAX_PIXELS` (`app/lib/imageOutput.js`) : bmp-to-png, heic-to-jpg, heic-to-png, jpg-to-png, jpg-to-webp, png-to-jpg, png-to-webp, webp-to-jpg, webp-to-png ;
  - `WEBP_MAX_SIDE` (`app/lib/bigImage.js`) : image-converter, jpg-to-webp, png-to-webp ;
  - `CANVAS_MAX_PIXELS` (`app/lib/bigImage.js`) : heic-to-jpg, tiff-to-jpg ;
  - `IOS_CANVAS_MAX_PIXELS` (`app/lib/canvasLimit.js`) : gif-to-png ;
  - `CANVAS_MAX_SIDE`, `CANVAS_MAX_AREA` (`app/lib/mediaSupport.js`) : svg-to-png.
  Constantes locales déjà présentes et réutilisées : `MAX_FILES`, `MAX_MP`, `DEFAULT_QUALITY`, `PHONE_MAX_MP` (image-compressor),
  `ALL_SIZES`, `DEFAULT_SIZES` (png-to-ico), `PREVIEW_CHARS` (image-to-base64), `MAX_MEGAPIXELS`, `MOBILE_MAX_MEGAPIXELS`,
  `MAX_FILE_SIZE_LABEL` (image-converter), `TIFF_DECODE_TIMEOUT_MS` (tiff-to-jpg, tiff-to-png).
- `docs/audit/p36/preuves/image-1.json` : 24 preuves pour les nombres écrits en dur.

## Chaînes d'interface corrigées (audit : FAUX)
- `app/tools/image-tools/image-converter/page.tsx:355` : `'it is written without loss.'` → `'it is written without lossy compression.'`
  (faux pour ICO, redimensionné, et pour BMP, aplati sur blanc ; « sans compression avec perte » est vrai pour PNG, BMP, TIFF, ICO).
- `app/tools/image-tools/image-converter/page.tsx:407` : carte `title: 'Instant'` → `title: 'Local'` (RAW : 10 à 58 s, AVIF : quelques secondes).
Laissés tels quels (TROMPEUR, pas FAUX, donc hors du droit de modifier l'interface) : sous-titre « Convert images to PNG,
JPG, WebP or AVIF » (9 sorties en réalité, `page.tsx:246`), « Conversion runs in the background — this tab stays
responsive. » (`page.tsx:247`), carte « 100% Private ». À trancher par le propriétaire.

## Par outil

Mots = texte SEO visible (About + étapes + FAQ + astuces avant ; + specs + privacy après), estimés depuis le source.

| Outil | Mots avant → après | Titre (car.) | Méta (car.) |
|---|---|---|---|
| bmp-to-png | 216 → 377 | BMP to PNG Converter — Same Pixels in a Lossless PNG (52) | Save a Windows .bmp bitmap as a PNG with identical pixels and the same name. The bitmap is opened by your browser on this page, never uploaded. (143) |
| gif-to-png | 261 → 427 | GIF to PNG — First Frame, or Every Frame in a ZIP (49) | Save a GIF as a PNG picture, or split an animated GIF into numbered PNG frames packed in one ZIP. Decoded in your browser; the GIF is never uploaded. (149) |
| heic-to-jpg | 252 → 427 | HEIC to JPG Converter — Pick the JPEG Quality, Free (51) | Turn an iPhone HEIC or HEIF photo into a JPG with a quality slider. Safari decodes it natively, other browsers use heic2any. Never uploaded. (140) |
| heic-to-png | 219 → 360 | HEIC to PNG — Lossless Copy of an iPhone Photo, Free (52) | Save an iPhone HEIC or HEIF photo as a lossless PNG, with no quality setting to choose. The photo is decoded on your own device, never uploaded. (144) |
| ico-to-png | 299 → 402 | ICO to PNG — Extract Every Icon Size as a Separate PNG (54) | Turn a Windows .ico icon into PNG: take its largest image, or every size stored inside as separate PNG files or one ZIP. All in your browser. (141) |
| image-converter | 868 → 669 | Image Converter — HEIC, RAW, PSD to JPG, PNG, WebP & More (57) | Convert a batch of images to WebP, PNG, JPG, AVIF, GIF, BMP, TIFF, ICO or PDF. Opens HEIC, PSD, SVG and camera RAW files, all in your browser. (142) |
| image-to-base64 | 262 → 557 (exemple compris) | Image to Base64 Encoder — Data URI, img Tag, CSS or JSON (56) | Encode an image file as Base64 text: a data URI, plain Base64, an HTML img tag, a CSS background rule or JSON. Copy it, or save it as a .txt file. (146) |
| jpg-to-png | 229 → 340 | JPG to PNG Converter — Lossless Copy for Editing, Free (54) | Convert a JPG or JPEG photo into a PNG at full size, stored the right way up. Made on this page by your browser; the photo is never uploaded. (141) |
| jpg-to-webp | 261 → 386 | JPG to WebP Converter — Set Quality or Go Lossless, Free (56) | Turn a JPG photo into WebP with a quality from 1 to 100 or a lossless mode, and see the size in KB before and after. Done in your browser. (138) |
| png-to-ico | 356 → 417 | PNG to ICO — Multi-Size favicon.ico, Choose the Sizes (53) | Build a real multi-resolution favicon.ico from one PNG: pick the icon sizes and fit or crop a non-square image. Made in your browser, never uploaded. (149) |
| png-to-jpg | 236 → 345 | PNG to JPG Converter — Pick the Background for Transparency (59) | Convert a PNG to JPG with a quality slider (92 to start) and the colour of your choice for transparent areas. Encoded in your browser, not uploaded. (148) |
| png-to-webp | 283 → 366 | PNG to WebP — Keep Transparency, Lossy or Lossless (50) | Convert a PNG to WebP and keep its transparent areas. Pick a quality from 1 to 100, or lossless mode for screenshots and logos. In your browser. (144) |
| svg-to-png | 323 → 381 | SVG to PNG — Choose the Pixel Size and Background, Free (55) | Rasterize an SVG into a PNG at the width and height you set, or 512, 1024 or 2048 px wide, on a transparent or coloured background. In-browser. (143) |
| tiff-to-jpg | 360 → 485 | TIFF to JPG Converter — Any Page of a Multi-Page TIFF (53) | Convert a TIF or TIFF scan or photo to JPG, with a quality slider and a choice of page for multi-page files. Decoded in a background worker. (140) |
| tiff-to-png | 309 → 391 | TIFF to PNG Converter — Lossless, Transparency Kept, Free (57) | Turn a TIF or TIFF image into a lossless PNG that keeps transparency, and choose the page of a multi-page file. Read in a background worker. (140) |
| webp-to-jpg | 207 → 335 | WebP to JPG Converter — Quality and Background Colour (53) | Convert a WebP image to JPG, set the JPG quality and the colour that replaces transparent areas. Decoded and encoded in your browser, not uploaded. (147) |
| webp-to-png | 207 → 310 | WebP to PNG Converter — For Apps That Do Not Open WebP (53) | Save a WebP image as a lossless PNG that keeps its transparency, for programs that do not open WebP. Converted on this page by your browser. (140) |
| image-compressor | 642 → 645 (exemple compris) | Image Compressor — JPG, PNG, WebP, AVIF and SVG, Format Kept (60) | Compress up to 20 images at once, each kept in its own format, by quality or to a size in KB. MozJPEG, PNG palettes and SVGO, all in your browser. (146) |

### Affirmations supprimées ou corrigées (renvois à l'audit `audit/image-1.md`)
- **FAUX (20/20 traités)** : « There's no fixed size limit » (bmp, heic-to-png, jpg-to-webp, png-to-webp, webp-to-jpg) → limite
  268 Mpx tirée de `RASTER_MAX_PIXELS`, plus 16 383 px de côté en WebP (`WEBP_MAX_SIDE`) ; « There's no quality slider »,
  « become white », « flatten the image in an editor » (png-to-jpg, webp-to-jpg) → curseur et couleur décrits ; « only the
  first page is converted » ×4 (tiff-to-jpg, tiff-to-png) → choix de page décrit ; « no per-size selector » et astuce 4
  (ico-to-png) → « Every size in this icon » décrit ; tiff-to-png « pixels copied as-is » → réduction à 8 bits, CMYK→RGB,
  profil non appliqué ; image-converter « Instant », « instantly », « written without loss » (astuce + interface).
- **INVÉRIFIABLE (8/8 supprimés)** : « wait a few seconds » (heic ×2), « about a minute or two… on a phone », « AVIF gives the
  smallest files », « as iLoveIMG and CloudConvert do », « the best online compressors », « the leading online
  compressor » (la mesure est conservée, avec sa date, dans l'exemple d'image-compressor), « 100% Private » retiré du
  texte SEO (la carte d'interface reste, voir plus haut).
- **TROMPEUR** : « using the HTML canvas » retiré de toutes les méta/about ; heic2any présenté comme le chemin des
  navigateurs autres que Safari ; ICO de l'Image Converter « 16 px up to 256 px, never above the image's own size » ;
  plafond « phones and iPads » ; HEIC sur la page seulement hors Safari ; vérification SVG « tolerated anti-aliasing
  differences » au lieu de « exactly » ; transparence AVIF/SVG dans le compresseur ; Copy Base64 copie la forme choisie ;
  boîte de 100 000 caractères ; « Keep all four sizes » (png-to-ico) supprimé ; Windows Vista et plus pour les ICO à entrées PNG.
- **GÉNÉRIQUE (63)** : toutes les FAQ « Is X free? », « install software », « one file at a time » génériques, et astuces
  « Keep a backup », « Check after downloading », « Convert one file at a time… » supprimées ; la question « plusieurs
  fichiers ? » n'est gardée que là où elle renvoie à un lot réel (Image Converter, ZIP).
- **LIBELLÉ (2)** : « Click Convert » → « the "Convert" button, which names the number of files and the format » ;
  « Click 'Compress' » → « "Compress image" (or "Compress" followed by the number of images) ».
- **FORMAT (5)** : titre et about d'Image Converter (9 sorties) ; formats acceptés et 5 sorties d'Image to Base64 ; AVIF
  dans le compresseur.
- **MINCE (19)** : chaque page a désormais ses limites, son nom de fichier de sortie, ses réglages et ses messages réels.

### Exemples
- **image-to-base64** : exemple exécuté le 06/10. Fichier PNG 1 × 1 rouge de 69 octets construit en Node (`zlib`), puis
  reproduction exacte du code de la page : `data:image/png;base64,` + Base64 des octets (ce que rend `FileReader.readAsDataURL`
  pour un fichier `image/png`), puis la ligne 23 de `page.jsx` pour la forme JSON
  (`JSON.stringify({ name: fileName, mime, base64: b64 })`). Commande : `node px.mjs` (scratchpad de la session). FileReader
  n'existe pas en Node : c'est la reproduction de l'algorithme, dite ici comme la consigne le demande.
- **image-compressor** : exemple tiré de la mesure datée du 23/09/2026 (`docs/audit/RAPPORT-ecarts-marche.md` §3b, tableau
  l. 116-118), citée avec sa source dans la légende. Aucun autre exemple (outils fichiers sans mesure publiée).

### Contrôles (06/10)
- `node scripts/p36/content-verify.mjs --only=image-tools/` : 0 échec (37 pages de la catégorie, lot image-2 compris) ;
  part maximale de phrases identiques du site 14,3 % (paire PDF, hors lot).
- `node scripts/content-checks/instructions.mjs` : 0 écart (225 pages).
- `node scripts/content-checks/privacy-claims.mjs` : 0 échec.
  (Au premier lancement, le contrôle 1 s'arrêtait sur un JSON invalide dans les preuves d'un autre lot ; ce fichier a été
  corrigé par son auteur entre-temps, puis les trois contrôles ont été relancés sur l'état final.)

### Laissé de côté (non vérifiable, ou bogue de code à ne pas décrire)
- svg-to-png : aperçu cassé après conversion (`page.jsx:114`, `src={result}`) → la page ne parle plus d'aperçu.
- tiff-to-jpg : worker sans contrôle d'`OffscreenCanvas` (`tiffToJpg.worker.js:38-41`) → aucune promesse sur les anciens WebKit.
- image-converter : qualité PDF plancher 50 % (`extraFormats.js:159`) → le curseur n'est décrit que pour JPG, WebP, AVIF.
- Tailles maximales du chemin heic2any et des TIFF : aucune constante → « this page sets no pixel cap » (HEIC), rien
  d'écrit (TIFF) hors la limite de temps.
- Durées (HEIC, AVIF, 48 Mpx sur iPhone) : non écrites, sauf la mesure RAW du worker (10 s Chromium / 40 s Firefox pour 24 Mpx).

## Corrections après relecture (06/10)

Relecture : `docs/audit/p36/relecture/image-1.md`, 60 défauts. Tous ont été corrigés ; je n'en conteste aucun. Chaque
correction a été vérifiée dans le code avant d'être écrite. Les blocs SEO des 18 pages ont été réécrits en entier ;
les titres sont inchangés sauf celui de bmp-to-png.

- **#1-11, plafond de 268 Mpx présenté comme valable partout.** La valeur est désormais dite « on a computer ». Une
  ligne « On iPhone and iPad » est ajoutée sur bmp, jpg-to-png, jpg-to-webp, png-to-jpg, png-to-webp, webp-to-jpg,
  webp-to-png, les deux HEIC et svg. Elle dit qu'aucun plafond plus bas n'est fixé, que Safari donne bien moins de
  mémoire à une page, et que la plus grande photo confirmée sur un vrai iPhone fait `${PHONE_MAX_MP}` Mpx
  (`app/lib/reduceImage.js:15-19`, constante importée).
  - HEIC : « In Safari on a Mac, 268 MP ».
  - svg : quatre octets par pixel en mémoire (`imageOutput.js:262`).
  - gif : « per frame », et toutes les images sont gardées en mémoire (`gifFrames.js:36`).
- **#12, messages d'erreur de BMP.** La FAQ cite les deux messages réels : la taille au-delà de la limite, sinon
  « damaged or in a form your browser cannot open » (`imageOutput.js:81-88`).
- **#13-17, « same / identical pixels » et « one step ».** Toutes les formulations se rapportent désormais à « as your
  browser displays it ». Les pixels partiellement transparents « can shift slightly, more for nearly transparent
  pixels » (bmp, webp-to-png, png-to-webp, tiff-to-png). Le titre de bmp devient « Lossless PNG, Same Name and Size ».
- **#18, TIFF to PNG.** L'étirement du plus sombre au plus clair est maintenant dit (`tiffDecode.js:106-115`).
- **#19-23, noms de navigateurs.**
  - Le choix se fait selon que le navigateur ouvre le fichier (`imageDims`) et selon le test d'encodage, pas selon le
    nom du navigateur.
  - Tous les navigateurs sur iPhone et iPad tournent sur WebKit, comme Safari. Ils sont rangés avec Safari, et
    « Chrome, Edge, Firefox » est réservé à l'ordinateur.
  - Pages touchées : jpg-to-webp, png-to-webp, les deux HEIC (méta comprise), image-converter (privacy et FAQ) et
    base64 (FAQ 3).
- **#24, Base64 sur iPhone.** La page dit maintenant qu'une photo prise dans la photothèque arrive déjà convertie par
  iOS (`IosOriginalNote.jsx:21`). Je n'ai pas ajouté le composant : cela changerait la mise en page, ce qui est interdit.
- **#25, chargement de heic2any.** Le script est téléchargé « when you click "Convert to JPG" », seulement si le
  navigateur ne lit pas le HEIC (`heic-to-jpg/page.jsx:37`).
- **#26, tailles des encodeurs WebAssembly.**
  - Texte SEO : plus aucun chiffre.
  - Interface : le chiffre WebP est retiré. « about 1 MB » est gardé pour AVIF, prouvé par la mesure « 1.1 MB on the
    wire » (`imageConverter.worker.js:12-13`).
  - Les preuves 0.3 MB et 1 MB ont été retirées de `preuves/image-1.json`.
- **#27-28, Image Converter.**
  - Étape 3 : « For JPG, WebP, AVIF or PDF a "Quality" slider appears; PNG, GIF, BMP, TIFF and ICO have none ».
    L'étape dit seulement que le curseur existe pour PDF. Elle ne décrit pas son effet, à cause du bogue du plancher
    de 50 %.
  - ICO : « except the 16 px minimum ».
- **#29-30, compresseur.** L'About dit « unless you choose to reduce an oversized image ». La FAQ sur la qualité dit
  « Yes for JPG, WebP and AVIF, at every setting ».
- **#31-32, rapports d'erreur.**
  - Compresseur : les messages par image ne sont pas signalés (`page.jsx:153-228`, `update()` seulement). Seules les
    erreurs de page (`page.jsx:118,240`) et les plantages (`app/tools/ToolErrorWatch.jsx`) le sont.
  - svg : seuls les échecs de dessin ou d'encodage sont signalés (`page.jsx:75,84`). Les messages sur la taille et
    l'échec de chargement ne le sont pas.
  - Toutes les pages : le contenu des rapports est dit exactement (`reportError.js:142-155`). Il comprend le message
    nettoyé, le nom de l'outil, le nom et la version du navigateur. L'extension et la tranche de taille s'y ajoutent
    là où le fichier est passé (HEIC, TIFF, Image Converter).
- **#33-34, TIFF 32 bits.** Le texte dit « 1 to 32-bit integer », car les flottants n'ont pas été validés
  (`tiffDecode.js:28-35`). Les preuves ont été mises à jour.
- **#35-49, phrases génériques ou dupliquées.**
  - Questions reformulées : GPS/EXIF, transparence, iPhone, lot, PDF fusionné.
  - Fins de méta et étapes « Download » propres à chaque page.
  - Première étape propre à chaque outil (ce qui s'affiche après le choix du fichier).
  - Phrases bannies retirées : « Everything runs… », « The conversion runs in your browser. ».
  - La FAQ de lot de webp-to-png est remplacée par « Does converting restore detail a lossy WebP lost? ».
- **#50-60, réponses de FAQ.** Les questions sont devenues fermées et chaque réponse commence par Yes ou No.

### Chaînes d'interface modifiées (règle du 06/10 : textes invérifiables ou trompeurs)
- `image-converter/page.tsx:247` : « Convert images to PNG, JPG, WebP or AVIF — 100% local, nothing uploaded to any
  server. » → « Convert images to WebP, PNG, JPG, AVIF, GIF, BMP, TIFF, ICO or PDF in your browser — nothing is uploaded
  to any server. »
- `image-converter/page.tsx:248` : « Conversion runs in the background — this tab stays responsive. » → « Images are
  encoded in a background worker, one after another. »
- `image-converter/page.tsx:326` : « …(the encoder Squoosh uses): a few seconds per photo, and the first use downloads
  about 0.3 MB. » → « …(the encoder Squoosh uses), downloaded once, the first time you choose WebP. »
- `image-converter/page.tsx:331` : « …so it is slower than the other formats (a few seconds per photo) and the first use
  downloads about 1 MB. » → « …which is slower than the browser’s own encoders; the first use downloads about 1 MB. »
- `image-converter/page.tsx:406` : carte « 100% Private » → « Private ».
- `image-to-base64/page.jsx` (sous-titre sous le H1) : « Convert images to Base64 data URI » → « Encode an image file
  as Base64 text » (la page produit 5 formes).
- Rappel de la phase 2 : `image-converter/page.tsx:355` (« without lossy compression ») et `:407` (carte « Local »).

### Contrôles (06/10, état final)
- content-verify `--only=image-tools/` : 0 échec. La part maximale de phrases identiques du site est de 9,5 %, sur une
  paire PDF hors lot.
- instructions : 0 écart.
- privacy-claims : 0 échec.

### Bogues de code toujours non corrigés (plan)
- Aperçu de svg-to-png (`page.jsx:114`).
- `OffscreenCanvas` dans le worker de tiff-to-jpg.
- Plancher de qualité PDF à 50 %.

## Corrections après deuxième passe (06/10)
Les 8 défauts sont corrigés ; je n'en conteste aucun.

1. **tiff-to-png, About.** La phrase dit maintenant « Chrome, Edge and Firefox on a computer cannot do with TIFF ».
2. **tiff-to-png, FAQ 1.** La réserve est complétée : « can change slightly, more for nearly transparent ones ».
3. **image-converter, note d'interface WebP et FAQ 3.** L'encodeur est récupéré à la conversion, pas au choix du format.
   - Note d'interface `page.tsx:326` : « …downloaded once, the first time you choose WebP. » → « …fetched from our site
     when you convert to WebP. » Cette note ne s'affiche que si le navigateur n'a pas d'encodeur WebP.
   - FAQ 3 : « Each encoder is fetched from our site when you convert to its format; on a computer, Chrome, Edge and
     Firefox make WebP up to 30 megapixels with their own encoder instead. » Le seuil de 30 Mpx est prouvé par
     `config.ts:21` (`NATIVE_WEBP_MAX_PIXELS`), avec une preuve ajoutée.
4. **bmp-to-png, FAQ 3.** La question devient « Does Image Converter take a whole set of bitmaps? », réponse « Yes… ».
5. **heic-to-png, FAQ 2.** La question devient « Is the iPhone's location removed from the PNG? », réponse « Yes… ».
6. **heic-to-png, About.** La phrase « One photo per conversion. » est retirée.
7. **png-to-webp, privacy.** La phrase devient « A failed WebP encode sends us its cleaned error wording along with… ».
8. **ico-to-png, privacy.** La phrase devient « An icon that cannot be read leaves a trace in our error log: … ».

Contrôles relancés sur l'état final :
- content-verify `--only=image-tools/` : 0 échec ;
- instructions : 0 écart ;
- privacy-claims : 0 échec.
