# P37 — lot 1 divers (06/10)

Cinq points. Rien n'est commité ni déployé. Pas de `next build` ni de `next dev`. Aucun appel payant, aucune requête vers le site.

Tests : `node --import ./scripts/p37/misc-ext-loader.mjs <test>` pour ceux qui chargent des modules de l'application
(leurs imports n'ont pas d'extension `.js` ; ce chargeur de test l'ajoute, il n'est jamais livré).
Sorties avant / après gardées à côté de chaque test (`*.before.txt`, `*.after.txt`).

| # | Point | Gravité | Avant → après |
|---|-------|---------|---------------|
| 1 | Nettoyage des rapports d'erreur | 1 (confidentialité) | 11/35 → 36/36 |
| 2 | Sentence case après « . » | 1 (résultat faux) | 9/16 → 16/16 |
| 3 | Aperçu Markdown sans style | 3 (gêne) | 0/2 → 2/2 |
| 4 | Color Picker, code sans « # » | 2 (fonction qui échoue) | 1/9 → 9/9 |
| 5 | Barcode, 5 types non relus | 3 (message) + 1 (texte, confidentialité) | 60/62 → 62/62 |

## 1. Nettoyage des rapports d'erreur (`app/lib/reportError.js`)

**Gravité 1.** Le message d'erreur affiché part, nettoyé, vers `/api/report-error`. Le nettoyage laissait passer :
- l'extrait cité par V8 (`..."ization": Bearer sk_"...`) : début d'un jeton envoyé ;
- un JWT, un `Authorization: Bearer …`, des clés `sk-…`, `sk_live_…`, `ghp_…`, `AKIA…` (parfois à moitié : `ghp_[number]abcdef…`) ;
- les longues chaînes hex ou base64, les UUID (à moitié : `123e4567-e89b-12d3-a[number]`) ;
- `password=…`, `{"password":"…"}`, `?token=…` ;
- une adresse sans `http://` avec son jeton (`www.example.com/api?access_token=…`) ;
- un motif de Regex Tester : en clair s'il contient `"`, `'`, `<`, `>`, ou coupé en deux (`/secret/path/(x` → la fin partait).

**Correction.** Nouvelle fonction `scrubSecrets()` passée en premier. Le secret part en entier, la clé reste pour le
débogage (`password=[secret]`, `Authorization: [secret]`). Le motif devient `/[pattern]/g: <raison>` (la raison reste).
Le texte cité par JSON.parse devient `"[text]"`. Adresses sans schéma → `[url]`. Courriel encodé `%40` → `[email]`.
Une passe générique remplace les jetons longs (chiffres et lettres, hex ≥ 16, base64 avec `=`, UUID).
Restent lisibles : `net::ERR_INSUFFICIENT_RESOURCES`, `0x80004005` (n'est plus `0x[number]`), `AudioWorkletProcessor`,
« The access token expired », « Missing Bearer prefix », `"undefined" is not valid JSON`, positions JSON.
Le serveur (`lib/reportError.js`) repasse par la même fonction : il profite de la correction sans changement.
Aucune expression lente : 2 000 caractères hostiles en ≤ 5 ms.

- Fichier : `app/lib/reportError.js`.
- Test : `scripts/p37/report-error-scrub.test.mjs` — avant 11/35, après 36/36 (un cas Barcode ajouté après coup).
- Ancien test `scripts/error-reporting-tests/01-sanitize.js` : toujours vert. Il ne tournait plus avec `node` seul
  depuis l'import de `./chunkError` (sans extension) ; il tourne avec le chargeur P37.
- Marché : Sentry masque côté serveur les champs `password`, `secret`, `api_key`, `token`, `auth`, `session`… et les
  cartes bancaires ; GitHub secret scanning reconnaît les préfixes `ghp_`, `sk_live_`, `AKIA`, `xox…`. Même approche ici.
- Texte des pages : aucune phrase ne devient fausse (on retire plus qu'avant). Les phrases de regex-tester et
  api-tester signalées « TROMPEUR » par P36 peuvent maintenant être adoucies ; ces pages sont à d'autres lots, non touchées.

## 2. Sentence case (`app/lib/textSegments.js`, Case Converter)

**Gravité 1.** `hello world. this is` restait `Hello world. this is` : ICU ne coupe pas une phrase devant une minuscule
(règle Unicode SB8). Reproduit : `end. next` → `End. next`.

**Règle choisie.** Un point seul, puis guillemets ou parenthèses fermants, au moins une espace, puis ouvrants, puis une
minuscule → majuscule. Sauf après une abréviation connue (`e.g.`, `etc.`, `Mr.`, liste existante) ou une initiale d'une
lettre (`john f. kennedy`). Jamais sans espace : `3.14`, `example.com`, `hello.world`, `me.txt` restent tels quels.
Pas après des points de suspension (`wait... what?`).
- Marché : convertcase.net dit « Every letter after a full stop will get converted into an upper case letter » ;
  Word (Change Case > Sentence case) fait de même après « . ». Nous excluons en plus les cas sans espace, les
  abréviations et les initiales. Le test dans le navigateur de convertcase.net n'a pas pu être fait (extension Chrome
  sans réponse) : seule leur documentation est citée.
- Fichiers : `app/lib/textSegments.js` (fonction `capitalizeAfterPeriods`, utilisée seulement par `sentenceCase`),
  `app/tools/text-tools/case-converter/page.jsx` (FAQ).
- Test : `scripts/p37/sentence-case.test.mjs` — avant 9/16, après 16/16. `scripts/text-tests/01-text-segments.mjs` : 8/8.
  Le test navigateur existant (`scripts/browser-tests/text-tools.mjs`) attend toujours le même texte : vérifié en Node.
- Texte, FAQ « Does Sentence case capitalize after every period? » :
  - avant : « No. It capitalizes the first word of the text, of each line, and after ! or ?, and after a period when
    the next word already starts with a capital. After a period followed by a lower-case word, as in hello world. this
    is, the word stays lower-case, because Unicode sentence rules read that period as an abbreviation. »
  - après : « After a period followed by a space, yes: hello world. this is becomes Hello world. This is. It also
    capitalizes the first word of the text, of each line, and the word after ! or ?. The next word stays lower-case
    after a common abbreviation such as e.g., etc. or Mr., after a one-letter initial, after an ellipsis, and when no
    space follows the period, as in 3.14, example.com or hello.world. »

## 3. Aperçu Markdown sans style

**Gravité 3.** Outils touchés : Markdown Editor (classes `prose prose-sm`) et Markdown Previewer (`text-sm`).
`@tailwindcss/typography` n'est pas installé (`node_modules/@tailwindcss` : node, oxide, postcss ; `app/globals.css`
n'a que `@import "tailwindcss"`). Le reset de Tailwind retire tailles de titres, puces, bordures de tableau : l'aperçu
montrait tout en texte simple. Markdown to HTML (code seul) et Markdown to PDF (rendu serveur) ne sont pas concernés.

**Correction, sans installation.** Feuille CSS module limitée au volet d'aperçu, `app/components/markdownPreview.module.css`
(style proche du rendu GitHub). Couleurs dérivées de `currentColor` : lisible en clair et en sombre (lien bleu propre au
mode sombre). Les deux pages importent `md.preview` à la place de `prose prose-sm` / `text-sm`.
- Fichiers : `app/components/markdownPreview.module.css` (nouveau), `app/tools/developer-tools/markdown-editor/page.jsx`,
  `app/tools/developer-tools/markdown-previewer/page.jsx`.
- Test sans serveur : `scripts/p37/lot1-misc-markdown-css.mjs` (Playwright, sortie réelle de marked + la feuille + le
  reset Tailwind émulé). Avant : h1 = h2 = 16 px, puces `none`, bordures 0 px. Après : h1 30 px, h2 22,5 px, disc/decimal,
  bordures 1 px, fond du code, clair et sombre. Captures : `scripts/p37/out/lot1-misc-markdown-css-*.png` (vues : correct).
- Preuve sur la vraie page : `scripts/p37/lot1-misc-browser.mjs` (voir commandes plus bas).
- Marché : GitHub, StackEdit, Dillinger affichent titres, listes, tableaux et code stylés.
- Texte : aucune phrase ne disait que l'aperçu était sans style ; rien à changer. content-verify 0 défaut.

## 4. Color Picker, code tapé sans « # »

**Gravité 2.** `ff0000` tapé : l'aperçu gardait l'ancienne couleur, le sélecteur passait au noir (CSS refuse une couleur
sans `#`). `#f80` et `#ff000080` : carte RGB vide. Les noms (`red`) étaient affichés tels quels.

**Correction.** `parseHex.js` lit 3, 4, 6 ou 8 chiffres, avec ou sans `#`, majuscules ou minuscules, espaces autour
ignorés. Le texte tapé et la couleur affichée sont séparés. Code invalide : message « Not a HEX color: type 3, 4, 6 or 8
hexadecimal digits, with or without #, for example ff8800. » et l'aperçu garde la dernière couleur valide. Alpha : RGB en
`r,g,b,a`, copie en `rgba(...)`, damier sous l'aperçu ; le sélecteur du navigateur (sans alpha) montre la couleur opaque.
Carte HEX : code normalisé en minuscules avec `#`.
- Fichiers : `app/tools/developer-tools/color-picker/parseHex.js` (nouveau), `page.jsx`, `layout.tsx`.
- Test : `scripts/p37/color-picker-hex.test.mjs` — mode `before` = reproduction de l'ancienne logique de la page
  (1/9), mode normal = nouvelle (9/9). Preuve navigateur dans `lot1-misc-browser.mjs`.
- Marché : le sélecteur de couleur de Google accepte `ff0000` sans `#` ; CSS Color 4 définit `#rgb`, `#rgba`,
  `#rrggbb`, `#rrggbbaa`. Les noms de couleur restent hors champ (Color Converter).
- Texte (avant → après) :
  - description : « Only 6-digit HEX codes are converted to RGB, with or without the # sign; 3-digit codes, codes with
    an alpha channel and names such as red leave the RGB card empty. The HEX card shows exactly what was picked or
    typed. » → « A HEX code is read with or without its # sign, in 3, 4, 6 or 8 digits, so ff0000, #f00 and #ff000080
    all work; the 4- and 8-digit forms carry an alpha channel, shown over a checkerboard. Color names such as red are
    refused with a message, and the preview keeps the last valid color. »
  - exemple : entrée `#ff8800` → `ff8800` ; légende « A typed code … HEX-to-RGB function. » → « A code typed without its
    # sign and the values the page shows, from its own HEX parser. »
  - howTo 2 : « Or type a code with its # in "Input", for example #ff8800: the preview and the HEX card follow what you
    type. » → « Or type a code in "Input", with or without #, for example ff8800 or #f80: the preview, the swatch and
    both cards follow once the code is complete. »
  - howTo 3 : + « , then the alpha value when the code has one. »
  - howTo 4 : « … the RGB card copies it as rgb(r,g,b). » → « … the HEX card copies the code as shown, in lower case
    with #, and the RGB card copies it as rgb(r,g,b), or rgba(r,g,b,a) for a code with alpha. »
  - specs : « RGB conversion: 6-digit HEX codes only, # optional… » → « HEX codes read: 3, 4, 6 or 8 digits (#rgb,
    #rgba, #rrggbb, #rrggbbaa), # optional, upper or lower case » ; Output → « HEX in lower case with #; RGB shown as
    r,g,b (r,g,b,a with alpha) and copied as rgb(r,g,b) or rgba(r,g,b,a) » ; Not included : « alpha » → « color names ».
  - FAQ « short codes such as #f80? » : « No. Only six hexadecimal digits are converted… » → « Yes. #f80 is read as
    #ff8800 and gives 255,136,0. A 4-digit code such as #f808 or an 8-digit code such as #ff880080 adds an alpha channel:
    the RGB card shows it as a fourth value between 0 and 1 (255,136,0,0.502 for #ff880080), and the browser's swatch,
    which has no alpha, shows the color as opaque. »
  - FAQ « Do I need to type the # sign? » : « Yes, for the preview: … » → « No. ff8800 and #ff8800 give the same color,
    and the HEX card then shows #ff8800. Text that is not 3, 4, 6 or 8 hexadecimal digits, such as ff880 or a color
    name such as red, is refused with a message, and the preview keeps the previous color. »
  - FAQ Copy : « …including a typed name such as red. » → « …; with an alpha channel it copies rgba(255,136,0,0.502).
    The HEX card copies the code as shown, in lower case with its # sign. »
  - méta (layout) : « …or type a 6-digit HEX code, then copy the HEX value or the RGB value written as rgb(r,g,b). » →
    « Pick a color with your browser's color picker or type a HEX code, with or without #, in 3, 4, 6 or 8 digits, then
    copy it as HEX or as rgb(r,g,b). » (146 caractères).

## 5. Barcode Generator, les 5 types sans lecteur

Types : MSI Plessey, Pharmacode, Code 11, EAN-5 seul, EAN-2 seul (`zxing: null`, `symbologies.js`).
Méthode : chaque code est dessiné avec les options de la page (`bwipOptions` de `render.js`, réglages par défaut) par
bwip-js (même moteur BWIPP que la page), puis décodé à partir des largeurs de barres par des décodeurs écrits depuis les
spécifications ; chiffres de contrôle recalculés à part (MSI Luhn et Mod 11 poids 2-7, Code 11 C/K, parité EAN-5/EAN-2).
Aucun décodeur indépendant de ces 5 types dans `node_modules` (zxing-wasm ne les lit pas).

Résultat : tous corrects. MSI (5 valeurs × 5 schémas), Pharmacode (3, 1234, 65535, 131070), Code 11 (avec et sans
contrôle, K ajouté dès 10 caractères), EAN-5 et EAN-2 (chiffres et parité). Les valeurs invalides sont refusées avec un
message clair (`MSI must contain only digits`, `Pharmacode value must be between 3 and 131070`, `EAN-5 add-on must be 5
digits`…). Le premier passage (`barcode-unread-types.first-run.txt`) avait un faux échec dû à mon décodeur Pharmacode
(code de barres toutes larges), corrigé dans le test.

Défauts trouvés et corrigés :
- **Gravité 3** — MSI Mod 11 et Mod 11 + Mod 10 : un nombre sur 11 donne la valeur de contrôle 10 (ex. `6`). La page
  affichait « mod11 check digit is 10 but badmod11 not specified ». Maintenant : « With Mod 11, this number gets the check
  value 10, which one MSI digit cannot hold. Choose Mod 10 or Mod 10 + Mod 10, or change the number. » Pas d'écriture
  « 10 » sur deux chiffres (option `badmod11` de BWIPP) : les lecteurs ne s'accordent pas dessus (variante NCR).
  Fichier : `render.js` (`cleanError`). Test : avant 60/62, après 62/62.
- **Gravité 1 (texte)** — Code 11 : « K over 10 characters » faux, K est ajouté dès 10 caractères (mesuré : `0123456789`
  reçoit C et K). Indice `symbologies.js` et FAQ 1 → « K from 10 characters ». Preuve P36 mise à jour
  (`docs/audit/p36/preuves/convert-qr-math.json`, motif « and K from 10 characters »).
- **Gravité 1 (confidentialité)** — signalé par P36 : le message « No code could be made: line 1: <valeur> — … » partait
  avec les valeurs non citées. Les valeurs sont maintenant entre « “ ” » (`page.jsx`), le nettoyage les remplace par
  `[text]` (cas ajouté au test du point 1). `errors.txt` du ZIP (local, jamais envoyé) inchangé.
- Texte :
  - FAQ 1 : « …Code 11 its C check digit (and K over 10 characters), and MSI Plessey offers several Mod 10 and Mod 11
    schemes. » → « …Code 11 its C check digit (and K from 10 characters), and MSI Plessey offers several Mod 10 and Mod 11
    schemes; a number whose Mod 11 check value would be 10 is refused with a message suggesting Mod 10. »
  - confidentialité : « …and the message of a batch where every line failed can quote a few of your values. » → « …and
    the values quoted in the message of a batch where every line failed are removed from it first. »
  - FAQ « Is each barcode checked before download? » : exacte (32 sur 37, les 5 nommés), inchangée.
- Marché : BWIPP refuse lui-même ce cas, sauf option `badmod11` (écriture « 10 », pratique NCR). Pas d'autre outil vérifié.

## Contrôles

- `node scripts/p36/content-verify.mjs --only=<page> --verbose` : text-tools/case-converter, developer-tools/color-picker,
  developer-tools/markdown-editor, developer-tools/markdown-previewer, qr-barcodes-tools/barcode-generator → 0 défaut chacun.
- `node scripts/content-checks/instructions.mjs` : 225 pages, 0 écart.
- `node scripts/content-checks/privacy-claims.mjs` : 0 échec.
- Fins de ligne : CRLF partout. `sed -i` de Git Bash avait remis 3 fichiers en LF (color-picker, deux pages Markdown) :
  reconvertis en CRLF.

## Reporté (avec estimation)

- Sentence case après `?` ou `!` sans espace (`what?ok` → `What?Ok`) : comportement ICU d'avant, conservé. 30 min.
- Word Counter compte toujours `hello world. this is` comme une phrase (même règle ICU, `countSentences` non touché :
  autre outil). 1 h avec test.
- Le nettoyage générique ne peut pas reconnaître une valeur courte non citée (sql-to-csv : noms de tables ; statistics
  « Not a number: x »). Correction outil par outil en citant les valeurs, comme pour Barcode : ~15 min par outil, ~5 outils.
- Regex Tester / API Tester : textes de confidentialité à adoucir maintenant que motifs et jetons partent masqués (autres lots).
- MSI : option « écrire 10 sur deux chiffres » (NCR) si le propriétaire la veut : 30 min.

## Commandes navigateur pour le contrôleur

Après un `next build` puis `next start` local (ou toute origine de test locale) :

    node scripts/p37/lot1-misc-browser.mjs http://localhost:3000

Vérifie : aperçu stylé des deux pages Markdown en clair et en sombre (tailles des titres, puces, bordures, fond du code,
lien souligné) et Color Picker (`ff0000`, `0f0`, `#0000ff80` → aperçu et sélecteur ; `red` → message, couleur gardée).
Captures dans `scripts/p37/out/lot1-misc-*.png`. Le cookie `oct_automation=1` évite tout rapport d'erreur.

Déjà lancé ici, sans serveur : `node scripts/p37/lot1-misc-markdown-css.mjs` (et `… before`).
