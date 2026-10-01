# RAPPORT — P20 : le cœur du site à 100 % — promesses exactes, « 13 Languages », Whitespace Remover, instructions = boutons réels (01/10)

Travail seul, à la demande du propriétaire (chantier et mise en production demandés). **Aucune poussée forcée.** Aucun
secret lu ni affiché (préversion lue par le relais habituel, jeton OIDC en mémoire). Aucun outil supprimé ni renommé.
Aucune dépense. Supabase, Railway et les variables d'environnement non touchés. Les extras (texte pour Google, données
structurées, outils liés, page Sécurité, réseaux sociaux) n'ont pas été touchés.

## En bref

| Point | Résultat |
|---|---|
| 1 — Promesses fausses | **plus de 50 phrases fausses ou trompeuses corrigées** (accueil « No data stored » / « Always free », 14 métadonnées de résultats de recherche décrivant l'ancien moteur dans le navigateur, dictée « entièrement locale », ConvertAPI présenté comme « notre service », « no usage limits » sur des outils limités, « no account for most tools »…). Banc **`privacy-claims.mjs`** : **54 échecs sur master, 0 après** ; réviseur indépendant : 7 problèmes de plus trouvés, tous corrigés |
| 2 — « 13 LANGUAGES » | le visiteur obtient une **traduction automatique Google dans la page** (12 langues + anglais, aucune URL traduite, aucun hreflang) : « 13 Languages **via Google Translate** », menu : « Machine translation by Google: the page's text is sent to Google ». Internationalisation **non lancée** |
| 3 — Whitespace Remover | « Remove All Extra » **ne fusionne plus les lignes** (espaces/tabulations ramenés à un, lignes rognées, séries de lignes vides ramenées à une) ; l'ancienne fusion existe toujours, sous un nom qui la dit : **« Join Into One Line »** ; espaces insécables traités |
| 4 — Instructions | Merge PDF : **on peut glisser** une ligne (souris) **et** utiliser les flèches, textes accordés ; **≈ 95 pages disaient « Click or drop … here » sans aucun dépôt possible** (le navigateur ouvrait le fichier à la place de la page) → `FileDropBridge`, une règle pour tout le site ; 21 pages citaient d'anciens boutons « Download PNG / GIF / Signed PDF… » → « Download ». Banc **`instructions.mjs`** : **24 écarts sur master, 0 après** (642 libellés vérifiés sur 225 pages) |
| 5 — Déploiement | repère `restauration-avant-p20-01-10` = `a8071df1` ; préversion `onlineconvertools-2aczsksdf` verte ; fusion **`38a6a7b9`** (sans poussée forcée) ; production **`onlineconvertools-1n8j383tq`** ; **tout vert sur www, aucun retour arrière** |

## 0. Point de départ noté au plan

- **Passe Safari 17.6 RÉELLE du MacBook après P19 : 67/68 réussies, 0 échec réel, 1 non testé (payant).** Question
  avant de quitter, Audio Splitter et Code Formatter confirmés. La perte de lettres du 30/09 était un **artefact du banc
  Mac** (touche Cmd restée enfoncée), pas un défaut du site.
- **Passe iPhone P15–P19** : fiche et kit prêts, en attente du propriétaire.
- **`claude/decision-internationalisation.md` n'existe pas dans le dépôt** (ni dans l'historique Git) ; le plan le
  cite et classe l'internationalisation « GELÉE — trafic organique réel ». Rien n'a été lancé.

## 1. Promesses de confidentialité et de gratuité

### Méthode
1. **Inventaire** (`scripts/content-checks/claims-inventory.mjs`) : tout le texte du site (JSX et chaînes, métadonnées
   comprises), découpé en phrases, filtré sur six familles — local (« in your browser », « never uploaded »…),
   stockage, gratuité, limites, filigrane, inscription : **2 122 phrases dans 476 fichiers**.
2. **Comportement réel lu dans le code**, pas dans les mots : un outil « envoie » s'il appelle une route de traitement
   (`/api/ai*`, `convert-*`, `pdf-*`, `remove-bg`, `image-upscale`, `media/ticket`), le service média
   (`runMediaJob`, envoi par morceaux), les aides Office / transcription, l'encodeur Opus, ou les coquilles
   `MediaServiceTool` / `GifFromVideoTool` — **52 outils** ; plus la reconnaissance vocale du navigateur (voir
   ci-dessous). Croisé avec `/privacy` §2 et `lib/providers/convertApi.js`, les quotas (`lib/quota/guard.js` 30/h et
   100/jour par IP, `imageGen.js` 5 images/jour, `aiDetect.js` 2 000 mots/jour, `media/ticket` heure + jour).
3. **Concurrents relevés le 01/10** :
   - **Squoosh** (100 % local) : « Images never leave your device since Squoosh does all the work locally » — une
     promesse sur **le fichier**, pas « rien n'est envoyé » (Squoosh utilise Google Analytics).
   - **Smallpdf** (serveur) : « Your PDFs are encrypted using TLS and automatically deleted from our servers after one
     hour » ; « free » partout alors que l'offre gratuite est limitée.
   - **iLovePDF** (serveur) : « automatically and permanently deleted within two hours of being processed ».
   - **Décision** : chaque outil dit **où va le fichier** (navigateur / nos serveurs / quel fournisseur nommé), **quand
     il est supprimé** (« deleted after download, or after 15 minutes at most » sur nos serveurs — le délai du service
     média est 900 s), et **quelle limite** s'applique ; une promesse locale porte sur le fichier (« your file isn't
     uploaded »), jamais sur « rien n'est envoyé ».

### Ce qui était faux (et ce qui est désormais affiché)

| Où | Avant | Pourquoi c'était faux | Après |
|---|---|---|---|
| Accueil, bandeau du bas | « Works in your browser · **No data stored** · **Always free** » | 52 outils passent par un serveur ; une offre payante est prévue au plan | « Most tools run in your browser · Files sent to our servers are deleted after processing (lien /privacy) · Free, no sign-up » |
| Métadonnées (résultats Google) de **Video Compressor / Converter / Filter / Merger / Resizer** | « re-records … MediaRecorder, entirely client-side. Output is always WebM » ; « Re-encode Your Video to Webm » | passés sur le service ffmpeg le 20/09, sortie MP4 | description du traitement réel sur notre serveur ; titres « Convert Video to MP4, MOV, GIF, MP3 & More », « Join Videos Into One MP4 », « Resize a Video » |
| Métadonnées **Audio Booster / Compressor / Converter / Merger / Splitter** | « entirely in your browser — nothing is uploaded » | la sortie Opus est encodée sur notre serveur ; Splitter « two parts at a single point » (3 modes depuis P19) | exception Opus dite ; modes du Splitter |
| **EPUB / MOBI to PDF** (métadonnées + description) | « parses … in your browser » seul | le contenu extrait part chez notre service de conversion | dit dans la même phrase |
| **HTML to PDF** | sous-titre « in your browser » ; FAQ « no signup or usage limits » | rendu par Gotenberg ; limites horaire/jour par connexion | « with a real browser engine » ; limite dite |
| **Audio to Text** | dictée au micro « entirely local », « isn't uploaded anywhere » | Chrome / Edge / Safari envoient l'enregistrement au service vocal de leur éditeur (Web Speech API, sans `processLocally`) | dit sur la page **et** dans /privacy (« Sent by your browser, not by us ») |
| **Word to PDF (.docx), PDF to Word** | « our conversion service » | c'est **ConvertAPI**, un fournisseur tiers | ConvertAPI nommé, stockage désactivé ; .doc = notre serveur LibreOffice |
| **AI Image Upscaler** + /privacy | « with WebGPU … never uploaded / nothing is sent » | serveur aussi pour la transparence, un résultat trop grand, une carte graphique en échec | « usually … the page always shows which » |
| **Screen Recorder** | « entirely client-side » ; « No, recording happens entirely in your browser. » | la copie MP4 (Firefox) passe par le service vidéo | exception dans la même phrase |
| **Keyword / Data Extractor** | « there's no file upload » | le texte part chez OpenAI | « no file picker ; the text you paste is sent to OpenAI » |
| **PDF Repair / PDF/A** | « Unlike almost every other tool on this site » | 52 outils serveur | « Like the other server tools named in our privacy policy » |
| **Audio Converter** | « no limit on how many files you can convert » | l'Opus passe par le service média, limité | sans limite dans le navigateur ; Opus : limite par connexion |
| Catégorie **PDF** | « handles all your document management needs instantly in your browser » ; « our servers » pour les conversions | compress / Office / repair sur serveur ; ConvertAPI ; OpenAI pour AI Summary / Translate | qui reçoit quoi, suppression sous 15 min au plus |
| Catégorie **Developer** | « processed locally … or on secure servers with encryption » | aucun outil développeur n'envoie (sauf API Tester, vers l'adresse tapée) | dit tel quel |
| Catégorie **AI** | « No account is required for **most** tools » ; « code assistance » ; « 100 % free … any of its features » | aucun outil n'exige de compte ; pas d'outil de code ; limites horaire/jour | « No tool requires an account » ; liste réelle ; limites dites (2 000 mots, 5 images) |
| Catégories **Converter / File / PDF / Developer** | « no premium features required for **basic** conversions » | sous-entend une offre payante qui n'existe pas | « Every … Tool is free » (+ limite des outils serveur pour PDF et vidéo) |
| Catégorie **Audio** | transcription « processed in memory, never stored » ; « completely accessible and anonymous » | > 4 Mo transitent par notre stockage ; OpenAI ; Analytics | OpenAI nommé, dictée dite ; « anonymous » retiré |
| 15 FAQ des outils IA | « free … no signup or subscription required » | vrai, mais muet sur la limite horaire et quotidienne | limite dite |
| /privacy | Google Translate « loaded only after that choice » | chargé à l'ouverture du menu ; le texte affiché (résultats compris) part chez Google | dit ; le menu le dit aussi |
| Inscription / connexion | « Join thousands of users today » ; « Sign in … to access your free … tools » | chiffre non vérifié (trafic réel ≈ 0) ; sous-entend un compte nécessaire | « Optional — every tool works without an account » |
| 11 FAQ d'outils locaux | « nothing is sent to a server » | trop large (rapport d'échec anonyme, statistiques) | « what you enter / your file is never sent to a server » (formulation de Squoosh) |

Vérifié **juste** et laissé : « free » (aucun paiement nulle part), « no watermark » (aucun outil n'en ajoute),
« no signup » (aucun outil n'exige de compte, /privacy le dit), les pages des outils GIF vidéo, Opus, Video
Merger/Trimmer/Rotator, PDF Compress, AI Summary / Translate, Currency Converter, API Tester ; rapports d'échec sans
fichier ni nom (`app/lib/reportError.js`) ; ConvertAPI appelé avec `StoreFile=false`.

### Bancs
- **`scripts/content-checks/privacy-claims.mjs`** (dans `npm run build`) : échoue si une page d'outil serveur ou ses
  métadonnées affirment sans réserve, dans la même phrase, que le travail est local / rien n'est envoyé ; si un outil
  serveur promet « no limits » ; si un outil ConvertAPI ne nomme pas ConvertAPI ; si une surface du site (accueil,
  catégories, About, métadonnées racine) fait une promesse absolue ; si un outil serveur n'est pas nommé dans /privacy ;
  si Google Translate n'est pas divulgué. Exceptions vraies listées une par une avec leur raison (messages affichés
  seulement sur le chemin local, etc.). **master : 54 échecs ; P20 : 0.**
- **Réviseur indépendant** (lecture seule) : 7 problèmes confirmés de plus (ConvertAPI « notre service », catégorie
  PDF incomplète, Upscaler, OpenAI pour la transcription, Google Translate, HTML to PDF « no usage limits », « Unlike
  almost every other tool ») et un banc trop indulgent (un nom de format « Opus » dans une liste suffisait comme
  réserve). **Tout corrigé, banc resserré** (les mots « but / then / while », un nom de format ou « extract » ne
  suffisent plus) et étendu (limites, fournisseur nommé, Google Translate).

## 2. « 13 LANGUAGES »

**Ce que le visiteur obtient (vérifié sur www, 01/10)** : le menu propose 13 langues ; en choisir une charge le script
Google Translate, qui **traduit la page sur place** (`<html class="translated-ltr">`, même URL, ex. Merge PDF →
« Fusionner des PDF »). **Aucune version traduite pour Google** : 0 `hreflang`, `lang="en-US"`. Le chiffre « 13 » est
juste (anglais + 12), le mot « Languages » seul laissait croire à un site traduit.
**Fait** : la carte de l'accueil dit « 13 Languages **via Google Translate** » ; le menu (ordinateur et mobile) dit
« Machine translation by Google: the page's text is sent to Google ». L'internationalisation reste une décision du
propriétaire (plan : GELÉE).

## 3. Whitespace Remover

**Concurrents (01/10)** : *charactercalculator.com* — « Remove extra spaces » laisse les sauts de ligne, la fusion
s'appelle « Remove all whitespaces » ; *convertiful.com* — fusion = « Flatten Text (Remove Line Breaks) » ;
*removespaces.org* et *openl.io* — les deux modes « preserve line breaks ». **Règle du marché : un mode « extra »
garde les lignes, le mode qui fusionne le dit dans son nom.**
**Fait** (`app/lib/textTools.js`, test `scripts/text-tests/02-whitespace.mjs`) :
- **Remove All Extra** : espaces / tabulations / espaces insécables ramenés à un, chaque ligne rognée, **séries de
  lignes vides ramenées à une** (les paragraphes restent séparés), lignes vides de début et de fin retirées — **aucune
  ligne de texte retirée ni jointe** ;
- **Remove Extra Spaces** : pareil dans les lignes, **toutes les lignes gardées** (vides comprises) ;
- **Remove Leading / Remove Trailing** : un seul côté de chaque ligne ;
- **Join Into One Line** (nouveau nom de l'ancienne fusion) : tout sur une ligne.
Textes, FAQ (« Will it merge my lines? ») et métadonnées réécrits.

## 4. Instructions = boutons réels

- **Merge PDF** : les étapes disaient « flèches », les astuces « glisser ». iLovePDF et Smallpdf réordonnent en
  glissant → **glisser une ligne marche désormais** (souris, HTML5) ; les flèches ↑ ↓ restent pour le tactile et le
  clavier (libellés accessibles « Move a.pdf up »…). Étape : « drag a file to its new place, or use the ↑ and ↓
  arrows » ; astuce : « On a phone or tablet, use the arrows ».
- **Trouvé par le contrôle : « Click or drop … here » sur ≈ 95 pages sans aucun gestionnaire de dépôt** — un fichier
  déposé était ouvert par le navigateur à la place de la page (le visiteur quittait le site). Les zones de dépôt de
  tous les concurrents acceptent un dépôt. **`app/components/FileDropBridge.jsx`** (monté une fois dans le layout,
  comme `IosDownloadBridge`) : le fichier déposé va au champ de fichier de la zone (même évènement `change` que le
  sélecteur, donc les contrôles de chaque outil s'exécutent), avec le filtre `accept` appliqué comme le sélecteur et
  un message si le type n'est pas pris ; un seul fichier pour un champ sans `multiple` ; les pages qui gèrent déjà le
  dépôt (8) ne sont pas touchées.
- **21 pages** citaient des boutons qui n'existent plus depuis le bouton commun de P18 (« Download PNG », « Download
  GIF », « Download Signed PDF », « Download Page N », « Download all (ZIP) »…) → « Download » / « Download all ».
- **Contrôle `scripts/content-checks/instructions.mjs`** (dans `npm run build`) : pour chaque page d'outil, tout
  libellé cité dans les étapes / astuces / FAQ (entre guillemets, après « click / tap / press », « the X button / option
  / field… ») doit exister dans la page ou ses composants ; gestes vérifiés dans le code : glisser pour réordonner,
  flèches, curseur, case, liste déroulante, double-clic, clic droit, dépôt de fichier (texte de la zone compris).
  Exceptions motivées une par une (`instructions-allow.mjs` : exemples à taper, menu de Word, sélecteur d'écran de
  Chrome…). **master : 24 écarts ; P20 : 0 (642 libellés, 225 pages).**

## 5. Bancs

| Banc | master / www avant | local | préversion `2aczsksdf` | **www après** |
|---|---|---|---|
| `privacy-claims.mjs` | **54 échecs** | 0 | — | (statique) |
| `instructions.mjs` | **24 écarts** | 0 | — | (statique) |
| `text-tests/02-whitespace.mjs` | (ancienne logique : une seule ligne) | 4/4 | — | — |
| `p20-01-10.mjs` (25 contrôles) | **www : rouge** (Whitespace : 2 FAIL puis arrêt sur « Join Into One Line » absent ; Merge : pas de glisser ; dépôt : aucun ; accueil 5 FAIL ; dictée 2 FAIL) | Chromium 25/25, Firefox 25/25, WebKit 25/25, iPhone 24/24, iPad 24/24 | **25/25 ×3 moteurs, iPhone 24/24, iPad 24/24** | **25/25 ×3, iPhone 24/24, iPad 24/24** |
| `download-guard.mjs` | | Chromium 142, Firefox 142, WebKit 130, iPhone 148, iPad 148 : ALL PASS | **142 / 142 / 130, iPhone 148, iPad 148 : ALL PASS** | **142 / 142 / 130, iPhone 148, iPad 148 : ALL PASS** |
| `prelancement-01-10.mjs` | | Chromium, Firefox : ALL PASS | **ALL PASS ×3** | **ALL PASS ×3** |
| `all-pages-load.mjs` (238 pages) | | 238/238 Chromium, WebKit | **238/238 ×3** (WebKit avec `--no-vercel-toolbar` : la barre de commentaires de Vercel, propre aux préversions, lève `navigator.storage.persisted` sous WebKit — artefact déjà connu) | **238/238 ×3** |
| `text-tools.mjs` | | all passed | all passed | all passed |

Deux fois, sous charge (5 navigateurs en parallèle), le banc p20 a vu une erreur de page isolée en simulation
iPhone / iPad (une requête `blob:` interrompue par la navigation suivante du banc) ; relancé seul : vert (2/2 et 1/1).

## 6. Déploiement

- Repère **`restauration-avant-p20-01-10`** = `a8071df1` (master avant P20), **poussé** ; branche `p20-01-10` créée
  avant le premier commit.
- Préversion `onlineconvertools-2aczsksdf` (branche `preview/p20-01-10` = `58bae605`) : verte (§5).
- **Fusion** `git merge --no-ff` → **`38a6a7b9`**, poussée normale (aucune poussée forcée) ; production
  `onlineconvertools-1n8j383tq`.
- **Sur www** (production `onlineconvertools-1n8j383tq` Ready, nouveau texte servi) : p20 25/25 ×3 moteurs, iPhone
  24/24, iPad 24/24 ; download-guard 142 / 142 / 130, iPhone 148, iPad 148 ; prelancement ALL PASS ×3 ; 238 pages
  propres ×3 ; text-tools vert ; HTML servi vérifié (métadonnée de Video Compressor, ConvertAPI sur Word to PDF,
  « entirely local » absent d'Audio to Text, divulgation Google Translate dans /privacy). **Aucun retour arrière.**
- **Échecs vus sur www et pourquoi ils n'ont pas déclenché le retour arrière** : en simulation iPhone sous WebKit, le
  premier passage p20 complet a échoué une fois (navigation interrompue) puis 2 fois sur 3 « no page error » (« Fetch
  API cannot load blob: … due to access control checks »), et prelancement a planté 2 fois (Firefox, WebKit).
  **Cause mesurée** : un script de debug a montré une requête de fichier statique (`_next/static/chunks/005-….js`,
  puis le worker Turbopack) coupée par la couche réseau du WebKit de Playwright sous Windows (« Failed sending data
  to the peer ») ; le site recharge alors la page une fois (règle des fichiers de version manquants,
  `app/lib/chunkError.js`), ce qui annule les requêtes en vol — d'où l'erreur `blob:`. Le même fichier est servi 200
  par curl à chaque essai ; le même code est vert sur la préversion (iPhone comme iPad) ; relancés, la même séquence
  passe 2/2, p20 iPhone 24/24, prelancement ALL PASS ×3. Ce n'est pas un défaut du site déployé (aucun fichier touché
  par P20 n'intervient : Merge PDF → JPG to PNG). Le jugement est écrit ici pour que le propriétaire puisse le contester.
- La production précédente n'a pas pu être rejouée pour comparaison : son adresse de déploiement répond 403 au relais
  de préversion (protection des déploiements de production) — sans conséquence sur le diagnostic ci-dessus.
- **Retour arrière autorisé d'avance** : promotion de `onlineconvertools-1boluf4vi` (production P19), sans
  reconstruction ni Git.

**Commits** : `89fd5c05` (Whitespace Remover), `31c4db4e` (« 13 Languages »), `1747e033` (instructions, dépôt de
fichier, Merge PDF), `9713c5e1` (promesses), `63fd766a`, `6d070de0` (correctif de build, banc p20), `a058baf3` (suites
du réviseur), `58bae605` (banc), fusion `38a6a7b9` ; puis rapport et plan.

## 7. À repasser sur le Mac et l'iPhone

1. **Glisser-déposer un fichier** depuis le Finder sur la zone « Click or drop » de JPG to PNG, PDF Rotate et Video
   Compressor (Safari Mac) : le fichier est pris ; un PNG sur JPG to PNG → message « This tool doesn't take… ».
2. **Merge PDF** : glisser une ligne à la souris (Mac) ; flèches ↑ ↓ (iPhone).
3. **Whitespace Remover** : coller un poème avec lignes vides → « Remove All Extra » garde chaque vers.
4. **Audio to Text, dictée** (Safari) : le texte dit que l'enregistrement part chez Apple.

## 8. Fin de chantier

- Plan mis à jour : tableau de tête ligne 4 (passe Mac 67/68 après P19, artefact Cmd, passe iPhone en attente, liste
  courte P20), bloquant 9 (note P20), ligne P20 de la ligne d'arrivée.
- Branche de préversion `preview/p20-01-10` **supprimée** du dépôt distant après vérification que sa pointe
  (`58bae605`) est dans master.
- Processus arrêtés : serveur local `next start` (3100), relais de préversion (3200) et relais d'essai (3201) ; aucun
  processus node restant.
- Rien effacé d'autre : `.serena/`, `pip.log`, les branches locales restent en place.
- Non fait, hors périmètre : l'internationalisation (décision du propriétaire) ; les extras (texte pour Google, données
  structurées, outils liés, page Sécurité, réseaux sociaux).
