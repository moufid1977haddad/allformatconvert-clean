# Plafonds déclarés — D10 et outils voisins (2026-09-19)

Branche `plafonds-declares` (balise de restauration `restore-avant-plafonds-declares`), fusionnée sur master (`3436877a`).
Aucun agent de fond, aucun plafond relevé, aucun outil ni service supprimé ou renommé, aucun `.env` lu.

## 1. Document de pilotage installé

`claude/plan-de-travail.md` (le vrai, 494 lignes) est lu en entier et commité (`20bd6783`).
Ma version antérieure, qui n'existait que dans ce même fichier, a été remplacée ; aucune autre copie de l'avertissement n'existait
(recherche par nom et par contenu). Éléments de ma version absents du vrai document et **ajoutés sans rien retirer** :
D3, D4, D5 (lignes du tableau des défauts) ; la précision « D9 est la vraie cause du titre 06 non réduit à une ligne » ; la condition
de D7 (repli `.docx` si `CONVERTAPI_ENABLED` est coupé, à mesurer avant toute coupure) ; la veille Serverless de `pdf-tools` ;
la suppression manuelle de `Downloads\fidelite-01..06.pdf` ; la règle « branche + balise avant le premier commit ».
Tout le reste (règle zéro, interdits, quotas, D1/D2/D6/D8, plafond 4,4 Mo) y figurait déjà.

## 2. Mesures (production, 2026-09-19) — aucune promesse sans elles

| Mesure | Résultat |
|---|---|
| Corps de 5,3 Mo sur `convert-to-pdf`, `pdf-to-word`, `convert-html-to-pdf`, `pdf-repair`, `pdf-to-pdfa`, `ai-transcribe` | **413 `FUNCTION_PAYLOAD_TOO_LARGE`** sur les six (rejet plateforme, avant notre code, coût nul) |
| Corps JSON de 5,3 Mo sur `ai-vision` | **413 `FUNCTION_PAYLOAD_TOO_LARGE`** |
| 4 Mio de contenu quelconque sur `convert-html-to-pdf`, `pdf-repair`, `pdf-to-pdfa` | **passe la barrière** (le code de la route répond 504 / 422 / 422) |
| Vrai PDF valide de 4,18 Mo sur `pdf-repair` | **200**, réponse de 5,57 Mo (base64) renvoyée sans erreur |
| Vrai PDF valide de 4,18 Mo sur `pdf-to-pdfa` | **200**, conforme PDF/A-2b |
| Mesure du 19 septembre (rapport précédent) | 4 412 819 o passe, 4 517 676 o refusé (`.xlsx`, `.pptx`, `.docx`, pdf-to-word) |

**Plafond déclaré : 4 Mio** (`MAX_PLATFORM_UPLOAD_BYTES`), inférieur à la plus grande taille mesurée acceptée. Pour les outils qui envoient l'image
en base64 dans du JSON (`image-captioner`) : **3 Mio** de source (≈ 4 Mio de corps, même seuil).
**Non mesuré, donc non promis :** la taille du PDF *renvoyé* pour `.docx`/`.xlsx`/`.pptx` (le rapport précédent l'a déjà signalé comme risque) ;
un envoi réel de 4 Mio sur `ai-transcribe`/`ai-vision` (routes payantes, non éprouvées pour ne pas dépenser de quota — le seuil de la plateforme est
le même pour toutes les fonctions, mesuré sur sept routes).

## 3. Ce qui a été corrigé

Motif de `audio-to-text` reproduit à l'identique : `<p className="text-neutral-400 text-xs text-center -mt-2">` juste sous la zone de dépôt,
**avant la sélection**. Contrôle dans le navigateur **dès la sélection** (message visible, bouton désactivé) et de nouveau avant l'envoi ;
en dernier recours, un 413 renvoyé malgré tout par le serveur affiche le même message honnête. Le message dit la taille réelle, la limite réelle et la raison :

> This file is 12.3 MB but this tool accepts files up to 4 MB — the current upload limit of our hosting platform. Larger files are refused before conversion starts.

Code partagé : `lib/quota/limits.js` (`MAX_PLATFORM_UPLOAD_BYTES`, `checkPlatformUploadSize`), test `scripts/test-platform-upload-limit.mjs`.

| Outil | Avant | Après |
|---|---|---|
| word-to-pdf, excel-to-pdf, ppt-to-pdf, pdf-to-word (les quatre demandés) | aucun plafond annoncé, « Conversion failed. Please try again. » | annonce + contrôle + message honnête |
| html-to-pdf | aucun plafond annoncé (fichier ou texte collé) | idem, sur la taille du HTML envoyé |
| epub-to-pdf, mobi-to-pdf | aucun plafond ; **ce qui est envoyé est le HTML généré (images incluses), bien plus gros que le livre** | contrôle sur le HTML préparé, annonce « par livre, une fois préparé » |
| pdf-repair, pdf-to-pdfa | annonçaient **50 Mo** (inatteignable) | 4 Mio (mesuré avec de vrais PDF), textes HowTo/FAQ corrigés |
| audio-to-text, audio-transcriber | annonçaient **10 Mo** « un plafond de coût, pas technique » (faux : plafond technique à 4 Mio) | 4 Mio, FAQ corrigées |
| image-captioner | 5 Mo vérifié, mais base64 → refus dès ~3,3 Mo, rien d'annoncé | 3 Mio annoncé et vérifié |

Hors périmètre, **volontairement laissés** : les constantes serveur (25 / 50 / 10 Mo) restent inatteignables mais inoffensives ; les plafonds réels
(4,4 Mo) ne sont pas relevés (interdit permanent n° 12 : ils se déclarent).

## 4. Vérification en production

Déploiement de `3436877a` en production, puis test dans Chrome sur www.onlineconvertools.com avec un fichier de **5,5 Mo** (5 767 168 o) injecté dans le champ de fichier réel
(les octets sont réels ; le nom et l'extension sont ceux de l'outil). Pour chaque page : texte d'annonce lu **avant** la sélection, message lu **après**, état du bouton, nombre d'appels `/api/` émis.

| Page | Annonce avant sélection | Message après sélection de 5,5 Mo | Bouton | Appels /api/ |
|---|---|---|---|---|
| word-to-pdf (.docx) | « Max 4 MB per file — the current upload limit of our hosting platform… » | « This file is 5.5 MB but this tool accepts files up to 4 MB — the current upload limit of our hosting platform. Larger files are refused before conversion starts. » | désactivé | **0** |
| excel-to-pdf (.xlsx) | identique | identique | désactivé | **0** |
| ppt-to-pdf (.pptx) | identique | identique | désactivé | **0** |
| pdf-to-word (.pdf) | identique | identique ; **puis un fichier de 3,5 Mo : aucune erreur, bouton activé** | désactivé puis activé | **0** |
| pdf-repair | annonce dans l'intro « up to 4 MB — … » | identique (test interactif) | désactivé | — |

Annonce présente et sans trace de « 50 MB » / « 10 MB » dans le HTML servi de : html-to-pdf, epub-to-pdf, mobi-to-pdf, pdf-repair, pdf-to-pdfa, audio-to-text, audio-transcriber, image-captioner (3 Mo par image).
**Non testé de bout en bout dans le navigateur :** le message de repli sur un 413 serveur (inatteignable si le contrôle client passe, code relu seulement), et les contrôles à la sélection de html/epub/mobi/audio/captioner (annonce vérifiée dans le HTML, logique identique et revue, seul `pdf-repair` éprouvé en interaction). `next build` complet : 267 pages, 0 erreur. `node scripts/test-platform-upload-limit.mjs` : OK.

## 5. Ce qui reste ouvert

- Relever le plafond (D8) : chantier séparé après le lancement, sauf si `tool_errors` montre des refus à 4,4 Mo.
- Taille du PDF renvoyé pour les routes Office non mesurée.
- gotenberg-fonts / gotenberg-v2 : la contradiction sur les références croisées est consignée dans `REFERENCE-projet.md` (non revérifiée, pas d'accès Railway) ; rien supprimé.
