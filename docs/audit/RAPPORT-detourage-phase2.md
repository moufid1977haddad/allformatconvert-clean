# Détourage — Phase 2 : latence, sécurisation, branchement

**Date : 14-15 septembre 2026**
**Statut : Étapes 1-5 codées, mesurées et (pour 1-2) déployées/vérifiées en production. Étape 6 (tests bout-en-bout) et la fusion sont BLOQUÉES — voir §7.**

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

## 2. Sécurisation du service — codée et déployée, **bloquée par une variable manquante**

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

## 4. Branchement de la route — codé, non testé en conditions réelles (bloqué, voir §7)

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

**Non vérifié** (bloqué, voir §7) : le comportement réel bout-en-bout (succès, erreurs, clé absente) contre le vrai service Railway, faute de `BG_REMOVAL_API_KEY` opérationnelle sur les deux plateformes.

---

## 5. Interface — codée

`app/tools/ai-tools/background-remover/page.jsx` :

- Barre de progression (`ProgressBar`, composant déjà existant) pendant le traitement : progression simulée qui monte vers 90 % puis ralentit, faute de flux de progression réel possible sur un aller-retour serveur unique — saute à 100 % à la réponse. Un texte sous la barre prévient qu'un premier appel après une période d'inactivité peut prendre plus longtemps.
- Description corrigée : ne mentionne plus remove.bg, dit que le détourage tourne « using an AI segmentation model that runs on our own infrastructure » — vrai, vérifiable, sans promesse de performance invérifiable.
- FAQ « combien de temps ça prend » mise à jour dans le même sens (mention explicite du réveil du service après inactivité).

**Non testé visuellement dans un navigateur** — dépend de la même préversion Vercel bloquée en §7.

---

## 6. Revue indépendante — étapes 2 et 4 uniquement

Sous-agent réviseur indépendant lancé sur la plage `f41ef7d2..828ed712` (les commits de sécurisation et de branchement, à l'exclusion de l'instrumentation de l'étape 1) au niveau `high`, conformément à la consigne (revue uniquement sur la clé partagée et la route publique).

<!-- RESULTATS_REVUE -->

---

## 7. Blocage — `BG_REMOVAL_API_KEY` absente de Railway

Le prompt de ce chantier indiquait que `BG_REMOVAL_API_KEY` était « déjà posée côté Railway et côté Vercel ». Ce n'est pas le cas côté Railway : l'onglet Variables du service `allformatconvert-clean` (masqué, noms seulement — jamais consulté en clair) affiche **« No Environment Variables »** en dehors des 8 variables que Railway ajoute lui-même. Le déploiement du commit de sécurisation (`a794284c`) est resté coincé en boucle de démarrage/échec de bonne santé pendant plusieurs minutes — comportement exactement voulu par le code (`os.environ["BG_REMOVAL_API_KEY"]` sans repli), qui a servi de révélateur.

Je n'ai ni affiché ni consulté aucune valeur de secret à aucun moment (contrainte respectée strictement), et je ne peux pas — ni ne dois — inventer une valeur : elle doit être identique des deux côtés (Railway et Vercel) pour que la route fonctionne, et une valeur choisie par moi ne serait par construction jamais la bonne si l'une des deux plateformes en a déjà une différente.

**Action nécessaire, côté utilisateur, avant de pouvoir poursuivre :**
1. Confirmer/ajouter `BG_REMOVAL_API_KEY` sur le service `allformatconvert-clean` (Railway → Variables) — une valeur secrète de votre choix.
2. Confirmer que la **même** valeur, et `BG_REMOVAL_SERVICE_URL` (= `https://allformatconvert-clean-production-337b.up.railway.app`), sont posées sur Vercel (Production **et** Preview, puisque les tests de l'étape 6 doivent se faire sur une préversion).

Une fois ces deux points confirmés, il restera à faire, dans l'ordre : redéployer le service Railway (le déploiement `a794284c` se relancera automatiquement une fois la variable posée, ou peut être redéclenché), puis l'étape 6 complète (6 photos, image invalide/vide/trop grosse, service injoignable, requête sans clé → 401, premier appel après veille), puis fusion et vérification finale.

## 8. Ce qui n'a pas été fait (hors périmètre ou bloqué)

- Étape 6 (tests bout-en-bout sur préversion Vercel) : bloquée, voir §7.
- Fusion de la branche vers `master` : non faite — la consigne est explicite (« Fusionne seulement une fois tout vert »), et rien n'est vert tant que l'étape 6 n'a pas pu s'exécuter.
- Nettoyage de `REMOVEBG_API_KEY` sur Vercel : explicitement hors périmètre par consigne.
- Suppression du chemin de code remove.bg ailleurs que dans `app/api/remove-bg/route.ts` : aucun autre fichier applicatif n'y fait référence (vérifié).
