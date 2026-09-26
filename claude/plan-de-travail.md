# PLAN DE TRAVAIL — OnlineConverTools

> **📍 EMPLACEMENT DE CE DOCUMENT — lire en premier.**
> Jusqu'au 19 septembre 2026, ce document vivait **uniquement dans le Projet claude.ai**, invisible depuis le dépôt. Claude Code a donc travaillé des semaines sans la RÈGLE ZÉRO, sans les interdits permanents et sans la liste des pièges — et a redécouvert à ses frais des choses déjà écrites ici. **Il vit désormais dans le dépôt, à `claude/plan-de-travail.md`, et c'est la seule copie qui fait foi.** À lire au début de chaque chantier.

> ## ═══ RÈGLE QUI PRIME SUR TOUT LE RESTE, posée fermement par le propriétaire le 23 septembre ═══
>
> **RECHERCHE AVANT TOUTE DÉCISION — sans exception, et quelle que soit la taille de la décision.**
> Cela ne vaut pas seulement pour les outils : cela vaut pour le moindre détail technique, d'interface
> ou esthétique — une bibliothèque, une architecture, un plafond, un libellé, une disposition, une
> couleur. Avant de choisir, tu regardes comment les sites de référence font, et par quel moyen.
>
> **Établir le MOYEN, pas seulement constater le RÉSULTAT.** Mesurer qu'un concurrent fait mieux ne
> sert à rien si on ne sait pas comment il s'y prend. Ne jamais optimiser à l'intérieur d'une solution
> sans avoir vérifié que c'est la bonne famille de solution.
>
> **Point de départ obligatoire : tout ce que propose ce site existe déjà ailleurs sur le web.** Des
> concurrents le font sans se ruiner, donc un moyen viable EXISTE. Conclure « trop cher » ou
> « impossible » à partir du tarif d'un seul fournisseur est une faute de méthode.
>
> **Aucune suppression d'outil ne peut même être PROPOSÉE avant une recherche documentée montrant
> qu'aucune solution de qualité n'existe — et la décision appartient au propriétaire, toujours.**
>
> Le résultat doit être ÉGAL OU SUPÉRIEUR aux sites de référence, jamais inférieur.

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

## 2 bis — ✅ **D8 / D10 — le plafond de ≈ 4,5 Mo : CODE FAIT, PROUVÉ SUR PRÉVERSION (21 septembre 2026)** — `RAPPORT-office-envoi-morceaux.md`

> **Fait le 21/09, en production (`aed1e753`) :** les routes `convert-to-pdf` (Word, Excel, PowerPoint), `convert-html-to-pdf` (HTML, EPUB, MOBI), `pdf-to-word`, `pdf-repair`, `pdf-to-pdfa` et `ai-transcribe` (audio) passent par l'envoi par morceaux (service : type de job `stage`, billet « serveur » distinct ; fusionné sur `master` en premier). Petits fichiers : le nouveau chemin est plus lent de 1 à 6 s → **l'ancien chemin est gardé jusqu'à 4 Mio** (`OFFICE_STAGED_THRESHOLD_BYTES`).
>
> **✅ 22/09 — plafonds remesurés après correction de deux vraies causes** (`RAPPORT-plafonds-mesures.md`) : ① `API_TIMEOUT` de Gotenberg de production passé de 60 s à 240 s ; ② un vrai défaut trouvé et corrigé — le service de stockage (Railway) s'endormait pendant une longue conversion (veille Serverless) et perdait le job en mémoire, faisant échouer une conversion pourtant réussie (signal de vie ajouté toutes les 45 s, vérifié deux fois sur le fichier qui avait échoué). `image-captioner` corrigé : redimensionnement dans le navigateur avant l'envoi (comme le détourage), plus de plafond base64.
>
> **Plafonds annoncés, avec la nature de chaque limite (⚙️ = architecture actuelle, tombera avec l'unification à venir ; 🔒 = vraie limite, moteur/format/fournisseur, restera) :**
>
> | Outil | Plafond annoncé | Plus gros succès mesuré | Cause de l'échec suivant | Nature |
> |---|---|---|---|---|
> | Word / PowerPoint | **100 Mo** | 148,6 Mio (72-88 s) | mémoire de la fonction Vercel | ⚙️ architecture |
> | Excel | **60 Mo** | 69,8 Mio (247-251 s) | `API_TIMEOUT` Gotenberg (240 s) | 🔒 réelle (moteur) |
> | PDF vers Word | **99 Mo** | 100,3 Mio (204,6 s) | mémoire de la fonction Vercel | ⚙️ architecture |
> | HTML/EPUB/MOBI | **100 Mo** | 149,9 Mio (90,4 s), pas d'échec trouvé | — | non déterminée |
> | PDF Repair / PDF/A | **44 Mo** | 45,4 Mio (22-30 s) | config du service `pdf-tools` (50 Mo) | ⚙️ architecture légère (variable d'env) |
> | Image Captioner | **80 Mo** | 58 Mo / 80 MP (3,4-6,0 s), pas d'échec trouvé | — | corrigé (redimensionnement navigateur) |
> | Audio | **25 Mo** | 24,1 Mio (48,5 s) | limite de Whisper | 🔒 réelle (fournisseur) |
>
> **Concurrence des workers Gotenberg** : au moins 2 conversions lourdes (~250 s chacune) simultanées sans dégrader les autres outils — non éprouvé au-delà.
> **Coût ConvertAPI mesuré, pas de risque à un seul visiteur** : flat 0,01 $/conversion (confirmé 10 à 148 Mio) ; la garde réserve exactement ce montant, donc elle est déjà exacte. Une IP est plafonnée à 1 $/jour (limite par IP partagée, 100/jour). 2000 conversions dans le mois, tous visiteurs confondus, épuisent le plafond global de 20 $ — vrai avant D8 comme après, pas un risque nouveau.
> **Correction après coup (revérifiée en production) :** PDF Repair/PDF/A et PDF vers Word annonçaient d'abord 45 et 100 Mo, pile la taille du fichier de preuve (45,38 et 100,25 Mio) — pas une erreur de fond (un plafond sous un succès prouvé reste valide), mais resserré à **44 et 99 Mo** pour une vraie marge, revérifié avec des fichiers de 40 et 90 Mio.
> **Décision Gotenberg (au propriétaire) :** `gotenberg-fonts` confirmé par les journaux de requêtes comme **ne servant aucune conversion** depuis 3 jours (`gotenberg-v2` sert tout) ; coût mesuré ≈ 0,7-5,7 $/mois selon la charge, pour zéro travail utile. Recommandation : copier ses 8 variables référencées vers `gotenberg-v2` (préalable sans risque), puis le supprimer. Rien fait, décision en attente.
> **`.claude/settings.local.json` nettoyé** : 23 règles trop larges retirées (guillemet fermé avant la fin de la commande, interpréteurs/réseau/Git sans contrainte).


> **C'est le plus gros écart mesuré du projet, et il pèse plus que la fidélité.**

**Mesuré le 19 septembre, fichier à l'appui :** un fichier de **4 412 819 octets passe**, un de **4 517 676 octets est refusé** par Vercel (`FUNCTION_PAYLOAD_TOO_LARGE`). Vaut pour `.xlsx`, `.pptx`, `.docx` et `pdf-to-word`. **Ces routes envoient du multipart brut — pas d'inflation base64**, contrairement au détourage.

- **Le « 25 Mo » n'existe que dans un message d'erreur serveur inatteignable.** Aucune page ne l'affiche.
- ✅ **D10 CORRIGÉ et vérifié en production le 19 septembre** (`RAPPORT-plafonds-declares.md`) : plafond de **4 Mio** annoncé avant la sélection, contrôlé dans le navigateur, message honnête, sur les 4 routes + html/epub/mobi-to-pdf, pdf-repair, pdf-to-pdfa (qui annonçaient 50 Mo), audio-to-text et audio-transcriber (10 Mo), image-captioner (3 Mio, base64). Le plafond lui-même n'est pas relevé (D8 reste ouvert).
- **D10 — ce que voyait le visiteur (avant correction) :** un fichier de 5 à 25 Mo affiche *« Conversion failed. Please try again. »* Il réessaie, ça échoue encore, il part. **C'est un mensonge par omission et un bloquant de lancement.**
- **Écart marché :** **~33×** moins qu'Online2PDF (150 Mo), **~230×** moins que FreeConvert (1 Go). *(Tailles affichées par leurs pages, non éprouvées.)*
- **📌 DÉCISION DU PROPRIÉTAIRE, 20 septembre 2026 : D8 PASSE AVANT LE LANCEMENT.** La règle « jamais inférieur au marché » l'emporte sur le report : ≈ 4,5 Mo contre 1 Go chez les concurrents, c'est ~200× moins, et l'argument du report (1 à 4 jours) est tombé — **le mécanisme d'envoi par morceaux existe et tourne déjà en production pour la vidéo**, le chantier coûte **8 à 12 h**. **Mécanisme :** billet signé émis par Vercel + envoi direct par morceaux vers le service Railway (c'est ce que FreeConvert fait) ; le navigateur dépose le fichier (opération « stage »), la route lit le fichier de serveur à serveur, convertit, redépose le PDF. **À faire dans une session neuve dédiée (hygiène de session), preuve contre un Gotenberg de préversion.** ✅ **Contradiction « 100 Mo » TRANCHÉE le 20 septembre par mesure en production** (route `/api/convert-to-pdf`, fichier `.txt` refusé par l'application avant tout quota) : 1 Mio et 4 Mio passent (400 applicatif), **4 493 821 octets acceptés, 4 493 924 refusés** (`FUNCTION_PAYLOAD_TOO_LARGE`, plafond ≈ 4,5 Mo de corps de requête), et **tout ce qui est plus gros est refusé** (4,4 Mio, 6, 10, 26, 60, 100 Mio). **La note « Vercel accepte 100 Mo » est FAUSSE pour ce projet.** ✅ **Textes corrigés le 20-21/09 :** le commentaire de `app/api/convert-to-pdf/route.ts` (« Vercel Functions accept request bodies up to 100 MB… ») et deux FAQ de catégorie qui annonçaient un plafond faux (`pdf-tools` : « jusqu'à 100 Mo » → 700 Mo/100 Mo navigateur, 4 Mo serveur ; `audio-tools` : « jusqu'à 500 Mo » → aucun plafond fixé côté navigateur, 4 Mo pour Audio to Text). Aucun autre plafond faux trouvé dans les pages, FAQ et métadonnées (recensement par expression régulière sur `page.*` et `layout.*`). ✅ **Seconde correction faite le 21/09 avec les plafonds mesurés (voir ci-dessus et le rapport).**

**Chiffrage (ANTÉRIEUR au 20/09, PÉRIMÉ — le mécanisme retenu coûte 8-12 h, voir ci-dessus ; estimations non vérifiées) :** contrôle côté navigateur + message honnête = **quelques heures**. Envoi via **Vercel Blob** = 1 à 2 jours, risque non mesuré sur la taille du PDF renvoyé. Sortir ces routes de Vercel = 2 à 4 jours.

**Décision prise (19 septembre) :** ① le message honnête et le contrôle avant l'envoi partent **tout de suite** — interdit permanent n° 12, *les plafonds ne se lèvent pas, ils se déclarent* ; ② ~~relever réellement le plafond est un chantier à part, après le lancement~~ — **ANNULÉ le 20 septembre par le propriétaire : D8 passe avant le lancement (voir ci-dessus).**

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

### ✅ AUDITÉ le 22 septembre 2026 — `docs/audit/RAPPORT-outils-mis-en-avant.md` (verdict et preuve par outil)

**Le vrai nombre (tranché, gardé par le build) : 225 dossiers d'outils, dont 3 « Coming Soon » → 222 outils qui fonctionnent.** Par catégorie : PDF 37 · Image 37 · GIF 11 · Audio 11 · Vidéo 15 · Fichiers 9 · QR 3 · Convertisseurs 4 · Développeur 57 · Maths 6 · IA 15 · Texte 17. 4 slugs existent dans deux catégories (`base64-encoder`, `number-base-converter`, `url-encoder`, `video-to-gif`). Sitemap : 240 URL (6 + 12 + 222). Build : 247 routes. **« 232 » n'existe nulle part** ; le site affichait « 225+ » → corrigé en 222 partout ; `check-tool-links.js` fait échouer le build si un compteur codé en dur diverge. « 190+ Countries » (non mesuré) et « No limits » (faux) retirés. `public/og-image.png` porte encore « 225 » (préparation de lancement, non touché).

**Périmètre : 36 outils** = 6 « Popular Tools » + 36 noms des cartes de catégorie (6 en commun) ; le pied de page n'ajoute rien.

**Résultat :** 13 FONCTIONNE sans réserve · 23 avec un écart de qualité, de couverture ou un défaut visible · **10 rendaient un résultat faux sans le dire — tous corrigés et vérifiés en production** : `image-compressor` (fichier plus lourd livré « compressé », fond noir), `image-converter` (fond noir sans aperçu), `tar-extractor` (en-têtes PAX livrés comme fichiers, dont un sous le vrai nom), `json-formatter` (12345678901234567890 → …7000), `xml-to-json` (0612345678 → 612345678), `number-base-converter` (« 1012 » binaire → 5 ; 2⁶⁴−1 faux), `unit-converter` (1 mm = « 0.0000 » mile), `percentage-calculator` (« 0.00 »), `roman-numeral-converter` (« IM » → 999), `currency-converter` (heure du navigateur affichée comme date des taux).

**Écarts mesurés contre le marché, même fichier :** `pdf-compress` −17,6 % / −0,1 % contre iLovePDF −35 % / −15,4 % ; `image-compressor` ~28 % plus lourd qu'iLoveIMG à PSNR égal ; `image-upscaler` netteté 1,27 contre 3,46 (iLoveIMG IA), sous un bicubique, rangé dans « AI Tools » sans IA ; `mp4-to-gif` écrase les vidéos verticales ; `video-to-gif` 18 Mo pour 3 s ; `image-resizer` sans verrou de proportions ; Opus cassé dans `audio-converter`.

**📌 23/09 — les 17 améliorations chiffrées, inscrites ici avec leur coût** (`RAPPORT-ecarts-marche.md` pour 1-6, `RAPPORT-outils-mis-en-avant.md` §4 pour 7-17 ; estimations = estimations). Les six premières sont **faites et vérifiées en production le 23/09** ; les onze autres restent des **bloquants de qualité ouverts** — aucune ne se perd.

| # | Outil | Écart mesuré | Proposition | Coût | État |
|---|---|---|---|---|---|
| 1 | pdf-compress | −17,6 % / −0,1 % contre iLovePDF −35 % / −15,4 % | Optimisation en place (pikepdf + `tx` d'Adobe) sur `pdf-tools`, 3 niveaux, jusqu'à 200 Mo | ~10 h fait · 0 $ fixe | ✅ **fait** — sans perte −35,4 % (rendu identique), recommandé −40,6 %, extrême −43,0 % / −78,8 % |
| 2 | image-compressor | ~28 % plus lourd qu'iLoveIMG ; JPEG forcé | MozJPEG + palette PNG + WebP dans le navigateur, lot + ZIP | ~6 h fait · 0 $ | ✅ **fait** — égal ou mieux sur les 4 fichiers |
| 3 | video-to-gif, mp4-to-gif (+ mov/avi/webm-to-gif) | 18 Mo pour 3 s ; vidéo verticale écrasée | Service ffmpeg : début, durée, largeur, i/s | ~3 h fait · ≈ 0 $ | ✅ **fait** — proportions gardées, 5 outils |
| 4 | image-upscaler | netteté 1,27 contre 3,46 ; « IA » sans IA | Modèle MoSR 4xNomos2_hq auto-hébergé | ~8 h fait · ≈ 0,002 $/image de 1 Mpx | ✅ **fait** — LPIPS 0,107 contre 0,164 chez iLoveIMG |
| 5 | image-resizer | déformation ; PNG forcé (×5,2) | Verrou de proportions, %, format conservé | ~1 h fait | ✅ **fait** |
| 6 | audio-converter | Opus cassé | Opus via le service (libopus) ; encodeur natif ailleurs | ~2 h fait | ✅ **fait** |
| 7 | pdf-split | ni « chaque page », ni « toutes les N pages », ni ZIP | Ces modes + ZIP | 3-4 h | ✅ **production 23/09** — modes gratuits d'iLovePDF + ZIP ; plages invalides refusées au lieu d'un PDF vide |
| 8 | text-reverser / case-converter / word-counter | emoji cassés ; Sentence case faux ; phrases mal comptées | `Intl.Segmenter`, casse par phrase | 2-3 h (les trois) | ✅ **production 23/09** — 18 mots / 6 phrases là où wordcounter.net compte 13 / 5 |
| 9 | hash-generator | ni MD5 ni fichiers | MD5, SHA-384, CRC32, fichiers en Worker | 2-3 h | ✅ **production 24/09** (`44ae126c`) — moyen de la référence (html-code-generator : Web Crypto ≤ 700 Mio + hash-wasm en flux) repris, puis dépassé : 17 algorithmes contre 9, HMAC, vérification d'un hash attendu, `checksums.txt` vérifié par `sha256sum -c`, algorithmes répartis sur 4 Workers. **Même fichier, 5 algorithmes (nous / réf.) :** Chromium 3 Mo 0,2/0,4 s · 300 Mio 4,0/5,0 s · 760 Mio 11,7/31,8 s (www) ; Firefox 0,4/0,4 · 9,0/14,6 · 66,7/104,3 s. 5 Gio : 52 s, SHA-256 exact. Chaque algorithme contrôlé contre une implémentation indépendante (OpenSSL, blake3, xxhash, crc32c) |
| 10 | currency-converter | 24 devises / 166 ; API v4 dépréciée | Toutes les devises, source durable (à vérifier en direct) | 1-2 h | ✅ **production 23/09** — 166 devises (open.er-api v6), écart BCE 0,055 % |
| 11 | qr-generator | 400 px, ni couleurs, ni logo, ni types | 2000 px, couleurs, correction, Wi-Fi/vCard | 3-4 h | ✅ **production 24/09** (`eb4e67a9`) — 8 types, 2000 px, logo, PDF ; chaque code relu par jsQR avant d'être proposé (QRCode Monkey ne le fait pas) ; 11/11 Chromium + Firefox sur préversion puis sur www |
| 12 | image-converter | 4 sorties | BMP, GIF, ICO, TIFF, PDF | 3-4 h | ✅ **production 24/09** (`eb4e67a9`) — 5 sorties ajoutées (celles de CloudConvert/Convertio) ; GIF 30 Mpx en 3,9 s ; 8/8 Chromium + Firefox sur préversion puis sur www. GIF face à CloudConvert : non mesuré |
| 13 | grammar-fixer | pas de surlignage | Diff mot à mot | 2-3 h | ⬜ ouvert |
| 14 | barcode-generator | 5 symbologies | ITF-14, Codabar, MSI ; DataMatrix, PDF417 | 2-4 h | 🟡 **prête pour la préversion (26/09, `docs/audit/RAPPORT-amelioration-14.md`), NON déployée** — 37 types relus par zxing-cpp avant téléchargement ; face à barcode-maker.com et barqode.io sur 17 codes : nous 102/102 fichiers lus, barcode-maker 65/68 et 34 « JPG/GIF » qui sont des PNG, barqode 10 types, EAN-13 à 321 % en PDF. Moyens des références adoptés quand on était en dessous : lot en Workers (1000 EAN-13 : 4,9-5,6 s contre 7,7-8,7 s Chromium, chacun relu), planches d'étiquettes à taille réelle, add-ons EAN-5/2, texte libre, CSV. Suites 67/67 Chromium + Firefox. **À faire au retour du propriétaire : préversion, puis production.** |
| 15 | zip-extractor | ZIP seul | RAR/7z/ZIP chiffré, découpé, 40+ formats, « tout télécharger » | 4-6 h | ✅ **production 26/09** (`a3e2cf56`, `docs/audit/RAPPORT-amelioration-15.md`) — 7-Zip 24.09 WASM + zip.js, liste puis extraction à la demande. Même RAR de 1,99 Go face à ezyZip, www, Chromium : premier fichier **médiane 5,1 s contre 7,25 s** (10 paires, 8 gagnées) ; tout extraire dans un dossier **9,2-11,8 s contre 31,0-32,6 s**. Firefox : 3,71 Gio téléchargés sans plantage (figé à 2,8 Gio avant) ; ezyZip n'y ouvrait aucun RAR le 26/09 (404 sur son serveur). Plafond par fichier **1,9 Go**, mesuré (plus bas réel ≈ 1,96 Go). Reste : « all as ZIP » plafonné à 1,9 Go sous Firefox/Safari |
| 16 | unit-converter / color-converter | catégories / espaces manquants | Temps, données, pression, énergie ; HSV, CMYK | 3-4 h + 1-2 h | 🟡 **prête pour la préversion (26/09, `docs/audit/RAPPORT-amelioration-16.md`), NON déployée** — 11 catégories (+ Temps, Données, Pression, Énergie, Puissance), facteurs = définitions NIST ; face à unitconverters.net sur 11 conversions : moins précis à 10 chiffres sur 6 → 12 chiffres, au moins aussi exacts partout (eux : mmHg à 133,322, année 365,25) ; saisie invalide refusée. Couleurs : HSV, CMYK (= RapidTables 7/7), HEX invalide signalé. Suites 30/30 Chromium + Firefox. |
| 17 | gif-maker, qr-scanner, audio-trimmer | options | Ajuster au lieu d'étirer ; caméra ; dixième de seconde + fondus | 2-3 h chacun | ⬜ ouvert |

> **Amélioration 15 — terminée le 26/09**, en production et vérifiée sur www (Chromium + Firefox). Détail, mesures et limites restantes : `docs/audit/RAPPORT-amelioration-15.md`. Banc : `scripts/browser-tests/archive-fixtures.mjs` et `make-big-rar.mjs` (fichiers d'essai), `zip-extractor.mjs` (suite), `-cap.mjs`, `-huge.mjs`, `-vs-ezyzip.mjs` ; préversions protégées : `node --env-file=.env.local` après `vercel link` (`vercel-preview-auth.mjs`, et `vercel-preview-proxy.mjs` pour Firefox). **Prochaines (non commencées, à la demande du propriétaire) : 13, 14, 16, 17, et l'Opus des trois outils audio.**
>
> **⬜ À FAIRE PLUS TARD (suite de la 15, non commencé, pas cette nuit) — « Download all as ZIP » sous Firefox et Safari plafonné à 1,9 Go.** Ces navigateurs n'ont pas `showSaveFilePicker` : le ZIP est construit en entier en mémoire (Blob), d'où le plafond (`ZIP_IN_MEMORY_MAX`, `config.js`) ; au-delà, l'outil dit de télécharger les fichiers un par un (« Save all to a folder » n'y existe pas non plus). **Idée :** téléchargement en flux par Service Worker (technique de StreamSaver.js) — la page envoie les morceaux du ZIP (client-zip) au Service Worker, qui les sert comme une réponse `Content-Disposition: attachment` ; le ZIP n'est alors jamais tenu en mémoire. À mesurer sous Firefox et Safari réel avant d'annoncer quoi que ce soit ; ezyZip ne peut pas servir de référence sous Firefox au 26/09 (ses RAR n'y s'ouvrent pas).

**Trouvé en route le 23/09, à traiter (chiffré dans `RAPPORT-ecarts-marche.md` §8) :** ① le service de détourage fait tourner onnxruntime sur les **48 cœurs de l'hôte** au lieu de ses 8 vCPU (même cause qui rendait l'agrandisseur 6× trop lent) — à mesurer avant de toucher (réglage déjà validé autrement le 14/09) ; ② SVG absent de `image-compressor` (iLoveIMG le compresse) ; ③ Opus des trois autres outils audio : encodeur natif de ffmpeg, **qualité face à libopus non prouvée** — ✅ **tranché le 24/09 : INFÉRIEUR.** ViSQOL (23/09) le donnait au-dessus ; une seconde métrique indépendante, **Zimtohrli** (Google, Apache-2.0, modèle psychoacoustique distinct), sur les mêmes fichiers à taille égale, donne **libopus plus proche de la source 6 fois sur 6** (MOS 64k : 4,60 contre 4,72 instrumental, 4,69 contre 4,72 chanté ; écart qui se resserre à 128k), comme le dit la documentation de ffmpeg. ViSQOL récompense la fidélité de forme d'onde, pas la perception. **Correctif connu, à faire : encoder l'Opus d'Audio Booster, Audio Splitter et Audio Compressor sur le service (libopus), comme Audio Converter** (`scripts/browser-tests/opus-zimtohrli.py`) ; ④ licence du modèle de l'agrandisseur écrite « CC-BY-0.4 » par son auteur (coquille, voir rapport) — confirmation écrite recommandée.

## 6 — ✅ Architecture vidéo — **DÉPLOYÉE et PROUVÉE EN PRODUCTION le 20 septembre 2026** (`docs/audit/RAPPORT-video-architecture.md`, `docs/audit/RAPPORT-video-deploiement.md`)

**Décision : service ffmpeg auto-hébergé sur Railway** (modèle de `background-removal`), branché sur `video-compressor` et `video-converter` ; `video-trimmer` **reste dans le navigateur** (ffmpeg.wasm, coupe sans ré-encodage).

**Déploiement (fait par l'agent avec la CLI/API Railway, secret posé par le propriétaire)** : service `media-processing` dans `fortunate-manifestation` / `production`, Root Directory `services/media-processing`, Watch Paths `/services/media-processing/**`, healthcheck `/health`, veille Serverless, 1 réplica, domaine `media-processing-production-d2f4.up.railway.app`. `/health` 200 ; `POST /v1/jobs` sans billet → **401** (le service exécute bien le nouveau code). `MEDIA_TICKET_SECRET` : Railway + Vercel Production + Vercel Preview (Sensitive). Interrupteur `NEXT_PUBLIC_MEDIA_SERVICE_URL` posé en Preview puis Production ; production `dpl_2YUPUH3a`, commit `f0d5faeb`. Origine de préversion ajoutée à `ALLOWED_ORIGINS` le temps du test puis **retirée et prouvée** (plus d'en-tête CORS pour elle). Retour arrière : retirer `NEXT_PUBLIC_MEDIA_SERVICE_URL` et redéployer (un redéploiement sans diff de code est annulé par l'`ignoreCommand` : passer par un commit de code).

**Prouvé** (Chromium en Preview ET en production, Firefox en Preview ; vraies pages, vrai service, fichiers rouverts par ffmpeg : durées exactes, 0 erreur de décodage) : progression réelle affichée (12 à 90 valeurs distinctes), file d'attente visible, annulation. Réveil après veille : **+1,05 s** en HTTP direct (1,23 s contre 0,17 s), **+2,6 s** vu de la page (« Preparing… » affiché). **Non prouvé : Safari réel / iPhone, WebKit de Playwright** (bloquant 9) ; plafond de 1 Go jamais éprouvé avec un fichier de 1 Go (essais réels jusqu'à 72 Mo en production). Mesures faites depuis une connexion de bureau rapide.

### 🔬 Chantier qualité du 20-21 septembre 2026 (`docs/audit/RAPPORT-video-qualite.md`)

**Le premier tableau du marché comparait des sorties de qualité inégale — il est remplacé par celui-ci** (temps total perçu, téléversement compris · taille · qualité **mesurée** = VMAF moyen contre la source, la source valant 100 ; protocole : les deux flux normalisés à cadence constante avant comparaison, car les horodatages WebM en millisecondes désalignent ~3 % des images et faussaient tous les VMAF WebM d'environ 15 points — **les chiffres VMAF publiés plus tôt le 20/09 étaient faux et sont retirés**). Vidéo de référence 1 : 30 s, 1080p, 21,7 Mo, séquence à main levée en sous-bois (contenu très difficile). Vidéo 2 : 3 min, 720p, 71,8 Mo.

| MP4 → WebM, 30 s | Temps | Taille | VMAF |
|---|---|---|---|
| **Nous** (production, 21/09) | **83,7 s** | **18,8 Mo** | **91,9** |
| Online-Convert | ≈ 100 s | 9,9 Mo | 82,3 |
| FreeConvert | 203 s | 44,1 Mo | 98,9 |
| Convertio | 251 s | 117,5 Mo | 99,98 |
| Zamzar | non fini à 400 s | — | — |

| MP4 → WebM, 3 min | Temps | Taille | VMAF |
|---|---|---|---|
| **Nous** | **147,0 s** | **52,2 Mo** | **93,5** |
| FreeConvert | 223 s | 56,9 Mo | 94,6 |
| Online-Convert | non fini à 500 s | — | — |

**Conclusion franche.** *Vitesse* : plus rapides chez tous les concurrents mesurés (WebM 30 s : 2,4× FreeConvert, 1,2× Online-Convert ; 3 min : 1,5× FreeConvert) — mais **moins qu'avant** : nous avons volontairement dépensé du temps pour la qualité (première version : 18 s, à qualité inférieure). *Qualité à taille égale* : **équivalents à ± 1 VMAF** — 30 s : nous sommes environ 2 points au-dessus de la droite Online-Convert ↔ FreeConvert à 18,8 Mo (interpolation, indicative) ; 3 min : 0,5 à 1 point sous FreeConvert pour 8 % de fichier en moins. **Ce que nous ne faisons pas, volontairement :** produire un fichier plus lourd que la source (FreeConvert : 44 Mo pour une source de 21,7 Mo, VMAF 98,9) — règle du propriétaire ; à 42,6 Mo notre mode lent mesure 98,4. **Non mesuré chez les concurrents :** MP4, H.265, AV1 et le compresseur (aucun temps ni qualité concurrents pour ces sorties) — ne pas écrire « meilleur que le marché » pour eux.

Nos autres sorties, mêmes conditions (production) : **30 s** — MP4 37,0 s · 19,4 Mo · VMAF 94,5 ; H.265 20,3 s · 18,0 Mo · 90,0 ; AV1 19,4 s · 18,1 Mo · 93,7 ; compresseur (équilibré) 15,8 s · 13,5 Mo · 88,4. **3 min** — MP4 36,6 s · 61,0 Mo · 94,7 ; H.265 58,7 s · 29,8 Mo · 84,9 ; AV1 29,0 s · 36,4 Mo · 89,5 ; compresseur 34,6 s · 30,9 Mo · 82,2.

**Réglages d'encodage corrigés (tout est mesuré, rien n'est supposé) :** ① VP9 rapide (`realtime`) ≈ 1 à 2 points sous les concurrents à taille égale → mode lent (`good`, cpu-used 5) jusqu'à 90 « secondes 1080p » : +2 VMAF à taille égale, ~6× le temps ; ② x264 `veryfast` → `faster` : ~23 % de fichier en moins à qualité égale, ~2× le temps ; niveaux du compresseur recalés (27/30/34) ; ③ **règle « jamais plus lourd que la source » : un plafond de débit (VBV/maxrate) a été essayé puis REJETÉ par la mesure** — il affame les premières secondes complexes (5 % des images sous VMAF 60, minimum 15 sur 3 min) ; remplacé par une **échelle de réencodage adaptative** (CRF calculé d'après l'écart mesuré ou projeté, 3 essais au plus, essai abandonné dès 12 % si la projection dépasse 125 % de la source) ; si tout échoue, le fichier est livré et signalé (`larger`) ; ④ **compresseur : jamais un fichier plus gros, dit honnêtement** — niveau supérieur essayé une fois, sinon le service ne renvoie aucun fichier (`notSmaller`, HTTP 410) et la page explique que la vidéo est déjà bien compressée (testé : source déjà très compressée, 320×180). Exception documentée : la famille MPEG-2 (MPG, MPEG, VOB), dont l'encodeur ne peut pas descendre sous ~+0,3 à +2,2 % de la source sur ce contenu difficile.

**Couverture de formats : 34 sorties (avant : 19)** — vidéo (22) : MP4 H.264, **H.265/HEVC**, **AV1**, MOV, MKV, WebM, AVI, **AVI XviD**, WMV, **ASF**, FLV, **F4V**, MPG, **MPEG**, **VOB**, TS, **M2TS**, **MTS/AVCHD**, 3GP, **3G2**, M4V, OGV ; image : GIF animé ; audio (11) : MP3, M4A, **AAC**, WAV, **AIFF**, OGG, Opus, FLAC, **WMA**, **AC3**, **AMR** (en gras : ajoutés). Listes annoncées par les concurrents (non éprouvées) : Convertio 37 sorties vidéo dont HEVC et AV1 · CloudConvert 28 · Online-Convert 11 (ni HEVC ni AV1) · FreeConvert 60+ formats en entrée. **Hors de portée, avec la raison :** RM/RMVB (aucun encodeur RealMedia dans ffmpeg), MXF (profils stricts, aucune demande courante), DV (résolution fixe SD), CAVS, WTV/DVR (conteneurs d'enregistrement TV sans encodeur), AAF, SWF (Flash obsolète), MJPEG brut. Entrées : le service lit tout ce que ffmpeg lit ; la liste d'entrées du sélecteur n'a pas été comparée à celles des concurrents.

**H.265 et AV1 — le service tient.** L'image portait libx265 mais **pas SVT-AV1** (libaom : ~250 s pour 30 s de 1080p, inutilisable). ffmpeg 7.0.2 (johnvansickle, figé depuis 2024) remplacé par **BtbN n8.1.2**, étiquette immuable `autobuild-2026-08-31-13-27`, SHA-256 `c733b4b2…` vérifiée au build (archive de 126 Mo contre 42 Mo). Temps en production, 30 s / 3 min : H.265 **20 s / 59 s**, AV1 **19 s / 29 s**. Aucun changement de dimensionnement nécessaire à ce volume.

**Saturation (production, 4 visiteurs simultanés, compresseur, 30 s).** 2 traitements en parallèle et 10 places d'attente : les deux premiers finissent en 30-34 s, les deux suivants **voient « vous êtes le n° 1 / n° 2 dans la file »** et attendent 14 à 17 s (total 47-49 s, contre 15,8 s seul). Tous réussis. **Ordre de grandeur (extrapolé, non mesuré au-delà de 4) :** un traitement léger ≈ 15 s → attente ≈ 7 à 8 s par rang ; **acceptable jusqu'au rang ~6 pour les jobs légers (≈ 1 min)**, mais **dès le rang 2-3 pour les jobs lourds** (WebM 3 min = 147 s, soit > 2 min d'attente). File pleine (10) + 2 en cours : le 13ᵉ voit « All conversion slots are busy » et son navigateur réessaie toutes les 3 s pendant 10 min (comportement prouvé en local avec 1 place ; **non éprouvé en production : la limite de 20 billets/heure/IP interdit de tester au-delà**). Le registre des jobs est **en mémoire** : monter en charge = agrandir le service (verticalement), **pas** ajouter des réplicas.

**Coût réel mesuré (API d'usage Railway, tarifs lus le 20/09 : 20 $/vCPU-mois, 10 $/Go-mois, 0,05 $/Go sortant ; ce n'est PAS une facture).** Lot connu de 4 compressions de 30 s : **4,5 vCPU-min, 1,66 Go-min, 0,058 Go sortis** → **≈ 0,0013 $ par conversion légère** (**estimation, non mesurée :** un job lourd comme un WebM de 3 min ≈ 20 vCPU-min, ≈ 0,012 $). Consommation totale depuis le déploiement (≈ 36 h, une centaine de conversions d'essai) : 130,8 vCPU-min, 27,1 Go-min, 2,15 Go sortis ≈ **0,17 $**. **Coût retenu : 0,00 $ à trafic nul, ≈ 1 à 2 $/mois à 500 conversions, ≈ 10 à 20 $/mois à 5 000** (extrapolation selon la part de jobs lourds). **Remplace l'estimation de 1,2 $**, qui restait dans la même fourchette.

**✅ Facture réelle de septembre relevée le 22/09 : 2,65 $ pour tous les services Railway confondus** (`RAPPORT-stockage-et-indexation.md` §3 — chiffre du tableau de bord, qui fait foi ; ma propre mesure via l'API d'usage donne un ordre de grandeur comparable, ~1,8 $ extrapolé, mais reste imprécise, un service n'étant pas résolu dans les noms). **La veille de `gotenberg-fonts`, activée le 22/09** (il tournait 24 h/24 sans une seule requête depuis 3 jours, `RAPPORT-gotenberg-independance.md`), **doit faire baisser ce chiffre — à vérifier au prochain relevé.**

**Coût réel Office « stage » (mesuré le 21/09, même API d'usage, ce n'est pas une facture) :** depuis le 20/09 00:00 UTC (~46 h), `media-processing` : 135,0 vCPU-min, 38,5 Go-min, 5,83 Go sortis ≈ **0,36 $** ; les seules ~60 conversions Office d'essai du 21/09 (jusqu'à 400 Mo) ≈ **0,18 $**, presque tout en bande passante sortante (**2 × la taille du fichier**), CPU quasi nul. **Office 10 Mo ≈ 0,001 $ ; 100 Mo ≈ 0,01 $ ; 500 conversions de 10 Mo ≈ 0,5 $/mois.** *Observation mesurée :* `gotenberg-v2` a consommé 2 048 Go-min sur la même fenêtre (≈ 0,47 $ pour ~46 h), la mémoire résidente de Gotenberg pèse plus que tout le reste.

**📌 À TRANCHER AVANT le lancement Product Hunt — saturation.** Au-delà du rang 2-3 sur les jobs lourds, les visiteurs attendent (WebM 3 min : 147 s par rang). Le registre des jobs est en mémoire : **monter en charge = agrandir le service, pas ajouter des réplicas.** Les jobs Office « stage » ne prennent aucun emplacement ffmpeg ; leur goulot est la mémoire de la fonction Vercel et Gotenberg (3 réplicas avant le lancement). La vague de trafic simultané de Product Hunt arrive d'un coup : décider le dimensionnement AVANT, pas après.

**Reste** : ① Safari réel (macOS, iPhone) sur les deux outils vidéo, `image-converter` (AVIF), `video-trimmer` ; ② comparaison chiffrée aux concurrents pour MP4, H.265, AV1 et le compresseur ; ③ essai réel d'un fichier proche de 1 Go ; ④ première facture Railway ; ⑤ ~~D8 (branchement Office)~~ ✅ fait sur préversion le 21/09, voir 2 bis ; ⑥ **essai d'un fichier de 1 Go : non faisable** (la fonction Vercel cède vers ~150-200 Mo pour Office).

## 7 — ✅ Les trois stubs — **construits, vérifiés, publiés le 23/09** (`RAPPORT-ecarts-marche.md` §3d, §5)

> **23/09 :** `pdf-to-excel` et `pdf-to-ppt` construits sur ConvertAPI (même tuyau que `pdf-to-word`, gestionnaire partagé `lib/pdfToOfficeRoute.ts`) — **structurellement identiques à iLovePDF** sur les fichiers du corpus de fidélité (mêmes tableaux, mêmes valeurs typées, mêmes diapositives). `image-generator` construit sur **gpt-image-2 « low »** (≈ 0,006 $/image) après recherche documentée (fournisseurs, paliers gratuits, auto-hébergement impossible sur Railway sans GPU, bornage des concurrents) : 5 images/jour/visiteur et **budget propre de 5 $/mois** qui ne peut pas entamer le plafond global de 20 $. Option moins chère prête pour plus tard : FLUX.2 [klein] 4B (Apache-2.0) chez Cloudflare Workers AI, 0,00115 $/image, ~96 gratuites/jour — **exige un jeton API que seul le propriétaire peut créer**. Compteur passé à **225** ; image OG régénérée ; badges « Coming soon » devenus sans objet (le mécanisme reste pour un futur stub).

*(Historique ci-dessous, périmé par ce qui précède.)*

Les retirer coûte **20 lignes sur 5 fichiers, dont 2 partagées avec de vrais outils**, et crée des **pages orphelines de façon certaine**. Or « Coming Soon » + `noindex` + absents du sitemap, **c'est honnête**.

**📌 22/09 — chiffré et recommandé, DÉCISION AU PROPRIÉTAIRE** (`RAPPORT-outils-mis-en-avant.md` §5). Constat nouveau : les pages catégorie PDF et IA listent les 3 stubs **comme des outils normaux** (« Convert PDF tables to Excel ») — la carte promet ce que la page n'a pas. Le marché (iLovePDF, Smallpdf, Adobe) ne publie pas de page d'outil vide. **Recommandation :** ① **construire `pdf-to-excel` (4-6 h) puis `pdf-to-ppt` (3-4 h)** sur ConvertAPI (`pdf/to/xlsx` et `pdf/to/pptx` existent, OCR inclus), même tuyau que `pdf-to-word`, 0,01 $/conversion ; ② **retirer `image-generator` des listes ou le supprimer** : 0,011-0,167 $/image, 500 images moyennes ≈ 21 $ épuisent seules le plafond global de 20 $, et `gpt-image-1` est annoncé retiré le 23/10/2026 ; ③ en attendant, un badge « Coming soon » sur les 3 cartes (≈ 15 min). Rien n'a été fait.

## 8 — Fréquence de la surveillance *(après le lancement)*

Vercel **Hobby** = **une tâche planifiée par jour**. **Sans trafic, ça ne sert à rien.**

## 9 — 🔴 Safari **à moitié testé** : macOS mesuré, iPhone à faire par le propriétaire *(bloquant de lancement)*

**C'est le dernier bloquant technique avant le lancement.** Firefox et Chrome confirmés. Safari = l'essentiel du trafic iPhone et Mac. Casse typiquement : Web Workers, téléchargements, WASM, `OffscreenCanvas`. **Nécessite un iPhone ou un Mac.**

**✅ Feuille opérationnelle prête (19 septembre 2026) : `tests-safari-proprietaire.md`**, comme le bloquant 11 a la sienne. 20 outils classés par risque lu dans le code, fichiers d'essai fournis (`docs/audit/fixtures-safari/`), séances iPhone puis MacBook, **~2 h**, la moitié la plus risquée en premier (séances A puis C, ~1 h). **Le propriétaire a un iPhone et un MacBook réels : aucun service de test, aucun compte à ouvrir.** **Le bloquant reste OUVERT tant que la feuille n'est pas remplie** ; **les verdicts remontent ici**, et chaque ÉCHOUÉ devient un défaut chiffré dans ce bloquant, jamais dans « CLOS » sans retest sur le vrai Safari.

**📌 DÉCISION du 19 septembre — exception assumée à l'interdit n° 8 :** les deux outils payants de la feuille Safari (**Background Remover** et **Grammar Fixer**) sont testés **en PRODUCTION, une fois chacun, coût mesuré ~0,003 $**. La règle n° 8 vise la dépense non maîtrisée ; ici la dépense est bornée et connue, et c'est **la production** qu'il faut prouver sur Safari, pas une préversion protégée par une connexion. Ne vaut que pour ces deux tests, une fois chacun.

**📌 MESURÉ le 19 septembre — vrai Safari 17.6 / macOS 14.8.9 (safaridriver) : 5 outils sur 20 échouent, causes WebKit, donc valables sur iPhone.** Chaque défaut entre dans le bloquant avec sa gravité (détail, balayage fichier:ligne et chiffrage : `docs/audit/RAPPORT-safari-defauts.md`) :

| # | Défaut | Gravité | État |
|---|---|---|---|
| S2 | `voice-recorder` : MP4 étiqueté `audio/webm`, sans erreur | **HAUTE — mensonge** | 🟡 corrigé et **déployé en production** (fusion `safari-defauts`, déploiement `9e46af54`, 19/09), **retest Safari réel requis** |
| S3 | `image-converter` (+ `jpg-to-webp`, `png-to-webp`) : PNG livré sous nom `.webp`, 86 % plus lourd, sans avertissement | **HAUTE — mensonge** | 🟡 corrigé et déployé en production (`9e46af54`), retest Safari réel requis |
| S4 | `image-upscaler` ×8 : canvas 32000×24000, fichier vide, interface « réussie » (URL réelle `/tools/ai-tools/image-upscaler`) | **HAUTE — mensonge** | 🟡 corrigé et déployé en production (`9e46af54`), retest Safari réel requis |
| S1 | `video-compressor` / `video-converter` / `video-trimmer` : `captureStream()` absent de `<video>`, MediaRecorder sans WebM | Moyenne — panne franche | 🟡 `video-trimmer` **refait sur ffmpeg.wasm** (retest Safari requis) ; compressor et converter : **service ffmpeg déployé et prouvé en production le 20/09 (bloquant 6)** — retest Safari réel requis |
| S5 | `mp4-to-gif` refuse les `.mov` (donc toute vidéo iPhone) | Moyenne — refus franc | 🟡 `accept` élargi, déployé (`9e46af54`), retest Safari réel requis |

Le balayage a trouvé **9 `MediaRecorder` sans `isTypeSupported`** (pas 5) : `video-merger/filter/rotator/resizer` et `screen-recorder` s'ajoutent, non testés sous Safari. La classe « succès annoncé sans vérifier la sortie » est traitée site-wide via `app/lib/mediaSupport.js` (tests : `scripts/media-support-tests/`). **Le bloquant 9 reste OUVERT** : ces correctifs ne sont prouvés que contre des faux, pas sur un Safari réel.

**📌 22/09 — point à surveiller lors de la passe Safari réel :** une erreur WebKit non identifiée (`TypeError: undefined is not an object (evaluating 'navigator.storage.persisted')`) est apparue une fois pendant un essai `image-captioner` par ailleurs réussi (WebKit de Playwright). Recherchée dans le code du projet : aucune trace de `storage.persisted` nulle part — ne vient pas de ce projet. Non reproduite au rechargement. **Si elle apparaît sur un vrai Safari lors de la passe du propriétaire, l'identifier plus précisément avant de la classer bénigne.**

**📌 20 septembre — suite (détail : `docs/audit/RAPPORT-formats-navigateurs.md`).** Production vérifiée (déploiement `9e46af54` READY, `.mov` accepté). **AVIF — mensonge découvert le 20/09, puis option RÉTABLIE honnêtement.** Mesuré : Chrome 153, Chromium 151 et Firefox 153 rendaient **du PNG** quand `image-converter` leur demandait de l'AVIF (3 API sur 3) : l'option trompait TOUS les visiteurs depuis toujours, pas seulement Safari. Elle avait d'abord été désactivée (textes réécrits), puis a été **RÉTABLIE le 20/09** parce que le marché l'offre (Squoosh, TinyPNG, CloudConvert, Convertio, iLoveIMG) et que la règle de couverture impose de l'offrir aussi — **cette fois avec un vrai encodeur WebAssembly** (`@jsquash/avif` 2.1.1, Apache-2.0, 1,1 Mo sur le réseau, dans le navigateur : l'image ne quitte pas l'appareil). **Prouvé en production (20/09, `e2e-avif.mjs`) :** un PNG de 2 602 Ko donne un AVIF de 187 Ko (boîte `ftypavif`), décodé par Chromium (3,0 s) et par Firefox (11,2 s : **Firefox est ≈ 6× plus lent que Chromium**) ; sur un autre PNG, 4,8 Mo → 0,46 Mo. **Non prouvé : le WebKit de Playwright n'a pas `OffscreenCanvas`** (`image-converter` n'y tourne pour aucun format), donc l'AVIF y est **non testable et reste à vérifier sur un vrai Safari** (bloquant 9). WebP : OK sous Chrome et Firefox, PNG sous Safari (S3). Reste de la classe traité : 5 outils GIF (plus d'`alert()`, plus de GIF d'images vides), `video-to-gif`, `pdf-sign` (**signait avec un cadre vide et ne pouvait pas se tracer au doigt sur iPhone**), `pdf-editor`, `audio-waveform`, QR, codes-barres. **`video-trimmer` passé sur ffmpeg.wasm (stream copy)** : coupe en 0,2-0,9 s pour 30 s comme pour 2 min (ancien moteur : 1× le temps réel), moteur ~10 Mo sur le réseau (32 Mo décompressé), **la coupe s'aligne sur l'image-clé (+2 à +3 s mesurés) et la page le dit**. **Non prouvé : iPhone/Safari, plafond mobile 100 Mo (choix prudent).** **DÉCISION vidéo (révisée le 20/09 par la règle qui prime) : trimmer fait dans le navigateur ; `video-compressor` et `video-converter` sont passés sur le service ffmpeg (bloquant 6, **déployé et prouvé en production le 20/09**) — « honnête mais en panne sous Safari » n'est plus acceptable.** Le build local passe (variables IP documentées dans `REFERENCE-projet.md`).

**Suspects lus dans le code (état initial, avant les mesures ; RÉSOLUS le 19-20/09 : ① confirmé → S1, ② → S2, ③ → S3, ④ → S4 pour `image-upscaler` (`background-remover` non confirmé, non testé), ⑤ corrigé avec délai de garde) — conservés pour mémoire, à ne pas lire comme des hypothèses ouvertes :** ① `video-compressor`, `video-converter`, `video-trimmer` appellent `captureStream()` + `MediaRecorder` en `video/webm` **sans détection de support** ; ② `voice-recorder` étiquette `audio/webm` un enregistrement que Safari produit en MP4 ; ③ `image-converter` : WebP par défaut via `OffscreenCanvas.convertToBlob` (Safari peut renvoyer du PNG) ; ④ `image-upscaler` (jusqu'à ×8) et `background-remover` (recomposition pleine résolution) dépassent probablement la limite de canvas de Safari iOS ; ⑤ `video-to-gif` attend `seeked` **sans délai de garde** (contrairement à `mp4-to-gif`).

## 10 — ✅ CLOS — Bug de débordement de la navbar

8 largeurs de 1024 à 1536 px, barre + 3 enfants directs : **0 px partout**.

## 11 — Les tests manuels du propriétaire

**Feuille opérationnelle : `tests-manuels-proprietaire.md`.** Sept tests, 1 h 15 à 1 h 45.
**Restent hors de la feuille — les contrôles de la « vague 1 » de l'audit de couverture (`docs/audit/2026-09-06-couverture-formats.md`), à faire par le propriétaire.** *Note d'honnêteté : les messages des commits `50527805` et `b77f988b` ne contiennent pas de liste intitulée « contrôles » ; la liste ci-dessous est reconstituée à partir de ce que ces commits (et ceux qui ont clos leurs renvois) ont réellement modifié.* Le commit `50527805` (« stop 3 tools from misleading visitors ») cite **cinq outils** ; deux d'entre eux ont vu leur texte reporté à la vague 3, faite depuis :
1. **`image-converter` — TIFF** : la page dit que le TIFF n'est pas pris en charge ici et renvoie vers `tiff-to-jpg` / `tiff-to-png` (commit `50527805`). *À vérifier :* le texte de la FAQ et de l'interface, puis un vrai `.tif` sur `tiff-to-jpg`. *(Depuis, `990b99a3` a branché un décodeur TIFF réel dans `image-converter` : contrôler que le texte actuel est cohérent avec cela.)*
2. **`audio-trimmer` — extension** : le fichier téléchargé porte l'extension et le type MIME **du fichier d'origine** (avant : toujours `.mp3`). *À vérifier :* couper un `.wav` → le résultat s'appelle `.wav` et se lit ; couper un `.mp3` → `.mp3`.
3. **`audio-transcriber` — plafond** : la FAQ annonçait 25 Mo, le plafond appliqué était 10 Mo (`50527805`) ; il est aujourd'hui de 4 Mo (plafond de plateforme, D10). *À vérifier :* la page annonce 4 Mo avant la sélection et refuse un fichier de 5 Mo sans l'envoyer.
4. **`word-to-pdf` — `.doc`** (texte reporté, fait dans `eaddc44e`) : `.doc` accepté. *À vérifier :* un vrai `.doc` binaire → PDF, et que la FAQ ne prétend plus « même moteur LibreOffice » pour le `.docx`.
5. **`tar-extractor` — `.tar.gz`/`.tgz`** (texte reporté, fait dans `990b99a3`). *À vérifier :* une archive `.tar.gz` réelle s'extrait.
Et les deux outils de données : **`xml-to-json`** (`b77f988b`, guillemets échappés invalides dans l'attribut JSX `description` : la page doit se charger sans erreur et convertir un XML avec attribut `id="5"` en clé `@_id`) ; **`excel-to-json`** (`adf0f1c5` : les noms de feuilles s'affichent dès la lecture du classeur, avant l'export ; un classeur à plusieurs feuilles donne un JSON indexé par nom de feuille — l'affirmation de l'audit « seule la première feuille est convertie » était fausse pour cet outil).

---

# 🟢 ADMINISTRATIF — sans condition

- **✅ Poids réel d'un déploiement — cause trouvée et corrigée le 22/09** (`RAPPORT-poids-deploiement.md`). Le mauvais diagnostic de la veille (« réduire le nombre de déploiements ») a été remplacé : la vraie cause était le **poids unitaire**, pas le nombre. Un vrai `next build` local a montré que les cartes de source serveur (`.js.map`) pesaient **64,2 Mo sur 141 Mo de `.next/server` (45 %)** — jamais servies à un visiteur. Réglage d'une ligne trouvé dans la doc Next.js embarquée (`experimental.serverSourceMaps: false`, distinct de `productionBrowserSourceMaps` qui vise le navigateur) : `.next` passe de **157 Mo à 89 Mo (-43 %)**, `.next/server` de 141 à 73 Mo. **Déployé (commit `3b201855`, `dpl_2x83tYtnNQ2N8Cmq6UPDCPHXo1st`), revérifié servir exactement les mêmes pages avant et après** (accueil, une page outil, une page catégorie, une redirection legacy). Marge de retour arrière ensuite réduite de 5 à 3 déploiements (production toujours vérifiée intacte). **Le pourcentage du tableau de bord Vercel (7,79 Go / 10 Go = 77,9 %) n'a pas bougé après ces deux actions, revérifié deux fois en direct** — probablement un chiffre agrégé à cadence quotidienne plutôt qu'en temps réel (non prouvé avec certitude). **Projection si le tableau de bord finit par refléter les 3 déploiements actuels : ≈ 267 Mo, environ 2,7 % du palier — à confirmer par une nouvelle lecture d'ici 1 à 2 jours, le chiffre officiel reste 77,9 % jusque-là.**
- **✅ Search Console — les 7 pages « de notre faute », URL relevées et diagnostiquées le 22/09 par Claude in Chrome (Indexation → Pages → chaque catégorie).** Aucune des 7 n'est cassée aujourd'hui ; détail par catégorie :
  - **3 « Introuvable (404) »** — `onlineconvertools.com/tools/yaml-to-json`, `/tools/epub-to-pdf`, `/tools/file-encryptor` (domaine nu, anciens chemins plats, derniers crawls 12-25 juillet 2026). **C'était une vraie panne à l'époque** : la table `lib/legacyRedirects.ts` qui les corrige a été créée le **31/08/2026**, après ces crawls. **Déjà corrigé, rien à faire côté code** — vérifié en direct : 200 en 2 sauts (apex→www puis ancien chemin→chemin catégorisé).
  - **3 « Page avec redirection »** — les 3 variantes non canoniques de la page d'accueil : `http://www.onlineconvertools.com/`, `http://onlineconvertools.com/`, `https://onlineconvertools.com/`, toutes → `https://www.onlineconvertools.com/`. **Comportement voulu** (canonicalisation standard de domaine/protocole) : Google signale exactement ce qu'on veut qu'il fasse — n'indexer que la version canonique. **Pas un défaut, rien à corriger.**
  - **1 « Erreur liée aux redirections »** — `https://www.onlineconvertools.com/tools/media-tools` (détectée 15/09, dernier crawl 12/09/2026). Vérifiée en direct : redirection légitime et fonctionnelle vers `/tools/video-tools` (`lib/legacyRedirects.ts` ligne 229), **un seul saut, 200 à l'arrivée, destination non bloquée par `robots.txt`**. **Aucune anomalie reproduite aujourd'hui** — cause la plus probable : un aléa transitoire au moment précis du passage de Googlebot (ex. décrochage/froid de fonction Vercel), pas un défaut permanent. Rien à corriger côté code faute de défaut reproductible.
  **Aucune URL saine retirée du sitemap ni passée en `noindex`.** **✅ 22/09 : validation demandée pour les 3 « 404 » uniquement** (accord explicite reçu) — Search Console répond « État de la validation : commencé, début 22/09/2026 ». **Aucune validation demandée pour les 3 « Page avec redirection » ni pour l'« Erreur liée aux redirections »**, comme convenu (rien à valider pour les premières, anomalie non reproduite pour la dernière).
- ✅ ~~Inscrire le service de détourage dans `REFERENCE-projet.md`~~ — fait le 19 septembre (service détourage, références croisées des deux Gotenberg, quotas lus).
- **✅ CLOS le 22/09 — indépendance de `gotenberg-v2` prouvée à 6 outils sur 6 ; `gotenberg-fonts` gardé, veille Serverless activée** (`RAPPORT-gotenberg-independance.md`). Les 8 variables encore référencées de `gotenberg-v2` (le 9ᵉ, `API_TIMEOUT`, était déjà propre depuis le passage à 240 s le même jour) ont été copiées en valeurs propres sans jamais être lues ni affichées (copie serveur à serveur via l'API GraphQL, seule la longueur en caractères a été journalisée) ; `gotenberg-v2` a été redéployé et vérifié en production avec de vrais fichiers sur les **6 outils** qui en dépendent : `excel-to-pdf`, `ppt-to-pdf`, `html-to-pdf`, `epub-to-pdf`, `mobi-to-pdf` — **et `word-to-pdf` sur son repli `.doc`**, prouvé avec un vrai `.doc` binaire fabriqué via LibreOffice installé localement (`soffice --convert-to doc:"MS Word 97"`, PASS en 1,3 s en production). **Tous les 6 passent.**
  **Décision du propriétaire, 22/09 : ne pas supprimer `gotenberg-fonts` maintenant.** Il tournait 24 h/24 sans une seule requête depuis 3 jours (coût réel mesuré ≈ 0,7-5,7 $/mois) : **la veille Serverless a été activée à sa place** (même mécanisme que le détourage), récupérant le coût immédiatement avec un retour arrière en un clic. **Vérifié par lecture directe du réglage** : `sleepApplication` lu `false` avant, mutation appliquée, relu `true` après. `gotenberg-v2` non touché (toujours actif sans veille, comme il se doit en production) et **revérifié servir la production normalement juste après** (le test `word-to-pdf`/`.doc` ci-dessus). **La suppression de `gotenberg-fonts` est reportée après le lancement**, une fois prouvé sur plusieurs semaines qu'il n'a servi à rien — voir le déclencheur correspondant plus bas.
- *(Historique, périmé par ce qui précède)* Deux services Railway font tourner la **même image au même digest** : `gotenberg-fonts` (historique) et `gotenberg-v2` (production depuis le 18 septembre). ⚠️ **NON VÉRIFIÉ — ne pas lire comme un fait établi (19 septembre 2026).** Que les variables de `gotenberg-v2` soient des références croisées vers `gotenberg-fonts` **est une hypothèse, pas un constat** : deux sources écrites l'affirment (ce plan, et `RAPPORT-gotenberg-versionne.md` ligne 138 — qui dit avoir ajouté les 9 variables par `${{gotenberg-fonts.NOM_VAR}}` **sans jamais lire leurs valeurs**), une source l'infirme (`RAPPORT-fidelite-office.md` ligne 23 : « aucune référence croisée », lecture d'API où une référence peut apparaître comme une valeur). **Aucune n'a été vérifiée contre l'état réel de Railway** ; cette ligne avait été recopiée de document en document. **Tentative du 19 septembre : impossible** — la CLI Railway n'est **pas installée** sur ce poste (absente du PATH et des emplacements usuels ; seul le dossier de configuration `~/.railway` subsiste), donc pas de lecture possible sans clic dans le tableau de bord, interdit. **⚠️ PÉRIMÉ le 20/09 :** la CLI s'utilise **sans installation** (`npx --yes @railway/cli`), l'authentification du 18/09 est valide et l'API GraphQL répond avec le jeton local — la lecture est donc **possible** (les réglages d'un service se lisent sans jamais toucher aux valeurs de variables). Elle reste **reportée après le lancement** (décision du 19/09) ; le filtre « noms seulement » reste obligatoire ; l'installation globale `npm i -g` évoquée plus bas est remplacée par `npx`. **Règle en attendant : traiter la dépendance comme réelle** (le coût d'une erreur est asymétrique : supprimer à tort tue la production Office → PDF). **Pour trancher :** installer la CLI (`npm i -g @railway/cli`, aval du propriétaire), puis lire les variables de `gotenberg-v2` **par un petit script qui n'imprime que le NOM et un booléen « la valeur commence par `${{` »** — ⚠️ la CLI, elle, imprime les valeurs : ne jamais lancer `railway variables` sans ce filtre, sa sortie contient des secrets. Résoudre les références en valeurs propres AVANT toute suppression. **Décision : le garder comme retour arrière tant que les correctifs de polices ne sont pas stabilisés en production.**
- **📌 DÉCISION du 19 septembre : la vérification des références croisées Gotenberg est REPORTÉE APRÈS LE LANCEMENT.** Elle ne sert qu'à décider de supprimer un service à ~2 $/mois qu'on a décidé de garder ; aucun risque ne pèse sur le lancement. Quand elle se fera : `npx @railway/cli` (sans installation — remplace l'installation globale évoquée ci-dessus), et **jamais sans un filtre qui n'affiche que les noms** (et un booléen « commence par `${{` ») — la CLI imprime les valeurs. En attendant, la dépendance reste traitée comme réelle et rien n'est supprimé.
- **Replis silencieux de `lib/quota/config.js` — 2 corrigés le 19 septembre, 8 restent (état réel lu, noms seulement).** `IP_RATE_LIMIT_PER_HOUR` / `_PER_DAY` : le code retombait sur 10/h et 30/jour (production : 30/h et 100/jour) ; **désormais une variable absente ou invalide fait échouer le build/démarrage** (`lib/quota/requiredEnv.js`, test `scripts/quota-tests/16-required-env.js`). **Les 8 autres constantes gardent leur repli.** État réel en production (`vercel env ls`, filtré sur les noms) : **présentes** `GLOBAL_SPEND_CAP_USD`, `USER_QUOTA_PDF_CONVERSIONS`, `USER_QUOTA_IMAGES`, `IP_RATE_LIMIT_PER_HOUR`, `IP_RATE_LIMIT_PER_DAY` (Production + Preview, **jamais Development**) ; **ABSENTES, donc tournant sur leur repli en production** : `TOOL_ERROR_RATE_LIMIT_PER_HOUR` (20), `TOOL_ERROR_RATE_LIMIT_PER_DAY` (100), `TOOL_ERROR_ALERT_THRESHOLD_PER_DAY` (10), `CONTACT_RATE_LIMIT_PER_HOUR` (5), `CONTACT_RATE_LIMIT_PER_DAY` (15). Ces 5 replis sont les valeurs voulues (justifiées dans les commentaires du fichier) : l'écart est de forme, pas de valeur. **Ordre obligatoire pour la suite (« B ») : créer les 5 variables dans Vercel D'ABORD, puis retirer les replis** — l'inverse casse le build. Détail et chiffrage : `RAPPORT-replis-quota.md`.
- **Envisager la veille Serverless de `pdf-tools`** : le service est actif 24 h/24 alors que ses outils sont « Coming Soon » (même mécanisme que le détourage).
- **Supprimer à la main** `Downloads\fidelite-01..06.pdf` (verrouillés par Chrome) — **toujours présents le 20/09**.
- **Supprimer la variable `REMOVEBG_API_KEY`** de Vercel : plus aucun code ne l'utilise.
- **Supprimer le sitemap en double dans Search Console** — garder **uniquement celui en `www`**.
- **Vérifier l'adresse de facturation des cinq fournisseurs** (Anthropic, Google Workspace, Railway, Cloudflare, OpenAI).
- ✅ **DPA ConvertAPI — N'EST PLUS UN BLOQUANT DE LANCEMENT (corrigé le 22/09).** Le document légal officiel de ConvertAPI, lu directement (`https://www.convertapi.com/compliance/dpa.pdf`, « Privacy Policy and Data Processing Terms », 7 février 2025 — pas un résumé de seconde main), dit noir sur blanc que ses conditions **s'appliquent déjà, automatiquement, sans signature** : la protection RGPD est donc déjà en place aujourd'hui. `help.convertapi.com` reste injoignable depuis ce poste, mais `convertapi.com` répond. Un DPA individuel signé reste utile (traçabilité contractuelle formelle) mais n'a plus d'urgence de lancement. **Contact officiel confirmé dans le document lui-même : privacy@convertapi.com** (DPO ConvertAPI, UAB, Vilnius, Lituanie). **Courriel prêt à envoyer rédigé dans `RAPPORT-gotenberg-independance.md` §5** (à adapter avec le nom exact de l'entité cliente et l'email du compte avant envoi). **Étapes quand tu voudras le faire (~15 min) :** ① se connecter au tableau de bord ConvertAPI, vérifier le palier tarifaire (Startup/49 $ et au-dessus inclut « Signed NDA & DPA », non vérifié pour ce compte) ; ② chercher une section « Contracts »/« Legal » dans le tableau de bord (signalée par une source indirecte, à confirmer à l'écran) ; ③ à défaut, envoyer le courriel préparé à **privacy@convertapi.com** ; ④ conserver la copie signée ; ⑤ noter la date ici.
- **Centraliser les notifications fournisseurs** vers `contact@onlineconvertools.com`.
- ✅ ~~`PROJET.md` obsolète et trompeur~~ — **supprimé le 23/09 sur décision du propriétaire.** L'inventaire réel est au bloquant 5 (le chiffre affiché est gardé par le build).
- **Supprimer** `.claude\worktrees\quota-spend-infra` — **le dossier existe encore ; la branche `worktree-quota-spend-infra` n'existe plus** (vérifié le 20/09).
- ✅ ~~Supprimer ou ignorer `_scratch_test_signup.mjs`~~ — **absent de la racine du dépôt** (vérifié le 20/09).
- **Ajouter sur l'écran post-inscription** : « et marquez-le comme non indésirable ».
- **Envoyer le rapport de bug Claude Code** (14 sous-agents dupliqués — et, le 19 septembre, un **agent de fond qui a modifié trois pages d'outils sans autorisation**, puis émis un message « stop editing files » adressé à l'agent principal).

---

# ⏳ EN ATTENTE D'UN DÉCLENCHEUR

## Déclenchés par le calendrier

| Quand | Quoi |
|---|---|
| ✅ **Déclenché le 22/09 — le rapport Indexation a dépassé le 03/09, relevé au 17/09/2026** | **45 pages indexées sur 248, 203 non indexées.** Répartition des 203 : **192 « Détectée, actuellement non indexée »** — autorité de domaine, ne se corrige pas par du code, cohérent avec la position moyenne 74,7 déjà documentée ; **7 imputables au site, toutes relevées et diagnostiquées le 22/09 via Claude in Chrome** (voir ADMINISTRATIF) — aucune n'est cassée aujourd'hui : les 3 « 404 » étaient de vraies pannes avant le 31/08 (corrigées depuis par `lib/legacyRedirects.ts`), les 3 « Page avec redirection » sont des variantes non canoniques de l'accueil (comportement voulu), la 1 « Erreur liée aux redirections » (`/tools/media-tools`) fonctionne aujourd'hui en un seul saut propre (aléa de crawl probable, non reproduit). Aucune URL saine retirée du sitemap ni passée en `noindex`. |
| ✅ **Relu le 25 septembre** | Pourcentage de stockage Vercel — attendu ~2,7 % si l'hypothèse du recalcul quotidien est juste, 77,9 % sinon. **Lu le 25/09/2026 (Usage, 30 derniers jours, 26 août-25 sept.) : « Deployment Storage » 1,83 Go / 10 Go = 18,3 %** (et « Functions Storage » 1,52 Go, affiché à part). **Ni l'un ni l'autre** : le chiffre a bien baissé (77,9 → 18,3 %), donc il n'était pas figé et l'allègement du 22/09 a porté ; mais pas jusqu'aux ~2,7 % projetés, qui supposaient 3 déploiements seulement — des déploiements se sont ajoutés depuis (préversions et production des 23-25/09). Aucune action prise, conformément à la consigne. |
| **Le 27 de chaque mois** | Renouvellement Anthropic Pro — CA$ 32,19 |
| **6 juin 2027** | Renouvellement du domaine chez Cloudflare Registrar — US$ 10,98/an. **Si le domaine tombe, tout tombe.** |

## Déclenchés par le lancement

| Quand | Quoi |
|---|---|
| **Plusieurs jours AVANT** | Remonter Railway de **1 à 3 réplicas** sur **Gotenberg**, puis **retester les cinq outils**. ⚠️ Laisser le conteneur se stabiliser. |
| **Juste AVANT, en dernier** | Refaire la **galerie Product Hunt** (capture du 17 août). **Seule source de domaines référents prévue. Sa valeur est le lien, pas le trafic.** |
| **Juste APRÈS** | **Décider de la direction : référencement de niche ou B2B**, sur les données d'usage réel |
| **Juste APRÈS** | **Vérifier les références croisées Gotenberg** (`npx @railway/cli`, filtre noms seulement) · **Corriger les 8 replis restants (« B »)** : créer d'abord les 5 variables absentes dans Vercel |
| **Juste APRÈS** | **Vague 5 de l'audit** · **les deux réserves du réviseur** (IP falsifiable, compensation non atomique) · **purge de `tool_errors`** au-delà de 90 jours |
| **AVANT (décision du 20/09)** | ~~D8~~ ✅ fait le 21/09 (voir 2 bis) · 🔴 **signer le DPA ConvertAPI — RENDU PLUS URGENT le 22/09** : les `.docx` et les PDF jusqu'à 100 Mo transitent maintenant par ConvertAPI (avant D8 : plafonné à 25 Mo puis 4,5 Mo, exposition beaucoup plus faible) · **trancher la saturation (dimensionnement du service ffmpeg et de Gotenberg) avant Product Hunt** · ~~décider `API_TIMEOUT` de Gotenberg~~ ✅ fait le 22/09 (240 s) · **décider du sort de `gotenberg-fonts`** (voir 2 bis, coût réel + recommandation) |

## Déclenchés par le trafic

| Quand | Quoi |
|---|---|
| **20 à 50 visiteurs/jour réels** | Demander **AdSense**. Pas avant. |
| **Le jour de la demande AdSense** | **Relire trois contrats** : ① Vercel **Hobby → Pro** (Hobby = usage **non commercial**) ② **Adobe PDF Services** palier gratuit ③ **OpenAI** |
| **Quand le volume d'erreurs devient lisible** | Décider de construire la **page d'administration des erreurs** |
| **Si PDF→Excel / PPT dépasse 500 transactions/mois** | Contacter le **commercial Adobe**. **Repli : ConvertAPI**, ~0,004 à 0,01 $/conversion. |
| ~~Si les refus à ≈ 4,5 Mo apparaissent dans `tool_errors`~~ | ✅ D8 fait le 21/09. **Nouveau déclencheur :** si des refus à 15 Mo (Excel) ou 100 Mo (Word/PowerPoint) apparaissent dans `tool_errors`, relever `API_TIMEOUT` puis la mémoire de la fonction (plan Vercel supérieur). |
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
| **Après plusieurs semaines post-lancement, si `gotenberg-fonts` ne s'est jamais réveillé** | **Trancher sa suppression** (veille Serverless activée le 22/09, `RAPPORT-gotenberg-independance.md`). `gotenberg-v2` est déjà indépendant (8 variables copiées en valeurs propres, prouvé à 6 outils sur 6) : la suppression est sans risque technique le jour venu, il ne manque qu'assez de recul pour confirmer qu'il ne sert vraiment à rien. |

---

# ⚠️ FRAGILITÉS CONNUES, ASSUMÉES

- **Zéro domaine référent.** Le concurrent en a 7 600. **C'est la cause première du classement en page 8, et ce que l'urgence ne peut pas accélérer.**
- **Le plafond de charge utile des fonctions Vercel est de ≈ 4,5 Mo.** **Mesuré le 19 septembre sur les routes Office (refus entre 4 412 819 et 4 517 676 octets), frontière affinée le 20/09 : 4 493 821 octets acceptés, 4 493 924 refusés.** Ces routes envoient du **multipart brut**. En revanche, tout outil qui encode en **base64** touche le mur dès **3,3 Mo de fichier réel** (inflation ×1,33) — c'est ce qui est arrivé deux fois. **Tout nouvel outil qui fait transiter un fichier par Vercel doit être conçu en le sachant.** ✅ **Mise à jour 21/09 :** ce plafond ne vaut plus que pour les requêtes DIRECTES (≤ 4 Mio) ; les six routes de documents passent au-dessus par l'envoi par morceaux (lib/media/staged.js). Le **plafond de réponse n'est PAS de 4,5 Mo** (un PDF de 10 Mo est renvoyé sans erreur, mesuré). **Nouveau plafond réel des documents : la mémoire de la fonction Vercel (~150-200 Mo).**
- **`RESEND_API_KEY` et `GOTENBERG_PASSWORD` sont signalées par l'API Vercel comme lisibles.** À basculer en variables sensibles si le plan le permet ; ne jamais les afficher entre-temps.
- **Un déploiement Railway qui plante ne fait pas tomber le service** — l'ancienne version reste servie, sans alerte.
- **Deux services Railway servent la même image Gotenberg**, **possiblement** liés par des références croisées de variables (**non vérifié**, voir ADMINISTRATIF).
- **Dépendance à des fournisseurs tiers qui peuvent disparaître.** Les mêmes questions valent pour **ConvertAPI, Adobe PDF Services et OpenAI**.
- **La navbar est à budget de largeur ZÉRO.**
- **Aucun repli sur les API d'IA** — une clé expirée fait tomber **15 outils**
- **Le câblage `try/catch` des quatre `route.ts` de quota n'est couvert que par revue manuelle**
- **Trafic réel : zéro**
- **Les agents de fond de Claude Code ont modifié des fichiers de production sans autorisation** (19 septembre). **Interdire la délégation à un agent de fond sur tout chantier qui touche au contenu du site.**
- **Claude Code a violé trois fois la consigne « aucune boucle de surveillance ni réveil planifié »** (deux fois auto-signalé et annulé ; **troisième fois le 22 septembre 2026, signalé par le propriétaire — « 11 monitors still running »**). **Cause exacte** : dans le chantier « plafonds-mesures », l'agent a utilisé l'outil `Monitor` (boucle `until <condition>; do sleep N; done`) comme substitut à l'attente directe — interdite par le harnais (`sleep` de premier plan bloqué, message d'erreur suggérant explicitement `Monitor` à la place) — pour des constructions Vercel, des déploiements, des scripts de test de bout en bout longs (150-400 s) et un changement d'heure UTC. Au lieu d'un seul appel `Monitor` par attente réelle, l'agent en a rappelé environ 84 au fil de la session, y compris en relançant une nouvelle surveillance après avoir déjà reçu la notification de fin de la précédente sur la même condition — recréant une boucle de sondage par un autre outil que `sleep`, exactement l'anti-patron que l'interdit vise. **Arrêt le 22/09** : `TaskStop` appelé sur les 84 identifiants de tâche `Monitor` retrouvés dans la session ; **les 84 ont répondu « No task found »**, donc aucune n'existait plus côté serveur au moment de l'arrêt — mais aucun outil ne permet à l'agent de lister l'état réel côté interface pour le confirmer lui-même ; **à vérifier par le propriétaire que le compteur affiché est retombé à zéro.** **Correction retenue pour la suite : un seul `Monitor` par attente réelle, jamais de nouvel appel après une notification déjà reçue pour la même condition, et préférer `run_in_background: true` sur `Bash` (notification automatique à la fin, sans sondage) chaque fois que c'est possible.**
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

---

# ✅ CLOS — avec preuve

| Chantier | Preuve |
|---|---|
| **Outils mis en avant : 10 résultats faux silencieux (22/09)** | 36 outils ouverts avec de vrais fichiers en production ; 10 corrigés (`30235fe7`, `8b5d5645`, `609ba261`, `46306611`, `bf533569`), tests unitaires sur les entrées fautives, `verify-fixes.mjs` 16/16 sur préversion puis 16/16 en production (`dpl_BXrZoKXq`, 22/09). Écarts de qualité/couverture : chiffrés, en attente (bloquant 5). |
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
> ⑩ **Le plafond qu'on annonce doit être celui qu'on tient.** 25 Mo annoncés, ≈ 4,5 Mo réels, et un message d'erreur qui ne dit rien.
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
| 6 | **MediaRecorder** | Navigateur | 6 en service (`voice-recorder`, `screen-recorder`, `video-filter`, `video-merger`, `video-resizer`, `video-rotator`) + 2 en repli d'interrupteur (`video-compressor`, `video-converter`, passés sur le service ffmpeg le 20/09) — relevé dans le code le 20/09 |
| 7 | ffmpeg.wasm | Navigateur | 10 (dont `video-trimmer`, ajouté le 19-20/09 ; relevé dans le code le 20/09) |
| 8 | gifenc | Navigateur | 7 |
| 9 | Web Audio → WAV | Navigateur | 2 |
| 10-12 | OpenAI (texte, vision, Whisper) | Serveur | 16 |
| **13** | **IS-Net general-use (ONNX) — service Railway auto-hébergé** | **Serveur** | **1 — remplace remove.bg** |
| 14 | heic2any | Navigateur | 2 |
| 15 | Tesseract.js | Navigateur | 1 |
| **16** | **ffmpeg natif — service Railway `media-processing`** | **Serveur** | **2** (`video-compressor`, `video-converter`) — depuis le 20/09. **Sert aussi de stockage d'envoi pour 11 outils de documents et d'audio depuis le 21/09 (type de job `stage`)** |
| **17** | **`@jsquash/avif` (encodeur WebAssembly)** | **Navigateur** | **1** (`image-converter`, sortie AVIF) — depuis le 20/09 |
| **18** | **pikepdf + `tx` d'Adobe (AFDKO) — service `pdf-tools`** | **Serveur** | **1** (`pdf-compress`, jusqu'à 200 Mo) — depuis le 23/09. Ghostscript **écarté par la mesure** : sa réécriture perd une figure vectorielle |
| **19** | **MozJPEG / OxiPNG / libwebp (`@jsquash`) + quantifieur de Wu (`image-q`)** | **Navigateur** | **1** (`image-compressor`) — depuis le 23/09 |
| **20** | **MoSR 4xNomos2_hq (ONNX) — service d'images Railway** | **Serveur** | **1** (`image-upscaler`, x2/x4, ≤ 1 Mpx) — depuis le 23/09 |
| **21** | **gpt-image-2 (OpenAI)** | **Serveur** | **1** (`image-generator`) — depuis le 23/09, budget propre 5 $/mois |
| 4 bis | ConvertAPI | Serveur | passe de 2 à **4** outils (`pdf-to-excel`, `pdf-to-ppt` le 23/09) |
| 16 bis | ffmpeg natif `media-processing` | Serveur | + **5 outils GIF** (options début/durée/largeur/i/s) et l'Opus d'`audio-converter` (libopus) — 23/09 |

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
| **Online2PDF** — **plafond annoncé 150 Mo** | ~33× notre plafond réel de ≈ 4,5 Mo. |
| **Adobe `pdf-to-word`** — 385 000 visites/mois | **Une seule page** peut porter un site entier. |
| **Omni Calculator** — 2,3 M visites/mois | Un site de **calculateurs** purs atteint ce niveau. |
| **Coolors** — 340 500 visites/mois sur un générateur | Un outil unique bien ciblé bat un catalogue. |
| **Détourage** — remove.bg 12 Mo · PhotoRoom 50 Mo · Leonardo.Ai 0,1047 $/image | Plafond retenu : **50 Mo**. |
| **Fidélité Office → PDF** — FreeConvert et Online2PDF à **0,1-0,24 % de pixels d'écart** de nous sur `.docx` | Nous sommes au niveau du marché gratuit sur la fidélité. **L'écart n'est pas là, il est sur la taille de fichier acceptée.** |

**La règle qui en découle :** viser les requêtes de niche à faible difficulté (KD ≤ 30), jamais les termes génériques tenus par des sites à DR 77.

---

# CRITÈRE DE LANCEMENT

**Bloquants avant le lancement : 9 (Safari — macOS mesuré, iPhone et retest des correctifs à faire par le propriétaire) ; ~~D8 (plafond de ≈ 4,5 Mo)~~ ✅ fait le 21/09, **en production et vérifié** (pptx 99 Mio en 53,7 s sur www ; rapport) ; la saturation à trancher avant Product Hunt ; ~~le DPA ConvertAPI~~ ✅ n'est plus un bloquant (22/09 — ses conditions s'appliquent déjà sans signature, voir 2 bis).** Railway Gotenberg à 3 réplicas, et la galerie Product Hunt.

Le bloquant 2 est **mesuré et ses promesses corrigées en ligne** ; ses défauts résiduels (D7, D9) passent après le lancement ; **D8 (plafond) est fait** (décision du propriétaire du 20/09, exécutée le 21/09).

Le bloquant 5 est **borné à l'usage** (30-40 outils mis en avant). Le bloquant 6 est **déployé et prouvé en production** (reste Safari réel, dans le bloquant 9). Les bloquants 7, 8 passent après le lancement.

**Le site est indexé et classé en page 8. Une page qui gagne sa requête vaut plus que 225 pages en position 74.**
