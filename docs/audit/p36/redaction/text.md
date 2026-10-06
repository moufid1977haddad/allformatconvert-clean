# P36 — rédaction du lot « text » (16 outils, 06/10)

Fichiers modifiés : pour chaque outil, `app/tools/text-tools/<outil>/layout.tsx` (title.absolute, description,
openGraph.title, openGraph.description, rien d'autre) et `app/tools/text-tools/<outil>/page.jsx` (props de `<SeoContent>`
seulement : `title` inchangé ; `description`, `example`, `howToTitle`, `howTo`, `specs`, `privacyTitle`, `privacy`,
`faqs`, `tips` réécrits). Preuves des chiffres : `docs/audit/p36/preuves/text.json`. Base : `faits/text.json` et
`audit/text.md` (lot 2).

**Chaînes d'interface modifiées : aucune.** L'audit n'a trouvé aucune phrase FAUSSE dans le texte d'interface des
16 outils. La FAQ d'ASCII Art qui plaçait la note « sous le résultat » était un texte SEO ; elle est corrigée dans la FAQ.
Aucun composant partagé, aucune logique, aucune constante ni aucun libellé de bouton n'a été touché.

## Contrôles (06/10, sur l'arbre de travail)
- `node scripts/p36/content-verify.mjs --only=text-tools/` : 16/16 pages réécrites, **0 défaut pour mes outils**. Le
  seul défaut restant (C3) concerne `text-tools/url-encoder`, qui appartient au lot dev-encode. Partage maximal de phrases
  identiques sur le site : 14,3 % (une paire PDF, hors lot).
  Pendant un passage, `docs/audit/p36/preuves/` contenait un fichier JSON invalide d'un autre lot (audio-booster,
  « Bad escaped character ») qui faisait planter le script. Je l'ai contourné sans le modifier, avec une copie du script
  dans mon espace de travail qui ignore un fichier illisible. Au passage final, le script d'origine tourne sans erreur.
- `node scripts/content-checks/instructions.mjs` : 0 mismatch sur le site (1 733 libellés).
- `node scripts/content-checks/privacy-claims.mjs` : 0 failure.

## Exemples exécutés
Tous les exemples ont été produits par le vrai code, sous Node 24.14.1 (ICU 78). Les scripts sont dans mon espace de
travail : `ex.mjs`, `ex2.mjs`, `ex3.mjs`.
- **Fonctions de bibliothèque importées et exécutées.**
  - `app/lib/textTools.js` : `countCharacters`, `removeDuplicateLines`, `lorem`, `sortLines`, `truncate`,
    `removeAllExtraWhitespace`.
  - `app/lib/textSegments.js` : `titleCase`, `reverseWords`, `graphemes`, `countWords`, `countSentences`.
  - `app/lib/codeTools.js` : `diffLines`, avec `diff.diffWordsWithSpace`.
  - `app/lib/textCrypto.js` : `encryptText`, puis `decryptText` pour vérifier l'aller-retour.
  - figlet 1.12.0 avec la police Standard.
- **Logique interne à la page, recopiée à l'identique puis exécutée** (ces fonctions sont dans le composant et ne
  s'importent pas) :
  - Find and Replace : `escapeRegex`, bordure de mot, `replace(() => …)`.
  - Text Repeater : `join`.
  - Text to List : la liste numérotée.
  - Text Comparator : l'appariement des lignes.
  - Word Counter : les compteurs.
  - Case Converter : `wordsOf` et `byLine`, pour vérifier la FAQ snake_case (`myHTTPServer` → `my_http_server`).
- **Sticky Notes** : il n'y a rien à calculer. L'exemple montre l'objet exact que la page écrit dans le localStorage
  (`{ id, text, color }`, page.jsx:31), produit par `JSON.stringify`. L'id est une date d'exemple fixe.
- **Text Comparator** : le rendu en deux colonnes de l'exemple est une transcription texte des lignes calculées : `≠`
  marque une ligne différente et `[ ]` les mots surlignés. La légende le dit.
- **Text Encryptor** : la sortie est aléatoire. L'exemple publié est un vrai chiffré qui redonne « Meet at 6 » avec le
  mot de passe indiqué (vérifié par `decryptText`).

## Par outil
Mots visibles comptés depuis le source : About + légende de l'exemple + étapes + specs + privacy + FAQ + astuces. Pour
« avant », sur `contenu-avant.json` : About + étapes + FAQ + astuces.

| Outil | Titre (car.) | Méta (car.) | Mots avant → après | Défauts de l'audit retirés |
|---|---|---|---|---|
| ascii-art | ASCII Art Generator — Text to FIGlet Banners in 10 Fonts (56) | 153 | 210 → 518 | méta « # and space » ; « all printable ASCII » ; accents « in ten fonts » ; ANSI Shadow présenté comme ASCII ; note « under the result » (elle est au-dessus du bouton) ; FAQ gratuité/envoi |
| case-converter | Case Converter — Sentence, Title, camelCase, snake_case (55) | 147 | 277 → 512 | « (toggle) » ; 6 casses sur 12 nommées ; « any case format » ; « capitalises every sentence » (voir défaut nouveau) ; FAQ/astuce génériques |
| character-counter | Character Counter — Letters, Digits, Spaces, Byte Size (54) | 135 | 279 → 484 | « SMS encodings » ; « Hindi syllable » ; « special characters » ; « instantly » ; repli Firefox < 125 non dit ; « Spaces » sans les sauts de ligne |
| duplicate-remover | Remove Duplicate Lines — Keep the First, Same Order (51) | 133 | 213 → 466 | lignes vides dédoublonnées non dites ; compteur qui mêle doublons et lignes vides ; FAQ génériques |
| find-replace | Find and Replace Text — Plain Text or Regex, Whole Words (56) | 129 | 276 → 500 | « no case-insensitive option » (FAUX) ; « no undo… keep a copy » (FAUX : l'original reste) ; « full regex » sans m/u ; options non décrites ; méta générique |
| lorem-ipsum | Lorem Ipsum Generator — Exact Words, Sentences, Paragraphs (58) | 145 | 177 → 433 | « 1 to 100 » ; méta générique ; astuce générique |
| sticky-notes | Sticky Notes — Colored Notes Saved in Your Browser (50) | 145 | 264 → 407 | persistance sans le cas de la fenêtre privée (FAQ + astuce) ; titre agrammatical |
| text-comparator | Text Comparator — Side-by-Side Diff With Changed Words (54) | 150 | 250 → 441 | « git and diffchecker » ; « Ignore spaces » présenté comme absolu ; astuce Whitespace Remover inutile |
| text-encryptor | Text Encryptor — Password-Based AES-256-GCM Encryption (54) | 133 | 265 → 493 | méta « XOR » (FAUX) ; « banks and messaging apps » ; « never turned into garbage » (faux pour l'ancien format) ; « password » vs « Secret Key » |
| text-repeater | Text Repeater — Repeat a Word or Line up to 100 Times (53) | 127 | 188 → 373 | About mince ; astuce « None + find-replace » (impossible) ; « seamless integration » |
| text-reverser | Text Reverser — Reverse Letters, Word Order or Line Order (57) | 135 | 240 → 380 | « all characters are reversed… whichever mode » (FAUX) ; palindrome ; repli Firefox ; About mince |
| text-sorter | Text Sorter — Sort Lines A-Z, by Length, Number or Random (57) | 144 | 239 → 442 | libellés « A-Z, Z-A, By Length » faux + tri numérique absent ; « unbiased » (biais de modulo, maintenant chiffré) ; ordre des accents selon la langue du navigateur |
| text-to-list | Text to List — Bullet, Numbered or Comma-Separated List (55) | 145 | 212 → 381 | « only output option is copying » (FAUX : Download) ; astuce invérifiable ; About mince |
| text-truncator | Text Truncator — Shorten Text to N Characters or Words (54) | 135 | 188 → 422 | méta générique ; repli Firefox |
| whitespace-remover | Whitespace Remover — Extra Spaces, Tabs and Blank Lines (55, ancien 66 > 60) | 143 | 419 → 453 | FAQ génériques ; titre trop long |
| word-counter | Word Counter — Words, Characters, Reading Time, Keywords (56) | 129 | 321 → 522 | « instantly » ; « paragraph » (chaque ligne compte) ; repli Firefox ; réseaux sociaux ; « run-on sentences » ; FAQ génériques |

Toutes les FAQ « Is X free? Yes… no signup » et « Is my text uploaded? No » ont disparu. La confidentialité est
maintenant dans la section `privacy` (titre « Where your text is processed »). Sticky Notes l'intitule « Where your
notes are kept » et Lorem Ipsum « Where the text is generated ». Chaque section dit ce que fait le code, y compris le
message d'erreur affiché qui part, nettoyé, vers le journal d'erreurs quand la page en envoie un. Elle ne promet jamais
« aucune requête ».

## Faits découverts en rédigeant (pour le plan, code non modifié)
1. **Correction de mon audit.** Le Sentence case ne met pas de majuscule après un point suivi d'un mot en minuscule.
   « hello world. this is a test. » donne « Hello world. this is a test. » (exécuté sous Node). La raison : les règles
   Unicode de découpage en phrases (UAX #29, SB8, appliquées par `Intl.Segmenter`, `textSegments.js:33-53`) ne coupent
   pas une phrase avant une minuscule. L'audit avait jugé juste l'ancienne phrase « capitalises every sentence » ; elle
   était fausse pour un texte saisi tout en minuscules. La FAQ dit maintenant exactement ce qui se passe. Une correction
   du code est à prévoir au plan : couper aussi sur « . » suivi d'une espace et d'une minuscule, hors abréviations connues.
2. **Lorem Ipsum (UI, consigne : non corrigé).** Un montant vide, nul ou négatif n'affiche pas son message d'erreur : il
   est seulement signalé (page.jsx:16), et la page montre « Result is empty ». La section privacy le décrit tel quel.
3. **Text to List.** « Comma List » ne retire pas les espaces autour des éléments, contrairement aux deux autres
   formats (page.jsx:13-15). C'est maintenant écrit sur la page ; à aligner au plan si on le souhaite.
4. **Duplicate Remover.** Sans « Remove empty lines », les lignes vides sont dédoublonnées comme les autres
   (`textTools.js:45-48`). C'est maintenant écrit sur la page.
5. **Text Sorter.** La FAQ chiffre maintenant le biais de modulo du mélange au lieu de dire « unbiased » : au plus n sur
   4 294 967 296 pour n lignes, avec `Uint32Array` et `% (i + 1)` (page.jsx:20-23). Correction possible au plan par
   tirage avec rejet.

## Points non vérifiables laissés de côté
- Pages par nombre de mots, vitesse, « instantly », comportement des logiciels tiers.
- Règles de comptage des réseaux sociaux.
- Couverture Unicode 15.1 des syllabes devanagari selon le navigateur.
- Le « 5 MB » de localStorage.
- Les largeurs exactes des polices ASCII : je les ai mesurées moi-même sur HELLO WORLD, sans rapport dans le dépôt. Seul
  le classement (Small la plus étroite, Block et 3-D les plus larges) est écrit, avec « in our test ».
- **Faits externes gardés, prouvés hors du code** : Firefox a `Intl.Segmenter` depuis la version 125 (MDN) ; règles de
  titre de style Chicago (commentaire `textSegments.js:106`) ; jsdiff applique l'algorithme de Myers (documentation de
  la bibliothèque `diff`).
- **Mesure ASCII Art** : la couverture des lettres accentuées (38 lettres testées) vient de ma mesure du 05/10 sur les
  polices installées (figlet 1.12.0), consignée dans `faits/text.json`.

## Corrections après relecture (06/10, `relecture/text.md`, 48 défauts)
Les 48 défauts sont tous acceptés : je les ai vérifiés moi-même contre le code avant de corriger, et je n'en rejette
aucun.

**Vérifications faites**
- Ÿ est absent de Big, Slant, Small, Block et Shadow ; Standard l'a. Mesuré : figlet 1.12.0 sous Node.
- « Save / Share » n'apparaît que sur iPhone / iPad (`app/components/FileDownload.jsx:93`, via `isIosDevice` de
  `app/lib/download.js:15-19`). Ma fiche de faits du lot 2 se trompait sur ce point.
- Un motif regex qui contient `<` ou `"` n'est pas effacé par la regex « chemin » du nettoyage
  (`app/lib/reportError.js:97`).
- Words 1 → « Lorem. » (`textTools.js:116`).
- None + virgule finale → `a,a,a,` (`text-repeater/page.jsx:23`).

**Dans les tableaux ci-dessous**
- Les numéros reprennent l'ordre du tableau de la relecture.
- (5) = phrase-gabarit ou phrase dupliquée.
- « Message d'erreur complet » : la section dit maintenant que le journal reçoit aussi le nom de l'outil et le navigateur
  avec sa version (`reportError.js:140-155`), avec le texte exact du message.

### ascii-art, case-converter, character-counter, duplicate-remover

| # | Page | Endroit | Correction |
|---|---|---|---|
| 1 | ascii-art | specs « Accented letters » | Ajout de Ÿ (« the same except œ, Œ and Ÿ »). Plus de « all 38 » : la ligne nomme les langues testées (français, allemand, espagnol, portugais, scandinave). |
| 2 | ascii-art | FAQ 1 | Corrigé de la même façon (« lack œ, Œ and Ÿ »). |
| 3 | ascii-art | privacy | Plus de « only » ; message d'erreur complet. |
| 4 | case-converter | FAQ 1 | « in the Chicago style » retiré : « from a fixed list (through or between are capitalized) », comme `textSegments.js:107`. Réponse ramenée à 68 mots. |
| 5 | case-converter | About | Fin de l'About remplacée (5). |
| 6 | case-converter | étape 1 | Étape propre à l'outil (texte tapé en majuscules). |
| 7 | character-counter | étape 1 | Étape propre à l'outil. |
| 8 | duplicate-remover | privacy | Message réel « Copy to the clipboard failed. » ; message d'erreur complet. |
| 9 | duplicate-remover | étape 4 | Reformulée (5). |
| 10 | duplicate-remover | étape 2 | Dit quand cocher chaque option. |
| 11 | duplicate-remover | specs « Output » | Reformulée, différente de text-sorter. L'étape 1 de text-sorter est aussi changée. |

### find-replace, lorem-ipsum, sticky-notes, text-comparator

| # | Page | Endroit | Correction |
|---|---|---|---|
| 12 | find-replace | privacy | Dit maintenant qu'une erreur de regex peut contenir une partie du motif. « Quoted pattern removed » retiré. **À prévoir au plan** (code non touché) : ne pas rapporter le motif. |
| 13 | find-replace | specs « Regex flags » + FAQ 4 | Le repli sans `u` vers les écritures courantes (`find-replace/page.jsx:34-44`) est maintenant dit. |
| 14 | lorem-ipsum | specs « Start » | Dit qu'en mode Words on n'a que les N premiers mots. |
| 15 | lorem-ipsum | méta | « starting with Lorem ipsum » (150 caractères). |
| 16 | lorem-ipsum | FAQ 1 | « opening with Lorem ipsum ». |
| 17 | lorem-ipsum | specs « Output » | Ligne propre. |
| 18 | sticky-notes | About | Ajout de l'effacement par Safari d'un site non ouvert pendant sept jours de navigation. Fait externe (règle WebKit ITP), écrit en lettres, sans chiffre. |
| 19 | sticky-notes | privacy | Même cas ajouté. |
| 20 | text-comparator | étape 2 | Reformulée, différente de Diff Viewer. |
| 21 | text-comparator | étape 1 | Reformulée, différente de Diff Viewer. |
| 22 | text-comparator | exemple | La légende explique le signe ≠. |

### text-encryptor, text-repeater, text-reverser, text-sorter

| # | Page | Endroit | Correction |
|---|---|---|---|
| 23 | text-encryptor | specs « Output » | Ligne renommée « Encrypted text » : « Base64 of the marker OCT1… so it always starts with T0NU ». |
| 24 | text-encryptor | privacy | Première phrase reformulée, différente de File Encryptor. |
| 25 | text-encryptor | specs « Algorithm » | Reformulée. |
| 26 | text-encryptor | étape 2 | Reformulée (passphrase, champ masqué : `type="password"`, `page.jsx:35`). |
| 27 | text-repeater | FAQ 3 | Ajout de « then delete the comma left at the very end ». |
| 28 | text-repeater | About | Fin de l'About remplacée (5). |
| 29 | text-repeater | specs « Output » | Ligne propre. |
| 30 | text-reverser | étape 3 | Reformulée (5). |
| 31 | text-reverser | specs « Output » | Ligne propre. |
| 32 | text-sorter | privacy | Plus de « only » ; outil et navigateur mentionnés. |
| 33 | text-sorter | étape 3 | Reformulée (5). |
| 34 | text-sorter | specs « Output » | Reformulée. |

### text-to-list, text-truncator, whitespace-remover, word-counter

| # | Page | Endroit | Correction |
|---|---|---|---|
| 35 | text-to-list | FAQ 1 | « on an iPhone or iPad "Save / Share" appears too ». |
| 36 | text-to-list | FAQ 2 | Find and Replace seulement pour un tiret commun à toutes les lignes ; les numéros se retirent dans l'éditeur. |
| 37 | text-to-list | astuce | « most mail apps » → « a mail app that accepts comma-separated addresses ». |
| 38 | text-to-list | specs « Output » | Ligne propre. L'étape 3 est aussi variée. |
| 39 | text-truncator | privacy | Plus de « alone » ; outil et navigateur mentionnés. |
| 40 | text-truncator | About | Fin de l'About remplacée (5). |
| 41 | text-truncator | étape 4 | Reformulée (5). |
| 42 | text-truncator | specs « Output » | Ligne propre. |
| 43 | whitespace-remover | FAQ 3 | « Every button keeps at least one space… Remove Leading and Remove Trailing leave the spacing inside lines untouched » (`textTools.js:158-159`). |
| 44 | whitespace-remover | privacy | Message réel ; outil et navigateur mentionnés. |
| 45 | whitespace-remover | About | Fin de l'About remplacée (5). |
| 46 | whitespace-remover | étape 4 | Reformulée (5). |
| 47 | whitespace-remover | specs « Output » | Ligne propre. |
| 48 | word-counter | étape 1 | Étape propre à l'outil. |

**Contrôles après corrections**
- `content-verify --only=text-tools/` : 0 défaut. Partage maximal de phrases sur le site : 14,3 %, une paire hors lot.
- `instructions.mjs` : 0 mismatch (1 746 libellés).
- `privacy-claims.mjs` : 0 failure.
- Mesures : About 86-106 mots ; réponses de FAQ 29-68 mots ; privacy 40-72 mots.

## Corrections après deuxième passe (06/10, 10 défauts, tous acceptés)

| # | Page | Endroit | Correction |
|---|---|---|---|
| 1 | lorem-ipsum | méta | « opening with the start of the classic passage » (143 car.). Vrai aussi pour Words = 1, qui donne « Lorem. » (`textTools.js:116`). |
| 2 | lorem-ipsum | FAQ 1 | « opening with the first words of the classic passage (just Lorem when you ask for a single word) ». |
| 3 | find-replace | About | « in any alphabet except for a regex that the Unicode mode refuses, where only the common scripts count » (`find-replace/page.jsx:34-44`). « the work happens in your browser » remplacé (5). |
| 4 | case-converter | FAQ 1 | La réponse commence par la différence elle-même (« Title Case keeps short words… while Capitalized Case capitalizes every word »). « One rule. » retiré. 68 mots. |
| 5 | case-converter | étape 4 | « Copy the converted text with "Copy", or keep it as converted.txt with "Download". » |
| 6 | character-counter | privacy | Plantage éventuel : « the error message, the tool name and your browser's name and version, without your text » (`ToolErrorWatch.jsx`, `reportError.js:140-155`). |
| 7 | lorem-ipsum | privacy | Message exact « Enter a whole number of 1 or more. » (`textTools.js:115`), nom de l'outil, nom et version du navigateur. |
| 8 | text-encryptor | privacy | Ajout du nom de l'outil et du nom et de la version du navigateur. |
| 9 | text-reverser | privacy | Message exact « Copy to the clipboard failed. », nom de l'outil, nom et version du navigateur. |
| 10 | text-to-list | privacy | Même formulation exacte. |

**Contrôles**
- `content-verify --only=text-tools/` : 0 défaut.
- `instructions.mjs` : 0 mismatch (1 763 libellés).
- `privacy-claims.mjs` : 0 failure.

## Corrections après troisième passe (06/10, 5 défauts)

| # | Page | Endroit | Correction |
|---|---|---|---|
| 1 | find-replace | About (fin) | « and your text never leaves your device ». Plus de contradiction avec la section privacy : une erreur de regex peut contenir une partie du motif. |
| 2 | lorem-ipsum | interface « Result is empty » | Code non touché : le contrôleur le corrige (`lorem-ipsum/page.jsx:16`). La section privacy ne décrit plus ce qui s'affiche ni ne promet de message affiché ; elle dit seulement que « no text is generated » et quel message part au journal d'erreurs. |
| 3 | case-converter | sous-titre | Chaîne d'interface modifiée, `page.jsx:34` : « Convert text to any case format » → « Convert text to 12 letter and programming cases ». |
| 4 | find-replace | sous-titre | Chaîne d'interface modifiée, `page.jsx:64` : « Find and replace text instantly » → « Replace every match, as plain text or a regular expression ». |
| 5 | whitespace-remover | sous-titre | Chaîne d'interface modifiée, `page.jsx:19` : « Remove extra spaces and blank lines without merging your lines » → « Remove extra spaces and blank lines, or join lines into one ». |

**Contrôles**
- `content-verify --only=text-tools/` : 0 défaut, y compris la nouvelle détection des phrases génériques.
- `instructions.mjs` : 0 mismatch.
- `privacy-claims.mjs` : 0 failure.
