# RAPPORT — Prompt global du 28/09

*(en cours de rédaction — version finale à la fin de la session)*

## Point 1 — B11-1 à B11-5 corrigés (en production, `03f34e53`)

**Recherche d'abord.** ConvertCSV détecte l'encodage d'un CSV (avec un choix manuel), TableConvert détecte délimiteur, encodage **et types** ; Papa Parse accepte `windows-1252` mais confond la virgule décimale avec un séparateur. Chrome : un canevas ne peut pas dessiner une image vidéo non encore décodée (problème connu depuis Chrome 76) — il faut attendre le décodage. Google Translate cherche une langue par son nom anglais **ou natif**, sans accents.

| Défaut | Correctif (au niveau des références ou au-dessus) | Preuve |
|---|---|---|
| **B11-2** CSV Windows-1252 d'Excel lu en UTF-8 (« Caf� ») | `app/lib/csvEncoding.js` : BOM → UTF-8/UTF-16 ; sinon UTF-8 **valide** → UTF-8 ; sinon page de codes ANSI qu'Excel utilise pour la langue du visiteur (1252 Europe de l'Ouest, 1251 cyrillique, Shift_JIS…) ; menu « Encoding: Auto-detected » pour corriger | vrai fichier C d'Excel, 3 moteurs : « Auto-detected: Western European (Windows-1252, Excel "CSV") », accents intacts |
| virgule décimale | colonnes **entièrement** numériques typées, séparateur décimal du fichier détecté (`12,5` → 12.5 ; `1 234,5` ; `1.234,5`), **zéros de tête gardés en texte** (téléphones, codes postaux), > 15 chiffres gardés en texte | csv-to-json : nombres JSON ; csv-to-excel : **vraies cellules numériques** (avant : tout en texte) ; csv-to-sql : colonnes INTEGER/DECIMAL (avant : tout VARCHAR) ; téléphone `0612345678` et code `01000` restent du texte |
| **B11-3** csv-to-tsv coupait sur `,` | refait sur l'analyseur commun, délimiteur détecté, **fichier accepté** (avant : collage seul), téléchargement `.tsv` | 6 colonnes, `12,5` intact, 3 moteurs |
| famille entière | le même code sert **csv-to-json, csv-to-excel, csv-to-sql, csv-to-tsv** | 30 tests unitaires (`scripts/csv-tests/csv-encoding.test.mjs`) |
| **B11-1** JPG blanc avant lecture | `drawDecodedVideoFrame` (`app/lib/mediaSupport.js`) : attendre `loadeddata`, repositionner sur l'instant courant si le dessin est vide (force le décodage sous Chromium), refuser une image vide | A, B, B-rot : la capture avant lecture donne **la première image** (luminance 127,8 au lieu de 255), Chromium ; Firefox déjà juste |
| **B11-4** « fran », « français » introuvables | noms natifs des 102 langues (données CLDR, figées dans le code pour être identiques partout), recherche sur nom anglais + nom natif + code, **sans casse ni accents** ; libellé « French — français » | `fran`, `fr`, `français`, `Français`, `french` → French, 3 moteurs |
| **B11-5** liste « French », OCR en anglais | la langue utilisée est toujours la première affichée quand la recherche masque le choix précédent ; bouton désactivé si rien ne correspond | taper « french » puis lancer : modèle `fra` chargé, 27/27 accents |
| trouvé en route : 2 langues sans modèle | `kur` et `tgl` renvoyaient **404** sur le CDN de Tesseract.js → remplacés par `kmr` (kurde kurmandji) et `fil` (filipino/tagalog), qui existent | **les 102 langues demandent chacune leur propre modèle et les 102 modèles existent** (3 moteurs) |
| trouvé en route : attente infinie | si un modèle ne se télécharge pas (CDN bloqué, réseau coupé), la page restait sur « Downloading… » **pour toujours** ; désormais message clair en ~1 s (erreur du moteur écoutée, arrêt après 30 s sans progrès) | 102/102 langues : échec annoncé |

## Point 2 — Correcteur de grammaire : « modifications minimales » à T0 en production

Configuration **identique octet pour octet** à celle mesurée le 28/09 (80 appels réels). **Mention honnête** sous la forme de LanguageTool (qui dit que son niveau varie selon la langue) : dès que le texte est reconnu comme russe, chinois, japonais, hindi ou turc (par son écriture, ou par les lettres propres au turc), un encadré dit que les corrections y sont moins fiables et invite à vérifier chaque changement (annulable d'un clic) ; la FAQ résume la mesure. Vérifié : notice pour les 5 langues, aucune pour l'anglais et le français, 3 moteurs. *Aucun appel réel supplémentaire sur la préversion : ma connexion avait atteint la limite journalière d'appels IA.*

## Point 3 — Slogan

« **225 free tools.** / **Most never upload your file.** », même mise en forme (seconde ligne en dégradé). **Chiffres vérifiés au déploiement :** 225 = compteur de production (`/api/tool-counts`, gardé par le build), écrit par la même variable que le reste de la page ; « Most » : **recompté dans le code le 28/09 — 44 outils sur 225 passent par un serveur dans au moins un cas** (IA, Office↔PDF, vidéo, GIF depuis une vidéo, transcription, Opus, et désormais la coupe précise longue et l'agrandisseur sans WebGPU), soit **≈ 181 qui ne téléversent jamais** (80 %). Les textes Product Hunt qui disaient « about 200 » sont corrigés en « about 180 ».

## Point 5 — Journal d'erreurs de la production

**5a — export lu** : `C:\Users\moufi\Downloads\tool_errors_rows.csv` (posé en cours de session), **155 lignes, identifiants 21 à 176**.

**5b — test 7 du bloquant 11 : PASS** reporté dans le plan (lignes 165-167 vues par toi : sticky-notes, adresse masquée en `[path]`, aucun nom de fichier).

**5c — les trois défauts des vrais visiteurs, corrigés et en production (`03f34e53`) :**
- **pdf-to-word, `TypeError: Cannot convert argument to a ByteString` (lignes 131-132).** Cause vérifiée : le nom du fichier du visiteur était placé tel quel dans l'en-tête `Content-Disposition` ; tout caractère au-delà de U+00FF (chinois, arabe, `’`, `œ`…) fait lever cette erreur à l'API `Headers` (reproduit : l'ancien en-tête lève l'erreur pour `Rapport d’été — «final» œuvre`, `تقرير المبيعات ٢٠٢٦`, `年度报告（最终版）`). Correctif standard RFC 6266 / RFC 5987 (`lib/contentDisposition.js`) : un nom ASCII de repli **et** `filename*=UTF-8''…` avec le nom exact, appliqué à **toutes** les routes qui renvoient un fichier nommé d'après celui du visiteur : pdf-to-word, word/excel/ppt/…-to-pdf (`convert-to-pdf`), pdf-to-excel et pdf-to-ppt. Preuve : test unitaire contre l'API `Headers` réelle (5/5) **et de bout en bout sur la préversion** (Excel → PDF réel par Gotenberg, sans coût) : les trois noms reviennent en PDF sous leur nom exact.
- **audio-converter, fichier `.ncm` (ligne 24).** Un `.ncm` est une musique **chiffrée** par l'appli NetEase Cloud Music ; les convertisseurs de référence ne la lisent pas non plus. Désormais, dès la sélection, un message dit ce que c'est et quoi faire (exporter le morceau depuis l'appli en MP3/FLAC), rien n'est envoyé ni décodé — et **sur les 12 outils qui acceptent de l'audio** (convertisseur, découpe, séparation, fusion, amplification, compression, égaliseur, forme d'onde, métadonnées, audio-vers-texte, transcription, lecteur), pour les autres musiques chiffrées aussi (QQ Music, KuGou, Kuwo, `.m4p` d'Apple, Audible). Vérifié : 12/12 sous Chromium, Firefox, WebKit.
- **`ChunkLoadError` « Failed to load chunk » (lignes 143-146).** La protection de Vercel contre le décalage de versions est **déjà active (12 h)** ; il reste les cas qu'elle ne couvre pas. Comme les sites qui le gèrent bien : **rechargement automatique une seule fois**, puis, si le fichier manque encore, bandeau « This site was just updated — Reload » (jamais de boucle), et l'erreur n'est plus enregistrée comme un défaut d'outil. Vérifié en retirant les fichiers de code d'une page ouverte : 1 rechargement puis le bandeau, 0 rapport, 3 moteurs.

**5d — toutes les autres lignes, triées par famille (outil + message).** Méthode : date, navigateur et version de chaque ligne recoupés avec l'historique git et nos journaux de test. Les navigateurs des robots de test sont reconnaissables : Chrome 151, Firefox 153 et Safari 26 = Playwright ; Chrome 152 = le chantier TIFF du 09/09. **Seules 3 lignes viennent de vrais visiteurs : 24, 131, 132 (traitées en 5c).** Aucune famille ouverte ne reste.

| Famille | Lignes | Origine | État |
|---|---|---|---|
| zip-extractor « archive incomplète » | 48 | tests `zip-extractor.mjs` (fichiers tronqués exprès) | message attendu |
| zip-extractor « pas une archive » | 46 | mêmes tests (faux fichiers exprès) | message attendu |
| zip-extractor NetworkError | 7 | Firefox sur préversion, avant le relais d'authentification des tests | artefact de test |
| video-converter / video-compressor « could not be read » | 5 + 4 | Safari 26 = Playwright WebKit, 20/09 | artefact de test |
| convert-to-pdf (xlsx) service_error | 5 | mesures de plafonds 21-22/09 | corrigé (délai 240 s, connexion gardée ouverte) |
| pdf-to-pdfa / pdf-repair service_error | 2 + 2 | mesures de plafonds 22/09 | plafond déclaré 44 Mo depuis |
| image-converter limite 30 Mpx | 4 | tests | refus attendu |
| image-converter encodeur TIFF | 3 | développement de l'amélioration 12 | corrigé ; revérifié sur www aujourd'hui (TIFF sans perte, transparence gardée) |
| image-converter OffscreenCanvas Safari | 2 (149-150) | Playwright WebKit | message clair depuis |
| audio-merger longueur du fondu | 4 | 26/09 22 h, avant `a0534152` | corrigé |
| audio-merger « Failed to load chunk » | 4 (143-146) | déploiement pendant un test | corrigé en 5c |
| audio-merger « service not configured » | 2 | développement local | ne s'écrit plus (5e) |
| audio-converter mémoire (OOB) | 2 | Opus en wasm, 22/09 | corrigé 23/09 (Opus par le service) ; M4A→MP3 revérifié sur www |
| « Too many conversions » | 5 | mes tests au-delà de 20/h | refus attendu |
| tiff-to-jpg OffscreenCanvas | 2 (21-22) | Chrome 152, chantier TIFF | corrigé `61e6e7a2` |
| sticky-notes | 3 (165-167) | test 7, volontaire | — |

**5f — aucune ligne supprimée par moi.** Lignes de test à purger : **152** = 21, 22, 25 à 130, 133 à 176 (tout l'export sauf 24, 131, 132). Commande exacte, prête dans `docs/audit/tool_errors-purge-28-09.sql` : Supabase → ton projet → **SQL Editor** → coller le fichier → exécuter d'abord la ligne `select count(*)` (doit afficher **152**), puis la ligne `delete`, puis le contrôle final (doit afficher **3**). La liste est explicite (pas « id < 177 ») : une vraie erreur arrivée depuis l'export ne peut pas être effacée par erreur.

**5e — aucun test n'écrit plus dans `tool_errors`, sans rien changer pour les vrais visiteurs :**
1. **seul le déploiement de production Vercel écrit** (`VERCEL_ENV=production`) : ton développement local (d'où venaient les lignes « The video service is not configured yet ») et toutes les préversions n'écrivent plus rien ;
2. **un navigateur piloté par un robot de test** (Playwright, Selenium, Puppeteer : `navigator.webdriver`, toujours faux chez un visiteur) **n'envoie aucun rapport** et marque ses requêtes (cookie `oct_automation=1`), que le serveur ignore aussi pour ses propres erreurs (22 appels serveur) ;
3. la route répond désormais `X-Tool-Error-Recorded: yes|no` (sans rien dire du contenu) : on prouve sans lire la table.
**Preuve** (test qui provoque une vraie erreur : le plantage Sticky Notes du test 7) : en local, sur la préversion et sur www, écran d'erreur affiché, **aucune requête vers `/api/report-error`** ; appel direct de la route : `X-Tool-Error-Recorded: no` en local et sur la préversion (non-production), et sur www pour une requête marquée robot. Les vraies erreurs des visiteurs passent par le même chemin qu'avant.
