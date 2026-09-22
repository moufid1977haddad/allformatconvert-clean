# RAPPORT — Stockage Vercel, indexation Search Console, coût Railway

Date : 22 septembre 2026. Suite de `RAPPORT-gotenberg-independance.md`.

**Version 2 de ce rapport** : la version précédente s'arrêtait à « je ne peux pas lire ça
moi-même ». Ce n'était pas vrai — le connecteur Vercel et Claude in Chrome permettaient les deux
lectures directement. Cette version contient les chiffres et les URL réels, lus en direct.

## 0. Verdict

- **Stockage Vercel : 77,9 % (7,79 Go / 10 Go), mesuré en direct — PIRE que les 75 % du courriel,
  malgré le nettoyage de 207 déploiements à 5.** La suppression n'a pas fait ce qu'on en attendait ;
  détail et explication la plus probable au §1.
- **Search Console — les 7 pages « de notre faute » : les 7 URL relevées et diagnostiquées une par
  une, en direct, via Claude in Chrome sur Search Console.** Aucune n'est cassée aujourd'hui. Détail
  au §2.
- **Indexation et coût Railway** : chiffres réels du 17/09 et de septembre, inchangés depuis la
  version précédente de ce rapport.

## 1. Stockage Vercel — mesuré en direct, résultat contre-intuitif

### Le chiffre

Lu dans le tableau de bord Vercel (Usage → Deployment Storage), projet `onlineconvertools` — seul
projet de l'équipe, donc 100 % du chiffre lui est attribuable :

**7,79 Go / 10 Go = 77,9 %.**

C'est **plus haut** que les 75 % annoncés par le courriel Vercel qui a déclenché ce chantier — alors
que dans l'intervalle, 202 des 207 déploiements ont été supprimés (voir le rapport précédent pour le
détail de cette suppression, qui reste valide et vérifiée : production jamais touchée).

### Pourquoi la suppression n'a (visiblement) pas aidé sur ce chiffre précis

Relevé technique à l'appui : au moment de cette mesure, le projet ne compte plus que **6
déploiements** (les 5 gardés pour la marge de retour arrière, plus 1 nouveau créé par un commit
poussé après le nettoyage — `dpl_Nd7PuWVhZB2TLWdR7gZGjwDt6vT8`, à l'état `CANCELED`, créé le 22/09 à
03h08). Le graphique 30 jours du tableau de bord montre une **croissance continue** de 4,68 Go
(23/08) à 7,79 Go (22/09), sans aucune marche visible à la baisse au moment du nettoyage.

**L'explication la plus probable, sans certitude absolue (l'API Vercel n'expose pas la taille par
déploiement, donc ceci reste une déduction, pas une mesure directe)** : cette métrique ne compte pas
le nombre de déploiements mais le poids des artefacts de build **actuellement conservés**. Les 202
déploiements supprimés étaient anciens ; il est probable que Vercel avait déjà recyclé leur stockage
de son côté (pratique courante sur les plateformes cloud pour les déploiements remplacés depuis
longtemps), rendant notre suppression explicite sans effet mesurable sur ce chiffre précis — même si
elle reste justifiée pour d'autres raisons (clarté de la liste, hygiène générale).

**Le vrai poids semble être les 5-6 déploiements gardés pour la marge de retour arrière** : à raison
d'environ 1,3 Go par déploiement en moyenne (7,79 Go / 6 — une moyenne, pas une mesure individuelle),
garder plusieurs déploiements complets pour le retour arrière coûte cher en soi.

### Marge et rythme

- **Marge restante : 2,21 Go (22,1 %) avant le palier gratuit de 10 Go.**
- **Rythme mesuré sur le graphique** : moyenne du mois ≈ 0,11 Go/jour (4,68→7,79 Go sur 29 jours),
  mais **accélération nette la dernière semaine** : 6,0 Go le 14/09 → 7,79 Go le 22/09, soit
  **≈ 0,26 Go/jour** — plus du double de la moyenne mensuelle, corrélé aux chantiers à gros volume de
  la semaine (D8 envoi par morceaux, architecture vidéo, indépendance Gotenberg).
- **À ce rythme récent, le palier des 10 Go serait atteint dans environ 8 à 9 jours si rien ne
  change.** Ce n'est pas une marge de plusieurs mois.

### Ce qui aiderait réellement (pas encore fait, à décider)

Puisque le nombre total de déploiements n'est plus le levier (déjà réduit à l'essentiel), les deux
leviers réels sont :
1. **Réduire le nombre de déploiements gardés en marge de retour arrière** (5 → 2-3) — Vercel ne
   signale que 2 candidats officiels au retour arrière ; les 3 de plus gardés par prudence coûtent
   à eux seuls une part significative des 7,79 Go.
2. **Réduire la fréquence des déploiements de production** pendant les périodes de chantier intense
   (chaque commit sur `master` déclenche un nouveau déploiement complet) — pas toujours possible
   pendant un chantier actif, mais à garder en tête après le lancement.

## 2. Search Console — les 7 pages « de notre faute », relevées et diagnostiquées

### Méthode

Navigation directe dans Search Console via Claude in Chrome : propriété `onlineconvertools.com` →
Indexation → Pages → ouverture de chacune des 3 lignes concernées, lecture de leur tableau
« Exemples ». Chaque URL trouvée a ensuite été vérifiée en direct par requête HTTP (`curl`), et
recoupée avec `lib/legacyRedirects.ts` et son historique Git.

### Les 7 URL, une par une

**« Introuvable (404) » — 3 pages :**

| URL | Dernier crawl Google |
|---|---|
| `onlineconvertools.com/tools/yaml-to-json` | 25 juillet 2026 |
| `onlineconvertools.com/tools/epub-to-pdf` | 13 juillet 2026 |
| `onlineconvertools.com/tools/file-encryptor` | 12 juillet 2026 |

Les trois utilisent le domaine nu (sans `www`) et l'ancien chemin plat `/tools/<outil>` (avant la
catégorisation). **C'était une vraie panne au moment du crawl** : la table `lib/legacyRedirects.ts`
qui les redirige aujourd'hui vers leur page catégorisée a été créée le **31 août 2026**
(`f0ab1ddc`) — après ces trois dates de crawl. Autrement dit, Google a raison sur ce qu'il a vu, et
le correctif existe déjà depuis presque un mois. **Vérifié en direct aujourd'hui : les 3 répondent
200, en 2 sauts** (apex→www au niveau de la plateforme, puis ancien chemin→chemin catégorisé au
niveau de l'app). **Rien à corriger côté code.**

**« Page avec redirection » — 3 pages :**

| URL | Dernier crawl Google |
|---|---|
| `http://www.onlineconvertools.com/` | 19 septembre 2026 |
| `http://onlineconvertools.com/` | 23 août 2026 |
| `https://onlineconvertools.com/` | 23 août 2026 |

Ce sont les trois variantes **non canoniques** de la page d'accueil (HTTP au lieu de HTTPS, domaine
nu au lieu de `www`), qui redirigent toutes vers `https://www.onlineconvertools.com/`. **C'est le
comportement voulu** : la redirection existe précisément pour qu'aucune de ces variantes ne soit
indexée séparément de la version canonique. Google classe cette page correctement — ce n'est pas une
anomalie. **Rien à corriger.**

**« Erreur liée à des redirections » — 1 page :**

| URL | Dernier crawl Google | Première détection |
|---|---|---|
| `https://www.onlineconvertools.com/tools/media-tools` | 12 septembre 2026 | 15 septembre 2026 |

Vérifiée en direct : `curl` confirme une redirection 308 simple vers `/tools/video-tools`, qui
répond 200 directement (aucun saut supplémentaire), correspond à une entrée légitime de
`lib/legacyRedirects.ts` (ligne 229 : l'ancienne catégorie `media-tools` n'avait pas de successeur
unique, `video-tools` a hérité de la majorité de ses outils), et la destination n'est pas bloquée par
`robots.txt`. **Aucune anomalie reproduite aujourd'hui.** L'explication la plus probable est un aléa
transitoire au moment précis du passage de Googlebot (par exemple un démarrage à froid de fonction
Vercel ayant retardé la réponse ce jour-là) plutôt qu'un défaut permanent — non prouvable
rétroactivement, mais rien de reproductible n'a été trouvé pour justifier un correctif de code.

### Ce qui a été fait, ce qui ne l'a pas été

- **Aucune URL saine n'a été retirée du sitemap ni passée en `noindex`** — aucune des 7 n'en avait
  besoin.
- **Aucun clic sur « Valider la correction » n'a été fait dans Search Console.** La règle du plan
  (« Ne pas cliquer VALIDER LA CORRECTION tant que rien n'a été corrigé ») l'interdit sans ton
  accord explicite. Pour les 3 « 404 », la correction existe réellement depuis le 31/08 — cliquer
  serait donc l'usage légitime du bouton, mais je ne l'ai pas fait de moi-même.

## 3. Indexation et coût Railway — chiffres reçus, inscrits tels quels

Inchangé depuis la version précédente de ce rapport :

- **Search Console, rapport du 17/09/2026 : 45 pages indexées sur 248, 203 non indexées.**
  Répartition des 203 : 192 « Détectée, actuellement non indexée » (autorité de domaine) ; 7
  imputables au site (voir §2, aucune cassée aujourd'hui).
- **Coût Railway de septembre : 2,65 $ réel (relevé du tableau de bord).** La veille de
  `gotenberg-fonts`, activée le 22/09 (`RAPPORT-gotenberg-independance.md`), doit faire baisser ce
  chiffre au prochain relevé.

## 4. Ce qui reste

- **Décider si le nombre de déploiements gardés en marge de retour arrière (5) doit baisser** pour
  reprendre de la marge sur le stockage Vercel — à ton arbitrage, avec le compromis explicité au §1.
- **Décider si les 3 « 404 » de Search Console doivent être validées** (« Valider la correction »)
  maintenant que la correction est confirmée réelle depuis le 31/08.
- **Le prochain relevé Railway**, pour confirmer que la veille de `gotenberg-fonts` fait baisser le
  coût comme prévu.
- **Revérifier le stockage Vercel d'ici quelques jours** compte tenu du rythme récent (~0,26 Go/jour) —
  la marge de 2,21 Go pourrait s'épuiser en 8-9 jours si les chantiers à gros volume continuent au
  même rythme.

## 5. Livrables

- Lecture directe du tableau de bord Vercel (Usage → Deployment Storage) via Claude in Chrome.
- Lecture directe de Search Console (Indexation → Pages → 3 catégories) via Claude in Chrome.
- Vérification croisée de chaque URL trouvée par requête HTTP directe (`curl -sIL`) et par lecture de
  `lib/legacyRedirects.ts` et de son historique Git (date de création de la table de redirections).
- Re-listing des déploiements Vercel actuels via l'API REST (jeton CLI local, jamais affiché) pour
  confirmer l'état après nettoyage (6 déploiements, dont 1 nouveau `CANCELED`).
- Plan mis à jour : chiffre de stockage réel + rythme, les 7 URL diagnostiquées une par une.
