# RAPPORT — P21 : nuit et jour du 01 au 02/10 — défauts iPhone, erreurs réelles, formats, qualité, solidité, affichage, « coming soon »

Travail seul, à la demande du propriétaire (chantier et mises en production demandés, retour arrière autorisé d'avance).
**Aucune poussée forcée. Aucune dépense** (détourage, Pangram et OpenAI joués par les bancs ; aucun appel payant réel).
Supabase, Railway et les variables d'environnement **non touchés**. Aucun outil supprimé ni renommé. Aucun secret lu
ni affiché. Branche `p21-02-10`, repère **`restauration-avant-p21-02-10` = `23a9207c`** (master avant P21, poussé).

## État des phases

| Phase | État |
|---|---|
| 1 — Défauts vus sur le vrai iPhone | ✅ fait, voir §1 (mise en production : §8) |
| 2 — Erreurs réelles des visiteurs | 🟠 bloquée par l'accès, voir §2 (requête prête pour le propriétaire) |
| 3 — Couverture des formats | 🟡 en cours, voir §3 |
| 4 — Qualité des 40 outils les plus recherchés | à faire |
| 5 — Solidité | à faire |
| 6 — Affichage iPhone / iPad | à faire |
| 7 — Les 5 outils « coming soon » | à faire |

## 0. Noté au plan dès le début

Passe sur le **vrai iPhone** du propriétaire (P15–P19, tests 1 à 8) : **8/8 réussis** (Split PDF Download / Save-Share /
ZIP ; Image Compressor 48 Mpx 8064×6048 −63 % ; Image Converter HEIC 48 Mpx → JPG 8064×6048 et JPG → WebP/AVIF/PNG ;
Image Resizer 24 Mpx → 2856×2142 ; Brightness & Contrast et Image Blur 24 Mpx, flou ≈ 2 s ; JPG to PDF portrait droit ;
QR Scanner caméra / envoi / collage ; Background Remover). Tests 9 à 16 à faire par le propriétaire : **bloquant 9
ouvert**. Écrit au bloquant 9, au tableau de tête (ligne 4) et à la ligne P21 de la ligne d'arrivée.

## 1. Phase 1 — les trois défauts vus sur l'iPhone

### 1a. JPG to PDF : « Download » ouvrait le PDF dans Safari (Split PDF l'enregistrait)

**Cause (lue dans le code).** Les deux outils passent par le même composant (`FileDownload`) et le même pont iOS. Sur
iPhone, le pont interceptait le toucher puis, **après** lui : lisait le fichier (`fetch(blob:)`), le confiait au
service worker, attendait sa réponse, et seulement alors naviguait vers `/zipdl/<id>/<nom>` (réponse « pièce jointe »).
WebKit ne garde la permission d'un toucher qu'**environ une seconde** à travers les attentes (« user gesture
forwarding »). Les parties de Split PDF sont petites : tout tient dans la seconde, le fichier est enregistré. Le PDF
d'une photo d'iPhone pèse plusieurs Mo : la navigation part trop tard, elle n'est plus « celle du visiteur », et Safari
affiche le PDF. **Ce n'était donc pas propre à JPG to PDF** : tout fichier assez gros, sur tout outil, était exposé
(PDF, image, vidéo — les types que Safari sait afficher).

**Moyen des concurrents.** iLovePDF et Smallpdf donnent un **lien ordinaire** vers une réponse serveur
`Content-Disposition: attachment` : le toucher est une navigation immédiate, iOS enregistre toujours.

**Correctif (`app/lib/download.js`, `public/zipdl/sw.js`, `app/components/FileDownload.jsx`).**
- Dès que la ligne de résultat s'affiche (avant tout toucher), le fichier est rangé dans le **Cache Storage** du
  navigateur et le lien « Download » devient une **vraie adresse du site**, `/zipdl/f/<id>/<nom>`, que le service
  worker sert en pièce jointe — exactement le modèle d'iLovePDF, sans serveur. Le toucher n'attend plus rien.
- Le lien préparé est un **lien simple, sans attribut `download`** : une navigation passe toujours par le service
  worker, alors qu'un lien `download` peut être pris en charge directement par le gestionnaire de téléchargement
  (constaté sous Chromium : contournement du service worker).
- Cache plutôt que mémoire du service worker : iOS arrête un service worker inactif au bout de quelques secondes.
  Entrées purgées après 1 h, ou une minute après que la page ne les propose plus.
- Pour les téléchargements lancés tard **par du code** (entrée d'archive extraite à la demande dans Zip Extractor, ZIP
  « Download all »), `saveBlob` vérifie si le dernier toucher date de moins de 0,8 s ; sinon, un bandeau « *nom* is
  ready. **Download** » (cible de 44 px) demande un toucher de plus sur un vrai lien.
- Avant que l'adresse soit prête (une fraction de seconde), l'ancien pont reste en place.
- JPG to PDF passe aussi le fichier lui-même (`blob`) au composant, comme Split PDF.

**Aucun autre outil n'a l'écart** : les 191 outils qui produisent un fichier passent par `FileDownload`
(`check-downloads.js`, dans le build) — ils ont donc tous le nouveau lien ; les 3 chemins par code passent par
`saveBlob`. **Banc qui l'empêche** : `download-guard.mjs --device=iphone|ipad` vérifie maintenant, pour chaque outil
échantillonné (PDF, images, audio, vidéo, texte, EPUB…), que le lien pointe vers `/zipdl/f/…` **avant** le toucher.

| Banc | www avant | local après |
|---|---|---|
| `p21-phase1.mjs --device=iphone` (JPG to PDF) | **rouge** : lien `blob:` + attribut download | vert |
| `download-guard` Chromium iPhone / iPad | (nouveau contrôle) | **186/186 · 186/186** |
| `download-guard` WebKit iPhone / iPad | | **172/172 · 172/172** |
| `download-guard` Chromium / Firefox (bureau) | | **142/142 · 142/142** |

**Limite honnête** : la seconde de WebKit et le comportement du lien préparé sont prouvés en simulation (agent iPhone,
service worker réel) ; **la preuve finale est le toucher sur le vrai iPhone** → ajouté à la liste du propriétaire (§9).

### 1b. Background Remover : morceau de fond, liseré bleu, halo dans l'anse

**Moyen des concurrents (relevé le 02/10).** remove.bg décrit des « edge color corrections » et un « alpha matte »
(page API) ; Photoroom une « color decontamination » qui retire la couleur du fond reprise par le sujet (blog
comparatif) ; l'API de Pixian n'expose aucun réglage de bord. Aucun ne publie son moyen exact ; la famille connue en
open source est : **segmentation → alpha qui suit les vrais bords → estimation de la couleur du sujet** (méthode
« blur fusion » de Forte, ICIP 2021, celle qu'utilise le code de BiRefNet).

**Cause chez nous.** Le masque d'IS-Net est calculé à 1024 px puis **étiré** sur la photo : le bord est flou et un ou
deux pixels trop large ; chaque pixel de bord garde la couleur **mélangée** de la photo (sujet + fond bleu). D'où le
liseré bleu et le halo clair dans l'anse. Le « morceau de fond collé en haut du sujet » est une **erreur de
segmentation** du modèle (le filtre « plus grande région » ne le retire pas : il touche le sujet).

**Correctif, entièrement dans le navigateur (aucun changement du service Railway)** — `app/lib/mattingRefine.js`,
exécuté dans un Worker (`refine.worker.js`) sur une copie de 1 Mpx :
1. filtre guidé (He et al.) : l'alpha suit les bords réels de la photo ; courbe 0,3–0,7 : un voile incertain n'est pas
   gardé ;
2. moyennes locales du sujet et du fond (deux passes de blur fusion) ;
3. à pleine résolution, bande par bande (aucun canvas > 4 Mpx, comme avant) : **dans la bande de bord seulement**,
   l'alpha est relu sur la couleur elle-même (projection de la couleur du pixel entre celle du fond et celle du sujet,
   quand elles diffèrent d'au moins 40 niveaux ; jamais plus opaque que le masque) ; puis la couleur de chaque pixel
   de bord est remplacée par celle du sujet : F = F̄ + m (I − m F̄ − (1−m) B̄).
4. Si l'affinage échoue, la découpe est donnée telle que le masque l'a produite (comportement d'avant) et l'échec est
   **remonté** (`reportToolError`), pas tu.

**Banc avec vérité terrain** (`scripts/p21/bg-bench/`, fichiers lourds hors dépôt) : 7 vraies photos détourées à la
main (Wikimedia Commons, domaine public / CC — chope à bière à anse évidée, tasse, tasse à thé, tasse en porcelaine
sur soucoupe, casque de vélo ajouré, chat à poils longs, chat à poils courts ; sources dans
`docs/audit/detourage-p21/SOURCES.md`) posées sur **4 fonds** (plastique bleu-violet comme la photo du propriétaire,
vert saturé, deux vraies photos) = **28 cas** ; masque par **notre vrai modèle IS-Net exécuté en local** (code du
service importé, pas copié), copie d'envoi identique à la page (1024 px, JPEG 0,92) ; puis le **code JS de la page**.

| Moyenne sur 28 cas | www (avant) | P21 |
|---|---|---|
| **Couleur du fond restée dans le bord** (le « liseré ») | **11,0 %** | **4,8 %** |
| Erreur d'alpha (0-255) | 3,02 | 2,73 |
| Voile (opacité gardée hors du sujet) | 3,17 % | 2,75 % |
| Trous (opacité perdue dans le sujet) | 0,62 % | 0,45 % |
| Erreur de couleur de bord posé sur blanc (contre la vérité) | 11,84 | 13,97 |

Tasses sur bleu-violet : fuite 9-17 % → 0,6-5,6 %. **La fuite baisse dans les 28 cas.** La dernière ligne monte : la
vérité terrain elle-même porte un **liseré sombre de découpe manuelle** (visible sur la chope, figure ci-dessous) que
nous ne reproduisons pas ; le contrôle visuel montre l'inverse d'une dégradation.
Figure : `docs/audit/detourage-p21/figures/bords-avant-apres.png` (photo / www / P21, au pixel près).

**Banc sur la page réelle** (`p21-phase1.mjs`, service joué : disque blanc sur bleu-violet, masque trop large et flou
comme IS-Net étiré) : **www : 66,5 % de fond dans le bord, 44,6 % de l'anneau extérieur opaque → P21 : 1,9 % et 0 %**,
Chromium / Firefox / WebKit, iPhone simulé (limite de canvas iOS active). Temps (Chromium, `bg-remover-bands.mjs`,
service joué) : 12 Mpx 2,3 → 3,0 s ; 24 Mpx 5,2 → 4,8 s ; 48 Mpx 7,6 → 7,3 s.

**Ce qui reste : les morceaux de fond gardés par le modèle** (voile de 14-30 % sur fonds photographiques chargés —
casque et chat sur feuille, chat sur champ). C'est la segmentation. **Changement de modèle mesuré, pas recommandé** :
- BiRefNet-lite (MIT) : voile moyen 4,4 % contre 3,2 % pour IS-Net, 14,6 s/image sur 8 cœurs → écarté ;
- BiRefNet complet (MIT, 973 Mo) sur les 8 cas les plus durs : excellent sur certains (chat sur champ 17,7 % → 0 %,
  casque sur violet 0,8 % → 0,01 %), **catastrophique** sur d'autres (chat sur feuille 30 % → 133 %, casque sur feuille
  14 % → 40 %), **31 s/image sur 8 cœurs** → il faudrait une carte graphique (nouveau coût) pour un gain non prouvé.
Décision et chiffrage au plan (« Décisions du propriétaire — P21 », D1). Aucun changement du service.

### 1c. Image Converter : « 443% larger » / « 100% larger » sans explication

**Concurrents (02/10).** CloudConvert, Convertio et iLoveIMG n'affichent, après conversion, que la taille du nouveau
fichier — ni pourcentage ni couleur. Nous gardons la comparaison (utile) mais **un fichier plus gros n'est plus présenté
comme un échec** : une ligne dit pourquoi et quoi faire (`app/lib/sizeChange.js`, une seule règle) :
- vers un format sans perte (PNG, BMP, TIFF, GIF, WAV, FLAC…) : « Normal for PNG: it is lossless and stores every
  pixel exactly, while your JPG was compressed. Nothing was lost; for a smaller file, convert to JPG, WebP or AVIF
  instead. »
- depuis un format plus compact (HEIC, AVIF, WebP → JPG ; Opus → MP3…) : « Normal: HEIC stores the same picture in
  fewer bytes than JPG, so the JPG copy is larger. JPG opens everywhere; if size matters more, keep the HEIC or lower
  the quality. »
- même format : la qualité choisie est plus haute que celle de l'original → baisser la qualité ou garder l'original.
**Appliqué partout où une variation de taille de conversion s'affiche** : Image Converter, et les outils vidéo du
service (Video Converter, Filter, Resizer, Compressor — « Larger by » n'est plus orange). Les compresseurs (Audio, GIF,
vidéo) avaient déjà leur explication (« already well compressed », « keep your original »). Test
`scripts/p21/size-change.test.mjs` ; banc page : www **rouge** (aucune explication), P21 vert.

## 2. Phase 2 — erreurs réelles des visiteurs

- **`tool_errors` (Supabase)** : la table n'est lisible **qu'avec la clé service** (RLS sans politique, `supabase/
  tool_errors.sql`). Cette clé n'entre jamais dans l'environnement de Claude (règle permanente du 28/08). Lecture
  **impossible sans le propriétaire** : requête **en lecture seule** prête, `docs/audit/p21-tool_errors-lecture.sql`
  (regroupement par outil et cause depuis le 28/09, puis le détail) → plan, D2.
- **Erreurs d'exécution Vercel, 7 jours** : sur le plan Hobby, les journaux ne sont **conservés qu'une heure**. Demandé
  sur 7 jours : 9 lignes, toutes des 200 des 25 dernières minutes ; niveau erreur, avertissement, 4xx et 5xx : **0**.
  Rien d'exploitable au-delà ; une conservation plus longue demande Observability Plus (payant) → plan, D2.
- Rien n'a donc pu être reproduit en phase 2 ; elle reprendra dès l'export du propriétaire.

## 3. Phase 3 — couverture des formats

Méthode : pour chaque outil prioritaire, nos formats lus dans le code (champ `accept`, options, route serveur) contre
ceux des 2 meilleurs concurrents relevés le 02/10 ; ajout de tout format faisable avec les moteurs déjà en place,
chacun prouvé par un vrai fichier relu par un outil indépendant (ffprobe natif, PDF.js, pdf-lib, sharp).

| Outil | Concurrents (relevé 02/10) | Avant | Ajouté (P21) | Preuve |
|---|---|---|---|---|
| PDF to JPG / PDF to Image | iLovePDF : « Page to JPG » / « Extract images », qualité Normal / High ; CloudConvert : densité (dpi), pages | rendu fixe 2×, PNG seul (Image) ou JPG seul (JPG), toutes les pages | les **deux modes**, **PNG, JPG, WebP, TIFF, BMP** (PDF to Image), **72 / 150 / 300 dpi**, qualité, **choix des pages**, PDF protégé expliqué, page trop grande pour l'appareil rendue au maximum possible et dit | `p21-pdf-to-images.mjs` **12/12 ×3 moteurs** (dimensions exactes à 150 et 300 dpi, octets de chaque format, photo extraite à sa propre résolution 800×600) |
| Word / Excel / PowerPoint to PDF | iLovePDF / Smallpdf : DOC(X), XLS(X), PPT(X) ; CloudConvert : ODT, RTF, ODS, ODP, PPS… sur des pages séparées | .docx .doc ; .xlsx .xls .csv .ods ; .pptx .ppt | **ODT, OTT, RTF, DOCM, DOTX, DOTM, DOT, WPD (WordPerfect) ; OTS, XLSM, XLSB, XLTX, XLTM, XLT ; ODP, OTP, PPTM, PPSX, PPSM, PPS, POTX, POTM, POT** — même LibreOffice (Gotenberg). **Works .wps essayé puis retiré** : 5 fichiers Works (versions 2 à 6) donnaient tous le même PDF blanc (5 opérateurs de dessin) — l'accepter aurait été un faux succès | 23 vrais fichiers (`docs/audit/fixtures-p21-office/`) : `e2e-office-formats.mjs` sur la préversion **23/23** (texte retrouvé, ou dessin réel pour les documents sans texte : 11 011 opérateurs pour le .pps/.pot comme pour le .ppt) |
| Audio Converter (+ Booster, Splitter, Video to Audio ; Compressor pour M4B/MP2) | CloudConvert : M4R, M4B, MP2, AU, CAF, WV, MKA… | 11 sorties | **M4R (sonnerie iPhone), M4B (livre audio), MP2, WavPack, CAF, AU, MKA** | `p21-audio-formats.mjs` : chaque fichier relu par **ffprobe natif** (codec, 2 canaux, 6,00 s) **×3 moteurs** ; Firefox renommait `.m4r` en `.m4a` (type `audio/mp4`) → type neutre |
| JPG to PDF / Image to PDF | iLovePDF, Smallpdf : JPG, PNG, BMP, GIF, TIFF | JPG, PNG (JPG to PDF) ; ce que le navigateur affiche (Image to PDF) | **HEIC (hors Safari par heic2any), WebP, GIF, BMP, TIFF (worker TIFF du site), AVIF** | `p21-jpg-to-pdf-formats.mjs` **×3 moteurs** (une page par image, à sa taille ; fichier abîmé nommé) |
| Merge PDF | Smallpdf : PDF + Word, Excel, PowerPoint, JPG, PNG | PDF seulement | **images** (dans le navigateur) et **documents Office** (même conversion que Word/Excel/PowerPoint to PDF ; seuls ces fichiers sont envoyés, la page et `/privacy` le disent) | `p21-merge-mixed.mjs` (§8) |
| Image Converter | iLoveIMG « Convert to JPG » : PNG, GIF, TIF, **PSD**, SVG, WEBP, HEIC, **RAW** ; CloudConvert / Convertio : CR2, CR3, NEF, ARW, DNG, ORF, RW2, RAF, PSD | refusés au sélecteur | **PSD / PSB** (image aplatie, ag-psd, MIT ; un PSD sans image aplatie → phrase qui dit comment l'enregistrer). **RAW non ajouté** : la version WebAssembly de LibRaw sur npm exige l'isolation inter-origines et bloque la construction Turbopack (mesuré) ; le fork mono-fil est trop récent pour être digne de confiance → plan D3 (compiler LibRaw nous-mêmes, 0 $, ≈ 2-3 h) | `p21-psd.mjs` (couleurs et taille exactes, PSD sans image aplatie) |

**Défaut réel trouvé en route (déjà sur www)** : sous **Firefox**, JPG to PDF et Image to PDF **tournaient sans fin**
sur tout WebP, GIF, BMP ou AVIF. Cause : l'`OffscreenCanvas` de Firefox a encore une ancienne méthode `toBlob()`
(dépréciée : elle renvoie une promesse et ignore le rappel) ; le code testait `canvas.toBlob ?` en premier et attendait
un rappel qui ne vient jamais. Corrigé (`checkedBlob`, qui essaie `convertToBlob` d'abord) ; aucun autre endroit du site
n'a ce motif (recherche dans tout le code). Le worker TIFF du site écrit aussi son PNG sans `OffscreenCanvas` quand il
manque.

**Licences vérifiées avant intégration (interdit n° 14)** : ag-psd MIT ; documents de test LibreOffice MPL-2.0 ;
libraw-wasm (ISC ; LibRaw LGPL-2.1 / CDDL-1.0) vérifiée puis **retirée** (voir ci-dessus).

## 8. Mises en production

### Lot 1 — phase 1 (02/10)
- Repère `restauration-avant-p21-02-10` = `23a9207c` (poussé). Branche `p21-02-10` ; préversion `preview/p21-phase1` =
  `e7275a14` → **`onlineconvertools-c4y0oenj4`**, lue par le relais local (jeton OIDC en mémoire, `vercel env run`
  depuis un dossier temporaire ; aucun fichier d'environnement lu ni affiché).
- **Préversion** : `p21-phase1` Chromium / Firefox / WebKit / iPhone (Chromium, WebKit) **tout vert** ;
  `download-guard --service` 147 / 147 / 135, WebKit iPhone 179, WebKit iPad 179, Chromium iPhone 193 : **ALL PASS** ;
  `all-pages-load` **238/238 ×3**.
- **Revue indépendante** (lecture seule) avant la fusion : rien de grave ; 9 remarques, toutes traitées (`e7275a14`) —
  fichiers préparés retirés quand la page est quittée et purgés après 30 min (vie privée), lien jamais périmé, 204 au
  lieu d'une page d'erreur, bandeau remplacé nettoyé, `keydown` retiré des gestes, délai max 30 s de l'affinage puis
  découpe d'avant, courbe d'alpha 0,1–0,9 (poils fins gardés ; mesurée : même qualité), phrases justes pour GIF / ICO /
  PDF / sans perte → sans perte / vidéo HEVC, pas d'explication pour « 0 % ».
- **Fusion** `git merge --no-ff` → **`90f3c4d3`**, poussée normale ; production **`onlineconvertools-h1uzcu8pb`** Ready.
  Retour arrière prêt : promotion de `onlineconvertools-f5lcugy1c` (production précédente).
- **Sur www** : `p21-phase1` **vert** sur les 5 configurations (rouge avant : fuite 66,5 %, lien non préparé, aucune
  explication) ; `download-guard` 147 / 147 / 135, iPhone 193 / 179, iPad 179 : **ALL PASS** ; 238 pages : voir
  ci-dessous. **Aucun retour arrière.**

## 9. À vérifier sur le vrai iPhone / Mac (propriétaire)

1. **JPG to PDF** avec une photo de l'iPhone : « Download » → la feuille « Télécharger » d'iOS, fichier dans Fichiers ›
   Téléchargements (plus d'ouverture du PDF). Idem sur une grosse image (Image Converter) et une vidéo.
2. **Background Remover** sur la même photo de tasse : plus de liseré bleu ni de halo dans l'anse ; si le morceau de
   fond en haut reste, c'est la segmentation (D1).
3. **Image Converter** JPG → PNG : la ligne « Normal for PNG… » sous le résultat.
