# P36 — Lot dev-data — compte rendu de rédaction (16 outils, 06/10)

Ce que j'ai modifié : pour chacun des 16 outils, le bloc `<SeoContent …>` de `page.jsx`, les quatre champs de métadonnées
de `layout.tsx` et, pour 7 outils, `seo.js`. Pour ces 7 outils, le titre, la méta et la FAQ passent de `seo.js` à
`layout.tsx` / `page.jsx`, où `scripts/p36/content-verify.mjs` les lit ; `seo.js` garde le chemin, l'exemple et les liens,
avec ses commentaires d'origine. Le chemin, l'URL et `ToolSeo` ne changent pas.
Aucune chaîne d'interface, aucune logique et aucune constante n'ont été modifiées. Les fins de ligne (CRLF) sont conservées.

Les chiffres sont écrits en `${…}` à partir des constantes que la page importe déjà (`MAX_ROWS`, `MOBILE_MAX_ROWS`,
`PASTE_MAX_ROWS`, `MAX_FILE_SIZE_LABEL`, `MOBILE_MAX_FILE_SIZE_LABEL`, `MAX_FILE_BYTES`), formatés avec
`toLocaleString('en-US')`. Trois chiffres sont écrits en dur ; leur preuve est dans `docs/audit/p36/preuves/dev-data.json` :
65,536 rows, 256 columns et 32,767 characters (`csvToExcel.worker.js:75-79`).

## Contrôles (06/10)
- `node scripts/p36/content-verify.mjs --only=developer-tools/` : 57 pages, **0 échec** (C0 à C7). La part de phrases
  identiques la plus haute vaut 14,3 % et concerne une paire d'un autre lot.
- `node scripts/content-checks/instructions.mjs` : 1735 libellés cités, **0 écart**.
- `node scripts/content-checks/privacy-claims.mjs` : **0 échec**. Aucun de ces 16 outils n'envoie de données.

## Exemples exécutés
Toutes les sorties d'exemple sont produites par le code de l'outil. Le script est
`<scratchpad>/examples.mjs` (lancé avec `node examples.mjs show`), et `dd-gen.mjs` l'appelle avant d'écrire chaque page.
- **Workers** (csv-to-excel, csv-to-json, csv-to-sql, excel-to-csv, excel-to-json) : le fichier du worker est exécuté
  tel quel par `runworker.mjs`. Seuls les chemins d'import sont réécrits en chemins absolus, parce que Node ne résout pas
  `'../../../lib/csvParser'` sans extension. `self.postMessage` est capturé.
- **Fonctions de page** (csv-to-tsv `tsvField`, tsv-to-csv `parseTsv`/`csvField`, json-to-xml `findInvalidXmlName` +
  construction, json-to-toml `convert()`, toml-to-json `toJson`/`convert()`) : le texte source est découpé dans
  `page.jsx` puis évalué sans modification.
- **Options de xml-to-json** : ce sont exactement celles de `page.jsx:25-34`, appliquées à fast-xml-parser 5.11.1.
- **Bibliothèques du site** : `jsonToCsv`, `jsonToYaml`/`yamlToJson`, `sqlInsertsToCsv`, `dotenvToJson`.
- **Classeurs Excel** : les classeurs d'exemple ont été écrits par SheetJS dans le script (cellules date au format
  `yyyy-mm-dd`, formules avec leur résultat), pas par Microsoft Excel.
- **Exemples anciens** : ceux de csv-to-json et csv-to-sql sont gardés. Ils ont été réexécutés et donnent une sortie
  identique, ce que le générateur vérifie et refuse sinon. Les 5 autres exemples de `seo.js` sont remplacés.
- **Lignes de statut et avis** : la ligne « Excel file ready… », l'avis de json-to-toml et la note de env-to-json
  reprennent le gabarit de leur `page.jsx` (`:165`, `:58`, `:19`).

## Par outil
Format des lignes : titre (nombre de caractères) / méta (nombre de caractères) ; mots visibles avant → après (hors
exemple, estimés depuis le source) ; défauts de l'audit (`audit/dev-data.md`) supprimés.

- **csv-to-excel**
  - Titre (59) : « CSV to Excel Converter — XLSX or XLS with Real Number Cells ».
  - Méta (144) : « Turn a CSV file or pasted CSV into an Excel .xlsx or .xls workbook. Semicolons, decimal commas and Excel CSV encodings are read in your browser. »
  - Mots : 636 → 547 (+ exemple 56).
  - Défauts supprimés : LIBELLÉ « Convert » (devient « Convert to », qui nomme le format) ; encodage « détecté depuis les octets » (c'est désormais : UTF-8/BOM, sinon langue du navigateur) ; « never freezes » ; « we've measured » ; .tsv/.txt présentés comme acceptés ; astuce générique ; phrases communes au trio CSV.
  - Ajouts : limites .xls et cellule, limite du téléphone, Sheet1.
- **csv-to-json**
  - Titre (53) : « CSV to JSON Converter — Objects, Arrays or JSON Lines ».
  - Méta (142) : « Convert a CSV file or pasted CSV into JSON objects, arrays or JSON Lines, with the header row as keys and numbers typed. Runs in your browser. »
  - Mots : 833 → 499.
  - Défauts supprimés : « Up to 500,000 rows » sans les limites du téléphone et du collage ; les 3 formes de sortie et .jsonl n'étaient pas dites ; le collage dit plus bas que le fichier même sur téléphone (or les deux limites sont égales) ; encodage ; « never freezes » ; FORMAT .tsv ; étape générique.
  - Ajout : en-têtes en double (name_2, column_N).
- **csv-to-sql**
  - Titre (58) : « CSV to SQL — CREATE TABLE and INSERT for MySQL, SQL Server ».
  - Méta (146) : « Turn a CSV file or pasted CSV into CREATE TABLE plus one INSERT per row, quoted for PostgreSQL, SQLite, MySQL or SQL Server. Runs in your browser. »
  - Mots : 971 → 508.
  - Défauts supprimés : FAUX × 2 « names are not escaped » (about et astuce 1) ; pas d'étape pour « Database » ; limite du collage sur téléphone ; encodage ; FAQ « free » ; astuce générique.
  - Ajouts : apostrophes, NULL, types par base.
- **csv-to-tsv**
  - Titre (53) : « CSV to TSV Converter — Semicolon or Comma CSV to Tabs ».
  - Méta (145) : « Turn comma, semicolon or pipe CSV into tab-separated TSV. Open a .csv or .txt file or paste text; quoted fields stay whole. Runs in your browser. »
  - Mots : 486 → 380.
  - Défauts supprimés : encodage ; .txt accepté mais non dit ; FAQ « CSV vs TSV » ; FAQ « uploaded ».
  - Exemple remplacé : un champ entre guillemets sur deux lignes.
- **excel-to-csv**
  - Titre (60) : « Excel to CSV — Every Sheet, Comma or Semicolon, XLSX/XLS/ODS ».
  - Méta (154) : « Convert an .xlsx, .xls or .ods workbook to CSV, one file per sheet and zipped if there are several. Choose comma, semicolon, tab or pipe. In your browser. »
  - Mots : 532 → 517.
  - Défauts supprimés : FAUX « formulas' calculated results don't [transfer] » ; « comma-separated » (alors que 4 séparateurs, virgule décimale et BOM existent) ; « no button click needed » (il fallait dire que les options se règlent AVANT le choix du fichier) ; limite du téléphone absente ; « measured » ; « never freezes » ; « next to the Download button » ; vocabulaire de journal de modifications (« as before », « now ») ; FAQ communes avec excel-to-json.
- **excel-to-json**
  - Titre (53) : « Excel to JSON — Each Sheet as an Array of Row Objects ».
  - Méta (150) : « Convert an .xlsx, .xls, .ods or .csv file to JSON: one array per sheet, first row as keys, dates as ISO text and empty cells as null. In your browser. »
  - Mots : 496 → 441.
  - Défauts supprimés : FAUX « Empty cells are simply omitted » ; limite du téléphone ; « measured » ; « never freezes » ; FAQ communes.
  - Ajouts : cas .csv (Sheet1, tout en texte), doublons name_1, lignes vides ignorées.
- **json-to-csv**
  - Titre (56) : « JSON to CSV Converter — Nested Objects to Dotted Columns ».
  - Méta (142) : « Paste a JSON array or object and get CSV: nested objects become columns like address.city, arrays like tags.0. Large numbers keep every digit. »
  - Mots : 385 → 408.
  - Défauts supprimés : « built-in JSON.parse » ; FAQ « free » ; étapes génériques ; page mince.
  - Ajouts : bouton Download, messages d'erreur, null.
- **json-to-xml**
  - Titre (56) : « JSON to XML Converter — Attributes, Arrays, Escaped Text ».
  - Méta (150) : « Paste JSON and get indented XML under a root element. Arrays become repeated tags, @_ keys become attributes, and & or < are escaped. In your browser. »
  - Mots : 318 → 389.
  - Défauts supprimés : astuce « <item> … root » (la racine est `<root>`) ; astuce « validate unusual key names » (l'outil refuse ces clés) ; « no longer » ; génériques.
  - Ajouts : @_ / #text, déclaration XML, data.xml.
- **json-to-yaml**
  - Titre (52) : « JSON to YAML Converter — Exact Numbers, Safe Quoting ».
  - Méta (144) : « Paste JSON and get block-style YAML. Numbers stay as written, and strings such as yes, no or 1.10 are quoted so they stay text. In your browser. »
  - Mots : 315 → 331.
  - Défauts supprimés : « block style throughout » ({} et [] vides sont en style en ligne) ; astuce « unquoted yes/no » (l'outil met ces mots entre apostrophes) ; génériques.
- **json-to-toml**
  - Titre (52) : « JSON to TOML Converter — Tables and Arrays of Tables ».
  - Méta (146) : « Paste a JSON object and get TOML: nested objects become [tables], arrays of objects [[tables]], null keys are left out. Converted in your browser. »
  - Mots : 426 → 409.
  - Défauts supprimés : FAUX × 3 sur les dates ISO « typed » (about, astuce 3, méta) ; génériques.
  - Ajouts : grands entiers écrits en texte avec un avis, null.
- **toml-to-json**
  - Titre (58) : « TOML to JSON Converter — Cargo.toml, pyproject.toml & More ».
  - Méta (141) : « Paste TOML and get indented JSON: tables become nested objects, dates ISO strings, and large integers keep every digit. Runs in your browser. »
  - Mots : 401 → 383.
  - Défauts supprimés : FAUX « only a 'Copy' button » ; FAUX « lose precision beyond 2^53 » ; génériques.
  - Ajouts : millisecondes ajoutées aux dates, décalage conservé, inf/nan → null.
- **tsv-to-csv**
  - Titre (55) : « TSV to CSV Converter — Paste Cells from Excel or Sheets ».
  - Méta (149) : « Paste tab-separated text, such as cells copied from Excel or Google Sheets, and get CSV with commas, quotes and line breaks handled. In your browser. »
  - Mots : 398 → 325.
  - Défauts supprimés : FAQ « TSV vs CSV » ; FAQ « uploaded » ; étapes génériques.
  - Ajouts : champs entre guillemets à la manière d'Excel, CRLF ; la page n'affiche aucune erreur, donc aucune remontée.
- **xml-to-json**
  - Titre (58) : « XML to JSON Converter — Attributes Kept, Leading Zeros Too ».
  - Méta (151) : « Paste XML and get JSON with attributes as @_ keys, repeated tags as arrays and every value kept as text, so 0612 and 1.10 stay intact. In your browser. »
  - Mots : 368 → 358.
  - Défauts supprimés : génériques ; page mince.
  - Ajouts : texte mêlé aux balises (avec la note), message de validation réel, déclaration retirée.
- **yaml-to-json**
  - Titre (60) : « YAML to JSON Converter — Anchors, Merge Keys, Many Documents ».
  - Méta (154) : « Paste YAML, such as a Kubernetes or Docker Compose file, and get JSON. Anchors, merge keys and --- documents are handled; yes stays text. In your browser. »
  - Mots : 297 → 375.
  - Défauts supprimés : FAUX « Values are never silently altered » (1.10 → 1.1 et 0012 → 12, maintenant dits) ; « Full YAML » (les étiquettes personnalisées sont refusées, désormais dit) ; génériques ; page mince.
- **sql-to-csv**
  - Titre (52) : « SQL to CSV Converter — mysqldump INSERTs to CSV Rows ».
  - Méta (145) : « Paste INSERT statements, mysqldump output included, and get CSV: multi-row VALUES, quoted names and escaped quotes are read, one table at a time. »
  - Mots : 583 → 395.
  - Défauts supprimés : FAUX « NULL is written as the word NULL » ; astuce « first INSERT representative » (l'outil s'arrête si les listes diffèrent) ; « the SQL never leaves your browser » (la confidentialité dit maintenant que les noms de tables et de colonnes peuvent partir dans un message d'erreur) ; FAQ « free ».
  - Ajouts : choix de table « Convert table ».
- **env-to-json**
  - Titre (54) : « .env to JSON Converter — dotenv Rules, Both Directions ».
  - Méta (139) : « Paste a .env file to get a JSON object, or a JSON object to get .env lines. Parsed like dotenv, with optional types and variable expansion. »
  - Mots : 467 → 416.
  - Défauts supprimés : « flat JSON object » ; « parser used by Node.js, Next.js and Vite » ; génériques.
  - Ajouts : expansion des valeurs entre apostrophes (vérifiée), nom du fichier téléchargé.

## Chaînes d'interface modifiées
Aucune.

## Défauts de code laissés tels quels (consigne : ne pas corriger) — à planifier
1. **env-to-json** : le fichier téléchargé s'appelle toujours `env.json`, même quand la sortie est du .env
   (`page.jsx`, `<TextDownload … name="env.json" />`). La page le dit honnêtement dans l'étape 4 ; il faudra retirer
   cette phrase une fois le nom corrigé.
2. **excel-to-csv** : changer « Separator », « Decimal comma » ou « Add a UTF-8 BOM » après le choix du fichier ne
   relance pas la conversion. La page dit de régler ces options d'abord.
3. **Toutes les pages sauf tsv-to-csv** : un message d'erreur affiché part, nettoyé, vers `/api/report-error`. Pour
   sql-to-csv, les noms de tables et de colonnes y restent en clair. C'est dit dans la section « Where your file is
   processed » de chaque page. Masquer ces noms dans le code est une décision du propriétaire.

## Points laissés de côté (non vérifiables ou non utiles)
- Vitesse, temps de conversion, mémoire : non écrits. Les mesures n'existent qu'en commentaire dans `config.js`.
- Le comportement de dotenv-expand pour les valeurs entre apostrophes n'a pas été comparé au paquet officiel. La page
  décrit seulement ce que fait l'outil (expansion, vérifiée par exécution).
- Le passage par ZIP d'excel-to-csv n'a pas pu être exécuté sous Node : le chargement de jszip échoue hors navigateur.
  Les affirmations sur le ZIP viennent de la lecture du code (`excelToCsv.worker.js:17-34,125-145`), pas d'un exemple.

## Corrections après relecture (06/10)
Les 43 défauts de `relecture/dev-data.md` ont tous été vérifiés dans le code et sont tous acceptés : aucun n'est contesté.
Les textes sont dans `<scratchpad>/dd-fix3.mjs`, et la régénération se fait par `dd-gen.mjs`, qui réexécute les
exemples. Aucune chaîne d'interface n'a été modifiée. Les défauts de code restent à planifier ; ils ne sont pas corrigés.
1. csv-to-excel, limite de 20,000 lignes : « phones and tablets » devient « phones, iPhone and iPad ». Une tablette Android sous Chrome obtient la limite de l'ordinateur (`isMobileDevice.js:5-9`).
2. csv-to-json, limite de 70,000 lignes : même correction dans la ligne de spécifications et dans la FAQ.
3. csv-to-json, FAQ : la question devient « Do numeric columns become JSON numbers? », pour ne plus être identique à celle de xml-to-json.
4. csv-to-json et csv-to-sql, phrases communes : les étapes 2-3 et la ligne « Input » de csv-to-sql sont reformulées.
5. csv-to-sql, types de colonnes : BIGINT seulement de 10 à 15 chiffres. Au-delà de 15 chiffres significatifs, ou avec un exposant, la colonne devient du texte (vérifié : `csvEncoding.js:134,145`). Les mentions DECIMAL pour entiers longs et type flottant sont retirées.
6. csv-to-sql, même FAQ : la question devient « Are the column types sized from the data? » et la réponse commence par « Yes. ».
7. csv-to-sql : « VARCHAR (NVARCHAR on SQL Server) » dans la FAQ, et « VARCHAR or NVARCHAR » dans l'astuce sur les dates.
8. csv-to-sql, limite de 65,000 lignes : « on phones, iPhone and iPad ».
9. csv-to-sql : phrases reformulées (voir n° 4).
10. csv-to-tsv, ligne « Output » : « one row per line, except a quoted value that holds a line break ».
11. csv-to-tsv, confidentialité : décrit maintenant le rapport réel. Il part aussi pour une erreur non affichée (`ToolErrorWatch`) et contient le texte nettoyé, le nom de l'outil, le navigateur et sa version (`reportError.js:143-154`).
12. excel-to-csv, formats de nombre : un nombre avec un format propre (pourcentage, montant en dollars) est écrit comme Excel l'affiche ; seuls couleurs, polices et commentaires disparaissent. Vérifié par exécution : `50%,"$1,234.50"`.
13. excel-to-csv, noms de fichiers du ZIP : « such as < > | or a double quote » (`excelToCsv.worker.js:18`).
14. excel-to-csv, limites 30 MB / 50,000 lignes : « on phones, iPhone and iPad ».
15. excel-to-json, About : « row objects whose keys come from the sheet's first row ».
16. excel-to-json, limites 30 MB / 50,000 lignes : « on phones, iPhone and iPad ».
17. json-to-csv, ordre des colonnes : il est précisé que les clés qui sont des nombres entiers passent d'abord (`Object.keys`, `jsonToCsv.js:18`). Ce comportement du code est noté comme défaut à planifier.
18. json-to-csv, FAQ 4 : « one row per line; a value holding a line break stays quoted over several lines ».
19. json-to-csv, About : la phrase générique est remplacée par « The JSON is read and the CSV written inside your browser tab. ».
20. json-to-csv : l'étape de téléchargement et la ligne « Output » sont reformulées pour ne plus être identiques à sql-to-csv et tsv-to-csv.
21. json-to-xml, exemple : la sortie se termine maintenant par le saut de ligne final réel.
22. json-to-xml, FAQ sur les nombres : la question devient « Are numbers written exactly as in the JSON? », avec l'exemple `<price>12.50</price>`.
23. json-to-yaml, ligne « Key order » : « as in the JSON, except keys that are whole numbers, which come first ».
24. json-to-yaml, About : « text containing a colon followed by a space » (vérifié : `a:b` reste sans guillemets).
25. json-to-yaml, exemple : saut de ligne final réel conservé.
26. json-to-yaml, FAQ : la question devient « Do numbers keep their exact digits? ».
27. json-to-toml, exemple : la légende précise que la dernière ligne est l'avis affiché sous les boîtes, pas du TOML ; le saut de ligne final réel est conservé.
28. json-to-toml, confidentialité : rapport d'erreur décrit exactement, qu'un message soit affiché ou non.
29. toml-to-json, About : « The text you paste does not leave your browser. » ; la confidentialité décrit le rapport (échec d'analyse ou de copie).
30. toml-to-json : l'étape de téléchargement et la ligne « Output » sont reformulées pour ne plus être identiques à xml-to-json et yaml-to-json.
31. tsv-to-csv, confidentialité : la phrase « reports none » est retirée. Un échec inattendu (copie refusée) est signalé avec le nom de l'outil et la version du navigateur, sans les données.
32. tsv-to-csv, exemple : les lignes sont séparées par CRLF comme dans l'outil (`page.jsx:46`) ; le saut de ligne à l'intérieur de « two lines » reste LF.
33. tsv-to-csv : l'étape de téléchargement est reformulée.
34. xml-to-json, About : la position n'est promise que pour une balise fermante mal appariée (`page.jsx:23` n'affiche que `err.msg`). L'affichage de la ligne et de la colonne est à planifier dans le code.
35. xml-to-json, FAQ : la question n'est plus partagée (corrigé par le n° 3).
36. xml-to-json : l'étape de téléchargement et la ligne « Output » sont reformulées.
37. yaml-to-json, About : la phrase générique est remplacée par « js-yaml does all of this inside your browser tab. ».
38. yaml-to-json, étape 3 : ligne et colonne données « when the YAML syntax is wrong » (le refus de .inf ou .nan n'en a pas).
39. yaml-to-json, About : « using the YAML 1.2 rules for booleans and null », parce que `1_000` est lu comme un entier.
40. yaml-to-json : l'étape de téléchargement et la ligne « Output » sont reformulées.
41. sql-to-csv, confidentialité : « One exception » est retiré ; les erreurs, affichées ou non, sont signalées avec le nom de l'outil et la version du navigateur ; les noms de tables et de colonnes restent signalés.
42. sql-to-csv : l'étape de téléchargement et la ligne « Output » sont reformulées.
43. env-to-json, FAQ 4 : une valeur qui mêle ' " \ et ` est refusée (`dotenv.js:99`).
Autres corrections faites au passage (consignes 06/10) : les fins génériques « The whole conversion runs in your browser » (csv-to-excel) et « it works in your browser » (sql-to-csv) sont remplacées par des phrases propres à l'outil. Les 16 textes de confidentialité décrivent maintenant le contenu exact d'un rapport d'erreur.
Contrôles après corrections : `content-verify --only=developer-tools/`, 0 échec sur mes 16 pages (les 2 échecs C3 restants sont sur hash-generator, d'un autre lot) ; `instructions.mjs`, 0 écart ; `privacy-claims.mjs`, 0 échec.
Chaînes d'interface modifiées (texte seulement, ni logique ni libellé de bouton ; consigne ajoutée le 06/10) :
- csv-to-excel, csv-to-json, csv-to-sql, excel-to-csv, excel-to-json, note sous le H1 :
  - avant : « Conversion runs in the background — this tab stays responsive. »
  - après : « The conversion runs in a background worker; the Cancel button stops it. »
  - Le worker et le bouton Cancel existent (`page.jsx`, `new Worker` et bouton Cancel). « stays responsive » n'était pas vérifié.
- Les mêmes 5 pages, estimation de durée :
  - avant : « Estimated conversion time: {timeEstimate} »
  - après : « Estimate from our tests on a desktop computer: {timeEstimate} »
  - Les seuils viennent de mesures sous Node multipliées par 1,55 (commentaires dans `page.jsx` et `config.js`), sans rapport dans `docs/audit/`. La phrase dit maintenant d'où vient le chiffre. La valeur affichée (« a few seconds » / « about N seconds ») n'est pas modifiée, car c'est de la logique.
- Aucune autre chaîne d'interface des 16 pages ne contient d'affirmation non vérifiée.
- Contrôles relancés après ces changements : 0 échec pour mes pages ; `instructions.mjs`, 0 écart ; `privacy-claims.mjs`, 0 échec.

## Corrections après deuxième passe (06/10)
- 2.1 json-to-yaml, FAQ 2 : la réponse commence par « Yes. » (le code garde les chiffres exacts, `yamlJson.js:46-51`).
- 2.2 json-to-toml, About : « Everything runs in your browser with smol-toml. » devient « smol-toml writes the TOML inside your browser tab. ».
- 2.3 json-to-toml, confidentialité : « only » est retiré et le type d'erreur est ajouté au contenu du rapport (`reportError.js:152`).
- 2.4 xml-to-json, About : « The work runs in your browser. » devient « fast-xml-parser does the parsing inside your browser tab. ».
- 2.5 sql-to-csv, ligne « Output » : « header row from the column list (column_1, column_2… without one) » (`sqlToCsv.js:95`).
- C6, phrases génériques dans les métas, remplacées (les longueurs restent entre 110 et 155) :
  - csv-to-json : « Runs in your browser. » devient « …, in a background worker. » (144) ;
  - csv-to-sql : « Runs in your browser. » devient « …, with no database connection. » (153) ;
  - csv-to-tsv : « Runs in your browser. » devient « … and values unchanged. » (144) ;
  - toml-to-json : « Runs in your browser. » devient « Parsed by smol-toml. » (140) ;
  - json-to-toml : « Converted in your browser. » devient « … and big integers kept. » (141).
- Contrôles : `content-verify --only=developer-tools/`, 0 échec sur mes 16 pages (les 3 échecs C6 restants appartiennent à d'autres lots) ; `instructions.mjs`, 0 écart ; `privacy-claims.mjs`, 0 échec.
