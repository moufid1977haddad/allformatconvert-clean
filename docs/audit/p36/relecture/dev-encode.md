# P36 — relecture indépendante « dev-encode » (contrôle n° 2)

Réviseur : dev-encode. Date : 2026-10-05. Lecture seule ; aucun fichier du site modifié.

Pages relues (13) : developer-tools/base64-encoder, file-tools/base64-encoder, developer-tools/url-encoder,
text-tools/url-encoder, developer-tools/html-encoder, developer-tools/html-entity-decoder, developer-tools/hex-to-text,
developer-tools/unicode-converter, developer-tools/hash-generator, developer-tools/jwt-decoder, developer-tools/url-parser,
developer-tools/number-base-converter, math-tools/number-base-converter.

## Méthode

- Texte relu dans `page.jsx` (props de `<SeoContent>`, `seo.js` pour Hash Generator) et `layout.tsx` (`metadata`) ; valeurs
  `${…}` calculées depuis le code (`HASH_ALGORITHMS.length` = 17, `PREVIEW_CHARS` = 100 000).
- Code lu par moi-même : `app/lib/textCodecs.js`, `app/lib/exactNumbers.js`, `app/components/BaseConverter.jsx`,
  `app/lib/jwtVerify.js`, `app/lib/jsonText.js`, `app/lib/hashAlgorithms.js`, `hash.worker.js`, `app/lib/isMobileDevice.js`,
  `app/components/TextArea.jsx`, `FileDownload.jsx`, `FileDropBridge.jsx`, `UploadPrompt.jsx`, `app/lib/useToolError.js`,
  `app/lib/reportError.js`, `app/lib/fileSignature.js`, `app/lib/fileChecks.js`, `app/lib/googleTranslate.js`,
  `image-tools/image-to-base64/page.jsx` (pour les renvois).
- **Les 13 exemples ont été réexécutés en Node avec le code de l'outil** (copies de `textCodecs.js`, `exactNumbers.js`,
  `jwtVerify.js`, `jsonText.js` ; fonctions To/From Unicode extraites telles quelles de `page.jsx` ; encodeurs URL copiés
  du `ENCODERS` des pages ; `new URL` de Node = WHATWG ; empreintes par `crypto` de Node et `hash-wasm` du dépôt ;
  `browserNamedEntity` émulé avec `parse5` du dépôt, qui implémente le même tokenizer HTML5 que `DOMParser`). Les 13
  sorties affichées sont **exactes, au caractère près** (y compris la signature HS256 du jeton d'exemple, vérifiée avec
  `my-secret` par `verifyJwt` : `{ valid: true }`).
- Mesures de structure (titre, méta, mots About/privacy, étapes, FAQ) et phrases identiques / quasi identiques (n-grammes
  de 5 à 7 mots) mesurées sur les 225 pages depuis le source. `scripts/p36/content-verify.mjs` (C0-C7) : 0 échec sur les
  4 catégories — les défauts ci-dessous lui échappent.

## Relevé des défauts

Gravité : **H** = affirmation fausse qui fait échouer l'utilisateur ; **M** = fausse ou trompeuse dans un cas réel ; **B** = imprécision, structure ou duplication.

| # | Page | Endroit | Phrase (citation courte) | Problème | Preuve (fichier:ligne ou calcul) | Correction proposée |
|---|---|---|---|---|---|---|
| 1 | developer-tools/html-entity-decoder | howTo étape 3 | « the source was escaped twice: click "Decode" again » | **H — Faux (1).** Decode relit toujours la zone d'ENTRÉE, pas le résultat : un 2e clic redonne exactement le même résultat. | `html-entity-decoder/page.jsx:14` `const decode = () => setOutput(htmlDecode(input, …))` ; le résultat est dans une 2e zone en lecture seule (l. 27) | « …the source was escaped twice: copy the result into the box and click "Decode" again. » |
| 2 | developer-tools/html-entity-decoder | FAQ 1 (réponse) | « Each click of Decode removes exactly one layer, so click it a second time » | **H — Faux (1)**, même cause que n° 1. | `page.jsx:14` ; essai : `htmlDecode("&amp;amp;")` = `&amp;` à chaque clic | « Each Decode removes exactly one layer; paste the result back into the box and decode it again to reach the plain character. » |
| 3 | developer-tools/unicode-converter | About | « an emoji becomes two escapes, a UTF-16 surrogate pair » | **M — Faux (1)** pour les émojis du plan de base : ☕ (U+2615), ❤ (U+2764), ✅ (U+2705), ⌚ donnent **un** seul `\uXXXX`. | `page.jsx:9` `split('')` par unité UTF-16 ; calcul : `"☕"` → `☕` | « an emoji above U+FFFF, such as 😀, becomes two escapes, a UTF-16 surrogate pair » |
| 4 | developer-tools/unicode-converter | FAQ 1 (réponse) | « emoji lie above U+FFFF, so JavaScript stores them as a surrogate pair » | **M — Faux (1)** pour ☕, ❤, ✅… (U+2xxx). | idem ; `"☕".length` = 1 | « Most emoji, such as 😀, lie above U+FFFF… ; older ones such as ☕ (U+2615) give a single escape. » |
| 5 | developer-tools/unicode-converter | metadata.description (+ openGraph) | « Emoji become surrogate pairs. » | **M — Faux (1)**, même cause. | `layout.tsx:6,10` | « Emoji above U+FFFF become surrogate pairs. » (recompter 110-155) |
| 6 | developer-tools/hex-to-text | About | « so é gives c3 a9 and an emoji four bytes » | **M — Faux (1)** en général : ☕ = e2 98 95 (3 octets), ❤️ = 6, un drapeau = 8. | `textCodecs.js:47-49` (`TextEncoder`) ; calcul Node | « so é gives c3 a9 and 😀 gives four bytes (f0 9f 98 80) » |
| 7 | developer-tools/hex-to-text | FAQ 4 (réponse) | « accented Latin letters two » | **B — Inexact (1)** : les lettres vietnamiennes (ế U+1EBF, ạ U+1EA1) font 3 octets. | calcul : `TextEncoder("ế")` = e1 ba bf | « most accented Latin letters two » |
| 8 | developer-tools/base64-encoder | FAQ 2 (réponse) | « Accented letters take two bytes » | **B — Inexact (1)**, même cause que n° 7. | idem | « Most accented letters take two bytes » |
| 9 | developer-tools/url-encoder | About | « encodeURIComponent, which escapes every reserved character, & = ? / # included » | **M — Faux (1)** : `! ' ( ) *` sont des caractères réservés (sous-délimiteurs RFC 3986) que encodeURIComponent n'échappe pas — c'est justement la raison d'être du mode « Strict RFC 3986 » cité deux phrases plus loin. | `developer-tools/url-encoder/page.jsx:10,13` ; calcul : `encodeURIComponent("Rock 'n' Roll (live)!")` = `Rock%20'n'%20Roll%20(live)!` | « …which escapes & = ? / # and the other delimiters, but leaves ! ' ( ) * as they are… » |
| 10 | text-tools/url-encoder | About | « symbols such as & or ? are escaped so they do not cut a link short » | **B — Inexact (1)** : faux en mode « A whole URL », qui garde & et ? (et la phrase est présentée comme une règle générale). | `text-tools/url-encoder/page.jsx:13` (`encodeURI`) ; calcul : `…?q=café au lait&page=2` garde `?` et `&` | « In the default mode, symbols such as & or ? are escaped… » |
| 11 | file-tools/base64-encoder | howTo étape 2 | « the result first appears as "Data URL" » | **B — Inexact (1)** : le choix Data URL / Raw Base64 est conservé d'un fichier à l'autre ; après « Raw Base64 », le fichier suivant s'affiche en Raw. | `file-tools/base64-encoder/page.jsx:23` (`raw` jamais remis à false dans `encode`, l. 28-53) | « …and the result appears in the form last chosen, "Data URL" for the first file. » |
| 12 | file-tools/base64-encoder | privacy | « If reading fails, only the wording of the error is reported » | **B — Incomplet (3)** : le message « This file is empty (0 bytes)… » est aussi signalé (via `useToolError`). Rien de plus n'est envoyé, mais la phrase ne décrit qu'un des deux cas. | `page.jsx:33` `setError(emptyFileProblem(…))` → `useToolError.js:47` `reportShownMessage` | « When an error is shown (an empty file, a file that cannot be read), only its wording is reported to us… » |
| 13 | developer-tools/jwt-decoder | specs « Keys refused, with a reason » | « JWK Sets, X.509 certificates, PKCS#1 RSA keys and private keys » | **M — Faux (1)** : une clé **privée en JWK** (avec `d`) est acceptée ; seule sa partie publique est utilisée. Seules les clés privées **PEM** sont refusées. | `app/lib/jwtVerify.js:66` (`const { d, p, q, … , ...pub } = jwk`), `:74` (refus PEM seulement) ; essai Node : JWK privée P-256 → `{ valid: true, alg: 'ES256' }` | « …PKCS#1 RSA keys and PEM private keys (a private JWK is reduced to its public part) » |
| 14 | developer-tools/hash-generator | howTo étape 2 | « click the "Hash" button » | **B — Libellé (2)** : aucun bouton « Hash » ; le bouton s'appelle « Hash 1 file » / « Hash 3 files ». | `hash-generator/page.jsx:265` `` `Hash ${files.length || ''} file${…}` `` | « …then click "Hash N files" (it shows how many files it will hash). » |
| 15 | developer-tools/hash-generator | howTo étape 4 | « "Copy all" or "Download" gives checksums.txt » | **B — Inexact (1)** : « Copy all » copie le texte dans le presse-papiers, il ne donne pas de fichier checksums.txt. | `page.jsx:278-279` (`copy(checksumLines(…))` vs `TextDownload … name="checksums.txt"`) | « …"Copy all" copies the checksum lines and "Download" saves them as checksums.txt. » |
| 16 | developer-tools/hash-generator | specs « Web Crypto path » et FAQ 2 | « 100 MiB on phones and tablets » | **B — Inexact (1)** : sur tablette Android avec Chrome/Edge, `navigator.userAgentData.mobile` vaut false → seuil 700 MiB. (iPad et Firefox Android : 100 MiB, exact.) | `page.jsx:21` `inMemoryMax` ; `app/lib/isMobileDevice.js:5` | « 100 MiB on phones, iPads and most Android tablets » ou « on devices detected as mobile » |
| 17 | developer-tools/hash-generator | About | « Paste a published checksum to see which algorithm matches » | **B — Inexact (1)** : la comparaison ne porte que sur les algorithmes cochés (sinon : « None of the selected algorithms… »). | `page.jsx:143` (`active.some(…)`), `:160` | « …to see which ticked algorithm matches » |
| 18 | developer-tools/hash-generator | privacy | « An error displayed on screen is reported to us by its wording only. » | **B — Inexact (3)** : seules les erreurs de la zone rouge (`setError`) sont signalées ; l'erreur par fichier affichée dans la liste et « This is neither hexadecimal nor Base64. » ne le sont pas. | `page.jsx:73` (useToolError) vs `:273` (`r.error` rendu sans signalement), `:221` | « An error shown in the red message box is reported to us by its wording only. » |
| 19 | developer-tools/hash-generator | tips n° 2 | « None of these are appropriate for storing passwords — use … bcrypt or Argon2. » | **B — Générique (5)** : conseil vrai sur toute page de hachage, qui ne mène à aucune action dans cet outil ni à un outil lié (règle tips). | `page.jsx:319` | Supprimer, ou le remplacer par une action propre à l'outil (ex. « Tick only SHA-256 before "Download" to get a file that `sha256sum -c` reads completely. ») |
| 20 | developer-tools/jwt-decoder | tips n° 1 | « A secret copied from a .env file often ends with a line break » | **B — Invérifiable (4)** : « often » sans preuve ; et le contrôle « matches without it » n'existe qu'avec « Secret is » = text. | `app/lib/jwtVerify.js:115` (`secretEncoding === 'utf8'`) | « A secret copied from a .env file can end with a line break; with "Secret is" set to text, the verdict says so when the secret matches without it. » |
| 21 | developer-tools/number-base-converter | privacy | « the values you type are not sent anywhere » | **M — Promesse trop large (3)** : les résultats s'affichent en texte de page (div) ; si le visiteur active une traduction (menu des langues), Google reçoit ce texte — ce que disent déjà Hash Generator, JWT Decoder et URL Parser. | `app/components/BaseConverter.jsx:66` ; `app/lib/googleTranslate.js:8` | « …are not sent to our servers. If you turn on a translation in the language menu, Google receives the page's visible text, results included. » |
| 22 | math-tools/number-base-converter | privacy | « nothing you type travels to a server » | **M — Promesse trop large (3)**, même cause que n° 21. | idem | idem, formulation propre à la page |
| 23 | math-tools/number-base-converter | About | « Also convert to adds a fifth base, base 36 at first » | **B — Inexact (1)** : si « Also convert to » vaut 2, 8, 10 ou 16, aucune 5e carte n'apparaît. | `BaseConverter.jsx:33` (`targets = COMMON.some(…) ? COMMON : …`) | « …adds a fifth base when you choose one other than 2, 8, 10 or 16 (base 36 at first). » |
| 24 | developer-tools/number-base-converter | About | « plus one more base of your choice up to 36 » | **B — Inexact (1)**, même cause que n° 23. | idem | « plus one more base from 3 to 36 that is not already shown » |
| 25 | developer-tools/number-base-converter | FAQ 3 (réponse) | « Can it handle values above 2^64? Yes. … 2^64 - 1 … converts to 18446744073709551615 » | **B — Exemple hors sujet (1)** : 2^64 − 1 n'est pas au-dessus de 2^64. | calcul Node : `0x1_0000_0000_0000_0000` → 18446744073709551616 (exact) | Citer 2^64 : « 0x1_0000_0000_0000_0000 converts to 18446744073709551616 exactly » |
| 26 | developer-tools/number-base-converter | About | « This converter is built for programming notation. » | **B — Différence inventée avec le jumeau (5)** : les deux pages utilisent le même composant `BaseConverter` ; la page Math accepte aussi 0x, 0b, 0o et `_`. | `developer-tools/number-base-converter/page.jsx:3,11` et `math-tools/…/page.jsx:3,11` ; `exactNumbers.js:26,29` | « This page shows how the converter reads programming notation. » |
| 27 | developer-tools/html-encoder | tips n° 2 | « HTML Entity Decoder is set up for that job » | **M — Différence inventée avec le jumeau (5)** : HTML Entity Decoder appelle exactement la même fonction `htmlDecode` ; le bouton Decode de cette page fait le même travail (seul le nom du fichier téléchargé diffère : encoded.txt / decoded.txt). | `html-encoder/page.jsx:11` = `html-entity-decoder/page.jsx:14` | Supprimer, ou : « Decode on this page reads the same entities as HTML Entity Decoder, including named ones such as &eacute;. » |
| 28 | developer-tools/html-encoder | About (dernière phrase) | « Everything happens in your browser. » | **B — Générique / identique (5)** : phrase identique sur xml-formatter et file-splitter. | recherche plein site | Formulation propre, ex. « The escaping is done by this page's script, in your browser. » |
| 29 | developer-tools/hex-to-text | About (dernière phrase) | « The conversion runs in your browser. » | **B — Générique / identique (5)** : identique sur 6 autres pages, dont la voisine unicode-converter, + color-converter, json-to-csv, grayscale-converter, image-converter, case-converter. | recherche plein site | « Your browser's TextEncoder and TextDecoder do the work. » (sans reprendre la phrase privacy) |
| 30 | developer-tools/unicode-converter | About (dernière phrase) | « The conversion runs in your browser. » | **B — Générique / identique (5)**, même liste que n° 29. | idem | « Both directions are a few lines of script in this page. » |
| 31 | developer-tools/hash-generator | About (dernière phrase) | « Everything is computed in your browser. » | **B — Générique / identique (5)** : identique sur image-tools/duplicate-image-finder. | idem | « Web Workers in your tab compute every hash. » |
| 32 | math-tools/number-base-converter | About (dernière phrase) | « …and the work is done in your browser. » | **B — Quasi identique (5)** à statistics-calculator (« …, and the work is done in your browser ») et proche d'audio-compressor. | recherche 7-grammes | Formulation propre à l'outil (ex. « …exact BigInt fractions computed in this tab »). |
| 33 | developer-tools/number-base-converter ↔ math-tools/number-base-converter | FAQ 4 (dev) / FAQ 5 (math) | « The message shows the allowed digits, shortened for large bases. » / « The message shows the allowed digits, shortened above base 11, … » | **B — Jumeaux quasi identiques (5)**. | `dev/page.jsx:42`, `math/page.jsx:43` | Réécrire l'une des deux (ex. dev : « Below the field, the alert lists the digits allowed in base 16: 0123456789…F. ») |
| 34 | developer-tools/number-base-converter ↔ math-tools/number-base-converter | specs « Fractions » | « a fraction that does not end is cut after 40 digits and marked … » / « a fraction that does not end stops after 40 digits, marked … » | **B — Jumeaux quasi identiques (5)**. | `dev/page.jsx:34`, `math/page.jsx:33` | Dans la page dev, dire autre chose de vrai : « Accepted after one point; a result that does not end shows its first 40 digits, then … » ou supprimer la ligne (les fractions sont le sujet de la page Math). |
| 35 | developer-tools/html-encoder ↔ developer-tools/html-entity-decoder | privacy (dernière phrase) | « The text you paste is not sent to us and is not saved anywhere. » / « The text you paste is not sent to our servers and is gone when you close the tab. » | **B — Jumeaux quasi identiques (5)** (même amorce de 7 mots, reprise aussi par base64-encoder dev). | `html-encoder/page.jsx:50`, `html-entity-decoder/page.jsx:54` | Réécrire une des deux autour de ce qui est propre (ex. décodeur : « What you paste stays in this tab and disappears when it closes. ») |
| 36 | file-tools/base64-encoder ↔ image-tools/image-to-base64 | About (1re phrase) | « File to Base64 reads one file of any type and writes its bytes as Base64 text. » | **B — Quasi identique au jumeau (5)** : « Image to Base64 reads an image file and writes its bytes as Base64 text… ». | `file-tools/base64-encoder/page.jsx:88` ; `image-to-base64/page.jsx:68` | Réécrire (ex. « File to Base64 turns the bytes of any file — PDF, ZIP, font, audio — into Base64 text. ») |
| 37 | file-tools/base64-encoder ↔ image-tools/image-to-base64 | privacy (1re phrase) | « The file is read with your browser's FileReader and encoded on your device » | **B — Quasi identique au jumeau (5)** (« …and encoded on this page »). | `file-tools/…/page.jsx:109` | Réécrire (ex. « Your browser's FileReader encodes the file locally… ») |
| 38 | file-tools/base64-encoder ↔ image-tools/image-to-base64 | specs « File size » | « the result is about a third larger than the file » | **B — Quasi identique au jumeau (5)** (« the text is about a third larger than the file »). | `file-tools/…/page.jsx:106` | « …every 3 bytes of the file become 4 characters » |
| 39-44 | developer-tools/base64-encoder, developer-tools/url-encoder, developer-tools/html-encoder, developer-tools/html-entity-decoder, developer-tools/hex-to-text, developer-tools/unicode-converter | howTo dernière étape | « Click "Copy", or "Download" to save/keep the result as <nom>.txt. » | **B — Quasi identique (5)** : même phrase, au nom de fichier près, sur 14 pages (aussi code-minifier, json-to-typescript, json-to-csharp, case-converter, duplicate-remover, text-encryptor, text-reverser, text-sorter, text-to-list, text-truncator, whitespace-remover). 1 défaut par page de ma liste (6). | recherche 7-grammes | Une dernière étape propre à chaque outil (ce qu'on obtient, ex. hex : « The bytes or the text appear below; "Download" saves them as converted.txt. ») |
| 45 | developer-tools/unicode-converter | privacy | (37 mots) | **B — Structure (6)** : section privacy sous 40 mots (consigne de rédaction : 40-90). | décompte | Ajouter le fait utile manquant (ex. qu'aucune traduction ne lit la zone de résultat, ou ce qui n'est pas signalé). |

### FAQ dont la réponse ne commence ni par Yes / No ni par un chiffre (point 6 ; une ligne par FAQ)

Règle (consigne de rédaction et gabarit §2d) : « la réponse commence par Yes / No / le chiffre ». Acceptées comme
chiffre/valeur : « About a third » (file base64), « As %20 » (url dev), « Zero, … » (entity decoder), « One to four »
(hex), « Not by itself » (jwt = No). Correction générique : reformuler la question en oui/non ou en « How many / How much »
et ouvrir la réponse par Yes / No / le nombre, sans perdre la réponse exacte actuelle.

| # | Page | FAQ (ligne) | Début de la réponse | Correction proposée (exemple) |
|---|---|---|---|---|
| 46 | developer-tools/base64-encoder | « Why is the Base64 longer than my text? » (`page.jsx:62`) | « Every three bytes… » | « How much longer is Base64 than my text? » → « About a third longer… » |
| 47 | developer-tools/base64-encoder | « What does URL-safe Base64 change? » (`:63`) | « It writes… » | « Does URL-safe Base64 change the characters? » → « Yes. It writes - and _ … » |
| 48 | developer-tools/base64-encoder | « Why does Decode say my data is binary? » (`:64`) | « Because… » | « Can Decode show an image or a ZIP? » → « No. … » |
| 49 | file-tools/base64-encoder | « Why does my data URL say application/octet-stream? » (`:112`) | « Because… » | « Can the tool find the type when my browser gives none? » → « Yes, for common … » |
| 50 | developer-tools/url-encoder | « Should I use encodeURIComponent or encodeURI? » (`:76`) | « Use… » | « Is encodeURIComponent right for a single parameter? » → « Yes. … » |
| 51 | developer-tools/url-encoder | « Why does + turn into a space when I decode? » (`:77`) | « Because… » | « Does Decode turn + into a space? » → « Yes, by default… » |
| 52 | text-tools/url-encoder | « How do I decode a URL full of %20 and %C3 codes? » (`:91`) | « Paste it… » | « Can I read a link full of %20 and %C3 codes? » → « Yes. Paste it… » |
| 53 | text-tools/url-encoder | « Why does é become %C3%A9 and not %E9? » (`:92`) | « Because… » | « Is %E9 a valid code for é? » → « No, not on its own… » |
| 54 | text-tools/url-encoder | « Which characters are left as they are? » (`:93`) | « In the… » | « Are letters and digits left as they are? » → « Yes. … » |
| 55 | developer-tools/html-encoder | « Why is the apostrophe written &#39; and not &apos;? » (`:53`) | « Because… » | « Does Decode read both &#39; and &apos;? » → « Yes. … » |
| 56 | developer-tools/html-entity-decoder | « Why does my text still show &amp; after decoding? » (`:56`) | « Because… » | (à réécrire avec le défaut n° 2) « Does one Decode remove every layer? » → « No. One layer per Decode… » |
| 57 | developer-tools/html-entity-decoder | « What happens to &nbsp;? » (`:58`) | « It becomes… » | « Is &nbsp; turned into an ordinary space? » → « No. It becomes U+00A0… » |
| 58 | developer-tools/hex-to-text | « Why does é become c3 a9 and not e9? » (`:55`) | « Because… » | « Is é written as two bytes? » → « Yes, c3 a9 in UTF-8… » |
| 59 | developer-tools/hex-to-text | « What hex formats can I paste? » (`:56`) | « Any pairs… » | « Can I paste 0x48 or \x48 forms? » → « Yes. … » |
| 60 | developer-tools/hex-to-text | « Why does it say the bytes are not valid UTF-8 text? » (`:57`) | « The bytes… » | « Can it decode Latin-1 or Windows-1252? » → « No. … » |
| 61 | developer-tools/unicode-converter | « Why does an emoji give two \u escapes? » (`:53`) | « Because… » | (à réécrire avec le défaut n° 4) « How many \u escapes does an emoji take? » → « 2 above U+FFFF, 1 for ☕… » |
| 62 | developer-tools/unicode-converter | « Why is the letter A turned into A? » (`:55`) | « Because… » | « Does To Unicode escape plain letters too? » → « Yes. … » |
| 63 | developer-tools/hash-generator | « Which hash should I use: MD5, SHA-1 or SHA-256? » (`:308`) | « Use the one… » | « Is MD5 still safe to use? » → « No for security, yes against accidental corruption… » |
| 64 | developer-tools/hash-generator | « How do I verify a downloaded file? » (`:310`) | « Choose "Files"… » | « Can I check a download against its published checksum? » → « Yes. Choose "Files"… » |
| 65 | developer-tools/hash-generator | « What does the HMAC key do? » (`:312`) | « With a key… » | « Can I compute an HMAC such as HMAC-SHA256? » → « Yes. … » |
| 66 | developer-tools/hash-generator | « Why does my text give a different hash elsewhere? » (`:313`) | « Usually… » | « Does a trailing newline change the hash? » → « Yes. … » |
| 67 | developer-tools/jwt-decoder | « Why is my public key refused for an HS256 token? » (`:115`) | « Because… » | « Can an HS256 token be checked with a public key? » → « No. … » |
| 68 | developer-tools/jwt-decoder | « Why is my JWK Set or certificate refused? » (`:116`) | « Because… » | « Can I paste a JWK Set or a certificate? » → « No. … » |
| 69 | developer-tools/jwt-decoder | « Why does Decode say Invalid JWT token? » (`:117`) | « The text… » | « Can a wrong signature cause Invalid JWT token? » → « No. … » |
| 70 | developer-tools/url-parser | « Why is my URL invalid? » (`:57`) | « Usually… » | « Does the address need its scheme? » → « Yes. … » |
| 71 | developer-tools/url-parser | « Why does localhost:3000 show localhost: as the protocol? » (`:58`) | « Because… » | « Is localhost:3000 read as host and port? » → « No. … » |
| 72 | developer-tools/url-parser | « Why is the port empty for https://example.com:443? » (`:59`) | « Because… » | « Is a default port such as 443 shown? » → « No. … » |
| 73 | developer-tools/number-base-converter | « How do I convert hex to binary? » (`:39`) | « Set From Base… » | « Can I paste hex with or without 0x? » → « Yes. … 0x0F gives 1111. » |
| 74 | developer-tools/number-base-converter | « Why do I get Not a number in base 16? » (`:42`) | « The value… » | « Is 0x10 accepted with Binary selected? » → « No. … » (à réécrire avec le n° 33) |
| 75 | math-tools/number-base-converter | « Why does 0.1 never end in binary? » (`:39`) | « Because… » | « Does 0.1 end in binary? » → « No. … » |
| 76 | math-tools/number-base-converter | « How do I convert a number from base 3 to base 7? » (`:40`) | « Choose Base 3… » | « Can I convert from base 3 to base 7? » → « Yes. … » |
| 77 | math-tools/number-base-converter | « What do the letters in bases above 10 mean? » (`:41`) | « They are digits… » | « How many digits does base 36 use? » → « 36: 0-9 then A = 10 … Z = 35… » |
| 78 | math-tools/number-base-converter | « How are negative numbers converted? » (`:42`) | « The minus sign… » | « Does it use two's complement? » → « No. … » (formulation distincte du jumeau) |
| 79 | math-tools/number-base-converter | « Why is my number rejected? » (`:43`) | « A digit… » | « Is 9 accepted in octal? » → « No. … » (formulation distincte du jumeau, cf. n° 33) |

### Vérifié exact (aucun défaut) — pour mémoire

- Les 13 exemples (sorties reproduites en Node, cf. Méthode).
- Titres 50-58 caractères, métas 130-153 caractères, toutes différentes du texte About ; About 84-107 mots ; 3-4 étapes ;
  4-6 FAQ par page ; FAQ de 26 à 49 mots.
- Libellés cités (Encode, Decode, Copy, Download, URL-safe…, Encode as + 3 options, Decode “+” as a space, Copy Base64,
  Data URL, Raw Base64, Text to Hex, Hex to Text, To Unicode, From Unicode, Text, Files, Select all, Expected hash…, Copy
  all, Decode, Verify the signature, Secret is, Verify signature, Parse URL, Query Params, From Base, Also convert to,
  Upper-case letters, Copy) : présents dans le JSX.
- Lieux de traitement : aucun appel réseau dans ces 13 outils hors signalement d'erreur (`/api/report-error`, texte
  assaini) et Google Traduction si le visiteur l'active ; les textes privacy le disent, sauf n° 12, 18, 21, 22.
- Hash Generator : 17 algorithmes, défauts MD5/SHA-1/SHA-256/SHA-512/CRC32, HMAC refusé pour Keccak-256, BLAKE3, CRC32,
  CRC32C, xxHash ; checksums.txt en hexadécimal minuscule ; 8 MiB / 700 MiB / 100 MiB prouvés dans le code.
- JWT : algorithmes, refus alg none / clé publique pour HS* / JWK Set / certificat / PKCS#1 / PEM privée / crit / b64:false,
  notes « expired » / « not valid yet », sel PSS, secret avec saut de ligne : conformes au code.
- URL Parser : normalisation (hôte minuscule, ../ résolu, punycode xn--bcher-kva.de), port par défaut vidé, localhost:3000
  lu comme schéma, espace dans l'hôte et port 65536 refusés : vérifiés avec `new URL`.

## Totaux

- Pages relues : **13**.
- Défauts : **79**.
  - Point 1 (exactitude) : **18** — n° 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 16, 17, 23, 24, 25.
  - Point 2 (libellés) : **1** — n° 14.
  - Point 3 (lieu de traitement / privacy) : **4** — n° 12, 18, 21, 22.
  - Point 4 (invérifiable) : **1** — n° 20.
  - Point 5 (générique / dupliqué / différence inventée entre jumeaux) : **20** — n° 19, 26, 27, 28, 29, 30, 31, 32, 33,
    34, 35, 36, 37, 38, 39-44 (6).
  - Point 6 (structure) : **35** — n° 45 et 46-79 (34 FAQ).
  - Point 7 (exemple) : **0**.
- Graves (H) : n° 1 et 2 (html-entity-decoder : « cliquez à nouveau sur Decode » ne fait rien). Moyens (M) : n° 3-6, 9, 13,
  21, 22, 27.
- Pages **sans aucun défaut** : **aucune**. (developer-tools/url-parser n'a que les 3 défauts de forme de FAQ n° 70-72 ;
  sans la règle « Yes / No / chiffre », elle serait à zéro.)

## Deuxième passe (2026-10-06)

Les 13 pages ont été relues en entier : texte SEO, `metadata` et chaînes d'interface (sous-titres, notes, options,
messages). Le code n'a pas changé (`git diff`) : `textCodecs.js`, `exactNumbers.js`, `jwtVerify.js`, `jsonText.js` et
`BaseConverter.jsx` ne sont pas modifiés ; les encodeurs URL et les fonctions To/From Unicode sont identiques.

Les précisions du 06/10 (`CONSIGNES-REDACTION.md`) sont appliquées :
- la règle FAQ : question fermée → Yes / No / chiffre ; How / What / Why / Which → réponse directe ;
- la formule « phones, iPhone and iPad » ;
- la formule des rapports d'erreur : message, nom de l'outil, nom et version du navigateur ;
- `ToolErrorWatch`, qui signale les exceptions ET les promesses rejetées non rattrapées (`app/tools/ToolErrorWatch.jsx:27-36`).

**Exemples réexécutés en Node**, avec les mêmes scripts qu'en 1re passe et les bibliothèques recopiées du dépôt du jour :
les 13 sorties sont toujours exactes. Nouveaux chiffres vérifiés :
- 2^64 = `0x1_0000_0000_0000_0000` → 18446744073709551616 ;
- ☕ = U+2615 : une seule séquence `☕`, 3 octets `e2 98 95` ;
- ế = 3 octets.

**Les 79 défauts de la 1re passe sont corrigés** ; je les ai vérifiés un par un dans le source.

Les nouvelles chaînes d'interface sont exactes :
- l'option « A whole URL (keeps : / ? # & = + ; , @ $) » correspond à `encodeURI` ;
- les sous-titres et notes de Hash Generator (« no size cap set by the tool ») sont vrais.

Mesures, toutes conformes : titres 50-58 caractères, métas 130-153, About 88-113 mots, privacy 51-75 mots, 3-4 étapes,
4-6 FAQ, toutes conformes à la règle FAQ précisée.

### Défauts restants

| # | Page | Endroit | Phrase (citation courte) | Problème | Preuve (fichier:ligne ou calcul) | Correction proposée |
|---|---|---|---|---|---|---|
| R1 | developer-tools/unicode-converter | privacy | « only if the page itself crashed would we receive the error… » | **B — Inexact (3)** : le bouton « Copy » n'attrape pas un refus du presse-papiers. `ToolErrorWatch` signale alors la promesse rejetée (message, outil, navigateur) sans aucun plantage, donc « only » est faux. | `unicode-converter/page.jsx:26` (`navigator.clipboard.writeText(output)` sans `.catch`) ; `app/tools/ToolErrorWatch.jsx:27-36` | « …we receive an error only if the page fails, for instance when the browser refuses a copy: the error, the tool's name and your browser's name and version, never the text you pasted. » |
| R2 | developer-tools/html-entity-decoder | privacy | « only a crash of the page itself would send us an error report, without your text » | **B — Inexact (3)** : même cause que R1, car Copy n'a pas de `.catch` (`page.jsx:28`). La phrase ne dit pas non plus ce qui est envoyé, alors que la règle « Rapports d'erreur » demande : message, nom de l'outil, nom et version du navigateur. | `html-entity-decoder/page.jsx:28` ; `ToolErrorWatch.jsx:27-36` ; `app/lib/reportError.js` (contenu du rapport) | « …if the page fails, for instance when the browser refuses a copy, we receive the error, the tool's name and your browser's name and version, without your text. » |
| R3 | developer-tools/html-encoder | privacy | « if the page itself crashed, we would receive the error… » | **B — Incomplet (3)** : la phrase présente le plantage comme le seul cas. Or un refus de copie est aussi signalé sans plantage, car Copy n'a pas de `.catch` (`page.jsx:24`). | `html-encoder/page.jsx:24` ; `ToolErrorWatch.jsx:27-36` | « …if the page fails, for instance when the browser refuses a copy, we receive… » |
| R4 | developer-tools/base64-encoder | privacy | « If an error message appears, we receive that message… » | **B — Incomplet (3)** : un refus de copie est aussi signalé, sans message à l'écran, car Copy n'a pas de `.catch`. | `base64-encoder/page.jsx:32` ; `ToolErrorWatch.jsx:27-36` | Ajouter « or if the browser refuses a copy ». |
| R5 | file-tools/base64-encoder | privacy | « When an error is shown, such as an empty file or a file that cannot be read, we receive… » | **B — Incomplet (3)** : même cause que R4, car « Copy Base64 » n'a pas de `.catch`. | `file-tools/base64-encoder/page.jsx:78` | Ajouter « or when the browser refuses a copy ». |
| R6 | developer-tools/url-encoder | privacy | « When Encode or Decode fails, we receive the browser's error message… » | **B — Incomplet (3)** : même cause que R4, car Copy n'a pas de `.catch`. Le jumeau texte, lui, attrape ce refus et le dit. | `developer-tools/url-encoder/page.jsx:47` | « When Encode, Decode or a copy to the clipboard fails, we receive… » |
| R7 | developer-tools/hex-to-text | privacy | « When the tool shows an error, such as an odd number of digits, we receive… » | **B — Incomplet (3)** : même cause que R4. | `hex-to-text/page.jsx:27` | Ajouter « or when the browser refuses a copy ». |
| R8 | developer-tools/hash-generator | privacy | « When the red error box shows a message, we receive that message… » | **B — Inexact (3)** : le message d'annulation « Cancelled. Files finished before the cancel… » s'affiche dans la boîte rouge mais n'est pas envoyé (`NOT_AN_ERROR`). | `hash-generator/page.jsx:132` ; `app/lib/useToolError.js:17,25` | « When the red error box shows an error (a cancel excepted), we receive… » |
| R9 | developer-tools/jwt-decoder | note d'interface sous « Verify signature » | « the key and the token are not sent anywhere » | **B — Promesse trop large (3)** : si une traduction est activée, Google reçoit l'en-tête et la charge utile décodés, c'est-à-dire le contenu du jeton. La section privacy de la même page le dit. | `jwt-decoder/page.jsx:81` vs `:111` (privacy) ; `app/lib/googleTranslate.js` | « Checked in your browser with WebCrypto; the key and the token are not sent to our servers. … » |
| R10 | developer-tools/html-encoder | howTo étape 4 | « Paste the escaped result into your HTML with "Copy" » | **B — Inexact (1)** : « Copy » copie dans le presse-papiers ; il ne colle rien dans le HTML. | `html-encoder/page.jsx:24`, `:42` | « Click "Copy" and paste the escaped result into your HTML, or keep it with "Download" (encoded.txt, even after a decode). » |
| R11 | developer-tools/number-base-converter ↔ math-tools/number-base-converter | FAQ (dev `:40`, math `:42`) | « Does it show two's complement for negative numbers? » / « Does it use two's complement for negative numbers? » | **B — Jumeaux quasi identiques (5)** : les deux questions ne diffèrent que d'un mot, et les deux réponses traitent le même fait de la même façon. | `dev/page.jsx:40`, `math/page.jsx:42` | Ne garder la question que sur une page, ou la reformuler autour d'un fait propre (dev : « Can I get FFFFFFFF for -1? » → « No. … »). |
| R12 | developer-tools/base64-encoder ↔ developer-tools/html-entity-decoder | howTo dernière étape | « "Copy" takes it, and "Download" saves it as base64.txt… » / « where "Copy" takes it and "Download" saves it as decoded.txt » | **B — Quasi identique (5)** : même tournure à un mot près, c'est le motif déjà signalé aux n° 39-44. | `base64-encoder/page.jsx:50`, `html-entity-decoder/page.jsx:46` | Réécrire l'une des deux avec ce qui est propre à l'outil. |
| R13 | developer-tools/base64-encoder | About | (aucune phrase sur le lieu de traitement) | **B — Structure (6)** : « in your browser » a été retiré, et l'About ne dit plus où le texte est traité. La consigne de rédaction l'exige ; seules la méta et la section privacy le disent. | `base64-encoder/page.jsx:37` | Ajouter une phrase courte, sans reprendre la privacy mot pour mot (ex. « Your browser's TextEncoder, btoa and atob do the work. »). |
| R14 | developer-tools/number-base-converter | About | (aucune phrase sur le lieu de traitement) | **B — Structure (6)** : même manque que R13, après le retrait de « in your browser ». Le jumeau Math le dit (« in this tab »). | `number-base-converter/page.jsx:15` | « Results update on every keystroke, computed with BigInt arithmetic in this page. » |

### Totaux de la deuxième passe

- Pages relues : **13**. Exemples réexécutés : **13 sur 13 exacts**.
- Défauts restants : **14**, tous de gravité B ; aucun grave (H) ni moyen (M).

| Point de la liste | Défauts | Numéros |
|---|---|---|
| 1 Exactitude | 1 | R10 |
| 2 Libellés | 0 | — |
| 3 Lieu de traitement | 9 | R1-R9 |
| 4 Invérifiable | 0 | — |
| 5 Générique / dupliqué | 2 | R11, R12 |
| 6 Structure | 2 | R13, R14 |
| 7 Exemple | 0 | — |

- Pages **sans aucun défaut** : **developer-tools/url-parser** et **text-tools/url-encoder**.
- math-tools/number-base-converter n'a qu'un défaut : R11, partagé avec son jumeau.

## Troisième passe (2026-10-06)

### Pages relues

J'ai relu en entier, texte et chaînes d'interface, les 11 pages touchées :
- unicode-converter, html-entity-decoder, html-encoder, hex-to-text, hash-generator, jwt-decoder ;
- base64-encoder, url-encoder et number-base-converter (dev) ;
- base64-encoder (file-tools) et number-base-converter (math).

### Corrections vérifiées

- **R1-R7** : chaque privacy cite maintenant le refus de copie, sans « only ». Le contenu du rapport annoncé (message, nom de
  l'outil, nom et version du navigateur) correspond à `reportError.js` et `ToolErrorWatch.jsx:27-36`.
- **R8** : « (a cancel excepted) » correspond à `NOT_AN_ERROR` (`useToolError.js:17,25`).
- **R9** : la note JWT dit maintenant « not sent to our servers » (`jwt-decoder/page.jsx:81`).
- **R10** : l'étape 4 dit maintenant « Click "Copy" and paste… ».
- **R11** : la nouvelle FAQ dev « Can I get FFFFFFFF for -1? » est vérifiée avec le code de l'outil : 4294967295 en base 10 donne
  FFFFFFFF. Elle ne recoupe plus la question de la page math.
- **R12-R14** : réécritures exactes ; les deux About disent maintenant où se fait le calcul.
- **Méta Base64 (dev)** : 136 caractères, openGraph identique.

### Contrôles

- **Exemples** : réexécutés en Node, ils restent exacts (Base64, Hex, HTML, Unicode, base 16).
- **Structure** : titres 50-58 caractères, métas 130-153, About 88-113 mots, privacy 57-75 mots.
- **content-verify** : 0 échec sur developer-tools, file-tools et math-tools.

### Défaut restant

| # | Page | Endroit | Phrase (citation courte) | Problème | Preuve | Correction proposée |
|---|---|---|---|---|---|---|
| T1 | developer-tools/unicode-converter ↔ developer-tools/html-entity-decoder | privacy (dernière phrase) | « if the page fails, for instance when the browser refuses a copy, we receive the error, the tool's name and your browser's name and version, never the text you pasted » / « If the page fails, for instance when the browser refuses a copy, we receive the error, the tool's name and your browser's name and version, without your text. » | **B — Quasi identique (5)** : les deux phrases ne diffèrent que par la fin, sur deux pages voisines. Elles reprennent toutes deux la formulation que j'avais proposée pour R1 et R2. | `unicode-converter/page.jsx:51`, `html-entity-decoder/page.jsx:54` | Reformuler l'une des deux, en gardant les mêmes faits. Exemple pour le décodeur : « A copy the browser refuses, or any other failure of the page, reaches us as an error report: the error, the tool's name, your browser's name and version, never your text. » |

### Totaux de la troisième passe

| | |
|---|---|
| Pages relues | 11 |
| Défaut restant | 1 : point 5 (T1), gravité B |
| Pages sans défaut | toutes les autres pages de la liste ; seules unicode-converter et html-entity-decoder portent T1 |

## Quatrième passe (2026-10-06)

J'ai relu la privacy de HTML Entity Decoder (`html-entity-decoder/page.jsx:54`) et je l'ai comparée à celle de Unicode
Converter (`unicode-converter/page.jsx:51`).

- **T1 est corrigé** : les deux phrases ne se ressemblent plus. Elles n'ont aucun n-gramme de 5 mots en commun hors du nom des
  données envoyées.
- **Un défaut reste**, introduit par la nouvelle formulation : la phrase ne nomme pas le message d'erreur, qui est pourtant envoyé.

| # | Page | Endroit | Phrase (citation courte) | Problème | Preuve | Correction proposée |
|---|---|---|---|---|---|---|
| Q1 | developer-tools/html-entity-decoder | privacy (dernière phrase) | « sends us an error report naming this tool and your browser with its version; the entities you pasted are not part of it » | **B — Incomplet (3)**. Le rapport contient aussi le message d'erreur, nettoyé (`errorMessage`), et le type d'erreur (`errorType`). La phrase n'en dit rien, alors que la règle « Rapports d'erreur » demande de nommer le message. De plus, « the entities you pasted » est plus étroit que la vérité : aucune partie du texte collé n'est envoyée. | `app/tools/ToolErrorWatch.jsx:27-34` (`reportToolError({ tool, error, errorType })`) ; `app/lib/reportError.js:138-147` (payload : `tool`, `errorType`, `errorMessage: sanitizeErrorMessage(…)`, `browser`) | « A crash of this page, a blocked clipboard included, sends us an error report with the cleaned error message, this tool's name and your browser with its version; nothing you pasted is part of it. » |

**Totaux de la quatrième passe** : 1 page relue, 1 défaut (point 3, gravité B). Les 12 autres pages restent sans défaut.

## Cinquième passe (2026-10-06)

J'ai relu la privacy de HTML Entity Decoder (`html-entity-decoder/page.jsx:54`). La phrase finale est désormais :
« A crash of this page, a blocked clipboard included, sends us an error report with the cleaned error message, this tool's
name and your browser with its version; nothing you pasted is part of it. »

Elle correspond au rapport réellement envoyé (`ToolErrorWatch.jsx:27-34` ; `reportError.js:138-147`). Elle ne ressemble
plus à la phrase de Unicode Converter. Q1 est donc corrigé.

**0 défaut.** Les 13 pages de la liste sont sans défaut.
