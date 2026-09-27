# TESTS SAFARI — feuille du propriétaire (bloquant 9)

> **Rôle de ce document :** feuille opérationnelle du **bloquant 9**, comme `tests-manuels-proprietaire.md` l'est pour le bloquant 11. **Tu es le seul à pouvoir la remplir** : ni Claude, ni le WebKit de Playwright (il n'a même pas `OffscreenCanvas`), ni un service de test ne remplacent un vrai Safari. Les verdicts se reportent dans `plan-de-travail.md` ; **ce qui échoue remonte dans le bloquant 9, jamais dans « CLOS »**.
>
> **Mise à jour du 27 septembre 2026** pour la passe du 28/09 : la feuille du 19/09 couvrait 20 outils ; depuis, **31 outils ont été créés ou modifiés** (relevé dans l'historique `git log --since=2026-09-19 -- app/tools`), dont les correctifs S1 à S5 issus de la mesure Safari 17.6 du 19/09. Cette version couvre **29 outils**, classés par **risque Safari lu dans le code** (fonctions utilisées : Web Worker, WebAssembly, OffscreenCanvas, caméra, presse-papiers, envoi par morceaux, formats audio). **Rien ici n'a été exécuté dans un vrai Safari.** Les mentions « risque » sont des hypothèses tirées du code, à confirmer ou infirmer par toi.

---

## 0. AVANT DE COMMENCER (15 min)

**Durée honnête : ≈ 3 h 30 au total** (estimation, pas mesure), en quatre séances.

| Séance | Contenu | Durée |
|---|---|---|
| **A — iPhone, outils 1 à 15** | la moitié la plus risquée | **≈ 75 min** |
| **C — MacBook, outils 1 à 15** | la même moitié | **≈ 40 min** |
| **B — iPhone, outils 16 à 29** | le reste | **≈ 50 min** |
| **D — MacBook, outils 16 à 29** | le reste | **≈ 25 min** |

**Si tu t'arrêtes à la moitié : fais A puis C (≈ 2 h avec la préparation).** Ils couvrent les 15 outils les plus risqués sur les deux appareils, dont tous les retests S1-S5.

### Ce qu'il te faut
- L'iPhone, en **Safari** (pas Chrome iOS). **Pas en navigation privée.** Le MacBook, en **Safari**.
- **Charge > 30 %**, Wi-Fi, **mode économie d'énergie désactivé** (il bride le processeur).
- Une app de notes ouverte à côté (voir §5).

### Note ta version (une seule fois)
- iPhone : **Réglages > Général > Informations > Version iOS** → `iOS ____`
- MacBook : **Safari > À propos de Safari** → `Safari ____` et macOS `____`

### Les fichiers d'essai

**Fournis dans le dépôt** — dossier `docs/audit/fixtures-safari/` (régénérables : `node scripts/generate-safari-fixtures.js`, puis `node scripts/browser-tests/archive-fixtures.mjs <dossier>` et `node scripts/generate-safari-fixtures-2.mjs <dossier> <ffmpeg>`) :

| Fichier | Taille | Sert pour | Contenu attendu |
|---|---|---|---|
| `safari-A-3pages.pdf`, `safari-B-3pages.pdf` | 1,4 Ko | 27 Merge PDF | « FICHIER A » / « FICHIER B », 3 pages chacun |
| `safari-30pages.pdf` | 8 Ko | 18 Split PDF, 19 Compress PDF | 30 pages |
| `safari-qr.png` | 2,5 Ko | 9 QR Scanner | texte `SAFARI-QR-OK-2026` |
| `safari-winrar.rar` | 5,6 Ko | 1 Zip Extractor | fait par WinRAR, **noms de fichiers en chinois** |
| `safari-rar-password-1234.rar` | 0,4 Ko | 1 Zip Extractor | mot de passe **`1234`** (même la liste est chiffrée) |
| `safari-7z-password-data-only.7z` | 0,2 Ko | 1 Zip Extractor | mot de passe **`data-only`**, contient `secret.txt` = « top secret » |
| `safari-split.part1.rar` / `.part2.rar` / `.part3.rar` | 2,5 Mo | 1 Zip Extractor | RAR en 3 volumes, mot de passe **`mot de passe`** |
| `safari-tree.zip` | 0,3 Mo | 1 Zip Extractor | une arborescence de dossiers |
| `safari-tone-A-5s.flac`, `safari-tone-B-3s.mp3`, `safari-tone-C-4s.wav` | 0,1-0,7 Mo | 6 Audio Merger | trois sons purs : grave 5 s, moyen 3 s, aigu 4 s |
| `safari-tone-12s.wav` | 2 Mo | 12 Audio Trimmer | un son continu de 12 s |
| `safari-small-800x600.jpg` | 38 Ko | 11 Image Upscaler | mire de test 800×600 (0,48 Mpx) |
| `docs/audit/fixtures-fidelite/fidelite-01.docx` | 40 Ko | 17 Word to PDF | document Word avec tableau |

**Comment les avoir sur l'iPhone :** copie le dossier `fixtures-safari` (et `fidelite-01.docx`) vers **iCloud Drive** depuis le PC, puis ouvre-le dans l'app **Fichiers**. Sur le MacBook, même chose.

**À produire toi-même sur l'iPhone (3 min) — c'est aussi ce que ferait un vrai visiteur :**

| Fichier | Comment | Servira pour |
|---|---|---|
| **VIDÉO** de 5 s | Appareil photo > Vidéo > 5 s | 2, 3, 4, 15 |
| **PHOTO** normale | une photo (12 Mpx) | 10, 11, 13, 16, 24, 25 |
| **PHOTO en Fichiers** (HEIC) | photo > Partager > **Enregistrer dans Fichiers** | 10 |
| **MÉMO VOCAL** de 10 s | app **Dictaphone** | 7 |
| **PHOTO 48 Mpx** *(iPhone 14 Pro et plus)* | Appareil photo > Résolution 48 MP | 25 — sinon « non testé » |

**Pour le MacBook :** les mêmes, par **AirDrop** depuis l'iPhone. Pour le test caméra (n° 9) sur iPhone, **ouvre `safari-qr.png` en grand sur l'écran du MacBook** : l'iPhone le filmera.

### Comment vérifier un téléchargement (règle valable partout)
Un « RÉUSSI » exige que **le fichier produit s'ouvre et soit correct**, pas seulement qu'un bouton ait réagi.
- **iPhone :** flèche de téléchargement dans la barre Safari > **Téléchargements** > touche le fichier > il doit **s'ouvrir avec le bon contenu**.
- **MacBook :** flèche de téléchargement en haut à droite > ouvre le fichier.
- **Le nom et l'extension comptent.** Un `.webm` ou un `.opus` qui ne s'ouvre pas, c'est ÉCHOUÉ — sauf si la page a dit **avant** que ton navigateur ne sait pas le lire (voir n° 6 et 8).

### Les trois verdicts
- **RÉUSSI** : le résultat attendu est obtenu **et** le fichier produit s'ouvre.
- **ÉCHOUÉ** : erreur, page blanche, résultat faux, fichier illisible, ou la page **se recharge toute seule / « Un problème est survenu sur cette page »** (Safari a tué l'onglet : mémoire).
- **BLOQUÉ** : test impossible (fichier introuvable, pas de mode 48 Mpx…). **Dis pourquoi.**

---

## 1. LES 29 OUTILS — CLASSÉS DU PLUS AU MOINS RISQUÉ

**Base :** `https://www.onlineconvertools.com` — **Légende des risques :** `Worker` Web Worker · `WASM` WebAssembly · `OffCanvas` OffscreenCanvas · `MÉDIA` API média (MediaRecorder, getUserMedia) · `ENVOI` envoi par morceaux vers notre service · `OPUS` fichier Opus (Safari peut ne pas le lire) · `PRESSE` presse-papiers · `TÉLÉCH` téléchargement · `MÉM` mémoire.
**Ordre = risque décroissant d'après le code.** Les retests des défauts du 19/09 sont marqués **[S1]** à **[S5]**.

---

### ▶ SÉANCE A/C — LES 15 PLUS RISQUÉS

#### 1. Zip Extractor *(refait le 26/09 : 7-Zip en WebAssembly, 40+ formats)*
`/tools/file-tools/zip-extractor`
- **Risque :** `Worker` `WASM` `MÉM` `TÉLÉCH`. Moteur 7-Zip compilé en WebAssembly, dans un Worker. **Safari n'a pas `showSaveFilePicker`** : « Save all to a folder » ne doit **pas** apparaître, et « Download all as ZIP » construit le ZIP en mémoire (plafonné à 1,9 Go ; sur iPhone la mémoire peut céder bien avant — ne teste pas de gros fichier).
- **Gestes :** (a) `safari-winrar.rar` > la liste s'affiche avec des **noms chinois lisibles** > **Download** d'un fichier > il s'ouvre ; (b) `safari-rar-password-1234.rar` > la page demande un mot de passe > `1234` > **Unlock** > la liste apparaît ; (c) `safari-7z-password-data-only.7z` > ouvre `secret.txt` > mot de passe `data-only` > il contient « top secret » ; (d) sélectionne **les trois** `safari-split.part*.rar` ensemble > mot de passe `mot de passe` > la liste s'affiche ; (e) `safari-tree.zip` > **Download all as ZIP** > le ZIP se décompresse dans Fichiers.
- **Attendu :** les 5 sous-cas réussissent ; **« Save all to a folder » absent** sur Safari.
- ☐ RÉUSSI ☐ ÉCHOUÉ ☐ BLOQUÉ *(note a-e séparément)*

#### 2. Video Compressor **[S1]** *(passé sur notre service ffmpeg le 20/09)*
`/tools/video-tools/video-compressor`
- **Risque :** `ENVOI` `TÉLÉCH`. Ne dépend plus de `captureStream` (cause de S1) : la vidéo est envoyée **par morceaux** à notre service. **Défaut WebKit connu** (envoi d'un `Blob.slice` par XHR) contourné en envoyant des tableaux d'octets — **jamais prouvé sur un vrai Safari.**
- **Geste :** ta **VIDÉO** 5 s (un `.MOV` d'iPhone) > niveau par défaut > **Compress** > attends (réveil du service ≈ 3 s) > télécharge.
- **Attendu :** progression visible, un fichier **plus léger** qui s'ouvre et se lit. *(Si la page dit « déjà bien compressée », c'est un résultat honnête, pas un échec : note-le.)*
- ☐ RÉUSSI ☐ ÉCHOUÉ ☐ BLOQUÉ

#### 3. Video Converter **[S1]**
`/tools/video-tools/video-converter`
- **Risque :** `ENVOI` `TÉLÉCH`. Même tuyau que le n° 2.
- **Geste :** la **VIDÉO** > sortie **MP4** > convertis > télécharge ; refais en **WebM**.
- **Attendu :** le MP4 s'ouvre et se lit ; le WebM se télécharge avec la bonne extension (le lire sur iPhone n'est pas exigé : note s'il se lit).
- ☐ RÉUSSI ☐ ÉCHOUÉ ☐ BLOQUÉ

#### 4. Video Trimmer **[S1]** *(refait sur ffmpeg.wasm le 20/09)*
`/tools/video-tools/video-trimmer`
- **Risque :** `WASM` `MÉM` `TÉLÉCH`. Moteur ffmpeg (~10 Mo) téléchargé au premier usage ; plafond mobile 100 Mo. La coupe s'aligne sur l'image-clé et **la page le dit**.
- **Geste :** la **VIDÉO** > coupe 1 s au début > **Trim** > télécharge.
- **Attendu :** une vidéo de ≈ 4 s (± 1-3 s, alignement annoncé) qui se lit.
- ☐ RÉUSSI ☐ ÉCHOUÉ ☐ BLOQUÉ

#### 5. Voice Recorder **[S2]**
`/tools/audio-tools/voice-recorder`
- **Risque :** `MÉDIA` `TÉLÉCH`. Défaut du 19/09 : Safari enregistre en MP4 et l'outil l'étiquetait `webm`. Corrigé : le type réel est détecté.
- **Geste :** **Start Recording** > **Autoriser** le micro > parle 5 s > **Stop Recording** > écoute > télécharge chaque format proposé.
- **Attendu :** ta voix au lecteur ; **chaque fichier porte l'extension de son vrai format** (`.m4a`/`.mp4` sur Safari, pas `.webm`) et se lit ; le WAV se lit.
- ☐ RÉUSSI ☐ ÉCHOUÉ ☐ BLOQUÉ

#### 6. Audio Merger *(refait les 26-27/09 : 14 formats, ordre, fondu enchaîné)*
`/tools/audio-tools/audio-merger`
- **Risque :** `WASM` `MÉM` `OPUS` `ENVOI` `TÉLÉCH`. ffmpeg.wasm ; **le glisser-déposer de la liste ne marche pas au doigt** (flèches ↑/↓ prévues pour le téléphone) ; sortie Opus encodée sur notre service ; certains formats (WMA, AC3, AIFF, CAF…) ne se lisent pas dans Safari et la page doit alors dire « no preview » au lieu d'un lecteur cassé.
- **Gestes :** (a) choisis `safari-tone-A-5s.flac`, `safari-tone-B-3s.mp3`, `safari-tone-C-4s.wav` > la liste montre format et durée > **flèche ↓** sur le premier : l'ordre devient B, A, C > sortie **FLAC** (défaut : MP3 pour ce mélange) > **Merge** > écoute : moyen, grave, aigu, **sans blanc** entre eux, durée 0:12.0 ; (b) coche **Crossfade between files**, longueur 1 > la note annonce « lasts 0:10.0 instead of 0:12.0 » > **Merge** > écoute : les sons se fondent, durée 0:10.0 ; (c) sortie **Opus** > **Merge** > le fichier `.opus` se télécharge (lecteur ou message « no preview » : note lequel) ; (d) **sur MacBook seulement** : glisse un fichier de la liste pour le remonter.
- **Attendu :** a-c (et d sur Mac) réussissent ; le fichier téléchargé se lit (au moins dans l'app Fichiers ou un lecteur externe pour l'Opus).
- ☐ RÉUSSI ☐ ÉCHOUÉ ☐ BLOQUÉ *(note a-d)*

#### 7. Audio Converter / Booster / Splitter / Compressor — sortie Opus *(Opus sur le service depuis le 23-26/09)*
`/tools/audio-tools/audio-converter` (puis `audio-booster`, `audio-splitter`, `audio-compressor`)
- **Risque :** `WASM` `ENVOI` `OPUS` `TÉLÉCH`. Le son est préparé par ffmpeg.wasm puis encodé en Opus sur notre service. Défaut trouvé sous Firefox le 26/09 (« .opus » enregistré « .ogg ») : **vérifie l'extension sur Safari**.
- **Geste :** le **MÉMO VOCAL** > Audio Converter, sortie **MP3** > télécharge ; puis sortie **Opus** > télécharge. Puis, rapidement, **Opus** dans Booster (gain par défaut) et Compressor (défaut), et Splitter en 2 parties.
- **Attendu :** MP3 lisible ≈ 10 s ; chaque fichier Opus se télécharge **avec l'extension `.opus`** (la lecture dans Safari n'est pas exigée : note-la).
- ☐ RÉUSSI ☐ ÉCHOUÉ ☐ BLOQUÉ *(note Converter MP3 / Opus, Booster, Splitter, Compressor)*

#### 8. Barcode Generator *(refait le 24-26/09 : 37 types, lot, planches PDF)*
`/tools/qr-barcodes-tools/barcode-generator`
- **Risque :** `Worker` `OffCanvas` `WASM` `TÉLÉCH`. Le dessin passe par `OffscreenCanvas` **dans des Workers** (absent du WebKit de Playwright : jamais exécuté en WebKit) ; chaque code est **relu par un décodeur WebAssembly** avant d'être proposé.
- **Gestes :** (a) type **EAN-13**, valeur `5901234123457` > PNG > télécharge ; SVG > télécharge ; (b) type **QR Code** ou **DataMatrix** > PNG ; (c) mode lot (« Values, one per line ») : 3 valeurs EAN-13 > télécharge le ZIP ; (d) **Print it on label sheets…** > PDF.
- **Attendu :** chaque fichier s'ouvre ; le code EAN-13 se lit avec l'appareil photo d'un autre téléphone ou une app de scan (facultatif) ; aucun message « could not verify ».
- ☐ RÉUSSI ☐ ÉCHOUÉ ☐ BLOQUÉ *(note a-d)*

#### 9. QR Scanner — caméra et collage *(ajoutés le 26/09)*
`/tools/qr-barcodes-tools/qr-scanner`
- **Risque :** `MÉDIA` `PRESSE`. La caméra (`getUserMedia`) sur iPhone exige un geste et une autorisation ; le **collage d'une image** dépend du presse-papiers de Safari.
- **Gestes :** (a) **Scan with camera** > **Autoriser** > vise `safari-qr.png` affiché sur l'écran du MacBook > le texte `SAFARI-QR-OK-2026` apparaît > **Stop camera** ; (b) **Upload an image** > `safari-qr.png` > même texte > **Copy** > colle dans Notes ; (c) ouvre `safari-qr.png` dans Fichiers/Photos > **Copier** > reviens sur la page > touche la zone de collage (appui long > **Coller**) > même texte ; (d) sur MacBook : glisse `safari-qr.png` sur la page.
- **Attendu :** a-c sur iPhone, b-d sur MacBook ; le texte collé dans Notes est exact.
- ☐ RÉUSSI ☐ ÉCHOUÉ ☐ BLOQUÉ *(note a-d)*

#### 10. Image Converter **[S3]** *(5 sorties ajoutées le 24/09, AVIF réel le 20/09)*
`/tools/image-tools/image-converter`
- **Risque :** `Worker` `OffCanvas` `WASM` `TÉLÉCH` `MÉM`. Défaut du 19/09 : un PNG livré sous le nom `.webp`. Corrigé : le type réel est vérifié. **L'AVIF passe par un encodeur WebAssembly jamais exécuté en WebKit.**
- **Gestes :** la **PHOTO** > **WebP** > télécharge ; **AVIF** > télécharge ; puis **BMP**, **TIFF**, **PDF** ; enfin la **PHOTO en Fichiers** (HEIC) > **JPG**.
- **Attendu :** chaque fichier est **du format demandé** (Fichiers > appui long > Informations > Type) et s'ouvre ; si Safari ne sait pas produire un format, **la page le dit avant**, elle ne ment pas sur l'extension.
- ☐ RÉUSSI ☐ ÉCHOUÉ ☐ BLOQUÉ *(note WebP / AVIF / BMP-TIFF-PDF / HEIC)*

#### 11. Image Upscaler **[S4]** *(modèle IA sur notre service depuis le 23/09)*
`/tools/ai-tools/image-upscaler`
- **Risque :** `ENVOI` `MÉM` `TÉLÉCH`. Défaut du 19/09 : canvas géant, fichier vide annoncé « réussi ». Désormais : ×2/×4 sur le service, image d'entrée **≤ 1 Mpx** — au-delà, l'outil **refuse avec un message** (il ne réduit pas).
- **Gestes :** (a) la **PHOTO** 12 Mpx > la page doit la **refuser avec un message clair** (taille en mégapixels) ; (b) `safari-small-800x600.jpg` > **×4** > **Upscale Image** > compare avant/après > **Download**.
- **Attendu :** (a) refus lisible, rien ne plante ; (b) une image de **3200×2400**, **non vide**, qui s'ouvre.
- ☐ RÉUSSI ☐ ÉCHOUÉ ☐ BLOQUÉ

#### 12. Audio Trimmer *(26/09 : dixième de seconde, fondus, coupe exacte WAV/FLAC)*
`/tools/audio-tools/audio-trimmer`
- **Risque :** `WASM` `MÉM` `TÉLÉCH`.
- **Geste :** `safari-tone-12s.wav` > début 2.0, fin 7.5 > fondu d'entrée et de sortie > coupe > **Download**.
- **Attendu :** un `.wav` de **5,5 s** qui se lit, avec fondus audibles au début et à la fin.
- ☐ RÉUSSI ☐ ÉCHOUÉ ☐ BLOQUÉ

#### 13. Image Compressor *(refait le 23/09 : MozJPEG, WebP, lot + ZIP)*
`/tools/image-tools/image-compressor`
- **Risque :** `Worker` `WASM` `MÉM` `TÉLÉCH`.
- **Geste :** la **PHOTO** + 2 autres photos > compresse > télécharge une image, puis **le ZIP**.
- **Attendu :** chaque image est **plus légère** que l'originale, s'ouvre et ressemble à l'original ; le ZIP se décompresse.
- ☐ RÉUSSI ☐ ÉCHOUÉ ☐ BLOQUÉ

#### 14. Hash Generator *(refait le 24/09 : 17 algorithmes, fichiers, 4 Workers)*
`/tools/developer-tools/hash-generator`
- **Risque :** `Worker` `WASM` `PRESSE` `TÉLÉCH`.
- **Geste :** texte `abc` > les empreintes s'affichent ; **SHA-256 attendu : `ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad`** ; **MD5 : `900150983cd24fb0d6963f7d28e17f72`** > **Copy** d'une empreinte > colle dans Notes ; puis un fichier (`safari-tree.zip`) > **Download checksums.txt**.
- **Attendu :** empreintes exactes, collage correct, `checksums.txt` s'ouvre.
- ☐ RÉUSSI ☐ ÉCHOUÉ ☐ BLOQUÉ

#### 15. MP4 to GIF / MOV to GIF **[S5]** *(sur le service depuis le 23/09)*
`/tools/gif-tools/mp4-to-gif` puis `/tools/gif-tools/mov-to-gif`
- **Risque :** `ENVOI` `TÉLÉCH`. Défaut du 19/09 : les `.mov` d'iPhone étaient refusés au choix du fichier.
- **Geste :** la **VIDÉO** (`.MOV`) dans **MP4 to GIF** > options par défaut > convertis > télécharge. Refais dans **MOV to GIF**.
- **Attendu :** la vidéo est **sélectionnable** (pas grisée) ; un GIF **animé, aux bonnes proportions** (une vidéo verticale reste verticale), qui s'ouvre.
- ☐ RÉUSSI ☐ ÉCHOUÉ ☐ BLOQUÉ

---

### ▶ SÉANCE B/D — LES 14 SUIVANTS

#### 16. GIF Maker *(26/09 : ajuster/rogner/étirer, ordre, boucles)*
`/tools/gif-tools/gif-maker` — `MÉM` `TÉLÉCH`
- **Geste :** 3 photos (sélection multiple) > mode **Fit (keep proportions, add background)** > **Download GIF**.
- **Attendu :** un `.gif` animé de 3 images, **non déformées**, qui s'ouvre et s'anime.
- ☐ RÉUSSI ☐ ÉCHOUÉ ☐ BLOQUÉ

#### 17. Word to PDF *(envoi par morceaux au-delà de 4 Mio depuis le 21/09)*
`/tools/pdf-tools/word-to-pdf` — `ENVOI` `TÉLÉCH` — ⚠️ appel payant (ConvertAPI, 0,01 $), une seule fois
- **Geste :** `fidelite-01.docx` > convertis > télécharge.
- **Attendu :** un PDF qui s'ouvre, tableau lisible. *(Le petit fichier passe par le chemin direct ; le chemin par morceaux, pour > 4 Mio, n'est pas couvert ici.)*
- ☐ RÉUSSI ☐ ÉCHOUÉ ☐ BLOQUÉ

#### 18. Split PDF *(23/09 : chaque page, toutes les N pages, ZIP)*
`/tools/pdf-tools/pdf-split` — `Worker` `TÉLÉCH`
- **Geste :** `safari-30pages.pdf` > mode **toutes les 10 pages** > télécharge le **ZIP**.
- **Attendu :** un ZIP de 3 PDF de 10 pages, qui se décompresse ; les PDF s'ouvrent.
- ☐ RÉUSSI ☐ ÉCHOUÉ ☐ BLOQUÉ

#### 19. Compress PDF *(23/09 : sur le service pdf-tools, 3 niveaux)*
`/tools/pdf-tools/pdf-compress` — `ENVOI` `TÉLÉCH`
- **Geste :** `safari-30pages.pdf` > niveau recommandé > télécharge.
- **Attendu :** un PDF de **30 pages** qui s'ouvre (un fichier minuscule peut ne pas rétrécir : pas un échec).
- ☐ RÉUSSI ☐ ÉCHOUÉ ☐ BLOQUÉ

#### 20. QR Generator *(24/09 : 8 types, 2000 px, logo, PDF)*
`/tools/qr-barcodes-tools/qr-generator` — `TÉLÉCH`
- **Geste :** texte `SAFARI-QR-OK-2026` > **PNG**, **SVG**, **PDF** ; puis type **Wi-Fi** (réseau `Test`, mot de passe `12345678`) > PNG.
- **Attendu :** chaque fichier s'ouvre (le SVG **en image**, pas en texte) ; l'appareil photo de l'iPhone lit le QR Wi-Fi et propose de rejoindre « Test ».
- ☐ RÉUSSI ☐ ÉCHOUÉ ☐ BLOQUÉ

#### 21. Grammar Fixer *(26/09 : corrections montrées mot à mot)* — ⚠️ appel payant, une seule fois
`/tools/ai-tools/grammar-fixer` — `PRESSE`
- **Geste :** colle `i has went to the store yesterday and buyed two apple` > corrige > touche **une** correction surlignée pour la défaire, puis la rétablir > **Undo all** puis **Keep all** > **Copy** > colle dans Notes.
- **Attendu :** chaque correction se défait/rétablit d'un toucher ; le texte collé = la phrase corrigée.
- ☐ RÉUSSI ☐ ÉCHOUÉ ☐ BLOQUÉ

#### 22. Unit Converter *(26/09 : temps, données, pression, énergie, puissance)*
`/tools/converter-tools/unit-converter`
- **Geste :** Données : 1 GB → MB ; Pression : 1 atm → kPa ; saisis `abc`.
- **Attendu :** **1000** MB ; **101,325** kPa ; `abc` refusé avec un message.
- ☐ RÉUSSI ☐ ÉCHOUÉ ☐ BLOQUÉ

#### 23. Color Converter *(26/09 : HSV, CMYK)*
`/tools/converter-tools/color-converter` — `PRESSE`
- **Geste :** saisis `#FF8000` > lis HSV et CMYK > **Copy** une valeur > colle dans Notes ; saisis `#GG0000`.
- **Attendu :** HSV ≈ 30°, 100 %, 100 % ; CMYK 0 %, 50 %, 100 %, 0 % ; collage exact ; `#GG0000` signalé invalide.
- ☐ RÉUSSI ☐ ÉCHOUÉ ☐ BLOQUÉ

#### 24. Image Resizer *(23/09 : verrou de proportions, %, format conservé)*
`/tools/image-tools/image-resizer` — `MÉM` `TÉLÉCH`
- **Geste :** la **PHOTO** > largeur 1000 px, verrou de proportions actif > télécharge.
- **Attendu :** image de 1000 px de large, **non déformée**, **au format d'origine** (JPEG pour une photo).
- ☐ RÉUSSI ☐ ÉCHOUÉ ☐ BLOQUÉ

#### 25. Background Remover — ⚠️ appel payant (~0,003 $), une seule fois par sous-cas
`/tools/ai-tools/background-remover` — `ENVOI` `MÉM` `TÉLÉCH`
- **Geste :** (a) la **PHOTO** 12 Mpx avec un sujet net > **Remove Background** > **Download PNG** ; (b) la **PHOTO 48 Mpx** si disponible.
- **Attendu :** sujet détouré sur fond **transparent**, PNG en **pleine résolution** qui s'ouvre (damier, pas de noir).
- ☐ RÉUSSI ☐ ÉCHOUÉ ☐ BLOQUÉ *(12 / 48 Mpx)*

#### 26. Tar Extractor *(22/09 : en-têtes PAX)*
`/tools/file-tools/tar-extractor` — `TÉLÉCH`
- **Fichier :** crée-le sur le MacBook : Terminal > `cd ~/Desktop && mkdir t && echo bonjour > t/a.txt && tar -czf t.tar.gz t` (le `tar` de macOS écrit des en-têtes étendus). **MacBook seulement.**
- **Attendu :** la liste montre `t/a.txt` (et **aucun** fichier parasite `PaxHeader`) ; `a.txt` se télécharge et contient `bonjour`.
- ☐ RÉUSSI ☐ ÉCHOUÉ ☐ BLOQUÉ

#### 27. Merge PDF *(inchangé, outil vedette)*
`/tools/pdf-tools/pdf-merge` — `Worker` `TÉLÉCH`
- **Geste :** `safari-A-3pages.pdf` + `safari-B-3pages.pdf` > **Merge PDFs** > télécharge.
- **Attendu :** un PDF de 6 pages : A pages 1-3 puis B pages 1-3.
- ☐ RÉUSSI ☐ ÉCHOUÉ ☐ BLOQUÉ

#### 28. Outils de texte *(23/09 : emoji, phrases)* — Word Counter, Case Converter, Text Reverser
`/tools/text-tools/word-counter`, `case-converter`, `text-reverser`
- **Texte :** `Hello 👋🏽 world. This is a test! Is it?`
- **Attendu :** Word Counter : **3 phrases** ; Case Converter « Sentence case » : `Hello 👋🏽 world. This is a test! Is it?` ; Text Reverser : l'emoji **reste entier** (pas de carré ni de « ? »).
- ☐ RÉUSSI ☐ ÉCHOUÉ ☐ BLOQUÉ

#### 29. Currency Converter *(23/09 : 166 devises)*
`/tools/converter-tools/currency-converter`
- **Geste :** 100 CAD → **MAD** (dirham marocain, absent de l'ancienne liste) ; lis la date des taux.
- **Attendu :** un montant plausible ; la date affichée est **celle des taux** (pas l'heure de ton appareil).
- ☐ RÉUSSI ☐ ÉCHOUÉ ☐ BLOQUÉ

---

## 2. SECTION iPHONE (Safari iOS) — CE QUI CHANGE

1. **Téléchargement du fichier produit** — cause n° 1 d'échec sur iPhone. Vérifie **à chaque outil** avec la règle du §0.
2. **Mémoire** — Safari iOS **tue l'onglet** sans préavis. Symptôme : **la page se recharge toute seule** ou « Un problème est survenu sur cette page web ». **C'est un ÉCHOUÉ**, même si « ça remarche ensuite ». Les plus exposés : n° 1, 4, 6, 7, 10, 12, 13, 25.
3. **Après chaque outil lourd (1, 4, 6, 7, 10, 12, 13) : ferme l'onglet** avant le suivant.
4. **Sélecteur de fichiers** — note si un fichier est **grisé** (n° 15 surtout, et n° 1 pour `.rar`/`.7z`).
5. **Autorisations** — micro (n° 5), caméra (n° 9) : si la fenêtre n'apparaît pas, note-le.
6. **Écran verrouillé pendant un envoi** (n° 2, 3, 6c, 7, 11) : ne le fais pas exprès ; si ça arrive, note si l'envoi reprend ou échoue avec un message.

## 3. SECTION MacBook (Safari macOS) — CE QUI CHANGE

1. Les plantages mémoire sont improbables ; attends-toi à des défauts **de compatibilité** (API absentes).
2. **Téléchargements multiples** (n° 1e, 8c, 13, 18) : Safari peut demander **« Autoriser plusieurs téléchargements ? »** — note la demande et ce qui se passe si tu refuses.
3. **Glisser-déposer** : n° 6d (liste d'Audio Merger) et n° 9d (image sur le QR Scanner).
4. **Presse-papiers** (n° 9, 14, 21, 23) : colle dans Notes pour vérifier.
5. **La console — utile ici seulement :** Safari > Réglages > **Avancées** > « Afficher les fonctionnalités pour les développeurs ». Après un échec : **Développement > Afficher la console JavaScript** (⌥⌘C) et **copie le message rouge**.

---

## 4. ORDRE ET DURÉE — RÉSUMÉ

| Étape | Quoi | Durée |
|---|---|---|
| 0 | Préparation, fichiers, versions | 15 min |
| **A** | **iPhone, outils 1 → 15** | **≈ 75 min** |
| **C** | **MacBook, outils 1 → 15** | **≈ 40 min** |
| B | iPhone, outils 16 → 29 | ≈ 50 min |
| D | MacBook, outils 16 → 29 | ≈ 25 min |
| | **Total** | **≈ 3 h 25** |

**Estimations, pas mesures.** Les moments longs : premier chargement de ffmpeg.wasm (n° 4, 6, 7, 12) et de 7-Zip (n° 1), réveil des services (n° 2, 3, 11, 15, 25 : quelques secondes). **Si un outil bloque plus de 5 minutes : note ÉCHOUÉ ou BLOQUÉ, passe au suivant.**

---

## 5. COMMENT RAPPORTER

Dans **Notes**, **une ligne par outil**, tout de suite : `N° | R / É / B | ce que j'ai vu en une phrase` (ex. `6c | R | .opus téléchargé, "no preview" affiché`).

**Pour chaque ÉCHOUÉ ou BLOQUÉ :** l'outil et le sous-cas ; l'appareil et sa version ; le fichier et le geste ; une **capture d'écran** au moment de l'échec ; le **message exact** ; le comportement (*rien ne se passe* · *chargement infini* · *message d'erreur* · *page rechargée* · *fichier illisible* · *fichier absent*) ; **reproductible ?** (refais une seule fois) ; **sur MacBook : le message de la console**.

**À la fin :** colle les notes dans la conversation avec les captures. Je reporte les verdicts dans `plan-de-travail.md` (bloquant 9) ; chaque ÉCHOUÉ devient un défaut chiffré, et aucun n'est marqué « CLOS » sans ton retest sur le vrai Safari.

---

## 6. OPÉRATIONS PAYANTES (règle permanente n° 8)

**Quatre tests déclenchent un coût en production :** n° 17 Word to PDF (ConvertAPI, 0,01 $), n° 21 Grammar Fixer (OpenAI, une fraction de centime), n° 25 Background Remover (~0,003 $ l'image), et les **conversions sur notre service** (n° 2, 3, 6c, 7, 11, 15, 19 : coût Railway ≈ 0,001 $ chacune). **Total estimé : moins de 0,05 $.** Décision du 19/09 : **production, une fois chacun.**

⚠️ **Limite de 20 conversions par heure et par connexion** sur notre service média (n° 2, 3, 6c, 7 — Splitter compte un billet par partie en Opus —, 11, 15) : la séance A en consomme ≈ 12 à 14. **Ne relance pas ces tests en boucle.** Si la page dit que la limite est atteinte, note-le (message attendu, pas un défaut) et reprends ces outils une heure plus tard.

---

## 7. VERDICTS (à remplir puis reporter dans le plan)

| # | Outil | iPhone | MacBook | Note |
|---|---|---|---|---|
| 1 | Zip Extractor (a-e) | | | |
| 2 | Video Compressor [S1] | | | |
| 3 | Video Converter [S1] | | | |
| 4 | Video Trimmer [S1] | | | |
| 5 | Voice Recorder [S2] | | | |
| 6 | Audio Merger (a-d) | | | |
| 7 | Audio Opus ×4 + MP3 | | | |
| 8 | Barcode Generator (a-d) | | | |
| 9 | QR Scanner (a-d) | | | |
| 10 | Image Converter [S3] | | | |
| 11 | Image Upscaler [S4] | | | |
| 12 | Audio Trimmer | | | |
| 13 | Image Compressor | | | |
| 14 | Hash Generator | | | |
| 15 | MP4/MOV to GIF [S5] | | | |
| 16 | GIF Maker | | | |
| 17 | Word to PDF | | | |
| 18 | Split PDF | | | |
| 19 | Compress PDF | | | |
| 20 | QR Generator | | | |
| 21 | Grammar Fixer | | | |
| 22 | Unit Converter | | | |
| 23 | Color Converter | | | |
| 24 | Image Resizer | | | |
| 25 | Background Remover | | | |
| 26 | Tar Extractor | — | | |
| 27 | Merge PDF | | | |
| 28 | Outils de texte | | | |
| 29 | Currency Converter | | | |

*Légende : R = RÉUSSI · É = ÉCHOUÉ · B = BLOQUÉ.*

**Ce que cette feuille ne prouve pas, même 29/29 :** les ≈ 190 autres outils, les gros fichiers (plafonds mobiles non éprouvés ici), le chemin Office par morceaux (> 4 Mio), et les versions de Safari autres que la tienne. **Retirés de la feuille du 19/09 :** Zip Creator et Video to GIF (inchangés depuis, ou couverts par les n° 1 et 15).
