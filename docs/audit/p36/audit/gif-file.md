# P36 lot 2 — audit du texte servi, lot « gif-file » (19 outils)

Source du texte : `docs/audit/p36/contenu-avant.json`. Code lu : `page.jsx` + `layout.tsx` de chaque outil et tout ce qu'ils
importent. Abréviations : **P** = le `page.jsx` de l'outil, **L** = son `layout.tsx` (ligne 5 = titre, ligne 6 = méta) ;
**GV** = `app/components/GifFromVideoTool.jsx` ; **MS** = `app/components/MediaServiceTool.jsx` ; **FD** =
`app/components/FileDownload.jsx` ; **TK** = `app/api/media/ticket/route.js`. Une affirmation juste n'est pas listée.

Jumeau signalé : `gif-tools/video-to-gif` a un homonyme `video-tools/video-to-gif` (même moteur GV + extraction d'images
PNG, `app/tools/video-tools/video-to-gif/page.jsx:101-107`) ; les deux pages ont le même titre « Video to GIF ». Autres
quasi-jumeaux : `image-to-gif` ≈ `gif-maker` ; `tar-extractor` ⊂ `zip-extractor`.

## gif-tools/apng-to-gif

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| apng-to-gif | FAQ 4 | « Yes, it's completely free with no signup and no limit on how many files you can process. » | GÉNÉRIQUE | Même phrase sur gif-compressor (P:105) et gif-to-apng (P:107) (`unicite-avant.json`, repeated) | Remplacer par un fait propre (traitement dans la page, 16,7 Mpx par image au plus). |
| apng-to-gif | about + astuce 2 | « frame delays … are carried over » / « Frame delays from the original APNG are preserved » | TROMPEUR | Une image APNG de délai 0 sort à 100 ms (P:44 `delay \|\| 100`) | « Les délais sont repris ; une image sans délai prend 100 ms. » |
| apng-to-gif | about / FAQ (absent) | — | MINCE | Non dit : limite 16 777 216 px par image, tous appareils, avec message « too large for an animation (16 megapixels at most) » (app/lib/gifEncode.js:51-58, P:32-33) ; refus d'un non-PNG (P:34) ; nom converted.gif (P:66) ; nombre de lectures repris (P:39-40) | Ajouter ces faits. |

## gif-tools/avi-to-gif

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| avi-to-gif | interface (sous-titre) + étape 1 | « Convert a AVI clip » / « Select a AVI file » | LIBELLÉ | Coquille dans le texte affiché (P:9, P:14) | « an AVI ». |
| avi-to-gif | astuce 2 | « Play the video above to find the exact second where your clip should start. » | FAUX | La page dit elle-même « browsers cannot play AVI » (P:12) ; l'aperçu est un `<video>` du fichier (MS:142) ; durée non lue → début/longueur non vérifiés avant envoi (MS:58, GV:40) | Supprimer ; dire que l'AVI ne se lit pas dans l'aperçu, saisir le début en secondes. |
| avi-to-gif | FAQ 1 | « Yes, free with no signup and no watermark. » | TROMPEUR | Nombre de conversions limité par connexion, par heure et par jour (TK:28,36-42 ; lib/media/ticket.js:49-50), non dit | Ajouter la limite horaire/journalière par connexion (messages réels TK:38,41). |
| avi-to-gif | about + méta | « so it works in every browser including Safari and iPhone » / « any browser » | INVÉRIFIABLE | Plancher du site Safari 16.4 (app/lib/polyfills.js:5) ; Safari réel / iPhone « Non prouvé » pour le service (docs/audit/RAPPORT-video-deploiement.md:14) | « La conversion se fait sur notre serveur : le navigateur n'a pas besoin de lire l'AVI. » |
| avi-to-gif | about + FAQ 5 | « Your file is deleted from our server as soon as you have downloaded the GIF. » / « deleted as soon as you have downloaded the result » | TROMPEUR | Vidéo supprimée dès la fin du traitement (services/media-processing/app/jobs.py:7) ; GIF supprimé après sa première lecture complète par la page, faite avant le bouton Download (main.py:236-240, app/lib/mediaJob.js:130-134,194) ; sinon après MEDIA_JOB_TTL_SECONDS (jobs.py:8-10, config.py:44) | Décrire ce déroulé exact. |
| avi-to-gif | étapes 1-4, FAQ 1-5, astuces 1-2 | (bloc entier) | GÉNÉRIQUE | 84 % identique à webm-to-gif, 83 % à mov-to-gif, 76 % à mp4-to-gif (`unicite-avant.json`, over) | Réécrire avec ce qui est propre à l'AVI. |
| avi-to-gif | about / FAQ (absent) | — | MINCE | Non dits : réglages « Plays » et « Compression » (GV:64-78), faits dans le navigateur par gifsicle (GV:21-31) ; durée mini 0,2 s (GV:37) ; vidéo jamais agrandie (ffmpeg_ops.py:322-323) ; fichier sans image refusé (ffmpeg_ops.py:559-560) ; durée de la source plafonnée (jobs.py:195-196) | Ajouter. |

## gif-tools/mov-to-gif

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| mov-to-gif | FAQ 1 | « Yes, free with no signup and no watermark. » | TROMPEUR | Limite par connexion heure/jour non dite (TK:36-42) | Ajouter la limite. |
| mov-to-gif | about + méta | « works in every browser including Safari and iPhone » / « any browser » | INVÉRIFIABLE | polyfills.js:5 ; RAPPORT-video-deploiement.md:14 | Dire ce que fait le serveur, sans « every/any browser ». |
| mov-to-gif | about + FAQ 5 | « Your file is deleted from our server as soon as you have downloaded the GIF. » | TROMPEUR | jobs.py:7-10 ; main.py:240 ; mediaJob.js:194 | Déroulé exact (voir avi-to-gif). |
| mov-to-gif | étapes, FAQ, astuces | (bloc entier) | GÉNÉRIQUE | 83 % identique à avi-to-gif et webm-to-gif, 75 % à mp4-to-gif (`unicite-avant.json`) | Réécrire (iPhone, Photothèque réduite par iOS : app/components/IosOriginalNote.jsx). |
| mov-to-gif | about / FAQ (absent) | — | MINCE | Plays / Compression / gifsicle non dits (GV:21-31,64-78) ; une seule phrase propre au MOV (P:12) | Ajouter. |

## gif-tools/mp4-to-gif

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| mp4-to-gif | FAQ 1 | « Yes, free with no signup and no watermark. » | TROMPEUR | Limite par connexion heure/jour non dite (TK:36-42) | Ajouter la limite. |
| mp4-to-gif | about | « so it works in every browser including Safari and iPhone » | INVÉRIFIABLE | polyfills.js:5 ; RAPPORT-video-deploiement.md:14 | Sans « every browser ». |
| mp4-to-gif | about + FAQ 5 | « Your file is deleted from our server as soon as you have downloaded the GIF. » | TROMPEUR | jobs.py:7-10 ; main.py:240 ; mediaJob.js:194 | Déroulé exact. |
| mp4-to-gif | étapes, FAQ, astuces | (bloc entier) | GÉNÉRIQUE | 75-76 % identique à avi/mov/webm-to-gif, 60 % à video-to-gif (`unicite-avant.json`) | Réécrire. |
| mp4-to-gif | about / FAQ (absent) | — | MINCE | Aucun fait propre au MP4 ; Plays / Compression non dits (GV:64-78) | Ajouter. |

## gif-tools/webm-to-gif

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| webm-to-gif | FAQ 1 | « Yes, free with no signup and no watermark. » | TROMPEUR | Limite par connexion heure/jour non dite (TK:36-42) | Ajouter la limite. |
| webm-to-gif | about + méta | « works in every browser including Safari and iPhone » / « any browser » | INVÉRIFIABLE | polyfills.js:5 ; RAPPORT-video-deploiement.md:14 | Sans « every/any browser ». |
| webm-to-gif | about + FAQ 5 | « Your file is deleted from our server as soon as you have downloaded the GIF. » | TROMPEUR | jobs.py:7-10 ; main.py:240 ; mediaJob.js:194 | Déroulé exact. |
| webm-to-gif | étapes, FAQ, astuces | (bloc entier) | GÉNÉRIQUE | 84 % identique à avi-to-gif (`unicite-avant.json`) | Réécrire. |
| webm-to-gif | about / FAQ (absent) | — | MINCE | Plays / Compression non dits (GV:64-78) ; une seule phrase propre (P:12) | Ajouter. |

## gif-tools/video-to-gif (jumeau : video-tools/video-to-gif)

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| video-to-gif | FAQ 1 | « Yes, free with no signup and no watermark. » | TROMPEUR | Limite par connexion heure/jour non dite (TK:36-42) | Ajouter la limite. |
| video-to-gif | about + méta | « so it works in every browser including Safari and iPhone » / « Any browser, iPhone included. » | INVÉRIFIABLE | polyfills.js:5 ; RAPPORT-video-deploiement.md:14 | Sans « every/any browser ». |
| video-to-gif | interface (sous-titre) + about | « Turn a clip of any video » / « a clip of any video (MP4, MOV …) » | INVÉRIFIABLE | Le sélecteur ne prend que video/* et 17 extensions (MS:140 ; app/lib/mediaSupport.js:237-238) | Lister les formats acceptés. |
| video-to-gif | about + FAQ 6 | « Your file is deleted from our server as soon as you have downloaded the GIF. » / « deleted as soon as you have downloaded the result » | TROMPEUR | jobs.py:7-10 ; main.py:240 ; mediaJob.js:194 | Déroulé exact. |
| video-to-gif | astuce 3 | « Play the video above to find the exact second where your clip should start. » | TROMPEUR | Faux pour l'AVI et tout format que le navigateur ne lit pas (avi-to-gif P:12 ; aperçu MS:142 ; durée non lue MS:58) | « … si votre navigateur sait la lire ». |
| video-to-gif | étapes, FAQ, astuces | (bloc entier) | GÉNÉRIQUE | 54-60 % identique aux 4 pages par format ; astuces 1, 2, 4 identiques au jumeau video-tools (`unicite-avant.json`) | Réécrire, distinguer du jumeau. |
| video-to-gif | about / FAQ (absent) | — | MINCE | Plays / Compression non dits (GV:64-78) ; existence du jumeau avec extraction PNG non dite | Ajouter. |

## gif-tools/gif-compressor

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| gif-compressor | FAQ 5 | « Yes, it's completely free with no signup and no limit on how many files you can process. » | GÉNÉRIQUE | Même phrase sur apng-to-gif et gif-to-apng (`unicite-avant.json`) | Remplacer par un fait propre. |
| gif-compressor | about / FAQ (absent) | — | MINCE | Non dits : 100 Mpx au plus, message « too large to compress in a browser » (P:30-31, app/lib/fileChecks.js:200) ; correspondance qualité → `--lossy` 0 à 180 (P:35-38) ; résultat plus lourd signalé, jamais caché (P:78-84) | Ajouter. |

## gif-tools/gif-maker

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| gif-maker | titre | « GIF Maker — Turn a Sequence Online Free » | MINCE | Titre tronqué : ni images ni GIF animé (L:5) | « … Turn Images into an Animated GIF … ». |
| gif-maker | astuce 1 | « \"Same as the first image\" gives a smaller GIF. » | TROMPEUR | Plus petit seulement si la 1re image est plus petite que la plus grande (P:76-77) | Le dire. |
| gif-maker | FAQ 6 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | Phrase présente sur 92 pages (`unicite-avant.json`) | Remplacer. |
| gif-maker | FAQ 5 + astuce 3 | « Will photos look as good as flat graphics or icons? … The underlying encoder doesn't apply dithering… » | GÉNÉRIQUE | Mot pour mot sur image-to-gif (P:134, P:141) | Garder sur une seule page ou reformuler. |
| gif-maker | about / FAQ (absent) | — | MINCE | Non dits : aucune transparence, chaque image peinte sur la couleur de fond dans les 3 modes (P:96) ; 1920 px de côté au plus (P:14,78) ; 300 images max par GIF animé ajouté (P:43,50) ; durée par image ≥ 20 ms (P:104-105,139) ; délai commun 50-1000 ms (P:164) | Ajouter. |

## gif-tools/gif-to-apng

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| gif-to-apng | FAQ 4 | « Yes, it's completely free with no signup and no limit on how many files you can process. » | GÉNÉRIQUE | Même phrase sur apng-to-gif et gif-compressor | Remplacer. |
| gif-to-apng | about + astuce 1 | « Frame delays are carried over » / « Frame delays from the original GIF are preserved » | TROMPEUR | Délai 0 → 100 ms (app/lib/gifFrames.js:36) | Le dire. |
| gif-to-apng | about / FAQ (absent) | — | MINCE | Non dits : 16,7 Mpx par image au plus (P:66-67, gifEncode.js:51-58) ; APNG sans perte (UPNG cnum 0, P:72) ; nombre de lectures repris (P:24-51) est seulement en astuce | Ajouter. |

## gif-tools/gif-to-mp4

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| gif-to-mp4 | FAQ 6 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | 92 pages | Remplacer. |
| gif-to-mp4 | astuce 2 | « MP4 is far more widely compatible than GIF for sharing on social platforms or embedding in video players. » | GÉNÉRIQUE | Aucun lien avec le code ; phrase copiable partout | Supprimer ou remplacer par un fait (H.264 yuv420p + faststart, P:52-53). |
| gif-to-mp4 | astuce 4 | « For a much smaller file than the original GIF at similar visual quality, MP4/H.264 is typically far more efficient » | INVÉRIFIABLE | Aucune mesure dans docs/audit | Supprimer ou mesurer. |
| gif-to-mp4 | about / FAQ (absent) | — | MINCE | Non dits : 16,7 Mpx par image au plus (P:27-28) ; délai < 20 ms compté 100 ms (P:44) ; moteur ffmpeg.wasm (~30 Mo) téléchargé depuis unpkg.com (node_modules/@ffmpeg/ffmpeg/dist/esm/const.js:4, worker.js:11-17) — le GIF, lui, n'est pas envoyé | Ajouter. |

## gif-tools/image-to-gif

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| image-to-gif | titre | « Image to GIF — Turn a Batch Online Free » | MINCE | Titre tronqué (L:5) | « … Turn Images into an Animated GIF … ». |
| image-to-gif | FAQ 2 | « Any format your browser supports, including JPG, PNG, BMP, GIF, and WebP. » | TROMPEUR | Un GIF (ou WebP) animé ne donne que sa 1re image (chargé par `new Image()`, P:33-44) ; gif-maker, lui, le découpe (gif-maker P:41-53) | Le dire, renvoyer vers GIF Maker. |
| image-to-gif | FAQ 4 | « Yes, it's completely free with no account creation or login required. » | GÉNÉRIQUE | Phrase de gratuité sans fait propre | Remplacer. |
| image-to-gif | FAQ 3 + astuce 3 | « Will photos look as good as flat graphics or icons? … » | GÉNÉRIQUE | Mot pour mot sur gif-maker (P:192, P:199) | Une seule page ou reformuler. |
| image-to-gif | about / FAQ (absent) | — | MINCE | Non dits : 100 Mpx par image (P:39) ; boucle infinie sans option (aucun `repeat`, P:79) ; pas de réordonnancement ; jumeau gif-maker plus complet | Ajouter. |

## file-tools/file-comparator

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| file-comparator | méta + about | « instantly checks » / « It's a fast way » | INVÉRIFIABLE | Lecture par tranches de 8 Mio avec pourcentage « Comparing… N% » (P:22-31,57) ; aucune mesure | « octet par octet, par tranches de 8 Mio, avec la progression affichée ». |
| file-comparator | interface (sous-titre) | « Compare two files side by side » | TROMPEUR | Aucune vue côte à côte : verdict + position du 1er octet différent (P:61-62) | « Check whether two files are identical, byte for byte ». |
| file-comparator | FAQ 2 | « Any file type and any size … even multi-gigabyte files can be compared » | INVÉRIFIABLE | Pas de constante de taille ; aucune mesure multi-Go dans docs/audit | Dire « lus par tranches de 8 Mio, sans constante de taille » sans promettre « any size ». |
| file-comparator | astuce 3 | « this tool only reports whether files match » | FAUX | Donne aussi la position du 1er octet différent (P:62) ; contredit la FAQ 3 | Corriger. |
| file-comparator | FAQ 4 | « Yes, it's completely free with no signup and no limit on how many comparisons you can run. » | GÉNÉRIQUE | Phrase de gratuité | Remplacer. |

## file-tools/file-converter

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| file-converter | titre + méta + about + FAQ 2 | « converts plain-text-based files between TXT, JSON, CSV, and HTML formats » | TROMPEUR | Le contenu n'est jamais interprété : JSON = texte dans `{"content": …}` (P:30) ; CSV = tabulations → virgules (P:33-35) ; HTML = texte échappé dans `<pre>` (P:40-43) ; TXT = texte relu en UTF-8 (P:20-27) | Dire exactement ces 4 transformations. |
| file-converter | interface (accept) | « .txt, .csv, .json, .html, or .md » | FORMAT | La conversion CSV transforme du texte séparé par tabulations (P:31-35) mais .tsv n'est pas accepté ; .htm, .markdown non plus (P:60) | Accepter .tsv/.htm ou le dire. |
| file-converter | FAQ 1 | « Yes, it's completely free with no signup and no limit on how many files you can convert. » | GÉNÉRIQUE | Phrase de gratuité | Remplacer. |
| file-converter | about / FAQ (absent) | — | MINCE | Non dit : la vraie valeur de TXT = détection d'encodage (BOM, UTF-8, sinon page de code ANSI) et réécriture en UTF-8 (P:20-27) ; nom de sortie = nom + nouvelle extension (P:65) | Ajouter. |

## file-tools/file-encryptor

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| file-encryptor | titre | « File Encryptor — Obfuscate Any File Online Free » | FAUX | AES-256-GCM (P:5,26 ; app/lib/textCrypto.js:71-84) | « Encrypt Any File with a Password (AES-256) ». |
| file-encryptor | méta | « obfuscates any file with a password-based XOR cipher » | FAUX | Le chiffrement est AES-256-GCM + PBKDF2-SHA-256 600 000 itérations (textCrypto.js:17,30-33,76-84) ; le XOR ne sert qu'à relire les anciens fichiers (textCrypto.js:98-100) | Réécrire la méta. |
| file-encryptor | about + FAQ 3 | « a wrong password or a modified file is refused with a clear message instead of producing a corrupted file » / « you never get a silently corrupted file » | TROMPEUR | Vrai seulement pour un fichier à en-tête OCF1 ; sans cet en-tête (ancien XOR, fichier non chiffré, 4 premiers octets modifiés) le fichier est « déchiffré » par XOR sans contrôle, avec un avertissement (textCrypto.js:90,98-100 ; P:29) | Préciser l'exception. |
| file-encryptor | astuce 2 | « 48 bytes of salt, IV and authentication tag » | FAUX | 48 = 4 (marqueur « OCF1 ») + 16 (sel) + 12 (IV) + 16 (étiquette) (textCrypto.js:71,74,78-83) | « 48 bytes: a 4-byte marker, 16-byte salt, 12-byte IV, 16-byte tag ». |
| file-encryptor | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | 92 pages | Remplacer. |

## file-tools/file-metadata

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| file-metadata | titre + méta + about | « Instantly Reveals » / « instantly reveals » / « in seconds » | INVÉRIFIABLE | Métadonnées internes lues ensuite, avec « Reading the metadata inside the file… » (P:34,60) ; aucune mesure | Sans « instantly / in seconds ». |
| file-metadata | méta | « name, size, MIME type, date, and extension » | MINCE | Omet le vrai format lu dans les octets (P:23-25, 46 signatures app/lib/fileSignature.js:11-58) et les métadonnées internes (app/lib/embeddedMetadata.js:99-111) | Les citer. |
| file-metadata | astuce 4 | « For deeper metadata like camera EXIF data or image dimensions, you'll need a format-specific metadata tool. » | FAUX | L'outil lit l'EXIF et le GPS des photos (embeddedMetadata.js:103 ; about P:76 ; FAQ 2 P:85) | Garder seulement « image dimensions / duration ». |
| file-metadata | FAQ 2 + about | « Word / Excel / PowerPoint and OpenDocument properties » / « Office documents » | TROMPEUR | Seuls les formats ZIP (DOCX/XLSX/PPTX, ODF) sont lus (embeddedMetadata.js:47-55,105) ; .doc/.xls/.ppt anciens : rien (embeddedMetadata.js:103-108) | « DOCX, XLSX, PPTX et OpenDocument (pas les anciens .doc/.xls/.ppt) ». |
| file-metadata | FAQ 1 | « Yes, it's completely free with no signup and no limit on how many files you can inspect. » | GÉNÉRIQUE | Phrase de gratuité | Remplacer. |

## file-tools/file-splitter

Lignes de `page.jsx` (le fichier `config.js` est à part).

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| file-splitter | FAQ 3 + astuce 3 | « each part is a lazy byte-range view of the original, only read when you actually download it » / « only downloading a part actually reads its bytes » | FAUX | Chaque ligne de résultat est un FileDownload avec seulement `href` (P:136), qui relit la partie dès que la ligne s'affiche (`fetch(href).blob()`, FD:124-135) | Retirer ; dire que la découpe ne copie pas le fichier, sans promesse sur la lecture. |
| file-splitter | interface + astuce 3 | « Splitting is instant — chunks are lazy byte-range views, not copied into memory. » / « Splitting is instant regardless of file size » | TROMPEUR | La découpe (Blob.slice, P:79-90) est immédiate, mais la page relit ensuite chaque partie (FD:129-134) et « Download all (N files, ZIP) » construit le ZIP en mémoire (FD:241-256) ; mesure seulement sous Node, en commentaire (config.js:7-14) | Ne promettre que la découpe ; pas « regardless of file size ». |
| file-splitter | étape 2 | « set the chunk size and unit (Bytes, KB, or MB) » | LIBELLÉ | Options affichées « B », « KB », « MB » ; KB = 1024 o, MB = 1 048 576 o (P:62,127) | « B, KB or MB (1 KB = 1024 bytes) ». |
| file-splitter | astuce 2 | « e.g. 24MB for a 25MB email attachment … to leave room for any encoding overhead » | TROMPEUR | Ici 1 MB = 1 048 576 o (P:62) : « 24 MB » = 25,17 millions d'octets ; une pièce jointe est envoyée encodée en base64 (+33 %) | Donner un exemple juste ou retirer. |
| file-splitter | méta + about | « divides any file into smaller, numbered parts by size » | MINCE | Omet « Into equal parts » (P:122), « Join parts » (P:22-38,111), limites 5 GB et 1000 parties (config.js:28-30) | Les citer. |
| file-splitter | étape 4 | « Download each part individually » | MINCE | « Download all (N files, ZIP) » existe (P:134 ; FD:264) | Le dire. |

## file-tools/tar-extractor

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| tar-extractor | about | « Upload a .tar, .tar.gz, or .tgz file to instantly see and download its contents. » | INVÉRIFIABLE | « instantly » : archive lue puis décompressée en entier, « Extracting... » (P:31-36,61), aucune mesure ; « Upload » contredit « no upload » (rien n'est envoyé) | « Choose a … file: its files are listed when extraction ends. » |
| tar-extractor | FAQ 4 | « Do I need to install any software? No, TAR Extractor works directly in your web browser on any device without additional software installation. » | GÉNÉRIQUE | Exemple type de la consigne | Supprimer. |
| tar-extractor | FAQ 2 | « Folders and links are skipped; only real files are listed. » | TROMPEUR | Les liens physiques sont extraits comme copie de leur cible (app/lib/tarReader.js:107-112) ; liens symboliques et fichiers épars GNU listés « Not extracted (N) » (tarReader.js:113-115 ; P:45,63) | Le dire. |
| tar-extractor | étape 4 + astuce 3 | « Click \"Download\" next to each file to save it individually. » / « download the ones you need individually » | MINCE | « Download all (N files, ZIP) » existe (P:67 ; FD:264) | Le dire. |
| tar-extractor | interface (accept) | `.taz` dans accept | FORMAT | .taz (tar compressé par « compress », .Z) accepté mais seul le gzip (1F 8B) est décompressé (P:14,32-36) | Retirer .taz ou le décompresser ; sinon le dire. |

## file-tools/zip-creator

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| zip-creator | interface + FAQ 5 | « Opens in 7-Zip, WinRAR, Windows 11 and The Unarchiver. » / « which 7-Zip, WinRAR, Windows 11 Explorer and The Unarchiver open » | INVÉRIFIABLE | Seul lecteur indépendant vérifié : bsdtar/libarchive (docs/audit/RAPPORT-p24-couverture-03-10.md:217-221) ; ailleurs, commentaire seulement (zipCreator.worker.js:19-21) | « AES-256 (WinZip AE-2), standard lu par 7-Zip et WinRAR » seulement après vérification, sinon nommer bsdtar. |
| zip-creator | FAQ 6 | « a measured limit to keep zipping reliable » | INVÉRIFIABLE | Mesures sous Node seulement, en commentaire (config.js:1-22) ; aucun rapport navigateur dans docs/audit | Dire la limite sans « measured », ou produire le rapport. |
| zip-creator | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | 92 pages | Remplacer. |
| zip-creator | astuce 5 | « Great for bundling multiple documents or images into a single file before emailing or uploading elsewhere. » | GÉNÉRIQUE | Phrase copiable | Supprimer. |
| zip-creator | about / FAQ (absent) | — | MINCE | Non dits : fichiers mis à la racine sous leur seul nom, pas de dossiers (P:106 ; worker:45-47) ; nom archive.zip (P:158) dit seulement en FAQ | Ajouter. |

## file-tools/zip-extractor

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| zip-extractor | titre | « ZIP Extractor — Extract ZIP Online Free » | MINCE | Le titre ne dit que ZIP alors que l'outil ouvre RAR, 7Z, TAR… (P:250) | Nommer RAR/7Z. |
| zip-extractor | interface + méta + FAQ 1 | « 40+ other archive formats » ; liste « ISO, CAB, WIM, DMG, VHD, ARJ, LZH, CPIO, RPM, DEB, CHM, MSI » | INVÉRIFIABLE | Aucun décompte dans le code ni un rapport ; formats testés : RAR, RAR5, 7z, ZIP, CAB, LZH, archives découpées (docs/audit/RAPPORT-amelioration-15.md:35) | Citer les formats testés + « and the other formats 7-Zip reads ». |
| zip-extractor | interface + FAQ 4 | « Any archive size » / « Not on the archive » | TROMPEUR | Pour .tar.gz/.tgz/.tar.bz2/.tar.xz/.tar.zst, le .tar interne est décompressé en mémoire et refusé au-delà de 1.9 GB (300 MB téléphone/tablette) (config.js:20 ; extract.worker.js:175-199 ; P:98) | Ajouter l'exception. |

## Synthèse du lot gif-file

19 outils lus (+ le jumeau `video-tools/video-to-gif` lu pour comparaison). **89 défauts** :

| Type | Nombre |
|---|---|
| FAUX | 7 |
| INVÉRIFIABLE | 14 |
| TROMPEUR | 23 |
| GÉNÉRIQUE | 21 |
| MINCE | 20 |
| LIBELLÉ | 2 |
| FORMAT | 2 |

Valeurs NON TROUVÉ (aucune constante dans le code) : taille de fichier max pour apng-to-gif, gif-compressor, gif-maker,
gif-to-apng, gif-to-mp4, image-to-gif, file-comparator, file-converter, file-encryptor, file-metadata, tar-extractor,
recollage de file-splitter ; nombre d'images max d'apng-to-gif et gif-to-apng. Valeurs en variables d'environnement, non
lues (consigne) : MEDIA_JOBS_PER_HOUR_PER_IP, MEDIA_JOBS_PER_DAY_PER_IP, MEDIA_TICKET_MAX_BYTES,
MEDIA_MAX_DURATION_SECONDS, MEDIA_JOB_TTL_SECONDS.

Défauts de code vus en passant (hors texte, pour le propriétaire) : file-encryptor renomme le résultat si l'on change
d'onglet après coup (P:53 lit le mode courant) ; zip-creator, deux fichiers de même nom (JSZip remplace, zip.js refuse —
non testé).
