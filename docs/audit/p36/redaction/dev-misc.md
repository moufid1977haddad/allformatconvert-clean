# P36 rédaction — lot « dev-misc » (13 outils, catégorie developer-tools)

Fichiers modifiés : `app/tools/developer-tools/<outil>/layout.tsx` (title.absolute, description, openGraph.title,
openGraph.description) et `page.jsx` (props de `<SeoContent>` seulement ; `title` inchangé) pour les 13 outils ;
`docs/audit/p36/preuves/dev-misc.json` (C3). **Aucune chaîne d'interface modifiée**, aucun composant partagé touché, aucune
logique changée. Les faits viennent de `docs/audit/p36/faits/dev-misc.json` ; les phrases retirées sont celles de
`docs/audit/p36/audit/dev-misc.md` (70 défauts, tous traités : supprimés ou réécrits).

## Contrôles (06/10, après la dernière modification)
- `node scripts/p36/content-verify.mjs --only=developer-tools/` : **0 échec** sur les 57 pages developer-tools (13 à moi),
  part maximale de phrases identiques entre pages réécrites 14,3 % (pdf-to-excel / pdf-to-word, hors lot).
- `node scripts/content-checks/instructions.mjs` : 225 pages, 1 735 libellés cités, **0 écart**.
- `node scripts/content-checks/privacy-claims.mjs` : **0 échec** (aucun de mes 13 outils n'est un outil serveur au sens de
  `SENDS`).

## Exemples : comment ils ont été produits
Scripts dans le dossier scratchpad de la session (hors dépôt), exécutés avec `node` (`TZ=UTC` pour les dates) :
- **Code importé tel quel** : `app/lib/jsonText.js` `reformatJson` (api-tester) ; `app/lib/cronInfo.js` `cronInfo` (les deux
  pages cron, `from` fixé au 06/10/2026 12:00 UTC, dates formatées avec les options `toLocaleString` de la page, en-US) ;
  `app/lib/codeTools.js` `diffLines` + `diff.diffWordsWithSpace` (diff-viewer) ; `markdownToHtml` + l'enveloppe de
  `page.jsx:15` (markdown-to-html) ; `app/lib/timestamp.js` `parseTimestamp`, `describe`, `describeZone` (timestamp).
- **Code de la page extrait par son texte et exécuté** : la chaîne `WORKER` de regex-tester (exécutée avec un `self`
  simulé) ; `hexToRgb` de color-picker ; `v7` de uuid-generator (3 UUID réels du 05/10/2026 23:53:33.378 UTC) ;
  `parseVal` de aspect-ratio ; `splitCron` de `app/components/CronPaste.jsx:7-26` (lignes copiées, car fichier JSX).
- **Algorithme recopié ligne pour ligne** (fonction React non importable) : `generate` / `generatePassphrase` de
  password-generator (`page.jsx:25-71`, setters remplacés par des retours ; liste EFF importée de `app/lib/effWordlist.js`).
- **marked seul** pour markdown-editor et markdown-previewer : DOMPurify n'a pas pu tourner dans Node (pas de DOM, pas
  de jsdom installé) ; la légende de l'exemple dit que la sortie est celle de marked avant l'étape DOMPurify. Les
  entrées choisies ne contiennent aucun HTML brut.

## Par outil

| Outil | Titre (car.) | Méta (car.) | Mots SEO avant → après | Défauts de l'audit traités | Remarques |
|---|---|---|---|---|---|
| api-tester | API Tester — Send GET, POST, PUT, PATCH, DELETE Requests (56) | 146 | 307 → 650 | « Nothing passes through our servers » remplacé par la vérité (requête directe ; message d'erreur nettoyé envoyé au journal, nettoyage imparfait) ; FAQ gratuité retirée ; manques ajoutés (en-têtes de réponse non affichés, Content-Type, corps hors GET, pas de délai) | Astuce « ouvrir l'adresse GET dans un onglet » : conseil de diagnostic, formulé « most likely » |
| aspect-ratio | Aspect Ratio Calculator — Simplify W:H, Find a Missing Side (59) | 142 | 348 → 555 | « any width and height » → « positive numbers » ; astuce 4 fausse (essais successifs) remplacée par les champs New width/height ; FAQ gratuité retirée | Sous-titre d'interface « for any dimensions » NON modifié (TROMPEUR, pas FAUX : consigne = chaînes fausses seulement) |
| color-picker | Color Picker — HEX to RGB with Your Browser’s Picker (52) | 141 | 366 → 503 | titre agrammatical ; libellé « color swatch » précisé (petit carré) ; « # optional » limité à la conversion RGB ; carte HEX = saisie brute ; pipette : « depends on the browser » ; renvoi Color Converter | Pipette « in some browsers » : comportement du navigateur, non vérifiable dans le code |
| cron-expression | Cron Expression Explainer — Paste, Check, See Next Runs (55) | 147 | 380 → 665 | « no syntax validation, no next-run preview » et « valid cron string » (FAUX) supprimés ; texte centré sur la LECTURE (collage, ligne crontab, macros, Quartz expliqué, 6 préréglages) | Jumeau : 0 phrase identique avec le builder |
| cron-expression-builder | Cron Expression Builder — 8 Presets, Edit Field by Field (56) | 146 | 367 → 562 | mêmes FAUX supprimés ; FAQ « operating systems » (TROMPEUR) retirée ; texte centré sur l'ÉCRITURE (8 préréglages, syntaxe des champs, */15, 1-5, 0 0 31 * *) | Noms MON/JAN vérifiés en exécutant `cronInfo('0 9 * JAN MON-FRI')` |
| diff-viewer | Diff Viewer — Line-by-Line Text Diff with Line Numbers (54) | 144 | 287 → 572 | « and diffchecker » (INVÉRIFIABLE) retiré ; « ignores differences in spaces » précisé ; Ignore case ajouté ; différence avec Text Comparator dite (une colonne / deux colonnes, `text-comparator/page.jsx:39-41`) | — |
| markdown-editor | Markdown Editor — Write, Preview, Save as .md or .html (54) | 139 | 312 → 542 | « small subset » (FAUX) retiré ; document.html décrit comme corps seul sans head ni charset ; page centrée sur l'écriture et les téléchargements | **Aucune promesse sur l'apparence de l'aperçu** (titres/listes/tableaux probablement sans style : `prose` sans plugin + reset Tailwind, à vérifier visuellement par le propriétaire) |
| markdown-previewer | Markdown Previewer — Check Pasted Markdown as Safe HTML (55) | 138 | 307 → 495 | titre et méta « small subset » (FAUX) retirés ; centré sur la vérification de texte collé et le nettoyage DOMPurify ; seule différence réelle avec l'Editor dite (exemple de départ plus long chez l'Editor) | Jumeau : 0 phrase identique ; même réserve sur l'apparence de l'aperçu |
| markdown-to-html | Markdown to HTML Converter — Full HTML5 Page, GFM Rules (55) | 153 | 221 → 491 | « small subset » (FAUX) retiré ; FAQ « Is my code uploaded » générique remplacée ; bouton Download, absence de title/lang et de nettoyage dits | — |
| password-generator | Password Generator — Random Passwords and EFF Passphrases (57) | 154 | 402 → 547 | méta complétée (phrases de passe, 1-50, force) ; libellé « Generate Passphrase » ajouté ; « Copy » = premier résultat seulement ; conseils génériques retirés | Exemple : deux tirages réels avec légende « never reuse these » |
| regex-tester | Regex Tester — JavaScript RegExp Matches, Groups, Replace (57) | 144 | 378 → 587 | titre tronqué ; « nothing is uploaded » remplacé (texte jamais envoyé ; message d'erreur envoyé, nettoyage imparfait pour motifs avec guillemets ou chevrons) ; plafonds 5 000 / 200 dits ; « always all listed » (FAUX) retiré | Astuce Safari 17 pour le drapeau v : version tirée de la compatibilité publique des navigateurs, pas du code |
| timestamp-converter | Unix Timestamp Converter — Seconds, ms, µs, ns to Date (54) | 155 | 414 → 568 | « (in seconds) » (FORMAT) retiré ; « your own time zone » → zone choisie ; décimales lues pour les secondes seulement ; comparaison epochconverter (INVÉRIFIABLE) retirée | Plage de dates -271821 / 275760 vérifiée par `new Date(±8.64e15)` |
| uuid-generator | UUID Generator — v4 Random or v7 Time-Ordered, in Bulk (54) | 152 | 328 → 485 | « version 4 » seul (FORMAT) → v4, v7, nil ; « random UUIDs » nuancé ; « safe as tokens » limité à v4 ; FAQ gratuité retirée | FAQ « v7 for database keys » : argument d'index B-tree général (connaissance publique, non mesurée ici) |

Mots « avant » = `seoWords` de `contenu-avant.json` ; « après » = About + étapes + specs + confidentialité + FAQ + astuces +
exemple, comptés depuis la source (même expression régulière que `content-verify.mjs`). Tous les About sont entre 89 et
117 mots, les textes de confidentialité entre 48 et 75 mots, les réponses de FAQ entre 26 et 50 mots.

## Preuves C3 (`docs/audit/p36/preuves/dev-misc.json`)
Chiffres avec unité prouvés par un motif dans le code : 15 min (`cron-expression-builder/page.jsx`), 1 000 000 et 20 000
caractères (`app/components/TextArea.jsx` `LIMIT`, `PREVIEW`), 8 à 64 caractères et 3 à 20 mots (attributs `range`),
7 776 mots (commentaire `password-generator/page.jsx:17`, et `EFF_WORDS.length` = 7 776 vérifié à l'exécution), bits des
phrases de passe (formule `page.jsx:44`, calculée : 6 mots 77, 8 mots 103, 6 mots + chiffre 83), seuil 100 bits
(`page.jsx:109`), 2 secondes (`regex-tester/page.jsx:42` `2000`), 48 bits (`uuid-generator/page.jsx:21`).

## Points non vérifiables laissés de côté ou signalés
- Apparence de l'aperçu Markdown (Editor, Previewer) : non testée (navigateur interdit) ; le texte n'en promet rien.
- Bugs de code à planifier, **non corrigés** (consigne) : (1) le nettoyage `app/lib/reportError.js:97` laisse passer un
  motif regex contenant `"`, `'`, `<` ou `>` et quelques caractères d'un en-tête JSON invalide (api-tester) ; les pages le
  disent désormais. (2) Aperçu Markdown sans style (`prose` sans `@tailwindcss/typography`). (3) Color Picker : sans `#`,
  l'aperçu et le sélecteur natif ne suivent pas. (4) Markdown Editor/Previewer : `document.html` sans head ni charset.
  (5) Password Generator : « Copy » ne copie que le premier résultat. (6) DOMPurify n'est qu'une dépendance indirecte
  (absente de `package.json`).
- Chaîne d'interface « Calculate aspect ratios for any dimensions » (aspect-ratio `page.jsx:40`) et message
  « Enter a whole number of seconds… » (`app/lib/timestamp.js:22`, composant partagé) : trompeurs, pas faux ; laissés.

## Corrections après relecture (docs/audit/p36/relecture/dev-misc.md, 22 défauts, tous vérifiés et corrigés, aucun rejeté)
Contrôles relancés ensuite : content-verify `--only=developer-tools/` 0 échec ; instructions.mjs 0 écart (1 741 libellés) ;
privacy-claims.mjs 0 échec. Jumeaux : toujours aucune phrase identique (cron ×2, markdown ×3). Aucun code ni chaîne
d'interface modifiés.
- A1 corrigé : vérifié `api-tester/page.jsx:44` (champ libre) et `:24` (`fetch(url)` sans contrôle du schéma) ; About, étape 1 et privacy disent maintenant qu'une adresse sans http:// ou https:// part vers notre site avec ses en-têtes et son corps. Bug de code à planifier : refuser une URL relative.
- A2 corrigé : `page.jsx:22` fusion sensible à la casse ; étape 3, spec « Request body » et FAQ 3 disent que seule la clé écrite Content-Type remplace, une clé content-type s'ajoute. Bug à planifier : fusion insensible à la casse.
- B1 corrigé : question reformulée (« Can it keep the aspect ratio… ? »), réponse commence par « Yes. ».
- B2 corrigé : « rounded from about 719.65 (the page shows ≈ 719.648609) », valeur affichée par `fit()` (`page.jsx:28-33`).
- C1 corrigé : question « Does the RGB card read short codes such as #f80? », réponse « No. ».
- D1 corrigé : étape 3 dit que le message rouge donne la valeur fausse et sa plage (`app/lib/cronInfo.js:18`).
- D2 corrigé : spec « Not read » limitée à Quartz/Spring (secondes en tête) ; pour AWS (6ᵉ champ = année) supprimer seulement l'année. La note du code (`app/components/CronPaste.jsx:23`, mentionne AWS) reste fausse pour AWS : à corriger (plan).
- D3 corrigé : About « a command after the five fields is left out » (sans promettre de note) ; FAQ 1 dit qu'une ligne-macro perd sa commande et que la note ne donne que le sens de la macro (`CronPaste.jsx:14-16`).
- D4 corrigé : légende précise fuseau UTC ET navigateur en anglais américain (`page.jsx:38`, `toLocaleString(undefined, …)`).
- D5 corrigé : « Six presets fill in schedules from every minute to once a year. »
- E1 corrigé : About du builder « the wrong value is reported with its allowed range ».
- E2 corrigé : FAQ 3 distingue le calendrier (mois sautés) de la liste de 5 dates (31 octobre → 31 décembre depuis octobre 2026, vérifié en Node).
- E3 corrigé : même précision de langue que D4 (`cron-expression-builder/page.jsx:40`).
- F1 corrigé : étape 2 réécrite autour des lignes ré-indentées et des majuscules, plus de formule commune avec Text Comparator.
- F2 corrigé : FAQ 1 réécrite sur l'indentation (2 → 4 espaces listée une fois, tab = espace, `app/lib/codeTools.js:53` `\s+` → espace).
- G1 corrigé : « five separators or none » (`password-generator/page.jsx:89`).
- G2 corrigé : « 6 characters » ; preuve C3 ajoutée (motif `[0O1lI|]`, `page.jsx:49`).
- G3 corrigé : astuce sans jugement de confort : « six words gives 77 bits using only letters and the separator you pick » (formule `page.jsx:44`).
- H1 corrigé : astuce propre à l'outil sur la saisie des barres obliques inverses (le champ est passé brut à `new RegExp`, worker `page.jsx:15`).
- I1 corrigé : question « Is v7 better than v4 for database keys? », réponse « Yes, in most cases ».
- I2 corrigé : « which keeps inserts compact » retiré ; seul l'ordre (prouvé par `uuid-generator/page.jsx:17-24`) est affirmé.
- I3 corrigé : légende donne 23:53:33.378 pour le premier et « 7 ms later » (0x01A10E7CA9C9) pour les deux autres.

## Corrections après deuxième passe (relecture « Deuxième passe », 7 défauts, tous vérifiés et corrigés)
- R1 corrigé (api-tester, privacy) : le message nettoyé part avec le nom de l'outil et le nom + la version du navigateur (`app/lib/reportError.js:142-155`, champs `tool`, `errorType`, `errorMessage`, `browser`).
- R2 corrigé (api-tester, étape 1 + privacy) : « usually » + cas `localhost:3000/api` ; vérifié en Node : `new URL('localhost:3000/api', page)` garde le schéma `localhost:` (échec, rien vers notre site), `api.example.com/users` et `127.0.0.1:8080/x` se résolvent sur www.onlineconvertools.com.
- R3 corrigé (cron-expression, spec « Not read ») : pour AWS, supprimer l'année ET baisser d'un un jour de semaine numérique (AWS : 1 = dimanche) ou écrire le nom (MON).
- R4 corrigé (color-picker, privacy) : « no request is made » → « the color is never sent to our servers » ; un Copy refusé est une promesse non rattrapée (`color-picker/page.jsx:17-18`) que `app/tools/ToolErrorWatch.jsx:33-36` signale.
- R5 corrigé (markdown-to-html, privacy) : même précision que R1.
- R6 corrigé (regex-tester, privacy) : même précision que R1 ; un dépassement de délai n'envoie que « pattern timeout (2 s) » (`regex-tester/page.jsx:42`), pas le message affiché.
- R7 corrigé (timestamp-converter, privacy) : même précision que R1 (`useToolError`, `page.jsx:24`).
Texte de confidentialité d'api-tester raccourci à moins de 90 mots après ajout. Aucune chaîne d'interface ni code modifiés.

## Corrections après troisième passe (chaînes d'interface, 6 défauts, tous corrigés)
Chaînes modifiées (texte seulement, aucune logique) — utilisateurs vérifiés par recherche : `CronPaste` n'est importé que par cron-expression et cron-expression-builder ; `app/lib/timestamp.js` seulement par timestamp-converter ; aucun test ni script ne cite les anciens messages.
- T1 corrigé : sous-titres distincts — cron-expression « Paste a cron expression and read it in plain English » ; cron-expression-builder « Build a cron schedule from presets, field by field » (`page.jsx:26` des deux).
- T2 corrigé : markdown-previewer « Paste Markdown and check the HTML it produces » (`page.jsx:26`) ; Markdown Editor inchangé.
- T3 corrigé : aspect-ratio « Simplify a width and height, or find a missing side » (`page.jsx:40`).
- T4 corrigé (autorisé par le contrôleur) : note de `app/components/CronPaste.jsx:23` — Quartz/Spring : retirer secondes (1er) et année (7e) ; AWS : retirer l'année (6e) et baisser d'un un jour de semaine numérique (1 = dimanche) ou l'écrire en nom (MON). Cohérent avec la ligne « Not read » et la FAQ 2 de cron-expression.
- T5 corrigé (autorisé) : `app/lib/timestamp.js:22` « Enter a number of seconds (decimals allowed), milliseconds, microseconds or nanoseconds — digits only, optionally negative. »
- T6 corrigé (autorisé) : `app/lib/timestamp.js:32,88` « (from year -271821 to year 275760) », identique à la ligne « Date range » de la page.
Contrôles : content-verify `--only=developer-tools/` 0 échec sur mes 13 pages (3 échecs C6 d'autres lots) ; instructions.mjs 0 écart ; privacy-claims.mjs 0 échec.
