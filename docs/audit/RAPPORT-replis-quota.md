# RAPPORT — replis silencieux des limites de quota

**Date :** 19 septembre 2026 · **Branche :** `quota-replis` (balise de restauration `restore-pre-quota-replis`) · **Commit :** `c8fd3b56`, fusionné `d517a975`.

## 1. Correction A — les deux variables IP (FAITE)

**Avant :** `Number(process.env.IP_RATE_LIMIT_PER_HOUR || 10)` et `… PER_DAY || 30` — variable absente → 10/h et 30/jour, sans un mot, alors que la production est à 30/h et 100/jour.

**Après :** `lib/quota/requiredEnv.js` (nouveau) fournit `requiredPositiveInt(name)` ; `lib/quota/config.js` l'appelle pour les deux variables. **Absente, vide, `0`, négative, décimale ou non numérique → exception à l'import**, dont le message **nomme la variable et n'imprime jamais la valeur**. Aucun repli ajouté.

**Effet :** l'import de `config.js` a lieu à la collecte des routes par `next build` → **le build échoue, le déploiement n'a pas lieu, l'ancienne version reste servie.** Une variable oubliée ne peut plus atteindre les visiteurs en silence : elle bloque le déploiement, avec un message lisible dans le journal de build.

**Tests (exécutés) :**
- `scripts/quota-tests/16-required-env.js` (nouveau, en mémoire, sans Supabase) : **PASS** — rejette `undefined`, `''`, `'   '`, `'0'`, `'-5'`, `'abc'`, `'3.5'`, `'NaN'`, `'Infinity'` ; n'echo pas la valeur ; **un sous-processus `require('config.js')` échoue sans les variables, échoue avec une seule, charge avec les deux**.
- `03-config.js` : **PASS** avec les deux variables ; **échoue avec le message attendu** sans elles. `01-period.js` PASS.
- **`next build` complet : passe avec les deux variables ; échoue sans elles** (« `[quota/config] IP_RATE_LIMIT_PER_HOUR is missing… Failed to collect page data for /api/report-error` »).
- **Non exécutés :** les scripts qui exigent `SUPABASE_SERVICE_ROLE_KEY` (06, 08, 09, 13-15…), interdits à l'agent (règle permanente du projet). **Conséquence pratique :** tout script `quota-tests` qui charge `config.js` exige désormais les deux variables dans le shell (noté en commentaire dans `config.js`). Ex. `IP_RATE_LIMIT_PER_HOUR=30 IP_RATE_LIMIT_PER_DAY=100 node …`.

**Effet de bord à connaître :** `next dev` local plantera si ces deux variables manquent dans l'environnement local. **Aucune n'est en environnement `Development` sur Vercel** (voir §2) : `vercel env pull` ne les rapportera pas. C'est voulu (échec bruyant) mais à savoir : si le `.env.local` du propriétaire ne les a pas, il devra les y mettre. Je ne l'ai pas lu (interdit) et n'ai rien ajouté.

## 2. État réel des constantes de `config.js`

**Méthode :** `npx vercel@latest env ls`, dont la sortie passe par un filtre (`names-only.js`, dans le scratchpad) qui ne conserve **que** les 10 noms recherchés et les colonnes d'environnement. **Aucune valeur n'a été lue ni affichée**, aucun autre nom de variable non plus (seul le *nombre* de variables, 30, a été compté). Deux autres pistes ont été **écartées volontairement** : `filter_project_envs` (MCP) renvoie toutes les variables du projet dont deux signalées lisibles (`RESEND_API_KEY`, `GOTENBERG_PASSWORD`) ; l'objet déploiement ne contient pas les noms.

**Précision de dénombrement :** le fichier contient **10** constantes de limites configurables, pas 9 (`GLOBAL_SPEND_CAP_USD`, `USER_QUOTA_PDF_CONVERSIONS`, `USER_QUOTA_IMAGES`, 2 × IP, 3 × TOOL_ERROR, 2 × CONTACT). Et ce sont **5** qui tournent sur leur repli, pas « six ».

| Constante | Variable | Présente en prod ? | Environnements | Valeur appliquée | Valeur voulue | Écart |
|---|---|---|---|---|---|---|
| Plafond de dépense global | `GLOBAL_SPEND_CAP_USD` | **oui** | Prod, Preview | 20 (lue le 19 sept.) | 20 | aucun |
| Quota PDF / mois | `USER_QUOTA_PDF_CONVERSIONS` | **oui** | Prod, Preview | 5 (lue le 19 sept.) | 5 | aucun |
| Quota images / mois | `USER_QUOTA_IMAGES` | **oui** | Prod, Preview | **non lue** (n'était pas dans la lecture du 19 sept.) | 5 (repli du code) | **inconnu** — à regarder à la main dans Vercel |
| IP / heure | `IP_RATE_LIMIT_PER_HOUR` | **oui** | Prod, Preview | 30 (lue le 19 sept.) | 30 | aucun — **et plus de repli** |
| IP / jour | `IP_RATE_LIMIT_PER_DAY` | **oui** | Prod, Preview | 100 (lue le 19 sept.) | 100 | aucun — **et plus de repli** |
| Erreurs d'outils / heure | `TOOL_ERROR_RATE_LIMIT_PER_HOUR` | **NON** | — | **20 (repli)** | 20 | valeur = voulue ; **écart de forme** |
| Erreurs d'outils / jour | `TOOL_ERROR_RATE_LIMIT_PER_DAY` | **NON** | — | **100 (repli)** | 100 | idem |
| Seuil d'alerte erreurs / jour | `TOOL_ERROR_ALERT_THRESHOLD_PER_DAY` | **NON** | — | **10 (repli)** | 10 | idem |
| Contact / heure | `CONTACT_RATE_LIMIT_PER_HOUR` | **NON** | — | **5 (repli)** | 5 | idem |
| Contact / jour | `CONTACT_RATE_LIMIT_PER_DAY` | **NON** | — | **15 (repli)** | 15 | idem |

**Limites de cette lecture :** « valeur appliquée » pour les 4 premières lignes vient de la lecture de production du **19 septembre** (plan de travail), pas d'une relecture aujourd'hui ; pour les 5 absentes, **la valeur appliquée se déduit du code** (repli), ce qui est certain puisque la variable n'existe pas. L'affichage « Prod, Preview » ne précise pas d'éventuelles restrictions de branche pour Preview. **Aucune des 5 variables n'existe en Development.**

## 3. Chiffrage de B — SANS l'exécuter

**Variables à créer dans Vercel (5), nom → valeur recommandée :**

| Variable | Valeur | Justification |
|---|---|---|
| `TOOL_ERROR_RATE_LIMIT_PER_HOUR` | `20` | valeur actuelle du repli, justifiée dans `config.js` / `RAPPORT-remontee-erreurs.md` |
| `TOOL_ERROR_RATE_LIMIT_PER_DAY` | `100` | idem |
| `TOOL_ERROR_ALERT_THRESHOLD_PER_DAY` | `10` | idem |
| `CONTACT_RATE_LIMIT_PER_HOUR` | `5` | idem (route qui envoie un vrai e-mail par requête) |
| `CONTACT_RATE_LIMIT_PER_DAY` | `15` | idem |

Environnements : **Production + Preview** au minimum (sinon les préversions ne se construisent plus une fois les replis retirés) ; **Development** recommandé pour les 10 (les 5 existantes n'y sont pas). Aucune de ces valeurs n'est un secret. **Valeurs = celles qui tournent déjà** : créer ces variables ne change **aucun** comportement en production, ce qui est le but. **Décision qui t'appartient :** ces valeurs sont-elles vraiment celles que tu veux pour le lancement ? Les limites de contact (5/h, 15/jour par IP) sont serrées pour des IP partagées le jour du lancement — cousin du risque du point 1, à trancher **avant** de figer.

**Ordre imposé :** ① créer les 5 variables ② vérifier leur présence (noms seulement) ③ **seulement ensuite** retirer les 8 replis restants (`GLOBAL_SPEND_CAP_USD`, `USER_QUOTA_*`, `TOOL_ERROR_*`, `CONTACT_*`) avec `requiredPositiveInt` (le plafond de dépense accepte un décimal : petite variante) ④ déployer. L'inverse casse le build.

**Temps de la correction complète (estimation, pas mesure) : ~1 h 30 à 2 h**
- créer les 5 variables ×2-3 environnements (par toi, ou par `vercel env add` avec ton aval — je n'en ai créé aucune) : 15 min
- code + test 16 étendu aux 8 : 30-40 min
- ajuster les scripts `quota-tests` qui importent `config.js` (03, 09, 10, 13-15…) pour définir les variables : 20-30 min
- build de contrôle (avec / sans variables), déploiement, vérification : 20-30 min
- (Ancien chiffrage du rapport précédent : 3-4 h ; **révisé à la baisse** car 5 des « ~6 variables à créer » existaient déjà.)

## 4. Décisions consignées dans `claude/plan-de-travail.md`
- **Tests Safari en production, une fois chacun** pour Background Remover et Grammar Fixer (~0,003 $) : exception assumée à l'interdit n° 8. La feuille Safari **n'a pas été touchée**.
- **Références croisées Gotenberg : reportées après le lancement**, via `npx @railway/cli`, **jamais sans filtre « noms seulement »**. Rien supprimé.
- État réel des replis et ordre obligatoire de B consignés (bloquant/administratif) et ligne ajoutée aux déclencheurs « Juste APRÈS ».

## 5. Déploiement et vérification en production
**Déploiement :** `dpl_AMK1XRuXnB69g4yyR8KvEs87mC6d`, commit `d517a975`, **READY**, alias `www.onlineconvertools.com` et `onlineconvertools.com` (`aliasError: null`).

**Ce que ça prouve :** le build de production a **réussi avec le nouveau code**. Comme le build échoue si l'une des deux variables est absente ou n'est pas un entier positif (prouvé en local), **les deux variables existent bien dans l'environnement Production et sont valides**.

**Ce que ça NE prouve PAS — non vérifié :** que les valeurs appliquées sont **30 et 100**. Seule preuve disponible : la lecture de production du 19 septembre. La preuve comportementale (31 appels d'un même IP jusqu'au 429 + `Retry-After`) **n'a pas été faite, volontairement** : elle traverserait `guardPaidRoute` (appels OpenAI réels) et épuiserait la limite horaire de **l'IP partagée avec le réseau où tu exécutes la feuille Safari**, ce qui aurait bloqué ton test pendant une heure. À faire **après ta séance Safari**, idéalement depuis une autre IP (partage de connexion du téléphone), sur une route d'erreur ou de contact plutôt que payante si possible — ou tu peux considérer la lecture du 19 septembre comme suffisante.

## 6. Où j'en suis
- **Terminé :** correction A (2 variables IP, testée, buildée, déployée, READY) ; état réel des 10 constantes établi (noms seulement) ; chiffrage de B ; deux décisions consignées dans le plan ; rapport.
- **Non terminé :** (a) vérification comportementale 30/100 en production (voir ci-dessus) ; (b) B (8 replis restants) — **volontairement non exécuté**, décision et création de variables à ton aval ; (c) valeur appliquée de `USER_QUOTA_IMAGES` **non lue**.
- **Ce qui bloque :** rien de technique. Attente de ta décision sur les valeurs de contact (5/h, 15/jour par IP, serrées pour des IP partagées) et de la fin de ta séance Safari.
- **Toute première action à la reprise :** demander si les 5 variables (§3) sont créées avec ces valeurs ; sinon, les créer d'abord (`vercel env add`, avec ton aval), vérifier leur présence par le filtre « noms seulement », **puis seulement** retirer les 8 replis.

