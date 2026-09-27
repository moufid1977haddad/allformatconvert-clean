# RAPPORT — Séance du 27 septembre 2026

**Branche :** `licence-ameliorations` (partie de `4d8ed7ff`) · **Aucun déploiement de production, aucune suppression ni aucun renommage d'outil ou de service, aucun fichier d'environnement lu, aucune commande `vercel link` / `env pull` / `env run`, aucune surveillance, aucun push forcé.**

## 0. En une table

| Point | Verdict |
|---|---|
| 1. Plan | sitemap **retiré** (dans CLOS, à ne plus reposer) ; DPA ConvertAPI **pas un bloquant** (source légale relue en direct aujourd'hui) ; forfait **Max le 24 du mois** (prochain 24/10) ; `REMOVEBG_API_KEY` **n'existe plus** dans Vercel (noms seulement) ; **ligne d'arrivée** ajoutée |
| 2. Safari | feuille refaite : **29 outils** (31 modifiés depuis le 19/09), retests S1-S5, classés par risque lu dans le code, **≈ 3 h 25** (moitié risquée ≈ 2 h), 13 fichiers d'essai ajoutés |
| 3. Grammaire hors anglais | l'outil n'annonce que l'anglais mais accepte tout ; mesuré sur **10 corpus publiés**, 30 appels, **≈ 0,014 $** : **plus de corrections que LanguageTool partout**, mais **sur-correction** → en dessous sur les phrases empirées en **ru, zh, ja, es, it** ; fr et ko non mesurables sans inscription ; **solution proposée, rien changé** |
| 4. Saturation | méthode sans secret ni limite 20/h établie ; **mesuré en local** : ajouter des emplacements n'augmente pas le débit ffmpeg, ≈ 80 s de CPU par vidéo 30 s 1080p ; Gotenberg = 1 document Office à la fois par instance (doc officielle), 1,5-2,4 s par petit document ; **test de charge proposé et chiffré (< 0,70 $ au total), rien lancé contre la production** |

## 1. Corrections du plan (`claude/plan-de-travail.md`, commit `3cc9c6d3`)

| Point | Fait |
|---|---|
| a. Sitemap Search Console | Tâche **retirée** d'ADMINISTRATIF et **rangée dans CLOS** avec la mention « NE PLUS JAMAIS LA REPOSER » (un seul sitemap, en `www`, 240 URL, vérifié par le propriétaire). Aucune autre mention dans `claude/`. |
| b. DPA ConvertAPI | Voir ci-dessous. Une seule version gardée : **pas un bloquant**. |
| c. Anthropic | « Le 27 de chaque mois — Pro — CA$ 32,19 » remplacé par **« Le 24 de chaque mois (prochain : 24 octobre 2026) — forfait Max depuis le 24/09 »** (montant à relever sur la facture : je ne l'ai pas). |
| d. `REMOVEBG_API_KEY` | **N'existe plus dans Vercel** : `vercel env ls --project onlineconvertools` (option `--project`, sans aucun lien local, depuis un dossier vide), colonne des noms seulement : **36 variables, aucune ne contient `REMOVEBG`**. Le code n'en dépend pas (`REMOVEBG_PER_IMAGE_DOLLARS`, `MAX_REMOVEBG_*` sont des constantes de `lib/quota/`). Ligne passée en ✅. |
| e. Ligne d'arrivée | Section **« 🏁 LIGNE D'ARRIVÉE »** ajoutée en tête du CRITÈRE DE LANCEMENT : 6 points pour le propriétaire (≈ 8 h en tout, dont la passe Safari ≈ 3 h 30), 6 pour Claude (≈ 11 à 21 h selon ce que Safari fera remonter), et ce qui **n'est pas** un bloquant. |

**b. Le choix sur le DPA, expliqué.** Les deux lignes datent du même soir, et l'ordre des commits tranche : « **rendu plus urgent** » (tableau « Déclenchés par le lancement », commit `5870d31c`, 22/09 à 21 h 29, chantier des plafonds) a été écrit **avant** « **n'est plus un bloquant** » (critère de lancement et ADMINISTRATIF, commit `5866a90c`, 22 h 57), qui repose sur la lecture directe du document légal. J'ai **relu ce document en direct aujourd'hui** (`convertapi.com/compliance/dpa.pdf`, « Privacy Policy and Data Processing Terms », mise à jour du 7 février 2025, toujours en ligne) : *« unless the individual Data Processing Agreement is signed the terms of this Privacy Policy and Data Processing Terms will apply to all our processing of any personal data »*. Les conditions de sous-traitance s'appliquent donc **déjà, sans signature**. L'argument de la ligne « plus urgent » — l'exposition a grandi depuis D8 (`.docx` et PDF jusqu'à 100 Mo passent par ConvertAPI) — est exact, mais il ne change pas le cadre légal, seulement le volume. **Version gardée : pas un bloquant ; un DPA individuel signé reste facultatif (traçabilité), procédure et courriel prêts dans `RAPPORT-gotenberg-independance.md`.** La ligne « plus urgent » est barrée avec le renvoi, pour qu'on voie pourquoi elle ne vaut plus.

## 2. Feuille Safari (`claude/tests-safari-proprietaire.md`, commit `270a2453`)

- **Recensement :** `git log --since=2026-09-19 -- app/tools` → **31 outils créés ou modifiés** depuis la feuille du 19/09. Pour chacun, les fonctions à risque sous Safari relevées **dans le code** (Worker, WebAssembly, OffscreenCanvas, caméra, presse-papiers, envoi par morceaux vers notre service, formats Opus).
- **29 outils, classés par risque**, la moitié la plus risquée d'abord (séances A iPhone et C MacBook, **15 outils**, dont **tous les retests S1-S5**) : Zip Extractor, Video Compressor/Converter/Trimmer [S1], Voice Recorder [S2], Audio Merger, les 4 outils audio en Opus, Barcode Generator, QR Scanner (caméra, collage, dépôt), Image Converter [S3], Image Upscaler [S4], Audio Trimmer, Image Compressor, Hash Generator, MP4/MOV to GIF [S5]. Puis GIF Maker, Word to PDF, Split/Compress PDF, QR Generator, Grammar Fixer, Unit et Color Converter, Image Resizer, Background Remover, Tar Extractor, Merge PDF, outils de texte, Currency Converter.
- **Durée : ≈ 3 h 25** (A 75 min, C 40 min, B 50 min, D 25 min, préparation 15 min) — estimation. **Moitié la plus risquée seule : ≈ 2 h.**
- **Fichiers d'essai ajoutés** dans `docs/audit/fixtures-safari/` (script `scripts/generate-safari-fixtures-2.mjs`) : RAR fait par WinRAR (noms chinois), RAR à en-têtes chiffrés (`1234`), 7z chiffré (`data-only`), RAR en 3 volumes (`mot de passe`), ZIP d'arborescence, trois sons purs pour Audio Merger, un son de 12 s pour Audio Trimmer, une image de 800×600 pour l'agrandisseur. Plus `fidelite-01.docx` et les fichiers faits sur l'iPhone (vidéo, photo, HEIC, mémo vocal).
- **Vérifié dans le code en écrivant :** l'agrandisseur **refuse** au-delà de 1 Mpx (il ne réduit pas) — la feuille teste donc le refus puis une petite image ; les empreintes attendues de `abc` (SHA-256, MD5), les conversions attendues (1 GB = 1000 MB, 1 atm = 101,325 kPa, `#FF8000` en HSV/CMYK) sont données pour juger sans outil.
- **Limite de 20 conversions/heure** : la séance A en consomme ≈ 12-14 ; la feuille le dit, avec la conduite à tenir.
- ⚠️ **Effet de bord signalé :** le push de ce commit contenait un script (`scripts/…`), ce qui a **déclenché automatiquement une build de préversion Vercel** (`go60c4jwn`, pas la production) — la règle `ignoreCommand` ne saute que `docs/` et les `.md`. Je ne l'ai pas annulée sans ton avis. Les scripts suivants de la séance sont rangés sous `docs/audit/` pour ne plus en déclencher.

## 3. Correcteur de grammaire hors anglais

### 3.1 Ce que l'outil annonce et accepte
- **Annonce :** l'anglais seulement — FAQ : *« It works primarily with English text; results for other languages may be less reliable. »*
- **Accepte :** n'importe quelle langue. Aucun sélecteur ni aucune détection : le texte part tel quel à `gpt-4o-mini` avec une consigne en anglais (`lib/ai/toolPrompts.js` : *« Fix all grammar, spelling, and punctuation errors… Return only the corrected text »*), 8000 caractères au plus, 1000 jetons de réponse.
- **Le site propose 13 langues** (sélecteur de traduction, `app/layout.tsx`) : en, fr, es, zh, ar, de, pt, ja, ru, it, ko, hi, tr. Ce sont les **12 langues hors anglais mesurées ici**. LanguageTool (API publique, lue aujourd'hui) en gère 9 ; **ni le coréen, ni l'hindi, ni le turc**.

### 3.2 Corpus publiés (aucun n'est de moi)
40 paires {phrase fautive, correction de référence} par langue, prises à intervalles réguliers dans la partie test (règle identique pour toutes, `docs/audit/grammaire-multilingue/build.py`) :

| Langue | Corpus | Nature |
|---|---|---|
| es | COWS-L2H (UC Davis, Apache-2.0) | apprenants, corrections parfois stylistiques |
| de | Falko-MERLIN, partie test (Boyd 2018) | apprenants |
| pt | Penteado & Perez 2023 (CC BY 4.0) | grammaire, orthographe, frappe, internet (brésilien) |
| it | MERLIN italien (CC BY-SA 4.0) | apprenants |
| ru | LORuGEC test (BEA 2025) | phrases natives, erreurs insérées (ponctuation, orthographe) |
| zh | NLPCC 2018 test | apprenants |
| ja | JWTD v2 test (Wikipédia, CC BY-SA 3.0) | fautes de frappe corrigées |
| ar | ZAEBUC test (CC BY-NC-SA 4.0) | étudiants |
| hi | Hi-GEC test (COLING 2025) | révisions Wikipédia |
| tr | GECTurk, critiques de films annotées (Apache-2.0) | 25 règles d'orthographe |
| **fr** | WiCoPaCo (seul corpus libre trouvé) | **inutilisable** : tokenisé des deux côtés (« c' est ») et, même corrigé, ce sont des révisions Wikipédia, pas des corrections (« deux fils » → « trois fils », « Duché » → « Duchesse ») |
| **ko** | aucun | les corpus coréens (Kor-Lang8, Kor-Native, Kor-Learner) exigent un formulaire Google |

### 3.3 Mesure sur www (`docs/audit/grammaire-multilingue/bench.mjs`)
Les phrases partent **par lots, une par ligne**, comme un texte collé par un visiteur ; LanguageTool reçoit les mêmes lots, toutes ses premières suggestions appliquées (« tout accepter »). Pour chaque phrase, contre la référence du corpus : **exacte** (identique), **empirée** (plus éloignée de la référence qu'avant), **inchangée**, et la part médiane de l'écart comblé (1 = référence atteinte, 0 = rien, < 0 = empiré). **30 appels à l'IA, coût estimé ≈ 0,014 $** (plafond accordé : 2 $). 0 ligne perdue sur 400 envoyées, 1 en arabe.

| Langue | Exactes : nous / LT | **Empirées : nous / LT** | Inchangées : nous / LT | Écart comblé (médiane) : nous / LT | Verdict |
|---|---|---|---|---|---|
| pt | **29** / 10 | **3** / 10 | 4 / 16 | (moyenne 0,61 / −0,88) | **au-dessus** |
| ar | **5** / 0 | **15** / 20 | 1 / 6 | 0,19 / 0 | **au-dessus** |
| de | **10** / 5 | 11 / 12 | 0 / 10 | 0,50 / 0 | au-dessus (plus corrigé, autant empiré) |
| es | **13** / 3 | 12 / **7** | 3 / 24 | 0,17 / 0 | plus corrigé, **plus empiré** |
| it | **8** / 3 | 13 / **7** | 4 / 18 | 0,06 / 0 | plus corrigé, **plus empiré** |
| ru | **15** / 12 | 14 / **2** | 10 / 24 | 0 / 0 | **en dessous sur ce qui est empiré** |
| zh | 1 / 0 | 24 / **1** | 1 / 39 | −0,5 / 0 | **en dessous** : LT ne corrige rien, nous empirons |
| ja | **7** / 0 | 25 / **0** | 3 / 40 | −1 / 0 | **en dessous sur ce qui est empiré** |
| hi | 1 / — | 33 / — | 4 / — | −1 / — | pas de LT ; mauvais |
| tr | 12 / — | 25 / — | 0 / — | −1 / — | pas de LT ; mauvais |
| fr, ko | non mesurés (corpus) | | | | |

**Lecture honnête.** Notre outil **trouve et corrige plus d'erreurs que LanguageTool dans toutes les langues** (exactes : 88 contre 33 sur les 8 langues communes mesurables) — LanguageTool ne corrige pratiquement rien en chinois et en japonais. **Mais il réécrit ce qui était juste** : c'est la sur-correction connue des LLM. Exemples réels : japonais, l'erreur « とした雇った » est bien corrigée en « として雇った », mais « コンピューター » devient « コンピュータ », « において » devient « で », les parenthèses changent de largeur ; chinois, « 它的味 » devient « 味道 » et la phrase est reformulée. Pour un visiteur, c'est un texte **modifié sans raison** — le surlignage mot à mot (amélioration 13) le montre et chaque changement peut être défait, mais le résultat par défaut n'est pas celui d'un correcteur. **En dessous de LanguageTool sur ce critère : russe, chinois, japonais, espagnol, italien** ; hindi et turc sont mauvais sans point de comparaison. Les références ne sont pas parfaites (révisions Wikipédia en hindi, règles partielles en turc) : l'écart « empiré » y est donc surestimé, mais les exemples japonais et chinois montrent qu'il est réel.

### 3.4 Comment les meilleurs s'y prennent, et proposition chiffrée — **rien n'a été changé**
- **LanguageTool** : des règles écrites par langue, des suggestions **ponctuelles** que l'utilisateur accepte une à une — il ne réécrit jamais une phrase, d'où son peu d'« empirées » (et son peu de corrections hors langues européennes).
- **Recherche récente sur les LLM** : la sur-correction est le défaut connu de ChatGPT en correction grammaticale (*Is ChatGPT a Highly Fluent GEC System?*, 2023) ; la parade la mieux mesurée sans entraînement est une **consigne « modifications minimales » déclarative** (*Larger Context Window, Fewer Overcorrections*, 2026 ; *Adapting LLMs for Minimal-edit GEC*, 2025) — corriger seulement ce qui est fautif, garder mots, style, variantes orthographiques et typographie, renvoyer la phrase intacte si elle est juste.

| Option | Contenu | Coût de réalisation | Coût d'usage |
|---|---|---|---|
| **A (recommandée)** | Réécrire la consigne de `grammar-fixer` en « modifications minimales, même langue, même typographie » ; **remesurer sur les mêmes corpus** (≈ 30 appels, ≈ 0,015 $) **et** sur le corpus anglais du 26/09 (pour ne pas perdre les 25/25) ; suites Chromium + Firefox ; préversion ; production | ≈ 2 h | inchangé (+ ≈ 40 jetons par appel, ≈ 0,000006 $) |
| B | A + un choix « Corrections minimales / Améliorer le style » (les deux régimes de la recherche) | ≈ 3 h | inchangé |
| C | Modèle plus grand pour les langues non latines | non chiffré tant que A n'est pas mesurée | ×10 à ×15 par appel |
| Textes | Mettre la FAQ en accord avec la mesure (aujourd'hui : « primarily English ») — après A, pas avant (interdit n° 20) | 15 min | — |
| Corpus manquants | **français** et **coréen** : il faut un corpus soumis à inscription (MultiGEC-2025 : conditions d'utilisation à accepter ; Kor-Lang8 : formulaire) — **inscription que toi seul peux faire** | 10 min de ta part | — |


## 4. Saturation — service ffmpeg et Gotenberg : méthode, mesures locales, proposition

### 4.1 Comment mesurer sans secret et sans la limite de 20/heure

La limite de 20 conversions/heure/connexion **n'est pas dans le service ffmpeg** : elle est dans la route Vercel qui délivre les billets (`/api/media/ticket`). Le service, lui, n'accepte qu'un billet signé avec `MEDIA_TICKET_SECRET` — qu'on ne lit pas. Trois voies :

| Voie | Principe | Secret ? | Limite 20/h ? | Touche la prod ? |
|---|---|---|---|---|
| **L — local (fait aujourd'hui)** | le **vrai code** du service (`services/media-processing`) lancé ici avec une **clé jetable générée en mémoire** (comme `tests/run_tests.py`), vrai ffmpeg n8.1.2 | non | non | non |
| **R1 — copie jetable sur Railway (recommandée pour le service ffmpeg)** | un environnement Railway séparé (« charge ») contenant **une copie** de `media-processing` aux **mêmes limites de ressources** ; sa clé de billets est une clé **jetable** propre à cette copie, que **tu génères toi-même** (commande de l'annexe B, directement dans le presse-papiers) et colles dans Railway, puis tu lances toi-même le script de charge qui la lit dans le presse-papiers sans l'afficher ; environnement **supprimé** à la fin (avec ton accord explicite, la règle de la séance interdisant toute suppression de service) | aucun secret de production ; la clé jetable ne protège que la copie | non | non |
| **R2 — production directe** | relever temporairement `MEDIA_JOBS_PER_HOUR_PER_IP` dans Vercel | — | contournée | **oui** : changement de variable + redéploiement de production, trafic réel exposé pendant le test | ❌ déconseillé |

**Gotenberg n'a pas ce problème** : les routes Office (`excel-to-pdf`, `ppt-to-pdf`, `html-to-pdf`…) n'ont **ni quota ni limite par IP** (plan, §2 bis), et `.xlsx`/`.pptx` ne passent **pas** par ConvertAPI (aucun coût à la conversion). Un test de charge **de bout en bout sur www** est donc possible sans aucun secret (voir 4.4).

### 4.2 Mesuré en local — service ffmpeg (`docs/audit/saturation/local_capacity.py`)

Poste : 8 processeurs logiques. 6 travaux identiques envoyés d'un coup, pour 1, 2 et 4 emplacements parallèles (`MEDIA_MAX_CONCURRENT_JOBS`, **2 en production**).

| Travail | Emplacements | Dernier fini | Premier fini | Débit | CPU ffmpeg / travail | Mémoire ffmpeg (pic) |
|---|---|---|---|---|---|---|
| Compression vidéo 30 s 1080p (« balanced ») | **1** | 76,4 s | **9,5 s** | **4,71/min** | 77 s | 552 Mo |
| | **2** (prod) | 83,2 s | 27,6 s | 4,33/min | 89 s | 553 Mo |
| | **4** | 82,5 s | 51,8 s | 4,36/min | 91 s | 552 Mo |
| Audio 8 s → Opus 128k | 1 / 2 / 4 | 1,3 / 0,8 / 0,8 s | 0,4-0,5 s | 270-475/min | ≈ 0,03 s | 20 Mo |

**Ce que ça établit :**
1. **ffmpeg occupe déjà tous les cœurs à lui seul** : ajouter des emplacements parallèles **n'augmente pas le débit** (4,7 → 4,3-4,4 travaux/min) ; ça ne fait qu'**allonger chaque travail** (le premier fini passe de 9,5 s à 27,6 s avec 2 emplacements, 51,8 s avec 4). Le débit est **fixé par le nombre de vCPU**, pas par le réglage.
2. **Coût d'un travail vidéo courant ≈ 77-90 s de CPU** ; donc sur **8 vCPU** (dimension notée pour les services Railway du projet — à confirmer par lecture du réglage, sans secret) : **≈ 5 à 6 compressions de 30 s 1080p par minute**, et un travail lourd (WebM 3 min ≈ 20 vCPU-min, mesuré le 20/09) **≈ 2,5 min**.
3. **L'audio ne pèse rien** : des centaines de conversions Opus par minute ; il ne peut saturer que par la file (10 places) si des travaux vidéo l'occupent.
4. **Mémoire : ≈ 550 Mo par ffmpeg vidéo** : 2 emplacements ≈ 1,1 Go ; pas le goulot.
5. **Pas de réplicas** : le registre des travaux est en mémoire (plan, bloquant 6) ; deux réplicas perdraient des travaux. Monter en charge = **plus de vCPU** sur une seule instance.

**Limite de la mesure :** le processeur de ce poste n'est pas celui de Railway ; ces chiffres donnent des **rapports** (effet des emplacements, CPU par travail), pas la capacité exacte de Railway — c'est ce que R1 mesurerait.

### 4.3 Mesuré en local — Gotenberg (`docs/audit/saturation/soffice_timing.mjs`)

Fait établi dans la documentation officielle (gotenberg.dev/docs/configuration, lue aujourd'hui) : **« a LibreOffice instance cannot execute parallel operations »** — chaque instance Gotenberg convertit **un document Office à la fois** (Chromium : 6 en parallèle), file d'attente **illimitée** par défaut ; une requête qui attend plus que `API_TIMEOUT` (**240 s** en production) échoue. **La capacité Office = réplicas ÷ durée d'une conversion.**

LibreOffice local, les 6 fichiers du corpus de fidélité (7-50 Ko), à chaud, 3 fois chacun : **1,5 à 2,4 s par conversion**, démarrage de LibreOffice compris (borne haute : Gotenberg le garde lancé). Soit **≈ 25-40 petits documents/min par instance**, ≈ 75-120/min avec 3 réplicas. Mais un gros fichier **bloque une instance** : mesuré le 22/09, Excel 70 Mio ≈ 250 s, PowerPoint 149 Mio ≈ 80 s. **Scénario qui casse :** une instance occupée 4 min par un gros Excel fait attendre tous les documents répartis sur elle — ceux qui dépassent 240 s d'attente échouent.

### 4.4 Proposition — méthode et coût, **rien lancé contre la production**

**Service ffmpeg — voie R1 (copie jetable), ≈ 1 h 30 dont 20 min de ta part :**
1. *Toi (10 min)* : accord ; je crée par la CLI/API Railway un environnement « charge » avec une copie de `media-processing` (mêmes ressources, domaine distinct, `ALLOWED_ORIGINS` sans le site) ; tu génères la clé jetable (annexe B, presse-papiers) et la colles dans cette copie.
2. *Toi (1 commande)* : tu lances `local_capacity`-bis contre la copie (le script lit la clé dans le presse-papiers, ne l'affiche jamais) : paliers de **1, 2, 4, 8, 12 visiteurs simultanés**, mélange réaliste (70 % audio/GIF légers, 25 % vidéo 30 s, 5 % vidéo 3 min), 5 min par palier. Mesures : temps d'attente perçu, rang dans la file, refus « All conversion slots are busy », réveil après veille.
3. *Moi* : lecture des résultats, puis proposition chiffrée (vCPU, emplacements, taille de file).
4. *Toi* : accord pour supprimer l'environnement « charge ».
- **Coût estimé : < 0,50 $** (8 vCPU × 1 h ≈ 0,22 $ au tarif relevé le 20/09 de 20 $/vCPU-mois, + mémoire ≈ 0,10 $, + sortie réseau des fichiers d'essai ≈ 0,05 $). **Aucun billet de production consommé, aucun secret de production lu.**

**Gotenberg — test de bout en bout sur www, ≈ 30 min :**
- `.xlsx` et `.pptx` du corpus (pas de `.docx`, qui part chez ConvertAPI à 0,01 $), paliers de **1, 5, 10, 20, 40 requêtes simultanées**, 3 min par palier, puis **un gros Excel (≈ 20 Mo) mêlé à 10 petits** pour mesurer l'effet de blocage.
- **Coût : ≈ 0,05-0,20 $ de Railway** (CPU de Gotenberg) ; Vercel Hobby : quelques centaines d'invocations, négligeable. **Risque :** ralentir un vrai visiteur pendant 30 min (trafic actuel ≈ nul) ; à faire **à une heure que tu fixes**, après avoir mis Gotenberg à 3 réplicas (déclencheur « plusieurs jours avant ») pour mesurer la configuration de lancement.

**Premières conclusions (à confirmer par R1) :** garder **2 emplacements** (un seul ferait attendre les travaux légers derrière un lourd ; plus de 2 n'apporte rien) ; si la vague Product Hunt doit être absorbée, le levier est **vertical** (plus de vCPU, ce qui peut exiger le plan Railway Pro — à vérifier sur ton compte), pas le nombre d'emplacements ni de réplicas ; côté Gotenberg, **3 réplicas** comme prévu, et envisager de **plafonner la taille des Excel** ou de les isoler si la mesure confirme le blocage.

## 5. Ce qui attend ta décision

1. **Grammaire** : option A (consigne « modifications minimales » + remesure, ≈ 2 h) ou B (A + choix minimal/style, ≈ 3 h) ; et, si tu veux le français et le coréen, t'inscrire à un corpus (MultiGEC-2025, Kor-Lang8).
2. **Saturation** : accord (ou non) pour la copie jetable du service ffmpeg sur Railway (< 0,50 $, clé jetable générée **par toi**, environnement supprimé ensuite avec ton accord) et pour le test Gotenberg de bout en bout sur www (≈ 0,05-0,20 $, à l'heure que tu fixes, idéalement après le passage à 3 réplicas).
3. **Safari** : la passe de demain avec la nouvelle feuille (≈ 3 h 25 ; la moitié risquée seule ≈ 2 h).

## 6. Hygiène

- Commits poussés sur `licence-ameliorations` : `3cc9c6d3` (plan), `270a2453` (Safari), puis ce rapport avec les scripts de mesure. `master` inchangé (`4d8ed7ff`). **Aucun déploiement de production.** Une build de **préversion** automatique (`go60c4jwn`) a été déclenchée par le script du commit Safari — laissée, avec ton accord ; les scripts suivants sont sous `docs/audit/` pour ne plus en déclencher.
- Aucun fichier d'environnement lu, modifié ni copié ; aucune commande `vercel link`, `env pull` ou `env run` ; seulement `vercel env ls --project` (noms) et `vercel ls` (liste des déploiements), depuis un dossier vide.
- Mesure locale du service ffmpeg : clé de billets **jetable, générée en mémoire pour la durée du test**, jamais écrite (même méthode que `tests/run_tests.py`) — aucun secret du projet.
- Appels payants : **30 appels** à `/api/ai` (≈ 0,014 $), annoncés et acceptés avant lancement ; plafond de 2 $ respecté. LanguageTool : API publique gratuite. Recherche des corpus confiée à un agent en arrière-plan (recherche seulement, aucun fichier du site touché).
- Corpus de grammaire **non versionnés** (licences mixtes, dont une non commerciale) : seul `build.py` l'est ; ils se reconstruisent à partir des URL publiques.
- Aucune surveillance ni boucle d'attente ; tâches de fond notifiées à leur fin ; serveurs de test arrêtés. Aucune suppression ni aucun renommage d'outil ou de service. Aucun push forcé. `.serena/` laissé tel quel.
