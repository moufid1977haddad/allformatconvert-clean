# RAPPORT P24 — couverture et qualité de tous les outils que P21 n'a pas traités (nuit du 02 au 03/10)

Demandé par le propriétaire avec mise en production par catégorie (code du site seulement), même règles que P23.
Branche `p24-couverture`, repère `restauration-avant-p24-03-10` = `43d2b0cb`. Rapport complété après chaque catégorie.

Méthode, par catégorie : nos formats et options lus dans le code ; ceux des deux références relevés en direct le
02/10 (pages des outils, API publique de CloudConvert) ; ajout de ce que nos moteurs font déjà ; **chaque ajout prouvé
par un vrai fichier et un résultat rouvert et vérifié** (pdf.js, pdf-lib, sharp, ffprobe) ; défauts de qualité
corrigés ; ce qui demanderait un service, Railway ou une dépense → plan, « Décisions du propriétaire — P24 ».

## 0. INCIDENT — site hors ligne (HTTP 402), compte Vercel suspendu

Vers 01 h (heure de la machine), la préversion du lot PDF n'apparaissait pas ; sa création par l'API a répondu
**« Your Team exceeded our fair use limits and has been blocked (402) »**, et **www répond 402**. Le compte Hobby est
suspendu pour dépassement des limites d'usage équitable (100 Go de transfert, 10 Go d'origine, 4 h de CPU par mois).
Cause probable : les bancs des chantiers P21 → P23, très lourds sur www et les préversions. **Seul le propriétaire peut
débloquer** (passage en Pro recommandé, voir le plan en tête). Claude a arrêté tout processus, envoyé une notification
au terminal, et poursuit P24 **en local seulement** ; aucune fusion dans master tant que le compte est bloqué.

## 1. PDF

### 1.1 Relevé (02/10)

| Outil | iLovePDF | Smallpdf / CloudConvert | Nous avant P24 |
|---|---|---|---|
| Number pages | position, 3 marges, pages en vis-à-vis, couverture, de… à…, premier numéro, « {n} », « Page {n} », « Page {n} of {p} », texte libre, police, taille, couleur | Smallpdf : positions, marges | « n / total » fixe, 12 pt, dès la page 1 |
| Watermark | texte ou image, grille + mosaïque, transparence, rotation 45/90/180/270, dessus/dessous, pages | Smallpdf : texte seul | texte gris à 45°, opacité |
| Rotate | par page ou fichier | Smallpdf : par page ou tout, 90/180/270 | tout le document |
| Delete pages / Crop | vignettes, plages / page ou tout | idem | liste « 1, 3, 5 » / toutes les pages |
| Protect | mot de passe propriétaire, interdictions (impression, modification, copie, commentaires, formulaires, assemblage) | Smallpdf : AES-128 ; CloudConvert : user/owner, impression full/low/none… | un mot de passe, propriétaire = « mot de passe + _owner », interdictions fixes |
| Organize | réordonner, supprimer, tourner, page blanche, insérer, trier | Smallpdf : + dupliquer | réordonner, supprimer |
| Redact | zone, recherche, e-mails / téléphones / cartes automatiques, pages, métadonnées | Smallpdf : sélection | un seul terme |
| HTML to PDF | URL ou fichier, largeur d'écran, A3/A4/A5/Letter, orientation, marges, une page longue | CloudConvert : formats A0-A6/Letter…, marges, zoom… | fichier ou collé, aucune option |
| TXT / EPUB / MOBI / MD to PDF | (HTML seulement) | Smallpdf : EPUB, TXT, RTF sans option ; CloudConvert : epub, mobi, azw3, md, txt, rtf | pas d'option ; TXT lu en UTF-8 seulement |
| PDF to PDF/A | 1b, 1a, 2b, 2u, 2a, 3b, 3u, 3a | CloudConvert : 1b, 2b, 3b | 1b, 2b, 3b |
| PDF to Word / Excel / PPT | Word (format non vérifié), XLSX, PPTX/PPT ; OCR payant | CloudConvert : docx, doc, rtf ; xlsx, xls ; pptx, ppt | docx ; xlsx ; pptx |
| Translate | 50+ / 20+ langues, mise en page gardée, PDF | Smallpdf : 20+ langues | 10 langues, 5 premières pages / 3 000 caractères, texte |

### 1.2 Défauts silencieux trouvés en route (corrigés)

| Outil | Défaut (avant) | Correction |
|---|---|---|
| **Rotate** | l'angle **remplaçait** la rotation de la page : une page déjà à 90° « tournée de 90° » ne bougeait pas, sans un mot | angle ajouté à la rotation de chaque page |
| **Delete Pages** | « 2-4 » lu `parseInt` = 2 : **seule la page 2 supprimée** ; mots et pages hors du document ignorés en silence ; supprimer tout donnait un PDF vide | plages (`app/lib/pageRange.js`, partagé), phrase pour chaque erreur, au moins une page gardée |
| **Protect** | un PDF 1.3 chiffré en **RC4 40 bits** (cassable en minutes ; 1.4-1.5 : RC4 128) ; propriétaire = « mot de passe + _owner » : qui pouvait ouvrir pouvait tout débloquer | en-tête porté à 1.7 avant chiffrement → **AES-128 pour tout fichier** (comme Smallpdf ; l'AES-256 de la bibliothèque est la révision 5, dépréciée) ; propriétaire au choix ou 32 caractères aléatoires |
| **Watermark** | texte **non centré** (il partait du centre, largeur devinée « longueur × 0,3 ») ; page tournée : ailleurs ; tout caractère hors Latin-1 (chinois, cyrillique, arabe) faisait planter | bloc tourné centré sur son point, placement comme la page s'affiche (`pdfPlace.js`), texte non latin dessiné par le navigateur en image transparente 4× |
| **Number Pages** | sur une page affichée tournée, numéro de travers ; CropBox décalée : possiblement hors de la zone visible | placement comme la page s'affiche |
| **Text / HTML / Markdown to PDF** | fichier lu en UTF-8 seulement : un .txt Windows (ANSI) ou « Texte Unicode » (UTF-16) sortait illisible | `decodedText` (P23) |

### 1.3 Ajouts (tous prouvés, `scripts/p24/pdf-lot.mjs`)

Number Pages, Watermark, Rotate, Delete Pages, Crop, Protect, Organize, Redact, Text to PDF, HTML to PDF, Markdown to
PDF : voir le relevé ; détail dans le commit `11cc8f05`. Banc local : **21/21 sur Chromium, Firefox et WebKit** ;
solidité des 11 outils modifiés : **41/41 ×3**. Exemples de preuves : « Page 5 of 6 » droit en bas au centre d'une
page affichée à 90° ; « DRAFT » centré ; texte chinois en mosaïque sous le contenu (images dans le premier flux) ;
page à 90° tournée → 180° ; « 2-3 » supprime 2 et 3 ; PDF 1.3 → `/V 4 … AESV2`, mot de passe exigé ; e-mail coupé
entre deux morceaux de texte, téléphone et terme → page aplatie, plus rien d'extractible, 3 occurrences comptées ;
.txt ANSI « Café crème » lu juste, Letter paysage 792 × 612.

**Réviseur indépendant** (lecture seule) : 3 défauts graves trouvés et corrigés avant toute production — un PDF 2.0
chiffré en RC4 40 bits malgré l'annonce « AES-128 » (la bibliothèque ne reconnaît que les versions 1.4 à 1.7 : en-tête
relevé sauf 1.6/1.7 exactement, et vérification V = 4 avant de l'écrire) ; « 1 - 3 » avec espaces voulait dire toutes
les pages ; un numéro de carte ou de téléphone collé à d'autres chiffres (carte + CVV, deux numéros de suite) n'était
pas masqué → toute la suite de chiffres est masquée dès qu'elle contient un vrai numéro. Moyens / faibles corrigés :
texte non latin des numéros (supprimé → dessiné), HTML à charset déclaré, avertissement « sous le contenu », page
blanche à la taille affichée, style @page jamais avant le doctype, « To page » à 0, e-mails à apostrophe ou accents.
Banc : **23/23 ×3 moteurs en local** (`ed35d749`). **Préversion et production impossibles** (compte bloqué).

### 1.4 Laissé au propriétaire ou non faisable ici

Voir le plan, « Décisions du propriétaire — P24 ».

## 2. Image

### 2.1 Relevé (02/10 : iLoveIMG, ezgif, pinetools, imgonline, CloudConvert)

iLoveIMG n'a que 13 outils (Compress, Upscale, Remove background, Meme, Photo editor, Resize, Crop, Rotate, Convert
to/from JPG, HTML to image, Watermark, Blur face), tous par lots. Écarts retenus, faisables dans le navigateur :
qualité / sans perte du WebP (ezgif), suppression des métadonnées (imgonline, outil à part), fond d'une rotation libre
(pinetools), proportions prédéfinies du recadrage (ezgif), tailles d'icône 24/64/128 et cadrage (CloudConvert),
méthodes de gris et seuil noir et blanc (pinetools), fond et échelles du SVG (ezgif, CloudConvert), seuil des
doublons (imgonline), polices / contour / ombre / opacité / rotation du texte (iLoveIMG, ezgif).

### 2.2 Ajouts et défauts corrigés

| Outil | Avant | Après |
|---|---|---|
| JPG / PNG to WebP | qualité fixe 80 | qualité 1-100, **sans perte** (libwebp lossless, exact pour une image opaque), poids avant → après |
| Image Metadata | lecture seule | **« Remove metadata »** sans réencoder (pixels identiques au bit près) : EXIF, GPS, XMP, IPTC, commentaires, blocs fabricants, et **tout ce qui suit l'image** (images secondaires MPF avec leur propre GPS, vidéo des Motion Photos, carte de gain HDR, remorques) ; profil ICC et orientation gardés (JPEG, PNG, WebP) |
| Image Rotate | angle libre → PNG transparent imposé | saisie exacte de l'angle ; fond transparent **ou couleur** (le JPG reste JPG) |
| Image Cropper | curseurs en pixels de l'**aperçu** (~20 px réels par cran sur une photo de 4000 px), aucune proportion | **pixels réels**, proportions 1:1, 4:3, 3:2, 16:9, 9:16, 4:5, 2:1, cadre affiché sur l'aperçu |
| PNG to ICO | 16/32/48/256 | + 24, 64, 128 ; image non carrée : ajustée ou **remplie** |
| Grayscale | une méthode | Rec. 709, Rec. 601, moyenne, luminosité, un canal ; **noir et blanc pur** avec seuil |
| SVG to PNG | fond transparent seulement | fond transparent ou couleur ; 512 / 1024 / 2048 px en un clic |
| Add Text to Image | une ligne, Arial gras, 200 px au plus | plusieurs lignes, 6 polices (Impact pour les mèmes…), gras/italique, opacité, rotation, contour, ombre, jusqu'à 800 px |
| Duplicate Image Finder | seuil fixe | Strict / Normal / Loose |

Preuves : `scripts/p24/image-lot.mjs` **10/10 ×3 moteurs** (WebP sans perte = pixels du PNG ; qualité 20 < 95 ;
GPS et appareil supprimés, pixels identiques, orientation 6 gardée ; rotation 30° coins rouges en JPG ; ICO exactement
24 et 128 px, rempli ; « canal rouge » rouge pur → blanc ; noir et blanc = 0 et 255 seulement ; SVG 1024 × 512 fond
blanc ; 16:9 sur 4000 × 3000 → 4000 × 2250 ; texte Impact 2 lignes avec contour) ; `strip-metadata.test.mjs` (JPEG
progressif, image secondaire après l'image principale, PNG/WebP orientés) ; solidité des 10 outils **48/48 ×3**.

**Réviseur indépendant** : 1 grave corrigé (les données après l'image — images MPF, Motion Photo — gardaient leur
GPS alors que la page disait « supprimé ») ; moyens corrigés (orientation PNG/WebP, libellés « sans perte » et
« fond » qui promettaient plus que vrai) ; faibles corrigés (ombre sur toutes les lignes, seuil pendant le calcul,
WebP borné à sa taille RIFF, fin de JPEG). En chemin, j'ai trouvé et corrigé que la sortie perdait son marqueur de fin
(FFD9) — attrapé par le test avant toute production.

**Non fait (nouveaux outils, au propriétaire de décider s'il en veut)** : filigrane d'image, générateur de mèmes,
collage, flou de visage (iLoveIMG les a ; tout est faisable dans le navigateur, mais ce sont de nouvelles pages). Traitement
par lots (iLoveIMG traite tout par lots) : chantier transversal.

## 3. Vidéo

Le service ffmpeg (Railway, interdit de modification) accepte, d'après son code (`services/media-processing/app/ffmpeg_ops.py`) :
`convert` (36 cibles, qualité, hauteur max 144-4320, GIF début/durée/largeur/fps, découpe, et pour MP4/MOV/M4V rotation,
taille `fit`, filtre, fps), `compress` (3 niveaux, hauteur max). Rien de plus (pas de miroir, vitesse, volume, fondu,
codec au choix, CRF) : ces écarts vont au plan (Décisions P24, E5).

| Outil | Ajout (P24) | Preuve |
|---|---|---|
| Video Converter | hauteur max 2160 / 1440 / 1080 / 720 / 480 / 360 / 240 / 144 (123apps : menu complet) | valeurs acceptées par le service (code) — **non exécuté de bout en bout** (service) |
| Video Compressor | + 1440p et 240p | idem |
| Video Resizer | préréglages 4K, 4:5 (1080 × 1350), story 720 × 1280, 4:3 (1440 × 1080) (Kapwing) | idem |
| Video to GIF (et MP4/MOV/AVI/WebM to GIF) | largeurs 160 et 360 px (déjà acceptées par le service, absentes de la page) | idem |
| Video Screenshot | **WebP** (libwebp WebAssembly sous Safari), **instant exact** à saisir | `av-lot.mjs` : WebP à 1,50 s |
| Video Watermark | taille 5-60 % de la largeur, couleur du texte, **9 positions** ; **texte net** (dessiné à 192 px puis réduit — il était dessiné à 48 px puis agrandi, flou en 1080p/4K) | `av-lot.mjs` : texte rouge, demi-largeur, au centre, lu sur une image capturée de la vidéo produite (Chromium, Firefox) |

## 4. Audio

| Outil | Ajout (P24) | Preuve (`av-lot.mjs`) |
|---|---|---|
| Audio Converter | fréquence d'échantillonnage (48 / 44,1 / 32 / 22,05 / 16 / 8 kHz) et canaux (mono / stéréo), 123apps et FreeConvert ; une fréquence qu'un format ne sait pas écrire (AC3 à 16 kHz) est refusée par une phrase, jamais rééchantillonnée en silence | WAV 16 kHz mono ; AC3 16 kHz refusé |
| Audio Compressor | mono et fréquence plus basse | MP3 mono 22,05 kHz |
| Audio Booster | volume **0,25× à 5×** (il ne savait que monter) ; **normalisation** EBU R128 à -16 LUFS, crête vraie -1,5 dB | 0,5× → RMS divisé par 2 ; normalisé : crête ≤ -1,5 dBFS |

Bancs : Chromium 7/7, Firefox 7/7, WebKit 5/5 + 2 non mesurables (**le WebKit de Playwright pour Windows ne décode aucune
vidéo**, ni H.264 ni WebM ; le vrai Safari si — à vérifier par le propriétaire). Solidité des outils modifiés 38/38 ×3.

## 5. GIF

GIF Compressor : réduction des couleurs (128 → 16) et de la taille (75 → 25 %) par gifsicle, comme l'optimiseur d'ezgif.
Video to GIF avait déjà les options d'ezgif (début, durée, largeur, fps). Preuve `gif-lot.mjs` : un GIF de 6 images,
16 couleurs et 50 % → 100 px, 6 images, ≤ 16 couleurs, ×3 moteurs ; solidité 5/5 ×3.

## 6. Documents et fichiers

File Splitter : découpage **en N parts égales** et mode **« Join parts »** (aucun outil du site ne recollait les morceaux ;
la FAQ renvoyait à « copy /b ») — tri par numéro, morceau manquant ou fichier différent signalés. Preuve : 3 parts
égales, recollées (choisies dans le désordre) à l'identique ; morceau manquant dit.

## 7. Développeur, texte, unités, maths — d'abord les résultats FAUX corrigés

| Outil | Résultat faux (avant) | Correction |
|---|---|---|
| TOML to JSON | `a = 9007199254740993` refusé (« cannot be represented losslessly ») ; `inf` / `nan` devenaient `null` sans un mot | entiers lus exactement (BigInt) et écrits chiffre par chiffre ; inf/nan → null **et dit** |
| JSON to TOML | `{"id":12345678901234567890}` → `12345678901234567168.0` | lecture sans perte ; un entier hors de la plage 64 bits de TOML écrit en texte **et dit** |
| TSV to CSV | fins de ligne Windows : un `\r` entre guillemets dans chaque dernière colonne ; cellule Excel sur plusieurs lignes coupée | analyse RFC 4180 (guillemet ouvrant seulement en début de champ), CRLF |
| Unit Converter | « 1,000 » lu comme 1 (résultat 1000× trop petit) | espaces de milliers, « 1.234,5 », et la question « mille ou un ? » pour le cas ambigu |
| Roman Numerals | « 12.7 » → XII, « 1e3 » → I | entier 1-3999 seulement, sinon une phrase |
| Percentage Calculator | variation de -10 à -5 affichée -50 % | division par |X| (+50 %) |

Ajouts : UUID **v7** (RFC 9562, ordonné dans le temps), UUID nul, majuscules / sans tirets / {accolades}, jusqu'à 1000 ;
Case Converter **camelCase, PascalCase, snake_case, kebab-case, CONSTANT_CASE, iNVERSE** (mots coupés aussi aux
changements de casse, accents gardés) ; Percentage Calculator : « X est Y % de combien », augmenter/diminuer de Y %,
écart en pourcentage. Preuve `dev-lot.mjs` **11/11 ×3 moteurs**.

**Ajoutés ensuite** (`dev-lot.mjs` passé à **17/17 ×3 moteurs**) : **Regex Tester** à la manière de regex101 —
correspondances surlignées avec leur position, groupes numérotés et nommés, aperçu de remplacement ($1, $<name>, **Relevés mais non faits cette nuit** (faisables, effort moyen) : Regex Tester (groupes, remplacement), comparaison de
textes mot à mot, vérification de signature JWT,),
exécution dans un Worker arrêtée après 2 s (un retour arrière catastrophique comme `(a+)+# RAPPORT P24 — couverture et qualité de tous les outils que P21 n'a pas traités (nuit du 02 au 03/10)

Demandé par le propriétaire avec mise en production par catégorie (code du site seulement), même règles que P23.
Branche `p24-couverture`, repère `restauration-avant-p24-03-10` = `43d2b0cb`. Rapport complété après chaque catégorie.

Méthode, par catégorie : nos formats et options lus dans le code ; ceux des deux références relevés en direct le
02/10 (pages des outils, API publique de CloudConvert) ; ajout de ce que nos moteurs font déjà ; **chaque ajout prouvé
par un vrai fichier et un résultat rouvert et vérifié** (pdf.js, pdf-lib, sharp, ffprobe) ; défauts de qualité
corrigés ; ce qui demanderait un service, Railway ou une dépense → plan, « Décisions du propriétaire — P24 ».

## 0. INCIDENT — site hors ligne (HTTP 402), compte Vercel suspendu

Vers 01 h (heure de la machine), la préversion du lot PDF n'apparaissait pas ; sa création par l'API a répondu
**« Your Team exceeded our fair use limits and has been blocked (402) »**, et **www répond 402**. Le compte Hobby est
suspendu pour dépassement des limites d'usage équitable (100 Go de transfert, 10 Go d'origine, 4 h de CPU par mois).
Cause probable : les bancs des chantiers P21 → P23, très lourds sur www et les préversions. **Seul le propriétaire peut
débloquer** (passage en Pro recommandé, voir le plan en tête). Claude a arrêté tout processus, envoyé une notification
au terminal, et poursuit P24 **en local seulement** ; aucune fusion dans master tant que le compte est bloqué.

## 1. PDF

### 1.1 Relevé (02/10)

| Outil | iLovePDF | Smallpdf / CloudConvert | Nous avant P24 |
|---|---|---|---|
| Number pages | position, 3 marges, pages en vis-à-vis, couverture, de… à…, premier numéro, « {n} », « Page {n} », « Page {n} of {p} », texte libre, police, taille, couleur | Smallpdf : positions, marges | « n / total » fixe, 12 pt, dès la page 1 |
| Watermark | texte ou image, grille + mosaïque, transparence, rotation 45/90/180/270, dessus/dessous, pages | Smallpdf : texte seul | texte gris à 45°, opacité |
| Rotate | par page ou fichier | Smallpdf : par page ou tout, 90/180/270 | tout le document |
| Delete pages / Crop | vignettes, plages / page ou tout | idem | liste « 1, 3, 5 » / toutes les pages |
| Protect | mot de passe propriétaire, interdictions (impression, modification, copie, commentaires, formulaires, assemblage) | Smallpdf : AES-128 ; CloudConvert : user/owner, impression full/low/none… | un mot de passe, propriétaire = « mot de passe + _owner », interdictions fixes |
| Organize | réordonner, supprimer, tourner, page blanche, insérer, trier | Smallpdf : + dupliquer | réordonner, supprimer |
| Redact | zone, recherche, e-mails / téléphones / cartes automatiques, pages, métadonnées | Smallpdf : sélection | un seul terme |
| HTML to PDF | URL ou fichier, largeur d'écran, A3/A4/A5/Letter, orientation, marges, une page longue | CloudConvert : formats A0-A6/Letter…, marges, zoom… | fichier ou collé, aucune option |
| TXT / EPUB / MOBI / MD to PDF | (HTML seulement) | Smallpdf : EPUB, TXT, RTF sans option ; CloudConvert : epub, mobi, azw3, md, txt, rtf | pas d'option ; TXT lu en UTF-8 seulement |
| PDF to PDF/A | 1b, 1a, 2b, 2u, 2a, 3b, 3u, 3a | CloudConvert : 1b, 2b, 3b | 1b, 2b, 3b |
| PDF to Word / Excel / PPT | Word (format non vérifié), XLSX, PPTX/PPT ; OCR payant | CloudConvert : docx, doc, rtf ; xlsx, xls ; pptx, ppt | docx ; xlsx ; pptx |
| Translate | 50+ / 20+ langues, mise en page gardée, PDF | Smallpdf : 20+ langues | 10 langues, 5 premières pages / 3 000 caractères, texte |

### 1.2 Défauts silencieux trouvés en route (corrigés)

| Outil | Défaut (avant) | Correction |
|---|---|---|
| **Rotate** | l'angle **remplaçait** la rotation de la page : une page déjà à 90° « tournée de 90° » ne bougeait pas, sans un mot | angle ajouté à la rotation de chaque page |
| **Delete Pages** | « 2-4 » lu `parseInt` = 2 : **seule la page 2 supprimée** ; mots et pages hors du document ignorés en silence ; supprimer tout donnait un PDF vide | plages (`app/lib/pageRange.js`, partagé), phrase pour chaque erreur, au moins une page gardée |
| **Protect** | un PDF 1.3 chiffré en **RC4 40 bits** (cassable en minutes ; 1.4-1.5 : RC4 128) ; propriétaire = « mot de passe + _owner » : qui pouvait ouvrir pouvait tout débloquer | en-tête porté à 1.7 avant chiffrement → **AES-128 pour tout fichier** (comme Smallpdf ; l'AES-256 de la bibliothèque est la révision 5, dépréciée) ; propriétaire au choix ou 32 caractères aléatoires |
| **Watermark** | texte **non centré** (il partait du centre, largeur devinée « longueur × 0,3 ») ; page tournée : ailleurs ; tout caractère hors Latin-1 (chinois, cyrillique, arabe) faisait planter | bloc tourné centré sur son point, placement comme la page s'affiche (`pdfPlace.js`), texte non latin dessiné par le navigateur en image transparente 4× |
| **Number Pages** | sur une page affichée tournée, numéro de travers ; CropBox décalée : possiblement hors de la zone visible | placement comme la page s'affiche |
| **Text / HTML / Markdown to PDF** | fichier lu en UTF-8 seulement : un .txt Windows (ANSI) ou « Texte Unicode » (UTF-16) sortait illisible | `decodedText` (P23) |

### 1.3 Ajouts (tous prouvés, `scripts/p24/pdf-lot.mjs`)

Number Pages, Watermark, Rotate, Delete Pages, Crop, Protect, Organize, Redact, Text to PDF, HTML to PDF, Markdown to
PDF : voir le relevé ; détail dans le commit `11cc8f05`. Banc local : **21/21 sur Chromium, Firefox et WebKit** ;
solidité des 11 outils modifiés : **41/41 ×3**. Exemples de preuves : « Page 5 of 6 » droit en bas au centre d'une
page affichée à 90° ; « DRAFT » centré ; texte chinois en mosaïque sous le contenu (images dans le premier flux) ;
page à 90° tournée → 180° ; « 2-3 » supprime 2 et 3 ; PDF 1.3 → `/V 4 … AESV2`, mot de passe exigé ; e-mail coupé
entre deux morceaux de texte, téléphone et terme → page aplatie, plus rien d'extractible, 3 occurrences comptées ;
.txt ANSI « Café crème » lu juste, Letter paysage 792 × 612.

**Réviseur indépendant** (lecture seule) : 3 défauts graves trouvés et corrigés avant toute production — un PDF 2.0
chiffré en RC4 40 bits malgré l'annonce « AES-128 » (la bibliothèque ne reconnaît que les versions 1.4 à 1.7 : en-tête
relevé sauf 1.6/1.7 exactement, et vérification V = 4 avant de l'écrire) ; « 1 - 3 » avec espaces voulait dire toutes
les pages ; un numéro de carte ou de téléphone collé à d'autres chiffres (carte + CVV, deux numéros de suite) n'était
pas masqué → toute la suite de chiffres est masquée dès qu'elle contient un vrai numéro. Moyens / faibles corrigés :
texte non latin des numéros (supprimé → dessiné), HTML à charset déclaré, avertissement « sous le contenu », page
blanche à la taille affichée, style @page jamais avant le doctype, « To page » à 0, e-mails à apostrophe ou accents.
Banc : **23/23 ×3 moteurs en local** (`ed35d749`). **Préversion et production impossibles** (compte bloqué).

### 1.4 Laissé au propriétaire ou non faisable ici

Voir le plan, « Décisions du propriétaire — P24 ».

## 2. Image

### 2.1 Relevé (02/10 : iLoveIMG, ezgif, pinetools, imgonline, CloudConvert)

iLoveIMG n'a que 13 outils (Compress, Upscale, Remove background, Meme, Photo editor, Resize, Crop, Rotate, Convert
to/from JPG, HTML to image, Watermark, Blur face), tous par lots. Écarts retenus, faisables dans le navigateur :
qualité / sans perte du WebP (ezgif), suppression des métadonnées (imgonline, outil à part), fond d'une rotation libre
(pinetools), proportions prédéfinies du recadrage (ezgif), tailles d'icône 24/64/128 et cadrage (CloudConvert),
méthodes de gris et seuil noir et blanc (pinetools), fond et échelles du SVG (ezgif, CloudConvert), seuil des
doublons (imgonline), polices / contour / ombre / opacité / rotation du texte (iLoveIMG, ezgif).

### 2.2 Ajouts et défauts corrigés

| Outil | Avant | Après |
|---|---|---|
| JPG / PNG to WebP | qualité fixe 80 | qualité 1-100, **sans perte** (libwebp lossless, exact pour une image opaque), poids avant → après |
| Image Metadata | lecture seule | **« Remove metadata »** sans réencoder (pixels identiques au bit près) : EXIF, GPS, XMP, IPTC, commentaires, blocs fabricants, et **tout ce qui suit l'image** (images secondaires MPF avec leur propre GPS, vidéo des Motion Photos, carte de gain HDR, remorques) ; profil ICC et orientation gardés (JPEG, PNG, WebP) |
| Image Rotate | angle libre → PNG transparent imposé | saisie exacte de l'angle ; fond transparent **ou couleur** (le JPG reste JPG) |
| Image Cropper | curseurs en pixels de l'**aperçu** (~20 px réels par cran sur une photo de 4000 px), aucune proportion | **pixels réels**, proportions 1:1, 4:3, 3:2, 16:9, 9:16, 4:5, 2:1, cadre affiché sur l'aperçu |
| PNG to ICO | 16/32/48/256 | + 24, 64, 128 ; image non carrée : ajustée ou **remplie** |
| Grayscale | une méthode | Rec. 709, Rec. 601, moyenne, luminosité, un canal ; **noir et blanc pur** avec seuil |
| SVG to PNG | fond transparent seulement | fond transparent ou couleur ; 512 / 1024 / 2048 px en un clic |
| Add Text to Image | une ligne, Arial gras, 200 px au plus | plusieurs lignes, 6 polices (Impact pour les mèmes…), gras/italique, opacité, rotation, contour, ombre, jusqu'à 800 px |
| Duplicate Image Finder | seuil fixe | Strict / Normal / Loose |

Preuves : `scripts/p24/image-lot.mjs` **10/10 ×3 moteurs** (WebP sans perte = pixels du PNG ; qualité 20 < 95 ;
GPS et appareil supprimés, pixels identiques, orientation 6 gardée ; rotation 30° coins rouges en JPG ; ICO exactement
24 et 128 px, rempli ; « canal rouge » rouge pur → blanc ; noir et blanc = 0 et 255 seulement ; SVG 1024 × 512 fond
blanc ; 16:9 sur 4000 × 3000 → 4000 × 2250 ; texte Impact 2 lignes avec contour) ; `strip-metadata.test.mjs` (JPEG
progressif, image secondaire après l'image principale, PNG/WebP orientés) ; solidité des 10 outils **48/48 ×3**.

**Réviseur indépendant** : 1 grave corrigé (les données après l'image — images MPF, Motion Photo — gardaient leur
GPS alors que la page disait « supprimé ») ; moyens corrigés (orientation PNG/WebP, libellés « sans perte » et
« fond » qui promettaient plus que vrai) ; faibles corrigés (ombre sur toutes les lignes, seuil pendant le calcul,
WebP borné à sa taille RIFF, fin de JPEG). En chemin, j'ai trouvé et corrigé que la sortie perdait son marqueur de fin
(FFD9) — attrapé par le test avant toute production.

**Non fait (nouveaux outils, au propriétaire de décider s'il en veut)** : filigrane d'image, générateur de mèmes,
collage, flou de visage (iLoveIMG les a ; tout est faisable dans le navigateur, mais ce sont de nouvelles pages). Traitement
par lots (iLoveIMG traite tout par lots) : chantier transversal.

## 3. Vidéo

Le service ffmpeg (Railway, interdit de modification) accepte, d'après son code (`services/media-processing/app/ffmpeg_ops.py`) :
`convert` (36 cibles, qualité, hauteur max 144-4320, GIF début/durée/largeur/fps, découpe, et pour MP4/MOV/M4V rotation,
taille `fit`, filtre, fps), `compress` (3 niveaux, hauteur max). Rien de plus (pas de miroir, vitesse, volume, fondu,
codec au choix, CRF) : ces écarts vont au plan (Décisions P24, E5).

| Outil | Ajout (P24) | Preuve |
|---|---|---|
| Video Converter | hauteur max 2160 / 1440 / 1080 / 720 / 480 / 360 / 240 / 144 (123apps : menu complet) | valeurs acceptées par le service (code) — **non exécuté de bout en bout** (service) |
| Video Compressor | + 1440p et 240p | idem |
| Video Resizer | préréglages 4K, 4:5 (1080 × 1350), story 720 × 1280, 4:3 (1440 × 1080) (Kapwing) | idem |
| Video to GIF (et MP4/MOV/AVI/WebM to GIF) | largeurs 160 et 360 px (déjà acceptées par le service, absentes de la page) | idem |
| Video Screenshot | **WebP** (libwebp WebAssembly sous Safari), **instant exact** à saisir | `av-lot.mjs` : WebP à 1,50 s |
| Video Watermark | taille 5-60 % de la largeur, couleur du texte, **9 positions** ; **texte net** (dessiné à 192 px puis réduit — il était dessiné à 48 px puis agrandi, flou en 1080p/4K) | `av-lot.mjs` : texte rouge, demi-largeur, au centre, lu sur une image capturée de la vidéo produite (Chromium, Firefox) |

## 4. Audio

| Outil | Ajout (P24) | Preuve (`av-lot.mjs`) |
|---|---|---|
| Audio Converter | fréquence d'échantillonnage (48 / 44,1 / 32 / 22,05 / 16 / 8 kHz) et canaux (mono / stéréo), 123apps et FreeConvert ; une fréquence qu'un format ne sait pas écrire (AC3 à 16 kHz) est refusée par une phrase, jamais rééchantillonnée en silence | WAV 16 kHz mono ; AC3 16 kHz refusé |
| Audio Compressor | mono et fréquence plus basse | MP3 mono 22,05 kHz |
| Audio Booster | volume **0,25× à 5×** (il ne savait que monter) ; **normalisation** EBU R128 à -16 LUFS, crête vraie -1,5 dB | 0,5× → RMS divisé par 2 ; normalisé : crête ≤ -1,5 dBFS |

Bancs : Chromium 7/7, Firefox 7/7, WebKit 5/5 + 2 non mesurables (**le WebKit de Playwright pour Windows ne décode aucune
vidéo**, ni H.264 ni WebM ; le vrai Safari si — à vérifier par le propriétaire). Solidité des outils modifiés 38/38 ×3.

## 5. GIF

GIF Compressor : réduction des couleurs (128 → 16) et de la taille (75 → 25 %) par gifsicle, comme l'optimiseur d'ezgif.
Video to GIF avait déjà les options d'ezgif (début, durée, largeur, fps). Preuve `gif-lot.mjs` : un GIF de 6 images,
16 couleurs et 50 % → 100 px, 6 images, ≤ 16 couleurs, ×3 moteurs ; solidité 5/5 ×3.

## 6. Documents et fichiers

File Splitter : découpage **en N parts égales** et mode **« Join parts »** (aucun outil du site ne recollait les morceaux ;
la FAQ renvoyait à « copy /b ») — tri par numéro, morceau manquant ou fichier différent signalés. Preuve : 3 parts
égales, recollées (choisies dans le désordre) à l'identique ; morceau manquant dit.

## 7. Développeur, texte, unités, maths — d'abord les résultats FAUX corrigés

| Outil | Résultat faux (avant) | Correction |
|---|---|---|
| TOML to JSON | `a = 9007199254740993` refusé (« cannot be represented losslessly ») ; `inf` / `nan` devenaient `null` sans un mot | entiers lus exactement (BigInt) et écrits chiffre par chiffre ; inf/nan → null **et dit** |
| JSON to TOML | `{"id":12345678901234567890}` → `12345678901234567168.0` | lecture sans perte ; un entier hors de la plage 64 bits de TOML écrit en texte **et dit** |
| TSV to CSV | fins de ligne Windows : un `\r` entre guillemets dans chaque dernière colonne ; cellule Excel sur plusieurs lignes coupée | analyse RFC 4180 (guillemet ouvrant seulement en début de champ), CRLF |
| Unit Converter | « 1,000 » lu comme 1 (résultat 1000× trop petit) | espaces de milliers, « 1.234,5 », et la question « mille ou un ? » pour le cas ambigu |
| Roman Numerals | « 12.7 » → XII, « 1e3 » → I | entier 1-3999 seulement, sinon une phrase |
| Percentage Calculator | variation de -10 à -5 affichée -50 % | division par |X| (+50 %) |

Ajouts : UUID **v7** (RFC 9562, ordonné dans le temps), UUID nul, majuscules / sans tirets / {accolades}, jusqu'à 1000 ;
Case Converter **camelCase, PascalCase, snake_case, kebab-case, CONSTANT_CASE, iNVERSE** (mots coupés aussi aux
changements de casse, accents gardés) ; Percentage Calculator : « X est Y % de combien », augmenter/diminuer de Y %,
écart en pourcentage. Preuve `dev-lot.mjs` **11/11 ×3 moteurs**.

 figeait la page) ;
**Text Comparator** — mots changés surlignés dans la ligne (diffchecker), ignorer la casse / les espaces ; **JSON
Formatter** — indentation 2 / 4 / tabulation, clés triées sans toucher un nombre, **ligne et colonne de l'erreur**
avec la ligne affichée (Safari ne donne aucune position) ; **Password Generator** — sans caractères ambigus, 50 d'un
coup, entropie affichée ; **Unit Converter** — nm, µm, mille marin, stone, tonnes US/UK, carat, hectare, in², yd², mi²,
quart, pint, cup, cuillères, gallon/pint/fl oz UK, ft³, in³, cm³, Rankine.

**Deuxième relecture indépendante** (lots vidéo/audio/dev) : rien de grave ; corrigés — la normalisation sortait en
**192 kHz** (sortie interne de loudnorm ; et un filtre aresample ajouté ensuite échouait **sans rien dire**, la page
n'affichait aucune erreur : `ffmpeg.exec` ne lève pas, il rend un code) → fréquence de la source par `-ar`, et **code
de retour de ffmpeg vérifié** dans Audio Booster, Converter, Compressor, Video to Audio, puis (`app/lib/ffmpegRun.js`) Splitter, Trimmer, GIF to MP4 et l'étape de mesure du Merger — bancs fonctionnels repassés : Splitter 22/22 ×3, Trimmer ×3, Merger ordre/fondu tout vert sous Chromium et Firefox (sous WebKit, seule la lecture dans le navigateur de test échoue, il ne décode pas l'audio ; durée et courbe vérifiées par ffprobe ; sélecteur du banc mis à jour après FileDownload) ; MP2 et OGG refusent les
basses fréquences que leurs encodeurs ne savent pas écrire ; TSV : un guillemet non fermé n'avale plus la suite ;
filigrane borné à la hauteur de la vidéo et texte très long dessiné plus petit ; casses : accents décomposés (NFD) et
apostrophes ; parts réellement égales et contrôle des tailles à la jonction ; « 0,001 » n'est plus déclaré ambigu,
« 1 2 » n'est plus lu 12 ; nombres hors d'un double signalés dans JSON to TOML ; textes de FAQ restés faux.

**Relevés mais non faits cette nuit** (faisables, effort moyen) : vérification de signature JWT, fuseaux horaires du convertisseur d'horodatage, densité de mots,
expression cron collée d'un bloc, phrase de passe, bases 2-36, ratio (dimension manquante), couleurs (alpha,
contraste), consommation (mpg ↔ L/100 km), ZIP chiffré AES, métadonnées incorporées de File Metadata.
