# RAPPORT — P37 : bugs relevés par P36, trois correctifs iPhone, orthographe américaine, test de l'éditeur PDF arabe (07/10)

Branche `p37`, repère de restauration `restauration-avant-p37-07-10` = `a0754be4`. Rapports détaillés par lot :
`docs/audit/p37/`. Production au départ : `onlineconvertools-90t9u2hxi` (= `d854b0f0`, P36) ; retour arrière :
`onlineconvertools-gbnnrjftd` (P35), ou `-90t9u2hxi` une fois P37 en ligne.

## État final — à lire d'abord

<!-- ETAT -->

- **Dépense : 0 $.** Aucun appel payant ; aucune action Railway, Supabase, variables d'environnement ; www jamais
  sollicité par un banc (un essai de comparaison WebKit sur www a été refusé par le filtre de la session : abandonné).
- **Sous-agents : 13** (5 lots de bugs, 3 suites, OCR, Redact, test arabe, diagnostic WebKit, 1 réviseur indépendant
  de Redact en 3 passes). Règles des secrets copiées dans chaque consigne ; aucun n'a lu de fichier de secrets.
- **Interruption** : la session a atteint sa limite d'usage une fois ; le travail en cours a été commité tel quel
  (`0e500504`, marqué non vérifié), puis repris et terminé.

## Lot 1 — bugs relevés par P36 (classés : résultat faux, panne, gêne)

Chaque bug : reproduit, corrigé, test qui échouait avant et passe après (sorties avant/après gardées), texte de la page
remis à jour, `content-verify` / `instructions` / `privacy-claims` à 0. 32 tests node P37 : tous verts sur l'arbre final.

| Outil | Gravité | Défaut → correction | Test (avant → après) |
|---|---|---|---|
| JSON to PHP (classes) | 1 | grand entier perdu (`json_decode` sans `JSON_BIGINT_AS_STRING`) → drapeau ajouté quand un entier dépasse PHP_INT_MAX | 3 échecs → 6/6 |
| JSON to CSV, JSON to YAML | 1 | clés entières mises en premier → ordre du texte gardé | 1+2 échecs → 5/5, 6/6 |
| TypeScript to JS | 1 | namespace avec code supprimé en silence ; JSX vu seulement avec `return <` → lecture .ts puis .tsx, namespace avec code refusé par son nom | 9 échecs → 22/22 |
| API Tester | 1 | adresse relative envoyée à notre site avec les en-têtes ; `content-type` doublé → adresse absolue exigée, en-tête remplacé | 14 échecs → 21/21 |
| Nettoyeur des rapports d'erreur | 1 (confidentialité) | JWT, Bearer, clés `sk-`/`ghp_`/`AKIA`, jetons, courriels, motifs de regex passaient → `scrubSecrets()` | 11/35 → 36/36 |
| Sentence case | 1 | pas de majuscule après « . » + minuscule → règle (espace exigé ; abréviations, initiales, 3.14, URL gardés) ; idem `?`/`!` | 9/16 → 16/16 ; 7/13 → 13/13 |
| Word Counter | 1 | « hello world. this is » = 1 phrase → même découpage que Sentence case | 8/13 → 13/13 |
| AC3 / MP2 (Audio Converter, Video to Audio) | 1 | 128 kbit/s écrit à 192 → débit choisi respecté | 2 échecs → 0 ; navigateur : en-têtes de trames 128/192/256 lus |
| Image Metadata | 1 | WebP non lu (GPS caché) → morceaux RIFF EXIF/XMP/ICCP lus, « Remove metadata » pour le WebP | 10 échecs → 0 |
| File Metadata | 1 | même défaut WebP → même lecteur | 5 échecs → 9/9 |
| Image Converter | 1 | qualité PDF < 50 % ignorée → appliquée | 5 échecs → 0 |
| EPUB to PDF | 1 (+2) | chapitre manquant = page blanche, compteur jamais atteint ; entrée ZIP abîmée ou itemref inconnu = plantage brut → écartés et comptés | 2 + 4 échecs → 0 |
| Barcode (5 types non relus) | 1 / 3 | MSI Mod 11 = 10 → message clair ; Code 11 « K au-delà de 10 » faux (dès 10) ; texte | 60/62 → 62/62 |
| JSON to Python | 2 | note `//` = SyntaxError → retirée (l'`int` Python n'a pas de limite) | 3 échecs → 6/6 (vrai Python) |
| Video Converter | 2 | « Resolution » + vitesse/miroir refusé après l'envoi → refusé avant, bouton grisé | 4 échecs → 0 |
| Video Rotator | 2 | mode « lossless » caché gardé après changement de fichier → remis à zéro | 2 échecs → 0 |
| `.ac3` | 2 | absent des fichiers audio acceptés → ajouté (10 outils) | 11 échecs → 0 |
| Tablettes Android | 2 | traitées comme des ordinateurs (plafonds mémoire) → mobiles ; 18 appelants vérifiés (plafonds plus bas seulement) ; l'envoi au serveur dépend toujours du seul test iPhone/iPad | 7 échecs → 0 (23 UA réels) |
| TIFF to JPG | 2 | worker sans test d'OffscreenCanvas → MozJPEG sinon | échec → OK (WebKit sans OffscreenCanvas : JPEG produit) |
| Color Picker | 2 | code sans `#` ignoré → 3/4/6/8 chiffres, alpha | 1/9 → 9/9 |
| XML to JSON | 3 / 1 | pas de position d'erreur ; deux racines acceptées → « (line L, column C) », deuxième racine refusée | 0/5 → 5/5 ; 3/11 → 11/11 |
| Code Minifier (TS) | 1 | mêmes défauts que TypeScript to JS → même module | 3 échecs → 7/7 |
| env-to-json | 3 | toujours `env.json` → `variables.env` dans le sens JSON → .env | 1 échec → 4/4 |
| excel-to-csv | 3 | pas de reconversion après une option → reconversion | navigateur 5/5 |
| SVG to PNG | 3 | aperçu `[object Object]` → vraie image | échec → OK |
| Markdown Editor / Previewer | 3 | `prose` sans plugin → feuille de style limitée à l'aperçu | 0/2 → 2/2 |
| Video Watermark | 3 | estimation = durée de la vidéo → temps restant mesuré | 12 échecs → 0 |
| Audio Compressor | 3 | « MB MB » → corrigé | 2 échecs → 0 |
| Audio Equalizer (+ Video Trimmer, Image Rotate) | 3 | noms accessibles « : dB », « : ° » → « Bass gain (dB) »… | 2 échecs → 0 |
| `csso`, `fflate`, `dompurify` | 3 | importés sans être déclarés → déclarés (version installée, sans `npm install`) | 3 non déclarés → 0 (790 fichiers) |

**Comparaisons marché** notées dans chaque rapport de lot (php.net, Python `json.loads`, tsc/Babel/esbuild,
Postman et RFC 9110, Sentry et GitHub secret scanning, convertcase.net et Word, 123apps/CloudConvert/FreeConvert,
HandBrake, ExifTool, calibre, convertcsv/tableconvert, DOMParser/expat).

**Navigateur (build local, Chromium)** : `ocr-ios-direct-browser` 23/23, `excel-to-csv-reconvert` 5/5,
`dev-code-browser` tout PASS, `lot1-misc-browser` 28/28, `audio-bitrate-browser` tout PASS, `lot1-browser`
(svg, meta, tiff, pdfq, epub) tout PASS. **WebKit** : TIFF to JPG sans OffscreenCanvas → JPEG (le cas du bug) ;
EPUB PASS ; qualité PDF d'Image Converter **non exerçable** dans Playwright WebKit sous Windows (pas d'OffscreenCanvas,
refus annoncé par la page, garde antérieure à P37 — `docs/audit/p37/webkit-diagnostic.md`) : à confirmer sur un vrai Safari.

**Reportés, chiffrés (non traités)** : service vidéo acceptant taille + vitesse/miroir (≈ 1 h + déploiement Railway
par le propriétaire, puis retirer le blocage de la page) ; compiler vraiment les namespaces TypeScript
(`ts.transpileModule`, 0,5-1 j, ≈ 0,8 Mo compressé chargé au clic) ; MP2 mono à 256/320 kbit/s (norme : 192 max, ≈ 1 h) ;
`.mp2 .m4b .m4r .wv .au` au sélecteur audio (≈ 1 h) ; valeurs courtes non citées dans les messages de ≈ 5 autres
outils (≈ 15 min chacun) ; option MSI « 10 sur deux chiffres » (30 min, si voulu) ; vérification sur une vraie
tablette Android (30 min, appareil du propriétaire).

**Pages dont le texte a changé (lots 1-3)** : voir la liste en fin de rapport.

## Lot 2 — trois correctifs iPhone

1. **PDF OCR** (`docs/audit/p37/lot2-ocr-ios.md`) : sur iPhone et iPad (y compris iPadOS « Macintosh » tactile), toutes
   les pages vont directement à notre service OCR, avec l'avis affiché **avant** « Run OCR » ; tesseract.js n'est plus
   chargé ; PDF trop gros refusé avant tout envoi. Ailleurs : inchangé (essai local). Marché : iLovePDF, Smallpdf, PDF24
   font l'OCR sur serveur partout. Test `ocr-ios-direct` 0/4 → 16/16 ; navigateur (WebKit iPhone, iPad ; Chromium
   ordinateur) 23/23, `/api/pdf-ocr` intercepté. Textes : page OCR, confidentialité (date 7 octobre), À propos
   (« only on an iPhone or iPad »), FAQ de la catégorie PDF. `scripts/p33/ocr-fallback.mjs` décrit l'ancien
   comportement (obsolète pour l'iPhone).
2. **PDF Redact — rectangle ajusté** (`docs/audit/p37/lot2-redact.md`) : boîte = avance des glyphes × hauteur de police
   + encre réelle, marge max(2 % de la taille, 1 px) ; repli sur l'ancienne estimation élargie (15 %) dès que les glyphes
   ne sont pas prouvés (texte invisible OCR, opacité nulle, texte sous une image, police re-mesurée, Type 3, échec de la
   mesure au canvas). Marché : Acrobat et MuPDF couvrent les boîtes des caractères trouvés, sans marge.
   Test `redact-box-fit` 1/15 → 15/15 (voisins sous la boîte jusqu'à 10,7 pt avant ; 0 après, sauf Noto Serif Italic
   0,50 pt pour 0,75 permis).
3. **PDF Redact — arabe dans la couche invisible** : police Type 0 à ToUnicode par caractère, ordre de dessin, grappes
   lam-alef remises dans l'ordre ; police **Noto Sans Arabic** (OFL, déjà livrée par le site pour Text to PDF, réduite
   aux caractères écrits, chargée seulement s'il y a de l'arabe) — écart assumé avec la consigne « Noto Naskh » : la
   couche est invisible, la forme des lettres ne compte pas, aucun fichier ajouté. Test 0/7 → 7/7 sur 4 PDF ; en plus,
   les mots arabes avec lam-alef (« السلام ») sont maintenant trouvés et noircis (défaut d'avant P37, fuite silencieuse
   possible), et les PDF arabes de Chrome aussi (avant : « No match found »).

**Relecture indépendante de Redact (3 passes, `docs/audit/p37/relecture-redact.md`)** :

8 passes du même réviseur indépendant (il n'a pas écrit le code), chacune suivie d'une correction par l'auteur et
d'un test qui échouait avant :

| Passe | Verdict | Trouvé (→ corrigé) |
|---|---|---|
| 1 | NO-GO | D1 jambages visibles après PDF OCR (boîte calée sur le texte invisible), D2 texte en contour, D3 Type 3, D4 **lam-alef jamais trouvé (fuite silencieuse, d'avant P37)**, D5 polices re-mesurées, D6 RTL |
| 2 | GO avec conditions | N1 couche OCR cachée par une image ou une opacité nulle, N2 mesure d'encre avec une police de repli, N3 Type 3 à FontBBox fausse, N4 phrase arabe longue non trouvée (fuite), N5 sur-noircissement de mots voisins |
| 3 | GO avec conditions | R1 mot lu à l'envers noirci, R2 refus à tort pour un nom voisin (« سالم »), R3 mémoire de la passe 1 |
| 4 | NO-GO | F1 fuite créée par le contrôle final rétréci de R2 (lam-alef + chiffres, phrase coupée) — **règle du contrôleur** : le terme exact lu dans le texte est toujours noirci et toujours vérifié |
| 5 | GO avec conditions | L1 PDF de Chromium (ی, ھ), L3 tatweel, L2/L4 latin dans l'arabe et phrase coupée (refus) — toutes d'avant P37 |
| 6 | GO avec conditions | C1 **plantage sur `/SMask /None`** (6 vrais PDF sur 61, d'avant P33), L5 pages illisibles annoncées, faux refus par jonction de colonnes |
| 7 | GO avec conditions | S1 terme manqué sur une page noircie pour un autre terme : visible sur l'image → refus (et 3 vraies fuites d'avant P37 évitées sur le corpus public) |
| 8 | **GO avec conditions** | aucune fuite dans un fichier livré, aucun plantage, aucun faux refus sur 61 vrais PDF (37 arabes, 24 latins) ; **reste L5** (décision du propriétaire, ci-dessous) |

**Reste ouvert, d'avant P37 — décision du propriétaire (P37-2)** : quand PDF.js donne un texte faux sans caractère
illisible (Bulletins officiels du Maroc : « السنة » lu « النة »), un terme peut n'être trouvé nulle part et rester
lisible dans le fichier livré si un autre terme a été trouvé. La FAQ de la page le dit ; les pages à caractères
illisibles sont annoncées. Options : accepter (limite écrite) ou OCR serveur des pages suspectes, **3 à 3,5 jours**.
Autres limites assumées : phrase coupée en fin de ligne ou latin dans l'arabe → refus au lieu de noircissement
(noircir : 1 à 1,5 jour) ; motifs automatiques (e-mail, téléphone, carte) sans le contrôle des glyphes visibles.

**Incident du 06/10 vers 21 h 05** : le dossier temporaire de Windows a été presque entièrement vidé pendant le banc
(cause extérieure : ni le contrôleur ni les sous-agents n'ont lancé de suppression de dossier ; probablement le
nettoyage automatique de Windows). Perdus : les 31 PDF piégés de P33 et leurs générateurs, les fixtures de relecture.
**Reconstruits** : `scripts/p37/make-p33-traps.mjs` (dossier durable `scripts/audit/results/redact-traps/`, ignoré
par git) — avec le code actuel 0 fuite, avec le code d'avant P33 **19 vraies fuites** (les pièges mordent toujours) ;
`scripts/p37/review/regen-fixtures.sh` refait toutes les fixtures de relecture.

**Banc final sur la vraie page (build local, Chromium et WebKit iPhone)** :

Build local de `eb12175d` (code de l'application inchangé depuis), `scripts/p37/redact-final-bench.sh`, résultats
complets dans `scripts/audit/results/p37-redact-final.txt` (dossier ignoré par git) :

| Contrôle | Chromium (ordinateur) | WebKit (iPhone) |
|---|---|---|
| Boîte ajustée (15 PDF) + arabe dans la couche (4 PDF) | 15 + 4 PASS | 15 + 4 PASS |
| 21 fixtures du réviseur (encre du mot couverte, voisins) | 21/21 | 21/21 |
| 32 pièges P33 reconstruits, avec OCR | 32 ok ; 1 signal = `r2/g5-false-positive-adobe` (« Adobe » dans `/Registry (Adobe)`, faux positif voulu) | 30 ok + 2 dépassements de 30 s au clic (f5b, f12), **ok à la relance ciblée** ; même signal g5 |
| Pièges des relectures 1 à 3 (11 PDF) | 0 fuite (1 « No match » juste : « رب » absent) | idem |
| F1, L1, L3, R6 (arabe à deux termes, sur la vraie page) | terme absent du fichier livré, partout | idem |
| L2, L4, S1 (latin dans l'arabe, phrase coupée, terme manqué sur une page noircie) | **refusés** (aucun fichier donné), comme prévu | idem |
| Couche de texte invisible (P35 D3, PDF de géométrie, `SECRET-42`) | 15/15 | 15/15 |
| Plantage `/SMask /None` (emro-rc67, « 2020 ») | 64 occurrences, livré, terme absent | idem |
| Page illisible annoncée (wb-ok-content) | « No match found » + liste des pages | idem |

Les lignes `traps-r4/r5` du banc à un seul terme donnent « nomatch » : ce banc lit « a|b » comme un seul terme ; ces
cas sont couverts par `real-page-terms` (lignes F1 et L1-L4 ci-dessus) et par le rejeu Node (0 fuite).

## Lot 3 — orthographe américaine

`scripts/p37/uk-spelling-scan.mjs` (littéraux, gabarits, texte JSX ; commentaires et identifiants exclus) ;
**125 textes visibles** réécrits (« Colour » → « Color », « Bar colour » → « Bar color », « Cancelled. » →
« Canceled. », « optimised » → « optimized », « personalised », « grey », « centre », « labelled », « recognise »,
« practise », « specialised », « Millimetres »…). Gardés : codes comparés par le programme (`'cancelled'`,
`'colour'`), identifiants d'éléments, mots aussi américains. Aucune adresse de page changée. Après : 0 occurrence
visible, `content-verify` 225/0, `instructions` 0, `privacy-claims` 0 (liste d'exceptions alignée),
`us-spelling` 0. **Liste exhaustive** : `docs/audit/p37/lot3-orthographe.md`.

## Lot 4 — test de l'éditeur PDF arabe (rien en ligne)

`docs/audit/ETUDE-EDITEUR-PDF-ARABE.md` § 11 (tableau PDF par PDF, captures avant/après dans
`docs/audit/etude-arabe/p37/`). **37 PDF publics** de 10 pays arabes et d'organismes internationaux (ONU, OMS, UNESCO,
Banque mondiale…), faits par Word (14), PowerPoint, InDesign/PDF Library (7), Distiller, Acrobat, Chrome/Google Docs,
LibreOffice, 2 scans ; sources listées dans `scripts/audit/results/arabe-corpus/sources.csv` (dossier ignoré par git).
Le dossier « pdf-arabe-tests » des Téléchargements n'existe pas.

| Opération | Tout le corpus | PDF avec couche texte |
|---|---|---|
| Remplacer un mot | 20/37 (54 %) | 20/34 (59 %) |
| Supprimer une ligne | 25/36 (69 %) | 25/33 (76 %) |
| Ajouter une phrase | 34/37 (92 %) | 34/34 (100 %) |
| **Global** | **79/110 (72 %)** | **79/101 (78 %)** |

Liaison et ordre justes partout ; ancien texte vraiment retiré ; zones non touchées identiques au pixel (92/93).
Échecs : couleur/gras non recopiés (5), police de remplacement plus large (5), lignes mal regroupées (4), texte tourné
(4), Form XObject, texte hors page ; 3 PDF en image (OCR nécessaire). **Recommandation : construire, avec limites
annoncées** (pas de scans, police libre proche, pas de paragraphes justifiés en v1) — **21 à 28 jours** (v1 ligne),
26 à 36 avec paragraphes ; 0 $ d'exploitation ; condition : ≥ 90 % sur ce corpus avant toute mise en ligne
(≈ 95 % estimé après correction des défauts du prototype, à re-mesurer).

## Mise en production

<!-- PROD -->

## Pages dont le texte a changé

**79 pages** (pages d'outil, pages de catégorie, À propos, Confidentialité, Conditions) dont le texte ou les libellés ont changé — chacune revérifiée par `content-verify` (0 défaut sur les 225 pages), `instructions` et `privacy-claims` :

`about`, `ai-tools/grammar-fixer`, `audio-tools`, `audio-tools/audio-booster`, `audio-tools/audio-compressor`, `audio-tools/audio-converter`, `audio-tools/audio-equalizer`, `audio-tools/audio-merger`, `audio-tools/audio-metadata`, `audio-tools/audio-splitter`, `audio-tools/audio-trimmer`, `audio-tools/audio-waveform`, `converter-tools/color-converter`, `developer-tools/api-tester`, `developer-tools/code-minifier`, `developer-tools/color-picker`, `developer-tools/csv-to-excel`, `developer-tools/csv-to-json`, `developer-tools/csv-to-sql`, `developer-tools/diff-viewer`, `developer-tools/env-to-json`, `developer-tools/excel-to-csv`, `developer-tools/excel-to-json`, `developer-tools/hash-generator`, `developer-tools/json-to-csv`, `developer-tools/json-to-php`, `developer-tools/json-to-yaml`, `developer-tools/markdown-editor`, `developer-tools/markdown-previewer`, `developer-tools/typescript-to-js`, `developer-tools/xml-to-json`, `file-tools`, `file-tools/file-metadata`, `file-tools/zip-creator`, `file-tools/zip-extractor`, `gif-tools/gif-compressor`, `gif-tools/gif-maker`, `image-tools`, `image-tools/image-compressor`, `image-tools/image-converter`, `image-tools/image-metadata`, `image-tools/image-rotate`, `image-tools/png-to-ico`, `image-tools/png-to-jpg`, `image-tools/round-corners`, `image-tools/svg-to-png`, `image-tools/tiff-to-jpg`, `image-tools/tiff-to-png`, `image-tools/webp-to-jpg`, `pdf-tools`, `pdf-tools/epub-to-pdf`, `pdf-tools/image-to-pdf`, `pdf-tools/jpg-to-pdf`, `pdf-tools/pdf-compress`, `pdf-tools/pdf-editor`, `pdf-tools/pdf-merge`, `pdf-tools/pdf-number-pages`, `pdf-tools/pdf-ocr`, `pdf-tools/pdf-redact`, `pdf-tools/pdf-sign`, `pdf-tools/pdf-split`, `pdf-tools/pdf-watermark`, `privacy`, `qr-barcodes-tools/barcode-generator`, `qr-barcodes-tools/qr-generator`, `terms`, `text-tools/case-converter`, `text-tools/sticky-notes`, `text-tools/text-comparator`, `text-tools/word-counter`, `video-tools`, `video-tools/media-player`, `video-tools/screen-recorder`, `video-tools/video-converter`, `video-tools/video-merger`, `video-tools/video-rotator`, `video-tools/video-to-audio`, `video-tools/video-trimmer`, `video-tools/video-watermark`.
