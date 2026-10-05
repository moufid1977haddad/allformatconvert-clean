# P36 lot 2 — audit du lot « text » (16 outils, lecture seule)

Sources lues : `docs/audit/p36/contenu-avant.json` (texte servi), puis le code. Abréviations des références :
`<outil>/page.jsx` = `app/tools/text-tools/<outil>/page.jsx`, `<outil>/layout.tsx` = `app/tools/text-tools/<outil>/layout.tsx`,
`textTools.js` = `app/lib/textTools.js`, `textSegments.js` = `app/lib/textSegments.js`, `textCrypto.js` = `app/lib/textCrypto.js`,
`codeTools.js` = `app/lib/codeTools.js`, `FileDownload.jsx` = `app/components/FileDownload.jsx`, `TextArea.jsx` = `app/components/TextArea.jsx`.

Constats communs aux 16 outils (prouvés une fois ici, rappelés dans les lignes concernées) :
- Aucun appel réseau avec le texte : aucun `fetch`/`/api/` dans les 16 pages ni dans `textTools.js`, `textSegments.js`,
  `textCrypto.js`, `KeywordDensity.jsx` ; aucun des 16 noms d'outil n'apparaît dans `app/api`, `lib` (hors
  `lib/legacyRedirects.ts:107-111`, simples redirections) ni `services`. Pas de quota, pas d'inscription, pas de filigrane.
  Seul départ réseau : un message d'erreur AFFICHÉ (texte fixe, nettoyé) vers `/api/report-error`
  (`app/lib/useToolError.js:19-31`, `app/lib/reportError.js:16,133-171`, nettoyage `reportError.js:72-122`).
- Les promesses « caractères tels qu'on les voit » reposent sur `Intl.Segmenter` ; sans lui le code se replie sur les
  points de code (`textSegments.js:9-14`) ou une regex (`textSegments.js:26`, `:38`). Le plancher du site est
  « chrome 111, edge 111, firefox 111, safari 16.4 » (`node_modules/next/dist/docs/03-architecture/supported-browsers.md:19`,
  `app/lib/polyfills.js:5`) ; `Intl.Segmenter` n'existe dans Firefox que depuis la version 125 (fait externe, MDN) :
  Firefox 111-124 est dans le plancher et prend le repli. Aucun polyfill de `Intl.Segmenter` (grep : seuls
  `textSegments.js` et `app/lib/textPdf.js` le citent).
- Les titres `layout.tsx:5` suivent un gabarit « <Nom> — <verbe…> Online Free » souvent tronqué ou agrammatical ; classés
  GÉNÉRIQUE (phrase-gabarit, pas propre à l'outil).
- Les FAQ « Is X free to use? Yes, it's completely free with no signup… » et « Is my text uploaded / Is my data private?
  No — everything happens in your browser » sont vraies (voir 1ᵉʳ point) mais copiables telles quelles : GÉNÉRIQUE.

## ascii-art

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| ascii-art | titre | « Turn Short Typed Text Online Free » | GÉNÉRIQUE | `ascii-art/layout.tsx:5` : gabarit tronqué (il manque « into ASCII art ») | Titre propre : générateur FIGlet, 10 polices, texte → bannière |
| ascii-art | méta | « block-letter banners built from # and space characters » | FAUX | Seule la police Banner dessine avec `#`. Mesuré (figlet 1.12.0, `node_modules/figlet/importable-fonts/*.js`, rendu de « Ab ») : Standard/Big/Doom `_ / \ \| ' ) .`, Slant `_ / \| \ .`, Block `_ \|`, ANSI Shadow `█ ╗ ╔ ═ ║ ╝ ╚`, 3-D `* /` ; polices `ascii-art/page.jsx:9-20` | Dire « bannières FIGlet en 10 polices », sans « # » |
| ascii-art | about | « Letters, digits, punctuation and accented Latin letters are supported, in ten fonts » | TROMPEUR | Mesuré sur 94 ASCII imprimables + 38 lettres accentuées (é è ê ë à â ä ç ô ö ù û ü î ï ñ É È À Ç Ä Ö Ü ß á í ó ú ã õ å æ ø Å Æ Ø œ Œ) : Standard 38/38 ; Big, Slant, Small, Block, Shadow 36/38 (sans œ Œ) ; Banner et Doom 7/38 (seulement Ä Ö Ü ä ö ü ß) ; ANSI Shadow 0/38 et 9 signes ASCII absents (`" ' + = \` { \| } ~`) ; 3-D 0/38. Le code le signale (`ascii-art/page.jsx:32-33`) | Dire les lettres accentuées par police (Standard toutes ; Big/Slant/Small/Block/Shadow sauf œ ; Banner/Doom seulement allemandes ; ANSI Shadow et 3-D aucune) |
| ascii-art | about | « turns text into large ASCII-art letters » | TROMPEUR | ANSI Shadow dessine avec des caractères de dessin Unicode (█ ╗ …), pas de l'ASCII, et rend les minuscules en majuscules (mesuré : « a » et « A » identiques) | Dire qu'ANSI Shadow est en Unicode (bloc/traits), majuscules seulement |
| ascii-art | FAQ 2 | « All printable ASCII — letters, digits and punctuation » | FAUX | ANSI Shadow n'a pas `" ' + = \` { \| } ~` (mesuré, même méthode) | « Tout l'ASCII imprimable sauf 9 signes en ANSI Shadow » |
| ascii-art | FAQ 2 | « Anything a font lacks is listed under the result » | FAUX | La note s'affiche au-dessus du bouton « Generate » (`ascii-art/page.jsx:44`, bouton `:45`), le résultat est dessous (`:46-53`) ; texte exact : « Not in this font, left out: … » (`:33`) | « listed above the Generate button » |
| ascii-art | FAQ 1 | « Is ASCII Art Generator free to use? Yes, it's completely free with no signup required. » | GÉNÉRIQUE | Vrai (aucun quota, aucune inscription) | Remplacer par une question propre à l'outil |
| ascii-art | FAQ 4 | « Is my text uploaded to a server? No — everything happens in your browser. » | GÉNÉRIQUE | Vrai : polices importées depuis le site (`ascii-art/page.jsx:9-20`), aucun envoi du texte | Phrase propre (ex. polices chargées à la demande, texte jamais envoyé) |

## case-converter

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| case-converter | méta | « between UPPERCASE, lowercase, Title Case, Capitalized Case, Sentence case, and aLtErNaTe (toggle) case » | FORMAT | 12 casses : + iNVERSE, camelCase, PascalCase, snake_case, kebab-case, CONSTANT_CASE (`case-converter/page.jsx:44-49`) non dites | Citer les 12 (ou « 7 casses de texte + 5 casses de programmation ») |
| case-converter | about | même liste de 6 casses | FORMAT | idem `case-converter/page.jsx:44-49` ; about `:59` | Ajouter iNVERSE et les 5 casses de programmation (mots coupés aux espaces, ponctuation et changements de casse, ligne par ligne, `:21-23`) |
| case-converter | méta ; about | « aLtErNaTe (toggle) case » | TROMPEUR | « toggle case » désigne usuellement l'inversion (= bouton iNVERSE, `:29`) ; aLtErNaTe alterne minuscule/majuscule par position de caractère, espaces et ponctuation compris (`:17`) | Supprimer « (toggle) » ; dire « alternating » |
| case-converter | interface | « Convert text to any case format » | INVÉRIFIABLE | 12 boutons de casse (`:38-49`) | « Convert text to 12 cases » |
| case-converter | FAQ 1 | « Yes, it's completely free with no signup and no limit on conversions. » | GÉNÉRIQUE | Vrai (aucune limite dans le code) | Question propre à l'outil |
| case-converter | FAQ 4 | « Yes, everything happens locally in your browser — what you enter is never sent to a server. » | GÉNÉRIQUE | Vrai | Idem |
| case-converter | astuce 1 | « Use Title Case for headlines and headings to keep formatting consistent. » | GÉNÉRIQUE | — | Astuce propre (ex. petits mots gardés en minuscule `textSegments.js:107`, acronymes connus gardés `:70`) |

## character-counter

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| character-counter | titre | « Instantly Breaks Down Any Text Online » | GÉNÉRIQUE | `character-counter/layout.tsx:5` : gabarit agrammatical (sujet manquant) + « Instantly » | Titre propre |
| character-counter | méta | « instantly breaks down … live » | INVÉRIFIABLE | Recalcul à chaque saisie (`character-counter/page.jsx:9`) : « live » prouvé, « instantly » aucune mesure | Garder « live, as you type » |
| character-counter | méta | « and special characters » | LIBELLÉ | La case s'appelle « Other symbols » (`:22`) | « other symbols » |
| character-counter | about | « or a Hindi syllable is one character » | INVÉRIFIABLE | Dépend de la version Unicode du moteur `Intl.Segmenter` (`textSegments.js:12-14`) ; les conjointes devanagari ne forment un seul graphème que depuis les règles Unicode 15.1. Mesuré ici sous Node (ICU 78) seulement : « नमस्ते » = 3. Aucune mesure navigateur dans `docs/audit` (grep « hindi »/« devanagari ») | Retirer, ou mesurer sur Safari 16.4/Chrome/Firefox et le dire |
| character-counter | about | « UTF-8 bytes (what databases and SMS encodings count) » | FAUX | Fait externe : un SMS est codé en GSM 7 bits ou en UCS-2/UTF-16 (3GPP TS 23.038), jamais en UTF-8 ; le code calcule `TextEncoder` UTF-8 (`textTools.js:34`) | Retirer « SMS » |
| character-counter | about ; FAQ 2 | « an emoji (even a family or a flag) … is one character » / « 👍🏽 or 👨‍👩‍👧 count as 1 » | TROMPEUR | Sans `Intl.Segmenter` (Firefox 111-124, dans le plancher) : repli points de code (`textSegments.js:14`) → 👍🏽 = 2, 👨‍👩‍👧 = 5, e + accent combinant = 2 | Préciser « sur les navigateurs actuels (Firefox 125+, Chrome, Safari) » ou ajouter un repli |
| character-counter | interface | « Spaces » / « Without spaces » | TROMPEUR | « Spaces » compte tout graphème `\s` : tabulations et sauts de ligne inclus (`textTools.js:26`) ; « Without spaces » retire donc aussi les sauts de ligne (`:31`) | Dire « Spaces (incl. tabs and line breaks) » dans le texte de page |
| character-counter | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | Vrai | Question propre |
| character-counter | FAQ 5 | « No — everything happens in your browser. » | GÉNÉRIQUE | Vrai | Idem |

## duplicate-remover

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| duplicate-remover | about | « Options make the comparison … and remove empty lines » | TROMPEUR | L'option laisse croire que les lignes vides sont gardées sinon ; or, case décochée, chaque ligne vide après la première est supprimée comme doublon (clé `''`, `textTools.js:45-48`) : les paragraphes perdent leurs séparations | Dire que les lignes vides répétées sont aussi des doublons (seule la 1ʳᵉ reste) |
| duplicate-remover | astuce 2 | « The count of removed lines tells you at a glance how many duplicates there were. » | TROMPEUR | Avec « Remove empty lines », les lignes vides retirées s'ajoutent au même compteur (`textTools.js:47`) ; affichage « N line(s) removed » (`duplicate-remover/page.jsx:36`) | « … lines removed (duplicates, plus empty lines if ticked) » |
| duplicate-remover | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | Vrai | Question propre |
| duplicate-remover | FAQ 5 | « No — everything happens in your browser. » | GÉNÉRIQUE | Vrai | Idem |

## find-replace

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| find-replace | titre | « Find and Replace — Find and Replace Text Online Free » | GÉNÉRIQUE | `find-replace/layout.tsx:5` : répétition du nom, gabarit | Titre propre (texte brut ou regex, casse, mot entier) |
| find-replace | méta | « Find Replace is a free online tool. No sign-up, no watermarks, no limits. » | GÉNÉRIQUE | `find-replace/layout.tsx:6` : rien sur l'outil ; « watermarks » sans objet pour du texte | Méta propre |
| find-replace | interface | « Find and replace text instantly » | INVÉRIFIABLE | `find-replace/page.jsx:64` ; aucune mesure | Retirer « instantly » |
| find-replace | FAQ 3 | « Is matching case-sensitive? Yes, always — there's no case-insensitive option. » | FAUX | Case « Ignore case » (`:82`) → drapeau `i` (`:16`, `:32`) | « Case-sensitive by default; tick Ignore case » |
| find-replace | about ; étapes | (aucune mention de « Ignore case » ni de « Whole words only ») | MINCE | Deux options réelles (`:82-83`) ; « Whole words only » = pas à l'intérieur d'un mot, lettres/marques/chiffres de toutes écritures (`:30-35`) | Les décrire dans l'about et une étape |
| find-replace | about ; FAQ 1 | « opt into full regex matching » / « ^ $ taking on their regex meaning » | TROMPEUR | Syntaxe JavaScript, drapeaux `g` (+`i`) seulement (`:32-33`) : sans drapeau `m`, `^` et `$` ne visent que le début et la fin du texte entier, pas chaque ligne ; sans drapeau `u` (ajouté seulement avec « Whole words only », `:35`), `\p{L}` ou `\u{…}` ne sont pas compris | Dire « JavaScript regular expressions; ^ and $ match the start and end of the whole text » |
| find-replace | astuce 4 | « Keep a copy of your original text before replacing, since there's no undo button. » | FAUX | Le texte d'origine n'est jamais modifié : le résultat va dans un champ séparé « Result » (`:56`, `:92`) | Retirer ; dire que l'original reste dans la première zone |
| find-replace | FAQ 4 | « Yes, all text processing happens locally in your browser — nothing is uploaded to a server. » | GÉNÉRIQUE | Vrai pour le texte ; une erreur de regex affichée est signalée nettoyée (`:21`, `reportError.js:97` efface le motif `/…/`) | Phrase propre |

## lorem-ipsum

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| lorem-ipsum | méta | « Lorem Ipsum is a free online tool. No sign-up, no watermarks, no limits. » | GÉNÉRIQUE | `lorem-ipsum/layout.tsx:6` : rien sur l'outil | Méta propre (paragraphes/phrases/mots, nombre exact, déterministe) |
| lorem-ipsum | étape 2 | « Enter how many you need (1 to 100). » | TROMPEUR | `max="100"` borne seulement les flèches du champ (`lorem-ipsum/page.jsx:28`) ; `lorem()` accepte tout entier ≥ 1 (`textTools.js:115`) — la FAQ 3 dit elle-même 500 mots. Champ vide ou 0 : le message « Enter a whole number of 1 or more. » n'est pas affiché (seulement signalé, `:16`), la page montre « Result is empty » (`:48`) | « Enter how many you need (1 or more; the arrows go to 100) » ; signaler au propriétaire le message non affiché |
| lorem-ipsum | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | Vrai | Question propre |
| lorem-ipsum | FAQ 4 | « No — everything happens in your browser. » | GÉNÉRIQUE | Vrai | Idem |
| lorem-ipsum | astuce 1 | « Use sentences for short labels and paragraphs for body text. » | GÉNÉRIQUE | — | Astuce propre (ex. 8-16 mots par phrase `textTools.js:109`, 5 phrases par paragraphe `:118`) |

## sticky-notes

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| sticky-notes | titre | « Let You Jot Down Quick Colored Notes Online » | GÉNÉRIQUE | `sticky-notes/layout.tsx:5` : gabarit agrammatical | Titre propre |
| sticky-notes | FAQ 1 | « they persist across page refreshes and browser restarts on the same device and browser » | TROMPEUR | `localStorage` clé `sticky-notes` (`sticky-notes/page.jsx:7`, `:17`, `:26`) : en fenêtre privée le navigateur l'efface à la fermeture ; l'écriture n'est pas protégée (`:26`, pas de try) | Ajouter « except in a private window » |
| sticky-notes | astuce 1 | « Notes stay saved in this browser even after closing the tab or restarting your computer » | TROMPEUR | idem (`:26`) | idem |
| sticky-notes | FAQ 4 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | Vrai | Question propre (ex. modifier une note : impossible, supprimer sans confirmation `:35`, `:57`) |

## text-comparator

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| text-comparator | titre | « Compare Two Texts Line Online Free » | GÉNÉRIQUE | `text-comparator/layout.tsx:5` : tronqué (« Line by Line ») | Titre propre, distinct du jumeau Diff Viewer |
| text-comparator | about | « the Myers diff algorithm (the one git and diffchecker use) » | INVÉRIFIABLE | `diffArrays` de la bibliothèque `diff` (`codeTools.js:50`, `:54`) ; git utilise Myers par défaut (fait externe) ; aucune source dans le dépôt pour diffchecker | Retirer « and diffchecker » |
| text-comparator | about ; interface | « case and spaces can be ignored » / « Ignore spaces » | TROMPEUR | La clé de ligne enlève les espaces de début/fin et réduit chaque suite d'espaces à une seule (`codeTools.js:53`) : « a b » et « ab » restent différents | « ignore leading/trailing spaces and the number of spaces between words » |
| text-comparator | astuce 2 | « Trailing spaces count as a difference; remove them first with the Whitespace Remover if they don't matter. » | TROMPEUR | Cocher « Ignore spaces » (`text-comparator/page.jsx:53`) les ignore déjà (`codeTools.js:53`) | « … unless you tick Ignore spaces » |
| text-comparator | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | Vrai | Question propre |
| text-comparator | FAQ 4 | « No — everything happens in your browser. » | GÉNÉRIQUE | Vrai (la bibliothèque `diff` est chargée depuis le site, `page.jsx:19`) | Idem |

## text-encryptor

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| text-encryptor | méta | « obfuscates text with a password-based XOR cipher and Base64 encoding » | FAUX | Chiffrement AES-256-GCM, clé PBKDF2-SHA-256 600 000 itérations, sel 16 o + IV 12 o aléatoires, Base64 (`textCrypto.js:17`, `:30-44`) ; le XOR n'est plus qu'un déchiffrement de compatibilité (`:60-67`) | Méta = AES-256-GCM + PBKDF2, dans le navigateur |
| text-encryptor | about | « AES-256-GCM, the standard used by browsers, banks and messaging apps » | INVÉRIFIABLE | Aucune source dans le dépôt pour « banks and messaging apps » | Retirer l'incise |
| text-encryptor | about | « a wrong password or an altered text is refused, never turned into garbage » | TROMPEUR | Tout Base64 qui ne commence pas par « OCT1 » ou fait moins de 48 octets (texte AES coupé au début, Base64 quelconque) part dans le déchiffrement XOR de l'ancien format (`textCrypto.js:51`, `:60-64`), qui rend n'importe quel octet valide en UTF-8 : du charabia peut s'afficher, avec la note « Decrypted from the old XOR format… » (`text-encryptor/page.jsx:23`) | « … is refused for texts made since 29 September 2026; old-format texts cannot be checked » |
| text-encryptor | étape 2 | « Enter the password. » | LIBELLÉ | Le champ s'appelle « Secret Key » (`:34`), indication « Enter secret key... » (`:35`), sous-titre « Encrypt and decrypt text with a key » (`:30`) | « Enter the password in Secret Key » (ou renommer le champ) |
| text-encryptor | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | Vrai | Question propre |
| text-encryptor | FAQ 6 | « No — everything happens in your browser. » | GÉNÉRIQUE | Vrai (Web Crypto, `textCrypto.js:31-40`) | Idem |

## text-repeater

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| text-repeater | titre | « Duplicate Any Text a Set Number Online Free » | GÉNÉRIQUE | `text-repeater/layout.tsx:5` : tronqué (« … of Times ») | Titre propre |
| text-repeater | about | « Text Repeater duplicates any text a set number of times with your choice of separator, entirely in your browser. » | MINCE | Une phrase = la méta. Manque : 1 à 100 répétitions avec message « Enter a whole number of repetitions from 1 to 100. » (`text-repeater/page.jsx:21`), séparateurs réels saut de ligne / espace / virgule + espace / rien (`:18`), bouton « Download » repeated.txt (`:54`) | Étoffer avec ces faits |
| text-repeater | astuce 4 | « For a custom separator beyond the four presets, generate with "None" and then find-and-replace in your destination editor. » | TROMPEUR | Avec « None », les copies sont collées sans rien entre elles (`:18`) : il n'y a plus de frontière à remplacer | Générer avec « New Line » puis remplacer les sauts de ligne |
| text-repeater | astuce 3 | « Copy the output directly into spreadsheets or code editors for seamless integration. » | GÉNÉRIQUE | — | Retirer |
| text-repeater | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | Vrai | Question propre |
| text-repeater | FAQ 4 | « Yes, everything is processed locally in your browser — what you enter is never sent to a server. » | GÉNÉRIQUE | Vrai | Idem |

## text-reverser

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| text-reverser | about | « Text Reverser flips your text three ways — character order, word order, or line order — entirely in your browser. » | MINCE | Une phrase = la méta. Manque : « Reverse Words » ligne par ligne en gardant les espacements (`textSegments.js:148-155`), ponctuation collée à son mot, graphèmes entiers (`:146`) | Étoffer |
| text-reverser | FAQ 2 | « Yes, all characters are reversed exactly as they appear, whichever of the three modes you choose. » | FAUX | « Reverse Words » et « Reverse Lines » n'inversent pas les caractères (`textSegments.js:148-157`) ; la ponctuation reste attachée au mot (« Hello, world! » → « world! Hello, ») | Décrire chaque mode |
| text-reverser | FAQ 4 | « emoji with skin tones, family emoji, flags and accented letters stay whole » | TROMPEUR | Sans `Intl.Segmenter` (Firefox 111-124) : repli points de code (`textSegments.js:14`) → un emoji famille ou un accent combinant est découpé | Préciser les navigateurs |
| text-reverser | astuce 1 | « Use "Reverse Text" to check whether a word or phrase is a palindrome. » | TROMPEUR | Aucune normalisation de casse, d'espaces ni de ponctuation (`textSegments.js:146`) : « A man » → « nam A » ; une phrase-palindrome ne ressort pas identique | « … a word (case and spaces count) » |
| text-reverser | astuce 4 | « Copy large blocks of text in to reverse whole paragraphs at once instead of doing it manually. » | GÉNÉRIQUE | — | Retirer |
| text-reverser | FAQ 1 | « Yes, it's completely free with no signup and no limits. » | GÉNÉRIQUE | Vrai (aucune limite) | Question propre |
| text-reverser | FAQ 3 | « Yes, your text is processed locally and never sent to a server. » | GÉNÉRIQUE | Vrai | Idem |

## text-sorter

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| text-sorter | titre | « Organize Lines of Text Alphabetically (a-z » | GÉNÉRIQUE | `text-sorter/layout.tsx:5` : parenthèse non fermée, gabarit tronqué | Titre propre |
| text-sorter | étape 2 | « Click A-Z, Z-A, By Length or Shuffle. » | LIBELLÉ | Boutons « Sort A-Z », « Sort Z-A », « Sort by Length », « Shuffle » (`text-sorter/page.jsx:37-40`) ; « Sort by Number (0-9) » et « Sort by Number (9-0) » (`:41-42`) absents de l'étape, de la méta, de l'about et du sous-titre (`:33`) | Libellés exacts + les deux tris numériques |
| text-sorter | FAQ 4 | « an unbiased Fisher-Yates shuffle » | FAUX | `j = rnd[i] % (i + 1)` sur des valeurs 32 bits (`:20-23`) : biais de modulo, au plus n/2³² (< 1 sur un million sous 4 295 lignes) | « Fisher-Yates driven by the browser's cryptographic generator » (sans « unbiased »), ou corriger le code |
| text-sorter | about | « accented letters sit next to their base letter (éclair before zebra) » | TROMPEUR | `Intl.Collator(undefined, …)` = langue du navigateur (`textTools.js:57-58`). Mesuré (Node) : en suédois « ål », « öl », « ærø » passent après « zebra », idem en danois ; « éclair » reste avant « zebra » partout | « … in your browser's language order (Swedish or Danish put å, ä, ö, æ, ø after z) » |
| text-sorter | about | « length counts characters as you see them » | TROMPEUR | Sans `Intl.Segmenter` (Firefox 111-124), repli points de code (`textSegments.js:14`) ; tri par longueur `textTools.js:65` | Préciser les navigateurs |
| text-sorter | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | Vrai | Question propre |
| text-sorter | FAQ 5 | « No — everything happens in your browser. » | GÉNÉRIQUE | Vrai | Idem |

## text-to-list

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| text-to-list | titre | « Turn Lines of Pasted Text Online Free » | GÉNÉRIQUE | `text-to-list/layout.tsx:5` : gabarit tronqué | Titre propre |
| text-to-list | about | « Text to List turns lines of pasted text into a bullet list, numbered list, or comma-separated list, entirely in your browser. » | MINCE | Une phrase = la méta. Manque : puce « • », « 1. », séparateur « , » (`text-to-list/page.jsx:13-15`), lignes vides sautées, espaces de bord retirés en puces/numéros mais gardés en « Comma List » (`:15`), téléchargement list.txt (`:31`) | Étoffer |
| text-to-list | FAQ 3 | « Not currently — the only output option is copying the formatted text to your clipboard. » | FAUX | Bouton « Download » list.txt (`:31`, `FileDownload.jsx:208-212`), plus « Save / Share » quand le navigateur sait partager un fichier (`FileDownload.jsx:151-152`, `:213-218`) | « Copy, or download as a .txt file » |
| text-to-list | astuce 4 | « Paste the copied output directly into a word processor, which will typically auto-format bullet and numbered lists further. » | INVÉRIFIABLE | Comportement d'un logiciel tiers, aucune preuve | Retirer |
| text-to-list | FAQ 1 | « Yes, it's completely free with no signup and no limits. » | GÉNÉRIQUE | Vrai | Question propre |
| text-to-list | FAQ 4 | « Yes, everything happens locally in your browser — what you enter is never sent to a server. » | GÉNÉRIQUE | Vrai | Idem |

## text-truncator

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| text-truncator | méta | « Text Truncator is a free online tool. No sign-up, no watermarks, no limits. » | GÉNÉRIQUE | `text-truncator/layout.tsx:6` : rien sur l'outil | Méta propre |
| text-truncator | about ; FAQ 3 | « an emoji or an accented letter is never cut in half » / « multi-part emoji and combining accents stay whole » | TROMPEUR | Sans `Intl.Segmenter` (Firefox 111-124) repli points de code (`textSegments.js:14`) : un accent combinant ou un emoji ZWJ peut être coupé ; la coupe en caractères est `textTools.js:84-85` | Préciser les navigateurs |
| text-truncator | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | Vrai | Question propre |
| text-truncator | FAQ 4 | « No — everything happens in your browser. » | GÉNÉRIQUE | Vrai | Idem |

## whitespace-remover

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| whitespace-remover | FAQ 3 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | Vrai | Question propre |
| whitespace-remover | FAQ 6 | « Yes, all processing happens locally in your browser — what you enter is never sent to a server. » | GÉNÉRIQUE | Vrai | Idem |

## word-counter

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| word-counter | titre | « Instantly Analyzes Text Online Free » | GÉNÉRIQUE | `word-counter/layout.tsx:5` : gabarit agrammatical | Titre propre |
| word-counter | méta ; about | « instantly analyzes text » | INVÉRIFIABLE | Recalcul à chaque saisie (`word-counter/page.jsx:12-19`) : « live » prouvé, « instantly » non mesuré | « live, as you type » |
| word-counter | méta ; about | « paragraph count » | TROMPEUR | Chaque ligne non vide compte comme un paragraphe (découpe `/\n+/`, `:17`) : un poème ou une liste de 10 lignes = 10 paragraphes | Dire « lines separated by a line break count as paragraphs » |
| word-counter | FAQ 4 | « Chinese, Japanese and Thai … are split into real words … numbers like "3.50" do not end a sentence » (et l'emoji compté 1) | TROMPEUR | Seulement avec `Intl.Segmenter` ; repli (Firefox 111-124) : regex qui compte une suite CJK/thaï comme un seul mot (`textSegments.js:26`), coupe de phrase à « 3. » (`:38`), points de code pour les caractères (`:14`) | Préciser les navigateurs |
| word-counter | astuce 2 | « Check "Characters" against social media limits, since some platforms count characters rather than words. » | TROMPEUR | « Characters » = graphèmes, espaces et sauts de ligne compris (`:13-14`) ; fait externe : X compte 2 pour un emoji ou un idéogramme et 23 pour une URL | Retirer, ou renvoyer vers une règle de plateforme précise |
| word-counter | astuce 4 | « Watch the "Sentences" count while editing to catch run-on sentences » | INVÉRIFIABLE | Le compteur donne un nombre de phrases (`:16`), il ne repère aucune phrase trop longue | Retirer |
| word-counter | astuce 3 | « Paste from Google Docs, Word, or any editor to instantly see stats for an existing document. » | GÉNÉRIQUE | — | Retirer |
| word-counter | FAQ 1 | « Yes, it's completely free with no signup and unlimited use. » | GÉNÉRIQUE | Vrai (aucune limite) | Question propre |
| word-counter | FAQ 2 | « Is my data saved? No, everything is processed locally in your browser — your text is never sent to a server. » | GÉNÉRIQUE | Vrai ; rien n'est enregistré (aucun stockage dans `word-counter/page.jsx`, `KeywordDensity.jsx`) | Idem |
| word-counter | FAQ 3 | « Can I use it for academic essays? Yes, it's well suited for checking word count requirements for assignments and applications. » | GÉNÉRIQUE | — | Remplacer par une vraie question (ex. ce qui compte comme mot) |

## Synthèse du lot « text »

16 outils lus, **99 défauts** :
FAUX 10 · INVÉRIFIABLE 9 · TROMPEUR 23 · GÉNÉRIQUE 48 · MINCE 4 · LIBELLÉ 3 · FORMAT 2.
(Whitespace Remover n'a que 2 défauts, tous deux GÉNÉRIQUE : ses autres affirmations sont justes, `textTools.js:135-159`.)

Les plus graves : méta de Text Encryptor qui annonce un XOR (le code fait de l'AES-256-GCM) ; FAQ de Find and Replace
« no case-insensitive option » alors que la case « Ignore case » existe ; FAQ de Text to List « only output option is
copying » alors qu'un bouton « Download » existe ; méta d'ASCII Art « # and space characters » (une police sur 10).
Valeurs NON TROUVÉ : aucune (pas de limite de taille ni de quota dans ces outils : vérifié, voir `faits/text.json`).
