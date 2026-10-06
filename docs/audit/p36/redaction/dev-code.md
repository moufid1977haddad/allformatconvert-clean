# P36 — rédaction du lot « dev-code » (18 outils développeur)

06/10/2026. Base : `docs/audit/p36/faits/dev-code.json` (faits, fichier:ligne) et `docs/audit/p36/audit/dev-code.md` (106 défauts).
Fichiers modifiés : `layout.tsx` (title.absolute, description, openGraph.title/description) et les props de `<SeoContent>` de
`page.jsx`, pour les 18 outils ; `docs/audit/p36/preuves/dev-code.json` ; ce compte rendu. **Aucune chaîne d'interface modifiée**,
aucun composant partagé, aucune logique. Seul changement hors chaîne : dans `code-formatter/layout.tsx`, les constantes `TITLE` /
`DESCRIPTION` (utilisées seulement par `metadata`) sont remplacées par les chaînes écrites directement dans `metadata`, sinon C1
lisait « … » au lieu du titre. Les fins de ligne CRLF de la copie de travail ont été conservées dans les 36 fichiers.

## Résultat des contrôles (06/10)
- `node scripts/p36/content-verify.mjs --only=developer-tools/` : 57 pages, 0 échec (C0-C7) ; part maximale de phrases identiques sur le site : 14,3 % (paire hors de ce lot).
- `node scripts/content-checks/instructions.mjs` : 0 écart sur mes 18 pages (le seul écart du site est `image-tools/png-to-ico`, autre lot).
- `node scripts/content-checks/privacy-claims.mjs` : 0 échec sur mes 18 pages (les échecs restants sont `pdf-tools/*`, autre lot).

## Titres, méta, volume (mots du texte visible estimés depuis le source : About + étapes + specs + confidentialité + FAQ + astuces ; « avant » = seoWords de contenu-avant.json)
| Outil | Titre (car.) | Méta-description (car.) | Mots avant | Mots après |
|---|---|---|---|---|
| json-to-typescript | JSON to TypeScript Interface Generator — Optional Fields (56) | Paste JSON and get TypeScript interfaces: one per nested object, ? for keys some items lack, | null for null values. Generated in your browser. (143) | 359 | 513 (+ exemple 50) |
| json-to-go | JSON to Go Struct Generator — json Tags and Pointers (52) | Turn a JSON sample into Go structs with json tags, int64 or float64 fields and pointers for optional keys. Built in your browser with quicktype. (144) | 320 | 476 (+ exemple 57) |
| json-to-csharp | JSON to C# Class Generator — System.Text.Json Ready (51) | Generate C# classes from a JSON sample: PascalCase properties, [JsonPropertyName] attributes, long, double and nullable types. Runs in your browser. (148) | 307 | 428 (+ exemple 114) |
| json-to-python | JSON to Python Dataclass Generator — Typed, snake_case (54) | Convert JSON into Python @dataclass definitions with int, float, str, List and Optional types and snake_case names. Generated in your browser. (142) | 325 | 435 (+ exemple 47) |
| json-to-rust | JSON to Rust Struct Generator — serde Derive Ready (50) | Paste JSON to get Rust structs that derive Serialize and Deserialize, with snake_case fields, serde renames and Option for missing keys. In-browser. (148) | 371 | 446 (+ exemple 61) |
| json-to-php | JSON to PHP Array or Class Converter — PHP 8 Classes (52) | Convert JSON to a PHP array literal holding your exact values, or to typed PHP 8 classes with a fromArray() factory. Done in your browser. (138) | 416 | 459 (+ exemple 65) |
| typescript-to-js | TypeScript to JavaScript Converter — Types Removed (50) | Remove TypeScript types, interfaces, generics and casts with Sucrase and keep the JavaScript as written. No type checking. Runs in your browser. (144) | 258 | 418 (+ exemple 46) |
| scss-to-css | SCSS to CSS Compiler — Dart Sass in Your Browser (48) | Compile SCSS to expanded or compressed CSS with Dart Sass: variables, nesting, mixins, @extend and @use sass:math. Errors give line and column. (143) | 245 | 385 (+ exemple 38) |
| code-formatter | Code Formatter — 13 Languages, Auto-Detected, Prettier (54) | Format JavaScript, TypeScript, JSON, HTML, XML, CSS, SQL, YAML, Markdown or GraphQL in your browser, with the language detected from the code itself. (149) | 455 | 494 (+ exemple 33) |
| code-minifier | Code Minifier — JavaScript, TypeScript, CSS and HTML (52) | Minify JS or TS with Terser, CSS with CSSO, and HTML by removing comments and extra spaces, all in your browser. Shows the characters saved. (140) | 266 | 462 (+ exemple 47) |
| css-formatter | CSS Formatter and Minifier — js-beautify and CSSO (49) | Beautify CSS with 2-space indentation, or minify it with CSSO, which merges duplicate rules and shortens colors. Works in your browser. (135) | 228 | 363 (+ exemple 32) |
| html-formatter | HTML Formatter — Indent HTML, Inline CSS and JavaScript (55) | Re-indent HTML with 2 spaces using js-beautify, in your browser. Inline <script> and <style> are formatted too; <pre> and <textarea> stay as typed. (147) | 230 | 354 (+ exemple 47) |
| javascript-formatter | JavaScript Formatter & Minifier — Beautify or Shrink JS (55) | Beautify JavaScript with js-beautify and a 2-space indent, or minify it with Terser, which renames locals and drops dead code. Runs in your browser. (148) | 257 | 361 (+ exemple 41) |
| js-minifier | JS Minifier — Terser in Your Browser, Locals Renamed (52) | Minify JavaScript with Terser: shorter local names, dead code and comments removed, modern syntax and modules accepted. Shows the characters saved. (147) | 298 | 368 (+ exemple 53) |
| json-formatter | JSON Formatter & Validator — Exact Numbers, Sort Keys (53) | Validate and beautify JSON with 2 spaces, 4 spaces or tabs, sort keys A-Z, or minify. Errors show line and column; numbers stay exactly as typed. (145) | 408 | 477 (+ exemple 32) |
| json-minifier | JSON Minifier — One Line, Numbers and Escapes Unchanged (55) | Compress JSON to one line by removing whitespace outside strings. Checked with JSON.parse; 20-digit ids and 1e21 stay as typed. In your browser. (144) | 322 | 339 (+ exemple 28) |
| sql-formatter | SQL Formatter — 12 Dialects, Uppercase Keywords (47) | Format SQL queries for MySQL, PostgreSQL, SQL Server, Oracle, SQLite, BigQuery and more: keywords uppercased, clauses indented, in your browser. (144) | 261 | 377 (+ exemple 64) |
| xml-formatter | XML Formatter — Well-Formedness Check, 2-Space Indent (53) | Check that XML is well-formed and re-indent it by 2 spaces per level, in your browser. Errors give line and column; CDATA is never split. (137) | 322 | 437 (+ exemple 40) |

## Exemples : tous produits en exécutant le moteur de l'outil
Commande : `node run.mjs` dans le dossier temporaire de session (`scratchpad/devcode`), qui importe les copies conformes de
`app/lib/jsonCodegen.js`, `jsonToPhp.js`, `jsonText.js`, `jsonLossless.js`, `codeTools.js`, `codeFormat.js`, `htmlMinify.js`
(seul changement : l'emplacement, avec une jonction vers le `node_modules` du dépôt) et appelle les mêmes fonctions avec les mêmes options
que les pages : `jsonToCode(texte, 'typescript'|'go'|'csharp'|'python'|'rust')`, `jsonToPhpArray`, `typescriptToJs(texte, { jsx: <heuristique de la page> })`,
`scssToCss({ style: 'expanded' })`, `detectLanguage` + `formatCode` (détecté : graphql), `minify` de htmlMinify (Code Minifier mode HTML), `minifyCss`
(CSS Formatter, Minify), `beautify(…, 'html'|'js')`, `minifyJs`, `reformatJson(…, 2)` et `reformatJson(stripBom(…), 0)`, `formatSql({ language: 'sql' })`.
XML Formatter : la fonction `splitXmlTags` est relue telle quelle dans `xml-formatter/page.jsx` (lignes 15-66) et la boucle d'indentation
(lignes 76-91) reproduite à l'identique, faute d'export. Seule retouche des sorties : le retour à la ligne final que quicktype, Prettier et Sass ajoutent est
retiré pour l'affichage. Les six générateurs JSON→code ont chacun un exemple différent qui montre leurs conventions propres (interface + `?`/`| null` ;
struct + tags + initialisme `UserID` ; classe + `[JsonPropertyName]` + `string?` ; dataclass + `Optional` + `RootElement` ; serde `rename_all` +
`Option` + `skip_serializing_if` ; tableau PHP + entier au-delà de PHP_INT_MAX en chaîne).

## Ce qui a disparu (renvoi à l'audit)
- Les 15 titres/méta qui décrivaient l'ancien code (« single Root struct/class », « regex pattern matching », « not a real Sass compiler »,
  « Break a Fixed List », « pattern-based rules », « Strip Comments and Collapses Whitespace »…) : tous réécrits d'après le moteur réel.
- Les FAUX de l'audit : « no download » (json-to-typescript FAQ 5, json-formatter astuce 3, json-minifier astuce 4) ; « doesn't validate » (xml-formatter) ;
  position d'erreur promise par JS Minifier / JavaScript Formatter (dit maintenant : message Terser sans ligne ni colonne) ; « at most two blank lines »
  (→ une) ; « whitespace between tags » supprimé (→ un espace) ; « ready return [...] body » (→ `$data = [...]`) ; « and others » (12 dialectes listés) ;
  « null fields marked optional » en TypeScript (→ `?` pour absent, `| null` pour null) ; CDATA « untouched » (→ jamais coupé, mais lignes réindentées).
- Les TROMPEUR : null partout → `object` (C#), `None` (Python), `interface{}` (Go), `mixed` (PHP) dits ; Sort keys A-Z réécrit les échappements et garde la
  dernière clé en double ; sortie précédente laissée par JSON Minifier ; CSS/HTML jamais rejetés ; erreurs sans position dans Code Formatter.
- Les 39 GÉNÉRIQUE : plus aucune FAQ « free, no signup », plus de « Is my code uploaded? » identique ; un bloc `privacy` propre à chaque page.
- Les INVÉRIFIABLE (« engine behind webpack and Vite », « most JavaScript projects use », « many online SQL beautifiers », « Its meaning, never »,
  « many sites silently output broken code ») : retirés.

## Défauts de code NON corrigés (consigne) et comment le texte les contourne
- `jsonCodegen.js:73-74` (note `// Note:` invalide en Python) : aucune page ne parle des entiers au-delà de 64 bits pour Python ; rien n'est promis.
- Détection JSX de TypeScript to JS (`page.jsx:13`) : la FAQ dit « Partly » et décrit exactement le cas qui échoue (`=>` sans `return`).
- Namespaces supprimés par Sucrase : dit en clair sur TypeScript to JS (FAQ, specs, About) et Code Minifier (FAQ TS).
- `csso` non déclaré dans package.json : non mentionné aux visiteurs ; aucune promesse de signalement d'erreur CSS.
- Noms de fichier (`minified.ts` pour du JavaScript, `formatted.css/js/json` après Minify), « Saved N characters » après une erreur, BOM refusé par JSON Formatter : dits tels quels là où c'est utile.

## Points laissés de côté (non vérifiables ici)
- Compilation réelle du code C#, Go, Rust, Python, PHP généré : non faite (aucun compilateur exécuté) ; le texte ne promet pas que le code compile, seulement
  ce que contient la sortie (vérifiée).
- Comportement de Prettier sur HTML/Markdown (sens jamais changé ?) : non affirmé.
- Comparaisons avec d'autres sites ou outils (webpack, Vite, Babel, esbuild) : retirées.
- Envoi des messages d'erreur : décrit sur chaque page (texte affiché seulement, nettoyé) ; la page SCSS dit que le message Sass peut citer la ligne fautive.

## Corrections après relecture (06/10)

Les 41 défauts de `docs/audit/p36/relecture/dev-code.md` sont corrigés. J'ai d'abord revérifié chacun en exécutant le moteur dans Node (`scratchpad/devcode/v.mjs`, `v2.mjs`), et le relecteur avait raison partout :
- C# : une valeur à deux types (`{"v":[1,"x"]}`) produit une `partial struct V`, la classe `Converter` avec `Settings`, `VConverter` et trois convertisseurs de dates (183 lignes ; `jsonCodegen.js:21`).
- `[1,2]` donne une sortie vide (`"\n"`) en TypeScript et en Python.
- Go : une clé présente partout mais null dans un élément donne `S *string` sans `omitempty`.
- PHP, mode classes : un très grand entier donne `public string $id`, sans commentaire, et la ligne `Usage:` n'utilise pas `JSON_BIGINT_AS_STRING` (`jsonToPhp.js:103,199-200`).
- SQL Standard accepte les backticks ; les crochets et `::` échouent.
- CSSO garde `/*! keep */`.
- `XMLValidator.validate('<a/>junk')` renvoie `true` ; `'junk<a/>'` est refusé.

Corrections par page :
- **json-to-csharp**
  - About : la struct d'union et ses convertisseurs sont signalés ; « no converters » est retiré.
  - FAQ 2 : « Yes, when every key keeps one type… pass Converter.Settings ».
  - Specs « Types » : ajout de la struct d'union.
  - Méta : nouvelle phrase, sans « Runs in your browser ».
  - FAQ 3 et 4 : reformulées en oui/non.
  - Privacy : dit ce qui part réellement (voir plus bas).
- **json-to-go**
  - FAQ 1 : « Is a field a pointer when a key is sometimes missing or null? Yes… », qui couvre les deux cas (`omitempty` ou non).
  - Question « Does it use int or int64…? » devenue « Which number types does it use? ».
  - Nouvelle ligne de specs « Mixed types », trouvée en vérifiant au-delà du rapport : struct `V` à champs `Integer`/`String`, qu'`encoding/json` ne sait pas remplir sans une méthode `UnmarshalJSON` (sortie vérifiée).
- **json-to-php**
  - FAQ 3 et specs « Large integers » : séparées entre tableau PHP (chaîne et commentaire) et classes (`string`, sans commentaire, `JSON_BIGINT_AS_STRING` nécessaire).
  - Étape 1, méta et FAQ 4 (« Can class mode convert a list of numbers? No. ») réécrites.
- **json-to-python** : specs « Input » (un tableau de valeurs simples donne une sortie vide), méta (« made by quicktype on your device »), privacy.
- **json-to-rust** : étape 1, FAQ 2 (« Does a key missing from some items become an Option? Yes… », sans phrase commune avec Go), privacy.
- **json-to-typescript** : specs « Input » (tableau de valeurs simples → sortie vide).
- **typescript-to-js**
  - Méta réécrite.
  - FAQ TSX : « Partly » devient « Yes, but only when… ».
- **scss-to-css** : méta (« Sass errors give the line:column »).
- **code-formatter** : specs « Detection » (le JSON est vérifié sur tout le texte) et « Style » (le texte XML est gardé tel quel, ce n'est pas le réglage par défaut).
- **code-minifier** : méta, FAQ 3 (« Does HTML mode delete all spaces between tags? No. »).
- **css-formatter** : About, FAQ 3 et specs « Minify » (commentaires `/*!` gardés), « js-beautify and CSSO both run in your browser », privacy.
- **html-formatter** : FAQ 1 (« No, in most pages. »), privacy.
- **javascript-formatter** : méta, FAQ 3 (« Does the Minify error give a line number? No. »).
- **js-minifier** : légende de l'exemple (« Terser adds them, puts everything on one line and renames the locals »).
- **json-formatter** : About (« and so do escapes unless you sort the keys » ; « Validation and re-indenting run in your browser »).
- **json-minifier**
  - Légende : « five lines ».
  - About : la phrase « Everything runs… » est remplacée.
  - Méta : « In your browser. » est remplacé.
- **sql-formatter** : FAQ 3 (backticks acceptés ; crochets et `::` refusés). Preuve ajoutée dans `preuves/dev-code.json` pour « 12 Dialects » : motif qui compte les 12 options du JSX.
- **xml-formatter**
  - FAQ 1 : « text before the root element (text after it passes) ».
  - About : « Validation and indentation both happen in your browser ».
  - FAQ 4 : « Can a multi-line start tag break the indentation? Yes. ».

Bloc **privacy** des 18 pages : chacun dit maintenant ce que part dans un rapport d'erreur. Ce sont le message nettoyé, le nom de l'outil, le nom et la version du navigateur (`reportError.js:140-154`). Les mots « only », « alone » et « the one thing » sont retirés.

Toutes les réponses de FAQ commencent par Yes/No/le chiffre (questions fermées) ou par la réponse directe (How/What/Which). Plus aucune ne commence par « Because ».
Contrôle de doublons de phrases sur tout le site (`scratchpad/devcode/dup.mjs`) : il ne reste que les titres de section `privacyTitle` (« Where your JSON/code is processed ») et des textes d'interface existants (placeholders).

**Chaînes d'interface modifiées** (sous-titres sous le H1, dernière précision des consignes) :
- json-to-php : « Generate PHP classes from JSON » devient « Turn JSON into a PHP array or typed PHP 8 classes ». Trompeur : la sortie par défaut est un tableau (`page.jsx:12`).
- xml-formatter : « Format and beautify XML » devient « Check that XML is well-formed, then indent it ». La validation n'était pas dite (`page.jsx:76-82`).
- javascript-formatter : « Format and beautify JavaScript code » devient « Beautify or minify JavaScript code ». Le bouton Minify n'était pas dit.
- css-formatter : « Format and beautify CSS » devient « Beautify or minify CSS ». Même raison.
- scss-to-css : « Convert SCSS to CSS format » devient « Compile SCSS to CSS with Dart Sass ».

Aucun autre texte d'interface de ces pages n'est invérifiable : les placeholders, messages d'erreur et « Saved N characters » sont exacts.

Défauts de code toujours non corrigés, comme prévu :
- note `//` en Python ;
- JSX de TypeScript to JS ;
- namespaces ;
- `csso` non déclaré dans package.json ;
- nouveau : la ligne `Usage:` du mode classes PHP sans `JSON_BIGINT_AS_STRING` (`jsonToPhp.js:199-200`). Le texte le dit au lieu de le promettre.

## Corrections après deuxième passe (06/10)

Les 10 défauts de la section « Deuxième passe » sont corrigés. Je les ai vérifiés dans Node :
- `[{"v":1,"c":[]},{"v":"x","c":[]}]` en Rust donne `#[serde(untagged)] pub enum V` et `Vec<Option<serde_json::Value>>` ;
- la même entrée en Python donne `Union[int, str]` et `List[Any]` ;
- `app/tools/ToolErrorWatch.jsx:25-36` signale les erreurs non rattrapées (`error`, `unhandledrejection`).

| Page | Correction |
|---|---|
| css-formatter (méta) | « Works in your browser. » remplacé par « …shortens colors, with both engines running on your device. » (154 car.) |
| json-to-typescript (méta) | « Generated in your browser. » remplacé par « …\| null for null values, written by quicktype on your device. » (153 car.) |
| javascript-formatter (About) | « Both run in your browser. » remplacé par « js-beautify and Terser both work on your code inside the browser tab. » |
| code-minifier (étape 4) | nomme les vrais fichiers : minified.js, minified.ts, minified.css ou minified.html, selon le mode |
| json-to-rust (specs Types) | ajout de l'enum untagged (deux types) et de serde_json::Value (clé toujours nulle, tableau vide) |
| json-to-python (About + méta) | ajout de Union (deux types) et de Any (tableau vide) ; méta « Turn JSON into… List, Optional and Union types… » (153 car.) |
| json-to-go, scss-to-css, js-minifier (privacy) | les rapports d'erreur ne sont plus présentés comme le seul envoi possible : « an unexpected failure of the page is reported the same way / also reported » (ToolErrorWatch) |
| code-formatter (chaîne d'interface, page.jsx:32) | « The language could not be recognised. » devient « The language could not be recognized. » (orthographe américaine). C'est la seule chaîne d'interface modifiée dans cette passe. |

Contrôles :
- `content-verify --only=developer-tools/` : 0 échec sur mes 18 pages. Il reste 1 échec C6 sur une page d'un autre lot.
- `instructions.mjs` : 0 écart.
- `privacy-claims.mjs` : 0 échec.
- Fins de ligne CRLF conservées.

La fiche de faits `faits/dev-code.json` cite encore l'ancien « recognised » : c'est un document d'audit daté, laissé tel quel.
