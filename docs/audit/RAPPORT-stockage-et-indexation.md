# RAPPORT — Stockage Vercel, indexation Search Console, coût Railway

Date : 22 septembre 2026. Suite de `RAPPORT-gotenberg-independance.md`.

## 0. Verdict

- **Stockage Vercel : 207 déploiements ramenés à 5 (-97,6 %).** Production actuelle jamais touchée,
  vérifiée intacte avant et après. Je ne peux pas lire le pourcentage exact de stockage moi-même
  (aucun outil ne l'expose) — **à confirmer par toi dans le tableau de bord ou le prochain courriel
  Vercel.**
- **Search Console — les 7 pages « de notre faute » : recherche approfondie, mais je ne peux pas te
  donner les URL exactes sans accès à Search Console.** Tout ce que j'ai pu vérifier moi-même
  (les 240 URL du sitemap, les 202 redirections codées, la configuration de domaine) **est sain,
  aujourd'hui, en direct — zéro anomalie trouvée.** Détail et prochaine étape au §2.
- **Indexation et coût Railway** : chiffres réels du 17/09 et de septembre inscrits dans le plan tels
  que tu me les as donnés (je n'ai pas d'accès direct à ces deux tableaux de bord).

## 1. Stockage Vercel — nettoyage des anciens déploiements

### Constat

**207 déploiements accumulés depuis le 31 mai 2026** (près de 4 mois), dont 146 ciblant la
production et 61 des préversions ; 178 encore à l'état `READY` (donc dont les artefacts de
construction restent stockés), 29 dans un état `CANCELED`/`ERROR`/`BLOCKED` (dont les artefacts
restent aussi, sauf suppression). C'est l'accumulation que le courriel de Vercel signale.

### Politique de conservation retenue, et pourquoi

**Gardé : les 5 déploiements de production `READY` les plus récents**, soit :

| Déploiement | Date | Rôle |
|---|---|---|
| `dpl_G2fFd6zFT2saJ5yJtf2vXAyRNWjh` | 22/09 01h42 | **Production actuelle** — jamais touché |
| `dpl_6JJKN7JUsEjmvmgDRAEeLp7RkbhL` | 22/09 01h30 | Signalé par Vercel lui-même comme candidat au retour arrière en un clic |
| `dpl_CZ1vLyGpxWTYcG5NUrJJvt7hYhhx` | 21/09 22h12 | Fusion D8 (envoi par morceaux Office) — jalon majeur testé |
| `dpl_CbgYRDnktj2eCgnPjDMp6v6g2ySX` | 21/09 20h33 | Fusion du service (changement additif) |
| `dpl_9UjuCFYb7AausgNBfKzv9k3ktXuF` | 21/09 04h54 | Fusion du chantier qualité vidéo |

**Pourquoi 5 et pas moins** : Vercel ne signale que 2 candidats officiels au retour arrière (la
production actuelle et la précédente), ce qui suffit pour un retour arrière immédiat en un clic ;
j'ai gardé 3 de plus, chacun un point de fusion propre et testé, pour une marge de plusieurs jours
si un défaut mettait du temps à apparaître — cohérent avec ce projet (le bogue de marge de plafond
trouvé plus tôt dans la même journée n'est apparu qu'à la vérification, pas tout de suite).

**Supprimé : 202 déploiements** — les 141 autres ciblant la production (tous plus anciens que les 5
gardés, remplacés depuis) et les 61 préversions (leur code reste dans Git ; les reconstruire à
l'identique, si jamais utile, ne demande qu'un nouveau déploiement depuis le bon commit).

**Aucun déploiement en production actuelle n'a été touché.** Le seul actif servant
www.onlineconvertools.com aujourd'hui n'a jamais été dans la liste de suppression — vérifié par
une assertion dans le script lui-même (le script s'arrête si jamais la production actuelle
apparaissait dans la liste à supprimer) et par une relecture après coup.

### Exécution et preuve

Suppression via l'API REST de Vercel (jeton local du CLI, lu et utilisé uniquement à l'intérieur du
script, jamais affiché). **201 suppressions réussies du premier coup, 1 en butée sur la limite de
débit de Vercel (« plus de 200 requêtes »)** — production revérifiée intacte pendant l'attente, puis
la dernière suppression a réussi à la nouvelle tentative. **202 sur 202, confirmé par une relecture
complète de la liste après coup : il ne reste que les 5 déploiements prévus.**

| | Avant | Après |
|---|---|---|
| Déploiements totaux | 207 | **5** |
| Ciblant la production | 146 | 5 |
| Préversions | 61 | 0 |
| États autres que `READY` | 29 | 0 |

**Production vérifiée après coup** : `www.onlineconvertools.com` répond 200, alias toujours sur le
bon déploiement, `readyState: READY`.

### Ce que je ne peux pas te confirmer moi-même

**Le pourcentage réel de stockage utilisé.** Aucun outil à ma disposition n'expose ce chiffre
(les points de terminaison d'utilisation testés répondent 404/400). La réduction de 207 à 5
déploiements (-97,6 %) devrait faire chuter le stockage dans une proportion comparable si le poids
est à peu près uniforme par déploiement, mais **c'est une déduction, pas une lecture directe** —
**vérifie le pourcentage réel dans le tableau de bord Vercel (Usage) ou au prochain courriel.**

## 2. Search Console — les 7 pages « de notre faute »

### Ce que j'ai pu vérifier moi-même, en direct, aujourd'hui

| Vérification | Résultat |
|---|---|
| Les 240 URL du sitemap actuel | **240/240 en 200**, aucune exception |
| Les 202 redirections codées (`lib/legacyRedirects.ts`) | **202/202 saines** : chacune répond par une redirection permanente vers une page qui répond elle-même 200, en un seul saut, aucune chaîne, aucune boucle |
| Configuration de domaine (Vercel) | `onlineconvertools.com` → `www.onlineconvertools.com`, redirection 308 configurée au niveau plateforme, correcte |
| Variantes `http://`, double barre oblique, barre oblique finale | Toutes se résolvent normalement ; le seul cas à deux sauts est `http://onlineconvertools.com` (HTTP→HTTPS puis apex→www) — **comportement standard de toute plateforme avec domaine racine, pas un défaut de configuration**, et deux sauts n'est pas ce que Google classe en « erreur de redirection » (qui vise plutôt les boucles ou les chaînes de 5 sauts et plus) |
| Journaux de production Vercel, 404 sur 30 jours | **Aucun** — mais réserve ci-dessous |
| Recherche `site:onlineconvertools.com` | N'a renvoyé que des sites concurrents sans rapport, cohérent avec la position 74 déjà documentée dans le plan — pas exploitable pour retrouver des URL précises |

**Réserve sur les journaux de production** : l'outil de journaux ne couvre que les invocations de
fonctions serveur. Un 404 sur une page statique inexistante peut ne jamais atteindre une fonction et
donc ne pas y apparaître — son absence ne prouve pas l'absence de 404 réels, seulement que je n'ai
pas pu les voir par ce chemin.

### Ce que je n'ai pas pu déterminer

**Je n'ai trouvé aucune anomalie dans tout ce que je peux tester moi-même.** Cela signifie soit que
les 7 URL concernées sont des adresses **historiques**, jamais couvertes par la table de
redirections actuelle (créées avant elle, ou jamais servies par ce site du tout — un lien externe
mal orthographié, par exemple), soit qu'elles ont déjà été corrigées depuis le dernier passage de
Google (le rapport que tu lis date du 17/09). **Je n'ai pas d'outil pour interroger Search Console
directement** — je ne peux pas lister les URL précises derrière les trois catégories sans que tu me
les donnes.

**Prochaine étape concrète** : dans Search Console → Pages → sous chacune des trois lignes
(Introuvable 404, Page avec redirection, Erreur liée aux redirections), un clic affiche la liste des
URL exactes concernées. Si tu me les colles (même juste les chemins, sans le domaine), je les teste
immédiatement et je corrige ce qui doit l'être — un vrai correctif sur une URL non vérifiée serait
justement le genre d'erreur que ce projet a déjà payée cher (doctrine : mesurer avant de construire).

**Aucune URL saine n'a été retirée du sitemap ni passée en `noindex`** — rien de tel n'a été fait,
puisque rien de cassé n'a été identifié avec certitude.

## 3. Indexation et coût Railway — chiffres reçus, inscrits tels quels

Les deux chiffres suivants viennent de toi (tableaux de bord auxquels je n'ai pas d'accès direct) et
sont simplement consignés dans le plan, comme demandé :

- **Search Console, rapport du 17/09/2026 : 45 pages indexées sur 248, 203 non indexées.** Répartition
  des 203 : 192 « Détectée, actuellement non indexée » (autorité de domaine, ne se corrige pas par du
  code) ; 7 imputables au site (3 introuvables/404, 3 avec redirection, 1 erreur de redirection —
  voir §2).
- **Coût Railway de septembre : 2,65 $ réel (relevé du tableau de bord).** Ma propre mesure via
  l'API d'usage (moins précise, un service non résolu dans le nom manque à l'appel) donne un ordre de
  grandeur comparable (~1,8 $ extrapolé sur ce que l'API me rend), donc pas de contradiction, mais le
  chiffre qui fait foi est le tien. **La veille de `gotenberg-fonts`, activée aujourd'hui
  (`RAPPORT-gotenberg-independance.md`), doit faire baisser ce chiffre au prochain relevé** — il
  tournait 24 h/24 sans aucune requête depuis 3 jours avant l'activation.

## 4. Ce qui reste

- **Le pourcentage réel de stockage Vercel après nettoyage** — à vérifier par toi.
- **Les 7 URL Search Console précises** — à me transmettre depuis le tableau de bord pour correction
  ciblée et vérifiée.
- **Le prochain relevé Railway**, pour confirmer que la veille de `gotenberg-fonts` fait baisser le
  coût comme prévu.

## 5. Livrables

Scripts (non versionnés, usage ponctuel — logique documentée ici) : liste et suppression de
déploiements Vercel via l'API REST (jeton CLI local, jamais affiché), vérification des 240 URL du
sitemap et des 202 redirections en direct. Plan mis à jour : stockage Vercel, indexation réelle du
17/09, coût Railway réel de septembre, déclencheur satisfait retiré.
