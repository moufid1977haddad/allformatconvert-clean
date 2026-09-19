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

## Outils PDF hors Office — backends (vérifié le 2026-09-19)

- **pdf-to-word** : `/api/pdf-to-word`, ConvertAPI (actif en production). Si
  `PDF_TO_WORD_CONVERTAPI_ENABLED` est coupé, la page bascule **silencieusement**
  sur une extraction de texte brut côté navigateur (`convertClientSide`) — voir
  défaut D6 du rapport.
- **html-to-pdf** : `/api/convert-html-to-pdf`, module Chromium de Gotenberg
  (`Skia/PDF m151`, Letter). Les polices absentes sont remplacées
  (Georgia → Liberation Serif, Arial → Liberation Sans).

## Fidélité — état mesuré (2026-09-19, détail dans `docs/audit/RAPPORT-fidelite-office.md`)

- Corpus : `docs/audit/fixtures-fidelite/` (6 fichiers) ; scripts de comparaison :
  `docs/audit/fidelite-marche/mont.py` et `diff.py` ; preuves PNG dans le même dossier.
- docx (ConvertAPI) : indiscernable de FreeConvert et Online2PDF.
- xlsx (LibreOffice) : équivalent sauf **D1** (gras en Caladea à empattements).
- pptx (LibreOffice) : équivalent sauf **D2** (Segoe UI → Noto Sans plus large,
  titre replié et masqué sur la fixture 06).
- Concurrents : FreeConvert (1 Go, sans compte, publicités, moteur déclaré
  Microsoft Office) ; Online2PDF (150 Mo/fichier, 200 Mo total, sans compte) ;
  CloudConvert (quota gratuit **10 crédits/jour**, atteint) ; iLovePDF (le
  téléchargement fige l'onglet en automatisation). FreeConvert et Online2PDF
  produisent des pptx quasi identiques : ne pas les compter comme deux avis
  indépendants.
- Nos limites (corrigé le 2026-09-19 — la version précédente de cette ligne était fausse) : plafond
  **réel** ≈ 4,4 Mo de fichier (413 `FUNCTION_PAYLOAD_TOO_LARGE` de Vercel, mesuré entre
  4 412 819 o accepté et 4 517 676 o refusé) ; le « 25 Mo » n'existe que dans un message
  d'erreur serveur inatteignable. Valeurs de production lues : `USER_QUOTA_PDF_CONVERSIONS`=5
  (mensuel, routes `.docx` et pdf-to-word seulement), `IP_RATE_LIMIT_PER_HOUR`=30,
  `IP_RATE_LIMIT_PER_DAY`=100, `GLOBAL_SPEND_CAP_USD`=20 ; xlsx/pptx/etc. sans quota ni limite par IP.
- Corrections 2026-09-19 : D1 (polices `xlsx` sans nom → `lib/xlsxDefaultFont.js`), D2 (Selawik
  ajoutée à l'image Gotenberg ; le titre de la fixture 06 reste replié car LibreOffice replie les
  zones `wrap="none"` : D9), D6 (pdf-to-word répond 503 quand l'indicateur est coupé, plus de repli).
  Détail : `docs/audit/RAPPORT-fidelite-corrections.md`.

## Règle de rédaction des promesses

Toute phrase de fidélité d'un outil (page, `SeoContent`, `layout.tsx`
title/description/OpenGraph) doit citer une mesure du rapport ; pas de
« professional-quality », pas de comparaison non mesurée, et le SEO doit dire la
même chose que la page (pdf-to-word affirmait « texte brut, dans votre
navigateur » alors que la production fait autre chose — corrigé le 2026-09-19).
