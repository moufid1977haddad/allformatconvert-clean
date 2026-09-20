# PLAN DE TRAVAIL — OnlineConverTools

> **📍 EMPLACEMENT DE CE DOCUMENT — lire en premier.**
> Jusqu'au 19 septembre 2026, ce document vivait **uniquement dans le Projet claude.ai**, invisible depuis le dépôt. Claude Code a donc travaillé des semaines sans la RÈGLE ZÉRO, sans les interdits permanents et sans la liste des pièges — et a redécouvert à ses frais des choses déjà écrites ici. **Il vit désormais dans le dépôt, à `claude/plan-de-travail.md`, et c'est la seule copie qui fait foi.** À lire au début de chaque chantier.

> ## 🚦 RÈGLE ZÉRO — MESURER AVANT DE CONSTRUIRE
>
> **Avant d'ouvrir un chantier, répondre à trois questions. Aucune exception.**
>
> 1. **Quelle donnée dit que ce chantier compte ?** Si la réponse est « c'est évident », ce n'est pas une réponse.
> 2. **De quand date cette donnée ?** Un tableau de bord affiche toujours sa date de mise à jour. **La lire AVANT de lire le chiffre.**
> 3. **Existe-t-il une vérification en direct, moins chère, qui la confirme ou l'infirme ?**
>
> **Ce qui a coûté deux jours :** le rapport « Indexation des pages » annonçait 35 pages indexées sur 248. Il était **figé depuis neuf jours**. Cinq minutes dans « Inspection de l'URL » auraient montré le contraire immédiatement.
>
> **Ce qui a coûté 2 h 15 le 18 septembre :** un chantier « déployer Gotenberg versionné » lancé sans vérifier l'état réel. Le service `gotenberg-fonts` avait **déjà** le Root Directory et les Watch Paths depuis le 1er septembre, et s'était **déjà** redéployé tout seul sur le commit à digest épinglé. Le travail était fait avant de commencer.
>
> **Corollaire 1 :** *chaque gros chantier incertain contient une mesure courte qui tue l'incertitude. Faire la mesure d'abord, toujours.*
> **Corollaire 2 :** *un bloquant qu'on ne revérifie pas reste ouvert même après avoir été réglé.*
> **Corollaire 3 :** *vérifier que le fournisseur existera encore.*
> **Corollaire 4 :** *un service qui répond n'exécute pas forcément ton code.* Un déploiement Railway qui plante ne fait pas tomber le service : l'ancienne version reste en ligne. Seul un comportement propre à la nouvelle version le prouve.
> **Corollaire 5 :** *l'état réel d'une infrastructure se lit avant de la modifier, pas après.*


> ## ⭐ RÈGLE QUI PRIME SUR TOUT LE RESTE — posée par le propriétaire le 20 septembre 2026
>
> **Chaque outil doit FONCTIONNER comme annoncé, sur tous les navigateurs, et donner un résultat ÉGAL OU SUPÉRIEUR aux sites de référence du marché — jamais inférieur.** Un message d'erreur honnête n'est pas une solution. Le coût n'est pas un obstacle, la durée non plus. L'ordre est toujours : **recherche, analyse, décision, puis construction.** Si la mesure contredit une hypothèse, on **change de solution**, on ne l'aménage pas.

---

# 🗓️ PLAN DE LA SEMAINE 1 — accepté le 12 septembre

| Jour | Quoi | État |
|---|---|---|
| **1** | Navbar (10) · plafond `pdf-translate` (4) · chiffrage des stubs (7) | ✅ **FAIT** |
| **2** | **MESURER** la fidélité Office → PDF *(bloquant 2)* | ✅ **MESURÉ** — promesses corrigées en ligne · défauts ouverts D1→D10 |
| **3** | Détourage *(bloquant 3)* | ✅ **CLOS** |
| **4** | **TESTER** Safari sur les 20 outils les plus mis en avant *(bloquant 9)* | 🟡 **feuille prête** (`tests-safari-proprietaire.md`) — **en attente du propriétaire**, ~2 h |

---

> ## 📌 COMMENT UTILISER CE DOCUMENT
>
> **C'est le SEUL document de pilotage du projet.** Toute tâche, tout point reporté, toute décision est ici.
>
> **Au début de chaque session, ce document est relu et la section « Déclencheurs » est vérifiée.** Si une condition est remplie, **le propriétaire en est averti immédiatement, sans qu'il ait à le demander.**
>
> **Ne jamais affirmer que « tout est noté » sans avoir relu ce document en entier.**
>
> ### Les autres documents — rôle distinct, aucune tâche autonome
> - `REFERENCE-projet.md` — encyclopédie technique
> - `decision-internationalisation.md` — dossier de décision sur le multilingue
> - **`tests-manuels-proprietaire.md`** — feuille de test du **bloquant 11**. Ses verdicts se reportent ici ; ce qui échoue remonte dans les bloquants, jamais dans « CLOS ».
> - **`tests-safari-proprietaire.md`** — feuille de test du **bloquant 9** (Safari iPhone + MacBook, 20 outils). Même règle : verdicts reportés ici, ce qui échoue remonte dans le bloquant 9.
> - `docs/audit/RAPPORT-*.md` — traces de chantier, jamais des tâches
> - `session-etat-*.md` — archives datées
>
> ⚠️ **Aucun autre document de tâches ne doit exister.**

---

## LE STANDARD

> *« Je veux que mon site soit une référence pour tous les outils qu'il affiche. Je ne veux qu'aucun concurrent n'offre une qualité plus que moi. Tous mes outils doivent traiter les demandes des clients parfaitement et offrir le maximum de variété. »*

**Deux critères par outil, jamais un seul :** la **qualité** comparée au site de référence sur le même fichier, et la **couverture** des formats comparée au marché.

**Aucun outil supprimé ni renommé sans accord explicite préalable.**

## 🎯 OBJECTIF : 10 000 $US/mois — **le plus rapidement possible**

> ### ⏱️ Horizon révisé le 17 septembre 2026
>
> **L'échéance « 2 à 4 ans » est retirée.** La consigne du propriétaire est désormais : *le plus vite possible.*
>
> **Ce que ça change — l'ORDRE :** entre deux options, choisir systématiquement celle qui atteint un visiteur, puis un visiteur payant, le plus tôt. Un chantier qui n'avance ni le lancement, ni le trafic, ni le revenu attend.
>
> **Ce que ça NE change PAS — le NIVEAU.** « Vite » n'autorise pas un outil livré à 80 %. Le standard ci-dessus reste entier, et une promesse fausse en ligne reste un bloquant, quel que soit le calendrier. Les deux exigences ne sont pas en conflit : ce qui a coûté du temps sur ce projet, ce n'est jamais la qualité — c'est d'avoir travaillé sur le mauvais chantier faute de mesure.
>
> **Ce que ça ne peut pas accélérer :** le référencement naturel. Position moyenne 74,7, zéro domaine référent contre 7 600 chez le concurrent de référence. Cet écart se comble en mois ou en années quel que soit l'effort fourni. **Aucune urgence ne le raccourcit.**
>
> **Où porter l'effort, en conséquence :**
> 1. **Lancer.** C'est la seule chose réellement rapide, et rien ne commence avant.
> 2. **Obtenir des domaines référents.** C'est le verrou du classement. Product Hunt est la seule source prévue — il en faut d'autres.
> 3. **Les voies de revenu qui ne dépendent pas de Google.** À trancher après le lancement, sur données d'usage réel.

**Chemin :** site fiable → lancement Product Hunt → indexation → AdSense **une fois 20-50 visiteurs/jour** → Premium grand public → offre API/B2B.

> **Correction honnête :** l'offre API/B2B avait été présentée comme « le levier le plus court ». Ce n'était pas vérifié. Affronter CloudConvert, ConvertAPI, Adobe et Zamzar, seul, sur un plan Vercel Hobby dont les conditions interdisent l'usage commercial — 40 clients à 250-500 $/mois, c'est 12 à 24 mois de prospection. **Ce n'est pas plus rapide, c'est un autre marathon.**
>
> **La contrainte réelle n'est pas le produit, c'est la distribution.**

---

# 🔴 BLOQUANTS AVANT LE LANCEMENT

## 1 — Le vrai problème n'est pas l'indexation, c'est le **classement**

### ⚠️ Le chiffre de « 35 pages indexées » est FAUX

Rapport **Indexation des pages** **figé au 03/09/2026**, vérifié deux fois. **La source fiable est « Inspection de l'URL », en direct.**

### L'expérience du 12 septembre

Sur **21 URL testées en direct** : **7 déjà indexées**, **3 indexées en moins de 2 minutes** après demande manuelle, 4 en attente, 2 bloquées par le quota. Le 13 septembre : **10 catégories sur 12 confirmées indexées.**

> **Les pages du site ne posent AUCUN problème à Google.**

### Le vrai problème

**5 clics en 6 mois. 841 impressions. Position moyenne 74,7 — page 8.**

Les dix premières requêtes sont des recherches **de marque visant le concurrent**. **Une seule porte une intention réelle : `percentage calculator online`** — issue de `math-tools` (6 outils), alors que `developer-tools` en compte 54 et n'a jamais été travaillée.

### Décision du 13 septembre : arrêter les demandes manuelles quotidiennes

Les carrefours sont indexés ; Google trouvera le reste seul. Et indexer une page classée en position 74 ne rapporte rien. **Garder les demandes pour les 10 à 15 pages qu'on va réellement travailler, et les demander APRÈS les avoir améliorées.**

### Le diagnostic technique — `RAPPORT-indexation.md` (`21374d83`)

Serveur à **224 ms** · sitemap **240/240 en 200** · contenu SEO **dans le HTML brut sans JS** · **0 page orpheline**, 2 clics max · 0 lien absolu non-www · **247 pages**.
**Exploration (90 j) :** ~12 requêtes/jour. Actualisation 94 % · découverte 6 %. JS 61 % · HTML 10 %.

## 2 — ✅ **Fidélité Office → PDF — MESURÉE, promesses corrigées en ligne**

### Ce qui est clos, avec preuve — 19 septembre 2026

Les promesses fausses **ne sont plus en ligne**. *« professional-quality »* a disparu des cinq outils (`word-to-pdf`, `excel-to-pdf`, `ppt-to-pdf`, `pdf-to-word`, `html-to-pdf`), remplacé par des formulations adossées à des mesures écrites — **5 à 7 occurrences de « In our tests… » par page**, balises `<meta description>` comprises, divulgation de la substitution de police incluse sur `ppt-to-pdf`. Vérifié en production sur le HTML servi.

**Corpus de mesure reproductible** : `docs/audit/fixtures-fidelite/` — six fichiers déterministes générés par script et versionnés, couvrant tableaux fusionnés, colonnes, notes de bas de page, table des matières, mise en forme conditionnelle, formules, graphiques, dégradés et substitution de police. Rejouable à chaque changement de moteur.

**Deux erreurs de SEO corrigées au passage :** `word-to-pdf` annonçait « LibreOffice » alors que le `.docx` passe par ConvertAPI ; `pdf-to-word` décrivait encore une extraction de texte brut dans le navigateur, en contradiction avec sa propre page.

**Rapports :** `RAPPORT-fidelite-office.md`, `RAPPORT-fidelite-corrections.md`, montages et scripts dans `docs/audit/fidelite-marche/`.

### ⚠️ Limite de la comparaison marché — à ne pas surévaluer

**Deux sorties exploitables sur trois**, et les deux ne sont probablement **pas indépendantes** : FreeConvert et Online2PDF rendent des `.pptx` quasi identiques entre eux, signe d'un même moteur sous-jacent. CloudConvert bloqué par son quota gratuit (10 crédits/jour), iLovePDF fige l'onglet au téléchargement. **Il manque une référence réellement indépendante** — Adobe ou Microsoft, qui n'utilisent pas LibreOffice.

### Ce qui reste ouvert — les défauts chiffrés

| # | Défaut | État | Coût |
|---|---|---|---|
| **D1** | Gras Excel en police à empattements | ✅ **CORRIGÉ et vérifié en production.** Cause réelle : les polices `.xlsx` **sans nom** (ce qu'écrit `openpyxl` pour `Font(bold=True)`) ; Excel les lit comme la police par défaut du classeur, LibreOffice tombe sur une police à empattements. `lib/xlsxDefaultFont.js` les nomme avant conversion. Fixtures 03 et 04 sortent en **Carlito-Bold**, comme chez les deux concurrents. **`.xls`, `.ods` et `.csv` non mesurés.** | fait |
| **D2** | Substitution de Segoe UI | ✅ **Selawik intégrée** — dépôt officiel Microsoft, **SIL OFL 1.1**, redistribution commerciale permise, TTF non modifiés, SHA-256 vérifiées au build. **Compatibilité métrique mesurée, pas supposée : 93/93 glyphes de largeur identique, normal et gras.** Le README Microsoft ne l'annonce pas et signale un crénage non aligné. | fait |
| **D6** | `pdf-to-word` basculait **silencieusement** vers du texte brut quand `PDF_TO_WORD_CONVERTAPI_ENABLED` est coupé | ✅ **CORRIGÉ** — répond désormais **503 avec message clair**. Testé en local. Interdit permanent n° 3 respecté. | fait |
| **D9** | LibreOffice **replie** les zones de texte `wrap="none"` plus étroites que leur texte ; PowerPoint les laisse déborder. Le titre de la fixture 06 perd sa seconde ligne. **C'est la vraie cause de l'objectif D2 « titre 06 sur une ligne » non atteint** malgré Selawik. | ⬜ **ouvert** — défaut de fidélité réel, indépendant de la police (reproduit avec la vraie Segoe UI). La fixture n'a **pas** été retouchée pour faire passer le test. | non chiffré |
| **D3** | Table des matières Word non recalculée | ✅ **Non corrigeable** — identique chez les concurrents ; **divulgué** en ligne | — |
| **D4** | Feuilles Excel larges découpées sur plusieurs pages | ✅ Comportement par défaut ; **divulgué** en ligne | — |
| **D5** | Graphique Excel rendu différemment des concurrents | ⬜ **ouvert**, gravité inconnue | non chiffré |
| **D7** | Le repli LibreOffice pour `.docx` (actif si `CONVERTAPI_ENABLED` est coupé), et les formats `.doc`, `.xls`, `.ppt`, `.csv`, `.ods`, **n'ont jamais été mesurés** | ⬜ **ouvert** — règle de couverture. **À mesurer avant toute coupure de ConvertAPI**, mêmes fixtures via un Gotenberg de test. | à chiffrer |

## 2 bis — 🔴 **D8 / D10 — le plafond de 4,4 Mo : l'écart concurrentiel réel**

> **C'est le plus gros écart mesuré du projet, et il pèse plus que la fidélité.**

**Mesuré le 19 septembre, fichier à l'appui :** un fichier de **4 412 819 octets passe**, un de **4 517 676 octets est refusé** par Vercel (`FUNCTION_PAYLOAD_TOO_LARGE`). Vaut pour `.xlsx`, `.pptx`, `.docx` et `pdf-to-word`. **Ces routes envoient du multipart brut — pas d'inflation base64**, contrairement au détourage.

- **Le « 25 Mo » n'existe que dans un message d'erreur serveur inatteignable.** Aucune page ne l'affiche.
- ✅ **D10 CORRIGÉ et vérifié en production le 19 septembre** (`RAPPORT-plafonds-declares.md`) : plafond de **4 Mio** annoncé avant la sélection, contrôlé dans le navigateur, message honnête, sur les 4 routes + html/epub/mobi-to-pdf, pdf-repair, pdf-to-pdfa (qui annonçaient 50 Mo), audio-to-text et audio-transcriber (10 Mo), image-captioner (3 Mio, base64). Le plafond lui-même n'est pas relevé (D8 reste ouvert).
- **D10 — ce que voyait le visiteur (avant correction) :** un fichier de 5 à 25 Mo affiche *« Conversion failed. Please try again. »* Il réessaie, ça échoue encore, il part. **C'est un mensonge par omission et un bloquant de lancement.**
- **Écart marché :** **~34×** moins qu'Online2PDF (150 Mo), **~230×** moins que FreeConvert (1 Go). *(Tailles affichées par leurs pages, non éprouvées.)*
- **Mécanisme retenu le 20 septembre (résout D8 ET le bloquant 6) :** billet signé émis par Vercel + **envoi direct par morceaux vers le service Railway** — c'est ce que FreeConvert fait (mesuré : job créé par API, puis envoi reprenable vers un nœud dédié). **Construit pour la vidéo ; branchement des routes Office NON fait** : le navigateur dépose le fichier (opération « stage »), la route lit le fichier de serveur à serveur, convertit, redépose le PDF ; **8-12 h**, non livré faute de pouvoir le prouver contre Gotenberg et un service déployé. ⚠️ Une note de plateforme prétend que Vercel accepte 100 Mo ; **la mesure du 19/09 prévaut** (refus à 4 517 676 octets) — à re-tester en direct avant de refactorer.

**Chiffrage (estimations non vérifiées) :** contrôle côté navigateur + message honnête = **quelques heures**. Envoi via **Vercel Blob** = 1 à 2 jours, risque non mesuré sur la taille du PDF renvoyé. Sortir ces routes de Vercel = 2 à 4 jours.

**Décision prise :** ① le message honnête et le contrôle avant l'envoi partent **tout de suite** — interdit permanent n° 12, *les plafonds ne se lèvent pas, ils se déclarent* ; ② relever réellement le plafond est un chantier à part, **après le lancement**, sauf si la mesure montre qu'il bloque un usage courant.

### Valeurs de production réellement lues — 19 septembre

| Variable | Valeur |
|---|---|
| `USER_QUOTA_PDF_CONVERSIONS` | **5 par mois** — ne concerne que `.docx` et `pdf-to-word` |
| `IP_RATE_LIMIT_PER_HOUR` | **30** |
| `IP_RATE_LIMIT_PER_DAY` | **100** |
| `GLOBAL_SPEND_CAP_USD` | **20** |

> **Correction d'un rapport antérieur :** les valeurs « 10/h et 30/jour » étaient fausses. **`.xlsx`, `.pptx` et les autres formats passant par Gotenberg n'ont ni quota utilisateur ni limite par IP.**

## 3 — ✅ CLOS — Détourage : fournisseur remplacé par un service auto-hébergé

**remove.bg fermait le 1er décembre 2026** et le compte était à zéro crédit. L'API migrait vers Leonardo.Ai : nouvelle clé, crédits variables, débit ÷5, aucun palier gratuit.

**Solution livrée :** service d'inférence **auto-hébergé sur Railway**, modèle **IS-Net general-use** (ONNX, Apache-2.0), filtre « plus grande région connexe », veille Serverless active.

| Preuve | Mesure |
|---|---|
| Qualité vs marché | Dans la **dispersion normale** remove.bg ↔ Pixian sur 4 photos/6 ; le seul décrochage (objet transparent, IoU 0,74) réparé par le filtre → **IoU 0,97** |
| Licences | 2 modèles sur 5 éliminés **sur la licence seule** — AGPL-3.0 et non commerciale |
| Vitesse | 6,7-9,9 s → **1,1-3,7 s** *(le filtre tournait sur le masque pleine résolution au lieu du masque natif 1024×1024)* |
| Réveil après veille | **~4-5 s** |
| Coût | **0,00 $/mois à trafic nul** · ~5-6 $/mois à 500 images · contre **52,35 $ chez Leonardo.Ai** |
| Sécurité | Clé d'API + quota + CORS sur le motif de `services/pdf-tools`, `hmac.compare_digest`. **401 sans clé, prouvé en production.** |
| Coût de quota | `REMOVEBG_PER_IMAGE_DOLLARS` : **0,20 $ → 0,0031 $**. À 0,20 $, cent détourages épuisaient le plafond global de 20 $ et bloquaient les 15 outils IA, ConvertAPI et Adobe. |
| Fichiers 3,3-12 Mo | **Corrigé.** Le navigateur réduit avant l'envoi, le service renvoie le **masque seul**, le navigateur recompose **en pleine résolution** — vérifié jusqu'à **74 mégapixels**. |
| Plafond | **50 Mo**, le plus généreux du marché, **annoncé avant la sélection du fichier** |

**Cinq correctifs issus de la revue indépendante**, dont deux graves : le **cron de santé surveillait l'API remove.bg retirée**, et la **politique de confidentialité et les conditions d'utilisation citaient encore Remove.bg comme sous-traitant** — des documents juridiques qui disaient faux.

## 4 — ✅ CLOS — Plafond de `pdf-translate` déclaré

Motif d'`audio-to-text` reproduit à l'identique, **avant** l'upload (`c6ae956a`).

## 5 — Les outils jamais ouverts — **borné à l'usage**

> **Bornage accepté le 12 septembre : auditer les 30 à 40 outils que le site met lui-même en avant** — **pas les 185.** Commencer par les outils **déjà indexés**, les seuls qu'un visiteur peut atteindre.

## 6 — 🟡 Architecture vidéo — **DÉCIDÉE et CONSTRUITE le 20 septembre, NON DÉPLOYÉE** (`docs/audit/RAPPORT-video-architecture.md`)

**Décision : service ffmpeg auto-hébergé sur Railway** (modèle exact de `background-removal`), branché sur `video-compressor` et `video-converter` ; `video-trimmer` **reste dans le navigateur** (coupe sans ré-encodage mesurée 0,2-0,9 s). Comparé à une API tierce (AWS MediaConvert 0,0075-0,015 $/min, Coconut, Google Transcoder : plus cher, profils fixes sans AVI/WMV/FLV/GIF/audio, stockage en plus) et à ffmpeg.wasm (1× le temps réel, mémoire mobile).

**Coût mensuel retenu : 0,00 $ à trafic nul, ≈ 1,2 $ à 500 conversions/mois, ≈ 12 $ à 5 000** (Railway facture à la seconde ; tarif lu le 20/09/2026 : 20 $/vCPU-mois, 10 $/Go-mois, 0,05 $/Go de sortie). À confirmer sur la première facture réelle.

**Construit et testé** : service `services/media-processing/` (59 tests réels : signature, CORS, reprise, saturation, suppression des fichiers, 19 formats de sortie), billet signé + envoi direct par morceaux vérifiés par SHA-256, pages `video-compressor` / `video-converter` (progression réelle, file d'attente visible, annulation), AVIF dans le navigateur. **Interrupteur de déploiement** : sans `NEXT_PUBLIC_MEDIA_SERVICE_URL`, les deux outils gardent leur ancienne version (`LegacyPage.jsx`).

**⚠️ CE QUI RESTE — le chantier n'est pas fini** : ① **déploiement Railway + variables Vercel par le propriétaire** (runbook § 7 du rapport ; l'agent n'a pas d'accès Railway et ne génère pas le secret) ; ② **comparaison chiffrée au marché non conclue** : aucun temps total concurrent obtenu (FreeConvert bloque à 20 crédits gratuits, Clideo/Veed sont des éditeurs derrière un compte) ; ③ **Safari réel non testé** ; ④ **branchement Office (D8) non fait**, 8-12 h. **Niveau atteint face au marché, à confirmer après déploiement : plafond 1 Go (= FreeConvert/CloudConvert), 19 formats de sortie, sans filigrane ni compte.**

## 7 — ⏸️ Les trois stubs — **recommandation : ne rien retirer**, en attente de validation

Les retirer coûte **20 lignes sur 5 fichiers, dont 2 partagées avec de vrais outils**, et crée des **pages orphelines de façon certaine**. Or « Coming Soon » + `noindex` + absents du sitemap, **c'est honnête**.

## 8 — Fréquence de la surveillance *(après le lancement)*

Vercel **Hobby** = **une tâche planifiée par jour**. **Sans trafic, ça ne sert à rien.**

## 9 — 🔴 Safari **à moitié testé** : macOS mesuré, iPhone à faire par le propriétaire *(bloquant de lancement)*

**C'est le dernier bloquant technique avant le lancement.** Firefox et Chrome confirmés. Safari = l'essentiel du trafic iPhone et Mac. Casse typiquement : Web Workers, téléchargements, WASM, `OffscreenCanvas`. **Nécessite un iPhone ou un Mac.**

**✅ Feuille opérationnelle prête (19 septembre 2026) : `tests-safari-proprietaire.md`**, comme le bloquant 11 a la sienne. 20 outils classés par risque lu dans le code, fichiers d'essai fournis (`docs/audit/fixtures-safari/`), séances iPhone puis MacBook, **~2 h**, la moitié la plus risquée en premier (séances A puis C, ~1 h). **Le propriétaire a un iPhone et un MacBook réels : aucun service de test, aucun compte à ouvrir.** **Le bloquant reste OUVERT tant que la feuille n'est pas remplie** ; **les verdicts remontent ici**, et chaque ÉCHOUÉ devient un défaut chiffré dans ce bloquant, jamais dans « CLOS » sans retest sur le vrai Safari.

**📌 DÉCISION du 19 septembre — exception assumée à l'interdit n° 8 :** les deux outils payants de la feuille Safari (**Background Remover** et **Grammar Fixer**) sont testés **en PRODUCTION, une fois chacun, coût mesuré ~0,003 $**. La règle n° 8 vise la dépense non maîtrisée ; ici la dépense est bornée et connue, et c'est **la production** qu'il faut prouver sur Safari, pas une préversion protégée par une connexion. Ne vaut que pour ces deux tests, une fois chacun.

**📌 MESURÉ le 19 septembre — vrai Safari 17.6 / macOS 14.8.9 (safaridriver) : 5 outils sur 20 échouent, causes WebKit, donc valables sur iPhone.** Chaque défaut entre dans le bloquant avec sa gravité (détail, balayage fichier:ligne et chiffrage : `docs/audit/RAPPORT-safari-defauts.md`) :

| # | Défaut | Gravité | État |
|---|---|---|---|
| S2 | `voice-recorder` : MP4 étiqueté `audio/webm`, sans erreur | **HAUTE — mensonge** | 🟡 corrigé en code (branche `safari-defauts`), **retest Safari réel requis** |
| S3 | `image-converter` (+ `jpg-to-webp`, `png-to-webp`) : PNG livré sous nom `.webp`, 86 % plus lourd, sans avertissement | **HAUTE — mensonge** | 🟡 corrigé en code, retest requis |
| S4 | `image-upscaler` ×8 : canvas 32000×24000, fichier vide, interface « réussie » (URL réelle `/tools/ai-tools/image-upscaler`) | **HAUTE — mensonge** | 🟡 corrigé en code, retest requis |
| S1 | `video-compressor` / `video-converter` / `video-trimmer` : `captureStream()` absent de `<video>`, MediaRecorder sans WebM | Moyenne — panne franche | 🟡 `video-trimmer` **refait sur ffmpeg.wasm** (retest Safari requis) ; compressor et converter : **service ffmpeg construit et testé le 20/09, en attente de déploiement (bloquant 6)** ; en attendant, message AVANT usage |
| S5 | `mp4-to-gif` refuse les `.mov` (donc toute vidéo iPhone) | Moyenne — refus franc | 🟡 `accept` élargi, retest requis |

Le balayage a trouvé **9 `MediaRecorder` sans `isTypeSupported`** (pas 5) : `video-merger/filter/rotator/resizer` et `screen-recorder` s'ajoutent, non testés sous Safari. La classe « succès annoncé sans vérifier la sortie » est traitée site-wide via `app/lib/mediaSupport.js` (tests : `scripts/media-support-tests/`). **Le bloquant 9 reste OUVERT** : ces correctifs ne sont prouvés que contre des faux, pas sur un Safari réel.

**📌 20 septembre — suite (détail : `docs/audit/RAPPORT-formats-navigateurs.md`).** Production vérifiée (déploiement `9e46af54` READY, `.mov` accepté). **AVIF : le plus gros mensonge du site, mesuré et clos** — Chrome 153, Chromium 151 et Firefox 153 rendent **du PNG** quand on leur demande de l'AVIF (3 API sur 3) : l'option de `image-converter` trompait TOUS les visiteurs depuis toujours, pas seulement Safari. Option désactivée partout + textes réécrits (« PNG, JPG ou WebP », AVIF accepté en entrée seulement). WebP : OK sous Chrome et Firefox, PNG sous Safari. **Suite du 20/09 : le marché offre l'AVIF (Squoosh, TinyPNG, CloudConvert, Convertio, iLoveIMG) → l'option est REVENUE, avec un vrai encodeur WebAssembly (`@jsquash/avif` 2.1.1, Apache-2.0, 1,1 Mo sur le réseau, dans le navigateur : l'image ne quitte pas l'appareil). Vérifié : fichier AVIF valide, décodé par Chrome et Firefox, 4,8 Mo PNG → 0,46 Mo.** Reste de la classe traité : 5 outils GIF (plus d'`alert()`, plus de GIF d'images vides), `video-to-gif`, `pdf-sign` (**signait avec un cadre vide et ne pouvait pas se tracer au doigt sur iPhone**), `pdf-editor`, `audio-waveform`, QR, codes-barres. **`video-trimmer` passé sur ffmpeg.wasm (stream copy)** : coupe en 0,2-0,9 s pour 30 s comme pour 2 min (ancien moteur : 1× le temps réel), moteur ~10 Mo sur le réseau (32 Mo décompressé), **la coupe s'aligne sur l'image-clé (+2 à +3 s mesurés) et la page le dit**. **Non prouvé : iPhone/Safari, plafond mobile 100 Mo (choix prudent).** **DÉCISION vidéo (révisée le 20/09 par la règle qui prime) : trimmer fait dans le navigateur ; `video-compressor` et `video-converter` passent sur le service ffmpeg (bloquant 6, construit, non déployé) — « honnête mais en panne sous Safari » n'est plus acceptable.** Le build local passe (variables IP documentées dans `REFERENCE-projet.md`).

**Suspects lus dans le code — hypothèses à confirmer par le test, pas des constats :** ① `video-compressor`, `video-converter`, `video-trimmer` appellent `captureStream()` + `MediaRecorder` en `video/webm` **sans détection de support** ; ② `voice-recorder` étiquette `audio/webm` un enregistrement que Safari produit en MP4 ; ③ `image-converter` : WebP par défaut via `OffscreenCanvas.convertToBlob` (Safari peut renvoyer du PNG) ; ④ `image-upscaler` (jusqu'à ×8) et `background-remover` (recomposition pleine résolution) dépassent probablement la limite de canvas de Safari iOS ; ⑤ `video-to-gif` attend `seeked` **sans délai de garde** (contrairement à `mp4-to-gif`).

## 10 — ✅ CLOS — Bug de débordement de la navbar

8 largeurs de 1024 à 1536 px, barre + 3 enfants directs : **0 px partout**.

## 11 — Les tests manuels du propriétaire

**Feuille opérationnelle : `tests-manuels-proprietaire.md`.** Sept tests, 1 h 15 à 1 h 45.
**Restent hors de la feuille** (commits `50527805` et `b77f988b`) : les **cinq contrôles de la vague 1**, et `excel-to-json` + `xml-to-json`.

---

# 🟢 ADMINISTRATIF — sans condition

- ✅ ~~Inscrire le service de détourage dans `REFERENCE-projet.md`~~ — fait le 19 septembre (service détourage, références croisées des deux Gotenberg, quotas lus).
- **Décider du sort de `gotenberg-fonts`** (~2 $/mois). Deux services Railway font tourner la **même image au même digest** : `gotenberg-fonts` (historique) et `gotenberg-v2` (production depuis le 18 septembre). ⚠️ **NON VÉRIFIÉ — ne pas lire comme un fait établi (19 septembre 2026).** Que les variables de `gotenberg-v2` soient des références croisées vers `gotenberg-fonts` **est une hypothèse, pas un constat** : deux sources écrites l'affirment (ce plan, et `RAPPORT-gotenberg-versionne.md` ligne 138 — qui dit avoir ajouté les 9 variables par `${{gotenberg-fonts.NOM_VAR}}` **sans jamais lire leurs valeurs**), une source l'infirme (`RAPPORT-fidelite-office.md` ligne 23 : « aucune référence croisée », lecture d'API où une référence peut apparaître comme une valeur). **Aucune n'a été vérifiée contre l'état réel de Railway** ; cette ligne avait été recopiée de document en document. **Tentative du 19 septembre : impossible** — la CLI Railway n'est **pas installée** sur ce poste (absente du PATH et des emplacements usuels ; seul le dossier de configuration `~/.railway` subsiste), donc pas de lecture possible sans clic dans le tableau de bord, interdit. **Règle en attendant : traiter la dépendance comme réelle** (le coût d'une erreur est asymétrique : supprimer à tort tue la production Office → PDF). **Pour trancher :** installer la CLI (`npm i -g @railway/cli`, aval du propriétaire), puis lire les variables de `gotenberg-v2` **par un petit script qui n'imprime que le NOM et un booléen « la valeur commence par `${{` »** — ⚠️ la CLI, elle, imprime les valeurs : ne jamais lancer `railway variables` sans ce filtre, sa sortie contient des secrets. Résoudre les références en valeurs propres AVANT toute suppression. **Décision : le garder comme retour arrière tant que les correctifs de polices ne sont pas stabilisés en production.**
- **📌 DÉCISION du 19 septembre : la vérification des références croisées Gotenberg est REPORTÉE APRÈS LE LANCEMENT.** Elle ne sert qu'à décider de supprimer un service à ~2 $/mois qu'on a décidé de garder ; aucun risque ne pèse sur le lancement. Quand elle se fera : `npx @railway/cli` (sans installation — remplace l'installation globale évoquée ci-dessus), et **jamais sans un filtre qui n'affiche que les noms** (et un booléen « commence par `${{` ») — la CLI imprime les valeurs. En attendant, la dépendance reste traitée comme réelle et rien n'est supprimé.
- **Replis silencieux de `lib/quota/config.js` — 2 corrigés le 19 septembre, 8 restent (état réel lu, noms seulement).** `IP_RATE_LIMIT_PER_HOUR` / `_PER_DAY` : le code retombait sur 10/h et 30/jour (production : 30/h et 100/jour) ; **désormais une variable absente ou invalide fait échouer le build/démarrage** (`lib/quota/requiredEnv.js`, test `scripts/quota-tests/16-required-env.js`). **Les 8 autres constantes gardent leur repli.** État réel en production (`vercel env ls`, filtré sur les noms) : **présentes** `GLOBAL_SPEND_CAP_USD`, `USER_QUOTA_PDF_CONVERSIONS`, `USER_QUOTA_IMAGES`, `IP_RATE_LIMIT_PER_HOUR`, `IP_RATE_LIMIT_PER_DAY` (Production + Preview, **jamais Development**) ; **ABSENTES, donc tournant sur leur repli en production** : `TOOL_ERROR_RATE_LIMIT_PER_HOUR` (20), `TOOL_ERROR_RATE_LIMIT_PER_DAY` (100), `TOOL_ERROR_ALERT_THRESHOLD_PER_DAY` (10), `CONTACT_RATE_LIMIT_PER_HOUR` (5), `CONTACT_RATE_LIMIT_PER_DAY` (15). Ces 5 replis sont les valeurs voulues (justifiées dans les commentaires du fichier) : l'écart est de forme, pas de valeur. **Ordre obligatoire pour la suite (« B ») : créer les 5 variables dans Vercel D'ABORD, puis retirer les replis** — l'inverse casse le build. Détail et chiffrage : `RAPPORT-replis-quota.md`.
- **Envisager la veille Serverless de `pdf-tools`** : le service est actif 24 h/24 alors que ses outils sont « Coming Soon » (même mécanisme que le détourage).
- **Supprimer à la main** `Downloads\fidelite-01..06.pdf` (verrouillés par Chrome).
- **Supprimer la variable `REMOVEBG_API_KEY`** de Vercel : plus aucun code ne l'utilise.
- **Supprimer le sitemap en double dans Search Console** — garder **uniquement celui en `www`**.
- **Vérifier l'adresse de facturation des cinq fournisseurs** (Anthropic, Google Workspace, Railway, Cloudflare, OpenAI).
- **Signer le DPA ConvertAPI** — avant de viser des visiteurs européens.
- **Centraliser les notifications fournisseurs** vers `contact@onlineconvertools.com`.
- **`PROJET.md` est obsolète et trompeur.** Inventaire réel : **247 pages**.
- **Supprimer** `.claude\worktrees\quota-spend-infra` et la branche `worktree-quota-spend-infra`.
- **Supprimer ou ignorer** `_scratch_test_signup.mjs`.
- **Ajouter sur l'écran post-inscription** : « et marquez-le comme non indésirable ».
- **Envoyer le rapport de bug Claude Code** (14 sous-agents dupliqués — et, le 19 septembre, un **agent de fond qui a modifié trois pages d'outils sans autorisation**, puis émis un message « stop editing files » adressé à l'agent principal).

---

# ⏳ EN ATTENTE D'UN DÉCLENCHEUR

## Déclenchés par le calendrier

| Quand | Quoi |
|---|---|
| **Quand le rapport Indexation dépassera le 03/09** | Relever le **vrai nombre de pages indexées**. |
| **Le 27 de chaque mois** | Renouvellement Anthropic Pro — CA$ 32,19 |
| **6 juin 2027** | Renouvellement du domaine chez Cloudflare Registrar — US$ 10,98/an. **Si le domaine tombe, tout tombe.** |

## Déclenchés par le lancement

| Quand | Quoi |
|---|---|
| **Plusieurs jours AVANT** | Remonter Railway de **1 à 3 réplicas** sur **Gotenberg**, puis **retester les cinq outils**. ⚠️ Laisser le conteneur se stabiliser. |
| **Juste AVANT, en dernier** | Refaire la **galerie Product Hunt** (capture du 17 août). **Seule source de domaines référents prévue. Sa valeur est le lien, pas le trafic.** |
| **Juste APRÈS** | **Décider de la direction : référencement de niche ou B2B**, sur les données d'usage réel |
| **Juste APRÈS** | **Vérifier les références croisées Gotenberg** (`npx @railway/cli`, filtre noms seulement) · **Corriger les 8 replis restants (« B »)** : créer d'abord les 5 variables absentes dans Vercel |
| **Juste APRÈS** | **Relever le plafond de 4,4 Mo** (D8) · **Vague 5 de l'audit** · **les deux réserves du réviseur** (IP falsifiable, compensation non atomique) · **purge de `tool_errors`** au-delà de 90 jours |

## Déclenchés par le trafic

| Quand | Quoi |
|---|---|
| **20 à 50 visiteurs/jour réels** | Demander **AdSense**. Pas avant. |
| **Le jour de la demande AdSense** | **Relire trois contrats** : ① Vercel **Hobby → Pro** (Hobby = usage **non commercial**) ② **Adobe PDF Services** palier gratuit ③ **OpenAI** |
| **Quand le volume d'erreurs devient lisible** | Décider de construire la **page d'administration des erreurs** |
| **Si PDF→Excel / PPT dépasse 500 transactions/mois** | Contacter le **commercial Adobe**. **Repli : ConvertAPI**, ~0,004 à 0,01 $/conversion. |
| **Si les refus à 4,4 Mo apparaissent dans `tool_errors`** | Le chantier D8 passe **avant** les autres — c'est une demande réelle mesurée. |
| **Si le trafic justifie la fiabilité** | **Absence de repli sur les API d'IA** — une clé expirée fait tomber **15 outils** |
| **Si un e-mail retombe en indésirables** | Rouvrir la délivrabilité. La cause serait la **réputation du domaine**. |
| **Si le détourage dépasse ~1 600 images/mois** | Revoir le dimensionnement du service Railway et le coût par appel. |

## Déclenchés par un chantier précédent

| Quand | Quoi |
|---|---|
| 🧊 **GELÉ — trafic organique réel** | **Internationalisation**. Traduire une page en position 74 produit treize pages en position 74. |
| 🅿️ **PARQUÉ — si « Découverte » ne remonte pas 3 semaines après la baisse de fréquence des déploiements** | **Le paramètre `?dpl=`.** Mécanisme réel, **non prouvé sur Googlebot**. |
| **Si la couverture WebGPU dépasse ~90 %** | Envisager l'**hybride** pour le détourage. Aujourd'hui 70 %. |
| **Après plusieurs semaines de DMARC propres** | Reconsidérer `p=none` → `p=quarantine`. **Décision actuelle : ne pas durcir.** |
| **Quand une référence indépendante sera disponible** | Refaire la comparaison de fidélité contre **Adobe ou Microsoft** — FreeConvert et Online2PDF ne sont pas deux avis indépendants. |

---

# ⚠️ FRAGILITÉS CONNUES, ASSUMÉES

- **Zéro domaine référent.** Le concurrent en a 7 600. **C'est la cause première du classement en page 8, et ce que l'urgence ne peut pas accélérer.**
- **Le plafond de charge utile des fonctions Vercel est de 4,4-4,7 Mo.** **Mesuré exactement le 19 septembre sur les routes Office : refus entre 4 412 819 et 4 517 676 octets.** Ces routes envoient du **multipart brut**. En revanche, tout outil qui encode en **base64** touche le mur dès **3,3 Mo de fichier réel** (inflation ×1,33) — c'est ce qui est arrivé deux fois. **Tout nouvel outil qui fait transiter un fichier par Vercel doit être conçu en le sachant.**
- **`RESEND_API_KEY` et `GOTENBERG_PASSWORD` sont signalées par l'API Vercel comme lisibles.** À basculer en variables sensibles si le plan le permet ; ne jamais les afficher entre-temps.
- **Un déploiement Railway qui plante ne fait pas tomber le service** — l'ancienne version reste servie, sans alerte.
- **Deux services Railway servent la même image Gotenberg**, **possiblement** liés par des références croisées de variables (**non vérifié**, voir ADMINISTRATIF).
- **Dépendance à des fournisseurs tiers qui peuvent disparaître.** Les mêmes questions valent pour **ConvertAPI, Adobe PDF Services et OpenAI**.
- **La navbar est à budget de largeur ZÉRO.**
- **Aucun repli sur les API d'IA** — une clé expirée fait tomber **15 outils**
- **Le câblage `try/catch` des quatre `route.ts` de quota n'est couvert que par revue manuelle**
- **Trafic réel : zéro**
- **Les agents de fond de Claude Code ont modifié des fichiers de production sans autorisation** (19 septembre). **Interdire la délégation à un agent de fond sur tout chantier qui touche au contenu du site.**
- **Claude Code a violé deux fois la consigne « aucun réveil planifié »** (auto-signalé, annulé).
- **Un commit a atterri sur master hors du flux de branche** (`a794284c`). Cause et prévention dans `RAPPORT-detourage-phase2.md` §12.

---

# ⛔ NE PAS TOUCHER — pièges déjà identifiés

- **⚠️ NE JAMAIS se fier au rapport « Indexation des pages » sans regarder sa date.** **La source fiable est « Inspection de l'URL », en direct.**
- **Ne JAMAIS piloter Railway au clic dans le navigateur.** 42 appels en 44 minutes, puis 2 h 15 pour quatre réglages. **Railway expose une CLI et une API GraphQL** : c'est par là qu'on passe. Le navigateur sert à lire un écran, jamais à cliquer en série.
- **Ne JAMAIS changer la branche d'un service Railway pour « tester ».** Les services Railway servent la **production** ; une session interrompue laisse le réglage en place sans alerte.
- **Ne JAMAIS bloquer `/_next/static/` dans `robots.txt`.**
- **Ne pas désactiver le paramètre `?dpl=`** sans avoir mesuré l'effet de la baisse de fréquence des déploiements.
- **Ne pas cliquer « VALIDER LA CORRECTION »** tant que rien n'a été corrigé.
- **Le sitemap est sain : 240/240 en 200.**
- **Le bug de navbar n'existe plus.**
- **`send.onlineconvertools.com` n'est PAS orphelin.** C'est le domaine d'enveloppe de Resend ; **c'est sur lui que SPF s'évalue**.
- **La clé anonyme Supabase visible dans le JS de production est publique par conception.** Fausse alerte levée deux fois.
- **Les variables Vercel de type Secret sont en écriture seule** : `vercel env pull` les relit **vides**. Fausse alerte rencontrée trois fois.
- **Dans Railway, ajouter une variable ne suffit pas** — il faut cliquer **« Deploy Changes »**.
- **L'`ignoreCommand` de `vercel.json` annule les redéploiements d'un commit qui ne touche que `docs/**` ou `*.md`.** Ce n'est pas une panne. Contourner au cas par cas, ne jamais modifier le réglage du projet.
- **Ne pas ajouter de policy RLS « admin »** sur `usage_counters`, `usage_events`, `contact_messages`.
- **Les chiffres de `PROJET.md` ne font pas foi.**

---

# ✅ CLOS — avec preuve

| Chantier | Preuve |
|---|---|
| **Promesses de fidélité Office → PDF** | *« professional-quality »* retiré des **5 outils**, remplacé par des formulations adossées à des mesures écrites ; `<meta description>` corrigées ; substitution de police divulguée sur `ppt-to-pdf`. **Vérifié sur le HTML servi en production.** Corpus reproductible versionné. |
| **Gras Excel (D1)** | Cause réelle identifiée (polices `.xlsx` sans nom), `lib/xlsxDefaultFont.js` + test, **Carlito-Bold en production**, au niveau des deux concurrents. |
| **Repli silencieux `pdf-to-word` (D6)** | **503 avec message clair** au lieu d'un texte brut rendu sans le dire. |
| **Gotenberg versionné** | Image épinglée `8.36.0@sha256`, polices Carlito/Caladea/Liberation Sans Narrow/**Selawik**, empreintes vérifiées au build. |
| **Détourage — fournisseur remplacé** | Service auto-hébergé Railway, IS-Net Apache-2.0, qualité dans la dispersion du marché, 1,1-3,7 s/image, 0,00 $/mois à trafic nul, 401 sans clé prouvé, fichiers jusqu'à 50 Mo et 74 mégapixels. |
| **Bug de débordement navbar** | 8 largeurs de 1024 à 1536 px : **0 px partout**. |
| **Plafond `pdf-translate` déclaré** | Motif d'`audio-to-text` reproduit, avant l'upload (`c6ae956a`). |
| **Déploiements inutiles supprimés** | `ignoreCommand` dans `vercel.json`. **6/30 (20 %)** ne touchaient que `docs/*.md`. |
| **Métadonnées des 7 pages manquantes** | `next build` : **247/247, 0 erreur**. |
| **Les pages du site sont acceptées par Google** | Demande manuelle → **indexées en moins de 2 minutes**. 10 catégories sur 12 confirmées. |
| **Diagnostic technique d'indexation** | `RAPPORT-indexation.md` (`21374d83`). |
| **Délivrabilité — SPF, DKIM, DMARC** | MxToolbox tout vert, **message réel en boîte de réception**. |
| Redirections des anciennes adresses | 202 URL mortes en 301 (`f0ab1ddc`) |
| Surveillance et alertes | `CRON_SECRET` régénéré, deux canaux isolés, testé de bout en bout |
| Système de quotas | Trois couches. 10 requêtes simultanées contre un quota de 5 → exactement 5 passent |
| Tests de quota (4 scripts) | Tous PASS le 6 septembre |
| Rotation des secrets exposés | ConvertAPI, OpenAI, Supabase |
| Audit de confidentialité | 198 pages « traitement local » croisées avec 27 pages à appel réseau → **zéro contradiction** |
| Authentification | Quatre parcours testés en réel |
| Carte bancaire chez les cinq fournisseurs | Fait |
| Audit de couverture, vagues 1 à 4 | `50527805`, `b77f988b`, `eaddc44e`, `4fe2d182`, `a1c826be`, `990b99a3` |
| Blocage TIFF | Web Worker, délai de 20 s **mesuré**, annulation (`036bf63f`) |
| Neuf profondeurs de bits TIFF | 4 à 32 bits (`d4084c8e`) |
| Remontée automatique des échecs | 19 outils instrumentés (`07434b1a`) |
| Détection du format réel | Extension mensongère → message clair + lien vers le bon outil |
| Plantage après téléchargement | Correctif au niveau du site (`ab77de51`) |
| Pièces jointes du formulaire de contact | Images seules, **jamais stockées** (`8ab7fcf0`) |
| Persistance du formulaire de contact | Échec d'insertion alerté et journalisé (`28ad556b`) |

---

# LA DOCTRINE DE VÉRIFICATION

**0. La règle zéro : mesurer avant de construire.** **La couche la plus rentable.**

**1. Lecture du code et comparaison au marché.** Vérifier dans le code que l'écart existe **avant** de corriger — le tableau d'audit se trompe une fois sur trois.

**2. Tests avec de vrais fichiers téléchargés.** La couche la plus productive. **« Listé » n'est jamais « prouvé ».**

**3. Navigateur, sous condition stricte.** Uniquement pour ce qui n'existe que dans un navigateur.

**4. Réviseur indépendant, calibré sur le risque.** **A payé cinq fois sur le seul chantier de détourage**, dont deux documents juridiques qui disaient faux.

**5. Le passage manuel du propriétaire.** Irremplaçable.

**6. La remontée automatique des échecs.** En production depuis le 10 septembre.

**7. Les données Search Console — avec leur date.**

> ### ⚠️ LES LEÇONS
> ① Un tableau de bord a une date. La lire avant d'en tirer une stratégie.
> ② Un mécanisme réel peut ne pas s'appliquer à l'acteur concerné.
> ③ Un bloquant qu'on ne revérifie pas reste ouvert même après avoir été réglé.
> ④ Vérifier que le fournisseur existera encore.
> ⑤ Un service qui répond n'exécute pas forcément ton code.
> ⑥ Mesurer la mémoire, pas seulement le temps. Le mot « lite » dans un nom de modèle ne veut rien dire.
> ⑦ **Un outil mal choisi coûte plus cher qu'un travail mal fait.** Deux heures de clics sur Railway pour quatre réglages qu'une ligne de commande fait en secondes.
> ⑧ **Une doctrine que l'exécutant ne peut pas lire n'existe pas.** Ce document a vécu des semaines hors du dépôt, invisible de Claude Code.
> ⑨ **Une cause « probable » n'est pas une cause.** D1 et D2 avaient tous deux une hypothèse plausible : les deux étaient fausses. Vérifier la cause avant de corriger.
> ⑩ **Le plafond qu'on annonce doit être celui qu'on tient.** 25 Mo annoncés, 4,4 Mo réels, et un message d'erreur qui ne dit rien.
> ⑪ **Un échec silencieux qui affiche « réussi » est plus grave qu'une panne visible**, parce que l'utilisateur repart avec un fichier faux et ne revient jamais. Un outil n’annonce jamais un succès sans avoir vérifié que la sortie existe et n'est pas vide, nomme le fichier d'après le type réel du blob produit, et dit AVANT l'usage qu'un format est impossible.

---

# LES INTERDITS PERMANENTS DANS LES PROMPTS

1. Ne jamais afficher `.env.local`, `.env` ou tout fichier d'environnement. Seuls les **noms** de variables. **Ne jamais montrer un secret en capture d'écran** — une clé affichée est grillée.
2. Ne jamais générer un secret à la place du propriétaire.
3. Ne jamais ajouter de **valeur de repli silencieuse** dans un fichier de production.
4. Ne jamais modifier un fichier de production pour contourner un problème d'environnement local.
5. Ne jamais supprimer ni renommer un outil sans accord explicite préalable.
6. **Ne créer aucune boucle de surveillance ni réveil planifié** — 3,7 millions de tokens mesurés.
7. **Tout changement de schéma de base passe AVANT le déploiement du code qui l'utilise.**
8. **Tout test qui soumet un formulaire ou déclenche une opération payante se fait sur une préversion.**
9. Vérifier chaque ligne du tableau d'audit dans le code avant de corriger.
10. Avant de conclure « la plateforme ne sait pas faire », vérifier que le code n'interroge pas le mauvais composant.
11. Ajouter systématiquement : *« Écris aussi ton rapport final dans `docs/audit/RAPPORT-<chantier>.md` et commite-le. »*
12. **Les plafonds ne se lèvent pas, ils se déclarent** — avant la sélection du fichier.
13. **Ne jamais poser un `noindex` ni retirer du sitemap une URL saine sans accord explicite.**
14. **Vérifier la licence de tout modèle ou police avant de l'intégrer.** *(A éliminé 2 modèles sur 5 ; a validé Liberation Sans Narrow et Selawik.)*
15. **Avant d'intégrer ou de payer un service tiers, vérifier en direct qu'il ne ferme pas.**
16. **Ne jamais changer la branche d'un service Railway pour tester.**
17. **Ne jamais créer un second compte chez un fournisseur pour récupérer un quota gratuit.**
18. **Ne déléguer aucun travail sur le contenu du site à un agent de fond.**
19. **Plus de vingt minutes sans progrès mesurable = mauvaise approche.** S'arrêter et expliquer, jamais recommencer.
20. **Ne jamais réécrire une promesse avant d'avoir la mesure qui la soutient.**

---

# HYGIÈNE DE SESSION

- **Branche + balise de restauration avant le premier commit** de tout chantier ; `git checkout -b` vérifié juste après la balise (une balise seule a déjà laissé deux commits atterrir sur master)
- **`/clear` entre deux chantiers** · **une session Claude Code neuve par chantier**
- **Lire ce document au début de chaque chantier** — il est dans le dépôt depuis le 19 septembre 2026
- **Prompts ciblés** : nommer le répertoire et la section utile
- **Écrire l'avancement dans le dépôt au fil de l'eau** (`docs/audit/PROGRESS-<chantier>.md`)
- **Vérifier `/usage` avant un chantier long**
- **Permissions** : `.claude/settings.json` porte `deny` sur les `.env` et `ask` sur `rm`, `git push --force`, `vercel env`, `supabase db` ; `~/.claude/settings.json` porte `defaultMode: "auto"`. Dans Claude in Chrome, répondre **2** (*« Allow all actions on ce site for this session »*), jamais 1.

---

# ANNEXE A — la carte des moteurs

| # | Moteur | Où | Outils |
|---|---|---|---|
| 1 | pdfjs-dist (texte seul) | Navigateur | 3 |
| 2 | Gotenberg / LibreOffice | Serveur | 2 |
| 3 | Gotenberg / Chromium | Serveur | 2 |
| 4 | ConvertAPI | Serveur | 2 |
| 5 | pdf-tools-service (Ghostscript, qpdf, veraPDF) | Serveur | 2 |
| 6 | **MediaRecorder** | Navigateur | 7 — **le plus gros écart, voir bloquant 6** |
| 7 | ffmpeg.wasm | Navigateur | 9 |
| 8 | gifenc | Navigateur | 7 |
| 9 | Web Audio → WAV | Navigateur | 2 |
| 10-12 | OpenAI (texte, vision, Whisper) | Serveur | 16 |
| **13** | **IS-Net general-use (ONNX) — service Railway auto-hébergé** | **Serveur** | **1 — remplace remove.bg** |
| 14 | heic2any | Navigateur | 2 |
| 15 | Tesseract.js | Navigateur | 1 |

**Le fait central de l'audit :** la cause dominante des écarts n'est ni la technologie ni le budget, c'est **le bon moteur déjà présent dans le dépôt et simplement pas branché** — ou, comme pour le détourage, pas envisagé au bon endroit.

# ANNEXE B — charger un secret sans le laisser en trace

**Générer un secret sans jamais l'afficher** — il part directement dans le presse-papiers :

```powershell
$b = New-Object byte[] 32; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); [Convert]::ToBase64String($b) | Set-Clipboard
```

Charger des variables dans une session PowerShell, sans trace disque :

```powershell
Get-Content .env.local | ForEach-Object {
    if ($_ -match '^(NEXT_PUBLIC_SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY)="?([^"]*)"?$') {
        [System.Environment]::SetEnvironmentVariable($matches[1], $matches[2], 'Process')
    }
}
```

⚠️ Les scripts de `scripts/quota-tests/` touchent le **vrai** compartiment `global_spend_microusd`.

---

# ANNEXE C — repères du marché, septembre 2026

| Site | Ce qu'il prouve |
|---|---|
| **FreeConvert** — 7 600 domaines référents, DR 77, 11,4 M visites/mois · **plafond annoncé 1 Go** | L'écart de liens entrants est l'obstacle réel. Trafic mondial : Indonésie 19 %, Inde 15 %, États-Unis 14 %. |
| **Online2PDF** — **plafond annoncé 150 Mo** | ~34× notre plafond réel de 4,4 Mo. |
| **Adobe `pdf-to-word`** — 385 000 visites/mois | **Une seule page** peut porter un site entier. |
| **Omni Calculator** — 2,3 M visites/mois | Un site de **calculateurs** purs atteint ce niveau. |
| **Coolors** — 340 500 visites/mois sur un générateur | Un outil unique bien ciblé bat un catalogue. |
| **Détourage** — remove.bg 12 Mo · PhotoRoom 50 Mo · Leonardo.Ai 0,1047 $/image | Plafond retenu : **50 Mo**. |
| **Fidélité Office → PDF** — FreeConvert et Online2PDF à **0,1-0,24 % de pixels d'écart** de nous sur `.docx` | Nous sommes au niveau du marché gratuit sur la fidélité. **L'écart n'est pas là, il est sur la taille de fichier acceptée.** |

**La règle qui en découle :** viser les requêtes de niche à faible difficulté (KD ≤ 30), jamais les termes génériques tenus par des sites à DR 77.

---

# CRITÈRE DE LANCEMENT

**Un bloquant technique restant : 9 (Safari — macOS mesuré, iPhone et retest des correctifs à faire par le propriétaire).** Railway Gotenberg à 3 réplicas, et la galerie Product Hunt.

Le bloquant 2 est **mesuré et ses promesses corrigées en ligne** ; ses défauts résiduels (D7, D9) et le relèvement du plafond (D8) passent après le lancement.

Le bloquant 5 est **borné à l'usage** (30-40 outils mis en avant). Les bloquants 6, 7, 8 passent après le lancement.

**Le site est indexé et classé en page 8. Une page qui gagne sa requête vaut plus que 225 pages en position 74.**
