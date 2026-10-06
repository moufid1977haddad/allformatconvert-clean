# P36 — Réécriture des 12 pages de catégorie (06/10)

Fichiers modifiés : `app/tools/<catégorie>/page.jsx` et `app/tools/<catégorie>/layout.tsx` pour les 12 catégories.
Seules des chaînes de texte ont changé : descriptions des cartes, sous-titre sous le H1 (le compteur `{tools.length}` /
`{tools.filter(...).length}` est conservé), paragraphe « About », 4 étapes, 4 FAQ, 4 conseils, et dans `layout.tsx`
`title.absolute`, `description`, `openGraph.title`, `openGraph.description`. Aucune URL, aucun lien, aucun outil, aucune
classe ni logique touchés : l'arbre syntaxique (TypeScript), textes remplacés par un jeton, est identique à `HEAD` pour
les 12 `page.jsx` ; pour les `layout.tsx`, le diff ne contient que les 4 chaînes.

Sources des faits : `docs/audit/p36/faits/*.json` (fichier:ligne), pages d'outils réécrites (sections « specs »,
« privacy », FAQ), et vérifications dans le code : `lib/quota/limits.js` (25 MiB Whisper, 100 MiB Office, 200 MiB
Compress, 4 MiB seuil d'envoi par morceaux), `lib/quota/imageGen.js:13` (5 images/jour), `lib/quota/aiDetect.js:17`
(2 000 mots/jour), `lib/ai/pangram.js:18-19` (40-1 000 mots), `app/api/ai/route.ts:35` (1 000 jetons), `MAX_PROMPT_CHARS`
8 000, `app/tools/ai-tools/background-remover/page.jsx:21` (1 024 px), `app/tools/video-tools/video-merger/page.jsx:60`
(2e9 / 700e6 octets), `app/tools/image-tools/image-compressor` `MAX_FILES = 20`, routes gardées par `guardPaidRoute`
(ai, ai-image, ai-transcribe, ai-vision, remove-bg, word-to-pdf .docx, pdf-to-word/excel/ppt via `lib/pdfToOfficeRoute`),
AI Detector et Image Upscaler hors garde partagée (budgets propres). Limites dont la valeur est en variable
d'environnement (heure/jour par connexion, budget mensuel, service média) : décrites sans chiffre.

## Contrôles
- `node scripts/content-checks/privacy-claims.mjs` : 53 outils envoient des données ; **0 failure** (2 phrases corrigées
  en cours de route : « AI PDF Summary extracts the text on your device… » et « Other output formats are made in your
  browser… », rendues explicitement restreintes).
- `node scripts/content-checks/instructions.mjs` : 225 pages, 1 763 libellés, **0 mismatch**.
- Syntaxe : `ts.createSourceFile(...).parseDiagnostics` = 0 pour les 24 fichiers.
- Métadonnées : titres ≤ 60, descriptions 110-155, openGraph identique, 12 titres et 12 descriptions uniques.
- Aucune phrase des nouveaux textes n'est commune à deux pages de catégorie (hors « Yes. » / « No. »).

## Par catégorie (mots visibles de `page.jsx`, titres de cartes compris ; métadonnées à part)

| Catégorie | Titre (car.) | Méta (car.) | Mots page avant → après | Mots méta avant → après |
|---|---|---|---|---|
| ai-tools | 59 | 138 | 550 → 711 | 43 → 53 |
| audio-tools | 54 | 148 | 521 → 629 | 49 → 56 |
| converter-tools | 57 | 145 | 332 → 480 | 41 → 59 |
| developer-tools | 60 | 137 | 722 → 1 026 | 44 → 53 |
| file-tools | 60 | 149 | 408 → 548 | 46 → 57 |
| gif-tools | 53 | 127 | 451 → 583 | 48 → 62 |
| image-tools | 59 | 149 | 634 → 758 | 53 → 63 |
| math-tools | 58 | 140 | 330 → 438 | 45 → 46 |
| pdf-tools | 56 | 144 | 887 → 946 | 47 → 61 |
| qr-barcodes-tools | 41 | 151 | 362 → 441 | 60 → 65 |
| text-tools | 58 | 145 | 448 → 563 | 46 → 55 |
| video-tools | 53 | 152 | 500 → 654 | 47 → 56 |

La hausse vient surtout des cartes (58 descriptions sur Developer Tools) et de faits précis remplaçant des formules.

### ai-tools
Faux / invérifiable retiré : « comprehensive… powerful artificial intelligence utilities » ; étape « browse the home page
dashboard » ; « OpenAI does not use API data to train its models » (rien dans le dépôt) ; conseil « new AI tools are
frequently added » ; carte Data Extractor « from documents » (texte collé seulement). Ancienne FAQ des limites imprécise :
AI Detector et Image Upscaler n'utilisent PAS l'allocation partagée (budgets propres) — corrigé. Ajouté : 13 outils →
OpenAI, AI Detector → Pangram, Background Remover → copie JPEG ≤ 1 024 px vers notre service, Upscaler sur l'appareil
avec WebGPU sinon notre serveur ; limites 8 000 caractères / 1 000 jetons / 40-1 000 mots.

### audio-tools
Retiré : « supports all major audio formats… seamless conversion » ; conseil « Batch process multiple audio files
simultaneously » (faux : un fichier par passage, sauf Merger) ; « audio preview feature » ; « stable internet connection
… large file uploads » (la plupart n'envoient rien) ; « especially on phones » (non mesuré) ; « deleted as soon as you
have downloaded » (incomplet : ou après un délai) ; carte Metadata « any audio file ». Ajouté : exceptions Opus (service
média, libopus, compte par connexion et par heure/jour, une tâche par partie dans Splitter) et Audio to Text (OpenAI ;
micro = service vocal du navigateur), 25 MB.

### converter-tools
Retiré (faux) : « instantly converts between multiple file formats… images, documents » et FAQ « supports PDF, JPG, PNG,
MP4, DOCX » (la page n'a que 4 convertisseurs) ; **« your amount and currencies are never sent »** — faux : le graphique
d'historique envoie les deux codes de devise à Frankfurter (`RateHistory.jsx:51`) ; « Convert button », « dropdown »,
conseils « batch conversion », « preview », « clear your browser cache ». Méta « instantly… file formats » remplacée.

### developer-tools
Retiré (faux) : « debugging and performance analysis » (aucun outil de ce type) ; « supports Java, C++, PHP, Ruby… » ;
conseils « batch processing », « keyboard shortcuts », « documentation and tutorial section » (inexistants) ; carte
« Generate secure passwords » (invérifiable). Cartes précisées (CSS Formatter minifie aussi ; SQL to CSV = lignes
INSERT ; Cron Expression vs Builder distingués). Ajouté : API Tester seul à envoyer (vers l'adresse saisie), CORS.

### file-tools
Retiré (faux) : « convert, compress… documents, images, videos » et FAQ « PDF, Word, Excel, images, videos, audio » ;
« accessible from any device » ; conseils « batch upload », « compress heavy documents… faster processing », « preview
feature », « keyboard shortcuts » ; cartes « Compare two files side by side » (c'est un verdict octet par octet),
« Encode and decode Base64 » (l'outil fichier encode seulement), « Convert files to different formats » (texte seulement).
Ajouté : limites 5 GB (Splitter), 700 MB / 100 MB (ZIP Creator), 1,9 GB / 300 MB (ZIP Extractor), « phones, iPhone and
iPad » (règle `isMobileDevice`).

### gif-tools
Retiré (faux) : édition de GIF existants (« removing frames, adding text, applying filters, resizing ») ; carte GIF to
MP4 « MP4/WebM » (MP4 seulement) ; « 100% free » ; « generous size limit » ; conseils « 600x600px for social media »,
« 50-100ms », « batch processing ». Omission corrigée : les 5 outils vidéo→GIF envoient la vidéo à notre service média
(supprimée en fin de traitement, GIF supprimé après lecture par la page ou délai), compte par connexion, 60 s, 1 GB.

### image-tools
Retiré : « professional-grade results instantly », « 100% free », « virtually any image type », « share it directly with
others using the provided links » (faux, aucun lien de partage), « any device », conseil « batch processing… multiple
images » (3 outils seulement acceptent plusieurs fichiers : Compressor, Converter, Duplicate Finder — vérifié par
`multiple` dans le code), « WebP… without sacrificing quality ». Méta : 37 outils (compte des cartes).

### math-tools
Retiré (faux) : « algebra, geometry, calculus » ; « step-by-step solutions » (Fraction Calculator seulement) ; « sharing
options / copying the URL » ; « Click the 'Calculate' button » (3 outils calculent à la frappe) ; « fully responsive…
seamlessly » ; « 100% free » ; méta « solve complex problems instantly ». Ajouté : précision (12 / 10 chiffres, exact),
1-3999, 23 statistiques.

### pdf-tools
Retiré : « work instantly » ; **« deleted… automatically after 15 minutes at most »** (durée en variable d'environnement,
pas dans le code) ; chiffres 700/100/99/60/45 MB non revérifiés (la FAQ renvoie à la limite affichée par chaque page,
avec deux chiffres prouvés : 200 MB Compress, 100 MB Word/PowerPoint) ; **« tools that run on our servers have an hourly
and daily limit per connection »** — inexact : Gotenberg/pdf-tools en envoi direct (≤ 4 MB) n'ont pas de compte ;
corrigé (ConvertAPI + AI PDF Summary = allocation partagée + budget ; > 4 MB = compte du service média) ; « fully
responsive » ; conseil « batch process ». Cartes : PDF Forms « create » (faux), Crop « resize » (faux), Translate « any
language » (invérifiable), Sign « electronic signature » (c'est une image). Ajouté : repli iPhone/iPad des 4 outils
(OCR, Redact, PDF to Image, PDF to JPG), Google Cloud Translation pour Translate « whole PDF ».

### qr-barcodes-tools
Retiré : « instantly », « manage QR codes » ; FAQ « calendar events » (type inexistant) ; « advanced features may include
analytics in future updates » ; « Generate QR codes instantly ». Ajouté : codes statiques sans redirection, 37 types,
5 000 par ZIP/planche, CSV ≤ 5 MB, 20 codes par image, caméra = QR seulement.

### text-tools
Retiré : « powerful », « instantly », « fast and efficient », « ensuring complete privacy and security » ; carte « Find
and replace text instantly » ; conseil « share it with colleagues ». Ajouté : aperçu au-delà de 1 000 000 caractères,
stockage local de Sticky Notes, AES-256-GCM / PBKDF2 600 000, `$1` en remplacement regex (`find-replace/page.jsx:56`).

### video-tools
Retiré : « professional-grade functionality » ; « all major video formats including WMV, FLV » ; « any modern browser » ;
conseils « batch processing », « compress before uploading to speed up processing », « filters… to enhance video
quality » ; carte Subtitle Generator « Generate subtitles » (trompeur : saisie manuelle) ; « no watermark » non répété ;
suppression « right after your download » complétée (« or when the job expires »). Ajouté : liste exacte des outils et
modes qui envoient au service média, 1 GB, 300/100 MB (Trimmer), 2 GB / 700 MB (Merger), 2 min (Watermark), rotation sans
réencodage (MP4/MOV/M4V/3GP/3G2), Screen Recorder indisponible sur iPhone/iPad.

## Points laissés de côté / à surveiller
- Les mots ont augmenté (sections FAQ/conseils gardées à 4 éléments pour ne pas toucher la structure).
- `app/tools/image-tools/layout.tsx` a maintenant des fins de ligne LF dans la copie de travail (index en LF, Git les
  normalise ; aucun effet sur le contenu).
- Non vérifié dans le code : capacité des formats Whisper (renvoyé à OpenAI), durée max du service média (variable).
