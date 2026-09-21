# RAPPORT — Déploiement du service vidéo, preuve en production, comparaison au marché, plafond Vercel

> **Correction du 21 septembre 2026 :** ce rapport comparait des Mo décimaux à des Mio (notre WebM de 30 s pesait 47,0 Mo, pas 44,8 ; la source 21,7 Mo, pas 20,7) et comparait des sorties de qualité inégale. Le tableau qui fait foi (temps · taille · qualité mesurée) est dans `RAPPORT-video-qualite.md`.

Date : 20 septembre 2026. Suite de `RAPPORT-video-architecture.md` (§7, runbook).
Commits : `d52e8039`, `ad455cc6`, fusion `f0d5faeb` (master) + ce rapport. Balise de restauration : `restore-pre-video-deploiement`.

## 0. Verdict

- Le service `media-processing` est **déployé sur Railway et prouvé en production** : les deux outils vidéo (`video-compressor`, `video-converter`) fonctionnent sur www.onlineconvertools.com, avec un vrai fichier en sortie, rouvert par ffmpeg, et une vraie progression.
- **Nous sommes plus rapides que tous les concurrents mesurés** sur la même vidéo (MP4 → WebM) : 18 s contre 100-251 s pour 30 s de vidéo, 44 s contre 223 s ou plus pour 3 minutes.
- **Nous sommes en retard sur la couverture de formats** (19 sorties contre des centaines chez Convertio ou Zamzar).
- **La contradiction Vercel est tranchée : le plafond est ≈ 4,5 Mo, pas 100 Mo.** Le branchement des routes Office sur le nouveau chemin d'envoi (D8) est donc **nécessaire**, 8-12 h. Rien n'a été refactoré.
- **Non prouvé** : Safari réel / iPhone, coût Railway réel (première facture).

## 1. Déploiement en attente vérifié

`dpl_Ge6ga6zV` (commit `99d95254`) : **READY**. Script `e2e-avif.mjs` sur www : option AVIF activée, fichier `.avif` réel (`ftypavif`), 2 602 Ko → 187 Ko, décodé par le navigateur (1335×2000), en Chromium (3,0 s) et Firefox (11,2 s). WebKit de Playwright sans `OffscreenCanvas` : non testable.

## 2. Service Railway

État lu avant d'agir : 4 services existants (`pdf-tools`, `allformatconvert-clean` = détourage, `gotenberg-fonts`, `gotenberg-v2`), aucun `media-processing`. La CLI est authentifiée (jeton valide) ; les réglages fins passent par l'API GraphQL de Railway avec le jeton local, jamais affiché.

Créé : `media-processing`, dépôt `moufid1977haddad/allformatconvert-clean`, branche `master`, Root Directory `services/media-processing`, Watch Paths `/services/media-processing/**` (forme identique au détourage), healthcheck `/health` (120 s), veille Serverless active, 1 réplica, domaine généré. Les 10 variables `MEDIA_*` + `ALLOWED_ORIGINS` posées, sauf le secret.

Écart au runbook : l'API n'accepte pas « Dockerfile » comme valeur de builder (Railpack, Nixpacks, Heroku, Paketo seulement). Le builder reste sur Railpack, qui prend le `Dockerfile` présent dans le Root Directory, comme `background-removal`.

Secret : posé par le propriétaire (Railway, Vercel Production, Vercel Preview, Sensitive). Aucun secret généré, lu ou affiché. Variables Vercel non secrètes posées : `MEDIA_TICKET_MAX_BYTES`, `MEDIA_JOBS_PER_HOUR_PER_IP=20`, `MEDIA_JOBS_PER_DAY_PER_IP=60`, `NEXT_PUBLIC_MEDIA_SERVICE_URL`.

Preuves de service : `/health` → 200 ; `POST /v1/jobs` sans billet → **401** (`reason: missing`), ce qui prouve que le service exécute le nouveau code (corollaire 4), pas l'ancienne version.

## 3. Test avant Production, puis Production

**Le test local contre le vrai service était impossible** (le billet exige le secret, illisible ; la route de billet exige la base de production). Option retenue avec le propriétaire : préversion Vercel via lien de partage (protection non modifiée). Le lien n'est écrit dans aucun fichier ni journal ; il expire de lui-même (23 h) et l'outil Vercel n'offre pas de révocation.

Préversion : branche `video-deploiement`, `dpl_DP7mT5UY`. Un commit sans diff de code est annulé par l'`ignoreCommand` : il a fallu un vrai commit de code (le script de test).

| Où | Opération | Total perçu (téléversement compris) | Sortie |
|---|---|---|---|
| Préversion, Chromium | compresser 30 s | 11,7 s | 12,9 Mo |
| | convertir 30 s → MP4 | 10,7 s | 21,3 Mo |
| | compresser 3 min | 25,8 s | 32,6 Mo |
| | convertir 3 min → MP4 | 26,8 s | 53,9 Mo |
| Préversion, Firefox | mêmes 4 opérations | 10,0 / 10,8 / 25,5 / 27,1 s | identiques |
| **Production (www), Chromium** | compresser 30 s | **19,7 s** | 12,9 Mo |
| | convertir 30 s → MP4 | 18,8 s | 21,3 Mo |
| | compresser 3 min | **28,5 s** | 32,6 Mo |
| | convertir 3 min → MP4 | 29,5 s | 53,9 Mo |

Vidéos : `s30.mp4` (30,44 s, 1080p, 20,7 Mio) et `surf.mp4` (3:03, 720p, 68 Mio). Les 12 fichiers sauvegardés (préversion Firefox, production Chromium, WebM) ont été rouverts par ffmpeg : **durées exactes (30,44 s, 3:03,13), zéro erreur de décodage**. La progression affichée va de 12 à 71 valeurs distinctes selon l'essai (envoi, file d'attente, conversion en pourcentage, téléchargement).

Le passage préversion → production a varié de 5 à 10 s sur la partie « Converting » des 30 s (5 s en préversion, 13 s en production) : variabilité d'une charge sur 2 vCPU partagés, non expliquée à ce jour. Ces temps sont mesurés depuis un poste de bureau à connexion rapide ; **un visiteur en 4G aura un envoi plus long** (20,7 Mo en 2-4 s ici).

Bascule Production : `NEXT_PUBLIC_MEDIA_SERVICE_URL` posée en Production. Un redéploiement de l'ancien commit a été **annulé par l'`ignoreCommand`** (aucun diff) ; la fusion de `video-deploiement` dans master (commit de code) a déclenché `dpl_2YUPUH3a`, READY. Vérifié : les pages servent la version service (le script échoue si la page contient encore « MediaRecorder »).

**Origine de test retirée** : `ALLOWED_ORIGINS` remis à `https://www.onlineconvertools.com` (relu sur Railway), puis preuve par requête préliminaire CORS : l'URL de la préversion ne reçoit plus d'en-tête `access-control-allow-origin`, www le reçoit. Aucune origine locale n'a jamais été ajoutée.

## 4. Réveil après veille

- HTTP direct, service inactif depuis plus de 20 min : première requête **1,23 s**, suivantes 0,16-0,18 s → **+1,05 s**.
- Vu de la page (conversion 30 s en MP4, service inactif) : envoi visible à 4,6 s contre ~2 s à chaud, total 21,4 s contre 18,8 s → **+2,6 s**. Pendant ce temps l'utilisateur voit « Preparing… » (affiché dès 0,1 s).
- À 4 min d'inactivité, la première requête coûtait déjà 1,2 s (mesures du 20/09) : le seuil de mise en veille n'a pas été isolé plus finement. Ce n'est pas le cas de 4-5 s du détourage : le service ffmpeg est plus léger à réveiller.

## 5. Comparaison au marché (sans compte, sans contournement de quota)

Opération commune : **MP4 → WebM**, mêmes fichiers, réglages par défaut de chaque site, navigateur Chromium (Playwright) depuis la même machine, temps du fichier posé jusqu'au fichier téléchargé.

| Site | 30 s (20,7 Mio) | 3 min (68 Mio) | Taille de sortie 30 s | Plafond annoncé (visiteur) | Filigrane / compte |
|---|---|---|---|---|---|
| **OnlineConverTools** | **18,0 s** | **43,7 s** | 44,8 Mo | **1 Go** | non / non |
| Online-Convert | ≈ 100 s (envoi ≈ 9 s, puis file) | **non fini à 500 s** (« Processing ») | 9,9 Mo | non relevé | non relevé ; publicités, « skip the queue » |
| FreeConvert | 203 s | 223 s | 44,1 Mo (56,9 Mo pour 3 min) | 1 Go (page) | non relevé |
| Convertio | 251 s | non mesuré | 117 Mo (CQ 15) | « 1 Go, ou inscription » (page) | non relevé |
| Zamzar | **non fini à 400 s** | non mesuré (50 Mo max) | — | 50 Mo | non relevé |
| 123apps (video-converter.com) | non mesurable : interstitiel publicitaire plein écran qui bloque le clic ; je ne clique pas dans les publicités | — | — | — | — |

Réserves à lire avec les chiffres :
- Les réglages par défaut diffèrent : Online-Convert produit un fichier 4,5× plus petit (débit plus bas), Convertio un fichier 2,6× plus gros. **FreeConvert est le plus comparable (44,1 Mo contre 44,8 Mo)** et nous y sommes 11× plus rapides sur 30 s, 5× sur 3 min.
- Une seule mesure par site (pas de moyenne) ; les files d'attente des sites gratuits varient dans la journée.
- Nos temps sont en production, service à chaud. À froid : +2,6 s.
- Le plafond « annoncé » est celui affiché par la page du concurrent, pas éprouvé (règle de la doctrine).
- Le téléchargement d'Online-Convert a été confirmé (9,86 Mo) ; celui des autres aussi (FreeConvert 44,1 et 56,9 Mo, Convertio 117 Mo). Zamzar et 123apps : aucun fichier obtenu.

**Conclusion franche : plus rapides que tous les concurrents mesurés, sur les deux durées, à qualité de sortie équivalente là où elle est comparable.** Le seul point où un concurrent nous bat est la **couverture de formats** : nous offrons 19 sorties (MP4, M4V, MOV, MKV, FLV, TS, 3GP, WebM, AVI, WMV, OGV, MPG, GIF, MP3, M4A, WAV, OGG, Opus, FLAC) ; les sites de référence en offrent des centaines. Il manque notamment **H.265/HEVC et AV1 en sortie** (le plus demandé), 3G2, ASF, VOB, M2TS, et AAC/AIFF/WMA/AC3/AMR en audio. Comme la règle est « égal ou supérieur », **le prochain chantier est l'extension des formats, H.265 d'abord** : c'est un ajout de table dans `services/media-processing/app/ffmpeg_ops.py` et de l'option dans la page, sans changement d'architecture. À mesurer au préalable : est-ce que le ffmpeg statique déployé (7.0.2) embarque `libx265` (à vérifier, non fait ici). Autre point signalé : notre WebM par défaut est **plus gros que la source** (44,8 Mo pour 20,7 Mo) ; FreeConvert idem, Online-Convert non — un réglage de débit ou de qualité proposé à l'utilisateur serait un plus.

## 6. Plafond Vercel — TRANCHÉ

Méthode : POST multipart d'un fichier `probe.txt` d'octets aléatoires vers la route Office réelle `https://www.onlineconvertools.com/api/convert-to-pdf`. Une extension non prise en charge est refusée par l'application (400) **avant** tout quota, tout appel à Gotenberg ou ConvertAPI : aucun coût, aucun quota consommé. Un 413 `FUNCTION_PAYLOAD_TOO_LARGE` vient de la plateforme.

| Taille du fichier | Résultat |
|---|---|
| 1 Mio, 4 Mio | 400 (« Unsupported file type ») : **la requête atteint la fonction** |
| **4 493 821 octets** | 400 : accepté |
| **4 493 924 octets** | **413 `FUNCTION_PAYLOAD_TOO_LARGE`** |
| 4,4 Mio, 4,5, 4,6, 6, 10, 26, 60, 100 Mio | **413 `FUNCTION_PAYLOAD_TOO_LARGE`** |

**Le plafond est ≈ 4,5 Mo de corps de requête (≈ 4,49 Mo de fichier). La note « Vercel accepte 100 Mo » est fausse pour ce projet**, sur cette route, en production, aujourd'hui ; elle confirme la mesure du 19 septembre. Le commentaire du code `app/api/convert-to-pdf/route.ts` qui répète cette affirmation est faux et **n'a pas été modifié** (consigne : ne rien refactorer) ; il est inscrit au plan pour le chantier D8.

Conséquence : **le branchement des routes Office sur le nouveau chemin d'envoi n'est pas inutile, il est le seul moyen d'aller au-delà de 4,5 Mo** (8-12 h, inchangé). Écart marché toujours ~30× sur ce point (Online2PDF 150 Mo annoncé).

## 7. Coût mensuel

Retenu, non re-mesuré : 0,00 $/mois à trafic nul, ≈ 1,2 $ à 500 conversions, ≈ 12 $ à 5 000 (Railway, facturation à la seconde, veille active). Les mesures d'aujourd'hui (une vingtaine de conversions) sont négligeables ; **à confirmer sur la première facture réelle.**

## 8. Ce qui n'est pas fait / à retenir

- **Safari réel et iPhone non testés** ; WebKit de Playwright seulement dans les tests précédents. Le bloquant 9 reste ouvert.
- Un seul poste de mesure (connexion rapide) : les temps d'envoi d'un visiteur mobile seront plus longs ; le service tient 2 traitements simultanés (les autres attendent, message visible).
- Instrumentation : `scripts/browser-tests/e2e-video-remote.mjs` (test de bout en bout contre un site et un service déployés ; `FMT=webm` ; `OUT=` pour garder les fichiers).
- Piège rencontré : redéployer l'ancien commit d'un projet dont `ignoreCommand` ne voit aucun diff est annulé ; passer par un commit de code.
- Le lien de partage de préversion (23 h) ne peut pas être révoqué par les outils disponibles ; il ne donne accès qu'à une préversion identique à la production plus le service.
- Aucun outil ni service supprimé ou renommé. Aucun agent de fond, aucune boucle de surveillance ni réveil planifié. Les scripts temporaires de mesure des concurrents ont été supprimés (non versionnés).

## 9. Suite, dans l'ordre

1. Retest Safari réel (macOS, iPhone) : `video-compressor`, `video-converter`, `image-converter` (AVIF), `video-trimmer`.
2. Extension des formats de sortie (H.265 en premier), après vérification de `libx265` dans le binaire déployé.
3. Première facture Railway.
4. D8 : branchement Office (8-12 h) + correction du commentaire faux.
