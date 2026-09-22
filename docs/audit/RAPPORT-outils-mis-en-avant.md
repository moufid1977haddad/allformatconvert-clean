# RAPPORT — Bloquant 5 : ouvrir réellement les outils mis en avant

**Date :** 22 septembre 2026 · **Branche :** `audit-outils-mis-en-avant` (balise `restore/avant-outils-mis-en-avant`) · **Banc :** `scripts/audit/featured/`

**Méthode.** Chaque outil a été ouvert dans un vrai Chromium (Playwright) sur la **production**, avec de vrais fichiers : un article arXiv de 15 pages, un PDF de 6 photos, de vraies photos, un vrai MP3, une vidéo 1080p, une vidéo verticale 1080×1920, de vraies archives TAR (Python, GNU, `tar.exe` de Windows). Chaque fichier téléchargé a été **rouvert** et mesuré : Poppler (pages, texte, rendu au pixel), PIL (format, taille, PSNR, canal alpha), ffmpeg (décodage complet, durée), jsQR/zxing (relecture des codes), `tarfile`/`zipfile` de Python (contenu, MD5). Les valeurs calculées sont comparées à un calcul exact. Les deux outils payants (Background Remover, Grammar Fixer) ont été testés **sur une préversion seulement** (interdit n° 8). Comparaison au marché : iLovePDF / iLoveIMG lancés anonymement dans le même navigateur, sur les mêmes fichiers.

> **Ce que ce rapport ne prouve pas.** Safari/iPhone (bloquant 9) ; les référentiels de format des concurrents quand ils sont « annoncés » (listes lues sur leurs pages, non éprouvées) ; ezgif (leur sortie refuse le téléchargement direct, seules leurs options sont observées).

---

## 0. Le vrai nombre d'outils

| Mesure | Chiffre |
|---|---|
| Dossiers d'outils sous `app/tools/*/*/page.*` | **225** |
| dont pages « Coming Soon » (noindex, hors sitemap) | 3 — `image-generator`, `pdf-to-excel`, `pdf-to-ppt` |
| **Outils qui fonctionnent** | **222** |
| dont slugs présents dans deux catégories (deux pages distinctes) | 4 — `base64-encoder`, `number-base-converter`, `url-encoder`, `video-to-gif` |
| Sitemap servi | 240 URL = 6 statiques + 12 catégories + 222 outils |
| Pages générées par le build | 247 routes (225 outils + 12 catégories + accueil, `/tools`, 8 pages légales/compte) |

Par catégorie (outils qui fonctionnent) : PDF **37** · Image **37** · GIF **11** · Audio **11** · Vidéo **15** · Fichiers **9** · QR & codes-barres **3** · Convertisseurs **4** · Développeur **57** · Maths **6** · IA **15** · Texte **17**.

**Le « 232 » n'existe pas** : il n'apparaît ni dans le code ni dans le HTML servi (seulement dans une couleur CSS `rgba(226,232,240)`). Le site affichait **« 225+ »** : faux deux fois (les 3 stubs étaient comptés, et le « + » annonçait plus que ce qui existe). « 185 » et « 225 » dans les anciens documents : périmés.

**Corrigé :** 222 partout, sans « + » (accueil, `/tools`, métadonnées, about, pages catégorie PDF/IA qui disaient 39 et 16). Une seule règle (`isComingSoonTool`, noindex) partagée par le compteur et le sitemap. **Le build échoue désormais** si un chiffre codé en dur diverge du compte réel (`scripts/check-tool-links.js`, prouvé sur 4 dérives provoquées). Retirés au passage : « **190+ Countries** » (aucune mesure — trafic réel nul) et « **No limits** » (faux : plafonds de taille, 5 conversions PDF/mois).
**Non touché :** `public/og-image.png` porte « 225 » gravé dans l'image — le régénérer relève de la préparation de lancement (règle absolue) : une commande (`node scripts/generate-og-image.js` après correction du texte), à ta décision.

## 1. Le périmètre : 36 outils

6 « Popular Tools » de l'accueil + les 36 noms cités sur les 12 cartes de catégorie (6 en commun) ; le pied de page n'en ajoute aucun (ses 5 liens sont déjà dans les Popular).

## 2. Verdicts

Légende : **FONCTIONNE** · **DÉGRADÉ** (fait le travail, mais inférieur au marché en qualité ou en couverture, ou avec un défaut visible) · **CASSÉ** (fichier/résultat faux). ✅ = corrigé dans cette passe et vérifié.

### PDF
| Outil | Verdict | Preuve |
|---|---|---|
| pdf-merge | **FONCTIONNE** | arXiv 15 p + PDF-photos 6 p → 21 p, rendu identique au pixel (PSNR 99). Couverture = iLovePDF (PDF seulement). |
| pdf-split | **DÉGRADÉ** (modes) | « 1-3, 5, 14-15 » → 3 fichiers exacts. Mais ni « chaque page », ni « toutes les N pages », ni ZIP, ni vignettes (iLovePDF : les quatre). Page honnête. |
| pdf-compress | **DÉGRADÉ** (qualité) | Même fichier : arXiv **−17,6 %** contre iLovePDF **−35,0 %** ; PDF de photos **−0,1 %** contre **−15,4 %**. Ne recompresse aucune image (divulgué). Sans perte (PSNR 99) ; iLovePDF 29,7 et 43,3 dB. |

### Images
| Outil | Verdict | Preuve |
|---|---|---|
| image-compressor | **CASSÉ silencieux → ✅** puis **DÉGRADÉ** | JPEG déjà compressé : **149 179 → 162 947 octets (+9 %)** livré « compressed.jpg » sans aucune taille affichée ; PNG transparent → **fond noir** (PSNR 0,8 dB sur blanc). Corrigé : fond blanc, taille vérifiée, refus + explication si pas plus petit, avant/après affiché, « without losing quality » retiré (44,5 dB mesurés : c'est avec perte). Reste : à PSNR égal (~44 dB) iLoveIMG est **~28 % plus léger** (209 Ko contre 289 Ko) ; toujours JPEG (iLoveIMG garde le PNG et sa transparence). |
| image-converter | **fond noir → ✅** ; **DÉGRADÉ** (couverture) | PNG transparent → JPG noir, **sans aperçu** avant téléchargement : corrigé (blanc). Sorties : WebP/PNG/JPG/AVIF, toutes du bon format (octets vérifiés). 4 sorties contre BMP/GIF/ICO/TIFF/PDF en plus chez CloudConvert/Convertio (annoncé). |
| image-resizer | **DÉGRADÉ** | Aucun verrou de proportions : largeur 879 → image **879×2000 déformée** ; sortie toujours PNG : JPEG de 491 Ko → **2,56 Mo** (×5,2). iLoveIMG : proportions verrouillées, format conservé. |
| image-upscaler | **DÉGRADÉ** (qualité) | ×4 d'une vraie photo réduite ×4 : netteté **1,27** contre **3,46** chez iLoveIMG (IA) et 3,97 à l'original ; PSNR 36,3 dB, **sous un bicubique simple** (37,3). Montage : `docs/audit/outils-mis-en-avant/upscaler-original-nous-iloveimg.png`. Honnête dans sa FAQ (« pas d'IA »), mais rangé dans **« AI Tools »** et sur la carte IA de l'accueil. |
| background-remover | **FONCTIONNE** (préversion) | Pleine résolution conservée (1335×2000, 2000×2000), vrai alpha ; qualité marché déjà mesurée (chantier détourage). |

### GIF / vidéo / audio
| Outil | Verdict | Preuve |
|---|---|---|
| video-to-gif (gif-tools) | **DÉGRADÉ** | Toujours depuis 0 s (pas de début), 10 s max, 15 i/s max, **résolution native** : 3 s de 1080p → **18,3 Mo**. ezgif (options observées) : début/fin, 14 tailles, recadrage. |
| mp4-to-gif | **DÉGRADÉ** (déforme) | Toile fixe **480×270** : vidéo verticale 1080×1920 **écrasée**, 4:3 aussi ; 10 images sur 5 s max (**2 i/s**). |
| gif-maker | **DÉGRADÉ** | GIF valide ; cadres étirés à la taille du 1ᵉʳ (divulgué), un seul délai, pas de redimensionnement (2,26 Mo pour 3 photos). |
| video-converter | **FONCTIONNE** | MOV et MP4 vertical → MP4 en production, durée et orientation conservées ; marché déjà mesuré (VMAF, 4 concurrents). |
| video-compressor | **FONCTIONNE** | idem. |
| video-trimmer | **FONCTIONNE** (limite annoncée) | 1→4 s demandé, 4,07 s livré (alignement image-clé, dit par la page). |
| audio-converter | **DÉGRADÉ** (1 format cassé) | 10/11 sorties décodées sans erreur par ffmpeg, durées exactes. **Opus échoue toujours** (« memory access out of bounds ») — message franc, mais format annoncé qui ne marche pas. |
| audio-trimmer | **FONCTIONNE** | MP3/M4A/WAV : 10,0 / 9,98 / 9,98 s pour 10 s ; secondes entières seulement. |
| voice-recorder | **FONCTIONNE** (Chromium) | WebM/Opus 3,0 s + export WAV. Safari : bloquant 9. |

### QR, fichiers, développeur, texte
| Outil | Verdict | Preuve |
|---|---|---|
| qr-generator | **FONCTIONNE** ; **DÉGRADÉ** (couverture) | Relu par jsQR à l'identique, UTF-8 compris ; PNG 400 px max, pas de couleurs, logo, niveau de correction ni types (Wi-Fi, vCard) — QR Code Monkey les a (annoncé). |
| qr-scanner | **FONCTIONNE** | PNG et photo floue inclinée de 17° relus à l'identique ; pas de caméra. |
| barcode-generator | **FONCTIONNE** ; **DÉGRADÉ** (couverture) | CODE128/EAN-13/UPC relus par zxing, checksums EAN faux refusés ; 5 symbologies. |
| zip-extractor | **FONCTIONNE** ; **DÉGRADÉ** (couverture) | Noms UTF-8 et chemin de 142 caractères corrects ; ZIP seul, pas de ZIP chiffré, pas de « tout télécharger ». |
| zip-creator | **FONCTIONNE** | Archive intègre (`testzip`), MD5 identiques. |
| tar-extractor | **CASSÉ silencieux → ✅** | Sur **tout TAR moderne** : en-têtes de métadonnées PAX/GNU proposés comme fichiers ; sur l'archive de `tar.exe` : **deux « été.txt »**, l'un ne contenant que `26 path=dossier/été.txt…` ; noms accentués perdus, chemins > 100 caractères tronqués. Nouveau lecteur : résultat **identique à `tarfile` de Python** (noms, tailles, MD5) sur 5 archives. |
| json-formatter | **CASSÉ silencieux → ✅** | `12345678901234567890` → `…7000`, `1.10` → `1.1`, `1e21` → `1e+21`. Maintenant : réindentation du texte d'origine, validation inchangée, erreur avec position. |
| xml-to-json | **CASSÉ silencieux → ✅** | Téléphone `0612345678` → `612345678`, code postal `01234` → `1234`, `0x1F` → `31`, `1.10` → `1.1`. Maintenant : texte exact. |
| hash-generator | **FONCTIONNE** ; **DÉGRADÉ** (couverture) | SHA-1/256/512 exacts ; **ni MD5** (le plus recherché) **ni hachage de fichier**. |
| word-counter | **DÉGRADÉ** | **8 phrases** annoncées pour 5 réelles (« e.g. », « 3.14 ») ; une phrase japonaise = 1 mot. |
| case-converter | **DÉGRADÉ** | « Sentence case » ne met la majuscule qu'à la **première** phrase ; Title Case naïf (« Of The », « J.r.r. »). |
| text-reverser | **DÉGRADÉ** | « Reverse Text » **casse les emoji** (demi-caractères UTF-16 orphelins → « � »). |

### Convertisseurs et maths
| Outil | Verdict | Preuve |
|---|---|---|
| currency-converter | taux justes ; **date mensongère → ✅** ; **DÉGRADÉ** (couverture) | 250 GBP→JPY = calcul exact depuis l'API. « Updated: » affichait **l'heure du navigateur** pour des taux publiés à 00:00 UTC → « Rates published: » + vraie date. **24 devises sur 166** disponibles dans la même API. L'API (v4) renvoie `WARNING_UPGRADE_TO_V6` : risque fournisseur (corollaire 3). |
| unit-converter | **résultats faux → ✅** ; **DÉGRADÉ** (couverture) | 1 mm = **« 0.0000 » mile** ; 1 km = **« 39370.1000 »** pouces pour 39370.0787. Corrigé : facteurs exacts par définition, chiffres significatifs, « ton » → « metric ton », « US gallon ». 6 catégories (ni temps, données, pression, énergie). |
| color-converter | **FONCTIONNE** ; **DÉGRADÉ** (couverture) | HEX/RGB/HSL justes ; ni HSV ni CMYK ; « zzz » laisse l'ancienne couleur affichée sans message. |
| number-base-converter | **résultats faux → ✅** | « 1012 » en binaire → **5** sans erreur ; 2⁶⁴−1 → hexadécimal **`10000000000000000`**. Corrigé (BigInt, chiffres invalides refusés) — aussi sur sa copie `developer-tools/`, même code. |
| percentage-calculator | **résultat faux → ✅** | 0,001 % de 5 = **« 0.00 »**. Corrigé. |
| roman-numeral-converter | **résultats faux → ✅** | « IM » → 999, « VX » → 5, « MMMM » → 4000. Seule la forme canonique est acceptée, message sinon. |

**Bilan des 36 :** 13 FONCTIONNE sans réserve de couverture · 23 avec un écart (qualité, couverture ou défaut visible) · **10 outils rendaient un fichier ou un résultat faux sans le dire — les 10 sont corrigés** (image-compressor, image-converter, tar-extractor, json-formatter, xml-to-json, number-base-converter, unit-converter, percentage-calculator, roman-numeral-converter, currency-converter pour la date).

## 3. Ce qui a été corrigé (classe silencieuse)

| Commit | Correctif | Preuve |
|---|---|---|
| `30235fe7` | image-compressor / image-converter : fond blanc, jamais un « compressé » plus lourd | préversion puis production, `verify-fixes.mjs` |
| `8b5d5645` | chiffres 222, « 190+ » et « No limits » retirés, garde-fou de build | idem + dérives provoquées |
| `609ba261` | tar-extractor : lecteur PAX/GNU/ustar | `scripts/tar-reader-tests/` 4/4 (archives réelles) |
| `46306611` | json-formatter sans perte ; xml-to-json texte exact | `scripts/json-text-tests/` 5/5 ; Node avec la même bibliothèque |
| `bf533569` | bases, unités, pourcentages, romains, date des taux | `scripts/exact-numbers-tests/` 10/10 |

La vérification en production est consignée en §7.

## 4. Chiffré, en attente de ta décision (rien de fait)

Estimations de temps = **estimations**, non mesurées. Classées par ce que je ferais d'abord (outils les plus mis en avant, écart le plus grand).

| # | Outil | Écart | Proposition | Coût estimé |
|---|---|---|---|---|
| 1 | pdf-compress | 2× moins efficace qu'iLovePDF, ~0 % sur PDF de photos | Passer par le service `pdf-tools` (Ghostscript déjà présent) avec 3 niveaux, calibrés sur les mêmes fichiers contre iLovePDF (Ghostscript `/ebook` mesuré : −90 % sur l'arXiv, mais PSNR 20 dB : trop destructeur tel quel) | 6-10 h |
| 2 | image-compressor | ~28 % plus lourd à qualité égale ; JPEG forcé | Encodeurs WebAssembly MozJPEG / OxiPNG / WebP (même mécanisme que l'AVIF déjà en place), format d'origine conservé, lot | 6-8 h |
| 3 | video-to-gif, mp4-to-gif | 18 Mo pour 3 s ; déformation ; 2 i/s | Utiliser le service ffmpeg déjà en production (`video-converter` sort déjà du GIF) : début/fin, largeur, i/s, proportions | 3-5 h |
| 4 | image-upscaler | Flou face à l'IA ; rangé dans « AI Tools » sans IA | (a) vrai modèle de super-résolution auto-hébergé comme le détourage (licence à vérifier — interdit 14), ou (b) le sortir de la catégorie IA (déplacement = accord requis) | (a) 8-12 h · (b) 30 min |
| 5 | image-resizer | Déformation, ×5 plus lourd | Verrou de proportions, format conservé, mode % | 1-2 h |
| 6 | audio-converter | Opus cassé | Diagnostiquer l'encodeur libopus de ffmpeg.wasm (paramètres) ; sinon retirer l'option | 1-2 h |
| 7 | pdf-split | Modes manquants | « chaque page », « toutes les N pages », ZIP | 3-4 h |
| 8 | text-reverser / case-converter / word-counter | Emoji cassés ; Sentence case faux ; phrases mal comptées, CJK | `Intl.Segmenter` (graphèmes, mots, phrases) ; casse par phrase | 2-3 h pour les trois |
| 9 | hash-generator | Ni MD5 ni fichiers | MD5, SHA-384, CRC32, hachage de fichier en Worker | 2-3 h |
| 10 | currency-converter | 24 devises / 166 ; API v4 dépréciée | Toutes les devises ; migrer vers une source durable (v6 ouverte ou BCE/Frankfurter — à vérifier en direct, interdit 15) | 1-2 h |
| 11 | qr-generator | 400 px, pas de couleurs/logo/types | Taille jusqu'à 2000 px, couleurs, niveau de correction, Wi-Fi/vCard | 3-4 h |
| 12 | image-converter | 4 sorties | BMP, GIF, ICO, TIFF, PDF | 3-4 h |
| 13 | grammar-fixer | Pas de surlignage des changements | Diff mot à mot | 2-3 h |
| 14 | barcode-generator | 5 symbologies | ITF-14, Codabar, MSI (déjà dans jsbarcode) ; 2D (DataMatrix, PDF417) | 2-4 h |
| 15 | zip-extractor | ZIP seul | RAR/7z/ZIP chiffré (libarchive en WebAssembly), « tout télécharger » | 4-6 h |
| 16 | unit-converter / color-converter | Catégories / espaces de couleur manquants | Temps, données, pression, énergie ; HSV, CMYK, message sur HEX invalide | 3-4 h + 1-2 h |
| 17 | gif-maker, qr-scanner, audio-trimmer | Options | Redimensionner/ajuster au lieu d'étirer ; caméra ; précision au dixième + fondus | 2-3 h chacun |

**Hors périmètre mais trouvé en route :**
- **`/api/ai` accepte l'instruction système envoyée par le navigateur** (Grammar Fixer l'écrit côté client) : n'importe qui peut s'en servir comme GPT généraliste, dans la limite des quotas. Recommandation : instructions côté serveur, par outil (1-2 h).
- `png-to-jpg` a le même fond noir (divulgué dans sa FAQ) ; `developer-tools/number-base-converter` corrigé avec son jumeau.
- `video-tools/video-to-gif` est absent de `app/lib/toolsRegistry.js` (donc des suggestions de la zone de dépôt de l'accueil) ; c'est un doublon de `gif-tools/video-to-gif` au comportement différent.
- Les 3 stubs sont listés sur les pages catégorie comme des outils normaux (« Convert PDF tables to Excel »), sans mention « Coming Soon » — voir §5.

## 5. Les trois stubs — ce que je recommande

**Le marché.** iLovePDF, Smallpdf, Adobe et FreeConvert ne publient pas de page d'outil vide : un outil apparaît quand il marche (observation de leurs catalogues ; aucun « coming soon » visible). Tous proposent PDF→Excel et PDF→PowerPoint ; ce sont des outils cœur de la famille PDF. Les générateurs d'images IA gratuits sont nombreux (Bing Image Creator, Ideogram, Craiyon…) et ce n'est pas un outil de conversion.

**Aujourd'hui** : pages honnêtes (noindex, hors sitemap), **mais** les cartes des pages catégorie PDF et IA les présentent comme des outils normaux : le visiteur clique « Convert PDF tables to Excel » et tombe sur « Coming Soon ».

| Stub | Construire | Coût de construction (estimé) | Coût d'usage |
|---|---|---|---|
| pdf-to-excel | ConvertAPI `pdf/to/xlsx` (existe, OCR inclus — page fournisseur lue le 22/09), même tuyau que `pdf-to-word` (envoi par morceaux, quota, garde de dépense déjà en place) | **4-6 h** + mesure de qualité contre iLovePDF sur 3 PDF à tableaux | ConvertAPI **0,01 $/conversion** mesuré (tarif forfaitaire relevé sur pdf-to-word) |
| pdf-to-ppt | ConvertAPI `pdf/to/pptx` (existe, OCR) | **3-4 h** une fois pdf-to-excel fait | idem |
| image-generator | API d'images OpenAI | 4-6 h | **0,011 / 0,042 / 0,167 $ par image** (faible/moyenne/haute, 1024², sources secondaires ci-dessous) ; **500 images moyennes ≈ 21 $ : épuisent seules le plafond global de 20 $/mois et bloquent les 15 outils IA, ConvertAPI et Adobe.** Et **`gpt-image-1` est annoncé retiré le 23/10/2026** (corollaire 3). |

**Recommandation :**
1. **Construire `pdf-to-excel` puis `pdf-to-ppt`** : demande réelle, moteur déjà sous contrat, tuyau existant, coût d'usage borné par les gardes actuelles. 7-10 h pour les deux.
2. **Retirer `image-generator` des listes** (carte de la page IA, menu) tout en gardant la page en noindex, ou le supprimer — **ta décision** (interdit n° 5). Le construire coûte peu en code mais expose le plafond de dépense et un modèle en fin de vie.
3. **En attendant**, si tu gardes les stubs listés : un badge « Coming soon » sur leurs trois cartes (≈ 15 min) pour que la carte ne promette plus un outil qui n'existe pas.

Sources des prix d'images : [OpenAI — GPT-Image-1](https://developers.openai.com/api/docs/models/gpt-image-1), [pricepertoken.com](https://pricepertoken.com/gpt-image-pricing), [costgoat.com](https://costgoat.com/pricing/openai-images). ConvertAPI : [pdf-to-xlsx](https://www.convertapi.com/pdf-to-xlsx), [pdf-to-pptx](https://www.convertapi.com/pdf-to-pptx).

## 6. `PROJET.md` — il faut le supprimer

Il est faux sur presque tout ce qu'il affirme : « plan Pro » (Hobby), dossier local `projet-recupere`, remove.bg (remplacé), « 12 catégories … Media Tools 28 », `/api/remove-bg`, « Ajouter AdSense après 6 mois ». L'inventaire réel vit maintenant dans `claude/plan-de-travail.md` (§ bloquant 5) et **le chiffre affiché est gardé par le build**. Un second inventaire manuel redériverait. **Recommandation : le supprimer** (je ne l'ai pas fait : ta décision).

## 7. Vérification en production

Déploiement de production `dpl_BXrZoKXqL8EPcToJrJoRm7i1oNJL` (commit `92d3a66c`, `master` avancé en avance rapide depuis la branche), en ligne ~50 s après le push. `scripts/audit/featured/verify-fixes.mjs` contre `https://www.onlineconvertools.com` : **16/16 PASS** — compresseur (refus d'un fichier plus lourd, tailles affichées, fond blanc), convertisseur (fond blanc), TAR PAX et `tar.exe` (vrais fichiers, vrais noms), JSON (64 bits, 1.10), XML (zéros initiaux), bases (1012 binaire invalide, 2⁶⁴−1 exact), unités (0.0000006213711922 mile, 39370.07874 pouces), pourcentage (0.00005), romains (IM refusé, MCMXCIV = 1994), devises (date de publication des taux), compteur 222, accueil sans « 225 »/« 190 »/« No limits », sitemap toujours 240 URL sans stub. Même script 16/16 sur la préversion avant la fusion.

Coûts engagés par l'audit : 2 appels payants sur préversion (Grammar Fixer ≈ 0,0002 $) + 2 détourages (service auto-hébergé) ; ~8 conversions vidéo sur le service ffmpeg (≈ 0,01 $).
