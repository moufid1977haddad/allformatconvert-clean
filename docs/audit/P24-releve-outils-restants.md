# P24 — relevé des outils qu'aucune passe n'avait comparés (03/10, 4 agents de recherche en lecture seule)

Liste de travail : `[x]` fait (banc à l'appui, voir RAPPORT-p24 §9), `[ ]` à faire, `[E]` décision du propriétaire.
D'abord les **résultats faux silencieux** (règle : ils passent avant tout ajout).

## A. Résultats faux ou promesses rompues sans le dire

### PDF
- [x] pdf.js sans `wasmUrl` / `cMapUrl` / `iccUrl` / `standardFontDataUrl` : pages scannées CCITT/JBIG2/JPEG 2000 peut-être rendues blanches (PDF to JPG/Image, Redact, OCR), texte CJK vide (Extract, Compare, HTML) — à prouver sur de vrais scans
- [x] PDF Editor : police et images intégrées au document source, dessinées sur la sortie → texte et images ajoutés cassés (prouvé par l'agent)
- [x] Reorder Pages : « 3-5 » lu 3, mots et numéros hors document jetés, pages absentes perdues sans avertissement, liste invalide → PDF vide
- [x] Merge / Split : signets et formulaires perdus sans un mot (`pdfCarryOver.js` non utilisé) ; champs de même nom en conflit dans Merge
- [x] Image to PDF / JPG to PDF : TIFF multipage → 1re page seulement, sans le dire
- [ ] EPUB / MOBI to PDF : chapitre illisible sauté sans le dire
- [ ] Compare : deux PDF scannés (sans texte) annoncés identiques
- [ ] Extract Text : PDF scanné → « Page N: » vides sans explication
- [ ] Forms : XFA pur → « No form fields found » trompeur
- [ ] Sign : la page dit « type it… or upload » puis « You can only draw » (texte périmé)

### Image
- [ ] Image Blur : avec `ctx.filter`, bords semi-transparents (cadre blanc en JPG), différent de Safari
- [ ] Add Vignette : zones transparentes noircies (source-over)
- [ ] WebP to JPG : WebP animé → 1re image sans le dire
- [ ] Image Compressor : APNG et WebP animé rendus figés sans le dire
- [x] TIFF to JPG/PNG : orientation (tag 274) ignorée ; multipage → page 1 seulement sans le dire ; ICC ignoré (avertir)
- [ ] Filtres en `image/*` et Resizer : GIF animé → PNG figé sans le dire (note trompeuse du Resizer)

### Vidéo / audio / GIF
- [x] Video Rotator : « Instant, lossless » envoyait le fichier au service quand il échouait (WebM, matrice non réécrite)
- [x] Screen Recorder : vidéo muette sans le dire quand le son n'est pas partagé (+ micro ajouté)
- [ ] Vidéo → GIF (6 pages) : début + durée au-delà de la fin → GIF plus court sans un mot ; 90 s ramené à 60 en silence ; extracteur d'images : image précédente possible
- [ ] Audio Equalizer : aperçu sans les réglages faits avant la 1re lecture ; un AudioContext de plus à chaque lecture
- [ ] GIF to APNG : nombre de boucles du GIF non repris (boucle infinie) ; conseil SEO faux
- [ ] GIF Maker / Image to GIF : GIF animé en entrée → 1re image sans le dire
- [ ] Video Trimmer : pistes audio secondaires perdues sans le dire
- [ ] Video Merger : 1er clip à 120/240 fps ramené à 60 sans le dire

### Développeur / texte / fichiers
- [x] Code Minifier HTML : espaces entre balises supprimées (« Helloworld »), valeurs d'attributs tassées
- [x] SQL to CSV : `NOW()` tronquait la ligne ; deux tables mélangées ; NULL écrit « NULL »
- [ ] CSV to Excel .xls : au-delà de 65 536 lignes, 2 lignes relues ; cellule > 32 767 caractères = erreur brute
- [ ] Excel to CSV : EAN-13 en 4.00638E+12, 1/3 en 0.333333333, dates m/d/yy
- [ ] CSV to SQL : antislash non échappé (MySQL), identifiants non cités, VARCHAR(255)/INTEGER/DECIMAL(18,6) trompeurs
- [ ] ENV to JSON (sens JSON → .env) : grands entiers arrondis, 1.10 → 1.1
- [ ] CSV to JSON : en-têtes en double écrasés, valeurs rognées, colonnes en trop jetées
- [ ] Excel to JSON avec un .csv : 007 → 7, grands entiers arrondis, dates lues à l'américaine ; classeurs 1904
- [ ] JSON to Go/Rust/C# : 10.0 typé entier ; > int64 en float ; union sans UnmarshalJSON
- [ ] YAML to JSON : clé de fusion `<<` littérale
- [ ] TypeScript to JS : imports de types conservés (échec au chargement en ESM)
- [ ] CSV to TSV : valeur commençant par `"` non citée
- [ ] XML Formatter : `<a>`, `<b>`, `<p>` n'indentent pas
- [ ] XML to JSON : contenu mixte perdu (« Helloagain »), espaces rognés
- [ ] Text Sorter : 1.5 / 1.25 / 1.3 et nombres négatifs mal triés (la FAQ promet « par valeur »)
- [ ] File Converter : texte Windows-1252 décodé en UTF-8 (« caf� »)
- [ ] Faibles : url-encoder (« + » lu espace par défaut), unicode `\u{…}`, text-repeater NaN, duplicate-remover NFC/NFD, tar liens physiques

## B. Ajouts faisables (gain / effort) — après les résultats faux
PDF : Excel « une page par feuille », options Gotenberg (pages, PDF/A, notes PowerPoint), Split paires/impaires/par taille/par signets,
Sign date/nom/texte, Compare mots surlignés, Image to PDF format/marges. Image : compresser à X Ko, qualité et fond pour PNG/WebP/TIFF to JPG,
Resizer qualité/format, TIFF multipage en ZIP, ICO toutes tailles. Vidéo : post-traitement gifsicle (boucles, compression), Merger format
de sortie, Voice Recorder MP3/pause, métadonnées vidéo/audio supprimables, GIF Maker délai par image, Trimmer passage du milieu,
Media Player vitesse/boucle/sous-titres, Waveform taille/couleurs. Dev : Excel feuille/délimiteur/BOM, CSV to SQL dialectes,
QR Scanner zxing-wasm, CSV to JSON formes, Text Sorter options, Find & Replace options, TAR bz2/xz/zst, URL Encoder RFC 3986.

## C. Décisions du propriétaire (ajoutées au plan, E8+)
Options ConvertAPI (PDF to Word Layout, Excel/PowerPoint, PageRange, OCR) — appels de test ≈ 0,01-0,05 $ ; Compress niveaux de gris/dpi
(Railway) ; filtres vidéo réglables, xfade, GIF transparent (Railway) ; signature à plusieurs signataires (stockage + e-mails).
