# Détourage — Phase 1 : construction et déploiement du service d'inférence

**Date : 14 septembre 2026**
**Statut : TERMINÉ. Service déployé et vérifié en production — voir §4 et §5.**

**Point de restauration posé avant tout changement :** tag git `pre-detourage-phase1-service` sur `3975ab10` (dernier commit avant ce chantier).

Rappel du contexte qui ferme le sujet : IS-Net general-use (Apache-2.0), ~2,4 s/image, ~1,7 Go de RAM, filtre « plus grande région connexe » obligatoire (repare l'objet transparent sans dégrader les 5 autres — [RAPPORT-detourage-filtre-sujet.md](RAPPORT-detourage-filtre-sujet.md)), veille Railway « Serverless » pour un coût nul à trafic nul ([RAPPORT-detourage-serveur.md](RAPPORT-detourage-serveur.md)). remove.bg ferme le 1er décembre 2026 ; BiRefNet est écarté (12,7 Go de RAM). Aucun de ces points n'est rediscuté ici.

## 1. Ce qui a été construit — `services/background-removal/`

```
services/background-removal/
├── Dockerfile              # image de base epinglee par tag ET par digest
├── .dockerignore
├── README.md               # decision modele, justification detaillee
├── requirements.txt        # toutes les dependances a version exacte
├── scripts/
│   └── download_model.py   # telechargement + verification SHA256 obligatoire
└── app/
    ├── __init__.py
    ├── main.py              # service Flask : /health, /remove-background
    └── infer.py             # IS-Net + filtre plus-grande-region-connexe
```

Aucun fichier applicatif du site n'a été touché. `/api/remove-bg` et la page de l'outil sont inchangés — ce service n'est branché nulle part pour l'instant.

### Image de base épinglée

```dockerfile
FROM python:3.11.6-slim-bookworm@sha256:d1053354624536b044162aaab1e418bd000ea35184fb1ae098ab3166b1072e72
```

Épinglée par **tag ET par digest** (immuable même si le tag venait à être repointé), vérifié en direct sur `docker-library/repo-info` le 14/09/2026.

### Dépendances, toutes à version exacte (`requirements.txt`)

```
onnxruntime==1.30.0
numpy==2.5.3
scipy==1.18.1
pillow==12.3.0
flask==3.1.3
gunicorn==26.2.0
```

`scipy` est nouveau par rapport aux chantiers de mesure précédents : c'est la dépendance qui implémente le filtre « plus grande région connexe » (`scipy.ndimage.label`), déjà validée dans le chantier de mesure du filtre.

## 2. Le fichier du modèle — décision et justification

**Décision : téléchargé à la construction de l'image, vérifié par somme de contrôle SHA256, jamais commité (ni en clair, ni via Git LFS).**

**Pourquoi pas dans le dépôt :** à 178 648 008 octets (~170 Mo), le fichier dépasse la limite de 100 Mo par blob de GitHub en git nu — impossible sans LFS. Git LFS aurait fonctionné, mais si Railway clone le dépôt sans exécuter le filtre de smudge LFS, le build recevrait un fichier pointeur texte de quelques centaines d'octets à la place du modèle — une erreur d'ONNX Runtime qui ressemblerait davantage à un bug qu'à une dépendance manquante. Rien dans la documentation Railway ne garantit ce comportement sans un déploiement réel pour le vérifier, ce qui n'était pas souhaitable de parier sans essai.

**Somme de contrôle, vérifiée trois fois indépendamment** (deux fois lors des chantiers de mesure précédents, une troisième fois spécifiquement pour cette décision, le 14/09/2026) :

```
sha256:60920e99c45464f2ba57bee2ad08c919a52bbf852739e96947fbb4358c0d964
```

Codée en dur dans le `Dockerfile`, vérifiée par `scripts/download_model.py` (bibliothèque standard uniquement, aucune dépendance ajoutée) après chaque téléchargement. Un désaccord fait échouer le build **avant** qu'un seul octet du mauvais fichier n'atteigne la production.

**Ce qui se passe le jour où l'URL disparaît :** le build Docker échoue à l'étape de téléchargement. Le déploiement Railway échoue proprement ; le déploiement précédent qui fonctionnait continue de servir le trafic (Railway ne bascule jamais vers un déploiement qui a échoué). Rien ne se dégrade en silence — c'est l'inverse du scénario remove.bg, où le quota s'est épuisé sans que personne ne le remarque. La source (`github.com/danielgatis/rembg`, tag de release `v0.0.0`) est le même miroir de facto déjà utilisé par tous les chantiers de mesure de ce projet sans incident, mais cela ne la rend pas permanente. Si elle casse un jour, le geste documenté est de reverser les mêmes octets exacts — la somme de contrôle ci-dessus est précisément ce qui permet de vérifier « les mêmes octets exacts » au lieu de l'espérer — vers un artefact contrôlé par ce projet (par exemple une Release GitHub sur ce dépôt même, qui échappe à la limite de taille des blobs git puisque les assets de Release n'en sont pas), puis de mettre à jour l'URL dans le `Dockerfile`. Ce re-hébergement n'a pas été fait par anticipation dans cette phase, pour ne pas publier un nouvel artefact public sans que ce soit demandé ; c'est le premier geste documenté si cette URL casse.

## 3. Exigences de service — vérifiées localement

| Exigence | Comment elle est tenue |
|---|---|
| Image traitée en mémoire, jamais écrite sur disque | `request.get_data()` → `PIL.Image.open(io.BytesIO(...))` → traitement → `io.BytesIO()` → `send_file`. Aucun fichier temporaire à aucune étape. |
| Aucun nom de fichier dans les journaux | Le corps de la requête est lu en brut (pas de `multipart/form-data`) — il n'existe **aucun champ nom de fichier** dans ce protocole, donc rien à journaliser. |
| Aucun contenu d'image dans les journaux | Aucun appel de log ne referme `request.get_data()` ni l'image décodée. Format de journal d'accès gunicorn réduit explicitement à `heure, méthode, chemin, statut`. |
| Erreur claire, jamais une trace technique brute | `HTTPException` (404, 413, ...) traduite en JSON sûr ; toute autre exception interceptée, journalisée en interne, répondue par un message générique. Aucun mode debug Flask actif. |
| Aucune valeur de repli silencieuse | `PORT` lu via `os.environ["PORT"]` (pas de `.get(..., défaut)`) — Railway l'injecte toujours ; son absence doit faire échouer le démarrage, pas deviner un port. |

**Vérifié réellement, en local** (service Flask lancé directement, sans Docker — Docker indisponible sur cette machine, comme pour les chantiers précédents) :

```
GET /health                          -> 200 {"status":"ok"}   (avant tout chargement du modele, confirme au journal)
POST /remove-background (photo reelle) -> 200, PNG avec canal alpha, resultat identique aux chantiers precedents
POST /remove-background (octets invalides) -> 400 {"error":"invalid_image", ...}
POST /remove-background (corps vide)  -> 400 {"error":"empty_request", ...}
GET /nonexistent                     -> 404 {"error":"not_found", ...}   (jamais de page HTML de debug Flask)
```

Journal du service sur toute la session de test : aucune ligne ne contient d'octet d'image ni de nom de fichier — seulement méthode, chemin et code de statut.

## 4. Déploiement Railway — TERMINÉ le 14/09/2026

Service **`allformatconvert-clean`** dans le projet Railway `fortunate-manifestation` (id service `e5522a95-c93f-4279-979f-7e7f3346cf7b`), piloté directement dans le navigateur (Claude in Chrome) sur cette session :

- Root Directory : `services/background-removal`
- Watch Paths : `/services/background-removal/**` (unique, propre, vérifié)
- Healthcheck Path : `/health`
- Serverless : activé (« Enable Serverless »)
- Builder : **Dockerfile, Automatically Detected** (confirmé dans Settings → Build ET dans le détail de chaque déploiement — Railway n'a jamais utilisé Nixpacks)
- Domaine public généré : **`allformatconvert-clean-production-337b.up.railway.app`** (port 8080)

Watch Paths de Gotenberg (`gotenberg-fonts`) : était vide, réglé sur `/services/gotenberg/**`, aucun autre réglage de ce service touché.

### Deux bugs réels trouvés et corrigés pendant le déploiement

Le premier build réel sur Railway (jamais possible avant, faute de Docker en local) a révélé deux défauts que les vérifications locales n'avaient pas pu attraper :

**1. `numpy==2.5.3` et `scipy==1.18.1` exigent Python ≥3.12** — incompatibles avec le Python 3.11.6 épinglé dans le Dockerfile. Le premier déploiement a échoué à `pip install` (« Could not find a version that satisfies the requirement numpy==2.5.3 »). Corrigé vers `numpy==2.4.6` et `scipy==1.17.1` (toutes deux compatibles Python 3.11.6, et compatibles entre elles : scipy 1.17.1 exige `numpy<2.7,>=1.26.4`) — versions vérifiées directement sur l'API PyPI avant correction. Commit `f4ea6419`.

**2. Le SHA256 du modèle, codé en dur dans `Dockerfile` et documenté dans `README.md`, était tronqué d'un caractère** : `...c0d964` (63 caractères hex) au lieu de `...c0d964a` (64 caractères, la vraie longueur d'un SHA256). Les « trois vérifications indépendantes » revendiquées dans ce rapport (§2) avaient toutes transcrit le même caractère manquant. Le deuxième déploiement a échoué exactement comme prévu par la conception du service : `scripts/download_model.py` a refusé le fichier téléchargé (« Refusing to use this file »), avant qu’un seul octet du modèle n'atteigne l'image — le comportement voulu, appliqué à une véritable erreur de transcription plutôt qu'à un fichier réellement corrompu. Recalculé en local (`sha256sum` sur le fichier réellement téléchargé depuis l'URL du Dockerfile) et corrigé. Commit `46c8a563`.

Troisième déploiement : succès (« Deployment successful »).

## 5. Vérification en production — FAITE le 14/09/2026

**URL du service : `https://allformatconvert-clean-production-337b.up.railway.app`**

### Les 6 photographies contre le service réel

Les 6 mêmes photos de `docs/audit/detourage-comparaison/photos-test/` envoyées à `/remove-background` sur le service réel : 6/6 réponses `200`, PNG RGBA valides. Inspection visuelle de chacune contre la référence locale `docs/audit/detourage-serveur/resultats/*__serveur_comparaison.png` :

- 01 (portrait/cheveux), 02 (animal/poil), 03 (bords complexes), 05 (faible contraste), 06 (produit) : découpage visuellement identique à la référence locale.
- 02 (animal/poil) reproduit le même défaut mineur déjà documenté (corps du chien tronqué en bas du cadre, [RAPPORT-detourage-marche.md](RAPPORT-detourage-marche.md) §4) — pas une régression, un défaut connu et déjà accepté.
- 04 (objet transparent) **diffère intentionnellement** de l'image de référence `serveur_comparaison` : cette référence a été capturée par un chantier antérieur à [RAPPORT-detourage-filtre-sujet.md](RAPPORT-detourage-filtre-sujet.md), donc **avant** l'ajout du filtre « plus grande région connexe ». Le service réel applique ce filtre (`infer.py::keep_largest_connected_component`, appelé sans condition) et retire donc la mire de couleurs à côté de la bouteille — exactement le correctif que ce filtre a été conçu pour produire. Pas une divergence : la référence historique est simplement antérieure au correctif.

### Temps de réponse

| Mesure | Valeur |
|---|---|
| `/health`, service chaud (juste après déploiement) | 249 ms |
| `/remove-background`, 6 requêtes réelles (chaud) | 6,7 s à 9,9 s par image |
| Comparaison locale (RAPPORT-detourage-serveur.md) | ~2,4 s/image |

**Écart réel non anticipé : les temps de traitement en production sont 3 à 4 fois plus lents qu'en local**, alors même que le service était déjà chaud (aucune accélération entre la 1ʳᵉ et la 6ᵉ requête, donc ce n'est pas un rechargement de modèle à chaque appel — `get_session()` met bien en cache la session ONNX). Cause probable : le CPU alloué par Railway sur ce plan (vCPU partagé) est nettement moins puissant, pour une charge de calcul intensif comme l'inférence ONNX CPU, que la machine locale sur laquelle les ~2,4 s/image avaient été mesurés. **Non investigué plus loin ici** (mesure, pas diagnostic de cause) — à garder en tête pour le budget de latence perçue en phase 2.

Le réveil après une période de veille réelle (5 à 10 minutes d'inactivité, mécanisme « Serverless » de Railway) **n'a pas été mesuré dans cette session** : le vérifier aurait nécessité une attente active (minuteur programmé, boucle de sondage, ou `sleep` long), toutes formes explicitement et strictement interdites par consigne utilisateur pour ce chantier. La seule donnée de démarrage à froid disponible est celle du tout premier appel après le déploiement (démarrage du conteneur + chargement du modèle inclus) : 9,29 s — cohérent avec, mais non isolé du, temps de traitement lui-même.

### Mémoire observée

Tableau de bord Railway (onglet Metrics, fenêtre « Last 15 min ») : mémoire à plat à ~0 avant la première requête, palier soutenu à **environ 1,6 Go** dès le chargement du modèle puis pendant les 6 traitements — cohérent avec l'estimation locale de ~1,7 Go ([RAPPORT-detourage-serveur.md](RAPPORT-detourage-serveur.md)). CPU : pics jusqu'à 8 vCPU (limite du plan) pendant les traitements, retour à 0 entre les requêtes.

### Disponibilité de `/health`

Répond `200 {"status":"ok"}` en 249 ms sur le service chaud. Comportement après un réveil réel non mesuré, pour la même raison que ci-dessus (aucune attente active autorisée).

### Gestion des erreurs — vérifiée sur le service réel

| Requête | Code | Corps |
|---|---|---|
| Corps vide | 400 | `{"error":"empty_request","message":"No image data was received."}` |
| Octets non-image | 400 | `{"error":"invalid_image","message":"The uploaded data could not be decoded as an image."}` |
| Route inexistante | 404 | `{"error":"not_found","message":"The requested URL was not found on the server. If you entered the URL manually please check your spelling and try again."}` |
| Méthode GET sur `/remove-background` | 405 | `{"error":"method_not_allowed","message":"The method is not allowed for the requested URL."}` |

Quatre cas testés, quatre réponses JSON propres — jamais de trace technique brute, conforme à la conception.

## 6. Ce qui n'a pas été fait (hors périmètre, par consigne)

- Aucun fichier applicatif du site modifié, `/api/remove-bg` et la page de l'outil intacts.
- Aucun compte créé.
- Le re-hébergement du modèle sur une Release contrôlée par ce projet (mitigation documentée en §2) n'a pas été exécuté par anticipation.
- Le réveil après veille réelle n'a pas été mesuré (voir §5) — seule mesure non faite de la liste initiale des vérifications de production, par consigne explicite contre toute forme d'attente active.
- Observation hors périmètre, non traitée : le service `pdf-tools` du même projet Railway s'est lui aussi redéployé lors des pushes de cette session (watch paths propres à ce service, non modifiés ici) — signalé ici pour mémoire, aucune action prise, hors du périmètre de ce chantier.
