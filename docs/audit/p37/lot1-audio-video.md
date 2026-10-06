# P37 — lot 1 audio / vidéo (+ isMobileDevice)

Date : 06/10. Branche p37, rien n'est commité (le contrôleur commite).
Tests : `node scripts/p37/<test>.mjs` (arbre de travail) et `SRC_REV=HEAD node scripts/p37/<test>.mjs` (avant).
Sorties gardées : `docs/audit/p37/lot1-audio-video-sorties/*.avant.txt` et `*.apres.txt`.

Bilan des tests : avant 42 FAIL au total, après 0 FAIL.

| Test | Avant (HEAD) | Après |
|---|---|---|
| `scripts/p37/audio-formats.test.mjs` (bogues 6, 7) | 13 FAIL | all PASS (40) |
| `scripts/p37/audio-ui.test.mjs` (bogues 4, 5) | 4 FAIL | all PASS |
| `scripts/p37/isMobileDevice.test.mjs` (bogue 8) | 7 FAIL | all PASS (24) |
| `scripts/p37/video-converter.test.mjs` (bogue 1) | 4 FAIL | all PASS |
| `scripts/p37/video-rotator.test.mjs` (bogue 3) | 2 FAIL | all PASS |
| `scripts/p37/video-watermark.test.mjs` (bogue 2) | 12 FAIL | all PASS |

Contrôles de texte, tous à 0 défaut : `content-verify` sur `audio-tools/` (11 pages), `video-tools/` (15 pages),
`file-tools/` (9), `pdf-tools/` (39), et sur chaque page des autres catégories touchée (csv-to-excel, csv-to-json,
csv-to-sql, excel-to-csv, excel-to-json, hash-generator, image-compressor, image-converter) ;
`instructions.mjs` : 0 écart ; `privacy-claims.mjs` : 0 échec ; `check-accept-extensions.js` : OK ;
`us-spelling.mjs` : 0 changement. ESLint : aucune nouvelle alerte (celles qui restent existaient déjà).

## Ordre par gravité

1 (résultat faux) : bogue 6. 2 (échec, refus, plantage) : bogues 1, 3, 7, 8. 3 (gêne) : bogues 2, 4, 5.

---

## Bogue 6 — AC3 / MP2 « 128 kbps » écrits à 192 (gravité 1)

- **Outils** : Audio Converter et Video to Audio (tous deux via `buildOutputSpec(format, kbps)`).
  Audio Compressor n'est pas touché (il passe son propre `-b:a`). Audio Merger a sa propre liste AC3 (192 à 640) : correcte.
- **Repro** : `buildOutputSpec('ac3', 128)` donnait `-b:a 192k` (plancher `Math.max(kbps, 192)` dans `app/lib/audioFormats.js`).
  Le visiteur choisit « Standard — 128 kbps » et reçoit un fichier à 192 kbit/s, 50 % plus gros.
- **Correctif** : le débit choisi est écrit tel quel. 128 est un débit légal des deux codecs
  (table AC-3 32-640 ; MPEG-1 Layer II 32-384). Fichier : `app/lib/audioFormats.js`.
- **Test** : `audio-formats.test.mjs` vérifie `-b:a` pour 7 formats × 4 débits, et que le débit est légal pour le codec.
  Avant : `FAIL AC3 "Standard — 128 kbps": -b:a 128k (written 192k)`, idem MP2. Après : PASS.
- **Preuve dans le vrai navigateur** (à lancer par le contrôleur, serveur local démarré) :
  `node scripts/p37/audio-bitrate-browser.mjs http://localhost:3000` — convertit un WAV en AC3 et MP2 à 128, 192 et
  256 kbps dans la vraie page et lit le débit dans l'en-tête des trames (pas besoin de ffprobe). Aucune requête au service.
- **Marché** : 123apps propose 64 à 320 kbps et les respecte ; CloudConvert a un champ débit (déjà noté en P21 dans le code).
  Le débit choisi doit donc être celui du fichier.
- **Texte** :
  - Audio Converter, specs « Quality » : « …WMA, AC3 and MP2; AC3 and MP2 are never written below 192 kbps. Opus… »
    → « …WMA, AC3 and MP2, written as chosen. Opus… ».
  - Video to Audio, specs « Bitrate » : « …that take one (AC3 and MP2: at least 192 kbps); lossless… »
    → « …that take one, AC3 and MP2 included; lossless… ».
  - Preuves P36 retirées (affirmations disparues) : `docs/audit/p36/preuves/audio.json` (« 192 kbps », audio-converter)
    et `docs/audit/p36/preuves/video.json` (« at least 192 kbps », video-to-audio).

## Bogue 1 — Video Converter : « Resolution » + vitesse ou miroir refusé après l'envoi (gravité 2)

- **Repro** : MP4, « Limit to 720p », vitesse 2×. La page envoie `{maxHeight: 720, speed: 2}`. Le service refuse
  (« Choose either a size or a maximum height. », `services/media-processing/app/ffmpeg_ops.py`, `if filters and max_h`)
  seulement après l'envoi complet du fichier (jusqu'à 1 Go).
- **Correctif** : la règle est vérifiée dans la page avant tout envoi. Un message apparaît sous les réglages et
  « Convert » reste grisé tant que l'un des deux n'est pas retiré. Volume, fondus et CRF restent permis (le service les accepte).
  - `app/tools/video-tools/video-converter/convertParams.js` (nouveau) : construction de la requête déplacée telle quelle
    depuis la page, plus `editConflict(p)`.
  - `app/tools/video-tools/video-converter/page.jsx` : importe le module, `buildParams={buildConvertParams}`, `problem={editConflict}`.
  - `app/components/MediaServiceTool.jsx` : nouvelle prop facultative `problem(params)` → message (`role="alert"`),
    bouton désactivé, `run()` ne part pas. Sans la prop, rien ne change pour les autres outils.
- **Test** : `video-converter.test.mjs` relit la règle dans `ffmpeg_ops.py`, la rejoue sur 9 cas, et exige que la page
  bloque exactement les cas que le service refuse. Avant : 4 FAIL (3 cas envoyés puis refusés + pas de contrôle).
  Après : all PASS.
- **Marché** : 123apps et FreeConvert acceptent taille + vitesse ensemble. Notre service ne le sait pas encore : voir « Reporté ».
- **Texte** (howTo 3) : « …adds edits, but our video service refuses a "Resolution" limit combined with a speed or a mirror. »
  → « …adds edits. A "Resolution" limit cannot be combined with a speed or a mirror: the page says so, and "Convert"
  stays off, before anything is uploaded. »
- Nouveau texte d'interface : « A "Resolution" limit cannot be combined with a speed [/ a mirror / a speed and a mirror].
  Set "Resolution" to "Keep original resolution", or set "Speed" to "Normal speed" and "Mirror" to "None". »

## Bogue 3 — Video Rotator garde un mode « Instant, lossless » caché (gravité 2)

- **Repro** : MP4, choisir « Instant, lossless », puis choisir un WebM. Le choix est caché pour un WebM, mais l'état
  restait `lossless` : « Rotate Video » était refusé avec « "Instant, lossless" works for MP4, MOV, M4V and 3GP only… ».
  Même chose MOV → MKV.
- **Correctif** : `app/tools/video-tools/video-rotator/rotateMode.js` (nouveau, `rotateModeFor(nom, mode)`).
  À chaque fichier choisi, un fichier sans réglage de rotation remet le mode à « Compatible everywhere ».
  `rotate()` recalcule aussi le mode réel à partir du fichier. MP4 → MP4 garde le choix (il reste visible).
  Fichier : `app/tools/video-tools/video-rotator/page.jsx`.
- **Test** : `video-rotator.test.mjs` rejoue des suites de choix avec les règles de la page.
  Avant : 2 FAIL (« refused: hidden "Instant, lossless" »). Après : all PASS.
- **Marché** : Clideo et 123apps n'ont pas de mode caché ; le réglage affiché est celui appliqué.
- **Texte** : aucun changement nécessaire (la FAQ dit déjà « WebM, MKV or AVI : "Compatible everywhere" only »).

## Bogue 7 — `.ac3` absent de la liste du sélecteur audio (gravité 2)

- **Repro** : `AUDIO_ACCEPT` (`app/lib/mediaSupport.js`) n'avait pas `.ac3`. Selon le système, le sélecteur ne propose
  pas le fichier, alors que les 9 outils audio et Media Player le lisent (ffmpeg.wasm décode l'AC3 ; Equalizer, Trimmer,
  Splitter et Merger le citaient déjà comme format lu).
- **Vérification des 10 utilisateurs** : Booster, Compressor, Converter, Splitter, Trimmer, Merger, Metadata (ffmpeg.wasm) ;
  Equalizer et Waveform (repli ffmpeg.wasm quand le navigateur ne décode pas) ; Media Player (message « cannot play »
  existant si le navigateur ne lit pas l'AC3, comme pour le WMA).
- **Correctif** : `.ac3` ajouté à `AUDIO_ACCEPT`. `check-accept-extensions.js` : OK.
- **Test** : `audio-formats.test.mjs` exige `.ac3` dans la liste et que chaque format annoncé par ces 10 pages
  (« Input formats ») soit dans la liste. Avant : 11 FAIL. Après : PASS.
- **Texte** : « Input formats » des 10 pages : « …Opus, WMA, AIFF, AIF, AMR… » → « …Opus, WMA, AC3, AIFF, AIF, AMR… ».
  Page de catégorie Audio, FAQ « Which audio formats can I open? » : « …WMA, AIFF, AMR… » → « …WMA, AC3, AIFF, AMR… ».

## Bogue 8 — Tablettes Android traitées comme des ordinateurs (gravité 2)

- **Repro** : `isMobileDevice()` croyait d'abord `navigator.userAgentData.mobile`, qui vaut `false` sur une tablette
  Android (Chrome, Edge, Samsung Internet). Chrome sur une tablette de 10 pouces demande même le site ordinateur
  (UA « X11; Linux x86_64 »). Résultat : plafonds d'ordinateur (ex. 700 Mo au lieu de 100 Mo pour ZIP Creator) sur un
  appareil qui a la mémoire d'un téléphone → onglet tué.
- **Correctif** (`app/lib/isMobileDevice.js`, nouvelle fonction pure `isMobileNavigator(nav)`) — mobile si :
  « Android » dans l'UA ou `userAgentData.platform` = Android ; iPhone/iPad/iPod ; Mac + écran tactile (iPad, même
  règle que `canvasLimit.js` et `download.js`) ; Silk ou code de modèle Kindle Fire (KF…) ; UA Linux (pas Chromebook)
  + écran tactile (tablette Android en mode « site ordinateur ») ; `userAgentData.mobile` vrai ; « Mobile » dans l'UA.
- **Test** : `isMobileDevice.test.mjs`, 23 UA réels + rendu serveur. Avant : 7 FAIL (Galaxy Tab Chrome et Samsung
  Internet, Edge tablette, Pixel Tablet site ordinateur ×2, Fire HD 10 Silk ×2). Après : all PASS. Téléphones, iPad,
  Windows (y compris Surface tactile), Mac, Linux sans tactile et Chromebook tactile : inchangés.
- **Les 18 appelants vérifiés** (tous utilisent le résultat seulement pour des plafonds plus bas, ce qui est juste pour une
  tablette Android) : `app/lib/pdfImages.js` (Image to PDF, JPG to PDF : 48 MP et « Reduce »), csv-to-excel, csv-to-json,
  csv-to-sql, excel-to-csv, excel-to-json (lignes / taille), hash-generator (100 MiB en mémoire), zip-creator,
  zip-extractor, image-compressor (48 MP + réduction), image-converter, pdf-compress, pdf-editor, pdf-merge, pdf-split
  (pages / taille), video-merger (700 Mo), video-trimmer (Mo).
- **Limite connue** : un portable Linux à écran tactile reçoit aussi les plafonds mobiles (plus bas, jamais faux).
- **Texte** (consigne P36 « on phones, iPhone and iPad » levée, car la détection couvre maintenant les tablettes Android) :
  - « phones, iPhone and iPad » → « phones and tablets » ; « a phone, iPhone or iPad » → « a phone or tablet » ;
    « on a computer or an Android tablet » → « on a computer ». Pages : csv-to-excel, csv-to-json, csv-to-sql,
    excel-to-csv, excel-to-json, hash-generator, zip-creator (page + layout : « 100 MB on phones and iPad. » →
    « 100 MB on phones and tablets. »), zip-extractor, image-compressor, image-converter, pdf-compress, pdf-editor,
    pdf-merge, pdf-split, video-merger, video-trimmer, image-to-pdf, jpg-to-pdf, catégories File et Video.
  - Messages d'interface : « on a phone the limit is … » → « on a phone or tablet the limit is … »
    (image-compressor, `pdfImages.js`) ; sous-titre d'image-compressor « … on a phone (48 MP… » → « … on a phone or tablet (48 MP… » ;
    video-merger « …on a phone. Trim or compress… » → « …on a phone or tablet. … ».
  - Anciens tests navigateur mis à jour sur ces chaînes : `scripts/p31/size-preflight.mjs`, `scripts/p33/pdf-reduce.mjs`.

## Bogue 2 — Video Watermark : l'estimation égale la durée de la vidéo (gravité 3)

- **Repro** : `setEta((1 - progression) × durée)` = secondes de vidéo restantes, pas le temps d'attente. 60 s en 1080p
  dans Chrome (~3,7 s par seconde de vidéo, mesuré le 28/09) : « 54s » affiché à 10 % pour 200 s réelles ; Firefox
  (~29 s/s) : 54 s pour 1 566 s.
- **Correctif** : `app/tools/video-tools/video-watermark/encodeEta.js` (nouveau) : temps écoulé × reste / fait, mesuré
  dans l'onglet depuis le début de l'encodage du filigrane ; rien n'est affiché avant 3 % et 3 s (aucun chiffre deviné).
  Libellé « Encoding... (about 3 min 20 s left) ». Fichier : `app/tools/video-tools/video-watermark/page.jsx`.
- **Test** : `video-watermark.test.mjs` simule 3 vitesses mesurées × 4 points ; tolérance 15 %. Avant : 12 FAIL. Après : all PASS.
- **Marché** : CloudConvert et FreeConvert n'affichent qu'un pourcentage ; HandBrake affiche un temps restant tiré de la
  vitesse mesurée. Nous suivons HandBrake.
- **Texte** : barre « Encoding... (Ns of video left to encode) » → « Encoding... (about N s left) » ;
  FAQ « How long does watermarking take? » : « The seconds shown next to the progress bar count the video still to
  encode, not the waiting time. » → « After the first few seconds, the page shows the time left next to the progress
  bar, worked out from the speed measured in your browser. »

## Bogue 4 — Audio Compressor affiche « MB MB » (gravité 3)

- **Repro** : `formatBytes()` rend déjà l'unité, la page ajoutait « MB » : « 1.2 MB MB », et « 500 KB MB » (unité fausse).
- **Correctif** : « MB » retiré aux 4 endroits. Fichier : `app/tools/audio-tools/audio-compressor/page.jsx`.
- **Test** : `audio-ui.test.mjs` remplit les lignes JSX avec de vraies valeurs. Avant : « Original 5.2 MB MB », « 800 KB MB » (FAIL). Après : PASS.
- **Texte** : « Re-encoding it gives {X} MB, not less than your {Y} MB » → « Re-encoding it gives {X}, not less than your {Y} ».

## Bogue 5 — Audio Equalizer : curseurs nommés « : dB » (gravité 3)

- **Repro** : les 3 curseurs avaient `aria-label=": dB"` : un lecteur d'écran annonce « : dB » trois fois.
  Même défaut trouvé dans Video Trimmer : `aria-label="Start: s"` et `"End: s"`.
- **Correctif** : « Bass gain (dB) », « Mid gain (dB) », « Treble gain (dB) » ; « Start (seconds) », « End (seconds) ».
  Fichiers : `app/tools/audio-tools/audio-equalizer/page.jsx`, `app/tools/video-tools/video-trimmer/page.jsx`.
- **Test** : `audio-ui.test.mjs`. Avant : « : dB | : dB | : dB », « Start: s | End: s » (FAIL). Après : PASS.

---

## Reporté (non corrigé), avec estimation

1. **Service vidéo : taille + vitesse/miroir ensemble** (comme 123apps). Dans `ffmpeg_ops.py`, ajouter
   `scale=-2:'min(h,ih)'` à la chaîne `filters` au lieu de refuser. ~1 h de code + tests, puis déploiement Railway par
   le propriétaire ; ensuite retirer `problem={editConflict}` de la page et la phrase du howTo. Coût Railway : nul.
2. **MP2 mono à 256 ou 320 kbps** : la norme MPEG-1 Layer II limite le mono à 192 kbps. Audio Converter et Audio
   Compressor proposent mono + MP2 + 256/320. À vérifier avec le vrai encodeur (lecture ffprobe sur la machine du
   propriétaire), puis limiter les choix ou le dire. ~1 h.
3. **Formats écrits par le site mais absents du sélecteur** : `.mp2`, `.m4b`, `.m4r`, `.wv`, `.au` (ffmpeg.wasm les lit).
   Ajout à `AUDIO_ACCEPT` + « Input formats » de 10 pages + test. ~1 h.
4. **Même défaut d'`aria-label` hors lot** : `app/tools/image-tools/image-rotate/page.jsx:50` `aria-label="Custom angle: °"`. 5 min.
5. **Tablette Android réelle** : confirmer sur un vrai appareil (Galaxy Tab ou Pixel Tablet, Chrome en mode site
   ordinateur) que `maxTouchPoints > 1` et l'UA Linux sont bien vus. 30 min, appareil du propriétaire.
6. **Preuve navigateur du bogue 6** : lancer `scripts/p37/audio-bitrate-browser.mjs` (voir plus haut). 10 min.
