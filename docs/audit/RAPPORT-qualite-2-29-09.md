# Audit qualité n° 2 du 29/09 — outils encore non audités (bloquant 5)

Branche locale **`qualite-2-29-09`** (créée depuis `master`), **non poussée, non déployée** — le propriétaire déploiera
(P14). Aucun appel au service média de production ni à www pendant la session ; aucun appel IA payant (le service IA
et le service de rendu PDF sont **joués par les tests**, routes interceptées).

**Méthode (identique au 29/09)** : cas limites réalistes ; comparaison à un oracle (bibliothèque de référence,
spécification ou concurrent de référence) ; **défaut reproduit sur le build d'avant la correction**, correction, test
ajouté au dépôt, textes de page faux corrigés ; qualité **et** couverture face aux concurrents (recherche des
concurrents avant chaque choix, décision prise sans la soumettre au propriétaire).

## 1. Résultat

- **76 outils audités** : la liste nominative du bloquant 5, plus quatre filtres image déjà audités qui partageaient
  le défaut de format (Brightness-Contrast, Blur, Cropper, Rotate) et Video Filter / Video Resizer qui partageaient
  celui de Video Rotator. 11 outils développeur/texte relus sans défaut ; 8 autres audités sans défaut.
- **57 outils corrigés**, dont **30 rendaient un résultat faux ou incomplet sans avertissement** (marqués **Faux**
  ci-dessous), **1 faille** (Markdown to PDF : le HTML du fichier s'exécutait sur l'origine du site) et des textes de
  page faux (PDF OCR, File Metadata, GIF to MP4, Grayscale, Image to GIF, MOBI to EPUB). Le reste : écarts de qualité
  ou de couverture face aux concurrents, comblés (limiteur, PDF interrogeable, WebVTT, choix de page et de coin…).
- Chaque défaut a été **reproduit sur le build d'avant sa correction** (contrôle en échec), puis corrigé.
- **Tests ajoutés** : 5 bancs navigateur (`scripts/browser-tests/image-audit-2.mjs`, `gif-audit-2.mjs`,
  `pdf-audit-2.mjs`, `av-audit-2.mjs`, `misc-audit-2.mjs`, 76 contrôles au total) et 3 suites Node
  (`scripts/converter-tests/12-pdf-unlock.mjs`, `13-pdf-organize.mjs`, `14-subtitles.mjs`), plus un générateur de MOBI
  avec image (`scripts/browser-tests/fixtures/make-mobi-with-image.mjs`).
- **Commits** (locaux) : `d7dc1965`, `59cfd3d3` (image), `81bc6f1e` (GIF), `6a0a3c9c` (PDF), `c2eb2c19`
  (audio/vidéo), `8104d90b` (fichiers, MOBI to EPUB, IA), plus le commit de ce rapport.

## 2. Tableau par outil

« Faux » = résultat faux ou incomplet livré sans avertissement. Preuve = contrôle qui échouait avant la correction et
passe après (banc : nom du fichier ; « lu » = relu sans défaut trouvé).

| Outil | Audité | Défauts trouvés | Corrigés | Preuve |
|---|---|---|---|---|
| Add Border | oui | **Faux** : le cadre repeignait les zones transparentes du logo | oui | image-audit-2 |
| Grayscale | oui | **Faux** : moyenne simple (bleu pur → 85) au lieu de la luminance Rec. 709 (→ 18) ; texte | oui | image-audit-2 (oracle : filtre CSS du navigateur) |
| Image Pixelator | oui | **Faux** : pixel d'angle au lieu de la moyenne annoncée | oui | image-audit-2 |
| Round Corners | oui | **Faux** : coins quadratiques (~6 % d'écart), pas des arcs | oui | image-audit-2 |
| Image Editor | oui | **Faux** : rotation 90° rognée ; « Corner radius » sans effet ; pixelisation au pixel d'angle | oui | image-audit-2 |
| 13 filtres (Add Border, Add Noise, Add Vignette, Grayscale, Inverter, Sepia, Pixelator, Flip, Add Text, Brightness-Contrast, Blur, Cropper, Rotate) | oui | toujours un PNG (divulgué : un JPEG de 2 Mo devenait un PNG bien plus lourd ; iLoveIMG/Pinetools gardent le format) | oui | image-audit-2 (JPEG reste JPEG) |
| Duplicate Image Finder | oui | **Faux** : « No duplicates found! » avant toute recherche ; copies redimensionnées/ré-enregistrées manquées | oui (SHA-256 + dHash) | image-audit-2 |
| Image Comparison | oui | images recadrées (object-cover) ; aucune vue des différences (Diffchecker en a une) ; division par zéro à 0 % | oui | image-audit-2 (4 pixels sur 400) |
| Image to Base64 | oui | **Faux** : `data:application/octet-stream` pour un type inconnu | oui | image-audit-2 |
| WebP to PNG | oui | **Faux** : WebP animé réduit à sa 1re image sans le dire | oui (avertissement) | image-audit-2 |
| BMP to PNG | oui | **Faux** : l'échec du contrôle de sortie était effacé à la ligne suivante (ni résultat ni message) | oui | lu + build |
| JPG to PNG, HEIC to JPG/PNG, TIFF to JPG/PNG | oui | aucun (HEIC : dimensions 1280×854 = boîte `ispe` ; TIFF traité le 16/09) | — | lu, sample.heic |
| APNG to GIF | oui | **Faux** : transparence → noir ; APNG joué une fois → GIF en boucle infinie | oui | gif-audit-2 (gifuct-js) |
| Image to GIF | oui | **Faux** : transparence → noir ; images étirées (divulgué) → ajuster / rogner / étirer | oui | gif-audit-2 |
| GIF to MP4 | oui | **Faux** : dernière image écourtée (GIF 0,6 s → MP4 0,4 s, pause finale perdue) ; texte « 1 px rogné » faux | oui | gif-audit-2 (ffmpeg natif) |
| GIF Compressor | lu | aucun | — | lu |
| PDF Redact | oui | **Faux** : phrase coupée par un changement de police ou un retour à la ligne **laissée dans le fichier** ; valeur de champ de formulaire laissée ; ligne entière noircie au lieu de la phrase | oui | pdf-audit-2 |
| PDF Crop | oui | **Faux** : marges prises depuis (0,0) de la MediaBox (CropBox existante annulée, MediaBox décalée mal rognée, « haut » faux sur page tournée) ; marges trop grandes acceptées | oui | pdf-audit-2 |
| PDF Unlock (+ lib/pdfDecrypt des 10 outils PDF) | oui | **Faux** : signets, champs de formulaire, infos du document perdus | oui | pdf-audit-2, 12-pdf-unlock (7/7), 10-encrypted-pdf (6/6) |
| PDF to HTML | oui | **Faux** : texte non échappé (« a < b » disparaissait, `<b>` devenait du balisage), retours à la ligne perdus | oui | pdf-audit-2 |
| PDF Sign | oui | **Faux** : fond gris opaque masquant le texte dessous ; signature étirée d'un tiers ; tracé décalé du pointeur ; coin faux sur page tournée ; pas de choix de page (Smallpdf) | oui | pdf-audit-2 |
| PDF Forms | oui | **Faux** : valeurs existantes effacées ; cases/radios/listes ignorées en silence ; aplatissement imposé ; formulaires à restrictions refusés | oui | pdf-audit-2 |
| PDF Organize | oui | **Faux** : formulaire (AcroForm) et titre perdus | oui (pages retirées toujours absentes) | pdf-audit-2, 13-pdf-organize (3/3) |
| Markdown to PDF | oui | **Sécurité** : le HTML du Markdown s'exécutait sur l'origine du site ; fenêtre bloquée par Safari | oui (iframe sandbox) | pdf-audit-2 |
| PDF OCR | oui | pas de PDF interrogeable (iLovePDF/PDF24 en donnent) ; texte faux « les erreurs d'OCR sont toujours visibles » ; précision mesurée 0,8 % CER à 7 pt | oui | pdf-audit-2 |
| EPUB to PDF | oui | **Faux** : couverture SVG et images CSS en `blob:` (page blanche) ; couverture en double | oui | pdf-audit-2 (service joué) |
| MOBI to PDF | oui | même défaut (code partagé `lib/ebookHtml.js`) | oui | misc-audit-2 (service joué) |
| PDF AI Summary | oui (code) | ancien résumé laissé après un échec ; PDF à mot de passe et réponse 504 illisibles | oui | lu ; qualité du résumé → appel payant (plan) |
| Audio Waveform | oui | **Faux** : canal gauche seul (son à droite = ligne plate) ; dessin à l'envers | oui | av-audit-2 |
| Audio Booster | oui | écrêtage (66,7 % des échantillons d'une sinusoïde 0,5 ×4) ; limiteur ajouté (mp3louder) | oui | av-audit-2 (0 %) |
| Video Rotator / Filter / Resizer | oui | **Faux** : pause ou lecture qui cale pendant le traitement → fin coupée, 2 s d'image figée | oui (`lib/recordPlayback.js`) | av-audit-2, mediarecorder-tools (vert) |
| Video Watermark | oui | **Faux** : texte blanc invisible sur une vidéo claire ; rotation téléphone vérifiée correcte | oui | av-audit-2 |
| Subtitle Generator | oui | **Faux** : « 00:00:05.500 » → SRT invalide ; pas de ms ; fin avant début acceptée ; pas de WebVTT | oui | 14-subtitles (4/4) |
| Screen Recorder | oui | aperçu en direct toujours noir | oui | av-audit-2 |
| File Comparator | oui | gros fichiers chargés en entier ; pas de position ; verdict périmé affiché | oui | misc-audit-2 |
| File Metadata | oui | **texte faux** (« vérifier une extension changée » avec un type tiré du nom) ; nom sans point = « extension » | oui (signatures) | misc-audit-2 |
| File to Base64 | oui | **Faux** : `octet-stream` ; pas de Base64 brut ; onglet figé sur gros fichier | oui | misc-audit-2 |
| MOBI to EPUB | oui | **Faux** : toutes les images et feuilles de style introuvables (chemins sans `../`) ; TOC « Chapter N » | oui | misc-audit-2 (MOBI généré + sample.mobi) |
| AI Chatbot | oui (code) | **Faux** : chaque message envoyé seul, sans la conversation affichée ; retours à la ligne perdus | oui | misc-audit-2 (service joué) |
| AI Detector | oui (code) | estimation affichée sans sa mise en garde ; 504 illisible | oui | misc-audit-2 |
| AI Paraphraser, Translator, Writer, Data Extractor, Email Generator, Keyword Extractor, Sentiment Analyzer, Text Summarizer | oui (code) | réponse non JSON (504) → « Unexpected token » | oui (`lib/aiClient.js`) | misc-audit-2 (même chemin) |
| Audio Transcriber, Image Generator | oui (code) | aucun dans le code (erreurs, limites, textes) | — | lu ; qualité → appel payant (plan) |
| Password / UUID Generator, Regex Tester, Unicode Converter, URL Encoder (×2), Color Picker, Sticky Notes, Text Repeater, Text to List, Whitespace Remover | lu | aucun (CSPRNG, UUID v4 correct, paires de substitution, `matchAll` sans boucle, `%` mal formé intercepté) | — | lu |

## 3. Reste non audité / à faire plus tard

- **Appels payants à faire avec le propriétaire** (inscrits au plan) : qualité des sorties IA (résumé PDF dans la
  langue du document ? chatbot avec le contexte envoyé ; détecteur IA : taux d'erreur sur un corpus humain/IA) ;
  Audio Transcriber (et export SRT/VTT que Whisper sait produire) ; Image Generator.
- **Écarts de couverture connus, non traités** : Organize ne garde pas les signets ; Sign sans placement libre à la
  souris ni signature tapée/importée ; Password Generator ne garantit pas un caractère de chaque classe cochée ;
  URL Decoder ne traite pas « + » comme espace ; Text to PDF latin seulement (déjà au plan).
- **Safari réel** (P1) : Sign (tracé au doigt), Forms, OCR (PDF interrogeable), Markdown (impression depuis une iframe
  sandbox), Screen Recorder, Video Rotator/Filter/Resizer (pause).

## 4. Tests de fin de session (build local final, `next start`, commit `8104d90b` + ce rapport)

| Banc | Chromium | Firefox | WebKit |
|---|---|---|---|
| `image-audit-2.mjs` | 13/13 | 13/13 | 13/13 |
| `gif-audit-2.mjs` (ffmpeg natif) | 11/11 | 11/11 | 11/11 |
| `pdf-audit-2.mjs` | 26/26 | 26/26 | 26/26 |
| `av-audit-2.mjs` (ffmpeg natif) | 11/11 | 10/10 (Screen Recorder : Chromium seul) | 2/2 exécutables ; 7 non exécutables dans le WebKit de Playwright sous Windows : pas d'`AudioContext` (Waveform : la page le dit), pas de MediaRecorder (Rotator/Filter/Resizer : la page refuse d'emblée, bouton désactivé), vidéos non chargées (Watermark) → **Safari réel, P1** |
| `misc-audit-2.mjs` | 15/15 | 15/15 | 15/15 |
| `mediarecorder-tools.mjs` (régression du 29/09) | vert | — | — |
| Node : `10-encrypted-pdf` 6/6 · `12-pdf-unlock` 7/7 · `13-pdf-organize` 3/3 · `14-subtitles` 4/4 | | | |
| **238 pages** du build local (`all-pages-load.mjs`) | 238 propres | 238 propres | 238 propres |

Deux corrections de banc en fin de session (pas des défauts d'outil) : tolérance de ±3 niveaux sur une couleur
rééchantillonnée (Firefox rend 254 où Chromium rend 255) ; capture du HTML envoyé au service de rendu faite dans la
page (le WebKit de Playwright ne transmet pas la partie fichier d'un envoi multipart à `route()`).
Tous les processus node et relais arrêtés en fin de session (0 restant, rien n'écoute sur 3140).

## 5. Ménage GitHub (fait en début de session)

Les trois branches de préversion ont été supprimées après vérification que leur pointe était dans `master`
(0 commit hors master). Restauration, si besoin :

```
git push origin 3ef3b079493c38cf5f919750d0e244a7042f76f7:refs/heads/deploiement2-29-09
git push origin 5e369f5cf7fd0fbd3e266707c81755b473387c72:refs/heads/croissance-29-09-preview
git push origin 36da35b65a81991e0742b0e58514e16e9cd1dc1c:refs/heads/qualite-29-09-preview
```
