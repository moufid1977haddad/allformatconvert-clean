# P37 lot 1 — dev-code : TypeScript to JS, API Tester, dépendance csso

Date : 06/10. Branche p37, rien n'est commité (le contrôleur commite).
Sorties complètes avant/après : `scripts/p37/<test>.before.txt` et `scripts/p37/<test>.after.txt`.

## Bug 1 — TypeScript to JS (gravité 1 : résultat faux, perte de code)

Transpileur utilisé : **Sucrase 3.35.1** (`transform`, transforms `typescript` et parfois `jsx`), chargé dans le navigateur.

### Reproduction
- Namespace : `namespace A { export const x = 1 } console.log(A.x)` donne `console.log(A.x);`. Le namespace disparaît sans message. À l'exécution : `ReferenceError: A is not defined`. tsc donne `1`.
- JSX : la page n'activait le JSX que si le code contenait `return <` ou `return (<`. `const C = () => <div/>`, `const el = <span/>` et `render(<>…</>)` échouaient avec « Unexpected token » (gravité 2).

### Correction
- Nouveau module `app/lib/typescriptToJs.js` (`convertTypescript`), utilisé seulement par la page.
- JSX : le code est d'abord lu comme un fichier .ts (où `<any>x` est un cast). En cas d'échec, il est relu comme .tsx. Si les deux échouent, on montre l'erreur de la lecture allée le plus loin (ligne:colonne gardée).
- Namespace : le parseur de Sucrase repère chaque `namespace X {}` / `module X {}`. Si son contenu produit du JavaScript une fois les types retirés, la conversion s'arrête avec un message : `namespace "A" (line 1) contains code, not only types. … Move that code out of the namespace, or compile this file with tsc.` Les namespaces de types seuls et les blocs `declare` sont retirés, comme tsc le fait.
- Le nom est entre guillemets : le nettoyage du journal d'erreurs (`reportError.js`) le retire.
- Sucrase est chargé par ses entrées CommonJS (`sucrase/dist/index.js`, `sucrase/dist/parser`) : une seule copie du parseur dans le bundle, et Node exécute le même fichier dans le test.
- `app/lib/codeTools.js` n'est pas modifié (partagé). Son `typescriptToJs` reste utilisé par Code Minifier.

### Test
`node scripts/p37/typescript-to-js.test.mjs`. Oracle : `ts.transpileModule` (TypeScript 5.9.3, devDependency). Les deux sorties sont exécutées dans un contexte vm et comparées.
- Avant : **9 FAILED** (4 cas JSX « Unexpected token », 5 namespaces perdus en silence, par ex. `ours THROWS ReferenceError: A is not defined / tsc 1 2`).
- Après : **ALL PASS** (22 cas : JSX après `=>`, en variable, en argument, générique `<T,>` ; casts `<number>` sans JSX ; 5 namespaces avec code refusés par leur nom ; 6 namespaces de types / `declare` / `declare global` retirés sans faux refus ; `namespace` et `module` comme noms de variables ; enum, propriétés de constructeur, satisfies ; erreur de syntaxe avec ligne:colonne).
- Note : après la sortie « avant », la comparaison JSX ignore les espaces (tsc réécrit `<span />` en `<span/>`). Le cas concerné échouait de toute façon avant (« Unexpected token »).
- `node scripts/converter-tests/05-code-tools.mjs` : 10/10 (codeTools inchangé).

### Comparaison au marché
- tsc compile un namespace en objet rempli par une fonction (IIFE). Babel (`plugin-transform-typescript`) et esbuild le compilent aussi. Sucrase 3.35.1 le supprime sans message (vérifié ci-dessus).
- tsc choisit le JSX selon l'extension (.ts / .tsx). Un texte collé n'a pas d'extension : d'où la lecture .ts puis .tsx.

### Textes de la page (`typescript-to-js/page.jsx`)
- About : « Two limits: a namespace is deleted together with any values inside it, and JSX is only recognized when a component returns it after the return keyword. » → « JSX is recognized wherever it appears. … A namespace that holds only types is removed; one that holds code stops the conversion with a message, because Sucrase cannot compile it. »
- Étape 3 : « …and the line:column of the problem. » → « …and the line of the problem (line:column for a syntax error). »
- Spec Input : « …; JSX only when a return is followed by a tag » → « TypeScript source pasted as text, with or without JSX ».
- Spec Not supported : « Namespaces (removed with their contents), … » → « Namespaces that hold code (the conversion stops and names them), … ».
- FAQ TSX : « Yes, but only when JSX is enabled… fails with an Unexpected token error. » → « Yes. The code is first read as a .ts file… so JSX works after return, after =>, in a variable or as an argument. The tags are kept as written. »
- FAQ namespaces : « No. A namespace is removed together with everything inside it… no warning is shown. » → « Only namespaces that hold types alone, and declare namespace blocks… A namespace that holds functions, constants or other code is not compiled; the output then shows an error with its name and line… »
- `layout.tsx` : inchangé (toujours exact). L'exemple de la page donne toujours la même sortie (vérifié).

### Reporté (avec estimation)
Compiler vraiment les namespaces, comme tsc. Il faut changer de transpileur : `ts.transpileModule` (TypeScript 5.9.3 déjà installé, à passer en `dependencies`).
- Coût : environ 0,5 à 1 jour. Ajouter dans `next.config.ts` (fichier partagé) des alias navigateur vides pour `fs`, `path`, `os`, `crypto`, `perf_hooks`, `inspector`, `source-map-support` (requis par typescript.js, même méthode que `browserFsStub.js` pour quicktype). Puis un `next build` et un passage navigateur.
- Poids : `typescript.js` fait 9,1 Mo non minifié (mesuré). Estimation : environ 3,5 Mo minifié, 0,8 Mo compressé, chargé seulement au clic sur Convert. Pas d'autre dépense.
- Non fait ici : fichier partagé hors périmètre, et build interdit dans ce lot.

## Bug 2 — API Tester (gravité 1)

Pas de route serveur : la page appelle `fetch()` directement depuis le navigateur. Aucune vérification de sécurité serveur à garder.

### Reproduction
- Adresse relative : `fetch('/api/users')` est résolu contre la page. La requête part vers `https://www.onlineconvertools.com/api/users`, avec les en-têtes tapés (Authorization) et le corps. `api.example.com/users` et `127.0.0.1:8080/x` partent aussi vers notre site. `localhost:3000/api` et `ftp://…` échouent avec un message de réseau peu clair.
- Content-Type : en-têtes `{"content-type": "text/plain"}` + corps → un seul en-tête envoyé avec deux valeurs : `application/json, text/plain`.
- En-têtes `null`, `42`, `"x"` ou un tableau : acceptés sans message clair.

### Correction
- Nouveau module `app/lib/apiTesterRequest.js` (`buildApiRequest`), utilisé seulement par la page.
- L'adresse (espaces retirés) doit être une URL absolue `http:` ou `https:`. Sinon : « Type the full address of the API, starting with https:// or http:// (for example https://api.example.com/users). The request was not sent. » Rien ne part.
- Un Content-Type tapé, quelle que soit la casse, remplace `application/json`. Un seul en-tête, une seule valeur.
- Les en-têtes doivent être un objet JSON. Sinon : « Headers must be a JSON object… The request was not sent. » Ces messages ne contiennent aucune donnée tapée.
- Page : `fetch(req.url, req.init)` avec le résultat du module.

### Test
`node scripts/p37/api-tester.test.mjs`
- Avant : **14 FAILED** (par ex. `refused: "/api/users" -- fetch would go to https://www.onlineconvertools.com/api/users` ; `user content-type replaces the default -- sent: application/json, text/plain`).
- Après : **ALL PASS** (21 cas).

### Comparaison au marché
- Postman : sans protocole, il ajoute `http://` devant l'adresse (documentation « Send a request with the Postman API client », learning.postman.com). Il n'envoie jamais vers un « site courant ». Ici, on refuse avec un message plutôt que d'ajouter le schéma en silence (règle : pas de valeur de repli silencieuse).
- Hoppscotch : comportement non vérifié (recherche sans résultat fiable).
- Noms d'en-têtes insensibles à la casse : RFC 9110 §5.1. L'objet `Headers` du navigateur fusionne deux clés de casse différente en une seule valeur « a, b » : d'où le défaut.

### Textes de la page (`api-tester/page.jsx`)
- Étape 1 : « …starting with https:// (without it, the request usually goes to this site instead, or fails). » → « …starting with https:// or http://; any other address is refused and nothing is sent. »
- Étape 3 : « …unless your headers set Content-Type written with that exact capitalization. » → « …unless your headers set Content-Type, in any capitalization. »
- Spec ajoutée « Address » : « An absolute http:// or https:// URL; a relative address such as /api/users, or one typed without http:// or https://, is refused before sending ».
- Spec Request headers : « …if it is not valid JSON, the request is not sent and the parser’s message is shown » → « …if it is not valid JSON, or not an object, the request is not sent and a message says why ».
- Spec Request body : « …replaces it, but a lowercase content-type is sent alongside it » → « …replaces it, whatever its capitalization ».
- Privacy : « When the address starts with http:// or https://, … Without it, the address is usually read as a page of this site (localhost:3000/api fails instead), so the request, headers and body included, reaches our server. » → « The request goes from your browser straight to the http:// or https:// address you type, not through our servers; an address without one of them is refused before anything is sent. » (phrase sur le journal d'erreurs inchangée).
- FAQ Content-Type : « …a key written exactly Content-Type… replaces it; written content-type, both values are sent together. » → « …a Content-Type key in your headers replaces it, written in any capitalization, so only one value is sent. »
- FAQ ajoutée « Why is my address refused? ».
- `layout.tsx` : inchangé (toujours exact).

## Bug 3 — dépendances non déclarées (gravité 3 aujourd'hui, 2 possible)

### Reproduction
`csso` est importé par `app/lib/codeTools.js` mais absent de `package.json`. Il n'est installé que parce que `svgo` en dépend (`^5.0.5`). Une mise à jour de svgo peut le changer ou l'enlever, et casser CSS Formatter et Code Minifier.

### Test
`node scripts/p37/declared-deps.test.mjs` : lit chaque import nu de `app/` et `lib/` (import, export from, `import()`, `require()`, via `ts.preProcessFile`) et vérifie qu'il est dans `dependencies`.
- Avant : **3 paquets non déclarés** :
  - `csso` 5.0.5 (`app/lib/codeTools.js`), via svgo ;
  - `fflate` 0.8.3 (`app/lib/xlsxSupplementaryChars.js`, `image-tools/gif-to-png/page.jsx`), via jspdf et @lingo-reader ;
  - `dompurify` 3.4.7 (`markdown-editor`, `markdown-previewer`, `pdf-tools/markdown-to-pdf`), via html2pdf.js et jspdf.
- Après : **ALL PASS** (790 fichiers, 770 imports nus).

### Correction
Même nature et trivial : les trois sont déclarés avec la version installée, sans toucher `node_modules`.
- `package.json` : `"csso": "5.0.5"`, `"dompurify": "3.4.7"`, `"fflate": "0.8.3"`.
- `package-lock.json` : les trois mêmes lignes dans `packages[""].dependencies`. Les entrées `node_modules/csso`, `node_modules/dompurify`, `node_modules/fflate` existent déjà, sans drapeau dev ni optional : rien d'autre à changer. Pas de `npm install`.
- `npm ls csso dompurify fflate --depth=0` : les trois sont vus comme dépendances directes, sans « invalid ». (`npm ls` signale 5 paquets `@emnapi`/`@napi-rs`/`@tybys` « extraneous » : déjà là avant, sans lien.)

## Vérifications du lot
- `node scripts/p36/content-verify.mjs --only=developer-tools/typescript-to-js --verbose` : 0 failure.
- `node scripts/p36/content-verify.mjs --only=developer-tools/api-tester --verbose` : 0 failure.
- `node scripts/content-checks/instructions.mjs` : 225 pages, 0 mismatch.
- `node scripts/content-checks/privacy-claims.mjs` : 0 failure.
- `npx eslint` sur les 4 fichiers de code touchés : 0 problème.

## À lancer dans un navigateur (contrôleur)
Le bundle Turbopack doit charger `sucrase/dist/index.js` et `sucrase/dist/parser` (CommonJS). Cela ne se prouve qu'après un build.
`node scripts/p37/dev-code-browser.mjs http://localhost:3000` (après `next build` + `next start`). Il vérifie : JSX après `=>`, refus d'un namespace avec code, cast `<number>` ; API Tester : `/api/users` refusé sans requête vers notre site, `content-type` minuscule envoyé seul (`text/plain`). L'API appelée (`https://api.p37.test/`) est simulée par `page.route()`.

## Points laissés à d'autres lots
- Code Minifier (mode TS) utilise toujours `codeTools.typescriptToJs` : même perte silencieuse des namespaces et pas de TSX. Sa FAQ le dit (« a namespace is removed with everything inside it »). Correction : appeler `convertTypescript` de `app/lib/typescriptToJs.js` puis mettre à jour sa FAQ, environ 30 min. Ensuite, `typescriptToJs` de `codeTools.js` peut être supprimé.

## Fichiers modifiés ou créés
- Modifiés : `app/tools/developer-tools/typescript-to-js/page.jsx`, `app/tools/developer-tools/api-tester/page.jsx`, `package.json`, `package-lock.json`.
- Créés : `app/lib/typescriptToJs.js`, `app/lib/apiTesterRequest.js`, `scripts/p37/typescript-to-js.test.mjs`, `scripts/p37/api-tester.test.mjs`, `scripts/p37/declared-deps.test.mjs`, `scripts/p37/dev-code-browser.mjs`, `scripts/p37/{typescript-to-js,api-tester,declared-deps}.{before,after}.txt`, `docs/audit/p37/lot1-dev-code.md`.
- Aucune entrée `docs/audit/p36/preuves/*.json` à changer (aucun nombre avec unité ajouté).
