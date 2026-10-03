# RAPPORT P28 — Gotenberg 8.37, équations Word, PDF Repair (04/10)

Demandé par le propriétaire (prompt P28), présent, mises en production comprises. Branche `p28-gotenberg`, repère de
restauration `restauration-avant-p28-04-10` = `6a8af4be` (master avant P28). Autorisations : `railway up` et toute
modification de Gotenberg (`gotenberg-v2`, `gotenberg-fonts`) et de `pdf-tools`, aux conditions de P26 (version
précédente notée et remise en un geste, nouveau comportement vérifié en ligne avant de brancher les pages, aucune autre
variable, aucun nouveau service payant, facture mesurée). Aucune dépense hors Railway ; rien sur Supabase.
Décisions du propriétaire notées au plan : Google Analytics reste chargé comme aujourd'hui ; le panorama de 63 Mpx est
dans sa passe iPhone (test 26). Rapport complété après chaque lot.

## 0. Récapitulatif

| Lot | Contenu | État |
|---|---|---|
| 1 | Gotenberg 8.36 → **8.37.0** (équations Word rétablies) | ✅ **en production** (`gotenberg-v2` `26130544`, fusion `e060eb63`) |
| 1b | Trouvé en route : **Aptos** (police par défaut d'Office depuis 2024) rendue en police à empattements → Liberation Sans | ✅ **en production** (`gotenberg-v2` `8e8e178d`, fusion `df37f58e`) |
| 2 | Équations des ODT écrits par Word (MathML « à plat ») | ✅ **en production** (site `onlineconvertools-jcglmx2uu`, fusion `03aa60d1`) |
| 3 | PDF Repair : texte contrôlé, deux méthodes de plus | ✅ **en production** (pdf-tools `ab0077fd` + site, fusion `03aa60d1`) : 19 textes altérés en silence → 0 ; 64 refus → 25 |

## 1. Lot 1 — Gotenberg 8.37.0

### 1.1 État lu avant (règle zéro)
Railway, projet `fortunate-manifestation` : `gotenberg-v2` (production, 8.36.0, déploiement `930bc129`),
`gotenberg-fonts` (même image, sans trafic de production, `55fa4c41`). 8.37.0 (11/09) est toujours la dernière version
publiée le 04/10 ; empreinte lue à l'API du registre Docker Hub : `sha256:f29984bd…c769` (celle relevée par P27).
Notes de version : `libreoffice-math` (retiré par l'allègement de l'image en 8.30) revient — **c'est la cause de la
perte des équations** ; Chromium 152.0.7977.82, LibreOffice 26.8.0 ; plages 100.64/10 et 198.18/15 internes ;
identifiants d'URL retirés avant les listes ; bornes contre les pages hostiles.

### 1.2 Construction à côté, sans couper le service
`railway up` d'un dossier ne contenant que `services/gotenberg` (octets exacts du dépôt, `git archive` sans conversion
de fins de ligne) vers `gotenberg-fonts` seulement. Un premier envoi a échoué à la construction (copie Windows : fins
de ligne CRLF de la licence Selawik, dont l'empreinte est vérifiée) : sans effet, 8.36 restait servie (corollaire 4) ;
deuxième envoi `aa7f7e2c` en ligne, `/version` = 8.37.0, journaux de démarrage sans avertissement.

### 1.3 Banc des documents (pixel et texte, `scripts/p27/gotenberg-compare.mjs` + `scripts/p26/compare-pdfs.mjs`)
43 documents de P27 + **16 documents à équations** (`scripts/p28/equations/corpus`, provenance dans `SOURCES.md` :
Office Math écrit par Word dans 6 formats, objets Equation 3.0 / MathType 6, objets LibreOffice Math, fichiers de test de
LibreOffice et d'Apache POI) = 59 ; puis + 2 fichiers Office 2024 au thème Aptos (lot 1b) = 61.
- 8.37 : deux passages **identiques 59/59** (stable).
- 8.36 → 8.37 : **28 identiques, 31 différents**, chacun regardé :
  - **17 documents à équations** : 8.36 perdait les équations (Office Math en .docx/.docm/.dotx/.rtf : rien ;
    Equation 3.0 : rien ; objets LibreOffice Math sans image de secours : une icône de pièce de puzzle) ; **8.37 les rend
    toutes** (comparées au PDF de Word lui-même, `ref-word.ps1`). Écarts restants, mineurs : en RTF les équations sont
    alignées à gauche (Word : centrées) ; une équation colorée par Word sort en noir ; police de formule de LibreOffice
    (Liberation Serif / OpenSymbol), LibreOffice ignorant « Cambria Math » — même rendu que LibreOffice de bureau.
  - **Excel `fidelite-03` (et ses 3 copies xlsm/xltm/xltx)** : graphique identique, quadrillage un peu plus marqué —
    équivalent (Excel lui-même rend ce graphique autrement, c'est le défaut D5 déjà connu).
  - **PowerPoint (9 fichiers)** : camembert de `fidelite-05` un peu plus grand, **plus proche de PowerPoint** ;
    `fidelite-06` identique à l'œil (défaut D9 connu, présent dans les deux) ; motifs de `slides.pot` identiques à l'œil.
  - **`slides.odp`** (fichier écrit à la main, **sans aucun style**) : la forme passe du bleu au vert à texte blanc.
    C'est le nouveau style par défaut de LibreOffice : le LibreOffice de bureau actuel rend ce fichier en vert lui aussi ;
    PowerPoint ne l'ouvre pas. Sur de **vrais** ODP (écrits par LibreOffice, avec styles) : identiques, sauf le même
    camembert.
- **Verdict : fidélité égale ou meilleure partout** → bascule.

### 1.4 Adresses internes (sondes de P26 élargies, `scripts/p26/gotenberg-probe.mjs`)
Ajout des cas que 8.37 dit corriger : identifiants avant l'hôte (`http://example.com@127.0.0.1`), noms DNS publics
pointant vers 127.0.0.1 / 100.64.0.1 / 198.18.0.1 / 10.0.0.1 / 169.254.169.254 (nip.io), redirection publique vers la
boucle locale, et la route URL elle-même. Sur 8.36 (production) et 8.37 (à côté), puis 8.37 en production : **27
adresses internes jamais atteintes**, la route URL répond 403 aux internes, la redirection donne la page d'erreur de
Chromium ; le contrôle public (example.com) passe. Côté LibreOffice : un `.fodt` avec section et image liées vers une
adresse interne ou publique ne charge rien, sur les deux versions.

### 1.5 Revue de sécurité indépendante — « GO avec conditions »
Lecture des sources 8.36.0 et 8.37.0 : aucune variable renommée ni désactivée (toutes nos protections gardent nom et
sens), aucune nouvelle route ouverte, télémétrie plus fermée, notre liste de refus inchangée dans son effet (8.37 classe
lui-même CGNAT/198.18 comme internes : notre ajout fait doublon sans nuire) ; LibreOffice 26.8.0 sans CVE ouverte ;
Chromium 152 corrige une faille V8 exploitée (CVE-2026-85046) que 8.36 n'avait pas. Conditions : journaux de démarrage
sans avertissement et `/version` = 8.37.0 → **vérifiés** avant la bascule. **Risque restant, ancien et plus grand en
8.36** : Chromium tourne sans bac à sable avec JavaScript actif et l'outil HTML to PDF lui passe le HTML déposé tel quel ;
Chromium 152 ne corrige pas CVE-2026-87491 (corrigée en 153). → au plan (§6).

### 1.6 Bascule et vérifications
Fusion `e060eb63` (sans poussée forcée) : `gotenberg-v2` → `26130544` (8.37.0), `gotenberg-fonts` et `pdf-tools`
reconstruits sur le même commit (pdf-tools : même code). **Retour arrière prêt : Railway → `gotenberg-v2` → déploiement
`930bc129` → Rollback** (image et variables d'avant). Après : banc de production **59/59 identiques** à la mesure faite à
côté, sondes : aucune adresse interne atteinte. **www** : `www-light` 29/29 ; une vraie conversion par outil Gotenberg
par les pages (Word .odt, **Word à équations .rtf**, Excel, PowerPoint, HTML, EPUB, MOBI, URL) 8/8 — les équations sont
dans le PDF. Préversion Vercel non faite pour ce lot : le code du site ne change pas (la bascule est côté Railway).

### 1.7 Ce que font les concurrents (relevé du 04/10)
- **iLovePDF** : ses PDF portent « Creator: Microsoft Word 2016 » — il convertit avec **Word lui-même**. Rendu identique à
  Word, équations comprises, y compris l'ODT écrit par Word.
- **Smallpdf** : moteur propre (police mathématique libre Asana Math) ; Office Math rendu correctement ; **perd les
  équations** de l'ODT écrit par Word ; MathType/Equation 3.0 rendus en gris pâle.
- Nous (8.37) : équations rendues partout ; l'ODT écrit par Word illisible (§3) ; police de formule de LibreOffice.

## 2. Lot 1b — trouvé en route : Aptos rendu en police à empattements
Word, Excel et PowerPoint utilisent **Aptos** par défaut depuis 2024 (police « cloud » de Microsoft, non
redistribuable, sans équivalent métrique libre). Sans règle, LibreOffice tombait sur **Noto Serif** : tout document
Office récent sortait en police à empattements. Mesure des largeurs (fontTools, même texte anglais/français) : Liberation
Sans +3,1 % (vrais italiques), Selawik +2,6 % (sans italique), Carlito −5 %, Noto Sans +9,5 % ; Aptos Display +10,6 %
(Liberation Sans), Aptos Narrow −7,8 % (Liberation Sans Narrow), Aptos Serif +0,6 à 2,2 % (Liberation Serif). Règles
fontconfig ajoutées (`services/gotenberg/fonts.conf`). Mesure sur `gotenberg-fonts` d'abord : **seuls les 7 documents
écrits avec Aptos changent** (texte identique hors mise en page), et deux fichiers créés par Office 2024 : **classeur
Excel (Aptos Narrow) : 1 page chez Excel, 2 pages avant la règle (colonne « Commentaire » rejetée), 1 page après** ;
diapositives en Liberation Sans de largeur proche de PowerPoint. Fusion `df37f58e` → `gotenberg-v2` `8e8e178d` ; banc de
production identique à la mesure à côté ; sondes propres ; www 8/8 (texte en Liberation Sans).
Retour arrière : déploiement `26130544` (8.37 sans la règle) ou `930bc129` (8.36).

## 3. Lot 2 — équations des ODT écrits par Word
**Constat (mesuré)** : un document Word enregistré en ODT (« Enregistrer sous… OpenDocument ») porte ses équations en
objets formule au MathML « à plat » (les parties directement sous `<math>`, sans `<mrow>`) et en lettres
mathématiques Unicode (𝑥, 𝜕, 𝛻 : l'italique mathématique de Word). LibreOffice les empile verticalement avec une marque
d'erreur « ¿ » et n'a pas de glyphe pour ces lettres — en 8.37 comme dans LibreOffice 26 de bureau (en 8.36 : une icône
de pièce de puzzle). iLovePDF (Word) les rend juste, **Smallpdf les perd**.
**Cause et moyen** : MathML donne un sens standard aux deux : un seul `<mrow>` autour des parties, et la lettre de base
avec `mathvariant`. Essai sur LibreOffice de bureau puis sur Gotenberg 8.37 : équations lisibles, au niveau de Word et
d'iLovePDF (reste : crochets de matrice non étirés).
**Correction** (`lib/odtWordMath.js`, appelée par `/api/convert-to-pdf` pour .odt/.ott, sur le modèle de
`lib/xlsxDefaultFont.js`) : seuls les objets formule **sans `<semantics>`** (ceux de LibreOffice en ont toujours un) sont
réécrits ; tout autre fichier part octet pour octet ; un fichier illisible part comme avant (raison écrite au journal).
Revue indépendante appliquée : seuls italique, gras, gras italique sont convertis (𝔼, 𝟙… laissés : LibreOffice
dessinerait E, 1 — faux mais plausible) ; table explicite des variantes grecques (NFKC confondrait 𝜙/𝜑, 𝜖/ε) ; un jeton
qui mêle lettres mathématiques et texte ordinaire est laissé tel quel. Test `scripts/p28/test-odt-word-math.mjs`
(18 cas + corpus réel : 6 objets réécrits dans l'ODT de Word, 0 dans celui de LibreOffice, `mimetype` gardé en tête et
non compressé). Préversion puis www : la conversion par la page donne le PDF mesuré en direct (identique au pixel).
**Non mesuré** : le `.docx` passe par ConvertAPI en production ; son rendu des équations demanderait un appel payant
(≈ 0,01 $, interdit dans ce chantier) — aucune promesse ajoutée à la page Word to PDF.

## 4. Lot 3 — PDF Repair : aucun texte altéré sans le dire
### 4.1 Mesure avant (service en ligne, Ghostscript 10.00, qpdf 11.3)
Corpus permanent : 248 copies abîmées (`scripts/p28/repair/make_damaged.py` : troncature à 90 % et 60 %, fin de
fichier coupée, table xref décalée, 2 Ko effacés au milieu, longueurs de flux fausses, `endobj` retirés, octets parasites
en tête) des 31 PDF de texte de P27 (grec, arabe, chinois, ligatures, accents décomposés). Banc
`scripts/p28/repair/bench-service.mjs` (texte relu ici par Ghostscript et Poppler, comparé à ce qu'ils lisent dans le
fichier abîmé et dans l'original). **Avant : 184 livrés, 64 refusés ; 35 livrés par le repli Ghostscript, dont 19 avec
un texte différent de celui que les lecteurs trouvent dans la source — sans le dire.** En local (Ghostscript 10.07,
qpdf 12.4) le repli ne se déclenchait jamais : seule la mesure sur le vrai service montrait le défaut. Trouvé aussi :
qpdf 12 peut perdre un objet et livrer un texte amputé d'une phrase que les deux lecteurs lisent encore dans la source.
### 4.2 Ce que fait le marché
iLovePDF répare avec un moteur commercial (« 3-Heights PDF Analysis & Repair », pdf-tools.com) : il reconstruit l'arbre
des pages des PDF tronqués (texte d'origine retrouvé) ; sur le PDF effacé au milieu il livre exactement le texte lisible
de la source ; il échoue (sans fichier) sur 3 tronqués sur 4 que nous refusons aussi.
### 4.3 Correction (service pdf-tools, `src/repair.js`, `py/rebuild_pages.py`)
Méthodes dans l'ordre : qpdf → **Poppler** (`pdfunite` : recopie les pages lues par Poppler ; signets et balisage non
repris, dit) → **reconstruction de l'arbre des pages** (fin de fichier perdue : nouveau catalogue au-dessus de l'arbre des
pages survivant, ou, s'il est perdu, des pages autonomes dans l'ordre du fichier — une seule révision exigée, « vérifiez
l'ordre et qu'aucune page supprimée ne réapparaît » dit) → Ghostscript. **Chaque résultat n'est livré que si son texte
est celui que Ghostscript et Poppler lisent dans le fichier abîmé** (même règle que les PDF/A de P27 : mêmes caractères
pour chaque lecteur qui lit la source, mêmes mots pour au moins un, et même nombre de pages pour Poppler). Si aucun
lecteur n'ouvre la source, seule une réparation structurelle (contenu des pages non réécrit) est livrée, et la page dit
que le texte n'a pas pu être comparé. Sinon : rien, et une phrase claire. Lecture de la source en parallèle des
réparations ; délai propre de 200 s (site : 230 s). Page : méthode, lecteurs utilisés, avertissements, FAQ.
### 4.4 Revue indépendante (« GO après corrections ») — toutes appliquées
Trois défauts sérieux de la reconstruction, prouvés sur des cas fabriqués (gardés : `scripts/p28/repair/crafted/`) :
une ancienne révision d'une page reprise à la place de la récente (→ dernière occurrence de chaque objet) ; une page
supprimée ressuscitée et l'ordre faux (→ l'arbre survivant d'abord ; sinon une seule révision, avertissement) ; attributs
hérités perdus, pages blanches (→ refus quand une page n'a pas ses propres `/MediaBox` et `/Resources`). Moyens : page
perdue d'un scan sans texte comptée « identique » (→ nombre de pages), messages d'échec et notes inexacts, décompression
non bornée (→ 256 Mo). Trouvé en appliquant : `/Prev` des signets pris pour une révision (corrigé).
### 4.5 Mesures après
- Local (248) : 0 livré avec un texte différent de la source lisible ; refus 52 → 25 ; les 27 récupérés ont exactement
  le texte de l'original ; cas fabriqués : comportement attendu (README).
- **Service en ligne (pdf-tools `ab0077fd`, fusion `03aa60d1`) : 223 livrés (148 qpdf, 1 Poppler, 74 reconstruits), 25
  refusés ; Ghostscript n'a plus rien livré ; 0 texte altéré par rapport aux lecteurs du service.** 41 reconstructions
  « non vérifiables » : 26 ont exactement le texte de l'original, 15 celui que Ghostscript lit encore dans la source
  tronquée (la fin du document est réellement perdue). 31 PDF intacts : 31 par qpdf, texte identique.
- PDF/A 1b/2b/3b et Compress sur le service reconstruit : inchangés.
- Durée : document ordinaire < 1 s de plus ; cas extrême de 10 400 pages (local) 51-79 s (lecture du texte).
- Préversion `onlineconvertools-4rkivi23v` (une passe) puis **www** (`onlineconvertools-jcglmx2uu`) : page Repair avec 4
  vrais PDF abîmés (méthode, contrôle du texte ou avertissement affichés, fichier téléchargé) ; `www-light` 29/29.
Retour arrière : pdf-tools → déploiement `538d1590` ; Vercel → `onlineconvertools-1q669xcht` (= `df37f58e`) ; repère
`restauration-avant-p28-lot23` = `df37f58e`.

## 5. Facture Railway (mesurée : API de mesures Railway, `scripts/p28/rw-metrics.mjs` ; 10 $/Go/mois, 20 $/vCPU/mois)
| Service | Avant P28 | Après P28 |
|---|---|---|
| gotenberg-v2 (production) | mémoire moyenne 0,72 Go sur 30 h (8.36) | **0,41-0,43 Go** au repos (8.37 : Chromium ≈ 75 Mo de moins) → ≈ −2 à −3 $/mois |
| gotenberg-fonts (à côté) | 0,57 Go | 0,45-0,50 Go |
| pdf-tools | 0,023-0,035 Go au repos (P27) | **0,036 Go** au repos — inchangé ; image : `pdfunite` est déjà dans `poppler-utils` (aucun paquet ajouté) |
Coût par usage : une réparation lit le texte de la source et du résultat (deux lecteurs) : < 1 s de processeur pour un
document ordinaire (≈ 0,00001 $). Bancs du chantier : quelques minutes de processeur (≈ 0,05 $). Aucun service ajouté,
aucune variable touchée (Railway ni Vercel), aucune autre dépense ; rien sur Supabase ; ConvertAPI non appelé.

## 6. Reste
- **Sécurité (revue P28)** : Chromium de Gotenberg sans bac à sable avec JavaScript actif, HTML déposé passé tel quel ;
  Chromium 152 ne corrige pas CVE-2026-87491. Passer à la prochaine Gotenberg (Chromium ≥ 153) dès sa sortie avec le même
  banc, et mesurer `CHROMIUM_DISABLE_JAVASCRIPT=true` ou un nettoyage du HTML déposé (au plan).
- **Équations d'un `.docx`** : converties par ConvertAPI en production, non mesurées (≈ 0,01 $ — décision du propriétaire).
- Mineur, mesuré : en RTF, équations alignées à gauche (Word : centrées) ; crochets de matrice non étirés dans l'ODT de
  Word ; une équation colorée par Word sort en noir ; police de formule de LibreOffice (pas Cambria Math).
- PDF Repair : PDF chiffré AES-256 dont la fin est perdue — iLovePDF le récupère, nous non (pages dans des flux d'objets
  chiffrés).

## 7. Fin
Production : **Vercel `onlineconvertools-jcglmx2uu` = `03aa60d1`** (puis commits de rapport) ; **Railway `gotenberg-v2`
`8e8e178d` (8.37.0 + règles Aptos), `pdf-tools` `ab0077fd`**. Aucun retour arrière nécessaire. Repères :
`restauration-avant-p28-04-10` = `6a8af4be`, `restauration-avant-p28-lot23` = `df37f58e`.
