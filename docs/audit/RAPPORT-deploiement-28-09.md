# RAPPORT — Déploiement de la nuit et décisions du 28/09

**Session :** propriétaire présent. **Branche de travail :** `licence-ameliorations`. **Production :** `master` passé de `4d8ed7ff` à `77a47594` (fusion sans push forcé). **Balise de restauration :** `restauration-avant-deploiement-28-09` → `4d8ed7ff` (poussée).

*(rapport complété au fil des étapes — version finale en fin de session)*

## 0. Documents lus, feuille versée

`claude/plan-de-travail.md`, `docs/audit/RAPPORT-nuit-27-09.md`, `claude/tests-manuels-proprietaire.md` lus ; la feuille du bloquant 11 est commitée sur `licence-ameliorations` (`a5fdc576`).

## 1. Déploiement — ✅ en production, vérifié sur www sous les trois moteurs

**Préversion** `onlineconvertools-quv60g2rk` = commit `7d55c8bb` (tête de `deploiement-nuit-28-09`), ouverte par un relais local (`vercel-preview-proxy.mjs`, jeton de `vercel env run` dans un dossier temporaire ne contenant que `.vercel/project.json` — jamais affiché, aucun fichier d'environnement lu). **Toutes les suites de la nuit** relancées dessus, puis **les mêmes sur www** après la fusion :

| Suite | Préversion | www (production) |
|---|---|---|
| Chargement des **238 pages** (accueil, 12 catégories, 225 outils) | Chromium 238/238, Firefox 238/238, WebKit 238/238 ¹ | **Chromium, Firefox, WebKit : 238/238 propres** |
| Grammar Fixer mot à mot (IA jouée) | 11/11 · 10/10 | 11/11 · 10/10 |
| Audio / Video Metadata (ffprobe) | 9/9 ×3 moteurs | 9/9 ×3 |
| Décodage de secours (Waveform, Equalizer) | 4/4 ×2 | 4/4 ×2 |
| Formats illisibles (Media Player, Screenshot) | 4 · 4 · 3 | 4 · 4 · 3 |
| Audio Trimmer sans aperçu | 12/12 ×3 | 12/12 ×3 |
| Video Trimmer sans aperçu | 6/6 ×3 | 6/6 ×3 |
| Video Trimmer coupe précise | 2/2 ×2 | 2/2 ×2 |
| 4 outils MediaRecorder + Screen Recorder | 42/42 Chromium · Firefox 36/37 puis 12/12 ×2 ² | 42/42 · 42/42 |
| Service joué (Compressor, Converter, GIF, Upscaler) | 11/11 ×3 | 11/11 ×3 |
| Opus par le service (joué) | 8/8 ×2 | 8/8 ×2 |
| Amélioration 17 | 20 · 18 · 17 | 20 · 18 · 17 |
| Vague 1 | 12/12 ×2 | 12/12 ×2 |
| Image Resizer | 2/2 ×3 | 2/2 ×3 |
| Zip Extractor | 21 · 20 ³ · 20 | 21 · 20 · 20 |
| ZIP en flux > 1,9 Go (2,2 Go, octets identiques) | Firefox 6/6, WebKit 6/6 | 6/6 · 6/6 |
| Coupes et jonctions (mesures) | identiques à la nuit | identiques (Splitter 0 ms WAV/MP3/FLAC/OGG, M4A +17 ms) |
| WebKit, reste de la feuille Safari | 6/6 | 6/6 |

¹ **WebKit sur préversion : 238 pages en erreur au premier passage** — `TypeError … navigator.storage.persisted`. Cause établie : **la barre de commentaires que Vercel injecte sur les préversions** (`vercel.live/_next-live/feedback/feedback.html`, pile d'appel relevée) ; bloquée (option `--no-vercel-toolbar` ajoutée à `all-pages-load.mjs`, qui ne bloque que `vercel.live`), **238/238 propres** ; absente de www, où WebKit est propre sans aucun filtrage. **Cela tranche aussi l'erreur non identifiée du 22/09** (bloquant 9) : elle ne vient pas du site.
² Video Resizer sous Firefox : un échec (« produced a file ») au premier passage, sous forte charge (deux files de suites en parallèle) ; **12/12 deux fois de suite** en relance seule, 42/42 sur www.
³ Zip Extractor sous Firefox : dépassement de délai au premier passage sous la même charge ; **20/20** en relance seule, 20/20 sur www.

Rien n'a échoué deux fois ; **aucun point retiré du lot.** Seul changement de la branche avant fusion : un commit de test (`98abfeeb`, `MOCK_SERVICE_URL` pour jouer le service sur une préversion déployée), sans effet sur le site.

**Fusion :** `deploiement-nuit-28-09` → `master` en `77a47594` (`--no-ff`, sans push forcé) ; `lib/ai` et `app/api/ai` identiques à `4d8ed7ff` (le correcteur de grammaire reste celui de la production). Déploiement de production `onlineconvertools-3x4zzpire`, **READY à 17:03 UTC**. **Retour arrière :** `git revert -m 1 77a47594` (ou la balise).

## 2. Limite du service média — ✅ 40/h appliquée, vérifiée sur www

`MEDIA_JOBS_PER_HOUR_PER_IP` : **20 → 40**, une seule variable Vercel (type « plain », cibles Production + Preview), modifiée par l'API Vercel (valeur de limite seulement, aucune autre valeur affichée). `MEDIA_JOBS_PER_DAY_PER_IP` **inchangée : 60**. La valeur est entrée en production avec le déploiement de `77a47594`.
**Preuve sur www (17:06 UTC) :** 40 billets `POST /api/media/ticket` accordés dans l'heure, **le 41ᵉ refusé** (429, « Too many conversions from your connection this hour », `Retry-After` 3201 s). Effet de bord assumé : ces 40 billets comptent aussi dans les 60 du jour pour ma connexion (jusqu'à minuit UTC) ; aucun travail n'a été lancé avec (billets inutilisés, expirés seuls).

## 3. Grammaire — mesure terminée, **rien mis en production**

**Limite relevée sur Preview SEULEMENT, puis remise à l'identique.** `IP_RATE_LIMIT_PER_DAY` était une seule variable chiffrée couvrant Production + Preview : sa cible a été restreinte à Production (valeur jamais lue ni modifiée), une variable Preview seule a été créée à **190** (= 100 déjà consommés le 27/09 UTC par ma connexion + ≈ 80 appels prévus + 10 de marge), deux préversions ont été construites avec (`hu72bcrr4` = consigne minimale + T0, `licence-ameliorations` ; `fd7g34cq7` = correcteur de production, `deploiement-nuit-28-09`). **Fin de mesure (18:57 UTC) :** variable Preview supprimée, la variable d'origine (même identifiant `PYXIj…`) couvre de nouveau Production + Preview — état d'avant, relu. `IP_RATE_LIMIT_PER_HOUR` (30) jamais touchée : les appels ont été étalés sur trois heures UTC (27 + 27 + 26). *Reste de cette fenêtre : les préversions construites entre 16 h 16 et 18 h 57 UTC gardent 190/jour (protégées par l'authentification Vercel) ; les suivantes reprennent la valeur d'origine.*

**Appels : 80** (T0 : 1er passage terminé 14 + anglais 4, 2e passage complet 27 + anglais 4 ; production : 27 + anglais 4), **≈ 0,04 $** (au tarif observé la nuit : 15 appels ≈ 0,008 $), **sous le plafond de 0,10 $**. LanguageTool non rappelé. Protocole identique à la nuit (`bench.mjs --no-lt`, mêmes corpus ; `grammar-vs-languagetool.mjs` pour l'anglais). Résultats (chiffres seuls, sans les phrases des corpus) : `docs/audit/grammaire-multilingue/results-t0-run1-ja-ar-hi-tr.json`, `results-t0-run2-*.json`, `results-prod2-*.json` ; tableau : `node docs/audit/grammaire-multilingue/compare-t0.mjs`.

| Langue | Production 1 (26-27/09) | **Production 2 (28/09)** | **T0 n° 1** | **T0 n° 2** | LanguageTool | **Verdict (condition : au moins aussi bien que la production dans chaque langue)** |
|---|---|---|---|---|---|---|
| en | 25/25 | **25/25**, texte juste intact | **25/25**, intact | **25/25**, intact | 15/25 | ✅ **égal** |
| pt | 29/3 | 29/4 | 29/3 | 29/3 | 10/10 | ✅ **au moins aussi bien** (égal) |
| de | 10/11 | 16/7 | 17/2 | 16/5 | 5/12 | ✅ **mieux** |
| ja | 7/25 | 12/18 | 19/7 | 19/7 | 0/0 | ✅ **mieux** que la production ; LT ne corrige rien (0/0) |
| zh | 1/24 | 0/23 | 3/12 | 3/11 | 0/1 | ✅ **mieux** que la production ; empirées encore 11-12 (LT : 1, il ne corrige presque rien) |
| tr | 12/25 | 11/25 | 12/14 | 12/16 | — | ✅ **mieux** ; reste faible (14-16 empirées sur 40) |
| hi | 1/33 | 2/33 | 2/32 | 2/32 | — | ✅ égal — **mauvais des deux côtés** (32-33 empirées sur 40) |
| it | 8/13 | 10/11 | 9/5 | 9/5 | 3/7 | 🟡 **dans l'écart de la production** : exactes 9 (production 8 puis 10), empirées **5 contre 11-13** |
| es | 13/12 | 11/15 | 11/9 | 11/9 | 3/7 | 🟡 **dans l'écart de la production** : exactes 11 (production 13 puis 11), empirées **9 contre 12-15** |
| ar | 5/15 | 7/14 | 6/4 | 6/4 | 0/20 | 🟡 **dans l'écart de la production** : exactes 6 (production 5 puis 7), empirées **4 contre 14-15** |
| ru | 15/14 | 16/16 | 14/8 | 14/8 | 12/2 | ❌ **strictement non** : exactes **14 contre 15 et 16** ; empirées **8 contre 14-16** |

*(exactes / empirées, sur 40 phrases ; « empirée » = plus loin de la correction de référence qu'avant.)*

**Lecture.** À température 0 les deux passages sont presque identiques (la part de hasard qui brouillait la nuit est levée), et la production varie d'un passage à l'autre de 1 à 5 phrases exactes (it 8→10, es 13→11, de 10→16, ja 7→12) : le 3e passage prévu a mesuré cette marge. **« Minimale + T0 » fait moins de phrases empirées que la production dans 9 langues sur 10** (égal en portugais) et au moins autant de phrases exactes que le meilleur passage de la production dans 6 des 10 (plus l'anglais, égal) ; en italien, espagnol et arabe l'écart d'exactes (−1 à −2) reste dans la variation propre de la production. **Le russe est la seule langue où la condition stricte échoue** (−1/−2 exactes), alors que ses phrases empirées y sont divisées par deux. Face à LanguageTool, nous restons en dessous sur les empirées en russe (8 contre 2), espagnol (9 contre 7), chinois et japonais (où LanguageTool ne corrige presque rien) ; hindi et turc restent mauvais sans point de comparaison.
**Ma recommandation (rien fait) :** mettre « minimale + T0 » en production — la condition est tenue ou dans la marge de la production partout sauf en russe, où elle échoue d'une ou deux phrases exactes pour deux fois moins de phrases abîmées — avec l'avertissement W sur russe, chinois, japonais, hindi et turc. **À toi de trancher**, notamment sur le russe.

## 4. Bloquant 11 — les sept tests, automatisés et exécutés

Bancs : `scripts/browser-tests/b11-tests-proprietaire.mjs` (tests 1-6 ; chaque fichier téléchargé rouvert par sharp, ffmpeg, xlsx, pdf.js) et `b11-test7-crash.mjs` (test 7, refuse de tourner sur www). **Exécutés sur www (production, `77a47594`) sous Chromium et Firefox** (test 2 : Chromium), après une première passe sur la préversion ; **test 7 sur la préversion `fd7g34cq7`** seulement.

**Fichiers.** **C a été produit par le vrai Excel de ce poste** (Microsoft Excel 16, COM) : classeur saisi puis *Enregistrer sous* **« CSV » en mode local** (le format que l'Excel français appelle « CSV (séparateur : point-virgule) », Windows-1252) **et** « CSV UTF-8 » (avec BOM). Ce poste est en anglais (Windows en-CA, séparateurs « , » et « . ») : **sans toucher aux paramètres régionaux de Windows**, j'ai réglé les séparateurs **propres à Excel** (décimale « , », milliers espace fine) le temps de l'export, puis rétabli (relu : « séparateurs système » de nouveau actifs). Excel a alors écrit de lui-même les points-virgules. **Limite honnête :** les formats numériques personnalisés (`# ##0,00`) se rendent faux dans ce mélange de réglages ; le fichier C utilise donc le format « Standard » (ce qu'Excel FR écrit pour des nombres saisis sans mise en forme : `12,5`, `1234,5`). Contenu : accents, `;` dans un champ entre guillemets, `""` échappés, virgule dans un nom (`Pâtes, fusilli`), dates `28/09/2026`. — **A/B** : je n'ai pas de vidéo de téléphone ; **mires H.264/AAC synthétiques** (1920×1080, 1080×1920, et 1920×1080 **avec matrice de rotation 90°**, comme l'enregistre un iPhone), plus, pour le test 2, les mêmes formes en gris uni (sur une mire animée, le texte blanc ne se distingue pas de ce qui bouge). **D** : MP3 44,1 kHz stéréo (440 Hz à gauche, 660 Hz à droite) et WAV 48 kHz mono 16 bits (1 000 Hz), deux sources distinctes. **E** : `.doc`, `.ppt`, `.ods` produits par LibreOffice depuis le corpus de fidélité. **F** : page française scannée fabriquée (image seule, 300 dpi, légèrement tournée, bruit de papier, JPEG).

| Test | Verdict | Preuve |
|---|---|---|
| **1. video-screenshot PNG puis JPG** (lecture puis pause) | ✅ **PASS** Chromium + Firefox, A, B, B-rot | même taille que la vidéo, JPG non noir (luminance 127,8 = PNG), JPG = PNG (PSNR 32,7-47,6 dB), PNG = l'image affichée (meilleure image ffmpeg à 0 ou ±1 image) ; portrait par matrice bien redressé (1080×1920) |
| **1 bis. la variante de la feuille : capture AVANT lecture** | ❌ **ÉCHEC sous Chromium** (✅ Firefox) | **JPG 1920×1080 entièrement blanc** (luminance 255), livré sans message — A sur préversion, A **et** B sur www (dépend du moment où l'image est décodée). Cause lue dans le code : `capture()` dessine la vidéo sans vérifier qu'une image est décodée (`readyState`) ; le fond blanc peint pour le JPG masque le vide (c'est le « JPG noir » redouté par la feuille, en blanc) ; `checkedDataURL` ne contrôle que le format, pas le contenu. **Non corrigé** (hors consigne) |
| **2. video-watermark, 5 positions** (`Mon Type © 2026`) | ✅ **PASS 30/30** sur www (15 sur préversion) | paysage, portrait, portrait par matrice : taille et orientation gardées, texte entier, hors des bords (marge 3 %), à la position annoncée ; recadrages regardés : jambages de `y` et `p` intacts, rien de tronqué à droite |
| **3. CSV d'Excel FR** — `csv-to-json`, `csv-to-excel` | ✅ **PASS en « CSV UTF-8 »** ; ❌ **ÉCHEC en « CSV (point-virgule) »** (le format que nomme la feuille) | point-virgule détecté, 6 colonnes, `12,5` gardé (ni scindé, ni 125), `;` et `""` respectés ; mais le fichier Windows-1252 est lu en UTF-8 : **`Café` → `Caf�`, `Quantité` → `Quantit�`, `Éthiopie` → `�thiopie`**, sans avertissement (`TextDecoderStream()` sans détection d'encodage). La promesse « délimiteur détecté automatiquement » est **vraie**. Remarque : `csv-to-excel` écrit `12,5` comme **texte** dans le classeur (pas comme nombre) |
| **3. `csv-to-tsv`** | ❌ **ÉCHEC** | page à coller seulement ; l'analyseur coupe sur `,` en dur : **1/3/3/2/3/4 colonnes au lieu de 6**, `12,5` scindé en deux — exactement le piège « plausible mais faux » de la feuille. Sa page ne promet rien sur les délimiteurs (pas de promesse fausse) |
| **4. audio-merger MP3 + WAV** | ✅ **PASS**, deux ordres, Chromium + Firefox | 10,000 s (6 + 4), dans l'ordre ; **aucun changement de hauteur** : 440,0 / 659,8 Hz puis 1 000,0 Hz ; partie mono **sur les deux oreilles** (RMS 0,088 / 0,088) ; sortie par défaut MP3 48 kHz stéréo |
| **5. `.doc`, `.ppt`, `.ods` → PDF** | ✅ **PASS** ×3, Chromium + Firefox | `.doc` (en-tête OLE `d0cf11e0`) → 3 pages, 4 007 caractères ; `.ppt` → **3 pages pour 3 diapositives** ; `.ods` → 1 page, colonnes lisibles (regardé) ; 0,6-1,9 s. Le texte sombre sur fond bleu de la diapositive de la fixture 05 est **déjà là** quand LibreOffice lit le `.pptx` d'origine : pas introduit par le chemin `.ppt` (fidélité, bloquant 2) |
| **6. `pdf-ocr` — recherche de langue** | ❌ **ÉCHEC** | `fran` → **0 résultat**, `français` / `Français` → **0** ; `fr` et `french` trouvent « French ». Les libellés sont en anglais seulement et la recherche ne porte que sur eux et le code (`fra`) |
| **6. `pdf-ocr` — extraction** | ✅ **PASS** (français choisi dans la liste) | 27 lettres accentuées sur 27, 36 mots sur 36, aucun caractère de remplacement, Chromium + Firefox |
| **6 bis. trouvé en route** | ❌ **résultat faux silencieux** | taper `french` affiche « French » dans la liste, mais **l'OCR part en anglais** (fichier `eng.traineddata` chargé, **13 accents lus sur 27**) si le visiteur ne rouvre pas la liste : l'état de la liste filtrée et la langue réellement utilisée divergent. Même mécanisme avec `fr` (la liste montre « Afrikaans ») |
| **7. vrai plantage → `tool_errors`** (préversion) | ✅ **côté navigateur et route** ; ⏳ **ligne en base : ton geste** | déclencheur réel (Google Translate est neutralisé depuis `ab77de51`) : une note Sticky Notes dont le texte est un objet, en `localStorage`, fait lever « Objects are not valid as a React child » au rendu. **L'écran d'erreur du site s'affiche** (navigation gardée, « Something went wrong », deux boutons ; ni page blanche ni écran Vercel) ; **le rapport part** (`sendBeacon`) et **la route répond 204** ; contenu : `{"tool":"sticky-notes","source":"browser","ext":null,"detectedExt":null,"sizeBucket":null,"errorType":"Error","errorMessage":"Minified React error #31; visit https:[path]","browser":"Chrome 151"}` — **aucun nom ni contenu de fichier**. Journaux de la préversion : les 3 `POST /api/report-error` présents, **aucune erreur** (un échec d'insertion y serait écrit). La route répondant 204 même si l'insertion échoue, **seule la table prouve la ligne** : Supabase → Table Editor → `tool_errors`, tri par date décroissante — **3 lignes attendues à 16:54:25, 16:54:43 et 16:55:02 UTC (12 h 54-12 h 55 à Montréal)**, outil `sticky-notes` (trois passages : les deux premiers ont servi à lire le corps de la balise). Défaut latent au passage : Sticky Notes plante sur une note mal formée au lieu de l'ignorer |

**Bilan du bloquant 11 :** 4 tests passés (2, 4, 5, 7 côté navigateur), 3 avec échec réel — **1 bis** (capture blanche sous Chromium), **3** (CSV Windows-1252 et `csv-to-tsv`), **6** (recherche de langue, et OCR lancé dans la mauvaise langue) — reportés dans les bloquants du plan, **aucun corrigé** (la consigne s'arrêtait à l'exécution). Reste au propriétaire : la lecture de `tool_errors`.

## 5. Branche distante `origin/worktree-quota-spend-infra` — ✅ supprimée

Sa pointe `f3acb3b5` (30/08, « docs: disclose usage-metrics collection… ») est **un ancêtre de master** : 0 commit hors de master (`git rev-list origin/master..` vide). Supprimée (`git push origin --delete`), vérifiée absente. Restauration possible : `git push origin f3acb3b5:refs/heads/worktree-quota-spend-infra`.
