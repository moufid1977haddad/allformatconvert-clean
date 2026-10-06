# P36 — contrôle n° 2 : relecture indépendante, lot « dev-code » (18 pages, developer-tools)

Réviseur : dev-code (je n'ai écrit aucune de ces pages). Date : 2026-10-05. Branche lue : `p36` (arbre de travail).
Méthode : j'ai lu le texte (`SeoContent` dans `page.jsx`, `metadata` dans `layout.tsx`) et le code de chaque outil :
`app/lib/jsonCodegen.js`, `jsonToPhp.js`, `jsonText.js`, `jsonLossless.js`, `codeTools.js`, `codeFormat.js`, `htmlMinify.js`,
`useToolError.js`, `reportError.js`, `components/FileDownload.jsx`, `components/TextArea.jsx`, et la fonction
`splitXmlTags` de `xml-formatter/page.jsx`. Ensuite j'ai lancé les vrais moteurs dans Node 24 (quicktype-core 26.0.0,
sucrase 3.35.1, sass 1.105.0, prettier 3.9.9 avec @prettier/plugin-xml 3.4.2, sql-formatter 15.9.0, terser 5.51.2,
csso 5.0.5, js-beautify 2.0.3, fast-xml-parser 5.11.1), avec les options de chaque page.

**Exemples (point 7)** : les 18 exemples, relancés avec le moteur et les options de leur page, donnent exactement la sortie
affichée. Seule différence : `jsonToCode` (C#, Go, Python, Rust, TypeScript), `jsonToPhpArray` et Prettier (Code
Formatter, GraphQL) ajoutent un saut de ligne final que l'exemple n'a pas. Ce saut ne se voit pas : je ne le compte pas
comme défaut. Les deux défauts du point 7 portent sur les **légendes** (`caption`).

Contrôles automatiques relancés (lecture seule) : `content-verify --only=developer-tools/` donne 0 échec (part maximale de
phrases identiques 14,3 %), `instructions.mjs` 0 écart et `privacy-claims.mjs` 0 échec. Ils ne voient aucun des défauts
ci-dessous.

| Page | Endroit | Phrase (citation courte) | Problème | Preuve (fichier:ligne ou calcul) | Correction proposée |
|---|---|---|---|---|---|
| json-to-csharp | About (description) | « It targets System.Text.Json only: no Newtonsoft attributes, no records, no converters. » | **(1) Faux** quand une valeur change de type (`{"v":[1,"x"]}`, ou une clé tantôt nombre tantôt texte). quicktype génère alors une `partial struct V` (Integer/String), une classe `Converter` avec `JsonSerializerOptions`, `VConverter`, `DateOnlyConverter`, `TimeOnlyConverter` et `IsoDateTimeOffsetConverter`, soit environ 150 lignes de convertisseurs. | `app/lib/jsonCodegen.js:21` (`features: 'attributes-only'`). Exécution `jsonToCode('{"v":[1,"x"]}','csharp')` : sortie avec `internal static class Converter` et 4 convertisseurs | « …no records. When a value has two types, such as a number in one item and a string in another, the output also contains a union struct and the JsonConverter classes it needs. » |
| json-to-csharp | FAQ 2 | « Will the classes deserialize my JSON as they are? » « Yes, with JsonSerializer.Deserialize… » | **(1) Faux** dans le même cas : la struct d'union n'a pas d'attribut `[JsonConverter]`. Un `JsonSerializer.Deserialize<Root>(json)` sans `Converter.Settings` ne sait pas lire `V` (une struct à champs publics, que System.Text.Json ignore par défaut). | Même exécution que ci-dessus : `public partial struct V { public long? Integer; public string? String; … }`, sans attribut | « Yes, when every key keeps one type: … When a value mixes types, pass Converter.Settings, which the output also contains, as the second argument. » |
| json-to-csharp | specs « Types » | « long, double, bool, string and arrays (T[]); object for a key that is null in every sample » | **(1) Incomplet** : la liste donnée comme complète oublie la struct d'union, qui apparaît pour une valeur à deux types. | Même exécution | Ajouter « ; a union struct when a value has two types ». |
| json-to-csharp | méta (layout.tsx:6) | « Runs in your browser. » | **(5)** Phrase identique sur 12 autres pages, dont typescript-to-js et javascript-formatter de ce lot, et color-converter, base64-encoder, csv-to-json, csv-to-sql, csv-to-tsv, toml-to-json, unicode-converter, duplicate-image-finder, image-rotate, pdf-compare. | Comparaison phrase par phrase de toutes les pages `app/tools/*/*` (script de relecture) | Fondre dans la phrase précédente avec un fait propre, par ex. « …nullable types, built by quicktype in your browser. » |
| json-to-csharp | privacy | « Our error log only receives the text of an error the page displays… » | **(3)** « only » promet plus que le code : le rapport contient aussi le nom de l'outil et le navigateur avec sa version (« Chrome 140 », par ex.). | `app/lib/reportError.js:140-154` (champs `tool`, `errorType`, `browser`) | « …receives the text of an error the page displays, with the tool's name and your browser's name and version, … » |
| json-to-csharp | FAQ 3 et 4 | « Because its value was null… » / « Because whole numbers are always typed long… » | **(6)** La réponse ne commence ni par Yes, ni par No, ni par un chiffre (questions en « Why »). | Gabarit §2d, règle 4 | Reformuler en oui/non : « Is a property typed object when its value is null? » « Yes. … » ; « Can I use int instead of long? » « Yes. Whole numbers are typed long… » |
| json-to-go | FAQ 1 | « Why is my field a pointer? » « Because it was missing from at least one element… » | **(1) Explication incomplète, donc fausse dans un cas courant** : une clé présente partout mais `null` dans un élément devient aussi un pointeur (`*string`), et cette fois **sans** `omitempty`. | Exécution `jsonToCode('[{"a":1,"s":"x"},{"a":2,"s":null}]','go')` : `S *string \`json:"s"\`` | « Because the key was missing from at least one element (pointer plus omitempty) or was null in one (pointer only). … » |
| json-to-go | FAQ 1 (même réponse) | « Because it was missing from at least one element of the array you pasted. » | **(5)** Presque identique à json-to-rust FAQ 2 (« Because the key was missing from at least one element of the array you pasted, or null in some of them. »). La consigne exige zéro phrase commune entre les pages JSON-to-<langage>. | json-to-go/page.jsx:62 ; json-to-rust/page.jsx:63 | Réécrire l'une des deux autour de son type propre (« nil pointer » contre « None ») ; la correction de la ligne précédente suffit pour Go. |
| json-to-go | FAQ 1 | « Because… » | **(6)** Ne commence ni par Yes, ni par No, ni par un chiffre. | Gabarit §2d.4 | « Is a field a pointer when a key is sometimes missing? » « Yes. … » |
| json-to-php | FAQ 3, et specs « Large integers » | « They become strings… written in quotes… and a comment at the top says so. » / « Values above PHP_INT_MAX are written as strings, with a comment saying so » | **(1) Vrai seulement en mode « PHP array »**, alors que la phrase ne le précise pas. En mode « PHP classes », la propriété est typée `string`, mais aucun commentaire n'est écrit. De plus, la ligne `Usage:` générée appelle `json_decode($json, true)` sans `JSON_BIGINT_AS_STRING` : PHP reçoit un float, et en typage non strict la valeur devient une chaîne arrondie (« 1.2345678901235E+19 »). Les chiffres sont perdus. | `app/lib/jsonToPhp.js:103` (type string), `:199-200` (ligne Usage) ; exécution `jsonToPhpClass('{"id":12345678901234567890}')` : `public string $id`, sans note | Préfixer : « In the PHP array output, they become strings… ». Dans specs : « PHP array output: written as strings, with a comment ». Ou dire pour les classes : « typed string; decode with JSON_BIGINT_AS_STRING to keep the digits ». |
| json-to-php | étapes, étape 1 | « Paste your JSON into "JSON Input". » | **(5)** Identique, mot pour mot, à json-to-csv (étape 1). | json-to-php/page.jsx:53 ; json-to-csv/page.jsx:44 | « Paste the JSON object or array you want as PHP into "JSON Input". » |
| json-to-php | méta (layout.tsx:6) | « Done in your browser. » | **(5)** Identique sur add-text-to-image et jpg-to-webp. | Comparaison phrase par phrase | Fondre : « …with a fromArray() factory, written by the site's own code in your browser. » |
| json-to-php | FAQ 4 | « Why does class mode refuse my JSON? » « Because… » | **(6)** Ne commence ni par Yes, ni par No, ni par un chiffre. | Gabarit §2d.4 | « Can class mode convert a list of numbers? » « No. Classes need an object… » |
| json-to-python | specs « Input » | « JSON text, an object or an array » | **(1) Faux pour un tableau de valeurs simples** : `[1,2]`, ou une valeur seule, donne une sortie **vide** (un seul saut de ligne), sans message. Seul un tableau d'objets produit des classes. | Exécution `jsonToCode('[1,2]','python')` : `"\n"` ; `jsonCodegen.js:71` | « JSON object, or array of objects (an array of plain values gives no class) » |
| json-to-python | méta (layout.tsx:6) | « Generated in your browser. » | **(5)** Identique à la méta de json-to-typescript : deux pages JSON-to-<langage> partagent une phrase. | json-to-python/layout.tsx:6 ; json-to-typescript/layout.tsx:6 | Changer l'une des deux, par ex. Python : « …snake_case names, made by quicktype on your device. » |
| json-to-python | privacy | « …the message text alone is reported to our error log… » | **(3)** « alone » : le rapport contient aussi le nom de l'outil et le navigateur avec sa version. | `app/lib/reportError.js:140-154` | « …the message text, with the tool's name and your browser version, is reported… » |
| json-to-rust | étapes, étape 1 | « Paste a JSON sample into "JSON Input". » | **(5)** Identique, mot pour mot, à json-to-csharp (étape 1) : deux pages JSON-to-<langage> partagent une phrase. Compté une seule fois pour la paire. | json-to-rust/page.jsx:48 ; json-to-csharp/page.jsx:48 | Rust : « Paste a JSON sample, ideally an array of several records, into "JSON Input". » (ou changer C#) |
| json-to-rust | FAQ 2 | « Why is a field an Option? » « Because… » | **(6)** Ne commence ni par Yes, ni par No, ni par un chiffre. | Gabarit §2d.4 | « Does a key missing from some items become an Option? » « Yes. … » |
| json-to-rust | privacy | « …the error text is the one thing reported… » | **(3)** « the one thing » : le nom de l'outil et le navigateur avec sa version partent aussi. | `app/lib/reportError.js:140-154` | « …the error text, with the tool name and browser version, is reported… » |
| json-to-typescript | specs « Input » | « JSON text: an object, or an array whose elements are merged » | **(1) Faux pour un tableau de valeurs simples** : `[1,2]` donne une sortie vide, sans interface ni message. | Exécution `jsonToCode('[1,2]','typescript')` : `"\n"` | « JSON object, or an array of objects whose elements are merged » |
| typescript-to-js | méta (layout.tsx:6) | « Runs in your browser. » | **(5)** Identique sur 12 autres pages (voir json-to-csharp). | Comparaison phrase par phrase | « …No type checking; Sucrase runs on your device. » |
| scss-to-css | méta (layout.tsx:6) | « Errors give line and column. » | **(5)** Même proposition que dans la méta de xml-formatter (« Errors give line and column; CDATA is never split. »). | scss-to-css/layout.tsx:6 ; xml-formatter/layout.tsx:6 | « Sass errors point to the line:column of your SCSS. » |
| code-formatter | specs « Detection » | « Reads the first 4,000 characters… » | **(1) Inexact** : la détection du JSON vérifie la fin et analyse **tout** le texte (`/[\]}]$/.test(text)`, `JSON.parse(text)`), pas seulement les 4 000 premiers caractères. | `app/lib/codeFormat.js:85` et `:100-101` | « Mostly reads the first 4,000 characters (JSON is checked on the whole text)… » |
| code-formatter | specs « Style » | « Prettier defaults with a print width of 80 and 2-space indentation… » | **(1) Inexact pour XML** : l'option `xmlWhitespaceSensitivity: 'preserve'` n'est pas la valeur par défaut du greffon (`strict`). | `app/lib/codeFormat.js:199` | « Prettier with a print width of 80 and 2-space indentation (XML text kept as written)… » |
| code-minifier | méta (layout.tsx:6) | « Shows the characters saved. » | **(5)** Identique à la méta de js-minifier. | code-minifier/layout.tsx:6 ; js-minifier/layout.tsx:6 | Code Minifier : « …and counts the characters each mode removes. » |
| code-minifier | FAQ 3 | « Why is a space left between my HTML tags? » « Because… » | **(6)** Ne commence ni par Yes, ni par No, ni par un chiffre. | Gabarit §2d.4 | « Does HTML mode delete all spaces between tags? » « No. … » |
| css-formatter | About et FAQ 3 | « Minify runs CSSO: comments and whitespace go… » / « What does Minify remove? » « Comments, … » | **(1) Faux pour les commentaires `/*! … */`** (licences) : CSSO les garde par défaut. | Exécution `csso.minify('/*! keep */ a{color:red} /* drop */')` : `/*! keep */` reste | « …comments (except /*! license comments) and whitespace go… » |
| css-formatter | About | « Both run in your browser. » | **(5)** Identique à javascript-formatter (About). | css-formatter/page.jsx:38 ; javascript-formatter/page.jsx:38 | « js-beautify and CSSO both run in your browser. » |
| css-formatter | privacy | « …its text alone is sent to our error log… » | **(3)** « alone » : le nom de l'outil et le navigateur avec sa version partent aussi. | `app/lib/reportError.js:140-154` | « …its text, with the tool name and browser version, is sent… » |
| html-formatter | FAQ 1 | « Can formatting change how my page looks? » « Normally no. … » | **(6)** La réponse commence par une réserve, pas par Yes ou No. | Gabarit §2d.4 | « No, in most pages. Inline elements… » ou « No. … » suivi de la condition. |
| html-formatter | privacy | « Our error log only receives an error message that the page displays… » | **(3)** « only » : le nom de l'outil et le navigateur avec sa version partent aussi. | `app/lib/reportError.js:140-154` | « …receives an error message the page displays, with the tool name and browser version, … » |
| javascript-formatter | méta (layout.tsx:6) | « Runs in your browser. » | **(5)** Identique sur 12 autres pages. | Comparaison phrase par phrase | « …drops dead code, on your device. » |
| javascript-formatter | FAQ 3 | « Why doesn't the error say which line? » « Because… » | **(6)** Ne commence ni par Yes, ni par No, ni par un chiffre. | Gabarit §2d.4 | « Does the Minify error give a line number? » « No. … » |
| js-minifier | exemple, légende | « Terser joins the declarations and renames the locals. » | **(7)** Rien n'est joint : l'entrée n'a qu'une déclaration de variable (`let sum = 0`), conservée seule. Terser ajoute les points-virgules, met tout sur une ligne et renomme les variables locales. | Exécution `minifyJs` : `function total(o){let t=0;for(const l of o)t+=l;return t}console.log(total([1,2]));` | « No semicolons in the input; Terser adds them, puts everything on one line and renames the locals. » |
| json-formatter | About | « That is why 20-digit ids, 1.10 and escapes stay exactly as written. » | **(1) Faux avec « Sort keys A-Z »** : les chaînes sont réécrites par `JSON.stringify` (`é` devient `é`). La FAQ 2 le dit, mais l'About l'affirme sans réserve. | `app/lib/jsonText.js:97-103` | « …numbers stay exactly as written, and so do escapes unless you sort the keys. » |
| json-formatter | About | « Everything runs in your browser. » | **(5)** Identique sur image-compressor et whitespace-remover. | Comparaison phrase par phrase | « Validation and re-indenting run in your browser. » |
| json-minifier | exemple, légende | « Formatted JSON on four lines becomes one… » | **(7) Faux** : l'entrée a **5** lignes (`{`, `"id"`, `"total"`, `"name"`, `}`). | json-minifier/page.jsx:37-39 ; compte des `\n` de `input` : 4 sauts de ligne, donc 5 lignes | « Formatted JSON on five lines becomes one… » |
| sql-formatter | FAQ 3 | « …so MySQL backticks, T-SQL square brackets or PostgreSQL :: casts can fail under Standard SQL. » | **(1) Faux pour les backticks** : « Standard SQL » les accepte. Seuls les crochets et `::` échouent. | Exécution `formatSql('select \`a\` from t',{language:'sql'})` : `SELECT\n  \`a\`\nFROM\n  t` ; crochets : « Parse error: Unexpected "[a] from t" » ; `::` : « Parse error » | « …so T-SQL square brackets or PostgreSQL :: casts fail under Standard SQL. » |
| xml-formatter | FAQ 1 | « …the validator looks for unclosed or crossed tags, bad attribute syntax and stray text… » | **(1) Partiellement faux** : du texte **après** l'élément racine passe la validation (`<a/>junk` est déclaré valide). Seul le texte placé avant est refusé. | Exécution `XMLValidator.validate('<a/>junk')` : `true` ; `'junk<a/>'` : erreur InvalidChar | « …bad attribute syntax and text before the root element… » |
| xml-formatter | About | « Everything happens in your browser. » | **(5)** Identique sur html-encoder et file-splitter. | Comparaison phrase par phrase | « Validation and indentation both happen in your browser. » |
| xml-formatter | FAQ 4 | « Why is the indentation wrong after one of my tags? » « Because… » | **(6)** Ne commence ni par Yes, ni par No, ni par un chiffre. | Gabarit §2d.4 | « Can a multi-line start tag break the indentation? » « Yes. … » |

## Faits vérifiés sans défaut (extraits, pour la traçabilité)
- quicktype : C# avec `[JsonPropertyName]` sur chaque propriété et `[JsonIgnore(WhenWritingNull)]` sur les clés absentes
  de certains éléments (pas sur celles qui sont `null`, et la page ne dit rien d'autre) ; `object` pour une clé toujours `null`.
  Go : `UserID`, `int64`/`float64`, pointeur avec `omitempty`, `interface{}`, `type Root []RootElement`. Python : champs
  optionnels placés après les autres, `root_class`, `None`. Rust : `rename_all`/`rename`, `Option<serde_json::Value>`, alias
  `Vec`. TypeScript : `?`, `null |`, clés entre guillemets. Une valeur décimale comme 10.0 donne un type à virgule (`sampleForTypes`).
- json-to-php : littéral de tableau exact (1.10 et grand entier écrits en chaîne avec commentaire) ; classes `final`,
  promotion de constructeur, `fromArray()`, camelCase ; message du mode classes vérifié.
- TS→JS (Sucrase) : énumérations, `const enum`, propriétés de paramètres, `import type` et imports inutilisés retirés, import
  à effet de bord gardé, namespace supprimé avec son contenu, JSX après `=>` refusé (« Unexpected token, expected ";" (1:14) »).
- SCSS : sass 1.105.0 ; « Can't find stylesheet to import. » pour `@import` et `@use` ; syntaxe indentée refusée ; ligne:colonne présente.
- Code Formatter : 13 langages et 20 dialectes (calculés `${…}`) ; détection GraphQL, SCSS, TS, SQL, YAML et Markdown
  vérifiée ; message « Line 1, column 9: Unexpected token » avec cadre ; JSON sans perte.
- Minificateurs : Terser (`return` puis saut de ligne, `a - -b`, `if(false)` supprimé, `import`/`export`, BigInt, noms de
  premier niveau gardés) ; CSSO (accolade fermante ajoutée, `#ffffff` devient `#fff`, `0px` devient `0`) ; HTML (`pre`, `textarea`,
  `script` et `style` intacts, un espace par suite de blancs) ; nom `minified.ts` en mode TS ; ligne « Saved … » affichée même après une erreur.
- Formateurs : js-beautify (CSS : `url(data:…)` et chaînes intacts ; HTML : `<head>`/`<body>` indentés, `<style>`/`<script>`
  formatés, pas de retour à la ligne automatique, balise non fermée acceptée sans message) ; sql-formatter (virgule dans
  `count(a, b)` et dans une chaîne, casse des fonctions gardée, message d'erreur sur plusieurs lignes qui suggère un dialecte,
  `tsql` accepté comme alias) ; JSON Formatter (tri par code de caractère, doublon : dernière valeur gardée, BOM refusé,
  aperçu au-delà de 1 000 000 caractères) ; JSON Minifier (BOM retiré, ancienne sortie laissée après une erreur) ; XML
  (DOCTYPE accepté, plusieurs racines acceptées, CDATA et commentaires non coupés, déclaration XML sans décalage).
- Libellés cités (« Convert », « Copy », « Download », « Save / Share », « Format », « Minify », « Expanded »,
  « Compressed », « 2 spaces », « 4 spaces », « Tab », « Sort keys A-Z », « Auto-detect », « SQL dialect », « Standard SQL »,
  « PHP array », « PHP classes », « JS/TS/CSS/HTML ») : présents dans le JSX, et chacun fait ce que la phrase dit.
- Structure : titres de 47 à 56 caractères, différents du H1 ; métas de 135 à 149 caractères, différentes de l'About ;
  About de 85 à 102 mots ; privacy de 46 à 62 mots ; 4 ou 5 étapes ; 3 ou 4 FAQ de 25 à 53 mots ; pas de bourrage de mots-clés (mot-clé exact 1 ou 2 fois).

## Remarques hors liste (non comptées comme défauts de texte)
- **Défaut de code, JSON to Python** : un entier de plus de 64 bits fait commencer la sortie par `// Note: … typed as a
  float here…`. `//` n'est pas un commentaire Python : le fichier `model.py` provoque une SyntaxError. De plus, le champ est
  typé `int` et non float, donc la note est fausse en Python (`app/lib/jsonCodegen.js:73-74`). À corriger dans le code
  (`# Note`, texte adapté), hors du périmètre du rédacteur.
- **Défaut de code, JSON to PHP (classes)** : voir la ligne « Large integers » ci-dessus. La ligne `Usage:` devrait passer
  `JSON_BIGINT_AS_STRING` (`app/lib/jsonToPhp.js:199-200`).
- JSON to C# : un tableau de valeurs simples (`[1,2]`) donne un namespace vide, sans classe. La page dit bien « object or
  array of objects », donc ce n'est pas un défaut de texte.
- SQL Formatter : « 12 Dialects » / « Twelve » / « 12 » sont exacts (12 options dans le JSX), mais ces chiffres écrits en dur
  n'ont pas de preuve dans `docs/audit/p36/preuves/dev-code.json`. Le contrôle C3 ne les vérifie pas (« dialects » n'est pas une unité).
- `csso` n'est pas déclaré dans `package.json` : c'est une dépendance transitive. Sans incidence aujourd'hui sur le texte.
- Code Formatter et JS Minifier ont la même question (« Does it show where a syntax error is? ») avec des réponses opposées
  et exactes : c'est permis par le gabarit §2d.5, donc non compté.

## Bilan
- Pages relues : **18**.
- Défauts par point de la liste :
  1. Exactitude : **13**
  2. Libellés : **0**
  3. Lieu de traitement : **5** (mineurs : « only / alone / the one thing » alors que le nom de l'outil et du navigateur partent aussi)
  4. Invérifiable : **0**
  5. Générique / dupliqué : **13** (dont 3 entre pages JSON-to-<langage> : C#/Rust étape 1, Python/TypeScript méta, Go/Rust FAQ quasi identique)
  6. Structure : **8** (réponses de FAQ qui ne commencent ni par Yes, ni par No, ni par un chiffre)
  7. Exemple : **2** (légendes ; les 18 sorties sont exactes)
  - **Total : 41 défauts.**
- Pages **sans aucun défaut** : aucune. Les plus proches : typescript-to-js et scss-to-css (une phrase de méta dupliquée chacune).

## Deuxième passe (06/10)

J'ai relu entièrement les 18 pages après les corrections : texte SEO, méta et chaînes d'interface (sous-titres sous le H1,
messages, notes, placeholders). La liste de contrôle est la même, avec les précisions du 06/10 de
`CONSIGNES-REDACTION.md`.

- Les 18 exemples, relancés avec le moteur et les options de leur page, donnent toujours exactement la sortie affichée.
  Seul écart : le saut de ligne final invisible de quicktype, jsonToPhp et Prettier.
- Les 41 défauts de la première passe sont corrigés. J'ai vérifié chaque nouvelle phrase dans Node :
  - la struct d'union et `Converter.Settings` en C# ;
  - le pointeur sans `omitempty` et la struct `V` (Integer/String) en Go, sur `[{"v":1},{"v":"x"}]` ;
  - la sortie vide de `[1,2]` en Python et en TypeScript ;
  - la distinction tableau/classes de PHP pour les grands entiers ;
  - les backticks acceptés par sql-formatter ;
  - les commentaires `/*!` gardés par CSSO ;
  - `<a/>junk` accepté par le validateur XML ;
  - les spécifications « Detection » et « Style » de Code Formatter.
- Les 5 sous-titres modifiés (json-to-php, xml-formatter, javascript-formatter, css-formatter, scss-to-css) sont exacts.
- La preuve « 12 Dialects » (`preuves/dev-code.json`) correspond bien au JSX.
- Les contrôles automatiques donnent : `instructions.mjs` 0 écart ; `privacy-claims.mjs` 0 échec ; `content-verify
  --only=developer-tools/` **2 échecs C6 sur ce lot** (lignes 1 et 2 ci-dessous).
- Il ne reste aucune phrase identique entre les 6 pages JSON-to-<langage>, ni entre une page de ce lot et une autre page du site. Seule exception, la question « Does it show where a syntax error is? », commune à Code Formatter et JS Minifier : leurs réponses sont différentes et exactes, ce que §2d.5 permet.

| Page | Endroit | Phrase (citation courte) | Problème | Preuve (fichier:ligne ou calcul) | Correction proposée |
|---|---|---|---|---|---|
| css-formatter | méta (layout.tsx:6) | « Works in your browser. » | **(5)** Phrase courte générique, refusée par C6. | `node scripts/p36/content-verify.mjs --only=developer-tools/` : « FAIL C6 developer-tools/css-formatter: generic sentence «Works in your browser.» » | « …shortens colors, with both engines running on your device. » |
| json-to-typescript | méta (layout.tsx:6) | « Generated in your browser. » | **(5)** Phrase courte générique, refusée par C6 : elle n'est plus partagée avec Python, mais reste interdite. | Même commande : « FAIL C6 developer-tools/json-to-typescript: generic sentence «Generated in your browser.» » | « …\| null for null values, written by quicktype on your device. » |
| javascript-formatter | About (page.jsx:38) | « Both run in your browser. » | **(5)** Variante de la liste bannie le 06/10 (« It runs / Everything runs in your browser. ») : elle resterait vraie sur toute page à deux boutons. Elle était identique à css-formatter en première passe ; seul css-formatter a été changé. | CONSIGNES-REDACTION, précisions du 06/10 (phrases courtes génériques) | « js-beautify and Terser both work on your code inside the browser tab. » |
| code-minifier | étapes, étape 4 | « Click "Copy", or "Download" to save the minified file. » | **(5)** C'est le motif banni « Click "Download" to save the … file. ». Le nom réel du fichier n'est pas donné. | CONSIGNES-REDACTION, précisions du 06/10 ; nom réel `'minified.' + lang` (page.jsx:35) | « Click "Copy", or "Download" to save minified.js, minified.ts, minified.css or minified.html. » |
| json-to-rust | specs « Types » | « i64, f64, bool, String, Vec<T> and Option<T> » | **(1) Liste fermée incomplète** (le même défaut a été corrigé en C# et en Go). Une valeur à deux types donne `#[serde(untagged)] pub enum V { Integer(i64), PurpleString(String) }`. Une clé toujours nulle ou un tableau vide donne `serde_json::Value`. | Exécution `jsonToCode('[{"v":1},{"v":"x"}]','rust')` ; `jsonToCode('{"c":[]}','rust')` : `Vec<Option<serde_json::Value>>` | « …Option<T>; an untagged enum when a value has two types; serde_json::Value when no type can be inferred » |
| json-to-python | About et méta | « types use int, float, str, bool, List and Optional from typing » / « with int, float, str, List and Optional types » | **(1) Liste incomplète**, même défaut qu'en Rust. Une valeur à deux types donne `Union[int, str]`, un tableau vide donne `List[Any]` ; les deux s'importent de `typing`. | Exécution `jsonToCode('[{"v":1},{"v":"x"}]','python')` : `v: Union[int, str]` ; `{"c":[]}` : `c: List[Any]` | About : « …List and Optional from typing, plus Union when a value has two types ». La méta peut rester si l'About le dit ; sinon « …Optional and Union types ». |
| json-to-go | privacy | « What the page can send is an error report: when a red error line appears… » | **(3)** Présenté comme le seul cas d'envoi, ce qui est faux. `ToolErrorWatch`, monté sur toutes les pages d'outil, signale aussi une exception non rattrapée sans ligne rouge, par exemple le rejet de `navigator.clipboard.writeText` quand « Copy » est refusé. | `app/tools/ToolErrorWatch.jsx` (écouteurs `error` / `unhandledrejection`) ; json-to-go/page.jsx, bouton Copy sans `catch` | « …goes to our error log with the tool name and your browser's name and version; an unexpected failure of the page is reported the same way. » |
| scss-to-css | privacy | « One exception: when compilation fails, Sass's error message is sent… » | **(3)** « One exception » : même raison, `ToolErrorWatch` signale aussi les exceptions non rattrapées (par ex. « Copy » refusé). | `app/tools/ToolErrorWatch.jsx` ; scss-to-css/page.jsx, Copy sans `catch` | « Error reports are the exception: when compilation fails, … ; an unexpected failure of the page is also reported, with the tool name and browser version. » |
| js-minifier | privacy | « A failed minification is the exception, since the error message shown… » | **(3)** Même raison que les deux lignes précédentes. | `app/tools/ToolErrorWatch.jsx` ; js-minifier/page.jsx, Copy sans `catch` | Ajouter : « …; an unexpected failure of the page is reported the same way. » |
| code-formatter | chaîne d'interface (message, page.jsx:31) | « The language could not be recognised. » | **(6)** Orthographe britannique dans un texte d'interface, alors que la règle impose l'anglais américain. Ce message est aussi la source de la future traduction. | CONSIGNES-REDACTION « Anglais simple (américain) » ; précisions du 06/10 (les chaînes d'interface comptent) | « The language could not be recognized. Choose it in the Language list. » |

### Bilan de la deuxième passe
- Pages relues : **18**.
- Défauts par point : (1) 2 · (2) 0 · (3) 3 · (4) 0 · (5) 4 · (6) 1 · (7) 0. **Total : 10.**
- Pages **sans aucun défaut** (8) : json-to-csharp, json-to-php, typescript-to-js, html-formatter, json-formatter,
  json-minifier, sql-formatter, xml-formatter.
- Remarque : les lignes Rust et Python ne sont pas des régressions. Je les avais laissées passer en première passe, puis la
  correction C#/Go m'a montré le même manque. Les défauts de code hors texte (note `//` en Python, ligne `Usage:` de PHP
  sans `JSON_BIGINT_AS_STRING`) restent ouverts, comme le dit le compte rendu du rédacteur.

## Troisième passe (06/10)

J'ai relu entièrement les 10 pages touchées (méta, About, étapes, specs, privacy, FAQ, sous-titre et chaînes d'interface) :
css-formatter, json-to-typescript, javascript-formatter, code-minifier, json-to-rust, json-to-python, json-to-go,
scss-to-css, js-minifier et code-formatter.

- **Les 10 corrections sont exactes.** Je les ai vérifiées dans le code ou dans Node :
  - Rust : `#[serde(untagged)] enum` pour une valeur à deux types ; `serde_json::Value` pour une clé toujours nulle ou un tableau vide.
  - Python : `Union[int, str]` et `List[Any]`.
  - Code Minifier : les noms `minified.js/.ts/.css/.html` (`'minified.' + lang`).
  - Les « unexpected failure » sont signalées par `app/tools/ToolErrorWatch.jsx`.
  - Code Formatter : le message dit maintenant « recognized ».
- **Exemples :** les 18 donnent toujours exactement la sortie affichée.
- **Structure :** métas de 137 à 154 caractères ; About de 89 à 112 mots ; privacy de 56 à 76 mots ; FAQ inchangées et conformes.
- **Unicité :** aucune nouvelle phrase n'est identique à une phrase d'une autre page. Seul le bout de phrase « an unexpected failure of the page is reported the same way » se retrouve dans les privacy de json-to-go et de js-minifier, à l'intérieur de phrases différentes : il est exact, et ce n'est pas un doublon de phrase, donc je ne le compte pas.
- **Contrôles automatiques :**
  - `content-verify --only=developer-tools/` : 0 échec sur ces 18 pages. Le seul échec C6 restant est sur base64-encoder, une page d'un autre lot.
  - `instructions.mjs` : 0 écart.
  - `privacy-claims.mjs` : 0 échec.

**0 défaut.** Les 18 pages du lot dev-code sont sans défaut. Restent ouverts, hors texte : la note `//` dans la sortie Python, et la ligne `Usage:` du mode classes PHP sans `JSON_BIGINT_AS_STRING`.
