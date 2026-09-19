# RAPPORT — préparation des tests Safari (bloquant 9) + deux vérifications

**Date :** 19 septembre 2026 · **Branche :** `safari-preparation` · **Code de production modifié : aucun.**
Livrables : `claude/tests-safari-proprietaire.md`, `docs/audit/fixtures-safari/`, `scripts/generate-safari-fixtures.js`, mise à jour de `claude/plan-de-travail.md`.

**Ce qui n'a PAS été fait, et pourquoi :** aucun test dans Safari, aucune simulation, aucun WebKit local (consigne). La feuille repose sur la **lecture du code** ; ses mentions « suspect » sont des hypothèses.

---

## 1. Références croisées Gotenberg — **RESTE NON VÉRIFIÉ**

**Résultat : impossible à trancher depuis ce poste, et je m'arrête là comme demandé.**

- `railway` est **absente du PATH** et introuvable dans les emplacements usuels (npm global, WinGet, Program Files, scoop, cargo). `npx --no-install railway` échoue (paquet non installé).
- Le dossier `~/.railway` **existe** (fichiers `config.json`, `version.json`, etc.) : la connexion du 18 septembre a bien laissé une trace, mais **il n'y a pas de binaire pour s'en servir**. Je n'ai **pas ouvert** `config.json` (il contient le jeton) et **n'ai pas** appelé l'API GraphQL à la main avec ce jeton : ce n'était pas ce que tu as autorisé (tu as parlé de la CLI), et le plan interdit de piloter Railway autrement que par la CLI/API *prévue*. Aucun clic dans le tableau de bord.
- **Ce que disent les sources écrites (aucune n'est une vérification) :**
  | Source | Affirme | Base déclarée |
  |---|---|---|
  | `plan-de-travail.md` (ADMINISTRATIF) | références croisées | recopié |
  | `RAPPORT-gotenberg-versionne.md` l.138 | les 9 variables ajoutées par `${{gotenberg-fonts.NOM_VAR}}` | **leurs valeurs n'ont jamais été lues** |
  | `RAPPORT-fidelite-office.md` l.23 | « aucune référence croisée » | lecture d'API, où une référence peut apparaître comme une valeur |
  | `REFERENCE-projet.md` l.43-53 | références croisées, « non revérifiée » | renvoie au plan |
- **Indice qui penche pour « références réelles » :** le rapport de versionnement décrit le *geste* d'ajout (`${{…}}`), pas seulement un état lu après coup. Ce n'est **pas** une preuve.
- **Correction faite dans le plan :** l'affirmation est réécrite en **« NON VÉRIFIÉ »**, avec les trois sources, la raison de l'échec, la règle prudente (traiter la dépendance comme réelle : supprimer à tort tue la production Office → PDF) et le **moyen de trancher**.
- **Piège relevé en rédigeant ce moyen :** la CLI Railway **imprime les valeurs** (`railway variables`). Le plan précise désormais qu'il faut la filtrer par un script qui n'affiche que le **nom** et un booléen « commence par `${{` ». Une première rédaction de ma part recommandait la commande brute : corrigée avant commit.
- **Pour trancher (à ton aval) :** installer la CLI (`npm i -g @railway/cli`), `railway login` si nécessaire, puis le script filtré. ~10 minutes.

## 2. Repli silencieux 10/h et 30/jour — **CONFIRMÉ, non corrigé**

`lib/quota/config.js` lignes 8-9 :
```js
const IP_RATE_LIMIT_PER_HOUR = Number(process.env.IP_RATE_LIMIT_PER_HOUR || 10);
const IP_RATE_LIMIT_PER_DAY  = Number(process.env.IP_RATE_LIMIT_PER_DAY  || 30);
```
Variable absente (ou vide, ou `"0"` — `||` traite `0` comme absent) → **10/h et 30/jour**, sans un mot dans les logs. Production lue le 19 septembre : **30/h et 100/jour**. C'est bien l'interdit permanent n° 3.

**Portée réelle :** consommé par `lib/quota/ipRateLimit.js` uniquement (16 outils payants + détourage). Le sens de l'erreur est **plus strict**, donc pas de dépense non maîtrisée : le risque est de **bloquer des visiteurs légitimes à 10 requêtes/h**, sans que personne le sache.

**Le même défaut existe sur 8 autres constantes du même fichier :** `GLOBAL_SPEND_CAP_USD` (20), `USER_QUOTA_PDF_CONVERSIONS` (5), `USER_QUOTA_IMAGES` (5), `TOOL_ERROR_RATE_LIMIT_PER_HOUR/DAY` (20/100), `TOOL_ERROR_ALERT_THRESHOLD_PER_DAY` (10), `CONTACT_RATE_LIMIT_PER_HOUR/DAY` (5/15). **Piège :** la lecture de production du 19 septembre ne liste que 4 variables (`USER_QUOTA_PDF_CONVERSIONS`, `IP_RATE_LIMIT_*`, `GLOBAL_SPEND_CAP_USD`) ; **les 6 autres sont vraisemblablement absentes de Vercel** (non vérifié — `vercel` n'est pas installé ici) et **tournent donc, en production, sur leurs replis.** Supprimer les replis sans les créer d'abord casserait le formulaire de contact et la remontée d'erreurs.

**Un défaut voisin, non vérifié :** `Number('abc')` donne `NaN` sans repli ; ce que `incrementCounter` en fait (limite désactivée ?) n'a pas été lu.

**Chiffrage de la correction (estimation, pas une mesure) :**

| Périmètre | Travail | Durée |
|---|---|---|
| **A. Les 2 variables IP seulement** | fonction de lecture **stricte et paresseuse** (à l'appel, pas à l'import : un `throw` à l'import casserait `next build` partout où la variable manque, ex. préversions) ; `ipRateLimit.js` renvoie **503 avec message clair** si absente/invalide (même schéma que D6) ; `guard.js` propage ; test « absente → erreur, pas 10 » ; adapter `scripts/quota-tests/06-ip-rate-limit.js` (il importe la constante) ; **vérifier par noms que les 2 variables existent sur Production, Preview ET Development** | **1 à 1 h 30** |
| **B. Tout le fichier (10 constantes)** | idem ×10, **plus créer ~6 variables dans Vercel** (action manuelle du propriétaire — règle : jamais générer/poser un secret à sa place ; ici ce ne sont pas des secrets, mais c'est son tableau de bord) ; retest des scripts `quota-tests` 03/06/09/10/13-15 | **3 à 4 h** |
| **Risque à accepter** | après correction, **une variable supprimée par erreur = 503 sur les 16 outils payants** (au lieu d'un comportement dégradé silencieux). C'est le but (échec bruyant), mais c'est un choix | — |

**Recommandation :** faire **A** avant le lancement (les 2 variables qui protègent le budget public sont déjà posées : coût de vérification minimal), **B** après. Décision à ton aval ; rien n'a été modifié.

## 3. Feuille Safari — `claude/tests-safari-proprietaire.md`

- **20 outils** : les 6 « Popular Tools » (accueil + pied de page) + 14 outils cités sur les cartes de catégorie de l'accueil, **retenus d'abord par le risque lu dans le code**. Critère écrit dans la feuille pour être contestable. **Écart assumé :** Word/Excel/PPT to PDF ne sont pas dans les 20 (absents des cartes de l'accueil) ; signalés comme « n° 21 » optionnel.
- **Ordre :** risque décroissant ; **séance A (iPhone 1-10) puis C (MacBook 1-10)** couvrent le plus risqué en ~1 h ; total honnête **~2 h**, en deux jours possibles.
- **Chaque outil :** URL complète, fichier (type/taille), geste avec **les libellés de boutons réels** (extraits du code ; une première rédaction en avait inventé une vingtaine, corrigés après vérification), résultat attendu, case RÉUSSI/ÉCHOUÉ/BLOQUÉ, risques lus dans le code.
- **Fichiers d'essai :** générés par `scripts/generate-safari-fixtures.js` (PDF 3 p. ×2, PDF 30 p., ZIP, PNG de QR) dans `docs/audit/fixtures-safari/` ; photos/vidéo/mémo vocal **à produire sur l'iPhone** (plus réaliste, et rien à télécharger). **Vérifié :** PDF et PNG sont identiques d'une exécution à l'autre ; **le ZIP ne l'est pas** (contenu stable, octets différents) — noté dans le script.
- **Rapport d'échec :** 7 points à noter (écran, message exact, geste, reproductibilité, console Mac…) pour corriger sans refaire le test.

### Suspects lus dans le code (hypothèses, à confirmer par toi)
| # | Outil | Ce que le code fait | Pourquoi Safari peut casser |
|---|---|---|---|
| 1-3 | video-compressor / converter / trimmer | `video.captureStream()` + `MediaRecorder({mimeType:'video/webm'})`, **aucun `isTypeSupported`** | support de `captureStream` sur `<video>` et de l'écriture WebM incertain ; sortie `.webm` possiblement illisible sur iPhone |
| 4 | voice-recorder | `new MediaRecorder(stream)` sans type, blob **étiqueté `audio/webm`**, fichier `recording.webm` | Safari produit du MP4/AAC : fichier mal nommé |
| 5 | image-converter | Worker + `OffscreenCanvas.convertToBlob`, **WebP par défaut**, AVIF, `Download all` = plusieurs clics, `revokeObjectURL` synchrone | WebP/AVIF encodés via canvas peu ou pas pris en charge ; téléchargements multiples ; révocation immédiate |
| 6-7 | background-remover / image-upscaler | recomposition pleine résolution ; upscaler jusqu'à ×8 dans un canvas | limite de surface de canvas de Safari iOS |
| 8 | video-to-gif | attend `seeked` **sans délai** (mp4-to-gif en a un) | blocage infini possible sur iOS |
| 9 | mp4-to-gif | `accept="video/mp4"` | l'iPhone filme en `.mov` |
| 10-11 | audio-converter / trimmer | ffmpeg.wasm (~25-30 Mo, mono-thread, sans COOP/COEP) | mémoire iPhone, durée du premier chargement |

**Constat inverse, utile :** la majorité des téléchargements sont des liens `<a download href="blob:…">` cliqués par l'utilisateur (le cas le plus favorable à Safari). 18 fichiers appellent `revokeObjectURL` ; **13 occurrences** d'un `.click()` figurent dans les 3 lignes qui précèdent (comptage approximatif par `grep`, non relu cas par cas). Si le test montre des fichiers vides, c'est la première piste.

## 4. Plan de travail mis à jour
- Bloc « feuille opérationnelle » ajouté au **bloquant 9** (comme le 11), ligne dédiée dans « Les autres documents », journal de la semaine 1 (jour 4 : « feuille prête, en attente »). **Le bloquant reste OUVERT.**
- Verdicts → remontent dans le bloquant 9, jamais dans « CLOS » sans retest.
- Références croisées : réécrites en **non vérifié**. Repli 10/30 : ajouté comme point confirmé/non corrigé.

## 5. Points qui te reviennent
1. **Règle n° 8 vs feuille :** Background Remover et Grammar Fixer déclenchent des opérations payantes **en production** dans la feuille (préversion protégée = pénible sur iPhone). Par défaut : une fois chacun (~0,003 $). **Dis-moi si tu préfères une préversion.**
2. **Installer la CLI Railway ?** (§1)
3. **Corriger les replis ? A avant lancement, B après ?** (§2)

## 6. Déploiement
**Aucun code de production modifié** (un script hors application, des fixtures et de la documentation) → pas de déploiement nécessaire ; l'`ignoreCommand` de `vercel.json` peut d'ailleurs annuler le build de commits `docs/**`/`*.md` (comportement documenté, pas une panne).
