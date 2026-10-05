# P36 lot 2 — audit « dev-misc » (13 outils)

Lecture seule : texte servi lu dans `docs/audit/p36/contenu-avant.json`, confronté au code. Abréviations des chemins :
`DT/` = `app/tools/developer-tools/` ; `page` = `DT/<outil>/page.jsx` ; `layout` = `DT/<outil>/layout.tsx` (titre ligne 5
et `openGraph.title` ligne 9 ; méta-description ligne 6 et `openGraph.description` ligne 10). Les numéros de ligne sont ceux
du fichier (ligne 1 = `'use client'`, précédé d'un BOM dans 12 des 13 `page.jsx`).

Constats transverses, valables pour les 13 pages (vérifiés, donc absents des tableaux sauf quand une phrase les contredit) :
- Aucune page n'appelle `lib/quota/guard.js` ni une route payante ; aucune n'exige de compte (aucun import d'auth ou de
  Supabase dans les 13 `page.jsx`). Le seul appel réseau vers notre serveur est le journal d'erreurs
  `POST /api/report-error` (`app/lib/reportError.js:16,133-171`), déclenché par `reportShownMessage` / `useToolError`
  (`app/lib/useToolError.js:19-31,37-51`) sur 4 outils seulement : api-tester (`page:31`), regex-tester (`page:42-43`),
  timestamp-converter (`page:24`, `useToolError`) et markdown-to-html (`page:16`).
- Aucune page ne produit d'image : la question du filigrane est sans objet.
- Toutes les pages rendent le texte SEO par `app/components/SeoContent.tsx:66-169` ; les données structurées FAQPage
  reprennent mot pour mot la FAQ affichée (`SeoContent.tsx:38-64`) : chaque défaut de FAQ ci-dessous est aussi dans le JSON-LD.

---

## api-tester (`/tools/developer-tools/api-tester`)

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| api-tester | about | « Nothing passes through our servers » | TROMPEUR | Vrai pour la requête (`page:24` `fetch(url, opts)` part du navigateur vers l'URL saisie). Mais un en-tête JSON invalide fait lever `JSON.parse` (`page:20`) et le message est envoyé à notre journal (`page:31` → `app/lib/useToolError.js:19-30` → `app/lib/reportError.js:163-171`). Le nettoyage (`app/lib/reportError.js:72-122`) laisse passer l'extrait que V8 cite : testé sur une copie de la fonction, l'en-tête `{"Authorization": Bearer sk_live_abcdef}` produit le message envoyé `Unexpected token '[text]', ..."ization": Bearer sk_"... is not valid JSON` (début d'un jeton envoyé). Une erreur réseau/CORS envoie aussi le message du navigateur. | Dire exactement : « The request goes from your browser straight to the API; if an error is shown, its text (cleaned of URLs, quoted text and long numbers) is logged by us. » — ou, mieux (décision propriétaire), ne plus remonter les erreurs d'analyse des en-têtes. |
| api-tester | FAQ 1 | « Is API Tester free to use? » / « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | Phrase identique sur 92 pages (`docs/audit/p36/unicite-avant.json`, `repeated`). Vrai ici (aucun appel au guard, aucune auth). | Supprimer ou remplacer par un fait propre : aucune limite, la page n'appelle que l'API saisie. |
| api-tester | about / étapes | (absence) | MINCE | Ce que le texte ne dit pas : les en-têtes de réponse ne sont pas affichés (seuls `status`, `statusText` et le corps : `page:30,49`) ; dès qu'un corps est envoyé, `Content-Type: application/json` est ajouté sauf si l'en-tête est fourni dans « Headers (JSON) » (`page:21-23`) ; le champ « Body » apparaît pour toute méthode sauf GET, DELETE compris (`page:47`) ; pas de délai maximal ni d'annulation (`page:24`) ; pas de durée de réponse ; une erreur réseau ou CORS n'affiche que le message du navigateur (`page:31`, `e.message`). Règle du navigateur (hors code) : depuis notre page en https, une URL `http://` publique est bloquée (contenu mixte). | Ajouter ces faits (en-têtes non affichés, Content-Type JSON, corps aussi pour DELETE, contenu mixte). |

## aspect-ratio (`/tools/developer-tools/aspect-ratio`)

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| aspect-ratio | méta (+ og) | « for any width and height you enter » | TROMPEUR | `page:14` n'accepte que des nombres > 0 (décimales et notation 1e3 comprises) ; vide, 0 ou négatif → « — » (`page:17-19`). | « for any positive width and height (decimals accepted) ». |
| aspect-ratio | interface | « Calculate aspect ratios for any dimensions » | TROMPEUR | Même règle `page:14` ; sous-titre `page:40`. | « … for any positive width and height ». |
| aspect-ratio | astuce 4 | « try different height values until the ratio shown matches what you need » | FAUX | L'outil calcule directement : champs « New width → height » et « New height → width » (`page:52-59`, calcul `page:28-34`). | Remplacer par : tapez la nouvelle largeur dans « New width → height » ; la hauteur s'affiche, arrondie au pixel avec la valeur exacte si elle n'est pas entière (`page:54`). |
| aspect-ratio | étapes 1-4 | (absence) | MINCE | Les étapes ne mentionnent ni les champs « New width → height » / « New height → width » (`page:52,57`) ni l'affichage « (≈ x, rounded) » (`page:32,54,59`). | Ajouter une étape pour ces champs. |
| aspect-ratio | FAQ 2 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | 92 pages (`unicite-avant.json`). | Supprimer ou remplacer par un fait propre. |

## color-picker (`/tools/developer-tools/color-picker`)

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| color-picker | titre (+ og) | « Color Picker — Let You Pick a Color Online Free » | MINCE | Titre agrammatical (`layout:5,9`), aucune information (ni HEX→RGB ni sélecteur natif). | Titre précis : ex. « Color Picker — HEX to RGB with Your Browser's Colour Picker ». |
| color-picker | étape 1 / astuce 1 | « Click the color swatch to open your browser's native color picker » | LIBELLÉ | Deux carrés de couleur : le grand aperçu 192 px (`page:14`, simple `div`, non cliquable) et, en dessous, le petit bouton `input type="color"` 64 px (`page:15`, aria-label « Pick a colour ») qui seul ouvre le sélecteur. | « Click the small colour button under the preview ». |
| color-picker | astuce 2 | « the leading # is optional » | TROMPEUR | Vrai seulement pour la conversion RGB (regex `page:6`). Sans `#`, l'aperçu reçoit `backgroundColor: "3b82f6"` (`page:14`), valeur CSS invalide : il garde la couleur précédente ; le sélecteur natif reçoit une valeur invalide (`page:15`, le navigateur la remplace par #000000) ; la carte HEX affiche le texte tel quel (`page:17`). | Dire de taper le `#` (ou corriger le code pour normaliser). |
| color-picker | méta / about | « shows the matching HEX and RGB values » | TROMPEUR | La carte HEX affiche et copie la saisie brute, non normalisée (`page:17` : `{color}` et `writeText(color)`) : taper « red » affiche et copie « red ». | « shows the HEX code you picked or typed and its RGB value ». |
| color-picker | FAQ 2 | « there's no image upload, URL input, or eyedropper for sampling colors from a picture or webpage » | TROMPEUR | Le site n'a pas de pipette, mais le bouton est le sélecteur natif du navigateur (`page:15`, `type="color"`) : sous Chrome/Edge ordinateur, ce sélecteur contient une pipette qui échantillonne l'écran (fonction du navigateur, pas du code du site — à confirmer par le propriétaire). | « This page has no image upload; depending on your browser, its own colour picker may include an eyedropper. » |
| color-picker | FAQ 3 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | 92 pages. | Supprimer ou fait propre. |
| color-picker | page entière | (absence) | MINCE | Quasi-doublon réduit de `/tools/converter-tools/color-converter` (HEX, RGB, HSL, HSV, CMYK et le même sélecteur natif : `app/tools/converter-tools/color-converter/page.jsx:5,119,127`). Le texte ne dit pas ce qui distingue les deux pages. Faits utiles absents : la copie RGB donne `rgb(r,g,b)` alors que la carte affiche `r,g,b` (`page:18`). | Dire la différence et renvoyer vers Color Converter pour HSL/CMYK ; dire le format copié. |

## cron-expression (`/tools/developer-tools/cron-expression`)

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| cron-expression | titre (+ og) | « Cron Expression — Turn Five Simple Text Fields Online Free » | MINCE | Titre agrammatical et vide d'information (`layout:5,9`). | Ex. « Cron Expression — Explain, Check and Build a 5-Field Cron Schedule ». |
| cron-expression | méta (+ og) | « turns five simple text fields into a valid cron string » | FAUX | Les champs sont joints tels quels (`page:19`) ; une valeur invalide reste dans l'expression et un message « Invalid cron expression: … » s'affiche (`page:34,40` ; `app/lib/cronInfo.js:12,18,24`). | « joins five fields into a cron expression, checks it, explains it in plain English and lists its next 5 runs ». |
| cron-expression | about | « there's no syntax validation, no next-run-time preview » | FAUX | Validation et 5 prochaines exécutions : `page:18,34-40` ; `app/lib/cronInfo.js:10-27` (cron-parser + cronstrue, `count = 5`). Contredit aussi la FAQ 3 de la même page. | Réécrire : vérifie l'expression, la décrit, liste les 5 prochaines exécutions dans le fuseau du visiteur. |
| cron-expression | astuce 3 | « Since there's no validation, test your expression … » | FAUX | Même code (`page:34-40`). | Supprimer ou : « Invalid fields are reported under the expression ». |
| cron-expression | FAQ 2 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | 92 pages. | Supprimer ou fait propre. |
| cron-expression | page entière | étapes 1-3, FAQ 1, astuces 2-3 | GÉNÉRIQUE | Doublon de cron-expression-builder : même code à part les préréglages (`page:20` 6 préréglages vs `DT/cron-expression-builder/page.jsx:20` 8) ; mêmes étapes 1-3, FAQ 1 et astuces 2-3 mot pour mot ; `unicite-avant.json` `over` : ratio 0,421. | Différencier les deux pages (ou décision propriétaire : fusion/redirection). |

## cron-expression-builder (`/tools/developer-tools/cron-expression-builder`)

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| cron-expression-builder | about | « with no syntax checking, next-run preview, or calendar/time pickers » | FAUX | Vérification et 5 prochaines exécutions : `page:18,36-42` ; `app/lib/cronInfo.js:10-27`. (Absence de calendrier/sélecteurs : vrai, `page:30-32` champs texte.) Contredit la FAQ 3 de la même page. | Réécrire comme pour cron-expression. |
| cron-expression-builder | astuce 3 | « Since there's no validation, test your expression … » | FAUX | `page:36-42`. | Supprimer ou dire que les erreurs s'affichent. |
| cron-expression-builder | FAQ 2 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | 92 pages. | Supprimer ou fait propre. |
| cron-expression-builder | FAQ 4 | « Cron expressions are used by Linux, macOS, Unix, and many scheduling libraries across languages like Python, Java, Node.js, and PHP. » | TROMPEUR | Phrase sans lien avec l'outil ; les planificateurs Java courants (Quartz, Spring) utilisent 6-7 champs, que l'outil refuse et explique au lieu de les lire (`app/components/CronPaste.jsx:22-23`). | Remplacer par : l'outil lit le cron standard à 5 champs ; une expression Quartz/Spring à 6-7 champs est expliquée, pas lue. |
| cron-expression-builder | page entière | étapes 1-3, FAQ 1, astuces 2-3 | GÉNÉRIQUE | Doublon de cron-expression (voir ci-dessus). | Différencier ou fusionner (propriétaire). |

## diff-viewer (`/tools/developer-tools/diff-viewer`)

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| diff-viewer | about | « the one used by git and diffchecker » | INVÉRIFIABLE | Le code utilise `diffArrays` de jsdiff (`app/lib/codeTools.js:49-54`, paquet `diff` 9.0.0, `package.json:32`). Que diffchecker utilise Myers n'est prouvé par aucun rapport du dépôt (`docs/audit/RAPPORT-qualite-29-09.md:35` l'affirme sans source). | Supprimer « and diffchecker » (garder « Myers, as git's default diff »). |
| diff-viewer | about | « an option ignores differences in spaces » | TROMPEUR | `app/lib/codeTools.js:53` : retire les espaces de début/fin et réduit chaque suite d'espaces à un seul ; « a b » et « ab » restent différents. | « ignores leading and trailing spaces and differences in the amount of spacing ». |
| diff-viewer | about / étape 2 | « Optionally tick 'Ignore whitespace'. » | MINCE | L'option « Ignore case » (`page:40`) et le surlignage des mots modifiés (`page:14-27,47`) sont absents de l'about et des étapes (seule la FAQ 4 les cite). Faits absents : une ligne inchangée affichée avec « Ignore case/whitespace » montre la version de gauche (`app/lib/codeTools.js:62`) ; « Compare » est inactif si un des deux textes est vide (`page:41`). | Compléter l'about et l'étape 2. |
| diff-viewer | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | 92 pages. | Supprimer ou fait propre. |
| diff-viewer | page entière | (absence) | MINCE | Même moteur et mêmes options que `/tools/text-tools/text-comparator` (`app/tools/text-tools/text-comparator/page.jsx:4,12-18`). Le texte ne dit pas ce qui distingue les pages (ici : une seule colonne, lignes numérotées des deux côtés `page:43-50`). | Dire la différence avec Text Comparator. |

## markdown-editor (`/tools/developer-tools/markdown-editor`)

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| markdown-editor | titre (+ og) | « Markdown Editor — Edit Markdowns Online Free » | MINCE | Titre agrammatical (« Markdowns »), aucune information (`layout:5,9`). | Ex. « Markdown Editor — Live GFM Preview, Download .md or .html ». |
| markdown-editor | méta (+ og) | « renders a small subset of Markdown » | FAUX | marked en CommonMark + GFM (`page:3,18`, `gfm: true`) puis DOMPurify ; l'about de la même page le dit. | « renders CommonMark and GitHub Flavored Markdown (tables, task lists, code blocks) live ». |
| markdown-editor | étape 2 (+ about, FAQ 3) | « Watch the rendered preview update instantly » ; « headings, … lists, … tables » | TROMPEUR | Le HTML est juste mais son apparence ne l'est pas : la classe `prose prose-sm` (`page:29`) n'a aucune règle (pas de `@tailwindcss/typography` dans `package.json`, aucune règle `.prose` dans `app/globals.css`) et le reset Tailwind (`app/globals.css:1` `@import "tailwindcss"` ; `node_modules/tailwindcss/preflight.css:73-80` titres `font-size/font-weight: inherit`, `:197-200` `ol, ul … list-style: none`) : titres de la taille du texte, listes sans puces ni numéros, tableaux sans bordures. Constat de lecture du code, à confirmer visuellement par le propriétaire (navigateur interdit à l'auditeur). | Corriger l'affichage (code, propriétaire) ; en attendant, ne pas promettre un rendu visuel des titres/listes/tableaux. |
| markdown-editor | about / étape 4 / FAQ 2 | « the rendered page as .html » | TROMPEUR | `document.html` (`page:33`) contient le fragment HTML nettoyé (`page:18`) sans `<!DOCTYPE>`, `<head>` ni `<meta charset>` — contrairement à Markdown to HTML qui l'enveloppe (`DT/markdown-to-html/page.jsx:15`). Ouvert depuis le disque, un texte accentué peut s'afficher mal selon l'encodage par défaut du navigateur. | « the rendered HTML (body content only) » — ou envelopper le fichier dans un document complet (code). |
| markdown-editor | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | 92 pages. | Supprimer ou fait propre. |
| markdown-editor | about, étape 3, FAQ 3, astuces 1-2 | (texte identique à Markdown Previewer) | GÉNÉRIQUE | Code identique à markdown-previewer sauf le texte d'exemple (`page:9`) et la classe de l'aperçu (`page:29`) ; about identique au nom près ; `unicite-avant.json` `over` : ratio 0,556 (le plus haut des dev-tools). | Différencier les deux pages (ou fusion/redirection : décision propriétaire). |
| markdown-editor | page entière | « Markdown Editor » | MINCE | Aucune aide à l'édition : une zone de texte (`page:28`), pas de barre d'outils, de raccourcis ni d'enregistrement local ; rien ne justifie le nom « Editor » face au Previewer. Faits absents : les images du Markdown sont chargées depuis leur site d'origine par le navigateur (rendu `page:29`). | Décrire ce que la page fait réellement (ou décision propriétaire sur le doublon). |

## markdown-previewer (`/tools/developer-tools/markdown-previewer`)

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| markdown-previewer | titre (+ og) | « Markdown Previewer — Render a Small Subset Online Free » | FAUX | marked GFM (`page:3,18`). | Ex. « Markdown Previewer — Live CommonMark + GFM Preview ». |
| markdown-previewer | méta (+ og) | « renders a small subset of Markdown live as you type — headings, bold, italic, and lists » | FAUX | `page:18` : tables, liens, images, blocs de code, listes de tâches… sont rendus. | Lister la vraie couverture (CommonMark + GFM). |
| markdown-previewer | étape 2 (+ about, FAQ 2) | « Watch the formatted preview update instantly » | TROMPEUR | Aperçu `page:29` (classe `text-sm` seulement) sous le reset Tailwind (`node_modules/tailwindcss/preflight.css:73-80,197-200`) : titres non agrandis, listes sans puces, tableaux sans bordures. À confirmer visuellement. | Corriger l'affichage (code) ; ne pas promettre le rendu visuel en attendant. |
| markdown-previewer | about / étape 4 / FAQ 3 | « the rendered page as .html » | TROMPEUR | `page:33` : fragment sans `<!DOCTYPE>` ni `<meta charset>`. | « the rendered HTML (body content only) ». |
| markdown-previewer | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | 92 pages. | Supprimer ou fait propre. |
| markdown-previewer | about, étape 3, FAQ 2, astuces 1-2 | (texte identique à Markdown Editor) | GÉNÉRIQUE | Doublon (voir markdown-editor). | Différencier ou fusionner (propriétaire). |

## markdown-to-html (`/tools/developer-tools/markdown-to-html`)

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| markdown-to-html | titre (+ og) | « Markdown to HTML — Convert a Small Subset of Markdown Online » | FAUX | `app/lib/codeTools.js:78-81` : `marked.parse(md, { gfm: true })`. | Ex. « Markdown to HTML — Convert CommonMark + GFM to a Full HTML Page ». |
| markdown-to-html | méta (+ og) | « converts a small subset of Markdown into a complete HTML document » | FAUX | Même code ; l'about de la page dit l'inverse. | « converts CommonMark and GitHub Flavored Markdown into a complete HTML5 document ». |
| markdown-to-html | FAQ 4 | « Is my code uploaded to a server? » / « No — everything runs in your browser; the engine is downloaded once when you first click. » | GÉNÉRIQUE | Question sur 9 pages, réponse sur 8 (`unicite-avant.json`) ; « code » ne convient pas à du Markdown. Fond vrai (`app/lib/codeTools.js:79` import à la demande). | « Is my Markdown uploaded? » + réponse propre. |
| markdown-to-html | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | 92 pages. | Supprimer ou fait propre. |
| markdown-to-html | étapes / about | (absence) | MINCE | Page courte (221 mots SEO). Absents : le bouton « Download » de `document.html` (`page:27`) ; le document n'a ni `<title>` ni `lang` (`page:15`) ; le HTML brut (y compris `<script>`) n'est pas nettoyé (aucun DOMPurify, `page:14-15`) ; pas d'aperçu rendu ; en cas d'erreur la sortie commence par « Error: » (`page:16`). | Ajouter ces faits ; citer le bouton Download dans les étapes. |

## password-generator (`/tools/developer-tools/password-generator`)

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| password-generator | titre + méta (+ og) | « Build a Random Password » ; « builds a random password from the character sets you select » | MINCE | Omet le mode « Passphrase » (`page:19,80-92`), la génération de 1 à 50 d'un coup (`page:40,68,106`), l'option « Avoid look-alike characters » (`page:102`) et l'indicateur de force (`page:109`). | Méta : mots de passe ou phrases de passe (liste EFF), 1 à 50 à la fois, force affichée. |
| password-generator | étape 4 | « Click 'Generate Password' » | LIBELLÉ | En mode Passphrase le bouton s'appelle « Generate Passphrase » (`page:108`). | « Click 'Generate Password' (or 'Generate Passphrase') ». |
| password-generator | étape 5 | « Click 'Copy' to copy it to your clipboard. » | TROMPEUR | Avec « How many » > 1, « Copy » ne copie que le premier (`page:112`, `password = all[0]` `page:42,70`) ; les autres sont dans une zone en lecture seule sans bouton (`page:111`). | Dire que Copy copie le premier ; sélectionner la liste pour les autres (ou ajouter un bouton, code). |
| password-generator | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | 92 pages. | Supprimer ou fait propre. |
| password-generator | astuces 2-3 | « Generate a unique password for every account… » ; « Store generated passwords in a password manager… » | GÉNÉRIQUE | Conseils de sécurité valables sur n'importe quel site, sans lien avec l'outil. | Remplacer par des faits de l'outil : chaque type coché apparaît au moins une fois (`page:65-67`) ; jeu de symboles exact (`page:53`) ; caractères retirés par « Avoid look-alike » (`page:49`). |

## regex-tester (`/tools/developer-tools/regex-tester`)

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| regex-tester | titre (+ og) | « Regex Tester — Run Your Pattern Against Javascript's Native » | MINCE | Phrase coupée (« Native » quoi ?), « Javascript » mal écrit (`layout:5,9`). | Ex. « Regex Tester — Test JavaScript Regular Expressions with Groups and Replace ». |
| regex-tester | about / méta | « nothing is uploaded to a server » | TROMPEUR | Un motif invalide : le message d'erreur du moteur, qui contient le motif (`/…/g`), est envoyé au journal (`page:43` → `app/lib/useToolError.js:19-30` → `app/lib/reportError.js:163-171`). Le nettoyage le remplace par `[path]` (`app/lib/reportError.js:97`) sauf si le motif contient `"`, `'`, `<` ou `>` : testé sur une copie, `(?<n>x)(?<n>y)` et `a"b(` partent en clair. Le texte à tester n'est jamais envoyé. | Corriger le code (propriétaire) ou dire : « your text is never sent; if your pattern is invalid, the error message is logged ». |
| regex-tester | FAQ 3 | « every match is highlighted in the text, and listed with its start–end position » | TROMPEUR | Le Worker s'arrête à 5 000 correspondances (`page:19`, affichage « 5000+ » `page:77`) ; le tableau n'en liste que 200 (`page:83,88`). | « Up to 5,000 matches are highlighted; the first 200 are listed with their position and groups ». |
| regex-tester | astuce 1 | « (matches are always all listed) » | FAUX | `page:19,83,88`. | Supprimer la parenthèse ou donner les plafonds. |
| regex-tester | étapes | (absence) | MINCE | Le résultat du remplacement se télécharge (`replaced.txt`, `page:92`) ; les drapeaux acceptés sont d, g, i, m, s, u, v, y, chacun une fois, sinon message (`page:38`) ; le texte n'est pas dit. | Ajouter ces faits. |

## timestamp-converter (`/tools/developer-tools/timestamp-converter`)

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| timestamp-converter | titre (+ og) | « Convert a Unix Timestamp (in Seconds) » | FORMAT | Millisecondes, microsecondes et nanosecondes acceptées, unité déduite du nombre de chiffres (`app/lib/timestamp.js:11-16,24-25`). | « Unix Timestamp Converter — Seconds, Milliseconds, µs, ns to Date ». |
| timestamp-converter | méta (+ og) | « converts a Unix timestamp (in seconds) to a date and back » | FORMAT | Même code. | Citer les 4 unités et le fuseau au choix. |
| timestamp-converter | about / étape 4 | « Each result is shown in UTC (ISO 8601) and in your own time zone » ; « Read the UTC and local results » | TROMPEUR | Le second résultat est dans le fuseau choisi dans la liste (`page:49-54,63`), le fuseau du visiteur n'étant que la valeur par défaut (`page:28`). Le temps relatif (`page:64`) n'est pas cité. | « in UTC and in the time zone you choose (yours by default), plus the relative time ». |
| timestamp-converter | about | « anything that isn't a number is reported instead of being partially read » | TROMPEUR | Une partie décimale est acceptée par l'expression (`app/lib/timestamp.js:21`) mais n'est prise en compte que pour les secondes (`:30`) : `1700000000000.7` (ms) perd `.7` sans message. Le message d'erreur dit « whole number » alors que les décimales sont acceptées (`:22`). | « Decimals are read for seconds only (to the millisecond) ». |
| timestamp-converter | about | « Like epochconverter.com, it recognises the unit from the number of digits » | INVÉRIFIABLE | Comparaison avec un tiers non prouvée par un rapport (seulement affirmée : `docs/audit/RAPPORT-qualite-29-09.md:56`, commentaire `app/lib/timestamp.js:7`). Les seuils réels : ≤ 11 chiffres secondes, 12-14 ms, 15-17 µs, 18-20 ns (`app/lib/timestamp.js:11-16`). | Supprimer la comparaison, donner les seuils. |
| timestamp-converter | FAQ 1 | « Yes, it's completely free with no signup required. » | GÉNÉRIQUE | 92 pages. | Supprimer ou fait propre. |

## uuid-generator (`/tools/developer-tools/uuid-generator`)

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code (fichier:ligne) | Correction attendue |
|---|---|---|---|---|---|
| uuid-generator | titre (+ og) | « Create Version 4 (random) UUIDs » | FORMAT | Versions proposées : v4, v7, nil (`page:49`) ; majuscules, sans tirets, accolades (`page:51-53`) ; 1 à 1000 (`page:35`). | « UUID Generator — v4 and v7 UUIDs, up to 1,000 at a Time ». |
| uuid-generator | méta (+ og) | « creates version 4 (random) UUIDs » | FORMAT | Même code. | Citer v4, v7, nil, formats, 1-1000. |
| uuid-generator | étape 2 | « Click 'Generate' to create that many random UUIDs. » | TROMPEUR | Nil : un seul UUID tout à zéro quel que soit le nombre (`page:37-38`) ; v7 : horodatage + compteur (`page:17-24`), pas purement aléatoire. | « creates that many UUIDs of the chosen version (the nil UUID is a single all-zero value) ». |
| uuid-generator | FAQ 4 | « Are these UUIDs safe to use as unguessable tokens? » / « Yes … they aren't predictable. » | TROMPEUR | Vrai pour v4 (122 bits aléatoires, `page:26-33`). v7 commence par l'heure de création en ms sur 48 bits (`page:21`) et, dans une même milliseconde, un compteur incrémenté de 1 (`page:19`) : l'heure se lit et la partie compteur se devine. Le nil est constant. | « v4: yes (122 random bits). v7 reveals its creation time; use v4 for secret tokens. » |
| uuid-generator | FAQ 2 | « Yes, completely free with no registration required. » | GÉNÉRIQUE | Sur 5 pages (`unicite-avant.json`). | Supprimer ou fait propre. |

---

## Synthèse du lot dev-misc

13 outils lus, 70 défauts :

| Type | Nombre |
|---|---|
| FAUX | 12 |
| TROMPEUR | 19 |
| GÉNÉRIQUE | 18 |
| MINCE | 13 |
| LIBELLÉ | 2 |
| FORMAT | 4 |
| INVÉRIFIABLE | 2 |
| **Total** | **70** |

Les plus graves :
1. **regex-tester et api-tester** : « nothing is uploaded » / « Nothing passes through our servers », alors que le journal
   d'erreurs reçoit en clair un motif contenant `"`, `'`, `<` ou `>`, ou le début d'un en-tête `Authorization` mal saisi
   (`app/lib/reportError.js:97` ne couvre pas ces cas). C'est aussi un défaut de confidentialité dans le code, à corriger
   par le propriétaire.
2. **cron-expression et cron-expression-builder** : about et astuce 3 disent « no syntax validation, no next-run-time
   preview » alors que les deux pages vérifient l'expression et listent les 5 prochaines exécutions. La méta de
   cron-expression promet une chaîne « valid ».
3. **markdown-editor, markdown-previewer, markdown-to-html** : titres et métas annoncent « a small subset of Markdown »
   (faux : marked en GFM). Pour l'Editor et le Previewer, l'aperçu « rendered » s'affiche probablement sans style (titres,
   listes, tableaux) : `prose` sans plugin et reset Tailwind. À confirmer visuellement.

Doublons à trancher par le propriétaire : markdown-editor / markdown-previewer (code identique), cron-expression /
cron-expression-builder (code identique sauf préréglages), color-picker ⊂ color-converter, diff-viewer ≈ text-comparator.
Aucune valeur NON TROUVÉ dans ce lot (aucune limite de taille dans le code de ces 13 outils : voir les fiches).
