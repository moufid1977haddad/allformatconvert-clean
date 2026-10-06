# P37 lot 1 — suites 3 : Sentence case après ? et !, phrases du Word Counter

Suite de `docs/audit/p37/lot1-misc.md`, point 2. Tout est testé en Node. Aucun build, aucun serveur, rien poussé.
Les modifications du code et des tests sont dans le commit 0e500504 (fait par le contrôleur pendant l'interruption).
Ce rapport est nouveau, non commité.

## 1. Sentence case : `?` ou `!` collé à une lettre

**Défaut.** `what?ok` donnait `What?Ok`. ICU coupe toujours une phrase après `?` ou `!`, même sans espace.
Plus grave : une adresse avec requête, `example.com/page?q=test`, devenait `example.com/page?Q=test`.
Word Counter comptait aussi 2 phrases dans `what?ok`.

**Règle choisie.** Même règle que pour le point : `.`, `?` ou `!` termine une phrase seulement si une espace, un
retour à la ligne ou la fin du texte suit (guillemets ou parenthèses fermants permis entre les deux). Collé à une
lettre ou un chiffre, il ne termine rien : `what?ok`, `page?q=test`, `Yahoo!Mail` restent tels quels.
Les marques japonaises pleine largeur (`？`, `。`) ne sont pas touchées : elles s'écrivent sans espace.
- Marché : convertcase.net dit « Every letter after a full stop will get converted into an upper case letter »
  (https://convertcase.net/). Microsoft dit seulement que Sentence case met une majuscule à la première lettre d'une
  phrase (https://support.microsoft.com/en-us/Word/change-the-capitalization-or-case-of-text). Aucun des deux ne
  décrit le cas sans espace. Pas de test dans leur interface (pas de navigateur dans ce lot) : seule la doc est citée.
  Notre choix suit la règle déjà prise pour le point et protège les adresses web.

## 2. Word Counter : phrases après un point suivi d'une minuscule

**Défaut.** `countSentences('hello world. this is')` donnait 1. ICU ne coupe pas devant une minuscule (règle SB8).
Sentence case avait un correctif à part (`capitalizeAfterPeriods`), le compteur non : les deux outils divergeaient.

**Correction.** La coupure est faite une seule fois, dans `sentenceRanges` (fichier `app/lib/textSegments.js`).
Sentence case et Word Counter utilisent ces mêmes plages. `capitalizeAfterPeriods` est supprimée.
- Coupure : un point seul, fermants, au moins une espace, ouvrants, puis une minuscule.
- Pas de coupure après une abréviation connue (`e.g.`, `etc.`, `Mr.`, `p.m.`, liste existante), une initiale d'une
  lettre (`john f. kennedy`), des points de suspension, ni sans espace (`3.50`, `example.com`).
- Fusion : `.`, `?`, `!` collé à une lettre ou un chiffre (point 1).
- Navigateurs sans `Intl.Segmenter` (Firefox avant 125) : le découpage de secours coupait à chaque point. Il fusionne
  maintenant aussi après une initiale ou des points de suspension, et `3.50` ne termine plus une phrase. Vérifié avec
  une copie du fichier où `hasSegmenter = false` : 13/13, 13/13, 16/16.

## Tests

| Test | Avant | Après |
|---|---|---|
| `scripts/p37/sentence-case-qe.test.mjs` (nouveau) | 7/13 | 13/13 |
| `scripts/p37/word-counter-sentences.test.mjs` (nouveau) | 8/13 | 13/13 |
| `scripts/p37/sentence-case.test.mjs` | 16/16 | 16/16 |
| `scripts/text-tests/01-text-segments.mjs` | 8/8 | 8/8 |

Sorties : `scripts/p37/*.before.txt` et `*.after.txt`. Attention : `sentence-case.before.txt` a été écrasé par erreur,
puis refait avec la version HEAD d'avant P37 du fichier : 9/16, comme dans `lot1-misc.md`.
Le test navigateur `scripts/browser-tests/text-tools.mjs` attend toujours le même texte et 6 phrases : vérifié en Node.

## Exemple de la page Word Counter

Recalculé avec le vrai code (avec et sans `Intl.Segmenter`) : Words 15, Characters 73, No Spaces 58, Sentences 3,
Paragraphs 2, Min Read 1, 1 min à voix haute. Identique à la page. Aucun changement.

## Textes de page

- Case Converter, FAQ « Does Sentence case capitalize after every period? » :
  - avant : « …and the word after ! or ?. … and when no space follows the period, as in 3.14, example.com or
    hello.world. »
  - après : « …and the word after ! or ? when a space or a line break follows. … and when no space follows the
    period, ! or ?, as in 3.14, example.com, hello.world or what?ok. »
- Word Counter, FAQ « Does it count the same way in every browser? » : « 3.50 ends a sentence » n'est plus vrai sans
  `Intl.Segmenter`. Remplacé par « an emoji with a skin tone counts as two characters » (mesuré : 2).
- `layout.tsx` des deux pages : rien d'inexact, pas modifiés. `docs/audit/p36/preuves` : aucune entrée à changer.

## Contrôles

- `node scripts/p36/content-verify.mjs --only=text-tools/case-converter --verbose` : 0 échec.
- `node scripts/p36/content-verify.mjs --only=text-tools/word-counter --verbose` : 0 échec.
- `node scripts/content-checks/instructions.mjs` : 0 écart.
- `node scripts/content-checks/privacy-claims.mjs` : 2 échecs, tous sur `pdf-tools/pdf-compress` (« optimized in your
  browser »). Hors de ce lot : page modifiée par un autre agent. Aucun échec sur nos deux pages.

## Fichiers

- `app/lib/textSegments.js` (CRLF gardé)
- `app/tools/text-tools/case-converter/page.jsx` (CRLF gardé)
- `app/tools/text-tools/word-counter/page.jsx` (CRLF gardé)
- `scripts/p37/sentence-case-qe.test.mjs`, `.before.txt`, `.after.txt` (nouveaux)
- `scripts/p37/word-counter-sentences.test.mjs`, `.before.txt`, `.after.txt` (nouveaux)
- `scripts/p37/sentence-case.before.txt` (refait), `scripts/p37/sentence-case.after.txt` (relancé)
- `docs/audit/p37/lot1-suites-3.md` (ce rapport)
