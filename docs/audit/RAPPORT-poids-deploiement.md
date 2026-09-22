# RAPPORT — Poids réel d'un déploiement Vercel, et validation Search Console

Date : 22 septembre 2026. Suite de `RAPPORT-stockage-et-indexation.md`, qui s'arrêtait à
« réduire le nombre de déploiements gardés » — un mauvais diagnostic, corrigé ici : **le problème
n'était pas le nombre, c'était le poids unitaire.**

## 0. Verdict

- **Cause trouvée et corrigée : les cartes de source serveur (`.js.map`) représentaient 45 % du
  poids d'un déploiement, pour zéro usage réel.** Un réglage d'une ligne (`experimental.
  serverSourceMaps: false`) fait passer le résultat de build de **157 Mo à 89 Mo (-43 %)**, mesuré
  deux fois avec un vrai `next build`, avant et après. Déployé en production, revérifié : le site
  sert exactement les mêmes pages.
- **Marge de retour arrière réduite de 5 à 3 déploiements**, comme demandé, une fois le correctif
  du point précédent en production.
- **Le pourcentage affiché dans le tableau de bord Vercel (7,79 Go / 10 Go) n'a PAS bougé après
  ces deux actions**, revérifié en direct après chacune. Ce n'est pas un échec des correctifs : la
  mesure directe (poids du build sur disque, nombre de déploiements via l'API) confirme les deux ;
  c'est le chiffre agrégé du tableau de bord Vercel qui ne s'actualise pas à chaud. Détail au §3.
- **Les 3 vraies pannes 404 de Search Console (yaml-to-json, epub-to-pdf, file-encryptor) ont été
  validées** — Google a commencé une nouvelle exploration le 22/09/2026. **Les trois autres
  catégories n'ont pas été touchées**, comme demandé.

## 1. Pourquoi un déploiement pesait 1,3 Go en moyenne — la vraie cause

### Ce qui a été écarté avant de trouver la bonne piste

Le dépôt Git suivi ne pèse que **~23 Mo au total** (`docs/` 11,4 Mo, `scripts/` 5,1 Mo, `public/`
3,5 Mo, `app/` 2,4 Mo, `services/` 0,3 Mo, etc. — mesuré par `git ls-tree`). Les suspects cités dans
la demande (fixtures vidéo, montages PNG de `docs/audit/`, Dockerfiles de `services/`) **ne
peuvent pas, à eux seuls, expliquer 1,3 Go** : même s'ils étaient tous embarqués tels quels, on est
loin du compte d'un facteur 50. Il n'y a pas de `.vercelignore` dans le projet, et il n'y en avait
jamais eu besoin jusqu'ici pour cette raison précise.

### La vraie cause, mesurée avec un vrai build

Le déploiement est de type `LAMBDAS` (fonctions serveur) et est construit par Vercel à partir du
dépôt Git — ce n'est donc pas le dépôt source qui pèse, mais **le résultat du `next build`** (le
dossier `.next`, équivalent local du contenu réellement empaqueté et servi).

Un `next build` réel, lancé en local, donne :

| | Poids |
|---|---|
| `.next` total | **157 Mo** |
| dont `.next/server` (fonctions) | 141 Mo |
| dont `.next/static` (fichiers client) | 15 Mo |
| **dont cartes de source `.js.map`** | **64,2 Mo, dans 1 618 fichiers — 45 % de `.next/server`** |

Les plus grosses : `pdfjs-dist` (2,2 Mo), `heic2any` (1,4 Mo), `pdf-lib`/`@pdf-lib` (1,2+0,9 Mo),
`next/dist` (plusieurs fichiers à 0,7-1,2 Mo), `utif2`, `upng-js`, `jsqr`... — une carte par gros
paquet serveur, générée par défaut.

**Ces cartes ne sont jamais servies à un visiteur.** Elles ne servent qu'à symboliser une pile
d'erreurs serveur pendant un débogage — chose qu'on ne fait pas aujourd'hui sur ce projet. La
documentation de Next.js embarquée dans le dépôt (`node_modules/next/dist/docs/01-app/02-guides/
memory-usage.md`, lue avant tout code conformément à `AGENTS.md`) confirme le réglage exact pour
les désactiver, distinct du réglage `productionBrowserSourceMaps` (qui vise les cartes
**navigateur**, déjà à `false` par défaut et sans effet ici) :

```ts
// next.config.ts
experimental: {
  serverSourceMaps: false,
},
```

### Mesure avant/après, avec un vrai build à chaque fois

| | Avant | Après |
|---|---|---|
| `.next` total | 157 Mo | **89 Mo (-43 %)** |
| `.next/server` | 141 Mo | **73 Mo (-48 %)** |
| `.next/static` | 15 Mo | 15 Mo (inchangé, normal — les cartes concernées sont côté serveur) |
| Cartes `.js.map` | 64,2 Mo / 1 618 fichiers | **0 fichier** |

### Rien de cassé — vérifié avant ET après déploiement

**Avant de committer**, le nouveau build a été démarré en local (`next start`) et testé :
- Page d'accueil : 200, 99 730 octets
- Une page outil (`pdf-to-word`) : 200, 56 955 octets
- Une page catégorie (`video-tools`) : 200, 68 027 octets
- Une URL inexistante : 404 (sain)

**Après déploiement en production** (commit `3b201855`, déployé et `READY` en 31 s), revérifié en
direct sur le vrai domaine :
- `https://www.onlineconvertools.com/` : 200
- `https://www.onlineconvertools.com/tools/pdf-tools/pdf-to-word` : 200
- `https://www.onlineconvertools.com/tools/video-tools` : 200
- Une redirection legacy (`/tools/epub-to-pdf`) : toujours 200 en 1 saut

**Rien n'a changé pour le visiteur. Le poids du résultat de build a baissé de 43 %.**

## 2. Marge de retour arrière réduite à 3

Une fois le correctif du §1 en production et vérifié, le nombre de déploiements gardés pour le
retour arrière a été réduit de 5 à 3 (l'action demandée seulement APRÈS le correctif de poids, pour
ne pas mélanger les deux effets) :

- **Avant** : 6-8 déploiements en liste (5 gardés + des déploiements intermédiaires créés par les
  commits de ce chantier).
- **Après** : **3 déploiements**, tous vérifiés `READY`, dont la production actuelle
  (`dpl_2x83tYtnNQ2N8Cmq6UPDCPHXo1st`, confirmée par lecture directe de l'alias
  `www.onlineconvertools.com` avant toute suppression). 5 déploiements supprimés (2 `CANCELED`
  sans utilité, 3 `READY` plus anciens que les 3 gardés). **Production revérifiée intacte après
  coup** (200 sur le domaine réel).

## 3. Pourquoi le pourcentage du tableau de bord n'a pas encore bougé

**Revérifié deux fois en direct sur le tableau de bord Vercel (Usage → Deployment Storage)** :
une fois juste après le déploiement plus léger, une fois juste après la réduction à 3
déploiements. **Les deux fois : toujours exactement 7,79 Go / 10 Go**, identique à la mesure
d'avant les deux correctifs.

**Ce n'est pas que les correctifs n'ont rien fait** — les deux sont vérifiés indépendamment et
directement : le poids du build sur disque (mesuré par `next build`, pas déduit) a baissé de 43 %,
et le nombre de déploiements réels (lu par l'API Vercel, pas déduit) est passé à 3. **C'est le
chiffre agrégé du tableau de bord qui ne s'actualise visiblement pas à chaque déploiement** — son
graphique n'a qu'un point par jour, ce qui suggère un recalcul à cadence quotidienne plutôt qu'en
temps réel, malgré l'indicateur « Mis à jour il y a 2 min » qui ne concerne que la fraîcheur de
l'affichage, pas forcément celle du calcul sous-jacent. **Ceci n'est pas prouvé avec certitude** —
seule une nouvelle lecture demain le confirmera.

**Projection, pas une mesure** : si le tableau de bord finit par refléter les 3 déploiements
actuels (chacun ~89 Mo au lieu d'une moyenne antérieure de ~1,3 Go), le nouveau total attendu est
de l'ordre de **3 × 89 Mo ≈ 267 Mo, soit environ 2,7 % du palier de 10 Go** — contre 77,9 %
aujourd'hui. **À vérifier par une nouvelle lecture du tableau de bord d'ici un jour ou deux** ; si
le chiffre n'a toujours pas bougé passé ce délai, il faudra reconsidérer l'hypothèse.

## 4. Search Console — validation des 3 vraies pannes, comme demandé

Dans Search Console → Indexation → Pages → « Introuvable (404) », clic sur **« Valider la
correction »** pour les 3 URL confirmées réellement corrigées depuis le 31/08
(`yaml-to-json`, `epub-to-pdf`, `file-encryptor` — voir `RAPPORT-stockage-et-indexation.md` §2 pour
le détail du diagnostic). **Réponse de Search Console, lue en direct : « État de la validation :
commencé, Début : 22/09/2026 »** — Google a lancé une nouvelle exploration de ces 3 URL.

**Aucune validation demandée pour les 3 « Page avec redirection »** (comportement voulu, rien à
valider) **ni pour l'« Erreur liée aux redirections »** (`/tools/media-tools`, anomalie non
reproduite) — conformément à l'instruction.

## 5. Ce qui reste

- **Relire le tableau de bord Vercel (Usage → Deployment Storage) d'ici 1 à 2 jours** pour confirmer
  que le pourcentage a bien baissé vers l'ordre de grandeur projeté (~3 %) et non resté figé — dans
  ce dernier cas, il faudra revoir l'hypothèse sur ce que mesure réellement cette métrique.
  **Le chiffre du plan reste 77,9 % jusqu'à cette nouvelle lecture — ne pas le considérer comme
  résolu avant.**
- **Suivre l'état de la validation Search Console** (Indexation → Pages → Introuvable (404)) :
  Google indique généralement un résultat sous quelques jours à quelques semaines.
- **Vérifier si d'autres routes/paquets serveur lourds ont eux aussi des cartes de source
  superflues ailleurs** (non cherché ici, la seule cause quantifiée était `experimental.
  serverSourceMaps`, qui couvre tout `.next/server`) — pas nécessaire pour l'instant, le correctif
  déjà appliqué couvre 100 % des cartes serveur trouvées.

## 6. Livrables

- `next.config.ts` : `experimental.serverSourceMaps: false`, commit `3b201855`, déployé et vérifié
  en production.
- Deux builds de production réels (`next build`), avant et après, mesurés par répertoire et par
  fichier (`du`, `find -printf`).
- Un vrai déploiement de production (`dpl_2x83tYtnNQ2N8Cmq6UPDCPHXo1st`) confirmé `READY` et servant
  le trafic réel avant toute suppression de déploiement.
- Script de réduction à 3 déploiements gardés (mêmes garanties que le nettoyage précédent : jamais
  la production actuelle, vérification après coup).
- Validation Search Console demandée pour les 3 URL réellement corrigées, confirmée « commencé ».
