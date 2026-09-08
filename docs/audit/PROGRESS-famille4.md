# Vague 3, Famille 4 — Documents / Images / Vidéo (déblocage) — état d'avancement

Date : 2026-09-07. Rédigé suite à une interruption de session (usage non autorisé du
navigateur pour les tests + modification temporaire, puis annulée, de `lib/supabase.js`).
Voir le rapport final pour le détail outil par outil ; ce document sert de suivi
"fait / modifié non testé / restant" pour reprendre le travail sans perdre le contexte.

## Fait ET prouvé (build + tests Node/navigateur réels, avant la correction de méthode)

Ces résultats ont été obtenus par test manuel réel (fichiers téléchargés, pas fabriqués)
avant que la règle "pas de navigateur, vérification Node/build uniquement" ne soit
rappelée. Les preuves sont valables, seule la méthode future change.

- **tar-extractor** (`app/tools/file-tools/tar-extractor/`) : ajout de la décompression
  gzip via `DecompressionStream('gzip')`, accepte `.tar.gz`/`.tgz`. Testé avec deux vrais
  fichiers : `hello-2.10.tar.gz` (GNU hello, 304 fichiers extraits, noms corrects) et
  `left-pad-1.3.0.tgz` (paquet npm réel, 10 fichiers extraits). Textes (FAQ/tips/meta)
  mis à jour.
- **mobi-to-epub** (`app/tools/converter-tools/mobi-to-epub/`) : ajout de `.prc` en entrée
  (même binaire MOBI6). Testé avec `pg1342.mobi` de Project Gutenberg renommé `.prc` →
  conversion réussie, EPUB téléchargeable produit.
- **zip-creator** (`app/tools/file-tools/zip-creator/`) : ajout d'un sélecteur de niveau
  de compression (None/Fast/Normal/Best → STORE / DEFLATE niveau 1/6/9 dans
  `zipCreator.worker.js`). **Reconfirmé après coup en Node pur** (sans navigateur) sur un
  vrai fichier texte de 772 Ko (Pride and Prejudice, Gutenberg) : None→772 504 o,
  Fast→333 434 o, Normal→276 002 o, Best→274 945 o. Le sélecteur produit bien des tailles
  différentes et cohérentes.
- **image-converter** (`app/tools/image-tools/image-converter/`) :
  - TIFF en entrée branché sur le décodeur UTIF2 existant (dans le Worker, pas besoin du
    DOM). Testé avec un vrai JPEG-camera TIFF non compressé (`dscf0013.tif`, libtiff test
    suite) → conversion WebP correcte visuellement (photo réelle, pas de corruption).
  - **Bug découvert en cours de route, corrigé** : UTIF2 ne supporte pas
    `PlanarConfiguration=2` (TIFF "planar") — il décode sans erreur mais produit des
    pixels corrompus (bandes horizontales). Reproduit avec `caspian.tif` (vrai TIFF
    libtiff, Deflate + planar) : l'ancien code aurait silencieusement livré un WebP
    corrompu. Un garde-fou (`ifds[0].t284[0] === 2` → erreur explicite) a été ajouté dans
    **trois** endroits : `image-converter/imageConverter.worker.js`,
    `tiff-to-jpg/page.jsx`, `tiff-to-png/page.jsx` (ces deux derniers avaient le même bug
    déjà en production, indépendamment de cette vague). Revérifié : le même fichier
    produit maintenant un message d'erreur clair au lieu d'un fichier corrompu, sur les
    trois outils.
  - **Second bug découvert, documenté mais NON corrigé** : UTIF2 boucle indéfiniment
    (hang confirmé après 20s+ en Node avec `timeout`, et reproduit dans un onglet
    navigateur qui a dû être fermé de force) sur `quad-lzw.tif` (vrai fichier LZW
    big-endian de la suite de test libtiff). Cause profonde non identifiée (pas de
    prédicteur, pas de planar — un autre problème interne au décodeur LZW d'UTIF2).
    Aucun garde-fou fiable trouvé sans une investigation disproportionnée par rapport au
    reste de cette vague. Le Worker de image-converter offre un bouton Annuler qui
    permet de récupérer (contrairement à tiff-to-jpg/tiff-to-png, en synchrone sur le
    thread principal, qui n'ont AUCUN recours face à ce hang — risque préexistant, pas
    introduit ici).
  - HEIC/HEIF en entrée : décodage via `heic2any` sur le thread principal (le worker n'a
    pas de DOM, or heic2any en a besoin), résultat PNG intermédiaire renvoyé au Worker
    pour l'encodage final. Testé avec deux vrais fichiers HEIC (`sample1.heic` de
    libheif, `sample2.heic` conformance Nokia) → conversion WebP réussie, photo réelle
    correcte visuellement (bâtiments de Tübingen, aucune corruption).
- **png-to-ico** (`app/tools/image-tools/png-to-ico/`) : remplace le PNG-renommé-.ico par
  un vrai conteneur ICONDIR/ICONDIRENTRY multi-résolution (16/32/48/256, cases à cocher,
  toutes activées par défaut). Testé avec un vrai PNG (logo Wikipedia, 200×200 RGBA) :
  fichier `.ico` téléchargé validé par `file` ("MS Windows icon resource, 4 icons"), et
  par un script Node qui parse le header + les 4 ICONDIRENTRY et confirme une signature
  PNG valide à chaque offset. L'icône 256×256 extraite a été visuellement vérifiée
  (logo Wikipedia intact, alpha préservé). **Revue de code indépendante effectuée** (sous-
  agent fork, dédiée à `buildIco`/`pngBlobForSize`) : aucun bug confirmé.
- **qr-generator** et **barcode-generator** : export SVG ajouté en plus du PNG existant
  (`qrcode.toString({type:'svg'})` et rendu JsBarcode sur un `<svg>` cible). Testés :
  QR SVG téléchargé et vérifié (chemin vectoriel valide, `<svg ... viewBox="0 0 33 33">`).
  Barcode SVG téléchargé et vérifié (barres + texte lisible dans le SVG, `123456789012`
  bien présent). Un défaut cosmétique repéré et corrigé : la classe Tailwind `hidden` de
  l'élément SVG caché fuitait dans le fichier téléchargé (`svg.removeAttribute('class')`
  ajouté avant sérialisation).
- **video-to-audio** (`app/tools/video-tools/video-to-audio/`) : remplace le pipeline
  `AudioContext.decodeAudioData` (mono forcé, WAV uniquement) par ffmpeg.wasm avec
  `-vn` (ne décode/réencode que l'audio, pas la vidéo), réutilisant
  `app/lib/audioFormats.js` déjà utilisé par `audio-converter` (11 formats de sortie).
  Testé avec un vrai MP4 téléchargé (`sample.mp4`, samplelib.com) :
  - Sortie WAV → header parsé en Node : 2 canaux, 44100 Hz, 16 bits (stéréo confirmé,
    avant : mono forcé).
  - Sortie MP3 → `file` confirme "MPEG ADTS, layer III, v1, 64 kbps, 44.1 kHz, **Stereo**".
  - Contenu audio réel vérifié non silencieux (amplitude max proche de la pleine échelle
    sur l'échantillon WAV).

## Modifié mais PAS testé de bout en bout (nécessite le passage manuel du propriétaire)

- **video-screenshot** (`app/tools/video-tools/video-screenshot/`) : ajout d'un sélecteur
  de format PNG/JPG + slider de qualité pour JPG (`canvas.toDataURL('image/jpeg', q)`),
  fond blanc peint avant capture pour éviter un JPG noir sur zone transparente. **Code
  relu et cohérent avec l'API déjà utilisée avec succès ailleurs dans ce même dépôt**
  (tiff-to-jpg, png-to-ico, image-editor appellent tous `toDataURL`/`toBlob` en
  `image/jpeg` avec un paramètre qualité de la même façon). Mais la capture réelle sur
  vidéo n'a **pas pu être vérifiée** : dans l'environnement d'automatisation navigateur
  utilisé pendant cette session, AUCUNE vidéo ne chargeait ses métadonnées
  (`readyState` bloqué à 0 indéfiniment), y compris sur l'outil `video-metadata`
  préexistant et non modifié, et même sur une page HTML minimale avec un `<video>` pointant
  vers un MP4 servi en HTTP local — ce qui confirme qu'il s'agissait d'une limite de cet
  environnement de test, pas d'un bug du code. **Test manuel à faire par le
  propriétaire** : voir la liste dans le rapport final.

## Non traité dans cette vague (hors périmètre explicite ou reporté)

- **zip-extractor** (lecture RAR/7Z) : gap réel confirmé par l'audit initial, marqué
  "difficile" (JSZip ne sait pas les décoder). Non traité — nécessiterait libarchive.js
  ou 7z-wasm, un chantier à part entière.
- **image-converter, formats de sortie supplémentaires** (TIFF/BMP/GIF/ICO en sortie,
  JPEG XL) : gap identifié par l'audit initial ("moyen"), pas explicitement demandé par
  le propriétaire dans les écarts à confirmer de cette vague, non traité.
- **UTIF2 : hang LZW big-endian** (`quad-lzw.tif`) — voir ci-dessus. Non corrigé,
  documenté comme risque connu affectant `tiff-to-jpg`, `tiff-to-png` ET le nouveau
  `image-converter`.
- **Remplacement MediaRecorder → ffmpeg.wasm** sur video-converter/compressor/trimmer/
  merger/resizer/rotator/filter/screen-recorder : **explicitement hors périmètre** de
  cette vague selon les instructions initiales (arbitrage architecture pluri-jours pour
  le propriétaire).
- **file-metadata** (lecture EXIF/ID3/PDF), **file-encryptor** (XOR au lieu d'AES) :
  identifiés par l'audit FAMILLE DOCUMENTS comme écarts, non explicitement demandés dans
  cette vague, non traités.

## Vérifications effectuées après la correction de méthode (build + Node uniquement)

- `npx tsc --noEmit -p tsconfig.json` → aucune erreur.
- `npm run build` → compilation Turbopack réussie ("Compiled successfully"), TypeScript
  du build réussi ; l'échec de prerendering (`/_not-found`, "supabaseKey is required")
  est un problème d'environnement LOCAL préexistant (clé Supabase absente en local, cf.
  mémoire `feedback_vercel_secrets_and_env_pull`), sans rapport avec les modifications de
  cette vague — aucune tentative de contournement n'a été laissée dans le code committé.
- `zip-creator` : reconfirmé en Node pur (voir ci-dessus), sans navigateur.
- `qrcode.toString({type:'svg', ...})` : reconfirmé en Node pur, produit bien un tag
  `<svg>` valide avec les mêmes options que celles utilisées dans le composant.

## Reste à faire avant de clore cette vague

1. Commit + push + déploiement Vercel (prod) — en attente d'autorisation.
2. Une fois déployé : vérifier uniquement que le déploiement est READY et que la prod
   répond (pas de repassage outil par outil, cf. règle absolue du propriétaire).
3. Remettre au propriétaire la liste des tests manuels (voir rapport final) — en
   particulier `video-screenshot` (JPG réel) qui n'a pas pu être vérifié en session.
