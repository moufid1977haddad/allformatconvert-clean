# RAPPORT — Correcteur de grammaire : consigne « modifications minimales » (option A)

**Date :** 27 septembre 2026, 00 h - 01 h 15 · **Branche :** `licence-ameliorations` · **Balise de restauration :** `avant-grammaire-minimale` · **Production : INCHANGÉE** (`master` = `4d8ed7ff`) — la condition de mise en production n'est pas remplie (§3).

## 0. En une table

| Point | Verdict |
|---|---|
| Consigne | « modifications MINIMALES et PRÉCISES, ne pas réécrire ni paraphraser », sans amélioration de style, langue, écriture et typographie gardées, phrase juste laissée telle quelle, **+ « minimal ne veut pas dire partiel »**, **+ 3 exemples** (réglage le mieux mesuré par arXiv 2609.10810), aucun tiré des corpus de test |
| Anglais (corpus du 26/09) | version finale **25/25 sur 3 passages sur 3**, texte sans faute **intact 3 fois sur 3** (LanguageTool 15/25) ; les deux versions intermédiaires faisaient 24/25 — d'où les ajouts |
| 10 langues (mêmes corpus que la veille, français ôté avec ton accord) | **mieux ou égal dans 7 langues** (de, zh, ja, ar, hi, tr, pt), **léger recul dans 3** (es, it, ru : 1 à 2 phrases) |
| Mise en production | **NON** : ta condition était « au moins aussi bonne dans chaque langue » ; es, it, ru ne la remplissent pas |
| Face à LanguageTool | nous corrigeons **plus que LT dans toutes les langues** ; restons **en dessous sur les phrases empirées en es, it, ru, zh, ja** |
| Appels payants | **55 appels** (préversion), **≈ 0,03 $** ; aucun sur www (pas de mise en production) ; plafond de 2 $ respecté |
| Plan | notes pour demain (agrandisseur 1 Mpx + recherche concurrents chiffrée, tests de charge acceptés avec ta clé, corpus fr/ko facultatifs) |

## 1. La consigne (`lib/ai/toolPrompts.js`)

Formulation déclarative de la recherche (*Larger Context Window, Fewer Overcorrections*, arXiv 2609.10810 : « Make MINIMAL, PRECISE edits to fix errors. DO NOT rewrite or paraphrase. »), adaptée au multilingue : garder la langue et l'écriture, ne jamais traduire, garder la typographie (guillemets, parenthèses, ponctuation pleine ou demi-chasse), garder les retours à la ligne ; phrase sans erreur laissée telle quelle. Trois itérations, chacune mesurée sur préversion :

| Version | Commit | Anglais (corrigées / 25) | Texte sans faute |
|---|---|---|---|
| 1. consigne minimale seule | `09dc35a0` | 24 (« it's taste » → « it's **tastes** ») | intact |
| 2. + « minimal ne veut pas dire partiel » | `567e089c` | 25, 24, 24 | 1 fausse correction sur 3 (« Neither of the reports **were** ») |
| 3. + 3 exemples (few-shot) | `4e879162` | **25, 25, 25** | **intact 3/3** |
| *ancienne consigne (26/09)* | — | *25, 25* | *intact 2/2* |

Les trois exemples (« The childs was playing… », une phrase juste laissée intacte, une phrase française avec guillemets « ») ne recoupent **aucune** erreur des corpus de test (vérifié par recherche dans les fichiers). Coût d'usage : la consigne passe de ≈ 40 à ≈ 250 jetons d'entrée, soit **+ 0,00003 $ par correction**.

## 2. Remesure sur la préversion, mêmes corpus, mêmes résultats de LanguageTool

Préversion `9lkobia3c` (commit `4e879162`), vraie IA, par un relais local (dossier temporaire ne contenant que `.vercel/project.json`, jeton récupéré en mémoire par `vercel env run`, jamais affiché — **dossier supprimé**). Mêmes lots de phrases que la veille ; LanguageTool **non rappelé** : comparaison avec ses résultats de la veille. Le français est ôté (accord donné : son corpus est invalide, et ses 3 appels ne tenaient pas dans la limite horaire).

| Langue | Exactes : ancienne / **nouvelle** / LT | Empirées : ancienne / **nouvelle** / LT | Inchangées : nouvelle / LT | Nouvelle ≥ ancienne ? | Nouvelle face à LT |
|---|---|---|---|---|---|
| pt | 29 / **31** / 10 | 3 / **0** / 10 | 6 / 16 | oui | au moins aussi bien |
| de | 10 / **16** / 5 | 11 / **4** / 12 | 3 / 10 | oui | au moins aussi bien |
| ar | 5 / **7** / 0 | 15 / **3** / 20 | 0 / 6 | oui | au moins aussi bien |
| ja | 7 / **18** / 0 | 25 / **9** / 0 | 7 / 40 | oui | en dessous (empirées) |
| zh | 1 / **3** / 0 | 24 / **14** / 1 | 8 / 39 | oui | en dessous (empirées) |
| tr | 12 / **12** / — | 25 / **14** / — | 3 / — | oui | pas de LT |
| hi | 1 / **4** / — | 33 / **31** / — | 5 / — | oui | pas de LT |
| es | 13 / **11** / 3 | 12 / **11** / 7 | 6 / 24 | **NON** (−2 exactes) | en dessous (empirées) |
| it | 8 / **7** / 3 | 13 / **8** / 7 | 6 / 18 | **NON** (−1 exacte) | en dessous (empirées) |
| ru | 15 / **13** / 12 | 14 / **15** / 2 | 10 / 24 | **NON** (−2 exactes, +1 empirée) | en dessous (empirées) |

**Lecture.** Sur l'ensemble des 10 langues : phrases empirées **175 → 109** (−38 %), phrases exactes **101 → 122**. Le gain est massif là où la réécriture était la pire (japonais 25 → 9 empirées, chinois 24 → 14, arabe 15 → 3, allemand 11 → 4). Les reculs en espagnol, italien et russe portent sur **1 ou 2 phrases sur 40** ; le modèle répond avec une part de hasard (température par défaut), donc un écart de cette taille peut être du bruit — mais je ne peux pas l'affirmer sur un seul passage, et ta condition était stricte. **Aucune mise en production.** La production garde l'ancienne consigne ; la nouvelle est sur la branche, prête.

Script : `docs/audit/grammaire-multilingue/bench.mjs` (options `--no-lt`, `--tag`), comparaison `compare.mjs` ; résultats sans extraits de corpus (`results-minimal-*.json`).

## 3. Ce qui reste en dessous de LanguageTool, et la suite proposée — rien n'a été changé

**Corrections** : nous sommes **au-dessus de LanguageTool dans toutes les langues** mesurables (exactes : 106 contre 33 sur les 8 langues communes).
**Phrases rendues moins correctes** (empirées sur 40) : **en dessous de LanguageTool en espagnol (11 contre 7), italien (8 contre 7), russe (15 contre 2), chinois (14 contre 1), japonais (9 contre 0)**. En chinois et en japonais, LanguageTool ne touche presque à rien (39 et 40 phrases inchangées sur 40) et ne corrige aucune erreur : il « n'empire » que parce qu'il ne fait rien. Hindi et turc restent mauvais (31 et 14 empirées), sans comparaison possible.

**Options, coûts d'usage calculés sur les prix officiels relus ce soir** (par correction typique ≈ 450 jetons d'entrée, 200 de sortie ; « pour 1000 » = 1000 corrections) :

| Option | Contenu | Coût d'usage | Coût pour mesurer (≈ 42 appels) | Travail |
|---|---|---|---|---|
| **T — température 0 pour le correcteur (recommandée en premier)** | réglage standard en correction : supprime la part de hasard, rend les comparaisons fiables à la phrase près, et réduit en général les réécritures ; se règle pour ce seul outil | inchangé (0,19 $ pour 1000) | ≈ 0,03 $ | ≈ 1 h avec la remesure |
| M1 — `gpt-4.1-mini` | modèle plus récent, même gamme | ≈ 0,50 $ pour 1000 (×2,6) | ≈ 0,03 $ | ≈ 1 h |
| M2 — `gpt-5-mini` | gamme plus récente (ses jetons de raisonnement peuvent augmenter la sortie : à mesurer) | ≈ 0,51 $ pour 1000, plus si raisonnement | ≈ 0,05 $ | ≈ 1 h |
| M3 — `gpt-4.1` ou `gpt-4o` | grands modèles | ≈ 2,5 à 3,1 $ pour 1000 (×13 à ×16) — pèse sur le plafond global de 20 $/mois | ≈ 0,15 $ | ≈ 1 h |
| W — avertissement honnête | pour ru, zh, ja (et hi, tr) : dire sur la page que l'outil peut reformuler au-delà des fautes dans ces langues et que chaque changement se défait d'un clic (le surlignage mot à mot existe déjà) | — | — | 30 min |

**Recommandation :** T d'abord (gratuit à l'usage), remesuré 2 fois pour mesurer le bruit ; si es, it, ru repassent au niveau de l'ancienne consigne, mettre en production la nouvelle consigne + T ; pour les langues encore sous LanguageTool sur les phrases empirées, M1 ou M2 mesurés sur ces langues seulement, et W en attendant. **Rien de tout cela n'est fait sans ton accord.**

## 4. Notes ajoutées au plan pour demain (non traitées)

- **a. Image Upscaler, 1 Mpx** : décision **à moitié documentée** (fixée d'après le temps mesuré, 1 Mpx ×4 = 34,5 s sur 8 vCPU ; jamais comparée au marché). **Recherche faite ensuite, sans appel payant ni code, à ta demande** : iLoveIMG « smaller than 6MP », Upscale.media 6,25 Mpx sans compte en ×4 (25 Mpx avec compte), Bigjpg 9 Mpx en gratuit, LetsEnhance 64 Mpx de sortie en gratuit — **nous sommes 4 à 9 fois en dessous**. Proposition chiffrée dans le plan : **P1** relever à 6 Mpx sur le processeur actuel (≈ 3,5 min et ≈ 0,013 $ par image de 6 Mpx, estimations ; service partagé avec le détourage → file propre ; ≈ 4-6 h) ; **P2** carte graphique à la demande (nouveau fournisseur, ≈ 1-2 jours).
- **b. Tests de charge** : acceptés sur le principe, **demain avec toi ; la clé de test, c'est toi qui la génères**.
- **c. Corpus français et coréen** : facultatifs, pour plus tard (inscription par toi).

## 5. Hygiène

- **55 appels payants**, tous sur la préversion : **28 en anglais** (version 1 : 4 ; version 2 : 12 ; version 3 : 12), 1 en portugais, 26 pour les 9 autres langues — **≈ 0,03 $**, annoncés et acceptés avant lancement. **Limite horaire (heure UTC pleine) respectée** : 29 appels dans la première heure, 26 dans la suivante, après avoir attendu 01 h 00 à ta demande plutôt que de programmer un réveil ; aucune boucle d'attente, aucune surveillance.
- Préversions créées par les pushes : `8wwps9foz`, `3eod5jhst`, `9lkobia3c` (aucune production). Dossier temporaire du relais **supprimé** (un reste de processus `vercel env run` a dû être arrêté pour pouvoir le supprimer). Aucun fichier d'environnement lu, modifié ni copié. Aucun push forcé.
- Tests des consignes : `scripts/ai-prompt-tests/run.js` 15/15 à chaque version.
