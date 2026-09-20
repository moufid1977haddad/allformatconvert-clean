# RAPPORT — Formats réellement produits par les navigateurs, classe « succès annoncé, fichier faux » (suite), video-trimmer sur ffmpeg.wasm

Date : 19 septembre 2026 · Branche `formats-navigateurs` (balise `restore-avant-formats-navigateurs`) · fait suite à `RAPPORT-safari-defauts.md`.

## 1. Production vérifiée (point 1)

Le déploiement `dpl_79TVbn4m…` du commit `9e46af54` est **READY**. Sur `www.onlineconvertools.com`, lu dans un vrai Chrome 153 : l'`accept` de `mp4-to-gif` est `video/*,.mp4,.m4v,.mov,.qt,…` (les `.mov` passent) et le texte « iPhone videos work » est servi. **Non vérifiable ici** : les messages « avant sélection du fichier » des trois outils vidéo ne s'affichent que sous Safari (pas de `captureStream` sur `<video>`) ; le code est en production, l'effet reste à voir sur le Safari du propriétaire.

## 2. AVIF et WebP — mesure réelle dans le navigateur (point 2)

Sonde exécutée dans les **vrais moteurs** (`scripts/browser-tests/probe-encoders.mjs`, 3 API : `canvas.toDataURL`, `canvas.toBlob`, `OffscreenCanvas.convertToBlob`), sur la page en production :

| Navigateur | Format demandé | Format réellement produit |
|---|---|---|
| Chrome 153 (réel) | WebP | **WebP** |
| Chrome 153 (réel) | AVIF | **PNG** |
| Chromium 151 (Playwright) | WebP / JPEG | WebP / JPEG |
| Chromium 151 (Playwright) | AVIF | **PNG** (3 API sur 3) |
| Firefox 153 (Playwright) | WebP / JPEG | **WebP / JPEG** (3 API sur 3) |
| Firefox 153 (Playwright) | AVIF | **PNG** (3 API sur 3) |
| Safari 17.6 (mesuré le 19/09, session précédente) | WebP | **PNG** |
| Safari | AVIF | **non mesuré** |

**Le soupçon est confirmé : l'option AVIF de `image-converter` a rendu du PNG déguisé en `.avif` à TOUS les visiteurs, sur tous les navigateurs mesurés, depuis toujours** — plus grave que le défaut Safari, qui ne touchait que le WebP. WebP sous Firefox : OK.

**Ce qui a changé** : la sonde livrée le 19/09 désactivait déjà l'option AVIF partout (vérifié en production : `webp png jpg avif(disabled)` sous Chrome ET Firefox, le worker refuse de toute façon un blob d'un autre type). Ce lot corrige **le texte, qui promettait encore l'AVIF en sortie** (H1, description, étapes, FAQ, `<meta>`), et le message d'avertissement, qui renvoyait à « Chrome, Edge ou Firefox » pour l'AVIF (faux : aucun n'en sait produire). Les textes disent maintenant « PNG, JPG ou WebP » et « AVIF accepté en entrée, non proposé en sortie, aucun navigateur mesuré ne l'encode ».

**Autres outils** : le balayage (`image/webp`, `image/avif` dans `app/`) ne trouve que `image-converter`, `jpg-to-webp` et `png-to-webp` comme sorties WebP/AVIF ; les deux derniers sont déjà gardés (`checkedDataURL` + désactivation). Aucun autre outil n'offre l'AVIF.

**Perte fonctionnelle à décider** : `image-converter` ne produit plus d'AVIF (il n'en a jamais produit). Produire du vrai AVIF exigerait un encodeur wasm dédié — non chiffré ici, à ne pas décider sans vous. Aucun outil supprimé ni renommé.

## 3. Reste de la classe « succès annoncé, fichier faux » (point 3)

| Outil | Défaut | Correctif |
|---|---|---|
| `mp4/mov/avi/webm/video-to-gif` (5) | `alert()` sur erreur ; GIF produit avec des images vides si le codec n'est pas décodé ; `seeked` sans délai de garde (`video-to-gif`) | `assertVideoReadable` (vidéo 0×0), `assertFrameNotBlank` (image transparente = jamais peinte), `gifBlobFromBytes` (signature `GIF8xa` vérifiée), message d'erreur dans la page, garde de 1,5 s sur `seeked` |
| `video-tools/video-to-gif` | aucun `try/catch` : une erreur laissait le bouton bloqué sur « Capturing… » | `try/catch`, garde vidéo, `checkedDataURL`, message honnête |
| `pdf-sign` | **signait avec un cadre vide** : un PDF « signé » portait un rectangle gris ; **et le tracé n'existait qu'à la souris** : impossible de signer sur iPhone | signature vide refusée (« Draw your signature first »), événements `pointer` + `touch-action: none` (doigt), sortie contrôlée `%PDF-` |
| `pdf-editor` | annonçait « Done » sans vérifier la sortie du worker ; miniatures non contrôlées | sortie refusée si < 100 octets ou sans `%PDF-`, `checkedDataURL` |
| `audio-waveform` | « Download PNG » possible avant tout chargement audio (image vierge) | refusé avec message, `checkedDataURL` |
| QR / codes-barres | `toDataURL()` non contrôlé | `checkedDataURL` |

Hors périmètre, inchangés : `gif-compressor`, `gif-maker`, `gif-to-apng`, `apng-to-gif`, `image-to-gif`, `gif-to-mp4` (autres moteurs, non revus).

## 4. video-trimmer sur ffmpeg.wasm (point 4) — la mesure CONFIRME le chiffrage

Implémentation : copie de flux (`-c copy`), aucun ré-encodage, même moteur qu'`audio-trimmer`. Sortie dans le conteneur d'origine (`.mp4`→`.mp4`, `.mov`→`.mov`), type MIME dérivé de l'extension réelle, sortie non vide exigée, annulation, plafond déclaré avant la sélection (300 Mo ordinateur / 100 Mo mobile), durée réelle du résultat affichée.

**Mesures réelles** (`scripts/browser-tests/measure-video-trimmer.mjs`, build de production local servi par `next start`, vrais fichiers) :

| Fichier | Coupe demandée | Chromium 151 : total (dont coupe) | Firefox 153 : total (dont coupe) | Durée réelle du résultat |
|---|---|---|---|---|
| `s30.mp4`, 30,5 s, 20,7 Mo | 0-30 s | 3,4 s (0,3 s) — moteur à froid | 4,2 s (0,8 s) — moteur à froid | 30,2 s |
| `s30.mp4` | 10-20 s | 3,0 s (0,2 s) | 1,7 s (0,9 s) | **11,9 s** (demandé 10) |
| `clip.mov`, **126 s**, 13,8 Mo | 0-120 s | 3,0 s (0,2 s) | 1,2 s (0,4 s) | 120,3 s |
| `surf.mp4`, 183 s, 68 Mo | 30-150 s | 3,6 s (0,8 s) | 1,7 s (0,8 s) | **123,1 s** (demandé 120) |

- **Temps réel** : la coupe elle-même prend **0,2 à 0,9 s** quelle que soit la durée (30 s ou 2 min), le reste est le chargement du moteur (~1 à 3 s ici, réseau rapide, machine de bureau). Ancien moteur : 1× le temps réel (2 min de vidéo = 2 min d'onglet actif). **Le chiffrage tient.**
- **Poids du moteur au premier chargement** : `ffmpeg-core.wasm` = **32,2 Mo décompressé, ~10,2 Mo sur le réseau (gzip)**, + 0,1 Mo de JS (mesuré sur unpkg, la source par défaut de `@ffmpeg/ffmpeg`). Mon chiffrage précédent disait « ~30 Mo » : c'était la taille décompressée ; **le vrai coût réseau est ~10 Mo**. Les textes de la page disent « environ 10 Mo ».
- **Le prix de l'absence de ré-encodage, mesuré** : la coupe s'aligne sur l'image-clé précédente. Une coupe de 10 s a produit 11,9 s, une coupe de 120 s en a produit 123,1 s (+2 à +3 s). La page l'affiche (« vous avez demandé 10 s ; les coupes s'alignent sur l'image-clé ») au lieu de le cacher. **Ce n'est pas une coupe à l'image près** : les concurrents qui ré-encodent le sont ; ici c'est le prix de la vitesse et de l'absence de perte.
- **Chemins d'échec** : un fichier texte renommé `.mp4` → message honnête, pas de curseurs, rien de produit ; un fichier de 305 Mo → refusé avant tout traitement avec la limite annoncée (Chromium et Firefox).
- **Non mesuré, à ne pas lire comme prouvé** : iPhone / Safari (moteur ffmpeg déjà validé sous Safari via `audio-trimmer`, mais le trimmer vidéo lui-même n'y a jamais tourné) ; le plafond mobile de 100 Mo est un choix prudent, pas une mesure ; les mesures ci-dessus viennent d'une machine de bureau et d'un réseau rapide ; conteneur WebM/MKV non testés en réel.

## 5. Build local (point 5)

`IP_RATE_LIMIT_PER_HOUR=30` et `IP_RATE_LIMIT_PER_DAY=100` ajoutées à `.env.local` (valeurs de production, nombres — aucun autre contenu du fichier affiché) et documentées dans `claude/REFERENCE-projet.md`. **`next build` passe désormais en local** (compilation, TypeScript, collecte des pages, 247 pages). Le garde-fou `requiredEnv` n'a pas été touché. Ce build a aussi révélé une vraie erreur de syntaxe de mon propre lot (guillemets échappés dans 5 pages GIF), corrigée avant commit — le build local sans variables l'avait masquée la veille.

## 6. Décision sur les trois outils vidéo (point 6)

- `video-trimmer` : **passé sur ffmpeg.wasm** (ce lot).
- `video-compressor` et `video-converter` : **restent en l'état, honnêtes** (message avant usage sous Safari, sortie vérifiée). Chiffrage inchangé : 14-20 h pour les deux, après le lancement, rattachés au **bloquant 6**.

## 7. Tests

31 tests Node (`scripts/media-support-tests/`), dont les nouveaux gardes vidéo/GIF ; mesures navigateur réelles ci-dessus ; `next build` complet OK. **Pas de test sur un vrai Safari.** Le retest Safari du propriétaire (bloquant 9) reste nécessaire.
