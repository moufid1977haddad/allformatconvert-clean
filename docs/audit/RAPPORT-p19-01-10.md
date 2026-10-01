# RAPPORT — P19 : confirmation avant de quitter sur tout le site, Audio Splitter (point au milieu, parts égales), Code Formatter sous WebDriver, inventaire du non-poussé (01/10)

Travail seul, à la demande du propriétaire (chantier et mise en production demandés). **Aucune poussée forcée.** Aucun
secret lu ni affiché. Aucun outil supprimé ni renommé. Dépense autorisée : ≈ 0,25 $ de crédits Pangram (étape 4, voir §6).

## En bref

| Point | Résultat |
|---|---|
| 1 — Confirmation avant de quitter | **une seule règle** dans le composant commun : tout fichier produit et non pris arme la question (texte et générateurs compris) ; plusieurs formats d'un même résultat = un fichier ; copier un texte = le prendre ; l'exemple affiché au chargement n'arme rien. **Rouge sur www avant** (JSON Formatter, QR, Hash : pas de question), **vert après** ×3 moteurs + iPhone/iPad simulés |
| 2 — Audio Splitter | défaut **au milieu du fichier** ; ajout **parts égales (2-100)** et **toutes les N secondes** (moyen des scindeurs du marché) ; parts recollées = source **échantillon pour échantillon**, ×3 moteurs, www compris |
| 3 — Code Formatter | **aucune cause dans le code pour une frappe humaine** ; la seule voie de perte (événement `input` manquant, ce que fait le WebDriver de Safari) est **fermée** : champ non contrôlé. Rouge sur www avant, vert après |
| Inventaire du non-poussé | **aucun commit local non poussé**, aucune remise ; `.serena/` et `pip.log` = fichiers d'outils locaux, non déployés, rien effacé |
| Déploiement | repère `restauration-avant-p19-01-10` = `2ecb91a7` ; préversion `onlineconvertools-gregicef4` verte ; fusion **`f7569b1d`** (sans poussée forcée), production **`onlineconvertools-1boluf4vi`** ; **tout vert sur www, aucun retour arrière** |
| AI Detector sur www | ✅ **lancé à 20 h 11 à la demande du propriétaire : les deux verdicts justes** (résumé LIGO 2016 = humain 100 %, texte d'IA = IA 100 %) ; ≈ 0,25 $ de crédits Pangram, la dépense notifiée |


## 0. Point de départ — passe Safari 17.6 réelle du MacBook après P18

**57/59 réussies** (les 9 outils PDF, le téléchargement, Markdown to PDF, Video to GIF, Text to PDF avec emoji, MOBI,
Upscaler, filtres et outils texte vérifiés finement). Les 2 écarts sont les points 1 et 3 ci-dessous ; le point 2 (Audio
Splitter) a été relevé pendant la même passe (reporté au
bloquant 9 du plan).

## 1. Confirmation avant de quitter : une seule règle pour tout le site

**Constat (Mac)** : QR Generator, JSON Formatter et Hash Generator laissaient quitter la page sans rien demander avec un
fichier prêt et non téléchargé ; les autres outils demandaient. **Cause, lue dans le code** : P18 avait exempté
volontairement les résultats texte (`TextDownload`, `guard={false}`, 71 fichiers) et les générateurs à plusieurs
formats (QR Generator, Barcode Generator, AI Image Generator en PNG) — deux règles au lieu d'une.

**Recherche** : MDN (`beforeunload`) recommande d'armer la question seulement quand il y a quelque chose à perdre et
après une action de l'utilisateur, et de la retirer dès qu'il n'y a plus rien à perdre ; les navigateurs n'affichent de
toute façon la question qu'après un geste sur la page. Un QR, un code-barres ou une transcription offerts en plusieurs formats sont **un** résultat : en
prendre un format, c'est l'avoir pris.

**Règle unique, dans le composant commun `app/components/FileDownload.jsx`** : tout fichier produit par le visiteur et
non pris arme la question. « Pris » = téléchargé, partagé (iPhone/iPad), mis dans le ZIP, ou — pour un résultat texte —
**copié** (bouton « Copy » des outils, qui passe par `navigator.clipboard.writeText`, ou Ctrl+C sur le texte : le
visiteur a son résultat, lui demander avant de partir serait faux). Deux précisions, décidées d'après la recherche :
- **Plusieurs formats d'un même résultat = un seul fichier** : `<DownloadGroup alternatives>` — télécharger le PNG du QR
  suffit, on ne redemande pas pour le SVG et le PDF. Appliqué à : QR Generator, Barcode Generator, AI Image Generator
  (WebP / PNG), transcriptions (TXT / SRT / VTT), Subtitle Generator (SRT / VTT), Voice Recorder (enregistrement / WAV),
  Markdown Editor et Previewer (`.md` / `.html`). Les lots de fichiers distincts (parts, pages, images) gardent la règle
  « chaque fichier ».
- **Un exemple affiché au chargement n'est pas le fichier du visiteur** : un résultat présent avant tout geste
  (l'exemple de Markdown Editor) n'arme rien ; dès que le visiteur le modifie, le nouveau résultat est le sien.

Plus aucun `guard={false}` dans le site. La ligne affiche « Downloaded ✓ » ou « Copied ✓ ».

**Trouvé en route (textes faux)** : Markdown Editor et Markdown Previewer disaient « There's no copy or download
button » alors qu'ils offrent `.md`, `.html` et le ZIP depuis P18 ; TSV to CSV, XML Formatter et XML to JSON disaient
« there's no download button ». Textes corrigés (description, FAQ, conseils).

**Banc `download-guard.mjs`** : la question est désormais vérifiée sur **tous** les outils du banc, texte compris
(JSON Formatter, CSV to TSV, Case Converter, QR Generator) ; ajoutés : **Hash Generator** (2 fichiers → `checksums.txt`),
**QR Generator, un seul format téléchargé** → plus de question, **JSON Formatter, résultat copié** → plus de question,
**Markdown Editor** : l'exemple ne fait rien demander même après un clic, le texte modifié fait demander.

**Résultats** (`download-guard.mjs`) :

| Où | Chromium | Firefox | WebKit | iPhone simulé | iPad simulé |
|---|---|---|---|---|---|
| **www AVANT** (P18), les 4 cas visés | **10 FAIL** : JSON Formatter, QR Generator, Hash Generator, JSON copié — aucune question avant de quitter | | | | |
| build local | 139/141 · Firefox 139/141 · WebKit 129/130 : écarts du banc (sélecteur `h1` ambigu ; sous Firefox `fill()` ne donne pas l’activation sans laquelle Firefox ne demande jamais ; Image Compressor sous charge), cas repassés après correction : PASS | | | 148/148 | 148/148 |
| préversion `gregicef4` | 145/146 → Image Compressor, **écart du banc** (ci-dessous), repassé 3×3 : PASS | 146/146 | 135/135 | 148/148 | 148/148 |
| **www APRÈS** | **147/147** | **147/147** | **135/135** | **148/148** | **148/148** |

(Sous WebKit, Image Compressor et Image Converter sont sautés et dits : pas d'OffscreenCanvas dans ce WebKit.)

**Écart du banc, pas du site** : Image Compressor affiche la ligne du JPG dès qu'il est prêt, pendant que le PNG se
compresse encore. Sous charge (3 navigateurs en parallèle), le banc prenait la liste trop tôt, ne téléchargeait que le
JPG, puis la ligne du PNG arrivait, non téléchargée — et le site demandait **à juste titre** avant de quitter. C'est la
cause de l'écart déjà vu une fois en P18. Le banc attend désormais la fin des deux compressions.


## 2. Audio Splitter : un point de coupe utile par défaut, et les parts égales

**Constat** : le point de coupe valait 30 s par défaut, ramené à la fin du fichier : 5,9 s sur 6 s, une part 2 de
0,1 s.

**Concurrents relevés (01/10)** : mp3cut (123apps) et Clideo sont des **découpeurs** (deux poignées début / fin sur tout
le fichier, « Cut ») — pas de mode « scinder ». Les **scindeurs** spécialisés offrent les parts égales : NoteVibes
(2, 3, 4, 5 ou 10 parts égales, repères affichés sur la forme d'onde avant de couper), ChunkAudio (des morceaux de N
secondes), AudioMultiCut (plusieurs points en une passe).

**Fait** : trois modes — **« At one point »** (par défaut, **au milieu du fichier**), **« Equal parts »** (2 à 100),
**« Every N seconds »** (par défaut une minute, ou un dixième du fichier s'il dure moins de deux minutes ; la dernière
part prend le reste). La page **liste avant de couper** où commencent et finissent les parts ; plafond déclaré : 100
parts, 0,1 s minimum chacune (bouton désactivé et phrase au-delà). Même filtre qu'avant pour chaque part (`atrim` à
l'échantillon sur la source), parts numérotées `part01_…` dès 10 parts pour rester dans l'ordre, ZIP dès 2. Textes (description,
mode d'emploi, FAQ « plus de deux parts ? » → oui) réécrits.

**Banc `audio-splitter-modes.mjs`** (WAV de 6 s dont chaque échantillon est différent) : défaut = 3 s ; 2 parts de 3 s ;
4 parts de 1,5 s ; 12 parts de 0,5 s ; toutes les 2,5 s → 2,5 / 2,5 / 1 s ; les parts recollées = la source, **échantillon
pour échantillon** ; noms dans l'ordre.

**Résultats** (`audio-splitter-modes.mjs`, 22 contrôles) : build local, préversion et **www : 22/22 sous Chromium,
Firefox et WebKit**. Non-régression : `cut-join-audit --only=splitter` (coupe à 4 s, 6 formats) identique aux mesures
du 28/09 — WAV, MP3, FLAC, OGG : 0 ms d'écart, parts recollées = 10,000 s ; M4A +17 ms et WMA −0,1 s (trames
fixes, déjà dits dans la FAQ). Les bancs Opus existants (`audio-opus-service`, `audio-opus-real`) gardent le même champ
`#split-at` et les mêmes noms `part1_` / `part2_` pour deux parts.


## 3. Code Formatter : « Éloi » au lieu de « Élodie » (une fois, sous safaridriver)

**Lu dans le code** : aucune mise en forme pendant la frappe (seulement au clic « Format »), aucune transformation du
texte saisi, aucun traitement de composition, aucun effet qui réécrive le champ. Le champ était un `textarea`
**contrôlé** par React : après chaque événement `input`, React réécrit le champ avec son état. **La seule voie de perte
possible** : un caractère qui arrive dans le champ **sans** son événement `input` — l'état de React reste en retard, et
le prochain rendu (ou le clic « Format », qui lisait l'état) perd ce caractère. Une frappe humaine envoie toujours
l'événement ; **le WebDriver de Safari, lui, ne le fait pas toujours avec les champs React** (ticket React #10687,
« Safari only… onChange does not fire… using sendKeys »). Les pertes vues (« di » au milieu, « e » final) ont exactement
cette forme. **Conclusion : artefact de WebDriver**, non reproductible par un humain (18 essais sans perte).

**Corrigé quand même, à la racine** : le champ n'est plus contrôlé — React n'y écrit jamais, et « Format » lit le texte
réellement affiché (c'est aussi le cas des éditeurs CodeMirror / Ace des sites de référence). **Banc
`code-formatter-speed.mjs`** : « {"name":"Élo » tapé, puis la fin posée **sans événement** (ce que fait un événement
WebDriver perdu) → le résultat contient bien « Élodie » et « ville ».

**Résultats** (`code-formatter-speed.mjs`, 8 contrôles) : **sur www avant** : « JSON Parse error: Unterminated
string » — la production d'alors perdait bien la fin du texte dans ce cas (reproduction exacte du défaut du Mac) ;
**après** : 8/8 sous Chromium, Firefox, WebKit, et WebKit en simulation Safari 16.4 (préversion), puis **8/8 ×3 sur
www** ; formatage toujours ≈ 0,5-0,7 s.


## 4. Inventaire du travail local jamais poussé (demandé en cours de chantier)

`git log --branches --not --remotes` (toutes les branches locales) : **vide — aucun commit local jamais poussé.**
Les 18 branches locales sans suivi distant (`croissance-29-09`, `qualite-2-29-09`, `safari-iphone-30-09`,
`prelancement-01-10`…) ont toutes leur pointe déjà contenue dans une branche distante (vérifié branche par branche avec `git branch -r --contains` : les 34 branches locales sont toutes sur le dépôt distant).
`git stash list` : vide.

Fichiers modifiés non commités au début du chantier : **aucun**. Deux fichiers **non suivis** :

| Élément | Ce que c'est | Décision |
|---|---|---|
| `.serena/` (25/09) | configuration et cache de l'outil Serena (serveur MCP d'analyse de code : `project.yml`, cache TypeScript, dossier `memories` vide) — outil local de l'assistant, pas du site | **non déployé**, laissé en place, rien effacé |
| `pip.log` (29/09, 185 octets) | notice de pip « A new release of pip is available » (environnement Python local des bancs) | **non déployé**, laissé en place, rien effacé |
| worktree `…/jobs/b5f767df/tmp/wt` (branche `service-coupe-precise`, `8123f0c0`) | copie de travail d'une session précédente, **propre** ; sa pointe est dans `origin/master` | rien à déployer, laissée en place |

Rien de douteux n'entre donc dans le déploiement : P19 ne contient que le travail décrit ici.

## 5. Déploiement

- Repère **`restauration-avant-p19-01-10`** = `2ecb91a7` (master avant P19), **poussé**. Branche `p19-01-10` créée
  avant le premier commit.
- **Préversion** `onlineconvertools-gregicef4` (branche `preview/p19-01-10` = `9fe36c4c`), relais local à jeton OIDC en
  mémoire (`vercel env run` depuis un dossier temporaire ; aucun fichier d'environnement lu) :

| Banc | Chromium | Firefox | WebKit |
|---|---|---|---|
| `download-guard --service` | 145/146 → écart du banc (§1), 3×3 PASS après correction | 146/146 | 135/135 |
| `download-guard --device=iphone` / `ipad` | | | 148/148 · 148/148 |
| `audio-splitter-modes` | 22/22 | 22/22 | 22/22 |
| `code-formatter-speed` | 8/8 | 8/8 | 8/8, et 8/8 en simulation Safari 16.4 |
| `prelancement-01-10` | 64/64 | 64/64 | 64/64 |
| `all-pages-load` (238 pages) | 238/238 | 238/238 | 238/238 |

- **Fusion** `git merge --no-ff` → **`f7569b1d`**, poussée normale (aucune poussée forcée) ; production
  **`onlineconvertools-1boluf4vi`**, Ready ; « Every N seconds » servi sur www (preuve que le nouveau code est en ligne).
- **Sur www** : `download-guard --service` 147/147 · 147/147 · 135/135 ; iPhone 148/148, iPad 148/148 ;
  `audio-splitter-modes` 22/22 ×3 ; `code-formatter-speed` 8/8 ×3 ; **238 pages propres ×3 moteurs**. **Aucun échec :
  pas de retour arrière.**
- **Retour arrière (si un jour nécessaire)** : `git revert -m 1 f7569b1d` poussé normalement, ou `vercel promote` de
  `onlineconvertools-78ysb2kft` (production P18).

**Commits de production** : `fbc6ab22` (confirmation avant de quitter), `dd17f617` (Audio Splitter), `9fe36c4c` (Code
Formatter), `373d9742` (bancs), fusion `f7569b1d`.


## 6. AI Detector sur www (Pangram)

**Première décision (19 h 56)** : non lancé, l'heure n'était pas passée à 20 h 05. **Puis, à la demande du propriétaire
(« il est passé 20 h 05 »)**, lancé à **20 h 11** (00 h 11 UTC) : `node scripts/ai-detector/www-check-p17.mjs`, code de
sortie 0.

| Texte | Attendu | Obtenu |
|---|---|---|
| Résumé LIGO 2016 (humain ; dit « IA » par l'ancienne version RAIDAR avant P17) | humain | **humain** — AI-written 0 %, AI-assisted 0 %, Human 100 % (224 mots) |
| `ai-opus-1` (texte d'IA) | IA | **IA** — AI-written 100 %, AI-assisted 0 %, Human 0 % (180 mots) |

**RESULT: both verdicts right.** Dépense : ≈ 0,25 $ de crédits Pangram, celle notifiée et autorisée. La ligne 2 du
tableau de tête du plan est close.

## 7. À repasser sur le Mac et l'iPhone

Sur le banc Safari du Mac (`tests-safari-scripts`) puis l'iPhone :
1. **Quitter sans télécharger** sur QR Generator, JSON Formatter (après « Format ») et Hash Generator (fichiers) : Safari
   doit demander. Puis : télécharger **un seul** format du QR → plus de question ; JSON Formatter → « Copy » → plus de
   question (la ligne affiche « Copied ✓ »).
2. **Audio Splitter** : un fichier de 6 s → point à 3,0 s par défaut ; « Equal parts » 4 → 4 parts de 1,5 s ;
   « Every N seconds » → la liste des parts s'affiche avant « Split Audio ».
3. **Code Formatter** : taper « Élodie à Montréal, ville » dans un JSON et formater. Si le banc perd encore un
   caractère, c'est qu'il n'arrive pas dans le champ lui-même (le champ n'est plus réécrit par React) : relever alors le
   contenu du champ AVANT le clic.
Le reste de la liste de `RAPPORT-p18-01-10.md` §9 (iPhone : « Save / Share », photos 24/48 Mpx, etc.) reste valable.

## 8. Fin de chantier

- Plan mis à jour (tableau de tête lignes 4 et 5, bloquant 9, ligne P19).
- Branche de préversion `preview/p19-01-10` **supprimée** du dépôt distant après vérification que sa pointe
  (`9fe36c4c`) est dans master.
- Processus arrêtés : serveur local `next start` (3100), relais de préversion (3200) ; aucun processus node restant.
- Rien effacé d'autre : `.serena/`, `pip.log`, le worktree `service-coupe-precise` et les branches locales restent en place.
