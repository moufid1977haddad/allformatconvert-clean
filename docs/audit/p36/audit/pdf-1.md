# P36 lot 2 — audit « pdf-1 » (19 outils)

Sources : texte servi = `docs/audit/p36/contenu-avant.json` ; code lu ligne par ligne (pages, `layout.tsx`, composants, routes, services).
Une affirmation juste n'est pas dans les tableaux. Les numéros de ligne renvoient au fichier tel qu'il est sur la branche `p36` (05/10).

## Références communes (citées « RÉF-x » dans les tableaux)

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

## Point à vérifier AVANT toute rédaction de chiffre (non compté comme défaut)

L'instantané `contenu-avant.json` affiche **« Max 4 MB »** sur toutes les pages Office/HTML/PDF→Office/PDF/A (ex. word-to-pdf `ui`,
excel-to-pdf `ui`, pdf-to-excel `ui`, pdf-to-pdfa `ui`). Or le code n'affiche 4 Mo que si `NEXT_PUBLIC_MEDIA_SERVICE_URL` est absent au
build (`officeUpload.js:16-17,111-112`) ; sinon 100 Mo (Word/PowerPoint/HTML/EPUB/MOBI/Markdown), 60 Mo (Excel), 99 Mo (PDF→Word/Excel/
PowerPoint), 44 Mo (PDF/A) (`limits.js:64,68,74,80,93`). La production avait cette variable le 21/09
(`docs/audit/RAPPORT-office-envoi-morceaux.md:110`). Donc : soit l'instantané a été pris sur une origine sans la variable, soit la
production l'a perdue. **À vérifier sur www** : si www affiche 4 Mo, les méta-descriptions « files up to 99 MB » (pdf-to-excel,
pdf-to-ppt) sont FAUSSES aujourd'hui ; sinon elles sont justes. Les rédacteurs doivent écrire la valeur constatée sur www.

## Tableaux

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

## Synthèse du lot pdf-1 (19 outils lus)

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
