# Détourage — Phase 1 : construction et déploiement du service d'inférence

**Date : 14 septembre 2026**
**Statut : construction et vérifications locales terminées. Déploiement en attente d'une action humaine dans Railway — voir §4.**

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

## 4. Déploiement Railway — ARRÊT ICI, action humaine requise

Docker n'est pas installé sur cette machine ; c'est Railway qui construit l'image. Tout est prêt côté dépôt. Voici le chemin exact dans l'interface Railway (même niveau de précision que l'« Ignored Build Step » de Vercel) :

1. Ouvrir le projet Railway existant (celui qui héberge déjà Gotenberg).
2. **"+ New" → "GitHub Repo"** → sélectionner `allformatconvert-clean` (le service peut pointer sur le même dépôt que les autres services de ce projet).
3. Une fois le service créé, ouvrir son onglet **Settings**.
4. Champ **"Root Directory"** → saisir `services/background-removal`. C'est le réglage qui fait que Railway ne construit que ce sous-répertoire.
5. Railway doit détecter automatiquement le `Dockerfile` présent dans ce sous-répertoire (message attendu au build : *"Using detected Dockerfile!"*). Aucune action manuelle de sélection de builder n'est nécessaire si ce message apparaît.
6. Toujours dans **Settings → Deploy**, champ **"Healthcheck Path"** → saisir `/health`.
7. Toujours dans **Settings → Deploy**, section **"Serverless"** → activer le bouton **"Enable Serverless"** (c'est la veille — sans elle, le service tourne 24 h/24 et facture en continu).
8. *(Recommandé, pas obligatoire)* Champ **"Watch Paths"** dans Settings → saisir `services/background-removal/**` pour que ce service ne redéploie pas à chaque modification ailleurs dans le dépôt.
9. Lancer le déploiement.
10. Une fois le déploiement réussi, **Settings → Networking → Public Networking → "Generate Domain"** pour obtenir l'URL publique (`*.up.railway.app`).

**Donne-moi l'URL générée à l'étape 10** — c'est le seul élément qu'il me manque pour continuer.

## 5. Vérification en production — EN ATTENTE

Cette section sera complétée dans une mise à jour de ce même rapport dès que l'URL du service (étape 4.10) sera disponible. Elle mesurera, sur le service réel :

- Les 6 mêmes photographies de `docs/audit/detourage-serveur/`, comparées aux sorties mesurées localement.
- Le temps de réponse à chaud et après une période de veille.
- Le pic de mémoire réellement observé sur Railway (tableau de bord du service).
- La disponibilité de `/health` après un réveil.

Rien de tout cela n'a été mesuré ni supposé pour l'instant — aucun chiffre de production ne sera avancé tant que le service n'existe pas réellement.

## 6. Ce qui n'a pas été fait (hors périmètre, par consigne)

- Aucun fichier applicatif du site modifié, `/api/remove-bg` et la page de l'outil intacts.
- Aucun compte créé.
- Aucun déploiement réel déclenché par moi-même — Railway construit, mais la création du service et son paramétrage sont une action humaine par consigne explicite.
- Le re-hébergement du modèle sur une Release contrôlée par ce projet (mitigation documentée en §2) n'a pas été exécuté par anticipation.
