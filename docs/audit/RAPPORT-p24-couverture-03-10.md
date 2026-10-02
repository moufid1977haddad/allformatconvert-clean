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
correspondances surlignées avec leur position, groupes numérotés et nommés, aperçu de remplacement ($1, $<name>, $&),
exécution dans un Worker arrêtée après 2 s (un retour arrière catastrophique comme `(a+)+$` figeait la page) ;
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

**Troisième lot** (`dev-lot.mjs` à **25/25 ×3 moteurs**, tests unitaires des nombres exacts 12/12 et de l'horodatage 5/5) :
- **Number Base Converter** (les deux pages, composant commun) : toute base de 2 à 36 en entrée et en sortie (RapidTables,
  base-convert.com), partie fractionnaire **exacte** (fractions de BigInt) — un développement qui ne se termine pas
  dans la base cible s'affiche sur 40 chiffres suivis de « … », jamais arrondi comme s'il était exact ; leurs FAQ
  disaient encore « nombres entiers seulement » et « grands nombres imprécis », faux depuis le 22/09.
- **Aspect Ratio** : dimension manquante (nouvelle largeur → hauteur et l'inverse), valeur exacte affichée à côté de
  l'arrondi.
- **Timestamp Converter** : fuseau horaire au choix dans les deux sens (epochconverter.com), temps relatif ; une heure
  sautée au passage à l'heure d'été est **refusée** (`new Date(y, m, d, h)` la décalait d'une heure sans un mot,
  y compris dans le fuseau du visiteur), une heure doublée est signalée ; noms IANA actuels (Chromium listait
  Asia/Calcutta, Europe/Kiev — un visiteur cherchant Kolkata ou Kyiv ne les trouvait pas).
- **Word Counter** : densité des mots-clés (1, 2, 3 mots, mots courants exclus au choix, pourcentages sur le vrai
  total), temps de parole (wordcounter.net).
- **Cron Expression / Builder** : expression collée d'un bloc (crontab.guru) ; macros @daily…, commande d'une ligne
  crontab écartée et dite, expression Quartz à 6-7 champs expliquée au lieu d'être rangée dans les mauvaises cases ;
  la FAQ de Cron Expression disait « ni validation ni prochaines exécutions » alors que la page affiche les deux.
- **Color Converter** : transparence (#RGBA, #RRGGBBAA, curseur, rgba()/hsla()), contraste WCAG sur blanc et noir avec
  la note AA/AAA (formule WCAG 2 : #3b82f6 = 3,6779 → affiché 3,67, #767676 = 4,5418 → 4,54 ; ratio tronqué, jamais arrondi au-dessus d'un seuil — la première version arrondissait, 4,4989 s'affichait « 4,50 » à côté de « AA large seulement »).
- **Unit Converter** : consommation (L/100 km, mpg US/UK, km/L — inverse, pas un facteur), 0 refusé.

- **JWT Decoder** : vérification de la signature (jwt.io) — HS256/384/512 avec secret (texte, base64 ou JWK "oct"),
  RS/PS/ES 256/384/512 et EdDSA avec clé publique PEM ou JWK, par le WebCrypto du navigateur. Tests contre
  l'implémentation indépendante de node:crypto **26/26**, banc navigateur ×3. **Réviseur indépendant** (ce qui pourrait
  dire « valide » à tort) : **1 grave corrigé** — un en-tête `{"alg":"toString"}` (ou `__proto__`, `constructor`)
  atteignait la chaîne de prototypes de la table des algorithmes et une signature Ed25519 était déclarée valide
  sans contrôle de type de clé ; `alg` sous forme de tableau était accepté. Corrigés aussi : `crit` et `b64:false`
  refusés (RFC 7515/7797), payload non JSON refusé, base64url non canonique refusé, jeton coupé par des retours à la
  ligne lu et signalé, secret collé avec un retour à la ligne final reconnu et dit, sel PSS non conforme reconnu et
  dit, panneau décodé et verdict jamais périmés (compteur de requêtes), Ed25519 non pris en charge par le navigateur
  dit comme tel (WebKit) au lieu d'accuser la clé.
- **ZIP Creator** : protection par mot de passe en **AES-256** (WinZip AE-2, méthode 99), comme ezyZip et 7-Zip,
  jamais l'ancien ZipCrypto ; archive ouverte **par bsdtar/libarchive** (lecteur indépendant de zip.js) à l'octet près,
  mauvais mot de passe refusé ; mot de passe accentué : avertissement (zip.js et 7-Zip l'écrivent en UTF-8, d'autres
  programmes le lisent dans la page de code locale — bsdtar sous Windows l'a refusé) ; sans mot de passe, JSZip
  inchangé. Solidité ×3 6/6.

**Deuxième relecture indépendante du troisième lot** : rien de grave dans un cas courant ; corrigés — décalages
historiques affichés en minutes décimales (Paris 1900 « +00:9.35 », vrai +00:09:21) ; années av. J.-C. sans ère ;
« la seconde occurrence est une heure plus tard » faux à Lord Howe (30 min) ; contraste d'une couleur transparente
calculé comme opaque (noir à 0 % donnait 21:1 AAA) → couleur composée sur chaque fond ; ratio arrondi qui contredisait
le verdict (4,4989 affiché « 4,50 ») → tronqué ; ligne « 1 L/100 km = 235 mpg » présentée comme un facteur alors que
la relation est inverse → retirée ; « 0x10 » lu 16 ; changement de fuseau qui relisait l'ancienne heure murale ; dates
aux limites de `Date` ; textes restés faux.

**Relevés mais non faits** : métadonnées incorporées de File Metadata (effort fort : un lecteur par format) ;
phrase de passe (demande une liste de mots tierce : décision E6 du plan).

## 8. Convertisseurs et autres (maths, devises, livres numériques)

Outils que ni P21 ni les sections précédentes n'avaient traités (`dev-lot.mjs` **31/31 ×3 moteurs**, tests maths 7/7) :
- **Statistics Calculator** (calculator.net, Calculator Soup) : moyennes géométrique et harmonique, écart interquartile,
  erreur type, coefficient de variation, asymétrie et aplatissement **aux formules d'Excel** (SKEW 0,818487553357,
  KURT 0,940625 sur 2 4 4 4 5 5 7 9 — valeurs de référence d'Excel), méthode de quartiles exclusive (QUARTILE.EXC :
  1..11 → 3 et 9), valeurs aberrantes (1,5 × IQR) ; chaque mesure non définie affiche « — » avec sa raison.
- **Scientific Calculator** (calculator.net, Desmos) : sin⁻¹ cos⁻¹ tan⁻¹ (le moteur les connaissait, sans touche), x²,
  n!, 1/x, |x|, **Ans** à pleine précision, historique des 10 derniers calculs. **Défaut trouvé par le banc** : Entrée
  calculait deux fois (le champ et un écouteur global) — invisible avant, mais avec Ans, `Ans*2` aurait affiché le
  quadruple sans un mot ; corrigé avant toute mise en ligne, et le banc lit désormais l'affichage du résultat lui-même.
  Message d'infini juste (171! n'est pas une division par zéro).
- **Fraction Calculator** (Calculator Soup) : nombres mixtes (partie entière), étapes (plus petit dénominateur commun,
  inverse pour ÷, simplification), **décimale périodique exacte** (1/6 = 0.1(6), 22/7 = 3.(142857)) au lieu d'un arrondi
  à 12 chiffres ; l'ancien calcul `Number(a)/Number(b)` donnait NaN au-delà de 1e308 (deux nombres de 400 chiffres).
- **Currency Converter** (xe.com) : le même montant dans les 19 devises les plus utilisées ; l'historique des taux
  demanderait un autre service (décision E7).
- **MOBI to EPUB** : déjà à parité avec CloudConvert / Calibre en ligne pour ce sens (MOBI6, KF8/AZW3, PRC,
  Huffman/CDIC, couverture, table des matières) ; aucun changement.

## 9. Les ≈ 120 outils qu'aucune passe n'avait comparés (relevé n° 2, 03/10)

Quatre agents de recherche **en lecture seule** (PDF ; image ; vidéo/audio/GIF ; développeur/texte/fichiers/QR) ont lu
notre code et les pages des concurrents ; la liste de travail complète est dans `docs/audit/P24-releve-outils-restants.md`
(cochée au fil des corrections). Règle suivie : **d'abord les résultats faux silencieux**, chacun prouvé avant et après.

**Corrigés et prouvés (lot 1)** :
- **pdf.js sans ses décodeurs** (le plus large) : aucune page du site ne donnait à PDF.js l'adresse de ses modules
  WebAssembly — une image **JPEG 2000, JBIG2 ou CCITT** (pages scannées) était sautée et la page sortait **blanche**,
  avec un simple avertissement en console (prouvé : `scripts/p24/pdfjs-decoders.mjs`, écart de couleur 0,0 avant,
  109 après, ×3 moteurs ; sous WebKit le décodeur de secours en JavaScript prend le relais). Les cmaps (texte chinois,
  japonais, coréen non intégré), profils ICC et polices standard sont servis aussi : `scripts/copy-pdfjs-assets.mjs`
  (au build, `public/pdfjs/<version>/`, non commité), passés une fois pour tous les outils par `app/lib/pdfjs.js`.
  Un premier essai par `Proxy` cassait tous les outils PDF (exports du bundle en lecture seule) : vu par le banc,
  remplacé par une copie simple ; pdf-lot 23/23, PDF to Images 12/12 et simulation Safari 16.4 repassés ×3.
- **PDF Editor** : la police et les images ajoutées étaient intégrées au document source et dessinées sur les pages
  du document enregistré — **l'image ajoutée n'était jamais affichée** (prouvé : 0 image peinte avant, 1 après, lu par
  pdf.js ; `scripts/p24/pdf-editor-worker.test.mjs`) ; un texte non latin donne une phrase au lieu de l'erreur brute.
- **Merge** : formulaires et signets perdus sans un mot → un signet par fichier (Sejda, PDF24) avec ses propres signets
  dessous, champs réunis dans un formulaire qui fonctionne, champs de même nom renommés (`name_2`) et dit
  (`scripts/p24/pdf-merge-worker.test.mjs`). **Split** : chaque morceau garde ses champs, son titre et ses signets
  (`pdf-split-worker.test.mjs`). **Reorder Pages** : « 3-5 » était lu 3, les mots et numéros hors document jetés, les
  pages absentes perdues sans avertissement → ordre lu tel qu'écrit (5-1 inverse), erreurs dites, pages laissées de côté
  listées avant l'enregistrement, Inverser / Impaires puis paires, formulaires et signets gardés.
- **TIFF** (TIFF to JPG, TIFF to PNG, Image Converter, JPG/Image to PDF) : l'orientation (tag 274) est appliquée
  (une image couchée sortait couchée) ; un TIFF de plusieurs pages était réduit à sa première **sans le dire** → TIFF to
  JPG/PNG le disent et convertissent la page choisie, JPG/Image to PDF ajoutent **toutes** les pages ; un profil
  couleur non appliqué est signalé (`scripts/p24/tiff-lot.mjs` ×3 : TIFF de 2 pages écrit par le banc).
- **Video Rotator** : en « Instant, lossless » (promesse : rien n'est envoyé), un WebM ou un MP4 dont la matrice ne
  pouvait pas être réécrite **partait au service sans un mot** → phrase « rien n'a été envoyé », choix laissé.
- **Screen Recorder** : vidéo **muette** sans le dire quand le son n'était pas partagé → phrase ; et le **micro**
  (123apps, ScreenPal), mélangé au son de l'écran.
- **Code Minifier (HTML)** : l'espace entre deux balises était supprimée (« <b>Hello</b> <i>world</i> » lu
  « Helloworld ») et les valeurs d'attributs tassées → une espace gardée, guillemets intacts.
- **SQL to CSV** : `NOW()` fermait la liste (ligne tronquée) ; deux tables mélangées sous un seul en-tête ; NULL écrit
  « NULL » → parenthèses comptées, choix de la table, NULL vide, listes de colonnes divergentes refusées.
- **Statistics Calculator** (relecture indépendante, **1 grave**) : des valeurs décimales toutes égales (0,1 ; 0,1 ; 0,1)
  affichaient une asymétrie de −2,449 (moyenne flottante inexacte) et, au-delà de 2^53 de somme (1e15 + petites
  différences), moyenne, variance, asymétrie, aplatissement faux → sommes compensées et décalées, variance à deux
  passes corrigée, moyennes géométrique et harmonique stables (1e300…1e-300). **Calculatrice** : Ans collé (Ans2, πAns),
  1/x et |x| appliqués au nombre tapé (4 puis 1/x = 0,25, pas 41/(…)), (−3)², messages de domaine. **Fractions** :
  nombre entier seul accepté, période après une longue avant-période.
- **File Metadata** : les métadonnées **contenues** dans le fichier (metadata2go) : EXIF/GPS d'une photo, propriétés
  PDF, Word/Excel/PowerPoint/OpenDocument (auteur, modifié par, société…), contenu d'un ZIP, tags ID3 d'un MP3.

Bancs de ce lot : dev-lot **34/34 ×3**, tiff-lot 2/2 ×3, pdfjs-decoders ×3, tests Node des workers Editor/Merge/Split,
solidité 41/41 ×3 sur les outils touchés ; solidité complète Chromium 522/522 (avant ce lot ; la passe finale ×3 est
refaite sur la version finale).

**Corrigés et prouvés (lot 2)** — chaque défaut vérifié avant (sauf mention), puis banc après :
- **PDF** : EPUB/MOBI to PDF disent les chapitres illisibles sautés ; Compare ne présente plus deux PDF scannés comme
  identiques ; Extract Text explique qu'un PDF scanné n'a pas de texte (renvoi vers OCR) ; Forms reconnaît un
  formulaire **XFA** au lieu de « aucun champ » ; (Sign : relu, déjà juste).
- **Image** : **flou** — le filtre du navigateur rendait les bords semi-transparents (mesuré : coin à 69/255 d'opacité
  sous Chromium et Firefox, cadre blanchâtre en JPG) → calcul maison partout, un seul résultat sur les trois moteurs ;
  **vignette** — le voile noircissait les zones transparentes d'un PNG → `source-atop` ; WebP animé dit dans WebP to JPG ;
  **Image Compressor** refuse un APNG ou un WebP animé (rendus figés sans un mot) comme il refusait le GIF ; Resizer :
  note exacte pour un GIF animé (renvoi vers l'option de taille du GIF Compressor).
- **Vidéo / audio / GIF** : Vidéo → GIF (6 pages) lit la durée de la vidéo — un début après la fin est refusé, une
  longueur qui dépasse est raccourcie **et dite**, 90 s n'est plus ramené à 60 en silence (**rectifié au lot 6** : les deux
  refus sont prouvés au banc sous Chromium et Firefox ; le raccourcissement dit passe par le service vidéo, absent de
  cette machine — **à vérifier sur la préversion**) ; **Audio Equalizer** —
  l'aperçu ignorait les réglages faits avant la première lecture et recréait un AudioContext à chaque lecture ;
  **GIF to APNG** garde le nombre de lectures du GIF (un GIF « une fois » bouclait sans fin) ; **GIF Maker** découpe un
  GIF animé en ses images (ezgif) au lieu d'en garder la première ; **Video Trimmer** garde toutes les pistes audio
  (une seconde langue était perdue) ; **Video Merger** dit quand un premier clip à 120/240 i/s est ramené à 60.
- **Développeur** : **Excel to CSV** — l'EAN-13 4006381333931 sortait « 4.00638E+12 », 1/3 « 0.333333333 », les dates en
  m/j/aa → nombres à 15 chiffres comme Excel, dates ISO, système de dates 1904 respecté (Excel to JSON aussi) ;
  **Excel to JSON** avec un .csv : « 007 » devenait 7, un identifiant de 20 chiffres arrondi, 01/02/2024 lu à
  l'américaine → lu comme texte ; **CSV to Excel** : un .xls de 65 537 lignes était relu avec **2 lignes** → limites du
  format dites avant l'écriture ; **CSV to SQL** — dialecte (standard, MySQL, SQL Server), noms entre guillemets,
  antislash échappé pour MySQL, types mesurés (BIGINT, DECIMAL(p,s), VARCHAR(n)) et, trouvé en route, **les nombres ne
  passent plus par un double** (un identifiant de 20 chiffres perdait ses derniers chiffres) ; **CSV to JSON** —
  en-têtes en double, valeurs en trop gardées et dites ; **JSON → .env** sans perte (20 chiffres, 1.10) ; **JSON to
  Go/Rust/C#** — `10.0` typé entier → décimal, entier au-delà de 64 bits signalé en tête du code ; **YAML** — clé de
  fusion `<<` ; **TypeScript to JS** — import de type retiré comme tsc (échouait au chargement) ; **CSV to TSV** —
  valeur commençant par un guillemet ; **XML Formatter** — balises d'une lettre ; **XML to JSON** — contenu mixte dit ;
  **Text Sorter** — tri par nombre (−10, −2, 1.25, 1.3, 1.5) ; **File Converter** — encodage détecté (« caf\uFFFD »).

Bancs du lot 2 : dev-lot **42/42 ×3**, gif-lot 3/3 ×3, image-lot **12/12 ×3** (dont flou et vignette mesurés au pixel),
audio/vidéo, PDF et solidité des outils touchés ×3 (résultats ci-dessous à la passe finale).

**Faibles corrigés aussi** : URL Encoder dit qu'un « + » est lu comme une espace (a+b@x.com) ; Unicode lit `\u{1F600}` et
U+1F44D ; Text Repeater refuse un nombre vide ou hors 1-100 au lieu d'une sortie vide ; Duplicate Remover tient « é »
composé et décomposé pour la même ligne ; **TAR** : un lien physique est extrait comme une copie (tar le fait), liens
symboliques et fichiers épars listés au lieu d'être ignorés (archive écrite par le module tarfile de Python).
**Premiers ajouts** : qualité JPG et couleur des zones transparentes dans PNG / WebP / TIFF to JPG (ezgif, FreeConvert) ;
PDF Split « pages impaires / paires » (Sejda). Bancs : dev-lot **46/46 ×3**, image 12/12 ×3, tiff 2/2 ×3, solidité 22/22 ×3.

**Restent du relevé n° 2** : note commune pour les 11 filtres d'image sur un GIF animé ; les ajouts plus longs (Excel « une
page par feuille », Split par signets ou par taille, compresser à X Ko, métadonnées vidéo supprimables, enregistreur MP3…).
**Relecture indépendante des lots 1 et 2 — 2 graves corrigés** :
- **Statistiques** : le décalage introduit au lot 1 perdait les petites valeurs à côté d'énormes valeurs qui s'annulent
  ([-1e17, 1e17, 3, 4] : moyenne 3,75 au lieu de 1,75, contredisant la somme affichée) → moyenne = somme compensée / n,
  écarts recentrés sur leur propre moyenne (le cas 1e15 + petites différences reste exact ; Excel SKEW/KURT retrouvés).
- **Excel to CSV / JSON** : une **durée** `[h]:mm:ss` (36 h) sortait « 1900-01-01T12:00:00 » → les durées et les formats
  sans date gardent le texte qu'Excel affiche (36:00:00), comme le CSV d'Excel.
- Moyens corrigés : JSON → Go/Rust/C# refusait `6.02e23` (réécriture invalide) ; SQL to CSV mélangeait une chaîne entre
  guillemets doubles contenant « ( » ; Excel to CSV écrasait le texte formaté des nombres d'un .ods ; CSV to SQL comptait
  NVARCHAR en caractères (un emoji en vaut 2 sous SQL Server) et annonçait Oracle à tort ; Merge réunit les polices de
  formulaire (/DR) de tous les fichiers et ne force plus NeedAppearances ; JSON → .env refuse un nombre seul ; File
  Converter garde l'UTF-8 quand seuls quelques octets sont invalides ; TAR : la dernière copie d'un nom et les noms de
  lien longs GNU ; Compressor cherche l'animation APNG au-delà de 64 Ko ; TIFF : une vignette n'est plus comptée comme page.

**Ajouts (lot 3)** : **Image Compressor — compresser à une taille cible** (« 100 KB ») pour JPG / WebP / AVIF, par
dichotomie sur la qualité, image jamais réduite en silence (prouvé : 1200 × 900 demandé à 40 Ko → 39,6 Ko, dimensions
gardées) ; **QR Scanner** lit tous les codes d'une image avec zxing (QR, EAN-13, UPC, Code 128, Data Matrix, PDF417…,
jusqu'à 20 — prouvé sur une image QR + EAN-13) ; **Voice Recorder** : pause / reprise et export **MP3** (prouvé avec le
micro simulé de Chromium et Firefox). Bancs : dev 46/46 ×3, adds-lot 3/3 (WebKit : 1/1, compresseur et micro non
testables dans ce navigateur de test, dit), image 12/12 ×3, tiff 2/2 ×3, solidité 22/22 ×3, tests Node Merge/Split/SQL.

**Ajouts (lot 4)**, chacun prouvé (`scripts/p24/adds-lot.mjs`) :
- **Excel to PDF — « une page par feuille »** (champ Gotenberg `singlePageSheets`, transmis par notre route Vercel dans
  les deux chemins, direct et « staged », liste blanche d'options) : une feuille de 40 colonnes passe de **5 pages à 1**,
  mesuré contre notre vrai Gotenberg. Les options PowerPoint (notes, diapositives masquées) ne sont pas ouvertes : pas
  prouvées faute de fichier de test.
- **JPG to PDF / Image to PDF — format de page, orientation, marge** (iLovePDF, PDF24) : A4 / Letter / Legal / A5,
  orientation automatique par image, marges 10 ou 20 mm, image centrée jamais rognée ni agrandie (prouvé : page
  paysage pour l'image large, portrait pour l'image haute). La FAQ d'Image to PDF disait encore « JPG et PNG seulement,
  le reste ignoré en silence » — faux depuis P21, corrigée.
- **Image Resizer** : format de sortie (JPG, PNG, WebP) et qualité ; **Image Flip** « dans les deux sens » ; **Pixelator**
  en % de l'image ; **Find & Replace** : ignorer la casse, mots entiers (lettres de toutes les écritures — un premier
  essai écrivait `\p` dans un gabarit JavaScript et ne marchait pas : vu par le banc) ; **Diff Viewer** : mots changés
  surlignés, ignorer la casse ; **Media Player** : vitesse 0,5×-2×, boucle, image dans l'image, enregistrer l'image
  affichée, sous-titres .srt / .vtt.
Bancs : adds-lot 9/9 (Chromium), 8/8 (Firefox), 6/6 (WebKit, 2 non testables dits), solidité 31/31 ×3.

**Ajout (lot 5)** : **Video Metadata / Audio Metadata — supprimer les métadonnées sans réencodage** (metadata2go
« Metadata Remover ») : position GPS, dates, appareil, titre / artiste / commentaire, chapitres ; pistes de données
(position minutée d'un téléphone) et, pour l'audio, pochette retirées et dit ; image et son copiés tels quels. Prouvé :
un MP4 écrit par ffmpeg avec titre, position (+48.8584+002.2945) et date ressort sans aucun de ces tags, H.264 + AAC
copiés, même durée (ffprobe) ; un MP3 sans titre ni artiste. adds-lot 11/11 · 10/10 · 8/8, solidité 6/6 ×3.

**Ajout (lot 6)** : **Vidéo → GIF (6 pages) — nombre de lectures et compression** (ezgif « loop count », FreeConvert
« compression ») : toujours / une fois / 3 / 5 fois, compression légère ou forte, par gifsicle dans le navigateur sur le
GIF que le service a fait (service inchangé). **Non prouvé ici** : le service vidéo n'est pas configuré sur cette
machine ; le banc le dit (SKIP) et la vérification est notée pour la préversion. Les options gifsicle employées
(`--loopcount`, `--no-loopcount`, `--lossy`) sont les options standard, `--lossy` déjà prouvée dans GIF Compressor.

**Ajouts (lot 7)**, prouvés (`adds-lot.mjs` 17/17 · 16/16 · 13/13, solidité 16/16 ×3) : **Excel to CSV** — séparateur
(virgule, point-virgule pour l'Excel européen, tabulation, barre) et BOM UTF-8 (Excel rouvre alors les accents) ;
**CSV to JSON** — liste d'objets, liste de lignes (en-tête d'abord), **JSON Lines** (fichier .jsonl) ; **URL Encoder** (les
deux pages) — une valeur, une URL entière (garde : / ? # & =), RFC 3986 strict ; **Image to Base64** — URI data, Base64
seul, balise `<img>`, fond CSS, JSON ; **GIF Maker** — une durée propre à chaque image (prouvé : 200 ms puis 1000 ms
relus par sharp). Un ajout de FAQ mal placé (encodeur d'URL) a cassé la construction une fois : vu par le build, corrigé.

**Ajouts (lot 8)**, prouvés (`adds-lot.mjs` 22/22 · 21/21 · 17/17, solidité 27/27 ×3) : **Round Corners** — coins d'une
couleur au choix, un JPG reste alors un JPG (bien plus léger) ; **Add Noise** — bruit en couleur ; **Add Vignette** —
taille du centre clair ; **Brightness / Contrast** — saturation (matrice CSS `saturate()` aussi en calcul de secours pour
Safari) ; **Audio Waveform** — largeur, hauteur, couleurs, fond transparent, PNG dessiné à la taille choisie (prouvé
1200 × 150 transparent), zoom au doigt et boutons + / − ; **Screen Recorder** — pause / reprise (non testable dans le
navigateur de test : pas de capture d'écran simulée) ; **PDF Extract Text** — pages au choix et sans en-têtes
« Page N: ». Sous WebKit, l'enregistrement du PNG de l'onde passe par le chemin iPhone (non testable ici, dit).
