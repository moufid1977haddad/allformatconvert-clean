# P36 — rédaction du lot « video » (11 outils)

Base : fiche de faits `docs/audit/p36/faits/video.json`, audit `docs/audit/p36/audit/video.md` (61 défauts),
`CONSIGNES-REDACTION.md` (dont « Précisions 06/10 ») et `GABARIT-CONTENU-P36.md` §2-§3. Branche décrite : production,
service vidéo configuré (`MediaServiceTool` / `runMediaJob`) ; aucune `LegacyPage.jsx` touchée ni décrite.

Fichiers modifiés : `app/tools/video-tools/<outil>/page.jsx` (objet `seo` ou props de `<SeoContent>`) et `layout.tsx`
(titre, description, openGraph) des 11 outils ; `docs/audit/p36/preuves/video.json` (57 preuves) ; ce compte rendu.
Fins de ligne CRLF conservées.

Règles appliquées partout :
- Limites horaires et journalières par connexion du service vidéo : leur existence est dite, aucun chiffre
  (`MEDIA_JOBS_PER_HOUR_PER_IP` / `MEDIA_JOBS_PER_DAY_PER_IP` sont des variables d'environnement). Les valeurs proposées
  dans le README (2 h, 25 min, 15 min, 20/60) ne sont **pas** écrites : « a set time », « a maximum duration »,
  « a time limit per encoding ».
- Suppression côté service : l'original à la fin du traitement (`jobs.py:400`), le résultat après le premier
  téléchargement complet, fait par la page (`main.py:240`, `mediaJob.js:192`), sinon après un délai fixé (TTL non chiffré).
- Erreurs : le texte affiché est envoyé à `/api/report-error`, nettoyé (avec extension et tranche de taille quand l'outil
  appelle `reportToolError` avec le fichier) ; chaque section « privacy » le dit.
- Moteur ffmpeg.wasm : chargé depuis unpkg.com, « about 10 MB » (mesure `RAPPORT-formats-navigateurs.md:59`).
- Aucun exemple : outils de fichiers vidéo ; seul chiffre mesuré cité : −40 % / −50 % H.265 / AV1
  (`RAPPORT-p25-decisions-03-10.md` §5, 03/10), sur Video Compressor.

## Par outil

Mots : texte visible SEO estimé depuis le source (lignes retirées / ajoutées du diff, balises et clés comprises, donc
≈ +10 à 15 % par rapport au texte affiché).

| Outil | Titre (car.) | Méta (car.) | Mots avant → après | Défauts de l'audit supprimés |
|---|---|---|---|---|
| video-compressor | « Video Compressor — Smaller MP4 in H.264, H.265 or AV1 » (53) | 143 | ≈530 → ≈807 | « size ceiling » (FAUX), « No… tries one stronger setting » (CRF exact / Strong), « Nothing about your file is logged », « professional tools », astuce 720p, « Free » sans limite, « plays everywhere » pour AV1 ; limites ajoutées (durée, temps, son AAC 96 kbps) |
| video-converter | « Video Converter — MP4, MOV, MKV, WebM, AVI, GIF, MP3 & More » (59) | 145 | ≈665 → ≈834 | « size ceiling… does not exceed » (FAUX) → échelle réelle + « Larger by » ; « Any video or audio file » (FORMAT : vidéo seulement) ; « logged » ; GIF du convertisseur décrit (vidéo entière, 12 i/s, 640 px) ; astuce générique |
| video-filter | « Video Filter — Grayscale, Sepia, Blur, Invert & More » (52) | 153 | ≈354 → ≈594 | titre tronqué (FAUX) ; « audio carried through unchanged » (FAUX) → AAC 160 kbps ; flou de l'aperçu ≠ résultat ; « same luminance weights as image editors » ; limites |
| video-merger | « Video Merger — Join Clips Into One MP4 in Your Order » (52) | 153 | ≈424 → ≈674 | condition « alike » précisée (H.264/HEVC + AAC) ; « in seconds » retiré ; son stéréo AAC dit ; limites 2 GB / 700 MB / 60 i/s ajoutées ; un job par clip |
| video-resizer | « Video Resizer — Resize or Crop a Video, MP4 Result » (50) | 150 | ≈479 → ≈637 | libellés de préréglages exacts (« 720p », « Vertical 1080×1920 ») et onglet « Crop » ; « Free » sans limite ; 16-7680 px |
| video-rotator | « Video Rotator — Rotate 90°, 180°, 270° or Mirror a Video » (56) | 148 | ≈613 → ≈640 | « sound is not touched at all » (TROMPEUR en mode par défaut) ; 3G2 ajouté (FORMAT) ; « Free » sans limite |
| video-screenshot | « Video Screenshot — Save a Frame as PNG, JPG or WebP » (51) | 148 | ≈287 → ≈543 | WebP ajouté partout (FORMAT ×3) ; FAQ « free, no signup » ; astuce « motion blur » (FAUX) ; « timeline scrubber » → champ « Go to (seconds) » |
| video-to-audio | « Video to Audio — Extract Sound as MP3, WAV, FLAC & More » (55) | 147 | ≈275 → ≈638 | 18 formats au lieu de 11 (FORMAT) ; « in stereo » ; « nothing is downmixed » → mono/stéréo seulement, multicanal non testé ; « 25–30MB » (FAUX) → 10 MB ; « browser downloads a very large video » (FAUX) ; FAQ gratuite |
| video-to-gif | « Video to GIF — Make a GIF or Extract PNG Frames From a Clip » (59) | 144 | ≈395 → ≈708 | options « Plays » et « Compression » (gifsicle) décrites ; « Free » sans limite. Centrée sur ce qui la distingue du jumeau `gif-tools/video-to-gif` (même `GifFromVideoTool`) : l'extraction de 150 images PNG au plus, la boucle, la compression, la note de durée raccourcie |
| video-trimmer | « Video Trimmer — Cut a Video Without Re-encoding » (47) | 149 | ≈564 → ≈712 | « only the part you cut » (fichier entier si aucune image clé) ; « nearest keyframe » → « at or before your start » ; téléphone → « phone or tablet, iPad included » ; tailles calculées par `${MAX_MB_DESKTOP}` / `${MAX_MB_MOBILE}` |
| video-watermark | « Video Watermark — Add Text or a Logo to a Video » (47) | 150 | ≈635 → ≈693 | « five positions » (FAUX) → 9 ; « Convert » (LIBELLÉ) ; « 25-30MB » (FAUX) ; « 1 second per second » (FAUX) → mesure 3,7 s/s Chrome, 29 s/s Firefox (28/09, `video-trimmer/page.jsx:16,23`) ; PNG/JPG → toute image ; son « réencodé en AAC » ; codecs acceptés listés ; durée calculée par `${MAX_DURATION / 60}` |

## Chaînes d'interface modifiées (phrase FAUSSE de l'audit)

`app/tools/video-tools/video-watermark/page.jsx` :
1. ligne 478 : « Watermarking runs entirely in your browser and takes roughly as long as the video itself (about 1 second
   of processing per second of video). » → « Watermarking runs entirely in your browser; for 1080p footage it can take
   several times the length of the video. »
2. ligne 180 (message de refus > 2 min) : « …takes roughly one second per second of video, so longer files… » →
   « …can take several times the length of an HD video, so longer files… ».

Aucune autre chaîne d'interface, constante, logique ni libellé de bouton touché.

## Laissé de côté (non vérifiable ou hors périmètre)

- Interface de video-trimmer « instantly and losslessly by default » et case « an instant lossless copy » : INVÉRIFIABLE
  (pas FAUX), donc non modifiées (règle : seules les phrases FAUSSES de l'interface) ; le texte SEO n'emploie plus « instantly ».
- Composants partagés : rien de FAUX trouvé dans `MediaServiceTool.jsx` / `GifFromVideoTool.jsx` pour ce lot ; la ligne
  « files are deleted from our server as soon as you have downloaded the result » reste exacte (le résultat est même
  supprimé dès que la page l'a reçu).
- Compatibilité de lecture H.265 / AV1 : formulée comme les libellés du code (« most phones and computers », « recent
  browsers and devices »), sans liste de navigateurs.
- Son multicanal (5.1) dans Video to Audio : non testé dans le dépôt, la page le dit et conseille FLAC ou WAV.
- Video Rotator, compatibilité des lecteurs avec la rotation par métadonnée : reprise de `RAPPORT-p17-30-09.md` (cité
  par le code, `video-rotator/page.jsx:21-26`).

## Contrôles (06/10)

- `node scripts/p36/content-verify.mjs --only=video-tools/` : 15 pages, **0 échec** (C0-C7) ; part maximale de phrases
  identiques 14,3 % (paire PDF, hors lot).
- `node scripts/content-checks/instructions.mjs` : 225 pages, 1 726 libellés, **0 mismatch**.
- `node scripts/content-checks/privacy-claims.mjs` : **aucun échec sur video-tools** ; 24 échecs sur d'autres lots
  (ai-tools/keyword-extractor, text-summarizer, audio-tools/audio-booster, pdf-tools/pdf-compress…), pas de ce lot.

## Corrections après relecture (06/10)

Relecture : `docs/audit/p36/relecture/video.md` (34 défauts). Chacun a été revérifié dans le code ; **les 34 sont
fondés** et ont été corrigés, aucun contesté. Fichiers : `page.jsx` des 11 outils (props SEO uniquement),
`video-watermark/layout.tsx` (« colour » → « color »), `preuves/video.json` (+1 preuve : « 45 seconds »,
`video-trimmer/page.jsx` `return local > 45;`). Aucune chaîne d'interface modifiée dans cette passe.

| Défaut relevé | Vérification | Correction |
|---|---|---|
| « log keeps only… » (compressor, converter, resizer, filter) | `jobs.py:406` journalise aussi le statut ; `Dockerfile:35` journal d'accès gunicorn (heure, méthode, chemin, code) | « logs keep/record the operation, a size range, the job status and timings, never the file name or content » (4 formulations différentes) |
| Rapports d'erreur incomplets (« text alone », « with the extension… ») | `reportError.js:142-154` : outil, type, message nettoyé, navigateur + version (+ extension et tranche de taille si le fichier est passé) | chaque privacy dit ce qui part, sans « only/alone » ; trimmer : phrase ajoutée (O5) |
| Converter FAQ « take longer to encode », « similar quality » | `RAPPORT-video-qualite.md:50-52` : AV1 plus rapide que H.264 deux fois, H.265 plus rapide sur 30 s ; VMAF H.265 90,0 / 84,9 contre 94,5 / 94,7 | retiré ; « in our two test clips both gave smaller files than H.264 » (18,0 et 18,1 Mo < 19,4 ; 29,8 et 36,4 < 61,0) |
| Converter FAQ 2 classement des formats, CRF | `ffmpeg_ops.py:61` (LADDER_TARGETS), `jobs.py:332-341` | liste complète des formats à 3 essais et des formats à débit ; CRF exact, GIF, audio jamais réessayés |
| Converter howTo 3 : « Resolution » + vitesse / miroir | `ffmpeg_ops.py:424, 461, 604-605` : refus « Choose either a size or a maximum height. » (fondus et volume seuls passent : ils ne sont pas dans `filters`) | étape : « our video service refuses a "Resolution" limit combined with a speed or a mirror » ; **bogue de code laissé au plan** (refus après l'envoi complet) |
| Phrases dupliquées (converter/to-audio, filter/screenshot, filter/resizer ×3, compressor/filter FAQ quota, rotator/to-gif/resizer erreurs, to-audio/watermark taille et erreurs, to-gif/mp4-to-gif question) | comparaison relue | réécrites sur une des deux pages ; la FAQ quota de video-filter est remplacée par « Can the filtered file be larger than the original? » (`jobs.py:338-389`, « Larger by » `MediaServiceTool.jsx:168`) |
| Merger / trimmer « phone or tablet (iPad included) » | `isMobileDevice.js:5` : tablette Android sous Chromium = ordinateur | « on phones, iPhone and iPad » (consigne 06/10) |
| Merger / rotator « high-quality setting » sans l'échelle | `jobs.py:338-339, 378-384` (cible mp4) | « …or, if that would make it larger than the original, with stronger compression » |
| Merger « as clips from one phone usually do » | aucun test de clips différents d'un même téléphone | « as clips filmed one after another with the same phone settings can be » |
| Screenshot astuce flèches | `video-screenshot/page.jsx:96` : champ sans `value`, non relié au lecteur | « Type the second you want in "Go to (seconds)", then step 0.04 seconds at a time from there with the field's spin buttons. » (« arrows » évité : le contrôle « arrows to reorder » de `instructions.mjs` le prenait pour un réordonnancement) |
| To-audio « change its speed » via Audio Trimmer | page audio-trimmer sans vitesse | retiré |
| To-audio FAQ 5, trimmer FAQ 5 sans Yes/No ; « Because… » (trimmer, screenshot, watermark) | règle §2d.4 précisée | « No. The page sets none… », « No, unless… » ; réponses directes sans « Because » |
| To-gif note de durée « under the result », toujours présente | `GifFromVideoTool.jsx:40-43`, `MediaServiceTool.jsx:58, 164` | « with a note when your browser can read the video length », note « above the result » ; question reformulée |
| To-gif « 1 GB for the GIF » | `MediaServiceTool.jsx:76` contrôle la vidéo choisie | « 1 GB per source video for a GIF » |
| Trimmer : lieu du Precise cut (Chrome/Edge seulement) | `video-trimmer/page.jsx:23-29, 172` : estimation ≤ 45 s ou taille impaire → navigateur | About, privacy et FAQ 5 décrivent la règle des 45 s, le cas Firefox/Safari (très courtes coupes seulement) et les tailles impaires |
| Watermark « time left » | `video-watermark/page.jsx:300, 541` : `(1 − progression) × durée` = temps de vidéo restant | howTo : « follow the progress bar while the video is encoded » ; FAQ : « the seconds shown … count the video still to encode, not the waiting time » ; **estimation fausse laissée au plan** |
| Watermark « colour » hors libellé | — | « color » dans la méta, l'About et la spec ; le libellé « Text colour » reste cité tel quel |

Observations de la relecture : O2 (rapports d'erreur) et O5 (trimmer) traités ci-dessus ; O3 (réponses directes) appliqué
aux questions « Why » ; O1 (1 GB = plafond du navigateur, `MediaServiceTool.jsx:21`) gardé ; O6 (`.qt` absent des
listes) non changé, la liste reste celle des formats nommés.

Bogues de code pour le plan (non corrigés, hors périmètre) : converter « Resolution » + vitesse/miroir refusé après
l'envoi (`ffmpeg_ops.py:604-605`) ; estimation de temps de video-watermark (`page.jsx:300`) ; video-rotator garde
`mode = 'lossless'` caché après passage d'un MP4 à un WebM (`page.jsx:63, 117`).

Contrôles après corrections : `content-verify --only=video-tools/` 0 échec sur les 11 pages du lot (seul échec : C6 sur
video-metadata, lot audio) ; `instructions.mjs` 0 mismatch (1 757 libellés) ; `privacy-claims.mjs` 0 échec.

### Chaînes d'interface corrigées (consigne du 06/10 : textes invérifiables ou trompeurs)

| Fichier:ligne | Avant | Après | Raison |
|---|---|---|---|
| `video-trimmer/page.jsx:250` (sous-titre) | « …— instantly and losslessly by default, or to the exact frame » | « …— without re-encoding by default, or to the exact frame » | « instantly » invérifiable (moteur ~10 Mo + copie du fichier en mémoire) |
| `video-trimmer/page.jsx:269` (aide de « Precise cut ») | « …when that would be long — in Firefox and Safari, or for longer clips — only the part you cut is sent … which re-encodes it in seconds … Unchecked: an instant lossless copy that starts on the nearest keyframe before your start (often 1–3 s earlier…) » | règle réelle : navigateur si l'estimation est sous ~45 s (Chrome ≈ 4× la durée en 1080p) ou taille impaire ; sinon la partie depuis l'image clé précédente (le fichier entier si aucune n'est trouvée) ; « a lossless copy, without re-encoding, that starts on the keyframe at or before your start (it can be a few seconds earlier on phone videos) » | « in seconds », « instant » invérifiables ; « only the part » et « Firefox and Safari » trompeurs (`page.jsx:23-29, 172, 189-190`) |
| `video-merger/page.jsx:149` (sous-titre) | « …— in seconds when they come from the same camera » | « …— without re-encoding when they share the same encoding » | « in seconds » invérifiable ; condition réelle `page.jsx:39, 103` |
| `video-rotator/page.jsx:99` (sous-titre) | « …or instant and lossless for MP4 and MOV » | « …or without re-encoding for MP4 and MOV » | « instant » invérifiable (le nom d'option « Instant, lossless » reste inchangé : libellé) |
| `video-rotator/page.jsx:138` (message de résultat) | « Rotated instantly, without re-encoding: … » | « Rotated without re-encoding: … » | idem |
| `video-to-gif/page.jsx:106` (sous-titre) | « Turn a clip of any video into an animated GIF — or extract its frames as PNG images » | « Make an animated GIF from part of a video, or save its frames as PNG images » | « any video » invérifiable ; début identique à la jumelle gif-tools/video-to-gif |

Le mismatch `instructions.mjs` sur video-screenshot (« arrows to reorder ») est déjà levé (astuce reformulée, voir plus
haut). Contrôles finaux : `content-verify --only=video-tools/` 0 échec (15 pages) ; `instructions.mjs` 0 mismatch
(1 763 libellés) ; `privacy-claims.mjs` 0 échec.

## Corrections après deuxième passe (06/10)

Les 10 défauts de la « Deuxième passe » sont fondés (vérifiés dans `app/lib/reportError.js:142-154` : `tool`,
`errorType`, `errorMessage` nettoyé, `browser` = nom + version majeure, plus extension et tranche de taille quand le
fichier est passé) et corrigés, sauf le dernier (`MediaServiceTool.jsx:135`, composant partagé, traité par le
contrôleur).

- **Rapports d'erreur** : compressor, resizer, rotator, trimmer corrigés comme demandé ; par cohérence, le type d'erreur
  est aussi ajouté sur converter, filter, merger, screenshot, video-to-audio, video-to-gif et watermark.
- **Privacy de video-trimmer** ramenée de 124 à ≈ 85 mots (même contenu : règle des 45 s, taille impaire, morceau ou
  fichier entier, suppression).
- **video-filter étape 4** : « Play the filtered MP4 and click "Download"; its name ends with the effect, such as
  -sepia. » (`outName`, `video-filter/page.jsx`).

Chaînes d'interface modifiées :

| Fichier | Avant | Après |
|---|---|---|
| `video-compressor/page.jsx` (sous-titre) | « Compress video files — any browser, up to 1 GB » | « Make a video file lighter as an MP4 — encoded on our video service, up to 1 GB » |
| `video-converter/page.jsx` (sous-titre) | « … and more — any browser, up to 1 GB » | « … and more — on our video service, up to 1 GB » |
| `video-filter/page.jsx` (sous-titre) | « Apply a filter to a video — any browser, up to 1 GB, MP4 out » | « Give a whole video one of seven effects, previewed live before you apply it » |
| `video-resizer/page.jsx` (sous-titre) | « Resize or crop a video — any browser, up to 1 GB, MP4 out » | « Change a video's width and height, or crop it to the area you draw » |
| `video-watermark/page.jsx:541` (barre de progression) | « Encoding... (about ${eta}s remaining) » | « Encoding... (${eta}s of video left to encode) » — le calcul (`page.jsx:300`) reste au plan |
| `video-watermark/page.jsx:236` (message de lecture) | « MP4 (H.264) and WebM play in every browser; … often don't. » | « MP4 (H.264) is the safest choice; … often don't play here. » |

Contrôles : `content-verify --only=video-tools/` 0 échec (15 pages) ; `instructions.mjs` 0 mismatch (1 763 libellés) ;
`privacy-claims.mjs` 0 échec sur video-tools (2 échecs restants sur d'autres lots).
