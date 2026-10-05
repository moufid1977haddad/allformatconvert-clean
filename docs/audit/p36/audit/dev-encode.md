# P36 lot 2 — audit du lot « dev-encode » (13 pages)

Pages lues : `developer-tools/base64-encoder`, `file-tools/base64-encoder`, `developer-tools/url-encoder`,
`text-tools/url-encoder`, `developer-tools/html-encoder`, `developer-tools/html-entity-decoder`,
`developer-tools/hex-to-text`, `developer-tools/unicode-converter`, `developer-tools/hash-generator`,
`developer-tools/jwt-decoder`, `developer-tools/url-parser`, `developer-tools/number-base-converter`,
`math-tools/number-base-converter`.

Sources : texte servi (`docs/audit/p36/contenu-avant.json`) confronté au code (`app/tools/<cat>/<outil>/page.jsx` et
`layout.tsx`, `app/lib/textCodecs.js`, `app/lib/hashAlgorithms.js`, `app/tools/developer-tools/hash-generator/{seo.js,hash.worker.js}`,
`app/lib/jwtVerify.js`, `app/lib/exactNumbers.js`, `app/components/{BaseConverter,TextArea,FileDownload,UploadPrompt,FileDropBridge}.jsx`,
`app/lib/{fileSignature,fileChecks,isMobileDevice,useToolError,reportError}.js`). Les numéros de ligne des `page.jsx` sont ceux
du fichier (la 1re ligne de certains fichiers porte un BOM, sans effet sur la numérotation).

Constats communs aux 13 pages (vérifiés, donc absents des tableaux) :
- Aucun appel réseau dans le code de ces outils (aucun `fetch`, `/api/`, `XMLHttpRequest`, `sendBeacon` dans les pages,
  `textCodecs.js`, `jwtVerify.js`, `hashAlgorithms.js`, `exactNumbers.js`, `BaseConverter.jsx`, `TextArea.jsx`). Seul départ
  possible : le TEXTE d'un message d'erreur affiché, nettoyé (`app/lib/useToolError.js:19-31`, `app/lib/reportError.js:16,72-119`
  : ni fichier, ni contenu, ni texte entre guillemets, URL, courriel ou long nombre) vers `/api/report-error`. Les affirmations
  « nothing is uploaded / never sent to a server » sont donc justes et ne figurent pas dans les tableaux, sauf quand elles sont
  la phrase-type copiée de page en page (GÉNÉRIQUE).
- Aucune inscription, aucun quota : aucune de ces pages n'appelle une route payante ni `lib/quota/guard.js`.
- Aucun filigrane (sans objet : sorties texte).
- Tout résultat texte non pris arme « Quitter la page ? » (`app/components/FileDownload.jsx:24-30,69-80`) ; copier compte comme
  prendre (`FileDownload.jsx:40-67`).

Artefact d'extraction à connaître (pas un défaut de page) : `scripts/p36/extract-content.mjs:17` décode `&amp;` AVANT `&nbsp;`
et `&#x…;`, donc le JSON montre doublement décodé ce que la page affiche littéralement. Ex. HTML Encoder : la page affiche
« such as &nbsp; or &copy; … &#x1F600; — so already-escaped text like &amp;lt; correctly decodes to &lt;, not < »
(`app/tools/developer-tools/html-encoder/page.jsx:29`, chaîne JS rendue telle quelle), le JSON montre « such as  or &copy; … 😀 …
decodes to <, not < ». Les rédacteurs doivent partir du code, pas du JSON, pour ces deux pages et pour HTML Entity Decoder.

## 1. /tools/developer-tools/base64-encoder

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| base64-encoder (dev) | titre | « Base64 Encoder — Convert Text Online Free » | GÉNÉRIQUE | Outil = encodage ET décodage, texte en UTF-8, option URL-safe (`page.jsx:12-18,26`) ; « Convert Text Online Free » se colle sur n'importe quelle page texte | Titre qui dit encode + decode, UTF-8, URL-safe |
| base64-encoder (dev) | méta | « using the built-in btoa()/atob() functions » | TROMPEUR | Le texte est d'abord converti en octets UTF-8 (TextEncoder) puis passé à btoa (`app/lib/textCodecs.js:15,23-24`) ; décodage atob + TextDecoder UTF-8 strict (`textCodecs.js:38-44`). btoa seul refusait tout caractère > U+00FF (`textCodecs.js:4-5`) | « encodes text as UTF-8, then Base64 (standard or URL-safe); decodes standard and URL-safe Base64 » |
| base64-encoder (dev) | about | « the encoding every API, email system and programming language uses » | INVÉRIFIABLE | Aucune preuve ; le code fait UTF-8 (`textCodecs.js:23-24`) | « Text is encoded as UTF-8 (same bytes as Python's base64.b64encode(text.encode())) » |
| base64-encoder (dev) | FAQ 1 | « Is Base64 Encoder free to use? — Yes, it's completely free with no signup required. » | GÉNÉRIQUE | Phrase présente mot pour mot sur des dizaines de pages (`docs/audit/p36/unicite-avant.json`, `repeated`) | Supprimer ou remplacer par une question propre à l'outil |
| base64-encoder (dev) | FAQ 2 | « What is Base64 encoding used for? — Converting binary or text data into an ASCII string… » | GÉNÉRIQUE | Définition générale, rien de propre à l'outil | Supprimer ou lier à ce que fait l'outil (texte UTF-8 seulement ; un fichier → File to Base64) |
| base64-encoder (dev) | FAQ 3 | « Is this tool secure and private? — Yes — encoding and decoding happen entirely in your browser… » | GÉNÉRIQUE | Juste (`page.jsx:12-18`, aucun appel réseau) mais phrase-type | Déplacer dans le bloc « privacy » de SeoContent (`app/components/SeoContent.tsx:123-128`) |
| base64-encoder (dev) | étape 4 | « Click 'Copy' to copy the result. » | GÉNÉRIQUE | Même phrase sur 6 pages (`unicite-avant.json`) ; omet la ligne de téléchargement « base64.txt » / bouton « Download » (`page.jsx:32`, `FileDownload.jsx:211`) | « Copy the result, or download it as base64.txt » (dire que le fichier s'appelle base64.txt même pour un décodage) |
| base64-encoder (dev) | astuce 4 | « Copy the result right away, since nothing is saved after you leave the page. » | GÉNÉRIQUE | Phrase-type ; incomplète : la page propose « Download » (`page.jsx:32`) et le navigateur demande avant de quitter (`FileDownload.jsx:24-30,69-74`) | Supprimer, ou dire : « Leaving the page asks first; copy or download the result » |

## 2. /tools/file-tools/base64-encoder

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| base64-encoder (file) | titre, méta, about | « Instantly Converts Any File » / « instantly converts any file » | INVÉRIFIABLE | Lecture `FileReader.readAsDataURL` (`page.jsx:41-49`), aucune mesure de durée dans `docs/audit/` ; pour un gros fichier un message « Encoding... » s'affiche (`page.jsx:65`) | Retirer « instantly » ; « encodes the file as soon as it is chosen » (`page.jsx:63`) |
| base64-encoder (file) | méta, about | « into a Base64-encoded data URL » | MINCE | Deux sorties : Data URL ou « Raw Base64 » sans préfixe (`page.jsx:24,72`) | « into a data URL or raw Base64 » |
| base64-encoder (file) | about | « Upload a file and get a ready-to-use Base64 string » | TROMPEUR | Rien n'est envoyé : lecture locale (`page.jsx:39-49`) ; « Upload » contredit la fin de la même phrase (« nothing is ever uploaded ») | « Choose or drop a file… » |
| base64-encoder (file) | about (ensemble) | 2 phrases seulement | MINCE | Manquent : choix Data URL / Raw Base64 (`page.jsx:72`) ; type lu dans le contenu quand le navigateur n'en donne pas ou donne `application/octet-stream` — 47 signatures (`page.jsx:39-40,44`, `app/lib/fileSignature.js:11-58`) ; compteur de caractères (`page.jsx:73`) ; aperçu limité à 100 000 caractères au-delà (`page.jsx:17,68,75-76`) ; fichier `<nom>.base64.txt` téléchargeable (`page.jsx:79`) ; fichier vide refusé avec message (`page.jsx:33`, `app/lib/fileChecks.js:100-101`) ; un fichier à la fois (`page.jsx:63` sans `multiple`) | Ajouter ces faits |
| base64-encoder (file) | FAQ 1 | « Yes, it's completely free with no signup and no limit on how many files you can encode. » | GÉNÉRIQUE | Phrase-type (gratuité) ; aucune limite de nombre dans le code (juste) mais un fichier par sélection (`page.jsx:29,63`) | Supprimer ou remplacer par une question propre (gros fichiers, type détecté) |
| base64-encoder (file) | FAQ 2 | « Is my file uploaded anywhere? — No. The file is read and encoded locally using the browser's FileReader API… » | GÉNÉRIQUE | Juste (`page.jsx:41-49`) ; question-type présente sur des dizaines de pages (`unicite-avant.json` : « is my file uploaded anywhere ») | Déplacer dans le bloc « privacy » |
| base64-encoder (file) | astuce 2 | « use Download .txt to keep the whole text » | LIBELLÉ | Le bouton s'appelle « Download » (`app/components/FileDownload.jsx:211`) dans une ligne nommée `<nom du fichier>.base64.txt` (`page.jsx:79`) ; « Copy Base64 » copie aussi le texte entier (`page.jsx:76,78`) | « use Download (file name.base64.txt) or Copy Base64: both give the whole text » |

## 3. /tools/developer-tools/url-encoder

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| url-encoder (dev) | titre | « URL Encoder — Encode and Decodes Text Online Free » | GÉNÉRIQUE | Faute (« Decodes ») et rien de propre : 3 modes d'encodage + décodage « + » = espace (`page.jsx:9-14,22,35-41`) | Titre correct, qui nomme les modes (valeur / URL entière / RFC 3986) |
| url-encoder (dev) | méta, about | « using JavaScript's encodeURIComponent and decodeURIComponent » | TROMPEUR | Vrai pour le mode « A value » seulement (`page.jsx:10`) ; « A whole URL » = `encodeURI` par segments en gardant les `%XX` existants (`page.jsx:12`) ; « Strict RFC 3986 » encode aussi `! ' ( ) *` (`page.jsx:13`) ; au décodage `+` devient espace par défaut (`page.jsx:22,25`) | Décrire les 3 modes et l'option « + » |
| url-encoder (dev) | about | « It's built for encoding a single value…, not a whole URL: running a full URL … through it will over-encode structural characters such as /, :, ?, &, and =, breaking it as a usable link. » | FAUX | Option « A whole URL (keeps : / ? # & =) » (`page.jsx:12,38`) ; la FAQ 2 de la même page dit l'inverse (`page.jsx:61`) | Supprimer ; dire « choose 'A whole URL' to keep : / ? # & = » |
| url-encoder (dev) | about | « A working 'Decode' button is included alongside 'Encode'. » | MINCE | Phrase sans information ; manque l'option « Decode “+” as a space (form data and query strings) » cochée par défaut (`page.jsx:22,33`) et l'avertissement affiché si le texte contient « + » (`page.jsx:34`) | Remplacer par l'option « + » réelle |
| url-encoder (dev) | étape 1 | « (a query parameter, path segment, etc., not a full URL) » | FAUX | Même raison : mode « A whole URL » (`page.jsx:12,38`) | « Paste a value or a whole URL » |
| url-encoder (dev) | étapes (ensemble) | 4 étapes sans le sélecteur « Encode as » ni la case « + » | MINCE | Sélecteur « Encode as » (3 options, `page.jsx:35-40`) et case « Decode “+” as a space… » (`page.jsx:33`) absents des étapes ; ligne « Download » `encoded.txt` absente (`page.jsx:47`) | Étapes : coller → choisir « Encode as » → Encode / Decode (case « + ») → Copy ou Download (encoded.txt) |
| url-encoder (dev) | étape 4 | « Click 'Copy' to copy the result. » | GÉNÉRIQUE | Même phrase sur 6 pages (`unicite-avant.json`) | Fusionner avec l'étape réelle ci-dessus |
| url-encoder (dev) | FAQ 1 | « What is URL encoding? — It converts characters that aren't safe in a URL… » | GÉNÉRIQUE | Définition générale | Supprimer ou rendre propre (ce que chaque mode garde) |
| url-encoder (dev) | FAQ 3 | « Can I decode with this tool? — Yes — there's a 'Decode' button… » | MINCE | Omet que « + » est lu comme espace par défaut (`page.jsx:22,25`) et le message « Invalid URL encoding » (`page.jsx:25`) | Dire les deux |
| url-encoder (dev) | FAQ 4 | « Is my data uploaded to a server? — No, encoding and decoding happen entirely in your browser. » | GÉNÉRIQUE | Juste ; phrase-type (`unicite-avant.json` : « is my data uploaded to a server ») | Bloc « privacy » |
| url-encoder (dev) | astuce 1 | « Encode individual query parameter values, not the full URL string, to avoid breaking the URL's structure. » | TROMPEUR | Le mode « A whole URL » garde la structure (`page.jsx:12,38`) | « Use 'A value' for one parameter, 'A whole URL' for a complete address » |
| url-encoder (dev) | astuce 4 | « Use this before inserting user-provided text into a query string, so special characters don't break the URL. » | GÉNÉRIQUE | Conseil général, sans rien de propre | Supprimer |
| url-encoder (dev) | page entière | (outil) | GÉNÉRIQUE | Outil identique à `/tools/text-tools/url-encoder` : même `ENCODERS` (`page.jsx:9-14` = `text-tools/url-encoder/page.jsx:10-15`), mêmes contrôles ; seules différences : police à chasse fixe (`page.jsx:32,46`), texte d'exemple, message « Copy failed » sur l'autre page | Différencier les deux pages par l'usage (dev : paramètres de requête, RFC 3986 ; texte : texte libre) ou en canoniser une |

## 4. /tools/text-tools/url-encoder

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| url-encoder (text) | about | « using the browser's built-in encodeURIComponent/decodeURIComponent » | TROMPEUR | Vrai pour « A value » seulement (`page.jsx:11`) ; « A whole URL » = `encodeURI` en gardant les `%XX` (`page.jsx:13`) ; RFC 3986 (`page.jsx:14`) ; `+` → espace par défaut au décodage (`page.jsx:24,29`) | Décrire les 3 modes et l'option « + » |
| url-encoder (text) | about (ensemble) | 1 phrase | MINCE | Manquent les 3 modes « Encode as » (`page.jsx:44-50`), la case « Decode “+” as a space… » (`page.jsx:42`) et son avertissement (`page.jsx:43`), le téléchargement `encoded.txt` (`page.jsx:58`) | Ajouter ces faits |
| url-encoder (text) | étapes 1-2 | « Paste your URL or text… Click "Encode"… or "Decode"… » | MINCE | Sélecteur « Encode as » et case « + » absents des étapes (`page.jsx:42,44-50`) | Ajouter l'étape de choix du mode et la case |
| url-encoder (text) | FAQ 1 | « Characters like spaces, ampersands, and slashes are replaced with percent signs… » | TROMPEUR | En mode « A whole URL », `&` et `/` sont gardés (`page.jsx:13,47`) | « In 'A value' mode, & and / are encoded; 'A whole URL' keeps them » |
| url-encoder (text) | FAQ 2 | « Yes, it's completely free with no signup and no limits. » | GÉNÉRIQUE | Phrase-type (`unicite-avant.json`, 4 pages) | Supprimer |
| url-encoder (text) | FAQ 4 | « Letters, numbers, hyphens, underscores, periods, and tildes are left unchanged, matching the standard encodeURIComponent behavior. » | TROMPEUR | `encodeURIComponent` (mode par défaut, `page.jsx:11`) laisse aussi `! ' ( ) *` inchangés ; seule l'option RFC 3986 les encode (`page.jsx:14`) — la liste se présente comme complète | Compléter la liste : « …and ! ' ( ) * (encoded only by 'Strict RFC 3986') » |
| url-encoder (text) | astuces 3-4 | « Test your encoded URL in a browser address bar… » / « Keep the original, unencoded text handy… » | GÉNÉRIQUE | Conseils sans lien avec le code | Supprimer |
| url-encoder (text) | page entière | (outil) | GÉNÉRIQUE | Jumeau exact de `/tools/developer-tools/url-encoder` (voir section 3) | Différencier ou canoniser |

## 5. /tools/developer-tools/html-encoder

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| html-encoder | titre, méta | « Convert the Five Characters That Matter » / « converts unsafe characters … into their HTML entities » | MINCE | L'outil décode aussi toutes les entités nommées et numériques (bouton « Decode », `page.jsx:11,21` ; `app/lib/textCodecs.js:74-90`) ; ni le titre ni la méta ne le disent | Titre/méta : « encode & < > " ' and decode every HTML entity » |
| html-encoder | FAQ 1 | « Is HTML Encoder free to use? — Yes, it's completely free with no signup required. » | GÉNÉRIQUE | Phrase-type | Supprimer |
| html-encoder | étapes 3-4 | « Review the result in the output box. » / « Click 'Copy' to copy it to your clipboard. » | GÉNÉRIQUE | Phrases présentes sur 4 et 6 pages (`unicite-avant.json`) ; omettent le téléchargement `encoded.txt` (`page.jsx:24`) | Une étape réelle : « Copy the result or download it (encoded.txt) » |
| html-encoder | astuce 1 | « Encoding these five characters is exactly what's needed to safely place untrusted text inside HTML markup, preventing it from … breaking out of an attribute. » | TROMPEUR | `htmlEncode` échappe seulement `& < > " '` (`textCodecs.js:65-68`) : suffisant dans le contenu d'un élément et dans un attribut entre guillemets ; pas dans un attribut sans guillemets, une URL (`javascript:`), un bloc `<script>` ou `<style>` | « …enough for element text and quoted attribute values; not for unquoted attributes, URLs, or script/style blocks » |
| html-encoder | page entière | (outil) | GÉNÉRIQUE | Jumeau de `/tools/developer-tools/html-entity-decoder` : mêmes fonctions `htmlEncode`, `htmlDecode`, `browserNamedEntity` (`page.jsx:4,10-11` = `html-entity-decoder/page.jsx:4,14-15`), mêmes boutons « Encode » / « Decode », même sous-titre « Encode and decode HTML entities » ; seule différence : nom du fichier téléchargé `encoded.txt` / `decoded.txt` | Différencier les deux pages (encodage pour l'une, décodage pour l'autre) ou canoniser |

## 6. /tools/developer-tools/html-entity-decoder

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| html-entity-decoder | FAQ 1 | « Is HTML Entity Decoder free to use? — Yes, it's completely free with no signup required. » | GÉNÉRIQUE | Phrase-type | Supprimer |
| html-entity-decoder | FAQ 2 | « What are HTML entities? — Codes that represent characters with special meaning in HTML… » | GÉNÉRIQUE | Définition générale | Supprimer ou rendre propre |
| html-entity-decoder | FAQ 5 | « Does it store or upload my data? — No, encoding and decoding both happen entirely in your browser… » | GÉNÉRIQUE | Juste (`page.jsx:14-15`) ; phrase-type | Bloc « privacy » |
| html-entity-decoder | étapes 3-4 | « Review the result in the output box. » / « Click 'Copy' to copy it to your clipboard. » | GÉNÉRIQUE | Phrases présentes sur 4 et 6 pages ; omettent le téléchargement `decoded.txt` (`page.jsx:28`) | Une étape réelle avec Copy / Download |
| html-entity-decoder | astuce 3 | « Copy your result right away, since it isn't saved after you leave the page. » | GÉNÉRIQUE | Phrase-type ; la page propose « Download » (`page.jsx:28`) et demande avant de quitter (`FileDownload.jsx:24-30`) | Supprimer |
| html-entity-decoder | page entière | (outil) | GÉNÉRIQUE | Jumeau de `/tools/developer-tools/html-encoder` (voir section 5) | Différencier ou canoniser |

## 7. /tools/developer-tools/hex-to-text

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| hex-to-text | titre | « Hex to Text — Convert Between Plain Text Online Free » | MINCE | Titre tronqué (« between plain text » et… rien) ; l'outil va texte → hex UTF-8 et hex → texte (`page.jsx:11-14,23-24`) | « Hex to Text — Convert Text to UTF-8 Hex and Back » |
| hex-to-text | méta | « between plain text and hexadecimal character codes » | TROMPEUR | Ce sont les OCTETS UTF-8, pas les codes de caractère : é → `c3 a9`, pas `e9` (`app/lib/textCodecs.js:47-49`, et `textCodecs.js:8-9` qui décrit l'ancien défaut) | « …and hexadecimal UTF-8 bytes » |
| hex-to-text | about | « like every hex editor and programming language » | INVÉRIFIABLE | Aucune preuve ; le code fait UTF-8 (`textCodecs.js:48,59`) | « the same bytes as Python's text.encode().hex() » (déjà en astuce 1) |
| hex-to-text | FAQ 1 | « Is Hex to Text free to use? — Yes, it's completely free with no signup required. » | GÉNÉRIQUE | Phrase-type | Supprimer |
| hex-to-text | étape 4 | « Click 'Copy' to copy it to your clipboard. » | GÉNÉRIQUE | Phrase sur 6 pages ; omet le téléchargement `converted.txt` (`page.jsx:27`) | Copy / Download |
| hex-to-text | astuce 3 | « Copy your result right away, since it isn't saved after you leave the page. » | GÉNÉRIQUE | Phrase-type ; « Download » existe (`page.jsx:27`) | Supprimer |

## 8. /tools/developer-tools/unicode-converter

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| unicode-converter | titre | « Unicode Converter — Convert Text Online Free » | GÉNÉRIQUE | Rien de propre ; l'outil écrit des `\uXXXX` et lit `\uXXXX`, `\u{…}`, `U+…` (`page.jsx:9-13`) | « Unicode Converter — Text to \uXXXX Escapes and Back » |
| unicode-converter | about | « it supports exactly one format (4-hex-digit \uXXXX escapes) » | FAUX | « From Unicode » lit aussi `\u{1F600}` (1 à 6 chiffres) et `U+1F600` (4 à 6 chiffres, « U » majuscule) (`page.jsx:10-12`) en plus de `\uXXXX` (`page.jsx:13`) | « To Unicode writes \uXXXX; From Unicode reads \uXXXX, \u{…} and U+XXXX » |
| unicode-converter | about | « not UTF-8, UTF-16, UTF-32, HTML entities, or other encodings » | TROMPEUR | Les `\uXXXX` produits SONT les unités de code UTF-16 (`input.split('')` + `charCodeAt`, `page.jsx:9`) — d'où les paires de substitution | « …the UTF-16 code units, as JavaScript stores them; not UTF-8 bytes or HTML entities » |
| unicode-converter | FAQ 1 | « Only one: 4-hex-digit \uXXXX escape sequences… » | FAUX | Même raison (`page.jsx:10-13`) | Même correction |
| unicode-converter | astuce 2 | « make sure each escape uses exactly 4 hex digits (A), since that's the only pattern recognized » | FAUX | `\u{41}` et `U+0041` sont aussi reconnus (`page.jsx:12`) | Dire les trois formes reconnues |
| unicode-converter | FAQ 2 | « Is it free to use? — Yes, it's completely free with no registration required. » | GÉNÉRIQUE | Phrase-type | Supprimer |
| unicode-converter | FAQ 4 | « Is my text uploaded to a server? — No, all conversion happens locally in your browser. » | GÉNÉRIQUE | Juste ; phrase-type | Bloc « privacy » |
| unicode-converter | étapes (ensemble) / about | (non dit) | MINCE | « To Unicode » échappe TOUS les caractères, ASCII compris (A → `A`), en minuscules (`é`) (`page.jsx:9`) ; téléchargement `converted.txt` (`page.jsx:26`) — rien de cela n'est dit | Le dire |
| unicode-converter | étape 4 | « Click 'Copy' to copy the result. » | GÉNÉRIQUE | Phrase sur 6 pages | Copy / Download |
| unicode-converter | astuce 3 | « For byte-level encodings like UTF-8, use a dedicated encoding tool instead » | GÉNÉRIQUE | Renvoi vague alors que le site a Hex to Text (octets UTF-8, `app/lib/textCodecs.js:47-63`) | Lier « Hex to Text » |

## 9. /tools/developer-tools/hash-generator

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| hash-generator | méta, interface, about | « files of any size » (méta `seo.js:22`, about `page.jsx:291`, sous-titre `page.jsx:170`) / « No file size limit » (`page.jsx:171`) / « Any type, any size, several at once » (`page.jsx:245`) | INVÉRIFIABLE | Aucune limite dans le code : lecture par tranches de 8 Mio (`hash.worker.js:10,41-52`) ; mais la seule mesure (« 5 Gio : 52 s ») est dans le message du commit 44ae126c, aucun rapport dans `docs/audit/` | Garder « no size limit set by the tool (read in 8 MB pieces) » ; mettre la mesure 5 Gio dans un rapport `docs/audit/` avant de la citer |
| hash-generator | FAQ 2 | « so even files larger than your device's memory can be hashed » | INVÉRIFIABLE | Lecture en flux possible (`hash.worker.js:31-34,41`), mais aucun essai plus gros que la mémoire dans `docs/audit/` | Retirer ou prouver |
| hash-generator | FAQ 2 | « A 5 GB file was hashed in under a minute on a desktop computer in our tests. » | INVÉRIFIABLE | Mesure seulement dans le message du commit 44ae126c (« 5 Gio : 52 s, SHA-256 égal à sha256sum ») ; aucun rapport dans `docs/audit/` | Rapport dans `docs/audit/` ou retrait |
| hash-generator | FAQ 1, FAQ 2 | « SHA-1 and the SHA-2 family use your browser's built-in Web Crypto » / « so SHA-1 and SHA-2 can use the browser's faster native code » | FAUX | SHA-224 n'a pas de nom Web Crypto : toujours hash-wasm (`app/lib/hashAlgorithms.js:12`, pas de `subtle`) ; et au-delà de 700 Mio (100 Mio sur téléphone/tablette) ou sans Web Crypto, SHA-1/256/384/512 passent aussi par hash-wasm (`page.jsx:21,31`, `hash.worker.js:30-31,34`) | « SHA-1, SHA-256, SHA-384 and SHA-512 use Web Crypto for files up to 700 MB (100 MB on phones and tablets); everything else uses hash-wasm » |
| hash-generator | FAQ 6 | « HMAC is not defined for checksums such as CRC32 or xxHash, nor for BLAKE3 and Keccak » | TROMPEUR | C'est un choix de l'outil : `hmac: false` pour Keccak-256 et BLAKE3 (`hashAlgorithms.js:16,18`) ; la construction HMAC s'applique à Keccak (HMAC-SHA3 est normalisé) | « HMAC is not offered here for CRC32, CRC32C, xxHash, BLAKE3 and Keccak-256; they are skipped while a key is set » (`page.jsx:216`) |
| hash-generator | FAQ 5, about | « in the "SHA256 (file) = hash" format that `sha256sum -c`, `md5sum -c` and `shasum -c` understand » / « a checksums.txt that sha256sum -c can check » | TROMPEUR | Le fichier mélange une ligne par fichier ET par algorithme coché (`page.jsx:140`), défauts = MD5, SHA-1, SHA-256, SHA-512, CRC32 (`hashAlgorithms.js:26`) ; chaque commande ne vérifie que les lignes de ses propres algorithmes : les lignes CRC32, CRC32C, XXH64/XXH3/XXH128, BLAKE2b/BLAKE3, KECCAK-256, RIPEMD160 et toutes les lignes « HMAC-… » (`page.jsx:140`, `hashAlgorithms.js:30`) ne sont vérifiables par aucune des trois | « sha256sum -c checks the SHA256 lines, md5sum -c the MD5 lines…; checksum (CRC, xxHash) and HMAC lines are for reading only » |
| hash-generator | étape 3 | « drop one or more files and click Hash » | LIBELLÉ | Le bouton affiche « Hash 1 file » / « Hash N files » (`page.jsx:265`), ou « Tick at least one algorithm » | « click 'Hash N files' » |
| hash-generator | étape 5 | « Copy any value, or download every result as checksums.txt. » | TROMPEUR | « Copy all » et `checksums.txt` n'existent qu'en mode Files (`page.jsx:276-279`) ; en mode Text, seulement un « Copy » par valeur (`page.jsx:153,231`) | « Copy any value; in Files mode, Copy all or download checksums.txt » |

## 10. /tools/developer-tools/jwt-decoder

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| jwt-decoder | titre, méta | « JWT Decoder — Split a JWT Online Free » / « splits a JWT into its header and payload, decodes each, and pretty-prints the resulting JSON » | MINCE | Ni le titre ni la méta ne disent la vérification de signature (HS/RS/PS/ES/EdDSA, `page.jsx:23-29,75`, `app/lib/jwtVerify.js:8-14,82-128`) ni les dates exp/iat/nbf lisibles (`page.jsx:45-49`) | « Decode a JWT and verify its signature (HS, RS, PS, ES, EdDSA) » |
| jwt-decoder | FAQ 1 | « What is a JWT? — A compact, URL-safe token format… » | GÉNÉRIQUE | Définition générale | Supprimer ou rendre propre |
| jwt-decoder | FAQ 3 | « Is my token uploaded to a server? — No, decoding happens entirely in your browser. » | GÉNÉRIQUE | Juste ; phrase-type ; omet que la vérification aussi est locale (`page.jsx:81`) | Bloc « privacy » : token ET clé restent dans le navigateur (WebCrypto) |
| jwt-decoder | astuce 1 | « Decoding always succeeds, whatever the signature » | TROMPEUR | « Decode » échoue avec « Invalid JWT token » si le jeton n'a pas 3 parties, ou si le Base64url ou le JSON est invalide (`page.jsx:37-44,52`) ; la phrase veut dire que Decode ne vérifie pas la signature | « Decode never checks the signature: only 'Signature verified' does » |
| jwt-decoder | astuce 3 | « Useful for quickly inspecting claims during development, not for making trust decisions about a token's origin. » | TROMPEUR | Contredit l'outil et la FAQ 4 : « Verify signature » prouve que le jeton a été signé avec cette clé et n'a pas changé (`page.jsx:79`, `jwtVerify.js:82-128`) | Supprimer ou : « a verified signature proves the key; exp, nbf, iss and aud must still be checked in your application » |
| jwt-decoder | about, étapes (ensemble) | (non dit) | MINCE | Non dit : dates exp / iat / nbf affichées en UTC avec « — expired », « — not expired yet », « — not valid yet » (`page.jsx:45-49,83`) ; sélecteur « Secret is : text / base64 / base64url » pour HS* (`page.jsx:69-72`) ; refus expliqués : JWK Set, certificat X.509, clé PKCS#1, clé privée, `crit`, `b64:false`, `alg none` (`jwtVerify.js:59,72-75,94,97-98`) ; jeton chiffré (JWE, 5 parties) non pris en charge (`page.jsx:38`) ; pas de bouton Copy ni Download | Ajouter ces faits |

## 11. /tools/developer-tools/url-parser

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| url-parser | étape 3 | « protocol, hostname, port, path, search, and hash » | LIBELLÉ | La ligne affichée s'appelle « pathname », pas « path » (`page.jsx:15,28`) | « protocol, hostname, port, pathname, search and hash » |
| url-parser | astuce 1 | « without one, the URL is treated as invalid » | TROMPEUR | `new URL(text)` (`page.jsx:11`) accepte « example.com:8080/a » ou « localhost:3000 » en prenant « example.com: » / « localhost: » pour le protocole ; seul un texte sans « : » valable comme schéma est refusé | « Include https:// — without it, the address is refused or misread (localhost:3000 gives the protocol "localhost:") » |
| url-parser | astuce 3 | « so it correctly rejects malformed URLs rather than guessing » | TROMPEUR | L'analyseur WHATWG du navigateur (`page.jsx:11`) corrige au lieu de refuser : « https:example.com » est lu comme https://example.com/, les « \ » deviennent « / », l'hôte est mis en minuscules, un nom international passe en punycode (xn--), « ../ » est résolu | « It shows the address as browsers read it (normalised: lower-case host, punycode, \ → /) » |
| url-parser | FAQ 1 | « Why do I need to parse a URL? — It extracts the individual components of a URL… » | GÉNÉRIQUE | Phrase générale | Supprimer ou rendre propre |
| url-parser | FAQ 2 | « Yes, completely free with no registration required. » | GÉNÉRIQUE | Phrase-type (`unicite-avant.json`, 5 pages) | Supprimer |
| url-parser | FAQ 4 | « Is my URL sent to a server? — No, parsing uses the browser's native URL API… » | GÉNÉRIQUE | Juste ; phrase-type | Bloc « privacy » |
| url-parser | astuce 4 | « For domain-only analysis…, a dedicated domain-parsing tool will give a more detailed breakdown. » | GÉNÉRIQUE | Renvoi à un outil qui n'existe pas sur le site ; redit la FAQ 3 et l'about | Supprimer |
| url-parser | about, étapes (ensemble) | (non dit) | MINCE | Non dit : une clé répétée garde toutes ses valeurs, jointes par « , » (`page.jsx:13-14`) ; les valeurs sont affichées décodées (`URLSearchParams` : `%XX` et `+` → espace, `page.jsx:14`) ; un champ vide (port par défaut, pas de hash) s'affiche « — » (`page.jsx:28`) ; username, password, origin et host ne sont pas affichés (`page.jsx:15`) ; message « Invalid URL » (`page.jsx:17`) ; pas de Copy | Ajouter ces faits |

## 12. /tools/developer-tools/number-base-converter

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| number-base-converter (dev) | méta | « shows a number in binary, octal, decimal, and hexadecimal simultaneously » | MINCE | Toute base de 2 à 36 en entrée et en sortie (`app/components/BaseConverter.jsx:11,44-53`), parties fractionnaires (`app/lib/exactNumbers.js:24-45`) — la méta n'en dit rien | « …and any base from 2 to 36, fractions included » |
| number-base-converter (dev) | about, astuce 3 | « numbers of any size converted exactly » / « Numbers of any size are exact » | INVÉRIFIABLE | Arithmétique BigInt sans plafond dans le code (`exactNumbers.js:32-36,40-44`) ; « any size » sans essai dans `docs/audit/` | « no digit limit: integers are computed exactly (BigInt), e.g. 2^64 - 1 = FFFFFFFFFFFFFFFF » |
| number-base-converter (dev) | about, étape 4 | « the results update instantly » / « to see updated results instantly » | INVÉRIFIABLE | Ce que prouve le code : recalcul à chaque frappe (`BaseConverter.jsx:23,40`) | « as you type » |
| number-base-converter (dev) | FAQ 3, astuce 1 | « converted correctly across all four bases » / « All four bases update live » | TROMPEUR | Cinq résultats : les quatre + la base de « Also convert to », Base 36 par défaut (`BaseConverter.jsx:18,33,63-69`) | « all results (the four usual bases and the one you add) » |
| number-base-converter (dev) | étapes (ensemble) | (non dit) | MINCE | Non dit : bouton « Copy » sous chaque résultat (`BaseConverter.jsx:67`, copie sans « … », `:31`) ; case « Upper-case letters » cochée par défaut (`BaseConverter.jsx:19,55-57`) ; « _ » et espaces ignorés, signe « + » accepté (`exactNumbers.js:26-28`) ; message d'erreur (`BaseConverter.jsx:60`) | Ajouter ces faits |
| number-base-converter (dev) | page entière | (outil) | GÉNÉRIQUE | Jumeau exact de `/tools/math-tools/number-base-converter` : les deux pages rendent le même composant `<BaseConverter />` (`page.jsx:3,11` = `math-tools/number-base-converter/page.jsx:3,11`), même h1 et même sous-titre (`page.jsx:9-10`) | Différencier par l'usage (dev : hex/binaire, préfixes 0x/0b/0o ; math : fractions, bases 2-36) ou canoniser |

## 13. /tools/math-tools/number-base-converter

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| number-base-converter (math) | titre, méta, about | « Instantly Converts a Number Online » / « instantly converts a number » | INVÉRIFIABLE | Recalcul à chaque frappe (`BaseConverter.jsx:23,40`), aucune mesure ; le titre a en plus une faute d'accord | « …as you type » ; titre grammatical |
| number-base-converter (math) | méta | « showing all four results as you type » | TROMPEUR | Cinq résultats (`BaseConverter.jsx:18,33`), et toute base 2-36 (`BaseConverter.jsx:11`) | « the four usual bases plus any base from 2 to 36 » |
| number-base-converter (math) | about | « numbers of any size included, exactly » | INVÉRIFIABLE | BigInt sans plafond (`exactNumbers.js:32-36`) ; « any size » sans essai | « no digit limit (exact BigInt arithmetic) » |
| number-base-converter (math) | FAQ 3 | « Yes, it's completely free with no registration and no usage limits. » | GÉNÉRIQUE | Phrase-type | Supprimer |
| number-base-converter (math) | astuce 2 | « Use the Hexadecimal result directly for CSS/HTML color codes or memory addresses. » | TROMPEUR | L'outil convertit UN nombre (`BaseConverter.jsx:23-28`) ; une couleur CSS est #RRGGBB (trois canaux) : 255 donne « FF », pas une couleur | Supprimer, ou lier Color Converter |
| number-base-converter (math) | astuce 3 | « a message lists the digits that base uses » | TROMPEUR | Au-delà de la base 11, le message abrège : base 16 → « 0123456789…F » (`BaseConverter.jsx:60`) | « a message shows the valid digits (abbreviated above base 11) » |
| number-base-converter (math) | page entière | (outil) | GÉNÉRIQUE | Jumeau exact de `/tools/developer-tools/number-base-converter` (section 12) | Différencier ou canoniser |

## À vérifier (non compté : non prouvé par le code seul)

- Google Traduction : quand un visiteur choisit une langue, le script `translate.google.com/translate_a/element.js` est chargé
  (`app/lib/googleTranslate.js:8-24`, `app/components/GoogleTranslateLoader.jsx:7-10`) et traduit le texte de la page. Aucun
  résultat d'outil n'est marqué `notranslate` (recherche : seuls `Footer.jsx:14`, `Navbar.jsx:828,1168,1215`). Les résultats
  affichés comme texte de page (et non dans un champ de saisie) — en-tête et payload JWT (`jwt-decoder/page.jsx:83`), lignes
  de URL Parser (`url-parser/page.jsx:28`), empreintes (`hash-generator/page.jsx:155`), résultats de base
  (`BaseConverter.jsx:66`) — pourraient alors partir chez Google. À tester dans un navigateur avant d'écrire « never sent
  anywhere » sans réserve sur ces quatre pages ; correctif possible : `translate="no"` / `notranslate` sur ces résultats.

## Synthèse du lot dev-encode (13 pages, 98 défauts)

| Type | Nombre |
|---|---|
| FAUX | 6 |
| INVÉRIFIABLE | 10 |
| TROMPEUR | 21 |
| GÉNÉRIQUE | 43 |
| MINCE | 15 |
| LIBELLÉ | 3 |
| FORMAT | 0 |
| **Total** | **98** |
