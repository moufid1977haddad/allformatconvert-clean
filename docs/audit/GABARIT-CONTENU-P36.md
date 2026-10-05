# GABARIT DE CONTENU — pages d'outil (P36, lot 1 « le marché d'abord »)

Lecture du 05/10/2026. 73 pages exploitables (HTML brut, `curl`, une lecture par page, User-Agent Chrome, `Accept-Language: en-US`),
24 outils, concurrents : iLovePDF/iLoveIMG, Smallpdf, CloudConvert, FreeConvert, 123apps, PDF24 — complétés, pour les outils
qu'aucun d'eux n'a, par le leader visible (ezgif, remove.bg, wordcounter.net, convertcase.net, jsonformatter.org,
base64decode.org, qr-code-generator.com, QRCode Monkey, calculator.net, Omni, unitconverters.net, ezyZip).
Extraction brute complète (titres, méta, H1-H3 dans l'ordre, phrases de limites/suppression, questions) :
[`marche-p36/lecture-brute-05-10.md`](marche-p36/lecture-brute-05-10.md). Lecture précédente : AUDIT-SEO-ADSENSE-05-10.md §1d.

**Méthode et réserves**
- Longueurs = caractères du texte décodé (entités HTML résolues), espaces compris.
- Mots = texte visible du `<body>` sans script/style/svg ; le chiffre entre parenthèses retire header/nav/footer. Les
  modales cachées comptent (123apps : la fenêtre Premium/compte gonfle le chiffre d'environ 150 mots). Ordre de grandeur
  seulement (± 15 %).
- Pages rendues côté client : remove.bg (titre/méta lus, corps quasi vide en HTML brut), cloudconvert.com/audio-converter
  (réponse vide — remplacée par /mp3-converter). Ce que Google voit après rendu JavaScript peut être plus riche : **non vérifié**.
- 404 constatés (l'outil n'existe pas à cette adresse, pas forcément absent du site) : FreeConvert image-resizer,
  resize-image, remove-background, word-counter, case-converter, json-formatter, qr-code-generator, unzip, zip-extractor ;
  PDF24 compress-image, resize-image ; Smallpdf compress-image ; iLoveIMG heic-to-jpg (HEIC est couvert par convert-to-jpg) ;
  123apps video-to-mp3 (remplacé par audio-extractor.net, domaine 123apps).
- **« People also ask » n'a PAS pu être lu directement** : l'outil WebSearch disponible n'est pas Google et ne renvoie pas le
  bloc PAA (essai : « pdf to word converter people also ask questions » → liens seulement). Les questions de la partie 3
  viennent donc (a) des FAQ visibles des concurrents (H3 se terminant par « ? » ou blocs FAQPage), (b) des titres de
  résultats de 6 recherches thématiques (HEIC, détourage, MP4→MP3, Base64, compression image, compteur de mots). Elles
  sont marquées **[FAQ concurrent]** ou **[résultats de recherche]**. À recouper avec un vrai relevé PAA Google par le
  propriétaire si possible.

---

## 1. Constat par outil et par concurrent

Légende : T = titre, D = méta-description, (n) = longueur ; Mots = total (hors header/nav/footer) ; LD = JSON-LD.

### 1a. PDF

| Outil | Concurrent / URL | Titre (car.) | Méta-description (car.) | Mots | Structure (ordre des sections) | Limites / traitement / suppression (texte visible) |
|---|---|---|---|---|---|---|
| PDF to Word | iLovePDF ilovepdf.com/pdf_to_word | « PDF to WORD \| Convert PDF to Word online for free » (49) | « Convert PDF to editable Word documents for free. PDF to Word conversion is fast, secure and almost 100% accurate. Convert scanned PDF to DOC keeping the layout. » (160) | 391 (164) | H1 + H2 accroche, outil, encart OCR (langues listées). Pas de FAQ, pas d'étapes | Rien de visible. Limites seulement dans la config JS (`pdfword` 100 Mo / 1 fichier pour un des paliers ; correspondance palier non vérifiée) |
| | Smallpdf smallpdf.com/pdf-to-word | « PDF to Word Converter: Convert PDF to DOCX for Free » (51) | « Convert PDFs to fully editable Word documents online for free. Keep fonts, formatting, and layouts intact. No sign-ups or installation required. » (144) | 1 081 (749) | H1 « Free PDF to Word Converter » ; 5 H3 bénéfices (dont « Safe & Secure Converter ») ; H2 How to (HowTo) ; H2 FAQ 7 questions ; articles de blog ; LD HowTo+FAQPage+Product+AggregateRating 4,5 (1 060 042) | « TLS encryption… documents are automatically deleted an hour after processing » ; GDPR, ISO/IEC 27001. Pas de taille max visible |
| | CloudConvert cloudconvert.com/pdf-to-docx | « PDF to Word \| CloudConvert » (26) | « High Quality PDF to Word (DOCX) Converter - No watermarks, no sign up required. » (79) | 204 (174) | H1 « PDF to Word Converter », outil, 1 paragraphe par format (PDF, DOCX), footer | Rien de visible |
| | FreeConvert freeconvert.com/pdf-to-word | « PDF to WORD Converter - FreeConvert.com » (39) | « PDF to WORD converter. Best way to convert PDF to WORD online at the highest quality. This tool is free, secure, and works on any web browser. » (142) | 1 400 (1 369) | H1 ; How to ; 3 blocs bénéfices (Easy / Best Quality / Free & Secure) ; « What is a PDF / How to open » ; « What is DOCX / How to open » ; autres conversions ; Related ; « Your Data, Our Priority » | « Max file size 1GB. » ; « 256-bit SSL encryption and automatically deleted after 8 hours » |
| | PDF24 tools.pdf24.org/en/pdf-to-word | « PDF to Word converter - 100% free & online - PDF24 » (50) | « Free online converter to convert PDF files to Word. ✓ No limits and no watermarks. ✓ No installation or registration required. » (126) | 768 (629) | H1 ; H2 sous-titre descriptif long ; « Information » : 6 H3 (how / converter / security / easy / system / no install) ; Q&A (1) ; note ; alternative bureau ; related | « The conversion of PDF to Word is done on our servers. » ; « removed from our system after a short time » (délai non chiffré) ; LD AggregateRating 4,89 (12 883) |
| Merge PDF | iLovePDF /merge_pdf | « Merge PDF files online. Free service to merge PDF » (49) | « Select multiple PDF files and merge them in seconds. Merge & combine PDF files online, easily and free. » (103) | 328 (101) | H1 + H2 accroche, outil | Config JS : merge 100 Mo / 25 fichiers (palier non vérifié) |
| | Smallpdf /merge-pdf | « Merge PDF: Combine PDF Files with Free PDF Combiner » (51) | « Merge PDFs online for free. Combine files quickly and securely on Mac, Windows, iOS, Android, and other platforms. » (114) | 1 096 (774) | H1 ; 6 H3 bénéfices ; How to ; FAQ 7 ; blog ; LD HowTo+FAQPage | « encrypted using TLS and automatically deleted from our servers after one hour » |
| | FreeConvert /merge-pdf | « Merge PDF Files Online - Combine PDFs for Free \| FreeConvert » (60) | « Quickly merge PDFs into one document with FreeConvert's easy-to-use online tool. No software needed—combine files for free now! » (127) | 1 233 (1 202) | H1 ; 4 étapes numérotées en H3 ; autres outils ; FAQ 6 ; data | 1 GB ; « deleted from our servers within 8 hours » |
| | PDF24 /merge-pdf | « Merge PDF - 100% free & online - PDF24 » (38) | « Quickly and easily combine multiple files into one PDF for free. ✓ No limits and no watermarks. ✓ No installation or registration required. » (139) | 911 (772) | même gabarit PDF24 ; Q&A 3 | « merged in the cloud on our servers » ; « deleted… after a short period of time » ; 4,95 (24 108) |
| Compress PDF | iLovePDF /compress_pdf | « Compress PDF online. Same PDF quality less file size » (52) | « Compress PDF file to get the same PDF quality but less filesize. Compress or optimize PDF files online, easily and free. » (120) | 308 (81) | H1 + H2, outil | Config JS : compress 200 Mo / 2 fichiers (palier non vérifié) |
| | Smallpdf /compress-pdf | « Compress PDF: Reduce PDF File Size with Free Compressor » (55) | « Compress your PDF to the smallest possible size without sacrificing quality. No installation or account creation required. » (122) | 1 288 (966) | H1 ; 3 H3 bénéfices ; How to ; 6 H3 « Everything you need » (dont GDPR, ISO, chiffrement) ; FAQ 10 ; 3 tutoriels « to 100 KB / to 1 MB / chosen size » | « Reduce PDF size by up to 99% » (non vérifiable) ; suppression après 1 heure |
| | CloudConvert /compress-pdf | « Compress PDF \| CloudConvert » (27) | « Compress and optimize PDF files online while retaining good quality. Free, fast and no sign up required. » (104) | 136 (106) | H1 « Compress and Optimize PDF », outil | Rien |
| | FreeConvert /compress-pdf | « Compress PDF - Reduce PDF File Size Online for Free » (51) | « Compress PDF file size while preserving quality. No software to install, secure & free. » (87) | 881 (850) | gabarit FreeConvert | 1 GB ; 8 heures |
| | PDF24 /compress-pdf | « Compress PDF - 100% free & online - PDF24 » (41) | « Make PDF files smaller for free. Reduce PDF size while maintaining maximum quality. ✓ No limits and no watermarks. ✓ No installation or registration required. » (158) | 1 166 (1 027) | gabarit PDF24 ; **Q&A 7** (la plus riche de PDF24) | « compressed in the cloud on our servers » ; 4,92 (14 995) |
| JPG to PDF | iLovePDF /jpg_to_pdf | « Convert JPG to PDF. Images JPG to PDF online » (44) | « Convert JPG images to PDF, rotate them or set a page margin. Convert JPG to PDF online, easily and free. » (104) | 324 (97) | H1 + H2 | Config JS imagepdf (paliers 40 Mo/20 fichiers … non vérifié) |
| | Smallpdf /jpg-to-pdf | « JPG to PDF Converter: Convert Image & Photo to PDF for Free » (59) | « Convert JPG to PDF for free with a converter trusted by over 1 billion users. No installation or account creation required. » (123) | 903 (565) | H1 ; 6 H3 ; How to ; FAQ 6 | 1 heure ; contradiction interne : « runs entirely in your browser » ET « deleted from our servers one hour after » |
| | CloudConvert /jpg-to-pdf | « JPG to PDF \| CloudConvert » (25) | « JPG to PDF Converter - CloudConvert is a free & fast online file conversion service. » (84) | 192 (162) | H1, outil, paragraphes de format | Rien |
| | FreeConvert /jpg-to-pdf | « JPG to PDF Converter - FreeConvert.com » (38) | « Easily convert JPG to PDF using our free online tool. Set orientation, margin, page-size, and merge multiple images into one PDF. » (129) | 1 883 (1 852) | gabarit FreeConvert (+ blocs « What is JPG / PDF ») | 1 GB ; 8 heures |
| | PDF24 /jpg-to-pdf | « JPG to PDF converter - 100% free & online - PDF24 » (49) | « Free online converter to convert JPG files to PDF. ✓ No limits and no watermarks. ✓ No installation or registration required. » (125) | 740 (601) | gabarit PDF24, Q&A 1 | serveurs ; « after a short time » ; 4,94 (5 447) |
| PDF to JPG | iLovePDF /pdf_to_jpg | « Convert PDF to JPG. Extract images from a PDF » (45) | « Convert all pages in a PDF to JPG or extract all images in a PDF to JPG. Convert or extract PDF to JPG online, easily and free. » (127) | 333 (106) | H1 + H2 | config JS seulement |
| | Smallpdf /pdf-to-jpg | « PDF to JPG Converter: Convert PDF to Image for Free » (51) | « Turn your PDF into a JPG image with a free and secure online converter. No installation or account creation needed. » (115) | 1 110 (791) | H1 ; 6 H3 ; How to ; FAQ 6 ; blog | 1 heure (« we can't retrieve files that are deleted ») |
| | CloudConvert /pdf-to-jpg | « PDF to JPG \| CloudConvert » (25) | « PDF to JPG Converter - CloudConvert is a free & fast online file conversion service. » (84) | 205 (175) | idem CloudConvert | Rien |
| | FreeConvert /pdf-to-jpg | « PDF to JPG Converter Online - FreeConvert.com » (45) | « Easily convert PDF to high-quality JPG images in seconds. Our PDF to JPG converter is 100% free, secure, and works on any web browser. » (134) | 1 837 (1 806) | gabarit + « Convert or Extract » | 1 GB ; 8 heures |
| | PDF24 /pdf-to-jpg | « PDF to JPG converter - 100% free & online - PDF24 » (49) | « Free online converter to convert PDF files to JPG. ✓ No limits and no watermarks. ✓ No installation or registration required. » (125) | 756 (617) | gabarit PDF24 | serveurs ; 4,96 (4 982) |
| Word to PDF | iLovePDF /word_to_pdf | « Convert Word to PDF. Documents DOC to PDF » (41) | « Convert documents Word to PDF exactly as the original PDF file. Convert Word to PDF online, easily and free. » (108) | 298 (71) | H1 + H2 | config JS wordpdf 15 Mo / 1 fichier (palier non vérifié) |
| | Smallpdf /word-to-pdf | « Free Word to PDF Converter: Convert DOC or DOCX to PDF » (54) | « Convert Word to PDF for free. Supports DOC and DOCX, no installation needed, trusted by over 1 billion users since 2013. » (120) | 1 080 (749) | H1 ; 3 H3 ; How to ; 6 H3 ; FAQ 6 ; LD AggregateRating 4,6 (526 111) | « 256-bit TLS » ; 1 heure |
| | CloudConvert /docx-to-pdf | « Word to PDF \| CloudConvert » (26) | « High Quality Word (DOCX) to PDF Converter - No watermarks, no sign up required. » (79) | 211 (181) | idem | Rien |
| | FreeConvert /word-to-pdf | « WORD to PDF Converter - FreeConvert.com » (39) | « WORD to PDF converter. Best way to convert WORD to PDF online at the highest quality. This tool is free, secure, and works on any web browser. » (142) | 1 700 (1 669) | gabarit | 1 GB ; 8 heures |
| | PDF24 /word-to-pdf | « Word to PDF converter - 100% free & online - PDF24 » (50) | « Free online converter to convert Word files to PDF. ✓ No limits and no watermarks. ✓ No installation or registration required. » (126) | 697 (558) | gabarit PDF24 | serveurs ; 4,93 (3 136) |

### 1b. Image

| Outil | Concurrent / URL | Titre (car.) | Méta-description (car.) | Mots | Structure | Limites / traitement / suppression |
|---|---|---|---|---|---|---|
| Compress image | iLoveIMG /compress-image | « Easily compress images at optimal quality in seconds. » (53) | « Choose multiple JPG, PNG or GIF images and compress them in seconds for free! You can shrink with ease in just a few clicks! » (124) | 185 (79) | H1 « Compress IMAGE » + H2 formats ; outil | config JS compressimage (200 Mo/30, 1000 Mo/60, 4000 Mo/120 ; paliers non vérifiés) |
| | FreeConvert /image-compressor | « Image Compressor - FreeConvert.com » (34) | « Image Compressor. Compress image files by up to 80% while retaining quality. Supports JPG, PNG, and GIF formats. Online and free. » (129) | 846 (815) | H1 ; How to ; 3 bénéfices ; outils image ; data | 1 GB ; 8 heures |
| Resize image | iLoveIMG /resize-image | « Resize multiple images at once! » (31) | « Resize multiple JPG, PNG, SVG or GIF images in seconds easily and for free. Bulk resize images by defining pixels or percentages. » (129) | 244 (138) | H1 + H2 ; options (pixels / pourcentage) | idem config |
| PNG to JPG | iLoveIMG /convert-to-jpg | « Convert images in multiple formats to JPG in seconds. » (53) | « Convert many image formats to JPG in seconds for free! Bulk convert PNG, GIF, TIFF or RAW formats to JPGs with ease. » (116) | 216 (110) | H1 + H2 listant PNG, GIF, TIF, PSD, SVG, WEBP, HEIC, RAW | — |
| | CloudConvert /png-to-jpg | « PNG to JPG \| CloudConvert » (25) | « PNG to JPG Converter - CloudConvert is a free & fast online file conversion service. » (84) | 200 (170) | idem CloudConvert | — |
| | FreeConvert /png-to-jpg | « PNG to JPG Converter - FreeConvert.com » (38) | « PNG to JPG. Best way to convert PNG to JPEG online at the highest image quality. 100% free, secure, and works on any web browser. » (129) | 1 875 (1 844) | gabarit + formats | 1 GB ; 8 heures (HTTPS) |
| HEIC to JPG | CloudConvert /heic-to-jpg | « HEIC to JPG \| CloudConvert » (26) | « HEIC to JPG Converter - CloudConvert is a free & fast online file conversion service. » (85) | 192 (162) | idem | — |
| | FreeConvert /heic-to-jpg | « HEIC to JPG \| FreeConvert.com » (29) | « Best HEIC to JPG converter. Convert HEIC to JPEG in the highest quality in seconds. Supports live mode (multi-image) HEIC files. Online & free. » (143) | 1 746 (1 715) | gabarit + « What is HEIC / How to open » | 1 GB ; 8 heures |
| | PDF24 /heic-to-jpg | « HEIC to JPG converter - 100% free & online - PDF24 » (50) | « Free online converter to convert HEIC files to JPG files. ✓ No limits and no watermarks. ✓ No installation or registration required. » (132) | 452 (313) | H1 ; H2 « …right in your browser without installing any software » ; peu de texte | traitement navigateur annoncé dans le H2 |
| Remove background | iLoveIMG /remove-background | « Image background remover » (24) | « Remove image backgrounds online with our powerful background removal tool. Save time editing with this AI-powered tool that instantly removes unwanted backgrounds with amazing accuracy. » (185) | 234 (128) | H1 + H2 ; consigne curseur avant/après | — |
| | remove.bg (accueil) | « Remove Background from Image for Free – remove.bg » (49) | « Remove image backgrounds automatically in 5 seconds with just one click. Don't spend hours manually picking pixels. Upload your photo now & see the magic. » (154) | 364 (292) HTML brut, rendu client | non lisible sans JS | — |

### 1c. Audio, vidéo, GIF

| Outil | Concurrent / URL | Titre (car.) | Méta-description (car.) | Mots | Structure | Limites / traitement / suppression |
|---|---|---|---|---|---|---|
| MP4 to MP3 | CloudConvert /mp4-to-mp3 | « MP4 to MP3 \| CloudConvert » (25) | « MP4 to MP3 Converter - CloudConvert is a free & fast online file conversion service. » (84) | 190 (160) | idem | — |
| | FreeConvert /mp4-to-mp3 | « MP4 to MP3 Converter - FreeConvert.com » (38) | « MP4 to MP3 converter. Best way to convert MP4 to MP3 online at the highest quality. This tool is free, secure, and works on any web browser. » (140) | 2 180 (2 149) | gabarit + 2 blocs format | 1 GB ; 8 heures |
| | 123apps audio-extractor.net | « Audio Extractor - Extract sound from video online » (49) | **aucune** méta-description | 675 (548) | pas de H1/H2 dans le HTML ; blocs texte | — (Premium : « Open files up to 10 GB ») |
| Audio converter | FreeConvert /audio-converter | « Audio Converter - FreeConvert.com » (33) | « Online Audio Converter. Quickly convert any audio format at the highest audio quality. 100% free, secure, and works on any web browser. » (135) | 817 (786) | H1 ; How to ; Convert Any / Best Quality / Free & Secure ; liste convertisseurs spécifiques | 1 GB ; 8 heures |
| | CloudConvert /mp3-converter | « MP3 Converter \| CloudConvert » (28) | « MP3 Converter - CloudConvert is a free & fast online file conversion service. » (77) | 316 (286) | H1 ; listes « Convert from / to MP3 » | — |
| | 123apps online-audio-converter.com | « Online Audio Converter - Сonvert audio files to MP3, WAV, MP4, M4A, OGG or iPhone Ringtones » (91, formats dans le titre) | **aucune** | 968 (841) | 9 H3 : formats, extraire d'une vidéo, réglages avancés, « It's safe », lot, tags, navigateur | « automatically deleted from our servers a few hours after » (non chiffré) |
| Video converter | FreeConvert /video-converter | « Video Converter - FreeConvert.com » (33) | « FreeConvert Video Converter can convert video to MP4, WebM, FLV, MKV, iPhone, Android, and more online for free. Supports 500+ video conversions. » (145) | 844 (813) | gabarit | 1 GB ; 8 heures |
| | CloudConvert /video-converter | « Video Converter \| CloudConvert » (30) | « Video Converter - MP4, WEBM and many more supported. » (52) | 118 (88) | H1 + liste de 28 formats | — |
| | 123apps video-converter.com | « Online Video Converter - Convert Video to MP4, AVI, MPEG, FLV, 3GP, MKV, h264 or h265 » (85) | **aucune** | 911 (784) | 8 H3 dont « Upload files of up to 4 GB », « Security guaranteed » | « You can upload files up to 4 GB in size. » ; suppression « a few hours after » |
| Video to GIF | CloudConvert /mp4-to-gif | « MP4 to GIF \| CloudConvert » (25) | « MP4 to GIF Converter - CloudConvert is a free & fast online file conversion service. » (84) | 194 (164) | idem | — |
| | FreeConvert /video-to-gif | « Video to GIF Converter - FreeConvert.com » (40) | « Video to GIF Converter. Easily create high-quality GIF animations from your video files online for free. Convert MP4, FLV, MOV, MKV, and more to GIF. » (149) | 1 687 (1 656) | gabarit + « Advanced options » + FAQ 6 | 1 GB ; 8 heures |
| | ezgif /video-to-gif | « MP4 video to GIF converter » (26) | « Upload your video, select the part you want to convert and instantly create a GIF in good quality for free and without watermarks. » (130) | 617 (470) | H1 ; H2 ; Tips | « All uploaded files are automatically deleted 1 hour after upload. » |
| GIF compressor | FreeConvert /gif-compressor | « GIF Compressor \| Compress GIF Animations Online » (47) | « A fast online GIF compressor to reduce GIF file size. Our GIF optimizer uses lossy compression and other strategies to reduce GIF size by up to 60% » (147) | 1 585 (1 554) | gabarit + « Advanced Options » détaillées (couleurs, images à retirer) | 1 GB ; 8 heures |
| | iLoveIMG /compress-gif | « Compress your GIF & animated GIFs in seconds for free! » (54) | « Choose your GIF images and compress them in seconds maintaining animation! Shrink GIF images to reduce filesize for free! » (121) | 190 (84) | H1 + H2 | — |
| | ezgif /optimize | « Animated GIF optimizer and compressor » (37) | « Free online tool for optimizing animated GIF images to reduce file size. Compress GIFs with LZW compression, reduce colors or frame rate, remove duplicate frames. » (162) | 657 (510) | H1 ; H2 « Lossy GIF Compression » ; un H3 **par méthode** (réduction couleurs, 1 image sur n, transparence, coalesce) | 1 heure |

### 1d. Texte, développeur, QR, calcul, fichiers

| Outil | Concurrent / URL | Titre (car.) | Méta-description (car.) | Mots | Structure | Traitement / données |
|---|---|---|---|---|---|---|
| Word counter | wordcounter.net | « WordCounter - Count Words & Correct Writing » (43) | « Copy and paste your text into the online editor to count its words and characters, check keyword density, and correct writing mistakes. Bookmark it now, it's free and easy. » (172) | 2 019 | H1 = compteur en direct « 0 words 0 characters » ; « What is WordCounter? » ; détails, densité de mots-clés | — |
| | wordcounter.io | « Word Counter — Count Words and Check Grammar » (44) | 173 car. (balise mal formée, se termine par `" name="description`) | 679 (557) | H1 ; blog ; « COMMON QUESTIONS » = 4 × « How many pages is N words? » | — |
| Case converter | convertcase.net | « Convert Case \| Convert upper case to lower case, lower case to upper case and more! » (83) | « Easily convert text between different letter cases: lower case, UPPER CASE, Sentence case, Capitalized Case, aLtErNaTiNg cAsE and more online. » (142) | 2 023 (1 267) | H1 = question-problème (« caps lock ») ; un H3 **par casse** avec exemple ; puis générateurs | — |
| JSON formatter | jsonformatter.org | « Best JSON Formatter and JSON Validator: Online JSON Formatter » (61) | « Online JSON Formatter / Beautifier and JSON Validator will format JSON data, and helps to validate, convert JSON to XML, JSON to CSV. Save and Share JSON » (153) | 1 307 (691) | H1 ; H2 Validator ; H2 Beautifier ; questions (What is JSON, How do I format…) | « Stores data locally… in Browser's Local Storage » |
| | jsonformatter.curiousconcept.com | « JSON Formatter & Validator » (26) | « The JSON Formatter & Validator beautifies and debugs JSON data with advanced formatting and validation algorithms. » (114) | 1 282 | About ; Learn about JSON ; Bookmarklet ; FAQ 4 ; changelog (~30 dates) | FAQ « Is any of my JSON data recorded or saved? » |
| Base64 | base64decode.org | « Base64 Decode and Encode - Online » (33) | « Decode from Base64 format or encode into it with various advanced options. Our site has an easy to use online tool to convert your data. » (136) | 1 098 (1 006) | H1 ; H2 fichiers ; Overview ; H3 Advanced options / Safe and secure / Completely free / Details of the encoding | « maximum file size is 100MB » ; « Live mode… with your browser's built-in JavaScript functions, without sending any information to our servers » ; fichier supprimé « after the first download attempt or 15 minutes of inactivity » — **modèle de précision à suivre** |
| | base64encode.org | « Base64 Encode and Decode - Online » (33) | 134 car., même phrase inversée | 1 354 (1 262) | même gabarit (site jumeau) | idem |
| QR code | qr-code-generator.com | « QR Code Generator \| Create Your Free QR Codes » (45) | « QR Code Generator for URL, vCard, and more. Add logo, colors, frames, and download in high print quality. Get your free QR Codes now! » (133) | 2 902 (2 342) | page marketing (cas d'usage, types, 3 étapes, FAQ ~15, LD FAQPage) | — |
| | QRCode Monkey | « QRCode Monkey - The free QR Code Generator to create custom QR Codes with Logo » (78) | « Create custom QR Codes with Logo, Color and Design for free. This QR Code Maker offers free vector formats for best print quality. » (131) | 1 868 | H1 ; 4 étapes ; 6 H3 bénéfices ; FAQ 8 | logo « maximum size of 2 MB » ; « We cache your qr code image files for 24h on our server » |
| | PDF24 /qr-code-generator | « Generate QR code - 100% free & online - PDF24 » (45) | « Quickly and easily generate individually designed QR codes of various types. No limits. No installation or registration required. » (129) | 584 (445) | gabarit PDF24 | « generated directly in your browser » ; 4,92 (414) |
| Percentage calc. | calculator.net /percent-calculator | « Percentage Calculator » (21) | « This free percentage calculator computes a number of values involving percentages, including the percentage difference between two given values. » (144) | 610 | calculatrices (phrases courantes, différence, variation) puis H3 définition + **formules** | — |
| | Omni /math/percentage | « Percentage Calculator » (21) | 146 car. (même défaut de balise) | 4 213 (3 713) | H2 = une question-formule par mode (« What is p% of x? »…) ; guide long ; auteur (LD Article+Person) ; FAQ | — |
| Unit converter | unitconverters.net | « Unit Converter » (14) | 312 car. (trop long, tronqué par Google) | 527 | express, liste des conversions courantes | — |
| | calculator.net /conversion-calculator | « Conversion Calculator » (21) | « This free conversion calculator converts between common units of length, temperature, area, volume, weight, and time. » (117) | 1 289 | H1 ; histoire des systèmes d'unités | — |
| ZIP extractor | ezyZip /unzip-files-online.html | « Unzip Files Online (No Upload - 100% Private) - ezyZip » (54) | « Extract zip files our free zip file opener including password protected files. NO upload/downloading. no usage limits. Quick and secure! » (136) | 3 173 (2 631) | H1 ; instructions ; vidéo ; « How do I unzip files? » ; **FAQ 16** ; « Why client-side ZIP extraction is faster » | « Extraction runs entirely in your browser. » « Your files never leave your device. » |
| | 123apps extract.me | « Archive Extractor Online » (24) | **aucune** | 801 (674) | pas de H1/H2 | — |
| | CloudConvert /zip-converter | « ZIP Converter \| CloudConvert » (28) | « ZIP Converter - CloudConvert is a free & fast online file conversion service. » (77) | 285 (255) | listes from/to | — |

### 1e. Ce que montre la lecture (synthèse)

1. **Quatre gabarits de marché, tous industrialisés.** CloudConvert : ~120-300 mots, titre « X to Y \| CloudConvert »,
   méta identique d'une page à l'autre (« … - CloudConvert is a free & fast online file conversion service. »).
   iLove* : ~70-160 mots utiles, aucune FAQ. PDF24 : ~450-1 030 mots, 6 H3 identiques sur chaque page
   (« That's how easy it is », « Easy to use », « Supports your system »…), méta identique au nom près.
   FreeConvert : 800-2 200 mots, mêmes blocs « Easy to Use / Best Quality / Free & Secure / Your Data, Our Priority »
   + fiches « What is X / How to open X » réutilisées entre pages. Ces sites s'en sortent par l'**autorité** (liens,
   marque, ancienneté) — nous ne pouvons pas copier leurs gabarits répétitifs sans risque « scaled content abuse ».
2. **Smallpdf est le seul à écrire du spécifique** : H1 avec bénéfice, H3 bénéfices propres à l'outil, How to, 6-10 FAQ
   réelles par outil, liens vers tutoriels (« Compress PDF to 1 MB »). C'est le modèle de structure le plus proche de
   ce que nous voulons — sans ses affirmations non vérifiables (« up to 99% », « 1 billion users »).
3. **Titres** : 25-61 caractères, médiane ≈ 45. Deux familles : « X to Y Converter: <bénéfice> for Free » (Smallpdf)
   et « X to Y - <slogan> - Marque ». Le mot « Converter » est quasi systématique pour les conversions ; « Free » / « Online »
   présents dans 2/3 des cas. Les formats sont dans le titre pour les convertisseurs génériques (123apps, 91 car. —
   trop long, tronqué).
4. **Méta-descriptions** : 77-185 caractères ; les bonnes sont 115-155. Contenu type : verbe d'action + objet + 1 fonction
   précise + 1 réassurance (« No installation or account creation required »). Trois sites (123apps ×4) n'en ont **aucune**.
5. **Confidentialité** : toujours présente mais rarement précise. Précisions chiffrées trouvées : Smallpdf 1 heure,
   FreeConvert 8 heures + 1 GB, ezgif 1 heure, 123apps 4 GB vidéo / « a few hours », base64decode 100 MB + 15 min,
   QRCode Monkey cache 24 h. PDF24 et iLove* : « after a short time » / rien. **Le traitement local est un argument
   vendeur affiché dans les titres** quand il est vrai (ezyZip « No Upload - 100% Private », PDF24 HEIC « right in your
   browser »). Une incohérence relevée chez Smallpdf (navigateur ET serveurs) montre le risque d'une phrase générique.
6. **Limites de taille** : visibles seulement chez FreeConvert (« Max file size 1GB. »), 123apps, base64decode,
   QRCode Monkey. iLovePDF/iLoveIMG les gardent dans la configuration JavaScript (non visible). Donner nos vraies limites
   par appareil serait un **écart positif** vérifiable.
7. **FAQ** : seuls Smallpdf (6-10), FreeConvert (6, sur 2 pages seulement), PDF24 (1-7), ezyZip (16), qr-code-generator
   (~15), QRCode Monkey (8), Omni ont des FAQ substantielles. Les questions récurrentes sont : gratuit ? sûr / fichiers
   gardés ? qualité perdue ? sur Mac / iPhone / Android ? hors ligne ? formats acceptés ? fichiers multiples ? scannés ?
8. **Note agrégée** : PDF24 (4,89-4,96, 414 à 24 108 votes), Smallpdf (4,5-4,6, 526 k à 1 M), ezyZip (4,1 ; 5 186).
   Toutes issues d'un widget « Please rate this app » réel sur la page. Rappel : **jamais de note sans vrais votes**.

---

## 2. GABARIT DE STRUCTURE (pas de texte prêt à l'emploi)

Rédaction en anglais (langue des pages). Chaque fait écrit doit avoir une **source dans le code** (composant, constante,
route API) ou un **test daté** ; sinon il n'est pas écrit. Composant cible : `app/components/SeoContent.tsx`
(About, Example, How to use, FAQ, Tips, Related tools) + `layout.tsx` (title, description, OG).

### 2a. Titre (`metadata.title.absolute`) — 45 à 60 caractères, marque facultative

Règle commune : le mot-clé principal **en tête**, tel que l'utilisateur le tape ; un seul bénéfice vrai et propre à
l'outil ; pas de « Best », « #1 », « Fastest », « 100% » ; « Free » accepté (vérifié : aucun paiement sur le site) ;
« Online » seulement si la place le permet. Séparateur « — » ou « : ». Marque « | OnlineConverTools » (19 car.) seulement
si le total reste ≤ 60. Vérifier que deux pages n'ont jamais le même titre (script de contrôle).

| Type d'outil | Formule(s) | Exemple de forme (à adapter, non définitif) |
|---|---|---|
| Convertisseur X→Y | `X to Y Converter — <précision vraie : format de sortie / lot / sans envoi> Free` ; ou `Convert X to Y Online Free — <précision>` | « PDF to Word Converter — Editable DOCX, DOC or RTF » |
| Convertisseur générique (audio, vidéo, image) | `<Famille> Converter — <3-4 formats les plus cherchés> & more` | « Audio Converter — MP3, WAV, M4A, FLAC, OGG & more » |
| Éditeur / compresseur / redimensionneur | `<Verbe> <objet> — <le réglage qui le distingue> Free` ; ou `<Objet> Compressor: <ce qu'on contrôle>` | « Compress PDF — Choose the Level, See the New Size » |
| Générateur | `<Objet> Generator — <options réelles> (PNG/SVG…)` | « QR Code Generator — URL, Wi-Fi, vCard; PNG & SVG » |
| Calculatrice | `<Objet> Calculator — <les modes réels>` | « Percentage Calculator — % of, % Change, % Difference » |
| Utilitaire développeur | `<Objet> <action1> & <action2> — <propriété vraie, ex. runs in your browser>` | « JSON Formatter & Validator — Runs in Your Browser » |
| Outil texte | `<Objet> — <ce qu'il compte/transforme réellement>` | « Word Counter — Words, Characters, Sentences, Reading Time » |

Le **H1** reste court et nu (nom de l'outil, éventuellement « Free … Converter ») ; il ne répète pas le titre mot pour mot.

### 2b. Méta-description — 120 à 155 caractères

Formule : `[Verbe d'action] [entrée] to [sortie] [précision 1 vraie : options/formats]. [Où c'est traité, en clair].
[Limite ou fait distinctif chiffré, ou absence de filigrane/compte si vérifiée].`
- 2 phrases, pas plus de 3 ; aucun ✓ ni emoji ; pas de liste de mots-clés.
- Doit être **différente** de la phrase « About » (Google l'affiche, la page doit la compléter, pas la répéter).
- Interdit : une phrase de méta réutilisée sur plus d'une page (contrôle automatique par similarité, cf. 2e).

### 2c. Sections, dans l'ordre

| # | Section (composant) | But | Longueur cible | Faits obligatoires |
|---|---|---|---|---|
| 0 | Outil (au-dessus du pli) | faire le travail | — | inchangé ; le texte SEO ne doit jamais repousser l'outil |
| 1 | **About {tool}** (`description`) | dire exactement ce que fait l'outil et pour qui | 60-120 mots | formats d'entrée et de sortie **réels** (liste du code : `accept=`, sélecteur de sortie) ; ce que l'outil ne fait pas (ex. « scanned PDFs are not supported ») ; **où le fichier est traité** (navigateur / notre serveur / prestataire nommé) |
| 2 | **Example** (`example`, facultatif) | preuve concrète | 1 entrée + 1 sortie réelles | obligatoire pour texte, développeur, calcul, conversion d'unités (entrée → sortie exacte produite par l'outil, re-testée) ; pour fichiers : résultat mesuré daté (« a 4.2 MB scan → 1.1 MB at "Medium", test du JJ/MM ») ou rien |
| 3 | **How to use** (`howTo`) | étapes | 3-5 étapes, 1 phrase chacune | **libellés exacts des boutons et options** de l'interface (copiés du JSX, entre guillemets), y compris l'option qui distingue l'outil ; dernière étape = téléchargement (nom du bouton réel, format du fichier téléchargé, ZIP si plusieurs) |
| 4 | **Limits & privacy** (nouvelle section ou intégrée à la FAQ « Is it safe…? ») | lever l'objection n° 1 avec des chiffres | 40-90 mots | taille max **par appareil** si elle diffère (ordinateur / iPhone-Safari / Android) ; nombre de fichiers max ; durée max (audio/vidéo) ; où c'est traité ; **délai de suppression** côté serveur si serveur (valeur du code ou de la doc du prestataire, sinon « not verified » → ne pas écrire) ; quota quotidien s'il existe |
| 5 | **FAQ** (`faqs`) | répondre aux vraies questions | 3-6 questions, réponses 25-70 mots | voir 2d |
| 6 | **Tips** (`tips`) | conseils d'usage propres à l'outil | 2-4 puces, 1 phrase chacune | chaque conseil mène à une action dans **cet** outil ou à un outil lié (« Run OCR first, then… ») ; pas de banalités |
| 7 | **Related tools** (automatique, ToolSeo) | maillage | 4-6 liens | inchangé (P35) ; la note `note` dit pourquoi le lien est utile ici |

Total visible cible : **350-700 mots** par page (zone Smallpdf/PDF24 ; ne pas viser les 1 500-2 200 de FreeConvert,
obtenus par blocs génériques). Une page n'atteint pas le bas de la fourchette ? On écrit moins plutôt que de remplir.

Option, par famille seulement quand c'est vrai et utile : un paragraphe « X vs Y » (ex. HEIC vs JPG, DOCX vs DOC vs
RTF, lossless vs lossy) — **jamais** les fiches « What is a PDF file / How to open a PDF file » recopiées sur chaque page
(motif FreeConvert, contenu en double à l'échelle du site).

### 2d. Règles de sélection de la FAQ

1. Partir de la liste de la partie 3 pour l'outil ; garder **3 à 6** questions auxquelles l'outil permet une réponse
   exacte et vérifiée.
2. Ordre : (a) la question de capacité principale (« Can I convert scanned PDFs? », « Can I merge PDF and JPG? »),
   (b) qualité / perte (« Will I lose quality? »), (c) confidentialité (« Are my files uploaded / kept? »), (d) appareil
   (« Does it work on iPhone? ») si une limite iPhone/Safari existe dans le code, (e) gratuité/quota seulement si un quota
   ou une limite réelle existe à expliquer.
3. Formulation : la question telle que l'utilisateur la tape (« How do I… », « Can I… », « Is it safe… »), sans le nom de
   marque du concurrent, ni « Is OnlineConverTools the best…? ».
4. Réponse : première phrase = **Oui / Non / le chiffre** ; puis la condition ou la limite ; puis, au besoin, l'outil lié.
   25-70 mots. Aucune réponse « Yes, it's completely free with no signup required » nue (aujourd'hui présente sur des
   dizaines de pages — exemple : pdf-to-word Q1 ; à remplacer par une question utile ou à supprimer).
5. Une même question n'apparaît sur plusieurs pages que si la réponse diffère réellement (limites, formats, traitement).
   La question « Do I need to install any software? » ne figure nulle part (sans valeur, identique partout).
6. Les questions/réponses restent visibles (le JSON-LD FAQPage est construit depuis elles — P35 ; il ne doit jamais dire
   plus que la page).

### 2e. Anti-motifs (refus en relecture)

- **Phrase réutilisable** : toute phrase qui reste vraie si l'on remplace le nom de l'outil par un autre (« fast, easy and
  secure », « works on any device », « no software to install », « simply upload your file and click convert »).
  Contrôle proposé : similarité de phrases entre pages (n-grammes de 8 mots identiques sur ≥ 3 pages = alerte).
- **Bourrage de mots-clés** : le mot-clé exact plus de ~3 fois dans le texte visible hors titres ; variantes empilées
  (« PDF to Word, PDF to DOCX, PDF2Word converter online free »).
- **Affirmations non vérifiables ou fausses sans preuve dans le code** : « unlimited », « no limits », « 100% secure »,
  « fastest », « best quality », « 100% accurate », « up to 99% smaller », « trusted by millions », « no sign-up »
  (n'écrire « No account needed » que si vérifié pour cet outil — ex. aucun garde d'authentification sur la route),
  « no watermark » (vérifié par sortie réelle), « files never leave your device » (seulement si **aucun** appel réseau
  ne transporte le fichier — vérifier l'absence de fallback serveur : OCR, iOS PDF→pdftoppm, Gotenberg, etc.).
- **Chiffres inventés** : taux de compression, nombre d'utilisateurs, notes/étoiles, temps de traitement — seulement s'ils
  sortent d'un test daté ou d'une constante du code.
- **Fiches de format génériques** (« What is a JPG file? ») copiées entre pages.
- **Promesses de concurrents recopiées** (« ISO 27001 », « GDPR certified », « 256-bit ») — nous ne les avons pas
  vérifiées pour nous.
- Méta-description = phrase About ; titre = H1 ; deux pages au même titre.
- FAQ dont la réponse ne répond pas (« It depends ») ou renvoie seulement vers un autre outil.

### 2f. Fiche de faits à remplir AVANT d'écrire (par outil)

| Fait | Source à citer dans la fiche de travail |
|---|---|
| Formats d'entrée acceptés (extensions + MIME) | `accept=`, garde de fichier |
| Formats/options de sortie | sélecteur, constantes |
| Libellés exacts : bouton principal, options, téléchargement | JSX de `page.jsx` |
| Taille max / nb fichiers / durée max — ordinateur, iPhone/Safari, Android | constantes (`MAX_*`), garde iOS |
| Lieu de traitement (navigateur, notre serveur, prestataire nommé) et cas de repli | appels `fetch`, routes API, workers |
| Suppression côté serveur (délai) | code de la route / doc prestataire ; sinon « non vérifié » → non écrit |
| Quota quotidien éventuel | guard / usage_counters (lecture du code seulement) |
| Ce que l'outil ne fait pas | tests, messages d'erreur |
| Exemple réel (entrée → sortie) | exécution datée |

---

## 3. Questions récurrentes par outil (à réutiliser par les rédacteurs)

PAA Google **non lu** (voir réserves en tête). Sources : **[FAQ x]** = question présente dans la FAQ visible du
concurrent x le 05/10/2026 ; **[R]** = question récurrente dans les titres de résultats des recherches du 05/10 ;
**[déduite]** = question implicite des sections des concurrents (H2/H3), à confirmer. Traduction littérale gardée en anglais.

**PDF to Word**
- Can I convert PDF to Word for free? [FAQ Smallpdf]
- Can I convert a scanned PDF to Word? / Does it use OCR? [déduite iLovePDF : encart OCR ; R]
- Will the Word file keep the formatting (fonts, tables, layout)? [déduite Smallpdf, R]
- Can I convert PDF to Word on Mac or mobile? [FAQ Smallpdf]
- Can I convert PDF to Word offline? [FAQ Smallpdf]
- How do I convert a large PDF to Word? [FAQ Smallpdf]
- Is it safe / are my files deleted? [FAQ Smallpdf]
- How do I convert PDF to Word in Microsoft Word itself? [R : Microsoft Q&A, Adobe community]

**Merge PDF**
- How do I combine PDF files into one document? [FAQ FreeConvert, PDF24]
- Can I merge PDF and JPG (or non-PDF) files together? [FAQ Smallpdf ×2]
- What file formats are supported for merging? [FAQ Smallpdf]
- Can I change the order / add or delete pages before merging? [déduite Smallpdf, FreeConvert « How do I add PDF pages? »]
- How can I reduce the size of a merged PDF? [FAQ Smallpdf, FreeConvert]
- How do I merge PDFs on a Mac? / in Chrome? / in Google Drive? [FAQ Smallpdf, FreeConvert]
- How can I merge PDFs offline? [FAQ PDF24, Smallpdf]
- How to merge multiple Word documents? [FAQ PDF24]
- Is it safe to merge PDFs online? [FAQ FreeConvert]

**Compress PDF**
- How do I reduce the size of a PDF without losing quality? [FAQ PDF24]
- Does compressing a PDF reduce quality? / Will it affect fonts? [FAQ PDF24, Smallpdf]
- Why is my PDF so big? [FAQ PDF24]
- What does compressing a PDF do? / How does PDF compression work? [FAQ PDF24, Smallpdf]
- How do I reduce a scanned PDF file size? [FAQ Smallpdf]
- How do I compress a PDF to under 1 MB / 100 KB / a chosen size? [tutoriels Smallpdf]
- How do I reduce the size of a PDF offline? [FAQ PDF24]
- Is the compress tool safe to use? [FAQ Smallpdf]

**JPG to PDF**
- Can I merge multiple JPGs into one PDF? [FAQ Smallpdf]
- What image formats can I convert to PDF? [FAQ Smallpdf]
- Will image quality be affected? [FAQ Smallpdf]
- How do I convert JPG to PDF on Mac or Windows? [FAQ Smallpdf]
- Can I set page size, orientation and margins? [déduite FreeConvert/iLovePDF méta]
- Is my data secure? [FAQ Smallpdf]

**PDF to JPG**
- Can I extract individual images from a PDF (vs. convert each page)? [FAQ Smallpdf ; « Convert or Extract » FreeConvert, iLovePDF]
- Will image quality be affected? / What resolution (DPI)? [FAQ Smallpdf ; PDF24 H2 « resolution and image quality you choose » ; blog Smallpdf DPI]
- Can I convert only some pages (page range)? [déduite FreeConvert]
- How do I convert PDF to JPG on Mac, Windows or a phone? [FAQ Smallpdf]
- How can I convert PDF to JPG offline? [FAQ Smallpdf]
- Does the site keep the original file? [FAQ Smallpdf]

**Word to PDF**
- How do I save a Word document as a PDF? [FAQ Smallpdf]
- Are DOC and DOCX both supported? [FAQ Smallpdf]
- Can I convert other Office formats (Excel, PowerPoint)? [FAQ Smallpdf]
- Will the layout/fonts stay the same? [déduite Smallpdf « Without Any Formatting Loss », PDF24 H2]
- Is it safe? [FAQ Smallpdf]

**Compress image**
- How do I compress an image without losing quality? [R]
- How do I reduce a JPG to 100 KB (or a target size)? [R : nombreuses pages « compress to 100KB »]
- Which formats can be compressed (JPG, PNG, GIF, WebP, SVG)? [déduite iLoveIMG, FreeConvert]
- How much smaller will my image get? [déduite FreeConvert « up to 80% » — ne jamais reprendre le chiffre]
- Can I compress several images at once? [déduite iLoveIMG]

**Resize image**
- Can I resize by pixels or by percentage? [déduite iLoveIMG]
- Can I keep the aspect ratio? [déduite iLoveIMG]
- Can I resize several images at once? [déduite iLoveIMG]
- Does resizing reduce file size / quality? [déduite, à confirmer]

**PNG to JPG**
- Will I lose quality converting PNG to JPG? [déduite FreeConvert « Best Quality »]
- What happens to transparency? [déduite — question classique, à confirmer]
- Can I convert many PNGs at once? [déduite iLoveIMG]
- Which other formats can I convert to JPG? [déduite iLoveIMG H2 : PNG, GIF, TIF, PSD, SVG, WEBP, HEIC, RAW]

**HEIC to JPG**
- How do I convert HEIC to JPG on iPhone? (et : réglage « Most Compatible ») [R : 5 résultats sur 9]
- How do I open / convert HEIC on Windows? [R : Tom's Guide, CopyTrans ; FAQ FreeConvert « How to open a HEIC file? »]
- What is a HEIC file? [FAQ FreeConvert]
- Can it convert Live Photos / multi-image HEIC? [déduite FreeConvert méta]
- Is the conversion done in my browser? [déduite PDF24 H2]

**Remove background**
- Is it really free / is there a watermark? [R]
- Do I need to sign up? [R]
- Is my image uploaded to a server? [R]
- Which formats are accepted, and what format is the result (transparent PNG)? [R ; iLoveIMG « JPG and PNG »]
- Can I put a white or custom background instead? [R : EraserBG]

**MP4 to MP3 / video to audio**
- Does converting MP4 to MP3 lose quality? [R : Quora, guides de débit]
- Which bitrate should I choose (128 / 192 / 320 kbps)? [R]
- How do I extract the sound from a video? [FAQ/H3 123apps]
- What is an MP4 / MP3 file and how do I open it? [FAQ FreeConvert — ne pas recopier en fiche]
- Is there a file size limit? [déduite FreeConvert « Max file size 1GB »]

**Audio converter**
- Which formats can I convert to (MP3, WAV, M4A, FLAC, OGG, iPhone ringtone)? [déduite 123apps titre/H3]
- Can I change bitrate, sample rate, channels? [déduite 123apps « Advanced settings »]
- Can I convert several files at once? [déduite 123apps « Batch conversion »]
- Are the tags (title, artist) kept? [déduite 123apps « Tag support »]
- Are my files deleted? [déduite 123apps « It's safe »]

**Video converter**
- What is the maximum file size? [déduite 123apps « Upload files of up to 4 GB »]
- Which formats are supported (MP4, MKV, MOV, AVI, WebM; H.264/H.265)? [déduite CloudConvert, 123apps]
- Can I change resolution / compress the video? [déduite FreeConvert]
- Are my files deleted? [déduite 123apps, FreeConvert]

**Video to GIF**
- Can a video be saved as a GIF? [FAQ FreeConvert]
- How do I turn a video into a GIF without losing quality? [FAQ FreeConvert]
- What video types can be converted to GIF? [FAQ FreeConvert]
- Can I choose only part of the video (start/end)? [déduite ezgif méta]
- Can I share the GIF on social media? [FAQ FreeConvert]
- Do you keep the GIF files I create? [FAQ FreeConvert]

**GIF compressor**
- How do I reduce a GIF's file size? [déduite FreeConvert, ezgif]
- Will the animation be kept? [déduite iLoveIMG méta]
- Lossy compression, fewer colors, or dropping frames — which to use? [déduite ezgif H3, FreeConvert options]
- How much smaller can it get? [déduite — chiffre FreeConvert « up to 60% » à ne pas reprendre]

**Word counter**
- How many pages is 1 000 (500, 1 500, 5 000) words? [FAQ wordcounter.io ×4 ; R : 9 résultats sur 9]
- Does the character count include spaces? [R]
- How is reading time / speaking time calculated? [déduite wordcounter.net]
- What counts as a word (hyphens, numbers)? [déduite, à confirmer]

**Case converter**
- What is sentence case / title case / capitalized case / alternating case? [déduite convertcase.net, un H3 par casse]
- How do I undo caps lock text? [déduite convertcase.net H1]
- Which title-case rules are used (small words)? [déduite, à confirmer]

**JSON formatter**
- What is JSON? [FAQ jsonformatter.org]
- How do I format (beautify) a JSON file? [FAQ jsonformatter.org]
- How do I validate JSON / find the error? [déduite H2 Validator]
- Is my JSON data recorded or saved? [FAQ curiousconcept]
- Is the formatter available offline? [FAQ curiousconcept]

**Base64 encode/decode**
- Is Base64 encryption? [R : 3 résultats sur 9 — réponse : non, encodage réversible]
- Why is Base64 about 33% larger? [R]
- Can I encode/decode a file (image) and not only text? [déduite base64decode H2]
- What is URL-safe Base64 / which character set (UTF-8)? [déduite « Advanced options »]
- Is my data sent to a server? [déduite base64decode « Live mode »]

**QR code generator**
- Do the QR codes expire? / How long are they valid? [FAQ qr-code-generator, QRCode Monkey]
- Is there a scan limit? [FAQ QRCode Monkey]
- Can I use them for commercial purposes? [FAQ qr-code-generator, QRCode Monkey]
- Static vs dynamic QR code? [FAQ qr-code-generator]
- Can I add a logo / change colors? [FAQ qr-code-generator]
- What can a QR code contain (URL, Wi-Fi, vCard, text)? [FAQ qr-code-generator ; PDF24 H2]
- My QR code doesn't scan, what can I do? [FAQ QRCode Monkey]
- Is my data saved? [FAQ QRCode Monkey]

**Percentage calculator**
- What is p% of x? / x is what percent of y? / x is p% of what? [H2 Omni ; calculator.net]
- How do I calculate percentage change / increase / decrease? [H2 Omni, calculator.net]
- What is the difference between percentage difference and percentage change? [calculator.net H2]
- Percent vs percentage points? [H2 Omni]
- What is the percentage formula? [H3 calculator.net, Omni]

**Unit converter**
- Which unit families are covered (length, mass, temperature, volume, area, time…)? [déduite calculator.net méta]
- How precise are the results (decimals, exact factors)? [déduite, à confirmer]
- Metric vs imperial / US vs UK units (gallon, ton)? [déduite calculator.net « Different Systems of Units »]

**ZIP extractor**
- How do I unzip files online? [FAQ ezyZip]
- Can I open password-protected ZIP files? [FAQ ezyZip]
- Can I preview / extract only some files or a subfolder? [FAQ ezyZip ×3]
- Can I save all files into a folder? [FAQ ezyZip]
- What archive types can I extract (RAR, 7Z, TAR, GZ)? [FAQ ezyZip]
- Which OS and browsers work? [FAQ ezyZip]
- Is it safe — are files uploaded? [FAQ ezyZip ; titre « No Upload - 100% Private »]

---

Sources de recherche complémentaires (résultats lus le 05/10, pas des PAA) : learn.microsoft.com (Q&A PDF→Word),
tomsguide.com et copytrans.net (HEIC), quora.com et xconvert.com (MP4→MP3), bharatkalluri.com et toolsana.com (Base64),
wordcounter.io et grammarly.com (pages par nombre de mots), 11zon et smallseotools (compression à 100 KB).
