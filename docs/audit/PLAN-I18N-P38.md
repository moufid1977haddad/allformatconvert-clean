# PLAN I18N — P38 : le site en français, espagnol et arabe

> P38-0, 08/10/2026 (préparation en lecture seule : aucun changement du site). Branche `p38-0`, base = production P37 `bf930c88`.
> Décision du propriétaire : `/fr/ /es/ /ar/`. Ce document remplace, pour les langues, la piste S10 (`/fr/ /es/ /de/`) du
> rapport P35. Données brutes : `docs/audit/p38/volume-i18n.json` (volumes par outil), `docs/audit/p38/suggestions-08-10.json`
> (suggestions Google relevées le 08/10). Script de mesure : `scripts/p38/i18n-volume.mjs` (relançable).

## 0. En bref

| | Par langue | × 3 langues |
|---|---|---|
| **Socle minimal + 20 outils** (recommandé pour P38) | **193 883 caractères, 34 777 mots** | 581 649 caractères |
| Socle complet (12 pages de catégorie, pages de compte) + 20 outils | 223 597 car., 39 877 mots | 670 791 car. |
| Tout le site (225 outils + socle complet) | 1 003 946 car., 180 643 mots (162 370 mots uniques) | 3 011 838 car. |

- **Traduction automatique du socle + 20 outils, 3 langues : ≈ 2 à 20 $** (Google : 1,63 $ ; DeepL : ≈ 20 $). Tout le site : 50 à 81 $.
- **Relecture payée de l'espagnol (socle + 20 outils, 34 777 mots) : ≈ 1 400 à 4 900 $**, ≈ 2 400-3 500 $ au tarif courant
  (0,07-0,10 $/mot). Tout le site : ≈ 6 500 à 22 700 $.
- **Charge de relecture du propriétaire** (français et arabe) : 34 777 mots par langue, soit **≈ 23 à 35 h par langue** à
  1 000-1 500 mots/h. C'est le vrai goulot d'étranglement de P38 (§ 5.3).
- **Architecture** : deux mises en page racines par groupes de routes (`app/(en)/` inchangé en adresses, `app/(intl)/[lang]/`
  avec `<html lang dir>` justes dès le rendu serveur), dictionnaires par langue, adresses traduites à plat (`/fr/fusionner-pdf`).
- **Découpage** : 7 lots (§ 6) ; le premier est un déplacement de fichiers sans aucun changement visible, vérifié texte pour texte.

## 1. Volume réel à traduire

### 1.1 Méthode

`scripts/p38/i18n-volume.mjs` analyse chaque `.js/.jsx/.ts/.tsx` de `app/` avec le compilateur TypeScript (hors `app/api/`,
hors workers, hors `libraw`) et garde : le texte JSX, et les chaînes / gabarits qui se lisent comme du texte (une lettre et
une espace) ou qui sont dans un attribut ou une propriété de libellé (`title`, `placeholder`, `alt`, `aria-label`, `label`,
`q`, `a`, `description`, `value`, `message`…). Il écarte imports, `className`, `style`, `href`, `src`, `id`, `key`, `type`,
`console.*`, comparaisons (`===`), méthodes de chaîne et chaînes de classes Tailwind. Il compte titres et descriptions des
métadonnées (`layout.tsx`), texte de page, FAQ, étapes, caractéristiques, confidentialité, libellés, messages d'erreur et
d'état. Le JSON-LD n'est pas compté à part : `SeoContent` le génère à partir du texte visible.

**Contrôle sur un outil** (`pdf-merge`, 70 chaînes relues une à une) : tout le texte visible est pris ; bruit ≈ 1 % (« use
client », « unknown worker error ») ; les métadonnées OpenGraph répètent titre et description (comptés deux fois, d'où la
colonne « uniques »). Précision estimée : ± 5 %.

**Non compté** : messages renvoyés par les routes `app/api/` et affichés tels quels (à inventorier au lot 1 : il faudra
renvoyer des codes et traduire côté page) ; textes dans les images ; fichiers produits (noms `merged.pdf`…, à garder).

### 1.2 Chaînes communes

| Groupe | Fichiers | Caractères | Mots |
|---|---|---|---|
| Menu, pied de page, nom du site | `Navbar`, `Footer`, `SiteName` | 1 210 | 205 |
| Accueil et mise en page racine (métadonnées) | `app/page.jsx`, `HomeClient.jsx`, `app/layout.tsx` | 8 422 | 1 088 |
| Composants partagés (téléchargement, avis iPhone, préparation de page, `SeoContent`…) | `app/components/*` | 8 955 | 1 628 |
| Messages partagés + noms et descriptions des 225 outils | `app/lib/*` (`toolsRegistry`, `relatedTools`, `fileChecks`…) | 36 166 | 6 556 |
| Pages légales et À propos | `about`, `privacy`, `terms`, `contact` | 21 691 | 3 638 |
| Pages de compte | `signin`, `signup`, `forgot-password`, `reset-password` | 4 270 | 727 |
| Divers (`error.jsx`, `app/tools/ToolErrorWatch`…) | | 1 783 | 282 |
| Pages de catégorie (12) | `app/tools/<catégorie>/page.jsx + layout.tsx` | 52 002 | 9 291 |
| **Socle complet** | | **134 499** | **23 415** |
| **Socle minimal** : sans les comptes, et 6 pages de catégorie sur 12 (PDF 5 781, image 5 268, IA 4 653, vidéo 4 558, GIF 3 447, QR 2 851) | | **104 785** | **18 315** |

Les pages de compte restent en anglais au début (pas indexées, peu vues). Les 6 autres catégories n'ont aucun des 20 outils.

### 1.3 Les 225 outils

Médiane **3 637 caractères** par outil (≈ 670 mots) ; minimum 2 521 (`pdf-to-ppt`) ; maximum 13 858 (`barcode-generator`).
Par catégorie :

| Catégorie | Outils | Caractères | Mots |
|---|---|---|---|
| developer-tools | 57 | 216 346 | 37 704 |
| pdf-tools | 39 | 149 913 | 27 582 |
| image-tools | 37 | 126 138 | 23 228 |
| video-tools | 15 | 73 692 | 13 512 |
| text-tools | 17 | 59 095 | 10 623 |
| ai-tools | 16 | 54 951 | 9 822 |
| audio-tools | 11 | 47 601 | 8 773 |
| gif-tools | 11 | 38 213 | 7 107 |
| file-tools | 9 | 33 441 | 6 100 |
| qr-barcodes-tools | 3 | 25 131 | 4 786 |
| math-tools | 6 | 24 951 | 4 516 |
| converter-tools | 4 | 19 975 | 3 475 |
| **Total** | **225** | **869 447** | **157 228** |

Le détail outil par outil (caractères, mots, chaînes, uniques) est dans `docs/audit/p38/volume-i18n.json` (clé `tools`).

### 1.4 Les 20 outils choisis (§ 2) : 89 098 caractères, 16 462 mots par langue

| Outil | Car. | Mots | Outil | Car. | Mots |
|---|---|---|---|---|---|
| pdf-to-word | 4 007 | 736 | pdf-sign | 4 292 | 805 |
| pdf-merge | 5 296 | 970 | pdf-ocr | 5 185 | 956 |
| pdf-compress | 5 219 | 911 | image-compressor | 6 357 | 1 154 |
| jpg-to-pdf | 3 291 | 620 | background-remover | 4 221 | 760 |
| image-to-pdf | 3 769 | 711 | image-resizer | 3 712 | 692 |
| word-to-pdf | 4 631 | 812 | qr-generator | 5 894 | 1 113 |
| pdf-to-jpg | 3 012 | 586 | video-to-audio | 3 843 | 714 |
| pdf-to-excel | 3 118 | 604 | video-compressor | 7 802 | 1 390 |
| pdf-split | 4 624 | 899 | video-to-gif (gif-tools) | 3 606 | 667 |
| pdf-delete-pages | 2 650 | 523 | pdf-editor | 4 569 | 839 |

## 2. Les 20 outils

### 2.1 Critères et sources (relevés le 08/10/2026)

1. **Pages localisées des concurrents** dans les trois langues, lues dans leurs sitemaps :
   - **PDF24** (`tools.pdf24.org/sitemap.xml`) : **116 pages, toutes en fr, es et ar** (hreflang dans le sitemap).
   - **Smallpdf** (`smallpdf.com/sitemap.xml`) : **123 pages dans les trois langues** (les ≈ 55 outils PDF et l'accueil),
     238 de plus en fr + es seulement (surtout le blog).
   - **iLovePDF** (`ilovepdf.com/sitemap.xml`) : 53 pages en fr, 53 en es, 52 en ar — tous ses outils dans les trois langues.
   - **CloudConvert** : **anglais seulement** (`/fr`, `/es/pdf-to-docx`, `/ar` → 404 ; sitemap sans langue).
   - Aucun des quatre n'a d'outils image (hors conversion vers PDF), vidéo, QR ou IA localisés, sauf PDF24 (QR, mot de passe,
     HEIC→JPG/PNG, WebP→JPG/PNG). iLovePDF met l'image sur un autre site (iLoveIMG), hors de ce relevé.
2. **Suggestions de recherche Google** (point d'accès public d'autocomplétion, `hl=fr&gl=fr`, `hl=es&gl=es`, `hl=ar&gl=sa`) sur
   des préfixes génériques (« convertir », « compresser », « pdf en », « mp4 en », « supprimer », « générateur », « تحويل »,
   « ضغط », « دمج », « ازالة »…) : le rang dans les 10 suggestions donne la demande relative. 41 relevés, fichier
   `docs/audit/p38/suggestions-08-10.json`. Limite : rang relatif, pas un volume ; Google France / Espagne / Arabie saoudite
   seulement.
3. **Poids sur notre site** (aucune donnée de trafic par outil dans le dépôt : la Search Console n'est pas relevée) : les 6
   « Popular Tools » de l'accueil et du pied de page (`HomeClient.jsx`), et le nombre de liens « outils voisins » qui pointent
   vers l'outil (`app/lib/relatedTools.js`, hors la ligne de l’outil lui-même ; maximum 27 pour json-formatter).

### 2.2 Le choix, outil par outil

Notation : concurrents qui l'ont dans les 3 langues (I = iLovePDF, S = Smallpdf, P = PDF24) ; suggestions = langues où la
requête est dans les 10 suggestions du préfixe, avec son rang ; poids = accueil / liens entrants.

| # | Outil | Concurrents | Suggestions fr / es / ar | Poids | Pourquoi |
|---|---|---|---|---|---|
| 1 | pdf-merge | I S P | « fusionner pdf » 1er / « unir pdf » 1er / « دمج pdf » 1er | accueil, 16 | 1er partout, outil vedette |
| 2 | pdf-to-word | I S P | « pdf en word » 1er / « pdf a word » 1er / « تحويل pdf الى وورد » 1er | 9 | 1re requête de conversion dans les trois langues |
| 3 | pdf-compress | I S P | « compresser pdf » 1er / « comprimir pdf » 1er / « ضغط ملف بي دي اف » 2e | 16 | 1er en fr et es |
| 4 | jpg-to-pdf | I S P | « jpg en pdf » 1er / « jpg a pdf » 1er / « تحويل صورة الى بي دي اف » 5e (« تحويل ») | 6 | 2e requête sous « convertir » en fr et es |
| 5 | image-to-pdf | S P (I via JPG) | « image en pdf » 1er / « imagen a pdf » 1er / « تحويل صورة الى بي دي اف » 1er sous « تحويل صورة » | 9 | requête distincte de « jpg », 1re en arabe |
| 6 | word-to-pdf | I S P | « word en pdf » 2e / « word a pdf » 1er / « تحويل word الى pdf » 1er | 6 | 1er en es et ar |
| 7 | pdf-to-jpg | I S P | « pdf en jpeg » 2e / « pdf a jpg » 2e / « تحويل pdf الى jpg » 3e | 4 | 2e-3e partout |
| 8 | pdf-to-excel | I S P | « pdf en excel » 6e / « pdf a excel » 3e / « تحويل pdf الى اكسل » 5e | 7 | présent partout |
| 9 | pdf-split | I S P | « diviser pdf » 1er / « dividir pdf » 1er / « تقسيم pdf » 2e | 10 | 1er en fr et es |
| 10 | pdf-delete-pages | I S P | « supprimer page pdf » 1er / « eliminar paginas pdf » 2e / — | 6 | 1er sous « supprimer » en fr |
| 11 | pdf-editor | I S P | « modifier pdf » 1er / « editar pdf » 1er / « تعديل pdf » 1er | 9 | 1er partout |
| 12 | pdf-sign | I S P | « signer pdf » 1er / « firmar pdf » 1er / « توقيع ملف pdf » 2e | 6 | 1er en fr et es |
| 13 | pdf-ocr | I S P | « pdf a ocr » 7e ; « image en texte », « imagen a texto », « تحويل صورة الى نص » forts mais **notre OCR ne prend que des PDF** | 9 | concurrents unanimes ; voir l'écart § 2.3 |
| 14 | image-compressor | — | « compresser image » 2e / « comprimir imagenes » 5e / « ضغط الصور » 5e | accueil, 26 | 2e outil le plus lié du site, demande dans les 3 langues |
| 15 | background-remover | — | « retirer le fond d’une image » 1er, « enlever le fond » 1er, « supprimer fond image » 5e / « quitar fondo » 1er / « ازالة الخلفية » 1er | accueil, 5 | 1er sous deux préfixes en fr, 1er en es et ar ; aucun concurrent PDF localisé |
| 16 | image-resizer | — | « redimensionner image » 1er / « redimensionar imagen » 1er / « تغيير حجم الصورة » 1er | 18 | 1er partout |
| 17 | qr-generator | P | « générateur de qr code » 3e / « generador de qr » 5e / « تحويل … الى باركود » (le QR se dit « باركود ») | accueil, 4 | demande dans les 3 langues |
| 18 | video-to-audio | — | « mp4 en mp3 » 1er / « mp4 a mp3 » 1er / « تحويل فيديو الى mp3 » 1er | 5 | 1er partout ; aucun concurrent de la liste |
| 19 | video-compressor | — | « compresser video » 3e / « comprimir video » 2e / « ضغط فيديو » 8e | 10 | présent partout |
| 20 | video-to-gif (gif-tools) | — | « mp4 en gif » 2e / « mp4 a gif » 2e / « تحويل فيديو الى gif » 3e | accueil, 8 | présent partout ; outil de l'accueil |

**Écartés de justesse (remplaçants dans l'ordre)** : `heic-to-jpg` (P ; « heic to jpg » 1er en fr, « heic a jpg » 1er en es ;
requête souvent en anglais), `pdf-to-ppt` (I S P ; « pdf en ppt » 9e), `png-to-jpg` (« png en jpg » 2e / « png a jpg » 2e /
« تحويل png الى jpg » 2e), `mp4-to-gif` (même requête que n° 20), `password-generator` (P ; « générateur de mot de passe »
1er, « generador de contraseñas » 4e). **Écartés** : `currency-converter` (requêtes fortes dans les 3 langues, mais captées
par le convertisseur intégré de Google) ; `grammar-fixer` (accueil, mais aucune preuve de demande ni de concurrent ; coût
d'IA par usage) ; `audio-transcriber` (« تحويل الصوت الى نص » 1er, mais coût d'IA par minute).

### 2.3 Écarts relevés (hors P38, pour mémoire)

- **Image → texte (OCR d'image)** : requête forte dans les trois langues (« image en texte », « imagen a texto »,
  « تحويل صورة الى نص », « استخراج النص من الصور » 1er) ; nous n'avons pas d'outil OCR d'image (`pdf-ocr` : `accept=".pdf"`).
- **Dates hégire ↔ grégorien** et **devises** dominent « تحويل » et « محول » en arabe ; nous n'avons pas de convertisseur de dates.

## 3. Marché : comment iLovePDF, Smallpdf et PDF24 structurent leurs langues

Relevé direct le 08/10 (HTML et sitemaps, voir § 2.1).

| | iLovePDF | Smallpdf | PDF24 | CloudConvert |
|---|---|---|---|---|
| Adresses | sous-répertoire ; anglais à la racine (`/merge_pdf`), autres langues `/fr/…` | sous-répertoire ; anglais à la racine | sous-répertoire pour **toutes** les langues, anglais compris (`/en/`) | anglais seul |
| Noms d'outils dans l'adresse | traduits en fr et es (`/fr/pdf_en_jpg`, `/fr/deverrouiller_pdf`, `/es/unir_pdf`) ; **anglais en arabe** (`/ar/merge_pdf`) | traduits en fr et es (`/fr/convertisseur-pdf`, `/es/convertidor-pdf`, `/es/unir-pdf`) ; **anglais en arabe** (`/ar/pdf-converter`) | traduits en fr et es (`/fr/fusionner-pdf`, `/es/unir-pdf`) ; **anglais en arabe** (`/ar/heic-to-png`) | — |
| hreflang | **aucun** trouvé (ni balise, ni en-tête, ni sitemap) | dans le **sitemap** (`xhtml:link`, fr/es/ar + `x-default` = anglais) ; pas dans le HTML | dans le **sitemap** (`x-default` = `/en/`) ; pas dans le HTML | — |
| Canonique | chaque langue vers elle-même | idem | idem | — |
| Accueil | `/fr`, `/es`, `/ar` traduits | idem | idem | — |
| Arabe | `<html lang="ar" dir="rtl">`, `body.rtl` | `<html lang="ar">` **sans `dir`** dans le HTML serveur (RTL appliqué ensuite) | `<html lang="ar" dir="rtl">` | — |
| Chiffres en arabe | **occidentaux** (0 chiffre arabe-indien) | **occidentaux** (« 1 ميغابايت », « 99% ») | **occidentaux** (« 100% ») | — |
| Sélecteur de langue | menu de langues (pied de page) | lien vers la **page équivalente** (`/fr/compresser-pdf` trouvé dans `/ar/compress-pdf`) | idem (`/fr/compresser-pdf` dans la page arabe) | — |
| Couverture | tous ses outils (~50) | ~55 outils PDF + accueil dans les 3 langues | 116 pages dans les 3 langues | — |

**À retenir** : (1) sous-répertoires partout ; (2) noms d'adresses traduits en fr et es, **anglais en arabe** chez les trois ;
(3) les hreflang dans le sitemap suffisent aux deux mieux placés ; nous les mettrons **dans le HTML et dans les sitemaps**
(Google accepte les deux ; le HTML se vérifie page par page) ; (4) chiffres occidentaux en arabe ; (5) le sélecteur mène
à la page équivalente, pas à l'accueil.

## 4. Architecture recommandée (à construire en P38, rien n'est écrit ici)

### 4.1 Routage sans toucher aux adresses anglaises

Contrainte : `app/layout.tsx` est la seule mise en page racine et écrit `<html lang="en-US">` en dur. Lire la langue dans
cette mise en page (en-têtes, `headers()`) rendrait les 243 pages dynamiques : exclu.

**Recommandé — deux mises en page racines par groupes de routes** (guide Next 16.2.6,
`node_modules/next/dist/docs/01-app/02-guides/internationalization.md` et `route-groups`) :
- `app/(en)/` : tout l'existant y est déplacé (`git mv`) ; **les adresses ne changent pas** (un groupe entre parenthèses
  n'apparaît pas dans l'URL). `app/(en)/layout.tsx` = la mise en page racine actuelle.
- `app/(intl)/[lang]/layout.tsx` : seconde racine, `<html lang={lang} dir={lang === 'ar' ? 'rtl' : 'ltr'}>`,
  `generateStaticParams` → `fr`, `es`, `ar`, `dynamicParams = false` (toute autre valeur → 404).
- `app/(intl)/[lang]/[slug]/page.jsx` : une seule route à plat pour les outils et les catégories traduits, alimentée par une
  table `slugs` (`fusionner-pdf` → `/tools/pdf-tools/pdf-merge`) ; `generateStaticParams` ne produit que les pages traduites
  ET relues.
- Passer d'une racine à l'autre recharge la page entière : sans effet ici (on change de langue).
- **Coût** : les imports relatifs des pages déplacées cassent (498 imports `../../../components` dans `app/tools`, 411 fichiers
  utilisent déjà l'alias `@/app/…`) → un script remplace tous les imports relatifs vers `app/` par l'alias `@/app/…` avant le
  déplacement. Les routes `app/api/` et les fichiers spéciaux (`robots.ts`, `sitemap.ts`, `ads.txt`, icônes) restent à la racine
  de `app/` (ils n'ont pas de mise en page). À vérifier au lot 1 : `error.jsx` et `not-found` par racine.
- **Pas de redirection automatique selon `Accept-Language`** (Google explore sans cet en-tête ; une redirection masquerait
  les pages anglaises) : au plus un bandeau « Cette page existe en français » côté navigateur.

**Écarté** : une seule racine avec `<div lang dir>` autour du contenu et un menu qui lit l'adresse côté navigateur : `<html>`
resterait `en-US` dans le HTML servi (faux pour Bing, les lecteurs d'écran au premier rendu, et la page arabe se dessinerait
d'abord de gauche à droite).

**Adresses traduites** (décision P38-D1) : à plat, nom traduit en fr et es, anglais en arabe, comme les trois concurrents :
`/fr/fusionner-pdf`, `/es/unir-pdf`, `/ar/merge-pdf` ; catégories `/fr/outils-pdf`, `/es/herramientas-pdf`, `/ar/pdf-tools` ;
accueils `/fr`, `/es`, `/ar` ; pages légales `/fr/confidentialite`… Les anciennes adresses ne bougent pas ; aucune redirection.

### 4.2 Sources des traductions

- Un dossier `i18n/` à la racine : `i18n/common/{en,fr,es,ar}.js` (menu, pied de page, accueil, composants, messages partagés),
  `i18n/tools/<outil>/{en,fr,es,ar}.js` (texte de la page, FAQ, étapes, caractéristiques, messages), `i18n/slugs.js`.
- **Modules JS plutôt que JSON** : beaucoup de textes contiennent des valeurs (`Up to ${officeMaxLabel(…)} per document`) ;
  une entrée = une chaîne avec `{marques}` ou une fonction. Pluriels par `Intl.PluralRules` — **l'arabe a 6 formes**
  (zero, one, two, few, many, other) contre 2 en anglais : chaque message à nombre variable doit les fournir.
- L'anglais est extrait des pages actuelles **sans changer un caractère** : la page lit `en.js` et le texte servi reste
  identique (contrôle § 4.8).
- Les dictionnaires sont lus côté serveur ; la page client ne reçoit que la langue servie (pas les quatre).
- Formats : nombres et tailles par langue (`1,5 Mo` en français — Mo/Ko/Go —, `1,5 MB` en espagnol, `1.5 ميغابايت` en arabe
  avec chiffres occidentaux : `Intl.NumberFormat('ar-u-nu-latn')`), dates par `Intl.DateTimeFormat`. `app/lib/formatBytes.js`
  prend la langue en paramètre.
- Noms de fichiers produits (`merged.pdf`) : gardés en anglais (aucun concurrent ne les traduit ; évite les accents dans les
  noms téléchargés sur iPhone).

### 4.3 Métadonnées et données structurées

- Chaque page traduite exporte `generateMetadata` : titre, description, OpenGraph (`locale: fr_FR / es_ES / ar_AR`),
  `alternates.canonical` vers elle-même, `alternates.languages` (§ 4.4).
- `SeoContent` reçoit le texte traduit : le JSON-LD (FAQPage, HowTo, SoftwareApplication, fil d'Ariane) suit
  automatiquement ; ajouter `inLanguage`. Le contrôle JSON-LD de P36 (« 225 ALL PASS ») passe aux pages traduites.
- `app/(en)/layout.tsx` garde `lang="en-US"` ; le titre racine « … | OnlineConverTools » reste la marque dans toutes les langues.

### 4.4 hreflang et sitemaps

- Sur chaque page qui a des traductions **publiées**, dans le HTML : `en` (+ `x-default`) ↔ `fr` ↔ `es` ↔ `ar`, réciproques ;
  la page anglaise des 20 outils reçoit aussi ces liens. Une page sans traduction n'en a aucun (jamais de lien vers une 404).
- Une table unique (`i18n/slugs.js`) produit à la fois les hreflang, les sitemaps et le sélecteur : impossible d'en oublier un.
- Sitemaps : `app/sitemap.ts` passe à `generateSitemaps` (ou routes `sitemap-fr.xml`…) : un sitemap par langue, entrées avec
  `alternates.languages` ; `robots.ts` les liste tous. Search Console : déclarer les trois sitemaps (geste du propriétaire).

### 4.5 Arabe de droite à gauche

- `<html lang="ar" dir="rtl">` dès le serveur ; `Noto Sans Arabic` (déjà chargée, `preload: false`) passe en préchargée dans la
  racine `(intl)` quand `lang = ar` uniquement ; les règles `html[dir="rtl"]` de `globals.css` (faites pour Google Translate)
  servent de base.
- **Miroir de l'interface** : 3 509 classes Tailwind « physiques » (`ml-`, `pr-`, `left-`, `text-left`, `space-x`…) dans
  `app/`, dont ≈ 30-45 par outil et 274 dans `app/components` → remplacées par les classes logiques de Tailwind v4 (`ms-`,
  `pe-`, `start-`, `text-start`) dans les fichiers des 20 outils et du socle (≈ 1 000 occurrences), `rtl:space-x-reverse`
  où il faut ; flèches et icônes de direction retournées (pas les icônes de lecture ou de logo). Le reste du site n'est pas
  touché (pas servi en arabe).
- **Texte mixte** : noms de fichiers, extensions, tailles, codes, adresses dans une phrase arabe → `<bdi>` / `dir="auto"`,
  sinon « file.pdf » et « 700 MB » se retournent.
- **Chiffres** : occidentaux (0-9), comme les trois concurrents (§ 3) — décision P38-D2.
- Champs de saisie : `dir="auto"` pour le texte de l'utilisateur.

### 4.6 Retrait du widget Google Translate

- La racine `(intl)` ne rend ni `GoogleTranslateLoader`, ni `#google_translate_element`, ni le correctif DOM
  `google-translate-dom-patch`.
- Sur les pages anglaises, le menu des 13 langues garde le widget, mais pour fr / es / ar il mène à la page traduite quand elle
  existe (`i18n/slugs.js`), et au widget sinon. Le cookie `googtrans` est effacé en arrivant sur une page traduite (sinon le
  widget retraduirait une page déjà traduite en revenant sur l'anglais).

### 4.7 Effet sur les 225 pages et sur les contrôles

- **Lot 1** touche tous les fichiers (déplacement + imports), **sans aucun changement visible** : preuve = texte servi
  identique sur les 243 pages (§ 4.8) + `check-tool-links`, `related-tools-check`, `content-verify`, contrôle JSON-LD.
- Seuls les 20 outils et le socle sont ensuite modifiés (extraction des chaînes) ; les 205 autres pages ne changent que d'import.
- **www-light** (`scripts/p24/www-light.mjs`, 29 contrôles) : ajouter `/fr`, `/es`, `/ar`, un outil par langue (avec un vrai
  téléchargement), et vérifier `lang`, `dir`, canonique, hreflang réciproques, absence du widget. Les bancs lourds restent en
  local (règle Vercel du 03/10).
- Nouveau contrôle au build : clé manquante, `{marque}` perdue ou forme plurielle arabe absente → le build échoue.

### 4.8 Contrôle « l'anglais n'a pas bougé »

`scripts/p38/i18n-volume.mjs` sert de base : avant/après chaque lot, extraire le texte de chaque page anglaise **rendue**
(HTML servi en local, pas le code source) et exiger l'égalité caractère pour caractère, sauf changements voulus et listés.

### 4.9 Risques (du plus grave au moins grave)

| # | Risque | Parade |
|---|---|---|
| R1 | Déplacement de 243 pages dans `(en)` : import cassé, métadonnées perdues, page 404 | script d'imports, build, § 4.8 sur les 243 pages, `check-tool-links`, `www-light` sur préversion |
| R2 | L'extraction des chaînes change le texte anglais (le site en production) | § 4.8 caractère pour caractère |
| R3 | Traduction automatique qui casse une `{marque}`, un pluriel, un nom de format (« JPG », « PDF/A ») | glossaire DeepL / balises protégées, contrôle au build, relecteur indépendant sur ces points |
| R4 | Pages traduites publiées non relues → contenu « de faible valeur » (AdSense, Google) | une page n'entre dans `generateStaticParams` et le sitemap **qu'une fois relue** |
| R5 | Arabe : interface mal retournée, texte mixte inversé, police non chargée | classes logiques, `<bdi>`, essais 390 et 1 280 px en Chromium et WebKit, relecteur RTL |
| R6 | hreflang non réciproques ou vers une page absente | une seule table produit tout ; contrôle www-light |
| R7 | Widget Google Translate qui retraduit une page traduite (cookie `googtrans`) | widget absent de `(intl)`, cookie effacé |
| R8 | Messages des routes `app/api/` en anglais au milieu d'une page traduite | codes d'erreur traduits côté page (inventaire au lot 1) |
| R9 | Coût de maintenance : chaque correction anglaise future doit toucher 3 langues | contrôle de clés au build ; règle au plan |
| R10 | Charge de relecture du propriétaire (≈ 23-35 h par langue) | lots de relecture courts, par outil ; d'abord les titres, descriptions, FAQ |

### 4.10 Ordre des étapes

1. Déplacement `(en)` + imports, zéro changement visible (le plus risqué, en premier, seul).
2. Bibliothèque i18n (langues, chargement, pluriels, formats) + racine `(intl)` + table `slugs` + contrôles.
3. Socle : menu, pied de page, accueil, 6 catégories, pages légales, composants, messages ; sitemaps, hreflang, sélecteur.
4. Arabe RTL sur le socle.
5. Outils 1-10, puis 11-20 (extraction en anglais identique, puis traductions).
6. Relectures intégrées, audit structurel complet des pages traduites (règle absolue : pas de date avant audit), préversion.
7. Mise en production par le propriétaire ; mesure dans la Search Console 6 à 8 semaines après.

## 5. Coûts

### 5.1 Traduction automatique (volumes du § 1)

| Service | Tarif | Socle minimal + 20 outils, 3 langues (581 649 car.) | Tout le site, 3 langues (3 011 838 car.) |
|---|---|---|---|
| Google Cloud Translation, NMT | 500 000 car./mois gratuits, puis **20 $ / million** ([page officielle](https://cloud.google.com/translate/pricing), lue le 08/10) | **1,63 $** (81 649 car. payants) ; 0 $ sur deux mois | **50,24 $** sur un mois |
| Google, Translation LLM | **10 $ / M en entrée + 10 $ / M en sortie** (même page) | ≈ 12 $ | ≈ 60 $ |
| DeepL API Pro | **5,49 $ / mois + 25 $ / million** (sources secondaires : [G2](https://www.g2.com/products/deepl-api/pricing), [usagepricing](https://usagepricing.com/blueprint/deepl) ; la page officielle `deepl.com/pro-api` redirige vers les offres « Translator » — **à confirmer dans la console DeepL**) | **≈ 20 $** (14,54 + 5,49) | **≈ 81 $** (75,30 + 5,49) |

Prévoir × 1,5 pour les retraductions après corrections : moins de 30 $ pour P38, quel que soit le service.
**Recommandation** : DeepL (glossaire, balises protégées, bonne qualité en français ; l'arabe y est proposé — à vérifier sur un
échantillon) ou Google NMT (quasi gratuit). La clé est créée et gardée par le propriétaire (variable d'environnement locale ;
jamais dans la conversation). **Traduire avec Claude dans les sessions est possible mais consomme la limite hebdomadaire**
(≈ 580 000 caractères à écrire) : à réserver aux reprises ciblées.

### 5.2 Relecture humaine de l'espagnol

Tarifs publics : profils ProZ anglais → espagnol en relecture **0,04 à 0,20 $/mot**, le plus souvent **0,07-0,14 $**
([ProZ, profils publics](https://www.proz.com/pro/62552)) ; Gengo : traduction humaine en→es **0,06 $/mot** (Standard) et
**0,12 $/mot** (Advanced) ([Gengo](https://gengo.com/professional-translation/english-spanish/)).

| Périmètre | Mots | 0,04 $ | 0,07 $ | 0,10 $ | 0,14 $ |
|---|---|---|---|---|---|
| Socle minimal + 20 outils | 34 777 | 1 391 $ | 2 434 $ | 3 478 $ | 4 869 $ |
| Socle complet + 20 outils | 39 877 | 1 595 $ | 2 791 $ | 3 988 $ | 5 583 $ |
| Tout le site (mots uniques) | 162 370 | 6 495 $ | 11 366 $ | 16 237 $ | 22 732 $ |

Pistes pour réduire : relecture de traduction automatique (« post-édition ») négociée sous le tarif de traduction ; commencer
par les titres, descriptions, FAQ et étapes (≈ 60 % des mots des pages d'outil) ; le relecteur reçoit un tableau
(anglais / espagnol / contexte), pas le code.

### 5.3 Temps du propriétaire (français et arabe)

34 777 mots par langue → ≈ 23-35 h par langue à 1 000-1 500 mots/h. Proposition : relire par lot d'outils (≈ 1 700 mots
= 1 à 2 h chacun), dans un tableau anglais / traduction avec la page de préversion à côté.

## 6. Découpage de P38

Aucun sous-agent, sauf **un relecteur indépendant** aux points marqués 🔎. Estimations de consommation relatives (S ≈ une
session courte, M ≈ une session normale, L ≈ une session longue avec build et bancs locaux).

| Lot | Contenu | Livrable vérifié | Taille | Dépend de |
|---|---|---|---|---|
| P38-1 | Imports relatifs → alias ; déplacement dans `app/(en)/` ; contrôle § 4.8 (texte rendu des 243 pages identique) ; inventaire des messages `app/api/` | build vert, 243/243 identiques, contrôles P35/P36 verts, www-light sur préversion | **L** | — |
| P38-2 | Bibliothèque i18n, racine `(intl)/[lang]`, table `slugs`, pluriels/formats, contrôle de clés au build, sitemaps par langue + hreflang (vides tant que rien n'est publié) | `/fr` etc. en 404 tant que rien n'est relu ; tests unitaires pluriels arabes et formats | **M** 🔎 (hreflang, pluriels) | 1 |
| P38-3 | Socle : extraction en anglais identique (menu, pied, accueil, 6 catégories, légal, composants, messages) ; traduction automatique fr/es/ar ; sélecteur ; widget retiré sur `(intl)` | anglais identique ; tableaux de relecture produits | **L** | 2 + clé de traduction (P38-D3) |
| P38-4 | Arabe RTL sur le socle : classes logiques, `<bdi>`, police, icônes | 390 / 1 280 px, Chromium + WebKit, 0 débordement | **M** 🔎 (RTL) | 3 |
| P38-5 | Outils 1-10 (PDF) : extraction, traduction, RTL, métadonnées, JSON-LD | anglais identique ; JSON-LD ALL PASS ; un vrai fichier par outil et par langue en local | **L** | 3, 4 |
| P38-6 | Outils 11-20 (PDF restants, image, QR, vidéo) | idem | **L** | 5 |
| P38-7 | Intégration des relectures (propriétaire fr/ar, relecteur es), audit structurel complet des pages traduites, www-light étendu, préversion ; production = geste du propriétaire | rapport final, préversion vérifiée | **M** 🔎 (audit) | relectures rendues |

Les relectures humaines courent en parallèle des lots 5-6 (le socle peut être relu dès la fin du lot 3).

## 7. Décisions du propriétaire

| # | Décision | Recommandation |
|---|---|---|
| P38-D1 | Adresses : traduites à plat en fr/es, anglais en arabe (`/fr/fusionner-pdf`, `/ar/merge-pdf`) | oui, comme les 3 concurrents |
| P38-D2 | Chiffres en arabe | occidentaux (0-9), comme les 3 concurrents |
| P38-D3 | Service de traduction automatique et sa clé (créée et gardée par le propriétaire) | DeepL API (≈ 20 $) ou Google NMT (≈ 2 $) |
| P38-D4 | Relecteur espagnol payé (ProZ, Gengo ou autre) et budget | socle minimal + 20 outils, 34 777 mots, ≈ 2 400-3 500 $ |
| P38-D5 | Les 20 outils du § 2.2 (ou remplaçants) | liste du § 2.2 |
| P38-D6 | Pages de compte et 6 catégories restantes en anglais au début | oui |
