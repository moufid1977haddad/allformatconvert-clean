# RAPPORT — D8 : routes Office (et voisines) branchées sur l'envoi par morceaux

Dates : 21 septembre 2026. Suite de `RAPPORT-video-deploiement.md` (§6) et `RAPPORT-video-qualite.md`.
Branche `office-envoi-morceaux` (balise de restauration `restore-pre-office-envoi-morceaux`). Le service a été fusionné dans `master` en premier (changement additif, `58fd5cba`), puis les appelants sur la branche.

## 0. Verdict

- **Le plafond de ≈ 4,5 Mo est levé.** Mesuré avec de vrais fichiers, dans un vrai navigateur, contre la préversion et le vrai service : **Word et PowerPoint passent jusqu'à 148 Mo** (33× l'ancien plafond ; Online2PDF annonce 150 Mo), **et échouent à 198 Mo** (mémoire de la fonction Vercel). **Nous annonçons 100 Mo**, avec une marge d'un tiers sous le plus gros fichier réussi.
- **Ce n'est pas partout 100 Mo, et le rapport le dit** : Excel 15 Mo (limité par le *temps* de conversion de Gotenberg, pas par la taille), PDF vers Word 60 Mo, HTML/EPUB/MOBI 30 Mo, PDF Repair et PDF/A 30 Mo, audio 25 Mo (limite de Whisper). Chaque valeur est le plus gros essai réussi, jamais une supposition.
- **Plus lent sur les petits fichiers, comme demandé de le dire : oui**, d'environ 1 à 6 s, donc l'ancien chemin est conservé jusqu'à 4 Mio. **Seuil appliqué : 4 Mio** (jusqu'à la limite de corps de requête de la plateforme, l'ancien chemin est conservé). Détail §4.
- **Quota, limite par IP et plafond de dépense s'appliquent sur le nouveau chemin**, et un contrôle de plus existe : une limite par IP au moment du billet, qui n'existait pas pour `.xlsx`/`.pptx`. Elle s'est **déclenchée en direct pendant mes essais** (§5).
- **Le service n'accepte jamais un envoi non signé** (9 requêtes non signées ou falsifiées refusées en production, §6). Un fichier est détruit dès la fin du traitement.
- **Aucune bascule en production n'a précédé la preuve sur préversion.** Gotenberg de production n'a pas été modifié.

## 1. Balayage : routes qui font transiter un fichier par une fonction Vercel

| Route | Outils | Traitement |
|---|---|---|
| `convert-to-pdf` | word-to-pdf, excel-to-pdf, ppt-to-pdf | **branchée** (seuil 4 Mio) |
| `convert-html-to-pdf` | html-to-pdf, epub-to-pdf, mobi-to-pdf | **branchée** |
| `pdf-to-word` | pdf-to-word | **branchée** |
| `pdf-repair`, `pdf-to-pdfa` | pdf-repair, pdf-to-pdfa | **branchées** (le résultat en base64 dépassait aussi le plafond de *réponse* de 4,5 Mo : la route décode et dépose le PDF sur le service) |
| `ai-transcribe` | audio-to-text, audio-transcriber | **branchée** (trouvée par le balayage) : 4 Mio → 25 Mio, la limite de Whisper |
| `ai-vision` | image-captioner | **non branchée** : l'image part en base64 (plafond 3 Mio). La bonne correction est un redimensionnement dans le navigateur (le modèle réduit lui-même à 2048 px), pas un envoi par morceaux. **À faire, non fait.** |
| `remove-bg` | background-remover | déjà traité (redimensionnement navigateur) |
| `contact` | formulaire | pièces jointes 3 Mio, plafond d'e-mail : hors sujet |

## 2. Mécanisme

`navigateur ─morceaux de 8 Mio, SHA-256 chacun─▶ service (job « stage »)` ; `navigateur ─JSON de ~250 octets {jid, billet}─▶ route du site` ; la route **vérifie le billet** (HMAC, expiration, un seul job, rôle « navigateur »), **en dérive un billet « serveur »** pour le même job, **lit le fichier de serveur à serveur**, appelle le code de conversion **inchangé** (garde de dépense, ConvertAPI/Gotenberg, contrôle `%PDF-`, alertes), **dépose le résultat** sur le service (longueur + SHA-256 + octets magiques vérifiés par le service), puis le navigateur le télécharge et le service le supprime.

- Le service distingue deux rôles de billet : seul le rôle « serveur » peut lire la source ou déposer un résultat ; le navigateur ne peut ni l'un ni l'autre, ni créer un job avec un billet serveur.
- Les routes réutilisent *la même fonction* pour les deux chemins (`convertFile`, `convertPdf`, `convertHtml`, `transcribe`, `repairFile`, `convertPdfa`) : quota, dépense, fournisseurs et messages d'erreur sont identiques. Un refus (429, 503, 413, erreur fournisseur) est renvoyé tel quel et le fichier stagé est détruit aussitôt.
- Fichiers : `services/media-processing/app/{tickets,jobs,main}.py` (type de job `stage`), `lib/media/{ticket.js,staged.js,stagedRoute.ts}`, `app/lib/{mediaJob.js,officeUpload.js}`, les 6 routes, 11 pages.
- Sans `NEXT_PUBLIC_MEDIA_SERVICE_URL`, chaque page retombe sur l'ancien plafond et l'ancien message (`officeMaxBytes()`).

## 3. Plafond réel, mesuré (Chromium réel, préversion + service de production, Vercel Hobby)

Temps = total perçu, du clic au fichier téléchargé, téléversement compris. « ✗ » = échec.

| Type | Taille (Mio) | Résultat | Temps | Sortie |
|---|---|---|---|---|
| **.docx** (ConvertAPI) | 3,8 · 10,2 · 24,9 · 49,4 · 98,7 · **148,1** | ✓ tous | 5,8 · 9,7 · 19,0 · 35,9 · 62,5 · **88,0 s** | jusqu'à 42,8 Mo |
| | 246 | ✗ | 59 s | mémoire de la fonction |
| **.pptx** (Gotenberg) | 4,1 · 10,1 · 25,2 · 49,8 · 99,2 · **148,6** | ✓ tous | 4,2 · 6,0 · 11,8 · 21,9 · 43,4 · **72,3 s** | jusqu'à 149,8 Mo |
| | 197,9 · 247,7 · 395,8 | ✗ | 70-90 s | mémoire de la fonction |
| **.xlsx** (Gotenberg) | 3,3 · **17,6** | ✓ | 10,6 · **51 s** | PDF de 20,7 Mo |
| | 24,7 · 49,5 · 97,2 | ✗ | 68-85 s | erreur Gotenberg |
| **.html** | 8,0 · **30,0** | ✓ | 8,3 · 12,9 s | PDF de 22,5 Mo |
| **PDF → Word** (ConvertAPI) | 3,2 · 30,4 · **60,4** | ✓ | 10,5 · 59,2 · **104,3 s** | jusqu'à 78 Mo |
| **PDF Repair** | 3,2 · **30,4** | ✓ | 4,0 · 15,1 s | |
| **PDF/A** | 3,2 | ✓ | 4,0 s | |
| **Audio** (Whisper) | 5,8 · **24,1** | ✓ | 31 · 48,5 s | transcription reçue |

**Causes des limites (lues, pas supposées) :**
- **Word/PowerPoint > ~150 Mo : `Vercel Runtime Error: instance was killed because it ran out of available memory`** (journal d'exécution, 3 fois). J'ai retiré les copies mémoire du pipeline (fichier lu comme `Blob` partagé, dépôt sans copie, réponse portée par `rawBody` au lieu d'être recopiée dans un corps de `Response`) : l'échec à 198 Mo a subsisté après ces correctifs (74,6 s). Le plafond n'est donc plus une question de code mais de **taille de fonction** (Hobby). Aller plus haut demande de la diffuser en flux de bout en bout ou un plan Vercel supérieur (plus de mémoire) : à trancher si la concurrence à 1 Go devient un argument.
- **Excel > ~20 Mo : `API_TIMEOUT` de Gotenberg = 60 s** (valeur lue sur `gotenberg-v2` et `gotenberg-fonts`, cette seule variable, tout le reste filtré). Le classeur de 17,6 Mio (12 colonnes × ~500 000 lignes) a mis ~50 s ; celui de 24,7 Mio est coupé. **Je n'ai pas modifié ce réglage de production** (redéploiement de Gotenberg de production = décision du propriétaire). *Recommandation : passer `API_TIMEOUT` à 180-240 s, ce qui relèverait le plafond Excel ; à retester avec les mêmes fichiers.*
- **Plafond ConvertAPI de 25 Mo (spec §5) : auto-imposé, pas celui de ConvertAPI.** Il refusait un `.docx` de 50 Mo après l'envoi. ConvertAPI a converti 98,7 et 148 Mio. La constante passe à 100 Mio.
- **Correction d'une hypothèse que j'avais écrite puis réfutée par la mesure :** je pensais que l'ancien chemin échouait aussi quand le PDF *produit* dépasse ~4,5 Mo (plafond de réponse de Vercel). **Faux** : un classeur de 3,8 Mio a produit un PDF de **10,1 Mo** renvoyé sans erreur par l'ancien chemin (production, 22,9 s). Seul le corps de *requête* est plafonné. Le nouveau chemin renvoie quand même 100+ Mo (PDF de 149,8 Mo livré).

**Plafonds annoncés** (constantes dans `lib/quota/limits.js`, affichés avant la sélection, contrôlés dans le navigateur ET côté route) : Word/PowerPoint **100 Mo** · Excel **15 Mo** · PDF→Word **60 Mo** · HTML/EPUB/MOBI **30 Mo** · PDF Repair et PDF/A **30 Mo** · Audio **25 Mo**. **Un fichier de 24,7 Mo dans Excel est refusé avant tout envoi, avec le message honnête** (prouvé), de même qu'un PDF de 100,3 Mo dans PDF→Word.

**Textes corrigés une seconde fois :** FAQ de la catégorie `pdf-tools` (« jusqu'à 4 Mo » → valeurs ci-dessus), FAQ de `audio-tools` (« 4 Mo » → 25 Mo), FAQ d'`audio-to-text` et d'`audio-transcriber`, FAQ de `pdf-repair`, texte d'aide sous chaque champ de fichier, commentaires du code (`convert-to-pdf`, `convert-html-to-pdf`). Recensement par expression régulière (`4 MB`, `hosting platform`, `PLATFORM_LIMIT_HINT`) sur `app/` et `lib/` : plus aucune occurrence de l'ancien plafond sur les pages branchées. Les métadonnées (`<title>`, `<meta description>`) ne citaient aucun plafond. Reste `image-captioner` (3 Mio, non branché).

## 4. Temps perçu, petits fichiers : le nouveau chemin est plus lent

Fichiers réalistes générés avec de vraies images (Word 3,8 Mio, Excel 3,3 Mio, PowerPoint 4,1 Mio). Chemin actuel mesuré sur la production, nouveau chemin sur la préversion (les deux avec envoi compris, poste de bureau rapide, service chaud).

| | Chemin actuel (2-3 essais) | Nouveau chemin (3-4 essais) | Écart |
|---|---|---|---|
| Word 3,8 Mio | 4,6 · 4,7 · 6,6 s | 4,6 · 5,8 · 8,5 · 9,9 · 10,9 s | **+0 à +6 s** |
| Excel 3,3 Mio | 7,8 · 8,7 · 8,7 s | 10,6 · 11,5 · 11,7 · 14,8 s | **+3 à +6 s** |
| PowerPoint 4,1 Mio | 2,2 · 3,3 · 3,9 s | 3,8 · 3,8 · 4,0 · 4,2 · 5,6 s | **+1 à +2 s** |

**Décomposition d'un essai PowerPoint 4,1 Mio (5,6 s)** : billet 1,1 s (site + deux compteurs), création du job 0,5 s, envoi 1,4 s, démarrage 0,2 s, conversion 2,0 s (dont lecture et dépôt serveur à serveur), téléchargement ~0,4 s. **L'ancien chemin n'a ni billet, ni création, ni démarrage, ni dépôt, ni téléchargement séparé : le surcoût est ≈ 2 s de tours réseau fixes**, plus la variabilité de ConvertAPI/Gotenberg.

**Décision : seuil de 4 Mio** (`OFFICE_STAGED_THRESHOLD_BYTES`, `lib/quota/limits.js`, égal à l'ancien plafond de plateforme). Jusqu'à 4 Mio, requête multipart directe comme avant (prouvé sur la préversion : un `.docx` de 40 Ko passe en 2,2 s sans aucun morceau) ; au-dessus, envoi par morceaux, seul chemin possible. Le nouveau chemin n'est donc plus lent pour personne : les visiteurs qui étaient déjà servis gardent leur vitesse, et ceux qui ne l'étaient pas (fichier > 4 Mio) sont servis. Le seuil se règle par une constante.
**Piste non faite pour gagner ces 2 s au-dessus du seuil :** commencer l'envoi dès le choix du fichier (le billet et le téléversement se déroulent pendant que le visiteur lit la page). À arbitrer : cela consomme un billet même si le visiteur ne clique jamais.

## 5. Quota, limite par IP, plafond de dépense

- **Garde de dépense (`guardPaidRoute` : limite par IP 30/h et 100/jour, réservation du plafond global de 20 $)** : appliquée par *la même fonction* sur les deux chemins, pour `.docx` et PDF→Word (ConvertAPI) et pour l'audio (Whisper). Un refus est renvoyé tel quel et le fichier stagé détruit (`respondStaged`).
- **Nouveau : limite par IP au billet** (`office_rate:hour|day`, réglages `MEDIA_JOBS_PER_HOUR_PER_IP` = 20 et `_PER_DAY` = 60, compteurs distincts de la vidéo et des outils payants). Elle protège aussi `.xlsx`, `.pptx`, HTML, qui n'avaient **aucune** limite par IP sur l'ancien chemin. **Prouvé en direct** : après une quarantaine de billets pendant mes essais, chaque nouvel essai a été refusé en 0,2 s avec « Too many conversions from your connection this hour », sans aucun envoi, jusqu'au changement d'heure UTC (22:00), où les essais ont repris.
- **Coût ConvertAPI d'un gros fichier :** la réservation de dépense est plate (0,01 $) et réconciliée sur le coût réel. J'ai ajouté une ligne de journal `[convertapi] … cost_micros=… input_mb=…` (aucun nom ni contenu) pour voir si un gros fichier coûte plus d'un crédit. **À lire dans le journal après les premiers gros `.docx` de production ; non mesuré ici.**
- **Non contourné :** un fichier plus gros ne change ni le nombre d'appels comptés ni le plafond global ; l'audio à 25 Mio réserve 0,66 $ au pire cas (au lieu de 0,26 $ à 10 Mio) contre le plafond de 20 $ — noté, pas modifié.
- **Limite connue :** le compteur au billet est *par IP* : un bureau ou une école partagent les 20 billets par heure (même remarque que pour la vidéo).

## 6. Sécurité et destruction des fichiers

- **32 tests réels** sur le service (`services/media-processing/tests/run_stage_tests.py`, HTTP réel) : lecture de la source refusée au navigateur, dépôt refusé au navigateur, billet d'un autre job, mauvaise signature, billet expiré, création de job avec un billet serveur, mauvais SHA-256, octets non PDF, extension inconnue, taille au-dessus du billet et du service, morceau altéré, démarrage incomplet, source détruite au dépôt, tout supprimé après un téléchargement complet, `DELETE` détruit un fichier stagé. **8 tests** côté site (`scripts/media-tests/staged.test.mjs`) contre un service simulé, dont l'**interopérabilité JS↔Python** du billet de rôle serveur.
- **En production** (`scripts/media-tests/live-stage-security.mjs`, aucun fichier envoyé) : création sans billet, avec billet falsifié, morceau sans billet, source sans billet, source avec faux billet serveur, dépôt sans billet, dépôt avec faux billet serveur, résultat sans billet, suppression sans billet : **9 refus sur 9 (HTTP 401)**.
- **Destruction :** la source est effacée à l'instant où le résultat est déposé (ou en cas d'échec, immédiatement) ; le résultat après un téléchargement complet ou 15 min ; un balayeur supprime tout job abandonné.
- **Origine de préversion** : ajoutée à `ALLOWED_ORIGINS` du service (variable non secrète) le temps du test — **à retirer avant la fin, voir §9**.

## 7. Compatibilité navigateurs

Pptx de 10 Mio (2 morceaux), vraie page : **Chromium 6,0 s ✓ · Firefox 7,0 s ✓ · WebKit 6,6 s ✓**. Le WebKit de Playwright a signalé **une erreur de page non identifiée** (le résultat est correct) ; **Safari réel non testé** (bloquant 9). Le correctif du bug `Blob.slice` de WebKit (octets envoyés par `ArrayBuffer`) est réutilisé tel quel.

## 8. Points consignés à la demande du propriétaire

**8.1 Saturation — à trancher AVANT Product Hunt.** Au-delà du rang 2-3 sur les jobs lourds, les visiteurs attendent (WebM de 3 min : 147 s par rang). Le registre des jobs est en mémoire : **monter en charge = agrandir le service (CPU/mémoire), pas ajouter des réplicas.** Les jobs « stage » ne prennent **aucun** des 2 emplacements ffmpeg (ils ne font que stocker) : ils n'aggravent pas la file vidéo, mais ils partagent le disque et la bande passante du service. Le goulot des documents est ailleurs : la mémoire de la fonction Vercel et Gotenberg (3 réplicas prévus avant le lancement). *Inscrit au plan comme point à trancher avant le lancement.*

**8.2 Fichier proche du plafond : éprouvé.** Le plus gros essai réel est passé de 72 Mo à **396 Mo envoyés au service** (les 396 Mo ont été reçus, assemblés et vérifiés ; la conversion a échoué côté fonction) et **148,6 Mio convertis de bout en bout** (Word et PowerPoint). Un vrai fichier de 1 Go n'a pas été essayé : la fonction Vercel cède avant.

**8.3 Coût Railway : relevé réel** (API d'usage, tarifs du 20/09 : 20 $/vCPU-mois, 10 $/Go-mois, 0,05 $/Go sortant ; ce n'est pas une facture). Depuis le 20/09 00:00 UTC (~46 h) pour `media-processing` : **135,0 vCPU-min, 38,5 Go-min de mémoire, 5,83 Go sortis, 6,78 Go reçus ≈ 0,36 $** (0,06 calcul, 0,01 mémoire, 0,29 sortie réseau). Sur les seules ~2 h d'essais Office d'aujourd'hui : **0,6 vCPU-min, 8,6 Go-min, 3,6 Go sortis ≈ 0,18 $**, soit ~60 essais dont des fichiers de 100 à 400 Mo. **Un document « stage » ne consomme quasiment aucun CPU** (le service ne fait qu'écrire et lire) : le coût est la bande passante sortante, **2 × la taille du fichier** (lecture par Vercel + téléchargement du résultat). **Un Office de 10 Mo ≈ 0,001 $ ; de 100 Mo ≈ 0,01 $.**
**Chiffre du plan corrigé :** l'ancien « ≈ 1-2 $/mois à 500 conversions » (vidéo) reste plausible pour la vidéo ; **pour 500 conversions Office de 10 Mo : ≈ 0,5 $/mois ; de 100 Mo : ≈ 5 $/mois** (extrapolation à partir de ces mesures, non une facture). **Observation hors sujet mais mesurée :** `gotenberg-v2` a consommé 2 048 Go-min de mémoire sur la même fenêtre (≈ 0,47 $ pour ~46 h, soit de l'ordre de 7 $/mois si cela reste constant) : la mémoire résidente de Gotenberg pèse plus que tout le reste ; à confronter à la ligne « ~2 $/mois » du plan.

## 9. Ce qui n'est pas fait, ou reste à faire

- **Préversion → production, ordre suivi :** service fusionné en premier et vérifié (`stage:true`, 401 sans billet) ; appelants prouvés sur préversion ; puis fusion. Voir §10 pour la vérification en production, **et pour le retrait de l'origine de préversion.**
- **`image-captioner`** : non branché (redimensionnement navigateur à faire).
- **Excel au-delà de 15 Mo** : dépend d'`API_TIMEOUT` de Gotenberg (décision du propriétaire).
- **Word/PowerPoint au-delà de ~150 Mo** : mémoire de la fonction ; à trancher si la concurrence à 1 Go devient un argument.
- **Fichiers proches de 60 Mo en PDF→Word et 30 Mo en PDF Repair** : plus gros essais réussis ; pas de marge mesurée au-delà.
- **Safari réel / iPhone** (bloquant 9) ; l'erreur de page WebKit non identifiée.
- **DPA ConvertAPI** : toujours à signer par le propriétaire avant Product Hunt ; les `.docx` jusqu'à 100 Mo transitent maintenant par ConvertAPI (la limite de 25 Mo qui bornait cette exposition a disparu).
- **Écart à la règle « égal ou supérieur »** : FreeConvert annonce 1 Go (non éprouvé). Nous tenons 148 Mio en Word/PowerPoint (annoncé : 100 Mo), Excel 15 Mo, PDF→Word 60 Mo : **supérieur à Online2PDF (150 Mo annoncés) pour Word/PowerPoint seulement à l'essai brut, inférieur pour Excel et PDF→Word tant que les limites ci-dessus ne sont pas levées.** À ne pas écrire « meilleur que le marché ».

## 10. Livrables

Service : `services/media-processing/app/{tickets,jobs,main}.py`, `tests/run_stage_tests.py` (32 tests). Site : `lib/media/{ticket.js,staged.js,stagedRoute.ts}`, `lib/quota/limits.js`, 6 routes, 11 pages, `app/lib/{mediaJob.js,officeUpload.js}`. Scripts : `scripts/media-tests/{staged.test.mjs,live-stage-security.mjs}`, `scripts/browser-tests/{e2e-office-remote.mjs,e2e-audio-remote.mjs,e2e-pdftools-remote.mjs}`. Plan mis à jour : blocs 2 bis, 6, ADMINISTRATIF, déclencheurs, critère de lancement.
