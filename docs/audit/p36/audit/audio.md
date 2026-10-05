# P36 lot 2 — audit « audio » (15 outils)

Source du texte : `docs/audit/p36/contenu-avant.json` (HTML servi). Code lu : chaque `page.jsx` + `layout.tsx`, `app/lib/audioFormats.js`, `app/lib/opusService.js`, `app/lib/mediaJob.js`, `app/lib/mediaSupport.js`, `app/lib/audioMerge.js`, `app/lib/decodeAudio.js`, `app/lib/audioDuration.js`, `app/lib/mediaProbe.js`, `app/lib/subtitleTime.js`, `app/lib/officeUpload.js`, `app/components/{MediaInfo,MetadataStripper,FileDownload,PlayablePreview,TranscriptExports,IosOriginalNote,UploadPrompt,FileDropBridge}.jsx`, `app/api/media/ticket/route.js`, `lib/media/ticket.js`, `app/api/ai-transcribe/route.ts`, `lib/quota/{guard,limits,hourDayRateLimit}.js`, `services/media-processing/app/{jobs,ffmpeg_ops}.py`.

Abréviations : `P` = `app/tools/<outil>/page.jsx`, `L` = `app/tools/<outil>/layout.tsx`. « Service » = notre service média (Railway) utilisé pour la sortie Opus, « Make an MP4 » et les fichiers > 4 Mio d'Audio to Text ; il n'est actif que si `NEXT_PUBLIC_MEDIA_SERVICE_URL` est défini au build (`app/lib/mediaJob.js:16-17`). Limites du service : taille `MEDIA_TICKET_MAX_BYTES`, nombre de travaux par réseau `MEDIA_JOBS_PER_HOUR_PER_IP` / `MEDIA_JOBS_PER_DAY_PER_IP` (`lib/media/ticket.js:48-50`, `app/api/media/ticket/route.js:27-42`) — valeurs non lues.

Constats transverses (valent pour tout le lot) :
- Aucune page ne demande d'inscription ; aucune route utilisée ne lit un compte (`app/api/media/ticket/route.js:13-50`, `lib/quota/guard.js:15-37`).
- Le moteur ffmpeg.wasm (@ffmpeg/core 0.12.9) est téléchargé depuis unpkg.com (`node_modules/@ffmpeg/ffmpeg/dist/esm/const.js:3-4`) : 32,2 Mo décompressé, ~10,2 Mo sur le réseau (`docs/audit/RAPPORT-formats-navigateurs.md:59`). Aucun fichier ne part avec lui.
- `.ac3` n'est PAS dans la liste d'extensions `AUDIO_ACCEPT` (`app/lib/mediaSupport.js:257-258`) : un .ac3 n'est sélectionnable que si le système lui donne un type `audio/*`.
- En cas d'échec, un rapport d'erreur (extension, tranche de taille, message nettoyé, jamais le fichier) part vers `/api/report-error` (`app/lib/reportError.js:7-12`).
- Le HTML servi (contenu-avant.json réextrait) d'Audio to Text affiche « 25 MB » : le service média est donc actif dans le build servi (`app/lib/officeUpload.js:85-86` choisit 25 Mio seulement si `NEXT_PUBLIC_MEDIA_SERVICE_URL` est défini). Les phrases « Opus encodé sur notre serveur » sont donc cohérentes avec la production. Toute valeur rendue par `audioMaxLabel()` dépend de cette variable : un rédacteur ne doit pas l'écrire en dur sans cette condition.

## audio-tools/audio-booster

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| audio-booster | méta | « using a gain multiplier (1x-5x) » | FAUX | curseur min 0.25, max 5, pas 0.25 (P:95) ; option « Normalize instead » (P:98) | « from 0.25x (quieter) to 5x, or normalized to -16 LUFS » |
| audio-booster | étape 2 | « using the slider (1x–5x) » | FAUX | `min={0.25} max={5}` (P:95) | « 0.25x to 5x » ; mentionner la case « Normalize instead » |
| audio-booster | étape 3 | « pick the same format as your source to avoid an unnecessary quality-losing re-encode » | FAUX | le filtre de volume impose toujours un réencodage (P:56, P:63) : MP3→MP3 perd quand même | « pick a lossless output (WAV, FLAC, AIFF, ALAC) to add no further loss » |
| audio-booster | about | « or normalizes its loudness to -16 LUFS …, followed by a limiter … (it can be turned off) » | TROMPEUR | limiteur seulement si gain > 1 ET normalisation décochée (P:56) ; la normalisation utilise loudnorm TP -1.5 dB, sans limiteur | séparer : limiteur pour un gain > 1 ; normalisation = loudnorm -16 LUFS, crête vraie -1.5 dB |
| audio-booster | FAQ 2 | « MP3, WAV, AAC, FLAC, OGG, M4A, Opus, WMA, AIFF, ALAC, or AC3 » | FORMAT | 18 sorties (P:103, `app/lib/audioFormats.js:22-48`) : M4R, M4B, MP2, WV, CAF, AU, MKA non dits | lister les 18 |
| audio-booster | FAQ 3 | « Yes, it's completely free with no signup required. » | TROMPEUR | sortie Opus via le service : limite par réseau heure + jour et taille max (`app/api/media/ticket/route.js:27-42`) ; phrase identique sur 92 pages (`unicite-avant.json`) | gratuit, sans inscription ; Opus : nombre de conversions par heure et par jour limité par connexion |
| audio-booster | FAQ 4 | « For every format except Opus, no … deleted as soon as you have downloaded the result. » | GÉNÉRIQUE | mot pour mot sur Booster, Compressor, Splitter (`unicite-avant.json`) | réécrire pour l'outil (ce qui part = l'audio déjà amplifié en FLAC, P:57-61) |
| audio-booster | étape 1 | « Click the upload area and select an audio file. » | GÉNÉRIQUE | même phrase sur 7 pages ; le dépôt marche aussi (`app/components/FileDropBridge.jsx:4-13`) | étape propre à l'outil |
| audio-booster | astuce 3 | « The first boost after loading the page can take longer since your browser needs to download the ffmpeg.wasm engine. » | GÉNÉRIQUE | même astuce sur 6 pages du lot | dire le poids réel (~10 Mo réseau, rapport cité) une fois, ou supprimer |
| audio-booster | (toute la page) | aucun format d'entrée cité | FORMAT | `accept` = AUDIO_ACCEPT (P:92, `mediaSupport.js:257-258`) | lister MP3, WAV, M4A, AAC, FLAC, OGG/OGA, Opus, WMA, AIFF/AIF, AMR, MKA, WEBA, CAF |

## audio-tools/audio-compressor

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| audio-compressor | about | « (MP3, AAC, M4A, OGG, Opus, WMA, AC3) » | FORMAT | 9 sorties : + M4B, MP2 (P:116, `audioFormats.js:53-55`) | lister les 9 |
| audio-compressor | FAQ 2 | « Your choice among MP3, AAC, M4A, OGG, Opus, WMA, and AC3 » | FORMAT | idem | idem |
| audio-compressor | FAQ 3 | « No hard limit is enforced by the tool — very large files are limited only by your browser's available memory. » | TROMPEUR | Opus : FLAC envoyé limité à MEDIA_TICKET_MAX_BYTES + limite heure/jour par réseau (`lib/media/ticket.js:60-61`, `route.js:35-42`) | ajouter l'exception Opus |
| audio-compressor | interface | « {originalSize} MB » / « {newSize} MB » / « your {originalSize} MB » | FAUX | `formatBytes()` rend déjà l'unité (`app/lib/formatBytes.js:9-12`) puis la page ajoute « MB » (P:126-127, P:134) → « 1.2 MB MB », « 500 KB MB » | retirer le « MB » ajouté (correction de code, hors texte SEO) |
| audio-compressor | (absent) | — | MINCE | débit plafonné au débit de la source (P:57-61, message P:130), cas « Larger by » (P:128-136), options Mono / Sample rate (P:106-111) absents du texte et des étapes | dire : jamais au-dessus du débit d'origine ; Mono et fréquence ; ce qui s'affiche si le fichier grossit |
| audio-compressor | FAQ 4 | « For every format except Opus, no … » | GÉNÉRIQUE | identique sur 3 pages | réécrire (Opus : débit choisi envoyé au service, P:63-65) |
| audio-compressor | étape 1 | « Click the upload area and select an audio file. » | GÉNÉRIQUE | 7 pages | idem |
| audio-compressor | astuce 2 | « Lower bitrates noticeably reduce quality for complex music — compare the audio preview before committing. » | GÉNÉRIQUE | conseil copiable | remplacer par un fait de l'outil |
| audio-compressor | astuce 3 | « The first compression after loading the page takes longer… » | GÉNÉRIQUE | 6 pages | idem Booster |
| audio-compressor | (toute la page) | aucun format d'entrée cité | FORMAT | AUDIO_ACCEPT (P:97) | lister |

## audio-tools/audio-converter

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| audio-converter | méta | « between MP3, WAV, AAC, FLAC, OGG, M4A, Opus, WMA, AIFF, ALAC, and AC3 » | FORMAT | 18 cibles (P:125, `audioFormats.js:22-48`) : M4R, M4B, MP2, WV, CAF, AU, MKA absents | « 18 formats, dont … » |
| audio-converter | about | même liste de 11 | FORMAT | idem | idem |
| audio-converter | FAQ 2 | « MP3, WAV, AAC, FLAC, OGG, M4A, Opus, WMA, AIFF, ALAC, and AC3 as output targets » | FORMAT | idem | idem |
| audio-converter | FAQ 2 | « any format ffmpeg can decode as input (which covers the vast majority of real-world audio files, including AMR) » | INVÉRIFIABLE | le sélecteur ne propose que AUDIO_ACCEPT (P:121) ; « vast majority » sans mesure | lister les extensions acceptées |
| audio-converter | FAQ 1 | « which allows a set number of conversions per connection each day » | TROMPEUR | limite par heure ET par jour (`route.js:35-42`) + taille max MEDIA_TICKET_MAX_BYTES ; c'est le fichier ORIGINAL entier qui part (P:53-58) | « par heure et par jour » + taille max |
| audio-converter | astuce 1 | « the ffmpeg.wasm engine (roughly 25–30MB) » | FAUX | 32,2 Mo décompressé, ~10,2 Mo transférés (`docs/audit/RAPPORT-formats-navigateurs.md:59`) | « about 10 MB to download » |
| audio-converter | astuce 3 | « For MP3, AAC, M4A, OGG and WMA, pick the quality » | TROMPEUR | Quality aussi pour M4R, M4B, AC3, MP2 (`audioFormats.js:66`) ; AC3/MP2 jamais sous 192 kbps (`audioFormats.js:86`) | liste complète + plancher 192 pour AC3/MP2 |
| audio-converter | astuce 3 | « 192 kbps (the default) is transparent for most listening » | INVÉRIFIABLE | aucun rapport de mesure dans `docs/audit/` | supprimer ou citer une mesure |
| audio-converter | interface | option « Standard — 128 kbps » pour AC3 / MP2 | TROMPEUR | encodé à 192 kbps (`audioFormats.js:86`) sans le dire | dire le plancher à l'écran (code) |
| audio-converter | étapes | 4 étapes sans Quality, Sample rate, Channels, Cancel | MINCE | contrôles P:132-152 | ajouter ces réglages |
| audio-converter | étape 1 | « Click the upload area and select an audio file. » | GÉNÉRIQUE | 7 pages | idem |
| audio-converter | astuce 5 | « Opus is a strong choice for small file size at good quality if your target player supports it. » | GÉNÉRIQUE | conseil copiable | fait propre (Opus encodé par libopus à 128 kbit/s, `ffmpeg_ops.py:20,217`) |

## audio-tools/audio-equalizer

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| audio-equalizer | astuce 1 | « extreme boosts near ±12dB can introduce distortion audible in the exported file too » | FAUX | à l'export, si la crête dépasse la pleine échelle, tout le fichier est baissé et la page le dit (P:137-152) ; seule l'écoute en direct peut saturer (P:65) | « the export is lowered automatically to avoid clipping; the live preview is not » |
| audio-equalizer | FAQ 4 | « and also WMA, AC3 or AMR » | FORMAT | `.ac3` absent de AUDIO_ACCEPT (`mediaSupport.js:257-258`) | ajouter .ac3 à la liste (code) ou ne pas citer AC3 |
| audio-equalizer | interface | nom accessible des 3 curseurs « : dB » | LIBELLÉ | `aria-label=": dB"` (P:175) | « Bass », « Mid », « Treble » (code) |
| audio-equalizer | about | (texte sans fréquences ni format de sortie détaillé) | MINCE | plateau grave 200 Hz, cloche 1 kHz, plateau aigu 3 kHz (P:55-63), ±12 dB (P:175), WAV 16 bits à la fréquence du contexte audio (P:78-112, P:120), baisse auto anti-saturation (P:140-152) | donner ces faits |
| audio-equalizer | astuce 2 | « Boost the bass shelf for warmth, cut the mid range to reduce muddiness, and boost treble for clarity and presence. » | GÉNÉRIQUE | conseil copiable | remplacer |
| audio-equalizer | étape 1 | « Click the upload area and select an audio file. » | GÉNÉRIQUE | 7 pages | idem |

## audio-tools/audio-merger

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| audio-merger | about | « the length of the result is exactly the sum of your files » | TROMPEUR | vrai en sans perte ; formats compressés : fin allongée d'un bloc (M4A/M4R/AC3 +4,7 à +16 ms, AAC brut +28 à +39 ms, `docs/audit/RAPPORT-audio-merger-format-sortie.md:68`) ; WMA complété de silence (`app/lib/audioMerge.js:84-86`) | « exact in lossless formats; compressed formats may end a few ms longer » |
| audio-merger | FAQ 7 | « No limit is set by the tool; your browser's available memory is the limit » | TROMPEUR | Opus : FLAC joint limité à MEDIA_TICKET_MAX_BYTES + limite heure/jour (P:218-220, `route.js:35-42`) | ajouter l'exception Opus |
| audio-merger | FAQ 1 | « If all your files share a compressed format (all MP3, all Opus…), that format is kept. » | TROMPEUR | tous en AAC brut → M4A (`audioMerge.js:105`) | « (raw .aac becomes M4A, same codec) » |
| audio-merger | astuce 2 | « Opus is smaller at the same quality » | INVÉRIFIABLE | aucune mesure MP3 contre Opus dans `docs/audit/` (seule mesure Opus : libopus contre encodeur natif, `app/lib/opusService.js:127-129`) | supprimer ou mesurer |
| audio-merger | astuce 4 | « The first merge after loading the page takes longer… » | GÉNÉRIQUE | 6 pages | idem |
| audio-merger | (toute la page) | aucun format d'entrée cité | FORMAT | AUDIO_ACCEPT, plusieurs fichiers (P:293) | lister |

## audio-tools/audio-metadata

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| audio-metadata | titre | « Audio Metadata — Instantly Reads and Displays an Audio » | INVÉRIFIABLE | « Instantly » sans mesure ; titre tronqué (L:5) ; le moteur ~10 Mo se charge d'abord (`MediaInfo.jsx:26`) | « Audio Metadata — Codec, Bitrate, Tags & Cover Art Viewer » (sans « instantly ») |
| audio-metadata | méta | « nothing uploaded, any file size » | TROMPEUR | rapport : pas de limite (WORKERFS, `mediaProbe.js:14-15`) ; « Remove the metadata » : 2 Gio max (`MetadataStripper.jsx:79,96`) | « any size for the report; up to 2 GB to remove metadata » |
| audio-metadata | about | « so its size does not matter » | TROMPEUR | idem | idem |
| audio-metadata | FAQ 4 | « Is there a size limit? No » | TROMPEUR | idem | idem |
| audio-metadata | astuce 4 | « An empty “Tags” section means the file carries no embedded tags. » | FAUX | la section Tags n'est affichée que s'il y a des tags (`MediaInfo.jsx:45`) | « No “Tags” section means … » |
| audio-metadata | étape 1 | « (MP3, WAV, FLAC, M4A, OGG, Opus, WMA, AIFF, AC3 and more) » | FORMAT | .ac3 absent de AUDIO_ACCEPT (P:38, `mediaSupport.js:257-258`) ; AMR, MKA, CAF, WEBA acceptés et non dits | liste exacte |
| audio-metadata | FAQ 3 | « Everything ffmpeg can read » | TROMPEUR | le sélecteur se limite à AUDIO_ACCEPT (P:38) | liste des extensions |

## audio-tools/audio-splitter

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| audio-splitter | FAQ 2 | « MP3, WAV, AAC, FLAC, OGG, M4A, Opus, WMA, AIFF, ALAC, or AC3 » | FORMAT | 18 sorties (P:207) | lister les 18 |
| audio-splitter | FAQ 2 | « Your source's own format by default when it can be written here » | TROMPEUR | choix par EXTENSION (P:69-70) : .aif/.oga/.weba/.amr → MP3 ; un ALAC .m4a → M4A (AAC, avec perte) | dire la règle réelle |
| audio-splitter | astuce 2 | « Pick the same format as your source if you want to avoid a lossy re-encode. » | FAUX | chaque partie passe par `atrim` puis l'encodeur (P:132, P:142) : toujours réencodée | « pick a lossless format (WAV, FLAC…) to add no loss » |
| audio-splitter | FAQ 3 | « No hard limit is enforced by the tool » | TROMPEUR | Opus : un travail du service PAR PARTIE (P:136-139), chacun compté dans la limite heure/jour par réseau ; taille par partie ≤ MEDIA_TICKET_MAX_BYTES | ajouter l'exception Opus |
| audio-splitter | FAQ 4 | « For every format except Opus, no … » | GÉNÉRIQUE | identique sur 3 pages | réécrire (chaque partie envoyée séparément) |
| audio-splitter | étape 1 | « Click the upload area and select an audio file. » | GÉNÉRIQUE | 7 pages | idem |
| audio-splitter | astuce 4 | « The first split after loading the page takes longer… » | GÉNÉRIQUE | 6 pages | idem |
| audio-splitter | (toute la page) | aucun format d'entrée cité | FORMAT | AUDIO_ACCEPT (P:172) | lister |

## audio-tools/audio-to-text

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| audio-to-text | titre | « Audio to Text — Offer Two Ways Online Free » | MINCE | titre cassé, ne dit pas la tâche (L:5) | « Audio to Text — Transcribe a Recording or Live Dictation » |
| audio-to-text | FAQ 1 | « sent through our server to OpenAI's transcription API to generate the text, then deleted » | INVÉRIFIABLE | rien dans le code ne supprime chez OpenAI (`route.ts:50-56`) ; chez nous : pas stocké (direct) ou supprimé du service après lecture (`lib/media/staged.js:109-113`) | « we keep no copy; OpenAI's own retention rules apply » |
| audio-to-text | about | « Google in Chrome, Microsoft in Edge, Apple in Safari » | INVÉRIFIABLE | comportement des navigateurs, absent du code (P:32-50) | « your browser's own speech service (not us) » |
| audio-to-text | FAQ 1 | même liste Google / Microsoft / Apple | INVÉRIFIABLE | idem | idem |
| audio-to-text | FAQ 3 | « Common formats like MP3, WAV, and M4A. » | MINCE | `accept="audio/*"` sans liste (P:163) ; OpenAI décide | dire « any audio file; OpenAI rejects formats it cannot read » + l'erreur affichée |
| audio-to-text | étape 4 | « Copy the transcript or download it as a .txt file. » | FORMAT | mode fichier : .txt, .srt et .vtt + ZIP (`TranscriptExports.jsx:13-15`) | citer SRT et VTT |
| audio-to-text | FAQ 5 | « it has an hourly and daily limit per connection » | TROMPEUR | plafond de dépense mensuel du site aussi (message « reached its usage limit for the month », `lib/quota/guard.js:28-36`) | ajouter le plafond mensuel |
| audio-to-text | FAQ 2 | « other browsers may not support it » | MINCE | sans SpeechRecognition (Firefox) : « Speech recognition not supported. Try Chrome. » (P:33-35) ; langue non réglée (P:38-40) | dire lesquels et le message |
| audio-to-text | astuce 1 | « speak clearly at a steady pace and keep background noise low » | GÉNÉRIQUE | conseil copiable | remplacer |
| audio-to-text | astuce 3 | « Always proofread AI-generated transcripts… » | GÉNÉRIQUE | conseil copiable | remplacer |

## audio-tools/audio-trimmer

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| audio-trimmer | titre | « Cut a Section Out » | TROMPEUR | l'outil GARDE la partie entre début et fin (P:133-136) ; il ne peut pas retirer un passage du milieu | « Keep the Part You Want » / « Trim Start and End » |
| audio-trimmer | about | « cuts a section out of an audio file » | TROMPEUR | idem | idem |
| audio-trimmer | méta | « using ffmpeg.wasm's fast stream-copy trimming » | TROMPEUR | copie de flux seulement sans fondu et hors WAV/AIFF PCM et FLAC 16 bits ; sinon `atrim` + réencodage (P:117-136) ; « fast » sans mesure | « copied without re-encoding when there is no fade » |
| audio-trimmer | FAQ 4 | « it stays in the same format (MP3, WAV, FLAC, OGG, M4A, AAC, AIFF) at a high setting » | TROMPEUR | un .m4a ALAC avec fondu devient AAC 192k (P:21, P:131) | préciser M4A = AAC |
| audio-trimmer | astuce 3 | « Without fades nothing is re-encoded » | TROMPEUR | FLAC 16 bits réencodé (sans perte) et PCM réécrit, au filtre (P:118-128, P:134-135) | « without fades the quality is the source's » |
| audio-trimmer | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | 92 pages | fait propre (tout dans le navigateur, aucune limite) |
| audio-trimmer | FAQ 2 | « Any format ffmpeg.wasm can decode for input. » | MINCE | sélecteur = AUDIO_ACCEPT (P:162) | lister les extensions |
| audio-trimmer | astuce 4 | « The first trim after loading the page takes longer… » | GÉNÉRIQUE | 6 pages | idem |

## audio-tools/audio-waveform

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| audio-waveform | astuce 2 | « The PNG export captures exactly what's on screen » | TROMPEUR | même portion, mais redessinée à la taille choisie (défaut 1920×300) et pas l'aperçu 800×200 (P:21, P:147, P:168-169) | « the PNG shows the part on screen, drawn at the size you chose » |
| audio-waveform | FAQ 4 | « (WMA, AC3, AMR…) » | FORMAT | .ac3 absent de AUDIO_ACCEPT (P:164) | idem Equalizer |
| audio-waveform | étape 1 | « Click the upload area and select an audio file. » | GÉNÉRIQUE | 7 pages | idem |
| audio-waveform | astuce 4 | « Very large audio files may take a moment to decode before the waveform appears. » | GÉNÉRIQUE | conseil copiable | remplacer (zoom jusqu'à 200x, P:12) |

## audio-tools/voice-recorder

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| voice-recorder | about | « WebM in Chrome, Edge and Firefox, MP4 in Safari » | FAUX | `audio/mp4` essayé en premier (P:56) : Chrome/Edge qui l'acceptent enregistrent de l'AAC ; extension `.m4a`, pas `.mp4` (`mediaSupport.js:34,219-225`) ; WebM seulement là où MP4 n'est pas possible (Firefox) | « M4A (AAC) where the browser can record it (Safari, recent Chrome and Edge), WebM otherwise (Firefox) » |
| voice-recorder | étape 4 | « (WebM, or MP4 in Safari) » | FAUX | idem | idem |
| voice-recorder | FAQ 1 | « WebM in Chrome, Edge and Firefox, MP4 in Safari » | FAUX | idem | idem |
| voice-recorder | FAQ 5 | « Recording and the WAV and MP3 exports all happen entirely on your device via the browser's MediaRecorder and Web Audio APIs » | TROMPEUR | le MP3 est fait par ffmpeg.wasm (moteur téléchargé, P:31-36) | « MP3 by ffmpeg.wasm, in your browser » |
| voice-recorder | étapes | 4 étapes sans Pause / Resume ni « Export as MP3 » | MINCE | P:165-168, P:180-184 | ajouter |
| voice-recorder | FAQ 3 | « Yes, it's completely free with no signup and no limit on how many recordings you can make. » | GÉNÉRIQUE | formule de gratuité copiable | fait propre (pas de durée maximale dans le code, P:58-59) |
| voice-recorder | FAQ 4 | « Do I need to install anything? No, it works directly in your browser… » | GÉNÉRIQUE | exemple cité par les consignes | supprimer |
| voice-recorder | astuce 1 | « keep the microphone 6–12 inches from your mouth » | GÉNÉRIQUE | conseil copiable | remplacer |
| voice-recorder | astuce 4 | « you'll need to reset the site's microphone permission in your browser settings » | GÉNÉRIQUE | déjà dit par le message d'erreur (P:78) | remplacer |

## video-tools/media-player

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| media-player | about | « plays a single audio or video file directly in your browser using native HTML5 playback » | MINCE | ne dit rien de Speed 0.5×–2×, Loop, Picture in picture, Save this frame, Subtitles (.srt, .vtt) (P:88-96) ni des formats acceptés (P:66) | décrire ces fonctions |
| media-player | étape 2 | « The file loads instantly » | INVÉRIFIABLE | aucune mesure | « The file opens in your browser's player » |
| media-player | étape 3 | « Use the built-in play, pause, volume, and seek controls » | GÉNÉRIQUE | commandes natives, copiable | étapes Speed / Loop / sous-titres / image |
| media-player | FAQ 2 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | 92 pages | supprimer ou fait propre |
| media-player | astuce 1 | « Right-click the video player for extra native browser options like Picture-in-Picture » | GÉNÉRIQUE | la page a son propre bouton « Picture in picture » (P:93) | renvoyer au bouton |
| media-player | astuce 2 | « Use the spacebar to play/pause and arrow keys to seek » | GÉNÉRIQUE | conseil navigateur | remplacer |
| media-player | astuce 3 | « click the player's fullscreen icon » | GÉNÉRIQUE | conseil navigateur | remplacer |

## video-tools/screen-recorder

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| screen-recorder | about | « Recordings are saved as MP4 (H.264 + AAC) in Chrome, Edge and Safari » | TROMPEUR | MP4 seulement si `MediaRecorder.isTypeSupported` l'accepte (commentaire : Chrome et Edge 126+) ; sinon WebM + bouton « Make an MP4 » (P:10-18, P:166) | « Chrome and Edge 126 or later, Safari » |
| screen-recorder | FAQ 1 | « MP4 (H.264 video, AAC sound) in Chrome, Edge and Safari » | TROMPEUR | idem | idem |
| screen-recorder | FAQ 2 | « Yes, it's completely free with no signup required. » | TROMPEUR | « Make an MP4 » : limite par réseau heure/jour + taille max (`route.js:27-42`) ; phrase sur 92 pages | gratuit ; conversion MP4 limitée par connexion |
| screen-recorder | étapes | sans Pause / Resume ni « Add my microphone » | MINCE | P:147-158 | ajouter |
| screen-recorder | interface | « Make an MP4 (plays on iPhone and everywhere) » | INVÉRIFIABLE | « everywhere » sans preuve (P:166) | « plays on iPhone, Mac and Windows » ou sans « everywhere » (code) |
| screen-recorder | astuce 2 | « Close unnecessary tabs and apps before recording for smoother performance. » | GÉNÉRIQUE | conseil copiable | remplacer |
| screen-recorder | astuce 3 | « convert the downloaded file afterward with a dedicated video converter » | GÉNÉRIQUE | la page offre déjà « Make an MP4 » (P:166) | lien vers Video Converter du site ou supprimer |

## video-tools/subtitle-generator

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| subtitle-generator | astuce 4 | « use a dedicated transcription tool first, then paste the timed results in here to fine-tune » | FAUX | aucun collage ni import : saisie ligne par ligne (P:39-54) ; Audio to Text / Audio Transcriber donnent déjà SRT et VTT (`TranscriptExports.jsx:13-15`) | « Audio to Text gives SRT/VTT directly » |
| subtitle-generator | FAQ 3 | « HH:MM:SS, MM:SS or seconds » | TROMPEUR | secondes seules ≤ 59 (`app/lib/subtitleTime.js:9,14`) : « 75 » refusé | « seconds up to 59 » |
| subtitle-generator | étape 1 | « Click "Add Subtitle" to create a new subtitle row. » | TROMPEUR | une ligne existe déjà à l'ouverture (P:10) | « Fill in the first row, then Add Subtitle for more » |
| subtitle-generator | (absent) | — | MINCE | champ texte sur une seule ligne (P:49) : pas de sous-titre sur deux lignes ; tri par heure (`subtitleTime.js:38`) | le dire |
| subtitle-generator | FAQ 4 | « you can enter subtitles in any language your keyboard supports » | GÉNÉRIQUE | copiable | remplacer (fichiers UTF-8) |
| subtitle-generator | FAQ 5 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | 92 pages | supprimer |

## video-tools/video-metadata

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| video-metadata | titre | « Read a Video File's Basic Properties » | TROMPEUR | rapport ffprobe complet par flux (`mediaProbe.js:40-68`) + suppression des métadonnées | « Codecs, Frame Rate, GPS & Tags Viewer » |
| video-metadata | about | « so its size does not matter » | TROMPEUR | « Remove the metadata » : 2 Gio max (`MetadataStripper.jsx:79,96`) | préciser |
| video-metadata | FAQ 4 | « Is there a size limit? No » | TROMPEUR | idem | idem |
| video-metadata | FAQ 2 | « Everything ffmpeg can read » | TROMPEUR | sélecteur = VIDEO_ACCEPT (P:38, `mediaSupport.js:237-238`) | lister |
| video-metadata | FAQ 5 | (rien sur l'iPhone) | MINCE | une vidéo prise dans Photos arrive déjà réencodée par iOS ; la page le dit seulement sur iPhone (`IosOriginalNote.jsx:4-7,20`) | dire : passer par Fichiers pour lire l'original |

## Synthèse du lot « audio »

15 outils lus. Défauts : **FAUX 12** · **INVÉRIFIABLE 9** · **TROMPEUR 32** · **GÉNÉRIQUE 34** · **MINCE 12** · **LIBELLÉ 1** · **FORMAT 15** — total 115 lignes.
