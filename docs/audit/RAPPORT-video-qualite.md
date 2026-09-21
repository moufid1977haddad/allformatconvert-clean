# RAPPORT — Chantier qualité vidéo : qualité mesurée, réglages d'encodage, H.265/AV1, formats, saturation, coût

Dates : 20-21 septembre 2026. Suite de `RAPPORT-video-deploiement.md`.
Branche `video-qualite` (balise de restauration `restore-pre-video-qualite`), fusions successives dans `master` : `8b3b567d`, `056e8bda`, `361c646f`, `933179dd`, `be490233`, `cd81d28e`.

## 0. Verdict

- **Le tableau du rapport précédent était faux, et je l'ai refait.** Il comparait des sorties de qualité très inégale, et **toutes les mesures de qualité que j'avais commencées à publier étaient faussées par mon protocole** (§1). Le tableau à trois colonnes (temps · taille · qualité mesurée) est au §2.
- **À qualité comparable, nous restons plus rapides que tous les concurrents mesurés, mais de moins qu'avant** : nous avons choisi de dépenser du temps pour la qualité et la taille. WebM 30 s : 83,7 s contre 100 s (Online-Convert) et 203 s (FreeConvert) ; 3 min : 147 s contre 223 s (FreeConvert). **Qualité à taille égale : équivalents, à ± 1 point de VMAF.**
- **Aucun de nos outils ne rend plus un fichier plus lourd que sa source sans le dire** : le compresseur renvoie soit un fichier plus petit, soit un message honnête sans fichier ; le convertisseur applique une échelle de réencodage (exception documentée : MPEG-2).
- **34 formats de sortie (avant : 19), dont H.265 et AV1.** L'image du service a changé de ffmpeg pour embarquer SVT-AV1.
- **Saturation et coût mesurés en production.** Le service tient 4 visiteurs simultanés ; coût mesuré ≈ 0,0013 $ par conversion légère.
- **Quatre points de votre dernier message :** le 2 (fausses FAQ) est fait, le 3 (DPA) et le 4 (contrôles de la vague 1) sont inscrits au plan, la ligne du 1 (D8 avant le lancement) est corrigée ; **le branchement des routes Office (D8) lui-même n'est pas fait dans cette passe** (§9).

## 1. Correction de mes erreurs de mesure

1. **Unités.** Le rapport précédent comparait des Mo décimaux à des Mio : notre WebM faisait **47,0 Mo** (et non « 44,8 »), FreeConvert 44,1 Mo, la source 21,7 Mo (et non « 20,7 »), la vidéo de 3 min 71,8 Mo (et non « 68 »). « Comme nous » était faux : nous étions 6,6 % plus lourds.
2. **Protocole de qualité.** Ma première mesure VMAF donnait 79,9 pour notre WebM de 47 Mo, alors qu'un MP4 H.264 de 22 Mo obtenait 92,9. Impossible. Le diagnostic, image par image : ~3 % des images WebM étaient **mal appariées** à leur image source, parce que les horodatages WebM sont en millisecondes (décalage de 7 ms au départ, arrondis ensuite) alors que la source est en 1/15360 s. Sur les images correctement appariées, le WebM était à 38-40 dB, comme le MP4. **Protocole corrigé, appliqué à tous les fichiers, concurrents compris** : `setpts=PTS-STARTPTS`, rééchantillonnage à cadence constante (`fps=…:round=near`), même format de pixels, puis `libvmaf` (modèle v0.6.1, moyenne sur toutes les images) + PSNR-Y + SSIM en une seule passe. Résultat : notre WebM de 47 Mo passe de « 79,9 » à **98,3**. **Tous les VMAF publiés avant cette correction sont invalides.** Une deuxième tentative d'alignement par numéro d'image a donné un résultat pire (65) et a été écartée : la source a une cadence légèrement variable.
3. **Comparaison des concurrents, à corriger aussi** : leurs sorties (WebM) avaient subi le même défaut de mesure. Elles sont remesurées ici.

Sources mesurées : `s30.mp4` (30,44 s, 1080p, 30 i/s, 21 657 943 octets, séquence à main levée en sous-bois : **contenu très difficile** — un H.264 de qualité quasi transparente (VMAF 95,9) y pèse 27,8 Mo, plus que la source elle-même) et `surf.mp4` (3:03, 720p, 71 753 110 octets).

## 2. Tableau à trois colonnes : temps · taille · qualité

Temps = total perçu par le visiteur (clic → fichier téléchargeable, téléversement compris), mesuré dans un vrai navigateur sur www.onlineconvertools.com. Taille en octets décimaux. VMAF = moyenne contre la source (source = 100).

**MP4 → WebM, 30 s** (source 21,7 Mo)

| | Temps | Taille | VMAF |
|---|---|---|---|
| **Nous** (production, réglages finaux) | **83,7 s** | **18,8 Mo** | **91,9** |
| Online-Convert | ≈ 100 s | 9,9 Mo | 82,3 |
| FreeConvert | 203 s | 44,1 Mo | 98,9 |
| Convertio | 251 s | 117,5 Mo | 99,98 |
| Zamzar | non fini à 400 s | — | — |
| 123apps | non mesurable (interstitiel publicitaire plein écran bloquant) | — | — |

**MP4 → WebM, 3 min** (source 71,8 Mo)

| | Temps | Taille | VMAF |
|---|---|---|---|
| **Nous** | **147,0 s** | **52,2 Mo** | **93,5** |
| FreeConvert | 223 s | 56,9 Mo | 94,6 |
| Online-Convert | non fini à 500 s | — | — |

**Nos autres sorties, mêmes conditions** (aucune mesure concurrente pour elles)

| Sortie | 30 s : temps · taille · VMAF | 3 min : temps · taille · VMAF |
|---|---|---|
| MP4 (H.264) | 37,0 s · 19,4 Mo · 94,5 | 36,6 s · 61,0 Mo · 94,7 |
| H.265 (HEVC) | 20,3 s · 18,0 Mo · 90,0 | 58,7 s · 29,8 Mo · 84,9 |
| AV1 | 19,4 s · 18,1 Mo · 93,7 | 29,0 s · 36,4 Mo · 89,5 |
| Compresseur (équilibré) | 15,8 s · 13,5 Mo · 88,4 | 34,6 s · 30,9 Mo · 82,2 |

**Conclusion : à qualité comparable, sommes-nous encore plus rapides, et de combien ?**
- **Oui, sur le WebM, seule sortie où un concurrent a été mesuré** : 30 s → **2,4×** FreeConvert et **1,2×** Online-Convert ; 3 min → **1,5×** FreeConvert (Online-Convert n'a pas fini en 500 s).
- **Qualité à taille égale : équivalents.** À 18,8 Mo nous sommes ~2 points au-dessus de la droite Online-Convert ↔ FreeConvert (interpolation entre deux points seulement : indicative). Sur 3 min, 0,5 à 1 point sous FreeConvert pour 8 % de fichier en moins. À la taille d'Online-Convert (9,9 Mo) je n'ai pas mesuré notre niveau « petit fichier ».
- **Ce que nous refusons de faire :** produire 44 Mo à partir d'une source de 21,7 Mo (FreeConvert, VMAF 98,9). Notre mode lent à 42,6 Mo donne 98,4, mais un fichier plus lourd que la source est, selon votre règle, un défaut.
- **Pour MP4, H.265, AV1 et le compresseur, je ne peux pas conclure « supérieur au marché » : aucune mesure concurrente n'existe.** Les temps de production (16-59 s) sont bas, la qualité est chiffrée, la comparaison reste à faire.

## 3. Réglages d'encodage : ce qui a été mesuré, décidé, rejeté

Banc d'essai local (8 cœurs ; Railway est ~3,8× plus rapide), mêmes protocole et source. Courbes taille/qualité mesurées (30 s) :

| Encodeur / réglage | Temps local | Taille | VMAF |
|---|---|---|---|
| VP9 `realtime` cpu-used 6, CRF 33 (réglage de départ) | 24,8 s | 47,0 Mo | 98,3 |
| idem CRF 42 / 48 / 55 | 25 / 26 / 23 s | 23,2 / 14,4 / 8,3 Mo | 92,9 / 86,7 / 76,7 |
| VP9 `good` cpu-used 4, CRF 33 | 172 s | 42,6 Mo | 98,4 |
| VP9 `good` cpu-used 4, CRF 40 / 46 | 173 / 149 s | 25,4 / 15,9 Mo | 94,8 / 89,2 |
| VP9 `good` cpu-used 5, sans recherche d'images de référence, CRF 42 | 154 s | 20,1 Mo | 92,7 |
| x264 `veryfast` CRF 22 / 24 / 28 | 17,8 / 16,6 / 10,4 s | 27,8 / 22,4 / 13,5 Mo | 95,9 / 92,9 / 83,7 |
| x264 `faster` CRF 28 / 31 | 22,0 / 24,2 s | 17,3 / 11,8 Mo | 92,8 / 85,7 |
| x264 `fast` CRF 28 / 31 / 34 | 31,5 / 23,2 / 28,7 s | 18,4 / 12,7 / 8,4 Mo | 94,7 / 87,9 / 79,4 |
| x264 `medium` CRF 28 / 32 | 37,1 / 34,5 s | 19,0 / 11,4 Mo | 96,3 / 86,6 |
| x265 `veryfast` CRF 28 / 34 | 36,8 / 35,3 s | 18,0 / 7,6 Mo | 90,0 / — |
| AV1 SVT preset 8 CRF 36 / 38 / 44 | 39,7 / 25,6 / 41,5 s | 29,1 / 25,0 / 17,1 Mo | — / 95,9 / — |
| AV1 libaom cpu-used 8 (10 s de vidéo) | 83,8 s | 7,2 Mo | — |

**Décisions**
1. **VP9 : mode lent (`good`, cpu-used 5) jusqu'à 90 « secondes 1080p »**, mode rapide au-delà. À taille égale : ≈ +2 VMAF (≈ 14 % de fichier en moins), pour ~6× le temps. Les concurrents à 100-250 s nous laissent la marge.
2. **x264 : `veryfast` → `faster`.** À VMAF égal, `faster` est ~23 % plus petit (`fast` ~27 %) ; j'ai retenu `faster` : meilleur compromis temps/taille. Niveaux du compresseur recalés : légère 27, équilibrée 30, forte 34.
3. **Plafond de débit rejeté — mesuré.** L'idée « fournir un débit maximal égal à la source » (VBV, `maxrate`, `mbr` d'AV1, `-b:v` de VP9) a été implémentée, testée, puis rejetée : elle **affame les premières secondes complexes**. Sur les 30 premières secondes de la vidéo de 3 min : sans plafond, 0 image sous VMAF 60 ; avec un plafond strict, 22 à 52 images (5 %), VMAF minimal 15 à 45 ; même un plafond plus souple (6 s de tampon) en laisse 14. Ce défaut n'aurait pas été vu à l'œil sur une moyenne (89,0 contre 92,3).
4. **Échelle de réencodage adaptative, à la place.** Un encodage au niveau demandé ; s'il dépasse la source, un nouvel encodage à un CRF calculé d'après l'écart (coefficients mesurés : VP9 7 %/point, AV1 6,4 %, H.265 13 %, H.264 12 %), 3 essais au plus ; un essai est **abandonné dès 12 % d'avancement** si la taille projetée dépasse 125 % de la source. Si le dernier essai est encore plus gros : fichier livré et signalé (`larger`). *Premières versions rejetées :* pas fixes de +6 puis +12 (trop brutaux : un MP4 de 22 Mo tombait à 9,7 Mo) ; coefficient VP9 à 4,5 % (faux, atterrissage à 11,5 Mo de qualité 85 au lieu de ~20 Mo).
5. **Compresseur : jamais plus gros, dit honnêtement.** Niveau suivant essayé une fois ; si le résultat n'est pas au moins 2 % plus petit que la source, **aucun fichier n'est renvoyé** (`notSmaller`, HTTP 410 sur le résultat) et la page dit : « Cette vidéo est déjà bien compressée… nous ne vous avons pas donné de fichier plus gros ; l'original est la meilleure version… réduisez la résolution ». Testé avec une vraie source déjà très compressée (320×180) : 1 tentative pour « forte », 2 pour « équilibrée », aucun fichier servi, aucun fichier laissé sur le disque.
6. **Exception documentée : MPEG-2 (MPG, MPEG, VOB).** Sur ce contenu difficile son encodeur ne descend pas sous +0,3 à +2,2 % de la source (limite de quantification du codec, environ deux fois moins efficace que H.264). Tolérance de +5 % dans le test, et texte de la FAQ du convertisseur : « la famille MPEG-2… quelques pour cent plus grande ».
7. Codecs anciens (mpeg4, XviD, MPEG-2, Theora, WMV) : pas de mode CRF ; un débit dérivé de la source, avec 15 % de marge (mesuré : ils dépassent leur cible de 2 à 8 %). Ils ne montrent pas le défaut d'affamement.

## 4. Couverture des formats

- **Nous : 34 sorties** (avant 19) — vidéo (22) : MP4 H.264, **H.265**, **AV1**, MOV, MKV, WebM, AVI, **XviD**, WMV, **ASF**, FLV, **F4V**, MPG, **MPEG**, **VOB**, TS, **M2TS**, **MTS**, 3GP, **3G2**, M4V, OGV ; GIF ; audio (11) : MP3, M4A, **AAC**, WAV, **AIFF**, OGG, Opus, FLAC, **WMA**, **AC3**, **AMR**. Chaque format est vérifié par un test réel : fichier lisible, durée exacte, bon codec (H.265, AV1, VP9, H.264…), bonne extension, et « pas plus lourd que la source ».
- **Concurrents, listes annoncées par leurs pages (non éprouvées, relevées le 20/09)** : Convertio 37 sorties vidéo dont HEVC et AV1 ; CloudConvert 28 ; Online-Convert 11 (ni HEVC ni AV1) ; FreeConvert « 60+ » en entrée, sorties MP4, MOV, MKV, WebM, AVI, MP3 « et plus ».
- **Hors de portée, avec la raison :** RM/RMVB (aucun encodeur RealMedia dans ffmpeg) ; MXF (profils stricts, aucune demande courante) ; DV (résolution SD fixe) ; CAVS ; WTV/DVR (conteneurs d'enregistrement TV sans encodeur) ; AAF ; SWF (Flash obsolète) ; MJPEG brut. AVCHD est couvert par MTS/M2TS.
- **Entrées** : le service lit tout ce que ffmpeg lit. **La liste d'entrées proposée par le sélecteur de fichier n'a pas été comparée** à celles des concurrents.

## 5. H.265 et AV1 : ce que l'image contenait, ce qu'il a fallu changer

- Image d'origine (ffmpeg 7.0.2 statique, johnvansickle, dernière publication : 2024) : **libx265 3.5 oui ; SVT-AV1 non** ; seulement libaom 3.2 pour l'AV1. Mesuré : **84 s pour 10 s de vidéo**, soit ~250 s pour 30 s de 1080p, ~25 min pour 3 min : inutilisable.
- Remplacé par **BtbN/FFmpeg-Builds n8.1.2**, linux64 GPL statique, étiquette immuable `autobuild-2026-08-31-13-27` (leurs builds de fin de mois sont conservés depuis mai 2025 au moins), **SHA-256 `c733b4b2951e5957e15505f788b2c65a7a41b6da4b289e295852cc38079b4d2b` calculée sur les octets téléchargés** (elle égale l'empreinte publiée par GitHub) et vérifiée à la construction. Archive de **126 Mo contre 42 Mo** ; le build Railway s'est terminé en quelques minutes. Mêmes garanties que pour le détourage : pas de téléchargement non vérifié. Licence GPLv3 : binaire exécuté côté serveur, jamais distribué.
- SVT-AV1 : **26 s pour 30 s de 1080p en local** (preset 8). En production : **AV1 19,4 s / 29,0 s**, **H.265 20,3 s / 58,7 s** (30 s / 3 min). Le service tient ; **aucun redimensionnement nécessaire** à ce volume.
- **Preuve que le nouveau code tourne** (corollaire 4) : `/health` répond `targets: 34` (l'ancienne version répondait seulement `status: ok`), et le statut des jobs expose `attempt`, `larger`, `notSmaller` (lus dans le navigateur par le script de test).

## 6. Saturation

Service : 2 traitements simultanés, 10 places d'attente, un seul processus (registre en mémoire).
- **Production, 4 visiteurs simultanés, compresseur 30 s** (`scripts/browser-tests/e2e-video-concurrency.mjs`, deux séries) : les deux premiers finissent en 30-34 s ; les deux suivants **voient « vous êtes le n° 1 / n° 2 dans la file »**, attendent 14 à 17 s, terminent en 47-49 s (seul : 15,8 s). Aucun message d'occupation, 4 réussites sur 4, 4 fichiers de 13 532 218 octets identiques.
- **Ordre de grandeur (extrapolé, non mesuré au-delà de 4) :** un job léger ≈ 15 s, donc ≈ 7-8 s d'attente par rang. **Acceptable** (≈ 1 min) **jusqu'au rang ~6 pour les jobs légers ; inacceptable dès le rang 2-3 pour les jobs lourds** (WebM de 3 min : 147 s, soit > 2 min d'attente par rang occupé).
- **File pleine** (10 en attente + 2 en cours) : le 13ᵉ reçoit « busy » et son navigateur réessaie toutes les 3 s pendant 10 min ; **prouvé en local** (1 traitement, 1 place, test d'origine), **non éprouvé en production** : la limite de 20 billets par heure et par IP interdit d'aller plus loin. *Conséquence à noter : un groupe derrière une même adresse (école, bureau) atteint la limite bien avant la saturation.*
- **Dimensionnement :** le registre des jobs est en mémoire, donc **monter en charge = agrandir le service, pas ajouter des réplicas**. À revoir si la file dépasse 3-4 en usage réel.

## 7. Coût réel

Relevé par l'API d'usage Railway (pas une facture), tarifs lus le 20/09 : 20 $/vCPU-mois, 10 $/Go-mois, 0,05 $/Go sortant.
- **Lot mesuré proprement** : avant/après quatre compressions de 30 s : **4,5 vCPU-min, 1,66 Go-min de mémoire, 0,058 Go émis, 0,088 Go reçus** (cohérent avec 4 × 13,5 Mo et 4 × 21,7 Mo) → **≈ 0,0013 $ par conversion légère** (0,00052 $ de calcul, 0,00009 $ de mémoire, 0,00068 $ de sortie).
- Job lourd (WebM 3 min) : **estimation non mesurée**, ≈ 20 vCPU-min, ≈ 0,012 $.
- Total depuis le déploiement (≈ 36 h, une centaine de conversions d'essai) : 130,8 vCPU-min, 27,1 Go-min, 2,15 Go émis ≈ **0,17 $**.
- **Coût retenu : 0,00 $ à trafic nul ; ≈ 1 à 2 $/mois à 500 conversions ; ≈ 10 à 20 $/mois à 5 000** (extrapolation selon la part de jobs lourds). Remplace l'estimation de 1,2 $/mois, qui restait dans la fourchette. **À confirmer sur la première facture.**

## 8. Vos quatre points

1. **D8 avant le lancement — ligne du plan corrigée.** Le mécanisme retenu, sa mesure (4 493 821 octets acceptés, 4 493 924 refusés), la décision du propriétaire et l'argument « le mécanisme tourne déjà en production » sont inscrits ; « après le lancement » est barré ; le critère de lancement et le tableau des déclencheurs sont mis à jour. **Le branchement lui-même n'est pas fait** (§9).
2. **Fausses FAQ — corrigées et déployées.** `pdf-tools` : « jusqu'à 100 Mo » → *outils du navigateur (fusion, découpe, compression, éditeur) : 700 Mo sur ordinateur, 100 Mo sur téléphone ; outils qui passent par nos serveurs (PDF vers Word, réparation, PDF/A) : 4 Mo* (valeurs lues dans les `config.js` et les plafonds D10). `audio-tools` : « jusqu'à 500 Mo » (aucune source dans le code) → *outils du navigateur : aucun plafond fixé par nous, limite pratique = mémoire de l'appareil ; Audio to Text : 4 Mo*. Le commentaire faux de `app/api/convert-to-pdf/route.ts` (« Vercel Functions accept request bodies up to 100 MB ») est réécrit avec la mesure. **Recensement** : expression régulière sur `page.*` et `layout.*` (« jusqu'à / maximum / limite … N Mo/Go ») et relevé de tous les nombres « Mo/Go » des pages de catégorie : aucune autre annonce fausse ; les autres occurrences sont des plafonds d'outil dynamiques (constantes de configuration), des tailles de moteur téléchargé, ou des exemples. **À revoir une seconde fois quand D8 sera fait**, inscrit au plan.
3. **DPA ConvertAPI — avant Product Hunt, inscrit au plan avec les étapes** : télécharger le DPA dans le tableau de bord, le signer au nom de la même entité que le contrat principal, le téléverser au même endroit, conserver la copie. **Réserve :** l'article d'aide de ConvertAPI n'était pas joignable depuis ce poste le 20/09 ; les étapes viennent de son extrait dans les résultats de recherche, à confirmer à l'écran. La politique de confidentialité cite déjà ConvertAPI comme sous-traitant.
4. **Cinq contrôles de la vague 1 — écrits en clair dans le bloquant 11, renvoi supprimé.** *Réserve d'honnêteté :* **les deux commits ne contiennent pas de liste intitulée « contrôles »**. `50527805` cite cinq outils (`image-converter`, `audio-trimmer`, `audio-transcriber` corrigés ; `word-to-pdf` et `tar-extractor` reportés à la vague 3, faits dans `eaddc44e` et `990b99a3`), et `b77f988b` corrige `xml-to-json`. J'ai reconstitué un contrôle par outil à partir de ce que ces commits ont réellement modifié, en le disant dans le plan ; ajouté `excel-to-json` (`adf0f1c5`). Si votre liste de départ était différente, c'est elle qui fait foi.

## 9. Ce qui n'est pas fait, et pourquoi

- **D8 : branchement des routes Office sur l'envoi par morceaux — non commencé dans cette passe.** Chiffrage inchangé : 8-12 h (opération « stage » sur le service, deux points d'entrée serveur, refonte de `convert-to-pdf` et des pages Office, preuve contre un Gotenberg de préversion). C'est un chantier à part entière, et le plan lui-même prescrit une session neuve par chantier ; l'engager ici, en fin d'une longue session, risquerait de dégrader la seule route qui marche (Office → PDF). **À ouvrir en premier** : la mesure du 20/09 confirme qu'il est nécessaire et le propriétaire l'a placé avant le lancement.
- **Safari réel et iPhone : non testés** (bloquant 9). Les sorties H.265/AV1 n'ont pas été lues sur Safari : AV1 exige du matériel récent sur Apple.
- **Comparaison concurrentielle pour MP4, H.265, AV1, compresseur : non faite.** Convertio annonce HEVC et AV1 : une mesure est possible sans compte.
- **Essai d'un fichier proche de 1 Go : non fait** (plus gros essai en production : 72 Mo).
- **Coût : à confirmer sur la première facture.**
- **Firefox et WebKit** : les sorties de production n'ont été validées que dans Chromium cette fois (les tests de la veille couvraient Firefox en préversion).

## 10. Incidents de mon fait, à retenir

- **Tableaux faux publiés puis corrigés** (unités, protocole VMAF) : la mesure d'un concurrent ne vaut que si le protocole est validé sur un cas dont on connaît la réponse (ici : un MP4 de 22 Mo ne peut pas valoir 93 quand un WebM de 47 Mo vaut 80).
- **Un plafond de débit « évident » s'est révélé nuisible** : à ne pas réintroduire sans mesurer les creux de qualité image par image, pas seulement la moyenne.
- **Deux fois, des processus détachés (`nohup`) ont survécu à leur commande** et faussé un test (un ancien serveur sur le port 8611 avec une autre clé). Le test a échoué de façon reconnaissable ; les processus ont été tués et la suite rejouée.
- Aucun outil ni service supprimé ou renommé, aucun agent de fond, aucune boucle de surveillance ni réveil planifié, aucun secret lu ou affiché, aucun compte créé chez un concurrent, aucun quota contourné (les essais en production sont passés par la limite normale par IP).

## 11. Livrables

- Service : `services/media-processing/app/ffmpeg_ops.py`, `jobs.py`, `main.py`, `Dockerfile` ; **103 tests réels** (`tests/run_tests.py`) dont : 34 formats, « pas plus lourd », « déjà optimale », saturation.
- Pages : `video-converter` (formats, FAQ), `video-compressor` (FAQ), `MediaServiceTool.jsx` + `mediaJob.js` (message « déjà bien compressée », libellé de l'essai de rattrapage).
- Scripts : `scripts/browser-tests/e2e-video-remote.mjs` (options `FMT=`, `CLIPS=`, `OUT=`, lecture du statut du service), `e2e-video-concurrency.mjs` (saturation).
- Plan mis à jour : bloc 6, D8, DPA, bloc 11, critère de lancement, annexe A (moteurs 16 et 17).
