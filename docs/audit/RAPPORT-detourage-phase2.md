# Détourage — Phase 2 : latence, sécurisation, branchement

**Date : 14-16 septembre 2026**
**Statut : étapes 1-6 codées, mesurées, déployées et vérifiées ; étape 6 complète et verte sur préversion Vercel (§11). Coût de quota corrigé (§9), service Railway redéployé et prouvé sécurisé (§10). Divergence `master`/branche découverte et documentée (§12). Une régression pré-existante hors périmètre découverte pendant les tests (§11.4). Fusion dans `master` : voir §13.**

Branche de travail : `detourage-phase2-latence-securite-branchement`. Tag de restauration posé avant tout changement : `pre-detourage-phase2` (pointe sur `8b7fa278`, dernier commit de la phase 1).

---

## 1. Latence — où passait le temps, et ce qui a été corrigé

### Instrumentation

`services/background-removal/app/infer.py` et `app/main.py` mesurent désormais chaque étape (`time.perf_counter()`) et journalisent une ligne par requête — dimensions et durées uniquement, jamais d'octets d'image ni de nom de fichier :

```
timing_breakdown_seconds size=WxH decode=… preprocess=… inference=… connected_component_filter=… mask_upsample=… cutout=… encode=… total=…
```

### Les trois hypothèses, mesurées sur le service réel (les 6 photos de `docs/audit/detourage-comparaison/photos-test/`)

**Hypothèse (b) — filtre de région connexe à pleine résolution : CONFIRMÉE, cause dominante.**
Avant correction, le filtre (`scipy.ndimage.label`) s'appliquait après l'agrandissement du masque à la résolution de l'image d'entrée (jusqu'à plusieurs mégapixels). Déplacé pour s'appliquer sur le masque brut du modèle (1024×1024, taille fixe) puis agrandi ensuite — calcul strictement moindre pour toute image plus grande que 1024×1024, ce qui est le cas des 6 photos de test. Mesuré :

| | Avant (filtre après agrandissement) | Après (filtre à résolution modèle) |
|---|---|---|
| Temps total par image | 6,7 – 9,9 s | 1,1 – 3,7 s (bruit de mesure important, voir hypothèse a) |
| Coût du filtre lui-même | non isolé avant (compris dans le total) | 0,003 – 0,19 s |

**Sorties vérifiées identiques aux références** (`docs/audit/detourage-serveur/resultats/`) sur les 6 photos, inspection visuelle directe :
- 01, 02, 03, 05, 06 : découpage visuellement identique à la référence locale (02 reproduit le même défaut mineur déjà documenté — corps de l'animal tronqué, connu et accepté, pas une régression).
- 04 (objet transparent) diffère **intentionnellement** de l'image `serveur_comparaison` historique : cette référence a été capturée **avant** l'ajout du filtre plus-grande-région (chantier `RAPPORT-detourage-filtre-sujet.md`, postérieur). Le service réel retire bien la mire de couleurs à côté de la bouteille — exactement le correctif que ce filtre a été conçu pour produire, pas une divergence.

C'est désormais le comportement par défaut (`FILTER_AT_MODEL_RES` non défini = activé). Un bascule vers l'ancien comportement reste possible via la variable d'environnement du même nom, pour comparaison future si besoin — mais rien ne justifie de la définir en production.

**Hypothèse (a) — nombre de threads ONNX Runtime : testée, aucun gain fiable trouvé, aucun changement appliqué.**
`os.cpu_count()` à l'intérieur du conteneur renvoie **48** — confirmé, le conteneur voit bien tous les cœurs de l'hôte, pas la fraction réellement allouée par Railway. Cependant, forcer `intra_op_num_threads=2` a mesuré une inférence **plus lente** (0,76 s en moyenne) que la configuration par défaut (0,60 s en moyenne sur le premier essai, mais 1,47–2,42 s sur un essai ultérieur avec la même configuration par défaut). Cette dispersion — un facteur 3 à 4× sur la même configuration entre deux essais successifs — est **plus grande que tout effet attribuable au réglage des threads testé**. Conclusion : le bruit d'infrastructure (CPU partagé, variance Railway) domine largement ce levier sur ce jeu de mesures ; aucune valeur de threads testée n'a montré un gain reproductible par rapport au défaut (non défini = ONNX Runtime décide lui-même). **Laissé tel quel.** Le code garde les variables `ORT_INTRA_OP_THREADS` / `ORT_INTER_OP_THREADS` comme leviers exploitables si un futur chantier veut creuser ce point avec davantage d'essais.

**Hypothèse (c) — résolution d'entrée : déjà traitée par la conception existante, confirmée négligeable.**
`_preprocess()` redimensionnait déjà l'image à la taille fixe du modèle (1024×1024) avant l'inférence — aucune image n'a jamais été traitée en pleine résolution par le réseau de neurones lui-même. Mesuré : décodage + prétraitement combinés restent sous 0,25 s dans tous les cas testés (images de 1,3 à 4 mégapixels), sans corrélation visible avec la taille d'entrée. **Aucun changement nécessaire.**

### Constat additionnel, non demandé mais observé

L'encodage PNG final (`Pillow`, compression par défaut) varie fortement (0,05 – 1,5 s selon les essais) et n'a pas de cause isolée clairement identifiée dans le bruit ambiant. Non corrigé par prudence — aucune mesure ne permettait d'isoler un fix précis avec confiance, et ce n'était pas une des trois hypothèses à trancher. À garder en tête pour un futur chantier de latence si le besoin se représente.

### Résultat net

Temps par image en production après correction (hypothèse b appliquée) : **1,1 à 3,7 s** contre 6,7–9,9 s avant, avec une dispersion résiduelle expliquée par le CPU partagé de Railway plutôt que par le code. Sorties confirmées conformes aux références sur les 6 photos.

---

## 2. Sécurisation du service — codée, déployée et vérifiée (voir §10 pour le déploiement effectif et la preuve)

Motif repris à l'identique de `services/pdf-tools/` (`src/auth.js`, `src/config.js`, `src/cors.js`) :

- `services/background-removal/app/config.py` : lit `BG_REMOVAL_API_KEY` sans repli silencieux (`os.environ[...]`, même convention que `PORT`) — absente, le processus refuse de démarrer plutôt que de servir des 401 silencieux.
- `services/background-removal/app/auth.py` : décorateur `require_api_key`, en-tête `X-API-Key` obligatoire, quota mensuel par clé en mémoire (défense en profondeur — la protection principale reste le système de quota du site, inchangé, voir §4).
- `services/background-removal/app/cors.py` : CORS restrictif, n'échote l'origine que si elle figure dans `ALLOWED_ORIGINS`.
- `/health` reste public et sans clé, comme `pdf-tools`.

**Blocage rencontré à ce point** : voir §7. Le déploiement Railway de ce commit (`a794284c`) est resté coincé en boucle de redémarrage — comportement attendu et voulu du code (`os.environ["BG_REMOVAL_API_KEY"]` fait échouer le démarrage si la variable est absente), révélant que **cette variable n'est pas définie sur le service Railway**, contrairement à ce qui était indiqué au démarrage de ce chantier. Le déploiement précédent (instrumentation seule, sans exigence de clé) est resté actif entre-temps — aucune interruption de service pour un éventuel appelant (il n'y en a de toute façon aucun avant l'étape 4).

---

## 3. Délai d'expiration Vercel — vérifié en direct dans la documentation

Consulté le 14/09/2026 : `https://vercel.com/docs/functions/configuring-functions/duration`.

| Plan | Défaut | Maximum (GA) | Maximum étendu (bêta) |
|---|---|---|---|
| **Hobby** | **300 s (5 min)** | **300 s (5 min)** — pas de dépassement possible | — |
| Pro | 300 s | 800 s | 1800 s (bêta) |
| Enterprise | 300 s | 800 s | 1800 s (bêta) |

Le plan Hobby de ce projet autorise donc déjà 300 s par défaut, sans configuration — bien au-delà de tout besoin réel.

**Comparaison à la latence mesurée** : pire cas réaliste ≈ réveil à froid du service Railway (veille Serverless) + traitement d'une grande image ≈ 9 à 10 s au total (mesuré phase 1, premier appel après déploiement : 9,29 s tout compris). Marge considérable même avec un facteur de sécurité large.

**Valeur retenue : `maxDuration = 90`** dans `app/api/remove-bg/route.ts`, avec un délai d'expiration interne (`SERVICE_TIMEOUT_MS = 60 000` ms) sur l'appel `fetch()` vers Railway — même rapport 60 s/90 s que la route sœur `app/api/pdf-repair/route.ts`, pour la cohérence du code. Marge de ~30 s au-dessus du pire cas mesuré, elle-même trois à neuf fois plus large que le pire cas réel observé — pas la limite du plan, une marge choisie sur la mesure.

---

## 4. Branchement de la route — codé et vérifié en conditions réelles (voir §11)

`app/api/remove-bg/route.ts` réécrite intégralement :

- Variables `BG_REMOVAL_SERVICE_URL` et `BG_REMOVAL_API_KEY`, aucune des deux n'a de repli silencieux — absente, la route répond `500` explicite (« Background removal is not configured. ») au lieu d'échouer silencieusement ou de planter de façon opaque.
- Le corps de l'image (base64 dans le JSON déjà envoyé par la page) est décodé en octets bruts et posté directement au service, avec l'en-tête `X-API-Key` — plus de conversion vers le format `multipart/form-data` `image_file_b64` propre à remove.bg.
- **Le système de quota existant n'est pas touché** : `guardPaidRoute` (réservation IP + dépense globale, 3 couches, atomicité prouvée) encadre l'appel exactement comme avant ; seul le fournisseur derrière la réservation change. `guard.commit()` est appelé sans argument, comme pour remove.bg à l'époque — coût forfaitaire et déterministe, pas de réconciliation nécessaire.
- Gestion des échecs :
  - Service injoignable ou timeout → message clair au visiteur (« Could not reach the background removal service. » / « Background removal timed out. »), jamais de trace technique ; remonté dans `tool_errors` via `insertToolError`/`buildServerToolError` (mécanisme déjà en place sur 19 outils) et alerté via `alertServerError` (throttlé à une alerte/heure/route, comme les autres routes).
  - `429` (quota du service Python dépassé — défense en profondeur) → message « à pleine capacité », `503`, alerté.
  - `400` (image invalide côté service) → passé tel quel au visiteur, `400`, **sans** alerte ni ligne `tool_errors` — c'est l'upload du visiteur, pas un incident.
  - Toute autre erreur → message générique, `500`, alerté + `tool_errors`.
  - Aucun nom de fichier ni contenu d'image dans rien de ce qui est journalisé (le flux n'a jamais eu de nom de fichier — image reçue en base64 brut, pas en upload multipart).
- Le chemin de code appelant `api.remove.bg` est entièrement supprimé de cette route. `REMOVEBG_API_KEY` reste en place dans Vercel — son nettoyage est une tâche administrative distincte, hors périmètre.

**Vérifié sans dépendre du service réel** : `npx tsc --noEmit` passe sans erreur sur l'ensemble du projet après ce changement.

**Vérifié en conditions réelles depuis** (§11) : comportement bout-en-bout (succès, erreurs, clé absente) contre le vrai service Railway.

---

## 5. Interface — codée et vérifiée visuellement (voir §11)

`app/tools/ai-tools/background-remover/page.jsx` :

- Barre de progression (`ProgressBar`, composant déjà existant) pendant le traitement : progression simulée qui monte vers 90 % puis ralentit, faute de flux de progression réel possible sur un aller-retour serveur unique — saute à 100 % à la réponse. Un texte sous la barre prévient qu'un premier appel après une période d'inactivité peut prendre plus longtemps.
- Description corrigée : ne mentionne plus remove.bg, dit que le détourage tourne « using an AI segmentation model that runs on our own infrastructure » — vrai, vérifiable, sans promesse de performance invérifiable.
- FAQ « combien de temps ça prend » mise à jour dans le même sens (mention explicite du réveil du service après inactivité).

**Testé visuellement dans un vrai navigateur** (§11) : barre de progression, dépôt de fichier, affichage du résultat et des messages d'erreur, tous confirmés en conditions réelles sur la préversion.

---

## 6. Revue indépendante — étapes 2 et 4 uniquement

Sous-agent réviseur indépendant lancé sur la plage `f41ef7d2..828ed712` (les commits de sécurisation et de branchement, à l'exclusion de l'instrumentation de l'étape 1) au niveau `high`, conformément à la consigne (revue uniquement sur la clé partagée et la route publique). 6 constats remontés, 5 corrigés (commit `ec441600`), 1 signalé sans correction :

| # | Constat | Suite |
|---|---|---|
| 1 | `lib/quota/config.js` réserve toujours 0,20 $ fictifs par appel dans le plafond de dépense global partagé (coût de remove.bg, alors que le coût réel du service Railway est un forfait mensuel, pas un coût marginal par appel) — au rythme actuel du plafond (~20 $/mois), une centaine d'appels suffirait à épuiser le budget partagé et bloquer tous les outils payants du site, pour un coût réel proche de zéro. | **Non corrigé.** Corriger ce chiffre reviendrait à modifier le système de quota, explicitement hors périmètre de ce chantier sans validation préalable. Signalé ici pour décision. |
| 2 | Le cron de santé (`app/api/cron/health-check`) surveillait encore l'API remove.bg retirée au lieu du service Railway réel — la vraie dépendance de production n'était jamais surveillée. | **Corrigé** : `checkBackgroundRemoval()` ping désormais `BG_REMOVAL_SERVICE_URL`/health, même motif que `checkPdfTools`. |
| 3 | Politique de confidentialité (`app/privacy`) affirmait encore que les images sont envoyées à Remove.bg — risque de conformité (déclaration inexacte). | **Corrigé** : reclassé avec les autres outils auto-hébergés. |
| 4 | Conditions d'utilisation (`app/terms`) citaient encore Remove.bg comme sous-traitant tiers. | **Corrigé.** |
| 5 | Métadonnées SEO de la page outil (`layout.tsx`) mentionnaient encore remove.bg, incohérent avec le texte de `page.jsx` déjà corrigé dans le même diff. | **Corrigé.** |
| 6 | `services/background-removal/app/auth.py` comparait la clé API avec `!=` (canal temporel exploitable en théorie, sévérité faible vu l'unique appelant connu). | **Corrigé** : `hmac.compare_digest`. |
| 7 | La barre de progression démarrait avant la vérification de taille de fichier côté client, provoquant un flash visuel inutile sur un fichier trop gros. | **Corrigé** : réordonné. |

(Ménage additionnel fait dans le même commit, hors liste de la revue : `lib/alert.js` avait une entrée `SERVICE_NAMES['remove.bg']` devenue morte après la suppression de l'appel direct à remove.bg — remplacée par `'remove-bg'`, la clé réellement utilisée par `alertServerError` dans la nouvelle route.)

---

## 7. Blocage `BG_REMOVAL_API_KEY` — résolu

Le blocage décrit dans la version précédente de ce rapport (la variable annoncée comme posée sur Railway ne l'était pas, service coincé en boucle de démarrage) a été levé par l'utilisateur, qui a ajouté `BG_REMOVAL_API_KEY` sur le service Railway. Reste ouverte à ce moment-là : **la variable ajoutée n'avait jamais été appliquée/déployée** — voir §10 pour le diagnostic exact et la correction.

## 8. Ce qui n'a pas été fait (hors périmètre)

- Nettoyage de `REMOVEBG_API_KEY` sur Vercel : explicitement hors périmètre par consigne.
- Suppression du chemin de code remove.bg ailleurs que dans `app/api/remove-bg/route.ts` : aucun autre fichier applicatif n'y fait référence — vérifié par une recherche exhaustive sur `app/`, `lib/`, `services/` après les corrections de la revue (§6). Les seules occurrences restantes de « remove-bg » dans `lib/quota/` sont des identifiants du système de quota (nom de route, constantes de coût), hors périmètre.
- Correction du bug de charge utile 3,3-12 Mo découvert en §11.4 : signalé, non corrigé, décision de l'utilisateur nécessaire — voir ce paragraphe.

---

## 9. Correction du coût réservé — accord explicite donné

Constat de la revue indépendante (§6, point 1) : `lib/quota/config.js` réservait encore 0,20 $/appel (l'ancien tarif remove.bg) contre le plafond `GLOBAL_SPEND_CAP_USD` (20 $/mois par défaut) partagé avec tous les outils payants du site (IA, ConvertAPI, Adobe). À ce tarif, une centaine d'appels détourage épuiserait le plafond global.

**Correction (commit `e4d3cc3c`)** : `REMOVEBG_PER_IMAGE_DOLLARS` passé de `0.20` à `0.0031`, valeur mesurée dans `docs/audit/RAPPORT-detourage-filtre-sujet.md` §« TÂCHE 2 » — coût Railway par appel isolé avec veille Serverless active (RAM 1,7 Go × fenêtre de réveil ~7,6 min + CPU ~7 vCPU·s). Seule cette ligne et son commentaire sont touchés ; rien d'autre dans `lib/quota/` (les trois couches, l'atomicité, les autres outils) n'est modifié.

**Revue indépendante (sous-agent dédié, aucun contexte préalable)** — verdict : **approuvé, avec une dépendance à vérifier**.
- Arithmétique reproduite et confirmée exacte (≈0,0031 $/appel).
- Périmètre du diff confirmé strictement limité à cette constante.
- Point signalé : la validité de ce chiffre dépend entièrement du réglage Serverless (veille) de Railway étant réellement actif — le document source le présentait comme un modèle hypothétique, jamais confirmé activé en production à ce moment-là.

**Vérification en direct (§10)** : le réglage **Settings → Deploy → Serverless** du service `allformatconvert-clean` a été lu directement dans le tableau de bord Railway — **activé** (« Enable Serverless » sur ON). La dépendance signalée par la revue est donc confirmée satisfaite ; aucune correction supplémentaire du chiffre n'est nécessaire.

Économie résultante : ~6 450 appels réservables avant d'épuiser le plafond de 20 $/mois (contre ~100 avant), tout en restant un limiteur réel contre un abus massif.

---

## 10. Redéploiement Railway — diagnostic, correction, preuve

### 10.1 État trouvé

Le service Railway répondait sur `/health` (200) mais **`POST /remove-background` sans clé renvoyait `400 invalid_image` au lieu de `401`** — signe que le déploiement réellement servi datait d'avant le commit de sécurisation (`a794284c`). Confirmé dans le tableau Railway : le déploiement ACTIF était `instrument(background-removal)` (le commit précédent, sans authentification) ; le déploiement du commit de sécurisation figurait en HISTORY avec le statut **FAILED / Healthcheck failure (04:58)**.

### 10.2 Cause exacte

Le panneau service affichait un bandeau **« Apply 1 change »** (visible uniquement en ouvrant Railway) : la variable `BG_REMOVAL_API_KEY` avait bien été *ajoutée* par l'utilisateur, mais ce changement était resté **en attente, jamais appliqué/déployé**. Railway ne redéploie pas automatiquement un service dont le dernier déploiement a échoué simplement parce qu'une variable est ajoutée en brouillon — il faut explicitement appliquer le changement (« Deploy Changes »).

### 10.3 Correction

Bouton « Deploy Changes » actionné dans le tableau de bord Railway (aucune valeur de variable affichée ni répétée dans ce rapport — seuls les noms). Nouveau déploiement lancé automatiquement sur le dernier commit de la branche `master` suivie par Railway (`a794284c` à ce moment, voir §11.2 pour la divergence entre `master` et la branche de travail).

### 10.4 Vérification du réglage Serverless

Lu directement dans **Settings → Deploy → Serverless** (ni le rapport de phase 1 ni `RAPPORT-detourage-filtre-sujet.md` n'étaient fiables sur ce point, les deux se contredisant) : **« Enable Serverless » = activé**. Confirme la base du calcul de coût en §9.

### 10.5 Logs de démarrage lus en direct

```
[2026-09-16 00:21:21 +0000] [2] [INFO] Starting gunicorn 26.2.0
[2026-09-16 00:21:21 +0000] [2] [INFO] Listening at: http://0.0.0.0:8080 (2)
Starting Container
[16/Sep/2026:00:21:22 +0000] GET /health 200
2026-09-16 00:21:22,551 INFO startup: os.cpu_count()=48 ORT_INTRA_OP_THREADS=(unset) ORT_INTER_OP_THREADS=(unset) FILTER_AT_MODEL_RES=(unset, defaults to on)
```

Démarrage propre, aucune boucle de redémarrage, healthcheck 200 immédiat.

### 10.6 Preuve obligatoire — 401 sans clé

```
POST /remove-background (sans en-tête X-API-Key)
→ HTTP/1.1 401 Unauthorized
→ {"error":"unauthorized","message":"Missing X-API-Key header."}
```

Confirmé deux fois (avant et après le redéploiement, pour comparaison — 400 avant, 401 après). `/health` reconfirmé 200 après coup.

---

## 11. Étape 6 — tests complets sur préversion Vercel

Préversion testée : `onlineconvertools-git-detourage-phase2-latence-se-b47460-moufid.vercel.app` (commit `e4d3cc3c`, dernier commit de la branche, y compris le correctif de coût §9). Tests faits dans le vrai navigateur (session Chrome déjà authentifiée Vercel), en conditions utilisateur réelles — dépôt de fichier, clic, lecture du résultat à l'écran — pas de simple vérification de chargement de page.

### 11.1 Les 6 photographies

| # | Photo | Résultat |
|---|---|---|
| 01 | Portrait / cheveux | Découpage propre, cheveux fins bien conservés. Conforme à la référence. |
| 02 | Animal à poil | Défaut déjà documenté et accepté (corps tronqué) reproduit à l'identique — pas une régression. |
| 03 | Fil barbelé (bords complexes) | Découpage net, fil fin bien préservé. Conforme. |
| 04 | Objet transparent (bouteille) | La mire de couleurs à côté de la bouteille est correctement exclue — confirme le filtre plus-grande-région (divergence intentionnelle déjà documentée en §1). |
| 05 | Faible contraste (grenouille) | Découpage propre malgré le faible contraste avec le fond sombre. |
| 06 | Produit fond blanc | Découpage net. |

6/6 conformes aux attentes documentées.

### 11.2 Image invalide

Fichier de 2 Ko d'octets aléatoires avec extension `.jpg`, déposé via l'interface réelle. Message affiché à l'écran : **« The uploaded image could not be processed. »** — correspond exactement au chemin `serviceResponse.status === 400` de `app/api/remove-bg/route.ts` (passthrough propre, sans alerte ni ligne `tool_errors`, conforme à la conception : c'est l'upload du visiteur, pas un incident).

### 11.3 Fichier vide

Fichier de 0 octet déposé via l'interface réelle. Message affiché : **« No image provided »** — correspond au contrôle `if (!image)` de la route, avant tout appel réseau à Railway. Fonctionnellement correct ; formulation un peu plus brute que les autres messages (à polir un jour, pas un blocage).

### 11.4 Fichier trop gros — comportement correct ET régression pré-existante découverte

**Le test demandé (fichier > 12 Mo) fonctionne correctement** : `checkFileSize` (`lib/quota/limits.js`) bloque côté client avant tout appel réseau, message clair — reproduit fidèlement (fonction identique invoquée en direct sur un objet fichier simulé de 13 Mo, sans transférer 13 Mo réels) : **« Images are limited to 12 MB — this file is 13.0 MB. »**

**Découverte annexe, non demandée mais mise au jour par ce test** : en sondant la frontière réelle du côté serveur (nécessaire pour caractériser correctement le comportement « trop gros »), la plateforme Vercel elle-même rejette toute requête dont le corps JSON dépasse environ **4,5 Mo** (`413 FUNCTION_PAYLOAD_TOO_LARGE`, page brute non-JSON de la plateforme) — mesuré précisément par sondage binaire : accepté à 4 000 000 caractères base64 (≈2,86 Mo décodé), rejeté dès 4 500 000 (≈3,22 Mo décodé). Cette limite est **antérieure à ce chantier** (mécanisme de téléversement JSON+base64 déjà en place) et n'a pas de lien avec la latence, la sécurité ou le branchement Railway — mais elle rend le contrôle serveur `MAX_REMOVEBG_IMAGE_BYTES = 12 MB` en partie inatteignable : toute image dont l'encodage base64+JSON dépasse ~4,5 Mo (fichier brut ≳ 3,3 Mo — une photo de smartphone ordinaire, souvent 3 à 8 Mo) échoue **avant** d'atteindre le code de l'application.

**Impact concret vérifié en conditions réelles** (fichier de 5 Mo déposé via l'interface) : le visiteur voit un message technique brut, jamais prévu pour être affiché —
```
Error: Unexpected token 'R', "Request En"... is not valid JSON
```
— au lieu d'un message propre. Cet échec se produit entièrement côté navigateur (le `fetch` réussit avec un statut 413, mais `response.json()` échoue sur la page d'erreur HTML de Vercel) : **aucune alerte, aucune ligne `tool_errors`** n'est générée, contrairement à tous les autres chemins d'échec de cette route.

**Non corrigé** — hors périmètre de ce chantier (latence/sécurité/branchement Railway) et touche un mécanisme de téléversement pré-existant, pas le sujet de cette branche. Signalé ici pour décision, comme le point coût l'a été en §6. Piste : soit passer à un upload multipart/streaming (lève la limite JSON+base64), soit abaisser `MAX_REMOVEBG_IMAGE_BYTES` à la valeur réellement supportée (~3 Mo) avec un message honnête, soit intercepter les réponses non-2xx avant `response.json()` côté client pour au moins remplacer le message brut par un message propre sans changer la limite.

### 11.5 Service Railway injoignable

**Non testé en conditions réelles** — décision assumée, pas un oubli. Simuler une vraie indisponibilité du service Railway aurait exigé soit de modifier `BG_REMOVAL_SERVICE_URL` sur l'environnement Preview partagé de Vercel (risque : casse toutes les préversions du projet pendant le test, pas seulement cette branche — aucun outil disponible pour une variable ciblée à cette seule branche), soit de faire tourner l'application en local (bloqué par la règle absolue : `SUPABASE_SERVICE_ROLE_KEY` ne doit jamais être présente dans l'environnement d'un agent, et `.env.local` contient cette clé). Les deux options ont été écartées comme disproportionnées pour ce sous-test.

Vérifié à la place par revue statique du code réel (`app/api/remove-bg/route.ts`, bloc `try { fetch(...) } catch`) : erreur réseau (hôte injoignable) → `guard.release()`, `alertServerError('remove-bg', 'unreachable: ...')`, `insertToolError` avec `file: null` (jamais de nom de fichier ni de contenu — le champ est toujours `null` pour cette route, vérifié dans les quatre chemins d'erreur du fichier), réponse **502** « Could not reach the background removal service. » au visiteur. Motif identique, ligne par ligne, à `app/api/pdf-repair/route.ts` (déjà en production, déjà vérifié par ailleurs). Contrôle jugé suffisant compte tenu des contraintes ci-dessus, mais **pas un test en direct** — à noter explicitement.

### 11.6 Requête directe sans clé → 401

Fait et confirmé en §10.6.

### 11.7 Premier appel après veille

Test réel, pas simulé — confirmé par les logs Railway eux-mêmes, lus en direct :

```
2026-09-15 21:19:57 EDT   Stopping Container   (service endormi, inactif depuis le test précédent)
2026-09-15 21:21:11 EDT   Starting Container   (réveillé par la requête ci-dessous)
01:21:12,236 INFO loading model
01:21:12,671 INFO model loaded
01:21:16,567 INFO timing_breakdown_seconds size=2000x2000 ... total=4.347
[16/Sep/2026:01:21:16 +0000] POST /remove-background 200
```

Clic déclencheur enregistré à `21:21:11.740 EDT` (horloge locale) — correspond exactement au `Starting Container`. Réponse `200` reçue par le navigateur ≈`21:21:16 EDT`, soit **environ 4,3 à 5 secondes du clic à la réponse**, veille comprise (démarrage du conteneur + chargement du modèle + inférence complète).

Un second réveil, plus tôt dans la même session de tests, est visible dans les mêmes logs (`Stopping Container` à 20:35:53, `Starting Container` à 20:42:38, `loading model`/`model loaded`, première requête traitée en 4,267 s de traitement interne) — cohérent avec le premier chiffre.

**Comparaison avec la phase 1** : le pire cas mesuré en phase 1 était de 9,29 s (réveil + grande image). Le résultat mesuré ici après la correction de latence de phase 2 (§1) est nettement meilleur, ~4-5 s tout compris — cohérent avec le fait que la correction de l'étape 1 (filtre de région connexe déplacé sur le masque 1024×1024) réduit aussi le temps de traitement de la toute première requête après veille, pas seulement celui des requêtes à chaud.

Durées d'inactivité observées avant mise en veille dans ces logs : ~6-12 minutes selon les cycles — cohérent avec la fourchette documentée par Railway (5-10 min), la variance s'expliquant par l'activité résiduelle (health checks) entre les tests.

---

## 12. Cause de la divergence `master` / branche de travail

Découvert en cours de route (liste des déploiements Vercel) : `master` avait déjà reçu et déployé en production le commit `a794284c` (sécurisation Railway), **en dehors du flux attendu** (branche de travail → tests → fusion). Confirmé par `git log --graph --parents origin/master` : historique **strictement linéaire**, aucun commit de fusion, de `c6ae956a` (« fix(pdf-translate) ») jusqu'à `a794284c` inclus — comparé aux fusions normales du dépôt (`Merge branch 'feat/...' into master`, présentes ailleurs dans le même historique pour d'autres chantiers), cette série de commits a été poussée **directement** sur `master`, pas fusionnée depuis une branche.

**Cause exacte** : tous les commits concernés (de `ec74cf96` « feat: service d'inférence » jusqu'à `a794284c` inclus) portent la même empreinte `Claude-Session` (une session antérieure à celle-ci). Le tag `pre-detourage-phase2` a bien été posé sur `8b7fa278` (dernier commit de la phase 1) avec l'intention de brancher à partir de ce point — mais **deux commits supplémentaires** (`f41ef7d2` « instrument… » et `a794284c` « security… ») ont ensuite été committés et poussés alors que le checkout local pointait encore sur `master`, avant que cette même session ne crée effectivement la branche `detourage-phase2-latence-securite-branchement` (à partir du commit suivant, `828ed712`). Autrement dit : le tag de restauration a été posé au bon moment, mais **le `git checkout -b` correspondant n'a pas suivi immédiatement** — deux commits ont continué d'atterrir sur `master` avant le changement de branche effectif. Chacun de ces deux commits a déclenché un déploiement de production Vercel réel et une tentative de déploiement Railway réelle (c'est ce déploiement de `a794284c` sur `master`, resté coincé en boucle par la clé API manquante, qui a servi de révélateur en §7).

**Conséquence concrète de cet épisode** : la route Railway (avec authentification) a tourné en production pendant ~22h dépendant d'un service Railway qui, lui, servait encore l'ancien build **sans** authentification — write-up détaillé et décision de l'utilisateur consignés dans la conversation ; aucune action corrective rétroactive sur `master` n'a été prise à ce sujet (le volume réel de trafic du site rendait le risque non matérialisable — décision explicite de l'utilisateur), au-delà de la correction normale par fusion complète en §13.

**Règle à ajouter pour que ça ne se reproduise pas** : poser un tag de restauration avant un chantier multi-étapes ne suffit pas. La règle est : **la commande `git checkout -b <branche>` doit être exécutée, et vérifiée (`git branch --show-current`), immédiatement après le tag et avant le tout premier commit du chantier — jamais après.** Pour un chantier destiné à être testé puis fusionné en bloc, aucun commit ne doit atterrir sur `master` entre la pose du tag et la fusion finale ; si un commit se retrouve par erreur sur `master` avant la création de la branche, l'arrêter immédiatement et corriger (déplacer le commit vers la branche, réinitialiser `master`) plutôt que de continuer et de laisser la divergence s'accumuler.

## 13. Fusion

Étape 6 entièrement verte (§11). Fusionné dans `master` par commit de fusion (`--no-ff`, cohérent avec la convention déjà utilisée dans ce dépôt pour les autres chantiers) :

- Commit de fusion : `c27f9cfe` (`Merge branch 'detourage-phase2-latence-securite-branchement' into master`).
- Poussé sur `origin/master`. Vercel a démarré un nouveau déploiement de production (`c27f9cfe`) automatiquement.
- Railway (branche suivie : `master`) a redéployé automatiquement le même commit — succès confirmé (« Deployment successful », ACTIVE) sans intervention manuelle cette fois, la variable `BG_REMOVAL_API_KEY` étant désormais correctement appliquée depuis §10.
- Revérifié après ce déploiement final : `/health` → 200, `POST /remove-background` sans clé → 401. Le correctif `hmac.compare_digest` (revue §6) est désormais actif sur le déploiement réellement servi (il ne l'était pas sur l'ancien déploiement `a794284c` isolé de §12).

La branche de travail `detourage-phase2-latence-securite-branchement` reste en place sur `origin` (non supprimée) pour référence.
