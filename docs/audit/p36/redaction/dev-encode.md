# P36 — rédaction du lot « dev-encode » (13 pages), 06/10

Fichiers modifiés (et seulement eux) : `page.jsx` (props de `<SeoContent>`) et `layout.tsx` (title, description,
openGraph) des 13 outils ; `app/tools/developer-tools/hash-generator/seo.js` (objet `SEO` : titre/méta répétés,
FAQ retirée car désormais écrite en ligne dans `page.jsx` — le contrôle C2 ne lit pas `faqs={SEO.faqs}` ; exemple et
liens inchangés) ; `docs/audit/p36/preuves/dev-encode.json` ; ce compte rendu.
Aucune chaîne d'interface modifiée (l'audit n'a trouvé aucune phrase FAUSSE dans l'interface de ces outils).
Aucune logique, constante ou libellé de bouton touché. Pour la page Hash Generator, le layout écrit maintenant le titre
et la méta en chaînes littérales (avant : `SEO.title`, que le contrôle C1 ne peut pas lire) ; `seo.js` les répète.

## Contrôles (06/10)
- `node scripts/p36/content-verify.mjs --only=developer-tools/` : 57 pages, 0 échec.
- `--only=text-tools/` : 17 pages, 0 échec.
- `--only=file-tools/` : 9 échecs, aucun sur `file-tools/base64-encoder` (C3/C2 d'autres lots).
- `--only=math-tools/` : 3 échecs, aucun sur `math-tools/number-base-converter` (C1/C3 d'autres lots).
- `node scripts/content-checks/instructions.mjs` : 225 pages, 0 mismatch.
- `node scripts/content-checks/privacy-claims.mjs` : 0 failure.
- C7 (phrases identiques) : maximum du site 14,3 % (paire d'un autre lot) ; les trois paires de jumeaux de ce lot n'ont
  aucune phrase identique (écrites séparément, publics distincts).

## Exemples : comment ils ont été produits
Script Node (bloc-notes de session, `examples.mjs`, lancé depuis la racine du dépôt le 06/10) :
- importé et exécuté tel quel : `app/lib/textCodecs.js` (base64Encode/Decode, textToHex/hexToText, htmlEncode/htmlDecode),
  `app/lib/exactNumbers.js` (parseBaseNumber/formatBaseNumber), `app/lib/jwtVerify.js` (verifyJwt),
  `app/lib/jsonText.js` (reformatJson), `hash-wasm` (MD5, SHA-1, SHA-256, CRC32 de « hello » : identiques à l'exemple
  existant de seo.js, conservé) ;
- code d'une page JSX (non importable en Node) recopié ligne pour ligne : `ENCODERS` de url-encoder (page.jsx:9-14),
  `toUnicode`/`fromUnicode` (unicode-converter/page.jsx:9,11-13), décodage JWT (jwt-decoder/page.jsx:30-50), découpage
  d'URL (url-parser/page.jsx:11-15, classe `URL` de Node = même norme WHATWG) ;
- reproduit (API de navigateur absente de Node) : `browserNamedEntity` (DOMParser) remplacé par `parse5`, même
  algorithme d'analyse HTML (HTML Entity Decoder) ; `FileReader.readAsDataURL` remplacé par
  `"data:" + type + ";base64," + base64(octets)` (File to Base64, fichier hello.txt, type text/plain donné par le
  navigateur pour .txt) ;
- jeton JWT construit en Node (HS256, secret my-secret, iat 2026-01-01T00:00Z, exp +1 h), puis décodé et vérifié par
  `verifyJwt` → `{"valid":true,"alg":"HS256"}` ; la phrase de verdict de l'exemple est celle de page.jsx:79.
- vérifications ponctuelles ajoutées : `new URL` refuse port 65536, espace dans l'hôte et « example.com/page », vide le
  port 443/80 ; `decodeURIComponent("%E9")` lève ; `parseBaseNumber("0x10", 2)` = null ; 0x0F → 1111 ; 0.1 → 0.0001100110011…

## Par outil

Longueurs : titre / méta en caractères. Mots : texte SEO visible avant (contenu-avant.json, seoWords) → après (estimé
depuis le source, hors exemple).

| Outil | Titre (car.) | Méta (car.) | Mots avant → après | Supprimé (renvoi audit dev-encode.md) |
|---|---|---|---|---|
| developer-tools/base64-encoder | Base64 Encode and Decode — UTF-8 Text, URL-Safe Option (54) | 133 | 396 → 569 | titre générique, « btoa()/atob() » (TROMPEUR), « every API… programming language » (INVÉRIFIABLE), FAQ gratuité/définition/confidentialité, astuce « copy right away » |
| file-tools/base64-encoder | File to Base64 — Data URL or Raw Base64 for Any File (52) | 136 | 331 → 495 | « instantly » ×3 (INVÉRIFIABLE), « Upload a file » (TROMPEUR), « Download .txt » (LIBELLÉ), FAQ gratuité/upload ; ajoutés : Raw Base64, type lu dans le contenu, aperçu `${PREVIEW_CHARS}` calculé, fichier vide refusé |
| developer-tools/url-encoder | URL Encoder — encodeURIComponent, encodeURI or RFC 3986 (55) | 146 | 330 → 528 | « not a whole URL… breaking it » et étape 1 (FAUX), « encodeURIComponent and decodeURIComponent » (TROMPEUR), astuces 1 et 4, FAQ définition/confidentialité, titre fautif |
| text-tools/url-encoder | URL Encoder & Decoder — Make Text Safe for Web Links (52) | 140 | 309 → 556 | About d'une phrase (MINCE), « slashes are replaced » et liste incomplète (TROMPEUR), « no signup and no limits », astuces 3-4 |
| developer-tools/html-encoder | HTML Encoder — Escape & < > and Quotes as Entities (50) | 143 | 299 → 451 | « exactly what's needed to safely… » (TROMPEUR, remplacé par une FAQ qui dit où l'échappement ne suffit pas), FAQ gratuité, étapes génériques |
| developer-tools/html-entity-decoder | HTML Entity Decoder — &amp;, &nbsp;, &#8364; to Characters (58) | 130 | 311 → 441 | FAQ gratuité/définition/confidentialité, étapes et astuce génériques |
| developer-tools/hex-to-text | Hex to Text Converter — UTF-8 Bytes in Both Directions (54) | 141 | 327 → 429 | titre tronqué, « hexadecimal character codes » (TROMPEUR), « like every hex editor and programming language » (INVÉRIFIABLE), FAQ gratuité, astuce « copy right away » |
| developer-tools/unicode-converter | Unicode Converter — Text to \uXXXX Escapes and Back (51) | 145 | 300 → 384 | « exactly one format », FAQ 1, astuce 2 (FAUX : \u{…} et U+ sont lus), « not … UTF-16 » (TROMPEUR), titre générique |
| developer-tools/hash-generator | Hash Generator — MD5, SHA-256, SHA-512 & CRC32 Checksums (56, inchangé) | 153 | 717 → 705 | « any size » / « No file size limit » (INVÉRIFIABLE → « the tool sets no cap »), « 5 GB in under a minute » et « larger than your device's memory » (INVÉRIFIABLE), « SHA-1 and the SHA-2 family use Web Crypto » (FAUX : SHA-224 et gros fichiers), « HMAC is not defined for… » (TROMPEUR), format checksums.txt (TROMPEUR), « click Hash » (LIBELLÉ), étape 5 (TROMPEUR), astuce 4 |
| developer-tools/jwt-decoder | JWT Decoder & Signature Verifier — HS, RS, PS, ES, EdDSA (56) | 141 | 396 → 615 | titre/méta sans la vérification (MINCE), astuces 1 et 3 (TROMPEUR), FAQ définition/confidentialité ; ajoutés : dates exp/iat/nbf, « Secret is », refus expliqués, JWE non pris en charge |
| developer-tools/url-parser | URL Parser — Split a URL into Host, Path and Query Params (57) | 136 | 287 → 435 | « path » (LIBELLÉ → pathname), astuces 1 et 3 (TROMPEUR), astuce 4, FAQ gratuité/définition ; ajoutés : valeurs décodées, clés répétées, normalisation, champs non affichés |
| developer-tools/number-base-converter | Hex, Binary & Octal Converter — Prefixes and BigInt Values (58) | 131 | 364 → 468 | « any size » (INVÉRIFIABLE → « no digit cap », BigInt), « instantly », « all four bases » (TROMPEUR : cinq résultats) |
| math-tools/number-base-converter | Number Base Converter — Bases 2 to 36 With Exact Fractions (58) | 145 | 343 → 540 | « Instantly Converts », « any size » (INVÉRIFIABLE), « all four results », astuce couleur CSS et « lists the digits » (TROMPEUR), FAQ gratuité |

Jumeaux : dev/math Number Base Converter — dev centré sur la notation de programmation (préfixes 0x/0b/0o, séparateurs _,
BigInt au-delà de 2^64, pas de complément à deux, hex() de Python) ; math centré sur les bases positionnelles pour
élèves (bases 2-36, fractions exactes et pourquoi 0.1 ne se termine pas en binaire, chiffres A-Z, base 3 → base 7).
URL Encoder dev (les trois fonctions JavaScript, paramètres de requête, double encodage) / texte (liens et texte
courant, décoder une adresse illisible, é = %C3%A9). HTML Encoder (échapper avant d'insérer dans une page, limites de
l'échappement) / HTML Entity Decoder (nettoyer un texte de flux ou d'export, double échappement, &nbsp;, codes 128-159).
Aucune différence inventée : chaque page décrit le même code, avec des exemples et questions différents.

Confidentialité : chaque bloc `privacy` dit que le texte ou le fichier n'est pas envoyé, et précise ce qui peut partir
réellement : le libellé d'une erreur affichée (pages qui en signalent : base64 texte, File to Base64, les deux URL
Encoder, Hex to Text, Hash Generator, JWT Decoder, URL Parser, les deux convertisseurs de bases pour l'échec de copie
seulement) ; aucun signalement pour HTML Encoder, HTML Entity Decoder, Unicode Converter (vérifié : ils n'importent ni
`reportShownMessage` ni `useToolError`). Pour JWT Decoder, URL Parser et Hash Generator (résultats affichés en texte de
page), le bloc dit que Google reçoit le texte de la page si une traduction est activée — comme `app/privacy/page.jsx:83`
et le menu de langue l'annoncent déjà.

## Points non vérifiables laissés de côté
- Mesure « 5 Gio en 52 s » (seulement dans le message du commit 44ae126c) : non citée.
- Hachage d'un fichier plus grand que la mémoire : non promis.
- Comportement de Google Traduction sur le contenu des zones de texte (textarea) : non affirmé ; mentionné seulement
  pour les pages dont les résultats sont du texte de page.
- Tablettes Android et seuil de 100 MiB du Hash Generator : la page dit « phones and tablets » comme le code
  (`isMobileDevice`), sans détailler les cas où Chromium déclare une tablette comme non mobile.

## Signalé, non modifié (hors périmètre)
- Commentaire inexact dans les deux URL Encoder (`page.jsx:19-21` dev, `21-23` texte) : « our Encode never outputs a raw
  "+" » est faux en mode « A whole URL » (encodeURI garde +). Les pages le disent maintenant (FAQ/astuce dev, spec « Kept
  by A whole URL ») ; le libellé d'option « A whole URL (keeps : / ? # & =) » reste incomplet (il garde aussi + ; , @ $),
  à corriger par le propriétaire s'il le souhaite (libellé = référence, non touché).

## Corrections après relecture (06/10)

Relecture : `docs/audit/p36/relecture/dev-encode.md`, 79 défauts. Je les ai tous vérifiés moi-même contre le code ;
aucun n'est contesté. Les 79 sont corrigés.

- **n° 1-2 (graves)** : Decode relit toujours la zone de saisie (`html-entity-decoder/page.jsx:14`). L'étape 3 et la
  FAQ 1 disent maintenant de recopier le résultat dans la zone de saisie avant de décoder à nouveau.
- **n° 3-5** : ☕ (U+2615) donne un seul `\uXXXX`, car `split('')` découpe par unité UTF-16 (`unicode-converter/page.jsx:9`).
  About, FAQ et méta parlent maintenant de « emoji above U+FFFF » et citent ☕ comme le cas à une seule séquence.
- **n° 6-8** : ☕ fait 3 octets (`e2 98 95`) et les lettres vietnamiennes aussi. Le texte dit « ☕ three bytes » et
  « most accented letters ».
- **n° 9-10** : encodeURIComponent laisse `! ~ * ' ( )` tels quels. L'About du jumeau dev nomme ces exceptions ; le
  jumeau texte précise « in the default mode ».
- **n° 11** : le choix Data URL / Raw Base64 est gardé d'un fichier à l'autre (`file-tools/base64-encoder/page.jsx:23`).
  L'étape 2 le dit.
- **n° 12, 18 + règle « Rapports d'erreur »** : chaque bloc privacy dit maintenant exactement ce qui part (le message
  nettoyé, le nom de l'outil, le nom et la version du navigateur, `app/lib/reportError.js:138-147`) et dans quel cas.
  - Hash Generator : seulement la boîte rouge (`page.jsx:73,286`) ; les erreurs par fichier (`:273`) ne sont pas signalées.
  - HTML Encoder, HTML Entity Decoder, Unicode Converter : seul un plantage de la page serait signalé (`app/tools/ToolErrorWatch.jsx`).
    Plus aucune page ne promet « aucun rapport ».
- **n° 13** : une JWK privée est réduite à sa partie publique (`jwtVerify.js:66`) ; seules les clés privées PEM sont
  refusées (`:74`). La ligne specs le dit.
- **n° 14-17** :
  - n° 14 : le bouton est décrit sans le citer à tort (« the button that starts with Hash and counts the files »,
    `page.jsx:265`).
  - n° 15 : « Copy all » copie les lignes, « Download » enregistre checksums.txt.
  - n° 16 : la limite téléphone est écrite « on phones, iPhone and iPad » (règle tablettes Android).
  - n° 17 : « which ticked algorithm matches ».
- **n° 19-20** :
  - n° 19 : l'astuce sur les mots de passe est remplacée par « untick the algorithms you do not need before hashing a
    large file ».
  - n° 20 : astuce .env réécrite (« can end », avec « Secret is » = text, `jwtVerify.js:115`).
- **n° 21-22** : les deux convertisseurs de bases disent que Google reçoit les résultats si une traduction est activée
  (`BaseConverter.jsx:66`).
- **n° 23-25** :
  - n° 23-24 : la 5e carte n'apparaît que pour une base autre que 2, 8, 10 et 16 (`BaseConverter.jsx:33`).
  - n° 25 : l'exemple FAQ cite maintenant 2^64 = `0x1_0000_0000_0000_0000` → 18446744073709551616 (vérifié en Node).
- **n° 26-27** : les différences inventées entre jumeaux sont supprimées.
  - n° 26 : « This page shows how the converter reads programming notation. »
  - n° 27 : l'astuce renvoyant à HTML Entity Decoder est retirée.
- **n° 28-44** :
  - Les dernières phrases génériques de l'About sont réécrites pour chaque outil.
  - Les quasi-doublons entre jumeaux sont réécrits : alerte de chiffres, ligne « Point » au lieu de « Fractions » (dev),
    privacy des deux pages HTML, phrases de File to Base64 proches d'Image to Base64.
  - Les dernières étapes « Copy/Download » sont propres à chaque page.
- **n° 45** : le bloc privacy d'Unicode Converter passe de 37 à 52 mots.
- **n° 46-79 (FAQ)** : appliqué selon la précision du 06/10.
  - Questions fermées : réponse en Yes / No / chiffre.
  - Questions How / What / Why / Which : réponse directe, jamais « Because… » ni « Usually… ».
  - Questions reformulées en oui/non : base64 n° 48 ; hex n° 58, 60 ; HTML n° 55, 57 ; unicode n° 61, 62 ; math n° 75-79.
  - Les autres gardent leur question ; seule l'ouverture de la réponse est réécrite.

### Chaînes d'interface modifiées (sous-titres sous le H1, notes, option)

| Page | Avant | Après |
|---|---|---|
| developer-tools/url-encoder | Encode and decode URLs | Percent-encode query values and full URLs for code |
| developer-tools/html-entity-decoder | Encode and decode HTML entities | Turn HTML entities back into readable characters |
| developer-tools/number-base-converter | Convert between binary, octal, decimal, hex and any base from 2 to 36 | Hex, binary, octal and decimal, with 0x, 0b and 0o prefixes |
| developer-tools/url-encoder + text-tools/url-encoder (option du sélecteur) | A whole URL (keeps : / ? # & =) | A whole URL (keeps : / ? # & = + ; , @ $) |
| developer-tools/hash-generator (sous-titre) | … — for text or files of any size | … — for text or files, which are read in pieces |
| developer-tools/hash-generator (note) | No file size limit — large files are read in pieces. | The tool sets no file size cap: large files are read in pieces. |
| developer-tools/hash-generator (zone de dépôt) | Any type, any size, several at once | Any type, no size cap set by the tool, several at once |

- **Option « A whole URL »** : le nouveau texte est exact. `encodeURI` garde aussi `+ ; , @ $` ; je ne liste pas
  `! ~ * ' ( )`, déjà gardés en mode « A value ».
- **Libellés de boutons** : aucun n'a été modifié.
- **Commentaires de code** : celui des deux URL Encoder (« our Encode never outputs a raw "+" ») reste inexact, mais il
  ne s'affiche pas. C'est un défaut de code, laissé pour le plan.

### Contrôles après corrections

- `node scripts/p36/content-verify.mjs` :
  - `--only=developer-tools/` : 0 échec.
  - `--only=text-tools/` : 0 échec.
  - `--only=file-tools/` : 0 échec.
  - `--only=math-tools/` : 0 échec.
  - Part maximale de phrases identiques sur le site : 9,5 %.
- `node scripts/content-checks/instructions.mjs` : 0 mismatch sur 225 pages.
- `node scripts/content-checks/privacy-claims.mjs` : 0 failure.
