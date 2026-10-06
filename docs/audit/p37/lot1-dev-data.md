# P37 lot 1 — outils de données développeur (06/10)

Six défauts traités, tous corrigés. Aucun report. Pas de commit (le contrôleur commite).
Tests : `scripts/p37/<outil>.test.mjs`. Sorties avant / après : `scripts/p37/out/<outil>.before.txt` et `.after.txt`.

Ordre de travail par gravité : 1 = résultat faux ou perte de données, 2 = échec, 3 = gêne.

## 1. JSON to PHP, mode classes : JSON_BIGINT_AS_STRING absent — gravité 1
- **Repro** : `{"id": 12345678901234567890}` en mode « PHP classes ». La propriété est typée `string`, mais la ligne
  `// Usage:` appelle `json_decode($json, true)`. PHP lit le nombre en float (1.2345678901235E+19) : les chiffres sont perdus.
- **Correction** (`app/lib/jsonToPhp.js`) : nouvelle fonction `hasBigInt`. S'il y a un entier au-delà de PHP_INT_MAX,
  la ligne Usage devient `json_decode($json, true, flags: JSON_BIGINT_AS_STRING)` et un commentaire dit pourquoi.
  Sans grand entier, la sortie est inchangée.
- **Test** : `scripts/p37/json-to-php.test.mjs`. Avant : 3 passés, 3 échoués. Après : 6 passés, 0 échoué.
  Suite existante `converter-tests/02` : 13/13.
- **Référence** : manuel PHP, `json_decode` (le drapeau JSON_BIGINT_AS_STRING garde la chaîne d'origine). PHP n'est pas
  installé ici : le texte généré est vérifié, pas exécuté. Les arguments nommés sont valides, la sortie exige déjà PHP 8.
- **Texte de la page** :
  - specs « Large integers » : « PHP classes: typed string, no comment; the json_decode call shown in the Usage line
    needs JSON_BIGINT_AS_STRING to keep the digits » → « PHP classes: typed string, with a comment, and the Usage line
    decodes with JSON_BIGINT_AS_STRING so the digits are kept ».
  - FAQ 3 : « In class mode the property is typed string with no comment; decode with JSON_BIGINT_AS_STRING to keep the
    digits. » → « In class mode the property is typed string, a comment says so, and the Usage line calls json_decode
    with JSON_BIGINT_AS_STRING to keep the digits. »

## 2. JSON to CSV et JSON to YAML : clés entières placées en premier — gravité 1
- **Repro** : `[{"name":"Ann","2024":5,"10":"x","2":"y"}]` donnait les colonnes `2,10,2024,name`. En YAML,
  `{"name":"a","10":"x","2":"y"}` donnait `'2'`, `'10'`, puis `name`. Cause : un objet JavaScript range les clés
  entières d'abord.
- **Correction** :
  - `app/lib/jsonLossless.js` : option `parseJsonLossless(text, { keyOrder: true })`. Chaque objet devient une `Map`
    dans l'ordre du texte. Une clé répétée garde sa première place et sa dernière valeur, comme JSON.parse.
    Sans l'option, rien ne change pour les autres outils.
  - `app/lib/jsonToCsv.js` : lecture avec `keyOrder`, `flatten` accepte une Map.
  - `app/lib/yamlJson.js` (`jsonToYaml` seulement) : les clés qu'un objet déplacerait (index de tableau, 0 à
    4294967294) passent à js-yaml sous un marqueur, puis sont remises telles que js-yaml les écrit seules (`'10'`).
    Les guillemets restent donc ceux de js-yaml. Un compte vérifie le remplacement (erreur, jamais de sortie fausse).
- **Tests** : `scripts/p37/json-to-csv.test.mjs` : avant 1 / 4 échoués, après 5 / 0.
  `scripts/p37/json-to-yaml.test.mjs` : avant 2 / 4 échoués, après 6 / 0 (dont relecture par js-yaml identique).
  Suites existantes `converter-tests/01` (9) et `02` (13/13) : vertes.
- **Référence** : Python `json.loads` garde l'ordre d'écriture (oracle exécuté dans le test CSV). yq et PyYAML
  (`sort_keys=False`) gardent aussi l'ordre de la source.
- **Texte de la page** :
  - json-to-csv, About : « in first-seen order (keys that are whole numbers, such as 10, come first); » → « in first-seen
    order, keys such as 10 included; ».
  - json-to-csv, FAQ 2 : « in the order they first appear (whole-number keys first), and » → « in the order they first
    appear in the JSON, and ».
  - json-to-yaml, specs « Key order » : « as in the JSON, except keys that are whole numbers, which come first » → « as in
    the JSON, keys such as 10 included ».

## 3. JSON to Python : note `//` invalide — gravité 2
- **Repro** : `{"id": 12345678901234567890}`. La sortie commençait par `// Note: … typed as a float here…`.
  `model.py` donne une SyntaxError. La note était aussi fausse : le champ est typé `int`.
- **Correction** (`app/lib/jsonCodegen.js`, une ligne) : pas de note pour Python. L'`int` de Python n'a pas de limite
  et `json.loads` garde tous les chiffres, donc `int` est juste. TypeScript, Go, C# et Rust gardent leur note `//`.
- **Test** : `scripts/p37/json-to-python.test.mjs` (oracle : Python 3.14, `py_compile` et `json.loads`).
  Avant : 3 passés, 3 échoués (SyntaxError). Après : 6 passés, 0 échoué. La dataclass construite depuis `json.loads`
  garde `12345678901234567890 -98765432109876543210`.
- **Référence** : la documentation Python (int sans limite, `json` lit les entiers en int).
- **Texte de la page** : aucune phrase ne parlait de cette note. Rien à changer.

## 4. .env to JSON : fichier toujours nommé env.json — gravité 3
- **Repro** : « JSON to .env » puis « Download » donnait `env.json`, avec des lignes .env dedans.
- **Correction** : nouveau module `app/tools/developer-tools/env-to-json/downloadName.js`
  (`env.json` pour du JSON, `variables.env` pour des lignes .env ; une direction inconnue lève une erreur).
  La page garde la direction du dernier résultat (`direction`) et passe `downloadName(direction)`.
- **Pourquoi pas `.env`** : Chrome et Firefox retirent le point initial d'un nom de téléchargement (pas de fichier caché).
  L'utilisateur aurait reçu `env`, sans extension. La page dit de renommer en .env.
- **Test** : `scripts/p37/env-to-json.test.mjs`. Avant : 1 passé, 3 échoués. Après : 4 passés, 0 échoué.
- **Texte de la page** : étape 4 « Click "Copy", or "Download": the file is named env.json in both directions. » →
  « Click "Copy", or "Download": env.json for JSON, variables.env for .env lines (rename it to .env). »

## 5. Excel to CSV : pas de reconversion après un changement d'option — gravité 3
- **Repro** : choisir un fichier, puis changer « Separator », « Decimal comma » ou « Add a UTF-8 BOM ». Le CSV proposé
  gardait les anciens réglages.
- **Correction** (`app/tools/developer-tools/excel-to-csv/page.jsx`) : un `useEffect` sur les trois options relance la
  conversion du fichier choisi, si aucune conversion ne tourne. Les options sont déjà désactivées pendant une
  conversion. Rien ne se passe au premier rendu ni sans fichier.
- **Test** : navigateur seulement (état React + Web Worker). Script Playwright `scripts/p37/excel-to-csv-reconvert.mjs`,
  non exécuté ici (interdit de lancer next). À lancer par le contrôleur :
  `node scripts/p37/excel-to-csv-reconvert.mjs http://localhost:3000` (après `next start`, ou une préversion via le
  proxy habituel). Avant correction, l'étape « Separator changed to ; » doit échouer (« no new CSV within 15 s »).
  Les CSV attendus ont été vérifiés en exécutant le vrai worker sous Node :
  `Item,Price\nTea,12.5\nCafé,3` puis `Item;Price\nTea;12,5\nCafé;3`.
- **Référence** : convertcsv.com et tableconvert.com refont la sortie dès qu'une option change.
- **Texte de la page** :
  - étape 1 : « …if you need them: they apply to the next file you choose. » → « …if you need them; changing one after
    choosing the file converts it again. » (et « Set "Separator" first, » → « Set "Separator", »).
  - FAQ 2 : « Set these before choosing the file, because the conversion starts as soon as the file is picked. » →
    « Changing them after choosing the file converts it again with the new settings. »
- **À noter** : un autre agent a changé dans ce même fichier « phones, iPhone and iPad » en « phones and tablets »
  (specs et FAQ 5). Ce n'est pas mon changement ; je ne l'ai pas touché.

## 6. XML to JSON : pas de position d'erreur — gravité 3
- **Repro** : `<a>\n  <b>&</b>\n</a>` affichait « Invalid XML: char '&' is not expected. », sans ligne ni colonne.
- **Correction** : nouveau module `app/tools/developer-tools/xml-to-json/xmlError.js` (`xmlErrorMessage`). Il ajoute
  « (line L, column C) » à partir de `err.line` / `err.col` du validateur ; « (line L) » s'il n'y a pas de colonne.
  La page l'utilise.
- **Test** : `scripts/p37/xml-to-json.test.mjs`. Avant : 0 passé, 5 échoués. Après : 5 passés, 0 échoué.
- **Référence** : xmllint et le DOMParser des navigateurs donnent la ligne ; codebeautify aussi.
- **Texte de la page** :
  - About : « Malformed XML is reported with the parser's message, which gives the position for a mismatched closing
    tag, instead of a partial result. » → « Malformed XML is reported with the parser's message and the line and column
    of the error, instead of a partial result. »
  - FAQ 4 : « Yes. The XML is validated first; a mismatched tag gives a message such as Expected closing tag 'b' (opened
    in line 1, col 4) instead of closing tag 'a'. » → « Yes. The XML is validated first, and the message ends with the
    line and column of the error, as in char '&' is not expected. (line 2, column 6). »

## Contrôles de texte
- `content-verify --only=developer-tools/<slug> --verbose` : 0 échec pour env-to-json, excel-to-csv, json-to-csv,
  json-to-yaml, xml-to-json, json-to-php, json-to-python.
- `instructions.mjs` : 225 pages, 0 écart. `privacy-claims.mjs` : 0 échec.
- Aucune entrée `docs/audit/p36/preuves` n'était nécessaire.

## Reports et remarques (non corrigés, hors liste)
- XML to JSON : `<a></a><c/>` (deux racines) passe la validation de fast-xml-parser. Ce n'est pas du XML bien formé.
  Correction possible : un contrôle « une seule racine » dans `xmlError.js`, environ 1 h avec test. Non fait : hors liste.
- La note « typed as a float » des autres langages (Go, TypeScript, C#, Rust) n'a pas été revérifiée.
- Fichiers partagés modifiés (sans changer le comportement des autres outils) : `jsonLossless.js` (option ajoutée,
  défaut inchangé), `jsonCodegen.js` (branche Python seulement), `yamlJson.js` (`jsonToYaml` seulement).
