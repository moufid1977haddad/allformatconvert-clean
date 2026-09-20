# RAPPORT — Défauts Safari : la classe « succès annoncé, fichier faux »

Date : 19 septembre 2026 · Branche `safari-defauts` (balise `restore-avant-safari-defauts`)
Base : test réel Safari 17.6 / macOS 14.8.9 (safaridriver) — 5 outils sur 20 en échec, causes = moteur WebKit, donc valables sur iPhone.

## 1. Verdict

Quatre des cinq échecs **mentent** : succès annoncé, fichier faux. C'est plus grave que la panne visible (l'utilisateur repart avec un fichier faux et ne revient pas). Cette classe est **traitée en premier et partout**, pas seulement sur les cinq outils : un module partagé `app/lib/mediaSupport.js` impose trois règles (sortie vérifiée non vide ; extension = type réel du blob produit ; format impossible annoncé AVANT l'usage). **28 tests Node passent** (`scripts/media-support-tests/01-media-support.mjs`, avec des faux qui reproduisent les comportements Safari mesurés). Compilation Turbopack + `tsc` OK.

**Ce qui n'est PAS prouvé** : aucun de ces correctifs n'a été rejoué sur un vrai Safari (seul le propriétaire en a un). Les tests prouvent la logique contre des faux fidèles aux mesures, pas le comportement WebKit réel. Le retest Safari du propriétaire reste nécessaire pour clore.

## 2. Balayage du dépôt (état AVANT correctif, fichier:ligne)

**`captureStream()`** — sur `<video>` (**inexistant sous Safari**) : `video-trimmer:39`, `video-converter:30`, `video-compressor:52`. Sur `<canvas>` (existe sous Safari) : `video-merger:31`, `video-filter:76`, `video-rotator:63`, `video-resizer:64`.

**`new MediaRecorder` sans `isTypeSupported`** — **9 occurrences, pas 5** : `video-trimmer:40`, `video-converter:31`, `video-compressor:54`, `video-merger:32`, `video-filter:82`, `video-rotator:69`, `video-resizer:70` (tous `video/webm` en dur, **lèvent une exception sous Safari 17**) ; `voice-recorder:19` et `screen-recorder:20` (sans type : Safari produit du MP4, étiqueté `audio/webm` / `video/webm` en dur → **mensonge silencieux**). Le balayage trouve donc **4 outils non testés** de plus (merger, filter, rotator, resizer) + screen-recorder.

**Type/extension en dur** : `*.webm` codé en dur dans les 9 ci-dessus (`download="…webm"`) ; `image-converter` : extension = format demandé (`page.tsx:192`).

**WebP/AVIF sans vérification** : `jpg-to-webp:18`, `png-to-webp:18` (`toDataURL('image/webp')` → PNG déguisé sous Safari), `image-converter` (`worker:84`, option AVIF aussi — **à vérifier sur Chrome : Chrome n'encode pas non plus l'AVIF depuis un canvas**, l'option renvoyait donc peut-être un PNG partout).

**`toDataURL` sans contrôle** : 41 sites (liste par `grep toDataURL app/tools`). Une taille excessive donne `data:,` sous Safari.

**Canvas sans garde de taille** : `image-upscaler` (×8), `image-resizer` (largeur/hauteur saisies), `svg-to-png` (idem), `pdf-to-image`/`pdf-to-jpg` (échelle ×2 par page), `background-remover` (recomposition pleine résolution).

**`accept` trop étroit** : `mp4-to-gif` (`video/mp4`), `mov-to-gif` (`video/quicktime,video/mov`), `avi-to-gif` (`video/avi,video/x-msvideo`), `webm-to-gif` (`video/webm`), `jpg-to-webp` (`.jpg,.jpeg`), `png-to-webp` (`.png`) ; les outils audio/vidéo en `audio/*` / `video/*` seul (le filtre du sélecteur dépend du registre MIME de l'OS).

## 3. Ce qui a été corrigé (chaque défaut, avec sa gravité)

| # | Défaut | Gravité | Correctif |
|---|---|---|---|
| S1 | video-compressor / converter / trimmer : `captureStream()` absent sous Safari | **Moyenne** (panne franche, mais le bouton restait bloqué après l'erreur) | Détection au chargement : message clair AVANT de choisir un fichier, bouton désactivé ; erreur séparée du statut (le bouton ne reste plus verrouillé) ; sortie vérifiée non vide, extension = type réel |
| S2 | **voice-recorder** : MP4 étiqueté `audio/webm`, sans erreur | **Haute (mensonge)** | Type et extension lus sur `recorder.mimeType` ; bouton « Download M4A/WEBM » ; textes SEO corrigés |
| S3 | **image-converter / jpg-to-webp / png-to-webp** : PNG livré sous nom `.webp`, 86 % plus lourd | **Haute (mensonge)** | Sonde d'encodage au chargement : options WebP/AVIF **désactivées** avec explication ; le worker refuse un blob d'un autre type que demandé ; extension = type réel |
| S4 | **image-upscaler ×8** : canvas 32000×24000, `data:,`, interface « réussie » | **Haute (mensonge)** | Garde de taille avant allocation + refus d'un `data:,` / d'un type inattendu, message honnête |
| S5 | mp4-to-gif refuse les `.mov` (iPhone) | **Moyenne** (refus franc, mais bloque tout iPhone) | `accept` élargi (`VIDEO_ACCEPT`), aussi sur les 4 autres outils GIF et 27 pages d’outils média |

Extensions de la classe hors des cinq : `video-merger/filter/rotator/resizer` (MP4 automatique sous Safari au lieu d'une exception, jamais prouvé sur Safari réel), `screen-recorder` (extension réelle), 22 outils image (`checkedDataURL`), `image-resizer`, `svg-to-png`, `pdf-to-image`, `pdf-to-jpg`, `background-remover`, `video-screenshot` (image vide refusée) ; FAQ/SEO de `screen-recorder` et `voice-recorder` corrigées (elles affirmaient « toujours WebM »).

**Non traité, à signaler** : les outils GIF gardent un `alert()` sur erreur et n'ont pas de garde « cadre vide » ; `audio-waveform`, `pdf-editor`, `pdf-sign`, QR/barcode (canvas de taille maîtrisée, non modifiés). `audio-to-text` / `audio-transcriber` n'ont **pas** été élargis (formats limités côté serveur Whisper).

## 4. CHIFFRAGE — brancher ffmpeg.wasm sur video-compressor / converter / trimmer (aucun code écrit)

**Ce que font les concurrents (vérifié sur leurs pages et sur des comparatifs 2026)** : CloudConvert et FreeConvert **téléversent** le fichier et transcodent sur serveur (ffmpeg natif) — ~10-30 s par minute de vidéo, upload compris, formats en dizaines, plafonds énormes. À l'inverse, une catégorie de convertisseurs « sans envoi » utilise **ffmpeg.wasm dans le navigateur**. Aucun grand concurrent gratuit n'utilise `captureStream + MediaRecorder` : notre moteur actuel est celui d'un enregistreur en temps réel, pas d'un convertisseur.

**Vitesse mesurée / rapportée** :
- Interne : `video-watermark` (déjà ffmpeg.wasm + libx264 `veryfast`, mono-thread) documente **~1 s de traitement par seconde de vidéo**, d'où son plafond de 120 s.
- Externe : ffmpeg.wasm mono-thread ≈ 40 fps en 720p contre > 500 fps en natif ; le multi-thread donne ~×2 mais exige `SharedArrayBuffer` (en-têtes COOP/COEP, qui casseraient l'intégration de tiers du site), ~2 Go de mémoire, et est décrit comme instable.
- Contre l'existant : `MediaRecorder` = **strictement 1× le temps réel** (une vidéo de 10 min = 10 min d'onglet actif), sans repli possible en arrière-plan. ffmpeg.wasm à ~1× sur le H.264 mais **bien plus vite que le temps réel** sur trim sans réencodage (`-c copy`, quelques secondes, déjà utilisé par `audio-trimmer`) et sur les conversions de conteneur.

| | video-trimmer | video-converter | video-compressor |
|---|---|---|---|
| Temps attendu (clip 1 min, 720p) | **2-5 s** (`-c copy`) ; ~1 min si réencodage exigé | ~30-90 s (x264 veryfast) | ~30-90 s |
| Poids du moteur à charger | **~30 Mo** (core ffmpeg, une fois, mis en cache navigateur) — même moteur que les 9 outils qui l'utilisent déjà | idem | idem |
| Faisabilité mobile | Bonne (pas de réencodage) | **Limitée** : mémoire iPhone (le plan a déjà signalé « mémoire iPhone » pour audio-converter), plafonner à ~2 min / ~200 Mo | idem |
| Formats d'entrée | Tout ce que ffmpeg décode (allowlist de codecs déjà prouvée dans `video-watermark` : h264, hevc, vp8, vp9, theora, prores ; **AV1 exclu**) | idem + sortie MP4/WebM/MOV/… **enfin au choix** | MP4 H.264 (compatible partout) |
| Coût en heures (dev + tests fichiers réels) | **4-6 h** | **8-12 h** (sélecteur de sortie + garde codec + annulation) | **6-8 h** (CRF/bitrate, comparaison avant/après) |
| **Total estimé** | | | **18-26 h**, +2-3 h de tests Safari réels par le propriétaire |

**Recommandation** : **le faire, dans cet ordre** trimmer → compressor → converter, **après** le lancement s'il faut trancher (ce chantier est déjà au bloquant 6, « architecture vidéo »). Raison : les trois outils sont **honnêtes maintenant** (message avant usage, bouton non bloqué), donc ce n'est plus un bloquant de mensonge ; c'est un chantier de couverture, et il est le plus gros écart marché de la famille vidéo. Alternative sur mobile : service serveur Railway (comme le détourage), plus rapide qu'ffmpeg.wasm mais recrée la question des plafonds et de la charge utile. **Aucune décision prise, à valider par le propriétaire.**

Sources : [ffmpeg.wasm 0.12 hung… real speedup](https://dev.to/hammad4june1999/ffmpegwasm-012-hung-on-the-first-frame-and-the-real-speedup-was-not-the-upgrade-p45) · [Speed? · ffmpeg.wasm #326](https://github.com/ffmpegwasm/ffmpeg.wasm/issues/326) · [FFmpeg.wasm guide](https://renderio.dev/blogs/ffmpeg-wasm-guide) · [CloudConvert alternative comparatif](https://ffmpeg-cookbook.com/en/articles/cloudconvert-alternative/) · [Meilleurs convertisseurs 2026](https://getcompress.com/blog/best-free-video-converters/). Ces pages sont des blogs/comparatifs : ordres de grandeur, pas mesures sur notre parc de fichiers.

## 5. Couverture des formats (item 4)

`accept` élargi à `VIDEO_ACCEPT` (wildcard + mp4, m4v, mov, qt, webm, mkv, avi, wmv, flv, ogv, 3gp, 3g2, mpg, mpeg, ts, mts, m2ts) sur 5 outils GIF + 13 outils vidéo, et à `AUDIO_ACCEPT` (mp3, wav, m4a, aac, flac, ogg, oga, opus, wma, aiff, aif, amr, mka, weba, caf) sur 9 outils audio. **Limite honnête** : lister une extension au sélecteur ne garantit pas le décodage ; les outils navigateur natifs échouent sur les codecs non lisibles (messages existants). Comparaison chiffrée aux concurrents (CloudConvert ~28 formats vidéo, FreeConvert 30+ en entrée) : l'écart de **décodage** ne se comble que par ffmpeg (chiffrage ci-dessus).

## 6. À faire par le propriétaire (bloquant 9, moitié iPhone)

Rejouer sur **Safari réel** : les 5 outils (voice-recorder → extension `.m4a`, image-converter/jpg-to-webp → options désactivées, image-upscaler ×8 → message, 3 outils vidéo → message avant fichier, mp4-to-gif → accepte un `.mov` iPhone) puis la feuille `tests-safari-proprietaire.md` sur iPhone.

## 7. Leçon

**Un échec silencieux qui affiche « réussi » est plus grave qu'une panne visible** : l'utilisateur repart avec un fichier faux et ne revient jamais.
