# RAPPORT — Architecture vidéo : marché, moteur, chemin d'envoi, AVIF

Date : 20 septembre 2026 · Branche `video-architecture` (balise `restore-avant-video-architecture`)

## 0. Verdict d'entrée — le chantier n'est PAS fini

Dit d'abord, comme la règle du 20 septembre l'exige :

| | État |
|---|---|
| Déploiement en attente (`dpl_DfU6JoL9`, commit `36867bb8`) | ✅ **READY**. En production, `video-trimmer` annonce « Files up to 300 MB » et fait une vraie coupe (5,5 s, résultat 8,3 Mo / 12 s pour 10 s demandées). |
| Mesure du marché | 🟡 **Partielle.** Mécanisme d'envoi établi sur FreeConvert et CloudConvert par les requêtes réseau ; **temps total perçu non obtenu chez aucun concurrent** (voir §1). |
| AVIF | ✅ Décidé, chiffré, **construit** (encodeur WebAssembly dans le navigateur) — §2. |
| Moteur vidéo | ✅ Décidé et **construit** : service ffmpeg sur le modèle de `background-removal`, 59 tests de bout en bout — §3. |
| Chemin d'envoi (billet signé + envoi direct par morceaux) | ✅ Construit et testé. |
| **Déploiement du service sur Railway** | ❌ **Non fait** : l'agent n'a pas d'accès Railway (pas de CLI, clic interdit) et le secret ne peut être généré que par le propriétaire. **Tant que ce n'est pas fait, `video-compressor` et `video-converter` fonctionnent comme avant en production.** |
| Branchement des routes **Office** (plafond de 4,4 Mo, défaut D8) | ❌ **Non fait**, volontairement — §4. |
| Comparaison chiffrée « nous contre le marché » (étape 6) | ❌ **Impossible à conclure honnêtement** — §5. |
| Test sous Safari **réel** | ❌ Non fait (WebKit de Playwright seulement, ce n'est pas Safari). |

Le bloquant 6 et le défaut D8 **ne sont donc pas résolus** : ils sont préparés (code, tests, runbook) et attendent un déploiement et un branchement Office.

## 1. Le marché, mesuré (étape 1)

Méthode : Playwright sur les sites réels, même fichier de test (`s30.mp4`, 30,5 s, 1080p, 20,7 Mo), cookies refusés, aucun compte créé, requêtes réseau relevées (`scripts/market-tests/probe-upload.mjs`).

### Comment le fichier monte — la question centrale, ce qui est établi

- **FreeConvert (mesuré)** : `POST api.freeconvert.com/v1/process/jobs` (201) crée le job, puis **envoi par morceaux, reprenable, directement vers un nœud de traitement dédié** (`POST sNN-xxxx.freeconvert.com/api/resumable/<id>` en plusieurs requêtes, puis `/api/resumable/join/<id>` et `/api/upload/<id>`). Le fichier ne passe donc **jamais** par l'API : c'est exactement le mécanisme adopté ici. Chronologie sur mes 20,7 Mo : job créé +3,0 s, envoi terminé +6,9 s (≈ 4 s de transfert sur ma ligne), « Converting » à +7,6 s.
- **CloudConvert (mesuré)** : `POST api.cloudconvert.com/v2/jobs` (201) puis **POST direct vers leur hôte de stockage** (`eu-central.storage.cloudconvert.com`) ; le navigateur interroge ensuite `GET /v2/jobs/<id>` (5 requêtes en 120 s). Même principe : envoi direct au stockage, jamais par la fonction d'API.
- **Zamzar** : la page affiche « Max. file size **50MB** » ; mon envoi n'a produit aucune requête exploitable (à refaire).
- **Clideo, Veed.io** : ce sont des **éditeurs** (le clic sur « Convert » ouvre un éditeur de projet, Veed derrière une connexion). Le mécanisme d'envoi n'a pas pu être capturé sans créer de compte, **interdit**.

### Limites, filigrane, compte (sources : pages des services et comparatifs 2026 ; « mesuré » = observé par moi)

| Service | Plafond | Filigrane / compte / quota gratuit |
|---|---|---|
| FreeConvert | 1 Go annoncé | Sans filigrane. **Mesuré : après 5 essais anonymes, « Limit Reached: You've used up all 20 free conversion credits »**, toujours actif le lendemain. |
| CloudConvert | 1 Go (gratuit) annoncé | ~25 minutes de conversion par jour annoncées (10 crédits/jour mesurés le 19/09 sur le projet). |
| Zamzar | **50 Mo** (affiché) | 2 fichiers par 24 h annoncés ; 200 Mo/400 Mo/2 Go en payant. |
| Clideo | 500 Mo annoncé | Filigrane sur la sortie gratuite. |
| Veed.io | 1 Go annoncé | Filigrane, 720 p maximum, compte obligatoire. |

Formats : CloudConvert annonce 200+ formats ; FreeConvert « plus de 60 » en entrée ; sorties MP4/MOV/MKV/WebM/AVI (page). **Mesure exhaustive des formats de chacun : non faite** (les pages listent des dizaines de conversions, une comparaison tableau par tableau demanderait une journée de plus).

### Ce que l'attente montre à l'utilisateur
FreeConvert : « Uploading 60 % » puis « Converting » puis « Done », et un bouton « Sign up » à côté. CloudConvert : « Uploading / Processing / Waiting ». Aucun e-mail, aucune file numérotée observée en gratuit.

### Niveau à atteindre (retenu)
- **Plafond : 1 Go** (= FreeConvert, CloudConvert, Veed ; 20× Zamzar).
- **Formats de sortie : 19** (12 vidéo + GIF + 6 audio), **entrée : tout ce que ffmpeg décode**. Écart restant vs CloudConvert (200+ formats, dont documents et images) : ils sont un convertisseur universel, nous restons vidéo/audio.
- **Sans filigrane, sans compte.** Quota par IP à fixer par le propriétaire (proposé : 20/heure, 60/jour), séparé du quota des outils IA.
- **Temps** : ≤ envoi + 0,6 × durée de la vidéo pour l'H.264 (mesuré : 0,35× à 8 cœurs, 0,57× à 2 cœurs, ffmpeg local). Progression réelle à chaque étape, jamais un bouton figé.

## 2. AVIF — le marché l'offre, donc nous aussi (étape 2)

- **Le marché** : Squoosh (AVIF, WebP, JPEG XL, MozJPEG, OxiPNG), TinyPNG (AVIF, WebP, JPEG, PNG), CloudConvert (JPG/PNG → AVIF), Convertio (284 directions pour l'AVIF), iLoveIMG (PNG ↔ AVIF). **L'AVIF est offert partout** → la règle du maximum de formats s'applique.
- **Encodeur** : `@jsquash/avif` 2.1.1 (issu de Squoosh) = libavif + libaom compilés en WebAssembly. **Licence Apache-2.0** (libavif et libaom : BSD-2-Clause + licence de brevets Alliance for Open Media, gratuite). Dernière publication : 20 mai 2025 — maintenance lente, à surveiller.
- **Poids mesuré** : `avif_enc.wasm` 3,49 Mo décompressé, **1,12 Mo sur le réseau (gzip)**. Chargé uniquement au premier choix de l'AVIF.
- **Vitesse mesurée** (Node, un cœur, une image extraite d'une vidéo) : 1920×1080 → **2,3 s** (295 Ko) à la vitesse 8, 5,3 s à la vitesse 6 ; 4000×3000 (12 Mpx) → **8,1 s** (650 Ko) à la vitesse 8.
- **Décision : dans le navigateur, pas sur le service.** L'image ne quitte jamais l'appareil (promesse du site : « 100 % local »), aucun plafond d'envoi, coût nul. Le service serveur n'apporterait que de la vitesse, au prix de la confidentialité et du chemin d'envoi. Construit : l'encodeur tourne dans le worker existant d'`image-converter` (version mono-thread : la version multi-thread exige `SharedArrayBuffer`, que le site n'active pas), sortie vérifiée (boîte `ftyp avif`), option **réactivée**, textes réécrits (« PNG, JPG, WebP ou AVIF »).
- **Vérification réelle** (`scripts/browser-tests/e2e-avif.mjs`) : voir §6.

## 3. Le moteur vidéo — trois familles comparées, une décision (étape 3)

Volume : aujourd'hui zéro trafic ; demain quelques centaines de conversions par mois. Tarifs Railway lus le 20/09/2026 : 20 $/vCPU-mois et 10 $/Go-mois **facturés à la seconde**, 0,05 $/Go de sortie.

| | A. **Service ffmpeg sur Railway** (retenu) | B. API de transcodage tierce | C. Rester sur ffmpeg.wasm (navigateur) |
|---|---|---|---|
| Coût à trafic nul | **0,00 $** (veille Serverless, comme le détourage) | 0 $ | 0 $ |
| Coût à 500 conversions/mois (vidéo de 2 min, ~1 min d'encodage sur 2 vCPU / 2 Go) | ≈ 500 × 0,0014 $/min ≈ **0,70 $** + sortie 10 Go ≈ 0,50 $ → **≈ 1,2 $/mois** | AWS MediaConvert 0,0075-0,015 $/min de sortie ⇒ 1 000 min ≈ **7,5-15 $** ; Coconut 0,0075-0,015 $/min ; Google Transcoder 0,005-0,010 $/min | 0 $ |
| À 5 000 conversions/mois | ≈ 12 $ | 75-150 $ | 0 $ |
| Formats de sortie | Tous ceux de ffmpeg (19 livrés) | Profils fixes : **pas d'AVI/WMV/FLV/OGV/GIF/extraction audio** chez la plupart → viole la règle de couverture | Limité au cœur wasm |
| Vitesse | 0,35-0,57 × la durée | Rapide, mais compte de stockage, files, webhooks | ~1× la durée, 32 Mo de moteur, mémoire iPhone |
| Contrainte d'envoi | Envoi direct (construit) | Exige un stockage S3/GCS + IAM + URLs signées **en plus** | Aucune |
| Vie privée | Fichier supprimé après traitement (testé) | Fichier chez un tiers | Reste sur l'appareil |
| Risque fournisseur | Railway déjà utilisé (3 services) ; ffmpeg statique hébergé par un seul mainteneur (voir ci-dessous) | AWS/Google ne ferment pas ; Coconut est un petit éditeur | Aucun |

Autres voies examinées : **Vercel Sandbox** (micro-VM Firecracker) — n'évite pas le chemin d'envoi (les fichiers y entreraient par une fonction), et le plan Hobby exclut l'usage commercial ; **Cloudflare Stream** — c'est de la diffusion, pas de la conversion à télécharger. Non retenues.

**Décision : A.** Justification en une phrase : c'est la seule voie qui couvre 100 % des formats promis, coûte ≈ 1 $/mois au volume visé, garde le fichier sous notre contrôle, et **réutilise un modèle qui a déjà remplacé un fournisseur payant** (détourage). C (le navigateur) reste le bon choix pour le **trimmer** (coupe sans ré-encodage 0,2-0,9 s), pas pour l'encodage.

**Vérifications de fermeture / licence (interdit permanent n° 14, 15)** :
- Railway : déjà fournisseur du projet, tarification lue en direct ce jour.
- ffmpeg : build statique 7.0.2 de johnvansickle.com, **GPLv3**. Le binaire **s'exécute sur notre serveur et n'est jamais distribué** aux visiteurs — ce que visent les clauses de distribution de la GPL. x264 : pas de redevance pour de la vidéo Internet gratuite à cette échelle. **Risque réel : l'hébergement de ce binaire dépend d'un seul site.** Le build vérifie le SHA-256 (`abda8d77…cf67`, calculé sur les 41 888 096 octets réellement téléchargés) et échoue si le fichier change ; si l'URL disparaît, le déploiement échoue proprement et l'ancienne version continue de tourner. Premier geste alors : ré-héberger ces octets exacts dans une Release GitHub du dépôt (non fait préventivement, comme pour le modèle de détourage).
- Base de l'image : la même que `background-removal` (tag + digest déjà vérifiés le 14/09).

## 4. Le chemin d'envoi — un mécanisme, deux problèmes (étape 4)

**Retenu : billet signé + envoi direct par morceaux vers le service** (le mécanisme de FreeConvert, sans dépendance tierce).
1. `POST /api/media/ticket` (petit JSON, après la limite par IP) → billet HMAC-SHA256 valable **15 min pour un seul job** (`lib/media/ticket.js`).
2. Le navigateur envoie **directement** au service : création du job, morceaux de 8 Mio (`PUT`, **SHA-256 par morceau vérifié par le service**, exigé), reprise après coupure, démarrage.
3. Progression réelle par interrogation, puis **un seul téléchargement** du résultat.

**Sécurité, chaque point testé** : requête non signée → 401 ; signature d'une autre clé, billet expiré, billet d'un autre job, identifiant de job traversant (`../..`) → 401 ; un billet ne crée pas deux jobs ; CORS restreint aux origines déclarées ; entrée détruite dès la fin du traitement ; sortie détruite après un téléchargement complet ; balayeur pour les jobs abandonnés ; aucun nom de fichier ni contenu dans les journaux ; playlists/concat hostiles refusées (`ffconcat` testé) ; délai maximal, taille et durée maximales.

**Bug trouvé et corrigé par les tests, à retenir :** dans le WebKit de Playwright, `XMLHttpRequest.send(file.slice(a, b))` **envoie les octets du premier morceau pour chaque morceau** (constaté : l'octet 8 388 608 du fichier reçu = l'octet 0 de l'original). Le fichier arrivait corrompu et le service le refusait (« could not be read as a video »). Correctifs : envoi d'un `ArrayBuffer` lu par `slice().arrayBuffer()` (vérifié correct) **et** empreinte SHA-256 par morceau, refusée à l'arrivée si elle diffère. Un envoi corrompu ne peut plus être accepté, quel que soit le navigateur.

**Office (défaut D8, plafond 4,4 Mo) — NON branché, et c'est un choix.** Le même mécanisme s'y applique en deux temps : le navigateur dépose le fichier sur le service (opération « stage »), puis appelle la route existante avec une simple référence ; la route récupère le fichier **de serveur à serveur** (une fonction n'a pas de plafond pour ses appels sortants), applique le correctif de polices `xlsxDefaultFont` puis Gotenberg, dépose le PDF sur le service, et le navigateur le télécharge. Ce que je n'ai **pas** fait : refactorer la route `convert-to-pdf` (368 lignes, quotas, ConvertAPI) et ses pages sans pouvoir la faire tourner contre le Gotenberg de production (ses identifiants ne se relisent pas localement : `vercel env pull` renvoie les secrets vides) ni contre un service déployé. Livrer ce code sans preuve reviendrait à risquer la production Office → PDF, qui marche. **Chiffrage : 8-12 h** (opération « stage » + deux points d'entrée serveur du service ≈ 2 h ; refactor de la route et des pages Office ≈ 4-6 h ; tests contre un Gotenberg de préversion ≈ 2-4 h). Une note de plateforme lue en début de session prétend que « Vercel Functions accepte 100 Mo » ; **la mesure du 19/09 (refus à 4 517 676 octets) prévaut** et la documentation officielle consultée dit toujours 4,5 Mo. À re-tester en direct avant de refactorer.

## 5. Preuves (étape 6) — ce qui est prouvé et ce qui ne l'est pas

**Service, 59 tests réels** (`services/media-processing/tests/run_tests.py`, vrai ffmpeg, vrai HTTP) : authentification (8), CORS (2), validation dont fichier non-vidéo et playlist hostile (5), reprise et idempotence (7), compression réelle d'un fichier de 20,7 Mo, **les 19 formats de sortie produisent un fichier lisible avec la bonne extension**, annulation, saturation, délai maximal, limites de taille/durée, démarrage impossible sans variables.

**Navigateurs réels, pages réelles, service réel** (`scripts/browser-tests/e2e-video-service.mjs`, seul le billet est fourni localement, car la limite par IP exige la base de production) : voir §6.

Mesures (machine de bureau 8 cœurs, service en local, **boucle locale sans latence Internet — à ne pas lire comme un temps utilisateur réel**) :

| Opération | Total, envoi + traitement + téléchargement |
|---|---|
| Compresser 30,4 s / 20,7 Mo → 12,9 Mo (−38 %) | ≈ 16-19 s |
| Convertir un `.mov` de 2 min (13,8 Mo) → MP4 3,5 Mo | ≈ 6 s |
| Extraire l'audio en MP3 (30 s) | ≈ 1,5-2 s |
| Vidéo 30 s → GIF animé | ≈ 37-40 s, **70 Mo** (un GIF de 30 s en 1080p est énorme ; sortie limitée à 640 px, 12 images/s) |
| WebM (VP9) d'un clip de 6 s | 6 s après réglage (52-68 s avec le réglage « good » de départ : **mesure qui m'a fait changer de réglage**, `-deadline realtime -cpu-used 6`) |
| OGV (Theora) d'un clip de 6 s | 11 s (mono-thread ; plafonné à 720 p) |

**Pourquoi je ne conclus pas « égal ou supérieur au marché »** :
1. Je n'ai **aucun temps total concurrent** : FreeConvert m'a bloqué à 20 crédits gratuits après mes essais, les quatre autres n'ont pas pu être menés à terme (éditeurs, comptes). Comparer mes chiffres locaux (sans Internet) à des sites distants serait malhonnête.
2. Le service tourne sur ma machine, pas sur Railway : sur 2 vCPU on peut compter ×1,4 plus lent (mesuré au ffmpeg local à 2 threads : 17,1 s contre 12,0 s à 8 threads pour la même vidéo), mais la vitesse réelle de Railway n'est pas mesurée.
3. Aucun test sous Safari réel.

**Saturation (testée)** : avec 1 traitement simultané et 1 place d'attente, le 1ᵉʳ job traite, le 2ᵉ attend (`queuePosition: 1`, affiché « Waiting for a free slot — you are number 1 in line »), le 3ᵉ reçoit **503 « busy »** avec son envoi **conservé** ; l'interface affiche « All conversion slots are busy — waiting for a free one… » et **retente toutes les 3 s** jusqu'à 10 min ; dès qu'une place se libère il démarre. Valeurs proposées en production : 2 traitements simultanés, 10 places d'attente.

## 6. Résultats dans les navigateurs

**Service + pages réelles (`e2e-video-service.mjs`) — 24 vérifications sur 24, dans les trois moteurs** (Chromium, Firefox, WebKit de Playwright — **pas Safari**) : compression 30 s / 20,7 Mo → 12,9 Mo, `.mov` de 2 min → MP4 3,5 Mo, MP3, GIF ; à chaque fois un fichier réel, la bonne extension, une progression réelle affichée (envoi, traitement en pourcentages, téléchargement), avant/après affiché. Temps totaux mesurés sous charge (machine de bureau, boucle locale) : compression 20-22 s, `.mov` 6-9 s, MP3 1,5-5 s, GIF 37-41 s.

**Le premier passage WebKit a échoué 8/8**, et c'est ce qui a révélé le bug d'envoi décrit au §4 (morceaux corrompus) ; après correctif, 8/8. Sans ce test, le service aurait été livré cassé sous tout navigateur WebKit.

**AVIF (`e2e-avif.mjs`)** : Chromium et Firefox — option activée, fichier `.avif` réel (boîte `ftypavif`), **4 799 Ko (PNG) → 458 Ko**, décodé par le navigateur lui-même (1920×1080) ; durée 2,4 s (Chromium) mais **15,3 s (Firefox)** : l'encodeur wasm y est ~6× plus lent. **WebKit de Playwright : non testable** — ce build n'a pas `OffscreenCanvas`, donc `image-converter` ne peut rien convertir dans aucun format (Safari 16.4+ l'a). Le convertisseur affiche désormais un message clair au lieu d'une erreur technique.

**Sécurité de la bascule** : build local **sans** `NEXT_PUBLIC_MEDIA_SERVICE_URL` → les deux pages servent leur ancienne version (texte « MediaRecorder » présent, aucun texte du service) ; `POST /api/media/ticket` répond `503 not_configured` sans nommer de valeur. Le déploiement de ce lot ne change donc **rien** au comportement des deux outils vidéo tant que le propriétaire n'a pas défini la variable ; il change `image-converter` (AVIF).


## 7. Runbook de déploiement — à faire par le propriétaire (~30 min)

**Ce que je n'ai pas pu faire** : accès Railway, génération du secret (interdit).

1. **Générer le secret sans l'afficher** (PowerShell ; il va dans le presse-papiers) :
   `$b = New-Object byte[] 32; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); [Convert]::ToBase64String($b) | Set-Clipboard`
2. **Railway** : nouveau service depuis le dépôt, *Root Directory* `services/media-processing`, *Watch Paths* `services/media-processing/**`, build Dockerfile. Variables (toutes obligatoires, valeurs proposées) : `MEDIA_TICKET_SECRET` (coller le secret), `ALLOWED_ORIGINS=https://www.onlineconvertools.com`, `MEDIA_MAX_CONCURRENT_JOBS=2`, `MEDIA_MAX_QUEUED_JOBS=10`, `MEDIA_MAX_FILE_BYTES=1073741824`, `MEDIA_MAX_DURATION_SECONDS=7200`, `MEDIA_JOB_TTL_SECONDS=900`, `MEDIA_FFMPEG_TIMEOUT_SECONDS=1500`, `MEDIA_WORK_DIR=/tmp/media-jobs`, `MEDIA_FFMPEG_PATH=/usr/local/bin/ffmpeg`, `MEDIA_CHUNK_BYTES=8388608`. Puis **« Deploy Changes »**. Activer la **veille Serverless**, un domaine public, taille 2 vCPU / 2 Go.
3. **Vérifier** : `GET https://<domaine>/health` → `{"status":"ok"}` ; `POST /v1/jobs` sans billet → 401 (preuve que le service exécute bien ce code, corollaire 4).
4. **Vercel** (variables Production **et** Preview) : `MEDIA_TICKET_SECRET` (coller le même secret, type *Sensitive*), `MEDIA_TICKET_MAX_BYTES=1073741824`, `MEDIA_JOBS_PER_HOUR_PER_IP=20`, `MEDIA_JOBS_PER_DAY_PER_IP=60` (à ajuster), `NEXT_PUBLIC_MEDIA_SERVICE_URL=https://<domaine>`. **Redéployer SANS cache** (la variable publique est figée au build).
5. **Essayer** `video-converter` (MP4 → MP3 sur un petit fichier) et `video-compressor` sur Chrome, puis **sur Safari Mac et iPhone**. Rendre les verdicts.
6. **Retour arrière** : retirer `NEXT_PUBLIC_MEDIA_SERVICE_URL` et redéployer sans cache : les deux outils reprennent leur ancienne version.

## 8. Coût mensuel retenu et niveau atteint

- **Coût retenu : 0,00 $/mois à trafic nul, ≈ 1,2 $/mois à 500 conversions, ≈ 12 $/mois à 5 000** (Railway, veille Serverless), à confirmer sur la première facture réelle. Aucun coût fixe ajouté.
- **Niveau atteint face au marché** : plafond 1 Go **au niveau de FreeConvert/CloudConvert** (à confirmer après déploiement) ; 19 formats de sortie ; sans filigrane ni compte ; progression réelle ; suppression du fichier après traitement. **Non atteint / non prouvé** : temps total comparé (§5), Safari réel, formats de sortie hors vidéo/audio, branchement Office.

## 9. Ce qui reste, dans l'ordre

1. Déploiement Railway + Vercel (runbook §7) — propriétaire.
2. Retest Safari réel (macOS, iPhone) des deux outils vidéo, d'`image-converter` (AVIF) et de `video-trimmer`.
3. Mesure du temps réel sur Railway avec la même vidéo ; comparaison chez FreeConvert et CloudConvert quand leurs quotas gratuits seront revenus (ou avec un compte, à la décision du propriétaire).
4. Branchement Office (8-12 h) — après re-test de la limite Vercel.
5. Repli du GIF (durée/largeur) si les 70 Mo gênent.
