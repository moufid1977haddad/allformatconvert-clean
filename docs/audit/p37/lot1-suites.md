# P37 lot 1 — suites (06/10) : XML to JSON (deux racines) et Code Minifier (mode TS)

Deux défauts traités, tous deux corrigés. Pas de commit (le contrôleur commite).
Sorties avant / après : `scripts/p37/out/<test>.before.txt` et `.after.txt`.

## 1. XML to JSON : deux éléments racines acceptés — gravité 1
- **Repro** : `<a></a><c/>` donnait `{"a": "", "c": ""}` sans erreur. Ce n'est pas du XML bien formé (un seul élément
  racine). Même chose pour `<a/><b/>`, `<a/><b></b>`, `<a/>text`, `<a/>&amp;` et `<a/><![CDATA[x]]>`.
- **Cause** : le validateur de fast-xml-parser 5.11.1 note la fin de la racine seulement sur une balise fermante, et
  ne cherche une deuxième racine que sur une balise ouvrante non auto-fermée. `<a></a><b></b>` était refusé, mais avec
  « Multiple possible root nodes found. » et une colonne sur le `>` de `<b>`.
- **Oracles exécutés** : Chromium (DOMParser, libxml2, comme xmllint) : « Extra content at the end of the document »,
  ligne 1, colonne 8 pour `<a></a><c/>` (le `<` de `<c/>`). Python expat : « junk after document element », ligne 1,
  colonne 7 (base 0). Les deux acceptent commentaires, instructions de traitement et espaces après la racine.
  xmllint n'est pas installé ici ; Chromium utilise la même bibliothèque.
- **Correction** (`app/tools/developer-tools/xml-to-json/xmlError.js`) : deux fonctions ajoutées.
  `checkSingleRoot(xml)` parcourt le balisage déjà validé et signale le premier élément ou texte après la racine
  fermée (les `>` dans les valeurs d'attribut, commentaires, PI, DOCTYPE et CDATA sont gérés).
  `validateXml(validate, xml)` lance le validateur, puis ce contrôle s'il a réussi (ou s'il a trouvé lui-même la
  deuxième racine, pour avoir partout le même message et la position du `<`). La page appelle `validateXml`.
- **Messages** :
  - `Extra content at the end of the document: a second root element <c> after <a>; XML allows only one root element. (line 1, column 8)`
  - `Extra content at the end of the document: text after the root element <a>. (line 1, column 5)`
- **Tests** : `scripts/p37/xml-to-json-roots.test.mjs`. Avant : 3 passés, 8 échoués. Après : 11 passés, 0 échoué.
  Suite existante `scripts/p37/xml-to-json.test.mjs` : 5 / 5.
- **Texte de la page** (`page.jsx`, `layout.tsx` inchangé) :
  - About : « Malformed XML is reported with the parser's message and the line and column of the error, instead of a
    partial result. » → « Malformed XML, a second root element included, is reported with a message that gives the line
    and column of the error, instead of a partial result. »
  - FAQ 4 : ajout de « A second root element, as in <a></a><c/>, is refused too, because XML allows only one. »

## 2. Code Minifier, mode TS : namespace effacé et TSX mal signalé — gravité 1
- **Repro** :
  - `namespace A { export const x = 1; export function f() { return x + 1; } }` puis `console.log(A.x, A.f());` donnait
    `console.log(A.x,A.f());` : le namespace et son code avaient disparu, le fichier minifié plante (« A is not defined »).
  - `const C = (p: { n: string }) => <div className="a">{p.n}</div>;` donnait `Unexpected token, expected ";" (1:30)`.
- **Constat** : la page appelait `typescriptToJs` de `app/lib/codeTools.js`, Sucrase en mode `typescript` seul (pas
  de JSX du tout, même après `return <`), puis Terser.
- **Correction** (`app/lib/codeTools.js`) :
  - `typescriptToJs(code)` appelle maintenant `convertTypescript` (`app/lib/typescriptToJs.js`), le code de la page
    TypeScript to JS. Même comportement : JSX trouvé partout, casts `<number>x` gardés, namespace avec du code refusé
    avec son nom et sa ligne, namespace de types seuls retiré comme tsc. L'option `{ jsx }` est retirée (aucun appelant).
  - Nouvelle `minifyTypescript(code)` : conversion ci-dessus puis Terser. Terser ne lit pas le JSX ; si le code est du
    TSX (Sucrase le refuse en TypeScript seul, mais le lit en TSX), le message dit : « This code contains JSX (TSX). The
    types were removed, but Terser minifies plain JavaScript only and cannot read JSX. Compile the JSX in your build
    first, or use TypeScript to JS to remove the types only. » Autre erreur Terser : message d'origine.
  - Page (`code-minifier/page.jsx`) : le mode TS appelle `minifyTypescript(input)`.
- **Tests** : `scripts/p37/code-minifier-ts.test.mjs` (oracle : `ts.transpileModule`, sorties exécutées en vm).
  Avant : 4 passés, 3 échoués. Après : 7 passés, 0 échoué. `scripts/converter-tests/05-code-tools.mjs` : 10 / 10.
  `scripts/p37/typescript-to-js.test.mjs` : ALL PASS.
- **Texte de la page** (`layout.tsx` inchangé : il ne parle ni de TSX ni de namespace) :
  - specs « Errors » : « JavaScript and TypeScript syntax errors are shown as Error: plus the engine's message; CSS and
    HTML are never rejected » → « …engine's message; TSX and namespaces that hold code are refused with a message saying
    why; CSS and HTML are never rejected ».
  - FAQ 2 : « No. TS mode strips types without JSX support, so TSX fails with a syntax error, and a namespace is removed
    with everything inside it. Move namespace code out first, and minify TSX in your own build. » → « Not fully. A
    namespace that holds only types is removed, as tsc does; one that holds code is refused with a message giving its
    name and line, because removing types cannot turn it into JavaScript, so move that code out first. TSX is refused
    with a message saying that Terser cannot read JSX: compile it in your own build first. »
  - specs « Input languages » (« TypeScript without JSX ») reste exact.

## Contrôles de texte
- `content-verify --only=developer-tools/xml-to-json --verbose` et `--only=developer-tools/code-minifier --verbose` :
  0 échec.
- `instructions.mjs` : 225 pages, 0 écart. `privacy-claims.mjs` : 0 échec.
- Aucune entrée `docs/audit/p36/preuves` n'était nécessaire (aucun chiffre ajouté).

## Remarques
- Le mode TS du minifieur n'a jamais eu de détection `return <` : il n'activait pas le JSX du tout.
- Pas de test navigateur : les deux corrections sont dans des modules testés sous Node ; les pages ne font qu'appeler
  `validateXml` et `minifyTypescript`. Syntaxe des deux `page.jsx` vérifiée par une transformation Sucrase.
