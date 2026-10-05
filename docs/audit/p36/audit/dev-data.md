# P36 — Lot 2 — audit « dev-data » (16 outils) — ce qui doit disparaître

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

## csv-to-excel

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

## csv-to-json

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

## csv-to-sql

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

## csv-to-tsv

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| csv-to-tsv | FAQ 3 | « The tool detects this from the file's bytes and decodes it accordingly » | TROMPEUR | `csvEncoding.js:86-93` (repli = langue du navigateur) ; `page.jsx:53` ; `seo.js:4` | Comme csv-to-excel |
| csv-to-tsv | interface + étape 1 | « Choose a .csv file » / « Click or drop a .csv file here » | FORMAT | `accept=".csv,.txt,text/csv"` : les `.txt` sont aussi acceptés (`page.jsx:85`), jamais dit (`page.jsx:84,113`) | « a .csv or .txt file » |
| csv-to-tsv | FAQ 1 | « What's the difference between CSV and TSV? » | GÉNÉRIQUE | Même question sur tsv-to-csv (`tsv-to-csv/seo.js:2`) ; définition encyclopédique ; `seo.js:2` | Remplacer par un fait propre (valeur commençant par un guillemet mise entre guillemets, `page.jsx:27`) |
| csv-to-tsv | FAQ 4 | « No, the conversion happens entirely in your browser. » | GÉNÉRIQUE | Réponse identique sur 8 pages du lot (`unicite-avant.json`) ; `seo.js:5` | Une phrase propre : le fichier est lu en entier dans la page (`page.jsx:52-57`) |

## excel-to-csv

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

## excel-to-json

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| excel-to-json | astuce 2 | « Empty cells are simply omitted from that row's object rather than appearing as null » | FAUX | `sheet_to_json(…, { defval: null })` : une cellule vide garde sa clé avec `null` (`excelToJson.worker.js:67-69`) ; l'about dit l'inverse (`page.jsx:190`) ; `page.jsx:206` | Supprimer ; dire « empty cells keep their key with null » |
| excel-to-json | FAQ 4 + interface | « capped at 150,000 rows … and 90 MB on desktop » | TROMPEUR | Téléphone/tablette : 50,000 lignes et 30 MB (`config.js:14-16`, `page.jsx:71-74`) jamais dits dans le HTML servi ; `page.jsx:161,201` | Dire les deux limites |
| excel-to-json | FAQ 4 | « measured to convert reliably » | INVÉRIFIABLE | Mesures en commentaire seulement (`config.js:1-9`) ; `page.jsx:201` | Retirer ou citer un rapport |
| excel-to-json | FAQ 2 | « so the page never freezes » | INVÉRIFIABLE | `page.jsx:199` | Retirer « never » |
| excel-to-json | toute la page | (absence) | MINCE | Rien sur le cas .csv : clé de feuille `Sheet1`, toutes les valeurs lues comme texte (`excelToJson.worker.js:51-52`), virgule, point-virgule et tabulation reconnus ; lignes entièrement vides ignorées ; en-têtes en double renommés `name_1` (vérifié en exécutant xlsx 0.18.5 avec les options de `excelToJson.worker.js:52,69`) ; feuilles masquées incluses (`SheetNames`, `:54,65`) | Ajouter ces faits |
| excel-to-json | FAQ 1, FAQ 2 (question), FAQ 4 | (mêmes que excel-to-csv) | GÉNÉRIQUE | `unicite-avant.json` ; `page.jsx:198-201` | Réécrire |

## json-to-csv

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| json-to-csv | méta | « using the browser's built-in JSON.parse » | TROMPEUR | `JSON.parse` ne sert que de validateur ; les valeurs sont lues par l'analyseur sans perte du site, pour ne pas arrondir les grands nombres (`app/lib/jsonLossless.js:9-12,37-39`, `app/lib/jsonToCsv.js:11,36`) ; `layout.tsx:6` | « numbers written exactly as in the JSON (a 20-digit id is not rounded) » |
| json-to-csv | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | `unicite-avant.json` ; `page.jsx:48` | Supprimer |
| json-to-csv | étapes 3-4 | « Review the result in the output box. » ; « Click 'Copy' to copy it to your clipboard. » | GÉNÉRIQUE | Identiques sur tsv-to-csv (`unicite-avant.json`) ; `page.jsx:44-45` | Réécrire avec le bouton Download |
| json-to-csv | toute la page | (absence) | MINCE | Interface 14 mots, pas d'exemple ; rien sur le bouton « Download » de `data.csv` (`page.jsx:29`, `FileDownload.jsx:211`) ; messages d'erreur « The JSON must be an array of objects, or a single object. » / « The JSON array is empty… » (`jsonToCsv.js:40-41`) et erreur de syntaxe du navigateur affichée telle quelle (`page.jsx:18`) ; `null` → cellule vide (`jsonToCsv.js:29`) ; valeur commençant/finissant par une espace mise entre guillemets (`:31`) ; au-delà de 1,000,000 caractères la zone affiche un extrait (`app/components/TextArea.jsx:17-18`) | Ajouter un exemple et ces faits |

## json-to-xml

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| json-to-xml | astuce 1 | « A top-level JSON array is wrapped in a generic <item> element per entry, since XML documents need exactly one root element. » | TROMPEUR | Toute sortie est enveloppée dans un élément **`<root>`** (`page.jsx:50-51`), précédée de `<?xml version="1.0" encoding="UTF-8"?>` (`:52`) ; un tableau donne `<root><item>…</item><item>…</item></root>` (vérifié avec fast-xml-parser 5.11.1). La racine n'est jamais nommée dans le texte ; `page.jsx:90` | « The output always has a <root> element; a top-level array becomes one <item> per entry inside it » |
| json-to-xml | astuce 4 | « Validate the output … especially for very unusual key names (XML tag names have their own rules, e.g. they can't start with a digit). » | TROMPEUR | Une clé invalide n'est pas écrite : l'outil s'arrête avec « The key "…" can't be an XML element name: … Rename it and convert again. » (`page.jsx:11-26,39-40`) ; `page.jsx:93` | Dire ce refus et la règle (lettre ou `_` d'abord, puis lettres, chiffres, `_ . - :`) |
| json-to-xml | astuce 3 | « Special characters in text values no longer need manual escaping » | MINCE | « no longer » = journal de modifications ; redit la FAQ 3 ; `page.jsx:92` | Supprimer |
| json-to-xml | FAQ 1, étapes 1 et 4 | « Yes, it's completely free with no signup required. » ; « Paste your JSON into the input box. » ; « Click 'Copy' to copy the result to your clipboard. » | GÉNÉRIQUE | `unicite-avant.json` (json-to-yaml, json-to-toml) ; `page.jsx:78,81,84` | Réécrire |
| json-to-xml | toute la page | (absence) | MINCE | Rien sur : `<root>` et la déclaration XML (`page.jsx:51-52`) ; clés `@_nom` → attributs et `#text` → texte (`page.jsx:8-10,45`) ; `null` → élément vide `<n/>` (vérifié) ; nombres gardés exactement (`page.jsx:34-38`) ; bouton Download `data.xml` (`page.jsx:65`) ; message « Invalid JSON: … » (`page.jsx:54`) ; pas d'exemple | Ajouter |

## json-to-yaml

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| json-to-yaml | astuce 3 | « The output uses YAML's block style throughout » | TROMPEUR | Un tableau ou objet vide est écrit `[]` / `{}` (style en ligne) : vérifié avec `jsonToYaml` (`app/lib/yamlJson.js:46-51`, js-yaml 4.1.1) ; `page.jsx:54` | « block style, except empty lists and objects written [] and {} » |
| json-to-yaml | astuce 4 | « some YAML consumers interpret edge cases (like unquoted 'yes'/'no') differently » | TROMPEUR | L'outil écrit déjà `'yes'`, `'no'`, `'on'`, `'off'`, `'y'`, `'null'`, `'123'`, `'2024-01-01'` **entre apostrophes** (vérifié, `yamlJson.js:50`) : la sortie ne contient pas ces valeurs nues ; `page.jsx:55` | « strings such as yes, no, on, off are written in quotes, so YAML 1.1 readers keep them as text » |
| json-to-yaml | FAQ 1, étapes 1 et 4 | « Yes, it's completely free with no signup required. » ; « Paste your JSON into the input box. » ; « Click 'Copy' to copy the result to your clipboard. » | GÉNÉRIQUE | `unicite-avant.json` ; `page.jsx:40,43,46` | Réécrire |
| json-to-yaml | toute la page | (absence) | MINCE | Pas d'exemple ; rien sur le bouton Download `data.yaml` (`page.jsx:27`), le message « Invalid JSON: … » (`page.jsx:16`), l'ordre des clés gardé, les grands nombres (dit dans l'about seulement) | Ajouter un exemple et ces faits |

## json-to-toml

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| json-to-toml | about | « numbers, booleans, and ISO date strings are typed correctly rather than left as quoted text » | FAUX | Aucune chaîne n'est transformée en date (`page.jsx:22-34`) ; smol-toml 1.8.0 écrit `"2024-01-15T10:00:00Z"` **entre guillemets** (vérifié en exécutant `stringify`) ; `page.jsx:67` | « date strings stay quoted strings (JSON has no date type) » |
| json-to-toml | astuce 3 | « ISO 8601 date strings in your JSON convert to TOML's native date-time type automatically. » | FAUX | Même preuve ; `page.jsx:80` | Supprimer |
| json-to-toml | méta | « numbers, booleans and dates keep their types » | FAUX | Même preuve (dates) ; en plus un nombre JSON `1.0` devient l'entier TOML `1` (vérifié : `parseJsonLossless` → `Number` `page.jsx:25-27`, smol-toml écrit `1`) ; `seo.js:20` | « numbers and booleans keep their types » |
| json-to-toml | FAQ 1, FAQ 6, étape 4, astuce 4 | « Yes, it's completely free with no signup required. » ; « No, conversion happens entirely in your browser. » ; « Click 'Copy' to copy the result to your clipboard. » ; « Always validate the output with a TOML linter or parser… » | GÉNÉRIQUE | `unicite-avant.json` ; `seo.js:2,7`, `page.jsx:72,81` | Remplacer par : entiers au-delà de 9,223,372,036,854,775,807 et flottants au-delà d'un double écrits en texte avec un avis (`page.jsx:21-26,58`) ; bouton Download `data.toml` (`:55`) |

## toml-to-json

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| toml-to-json | FAQ 4 | « Can I download the JSON as a file? » — « No, there's only a 'Copy' button » | FAUX | Bouton Download du fichier `data.json` (`page.jsx:43`, `TextDownload` → `FileDownload.jsx:211`) ; `seo.js:5` | « Yes — Download saves data.json, Copy copies the text » |
| toml-to-json | astuce 4 | « Review the output for very large integers — JSON numbers lose precision beyond 2^53, same limitation as any other JSON tool. » | FAUX | `parse(input, { integersAsBigInt: 'asNeeded' })` puis écriture chiffre pour chiffre (`page.jsx:18,27`) : `9007199254740993` sort intact (vérifié) ; `page.jsx:69` | « integers of any size up to 64 bits are written digit for digit » |
| toml-to-json | FAQ 1, étape 2 | « Yes, it's completely free with no signup required. » ; « Click 'Convert' to parse it into JSON. » | GÉNÉRIQUE | `unicite-avant.json` ; `seo.js:2`, `page.jsx:58` | Remplacer par : `inf` / `nan` écrits `null` avec un avis (`page.jsx:19,30`) ; heures locales écrites `07:32:00.000` (vérifié) |

## tsv-to-csv

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| tsv-to-csv | FAQ 1 | « What's the difference between TSV and CSV? » | GÉNÉRIQUE | Même question sur csv-to-tsv ; `seo.js:2` | Remplacer : champs entre guillemets d'un export Excel (tabulations, retours à la ligne) lus comme une seule cellule (`page.jsx:22-45`) ; lignes de sortie terminées par CRLF (`:46`) |
| tsv-to-csv | FAQ 3 | « No, the conversion happens entirely in your browser. » | GÉNÉRIQUE | `unicite-avant.json` ; `seo.js:4` | Fusionner dans une phrase propre |
| tsv-to-csv | étapes 3-4 | « Review the result in the output box. » ; « Click 'Copy' to copy it to your clipboard. » | GÉNÉRIQUE | Identiques sur json-to-csv ; `page.jsx:70-71` ; le bouton Download `data.csv` (`page.jsx:56`) manque aux étapes | Réécrire avec Download |

## xml-to-json

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| xml-to-json | FAQ 1, étape 2, astuce 4 | « Yes, completely free with no registration required. » ; « Click 'Convert' to parse it into JSON. » ; « Copy the result or download it as a file; nothing is saved on a server, and leaving the page before either asks first. » | GÉNÉRIQUE | Identiques sur yaml-to-json / toml-to-json / tsv-to-csv (`unicite-avant.json`) ; `page.jsx:74,79,89` | Réécrire |
| xml-to-json | toute la page | (absence) | MINCE | Pas d'exemple ; rien sur : déclaration `<?xml …?>` retirée (`page.jsx:29`) ; texte mêlé aux balises (`<p>Hello <b>world</b> again</p>`) → parties jointes dans `#text` avec un avis (`page.jsx:38-43`) ; CDATA fusionné dans le texte, élément vide `<e/>` → `""` (vérifié) ; nom du fichier `data.json` (`page.jsx:59`) | Ajouter un exemple et ces faits |

## yaml-to-json

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| yaml-to-json | about | « Values are never silently altered » | FAUX | Seuls les **entiers** sont gardés exacts (`yamlJson.js:53-64`) ; les flottants passent par `yaml.types.float` (`:69`) : `version: 1.10` → `1.1`, `3.141592653589793238` → `3.141592653589793`, `1e3` → `1000`, et `0012` → `12` (vérifié en exécutant `yamlToJson`) ; `page.jsx:38` | « integers keep every digit; decimals are written as JSON numbers (1.10 → 1.1): quote a version number to keep it as text » |
| yaml-to-json | titre | « Convert Full YAML (Nested, Lists) » | TROMPEUR | Schéma = noyau YAML 1.2 sans étiquettes explicites (`yamlJson.js:66-71`, `explicit: []`) : `!Ref` / `!Sub` (CloudFormation), `!!binary`, `!!timestamp` sont refusés avec « Invalid YAML: unknown tag … » (vérifié) ; `layout.tsx:5` | Retirer « Full » ; dire les étiquettes non prises en charge |
| yaml-to-json | FAQ 1, FAQ 4, étapes 2 et 4 | « Yes, completely free with no registration required. » ; « No, conversion happens entirely in your browser. » ; « Click 'Convert' to parse it into JSON. » ; « Click 'Copy' to copy the JSON result. » | GÉNÉRIQUE | `unicite-avant.json` ; `page.jsx:41,43,46,49` | Réécrire |
| yaml-to-json | toute la page | (absence) | MINCE | Pas d'exemple ; rien sur : clés de fusion `<<: *base` (docker-compose, GitLab CI) prises en charge (`yamlJson.js:68-69`) ; `yes`/`no`/`on`/`off` restent du texte (YAML 1.2, vérifié) — essentiel pour Ansible / Kubernetes ; bouton Download `data.json` (`page.jsx:27`) | Ajouter |

## sql-to-csv

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| sql-to-csv | FAQ 6 | « NULL is written as the word NULL in the CSV, so you can tell it apart from an empty string. » | FAUX | `if (/^NULL$/i.test(t)) return '';` — NULL devient un **champ vide** (`sqlToCsv.js:56`) ; vérifié : `(NULL, '')` → `,` ; `seo.js:19` | « NULL becomes an empty field (like an empty string) » |
| sql-to-csv | astuce 3 | « Headers come from the column list in the first matching INSERT statement — make sure it's representative of the rest. » | TROMPEUR | Si un INSERT suivant liste d'autres colonnes ou un autre ordre, l'outil s'arrête : « The INSERT statements for … list their columns in different orders or sets … » (`sqlToCsv.js:98-99`) ; `page.jsx:55` | Dire ce contrôle |
| sql-to-csv | étapes 1-4 | (aucune étape pour plusieurs tables) | MINCE | Un dump qui insère dans plusieurs tables affiche « This SQL inserts into N tables (…); a CSV holds one table. Choose the table to convert. » et un bouton « Convert table <nom> » par table (`sqlToCsv.js:76-77`, `page.jsx:33`) ; jamais dit ; étapes `page.jsx:43-48` | Ajouter l'étape |
| sql-to-csv | FAQ 8 | « and the SQL never leaves your browser » | TROMPEUR | Le message d'erreur affiché est envoyé à `/api/report-error` (`useToolError.js:28-29`) ; les noms de tables et de colonnes y figurent sans guillemets (`sqlToCsv.js:77,99`), donc non masqués par le nettoyage (`reportError.js:115-117` ne masque que le texte entre guillemets et les longs nombres) | « your SQL is not uploaded; if an error appears, its message (which can name tables or columns) is reported to us » — ou masquer ces noms dans le code (décision propriétaire) |
| sql-to-csv | FAQ 8 | « Yes, it's completely free with no signup required » | GÉNÉRIQUE | `unicite-avant.json` ; `seo.js:21` | Supprimer |

## env-to-json

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| env-to-json | méta | « can convert a flat JSON object back into .env lines » | TROMPEUR | Un objet ou tableau imbriqué est accepté et écrit en texte JSON (`app/lib/dotenv.js:85-91`) ; seul un tableau / une valeur au premier niveau est refusé (`:104`) ; `layout.tsx:6` | « a JSON object (nested values written as JSON text) » |
| env-to-json | about | « dotenv, the parser used by Node.js, Next.js and Vite » | INVÉRIFIABLE | Le dépôt prouve l'égalité avec `dotenv.parse` / `dotenv-expand` (`docs/audit/RAPPORT-qualite-29-09.md:51,136`), pas qui utilise dotenv ; `page.jsx:54` | « follows the rules of the dotenv library (checked against dotenv.parse) » |
| env-to-json | FAQ 1, FAQ 5, étape 4 | « Yes, it's completely free with no signup required. » ; « No, parsing and conversion happen entirely in your browser. » ; « Click 'Copy' to copy the result. » | GÉNÉRIQUE | `unicite-avant.json` ; `page.jsx:59,62,66` | Remplacer : bouton Download (`page.jsx:37`), lignes ignorées listées par numéro (`page.jsx:19`), messages d'erreur JSON → .env (`dotenv.js:99,104,107`) |

## Observation transversale (hors décompte, à arbitrer par le propriétaire)

Les 16 pages disent « nothing is uploaded / never uploaded ». C'est vrai pour le fichier et le texte. Mais tout message
d'erreur affiché part, nettoyé, à `/api/report-error` (`app/lib/useToolError.js:28-29,47`) ; le nettoyage
(`app/lib/reportError.js:72-120`) masque chemins, noms de fichier, URL, courriels, texte entre guillemets et nombres de
7 chiffres ou plus, pas les mots nus. Cas réels : noms de tables / colonnes (sql-to-csv, compté ci-dessus), nom d'une
étiquette YAML inconnue (`unknown tag !<!Ref>`, yaml-to-json). Il faut soit le dire une fois par page, soit le masquer
dans le code.

## Synthèse du lot dev-data (16 outils lus)

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
