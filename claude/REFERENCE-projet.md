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
- **Variables — RÉFÉRENCES CROISÉES (corrigé le 2026-09-19 ; NE PAS SUPPRIMER CE SERVICE)** :
  une version antérieure de cette ligne affirmait qu'il n'y avait aucune référence croisée
  et que supprimer gotenberg-fonts ne casserait pas gotenberg-v2. **C'est contredit par
  le document de pilotage** (`claude/plan-de-travail.md`, section ADMINISTRATIF), relevé
  par le propriétaire dans Railway : les variables de **gotenberg-v2 sont des références
  croisées vers gotenberg-fonts** (`${{gotenberg-fonts.…}}`) — le supprimer **tuerait
  gotenberg-v2**, donc la production Office → PDF et HTML → PDF. La lecture d'origine
  s'appuyait sur une lecture d'API où une référence apparaissait comme une valeur ;
  **non revérifiée dans cette passe** (pas de CLI Railway, et lire les variables
  exposerait des secrets). Règle : traiter la dépendance comme réelle jusqu'à preuve
  du contraire. Avant toute suppression : résoudre ces références en valeurs propres
  dans gotenberg-v2, redéployer, retester les cinq outils. Décision actuelle : le garder
  comme retour arrière tant que les correctifs de polices ne sont pas stabilisés.
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
- **Code** : `services/background-removal/` (Docker, modèle IS-Net general-use ONNX,
  Apache-2.0, téléchargé au build et vérifié par SHA-256 ; voir son README). Filtre
  « plus grande région connexe » appliqué sur le masque natif 1024×1024.
- **Contrat** : `GET /health` ; `POST /remove-background` (octets bruts, pas de
  multipart, aucun nom de fichier journalisé). Clé d'API comparée par
  `hmac.compare_digest`, CORS restreint, sur le motif de `services/pdf-tools` :
  401 sans clé, prouvé en production.
- **Côté site** : `app/api/remove-bg/route.ts` lit `BG_REMOVAL_SERVICE_URL` et
  `BG_REMOVAL_API_KEY` (noms seulement). Le navigateur réduit l'image à 1024 px avant
  l'envoi (charge utile ≤ `MAX_REMOVEBG_UPLOAD_BYTES` = 3 Mo, base64 + JSON), le service
  renvoie le **masque seul**, le navigateur recompose en pleine résolution. Plafond de
  l'original : **50 Mo** (`MAX_REMOVEBG_ORIGINAL_BYTES`), annoncé avant la sélection.
- **Performances mesurées** : 1,1-3,7 s par image, réveil après veille ~4-5 s.
  Coût : ~0 $/mois à trafic nul, ~5-6 $/mois à 500 images (Leonardo.Ai : 52,35 $).
  Détail : `docs/audit/RAPPORT-detourage-phase2.md`, `RAPPORT-detourage-taille-fichiers.md`.
- **Remplace** remove.bg (fermeture annoncée le 1er décembre 2026). Plus aucun code
  n'utilise `REMOVEBG_API_KEY` (variable Vercel à supprimer, voir plan de travail).
- **Coût de quota** : `REMOVEBG_PER_IMAGE_DOLLARS` = **0,0031 $** (constante en dur dans
  `lib/quota/config.js`, relue dans le code le 2026-09-19 ; c'était 0,20 $ — à ce prix,
  cent détourages épuisaient le plafond global de 20 $ partagé avec 15 outils IA,
  ConvertAPI et Adobe).

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
- **Quotas — valeurs lues en production le 2026-09-19 vs valeurs par défaut du code**
  (`lib/quota/config.js` retombe sur son défaut si la variable est absente : c'est le seul
  « repli » toléré, et il diffère de la production — vérifier que les variables existent) :

  | Variable | Production (lue) | Défaut du code | Portée |
  |---|---|---|---|
  | `USER_QUOTA_PDF_CONVERSIONS` | **5 / mois** | 5 | `.docx` (ConvertAPI) et pdf-to-word uniquement |
  | `IP_RATE_LIMIT_PER_HOUR` | **30** | 10 | routes payantes (16 outils + détourage) |
  | `IP_RATE_LIMIT_PER_DAY` | **100** | 30 | idem |
  | `GLOBAL_SPEND_CAP_USD` | **20** | 20 | plafond de dépense partagé (IA, ConvertAPI, Adobe, détourage) |

  Les « 10/h et 30/jour » d'un rapport antérieur étaient les **défauts du code**, pas la
  production. `.xlsx`, `.pptx`, `.doc`, `.xls`, `.ppt`, `.csv`, `.ods` (Gotenberg) : **ni
  quota utilisateur ni limite par IP.**
- **Plafond de taille déclaré (D10, corrigé le 2026-09-19)** : 4 Mio (`MAX_PLATFORM_UPLOAD_BYTES`
  dans `lib/quota/limits.js`), annoncé sur la page avant la sélection et contrôlé dans le
  navigateur. Mesures et liste des outils touchés : `docs/audit/RAPPORT-plafonds-declares.md`.
  Les « 25 Mo » (convert-to-pdf, pdf-to-word), « 50 Mo » (pdf-repair, pdf-to-pdfa) et
  « 10 Mo » (ai-transcribe) codés dans les routes sont **inatteignables** derrière la
  barrière de la plateforme.
- Corrections 2026-09-19 : D1 (polices `xlsx` sans nom → `lib/xlsxDefaultFont.js`), D2 (Selawik
  ajoutée à l'image Gotenberg ; le titre de la fixture 06 reste replié car LibreOffice replie les
  zones `wrap="none"` : D9), D6 (pdf-to-word répond 503 quand l'indicateur est coupé, plus de repli).
  Détail : `docs/audit/RAPPORT-fidelite-corrections.md`.

## Build local — variables requises (ajouté le 2026-09-19)

Depuis le commit `c8fd3b56`, `IP_RATE_LIMIT_PER_HOUR` et `IP_RATE_LIMIT_PER_DAY` n'ont plus de repli : absentes ou invalides, **le build et le démarrage échouent** (`lib/quota/requiredEnv.js`). Le garde-fou est voulu et ne doit pas être affaibli. Pour que `next build` compile en local, `.env.local` (ignoré par git) contient désormais ces deux lignes, aux **valeurs de production — ce sont des nombres, pas des secrets** : `IP_RATE_LIMIT_PER_HOUR=30` et `IP_RATE_LIMIT_PER_DAY=100`. Ne jamais afficher le reste de ce fichier. Si un futur build local échoue avec « missing or is not a positive integer », vérifier d'abord ces deux noms.

## Service `media-processing` (ffmpeg) — code prêt et testé, NON DÉPLOYÉ (2026-09-20)

Moteur de `video-compressor` et `video-converter`, et chemin d'envoi direct navigateur → service (un fichier ne passe jamais par une fonction Vercel). Code : `services/media-processing/` (README = variables et licences), billet signé : `lib/media/ticket.js` + `app/api/media/ticket/route.js`, client : `app/lib/mediaJob.js`, interface : `app/components/MediaServiceTool.jsx`. Rapport et runbook de déploiement : `docs/audit/RAPPORT-video-architecture.md`.

**Interrupteur de déploiement** : tant que `NEXT_PUBLIC_MEDIA_SERVICE_URL` n'est pas définie sur Vercel, les deux outils gardent leur ancienne version dans le navigateur (`LegacyPage.jsx`). Une fois définie (et le site reconstruit **sans cache**, la variable est figée au build), les outils passent sur le service.

Variables **Vercel** (aucune n'a de valeur par défaut ; la route répond 503 en NOMMANT la variable manquante) : `MEDIA_TICKET_SECRET` (sensible, identique côté Railway), `MEDIA_TICKET_MAX_BYTES`, `MEDIA_JOBS_PER_HOUR_PER_IP`, `MEDIA_JOBS_PER_DAY_PER_IP`, `NEXT_PUBLIC_MEDIA_SERVICE_URL` (publique).
Variables **Railway** (toutes obligatoires, le service refuse de démarrer sans) : `MEDIA_TICKET_SECRET`, `ALLOWED_ORIGINS`, `MEDIA_MAX_CONCURRENT_JOBS`, `MEDIA_MAX_QUEUED_JOBS`, `MEDIA_MAX_FILE_BYTES`, `MEDIA_MAX_DURATION_SECONDS`, `MEDIA_JOB_TTL_SECONDS`, `MEDIA_FFMPEG_TIMEOUT_SECONDS`, `MEDIA_WORK_DIR`, `MEDIA_FFMPEG_PATH`, `MEDIA_CHUNK_BYTES`.

## Règle de rédaction des promesses

Toute phrase de fidélité d'un outil (page, `SeoContent`, `layout.tsx`
title/description/OpenGraph) doit citer une mesure du rapport ; pas de
« professional-quality », pas de comparaison non mesurée, et le SEO doit dire la
même chose que la page (pdf-to-word affirmait « texte brut, dans votre
navigateur » alors que la production fait autre chose — corrigé le 2026-09-19).
