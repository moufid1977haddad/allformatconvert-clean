# RAPPORT — Audio Merger : choix du format de sortie et jonction exacte

**Date :** 26 septembre 2026 · **Branche :** `licence-ameliorations` · **Production avant :** `master` = `a2b23853` · **Production après :** fusion `d4f4b12c`, déploiement `onlineconvertools-pk059pvel` · **Vérifié sur www, Chromium et Firefox.**

## 0. En une table

| Point | Verdict |
|---|---|
| Recherche (4 concurrents mesurés sur de vrais fichiers) | le meilleur, **Clideo** : 16 formats annoncés, **14 livrés** (APE et MID jamais livrés en 240 s), défaut = format d'entrée s'il est unique, **tout mélange → MP3, même FLAC+WAV** ; aucun réglage de qualité |
| Outil en production avant modification | **faux dans 5 cas sur 7** : FLAC lu **5 s sur 12** dans les deux navigateurs ; silences de **18 à 40 ms** aux jonctions MP3, **26-30 ms** AAC ; Opus **faussé** 50 ms après chaque jonction ; Vorbis +28 ms ; M4A ressorti en `.aac` brut |
| Corrigé | chaque fichier décodé seul, échantillons joints, **un seul encodage** : **0 ms de décalage et aucun silence ajouté aux jonctions**, 9/9 cas × 2 navigateurs sur www |
| Format de sortie | **14 formats** (6 sans perte, 8 compressés), **débit au choix**, défaut qui ne dégrade jamais des entrées sans perte |
| Opus | **libopus sur le service** (FLAC sans perte envoyé, 1 travail) — encodeur lu dans le fichier : `libopus` |
| Tests | plan 13/13 · commandes natives 7/7 · navigateur local, préversion et **www** : jonctions 9/9 Chromium + 9/9 Firefox, suite des formats complète dans les deux |

## 1. Recherche — faits mesurés

Méthode : vraies pages pilotées par Playwright, deux FLAC 16 bits 44,1 kHz (5 s + 3 s) et des mélanges, fichiers téléchargés puis décodés par ffmpeg n8.1.2 (même version que notre service, build Windows BtbN, SHA-256 `273abb45…`). Sondes : `scripts/browser-tests/audio-merger-references/`.

| | 123apps Audio Joiner | **Clideo** | onlineconverter.com | audio-join.com |
|---|---|---|---|---|
| Formats | mp3, m4a, wav, flac | AAC, AC3, AIFF, APE*, CAF, FLAC, M4A, MID*, MP3, OGG, OPUS, SPX, WAV, W64, WMA, M4R (*jamais livrés) | MP3 seul | MP3, WAV, M4A, OGG, OPUS, FLAC, AAC, WebM |
| Défaut | **mp3 toujours** (même 2 FLAC) | format d'entrée si tous identiques ; sinon **MP3** (FLAC+WAV compris) | MP3 | **MP3 192 k** (même 2 FLAC) |
| Qualité réglable | non | non | non | MP3 seulement (96-320) |
| Débits constatés | MP3 320 k ; AAC ≈ 220 k | MP3 320 k ; Opus **libopus** ≈ 64 k ; AAC brut ≈ 260 k ; AC3 192 k ; WMA 128 k ; Vorbis ≈ 80 k ; M4R ≈ 70 k ; SPX = Speex 32 kHz | MP3 320 k | — |
| Exactitude | **fondu de 1,5 s activé par défaut** (8 s → 6,5 s) ; FLAC exact hors fondu | FLAC exact à l'échantillon ; 8,000 s ; fin : M4R/AC3 +10,9 ms, AAC brut +34 ms, **WMA −12,3 ms (audio perdu)** | 8,000 s | « .opus » = **conteneur WebM**, 7,98 s |
| Divers | appose sa marque (pochette, « Mix by audio-joiner.com ») | fondu en option | 4 fichiers, 200 Mo, transitions | |

Media.io : non mesuré (fenêtre publicitaire qui empêche la prise du fichier).

## 2. L'outil en production avant modification (www, `audio-merger-join.mjs`)

Trois fichiers (5 + 3 + 4 s, bruit rose + sinus, jamais silencieux) par codec. Chaque entrée décodée **seule** sert de référence (ce qu'on entend en les écoutant l'une après l'autre), puis est localisée dans le résultat par corrélation. Mêmes résultats sous Chromium et Firefox :

| Copie « sans réencodage » | Mesure |
|---|---|
| **FLAC** | données justes, mais STREAMINFO = durée du **1ᵉʳ** fichier : `<audio>` annonce 5 s et **s'arrête à 5 s** (sur 12) |
| **MP3** | +71,8 ms ; silences de **40,5 et 18,1 ms** (délai/remplissage de l'encodeur joués) |
| **AAC .m4a** | sort en `.aac` brut ; +69,7 ms ; silences de 26,5 et 30,0 ms |
| **Opus** | +40 ms ; décalage de 20 ms et 50 ms faussées (SNR 11-12 dB) à chaque jonction |
| **Vorbis** | +28,3 ms ; silence de 10,5 ms |
| WAV ; mélanges → MP3 | exacts ; mais MP3 à 128 k, et FLAC+WAV dégradé en MP3 |

**Ogg chaîné écarté par la mesure** (fichiers bout à bout, permis par la RFC 7845) : aucune durée dans `<audio>` (Infinity) dans les deux navigateurs, 12,013/12,016 s lus par Chromium. **Aucune copie ne joint exactement un codec avec perte** : délai d'encodeur, pré-saut Opus et remplissage de fin sont propres à chaque fichier.

## 3. Ce qui a été construit

- **Moyen** : ffmpeg.wasm décode chaque fichier seul (ses en-têtes retirent délai, pré-saut, remplissage), `concat` joint les échantillons, **un seul encodage**. Sans perte : profondeur gardée (16/24 bits, flottant en WAV), mono **dupliqué à plein niveau** (le mixage par défaut de ffmpeg le baisse de 3 dB), fréquence la plus haute gardée ; rééchantillonnage seulement si les fréquences diffèrent, et dit. Planificateur pur : `app/lib/audioMerge.js`.
- **14 formats** : FLAC, WAV, AIFF, ALAC, CAF, W64 · MP3, M4A, AAC brut, M4R, OGG Vorbis, Opus, WMA, AC3. Débits : MP3/AAC/Vorbis 64-320 (défaut 320 MP3, 256 AAC/Vorbis), Opus 64-256 (défaut 192), AC3 192-640 (défaut 448), WMA aux **débits réels** de son encodeur (275/183/137/110/69 kbit/s : demandé 192, il écrit 275 — mesuré sur 60 s).
- **Défaut** : toutes les entrées sans perte → sans perte (même format si unique, sinon FLAC ; WAV pour 32 bits/flottant) ; même format compressé → ce format (AAC brut → M4A, même codec, durée exacte) ; sinon MP3 320. **Plus sûr que Clideo** (FLAC+WAV y devient MP3).
- **Dit avant la fusion** (sous le choix) : sans perte exact ; perte si l'on choisit un compressé pour des entrées sans perte ; rééchantillonnage ; arrondi à 24 bits (FLAC/ALAC) ; mixage des canaux ; limite de l'AAC brut ; M4R > 40 s ; Opus envoyé à notre serveur puis supprimé.
- Lecteur : pour un format que le navigateur ne lit pas (Chromium : WMA, AC3, ALAC, AIFF, CAF, W64), message clair au lieu d'un lecteur en erreur. Progression réelle, annulation (ffmpeg et envoi au service), taille et durée du résultat.
- **Trouvés en route et corrigés** : Firefox enregistrait « .m4r » en « .m4a » ; l'encodeur WMA de ffmpeg **perd le dernier bloc incomplet** (−31 ms sur 5 s ; Clideo −12 ms) → fin complétée de silence, rien n'est perdu ; **la politique de confidentialité et la FAQ de la catégorie audio ne mentionnaient pas l'Opus sur serveur de Booster, Splitter et Compressor** (en production depuis le 26/09) — corrigées, Merger ajouté, date de la politique mise à jour.

## 4. Vérifications

| Où | Résultat |
|---|---|
| `scripts/audio-merge-tests/01-plan.mjs` | 13/13 |
| `02-commands-native.mjs` (ffmpeg natif) | 7/7 : 6 formats sans perte exacts à l'échantillon (16 et 24 bits), flottant exact, mono exact, 14 formats × tous les débits proposés |
| Local (build de test), `audio-merger-formats.mjs` | Chromium et Firefox : défauts pour 9 mélanges, 13 formats (sans perte exacts à l'échantillon **dans ffmpeg.wasm**), Opus câblé (service simulé : FLAC exact envoyé, `kbps` 128), 24 bits/flottant/mono exacts, MP3 128 k, annulation puis fusion de 20 min exacte |
| Local, `audio-merger-join.mjs --format=…` (11 formats de sortie) | 0 ms de décalage, aucun silence aux jonctions, dans les deux navigateurs |
| **Préversion** `7mavbi2vp` | jonctions **9/9 Chromium, 9/9 Firefox** (Opus par le vrai service, relais CORS de test) ; suite des formats complète dans les deux |
| **www** (`d4f4b12c`, chemin entièrement réel) | jonctions **9/9 Chromium, 9/9 Firefox** — Opus : 1 travail, encodeur `libopus`, 12,000 s, lu jusqu'au bout ; suite des formats complète dans les deux |

## 5. Limites, dites telles quelles

- **Formats compressés : fin allongée d'un bloc au plus** (silence de l'encodeur, rien de perdu) : M4A/M4R/AC3 +4,7 à +16 ms, AAC brut +28 à +39 ms — mêmes limites chez Clideo (+10,9 / +34 ms). Les **jonctions**, elles, sont exactes.
- **AAC brut (.aac)** : ne stocke ni sa durée ni son délai de départ ; Firefox affiche 13,7 s pour 12,03 s. Dit sur la page, jamais choisi par défaut.
- **Formats compressés depuis des compressés** : un encodage de plus (inévitable pour des jonctions exactes, mesuré ci-dessus) ; FLAC/WAV proposés pour n'ajouter aucune perte.
- **Non fait, hors de la demande, mais présent chez les concurrents : réordonner les fichiers et le fondu enchaîné** (123apps, Clideo, onlineconverter). Les fichiers sont joints dans l'ordre de sélection, dit sur la page.
- SPX non proposé : ni ffmpeg.wasm ni le build du service n'ont d'encodeur Speex, et Xiph déclare Speex rendu obsolète par Opus. APE/MID : Clideo les annonce sans les livrer ; ffmpeg n'a pas d'encodeur APE.
- Safari non testé (bloquant 9).
- Coût : 1 billet du service par fusion Opus seulement (limite de 20/heure/connexion inchangée) ; tout le reste dans le navigateur.

## 6. Hygiène

Aucun fichier d'environnement lu, modifié ni copié : accès à la préversion par un dossier temporaire ne contenant que `.vercel/project.json`, jeton récupéré en mémoire par `vercel env run` et ajouté côté serveur par `vercel-preview-proxy.mjs` — **dossier supprimé**, processus du relais arrêtés. Aucune surveillance ni boucle d'attente (une seule attente bloquante par build). Aucun push forcé. `.serena/` laissé tel quel.
