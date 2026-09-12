# Diagnostic indexation — onlineconvertools.com

Date : 2026-09-11
Contexte fourni : 248 pages connues de Google, 35 indexées, 205 « Détectée, actuellement non indexée » depuis le 09/06/2026. ~12 requêtes d'exploration/jour, 61 % JS / 10 % HTML, 94 % actualisation / 6 % découverte, 224 ms de réponse moyen, aucun problème d'hôte.

Ce document est un diagnostic. Aucun refactoring n'a été fait. Les seules actions autorisées (retrait d'URL non-200 du sitemap, conversion de liens absolus non-www en liens relatifs) n'ont donné lieu à **aucune correction**, pour la raison indiquée à chaque section : les deux défauts recherchés n'existent pas dans l'état actuel du code.

---

## 1. Inventaire réel (depuis le code, pas depuis PROJET.md)

247 fichiers `page.*` sous `app/` :

| Ensemble | Nombre |
|---|---|
| Pages statiques (accueil, about, contact, privacy, terms, signin, signup, forgot/reset-password) | 9 |
| Page d'index `/tools` | 1 |
| Pages de catégorie (`/tools/<categorie>`) | 12 |
| Pages-outils réelles | 225 |
| **Total** | **247** |

Répartition des 225 outils par catégorie :

| Catégorie | Outils |
|---|---|
| developer-tools | 57 |
| pdf-tools | 39 |
| image-tools | 37 |
| text-tools | 17 |
| ai-tools | 16 |
| video-tools | 15 |
| audio-tools | 11 |
| gif-tools | 11 |
| file-tools | 9 |
| math-tools | 6 |
| converter-tools | 4 |
| qr-barcodes-tools | 3 |

**Client Components** (`'use client'`) : 244 / 247. Les 3 exceptions sont `app/about`, `app/privacy`, `app/terms` (Server Components).

**`generateMetadata` (fonction dynamique)** : **0 page**. En revanche, 240 pages exportent des métadonnées **statiques** (`export const metadata`) — 239 via un `layout.tsx` dédié à chaque route-outil, plus `app/about/page.jsx` qui les déclare lui-même. C'est une pratique correcte et même préférable à `generateMetadata` (pas de coût de calcul par requête), donc pas un défaut en soi.

7 pages n'ont **aucune** métadonnée (pas de `layout.tsx`, pas d'export `metadata`) : `contact`, `privacy`, `terms`, `forgot-password`, `reset-password`, `signin`, `signup`. Les 4 pages d'auth ne sont pas censées être indexées (comportement correct par omission), mais `privacy` et `terms` sont des pages légales normalement indexables et n'ont ni `<title>` ni `<meta description>` propres — signalé pour information, non corrigé (hors périmètre autorisé).

---

## 2. Sitemap

`app/sitemap.ts` construit la liste dynamiquement à chaque build/requête, à partir du système de fichiers :
- 6 URL statiques codées en dur (accueil, `/tools`, about, contact, privacy, terms)
- 12 URL de catégorie, une par dossier sous `app/tools/`
- une URL par sous-dossier de catégorie contenant un `page.{jsx,js,tsx}`, **sauf** si son `layout` porte `robots: { index: false }`

3 outils sont actuellement exclus par ce filtre noindex (`ai-tools/image-generator`, `pdf-tools/pdf-to-excel`, `pdf-tools/pdf-to-ppt`) — vérifiés en ligne, ils répondent 200 mais sont volontairement non indexés (contenu encore incomplet). `pdf-repair` et `pdf-to-pdfa`, mentionnés par erreur dans une note de suivi comme « à venir », sont en réalité déjà livrés et correctement indexables : cette ancienne information était obsolète.

**Sortie : 240 URL** (6 + 12 + 222), confirmé par téléchargement du sitemap de production (`curl https://www.onlineconvertools.com/sitemap.xml`, 240 `<loc>`).

**Test HTTP des 240 URL** (sans suivre les redirections, User-Agent navigateur) : **240/240 renvoient 200**. Aucune 404, aucune redirection au sein du sitemap actuel.

Les « 4 pages en 404 et 3 en redirection » signalées par Search Console ne correspondent à aucune URL du sitemap actuel. L'explication la plus probable, avec preuve à l'appui : le site a subi une réorganisation de son arborescence (catégorie `media-tools` éclatée en `audio-tools` / `gif-tools` / `video-tools`, `image-converter` et `image-editor` déplacés sous `image-tools`, ancien schéma d'URL plates `/tools/<outil>` remplacé par `/tools/<categorie>/<outil>`). Un système de redirections permanentes (`lib/legacyRedirects.ts`, 200+ règles, branché dans `next.config.ts`) couvre déjà exhaustivement ces anciennes URL — vérifié en direct : `/tools/media-tools/audio-booster` → 308 vers `/tools/audio-tools/audio-booster`, `/tools/pdf-merge` → 308 vers `/tools/pdf-tools/pdf-merge`, `/login` → 308 vers `/signin`. Ce travail de correction date du 2026-09-01 (`docs/specs/2026-09-01-legacy-url-redirects.md`) ; les 404/redirections que Search Console affiche encore sont donc très probablement des données **antérieures à cette correction**, pas encore rafraîchies par un nouveau passage de Googlebot.

**Conclusion** : aucune URL à retirer du sitemap (il est déjà 100 % sain). Aucune route à corriger. Point 2 ne nécessite aucune action de code.

Observation annexe (non corrigée, hors périmètre) : `sitemap.ts` fixe `lastModified: new Date()` pour les 240 URL à **chaque exécution** — vérifié sur le sitemap de production, les 240 balises `<lastmod>` sont toutes à la même seconde de génération (8 valeurs distinctes à la milliseconde près). Ce champ est donc actuellement dénué de sens : chaque page paraît « modifiée à l'instant » à chaque build, alors que la plupart ne changent jamais. Voir recommandation n°2.

---

## 3. Coût d'exploration d'une page — la question centrale

Trois pages-outils de 3 catégories différentes, HTML brut récupéré côté serveur avec un User-Agent Googlebot, **sans exécution JavaScript** :

| Page | `<h1>` | Contenu SeoContent (description/howTo/FAQ/tips) | Liens de nav | Taille HTML |
|---|---|---|---|---|
| `/tools/pdf-tools/pdf-merge` | présent | présent (FAQ vérifiée mot à mot : questions **et** réponses complètes dans le HTML) | présent | 60 228 o (9,6 Ko compressé) |
| `/tools/image-tools/image-compressor` | présent | présent | présent | 60 068 o (9,6 Ko compressé) |
| `/tools/developer-tools/json-formatter` | présent | présent | présent | 60 675 o (9,6 Ko compressé) |

**Réponse à la question posée : tout le contenu utile à l'indexation est déjà dans le HTML initial, sans exécution JS.** `'use client'` dans l'App Router de Next.js ne veut pas dire « rendu uniquement côté client » : le premier rendu de l'arbre React se fait toujours côté serveur, hydratation ou pas. Googlebot n'a donc **pas besoin** d'exécuter le JavaScript pour voir le `<h1>`, la description, les étapes « How to », les FAQ ou les liens — l'hypothèse de départ (qu'il faille exécuter le JS pour voir le contenu) est **infirmée par les faits**.

**Fichiers JS demandés par page** : 15 fichiers `_next/static/chunks/*.js` distincts (hors script tiers Google Translate), pour un poids de **~1,17 Mo non compressé / ~330 Ko transférés (gzip)**. Décomposition :
- **14 fichiers sont strictement identiques sur les 3 pages testées** (bundle framework/vendor partagé, ~326 Ko compressés), servis avec `Cache-Control: public, max-age=31536000, immutable` — donc mis en cache une fois pour tout le site.
- **1 seul fichier est spécifique à la page** (2 à 4 Ko compressés selon l'outil).

Coût marginal réel d'une page-outil supplémentaire une fois le cache chaud : ~2-4 Ko, pas 330 Ko. Le tableau 61 % JS / 10 % HTML ne s'explique donc pas par « chaque page force un rechargement complet du JS ».

**Ce qui casse ce cache, et qui est la cause la plus probable des 61 % JS** : chaque fichier `_next/static/chunks/*.js` est servi avec un paramètre de requête `?dpl=dpl_<id-de-déploiement>` (Skew Protection de Vercel). Ce paramètre change à **chaque déploiement en production** — même si le contenu du bundle est identique. Résultat : le cache `immutable` d'un an devient sans effet dès qu'un déploiement a lieu, puisque l'URL elle-même change. `git log` mesure **292 commits en 94 jours (2026-06-09 → 2026-09-11), soit ~3,1/jour en moyenne**, avec des journées à 15-21 commits. Si chacun (ou une bonne partie) déclenche un déploiement en production, le bundle partagé de 326 Ko doit être retéléchargé en intégralité par Googlebot au prochain crawl suivant chaque déploiement — pour un budget total mesuré de seulement ~12 requêtes/jour, **un seul déploiement peut consommer à lui seul plus d'une journée entière de budget de crawl**, rien qu'en retéléchargement du bundle JS partagé, sans qu'aucune page HTML nouvelle ne soit visitée. C'est cohérent avec le ratio 94 % actualisation / 6 % découverte observé : le peu de budget disponible est capté par le rafraîchissement de ressources déjà connues (le JS), au détriment de la découverte de nouvelles pages HTML.

---

## 4. Liens internes

**Distance en clics depuis l'accueil** : **2 clics pour les 225 pages-outils**, sans exception — vérifié en HTML brut (User-Agent Googlebot), pas en supposant le comportement du menu :
- Accueil → page de catégorie : lien direct présent dans le HTML brut de l'accueil pour les 12 catégories (`<nav>` avec `<Link href={cat.href}>`, rendu côté serveur, hors du menu déroulant).
- Page de catégorie → page-outil : chaque page de catégorie liste tous ses outils en HTML brut, vérifié exhaustivement — `pdf-tools` (39/39 liens présents), `image-tools` (37/37), `developer-tools` (57/57), `ai-tools` (16/16), `qr-barcodes-tools` (3/3) : correspondance exacte avec le nombre réel d'outils de chaque catégorie.

**Pages orphelines (aucun lien interne entrant) parmi les 240 URL du sitemap : 0.** Chaque page-outil est atteinte par au moins le chemin accueil → catégorie → outil.

Point notable non demandé mais pertinent pour comprendre le trafic Googlebot : le **méga-menu au survol** de la barre de navigation (`app/components/Navbar.jsx`, état React `openCat`) ne rend ses ~225 liens outil qu'après un événement `onMouseEnter` — ces liens sont **absents du HTML initial** (confirmé : la page d'accueil ne contient que 18 liens `/tools/...` en dur dans le HTML brut, correspondant aux 12 catégories + 6 outils « vedettes », pas aux 225 outils du menu). Googlebot ne simule pas de survol de souris et ne verra donc jamais ce menu déroulant. **Ce n'est pas un problème structurel** — le chemin accueil → catégorie → outil couvre déjà 100 % des pages en HTML pur — mais le menu déroulant n'ajoute aucune valeur de crawl, seulement du confort visuel pour l'utilisateur humain.

**Liens internes absolus vers `https://onlineconvertools.com` (sans www)** : recherche exhaustive sur tout le dépôt (`.js/.jsx/.ts/.tsx`). **2 occurrences trouvées, toutes les deux dans des scripts de test/audit** (`scripts/audit/fixtures/verify-extra.js`, `scripts/audit/fixtures/verify-prod-fixes.js`) — des utilitaires de vérification qui ciblent la prod depuis la ligne de commande, jamais exécutés ni rendus dans une page servie à un visiteur ou à Googlebot. **Zéro occurrence** dans le code applicatif (`app/`), dans les métadonnées (`alternates.canonical`, Open Graph) ou dans un composant de lien. Toutes les métadonnées canoniques vérifiées utilisent `https://www.onlineconvertools.com`.

**Conclusion** : aucune page orpheline, aucun lien absolu non-www dans le code applicatif. Point 4 ne nécessite aucune action de code.

---

## 5. Synthèse chiffrée

| Constat | Chiffre |
|---|---|
| Pages réelles sous `app/` | 247 (225 outils + 12 catégories + `/tools` + 9 statiques) |
| Client Components | 244 / 247 |
| Pages avec métadonnées | 240 / 247 (0 via `generateMetadata`, 240 via `export const metadata` statique) |
| Pages sans aucune métadonnée | 7 (`contact`, `privacy`, `terms`, 4 pages d'auth) |
| URL dans le sitemap de prod | 240 |
| URL du sitemap répondant 200 | 240 / 240 (100 %) |
| URL du sitemap à corriger/retirer | 0 |
| Contenu SEO visible sans JS (3 pages testées) | 3 / 3 (h1, description, howTo, FAQ, nav — tout présent) |
| Fichiers JS par page-outil | 15 (14 partagés + 1 spécifique) |
| Poids JS par page | ~330 Ko transféré (compressé) / ~1,17 Mo brut |
| Poids JS marginal réel par page (cache chaud) | ~2-4 Ko |
| Commits/déploiements probables | 292 en 94 jours, ~3,1/jour |
| Pages orphelines (0 lien entrant) | 0 / 240 |
| Profondeur de clic max vers une page-outil | 2 |
| Liens absolus non-www dans le code applicatif | 0 (2 occurrences, uniquement dans des scripts de test hors production) |

---

## Recommandations (classées gain/effort, non appliquées)

**1. Réduire la fréquence des mises en production (ou différer la promotion en prod des déploiements successifs) — gain élevé, effort quasi nul.**
Aucune ligne de code à changer : il s'agit de grouper les déploiements (ex. une promotion prod par jour au lieu de ~3) plutôt que de promouvoir chaque commit. Chaque déploiement change le paramètre `?dpl=` de tous les chunks JS partagés (326 Ko compressés / 14 fichiers), ce qui invalide le cache immuable d'un an pour l'ensemble du site. Avec un budget mesuré de ~12 requêtes Googlebot/jour, un seul déploiement peut absorber plus d'une journée entière de ce budget rien qu'en retéléchargement du bundle partagé — c'est le facteur le plus directement chiffrable derrière le ratio 61 % JS / 94 % actualisation. Passer de ~3 à ~1 déploiement/jour réduirait mécaniquement d'environ 2/3 le nombre d'événements d'invalidation de cache JS.

**2. Corriger `lastModified` dans `app/sitemap.ts` pour refléter une vraie date de modification (mtime git du fichier, ou hash de contenu) au lieu de `new Date()` — gain moyen, effort faible.**
Actuellement les 240 URL du sitemap affichent systématiquement l'heure de build comme date de dernière modification, un signal que Google peut apprendre à ignorer s'il constate qu'il est toujours faux. Remplacer par la date réelle du dernier commit touchant chaque route (`git log -1 --format=%aI -- <fichier>`) redonnerait un signal de fraîcheur exploitable pour prioriser le budget de crawl sur les pages qui changent réellement. Effort : quelques lignes dans `sitemap.ts` ; non appliqué ici car hors du périmètre explicitement autorisé pour cette session (retrait d'URL non-200 uniquement).

**3. Redemander l'indexation / revalider le sitemap dans Search Console maintenant que le diagnostic confirme un état sain — gain incertain mais quasi gratuit, effort quasi nul.**
Le sitemap est à 100 % en 200, le système de redirections legacy (`lib/legacyRedirects.ts`) est en place et fonctionnel depuis le 2026-09-01. Les 4 404 / 3 redirections que Search Console affiche encore datent très probablement d'avant cette correction. Une resoumission du sitemap et une inspection manuelle de quelques URL « Détectée, non indexée » dans Search Console coûte quelques clics et purge potentiellement ces faux signaux d'erreur qui pourraient faire hésiter l'algorithme de priorisation du crawl.

---

*Aucune action de correction de code n'a été nécessaire pour les points 2 et 4 : les deux défauts recherchés (URL sitemap non-200, liens absolus non-www dans le code applicatif) n'existent pas dans l'état actuel du dépôt. Le cycle test local → commit → push → déploiement ne porte donc que sur ce rapport.*
