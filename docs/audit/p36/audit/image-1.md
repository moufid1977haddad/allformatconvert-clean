# P36 lot 2 — audit du texte servi, lot « image-1 » (18 outils)

Lu le 05/10/2026, en lecture seule. Source du texte : `docs/audit/p36/contenu-avant.json` (titre = `layout.tsx:5`,
méta = `layout.tsx:6`, about/étapes/FAQ/astuces = bloc `<SeoContent>` de chaque `page.jsx`). Source des faits : le code
cité (chemins depuis la racine du dépôt). Une affirmation juste n'est pas dans les tableaux.

Rappels valables pour les 18 outils (prouvés une fois ici, cités dans les tableaux) :
- Aucun de ces outils n'appelle de route `/api/*` pour traiter le fichier ; les seuls `fetch` vont chercher des encodeurs
  WebAssembly sur le site lui-même (`/wasm/…` : `app/lib/bigImage.js:179-187`, `app/tools/image-tools/image-converter/imageConverter.worker.js:20`,
  `app/tools/image-tools/image-compressor/compress.worker.js:22`, `app/lib/rawDecode.js:19`). Aucune limite de quota, aucune
  inscription (aucune occurrence de quota/guard/login/supabase dans les 18 dossiers). Seule sortie réseau : le rapport
  d'erreur anonymisé (`/api/report-error`, `app/lib/reportError.js:3-10,16,133-169`, `app/lib/useToolError.js:15-21,42-44`) —
  jamais le fichier ni son nom réel.
- Plafond commun des outils qui passent par `loadRaster` : **268 435 456 pixels (268 Mpx)**, refus avec message
  (`RASTER_MAX_PIXELS`, `app/lib/imageOutput.js:77-82`).
- iPhone/iPad : au-delà de 16 777 216 px (`CANVAS_MAX_PIXELS`, `app/lib/bigImage.js:19`), décodage par bandes et encodage
  par WebAssembly (MozJPEG, libwebp) ou par l'écrivain PNG du site, pas par le canvas (`app/lib/bigImage.js:1-16,72-104,
  294-303` ; `app/lib/imageOutput.js:129-143,255-273`).
- WebP : jamais plus de 16 383 px de côté (`WEBP_MAX_SIDE`, `app/lib/bigImage.js:221-224`).
- Bouton de sortie : « Download » (`app/components/FileDownload.jsx:211`), plus « Save / Share » sur iPhone/iPad
  (`FileDownload.jsx:91-95,216`) ; plusieurs fichiers : « Download all (N files, ZIP) » (`FileDownload.jsx:264`).
- Dépôt par glisser-déposer : règle site entière (`app/components/FileDropBridge.jsx:4-13,59-78`) ; zone d'envoi :
  « Click or drop … here » (souris) / « Choose … » (tactile) (`app/components/UploadPrompt.jsx:10-11`).

Abréviations : `IT` = `app/tools/image-tools`. Ligne « méta » = `IT/<outil>/layout.tsx:6` ; « titre » = `layout.tsx:5`.

---

## bmp-to-png

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| bmp-to-png | méta + about | « entirely in your browser using the HTML canvas » | TROMPEUR | Sur iPhone/iPad au-delà de 16,7 Mpx : bandes + PNG écrit par l'écrivain du site, pas par le canvas (`app/lib/bigImage.js:72-104,294-303`, `app/lib/imageOutput.js:142`) | « entirely in your browser », sans le détail « HTML canvas » |
| bmp-to-png | FAQ 4 | « There's no fixed size limit » | FAUX | `loadRaster` refuse au-delà de 268 Mpx (`IT/bmp-to-png/page.jsx:23` → `app/lib/imageOutput.js:77-82`) | Dire la limite : 268 mégapixels par image |
| bmp-to-png | FAQ 1 | « Yes, it's 100% free with no registration required. » | GÉNÉRIQUE | `IT/bmp-to-png/page.jsx:54` | Fait propre à l'outil (ex. ce que devient un BMP 32 bits, nom du fichier rendu) |
| bmp-to-png | FAQ 2 | « only one file can be converted at a time — there's no multi-file upload » | GÉNÉRIQUE | `page.jsx:55` ; entrée sans `multiple` (`page.jsx:37`) | Une phrase propre, ou renvoi vers Image Converter (lot) |
| bmp-to-png | FAQ 3 | « your file never leaves your device » | GÉNÉRIQUE | `page.jsx:56` (vrai, formulation identique sur 16 pages) | Garder le fait, formulation propre (ce qui est téléchargé : rien ; ce qui part : rien) |
| bmp-to-png | astuce 1 | « make sure your BMP file isn't corrupted before uploading » | GÉNÉRIQUE | `page.jsx:60` | Remplacer par le message réel d'un BMP illisible (`app/lib/fileChecks.js:203-214`) |
| bmp-to-png | astuce 3 | « Run your PNG through an image compressor afterward » | GÉNÉRIQUE | `page.jsx:62` | Supprimer ou fait propre |
| bmp-to-png | astuce 4 | « Keep a backup of your original BMP file » | GÉNÉRIQUE | `page.jsx:63` | Supprimer |
| bmp-to-png | page entière | (about 2 phrases, 4 étapes standard) | MINCE | Manquent : limite 268 Mpx, nom du fichier rendu = même nom en .png (`app/lib/imageOutput.js:147-149`, `app/lib/download.js:108-111`), orientation EXIF appliquée (`app/lib/imageOutput.js:73`), message si le navigateur ne lit pas ce BMP (`app/lib/imageOutput.js:84-88`) | Ajouter ces faits |

## gif-to-png

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| gif-to-png | méta + about | « entirely in your browser using the HTML canvas » | TROMPEUR | « Convert » passe par `drawToRaster` + `encodeRaster` : sur iPhone > 16,7 Mpx, bandes et PNG écrit sans canvas (`IT/gif-to-png/page.jsx:48-49`, `app/lib/imageOutput.js:142,255-273`) | « entirely in your browser » |
| gif-to-png | étapes 1-4 | (aucune étape pour « Extract all frames ») | MINCE | Bouton « Extract all frames (ZIP of PNGs) » (`page.jsx:70`), ZIP `gif-frames.zip` (`page.jsx:71`), fichiers `frame_01.png`… (`page.jsx:36`) | Ajouter l'étape et le nom des fichiers |
| gif-to-png | FAQ 1 | « Yes, it's 100% free with no registration required. » | GÉNÉRIQUE | `page.jsx:84` | Fait propre |
| gif-to-png | FAQ 3 | « only one file can be converted at a time — there's no batch upload » | GÉNÉRIQUE | `page.jsx:86` | Fait propre |
| gif-to-png | FAQ 4 | « your file is never uploaded to a server » | GÉNÉRIQUE | `page.jsx:87` | Formulation propre |
| gif-to-png | astuce 3 | « Convert one GIF at a time and download each result before starting the next. » | GÉNÉRIQUE | `page.jsx:92` | Supprimer |
| gif-to-png | astuce 4 | « Keep the original GIF as a backup » | GÉNÉRIQUE | `page.jsx:93` | Supprimer |
| gif-to-png | page entière | — | MINCE | Non dit : sur iPhone/iPad l'extraction refuse un GIF de plus de 16,7 Mpx avec message (`app/lib/gifFrames.js:18-19`, `app/lib/canvasLimit.js:20-23`) ; ZIP non compressé (`page.jsx:38`, `level: 0`) | Ajouter la limite téléphone |

## heic-to-jpg

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| heic-to-jpg | about | « using the open-source heic2any library » | TROMPEUR | Safari (iPhone, iPad, Mac) décode le HEIC lui-même ; heic2any seulement pour les navigateurs qui ne lisent pas le HEIC (`IT/heic-to-jpg/page.jsx:29-37`) | « Safari decodes it natively; other browsers use the open-source heic2any library » |
| heic-to-jpg | étape 3 | « wait a few seconds for the conversion to finish » | INVÉRIFIABLE | Aucune mesure de durée pour cet outil dans `docs/audit/` (cherché : heic-to-jpg, heic2any) | Supprimer la durée |
| heic-to-jpg | FAQ 1 | « Yes, it's completely free with no registration required. » | GÉNÉRIQUE | `page.jsx:84` | Fait propre |
| heic-to-jpg | FAQ 2 | « only one file can be converted at a time » | GÉNÉRIQUE | `page.jsx:85` ; entrée sans `multiple` (`page.jsx:56`) | Renvoi vers Image Converter (lots de HEIC) |
| heic-to-jpg | FAQ 4 | « Do I need to install any software? No… » | GÉNÉRIQUE | `page.jsx:87` | Remplacer |
| heic-to-jpg | astuce 4 | « Check the converted JPG immediately after downloading » | GÉNÉRIQUE | `page.jsx:93` | Supprimer |
| heic-to-jpg | page entière | — | MINCE | Non dit : plafond 268 Mpx sur le chemin Safari (`page.jsx:33` → `app/lib/imageOutput.js:77-82`) ; nom rendu = nom du HEIC en .jpg (`page.jsx:69`) ; message d'erreur « Error: … » (`page.jsx:43`) | Ajouter |

## heic-to-png

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| heic-to-png | about | « using the open-source heic2any library » | TROMPEUR | Safari décode lui-même ; heic2any ailleurs (`IT/heic-to-png/page.jsx:28-36`) | Dire les deux chemins |
| heic-to-png | FAQ 4 | « Conversion happens entirely in your browser using the heic2any library » | TROMPEUR | Idem (`page.jsx:32-36`) | Idem |
| heic-to-png | étape 2 | « wait a few seconds for the conversion to finish » | INVÉRIFIABLE | Aucune mesure dans `docs/audit/` | Supprimer |
| heic-to-png | FAQ 2 | « There's no fixed size limit » | FAUX | Chemin Safari : refus au-delà de 268 Mpx (`page.jsx:32` → `app/lib/imageOutput.js:77-82`) | Dire 268 Mpx |
| heic-to-png | FAQ 1 | « Yes, it's 100% free with no account creation required. » | GÉNÉRIQUE | `page.jsx:79` | Fait propre |
| heic-to-png | FAQ 3 | « No account is necessary — you can start converting immediately. » | GÉNÉRIQUE | `page.jsx:81` (doublon de la FAQ 1) | Supprimer |
| heic-to-png | astuce 1 | « Convert one HEIC file at a time — there's no batch upload option. » | GÉNÉRIQUE | `page.jsx:85` | Renvoi Image Converter |
| heic-to-png | astuce 2 | « Check the converted PNG right after downloading » | GÉNÉRIQUE | `page.jsx:86` | Supprimer |
| heic-to-png | page entière | — | MINCE | Non dit : nom rendu en .png (`page.jsx:64`), chemins Safari / autres (`page.jsx:28-36`) | Ajouter |

## ico-to-png

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| ico-to-png | about | « the browser renders the one it picks as the source image; there's no per-size selector » | FAUX | Bouton « Every size in this icon » : chaque image de l'icône en PNG, ou toutes en ZIP (`IT/ico-to-png/page.jsx:27-41,70-79`) ; « Convert » donne la plus grande (`app/lib/icoEntries.js:1-2`) | « Convert gives the largest size; Every size in this icon gives each size » |
| ico-to-png | astuce 4 | « check which one the browser used as the source before relying on the output for a specific size » | FAUX | Même code : chaque taille est disponible et nommée `<nom>-16x16-32bit.png`… (`page.jsx:36`) | Remplacer par l'usage de « Every size in this icon » |
| ico-to-png | FAQ 3 | « the pixels are copied as-is » | TROMPEUR | « Convert » redessine l'image sur un canvas (`page.jsx:48`) : pixels semi-transparents arrondis possibles (le site le dit lui-même pour PNG to WebP, `IT/png-to-webp/page.jsx:58`) ; les entrées PNG ne sont livrées octet pour octet que par « Every size in this icon » (`page.jsx:35`) | Dire : octet pour octet via « Every size… », redessiné via « Convert » |
| ico-to-png | méta + about | « using the HTML canvas » | TROMPEUR | `drawToRaster` + `encodeRaster`, bandes et PNG hors canvas sur iPhone > 16,7 Mpx (`page.jsx:48-49`, `app/lib/imageOutput.js:142,255-273`) | Supprimer le détail |
| ico-to-png | étapes 1-4 | (aucune étape pour « Every size in this icon ») | MINCE | `page.jsx:70-79` | Ajouter l'étape |
| ico-to-png | FAQ 1 | « Yes, it's 100% free with no registration required. » | GÉNÉRIQUE | `page.jsx:93` | Fait propre |
| ico-to-png | FAQ 5 | « Do I need to install any software? No… » | GÉNÉRIQUE | `page.jsx:97` | Remplacer |
| ico-to-png | astuce 2 | « Convert files one at a time — there's no batch upload option. » | GÉNÉRIQUE | `page.jsx:101` | Supprimer |
| ico-to-png | astuce 3 | « Download your PNG right away, since nothing is stored after you leave the page. » | GÉNÉRIQUE | `page.jsx:102` | Supprimer |

## image-converter

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| image-converter | titre | « Convert Images Between Png, Jpg, Webp » | FORMAT | 9 sorties : WebP, PNG, JPG, AVIF, GIF, BMP, TIFF, ICO, PDF (`IT/image-converter/page.tsx:313-321`) ; casse « Png, Jpg, Webp » | Titre qui dit la largeur réelle (dont HEIC/RAW en entrée), casse correcte |
| image-converter | interface (sous-titre) | « Convert images to PNG, JPG, WebP or AVIF » | FORMAT | Mêmes 9 sorties (`page.tsx:246` vs `313-321`) | Dire les 9 sorties |
| image-converter | interface (carte) | « Instant — Conversion happens in your browser » | FAUX | Le code attend jusqu'à 10 s par mégapixel RAW (24 Mpx : 10 s Chromium, 40 s Firefox ; X-Trans 58 s) (`imageConverter.worker.js:74-80`) ; AVIF « a few seconds per photo » (`page.tsx:330`) | Supprimer « Instant » |
| image-converter | interface (carte) | « 100% Private » | INVÉRIFIABLE | Superlatif ; le fait vérifiable est « Files never leave your device » (`page.tsx:405`) | Garder seulement le fait |
| image-converter | about | « download the results instantly » | FAUX | Idem ligne « Instant » (`imageConverter.worker.js:74-80`, `page.tsx:325,330`) | Supprimer « instantly » |
| image-converter | about + interface | « Conversion runs in a background Web Worker so the page stays responsive even on large batches » / « Conversion runs in the background — this tab stays responsive. » | TROMPEUR | PSD et SVG sont décodés sur la page (`page.tsx:132-140`, `app/lib/specialImageDecode.js:21-46`) ; HEIC hors Safari décodé par heic2any sur la page (`page.tsx:141-150`) | « The encoding runs in a background worker; PSD, SVG and (outside Safari) HEIC are opened on the page first » |
| image-converter | étape 3 | « Adjust the quality slider to balance file size against image quality. » | TROMPEUR | Curseur seulement pour JPG, WebP, AVIF, PDF (`page.tsx:20,338-355`) | « For JPG, WebP, AVIF or PDF, adjust… » |
| image-converter | étape 4 | « Click Convert, then … use "Download all" » | LIBELLÉ | Bouton « Convert N file(s) to FORMAT » (`page.tsx:370`) ; « Download all (N files, ZIP) », seulement à partir de 2 résultats (`app/components/FileDownload.jsx:225,264`) | Citer les libellés exacts |
| image-converter | FAQ 4 | « ICO produces a favicon holding every standard size from 16 to 256 px » | TROMPEUR | Tailles 16, 32, 48, 64, 128, 256 seulement si ≤ au plus grand côté de l'image (`IT/image-converter/extraFormats.js:110-115`) ; pas de 24 px | « 16 to 256 px, up to the image's own size » |
| image-converter | FAQ 4 | « HEIC/HEIF is decoded on the main thread before being re-encoded » | TROMPEUR | Seulement quand le navigateur ne lit pas le HEIC ; Safari le décode dans le worker comme un JPEG (`page.tsx:118-120,141-153`) | Dire les deux cas |
| image-converter | astuce 2 + interface | « PNG, BMP, TIFF and ICO are written without loss » / « ICO has no quality setting here: … it is written without loss. » | FAUX | ICO : image réduite à 512 px puis à 16-256 px (`extraFormats.js:116-127`) ; BMP : transparence aplatie sur blanc (`extraFormats.js:4,30-33`) | « PNG and TIFF without loss; BMP flattened on white; ICO resized to icon sizes » |
| image-converter | interface (curseur PDF) | « Quality: … % (photos without transparency) » | TROMPEUR | Pour le PDF, qualité plancher 50 % : un réglage sous 50 est ignoré (`extraFormats.js:159`) | Borner le curseur à 50-100 pour PDF, ou le dire |
| image-converter | FAQ 8 | « 50 on phones and tablets » | TROMPEUR | `isMobileDevice` suit `userAgentData.mobile` (faux sur tablette Android dans Chrome) : tablette Android = plafond ordinateur 100 Mpx ; iPad = 50 (`app/lib/isMobileDevice.js:5-9`) | « 50 on phones and iPads » |
| image-converter | FAQ 8 | « about a minute or two for a 48-megapixel photo to WebP on a phone » | INVÉRIFIABLE | Seule mesure : chemin iPhone simulé sur ordinateur (29-36 s WebKit, 118-148 s Firefox), « Seul un vrai iPhone donnera le temps » (`docs/audit/RAPPORT-p16-photos-iphone-30-09.md:83`) | Supprimer la durée ou la mesurer sur iPhone |
| image-converter | astuce 3 | « AVIF gives the smallest files of the four » | INVÉRIFIABLE | Aucun rapport comparant les tailles AVIF/WebP/JPG/PNG (cherché `docs/audit/*.md` : AVIF + smallest) | Supprimer ou mesurer |
| image-converter | astuce 1 | « WebP usually gives the best balance of quality and file size for web use » | GÉNÉRIQUE | `page.tsx:438` | Fait propre |
| image-converter | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | `page.tsx:428` (phrase répétée sur des dizaines de pages, `docs/audit/p36/unicite-avant.json`) | Fait propre |
| image-converter | page entière | — | MINCE | Non dit : un GIF/WebP/PNG animé donne sa première image (décodage `createImageBitmap`, `imageConverter.worker.js:117`) ; SVG dessiné à sa taille ou à 1024 px (`app/lib/specialImageDecode.js:20-29`) ; PSD = image aplatie, refus si « Maximize compatibility » désactivé (`specialImageDecode.js:33-45`) ; CMYK 16 bits refusé (`app/lib/tiffDecode.js:204-208`) ; X3F refusé ; arrêt après 20 s de silence (`page.tsx:175-183`) | Ajouter |

## image-to-base64

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| image-to-base64 | FAQ 1 | « It accepts common formats your browser can open, such as JPG, PNG, GIF, and WebP. » | FORMAT | `accept="image/*"` (`IT/image-to-base64/page.jsx:60`) ; le fichier est lu octet pour octet sans être ouvert (`page.jsx:37-50`) ; type reconnu aussi pour TIFF, BMP, ICO, HEIC, AVIF, SVG (`page.jsx:36,44`) | « Any image file (JPG, PNG, GIF, WebP, AVIF, SVG, BMP, ICO, TIFF, HEIC…), read byte for byte, even one your browser cannot display » |
| image-to-base64 | FAQ 3 | « Can I use Base64 images in all browsers? Yes, data URIs are supported by all current browsers. » | TROMPEUR | Un data URI de HEIC ou TIFF ne s'affiche pas dans un navigateur qui ne lit pas ces formats (le site le dit ailleurs : `app/lib/fileChecks.js:212-213`) | « Supported everywhere for JPG/PNG/GIF/WebP/SVG; HEIC/TIFF only where the browser opens them » |
| image-to-base64 | about + étapes 2-4 | « encodes it as a Base64 data URI » | FORMAT | 5 sorties : « Data URI », « Plain Base64 », « HTML <img> tag », « CSS background-image », « JSON » (`page.jsx:19-23,63`) + téléchargement `<nom>.base64.txt` (`page.jsx:63`) | Dire les 5 formes et le .txt |
| image-to-base64 | étape 4 | « Click 'Copy Base64' to copy the full data URI to your clipboard. » | TROMPEUR | Copie la forme choisie dans « Output » (`page.jsx:23,63` : `writeText(out)`) | « copies the text in the chosen form » |
| image-to-base64 | étape 3 | « Review the encoded text in the output box. » | TROMPEUR | La boîte ne montre que les 100 000 premiers caractères (`PREVIEW_CHARS`, `page.jsx:14,63`) ; Copy/Download donnent tout | Le dire |
| image-to-base64 | astuce 4 | « Test the encoded image in your actual application before relying on it » | GÉNÉRIQUE | `page.jsx:85` | Supprimer |
| image-to-base64 | page entière | — | MINCE | Non dit : refus d'un fichier vide (`page.jsx:31`), avertissement si le type n'est pas reconnu (`page.jsx:45`), pas de bouton Convert (vrai, dit) | Ajouter |

## jpg-to-png

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| jpg-to-png | méta + about | « entirely in your browser using the HTML canvas » | TROMPEUR | Bandes + PNG hors canvas sur iPhone > 16,7 Mpx (`IT/jpg-to-png/page.jsx:23-25`, `app/lib/imageOutput.js:142`) | Supprimer le détail |
| jpg-to-png | FAQ 1 | « Yes, it's 100% free with no registration required. » | GÉNÉRIQUE | `page.jsx:54` | Fait propre |
| jpg-to-png | FAQ 3 | « only one file can be converted at a time — there's no batch upload » | GÉNÉRIQUE | `page.jsx:56` | Fait propre |
| jpg-to-png | FAQ 4 | « Yes. Conversion happens entirely in your browser — your file is never uploaded to a server. » | GÉNÉRIQUE | `page.jsx:57` | Formulation propre |
| jpg-to-png | astuce 4 | « Convert one file at a time and download each result before starting the next. » | GÉNÉRIQUE | `page.jsx:63` | Supprimer |
| jpg-to-png | page entière | — | MINCE | Non dit : limite 268 Mpx (`page.jsx:23` → `app/lib/imageOutput.js:77-82`) ; orientation EXIF appliquée aux pixels (`app/lib/imageOutput.js:73`) ; nom rendu = même nom en .png (`app/lib/imageOutput.js:147-149`) | Ajouter |

## jpg-to-webp

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| jpg-to-webp | méta | « entirely in your browser using the HTML canvas » | TROMPEUR | Sans perte = toujours libwebp WebAssembly ; Safari = libwebp WebAssembly (`IT/jpg-to-webp/page.jsx:29`, `app/lib/imageOutput.js:138-141`, `app/lib/bigImage.js:223-229`) — l'about le dit, la méta le contredit | « in your browser (canvas or libwebp in WebAssembly) » |
| jpg-to-webp | FAQ 2 | « There's no fixed size limit » | FAUX | 268 Mpx (`page.jsx:27` → `app/lib/imageOutput.js:77-82`) et 16 383 px de côté au plus (`app/lib/bigImage.js:221-224`) | Dire les deux limites |
| jpg-to-webp | étapes 1-4 | (aucune étape pour la qualité ou « Lossless ») | MINCE | Case « Lossless (pixel-exact for an opaque image; larger file) » (`page.jsx:45`), curseur « Quality: 80 » 1-100 (`page.jsx:17,46-47`), poids avant → après affiché (`page.jsx:51`) | Ajouter l'étape réglage |
| jpg-to-webp | FAQ 1 | « Yes, it's completely free with no watermarks added. » | GÉNÉRIQUE | `page.jsx:64` | Fait propre |
| jpg-to-webp | FAQ 4 | « only one file can be converted at a time » | GÉNÉRIQUE | `page.jsx:67` | Fait propre |
| jpg-to-webp | astuce 2 | « Keep a backup of your original JPG file before converting » | GÉNÉRIQUE | `page.jsx:71` | Supprimer |
| jpg-to-webp | astuce 3 | « WebP is supported by all current major browsers, so it's safe to use for most web projects. » | GÉNÉRIQUE | `page.jsx:72` (identique à `IT/png-to-webp/page.jsx:74`) | Supprimer |
| jpg-to-webp | astuce 4 | « Convert one file at a time and download each result before starting the next. » | GÉNÉRIQUE | `page.jsx:73` | Supprimer |

## png-to-ico

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| png-to-ico | astuce 3 | « Keep all four sizes selected for maximum compatibility » | TROMPEUR | 7 tailles proposées (16, 24, 32, 48, 64, 128, 256), 4 cochées par défaut (`IT/png-to-ico/page.jsx:11-12,136-138`) | « Keep the default sizes (16, 32, 48, 256) selected » |
| png-to-ico | about | « it works both as a browser favicon and in software … that expects the native ICO format » | TROMPEUR | Entrées PNG dans l'ICO : lues depuis Windows Vista seulement (commentaire `page.jsx:34-38`) ; Windows XP et vieux outils ne les lisent pas | Ajouter « (Windows Vista or later) » |
| png-to-ico | FAQ 2 | « Do I need to install any software to use this tool? No… » | GÉNÉRIQUE | `page.jsx:165` | Remplacer |
| png-to-ico | FAQ 4 | « No, only one file can be converted at a time. » | GÉNÉRIQUE | `page.jsx:167` | Fait propre |
| png-to-ico | astuce 4 | « Test the downloaded file in your browser's favicon slot » | GÉNÉRIQUE | `page.jsx:173` | Supprimer |
| png-to-ico | étapes | (pas d'étape pour « Image that is not square ») | MINCE | Liste « Fit (whole image, transparent margins) » / « Fill (cropped to the square, centred) » (`page.jsx:141-142`) ; fichier toujours nommé `favicon.ico` (`page.jsx:149`) | Ajouter l'étape |

## png-to-jpg

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| png-to-jpg | about | « transparent areas are filled with white in the JPG output » | FAUX | Couleur au choix, blanc par défaut : « Transparent areas become » + sélecteur de couleur (`IT/png-to-jpg/page.jsx:19,47-48,29`) | « filled with the colour you pick (white by default) » |
| png-to-jpg | about | « as iLoveIMG and CloudConvert do » | INVÉRIFIABLE | Aucun rapport dans `docs/audit/` sur le fond blanc PNG→JPG de ces deux sites (cherché : CloudConvert, PNG to JPG) | Supprimer |
| png-to-jpg | FAQ 3 | « They become white, since JPG doesn't support transparency. » | FAUX | Idem (`page.jsx:47-48`) | « They take the colour chosen under "Transparent areas become" (white by default) » |
| png-to-jpg | astuce 1 | « for another color, flatten the image in an editor first » | FAUX | Le sélecteur de couleur existe dans l'outil (`page.jsx:47-48`) | « choose another colour under "Transparent areas become" » |
| png-to-jpg | FAQ 2 | « though it's usually minor at default encoder settings » | TROMPEUR | Curseur « JPG quality: 92 », 10-100 (`page.jsx:18,44-45`), jamais mentionné | Citer le curseur et sa valeur 92 |
| png-to-jpg | méta + about | « using the HTML canvas » | TROMPEUR | Sur iPhone > 16,7 Mpx : MozJPEG en WebAssembly (`app/lib/imageOutput.js:140`) | Supprimer le détail |
| png-to-jpg | FAQ 1 | « Yes, it's 100% free with no registration required. » | GÉNÉRIQUE | `page.jsx:67` | Fait propre |
| png-to-jpg | astuce 4 | « Convert one file at a time — there's no batch upload option. » | GÉNÉRIQUE | `page.jsx:76` | Supprimer |
| png-to-jpg | étapes | (aucune étape qualité / couleur) | MINCE | `page.jsx:43-49` ; PNG animé : note « the result will hold its first frame only » (`page.jsx:52`, `app/components/AnimatedImageNote.jsx:17-19`) ; limite 268 Mpx (`app/lib/imageOutput.js:77-82`) | Ajouter |

## png-to-webp

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| png-to-webp | méta | « entirely in your browser using the HTML canvas » | TROMPEUR | Sans perte et Safari = libwebp WebAssembly (`IT/png-to-webp/page.jsx:30`, `app/lib/imageOutput.js:138-141`) | Comme jpg-to-webp |
| png-to-webp | FAQ 2 | « There's no fixed size limit » | FAUX | 268 Mpx (`app/lib/imageOutput.js:77-82`) et 16 383 px de côté (`app/lib/bigImage.js:221-224`) | Dire les limites |
| png-to-webp | étapes 1-4 | (aucune étape qualité / Lossless) | MINCE | `page.jsx:46-48` ; note PNG animé (`page.jsx:51`) | Ajouter |
| png-to-webp | FAQ 1 | « Yes, it's 100% free with no registration required. » | GÉNÉRIQUE | `page.jsx:66` | Fait propre |
| png-to-webp | FAQ 4 | « No, it's entirely web-based and works in any modern browser. » | GÉNÉRIQUE | `page.jsx:69` | Remplacer |
| png-to-webp | astuce 2 | « Convert files one at a time — there's no batch upload option. » | GÉNÉRIQUE | `page.jsx:73` | Supprimer |
| png-to-webp | astuce 3 | « WebP is supported by all current major browsers » | GÉNÉRIQUE | `page.jsx:74` (doublon jpg-to-webp) | Supprimer |
| png-to-webp | astuce 4 | « Use WebP for product photos and thumbnails to reduce bandwidth » | GÉNÉRIQUE | `page.jsx:75` | Supprimer |

## svg-to-png

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| svg-to-png | about | « entirely in your browser using the canvas element » | TROMPEUR | Sur iPhone > 16,7 Mpx : bandes + PNG hors canvas (`IT/svg-to-png/page.jsx:71-72`, `app/lib/imageOutput.js:142,255-273`) | Supprimer le détail |
| svg-to-png | FAQ 3 | « only one file can be converted at a time — there's no batch upload » | GÉNÉRIQUE | `page.jsx:132` | Fait propre |
| svg-to-png | astuce 4 | « Convert one file at a time and download each result before starting the next. » | GÉNÉRIQUE | `page.jsx:139` | Supprimer |
| svg-to-png | page entière | — | MINCE | Non dit : taille de sortie max 32 767 px de côté et 268 Mpx (`page.jsx:60-61` → `app/lib/mediaSupport.js:55-67`) ; boutons « 512 px wide », « 1024 px wide », « 2048 px wide » absents des étapes (`page.jsx:108`) ; fond « Transparent » / « Colour » absent des étapes (`page.jsx:104-107`) | Ajouter |

## tiff-to-jpg

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| tiff-to-jpg | about | « Multi-page TIFFs are supported for decoding, but only the first page is converted. » | FAUX | Après conversion d'un TIFF de plusieurs pages : « This TIFF has N pages: page X was converted. Page [n] — then convert again. » (`IT/tiff-to-jpg/page.jsx:24-27,137,167-171`, `app/lib/tiffDecode.js:177-185`) | « Any page can be converted: choose its number, then convert again » |
| tiff-to-jpg | astuce 1 | « only the page the browser renders will be converted — extract other pages separately » | FAUX | Idem | Idem |
| tiff-to-jpg | FAQ 1 | « Yes, it's 100% free with no registration required. » | GÉNÉRIQUE | `page.jsx:187` | Fait propre |
| tiff-to-jpg | FAQ 4 | « only one file can be converted at a time » | GÉNÉRIQUE | `page.jsx:190` | Renvoi Image Converter |
| tiff-to-jpg | page entière | — | MINCE | Non dit : « Transparent areas become » (couleur, `page.jsx:19,151`) ; profil couleur non appliqué, signalé (`page.jsx:173`) ; orientation TIFF appliquée (`app/lib/tiffDecode.js:152-175`) ; CMYK 16 bits refusé (`tiffDecode.js:204-208`) ; bouton « Cancel » (`page.jsx:155`) | Ajouter |

## tiff-to-png

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| tiff-to-png | about | « only the first page is converted » | FAUX | Choix de la page (`IT/tiff-to-png/page.jsx:163-167`, `app/lib/tiffDecode.js:177-185`) | Comme tiff-to-jpg |
| tiff-to-png | astuce 1 | « only the page the browser renders will be converted » | FAUX | Idem | Idem |
| tiff-to-png | FAQ 3 | « No, the pixels are copied as-is with no lossy compression applied. » | FAUX | TIFF de 2 à 32 bits ramenés à 8 bits par étirement min-max (`app/lib/tiffDecode.js:1-27,36-117`) ; CMYK converti en RGB (`tiffDecode.js:135-150`) ; profil couleur non appliqué (`page.jsx:169`) | « Lossless for 8-bit RGB/grey TIFFs; deeper TIFFs are scaled to 8 bits, CMYK converted to RGB, colour profile not applied » |
| tiff-to-png | FAQ 1 | « Yes, it's 100% free with no registration required. » | GÉNÉRIQUE | `page.jsx:183` | Fait propre |
| tiff-to-png | FAQ 4 | « No, it works entirely in your browser on any device with a modern browser. » | GÉNÉRIQUE | `page.jsx:186` | Remplacer |
| tiff-to-png | astuce 3 | « Check the converted PNG's dimensions match what you expect » | GÉNÉRIQUE | `page.jsx:192` | Supprimer |
| tiff-to-png | astuce 4 | « Convert one file at a time — there's no batch upload option. » | GÉNÉRIQUE | `page.jsx:193` | Supprimer |
| tiff-to-png | page entière | — | MINCE | Non dit : profil couleur (`page.jsx:169`), orientation (`app/lib/tiffDecode.js:152-175`), « Cancel » (`page.jsx:151`) | Ajouter |

## webp-to-jpg

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| webp-to-jpg | astuce 2 | « There's no quality slider here — the browser's default JPEG encoding is used. » | FAUX | Curseur « JPG quality: 92 », 10-100 (`IT/webp-to-jpg/page.jsx:52-53`, valeur initiale 92) | « JPG quality slider, 92 by default » |
| webp-to-jpg | astuce 3 | « any transparent areas in your WebP become white » | FAUX | « Transparent areas become » + couleur (`page.jsx:55-56`) | « the colour you pick (white by default) » |
| webp-to-jpg | FAQ 3 | « There's no fixed size limit » | FAUX | 268 Mpx (`app/lib/imageOutput.js:77-82`) | Dire 268 Mpx |
| webp-to-jpg | méta + about | « using the HTML canvas » | TROMPEUR | Sur iPhone > 16,7 Mpx : MozJPEG WebAssembly (`app/lib/imageOutput.js:140`) | Supprimer le détail |
| webp-to-jpg | FAQ 1 | « Yes, it's completely free with no registration required. » | GÉNÉRIQUE | `page.jsx:75` | Fait propre |
| webp-to-jpg | FAQ 4 | « only one file can be converted at a time » | GÉNÉRIQUE | `page.jsx:78` | Fait propre |
| webp-to-jpg | astuce 1 | « Converting can't add detail beyond what's in the original WebP file » | GÉNÉRIQUE | `page.jsx:81` | Supprimer |
| webp-to-jpg | astuce 4 | « Convert one file at a time and download each result before starting the next. » | GÉNÉRIQUE | `page.jsx:84` | Supprimer |
| webp-to-jpg | étapes / about | (aucune mention du réglage ni de la note WebP animé) | MINCE | Note « This WebP is animated: the JPG will contain its first frame only… » (`page.jsx:20-29,60`) | Ajouter |

## webp-to-png

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| webp-to-png | FAQ 2 | « No, the pixels are copied as-is with no additional compression applied. » | TROMPEUR | Décodage puis canvas (`IT/webp-to-png/page.jsx:33-35`) : pixels semi-transparents arrondis possibles (le site le dit pour PNG to WebP, `IT/png-to-webp/page.jsx:58`) ; le PNG est compressé (sans perte) | « Lossless PNG; half-transparent edges may be rounded by one step » |
| webp-to-png | méta + about | « using the HTML canvas » | TROMPEUR | Bandes + PNG hors canvas sur iPhone > 16,7 Mpx (`app/lib/imageOutput.js:142`) | Supprimer le détail |
| webp-to-png | FAQ 1 | « Yes, it's completely free with no registration required. » | GÉNÉRIQUE | `page.jsx:65` | Fait propre |
| webp-to-png | FAQ 3 | « One at a time — there's no batch conversion feature. » | GÉNÉRIQUE | `page.jsx:67` | Fait propre |
| webp-to-png | astuce 3 | « Convert one file at a time and download each result before starting the next. » | GÉNÉRIQUE | `page.jsx:73` | Supprimer |
| webp-to-png | astuce 4 | « Download your PNG right away, since nothing is stored anywhere after you leave the page. » | GÉNÉRIQUE | `page.jsx:74` | Supprimer |
| webp-to-png | page entière | — | MINCE | Non dit : note WebP animé (`page.jsx:18-26,51`), limite 268 Mpx (`app/lib/imageOutput.js:77-82`) | Ajouter |

## image-compressor

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| image-compressor | about | « only offered once the tool has checked they draw exactly like the original » | TROMPEUR | Tolérance : écart ≤ 64 niveaux après tolérance de voisinage 3×3 ; « a 3-pixel sliver … is the one thing it cannot see » (`IT/image-compressor/page.jsx:37-48,195`) | « checked to draw the same, within anti-aliasing tolerance » |
| image-compressor | FAQ 6 | « compares them pixel by pixel; if they differ, it tries a more cautious setting » | TROMPEUR | Idem (`page.jsx:37-48,191-197`) | Dire la tolérance |
| image-compressor | about | « MozJPEG, the encoder behind the best online compressors » | INVÉRIFIABLE | Le rapport prouve que iLoveIMG utilise MozJPEG (`compress.worker.js:3-6`, `docs/audit/RAPPORT-ecarts-marche.md` §3b), pas « the best » | « the encoder iLoveIMG uses » ou supprimer |
| image-compressor | about | « the same size and quality as the leading online compressor's » | INVÉRIFIABLE | Mesure prouvée contre iLoveIMG (209 154 o / 43,72 dB vs 209 692 o / 43,67 dB, `docs/audit/RAPPORT-ecarts-marche.md:116`), « leading » non prouvé | Nommer la référence mesurée ou dire « a popular online compressor » |
| image-compressor | about | « shrinks JPG, PNG and WebP images » | FORMAT | AVIF compressé et gardé en AVIF (`compress.worker.js:274-276`, `app/lib/avifEncode.js:21-31`) | « JPG, PNG, WebP, AVIF and SVG » |
| image-compressor | FAQ 4 | « Yes for PNG and WebP. Transparent areas of other formats become white, since they are saved as JPG. » | TROMPEUR | AVIF garde sa transparence (RGBA encodé, `app/lib/avifEncode.js:21-25`) ; SVG reste vectoriel (`compress.worker.js:235-239`) | « Yes for PNG, WebP, AVIF and SVG; other formats become JPG on white » |
| image-compressor | FAQ 2 | « the page sends you to our GIF Compressor » | TROMPEUR | Un message d'erreur nomme l'outil, sans lien (`compress.worker.js:249`) | « the page tells you to use our GIF Compressor » |
| image-compressor | étape 3 | « Click 'Compress' » | LIBELLÉ | Bouton « Compress image » / « Compress N images » (`page.jsx:296`) | Citer le libellé exact |
| image-compressor | FAQ 8 | « 48 on a phone » | TROMPEUR | Plafond « téléphone » appliqué aussi à l'iPad, pas aux tablettes Android sous Chrome (`app/lib/isMobileDevice.js:5-9`, `page.jsx:128`) | « 48 on a phone or iPad » |
| image-compressor | FAQ 1 | « Yes, it's completely free with no registration required. » | GÉNÉRIQUE | `page.jsx:343` | Fait propre |
| image-compressor | astuce 4 | « Keep your original file as a backup » | GÉNÉRIQUE | `page.jsx:357` | Supprimer |
| image-compressor | page entière | — | MINCE | Non dit : PNG animé (APNG) et WebP animé refusés avec message (`compress.worker.js:251-259`) ; recherche de taille cible entre 10 et 95 % (`compress.worker.js:282`) ; note iPhone « a photo picked from Photo Library reaches this page converted by iOS » (`page.jsx:268`, `app/components/IosOriginalNote.jsx:21`) ; arrêt sans réponse après 60 s + 1,5 s/Mpx (`page.jsx:169-178`) | Ajouter |

---

## Défauts relevés dans le code (hors texte, à transmettre)

- `IT/svg-to-png/page.jsx:114` : `<img src={result}>` reçoit l'objet `{ blob, url, name }` au lieu de `result.url` → l'aperçu
  après conversion est une image cassée (le bouton « Download » de la ligne 115 utilise bien `result.url`).
- `IT/tiff-to-jpg/tiffToJpg.worker.js:38-41` : utilise `OffscreenCanvas` sans vérifier qu'il existe, alors que
  `tiffToPng.worker.js:37-38` le vérifie (« No OffscreenCanvas in this worker (some WebKit builds) »).
- `IT/image-converter/extraFormats.js:159` : PDF, qualité plancher 50 % alors que le curseur descend à 10 %.

## Synthèse du lot image-1

18 outils lus, 149 défauts (une ligne de tableau = un défaut) :

| Type | Nombre |
|---|---|
| FAUX | 20 |
| INVÉRIFIABLE | 8 |
| TROMPEUR | 32 |
| GÉNÉRIQUE | 63 |
| MINCE | 19 |
| LIBELLÉ | 2 |
| FORMAT | 5 |
| **Total** | **149** |

Par outil : image-converter 18, image-compressor 12, bmp-to-png 9, heic-to-png 9, ico-to-png 9, png-to-jpg 9,
webp-to-jpg 9, gif-to-png 8, jpg-to-webp 8, png-to-webp 8, tiff-to-png 8, heic-to-jpg 7, image-to-base64 7,
webp-to-png 7, jpg-to-png 6, png-to-ico 6, tiff-to-jpg 5, svg-to-png 4.

Les plus graves (contredits par l'interface que le visiteur a sous les yeux) : WebP to JPG « There's no quality slider
here » alors que le curseur est affiché ; PNG/WebP to JPG « become white » alors qu'un sélecteur de couleur existe ;
TIFF to JPG/PNG « only the first page is converted » alors qu'un choix de page existe ; ICO to PNG « there's no
per-size selector » à côté du bouton « Every size in this icon » ; « There's no fixed size limit » sur 5 pages alors que
le code refuse au-delà de 268 Mpx (et 16 383 px de côté en WebP).
