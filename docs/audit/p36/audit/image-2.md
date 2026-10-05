# P36 lot 2 — audit « image-2 » (19 outils, lecture seule)

Source du texte servi : `docs/audit/p36/contenu-avant.json`. Code lu : `app/tools/image-tools/<outil>/page.jsx` (ou `page.tsx`),
`layout.tsx`, et les modules importés (`app/lib/imageOutput.js`, `app/lib/bigImage.js`, `app/lib/canvasFilters.js`,
`app/lib/imageSimilarity.js`, `app/lib/stripMetadata.js`, `app/lib/fileChecks.js`, `app/lib/mediaSupport.js`,
`app/components/FileDownload.jsx`, `AnimatedImageNote.jsx`, `UploadPrompt.jsx`, `FileDropBridge.jsx`, `app/lib/useToolError.js`).
Dans la colonne « code », `page.jsx:NN` / `layout.tsx:NN` = fichier de l'outil de la ligne ; les autres chemins sont complets.

Faits communs (vérifiés une fois, valables pour toutes les lignes qui les citent) :
- **Règle de format de sortie des filtres** (`encodeRasterLike`) : JPEG → JPEG qualité 92, WebP → WebP qualité 92 (libwebp
  en WebAssembly là où le navigateur n'encode pas le WebP : Safari), **tout autre type → PNG** (GIF, BMP, AVIF, HEIC/TIFF
  ouverts par Safari, SVG…) — `app/lib/imageOutput.js:120-142`. Donc un JPEG ou un WebP est **ré-encodé avec perte**.
- **Limite fixe de taille** : au-delà de 268 435 456 pixels (268 Mpx), refus avec message avant décodage —
  `app/lib/imageOutput.js:77-81` (`RASTER_MAX_PIXELS`). WebP limité à 16 383 px de côté — `app/lib/bigImage.js:222-224`.
- **Animations** : un GIF / APNG / WebP animé ne garde que sa première image, annoncé avant le traitement —
  `app/components/AnimatedImageNote.jsx:5-20`.
- **Le fichier d'origine n'est jamais modifié** : chaque clic relit le fichier choisi (`loadRaster(file)`) et produit un
  nouveau fichier nommé `<nom>-<suffixe>.<ext>` — `app/lib/download.js:108-111`, `app/lib/imageOutput.js:147-149`.
- Aucune requête vers `app/api/*` sauf `/api/report-error` (texte du message d'erreur affiché, jamais le fichier) —
  `app/lib/useToolError.js:38-43,55-66`, `app/lib/reportError.js:16,163-169`. Encodeurs WebAssembly téléchargés depuis le
  site lui-même (`/wasm/…`) — `app/lib/bigImage.js:179-186`. Pas d'inscription, pas de quota pour ces 19 outils.
- Phrases répétées mesurées dans `docs/audit/p36/unicite-avant.json` (champ `repeated`) : « it accepts common formats your
  browser can open, such as jpg, png, and webp » (15 pages), « click the upload area and select an image from your device »
  (14), « yes, it's completely free with no registration required » (12), « the result keeps your image's format… » (12),
  « there's no fixed size limit… » (8), « your image is never uploaded to a server » (6), « yes, it's completely free with
  no signup required » (92).

## add-border-to-image

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| add-border-to-image | titre | « Add Border to Image — Let You Add a Solid-color Border » | MINCE | `layout.tsx:5` : titre tronqué (« Let You » sans sujet), aucune information | Titre complet : bordure unie de 1 à 100 px, couleur au choix, format conservé |
| add-border-to-image | méta | « a solid-color border of any width » | FAUX | `page.jsx:65` : curseur `min="1" max="100"` | « de 1 à 100 px » |
| add-border-to-image | about | « a solid-color border of any width around a photo » | FAUX | `page.jsx:65` : 1 à 100 px | « de 1 à 100 px » |
| add-border-to-image | étape 1 | « Click the upload area and select an image from your device. » | GÉNÉRIQUE | 14 pages (unicite-avant.json) | Étape propre à l'outil (ou fusionner avec le choix de largeur/couleur) |
| add-border-to-image | étape 4 | « save your bordered PNG image » | FAUX | `page.jsx:48` → `app/lib/imageOutput.js:122-126` : JPG reste JPG, WebP reste WebP ; PNG seulement pour PNG et autres types | « dans le format de l'original (PNG pour GIF/BMP/AVIF…) » |
| add-border-to-image | FAQ 1 | « It accepts common formats your browser can open, such as JPG, PNG, and WebP. » | FORMAT | `page.jsx:61` accept `image/*` ; `app/lib/imageOutput.js:124` : GIF, BMP, AVIF… sortent en PNG (non dit) ; animé → 1re image (`AnimatedImageNote.jsx:18`). Phrase aussi présente sur 15 pages | Dire : GIF/BMP/AVIF acceptés → PNG ; animation → première image seulement |
| add-border-to-image | FAQ 2 | « There's no fixed size limit — … limited only by your device's available memory. » | FAUX | `app/lib/imageOutput.js:77-81` : refus au-delà de 268 Mpx ; WebP ≤ 16 383 px de côté (`app/lib/bigImage.js:222-224`) | « jusqu'à 268 mégapixels ; un WebP au plus 16 383 px de côté » |
| add-border-to-image | astuce 2 | « Use thicker borders for smaller images and thinner borders for larger images… » | GÉNÉRIQUE | Conseil d'esthétique copiable ailleurs. Fait utile non dit : la bordure s'AJOUTE autour (image finale W+2×bordure, `page.jsx:40`) | Remplacer par : la largeur est en pixels de l'image réelle, ajoutée de chaque côté |
| add-border-to-image | astuce 4 | « Since nothing is uploaded, download your result right away — it isn't saved anywhere after you leave the page. » | GÉNÉRIQUE | Même phrase sur add-text, add-vignette ; le navigateur demande confirmation avant de quitter tant que le fichier n'est pas pris (`app/components/FileDownload.jsx:69-81`) | Fait propre ou suppression |

## add-noise

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| add-noise | about | « It's a single adjustable-intensity effect — not a choice of different noise types » | TROMPEUR | `page.jsx:77` : case « Colour noise (each colour channel its own grain) » ; `page.jsx:50-55` : bruit identique sur R,G,B (monochrome) ou un tirage par canal (couleur) | Dire : intensité 1-100, grain monochrome par défaut ou couleur |
| add-noise | méta + about | « by adding random variation to each pixel's brightness » | TROMPEUR | Vrai en monochrome seulement ; en mode couleur chaque canal varie séparément (`page.jsx:51-54`). Bruit uniforme entre −intensité et +intensité (`page.jsx:45-49`) | « variation aléatoire uniforme de ±intensité par pixel (ou par canal en mode couleur) » |
| add-noise | étape 1 | « Click the upload area and select an image from your device. » | GÉNÉRIQUE | 14 pages | Étape propre |
| add-noise | étape 4 | « save your noisy PNG image » | FAUX | `page.jsx:59` → `app/lib/imageOutput.js:122-126` | « dans le format de l'original » |
| add-noise | FAQ 1 | « Yes, Add Noise is completely free with no watermarks or subscriptions required. » | GÉNÉRIQUE | Formule « Is X free? Yes… » | Supprimer ou remplacer par un fait propre |
| add-noise | FAQ 2 | « It accepts common formats your browser can open, such as JPG, PNG, and WebP. » | FORMAT | `page.jsx:72` accept `image/*` ; autres types → PNG (`app/lib/imageOutput.js:124`), animé → 1re image (`page.jsx:74`) | Voir add-border FAQ 1 |
| add-noise | FAQ 3 | « there's a single grain effect with an adjustable intensity slider — no separate noise-type selector » | TROMPEUR | `page.jsx:77` : option couleur/monochrome ; distribution uniforme (pas gaussienne) `page.jsx:49` | « Pas de gaussien ni sel-et-poivre : bruit uniforme, monochrome ou couleur » |
| add-noise | FAQ 4 | « Is my image data secure and private? Yes — everything happens locally in your browser. Your image is never uploaded to a server. » | GÉNÉRIQUE | Phrase répétée (6 pages) | Une seule mention de confidentialité, avec un fait propre |
| add-noise | astuce 1 | « Start with a lower intensity and increase it gradually… » | GÉNÉRIQUE | — | Supprimer |
| add-noise | astuce 2 | « Add Noise works well on photos with good lighting and clear subjects, since grain can obscure fine detail on darker images. » | INVÉRIFIABLE | Aucune mesure dans `docs/audit/` | Supprimer |
| add-noise | astuce 3 | « Re-upload your original image if you want to try a different intensity from scratch. » | FAUX | `page.jsx:38` : chaque clic sur « Add Noise » repart du fichier d'origine ; rien à recharger | « Changez l'intensité et cliquez à nouveau : le calcul repart toujours de l'original » |
| add-noise | astuce 4 | « Use a lighter touch on portraits and a heavier one on landscapes… » | GÉNÉRIQUE | — | Supprimer |

## add-text-to-image

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| add-text-to-image | titre | « Add Text to Image — Overlay a Single Line Online Free » | FAUX | `page.jsx:72` : `text.split(/\r?\n/)`, plusieurs lignes ; libellé « Text (Enter for a new line) » `page.jsx:99` | Titre sans « Single Line » |
| add-text-to-image | méta | « overlays a single line of text onto your photo » | FAUX | `page.jsx:72,99` | « une ou plusieurs lignes » |
| add-text-to-image | about | « no design skills or software installation needed » | GÉNÉRIQUE | Formule passe-partout | Supprimer |
| add-text-to-image | étape 1 | « Click the upload area and select an image from your device. » | GÉNÉRIQUE | 14 pages | Étape propre |
| add-text-to-image | FAQ 1 | « It accepts common formats your browser can open, such as JPG, PNG, and WebP. » | FORMAT | `page.jsx:95` accept `image/*` ; autres → PNG, animé → 1re image (`page.jsx:97`) | Voir add-border FAQ 1 |
| add-text-to-image | FAQ 3 | « an outline of any colour and width » | TROMPEUR | `page.jsx:118` : contour 0 à 30 px ; couleur libre `page.jsx:119` | « contour de 0 à 30 px » |
| add-text-to-image | FAQ 4 | « Do I need to create an account to use this tool? No, it's completely free with no account or login required. » | GÉNÉRIQUE | — | Supprimer ou fait propre |
| add-text-to-image | astuce 1 | « Use a color that contrasts clearly with your image so the text stays readable. » | GÉNÉRIQUE | — | Supprimer |
| add-text-to-image | astuce 2 | « Preview a few font sizes to find one that fits your image without running off the edges. » | TROMPEUR | Pas d'aperçu en direct : il faut cliquer « Apply Text » à chaque essai (`page.jsx:55-85,121`) ; la taille (10-800 px, `page.jsx:101`) est en pixels de l'image réelle : 40 px est minuscule sur une photo de 4 000 px | « Taille en pixels de la photo (10-800) : sur une photo de téléphone, partez de 150-300 px ; cliquez Apply Text pour voir » |
| add-text-to-image | astuce 4 | « Since nothing is uploaded, download your result promptly… » | GÉNÉRIQUE | Voir add-border astuce 4 | Supprimer |

## add-vignette

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| add-vignette | about | « Adjust the intensity with a single slider » | FAUX | `page.jsx:66-67` : deux curseurs, « Intensity » (1-100 %) et « Clear centre » (0-90 %) | Citer les deux curseurs |
| add-vignette | étape 1 | « Click the upload area and select an image from your device. » | GÉNÉRIQUE | 14 pages | Étape propre |
| add-vignette | FAQ 1 | « It accepts common formats your browser can open, such as JPG, PNG, and WebP. » | FORMAT | `page.jsx:62` accept `image/*` ; autres → PNG, animé → 1re image | Voir add-border FAQ 1 |
| add-vignette | FAQ 2 | « There's no fixed size limit… » | FAUX | `app/lib/imageOutput.js:77-81` (268 Mpx) | Dire la limite |
| add-vignette | FAQ 3 | « No, there's a single intensity slider — the radial gradient always spans from the image's edges to its center, with no separate size control. » | FAUX | `page.jsx:16,41,67` : « Clear centre » garde un centre intact sur 0-90 % du rayon | « Oui : Clear centre règle la zone centrale non assombrie » |
| add-vignette | FAQ 4 | « no quality is lost in the process » | TROMPEUR | Résolution conservée, mais un JPG/WebP est ré-encodé en qualité 92 (`page.jsx:50`, `app/lib/imageOutput.js:122-138`) | « Même taille en pixels ; un JPG est réenregistré en qualité 92 » |
| add-vignette | astuce 1 | « Start with a lower intensity and increase it gradually… » | GÉNÉRIQUE | — | Supprimer |
| add-vignette | astuce 2 | « Vignettes work especially well on portraits… » | GÉNÉRIQUE | — | Supprimer |
| add-vignette | astuce 4 | « Since nothing is uploaded, download your result right away… » | GÉNÉRIQUE | Voir add-border astuce 4 | Supprimer |

## brightness-contrast

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| brightness-contrast | titre | « Brightness and Contrast — Let You Adjust an Image's » | MINCE | `layout.tsx:5` : titre tronqué | Titre complet (luminosité, contraste, saturation) |
| brightness-contrast | méta | « with two sliders, applied via the browser's canvas filter » | FAUX | `page.jsx:61-63` : trois curseurs (Brightness, Contrast, Saturation, 0-200 %) ; sans `ctx.filter` (Safari) le calcul est fait pixel par pixel (`page.jsx:33-43`, `app/lib/canvasFilters.js:1-34`) | « trois curseurs ; même résultat sur tous les navigateurs » |
| brightness-contrast | about | « adjust an image's brightness and contrast with two sliders, applied via the browser's canvas filter » | FAUX | idem | idem + citer Saturation |
| brightness-contrast | étapes 2-3 | (aucune mention de la saturation) | MINCE | `page.jsx:63` : curseur « Saturation » absent des étapes | Ajouter le curseur Saturation |
| brightness-contrast | étape 1 | « Click the upload area and select an image from your device. » | GÉNÉRIQUE | 14 pages | Étape propre |
| brightness-contrast | FAQ 1 | « Is Brightness and Contrast free to use? Yes, it's completely free with no registration required. » | GÉNÉRIQUE | 12 pages | Supprimer |
| brightness-contrast | FAQ 2 | « It accepts common formats your browser can open, such as JPG, PNG, and WebP. » | FORMAT | `page.jsx:57` accept `image/*` ; autres → PNG, animé → 1re image | Voir add-border FAQ 1 |
| brightness-contrast | FAQ 3 | « No, all image processing happens in your browser. Your images are never uploaded to a server. » | GÉNÉRIQUE | Phrase répétée | Fusionner en une mention |
| brightness-contrast | astuce 1 | « Start with small adjustments and fine-tune gradually rather than large jumps. » | GÉNÉRIQUE | — | Supprimer |
| brightness-contrast | astuce 2 | « Increase contrast to make a flat, dull photo pop… » | GÉNÉRIQUE | — | Supprimer |
| brightness-contrast | astuce 3 | « Use the brightness slider to fix underexposed or overexposed photos. » | GÉNÉRIQUE | — | Remplacer par l'échelle réelle (100 % = inchangé, 0-200 %) |
| brightness-contrast | astuce 4 | « If a result isn't quite right, re-upload the original and try again with different values. » | FAUX | `page.jsx:30` : chaque « Apply » repart du fichier d'origine | « Changez les valeurs et cliquez Apply : on repart toujours de l'original » |

## duplicate-image-finder

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| duplicate-image-finder | méta | « flags pairs that are byte-for-byte identical » | TROMPEUR | Aussi la même image redimensionnée/réenregistrée par dHash 64 bits (`page.jsx:62`, `app/lib/imageSimilarity.js:14-49`) | « copies exactes (SHA-256) et même image en autre taille/qualité/format » |
| duplicate-image-finder | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | 92 pages | Supprimer |
| duplicate-image-finder | astuce 2 | « An amber match between two files of different sizes usually means one is a smaller copy… keep the larger one. » | TROMPEUR | L'outil n'affiche ni poids ni dimensions des fichiers (`page.jsx:89,94` : nom et « N/64 matching » seulement) | Dire qu'il faut vérifier la taille dans le gestionnaire de fichiers, ou ne pas l'évoquer |

## grayscale-converter

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| grayscale-converter | titre | « Grayscale Converter — Turn a Color Image Online Free » | MINCE | `layout.tsx:5` : titre tronqué (« Turn a Color Image » sans complément) | Titre complet |
| grayscale-converter | méta | « by averaging each pixel's red, green, and blue values » | FAUX | Méthode par défaut = luminance Rec. 709 (`page.jsx:22,35`) ; la moyenne n'est qu'une des 7 méthodes (`page.jsx:14-20`) | « luminance Rec. 709 par défaut, 6 autres méthodes, noir et blanc pur à seuil » |
| grayscale-converter | FAQ 1 | « It accepts common formats your browser can open, such as JPG, PNG, and WebP. » | FORMAT | `page.jsx:70` accept `image/*` ; autres → PNG, animé → 1re image | Voir add-border FAQ 1 |
| grayscale-converter | FAQ 2 | « There's no fixed size limit… » | FAUX | `app/lib/imageOutput.js:77-81` | Dire 268 Mpx |
| grayscale-converter | FAQ 3 | « No, the original resolution is preserved — only the color information is changed. » | TROMPEUR | `page.jsx:58` : JPG/WebP ré-encodés qualité 92 (`app/lib/imageOutput.js:122-138`) ; l'image reste en RVB (3 canaux identiques, `page.jsx:54`) | « Même taille en pixels ; un JPG est réenregistré en qualité 92 » |
| grayscale-converter | FAQ 5 | « Can I convert multiple images at once? No, the tool converts one image at a time — there's no batch upload. » | GÉNÉRIQUE | Même Q/R sur 3 pages | Supprimer |
| grayscale-converter | astuce 1 | « Well-lit portraits with clear contrast tend to convert to grayscale most effectively. » | GÉNÉRIQUE | — | Supprimer |
| grayscale-converter | astuce 3 | « Try converting a few different photos to see which ones look best in black and white. » | GÉNÉRIQUE | — | Supprimer |
| grayscale-converter | astuce 4 | « Grayscale images work well for formal documents, resumes, and prints… » | GÉNÉRIQUE | — | Supprimer |

## image-blur

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| image-blur | titre | « Image Blur — Apply a Uniform Blur Effect Across Your Online » | MINCE | `layout.tsx:5` : titre cassé (« Across Your Online ») | Titre complet |
| image-blur | about | « with the browser's own blur filter where it has one, and otherwise (Safari, iPhone) computed on all your device's processor cores » | FAUX | `page.jsx:37` : `const native = false && …` — le filtre du navigateur n'est JAMAIS utilisé ; partout : processeur graphique (WebGL2) d'abord, sinon tous les cœurs (`page.jsx:46,56`; `docs/audit/RAPPORT-p17-30-09.md:124-127`) | « calculé sur le processeur graphique, sinon sur tous les cœurs, dans tous les navigateurs ; bords répétés, pas de cadre clair » |
| image-blur | étape 1 | « Click the upload area and select an image from your device. » | GÉNÉRIQUE | 14 pages | Étape propre |
| image-blur | FAQ 1 | « Is Image Blur really free to use? Yes, it's completely free with no registration required. » | GÉNÉRIQUE | 12 pages | Supprimer |
| image-blur | FAQ 2 | « It accepts common formats your browser can open, such as JPG, PNG, and WebP. » | FORMAT | `page.jsx:73` accept `image/*` ; autres → PNG, animé → 1re image | Voir add-border FAQ 1 |
| image-blur | FAQ 3 | « No, your images are processed entirely in your browser and are never uploaded to a server. » | GÉNÉRIQUE | Phrase répétée | Fusionner |
| image-blur | astuce 2 | « crop out the sensitive area first if you only want to obscure part of a photo » | TROMPEUR | Recadrer ne garde QUE la zone ; aucun outil du site ne recolle la zone floutée dans la photo (flou global `page.jsx:41-60`) | Dire simplement : pas de flou partiel |
| image-blur | astuce 4 | « Download your result before navigating away… » | GÉNÉRIQUE | — | Supprimer |

## image-comparison

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| image-comparison | méta | « two images stacked with a draggable vertical divider » | FAUX | Le trait (`page.jsx:96-98`) n'a aucun gestionnaire ; la position se règle avec le curseur « Slider: N% » sous l'image (`page.jsx:100`) | « une ligne de séparation que l'on déplace avec le curseur Slider » |
| image-comparison | about | « two images stacked with a draggable vertical divider » | FAUX | idem | idem |
| image-comparison | about | « as Diffchecker's image compare does » | INVÉRIFIABLE | Aucun rapport de comparaison dans `docs/audit/` | Supprimer la référence à un tiers |
| image-comparison | FAQ 1 | « It accepts common formats your browser can open, such as JPG, PNG, and WebP. » | FORMAT | `page.jsx:69,73` accept `image/*` ; refus au-delà de 100 Mpx par image (`page.jsx:30`) non dit ; le message d'erreur cite « JPG, PNG, WebP or GIF » (`page.jsx:33`) | Formats + limite de 100 Mpx par image |
| image-comparison | astuce 2 | « Drag the slider slowly across areas you want to inspect closely. » | GÉNÉRIQUE | — | Supprimer |
| image-comparison | astuce 4 | « Tiny differences from JPEG re-compression stay below the 16/255 threshold, so only real changes are painted. » | INVÉRIFIABLE | Seuil 16 réel (`page.jsx:49-50`), mais aucune mesure sur des JPEG réenregistrés dans `docs/audit/` ; dépend de la qualité | « Un pixel compte comme différent au-delà de 16/255 sur un canal » sans promesse sur le JPEG |

## image-cropper

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| image-cropper | méta | « by entering exact X, Y, width, and height values in pixels » | FAUX | Uniquement des curseurs `type="range"` (`page.jsx:105-108`), aucun champ de saisie | « en réglant X, Y, largeur et hauteur au pixel près avec des curseurs, ou un ratio prédéfini » |
| image-cropper | étape 1 | « Click the upload area and select an image from your device. » | GÉNÉRIQUE | 14 pages | Étape propre |
| image-cropper | FAQ 1 | « It accepts common formats your browser can open, such as JPG, PNG, and WebP. » | FORMAT | `page.jsx:94` accept `image/*` ; autres → PNG (`page.jsx:83`, `app/lib/imageOutput.js:124`) ; pas d'avertissement d'animation sur cette page (l'image affichée est dessinée telle quelle, `page.jsx:82`) | Voir add-border FAQ 1 |
| image-cropper | FAQ 2 | « Is Image Cropper really free to use? Yes, it's completely free with no registration required. » | GÉNÉRIQUE | 12 pages | Supprimer |
| image-cropper | FAQ 4 | « No, your images are processed locally in your browser and are never uploaded to a server. » | GÉNÉRIQUE | Phrase répétée | Fusionner |
| image-cropper | astuce 4 | « Crop one image at a time — there's no batch processing option. » | GÉNÉRIQUE | — | Supprimer |

## image-editor

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| image-editor | méta | « a free, full-featured photo editor » | INVÉRIFIABLE | 4 onglets, 15 réglages (`page.tsx:249-319`) ; pas de recadrage, de calques, d'annulation, de flou | « éditeur simple : réglages, rotation par quarts de tour, miroir, effets, décor » |
| image-editor | about | « a free, full-featured photo editor » | INVÉRIFIABLE | idem | idem |
| image-editor | about | « Adjust colors, transform and crop » | FAUX | Aucun réglage de recadrage (`page.tsx:287-319`) | Retirer « crop », renvoyer à Image Cropper |
| image-editor | about | « then download the result as a PNG » | FAUX | `page.tsx:223-225` : format de la photo conservé (JPG reste JPG, WebP reste WebP) ; PNG seulement avec coins arrondis ou autre format source | « dans le format de la photo ; PNG si coins arrondis » |
| image-editor | FAQ 1 | « Yes, it's completely free with no signup and no limit on how many images you can edit. » | GÉNÉRIQUE | Formule « Is X free? » ; fait non dit : 100 Mpx au plus par image (`page.tsx:54-55`) | Remplacer par la limite réelle |
| image-editor | FAQ 3 | « transforms (rotate, flip, pixelate) … decorations (rounded corners, borders, text overlay) » | TROMPEUR | Rotation par pas de 90° seulement (`page.tsx:298`, `step="90"`) ; texte : une ligne, Arial, 12-72 px, position fixe en haut à gauche (`page.tsx:173-176,315-317`) ; coins 0-100 px, bordure 0-20 px tracée DANS l'image (`page.tsx:168-172,312-313`) | Donner ces bornes |
| image-editor | astuce 3 | « Combine desaturation with a vignette for a quick vintage or moody look. » | GÉNÉRIQUE | — | Supprimer |
| image-editor | astuce 4 | « Rounded corners and a border are a fast way to turn a photo into a ready-to-use avatar or card image. » | TROMPEUR | La bordure est un rectangle droit tracé APRÈS la découpe des coins (`page.tsx:159-172`) : ses angles restent carrés par-dessus les coins transparents | Ne pas conseiller la combinaison ; renvoyer à Round Corners + Add Border |

## image-flip

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| image-flip | about | « mirrors your image horizontally or vertically » (2 phrases au total) | MINCE | Bouton « Flip Both Ways » (= demi-tour 180°) absent (`page.jsx:30,54`) ; format conservé, chaque clic repart de l'original (`page.jsx:26`) non dits | Citer les trois boutons et la règle de format |
| image-flip | étape 1 | « Click the upload area and select an image from your device. » | GÉNÉRIQUE | 14 pages | Étape propre |
| image-flip | étape 4 | « save your flipped PNG image » | FAUX | `page.jsx:35` → `app/lib/imageOutput.js:122-126` | « dans le format de l'original » |
| image-flip | FAQ 1 | « Is Image Flip really free to use? Yes, it's completely free with no registration required. » | GÉNÉRIQUE | 12 pages | Supprimer |
| image-flip | FAQ 2 | « It accepts common formats your browser can open, such as JPG, PNG, and WebP. » | FORMAT | `page.jsx:47` accept `image/*` ; autres → PNG, animé → 1re image (`page.jsx:49`) | Voir add-border FAQ 1 |
| image-flip | FAQ 3 | « No, this tool only mirrors horizontally or vertically. » | TROMPEUR | Aussi les deux à la fois (`page.jsx:30,54`) | « horizontal, vertical ou les deux (180°) » |
| image-flip | FAQ 4 | « Yes, images are processed entirely in your browser and are never uploaded to a server. » | GÉNÉRIQUE | Phrase répétée | Fusionner |
| image-flip | astuce 1 | « Use horizontal flip to create a mirror image for design symmetry or artistic compositions. » | GÉNÉRIQUE | — | Supprimer |
| image-flip | astuce 3 | « PNG output preserves transparency, so any transparent background in your source image carries over. » | TROMPEUR | La sortie n'est PNG que pour un PNG (ou autre type) en entrée ; un WebP transparent reste WebP transparent (`app/lib/imageOutput.js:122-126`) | « La transparence est conservée (PNG et WebP) » |
| image-flip | astuce 4 | « Flip one image at a time — there's no batch processing built in. » | GÉNÉRIQUE | — | Remplacer par : les clics ne se cumulent pas (chaque bouton repart de l'original, `page.jsx:26`) |

## image-inverter

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| image-inverter | about | « creates a photo-negative effect by subtracting… from 255 … Your image is never uploaded to a server. » | MINCE | Deux phrases ; non dits : transparence conservée (alpha intact, `page.jsx:30-34`), format conservé, limite 268 Mpx | Ajouter ces faits |
| image-inverter | étape 1 | « Click the upload area and select an image from your device. » | GÉNÉRIQUE | 14 pages | Étape propre |
| image-inverter | étape 4 | « save your inverted PNG image » | FAUX | `page.jsx:37` → `app/lib/imageOutput.js:122-126` | « dans le format de l'original » |
| image-inverter | FAQ 1 | « It accepts common formats your browser can open, such as JPG, PNG, and WebP. » | FORMAT | `page.jsx:49` accept `image/*` ; autres → PNG, animé → 1re image (`page.jsx:52`) | Voir add-border FAQ 1 |
| image-inverter | FAQ 2 | « There's no fixed size limit… » | FAUX | `app/lib/imageOutput.js:77-81` | Dire 268 Mpx |
| image-inverter | FAQ 3 | « Do I need to create an account to use Image Inverter? No, it's completely free and requires no account or login. » | GÉNÉRIQUE | — | Supprimer |
| image-inverter | FAQ 4 | « Can I invert multiple images at once? No… » | GÉNÉRIQUE | Même Q/R sur 3 pages | Supprimer |
| image-inverter | astuce 1 | « Inverted images can make for striking, high-contrast visuals… » | GÉNÉRIQUE | — | Supprimer |
| image-inverter | astuce 2 | « Try inverting black-and-white photos for unusual, artistic results. » | GÉNÉRIQUE | — | Supprimer |
| image-inverter | astuce 3 | « Download both the original and inverted versions if you want to compare them side by side. » | GÉNÉRIQUE | L'original est déjà sur l'appareil (jamais modifié) | Supprimer (ou renvoyer à Image Comparison) |
| image-inverter | astuce 4 | « Invert one image at a time and download each before starting the next. » | GÉNÉRIQUE | Redit la FAQ 4 | Supprimer |

## image-metadata

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| image-metadata | titre | « Image Metadata Viewer — Read Basic File Information Online » | TROMPEUR | Lit aussi EXIF, GPS, IPTC, XMP, ICC (`page.jsx:49`) et retire les métadonnées (`page.jsx:76`) | Titre : voir et supprimer EXIF/GPS |
| image-metadata | méta | « reads basic file information … — name, size, type, dimensions, and date » | TROMPEUR | idem ; « date » = date de dernière modification du fichier (`page.jsx:41`), la date de prise de vue vient de l'EXIF | Citer EXIF/GPS et la suppression |
| image-metadata | about | « shows everything stored in an image » | FAUX | `page.jsx:49` : `ifd1: false` (vignette/IFD1 non lus), seuls les groupes tiff/exif/gps/iptc/xmp/icc/interop sont demandés | « affiche les métadonnées EXIF, GPS, IPTC, XMP et ICC » |
| image-metadata | FAQ 1 | « Is Image Metadata Viewer free to use? Yes, it's completely free with no signup required. » | GÉNÉRIQUE | 92 pages | Supprimer |

## image-pixelator

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| image-pixelator | about | « averaging blocks of pixels at a size you choose » (2 phrases) | MINCE | Mode « % of the picture » (1-20 % du petit côté, `page.jsx:17-19,44,64-65`) non dit ; moyenne pondérée par l'alpha (`app/lib/imageOutput.js:32-51`) | Citer les deux unités et leurs bornes |
| image-pixelator | étape 1 | « Click the upload area and select an image from your device. » | GÉNÉRIQUE | 14 pages | Étape propre |
| image-pixelator | étape 2 | « Adjust the pixel size slider (2–50px) to set the block size. » | TROMPEUR | Vrai en mode « In pixels » ; l'autre mode « % of the picture » (1-20 %) n'est pas dit (`page.jsx:64-66`) | Ajouter le choix d'unité |
| image-pixelator | étape 4 | « save your pixelated PNG image » | FAUX | `page.jsx:49` → `app/lib/imageOutput.js:122-126` | « dans le format de l'original » |
| image-pixelator | FAQ 1 | « Is Image Pixelator really free to use? Yes, it's completely free with no registration required. » | GÉNÉRIQUE | 12 pages | Supprimer |
| image-pixelator | FAQ 2 | « It accepts common formats your browser can open, such as JPG, PNG, and WebP. » | FORMAT | `page.jsx:62` accept `image/*` ; autres → PNG, animé → 1re image (`page.jsx:69`) | Voir add-border FAQ 1 |
| image-pixelator | FAQ 3 | « Yes, all processing happens locally in your browser — your image is never uploaded to a server. » | GÉNÉRIQUE | Phrase répétée | Fusionner |
| image-pixelator | astuce 2 | « crop out just the area you want obscured first if you don't want the rest pixelated » | TROMPEUR | Recadrer ne garde que la zone ; rien ne la recolle dans la photo | Dire : pas de pixellisation partielle |
| image-pixelator | astuce 3 | « Try a couple of pixel sizes on a copy of your image » | TROMPEUR | L'original n'est jamais modifié (`page.jsx:40`), aucune copie nécessaire | « Essayez plusieurs tailles : chaque clic repart de l'original » |
| image-pixelator | astuce 4 | « Pixelate one image at a time — there's no batch processing option. » | GÉNÉRIQUE | — | Supprimer |

## image-resizer

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| image-resizer | méta | « Resize JPG, PNG and WebP … in the original format » | FORMAT | accept `image/*` (`page.jsx:131`) : GIF, BMP, AVIF… acceptés et enregistrés en PNG avec une note (`page.jsx:109-110`) ; menu « Save as » JPG / PNG / WebP (`page.jsx:156-163`) et « Quality » 10-100 (`page.jsx:164-167`) non dits | Citer « Save as » et Quality, et les autres formats d'entrée |
| image-resizer | about | « keeps the image in its original format » | FORMAT | Par défaut seulement (`page.jsx:34,158`) ; conversion possible vers JPG/PNG/WebP | idem |
| image-resizer | about + étape 2 | « by exact pixels or by percentage » / « or 'By percentage' » | TROMPEUR | Pourcentage = 3 boutons « 25% / 50% / 75% smaller » seulement (`page.jsx:16,148-150`), pas de valeur libre ni d'agrandissement en % | « réduire de 25, 50 ou 75 % » |
| image-resizer | FAQ 2 | « On Safari, which cannot write WebP, a WebP is saved as PNG and the page says so. » | FAUX | `page.jsx:105,111` → `app/lib/imageOutput.js:120-141` : WebP encodé par libwebp en WebAssembly sur Safari, le WebP reste WebP ; aucune note de ce genre (`page.jsx:109,114`) | « Un WebP reste un WebP, Safari compris » |
| image-resizer | FAQ 3 | « Yes, if you untick 'Do not enlarge'. » | LIBELLÉ | Libellé réel : « Do not enlarge if the image is smaller » (`page.jsx:153`) | Citer le libellé exact |
| image-resizer | astuce 2 | « Social media: 1080 px wide suits most feeds. » | INVÉRIFIABLE | Aucune source dans le dépôt | Supprimer ou sourcer |
| image-resizer | astuce 3 | « Use 'By percentage' to halve a photo in one click. » | TROMPEUR | Il faut « By percentage » puis « Resize » (50 % est présélectionné, `page.jsx:30`) : deux clics | « 'By percentage' → '50% smaller' → Resize » |

## image-rotate

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| image-rotate | about | « turns your image by a preset (90°, 180°, 270°) or custom angle… » (1 phrase) | MINCE | Non dits : sens horaire (`page.jsx:52`), saisie au 0,5° (`page.jsx:53`), fond transparent ou coloré (`page.jsx:54-57`), quarts de tour exacts, autres angles rééchantillonnés et toile agrandie (`app/lib/imageOutput.js:197-219`) | Ajouter ces faits |
| image-rotate | étape 1 | « Click the upload area and select an image from your device. » | GÉNÉRIQUE | 14 pages | Étape propre |
| image-rotate | étape 4 | « save your rotated PNG image » | FAUX | `page.jsx:35` : format conservé pour 90/180/270° et pour fond coloré ; PNG seulement pour un angle libre avec fond transparent | Dire la règle |
| image-rotate | FAQ 1 | « Is Image Rotate really free to use? Yes, it's completely free with no registration required. » | GÉNÉRIQUE | 12 pages | Supprimer |
| image-rotate | FAQ 2 | « A rotation by 90, 180 or 270 degrees keeps your image's format (JPG stays JPG). » | FORMAT | GIF, BMP, AVIF… sortent toujours en PNG (`app/lib/imageOutput.js:124`) ; animé → 1re image (`page.jsx:61`) | Préciser |
| image-rotate | FAQ 3 | « No, the pixels are redrawn at the same resolution with no compression applied. » | FAUX | JPG/WebP ré-encodés qualité 92 (`app/lib/imageOutput.js:122-138`) ; angle libre : rééchantillonnage bilinéaire sur une toile plus grande (`app/lib/imageOutput.js:197-198,211-219`) | « Quarts de tour : pixels déplacés sans rééchantillonnage ; JPG réenregistré en qualité 92 ; autres angles rééchantillonnés » |
| image-rotate | FAQ 4 | « Can I rotate multiple images at once? No… » | GÉNÉRIQUE | Même Q/R sur 3 pages | Supprimer |
| image-rotate | astuce 1 | « Preview the rotated result before downloading to confirm the angle is what you wanted. » | GÉNÉRIQUE | — | Supprimer |
| image-rotate | astuce 3 | « Keep your original file as a backup before rotating, in case you want to start over. » | TROMPEUR | L'original n'est jamais modifié ; le résultat est un nouveau fichier « -rotated » (`page.jsx:35`, `app/lib/download.js:108-111`) | Supprimer |

## round-corners

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| round-corners | étape 1 | « Click the upload area and select an image from your device. » | GÉNÉRIQUE | 14 pages | Étape propre |
| round-corners | étape 2 | « Adjust the corner radius slider (1–50%) » | TROMPEUR | Rayon = % de la MOITIÉ du petit côté (`page.jsx:41`) : 50 % = quart du petit côté, jamais un cercle (contrairement au CSS) | « 50 % = rayon égal au quart du petit côté » |
| round-corners | étape 4 | « save your rounded PNG image » | TROMPEUR | Un JPG avec « Corners in » une couleur reste JPG (`page.jsx:52-53`) | « PNG, ou JPG si coins colorés sur un JPG » |
| round-corners | FAQ 1 | « It accepts common formats your browser can open, such as JPG, PNG, and WebP. » | FORMAT | `page.jsx:53` : tout sauf JPG+couleur sort en PNG — un WebP devient PNG même avec coins colorés (non dit) ; animé → 1re image (`page.jsx:76`) | Préciser |
| round-corners | FAQ 1 | « a JPG stays a JPG (a much lighter file) » | INVÉRIFIABLE | Aucune mesure dans `docs/audit/` | « en général plus léger » ou mesurer |
| round-corners | FAQ 2 | « There's no fixed size limit… » | FAUX | `app/lib/imageOutput.js:77-81` | Dire 268 Mpx |
| round-corners | FAQ 4 | « Do I need to create an account to use Round Corners? No… » | GÉNÉRIQUE | — | Supprimer |
| round-corners | astuce 1 | « Use a radius around 10–15% for subtle rounding on profile pictures and thumbnails. » | GÉNÉRIQUE | — | Remplacer par la définition du % |
| round-corners | astuce 2 | « Try higher radius values (20–30%+) for a softer, more contemporary look. » | GÉNÉRIQUE | — | Supprimer |
| round-corners | astuce 3 | « Preview the result before downloading… » | GÉNÉRIQUE | — | Supprimer |

## sepia-filter

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| sepia-filter | about | « applies a warm, vintage brown tone … standard sepia color matrix, with an adjustable intensity slider » | MINCE | Deux phrases ; non dits : intensité 0-100 % (100 par défaut, 0 = inchangé, `page.jsx:15,54`), matrice de la fonction CSS sepia() (`page.jsx:34-36`), format conservé, transparence conservée | Ajouter ces faits |
| sepia-filter | étape 1 | « Click the upload area and select an image from your device. » | GÉNÉRIQUE | 14 pages | Étape propre |
| sepia-filter | étape 4 | « save your sepia-toned PNG image » | FAUX | `page.jsx:40` → `app/lib/imageOutput.js:122-126` | « dans le format de l'original » |
| sepia-filter | FAQ 1 | « Is Sepia Filter completely free to use? Yes, it's 100% free with no subscriptions required. » | GÉNÉRIQUE | — | Supprimer |
| sepia-filter | FAQ 2 | « It accepts common formats your browser can open, such as JPG, PNG, and WebP. » | FORMAT | `page.jsx:52` accept `image/*` ; autres → PNG, animé → 1re image (`page.jsx:56`) | Voir add-border FAQ 1 |
| sepia-filter | FAQ 3 | « No, your images are processed directly in your browser and are never uploaded to a server. » | GÉNÉRIQUE | Phrase répétée | Fusionner |
| sepia-filter | FAQ 4 | « Can I upload an image by pasting a URL? No, only file upload from your device is supported… » | GÉNÉRIQUE | Q/R passe-partout | Supprimer |
| sepia-filter | astuce 1 | « Use high-resolution source images since the sepia effect preserves the original resolution. » | GÉNÉRIQUE | — | Supprimer |
| sepia-filter | astuce 2 | « Try different intensity levels to find the balance… » | GÉNÉRIQUE | — | Supprimer |
| sepia-filter | astuce 3 | « Sepia works especially well on portraits and landscapes for a nostalgic look. » | GÉNÉRIQUE | — | Supprimer |
| sepia-filter | astuce 4 | « Download a few versions at different intensities if you want to compare before picking a favorite. » | GÉNÉRIQUE | — | Supprimer |

## Affirmations vérifiées et justes (non reprises dans les tableaux, pour mémoire)
- « Nothing is uploaded » / « never uploaded » : vrai pour les 19 outils (aucun envoi du fichier ; seul le TEXTE d'un message
  d'erreur part vers `/api/report-error`, `app/lib/useToolError.js:38-43`).
- Image Blur « 1 to 20 px », « full resolution », « even 48 MP iPhone photos » : `image-blur/page.jsx:77` ; mesures 12/24/48 Mpx
  dans `docs/audit/RAPPORT-p17-30-09.md:141,206-208` et `docs/audit/RAPPORT-p16-photos-iphone-30-09.md:95`.
- Duplicate Image Finder seuils 3/6/10 bits, SHA-256, dHash : `duplicate-image-finder/page.jsx:23,86`, `app/lib/imageSimilarity.js`.
- Image Metadata « without re-encoding », ICC et orientation gardés, JPG/PNG/WebP seulement : `app/lib/stripMetadata.js:1-5,119-125`.
- Image Comparison seuil 16/255, image 2 mise à l'échelle de l'image 1, téléchargement PNG : `image-comparison/page.jsx:45-54,84-86`.
- Image Cropper ratios 1:1, 4:3, 3:2, 16:9, 9:16, 4:5, 2:1 et cadre sur l'aperçu : `image-cropper/page.jsx:21,93`.
- Image Editor « Save image » puis « Download », « Save / Share » sur iPhone/iPad : `image-editor/page.tsx:325,328`, `app/components/FileDownload.jsx:207-218`.

## Synthèse du lot image-2 (19 outils lus)
| Type | Nombre |
|---|---|
| FAUX | 32 |
| INVÉRIFIABLE | 7 |
| TROMPEUR | 24 |
| GÉNÉRIQUE | 73 |
| MINCE | 10 |
| LIBELLÉ | 1 |
| FORMAT | 17 |
| **Total** | **164** |
