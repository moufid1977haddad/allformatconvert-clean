# Audit de fidélité Office → PDF — rapport final

Dates : 2026-09-18 (phases 0–2) et 2026-09-19 (reprise : comparaison marché,
phase 4 complète, défauts chiffrés). Tout ce qui est écrit ici a été mesuré ;
ce qui ne l'a pas été est dit explicitement. Les preuves visuelles sont dans
`docs/audit/fidelite-marche/`.

## 0. Réconciliation Railway — TERMINÉ

Détail complet dans `claude/REFERENCE-projet.md`. Résumé :

- **gotenberg-v2** est le service réellement utilisé en production (16 requêtes
  HTTP réelles sur 7 jours).
- **gotenberg-fonts** ne reçoit quasiment plus de trafic (3 requêtes en 7 jours)
  et coûte environ **2 $/mois**. Aucune référence croisée Railway entre les
  deux services. **Recommandation : supprimer gotenberg-fonts — décision à
  valider par l'utilisateur, rien n'a été supprimé, renommé ni mis en veille.**
- Deux services non documentés identifiés : `pdf-tools` (backend
  pdf-repair/pdf-to-pdfa, actif 24h/24 alors que ces outils sont « Coming
  Soon ») et `allformatconvert-clean` (en réalité le backend de détourage).

## 1. Corpus — TERMINÉ

`docs/audit/fixtures-fidelite/generate_fixtures.py` génère 6 fichiers
déterministes : `fidelite-01/02.docx`, `fidelite-03/04.xlsx`,
`fidelite-05/06.pptx`. Deux bugs du générateur ont été trouvés et corrigés à
l'époque (regex de notes de bas de page ; zone d'impression excluant le
graphique).

## 2. Mesure via le pipeline de production — TERMINÉ (une correction, voir 06)

Fait établi (métadonnée PDF `Producer`) : en production, `.docx` passe par
**ConvertAPI** (`CONVERTAPI_ENABLED=true`) ; `.xlsx`/`.pptx` (et
`.doc/.xls/.csv/.ods/.ppt`) par **Gotenberg / LibreOffice 26.2.5.2**. Les six
PDF ont été régénérés le 2026-09-19 via `https://www.onlineconvertools.com/api/convert-to-pdf`
(HTTP 200 pour les six, mêmes moteurs et mêmes nombres de pages qu'hier).

| Fichier | Moteur | Pages | Verdict |
|---|---|---|---|
| 01.docx | ConvertAPI | 3 | FIDÈLE (TOC non recalculée, comme tous les concurrents mesurés) |
| 02.docx | ConvertAPI | 1 | FIDÈLE |
| 03.xlsx | LibreOffice | 1 | FIDÈLE sauf gras en police à empattements (défaut D1) |
| 04.xlsx | LibreOffice | 5 | FIDÈLE ; découpe des feuilles larges (D4) |
| 05.pptx | LibreOffice | 3 | FIDÈLE |
| 06.pptx | LibreOffice | 1 | **DÉGRADÉ** (révisé, voir ci-dessous — le rapport d'hier disait « mineure ») |

**Révision de 06 (mesurée en comparant à FreeConvert, où le titre tient sur
une ligne)** : chez nous, Segoe UI est remplacée par Noto Sans, plus large ;
le titre « Titre superposé (police absente : Segoe UI) » se replie sur deux
lignes et sa seconde ligne (« … Segoe UI) ») est **masquée par la zone de
texte superposée**. Du texte devient illisible. Ce n'est pas une dégradation
« mineure » : voir D2. Preuve : `fidelite-marche/06-pptx-nous-vs-freeconvert.png`.

Points de mesure conservés de la phase 2 : polices Calibri/Cambria/Arial/Arial
Narrow réellement embarquées côté ConvertAPI ; formules SOMME/SI/RECHERCHEV
recalculées côté LibreOffice ; mise en forme conditionnelle, formats
monétaires, cellule fusionnée, `fit-to-page` respectés ; masque, puces à deux
niveaux, image plein écran, dégradé, tableau, camembert corrects.

## 3. Comparaison marché — TERMINÉ (partiel : 2 concurrents exploitables sur 4 tentés)

Méthode (identique à la phase 2) : les six fixtures passées **manuellement, une
par une, par moi, sans agent de fond** ; PDF récupérés ; rendu PNG à 70 dpi
(`pdftoppm`) ; montage côte à côte page à page ; **différence de pixels** par
page (`diff.py` : pixels dont le gris diffère de plus de 60/255) ; polices via
`pdffonts` ; producteur via `pdfinfo`. Scripts : `fidelite-marche/mont.py`, `diff.py`.

### 3.1 Concurrents tentés

| Concurrent | Résultat | Détail |
|---|---|---|
| **FreeConvert** | 6/6 exploitables | pages dédiées docx/xlsx/pptx ; sans compte ; plusieurs fichiers d'un coup ; file d'attente visible (~10–30 s) ; publicités ; « Max file size 1 GB » affiché ; producteur déclaré `Microsoft® Word 2021` / `Excel® 2021` / `PowerPoint® LTSC` ; aucun filigrane |
| **Online2PDF** | 6/6 exploitables | sans compte, 1 fichier converti à la fois dans nos essais, publicités, limites affichées **150 Mo/fichier, 200 Mo au total** ; producteur `Online2PDF.com` ; aucun filigrane ; page dédiée par famille de format |
| **CloudConvert** | 0/6 | **bloqué** : « Your daily limit of 10 conversion credits exceeded » (quota gratuit sans compte : 10/jour, épuisé) ; créer un compte est interdit par les règles de la session ; le point de donnée d'hier (5 s, 295 Ko) reste non comparé |
| **iLovePDF** | 0/6 | la conversion aboutit (« WORD file has been converted to PDF ») mais le clic « Download PDF » **fige l'onglet** dans cet environnement d'automatisation (2 essais, 2 gels) ; arrêt conformément à la règle des 2–3 échecs ; aucun PDF analysé |

**Limite honnête de la comparaison : l'exigence « au moins trois convertisseurs »
n'est pas remplie en sorties exploitables (2 sur 3).** De plus FreeConvert et
Online2PDF donnent des sorties pptx quasi identiques au pixel près (05 : 0/119/5852
vs 0/106/5851 pixels différents de nos pages) : ils reposent probablement sur le
même moteur, donc **ce ne sont pas deux avis indépendants**. Seul FreeConvert
déclare Microsoft Office comme producteur ; pour Online2PDF le producteur est
`Online2PDF.com` (moteur non identifié). Aucun texte du site ne prétend donc
plus qu'« un accord avec deux autres convertisseurs en ligne ».

### 3.2 Résultats fichier par fichier (pixels différents / pixels de la page)

| Fixture | vs FreeConvert | vs Online2PDF | Lecture |
|---|---|---|---|
| 01.docx | p1 380, p2 38, p3 0 /458 150 | p1 0, p2 40, p3 0 | **Identique** (TOC non recalculée aussi chez eux : « Mettre à jour les champs… ») |
| 02.docx | p1 1 109 /458 150 (0,24 %) | 643 (0,14 %) | **Identique** (notes de bas de page, filigrane, Arial Narrow embarquée partout) |
| 03.xlsx | 58 647 (page différente) | tailles de page différentes (Letter/A4) | Tableau, échelle de couleurs, formats équivalents. **Écart : gras** (D1) et **graphique** (D5) |
| 04.xlsx | 3 pages Letter mises à l'échelle (nous : 5 pages A4) | 5 pages A4 (**comme nous**) | Formules identiques ; découpe des colonnes : Online2PDF comme nous, FreeConvert réduit pour tenir (D4) |
| 05.pptx | p1 0, p2 119, p3 5 852 /367 500 | p1 0, p2 106, p3 5 851 | **Équivalent** (les 5 852 px = camembert, position légèrement différente ; même contenu et mêmes proportions) |
| 06.pptx | 13 207 /490 350 | 13 207 | **Écart réel** : le titre chez eux tient sur 1 ligne (vraie Segoe UI), chez nous il se replie et est masqué (D2) |

Détails utiles :
- **Gras Excel** : chez FreeConvert et Online2PDF, `pdffonts` liste `Calibri-Bold`
  (sans empattements). Chez nous `Caladea` (avec empattements). Le défaut D1
  est donc confirmé par comparaison, pas seulement par nos propres mesures.
- **Graphique 03** : chez les deux concurrents, le graphique est rendu de façon
  visiblement dégradée (10 séries et légende 1–10, titre chevauché, barres
  collées). Chez nous : une série « Montant », titre et axes propres. Le
  générateur (`openpyxl`, `add_data` sur une seule colonne) définit **une**
  série. **Je ne peux pas dire lequel est le plus proche d'Excel de bureau**
  (pas d'Excel sous la main) : je n'affirme donc rien sur les graphiques, sinon
  qu'ils diffèrent.
- **Taille de page** : Online2PDF sort du Letter pour les docx (comme nous : même
  nombre de pixels), A4 pour les xlsx.

### 3.3 Limites, filigrane, compte, quota, couverture

| | Nous | FreeConvert | Online2PDF | CloudConvert |
|---|---|---|---|---|
| Taille max/fichier (gratuit) | **25 Mo** (code : `MAX_CONVERTAPI_FILE_BYTES`, `MAX_FILE_SIZE_BYTES`) | 1 Go affiché | 150 Mo (200 Mo total) | non vu |
| Filigrane | non | non | non | non vu |
| Compte obligatoire | non | non | non | non pour tenter, **mais quota épuisé** |
| Quota gratuit | défaut code : **5 conversions PDF/utilisateur** (`USER_QUOTA_PDF_CONVERSIONS`), **10/h et 30/jour par IP** ; les valeurs de production n'ont pas été lues (interdit de lire les variables d'environnement) | non atteint en 6 fichiers | non atteint en 6 fichiers | **10 crédits/jour** (atteint) |
| Publicités | non | oui, nombreuses | oui | non vu |
| Plusieurs fichiers d'un coup | non (1 à la fois) | oui (testé : 2) | 2 champs de fichier (fusion), 1 fichier converti à la fois dans nos essais | oui (« Add more files ») |

**Couverture de formats.** Nous : entrée `.docx .doc .xlsx .xls .csv .ods .pptx
.ppt`, sortie PDF uniquement, plus outils séparés (`pdf-to-word` → docx
seulement ; `pdf-to-excel`, `pdf-to-ppt` sont « Coming Soon »). FreeConvert :
convertisseur généraliste (documents, images, vidéo, audio, e-books, archives)
avec pages dédiées `docx/xlsx/pptx → pdf`. Online2PDF : pages dédiées
Word/Excel/PowerPoint → PDF et sa page d'accueil annonce OCR (100 pages max)
et fusion/édition/déverrouillage. **Je n'ai pas inventorié exhaustivement les
formats d'entrée/sortie des concurrents** (pas de liste complète relevée, sauf
les pages testées) : je n'affirme donc pas d'écart de couverture précis, sauf
que **la conversion PDF → Excel/PowerPoint et l'OCR n'existent pas chez nous
aujourd'hui alors qu'Online2PDF annonce l'OCR**.

**Ce que la comparaison prouve, en une phrase.** Sur docx, notre sortie est
indiscernable de celle de FreeConvert et d'Online2PDF ; sur pptx, équivalente
sauf substitution de police (06) ; sur xlsx, équivalente sauf le gras (03/04)
et la découpe des colonnes larges. Notre limite (25 Mo, 5 conversions par
utilisateur par défaut) est **bien plus stricte** que celle des concurrents
gratuits testés : c'est le vrai désavantage concurrentiel mesuré, pas la
fidélité.

## 4. Correction des promesses — TERMINÉ pour les 5 outils

Règle appliquée : chaque affirmation du site (page, `SeoContent`,
`layout.tsx` title/description/OpenGraph) est soutenue par une mesure ci-dessus ;
« professional-quality », « accurate » global, « far more accurately than
in-browser », « same engine used by enterprise pipelines », « significantly
better fidelity » ont été **supprimés** (comparaisons jamais mesurées). Build
local (`npm run build`, dont `check-links`) : exit 0.

| Outil | Ce qui a changé | Mesure qui le soutient |
|---|---|---|
| word-to-pdf | retrait « professional-quality » ; description = éléments testés + « identique à deux autres convertisseurs » ; limites : TOC non recalculée, `.doc` non mesuré ; SEO : **ne dit plus « LibreOffice »** (faux pour `.docx`, qui passe par ConvertAPI) et ne dit plus « Wingdings comme seule exception » (faux depuis la TOC) | 01, 02, §3.2 |
| excel-to-pdf | retrait « professional-quality » et « moteur des pipelines d'entreprise » ; éléments testés ; graphique « à vérifier » ; nouvelle FAQ sur les feuilles larges ; astuce « ajuster à 1 page en largeur » (03 le prouve) ; « .xlsx seulement mesuré » | 03, 04 |
| ppt-to-pdf | retrait « professional-quality » ; **ajout de la divulgation D2** : la police de substitution peut être plus large, le titre se replie et peut être masqué (06) ; conseil « éviter les polices Windows dans des zones étroites » ; « .pptx seulement mesuré » ; retrait du conseil non mesuré « intégrez les polices » | 05, 06 |
| pdf-to-word | retrait « professional-quality/fonts and layout accurately » ; texte fondé sur l'aller-retour mesuré (voir ci-dessous) ; **SEO corrigé : il affirmait encore « extrait le texte brut, entièrement dans votre navigateur »**, faux en production (la page et le SEO se contredisaient) | §4.1 |
| html-to-pdf | retrait « professional-quality/accurate » ; texte fondé sur la comparaison à Chrome (voir ci-dessous) ; SEO idem | §4.2 |

### 4.1 pdf-to-word — mesure faite ce jour

`fidelite-01.pdf` et `fidelite-02.pdf` (issus du pipeline Word) → `/api/pdf-to-word`
en production (HTTP 200, `.docx` valides 16 Ko et 30 Ko), inspection du XML :
1 tableau, 2 sections à 2 colonnes, 6 styles Titre, 10 éléments de liste,
en-tête/pied, 1 image (fichier 01) ; 1 image et pied de page (fichier 02). Puis
reconversion de ces `.docx` via `/api/convert-to-pdf` (ConvertAPI) et comparaison à
l'original : 01 → 3 pages, 17 293/12 418/1 260 pixels différents (3,8 %/2,7 %/0,3 %),
02 → 1 page, 4 650 pixels (1,0 %). Visuellement (montage
`pdf-to-word-aller-retour-01.png`) : titres, tableau à cellule fusionnée, listes,
image avec habillage, colonnes, notes de bas de page, filigrane présents et en
place, écarts limités à des décalages d'un pixel de lignes. **Limite : 2 PDF,
tous deux produits par Word ; PDF issus d'autres logiciels, scans, formulaires
non testés** — le site le dit.

### 4.2 html-to-pdf — mesure faite ce jour

Page de test (`fidelite-marche/html-to-pdf-test.html` : grille CSS, flexbox,
dégradé + ombre, tableau à cellule fusionnée, 2 colonnes, SVG, `@media print`,
accents) rendue par la production (`/api/convert-html-to-pdf`, HTTP 200,
`Skia/PDF m151`, Letter) et par Chrome local (`Skia/PDF m153`, Letter) : mise en
page identique (21 011 pixels différents sur 458 150, tous dus à la police). Le
bloc `@media print` est bien appliqué. **Différence réelle** : Georgia →
`Liberation Serif` et Arial → `Liberation Sans` côté serveur (`pdffonts`) ;
les retours à la ligne peuvent bouger légèrement — dit sur le site.

## 5. Défauts chiffrés — TERMINÉ

Aucun code n'a été corrigé dans cette passe (consigne). Coûts = estimations,
non validées, en temps de travail (incluant déploiement bleu/vert Gotenberg
déjà documenté dans `RAPPORT-gotenberg-versionne.md` et retest des 6 fixtures).

| # | Défaut | Gravité | Cause probable | Coût | Vaut la peine ? |
|---|---|---|---|---|---|
| D1 | Gras Excel/LibreOffice en police à empattements (Caladea au lieu de Carlito) — **confirmé par les 2 concurrents** qui sortent `Calibri-Bold` | **Modérée** : touche presque tout classeur avec en-têtes en gras, texte lisible et bien placé | Hypothèse **non vérifiée** : `services/gotenberg/fonts.conf` ne traite que « Calibri Light » et « Arial Narrow », pas le gras de « Calibri » | Faible : 0,5–2 h (règle fontconfig + rebuild image + bleu/vert + retest 03/04) | **Oui, priorité 1** ; retirerait aussi la divulgation « bold serif » du site |
| D2 | Police absente (Segoe UI) → Noto Sans plus large : titre replié et **partiellement masqué** par une forme superposée (06) | **Modérée à élevée** sur les présentations qui utilisent des polices Windows (Segoe UI est courante) : texte illisible | Aucune police métriquement compatible avec Segoe UI dans le conteneur | Faible à moyen : 1–3 h + **vérification de licence** de toute police ajoutée (la démarche « licence commercialement sûre » existe déjà pour les polices actuelles) ; candidate à évaluer : Selawik (conçue comme remplaçante métrique de Segoe UI) — **non testée ni vérifiée** | **Oui, priorité 2** |
| D3 | TOC Word non recalculée | Mineure | Comportement du moteur ; **identique chez FreeConvert et Online2PDF** (la mise à jour d'un champ exige l'application Word) | Non applicable | Non : divulgation faite |
| D4 | Feuille Excel large sans zone d'impression → 5 pages A4 par groupes de colonnes (FreeConvert : 3 pages réduites ; Online2PDF : 5 pages comme nous) | Mineure | Comportement par défaut | Moyen si on voulait « ajuster à la largeur » (change le rendu de tous les classeurs) | Non : divulgation + conseil « ajuster à 1 page » faits |
| D5 | Graphique Excel : rendu différent des deux concurrents | **Inconnue** (on ne sait pas qui est le plus proche d'Excel) | Indéterminée | 30 min pour trancher avec un Excel de bureau | Non tant qu'aucun cas utilisateur ne le signale ; le site dit « à vérifier » |
| D6 | **Retour silencieux latent** de `pdf-to-word` vers l'extraction de texte brut côté navigateur quand `PDF_TO_WORD_CONVERTAPI_ENABLED` est désactivé (la page ne dit alors rien) | **Modérée, latente** : si le drapeau est coupé, la promesse « garde titres, tableaux… » devient fausse sans le dire | Code existant (`convertClientSide`) ; contraire au principe « pas de repli silencieux » | Faible (1 h) : ou message visible, ou retrait du repli — **décision à valider** | **Oui**, mais après D1/D2, sur décision de l'utilisateur |
| D7 | Le repli `.docx` → LibreOffice (si `CONVERTAPI_ENABLED` coupé) n'a **jamais été mesuré** ; `.doc/.xls/.ppt/.csv/.ods` non plus | **Inconnue** | — | 1–2 h (mêmes fixtures via un Gotenberg de test) | **Oui** avant de couper ConvertAPI un jour |
| D8 | Nos limites (25 Mo ; 5 conversions/utilisateur par défaut ; 10/h et 30/jour par IP) plus strictes que Online2PDF (150 Mo) et FreeConvert (1 Go) | Pas un défaut de fidélité, un **écart concurrentiel mesuré** | Choix de coûts (ConvertAPI ≈ 0,01 $/conv., plafond global 20 $) | Décision produit | À trancher par l'utilisateur ; non touché |

**Ordre recommandé** : D1 → D2 → D7 → D6. Rien n'est CASSÉ sur les 6 fichiers ;
D2 est le seul cas où du texte est réellement perdu à l'écran.

## 6. Documents — TERMINÉ

- `claude/REFERENCE-projet.md` : mis à jour (concurrents, chiffres, règle de
  rédaction des promesses).
- `claude/plan-de-travail.md` : créé (n'existait pas ; **aucun troisième
  document de tâches**, comme demandé).

## 7. Vérification en production et déploiement

Merge `c802a01e` sur master, déploiement Vercel `dpl_9WWW7iSFsGGsKYWE97p5AjwrdVwm` (resté QUEUED quelques minutes, puis en ligne). Vérification en production le 2026-09-19 (`curl` des 5 pages) : plus aucune occurrence de « professional-quality », le texte « In our tests… » présent dans le corps de chaque page (5 à 7 occurrences) **et** dans la balise `<meta name="description">` des cinq outils ; ppt-to-pdf contient la divulgation D2. Vérification par lecture du HTML servi, pas par test fonctionnel de conversion (les textes seuls ont changé, aucun code de conversion).

## 8. Interdits respectés / incidents

- Aucun agent de fond utilisé ; toutes les conversions faites à la main.
- Aucun `.env`/secret lu ; seul le fichier `lib/quota/config.js` (noms et valeurs par défaut du code) a été consulté ; aucune valeur de repli ajoutée.
- Aucune boucle de surveillance, aucun réveil planifié.
- Aucun outil supprimé ni renommé ; `services/gotenberg` non touché.
- Onglet iLovePDF gelé, fermé ; fichiers de test laissés dans `Downloads` (Chrome les
  verrouille : `fidelite-01..06.pdf`, à supprimer à la main).
- Pas de compte créé chez aucun concurrent.
