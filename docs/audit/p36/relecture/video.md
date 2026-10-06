# P36 — contrôle n° 2 : relecture indépendante « video » (11 pages)

Pages relues : `app/tools/video-tools/` video-compressor, video-converter, video-filter, video-merger, video-resizer,
video-rotator, video-screenshot, video-to-audio, video-to-gif, video-trimmer, video-watermark (+ jumelle
`gif-tools/video-to-gif` pour l'unicité). Production = branche `mediaServiceConfigured()` vraie (`MediaServiceTool`),
jamais `LegacyPage`. Code lu : pages, `app/components/MediaServiceTool.jsx`, `GifFromVideoTool.jsx`, `FileDownload.jsx`,
`IosOriginalNote.jsx`, `app/lib/mediaJob.js`, `reportError.js`, `useToolError.js`, `isMobileDevice.js`, `canvasLimit.js`,
`audioFormats.js`, `mp4Rotate.js`, `app/api/media/ticket/route.js`, `lib/media/ticket.js`,
`services/media-processing/app/{ffmpeg_ops,jobs,main,config}.py`, `Dockerfile`.
Contrôles relancés (lecture seule) : `content-verify.mjs --only=video-tools/` 0 défaut (C0-C7) ; `instructions.mjs`
0 libellé faux ; `privacy-claims.mjs` 0 échec. Doublons de phrases : script local (littéraux de toutes les pages
`app/tools/**`, phrases normalisées, identité exacte + trigrammes ≥ 55 %).

## Défauts

| Page | Endroit | Phrase (citation courte) | Problème | Preuve (fichier:ligne ou calcul) | Correction proposée |
|---|---|---|---|---|---|
| video-compressor | privacy | « Its log keeps only the operation, a size range and the duration » | 3 — « only » promet moins que le code : la ligne de journal du travail porte aussi le **statut** ; gunicorn écrit en plus une ligne d'accès par requête (heure, méthode, chemin avec l'identifiant du travail, code HTTP). Aucun nom ni contenu, mais « only » est faux. | `jobs.py:406` (`op, size, status, seconds`) ; `Dockerfile:35` (`--access-logformat '%(t)s %(m)s %(U)s %(s)s'`) | « Its logs record the operation, a size range, the job's status and timing, never the file name or content. » |
| video-compressor + video-filter | FAQ 5 (compressor) / FAQ 4 (filter) | « One at a time, up to 1 GB each, within a set number per hour and per day for your internet connection » / « One per run, up to 1 GB each, within a set number of jobs per hour and per day for your internet connection » ; puis « The count is shared with the other tools… » / « Every tool that uses our video service shares this count » | 5 — réponses quasi identiques (même structure, 67 % de trigrammes ; deuxième phrase reformulée seulement) | `video-compressor/page.jsx:65`, `video-filter/page.jsx:42` | Garder la question sur une seule des deux pages ; sur l'autre, la remplacer par une question propre (filtre : « Does Blur change with the video size? » déjà traité → p. ex. « Is the filtered file larger than the original? », réponse tirée de l'échelle `jobs.py:338-384`). |
| video-converter | FAQ 3 | « H.265 and AV1 make smaller files at similar quality but take longer to encode » | 1 — **contredit par le rapport** : en production, sortie MP4 H.264 37,0 s (30 s) / 36,6 s (3 min) ; H.265 20,3 s / 58,7 s ; AV1 19,4 s / 29,0 s. AV1 a été plus rapide que H.264 les deux fois, H.265 plus rapide sur 30 s. | `docs/audit/RAPPORT-video-qualite.md:50-52` | Retirer « but take longer to encode » (ou : « AV1 took less time than H.264 in our test, H.265 more on a 3-minute clip »). |
| video-converter | FAQ 3 | « at similar quality » | 4 — invérifiable / contredit aux réglages du convertisseur : même tableau, H.265 VMAF 90,0 contre 94,5 (30 s) et 84,9 contre 94,7 (3 min) pour H.264. La mesure « même qualité, −40 / −50 % » (P25) porte sur les **niveaux du compresseur**, pas sur la qualité « Balanced » du convertisseur. | `RAPPORT-video-qualite.md:50-52` ; `ffmpeg_ops.py:138, 145` (CRF h265 28 / av1 36 en « medium ») ; `RAPPORT-p25-decisions-03-10.md` §5 (compresseur) | « H.265 and AV1 usually make smaller files; in our 30-second test, AV1 kept almost the same quality score while H.265 scored lower. » ou supprimer la comparaison de qualité. |
| video-converter | FAQ 2 | « An MP4, MOV, MKV, WebM, H.265 or AV1 result … up to 3 tries … AVI, WMV, MPG and other older formats get a bitrate taken from your file » | 1 — liste incomplète qui classe mal : FLV, F4V, TS, M2TS, MTS, 3GP, 3G2 et M4V sont aussi réencodés jusqu'à 3 fois (le lecteur les range dans « other older formats ») ; et avec un CRF exact il n'y a **aucun** nouvel essai. | `ffmpeg_ops.py:61` (`LADDER_TARGETS`) ; `jobs.py:332-341` (CRF → `plan = [params]`) | « Every video format except AVI, XviD, WMV, ASF, MPG, MPEG, VOB and OGV is encoded again… (not when you type an exact CRF). AVI, WMV, MPG, VOB and OGV get a bitrate taken from your file. » |
| video-converter | howTo 3 | « Set "Quality" and, for video, an optional "Resolution" limit; … open "More options: speed, mirror, …" if needed » | 1 — la combinaison proposée échoue : une limite « Resolution » + « Mirror » ou « Speed » est refusée par le service (« Choose either a size or a maximum height. ») après l'envoi du fichier, car miroir et vitesse ajoutent des filtres vidéo. (Défaut de code aussi, voir remarques.) | `video-converter/page.jsx:86-90` (maxHeight envoyé avec les options) ; `ffmpeg_ops.py:424, 461` (flip, setpts dans `vf`) et `:604-605` (refus) | Corriger le code (appliquer la hauteur après les filtres) ; à défaut, écrire : « A "Resolution" limit cannot be combined with "Speed" or "Mirror". » |
| video-converter | privacy | « Only the operation, a size range and the duration are logged » | 3 — même cas que video-compressor (statut + journal d'accès). | `jobs.py:406` ; `Dockerfile:35` | Même correction que video-compressor (formulée autrement). |
| video-converter + video-to-audio | howTo 1 (les deux) | « Choose or drop a video file: MP4, MOV, MKV, WebM, AVI or another video type. » | 5 — phrase **identique** sur les deux pages. | `video-converter/page.jsx:48` ; `video-to-audio/page.jsx:123` | Réécrire l'une (to-audio : « Choose or drop the video whose sound you want to keep. »). |
| video-filter + video-screenshot | howTo 1 (les deux) | « Choose or drop a video file; it opens in a player. » | 5 — phrase **identique**. | `video-filter/page.jsx:25` ; `video-screenshot/page.jsx:131` | Réécrire l'une (filter : « Choose or drop a video; the player shows the selected effect on it. »). |
| video-filter + video-resizer | specs « Output » | « MP4 (H.264 video, AAC sound at 160 kbps) » | 5 — valeur **identique** sur les deux pages. | `video-filter/page.jsx:32` ; `video-resizer/page.jsx:107` | Ajouter ce qui est propre à chaque page (filter : « …, effect burned into every frame » ; resizer : « …, at the new size or the cropped area »). |
| video-filter + video-resizer | howTo 3 / howTo 4 | « Click "Apply Filter" and follow the upload and processing percentage. » / « Click "Resize Video" and follow the upload and processing percentage. » | 5 — quasi identique (seul le libellé change). | `video-filter/page.jsx:27` ; `video-resizer/page.jsx:102` | Varier la seconde moitié (p. ex. resizer : « …; the waiting line appears when the service is busy »). |
| video-filter + video-resizer | FAQ « Is the sound … » | « Other audio tracks and subtitles are not kept in the filtered MP4. » / « Other audio tracks and subtitles are not kept. » | 5 — quasi identique. | `video-filter/page.jsx:41` ; `video-resizer/page.jsx:118` | Reformuler l'une. |
| video-merger | specs « Maximum total size » + FAQ 4 | « 700 MB on a phone or tablet (iPad included) » | 1 — faux pour les tablettes Android sous Chrome / Edge / Samsung Internet : `navigator.userAgentData.mobile` y vaut `false`, la page applique alors la limite ordinateur (2 GB). Vrai pour iPad (Safari) et Firefox Android. | `app/lib/isMobileDevice.js:5` ; `video-merger/page.jsx:58-60` | « 700 MB on a phone or an iPad » (ou « on phones, iPads and some Android tablets »). |
| video-merger | FAQ 2 | « each clip is encoded once in H.264 at the service's high-quality setting before the join » | 1 — pas toujours : la conversion `mp4` passe par l'échelle de taille ; si un clip ressort plus lourd que l'original, il est réencodé avec un CRF plus élevé (qualité plus basse). | `video-merger/page.jsx:112` (`quality: 'high'`, cible mp4) ; `jobs.py:338-339, 378-384` ; `ffmpeg_ops.py:61` | « …is encoded once in H.264, at the service's high-quality setting unless that would make it larger than the original… » |
| video-merger | description (About) | « as clips from one phone usually do » | 4 — « usually » sans mesure : les tests ne joignent que deux copies du **même** clip ; aucun test de clips différents d'un même téléphone joints par copie. | `docs/audit/RAPPORT-p16-photos-iphone-30-09.md:22-23` ; `video-merger/page.jsx:37-39` (signature : profil, pix_fmt, extradata identiques) | « …as clips filmed one after another with the same phone settings can be » ou supprimer « usually ». |
| video-resizer | privacy | « Logs hold the operation, a size range and the duration only. » | 3 — même cas que video-compressor. | `jobs.py:406` ; `Dockerfile:35` | Supprimer « only » ou citer statut et journal d'accès. |
| video-resizer | privacy (dernière phrase) | « An error message shown here is reported to us with the extension and a size range. » | 5 — quasi identique à la phrase de rotator / video-to-gif (64 %). | `video-resizer/page.jsx:113` | Reformuler (voir ligne suivante). |
| video-rotator + video-to-gif | privacy (dernière phrase, les deux) | « A shown error message is reported to us with the extension and a size range. » | 5 — phrase **identique** sur les deux pages. | `video-rotator/page.jsx:164` ; `video-to-gif/page.jsx:127` | Réécrire l'une (p. ex. « If the rotation fails, the message and the file type are reported to us, never the video. »). |
| video-rotator | FAQ 2 | « encoded again in H.264 at the service's high-quality setting, at full resolution » | 1 — même échelle que le merger : un résultat plus lourd que l'original est réencodé à un CRF plus élevé. | `video-rotator/page.jsx:81` ; `jobs.py:338-339, 378-384` | Ajouter « unless that would make it larger than the original, then at a stronger compression ». |
| video-screenshot | tips 1 | « The "Go to (seconds)" field moves in steps of 0.04 seconds: use its arrows to reach a precise moment after a rough pause. » | 1 — **faux** : le champ n'est pas relié à la position du lecteur (aucune `value`, seul `onChange`) ; après une pause à 12,3 s, il est vide (ou garde l'ancienne saisie) et sa flèche saute à 0,04 s (ou à l'ancienne valeur + 0,04 s), pas à 12,34 s. | `video-screenshot/page.jsx:96` | « Type the second you want in "Go to (seconds)", then use its arrows to move 0.04 s at a time from there. » |
| video-screenshot | privacy | « If an error message appears, its text alone is reported to us. » | 3 — « alone » est faux : sont aussi envoyés le nom de l'outil, le type d'erreur et le navigateur avec sa version majeure. | `app/lib/useToolError.js:29` → `app/lib/reportError.js` (`payload` : tool, errorType, errorMessage, browser) | « …its cleaned text, the browser name and version are reported to us; never the video or the images. » |
| video-to-audio | description (About) | « It does not cut the sound or change its speed; for that, use Audio Trimmer on the result. » | 1 — Audio Trimmer ne change pas la vitesse (aucune option de vitesse ou tempo dans la page). | `app/tools/audio-tools/audio-trimmer/page.jsx` (aucun `speed`/`tempo`/`atempo`) | « It does not cut the sound: use Audio Trimmer on the result. » |
| video-to-audio | FAQ 5 | « Is there a file size limit? » → « None is set by the page, … » | 6 — question oui / non dont la réponse ne commence pas par Yes / No. | `video-to-audio/page.jsx:141` | « No. The page sets none, but… » |
| video-to-audio + video-watermark | specs « File size » + privacy | « None set by the page, but the whole video is copied into the tab's memory(, so a very large file can fail) » ; « If extraction fails, the error message, the file extension and a size range are reported to us, never the file » / « If watermarking fails, the message shown, the file extension and a size range are reported to us, never the video » | 5 — deux phrases quasi identiques entre les deux pages (60-61 %). | `video-to-audio/page.jsx:133, 135` ; `video-watermark/page.jsx:575, 577` | Reformuler l'une des deux pages (spec watermark : « No size cap; the 2-minute length limit applies »). |
| video-to-gif | specs « Clip length » + FAQ 4 | « shortened, with a note, when the video ends first » ; « a note under the result gives its real length » | 1 — la note n'existe que si le navigateur lit la durée (`<video>` ; NaN pour MKV, AVI, WMV… non lisibles, et beaucoup de formats sous Safari) : sinon le service raccourcit le GIF **sans note**. Et la note est affichée **au-dessus** du résultat (avant les tailles et l'aperçu), pas dessous. | `GifFromVideoTool.jsx:40-43` ; `MediaServiceTool.jsx:58` (durée NaN si illisible) et `:164` (note avant le tableau et l'aperçu `:175`) ; `ffmpeg_ops.py:503-507` | « When your browser can read the video's length, the GIF is shortened with a note above the result; otherwise it simply stops where the video ends. » |
| video-to-gif | FAQ 4 (question) | « What happens if the clip runs past the end of the video? » | 5 — quasi identique à la question de `gif-tools/mp4-to-gif` (« …past the end of the MP4? », 90 %). | `video-to-gif/page.jsx:132` ; `gif-tools/mp4-to-gif/page.jsx:33` | « What if my start plus length goes beyond the video? » |
| video-to-gif | specs « Maximum file size » | « 1 GB for the GIF, on a computer or a phone » | 6 — se lit comme une taille maximale du GIF produit ; c'est la vidéo envoyée qui est limitée à 1 GB. | `MediaServiceTool.jsx:21, 75` (contrôle sur le fichier choisi) | « 1 GB per source video for a GIF, on a computer or a phone » |
| video-trimmer | description (About) | « re-encoded … in your browser for short clips in Chrome or Edge, otherwise on our video service » | 1 — faux dans les deux sens : (a) sous Firefox et Safari, une coupe précise reste dans le navigateur quand l'estimation ≤ 45 s, soit en 1080p ≤ 1,5 s, en 720p ≤ 3,5 s, en 480p ≤ 7,8 s (45 / (29 × surface / 2 073 600)) ; (b) une vidéo de largeur ou hauteur **impaire** n'est jamais envoyée, quelle que soit sa durée. (Tout navigateur Chromium compte comme « Chrome or Edge » : Opera, Brave, Samsung Internet.) | `video-trimmer/page.jsx:23-29` (règle), `:172` | « …in your browser when the page estimates it takes under about 45 s (short clips, mostly in Chrome or Edge); otherwise on our video service. » |
| video-trimmer | privacy | « A Precise cut is re-encoded in your browser when it is short enough in Chrome or Edge. Otherwise the page … sends only that piece to our video service » | 3 — même erreur sur le lieu de traitement : de courtes coupes précises sous Firefox / Safari, et toute vidéo de taille impaire, restent sur l'appareil. | `video-trimmer/page.jsx:23-29, 172` | « …in your browser when that takes under about 45 s by the page's estimate (and always for odd-sized videos); otherwise… » |
| video-trimmer | FAQ 5 | « Only when re-encoding in your browser would take long: in Firefox and Safari, or for longer clips. » | 1 — la parenthèse fait croire que toute coupe précise sous Firefox / Safari est envoyée ; faux pour les très courtes coupes et les vidéos de taille impaire. | `video-trimmer/page.jsx:23-29` | « No, unless the page estimates the re-encoding would take over about 45 s in your browser (often in Firefox and Safari, or for longer clips); odd-sized videos always stay on your device. » |
| video-trimmer | FAQ 5 | « Is my video uploaded for a Precise cut? » → « Only when… » | 6 — question oui / non sans Yes / No en tête. | `video-trimmer/page.jsx:314` | Commencer par « No, unless… » (voir ligne précédente). |
| video-trimmer | howTo 1, specs « Maximum file size », FAQ 4 | « 100 MB on a phone or tablet, iPad included » | 1 — même cas que video-merger : une tablette Android sous un navigateur Chromium reçoit la limite ordinateur (300 MB). | `isMobileDevice.js:5` ; `video-trimmer/page.jsx:71, 74` | « …100 MB on a phone or an iPad » |
| video-watermark | howTo 4 + FAQ 2 | « follow the progress bar and the estimated time left » ; « the progress bar shows the time left » | 1 — **faux** : le « temps restant » affiché est la durée de **vidéo** restante (`(1 − progression) × durée`), pas le temps de calcul ; la page dit elle-même que le calcul prend 3,7 × (Chrome) à 29 × (Firefox) la durée en 1080p : l'estimation est donc 4 à 29 fois trop courte. | `video-watermark/page.jsx:300` (`setEta((1 - clamped) * duration)`), `:541` (« about ${eta}s remaining ») | Texte : « follow the progress bar » (retirer « estimated time left » / « shows the time left ») ; code : calculer l'estimation sur le temps écoulé, ou retirer le chiffre. |
| video-watermark | metadata.description + specs « Watermark » | « size, opacity, colour and 9 positions » ; « Text in any colour » | 6 — orthographe britannique hors libellé (la consigne demande l'anglais américain ; le libellé d'interface « Text colour » reste cité tel quel). | `video-watermark/layout.tsx:6, 10` ; `video-watermark/page.jsx:573` | « color » dans la méta et la spec. |

## Les deux chaînes d'interface modifiées dans video-watermark/page.jsx (contrôle demandé)

| Ligne | Avant | Après | Verdict |
|---|---|---|---|
| 180 | « takes roughly one second per second of video » | « can take several times the length of an HD video » | **Juste** : mesure du même encodeur (x264 veryfast dans ffmpeg.wasm) ≈ 3,7 s par seconde de 1080p sous Chromium, ≈ 29 s sous Firefox (292 s pour 10 s) — `video-trimmer/page.jsx:16, 23`, `docs/audit/RAPPORT-nuit-27-09.md:32`, `docs/audit/RAPPORT-deploiement-28-09.md:158`, relevé `AUDIT-TEXTES-P36.md:1545`. « HD » englobe le 720p non mesuré (≈ 1,6 × par proportion de surface), mais « can » le couvre ; « 1080p » serait plus cohérent avec la ligne 478. |
| 478 | « takes roughly as long as the video itself (about 1 second of processing per second of video) » | « for 1080p footage it can take several times the length of the video » | **Juste**, mêmes preuves. |

Conséquence non corrigée : l'estimation « about Ns remaining » (`page.jsx:300, 541`) repose encore sur l'ancienne hypothèse « 1 s par seconde » et contredit maintenant ces deux phrases (défaut ci-dessus).

## Jumelles video-tools/video-to-gif ↔ gif-tools/video-to-gif

Aucune phrase identique entre les deux pages (texte SEO, méta et titre comparés phrase à phrase). Plus proches : la liste
de formats (la jumelle ajoute QT, 86 %), les sous-titres d'interface (« Turn a clip of any video into an animated GIF — … »,
même début, hors SEO), et « Set "Plays" to "Once", "3 times" or "5 times"… » (56 %, phrases différentes). Méta et titres
distincts. Différence réelle bien dite des deux côtés (frames PNG seulement côté Video Tools).

## Observations (non comptées comme défauts, à arbitrer)

- **O1 — « 1 GB »** (compressor, converter, filter, resizer, rotator, video-to-gif) : c'est le plafond codé dans le
  navigateur (`MediaServiceTool.jsx:21`, `video-rotator/page.jsx:27`), donc un maximum vrai ; mais le billet et le
  service appliquent `MEDIA_TICKET_MAX_BYTES` / `MEDIA_MAX_FILE_BYTES` (environnement, illisible ; README propose
  1 073 741 824). Si la valeur de production était plus basse, la phrase serait fausse. Le commentaire du code exige
  l'égalité.
- **O2 — remontée d'erreurs** : les pages disent « with the (file) extension and a size range » ; sont aussi envoyés le
  nom de l'outil, le type d'erreur et le navigateur + version majeure (`reportError.js`, `payload`). Liste incomplète
  plutôt que fausse (seul « alone » de video-screenshot est compté).
- **O3 — FAQ « Yes / No / chiffre »** : questions ouvertes dont la réponse directe ne peut pas commencer ainsi (compter
  seulement si le propriétaire veut la règle à la lettre) : trimmer « Why does my clip start earlier…? » (Because…),
  « What format do I get? » ; screenshot « What resolution…? », « PNG, JPG or WebP: which…? », « Why can the page not
  capture…? » ; merger « Which video sets the size…? » ; rotator « Which option should I choose? » ; video-to-gif « How
  can I make the GIF file smaller? », « What happens if…? » ; watermark « Why is there a 2-minute limit? », « How long
  does watermarking take? », « Which videos are refused? ».
- **O4 — longueurs** : privacy de video-compressor = 91 mots (consigne de rédaction 40-90) ; texte visible ≈ 734 mots
  (compressor) et ≈ 754 (converter), au-dessus des 350-700 visés.
- **O5 — video-trimmer** : sa section privacy ne dit pas que les messages d'erreur partent (avec extension et tranche
  de taille, `page.jsx:237`), contrairement aux 10 autres pages ; rien de faux (« nothing is uploaded » vise le fichier).
- **O6 — liste de formats d'entrée identique** (« MP4, M4V, MOV, WebM, MKV, AVI, WMV, FLV, OGV, 3GP, 3G2, MPG, MPEG, TS,
  MTS, M2TS ») sur converter, resizer, rotator, video-to-audio, video-to-gif, trimmer : donnée, pas phrase ; C7 passe.
  Elle omet `.qt`, pourtant accepté (`mediaSupport.js:238`).

## Remarques hors texte (code / interface, non modifiables par les rédacteurs)

- **video-converter** : « Resolution » + « Mirror » ou « Speed » → refus du service après l'envoi complet du fichier
  (`ffmpeg_ops.py:604-605`). Correctif possible : appliquer `scale` après les filtres d'édition, ou ne pas envoyer
  `maxHeight` / désactiver « Resolution » quand une édition vidéo est choisie.
- **video-watermark** : estimation de temps restant fausse (`page.jsx:300`).
- **video-rotator** : choisir « Instant, lossless » pour un MP4 puis prendre un WebM masque le choix de mode mais garde
  `mode = 'lossless'` ; le message demande alors de choisir « Compatible everywhere », qui n'est plus affiché
  (`page.jsx:63, 117`).
- **video-merger** (interface, relevé INVÉRIFIABLE par l'audit, inchangé) : « in seconds when they come from the same
  camera » (`page.jsx:149`) ; **video-trimmer** (interface) : « instantly and losslessly by default » (`page.jsx:250`).

## Bilan

- Pages relues : **11** (+ la jumelle gif-tools/video-to-gif pour l'unicité).
- Défauts : **34**
  - 1 Exactitude : **13**
  - 2 Libellés : **0** (1 746 libellés cités vérifiés par `instructions.mjs`, et relus à la main pour ces 11 pages)
  - 3 Lieu de traitement : **5**
  - 4 Invérifiable : **2**
  - 5 Générique / dupliqué : **10**
  - 6 Structure / anglais : **4**
  - 7 Exemple : **0** (sans objet : pages de fichiers vidéo, aucun exemple)
- Pages **sans aucun défaut** : **aucune**.

## Deuxième passe (06/10)

Relu en entier les 11 pages après les « Corrections après relecture » (`docs/audit/p36/redaction/video.md`) : SEO
(About, étapes, specs, privacy, FAQ, astuces), `layout.tsx`, **et chaînes d'interface** (sous-titres, notes, cartes,
messages, libellés d'état), avec la liste de contrôle et les précisions du 06/10 de `CONSIGNES-REDACTION.md`. Les
34 défauts de la première passe sont corrigés (vérifiés un à un dans le code ; aucun réintroduit). Doublons relancés :
aucune phrase identique entre pages hors messages d'erreur d'interface ; aucune entre video-tools/video-to-gif et
gif-tools/video-to-gif. `instructions.mjs` 0 libellé faux ; `privacy-claims.mjs` 0 échec.

| Page | Endroit | Phrase (citation courte) | Problème | Preuve (fichier:ligne ou calcul) | Correction proposée |
|---|---|---|---|---|---|
| video-compressor | privacy | « A shown error sends us its cleaned text, the tool and browser names, the file extension and a size range. » | 3 — précision 06/10 : dire le nom **et la version** du navigateur ; la version manque. | `app/lib/reportError.js` (`browser: parseBrowserLabel` = nom + version majeure) | « …the tool name, your browser and its version, … » |
| video-resizer | privacy | « If resizing fails, the message shown, your browser, the file type and a size range are reported to us. » | 3 — manquent le nom de l'outil et la version du navigateur. | `reportError.js` (`tool`, `browser`) | « …the cleaned message, the tool name, your browser and version, the file type and a size range… » |
| video-rotator | privacy | « its cleaned message, the file type, a size range and your browser are reported to us » | 3 — manquent le nom de l'outil et la version du navigateur. | `reportError.js` | Ajouter « the tool name » et « and its version ». |
| video-trimmer | privacy | « A shown error reaches us with the file type, a size range and your browser. » | 3 — omet l'essentiel de ce qui part : le **message nettoyé** lui-même, le nom de l'outil, la version du navigateur. | `video-trimmer/page.jsx:237` → `reportError.js` (`errorMessage`, `tool`, `browser`) | « A shown error sends us its cleaned message, the tool name, your browser and version, the file type and a size range. » |
| video-filter | howTo 4 | « Play the result and click "Download" to save the MP4. » | 5 — étape générique de la liste bannie (« Click "Download" to save the … file. ») ; 57 % avec l'étape 5 de video-compressor. | `video-filter/page.jsx:28` ; `CONSIGNES-REDACTION.md` (précisions 06/10) | « Play the filtered MP4 and click "Download"; its name ends with the effect, such as -sepia. » (`outName`, `page.jsx:59`) |
| video-watermark | interface : libellé de la barre de progression | « Encoding... (about ${eta}s remaining) » | 1 — trompeur : le nombre est la durée de **vidéo** restant à encoder, pas le temps d'attente (3,7 × à 29 × plus long d'après la FAQ de la page). La FAQ l'explique désormais, mais la chaîne elle-même reste fausse. | `video-watermark/page.jsx:300` (`(1 - clamped) * duration`), `:541` | Chaîne : « Encoding... (${eta}s of video left) » ; ou retirer le nombre. |
| video-watermark | interface : message d'erreur de lecture | « MP4 (H.264) and WebM play in every browser » | 4 — « every browser » invérifiable (aucune preuve dans le dépôt ; l'audit P36 classe déjà « every browser » INVÉRIFIABLE, `AUDIT-TEXTES-P36.md:1615`) et WebM n'est pas lu par tous les Safari d'iPhone pris en charge. | `video-watermark/page.jsx:236` | « MP4 (H.264) is the safest choice; .avi, many .mov and .mkv files and less common codecs often don't play here. » |
| video-compressor, video-converter, video-filter, video-resizer | interface : sous-titre sous le H1 | « … — any browser, up to 1 GB » | 4 — « any browser » invérifiable (même classement par l'audit, `AUDIT-TEXTES-P36.md:1615` ; plancher du site Safari 16.4, P18). | `video-compressor/page.jsx:76`, `video-converter/page.jsx:82`, `video-filter/page.jsx:55`, `video-resizer/page.jsx:131` | Remplacer par un fait propre à l'outil (« done on our video service, up to 1 GB »). |
| video-filter + video-resizer | interface : sous-titre | « Apply a filter to a video — any browser, up to 1 GB, MP4 out » / « Resize or crop a video — any browser, up to 1 GB, MP4 out » | 5 — sous-titres quasi identiques (même seconde moitié, 69 %). | `video-filter/page.jsx:55` ; `video-resizer/page.jsx:131` | Différencier avec la ligne précédente (p. ex. filter : « …seven effects, previewed live »). |
| video-compressor, video-converter, video-filter, video-resizer, video-to-gif | interface : note sous le sous-titre (composant partagé) | « works in every browser, including Safari and iPhone » | 4 — invérifiable (« works everywhere », exemple cité par la consigne) ; vit dans un composant partagé, donc à signaler au contrôleur plutôt qu'au rédacteur. | `app/components/MediaServiceTool.jsx:135` | « processed on our video service, so Safari and iPhone work too » (ou retirer « every browser »). |

Observations (non comptées) : privacy au-dessus des 40-90 mots de la consigne de rédaction pour video-trimmer (124),
video-filter (102), video-rotator (94), video-converter (93), video-to-gif (91) ; texte visible au-dessus des 700 mots
visés pour video-converter (≈ 787), video-compressor (≈ 725) et video-trimmer (≈ 709). Bogues de code déjà notés au
plan : converter « Resolution » + vitesse / miroir, calcul de l'estimation du watermark, mode caché du rotator.

**Bilan de la deuxième passe** : 11 pages relues, **10 défauts** — 1 Exactitude : 1 · 2 Libellés : 0 · 3 Lieu de
traitement : 4 · 4 Invérifiable : 3 · 5 Générique / dupliqué : 2 · 6 Structure : 0 · 7 Exemple : 0 (sans objet).
Pages **sans aucun défaut** : video-merger, video-screenshot, video-to-audio.

## Troisième passe (06/10)

Relu en entier les 11 pages (SEO, `layout.tsx`, chaînes d'interface) après « Corrections après deuxième passe » et la
nouvelle note du composant partagé `MediaServiceTool.jsx:135`. Les 9 corrections du rédacteur sont justes (rapports
d'erreur conformes à `reportError.js` : message nettoyé, type, outil, navigateur + version, extension et tranche de
taille quand le fichier est passé ; étape 4 de video-filter conforme à `outName` ; sous-titres sans « any browser », non
dupliqués ; libellé et message de video-watermark `page.jsx:236, 541` exacts). Note partagée vérifiée : « processed on
our video server » et « the uploaded video is deleted when processing ends, the result once it has been downloaded or
after a set time » sont exacts (`jobs.py:400, 408` ; `main.py` `/result` puis `delete_output` ; balayeur `jobs.py:411-418`).
Doublons relancés : rien de nouveau.

| Page | Endroit | Phrase (citation courte) | Problème | Preuve (fichier:ligne ou calcul) | Correction proposée |
|---|---|---|---|---|---|
| video-to-gif | interface : note partagée sous le sous-titre | « processed on our video server, not in your browser » | 3 — faux sur cette page : « Plays » et « Compression » sont appliqués par gifsicle **dans le navigateur** après le service, et « Or extract frames as PNG images » est fait entièrement dans le navigateur ; la page le dit elle-même (privacy). Même cas pour toutes les pages qui passent par `GifFromVideoTool` (gif-tools : mp4-, mov-, avi-, webm-, video-to-gif…). | `MediaServiceTool.jsx:135` ; `GifFromVideoTool.jsx:23-31` (`postProcess` gifsicle) ; `video-to-gif/page.jsx:16-66` (FrameExtractor, canvas) | Rendre la note paramétrable (prop) ou écrire « the video is processed on our video server » sans « not in your browser » ; sur Video to GIF : « …on our video server; loop count, compression and PNG frames are done in your browser ». |

**Bilan de la troisième passe** : 11 pages relues, **1 défaut** (point 3). Pages sans aucun défaut : les 10 autres
(video-compressor, video-converter, video-filter, video-merger, video-resizer, video-rotator, video-screenshot,
video-to-audio, video-trimmer, video-watermark).

## Quatrième passe (06/10)

Seule la note partagée `MediaServiceTool.jsx:135` a changé (pages et layouts des 11 outils inchangés depuis la
troisième passe). Nouvelle note : « converted on our video server · the uploaded video is deleted when processing ends,
the result once it has been downloaded or after a set time », vérifiée sur chaque page qui l'affiche :
video-compressor, video-converter, video-filter, video-resizer, video-to-gif (et gif-tools mp4-, mov-, avi-, webm-,
video-to-gif via `GifFromVideoTool`).
- « converted on our video server » : vrai partout — compression, conversion, filtre, redimensionnement et GIF sont
  faits par ffmpeg sur le service (`runMediaJob`, `ffmpeg_ops.build_command`). Sur Video to GIF, l'étape gifsicle et
  l'extraction de PNG faites dans le navigateur ne sont plus contredites (plus de « not in your browser ») et sont dites
  dans la section privacy.
- « the uploaded video is deleted when processing ends » : `jobs.py:400` (succès), `_fail` `:267-271`, annulation `:363-365`,
  `finally` `:407-408`.
- « the result once it has been downloaded or after a set time » : `main.py` `/result` → `jobs.delete_output` après
  téléchargement complet ; balayeur `jobs.py:411-418` (`JOB_TTL_SECONDS`) ; résultat « pas plus petit » supprimé tout de
  suite (`jobs.py:394-399`), ce qui reste couvert.

**0 défaut.** Les 11 pages sont sans défaut.
