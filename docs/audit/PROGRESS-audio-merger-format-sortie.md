# PROGRESS — Audio Merger : format de sortie et jonction sans réencodage (26/09/2026)

## Étape 1 — Recherche (faits mesurés, vraies pages, vrais fichiers téléchargés et décodés par ffmpeg n8.1.2 BtbN)

Entrées : deux FLAC 16 bits 44,1 kHz (5 s + 3 s), et des mélanges. Sondes : `scripts/browser-tests/audio-merger-references/`.

| | 123apps Audio Joiner | Clideo | onlineconverter.com | audio-join.com |
|---|---|---|---|---|
| Formats | mp3, m4a, wav, flac (4) | 16 listés : AAC, AC3, AIFF, APE, CAF, FLAC, M4A, MID, MP3, OGG, OPUS, SPX, WAV, W64, WMA, M4R — **APE et MID jamais livrés** (240 s d'attente chacun) | MP3 seul | MP3, WAV, M4A, OGG, OPUS, FLAC, AAC, WebM (8) |
| Défaut | **mp3 toujours**, même 2 FLAC | **format d'entrée si tous identiques** (FLAC→FLAC, WAV→WAV, MP3→MP3) ; **tout mélange → MP3, même FLAC+WAV** | MP3 | **MP3 192 k**, même 2 FLAC |
| Réglage de qualité | aucun | aucun | aucun | MP3 seulement : 96/128/192/320 |
| Débits constatés | MP3 320 k CBR ; M4A AAC ≈ 220 k | MP3 320 k ; Opus **libopus** ≈ 64 k ; AAC ADTS ≈ 260 k ; AC3 192 k ; WMA 128 k ; OGG Vorbis ≈ 80 k ; M4R AAC ≈ 70 k ; SPX = Speex 32 kHz | MP3 320 k | « .opus » = **conteneur WebM** (pas un Ogg Opus), 7,98 s au lieu de 8 |
| Durée / exactitude | **6,5 s au lieu de 8 : fondu enchaîné activé par défaut (1,5 s)** ; FLAC identique à l'échantillon près hors fondu | 8,000 s ; FLAC identique à l'échantillon près | 8,000 s | 7,98 s |
| Divers | marque le fichier (pochette + « Mix by audio-joiner.com ») | fondu en option (décoché) | 4 fichiers max, 200 Mo, transitions en option | |

Media.io : non mesuré (fenêtre publicitaire qui ne se ferme pas, le fichier n'est jamais pris).

## Étape 2 — Outil actuel en production (www, avant toute modification) — `audio-merger-join.mjs`

Trois fichiers (5 s + 3 s + 4 s) par codec ; chaque entrée décodée seule sert de référence, puis localisée dans le résultat.
Chromium et Firefox donnent les mêmes fichiers et les mêmes défauts :

| Cas (copie sans réencodage) | Résultat |
|---|---|
| **FLAC** | données justes (12 s) mais **l'en-tête STREAMINFO garde la durée du 1er fichier (5 s)** : `<audio>` annonce 5 s et **s'arrête à 5 s dans les deux navigateurs** — le visiteur n'entend que le premier fichier |
| **MP3** | +71,8 ms ; **silences de 40,5 ms et 18,1 ms** aux jonctions (délai/remplissage de l'encodeur non retirés) |
| **AAC (.m4a)** | sort en **.aac brut** (conteneur changé) ; +69,7 ms ; **silences de 26,5 et 30,0 ms** |
| **AAC (.aac)** | silences de 26,5 et 30,0 ms (amorce de l'encodeur jouée) |
| **Opus** | +40 ms ; décalage de 20 ms et **50 premières ms faussées (SNR 11-12 dB)** à chaque jonction (pré-saut non appliqué) |
| **Vorbis** | +28,3 ms ; silence de 10,5 ms à la 2ᵉ jonction |
| WAV | exact |
| Mélanges (FLAC+WAV, FLAC+MP3) → MP3 réencodé | durée exacte, pas de silence — mais **MP3 au débit par défaut de ffmpeg.wasm (128 k)**, et FLAC+WAV (sans perte) **dégradé en MP3** |

**Le « Ogg chaîné » (fichiers mis bout à bout, permis par la RFC 7845) écarté par la mesure** : `<audio>` n'affiche aucune durée (Infinity) dans les deux navigateurs, Chromium lit 12,013 s (Opus) et 12,016 s (Vorbis) au lieu de 12,000.

**Conclusion : aucune copie ne joint exactement un codec avec perte.** Le moyen exact : décoder chaque fichier avec son propre découpage (délai, pré-saut, remplissage), joindre les échantillons, encoder une seule fois — à l'échantillon près pour les formats sans perte.

## Étape 3 — Construit et vérifié en local (commit `52f4da4e`)

- `app/lib/audioMerge.js` (planificateur pur) + page réécrite : 14 formats (6 sans perte : FLAC, WAV, AIFF, ALAC, CAF, W64 ; 8 compressés : MP3, M4A, AAC brut, M4R, OGG Vorbis, Opus, WMA, AC3), débit au choix pour les compressés, défaut calculé d'après les entrées, notes dites avant la fusion.
- Tests : `scripts/audio-merge-tests/01-plan.mjs` 13/13 ; `02-commands-native.mjs` 7/7 (ffmpeg natif n8.1.2) ; `audio-merger-formats.mjs` Chromium et Firefox tout passé ; `audio-merger-join.mjs` : 8 cas d'entrées + 11 formats de sortie × 2 navigateurs, **0 ms de décalage et aucun silence aux jonctions partout** ; seul écart : AAC brut (.aac) sous Firefox affiche 13,7 s pour 12,03 s — limite du format, dite sur la page, jamais proposé par défaut.
- Trouvé en route : Firefox enregistrait « .m4r » en « .m4a » (corrigé) ; l'encodeur WMA de ffmpeg perd le dernier bloc incomplet (−31 ms ; Clideo −12 ms) → fin complétée de silence ; ses débits réels (275/183/137/110/69) affichés tels quels ; politique de confidentialité et FAQ audio n'annonçaient pas l'Opus sur serveur de Booster/Splitter/Compressor (corrigé, + Merger).

## Étape 4a — Préversion `onlineconvertools-7mavbi2vp` (commit `52f4da4e`)

`audio-merger-join.mjs --cors-shim` (vrai service pour l'Opus) : **9/9 Chromium, 9/9 Firefox** — Opus par le vrai service (1 travail, encodeur `libopus`, 12,000 s, 0 ms, aucun silence) ; `audio-merger-formats.mjs --real-service` : tout passé dans les deux navigateurs.

## Étape 4b — Production `d4f4b12c` (`onlineconvertools-pk059pvel`), vérifiée sur www

Jonctions 9/9 Chromium + 9/9 Firefox (Opus : libopus, vrai chemin sans relais) ; suite des formats complète dans les deux. Rapport final : `RAPPORT-audio-merger-format-sortie.md`.
