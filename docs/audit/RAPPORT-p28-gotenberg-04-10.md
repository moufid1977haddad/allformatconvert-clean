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
| 2 | Équations des ODT écrits par Word (MathML « à plat ») | voir §3 |
| 3 | PDF Repair : texte contrôlé, deux méthodes de plus | voir §4 |

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
