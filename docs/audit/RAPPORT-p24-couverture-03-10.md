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
