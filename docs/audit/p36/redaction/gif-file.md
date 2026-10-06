# P36 — rédaction du lot « gif-file » (19 outils)

Base : fiche de faits `docs/audit/p36/faits/gif-file.json`, audit `docs/audit/p36/audit/gif-file.md`. Fichiers modifiés :
les 19 `layout.tsx` (titre, méta, openGraph identiques) et les 19 `page.jsx` (props de `<SeoContent>` ou objet `seo` seulement,
plus des `import` de constantes déjà exportées). Preuves des chiffres écrits en dur : `docs/audit/p36/preuves/gif-file.json`.

**Imports ajoutés (aucun changement de comportement)** : `GIF_MAX_SECONDS` (GifFromVideoTool) et `MAX_UPLOAD_MB`
(MediaServiceTool) dans les 5 pages vidéo→GIF ; `MAX_ANIMATION_PIXELS` (app/lib/gifEncode.js) dans apng-to-gif, gif-to-apng,
gif-to-mp4 ; `IOS_CANVAS_MAX_PIXELS` (app/lib/canvasLimit.js) dans gif-maker. Les autres chiffres viennent de constantes déjà
importées (`OPENABLE_PIXELS`, `MAX_SIDE`, `MAX_FILE_SIZE_LABEL`, `MAX_CHUNKS`, `MAX_TOTAL_SIZE_LABEL`, `MAX_FILE_LABEL`…) ou sont
prouvés dans le fichier de preuves (31 entrées).

**Chaînes d'interface modifiées : aucune.** Non corrigées, à signaler au propriétaire (hors périmètre « phrase FAUSSE ») :
coquille « Convert a AVI clip » (avi-to-gif/page.jsx:10) ; sous-titre « Compare two files side by side » (file-comparator,
TROMPEUR à l'audit) ; dans le composant partagé `app/components/MediaServiceTool.jsx:135`, « works in every browser,
including Safari and iPhone » (INVÉRIFIABLE, plancher Safari 16.4) — non modifié (composant partagé).

**Exemples** : aucun (outils fichiers ; aucun résultat mesuré daté réutilisable dans un rapport, sauf le test « fond
transparent → blanc » de gif-to-mp4, cité sans chiffre : scripts/browser-tests/gif-audit-2.mjs:143).

**Limites du service média** : dites sans chiffre (« limited number … per hour and per day », par connexion), conformément à
la consigne ; la durée maximale de la vidéo source (MEDIA_MAX_DURATION_SECONDS) est dite sans valeur sur avi-to-gif.

## Par outil

Mots = texte SEO visible (About + étapes + specs + privacy + FAQ + astuces), estimé depuis le source ; avant = `seoWords` de
contenu-avant.json.

| Outil | Titre (car.) | Méta (car.) | Mots avant → après | Défauts de l'audit supprimés |
|---|---|---|---|---|
| gif-tools/mp4-to-gif | MP4 to GIF — Cut a Clip, Choose Width and Frame Rate (52) | 150 | 327 → 583 | FAQ gratuité sans quota (TROMPEUR) ; « every browser » (INVÉRIFIABLE) ; suppression « as soon as you have downloaded » (TROMPEUR) ; bloc copié (GÉNÉRIQUE) ; Plays/Compression non dits (MINCE). Centré sur la vérification de durée possible en MP4 et la note « GIF raccourci ». |
| gif-tools/mov-to-gif | MOV to GIF — Turn iPhone and QuickTime Clips into GIFs (54) | 150 | 323 → 574 | mêmes 5 défauts. Centré sur l'iPhone : Photothèque réduite par iOS (IosOriginalNote), même limite sur iPhone, proportions. |
| gif-tools/avi-to-gif | AVI to GIF — Convert AVI Clips Your Browser Cannot Play (55) | 144 | 327 → 533 | astuce FAUSSE « Play the video above » ; mêmes 5 défauts. Centré sur l'aperçu illisible, durée non lue, contrôle du début par le serveur (ffmpeg_ops.py:315), conseil Video Converter. Coquille « a AVI » retirée des textes SEO (reste dans le sous-titre). |
| gif-tools/webm-to-gif | WebM to GIF — VP8, VP9 and AV1 Clips to Animated GIF (52) | 148 | 316 → 508 | mêmes 5 défauts. Centré sur VP8/VP9/AV1, piste Opus/Vorbis retirée, WebM enregistrés sans durée (video-watermark/page.jsx:186-187). |
| gif-tools/video-to-gif | Video to GIF — MP4, MOV, WebM, AVI or MKV to Animated GIF (57) | 149 | 357 → 564 | « any video » (INVÉRIFIABLE) → les 17 extensions ; astuce « Play the video above » ; mêmes défauts. Centré sur les 6 réglages ; renvoi au jumeau video-tools/video-to-gif (extraction PNG). |
| gif-tools/apng-to-gif | APNG to GIF Converter — Keeps Frames, Delays and Loops (54) | 140 | 388 → 432 | FAQ gratuité (GÉNÉRIQUE) ; délais « preserved » (délai 0 → 100 ms dit) ; limite 16,8 Mpx dite. |
| gif-tools/gif-to-apng | GIF to APNG Converter — Lossless Frames, Same Timing (52) | 142 | 377 → 398 | FAQ gratuité ; délai 0 → 100 ms ; limite par image dite ; sans perte dit. |
| gif-tools/gif-compressor | GIF Compressor — Lossy Level, Fewer Colours, Smaller Size (57) | 150 | 431 → 489 | FAQ gratuité ; limite 100 Mpx et résultat « Larger by » dits. |
| gif-tools/gif-maker | GIF Maker — Animated GIF from Images, Frame by Frame (52) | 147 | 482 → 525 | titre tronqué (MINCE) ; astuce « Same as the first image » (TROMPEUR) corrigée ; FAQ gratuité ; FAQ photos copiée ; absence de transparence, 1920 px, 300 images, limite iPhone dites. |
| gif-tools/image-to-gif | Image to GIF — Quick Looping GIF That Keeps Transparency (56) | 140 | 401 → 465 | titre tronqué ; FAQ formats (GIF animé = 1re image) corrigée ; FAQ gratuité ; FAQ photos copiée ; limites 100 Mpx / 1920 px, boucle sans option dites. |
| gif-tools/gif-to-mp4 | GIF to MP4 Converter — H.264 Video with the Exact GIF Timing (60) | 142 | 417 → 422 | FAQ gratuité ; astuces GÉNÉRIQUE / INVÉRIFIABLE (« far more efficient ») supprimées ; moteur chargé depuis unpkg.com dit. |
| file-tools/file-comparator | File Comparator — Check Two Files Match, Byte by Byte (53) | 140 | 345 → 443 | « instantly », « fast », « any size … multi-gigabyte » (INVÉRIFIABLE) ; astuce FAUSSE « only reports whether files match » ; FAQ gratuité. |
| file-tools/file-converter | Text File Converter — TXT to UTF-8, JSON, CSV or HTML (53) | 138 | 326 → 410 | « converts between » (TROMPEUR) remplacé par les 4 transformations exactes ; .tsv non accepté dit (FAQ) ; FAQ gratuité ; détection d'encodage dite. |
| file-tools/file-encryptor | File Encryptor — AES-256 Password Encryption in Your Browser (60) | 149 | 287 → 465 | titre et méta FAUX (« Obfuscate », « XOR ») ; « never a silently corrupted file » (TROMPEUR) → exception des anciens fichiers XOR dite ; détail faux des 48 octets remplacé ; FAQ gratuité. |
| file-tools/file-metadata | File Metadata Viewer — Real Format, EXIF, PDF, Office Info (58) | 149 | 518 → 499 | « instantly / in seconds » ; méta MINCE ; astuce FAUSSE sur l'EXIF ; Office anciens (.doc/.xls/.ppt) non lus dit ; limite 300 MB PDF/ZIP dite ; FAQ gratuité. |
| file-tools/file-splitter | File Splitter — Split Any File by Size or Into Equal Parts (58) | 144 | 393 → 472 | « only read when you download » (FAUX) et « instant regardless of file size » (TROMPEUR) supprimés, la relecture des parties dite dans privacy ; libellé « Bytes » → B/KB/MB (1024) ; exemple 24 MB/25 MB retiré ; parties égales, Join parts et Download all dits. |
| file-tools/tar-extractor | TAR Extractor — Open .tar, .tar.gz and .tgz Files Online (56) | 144 | 392 → 397 | « Upload … instantly » ; FAQ « install any software » ; liens physiques extraits en copie dit ; Download all dit. .taz non mentionné (FORMAT : reste dans accept, code non modifié). |
| file-tools/zip-creator | ZIP Creator — Zip Files in Your Browser, AES-256 Option (55) | 142 | 469 → 438 | lecteurs AES non vérifiés (7-Zip, WinRAR, Windows 11, The Unarchiver) remplacés par le seul test du dépôt (bsdtar) ; « measured limit » retiré ; FAQ gratuité et astuce générique ; fichiers à la racine sans dossier dits. |
| file-tools/zip-extractor | ZIP Extractor — Open ZIP, RAR and 7Z Files in Your Browser (58) | 133 | 614 → 569 | titre MINCE ; « 40+ formats » (INVÉRIFIABLE) remplacé par formats testés + « the other formats 7-Zip reads » ; « Any archive size / Not on the archive » (TROMPEUR) → exception des TAR compressés dite. |

## Points non vérifiables laissés de côté
- Rotation automatique des vidéos iPhone par ffmpeg (on dit seulement « height follows the proportions »).
- Lecture de l'aperçu d'un MOV HEVC selon le navigateur ; valeurs des limites par connexion, du TTL et de la durée source
  (variables d'environnement).
- Formats 7-Zip non testés dans le dépôt (ISO, WIM, DMG…) : non listés nommément, seulement « other formats 7-Zip reads ».
- ZIP Creator : comportement avec deux fichiers de même nom (non testé) → seulement le conseil de renommer.
- « Video Metadata » montre la durée et le codec : lu dans app/tools/video-tools/video-metadata/page.jsx.

## Contrôles (06/10)
- `node scripts/p36/content-verify.mjs --only=gif-tools/` : 11 pages, 11 réécrites, **0 défaut** (max phrases identiques entre
  pages réécrites : 14,3 %, paire d'un autre lot).
- `node scripts/p36/content-verify.mjs --only=file-tools/` : 9 pages, **0 défaut** (base64-encoder = lot dev-encode).
- `node scripts/content-checks/instructions.mjs` : 225 pages, 1742 libellés, **0 mismatch**.
- `node scripts/content-checks/privacy-claims.mjs` : 53 outils qui envoient des données, **0 failure**.
- Jumeau `video-tools/video-to-gif` (lot « video ») : la paire n'était pas au-dessus de 30 % au moment du contrôle ; à
  relancer quand le lot video a fini.

## Corrections après relecture (06/10)

Relecture : `docs/audit/p36/relecture/gif-file.md` (36 défauts). J'ai vérifié chaque point dans le code : les 36 sont fondés,
tous corrigés.
- **D-1, D-2** : durée lue seulement si le navigateur décode le fichier (MediaServiceTool.jsx:55-58, GifFromVideoTool.jsx:40-43).
  Les deux cas sont dits ; FAQ 2 renommée (« Is the GIF shortened…? ») et commence par « Yes. » (**D-3**).
- **D-4** : « Yes, often » supprimé, remplacé par « What makes a GIF heavy? » sans comparaison chiffrée.
- **D-5** (mov), **D-6** (avi, About et méta) : causalité fausse retirée.
- **D-7, D-8, D-9** : la copie compressée reste dans la page jusqu'au téléchargement. ffmpeg.wasm est chargé à chaque
  conversion (gif-to-mp4/page.jsx:31,36), avec réutilisation possible du cache.
- **D-10** : délai < 20 ms remplacé par « Frame Delay » (gif-maker/page.jsx:105).
- **D-11** : WebP retiré. exifr n'enregistre que jpeg/tiff/heic/avif/png (node_modules/exifr/dist/full.esm.mjs, `set("…"`).
- **D-12** : champs Office et OpenDocument distingués (embeddedMetadata.js:50-56).
- **D-13** : 1 000 parties « when splitting by size » seulement (file-splitter/page.jsx:63-74).
- **D-14** : la jonction contrôle noms et tailles seulement ; c'est dit.
- **D-15, D-16** : « on phones, iPhone and iPad », selon les nouvelles précisions (isMobileDevice.js:4-5).
- **D-17** : « on a computer » ajouté pour showSaveFilePicker et showDirectoryPicker.
- **D-18** : cmp compte l'octet à partir de 1 ; le décalage hexadécimal est le nôtre.
- **D-19** : `accept` filtre seulement la boîte de dialogue ; la réponse le dit.
- **D-20, D-21** : nom « .decrypted » dit ; FAQ « Is a wrong password detected? » commence par « Yes ».
- **D-22, D-23** : « quick » retiré (About et titre) ; méta de gif-maker corrigée.
- **D-25 à D-36** : phrases quasi identiques réécrites (méta apng, étapes 1/3/dernières, specs « Frame size », privacy).
- **D-24, D-27, D-28** : sous-titres corrigés (voir plus bas).
- **Rapports d'erreur** : chaque phrase privacy concernée dit maintenant ce qui part : message nettoyé, nom de l'outil,
  navigateur et version, plus extension et tranche de taille quand l'outil passe le fichier (gif-to-mp4, zip-extractor :
  reportError.js:141-153). Les formulations varient d'une page à l'autre.
- **Remarques** :
  - Orthographe américaine dans les textes SEO (colour→color, optimised→optimized…) ; le libellé « Colours » est gardé.
  - Ajout de 15 preuves : 8 MiB, 0.2, 46 signatures (motif comptant exactement 46 lignes de SIGS), 50 to 1000 ms,
    20 to 10000, 20 ms, 300 per GIF, 100 ms, 600,000, 24.09.
  - Le message gifEncode.js:57 (« 16 megapixels ») vit dans une lib partagée, non modifiée : à signaler.

### Chaînes d'interface modifiées (hors props SEO)
| Page | Avant | Après |
|---|---|---|
| gif-tools/mp4-to-gif `subtitle` | Convert an MP4 clip into an animated GIF — choose the start, length, width and frame rate | Pick a moment of an MP4 and make it a GIF: start, length, width, frame rate and loops |
| gif-tools/mov-to-gif `subtitle` | Convert a MOV clip into an animated GIF — … | iPhone and QuickTime MOV clips to animated GIF, in their own proportions |
| gif-tools/avi-to-gif `subtitle` | Convert a AVI clip into an animated GIF — … | Turn part of an AVI file, which browsers cannot preview, into an animated GIF |
| gif-tools/webm-to-gif `subtitle` | Convert a WebM clip into an animated GIF — … | VP8, VP9 or AV1 WebM clips and screen recordings to animated GIF |
| gif-tools/video-to-gif `subtitle` | Turn a clip of any video into an animated GIF — … | One of 17 video file types in, one animated GIF out, shaped by six settings |
| file-tools/file-comparator sous-titre | Compare two files side by side | Check whether two files are identical, byte for byte |
| file-tools/file-splitter note | Supports files up to {…} and up to {…} parts. Splitting is instant — chunks are lazy byte-range views, not copied into memory. | Files up to {…}; when splitting by size, up to {…} parts. Each part is an exact byte range of your file, and nothing is uploaded. |
| file-tools/zip-extractor sous-titre | … ISO and 40+ other archive formats … | … and the other archive formats 7-Zip reads … |
| file-tools/zip-extractor note | Any archive size; each file up to {…} | No cap on the archive itself, except a compressed TAR, whose inner .tar counts as one file; each file up to {…} |
| file-tools/zip-creator note mot de passe | Opens in 7-Zip, WinRAR, Windows 11 and The Unarchiver. | Encrypted as AES-256 in the WinZip AE-2 format; in our test, bsdtar (libarchive) opened it. |
| file-tools/zip-creator note mot de passe accentué | zip.js and 7-Zip write them as UTF-8, but some programs (older WinRAR, Windows tools) read them … | zip.js writes them as UTF-8, but some programs read them in another encoding and then refuse the password (bsdtar on Windows did in our test). |

Non modifiés :
- Composants partagés, laissés au coordinateur : MediaServiceTool.jsx:135 et GifFromVideoTool.jsx:85.
- tar-extractor `.taz` : aucun texte ne promet .taz, et le code n'est pas modifiable.

## Corrections après deuxième passe (06/10)
Les 8 défauts de la deuxième passe sont corrigés :
- **D2-1** (mp4-to-gif, FAQ 3) : phrase réécrite, sans « full picture » (ffmpeg ne code que les zones modifiées) : « A GIF has a limited color palette and a much simpler compression than MP4, which predicts the motion between frames… ».
- **D2-2** (image-to-gif) : la phrase générique devient « gifenc encodes the GIF in this tab. »
- **D2-3** (file-splitter) : la phrase générique devient « The parts are byte ranges cut by this page from your file. »
- **D2-4** (file-converter, FAQ 3) : phrase cassée remise d'aplomb (code page Windows de la langue du navigateur).
- **D2-5** (zip-creator, privacy) : reformulée pour ne plus ressembler à celle de file-comparator.
- **D2-6** (gif-to-apng, étape 1) : « …it starts playing in the box. »
- **D2-7** : « Colors » dans le libellé de spec d'apng-to-gif et dans l'About de gif-to-apng.
- **D2-8** : méta et openGraph de zip-creator « …or 100 MB on phones and iPad. » (151 caractères).

Cohérence avec les composants partagés modifiés par le contrôleur :
- MediaServiceTool.jsx:135 : la vidéo est supprimée à la fin du traitement, le résultat après téléchargement ou délai. Les textes privacy des pages vidéo disent la même chose.
- gifEncode.js : le message affiche « 16.8 megapixels », calculé comme sur les pages.

Contrôles : content-verify gif-tools 0 et file-tools 0, instructions 0 mismatch, privacy-claims 0.
