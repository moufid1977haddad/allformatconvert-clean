# P36 — rédaction du lot « image-2 » (19 outils)

Fichiers modifiés : `app/tools/image-tools/<outil>/layout.tsx` (title.absolute, description, openGraph.title/description
seulement) et `page.jsx` / `page.tsx` (props de `<SeoContent>` seulement, `title` inchangé) pour les 19 outils ;
`docs/audit/p36/preuves/image-2.json`. **Aucune chaîne d'interface modifiée**, aucun composant partagé touché, fins de
ligne CRLF d'origine conservées (diff : 4 lignes par layout, le bloc SeoContent par page).

Nouvelle structure sur chaque page : About, `howToTitle`, 4 étapes avec libellés exacts entre guillemets, `specs`
(« Formats and limits »), `privacyTitle` = « Where your image is processed », `privacy`, 3 à 5 FAQ, 1 ou 2 astuces.
Aucun `example` : ce sont des outils de fichiers et aucun résultat daté n'existe, sauf pour Image Blur. Là, la mesure
datée (48 Mpx, simulation iPhone, 30/09, `docs/audit/RAPPORT-p17-30-09.md:206-208`) est citée dans les specs et la FAQ,
pas sous forme d'exemple.

## Titres, méta, mots
| Outil | Titre (car.) | Méta (car.) | About (mots) | Texte visible avant | après |
|---|---|---|---|---|---|
| add-border-to-image | Add Border to Image — Solid Color Frame, 1 to 100 px (52) | 143 | 118 | 285 | 543 |
| add-noise | Add Noise to Image — Film Grain, Gray or Color (46) | 150 | 102 | 263 | 506 |
| add-text-to-image | Add Text to Image — Fonts, Outline, Shadow, Rotation (52) | 143 | 117 | 328 | 555 |
| add-vignette | Add Vignette to Photo — Dark Edges, Adjustable Clear Center (59) | 136 | 101 | 275 | 464 |
| brightness-contrast | Brightness, Contrast & Saturation — Adjust a Photo Free (55) | 139 | 100 | 239 | 454 |
| duplicate-image-finder | Duplicate Image Finder — Exact and Resized Copies (49) | 146 | 98 | 260 | 484 |
| grayscale-converter | Grayscale Converter — Luminance, Channel or Pure B&W (52) | 134 | 92 | 343 | 452 |
| image-blur | Blur Image Online — Gaussian Blur 1 to 20 px, Full Size (55) | 143 | 99 | 294 | 417 |
| image-comparison | Compare Two Images — Before/After Slider and Pixel Diff (55) | 144 | 102 | 283 | 470 |
| image-cropper | Crop Image Online — Exact Pixels or Aspect Ratio Presets (56) | 135 | 104 | 338 | 462 |
| image-editor | Image Editor — Adjust, Rotate, Flip, Effects and Text (53) | 146 | 91 | 308 | 565 |
| image-flip | Flip Image — Mirror Horizontally, Vertically or Both (52) | 147 | 94 | 239 | 388 |
| image-inverter | Invert Image Colors — Photo Negative in One Click (49) | 145 | 84 | 225 | 355 |
| image-metadata | Image Metadata Viewer — EXIF, GPS, IPTC, XMP and Remover (56) | 144 | 91 | 327 | 466 |
| image-pixelator | Pixelate Image — Mosaic Blocks in Pixels or Percent (51) | 145 | 97 | 264 | 391 |
| image-resizer | Image Resizer — Resize by Pixels or Percent, Ratio Locked (57) | 147 | 99 | 227 | 466 |
| image-rotate | Rotate Image — 90°, 180°, 270° or Any Custom Angle (50) | 144 | 94 | 256 | 442 |
| round-corners | Round Corners of an Image — Transparent or Colored (50) | 137 | 97 | 281 | 412 |
| sepia-filter | Sepia Filter — Vintage Brown Tone With Intensity Slider (55) | 144 | 91 | 234 | 402 |

(« avant » = about + étapes + FAQ + astuces de `contenu-avant.json` ; « après » = about + titre et étapes + specs + privacy
+ FAQ + astuces, comptés depuis le source.)

## Affirmations supprimées (renvoi : `docs/audit/p36/audit/image-2.md`)
- **Toutes les lignes FAUX de l'audit** (32) sont supprimées ou corrigées :
  - « … PNG image » à l'étape 4 sur 8 pages : remplacé par la règle réelle de format ;
  - « no fixed size limit » (5 pages) : remplacé par 268 mégapixels ;
  - « any width » (bordure) : 1 à 100 px ;
  - « single line » (texte) ;
  - « single slider / no size control » (vignette) ;
  - « two sliders / browser's canvas filter » (luminosité) ;
  - « averaging » (gris) ;
  - « browser's own blur filter » (flou) ;
  - « draggable divider » (comparaison) ;
  - « entering exact values » (recadrage) ;
  - « crop » et « download as a PNG » (éditeur) ;
  - « Safari … WebP saved as PNG » (redimensionnement) ;
  - « no compression applied » (rotation) ;
  - « shows everything » (métadonnées) ;
  - « re-upload the original » (bruit, luminosité).
- **TROMPEUR** : toutes les lignes sont corrigées, notamment :
  - qualité 92 dite là où un JPG est réenregistré ;
  - mode couleur du bruit ;
  - contour 0 à 30 px ;
  - mode « % of the picture » ;
  - pourcentages 25/50/75 seulement ;
  - rayon des coins (50 = un quart du petit côté) ;
  - conseils « crop first » retirés ;
  - « Flip Both Ways » ;
  - bordure carrée sur coins arrondis dans l'éditeur.
- **GÉNÉRIQUE** : toutes les questions « Is X free? Yes… », « Do I need an account? », « multiple images at once? »,
  « pasting a URL? », les étapes « Click the upload area and select an image from your device » et les astuces banales sont
  supprimées.
- **INVÉRIFIABLE** supprimées :
  - « full-featured » ;
  - « as Diffchecker's image compare does » ;
  - JPEG re-compression « below the threshold » ;
  - « 1080 px suits most feeds » ;
  - « much lighter file » ;
  - « works well on photos with good lighting ».
- **FORMAT** : chaque page dit maintenant GIF/BMP/AVIF → PNG, et une animation → première image. Image Resizer cite
  « Save as » JPG/PNG/WebP et « Quality ».
- **LIBELLÉ** : « Do not enlarge » est remplacé par le libellé exact « Do not enlarge if the image is smaller ».
- Également retirée en relecture : « to hide banding in a smooth gradient » (Add Noise), non mesuré.

## Chiffres
Chaque nombre avec unité est prouvé dans `docs/audit/p36/preuves/image-2.json` (motif dans le fichier source) :
- 268 Mpx : `RASTER_MAX_PIXELS` / `CANVAS_MAX_AREA` ;
- 16,7 Mpx : `CANVAS_MAX_PIXELS` ;
- 16 383 px : `WEBP_MAX_SIDE` ;
- 32 767 px : `CANVAS_MAX_SIDE` ;
- bornes des curseurs : `min="…" max="…"` des pages ;
- 100 Mpx : comparaison et éditeur ;
- 64 bits du dHash ;
- 25/50/75 % : `PERCENTS` ;
- 1,2 × la taille de police ;
- 48 Mpx : rapport P17.

« quality 92 » (sans unité, donc non exigé par C3) est aussi prouvé.

## Contrôles (06/10)
- `node scripts/p36/content-verify.mjs --only=image-tools/` : 37 pages, **0 défaut** (les 19 pages du lot sont réécrites ;
  part maximale de phrases identiques entre pages réécrites 14,3 %, hors de ce lot).
- `node scripts/content-checks/instructions.mjs` : 225 pages, **0 mismatch**. Une première version de l'astuce d'Image
  Inverter, « with a slider », a été reformulée.
- `node scripts/content-checks/privacy-claims.mjs` : **0 échec** pour image-tools. Les 23 échecs restants concernent
  d'autres lots (pdf-merge, pdf-to-pdfa…).

## Points non vérifiables laissés de côté / à relire
- La lecture des HEIC et TIFF n'est pas promise. Les pages disent « or another picture your browser can open » : le
  support dépend du navigateur (`app/lib/fileChecks.js:212-213`).
- Image Editor : « Save / Share opens the share sheet » (`app/components/FileDownload.jsx:213-218`). Sur iPhone, au-delà
  de 16,7 Mpx, « Save image » utilise les réglages courants et non le dernier « Apply » : c'est dit dans la FAQ.
- Image Cropper : « arrow keys for one-pixel steps » est le comportement standard d'un `<input type="range">` sans `step`.
- Texte FAUX dans un composant partagé : aucun trouvé. Note : Image Editor affiche « Click or drop an image here » en
  dur, même sur téléphone (`page.tsx:266`). La chaîne n'a pas été modifiée, car le dépôt fonctionne bien sur ordinateur.

## Corrections après relecture (06/10)
Source : `docs/audit/p36/relecture/image-2.md` (98 défauts). J'ai vérifié chaque défaut dans le code avant de le
corriger, et tous sont fondés. Aucun ne contredit le code, donc aucune contestation.

**Vérifications des points principaux**
- **exifr ne lit pas WebP.** `node_modules/exifr/dist/full.esm.mjs` n'enregistre que les analyseurs `jpeg`, `png`,
  `heic`, `avif` et `tiff`. Le bouton « Remove metadata » n'apparaît que si des métadonnées sont trouvées
  (`image-metadata/page.jsx:75`).
- **Flou** : au plus 6 workers, et une seule tranche est calculée sur la page (`app/lib/blurParallel.js:18-19`).
- **Round Corners** : le mode « Corners in » remplit tout le canevas avant de dessiner (`round-corners/page.jsx:45`).
- **Image Editor** : la rotation à 90/270° sans « Apply » repeint avec les réglages courants (`page.tsx:206-221`).
- **Rapport d'erreur** : il contient le nom de l'outil, le message nettoyé, le navigateur et sa version
  (`app/lib/reportError.js:142-155`).

**Corrections faites**
- **(1) Exactitude.**
  - Image Metadata : WebP est retiré des formats lus et nettoyables (méta, About, specs, FAQ 3). Une ligne de specs
    « WebP files » dit que leurs métadonnées ne sont pas lues. Les dimensions et la date sont présentées comme
    disponibles « when the browser can display it ».
  - Chaque étape finale et chaque méta « format kept » dit maintenant « JPG, PNG, WebP gardés ; GIF, BMP, AVIF → PNG ».
  - Round Corners : FAQ WebP corrigée (le mode couleur remplit la transparence), même ajout dans la spec de sortie.
  - Image Blur : « up to six background workers when the picture is large enough », dans l'About et la privacy.
  - Image Editor : format de sortie avec PNG pour les autres formats ; FAQ 2 dit « so that the preview shows what you
    save ».
  - Image Inverter : « exactly for an opaque PNG ».
- **(3) Rapports d'erreur.** Les mots « only / alone / nothing else » sont retirés. Chaque page nomme ce qui part :
  le texte nettoyé, l'outil, le nom et la version du navigateur, jamais l'image.
- **(4) Invérifiable.** Supprimés : « the smooth blur photo editors use » et « how modern screens… compute gray »,
  remplacé par « the weights of the CSS grayscale() filter ».
- **(5) Doublons.**
  - Étapes 1 propres à chaque outil.
  - Phrase « JPG, PNG and WebP keep their format… » retirée de l'About des 11 filtres (le fait reste dans les specs et
    les étapes finales, formulé différemment sur chaque page).
  - FAQ « quality 92 » gardée seulement sur Add Border. Les autres pages ont une autre question, ou la question est
    retirée (Grayscale : 3 FAQ).
  - Le tip « Each click… starts again » ne reste que sur Add Border.
  - Phrases « Processing stays in your browser. », « The conversion runs in your browser. » et « Everything is computed
    in your browser. » remplacées.
  - Vérification par script : aucune phrase de mes 19 pages n'est identique à une autre de mes pages. Six phrases
    courtes partagées avec d'autres pages du site ont été reformulées (« Yes, a little », « Is transparency kept? »,
    « Up to 268 megapixels », « Transparency is kept », « Does it keep transparency? », « No, not by default »).
- **(6) Réponses de FAQ.** Les 25 réponses relevées sont corrigées : les questions fermées commencent par Yes / No et
  les questions de quantité par le chiffre (« 16 out of 255… », « 6 differing bits… », « 0 removes… », « 50 puts… »).
  Les réponses de moins de 25 mots ont été complétées.

**Chaînes d'interface modifiées : 1**
- `image-metadata/page.jsx:86` : « No embedded metadata (EXIF, GPS, IPTC, XMP, ICC) in this file. » devient « No
  embedded metadata (EXIF, GPS, IPTC, XMP, ICC) found in this file. The metadata of WebP files is not read here. »
- Les sous-titres sous le H1 des 19 pages ont été relus : aucun n'est faux ni invérifiable.

**Laissé tel quel (défauts de code ou libellés de référence, à mettre au plan)**
1. **Image Metadata ne lit pas WebP.** C'est une fausse absence pour la confidentialité. `app/lib/stripMetadata.js` sait
   déjà trouver les blocs EXIF/XMP du WebP.
2. **Message WebP inadapté.** `app/lib/bigImage.js:224` propose « Choose JPG, PNG or AVIF », mais Image Resizer n'a pas
   AVIF.
3. **Image Editor, bordure et coins arrondis.** La bordure reste carrée par-dessus les coins arrondis (`page.tsx:159-172`).
   Le texte d'envoi est en dur, « Click or drop an image here », même sur téléphone (`page.tsx:266`).
4. **Image Rotate, libellé de l'option fond coloré.** L'option dit « Colour (fills the corners and any transparency;
   keeps the format) » alors qu'un GIF/BMP/AVIF sort en PNG. C'est le libellé d'une option : il n'a pas été modifié,
   et la page le précise.

**Contrôles (06/10)**
- `content-verify --only=image-tools/` : 0 défaut sur mes pages. Il reste 0 à 5 défauts C3, tous sur des pages
  d'image-1 pendant les passes intermédiaires ; le dernier passage donne 0.
- `instructions.mjs` : 0 mismatch.
- `privacy-claims.mjs` : 0 échec.

## Corrections après deuxième passe (06/10)
Les 19 défauts de la deuxième passe sont corrigés, ainsi que les 3 phrases génériques relevées par C6.

**Règle de format, partout.** JPG, PNG et WebP gardent leur format ; tout autre format sort en PNG
(`app/lib/imageOutput.js:122-125`). Pages corrigées :
- étapes finales : Add Border, Add Text, Image Blur, Grayscale, Image Flip, Image Inverter, Image Pixelator, Sepia ;
- About : Add Border, Image Rotate (en accord avec le nouveau libellé de l'option fond coloré posé par le contrôleur) ;
- specs : Image Flip, Image Rotate, Image Resizer ;
- FAQ 4 d'Image Flip.

Les formulations « stay as they are / as they were / stay in format » sont remplacées par « keep their format » :
méta d'Add Noise, étape et spec d'Image Flip, méta d'Image Inverter (grammaire corrigée).

**Add Vignette, FAQ 4.** Le texte dit maintenant qu'un JPG ou WebP est réenregistré en entier à la qualité 92. La
phrase « only the outer area changes » est retirée.

**Privacy.** Le nom de l'outil est ajouté sur les 7 pages où il manquait : Duplicate Image Finder, Image Comparison,
Image Flip, Image Metadata, Image Resizer, Round Corners, Sepia. Les trois phrases quasi identiques sont reformulées :
- Image Metadata (proche de Brightness and Contrast) ;
- Image Rotate (proche d'Add Vignette) ;
- Image Editor (proche des deux précédentes).

**C6, phrases génériques.** Les fins de méta sont remplacées :
- Add Text : « Done in your browser. » devient « …drawn by your own browser. » ;
- Duplicate Image Finder : « Runs in your browser. » devient « …computed on your device. » ;
- Image Rotate : « Runs in your browser. » devient « …on your own device. ».

**Chaîne d'interface modifiée.** `image-editor/page.tsx:267` : le texte en dur « Click or drop an image here » est
remplacé par `<UploadPrompt what="an image" />`. L'écran affiche ainsi « Click or drop an image here » sur ordinateur et
« Choose an image » sur écran tactile. Il a fallu ajouter `import UploadPrompt from '@/app/components/UploadPrompt';`
(ligne 9), comme sur les autres pages d'image. Le défaut « texte d'envoi en dur » de la section précédente est donc
corrigé.

**Contrôles.**
- `content-verify --only=image-tools/` : 37 pages, 0 échec.
- `instructions.mjs` : 0 mismatch.
- `privacy-claims.mjs` : 0 échec.
- `tsc --noEmit` : aucune erreur sur image-editor.

## Corrections après troisième passe (06/10)
Les trois phrases quasi identiques relevées en troisième passe sont reformulées.
- **Image Blur, étape 4** : « Click "Download": a blurred JPG, PNG or WebP is saved in its own format, any other picture
  as a PNG. » Elle ne ressemble plus à l'étape 4 d'Add Border.
- **Image Resizer, privacy** : « If resizing fails with a message, we are sent that message once cleaned, the name
  Image Resizer, and which browser and version you used. » Elle ne ressemble plus à la phrase de Brightness and
  Contrast.
- **Image Rotate, étape 1** : « Click the upload box and pick the photo you want to straighten or turn. » Elle ne
  ressemble plus à l'étape 1 d'Image Inverter.

**Contrôles.**
- `content-verify --only=image-tools/` : 0 échec.
- `instructions.mjs` : 0 mismatch.
- `privacy-claims.mjs` : 0 échec.
