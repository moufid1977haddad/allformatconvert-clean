# RAPPORT P27 — texte des PDF/A, vraie conversion .doc, Gotenberg 8.37, vitesse, accessibilité, clarté (03-04/10)

Demandé par le propriétaire (prompt P27), mises en production comprises, y compris en son absence (jusqu'au 04/10
vers 17 h). Branche `p27-nuit`, repère de restauration `restauration-avant-p27-04-10` = `ffe978a7` (master avant P27).
Autorisations : Railway (pdf-tools, Gotenberg) pour les phases 1 à 3 seulement, aux conditions de P26 ; ConvertAPI
0,05 $ au plus pour la phase 2 ; aucune autre dépense, rien sur Supabase. Rapport complété après chaque phase.

## 0. Récapitulatif

| Phase | Contenu | État |
|---|---|---|
| 1 | PDF/A 1b/2b/3b : texte exactement celui du source, sinon message clair | ✅ **en production** (pdf-tools `83a62d4c` puis `0901abe9` ; site `g0lpolk68` = `98b84eba`) |
| 2 | PDF to Word : vraie conversion .doc et .rtf > 4 Mo sur www | ✅ faites et rouvertes ; **défaut trouvé et corrigé** (accents perdus par ConvertAPI), en production |
| 3 | Gotenberg 8.37 à côté de 8.36, comparaison au pixel et au texte | ⛔ **bloquée** : le déploiement de 8.37 sur `gotenberg-fonts` a été refusé par le garde-fou des permissions de Claude Code (« Production Deploy ») — décision du propriétaire (§3) |
| 4 | Vitesse mobile (Lighthouse) des 238 pages, en local | ✅ **243 pages ≥ 90** (accueil 94, médiane 94, min 92 après correction de Currency Converter) ; JS du premier affichage −90 à −140 Ko (§4) |
| 5 | Accessibilité AA (axe) des 238 pages + clavier | ✅ **0 violation axe** sur 972 pages-modes (avant : 248 graves ou critiques) ; clavier 40/40 ×3 moteurs ; ≈ 110 zones d'envoi atteignables au clavier (§5) |
| 6 | Clarté d'usage (zone d'envoi, bouton, menu, pied de page) | ✅ « Click or drop » / « Choose » selon l'appareil (112 zones), mots sous les icônes, 12 catégories au pied de page ; aucun outil retiré ni renommé (§6) |
| 7 | Restes de P23 (gros fichier sur une ligne, borne téléphone) | ✅ 20 Mo sur une ligne sans blocage (6-9 s → ≤ 0,25 s) ; bornes mesurées et annoncées avant l'envoi (§7) |
| 8 | Trouvé en route : outils de texte PDF du navigateur (accents perdus, Redact qui ne trouvait pas le mot) | ✅ corrigé, revue indépendante (§8) |

## 1. Phase 1 — PDF/A 1b, 2b, 3b : le texte n'est plus jamais altéré

### 1.1 Constat repris de P26 et cause
En production, les niveaux b étaient la sortie de Ghostscript telle quelle (validée par veraPDF, qui ne vérifie pas
le texte) : grec « Ελληνικά » → « Ε½½ην»¼ά », « section » → « sec琀椀on », « données » → « donnees ». Cause mesurée
cette nuit pour une partie des cas : LibreOffice (sous Windows, police Cambria par exemple) et Chromium dessinent
certains accents en deux glyphes (« e » + accent) et ligatures / arabe en glyphes sans texte, et portent le bon texte
dans un `/ActualText` ; Ghostscript ne le garde pas toujours, et son propre lecteur de texte (`txtwrite`) **l'ignore**
(« données » y est lu « donne\x08es » dans la source même) — un contrôle fait avec lui seul aurait laissé passer une
sortie fautive.

### 1.2 Correction (service pdf-tools)
Même méthode que les niveaux u de P26, pour 1b/2b/3b et pour le niveau b atteint par abaissement :
1. le PDF source **gardé tel quel** (pikepdf : profil sRGB, métadonnées XMP, drapeaux des annotations ; pour 1b,
   version 1.4 sans flux d'objets et un `CIDSet` construit depuis le programme de police intégré — Chromium n'en écrit
   pas ; définition de veraPDF mesurée : tous les glyphes du programme), validé par veraPDF ;
2. sinon Ghostscript, accepté seulement si veraPDF passe **et** si son texte est celui du source pour **deux
   lecteurs** : Ghostscript `txtwrite` et Poppler `pdftotext` (qui lit `/ActualText`) — `poppler-utils` ajouté à
   l'image (GPL-2, programme séparé, non modifié) et contrôlé par `/health` ;
3. sinon aucun fichier, et une phrase : le texte aurait changé, et comment archiver quand même (exporter en PDF/A
   depuis Word ou LibreOffice).
Limite de durée : 200 s pour tous les niveaux (deux validations et deux lectures de texte de plus au pire).

### 1.3 Revue indépendante (obligatoire)
1 critique, 1 sérieux, 5 moyens, 6 mineurs — **tous traités avant la mise en ligne** : `poppler-utils` absent du
Dockerfile (ajouté, et `pdftotext -v` à la construction : un oubli aurait fait refuser tous les PDF/A) ; le chemin
« gardé » des niveaux u/a était livré **sans** contrôle du texte et **rendait visibles les annotations cachées**
(un tampon caché « CONFIDENTIAL DRAFT » devenait visible) → une seule règle pour tous les niveaux (texte vérifié avant
toute livraison), annotation cachée retirée (rien de visible ne change), annotation « impression seulement » non
gardable (Ghostscript, contrôlé, décide) ; intention de sortie PDF/A existante (CMJN) gardée au lieu d'être remplacée ;
messages exacts (fichier protégé, conversion impossible) ; comparaison « mêmes caractères pour les deux lecteurs, mêmes
mots pour au moins un » (un espace placé autrement par un lecteur ne fait plus refuser) ; espaces insécables comptés
comme du texte ; texte de la source lu sur une copie déchiffrée quand un verrou de copie gêne un lecteur ; `CIDSet`
pour toutes les polices (pages, formulaires, apparences), GID 0 exclu ; délai de la route borné par `maxDuration` en
comptant l'arrivée d'un gros fichier ; refus « texte » sans rapport veraPDF trompeur.

### 1.4 Mesures
- **Corpus permanent** `scripts/p27/pdfa-corpus/` (31 PDF) : les 20 vrais PDF de P26 + Chromium (Calibri, Arial,
  balisé / non balisé), LibreOffice (grec, arabe, chinois, accents, ligatures, Cambria à accents décomposés), pdf-lib
  (polices en sous-ensemble), annotation cachée, annotation « impression seulement », verrou propriétaire. Fabriqué
  par `make.mjs` et `make_extra.py`.
- **Banc** `scripts/p26/e2/pdfa-bench.mjs` : désormais **tout** fichier livré (b compris) est comparé mot pour mot à
  son source par xpdf `pdftotext` (indépendant de Ghostscript et de Poppler qu'utilise le service), et revalidé par un
  veraPDF local.
- **En local** (Ghostscript 10.07) : 166/166 avant arrêt volontaire (banc relancé sur le service en ligne) + les 3 cas
  de la revue 12/12.
- **Service en ligne** (pdf-tools `83a62d4c`, commit `ed388b30`, Ghostscript 10.00, Poppler 22.12) : **341/341**,
  0 texte altéré. Livrés : b 125 (122 gardés, 3 par Ghostscript contrôlé), u 110 (104 gardés, 6 Ghostscript), a 32.
  Refusés avec la raison : 4 niveaux b sur 93 (le PDF « impression seulement » ×3 — Ghostscript non conforme, comme
  avant ; `site-mobi` en 1b — Ghostscript aurait altéré le texte, la page conseille l'export PDF/A depuis l'original).
- **Ancien comportement inchangé** (5 vrais PDF, au pixel et au texte) : réparation et compression **9/9 identiques**.
- **Rendu** : les PDF/A b livrés sont **identiques au pixel et au texte à leur source** (11/11) ; avant, la sortie de
  Ghostscript différait du source au texte sur 12/15.

## 2. Phase 2 — PDF to Word : vraies conversions sur www (≈ 0,02 $ de ConvertAPI)

Deux documents LibreOffice réalistes construits pour l'occasion (rapport de 3 pages avec titres, tableau, accents ;
le même avec une photo de 24 Mpx, PDF de **9,9 Mo**, 4 pages). Par la page de www, comme un visiteur
(`scripts/p27/word-www.mjs`) :

| Conversion | Résultat | Word 16 | LibreOffice 26 |
|---|---|---|---|
| PDF texte (66 Ko) → .doc | 61 952 o, conteneur Word 97, 4,0 s | s'ouvre : 3 pages, 1 tableau | s'ouvre |
| PDF 9,9 Mo → .rtf (service média) | 331 565 o, 10,6 s, 1 travail du service média | s'ouvre : 4 pages, 1 tableau, la photo | s'ouvre |

**Défaut trouvé (production, ancien, ConvertAPI)** : dans les deux fichiers, le texte courant a ses accents abîmés —
« données » → « donne% es », « être » → « e, tre ». Cause mesurée : ce PDF (LibreOffice, Cambria) dessine « é » en
« e » + un glyphe d'accent sans texte et porte le bon mot dans `/ActualText` (420 fois) ; Poppler et xpdf le lisent
juste, **ConvertAPI l'ignore**. Les sorties ConvertAPI antérieures (P25) gardaient leurs accents : le défaut tient à
cette famille de PDF (0 `/ActualText` dans les PDF que fabrique notre site, 99 dans un export LibreOffice Windows,
83 dans un PDF de Chromium avec ligatures). Voir §2.1 pour la suite donnée.

### 2.1 Suite donnée au défaut ConvertAPI — corrigé, en production
Options de ConvertAPI relues (PDF → DOCX : Layout, OcrMode, OcrLanguage, OcrEngine…) : aucune pour `/ActualText`.
Moyen retenu : avant ConvertAPI, donner aux glyphes d'accent sans texte **l'accent que leur propre `/ActualText`
indique** (nouveau point d'entrée `/v1/unicode-from-actualtext` de pdf-tools, additif ; seuls les flux ToUnicode
changent, rien n'est deviné). Expérience décisive avant de construire : le PDF ainsi complété → ConvertAPI écrit
« Les données numérisées doivent être conservées » (1 conversion). pdf.js, qui ignore aussi ActualText, passe de 375
mots faux à 15 (ordre de lecture) sur ce document.
**Revue indépendante** (obligatoire : un changement qui pourrait écrire un mauvais texte) : 3 sérieux, 4 moyens —
écritures lues dans l'ordre visuel (arabe, hébreu, indiennes) qui auraient reçu de mauvaises lettres, flux ToUnicode
partagés entre deux polices, chiffrement retiré, fichiers réparés réécrits, `q/Q` non suivis, syntaxes de CMap mal
lues. **Tout traité en restreignant au cas mesuré** : seules des marques combinantes (catégorie Unicode M), une par
lettre de base déjà lue ; jamais d'écriture droite-à-gauche ni réordonnée ; jamais un code déjà lu ; flux partagé, CMap
non comprise, Type0 non Identity, fichier chiffré ou réparé : laissés tels quels. Les deux PDF piégés du réviseur :
0 entrée ajoutée ; les 6 PDF LibreOffice concernés du corpus : 2-3 entrées chacun, texte Poppler/xpdf inchangé.
Câblage : `lib/providers/convertApi.js` (Word, RTF, Excel, PowerPoint), au mieux (service absent, lent > 30 s, ou
réponse autre qu'un PDF → octets d'origine, comme avant).
**Mis en production** (service `0901abe9` par fusion additive `a3dbff9e`, vérifié en ligne : 200 + 2 entrées / 204 ;
ancien comportement 23/23 identique ; site `98b84eba`). **Sur www**, le même PDF d'origine → .docx : « Les données
numérisées doivent être conservées », 0 « % ».
**Dépense ConvertAPI de la nuit : 4 conversions ≈ 0,04 $** (plafond 0,05 $) : .doc, RTF de 9,9 Mo, le PDF complété
(diagnostic), le contrôle final sur www.

## 3. Phase 3 — Gotenberg 8.37 : bloquée par une permission, mesures faites
- **Fait** : 8.37.0 relu (Chromium 152.0.7977.82, LibreOffice 26.8.0 ; 100.64/10 et 198.18/15 internes ; identifiants
  d'URL ignorés pour les listes ; bornes contre les pages hostiles ; formules mathématiques DOCX rétablies —
  `libreoffice-math` rajouté ; ≈ 75 Mo de moins par Chromium). Empreinte du registre lue : `8.37.0@sha256:f29984bd…`.
- **Banc élargi** `scripts/p27/gotenberg-compare.mjs` : 43 conversions (Word, Excel, PowerPoint dans tous les formats
  acceptés, documents de fidélité, HTML, EPUB, MOBI, URL, plus `math.docx` et `multilingual.docx` construits pour
  l'occasion). Sur la 8.36 actuelle (`gotenberg-fonts`) : **deux passages identiques au pixel, 43/43**.
- **Défaut trouvé en 8.36 (production)** : les **équations Office d'un DOCX disparaissent** du PDF (seul le texte
  autour reste) — c'est le défaut que 8.37 corrige.
- **Bloqué** : le déploiement de 8.37 sur `gotenberg-fonts` (service sans trafic de production) par `railway up` a
  été **refusé par le garde-fou des permissions de Claude Code** (« Production Deploy »), et la lecture d'état Railway
  qui a suivi aussi. Conformément à la règle, aucun contournement n'a été tenté. **Pour reprendre** : le propriétaire
  autorise cette action (règle de permission Bash pour `railway up` vers `gotenberg-fonts`) ou la lance lui-même ;
  ensuite banc 43 documents au pixel 8.36 / 8.37, sondes d'adresses internes, revue de sécurité, décision.
- **Recommandation** : passer en 8.37 (équations Word, plages internes, mémoire), **seulement** après le banc.

## 4. Phase 4 — Vitesse sur mobile (Lighthouse, construction de production EN LOCAL)

### 4.1 Comment les leaders chargent leurs pages (relevé du 03/10, téléphone émulé, cache vide, `scripts/p27/how-pages-load.mjs`)
| Page | Requêtes | JS (dont le leur) | CSS | Polices | Images | Scripts bloquants | Tiers |
|---|---|---|---|---|---|---|---|
| iLovePDF accueil | 29 | 265 Ko (90) | 35 Ko, 1 fichier | 80 Ko, **4 graisses préchargées** (woff2) | 50 Ko, **paresseuses** | 0 | 2 |
| iLovePDF Compress PDF | 36 | 673 Ko (222) | 75 Ko | 79 Ko | 22 Ko | 0 | 10 (publicité) |
| Smallpdf accueil | 45 | 896 Ko (407) | ≈ 0 (CSS dans le JS) | 147 Ko, `font-display: fallback` + **police de repli ajustée** (pas de saut) | 135 Ko, paresseuses avec dimensions | 0 | 11 |
| Smallpdf Compress PDF | 39 | 874 Ko (485) | 0 | 148 Ko | 38 Ko | 0 | 9 |
Moyens communs : aucun script bloquant, texte de la page rendu par le serveur (LCP = un texte, 0,44-0,55 s sans
limitation), polices en woff2 préchargées ou à repli ajusté, images paresseuses avec dimensions. Nos pages faisaient
déjà tout cela (P18) ; ce qui restait se voit dans Lighthouse ci-dessous.

### 4.2 Mesure et causes (Lighthouse 13.5, profil mobile : Moto G Power émulé, 4G lente simulée, processeur ×4)
Avant (construction locale servie par `next start`) : outils 85-87, catégories 88-91, accueil 86-88 ; LCP 3,7-3,9 s
pour un FCP de 0,9 s. L'élément LCP est un texte rendu par le serveur ; son « retard » vient de ce que le navigateur
télécharge pendant le premier affichage :
1. **la bibliothèque des comptes (Supabase, ≈ 51 Ko compressés)** chargée sur chaque page pour chaque visiteur —
   mesuré en la bloquant : LCP −0,4 s, TBT −50 ms, +3 points ;
2. **le préchargement par Next.js des pages « Accueil » et « Sign In »** (liens toujours visibles de la barre), qui
   retéléchargeait cette même bibliothèque ;
3. le préchargement des icônes du méga-menu dès l'inactivité ;
4. sur l'accueil, le titre **apparaissait en fondu depuis une opacité nulle** : le navigateur ne pouvait pas le compter
   comme affiché avant l'animation.
Le reste du temps de blocage (TBT ≈ 200 ms) est l'hydratation de React et **Google Analytics** (≈ 120 ms mesurés en le
bloquant), déjà chargé « au repos après chargement » ; le différer davantage (au premier geste du visiteur) ferait
perdre les visites très courtes dans les statistiques : non fait (décision qui touche aux mesures d'audience).

### 4.3 Corrections
- Supabase n'est chargé que s'il peut y avoir un compte à montrer : session déjà enregistrée par Supabase dans ce
  navigateur, retour de connexion dans l'adresse, connexion faite dans un autre onglet (événement `storage`) ou dans
  celui-ci (revérifié à chaque changement de page). Un visiteur qui ne s'est jamais connecté ne le télécharge plus.
- `prefetch={false}` sur les deux liens toujours visibles de la barre (logo, Sign In) ; les liens d'outils gardent le
  leur.
- Icônes du méga-menu préchargées 3 s après le chargement, au repos.
- Accueil : le titre glisse sans jamais être invisible ; `prefers-reduced-motion` respecté.
- JS chargé au premier affichage : 526-591 Ko → **382-502 Ko**.
- Currency Converter (seule page sous 90 au passage complet, 88) : son plus grand texte était la case du résultat,
  dessinée seulement à l'arrivée des taux d'un autre site (LCP 3,4 s). La case est dessinée dès le départ avec « … »
  (montant non mis en forme tant que les taux manquent : le format des nombres du serveur n'est pas celui du
  visiteur), la mention des taux (obligatoire) est affichée dès le départ avec sa hauteur gardée, connexion
  préouverte aux deux services de taux → **93-94 ×3** (LCP 2,4 s = le titre) ; son banc passe dans les 3 moteurs.

### 4.4 Mesure finale — les 243 pages (Lighthouse 13.5 mobile, construction locale finale servie en HTTP/2 + Brotli)
`next start` sert en HTTP/1.1 et gzip ; Vercel en HTTP/2 et Brotli. Mesuré sur des pages types : le même fichier perd
≈ 4-5 points en HTTP/1.1 seul. Pour mesurer la construction et non le serveur local, un relais local
(`scripts/perf/h2-proxy.mjs`, sans cache ni réécriture) la sert comme Vercel ; www n'a pas été mesuré (règle d'usage).
| Pages | Nombre | Performance min / médiane / max | LCP médian | TBT médian | CLS max | Accessibilité, bonnes pratiques, SEO |
|---|---|---|---|---|---|---|
| Accueil | 1 | **94** | 2,28 s | 226 ms | 0 | 100 / 100 / 100 |
| Catégories et /tools | 13 | 92 / 94 / 96 | 2,40 s | 218 ms | 0 | 100 / 100 / 100 partout |
| Outils | 225 | **88 → 93** (Currency Converter corrigé) / 94 / 96 | 2,42 s | 218 ms | 0,081 | 100 / 100 / 100 partout |
| Pages du site (about…) | 4 | 95 | 2,11 s | 239 ms | 0 | 100 / 100 / 100 |
**Objectif ≥ 90 atteint sur les 243 pages** (avant P27 : outils 85-87, accueil 86-88, en HTTP/1.1 ; 89-91 en HTTP/1.1
après). Ce qui reste entre 92 et 96 est le TBT (≈ 220 ms : hydratation React + Google Analytics, voir §4.2).

## 5. Phase 5 — Accessibilité AA (WCAG 2.2)

### 5.1 Mesure avant (axe-core 4.13, règles WCAG 2.0/2.1/2.2 A et AA, `scripts/p27/axe-pages.mjs`)
238 pages × 2 modes (téléphone clair, ordinateur sombre) : **248 pages-modes avec une violation grave ou critique**,
presque toutes **en mode sombre**, que personne n'avait passé à axe : bouton du thème **sans nom** (critique, 243
pages) ; bouton « Sign In » blanc sur bleu 3,6:1 (243 pages) ; liens indigo 2,2-2,9:1, gris 3,5:1, rouge 3,6:1,
boutons et cartes restés clairs sous un texte clair (1,0-1,9:1), aperçus Markdown 1,0:1 ; en clair : 5 pages
(exemples défilants inaccessibles au clavier, un texte d'exemple bleu 3,7:1). Ce qu'axe ne voit pas, vu à la main :
**environ 110 zones d'envoi** étaient des `<div onClick>` — **inaccessibles au clavier** (Tab ne les atteint pas) ;
32 champs retiraient le contour de focus ; aucune annonce de fin de travail pour un lecteur d'écran.

### 5.2 Corrections
- Mode sombre : une teinte pour fond sombre des couleurs claires (indigo, rouge, gris, fonds `neutral-200`,
  `indigo-50`, texte `neutral-900`) **seulement là où l'élément ne nomme pas déjà sa couleur sombre** ; bleu des
  boutons 4,9:1 ; bouton du thème nommé (« Switch to dark/light mode ») ; exemples défilants atteignables (Tab).
- Focus toujours visible (contour 2 px, clavier et champs de texte ; jamais pour un clic de souris sur un bouton).
- `A11yBridge` (un composant pour tout le site, comme `FileDropBridge`) : toute zone d'envoi (bordure tirets + main
  au survol) devient un bouton pour les technologies d'assistance — dans l'ordre de Tab, nommée par ses propres mots,
  Entrée/Espace font ce que fait le clic ; une région « polie » annonce « Your file is ready to download: … » et le
  début d'un travail ; les erreurs restaient en `role="alert"`. Barre de progression nommée.
- Derniers points vus au second passage : bande défilante de l'accueil, Color Converter (couleur par défaut et
  légendes d'exemple à contraste fixe), Barcode Generator ; images sans `alt` (66 fichiers, `codemod-img-alt.mjs`) ;
  listes déroulantes longues limitées à la largeur de l'écran (URL Encoder ×2, Excel to CSV : WCAG 1.4.10, vu par le
  banc de mise en page iPhone).

### 5.3 Mesure après (construction locale finale)
- **axe : 972 pages-modes (238 pages + variantes, téléphone et ordinateur, clair et sombre) : 0 violation — ni
  critique, ni grave, ni modérée, ni mineure.**
- Clavier (`scripts/p27/keyboard-check.mjs`, un outil par catégorie et les zones d'envoi : Tab atteint la zone, focus
  visible, Entrée ouvre le choix du fichier, le résultat est annoncé) : **40/40 dans Chromium, Firefox et WebKit**.

## 6. Phase 6 — Clarté d'usage (d'après iLovePDF, Smallpdf, FreeConvert, CloudConvert, relevé du 03/10)

### 6.1 Ce que font les leaders (`scripts/p27/how-upload-looks.mjs`, ordinateur 1366 px et iPhone 13)
| Site | Zone d'envoi, ordinateur | Zone d'envoi, téléphone | Bouton d'action avant fichier | Menu |
|---|---|---|---|---|
| iLovePDF | « Select PDF files » + « or drop PDFs here » | « Select PDF files » | aucun | mots (MERGE PDF, SPLIT PDF…, ALL PDF TOOLS) ; menu ☰ sur téléphone |
| Smallpdf | « CHOOSE FILES or drop files here » | « CHOOSE FILES » | aucun | « Tools » ; pied de page de 103 liens (Solutions, Company, Product, Apps) |
| FreeConvert | « Choose Files » | « Choose Files » | aucun | mots (Convert, Compress, Tools, API, Pricing) |
| CloudConvert | « Select File » | « Select File » | « Convert » après le choix | mots (Tools, API, Pricing) |
Décision : sur ordinateur « cliquer ou déposer », sur écran tactile « choisir » (comme iLovePDF et Smallpdf) ; aucune
action avant le fichier ; des mots dans le menu ; toutes les catégories au pied de page.

### 6.2 Fait
- `UploadPrompt` : « Click or drop a PDF here » avec souris/pavé, « Choose a PDF » sur écran tactile — décidé par le
  pointeur principal (CSS `pointer: coarse`), sans script ni clignotement ; **112 zones** (95 par un script de
  réécriture prudent, `scripts/p27/codemod-upload-prompt.mjs`, 17 à la main). Vérifié en émulation iPhone :
  « Choose images (up to 20) ».
- Bouton d'action avant le fichier : relevé sur les 225 outils (`scripts/p27/action-before-file.mjs`) — **déjà caché
  ou désactivé partout** ; les 5 signalés sont des bascules de mode (Encrypt/Decrypt, Split/Join), une option
  (Flip), ou une autre entrée (scanner par caméra, QR depuis un texte) : rien à changer.
- Menu : **un mot sous chaque icône** (PDF, Image, GIF, Audio, Video, Text, File, QR, Convert, Dev, Math, AI), à toutes
  les largeurs ; coupé par « … » si une traduction est longue ; aucune largeur dépassée de 1024 à 2560 px
  (`scripts/p27/navbar-width.mjs`, 10/10), en-tête 65-75 px.
- Pied de page : **les 12 catégories** avec leur nombre d'outils (au lieu de 5), liste partagée
  `app/lib/siteCategories.js` avec la barre.
- Aucun outil retiré ni renommé.

## 7. Phase 7 — Restes de P23

### 7.1 Gros texte sur une seule ligne dans un champ modifiable (`scripts/p27/big-single-line.mjs`, 20 Mo, Chromium)
| Cas | Avant | Après |
|---|---|---|
| CSV to TSV, fichier de 20 Mo sur une ligne | page figée 6,4 s (tâche de 5,9 s), **1,3 s par touche** | 0,16 s, 22 ms par touche |
| JSON Formatter, 20 Mo collés (Ctrl+V réel) | figée 9,3 s (tâche de 8,3 s), **2,8 s par touche** | tâche la plus longue 0,18 s, 26 ms par touche |
| Case Converter, 20 Mo collés | figée 9,2 s, 2,9 s par touche | 0,25 s, 25 ms par touche |
Cause : le champ `<textarea>` lui-même (seul, 20 Mo coûtent 3,2-4,4 s, une ligne ou 200 000), pas l'outil. Moyen
(celui des éditeurs de code et des outils du marché pour les gros textes) : `TextArea`, posé sur les **156 champs
contrôlés** (réécriture par l'analyseur JSX, `scripts/p27/codemod-textarea.mjs`) — jusqu'à 1 M de caractères rien ne
change ; au-delà, aperçu des 20 000 premiers caractères, la taille, « l'outil travaille sur tout le texte » (vérifié :
Case Converter met 1,8 M de caractères en majuscules, « Copy » copie les 1,8 M), « Edit here anyway (slow) » et
« Clear » ; un collage qui dépasserait 1 M ne passe pas par le champ (l'outil reçoit le même texte qu'un collage).

### 7.2 Bornes de taille mesurées (`scripts/p27/phone-bound-memory.mjs`, pic mémoire de l'onglet, Chromium)
| Outil | 24 Mpx | 48 Mpx | 100 Mpx | au-delà |
|---|---|---|---|---|
| Image Compressor (JPEG) | 0,86 Go | 1,4 Go | 2,4 Go | 140 Mpx : fait ; **150 Mpx : le moteur JPEG (mozjpeg, 2 Go de mémoire WebAssembly) meurt sans un mot, page « Compressing… 5 % » pour toujours** |
| Image to PDF (PNG, décodé) | 0,51 Go | 0,70 Go | 1,65 Go | 200 Mpx : 3,0 Go, fait |
Un navigateur de téléphone recharge l'onglet bien plus bas qu'un ordinateur (≈ 1,5-2 Go sur un iPhone récent). Bornes
retenues et **annoncées sous le titre, avant le choix** : Image Compressor 140 Mpx sur ordinateur (au lieu de 268,
qui ne tenait pas), **50 Mpx sur téléphone** (une photo de 48 Mpx passe) ; images décodées des outils PDF (PNG, HEIC,
WebP… ; les JPEG ne sont pas décodés, sans borne) 268 Mpx sur ordinateur, **90 Mpx sur téléphone**. Messages au choix
du fichier, FAQ d'Image to PDF corrigée (« aucune limite » n'était plus vrai). **Défaut ancien corrigé** : un
**chien de garde** dans Image Compressor transforme tout arrêt silencieux du moteur en message et remplace le moteur
pour l'image suivante. À vérifier par le propriétaire sur un vrai iPhone : un panorama de 63 Mpx (au-dessus de 50).

## 8. Trouvé en route et corrigé (lot 3) — les outils de texte PDF du navigateur
Le même défaut que ConvertAPI (§2) touche **nos propres outils** qui lisent le texte avec PDF.js dans le navigateur :
PDF.js n'utilise `/ActualText` que dans l'arbre de structure, pas dans le contenu des pages. Mesuré sur la
construction locale avec le vrai PDF LibreOffice de §2 (`scripts/p27/actualtext-pages.mjs`) :
| Outil | Avant |
|---|---|
| PDF Extract Text | « Les donne\bes nume\brise\bes doivent e\u000ftre conserve\bes » |
| PDF to HTML | « donne… » avec un caractère de contrôle |
| **PDF Redact** | chercher « données » → **« No matches found »** : le mot n'aurait **pas** été caviardé |
| PDF Compare | texte faux dans les deux panneaux |
(Translate, AI Summary et PDF to Excel passent par la même lecture.)
Correction : `app/lib/pdfActualText.js`, port navigateur de `actualtext.py` (mêmes règles étroites), appliqué à la
copie donnée à PDF.js seulement (le fichier du visiteur et les pages non touchées de Redact restent les siens) ; au
mieux (fichier > 25 Mo, chiffré, ou rien à ajouter : octets d'origine). Banc Node (`actualtext-browser.test.mjs`) :
les 6 PDF LibreOffice concernés du corpus passent de 360 / 90 / 4 mots mal lus à 0 / 10 / 1 (le reste : ordre de
lecture), les 26 autres reviennent identiques octet pour octet, les PDF piégés de la revue aussi.

**Revue indépendante** (obligatoire : une erreur ici donnerait un texte faux sans le dire, et Redact laisserait un
mot) — défauts trouvés, tous corrigés puis revérifiés :
- une image en ligne (`BI … ID … EI`) pouvait être lue comme du texte → tout flux qui en contient est laissé ;
- réenregistrer le fichier (pdf-lib) changeait parfois l'ordre de lecture de PDF.js → **mise à jour incrémentale**
  ajoutée à la fin du fichier (les octets d'origine restent, PDF.js lit exactement le même fichier plus les entrées) ;
- seuls les flux qui portent `/ActualText` sont décompressés (rapide), plafond 40 Mo décodés, `DecodeParms` refusés ;
- polices non intégrées laissées (leur ToUnicode n'est pas à nous) ; noms PDF bruts ; texte lu octet par octet ;
  écritures de droite à gauche élargies ;
- le service `pdf-tools` (`actualtext.py`) resserré de la même façon et redéployé (`5c51f840`, master `8399d22f`).
Dernier point vu au banc des pages : PDF.js rend l'accent ajouté comme « e » + U+0301 (affiché juste, mais la
recherche « données » de Redact ne le trouvait pas). Le chargeur commun de PDF.js (`app/lib/pdfjs.js`) compose
désormais le texte lu (NFC), seulement pour les chaînes qui portent un accent combinant.
**Après** (`scripts/p27/actualtext-pages.mjs`, construction locale, Chromium, Firefox, WebKit) : **4/4 ×3** — Extract
Text lit « Les données numérisées doivent être conservées », PDF to HTML écrit « données », **Redact trouve et retire
« données »** (absent de la page rendue), Compare montre « données ».
