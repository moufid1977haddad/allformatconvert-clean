# P36 — relecture indépendante, lot « dev-misc » (13 pages developer-tools)

Relu le 05/10/2026 contre le code (page.jsx, layout.tsx, `app/lib/*`, `app/components/*`), sans me fier aux fiches de faits
ni au compte rendu de rédaction. Lecture seule ; aucun fichier du site modifié.

**Exemples ré-exécutés dans Node 24.14 (ICU 78.2), avec le code de l'outil** (scripts hors dépôt, dossier scratchpad) :
api-tester (`reformatJson` de `app/lib/jsonText.js`) ; aspect-ratio (lignes 10-33 de `page.jsx` exécutées telles quelles) ;
color-picker (`hexToRgb`) ; cron-expression et builder (`cronInfo` recopié à l'identique de `app/lib/cronInfo.js` avec
cron-parser 5.10.1 / cronstrue 3.27.0 du dépôt, `splitCron` extrait de `app/components/CronPaste.jsx`, `TZ=UTC`,
`from` = 2026-10-06T12:00Z, format `toLocaleString('en-US', …)` de la page) ; diff-viewer (`diffLines` de
`app/lib/codeTools.js` + appariement mot à mot de `page.jsx:17-27`, jsdiff du dépôt) ; markdown-editor / previewer /
to-html (`marked` 18.0.4 du dépôt, `gfm: true`, enveloppe de `markdown-to-html/page.jsx:15`) ; password-generator
(`EFF_WORDS` de `app/lib/effWordlist.js`, alphabet et formule de bits de `page.jsx:44,49-53,71`) ; regex-tester (chaîne
`WORKER` de `page.jsx:11-24` exécutée avec un `self` simulé) ; timestamp-converter (`parseTimestamp`, `describe`,
`describeZone`, `parseInZone` de `app/lib/timestamp.js`) ; uuid-generator (décodage des 48 bits d'horodatage).
**Résultat : les 13 exemples donnent exactement la sortie affichée**, sauf les réserves de légende notées ci-dessous
(lignes D4, E3, I3). Le nettoyage des messages d'erreur (`sanitizeErrorMessage`, `app/lib/reportError.js:72-122`) a été
exécuté sur les vrais messages V8 : les réserves écrites par api-tester et regex-tester sont exactes.

Contrôle automatique `node scripts/p36/content-verify.mjs --only=developer-tools/` : 0 échec (titres ≤ 60, méta 110-155,
About 89-117 mots, 3-4 étapes, 3-4 FAQ, preuves C3). Phrases identiques (normalisées) entre une de mes pages et
n'importe quelle page du site : **aucune**. Jumeaux : cron-expression / builder et markdown-editor / previewer : aucun
segment de 6 mots commun ; diff-viewer / text-comparator : deux phrases quasi identiques (F1, F2).

## Défauts

| # | Page | Endroit | Phrase (citation courte) | Problème | Preuve (fichier:ligne ou calcul) | Correction proposée |
|---|---|---|---|---|---|---|
| A1 | api-tester | `privacy` (et About « to the address you type ») | « it never passes through our servers » | **3 — Lieu de traitement.** Une adresse tapée sans `http://`/`https://` (ex. `api.example.com/users`) est une URL relative : `fetch` la résout contre l'adresse de la page et envoie la requête, **avec les en-têtes tapés (Authorization) et le corps**, à www.onlineconvertools.com, qui répond 404. La promesse « never » est donc fausse dans ce cas. | `page.jsx:44` champ texte libre, `page.jsx:24` `fetch(url, opts)` sans contrôle du schéma ; règle Fetch : URL relative résolue contre l'URL de base du document | Texte : « The request goes from your browser straight to the API you name, as long as the address starts with http:// or https://; an address without it is read as a page of this site, so the request, its headers and its body reach our server. » Mieux (décision propriétaire, code) : refuser une adresse sans schéma avant `fetch`. |
| A2 | api-tester | étape 3, spec « Request body », FAQ 3 | « unless your headers set another Content-Type » / « a Content-Type you type in the headers replaces it » | **1 — Exactitude.** Le remplacement n'a lieu que si la clé est écrite exactement `Content-Type`. Écrite `content-type` (forme courante), les deux clés coexistent et le navigateur envoie `application/json, text/plain`. | `page.jsx:22` `{ 'Content-Type': 'application/json', ...extra }` (clés sensibles à la casse) ; Node : `new Headers({'Content-Type':'application/json','content-type':'text/plain'}).get('content-type')` → `application/json, text/plain` | « …unless your headers set Content-Type, written with that exact capitalization (a lowercase content-type is added to it, not substituted). » Ou corriger le code (fusion insensible à la casse). |
| B1 | aspect-ratio | FAQ 1, réponse | « Enter the original width and height… » | **6 — Structure.** La réponse ne commence ni par Yes / No ni par un chiffre. | `page.jsx:90` | Q : « Can it keep the aspect ratio when I resize an image? » R : « Yes. Enter the original width and height, then… » |
| B2 | aspect-ratio | FAQ 1, réponse | « which is 719.65 before rounding » | **1 — Exactitude.** 719.65 est déjà un arrondi ; la valeur avant arrondi est 719.6486…, et la page affiche « ≈ 719.648609 ». | Calcul : 1280 × 768 / 1366 = 719.648609… ; sortie Node de `fit()` : `{"exact":"≈ 719.648609","px":720}` | « …a height of 720, rounded from about 719.65 (the page shows ≈ 719.648609). » |
| C1 | color-picker | FAQ 1, réponse | « Because the code is not six hexadecimal digits. » | **6 — Structure.** Réponse commençant par « Because ». | `page.jsx:49` | Q : « Does the RGB card read short codes such as #f80? » R : « No. Only six hexadecimal digits are converted… » |
| D1 | cron-expression | étape 3 | « a red message names the field that is wrong » | **1 — Exactitude (comportement).** Le message ne nomme aucun champ : il donne la valeur et la plage. | `app/lib/cronInfo.js:18` ; Node : `cronInfo('99 * * * *')` → « Invalid cron expression: Constraint error, got value 99 expected range 0-59 » ; idem `* 25 * * *` (0-23), `* * 32 * *` (1-31) | « …a red message gives the wrong value and the range it should be in. » |
| D2 | cron-expression | spec « Not read » | « Six- or seven-field Quartz, Spring and AWS expressions: a note explains how to shorten them » | **1 — Exactitude.** Une expression AWS a 6 champs **sans secondes** (minute heure jour mois jour-semaine **année**). La note dit de retirer « the seconds field (first) » : appliquée à AWS, elle supprime les minutes et donne un autre horaire. | `app/components/CronPaste.jsx:49-50` ; Node : `splitCron('0 12 * * ? *')` → note « drop the seconds field (first) and the year field (seventh) » | Retirer « AWS » de la ligne, ou écrire : « AWS expressions (six fields, the last is the year): drop the year to read them; the note's advice about seconds does not apply to them. » (Le texte de la note elle-même est à corriger dans le code.) |
| D3 | cron-expression | About ; FAQ 1 | « the command after it is left out with a note » ; « A line that starts with a macro such as @daily is expanded first. » | **1 — Exactitude.** Pour une ligne qui commence par une macro, la commande est abandonnée **sans** note sur la commande : la note dit seulement « @daily means 0 0 * * *. ». La FAQ laisse entendre que la même note suit. | `CronPaste.jsx:41-43` ; Node : `splitCron('@daily /bin/x')` → `{ fields: ['0','0','*','*','*'], note: '@daily means 0 0 * * *.' }` | FAQ : « A line that starts with a macro such as @daily is expanded and its command dropped; the note then gives only the macro's meaning. » |
| D4 | cron-expression | légende de l'exemple | « they are listed for a visitor whose time zone is UTC (the page uses yours) » | **7 — Exemple.** Le format « Mon, Oct 12, 2026, 02:30 AM » est celui d'un navigateur en anglais américain ; la page formate dans la langue du navigateur (`undefined`), pas seulement dans son fuseau. | `page.jsx:38` `d.toLocaleString(undefined, {…})` ; sortie reproduite avec `'en-US'` uniquement | « …listed for a visitor in UTC whose browser is set to US English (the page uses your zone and language). » |
| D5 | cron-expression | About, dernière phrase | « Six presets cover the most common schedules. » | **4 — Invérifiable.** « the most common » : aucune mesure de fréquence. | `page.jsx:20` (liste seule) | « Six presets fill in schedules from every minute to once a year. » |
| E1 | cron-expression-builder | About | « …or the faulty field is named » | **1 — Exactitude.** Même cause que D1 : le message donne valeur et plage, jamais le nom du champ. | `app/lib/cronInfo.js:18` ; même exécution Node que D1 | « …or the wrong value is reported with its allowed range. » |
| E2 | cron-expression-builder | FAQ 3, réponse | « the next runs list skips February, April, June, September and November » | **1 — Exactitude.** La liste ne montre que 5 dates : depuis octobre 2026 elle donne 31 oct., 31 déc., 31 janv., 31 mars, 31 mai — juin et septembre n'y figurent jamais ; la phrase décrit le calendrier, pas la liste. | Node : `cronInfo('0 0 31 * *', {from: 2026-10-06T12:00Z})` → Oct 31, Dec 31, Jan 31, Mar 31, May 31 | « No. It runs only in months that have a 31st day, so February, April, June, September and November are skipped; the five runs listed jump from 31 October to 31 December, for example. » |
| E3 | cron-expression-builder | légende de l'exemple | « run times listed for a visitor whose time zone is UTC (the page uses yours) » | **7 — Exemple.** Comme D4 : format en-US supposé, la page suit la langue du navigateur. | `page.jsx:40` `toLocaleString(undefined, …)` | Ajouter « and whose browser is set to US English ». |
| F1 | diff-viewer | étape 2 | « Tick "Ignore case" or "Ignore whitespace" if those differences do not matter to you. » | **5 — Générique / doublon jumeau.** Quasi identique à l'étape 2 de Text Comparator : « Tick "Ignore case" or "Ignore spaces" if those differences do not matter. » (seuls le libellé et « to you » changent). Consigne : aucune phrase commune avec text-comparator. | `diff-viewer/page.jsx:67` ; `text-tools/text-comparator/page.jsx` (howTo, 2ᵉ étape) | « Tick "Ignore whitespace" to stop re-indented lines from showing as removed and added, and "Ignore case" for changes of capitals only. » |
| F2 | diff-viewer | FAQ 1, réponse | « spaces at the start and end of each line are dropped and runs of spaces count as one… ab and a b, still counts as a change » | **5 — Doublon jumeau.** Même contenu, même ordre et même exemple (ab / a b) que la FAQ « Can it ignore extra spaces? » de Text Comparator (« ignores spaces at the start and end of each line and treats several spaces as one… a b and ab differ »). | `diff-viewer/page.jsx:81` ; `text-comparator/page.jsx` (1ʳᵉ FAQ) ; segments de 7 mots communs relevés par script | Réécrire sur l'indentation propre au code : « Yes. With "Ignore whitespace" ticked, a line moved from 2 to 4 spaces of indentation is listed once as unchanged, with its old line number and its new one; a tab and a space also compare as equal. Spaces inserted inside a word still count. » (tab = espace : `codeTools.js:53` `\s+` → ' ') |
| G1 | password-generator | spec « Passphrase » | « six separators » | **1 — Exactitude.** Le menu offre 5 séparateurs (tiret, espace, point, souligné, virgule) et « None ». | `page.jsx:89` | « five separators or none ». |
| G2 | password-generator | FAQ 3, réponse | « Six characters: zero, capital O… » | **6 — Structure** (mineur). Commence par un nombre écrit en lettres, pas par un chiffre. | `page.jsx:144` | « 6 characters: zero, capital O, … » |
| G3 | password-generator | astuce 1 | « a passphrase of six words or more with "Capitalize" on is easier to enter than random characters » | **4 — Invérifiable** (confort de saisie non mesuré ; « Capitalize » ajoute des majuscules, donc des touches Maj, ce qui contredit « easier »). | `page.jsx:148` | « For a master password you type by hand, six words give 77 bits using only letters and the separator you pick. » |
| H1 | regex-tester | astuce 1 | « Escape a literal dot with a backslash… » | **5 — Générique.** Conseil vrai sur n'importe quelle page d'expressions régulières. | `page.jsx:131` | Astuce propre à l'outil : « Type a backslash once, as between /…/: \d in Pattern is a digit, while \\d would match a backslash followed by d. » (le champ est passé brut à `new RegExp`, `page.jsx:15` du worker) |
| I1 | uuid-generator | FAQ 1, réponse | « v7 in most cases: … » | **6 — Structure.** Réponse ne commençant ni par Yes / No ni par un chiffre. | `page.jsx:88` | Q : « Is v7 better than v4 for database keys? » R : « Yes, in most cases: its first 48 bits are the creation time… » |
| I2 | uuid-generator | FAQ 1, réponse | « which keeps inserts compact » | **4 — Invérifiable.** Gain de performance d'index non mesuré dans le dépôt (le code prouve seulement l'ordre). | `page.jsx:17-24` (ordre seul) ; aucun rapport daté | « …so new keys sort after older ones and are added at the end of an index ordered by key. » |
| I3 | uuid-generator | légende de l'exemple | « Three v7 UUIDs made by the page's own code on 5 October 2026 at 23:53:33.378 UTC » | **7 — Exemple.** Seul le premier UUID porte 23:53:33.378 ; les deux autres portent 0x01A10E7CA9C9 = 23:53:33.385 (7 ms plus tard). | Node : `new Date(0x01A10E7CA9C2)` → 2026-10-05T23:53:33.378Z ; `new Date(0x01A10E7CA9C9)` → …33.385Z | « Three v7 UUIDs made in one click: the first at 23:53:33.378 UTC (01A10E7C-A9C2), the last two 7 ms later in the same millisecond (A9C9), so the counter goes from 763F to 7640. » |

## Vérifié sans défaut (extraits)
- api-tester : méthodes, corps caché pour GET (`page.jsx:47`), couleurs de statut (`:49`), pas de délai, en-têtes de réponse
  non affichés, exemple 64 bits / 1.10 (sortie identique), réserve sur le nettoyage : V8 rend
  `Unexpected token 'B', ..."ization": Bearer abc"... is not valid JSON` et le nettoyage laisse « Bearer abc » — la phrase
  « a few characters of a mistyped header can remain » est exacte.
- aspect-ratio : 683:384 / 1.7786 / 720 (≈ 719.648609), 2.39:1 → 239:100, 1e3 lu, 0 / négatif / vide → « — », 5 préréglages.
- color-picker : #ff8800 → 255,136,0 ; copie `rgb(255,136,0)` ; sans # l'aperçu garde l'ancienne couleur (valeur CSS
  invalide ignorée) et le sélecteur `type=color` passe à #000000 (assainissement HTML) ; Color Converter couvre bien
  HEX/RGB/HSL/HSV/CMYK avec un sélecteur natif.
- cron (les deux) : exemples (crontab `30 2 * * 1 …` et « Every weekday ») identiques ; MON/JAN compris
  (`0 9 * JAN MON-FRI` → « At 09:00, Monday through Friday, only in January ») ; macros et @reboot ; 6 / 8 préréglages.
- diff-viewer : exemple identique ; CRLF/CR/LF égaux ; appariement mot à mot ; plafond d'affichage 1 000 000 / 20 000.
- markdown-editor / previewer / to-html : sorties `marked` identiques aux trois exemples ; DOMPurify 3.4.7 garde
  `input`, `checked`, `disabled`, `type` ; `document.html` sans head ; question « Leave page? » levée après un
  téléchargement ou la copie du texte entier (`FileDownload.jsx` `textTaken`, `DownloadGroup alternatives`) ; maths et
  mermaid restent texte / bloc de code ; enveloppe UTF-8 et absence de nettoyage dans Markdown to HTML.
- password-generator : 82 caractères sans sosies → 101 bits « excellent » ; 6 mots 77, 8 mots 103, 6 mots + chiffre 83 ;
  mots de l'exemple tous dans la liste EFF (7 776) ; chaque type coché présent (tirage rejeté sinon).
- regex-tester : positions 9–16 / 26–33, groupes, remplacement « Released 03/2024, updated 11/2025. » ; sans g, seul le
  premier est remplacé ; `a++`, `(?>a)`, `(?P<name>x)` rejetés ; un motif invalide avec `<` passe tel quel dans le message
  nettoyé (réserve de la page exacte).
- timestamp-converter : 1700000000000 → millisecondes, `2023-11-14T22:13:20.000Z`, « Tuesday, 14 November 2023 at
  17:13:20 (UTC−05:00) » ; -86400 → 1969-12-31 ; 1700000000.5 → …500 ms ; décimales ignorées hors secondes ; bornes
  -271821 / 275760 ; heure sautée refusée, heure doublée signalée (60 min).
- uuid-generator : v4 = 30 × 4 + 2 = 122 bits aléatoires sans biais (256 % 16 = 0) ; v7 conforme (48 bits ms, version 7,
  compteur 12 bits, variante 10) ; compteur 763F → 7640 ; nil unique ; accolades après les autres options.

## Bilan
- Pages relues : **13**.
- Défauts : **22** — par point de la liste : 1 Exactitude **8** (A2, B2, D1, D2, D3, E1, E2, G1) ; 2 Libellés **0** ;
  3 Lieu de traitement **1** (A1) ; 4 Invérifiable **3** (D5, G3, I2) ; 5 Générique / doublon **3** (F1, F2, H1) ;
  6 Structure **4** (B1, C1, G2, I1) ; 7 Exemple **3** (D4, E3, I3).
- Les plus graves : A1 (promesse « never passes through our servers » fausse pour une adresse sans schéma, en-têtes
  d'autorisation compris) ; D1 / E1 (« names the field » : faux, sur les deux pages cron) ; D2 (conseil faux pour AWS).
- Pages **sans aucun défaut** : markdown-editor, markdown-previewer, markdown-to-html, timestamp-converter.
- Bugs de code relevés au passage (hors texte, à planifier par le propriétaire) : `fetch` accepte une URL relative
  (api-tester) ; fusion de Content-Type sensible à la casse (api-tester) ; note Quartz/AWS de `CronPaste.jsx:50` fausse
  pour AWS ; commande d'une ligne-macro abandonnée sans note (`CronPaste.jsx:43`).

## Deuxième passe (06/10/2026)

Relu en entier : les 13 pages (props `SeoContent` + `metadata`), avec la liste de contrôle et les « Précisions pour les
corrections après relecture » de `CONSIGNES-REDACTION.md` (FAQ, tablettes Android, rapports d'erreur, phrases bannies).
`content-verify --only=developer-tools/` : 0 échec ; titres 52-59, méta 138-155, About 89-117 mots, toutes les FAQ
commencent par Yes / No / un chiffre ou la réponse directe ; aucune phrase identique avec une autre page du site ; jumeaux
cron ×2 et markdown ×2 : aucun segment de 6 mots commun ; diff-viewer / text-comparator : plus de phrase quasi identique
(seul fragment commun : « the first time you click Compare »). Aucune mention téléphone / tablette sur ces pages.

**Les 22 corrections sont exactes** : vérifiées contre le code (A2 `page.jsx:22` ; D1/E1 message réel « got value 99
expected range 0-59 » ; D3 `splitCron('@daily /bin/x')` ; E2 31 oct. → 31 déc. ; F2 `codeTools.js:53` `\s+` → espace,
indentation 2 → 4 listée une fois avec ses deux numéros ; G1 `page.jsx:89` ; regex : astuce affichée `\d` / `\\d`, exacte ;
I3 0x01A10E7CA9C2 = 23:53:33.378Z, 0x01A10E7CA9C9 = +7 ms). Défauts restants, dont un nouveau introduit par D2 et un
apporté par la nouvelle règle sur les rapports d'erreur :

| # | Page | Endroit | Phrase (citation courte) | Problème | Preuve (fichier:ligne ou calcul) | Correction proposée |
|---|---|---|---|---|---|---|
| R1 | api-tester | `privacy`, 3ᵉ phrase | « its message is sent to our error log… after URLs, quoted text and long numbers are removed » | **3 — Rapports d'erreur (précision du 06/10).** Ne dit pas tout ce qui part : le nom de l'outil, le type d'erreur et le nom + la version majeure du navigateur partent aussi. | `app/lib/reportError.js:142-155` (payload `tool`, `errorType`, `errorMessage`, `browser`) ; `useToolError.js:29` | « …its cleaned message is sent to our error log with the tool's name and your browser's name and version, after URLs, quoted text and long numbers are removed. » |
| R2 | api-tester | étape 1 ; `privacy`, 2ᵉ phrase | « (without it, the request goes to this site instead) » ; « An address typed without it is read as a page of this site » | **1 — Exactitude.** Vrai pour `api.example.com/users` ou `127.0.0.1:8080/x`, faux pour une adresse de forme `nom:port` comme `localhost:3000/api` : le navigateur lit « localhost: » comme un schéma, la requête échoue et ne part pas vers notre site. | `new URL('localhost:3000/api', <page>)` → `localhost:3000/api` (schéma `localhost:`) ; `new URL('api.example.com/users', <page>)` → `https://www.onlineconvertools.com/tools/developer-tools/api.example.com/users` | Étape 1 : « …starting with https:// (without it, the request usually goes to this site instead, or fails). » ; privacy : « An address typed without it is usually read as a page of this site (an address such as localhost:3000/api fails instead), so that request… ». |
| R3 | cron-expression | spec « Not read » (nouveau texte de D2) | « for AWS expressions, whose sixth field is the year, delete only that year field » | **1 — Exactitude.** Supprimer seulement l'année ne suffit pas si le jour de la semaine est numérique : AWS numérote 1 = dimanche … 7 = samedi, le cron standard 0 = dimanche. `0 10 ? * 2 *` (lundi chez AWS) devient `0 10 ? * 2`, lu ici « only on Tuesday ». | Node, cron-parser/cronstrue du dépôt : `0 10 ? * 2` → « At 10:00, only on Tuesday », prochaine exécution 2026-10-13 (mardi) | « …delete only that year field, and lower a numeric day of week by one (AWS counts 1 = Sunday) or write it as a name such as MON. » |
| R4 | color-picker | `privacy`, 1ʳᵉ phrase | « no request is made to our servers » | **3 — Lieu de traitement (précision du 06/10 : pas de promesse « aucune requête »).** Si un « Copy » échoue (presse-papiers refusé, document sans focus), la promesse rejetée n'est pas interceptée et `ToolErrorWatch` envoie un rapport à `/api/report-error` : une requête part (sans la couleur). | `color-picker/page.jsx:17-18` `navigator.clipboard.writeText(…)` sans `catch` ; `app/tools/ToolErrorWatch.jsx` (`unhandledrejection` → `reportToolError`) ; `app/tools/layout.tsx:26` | « …the conversion to RGB is done by the page's own code and the color is never sent to our servers. » |
| R5 | markdown-to-html | `privacy`, 2ᵉ phrase | « its message is sent, cleaned of quoted text and URLs, to our error log » | **3 — Rapports d'erreur.** Même manque que R1 (nom de l'outil, nom et version du navigateur). | `reportError.js:142-155` ; `markdown-to-html/page.jsx:16` | « …its cleaned message is sent to our error log with the tool's name and your browser's name and version, quoted text and URLs removed. » |
| R6 | regex-tester | `privacy`, 2ᵉ phrase | « If the pattern is invalid or times out, the error message shown is sent to our error log » | **3 — Rapports d'erreur.** (a) Même manque que R1 ; (b) pour un dépassement de 2 s, ce n'est pas le message affiché qui part mais le texte fixe « pattern timeout (2 s) ». | `regex-tester/page.jsx:42` `reportShownMessage('pattern timeout (2 s)')` puis message affiché différent ; `:43` message d'erreur du worker ; `reportError.js:142-155` | « If the pattern is invalid, the error message shown is sent to our error log with the tool's name and your browser's name and version; a time-out sends only the words "pattern timeout (2 s)". It is cleaned first, but… » |
| R7 | timestamp-converter | `privacy`, 2ᵉ phrase | « that message is sent to our error log, with long numbers replaced by a placeholder » | **3 — Rapports d'erreur.** Même manque que R1. | `timestamp-converter/page.jsx:24` `useToolError` ; `reportError.js:142-155` | « …that message is sent to our error log with the tool's name and your browser's name and version, long numbers replaced by a placeholder… » |

**Bilan deuxième passe** : 13 pages relues, **7 défauts** — 1 Exactitude 2 (R2, R3) ; 2 Libellés 0 ; 3 Lieu de traitement
/ rapports d'erreur 5 (R1, R4, R5, R6, R7) ; 4 Invérifiable 0 ; 5 Générique / doublon 0 ; 6 Structure 0 ; 7 Exemple 0.
Pages **sans aucun défaut** : aspect-ratio, cron-expression-builder, diff-viewer, markdown-editor, markdown-previewer,
password-generator, uuid-generator.

## Troisième passe (06/10/2026)

Pages touchées relues en entier (api-tester, color-picker, cron-expression, markdown-to-html, regex-tester,
timestamp-converter) : **les 7 corrections R1-R7 sont exactes** (`reportError.js:142-155` ; `new URL('localhost:3000/api', …)`
garde le schéma `localhost:` ; AWS 1 = dimanche → lundi `2` devient `1` ; `ToolErrorWatch.jsx` ; `regex-tester/page.jsx:42`).
Le texte SEO des 13 pages ne présente plus aucun défaut : `content-verify --only=developer-tools/` sans échec sur mes
13 pages (les 10 échecs C6 du dossier viennent d'autres lots), titres 52-59, méta 138-155, About 89-117 mots, FAQ conformes,
jumeaux sans segment de 6 mots commun.

**Chaînes d'interface des 13 pages** (sous-titres sous le H1, notes, messages, libellés), relues dans le code : 6 défauts.

| # | Page | Endroit | Phrase (citation courte) | Problème | Preuve (fichier:ligne ou calcul) | Correction proposée |
|---|---|---|---|---|---|---|
| T1 | cron-expression + cron-expression-builder | sous-titre sous le H1 | « Build and validate cron expressions » | **5 — Doublon jumeau** : sous-titre identique sur les deux pages ; sur cron-expression (outil de lecture) « Build » ne décrit pas la page. | `cron-expression/page.jsx:26` ; `cron-expression-builder/page.jsx:26` | cron-expression : « Paste a cron expression and read it in plain English » ; builder : « Build a cron schedule from presets, field by field ». |
| T2 | markdown-editor + markdown-previewer | sous-titre sous le H1 | « Write and preview Markdown in real time » | **5 — Doublon jumeau** : identique sur les deux pages ; le Previewer se présente comme un outil de vérification de texte collé. | `markdown-editor/page.jsx:26` ; `markdown-previewer/page.jsx:26` | Previewer : « Paste Markdown and check the HTML it produces » (Editor inchangé). |
| T3 | aspect-ratio | sous-titre sous le H1 | « Calculate aspect ratios for any dimensions » | **1 — Exactitude** : zéro, négatif ou vide donnent « — » ; seuls les nombres positifs sont acceptés (la page le dit elle-même). | `aspect-ratio/page.jsx:14` (`Number(v) > 0`), `:40` | « Simplify a width and height, or find a missing side ». |
| T4 | cron-expression + cron-expression-builder | note de collage (`CronPaste`) | « (Quartz, Spring, AWS)… drop the seconds field (first) and the year field (seventh) » | **1 — Exactitude** : faux pour AWS (6 champs sans secondes, l'année en 6ᵉ, 1 = dimanche) ; la note contredit désormais la ligne « Not read » de la page. | `app/components/CronPaste.jsx:50` ; Node : `splitCron('0 12 * * ? *')` | « …(Quartz, Spring: seconds first) drop the seconds field (first) and the year field (seventh); for AWS (year sixth) drop the year and lower a numeric weekday by one. » |
| T5 | timestamp-converter | message d'erreur de saisie | « Enter a whole number of seconds (or milliseconds, microseconds, nanoseconds) — digits only… » | **1 — Exactitude** : une décimale est acceptée pour les secondes (1700000000.5, la page le dit en FAQ) ; « whole number… digits only » est faux. | `app/lib/timestamp.js:21-22` (regex `(?:\.(\d+))?`), `:30` | « Enter a number of seconds (decimals allowed), milliseconds, microseconds or nanoseconds — digits only, optionally negative. » |
| T6 | timestamp-converter | message d'erreur de plage | « …outside the range a calendar date can represent (year ±275 760) » | **1 — Exactitude** : la borne basse est l'an -271821, pas -275760. | `app/lib/timestamp.js:17,32,88` ; Node : `new Date(-8.64e15)` → `-271821-04-20T00:00:00.000Z` | « (from year -271821 to year 275760) ». |

Vérifié sans défaut : sous-titres d'api-tester, color-picker, diff-viewer, markdown-to-html, password-generator,
regex-tester, timestamp-converter, uuid-generator ; notes et messages (`CronPaste` macros / @reboot / commande, cronInfo
« 5 fields », aspect-ratio « Enter a positive number », regex « …is not a valid set of flags » et « first 200 matches »,
force du mot de passe, note EFF, notes d'heure doublée / sautée, `TextArea` au-delà de 1 000 000 caractères, libellés
FileDownload « Download » / « Download all (N files, ZIP) »).

**Bilan troisième passe** : texte SEO **0 défaut** ; chaînes d'interface **6 défauts** (1 Exactitude 4 : T3-T6 ;
5 Doublon 2 : T1, T2). T4-T6 sont dans des fichiers partagés (`CronPaste.jsx`, `app/lib/timestamp.js`). Pages sans aucun
défaut, interface comprise : api-tester, color-picker, diff-viewer, markdown-to-html, password-generator, regex-tester,
uuid-generator.
