# P36 — relecture indépendante, lot « text » (16 pages)

Réviseur : agent « text » (n'a écrit aucune de ces pages). Date : 2026-10-05. Lecture seule ; seul fichier créé : celui-ci.

Méthode : pour chaque page, lecture de `page.jsx` (props de `<SeoContent>`), `layout.tsx` (metadata) et du code réellement
exécuté : `app/lib/textTools.js`, `app/lib/textSegments.js`, `app/lib/textCrypto.js`, `app/lib/codeTools.js` (diffLines),
`app/components/{FileDownload,TextArea,KeywordDensity,SeoContent}.jsx/tsx`, `app/lib/{useToolError,reportError,download}.js`,
`app/tools/ToolErrorWatch.jsx`, `node_modules/figlet` 1.12.0 et `node_modules/diff` 9.0.0. Les 16 exemples ont été
réexécutés en Node 24 (copies des bibliothèques dans le scratchpad, mêmes fonctions) : **les 16 sorties montrées sont
exactes** (ASCII Art « Hi! » identique octet pour octet ; Text Encryptor : le Base64 montré se déchiffre bien en
« Meet at 6 » avec blue-harbor-42 ; Word Counter 15/73/58/3/2/1/1 ; Character Counter 12/6/1/3/2/9/2/15/20, etc.).
Structure mesurée (AST) : titres 50-58 car., méta 127-153 car., About 83-93 mots, 3-4 étapes, 3-5 FAQ, toutes les réponses
commencent par Yes / No / un nombre ; `scripts/p36/content-verify.mjs --only=text-tools/` : 0 échec. Doublons : comparaison
phrase à phrase (Jaccard ≥ 0,7 après normalisation des noms de fichier) contre les 225 pages du site.

## Relevé des défauts

| Page | Endroit | Phrase (citation courte) | Problème | Preuve (fichier:ligne ou calcul) | Correction proposée |
|---|---|---|---|---|---|
| ascii-art | specs « Accented letters » | « Big, Slant, Small, Block, Shadow: all but œ and Œ » | (1) Incomplet : ces cinq polices n'ont pas non plus **Ÿ** (lettre française), ni d'autres lettres hors de la liste de 38 non publiée. | Node, figlet 1.12.0, polices importables : `Big missing accented: œŒŸ` (idem Slant, Small, Block, Shadow) | « …all but œ, Œ and Ÿ » (et ne pas dire « all » sans publier la liste testée) |
| ascii-art | FAQ 1 | « Big, Slant, Small, Block and Shadow miss only œ and Œ » | (1) Faux tel quel : il manque aussi Ÿ. | même mesure | « …miss œ, Œ and Ÿ » |
| ascii-art | privacy | « only the message "Copy to the clipboard failed." reaches our error log » | (3) « only » : le rapport contient aussi le nom de l'outil, le type d'erreur et le navigateur avec sa version ; et une exception non rattrapée de la page serait aussi rapportée (ToolErrorWatch). | `app/lib/reportError.js:140-155` (payload tool, errorType, browser) ; `app/tools/ToolErrorWatch.jsx:18-37` | « …our error log receives that message, with the browser name and version, never your text. » |
| case-converter | FAQ 1 | « Title Case keeps short words … in lower case … in the Chicago style » | (1) Surestimé : Chicago met en minuscule toutes les prépositions quelle que soit leur longueur ; l'outil n'a qu'une liste fixe de 27 mots courts. | `app/lib/textSegments.js:119` (MINOR) ; Node : `titleCase('a walk through the woods between two hills after dark')` → « A Walk Through the Woods Between Two Hills After Dark » (Chicago : through, between, after en minuscule) | Retirer « in the Chicago style » ou dire « a fixed list of short words, close to Chicago style » |
| case-converter | About | « The conversion runs in your browser. » | (5) Phrase identique sur color-converter, hex-to-text, json-to-csv et ≥ 7 autres pages. | comparaison site entier (Jaccard 1,00) | Phrase propre à l'outil (ex. « …computed with your browser's Unicode letter rules ») |
| case-converter | howTo 1 | « Type or paste your text into the box. » | (5) Identique à character-counter et word-counter. | Jaccard 1,00 | Nommer ce que la boîte attend ici (ex. « Paste the text typed with caps lock on… ») |
| character-counter | howTo 1 | « Type or paste your text into the box. » | (5) Identique à case-converter et word-counter. | Jaccard 1,00 | Formulation propre (ex. « Paste the text whose length you must check… ») |
| duplicate-remover | privacy | « the page shows Copy failed and our error log receives that bare message » | (3) Le message envoyé n'est pas celui affiché (« Copy to the clipboard failed. » et non « Copy failed »), et il n'est pas « bare » : outil + navigateur/version l'accompagnent. | `duplicate-remover/page.jsx:46-47` ; `reportError.js:140-155` | « …the page shows Copy failed and our error log receives the message "Copy to the clipboard failed." with the browser name, with no line of your list. » |
| duplicate-remover | howTo 4 | « Click "Copy", or "Download" to save the result as deduplicated.txt. » | (5) Identique (au nom de fichier près) à hex-to-text, url-encoder, text-reverser, text-sorter, text-truncator, whitespace-remover. | Jaccard 1,00 | Varier : dire ce qu'on récupère (« the cleaned list ») |
| duplicate-remover | howTo 2 | « Tick "…", "…" or "…" if you need them. » | (5) Même gabarit mot pour mot que developer-tools/env-to-json. | Jaccard 1,00 | Dire quand cocher chaque option |
| duplicate-remover | specs « Output » | « Kept lines joined with Unix line breaks; Copy, or Download as deduplicated.txt » | (5) Quasi identique à text-sorter (« Lines joined with Unix line breaks; Copy, or Download as sorted.txt ») ; l'étape 1 est aussi proche de celle de text-sorter (0,70). | Jaccard 0,91 | Reformuler l'une des deux |
| find-replace | privacy | « neither the text nor your search terms are uploaded … reported … with any quoted pattern removed » | (3) Faux : un motif regex invalide n'est pas « entre guillemets » mais entre barres obliques ; il est effacé seulement s'il ne contient ni < > " '. Un motif comme `(?<=price` ou `salary: "(\d+` part en clair dans le journal d'erreurs. | `find-replace/page.jsx:22,51-52` (useToolError → reportShownMessage) ; Node : `sanitizeErrorMessage` → « Invalid regular expression: /(?<=price/g: Unterminated group » et « …/salary: "(d+/g… » | Corriger le code (ne pas rapporter le motif) ou écrire : « …an invalid pattern's error is reported to our error log, and part of the pattern can appear in it. » |
| find-replace | specs « Regex flags » (+ FAQ 4) | « u with Whole words only » ; FAQ 4 « of any script » | (1) Pas toujours : en mode regex + Whole words, un motif que le drapeau u refuse (ex. `a\-b`, `\_id`) est relancé SANS u, avec une frontière limitée à une liste de plages (scripts courants), pas « any script ». | `find-replace/page.jsx:31-40` ; Node : `new RegExp('a\\-b','u')` → Invalid escape | « u with Whole words only (a pattern that u refuses runs without it, with letters of the common scripts as word characters) » |
| lorem-ipsum | specs « Start » | « Always Lorem ipsum dolor sit amet » | (1) Faux en mode Words sous 5 mots : 1 → « Lorem. », 3 → « Lorem ipsum dolor. », 4 → « Lorem ipsum dolor sit. ». | `app/lib/textTools.js` lorem() / words() ; Node | « Always starts with Lorem ipsum dolor sit amet (Words: as many of those words as asked) » |
| lorem-ipsum | méta (layout.tsx) | « always starting with Lorem ipsum dolor sit amet » | (1) Même défaut. | idem | « …starting with Lorem ipsum… » |
| lorem-ipsum | FAQ 1 | « opening with Lorem ipsum dolor sit amet » | (1) Même défaut. | idem | « opening with Lorem ipsum » |
| lorem-ipsum | specs « Output » | « Plain text; Copy, or Download as lorem-ipsum.txt » | (5) Identique à text-to-list (« Plain text; Copy, or Download as list.txt ») et quasi identique à 4 autres pages du lot. | Jaccard 1,00 / 0,83 | Ligne propre (ex. « Plain text, paragraphs separated by a blank line; … ») |
| sticky-notes | About | « come back when you reopen the page in the same browser » | (1) Pas vrai dans Safari (Mac, iPhone, iPad) : WebKit efface le stockage local d'un site non visité pendant 7 jours d'utilisation du navigateur (ITP). Aucune page ne le dit. | `sticky-notes/page.jsx:18,28` (localStorage seul) ; règle WebKit ITP « 7-day cap on script-writable storage » | Ajouter : « In Safari, notes of a site not opened for 7 days of browsing are deleted by the browser. » |
| sticky-notes | privacy | « Clearing the data of this site, or closing a private window, deletes them for good. » | (1) Liste incomplète des causes de perte : l'effacement automatique de Safari après 7 jours manque. | idem | Ajouter le cas Safari |
| text-comparator | howTo 2 | « Tick "Ignore case" or "Ignore spaces" if those differences do not matter. » | (5) Quasi identique à la page jumelle developer-tools/diff-viewer. L'étape 1 l'est aussi (0,75). | Jaccard 0,80 / 0,75 | Reformuler (ex. « …if one version was retyped with other capitals or spacing ») |
| text-comparator | howTo 1 | « Paste the first version in "Text 1" and the second in "Text 2". » | (5) Quasi identique à diff-viewer (« Paste the first version in "Original"… »). | Jaccard 0,75 | idem |
| text-comparator | example | sortie avec « ≠ » en tête de ligne | (7) Le marqueur « ≠ » n'existe pas sur la page et la légende n'explique que les crochets. Le contenu (lignes, mots marqués, « 2 difference(s) found ») est exact. | `text-comparator/page.jsx:59-62` ; Node : mêmes 5 lignes, 2 différences | Légende : « ≠ marks a red-tinted row » |
| text-encryptor | specs « Output » | « Base64 text that begins with the marker OCT1 » | (1) Faux : le marqueur est dans les octets décodés ; le texte Base64 commence par « T0NU » (exemple de la page compris). | `app/lib/textCrypto.js:15,17,44-46` ; Node : sortie `T0NUMflR…` | « Base64 of: the marker OCT1, salt, IV, ciphertext and tag (the text starts with T0NU) » |
| text-encryptor | privacy | « Encryption and decryption run in the Web Crypto API built into your browser. » | (5) Quasi identique à file-tools/file-encryptor (« Encryption and decryption run in your browser through the Web Crypto API. »). | Jaccard 0,79 | Reformuler |
| text-encryptor | specs « Algorithm » | « AES-256-GCM (Web Crypto API); key from PBKDF2-SHA-256 with 600,000 iterations » | (5) Quasi identique à file-encryptor. | Jaccard 0,79 | Acceptable si assumé ; sinon reformuler |
| text-encryptor | howTo 2 | « Type the password in "Secret Key". » | (5) Identique au libellé près à file-encryptor et pdf-protect. | Jaccard 1,00 | Ex. « Type a long passphrase in "Secret Key"; the field hides it. » |
| text-repeater | FAQ 3 | « end your own text with a comma and pick None » | (1) Le résultat n'est pas « a,a,a » mais « a,a,a, » : une virgule finale reste. | `text-repeater/page.jsx:22-23` (join('')) | Ajouter « then delete the last comma » |
| text-repeater | About | « It runs in your browser. » | (5) Identique à yaml-to-json, scientific-calculator, text-truncator. | Jaccard 1,00 | Phrase propre |
| text-repeater | specs « Output » | « Text; Copy, or Download as repeated.txt » | (5) Identique (nom de fichier près) à text-reverser, text-truncator, whitespace-remover. | Jaccard 1,00 | Ligne propre |
| text-reverser | howTo 3 | « Click "Copy", or "Download" to save the result as reversed.txt. » | (5) Gabarit identique (voir duplicate-remover). | Jaccard 1,00 | Varier |
| text-reverser | specs « Output » | « Text; Copy, or Download as reversed.txt » | (5) Identique à text-repeater, text-truncator, whitespace-remover. | Jaccard 1,00 | Ligne propre |
| text-sorter | privacy | « our error log receives only that error message, never the lines themselves » | (3) « only » : outil + navigateur/version sont envoyés aussi. | `reportError.js:140-155` | « …receives that message and the browser name, never the lines » |
| text-sorter | howTo 3 | « Click "Copy", or "Download" to save the result as sorted.txt. » | (5) Gabarit identique. | Jaccard 1,00 | Varier |
| text-sorter | specs « Output » | « Lines joined with Unix line breaks; Copy, or Download as sorted.txt » | (5) Quasi identique à duplicate-remover. | Jaccard 0,91 | Reformuler |
| text-to-list | FAQ 1 | « on phones that can share files "Save / Share" appears too » | (1) Faux pour Android : le bouton n'apparaît que sur iPhone / iPad (test `isIosDevice`). | `app/components/FileDownload.jsx:92-97` ; `app/lib/download.js:15-19` | « …and on an iPhone or iPad "Save / Share" appears too » |
| text-to-list | FAQ 2 | « Remove the old markers first with Find and Replace » | (1) Infaisable pour une liste numérotée : Find and Replace n'a pas le drapeau m (^ = début du texte seulement) et ne peut pas insérer de saut de ligne (la page Find and Replace le dit elle-même) ; ne marche que pour un tiret identique sur chaque ligne. | `find-replace/page.jsx:30` (flags g/i/u) ; FAQ 3 de find-replace | « …remove a dash marker with Find and Replace ("- " → nothing); numbers must be removed in your editor » |
| text-to-list | tips | « …into the To field of most mail apps » | (4) « most mail apps » invérifiable (aucune mesure datée). | — | « …into the To field of Gmail or Outlook, which accept comma-separated addresses » (si vérifié) ou supprimer « most » |
| text-to-list | specs « Output » | « Plain text; Copy, or Download as list.txt » | (5) Identique à lorem-ipsum. | Jaccard 1,00 | Ligne propre |
| text-truncator | privacy | « that message alone, without your text, is recorded in our error log » | (3) « alone » : outil + navigateur/version aussi. | `text-truncator/page.jsx:14,18` ; `reportError.js:140-155` | « …that message, with the browser name, without your text… » |
| text-truncator | About | « It runs in your browser. » | (5) Identique à text-repeater, yaml-to-json, scientific-calculator. | Jaccard 1,00 | Phrase propre |
| text-truncator | howTo 4 | « Click "Copy", or "Download" to save the result as truncated.txt. » | (5) Gabarit identique. | Jaccard 1,00 | Varier |
| text-truncator | specs « Output » | « Text; Copy, or Download as truncated.txt » | (5) Identique à 3 pages du lot. | Jaccard 1,00 | Ligne propre |
| whitespace-remover | FAQ 3 | « Each button keeps one space between words. » | (1) Inexact : Remove Leading et Remove Trailing laissent les espaces intérieurs tels quels (2, 3… espaces restent). | `app/lib/textTools.js` removeLeadingWhitespace / removeTrailingWhitespace (trimStart/trimEnd par ligne) | « No. Every button keeps at least one space between words… » |
| whitespace-remover | privacy | « the page shows Copy failed and sends that short message » | (3) Le message envoyé est « Copy to the clipboard failed. », pas « Copy failed », avec outil + navigateur. | `whitespace-remover/page.jsx:35-36` | « …sends the message "Copy to the clipboard failed." and the browser name, without any of your text » |
| whitespace-remover | About | « Everything runs in your browser. » | (5) Identique à json-formatter et image-compressor. | Jaccard 1,00 | Phrase propre |
| whitespace-remover | howTo 4 | « Click "Copy", or "Download" to save the result as cleaned.txt. » | (5) Gabarit identique. | Jaccard 1,00 | Varier |
| whitespace-remover | specs « Output » | « Text; Copy, or Download as cleaned.txt » | (5) Identique à 3 pages du lot. | Jaccard 1,00 | Ligne propre |
| word-counter | howTo 1 | « Type or paste your text into the box. » | (5) Identique à case-converter et character-counter. | Jaccard 1,00 | Formulation propre |

## Vérifié sans défaut (extraits significatifs)
- Tous les libellés cités existent sous ce nom exact (boutons, options, listes déroulantes, noms de fichiers téléchargés,
  « Download » = `FileDownload.jsx` lien « Download ») : point 2 = 0 défaut.
- Chiffres : 60 caractères (`maxLength={60}`), 10 polices, ANSI Shadow sans 9 signes (" ' + = ` { | } ~), largeur
  HELLO WORLD (Small 56 la plus étroite, Block 111 et 3-D 109 les plus larges), 12 casses, myHTTPServer → my_http_server,
  don't stop → dont_stop, café_crème, Sentence case (friday, i'm → I'm, « hello world. this » reste en minuscule),
  600 000 itérations / sel 16 o / IV 12 o, 1-100 répétitions, 8-16 mots par phrase, 5 phrases par paragraphe,
  -10, -2, 1.25, 1.3, 1.5 ; suédois/danois å ä ö après z ; 200 et 130 mots/min ; 15 lignes ; 56 mots courants ;
  well-known = 2 mots ; Firefox 125 = Intl.Segmenter ; 👨‍👩‍👧 = 5 points de code ; maxlength en unités UTF-16 ;
  hyph- enated ; U+200B non retiré ; café non trouvé dans cafés.
- Lieu de traitement : aucune des 16 pages n'envoie le texte (pas de fetch, pas de route API) ; seuls les messages
  d'erreur partent vers le journal — défauts relevés ci-dessus là où la page décrit mal ce qui part.

## Totaux
- Pages relues : **16**.
- Défauts : **48** — (1) Exactitude : 14 · (2) Libellés : 0 · (3) Lieu de traitement : 6 · (4) Invérifiable : 1 ·
  (5) Générique / dupliqué : 26 · (6) Structure : 0 · (7) Exemple : 1.
- Les plus graves : find-replace (motif regex invalide envoyé en clair au journal d'erreurs alors que la page dit le
  contraire) ; lorem-ipsum « always starting with Lorem ipsum dolor sit amet » faux (méta + specs + FAQ) ; text-encryptor
  « Base64 … begins with the marker OCT1 » faux ; sticky-notes muet sur l'effacement Safari après 7 jours ; text-to-list
  (« Save / Share » sur tous les téléphones, conseil Find and Replace infaisable).
- Pages **sans aucun défaut** : **aucune**. Pages dont le seul défaut est une phrase de gabarit dupliquée (point 5) :
  character-counter, word-counter, text-reverser.

## Deuxième passe (06/10)

J'ai relu les 16 pages en entier : props de `SeoContent` et `metadata` après correction. J'ai appliqué la même liste de contrôle, plus les précisions du 06/10 de `CONSIGNES-REDACTION.md` : règle d'ouverture des FAQ, tablettes Android, formulation des rapports d'erreur et phrases génériques bannies.

**Vérification des 48 corrections**
- Aucun rejet.
- Le code de l'outil n'a pas changé : `git diff` ne montre que du texte.
- 46 corrections sont exactes face au code. Points revérifiés :
  - Ÿ et œ sont présents dans Standard et absents des 5 polices nommées (figlet sous Node).
  - « T0NU » : les octets OCT encodés en Base64 donnent toujours ces 4 caractères.
  - Le repli sans `u` est décrit dans les specs et la FAQ 4 (`find-replace/page.jsx:31-40`).
  - iPhone / iPad seulement pour « Save / Share » (`download.js:15-19`).
  - Message réel « Copy to the clipboard failed. » ; virgule finale (text-repeater) ; « at least one space » (whitespace-remover) ; sept jours dans Safari (sticky-notes).
- Les corrections n° 15 et 16 (lorem-ipsum, méta et FAQ 1) restent fausses pour Amount = 1 en mode Words : voir le tableau. La formulation que je proposais au premier passage était elle-même inexacte.

**Contrôles relancés**
- Les 16 exemples sont inchangés et toujours exacts ; seule la légende de text-comparator a changé.
- Structure : titres 50-58 caractères, méta 127-153 caractères, About 86-106 mots, 3-4 étapes, 3-5 FAQ.
- `content-verify --only=text-tools/` : 0 échec.
- Aucune phrase bannie dans le lot.
- Doublons à l'échelle du site (Jaccard ≥ 0,7, libellés gardés) : il reste 1 cas, ci-dessous.

| Page | Endroit | Phrase (citation courte) | Problème | Preuve (fichier:ligne ou calcul) | Correction proposée |
|---|---|---|---|---|---|
| lorem-ipsum | méta (layout.tsx) | « always starting with Lorem ipsum » | (1) Toujours faux pour Words avec Amount = 1 : le résultat est « Lorem. ». | `app/lib/textTools.js` lorem() / words() ; Node : `lorem(1,'words')` → « Lorem. » | « …always starting with the words Lorem ipsum (a single word: Lorem) » ou « starting with Lorem » |
| lorem-ipsum | FAQ 1 | « opening with Lorem ipsum » | (1) Même cas : Amount 1 en mode Words donne « Lorem. ». | idem | « opening with Lorem ipsum (just Lorem for one word) » |
| find-replace | About | « Whole words only to skip matches inside longer words, in any alphabet » | (1) La même exception que celle corrigée dans les specs et la FAQ 4 : un motif regex que le drapeau `u` refuse ne garde que les écritures courantes. Elle n'est pas dite dans l'About. | `find-replace/page.jsx:31-40` | « …in any alphabet (common scripts only for a regex the Unicode mode refuses) », ou retirer « in any alphabet » de l'About |
| case-converter | FAQ 1 | « One rule. Title Case keeps… » | (6) Une question « What » doit commencer par la réponse directe en une phrase. « One rule. » n'est pas la réponse. | CONSIGNES-REDACTION, précisions du 06/10 (réponses de FAQ) | « Title Case keeps short words such as a, the or of in lower case, while Capitalized Case capitalizes every word. … » |
| case-converter | howTo 4 | « Click "Copy", or "Download" to save the text as converted.txt. » | (5) Identique mot pour mot, nom de fichier mis à part, à developer-tools/html-entity-decoder (« …to save the text as decoded.txt. »). Manqué au premier passage. | comparaison site entier, Jaccard 1,00 | Formulation propre (ex. « Copy the converted text, or keep it as converted.txt with "Download". ») |
| character-counter | privacy | « our error log would receive the error itself, without your text » | (3) Ne dit pas ce qui part en plus : le nom de l'outil, le nom et la version du navigateur. | `app/tools/ToolErrorWatch.jsx:18-37` ; `reportError.js:140-155` ; précisions du 06/10 (rapports d'erreur) | « …would receive the error message, the tool name and your browser's name and version, without your text » |
| lorem-ipsum | privacy | « reported to our error log as a message » | (3) Même omission : le texte exact (« Enter a whole number of 1 or more. »), l'outil et le navigateur ne sont pas dits. | `lorem-ipsum/page.jsx:16` ; `textTools.js` lorem() ; `reportError.js:140-155` | « …sends the message "Enter a whole number of 1 or more." with the tool name and browser version to our error log… » |
| text-encryptor | privacy | « are reported to our error log without your text or password » | (3) Même omission : nom de l'outil et nom/version du navigateur. | `text-encryptor/page.jsx:17,23` ; `reportError.js:140-155` | « …are reported to our error log with the tool name and browser version, without your text or password » |
| text-reverser | privacy | « reported to our error log as one short message that contains none of your text » | (3) Même omission ; le message exact (« Copy to the clipboard failed. ») n'est pas cité. | `text-reverser/page.jsx` (bouton Copy) ; `reportError.js:140-155` | « …reported as "Copy to the clipboard failed." with the tool name and browser version, none of your text » |
| text-to-list | privacy | « our error log receives that one message, never the list » | (3) Même omission : message exact, outil, navigateur. | `text-to-list/page.jsx` (bouton Copy) ; `reportError.js:140-155` | « …receives "Copy to the clipboard failed." with the tool name and browser version, never the list » |

**Totaux, deuxième passe**
- Pages relues : 16.
- Défauts restants : **10**.

| Point | Défauts |
|---|---|
| (1) Exactitude | 3 |
| (2) Libellés | 0 |
| (3) Lieu de traitement / rapports d'erreur | 5 |
| (4) Invérifiable | 0 |
| (5) Générique / dupliqué | 1 |
| (6) Structure | 1 |
| (7) Exemple | 0 |

Pages **sans aucun défaut** : ascii-art, duplicate-remover, sticky-notes, text-comparator, text-repeater, text-sorter, text-truncator, whitespace-remover, word-counter.

## Troisième passe (06/10)

J'ai relu en entier les 7 pages corrigées : case-converter, character-counter, find-replace, lorem-ipsum, text-encryptor, text-reverser et text-to-list. J'ai aussi relu les chaînes d'interface des 16 pages : sous-titre sous le H1, notes, messages d'erreur, « Result is empty », placeholders et TextArea.

**Les 10 corrections**
- 9 sont exactes face au code :
  - lorem-ipsum, méta et FAQ 1 : vrai aussi pour Words = 1, qui donne « Lorem. ».
  - case-converter, FAQ 1 : la réponse commence par la réponse directe ; la liste fixe est vérifiée (through et between en capitales).
  - case-converter, étape 4 : n'est plus en double.
  - Les cinq sections privacy disent le message exact, le nom de l'outil, le nom et la version du navigateur (`reportError.js:140-155`).
- La 10e, la nouvelle fin de l'About de find-replace, ajoute un défaut (n° 1 ci-dessous).
- Le code des outils n'a pas changé (texte seulement).
- Structure : find-replace About 108 mots, lorem-ipsum méta 143 caractères, réponses de FAQ conformes.
- Les sous-titres sont uniques sur le site.

| Page | Endroit | Phrase (citation courte) | Problème | Preuve (fichier:ligne ou calcul) | Correction proposée |
|---|---|---|---|---|---|
| find-replace | About (fin) | « and the search never leaves your device » | (3) Contredit la section privacy de la même page : un motif regex invalide part dans le journal d'erreurs, en partie ou en entier. Exemple : `(?<=price` donne « Invalid regular expression: /(?<=price/g… ». | `find-replace/page.jsx:22,51-52` ; `reportError.js:97` ; Node `sanitizeErrorMessage` (2e passe) | « …and your text never leaves your device » (le texte, lui, ne part jamais) |
| lorem-ipsum | interface (message affiché) | « Result is empty » pour un Amount vide, 0 ou négatif | (1) Message trompeur : la page ne dit pas pourquoi. Le vrai message (« Enter a whole number of 1 or more. ») part au journal sans être affiché. La section privacy décrit fidèlement ce comportement, c'est l'interface qui induit en erreur. | `lorem-ipsum/page.jsx:16` (catch : reportShownMessage puis setResult('')) et `:45-47` | Afficher `e.message` à la place de « Result is empty » (changement de code, à prévoir au plan) |
| case-converter | sous-titre (H1) | « Convert text to any case format » | (1) « any » est faux : il y a 12 casses fixes ; Train-Case et dot.case, par exemple, n'existent pas. | `case-converter/page.jsx:35-48` (12 boutons de casse) | « Convert text to 12 letter and programming cases » |
| find-replace | sous-titre (H1) | « Find and replace text instantly » | (4) « instantly » est une promesse de vitesse invérifiable, sans mesure. | — | « Replace every match, as plain text or a regular expression » |
| whitespace-remover | sous-titre (H1) | « Remove extra spaces and blank lines without merging your lines » | (1) Trompeur sur un point : le bouton « Join Into One Line » de la même page fusionne les lignes. | `whitespace-remover/page.jsx:28` | « Remove extra spaces and blank lines, or join lines into one » |

**Totaux, troisième passe**
- Pages relues : 7 en entier, plus l'interface des 16.
- Défauts restants : **5**.

| Point | Défauts |
|---|---|
| (1) Exactitude | 3 |
| (2) Libellés | 0 |
| (3) Lieu de traitement / rapports d'erreur | 1 |
| (4) Invérifiable | 1 |
| (5) Générique / dupliqué | 0 |
| (6) Structure | 0 |
| (7) Exemple | 0 |

Pages **sans aucun défaut** : ascii-art, character-counter, duplicate-remover, sticky-notes, text-comparator, text-encryptor, text-repeater, text-reverser, text-sorter, text-to-list, text-truncator, word-counter.

## Quatrième passe (06/10)

Pages relues en entier (texte et interface) : find-replace, lorem-ipsum, case-converter et whitespace-remover.

- **find-replace** :
  - L'About finit par « your text never leaves your device ». C'est cohérent avec la section privacy, qui dit qu'une erreur de regex peut contenir une partie du motif.
  - Le sous-titre « Replace every match, as plain text or a regular expression » est exact (mode texte par défaut, case « Use regular expression ») et unique sur le site.
- **case-converter** : le sous-titre « Convert text to 12 letter and programming cases » est exact (7 casses de texte et 5 de programmation, `page.jsx:35-48`) et unique.
- **whitespace-remover** : le sous-titre « Remove extra spaces and blank lines, or join lines into one » couvre bien les 5 boutons et il est unique.
- **lorem-ipsum** (nouveau code, `page.jsx:16-18,50`) :
  - Un Amount vide, à 0 ou négatif affiche maintenant en rouge « Enter a whole number of 1 or more. » (`textTools.js` lorem()). Le message est envoyé une fois par `reportShownMessage`.
  - La section privacy correspond : message exact, nom de l'outil, nom et version du navigateur, « no text is generated ».
  - Aucun texte de la page ne parle encore de « Result is empty ». La méta, la FAQ 1 et la ligne Start restent exactes, y compris Words = 1, qui donne « Lorem. ».
- **Contrôles** : `content-verify --only=text-tools/` donne 0 échec. Le code des outils n'a pas changé, en dehors de lorem-ipsum et des 3 sous-titres.

**Résultat : 0 défaut.** Les 16 pages du lot « text » sont maintenant sans défaut.
