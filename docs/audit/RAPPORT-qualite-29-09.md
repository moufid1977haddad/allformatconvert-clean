# RAPPORT — Qualité, 29/09 (travail seul, en local, branche `qualite-29-09`)

## En bref

| Point | État | Preuve |
|---|---|---|
| 1 — résultats faux sans avertissement | **93 outils audités** : 75 modifiés, 18 lus sans défaut. **61 rendaient un résultat faux sans le dire** (F ci-dessous), 14 étaient sous le marché, annonçaient une capacité absente ou échouaient avec un message obscur (M) | tests Node `scripts/converter-tests/01`…`10` (tous verts), banc navigateur `scripts/browser-tests/qualite-29-09.mjs` ×3 moteurs |
| 2 — json-to-rust, json-to-php, env-to-json | **au niveau du marché ou au-dessus** ; contenu SEO non touché ; inscrits « éligibles » au plan | converter-tests/02 (13/13) : `tsc --strict`, Python, `dotenv`/`dotenv-expand` comme oracles |
| 3 — les deux réserves du réviseur | **faites** : IP lue seulement dans `x-real-ip` (écrit par Vercel) ; réservations heure/jour atomiques par une fonction SQL. **Migration SQL écrite, NON exécutée** (tâche du propriétaire, P13 ①) | quota-tests 19 (5/5) et 20 (12/12, la vraie SQL exécutée dans PGlite) ; réviseur indépendant : aucun bloquant, ses 5 remarques appliquées |
| 4 — plan | mis à jour : bloquant 1 (3 outils éligibles), bloquant 5 (audit du jour + liste de ce qui reste), P13, réserves retirées de « Juste APRÈS » | `claude/plan-de-travail.md` |
| 5 — vérification finale | voir §5 | — |

**Rien en production, rien poussé, aucune préversion, aucune fusion, aucun compte, aucun envoi, aucune dépense.**

## Ce que toi seul dois faire, dans l'ordre

1. **P7 — déploiement 2** (`licence-ameliorations`) : me le demander dans ce terminal (préversion, fusion sans poussée forcée).
2. **Vérification sur www** avec moi (238 pages ×3, suites, Firefox sur HTML/EPUB/MOBI → PDF).
3. **P12** — déploiement de `croissance-29-09`, puis demande d'indexation des 10 pages.
4. **P13** — ① **d'abord** la migration SQL `docs/audit/migration-quota-atomique-29-09.sql` dans Supabase → SQL Editor (BEFORE, MIGRATION, AFTER : `service_role_can_execute = true`, anon/authenticated = false, appels de test, `DELETE 2`) ; ② **ensuite** le déploiement de `qualite-29-09` (préversion, fusion, vérification sur www).
5. **Tests Safari 9 à 30** (feuille), puis retest 1a, 1b, 1c, 1e.
6. **Purge SQL** de `tool_errors` (P9).
7. **Décision Gotenberg** (P8).
8. **P10** — relecture du premier commentaire Product Hunt.
9. **P11** — soumissions de liens, dans l'ordre (Show HN d'abord).

---

## 1. Chasse aux résultats faux sans avertissement

**Inventaire.** 225 dossiers d'outils. Déjà audités avant aujourd'hui : les 36 outils mis en avant (22/09), les améliorations 1-17 (23-26/09), l'audit coupes/jonctions (28/09), les outils du 29/09 (SQL to CSV, CSV to SQL/JSON/TSV, TSV to CSV, TOML ↔ JSON, hash, barcode). **Audités aujourd'hui : 93**, dans l'ordre demandé (developer-tools, text, math, convertisseurs de données, puis PDF, fichiers et images là où un défaut de la même famille était probable).

**Méthode.** Pour chaque outil : lecture du code, jeu de cas limites (grands nombres et précision, zéros en tête, Unicode et émojis, guillemets et échappements, lignes vides, BOM, CRLF, entrées invalides, fichiers chiffrés), comparaison à un oracle : bibliothèque de référence (`dotenv`, `dotenv-expand`, `js-yaml`, `Buffer`, `tsc`, Python, Poppler `pdftotext`, fast-xml-parser), spécification (YAML 1.2, RFC 4180, HTML5) ou valeur exacte. Chaque défaut a d'abord été **reproduit** (plusieurs tests rejouent l'ancien comportement pour prouver que le défaut était réel), puis corrigé, puis testé en Node et dans le vrai navigateur.

**Le moyen des concurrents, retenu à chaque fois** plutôt qu'un bricolage : quicktype (moteur d'app.quicktype.io) pour JSON → code ; terser (webpack, Vite), js-beautify (beautifier.io), CSSO, sql-formatter, jsdiff/Myers (git, diffchecker), sucrase, Dart Sass, marked + DOMPurify, cron-parser + cronstrue (crontab.guru), mathjs, FIGlet (patorjk.com), Web Crypto AES-256-GCM (aesencryption.net, devglan), @cantoo/pdf-lib pour déchiffrer (comme iLovePDF). Toutes les licences vérifiées : MIT, BSD, Apache-2.0 (interdit n° 14 : aucune police ni modèle ajouté).

Légende : **F** = rendait un résultat faux sans le dire · **M** = sous le marché, ou échec avec un message incompréhensible.

### developer-tools

| Outil | Défaut mesuré | Nature | Corrigé | Preuve |
|---|---|---|---|---|
| json-minifier | `12345678901234567890` → `…7000`, `1.10` → `1.1` | F | oui — texte d'origine réindenté | tests 01, navigateur |
| json-to-yaml | mêmes arrondis | F | oui — analyse sans perte (`jsonLossless.js`) | tests 01 (relu par js-yaml), navigateur |
| yaml-to-json | `2024-01-01` → horodatage ISO ; entiers > 2⁵³ tronqués ; `.inf` → `null` ; multi-documents refusés | F | oui — schéma YAML 1.2 core, entiers exacts, `.inf` signalé, `---` → tableau | tests 01, navigateur |
| json-to-csv | clés absentes du 1ᵉʳ objet perdues ; objets imbriqués → `[object Object]` ; grands entiers arrondis ; tableau vide = erreur technique | F | oui — union des clés, aplatissement `a.b` / `t.0` (ConvertCSV, json-csv.com) | tests 02, navigateur |
| json-to-xml | nombres arrondis ; clé `first name` → XML invalide sans message | F | oui | navigateur (+ XMLValidator) |
| json-to-typescript / python / go / csharp | 1ᵉʳ niveau seulement ; tableau racine → champs `0`, `1` ; `first-name` → code qui ne compile pas ; `null` → `object` ; entiers typés flottants | F | oui — quicktype | tests 02 (`tsc --strict`, exécution Python), navigateur |
| json-to-rust | idem (point 2) | F | oui — structures imbriquées, snake_case + `#[serde(rename…)]`, `Option`, `Vec`, `skip_serializing_if` | tests 02, navigateur |
| json-to-php | idem ; `public string $first-name;` (erreur de syntaxe) ; pas de « PHP array » (point 2) | F | oui — « PHP array » (grands entiers en chaîne, comme `JSON_BIGINT_AS_STRING`) + classes PHP 8 `fromArray()` | tests 02, navigateur |
| env-to-json | `export KEY` → clé « export KEY » ; multi-lignes coupées ; `\n` littéral ; commentaire en ligne gardé dans la valeur ; JSON → .env non guillemeté (point 2) | F | oui — règles de dotenv, types et `${VAR}` en option, lignes ignorées signalées | tests 02 (égalité exacte avec `dotenv.parse` et `dotenv-expand`), navigateur |
| base64-encoder | décodage de Base64 UTF-8 → « cafÃ© » ; encodage refusé au-delà de U+00FF ; base64url refusé | F | oui — UTF-8, url-safe, sans remplissage, binaire identifié | tests 03 (= `Buffer`), navigateur |
| hex-to-text | é → `e9` au lieu de `c3 a9` ; émojis illisibles | F | oui — octets UTF-8 | tests 03, navigateur |
| html-encoder | `&amp;lt;` décodé en `<` (deux passes) | F | oui — une passe, toutes les entités | tests 03, navigateur |
| html-entity-decoder | les balises du texte disparaissaient | F | oui | tests 03, navigateur |
| timestamp-converter | 13 chiffres (ms) lus en secondes → an 55 000 ; `12abc` lu 12 ; champ date vidé | F | oui — unité déduite (s/ms/µs/ns, comme epochconverter), UTC + local | tests 04, navigateur |
| aspect-ratio | champ vide/invalide compté 1 ; décimales tronquées | F | oui | navigateur |
| js-minifier, javascript-formatter (Minify), code-minifier (JS/TS) | code sans point-virgule cassé (`let a = 1\nlet b = 2` → erreur) ; `return\n42` renvoie 42 ; `a - -b` → `a--b` | F | oui — terser | tests 05 (exécution avant/après), navigateur |
| code-formatter | JSON : grands entiers arrondis | F | oui | navigateur |
| css-formatter | `url(data:…;base64)` découpé | F | oui — js-beautify / CSSO | tests 05, navigateur |
| html-formatter | `<pre>`/`<textarea>` réindentés | F | oui — js-beautify | tests 05 |
| sql-formatter | retour à la ligne inséré dans un commentaire `--` (la suite devient du code) | F | oui — sql-formatter, 12 dialectes | tests 05, navigateur |
| diff-viewer | comparaison par position : une ligne insérée marque tout le reste | F | oui — Myers | tests 05, navigateur |
| typescript-to-js | `{a: 1}` → `{a}` ; types d'objets cassés | F | oui — sucrase | tests 05, navigateur |
| scss-to-css | ni variables, ni imbrication, ni mixins : CSS invalide | F | oui — Dart Sass | tests 05, navigateur |
| xml-formatter | XML invalide mis en forme sans message | F | oui — validation d'abord | navigateur |
| jwt-decoder | identifiants 64 bits arrondis | F | oui — + exp/iat/nbf en UTC | navigateur |
| cron-expression, cron-expression-builder | « Build and validate » sans validation (`99 * * * *`, `0 0 31 2 *` affichés valides) | F | oui — cron-parser + cronstrue, 5 prochaines exécutions | tests 09, navigateur |
| url-parser | `?tag=a&tag=b` → seul `b` | F | oui | navigateur |
| excel-to-csv, excel-to-json | émoji écrit par openpyxl/pandas (`&#128512;`) → U+F600 invisible (même défaut dans SheetJS 0.20.3) ; JSON : dates en nombres de série, clés vides absentes | F | oui — références rétablies avant l'analyse (fflate), dates ISO 8601, `null` | tests 08 (fixture générée par openpyxl) |
| markdown-to-html | 6 motifs | M | oui — marked (GFM) | tests 05, navigateur |
| markdown-editor, markdown-previewer | « petit sous-ensemble » annoncé | M | oui — marked + DOMPurify | navigateur (tableau rendu, `onerror` neutralisé) |
| api-tester | `Content-Type` forcé sur chaque GET → pré-vol CORS : des API échouaient ici seulement ; réponse JSON arrondie | M | oui | lecture + build |
| color-picker, password-generator, regex-tester, uuid-generator, unicode-converter, url-encoder | — | — | aucun défaut trouvé (lus) | — |

### text-tools

| Outil | Défaut mesuré | Nature | Corrigé | Preuve |
|---|---|---|---|---|
| character-counter | « 😀 » = 2 caractères ; « é » compté « spécial » | F | oui — graphèmes, toutes écritures, + UTF-16 et UTF-8 | tests 06, navigateur |
| duplicate-remover | CRLF : la dernière ligne restait en double | F | oui — + options casse/espaces/vides | tests 06, navigateur |
| text-sorter | « Banana » avant « apple », « éclair » après « zebra », 10 avant 9 | F | oui — Intl.Collator numérique | tests 06, navigateur |
| text-truncator | émoji coupé en deux (« � ») | F | oui | tests 06, navigateur |
| text-comparator | comparaison par position | F | oui — Myers | navigateur |
| lorem-ipsum | « 5 phrases » = 5 paragraphes ; plafond muet à 69 mots | F | oui | tests 06, navigateur |
| find-replace | en texte simple, `$&`, `$1`, `$$` interprétés (« US$$ » → « US$ ») | F | oui | tests 06, navigateur |
| ascii-art | chiffres, ponctuation, accents → espaces | F | oui — FIGlet, 10 polices, caractères absents signalés | navigateur |
| text-encryptor | XOR ; texte chiffrable sans vrai secret ; mot de passe faux non détecté | M | oui — AES-256-GCM, PBKDF2 600 000 ; anciens textes déchiffrables et signalés | tests 06, navigateur |
| whitespace-remover, text-repeater, text-to-list, url-encoder, sticky-notes | — | — | aucun défaut trouvé (lus) | — |

### math-tools

| Outil | Défaut mesuré | Nature | Corrigé | Preuve |
|---|---|---|---|---|
| scientific-calculator | `1/3e12` → « 0 » ; `2π`, `2(3)` en erreur ; `sqrt(-1)`/`log(0)` → « Cannot divide by zero » ; pas de degrés | F | oui — mathjs, 12 chiffres, degrés/radians | tests 07, navigateur |
| statistics-calculator | valeurs séparées par espaces/retours ignorées (« 1 2 3 » → 1) ; « 12abc » lu 12 ; tout le monde « mode » ; somme 0,001 → « 0.00 » ; écart-type de population seul | F | oui — + écart-type d'échantillon (calculator.net), quartiles | tests 07, navigateur |
| fraction-calculator | « 1.5 » lu 1 ; lettre → « dénominateur nul » ; signe non normalisé ; dépassement 2⁵³ | F | oui — BigInt, nombre mixte | tests 07, navigateur |

### PDF, fichiers, images

| Outil | Défaut mesuré | Nature | Corrigé | Preuve |
|---|---|---|---|---|
| pdf-merge, pdf-split, pdf-compress, pdf-rotate, pdf-delete-pages, pdf-reorder-pages, pdf-number-pages, pdf-watermark, pdf-protect, pdf-editor | PDF chiffré qui s'ouvre **sans** mot de passe (relevés bancaires, factures) → PDF de sortie **cassé** (« Unknown compression method », pages blanches), livré comme un succès | F | oui — déchiffré d'abord (@cantoo/pdf-lib) ; PDF à mot de passe d'ouverture refusé avec renvoi vers PDF Unlock | tests 10 (RC4-128 et AES-256 ; texte relu par `pdftotext`, défaut rejoué sans le correctif), navigateur (rotation d'un PDF chiffré) |
| pdf-crop, pdf-organize, pdf-redact, pdf-sign | tout PDF chiffré refusé avec un message de développeur | M | oui — même déchiffrement | build |
| pdf-forms | idem ; copier les pages perdrait le formulaire | M | message clair (PDF Unlock d'abord) | build |
| text-to-pdf | tout .txt Windows (CRLF) et toute tabulation → « WinAnsi cannot encode » | M | oui ; caractères hors police latine listés clairement. **Reste : police Unicode** (au plan) | navigateur |
| file-encryptor | XOR ; **mauvais mot de passe = fichier corrompu sans erreur** | F | oui — AES-256-GCM, refus explicite, anciens fichiers lisibles avec avertissement | tests 06, navigateur |
| png-to-jpg, webp-to-jpg | transparence → noir (divulgué, mais sous iLoveIMG/CloudConvert et Image Converter) | M | oui — fond blanc | navigateur (pixel relu) |
| pdf-extract-text | toute la page sur une seule ligne (fragments joints par une espace) | F | oui — retours et espaces d'après la position du texte | tests 11 (défaut rejoué), navigateur |
| svg-to-png | tout SVG non carré étiré en 512 × 512 | F | oui — taille lue dans le SVG, proportions verrouillées | navigateur (viewBox 160×90 → 512×288) |
| png-to-ico | image non carrée étirée dans l'icône | F | oui — centrée sur un carré transparent | navigateur (trame 256 décodée) |
| file-converter | CSV : champs non guillemetés (« Smith, John » → 2 colonnes) ; HTML : texte non échappé (balises interprétées) | F | oui — RFC 4180, échappement | lecture + build |
| image-metadata | sous-titre « View image metadata and EXIF data » sans aucune lecture EXIF | M | oui — exifr : EXIF, GPS (mis en évidence), IPTC, XMP, ICC | navigateur (fixture EXIF + GPS écrite à la main) |
| file-splitter, pdf-to-jpg, pdf-to-image, image-cropper, image-rotate, gif-compressor, video-to-audio | — | — | aucun défaut trouvé (lus : fond blanc de pdf.js, échelle naturelle du recadrage, boîte englobante de la rotation, refus d'un GIF plus lourd depuis le 28/09, formats audio partagés) | — |

**Décompte, outil par outil (une ligne de tableau peut regrouper plusieurs outils) :** F = 35 developer-tools + 8 text-tools + 3 math-tools + 11 PDF (les 10 du chiffrement + extract-text) + File Encryptor + SVG to PNG + PNG to ICO + File Converter = **61** ; M = 4 developer-tools (markdown-to-html, markdown-editor, markdown-previewer, api-tester) + Text Encryptor + 4 PDF (crop, organize, redact, sign) + pdf-forms + text-to-pdf + png-to-jpg + webp-to-jpg + image-metadata = **14** ; lus sans défaut = **18**. Total **93**.

### Ce qui reste NON audité

Inscrit au plan (bloquant 5), même méthode à appliquer : la majorité des image-tools, gif-tools (apng-to-gif, gif-compressor, gif-to-apng, gif-to-mp4, image-to-gif), les PDF non listés ci-dessus (epub/image/jpg/markdown/mobi-to-pdf, pdf-ai-summary, pdf-compare, pdf-ocr, pdf-to-html, pdf-unlock), audio-equalizer, audio-waveform, six video-tools, file-comparator, file-metadata, base64 fichiers, les ai-tools non encore audités, mobi-to-epub.

## 2. Les 3 outils écartés

| Outil | Marché (moyen relevé) | Nous, maintenant |
|---|---|---|
| json-to-rust | JSONLint et transform.tools : structures imbriquées, `Option`, `Vec`, renommage serde (quicktype ou équivalent) | **quicktype** lui-même : une struct par objet imbriqué, `Vec<Item>` fusionnant tous les éléments, `Option<T>` pour null ou absent, `i64`/`f64` distingués, `rename_all` ou `#[serde(rename = "…")]`, `skip_serializing_if` |
| json-to-php | « json to **php array** » = requête dominante ; les sites affichent le tableau `[ 'k' => v ]` | **PHP array** (= `json_decode($json, true)`, entiers > `PHP_INT_MAX` en chaîne) **et** classes PHP 8 (propriétés promues typées, nullables, classes imbriquées, `fromArray()` lisant les clés d'origine) |
| env-to-json | Flavio Copes, DevToolLab : `export`, guillemets, commentaires | règles exactes de **dotenv** (égalité vérifiée avec `dotenv.parse` sur 16 lignes de cas limites), types en option (sans toucher `007` ni `1.10`), `${VAR}` comme **dotenv-expand**, lignes non reconnues signalées ; sens inverse : guillemets choisis pour que dotenv relise exactement |

**Contenu SEO non touché** : titres, métadonnées (`layout.tsx`) et structure inchangés. Seuls les passages qui décrivaient une capacité devenue fausse (« only top-level keys », « not a PHP array », « doesn't support multi-line ») ont été réécrits, par la règle du point 1. Inscrit au plan : ces 3 pages sont **éligibles** ; leur travail de contenu attend la mesure des 10 pages.

## 3. Les deux réserves du réviseur

**Implémenteur** (sous-agent) puis **réviseur indépendant** (autre sous-agent), comme demandé ; je n'ai mis de réviseur nulle part ailleurs.

**(a) IP falsifiable.** Avant : `x-forwarded-for`, premier segment — une valeur que le client peut envoyer. Documentation Vercel lue en direct (<https://vercel.com/docs/headers/request-headers>) : pour `x-forwarded-for`, *« we currently overwrite the X-Forwarded-For header and do not forward external IPs »* ; `x-real-ip` y est dit *« identical to the x-forwarded-for header »*, et la fonction officielle `ipAddress()` de `@vercel/functions` lit `x-real-ip` (« Client IP as calculated by Vercel Proxy »). Le réviseur a vérifié qu'aucun proxy n'est placé devant Vercel (DNS direct, `Server: Vercel`). Désormais : **`x-real-ip` seulement**, une seule IP valide (`net.isIP`), sinon le seau partagé `unknown-ip` existant ; `x-forwarded-for` n'est plus lu nulle part (test 19 le vérifie dans tout le code serveur) ; journal d'erreur si l'en-tête manque en production.

**(b) Compensation non atomique.** Avant : incrément heure, incrément jour, et si le jour refusait, décrément de l'heure dans un second appel (une coupure réseau entre les deux désynchronisait). Désormais : une fonction SQL `increment_usage_counters_all_or_none` — tous les compteurs ou aucun, dans une transaction, ordre de verrouillage fixe (pas d'interblocage), même règle de plafond que `increment_usage_counter` ; utilisée par les limites IP (outils payants), contact, signalement d'erreurs, billets média/office et générateur d'images. `guard.js` (réservation puis règlement autour de l'appel au fournisseur) ne peut pas être une seule transaction ; ses échecs surcomptent toujours, jamais l'inverse : laissé tel quel, avec l'accord du réviseur.

**Réviseur indépendant — aucun bloquant.** Ses remarques, toutes appliquées : droit `service_role` vérifié dans la migration (attendu `true`) et accordé explicitement ; CREATE + REVOKE dans une transaction ; `notify pgrst, 'reload schema'` ; `set search_path = public` ; `ai-image` libère sa propre réservation si le garde partagé lève une exception ; journal si `x-real-ip` manque en production. Notées sans correction (sans effet aujourd'hui) : normalisation IPv6 (le site n'a que des enregistrements IPv4), et le test de concurrence tourne dans PGlite (une seule connexion) — la garantie multi-sessions repose sur la sémantique Postgres, vérifiable par la section AFTER de la migration.

**Migration** : `docs/audit/migration-quota-atomique-29-09.sql`, **non exécutée**. Additive (le code en production continue de fonctionner après). **À passer AVANT le déploiement de `qualite-29-09`** : déployé avant, chaque route à limite échouerait fermée (503 ou erreur, aucune dépense). Tâche P13 ①.

## 4. Plan

`claude/plan-de-travail.md` : bloquant 1 (3 outils éligibles), bloquant 5 (audit du 29/09 + liste nominative de ce qui reste), « Juste APRÈS » (réserves du réviseur faites), ligne d'arrivée **P13** (migration puis déploiement).

## 5. Vérification finale

*(rempli à la fin de la session, voir ci-dessous)*

## 6. Règles tenues, écarts

- Aucune poussée, aucune préversion, aucune fusion ; seule la branche `qualite-29-09` (partie de `croissance-29-09`) a reçu des commits.
- Aucun fichier d'environnement lu ; aucune commande exposant un secret ; `SUPABASE_SERVICE_ROLE_KEY` jamais utilisée : les tests de quota qui l'exigent (00-18) n'ont pas été lancés ; les nouveaux (19, 20) tournent sur des doublures et PGlite.
- Aucune valeur de repli silencieuse ajoutée ; aucun fichier de production modifié pour un problème local (le seul réglage de build ajouté, `turbopack.resolveAlias` pour `fs` côté navigateur, sert le code du site : quicktype importe `fs` dans une branche Node).
- Aucune boucle de surveillance ni réveil planifié. Aucun compte, envoi ni dépense.
- Dépendances ajoutées (toutes chargées au clic, sauf marked déjà présent) : quicktype-core, terser, js-beautify, sql-formatter, diff, sucrase, sass, mathjs, figlet, cronstrue, cron-parser ; en développement : @electric-sql/pglite, dotenv, dotenv-expand.
