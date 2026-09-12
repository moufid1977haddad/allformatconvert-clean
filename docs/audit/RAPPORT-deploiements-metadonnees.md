# Fréquence de déploiement + métadonnées manquantes

Date : 2026-09-11
Suite de `docs/audit/RAPPORT-indexation.md`, qui a mesuré ~3,1 déploiements de production par jour et identifié 7 pages sans métadonnées.

---

## 1. Mesure — déploiements docs-only sur les 30 derniers

Sur les 30 derniers déploiements de production (Vercel API, filtrés `target: "production"`), **6 déploiements (20 %) n'ont touché AUCUN fichier hors `docs/`, `*.md` ou `README`** :

| # | Commit | Message | Fichiers touchés |
|---|---|---|---|
| 1 | `21374d83` | docs(indexation): diagnostic technique complet | `docs/audit/RAPPORT-indexation.md` |
| 2 | `255bd1ff` | docs(deliverability): audit SPF/DKIM/DMARC | `docs/audit/RAPPORT-delivrabilite.md` |
| 3 | `8ab7fcf0` | docs(contact-attachments): add final report | `docs/audit/RAPPORT-pieces-jointes-contact.md` |
| 4 | `6919cfda` | docs(contact-attachments): checkpoint progress mid-testing | `docs/audit/PROGRESS-pieces-jointes-contact.md` |
| 5 | `ab77de51` | docs(error-reporting): add final report | `docs/audit/RAPPORT-telechargement-word-pdf.md` |
| 6 | `ca863cb9` | docs(error-reporting): record master merge | `docs/audit/RAPPORT-fusion-remontee-erreurs.md` |

Les 24 autres déploiements touchent au moins un fichier hors documentation (`app/`, `lib/`, `package.json`, etc.), y compris 3 commits de merge (`7257e87f`, `c6dfb1e4`, `07434b1a`) et plusieurs commits nommés `docs(...)` qui, malgré leur préfixe, modifient en réalité un fichier `.jsx` applicatif (ex. `d6eed607`, classé ici comme applicatif car il touche `app/tools/video-tools/video-watermark/page.jsx`, pas un fichier de doc — le classement est fait par chemin de fichier réel, pas par le préfixe du message de commit).

Note méthodologique : sur cette même fenêtre de 30 déploiements, 6 sont en réalité des **redéploiements du même commit** (`038933a9` ×2, `eaddc44e` ×4), déclenchés manuellement pour tester un changement de variable d'environnement — un facteur d'amplification distinct du problème docs-only, mais qui consomme la même ressource (le cache JS partagé, cf. `RAPPORT-indexation.md` §3).

---

## 2. Recherche — mécanismes de contrôle du build

Trois façons de dire à Vercel de sauter un build ont été comparées :

| Mécanisme | Versionné dans le dépôt | Fonctionne sur Hobby | Remarque |
|---|---|---|---|
| **Ignored Build Step** (Project Settings → Git, dashboard) | Non — vit uniquement dans la config Vercel, invisible dans `git log`, modifiable par quiconque a accès au dashboard sans trace de revue de code | Oui | Mécanisme historique, mêmes variables d'environnement (`VERCEL_GIT_PREVIOUS_SHA`) que la version vercel.json |
| **`ignoreCommand` dans `vercel.json`** | **Oui** | **Oui** | Documentation Vercel : « Overrides the default Ignored Build Step command » — c'est littéralement la même fonctionnalité, rendue configurable depuis le code plutôt que depuis le dashboard. Contrat identique : code de sortie 0 = build ignoré, code 1 = build lancé |
| Rien (statu quo) | — | — | 20 % de builds inutiles mesurés au point 1 |

Aucune restriction de plan Hobby/Pro/Enterprise n'est documentée pour l'Ignored Build Step ou `ignoreCommand` (contrairement à d'autres fonctionnalités Vercel — ex. `vercel rollback <url>` explicitement réservé Pro/Enterprise dans la documentation officielle). Recherche effectuée via la documentation Vercel officielle (`vercel.com/docs/project-configuration/vercel-json`, `vercel.com/docs/project-configuration/vercel-ts`), pas depuis la mémoire du modèle.

**Solution retenue : `ignoreCommand` dans `vercel.json`.** À fonctionnalité strictement identique à l'option du dashboard, elle est versionnée (visible dans les diffs de PR, review-able, restaurée automatiquement si le projet est recréé) — c'est le critère qui décide, exactement comme demandé. Aucune action dans l'interface Vercel n'était donc nécessaire.

Commande retenue :
```
git diff --quiet ${VERCEL_GIT_PREVIOUS_SHA:-HEAD^} HEAD -- . ':(exclude)docs/**' ':(exclude)**/*.md' ':(exclude)README*'
```
- Compare HEAD au dernier déploiement de production **réussi** (`$VERCEL_GIT_PREVIOUS_SHA`, exposé par Vercel dès qu'un Ignored Build Step est configuré), pas seulement au commit parent immédiat (`HEAD^`, l'exemple par défaut de la documentation Vercel) — nécessaire pour ne rien manquer si plusieurs commits atterrissent en un seul push. `HEAD^` reste le repli pour le tout premier build après activation.
- Exclut `docs/**`, tout fichier `*.md` où qu'il soit dans l'arbre, et tout `README*` — le périmètre exact demandé.
- `git diff --quiet` sort avec le code 0 s'il n'y a aucune différence hors de ces exclusions (build ignoré), 1 sinon (build lancé) — mappage direct sur le contrat `ignoreCommand` de Vercel, aucune inversion de logique à risque d'erreur.

Observation hors périmètre (non appliquée) : `services/gotenberg/` et `services/pdf-tools/` sont deux services Docker déployés séparément sur Railway (chacun a son propre `Dockerfile`), totalement étrangers au build Next.js/Vercel — un changement dans `services/gotenberg/FONTS.md` ou `services/pdf-tools/README.md` déclenche aujourd'hui aussi un build Vercel inutile. Même famille de problème que les docs, candidat naturel pour une extension future du même `ignoreCommand`, mais hors du périmètre demandé ici (docs/*.md/README uniquement).

---

## 3. Implémentation et vérification

`vercel.json` : ajout de `ignoreCommand` (voir ci-dessus), au format JSON validé.

**Vérification locale** contre 4 commits réels de l'historique du dépôt, avant tout déploiement :

| Commit testé | Nature réelle | `git diff --quiet` (code retour) | Attendu | Résultat |
|---|---|---|---|---|
| `21374d83` | docs-only | 0 | ignorer | ✅ |
| `255bd1ff` | docs-only | 0 | ignorer | ✅ |
| `28ad556b` | touche `app/` | 1 | builder | ✅ |
| `d11b4721` | touche `app/`+`lib/` | 1 | builder | ✅ |

Test supplémentaire de correction multi-commits : la plage `6919cfda..8ab7fcf0` (le commit `8ab7fcf0` lui-même est docs-only, mais la plage inclut le commit intermédiaire `d11b4721` qui touche `app/`) renvoie bien le code 1 — confirme que comparer au dernier déploiement réussi plutôt qu'au seul commit parent immédiat est nécessaire pour ne pas rater un changement applicatif « caché » derrière un dernier commit docs-only.

**Vérification en production**, en deux temps puisque les deux branches du comportement (ignorer / builder) ne peuvent être observées que sur deux commits distincts :
1. Commit `981a1b20` (le présent chantier : `vercel.json` + 7 nouvelles métadonnées, touche `app/`) — poussé, a déclenché normalement un nouveau déploiement de production (`dpl_DJ5WnoSV8TRaKMWH252kUsuAyG52`), confirmant que la branche « builder » n'est pas cassée par l'ajout de `ignoreCommand`.
2. Ce rapport lui-même (`docs/audit/RAPPORT-deploiements-metadonnees.md`, docs-only) est commité et poussé séparément juste après — le résultat observé sur ce déploiement est documenté dans la section Résultats ci-dessous.

---

## 4. Métadonnées ajoutées aux 7 pages

Même motif exact que les 240 pages déjà indexées (`title: { absolute }`, `description`, `alternates.canonical` en `www`, `openGraph`) :
- `app/about`, `app/privacy`, `app/terms` sont des Server Components : métadonnées ajoutées en `export const metadata` directement dans `page.jsx` (même mécanisme que `app/about`, qui l'avait déjà).
- `app/contact`, `app/forgot-password`, `app/reset-password`, `app/signin`, `app/signup` sont des Client Components (`'use client'`) : un `layout.tsx` par page, seul moyen d'exporter des métadonnées statiques sans toucher au composant client, identique au motif des 240 pages-outils.

| Page | Titre (≤60) | Description (≤155) |
|---|---|---|
| `/privacy` | OnlineConverTools Privacy Policy — Your Data & Files (52) | How OnlineConverTools collects, uses, and protects your data. Most tools process files entirely in your browser — nothing is uploaded to a server. (146) |
| `/terms` | OnlineConverTools Terms of Service (34) | The Terms of Service for OnlineConverTools: acceptable use, free file conversion tools, and the rules that govern your use of the service. (138) |
| `/contact` | Contact OnlineConverTools — Report a Bug or Ask Us (50) | Contact OnlineConverTools to report a bug, request a new tool, or ask a question. Attach a screenshot and we'll reply to you by email. (134) |
| `/forgot-password` | Forgot Your OnlineConverTools Password? (39) | Forgot your OnlineConverTools password? Enter your email and we'll send you a secure link to reset it. (102) |
| `/reset-password` | Reset Your OnlineConverTools Password (37) | Choose a new password for your OnlineConverTools account using the secure link sent to your email. (98) |
| `/signin` | Sign In to OnlineConverTools (28) | Sign in to your OnlineConverTools account to access your free online file conversion and editing tools. (103) |
| `/signup` | Sign Up for OnlineConverTools (29) | Create a free OnlineConverTools account to sign in and manage your access to our online file conversion and editing tools. (122) |

Les titres décrivent l'intention réelle de recherche pour chaque page (ex. « Forgot Your OnlineConverTools Password? », pas « Forgot Password — Site Name ») plutôt qu'un gabarit générique. Aucune fonctionnalité de compte non existante n'a été inventée dans les descriptions signin/signup (le formulaire d'inscription actuel n'affiche aucune promesse de fonctionnalité au-delà de l'authentification elle-même).

**Vérification locale** : `npm run build` complet (247 pages) exécuté sans erreur ; le HTML généré pour chacune des 7 pages a été inspecté directement dans `.next/server/app/*.html` et contient le `<title>`, le `<meta name="description">` et le `<link rel="canonical">` attendus, avec l'URL canonique en `www.` pour chacune.

---

## 5. Résultats chiffrés

| Constat | Chiffre |
|---|---|
| Déploiements production analysés | 30 derniers (fenêtre Vercel API) |
| Déploiements docs-only sur cette fenêtre | 6 (20 %) |
| Déploiements qui sont des redéploiements du même commit | 6 (20 %), facteur distinct |
| Mécanisme retenu | `ignoreCommand` dans `vercel.json` (versionné, Hobby) |
| Commits historiques utilisés pour valider la commande | 4 (2 docs-only, 2 applicatifs) — comportement exact dans les 4 cas |
| Pages sans métadonnées avant ce chantier | 7 |
| Pages sans métadonnées après ce chantier | 0 |
| Build local (`next build`) | 247/247 pages, 0 erreur |
| Déploiement `981a1b20` (app, doit builder) | déclenché normalement, `dpl_DJ5WnoSV8TRaKMWH252kUsuAyG52`, état `READY`, aliasé sur `www.onlineconvertools.com` |
| Déploiement du rapport docs-only (`a0877f76`) | **ignoré** : `dpl_9n56w5FZSPXjkUzFAzZbfHDBGkag`, état `CANCELED`, `errorLink: vercel.com/docs/platform/projects#ignored-build-step` -- confirmation explicite de Vercel que c'est bien `ignoreCommand` qui a sauté ce build, pas un échec |

**Constat direct** : les deux branches du comportement sont vérifiées en production sur ce chantier même, pas seulement en local -- un commit touchant `app/`/`vercel.json` a construit et publié normalement, un commit docs-only immédiatement après a été annulé par Vercel avec la raison explicite "Ignored Build Step", sans toucher à l'alias de production (resté sur le dernier déploiement réel). Un seul contrôle de statut Vercel par déploiement, sans boucle de surveillance, conformément à la consigne.
