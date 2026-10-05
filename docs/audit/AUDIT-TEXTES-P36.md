# AUDIT DES TEXTES — P36 lot 2 (06/10) : ce qui doit disparaître

Lecture seule, **avant toute réécriture**. Texte servi relu **sur www** le 05/10 au soir (`scripts/p36/extract-content.mjs`,
HTML brut, 225 pages, `docs/audit/p36/contenu-avant.json`) ; chaque affirmation confrontée au code par 14 auditeurs
(sous-agents, un lot chacun, consignes `docs/audit/p36/CONSIGNES-AUDIT-LOT2.md`), avec fichier:ligne. Tableaux complets par
lot : `docs/audit/p36/audit/<lot>.md` ; fiches de faits (libellés, formats, limites, lieu de traitement) :
`docs/audit/p36/faits/<lot>.json`.

Types : **FAUX** (contredit par le code), **INVÉRIFIABLE** (aucune preuve), **TROMPEUR** (vrai seulement en partie),
**GÉNÉRIQUE** (phrase copiable sur une autre page), **MINCE** (information propre manquante), **LIBELLÉ** (bouton cité
inexistant ou mal nommé), **FORMAT** (format annoncé non accepté, ou accepté et non dit).

## 1. Défauts par lot

| Lot | Outils | FAUX | INVÉRIFIABLE | TROMPEUR | GÉNÉRIQUE | MINCE | LIBELLÉ | FORMAT | Total |
|---|---|---|---|---|---|---|---|---|---|
| pdf-1 | 19 | 5 | 15 | 55 | 15 | 10 | 1 | 5 | **106** |
| pdf-2 | 20 | 11 | 14 | 44 | 22 | 16 | 0 | 1 | **108** |
| image-1 | 18 | 20 | 8 | 32 | 63 | 19 | 2 | 5 | **149** |
| image-2 | 19 | 32 | 7 | 24 | 73 | 10 | 1 | 17 | **164** |
| audio | 15 | 12 | 9 | 32 | 34 | 12 | 1 | 15 | **115** |
| video | 11 | 10 | 6 | 22 | 5 | 9 | 2 | 7 | **61** |
| gif-file | 19 | 7 | 14 | 23 | 21 | 20 | 2 | 2 | **89** |
| text | 16 | 10 | 9 | 23 | 48 | 4 | 3 | 2 | **99** |
| dev-data | 16 | 11 | 8 | 22 | 24 | 11 | 1 | 5 | **82** |
| dev-code | 18 | 35 | 6 | 25 | 39 | 0 | 0 | 1 | **106** |
| dev-encode | 13 | 6 | 10 | 21 | 43 | 15 | 3 | 0 | **98** |
| dev-misc | 13 | 12 | 2 | 19 | 18 | 13 | 2 | 4 | **70** |
| convert-qr-math | 12 | 18 | 10 | 23 | 19 | 5 | 4 | 6 | **85** |
| ai | 16 | 14 | 19 | 29 | 29 | 8 | 0 | 4 | **103** |
| **Total** | **225** | **203** | **137** | **394** | **453** | **152** | **22** | **74** | **1435** |

## 2. Passages dupliqués entre pages (mesure `scripts/p36/uniqueness.mjs`, phrases identiques)

- Paires de pages partageant au moins une phrase : 25 paires **au-delà de 30 %** de phrases identiques ; maximum **84.0 %**.
- Phrases présentes sur 3 pages ou plus : **101**.

| Part identique | Page A | Page B |
|---|---|---|
| 84.0 % | /tools/gif-tools/avi-to-gif | /tools/gif-tools/webm-to-gif |
| 83.3 % | /tools/gif-tools/avi-to-gif | /tools/gif-tools/mov-to-gif |
| 83.3 % | /tools/gif-tools/mov-to-gif | /tools/gif-tools/webm-to-gif |
| 76.0 % | /tools/gif-tools/avi-to-gif | /tools/gif-tools/mp4-to-gif |
| 76.0 % | /tools/gif-tools/mp4-to-gif | /tools/gif-tools/webm-to-gif |
| 75.0 % | /tools/gif-tools/mov-to-gif | /tools/gif-tools/mp4-to-gif |
| 68.8 % | /tools/pdf-tools/pdf-to-image | /tools/pdf-tools/pdf-to-jpg |
| 60.0 % | /tools/gif-tools/mp4-to-gif | /tools/gif-tools/video-to-gif |
| 56.0 % | /tools/gif-tools/avi-to-gif | /tools/gif-tools/video-to-gif |
| 56.0 % | /tools/gif-tools/video-to-gif | /tools/gif-tools/webm-to-gif |
| 55.6 % | /tools/developer-tools/markdown-editor | /tools/developer-tools/markdown-previewer |
| 54.2 % | /tools/gif-tools/mov-to-gif | /tools/gif-tools/video-to-gif |
| 47.8 % | /tools/pdf-tools/epub-to-pdf | /tools/pdf-tools/mobi-to-pdf |
| 47.1 % | /tools/developer-tools/json-to-csharp | /tools/developer-tools/json-to-go |
| 45.5 % | /tools/audio-tools/audio-metadata | /tools/video-tools/video-metadata |
| 44.4 % | /tools/pdf-tools/pdf-to-excel | /tools/pdf-tools/pdf-to-ppt |
| 42.1 % | /tools/developer-tools/cron-expression | /tools/developer-tools/cron-expression-builder |
| 41.7 % | /tools/gif-tools/video-to-gif | /tools/video-tools/video-to-gif |
| 41.2 % | /tools/developer-tools/json-to-csharp | /tools/developer-tools/json-to-python |
| 38.9 % | /tools/developer-tools/json-to-go | /tools/developer-tools/json-to-python |
| 37.0 % | /tools/pdf-tools/image-to-pdf | /tools/pdf-tools/jpg-to-pdf |
| 33.3 % | /tools/developer-tools/csv-to-json | /tools/developer-tools/csv-to-sql |
| 33.3 % | /tools/developer-tools/json-to-go | /tools/developer-tools/json-to-rust |
| 31.8 % | /tools/image-tools/tiff-to-jpg | /tools/image-tools/tiff-to-png |
| 31.6 % | /tools/image-tools/gif-to-png | /tools/image-tools/jpg-to-png |

Phrases les plus répétées (toutes disparaissent à la réécriture) :

| Pages | Phrase |
|---|---|
| 92 | yes, it's completely free with no signup required |
| 27 | is my file uploaded anywhere |
| 17 | is my data private |
| 17 | click the upload area and select a pdf file from your device |
| 15 | it accepts common formats your browser can open, such as jpg, png, and webp |
| 14 | click the upload area and select an image from your device |
| 14 | is my data uploaded to a server |
| 13 | is my file uploaded to a server |
| 12 | yes, it's completely free with no registration required |
| 12 | the result keeps your image's format: a jpg stays a jpg, a png stays a png (transparency included), a webp stays a webp |
| 11 | is my text uploaded to a server |
| 10 | preview the converted image |
| 9 | is my code uploaded to a server |
| 8 | no — everything runs in your browser; the engine is downloaded once when you first click |
| 8 | there's no fixed size limit — processing happens locally in your browser, so it's limited only by your device's available memory |
| 8 | click the download button to save your png file |
| 8 | yes, it's 100% free with no registration required |
| 8 | no — everything happens in your browser |
| 7 | click the upload area and select an audio file |
| 7 | no, only one file can be converted at a time — there's no batch upload |
| 7 | yes, it's free with no signup required |
| 6 | is there a file size limit |
| 6 | click 'copy' to copy the result |
| 6 | click 'copy' to copy it to your clipboard |
| 6 | click 'copy' to copy the code into your project |
| 6 | is my video uploaded |
| 6 | 480 px and 10 fps is a good balance for sharing in chats and on social media |
| 6 | play the video above to find the exact second where your clip should start |
| 6 | your image is never uploaded to a server |
| 5 | is there a size limit |
| 5 | click 'copy' to copy it |
| 5 | paste your json into the input box |
| 5 | paste a json object or array (an api response, a config file) into the input box |
| 5 | click 'convert': one named type is generated for every nested object, and the fields of every element of an array are merged |
| 5 | review the output — fields missing from some elements or holding null are marked optional |
| 5 | yes, completely free with no registration required |
| 5 | pick where the clip starts, how long it lasts (up to 60 seconds), the width and the frame rate |
| 5 | your file is deleted from our server as soon as you have downloaded the gif |
| 5 | set the start time and the length of the clip (up to 60 seconds) |
| 5 | choose the width and frames per second — smaller values make a lighter gif |

## 3. Textes trop minces (bloc de contenu < 300 mots, liens « Related tools » compris)

| Catégorie | Pages | Médiane | Min | Max | < 300 mots |
|---|---|---|---|---|---|
| ai-tools | 16 | 353 | 309 | 555 | 0 |
| audio-tools | 11 | 415 | 375 | 977 | 0 |
| converter-tools | 4 | 468 | 398 | 520 | 0 |
| developer-tools | 57 | 348 | 221 | 971 | 13 |
| file-tools | 9 | 392 | 287 | 614 | 1 |
| gif-tools | 11 | 377 | 316 | 482 | 0 |
| image-tools | 37 | 305 | 250 | 912 | 14 |
| math-tools | 6 | 383 | 287 | 782 | 1 |
| pdf-tools | 39 | 458 | 255 | 1133 | 3 |
| qr-barcodes-tools | 3 | 510 | 476 | 928 | 0 |
| text-tools | 17 | 286 | 215 | 460 | 9 |
| video-tools | 15 | 428 | 290 | 669 | 2 |

43 pages : text-tools/lorem-ipsum (215), developer-tools/markdown-to-html (221), text-tools/text-truncator (224), developer-tools/css-formatter (228), text-tools/text-repeater (228), developer-tools/html-formatter (230), developer-tools/scss-to-css (245), image-tools/webp-to-jpg (250), image-tools/webp-to-png (250), text-tools/ascii-art (250), text-tools/duplicate-remover (253), text-tools/text-to-list (253), pdf-tools/pdf-rotate (255), developer-tools/javascript-formatter (257), developer-tools/typescript-to-js (258), image-tools/bmp-to-png (259), developer-tools/sql-formatter (261), image-tools/heic-to-png (262), image-tools/image-inverter (264), developer-tools/code-minifier (266), image-tools/image-resizer (269), image-tools/jpg-to-png (271), image-tools/sepia-filter (273), image-tools/image-flip (275), image-tools/png-to-jpg (279), text-tools/text-sorter (279), text-tools/text-reverser (280), image-tools/brightness-contrast (281), text-tools/text-comparator (286), developer-tools/diff-viewer (287), developer-tools/url-parser (287), file-tools/file-encryptor (287), math-tools/roman-numeral-converter (287), video-tools/video-to-audio (290), developer-tools/html-encoder (294), pdf-tools/pdf-to-ppt (294), image-tools/heic-to-jpg (295), image-tools/image-rotate (295), developer-tools/yaml-to-json (297), pdf-tools/pdf-unlock (297), developer-tools/js-minifier (298), video-tools/video-screenshot (298), image-tools/duplicate-image-finder (299).

Le nombre de mots n'est pas le critère principal (gabarit §2c : 350-700 mots, moins plutôt que du remplissage) ; une page
est **MINCE** dans les tableaux ci-dessous quand l'information propre à l'outil manque (formats, limites, réglages, cas non pris en charge).

## 4. Tableaux complets, lot par lot

---

### Lot pdf-1

Sources : texte servi = `docs/audit/p36/contenu-avant.json` ; code lu ligne par ligne (pages, `layout.tsx`, composants, routes, services).
Une affirmation juste n'est pas dans les tableaux. Les numéros de ligne renvoient au fichier tel qu'il est sur la branche `p36` (05/10).

#### Références communes (citées « RÉF-x » dans les tableaux)

- **RÉF-STAGE (envoi par morceaux au-delà de 4 Mio)** : un fichier (ou le HTML préparé) de plus de `OFFICE_STAGED_THRESHOLD_BYTES` = 4 Mio
  (`lib/quota/limits.js:82`) part par morceaux vers notre service `media-processing` (Railway) quand `NEXT_PUBLIC_MEDIA_SERVICE_URL`
  est défini (`app/lib/officeUpload.js:46`, `app/lib/mediaJob.js:16-17`). Il demande un ticket à `/api/media/ticket`, qui applique une
  **limite par réseau, par heure et par jour** (seau `office_rate`, valeurs `MEDIA_JOBS_PER_HOUR_PER_IP` / `MEDIA_JOBS_PER_DAY_PER_IP`
  en variables d'environnement : `app/api/media/ticket/route.js:28-42`, `lib/media/ticket.js:49-50`). Message réel :
  « Too many conversions from your connection this hour. Please try again later. » / « Daily conversion limit reached for your
  connection. Please try again tomorrow. » (`ticket/route.js:38,41`).
- **RÉF-RET (conservation sur le service media)** : la source est supprimée à la fin du traitement ; **le résultat reste sur le service
  jusqu'au premier téléchargement complet, ou jusqu'à `MEDIA_JOB_TTL_SECONDS`** (valeur en variable d'environnement)
  (`services/media-processing/app/jobs.py:7-10`, `main.py:240`, `config.py:44`). La politique de confidentialité le dit déjà
  correctement : « the result right after you download it (or automatically after a short time if you never do) »
  (`app/privacy/page.jsx:64`). Toute phrase « deleted immediately / never stored / discarded immediately » est donc vraie pour le chemin
  direct (≤ 4 Mio) et trompeuse pour le chemin par morceaux.
- **RÉF-GUARD (routes payantes)** : `guardPaidRoute` = limite **par réseau, par heure et par jour** (`lib/quota/guard.js:16-26`,
  constantes `IP_RATE_LIMIT_PER_HOUR` / `IP_RATE_LIMIT_PER_DAY` en variables d'environnement `lib/quota/config.js:13-14`, **seau
  `ip_rate` commun à tous les outils payants** `lib/quota/ipRateLimit.js:8`) + **plafond de dépense mensuel du site**
  (`guard.js:28-37`, `GLOBAL_SPEND_CAP_USD` `config.js:6`). Messages réels : « Too many requests from this network. Try again in about
  N minutes. » (`guard.js:22`) ; « This tool has reached its usage limit for the month — that's a site-wide limit… » (`guard.js:33`).
- **RÉF-SIGNUP** : aucune route lue ne lit une session ou un compte (recherche `getSession|auth()|supabase.auth|getUser|cookies()` vide
  sur les 10 routes et `guard.js`/`ipRateLimit.js`) : « no signup » est juste partout ; seul « free » sans limite est à corriger.

#### Point à vérifier AVANT toute rédaction de chiffre (non compté comme défaut)

L'instantané `contenu-avant.json` affiche **« Max 4 MB »** sur toutes les pages Office/HTML/PDF→Office/PDF/A (ex. word-to-pdf `ui`,
excel-to-pdf `ui`, pdf-to-excel `ui`, pdf-to-pdfa `ui`). Or le code n'affiche 4 Mo que si `NEXT_PUBLIC_MEDIA_SERVICE_URL` est absent au
build (`officeUpload.js:16-17,111-112`) ; sinon 100 Mo (Word/PowerPoint/HTML/EPUB/MOBI/Markdown), 60 Mo (Excel), 99 Mo (PDF→Word/Excel/
PowerPoint), 44 Mo (PDF/A) (`limits.js:64,68,74,80,93`). La production avait cette variable le 21/09
(`docs/audit/RAPPORT-office-envoi-morceaux.md:110`). Donc : soit l'instantané a été pris sur une origine sans la variable, soit la
production l'a perdue. **À vérifier sur www** : si www affiche 4 Mo, les méta-descriptions « files up to 99 MB » (pdf-to-excel,
pdf-to-ppt) sont FAUSSES aujourd'hui ; sinon elles sont justes. Les rédacteurs doivent écrire la valeur constatée sur www.

#### Tableaux

### word-to-pdf
| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| word-to-pdf | titre + méta | « Convert Your .docx or .doc File » / « converts your .docx or .doc file to PDF » | FORMAT | `accept=".docx,.doc,.odt,.ott,.rtf,.docm,.dotx,.dotm,.dot,.wpd"` (`word-to-pdf/page.jsx:97`), mêmes 10 extensions côté route (`app/api/convert-to-pdf/route.ts:36`) | Dire « Word (.docx, .doc…), OpenDocument, RTF ou WordPerfect » |
| word-to-pdf | about | « Either way the file is deleted after conversion — we don't store or log it. » | TROMPEUR | RÉF-RET (au-delà de 4 Mio le PDF attend sur notre service jusqu'au téléchargement ou au délai) | Source supprimée à la fin ; au-delà de 4 Mo le PDF reste sur notre serveur jusqu'à son téléchargement (ou un court délai) |
| word-to-pdf | FAQ 1 | « Yes, it's completely free with no signup required. » | TROMPEUR | .docx : `guardPaidRoute` (`convert-to-pdf/route.ts:206`) = RÉF-GUARD ; tout fichier > 4 Mio : RÉF-STAGE | Gratuit sans compte, avec limite par réseau par heure et par jour (+ plafond mensuel du site pour .docx) |
| word-to-pdf | FAQ 3 | « The file is deleted after conversion — we don't keep it. » | TROMPEUR | RÉF-RET | Comme ci-dessus |
| word-to-pdf | FAQ 5 | « Do I need to install any software…? No, it works directly in your web browser. » | GÉNÉRIQUE | La conversion se fait sur serveur (ConvertAPI `route.ts:221`, Gotenberg `route.ts:375`) | Supprimer |
| word-to-pdf | FAQ 7 | « Why does this look different from the previous in-browser converter? » | MINCE | Historique d'une ancienne version, rien d'utile au visiteur | Supprimer |
| word-to-pdf | astuce 4 | « Very large or complex files may take a little longer to convert » | GÉNÉRIQUE | Le bouton affiche « Uploading N% » / « Converting... » / « Downloading N% » (`app/lib/officeUpload.js:29-35`) | Remplacer par le déroulé réel |

### excel-to-pdf
| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| excel-to-pdf | titre + méta | « .xlsx, .xls, .csv, or .ods » | FORMAT | `accept` ajoute .ots, .xlsm, .xlsb, .xltx, .xltm, .xlt (`excel-to-pdf/page.jsx:74`, route `route.ts:37`) | Citer la liste ou « and other spreadsheets » |
| excel-to-pdf | about | « then deleted immediately afterward — it isn't stored, logged, or kept around » | TROMPEUR | RÉF-RET | Voir word-to-pdf |
| excel-to-pdf | FAQ 1 | « Yes, it's completely free with no signup required. » | TROMPEUR | ≤ 4 Mio : aucune limite (chemin Gotenberg sans contrôle, `route.ts:314-448`) ; > 4 Mio : RÉF-STAGE | Dire la limite par réseau au-delà de 4 Mo |
| excel-to-pdf | FAQ 3 | « is deleted immediately after conversion — it isn't stored or kept » | TROMPEUR | RÉF-RET | Voir word-to-pdf |
| excel-to-pdf | astuce 1 | « Every sheet in your workbook is converted in its original order, each starting on its own page(s). » | INVÉRIFIABLE | Aucun rapport ne le mesure ; la route ne transmet aucune option de feuilles sauf `singlePageSheets` (`route.ts:147-151`) ; feuilles masquées non testées | Retirer, ou mesurer (dont feuilles masquées) |
| excel-to-pdf | astuce 2 | « Wide sheets are split by groups of columns unless you set them to fit on one page wide in Excel first » | TROMPEUR | La page a la case « Fit each sheet on one page (a wide sheet is not cut over several pages) » (`page.jsx:77`) | Citer la case de la page en premier |

### ppt-to-pdf
| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| ppt-to-pdf | titre + méta | « Convert Your .pptx or .ppt File » | FORMAT | `accept` : .pptx .ppt .odp .otp .pptm .ppsx .ppsm .pps .potx .potm .pot (`ppt-to-pdf/page.jsx:71`, `route.ts:38`) | Mentionner diaporamas, modèles, .odp |
| ppt-to-pdf | about | « then deleted immediately afterward — it isn't stored, logged, or kept around » | TROMPEUR | RÉF-RET | Voir word-to-pdf |
| ppt-to-pdf | FAQ 1 | « Yes, it's completely free with no signup required. » | TROMPEUR | > 4 Mio : RÉF-STAGE | Dire la limite |
| ppt-to-pdf | FAQ 3 | « is deleted immediately after conversion — it isn't stored or kept » | TROMPEUR | RÉF-RET | Voir word-to-pdf |
| ppt-to-pdf | FAQ 4 | « No, it works directly in your web browser. » | GÉNÉRIQUE | Conversion sur serveur (`route.ts:375`) | Supprimer |
| ppt-to-pdf | FAQ 5 | « Each slide in your presentation is rendered as one page in the resulting PDF » | INVÉRIFIABLE | Diapositives masquées : la route ne transmet aucune option de diapositives (`route.ts:147-151`) ; « Les options PowerPoint (notes, diapositives masquées) ne sont pas ouvertes : pas prouvées » (`docs/audit/RAPPORT-p24-couverture-03-10.md:368`) | « Each visible slide… » seulement après mesure, sinon dire « hidden slides: not tested » |
| ppt-to-pdf | FAQ 6 | « Why does this look different from the previous in-browser converter? … transitions are rendered as static slides » | MINCE | Historique sans valeur ; « transitions » non mesuré | Supprimer |
| ppt-to-pdf | astuce 4 | « Very large presentations … may take a little longer to convert » | GÉNÉRIQUE | `officeUpload.js:29-35` | Remplacer par le déroulé réel |

### html-to-pdf
| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| html-to-pdf | titre + méta | « Convert Your HTML Code or File to PDF » | FORMAT | Le mode « From URL » existe (`html-to-pdf/page.jsx:119,125`, route `app/api/convert-url-to-pdf/route.ts`) et n'est pas dit | Ajouter « or a web page address » |
| html-to-pdf | FAQ 1 | « It runs on our server, which allows a set number of conversions per connection each hour and day. » | TROMPEUR | URL : 20/heure et 60/jour par visiteur + 300/heure pour tous (`lib/quota/config.js:40-44`, `urlPdfRateLimit.js:27-38`, message `convert-url-to-pdf/route.ts:66`) ; fichier/code ≤ 4 Mio : **aucune limite** (`app/api/convert-html-to-pdf/route.ts:20-136`) ; > 4 Mio : RÉF-STAGE | Donner les chiffres par mode |
| html-to-pdf | FAQ 4 | « it's discarded immediately afterward » | TROMPEUR | RÉF-RET (HTML > 4 Mio) | Voir word-to-pdf |
| html-to-pdf | astuce 4 | « Very large or complex HTML files may take a little longer to convert » | GÉNÉRIQUE | — | Remplacer par une limite réelle |
| html-to-pdf | page (mode URL) | (absence) | MINCE | Limites réelles jamais dites : HTML 5 Mo, 150 ressources, 3 Mo par ressource, 25 Mo au total, page 15 s, 40 s de budget (`lib/urlFetch/snapshot.mjs:28`), ports 80/443 seulement, 5 redirections (`lib/urlFetch/safeFetch.js:19-20,80`), 2 048 caractères d'adresse (`convert-url-to-pdf/route.ts:42`) | Ajouter une réponse « limits of the URL mode » |

### epub-to-pdf
| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| epub-to-pdf | titre | « EPUB to PDF — Parse Your Ebook's Chapters, Images, » | MINCE | Titre tronqué en milieu de phrase (`epub-to-pdf/layout.tsx:5`) | Titre complet |
| epub-to-pdf | méta | « …prints them to a real PDF and deletes them right after. » | TROMPEUR | RÉF-RET (HTML préparé > 4 Mio) | Voir word-to-pdf |
| epub-to-pdf | about | « for high-fidelity PDF rendering … rather than a rough print-dialog approximation » | INVÉRIFIABLE | Aucun rapport EPUB ; police du livre forcée à Georgia (`page.jsx:123`), absente du serveur → Liberation Serif (`docs/audit/RAPPORT-fidelite-office.md` §4.2) | Retirer, décrire le vrai rendu |
| epub-to-pdf | about (entier) | (absence) | MINCE | Ne dit ni la limite (100 Mo de contenu préparé, images comprises : `page.jsx:211-213,241`), ni l'analyse bornée à 60 s (`page.jsx:177`), ni les chapitres illisibles signalés (`page.jsx:189,251`), ni la couverture non dupliquée (`page.jsx:204`) | Ajouter ces faits |
| epub-to-pdf | FAQ 1 | « so formatting and images come through correctly » | INVÉRIFIABLE | Aucun test EPUB dans `docs/audit/` | Dire ce qui est fait (chapitres, images, styles intégrés) sans promesse |
| epub-to-pdf | FAQ 2 | « Yes, it's completely free with no signup required. » | TROMPEUR | > 4 Mio de HTML préparé : RÉF-STAGE | Dire la limite |
| epub-to-pdf | FAQ 3 | « it's discarded immediately afterward » | TROMPEUR | RÉF-RET | Voir word-to-pdf |
| epub-to-pdf | astuce 3 | « Very large books may take a little longer to render » | GÉNÉRIQUE | — | Remplacer par la limite 100 Mo préparés |

### mobi-to-pdf
| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| mobi-to-pdf | titre | « MOBI to PDF — Properly Decodes Your Kindle Ebook's Internal » | MINCE | Titre tronqué (`mobi-to-pdf/layout.tsx:5`) | Titre complet |
| mobi-to-pdf | méta | « …deletes them right after. » | TROMPEUR | RÉF-RET | Voir word-to-pdf |
| mobi-to-pdf | about | « for high-fidelity PDF rendering … rather than a rough print-dialog approximation » | INVÉRIFIABLE | Aucun rapport ; police forcée Georgia (`page.jsx:134`) | Retirer |
| mobi-to-pdf | about (entier) | (absence) | MINCE | Limite 100 Mo préparés (`page.jsx:222-224,252`), refus d'un fichier non MOBI avec message DRM (`app/lib/fileChecks.js:116-121`), chapitres sautés dits (`page.jsx:197,262`) : rien de dit | Ajouter |
| mobi-to-pdf | FAQ 1 | « so chapters, images, and the cover come through correctly » | INVÉRIFIABLE | Aucun test MOBI→PDF dans `docs/audit/` | Retirer la promesse |
| mobi-to-pdf | FAQ 2 | « Yes, it's completely free with no signup required. » | TROMPEUR | RÉF-STAGE | Dire la limite |
| mobi-to-pdf | FAQ 3 | « it's discarded immediately afterward » | TROMPEUR | RÉF-RET | Voir word-to-pdf |
| mobi-to-pdf | astuce 4 | « Very large books may take a little longer to render » | GÉNÉRIQUE | — | Remplacer |

Remarque (hors types, non comptée) : astuce 1 « remove the DRM first with a tool you're authorized to use » conseille un contournement de DRM ;
risque juridique selon les pays. À retirer au profit de « DRM-protected books cannot be read » (le message réel, `fileChecks.js:120`).

### markdown-to-pdf
| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| markdown-to-pdf | étape 1 + interface | « select a .md file » / « a .md file » | FORMAT | `accept=".md,.markdown,.txt"` (`markdown-to-pdf/page.jsx:110`) | Dire .md, .markdown, .txt |
| markdown-to-pdf | about | « the same way the reference converters do it » | INVÉRIFIABLE | Seul un commentaire de code (`page.jsx:13-18`), aucun rapport | Retirer |
| markdown-to-pdf | FAQ 1 | « Yes, it's completely free with no signup. » | TROMPEUR | HTML > 4 Mio : RÉF-STAGE ; sinon aucune limite (`convert-html-to-pdf/route.ts`) | Dire la limite au-delà de 4 Mo |
| markdown-to-pdf | FAQ 3 | « then discarded » | TROMPEUR | RÉF-RET (> 4 Mio) | Voir word-to-pdf |
| markdown-to-pdf | FAQ 4 | « a downloadable A4 PDF » | TROMPEUR | A4 par défaut (`page.jsx:20`) mais Letter / Legal / A3 / A5, orientation et marges au choix (`page.jsx:116`, `app/lib/pageSetup.js:4-5`) | « A4 by default, or … » |
| markdown-to-pdf | astuce 4 | « Keep your original .md file as your source of truth » | GÉNÉRIQUE | — | Supprimer |

### text-to-pdf
| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| text-to-pdf | méta | « any language (Arabic, Hindi, Bengali, Chinese…) » | INVÉRIFIABLE | Écritures mesurées listées (`app/lib/textPdf.js:46-52`) ; « any » non prouvé | « every common writing system » + liste |
| text-to-pdf | FAQ 5 | « Not for Latin, Greek, Cyrillic, … Korean text: that PDF is made in your browser. » | TROMPEUR | Tout caractère hors des plages des polices locales (flèches U+2190…, ✓ U+2713, symboles) envoie le texte au serveur (`textPdf.js:53-70`, `page.jsx:23,48-53`) ; la page prévient (`page.jsx:86`) | Ajouter « and some symbols (arrows, check marks…) » |
| text-to-pdf | astuce 4 | « Since font and layout are fixed » | FAUX | Taille de page, orientation, taille du texte, marges au choix (`page.jsx:87-104`) | « The font is fixed (Noto); page size, orientation, text size and margins are yours » |
| text-to-pdf | FAQ 1 | « Yes, it's completely free with no signup required. » | TROMPEUR | Chemin serveur avec HTML > 4 Mio : RÉF-STAGE (rare) ; navigateur : aucune limite | Dire la limite du seul cas concerné |

### image-to-pdf
| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| image-to-pdf | titre | « Image to PDF — Turn Any Mix Online Free » | MINCE | Titre tronqué (`image-to-pdf/layout.tsx:5`) | Titre complet |
| image-to-pdf | about | « each page comes out at that source image's exact pixel size » | TROMPEUR | Seulement avec « Fit to each picture » (défaut, `app/components/ImagePageLayout.jsx:5,15`) ; page plafonnée à 14 400 pt (`app/lib/pdfImages.js:102-107`) ; A4/Letter/Legal/A5 sinon (`pdfImages.js:112-131`) | « with Fit to each picture… (pages over 200 in are scaled) » |
| image-to-pdf | astuce 2 | « Each page is sized to match its source image's exact pixel dimensions » | TROMPEUR | Idem | Idem |
| image-to-pdf | FAQ 5 | « Is my data secure when using this tool? Yes… » | GÉNÉRIQUE | Fait juste (local : `page.jsx:42-53`) mais question passe-partout | « Are my images uploaded? No… » |
| image-to-pdf | interface + FAQ 4 | « {48} on a phone » | TROMPEUR | `isMobileDevice()` vrai aussi pour iPad et toute UA « Mobile » (`app/lib/isMobileDevice.js:5-9`) : la borne 48 MP vaut pour les tablettes | « on a phone or tablet » |

### jpg-to-pdf
| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| jpg-to-pdf | about | « the output keeps each source image's original pixel dimensions, one per page » | TROMPEUR | Voir image-to-pdf (`ImagePageLayout.jsx:5,15`, `pdfImages.js:102-131`) | Idem image-to-pdf |
| jpg-to-pdf | astuce 2 | « Each page matches its source image's exact pixel dimensions » | TROMPEUR | Idem | Idem |
| jpg-to-pdf | astuce 3 | « iPhone photos can stay in HEIC: they are converted in your browser, upright, at full size. » | TROMPEUR | Sur téléphone/tablette, au-delà de 48 MP il faut réduire (« Reduce to 48 MP then convert to PDF », `app/components/SizePreflight.jsx:23`, `pdfImages.js:149`) | « at full size up to 48 MP on a phone » |
| jpg-to-pdf | interface + FAQ 4 | « {48} on a phone » | TROMPEUR | `isMobileDevice.js:5-9` (iPad compris) | « phone or tablet » |
| jpg-to-pdf | FAQ 1 | « Is JPG to PDF really free to use? Yes, it's completely free with no signup required. » | GÉNÉRIQUE | Tout est local (`page.jsx:33-44`) : aucune limite — la question n'apprend rien | Remplacer par une vraie question (HEIC, ordre, taille) |
| jpg-to-pdf | FAQ 3 + FAQ 4 | « Can I choose the page size and margins? … » / « Is there a size limit for each image? … » | GÉNÉRIQUE | Texte identique mot pour mot à image-to-pdf FAQ 2 et FAQ 4 (`image-to-pdf/page.jsx:111,113`) — outil jumeau (même `addImagePage`) | Différencier les deux pages |

### pdf-to-word
| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| pdf-to-word | méta + interface + FAQ 6 | « scanned PDFs are not supported » / « Scanned PDFs are not supported. » | INVÉRIFIABLE | Aucun contrôle de scan dans la route (`app/api/pdf-to-word/route.ts:124-160`) ; le résultat dépend de ConvertAPI, dont les pages pdf/to/xlsx et pptx annoncent un OCR (`lib/providers/convertApi.js:27-28`) ; non mesuré pour docx | Mesurer un scan, puis dire le résultat réel |
| pdf-to-word | about | « deleted after conversion — we don't store or log it » | TROMPEUR | RÉF-RET (PDF > 4 Mio) | Voir word-to-pdf |
| pdf-to-word | FAQ 1 | « Yes, it's completely free with no signup required. » | TROMPEUR | `guardPaidRoute` (`pdf-to-word/route.ts:143`) = RÉF-GUARD ; > 4 Mio aussi RÉF-STAGE | Dire limite par réseau heure/jour + plafond mensuel |
| pdf-to-word | FAQ 4 | « and deleted after conversion — we don't keep it » | TROMPEUR | RÉF-RET | Voir word-to-pdf |
| pdf-to-word | FAQ 7 | « No, it works directly in your web browser. » | GÉNÉRIQUE | Conversion chez ConvertAPI (`route.ts:158-160`) | Supprimer |
| pdf-to-word | astuce 3 | « Scanned or image-only PDFs need OCR performed elsewhere first » | TROMPEUR | Le site a son propre outil PDF OCR (`app/tools/pdf-tools/pdf-ocr`), cité par pdf-to-excel (`pdf-to-excel/page.jsx:53`) | « run PDF OCR (our tool) first » |
| pdf-to-word | astuce 4 | « Very large or complex files may take a little longer to convert » | GÉNÉRIQUE | — | Remplacer |

### pdf-to-excel
| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| pdf-to-excel | méta | « Free, no signup, files up to 99 MB. » | TROMPEUR | RÉF-GUARD (`lib/pdfToOfficeRoute.ts:45`) ; 99 Mo seulement si `NEXT_PUBLIC_MEDIA_SERVICE_URL` (`officeUpload.js:16`), l'instantané affiche « Max 4 MB per file » | Limite par réseau + valeur constatée sur www |
| pdf-to-excel | FAQ 1 | « Yes, it's free with no signup required. » | TROMPEUR | RÉF-GUARD | Idem |
| pdf-to-excel | about | « the same cells as the leading online PDF converter's » | INVÉRIFIABLE | « leading » ; le rapport nomme iLovePDF (`docs/audit/RAPPORT-ecarts-marche.md:20`) | Nommer iLovePDF, dater le test |
| pdf-to-excel | about | « your file is sent over HTTPS and deleted after conversion » | TROMPEUR | RÉF-RET (> 4 Mio) | Voir word-to-pdf |
| pdf-to-excel | FAQ 2 | « and deleted afterwards — it isn't stored » | TROMPEUR | RÉF-RET | Idem |
| pdf-to-excel | FAQ 5 | « Up to 99 MB per PDF. » | TROMPEUR | Conditionnel (voir « Point à vérifier ») | Valeur constatée sur www |

### pdf-to-ppt
| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| pdf-to-ppt | méta | « Free, no signup, files up to 99 MB. » | TROMPEUR | RÉF-GUARD (`pdfToOfficeRoute.ts:45`) ; 99 Mo conditionnel | Idem pdf-to-excel |
| pdf-to-ppt | FAQ 1 | « Yes, it's free with no signup required. » | TROMPEUR | RÉF-GUARD | Idem |
| pdf-to-ppt | about | « as the leading online PDF converter's result » | INVÉRIFIABLE | « leading » (`RAPPORT-ecarts-marche.md:20` nomme iLovePDF) | Nommer, dater |
| pdf-to-ppt | about | « your file is sent over HTTPS and deleted after conversion » | TROMPEUR | RÉF-RET | Voir word-to-pdf |
| pdf-to-ppt | FAQ 2 | « and deleted afterwards — it isn't stored » | TROMPEUR | RÉF-RET | Idem |
| pdf-to-ppt | FAQ 4 | « Up to 99 MB per PDF. » | TROMPEUR | Conditionnel | Valeur constatée |
| pdf-to-ppt | page entière | (absence) | MINCE | 4 FAQ, 3 astuces : rien sur PDF scanné, PDF protégé par mot de passe, service occupé (`convertApiBusyMessage`, `pdfToOfficeRoute.ts:95-96`), ni sur la limite horaire | Compléter |

### pdf-to-html
| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| pdf-to-html | FAQ 1 | « Is PDF to HTML completely free to use? Yes, it's completely free with no signup required. » | GÉNÉRIQUE | Tout est local (`pdf-to-html/page.jsx:58-73`) | Remplacer par une vraie question (pages sans texte, tableaux) |

### pdf-to-image
| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| pdf-to-image | FAQ 1 | « On an iPhone or iPad, pages drawn by our PDF service are limited to 300 an hour. » | TROMPEUR | Aussi 1 000 pages par jour par visiteur et 3 000/heure pour tous (`lib/quota/config.js:48-51`, `app/api/pdf-render/route.ts:14`) | « 300 an hour and 1,000 a day » |

### pdf-to-jpg
| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| pdf-to-jpg | FAQ 1 | « limited to 300 an hour » | TROMPEUR | Idem pdf-to-image | Idem |
| pdf-to-jpg | étape 3 | « Pick the format, the resolution… » | TROMPEUR | Un seul format, JPG (`pdf-to-jpg/page.jsx:15` `formats={['jpg']}`) | « Pick the resolution and the JPG quality » |
| pdf-to-jpg | about + étapes | « …in your browser with PDF.js — on a computer the PDF is not uploaded… » ; étapes 1-4 | GÉNÉRIQUE | Copie quasi mot pour mot de pdf-to-image (`pdf-to-image/page.jsx:19-20`) — même composant `PdfToImages` | Différencier (JPG : qualité 92/80, pas de transparence) |

### pdf-to-pdfa
| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| pdf-to-pdfa | about | « the industry-reference validator built for the PDF Association's own conformance testing » | INVÉRIFIABLE | Aucun rapport ne l'établit | « veraPDF, the open-source PDF/A validator » |
| pdf-to-pdfa | FAQ 2 | « the reference validator used for official PDF/A conformance testing — checks the result against the full PDF/A specification » | INVÉRIFIABLE | Idem ; « full » non prouvé | Dire ce qui est fait : validation veraPDF au niveau choisi |
| pdf-to-pdfa | about | « deleted immediately after processing — never stored, logged, or kept around » | TROMPEUR | > 4 Mio : chemin par morceaux (`pdf-to-pdfa/page.jsx:91-104`) → RÉF-RET | Voir word-to-pdf |
| pdf-to-pdfa | FAQ 5 | « This is one of the few tools on this site that actually sends your file… deleted immediately afterward — it is never stored, logged, or kept. » | TROMPEUR | RÉF-RET ; la politique liste une vingtaine d'outils serveur rien que pour les documents (`app/privacy/page.jsx:48,58-61`) | Retirer « few », corriger la suppression |
| pdf-to-pdfa | FAQ 1 | « Yes, completely free with no signup required. » | TROMPEUR | > 4 Mio : RÉF-STAGE ; ≤ 4 Mio : aucune limite (`app/api/pdf-to-pdfa/route.ts`) | Dire la limite |
| pdf-to-pdfa | étape 3 | « Click 'Convert'. » | LIBELLÉ | Bouton « Convert to PDF/A-2b » (niveau choisi) (`page.jsx:197`) | « Convert to PDF/A-… » |
| pdf-to-pdfa | étape 2 + FAQ 6 | « 2b is the most commonly required for archiving » / « PDF/A-2b is the most widely accepted » | INVÉRIFIABLE | Aucun rapport | Retirer ou sourcer |

### pdf-translate
| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| pdf-translate | interface (sous-titre) | « Translate PDF content to any language with AI » | FAUX | Mode texte : 10 langues (`pdf-translate/page.jsx:24`, contrôle serveur `lib/ai/toolPrompts.js:10-13`) ; mode PDF entier : 133 langues de Google Cloud Translation (`app/lib/translateLanguages.js:5`) | Chiffres réels par mode |
| pdf-translate | astuce 4 (mode texte, servi) | « since there's no direct download option here » | FAUX | Bouton de téléchargement du .txt (`TextDownload name="translation.txt"`, `page.jsx:135`) | « Download saves it as translation.txt » |
| pdf-translate | étape 4 (mode texte, servi) | « Click 'Copy Translation' to copy the result — there's no PDF download. » | TROMPEUR | Un « Download » .txt existe (`page.jsx:135`) | Citer les deux boutons |
| pdf-translate | FAQ 1 | « there are daily limits per connection » | TROMPEUR | Texte : RÉF-GUARD via `/api/ai` (`app/api/ai/route.ts:23`) = heure + jour + plafond mensuel ; PDF entier : 20 pages/jour/visiteur, 20 pages/PDF, 20 Mo, budget propre 30 $/mois (`lib/quota/pdfTranslate.js:18-21`, `app/api/pdf-translate-document/route.ts:20,49,74`) | Chiffres par mode |
| pdf-translate | titre + méta + about servis | « Extract Text From the First 5 Pages » / « …sends it to OpenAI's API for translation » | TROMPEUR | Le HTML servi décrit toujours le mode texte (`docMode` null au rendu serveur, `page.jsx:35,143-145`) ; si le mode PDF entier est disponible (`app/api/pdf-translate-document/route.ts:24-27`), la page le choisit par défaut (`page.jsx:42`) — Google ne le voit jamais | Le texte servi doit décrire les deux modes (et dire quand le mode PDF entier est absent) |
| pdf-translate | page (mode PDF entier) | (absence) | MINCE | Limite 20 Mo jamais dite à l'écran (`pdf-translate-document/route.ts:20,49`), ni le refus d'un PDF chiffré (`pdf-translate-document/route.ts:61`) ; mode texte : réponse plafonnée à 1 000 jetons (`app/api/ai/route.ts:35`) | Ajouter |
| pdf-translate | FAQ 3 (mode PDF entier, client) | « Scanned pages are translated too, with some loss of formatting. » | INVÉRIFIABLE | Lecture de la doc Google (`docs/audit/RAPPORT-p25-decisions-03-10.md:147`), aucun test | Retirer ou mesurer |
| pdf-translate | FAQ 4 (mode PDF entier, client) | « we keep neither » | TROMPEUR | Toujours par morceaux (`alwaysStage: true`, `page.jsx:50`; `officeUpload.js:46`) → RÉF-RET | Voir word-to-pdf |

### pdf-ai-summary
| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| pdf-ai-summary | titre | « AI PDF Summary — Send Your File Online Free » | FAUX | Le PDF reste dans le navigateur ; seul le texte extrait (≤ 8 000 caractères) est envoyé (`pdf-ai-summary/page.jsx:32-62`, `limits.js:5`) | Titre sur la tâche (résumer un PDF) |
| pdf-ai-summary | méta | « sends your file to our server, which passes it to OpenAI's gpt-4o-mini model » | FAUX | Idem ; contredit la FAQ 3 de la même page (`page.jsx:109`) | « sends the extracted text (up to 8,000 characters) … » |
| pdf-ai-summary | FAQ 1 | « there is an hourly and daily limit per connection » | TROMPEUR | Plus le plafond mensuel du site (`guard.js:28-37`) ; seau horaire/journalier commun à tous les outils payants (`ipRateLimit.js:8`) | Ajouter ces deux faits |

#### Synthèse du lot pdf-1 (19 outils lus)

| Type | Nombre |
|---|---|
| FAUX | 5 |
| INVÉRIFIABLE | 15 |
| TROMPEUR | 55 |
| GÉNÉRIQUE | 15 |
| MINCE | 10 |
| LIBELLÉ | 1 |
| FORMAT | 5 |
| **Total** | **106** |

Les plus graves : (1) pdf-ai-summary titre + méta « sends your file » alors que le fichier ne quitte pas le navigateur ; (2) « deleted
immediately / never stored » sur 14 pages serveur alors qu'au-delà de 4 Mo le résultat attend sur le service media (RÉF-RET) ; (3) « free,
no signup » sans la limite par réseau ni le plafond mensuel sur les 4 outils ConvertAPI/OpenAI (pdf-to-word/excel/ppt, pdf-ai-summary)
et pdf-translate (« any language », « no direct download » faux).


---

### Lot pdf-2

Source du texte servi : `docs/audit/p36/contenu-avant.json`. Code lu : `app/tools/pdf-tools/<outil>/{page.jsx,layout.tsx,config.js,*.worker.js,splitPlan.js}`, `app/components/{SeoContent.tsx,FileDownload.jsx,UploadPrompt.jsx}`, `app/lib/{pdfDecrypt,pdfUnlock,pageRange,pdfCropBox,pdfTextLayout,pdfActualText,pdfImages,officeUpload,mediaJob,serverPageRender,serverPageOcr,pdfRedact,fileChecks,isMobileDevice,canvasLimit,useToolError,reportError,codeTools}.js`, `lib/quota/{limits,guard,config,pdfOcrRateLimit}.js`, `lib/pdfOcr.js`, routes `app/api/{pdf-compress,pdf-repair,pdf-ocr,pdf-render,convert-to-pdf,media/ticket}`, services `services/pdf-tools/{src,py}`, `services/media-processing/app/jobs.py`.

#### Remarque préalable (non comptée comme défaut) — valeurs qui dépendent du build

Le HTML extrait dit « 4 MB » pour les fichiers Office de Merge PDF (FAQ 4) et pour PDF Repair (interface, étape 1, FAQ 5). Ces textes sont calculés par `officeMaxLabel()` / `pdfToolsMaxLabel()` : 4 Mo quand `NEXT_PUBLIC_MEDIA_SERVICE_URL` est absent du build, sinon 100 Mo (Word/PowerPoint), 60 Mo (tableurs), 44 Mo (Repair) (`app/lib/officeUpload.js:16-17,111-112`, `lib/quota/limits.js:53,64,80,93`). Le build qui a servi à `contenu-avant.json` n'avait donc pas cette variable. Le rédacteur doit garder l'expression calculée, jamais un chiffre en dur. **Conséquence réelle pour Compress** (défaut compté plus bas) : son texte « 200 MB » est une constante (`page.jsx:15`) alors que le plafond serveur réel tombe à 4 Mo sans cette variable (`page.jsx:45`).

Phrase « Yes, it's (completely) free with no signup required » : classée **GÉNÉRIQUE** sur les outils 100 % navigateur ; classée **TROMPEUR** sur les outils où une partie des cas passe par une route ou un ticket limité par réseau (Compress, Merge, Repair, Redact, OCR n'a pas cette FAQ).

---

#### /tools/pdf-tools/pdf-compare

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| pdf-compare | titre | « Compare PDF — Extract the Text Content Online Free » | MINCE | La fonction principale est le marquage ligne par ligne des différences (Myers, espaces ignorés) avec numéro de page et mots changés : `page.jsx:51-65,95-104` | Titre qui dit « comparer deux PDF et marquer les différences » |
| pdf-compare | méta | « then displays both extractions side by side as text » | TROMPEUR | Le résultat affiché d'abord est la liste des différences rouge/vert + compte « N line(s) only in … » (`page.jsx:92-104`), les deux textes ensuite (`page.jsx:106-117`) | Dire : lignes propres à chaque PDF en rouge/vert, mots changés, page de chaque ligne, puis textes complets |
| pdf-compare | FAQ 2 | « using the Myers diff algorithm (as Diffchecker and git) » | INVÉRIFIABLE | Le code utilise jsdiff `diffArrays` (`app/lib/codeTools.js:49-54`) ; rien dans le dépôt sur l'algorithme de Diffchecker | Retirer « as Diffchecker and git » |
| pdf-compare | FAQ 4 | « those panels will come out empty » | TROMPEUR | Si un PDF n'a pas de texte, les deux zones de texte ne s'affichent pas (`text1 && text2`, `page.jsx:106`) et un message nomme le fichier et renvoie à PDF OCR (`page.jsx:94`) | Citer le message réel et le renvoi à PDF OCR |
| pdf-compare | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | — | Remplacer par un fait propre à l'outil (ex. : aucune limite de taille codée, rien n'est envoyé) |

#### /tools/pdf-tools/pdf-compress

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| pdf-compress | interface (téléphone) | « Larger files, up to 100 MB on this device, get a lighter in-browser optimisation » | FAUX | Sur téléphone, voie navigateur seulement si taille > plafond serveur (200 Mo) mais tout fichier > max(200, 100) = 200 Mo est refusé : la voie navigateur est inatteignable (`page.jsx:45-49,58-61`) | Sur téléphone : « jusqu'à 200 Mo, au-delà refusé » (quand le service est configuré) |
| pdf-compress | FAQ 5 | « (100 MB / 300 pages on phones and tablets), get the in-browser structure-only optimisation » | FAUX | Même logique `page.jsx:45-49,58-61` | Même correction |
| pdf-compress | interface / about / FAQ 4 / FAQ 5 / astuce 4 | « Files up to 200 MB are compressed with our full engine » | TROMPEUR | Libellé constant (`page.jsx:15`) ; plafond réel `serverMax` = 4 Mo si `NEXT_PUBLIC_MEDIA_SERVICE_URL` absent (`page.jsx:45`), et le build extrait n'avait pas cette variable (voir remarque) | Afficher la valeur calculée `serverMax`, pas la constante |
| pdf-compress | FAQ 6 | « Does it work on password-protected PDFs? No. » | TROMPEUR | Un PDF à restrictions seules (s'ouvre sans mot de passe) est compressé : pikepdf l'ouvre sans mot de passe (`services/pdf-tools/py/compress.py:285`), voie navigateur déchiffre (`app/lib/pdfDecrypt.js:41-54`) ; seul un PDF à mot de passe d'ouverture est refusé (`services/pdf-tools/src/compress.js:33-38`) | Distinguer : mot de passe d'ouverture → refusé (message réel) ; restrictions seules → traité |
| pdf-compress | FAQ 1 | « Yes, it's free with no signup required. » | TROMPEUR | > 4 Mo : envoi par ticket `/api/media/ticket`, limité par réseau à l'heure et au jour (`app/api/media/ticket/route.js:34-42` ; `page.jsx:95,111-121`) | Dire la limite par réseau pour les fichiers > 4 Mo |
| pdf-compress | FAQ 4 | « deleted after you download the result (or automatically after a short time if you don't) » | INVÉRIFIABLE | ≤ 4 Mo : dossier supprimé à la fin de la requête (`services/pdf-tools/src/server.js:28-41`) ; > 4 Mo : résultat supprimé après le 1er téléchargement complet ou au bout de `MEDIA_JOB_TTL_SECONDS` (`services/media-processing/app/jobs.py:6-13`), valeur en variable Railway (README : 900 s) | Décrire les deux cas ; la durée exacte doit être confirmée par le propriétaire |
| pdf-compress | FAQ 3 | « Lossless does not: nothing is re-encoded » | TROMPEUR | Au niveau Lossless aussi, les polices Type 1 sont converties en CFF par tx et les sous-ensembles TrueType fusionnés (`compress.py:301-306`) ; seules les images ne sont pas touchées (`compress.py:28-29,287`) | « aucune image ré-encodée ; polices converties à contours prouvés identiques ; rendu identique » |
| pdf-compress | astuce 1 | « Scanned documents and photo-heavy PDFs shrink the most with Recommended or Extreme » | TROMPEUR | Mesure du dépôt : 6 photos −15,2 % en Recommended contre −40,6 % pour l'article texte (`docs/audit/RAPPORT-ecarts-marche.md:97-98`) | « Les photos gagnent surtout avec Extreme (−79 % mesuré) » |
| pdf-compress | astuce 2 | « Text-only PDFs (reports, papers) often shrink a lot even with Lossless » | INVÉRIFIABLE | Une seule mesure (1 article, −35,4 %) `RAPPORT-ecarts-marche.md:97` | Citer la mesure unique au lieu de « often » |

#### /tools/pdf-tools/pdf-crop

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| pdf-crop | interface (sous-titre) | « Crop and resize PDF pages » | TROMPEUR | Seule la CropBox change (`page.jsx:46`), aucune mise à l'échelle | « Trim the margins of PDF pages » |
| pdf-crop | astuce 4 | « Use the same margins across a batch of similarly formatted documents » | GÉNÉRIQUE | Un fichier à la fois (`page.jsx:65`) | Supprimer ou remplacer par un fait (ex. recadrage cumulatif, contenu caché gardé) |
| pdf-crop | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | — | Fait propre à l'outil |

#### /tools/pdf-tools/pdf-delete-pages

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| pdf-delete-pages | titre | « Remove the Page Numbers You Specify » | TROMPEUR | Se lit « enlever les numéros de page » ; le code supprime des pages (`page.jsx:53`) | « Delete pages from a PDF by number or range » |
| pdf-delete-pages | méta / about | « removes the page numbers you specify » | TROMPEUR | Idem | Idem |
| pdf-delete-pages | about | (2 phrases seulement) | MINCE | Manquent : plages « 5-7 », « 10- » (`app/lib/pageRange.js:4-19`), au moins une page doit rester (`page.jsx:52`), nom `<nom>-edited.pdf` (`page.jsx:89`), PDF protégé (`app/lib/pdfDecrypt.js:32-53`) | Ajouter ces faits |
| pdf-delete-pages | astuce 4 | « Keep your original file until … — the tool can't undo a deletion » | GÉNÉRIQUE | Le fichier d'origine n'est jamais modifié (copie téléchargée) | Supprimer |
| pdf-delete-pages | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | — | Fait propre |

#### /tools/pdf-tools/pdf-editor

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| pdf-editor | astuce 2 | « for straight lines or boxes, use the Highlight tool instead » | FAUX | Highlight dessine un rectangle plein à 35 % d'opacité (`pdfEditor.worker.js:59-67`, `page.jsx:192`), ni trait ni cadre | « Highlight trace un rectangle de couleur transparent » |
| pdf-editor | FAQ 6 | « Yes, each item has its own remove (✕) button » | TROMPEUR | ✕ seulement pour textes et images (`page.jsx:460,469`) ; traits et surlignages : uniquement « Clear annotations on this page » (`page.jsx:476-484`) | Le dire |
| pdf-editor | titre / méta / about / interface | « Annotations » / « freehand or highlight annotations » | TROMPEUR | Dessinés dans le contenu de la page (drawLine / drawRectangle), pas des annotations PDF modifiables (`pdfEditor.worker.js:59-79`) | « traits et surlignages dessinés sur la page (définitifs) » |
| pdf-editor | méta | « to any PDF » | TROMPEUR | Plafonds 700 Mo / 2 000 pages, 100 Mo / 300 pages sur téléphone (`config.js:23-32`, `page.jsx:82-98`) ; PDF à mot de passe d'ouverture : échec de lecture (`page.jsx:92,123-125`) | Retirer « any », dire les plafonds |
| pdf-editor | about / FAQ 2 | « browsers have no reliable way… » / « No browser-based tool can do this cleanly » | INVÉRIFIABLE | Aucune preuve dans le dépôt | « Cet outil ne modifie pas le texte existant » sans généralisation |
| pdf-editor | FAQ 4 | « measured limits to keep editing reliable in a browser tab » | INVÉRIFIABLE | Mesure seulement en commentaire, sur le chemin d'enregistrement sous Node (`config.js:1-22`), pas sur le rendu des vignettes de toutes les pages (`page.jsx:101-119`) ; aucun rapport dans `docs/audit/` | Donner les plafonds sans « measured », ou produire le rapport |
| pdf-editor | astuce 4 | « the dedicated PDF tools … are faster than this full editor » | INVÉRIFIABLE | Aucune mesure ; l'éditeur ne fait ni fusion, ni filigrane, ni numérotation | Remplacer par « l'éditeur ne fait pas X : utiliser … » |
| pdf-editor | FAQ (absence) | — | MINCE | Non dit : texte ajouté limité aux lettres latines (`pdfEditor.worker.js:128-133`) ; Extract Selected n'inclut ni ajouts ni rotations (`pdfEditor.worker.js:97-108`) | Ajouter ces deux faits |
| pdf-editor | FAQ 1 | « Yes, completely free with no signup required. » | GÉNÉRIQUE | — | Fait propre |

#### /tools/pdf-tools/pdf-extract-text

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| pdf-extract-text | astuce 4 | « multi-column layouts are read line by line across the columns » | FAUX | Le texte suit l'ordre des objets du fichier, sans remise en ordre (`app/lib/pdfTextLayout.js:15-35`) | « Les colonnes sortent dans l'ordre où le fichier les enregistre » |
| pdf-extract-text | about / FAQ 5 | « those pages come out blank » / « scanned pages … come out blank » | TROMPEUR | PDF sans aucun texte : pas de résultat, message « This PDF has no text layer… Use PDF OCR… » (`page.jsx:52`) ; vide seulement pour les pages scannées d'un PDF mixte | Citer le message réel |
| pdf-extract-text | étape 2 | « pull the text content from every page » | TROMPEUR | Seulement les pages du champ « Pages (empty: all) » (`page.jsx:42,78-80`) | « toutes les pages, ou celles indiquées » |
| pdf-extract-text | FAQ 2 | « PDF files only. » | GÉNÉRIQUE | `accept=".pdf"` (`page.jsx:75`) | Fusionner dans un fait utile |
| pdf-extract-text | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | — | Fait propre |

#### /tools/pdf-tools/pdf-forms

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| pdf-forms | titre | « PDF Forms — Read the Existing Fillable Fields Online Free » | MINCE | La tâche est de remplir (et aplatir) (`page.jsx:73-105,147`) | « Fill PDF forms … » |
| pdf-forms | méta | « lets you type a value into each one » | MINCE | Cases, boutons radio, listes, aplatissement facultatif (`page.jsx:120-147`) | Les citer |
| pdf-forms | FAQ 3 | « and filled like a text field » | TROMPEUR | Chaque type a son propre contrôle ; les boutons radio sont une liste déroulante (`page.jsx:126-142`) | « choisi dans une liste » |
| pdf-forms | interface | bouton « Fill and Download PDF » | TROMPEUR | Le bouton prépare le fichier ; le téléchargement se fait avec « Download » (`page.jsx:151-155`) | Libellé « Fill PDF » ou dire les deux clics (l'étape 3-4 le dit déjà) |
| pdf-forms | FAQ / astuces (absence) | — | MINCE | Formulaires XFA : message dédié (`page.jsx:57-59,150`) non mentionné | Ajouter |
| pdf-forms | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | — | Fait propre |

#### /tools/pdf-tools/pdf-merge

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| pdf-merge | interface / FAQ 1 | « Free, no signup » / « Yes, completely free with no signup required. » | TROMPEUR | .docx → `guardPaidRoute` : limite par réseau heure/jour + plafond mensuel du site (`app/api/convert-to-pdf/route.ts:206-207`, `lib/quota/guard.js:15-37`) ; Office > 4 Mo : ticket limité par réseau (`app/api/media/ticket/route.js:34-42`) | Dire ces limites pour les fichiers Office |
| pdf-merge | FAQ 5 | « retains the full quality of all original files including images, fonts, and formatting » | TROMPEUR | Images non JPEG ré-encodées en JPEG q92 (`app/lib/pdfImages.js:23-41`) ; Office converti, repli LibreOffice annoncé comme différent (`page.jsx:243-246`) | Vrai pour les PDF seulement ; dire les deux exceptions |
| pdf-merge | méta / about | « instantly » | INVÉRIFIABLE | Aucune mesure ; conversion serveur des fichiers Office ; l'astuce 3 dit « may take a few seconds » | Supprimer |
| pdf-merge | FAQ 4 | « measured limits to keep merging reliable » | INVÉRIFIABLE | Mesure seulement en commentaire (`config.js:1-31`), aucun rapport dans `docs/audit/` | Retirer « measured » ou produire le rapport |
| pdf-merge | FAQ 2 | « and deleted after conversion » | TROMPEUR | Office > 4 Mo : déposé sur le service média, supprimé après le 1er téléchargement complet ou au TTL (`app/lib/officeUpload.js:46-51`, `services/media-processing/app/jobs.py:6-13`) | Préciser |
| pdf-merge | FAQ 4 | question « How many PDF files can I merge at once? » | MINCE | La réponse ne dit pas qu'il n'y a pas de limite de nombre de fichiers (aucune dans `page.jsx:145-188`) | Le dire |
| pdf-merge | about | « No software installation required » / « Perfect for combining reports, contracts, invoices, scans and photos » | GÉNÉRIQUE | — | Supprimer |

#### /tools/pdf-tools/pdf-number-pages

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| pdf-number-pages | titre | « PDF Number Pages — Stamp a “current / Total” Label (e.g » | TROMPEUR | Titre tronqué (`layout.tsx:5`) ; 5 formats dont texte libre (`page.jsx:17-23`) | Titre complet citant formats et options |
| pdf-number-pages | méta | « stamps a current/total label onto every page » | TROMPEUR | 5 formats ; pages de/à, couverture sautée (`page.jsx:17-23,68-69`) | Corriger |
| pdf-number-pages | astuce 3 | « set 'First number' to 1 if the second page should be page 1 » | TROMPEUR | C'est déjà le défaut : First number = 1 et la page 2 le reçoit quand la couverture est sautée (`page.jsx:33,68,80`) | « La page 2 devient la page 1 par défaut ; mettez 2 pour garder la numérotation du document » |
| pdf-number-pages | astuce 1 | « the most common, professional-looking placement » | INVÉRIFIABLE | Aucune preuve | Dire seulement que c'est la position par défaut (`page.jsx:30`) |
| pdf-number-pages | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | — | Fait propre |

#### /tools/pdf-tools/pdf-ocr

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| pdf-ocr | FAQ 3 | « roughly 4-16% of characters » | INVÉRIFIABLE | Aucun rapport ; le seul chiffre du dépôt : 0,8 % CER à 7 pt (`docs/audit/RAPPORT-qualite-2-29-09.md:60`) | Citer la mesure réelle avec son fichier, ou aucun chiffre |
| pdf-ocr | méta / interface | « scanned PDFs and photographed pages of text » | FORMAT | Seul le PDF est accepté (`page.jsx:295` `accept=".pdf"`) : une photo JPG/PNG doit d'abord être mise en PDF | « photographed pages inside a PDF » + renvoi Image to PDF |
| pdf-ocr | FAQ 6 | « When our OCR service takes over on an iPhone or iPad, it accepts PDFs up to 44 MB. » | TROMPEUR | Non dit : 300 pages/heure et 1 000/jour par réseau, 3 000/heure pour tous (`lib/quota/config.js:55-57`, `lib/quota/pdfOcrRateLimit.js:8-20`) ; 44 Mo seulement si service média configuré, sinon ~4 Mo (`app/lib/serverPageOcr.js:59-62`) | Ajouter les limites de pages |
| pdf-ocr | FAQ 7 / about | « Not on a computer: everything happens locally » | TROMPEUR | Le relais serveur ne concerne qu'iPhone/iPad (`app/lib/serverPageRender.js:23-26`, `app/lib/canvasLimit.js:13-17`) ; Android n'envoie rien non plus | « Sur ordinateur et Android, rien n'est envoyé ; sur iPhone/iPad… » |
| pdf-ocr | FAQ 1 | « Does this actually perform OCR now? … it no longer just reads an existing text layer » | MINCE | Renvoie à une ancienne version ; aucune information pour le visiteur | Remplacer par une vraie question (ex. différence avec Extract Text) |

#### /tools/pdf-tools/pdf-organize

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| pdf-organize | about | « it does not merge, split, compress, or rotate PDFs » | FAUX | Bouton Rotate (+90° par page) `page.jsx:59,81,120` | Retirer « or rotate » ; dire qu'il tourne, duplique, insère des pages blanches |
| pdf-organize | FAQ 2 | « this tool only reorders and removes pages inside a single PDF » | TROMPEUR | Fait aussi Rotate, Duplicate, Blank after (`page.jsx:59-61,120-122`) | Liste complète |
| pdf-organize | titre | « PDF Organize — Let You Reorder Online Free » | MINCE | Titre cassé | Titre complet |
| pdf-organize | méta | « reorder and remove pages … using Up, Down, and Remove buttons » | MINCE | Omet Rotate, Duplicate, Blank after (`page.jsx:120-122`) | Les citer |
| pdf-organize | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | — | Fait propre |

#### /tools/pdf-tools/pdf-protect

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| pdf-protect | FAQ 4 | « a random owner password is used, so nobody can lift the restrictions » | FAUX | Avec le mot de passe d'ouverture, PDF Unlock de ce site enlève chiffrement et restrictions (`app/lib/pdfUnlock.js:13,33`) ; l'astuce 3 dit elle-même qu'on peut les contourner | « personne ne connaît le mot de passe de permissions ; les restrictions ne sont pas une protection forte » |
| pdf-protect | étapes 2-3 | « Type a password into the field. » / « Click 'Protect PDF' » | TROMPEUR | Par défaut, sans ouvrir Permissions : copie, modification, commentaires et réorganisation des pages INTERDITS (`page.jsx:13`) | Dire les permissions par défaut |
| pdf-protect | FAQ 2 | « AES-128, the PDF standard's AES cipher » | TROMPEUR | Le standard prévoit aussi AES-256 ; le site choisit 128 (`page.jsx:38-41`) | « AES-128 (l'AES-256 révision 5, dépréciée, n'est pas utilisé) » |
| pdf-protect | FAQ 1 | « Yes, it's free with no signup required. » | GÉNÉRIQUE | — | Fait propre |

#### /tools/pdf-tools/pdf-redact

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| pdf-redact | about | « Pages with no match are left untouched » | TROMPEUR | Tampons, pièces jointes, médias, liens vers une page caviardée ou exécutant un script retirés de ces pages (`page.jsx:134,249` ; la FAQ 3 le dit) | Reprendre la FAQ 3 |
| pdf-redact | astuce 4 | « left completely untouched » | TROMPEUR | Idem | Idem |
| pdf-redact | FAQ 1 | « Yes, it's completely free with no signup required. » | TROMPEUR | iPhone/iPad : pages dessinées par le service limitées à 300/h et 1 000/jour par réseau (`lib/quota/config.js:48-51`, `app/api/pdf-render/route.ts:3,14`) | Le dire pour iPhone/iPad |
| pdf-redact | FAQ 10 | « Not on a computer: matching and redaction both happen locally » | TROMPEUR | Seul iPhone/iPad peut envoyer (`app/lib/serverPageRender.js:23-26`) ; Android n'envoie rien | « Sur ordinateur et Android… » |
| pdf-redact | titre | « PDF Redact — Search Your Pdf's Text for a Keyword Online » | MINCE | Titre cassé (« Pdf's ») ; ne dit pas caviarder, plusieurs termes et motifs (`page.jsx:272-281`) | Titre complet |

#### /tools/pdf-tools/pdf-reorder-pages

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| pdf-reorder-pages | FAQ 2 | « For thumbnails you drag, use Organize PDF. » | FAUX | Organize n'a ni vignette ni glisser : liste « Page N » + Up/Down (`app/tools/pdf-tools/pdf-organize/page.jsx:115-124`) | Aucun outil du site n'a de vignettes à glisser ; l'Editor a des vignettes avec flèches |
| pdf-reorder-pages | astuce 3 | « invalid ones are skipped » | FAUX | Refusés avec phrase, bouton désactivé (`app/lib/pageRange.js:28-34` ; `page.jsx:96,101`) | « un numéro invalide est signalé, rien n'est créé » |
| pdf-reorder-pages | titre | « Let You Rearrange a Pdf's Pages Online » | MINCE | Titre cassé | Titre complet |
| pdf-reorder-pages | about | (2 phrases) | MINCE | Omet plages dans les deux sens « 5-1 », Reverse order / Odd pages, then even, doublons permis, pages omises signalées (`page.jsx:21-22,91-98`) | Ajouter |
| pdf-reorder-pages | astuce 4 | « download and check the result on a short document » | GÉNÉRIQUE | — | Supprimer |
| pdf-reorder-pages | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | — | Fait propre |

#### /tools/pdf-tools/pdf-repair

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| pdf-repair | about / FAQ 4 | « deleted immediately after processing — never stored, logged, or kept » | TROMPEUR | > 4 Mo (service média configuré) : fichier et résultat sur le service média jusqu'au 1er téléchargement complet ou au TTL (`page.jsx:57-70`, `services/media-processing/app/jobs.py:6-13`) | Décrire les deux cas |
| pdf-repair | FAQ 4 | « one of the few tools on this site that actually sends your file to a server » | TROMPEUR | La politique de confidentialité liste des dizaines d'outils serveur (`app/privacy/page.jsx:48-52`) | Retirer « one of the few » |
| pdf-repair | FAQ 1 | « Yes, completely free with no signup required. » | TROMPEUR | > 4 Mo : ticket média limité par réseau heure/jour (`app/api/media/ticket/route.js:34-42`) | Le dire |
| pdf-repair | étape 2 | « Your file uploads with a real progress bar » | TROMPEUR | La barre ne suit que l'envoi, libellé « Uploading… » pendant toute la réparation (`page.jsx:62,79-81,127`) | « la barre suit l'envoi ; la réparation peut durer jusqu'à 230 s » |

#### /tools/pdf-tools/pdf-rotate

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| pdf-rotate | titre | « PDF Rotate — Rotate Every Page Online Free » | TROMPEUR | Pages au choix (`page.jsx:40,70-71`) | « all or selected pages » |
| pdf-rotate | méta | « rotates every page of a PDF » | TROMPEUR | Idem | Idem |
| pdf-rotate | interface (sous-titre) | « Rotate all pages of a PDF in your browser » | TROMPEUR | Idem | Idem |
| pdf-rotate | astuce 2 | « stay sharp at any angle » | TROMPEUR | Seulement 90°, 180°, 270° (`page.jsx:65`) | « à chacun des trois angles » |
| pdf-rotate | astuce 1 | « download and check a page or two » | GÉNÉRIQUE | — | Supprimer |
| pdf-rotate | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | — | Fait propre |

#### /tools/pdf-tools/pdf-sign

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| pdf-sign | about | « You can only draw a signature, not type or upload an image of one » | FAUX | Modes Draw / Type / Upload image (`page.jsx:314,319-330`) ; la même phrase dit plus haut qu'on peut taper ou téléverser | Supprimer la phrase |
| pdf-sign | FAQ 4 | « anything under or around the strokes stays visible » | FAUX | L'encre est opaque : ce qui est sous les traits est couvert (`page.jsx:94-105,291`) ; l'astuce 3 le dit | « ce qui est autour des traits reste visible » |
| pdf-sign | étape 3 | « drag the signature where it goes on the page shown (or pick a corner) » | TROMPEUR | Position par défaut « Bottom right » ; la page ne s'affiche qu'après avoir choisi « Where I drag it on the page » (`page.jsx:40,193-194,348`) | Dire de choisir d'abord cette position |
| pdf-sign | titre | « PDF Sign — Let You Draw a Signature Online Free » | MINCE | Titre cassé ; omet Type et Upload | Titre complet |
| pdf-sign | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | — | Fait propre |

#### /tools/pdf-tools/pdf-split

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| pdf-split | about | « the ways the leading online splitter does for free » | INVÉRIFIABLE | « leading » sans preuve (la source citée en commentaire est un relevé d'iLovePDF, `splitPlan.js:3`) | Décrire les modes sans comparaison |
| pdf-split | about | (liste des modes) | MINCE | Omet Odd / even pages et By bookmarks (`page.jsx:19-20`) | Les ajouter |
| pdf-split | FAQ 3 | « Not yet — pages are chosen by number » | INVÉRIFIABLE | Promesse d'une fonction future, rien dans le code | « Non : … » |
| pdf-split | FAQ 6 | « measured limits to keep splitting reliable » | INVÉRIFIABLE | Commentaire seulement (`config.js:1-16`), pas de rapport | Retirer « measured » ou produire le rapport |
| pdf-split | titre | « PDF Split — Create a Separate PDF File Online Free » | MINCE | Ne dit aucun mode | Titre avec les modes |
| pdf-split | FAQ 2 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | — | Fait propre |

#### /tools/pdf-tools/pdf-unlock

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| pdf-unlock | astuce 2 | « you can leave the password field blank and it will still process normally » | FAUX | PDF non chiffré : aucun fichier, message « This PDF is not protected… nothing to remove. » (`page.jsx:29-32`) | Citer le message réel |
| pdf-unlock | étape 2 | « Type the PDF's password into the field. » | TROMPEUR | Inutile pour un PDF à restrictions seules (champ « Password (if required) », `page.jsx:61` ; `app/lib/pdfUnlock.js:11-13`) | « si le PDF en demande un à l'ouverture » |
| pdf-unlock | astuce 4 | « Keep your original protected file as a backup… » | GÉNÉRIQUE | L'original n'est pas modifié | Supprimer |
| pdf-unlock | FAQ 1 | « Yes, it's free with no signup required. » | GÉNÉRIQUE | — | Fait propre |

#### /tools/pdf-tools/pdf-watermark

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| pdf-watermark | titre | « PDF Watermark — Stamp a Diagonal, Semi-transparent Text » | TROMPEUR | Texte OU image, rotation None/45/90/180/270, opacité 10-100 % (`page.jsx:19,153-157,203-206`) | Titre complet |
| pdf-watermark | méta | « stamps a diagonal, semi-transparent text watermark across every page » | TROMPEUR | Idem + pages de/à (`page.jsx:77-80`) | Corriger |
| pdf-watermark | astuce 2 | « A mosaic is harder to crop out than a single stamp. » | INVÉRIFIABLE | Aucune preuve | Supprimer ou décrire la mosaïque (rangées décalées, `page.jsx:109-113`) |
| pdf-watermark | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | — | Fait propre |

---

#### Synthèse du lot pdf-2 (20 outils lus)

| Type | Nombre |
|---|---|
| FAUX | 11 |
| INVÉRIFIABLE | 14 |
| TROMPEUR | 44 |
| GÉNÉRIQUE | 22 |
| MINCE | 16 |
| LIBELLÉ | 0 |
| FORMAT | 1 |
| **Total** | **108** |

Les plus graves : Organize dit ne pas tourner les pages alors qu'il a un bouton Rotate ; Protect promet que « personne ne peut lever les restrictions » alors que PDF Unlock du même site les lève avec le mot de passe d'ouverture ; Compress annonce sur téléphone une voie navigateur jusqu'à 100 Mo qui ne peut pas s'exécuter, et un plafond serveur de 200 Mo qui tombe à 4 Mo sans `NEXT_PUBLIC_MEDIA_SERVICE_URL`.


---

### Lot image-1

Lu le 05/10/2026, en lecture seule. Source du texte : `docs/audit/p36/contenu-avant.json` (titre = `layout.tsx:5`,
méta = `layout.tsx:6`, about/étapes/FAQ/astuces = bloc `<SeoContent>` de chaque `page.jsx`). Source des faits : le code
cité (chemins depuis la racine du dépôt). Une affirmation juste n'est pas dans les tableaux.

Rappels valables pour les 18 outils (prouvés une fois ici, cités dans les tableaux) :
- Aucun de ces outils n'appelle de route `/api/*` pour traiter le fichier ; les seuls `fetch` vont chercher des encodeurs
  WebAssembly sur le site lui-même (`/wasm/…` : `app/lib/bigImage.js:179-187`, `app/tools/image-tools/image-converter/imageConverter.worker.js:20`,
  `app/tools/image-tools/image-compressor/compress.worker.js:22`, `app/lib/rawDecode.js:19`). Aucune limite de quota, aucune
  inscription (aucune occurrence de quota/guard/login/supabase dans les 18 dossiers). Seule sortie réseau : le rapport
  d'erreur anonymisé (`/api/report-error`, `app/lib/reportError.js:3-10,16,133-169`, `app/lib/useToolError.js:15-21,42-44`) —
  jamais le fichier ni son nom réel.
- Plafond commun des outils qui passent par `loadRaster` : **268 435 456 pixels (268 Mpx)**, refus avec message
  (`RASTER_MAX_PIXELS`, `app/lib/imageOutput.js:77-82`).
- iPhone/iPad : au-delà de 16 777 216 px (`CANVAS_MAX_PIXELS`, `app/lib/bigImage.js:19`), décodage par bandes et encodage
  par WebAssembly (MozJPEG, libwebp) ou par l'écrivain PNG du site, pas par le canvas (`app/lib/bigImage.js:1-16,72-104,
  294-303` ; `app/lib/imageOutput.js:129-143,255-273`).
- WebP : jamais plus de 16 383 px de côté (`WEBP_MAX_SIDE`, `app/lib/bigImage.js:221-224`).
- Bouton de sortie : « Download » (`app/components/FileDownload.jsx:211`), plus « Save / Share » sur iPhone/iPad
  (`FileDownload.jsx:91-95,216`) ; plusieurs fichiers : « Download all (N files, ZIP) » (`FileDownload.jsx:264`).
- Dépôt par glisser-déposer : règle site entière (`app/components/FileDropBridge.jsx:4-13,59-78`) ; zone d'envoi :
  « Click or drop … here » (souris) / « Choose … » (tactile) (`app/components/UploadPrompt.jsx:10-11`).

Abréviations : `IT` = `app/tools/image-tools`. Ligne « méta » = `IT/<outil>/layout.tsx:6` ; « titre » = `layout.tsx:5`.

---

#### bmp-to-png

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| bmp-to-png | méta + about | « entirely in your browser using the HTML canvas » | TROMPEUR | Sur iPhone/iPad au-delà de 16,7 Mpx : bandes + PNG écrit par l'écrivain du site, pas par le canvas (`app/lib/bigImage.js:72-104,294-303`, `app/lib/imageOutput.js:142`) | « entirely in your browser », sans le détail « HTML canvas » |
| bmp-to-png | FAQ 4 | « There's no fixed size limit » | FAUX | `loadRaster` refuse au-delà de 268 Mpx (`IT/bmp-to-png/page.jsx:23` → `app/lib/imageOutput.js:77-82`) | Dire la limite : 268 mégapixels par image |
| bmp-to-png | FAQ 1 | « Yes, it's 100% free with no registration required. » | GÉNÉRIQUE | `IT/bmp-to-png/page.jsx:54` | Fait propre à l'outil (ex. ce que devient un BMP 32 bits, nom du fichier rendu) |
| bmp-to-png | FAQ 2 | « only one file can be converted at a time — there's no multi-file upload » | GÉNÉRIQUE | `page.jsx:55` ; entrée sans `multiple` (`page.jsx:37`) | Une phrase propre, ou renvoi vers Image Converter (lot) |
| bmp-to-png | FAQ 3 | « your file never leaves your device » | GÉNÉRIQUE | `page.jsx:56` (vrai, formulation identique sur 16 pages) | Garder le fait, formulation propre (ce qui est téléchargé : rien ; ce qui part : rien) |
| bmp-to-png | astuce 1 | « make sure your BMP file isn't corrupted before uploading » | GÉNÉRIQUE | `page.jsx:60` | Remplacer par le message réel d'un BMP illisible (`app/lib/fileChecks.js:203-214`) |
| bmp-to-png | astuce 3 | « Run your PNG through an image compressor afterward » | GÉNÉRIQUE | `page.jsx:62` | Supprimer ou fait propre |
| bmp-to-png | astuce 4 | « Keep a backup of your original BMP file » | GÉNÉRIQUE | `page.jsx:63` | Supprimer |
| bmp-to-png | page entière | (about 2 phrases, 4 étapes standard) | MINCE | Manquent : limite 268 Mpx, nom du fichier rendu = même nom en .png (`app/lib/imageOutput.js:147-149`, `app/lib/download.js:108-111`), orientation EXIF appliquée (`app/lib/imageOutput.js:73`), message si le navigateur ne lit pas ce BMP (`app/lib/imageOutput.js:84-88`) | Ajouter ces faits |

#### gif-to-png

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| gif-to-png | méta + about | « entirely in your browser using the HTML canvas » | TROMPEUR | « Convert » passe par `drawToRaster` + `encodeRaster` : sur iPhone > 16,7 Mpx, bandes et PNG écrit sans canvas (`IT/gif-to-png/page.jsx:48-49`, `app/lib/imageOutput.js:142,255-273`) | « entirely in your browser » |
| gif-to-png | étapes 1-4 | (aucune étape pour « Extract all frames ») | MINCE | Bouton « Extract all frames (ZIP of PNGs) » (`page.jsx:70`), ZIP `gif-frames.zip` (`page.jsx:71`), fichiers `frame_01.png`… (`page.jsx:36`) | Ajouter l'étape et le nom des fichiers |
| gif-to-png | FAQ 1 | « Yes, it's 100% free with no registration required. » | GÉNÉRIQUE | `page.jsx:84` | Fait propre |
| gif-to-png | FAQ 3 | « only one file can be converted at a time — there's no batch upload » | GÉNÉRIQUE | `page.jsx:86` | Fait propre |
| gif-to-png | FAQ 4 | « your file is never uploaded to a server » | GÉNÉRIQUE | `page.jsx:87` | Formulation propre |
| gif-to-png | astuce 3 | « Convert one GIF at a time and download each result before starting the next. » | GÉNÉRIQUE | `page.jsx:92` | Supprimer |
| gif-to-png | astuce 4 | « Keep the original GIF as a backup » | GÉNÉRIQUE | `page.jsx:93` | Supprimer |
| gif-to-png | page entière | — | MINCE | Non dit : sur iPhone/iPad l'extraction refuse un GIF de plus de 16,7 Mpx avec message (`app/lib/gifFrames.js:18-19`, `app/lib/canvasLimit.js:20-23`) ; ZIP non compressé (`page.jsx:38`, `level: 0`) | Ajouter la limite téléphone |

#### heic-to-jpg

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| heic-to-jpg | about | « using the open-source heic2any library » | TROMPEUR | Safari (iPhone, iPad, Mac) décode le HEIC lui-même ; heic2any seulement pour les navigateurs qui ne lisent pas le HEIC (`IT/heic-to-jpg/page.jsx:29-37`) | « Safari decodes it natively; other browsers use the open-source heic2any library » |
| heic-to-jpg | étape 3 | « wait a few seconds for the conversion to finish » | INVÉRIFIABLE | Aucune mesure de durée pour cet outil dans `docs/audit/` (cherché : heic-to-jpg, heic2any) | Supprimer la durée |
| heic-to-jpg | FAQ 1 | « Yes, it's completely free with no registration required. » | GÉNÉRIQUE | `page.jsx:84` | Fait propre |
| heic-to-jpg | FAQ 2 | « only one file can be converted at a time » | GÉNÉRIQUE | `page.jsx:85` ; entrée sans `multiple` (`page.jsx:56`) | Renvoi vers Image Converter (lots de HEIC) |
| heic-to-jpg | FAQ 4 | « Do I need to install any software? No… » | GÉNÉRIQUE | `page.jsx:87` | Remplacer |
| heic-to-jpg | astuce 4 | « Check the converted JPG immediately after downloading » | GÉNÉRIQUE | `page.jsx:93` | Supprimer |
| heic-to-jpg | page entière | — | MINCE | Non dit : plafond 268 Mpx sur le chemin Safari (`page.jsx:33` → `app/lib/imageOutput.js:77-82`) ; nom rendu = nom du HEIC en .jpg (`page.jsx:69`) ; message d'erreur « Error: … » (`page.jsx:43`) | Ajouter |

#### heic-to-png

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| heic-to-png | about | « using the open-source heic2any library » | TROMPEUR | Safari décode lui-même ; heic2any ailleurs (`IT/heic-to-png/page.jsx:28-36`) | Dire les deux chemins |
| heic-to-png | FAQ 4 | « Conversion happens entirely in your browser using the heic2any library » | TROMPEUR | Idem (`page.jsx:32-36`) | Idem |
| heic-to-png | étape 2 | « wait a few seconds for the conversion to finish » | INVÉRIFIABLE | Aucune mesure dans `docs/audit/` | Supprimer |
| heic-to-png | FAQ 2 | « There's no fixed size limit » | FAUX | Chemin Safari : refus au-delà de 268 Mpx (`page.jsx:32` → `app/lib/imageOutput.js:77-82`) | Dire 268 Mpx |
| heic-to-png | FAQ 1 | « Yes, it's 100% free with no account creation required. » | GÉNÉRIQUE | `page.jsx:79` | Fait propre |
| heic-to-png | FAQ 3 | « No account is necessary — you can start converting immediately. » | GÉNÉRIQUE | `page.jsx:81` (doublon de la FAQ 1) | Supprimer |
| heic-to-png | astuce 1 | « Convert one HEIC file at a time — there's no batch upload option. » | GÉNÉRIQUE | `page.jsx:85` | Renvoi Image Converter |
| heic-to-png | astuce 2 | « Check the converted PNG right after downloading » | GÉNÉRIQUE | `page.jsx:86` | Supprimer |
| heic-to-png | page entière | — | MINCE | Non dit : nom rendu en .png (`page.jsx:64`), chemins Safari / autres (`page.jsx:28-36`) | Ajouter |

#### ico-to-png

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| ico-to-png | about | « the browser renders the one it picks as the source image; there's no per-size selector » | FAUX | Bouton « Every size in this icon » : chaque image de l'icône en PNG, ou toutes en ZIP (`IT/ico-to-png/page.jsx:27-41,70-79`) ; « Convert » donne la plus grande (`app/lib/icoEntries.js:1-2`) | « Convert gives the largest size; Every size in this icon gives each size » |
| ico-to-png | astuce 4 | « check which one the browser used as the source before relying on the output for a specific size » | FAUX | Même code : chaque taille est disponible et nommée `<nom>-16x16-32bit.png`… (`page.jsx:36`) | Remplacer par l'usage de « Every size in this icon » |
| ico-to-png | FAQ 3 | « the pixels are copied as-is » | TROMPEUR | « Convert » redessine l'image sur un canvas (`page.jsx:48`) : pixels semi-transparents arrondis possibles (le site le dit lui-même pour PNG to WebP, `IT/png-to-webp/page.jsx:58`) ; les entrées PNG ne sont livrées octet pour octet que par « Every size in this icon » (`page.jsx:35`) | Dire : octet pour octet via « Every size… », redessiné via « Convert » |
| ico-to-png | méta + about | « using the HTML canvas » | TROMPEUR | `drawToRaster` + `encodeRaster`, bandes et PNG hors canvas sur iPhone > 16,7 Mpx (`page.jsx:48-49`, `app/lib/imageOutput.js:142,255-273`) | Supprimer le détail |
| ico-to-png | étapes 1-4 | (aucune étape pour « Every size in this icon ») | MINCE | `page.jsx:70-79` | Ajouter l'étape |
| ico-to-png | FAQ 1 | « Yes, it's 100% free with no registration required. » | GÉNÉRIQUE | `page.jsx:93` | Fait propre |
| ico-to-png | FAQ 5 | « Do I need to install any software? No… » | GÉNÉRIQUE | `page.jsx:97` | Remplacer |
| ico-to-png | astuce 2 | « Convert files one at a time — there's no batch upload option. » | GÉNÉRIQUE | `page.jsx:101` | Supprimer |
| ico-to-png | astuce 3 | « Download your PNG right away, since nothing is stored after you leave the page. » | GÉNÉRIQUE | `page.jsx:102` | Supprimer |

#### image-converter

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| image-converter | titre | « Convert Images Between Png, Jpg, Webp » | FORMAT | 9 sorties : WebP, PNG, JPG, AVIF, GIF, BMP, TIFF, ICO, PDF (`IT/image-converter/page.tsx:313-321`) ; casse « Png, Jpg, Webp » | Titre qui dit la largeur réelle (dont HEIC/RAW en entrée), casse correcte |
| image-converter | interface (sous-titre) | « Convert images to PNG, JPG, WebP or AVIF » | FORMAT | Mêmes 9 sorties (`page.tsx:246` vs `313-321`) | Dire les 9 sorties |
| image-converter | interface (carte) | « Instant — Conversion happens in your browser » | FAUX | Le code attend jusqu'à 10 s par mégapixel RAW (24 Mpx : 10 s Chromium, 40 s Firefox ; X-Trans 58 s) (`imageConverter.worker.js:74-80`) ; AVIF « a few seconds per photo » (`page.tsx:330`) | Supprimer « Instant » |
| image-converter | interface (carte) | « 100% Private » | INVÉRIFIABLE | Superlatif ; le fait vérifiable est « Files never leave your device » (`page.tsx:405`) | Garder seulement le fait |
| image-converter | about | « download the results instantly » | FAUX | Idem ligne « Instant » (`imageConverter.worker.js:74-80`, `page.tsx:325,330`) | Supprimer « instantly » |
| image-converter | about + interface | « Conversion runs in a background Web Worker so the page stays responsive even on large batches » / « Conversion runs in the background — this tab stays responsive. » | TROMPEUR | PSD et SVG sont décodés sur la page (`page.tsx:132-140`, `app/lib/specialImageDecode.js:21-46`) ; HEIC hors Safari décodé par heic2any sur la page (`page.tsx:141-150`) | « The encoding runs in a background worker; PSD, SVG and (outside Safari) HEIC are opened on the page first » |
| image-converter | étape 3 | « Adjust the quality slider to balance file size against image quality. » | TROMPEUR | Curseur seulement pour JPG, WebP, AVIF, PDF (`page.tsx:20,338-355`) | « For JPG, WebP, AVIF or PDF, adjust… » |
| image-converter | étape 4 | « Click Convert, then … use "Download all" » | LIBELLÉ | Bouton « Convert N file(s) to FORMAT » (`page.tsx:370`) ; « Download all (N files, ZIP) », seulement à partir de 2 résultats (`app/components/FileDownload.jsx:225,264`) | Citer les libellés exacts |
| image-converter | FAQ 4 | « ICO produces a favicon holding every standard size from 16 to 256 px » | TROMPEUR | Tailles 16, 32, 48, 64, 128, 256 seulement si ≤ au plus grand côté de l'image (`IT/image-converter/extraFormats.js:110-115`) ; pas de 24 px | « 16 to 256 px, up to the image's own size » |
| image-converter | FAQ 4 | « HEIC/HEIF is decoded on the main thread before being re-encoded » | TROMPEUR | Seulement quand le navigateur ne lit pas le HEIC ; Safari le décode dans le worker comme un JPEG (`page.tsx:118-120,141-153`) | Dire les deux cas |
| image-converter | astuce 2 + interface | « PNG, BMP, TIFF and ICO are written without loss » / « ICO has no quality setting here: … it is written without loss. » | FAUX | ICO : image réduite à 512 px puis à 16-256 px (`extraFormats.js:116-127`) ; BMP : transparence aplatie sur blanc (`extraFormats.js:4,30-33`) | « PNG and TIFF without loss; BMP flattened on white; ICO resized to icon sizes » |
| image-converter | interface (curseur PDF) | « Quality: … % (photos without transparency) » | TROMPEUR | Pour le PDF, qualité plancher 50 % : un réglage sous 50 est ignoré (`extraFormats.js:159`) | Borner le curseur à 50-100 pour PDF, ou le dire |
| image-converter | FAQ 8 | « 50 on phones and tablets » | TROMPEUR | `isMobileDevice` suit `userAgentData.mobile` (faux sur tablette Android dans Chrome) : tablette Android = plafond ordinateur 100 Mpx ; iPad = 50 (`app/lib/isMobileDevice.js:5-9`) | « 50 on phones and iPads » |
| image-converter | FAQ 8 | « about a minute or two for a 48-megapixel photo to WebP on a phone » | INVÉRIFIABLE | Seule mesure : chemin iPhone simulé sur ordinateur (29-36 s WebKit, 118-148 s Firefox), « Seul un vrai iPhone donnera le temps » (`docs/audit/RAPPORT-p16-photos-iphone-30-09.md:83`) | Supprimer la durée ou la mesurer sur iPhone |
| image-converter | astuce 3 | « AVIF gives the smallest files of the four » | INVÉRIFIABLE | Aucun rapport comparant les tailles AVIF/WebP/JPG/PNG (cherché `docs/audit/*.md` : AVIF + smallest) | Supprimer ou mesurer |
| image-converter | astuce 1 | « WebP usually gives the best balance of quality and file size for web use » | GÉNÉRIQUE | `page.tsx:438` | Fait propre |
| image-converter | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | `page.tsx:428` (phrase répétée sur des dizaines de pages, `docs/audit/p36/unicite-avant.json`) | Fait propre |
| image-converter | page entière | — | MINCE | Non dit : un GIF/WebP/PNG animé donne sa première image (décodage `createImageBitmap`, `imageConverter.worker.js:117`) ; SVG dessiné à sa taille ou à 1024 px (`app/lib/specialImageDecode.js:20-29`) ; PSD = image aplatie, refus si « Maximize compatibility » désactivé (`specialImageDecode.js:33-45`) ; CMYK 16 bits refusé (`app/lib/tiffDecode.js:204-208`) ; X3F refusé ; arrêt après 20 s de silence (`page.tsx:175-183`) | Ajouter |

#### image-to-base64

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| image-to-base64 | FAQ 1 | « It accepts common formats your browser can open, such as JPG, PNG, GIF, and WebP. » | FORMAT | `accept="image/*"` (`IT/image-to-base64/page.jsx:60`) ; le fichier est lu octet pour octet sans être ouvert (`page.jsx:37-50`) ; type reconnu aussi pour TIFF, BMP, ICO, HEIC, AVIF, SVG (`page.jsx:36,44`) | « Any image file (JPG, PNG, GIF, WebP, AVIF, SVG, BMP, ICO, TIFF, HEIC…), read byte for byte, even one your browser cannot display » |
| image-to-base64 | FAQ 3 | « Can I use Base64 images in all browsers? Yes, data URIs are supported by all current browsers. » | TROMPEUR | Un data URI de HEIC ou TIFF ne s'affiche pas dans un navigateur qui ne lit pas ces formats (le site le dit ailleurs : `app/lib/fileChecks.js:212-213`) | « Supported everywhere for JPG/PNG/GIF/WebP/SVG; HEIC/TIFF only where the browser opens them » |
| image-to-base64 | about + étapes 2-4 | « encodes it as a Base64 data URI » | FORMAT | 5 sorties : « Data URI », « Plain Base64 », « HTML <img> tag », « CSS background-image », « JSON » (`page.jsx:19-23,63`) + téléchargement `<nom>.base64.txt` (`page.jsx:63`) | Dire les 5 formes et le .txt |
| image-to-base64 | étape 4 | « Click 'Copy Base64' to copy the full data URI to your clipboard. » | TROMPEUR | Copie la forme choisie dans « Output » (`page.jsx:23,63` : `writeText(out)`) | « copies the text in the chosen form » |
| image-to-base64 | étape 3 | « Review the encoded text in the output box. » | TROMPEUR | La boîte ne montre que les 100 000 premiers caractères (`PREVIEW_CHARS`, `page.jsx:14,63`) ; Copy/Download donnent tout | Le dire |
| image-to-base64 | astuce 4 | « Test the encoded image in your actual application before relying on it » | GÉNÉRIQUE | `page.jsx:85` | Supprimer |
| image-to-base64 | page entière | — | MINCE | Non dit : refus d'un fichier vide (`page.jsx:31`), avertissement si le type n'est pas reconnu (`page.jsx:45`), pas de bouton Convert (vrai, dit) | Ajouter |

#### jpg-to-png

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| jpg-to-png | méta + about | « entirely in your browser using the HTML canvas » | TROMPEUR | Bandes + PNG hors canvas sur iPhone > 16,7 Mpx (`IT/jpg-to-png/page.jsx:23-25`, `app/lib/imageOutput.js:142`) | Supprimer le détail |
| jpg-to-png | FAQ 1 | « Yes, it's 100% free with no registration required. » | GÉNÉRIQUE | `page.jsx:54` | Fait propre |
| jpg-to-png | FAQ 3 | « only one file can be converted at a time — there's no batch upload » | GÉNÉRIQUE | `page.jsx:56` | Fait propre |
| jpg-to-png | FAQ 4 | « Yes. Conversion happens entirely in your browser — your file is never uploaded to a server. » | GÉNÉRIQUE | `page.jsx:57` | Formulation propre |
| jpg-to-png | astuce 4 | « Convert one file at a time and download each result before starting the next. » | GÉNÉRIQUE | `page.jsx:63` | Supprimer |
| jpg-to-png | page entière | — | MINCE | Non dit : limite 268 Mpx (`page.jsx:23` → `app/lib/imageOutput.js:77-82`) ; orientation EXIF appliquée aux pixels (`app/lib/imageOutput.js:73`) ; nom rendu = même nom en .png (`app/lib/imageOutput.js:147-149`) | Ajouter |

#### jpg-to-webp

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| jpg-to-webp | méta | « entirely in your browser using the HTML canvas » | TROMPEUR | Sans perte = toujours libwebp WebAssembly ; Safari = libwebp WebAssembly (`IT/jpg-to-webp/page.jsx:29`, `app/lib/imageOutput.js:138-141`, `app/lib/bigImage.js:223-229`) — l'about le dit, la méta le contredit | « in your browser (canvas or libwebp in WebAssembly) » |
| jpg-to-webp | FAQ 2 | « There's no fixed size limit » | FAUX | 268 Mpx (`page.jsx:27` → `app/lib/imageOutput.js:77-82`) et 16 383 px de côté au plus (`app/lib/bigImage.js:221-224`) | Dire les deux limites |
| jpg-to-webp | étapes 1-4 | (aucune étape pour la qualité ou « Lossless ») | MINCE | Case « Lossless (pixel-exact for an opaque image; larger file) » (`page.jsx:45`), curseur « Quality: 80 » 1-100 (`page.jsx:17,46-47`), poids avant → après affiché (`page.jsx:51`) | Ajouter l'étape réglage |
| jpg-to-webp | FAQ 1 | « Yes, it's completely free with no watermarks added. » | GÉNÉRIQUE | `page.jsx:64` | Fait propre |
| jpg-to-webp | FAQ 4 | « only one file can be converted at a time » | GÉNÉRIQUE | `page.jsx:67` | Fait propre |
| jpg-to-webp | astuce 2 | « Keep a backup of your original JPG file before converting » | GÉNÉRIQUE | `page.jsx:71` | Supprimer |
| jpg-to-webp | astuce 3 | « WebP is supported by all current major browsers, so it's safe to use for most web projects. » | GÉNÉRIQUE | `page.jsx:72` (identique à `IT/png-to-webp/page.jsx:74`) | Supprimer |
| jpg-to-webp | astuce 4 | « Convert one file at a time and download each result before starting the next. » | GÉNÉRIQUE | `page.jsx:73` | Supprimer |

#### png-to-ico

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| png-to-ico | astuce 3 | « Keep all four sizes selected for maximum compatibility » | TROMPEUR | 7 tailles proposées (16, 24, 32, 48, 64, 128, 256), 4 cochées par défaut (`IT/png-to-ico/page.jsx:11-12,136-138`) | « Keep the default sizes (16, 32, 48, 256) selected » |
| png-to-ico | about | « it works both as a browser favicon and in software … that expects the native ICO format » | TROMPEUR | Entrées PNG dans l'ICO : lues depuis Windows Vista seulement (commentaire `page.jsx:34-38`) ; Windows XP et vieux outils ne les lisent pas | Ajouter « (Windows Vista or later) » |
| png-to-ico | FAQ 2 | « Do I need to install any software to use this tool? No… » | GÉNÉRIQUE | `page.jsx:165` | Remplacer |
| png-to-ico | FAQ 4 | « No, only one file can be converted at a time. » | GÉNÉRIQUE | `page.jsx:167` | Fait propre |
| png-to-ico | astuce 4 | « Test the downloaded file in your browser's favicon slot » | GÉNÉRIQUE | `page.jsx:173` | Supprimer |
| png-to-ico | étapes | (pas d'étape pour « Image that is not square ») | MINCE | Liste « Fit (whole image, transparent margins) » / « Fill (cropped to the square, centred) » (`page.jsx:141-142`) ; fichier toujours nommé `favicon.ico` (`page.jsx:149`) | Ajouter l'étape |

#### png-to-jpg

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| png-to-jpg | about | « transparent areas are filled with white in the JPG output » | FAUX | Couleur au choix, blanc par défaut : « Transparent areas become » + sélecteur de couleur (`IT/png-to-jpg/page.jsx:19,47-48,29`) | « filled with the colour you pick (white by default) » |
| png-to-jpg | about | « as iLoveIMG and CloudConvert do » | INVÉRIFIABLE | Aucun rapport dans `docs/audit/` sur le fond blanc PNG→JPG de ces deux sites (cherché : CloudConvert, PNG to JPG) | Supprimer |
| png-to-jpg | FAQ 3 | « They become white, since JPG doesn't support transparency. » | FAUX | Idem (`page.jsx:47-48`) | « They take the colour chosen under "Transparent areas become" (white by default) » |
| png-to-jpg | astuce 1 | « for another color, flatten the image in an editor first » | FAUX | Le sélecteur de couleur existe dans l'outil (`page.jsx:47-48`) | « choose another colour under "Transparent areas become" » |
| png-to-jpg | FAQ 2 | « though it's usually minor at default encoder settings » | TROMPEUR | Curseur « JPG quality: 92 », 10-100 (`page.jsx:18,44-45`), jamais mentionné | Citer le curseur et sa valeur 92 |
| png-to-jpg | méta + about | « using the HTML canvas » | TROMPEUR | Sur iPhone > 16,7 Mpx : MozJPEG en WebAssembly (`app/lib/imageOutput.js:140`) | Supprimer le détail |
| png-to-jpg | FAQ 1 | « Yes, it's 100% free with no registration required. » | GÉNÉRIQUE | `page.jsx:67` | Fait propre |
| png-to-jpg | astuce 4 | « Convert one file at a time — there's no batch upload option. » | GÉNÉRIQUE | `page.jsx:76` | Supprimer |
| png-to-jpg | étapes | (aucune étape qualité / couleur) | MINCE | `page.jsx:43-49` ; PNG animé : note « the result will hold its first frame only » (`page.jsx:52`, `app/components/AnimatedImageNote.jsx:17-19`) ; limite 268 Mpx (`app/lib/imageOutput.js:77-82`) | Ajouter |

#### png-to-webp

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| png-to-webp | méta | « entirely in your browser using the HTML canvas » | TROMPEUR | Sans perte et Safari = libwebp WebAssembly (`IT/png-to-webp/page.jsx:30`, `app/lib/imageOutput.js:138-141`) | Comme jpg-to-webp |
| png-to-webp | FAQ 2 | « There's no fixed size limit » | FAUX | 268 Mpx (`app/lib/imageOutput.js:77-82`) et 16 383 px de côté (`app/lib/bigImage.js:221-224`) | Dire les limites |
| png-to-webp | étapes 1-4 | (aucune étape qualité / Lossless) | MINCE | `page.jsx:46-48` ; note PNG animé (`page.jsx:51`) | Ajouter |
| png-to-webp | FAQ 1 | « Yes, it's 100% free with no registration required. » | GÉNÉRIQUE | `page.jsx:66` | Fait propre |
| png-to-webp | FAQ 4 | « No, it's entirely web-based and works in any modern browser. » | GÉNÉRIQUE | `page.jsx:69` | Remplacer |
| png-to-webp | astuce 2 | « Convert files one at a time — there's no batch upload option. » | GÉNÉRIQUE | `page.jsx:73` | Supprimer |
| png-to-webp | astuce 3 | « WebP is supported by all current major browsers » | GÉNÉRIQUE | `page.jsx:74` (doublon jpg-to-webp) | Supprimer |
| png-to-webp | astuce 4 | « Use WebP for product photos and thumbnails to reduce bandwidth » | GÉNÉRIQUE | `page.jsx:75` | Supprimer |

#### svg-to-png

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| svg-to-png | about | « entirely in your browser using the canvas element » | TROMPEUR | Sur iPhone > 16,7 Mpx : bandes + PNG hors canvas (`IT/svg-to-png/page.jsx:71-72`, `app/lib/imageOutput.js:142,255-273`) | Supprimer le détail |
| svg-to-png | FAQ 3 | « only one file can be converted at a time — there's no batch upload » | GÉNÉRIQUE | `page.jsx:132` | Fait propre |
| svg-to-png | astuce 4 | « Convert one file at a time and download each result before starting the next. » | GÉNÉRIQUE | `page.jsx:139` | Supprimer |
| svg-to-png | page entière | — | MINCE | Non dit : taille de sortie max 32 767 px de côté et 268 Mpx (`page.jsx:60-61` → `app/lib/mediaSupport.js:55-67`) ; boutons « 512 px wide », « 1024 px wide », « 2048 px wide » absents des étapes (`page.jsx:108`) ; fond « Transparent » / « Colour » absent des étapes (`page.jsx:104-107`) | Ajouter |

#### tiff-to-jpg

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| tiff-to-jpg | about | « Multi-page TIFFs are supported for decoding, but only the first page is converted. » | FAUX | Après conversion d'un TIFF de plusieurs pages : « This TIFF has N pages: page X was converted. Page [n] — then convert again. » (`IT/tiff-to-jpg/page.jsx:24-27,137,167-171`, `app/lib/tiffDecode.js:177-185`) | « Any page can be converted: choose its number, then convert again » |
| tiff-to-jpg | astuce 1 | « only the page the browser renders will be converted — extract other pages separately » | FAUX | Idem | Idem |
| tiff-to-jpg | FAQ 1 | « Yes, it's 100% free with no registration required. » | GÉNÉRIQUE | `page.jsx:187` | Fait propre |
| tiff-to-jpg | FAQ 4 | « only one file can be converted at a time » | GÉNÉRIQUE | `page.jsx:190` | Renvoi Image Converter |
| tiff-to-jpg | page entière | — | MINCE | Non dit : « Transparent areas become » (couleur, `page.jsx:19,151`) ; profil couleur non appliqué, signalé (`page.jsx:173`) ; orientation TIFF appliquée (`app/lib/tiffDecode.js:152-175`) ; CMYK 16 bits refusé (`tiffDecode.js:204-208`) ; bouton « Cancel » (`page.jsx:155`) | Ajouter |

#### tiff-to-png

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| tiff-to-png | about | « only the first page is converted » | FAUX | Choix de la page (`IT/tiff-to-png/page.jsx:163-167`, `app/lib/tiffDecode.js:177-185`) | Comme tiff-to-jpg |
| tiff-to-png | astuce 1 | « only the page the browser renders will be converted » | FAUX | Idem | Idem |
| tiff-to-png | FAQ 3 | « No, the pixels are copied as-is with no lossy compression applied. » | FAUX | TIFF de 2 à 32 bits ramenés à 8 bits par étirement min-max (`app/lib/tiffDecode.js:1-27,36-117`) ; CMYK converti en RGB (`tiffDecode.js:135-150`) ; profil couleur non appliqué (`page.jsx:169`) | « Lossless for 8-bit RGB/grey TIFFs; deeper TIFFs are scaled to 8 bits, CMYK converted to RGB, colour profile not applied » |
| tiff-to-png | FAQ 1 | « Yes, it's 100% free with no registration required. » | GÉNÉRIQUE | `page.jsx:183` | Fait propre |
| tiff-to-png | FAQ 4 | « No, it works entirely in your browser on any device with a modern browser. » | GÉNÉRIQUE | `page.jsx:186` | Remplacer |
| tiff-to-png | astuce 3 | « Check the converted PNG's dimensions match what you expect » | GÉNÉRIQUE | `page.jsx:192` | Supprimer |
| tiff-to-png | astuce 4 | « Convert one file at a time — there's no batch upload option. » | GÉNÉRIQUE | `page.jsx:193` | Supprimer |
| tiff-to-png | page entière | — | MINCE | Non dit : profil couleur (`page.jsx:169`), orientation (`app/lib/tiffDecode.js:152-175`), « Cancel » (`page.jsx:151`) | Ajouter |

#### webp-to-jpg

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| webp-to-jpg | astuce 2 | « There's no quality slider here — the browser's default JPEG encoding is used. » | FAUX | Curseur « JPG quality: 92 », 10-100 (`IT/webp-to-jpg/page.jsx:52-53`, valeur initiale 92) | « JPG quality slider, 92 by default » |
| webp-to-jpg | astuce 3 | « any transparent areas in your WebP become white » | FAUX | « Transparent areas become » + couleur (`page.jsx:55-56`) | « the colour you pick (white by default) » |
| webp-to-jpg | FAQ 3 | « There's no fixed size limit » | FAUX | 268 Mpx (`app/lib/imageOutput.js:77-82`) | Dire 268 Mpx |
| webp-to-jpg | méta + about | « using the HTML canvas » | TROMPEUR | Sur iPhone > 16,7 Mpx : MozJPEG WebAssembly (`app/lib/imageOutput.js:140`) | Supprimer le détail |
| webp-to-jpg | FAQ 1 | « Yes, it's completely free with no registration required. » | GÉNÉRIQUE | `page.jsx:75` | Fait propre |
| webp-to-jpg | FAQ 4 | « only one file can be converted at a time » | GÉNÉRIQUE | `page.jsx:78` | Fait propre |
| webp-to-jpg | astuce 1 | « Converting can't add detail beyond what's in the original WebP file » | GÉNÉRIQUE | `page.jsx:81` | Supprimer |
| webp-to-jpg | astuce 4 | « Convert one file at a time and download each result before starting the next. » | GÉNÉRIQUE | `page.jsx:84` | Supprimer |
| webp-to-jpg | étapes / about | (aucune mention du réglage ni de la note WebP animé) | MINCE | Note « This WebP is animated: the JPG will contain its first frame only… » (`page.jsx:20-29,60`) | Ajouter |

#### webp-to-png

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| webp-to-png | FAQ 2 | « No, the pixels are copied as-is with no additional compression applied. » | TROMPEUR | Décodage puis canvas (`IT/webp-to-png/page.jsx:33-35`) : pixels semi-transparents arrondis possibles (le site le dit pour PNG to WebP, `IT/png-to-webp/page.jsx:58`) ; le PNG est compressé (sans perte) | « Lossless PNG; half-transparent edges may be rounded by one step » |
| webp-to-png | méta + about | « using the HTML canvas » | TROMPEUR | Bandes + PNG hors canvas sur iPhone > 16,7 Mpx (`app/lib/imageOutput.js:142`) | Supprimer le détail |
| webp-to-png | FAQ 1 | « Yes, it's completely free with no registration required. » | GÉNÉRIQUE | `page.jsx:65` | Fait propre |
| webp-to-png | FAQ 3 | « One at a time — there's no batch conversion feature. » | GÉNÉRIQUE | `page.jsx:67` | Fait propre |
| webp-to-png | astuce 3 | « Convert one file at a time and download each result before starting the next. » | GÉNÉRIQUE | `page.jsx:73` | Supprimer |
| webp-to-png | astuce 4 | « Download your PNG right away, since nothing is stored anywhere after you leave the page. » | GÉNÉRIQUE | `page.jsx:74` | Supprimer |
| webp-to-png | page entière | — | MINCE | Non dit : note WebP animé (`page.jsx:18-26,51`), limite 268 Mpx (`app/lib/imageOutput.js:77-82`) | Ajouter |

#### image-compressor

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| image-compressor | about | « only offered once the tool has checked they draw exactly like the original » | TROMPEUR | Tolérance : écart ≤ 64 niveaux après tolérance de voisinage 3×3 ; « a 3-pixel sliver … is the one thing it cannot see » (`IT/image-compressor/page.jsx:37-48,195`) | « checked to draw the same, within anti-aliasing tolerance » |
| image-compressor | FAQ 6 | « compares them pixel by pixel; if they differ, it tries a more cautious setting » | TROMPEUR | Idem (`page.jsx:37-48,191-197`) | Dire la tolérance |
| image-compressor | about | « MozJPEG, the encoder behind the best online compressors » | INVÉRIFIABLE | Le rapport prouve que iLoveIMG utilise MozJPEG (`compress.worker.js:3-6`, `docs/audit/RAPPORT-ecarts-marche.md` §3b), pas « the best » | « the encoder iLoveIMG uses » ou supprimer |
| image-compressor | about | « the same size and quality as the leading online compressor's » | INVÉRIFIABLE | Mesure prouvée contre iLoveIMG (209 154 o / 43,72 dB vs 209 692 o / 43,67 dB, `docs/audit/RAPPORT-ecarts-marche.md:116`), « leading » non prouvé | Nommer la référence mesurée ou dire « a popular online compressor » |
| image-compressor | about | « shrinks JPG, PNG and WebP images » | FORMAT | AVIF compressé et gardé en AVIF (`compress.worker.js:274-276`, `app/lib/avifEncode.js:21-31`) | « JPG, PNG, WebP, AVIF and SVG » |
| image-compressor | FAQ 4 | « Yes for PNG and WebP. Transparent areas of other formats become white, since they are saved as JPG. » | TROMPEUR | AVIF garde sa transparence (RGBA encodé, `app/lib/avifEncode.js:21-25`) ; SVG reste vectoriel (`compress.worker.js:235-239`) | « Yes for PNG, WebP, AVIF and SVG; other formats become JPG on white » |
| image-compressor | FAQ 2 | « the page sends you to our GIF Compressor » | TROMPEUR | Un message d'erreur nomme l'outil, sans lien (`compress.worker.js:249`) | « the page tells you to use our GIF Compressor » |
| image-compressor | étape 3 | « Click 'Compress' » | LIBELLÉ | Bouton « Compress image » / « Compress N images » (`page.jsx:296`) | Citer le libellé exact |
| image-compressor | FAQ 8 | « 48 on a phone » | TROMPEUR | Plafond « téléphone » appliqué aussi à l'iPad, pas aux tablettes Android sous Chrome (`app/lib/isMobileDevice.js:5-9`, `page.jsx:128`) | « 48 on a phone or iPad » |
| image-compressor | FAQ 1 | « Yes, it's completely free with no registration required. » | GÉNÉRIQUE | `page.jsx:343` | Fait propre |
| image-compressor | astuce 4 | « Keep your original file as a backup » | GÉNÉRIQUE | `page.jsx:357` | Supprimer |
| image-compressor | page entière | — | MINCE | Non dit : PNG animé (APNG) et WebP animé refusés avec message (`compress.worker.js:251-259`) ; recherche de taille cible entre 10 et 95 % (`compress.worker.js:282`) ; note iPhone « a photo picked from Photo Library reaches this page converted by iOS » (`page.jsx:268`, `app/components/IosOriginalNote.jsx:21`) ; arrêt sans réponse après 60 s + 1,5 s/Mpx (`page.jsx:169-178`) | Ajouter |

---

#### Défauts relevés dans le code (hors texte, à transmettre)

- `IT/svg-to-png/page.jsx:114` : `<img src={result}>` reçoit l'objet `{ blob, url, name }` au lieu de `result.url` → l'aperçu
  après conversion est une image cassée (le bouton « Download » de la ligne 115 utilise bien `result.url`).
- `IT/tiff-to-jpg/tiffToJpg.worker.js:38-41` : utilise `OffscreenCanvas` sans vérifier qu'il existe, alors que
  `tiffToPng.worker.js:37-38` le vérifie (« No OffscreenCanvas in this worker (some WebKit builds) »).
- `IT/image-converter/extraFormats.js:159` : PDF, qualité plancher 50 % alors que le curseur descend à 10 %.

#### Synthèse du lot image-1

18 outils lus, 149 défauts (une ligne de tableau = un défaut) :

| Type | Nombre |
|---|---|
| FAUX | 20 |
| INVÉRIFIABLE | 8 |
| TROMPEUR | 32 |
| GÉNÉRIQUE | 63 |
| MINCE | 19 |
| LIBELLÉ | 2 |
| FORMAT | 5 |
| **Total** | **149** |

Par outil : image-converter 18, image-compressor 12, bmp-to-png 9, heic-to-png 9, ico-to-png 9, png-to-jpg 9,
webp-to-jpg 9, gif-to-png 8, jpg-to-webp 8, png-to-webp 8, tiff-to-png 8, heic-to-jpg 7, image-to-base64 7,
webp-to-png 7, jpg-to-png 6, png-to-ico 6, tiff-to-jpg 5, svg-to-png 4.

Les plus graves (contredits par l'interface que le visiteur a sous les yeux) : WebP to JPG « There's no quality slider
here » alors que le curseur est affiché ; PNG/WebP to JPG « become white » alors qu'un sélecteur de couleur existe ;
TIFF to JPG/PNG « only the first page is converted » alors qu'un choix de page existe ; ICO to PNG « there's no
per-size selector » à côté du bouton « Every size in this icon » ; « There's no fixed size limit » sur 5 pages alors que
le code refuse au-delà de 268 Mpx (et 16 383 px de côté en WebP).


---

### Lot image-2

Source du texte servi : `docs/audit/p36/contenu-avant.json`. Code lu : `app/tools/image-tools/<outil>/page.jsx` (ou `page.tsx`),
`layout.tsx`, et les modules importés (`app/lib/imageOutput.js`, `app/lib/bigImage.js`, `app/lib/canvasFilters.js`,
`app/lib/imageSimilarity.js`, `app/lib/stripMetadata.js`, `app/lib/fileChecks.js`, `app/lib/mediaSupport.js`,
`app/components/FileDownload.jsx`, `AnimatedImageNote.jsx`, `UploadPrompt.jsx`, `FileDropBridge.jsx`, `app/lib/useToolError.js`).
Dans la colonne « code », `page.jsx:NN` / `layout.tsx:NN` = fichier de l'outil de la ligne ; les autres chemins sont complets.

Faits communs (vérifiés une fois, valables pour toutes les lignes qui les citent) :
- **Règle de format de sortie des filtres** (`encodeRasterLike`) : JPEG → JPEG qualité 92, WebP → WebP qualité 92 (libwebp
  en WebAssembly là où le navigateur n'encode pas le WebP : Safari), **tout autre type → PNG** (GIF, BMP, AVIF, HEIC/TIFF
  ouverts par Safari, SVG…) — `app/lib/imageOutput.js:120-142`. Donc un JPEG ou un WebP est **ré-encodé avec perte**.
- **Limite fixe de taille** : au-delà de 268 435 456 pixels (268 Mpx), refus avec message avant décodage —
  `app/lib/imageOutput.js:77-81` (`RASTER_MAX_PIXELS`). WebP limité à 16 383 px de côté — `app/lib/bigImage.js:222-224`.
- **Animations** : un GIF / APNG / WebP animé ne garde que sa première image, annoncé avant le traitement —
  `app/components/AnimatedImageNote.jsx:5-20`.
- **Le fichier d'origine n'est jamais modifié** : chaque clic relit le fichier choisi (`loadRaster(file)`) et produit un
  nouveau fichier nommé `<nom>-<suffixe>.<ext>` — `app/lib/download.js:108-111`, `app/lib/imageOutput.js:147-149`.
- Aucune requête vers `app/api/*` sauf `/api/report-error` (texte du message d'erreur affiché, jamais le fichier) —
  `app/lib/useToolError.js:38-43,55-66`, `app/lib/reportError.js:16,163-169`. Encodeurs WebAssembly téléchargés depuis le
  site lui-même (`/wasm/…`) — `app/lib/bigImage.js:179-186`. Pas d'inscription, pas de quota pour ces 19 outils.
- Phrases répétées mesurées dans `docs/audit/p36/unicite-avant.json` (champ `repeated`) : « it accepts common formats your
  browser can open, such as jpg, png, and webp » (15 pages), « click the upload area and select an image from your device »
  (14), « yes, it's completely free with no registration required » (12), « the result keeps your image's format… » (12),
  « there's no fixed size limit… » (8), « your image is never uploaded to a server » (6), « yes, it's completely free with
  no signup required » (92).

#### add-border-to-image

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| add-border-to-image | titre | « Add Border to Image — Let You Add a Solid-color Border » | MINCE | `layout.tsx:5` : titre tronqué (« Let You » sans sujet), aucune information | Titre complet : bordure unie de 1 à 100 px, couleur au choix, format conservé |
| add-border-to-image | méta | « a solid-color border of any width » | FAUX | `page.jsx:65` : curseur `min="1" max="100"` | « de 1 à 100 px » |
| add-border-to-image | about | « a solid-color border of any width around a photo » | FAUX | `page.jsx:65` : 1 à 100 px | « de 1 à 100 px » |
| add-border-to-image | étape 1 | « Click the upload area and select an image from your device. » | GÉNÉRIQUE | 14 pages (unicite-avant.json) | Étape propre à l'outil (ou fusionner avec le choix de largeur/couleur) |
| add-border-to-image | étape 4 | « save your bordered PNG image » | FAUX | `page.jsx:48` → `app/lib/imageOutput.js:122-126` : JPG reste JPG, WebP reste WebP ; PNG seulement pour PNG et autres types | « dans le format de l'original (PNG pour GIF/BMP/AVIF…) » |
| add-border-to-image | FAQ 1 | « It accepts common formats your browser can open, such as JPG, PNG, and WebP. » | FORMAT | `page.jsx:61` accept `image/*` ; `app/lib/imageOutput.js:124` : GIF, BMP, AVIF… sortent en PNG (non dit) ; animé → 1re image (`AnimatedImageNote.jsx:18`). Phrase aussi présente sur 15 pages | Dire : GIF/BMP/AVIF acceptés → PNG ; animation → première image seulement |
| add-border-to-image | FAQ 2 | « There's no fixed size limit — … limited only by your device's available memory. » | FAUX | `app/lib/imageOutput.js:77-81` : refus au-delà de 268 Mpx ; WebP ≤ 16 383 px de côté (`app/lib/bigImage.js:222-224`) | « jusqu'à 268 mégapixels ; un WebP au plus 16 383 px de côté » |
| add-border-to-image | astuce 2 | « Use thicker borders for smaller images and thinner borders for larger images… » | GÉNÉRIQUE | Conseil d'esthétique copiable ailleurs. Fait utile non dit : la bordure s'AJOUTE autour (image finale W+2×bordure, `page.jsx:40`) | Remplacer par : la largeur est en pixels de l'image réelle, ajoutée de chaque côté |
| add-border-to-image | astuce 4 | « Since nothing is uploaded, download your result right away — it isn't saved anywhere after you leave the page. » | GÉNÉRIQUE | Même phrase sur add-text, add-vignette ; le navigateur demande confirmation avant de quitter tant que le fichier n'est pas pris (`app/components/FileDownload.jsx:69-81`) | Fait propre ou suppression |

#### add-noise

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| add-noise | about | « It's a single adjustable-intensity effect — not a choice of different noise types » | TROMPEUR | `page.jsx:77` : case « Colour noise (each colour channel its own grain) » ; `page.jsx:50-55` : bruit identique sur R,G,B (monochrome) ou un tirage par canal (couleur) | Dire : intensité 1-100, grain monochrome par défaut ou couleur |
| add-noise | méta + about | « by adding random variation to each pixel's brightness » | TROMPEUR | Vrai en monochrome seulement ; en mode couleur chaque canal varie séparément (`page.jsx:51-54`). Bruit uniforme entre −intensité et +intensité (`page.jsx:45-49`) | « variation aléatoire uniforme de ±intensité par pixel (ou par canal en mode couleur) » |
| add-noise | étape 1 | « Click the upload area and select an image from your device. » | GÉNÉRIQUE | 14 pages | Étape propre |
| add-noise | étape 4 | « save your noisy PNG image » | FAUX | `page.jsx:59` → `app/lib/imageOutput.js:122-126` | « dans le format de l'original » |
| add-noise | FAQ 1 | « Yes, Add Noise is completely free with no watermarks or subscriptions required. » | GÉNÉRIQUE | Formule « Is X free? Yes… » | Supprimer ou remplacer par un fait propre |
| add-noise | FAQ 2 | « It accepts common formats your browser can open, such as JPG, PNG, and WebP. » | FORMAT | `page.jsx:72` accept `image/*` ; autres types → PNG (`app/lib/imageOutput.js:124`), animé → 1re image (`page.jsx:74`) | Voir add-border FAQ 1 |
| add-noise | FAQ 3 | « there's a single grain effect with an adjustable intensity slider — no separate noise-type selector » | TROMPEUR | `page.jsx:77` : option couleur/monochrome ; distribution uniforme (pas gaussienne) `page.jsx:49` | « Pas de gaussien ni sel-et-poivre : bruit uniforme, monochrome ou couleur » |
| add-noise | FAQ 4 | « Is my image data secure and private? Yes — everything happens locally in your browser. Your image is never uploaded to a server. » | GÉNÉRIQUE | Phrase répétée (6 pages) | Une seule mention de confidentialité, avec un fait propre |
| add-noise | astuce 1 | « Start with a lower intensity and increase it gradually… » | GÉNÉRIQUE | — | Supprimer |
| add-noise | astuce 2 | « Add Noise works well on photos with good lighting and clear subjects, since grain can obscure fine detail on darker images. » | INVÉRIFIABLE | Aucune mesure dans `docs/audit/` | Supprimer |
| add-noise | astuce 3 | « Re-upload your original image if you want to try a different intensity from scratch. » | FAUX | `page.jsx:38` : chaque clic sur « Add Noise » repart du fichier d'origine ; rien à recharger | « Changez l'intensité et cliquez à nouveau : le calcul repart toujours de l'original » |
| add-noise | astuce 4 | « Use a lighter touch on portraits and a heavier one on landscapes… » | GÉNÉRIQUE | — | Supprimer |

#### add-text-to-image

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| add-text-to-image | titre | « Add Text to Image — Overlay a Single Line Online Free » | FAUX | `page.jsx:72` : `text.split(/\r?\n/)`, plusieurs lignes ; libellé « Text (Enter for a new line) » `page.jsx:99` | Titre sans « Single Line » |
| add-text-to-image | méta | « overlays a single line of text onto your photo » | FAUX | `page.jsx:72,99` | « une ou plusieurs lignes » |
| add-text-to-image | about | « no design skills or software installation needed » | GÉNÉRIQUE | Formule passe-partout | Supprimer |
| add-text-to-image | étape 1 | « Click the upload area and select an image from your device. » | GÉNÉRIQUE | 14 pages | Étape propre |
| add-text-to-image | FAQ 1 | « It accepts common formats your browser can open, such as JPG, PNG, and WebP. » | FORMAT | `page.jsx:95` accept `image/*` ; autres → PNG, animé → 1re image (`page.jsx:97`) | Voir add-border FAQ 1 |
| add-text-to-image | FAQ 3 | « an outline of any colour and width » | TROMPEUR | `page.jsx:118` : contour 0 à 30 px ; couleur libre `page.jsx:119` | « contour de 0 à 30 px » |
| add-text-to-image | FAQ 4 | « Do I need to create an account to use this tool? No, it's completely free with no account or login required. » | GÉNÉRIQUE | — | Supprimer ou fait propre |
| add-text-to-image | astuce 1 | « Use a color that contrasts clearly with your image so the text stays readable. » | GÉNÉRIQUE | — | Supprimer |
| add-text-to-image | astuce 2 | « Preview a few font sizes to find one that fits your image without running off the edges. » | TROMPEUR | Pas d'aperçu en direct : il faut cliquer « Apply Text » à chaque essai (`page.jsx:55-85,121`) ; la taille (10-800 px, `page.jsx:101`) est en pixels de l'image réelle : 40 px est minuscule sur une photo de 4 000 px | « Taille en pixels de la photo (10-800) : sur une photo de téléphone, partez de 150-300 px ; cliquez Apply Text pour voir » |
| add-text-to-image | astuce 4 | « Since nothing is uploaded, download your result promptly… » | GÉNÉRIQUE | Voir add-border astuce 4 | Supprimer |

#### add-vignette

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| add-vignette | about | « Adjust the intensity with a single slider » | FAUX | `page.jsx:66-67` : deux curseurs, « Intensity » (1-100 %) et « Clear centre » (0-90 %) | Citer les deux curseurs |
| add-vignette | étape 1 | « Click the upload area and select an image from your device. » | GÉNÉRIQUE | 14 pages | Étape propre |
| add-vignette | FAQ 1 | « It accepts common formats your browser can open, such as JPG, PNG, and WebP. » | FORMAT | `page.jsx:62` accept `image/*` ; autres → PNG, animé → 1re image | Voir add-border FAQ 1 |
| add-vignette | FAQ 2 | « There's no fixed size limit… » | FAUX | `app/lib/imageOutput.js:77-81` (268 Mpx) | Dire la limite |
| add-vignette | FAQ 3 | « No, there's a single intensity slider — the radial gradient always spans from the image's edges to its center, with no separate size control. » | FAUX | `page.jsx:16,41,67` : « Clear centre » garde un centre intact sur 0-90 % du rayon | « Oui : Clear centre règle la zone centrale non assombrie » |
| add-vignette | FAQ 4 | « no quality is lost in the process » | TROMPEUR | Résolution conservée, mais un JPG/WebP est ré-encodé en qualité 92 (`page.jsx:50`, `app/lib/imageOutput.js:122-138`) | « Même taille en pixels ; un JPG est réenregistré en qualité 92 » |
| add-vignette | astuce 1 | « Start with a lower intensity and increase it gradually… » | GÉNÉRIQUE | — | Supprimer |
| add-vignette | astuce 2 | « Vignettes work especially well on portraits… » | GÉNÉRIQUE | — | Supprimer |
| add-vignette | astuce 4 | « Since nothing is uploaded, download your result right away… » | GÉNÉRIQUE | Voir add-border astuce 4 | Supprimer |

#### brightness-contrast

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| brightness-contrast | titre | « Brightness and Contrast — Let You Adjust an Image's » | MINCE | `layout.tsx:5` : titre tronqué | Titre complet (luminosité, contraste, saturation) |
| brightness-contrast | méta | « with two sliders, applied via the browser's canvas filter » | FAUX | `page.jsx:61-63` : trois curseurs (Brightness, Contrast, Saturation, 0-200 %) ; sans `ctx.filter` (Safari) le calcul est fait pixel par pixel (`page.jsx:33-43`, `app/lib/canvasFilters.js:1-34`) | « trois curseurs ; même résultat sur tous les navigateurs » |
| brightness-contrast | about | « adjust an image's brightness and contrast with two sliders, applied via the browser's canvas filter » | FAUX | idem | idem + citer Saturation |
| brightness-contrast | étapes 2-3 | (aucune mention de la saturation) | MINCE | `page.jsx:63` : curseur « Saturation » absent des étapes | Ajouter le curseur Saturation |
| brightness-contrast | étape 1 | « Click the upload area and select an image from your device. » | GÉNÉRIQUE | 14 pages | Étape propre |
| brightness-contrast | FAQ 1 | « Is Brightness and Contrast free to use? Yes, it's completely free with no registration required. » | GÉNÉRIQUE | 12 pages | Supprimer |
| brightness-contrast | FAQ 2 | « It accepts common formats your browser can open, such as JPG, PNG, and WebP. » | FORMAT | `page.jsx:57` accept `image/*` ; autres → PNG, animé → 1re image | Voir add-border FAQ 1 |
| brightness-contrast | FAQ 3 | « No, all image processing happens in your browser. Your images are never uploaded to a server. » | GÉNÉRIQUE | Phrase répétée | Fusionner en une mention |
| brightness-contrast | astuce 1 | « Start with small adjustments and fine-tune gradually rather than large jumps. » | GÉNÉRIQUE | — | Supprimer |
| brightness-contrast | astuce 2 | « Increase contrast to make a flat, dull photo pop… » | GÉNÉRIQUE | — | Supprimer |
| brightness-contrast | astuce 3 | « Use the brightness slider to fix underexposed or overexposed photos. » | GÉNÉRIQUE | — | Remplacer par l'échelle réelle (100 % = inchangé, 0-200 %) |
| brightness-contrast | astuce 4 | « If a result isn't quite right, re-upload the original and try again with different values. » | FAUX | `page.jsx:30` : chaque « Apply » repart du fichier d'origine | « Changez les valeurs et cliquez Apply : on repart toujours de l'original » |

#### duplicate-image-finder

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| duplicate-image-finder | méta | « flags pairs that are byte-for-byte identical » | TROMPEUR | Aussi la même image redimensionnée/réenregistrée par dHash 64 bits (`page.jsx:62`, `app/lib/imageSimilarity.js:14-49`) | « copies exactes (SHA-256) et même image en autre taille/qualité/format » |
| duplicate-image-finder | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | 92 pages | Supprimer |
| duplicate-image-finder | astuce 2 | « An amber match between two files of different sizes usually means one is a smaller copy… keep the larger one. » | TROMPEUR | L'outil n'affiche ni poids ni dimensions des fichiers (`page.jsx:89,94` : nom et « N/64 matching » seulement) | Dire qu'il faut vérifier la taille dans le gestionnaire de fichiers, ou ne pas l'évoquer |

#### grayscale-converter

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| grayscale-converter | titre | « Grayscale Converter — Turn a Color Image Online Free » | MINCE | `layout.tsx:5` : titre tronqué (« Turn a Color Image » sans complément) | Titre complet |
| grayscale-converter | méta | « by averaging each pixel's red, green, and blue values » | FAUX | Méthode par défaut = luminance Rec. 709 (`page.jsx:22,35`) ; la moyenne n'est qu'une des 7 méthodes (`page.jsx:14-20`) | « luminance Rec. 709 par défaut, 6 autres méthodes, noir et blanc pur à seuil » |
| grayscale-converter | FAQ 1 | « It accepts common formats your browser can open, such as JPG, PNG, and WebP. » | FORMAT | `page.jsx:70` accept `image/*` ; autres → PNG, animé → 1re image | Voir add-border FAQ 1 |
| grayscale-converter | FAQ 2 | « There's no fixed size limit… » | FAUX | `app/lib/imageOutput.js:77-81` | Dire 268 Mpx |
| grayscale-converter | FAQ 3 | « No, the original resolution is preserved — only the color information is changed. » | TROMPEUR | `page.jsx:58` : JPG/WebP ré-encodés qualité 92 (`app/lib/imageOutput.js:122-138`) ; l'image reste en RVB (3 canaux identiques, `page.jsx:54`) | « Même taille en pixels ; un JPG est réenregistré en qualité 92 » |
| grayscale-converter | FAQ 5 | « Can I convert multiple images at once? No, the tool converts one image at a time — there's no batch upload. » | GÉNÉRIQUE | Même Q/R sur 3 pages | Supprimer |
| grayscale-converter | astuce 1 | « Well-lit portraits with clear contrast tend to convert to grayscale most effectively. » | GÉNÉRIQUE | — | Supprimer |
| grayscale-converter | astuce 3 | « Try converting a few different photos to see which ones look best in black and white. » | GÉNÉRIQUE | — | Supprimer |
| grayscale-converter | astuce 4 | « Grayscale images work well for formal documents, resumes, and prints… » | GÉNÉRIQUE | — | Supprimer |

#### image-blur

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| image-blur | titre | « Image Blur — Apply a Uniform Blur Effect Across Your Online » | MINCE | `layout.tsx:5` : titre cassé (« Across Your Online ») | Titre complet |
| image-blur | about | « with the browser's own blur filter where it has one, and otherwise (Safari, iPhone) computed on all your device's processor cores » | FAUX | `page.jsx:37` : `const native = false && …` — le filtre du navigateur n'est JAMAIS utilisé ; partout : processeur graphique (WebGL2) d'abord, sinon tous les cœurs (`page.jsx:46,56`; `docs/audit/RAPPORT-p17-30-09.md:124-127`) | « calculé sur le processeur graphique, sinon sur tous les cœurs, dans tous les navigateurs ; bords répétés, pas de cadre clair » |
| image-blur | étape 1 | « Click the upload area and select an image from your device. » | GÉNÉRIQUE | 14 pages | Étape propre |
| image-blur | FAQ 1 | « Is Image Blur really free to use? Yes, it's completely free with no registration required. » | GÉNÉRIQUE | 12 pages | Supprimer |
| image-blur | FAQ 2 | « It accepts common formats your browser can open, such as JPG, PNG, and WebP. » | FORMAT | `page.jsx:73` accept `image/*` ; autres → PNG, animé → 1re image | Voir add-border FAQ 1 |
| image-blur | FAQ 3 | « No, your images are processed entirely in your browser and are never uploaded to a server. » | GÉNÉRIQUE | Phrase répétée | Fusionner |
| image-blur | astuce 2 | « crop out the sensitive area first if you only want to obscure part of a photo » | TROMPEUR | Recadrer ne garde QUE la zone ; aucun outil du site ne recolle la zone floutée dans la photo (flou global `page.jsx:41-60`) | Dire simplement : pas de flou partiel |
| image-blur | astuce 4 | « Download your result before navigating away… » | GÉNÉRIQUE | — | Supprimer |

#### image-comparison

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| image-comparison | méta | « two images stacked with a draggable vertical divider » | FAUX | Le trait (`page.jsx:96-98`) n'a aucun gestionnaire ; la position se règle avec le curseur « Slider: N% » sous l'image (`page.jsx:100`) | « une ligne de séparation que l'on déplace avec le curseur Slider » |
| image-comparison | about | « two images stacked with a draggable vertical divider » | FAUX | idem | idem |
| image-comparison | about | « as Diffchecker's image compare does » | INVÉRIFIABLE | Aucun rapport de comparaison dans `docs/audit/` | Supprimer la référence à un tiers |
| image-comparison | FAQ 1 | « It accepts common formats your browser can open, such as JPG, PNG, and WebP. » | FORMAT | `page.jsx:69,73` accept `image/*` ; refus au-delà de 100 Mpx par image (`page.jsx:30`) non dit ; le message d'erreur cite « JPG, PNG, WebP or GIF » (`page.jsx:33`) | Formats + limite de 100 Mpx par image |
| image-comparison | astuce 2 | « Drag the slider slowly across areas you want to inspect closely. » | GÉNÉRIQUE | — | Supprimer |
| image-comparison | astuce 4 | « Tiny differences from JPEG re-compression stay below the 16/255 threshold, so only real changes are painted. » | INVÉRIFIABLE | Seuil 16 réel (`page.jsx:49-50`), mais aucune mesure sur des JPEG réenregistrés dans `docs/audit/` ; dépend de la qualité | « Un pixel compte comme différent au-delà de 16/255 sur un canal » sans promesse sur le JPEG |

#### image-cropper

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| image-cropper | méta | « by entering exact X, Y, width, and height values in pixels » | FAUX | Uniquement des curseurs `type="range"` (`page.jsx:105-108`), aucun champ de saisie | « en réglant X, Y, largeur et hauteur au pixel près avec des curseurs, ou un ratio prédéfini » |
| image-cropper | étape 1 | « Click the upload area and select an image from your device. » | GÉNÉRIQUE | 14 pages | Étape propre |
| image-cropper | FAQ 1 | « It accepts common formats your browser can open, such as JPG, PNG, and WebP. » | FORMAT | `page.jsx:94` accept `image/*` ; autres → PNG (`page.jsx:83`, `app/lib/imageOutput.js:124`) ; pas d'avertissement d'animation sur cette page (l'image affichée est dessinée telle quelle, `page.jsx:82`) | Voir add-border FAQ 1 |
| image-cropper | FAQ 2 | « Is Image Cropper really free to use? Yes, it's completely free with no registration required. » | GÉNÉRIQUE | 12 pages | Supprimer |
| image-cropper | FAQ 4 | « No, your images are processed locally in your browser and are never uploaded to a server. » | GÉNÉRIQUE | Phrase répétée | Fusionner |
| image-cropper | astuce 4 | « Crop one image at a time — there's no batch processing option. » | GÉNÉRIQUE | — | Supprimer |

#### image-editor

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| image-editor | méta | « a free, full-featured photo editor » | INVÉRIFIABLE | 4 onglets, 15 réglages (`page.tsx:249-319`) ; pas de recadrage, de calques, d'annulation, de flou | « éditeur simple : réglages, rotation par quarts de tour, miroir, effets, décor » |
| image-editor | about | « a free, full-featured photo editor » | INVÉRIFIABLE | idem | idem |
| image-editor | about | « Adjust colors, transform and crop » | FAUX | Aucun réglage de recadrage (`page.tsx:287-319`) | Retirer « crop », renvoyer à Image Cropper |
| image-editor | about | « then download the result as a PNG » | FAUX | `page.tsx:223-225` : format de la photo conservé (JPG reste JPG, WebP reste WebP) ; PNG seulement avec coins arrondis ou autre format source | « dans le format de la photo ; PNG si coins arrondis » |
| image-editor | FAQ 1 | « Yes, it's completely free with no signup and no limit on how many images you can edit. » | GÉNÉRIQUE | Formule « Is X free? » ; fait non dit : 100 Mpx au plus par image (`page.tsx:54-55`) | Remplacer par la limite réelle |
| image-editor | FAQ 3 | « transforms (rotate, flip, pixelate) … decorations (rounded corners, borders, text overlay) » | TROMPEUR | Rotation par pas de 90° seulement (`page.tsx:298`, `step="90"`) ; texte : une ligne, Arial, 12-72 px, position fixe en haut à gauche (`page.tsx:173-176,315-317`) ; coins 0-100 px, bordure 0-20 px tracée DANS l'image (`page.tsx:168-172,312-313`) | Donner ces bornes |
| image-editor | astuce 3 | « Combine desaturation with a vignette for a quick vintage or moody look. » | GÉNÉRIQUE | — | Supprimer |
| image-editor | astuce 4 | « Rounded corners and a border are a fast way to turn a photo into a ready-to-use avatar or card image. » | TROMPEUR | La bordure est un rectangle droit tracé APRÈS la découpe des coins (`page.tsx:159-172`) : ses angles restent carrés par-dessus les coins transparents | Ne pas conseiller la combinaison ; renvoyer à Round Corners + Add Border |

#### image-flip

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| image-flip | about | « mirrors your image horizontally or vertically » (2 phrases au total) | MINCE | Bouton « Flip Both Ways » (= demi-tour 180°) absent (`page.jsx:30,54`) ; format conservé, chaque clic repart de l'original (`page.jsx:26`) non dits | Citer les trois boutons et la règle de format |
| image-flip | étape 1 | « Click the upload area and select an image from your device. » | GÉNÉRIQUE | 14 pages | Étape propre |
| image-flip | étape 4 | « save your flipped PNG image » | FAUX | `page.jsx:35` → `app/lib/imageOutput.js:122-126` | « dans le format de l'original » |
| image-flip | FAQ 1 | « Is Image Flip really free to use? Yes, it's completely free with no registration required. » | GÉNÉRIQUE | 12 pages | Supprimer |
| image-flip | FAQ 2 | « It accepts common formats your browser can open, such as JPG, PNG, and WebP. » | FORMAT | `page.jsx:47` accept `image/*` ; autres → PNG, animé → 1re image (`page.jsx:49`) | Voir add-border FAQ 1 |
| image-flip | FAQ 3 | « No, this tool only mirrors horizontally or vertically. » | TROMPEUR | Aussi les deux à la fois (`page.jsx:30,54`) | « horizontal, vertical ou les deux (180°) » |
| image-flip | FAQ 4 | « Yes, images are processed entirely in your browser and are never uploaded to a server. » | GÉNÉRIQUE | Phrase répétée | Fusionner |
| image-flip | astuce 1 | « Use horizontal flip to create a mirror image for design symmetry or artistic compositions. » | GÉNÉRIQUE | — | Supprimer |
| image-flip | astuce 3 | « PNG output preserves transparency, so any transparent background in your source image carries over. » | TROMPEUR | La sortie n'est PNG que pour un PNG (ou autre type) en entrée ; un WebP transparent reste WebP transparent (`app/lib/imageOutput.js:122-126`) | « La transparence est conservée (PNG et WebP) » |
| image-flip | astuce 4 | « Flip one image at a time — there's no batch processing built in. » | GÉNÉRIQUE | — | Remplacer par : les clics ne se cumulent pas (chaque bouton repart de l'original, `page.jsx:26`) |

#### image-inverter

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| image-inverter | about | « creates a photo-negative effect by subtracting… from 255 … Your image is never uploaded to a server. » | MINCE | Deux phrases ; non dits : transparence conservée (alpha intact, `page.jsx:30-34`), format conservé, limite 268 Mpx | Ajouter ces faits |
| image-inverter | étape 1 | « Click the upload area and select an image from your device. » | GÉNÉRIQUE | 14 pages | Étape propre |
| image-inverter | étape 4 | « save your inverted PNG image » | FAUX | `page.jsx:37` → `app/lib/imageOutput.js:122-126` | « dans le format de l'original » |
| image-inverter | FAQ 1 | « It accepts common formats your browser can open, such as JPG, PNG, and WebP. » | FORMAT | `page.jsx:49` accept `image/*` ; autres → PNG, animé → 1re image (`page.jsx:52`) | Voir add-border FAQ 1 |
| image-inverter | FAQ 2 | « There's no fixed size limit… » | FAUX | `app/lib/imageOutput.js:77-81` | Dire 268 Mpx |
| image-inverter | FAQ 3 | « Do I need to create an account to use Image Inverter? No, it's completely free and requires no account or login. » | GÉNÉRIQUE | — | Supprimer |
| image-inverter | FAQ 4 | « Can I invert multiple images at once? No… » | GÉNÉRIQUE | Même Q/R sur 3 pages | Supprimer |
| image-inverter | astuce 1 | « Inverted images can make for striking, high-contrast visuals… » | GÉNÉRIQUE | — | Supprimer |
| image-inverter | astuce 2 | « Try inverting black-and-white photos for unusual, artistic results. » | GÉNÉRIQUE | — | Supprimer |
| image-inverter | astuce 3 | « Download both the original and inverted versions if you want to compare them side by side. » | GÉNÉRIQUE | L'original est déjà sur l'appareil (jamais modifié) | Supprimer (ou renvoyer à Image Comparison) |
| image-inverter | astuce 4 | « Invert one image at a time and download each before starting the next. » | GÉNÉRIQUE | Redit la FAQ 4 | Supprimer |

#### image-metadata

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| image-metadata | titre | « Image Metadata Viewer — Read Basic File Information Online » | TROMPEUR | Lit aussi EXIF, GPS, IPTC, XMP, ICC (`page.jsx:49`) et retire les métadonnées (`page.jsx:76`) | Titre : voir et supprimer EXIF/GPS |
| image-metadata | méta | « reads basic file information … — name, size, type, dimensions, and date » | TROMPEUR | idem ; « date » = date de dernière modification du fichier (`page.jsx:41`), la date de prise de vue vient de l'EXIF | Citer EXIF/GPS et la suppression |
| image-metadata | about | « shows everything stored in an image » | FAUX | `page.jsx:49` : `ifd1: false` (vignette/IFD1 non lus), seuls les groupes tiff/exif/gps/iptc/xmp/icc/interop sont demandés | « affiche les métadonnées EXIF, GPS, IPTC, XMP et ICC » |
| image-metadata | FAQ 1 | « Is Image Metadata Viewer free to use? Yes, it's completely free with no signup required. » | GÉNÉRIQUE | 92 pages | Supprimer |

#### image-pixelator

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| image-pixelator | about | « averaging blocks of pixels at a size you choose » (2 phrases) | MINCE | Mode « % of the picture » (1-20 % du petit côté, `page.jsx:17-19,44,64-65`) non dit ; moyenne pondérée par l'alpha (`app/lib/imageOutput.js:32-51`) | Citer les deux unités et leurs bornes |
| image-pixelator | étape 1 | « Click the upload area and select an image from your device. » | GÉNÉRIQUE | 14 pages | Étape propre |
| image-pixelator | étape 2 | « Adjust the pixel size slider (2–50px) to set the block size. » | TROMPEUR | Vrai en mode « In pixels » ; l'autre mode « % of the picture » (1-20 %) n'est pas dit (`page.jsx:64-66`) | Ajouter le choix d'unité |
| image-pixelator | étape 4 | « save your pixelated PNG image » | FAUX | `page.jsx:49` → `app/lib/imageOutput.js:122-126` | « dans le format de l'original » |
| image-pixelator | FAQ 1 | « Is Image Pixelator really free to use? Yes, it's completely free with no registration required. » | GÉNÉRIQUE | 12 pages | Supprimer |
| image-pixelator | FAQ 2 | « It accepts common formats your browser can open, such as JPG, PNG, and WebP. » | FORMAT | `page.jsx:62` accept `image/*` ; autres → PNG, animé → 1re image (`page.jsx:69`) | Voir add-border FAQ 1 |
| image-pixelator | FAQ 3 | « Yes, all processing happens locally in your browser — your image is never uploaded to a server. » | GÉNÉRIQUE | Phrase répétée | Fusionner |
| image-pixelator | astuce 2 | « crop out just the area you want obscured first if you don't want the rest pixelated » | TROMPEUR | Recadrer ne garde que la zone ; rien ne la recolle dans la photo | Dire : pas de pixellisation partielle |
| image-pixelator | astuce 3 | « Try a couple of pixel sizes on a copy of your image » | TROMPEUR | L'original n'est jamais modifié (`page.jsx:40`), aucune copie nécessaire | « Essayez plusieurs tailles : chaque clic repart de l'original » |
| image-pixelator | astuce 4 | « Pixelate one image at a time — there's no batch processing option. » | GÉNÉRIQUE | — | Supprimer |

#### image-resizer

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| image-resizer | méta | « Resize JPG, PNG and WebP … in the original format » | FORMAT | accept `image/*` (`page.jsx:131`) : GIF, BMP, AVIF… acceptés et enregistrés en PNG avec une note (`page.jsx:109-110`) ; menu « Save as » JPG / PNG / WebP (`page.jsx:156-163`) et « Quality » 10-100 (`page.jsx:164-167`) non dits | Citer « Save as » et Quality, et les autres formats d'entrée |
| image-resizer | about | « keeps the image in its original format » | FORMAT | Par défaut seulement (`page.jsx:34,158`) ; conversion possible vers JPG/PNG/WebP | idem |
| image-resizer | about + étape 2 | « by exact pixels or by percentage » / « or 'By percentage' » | TROMPEUR | Pourcentage = 3 boutons « 25% / 50% / 75% smaller » seulement (`page.jsx:16,148-150`), pas de valeur libre ni d'agrandissement en % | « réduire de 25, 50 ou 75 % » |
| image-resizer | FAQ 2 | « On Safari, which cannot write WebP, a WebP is saved as PNG and the page says so. » | FAUX | `page.jsx:105,111` → `app/lib/imageOutput.js:120-141` : WebP encodé par libwebp en WebAssembly sur Safari, le WebP reste WebP ; aucune note de ce genre (`page.jsx:109,114`) | « Un WebP reste un WebP, Safari compris » |
| image-resizer | FAQ 3 | « Yes, if you untick 'Do not enlarge'. » | LIBELLÉ | Libellé réel : « Do not enlarge if the image is smaller » (`page.jsx:153`) | Citer le libellé exact |
| image-resizer | astuce 2 | « Social media: 1080 px wide suits most feeds. » | INVÉRIFIABLE | Aucune source dans le dépôt | Supprimer ou sourcer |
| image-resizer | astuce 3 | « Use 'By percentage' to halve a photo in one click. » | TROMPEUR | Il faut « By percentage » puis « Resize » (50 % est présélectionné, `page.jsx:30`) : deux clics | « 'By percentage' → '50% smaller' → Resize » |

#### image-rotate

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| image-rotate | about | « turns your image by a preset (90°, 180°, 270°) or custom angle… » (1 phrase) | MINCE | Non dits : sens horaire (`page.jsx:52`), saisie au 0,5° (`page.jsx:53`), fond transparent ou coloré (`page.jsx:54-57`), quarts de tour exacts, autres angles rééchantillonnés et toile agrandie (`app/lib/imageOutput.js:197-219`) | Ajouter ces faits |
| image-rotate | étape 1 | « Click the upload area and select an image from your device. » | GÉNÉRIQUE | 14 pages | Étape propre |
| image-rotate | étape 4 | « save your rotated PNG image » | FAUX | `page.jsx:35` : format conservé pour 90/180/270° et pour fond coloré ; PNG seulement pour un angle libre avec fond transparent | Dire la règle |
| image-rotate | FAQ 1 | « Is Image Rotate really free to use? Yes, it's completely free with no registration required. » | GÉNÉRIQUE | 12 pages | Supprimer |
| image-rotate | FAQ 2 | « A rotation by 90, 180 or 270 degrees keeps your image's format (JPG stays JPG). » | FORMAT | GIF, BMP, AVIF… sortent toujours en PNG (`app/lib/imageOutput.js:124`) ; animé → 1re image (`page.jsx:61`) | Préciser |
| image-rotate | FAQ 3 | « No, the pixels are redrawn at the same resolution with no compression applied. » | FAUX | JPG/WebP ré-encodés qualité 92 (`app/lib/imageOutput.js:122-138`) ; angle libre : rééchantillonnage bilinéaire sur une toile plus grande (`app/lib/imageOutput.js:197-198,211-219`) | « Quarts de tour : pixels déplacés sans rééchantillonnage ; JPG réenregistré en qualité 92 ; autres angles rééchantillonnés » |
| image-rotate | FAQ 4 | « Can I rotate multiple images at once? No… » | GÉNÉRIQUE | Même Q/R sur 3 pages | Supprimer |
| image-rotate | astuce 1 | « Preview the rotated result before downloading to confirm the angle is what you wanted. » | GÉNÉRIQUE | — | Supprimer |
| image-rotate | astuce 3 | « Keep your original file as a backup before rotating, in case you want to start over. » | TROMPEUR | L'original n'est jamais modifié ; le résultat est un nouveau fichier « -rotated » (`page.jsx:35`, `app/lib/download.js:108-111`) | Supprimer |

#### round-corners

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| round-corners | étape 1 | « Click the upload area and select an image from your device. » | GÉNÉRIQUE | 14 pages | Étape propre |
| round-corners | étape 2 | « Adjust the corner radius slider (1–50%) » | TROMPEUR | Rayon = % de la MOITIÉ du petit côté (`page.jsx:41`) : 50 % = quart du petit côté, jamais un cercle (contrairement au CSS) | « 50 % = rayon égal au quart du petit côté » |
| round-corners | étape 4 | « save your rounded PNG image » | TROMPEUR | Un JPG avec « Corners in » une couleur reste JPG (`page.jsx:52-53`) | « PNG, ou JPG si coins colorés sur un JPG » |
| round-corners | FAQ 1 | « It accepts common formats your browser can open, such as JPG, PNG, and WebP. » | FORMAT | `page.jsx:53` : tout sauf JPG+couleur sort en PNG — un WebP devient PNG même avec coins colorés (non dit) ; animé → 1re image (`page.jsx:76`) | Préciser |
| round-corners | FAQ 1 | « a JPG stays a JPG (a much lighter file) » | INVÉRIFIABLE | Aucune mesure dans `docs/audit/` | « en général plus léger » ou mesurer |
| round-corners | FAQ 2 | « There's no fixed size limit… » | FAUX | `app/lib/imageOutput.js:77-81` | Dire 268 Mpx |
| round-corners | FAQ 4 | « Do I need to create an account to use Round Corners? No… » | GÉNÉRIQUE | — | Supprimer |
| round-corners | astuce 1 | « Use a radius around 10–15% for subtle rounding on profile pictures and thumbnails. » | GÉNÉRIQUE | — | Remplacer par la définition du % |
| round-corners | astuce 2 | « Try higher radius values (20–30%+) for a softer, more contemporary look. » | GÉNÉRIQUE | — | Supprimer |
| round-corners | astuce 3 | « Preview the result before downloading… » | GÉNÉRIQUE | — | Supprimer |

#### sepia-filter

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| sepia-filter | about | « applies a warm, vintage brown tone … standard sepia color matrix, with an adjustable intensity slider » | MINCE | Deux phrases ; non dits : intensité 0-100 % (100 par défaut, 0 = inchangé, `page.jsx:15,54`), matrice de la fonction CSS sepia() (`page.jsx:34-36`), format conservé, transparence conservée | Ajouter ces faits |
| sepia-filter | étape 1 | « Click the upload area and select an image from your device. » | GÉNÉRIQUE | 14 pages | Étape propre |
| sepia-filter | étape 4 | « save your sepia-toned PNG image » | FAUX | `page.jsx:40` → `app/lib/imageOutput.js:122-126` | « dans le format de l'original » |
| sepia-filter | FAQ 1 | « Is Sepia Filter completely free to use? Yes, it's 100% free with no subscriptions required. » | GÉNÉRIQUE | — | Supprimer |
| sepia-filter | FAQ 2 | « It accepts common formats your browser can open, such as JPG, PNG, and WebP. » | FORMAT | `page.jsx:52` accept `image/*` ; autres → PNG, animé → 1re image (`page.jsx:56`) | Voir add-border FAQ 1 |
| sepia-filter | FAQ 3 | « No, your images are processed directly in your browser and are never uploaded to a server. » | GÉNÉRIQUE | Phrase répétée | Fusionner |
| sepia-filter | FAQ 4 | « Can I upload an image by pasting a URL? No, only file upload from your device is supported… » | GÉNÉRIQUE | Q/R passe-partout | Supprimer |
| sepia-filter | astuce 1 | « Use high-resolution source images since the sepia effect preserves the original resolution. » | GÉNÉRIQUE | — | Supprimer |
| sepia-filter | astuce 2 | « Try different intensity levels to find the balance… » | GÉNÉRIQUE | — | Supprimer |
| sepia-filter | astuce 3 | « Sepia works especially well on portraits and landscapes for a nostalgic look. » | GÉNÉRIQUE | — | Supprimer |
| sepia-filter | astuce 4 | « Download a few versions at different intensities if you want to compare before picking a favorite. » | GÉNÉRIQUE | — | Supprimer |

#### Affirmations vérifiées et justes (non reprises dans les tableaux, pour mémoire)
- « Nothing is uploaded » / « never uploaded » : vrai pour les 19 outils (aucun envoi du fichier ; seul le TEXTE d'un message
  d'erreur part vers `/api/report-error`, `app/lib/useToolError.js:38-43`).
- Image Blur « 1 to 20 px », « full resolution », « even 48 MP iPhone photos » : `image-blur/page.jsx:77` ; mesures 12/24/48 Mpx
  dans `docs/audit/RAPPORT-p17-30-09.md:141,206-208` et `docs/audit/RAPPORT-p16-photos-iphone-30-09.md:95`.
- Duplicate Image Finder seuils 3/6/10 bits, SHA-256, dHash : `duplicate-image-finder/page.jsx:23,86`, `app/lib/imageSimilarity.js`.
- Image Metadata « without re-encoding », ICC et orientation gardés, JPG/PNG/WebP seulement : `app/lib/stripMetadata.js:1-5,119-125`.
- Image Comparison seuil 16/255, image 2 mise à l'échelle de l'image 1, téléchargement PNG : `image-comparison/page.jsx:45-54,84-86`.
- Image Cropper ratios 1:1, 4:3, 3:2, 16:9, 9:16, 4:5, 2:1 et cadre sur l'aperçu : `image-cropper/page.jsx:21,93`.
- Image Editor « Save image » puis « Download », « Save / Share » sur iPhone/iPad : `image-editor/page.tsx:325,328`, `app/components/FileDownload.jsx:207-218`.

#### Synthèse du lot image-2 (19 outils lus)
| Type | Nombre |
|---|---|
| FAUX | 32 |
| INVÉRIFIABLE | 7 |
| TROMPEUR | 24 |
| GÉNÉRIQUE | 73 |
| MINCE | 10 |
| LIBELLÉ | 1 |
| FORMAT | 17 |
| **Total** | **164** |


---

### Lot audio

Source du texte : `docs/audit/p36/contenu-avant.json` (HTML servi). Code lu : chaque `page.jsx` + `layout.tsx`, `app/lib/audioFormats.js`, `app/lib/opusService.js`, `app/lib/mediaJob.js`, `app/lib/mediaSupport.js`, `app/lib/audioMerge.js`, `app/lib/decodeAudio.js`, `app/lib/audioDuration.js`, `app/lib/mediaProbe.js`, `app/lib/subtitleTime.js`, `app/lib/officeUpload.js`, `app/components/{MediaInfo,MetadataStripper,FileDownload,PlayablePreview,TranscriptExports,IosOriginalNote,UploadPrompt,FileDropBridge}.jsx`, `app/api/media/ticket/route.js`, `lib/media/ticket.js`, `app/api/ai-transcribe/route.ts`, `lib/quota/{guard,limits,hourDayRateLimit}.js`, `services/media-processing/app/{jobs,ffmpeg_ops}.py`.

Abréviations : `P` = `app/tools/<outil>/page.jsx`, `L` = `app/tools/<outil>/layout.tsx`. « Service » = notre service média (Railway) utilisé pour la sortie Opus, « Make an MP4 » et les fichiers > 4 Mio d'Audio to Text ; il n'est actif que si `NEXT_PUBLIC_MEDIA_SERVICE_URL` est défini au build (`app/lib/mediaJob.js:16-17`). Limites du service : taille `MEDIA_TICKET_MAX_BYTES`, nombre de travaux par réseau `MEDIA_JOBS_PER_HOUR_PER_IP` / `MEDIA_JOBS_PER_DAY_PER_IP` (`lib/media/ticket.js:48-50`, `app/api/media/ticket/route.js:27-42`) — valeurs non lues.

Constats transverses (valent pour tout le lot) :
- Aucune page ne demande d'inscription ; aucune route utilisée ne lit un compte (`app/api/media/ticket/route.js:13-50`, `lib/quota/guard.js:15-37`).
- Le moteur ffmpeg.wasm (@ffmpeg/core 0.12.9) est téléchargé depuis unpkg.com (`node_modules/@ffmpeg/ffmpeg/dist/esm/const.js:3-4`) : 32,2 Mo décompressé, ~10,2 Mo sur le réseau (`docs/audit/RAPPORT-formats-navigateurs.md:59`). Aucun fichier ne part avec lui.
- `.ac3` n'est PAS dans la liste d'extensions `AUDIO_ACCEPT` (`app/lib/mediaSupport.js:257-258`) : un .ac3 n'est sélectionnable que si le système lui donne un type `audio/*`.
- En cas d'échec, un rapport d'erreur (extension, tranche de taille, message nettoyé, jamais le fichier) part vers `/api/report-error` (`app/lib/reportError.js:7-12`).
- Le HTML servi (contenu-avant.json réextrait) d'Audio to Text affiche « 25 MB » : le service média est donc actif dans le build servi (`app/lib/officeUpload.js:85-86` choisit 25 Mio seulement si `NEXT_PUBLIC_MEDIA_SERVICE_URL` est défini). Les phrases « Opus encodé sur notre serveur » sont donc cohérentes avec la production. Toute valeur rendue par `audioMaxLabel()` dépend de cette variable : un rédacteur ne doit pas l'écrire en dur sans cette condition.

#### audio-tools/audio-booster

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| audio-booster | méta | « using a gain multiplier (1x-5x) » | FAUX | curseur min 0.25, max 5, pas 0.25 (P:95) ; option « Normalize instead » (P:98) | « from 0.25x (quieter) to 5x, or normalized to -16 LUFS » |
| audio-booster | étape 2 | « using the slider (1x–5x) » | FAUX | `min={0.25} max={5}` (P:95) | « 0.25x to 5x » ; mentionner la case « Normalize instead » |
| audio-booster | étape 3 | « pick the same format as your source to avoid an unnecessary quality-losing re-encode » | FAUX | le filtre de volume impose toujours un réencodage (P:56, P:63) : MP3→MP3 perd quand même | « pick a lossless output (WAV, FLAC, AIFF, ALAC) to add no further loss » |
| audio-booster | about | « or normalizes its loudness to -16 LUFS …, followed by a limiter … (it can be turned off) » | TROMPEUR | limiteur seulement si gain > 1 ET normalisation décochée (P:56) ; la normalisation utilise loudnorm TP -1.5 dB, sans limiteur | séparer : limiteur pour un gain > 1 ; normalisation = loudnorm -16 LUFS, crête vraie -1.5 dB |
| audio-booster | FAQ 2 | « MP3, WAV, AAC, FLAC, OGG, M4A, Opus, WMA, AIFF, ALAC, or AC3 » | FORMAT | 18 sorties (P:103, `app/lib/audioFormats.js:22-48`) : M4R, M4B, MP2, WV, CAF, AU, MKA non dits | lister les 18 |
| audio-booster | FAQ 3 | « Yes, it's completely free with no signup required. » | TROMPEUR | sortie Opus via le service : limite par réseau heure + jour et taille max (`app/api/media/ticket/route.js:27-42`) ; phrase identique sur 92 pages (`unicite-avant.json`) | gratuit, sans inscription ; Opus : nombre de conversions par heure et par jour limité par connexion |
| audio-booster | FAQ 4 | « For every format except Opus, no … deleted as soon as you have downloaded the result. » | GÉNÉRIQUE | mot pour mot sur Booster, Compressor, Splitter (`unicite-avant.json`) | réécrire pour l'outil (ce qui part = l'audio déjà amplifié en FLAC, P:57-61) |
| audio-booster | étape 1 | « Click the upload area and select an audio file. » | GÉNÉRIQUE | même phrase sur 7 pages ; le dépôt marche aussi (`app/components/FileDropBridge.jsx:4-13`) | étape propre à l'outil |
| audio-booster | astuce 3 | « The first boost after loading the page can take longer since your browser needs to download the ffmpeg.wasm engine. » | GÉNÉRIQUE | même astuce sur 6 pages du lot | dire le poids réel (~10 Mo réseau, rapport cité) une fois, ou supprimer |
| audio-booster | (toute la page) | aucun format d'entrée cité | FORMAT | `accept` = AUDIO_ACCEPT (P:92, `mediaSupport.js:257-258`) | lister MP3, WAV, M4A, AAC, FLAC, OGG/OGA, Opus, WMA, AIFF/AIF, AMR, MKA, WEBA, CAF |

#### audio-tools/audio-compressor

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| audio-compressor | about | « (MP3, AAC, M4A, OGG, Opus, WMA, AC3) » | FORMAT | 9 sorties : + M4B, MP2 (P:116, `audioFormats.js:53-55`) | lister les 9 |
| audio-compressor | FAQ 2 | « Your choice among MP3, AAC, M4A, OGG, Opus, WMA, and AC3 » | FORMAT | idem | idem |
| audio-compressor | FAQ 3 | « No hard limit is enforced by the tool — very large files are limited only by your browser's available memory. » | TROMPEUR | Opus : FLAC envoyé limité à MEDIA_TICKET_MAX_BYTES + limite heure/jour par réseau (`lib/media/ticket.js:60-61`, `route.js:35-42`) | ajouter l'exception Opus |
| audio-compressor | interface | « {originalSize} MB » / « {newSize} MB » / « your {originalSize} MB » | FAUX | `formatBytes()` rend déjà l'unité (`app/lib/formatBytes.js:9-12`) puis la page ajoute « MB » (P:126-127, P:134) → « 1.2 MB MB », « 500 KB MB » | retirer le « MB » ajouté (correction de code, hors texte SEO) |
| audio-compressor | (absent) | — | MINCE | débit plafonné au débit de la source (P:57-61, message P:130), cas « Larger by » (P:128-136), options Mono / Sample rate (P:106-111) absents du texte et des étapes | dire : jamais au-dessus du débit d'origine ; Mono et fréquence ; ce qui s'affiche si le fichier grossit |
| audio-compressor | FAQ 4 | « For every format except Opus, no … » | GÉNÉRIQUE | identique sur 3 pages | réécrire (Opus : débit choisi envoyé au service, P:63-65) |
| audio-compressor | étape 1 | « Click the upload area and select an audio file. » | GÉNÉRIQUE | 7 pages | idem |
| audio-compressor | astuce 2 | « Lower bitrates noticeably reduce quality for complex music — compare the audio preview before committing. » | GÉNÉRIQUE | conseil copiable | remplacer par un fait de l'outil |
| audio-compressor | astuce 3 | « The first compression after loading the page takes longer… » | GÉNÉRIQUE | 6 pages | idem Booster |
| audio-compressor | (toute la page) | aucun format d'entrée cité | FORMAT | AUDIO_ACCEPT (P:97) | lister |

#### audio-tools/audio-converter

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| audio-converter | méta | « between MP3, WAV, AAC, FLAC, OGG, M4A, Opus, WMA, AIFF, ALAC, and AC3 » | FORMAT | 18 cibles (P:125, `audioFormats.js:22-48`) : M4R, M4B, MP2, WV, CAF, AU, MKA absents | « 18 formats, dont … » |
| audio-converter | about | même liste de 11 | FORMAT | idem | idem |
| audio-converter | FAQ 2 | « MP3, WAV, AAC, FLAC, OGG, M4A, Opus, WMA, AIFF, ALAC, and AC3 as output targets » | FORMAT | idem | idem |
| audio-converter | FAQ 2 | « any format ffmpeg can decode as input (which covers the vast majority of real-world audio files, including AMR) » | INVÉRIFIABLE | le sélecteur ne propose que AUDIO_ACCEPT (P:121) ; « vast majority » sans mesure | lister les extensions acceptées |
| audio-converter | FAQ 1 | « which allows a set number of conversions per connection each day » | TROMPEUR | limite par heure ET par jour (`route.js:35-42`) + taille max MEDIA_TICKET_MAX_BYTES ; c'est le fichier ORIGINAL entier qui part (P:53-58) | « par heure et par jour » + taille max |
| audio-converter | astuce 1 | « the ffmpeg.wasm engine (roughly 25–30MB) » | FAUX | 32,2 Mo décompressé, ~10,2 Mo transférés (`docs/audit/RAPPORT-formats-navigateurs.md:59`) | « about 10 MB to download » |
| audio-converter | astuce 3 | « For MP3, AAC, M4A, OGG and WMA, pick the quality » | TROMPEUR | Quality aussi pour M4R, M4B, AC3, MP2 (`audioFormats.js:66`) ; AC3/MP2 jamais sous 192 kbps (`audioFormats.js:86`) | liste complète + plancher 192 pour AC3/MP2 |
| audio-converter | astuce 3 | « 192 kbps (the default) is transparent for most listening » | INVÉRIFIABLE | aucun rapport de mesure dans `docs/audit/` | supprimer ou citer une mesure |
| audio-converter | interface | option « Standard — 128 kbps » pour AC3 / MP2 | TROMPEUR | encodé à 192 kbps (`audioFormats.js:86`) sans le dire | dire le plancher à l'écran (code) |
| audio-converter | étapes | 4 étapes sans Quality, Sample rate, Channels, Cancel | MINCE | contrôles P:132-152 | ajouter ces réglages |
| audio-converter | étape 1 | « Click the upload area and select an audio file. » | GÉNÉRIQUE | 7 pages | idem |
| audio-converter | astuce 5 | « Opus is a strong choice for small file size at good quality if your target player supports it. » | GÉNÉRIQUE | conseil copiable | fait propre (Opus encodé par libopus à 128 kbit/s, `ffmpeg_ops.py:20,217`) |

#### audio-tools/audio-equalizer

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| audio-equalizer | astuce 1 | « extreme boosts near ±12dB can introduce distortion audible in the exported file too » | FAUX | à l'export, si la crête dépasse la pleine échelle, tout le fichier est baissé et la page le dit (P:137-152) ; seule l'écoute en direct peut saturer (P:65) | « the export is lowered automatically to avoid clipping; the live preview is not » |
| audio-equalizer | FAQ 4 | « and also WMA, AC3 or AMR » | FORMAT | `.ac3` absent de AUDIO_ACCEPT (`mediaSupport.js:257-258`) | ajouter .ac3 à la liste (code) ou ne pas citer AC3 |
| audio-equalizer | interface | nom accessible des 3 curseurs « : dB » | LIBELLÉ | `aria-label=": dB"` (P:175) | « Bass », « Mid », « Treble » (code) |
| audio-equalizer | about | (texte sans fréquences ni format de sortie détaillé) | MINCE | plateau grave 200 Hz, cloche 1 kHz, plateau aigu 3 kHz (P:55-63), ±12 dB (P:175), WAV 16 bits à la fréquence du contexte audio (P:78-112, P:120), baisse auto anti-saturation (P:140-152) | donner ces faits |
| audio-equalizer | astuce 2 | « Boost the bass shelf for warmth, cut the mid range to reduce muddiness, and boost treble for clarity and presence. » | GÉNÉRIQUE | conseil copiable | remplacer |
| audio-equalizer | étape 1 | « Click the upload area and select an audio file. » | GÉNÉRIQUE | 7 pages | idem |

#### audio-tools/audio-merger

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| audio-merger | about | « the length of the result is exactly the sum of your files » | TROMPEUR | vrai en sans perte ; formats compressés : fin allongée d'un bloc (M4A/M4R/AC3 +4,7 à +16 ms, AAC brut +28 à +39 ms, `docs/audit/RAPPORT-audio-merger-format-sortie.md:68`) ; WMA complété de silence (`app/lib/audioMerge.js:84-86`) | « exact in lossless formats; compressed formats may end a few ms longer » |
| audio-merger | FAQ 7 | « No limit is set by the tool; your browser's available memory is the limit » | TROMPEUR | Opus : FLAC joint limité à MEDIA_TICKET_MAX_BYTES + limite heure/jour (P:218-220, `route.js:35-42`) | ajouter l'exception Opus |
| audio-merger | FAQ 1 | « If all your files share a compressed format (all MP3, all Opus…), that format is kept. » | TROMPEUR | tous en AAC brut → M4A (`audioMerge.js:105`) | « (raw .aac becomes M4A, same codec) » |
| audio-merger | astuce 2 | « Opus is smaller at the same quality » | INVÉRIFIABLE | aucune mesure MP3 contre Opus dans `docs/audit/` (seule mesure Opus : libopus contre encodeur natif, `app/lib/opusService.js:127-129`) | supprimer ou mesurer |
| audio-merger | astuce 4 | « The first merge after loading the page takes longer… » | GÉNÉRIQUE | 6 pages | idem |
| audio-merger | (toute la page) | aucun format d'entrée cité | FORMAT | AUDIO_ACCEPT, plusieurs fichiers (P:293) | lister |

#### audio-tools/audio-metadata

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| audio-metadata | titre | « Audio Metadata — Instantly Reads and Displays an Audio » | INVÉRIFIABLE | « Instantly » sans mesure ; titre tronqué (L:5) ; le moteur ~10 Mo se charge d'abord (`MediaInfo.jsx:26`) | « Audio Metadata — Codec, Bitrate, Tags & Cover Art Viewer » (sans « instantly ») |
| audio-metadata | méta | « nothing uploaded, any file size » | TROMPEUR | rapport : pas de limite (WORKERFS, `mediaProbe.js:14-15`) ; « Remove the metadata » : 2 Gio max (`MetadataStripper.jsx:79,96`) | « any size for the report; up to 2 GB to remove metadata » |
| audio-metadata | about | « so its size does not matter » | TROMPEUR | idem | idem |
| audio-metadata | FAQ 4 | « Is there a size limit? No » | TROMPEUR | idem | idem |
| audio-metadata | astuce 4 | « An empty “Tags” section means the file carries no embedded tags. » | FAUX | la section Tags n'est affichée que s'il y a des tags (`MediaInfo.jsx:45`) | « No “Tags” section means … » |
| audio-metadata | étape 1 | « (MP3, WAV, FLAC, M4A, OGG, Opus, WMA, AIFF, AC3 and more) » | FORMAT | .ac3 absent de AUDIO_ACCEPT (P:38, `mediaSupport.js:257-258`) ; AMR, MKA, CAF, WEBA acceptés et non dits | liste exacte |
| audio-metadata | FAQ 3 | « Everything ffmpeg can read » | TROMPEUR | le sélecteur se limite à AUDIO_ACCEPT (P:38) | liste des extensions |

#### audio-tools/audio-splitter

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| audio-splitter | FAQ 2 | « MP3, WAV, AAC, FLAC, OGG, M4A, Opus, WMA, AIFF, ALAC, or AC3 » | FORMAT | 18 sorties (P:207) | lister les 18 |
| audio-splitter | FAQ 2 | « Your source's own format by default when it can be written here » | TROMPEUR | choix par EXTENSION (P:69-70) : .aif/.oga/.weba/.amr → MP3 ; un ALAC .m4a → M4A (AAC, avec perte) | dire la règle réelle |
| audio-splitter | astuce 2 | « Pick the same format as your source if you want to avoid a lossy re-encode. » | FAUX | chaque partie passe par `atrim` puis l'encodeur (P:132, P:142) : toujours réencodée | « pick a lossless format (WAV, FLAC…) to add no loss » |
| audio-splitter | FAQ 3 | « No hard limit is enforced by the tool » | TROMPEUR | Opus : un travail du service PAR PARTIE (P:136-139), chacun compté dans la limite heure/jour par réseau ; taille par partie ≤ MEDIA_TICKET_MAX_BYTES | ajouter l'exception Opus |
| audio-splitter | FAQ 4 | « For every format except Opus, no … » | GÉNÉRIQUE | identique sur 3 pages | réécrire (chaque partie envoyée séparément) |
| audio-splitter | étape 1 | « Click the upload area and select an audio file. » | GÉNÉRIQUE | 7 pages | idem |
| audio-splitter | astuce 4 | « The first split after loading the page takes longer… » | GÉNÉRIQUE | 6 pages | idem |
| audio-splitter | (toute la page) | aucun format d'entrée cité | FORMAT | AUDIO_ACCEPT (P:172) | lister |

#### audio-tools/audio-to-text

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| audio-to-text | titre | « Audio to Text — Offer Two Ways Online Free » | MINCE | titre cassé, ne dit pas la tâche (L:5) | « Audio to Text — Transcribe a Recording or Live Dictation » |
| audio-to-text | FAQ 1 | « sent through our server to OpenAI's transcription API to generate the text, then deleted » | INVÉRIFIABLE | rien dans le code ne supprime chez OpenAI (`route.ts:50-56`) ; chez nous : pas stocké (direct) ou supprimé du service après lecture (`lib/media/staged.js:109-113`) | « we keep no copy; OpenAI's own retention rules apply » |
| audio-to-text | about | « Google in Chrome, Microsoft in Edge, Apple in Safari » | INVÉRIFIABLE | comportement des navigateurs, absent du code (P:32-50) | « your browser's own speech service (not us) » |
| audio-to-text | FAQ 1 | même liste Google / Microsoft / Apple | INVÉRIFIABLE | idem | idem |
| audio-to-text | FAQ 3 | « Common formats like MP3, WAV, and M4A. » | MINCE | `accept="audio/*"` sans liste (P:163) ; OpenAI décide | dire « any audio file; OpenAI rejects formats it cannot read » + l'erreur affichée |
| audio-to-text | étape 4 | « Copy the transcript or download it as a .txt file. » | FORMAT | mode fichier : .txt, .srt et .vtt + ZIP (`TranscriptExports.jsx:13-15`) | citer SRT et VTT |
| audio-to-text | FAQ 5 | « it has an hourly and daily limit per connection » | TROMPEUR | plafond de dépense mensuel du site aussi (message « reached its usage limit for the month », `lib/quota/guard.js:28-36`) | ajouter le plafond mensuel |
| audio-to-text | FAQ 2 | « other browsers may not support it » | MINCE | sans SpeechRecognition (Firefox) : « Speech recognition not supported. Try Chrome. » (P:33-35) ; langue non réglée (P:38-40) | dire lesquels et le message |
| audio-to-text | astuce 1 | « speak clearly at a steady pace and keep background noise low » | GÉNÉRIQUE | conseil copiable | remplacer |
| audio-to-text | astuce 3 | « Always proofread AI-generated transcripts… » | GÉNÉRIQUE | conseil copiable | remplacer |

#### audio-tools/audio-trimmer

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| audio-trimmer | titre | « Cut a Section Out » | TROMPEUR | l'outil GARDE la partie entre début et fin (P:133-136) ; il ne peut pas retirer un passage du milieu | « Keep the Part You Want » / « Trim Start and End » |
| audio-trimmer | about | « cuts a section out of an audio file » | TROMPEUR | idem | idem |
| audio-trimmer | méta | « using ffmpeg.wasm's fast stream-copy trimming » | TROMPEUR | copie de flux seulement sans fondu et hors WAV/AIFF PCM et FLAC 16 bits ; sinon `atrim` + réencodage (P:117-136) ; « fast » sans mesure | « copied without re-encoding when there is no fade » |
| audio-trimmer | FAQ 4 | « it stays in the same format (MP3, WAV, FLAC, OGG, M4A, AAC, AIFF) at a high setting » | TROMPEUR | un .m4a ALAC avec fondu devient AAC 192k (P:21, P:131) | préciser M4A = AAC |
| audio-trimmer | astuce 3 | « Without fades nothing is re-encoded » | TROMPEUR | FLAC 16 bits réencodé (sans perte) et PCM réécrit, au filtre (P:118-128, P:134-135) | « without fades the quality is the source's » |
| audio-trimmer | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | 92 pages | fait propre (tout dans le navigateur, aucune limite) |
| audio-trimmer | FAQ 2 | « Any format ffmpeg.wasm can decode for input. » | MINCE | sélecteur = AUDIO_ACCEPT (P:162) | lister les extensions |
| audio-trimmer | astuce 4 | « The first trim after loading the page takes longer… » | GÉNÉRIQUE | 6 pages | idem |

#### audio-tools/audio-waveform

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| audio-waveform | astuce 2 | « The PNG export captures exactly what's on screen » | TROMPEUR | même portion, mais redessinée à la taille choisie (défaut 1920×300) et pas l'aperçu 800×200 (P:21, P:147, P:168-169) | « the PNG shows the part on screen, drawn at the size you chose » |
| audio-waveform | FAQ 4 | « (WMA, AC3, AMR…) » | FORMAT | .ac3 absent de AUDIO_ACCEPT (P:164) | idem Equalizer |
| audio-waveform | étape 1 | « Click the upload area and select an audio file. » | GÉNÉRIQUE | 7 pages | idem |
| audio-waveform | astuce 4 | « Very large audio files may take a moment to decode before the waveform appears. » | GÉNÉRIQUE | conseil copiable | remplacer (zoom jusqu'à 200x, P:12) |

#### audio-tools/voice-recorder

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| voice-recorder | about | « WebM in Chrome, Edge and Firefox, MP4 in Safari » | FAUX | `audio/mp4` essayé en premier (P:56) : Chrome/Edge qui l'acceptent enregistrent de l'AAC ; extension `.m4a`, pas `.mp4` (`mediaSupport.js:34,219-225`) ; WebM seulement là où MP4 n'est pas possible (Firefox) | « M4A (AAC) where the browser can record it (Safari, recent Chrome and Edge), WebM otherwise (Firefox) » |
| voice-recorder | étape 4 | « (WebM, or MP4 in Safari) » | FAUX | idem | idem |
| voice-recorder | FAQ 1 | « WebM in Chrome, Edge and Firefox, MP4 in Safari » | FAUX | idem | idem |
| voice-recorder | FAQ 5 | « Recording and the WAV and MP3 exports all happen entirely on your device via the browser's MediaRecorder and Web Audio APIs » | TROMPEUR | le MP3 est fait par ffmpeg.wasm (moteur téléchargé, P:31-36) | « MP3 by ffmpeg.wasm, in your browser » |
| voice-recorder | étapes | 4 étapes sans Pause / Resume ni « Export as MP3 » | MINCE | P:165-168, P:180-184 | ajouter |
| voice-recorder | FAQ 3 | « Yes, it's completely free with no signup and no limit on how many recordings you can make. » | GÉNÉRIQUE | formule de gratuité copiable | fait propre (pas de durée maximale dans le code, P:58-59) |
| voice-recorder | FAQ 4 | « Do I need to install anything? No, it works directly in your browser… » | GÉNÉRIQUE | exemple cité par les consignes | supprimer |
| voice-recorder | astuce 1 | « keep the microphone 6–12 inches from your mouth » | GÉNÉRIQUE | conseil copiable | remplacer |
| voice-recorder | astuce 4 | « you'll need to reset the site's microphone permission in your browser settings » | GÉNÉRIQUE | déjà dit par le message d'erreur (P:78) | remplacer |

#### video-tools/media-player

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| media-player | about | « plays a single audio or video file directly in your browser using native HTML5 playback » | MINCE | ne dit rien de Speed 0.5×–2×, Loop, Picture in picture, Save this frame, Subtitles (.srt, .vtt) (P:88-96) ni des formats acceptés (P:66) | décrire ces fonctions |
| media-player | étape 2 | « The file loads instantly » | INVÉRIFIABLE | aucune mesure | « The file opens in your browser's player » |
| media-player | étape 3 | « Use the built-in play, pause, volume, and seek controls » | GÉNÉRIQUE | commandes natives, copiable | étapes Speed / Loop / sous-titres / image |
| media-player | FAQ 2 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | 92 pages | supprimer ou fait propre |
| media-player | astuce 1 | « Right-click the video player for extra native browser options like Picture-in-Picture » | GÉNÉRIQUE | la page a son propre bouton « Picture in picture » (P:93) | renvoyer au bouton |
| media-player | astuce 2 | « Use the spacebar to play/pause and arrow keys to seek » | GÉNÉRIQUE | conseil navigateur | remplacer |
| media-player | astuce 3 | « click the player's fullscreen icon » | GÉNÉRIQUE | conseil navigateur | remplacer |

#### video-tools/screen-recorder

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| screen-recorder | about | « Recordings are saved as MP4 (H.264 + AAC) in Chrome, Edge and Safari » | TROMPEUR | MP4 seulement si `MediaRecorder.isTypeSupported` l'accepte (commentaire : Chrome et Edge 126+) ; sinon WebM + bouton « Make an MP4 » (P:10-18, P:166) | « Chrome and Edge 126 or later, Safari » |
| screen-recorder | FAQ 1 | « MP4 (H.264 video, AAC sound) in Chrome, Edge and Safari » | TROMPEUR | idem | idem |
| screen-recorder | FAQ 2 | « Yes, it's completely free with no signup required. » | TROMPEUR | « Make an MP4 » : limite par réseau heure/jour + taille max (`route.js:27-42`) ; phrase sur 92 pages | gratuit ; conversion MP4 limitée par connexion |
| screen-recorder | étapes | sans Pause / Resume ni « Add my microphone » | MINCE | P:147-158 | ajouter |
| screen-recorder | interface | « Make an MP4 (plays on iPhone and everywhere) » | INVÉRIFIABLE | « everywhere » sans preuve (P:166) | « plays on iPhone, Mac and Windows » ou sans « everywhere » (code) |
| screen-recorder | astuce 2 | « Close unnecessary tabs and apps before recording for smoother performance. » | GÉNÉRIQUE | conseil copiable | remplacer |
| screen-recorder | astuce 3 | « convert the downloaded file afterward with a dedicated video converter » | GÉNÉRIQUE | la page offre déjà « Make an MP4 » (P:166) | lien vers Video Converter du site ou supprimer |

#### video-tools/subtitle-generator

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| subtitle-generator | astuce 4 | « use a dedicated transcription tool first, then paste the timed results in here to fine-tune » | FAUX | aucun collage ni import : saisie ligne par ligne (P:39-54) ; Audio to Text / Audio Transcriber donnent déjà SRT et VTT (`TranscriptExports.jsx:13-15`) | « Audio to Text gives SRT/VTT directly » |
| subtitle-generator | FAQ 3 | « HH:MM:SS, MM:SS or seconds » | TROMPEUR | secondes seules ≤ 59 (`app/lib/subtitleTime.js:9,14`) : « 75 » refusé | « seconds up to 59 » |
| subtitle-generator | étape 1 | « Click "Add Subtitle" to create a new subtitle row. » | TROMPEUR | une ligne existe déjà à l'ouverture (P:10) | « Fill in the first row, then Add Subtitle for more » |
| subtitle-generator | (absent) | — | MINCE | champ texte sur une seule ligne (P:49) : pas de sous-titre sur deux lignes ; tri par heure (`subtitleTime.js:38`) | le dire |
| subtitle-generator | FAQ 4 | « you can enter subtitles in any language your keyboard supports » | GÉNÉRIQUE | copiable | remplacer (fichiers UTF-8) |
| subtitle-generator | FAQ 5 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | 92 pages | supprimer |

#### video-tools/video-metadata

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| video-metadata | titre | « Read a Video File's Basic Properties » | TROMPEUR | rapport ffprobe complet par flux (`mediaProbe.js:40-68`) + suppression des métadonnées | « Codecs, Frame Rate, GPS & Tags Viewer » |
| video-metadata | about | « so its size does not matter » | TROMPEUR | « Remove the metadata » : 2 Gio max (`MetadataStripper.jsx:79,96`) | préciser |
| video-metadata | FAQ 4 | « Is there a size limit? No » | TROMPEUR | idem | idem |
| video-metadata | FAQ 2 | « Everything ffmpeg can read » | TROMPEUR | sélecteur = VIDEO_ACCEPT (P:38, `mediaSupport.js:237-238`) | lister |
| video-metadata | FAQ 5 | (rien sur l'iPhone) | MINCE | une vidéo prise dans Photos arrive déjà réencodée par iOS ; la page le dit seulement sur iPhone (`IosOriginalNote.jsx:4-7,20`) | dire : passer par Fichiers pour lire l'original |

#### Synthèse du lot « audio »

15 outils lus. Défauts : **FAUX 12** · **INVÉRIFIABLE 9** · **TROMPEUR 32** · **GÉNÉRIQUE 34** · **MINCE 12** · **LIBELLÉ 1** · **FORMAT 15** — total 115 lignes.


---

### Lot video

Outils lus : video-compressor, video-converter, video-filter, video-merger, video-resizer, video-rotator,
video-screenshot, video-to-audio, video-to-gif, video-trimmer, video-watermark. Pour chacun : `page.jsx`, `layout.tsx`,
fichiers voisins, composants importés (`MediaServiceTool.jsx`, `GifFromVideoTool.jsx`, `UploadPrompt.jsx`,
`IosOriginalNote.jsx`, `FileDownload.jsx`, `FileDropBridge.jsx`), `app/lib/mediaJob.js`, `app/lib/mediaSupport.js`,
`app/lib/audioFormats.js`, `app/lib/mp4Rotate.js`, `app/lib/isMobileDevice.js`, `app/lib/reportError.js`,
`app/api/media/ticket/route.js`, `lib/media/ticket.js`, `lib/quota/hourDayRateLimit.js`, et le service
`services/media-processing/app/{config,jobs,ffmpeg_ops,main}.py`.

#### Avertissement sur la source du texte (à lire avant de réécrire)

`docs/audit/p36/contenu-avant.json` **ne montre pas ce que sert la production pour video-compressor et
video-converter** : il contient le texte de `LegacyPage.jsx` (« MediaRecorder », « Always WebM », « WebM only »), c'est-à-dire
une version construite **sans** `NEXT_PUBLIC_MEDIA_SERVICE_URL` (`video-compressor/page.jsx:64`,
`video-converter/page.jsx:71`, `app/lib/mediaJob.js:16-17`). La production a la variable (`docs/audit/RAPPORT-video-deploiement.md:28,54`).
Vérifié le 05/10 par une lecture HTML de www (11 requêtes GET, rien d'autre) : les deux pages servent la version
« service » (0 occurrence de « MediaRecorder », texte de `page.jsx`), et les 9 autres pages servent exactement le texte de
`contenu-avant.json`. **L'audit ci-dessous porte donc sur le texte de `page.jsx` (seo) pour ces deux outils**, pas sur
`contenu-avant.json`. Les `LegacyPage.jsx` ne sont pas servies en production : leurs défauts ne sont pas listés.
*Mise à jour en fin d'audit :* `contenu-avant.json` a été régénéré pendant l'audit (modifié dans l'arbre de travail) et
montre désormais, pour ces deux pages, le texte de la version service — le même que celui audité ici.

Rappels communs (vérifiés, non répétés dans chaque ligne) :
- Outils qui passent par le service vidéo (`runMediaJob`) : compressor, converter, filter, resizer, to-gif, merger (clips
  différents), rotator (« Compatible everywhere », mode par défaut), trimmer (Precise cut long). Chaque tâche demande un
  billet à `/api/media/ticket`, soumis à une **limite par réseau, par heure et par jour** (`app/api/media/ticket/route.js:36-42`,
  variables `MEDIA_JOBS_PER_HOUR_PER_IP` / `MEDIA_JOBS_PER_DAY_PER_IP`, `lib/media/ticket.js:49-50`), messages
  « Too many conversions from your connection this hour… » / « Daily conversion limit reached for your connection… ».
  Aucune page du lot ne le dit.
- Aucune inscription : la route du billet ne lit aucune session (`app/api/media/ticket/route.js:13-50`).
- Le moteur ffmpeg.wasm des outils qui l'utilisent (merger, to-audio, trimmer, watermark) est chargé par `ffmpeg.load()` sans
  argument, donc depuis unpkg.com, `@ffmpeg/core@0.12.9` (`node_modules/@ffmpeg/ffmpeg/dist/esm/const.js:3-4`,
  `worker.js:10-11`) : 10,2 Mo sur le réseau, 32,2 Mo décompressé (`docs/audit/RAPPORT-formats-navigateurs.md:59`).

#### Tableau des défauts

| Outil | Endroit | Phrase exacte (courte citation) | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| video-compressor | titre + méta | « Compress Videos Online Free » / « Files up to 1 GB, deleted after download. » | TROMPEUR | Chaque compression consomme un billet limité par réseau, par heure et par jour (`app/api/media/ticket/route.js:36-42`) ; non dit nulle part sur la page. | Dire « gratuit, sans inscription, avec un nombre de vidéos limité par heure et par jour pour chaque connexion » (sans chiffre si la valeur n'est pas figée). |
| video-compressor | méta | « gives an MP4 that plays everywhere » | TROMPEUR | Vrai pour H.264 (défaut, `page.jsx:71`) ; H.265 et AV1 au choix (`page.jsx:21-25`, `ffmpeg_ops.py:541-548`) — la FAQ 2 de la même page dit qu'AV1 ne se lit que sur des navigateurs/appareils récents. | « un MP4 (H.264 par défaut, lisible partout ; H.265 ou AV1 au choix) ». |
| video-compressor | about | « with the encoders used by professional tools » | INVÉRIFIABLE | Encodeurs réels : libx264 preset faster/veryfast, libx265 veryfast, SVT-AV1 preset 8/9 (`ffmpeg_ops.py:99-103, 544-551`). « professional » sans preuve. | Nommer les encodeurs (x264, x265, SVT-AV1) sans qualificatif. |
| video-compressor | FAQ 4 | « Nothing about your file is logged. » | TROMPEUR | Le service journalise l'opération, une tranche de taille (<10MB…500MB+), le statut et la durée (`services/media-processing/app/jobs.py:85-87, 406`) ; en cas d'échec la page envoie à `/api/report-error` l'extension, une tranche de taille, un message nettoyé et le navigateur (`MediaServiceTool.jsx:109`, `app/lib/reportError.js:7-11, 32-46`). Ni le nom ni le contenu. | « Ni le nom ni le contenu de votre fichier ne sont enregistrés ; seuls une tranche de taille et, en cas d'erreur, l'extension sont notés. » |
| video-compressor | FAQ 6 | « The compressor is given a size ceiling taken from your own file. » | FAUX | La branche `compress` ne pose aucun plafond de débit (`ffmpeg_ops.py:532-552`) ; le plafond a été essayé puis rejeté par mesure (`ffmpeg_ops.py:32-38`, `docs/audit/RAPPORT-video-qualite.md` §3 décision 3). Le mécanisme réel : niveau demandé puis, si le résultat n'est pas au moins 2 % plus petit, le niveau suivant (`jobs.py:334-337, 378-384`, `ffmpeg_ops.py:41`). | Décrire l'échelle réelle : un essai au niveau choisi, un essai au niveau plus fort si besoin, sinon aucun fichier et le message « This video is already well compressed ». |
| video-compressor | FAQ 6 | « No. … it automatically tries one stronger setting » | TROMPEUR | Avec « Strong », il n'y a pas de niveau plus fort : un seul essai (`jobs.py:336-337`, tranche `[i:i+2]` de `COMPRESS_LEVELS`). Avec un CRF exact, encodé une fois et **livré même plus gros** (`jobs.py:332-333, 386-389`), ce que dit la FAQ 3 de la même page — la FAQ 6 la contredit. | « Pas avec les niveaux : … (sauf CRF exact, voir plus haut). Avec Strong, aucun réglage plus fort n'existe : si le résultat n'est pas plus petit, la page le dit. » |
| video-compressor | astuce 2 | « Limiting the resolution to 720p usually shrinks a phone video far more than a higher compression level. » | INVÉRIFIABLE | Aucune mesure résolution contre niveau dans `docs/audit/` (seuls les niveaux/codecs sont mesurés, `RAPPORT-p25-decisions-03-10.md` §5). | Retirer « far more » ou citer une mesure. |
| video-compressor | page entière | (absence) | MINCE | Non dits : durée maximale (`MEDIA_MAX_DURATION_SECONDS`, `jobs.py:195-197`, message « Media up to N minutes is accepted. ») ; arrêt d'un traitement trop long (`MEDIA_FFMPEG_TIMEOUT_SECONDS`, `jobs.py:366-367`) ; son toujours réencodé en AAC 96 kbit/s (`ffmpeg_ops.py:547, 551`) ; file d'attente quand le service est plein (`MediaServiceTool.jsx:28, 123`). | Ajouter une section « Limites » : 1 Go, durée max, son AAC 96 kbit/s, attente possible, limite horaire. |
| video-compressor | astuce 3 | « Keep the tab open while it works; you can cancel at any time. » | GÉNÉRIQUE | Mot pour mot l'astuce 4 de video-converter (`video-converter/page.jsx:66`). | Remplacer par une astuce propre au compresseur (ex. quand choisir H.265). |
| video-converter | titre | « …& More Online Free » | TROMPEUR | Limite par réseau heure/jour non dite (`app/api/media/ticket/route.js:36-42`). | Dire la limite (voir compressor). |
| video-converter | FAQ 2 | « the encoder is given a size ceiling taken from your own file, so a converted video does not exceed the original » | FAUX | Cibles à CRF (`ffmpeg_ops.py:61` : mp4, mov, mkv, webm, h265, av1…) : pas de plafond (rejeté, `ffmpeg_ops.py:32-38`) mais jusqu'à 3 encodages (`jobs.py:338-339`, `ffmpeg_ops.py:39`) puis, si encore plus gros, **fichier livré plus gros** (`jobs.py:385-389`). Plafond de débit seulement pour AVI/XviD/WMV/ASF/OGV/MPG/MPEG/VOB (`ffmpeg_ops.py:160-176`). CRF exact : un seul encodage (`jobs.py:332-333`). GIF et audio : hors échelle (`jobs.py:340-341`). | « En général non : si le résultat dépasse l'original, il est réencodé plus fort (3 essais au plus) ; s'il reste plus gros, il est livré et la page affiche “Larger by”. CRF exact et GIF : pas de nouvel essai. » |
| video-converter | FAQ 7 | « Nothing about your file is logged. » | TROMPEUR | Même code que le compressor (`jobs.py:406`, `MediaServiceTool.jsx:109`, `reportError.js:7-11`). | Même correction que pour le compressor. |
| video-converter | FAQ 5 | « Any video or audio file that ffmpeg can read » | FORMAT | Le sélecteur n'accepte que `VIDEO_ACCEPT` (`MediaServiceTool.jsx:140`, `app/lib/mediaSupport.js:237-238`), sans `audio/*` ; un fichier audio déposé est refusé (`app/components/FileDropBridge.jsx:66-69`). | « Toute vidéo : MP4, MOV, M4V, QT, WebM, MKV, AVI, WMV, FLV, OGV, 3GP, 3G2, MPG, MPEG, TS, MTS, M2TS… » (retirer « or audio »). |
| video-converter | FAQ 8 | « a very long file may be stopped by our time limit » | MINCE | Limite de temps par traitement (`MEDIA_FFMPEG_TIMEOUT_SECONDS`, `jobs.py:366-367`) et durée maximale (`MEDIA_MAX_DURATION_SECONDS`, `jobs.py:195-197`) non chiffrées sur la page. | Donner les deux valeurs (à lire dans la configuration Railway, non dans le code). |
| video-converter | page entière | (absence) | MINCE | Non dit : le GIF du convertisseur prend toute la vidéo, à 12 i/s, 640 px de large au plus, sans plafond de 60 s (la page n'envoie aucun paramètre GIF, `page.jsx:79-85` ; défauts `ffmpeg_ops.py:303-326, 570-576`) ; « Quality » désactivé pour GIF, WAV, FLAC et « Resolution » pour l'audio et le GIF (`page.jsx:107, 113`) ; OGV limité à 720p (`ffmpeg_ops.py:564-565`) ; AMR = 8 kHz mono ; M2TS/MTS avec son AC-3 (`ffmpeg_ops.py:191-193`). | Une ligne par cas dans une section « Formats et limites » ; renvoyer vers Video to GIF pour un extrait. |
| video-converter | astuce 4 | « Keep the tab open while it works; you can cancel at any time. » | GÉNÉRIQUE | Identique à l'astuce 3 du compressor. | Astuce propre au convertisseur. |
| video-filter | titre | « Video Filter — Apply One Visual Effect (grayscale, Sepia, » | FAUX | Titre tronqué, parenthèse non fermée, casse incohérente (`video-filter/layout.tsx:5`). | Titre complet, ex. « Video Filter — Grayscale, Sepia, Blur & More on Any Video ». |
| video-filter | astuce 2 | « The audio is carried through unchanged » | FAUX | Son réencodé en AAC 160 kbit/s : `quality: 'high'` (`page.jsx:53`) → `-c:a aac -b:a 160k` (`ffmpeg_ops.py:20, 113-114`). | « Le son est gardé (réencodé en AAC) ; le filtre ne touche qu'à l'image. » |
| video-filter | FAQ 3 | « the original sound is kept; the visual filter does not change it » | TROMPEUR | Même code : gardé mais réencodé (`ffmpeg_ops.py:114`) ; seule la première piste audio est gardée (`ffmpeg_ops.py:568`). | Préciser « réencodé en AAC, première piste son ». |
| video-filter | FAQ 2 | « (Blur 3 px, …), the same as the live preview » | TROMPEUR | L'aperçu applique `blur(3px)` à la vidéo **affichée réduite** (`page.jsx:14, 55`, `MediaServiceTool.jsx:142` `max-h-72`), le service floute avec sigma 3 sur l'image **pleine résolution** (`ffmpeg_ops.py:362`) : sur une vidéo HD l'aperçu paraît plus flou que le résultat. | Dire que l'aperçu donne l'effet, pas l'intensité exacte du flou à pleine résolution. |
| video-filter | astuce 4 | « Grayscale uses the same luminance weights as image editors » | INVÉRIFIABLE | Coefficients 0,2126/0,7152/0,0722 de la spécification CSS Filter Effects (`ffmpeg_ops.py:357-359`) ; « image editors » non prouvé. | « …les poids de luminance de la norme Rec. 709 (ceux du filtre CSS grayscale) ». |
| video-filter | page entière | (absence) | MINCE | Ni la limite horaire/journalière (`route.js:36-42`), ni la durée maximale (`jobs.py:195-197`), ni la qualité de sortie (H.264 CRF 20, `ffmpeg_ops.py:19, 113`) ne sont dites. | Section « Limites ». |
| video-merger | titre | « Join Videos Into One MP4 Online Free » | TROMPEUR | Clips différents : **un billet par clip** (`page.jsx:108-117` → `runMediaJob`), chacun compté dans la limite horaire/journalière (`route.js:36-42`). | Dire la limite (et qu'un clip = une tâche). |
| video-merger | page entière | (absence) | MINCE | Non dits : 2 Go au total sur ordinateur, 700 Mo sur téléphone **et tablette** (`page.jsx:60, 79`, `app/lib/isMobileDevice.js:5-9`) ; 1 Go par clip envoyé au service (`app/api/media/ticket/route.js:27-30`) ; 60 images/s au plus pour des clips différents (`page.jsx:106, 178`) ; au moins 2 vidéos (`page.jsx:74, 173`). | Section « Limites » avec ces valeurs. |
| video-merger | about | « Videos that are alike — typically several clips from the same phone or camera — are joined in seconds without re-encoding » | TROMPEUR | « Alike » exige en plus H.264 ou HEVC avec son AAC ou sans son (`page.jsx:26-27, 39`) et la même signature exacte (`page.jsx:37-38, 103`) : deux WebM (VP9) de la même caméra passent par le service. | Ajouter « (H.264 ou HEVC, son AAC) ». |
| video-merger | interface + astuce 1 | « in seconds when they come from the same camera » / « merge in seconds » | INVÉRIFIABLE | Aucune mesure de durée de la fusion par copie dans `docs/audit/` ; le premier passage charge aussi le moteur (~10 Mo, `page.jsx:80`). | Retirer « in seconds » ou citer une mesure. |
| video-merger | FAQ 2 | « Yes: each clip keeps its sound. » | TROMPEUR | Sur le chemin « clips différents », le son est réencodé en 48 kHz **stéréo** (`ffmpeg_ops.py:609`) : un son multicanal est réduit à 2 canaux. | « …(réencodé en AAC stéréo 48 kHz quand les clips sont différents) ». |
| video-resizer | titre | « Resize a Video Online Free » | TROMPEUR | Limite horaire/journalière non dite (`route.js:36-42`). | Dire la limite. |
| video-resizer | étape 2 | « click a preset (480p, 720p, 1080p, square, vertical) » | LIBELLÉ | Boutons réels : « 480p », « 720p », « 1080p », « 4K (2160p) », « Square 1080 », « Vertical 1080×1920 », « Portrait post 4:5 (1080×1350) », « Story 720×1280 », « 4:3 (1440×1080) » (`page.jsx:17, 78-81`). Les étapes ne citent pas non plus les onglets « Resize » / « Crop » (`page.jsx:49`). | Citer les libellés exacts et l'onglet « Crop ». |
| video-rotator | titre + méta | « Rotate Your Video Online Free » / « Free, full resolution. » | TROMPEUR | Le mode par défaut « Compatible everywhere » (`page.jsx:33`) envoie la vidéo au service, donc à la limite horaire/journalière (`page.jsx:80`, `route.js:36-42`). | Dire la limite (le mode sans perte n'en a pas). |
| video-rotator | FAQ 5 | « for MP4 and MOV the sound is not touched at all » | TROMPEUR | Vrai seulement en « Instant, lossless » (`page.jsx:65-72`) ; en « Compatible everywhere », réglage par défaut, le son est réencodé en AAC 160 kbit/s (`page.jsx:81` `quality: 'high'`, `ffmpeg_ops.py:20, 114`). | « Avec Instant, lossless, le son n'est pas touché ; avec Compatible everywhere, il est réencodé en AAC. » |
| video-rotator | about + FAQ 2 + interface | « For MP4, MOV (iPhone), M4V and 3GP, "Instant, lossless"… » | FORMAT | `.3g2` est aussi accepté en sans perte (`page.jsx:28`, regex `mp4|mov|m4v|3gp|3g2`). | Ajouter 3G2. |
| video-screenshot | méta | « as a PNG or JPG image » | FORMAT | WebP proposé (`page.jsx:91`, encodeur wasm sous Safari `page.jsx:59-63`). | « PNG, JPG ou WebP ». |
| video-screenshot | étape 3 | « Choose PNG (lossless) or JPG (with an adjustable quality level). » | FORMAT | Même code (`page.jsx:89-91`). | Ajouter WebP. |
| video-screenshot | about | « choose your format and (for JPG) quality » | FORMAT | Le curseur « Quality » apparaît pour JPG **et** WebP (`page.jsx:98-103`). | « (pour JPG et WebP) ». |
| video-screenshot | FAQ 3 | « Is Video Screenshot free to use? Yes, it's completely free with no signup required. » | GÉNÉRIQUE | Phrase copiable sur toute page. | Remplacer par une question propre (ex. résolution de l'image capturée). |
| video-screenshot | astuce 1 | « Pause the video before capturing to avoid motion blur from a frame mid-transition. » | FAUX | La capture copie l'image décodée à l'instant courant (`app/lib/mediaSupport.js:314-324`) ; la pause ne change pas son contenu, le flou de mouvement est dans l'image enregistrée. | « Mettez en pause pour capturer exactement l'image affichée. » |
| video-screenshot | astuce 2 | « Use the timeline scrubber for precise frame selection » | TROMPEUR | Le réglage précis de la page est le champ « Go to (seconds) » (pas de 0,04 s, `page.jsx:95-96`), pas la barre du lecteur. | Renvoyer vers « Go to (seconds) ». |
| video-screenshot | page entière | (absence) | MINCE | Non dits : seuls les formats que le navigateur sait lire fonctionnent (message `page.jsx:84`) ; l'image a la taille native de la vidéo (`mediaSupport.js:318-319`) ; bouton « Download all (N files, ZIP) » (`page.jsx:112`, `FileDownload.jsx:264`). | Ajouter ces trois faits. |
| video-to-audio | about + FAQ 1 | « MP3, WAV, AAC, FLAC, OGG, M4A, Opus, WMA, AIFF, ALAC, and AC3. » | FORMAT | 18 sorties proposées : en plus M4R, M4B, MP2, WV, CAF, AU, MKA (`app/lib/audioFormats.js:22-48`, menu `page.jsx:95`). | Lister les 18. |
| video-to-audio | méta | « in stereo » | TROMPEUR | Aucun `-ac` (`page.jsx:58`, `audioFormats.js:85`) : un son mono reste mono. | Retirer « in stereo » ou dire « canaux d'origine ». |
| video-to-audio | about + FAQ 2 | « Stereo (and multi-channel) audio is preserved » / « nothing is downmixed » | INVÉRIFIABLE | Aucune option ni test du dépôt ne le prouve pour les 18 formats ; les encodeurs MP3, MP2, WMA et l'Opus natif (`audioFormats.js:29-32`) de ffmpeg ne prennent pas plus de 2 canaux → réduction probable d'un 5.1. | Dire « stéréo et mono gardés ; un son multicanal peut être réduit en stéréo selon le format ». |
| video-to-audio | FAQ 3 | « Is Video to Audio free to use? Yes, it's completely free with no signup required. » | GÉNÉRIQUE | Phrase copiable. | Question propre à l'outil. |
| video-to-audio | astuce 1 | « the ffmpeg.wasm engine (roughly 25–30MB) » | FAUX | Moteur `@ffmpeg/core@0.12.9` depuis unpkg (`page.jsx:55`, `const.js:3-4`) : 10,2 Mo sur le réseau, 32,2 Mo décompressé (`docs/audit/RAPPORT-formats-navigateurs.md:59`). | « environ 10 Mo (32 Mo une fois décompressé), mis en cache ». |
| video-to-audio | astuce 3 | « if your browser downloads a very large video, extraction may take a moment » | FAUX | Rien n'est téléchargé : le fichier entier est lu et copié dans la mémoire du moteur (`page.jsx:59`). | « Une très grosse vidéo est d'abord copiée en mémoire : prévoir le temps et la mémoire ». |
| video-to-audio | page entière | (absence) | MINCE | Non dits : aucune limite de taille alors que tout le fichier est copié en mémoire (`page.jsx:59`) ; le menu « Quality » (128/192/256/320 kbit/s, 192 par défaut, formats avec débit seulement, AC3/MP2 au moins 192) (`audioFormats.js:64-67, 86`) ; Opus écrit par l'encodeur natif de ffmpeg (`audioFormats.js:29-32`). | Section « Formats et qualité » + mise en garde mémoire. |
| video-to-gif | titre | « Make an Animated GIF from a Video Online Free » | TROMPEUR | Le GIF passe par le service (`GifFromVideoTool.jsx:14`), donc par la limite horaire/journalière (`route.js:36-42`). | Dire la limite (l'extraction d'images n'en a pas). |
| video-to-gif | about + étapes | (absence des options « Plays » et « Compression ») | MINCE | Options réelles « Plays » (Forever (loop) / Once / 3 times / 5 times) et « Compression » (None / Light / Strong), appliquées dans le navigateur par gifsicle (`GifFromVideoTool.jsx:23-31, 64-78`) ; l'extraction d'images réduit une très grande vidéo (`video-to-gif/page.jsx:44`). | Décrire ces deux options. |
| video-trimmer | FAQ 6 | « only the part you cut — not the whole video — is sent » | TROMPEUR | Si aucune image clé n'est trouvée, **le fichier entier** est envoyé (`page.jsx:189-190`) ; sinon la partie va de l'image clé avant le début jusqu'à 1 s après la fin (`page.jsx:181`). | « En général seule la partie coupée (depuis l'image clé précédente)… ; pour certains fichiers, toute la vidéo. » |
| video-trimmer | about | « By default, cut points snap to the nearest keyframe » | TROMPEUR | Seul le **début** se cale, sur l'image clé **au début ou avant** (`page.jsx:159-161, 219`) ; la fin n'est pas calée (`-t`). | « Le début se cale sur l'image clé qui précède votre point de départ. » |
| video-trimmer | interface | « instantly and losslessly by default » / « an instant lossless copy » | INVÉRIFIABLE | Le premier passage charge le moteur (~10 Mo, `page.jsx:141`) et copie tout le fichier en mémoire (`page.jsx:155`) ; aucune mesure de durée dans `docs/audit/`. | « sans réencodage, en quelques secondes en général » ou retirer « instantly ». |
| video-trimmer | FAQ 4 + FAQ 5 | « On phones the file size limit is lower (100 MB) » / « 100 MB on a phone » | TROMPEUR | 100 Mo aussi sur iPad et tablette (`app/lib/isMobileDevice.js:5-9`, `page.jsx:74`). | « sur téléphone et tablette ». |
| video-trimmer | titre | « Cut a Section Online Free » | TROMPEUR | Le Precise cut long passe par le service et sa limite horaire/journalière (`page.jsx:172-203`, `route.js:36-42`) ; la coupe rapide n'en a pas. | Dire que seul le Precise cut envoyé au service est limité. |
| video-watermark | about | « pick one of five corner/center positions » | FAUX | 9 positions (`page.jsx:533`, `computeOverlayXY` `page.jsx:32-54`) ; l'étape 3 de la même page dit 9. | « une des 9 positions ». |
| video-watermark | FAQ 5 | « Why was my video rejected before I even clicked Convert? » | LIBELLÉ | Le bouton s'appelle « Add Watermark » (`page.jsx:546`). | « …before I even clicked Add Watermark? » |
| video-watermark | astuce 4 | « the ffmpeg.wasm engine (roughly 25-30MB) » | FAUX | 10,2 Mo réseau / 32,2 Mo décompressé (`docs/audit/RAPPORT-formats-navigateurs.md:59`, `page.jsx:302`). | « environ 10 Mo ». |
| video-watermark | interface + about + FAQ 3 | « about 1 second of processing per second of video » / « a 90-second clip takes about 90 seconds » | FAUX | Même encodeur x264 veryfast dans ffmpeg.wasm (`page.jsx:414`) ; la mesure du site pour ce réencodage : ≈ 3,7 s par seconde de 1080p sous Chrome, ≈ 29 s sous Firefox (`video-trimmer/page.jsx:16, 23`). | Donner la mesure réelle selon la résolution et le navigateur (ou retirer le chiffre). |
| video-watermark | FAQ 2 | « upload a PNG or JPG » | FORMAT | `accept="image/*"` (`page.jsx:515`) : toute image que le navigateur sait ouvrir (WebP, GIF, SVG…). | « une image (PNG, JPG, WebP…) ». |
| video-watermark | méta + FAQ 1 | « original audio is preserved » / « the original audio preserved » | TROMPEUR | Son réencodé en AAC (`page.jsx:415`), comme le dit la FAQ 4. | « le son est gardé (réencodé en AAC) ». |
| video-watermark | page entière | (absence) | MINCE | Non dits : seuls 6 codecs vidéo sont acceptés (H.264, HEVC, VP8, VP9, Theora, ProRes ; AV1 et les autres refusés après le clic, `page.jsx:77, 332-340`) ; aucune limite de taille alors que tout le fichier est copié en mémoire (`page.jsx:306`) ; qualité x264 veryfast réglage par défaut (`page.jsx:414`). | Section « Formats et limites ». |
| video-watermark | astuces 2-3 | « Choose a position over a less busy part of the frame… » / « Lower opacity (30-50%) reads as a subtler watermark… » | GÉNÉRIQUE | Conseils copiables sur pdf-watermark ou add-text-to-image. | Astuces propres (ex. logo PNG transparent, taille 5-60 %). |

#### Synthèse

61 défauts sur 11 outils : **FAUX 10**, **INVÉRIFIABLE 6**, **TROMPEUR 22**, **GÉNÉRIQUE 5**, **MINCE 9**,
**LIBELLÉ 2**, **FORMAT 7**.


---

### Lot gif-file

Source du texte : `docs/audit/p36/contenu-avant.json`. Code lu : `page.jsx` + `layout.tsx` de chaque outil et tout ce qu'ils
importent. Abréviations : **P** = le `page.jsx` de l'outil, **L** = son `layout.tsx` (ligne 5 = titre, ligne 6 = méta) ;
**GV** = `app/components/GifFromVideoTool.jsx` ; **MS** = `app/components/MediaServiceTool.jsx` ; **FD** =
`app/components/FileDownload.jsx` ; **TK** = `app/api/media/ticket/route.js`. Une affirmation juste n'est pas listée.

Jumeau signalé : `gif-tools/video-to-gif` a un homonyme `video-tools/video-to-gif` (même moteur GV + extraction d'images
PNG, `app/tools/video-tools/video-to-gif/page.jsx:101-107`) ; les deux pages ont le même titre « Video to GIF ». Autres
quasi-jumeaux : `image-to-gif` ≈ `gif-maker` ; `tar-extractor` ⊂ `zip-extractor`.

#### gif-tools/apng-to-gif

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| apng-to-gif | FAQ 4 | « Yes, it's completely free with no signup and no limit on how many files you can process. » | GÉNÉRIQUE | Même phrase sur gif-compressor (P:105) et gif-to-apng (P:107) (`unicite-avant.json`, repeated) | Remplacer par un fait propre (traitement dans la page, 16,7 Mpx par image au plus). |
| apng-to-gif | about + astuce 2 | « frame delays … are carried over » / « Frame delays from the original APNG are preserved » | TROMPEUR | Une image APNG de délai 0 sort à 100 ms (P:44 `delay \|\| 100`) | « Les délais sont repris ; une image sans délai prend 100 ms. » |
| apng-to-gif | about / FAQ (absent) | — | MINCE | Non dit : limite 16 777 216 px par image, tous appareils, avec message « too large for an animation (16 megapixels at most) » (app/lib/gifEncode.js:51-58, P:32-33) ; refus d'un non-PNG (P:34) ; nom converted.gif (P:66) ; nombre de lectures repris (P:39-40) | Ajouter ces faits. |

#### gif-tools/avi-to-gif

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| avi-to-gif | interface (sous-titre) + étape 1 | « Convert a AVI clip » / « Select a AVI file » | LIBELLÉ | Coquille dans le texte affiché (P:9, P:14) | « an AVI ». |
| avi-to-gif | astuce 2 | « Play the video above to find the exact second where your clip should start. » | FAUX | La page dit elle-même « browsers cannot play AVI » (P:12) ; l'aperçu est un `<video>` du fichier (MS:142) ; durée non lue → début/longueur non vérifiés avant envoi (MS:58, GV:40) | Supprimer ; dire que l'AVI ne se lit pas dans l'aperçu, saisir le début en secondes. |
| avi-to-gif | FAQ 1 | « Yes, free with no signup and no watermark. » | TROMPEUR | Nombre de conversions limité par connexion, par heure et par jour (TK:28,36-42 ; lib/media/ticket.js:49-50), non dit | Ajouter la limite horaire/journalière par connexion (messages réels TK:38,41). |
| avi-to-gif | about + méta | « so it works in every browser including Safari and iPhone » / « any browser » | INVÉRIFIABLE | Plancher du site Safari 16.4 (app/lib/polyfills.js:5) ; Safari réel / iPhone « Non prouvé » pour le service (docs/audit/RAPPORT-video-deploiement.md:14) | « La conversion se fait sur notre serveur : le navigateur n'a pas besoin de lire l'AVI. » |
| avi-to-gif | about + FAQ 5 | « Your file is deleted from our server as soon as you have downloaded the GIF. » / « deleted as soon as you have downloaded the result » | TROMPEUR | Vidéo supprimée dès la fin du traitement (services/media-processing/app/jobs.py:7) ; GIF supprimé après sa première lecture complète par la page, faite avant le bouton Download (main.py:236-240, app/lib/mediaJob.js:130-134,194) ; sinon après MEDIA_JOB_TTL_SECONDS (jobs.py:8-10, config.py:44) | Décrire ce déroulé exact. |
| avi-to-gif | étapes 1-4, FAQ 1-5, astuces 1-2 | (bloc entier) | GÉNÉRIQUE | 84 % identique à webm-to-gif, 83 % à mov-to-gif, 76 % à mp4-to-gif (`unicite-avant.json`, over) | Réécrire avec ce qui est propre à l'AVI. |
| avi-to-gif | about / FAQ (absent) | — | MINCE | Non dits : réglages « Plays » et « Compression » (GV:64-78), faits dans le navigateur par gifsicle (GV:21-31) ; durée mini 0,2 s (GV:37) ; vidéo jamais agrandie (ffmpeg_ops.py:322-323) ; fichier sans image refusé (ffmpeg_ops.py:559-560) ; durée de la source plafonnée (jobs.py:195-196) | Ajouter. |

#### gif-tools/mov-to-gif

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| mov-to-gif | FAQ 1 | « Yes, free with no signup and no watermark. » | TROMPEUR | Limite par connexion heure/jour non dite (TK:36-42) | Ajouter la limite. |
| mov-to-gif | about + méta | « works in every browser including Safari and iPhone » / « any browser » | INVÉRIFIABLE | polyfills.js:5 ; RAPPORT-video-deploiement.md:14 | Dire ce que fait le serveur, sans « every/any browser ». |
| mov-to-gif | about + FAQ 5 | « Your file is deleted from our server as soon as you have downloaded the GIF. » | TROMPEUR | jobs.py:7-10 ; main.py:240 ; mediaJob.js:194 | Déroulé exact (voir avi-to-gif). |
| mov-to-gif | étapes, FAQ, astuces | (bloc entier) | GÉNÉRIQUE | 83 % identique à avi-to-gif et webm-to-gif, 75 % à mp4-to-gif (`unicite-avant.json`) | Réécrire (iPhone, Photothèque réduite par iOS : app/components/IosOriginalNote.jsx). |
| mov-to-gif | about / FAQ (absent) | — | MINCE | Plays / Compression / gifsicle non dits (GV:21-31,64-78) ; une seule phrase propre au MOV (P:12) | Ajouter. |

#### gif-tools/mp4-to-gif

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| mp4-to-gif | FAQ 1 | « Yes, free with no signup and no watermark. » | TROMPEUR | Limite par connexion heure/jour non dite (TK:36-42) | Ajouter la limite. |
| mp4-to-gif | about | « so it works in every browser including Safari and iPhone » | INVÉRIFIABLE | polyfills.js:5 ; RAPPORT-video-deploiement.md:14 | Sans « every browser ». |
| mp4-to-gif | about + FAQ 5 | « Your file is deleted from our server as soon as you have downloaded the GIF. » | TROMPEUR | jobs.py:7-10 ; main.py:240 ; mediaJob.js:194 | Déroulé exact. |
| mp4-to-gif | étapes, FAQ, astuces | (bloc entier) | GÉNÉRIQUE | 75-76 % identique à avi/mov/webm-to-gif, 60 % à video-to-gif (`unicite-avant.json`) | Réécrire. |
| mp4-to-gif | about / FAQ (absent) | — | MINCE | Aucun fait propre au MP4 ; Plays / Compression non dits (GV:64-78) | Ajouter. |

#### gif-tools/webm-to-gif

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| webm-to-gif | FAQ 1 | « Yes, free with no signup and no watermark. » | TROMPEUR | Limite par connexion heure/jour non dite (TK:36-42) | Ajouter la limite. |
| webm-to-gif | about + méta | « works in every browser including Safari and iPhone » / « any browser » | INVÉRIFIABLE | polyfills.js:5 ; RAPPORT-video-deploiement.md:14 | Sans « every/any browser ». |
| webm-to-gif | about + FAQ 5 | « Your file is deleted from our server as soon as you have downloaded the GIF. » | TROMPEUR | jobs.py:7-10 ; main.py:240 ; mediaJob.js:194 | Déroulé exact. |
| webm-to-gif | étapes, FAQ, astuces | (bloc entier) | GÉNÉRIQUE | 84 % identique à avi-to-gif (`unicite-avant.json`) | Réécrire. |
| webm-to-gif | about / FAQ (absent) | — | MINCE | Plays / Compression non dits (GV:64-78) ; une seule phrase propre (P:12) | Ajouter. |

#### gif-tools/video-to-gif (jumeau : video-tools/video-to-gif)

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| video-to-gif | FAQ 1 | « Yes, free with no signup and no watermark. » | TROMPEUR | Limite par connexion heure/jour non dite (TK:36-42) | Ajouter la limite. |
| video-to-gif | about + méta | « so it works in every browser including Safari and iPhone » / « Any browser, iPhone included. » | INVÉRIFIABLE | polyfills.js:5 ; RAPPORT-video-deploiement.md:14 | Sans « every/any browser ». |
| video-to-gif | interface (sous-titre) + about | « Turn a clip of any video » / « a clip of any video (MP4, MOV …) » | INVÉRIFIABLE | Le sélecteur ne prend que video/* et 17 extensions (MS:140 ; app/lib/mediaSupport.js:237-238) | Lister les formats acceptés. |
| video-to-gif | about + FAQ 6 | « Your file is deleted from our server as soon as you have downloaded the GIF. » / « deleted as soon as you have downloaded the result » | TROMPEUR | jobs.py:7-10 ; main.py:240 ; mediaJob.js:194 | Déroulé exact. |
| video-to-gif | astuce 3 | « Play the video above to find the exact second where your clip should start. » | TROMPEUR | Faux pour l'AVI et tout format que le navigateur ne lit pas (avi-to-gif P:12 ; aperçu MS:142 ; durée non lue MS:58) | « … si votre navigateur sait la lire ». |
| video-to-gif | étapes, FAQ, astuces | (bloc entier) | GÉNÉRIQUE | 54-60 % identique aux 4 pages par format ; astuces 1, 2, 4 identiques au jumeau video-tools (`unicite-avant.json`) | Réécrire, distinguer du jumeau. |
| video-to-gif | about / FAQ (absent) | — | MINCE | Plays / Compression non dits (GV:64-78) ; existence du jumeau avec extraction PNG non dite | Ajouter. |

#### gif-tools/gif-compressor

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| gif-compressor | FAQ 5 | « Yes, it's completely free with no signup and no limit on how many files you can process. » | GÉNÉRIQUE | Même phrase sur apng-to-gif et gif-to-apng (`unicite-avant.json`) | Remplacer par un fait propre. |
| gif-compressor | about / FAQ (absent) | — | MINCE | Non dits : 100 Mpx au plus, message « too large to compress in a browser » (P:30-31, app/lib/fileChecks.js:200) ; correspondance qualité → `--lossy` 0 à 180 (P:35-38) ; résultat plus lourd signalé, jamais caché (P:78-84) | Ajouter. |

#### gif-tools/gif-maker

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| gif-maker | titre | « GIF Maker — Turn a Sequence Online Free » | MINCE | Titre tronqué : ni images ni GIF animé (L:5) | « … Turn Images into an Animated GIF … ». |
| gif-maker | astuce 1 | « \"Same as the first image\" gives a smaller GIF. » | TROMPEUR | Plus petit seulement si la 1re image est plus petite que la plus grande (P:76-77) | Le dire. |
| gif-maker | FAQ 6 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | Phrase présente sur 92 pages (`unicite-avant.json`) | Remplacer. |
| gif-maker | FAQ 5 + astuce 3 | « Will photos look as good as flat graphics or icons? … The underlying encoder doesn't apply dithering… » | GÉNÉRIQUE | Mot pour mot sur image-to-gif (P:134, P:141) | Garder sur une seule page ou reformuler. |
| gif-maker | about / FAQ (absent) | — | MINCE | Non dits : aucune transparence, chaque image peinte sur la couleur de fond dans les 3 modes (P:96) ; 1920 px de côté au plus (P:14,78) ; 300 images max par GIF animé ajouté (P:43,50) ; durée par image ≥ 20 ms (P:104-105,139) ; délai commun 50-1000 ms (P:164) | Ajouter. |

#### gif-tools/gif-to-apng

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| gif-to-apng | FAQ 4 | « Yes, it's completely free with no signup and no limit on how many files you can process. » | GÉNÉRIQUE | Même phrase sur apng-to-gif et gif-compressor | Remplacer. |
| gif-to-apng | about + astuce 1 | « Frame delays are carried over » / « Frame delays from the original GIF are preserved » | TROMPEUR | Délai 0 → 100 ms (app/lib/gifFrames.js:36) | Le dire. |
| gif-to-apng | about / FAQ (absent) | — | MINCE | Non dits : 16,7 Mpx par image au plus (P:66-67, gifEncode.js:51-58) ; APNG sans perte (UPNG cnum 0, P:72) ; nombre de lectures repris (P:24-51) est seulement en astuce | Ajouter. |

#### gif-tools/gif-to-mp4

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| gif-to-mp4 | FAQ 6 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | 92 pages | Remplacer. |
| gif-to-mp4 | astuce 2 | « MP4 is far more widely compatible than GIF for sharing on social platforms or embedding in video players. » | GÉNÉRIQUE | Aucun lien avec le code ; phrase copiable partout | Supprimer ou remplacer par un fait (H.264 yuv420p + faststart, P:52-53). |
| gif-to-mp4 | astuce 4 | « For a much smaller file than the original GIF at similar visual quality, MP4/H.264 is typically far more efficient » | INVÉRIFIABLE | Aucune mesure dans docs/audit | Supprimer ou mesurer. |
| gif-to-mp4 | about / FAQ (absent) | — | MINCE | Non dits : 16,7 Mpx par image au plus (P:27-28) ; délai < 20 ms compté 100 ms (P:44) ; moteur ffmpeg.wasm (~30 Mo) téléchargé depuis unpkg.com (node_modules/@ffmpeg/ffmpeg/dist/esm/const.js:4, worker.js:11-17) — le GIF, lui, n'est pas envoyé | Ajouter. |

#### gif-tools/image-to-gif

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| image-to-gif | titre | « Image to GIF — Turn a Batch Online Free » | MINCE | Titre tronqué (L:5) | « … Turn Images into an Animated GIF … ». |
| image-to-gif | FAQ 2 | « Any format your browser supports, including JPG, PNG, BMP, GIF, and WebP. » | TROMPEUR | Un GIF (ou WebP) animé ne donne que sa 1re image (chargé par `new Image()`, P:33-44) ; gif-maker, lui, le découpe (gif-maker P:41-53) | Le dire, renvoyer vers GIF Maker. |
| image-to-gif | FAQ 4 | « Yes, it's completely free with no account creation or login required. » | GÉNÉRIQUE | Phrase de gratuité sans fait propre | Remplacer. |
| image-to-gif | FAQ 3 + astuce 3 | « Will photos look as good as flat graphics or icons? … » | GÉNÉRIQUE | Mot pour mot sur gif-maker (P:192, P:199) | Une seule page ou reformuler. |
| image-to-gif | about / FAQ (absent) | — | MINCE | Non dits : 100 Mpx par image (P:39) ; boucle infinie sans option (aucun `repeat`, P:79) ; pas de réordonnancement ; jumeau gif-maker plus complet | Ajouter. |

#### file-tools/file-comparator

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| file-comparator | méta + about | « instantly checks » / « It's a fast way » | INVÉRIFIABLE | Lecture par tranches de 8 Mio avec pourcentage « Comparing… N% » (P:22-31,57) ; aucune mesure | « octet par octet, par tranches de 8 Mio, avec la progression affichée ». |
| file-comparator | interface (sous-titre) | « Compare two files side by side » | TROMPEUR | Aucune vue côte à côte : verdict + position du 1er octet différent (P:61-62) | « Check whether two files are identical, byte for byte ». |
| file-comparator | FAQ 2 | « Any file type and any size … even multi-gigabyte files can be compared » | INVÉRIFIABLE | Pas de constante de taille ; aucune mesure multi-Go dans docs/audit | Dire « lus par tranches de 8 Mio, sans constante de taille » sans promettre « any size ». |
| file-comparator | astuce 3 | « this tool only reports whether files match » | FAUX | Donne aussi la position du 1er octet différent (P:62) ; contredit la FAQ 3 | Corriger. |
| file-comparator | FAQ 4 | « Yes, it's completely free with no signup and no limit on how many comparisons you can run. » | GÉNÉRIQUE | Phrase de gratuité | Remplacer. |

#### file-tools/file-converter

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| file-converter | titre + méta + about + FAQ 2 | « converts plain-text-based files between TXT, JSON, CSV, and HTML formats » | TROMPEUR | Le contenu n'est jamais interprété : JSON = texte dans `{"content": …}` (P:30) ; CSV = tabulations → virgules (P:33-35) ; HTML = texte échappé dans `<pre>` (P:40-43) ; TXT = texte relu en UTF-8 (P:20-27) | Dire exactement ces 4 transformations. |
| file-converter | interface (accept) | « .txt, .csv, .json, .html, or .md » | FORMAT | La conversion CSV transforme du texte séparé par tabulations (P:31-35) mais .tsv n'est pas accepté ; .htm, .markdown non plus (P:60) | Accepter .tsv/.htm ou le dire. |
| file-converter | FAQ 1 | « Yes, it's completely free with no signup and no limit on how many files you can convert. » | GÉNÉRIQUE | Phrase de gratuité | Remplacer. |
| file-converter | about / FAQ (absent) | — | MINCE | Non dit : la vraie valeur de TXT = détection d'encodage (BOM, UTF-8, sinon page de code ANSI) et réécriture en UTF-8 (P:20-27) ; nom de sortie = nom + nouvelle extension (P:65) | Ajouter. |

#### file-tools/file-encryptor

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| file-encryptor | titre | « File Encryptor — Obfuscate Any File Online Free » | FAUX | AES-256-GCM (P:5,26 ; app/lib/textCrypto.js:71-84) | « Encrypt Any File with a Password (AES-256) ». |
| file-encryptor | méta | « obfuscates any file with a password-based XOR cipher » | FAUX | Le chiffrement est AES-256-GCM + PBKDF2-SHA-256 600 000 itérations (textCrypto.js:17,30-33,76-84) ; le XOR ne sert qu'à relire les anciens fichiers (textCrypto.js:98-100) | Réécrire la méta. |
| file-encryptor | about + FAQ 3 | « a wrong password or a modified file is refused with a clear message instead of producing a corrupted file » / « you never get a silently corrupted file » | TROMPEUR | Vrai seulement pour un fichier à en-tête OCF1 ; sans cet en-tête (ancien XOR, fichier non chiffré, 4 premiers octets modifiés) le fichier est « déchiffré » par XOR sans contrôle, avec un avertissement (textCrypto.js:90,98-100 ; P:29) | Préciser l'exception. |
| file-encryptor | astuce 2 | « 48 bytes of salt, IV and authentication tag » | FAUX | 48 = 4 (marqueur « OCF1 ») + 16 (sel) + 12 (IV) + 16 (étiquette) (textCrypto.js:71,74,78-83) | « 48 bytes: a 4-byte marker, 16-byte salt, 12-byte IV, 16-byte tag ». |
| file-encryptor | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | 92 pages | Remplacer. |

#### file-tools/file-metadata

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| file-metadata | titre + méta + about | « Instantly Reveals » / « instantly reveals » / « in seconds » | INVÉRIFIABLE | Métadonnées internes lues ensuite, avec « Reading the metadata inside the file… » (P:34,60) ; aucune mesure | Sans « instantly / in seconds ». |
| file-metadata | méta | « name, size, MIME type, date, and extension » | MINCE | Omet le vrai format lu dans les octets (P:23-25, 46 signatures app/lib/fileSignature.js:11-58) et les métadonnées internes (app/lib/embeddedMetadata.js:99-111) | Les citer. |
| file-metadata | astuce 4 | « For deeper metadata like camera EXIF data or image dimensions, you'll need a format-specific metadata tool. » | FAUX | L'outil lit l'EXIF et le GPS des photos (embeddedMetadata.js:103 ; about P:76 ; FAQ 2 P:85) | Garder seulement « image dimensions / duration ». |
| file-metadata | FAQ 2 + about | « Word / Excel / PowerPoint and OpenDocument properties » / « Office documents » | TROMPEUR | Seuls les formats ZIP (DOCX/XLSX/PPTX, ODF) sont lus (embeddedMetadata.js:47-55,105) ; .doc/.xls/.ppt anciens : rien (embeddedMetadata.js:103-108) | « DOCX, XLSX, PPTX et OpenDocument (pas les anciens .doc/.xls/.ppt) ». |
| file-metadata | FAQ 1 | « Yes, it's completely free with no signup and no limit on how many files you can inspect. » | GÉNÉRIQUE | Phrase de gratuité | Remplacer. |

#### file-tools/file-splitter

Lignes de `page.jsx` (le fichier `config.js` est à part).

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| file-splitter | FAQ 3 + astuce 3 | « each part is a lazy byte-range view of the original, only read when you actually download it » / « only downloading a part actually reads its bytes » | FAUX | Chaque ligne de résultat est un FileDownload avec seulement `href` (P:136), qui relit la partie dès que la ligne s'affiche (`fetch(href).blob()`, FD:124-135) | Retirer ; dire que la découpe ne copie pas le fichier, sans promesse sur la lecture. |
| file-splitter | interface + astuce 3 | « Splitting is instant — chunks are lazy byte-range views, not copied into memory. » / « Splitting is instant regardless of file size » | TROMPEUR | La découpe (Blob.slice, P:79-90) est immédiate, mais la page relit ensuite chaque partie (FD:129-134) et « Download all (N files, ZIP) » construit le ZIP en mémoire (FD:241-256) ; mesure seulement sous Node, en commentaire (config.js:7-14) | Ne promettre que la découpe ; pas « regardless of file size ». |
| file-splitter | étape 2 | « set the chunk size and unit (Bytes, KB, or MB) » | LIBELLÉ | Options affichées « B », « KB », « MB » ; KB = 1024 o, MB = 1 048 576 o (P:62,127) | « B, KB or MB (1 KB = 1024 bytes) ». |
| file-splitter | astuce 2 | « e.g. 24MB for a 25MB email attachment … to leave room for any encoding overhead » | TROMPEUR | Ici 1 MB = 1 048 576 o (P:62) : « 24 MB » = 25,17 millions d'octets ; une pièce jointe est envoyée encodée en base64 (+33 %) | Donner un exemple juste ou retirer. |
| file-splitter | méta + about | « divides any file into smaller, numbered parts by size » | MINCE | Omet « Into equal parts » (P:122), « Join parts » (P:22-38,111), limites 5 GB et 1000 parties (config.js:28-30) | Les citer. |
| file-splitter | étape 4 | « Download each part individually » | MINCE | « Download all (N files, ZIP) » existe (P:134 ; FD:264) | Le dire. |

#### file-tools/tar-extractor

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| tar-extractor | about | « Upload a .tar, .tar.gz, or .tgz file to instantly see and download its contents. » | INVÉRIFIABLE | « instantly » : archive lue puis décompressée en entier, « Extracting... » (P:31-36,61), aucune mesure ; « Upload » contredit « no upload » (rien n'est envoyé) | « Choose a … file: its files are listed when extraction ends. » |
| tar-extractor | FAQ 4 | « Do I need to install any software? No, TAR Extractor works directly in your web browser on any device without additional software installation. » | GÉNÉRIQUE | Exemple type de la consigne | Supprimer. |
| tar-extractor | FAQ 2 | « Folders and links are skipped; only real files are listed. » | TROMPEUR | Les liens physiques sont extraits comme copie de leur cible (app/lib/tarReader.js:107-112) ; liens symboliques et fichiers épars GNU listés « Not extracted (N) » (tarReader.js:113-115 ; P:45,63) | Le dire. |
| tar-extractor | étape 4 + astuce 3 | « Click \"Download\" next to each file to save it individually. » / « download the ones you need individually » | MINCE | « Download all (N files, ZIP) » existe (P:67 ; FD:264) | Le dire. |
| tar-extractor | interface (accept) | `.taz` dans accept | FORMAT | .taz (tar compressé par « compress », .Z) accepté mais seul le gzip (1F 8B) est décompressé (P:14,32-36) | Retirer .taz ou le décompresser ; sinon le dire. |

#### file-tools/zip-creator

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| zip-creator | interface + FAQ 5 | « Opens in 7-Zip, WinRAR, Windows 11 and The Unarchiver. » / « which 7-Zip, WinRAR, Windows 11 Explorer and The Unarchiver open » | INVÉRIFIABLE | Seul lecteur indépendant vérifié : bsdtar/libarchive (docs/audit/RAPPORT-p24-couverture-03-10.md:217-221) ; ailleurs, commentaire seulement (zipCreator.worker.js:19-21) | « AES-256 (WinZip AE-2), standard lu par 7-Zip et WinRAR » seulement après vérification, sinon nommer bsdtar. |
| zip-creator | FAQ 6 | « a measured limit to keep zipping reliable » | INVÉRIFIABLE | Mesures sous Node seulement, en commentaire (config.js:1-22) ; aucun rapport navigateur dans docs/audit | Dire la limite sans « measured », ou produire le rapport. |
| zip-creator | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | 92 pages | Remplacer. |
| zip-creator | astuce 5 | « Great for bundling multiple documents or images into a single file before emailing or uploading elsewhere. » | GÉNÉRIQUE | Phrase copiable | Supprimer. |
| zip-creator | about / FAQ (absent) | — | MINCE | Non dits : fichiers mis à la racine sous leur seul nom, pas de dossiers (P:106 ; worker:45-47) ; nom archive.zip (P:158) dit seulement en FAQ | Ajouter. |

#### file-tools/zip-extractor

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| zip-extractor | titre | « ZIP Extractor — Extract ZIP Online Free » | MINCE | Le titre ne dit que ZIP alors que l'outil ouvre RAR, 7Z, TAR… (P:250) | Nommer RAR/7Z. |
| zip-extractor | interface + méta + FAQ 1 | « 40+ other archive formats » ; liste « ISO, CAB, WIM, DMG, VHD, ARJ, LZH, CPIO, RPM, DEB, CHM, MSI » | INVÉRIFIABLE | Aucun décompte dans le code ni un rapport ; formats testés : RAR, RAR5, 7z, ZIP, CAB, LZH, archives découpées (docs/audit/RAPPORT-amelioration-15.md:35) | Citer les formats testés + « and the other formats 7-Zip reads ». |
| zip-extractor | interface + FAQ 4 | « Any archive size » / « Not on the archive » | TROMPEUR | Pour .tar.gz/.tgz/.tar.bz2/.tar.xz/.tar.zst, le .tar interne est décompressé en mémoire et refusé au-delà de 1.9 GB (300 MB téléphone/tablette) (config.js:20 ; extract.worker.js:175-199 ; P:98) | Ajouter l'exception. |

#### Synthèse du lot gif-file

19 outils lus (+ le jumeau `video-tools/video-to-gif` lu pour comparaison). **89 défauts** :

| Type | Nombre |
|---|---|
| FAUX | 7 |
| INVÉRIFIABLE | 14 |
| TROMPEUR | 23 |
| GÉNÉRIQUE | 21 |
| MINCE | 20 |
| LIBELLÉ | 2 |
| FORMAT | 2 |

Valeurs NON TROUVÉ (aucune constante dans le code) : taille de fichier max pour apng-to-gif, gif-compressor, gif-maker,
gif-to-apng, gif-to-mp4, image-to-gif, file-comparator, file-converter, file-encryptor, file-metadata, tar-extractor,
recollage de file-splitter ; nombre d'images max d'apng-to-gif et gif-to-apng. Valeurs en variables d'environnement, non
lues (consigne) : MEDIA_JOBS_PER_HOUR_PER_IP, MEDIA_JOBS_PER_DAY_PER_IP, MEDIA_TICKET_MAX_BYTES,
MEDIA_MAX_DURATION_SECONDS, MEDIA_JOB_TTL_SECONDS.

Défauts de code vus en passant (hors texte, pour le propriétaire) : file-encryptor renomme le résultat si l'on change
d'onglet après coup (P:53 lit le mode courant) ; zip-creator, deux fichiers de même nom (JSZip remplace, zip.js refuse —
non testé).


---

### Lot text

Sources lues : `docs/audit/p36/contenu-avant.json` (texte servi), puis le code. Abréviations des références :
`<outil>/page.jsx` = `app/tools/text-tools/<outil>/page.jsx`, `<outil>/layout.tsx` = `app/tools/text-tools/<outil>/layout.tsx`,
`textTools.js` = `app/lib/textTools.js`, `textSegments.js` = `app/lib/textSegments.js`, `textCrypto.js` = `app/lib/textCrypto.js`,
`codeTools.js` = `app/lib/codeTools.js`, `FileDownload.jsx` = `app/components/FileDownload.jsx`, `TextArea.jsx` = `app/components/TextArea.jsx`.

Constats communs aux 16 outils (prouvés une fois ici, rappelés dans les lignes concernées) :
- Aucun appel réseau avec le texte : aucun `fetch`/`/api/` dans les 16 pages ni dans `textTools.js`, `textSegments.js`,
  `textCrypto.js`, `KeywordDensity.jsx` ; aucun des 16 noms d'outil n'apparaît dans `app/api`, `lib` (hors
  `lib/legacyRedirects.ts:107-111`, simples redirections) ni `services`. Pas de quota, pas d'inscription, pas de filigrane.
  Seul départ réseau : un message d'erreur AFFICHÉ (texte fixe, nettoyé) vers `/api/report-error`
  (`app/lib/useToolError.js:19-31`, `app/lib/reportError.js:16,133-171`, nettoyage `reportError.js:72-122`).
- Les promesses « caractères tels qu'on les voit » reposent sur `Intl.Segmenter` ; sans lui le code se replie sur les
  points de code (`textSegments.js:9-14`) ou une regex (`textSegments.js:26`, `:38`). Le plancher du site est
  « chrome 111, edge 111, firefox 111, safari 16.4 » (`node_modules/next/dist/docs/03-architecture/supported-browsers.md:19`,
  `app/lib/polyfills.js:5`) ; `Intl.Segmenter` n'existe dans Firefox que depuis la version 125 (fait externe, MDN) :
  Firefox 111-124 est dans le plancher et prend le repli. Aucun polyfill de `Intl.Segmenter` (grep : seuls
  `textSegments.js` et `app/lib/textPdf.js` le citent).
- Les titres `layout.tsx:5` suivent un gabarit « <Nom> — <verbe…> Online Free » souvent tronqué ou agrammatical ; classés
  GÉNÉRIQUE (phrase-gabarit, pas propre à l'outil).
- Les FAQ « Is X free to use? Yes, it's completely free with no signup… » et « Is my text uploaded / Is my data private?
  No — everything happens in your browser » sont vraies (voir 1ᵉʳ point) mais copiables telles quelles : GÉNÉRIQUE.

#### ascii-art

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| ascii-art | titre | « Turn Short Typed Text Online Free » | GÉNÉRIQUE | `ascii-art/layout.tsx:5` : gabarit tronqué (il manque « into ASCII art ») | Titre propre : générateur FIGlet, 10 polices, texte → bannière |
| ascii-art | méta | « block-letter banners built from # and space characters » | FAUX | Seule la police Banner dessine avec `#`. Mesuré (figlet 1.12.0, `node_modules/figlet/importable-fonts/*.js`, rendu de « Ab ») : Standard/Big/Doom `_ / \ \| ' ) .`, Slant `_ / \| \ .`, Block `_ \|`, ANSI Shadow `█ ╗ ╔ ═ ║ ╝ ╚`, 3-D `* /` ; polices `ascii-art/page.jsx:9-20` | Dire « bannières FIGlet en 10 polices », sans « # » |
| ascii-art | about | « Letters, digits, punctuation and accented Latin letters are supported, in ten fonts » | TROMPEUR | Mesuré sur 94 ASCII imprimables + 38 lettres accentuées (é è ê ë à â ä ç ô ö ù û ü î ï ñ É È À Ç Ä Ö Ü ß á í ó ú ã õ å æ ø Å Æ Ø œ Œ) : Standard 38/38 ; Big, Slant, Small, Block, Shadow 36/38 (sans œ Œ) ; Banner et Doom 7/38 (seulement Ä Ö Ü ä ö ü ß) ; ANSI Shadow 0/38 et 9 signes ASCII absents (`" ' + = \` { \| } ~`) ; 3-D 0/38. Le code le signale (`ascii-art/page.jsx:32-33`) | Dire les lettres accentuées par police (Standard toutes ; Big/Slant/Small/Block/Shadow sauf œ ; Banner/Doom seulement allemandes ; ANSI Shadow et 3-D aucune) |
| ascii-art | about | « turns text into large ASCII-art letters » | TROMPEUR | ANSI Shadow dessine avec des caractères de dessin Unicode (█ ╗ …), pas de l'ASCII, et rend les minuscules en majuscules (mesuré : « a » et « A » identiques) | Dire qu'ANSI Shadow est en Unicode (bloc/traits), majuscules seulement |
| ascii-art | FAQ 2 | « All printable ASCII — letters, digits and punctuation » | FAUX | ANSI Shadow n'a pas `" ' + = \` { \| } ~` (mesuré, même méthode) | « Tout l'ASCII imprimable sauf 9 signes en ANSI Shadow » |
| ascii-art | FAQ 2 | « Anything a font lacks is listed under the result » | FAUX | La note s'affiche au-dessus du bouton « Generate » (`ascii-art/page.jsx:44`, bouton `:45`), le résultat est dessous (`:46-53`) ; texte exact : « Not in this font, left out: … » (`:33`) | « listed above the Generate button » |
| ascii-art | FAQ 1 | « Is ASCII Art Generator free to use? Yes, it's completely free with no signup required. » | GÉNÉRIQUE | Vrai (aucun quota, aucune inscription) | Remplacer par une question propre à l'outil |
| ascii-art | FAQ 4 | « Is my text uploaded to a server? No — everything happens in your browser. » | GÉNÉRIQUE | Vrai : polices importées depuis le site (`ascii-art/page.jsx:9-20`), aucun envoi du texte | Phrase propre (ex. polices chargées à la demande, texte jamais envoyé) |

#### case-converter

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| case-converter | méta | « between UPPERCASE, lowercase, Title Case, Capitalized Case, Sentence case, and aLtErNaTe (toggle) case » | FORMAT | 12 casses : + iNVERSE, camelCase, PascalCase, snake_case, kebab-case, CONSTANT_CASE (`case-converter/page.jsx:44-49`) non dites | Citer les 12 (ou « 7 casses de texte + 5 casses de programmation ») |
| case-converter | about | même liste de 6 casses | FORMAT | idem `case-converter/page.jsx:44-49` ; about `:59` | Ajouter iNVERSE et les 5 casses de programmation (mots coupés aux espaces, ponctuation et changements de casse, ligne par ligne, `:21-23`) |
| case-converter | méta ; about | « aLtErNaTe (toggle) case » | TROMPEUR | « toggle case » désigne usuellement l'inversion (= bouton iNVERSE, `:29`) ; aLtErNaTe alterne minuscule/majuscule par position de caractère, espaces et ponctuation compris (`:17`) | Supprimer « (toggle) » ; dire « alternating » |
| case-converter | interface | « Convert text to any case format » | INVÉRIFIABLE | 12 boutons de casse (`:38-49`) | « Convert text to 12 cases » |
| case-converter | FAQ 1 | « Yes, it's completely free with no signup and no limit on conversions. » | GÉNÉRIQUE | Vrai (aucune limite dans le code) | Question propre à l'outil |
| case-converter | FAQ 4 | « Yes, everything happens locally in your browser — what you enter is never sent to a server. » | GÉNÉRIQUE | Vrai | Idem |
| case-converter | astuce 1 | « Use Title Case for headlines and headings to keep formatting consistent. » | GÉNÉRIQUE | — | Astuce propre (ex. petits mots gardés en minuscule `textSegments.js:107`, acronymes connus gardés `:70`) |

#### character-counter

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| character-counter | titre | « Instantly Breaks Down Any Text Online » | GÉNÉRIQUE | `character-counter/layout.tsx:5` : gabarit agrammatical (sujet manquant) + « Instantly » | Titre propre |
| character-counter | méta | « instantly breaks down … live » | INVÉRIFIABLE | Recalcul à chaque saisie (`character-counter/page.jsx:9`) : « live » prouvé, « instantly » aucune mesure | Garder « live, as you type » |
| character-counter | méta | « and special characters » | LIBELLÉ | La case s'appelle « Other symbols » (`:22`) | « other symbols » |
| character-counter | about | « or a Hindi syllable is one character » | INVÉRIFIABLE | Dépend de la version Unicode du moteur `Intl.Segmenter` (`textSegments.js:12-14`) ; les conjointes devanagari ne forment un seul graphème que depuis les règles Unicode 15.1. Mesuré ici sous Node (ICU 78) seulement : « नमस्ते » = 3. Aucune mesure navigateur dans `docs/audit` (grep « hindi »/« devanagari ») | Retirer, ou mesurer sur Safari 16.4/Chrome/Firefox et le dire |
| character-counter | about | « UTF-8 bytes (what databases and SMS encodings count) » | FAUX | Fait externe : un SMS est codé en GSM 7 bits ou en UCS-2/UTF-16 (3GPP TS 23.038), jamais en UTF-8 ; le code calcule `TextEncoder` UTF-8 (`textTools.js:34`) | Retirer « SMS » |
| character-counter | about ; FAQ 2 | « an emoji (even a family or a flag) … is one character » / « 👍🏽 or 👨‍👩‍👧 count as 1 » | TROMPEUR | Sans `Intl.Segmenter` (Firefox 111-124, dans le plancher) : repli points de code (`textSegments.js:14`) → 👍🏽 = 2, 👨‍👩‍👧 = 5, e + accent combinant = 2 | Préciser « sur les navigateurs actuels (Firefox 125+, Chrome, Safari) » ou ajouter un repli |
| character-counter | interface | « Spaces » / « Without spaces » | TROMPEUR | « Spaces » compte tout graphème `\s` : tabulations et sauts de ligne inclus (`textTools.js:26`) ; « Without spaces » retire donc aussi les sauts de ligne (`:31`) | Dire « Spaces (incl. tabs and line breaks) » dans le texte de page |
| character-counter | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | Vrai | Question propre |
| character-counter | FAQ 5 | « No — everything happens in your browser. » | GÉNÉRIQUE | Vrai | Idem |

#### duplicate-remover

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| duplicate-remover | about | « Options make the comparison … and remove empty lines » | TROMPEUR | L'option laisse croire que les lignes vides sont gardées sinon ; or, case décochée, chaque ligne vide après la première est supprimée comme doublon (clé `''`, `textTools.js:45-48`) : les paragraphes perdent leurs séparations | Dire que les lignes vides répétées sont aussi des doublons (seule la 1ʳᵉ reste) |
| duplicate-remover | astuce 2 | « The count of removed lines tells you at a glance how many duplicates there were. » | TROMPEUR | Avec « Remove empty lines », les lignes vides retirées s'ajoutent au même compteur (`textTools.js:47`) ; affichage « N line(s) removed » (`duplicate-remover/page.jsx:36`) | « … lines removed (duplicates, plus empty lines if ticked) » |
| duplicate-remover | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | Vrai | Question propre |
| duplicate-remover | FAQ 5 | « No — everything happens in your browser. » | GÉNÉRIQUE | Vrai | Idem |

#### find-replace

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| find-replace | titre | « Find and Replace — Find and Replace Text Online Free » | GÉNÉRIQUE | `find-replace/layout.tsx:5` : répétition du nom, gabarit | Titre propre (texte brut ou regex, casse, mot entier) |
| find-replace | méta | « Find Replace is a free online tool. No sign-up, no watermarks, no limits. » | GÉNÉRIQUE | `find-replace/layout.tsx:6` : rien sur l'outil ; « watermarks » sans objet pour du texte | Méta propre |
| find-replace | interface | « Find and replace text instantly » | INVÉRIFIABLE | `find-replace/page.jsx:64` ; aucune mesure | Retirer « instantly » |
| find-replace | FAQ 3 | « Is matching case-sensitive? Yes, always — there's no case-insensitive option. » | FAUX | Case « Ignore case » (`:82`) → drapeau `i` (`:16`, `:32`) | « Case-sensitive by default; tick Ignore case » |
| find-replace | about ; étapes | (aucune mention de « Ignore case » ni de « Whole words only ») | MINCE | Deux options réelles (`:82-83`) ; « Whole words only » = pas à l'intérieur d'un mot, lettres/marques/chiffres de toutes écritures (`:30-35`) | Les décrire dans l'about et une étape |
| find-replace | about ; FAQ 1 | « opt into full regex matching » / « ^ $ taking on their regex meaning » | TROMPEUR | Syntaxe JavaScript, drapeaux `g` (+`i`) seulement (`:32-33`) : sans drapeau `m`, `^` et `$` ne visent que le début et la fin du texte entier, pas chaque ligne ; sans drapeau `u` (ajouté seulement avec « Whole words only », `:35`), `\p{L}` ou `\u{…}` ne sont pas compris | Dire « JavaScript regular expressions; ^ and $ match the start and end of the whole text » |
| find-replace | astuce 4 | « Keep a copy of your original text before replacing, since there's no undo button. » | FAUX | Le texte d'origine n'est jamais modifié : le résultat va dans un champ séparé « Result » (`:56`, `:92`) | Retirer ; dire que l'original reste dans la première zone |
| find-replace | FAQ 4 | « Yes, all text processing happens locally in your browser — nothing is uploaded to a server. » | GÉNÉRIQUE | Vrai pour le texte ; une erreur de regex affichée est signalée nettoyée (`:21`, `reportError.js:97` efface le motif `/…/`) | Phrase propre |

#### lorem-ipsum

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| lorem-ipsum | méta | « Lorem Ipsum is a free online tool. No sign-up, no watermarks, no limits. » | GÉNÉRIQUE | `lorem-ipsum/layout.tsx:6` : rien sur l'outil | Méta propre (paragraphes/phrases/mots, nombre exact, déterministe) |
| lorem-ipsum | étape 2 | « Enter how many you need (1 to 100). » | TROMPEUR | `max="100"` borne seulement les flèches du champ (`lorem-ipsum/page.jsx:28`) ; `lorem()` accepte tout entier ≥ 1 (`textTools.js:115`) — la FAQ 3 dit elle-même 500 mots. Champ vide ou 0 : le message « Enter a whole number of 1 or more. » n'est pas affiché (seulement signalé, `:16`), la page montre « Result is empty » (`:48`) | « Enter how many you need (1 or more; the arrows go to 100) » ; signaler au propriétaire le message non affiché |
| lorem-ipsum | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | Vrai | Question propre |
| lorem-ipsum | FAQ 4 | « No — everything happens in your browser. » | GÉNÉRIQUE | Vrai | Idem |
| lorem-ipsum | astuce 1 | « Use sentences for short labels and paragraphs for body text. » | GÉNÉRIQUE | — | Astuce propre (ex. 8-16 mots par phrase `textTools.js:109`, 5 phrases par paragraphe `:118`) |

#### sticky-notes

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| sticky-notes | titre | « Let You Jot Down Quick Colored Notes Online » | GÉNÉRIQUE | `sticky-notes/layout.tsx:5` : gabarit agrammatical | Titre propre |
| sticky-notes | FAQ 1 | « they persist across page refreshes and browser restarts on the same device and browser » | TROMPEUR | `localStorage` clé `sticky-notes` (`sticky-notes/page.jsx:7`, `:17`, `:26`) : en fenêtre privée le navigateur l'efface à la fermeture ; l'écriture n'est pas protégée (`:26`, pas de try) | Ajouter « except in a private window » |
| sticky-notes | astuce 1 | « Notes stay saved in this browser even after closing the tab or restarting your computer » | TROMPEUR | idem (`:26`) | idem |
| sticky-notes | FAQ 4 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | Vrai | Question propre (ex. modifier une note : impossible, supprimer sans confirmation `:35`, `:57`) |

#### text-comparator

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| text-comparator | titre | « Compare Two Texts Line Online Free » | GÉNÉRIQUE | `text-comparator/layout.tsx:5` : tronqué (« Line by Line ») | Titre propre, distinct du jumeau Diff Viewer |
| text-comparator | about | « the Myers diff algorithm (the one git and diffchecker use) » | INVÉRIFIABLE | `diffArrays` de la bibliothèque `diff` (`codeTools.js:50`, `:54`) ; git utilise Myers par défaut (fait externe) ; aucune source dans le dépôt pour diffchecker | Retirer « and diffchecker » |
| text-comparator | about ; interface | « case and spaces can be ignored » / « Ignore spaces » | TROMPEUR | La clé de ligne enlève les espaces de début/fin et réduit chaque suite d'espaces à une seule (`codeTools.js:53`) : « a b » et « ab » restent différents | « ignore leading/trailing spaces and the number of spaces between words » |
| text-comparator | astuce 2 | « Trailing spaces count as a difference; remove them first with the Whitespace Remover if they don't matter. » | TROMPEUR | Cocher « Ignore spaces » (`text-comparator/page.jsx:53`) les ignore déjà (`codeTools.js:53`) | « … unless you tick Ignore spaces » |
| text-comparator | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | Vrai | Question propre |
| text-comparator | FAQ 4 | « No — everything happens in your browser. » | GÉNÉRIQUE | Vrai (la bibliothèque `diff` est chargée depuis le site, `page.jsx:19`) | Idem |

#### text-encryptor

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| text-encryptor | méta | « obfuscates text with a password-based XOR cipher and Base64 encoding » | FAUX | Chiffrement AES-256-GCM, clé PBKDF2-SHA-256 600 000 itérations, sel 16 o + IV 12 o aléatoires, Base64 (`textCrypto.js:17`, `:30-44`) ; le XOR n'est plus qu'un déchiffrement de compatibilité (`:60-67`) | Méta = AES-256-GCM + PBKDF2, dans le navigateur |
| text-encryptor | about | « AES-256-GCM, the standard used by browsers, banks and messaging apps » | INVÉRIFIABLE | Aucune source dans le dépôt pour « banks and messaging apps » | Retirer l'incise |
| text-encryptor | about | « a wrong password or an altered text is refused, never turned into garbage » | TROMPEUR | Tout Base64 qui ne commence pas par « OCT1 » ou fait moins de 48 octets (texte AES coupé au début, Base64 quelconque) part dans le déchiffrement XOR de l'ancien format (`textCrypto.js:51`, `:60-64`), qui rend n'importe quel octet valide en UTF-8 : du charabia peut s'afficher, avec la note « Decrypted from the old XOR format… » (`text-encryptor/page.jsx:23`) | « … is refused for texts made since 29 September 2026; old-format texts cannot be checked » |
| text-encryptor | étape 2 | « Enter the password. » | LIBELLÉ | Le champ s'appelle « Secret Key » (`:34`), indication « Enter secret key... » (`:35`), sous-titre « Encrypt and decrypt text with a key » (`:30`) | « Enter the password in Secret Key » (ou renommer le champ) |
| text-encryptor | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | Vrai | Question propre |
| text-encryptor | FAQ 6 | « No — everything happens in your browser. » | GÉNÉRIQUE | Vrai (Web Crypto, `textCrypto.js:31-40`) | Idem |

#### text-repeater

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| text-repeater | titre | « Duplicate Any Text a Set Number Online Free » | GÉNÉRIQUE | `text-repeater/layout.tsx:5` : tronqué (« … of Times ») | Titre propre |
| text-repeater | about | « Text Repeater duplicates any text a set number of times with your choice of separator, entirely in your browser. » | MINCE | Une phrase = la méta. Manque : 1 à 100 répétitions avec message « Enter a whole number of repetitions from 1 to 100. » (`text-repeater/page.jsx:21`), séparateurs réels saut de ligne / espace / virgule + espace / rien (`:18`), bouton « Download » repeated.txt (`:54`) | Étoffer avec ces faits |
| text-repeater | astuce 4 | « For a custom separator beyond the four presets, generate with "None" and then find-and-replace in your destination editor. » | TROMPEUR | Avec « None », les copies sont collées sans rien entre elles (`:18`) : il n'y a plus de frontière à remplacer | Générer avec « New Line » puis remplacer les sauts de ligne |
| text-repeater | astuce 3 | « Copy the output directly into spreadsheets or code editors for seamless integration. » | GÉNÉRIQUE | — | Retirer |
| text-repeater | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | Vrai | Question propre |
| text-repeater | FAQ 4 | « Yes, everything is processed locally in your browser — what you enter is never sent to a server. » | GÉNÉRIQUE | Vrai | Idem |

#### text-reverser

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| text-reverser | about | « Text Reverser flips your text three ways — character order, word order, or line order — entirely in your browser. » | MINCE | Une phrase = la méta. Manque : « Reverse Words » ligne par ligne en gardant les espacements (`textSegments.js:148-155`), ponctuation collée à son mot, graphèmes entiers (`:146`) | Étoffer |
| text-reverser | FAQ 2 | « Yes, all characters are reversed exactly as they appear, whichever of the three modes you choose. » | FAUX | « Reverse Words » et « Reverse Lines » n'inversent pas les caractères (`textSegments.js:148-157`) ; la ponctuation reste attachée au mot (« Hello, world! » → « world! Hello, ») | Décrire chaque mode |
| text-reverser | FAQ 4 | « emoji with skin tones, family emoji, flags and accented letters stay whole » | TROMPEUR | Sans `Intl.Segmenter` (Firefox 111-124) : repli points de code (`textSegments.js:14`) → un emoji famille ou un accent combinant est découpé | Préciser les navigateurs |
| text-reverser | astuce 1 | « Use "Reverse Text" to check whether a word or phrase is a palindrome. » | TROMPEUR | Aucune normalisation de casse, d'espaces ni de ponctuation (`textSegments.js:146`) : « A man » → « nam A » ; une phrase-palindrome ne ressort pas identique | « … a word (case and spaces count) » |
| text-reverser | astuce 4 | « Copy large blocks of text in to reverse whole paragraphs at once instead of doing it manually. » | GÉNÉRIQUE | — | Retirer |
| text-reverser | FAQ 1 | « Yes, it's completely free with no signup and no limits. » | GÉNÉRIQUE | Vrai (aucune limite) | Question propre |
| text-reverser | FAQ 3 | « Yes, your text is processed locally and never sent to a server. » | GÉNÉRIQUE | Vrai | Idem |

#### text-sorter

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| text-sorter | titre | « Organize Lines of Text Alphabetically (a-z » | GÉNÉRIQUE | `text-sorter/layout.tsx:5` : parenthèse non fermée, gabarit tronqué | Titre propre |
| text-sorter | étape 2 | « Click A-Z, Z-A, By Length or Shuffle. » | LIBELLÉ | Boutons « Sort A-Z », « Sort Z-A », « Sort by Length », « Shuffle » (`text-sorter/page.jsx:37-40`) ; « Sort by Number (0-9) » et « Sort by Number (9-0) » (`:41-42`) absents de l'étape, de la méta, de l'about et du sous-titre (`:33`) | Libellés exacts + les deux tris numériques |
| text-sorter | FAQ 4 | « an unbiased Fisher-Yates shuffle » | FAUX | `j = rnd[i] % (i + 1)` sur des valeurs 32 bits (`:20-23`) : biais de modulo, au plus n/2³² (< 1 sur un million sous 4 295 lignes) | « Fisher-Yates driven by the browser's cryptographic generator » (sans « unbiased »), ou corriger le code |
| text-sorter | about | « accented letters sit next to their base letter (éclair before zebra) » | TROMPEUR | `Intl.Collator(undefined, …)` = langue du navigateur (`textTools.js:57-58`). Mesuré (Node) : en suédois « ål », « öl », « ærø » passent après « zebra », idem en danois ; « éclair » reste avant « zebra » partout | « … in your browser's language order (Swedish or Danish put å, ä, ö, æ, ø after z) » |
| text-sorter | about | « length counts characters as you see them » | TROMPEUR | Sans `Intl.Segmenter` (Firefox 111-124), repli points de code (`textSegments.js:14`) ; tri par longueur `textTools.js:65` | Préciser les navigateurs |
| text-sorter | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | Vrai | Question propre |
| text-sorter | FAQ 5 | « No — everything happens in your browser. » | GÉNÉRIQUE | Vrai | Idem |

#### text-to-list

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| text-to-list | titre | « Turn Lines of Pasted Text Online Free » | GÉNÉRIQUE | `text-to-list/layout.tsx:5` : gabarit tronqué | Titre propre |
| text-to-list | about | « Text to List turns lines of pasted text into a bullet list, numbered list, or comma-separated list, entirely in your browser. » | MINCE | Une phrase = la méta. Manque : puce « • », « 1. », séparateur « , » (`text-to-list/page.jsx:13-15`), lignes vides sautées, espaces de bord retirés en puces/numéros mais gardés en « Comma List » (`:15`), téléchargement list.txt (`:31`) | Étoffer |
| text-to-list | FAQ 3 | « Not currently — the only output option is copying the formatted text to your clipboard. » | FAUX | Bouton « Download » list.txt (`:31`, `FileDownload.jsx:208-212`), plus « Save / Share » quand le navigateur sait partager un fichier (`FileDownload.jsx:151-152`, `:213-218`) | « Copy, or download as a .txt file » |
| text-to-list | astuce 4 | « Paste the copied output directly into a word processor, which will typically auto-format bullet and numbered lists further. » | INVÉRIFIABLE | Comportement d'un logiciel tiers, aucune preuve | Retirer |
| text-to-list | FAQ 1 | « Yes, it's completely free with no signup and no limits. » | GÉNÉRIQUE | Vrai | Question propre |
| text-to-list | FAQ 4 | « Yes, everything happens locally in your browser — what you enter is never sent to a server. » | GÉNÉRIQUE | Vrai | Idem |

#### text-truncator

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| text-truncator | méta | « Text Truncator is a free online tool. No sign-up, no watermarks, no limits. » | GÉNÉRIQUE | `text-truncator/layout.tsx:6` : rien sur l'outil | Méta propre |
| text-truncator | about ; FAQ 3 | « an emoji or an accented letter is never cut in half » / « multi-part emoji and combining accents stay whole » | TROMPEUR | Sans `Intl.Segmenter` (Firefox 111-124) repli points de code (`textSegments.js:14`) : un accent combinant ou un emoji ZWJ peut être coupé ; la coupe en caractères est `textTools.js:84-85` | Préciser les navigateurs |
| text-truncator | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | Vrai | Question propre |
| text-truncator | FAQ 4 | « No — everything happens in your browser. » | GÉNÉRIQUE | Vrai | Idem |

#### whitespace-remover

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| whitespace-remover | FAQ 3 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | Vrai | Question propre |
| whitespace-remover | FAQ 6 | « Yes, all processing happens locally in your browser — what you enter is never sent to a server. » | GÉNÉRIQUE | Vrai | Idem |

#### word-counter

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| word-counter | titre | « Instantly Analyzes Text Online Free » | GÉNÉRIQUE | `word-counter/layout.tsx:5` : gabarit agrammatical | Titre propre |
| word-counter | méta ; about | « instantly analyzes text » | INVÉRIFIABLE | Recalcul à chaque saisie (`word-counter/page.jsx:12-19`) : « live » prouvé, « instantly » non mesuré | « live, as you type » |
| word-counter | méta ; about | « paragraph count » | TROMPEUR | Chaque ligne non vide compte comme un paragraphe (découpe `/\n+/`, `:17`) : un poème ou une liste de 10 lignes = 10 paragraphes | Dire « lines separated by a line break count as paragraphs » |
| word-counter | FAQ 4 | « Chinese, Japanese and Thai … are split into real words … numbers like "3.50" do not end a sentence » (et l'emoji compté 1) | TROMPEUR | Seulement avec `Intl.Segmenter` ; repli (Firefox 111-124) : regex qui compte une suite CJK/thaï comme un seul mot (`textSegments.js:26`), coupe de phrase à « 3. » (`:38`), points de code pour les caractères (`:14`) | Préciser les navigateurs |
| word-counter | astuce 2 | « Check "Characters" against social media limits, since some platforms count characters rather than words. » | TROMPEUR | « Characters » = graphèmes, espaces et sauts de ligne compris (`:13-14`) ; fait externe : X compte 2 pour un emoji ou un idéogramme et 23 pour une URL | Retirer, ou renvoyer vers une règle de plateforme précise |
| word-counter | astuce 4 | « Watch the "Sentences" count while editing to catch run-on sentences » | INVÉRIFIABLE | Le compteur donne un nombre de phrases (`:16`), il ne repère aucune phrase trop longue | Retirer |
| word-counter | astuce 3 | « Paste from Google Docs, Word, or any editor to instantly see stats for an existing document. » | GÉNÉRIQUE | — | Retirer |
| word-counter | FAQ 1 | « Yes, it's completely free with no signup and unlimited use. » | GÉNÉRIQUE | Vrai (aucune limite) | Question propre |
| word-counter | FAQ 2 | « Is my data saved? No, everything is processed locally in your browser — your text is never sent to a server. » | GÉNÉRIQUE | Vrai ; rien n'est enregistré (aucun stockage dans `word-counter/page.jsx`, `KeywordDensity.jsx`) | Idem |
| word-counter | FAQ 3 | « Can I use it for academic essays? Yes, it's well suited for checking word count requirements for assignments and applications. » | GÉNÉRIQUE | — | Remplacer par une vraie question (ex. ce qui compte comme mot) |

#### Synthèse du lot « text »

16 outils lus, **99 défauts** :
FAUX 10 · INVÉRIFIABLE 9 · TROMPEUR 23 · GÉNÉRIQUE 48 · MINCE 4 · LIBELLÉ 3 · FORMAT 2.
(Whitespace Remover n'a que 2 défauts, tous deux GÉNÉRIQUE : ses autres affirmations sont justes, `textTools.js:135-159`.)

Les plus graves : méta de Text Encryptor qui annonce un XOR (le code fait de l'AES-256-GCM) ; FAQ de Find and Replace
« no case-insensitive option » alors que la case « Ignore case » existe ; FAQ de Text to List « only output option is
copying » alors qu'un bouton « Download » existe ; méta d'ASCII Art « # and space characters » (une police sur 10).
Valeurs NON TROUVÉ : aucune (pas de limite de taille ni de quota dans ces outils : vérifié, voir `faits/text.json`).


---

### Lot dev-data

Lu : `docs/audit/p36/contenu-avant.json` (texte servi), `page.jsx`, `layout.tsx`, `seo.js`, `config.js`, workers et
tout ce qu'ils importent (`app/lib/csvParser.js`, `csvEncoding.js`, `fileChecks.js`, `jsonLossless.js`, `jsonToCsv.js`,
`yamlJson.js`, `dotenv.js`, `sheetDates.js`, `useToolError.js`, `reportError.js`, `app/components/CsvReadOptions.jsx`,
`DownloadReady.jsx`, `FileDownload.jsx`, `FileDropBridge.jsx`, `TextArea.jsx`, `UploadPrompt.jsx`).
Les affirmations douteuses ont été **exécutées** en Node sur les bibliothèques du dépôt (xlsx 0.18.5, js-yaml 4.1.1,
smol-toml 1.8.0, fast-xml-parser 5.11.1) et sur les fonctions du site (`yamlToJson`, `jsonToYaml`, `jsonToCsv`,
`sqlInsertsToCsv`, `dotenvToJson`), sans rien modifier.

Aucune des 16 pages n'appelle de route ni de service : aucun `fetch`, `/api/`, `XMLHttpRequest`, `sendBeacon` dans
leurs dossiers (vérifié par grep). Seule sortie réseau : un message d'erreur **affiché** est envoyé, nettoyé, à
`/api/report-error` (`app/lib/useToolError.js:28-29,47`, `app/lib/reportError.js:16,72-120`). Pas de quota, pas
d'inscription, pas de filigrane (sans objet : sorties texte / tableur).

Légende des types : FAUX, INVÉRIFIABLE, TROMPEUR, GÉNÉRIQUE, MINCE, LIBELLÉ, FORMAT (définitions de
`CONSIGNES-AUDIT-LOT2.md`).

#### csv-to-excel

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| csv-to-excel | étape 4 | « Click 'Convert' to build the workbook » | LIBELLÉ | Le bouton s'appelle « Convert to .xlsx » ou « Convert to .xls » selon le format choisi (`page.jsx:256`) ; texte à `page.jsx:269` | « Click "Convert to .xlsx" (or ".xls") » |
| csv-to-excel | about + FAQ (aucune) | « The file's character encoding is detected too — Excel's classic CSV export is Windows-1252, not UTF-8, and its accents come through intact » | TROMPEUR | Détection : BOM, sinon UTF-8 valide, sinon **page de code devinée d'après la langue du navigateur** (`app/lib/csvEncoding.js:86-93`, `ansiCodePageFor` :46-58), sur les 512 premiers Ko seulement (`csvEncoding.js:95,100`). Un fichier Windows-1252 ouvert dans un navigateur réglé en russe est lu en windows-1251. Le menu « Encoding: » (17 encodages, `csvEncoding.js:20-38`) n'apparaît que pour un fichier (`CsvReadOptions.jsx:11`, `page.jsx:245`) ; texte à `page.jsx:264` | Dire : UTF-8 / BOM reconnus, sinon encodage de l'Excel de la langue du navigateur ; menu « Encoding » pour corriger |
| csv-to-excel | FAQ 3 | « in a background Web Worker so the page never freezes » | INVÉRIFIABLE | Worker réel (`page.jsx:152`) mais « never » sans mesure dans `docs/audit/` ; texte `page.jsx:275` | « runs in a background worker; a Cancel button stops it » (Cancel : `page.jsx:253`) |
| csv-to-excel | FAQ 5 | « Does it support semicolon- or tab-delimited files … Yes » | FORMAT | `accept=".csv,text/csv"` (`page.jsx:195`) : un fichier `.tsv` ou `.txt` est refusé par le sélecteur et par le glisser-déposer (`app/components/FileDropBridge.jsx:27-33,66-70`). Le contenu tabulé n'est lu que dans un fichier nommé `.csv` ou collé ; texte `page.jsx:277` | Dire que seuls les fichiers `.csv` sont acceptés (un .tsv : le renommer ou coller son texte) |
| csv-to-excel | FAQ 6 | « 200,000 rows is the limit we've measured to convert reliably on desktop » | INVÉRIFIABLE | Valeur juste (`config.js:21` MAX_ROWS = 200000) mais les mesures ne sont qu'en commentaire (`config.js:1-20`), aucun rapport dans `docs/audit/` ; texte `page.jsx:278` | Garder 200,000 lignes (en-tête compris), retirer « we've measured » ou citer un rapport |
| csv-to-excel | astuce 3 | « Check the downloaded file's column alignment for CSVs with unusual formatting before relying on it. » | GÉNÉRIQUE | Copiable sur toute page CSV ; `page.jsx:284` | Remplacer par un fait propre : limites .xls 65,536 lignes / 256 colonnes (`csvToExcel.worker.js:75-76`), 32,767 caractères par cellule (`:79`) |
| csv-to-excel | étapes 1-2, FAQ 1, FAQ 4, FAQ 5, astuces 1 et 4 | « Click the upload area and select a .csv file, or paste CSV text directly into the box below it. » ; « The delimiter is detected automatically — check the dropdown… » ; « Both — upload a .csv file, or paste CSV text… » ; « Wrap a value in double quotes if it contains a comma (e.g. »… ; « The delimiter dropdown shows what was auto-detected… » | GÉNÉRIQUE | Phrases identiques mot pour mot sur csv-to-json et csv-to-sql (`docs/audit/p36/unicite-avant.json`, champ `repeated`) ; `page.jsx:266-267,273,276-277,282,285` | Réécrire chaque phrase avec ce qui est propre à Excel (cellules nombre, .xls, feuille « Sheet1 ») |
| csv-to-excel | toute la page | (absence) | MINCE | Rien sur : limites .xls 65,536 lignes / 256 colonnes et 32,767 caractères par cellule, avec leurs messages (`csvToExcel.worker.js:75-79`) ; une seule feuille nommée « Sheet1 » (`:82`) ; fichier `converted.xlsx`/`.xls` (`page.jsx:161`) ; case « Numbers as number cells » (`page.jsx:245`) ; plafond 250 MB (`page.jsx:29`) ; bouton Cancel (`page.jsx:253`) | Ajouter ces faits |

#### csv-to-json

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| csv-to-json | méta | « Up to 500,000 rows, in your browser » | TROMPEUR | 500,000 = fichiers sur ordinateur (`config.js:12`) ; **70,000** sur téléphone/tablette (`config.js:19`, `page.jsx:97`) et **70,000** pour le texte collé sur tout appareil (`config.js:28`, `page.jsx:153`) ; texte `seo.js:15` | « Up to 500,000 rows from a file on a computer (70,000 on a phone or for pasted text) » |
| csv-to-json | about + FAQ 1 | « converts … into an array of JSON objects » ; « An array with one object per row … indented with two spaces » | FORMAT | Le menu « Output » propose aussi « Array of arrays (header row first) » et « JSON Lines (one object per line) » (`page.jsx:262-267`, `csvToJson.worker.js:73-75`) ; JSON Lines n'est pas indenté et se télécharge en `converted.jsonl` (`page.jsx:168`). Aucune ligne du texte ne le dit ; `page.jsx:279`, `seo.js:17` | Présenter les 3 formes de sortie et l'extension .jsonl |
| csv-to-json | étape 4 | « click 'Download' to save converted.json » | TROMPEUR | `converted.jsonl` quand la sortie est JSON Lines (`page.jsx:168`) ; `page.jsx:284` | « converted.json (converted.jsonl for JSON Lines) » |
| csv-to-json | FAQ 6 | « The tool detects the encoding from the file's bytes and decodes it accordingly » | TROMPEUR | Seuls BOM et validité UTF-8 viennent des octets ; sinon page de code d'après la langue du navigateur (`csvEncoding.js:86-93`), 512 premiers Ko (`:95`) ; `seo.js:22` | Même correction que csv-to-excel |
| csv-to-json | FAQ 7 + FAQ 8 | « pasted text is capped lower, at 70,000 rows » ; « Why is the pasted-text limit lower than the file-upload limit? … on both desktop and mobile » | TROMPEUR | Sur téléphone/tablette, fichier et collage ont le **même** plafond 70,000 (`config.js:19,28`) ; `seo.js:23-24` | « On a computer, pasted text is capped at 70,000 rows (files 500,000); on a phone both are 70,000 » |
| csv-to-json | FAQ 4 | « in a background Web Worker so the page never freezes » | INVÉRIFIABLE | « never » sans mesure ; en mode collage le résultat est rendu dans la zone de texte (`page.jsx:171,229`) ; `seo.js:20` | Retirer « never » |
| csv-to-json | FAQ 5 | « Does it support delimiters other than commas, like semicolons or tabs? … auto-detected from the file » | FORMAT | `accept=".csv,text/csv"` (`page.jsx:205`) : `.tsv`/`.txt` refusés (`FileDropBridge.jsx:66-70`) ; `seo.js:21` | Dire « .csv file or pasted text » |
| csv-to-json | étape 5 | « Validate the JSON in a linter or your target application before relying on it. » | GÉNÉRIQUE | Copiable partout ; `page.jsx:285` | Remplacer par un fait : en-têtes en double renommés `name_2`, en-tête vide → `column_N` (`csvToJson.worker.js:50-59`) |
| csv-to-json | étapes 1-2, FAQ 3, FAQ 5, astuces 2 et 4 | (mêmes phrases que csv-to-excel) | GÉNÉRIQUE | Identiques sur csv-to-excel et csv-to-sql (`unicite-avant.json`) ; `page.jsx:281-282,292,294`, `seo.js:19,21` | Réécrire, propre au JSON |

#### csv-to-sql

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| csv-to-sql | about | « Column and table names typed into the Table Name field are not escaped, so avoid spaces or SQL reserved words there. » | FAUX | Table et colonnes sont mises entre guillemets selon la base : `"…"` (guillemet doublé), `` `…` `` ou `[…]` (`csvToSql.worker.js:12-16,93-94`). La FAQ 3 dit l'inverse (`seo.js:24`) ; texte `page.jsx:279` | Supprimer ; dire que les noms sont quotés pour la base choisie |
| csv-to-sql | astuce 1 | « the table name and column headers are inserted as-is — avoid spaces, quotes, or reserved SQL keywords » | FAUX | Même code (`csvToSql.worker.js:12-16,93-94`) ; `page.jsx:291` | Supprimer |
| csv-to-sql | FAQ 8 | « The tool detects the encoding from the file's bytes » | TROMPEUR | `csvEncoding.js:86-93,95` ; `seo.js:29` | Comme csv-to-excel |
| csv-to-sql | FAQ 9 | « pasted text is capped lower, at 65,000 rows on any device » | TROMPEUR | Sur téléphone, fichier = collage = 65,000 (`config.js:18,25`) ; `seo.js:30` | « lower than the 400,000-row file cap of a computer; on a phone both are 65,000 » |
| csv-to-sql | FAQ 7 | « Does it support semicolon- or tab-delimited files … » | FORMAT | `accept=".csv,text/csv"` (`page.jsx:212`) ; `seo.js:28` | Comme csv-to-excel |
| csv-to-sql | étapes 1-5 | (aucune étape pour la base) | MINCE | Le menu « Database » (Standard SQL / MySQL / MariaDB / SQL Server) est le premier contrôle (`page.jsx:201-206`) ; il change guillemets, échappement et types (`csvToSql.worker.js:12-16`) ; étapes `page.jsx:280-286` | Ajouter l'étape « Choose the database » |
| csv-to-sql | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | Phrase présente sur des dizaines de pages (`unicite-avant.json`) ; `seo.js:22` | Supprimer ou remplacer par un fait |
| csv-to-sql | astuce 5 | « Always review generated SQL — and test it on a development database — before running it against production. » | GÉNÉRIQUE | Copiable sur sql-formatter ; `page.jsx:295` | Remplacer : colonne entièrement vide → VARCHAR(1) ; en-tête vide → nom `""` (`csvToSql.worker.js:67,86`) |
| csv-to-sql | étapes 2-3, FAQ 6, FAQ 7, astuces 3-4 | (mêmes phrases que csv-to-excel) | GÉNÉRIQUE | `unicite-avant.json` ; `page.jsx:282-283,293-294`, `seo.js:27-28` | Réécrire |

#### csv-to-tsv

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| csv-to-tsv | FAQ 3 | « The tool detects this from the file's bytes and decodes it accordingly » | TROMPEUR | `csvEncoding.js:86-93` (repli = langue du navigateur) ; `page.jsx:53` ; `seo.js:4` | Comme csv-to-excel |
| csv-to-tsv | interface + étape 1 | « Choose a .csv file » / « Click or drop a .csv file here » | FORMAT | `accept=".csv,.txt,text/csv"` : les `.txt` sont aussi acceptés (`page.jsx:85`), jamais dit (`page.jsx:84,113`) | « a .csv or .txt file » |
| csv-to-tsv | FAQ 1 | « What's the difference between CSV and TSV? » | GÉNÉRIQUE | Même question sur tsv-to-csv (`tsv-to-csv/seo.js:2`) ; définition encyclopédique ; `seo.js:2` | Remplacer par un fait propre (valeur commençant par un guillemet mise entre guillemets, `page.jsx:27`) |
| csv-to-tsv | FAQ 4 | « No, the conversion happens entirely in your browser. » | GÉNÉRIQUE | Réponse identique sur 8 pages du lot (`unicite-avant.json`) ; `seo.js:5` | Une phrase propre : le fichier est lu en entier dans la page (`page.jsx:52-57`) |

#### excel-to-csv

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| excel-to-csv | méta + about | « converts every sheet to comma-separated CSV text » ; « converts it to comma-separated CSV text » | TROMPEUR | Menu « Separator » : Comma / Semicolon / Tab / Pipe (`page.jsx:170-173`, `excelToCsv.worker.js:119`) ; cases « Decimal comma (3,14 …) » (`page.jsx:175`, worker `:82-95`) et « Add a UTF-8 BOM … » (`page.jsx:176`, worker `:119`). Aucune des trois options n'est citée dans le texte ; `layout.tsx:6`, `page.jsx:205` | Dire les 4 séparateurs, la virgule décimale et le BOM |
| excel-to-csv | étapes 1-2 | « select an .xlsx, .xls, or .ods file. » ; « Conversion starts automatically in the background — no button click needed. » | TROMPEUR | La conversion part dès le choix du fichier avec les options du moment (`page.jsx:100,159`) ; changer ensuite Separator / Decimal comma / BOM ne reconvertit pas (aucun gestionnaire) | Étape 1 : « Choose the separator and options first », étape 2 : choisir le fichier |
| excel-to-csv | FAQ 4 + interface | « Uploaded files are capped at 150,000 rows across all sheets combined and 90 MB on desktop » ; « Supports workbooks up to 150,000 rows » | TROMPEUR | Téléphone/tablette : **50,000 lignes et 30 MB** (`config.js:34-36`, `page.jsx:75-78`) ; le HTML servi est rendu avec `isMobile = false` (`page.jsx:60`) et ne dit jamais la limite du téléphone ; `page.jsx:167,217` | Dire les deux limites en clair |
| excel-to-csv | FAQ 4 | « measured to convert reliably » | INVÉRIFIABLE | Mesures seulement en commentaire (`config.js:9-19`), aucun rapport dans `docs/audit/` ; `page.jsx:217` | Retirer « measured » ou citer un rapport |
| excel-to-csv | FAQ 5 | « only cell values transfer — formatting, formulas' calculated results (not the formulas themselves as text), and structure like merged cells don't. » | FAUX | `sheet_to_csv` écrit la valeur de chaque cellule : une formule donne son **résultat calculé** (`excelToCsv.worker.js:119`) ; l'astuce 4 d'excel-to-json dit l'inverse (`excel-to-json/page.jsx:208`) ; `page.jsx:218` | « formulas give their calculated result, not the formula; formatting and merges are lost » |
| excel-to-csv | FAQ 2 | « in a background Web Worker so the page never freezes » | INVÉRIFIABLE | « never » sans mesure ; `page.jsx:215` | Retirer « never » |
| excel-to-csv | FAQ 3 | « The tool shows you the sheet count and names next to the Download button. » | TROMPEUR | Le cadre « N sheets detected: … » n'apparaît que s'il y a **plus d'une** feuille, pendant la conversion, au-dessus de la barre de progression et du téléchargement (`page.jsx:185-188`) | « When the workbook has several sheets, their count and names are shown as soon as it is read » |
| excel-to-csv | about + astuce 1 | « exactly as before » ; « Multi-sheet workbooks now come back as a .zip » | MINCE | Vocabulaire de journal de modifications (« as before », « now »), sans information pour le visiteur ; `page.jsx:205,222` | Supprimer « as before / now » ; dire le nom du ZIP `converted.zip` et des fichiers (nom de feuille, caractères `\ / : * ? " < > |` remplacés par `_`, doublons « (2) ») (`excelToCsv.worker.js:17-34,139`) |
| excel-to-csv | FAQ 1, FAQ 2 (question), FAQ 4 | « What file formats does it support? » ; « Is my file uploaded to a server? » ; « Why is there a row and file-size limit? … » | GÉNÉRIQUE | Questions et FAQ 4 identiques sur excel-to-json (`unicite-avant.json`) ; `page.jsx:214-217` | Réécrire, propre au CSV |

#### excel-to-json

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| excel-to-json | astuce 2 | « Empty cells are simply omitted from that row's object rather than appearing as null » | FAUX | `sheet_to_json(…, { defval: null })` : une cellule vide garde sa clé avec `null` (`excelToJson.worker.js:67-69`) ; l'about dit l'inverse (`page.jsx:190`) ; `page.jsx:206` | Supprimer ; dire « empty cells keep their key with null » |
| excel-to-json | FAQ 4 + interface | « capped at 150,000 rows … and 90 MB on desktop » | TROMPEUR | Téléphone/tablette : 50,000 lignes et 30 MB (`config.js:14-16`, `page.jsx:71-74`) jamais dits dans le HTML servi ; `page.jsx:161,201` | Dire les deux limites |
| excel-to-json | FAQ 4 | « measured to convert reliably » | INVÉRIFIABLE | Mesures en commentaire seulement (`config.js:1-9`) ; `page.jsx:201` | Retirer ou citer un rapport |
| excel-to-json | FAQ 2 | « so the page never freezes » | INVÉRIFIABLE | `page.jsx:199` | Retirer « never » |
| excel-to-json | toute la page | (absence) | MINCE | Rien sur le cas .csv : clé de feuille `Sheet1`, toutes les valeurs lues comme texte (`excelToJson.worker.js:51-52`), virgule, point-virgule et tabulation reconnus ; lignes entièrement vides ignorées ; en-têtes en double renommés `name_1` (vérifié en exécutant xlsx 0.18.5 avec les options de `excelToJson.worker.js:52,69`) ; feuilles masquées incluses (`SheetNames`, `:54,65`) | Ajouter ces faits |
| excel-to-json | FAQ 1, FAQ 2 (question), FAQ 4 | (mêmes que excel-to-csv) | GÉNÉRIQUE | `unicite-avant.json` ; `page.jsx:198-201` | Réécrire |

#### json-to-csv

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| json-to-csv | méta | « using the browser's built-in JSON.parse » | TROMPEUR | `JSON.parse` ne sert que de validateur ; les valeurs sont lues par l'analyseur sans perte du site, pour ne pas arrondir les grands nombres (`app/lib/jsonLossless.js:9-12,37-39`, `app/lib/jsonToCsv.js:11,36`) ; `layout.tsx:6` | « numbers written exactly as in the JSON (a 20-digit id is not rounded) » |
| json-to-csv | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | `unicite-avant.json` ; `page.jsx:48` | Supprimer |
| json-to-csv | étapes 3-4 | « Review the result in the output box. » ; « Click 'Copy' to copy it to your clipboard. » | GÉNÉRIQUE | Identiques sur tsv-to-csv (`unicite-avant.json`) ; `page.jsx:44-45` | Réécrire avec le bouton Download |
| json-to-csv | toute la page | (absence) | MINCE | Interface 14 mots, pas d'exemple ; rien sur le bouton « Download » de `data.csv` (`page.jsx:29`, `FileDownload.jsx:211`) ; messages d'erreur « The JSON must be an array of objects, or a single object. » / « The JSON array is empty… » (`jsonToCsv.js:40-41`) et erreur de syntaxe du navigateur affichée telle quelle (`page.jsx:18`) ; `null` → cellule vide (`jsonToCsv.js:29`) ; valeur commençant/finissant par une espace mise entre guillemets (`:31`) ; au-delà de 1,000,000 caractères la zone affiche un extrait (`app/components/TextArea.jsx:17-18`) | Ajouter un exemple et ces faits |

#### json-to-xml

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| json-to-xml | astuce 1 | « A top-level JSON array is wrapped in a generic <item> element per entry, since XML documents need exactly one root element. » | TROMPEUR | Toute sortie est enveloppée dans un élément **`<root>`** (`page.jsx:50-51`), précédée de `<?xml version="1.0" encoding="UTF-8"?>` (`:52`) ; un tableau donne `<root><item>…</item><item>…</item></root>` (vérifié avec fast-xml-parser 5.11.1). La racine n'est jamais nommée dans le texte ; `page.jsx:90` | « The output always has a <root> element; a top-level array becomes one <item> per entry inside it » |
| json-to-xml | astuce 4 | « Validate the output … especially for very unusual key names (XML tag names have their own rules, e.g. they can't start with a digit). » | TROMPEUR | Une clé invalide n'est pas écrite : l'outil s'arrête avec « The key "…" can't be an XML element name: … Rename it and convert again. » (`page.jsx:11-26,39-40`) ; `page.jsx:93` | Dire ce refus et la règle (lettre ou `_` d'abord, puis lettres, chiffres, `_ . - :`) |
| json-to-xml | astuce 3 | « Special characters in text values no longer need manual escaping » | MINCE | « no longer » = journal de modifications ; redit la FAQ 3 ; `page.jsx:92` | Supprimer |
| json-to-xml | FAQ 1, étapes 1 et 4 | « Yes, it's completely free with no signup required. » ; « Paste your JSON into the input box. » ; « Click 'Copy' to copy the result to your clipboard. » | GÉNÉRIQUE | `unicite-avant.json` (json-to-yaml, json-to-toml) ; `page.jsx:78,81,84` | Réécrire |
| json-to-xml | toute la page | (absence) | MINCE | Rien sur : `<root>` et la déclaration XML (`page.jsx:51-52`) ; clés `@_nom` → attributs et `#text` → texte (`page.jsx:8-10,45`) ; `null` → élément vide `<n/>` (vérifié) ; nombres gardés exactement (`page.jsx:34-38`) ; bouton Download `data.xml` (`page.jsx:65`) ; message « Invalid JSON: … » (`page.jsx:54`) ; pas d'exemple | Ajouter |

#### json-to-yaml

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| json-to-yaml | astuce 3 | « The output uses YAML's block style throughout » | TROMPEUR | Un tableau ou objet vide est écrit `[]` / `{}` (style en ligne) : vérifié avec `jsonToYaml` (`app/lib/yamlJson.js:46-51`, js-yaml 4.1.1) ; `page.jsx:54` | « block style, except empty lists and objects written [] and {} » |
| json-to-yaml | astuce 4 | « some YAML consumers interpret edge cases (like unquoted 'yes'/'no') differently » | TROMPEUR | L'outil écrit déjà `'yes'`, `'no'`, `'on'`, `'off'`, `'y'`, `'null'`, `'123'`, `'2024-01-01'` **entre apostrophes** (vérifié, `yamlJson.js:50`) : la sortie ne contient pas ces valeurs nues ; `page.jsx:55` | « strings such as yes, no, on, off are written in quotes, so YAML 1.1 readers keep them as text » |
| json-to-yaml | FAQ 1, étapes 1 et 4 | « Yes, it's completely free with no signup required. » ; « Paste your JSON into the input box. » ; « Click 'Copy' to copy the result to your clipboard. » | GÉNÉRIQUE | `unicite-avant.json` ; `page.jsx:40,43,46` | Réécrire |
| json-to-yaml | toute la page | (absence) | MINCE | Pas d'exemple ; rien sur le bouton Download `data.yaml` (`page.jsx:27`), le message « Invalid JSON: … » (`page.jsx:16`), l'ordre des clés gardé, les grands nombres (dit dans l'about seulement) | Ajouter un exemple et ces faits |

#### json-to-toml

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| json-to-toml | about | « numbers, booleans, and ISO date strings are typed correctly rather than left as quoted text » | FAUX | Aucune chaîne n'est transformée en date (`page.jsx:22-34`) ; smol-toml 1.8.0 écrit `"2024-01-15T10:00:00Z"` **entre guillemets** (vérifié en exécutant `stringify`) ; `page.jsx:67` | « date strings stay quoted strings (JSON has no date type) » |
| json-to-toml | astuce 3 | « ISO 8601 date strings in your JSON convert to TOML's native date-time type automatically. » | FAUX | Même preuve ; `page.jsx:80` | Supprimer |
| json-to-toml | méta | « numbers, booleans and dates keep their types » | FAUX | Même preuve (dates) ; en plus un nombre JSON `1.0` devient l'entier TOML `1` (vérifié : `parseJsonLossless` → `Number` `page.jsx:25-27`, smol-toml écrit `1`) ; `seo.js:20` | « numbers and booleans keep their types » |
| json-to-toml | FAQ 1, FAQ 6, étape 4, astuce 4 | « Yes, it's completely free with no signup required. » ; « No, conversion happens entirely in your browser. » ; « Click 'Copy' to copy the result to your clipboard. » ; « Always validate the output with a TOML linter or parser… » | GÉNÉRIQUE | `unicite-avant.json` ; `seo.js:2,7`, `page.jsx:72,81` | Remplacer par : entiers au-delà de 9,223,372,036,854,775,807 et flottants au-delà d'un double écrits en texte avec un avis (`page.jsx:21-26,58`) ; bouton Download `data.toml` (`:55`) |

#### toml-to-json

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| toml-to-json | FAQ 4 | « Can I download the JSON as a file? » — « No, there's only a 'Copy' button » | FAUX | Bouton Download du fichier `data.json` (`page.jsx:43`, `TextDownload` → `FileDownload.jsx:211`) ; `seo.js:5` | « Yes — Download saves data.json, Copy copies the text » |
| toml-to-json | astuce 4 | « Review the output for very large integers — JSON numbers lose precision beyond 2^53, same limitation as any other JSON tool. » | FAUX | `parse(input, { integersAsBigInt: 'asNeeded' })` puis écriture chiffre pour chiffre (`page.jsx:18,27`) : `9007199254740993` sort intact (vérifié) ; `page.jsx:69` | « integers of any size up to 64 bits are written digit for digit » |
| toml-to-json | FAQ 1, étape 2 | « Yes, it's completely free with no signup required. » ; « Click 'Convert' to parse it into JSON. » | GÉNÉRIQUE | `unicite-avant.json` ; `seo.js:2`, `page.jsx:58` | Remplacer par : `inf` / `nan` écrits `null` avec un avis (`page.jsx:19,30`) ; heures locales écrites `07:32:00.000` (vérifié) |

#### tsv-to-csv

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| tsv-to-csv | FAQ 1 | « What's the difference between TSV and CSV? » | GÉNÉRIQUE | Même question sur csv-to-tsv ; `seo.js:2` | Remplacer : champs entre guillemets d'un export Excel (tabulations, retours à la ligne) lus comme une seule cellule (`page.jsx:22-45`) ; lignes de sortie terminées par CRLF (`:46`) |
| tsv-to-csv | FAQ 3 | « No, the conversion happens entirely in your browser. » | GÉNÉRIQUE | `unicite-avant.json` ; `seo.js:4` | Fusionner dans une phrase propre |
| tsv-to-csv | étapes 3-4 | « Review the result in the output box. » ; « Click 'Copy' to copy it to your clipboard. » | GÉNÉRIQUE | Identiques sur json-to-csv ; `page.jsx:70-71` ; le bouton Download `data.csv` (`page.jsx:56`) manque aux étapes | Réécrire avec Download |

#### xml-to-json

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| xml-to-json | FAQ 1, étape 2, astuce 4 | « Yes, completely free with no registration required. » ; « Click 'Convert' to parse it into JSON. » ; « Copy the result or download it as a file; nothing is saved on a server, and leaving the page before either asks first. » | GÉNÉRIQUE | Identiques sur yaml-to-json / toml-to-json / tsv-to-csv (`unicite-avant.json`) ; `page.jsx:74,79,89` | Réécrire |
| xml-to-json | toute la page | (absence) | MINCE | Pas d'exemple ; rien sur : déclaration `<?xml …?>` retirée (`page.jsx:29`) ; texte mêlé aux balises (`<p>Hello <b>world</b> again</p>`) → parties jointes dans `#text` avec un avis (`page.jsx:38-43`) ; CDATA fusionné dans le texte, élément vide `<e/>` → `""` (vérifié) ; nom du fichier `data.json` (`page.jsx:59`) | Ajouter un exemple et ces faits |

#### yaml-to-json

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| yaml-to-json | about | « Values are never silently altered » | FAUX | Seuls les **entiers** sont gardés exacts (`yamlJson.js:53-64`) ; les flottants passent par `yaml.types.float` (`:69`) : `version: 1.10` → `1.1`, `3.141592653589793238` → `3.141592653589793`, `1e3` → `1000`, et `0012` → `12` (vérifié en exécutant `yamlToJson`) ; `page.jsx:38` | « integers keep every digit; decimals are written as JSON numbers (1.10 → 1.1): quote a version number to keep it as text » |
| yaml-to-json | titre | « Convert Full YAML (Nested, Lists) » | TROMPEUR | Schéma = noyau YAML 1.2 sans étiquettes explicites (`yamlJson.js:66-71`, `explicit: []`) : `!Ref` / `!Sub` (CloudFormation), `!!binary`, `!!timestamp` sont refusés avec « Invalid YAML: unknown tag … » (vérifié) ; `layout.tsx:5` | Retirer « Full » ; dire les étiquettes non prises en charge |
| yaml-to-json | FAQ 1, FAQ 4, étapes 2 et 4 | « Yes, completely free with no registration required. » ; « No, conversion happens entirely in your browser. » ; « Click 'Convert' to parse it into JSON. » ; « Click 'Copy' to copy the JSON result. » | GÉNÉRIQUE | `unicite-avant.json` ; `page.jsx:41,43,46,49` | Réécrire |
| yaml-to-json | toute la page | (absence) | MINCE | Pas d'exemple ; rien sur : clés de fusion `<<: *base` (docker-compose, GitLab CI) prises en charge (`yamlJson.js:68-69`) ; `yes`/`no`/`on`/`off` restent du texte (YAML 1.2, vérifié) — essentiel pour Ansible / Kubernetes ; bouton Download `data.json` (`page.jsx:27`) | Ajouter |

#### sql-to-csv

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| sql-to-csv | FAQ 6 | « NULL is written as the word NULL in the CSV, so you can tell it apart from an empty string. » | FAUX | `if (/^NULL$/i.test(t)) return '';` — NULL devient un **champ vide** (`sqlToCsv.js:56`) ; vérifié : `(NULL, '')` → `,` ; `seo.js:19` | « NULL becomes an empty field (like an empty string) » |
| sql-to-csv | astuce 3 | « Headers come from the column list in the first matching INSERT statement — make sure it's representative of the rest. » | TROMPEUR | Si un INSERT suivant liste d'autres colonnes ou un autre ordre, l'outil s'arrête : « The INSERT statements for … list their columns in different orders or sets … » (`sqlToCsv.js:98-99`) ; `page.jsx:55` | Dire ce contrôle |
| sql-to-csv | étapes 1-4 | (aucune étape pour plusieurs tables) | MINCE | Un dump qui insère dans plusieurs tables affiche « This SQL inserts into N tables (…); a CSV holds one table. Choose the table to convert. » et un bouton « Convert table <nom> » par table (`sqlToCsv.js:76-77`, `page.jsx:33`) ; jamais dit ; étapes `page.jsx:43-48` | Ajouter l'étape |
| sql-to-csv | FAQ 8 | « and the SQL never leaves your browser » | TROMPEUR | Le message d'erreur affiché est envoyé à `/api/report-error` (`useToolError.js:28-29`) ; les noms de tables et de colonnes y figurent sans guillemets (`sqlToCsv.js:77,99`), donc non masqués par le nettoyage (`reportError.js:115-117` ne masque que le texte entre guillemets et les longs nombres) | « your SQL is not uploaded; if an error appears, its message (which can name tables or columns) is reported to us » — ou masquer ces noms dans le code (décision propriétaire) |
| sql-to-csv | FAQ 8 | « Yes, it's completely free with no signup required » | GÉNÉRIQUE | `unicite-avant.json` ; `seo.js:21` | Supprimer |

#### env-to-json

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| env-to-json | méta | « can convert a flat JSON object back into .env lines » | TROMPEUR | Un objet ou tableau imbriqué est accepté et écrit en texte JSON (`app/lib/dotenv.js:85-91`) ; seul un tableau / une valeur au premier niveau est refusé (`:104`) ; `layout.tsx:6` | « a JSON object (nested values written as JSON text) » |
| env-to-json | about | « dotenv, the parser used by Node.js, Next.js and Vite » | INVÉRIFIABLE | Le dépôt prouve l'égalité avec `dotenv.parse` / `dotenv-expand` (`docs/audit/RAPPORT-qualite-29-09.md:51,136`), pas qui utilise dotenv ; `page.jsx:54` | « follows the rules of the dotenv library (checked against dotenv.parse) » |
| env-to-json | FAQ 1, FAQ 5, étape 4 | « Yes, it's completely free with no signup required. » ; « No, parsing and conversion happen entirely in your browser. » ; « Click 'Copy' to copy the result. » | GÉNÉRIQUE | `unicite-avant.json` ; `page.jsx:59,62,66` | Remplacer : bouton Download (`page.jsx:37`), lignes ignorées listées par numéro (`page.jsx:19`), messages d'erreur JSON → .env (`dotenv.js:99,104,107`) |

#### Observation transversale (hors décompte, à arbitrer par le propriétaire)

Les 16 pages disent « nothing is uploaded / never uploaded ». C'est vrai pour le fichier et le texte. Mais tout message
d'erreur affiché part, nettoyé, à `/api/report-error` (`app/lib/useToolError.js:28-29,47`) ; le nettoyage
(`app/lib/reportError.js:72-120`) masque chemins, noms de fichier, URL, courriels, texte entre guillemets et nombres de
7 chiffres ou plus, pas les mots nus. Cas réels : noms de tables / colonnes (sql-to-csv, compté ci-dessus), nom d'une
étiquette YAML inconnue (`unknown tag !<!Ref>`, yaml-to-json). Il faut soit le dire une fois par page, soit le masquer
dans le code.

#### Synthèse du lot dev-data (16 outils lus)

| Type | Nombre |
|---|---|
| FAUX | 11 |
| INVÉRIFIABLE | 8 |
| TROMPEUR | 22 |
| GÉNÉRIQUE | 24 |
| MINCE | 11 |
| LIBELLÉ | 1 |
| FORMAT | 5 |
| **Total** | **82** |

(Une ligne GÉNÉRIQUE peut regrouper plusieurs phrases d'une même page quand elles ont la même preuve.)

Les plus graves : yaml-to-json « Values are never silently altered » (1.10 → 1.1, 0012 → 12) ; sql-to-csv « NULL is
written as the word NULL » (champ vide en réalité) ; toml-to-json « No, there's only a 'Copy' button » (le bouton
Download existe) ; json-to-toml « ISO date strings are typed » (restent du texte) ; csv-to-sql « names … are not
escaped » (ils le sont, selon la base) ; excel-to-json « Empty cells are simply omitted » (elles valent null) ;
excel-to-csv « formulas' calculated results … don't [transfer] » (c'est justement ce qui est écrit).


---

### Lot dev-code

Lecture seule, 05/10/2026. Texte servi : `docs/audit/p36/contenu-avant.json`. Code : `app/tools/developer-tools/<outil>/{layout.tsx,page.jsx}`
et ce qu'ils importent (`app/lib/jsonCodegen.js`, `jsonToPhp.js`, `jsonText.js`, `jsonLossless.js`, `codeTools.js`, `codeFormat.js`,
`htmlMinify.js`, `useToolError.js`, `reportError.js`, `app/components/FileDownload.jsx`, `TextArea.jsx`).

**Vérifications exécutées** (scripts Node locaux dans le dossier temporaire de session, sur les moteurs installés dans `node_modules`,
mêmes options que le code ; aucun serveur, aucun navigateur) : quicktype-core 26.0.0, sucrase 3.35.1, terser 5.51.2, csso 5.0.5,
js-beautify 2.0.3, sql-formatter 15.9.0, sass 1.105.0, fast-xml-parser 5.11.1 ; `jsonText.js`, `jsonToPhp.js` et la fonction
`splitXmlTags` de xml-formatter rejouées telles quelles. Les résultats cités « (vérifié) » viennent de ces exécutions.

**Faits communs aux 18 pages** (valent pour toutes les lignes ci-dessous) :
- Aucun champ fichier (`input type=file`) : saisie par collage/frappe seulement ; `FileDropBridge` (app/components/FileDropBridge.jsx:14-25) n'agit que s'il existe un champ fichier → sans effet ici.
- Traitement dans le navigateur ; le moteur est chargé par `import()` au clic (codeTools.js:21,27,32,41,69,74 ; jsonCodegen.js:53 ; codeFormat.js:176-187 ; xml-formatter/page.jsx:76). Aucun `fetch` vers une route d'outil, donc ni quota (`lib/quota/guard.js` non appelé), ni inscription.
- **Exception de confidentialité** : tout message d'erreur AFFICHÉ est envoyé (≤ 300 caractères, nettoyé : URL, e-mails, chemins, noms de fichiers, passages entre guillemets, longs nombres remplacés) à `/api/report-error` (useToolError.js:98-110,116-131 ; reportError.js:16-17,72-121,133-171), sauf navigateur piloté par robot (reportError.js:139). Le texte collé lui-même n'est pas envoyé, mais un fragment non entre guillemets présent dans le message (ex. la ligne de code citée par Sass) peut l'être.
- Chaque résultat a une ligne de téléchargement : nom du fichier + bouton « Download » (FileDownload.jsx:200-212, TextDownload :278-282) ; sur iPhone/iPad, bouton « Save / Share » en plus (FileDownload.jsx:91-96,213-217). Quitter la page avant Copy/Download déclenche la question « Leave page? » du navigateur (FileDownload.jsx:24-30,69-81).
- Aucune limite de taille dans le code. Seul seuil : au-delà de 1 000 000 caractères, la zone de texte n'affiche que les 20 000 premiers (TextArea.jsx:17-18,47-76) ; l'outil travaille sur tout le texte.

#### Tableau des défauts

### json-to-csharp
| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| json-to-csharp | titre | « Generate a Single 'root' Class Online » | FAUX | quicktype génère une classe par objet imbriqué (jsonCodegen.js:53-70) ; vérifié : `Root` + `Item` | « JSON to C# Class — Generate C# Classes with JsonPropertyName » (une classe par objet imbriqué) |
| json-to-csharp | méta | « generates a single 'Root' class with one property per top-level JSON key » | FAUX | idem jsonCodegen.js:53-70 ; json-to-csharp/layout.tsx:6 | Dire : une classe par objet imbriqué, long/double, nullable, attribut [JsonPropertyName], dans le navigateur |
| json-to-csharp | about | « optional or null fields become nullable » | TROMPEUR | vérifié : un champ `null` dans TOUS les exemples sort `public object Maybe` (non nullable) ; seul un champ absent ou parfois null devient `long?`/`string?` | « fields missing from some elements, or null in some, become nullable; a field that is always null is typed object » |
| json-to-csharp | étapes 1-4 | « Paste a JSON object or array… / Click 'Convert': one named type is generated… » | GÉNÉRIQUE | texte identique mot pour mot sur go/python/rust/typescript (page.jsx:40-43 des 5 pages) | Étapes propres au C# (nom de fichier `Model.cs`, bouton « Download », espace de noms `App`) |
| json-to-csharp | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | page.jsx:46 ; même phrase sur les 18 pages | Supprimer ou remplacer par un fait propre (aucune limite, rien envoyé) |
| json-to-csharp | FAQ 4 | « No, generation happens entirely in your browser. » | GÉNÉRIQUE | page.jsx:49 ; copiable sur toute page ; omet l'envoi du message d'erreur (useToolError.js:98-110) | Bloc confidentialité précis : quicktype chargé au clic, JSON jamais envoyé, seul un message d'erreur nettoyé l'est |

### json-to-go
| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| json-to-go | titre | « Generate a Single Root Struct Online » | FAUX | une struct par objet imbriqué (jsonCodegen.js:53-70) ; vérifié : `RootElement` + `Nested` | « JSON to Go Struct — Generate Go Structs with json Tags » |
| json-to-go | méta | « generates a single Root struct with one field per top-level JSON key » | FAUX | idem ; json-to-go/layout.tsx:6 | Une struct par objet imbriqué, int64/float64, pointeurs + omitempty pour champs facultatifs |
| json-to-go | étapes 1-4 | « Paste a JSON object or array… » | GÉNÉRIQUE | identique sur 5 pages (page.jsx:40-43) | Étapes propres (fichier `model.go`) |
| json-to-go | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | page.jsx:46 | idem csharp |
| json-to-go | FAQ 4 | « No, generation happens entirely in your browser. » | GÉNÉRIQUE | page.jsx:49 | idem csharp |

### json-to-php
| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| json-to-php | titre | « Generate a Class Definition Online Free » | TROMPEUR | sortie par défaut = tableau PHP (`useState('array')`, page.jsx:12) ; classes seulement en option (page.jsx:32) | « JSON to PHP — Array or Typed PHP 8 Classes » |
| json-to-php | méta | « generates a class definition with one typed property per top-level JSON key » | FAUX | défaut = tableau (page.jsx:12,15) ; en mode classes, une classe par objet imbriqué (jsonToPhp.js:143-152,162-193) | Décrire les deux sorties (tableau `$data = [...]`, classes PHP 8 avec fromArray()) |
| json-to-php | interface (H1 + sous-titre) | « JSON to PHP Class » / « Generate PHP classes from JSON » | TROMPEUR | page.jsx:22-23 alors que le bouton radio coché d'office est « PHP array… » (page.jsx:12,31) | Sous-titre : « Convert JSON to a PHP array or typed PHP classes » |
| json-to-php | about | « nullable types for fields that are null or missing » | TROMPEUR | un champ null dans tous les exemples est typé `mixed` sans `?` (jsonToPhp.js:141,173) ; vérifié `public mixed $n` | « …nullable types for fields that are missing or sometimes null (always-null fields are typed mixed) » |
| json-to-php | astuce 1 | « 'PHP array' gives you a ready return [...] body » | FAUX | la sortie est `<?php` puis `$data = [ … ];` (jsonToPhp.js:61-64) — aucun `return` | « …gives `$data = [...];` — replace `$data =` by `return` for a config file » |
| json-to-php | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | page.jsx:51 | idem csharp |

### json-to-python
| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| json-to-python | titre | « Generate a Python @dataclass Online » | TROMPEUR | une dataclass par objet imbriqué (jsonCodegen.js:19,53-70) ; vérifié : `Nested` + `RootElement` | « JSON to Python — Generate @dataclass Classes » |
| json-to-python | méta | « generates a Python @dataclass with one type-annotated field per top-level JSON key » | FAUX | idem ; json-to-python/layout.tsx:6 | Une dataclass par objet imbriqué, List[…], Optional, noms snake_case |
| json-to-python | about | « fields that are missing or null become Optional » | TROMPEUR | vérifié : champ null dans tous les exemples → `maybe: None = None` (pas `Optional[…]`) ; champ absent ou parfois null → `Optional[...] = None` | « fields missing from some elements or sometimes null become Optional; an always-null field is typed None » |
| json-to-python | étapes 1-4 | « Paste a JSON object or array… » | GÉNÉRIQUE | identique sur 5 pages (page.jsx:40-43) | Étapes propres (fichier `model.py`) |
| json-to-python | astuce 3 | « Rename the Root class to something specific to your data. » | TROMPEUR | pour un tableau en entrée la classe s'appelle `RootElement` (vérifié, quicktype python sans alias) | « Rename the Root (or RootElement, for a top-level array) class… » |
| json-to-python | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | page.jsx:46 | idem csharp |
| json-to-python | FAQ 5 | « No, generation happens entirely in your browser. » | GÉNÉRIQUE | page.jsx:50 | idem csharp |

### json-to-rust
| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| json-to-rust | titre | « Generate a Single Root Struct » | FAUX | une struct par objet imbriqué (jsonCodegen.js:22,53-70) ; vérifié | « JSON to Rust — Generate serde Structs » |
| json-to-rust | méta | « generates a single Root struct with one field per top-level JSON key » | FAUX | idem ; json-to-rust/layout.tsx:6 | Structs serde par objet imbriqué, Option<T>, Vec<…>, rename |
| json-to-rust | étapes 1-4 | « Paste a JSON object or array… » | GÉNÉRIQUE | identique sur 5 pages (page.jsx:40-43) | Étapes propres (fichier `model.rs`, dépendances serde) |
| json-to-rust | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | page.jsx:46 | idem csharp |

### json-to-typescript
| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| json-to-typescript | titre | « Generate a Single Root Interface Online » | FAUX | une interface par objet imbriqué (jsonCodegen.js:18,53-70) ; vérifié `Root` + `Nested` | « JSON to TypeScript — Generate Interfaces from JSON » |
| json-to-typescript | méta | « generates a single Root interface with one field per top-level JSON key » | FAUX | idem ; json-to-typescript/layout.tsx:6 | Une interface par objet imbriqué, champs facultatifs `?`, unions |
| json-to-typescript | étape 3 | « fields missing from some elements or holding null are marked optional » | FAUX | en TypeScript un null donne `b: number \| null` (vérifié), pas `?` ; seul un champ absent reçoit `?` | « fields missing from some elements get ?, null values give \| null » |
| json-to-typescript | étapes 1-4 | « Paste a JSON object or array… » | GÉNÉRIQUE | identique sur 5 pages (page.jsx:40-43) | Étapes propres (fichier `types.ts`) |
| json-to-typescript | FAQ 5 | « No, there's only a 'Copy' button — paste the copied code into a file yourself. » | FAUX | `<TextDownload text={output} name="types.ts" />` (page.jsx:27) → bouton « Download » (FileDownload.jsx:211) | « Yes — click 'Download' to save it as types.ts, or 'Copy'. » |
| json-to-typescript | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | page.jsx:46 | idem csharp |

### typescript-to-js
| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| typescript-to-js | méta | « strips type annotations using regex pattern matching, not the real TypeScript compiler » | FAUX | Sucrase (analyseur) : codeTools.js:68-71 ; page.jsx:13 | « …removes TypeScript types with Sucrase's parser, in your browser » |
| typescript-to-js | about | « removes TypeScript syntax and keeps your JavaScript » | FAUX | vérifié : `namespace N { export const a = 1; }` → sortie VIDE, sans message (Sucrase 3.35.1, options codeTools.js:70) | Dire que les `namespace` contenant du code sont supprimés sans avertissement |
| typescript-to-js | FAQ 3 | « everything else that only exists for the type system is removed » | TROMPEUR | la question porte sur les namespaces : ceux qui contiennent du code exécutable sont supprimés aussi (vérifié) | « Namespaces are removed entirely, including values inside them — move that code out first » |
| typescript-to-js | FAQ 4 | « Does it support TSX? Yes — JSX in the file is kept as JSX. » | FORMAT | JSX activé seulement si le texte contient une balise ET `return (<` (page.jsx:13) ; vérifié : `const A = (p: {n: string}) => <div>{p.n}</div>;` → « Unexpected token, expected ";" (1:28) » | « TSX works when a component returns JSX with `return <…>` / `return (<…>)`; JSX after `=>` is not recognised » (ou corriger le code) |
| typescript-to-js | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | page.jsx:42 | idem csharp |
| typescript-to-js | FAQ 5 | « No — everything runs in your browser; the engine is downloaded once when you first click. » | GÉNÉRIQUE | page.jsx:46 ; même phrase sur 7 pages (scss, css, html, js-formatter, js-minifier, sql) | Bloc confidentialité propre (Sucrase chargé au clic ; message d'erreur nettoyé envoyé) |

### scss-to-css
| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| scss-to-css | titre | « Lightweight SCSS to CSS Transform » | FAUX | Dart Sass `compileString` (codeTools.js:73-76), sass 1.105.0 | « SCSS to CSS — Compile SCSS with Dart Sass Online » |
| scss-to-css | méta | « a lightweight text transform, not a real Sass compiler: it strips comments and rewrites simple parent-selector patterns » | FAUX | idem codeTools.js:73-76 ; vérifié : variables, mixins, @extend, @each, sass:math compilés | Décrire Dart Sass, sortie Expanded/Compressed, erreurs avec ligne |
| scss-to-css | about | « Everything Sass supports works » | TROMPEUR | `@import`/`@use` d'un fichier → « Can't find stylesheet to import » (vérifié) ; syntaxe indentée `.sass` impossible (`syntax = 'scss'` fixe, codeTools.js:73 ; la page ne passe que `style`, page.jsx:14) | « All SCSS features work except importing your own files; indented .sass syntax isn't accepted » |
| scss-to-css | FAQ 4 | « No — everything runs in your browser » | TROMPEUR | en cas d'erreur, `reportShownMessage(e)` (page.jsx:14) envoie le message Sass, qui cite la ligne de code fautive (vérifié : « 1 │ .a { color: $nope; } »), à /api/report-error (reportError.js:133-171) | « Your SCSS is compiled in your browser; if an error is shown, that error message (which can quote the faulty line) is sent to us, shortened, to fix bugs » |
| scss-to-css | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | page.jsx:44 | idem csharp |

### code-formatter
| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| code-formatter | about | « Prettier, the formatter most JavaScript projects use » | INVÉRIFIABLE | aucune mesure dans le dépôt | « formatted by Prettier 3 » |
| code-formatter | FAQ 4 | « Its meaning, never. » | INVÉRIFIABLE | absolu non prouvé (Prettier peut retoucher HTML/Markdown) ; aucun rapport dans docs/audit | « JSON: only whitespace changes. Other languages: printed in Prettier's style (quotes, semicolons, line wrapping) » |
| code-formatter | FAQ 5 | « the result shows the line and column of the first error » | TROMPEUR | sans position fournie par le moteur, le message sort sans ligne : codeFormat.js:270 (CodeSyntaxError …0,0), :214 (« This XML is not well-formed », 0,0), :235 (SQL sans « at line » → message brut) ; affichage codeFormat.js:276-281 | « …shows the line and column when the formatter reports them » |
| code-formatter | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | page.jsx:97 | idem csharp |

### code-minifier
| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| code-minifier | titre | « Strip Comments and Collapses Whitespace » | FAUX | JS : Terser compress+mangle (codeTools.js:20-24) ; CSS : CSSO (codeTools.js:26-29) — bien plus que retirer commentaires/espaces ; faute d'accord « Collapses » | « Code Minifier — Minify JavaScript, TypeScript, CSS and HTML » |
| code-minifier | méta | « strips comments and collapses whitespace for JS, TS, CSS, and HTML » | TROMPEUR | idem ; vrai seulement pour HTML (htmlMinify.js:52-131) | Terser (renomme, supprime le code mort), CSSO (fusionne les règles), HTML (commentaires, espaces) |
| code-minifier | about | « (the engine behind webpack and Vite) » | INVÉRIFIABLE | aucune preuve dans le dépôt (codeTools.js:15-18 dit seulement « the engine the reference sites use ») | Retirer l'incise |
| code-minifier | about | « HTML loses comments and the whitespace between tags » | FAUX | une suite d'espaces devient UN espace, jamais rien (htmlMinify.js:81-90) | « HTML loses comments; each run of whitespace becomes a single space » |
| code-minifier | about | « Code that doesn't parse is reported instead of producing a broken file. » | FAUX | vrai pour JS/TS (Terser/Sucrase lèvent une erreur) ; CSS : CSSO tolère, vérifié `}}} a{{ ` → sortie vide sans erreur, `a { color: red` → `a{color:red}` ; HTML : minifyHtml ne lève jamais (htmlMinify.js:52-131) | « JavaScript or TypeScript that doesn't parse is reported; CSS and HTML are never rejected » |
| code-minifier | FAQ 3 | « the type annotations are removed (as the TypeScript compiler does) » | TROMPEUR | Sucrase sans JSX (page.jsx:18 `typescriptToJs(input)`) : TSX refusé ; namespace avec du code supprimé sans message (vérifié) | « …removed by Sucrase (TSX isn't accepted here; namespaces are dropped) » |
| code-minifier | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | page.jsx:53 | idem csharp |
| code-minifier | FAQ 4 | « No — everything runs in your browser; each engine is downloaded once when you first use it. » | GÉNÉRIQUE | page.jsx:56 | Bloc confidentialité propre |

### css-formatter
| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| css-formatter | méta | « using simple pattern-based rules, rather than a full CSS parser » | FAUX | Format = js-beautify (codeTools.js:31-35), Minify = CSSO, analyseur CSS (codeTools.js:26-29) | « …formats CSS with js-beautify and minifies it with CSSO, in your browser » |
| css-formatter | FAQ 2 | « Can formatting or minifying break my CSS? No — both parse the CSS first » | TROMPEUR | du CSS invalide n'est jamais signalé : js-beautify le formate tel quel (vérifié `a { color: red` → sans accolade fermante) ; CSSO jette ce qu'il ne comprend pas (vérifié `}}} a{{ ` → sortie vide) | « Valid CSS keeps its meaning; invalid CSS is not reported — Minify may drop the parts it can't read » |
| css-formatter | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | page.jsx:46 | idem csharp |
| css-formatter | FAQ 4 | « No — everything runs in your browser; the engine is downloaded once when you first click. » | GÉNÉRIQUE | page.jsx:49 | Bloc confidentialité propre |

### html-formatter
| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| html-formatter | titre | « Add Line Breaks Online Free » | TROMPEUR | ré-indentation complète par js-beautify, y compris <script>/<style> (codeTools.js:36) ; même suffixe que javascript-formatter | « HTML Formatter — Beautify and Indent HTML Online » |
| html-formatter | méta | « using simple pattern-based rules, not a full parser » | FAUX | js-beautify html (codeTools.js:31-36) ; décrit l'ancien code remplacé le 29/09 (codeTools.js:1-18) | « re-indents HTML with js-beautify, keeps <pre>/<textarea> as written, formats inline CSS/JS » |
| html-formatter | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | page.jsx:42 | idem csharp |
| html-formatter | FAQ 4 | « No — everything runs in your browser; the engine is downloaded once when you first click. » | GÉNÉRIQUE | page.jsx:45 | Bloc confidentialité propre |

### javascript-formatter
| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| javascript-formatter | titre | « Add Line Breaks Online Free » | TROMPEUR | js-beautify + Terser (page.jsx:12-17) ; même suffixe qu'html-formatter | « JavaScript Formatter — Beautify or Minify JS Online » |
| javascript-formatter | méta | « adds line breaks and indentation around braces, brackets, and commas » | TROMPEUR | js-beautify complet (codeTools.js:37) + Minify Terser (codeTools.js:20-24) | Décrire Format (js-beautify, 2 espaces) et Minify (Terser) |
| javascript-formatter | about | « Formatting only changes indentation and line breaks » | TROMPEUR | js-beautify ajoute aussi des espaces (vérifié `var a=1` → `var a = 1`, `if(a)` → `if (a)`) | « Formatting only changes whitespace (indentation, line breaks, spaces around operators) » |
| javascript-formatter | about | « blank lines kept, at most two in a row » | FAUX | `max_preserve_newlines: 2` (codeTools.js:34) = au plus UNE ligne vide ; vérifié 4 lignes vides → 1 | « blank lines kept, at most one in a row » |
| javascript-formatter | astuce 2 | « A syntax error in minify mode shows its position in the output box. » | FAUX | la page affiche `'Error: ' + e.message` (page.jsx:16) ; Terser met la position dans e.line/e.col, pas dans le message (vérifié : « Name expected ») | Supprimer, ou afficher e.line/e.col dans le code d'abord |
| javascript-formatter | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | page.jsx:46 | idem csharp |
| javascript-formatter | FAQ 4 | « No — everything runs in your browser; the engine is downloaded once when you first click. » | GÉNÉRIQUE | page.jsx:49 | Bloc confidentialité propre |

### js-minifier
| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| js-minifier | méta | « strips comments and tightens spacing around punctuation » | FAUX | Terser compress + mangle (codeTools.js:20-24) : renomme les variables locales, supprime le code mort (vérifié `if (false) {…}` supprimé, `longName` → `r`) | « minifies JavaScript with Terser: shorter local names, dead code removed, in your browser » |
| js-minifier | about | « the minifier used by webpack, Vite and most JavaScript minification sites » | INVÉRIFIABLE | aucune preuve dans le dépôt | « minifies JavaScript with Terser » |
| js-minifier | about | « Code that doesn't parse is reported with the error position » | FAUX | `'Error: ' + e.message` seulement (page.jsx:13) ; message Terser sans position (vérifié « Name expected », position dans e.line/e.col) | « Code that doesn't parse is reported (Terser's message) instead of output » |
| js-minifier | étape 3 | « If the code has a syntax error, the message shows where » | FAUX | idem page.jsx:13 | « …an error message replaces the output; fix it and minify again » |
| js-minifier | astuce 2 | « the original minifiers of many sites silently output broken code in that case » | INVÉRIFIABLE | aucune mesure des autres sites dans docs/audit | Retirer la comparaison |
| js-minifier | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | page.jsx:43 | idem csharp |
| js-minifier | FAQ 5 | « No — everything runs in your browser; the engine is downloaded once when you first click. » | GÉNÉRIQUE | page.jsx:47 | Bloc confidentialité propre |

### json-formatter
| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| json-formatter | titre | « Parse Your JSON Online Free » | GÉNÉRIQUE | même suffixe que json-minifier (layout.tsx:5 des deux) ; ne dit ni format ni validation | « JSON Formatter — Format, Validate and Sort JSON Online » |
| json-formatter | méta | « keeping every number and escape exactly as written » | TROMPEUR | avec « Sort keys A-Z » les chaînes sont réécrites par JSON.stringify (jsonText.js:102-103) : vérifié `"é\/"` → `"é/"` ; une clé en double ne garde que la dernière valeur | « …keeping every number exactly as written (and escapes too, unless keys are sorted) » |
| json-formatter | about | « Format adds 2-space indentation » | TROMPEUR | retrait au choix 2 espaces / 4 espaces / tabulation (page.jsx:15,29,45) | « Format indents with 2 spaces, 4 spaces or a tab » |
| json-formatter | about | « escapes stay exactly as you wrote them » | TROMPEUR | idem méta (jsonText.js:102-103) | Préciser l'exception « Sort keys A-Z » |
| json-formatter | étape 4 | « If the JSON is invalid, an 'Invalid JSON' error appears instead of output. » | GÉNÉRIQUE | doublon de l'étape 3 (page.jsx:61-62) | Supprimer l'étape 4 |
| json-formatter | astuce 3 | « There's no file upload or download » | FAUX | `<TextDownload text={output} name="formatted.json" />` (page.jsx:40) → bouton « Download » | « No file upload: paste your JSON; take the result with 'Copy' or 'Download' (formatted.json) » |
| json-formatter | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | page.jsx:66 | idem csharp |
| json-formatter | FAQ 5 | « No, formatting and minifying both happen entirely in your browser. » | GÉNÉRIQUE | page.jsx:70 | Bloc confidentialité propre |

### json-minifier
| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| json-minifier | titre | « Parse Your JSON Online Free » | GÉNÉRIQUE | même suffixe que json-formatter | « JSON Minifier — Compress JSON to One Line, Numbers Unchanged » |
| json-minifier | FAQ 3 | « You'll see 'Invalid JSON' with the parser's own explanation instead of output » | TROMPEUR | en cas d'erreur seule l'erreur change ; le résultat précédent et la ligne « Saved … » restent affichés (page.jsx:13 ne vide pas `output` ; page.jsx:22,30) | « …an 'Invalid JSON' message appears (a previous result stays in the output box) » — ou vider la sortie dans le code |
| json-minifier | astuce 4 | « There's no file upload or download » | FAUX | `<TextDownload text={output} name="minified.json" />` (page.jsx:23) | « …copy the result or download it as minified.json » |
| json-minifier | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | page.jsx:43 | idem csharp |
| json-minifier | FAQ 4 | « No, minifying happens entirely in your browser. » | GÉNÉRIQUE | page.jsx:46 | Bloc confidentialité propre |

### sql-formatter
| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| sql-formatter | titre | « Break a Fixed List Online Free » | FAUX | bibliothèque sql-formatter 15.9.0 (codeTools.js:40-43) ; décrit l'ancien code | « SQL Formatter — Format SQL for 12 Dialects Online » |
| sql-formatter | méta | « breaks common SQL keywords onto new lines and adds a line break after every comma » | FAUX | analyse du SQL ; vérifié : `count(a, b)` reste sur une ligne, commentaires et chaînes intacts | « formats SQL with sql-formatter: upper-case keywords, 2-space indent, 12 dialects, in your browser » |
| sql-formatter | about | « the open-source library behind many online SQL beautifiers » | INVÉRIFIABLE | aucune preuve dans le dépôt | « the open-source sql-formatter library » |
| sql-formatter | FAQ 3 | « …Redshift, Spark, Db2 and others » | FAUX | exactement 12 dialectes dans la liste (page.jsx:29) ; les 20 dialectes sont dans Code Formatter (codeFormat.js:35-56) | Lister les 12, sans « and others » ; renvoyer à Code Formatter pour ClickHouse, DuckDB, Trino, Hive… |
| sql-formatter | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | page.jsx:46 | idem csharp |
| sql-formatter | FAQ 4 | « No — everything runs in your browser; the engine is downloaded once when you first click. » | GÉNÉRIQUE | page.jsx:49 | Bloc confidentialité propre |

### xml-formatter
| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| xml-formatter | méta | « re-indents XML using line-based text processing, not a real XML parser » | TROMPEUR | le XML est d'abord validé par l'analyseur fast-xml-parser (page.jsx:74-82) ; seule la ré-indentation est textuelle (page.jsx:83-91) | « checks that your XML is well-formed, then re-indents it with 2 spaces, in your browser » |
| xml-formatter | about | « It still doesn't validate whether the XML is well-formed » | FAUX | `XMLValidator.validate` → « Invalid XML (line L, column C): … » et pas de sortie (page.jsx:76-82) ; vérifié `<a><b></a>` → erreur ligne 1 col 7 | « Malformed XML (unclosed or mismatched tags…) is reported with its line and column » |
| xml-formatter | about | « <![CDATA[...]]> sections, <!--...--> comments… copied through untouched » | FAUX | chaque ligne, y compris à l'intérieur d'un CDATA ou commentaire sur plusieurs lignes, est `trim()` puis ré-indentée (page.jsx:84-86) ; vérifié `   keep  ` → `  keep` | « …never split; but inside a multi-line CDATA or comment, each line's leading spaces are replaced by the indentation » (ou corriger le code) |
| xml-formatter | about | « handles the XML declaration and self-closing tags without breaking indentation » | TROMPEUR | vrai pour ces deux cas ; mais une balise répartie sur plusieurs lignes ou un attribut contenant `>` n'ouvre pas de niveau alors que sa fermeture en retire un (regex page.jsx:89, décrément page.jsx:85) ; vérifié : toute la suite décalée | Signaler la limite : balises sur plusieurs lignes / `>` dans un attribut cassent l'indentation |
| xml-formatter | FAQ 2 | « No — …so it won't catch structural errors like unclosed or mismatched tags. » | FAUX | idem page.jsx:76-82 | « Yes — the XML is checked first; an error names its line and column » |
| xml-formatter | astuce 1 | « For strict validation…, use a dedicated XML validator, not this formatter. » | TROMPEUR | la validation de bonne forme existe (page.jsx:76-82) ; pas de validation DTD/XSD, et plusieurs éléments racine sont acceptés (vérifié `<a>x</a><b/>` → valide) | « It checks well-formedness, not a DTD or XSD schema » |
| xml-formatter | FAQ 1 | « Yes, completely free with no registration required. » | GÉNÉRIQUE | page.jsx:124 | idem csharp |
| xml-formatter | FAQ 4 | « No, formatting happens entirely in your browser. » | GÉNÉRIQUE | page.jsx:127 | Bloc confidentialité propre |

#### Synthèse du lot dev-code

18 outils lus, **106 défauts** :
- **FAUX : 35**
- **TROMPEUR : 25**
- **INVÉRIFIABLE : 6**
- **GÉNÉRIQUE : 39**
- **FORMAT : 1**
- **MINCE : 0** (chaque page a 228 à 455 mots, dont un « About » propre à l'outil)
- **LIBELLÉ : 0** (tous les boutons cités existent : Convert, Copy, Format, Minify, Sort keys A-Z, Auto-detect, Expanded/Compressed, JS/TS/CSS/HTML, PHP array/PHP classes)

Cause dominante : les **titres et méta-descriptions** de 15 pages (layout.tsx) décrivent encore l'ANCIEN code
remplacé le 29/09 (« regex », « not a real Sass compiler », « single Root struct », « Break a Fixed List », « pattern-based
rules »), alors que la section About de la même page décrit le nouveau moteur — la page se contredit elle-même.

**Défauts de code découverts au passage** (hors texte, pour le propriétaire — non corrigés, lot en lecture seule) :
1. `app/lib/jsonCodegen.js:73-74` : quand un entier dépasse 64 bits, la note est préfixée par `// Note:` pour toutes les cibles sauf PHP — en **Python** cela produit un fichier invalide (`//` n'est pas un commentaire Python ; vérifié), et la note dit « typed as a float » alors que quicktype tape `int` en Python.
2. `typescript-to-js/page.jsx:13` : JSX reconnu seulement avec `return (<` ; un composant fléché `=> <div>` échoue.
3. Sucrase supprime sans message les `namespace` contenant du code (TypeScript to JS et Code Minifier mode TS).
4. `json-minifier/page.jsx:13` : la sortie précédente n'est pas vidée en cas d'erreur.
5. `code-minifier/page.jsx:34` : en mode TS le fichier téléchargé s'appelle `minified.ts` alors qu'il contient du JavaScript ; `code-minifier/page.jsx:40` et `js-minifier/page.jsx:30` affichent « Saved N characters » calculé sur le texte « Error: … » après une erreur.
6. `css-formatter/page.jsx:27` et `javascript-formatter/page.jsx:27` : le fichier s'appelle `formatted.css` / `formatted.js` même après Minify ; `json-formatter/page.jsx:40` : `formatted.json` même après Minify.
7. `json-formatter/page.jsx:20-21` ne retire pas le BOM (json-minifier le fait, page.jsx:13) : un JSON avec BOM y est déclaré « Invalid JSON » (vérifié).
8. `csso` n'est pas une dépendance déclarée dans package.json (présent seulement comme dépendance de svgo, node_modules/svgo/package.json:81) alors que codeTools.js:27 l'importe.
9. `sql-formatter/page.jsx:14` affiche le message brut de sql-formatter, qui peut faire des dizaines de lignes (vérifié : grammaire complète pour une parenthèse non fermée), alors que Code Formatter le résume (codeFormat.js:232-243).


---

### Lot dev-encode

Pages lues : `developer-tools/base64-encoder`, `file-tools/base64-encoder`, `developer-tools/url-encoder`,
`text-tools/url-encoder`, `developer-tools/html-encoder`, `developer-tools/html-entity-decoder`,
`developer-tools/hex-to-text`, `developer-tools/unicode-converter`, `developer-tools/hash-generator`,
`developer-tools/jwt-decoder`, `developer-tools/url-parser`, `developer-tools/number-base-converter`,
`math-tools/number-base-converter`.

Sources : texte servi (`docs/audit/p36/contenu-avant.json`) confronté au code (`app/tools/<cat>/<outil>/page.jsx` et
`layout.tsx`, `app/lib/textCodecs.js`, `app/lib/hashAlgorithms.js`, `app/tools/developer-tools/hash-generator/{seo.js,hash.worker.js}`,
`app/lib/jwtVerify.js`, `app/lib/exactNumbers.js`, `app/components/{BaseConverter,TextArea,FileDownload,UploadPrompt,FileDropBridge}.jsx`,
`app/lib/{fileSignature,fileChecks,isMobileDevice,useToolError,reportError}.js`). Les numéros de ligne des `page.jsx` sont ceux
du fichier (la 1re ligne de certains fichiers porte un BOM, sans effet sur la numérotation).

Constats communs aux 13 pages (vérifiés, donc absents des tableaux) :
- Aucun appel réseau dans le code de ces outils (aucun `fetch`, `/api/`, `XMLHttpRequest`, `sendBeacon` dans les pages,
  `textCodecs.js`, `jwtVerify.js`, `hashAlgorithms.js`, `exactNumbers.js`, `BaseConverter.jsx`, `TextArea.jsx`). Seul départ
  possible : le TEXTE d'un message d'erreur affiché, nettoyé (`app/lib/useToolError.js:19-31`, `app/lib/reportError.js:16,72-119`
  : ni fichier, ni contenu, ni texte entre guillemets, URL, courriel ou long nombre) vers `/api/report-error`. Les affirmations
  « nothing is uploaded / never sent to a server » sont donc justes et ne figurent pas dans les tableaux, sauf quand elles sont
  la phrase-type copiée de page en page (GÉNÉRIQUE).
- Aucune inscription, aucun quota : aucune de ces pages n'appelle une route payante ni `lib/quota/guard.js`.
- Aucun filigrane (sans objet : sorties texte).
- Tout résultat texte non pris arme « Quitter la page ? » (`app/components/FileDownload.jsx:24-30,69-80`) ; copier compte comme
  prendre (`FileDownload.jsx:40-67`).

Artefact d'extraction à connaître (pas un défaut de page) : `scripts/p36/extract-content.mjs:17` décode `&amp;` AVANT `&nbsp;`
et `&#x…;`, donc le JSON montre doublement décodé ce que la page affiche littéralement. Ex. HTML Encoder : la page affiche
« such as &nbsp; or &copy; … &#x1F600; — so already-escaped text like &amp;lt; correctly decodes to &lt;, not < »
(`app/tools/developer-tools/html-encoder/page.jsx:29`, chaîne JS rendue telle quelle), le JSON montre « such as  or &copy; … 😀 …
decodes to <, not < ». Les rédacteurs doivent partir du code, pas du JSON, pour ces deux pages et pour HTML Entity Decoder.

#### 1. /tools/developer-tools/base64-encoder

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| base64-encoder (dev) | titre | « Base64 Encoder — Convert Text Online Free » | GÉNÉRIQUE | Outil = encodage ET décodage, texte en UTF-8, option URL-safe (`page.jsx:12-18,26`) ; « Convert Text Online Free » se colle sur n'importe quelle page texte | Titre qui dit encode + decode, UTF-8, URL-safe |
| base64-encoder (dev) | méta | « using the built-in btoa()/atob() functions » | TROMPEUR | Le texte est d'abord converti en octets UTF-8 (TextEncoder) puis passé à btoa (`app/lib/textCodecs.js:15,23-24`) ; décodage atob + TextDecoder UTF-8 strict (`textCodecs.js:38-44`). btoa seul refusait tout caractère > U+00FF (`textCodecs.js:4-5`) | « encodes text as UTF-8, then Base64 (standard or URL-safe); decodes standard and URL-safe Base64 » |
| base64-encoder (dev) | about | « the encoding every API, email system and programming language uses » | INVÉRIFIABLE | Aucune preuve ; le code fait UTF-8 (`textCodecs.js:23-24`) | « Text is encoded as UTF-8 (same bytes as Python's base64.b64encode(text.encode())) » |
| base64-encoder (dev) | FAQ 1 | « Is Base64 Encoder free to use? — Yes, it's completely free with no signup required. » | GÉNÉRIQUE | Phrase présente mot pour mot sur des dizaines de pages (`docs/audit/p36/unicite-avant.json`, `repeated`) | Supprimer ou remplacer par une question propre à l'outil |
| base64-encoder (dev) | FAQ 2 | « What is Base64 encoding used for? — Converting binary or text data into an ASCII string… » | GÉNÉRIQUE | Définition générale, rien de propre à l'outil | Supprimer ou lier à ce que fait l'outil (texte UTF-8 seulement ; un fichier → File to Base64) |
| base64-encoder (dev) | FAQ 3 | « Is this tool secure and private? — Yes — encoding and decoding happen entirely in your browser… » | GÉNÉRIQUE | Juste (`page.jsx:12-18`, aucun appel réseau) mais phrase-type | Déplacer dans le bloc « privacy » de SeoContent (`app/components/SeoContent.tsx:123-128`) |
| base64-encoder (dev) | étape 4 | « Click 'Copy' to copy the result. » | GÉNÉRIQUE | Même phrase sur 6 pages (`unicite-avant.json`) ; omet la ligne de téléchargement « base64.txt » / bouton « Download » (`page.jsx:32`, `FileDownload.jsx:211`) | « Copy the result, or download it as base64.txt » (dire que le fichier s'appelle base64.txt même pour un décodage) |
| base64-encoder (dev) | astuce 4 | « Copy the result right away, since nothing is saved after you leave the page. » | GÉNÉRIQUE | Phrase-type ; incomplète : la page propose « Download » (`page.jsx:32`) et le navigateur demande avant de quitter (`FileDownload.jsx:24-30,69-74`) | Supprimer, ou dire : « Leaving the page asks first; copy or download the result » |

#### 2. /tools/file-tools/base64-encoder

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| base64-encoder (file) | titre, méta, about | « Instantly Converts Any File » / « instantly converts any file » | INVÉRIFIABLE | Lecture `FileReader.readAsDataURL` (`page.jsx:41-49`), aucune mesure de durée dans `docs/audit/` ; pour un gros fichier un message « Encoding... » s'affiche (`page.jsx:65`) | Retirer « instantly » ; « encodes the file as soon as it is chosen » (`page.jsx:63`) |
| base64-encoder (file) | méta, about | « into a Base64-encoded data URL » | MINCE | Deux sorties : Data URL ou « Raw Base64 » sans préfixe (`page.jsx:24,72`) | « into a data URL or raw Base64 » |
| base64-encoder (file) | about | « Upload a file and get a ready-to-use Base64 string » | TROMPEUR | Rien n'est envoyé : lecture locale (`page.jsx:39-49`) ; « Upload » contredit la fin de la même phrase (« nothing is ever uploaded ») | « Choose or drop a file… » |
| base64-encoder (file) | about (ensemble) | 2 phrases seulement | MINCE | Manquent : choix Data URL / Raw Base64 (`page.jsx:72`) ; type lu dans le contenu quand le navigateur n'en donne pas ou donne `application/octet-stream` — 47 signatures (`page.jsx:39-40,44`, `app/lib/fileSignature.js:11-58`) ; compteur de caractères (`page.jsx:73`) ; aperçu limité à 100 000 caractères au-delà (`page.jsx:17,68,75-76`) ; fichier `<nom>.base64.txt` téléchargeable (`page.jsx:79`) ; fichier vide refusé avec message (`page.jsx:33`, `app/lib/fileChecks.js:100-101`) ; un fichier à la fois (`page.jsx:63` sans `multiple`) | Ajouter ces faits |
| base64-encoder (file) | FAQ 1 | « Yes, it's completely free with no signup and no limit on how many files you can encode. » | GÉNÉRIQUE | Phrase-type (gratuité) ; aucune limite de nombre dans le code (juste) mais un fichier par sélection (`page.jsx:29,63`) | Supprimer ou remplacer par une question propre (gros fichiers, type détecté) |
| base64-encoder (file) | FAQ 2 | « Is my file uploaded anywhere? — No. The file is read and encoded locally using the browser's FileReader API… » | GÉNÉRIQUE | Juste (`page.jsx:41-49`) ; question-type présente sur des dizaines de pages (`unicite-avant.json` : « is my file uploaded anywhere ») | Déplacer dans le bloc « privacy » |
| base64-encoder (file) | astuce 2 | « use Download .txt to keep the whole text » | LIBELLÉ | Le bouton s'appelle « Download » (`app/components/FileDownload.jsx:211`) dans une ligne nommée `<nom du fichier>.base64.txt` (`page.jsx:79`) ; « Copy Base64 » copie aussi le texte entier (`page.jsx:76,78`) | « use Download (file name.base64.txt) or Copy Base64: both give the whole text » |

#### 3. /tools/developer-tools/url-encoder

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| url-encoder (dev) | titre | « URL Encoder — Encode and Decodes Text Online Free » | GÉNÉRIQUE | Faute (« Decodes ») et rien de propre : 3 modes d'encodage + décodage « + » = espace (`page.jsx:9-14,22,35-41`) | Titre correct, qui nomme les modes (valeur / URL entière / RFC 3986) |
| url-encoder (dev) | méta, about | « using JavaScript's encodeURIComponent and decodeURIComponent » | TROMPEUR | Vrai pour le mode « A value » seulement (`page.jsx:10`) ; « A whole URL » = `encodeURI` par segments en gardant les `%XX` existants (`page.jsx:12`) ; « Strict RFC 3986 » encode aussi `! ' ( ) *` (`page.jsx:13`) ; au décodage `+` devient espace par défaut (`page.jsx:22,25`) | Décrire les 3 modes et l'option « + » |
| url-encoder (dev) | about | « It's built for encoding a single value…, not a whole URL: running a full URL … through it will over-encode structural characters such as /, :, ?, &, and =, breaking it as a usable link. » | FAUX | Option « A whole URL (keeps : / ? # & =) » (`page.jsx:12,38`) ; la FAQ 2 de la même page dit l'inverse (`page.jsx:61`) | Supprimer ; dire « choose 'A whole URL' to keep : / ? # & = » |
| url-encoder (dev) | about | « A working 'Decode' button is included alongside 'Encode'. » | MINCE | Phrase sans information ; manque l'option « Decode “+” as a space (form data and query strings) » cochée par défaut (`page.jsx:22,33`) et l'avertissement affiché si le texte contient « + » (`page.jsx:34`) | Remplacer par l'option « + » réelle |
| url-encoder (dev) | étape 1 | « (a query parameter, path segment, etc., not a full URL) » | FAUX | Même raison : mode « A whole URL » (`page.jsx:12,38`) | « Paste a value or a whole URL » |
| url-encoder (dev) | étapes (ensemble) | 4 étapes sans le sélecteur « Encode as » ni la case « + » | MINCE | Sélecteur « Encode as » (3 options, `page.jsx:35-40`) et case « Decode “+” as a space… » (`page.jsx:33`) absents des étapes ; ligne « Download » `encoded.txt` absente (`page.jsx:47`) | Étapes : coller → choisir « Encode as » → Encode / Decode (case « + ») → Copy ou Download (encoded.txt) |
| url-encoder (dev) | étape 4 | « Click 'Copy' to copy the result. » | GÉNÉRIQUE | Même phrase sur 6 pages (`unicite-avant.json`) | Fusionner avec l'étape réelle ci-dessus |
| url-encoder (dev) | FAQ 1 | « What is URL encoding? — It converts characters that aren't safe in a URL… » | GÉNÉRIQUE | Définition générale | Supprimer ou rendre propre (ce que chaque mode garde) |
| url-encoder (dev) | FAQ 3 | « Can I decode with this tool? — Yes — there's a 'Decode' button… » | MINCE | Omet que « + » est lu comme espace par défaut (`page.jsx:22,25`) et le message « Invalid URL encoding » (`page.jsx:25`) | Dire les deux |
| url-encoder (dev) | FAQ 4 | « Is my data uploaded to a server? — No, encoding and decoding happen entirely in your browser. » | GÉNÉRIQUE | Juste ; phrase-type (`unicite-avant.json` : « is my data uploaded to a server ») | Bloc « privacy » |
| url-encoder (dev) | astuce 1 | « Encode individual query parameter values, not the full URL string, to avoid breaking the URL's structure. » | TROMPEUR | Le mode « A whole URL » garde la structure (`page.jsx:12,38`) | « Use 'A value' for one parameter, 'A whole URL' for a complete address » |
| url-encoder (dev) | astuce 4 | « Use this before inserting user-provided text into a query string, so special characters don't break the URL. » | GÉNÉRIQUE | Conseil général, sans rien de propre | Supprimer |
| url-encoder (dev) | page entière | (outil) | GÉNÉRIQUE | Outil identique à `/tools/text-tools/url-encoder` : même `ENCODERS` (`page.jsx:9-14` = `text-tools/url-encoder/page.jsx:10-15`), mêmes contrôles ; seules différences : police à chasse fixe (`page.jsx:32,46`), texte d'exemple, message « Copy failed » sur l'autre page | Différencier les deux pages par l'usage (dev : paramètres de requête, RFC 3986 ; texte : texte libre) ou en canoniser une |

#### 4. /tools/text-tools/url-encoder

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| url-encoder (text) | about | « using the browser's built-in encodeURIComponent/decodeURIComponent » | TROMPEUR | Vrai pour « A value » seulement (`page.jsx:11`) ; « A whole URL » = `encodeURI` en gardant les `%XX` (`page.jsx:13`) ; RFC 3986 (`page.jsx:14`) ; `+` → espace par défaut au décodage (`page.jsx:24,29`) | Décrire les 3 modes et l'option « + » |
| url-encoder (text) | about (ensemble) | 1 phrase | MINCE | Manquent les 3 modes « Encode as » (`page.jsx:44-50`), la case « Decode “+” as a space… » (`page.jsx:42`) et son avertissement (`page.jsx:43`), le téléchargement `encoded.txt` (`page.jsx:58`) | Ajouter ces faits |
| url-encoder (text) | étapes 1-2 | « Paste your URL or text… Click "Encode"… or "Decode"… » | MINCE | Sélecteur « Encode as » et case « + » absents des étapes (`page.jsx:42,44-50`) | Ajouter l'étape de choix du mode et la case |
| url-encoder (text) | FAQ 1 | « Characters like spaces, ampersands, and slashes are replaced with percent signs… » | TROMPEUR | En mode « A whole URL », `&` et `/` sont gardés (`page.jsx:13,47`) | « In 'A value' mode, & and / are encoded; 'A whole URL' keeps them » |
| url-encoder (text) | FAQ 2 | « Yes, it's completely free with no signup and no limits. » | GÉNÉRIQUE | Phrase-type (`unicite-avant.json`, 4 pages) | Supprimer |
| url-encoder (text) | FAQ 4 | « Letters, numbers, hyphens, underscores, periods, and tildes are left unchanged, matching the standard encodeURIComponent behavior. » | TROMPEUR | `encodeURIComponent` (mode par défaut, `page.jsx:11`) laisse aussi `! ' ( ) *` inchangés ; seule l'option RFC 3986 les encode (`page.jsx:14`) — la liste se présente comme complète | Compléter la liste : « …and ! ' ( ) * (encoded only by 'Strict RFC 3986') » |
| url-encoder (text) | astuces 3-4 | « Test your encoded URL in a browser address bar… » / « Keep the original, unencoded text handy… » | GÉNÉRIQUE | Conseils sans lien avec le code | Supprimer |
| url-encoder (text) | page entière | (outil) | GÉNÉRIQUE | Jumeau exact de `/tools/developer-tools/url-encoder` (voir section 3) | Différencier ou canoniser |

#### 5. /tools/developer-tools/html-encoder

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| html-encoder | titre, méta | « Convert the Five Characters That Matter » / « converts unsafe characters … into their HTML entities » | MINCE | L'outil décode aussi toutes les entités nommées et numériques (bouton « Decode », `page.jsx:11,21` ; `app/lib/textCodecs.js:74-90`) ; ni le titre ni la méta ne le disent | Titre/méta : « encode & < > " ' and decode every HTML entity » |
| html-encoder | FAQ 1 | « Is HTML Encoder free to use? — Yes, it's completely free with no signup required. » | GÉNÉRIQUE | Phrase-type | Supprimer |
| html-encoder | étapes 3-4 | « Review the result in the output box. » / « Click 'Copy' to copy it to your clipboard. » | GÉNÉRIQUE | Phrases présentes sur 4 et 6 pages (`unicite-avant.json`) ; omettent le téléchargement `encoded.txt` (`page.jsx:24`) | Une étape réelle : « Copy the result or download it (encoded.txt) » |
| html-encoder | astuce 1 | « Encoding these five characters is exactly what's needed to safely place untrusted text inside HTML markup, preventing it from … breaking out of an attribute. » | TROMPEUR | `htmlEncode` échappe seulement `& < > " '` (`textCodecs.js:65-68`) : suffisant dans le contenu d'un élément et dans un attribut entre guillemets ; pas dans un attribut sans guillemets, une URL (`javascript:`), un bloc `<script>` ou `<style>` | « …enough for element text and quoted attribute values; not for unquoted attributes, URLs, or script/style blocks » |
| html-encoder | page entière | (outil) | GÉNÉRIQUE | Jumeau de `/tools/developer-tools/html-entity-decoder` : mêmes fonctions `htmlEncode`, `htmlDecode`, `browserNamedEntity` (`page.jsx:4,10-11` = `html-entity-decoder/page.jsx:4,14-15`), mêmes boutons « Encode » / « Decode », même sous-titre « Encode and decode HTML entities » ; seule différence : nom du fichier téléchargé `encoded.txt` / `decoded.txt` | Différencier les deux pages (encodage pour l'une, décodage pour l'autre) ou canoniser |

#### 6. /tools/developer-tools/html-entity-decoder

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| html-entity-decoder | FAQ 1 | « Is HTML Entity Decoder free to use? — Yes, it's completely free with no signup required. » | GÉNÉRIQUE | Phrase-type | Supprimer |
| html-entity-decoder | FAQ 2 | « What are HTML entities? — Codes that represent characters with special meaning in HTML… » | GÉNÉRIQUE | Définition générale | Supprimer ou rendre propre |
| html-entity-decoder | FAQ 5 | « Does it store or upload my data? — No, encoding and decoding both happen entirely in your browser… » | GÉNÉRIQUE | Juste (`page.jsx:14-15`) ; phrase-type | Bloc « privacy » |
| html-entity-decoder | étapes 3-4 | « Review the result in the output box. » / « Click 'Copy' to copy it to your clipboard. » | GÉNÉRIQUE | Phrases présentes sur 4 et 6 pages ; omettent le téléchargement `decoded.txt` (`page.jsx:28`) | Une étape réelle avec Copy / Download |
| html-entity-decoder | astuce 3 | « Copy your result right away, since it isn't saved after you leave the page. » | GÉNÉRIQUE | Phrase-type ; la page propose « Download » (`page.jsx:28`) et demande avant de quitter (`FileDownload.jsx:24-30`) | Supprimer |
| html-entity-decoder | page entière | (outil) | GÉNÉRIQUE | Jumeau de `/tools/developer-tools/html-encoder` (voir section 5) | Différencier ou canoniser |

#### 7. /tools/developer-tools/hex-to-text

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| hex-to-text | titre | « Hex to Text — Convert Between Plain Text Online Free » | MINCE | Titre tronqué (« between plain text » et… rien) ; l'outil va texte → hex UTF-8 et hex → texte (`page.jsx:11-14,23-24`) | « Hex to Text — Convert Text to UTF-8 Hex and Back » |
| hex-to-text | méta | « between plain text and hexadecimal character codes » | TROMPEUR | Ce sont les OCTETS UTF-8, pas les codes de caractère : é → `c3 a9`, pas `e9` (`app/lib/textCodecs.js:47-49`, et `textCodecs.js:8-9` qui décrit l'ancien défaut) | « …and hexadecimal UTF-8 bytes » |
| hex-to-text | about | « like every hex editor and programming language » | INVÉRIFIABLE | Aucune preuve ; le code fait UTF-8 (`textCodecs.js:48,59`) | « the same bytes as Python's text.encode().hex() » (déjà en astuce 1) |
| hex-to-text | FAQ 1 | « Is Hex to Text free to use? — Yes, it's completely free with no signup required. » | GÉNÉRIQUE | Phrase-type | Supprimer |
| hex-to-text | étape 4 | « Click 'Copy' to copy it to your clipboard. » | GÉNÉRIQUE | Phrase sur 6 pages ; omet le téléchargement `converted.txt` (`page.jsx:27`) | Copy / Download |
| hex-to-text | astuce 3 | « Copy your result right away, since it isn't saved after you leave the page. » | GÉNÉRIQUE | Phrase-type ; « Download » existe (`page.jsx:27`) | Supprimer |

#### 8. /tools/developer-tools/unicode-converter

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| unicode-converter | titre | « Unicode Converter — Convert Text Online Free » | GÉNÉRIQUE | Rien de propre ; l'outil écrit des `\uXXXX` et lit `\uXXXX`, `\u{…}`, `U+…` (`page.jsx:9-13`) | « Unicode Converter — Text to \uXXXX Escapes and Back » |
| unicode-converter | about | « it supports exactly one format (4-hex-digit \uXXXX escapes) » | FAUX | « From Unicode » lit aussi `\u{1F600}` (1 à 6 chiffres) et `U+1F600` (4 à 6 chiffres, « U » majuscule) (`page.jsx:10-12`) en plus de `\uXXXX` (`page.jsx:13`) | « To Unicode writes \uXXXX; From Unicode reads \uXXXX, \u{…} and U+XXXX » |
| unicode-converter | about | « not UTF-8, UTF-16, UTF-32, HTML entities, or other encodings » | TROMPEUR | Les `\uXXXX` produits SONT les unités de code UTF-16 (`input.split('')` + `charCodeAt`, `page.jsx:9`) — d'où les paires de substitution | « …the UTF-16 code units, as JavaScript stores them; not UTF-8 bytes or HTML entities » |
| unicode-converter | FAQ 1 | « Only one: 4-hex-digit \uXXXX escape sequences… » | FAUX | Même raison (`page.jsx:10-13`) | Même correction |
| unicode-converter | astuce 2 | « make sure each escape uses exactly 4 hex digits (A), since that's the only pattern recognized » | FAUX | `\u{41}` et `U+0041` sont aussi reconnus (`page.jsx:12`) | Dire les trois formes reconnues |
| unicode-converter | FAQ 2 | « Is it free to use? — Yes, it's completely free with no registration required. » | GÉNÉRIQUE | Phrase-type | Supprimer |
| unicode-converter | FAQ 4 | « Is my text uploaded to a server? — No, all conversion happens locally in your browser. » | GÉNÉRIQUE | Juste ; phrase-type | Bloc « privacy » |
| unicode-converter | étapes (ensemble) / about | (non dit) | MINCE | « To Unicode » échappe TOUS les caractères, ASCII compris (A → `A`), en minuscules (`é`) (`page.jsx:9`) ; téléchargement `converted.txt` (`page.jsx:26`) — rien de cela n'est dit | Le dire |
| unicode-converter | étape 4 | « Click 'Copy' to copy the result. » | GÉNÉRIQUE | Phrase sur 6 pages | Copy / Download |
| unicode-converter | astuce 3 | « For byte-level encodings like UTF-8, use a dedicated encoding tool instead » | GÉNÉRIQUE | Renvoi vague alors que le site a Hex to Text (octets UTF-8, `app/lib/textCodecs.js:47-63`) | Lier « Hex to Text » |

#### 9. /tools/developer-tools/hash-generator

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| hash-generator | méta, interface, about | « files of any size » (méta `seo.js:22`, about `page.jsx:291`, sous-titre `page.jsx:170`) / « No file size limit » (`page.jsx:171`) / « Any type, any size, several at once » (`page.jsx:245`) | INVÉRIFIABLE | Aucune limite dans le code : lecture par tranches de 8 Mio (`hash.worker.js:10,41-52`) ; mais la seule mesure (« 5 Gio : 52 s ») est dans le message du commit 44ae126c, aucun rapport dans `docs/audit/` | Garder « no size limit set by the tool (read in 8 MB pieces) » ; mettre la mesure 5 Gio dans un rapport `docs/audit/` avant de la citer |
| hash-generator | FAQ 2 | « so even files larger than your device's memory can be hashed » | INVÉRIFIABLE | Lecture en flux possible (`hash.worker.js:31-34,41`), mais aucun essai plus gros que la mémoire dans `docs/audit/` | Retirer ou prouver |
| hash-generator | FAQ 2 | « A 5 GB file was hashed in under a minute on a desktop computer in our tests. » | INVÉRIFIABLE | Mesure seulement dans le message du commit 44ae126c (« 5 Gio : 52 s, SHA-256 égal à sha256sum ») ; aucun rapport dans `docs/audit/` | Rapport dans `docs/audit/` ou retrait |
| hash-generator | FAQ 1, FAQ 2 | « SHA-1 and the SHA-2 family use your browser's built-in Web Crypto » / « so SHA-1 and SHA-2 can use the browser's faster native code » | FAUX | SHA-224 n'a pas de nom Web Crypto : toujours hash-wasm (`app/lib/hashAlgorithms.js:12`, pas de `subtle`) ; et au-delà de 700 Mio (100 Mio sur téléphone/tablette) ou sans Web Crypto, SHA-1/256/384/512 passent aussi par hash-wasm (`page.jsx:21,31`, `hash.worker.js:30-31,34`) | « SHA-1, SHA-256, SHA-384 and SHA-512 use Web Crypto for files up to 700 MB (100 MB on phones and tablets); everything else uses hash-wasm » |
| hash-generator | FAQ 6 | « HMAC is not defined for checksums such as CRC32 or xxHash, nor for BLAKE3 and Keccak » | TROMPEUR | C'est un choix de l'outil : `hmac: false` pour Keccak-256 et BLAKE3 (`hashAlgorithms.js:16,18`) ; la construction HMAC s'applique à Keccak (HMAC-SHA3 est normalisé) | « HMAC is not offered here for CRC32, CRC32C, xxHash, BLAKE3 and Keccak-256; they are skipped while a key is set » (`page.jsx:216`) |
| hash-generator | FAQ 5, about | « in the "SHA256 (file) = hash" format that `sha256sum -c`, `md5sum -c` and `shasum -c` understand » / « a checksums.txt that sha256sum -c can check » | TROMPEUR | Le fichier mélange une ligne par fichier ET par algorithme coché (`page.jsx:140`), défauts = MD5, SHA-1, SHA-256, SHA-512, CRC32 (`hashAlgorithms.js:26`) ; chaque commande ne vérifie que les lignes de ses propres algorithmes : les lignes CRC32, CRC32C, XXH64/XXH3/XXH128, BLAKE2b/BLAKE3, KECCAK-256, RIPEMD160 et toutes les lignes « HMAC-… » (`page.jsx:140`, `hashAlgorithms.js:30`) ne sont vérifiables par aucune des trois | « sha256sum -c checks the SHA256 lines, md5sum -c the MD5 lines…; checksum (CRC, xxHash) and HMAC lines are for reading only » |
| hash-generator | étape 3 | « drop one or more files and click Hash » | LIBELLÉ | Le bouton affiche « Hash 1 file » / « Hash N files » (`page.jsx:265`), ou « Tick at least one algorithm » | « click 'Hash N files' » |
| hash-generator | étape 5 | « Copy any value, or download every result as checksums.txt. » | TROMPEUR | « Copy all » et `checksums.txt` n'existent qu'en mode Files (`page.jsx:276-279`) ; en mode Text, seulement un « Copy » par valeur (`page.jsx:153,231`) | « Copy any value; in Files mode, Copy all or download checksums.txt » |

#### 10. /tools/developer-tools/jwt-decoder

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| jwt-decoder | titre, méta | « JWT Decoder — Split a JWT Online Free » / « splits a JWT into its header and payload, decodes each, and pretty-prints the resulting JSON » | MINCE | Ni le titre ni la méta ne disent la vérification de signature (HS/RS/PS/ES/EdDSA, `page.jsx:23-29,75`, `app/lib/jwtVerify.js:8-14,82-128`) ni les dates exp/iat/nbf lisibles (`page.jsx:45-49`) | « Decode a JWT and verify its signature (HS, RS, PS, ES, EdDSA) » |
| jwt-decoder | FAQ 1 | « What is a JWT? — A compact, URL-safe token format… » | GÉNÉRIQUE | Définition générale | Supprimer ou rendre propre |
| jwt-decoder | FAQ 3 | « Is my token uploaded to a server? — No, decoding happens entirely in your browser. » | GÉNÉRIQUE | Juste ; phrase-type ; omet que la vérification aussi est locale (`page.jsx:81`) | Bloc « privacy » : token ET clé restent dans le navigateur (WebCrypto) |
| jwt-decoder | astuce 1 | « Decoding always succeeds, whatever the signature » | TROMPEUR | « Decode » échoue avec « Invalid JWT token » si le jeton n'a pas 3 parties, ou si le Base64url ou le JSON est invalide (`page.jsx:37-44,52`) ; la phrase veut dire que Decode ne vérifie pas la signature | « Decode never checks the signature: only 'Signature verified' does » |
| jwt-decoder | astuce 3 | « Useful for quickly inspecting claims during development, not for making trust decisions about a token's origin. » | TROMPEUR | Contredit l'outil et la FAQ 4 : « Verify signature » prouve que le jeton a été signé avec cette clé et n'a pas changé (`page.jsx:79`, `jwtVerify.js:82-128`) | Supprimer ou : « a verified signature proves the key; exp, nbf, iss and aud must still be checked in your application » |
| jwt-decoder | about, étapes (ensemble) | (non dit) | MINCE | Non dit : dates exp / iat / nbf affichées en UTC avec « — expired », « — not expired yet », « — not valid yet » (`page.jsx:45-49,83`) ; sélecteur « Secret is : text / base64 / base64url » pour HS* (`page.jsx:69-72`) ; refus expliqués : JWK Set, certificat X.509, clé PKCS#1, clé privée, `crit`, `b64:false`, `alg none` (`jwtVerify.js:59,72-75,94,97-98`) ; jeton chiffré (JWE, 5 parties) non pris en charge (`page.jsx:38`) ; pas de bouton Copy ni Download | Ajouter ces faits |

#### 11. /tools/developer-tools/url-parser

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| url-parser | étape 3 | « protocol, hostname, port, path, search, and hash » | LIBELLÉ | La ligne affichée s'appelle « pathname », pas « path » (`page.jsx:15,28`) | « protocol, hostname, port, pathname, search and hash » |
| url-parser | astuce 1 | « without one, the URL is treated as invalid » | TROMPEUR | `new URL(text)` (`page.jsx:11`) accepte « example.com:8080/a » ou « localhost:3000 » en prenant « example.com: » / « localhost: » pour le protocole ; seul un texte sans « : » valable comme schéma est refusé | « Include https:// — without it, the address is refused or misread (localhost:3000 gives the protocol "localhost:") » |
| url-parser | astuce 3 | « so it correctly rejects malformed URLs rather than guessing » | TROMPEUR | L'analyseur WHATWG du navigateur (`page.jsx:11`) corrige au lieu de refuser : « https:example.com » est lu comme https://example.com/, les « \ » deviennent « / », l'hôte est mis en minuscules, un nom international passe en punycode (xn--), « ../ » est résolu | « It shows the address as browsers read it (normalised: lower-case host, punycode, \ → /) » |
| url-parser | FAQ 1 | « Why do I need to parse a URL? — It extracts the individual components of a URL… » | GÉNÉRIQUE | Phrase générale | Supprimer ou rendre propre |
| url-parser | FAQ 2 | « Yes, completely free with no registration required. » | GÉNÉRIQUE | Phrase-type (`unicite-avant.json`, 5 pages) | Supprimer |
| url-parser | FAQ 4 | « Is my URL sent to a server? — No, parsing uses the browser's native URL API… » | GÉNÉRIQUE | Juste ; phrase-type | Bloc « privacy » |
| url-parser | astuce 4 | « For domain-only analysis…, a dedicated domain-parsing tool will give a more detailed breakdown. » | GÉNÉRIQUE | Renvoi à un outil qui n'existe pas sur le site ; redit la FAQ 3 et l'about | Supprimer |
| url-parser | about, étapes (ensemble) | (non dit) | MINCE | Non dit : une clé répétée garde toutes ses valeurs, jointes par « , » (`page.jsx:13-14`) ; les valeurs sont affichées décodées (`URLSearchParams` : `%XX` et `+` → espace, `page.jsx:14`) ; un champ vide (port par défaut, pas de hash) s'affiche « — » (`page.jsx:28`) ; username, password, origin et host ne sont pas affichés (`page.jsx:15`) ; message « Invalid URL » (`page.jsx:17`) ; pas de Copy | Ajouter ces faits |

#### 12. /tools/developer-tools/number-base-converter

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| number-base-converter (dev) | méta | « shows a number in binary, octal, decimal, and hexadecimal simultaneously » | MINCE | Toute base de 2 à 36 en entrée et en sortie (`app/components/BaseConverter.jsx:11,44-53`), parties fractionnaires (`app/lib/exactNumbers.js:24-45`) — la méta n'en dit rien | « …and any base from 2 to 36, fractions included » |
| number-base-converter (dev) | about, astuce 3 | « numbers of any size converted exactly » / « Numbers of any size are exact » | INVÉRIFIABLE | Arithmétique BigInt sans plafond dans le code (`exactNumbers.js:32-36,40-44`) ; « any size » sans essai dans `docs/audit/` | « no digit limit: integers are computed exactly (BigInt), e.g. 2^64 - 1 = FFFFFFFFFFFFFFFF » |
| number-base-converter (dev) | about, étape 4 | « the results update instantly » / « to see updated results instantly » | INVÉRIFIABLE | Ce que prouve le code : recalcul à chaque frappe (`BaseConverter.jsx:23,40`) | « as you type » |
| number-base-converter (dev) | FAQ 3, astuce 1 | « converted correctly across all four bases » / « All four bases update live » | TROMPEUR | Cinq résultats : les quatre + la base de « Also convert to », Base 36 par défaut (`BaseConverter.jsx:18,33,63-69`) | « all results (the four usual bases and the one you add) » |
| number-base-converter (dev) | étapes (ensemble) | (non dit) | MINCE | Non dit : bouton « Copy » sous chaque résultat (`BaseConverter.jsx:67`, copie sans « … », `:31`) ; case « Upper-case letters » cochée par défaut (`BaseConverter.jsx:19,55-57`) ; « _ » et espaces ignorés, signe « + » accepté (`exactNumbers.js:26-28`) ; message d'erreur (`BaseConverter.jsx:60`) | Ajouter ces faits |
| number-base-converter (dev) | page entière | (outil) | GÉNÉRIQUE | Jumeau exact de `/tools/math-tools/number-base-converter` : les deux pages rendent le même composant `<BaseConverter />` (`page.jsx:3,11` = `math-tools/number-base-converter/page.jsx:3,11`), même h1 et même sous-titre (`page.jsx:9-10`) | Différencier par l'usage (dev : hex/binaire, préfixes 0x/0b/0o ; math : fractions, bases 2-36) ou canoniser |

#### 13. /tools/math-tools/number-base-converter

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| number-base-converter (math) | titre, méta, about | « Instantly Converts a Number Online » / « instantly converts a number » | INVÉRIFIABLE | Recalcul à chaque frappe (`BaseConverter.jsx:23,40`), aucune mesure ; le titre a en plus une faute d'accord | « …as you type » ; titre grammatical |
| number-base-converter (math) | méta | « showing all four results as you type » | TROMPEUR | Cinq résultats (`BaseConverter.jsx:18,33`), et toute base 2-36 (`BaseConverter.jsx:11`) | « the four usual bases plus any base from 2 to 36 » |
| number-base-converter (math) | about | « numbers of any size included, exactly » | INVÉRIFIABLE | BigInt sans plafond (`exactNumbers.js:32-36`) ; « any size » sans essai | « no digit limit (exact BigInt arithmetic) » |
| number-base-converter (math) | FAQ 3 | « Yes, it's completely free with no registration and no usage limits. » | GÉNÉRIQUE | Phrase-type | Supprimer |
| number-base-converter (math) | astuce 2 | « Use the Hexadecimal result directly for CSS/HTML color codes or memory addresses. » | TROMPEUR | L'outil convertit UN nombre (`BaseConverter.jsx:23-28`) ; une couleur CSS est #RRGGBB (trois canaux) : 255 donne « FF », pas une couleur | Supprimer, ou lier Color Converter |
| number-base-converter (math) | astuce 3 | « a message lists the digits that base uses » | TROMPEUR | Au-delà de la base 11, le message abrège : base 16 → « 0123456789…F » (`BaseConverter.jsx:60`) | « a message shows the valid digits (abbreviated above base 11) » |
| number-base-converter (math) | page entière | (outil) | GÉNÉRIQUE | Jumeau exact de `/tools/developer-tools/number-base-converter` (section 12) | Différencier ou canoniser |

#### À vérifier (non compté : non prouvé par le code seul)

- Google Traduction : quand un visiteur choisit une langue, le script `translate.google.com/translate_a/element.js` est chargé
  (`app/lib/googleTranslate.js:8-24`, `app/components/GoogleTranslateLoader.jsx:7-10`) et traduit le texte de la page. Aucun
  résultat d'outil n'est marqué `notranslate` (recherche : seuls `Footer.jsx:14`, `Navbar.jsx:828,1168,1215`). Les résultats
  affichés comme texte de page (et non dans un champ de saisie) — en-tête et payload JWT (`jwt-decoder/page.jsx:83`), lignes
  de URL Parser (`url-parser/page.jsx:28`), empreintes (`hash-generator/page.jsx:155`), résultats de base
  (`BaseConverter.jsx:66`) — pourraient alors partir chez Google. À tester dans un navigateur avant d'écrire « never sent
  anywhere » sans réserve sur ces quatre pages ; correctif possible : `translate="no"` / `notranslate` sur ces résultats.

#### Synthèse du lot dev-encode (13 pages, 98 défauts)

| Type | Nombre |
|---|---|
| FAUX | 6 |
| INVÉRIFIABLE | 10 |
| TROMPEUR | 21 |
| GÉNÉRIQUE | 43 |
| MINCE | 15 |
| LIBELLÉ | 3 |
| FORMAT | 0 |
| **Total** | **98** |


---

### Lot dev-misc

Lecture seule : texte servi lu dans `docs/audit/p36/contenu-avant.json`, confronté au code. Abréviations des chemins :
`DT/` = `app/tools/developer-tools/` ; `page` = `DT/<outil>/page.jsx` ; `layout` = `DT/<outil>/layout.tsx` (titre ligne 5
et `openGraph.title` ligne 9 ; méta-description ligne 6 et `openGraph.description` ligne 10). Les numéros de ligne sont ceux
du fichier (ligne 1 = `'use client'`, précédé d'un BOM dans 12 des 13 `page.jsx`).

Constats transverses, valables pour les 13 pages (vérifiés, donc absents des tableaux sauf quand une phrase les contredit) :
- Aucune page n'appelle `lib/quota/guard.js` ni une route payante ; aucune n'exige de compte (aucun import d'auth ou de
  Supabase dans les 13 `page.jsx`). Le seul appel réseau vers notre serveur est le journal d'erreurs
  `POST /api/report-error` (`app/lib/reportError.js:16,133-171`), déclenché par `reportShownMessage` / `useToolError`
  (`app/lib/useToolError.js:19-31,37-51`) sur 4 outils seulement : api-tester (`page:31`), regex-tester (`page:42-43`),
  timestamp-converter (`page:24`, `useToolError`) et markdown-to-html (`page:16`).
- Aucune page ne produit d'image : la question du filigrane est sans objet.
- Toutes les pages rendent le texte SEO par `app/components/SeoContent.tsx:66-169` ; les données structurées FAQPage
  reprennent mot pour mot la FAQ affichée (`SeoContent.tsx:38-64`) : chaque défaut de FAQ ci-dessous est aussi dans le JSON-LD.

---

#### api-tester (`/tools/developer-tools/api-tester`)

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| api-tester | about | « Nothing passes through our servers » | TROMPEUR | Vrai pour la requête (`page:24` `fetch(url, opts)` part du navigateur vers l'URL saisie). Mais un en-tête JSON invalide fait lever `JSON.parse` (`page:20`) et le message est envoyé à notre journal (`page:31` → `app/lib/useToolError.js:19-30` → `app/lib/reportError.js:163-171`). Le nettoyage (`app/lib/reportError.js:72-122`) laisse passer l'extrait que V8 cite : testé sur une copie de la fonction, l'en-tête `{"Authorization": Bearer sk_live_abcdef}` produit le message envoyé `Unexpected token '[text]', ..."ization": Bearer sk_"... is not valid JSON` (début d'un jeton envoyé). Une erreur réseau/CORS envoie aussi le message du navigateur. | Dire exactement : « The request goes from your browser straight to the API; if an error is shown, its text (cleaned of URLs, quoted text and long numbers) is logged by us. » — ou, mieux (décision propriétaire), ne plus remonter les erreurs d'analyse des en-têtes. |
| api-tester | FAQ 1 | « Is API Tester free to use? » / « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | Phrase identique sur 92 pages (`docs/audit/p36/unicite-avant.json`, `repeated`). Vrai ici (aucun appel au guard, aucune auth). | Supprimer ou remplacer par un fait propre : aucune limite, la page n'appelle que l'API saisie. |
| api-tester | about / étapes | (absence) | MINCE | Ce que le texte ne dit pas : les en-têtes de réponse ne sont pas affichés (seuls `status`, `statusText` et le corps : `page:30,49`) ; dès qu'un corps est envoyé, `Content-Type: application/json` est ajouté sauf si l'en-tête est fourni dans « Headers (JSON) » (`page:21-23`) ; le champ « Body » apparaît pour toute méthode sauf GET, DELETE compris (`page:47`) ; pas de délai maximal ni d'annulation (`page:24`) ; pas de durée de réponse ; une erreur réseau ou CORS n'affiche que le message du navigateur (`page:31`, `e.message`). Règle du navigateur (hors code) : depuis notre page en https, une URL `http://` publique est bloquée (contenu mixte). | Ajouter ces faits (en-têtes non affichés, Content-Type JSON, corps aussi pour DELETE, contenu mixte). |

#### aspect-ratio (`/tools/developer-tools/aspect-ratio`)

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| aspect-ratio | méta (+ og) | « for any width and height you enter » | TROMPEUR | `page:14` n'accepte que des nombres > 0 (décimales et notation 1e3 comprises) ; vide, 0 ou négatif → « — » (`page:17-19`). | « for any positive width and height (decimals accepted) ». |
| aspect-ratio | interface | « Calculate aspect ratios for any dimensions » | TROMPEUR | Même règle `page:14` ; sous-titre `page:40`. | « … for any positive width and height ». |
| aspect-ratio | astuce 4 | « try different height values until the ratio shown matches what you need » | FAUX | L'outil calcule directement : champs « New width → height » et « New height → width » (`page:52-59`, calcul `page:28-34`). | Remplacer par : tapez la nouvelle largeur dans « New width → height » ; la hauteur s'affiche, arrondie au pixel avec la valeur exacte si elle n'est pas entière (`page:54`). |
| aspect-ratio | étapes 1-4 | (absence) | MINCE | Les étapes ne mentionnent ni les champs « New width → height » / « New height → width » (`page:52,57`) ni l'affichage « (≈ x, rounded) » (`page:32,54,59`). | Ajouter une étape pour ces champs. |
| aspect-ratio | FAQ 2 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | 92 pages (`unicite-avant.json`). | Supprimer ou remplacer par un fait propre. |

#### color-picker (`/tools/developer-tools/color-picker`)

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| color-picker | titre (+ og) | « Color Picker — Let You Pick a Color Online Free » | MINCE | Titre agrammatical (`layout:5,9`), aucune information (ni HEX→RGB ni sélecteur natif). | Titre précis : ex. « Color Picker — HEX to RGB with Your Browser's Colour Picker ». |
| color-picker | étape 1 / astuce 1 | « Click the color swatch to open your browser's native color picker » | LIBELLÉ | Deux carrés de couleur : le grand aperçu 192 px (`page:14`, simple `div`, non cliquable) et, en dessous, le petit bouton `input type="color"` 64 px (`page:15`, aria-label « Pick a colour ») qui seul ouvre le sélecteur. | « Click the small colour button under the preview ». |
| color-picker | astuce 2 | « the leading # is optional » | TROMPEUR | Vrai seulement pour la conversion RGB (regex `page:6`). Sans `#`, l'aperçu reçoit `backgroundColor: "3b82f6"` (`page:14`), valeur CSS invalide : il garde la couleur précédente ; le sélecteur natif reçoit une valeur invalide (`page:15`, le navigateur la remplace par #000000) ; la carte HEX affiche le texte tel quel (`page:17`). | Dire de taper le `#` (ou corriger le code pour normaliser). |
| color-picker | méta / about | « shows the matching HEX and RGB values » | TROMPEUR | La carte HEX affiche et copie la saisie brute, non normalisée (`page:17` : `{color}` et `writeText(color)`) : taper « red » affiche et copie « red ». | « shows the HEX code you picked or typed and its RGB value ». |
| color-picker | FAQ 2 | « there's no image upload, URL input, or eyedropper for sampling colors from a picture or webpage » | TROMPEUR | Le site n'a pas de pipette, mais le bouton est le sélecteur natif du navigateur (`page:15`, `type="color"`) : sous Chrome/Edge ordinateur, ce sélecteur contient une pipette qui échantillonne l'écran (fonction du navigateur, pas du code du site — à confirmer par le propriétaire). | « This page has no image upload; depending on your browser, its own colour picker may include an eyedropper. » |
| color-picker | FAQ 3 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | 92 pages. | Supprimer ou fait propre. |
| color-picker | page entière | (absence) | MINCE | Quasi-doublon réduit de `/tools/converter-tools/color-converter` (HEX, RGB, HSL, HSV, CMYK et le même sélecteur natif : `app/tools/converter-tools/color-converter/page.jsx:5,119,127`). Le texte ne dit pas ce qui distingue les deux pages. Faits utiles absents : la copie RGB donne `rgb(r,g,b)` alors que la carte affiche `r,g,b` (`page:18`). | Dire la différence et renvoyer vers Color Converter pour HSL/CMYK ; dire le format copié. |

#### cron-expression (`/tools/developer-tools/cron-expression`)

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| cron-expression | titre (+ og) | « Cron Expression — Turn Five Simple Text Fields Online Free » | MINCE | Titre agrammatical et vide d'information (`layout:5,9`). | Ex. « Cron Expression — Explain, Check and Build a 5-Field Cron Schedule ». |
| cron-expression | méta (+ og) | « turns five simple text fields into a valid cron string » | FAUX | Les champs sont joints tels quels (`page:19`) ; une valeur invalide reste dans l'expression et un message « Invalid cron expression: … » s'affiche (`page:34,40` ; `app/lib/cronInfo.js:12,18,24`). | « joins five fields into a cron expression, checks it, explains it in plain English and lists its next 5 runs ». |
| cron-expression | about | « there's no syntax validation, no next-run-time preview » | FAUX | Validation et 5 prochaines exécutions : `page:18,34-40` ; `app/lib/cronInfo.js:10-27` (cron-parser + cronstrue, `count = 5`). Contredit aussi la FAQ 3 de la même page. | Réécrire : vérifie l'expression, la décrit, liste les 5 prochaines exécutions dans le fuseau du visiteur. |
| cron-expression | astuce 3 | « Since there's no validation, test your expression … » | FAUX | Même code (`page:34-40`). | Supprimer ou : « Invalid fields are reported under the expression ». |
| cron-expression | FAQ 2 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | 92 pages. | Supprimer ou fait propre. |
| cron-expression | page entière | étapes 1-3, FAQ 1, astuces 2-3 | GÉNÉRIQUE | Doublon de cron-expression-builder : même code à part les préréglages (`page:20` 6 préréglages vs `DT/cron-expression-builder/page.jsx:20` 8) ; mêmes étapes 1-3, FAQ 1 et astuces 2-3 mot pour mot ; `unicite-avant.json` `over` : ratio 0,421. | Différencier les deux pages (ou décision propriétaire : fusion/redirection). |

#### cron-expression-builder (`/tools/developer-tools/cron-expression-builder`)

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| cron-expression-builder | about | « with no syntax checking, next-run preview, or calendar/time pickers » | FAUX | Vérification et 5 prochaines exécutions : `page:18,36-42` ; `app/lib/cronInfo.js:10-27`. (Absence de calendrier/sélecteurs : vrai, `page:30-32` champs texte.) Contredit la FAQ 3 de la même page. | Réécrire comme pour cron-expression. |
| cron-expression-builder | astuce 3 | « Since there's no validation, test your expression … » | FAUX | `page:36-42`. | Supprimer ou dire que les erreurs s'affichent. |
| cron-expression-builder | FAQ 2 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | 92 pages. | Supprimer ou fait propre. |
| cron-expression-builder | FAQ 4 | « Cron expressions are used by Linux, macOS, Unix, and many scheduling libraries across languages like Python, Java, Node.js, and PHP. » | TROMPEUR | Phrase sans lien avec l'outil ; les planificateurs Java courants (Quartz, Spring) utilisent 6-7 champs, que l'outil refuse et explique au lieu de les lire (`app/components/CronPaste.jsx:22-23`). | Remplacer par : l'outil lit le cron standard à 5 champs ; une expression Quartz/Spring à 6-7 champs est expliquée, pas lue. |
| cron-expression-builder | page entière | étapes 1-3, FAQ 1, astuces 2-3 | GÉNÉRIQUE | Doublon de cron-expression (voir ci-dessus). | Différencier ou fusionner (propriétaire). |

#### diff-viewer (`/tools/developer-tools/diff-viewer`)

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| diff-viewer | about | « the one used by git and diffchecker » | INVÉRIFIABLE | Le code utilise `diffArrays` de jsdiff (`app/lib/codeTools.js:49-54`, paquet `diff` 9.0.0, `package.json:32`). Que diffchecker utilise Myers n'est prouvé par aucun rapport du dépôt (`docs/audit/RAPPORT-qualite-29-09.md:35` l'affirme sans source). | Supprimer « and diffchecker » (garder « Myers, as git's default diff »). |
| diff-viewer | about | « an option ignores differences in spaces » | TROMPEUR | `app/lib/codeTools.js:53` : retire les espaces de début/fin et réduit chaque suite d'espaces à un seul ; « a b » et « ab » restent différents. | « ignores leading and trailing spaces and differences in the amount of spacing ». |
| diff-viewer | about / étape 2 | « Optionally tick 'Ignore whitespace'. » | MINCE | L'option « Ignore case » (`page:40`) et le surlignage des mots modifiés (`page:14-27,47`) sont absents de l'about et des étapes (seule la FAQ 4 les cite). Faits absents : une ligne inchangée affichée avec « Ignore case/whitespace » montre la version de gauche (`app/lib/codeTools.js:62`) ; « Compare » est inactif si un des deux textes est vide (`page:41`). | Compléter l'about et l'étape 2. |
| diff-viewer | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | 92 pages. | Supprimer ou fait propre. |
| diff-viewer | page entière | (absence) | MINCE | Même moteur et mêmes options que `/tools/text-tools/text-comparator` (`app/tools/text-tools/text-comparator/page.jsx:4,12-18`). Le texte ne dit pas ce qui distingue les pages (ici : une seule colonne, lignes numérotées des deux côtés `page:43-50`). | Dire la différence avec Text Comparator. |

#### markdown-editor (`/tools/developer-tools/markdown-editor`)

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| markdown-editor | titre (+ og) | « Markdown Editor — Edit Markdowns Online Free » | MINCE | Titre agrammatical (« Markdowns »), aucune information (`layout:5,9`). | Ex. « Markdown Editor — Live GFM Preview, Download .md or .html ». |
| markdown-editor | méta (+ og) | « renders a small subset of Markdown » | FAUX | marked en CommonMark + GFM (`page:3,18`, `gfm: true`) puis DOMPurify ; l'about de la même page le dit. | « renders CommonMark and GitHub Flavored Markdown (tables, task lists, code blocks) live ». |
| markdown-editor | étape 2 (+ about, FAQ 3) | « Watch the rendered preview update instantly » ; « headings, … lists, … tables » | TROMPEUR | Le HTML est juste mais son apparence ne l'est pas : la classe `prose prose-sm` (`page:29`) n'a aucune règle (pas de `@tailwindcss/typography` dans `package.json`, aucune règle `.prose` dans `app/globals.css`) et le reset Tailwind (`app/globals.css:1` `@import "tailwindcss"` ; `node_modules/tailwindcss/preflight.css:73-80` titres `font-size/font-weight: inherit`, `:197-200` `ol, ul … list-style: none`) : titres de la taille du texte, listes sans puces ni numéros, tableaux sans bordures. Constat de lecture du code, à confirmer visuellement par le propriétaire (navigateur interdit à l'auditeur). | Corriger l'affichage (code, propriétaire) ; en attendant, ne pas promettre un rendu visuel des titres/listes/tableaux. |
| markdown-editor | about / étape 4 / FAQ 2 | « the rendered page as .html » | TROMPEUR | `document.html` (`page:33`) contient le fragment HTML nettoyé (`page:18`) sans `<!DOCTYPE>`, `<head>` ni `<meta charset>` — contrairement à Markdown to HTML qui l'enveloppe (`DT/markdown-to-html/page.jsx:15`). Ouvert depuis le disque, un texte accentué peut s'afficher mal selon l'encodage par défaut du navigateur. | « the rendered HTML (body content only) » — ou envelopper le fichier dans un document complet (code). |
| markdown-editor | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | 92 pages. | Supprimer ou fait propre. |
| markdown-editor | about, étape 3, FAQ 3, astuces 1-2 | (texte identique à Markdown Previewer) | GÉNÉRIQUE | Code identique à markdown-previewer sauf le texte d'exemple (`page:9`) et la classe de l'aperçu (`page:29`) ; about identique au nom près ; `unicite-avant.json` `over` : ratio 0,556 (le plus haut des dev-tools). | Différencier les deux pages (ou fusion/redirection : décision propriétaire). |
| markdown-editor | page entière | « Markdown Editor » | MINCE | Aucune aide à l'édition : une zone de texte (`page:28`), pas de barre d'outils, de raccourcis ni d'enregistrement local ; rien ne justifie le nom « Editor » face au Previewer. Faits absents : les images du Markdown sont chargées depuis leur site d'origine par le navigateur (rendu `page:29`). | Décrire ce que la page fait réellement (ou décision propriétaire sur le doublon). |

#### markdown-previewer (`/tools/developer-tools/markdown-previewer`)

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| markdown-previewer | titre (+ og) | « Markdown Previewer — Render a Small Subset Online Free » | FAUX | marked GFM (`page:3,18`). | Ex. « Markdown Previewer — Live CommonMark + GFM Preview ». |
| markdown-previewer | méta (+ og) | « renders a small subset of Markdown live as you type — headings, bold, italic, and lists » | FAUX | `page:18` : tables, liens, images, blocs de code, listes de tâches… sont rendus. | Lister la vraie couverture (CommonMark + GFM). |
| markdown-previewer | étape 2 (+ about, FAQ 2) | « Watch the formatted preview update instantly » | TROMPEUR | Aperçu `page:29` (classe `text-sm` seulement) sous le reset Tailwind (`node_modules/tailwindcss/preflight.css:73-80,197-200`) : titres non agrandis, listes sans puces, tableaux sans bordures. À confirmer visuellement. | Corriger l'affichage (code) ; ne pas promettre le rendu visuel en attendant. |
| markdown-previewer | about / étape 4 / FAQ 3 | « the rendered page as .html » | TROMPEUR | `page:33` : fragment sans `<!DOCTYPE>` ni `<meta charset>`. | « the rendered HTML (body content only) ». |
| markdown-previewer | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | 92 pages. | Supprimer ou fait propre. |
| markdown-previewer | about, étape 3, FAQ 2, astuces 1-2 | (texte identique à Markdown Editor) | GÉNÉRIQUE | Doublon (voir markdown-editor). | Différencier ou fusionner (propriétaire). |

#### markdown-to-html (`/tools/developer-tools/markdown-to-html`)

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| markdown-to-html | titre (+ og) | « Markdown to HTML — Convert a Small Subset of Markdown Online » | FAUX | `app/lib/codeTools.js:78-81` : `marked.parse(md, { gfm: true })`. | Ex. « Markdown to HTML — Convert CommonMark + GFM to a Full HTML Page ». |
| markdown-to-html | méta (+ og) | « converts a small subset of Markdown into a complete HTML document » | FAUX | Même code ; l'about de la page dit l'inverse. | « converts CommonMark and GitHub Flavored Markdown into a complete HTML5 document ». |
| markdown-to-html | FAQ 4 | « Is my code uploaded to a server? » / « No — everything runs in your browser; the engine is downloaded once when you first click. » | GÉNÉRIQUE | Question sur 9 pages, réponse sur 8 (`unicite-avant.json`) ; « code » ne convient pas à du Markdown. Fond vrai (`app/lib/codeTools.js:79` import à la demande). | « Is my Markdown uploaded? » + réponse propre. |
| markdown-to-html | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | 92 pages. | Supprimer ou fait propre. |
| markdown-to-html | étapes / about | (absence) | MINCE | Page courte (221 mots SEO). Absents : le bouton « Download » de `document.html` (`page:27`) ; le document n'a ni `<title>` ni `lang` (`page:15`) ; le HTML brut (y compris `<script>`) n'est pas nettoyé (aucun DOMPurify, `page:14-15`) ; pas d'aperçu rendu ; en cas d'erreur la sortie commence par « Error: » (`page:16`). | Ajouter ces faits ; citer le bouton Download dans les étapes. |

#### password-generator (`/tools/developer-tools/password-generator`)

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| password-generator | titre + méta (+ og) | « Build a Random Password » ; « builds a random password from the character sets you select » | MINCE | Omet le mode « Passphrase » (`page:19,80-92`), la génération de 1 à 50 d'un coup (`page:40,68,106`), l'option « Avoid look-alike characters » (`page:102`) et l'indicateur de force (`page:109`). | Méta : mots de passe ou phrases de passe (liste EFF), 1 à 50 à la fois, force affichée. |
| password-generator | étape 4 | « Click 'Generate Password' » | LIBELLÉ | En mode Passphrase le bouton s'appelle « Generate Passphrase » (`page:108`). | « Click 'Generate Password' (or 'Generate Passphrase') ». |
| password-generator | étape 5 | « Click 'Copy' to copy it to your clipboard. » | TROMPEUR | Avec « How many » > 1, « Copy » ne copie que le premier (`page:112`, `password = all[0]` `page:42,70`) ; les autres sont dans une zone en lecture seule sans bouton (`page:111`). | Dire que Copy copie le premier ; sélectionner la liste pour les autres (ou ajouter un bouton, code). |
| password-generator | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | 92 pages. | Supprimer ou fait propre. |
| password-generator | astuces 2-3 | « Generate a unique password for every account… » ; « Store generated passwords in a password manager… » | GÉNÉRIQUE | Conseils de sécurité valables sur n'importe quel site, sans lien avec l'outil. | Remplacer par des faits de l'outil : chaque type coché apparaît au moins une fois (`page:65-67`) ; jeu de symboles exact (`page:53`) ; caractères retirés par « Avoid look-alike » (`page:49`). |

#### regex-tester (`/tools/developer-tools/regex-tester`)

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| regex-tester | titre (+ og) | « Regex Tester — Run Your Pattern Against Javascript's Native » | MINCE | Phrase coupée (« Native » quoi ?), « Javascript » mal écrit (`layout:5,9`). | Ex. « Regex Tester — Test JavaScript Regular Expressions with Groups and Replace ». |
| regex-tester | about / méta | « nothing is uploaded to a server » | TROMPEUR | Un motif invalide : le message d'erreur du moteur, qui contient le motif (`/…/g`), est envoyé au journal (`page:43` → `app/lib/useToolError.js:19-30` → `app/lib/reportError.js:163-171`). Le nettoyage le remplace par `[path]` (`app/lib/reportError.js:97`) sauf si le motif contient `"`, `'`, `<` ou `>` : testé sur une copie, `(?<n>x)(?<n>y)` et `a"b(` partent en clair. Le texte à tester n'est jamais envoyé. | Corriger le code (propriétaire) ou dire : « your text is never sent; if your pattern is invalid, the error message is logged ». |
| regex-tester | FAQ 3 | « every match is highlighted in the text, and listed with its start–end position » | TROMPEUR | Le Worker s'arrête à 5 000 correspondances (`page:19`, affichage « 5000+ » `page:77`) ; le tableau n'en liste que 200 (`page:83,88`). | « Up to 5,000 matches are highlighted; the first 200 are listed with their position and groups ». |
| regex-tester | astuce 1 | « (matches are always all listed) » | FAUX | `page:19,83,88`. | Supprimer la parenthèse ou donner les plafonds. |
| regex-tester | étapes | (absence) | MINCE | Le résultat du remplacement se télécharge (`replaced.txt`, `page:92`) ; les drapeaux acceptés sont d, g, i, m, s, u, v, y, chacun une fois, sinon message (`page:38`) ; le texte n'est pas dit. | Ajouter ces faits. |

#### timestamp-converter (`/tools/developer-tools/timestamp-converter`)

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| timestamp-converter | titre (+ og) | « Convert a Unix Timestamp (in Seconds) » | FORMAT | Millisecondes, microsecondes et nanosecondes acceptées, unité déduite du nombre de chiffres (`app/lib/timestamp.js:11-16,24-25`). | « Unix Timestamp Converter — Seconds, Milliseconds, µs, ns to Date ». |
| timestamp-converter | méta (+ og) | « converts a Unix timestamp (in seconds) to a date and back » | FORMAT | Même code. | Citer les 4 unités et le fuseau au choix. |
| timestamp-converter | about / étape 4 | « Each result is shown in UTC (ISO 8601) and in your own time zone » ; « Read the UTC and local results » | TROMPEUR | Le second résultat est dans le fuseau choisi dans la liste (`page:49-54,63`), le fuseau du visiteur n'étant que la valeur par défaut (`page:28`). Le temps relatif (`page:64`) n'est pas cité. | « in UTC and in the time zone you choose (yours by default), plus the relative time ». |
| timestamp-converter | about | « anything that isn't a number is reported instead of being partially read » | TROMPEUR | Une partie décimale est acceptée par l'expression (`app/lib/timestamp.js:21`) mais n'est prise en compte que pour les secondes (`:30`) : `1700000000000.7` (ms) perd `.7` sans message. Le message d'erreur dit « whole number » alors que les décimales sont acceptées (`:22`). | « Decimals are read for seconds only (to the millisecond) ». |
| timestamp-converter | about | « Like epochconverter.com, it recognises the unit from the number of digits » | INVÉRIFIABLE | Comparaison avec un tiers non prouvée par un rapport (seulement affirmée : `docs/audit/RAPPORT-qualite-29-09.md:56`, commentaire `app/lib/timestamp.js:7`). Les seuils réels : ≤ 11 chiffres secondes, 12-14 ms, 15-17 µs, 18-20 ns (`app/lib/timestamp.js:11-16`). | Supprimer la comparaison, donner les seuils. |
| timestamp-converter | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | 92 pages. | Supprimer ou fait propre. |

#### uuid-generator (`/tools/developer-tools/uuid-generator`)

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| uuid-generator | titre (+ og) | « Create Version 4 (random) UUIDs » | FORMAT | Versions proposées : v4, v7, nil (`page:49`) ; majuscules, sans tirets, accolades (`page:51-53`) ; 1 à 1000 (`page:35`). | « UUID Generator — v4 and v7 UUIDs, up to 1,000 at a Time ». |
| uuid-generator | méta (+ og) | « creates version 4 (random) UUIDs » | FORMAT | Même code. | Citer v4, v7, nil, formats, 1-1000. |
| uuid-generator | étape 2 | « Click 'Generate' to create that many random UUIDs. » | TROMPEUR | Nil : un seul UUID tout à zéro quel que soit le nombre (`page:37-38`) ; v7 : horodatage + compteur (`page:17-24`), pas purement aléatoire. | « creates that many UUIDs of the chosen version (the nil UUID is a single all-zero value) ». |
| uuid-generator | FAQ 4 | « Are these UUIDs safe to use as unguessable tokens? » / « Yes … they aren't predictable. » | TROMPEUR | Vrai pour v4 (122 bits aléatoires, `page:26-33`). v7 commence par l'heure de création en ms sur 48 bits (`page:21`) et, dans une même milliseconde, un compteur incrémenté de 1 (`page:19`) : l'heure se lit et la partie compteur se devine. Le nil est constant. | « v4: yes (122 random bits). v7 reveals its creation time; use v4 for secret tokens. » |
| uuid-generator | FAQ 2 | « Yes, completely free with no registration required. » | GÉNÉRIQUE | Sur 5 pages (`unicite-avant.json`). | Supprimer ou fait propre. |

---

#### Synthèse du lot dev-misc

13 outils lus, 70 défauts :

| Type | Nombre |
|---|---|
| FAUX | 12 |
| TROMPEUR | 19 |
| GÉNÉRIQUE | 18 |
| MINCE | 13 |
| LIBELLÉ | 2 |
| FORMAT | 4 |
| INVÉRIFIABLE | 2 |
| **Total** | **70** |

Les plus graves :
1. **regex-tester et api-tester** : « nothing is uploaded » / « Nothing passes through our servers », alors que le journal
   d'erreurs reçoit en clair un motif contenant `"`, `'`, `<` ou `>`, ou le début d'un en-tête `Authorization` mal saisi
   (`app/lib/reportError.js:97` ne couvre pas ces cas). C'est aussi un défaut de confidentialité dans le code, à corriger
   par le propriétaire.
2. **cron-expression et cron-expression-builder** : about et astuce 3 disent « no syntax validation, no next-run-time
   preview » alors que les deux pages vérifient l'expression et listent les 5 prochaines exécutions. La méta de
   cron-expression promet une chaîne « valid ».
3. **markdown-editor, markdown-previewer, markdown-to-html** : titres et métas annoncent « a small subset of Markdown »
   (faux : marked en GFM). Pour l'Editor et le Previewer, l'aperçu « rendered » s'affiche probablement sans style (titres,
   listes, tableaux) : `prose` sans plugin et reset Tailwind. À confirmer visuellement.

Doublons à trancher par le propriétaire : markdown-editor / markdown-previewer (code identique), cron-expression /
cron-expression-builder (code identique sauf préréglages), color-picker ⊂ color-converter, diff-viewer ≈ text-comparator.
Aucune valeur NON TROUVÉ dans ce lot (aucune limite de taille dans le code de ces 13 outils : voir les fiches).


---

### Lot convert-qr-math

Lu le 05/10/2026 (branche p36, lecture seule). Texte confronté : `docs/audit/p36/contenu-avant.json` (titre, méta, H1,
interface, About, étapes, FAQ, astuces) + textes visibles rendus par le code mais absents de l'extraction (notes des liens
« Related tools » fournies par la page, légende de l'exemple).

**Conventions.** Les chemins sans préfixe sont relatifs à `app/tools/` ; ceux qui commencent par `app/`, `node_modules/`
ou `docs/` sont relatifs à la racine du dépôt. « étape n » = n-ième élément de `howTo`, « FAQ n » = n-ième question,
« astuce n » = n-ième élément de `tips`, dans l'ordre de la page. Un titre coupé au milieu d'une phrase (« … With »,
« …, Median, ») est classé **MINCE** quand il ne dit rien de faux, **FAUX/TROMPEUR** quand ce qu'il en reste est faux ou
partiel. « Vérifié node » = calcul rejoué en local avec Node 24 sur la fonction du code (aucun navigateur, aucun serveur).

**Constats communs au lot (vrais, donc hors tableaux) :** aucun des 12 outils n'appelle une route `app/api/*` de calcul ou
de conversion, donc aucune inscription, aucun quota par réseau, aucun plafond de dépense (grep `fetch(` et `/api/` sur
les 12 dossiers et `app/lib/qrRender.js`, `qrPayload.js`, `mathTools.js` : seuls `currency-converter/page.jsx:52`,
`currency-converter/RateHistory.jsx:21,51` et `mobi-to-epub/page.jsx:109` (adresse `blob:` locale) font une requête).
Seule sortie vers le site : quand une page affiche un message d'erreur via `useToolError` / `reportShownMessage`, le
texte affiché, nettoyé, part vers `/api/report-error` (`app/lib/useToolError.js:28-29`, `app/lib/reportError.js:16,72-121`) —
cela compte pour les phrases « nothing you type is sent » (voir barcode-generator et statistics-calculator).

---

#### 1. Color Converter — `/tools/converter-tools/color-converter`

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| color-converter | titre | « Convert Between Hex, RGB Online Free » | FORMAT | HSL, HSV/HSB et CMYK sont aussi éditables et copiables (`converter-tools/color-converter/page.jsx:73-77`), plus l'opacité (alpha) (`page.jsx:133-134`) et HEX à 3/4/6/8 chiffres (`page.jsx:10-18`) | Titre qui nomme HEX, RGB, HSL, HSV et CMYK |
| color-converter | méta | « converts between HEX, RGB, and HSL color values » | FORMAT | HSV et CMYK absents de la méta (`converter-tools/color-converter/layout.tsx:6`) alors que la page les convertit (`page.jsx:76-77`) | Méta qui liste les 5 formats + alpha + contraste WCAG |
| color-converter | FAQ 3 | « the same as most online converters » | INVÉRIFIABLE | Le code ne cite que RapidTables et ColorHexa comme références (`page.jsx:5`) ; aucun relevé « most » dans `docs/audit/` | « the formula RapidTables and ColorHexa also use » ou supprimer |
| color-converter | FAQ 2 | « Yes, it's completely free with no registration required. » | GÉNÉRIQUE | Vrai (aucune route serveur), mais copiable sur toute page | Fusionner dans une ligne de faits propre à l'outil |
| color-converter | FAQ 6 | « all color math happens locally in your browser — what you enter is never sent to a server » | GÉNÉRIQUE | Vrai (aucune requête dans `page.jsx`), phrase copiable | Dire concrètement : aucun envoi, pas même les messages d'erreur (la page n'utilise pas `useToolError`) |
| color-converter | astuce 1 | « Use the color picker swatch for quick visual selection instead of typing values manually. » | GÉNÉRIQUE | Le sélecteur est un `<input type="color">` (`page.jsx:127`) ; conseil sans information | Remplacer par un fait : le sélecteur ne gère pas l'alpha, utiliser le curseur « Opacity (alpha) » (`page.jsx:133-134`) |
| color-converter | astuce 3 | « HSV is the model most design tools use in their color pickers » | INVÉRIFIABLE | Aucune source dans le code ni dans `docs/audit/` | Supprimer « most design tools » ; garder « Photoshop calls it HSB » seulement si sourcé |

#### 2. Currency Converter — `/tools/converter-tools/currency-converter`

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| currency-converter | titre | « Convert Between 24 Major World » | FAUX | La liste vient de l'API (`converter-tools/currency-converter/page.jsx:12,74`) : 166 devises (`docs/audit/RAPPORT-licence-et-ameliorations.md:124-126`, « 166 devises au lieu de 24 ») ; 20 devises « populaires » en tête (`page.jsx:14`) ; titre en plus coupé (`layout.tsx:5`) | Titre complet sans « 24 » (166 devises, taux quotidiens, historique) |
| currency-converter | FAQ 5 | « the amount and the currencies you choose are never sent anywhere » | FAUX | Les deux codes choisis partent vers api.frankfurter.dev : `rates?base=${from}&quotes=${to}` (`RateHistory.jsx:49,51`), et la liste `/currencies` y est demandée (`RateHistory.jsx:21`) ; la même réponse le dit plus loin (contradiction interne) | « The amount never leaves your browser; the two currency codes are sent to Frankfurter for the history chart » |
| currency-converter | About + FAQ 3 | « each shown with its full name » / « each with its full name » | TROMPEUR | Les noms viennent de `Intl.DisplayNames` du navigateur (`page.jsx:15-18`) ; un code inconnu du navigateur s'affiche seul (`page.jsx:17`), et sans `Intl.DisplayNames` toute la liste n'a que des codes (`page.jsx:16`). Vérifié node (ICU de Node 24, pas un navigateur) : FOK, KID, TVD, GGP, IMP, JEP n'ont pas de nom | « with its full name where your browser knows it (a few territory currencies such as FOK or KID show only their code) » |
| currency-converter | FAQ 3 | « every currency with a published daily rate » | INVÉRIFIABLE | La liste est ce que renvoie `open.er-api.com/v6/latest/USD` (`page.jsx:12,74`), rien ne prouve l'exhaustivité | « the 166 currencies ExchangeRate-API publishes » |
| currency-converter | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | Vrai, copiable | Remplacer par un fait propre (source des taux, attribution, fréquence) |
| currency-converter | astuce 4 | « Bookmark the tool for quick reference during travel or online shopping in another currency. » | GÉNÉRIQUE | Aucune information sur l'outil | Remplacer par la fonction non dite « {montant} {devise} in other currencies » (tableau des 20 devises populaires, `page.jsx:124-134`) |

#### 3. MOBI to EPUB — `/tools/converter-tools/mobi-to-epub`

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| mobi-to-epub | méta + About + FAQ 1 | « a real, standards-compliant EPUB file » / « standards-compliant, ZIP-based EPUB » | FAUX | Le paquet est déclaré EPUB 3.0 (`converter-tools/mobi-to-epub/page.jsx:187`) mais le `<metadata>` n'a pas la `meta property="dcterms:modified"` que la norme EPUB 3 exige (`page.jsx:176-206`, aucun « modified » dans le fichier) ; `dc:language` peut valoir « unknown » (parser `node_modules/@lingo-reader/mobi-parser/dist/index.browser.mjs:785`, écrit tel quel `page.jsx:191`). Aucun rapport epubcheck dans `docs/audit/` | « an EPUB 3 file (ZIP with the mimetype entry first, OPF, nav and NCX table of contents) » sans « standards-compliant » |
| mobi-to-epub | About | « so chapters, images, and the cover are extracted correctly … that opens in standard e-reader apps » | INVÉRIFIABLE | Aucun rapport d'ouverture dans des liseuses dans `docs/audit/` (seuls `2026-09-06-couverture-formats.md:61-81`, `PROGRESS-famille4.md:19` sur les extensions) | Décrire ce qui est copié (chapitres dans l'ordre du spine, images, feuilles de style, couverture, titre/auteur/éditeur/description) sans garantie d'ouverture |
| mobi-to-epub | FAQ 1 | « Will this reliably convert my MOBI ebook to a working EPUB? » — « Yes » | INVÉRIFIABLE | Aucune mesure de fiabilité dans `docs/audit/` | Question factuelle : « What is copied into the EPUB? » |
| mobi-to-epub | FAQ 3 + astuce 2 | « The parser automatically detects whether a file uses the older MOBI6 structure … or the newer KF8 structure » / « with the internal format detected automatically » | TROMPEUR | Le choix se fait par l'extension : `.azw3` → lecteur KF8, sinon lecteur MOBI6 ; l'autre n'est essayé que si le premier lève une erreur (`page.jsx:243-254`) | « A .azw3 file is read as KF8, the others as MOBI6; if that fails, the other reader is tried » |
| mobi-to-epub | titre | « Convert Your Kindle Ebook » | TROMPEUR | Les fichiers protégés DRM ne sont pas convertis, et la page ne le détecte pas : le champ `encryption` est lu par le parser (`index.browser.mjs:162`) mais jamais testé, ni par le parser ni par `page.jsx` (aucun test DRM) — effet réel sur un fichier DRM non vérifié | « Convert a DRM-free MOBI, AZW, AZW3 or PRC ebook to EPUB » |
| mobi-to-epub | interface | « Click or drop a MOBI file here » / « Choose a MOBI file » | FORMAT | Le sélecteur accepte `.mobi,.azw,.azw3,.prc` (`page.jsx:376`) ; l'invite ne nomme que MOBI (`page.jsx:375`, `app/components/UploadPrompt.jsx:10-11`) | « a MOBI, AZW, AZW3 or PRC file » |
| mobi-to-epub | FAQ 2 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | Vrai, copiable | Fusionner dans une ligne de faits |
| mobi-to-epub | FAQ 4 | « No. All processing happens locally in your browser — your file is never uploaded to a server. » | GÉNÉRIQUE | Vrai (seul `fetch` = adresse `blob:` locale, `page.jsx:109`) ; copiable | Dire ce qui se passe réellement : fichier lu en mémoire, EPUB créé par JSZip dans la page (`page.jsx:278-357`) |
| mobi-to-epub | astuce 4 | « Always open the resulting EPUB in your e-reader app to confirm it looks right before deleting your original file. » | GÉNÉRIQUE | Redite de l'étape 4 | Remplacer par un fait (liens internes non réécrits, nom de sortie `<nom>.epub` `page.jsx:385`) |
| mobi-to-epub | page entière | — | MINCE | Faits du code absents du texte : aucune limite de taille (aucune constante, tout le fichier en mémoire `page.jsx:284`) ; métadonnées recopiées (titre, auteurs, éditeur, description, langue, couverture `page.jsx:176-195`) ; table des matières NCX + nav (`page.jsx:208-241`) ; message d'erreur « No readable chapters found in this file. » (`page.jsx:289`) ; nom du fichier de sortie (`page.jsx:385`) ; bouton « Save / Share » sur les appareils qui partagent (`app/components/FileDownload.jsx:213-218`) | Ajouter un bloc « Formats et limites » et « Ce qui est copié » |

#### 4. Unit Converter — `/tools/converter-tools/unit-converter`

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| unit-converter | titre | « Convert Between Units Across Six Categories » | FAUX | 12 catégories (`converter-tools/unit-converter/page.jsx:15-29`) | « … across 12 categories » (ou les nommer) |
| unit-converter | méta | « six categories — Length, Weight, Temperature, Speed, Area, and Volume » | FAUX | 12 : + Fuel economy, Time, Data, Pressure, Energy, Power (`page.jsx:20,24-28`) | Méta avec les 12 catégories |
| unit-converter | étape 1 | « (Length, Weight, Temperature, Speed, Area, Volume, Time, Data, Pressure, Energy or Power) » | FAUX | Il y a aussi le bouton « Fuel economy » (`page.jsx:20,104-114`) | Ajouter « Fuel economy » |
| unit-converter | étape 4 | « with the factor for one unit underneath » | TROMPEUR | La ligne « 1 X = … » n'est pas affichée pour Temperature ni Fuel economy (`page.jsx:155`) | « … (except for temperature and fuel economy, which are not simple factors) » |
| unit-converter | astuce 2 | « the conversion isn't a simple multiplier like the other categories, since Celsius, Fahrenheit, and Kelvin use different zero points » | TROMPEUR | Fuel economy n'est pas un multiplicateur non plus (L/100 km est l'inverse de km/L, `page.jsx:31-37`) ; Rankine oublié (`page.jsx:19,43`) | Citer aussi Rankine et la consommation (inverse) |
| unit-converter | FAQ 1 | « Yes, it's completely free with no signup and no limits. » | GÉNÉRIQUE | Vrai, copiable | Fusionner dans une ligne de faits |
| unit-converter | FAQ 4 | « everything is calculated locally in your browser — what you enter is never sent to a server » | GÉNÉRIQUE | Vrai (aucune requête), copiable | Remplacer par un fait propre (saisie : séparateurs de milliers, « 1,000 » ambigu refusé `page.jsx:63-75,153`) |
| unit-converter | astuce 4 | « Bookmark this page for quick access to conversions you use often in cooking, DIY, or technical work. » | GÉNÉRIQUE | Aucune information | Remplacer par un fait (notation scientifique dès 1e15 et sous 1e-6, `page.jsx:53-55` ; alerte sous le zéro absolu `page.jsx:85,131`) |

#### 5. Barcode Generator — `/tools/qr-barcodes-tools/barcode-generator`

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| barcode-generator | méta + interface + About + étape 4 | « Every code is scanned back before you download it. » / « Every code is read back by an independent decoder before it is offered » / « each code is drawn, then scanned back by a separate reader » | TROMPEUR | 5 types sur 37 ne sont pas relus : MSI Plessey, Pharmacode, Code 11, EAN-5 seul, EAN-2 seul (`zxing: null`, `qr-barcodes-tools/barcode-generator/symbologies.js:19-21,38-39` ; `page.jsx:118`, message `page.jsx:416`). Et ce qui est relu est l'image raster dessinée sur le canvas ; SVG, PDF et EPS sont redessinés à part et ne sont pas décodés (`render.js:327-336`, `page.jsx:140-141`) | « Each code is drawn and read back by zxing-cpp before the files are offered — except MSI Plessey, Pharmacode, Code 11 and the standalone EAN-5/EAN-2, which no browser reader decodes (the page says so). SVG/PDF/EPS are drawn from the same settings. » |
| barcode-generator | FAQ 3 | « MSI Plessey, Pharmacode and Code 11 have no such reader in a browser » | TROMPEUR | EAN-5 seul et EAN-2 seul non plus (`symbologies.js:38-39`) | Lister les 5 types |
| barcode-generator | FAQ 3 | « only offers the files if it reads exactly what you entered (check digits included) » | TROMPEUR | Code 39 et Interleaved 2 of 5 avec « Add the optional check digit » : la valeur attendue est `null`, la page vérifie seulement qu'un code du bon type a été lu (`render.js:282-283,301,324`) | Ajouter l'exception |
| barcode-generator | About | « Download PNG, JPG or GIF with the resolution written in » | FAUX | Seuls PNG (bloc pHYs, `render.js:204-215`) et JPG (densité JFIF, `render.js:216-224`) reçoivent la résolution ; le GIF est encodé sans (`render.js:239-248,331`) | « PNG and JPG with the resolution written in; GIF … » |
| barcode-generator | FAQ 4 | « PNG, JPG and GIF use a whole number of pixels per module … and writes that resolution into the file » | FAUX | Idem : pas de résolution dans le GIF (`render.js:239-248,331`) ; la phrase est dans `seo.js:7` | Retirer GIF de « writes that resolution » |
| barcode-generator | FAQ 6 | « or import a CSV or TSV file » | TROMPEUR | Fichier refusé au-delà de 5 Mo (`page.jsx:160`), limite non dite (`seo.js:9`) | « (up to 5 MB) » |
| barcode-generator | FAQ 9 + About | « nothing you type is sent to a server » / « nothing is uploaded » | TROMPEUR | Quand aucun code d'un lot n'a pu être fait, le message affiché contient les valeurs (« No code could be made: line 1: <valeur> — … », `page.jsx:198`) ; l'erreur passe par `useToolError` (`page.jsx:64`) et part nettoyée vers `/api/report-error` (`app/lib/useToolError.js:28-29`) ; le nettoyage ne retire que les passages entre guillemets, URL, courriels, suites de 7 chiffres et noms de fichier (`app/lib/reportError.js:72-121`) — une valeur courte non citée passe | Corriger le message (valeurs entre guillemets) ou dire « except the text of an error message, without your file » |
| barcode-generator | étape 2 | « switch to "Many (ZIP)" » | LIBELLÉ | Le bouton s'appelle « Many (ZIP or labels) » (`page.jsx:267`) | Citer le vrai libellé |
| barcode-generator | étape 4 | « Click Generate » | LIBELLÉ | Boutons « Generate Barcode » (`page.jsx:395`), « Generate all as ZIP » / « Generate label sheets (PDF) » (`page.jsx:398`) | Citer les trois libellés |
| barcode-generator | lien associé (note fournie par la page) | « QR Scanner — decode a QR code from an image » | LIBELLÉ | L'outil s'appelle « QR Code Scanner » (`app/lib/relatedTools.js:394`) et lit aussi la caméra et les codes-barres (`qr-scanner/page.jsx:86-115`, `qr-scanner/scan.worker.js:12`) ; note dans `seo.js:28` | « QR Code Scanner — camera or image, QR codes and barcodes » |

#### 6. QR Code Generator — `/tools/qr-barcodes-tools/qr-generator`

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| qr-generator | titre | « Instantly Turns … » | INVÉRIFIABLE | Aucune mesure de durée dans `docs/audit/` ; génération + relecture jsQR asynchrones (`qr-barcodes-tools/qr-generator/page.jsx:84-99`) | Retirer « Instantly » |
| qr-generator | titre | « Any Text or URL » | TROMPEUR | Un contenu trop long est refusé : « This is too much content for one QR code… » (`page.jsx:86`) ; huit types, pas seulement texte/URL (`app/lib/qrPayload.js:11-20`) | « QR Code Generator — Links, Wi-Fi, vCard, SMS… as PNG, SVG or PDF » |
| qr-generator | méta + interface + About + étape 3 + FAQ 4 | « each one scanned back before download » / « Every code is scanned back before you download it » / « every code is read back by a QR decoder before you can download it » | TROMPEUR | Seul le dessin PNG du canvas est décodé (réduit à 800 px, jsQR, `app/lib/qrRender.js:117-136` ; `page.jsx:88-94`) ; le SVG et le PDF sont dessinés à part et non décodés (`qrRender.js:62-113`), et le PDF dessine la forme « Rounded » en carrés (`qrRender.js:103`) | « The PNG drawing is read back by a QR decoder before the files are offered; SVG and PDF use the same module grid » |
| qr-generator | About + FAQ 5 | « a choice of module shapes » / « SVG or PDF for print » | TROMPEUR | La forme « Rounded » devient carrée dans le PDF (`qrRender.js:103`) ; seuls PNG et SVG la gardent (`qrRender.js:47-48,80`) | « Rounded is kept in PNG and SVG; the PDF draws square modules » |
| qr-generator | FAQ 5 + astuce 1 | « both are vector files that stay sharp at any size » / « they stay crisp at any size » | TROMPEUR | Avec un logo : le SVG embarque l'image telle qu'envoyée (`qrRender.js:85`), le PDF une copie PNG de 512 px au plus (`page.jsx:66-72`, `qrRender.js:106`) | « The code itself is vector; a logo stays the image you gave (PDF: at most 512 px) » |
| qr-generator | About | « Unlike most generators » | INVÉRIFIABLE | Seul QRCode Monkey a été comparé (`page.jsx:11-13`) | « Unlike QRCode Monkey » ou supprimer |
| qr-generator | FAQ 4 | « the way a phone camera does » | INVÉRIFIABLE | Le lecteur est la bibliothèque jsQR, lumineux sur sombre non essayé (`qrRender.js:126,134`) | « decodes it with jsQR, an open-source QR reader » |
| qr-generator | FAQ 2 | « (phones join the network when they scan it) » | INVÉRIFIABLE | Le code écrit seulement la charge `WIFI:T:…;S:…;P:…;` (`qrPayload.js:50-56`) ; le comportement du téléphone n'est pas prouvé dans le dépôt | « most phone cameras offer to join the network » sans garantie, ou supprimer |
| qr-generator | étape 3 | « check it holds exactly what you typed » | TROMPEUR | Ce qui est vérifié est la charge construite : « https:// » ajouté à une adresse sans schéma (`qrPayload.js:29`), numéros nettoyés de tout sauf chiffres + * # (`qrPayload.js:9,42,46`), préfixes `mailto:`, `tel:`, `SMSTO:`, `geo:` (`qrPayload.js:39-75`) | « check it holds exactly the content built from your fields » |

#### 7. QR Code Scanner — `/tools/qr-barcodes-tools/qr-scanner`

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| qr-scanner | titre + méta | « Decode Any QR Code Image » / « decodes any QR code image » | TROMPEUR | Seules les images que le navigateur sait ouvrir passent (`qr-barcodes-tools/qr-scanner/page.jsx:55,60-62,82`) ; au-delà de 12 Mpx l'image est réduite (`page.jsx:65-68`) ; échec possible (« No QR code or barcode found in this image », `page.jsx:77`) | « Scan a QR code or barcode from your camera, a photo or a screenshot » |
| qr-scanner | titre + méta | (QR seulement) | FORMAT | Les images envoyées ou collées sont lues pour tous les formats de zxing-cpp (`formats: []`, `scan.worker.js:12`) : codes-barres compris ; non dit dans titre et méta (`layout.tsx:5-6`) | Nommer « QR codes and barcodes » |
| qr-scanner | About | « from any image » | TROMPEUR | Idem ligne 1 (`page.jsx:55,60-62`) | « from a photo or screenshot (PNG, JPG, … any image your browser opens) » |
| qr-scanner | About | « instantly retrieve » | INVÉRIFIABLE | Décodage dans un Worker avec délai de garde de 20 s (`page.jsx:28-34`) ; aucune mesure | Retirer « instantly » |
| qr-scanner | FAQ 5 | « EAN-13, EAN-8, UPC, Code 128, Code 39, ITF, Data Matrix, PDF417, Aztec and Micro QR » / « (zxing, the reference open-source decoder) » | FORMAT | `formats: []` = tous les formats lus par zxing-cpp, dont Code 93 et Codabar cités dans le code (`scan.worker.js:2,12`) ; « the reference » sans source | Liste complète ou « and the other formats zxing-cpp reads (Code 93, Codabar…) » ; retirer « the reference » |
| qr-scanner | FAQ 1 | « Yes, it's completely free and requires no registration to decode unlimited QR codes. » | GÉNÉRIQUE | Vrai (aucune limite, aucune route), copiable | Fusionner dans une ligne de faits |
| qr-scanner | FAQ 3 | « Do I need to install any software? No, … works directly in your browser without any downloads or installations. » | GÉNÉRIQUE | Exemple type des consignes | Supprimer |

#### 8. Fraction Calculator — `/tools/math-tools/fraction-calculator`

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| fraction-calculator | titre | « Adds, Subtracts, Multiplies Online » | TROMPEUR | La division existe (bouton « / », `math-tools/fraction-calculator/page.jsx:58` ; `app/lib/mathTools.js:170-171`) ; titre coupé (`layout.tsx:5`) | Titre avec les 4 opérations, nombres mixtes, étapes |
| fraction-calculator | étape 2 | « Choose +, -, × or ÷. » | LIBELLÉ | Les boutons affichent « + », « - », « * », « / » (`page.jsx:58-67`) | « Choose +, -, * or / » |
| fraction-calculator | FAQ 4 | « the first 100 digits are shown followed by '…' » | FAUX | Sont montrés 100 chiffres **plus** les chiffres non périodiques dus aux facteurs 2 et 5 du dénominateur, suivis de « … (the repeating part is longer than 100 digits) » (`mathTools.js:198-207`) | « the decimal is cut after the first 100 digits of the repeating part, followed by '…' » |
| fraction-calculator | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | Vrai, copiable | Supprimer ou fusionner |

#### 9. Percentage Calculator — `/tools/math-tools/percentage-calculator`

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| percentage-calculator | méta | « exact results as you type » | FAUX | Calcul en virgule flottante affiché à 10 chiffres significatifs (`math-tools/percentage-calculator/page.jsx:35,45,55,65,76,86` ; `app/lib/exactNumbers.js:10-14`) ; la FAQ 8 et l'exemple (« -16.66666667% ») le montrent ; méta dans `seo.js:13` | « results to 10 significant digits as you type » ; citer les 6 calculs |
| percentage-calculator | FAQ 4 | « This calculator computes percentage change, not percentage difference. » | FAUX | Panneau « Percentage difference between X and Y » (`page.jsx:80-87`) ; phrase `seo.js:18` | « Both: the third panel gives the change, the sixth the difference » |
| percentage-calculator | FAQ 6 | « A decrease can never go below −100% » | FAUX | Formule (Y − X) ÷ abs(X) × 100 (`page.jsx:55`) : de 10 à −5 = −150 % (vérifié node) ; phrase `seo.js:20` | « … below −100 % only when the new value is negative » |
| percentage-calculator | FAQ 3 | « (new − old) ÷ old × 100 » | TROMPEUR | Le code divise par la valeur absolue de l'ancienne valeur (`page.jsx:55`, commentaire « from -10 to -5 is +50 % ») ; phrase `seo.js:17` | « (new − old) ÷ the absolute value of old × 100 » |
| percentage-calculator | FAQ 10 | « Do the three panels work independently? » | FAUX | Six panneaux (`page.jsx:29,39,49,59,69,80`) ; phrase `seo.js:24` | « Do the six panels… » |
| percentage-calculator | astuce 1 | « keep values filled in across all three at once » | FAUX | Six panneaux (`page.jsx:29-87`) ; texte `page.jsx:104` | « across all six » |
| percentage-calculator | exemple (légende) | « The three calculations » | TROMPEUR | La page en propose six (`page.jsx:29-87`) ; légende `seo.js:27` | « Three of the six calculations » |
| percentage-calculator | lien associé (note fournie par la page) | « Unit Converter — length, weight, temperature, speed, area and volume. » | FAUX | 12 catégories (`converter-tools/unit-converter/page.jsx:15-29`) ; note `seo.js:38` | Note à jour (12 catégories) |
| percentage-calculator | FAQ 9 | « It is free with no signup, and every calculation runs in your browser — nothing you type is sent anywhere. » | GÉNÉRIQUE | Vrai (aucune requête, pas de `useToolError` dans `page.jsx`), copiable | Garder un seul fait précis, sans la formule générique |

#### 10. Roman Numeral Converter — `/tools/math-tools/roman-numeral-converter`

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| roman-numeral-converter | FAQ 2 | « Does it validate strict Roman numeral syntax? No — … even unconventional ones like "IIII", so it won't flag … as errors. » | FAUX | Seule la forme canonique est acceptée : `fromRoman` refuse ce que `toRoman` n'écrit pas (`app/lib/exactNumbers.js:68-75`) ; message « "IIII" is not a valid Roman numeral (standard form, 1 to 3999 — for example 4 is IV, not IIII) » (`math-tools/roman-numeral-converter/page.jsx:51`) | « Yes: only the standard form is accepted (IIII, IM, VX are refused with a message) » |
| roman-numeral-converter | astuce 4 | « this tool doesn't flag non-standard letter combinations as invalid » | FAUX | Idem (`exactNumbers.js:68-75`, `page.jsx:33,51`) | Retourner l'astuce : la page signale les formes non standard |
| roman-numeral-converter | titre | « Convert Between Arabic Numbers » | MINCE | Titre coupé : la seconde moitié (« and Roman numerals ») manque (`layout.tsx:5`) | Titre complet |
| roman-numeral-converter | About | « converts between Arabic numbers (1–3999) and Roman numerals instantly and bidirectionally as you type, entirely in your browser. » | MINCE | Une seule phrase (`page.jsx:64`). Absents : refus des décimales/exposants avec message (`page.jsx:21`), message hors 1–3999 (`page.jsx:24`), validation stricte (`page.jsx:51`), majuscules automatiques (`page.jsx:28`) | About de 3–4 phrases avec ces faits |
| roman-numeral-converter | FAQ 4 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | Vrai, copiable | Supprimer |

#### 11. Scientific Calculator — `/tools/math-tools/scientific-calculator`

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| scientific-calculator | titre | « Scientific Calculator — Evaluate Expressions With » | MINCE | Titre coupé après « With » (`math-tools/scientific-calculator/layout.tsx:5`) | Titre complet (degrés/radians, log/ln, n!, Ans, historique) |
| scientific-calculator | FAQ 4 | « very large or very small results use scientific notation instead of being rounded to 0 » | TROMPEUR | Affichage `String(Number(x.toPrecision(12)))` (`app/lib/mathTools.js:19-24`) : la notation scientifique n'apparaît qu'à partir de 1e21 ; 2^60 s'affiche « 1152921504610000000 » (12 chiffres puis des zéros, vrai 1152921504606846976 — vérifié node). Les petits nombres (< 1e-6) sont bien en notation scientifique | « 12 significant digits; below 0.000001 and from 1e21 up, scientific notation » |
| scientific-calculator | interface | « Advanced scientific calculator » | GÉNÉRIQUE | Sous-titre sans information (`page.jsx:115`) | Sous-titre factuel (« Degrees or radians, log and ln, n!, Ans and memory ») |
| scientific-calculator | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | Vrai, copiable | Supprimer |

#### 12. Statistics Calculator — `/tools/math-tools/statistics-calculator`

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| statistics-calculator | titre | « Compute Count, Sum, Mean, Median, » | MINCE | Titre coupé après une virgule (`math-tools/statistics-calculator/layout.tsx:5`) | Titre complet |
| statistics-calculator | FAQ 5 | « A measure that is not defined for your data shows — with the reason. » | FAUX | Sans raison : écart type et variance d'échantillon (`page.jsx:48,50`), IQR (`page.jsx:54`), erreur standard (`page.jsx:55`), coefficient de variation (`page.jsx:56`), valeurs aberrantes (`page.jsx:60`) affichent « — » seul ; la raison n'est donnée que pour les moyennes géométrique/harmonique, Q1/Q3, asymétrie et kurtosis (`page.jsx:45-46,52-53,57-58`) | « … shows —; for the means, quartiles, skewness and kurtosis the reason is written » |
| statistics-calculator | About | « any entry that isn't a number is listed » | TROMPEUR | Seules les 5 premières sont citées, puis « … » (`app/lib/mathTools.js:74`) | « the first five entries that aren't numbers are listed » |
| statistics-calculator | FAQ 6 | « Is my data uploaded? No — all calculations happen in your browser. » | TROMPEUR | Les entrées invalides figurent dans le message « Not a number: … » (`mathTools.js:74`), affiché par `useToolError` (`page.jsx:12,16`) et envoyé nettoyé à `/api/report-error` (`app/lib/useToolError.js:28-29`) ; le nettoyage laisse passer un mot court non cité (`app/lib/reportError.js:72-121`). Les nombres valides ne partent jamais | « Your numbers are never sent; if some entries are not numbers, the error text (up to five of them) is reported to us to fix bugs » — ou corriger le message (entrées entre guillemets) |
| statistics-calculator | étape 1 | « separated by commas, spaces or new lines » | FORMAT | Le point-virgule sépare aussi (`mathTools.js:72` : `/[\s,;]+/`), non dit nulle part | Ajouter « or semicolons » |
| statistics-calculator | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | Vrai, copiable | Supprimer |

---

#### Synthèse du lot « convert-qr-math »

12 outils lus, **85 défauts** (une ligne de tableau = un défaut) :

| Type | Nombre | Répartition |
|---|---|---|
| FAUX | 18 | currency 2, mobi-to-epub 1, unit 3, barcode 2, fraction 1, percentage 6, roman 2, statistics 1 |
| TROMPEUR | 23 | currency 1, mobi-to-epub 2, unit 2, barcode 5, qr-generator 5, qr-scanner 2, fraction 1, percentage 2, scientific 1, statistics 2 |
| INVÉRIFIABLE | 10 | color 2, currency 1, mobi-to-epub 2, qr-generator 4, qr-scanner 1 |
| GÉNÉRIQUE | 19 | color 3, currency 2, mobi-to-epub 3, unit 3, qr-scanner 2, fraction 1, percentage 1, roman 1, scientific 2, statistics 1 |
| MINCE | 5 | mobi-to-epub 1, roman 2, scientific 1, statistics 1 |
| LIBELLÉ | 4 | barcode 3, fraction 1 |
| FORMAT | 6 | color 2, mobi-to-epub 1, qr-scanner 2, statistics 1 |

Par outil : color 7, currency 6, mobi-to-epub 10, unit 8, barcode 10, qr-generator 9, qr-scanner 7, fraction 4,
percentage 9, roman 5, scientific 4, statistics 6.

Les plus graves : (1) Roman Numeral Converter, FAQ 2 + astuce 4 disent l'inverse du code (validation stricte) ;
(2) Percentage Calculator, FAQ 4 nie l'existence du 6e panneau et 3 textes parlent de « three panels » ; (3) Currency
Converter, FAQ 5 dit que les devises choisies ne partent nulle part alors qu'elles partent vers Frankfurter ; titre « 24 »
au lieu de 166.


---

### Lot ai

Source du texte : `docs/audit/p36/contenu-avant.json` (identique au code des pages, vérifié outil par outil) ; code lu le 05/10/2026,
branche `p36`. Aucune valeur de variable d'environnement lue : seuls les NOMS sont cités.

#### Références communes (citées dans les tableaux par leur sigle)

- **[G] garde partagée** (`lib/quota/guard.js:15-38`) : appelée par `/api/ai` (`app/api/ai/route.ts:23-24`), `/api/ai-vision`
  (`app/api/ai-vision/route.ts:26-27`), `/api/ai-transcribe` (`app/api/ai-transcribe/route.ts:37-38`), `/api/remove-bg`
  (`app/api/remove-bg/route.ts:44-45`), `/api/ai-image` (`app/api/ai-image/route.ts:42`). Deux couches :
  1. limite **par réseau** (IP hachée, `lib/quota/ipHash.js:25-44`), **par heure et par jour UTC**, valeurs dans
     `IP_RATE_LIMIT_PER_HOUR` / `IP_RATE_LIMIT_PER_DAY` (`lib/quota/config.js:13-14`, obligatoires, sans valeur par défaut) ;
     **un seul compteur commun à tous les outils payants** (`lib/quota/ipRateLimit.js:4-8`) : un visiteur qui a utilisé le
     Chatbot a moins de requêtes pour le Translator. Refus 429 « Too many requests from this network. Try again in about N
     minutes. » (`guard.js:20-24`) ;
  2. **plafond de dépense mensuel du site** `GLOBAL_SPEND_CAP_USD` (défaut 20 $ dans le code, `lib/quota/config.js:6`), réservé
     au pire cas avant l'appel (`lib/quota/globalSpend.js:22-29`) ; refus 503 « This tool has reached its usage limit for the
     month — that's a site-wide limit, not something on your end. It resets on <1er du mois suivant> (UTC). » (`guard.js:29-37`).
- **[P] 8 000 caractères** : `MAX_PROMPT_CHARS = 8000` (`lib/quota/limits.js:5`) ; au-delà le texte est **refusé** (pas tronqué)
  avec « Text is limited to 8,000 characters — this input is N. » (`lib/quota/limits.js:126-133`), côté page puis côté serveur
  (`app/api/ai/route.ts:20-21`).
- **[O] réponse bornée** : `model: "gpt-4o-mini"`, `max_tokens: 1000` (`app/api/ai/route.ts:34-35`) — une réponse plus longue est coupée.
- **[S] aucune inscription** : aucune des routes de ce lot ne lit d'en-tête `Authorization` ni de session
  (`app/api/ai/route.ts`, `ai-vision/route.ts`, `ai-transcribe/route.ts`, `ai-image/route.ts`, `ai-detect/route.ts`,
  `remove-bg/route.ts`, `image-upscale/route.ts`, `media/ticket/route.js` lus en entier) ; seul `app/api/quota/me/route.ts:13-17`
  exige un jeton, et aucun outil de ce lot ne l'appelle.

Règle appliquée : une affirmation juste n'est pas dans les tableaux. « TROMPEUR » sur la FAQ « free » des outils sous [G] =
la limite heure/jour est dite, mais pas le plafond mensuel du site ni le caractère commun du compteur.

---

#### 1. AI Chatbot — `/tools/ai-tools/ai-chatbot`

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| ai-chatbot | titre | « Use Openai's Gpt-4o Mini Model Online Free » | FAUX | graphie fausse des marques (« OpenAI », « GPT-4o mini ») ; modèle `gpt-4o-mini` (`app/api/ai/route.ts:34`) ; le titre ne dit pas la tâche | « AI Chatbot — Free Chat with OpenAI's GPT-4o mini, No Signup » |
| ai-chatbot | méta + about | « provide instant answers » | INVÉRIFIABLE | aucune mesure de délai de `/api/ai` dans `docs/audit/` | supprimer « instant » |
| ai-chatbot | about | « the reply is streamed back to your chat window » | FAUX | la route attend la réponse complète d'OpenAI puis renvoie un seul JSON `{ text }` (`app/api/ai/route.ts:51-53, 88-89`) ; la page lit ce JSON (`page.jsx:33-34`) ; aucun flux | « the full reply appears in the chat when it is ready » |
| ai-chatbot | FAQ 1 | « there is an hourly and daily limit per connection » | TROMPEUR | [G] : compteur commun à tous les outils IA + plafond mensuel du site non dits ; [P] message ≤ 8 000 caractères non dit ici | dire : limite par réseau heure/jour partagée avec les autres outils IA, plafond mensuel du site (message affiché), 8 000 caractères par message |
| ai-chatbot | astuce 1 | « Be specific and detailed in your questions… » | GÉNÉRIQUE | — | remplacer par un fait propre : historique envoyé dans la limite de 8 000 caractères (`app/lib/aiClient.js:16-26`) |
| ai-chatbot | astuce 2 | « Use natural language, as you would speak to a person… » | GÉNÉRIQUE | — | supprimer ou remplacer par un fait du code |
| ai-chatbot | astuce 3 | « Break complex questions into smaller parts… » | GÉNÉRIQUE | — | supprimer ou remplacer |

#### 2. AI Detector — `/tools/ai-tools/ai-detector`

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| ai-detector | about | « in English, French and many other languages » | INVÉRIFIABLE | mesures du site sur en, fr, de, es, it seulement (`docs/audit/RAPPORT-p17-30-09.md:75-76`) ; `lib/ai/pangram.js:6` dit seulement « supports French » | « measured on English, French, German, Spanish and Italian texts; other languages are less certain » (le caveat de la page le dit déjà, `page.jsx:72`) |
| ai-detector | FAQ 1 | « Yes: 2,000 words a day, free, with no signup… » | TROMPEUR | budget mensuel propre de 50 $ (`lib/quota/aiDetect.js:8-10, 18`) ; une fois atteint, refus 503 pour tous : « The AI detector has reached its monthly budget… » (`aiDetect.js:74-82`) ; non dit | ajouter le plafond mensuel propre et son message |
| ai-detector | FAQ 2 | « It splits the text into segments, labels each one AI-written, AI-assisted or human » | TROMPEUR | la page ne montre que le verdict et trois parts en % (`page.jsx:66-69`) ; seuls `prediction_short`, `fraction_ai`, `fraction_ai_assisted`, `fraction_human`, `headline` sont lus (`lib/ai/pangram.js:75-88`), les segments (`windows`) ne sont ni lus ni affichés | décrire ce que voit le visiteur : un verdict (3 libellés, `page.jsx:15-19`) et trois parts |
| ai-detector | FAQ 4 | « 1,000 words (12,000 characters) covers an essay page » | TROMPEUR | deux limites distinctes (`pangram.js:18, 30`) ; le compteur affiché est le nombre de mots **facturables** = le plus grand de trois comptes, dont 1 mot par 8 caractères (`pangram.js:31-53`) : il peut dépasser le compte d'un traitement de texte | « up to 1,000 words and 12,000 characters; the counter can count more words than a word processor (hyphenated words, long words) » |
| ai-detector | FAQ 4 | « In Chinese, Japanese and Thai, each character counts as a word » | TROMPEUR | liste incomplète : aussi lao, khmer, birman, tibétain, javanais, balinais (`pangram.js:38-40`) | donner la liste complète |

#### 3. AI Paraphraser — `/tools/ai-tools/ai-paraphraser`

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| ai-paraphraser | titre | « Use Openai's Gpt-4o Mini Model Online Free » | FAUX | graphie fausse ; ne dit pas la tâche ; modèle `app/api/ai/route.ts:34` | « AI Paraphraser — Reword Text Free with GPT-4o mini » |
| ai-paraphraser | FAQ 1 | « there is an hourly and daily limit per connection » | TROMPEUR | [G] compteur commun + plafond mensuel non dits ; [P] non dit | voir ai-chatbot FAQ 1 |
| ai-paraphraser | FAQ 2 | « Very long text may be truncated by the underlying AI model's response limit » | TROMPEUR | au-delà de 8 000 caractères le texte est **refusé** avant envoi [P] (`page.jsx:22-23`) ; seule la réponse est coupée à 1 000 jetons [O] | « up to 8,000 characters per request; the rewritten text is limited to about 1,000 tokens » |
| ai-paraphraser | FAQ 4 | « Do I need to create an account… No account is necessary » | GÉNÉRIQUE | [S] | fusionner dans la FAQ 1 |
| ai-paraphraser | astuce 3 | « Always review the paraphrased content… » | GÉNÉRIQUE | — | supprimer |
| ai-paraphraser | astuce 4 | « Combine AI Paraphraser with your own manual editing… » | GÉNÉRIQUE | — | supprimer |
| ai-paraphraser | page entière | (about, étapes, FAQ) | MINCE | ne disent pas : 8 000 caractères [P], réponse ≤ 1 000 jetons [O], bouton « Download » (paraphrased.txt, `page.jsx:54`), texte envoyé à OpenAI via notre serveur (dit nulle part sur cette page) | ajouter specs + privacy |

#### 4. AI Translator — `/tools/ai-tools/ai-translator`

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| ai-translator | titre | « Translate AI Online Free » | FAUX | l'outil traduit un texte, pas « AI » (`lib/ai/toolPrompts.js:28`) | « AI Translator — Translate Text into 10 Languages Free » |
| ai-translator | interface (sous-titre) | « Translate text to any language with AI » | FAUX | 10 langues cibles seulement (`page.jsx:10`), toute autre refusée par le serveur « Unsupported targetLang. » (`lib/ai/toolPrompts.js:10-13, 113-114`) | « Translate text into 10 languages with AI » |
| ai-translator | about + FAQ 2 | « It automatically detects the language of your input text » / « The source language is detected automatically » | INVÉRIFIABLE | aucune détection dans le code ; la consigne envoyée est seulement « Translate the provided text to <langue> » (`toolPrompts.js:28`) ; aucune langue source affichée | « you don't choose the source language: the model reads it from your text » |
| ai-translator | FAQ 1 | « there is an hourly and daily limit per connection » | TROMPEUR | [G] + [P] non dits | voir ai-chatbot FAQ 1 |
| ai-translator | FAQ 4 | « generally handles technical and industry-specific vocabulary well » | INVÉRIFIABLE | aucune mesure de traduction dans `docs/audit/` | supprimer l'évaluation, garder « have critical documents reviewed » |
| ai-translator | astuce 2 | « Always proofread translated content… » | GÉNÉRIQUE | — | supprimer |
| ai-translator | astuce 4 | « When translating between languages with very different grammar, review… » | GÉNÉRIQUE | — | supprimer |
| ai-translator | page entière | (about, étapes, FAQ) | MINCE | ne disent pas : 8 000 caractères [P], traduction coupée au-delà de 1 000 jetons [O] (un texte long peut revenir incomplet), bouton « Download » (translation.txt, `page.jsx:64`) | ajouter specs |

#### 5. AI Writer — `/tools/ai-tools/ai-writer`

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| ai-writer | titre | « Use Openai's Gpt-4o Mini Model Online Free » | FAUX | graphie fausse ; ne dit pas la tâche | « AI Writer — Free AI Text Generator (GPT-4o mini) » |
| ai-writer | FAQ 1 | « there is an hourly and daily limit per connection » | TROMPEUR | [G] + [P] non dits | voir ai-chatbot FAQ 1 |
| ai-writer | FAQ 2 | « content generated by AI Writer can be used for commercial purposes » | INVÉRIFIABLE | aucune source dans le dépôt sur les conditions d'utilisation d'OpenAI | renvoyer aux conditions d'OpenAI sans affirmer, ou supprimer |
| ai-writer | FAQ 3 | « Most content is generated within a few seconds » | INVÉRIFIABLE | aucune mesure de délai de `/api/ai` | supprimer, ou dire « the text appears when the model has finished (no live typing) » |
| ai-writer | FAQ 4 | « you should review and verify it before publishing » | GÉNÉRIQUE | — | supprimer |
| ai-writer | astuce 3 | « Always proofread and personalize AI-generated content… » | GÉNÉRIQUE | — | supprimer |
| ai-writer | page entière | (about, étapes, FAQ) | MINCE | ne disent pas : 8 000 caractères de description [P], texte produit ≤ 1 000 jetons [O] (≈ 750 mots — aucun « long article »), bouton « Download » (text.txt, `page.jsx:54`), envoi à OpenAI | ajouter specs + privacy |

#### 6. Audio Transcriber — `/tools/ai-tools/audio-transcriber`

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| audio-transcriber | about | « returns an editable text transcript » | FAUX | le champ « Transcript » est en lecture seule (`page.jsx:55`, `readOnly`) | « returns the transcript as text you can copy or download (TXT, SRT, VTT) » |
| audio-transcriber | FAQ 3 (texte servi) | « Uploads are limited to 4 MB — the maximum the transcription engine (OpenAI Whisper) itself accepts » | FAUX | Whisper accepte 25 MiB (`lib/quota/limits.js:7-10, 83-84`) ; 4 MiB est le plafond de la plateforme Vercel, appliqué quand `NEXT_PUBLIC_MEDIA_SERVICE_URL` est absent (`app/lib/officeUpload.js:85`, `limits.js:43-53`) ; avec le service, 25 MB | dire la vraie raison de chaque chiffre ; vérifier la valeur servie en production (voir faits, NON TROUVÉ) |
| audio-transcriber | FAQ 2 | « and most other formats your browser can select as an audio file » | FORMAT | `accept="audio/*"` (`page.jsx:49`) ; le fichier est envoyé tel quel à Whisper, sans conversion (`app/api/ai-transcribe/route.ts:41-43`) ; un format que Whisper refuse revient en erreur OpenAI (`route.ts:88`) ; `docs/audit/RAPPORT-safari-defauts.md:40` « formats limités côté serveur Whisper » | ne lister que les formats acceptés par Whisper (liste à confirmer, absente du dépôt) et dire que les autres sont refusés |
| audio-transcriber | FAQ 5 | « Your audio file is sent directly to the transcription API… It is not stored on our servers » | FAUX | pas « directly » : il passe par notre route Vercel (`app/lib/officeUpload.js:103-107`), et au-delà de 4 MiB par notre service media-processing (Railway) en morceaux (`officeUpload.js:99-101`), gardé jusqu'à la fin de la transcription puis supprimé (`lib/media/stagedRoute.ts:99-111`) | « sent through our server (and, above 4 MB, our upload service, which deletes it once the transcript is made) to OpenAI Whisper » |
| audio-transcriber | FAQ 1 | « there is an hourly and daily limit per connection » | TROMPEUR | [G] compteur commun + plafond mensuel non dits | voir ai-chatbot FAQ 1 |
| audio-transcriber | astuce 2 | « works well for interviews, meetings, lectures, and podcasts » | INVÉRIFIABLE | aucune mesure de transcription dans `docs/audit/` | supprimer |
| audio-transcriber | astuce 1 | « use audio that is clear with minimal background noise » | GÉNÉRIQUE | — | supprimer |
| audio-transcriber | astuce 3 | « Review and manually correct the transcript afterward… » | GÉNÉRIQUE | — | supprimer |

#### 7. Background Remover — `/tools/ai-tools/background-remover`

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| background-remover | méta + about | « instantly removes… giving you a transparent PNG in one click » | INVÉRIFIABLE | mesuré ≈ 4,3-5 s veille comprise (`docs/audit/RAPPORT-detourage-phase2.md:267`) : pas « instantly » ; il faut choisir l'image, cliquer « Remove Background », puis « Download » (`page.jsx:233-249`) | « removes the background in a few seconds and gives a transparent PNG » |
| background-remover | interface (sous-titre) | « Remove any background instantly with AI » | INVÉRIFIABLE | « instantly » non mesuré ; « any » : le service ne garde que le plus grand sujet d'un seul tenant (`services/background-removal/app/infer.py:10-13, 137-153`) | « Remove the background of a photo with AI » |
| background-remover | about | « Perfect for product photos, portraits, and professional graphics » | GÉNÉRIQUE | — | remplacer par un fait (résolution d'origine gardée, 50 MB) |
| background-remover | FAQ 1 | « free to use with no account creation or watermarks » | TROMPEUR | la route passe par [G] (`app/api/remove-bg/route.ts:44-45`) : limite par réseau heure/jour (commune aux outils IA) et plafond mensuel du site, **rien n'est dit** | ajouter les deux limites et leurs messages |
| background-remover | FAQ 2 | « accepts common image formats like JPG and PNG » | FORMAT | l'interface dit JPG, PNG, WEBP (`page.jsx:229`) ; `accept="image/*"` (`page.jsx:232`) et décodage par le navigateur (`page.jsx:23-29`, `app/lib/bigImage.js:337-343`) : tout format que le navigateur ouvre | « JPG, PNG, WebP and any other image your browser can open (e.g. HEIC on Safari); output PNG » |
| background-remover | interface | « JPG, PNG, WEBP supported » | FORMAT | idem : `accept="image/*"` (`page.jsx:232`) | même formulation que la FAQ corrigée |
| background-remover | FAQ 4 | « Do I need to install any software or create an account? No… » | GÉNÉRIQUE | [S] | supprimer (doublon de la FAQ 1) |
| background-remover | astuce 3 | « try a higher-resolution source image » | FAUX | le serveur ne voit qu'une copie ≤ 1 024 px (`page.jsx:21, 36-47` ; `infer.py:53` `MODEL_INPUT_SIZE (1024, 1024)`) et l'affinage des bords travaille sur ≤ 1 Mpx (`app/lib/mattingRefine.js:23`, `page.jsx:68`) : une source plus grande n'améliore pas la détection | supprimer ; dire plutôt que le résultat garde la résolution d'origine |
| background-remover | astuce 1 | « use images with clear contrast between the subject and background » | GÉNÉRIQUE | — | supprimer ou garder une seule astuce de ce type |
| background-remover | astuce 2 | « Simple, uniform backgrounds are removed more cleanly… » | GÉNÉRIQUE | — | supprimer |

#### 8. Data Extractor — `/tools/ai-tools/data-extractor`

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| data-extractor | FAQ 1 | « there is an hourly and daily limit per connection » | TROMPEUR | [G] + [P] non dits | voir ai-chatbot FAQ 1 |
| data-extractor | FAQ 3 | « …which you can copy. There is no direct file download to CSV or Excel » | TROMPEUR | un bouton « Download » donne `extracted-data.txt` (`page.jsx:54`) — non dit | « copy it, or download it as a .txt file; no CSV/Excel file » |
| data-extractor | astuce 1 | « Use clear, well-formatted source text… » | GÉNÉRIQUE | — | supprimer |
| data-extractor | astuce 3 | « Test with a small sample first… » | GÉNÉRIQUE | — | supprimer |
| data-extractor | page entière | (about, étapes) | MINCE | ne disent pas : 8 000 caractères [P], réponse ≤ 1 000 jetons [O] (un grand tableau peut revenir coupé) | ajouter specs |

#### 9. Email Generator — `/tools/ai-tools/email-generator`

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| email-generator | FAQ 1 | « there is an hourly and daily limit per connection » | TROMPEUR | [G] + [P] non dits | voir ai-chatbot FAQ 1 |
| email-generator | FAQ 2 | « suitable for both personal and professional business communications » | GÉNÉRIQUE | — | remplacer par les 5 tons réels (`page.jsx:10`, `toolPrompts.js:14`) |
| email-generator | FAQ 4 | « No account is necessary; you can start generating emails immediately » | GÉNÉRIQUE | [S] | fusionner dans la FAQ 1 |
| email-generator | astuce 3 | « Review and edit the generated content before sending… » | GÉNÉRIQUE | — | supprimer |
| email-generator | page entière | (about, étapes, FAQ) | MINCE | ne disent pas : 8 000 caractères [P], bouton « Download » (email.txt, `page.jsx:64`), envoi à OpenAI | ajouter specs + privacy |

#### 10. Grammar Fixer — `/tools/ai-tools/grammar-fixer`

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| grammar-fixer | titre | « Use Openai's Gpt-4o Mini Model Online Free » | FAUX | graphie fausse ; ne dit pas la tâche | « Grammar Fixer — Free Grammar & Spelling Checker, See Every Change » |
| grammar-fixer | FAQ 1 | « there is an hourly and daily limit per connection » | TROMPEUR | [G] + [P] non dits | voir ai-chatbot FAQ 1 |
| grammar-fixer | FAQ 2 | « as part of rewriting your text » | FAUX | la consigne interdit de réécrire : « Make MINIMAL, PRECISE edits. DO NOT rewrite, paraphrase or reorder anything. » (`lib/ai/toolPrompts.js:47-48, 54`) | « it corrects only the errors and leaves correct sentences as written » |
| grammar-fixer | FAQ 5 | « Portuguese, German, Italian, Spanish and Arabic… it corrects most errors while changing few correct sentences » | TROMPEUR | consigne actuelle (température 0, `toolPrompts.js:66`), corrections exactes sur 40 phrases : pt 29, de 16-17, it 9, es 11, ar 6 (`docs/audit/RAPPORT-deploiement-28-09.md:64-77`) : « most » faux pour de, it, es, ar | donner les chiffres mesurés ou dire « fewer than half of the sentences in German, Italian, Spanish and Arabic were corrected exactly » |
| grammar-fixer | astuce 3 | « Use Grammar Fixer before submitting important documents… » | GÉNÉRIQUE | — | supprimer |
| grammar-fixer | astuce 4 | « Combine Grammar Fixer with your own proofreading… » | GÉNÉRIQUE | — | supprimer |

#### 11. Image Captioner — `/tools/ai-tools/image-captioner`

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| image-captioner | titre | « Use Openai's Gpt-4o Mini Vision Model » | FAUX | graphie fausse ; ne dit pas la tâche | « Image Captioner — Free AI Image Caption Generator » |
| image-captioner | méta + about | « a descriptive caption for any image you upload » | TROMPEUR | seulement les images que le navigateur décode (`app/lib/imageForVision.js:12-41`), ≤ 80 MB (`lib/quota/limits.js:103`) ; zones transparentes peintes en blanc (`imageForVision.js:52-54`) | « for a JPG, PNG, WebP… image up to 80 MB » |
| image-captioner | about | « anyone who needs quick alt text » | TROMPEUR | la consigne demande « a creative, descriptive caption » (`lib/ai/toolPrompts.js:87`), pas un texte alternatif | « a descriptive caption (review it before using it as alt text) » |
| image-captioner | FAQ 1 | « there is an hourly and daily limit per connection » | TROMPEUR | [G] (`app/api/ai-vision/route.ts:26-27`) : compteur commun + plafond mensuel non dits | voir ai-chatbot FAQ 1 |
| image-captioner | FAQ 2 | « common image formats including JPG, PNG, GIF, and WebP » | FORMAT | `accept="image/*"` (`page.jsx:69`) ; tout format décodable par le navigateur (`imageForVision.js:12-28`) ; GIF animé : une seule image est décrite (dessin unique sur canvas, `imageForVision.js:56`) | lister « JPG, PNG, WebP, GIF (first frame), and any image your browser opens » |
| image-captioner | FAQ 4 | « Your image is sent to OpenAI's API… » | TROMPEUR | c'est une **copie réduite** (JPEG ≤ 2 048 px, qualité 0,85) faite dans le navigateur qui part, l'original ne quitte pas l'appareil (`imageForVision.js:9-10, 45-63` ; `page.jsx:45-46`), via notre route (`app/api/ai-vision/route.ts:30-44`) | le dire (c'est un argument de confidentialité) |
| image-captioner | FAQ 3 | « you should review and edit the caption before relying on it… » | GÉNÉRIQUE | — | supprimer |
| image-captioner | astuce 1 | « Use specific, keyword-rich edits… for better SEO » | GÉNÉRIQUE | — | supprimer |
| image-captioner | astuce 2 | « Add relevant hashtags or brand details manually… » | GÉNÉRIQUE | — | supprimer |

#### 12. AI Image Generator — `/tools/ai-tools/image-generator`

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| image-generator | about | « among the highest-rated image models in independent blind comparisons » | TROMPEUR | le classement cité concerne gpt-image-2 **high** ; le site utilise `quality: "low"` (`app/api/ai-image/route.ts:11, 57`), non mesuré (`docs/audit/RAPPORT-ecarts-marche.md:155, 182`) | supprimer, ou « the model family ranks first in blind votes at its high setting; this tool uses its low (fastest) setting » |
| image-generator | about | « like the daily limits of the best-known free generators » | TROMPEUR | références du code : Bing 15/jour (avec compte), Ideogram ≈ 10/jour (`lib/quota/imageGen.js:3-4`) ; 5 est en dessous | supprimer la comparaison |
| image-generator | FAQ 1 | « Yes: 5 images per day per visitor, no signup and no watermark » | TROMPEUR | aussi : [G] limite par réseau heure/jour commune aux outils IA (`route.ts:42`), budget mensuel propre 5 $ (`imageGen.js:14, 36-38`) et plafond mensuel du site [G] — non dits | ajouter les trois et leurs messages |
| image-generator | FAQ 2 | « at its fast quality setting » | TROMPEUR | réglage `"low"`, le plus bas (`route.ts:11`) | « at its low quality setting (the fastest and cheapest) » |
| image-generator | FAQ 3 | « OpenAI's terms assign you the rights to images you create » | INVÉRIFIABLE | aucune source dans le dépôt | citer la page d'OpenAI vérifiée, ou supprimer |
| image-generator | interface + étape 3 | « get it in seconds » / « about 10–30 seconds » / « wait 10 to 30 seconds » | INVÉRIFIABLE | deux images mesurées, 16 s chacune (`RAPPORT-ecarts-marche.md:41, 160`) ; pas de mesure de l'écart 10-30 s | « usually under half a minute (16 s measured) » ou mesurer |
| image-generator | astuce 3 | « Text inside images works best when short and put in quotes » | INVÉRIFIABLE | aucune mesure | supprimer |

#### 13. AI Image Upscaler — `/tools/ai-tools/image-upscaler`

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| image-upscaler | FAQ 1 | « Yes, it's free with no signup and no watermark » | TROMPEUR | sur notre serveur : billets du service limités par réseau, heure et jour (`app/api/media/ticket/route.js:28, 36-42`, variables `MEDIA_JOBS_PER_HOUR_PER_IP` / `MEDIA_JOBS_PER_DAY_PER_IP`, `lib/media/ticket.js:49-50` ; une image > 2 Mpx envoyée en bandes consomme un billet par bande, `app/lib/localUpscale.js:193-194, 200-239`) et budget mensuel propre de 5 $ (`lib/quota/upscaleBudget.js:14, 46-49`) ; non dits | dire : illimité sur l'appareil (WebGPU) ; sur notre serveur, limite par connexion heure/jour et plafond mensuel |
| image-upscaler | about | « than the leading online upscaler's (LPIPS… 0.107 against 0.164) » | INVÉRIFIABLE | la mesure existe contre **iLoveIMG** (`docs/audit/RAPPORT-ecarts-marche.md:126-139`) ; « leading » n'est pas prouvé | nommer iLoveIMG, retirer « leading » |
| image-upscaler | FAQ 5 | « (current Chrome, Edge and Safari, and Firefox on Windows) » | INVÉRIFIABLE | liste tirée d'une recherche (`docs/audit/RAPPORT-global-28-09.md:119`) ; seul Chromium avec WebGPU testé (`ibid.:127`) ; le code teste seulement `navigator.gpu` (`localUpscale.js:17-23`) | « when your browser offers WebGPU (the page detects it) » |
| image-upscaler | astuce 4 | « downloads the AI model (about 25 MB) » | INVÉRIFIABLE | le fichier du modèle fait 17 288 863 octets (`public/models/4xNomos2_hq_mosr-web.onnx`) ; le moteur ONNX Runtime 1.30.0 vient de cdn.jsdelivr.net (`localUpscale.js:13, 35`), taille non mesurée dans le dépôt | « about 17 MB of model plus the AI engine » ou mesurer le total |
| image-upscaler | FAQ 3 | « Up to 6 megapixels (for example 3000×2000) » | TROMPEUR | limite de fichier de 30 MB non dite (`page.jsx:16, 44` ; `services/background-removal/app/upscale.py:41`) | ajouter « and 30 MB » |

#### 14. Keyword Extractor — `/tools/ai-tools/keyword-extractor`

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| keyword-extractor | FAQ 1 | « there is an hourly and daily limit per connection » | TROMPEUR | [G] + [P] non dits | voir ai-chatbot FAQ 1 |
| keyword-extractor | astuce 2 | « long-tail phrases… often have less competition » | INVÉRIFIABLE | l'outil ne donne aucune donnée de volume ni de concurrence (consigne `toolPrompts.js:69`) | supprimer |
| keyword-extractor | astuce 1 | « Use the extracted keywords to inform your meta descriptions… » | GÉNÉRIQUE | — | supprimer |
| keyword-extractor | page entière | (about, étapes, FAQ) | MINCE | ne disent pas : 8 000 caractères [P] (≈ 1 300 mots : un long article est refusé), bouton « Download » (keywords.txt, `page.jsx:54`) ; jumeau sans IA `text-tools/word-counter` (densité, `KeywordDensity`) non cité | ajouter specs, différence avec Word Counter |

#### 15. Sentiment Analyzer — `/tools/ai-tools/sentiment-analyzer`

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| sentiment-analyzer | FAQ 1 | « there is an hourly and daily limit per connection » | TROMPEUR | [G] + [P] non dits | voir ai-chatbot FAQ 1 |
| sentiment-analyzer | FAQ 2 | « It works best with English » | INVÉRIFIABLE | aucune mesure par langue | « it reads any language the model knows; no accuracy figure is published » |
| sentiment-analyzer | astuce 1 | « provide complete sentences rather than single words… » | GÉNÉRIQUE | — | supprimer |
| sentiment-analyzer | page entière | (about, étapes, FAQ) | MINCE | ne disent pas : 8 000 caractères [P], format réel du résultat (texte libre du modèle : classe + pourcentage + explication, `toolPrompts.js:72`), bouton « Download » (sentiment.txt, `page.jsx:54`) | ajouter specs |

#### 16. Text Summarizer — `/tools/ai-tools/text-summarizer`

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| text-summarizer | about | « get back a shorter version in seconds » | INVÉRIFIABLE | aucune mesure de délai | supprimer « in seconds » |
| text-summarizer | FAQ 1 | « there is an hourly and daily limit per connection » | TROMPEUR | [G] + [P] non dits | voir ai-chatbot FAQ 1 |
| text-summarizer | FAQ 2 | « There's no fixed word limit, but very long input may be truncated » | FAUX | limite fixe de 8 000 caractères, texte **refusé** au-delà avec un message [P] (`page.jsx:22-23`, `app/api/ai/route.ts:20-21`) | « up to 8,000 characters (about 1,300 words) per summary; split longer texts » |
| text-summarizer | FAQ 3 | « It works best with English content » | INVÉRIFIABLE | aucune mesure par langue | supprimer l'évaluation |
| text-summarizer | astuce 4 | « Use Text Summarizer alongside your reading… » | GÉNÉRIQUE | — | supprimer |
| text-summarizer | page entière | (about, étapes) | MINCE | ne disent pas : 8 000 caractères, bouton « Download » (summary.txt, `page.jsx:54`), jumeau `pdf-tools/pdf-ai-summary` (même route, `pdf-ai-summary/page.jsx:60`) | ajouter specs + lien vers PDF AI Summary |

---

#### Synthèse du lot « ai » (16 outils lus, 103 défauts)

| Type | Nombre |
|---|---|
| FAUX | 14 |
| INVÉRIFIABLE | 19 |
| TROMPEUR | 29 |
| GÉNÉRIQUE | 29 |
| MINCE | 8 |
| LIBELLÉ | 0 |
| FORMAT | 4 |

Aucun bouton cité par une page n'est faux : « Send », « Detect AI Content », « Paraphrase », « Translate », « Generate Content »,
« Extract Data », « Generate Email », « Fix Grammar », « Keep all / Undo all », « Generate Caption », « Generate Image »,
« Upscale Image », « Remove Background », « Download », « Copy » existent tous avec ce nom.

