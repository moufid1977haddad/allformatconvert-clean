# RAPPORT P30 — panne ConvertAPI, secours, alertes, Chromium isolé (04/10)

Demandé par le propriétaire (prompt P30), mises en production comprises, y compris en son absence. Branche
`p30-convertapi`, repère de restauration `restauration-avant-p30-04-10` = `bce5e714` (master avant P30). Dépenses
autorisées : 0,05 $ chez ConvertAPI (vérifications), une instance Railway pour Chromium (≈ 3-4 $/mois). Rien sur
Supabase (aucun schéma, aucun script), aucune autre variable d'environnement. Rapport complété après chaque lot.

## 0. Récapitulatif

| Lot | Contenu | État |
|---|---|---|
| 1 | Rétablissement vérifié sur www, cause de l'épuisement, règle « les bancs ne consomment plus le crédit » | voir §1 |
| A (2 + 3) | Alertes fournisseurs (téléphone + courriel, une fois par incident, rétablissement, seuil du forfait) ; secours LibreOffice annoncé pour Word to PDF ; « réessayez plus tard » pour PDF to Word / Excel / PowerPoint | voir §2, §3 |
| 4 | Équations .docx sur www comparées à Word | voir §4 |
| 5 | Chromium dans une instance Railway isolée | voir §5 |

## 1. Pourquoi le crédit s'est épuisé (mesuré le 04/10)

**Source** : métriques d'observabilité de Vercel (`vercel metrics`, données conservées depuis l'intégration du 04/09) :
`vercel.external_api_request.count` filtré sur `v2.convertapi.com` (chaque appel du site vers ConvertAPI, par
environnement et statut) et `vercel.function_invocation.count` des quatre routes (par adresse du client, comparée à
l'adresse publique de ce poste ; aucune adresse n'est écrite ici). Les données ConvertAPI elles-mêmes (statistiques
par date) demandent le « master token » du compte, que le site n'a pas : non lues.

**Appels du site vers ConvertAPI, du 04/09 au 03/10** :

| | Réussis (facturés) | Refusés (non facturés) |
|---|---|---|
| Production (www) | **55** | 2 × 500 (28/09), 2 × 403 crédit épuisé (03/10, P29) |
| Préversions | **38** | 7 × 500 (28/09) |
| **Total** | **93** | 11 |

Par jour (facturés) : 04/09 13 · 05/09 3 · 07/09 2 · 10/09 11 · 19/09 15 · 21/09 23 · 22/09 3 · 23/09 5 · 26/09 2 ·
28/09 7 · 29/09 1 · 02/10 4 · 03/10 4 — chaque date correspond à un chantier (intégration le 04/09, envoi par morceaux
les 19-21/09, PDF to Excel/PowerPoint le 23/09, bancs P21-P27).

**Qui** : sur www, toutes les conversions réussies de PDF to Word (12) et PDF to Excel (1) viennent de **l'adresse de ce
poste** (bancs `curl`/navigateur automatisé, et un Safari — le Mac du propriétaire sur le même réseau). Sur Word to PDF,
**une seule** requête réussie de tout le mois vient d'une autre adresse (29/09) ; les préversions ne sont jamais vues par
un visiteur. **Part des visiteurs réels : au plus 1 conversion sur 93 (≈ 1 %) ; bancs et essais : ≥ 99 %.**

**Écart non résolu** : le compte gratuit de ConvertAPI donne 250 conversions (page des tarifs, lue le 04/10) ; le site
n'en a fait passer que 93. Les ≈ 157 autres ne sont **pas passées par Vercel** : appels faits hors du site (évaluation
du 03/09 décrite dans `docs/specs/2026-09-03-convertapi-word-to-pdf-integration.md`, essais dans le tableau de bord de
ConvertAPI), ou un serveur local — **le vrai jeton ConvertAPI est présent dans `.env.local`** (vérifié par booléen, sans
lire sa valeur) : tout `next start` local lancé avec `CONVERTAPI_ENABLED=true` dépensait du crédit réel. Seul le tableau
de bord de ConvertAPI (onglet statistiques, compte du propriétaire) peut départager. La protection ci-dessous rend la
question sans objet pour l'avenir.

**Règle écrite au plan** (« crédits des fournisseurs ») et **mise dans le code** :
- `lib/providers/convertApi.js` : un appel réel n'est fait **que par la production Vercel** (`VERCEL_ENV=production`).
  En local et sur préversion, l'appel est refusé **avant tout envoi** (code `not_production`), sauf le jeton factice
  des bancs (`local-bench-fake`, avec `scripts/p26/e1/fake-providers.mjs` qui répond à la place de ConvertAPI). Test :
  aucun octet ne sort (`scripts/p30/provider-incident.test.mjs`).
- Appels réels sur www : comptés **avant** l'envoi dans `docs/audit/depenses-fournisseurs.jsonl` et plafonnés au budget
  du chantier (`scripts/p30/paid-ledger.mjs`) ; le banc s'arrête au-delà.
- Le site compte lui-même chaque conversion facturée sur la période du forfait (§2) : la consommation est visible
  avant l'épuisement.

## 2. Alertes fournisseurs (lot A)

**Avant** : une alerte par route et par heure (`alertServerError`) tant que l'erreur durait, plus, pour OpenAI, une
alerte **à chaque** 429 ; le téléphone (`NTFY_TOPIC`) n'était pas configuré ; aucun signal avant l'épuisement.
**Marché** (lu le 04/10) : Better Stack ouvre un incident après une « période de confirmation » (l'échec doit durer) et
ne le déclare résolu qu'après une « période de rétablissement » (le service doit rester bon), avec une notification à
l'ouverture et une à la résolution (betterstack.com/docs/uptime/confirmation-and-recovery-period) — même modèle
retenu ici ; ntfy accepte la publication en JSON (titre, message, priorité), seule façon d'avoir un titre lisible.

**Fait** (`lib/providerIncident.js`, `lib/alert.js`, `lib/providers/convertApiPlan.js`) :
- **ConvertAPI, OpenAI, Pangram** : incident ouvert **tout de suite** sur un refus durable (crédit ou quota : 402, 403,
  `quota_exceeded`, `insufficient_quota` ; clé refusée : 401), **au 3ᵉ échec** passager (5xx, 429 de débit, délai
  dépassé chez nous, réseau) dans une fenêtre glissante de 10 à 20 minutes, tous visiteurs et instances confondus.
  **Une** alerte par incident et par fournisseur (ouverture atomique : incrément plafonné), **une** à son rétablissement
  (fermeture atomique, seulement après une fenêtre sans échec : pas de va-et-vient quand une partie seule est en panne).
  Les erreurs dues au fichier ou à la requête (fichier abîmé, format refusé, autre 4xx) gardent exactement l'alerte
  horaire d'avant.
- **Téléphone + courriel** : ntfy publié en JSON (titre et texte lisibles, accents et émojis compris ; priorité 5 pour
  une panne, 4 pour un seuil, 3 pour un rétablissement, 2 pour le résumé du jour) ; le sujet ntfy n'apparaît dans aucun
  journal (testé).
- **Avant l'épuisement** : l'API de ConvertAPI ne donne le solde qu'au « master token » (documentation lue le 04/10), que
  le site n'a pas et qu'aucune nouvelle variable ne peut porter. Le site **compte lui-même** chaque conversion facturée
  (`ConversionCost`) sur la période du forfait (renouvellement le 4 de chaque mois) et alerte à **50, 80 et 100 %** des
  **1 000 conversions** du forfait mensuel le plus petit (« Developer », page des tarifs lue le 04/10). Au-delà,
  ConvertAPI **facture le surplus** au lieu de refuser : l'alerte de 100 % le dit.
- Seule la **production Vercel** ouvre ou ferme un incident (préversions et serveurs locaux partagent la même base) ;
  la production est reconnue à l'exécution (`VERCEL_ENV` **et** une variable que seul l'environnement d'exécution de
  Vercel pose), pas seulement par `VERCEL_ENV` qu'un fichier `.env` tiré pourrait contenir.
- **Alerte de test** : route `/api/cron/alert-test` (déclenchée par `vercel crons run`, Vercel fournit lui-même le
  secret ; programmée aussi le 1er janvier à 9 h 17 UTC comme vérification annuelle du canal). Résultat au §6.
- Tests : `node --test scripts/p30/provider-incident.test.mjs` — 12/12 (classement, une alerte par incident, fenêtre
  glissante, pas de va-et-vient, ouvertures concurrentes, base en panne, seuils du forfait, aucun appel hors production,
  message ntfy).

## 3. Secours annoncé (lot A)

**Word to PDF (.docx)** : quand ConvertAPI **lui-même** refuse ou tombe (crédit, clé, surcharge, 5xx, aucune réponse) et
que rien n'a été facturé, le .docx passe par **notre LibreOffice (Gotenberg 8.37, équations comprises depuis P28)** et
la page l'écrit à côté du téléchargement : « Made by our backup converter … Your text is all there, but fonts, line and
page breaks and equation spacing can differ from Word, and an image stored in a non-standard way can be missing. For
the usual conversion, try again later. » (et une question de la FAQ). Le secours n'est donné qu'aux pages qui affichent
cet avis (Word to PDF, Merge PDF, champ `engineFallback=allowed`) ; tout autre appel reçoit « réessayez plus tard ».
Si les deux moteurs échouent : « temporarily unavailable … try again later », pas « fichier abîmé ».

**Mesure du secours** (LibreOffice de `gotenberg-v2` contre le PDF de Word lui-même, `scripts/p30/fallback-lo.mjs` +
`scripts/p30/vs-word.py`, gratuit) :

| Document | Pages Word / secours | Mots communs | Pixels différents par page |
|---|---|---|---|
| fidelite-01 (polices, listes, tableau fusionné, image ancrée, 2 colonnes, sommaire) | 3 / 3 | 96,3 % (le sommaire : Word garde le texte en cache, LibreOffice le recalcule) | 11,8 · 8,4 · 1,2 % |
| fidelite-02 (notes, filigrane, Arial Narrow) | 1 / 1 | 100 % | 11,0 % |
| word-omml (7 équations Office Math) | 1 / 1 | 64,4 % (extraction des symboles mathématiques) | 2,4 % |
| dsmt4-mathtype6 (objet MathType) | — (Word bloque sur cet objet) / 1 | — | équation rendue (a = b/c) |

**Trouvé en route** : dans fidelite-01, l'image ancrée **disparaît** avec LibreOffice. Cause : le fichier d'essai
(écrit par python-docx) place `<w:drawing>` hors d'un `<w:r>` — XML invalide que Word tolère ; corrigé dans une copie,
LibreOffice l'affiche (vérifié). D'où la phrase « an image stored in a non-standard way can be missing » dans l'avis.

**PDF to Word, Excel, PowerPoint** : aucun secours de même qualité (la reconstruction de la mise en page est ce que
ConvertAPI fait payer) : « PDF to Excel is temporarily unavailable: the conversion engine it uses is not responding
right now, and we have no backup that keeps the layout as well. Please try again later. » (HTTP 503).

**Bancs** : local (construction de production, ConvertAPI refusé par la règle du §1, Supabase simulé) — Word to PDF
.docx → PDF LibreOffice + avis ; .odt → PDF sans avis ; Merge PDF (.docx + PDF) → PDF + avis nommant le fichier ; PDF to
Word / Excel / PowerPoint → message « try again later » : `scripts/p30/convertapi-pages.mjs --expect=fallback`.

**Revue indépendante** (agent séparé, lecture seule) : **1 bloquant** — Merge PDF recevait le PDF de secours sans le
dire — et 5 points : fenêtre fixe (une panne à un échec toutes les 6 minutes ne déclenchait rien), va-et-vient
« panne / rétablie » pendant une panne partielle, alerte horaire nouvelle sur un format refusé, 4xx de ConvertAPI comptés
comme panne, transitions non atomiques (alertes en double), production reconnue au seul `VERCEL_ENV`. **Tous corrigés**
(ci-dessus), plus : statut HTTP de Pangram conservé, compteur « jamais d'exception » réellement protégé, conversion
facturée à réponse illisible comptée, .docx avec l'interrupteur ConvertAPI coupé annoncé de la même façon.

## 4. Équations d'un .docx sur www (lot 4)

`node scripts/p29/docx-equations-www.mjs https://www.onlineconvertools.com <dossier> word-omml.docx dsmt4-mathtype6.docx
--chantier=P30 --budget=0.05` (corpus P28), après la fusion du lot A — deux vraies conversions par ConvertAPI (producteur
« ConvertAPI », pas de secours) :
- **word-omml.docx** (7 équations Office Math écrites par Word 16) contre le PDF exporté par Word lui-même : **1 page /
  1, 100 % des mots, 0,0 % de pixels différents** (`scripts/p30/vs-word.py`). Identique à Word.
- **dsmt4-mathtype6.docx** (objet MathType 6) : l'équation (a = b/c) est rendue, à sa place dans la phrase. Word ne peut
  pas servir de référence pour ce fichier sur ce poste (l'export par COM reste bloqué sur l'objet, comme en P28).
- **Rien de perdu ni d'abîmé : aucune correction.** Pour mémoire, le secours LibreOffice (§3) rend aussi les 7 équations
  (espacement plus serré, 2,4 % de pixels différents) et l'objet MathType.

## 6. Mise en production du lot A (03/10 au soir, heure UTC de la machine ; 04/10 pour le propriétaire)

- Banc local (construction de production, ConvertAPI refusé, Supabase simulé) : 6/6 ; tests unitaires 12/12 ; tests Go
  du relais (lot 5) à part.
- **Préversion** `onlineconvertools-ie22p04kq` (`d1397cd6`), **une passe** : **7/7** — secours annoncé sur Word to PDF
  (envoi direct **et par morceaux**, fichier de 4,6 Mo), Merge PDF (avis qui nomme le .docx), .odt sans avis, PDF to
  Word / Excel / PowerPoint « try again later ». Journal de la préversion : `runtime=true` — le repère d'exécution de
  Vercel existe bien (la production le trouvera).
- **Fusion `f8db1de9`** (sans poussée forcée) → production **`onlineconvertools-gjjrs94r8` = `f8db1de9`**.
- **Alerte de test envoyée** : `vercel crons run /api/cron/alert-test` le **03/10 à 23 h 06 UTC** ; journal de
  production : **`[alert-test] ntfy=sent email=sent`** (ntfy et Resend ont accepté l'envoi). Le propriétaire doit
  l'avoir reçue sur son téléphone (« 🧪 OnlineConverTools — test alert ») et par courriel.
- **www** : `www-light` **29/29** ; **rétablissement vérifié par de vraies conversions** : Word to PDF ×2 (§4), PDF to
  Word (DOCX 9,5 Ko), PDF to Excel (XLSX 6,9 Ko), PDF to PowerPoint (PPTX 19,4 Ko) — **5/5**, aucune erreur dans les
  journaux de production. **Dépense ConvertAPI : 0,05 $ sur 0,05 $** (`docs/audit/depenses-fournisseurs.jsonl`, 5
  lignes) ; plus aucun appel payant dans ce chantier.
- Retour arrière prêt, non utilisé : promouvoir `onlineconvertools-fo109wbpv` (= `5af581aa`, production d'avant).
