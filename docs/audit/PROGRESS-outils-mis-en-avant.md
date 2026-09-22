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
