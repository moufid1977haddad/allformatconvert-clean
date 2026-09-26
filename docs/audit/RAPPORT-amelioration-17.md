# RAPPORT — Amélioration 17 : GIF Maker, QR Scanner, Audio Trimmer

**Date :** 26 septembre 2026 · **Branche :** `licence-ameliorations` · **État :** **prête pour la préversion** (local, build de production, Chromium + Firefox). Non déployée (consigne d'absence du propriétaire).

## 0. En une table

| Outil | Écart (plan) | Verdict | Preuve |
|---|---|---|---|
| gif-maker | étirait au lieu d'ajuster | ❌→✅ **ajuster** (fond au choix, par défaut), **rogner pour remplir**, étirer sur demande ; taille de sortie ; ordre des images ; nombre de répétitions. Face à **ezgif** sur les 3 mêmes images : ni l'un ni l'autre ne déforme ; ezgif prend la **plus grande taille sans rien rétrécir** → **adopté comme défaut** | §1 |
| qr-scanner | pas de caméra | ❌→✅ **caméra** (arrière par défaut, choix de caméra, arrêt dès la lecture, messages clairs) ; en route : **le dépôt annoncé (« drop ») ne marchait pas** → fait, plus le **collage** d'une capture | §2 |
| audio-trimmer | à la seconde, sans fondus | ❌→✅ **dixième de seconde** (saisi, glissé, ou pris sur le lecteur), **fondus** d'entrée et de sortie ; en route : la durée était arrondie à la seconde inférieure, et **une coupe WAV sans fondu tombait à ±37 ms** → coupe **à l'échantillon** pour WAV, AIFF, FLAC 16 bits, format d'origine gardé (24 bits reste 24 bits) | §3 |
| Suites | | ✅ `improvement-17.mjs` : **Chromium 20/20, Firefox 18/18** (+ 1 cas non testable sous Firefox, §4) | §4 |

## 1. GIF Maker

**Référence ezgif** (piloté avec Playwright, mêmes trois images 400×300, 300×400, 400×300 avec un cercle de 100 px de rayon) : GIF de **400×400**, chaque image à **sa taille d'origine**, placée en haut à gauche (« gravity: top-left »), cercle rond 200×200 ; ordre alphabétique des fichiers, retouchable ; délai par image, fondu enchaîné, plage à sauter.
**Chez nous, avant :** chaque image étirée à la taille de la première (le cercle de l'image portrait devenait un ovale de 266×150).
**Maintenant :** « Frames of another shape » = *Fit* (proportions gardées, bandes de la couleur choisie ; défaut), *Crop to fill*, *Stretch* ; taille = **la plus grande largeur et hauteur (défaut, comme ezgif : aucune image rétrécie)**, celle de la première image, ou libre (plafond 1920 px, celui d'ezgif) ; flèches ◀ ▶ pour l'ordre ; « Repeat » = toujours ou N fois (écrit dans l'extension NETSCAPE2.0).
**Mesuré dans le GIF produit (gifuct-js) :** défaut 400×400, cercle du portrait 200×200 ; *Fit* en 400×300 : cercle 150×150 rond, bandes jaunes ; *Stretch* : 266×150 ; *Crop* : 266×266 ; taille libre 200×120 ; ordre rouge, vert, bleu après déplacement ; boucle = 3.
**Non adopté :** délai par image et fondu enchaîné d'ezgif (non demandés par le plan).

## 2. QR Scanner

- **Caméra** : `getUserMedia` (arrière de préférence), lecture ~10 fois par seconde sur une image réduite à 800 px, arrêt et libération de la caméra dès qu'un code est lu ; choix de la caméra s'il y en a plusieurs ; messages : permission refusée, aucune caméra (dont `NotSupportedError`, mesuré sous Chromium sans caméra), caméra occupée, page non sécurisée — toujours avec « envoyez une photo à la place ».
- **Dépôt** : la zone disait « Click or drop » sans gérer le dépôt → géré. **Collage** (Ctrl+V) d'une capture.
- Résultat : bouton « Open link » pour une adresse http(s) seulement, avec l'avertissement ; lecture des codes clairs sur fond sombre (`inversionAttempts`).
**Mesuré :** Chromium avec une fausse caméra alimentée par une vidéo Y4M contenant un QR code (fabriquée par le test) : **lu, caméra arrêtée et libérée** ; sans caméra : message clair. Firefox (fausse caméra à mire) : démarre, ne lit rien à tort, s'arrête et libère le flux.
**Références :** les scanners en ligne ouvrent sur la caméra ; vitesse de lecture non comparée.

## 3. Audio Trimmer

- Début et fin **au dixième** (champ, curseur au pas de 0,1, « Set to the player's position ») ; affichage m:ss.s ; la durée n'est plus arrondie à la seconde inférieure (un fichier de 5,0 s finit à 5,0).
- **Fondus** d'entrée et de sortie en secondes (mp3cut.net les propose) : ré-encodage dans le **même format** à réglage élevé (MP3 VBR q2, AAC 192k, Vorbis q6, FLAC, PCM), WAV sinon, dit à l'écran ; découpe dans le graphe de filtres (`atrim`), les fondus comptent depuis la coupe.
- **Coupe exacte sans perte** : mesuré, une copie de flux WAV coupée 1,3→4,7 s durait **3,437 s** ; WAV/AIFF (codec PCM lu dans le rapport de ffmpeg) et FLAC 16 bits passent maintenant par `atrim` dans leur propre format → **3,4000 s** ; WAV 24 bits 0,7→2,2 s → **24 bits, 1,50000 s**. Les formats compressés sans fondu restent copiés (à la trame près, comme avant, dit dans la FAQ).
**Mesuré (échantillons lus dans le WAV produit) :** fondu 1 s / 0,5 s → début 0,03, mi-fondu 0,50, plein 1,00, mi-fondu de sortie 0,50, fin 0,07 (niveau relatif) ; fondus plus longs que la partie gardée : refusé avec la raison.

## 4. Tests

`scripts/browser-tests/improvement-17.mjs` — vraies pages ; GIF décodés par gifuct-js ; QR fabriqué par `qrcode` ; WAV lus octet par octet. **Build de production locale : Chromium 20/20, Firefox 18/18.**
Non testable sous Firefox : le **collage** — Firefox vide le DataTransfer d'un `ClipboardEvent` créé par script (vérifié) ; la page lit aussi `clipboardData.items` pour les vrais collages. Testé sous Chromium.

## 5. Non fait

- iPhone / Safari réel : caméra non éprouvée (demande HTTPS et l'accord de l'utilisateur).
- Délai par image, fondu enchaîné (ezgif) ; vitesse, hauteur, volume (mp3cut.net) : non demandés.
