# RAPPORT — Opus d'Audio Booster, Audio Splitter et Audio Compressor sur libopus (service)

**Date :** 26 septembre 2026 · **Branche :** `licence-ameliorations` · **État :** **code prêt, non déployé ; l'ordre de mise en ligne demande l'accord du propriétaire** (le service doit passer avant le site, voir §4).

## 0. En une table

| Point | Verdict | Preuve |
|---|---|---|
| Décision de fond | déjà tranchée le 24/09 : Zimtohrli donne **libopus plus proche de la source 6 fois sur 6** que l'encodeur natif de ffmpeg (le seul qui tourne dans ffmpeg.wasm) | plan, `opus-zimtohrli.py` |
| Moyen (celui d'Audio Converter et des convertisseurs de référence) | ✅ l'outil fait son traitement dans le navigateur (gain, coupe, décodage) et rend un **FLAC sans perte** ; le **service l'encode avec libopus** | §1 |
| Audio Compressor : débit choisi (64-320 kbit/s) | ✅ nouveau paramètre **`kbps`** du service, **additif** (absent = comportement d'avant), Opus seulement, 6-510 | §2 |
| Défaut trouvé en route | ❌→✅ **Firefox enregistrait « x.opus » sous « x.ogg »** (le service envoie `audio/ogg`) — touchait aussi **Audio Converter, déjà en production** ; corrigé | §3 |
| Tests | ✅ câblage : **8/8 Chromium, 8/8 Firefox** ; service : test unitaire **12/12** ici ; test de bout en bout ajouté à `run_tests.py`, **non exécuté ici (pas de ffmpeg sur ce poste)** | §5 |

## 1. Ce qui change dans les pages

`app/lib/opusService.js` (nouveau), repris par les trois pages quand le format choisi est Opus et que le service est configuré :
- **Audio Booster** : gain appliqué dans ffmpeg.wasm → FLAC → libopus (128 kbit/s, comme Audio Converter) ;
- **Audio Splitter** : chaque partie coupée dans ffmpeg.wasm → FLAC → libopus, deux travaux ;
- **Audio Compressor** : décodé en FLAC → libopus **au débit choisi**.
Les autres formats restent entièrement dans le navigateur (vérifié : MP3 du Booster, aucun envoi). Sans service configuré, l'encodeur natif reste utilisé (comme Audio Converter). Les textes « rien n'est envoyé » des trois pages disent maintenant l'exception Opus (serveur à nous, fichier supprimé après téléchargement).

## 2. Le service (`services/media-processing/app/ffmpeg_ops.py`)

`params.kbps` (entier 6-510) remplace le débit du niveau de qualité pour la cible `opus` ; refusé (« Unsupported bitrate ») sur toute autre cible, en chaîne, booléen, décimal ou hors bornes. Absent : exactement la commande d'avant.

## 3. Firefox et l'extension .opus

Mesuré avec le banc : les trois pages proposaient bien « boosted_x.opus », mais Firefox enregistrait **« boosted_x.ogg »** : il corrige l'extension d'après le type du Blob, et le service répond `audio/ogg`. Même code dans **Audio Converter** (en production depuis le 23/09). Correctif : Blob re-typé `audio/opus` (le type de notre Opus navigateur) — dans le module commun et dans Audio Converter. Vérifié sous Firefox sur les quatre pages.

## 4. ⚠️ Ordre de mise en ligne — accord du propriétaire requis

1. **D'abord le service** (Railway) avec `kbps` : l'ancien service **ignorerait** `kbps` et rendrait du 128 kbit/s quel que soit le choix, sans le dire. Selon la règle « changement de service additif sur master d'abord, vérifié, puis les appelants » : fusionner seulement `ffmpeg_ops.py` + ses tests, déployer, lancer `run_tests.py` sur le service.
2. **Ensuite le site** (les trois pages + le correctif Firefox d'Audio Converter).
Booster et Splitter n'ont pas besoin du changement de service (128 kbit/s par défaut) : ils peuvent partir avec le site ; seul le Compressor en dépend.

## 5. Tests

- `scripts/browser-tests/audio-opus-service.mjs` — vraies pages ; **le service est joué par le test** (routes interceptées), sur une build locale faite avec une URL de service **de test** passée en ligne de commande (`NEXT_PUBLIC_MEDIA_SERVICE_URL=https://media.test.invalid`, aucun fichier d'environnement) : le FLAC reçu est lu (en-tête STREAMINFO) — 4 s pour Booster et Compressor, **3 s et 1 s** pour les deux parties du Splitter —, paramètres exacts (`kbps: 64` pour le Compressor, absent ailleurs), le fichier rendu par « le service » est celui téléchargé, nommé `.opus`. **Chromium 8/8, Firefox 8/8.**
- `services/media-processing/tests/run_kbps_unit.py` — la commande ffmpeg construite, sans ffmpeg : **12/12**.
- `services/media-processing/tests/run_tests.py` — ajout : Opus à 64 et 256 kbit/s réellement encodé, débit mesuré à ±30 %, `kbps` refusé sur MP3. **Non exécuté ici** (ffmpeg absent de ce poste) : à lancer sur le service avant de le mettre en ligne.

## 6. Non fait

- Audio Merger propose aussi Opus (encodeur natif) : hors des trois outils demandés, non touché.
- La qualité libopus elle-même n'est pas re-mesurée ici (tranchée le 24/09).
