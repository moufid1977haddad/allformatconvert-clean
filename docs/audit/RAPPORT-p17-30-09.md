# RAPPORT — P17 : AI Detector par Pangram, Image Blur rapide sous Safari, Video Rotator « compatible partout » (30/09)

Aucune poussée forcée. Aucune écriture en base de production hors du fonctionnement normal du site. Aucun secret lu ni
affiché (PANGRAM_API_KEY n'existe que dans Vercel ; seuls des noms de variables ont été lus). Service `media-processing`
non modifié.

## En bref

| Étape | Résultat |
|---|---|
| 1 — AI Detector / Pangram | budget propre 50 $/mois + 2 000 mots gratuits/jour par visiteur ; réviseur indépendant (4 défauts d'argent trouvés, tous corrigés) ; **corpus de 97 textes : 0/57 humain dit IA (résumé LIGO 2016 compris), 40/40 IA reconnues**, 5 langues, 5 modèles ; **en production `5969cdb1`** ; vérification LIGO + texte d'IA sur www **reportée** (voir §1.5) |
| 2 — Image Blur sous Safari | flou sur le GPU (WebGL2, le moyen de Photopea/Pixlr), sinon CPU réécrit ; **12 Mpx : 6,5 s → 1,5-2,0 s ; 48 Mpx : ≈ 7,6-10,9 s → 4,8 s** sous WebKit avec simulation iPhone (décodage et encodage compris ; le flou seul : 4,2 s → 0,24 s à 12 Mpx) ; Add Noise corrigé aussi ; les autres outils au pixel n'avaient pas ce défaut |
| 3 — Video Rotator | l'ancien Windows Media Player ignore la rotation par métadonnée → **choix avant la rotation** : « Compatible everywhere » (par défaut : image réellement tournée, pleine résolution, sur notre service) ou « Instant, lossless » (matrice, dans le navigateur) |
| 4 — déploiement 2 + 3 | préversion `onlineconvertools-gpc071n1e` verte ×3 moteurs ; fusion **`9d0f7e71`** sans poussée forcée ; production `onlineconvertools-6yhddnekx` ; **tout PASS sur www** (Image Blur 12/24/48 Mpx ×3 moteurs, Rotator 11/11 ×3) ; aucun retour arrière |

## 1. AI Detector — Pangram

### 1.1 Plafond propre et limite gratuite (code d'argent)

**Le moyen des concurrents, relevé le 30/09 (offres gratuites) :** Pangram 20 crédits = **2 000 mots par jour** (compte
gratuit, page « What do I get with a free account »), GPTZero **10 000 mots par mois** (≈ 330/jour, compte), Originality.ai
**3 analyses par jour**, ZeroGPT **15 000 caractères par analyse** sans compte (détecteur par perplexité, plancher de
16,9 % de faux positifs mesuré par RAID). **Choix : 2 000 mots par jour et par visiteur, sans compte** — l'allocation
quotidienne la plus généreuse d'un détecteur entraîné (celle de Pangram), au-dessus de GPTZero et d'Originality.

| Élément | Où | Ce qu'il fait |
|---|---|---|
| Budget propre | `lib/quota/aiDetect.js` | **50 $/mois** (clé `aidetect_spend_micros`), réservé **avant** l'appel au prix exact du texte, dans le **même appel atomique** que les mots du visiteur (`increment_usage_counters_all_or_none`) : les deux ou aucun ; refus 503 « The AI detector has reached its monthly budget — a site-wide limit, not something on your end. It resets on … » ; alertes à 50/80/100 % (et « 100 % » envoyé au premier refus) |
| Plafond global | `lib/quota/config.js` | `'ai-detect'` **retiré** de `WORST_CASE_COST_MICROS` : le détecteur ne réserve plus rien sur les 20 $ des autres outils (le test le vérifie) |
| Limite par visiteur | `lib/quota/aiDetect.js` | 2 000 mots facturés/jour UTC ; **IPv6 compté par /64** (un abonné ne peut pas faire tourner ses adresses) ; refus 429 qui dit combien il reste |
| Route | `app/api/ai-detect/route.ts` | n'appelle plus `guardPaidRoute` ; aucun appel à Pangram sans réservation ; budget rendu **seulement** si Pangram a refusé la tâche (4xx) ; rendu réessayé puis alerté s'il échoue |
| Comptage prudent | `lib/ai/pangram.js` `countBillableWords` | le **plus haut** de : mots séparés par des espaces, suites de lettres/chiffres (caractères invisibles retirés), 1 mot par 8 caractères ; 1 mot par caractère en chinois, japonais, thaï, lao, khmer, birman, tibétain, javanais, balinais |
| Délais | `detectWithPangram` | 10 s par requête, 45 s au total (la fonction a 60 s) |
| Page | `page.jsx` | « 2,000 free words a day, no signup (each analysis counts as the next 100 words) » affiché **avant** l'analyse |
| Résumé quotidien | `api/cron/health-check` | ajoute la dépense du détecteur et ses refus de budget, séparés de ceux du plafond global |
| Ancienne voie | `lib/ai/toolPrompts.js` | l'entrée `ai-detector` de `/api/ai` (RAIDAR, OpenAI) est retirée : cette porte payante ne sert plus |

**Réviseur indépendant (sous-agent, lecture seule).** Défauts confirmés, tous corrigés : ① mots comptés trop bas
(espaces invisibles, chaînes à tirets, jetons très longs : jusqu'à ≈ 24 fois sous le vrai prix si Pangram compte
autrement) ; ② budget rendu sur une erreur 5xx ou une réponse illisible, alors que Pangram a pu facturer ; ③ échec du
rendu non géré (500 sans alerte) ; ④ résumé quotidien qui comptait les refus du détecteur comme ceux du plafond global
et n'affichait pas sa dépense. Réserves retenues : rotation d'adresses IPv6 (corrigée par le /64), absence de délai
(corrigée). Réserves notées sans changement : une rotation d'adresses IPv4 à grande échelle peut épuiser le budget du mois
(déni de service, pas de dépense au-delà de 50 $) ; la facturation « par tranche de 100 mots » est à confirmer sur la
première facture Pangram. Vérifié par le réviseur : aucun appel sans réservation, plafond infranchissable même en
concurrence (transaction unique, verrous ordonnés), 20 $ global jamais touché.

**Préversions seulement** (`VERCEL_ENV=preview`, derrière la protection Vercel) : 30 000 mots par visiteur, pour mesurer le
corpus depuis une seule machine ; le budget de 50 $ est le même partout.

Tests : `scripts/quota-tests/21-ai-detect.js` 12/12 (compteurs en mémoire, jamais la base), `converter-tests/15` 7/7,
`misc-audit-2 --only=ai-detector` **12/12 sous Chromium, Firefox et WebKit**, en local puis sur la préversion.

### 1.2 Métadonnées

`layout.tsx` décrivait encore l'ancienne méthode (« uses an AI language model to judge … based on writing patterns ») :
remplacée par « Free AI detector: was this text written by AI, a person, or both? Pangram's trained model, the fewest
false accusations in an independent 2025 study. No signup. » (160 caractères). Le fichier se lisait normalement.
La page n'a **pas** de données structurées (seules les 10 pages SEO du 29/09 en ont) : rien à corriger.

### 1.3 Mesure du corpus avec Pangram (préversion `onlineconvertools-gm573zboz`, route du site)

Script `scripts/ai-detector/pangram-corpus-route.mjs` par le relais à jeton OIDC en mémoire ; résultats
`scripts/ai-detector/results/pangram-preview.json`. Textes de plus de 190 mots coupés à la dernière fin de phrase avant
190 mots (2 crédits au plus chacun, pour tenir sous 10 $) ; **le résumé LIGO a été mesuré entier**, à part, en premier.

| Détecteur | Textes | Verdicts rendus | **Humains dits IA** | Humains dits « mixte » | IA reconnues | IA dites humaines |
|---|---|---|---|---|---|---|
| **Pangram (pangram-4, via la route du site)** | 97 (57 H / 40 IA) | **97/97 (100 %)** | **0/57** (LIGO : humain, 0 % d'IA) | 0/57 | **40/40 (100 %)** | 0/40 |
| Notre outil en production avant P17 (RAIDAR 0,90) | 37 | 25/37 (68 %) | 1/19 (LIGO) | — | 9/18 (50 %) | 1/18 |
| RAIDAR corrigé (seuil 0,93) | 37 | 20/37 (54 %) | 0/19 | — | 5/18 (28 %) | 1/18 |
| desklib (meilleur classifieur ouvert) | 97 | 100 % | 6/57 (11 %) | — | 24/40 (60 %) | 16/40 |
| Référence publiée : Pangram, étude de Chicago (Booth / NBER w34223) | — | — | ≈ 0 (< 0,5 %) | — | 96-98 % | — |

Par langue : humains en 24/24, fr 16/16, de 5/5, es 6/6, it 6/6 dits humains ; IA en 20/20, fr 15/15, de 2/2, es 1/1, it
2/2 reconnues. Par modèle : claude-opus-5-5, claude-sonnet-5, claude-haiku-4-5, claude-fable-5-1, gpt-4o-mini : 8/8
chacun. Part d'IA donnée par Pangram : 0 pour **tous** les humains, 1,0 pour **tous** les textes d'IA.

**Critère de mise en production rempli** (aucun humain dit IA ; reconnaissance 100 % ≥ 96-98 % de l'étude de Chicago).
Limite honnête : 97 textes, les humains sont tous d'avant 2022, les IA écrites sans retouche ; un texte d'IA retouché
par une personne sera moins net (la page le dit).

### 1.4 Mise en production

Repère `restauration-avant-p17-ai-detector` = `671e0d82` (poussé). Fusion `--no-ff` **`5969cdb1`**, poussée normale ;
production `onlineconvertools-8eueqa3ou` (`dpl_62y8WwiWoXPHWbC7SERpt2gLWPcg`), Ready ; la nouvelle description est servie
sur www.

### 1.5 Vérification sur www — reportée, et pourquoi

`node scripts/ai-detector/www-check-p17.mjs` (vraie page, vrai Pangram) a reçu sur www, pour LIGO puis pour le texte
d'IA : **« You have used today's 2000 free words. More tomorrow (the count resets at midnight UTC). »** — la mesure du
corpus sur la préversion (même base, même adresse, même jour UTC) avait déjà consommé le compteur du jour de cette
adresse. C'est la **preuve réelle, sur www, du refus par visiteur** (message clair, aucun appel à Pangram). Le compteur
n'a pas été effacé (écriture en base interdite). La préversion, au code identique à la production, a rendu LIGO
« humain, 0 % d'IA » par la même page et la même route. **À refaire après minuit UTC** (voir « Tests à refaire »).

**Rejoué le 30/09 à 03 h 51 UTC, à la demande du propriétaire :** même refus pour les deux textes (« You have used today's 2000 free words… »), le jour UTC n'ayant pas changé ; aucun appel à Pangram, 0 $. Toujours à faire à partir du 01/10 00 h 00 UTC.

### 1.6 Dépense Pangram

| | Montant |
|---|---|
| Mesure du corpus (188 crédits de 100 mots, compte à la manière de Pangram) | **≈ 9,40 $** |
| Borne haute comptée par le site (comptage prudent) | 9,45 $ |
| Vérification sur www | 0 $ (refusée avant l'appel) |
| Crédits restants (25 $ prépayés) | **≈ 15,60 $** — à confirmer dans le tableau de bord Pangram |

## 2. Image Blur (et les autres outils au pixel) sous Safari

**Mesure de départ (WebKit de Playwright, simulation iPhone, 12 Mpx, décodage et encodage compris) :** Image Blur 6,5 s,
Add Noise 4,9 s, les 7 autres filtres au pixel 1,2-1,7 s. Le vrai Safari du Mac donnait 44 s pour Image Blur à 12 Mpx
(≈ 7 fois plus lent que ce WebKit). Cause : Safari n'a pas `ctx.filter` ; le flou était calculé en JavaScript avec une
fonction de lecture par échantillon, canal par canal, et des colonnes parcourues à travers la mémoire, en flottants de
32 octets par pixel.

**Le moyen des concurrents :** Photopea et Pixlr floutent sur le GPU (WebGL ; limites de texture et raccords de tuiles
gérés par eux) ; les outils web simples utilisent StackBlur (CPU, coût constant par pixel) ; Squoosh n'a pas de flou.

**Ce qui a été fait :**

| Fichier | Changement |
|---|---|
| `app/lib/glBlur.js` (nouveau) | le **même** flou (3 boîtes, alpha prémultiplié, bords répétés) en textures flottantes WebGL2, par bandes de ≈ 2 Mpx avec marges exactes, en place (pas de seconde copie pleine taille) ; renvoie `false` sans WebGL2 ou sans texture flottante (alors CPU) ; si le GPU lâche en cours de route, erreur visible plutôt qu'une image à moitié floutée |
| `app/lib/canvasFilters.js` | flou CPU réécrit : fenêtres glissantes sans fermeture, quatre canaux ensemble, passes horizontales ligne par ligne en cache, entiers 16 bits (moitié de la mémoire) ; à 1 niveau près de l'ancien |
| `app/lib/blurParallel.js` + `blur.worker.js` | le flou CPU réparti sur les cœurs (Workers) quand le GPU manque |
| `image-blur/page.jsx` | GPU d'abord, sinon CPU ; au-delà de 16,7 Mpx (iPhone) les pixels sont floutés directement, **sans** bandes de canvas (la recopie des bandes coûtait plus que le flou) |
| `add-noise/page.jsx` | générateur xorshift en entiers au lieu de `Math.random()` par pixel |

**Contrôles :**
- `scripts/image-tests/blur-fast.mjs` : nouveau flou CPU à **1 niveau au plus** de l'ancien sur 20 couples image/σ ;
  une bande avec `gaussianBlurSupport()` lignes de marge = les lignes de l'image entière, exactement.
- `scripts/browser-tests/blur-gpu.mjs` : **GPU = CPU à 1 niveau près** (transparence, plusieurs bandes, σ 1 à 20) sous
  **WebKit, Chromium et Firefox**. Temps du flou seul (σ 5) sous WebKit : **12 Mpx 0,24 s, 24 Mpx 0,45 s** (CPU : 0,82 s et
  1,64 s ; avant : 4,2 s à 12 Mpx).
- `image-tools-big` (simulation iPhone active), temps de bout en bout, dans le même passage qu'Inverter (référence) :

| Outil | WebKit 12 Mpx | WebKit 48 Mpx | Chromium 48 Mpx | Firefox 48 Mpx |
|---|---|---|---|---|
| Image Inverter (référence : décodage + encodage) | 1,5-2,5 s | 5,7-5,8 s | 4,0 s | 4,3 s |
| **Image Blur** (avant : 6,5 s / ≈ 7,6-10,9 s) | **1,6-2,0 s** | **4,8 s** | 4,9 s | 4,9 s |
| Add Noise (avant : 4,9 s / 8,5 s) | 3,2-4,1 s | 9,2-14 s | 9,1 s | 9,1 s |

**Add Noise reste ≈ 2 fois plus long que les autres filtres, dans les trois moteurs : ce n'est pas le calcul.** Mesuré :
la même photo bruitée pèse **34,2 Mo** en PNG contre 0,6 Mo sans bruit et s'encode **16 fois plus lentement** (sharp,
12 Mpx) — le bruit est incompressible par nature. Les autres outils au pixel (Brightness & Contrast, Grayscale, Sepia,
Inverter, Vignette, Pixelator, Round Corners, Border, Text, Flip, Rotate) sont à **4,1-4,9 s à 48 Mpx sous WebKit**, au
niveau d'Inverter : pas de lenteur propre à Safari à corriger.

Estimation pour le vrai Safari (à confirmer par le banc du Mac) : si le rapport ≈ 7 entre ce WebKit et le Mac se
retrouve, le flou lui-même passe de ≈ 30-40 s à ≈ 1-2 s à 12 Mpx sur le GPU ; le reste est le décodage et l'encodage,
comme pour tous les outils image.

## 3. Video Rotator — la rotation par métadonnée

**Lectures réelles faites ici** (vidéo d'essai 640×360 à bandes de couleur, tournée de 90° par `lib/mp4Rotate.js`,
`scripts/browser-tests/rotation-players.mjs`) :

| Lecteur | MP4 | MOV | Comment |
|---|---|---|---|
| Chrome (Chromium) | applique | applique | capture de l'élément `<video>` : 360×640, bandes tournées |
| Firefox | applique | applique | idem |
| Windows — Media Foundation (miniatures de l'Explorateur ; même moteur que Films et TV / Lecteur multimédia de Windows 11) | applique | applique | `IShellItemImageFactory` : 144×256, bandes tournées |
| Safari / Photos (iPhone, Mac) | applique | applique | c'est la façon dont l'iPhone enregistre toute vidéo portrait (non relu ici : le WebKit de Playwright sous Windows ne lit pas le H.264) |
| Ancien Windows Media Player (wmplayer, encore installé sur Windows 10/11) | **ignore** | **ignore** | documenté (Microsoft Q&A « Windows Media Player is playing my video sideways », VideoHelp) ; non relu ici : jamais lancé sur ce poste, il ouvre son assistant de configuration, que je n'ai pas rempli |
| VLC, Android (MediaPlayer/ExoPlayer) | applique | applique | documenté ; VLC ouvert par erreur puis fermé (boîte de mise à jour) |
| WhatsApp | variable | variable | signalements d'utilisateurs contradictoires ; non testable ici |

**Ce que livrent les concurrents :** Kapwing, VEED : un MP4 recalculé (« export ») ; 123apps : recalculé en **480p ou
720p** (1080p payant), observé dans son interface le 30/09 (le fichier final n'a pas pu être intercepté) ; Clideo :
garde le format, « sans perte si le même format est choisi » (sa page), 500 Mo en gratuit.

**Décision (un lecteur courant ignore la métadonnée) : un choix clair avant la rotation**, pour MP4/MOV/M4V/3GP :
« **Compatible everywhere** » (par défaut, recommandé : l'image est réellement tournée sur notre service, pleine
résolution, haute qualité, MP4 — au-dessus de 123apps qui plafonne à 720p) ou « **Instant, lossless** » (matrice, dans le
navigateur, aucune limite de taille — comme Clideo, sans envoi). La page dit lequel lit quoi, et le résultat « sans perte »
rappelle que l'ancien Windows Media Player ignore le réglage. WebM, MKV, AVI : toujours le service (pas de réglage de
rotation dans ces formats), sans choix affiché. Au-delà de 1 Go, « Compatible everywhere » est indiqué indisponible et
le message renvoie vers « Instant, lossless ».

Tests : `video-tools-mp4.mjs --only=rotator` avec le **vrai service lancé en local** : **11/11 sous Chromium, Firefox et
WebKit** — sans perte (7 octets changés, rien d'envoyé, 360×640) ; compatible par défaut (1 envoi, image stockée 360×640,
**aucune rotation résiduelle**, repère au bon coin, 90 images, son) ; MOV d'iPhone déjà portrait + 90° dans les deux
modes (rotation d'origine appliquée d'abord) ; WebM sans choix affiché.

## 4. Déploiement des étapes 2 et 3

- Branche `p17-image-video-30-09` partie de master `5969cdb1` ; repère **`restauration-avant-p17-image-video`** = `5969cdb1` (poussé).
- Préversion `onlineconvertools-gpc071n1e` (pointe `fc271982`), relais local à jeton OIDC en mémoire, simulation iPhone active :

| Banc | Chromium | Firefox | WebKit |
|---|---|---|---|
| `image-tools-big` (21 outils × 12/24/48 Mpx) | **63/63** | **63/63** (56 + 7 rejoués seuls : webp-to-jpg à 48 Mpx attendait plus de 30 s le décodage sous trois moteurs en parallèle, outil non modifié) | **63/63** |
| `image-tools-rest-big` (9 outils × 3 tailles) | 27/27 | 27/27 | 27/27 |
| `video-tools-mp4 --only=rotator --real-service` (vrai service de production) | 11/11 | 11/11 | 11/11 |
| `misc-audit-2 --only=ai-detector` | 12/12 | 12/12 | 12/12 |
| `blur-gpu` (GPU = CPU à 1 niveau) | 4/4 | 4/4 | 4/4 |

  Temps sur la préversion (machine chargée), Image Blur / Inverter : WebKit 2,1 / 2,2 s (12 Mpx), 3,8 / 4,3 s (24), 8,1 / 9,4 s (48) ; Firefox 1,2 / 0,9, 4,2 / 4,4, 7,6 / 6,2 s.
- Fusion `git merge --no-ff` → **`9d0f7e71`**, poussée normale ; production **`onlineconvertools-6yhddnekx`** (`dpl_7tYxMfrkwMVt92fMDeUmw5kv9SUM`), Ready ; nouveaux textes servis sur www (Rotator « upright in every player », Blur « Gaussian blur at full resolution »).

### Vérification sur www (simulation iPhone active)

| Contrôle | Chromium | Firefox | WebKit |
|---|---|---|---|
| Image Blur 12 Mpx (Inverter pour référence) | PASS 0,6 s (0,4) | PASS 0,9 s (0,7) | PASS **1,5 s** (1,2) |
| Image Blur 24 Mpx | PASS 2,7 s (2,1) | PASS 3,2 s (2,5) | PASS **2,3 s** (2,2) |
| Image Blur 48 Mpx | PASS 7,6 s (5,6) | PASS 5,3 s (4,2) | PASS **4,7 s** (4,6) |
| Video Rotator (sans perte MP4/MOV, compatible MP4/MOV d'iPhone, WebM ; vrai service) | 11/11 | 11/11 | 11/11 |

**Aucun échec sur www : aucun retour arrière nécessaire.** En cas de besoin : `git revert -m 1 9d0f7e71` poussé normalement (repère `restauration-avant-p17-image-video` = `5969cdb1`), ou `vercel promote https://onlineconvertools-8eueqa3ou-moufid.vercel.app` (production d'avant cette fusion).

## 5. Écarts à signaler

- **Ligne parasite (enquête du 30/09, 03 h 50 UTC).** Longueur 19 caractères, lettres, chiffres et symboles ; apparue dans le fichier entre deux `git status` de la session, **après 01 h 35 min 30 s UTC** (fichier encore propre) et **avant 02 h 42 min 33 s UTC** (fichier modifié) ; aucune commande de la session n'a écrit ce fichier (écriture extérieure à la session) ; **révélée par `git diff docs/audit/tool_errors-purge-28-09.sql` à 02 h 42 min 40 s UTC**. Le propriétaire l'a retirée ensuite ; copie locale remise au propriétaire hors du dépôt (Bureau). Vérifié par git : `git status` propre sur ce fichier ; `git log --all -S` (4 derniers caractères, puis la ligne entière) : **0 commit** ; aucune remise (stash) ; dans aucune branche. Signalement d'origine :
- **Une modification que je n'ai pas faite** est présente, non commitée, dans `docs/audit/tool_errors-purge-28-09.sql` : une ligne ajoutée à la fin qui ressemble à un **mot de passe** (compte Pangram ?). Je ne l'ai ni commitée, ni recopiée ici. **À faire par toi : retirer cette ligne et changer ce mot de passe** (il est en clair sur le disque et est apparu une fois dans la sortie d'une commande pendant la session).
- La mesure du corpus sur la préversion a écrit dans les compteurs de production (même base Supabase : `aidetect_spend_micros` ≈ 9,45 $ sur la période `2026-09`, et le compteur du jour de mon adresse) — c'est le fonctionnement normal de la route, la dépense réelle y est comptée ; le compteur de l'adresse a ensuite bloqué la vérification sur www (§1.5).
- Sur le bureau Windows : l'ancien Windows Media Player a ouvert son assistant de première configuration (fermé sans rien choisir), VLC s'est ouvert sur une boîte de mise à jour (fermé), le Lecteur multimédia a été ouvert puis fermé ; aucune capture exploitable (Windows garde le terminal au premier plan), d'où la lecture par les miniatures de l'Explorateur.

## Retour arrière (si un jour nécessaire)

- AI Detector : `git revert -m 1 5969cdb1` poussé normalement (jamais de poussée forcée) ; repère `restauration-avant-p17-ai-detector` = `671e0d82`.
- Image Blur + Video Rotator : `git revert -m 1 9d0f7e71` ; repère `restauration-avant-p17-image-video` = `5969cdb1`.
- Service `media-processing` : rien à faire (non modifié).

## Tests à refaire

**(1) Banc Safari du MacBook** (`tests-safari-scripts/run.sh`, Safari 17.6) : **Image Blur à 12, 24 et 48 Mpx** (temps : il doit tomber à quelques secondes, contre 44 / 69 / 160 s) ; **Video Rotator** 90° d'une vidéo d'iPhone dans les deux modes : « Compatible everywhere » (MP4, image tournée, lu droit par QuickTime) et « Instant, lossless » (même format, même taille, lu droit par QuickTime) ; **AI Detector** : un texte humain et un texte d'IA (verdicts, parts affichées, limite « 2,000 free words a day » affichée).

**(2) iPhone, par le propriétaire** : Image Blur avec une photo de 24 Mpx et une de 48 Mpx (temps, pas de rechargement de l'onglet, Download enregistre) ; Video Rotator d'une vidéo filmée en portrait : « Compatible everywhere » puis « Instant, lossless », les deux résultats ouverts dans Photos et envoyés par WhatsApp (droits ?) ; AI Detector un texte court.

**(3) Sur www à partir du 01/10 00 h 00 UTC (Claude, ≈ 0,25 $ ; rejoué le 30/09 à 03 h 51 UTC : encore refusé par la limite du jour)** : `node scripts/ai-detector/www-check-p17.mjs` — LIGO 2016 doit être « humain », le texte d'IA « IA ».

**(4) Facultatif, sur un PC Windows 10 avec l'ancien Windows Media Player** : ouvrir un résultat « Instant, lossless » (attendu : non tourné, comme la page l'annonce) et un « Compatible everywhere » (attendu : droit).
