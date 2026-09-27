# RAPPORT — Audio Merger : ordre des fichiers et fondu enchaîné

**Date :** 26 septembre 2026 · **Branche :** `licence-ameliorations` · **Production avant :** `master` = `de3dec9d` · **Restauration :** balise `avant-audio-merger-ordre-fondu` · **Production après :** fusion `c60c0167`, déploiement `onlineconvertools-dp2mf3ikx` · **Vérifié sur www, Chromium et Firefox.**

## 0. En une table

| Point | Verdict |
|---|---|
| Recherche (3 concurrents, vrais fichiers, courbes mesurées) | 123apps : **fondu imposé par défaut** (1,5-3 s, non réglable) ; Clideo : désactivé, 0,8 s fixe ; onlineconverter : désactivé, 1-10 s, **fait disparaître un fichier court**. Tous linéaires |
| Défaut retenu | **fondu désactivé** (comme 2 concurrents sur 3) — jonction exacte, 0 ms, commande identique à avant |
| Construit | ordre par glisser + flèches, ajout/retrait ; fondu 0,1-10 s, puissance constante ou linéaire, avec ou sans chevauchement, jonction par jonction ; fondus de début/fin ; garde contre les fichiers courts ; **durée annoncée = durée obtenue, à l'échantillon** |
| Trouvé en route | la **barre de progression d'Audio Merger restait figée** en production (ffmpeg.wasm gardait le `-v error` de ffprobe) — corrigé |
| Tests | plan 20/20 · natif 13/13 · local, préversion et **www** : ordre/fondu 12/12 + 12/12, jonctions 9/9 + 9/9 |
| Point 4 | audit de tous les outils qui joignent/coupent/copient sans réencoder : **noté dans le plan, non traité** |

## 1. Recherche — faits mesurés

Méthode : les vraies pages, pilotées par Playwright (Chromium), trois fichiers FLAC de sons purs — A = 440 Hz 5 s, B = 1000 Hz 3 s, C = 2500 Hz 4 s — puis le fichier rendu décodé par ffmpeg natif n8.1.2. Le niveau de chaque son est suivi toutes les 5 ms (Goertzel, fenêtre de Hann de 40 ms) : on lit l'**ordre**, la **durée totale**, où chaque fondu commence et finit, et la **courbe** (gain à 25/50/75 % du fondu : linéaire = 0,25/0,50/0,75 ; puissance constante = 0,38/0,71/0,92). L'analyseur a d'abord été vérifié sur des fondus connus faits par ffmpeg (linéaire mesuré 0,26/0,50/0,75 ; sinusoïdal 0,36/0,66/0,88 ; jonction franche : 0,03 s = largeur de la fenêtre). Sondes : `scripts/browser-tests/audio-merger-references/order-fade-*.mjs`, analyseur `fade-analyse.mjs`.

| | **123apps** (audio-joiner.com) | **Clideo** | **onlineconverter.com** |
|---|---|---|---|
| Réordonner | flèches ↑/↓ sur chaque piste (mesuré : A↓ → B, A, C) | glisser un bloc sur la frise (mesuré : B, A, C) | aucun : 2 à 4 cases fixes, l'ordre est celui des cases |
| Fondu enchaîné **par défaut** | **activé** à chaque jonction | désactivé (case « Crossfade ») | désactivé (« Transition : None ») |
| Durée du fondu | **imposée** : moitié du fichier le plus court, **plafonnée à 3 s** (mesuré : 1,5 s entre 5 s et 3 s ; 2,0 s entre 5 s et 4 s ; 3,0 s entre deux fichiers de 60 s) | **0,8 s fixe** | **1 à 10 s, secondes entières** (3 s par défaut), **une seule valeur pour toutes les jonctions** |
| Courbe | linéaire (0,26/0,50/0,75) | linéaire | linéaire |
| Jonction par jonction | oui (icône par jonction) | non | non |
| Sans chevauchement | non | non | oui : « Fade In & Out (No Overlap) » (fondu sortant puis entrant, durée gardée) |
| Fondu d'entrée / de sortie | oui (icônes, même règle de durée : 3 s sur 60 s) | non | non |
| Effet sur la durée | 12 s → **9 s** sans que le visiteur l'ait choisi | 12 s → 10,4 s | chevauchement 3 s : 12 s → **6 s**, et **le fichier de 3 s disparaît** (jamais à plein niveau : fondu entrant puis sortant sur toute sa longueur) ; sans chevauchement : 12 s |
| Fondu désactivé | exact (12,000 s, FLAC) | exact (12,000 s) | exact (12,000 s, MP3) |

**Conclusion de la recherche.** Deux concurrents sur trois laissent le fondu **désactivé** ; le seul qui l'active (123apps) raccourcit le résultat de 3 s sur trois fichiers sans que le visiteur l'ait demandé et ne le laisse pas en régler la durée. **Aucune raison solide de l'activer par défaut : il reste désactivé**, et la jonction reste alors exacte. Aucun des trois ne propose autre chose qu'une courbe linéaire, ni une durée au dixième de seconde, ni une garde contre un fichier trop court (onlineconverter en fait disparaître un).

## 2. Ce qui a été construit

**Ordre.** La liste est l'ordre de fusion, de haut en bas. Chaque fichier : **glisser-déposer** (comme Clideo), **flèches ↑/↓** (comme 123apps, et seule voie au doigt sur téléphone), **✕** pour le retirer ; « Remove all ». On **ajoute** des fichiers en plusieurs fois (clic ou dépôt sur la zone) — avant, choisir de nouveaux fichiers remplaçait la liste. Chaque fichier n'est écrit qu'une fois dans ffmpeg.wasm et garde son analyse quand il change de place.

**Transitions — toutes désactivées par défaut** (légende : « off: the files are joined end to end, nothing added or cut »). Désactivées, la commande ffmpeg est **identique octet pour octet** à celle d'avant (test unitaire) : jonction exacte, 0 ms.
- **Crossfade between files** : longueur **0,1 à 10 s au dixième** ; courbe **puissance constante** (par défaut) ou **linéaire** ; **chevauchement** (le résultat raccourcit de la longueur à chaque jonction) ou **« Fade out, then in »** (fondu sortant puis entrant, durée gardée — le mode sans chevauchement d'onlineconverter) ; une case **par jonction**, entre les fichiers de la liste (comme 123apps).
- **Fade in at the start / Fade out at the end** (comme 123apps), même longueur et même courbe.
- **Garde** : un fichier ne donne jamais plus que sa longueur à ses fondus (la moitié quand ses deux bouts fondent) ; au-delà, la longueur est réduite **et la page le dit** (« Fades shortened to 1.5 s (you asked for 10.0 s)… »). Aucun fichier ne peut disparaître comme chez onlineconverter.
- **Dit avant la fusion** : le nombre de jonctions en fondu, la longueur, et **la durée du résultat** (« lasts 0:09.6 instead of 0:12.0 ») — mesurée ensuite égale à l'échantillon près.

**Moyen (ffmpeg, un seul encodage, comme avant).** Chaque fichier est toujours décodé seul ; les jonctions en fondu passent par `acrossfade` **compté en échantillons** (`ns`, pas en secondes), `o=0` pour le mode sans chevauchement ; les fondus de début et de fin par `afade`. Le fondu de fin doit finir **sur le dernier échantillon** : la durée annoncée par un conteneur n'est qu'une estimation pour certains formats, donc la page **compte d'abord les échantillons du dernier fichier** (décodage par la même chaîne + `volumedetect`, qui imprime `n_samples`). Les fondus sont mixés en **flottant** (doubles pour du 32 bits entier), puis ramenés à la profondeur de sortie : hors des fondus, les échantillons sortent inchangés (vérifié à l'échantillon), et une somme au-dessus de la pleine échelle est écrêtée par la conversion finale, jamais repliée.

**Courbe par défaut : puissance constante — choix mesuré, pas supposé.** Deux bruits roses indépendants (deux « chansons » différentes), niveau au milieu du fondu contre avant : **puissance constante −0,01 dB, linéaire −2,96 dB** (`02-commands-native.mjs`). Les trois concurrents sont linéaires, donc font ce creux de 3 dB au milieu de chaque fondu entre deux morceaux différents ; le linéaire reste proposé.

**Trouvé en route et corrigé — la barre de progression d'Audio Merger restait figée en production.** ffmpeg.wasm garde le niveau de journal de la commande précédente : après l'analyse des fichiers (`ffprobe -v error`), la fusion n'écrivait plus rien, donc jamais « time= », donc la barre restait à 0 % jusqu'à la fin (reproduit sur un banc ffmpeg.wasm isolé, même paquet 0.12.15 / cœur 0.12.9). C'est aussi ce qui empêchait le comptage d'échantillons. Correctif : `-loglevel info` en tête des commandes ; aucun autre outil du site n'appelle `ffprobe` (recherche dans `app/`).

## 3. Vérifications

| Où | Résultat |
|---|---|
| `scripts/audio-merge-tests/01-plan.mjs` | **20/20** — dont : transitions désactivées ⇒ commande identique à l'ancienne ; `acrossfade` compté en échantillons ; jonction non cochée = jonction simple ; sans chevauchement `o=0` ; fondu de fin calé sur le compte exact ; `-loglevel info` en tête |
| `02-commands-native.mjs` (ffmpeg natif) | **13/13** — fondu : longueur = somme − jonctions × chevauchement **à l'échantillon**, échantillons hors fondu **identiques** ; sans chevauchement : durée gardée, silence à la jonction ; puissance constante −0,01 dB / linéaire −2,96 dB ; deux fichiers forts en phase : écrêtés, jamais repliés ; fondu vers les 8 formats compressés : durée juste à un bloc près ; fondu d'entrée/sortie sur MP3 : compte exact du dernier fichier, silence aux deux bouts |
| Local (build de test), `audio-merger-order-fade.mjs` | **Chromium 12/12, Firefox 12/12** |
| Local, non-régression | `audio-merger-formats.mjs` Chromium + Firefox : tout passe ; `audio-merger-join.mjs --format=flac/mp3/wav` × 2 navigateurs : tout passe (0 ms, aucun silence aux jonctions) |
| **Préversion** `gvqlq56lo` | ordre/fondu **12/12 Chromium, 12/12 Firefox** (Opus par le vrai service : 1 travail, `libopus`, 9,6 s, lu jusqu'au bout) ; jonctions **9/9 + 9/9** (Opus 12,000 s, 0 ms) |
| **www** (fusion `c60c0167`, déploiement `dp2mf3ikx`, chemin entièrement réel) | ordre/fondu **12/12 Chromium, 12/12 Firefox** ; jonctions **9/9 Chromium, 9/9 Firefox** (fondu désactivé : 0 ms, aucun silence ; Opus : 1 travail, 12,000 s) |

Détail des cas de `audio-merger-order-fade.mjs` (mêmes résultats sur les deux navigateurs) :

| Cas | Ce qui est vérifié | Mesuré |
|---|---|---|
| c1 | transitions désactivées par défaut ; jonction exacte | 3 cases décochées ; résultat = A,B,C **à l'échantillon** ; lu jusqu'à 12,000 s |
| c2 / c3 / c4 | ordre par flèche, par glisser, par retrait + ajout | B,A,C · C,A,B · A,C,B — chacun **exact à l'échantillon** |
| c5 | fondu puissance constante 1,2 s aux 2 jonctions | annoncé « lasts 0:09.6 instead of 0:12.0 », fichier **9,600 s** ; courbe 0,36/0,66/0,88 ; A avant et C après le fondu identiques à l'échantillon |
| c6 | linéaire 1,5 s, 2ᵉ jonction décochée | 10,5 s ; courbe 0,26/0,50/0,75 ; B→C exacte |
| c7 | « fade out, then in » 1 s | 12,000 s ; niveau à la jonction 0,9 % |
| c8 | fondu d'entrée + de sortie 1 s, entrées MP3, sortie WAV | 352 800 échantillons = la somme exacte ; niveau des 10 premières / dernières ms ≈ 0,9 % |
| c9 | 10 s demandées, fichier de 3 s au milieu | réduit à 1,5 s **et dit** ; 9,000 s |
| c10 / c11 | fondu vers MP3 ; vers Opus (vrai service) | 9,6 s ; Opus : 1 travail, encodeur `libopus` |
| c12 | progression réelle, 2 × 10 min + fondu 5 s → MP3 | 33 à 100 valeurs distinctes de la barre ; 19:55 annoncé et obtenu |

## 4. Face aux trois concurrents

| | 123apps | Clideo | onlineconverter | **Nous** |
|---|---|---|---|---|
| Réordonner | flèches | glisser | non | **glisser + flèches**, retrait, ajout |
| Fondu par défaut | activé (imposé) | désactivé | désactivé | **désactivé** — jonction exacte, 0 ms |
| Longueur | imposée, ≤ 3 s | 0,8 s fixe | 1-10 s entières, une pour toutes | **0,1-10 s au dixième** |
| Par jonction | oui | non | non | **oui** |
| Courbe | linéaire | linéaire | linéaire | **puissance constante** (pas de creux) ou linéaire |
| Sans chevauchement | non | non | oui | **oui** |
| Fondu début / fin | oui | non | non | **oui** |
| Fichier trop court | règle « moitié » | ? | **disparaît** | réduit **et dit** |
| Durée annoncée avant | non | « Final output » arrondi à la seconde | non | **oui, au dixième, = durée obtenue** |

## 5. Limites, dites telles quelles

- **Mesures de courbe sur des sons purs** : la différence puissance constante / linéaire (−0,01 dB / −2,96 dB au milieu) est mesurée sur deux bruits roses indépendants, pas sur de la musique réelle ; sur deux enregistrements identiques en phase, la puissance constante monte de 3 dB au milieu (écrêté s'il dépasse la pleine échelle, testé) — c'est pourquoi le linéaire reste proposé.
- **Glisser-déposer au doigt** : le glisser HTML5 ne marche pas au toucher sur téléphone ; les flèches ↑/↓ y servent (rendu vérifié à 375 px, sans défilement horizontal). Safari non testé (bloquant 9).
- **Fondu vers un format compressé** : un encodage, comme toute fusion vers un compressé ; la fin peut s'allonger d'un bloc d'encodeur (limite déjà décrite dans `RAPPORT-audio-merger-format-sortie.md`).
- Coût : inchangé — 1 billet du service par fusion Opus seulement. Cette session en a utilisé 8 (préversion + www).

## 6. Hygiène

Balise `avant-audio-merger-ordre-fondu` sur `de3dec9d`. Aucun fichier d'environnement lu, modifié ni copié : la build locale lit elle-même `.env.local` (Next.js), la préversion a été atteinte par un dossier temporaire ne contenant que `.vercel/project.json` et `vercel env run` (jeton en mémoire), relais arrêté puis **dossier supprimé**. Aucune surveillance ni boucle d'attente : une attente bloquante par build (`vercel inspect --wait`), tâches de fond notifiées à leur fin. Aucun push forcé. Serveurs locaux (site, banc ffmpeg.wasm, relais) arrêtés. `.serena/` laissé tel quel. Audit « jonctions/coupes sans réencodage de tous les outils » **noté dans le plan, non traité**, comme demandé.
