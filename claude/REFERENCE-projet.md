# Référence projet

> Ce fichier n'existait pas dans le dépôt avant le 2026-09-19 (aucune trace sur
> `master` ni sur aucune branche locale/distante, aucun historique git). Il est
> créé ici en réponse à une consigne qui le décrivait comme une encyclopédie
> déjà existante à compléter — si une version antérieure existe ailleurs
> (autre dépôt, autre machine), ce fichier ne la remplace pas, il démarre une
> nouvelle encyclopédie à partir de ce qui a été vérifié le 2026-09-19.

## Services Railway (projet `fortunate-manifestation`, compte Moufid Haddad)

Quatre services tournent dans l'environnement `production`, tous `numReplicas: 1`,
tous `status: RUNNING` au 2026-09-19 :

### gotenberg-v2
- **Rôle** : instance Gotenberg (conversion Office/HTML → PDF) réellement utilisée en
  production. `GOTENBERG_URL` sur Vercel (Preview + Production) pointe ici depuis le
  18 septembre.
- **Domaine** : `gotenberg-v2-production.up.railway.app`.
- **Image** : `gotenberg/gotenberg:8.36.0` épinglée par tag + digest
  (voir `services/gotenberg/Dockerfile`), confirmé dans son propre build log
  (`FROM docker.io/gotenberg/gotenberg:8.36.0@sha256:87c16b9f...`).
- **Trafic réel (7 jours, 2026-09-19)** : 16 requêtes HTTP, toutes dans une fenêtre
  d'environ 2h le 19 septembre (8× `POST /forms/libreoffice/convert`, 6× `POST
  /forms/chromium/convert/html`), en provenance de 4 IP distinctes avec
  `clientUa: node` — cohérent avec des fonctions serverless Vercel.
- **Veille Serverless (`sleepApplication`)** : **désactivée** — tourne 24h/24.

### gotenberg-fonts
- **Rôle** : ancien service Gotenberg, conservé comme filet de repli lors de la
  bascule vers gotenberg-v2. **Ne reçoit quasiment plus de trafic réel** : 3
  requêtes en 7 jours (2 `GET /health` du cron de santé du site, qui lit la même
  variable `GOTENBERG_URL` — donc antérieures à la bascule côté cron — et une
  seule vraie conversion le 2026-09-19T02:23:28Z, probablement une instance Vercel
  restée chaude avec l'ancienne valeur de `GOTENBERG_URL` en mémoire).
- **Domaine** : `gotenberg-fonts-production.up.railway.app`.
- **Image** : même image pinnée que gotenberg-v2, mais son déploiement actif
  (2026-09-17) n'a **aucune étape de build** dans son log — il a réutilisé une
  image déjà construite plutôt que de rebuild, cohérent avec le fait qu'il
  s'était déjà auto-redéployé sur le digest épinglé via les Watch Paths existants
  avant même la création de gotenberg-v2.
- **Veille Serverless** : **désactivée** — tourne 24h/24 pour un usage quasi nul.
- **Variables** : aucune référence croisée Railway (`${{...}}`) vers gotenberg-v2
  ou l'inverse — toutes les variables des deux services (dont
  `GOTENBERG_API_BASIC_AUTH_USERNAME`/`PASSWORD`) sont des valeurs littérales
  indépendantes. Supprimer gotenberg-fonts ne casserait donc pas gotenberg-v2
  au niveau Railway.
- **Coût estimé** : ~40-45% de la mémoire résidente du compte (583 Mo gotenberg-v2
  vs 529 Mo gotenberg-fonts, tous deux quasi inactifs), soit de l'ordre de
  **2 $/mois** entièrement évitables pour un usage résiduel proche de zéro.

### pdf-tools
- **Rôle** : microservice (Ghostscript/qpdf/veraPDF) derrière les outils
  `/api/pdf-repair` et `/api/pdf-to-pdfa` — voir `services/pdf-tools/README.md`.
  Confirmé par ses variables `API_KEYS` / `ALLOWED_ORIGINS`.
- **Domaine** : `allformatconvert-clean-production-337b.up.railway.app` (nom de
  domaine trompeur, hérité d'un provisionnement automatique — le service
  s'appelle bien `pdf-tools`).
- **Veille Serverless** : **désactivée** — tourne 24h/24 alors que les deux outils
  qu'il sert sont encore listés « Coming Soon » sur le site. Piste d'économie à
  creuser séparément, hors périmètre de cet audit.

### allformatconvert-clean
- **Rôle** : c'est en réalité le **backend de détourage / suppression d'arrière-plan**
  (nom trompeur, homonyme du dépôt principal). Confirmé par `app/api/remove-bg/route.ts`
  (lit `BG_REMOVAL_SERVICE_URL` / `BG_REMOVAL_API_KEY`) et par la variable littérale
  `BG_REMOVAL_API_KEY` présente sur ce service.
- **Domaine** : `allformatconvert-clean-production.up.railway.app`.
- **Veille Serverless** : **activée** (`sleepApplication: true`) — cohérent avec le
  modèle de coût « $0/mois au repos » documenté pour le détourage.

## Pipeline de conversion Office → PDF (production, vérifié le 2026-09-19)

`app/api/convert-to-pdf/route.ts` route selon l'extension **et** un feature flag :

| Extension | Backend | Condition |
|---|---|---|
| `.docx` | **ConvertAPI** | si `CONVERTAPI_ENABLED === "true"` (c'est le cas en production actuellement) |
| `.docx` (flag off/absent) | Gotenberg | fallback |
| `.doc`, `.xlsx`, `.xls`, `.csv`, `.ods`, `.pptx`, `.ppt` | Gotenberg (LibreOffice) | toujours |

Vérifié empiriquement (métadonnée PDF `Producer`) le 2026-09-19 : les conversions
`.docx` réelles passent bien par ConvertAPI (`Producer: ConvertAPI`), les
`.xlsx`/`.pptx` par Gotenberg (`Producer: LibreOffice 26.2.5.2 (X86_64)`).
Voir `docs/audit/RAPPORT-fidelite-office.md` pour la mesure de fidélité complète.
