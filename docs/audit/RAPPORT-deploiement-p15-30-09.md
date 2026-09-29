# RAPPORT — Déploiement P15 (`safari-iphone-30-09`), 30/09 — ARRÊTÉ au premier échec sur www

## En bref

| Étape | Résultat |
|---|---|
| 1 — défauts du Mac J, K, L | **corrigés**, prouvés sur Chromium, Firefox, WebKit (commits ci-dessous) |
| a — repères | `restauration-avant-p15-site` et `restauration-avant-p15-service` = `9139aacb` (poussés) ; service Railway avant P15 = déploiement **`83747da5-3eb4-4793-9081-00df2b53e4b7`** (commit `8123f0c0`) |
| b — service `media-processing` | `d914f612` sur master (sans poussée forcée) → Railway **`be919256` SUCCESS** ; prouvé en production (ci-dessous) ; **compatible avec l'ancien site** (prouvé par la vraie page de www) |
| c — préversion | `onlineconvertools-1ojnt55wy` (pointe `880aa422`) : **238 pages × 3 moteurs propres**, tous les bancs verts |
| c — fusion | `git merge --no-ff` → **`0b6cb6cf`**, poussée sans poussée forcée ; production `onlineconvertools-b64j6mp96` **Ready**, alias www |
| c — contrôles sur www | A, B, C, F, G, H, I, J **PASS** ; **E ÉCHOUE** (chemin iPhone simulé) → arrêt |
| e — retour arrière | **REFUSÉ par le garde-fou de permissions de Claude Code** (« Production Deploy ») : **non fait, à faire par le propriétaire** (commandes plus bas) |
| d — AI Detector sur www | **non fait** (arrêt au premier échec) — aucune dépense |

## Étape 1 — défauts de la passe Safari réelle du MacBook (30/09)

| # | Cause | Correctif | Preuve |
|---|---|---|---|
| J Tar Extractor, `t.tar.gz` non sélectionnable | Safari et les sélecteurs macOS/iOS ne comparent que la dernière extension (« gz ») | `accept=".tar,.tgz,.gz,.taz"` + types MIME ; un `.gz` qui n'est pas un TAR renvoie au ZIP Extractor ; **audit de tous les `accept` : seul cas du site** ; garde de build `scripts/check-accept-extensions.js` | `tar-extractor-accept.mjs` 5/5 × 3 moteurs (local, préversion, www) |
| K Rotator / Merger / Resizer | ancienne voie MediaRecorder (remplacée) ; préréglages 480p/720p/1080p en paysage ; **trouvé en vérifiant** : jonction de clips différents avec un trou à chaque raccord (8,019 s, « 60 i/s ») | côté court dans l'orientation de la vidéo (480p vertical = 480×854) ; service : image et son de chaque clip de jonction de même durée exacte | `video-tools-mp4.mjs` exige cadence, nombre d'images et durée exacts : 20/20 Chromium et Firefox (local), WebKit (orientation non vérifiable : ce WebKit ne lit aucune vidéo) ; 20/20 sur la préversion avec le vrai service ; `run_edit_tests` (l'ancien code échoue) |
| L Trimmer, 118 images au lieu de 120 | `-ss` avant `-i` décalé par le début du conteneur (son 0,046 s, image 0,067 s dans le morceau) → 1-2 images de retard, puis `-t` coupait la fin | `-copyts` + `trim`/`atrim` exacts, service ET navigateur | `trimmer-frame-exact.mjs` : 120 images, 4,000 s image et son, 1ʳᵉ image n° 30, 3 moteurs ; ancien service : 119 images, 1ʳᵉ image n° 32 |

Commits : `c095c8d6` (service), `aea1fefc` (Trimmer), `eeb2312e` (Resizer), `07896f01` (Tar), `bc28fffd` (plan), `880aa422`, `7e54ad4b`, `6c2db9ae` (bancs). Production : service `d914f612` (Railway `be919256`), site `0b6cb6cf` (Vercel `onlineconvertools-b64j6mp96`).

## Étape 2b — service en production (`media-service-p15-live.mjs`, 7 billets)

`/health` 200 · rotation 90 → 360×640, 90 images, 3,000 s · redimensionnement vertical 480p → 480×854 · jonction : image = son dans chaque clip, 150 images, 5,000 s sans trou · coupe précise 1→5 s : 120 images, 1ʳᵉ image n° 30 · conversion et compression telles que le site actuel les envoie : OK.
**Ancien site + nouveau service** : `trimmer-precise-real.mjs` sur www (Firefox) : 1ʳᵉ image n° 159, **10,000 s** (7 ms près avant).

## Étape 2c — préversion (relais local, jeton OIDC en mémoire)

238 pages Chromium/Firefox/WebKit : 238 propres chacun. Tar 5/5 ×3 · qualite-29-09 76/76/75 · pdf-audit-2 31 ×3 · misc-audit-2 17 ×3 · image-audit-2 13 ×3 · gif-audit-2 11 ×3 · text-to-pdf-unicode 5 ×3 · image-tools-big 21 ×3 · big-image 21 ×2 · bg-remover-bands 3 ×3 · image-resizer-big, image-editor-big 3 ×3 · image-compressor-big 1 ×2 · heic-tools 4/4/2 · tiff-tools-big 4 ×2 · pdf-images-big, qr-scanner-big-photo 1 ×3 · ios-download 3/3/2 · qr-paste-button 4/2/2 · barcode-svg-open 3 ×3 · transcript-exports 6 ×3 · av-audit-2 8/7 · voice-recorder-m4a 1 ×2 · vidéo (vrai service) 20/20 + coupe exacte 5/5.
Les échecs WebKit du premier passage venaient tous de la barre de commentaires que Vercel injecte sur les préversions (`navigator.storage.persisted`, connue depuis le 28/09) : rejoués avec `--no-vercel-toolbar`, tout passe.

## Étape 2c — contrôles sur www et l'ÉCHEC

| Défaut | Contrôle | Résultat |
|---|---|---|
| A | Image Converter, photo 24 Mpx → WebP, chemin par bandes | PASS |
| B | QR Scanner, bouton Paste image | PASS 4/4 |
| C | Background Remover 24 Mpx par bandes | PASS |
| **E** | **Brightness & Contrast, Image Blur — `image-tools-big.mjs --ios` (plafond de canvas iOS simulé, photo 24,5 Mpx)** | **FAIL** : « Could not load this image. The file may be corrupted or in a format your browser cannot open. » — le chemin **ordinateur** passe |
| F | pont de téléchargement iOS | PASS 3/3 |
| G | Barcode SVG | PASS 3/3 |
| H | 5 151 217 octets → « 5.2 MB » | PASS |
| I | phrase de l'Upscaler ; aperçu du Trimmer sur sa 1ʳᵉ image (UA iPhone) | PASS |
| J | Tar Extractor `t.tar.gz` | PASS 5/5 |
| 238 pages | lancé en parallèle ; le script a pris son moteur par défaut, **WebKit** (pas Chromium) | **238 propres** ; balayage Chromium non joué |
| D, K, L, AI Detector | — | non joués : arrêt au premier échec |

**Ce que l'échec E veut dire.** Le même échec se reproduit sur le build local de la branche et pour **tous** les outils image essayés sur ce chemin (Inverter, Sepia, Brightness, Blur) : ce n'est pas un défaut de déploiement, c'est le chemin « iPhone » simulé des outils image (`__forceSafariCanvasCap`, photo au-delà de 16,7 Mpx) qui n'aboutit pas. Le rapport du 30/09 donnait `image-tools-big` 21/21, **sans l'option `--ios`** : ce chemin n'avait donc pas été rejoué. Sur ordinateur (chemin normal), les 21 outils passent sur www. Sur iPhone, une photo de plus de 16,7 Mpx dans ces outils affichera probablement ce message au lieu de traiter ; **ce n'est pas une régression** (avant P15 ces photos échouaient aussi sur iPhone, par la limite de canvas), mais la correction annoncée pour E n'est pas prouvée. Cause exacte non recherchée : consigne d'arrêt.

**Retour arrière : refusé par le garde-fou.** J'ai tenté `vercel promote` du déploiement précédent (`onlineconvertools-epah4qvej`, site identique à `828cfe75`) : refusé par le classificateur de permissions de Claude Code (« Production Deploy »). Je n'ai pas contourné (pas de `git revert` poussé, pas de restauration Railway, qui visent le même résultat). **www sert donc P15 (`0b6cb6cf`) et le service sert `be919256`.**

## Pour le propriétaire — décider, puis agir

**Option 1 (recommandée par la mesure) — garder P15 en ligne.** Sur www tout ce qui a été contrôlé passe sauf E sur le chemin iPhone simulé, qui n'est pas pire qu'avant P15 ; le reste de P15 corrige de vrais défauts iPhone/Mac (A, B, C, D, F-L). Puis un chantier court sur le chemin iPhone des outils image.

**Option 2 — appliquer la règle e) à la lettre : retour au repère, site ET service.**
- Site : `vercel promote https://onlineconvertools-epah4qvej-moufid.vercel.app --yes` (instantané), puis pour que master corresponde : `git revert -m 1 0b6cb6cf` poussé normalement (**jamais** de poussée forcée).
- Service : restauration Railway du déploiement `83747da5-3eb4-4793-9081-00df2b53e4b7` (tableau de bord → media-processing → Deployments → « Rollback », ou mutation GraphQL `deploymentRollback(id:)`), puis `git revert d914f612` poussé.

## Tests à refaire

**(1) Banc Safari du MacBook** (`tests-safari-scripts` : `run.sh`) après la décision : J (Tar `t.tar.gz`), K (Rotator/Merger/Resizer : durée, images/s, 480p vertical = 480×854 par ffprobe), L (Trimmer coupe précise 1→5 s : 120 images), 9, 10, 25, 30, 36, 39, et Brightness/Blur avec une photo de 24 Mpx.
**(2) iPhone, par le propriétaire** : 9, 10, 25, 30, 36, 39 (téléchargement), photos de 24 et 48 Mpx dans Image Converter et Background Remover, **et Brightness & Contrast / Image Blur avec une photo de plus de 16,7 Mpx (défaut E)**.
