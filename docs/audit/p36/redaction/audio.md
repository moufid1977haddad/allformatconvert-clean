# P36 — rédaction du lot « audio » (15 outils)

Fichiers modifiés : `page.jsx` (props de `<SeoContent>` uniquement) et `layout.tsx` (title.absolute, description, openGraph.title/description) des 15 outils ; `docs/audit/p36/preuves/audio.json` ; ce compte rendu. Aucune chaîne d'interface, aucune logique, aucun composant partagé n'a été modifié ; les fins de ligne CRLF et le BOM des fichiers sont conservés. Générateur utilisé (hors dépôt, dossier scratchpad) : `gen.mjs`, qui remplace le bloc `<SeoContent … />` et les 4 champs de métadonnées.

Branche décrite partout : service média configuré (`NEXT_PUBLIC_MEDIA_SERVICE_URL` défini sur www) — Opus encodé par libopus sur le service, « Make an MP4 », transcriptions > 4 Mio déposées sur le service, plafond Audio to Text calculé `${audioMaxLabel()}` (25 MB sur www). Les limites du service par connexion (heure et jour) sont dites sans chiffre (variables d'environnement). Chiffres : calculés `${…}` quand la page a déjà la constante (`MAX_PARTS`, `MIN_PART`, `FADE_MIN`, `FADE_MAX`, `MIN_ZOOM`, `MAX_ZOOM`, `audioMaxLabel()`) ; sinon prouvés dans `preuves/audio.json` (C3).

Mots visibles (About + étapes + specs + vie privée + FAQ + astuces ; « avant » = contenu-avant.json, sans specs ni vie privée qui n'existaient pas) :

| Outil | Titre (car.) | Méta (car.) | Mots avant → après |
|---|---|---|---|
| audio-booster | Audio Booster — Make Audio Louder or Normalize to -16 LUFS (58) | 143 | 399 → 676 |
| audio-compressor | Audio Compressor — Shrink Audio Files by Bitrate (48) | 153 | 376 → 571 |
| audio-converter | Audio Converter — MP3, WAV, M4A, FLAC, OGG & More (49) | 140 | 457 → 615 |
| audio-equalizer | Audio Equalizer — Bass, Mid & Treble, Export as WAV (51) | 143 | 337 → 502 |
| audio-merger | Audio Merger — Join Audio Files, Reorder & Crossfade (52) | 142 | 937 → 687 |
| audio-metadata | Audio Metadata Viewer — Codec, Bitrate, Tags, Cover Art (55) | 149 | 361 → 516 |
| audio-splitter | Audio Splitter — Equal Parts, Every N Seconds or One Point (58) | 143 | 445 → 572 |
| audio-to-text | Audio to Text — Transcribe a File or Live Dictation (51) | 146 | 382 → 542 |
| audio-trimmer | Audio Trimmer — Keep Start to End, Add Fade In & Out (52) | 147 | 356 → 532 |
| audio-waveform | Audio Waveform Image — Zoom, Pan, Save as PNG (45) | 148 | 339 → 451 |
| voice-recorder | Voice Recorder — Record, Pause, Save as M4A, MP3 or WAV (55) | 146 | 346 → 416 |
| media-player | Media Player — Speed, Loop, Subtitles and Frame Capture (55) | 148 | 266 → 447 |
| screen-recorder | Screen Recorder — Record Screen, Tab and Mic to MP4 (51) | 151 | 389 → 527 |
| subtitle-generator | Subtitle Generator — Type Lines, Get SRT and VTT Files (54) | 142 | 347 → 526 (+ exemple) |
| video-metadata | Video Metadata Viewer — Codecs, Frame Rate, GPS Removal (55) | 145 | 458 → 534 |

## Ce qui a été retiré ou corrigé (renvoi : `docs/audit/p36/audit/audio.md`)

- **audio-booster** : « 1x-5x » (méta, étape 2) → 0.25x à 5x ; « même format = pas de perte » (étape 3) → faux, remplacé par la FAQ « Will I lose quality… » (réencodage toujours) ; limiteur « après la normalisation » → limiteur seulement au-dessus de 1x, loudnorm sinon ; liste de 11 formats → 18 ; « free, no signup » et phrase Opus copiée sur 3 pages supprimées ; limite Opus par connexion dite.
- **audio-compressor** : formats 7 → 9 (M4B, MP2) ; « No hard limit… » → exception Opus (taille + heure/jour) ; plafonnement au débit de la source, Mono, Sample rate, « Larger by » maintenant décrits ; phrases génériques supprimées. Le bug d'interface « MB MB » n'est PAS corrigé (consigne : au plan).
- **audio-converter** : 11 → 18 formats ; « par jour » → par heure et par jour ; poids du moteur « 25–30MB » supprimé ; « 192 kbps transparent » supprimé ; liste Quality complète + plancher 192 kbps AC3/MP2 ; étapes avec Quality / Sample rate / Channels.
- **audio-equalizer** : astuce « distorsion audible dans l'export » (FAUX) → FAQ exacte (export baissé automatiquement, aperçu non protégé) ; fréquences 200 Hz / 1 kHz / 3 kHz, WAV 16 bits ; AC3 cité seulement comme format décodé par ffmpeg.wasm (vie privée), pas comme extension du sélecteur.
- **audio-merger** : « longueur exactement la somme » → exception des formats compressés (quelques ms) ; « No limit… » supprimé ; AAC brut → M4A dit ; « Opus is smaller at the same quality » supprimé ; mesures citées avec leur date (26/09/2026, rapports `RAPPORT-audio-merger-format-sortie.md`, `RAPPORT-audio-merger-ordre-fondu.md`).
- **audio-metadata** : titre cassé « Instantly… an Audio » remplacé ; « any file size » / « size does not matter » → 2 GB pour la copie nettoyée ; astuce « empty Tags section » (FAUX) → FAQ exacte ; « Everything ffmpeg can read » → liste du sélecteur.
- **audio-splitter** : 11 → 18 formats ; règle réelle du format par défaut (.aif/.amr → MP3, ALAC .m4a → AAC) ; astuce « même format = pas de réencodage » (FAUX) supprimée ; Opus = un travail par partie (limite heure/jour).
- **audio-to-text** : titre cassé « Offer Two Ways » remplacé ; « then deleted » chez OpenAI (invérifiable) → « We keep no copy; OpenAI's own data rules apply » ; Google/Microsoft/Apple → seul l'exemple Chrome → Google, appuyé par `scripts/content-checks/privacy-claims.mjs:25-27` ; SRT/VTT ajoutés ; budget mensuel du site ajouté ; astuces génériques supprimées.
- **audio-trimmer** : « Cut a Section Out » (TROMPEUR) → « Keep Start to End » + FAQ « remove a part from the middle? No » ; « fast stream-copy » supprimé ; ALAC avec fondu non promis ; mesure 0.3–39.5 ms datée (27/09/2026, `RAPPORT-nuit-27-09.md:84`).
- **audio-waveform** : « exactly what's on screen » → « redrawn at the size you chose » ; AC3 retiré des formats d'entrée annoncés.
- **voice-recorder** : « WebM in Chrome, Edge and Firefox, MP4 in Safari » (FAUX ×3) → M4A (AAC) où le navigateur sait enregistrer du MP4 audio (Safari, Chrome/Edge 126+ selon le commentaire du code), WebM ailleurs (Firefox) ; MP3 = ffmpeg.wasm ; FAQ génériques supprimées.
- **media-player** : About étoffé (vitesse, boucle, PiP, image, sous-titres) ; « loads instantly » et astuces navigateur supprimés.
- **screen-recorder** : MP4 « Chrome, Edge » → Chrome/Edge 126+ et Safari ; « free, no signup » → limite de « Make an MP4 » ; étapes avec Pause/Resume/micro.
- **subtitle-generator** : astuce « paste the timed results » (FAUX) → renvoi à Audio to Text qui exporte SRT/VTT ; « or seconds » → secondes jusqu'à 59 ; une ligne par sous-titre dite ; exemple ajouté.
- **video-metadata** : « Basic Properties » remplacé ; 2 GB de la copie nettoyée dit ; iPhone (Photos réencode) dit.

## Exemple exécuté

Subtitle Generator — sortie produite par le code de la page :
`node --input-type=module -e 'import { buildSubtitles } from "file:///C:/Users/moufi/Desktop/onlineconvertools/app/lib/subtitleTime.js"; console.log(JSON.stringify(buildSubtitles([{start:"0:04,5",end:"0:07",text:"And we are back."},{start:"1.2",end:"3",text:"Hello and welcome."}])))'`
→ SRT recopié tel quel dans `example.output`. Aucun exemple pour les outils de fichiers audio/vidéo (pas de mesure datée autre que celles citées en FAQ).

## Chaînes d'interface modifiées

Aucune (les défauts d'interface trouvés à l'audit — « MB MB » d'Audio Compressor, `aria-label=": dB"` d'Audio Equalizer, option « Standard — 128 kbps » encodée à 192 pour AC3/MP2, « everywhere » du bouton « Make an MP4 » — vont au plan, sur consigne).

## Points laissés de côté ou douteux

- Absence de reconnaissance vocale dans Firefox : fait du navigateur (MDN), pas lu dans le code ; la page affiche bien le message « Speech recognition not supported. Try Chrome. » quand l'API manque.
- `.ac3` absent de `AUDIO_ACCEPT` (`app/lib/mediaSupport.js:257-258`, composant partagé, non modifié) : AC3 n'est plus annoncé comme format d'entrée.
- Les valeurs des limites du service média (taille, travaux par heure/jour) ne sont pas écrites (variables d'environnement).
- Total visible : Audio Booster 676 et Audio Converter 615 mots, dans la fourchette 350-700 ; Audio Merger réduit de 937 à 687.

## Corrections après relecture (06/10)

Source : `docs/audit/p36/relecture/audio.md` (58 défauts) et les « Précisions pour les corrections après relecture » de `CONSIGNES-REDACTION.md`. Chaque point a été revérifié dans le code. Toutes les corrections sont appliquées. Seuls les fichiers autorisés ont changé (props `<SeoContent>`, `layout.tsx` d'Audio Compressor, `preuves/audio.json`). Aucune chaîne d'interface n'a été modifiée.

**Exactitude**
- **Limites du service média.** Le service refuse un fichier au-dessus de `MAX_FILE_BYTES` (`services/media-processing/app/jobs.py:115-116`). Il refuse aussi un média plus long que `MAX_DURATION_SECONDS` (`jobs.py:195-197`). Booster, Compressor et Splitter disent maintenant que ces deux plafonds portent sur le FLAC envoyé (`opusService.js:141`). Pour Merger, c'est le FLAC joint ; pour Converter, le fichier original ; pour Screen Recorder, le WebM. Aucune valeur n'est écrite.
- **Audio to Text.**
  - Le quota par connexion est partagé avec les autres outils payants (`lib/quota/ipRateLimit.js:4-8`).
  - Le budget mensuel couvre les services payants du site (`guard.js:28-36`).
  - Au-dessus de 4 Mio, le seau d'envoi `office_rate` s'ajoute (`app/api/media/ticket/route.js:24-36`).
  - Le fichier part sans conversion (`route.ts:41-42`) : un type que Whisper ne lit pas revient en erreur.
  - Les rapports d'erreur sont maintenant dits.
  - La spec de taille et la FAQ sous-titres ont été reformulées pour ne plus ressembler au jumeau Audio Transcriber.
- **WAV et AIFF en 16 bits** (Booster, Splitter). Aucun `-c:a` n'est fixé (`audioFormats.js:24,34`), donc ffmpeg prend son encodeur par défaut, `pcm_s16le` / `pcm_s16be`. Pour l'AIFF, voir le commentaire `audioFormats.js:11`. Pour le WAV, c'est le comportement par défaut de ffmpeg. FLAC et ALAC restent proposés comme « no further loss ».
- **Opus dans Booster.** J'ai écrit « a rate the Opus encoder supports, which can differ from the source » et non « always 48 kHz » comme le proposait le relecteur. Raison : libopus accepte aussi 24, 16, 12 et 8 kHz (`audioFormats.js:79`), donc une source à 16 kHz n'est pas forcément passée à 48 kHz.
- **Fondus de Trimmer.** La liste fixe `REENCODE` (`audio-trimmer/page.jsx:19-22,131`) est décrite : MP3, OGG (Vorbis), M4A et AAC à réglage élevé ; WAV, AIFF et FLAC sans perte ; tout le reste en WAV. Un ALAC passe en AAC, et un Opus dans un .ogg passe en Vorbis.
- **Merger.** Le décodage et la jonction se font toujours dans la page (`audio-merger/page.jsx:192-220`) ; seul l'encodage Opus part au service. La mesure des courbes de fondu est maintenant attribuée à deux bruits roses indépendants (`RAPPORT-audio-merger-ordre-fondu.md:46,91`).
- **Son de Screen Recorder.** Seuls Chrome et Edge partagent le son, et seulement pour un onglet ou l'écran entier (`screen-recorder/page.jsx:70`). Firefox et Safari ne partagent aucun son, et une fenêtre non plus. Le libellé « Share audio » a été retiré du texte SEO.
- **Autres corrections, par outil :**
  - Booster : limiteur seulement si la case est cochée (`page.jsx:77`).
  - Compressor : plafond au débit de la source seulement quand ffmpeg le lit, avec un plancher de 8 kbps ; « nine lossy formats » sans article défini (M4R absent).
  - Converter : Opus toujours à 128 kbit/s ; le sélecteur ne liste que l'audio ; OGG, AC3 et MP2 n'acceptent que 48, 44,1 ou 32 kHz.
  - Splitter : seules les premières parts sont listées (`page.jsx:200`) ; l'étape 1 couvre les formats sans lecteur.
  - Waveform : seule la molette zoome autour du pointeur (`page.jsx:104-112` contre `190-191`).
  - Media Player : l'encodage d'un SRT non UTF-8 suit la langue du navigateur (`csvEncoding.js:87-92`) ; la liste des formats est complète (`VIDEO_ACCEPT`, `AUDIO_ACCEPT`).
  - Screen Recorder : l'enregistrement reste en mémoire tant que la page est ouverte.
  - Subtitle Generator : en MM:SS, les minutes ne sont pas contrôlées (`subtitleTime.js:13-14`), donc « 75:00 » vaut 1 h 15 min.
  - Video Metadata : « Tags » et « Chapters » n'apparaissent que si le fichier en a (`MediaInfo.jsx:45,47`).
  - Audio Metadata : la section Tags ne lit que les tags du conteneur (`mediaProbe.js:50`). La FAQ répond « No, not always », car OGG et Opus rangent leurs tags dans le flux. Ce point vient de la sortie habituelle de ffprobe ; il n'a pas été mesuré ici.

**Rapports d'erreur.** Chaque page dit maintenant exactement ce qui part, d'après `app/lib/reportError.js:140-154` : message nettoyé, nom de l'outil, nom et version du navigateur, et, quand l'outil passe le fichier, son extension et sa tranche de taille. Audio Metadata et Video Metadata ne parlent que de la copie nettoyée : l'erreur de lecture du rapport n'est pas envoyée (`MediaInfo.jsx:21,27`). Aucune page ne promet « no error reports ».

**Structure.** Les réponses de FAQ commencent par Yes, No ou le chiffre. Les questions répétées sur plusieurs pages (« Is my audio uploaded? », « Is there a size limit? ») sont remplacées par des questions propres à chaque outil.

**Doublons.** Plus aucune phrase identique entre les 15 pages du lot (script de comparaison de phrases). Les phrases suivantes ont été réécrites pour chaque outil : suppression sur le service, limites d'usage, liste d'entrée dans About (retirée, elle est dans les specs), journal d'erreurs, étapes des pages Metadata, et étape 1 de Splitter et Trimmer.

**Longueurs.** About 120 mots au plus, vie privée entre 40 et 90 mots, réponses de FAQ entre 25 et 70 mots, total visible de 426 à 696 mots. Pour rester sous 700 mots :
- Booster : une astuce retirée.
- Merger : la spec « Fades » retirée (elle est déjà dans About).

**Chaînes d'interface corrigées** (consigne du 06/10 sur les textes d'interface invérifiables ou trompeurs) :
- screen-recorder/page.jsx:166 : « Make an MP4 (plays on iPhone and everywhere) » → « Make an MP4 (plays on iPhone) » (« everywhere » invérifiable ; cité par le coordinateur, la partie « Make an MP4 » citée dans le texte SEO est inchangée).
- screen-recorder/page.jsx:70 (note « no sound ») : « tick "Share audio" in the browser's sharing dialog » → « tick the box that shares the tab or system audio in the browser's sharing dialog » (le libellé du navigateur n'est pas « Share audio »).
- audio-to-text/page.jsx:146 : « Works best in Google Chrome with microphone permission » → « Needs a browser with speech recognition, such as Chrome, and microphone permission ».
- media-player/page.jsx:65 : « Supports MP4, MP3, WAV, OGG, WebM » → « Plays what your browser can decode, such as MP4, MP3, WAV, OGG and WebM ».
- audio-metadata/page.jsx:33 (sous-titre) : « …cover art of any audio file — … » → « …of an audio file — … ».
- video-metadata/page.jsx:33 (sous-titre) : « …tags of any video — … » → « …tags of a video file — … ».
- subtitle-generator/page.jsx:36 (sous-titre) : « Create SRT subtitle files » → « Create SRT and WebVTT subtitle files ».

**Laissé au plan** (code ou libellés de contrôles, non modifiés) : « MB MB » d'Audio Compressor ; `aria-label=": dB"` d'Audio Equalizer ; minutes non contrôlées en MM:SS (`subtitleTime.js`) ; libellé de case d'Audio Booster « Normalize instead (even loudness at -16 LUFS, the podcast and streaming standard) » (« standard » non prouvé dans le dépôt, mais c'est un libellé de contrôle).

## Corrections après deuxième passe (06/10)

Les 12 défauts de la section « Deuxième passe » de `relecture/audio.md` sont corrigés :
- **Audio Compressor, méta :** « Make an audio file smaller at 64 to 320 kbps, in mono or at a lower sample rate. Shows both sizes; never above the source bitrate when it can be read. » (150 caractères ; `page.jsx:61`).
- **Audio Equalizer, vie privée :** ffmpeg.wasm n'intervient « only when your browser cannot decode the file itself (WMA, AC3 or AMR, for example) » (`decodeAudio.js:6-18`).
- **Audio Metadata :**
  - Étape 3 : « Tags » et « Chapters » seulement s'ils existent (`MediaInfo.jsx:45,47`).
  - Astuce 1 : Audio Compressor reste au débit de la source ou en dessous « when it can read it ».
- **Screen Recorder, méta :** le son de l'onglet ou du système n'est capturé que sur Chrome et Edge (152 caractères ; `page.jsx:70`).
- **Phrases quasi identiques reformulées :**
  - Splitter FAQ 3 (16 bits) : la phrase ne double plus celle de Booster.
  - Formats traités dans l'onglet : une formulation propre à Booster, à Splitter et à Converter.
  - Rapport d'erreur : formulation propre à Splitter.
  - Audio to Text, About : ne reprend plus la phrase du jumeau Audio Transcriber, et ne nomme aucun format refusé par Whisper, faute de preuve dans le dépôt.

**Chaînes d'interface modifiées :**
- `audio-trimmer/page.jsx:184` (note sur les fondus) : « With a fade, the audio is re-encoded (same format at a high setting; WAV if this format cannot be written here). … » → « With a fade, MP3, OGG, M4A and AAC are re-encoded at a high setting, WAV, AIFF and FLAC losslessly, other formats as WAV. Without one, it is copied exactly. » (`page.jsx:19-22,131`).
- `audio-trimmer/page.jsx:194` : « Saved as WAV: this format cannot be re-encoded with fades in the browser. » → « Saved as WAV: with a fade, this tool keeps only MP3, OGG, M4A, AAC, WAV, AIFF and FLAC in their own format. »
- `audio-booster/page.jsx:98`, libellé de case : « Normalize instead (even loudness at -16 LUFS, the podcast and streaming standard) » → « Normalize instead (even loudness at -16 LUFS) ». Le contrôleur l'a autorisé ; la logique est inchangée. Les textes de la page qui citent ce libellé ne le citent que par « Normalize instead », qui reste exact.

Les trois contrôles ont été relancés après ces modifications (résultat dans le message final).
