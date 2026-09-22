# PROGRESS — bloquant 5 : ouvrir les outils mis en avant (22/09/2026)

Branche `audit-outils-mis-en-avant`, balise `restore/avant-outils-mis-en-avant`.
Banc : `scripts/audit/featured/` (Playwright/Chromium réel, vrais fichiers, sorties rouvertes par Poppler/PIL/ffmpeg/jsQR).

## Vague 1 — FAITE
| Outil | Verdict | Preuve courte |
|---|---|---|
| pdf-merge | FONCTIONNE | arXiv 15 p + PDF-photos 6 p → 21 p, rendu identique au pixel (PSNR 99) |
| pdf-split | DÉGRADÉ (modes) | « 1-3, 5, 14-15 » → 3 fichiers exacts ; pas de « chaque page », d'intervalles fixes, de ZIP, de vignettes (iLovePDF oui) |
| pdf-compress | DÉGRADÉ (qualité) | −17,6 % / −0,1 % contre iLovePDF −35,0 % / −15,4 % sur les mêmes fichiers |
| image-compressor | CASSÉ silencieux → **corrigé** ; reste DÉGRADÉ | +9 % livré comme « compressed » ; fond noir ; ~28 % plus lourd qu'iLoveIMG à PSNR égal |
| image-converter | fond noir → **corrigé** ; DÉGRADÉ (couverture) | 4 sorties (WebP/PNG/JPG/AVIF) |
| image-resizer | DÉGRADÉ | pas de verrou de proportions (879×2000 déformé), sortie PNG toujours (491 Ko → 2,56 Mo) |
| background-remover | FONCTIONNE (préversion) | pleine résolution, alpha réel |
| grammar-fixer | FONCTIONNE (préversion) | 6 fautes sur 6 corrigées ; pas de surlignage des changements |
| qr-generator | FONCTIONNE ; DÉGRADÉ (couverture) | relu par jsQR à l'identique (UTF-8) ; 400 px max, ni couleurs ni logo ni types |
| video-to-gif (gif-tools) | DÉGRADÉ | toujours depuis 0 s, 10 s max, résolution native : 18,3 Mo pour 3 s de 1080p |

Correctifs vague 1 prouvés sur préversion (`verify-fixes.mjs`, 7/7 PASS) : compresseur (refus d'un fichier plus lourd, tailles affichées), fond blanc JPEG (2 outils), chiffres 222.

## Vague 2 — FAITE
| Outil | Verdict | Preuve courte |
|---|---|---|
| mp4-to-gif | DÉGRADÉ (déforme) | toile fixe 480×270 : vidéo verticale 1080×1920 écrasée, 4:3 aussi ; 10 images sur 5 s max (2 i/s) |
| gif-maker | DÉGRADÉ | GIF valide (3 photos) ; cadres étirés à la taille de la 1ʳᵉ (divulgué), pleine résolution 2,26 Mo, un seul délai |
| audio-converter | DÉGRADÉ (1 format cassé) | 10/11 sorties décodées sans erreur par ffmpeg ; **Opus échoue toujours** (« memory access out of bounds », message franc) |
| audio-trimmer | FONCTIONNE | MP3/M4A/WAV : 10,0 / 9,98 / 9,98 s pour 10 s demandées ; secondes entières seulement |
| voice-recorder | FONCTIONNE (Chromium) | WebM/Opus 3,0 s + export WAV 3,06 s |
| video-converter | FONCTIONNE | MOV et MP4 vertical → MP4 en production, orientation et durée conservées (marché déjà mesuré, VMAF) |
| video-compressor | FONCTIONNE | idem |
| video-trimmer | FONCTIONNE (limite divulguée) | 1→4 s demandé, 4,07 s livré (alignement image-clé annoncé par la page) |
| image-upscaler | DÉGRADÉ (qualité) | ×4 : netteté 1,27 contre 3,46 chez iLoveIMG (IA) et 3,97 à l'original ; PSNR sous un bicubique simple ; rangé dans « AI Tools » sans IA |
| qr-scanner | FONCTIONNE | PNG et photo floue inclinée de 17° relus à l'identique ; pas de lecture par caméra |

## Vague 3 — FAITE
| Outil | Verdict | Preuve courte |
|---|---|---|
| zip-extractor | FONCTIONNE ; DÉGRADÉ (couverture) | noms UTF-8 et chemin de 142 caractères corrects ; ZIP seul (pas RAR/7z/chiffré), pas de « tout télécharger » |
| zip-creator | FONCTIONNE | 3 fichiers, `testzip` OK, MD5 identiques aux originaux |
| tar-extractor | **CASSÉ silencieux → corrigé** | en-têtes PAX/GNU livrés comme fichiers, noms accentués perdus, chemins tronqués ; maintenant identique à `tarfile` de Python sur 5 archives |
| barcode-generator | FONCTIONNE ; DÉGRADÉ (couverture) | CODE128/EAN-13/UPC relus par zxing ; checksum faux refusé ; 5 symbologies |
| json-formatter | **CASSÉ silencieux → corrigé** | 12345678901234567890 → …7000, 1.10 → 1.1 ; maintenant sans perte (5 tests) |
| xml-to-json | **CASSÉ silencieux → corrigé** | 0612345678 → 612345678, 01234 → 1234 ; maintenant texte exact |
| hash-generator | FONCTIONNE ; DÉGRADÉ (couverture) | SHA-1/256/512 exacts (UTF-8, emoji) ; ni MD5 ni hachage de fichier |
| word-counter | DÉGRADÉ | 8 phrases annoncées pour 5 (« e.g. », « 3.14 ») ; japonais compté 1 mot |
| case-converter | DÉGRADÉ | « Sentence case » ne majuscule que la 1ʳᵉ phrase ; Title Case naïf |
| text-reverser | DÉGRADÉ | « Reverse Text » casse les emoji (demi-caractères UTF-16 orphelins) |

## Vague 4 — FAITE (6 outils)
| Outil | Verdict | Preuve courte |
|---|---|---|
| currency-converter | taux justes ; date mensongère → **corrigée** ; DÉGRADÉ (couverture) | 250 GBP→JPY = calcul exact ; « Updated » = heure du navigateur ; 24 devises sur 166 disponibles ; API v4 marquée « upgrade to v6 » |
| unit-converter | **résultats faux → corrigé** ; DÉGRADÉ (couverture) | 1 mm = « 0.0000 » mile ; 39370.1000 pour 39370.0787 ; 6 catégories |
| color-converter | FONCTIONNE ; DÉGRADÉ (couverture) | HEX/RGB/HSL justes ; ni HSV ni CMYK ; « zzz » laisse l'ancienne couleur sans message |
| number-base-converter | **résultats faux → corrigé** | « 1012 » binaire → 5 ; 2⁶⁴−1 faux |
| percentage-calculator | **résultat faux → corrigé** | 0,001 % de 5 = « 0.00 » |
| roman-numeral-converter | **résultats faux → corrigé** | IM → 999, MMMM → 4000 |
