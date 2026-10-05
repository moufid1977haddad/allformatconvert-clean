# P36 lot 2 — audit « dev-code » (18 outils développeur : JSON→code, formateurs, minifieurs)

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

## Tableau des défauts

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

## Synthèse du lot dev-code

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
