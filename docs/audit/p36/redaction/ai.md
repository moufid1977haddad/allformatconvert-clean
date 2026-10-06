# P36 — Rédaction du lot « ai » (16 outils, `app/tools/ai-tools/*`)

Fichiers modifiés :
- 16 `page.jsx` : seulement les props de `<SeoContent>`, plus des imports nommés ajoutés sans effet sur le comportement ;
- 15 `layout.tsx` : seulement title, description et openGraph. Celui d'image-generator est inchangé, son titre et sa méta étaient déjà exacts.

Preuves des nombres écrits en dur : `docs/audit/p36/preuves/ai.json`. Base des affirmations : `docs/audit/p36/faits/ai.json` et
`docs/audit/p36/audit/ai.md`. Aucun secret lu, aucun appel payant, aucun serveur.

## Contrôles (lancés le 06/10, après la dernière modification)
- `node scripts/p36/content-verify.mjs --only=ai-tools/` → **16 pages, 16 réécrites, 0 défaut**. La plus forte part de phrases identiques sur le site est de 14,3 % (pdf-to-excel / pdf-to-word, hors lot). Pour ce lot, le maximum est de 7,4 % (paraphraser / summarizer) au premier passage.
- `node scripts/content-checks/instructions.mjs` → 225 pages, 1 733 libellés, **0 écart**.
- `node scripts/content-checks/privacy-claims.mjs` → 53 outils qui envoient des données, **0 défaut**.
  - Au premier passage, 21 phrases du lot étaient refusées : elles disaient « dans le navigateur » sans nommer l'envoi dans la même phrase.
  - Toutes ont été réécrites pour nommer l'envoi dans la phrase même, exemple : « …never leaves your device; only a reduced JPEG copy is sent to our server ».

## Imports ajoutés (lecture de constantes, aucun changement de logique)
- **9 outils texte** (paraphraser, translator, writer, data-extractor, email-generator, grammar-fixer, keyword-extractor, sentiment-analyzer, text-summarizer) : `MAX_PROMPT_CHARS` depuis `@/lib/quota/limits`.
- **ai-detector** : `CHARS_PER_BILLABLE_WORD` depuis `@/lib/ai/pangram`.
- **image-captioner** : `VISION_MAX_SIDE` depuis `app/lib/imageForVision`.
- **audio-transcriber** : `OFFICE_STAGED_THRESHOLD_BYTES` depuis `@/lib/quota/limits`.

Toutes les tailles, longueurs et limites sont calculées dans des gabarits `${…}` à partir de ces constantes et de celles que les pages
avaient déjà (`MAX_MB`, `PER_DAY`, `MAX_CHARS`, `SIZES`, `MAX_INPUT_PIXELS`, `MAX_FILE_BYTES`, `RESIZE_TARGET_PX`,
`MAX_REMOVEBG_ORIGINAL_BYTES`, `AI_DETECT_*`, `languages`, `tones`, `audioMaxLabel()`). Audio Transcriber affiche donc 25 MB
sur www, où `NEXT_PUBLIC_MEDIA_SERVICE_URL` est défini.

Les nombres écrits en dur sont tous prouvés dans `preuves/ai.json` :
- « 1,000 tokens » : `max_tokens: 1000` dans `app/api/ai/route.ts` ;
- « 10 Languages » : la liste `languages` de la page ;
- « 5 free images a day » : `lib/quota/imageGen.js` ;
- « 2x or 4x », « 2× or 4× », « -upscaled-2x or -upscaled-4x » et « 3000×2000 » : la page de l'upscaler ;
- « Safari 16.4 or later » : `app/lib/bigImage.js` ;
- « 96–98 % » : `RAPPORT-ai-detector-30-09.md` ;
- les chiffres de Grammar Fixer : `RAPPORT-deploiement-28-09.md`.

## Chaîne d'interface corrigée (une seule)
- `ai-translator/page.jsx`, sous-titre sous le H1 : « Translate text to any language with AI » (FAUX : il n'y a que 10 langues) devient
  « Translate text into {languages.length} languages with AI ».

Laissées telles quelles, car jugées INVÉRIFIABLES et non FAUSSES (la consigne n'autorise que la correction des phrases fausses) :
- le sous-titre de Background Remover « Remove any background instantly with AI » ;
- le sous-titre d'Image Generator « …get it in seconds… » ;
- son bouton « Generating… (about 10–30 seconds) ».

À trancher par le propriétaire.

## Règles appliquées à tout le lot
- **Limites d'usage** :
  - outils sous la garde partagée : limite par connexion par heure et par jour, partagée entre les outils IA, plus un budget mensuel du site, sans chiffre (valeurs en variables d'environnement) ;
  - outils à limites propres : 2 000 mots/jour du détecteur et 5 images/jour du générateur, calculés depuis les constantes ; budget mensuel propre du détecteur, du générateur et de l'upscaler cité sans montant.
- **Aucun classement ni superlatif.** J'ai retiré :
  - « among the highest-rated image models » ;
  - « the fewest false accusations » ;
  - « leading online upscaler » et la comparaison LPIPS avec iLoveIMG ;
  - « instantly », « in one click », « in seconds ».
- **Jumeaux sans phrase commune** (C7 = 0 défaut sur tout le site) :
  - audio-transcriber : fichier seulement, démarrage automatique, SRT/VTT ; il renvoie vers Audio to Text pour la dictée au micro ;
  - ai-translator : texte collé, 10 langues ; il renvoie vers PDF Translate pour un fichier ;
  - text-summarizer : texte collé ; il renvoie vers AI PDF Summary pour un PDF.
- **Exemples** : les outils texte du lot passent tous par OpenAI. Produire une vraie sortie aurait exigé un appel payant, interdit, donc **aucun exemple inventé**. Une seule page reçoit un exemple, mesuré et daté : AI Detector. Le résumé LIGO 2016 a été jugé « Likely written by a person », 0 % d'IA, le 30/09/2026 (`RAPPORT-p17-30-09.md:69`).

## Par outil
Mots visibles avant / après : « avant » = `seoWords` de `contenu-avant.json`, « après » = estimation sur le source (gabarits comptés comme un mot). Les longueurs sont en caractères.

| Outil | Titre (long.) | Méta (long.) | Mots avant → après | Défauts de l'audit supprimés |
|---|---|---|---|---|
| ai-chatbot | AI Chatbot — Free GPT-4o mini Chat That Keeps the Thread (56) | 136 | 401 → 540 | graphie « Openai's Gpt-4o », « instant answers », « streamed back », FAQ 1 incomplète, astuces 1-3 génériques |
| ai-detector | AI Detector — AI, Mixed or Human Verdict via Pangram (52) | 138 | 433 → 586 | « many other languages », budget mensuel non dit, « splits into segments », « 1,000 words (12,000 characters) », liste d'écritures incomplète (remplacée par la règle exacte du compteur) |
| ai-paraphraser | AI Paraphraser — Reword Text, Keep the Meaning (46) | 141 | 324 → 458 | graphie, FAQ « truncated » (refus au-delà de la limite), FAQ compte, astuces génériques, page mince |
| ai-translator | AI Translator — Translate Text into 10 Languages (48) | 143 | 320 → 474 | titre « Translate AI », sous-titre « any language », « detects the language », « handles technical vocabulary well », astuces génériques, page mince |
| ai-writer | AI Writer — Draft Text from a Short Description (47) | 140 | 313 → 430 | graphie, usage commercial (invérifiable), « within a few seconds », génériques, page mince |
| audio-transcriber | Audio Transcriber — Audio File to Text, SRT and VTT (51) | 145 | 363 → 534 | « editable transcript », « 4 MB — the maximum Whisper accepts », « sent directly », « most other formats », « works well for interviews », génériques |
| background-remover | Background Remover — Transparent PNG at Full Resolution (55) | 138 | 356 → 548 | « instantly… in one click », « Perfect for… », FAQ gratuité sans limites, formats « JPG and PNG », FAQ logiciel/compte, astuce « higher-resolution source » (fausse), génériques |
| data-extractor | Data Extractor — Pull Names, Dates and Prices from Text (55) | 137 | 358 → 485 | FAQ 1 incomplète, « no direct file download » (oubliait le .txt), génériques, page mince |
| email-generator | Email Generator — AI Email Drafts in Five Tones (47) | 139 | 309 → 413 | FAQ 1, « suitable for both personal and professional », FAQ compte, génériques, page mince |
| grammar-fixer | Grammar Fixer — Fix Grammar and Spelling, See Every Change (58) | 138 | 439 → 511 | graphie, « as part of rewriting » (faux), « corrects most errors » en de, it, es, ar (chiffres réels mis à la place), génériques |
| image-captioner | Image Captioner — AI Caption for a Photo or Picture (51) | 150 | 312 → 480 | graphie, « any image », « quick alt text » (nuancé), formats, « your image is sent » (c'est une copie réduite), génériques |
| image-generator | inchangé : AI Image Generator — Free Text to Image, No Signup (50) | 154, inchangée | 328 → 471 | classement « highest-rated », « like the best-known generators », FAQ 1 sans les autres limites, « fast quality setting » devenu « low », droits OpenAI (supprimé), astuce invérifiable |
| image-upscaler | AI Image Upscaler — Enlarge Images 2x or 4x with AI (51, inchangé) | 136 | 555 → 560 | FAQ gratuité sans limites serveur, « leading online upscaler », liste de navigateurs WebGPU, « about 25 MB », 30 MB non dit |
| keyword-extractor | Keyword Extractor — AI Keyword List with Reasons (48) | 137 | 353 → 447 | FAQ 1, « long-tail… less competition », générique, page mince |
| sentiment-analyzer | Sentiment Analyzer — Positive, Negative or Neutral with AI (58) | 141 | 332 → 415 | FAQ 1, « works best with English », générique, page mince |
| text-summarizer | Text Summarizer — Summarize Pasted Text with AI (47) | 129 | 332 → 398 | « in seconds », « no fixed word limit… truncated » (faux), « works best with English », générique, page mince |

## Points non vérifiables laissés de côté (rien d'écrit)
- **Rétention chez les prestataires** : rien n'est affirmé sur la durée de conservation par OpenAI ou Pangram ; les pages renvoient à leurs conditions.
- **Formats acceptés par Whisper** : leur liste n'est pas dans le dépôt. La page nomme MP3, WAV et M4A, que l'interface cite déjà, et dit qu'un format illisible revient en erreur.
- **Délais de traitement** : seules les durées mesurées dans les rapports auraient pu être citées ; aucune n'a été écrite.
- **Taille réelle du téléchargement du modèle de l'upscaler** : non écrite. Le modèle fait 17,3 MB, le moteur vient de jsDelivr.
- **Liste des navigateurs WebGPU** : remplacée par « if your browser offers WebGPU ».

## Défauts de code vus, non corrigés (hors périmètre, à signaler)
- `ai-chatbot/page.jsx:17-24` : le message trop long est affiché et le champ vidé avant le refus des 8 000 caractères.
- `grammar-fixer/page.jsx:56` et `image-captioner/page.jsx:52` : `response.json()` est appelé sans `readAiJson`. Une page d'erreur HTML donne « Unexpected token ».

## Corrections après relecture (06/10)

Relecture : `docs/audit/p36/relecture/ai.md`, 69 défauts. **Tous acceptés après vérification dans le code.** Je n'en conteste aucun.

### Limites partagées (n° 2-15)
Constat vérifié : `guardPaidRoute` est appelé par :
- `app/api/{ai,ai-vision,ai-transcribe,remove-bg,ai-image}` ;
- `app/api/convert-to-pdf/route.ts`, `app/api/pdf-to-word/route.ts` et `lib/pdfToOfficeRoute.ts`.

Il n'est pas appelé par `app/api/ai-detect` (`route.ts:11-14`) ni par `app/api/image-upscale`. Conséquences :
- **13 pages** : « shared with the site's other paid tools » remplace « shared with the AI tools ».
- **AI Detector** : la ligne de specs dit que son budget est propre, séparé des autres outils payants.
- **Image Upscaler** : déjà juste (billets du service + budget propre), inchangé.
- **Image Generator** : la ligne de specs et la FAQ 1 citent le budget propre, le budget mensuel du site et les limites horaire et journalière par connexion (`app/api/ai-image/route.ts:36-50`).

### Exactitude
- **n° 1, AI Writer** : la méta « Edit it » devient « ready to copy or save as a .txt file ». L'About et les specs disent que le résultat est en lecture seule (`page.jsx:53`).
- **n° 16, Background Remover** : Image Editor n'a ni calque ni fond (`image-editor/page.tsx:335`). La FAQ renvoie désormais vers « an image editor that supports layers », sans nommer d'outil.
- **n° 17, Background Remover** : la FAQ 1 dit que masque et bords sont calculés sur des copies réduites puis étirés, et que les pixels du bord prennent la couleur du sujet (`page.jsx:60-120`, `mattingRefine.js:23`).
- **n° 18-19** : « copie JPEG d'au plus 1 024 / 2 048 px » au lieu de « copie réduite » (`page.jsx:37`, `imageForVision.js:45`). La méta de Background Remover cite « 1,024 px », preuve ajoutée.
- **n° 20, Audio Transcriber** : la FAQ sur les sous-titres d'une vidéo passe d'abord par Video to Audio, car le sélecteur n'accepte que l'audio (`page.jsx:49`).
- **n° 21, Image Captioner** : la FAQ ajoute les refus côté serveur (limites par connexion, budget du site).

### Confidentialité (n° 22-24, 38)
- **Chatbot et AI Detector** : la page décrit exactement ce que garde la base, y compris le compteur par connexion rangé sous une adresse IP hachée (`hourDayRateLimit.js`, `ipHash.js:4-5`, `aiDetect.js:55-63`).
- **Les 11 autres pages** : la proposition gabarit « the tool name, the outcome and the cost » et les « only … recorded » sont retirés. Il reste « we keep neither … », qui est exact.
- Les phrases sur les rapports d'erreur sont retirées. Elles disaient « without your text » sans détailler ce qui part (consigne du 06/10).

### Invérifiable (n° 25-26)
- **Image Generator, étape 3** : « wait until the image appears ».
- **Image Generator, FAQ sur les refus** : les exemples de catégories sont retirés, il reste « under OpenAI's usage policies ».

### Doublons (n° 27-37)
- **Questions renommées** :
  - ai-translator : « Which target languages are offered? » ;
  - paraphraser : « How much text can I reword at once? » ;
  - text-summarizer : « What is the longest text I can summarize? » ;
  - background-remover : « How many cut-outs can I make? ».
- **Phrase de sous-titres d'Audio Transcriber** reformulée : « Each line of the SRT and WebVTT files carries… ».
- **Ouverture « 8,000 characters per request. »** : une formule propre par page (paraphraser, translator, data-extractor, keyword-extractor, text-summarizer).
- **Ligne de specs « Input »** : propre à chaque outil (passage, e-mail/facture/liste, article/page/transcription, avis/message, notes/article/chapitre, texte à relire).

### Structure (n° 39-51)
- **17 réponses de FAQ** commencent maintenant par Yes / No / le chiffre, ou par la réponse directe. Les questions concernées sont reformulées en oui/non quand il le fallait. « It varies » est supprimé (Grammar Fixer commence par « 29 of 40 »).
- **n° 41** : `${AI_DETECT_MAX_WORDS.toLocaleString('en-US')}` affiche « 1,000 » partout sur AI Detector.

### Hors périmètre, inchangé
Ces chaînes d'interface sont invérifiables mais pas fausses ; elles sont laissées au propriétaire :
- Background Remover : « Remove any background instantly with AI » ;
- Image Generator : « get it in seconds » et « about 10–30 seconds » ;
- Image Upscaler : « rebuilds real detail ».

Les défauts de code restent non corrigés, comme prévu au plan.

## Textes d'interface invérifiables corrigés (06/10, dernière consigne)
Ni les libellés de boutons ni la logique n'ont changé.

| Page | Avant | Après | Raison |
|---|---|---|---|
| background-remover/page.jsx:226 (sous-titre) | « Remove any background instantly with AI » | « Remove the background from a photo with AI, at full resolution » | « instantly » non mesuré ; « any » faux, seul le plus grand sujet est gardé (`infer.py:137-153`) ; pleine résolution vraie (`page.jsx:50-57`) |
| image-generator/page.jsx:73 (sous-titre) | « Describe an image and get it in seconds — … » | « Describe an image and get one AI-made picture — … » | « in seconds » non mesuré (deux mesures de 16 s seulement) ; une image par requête (`route.ts:57` n: 1) |
| image-generator/page.jsx:95 (état du bouton pendant le travail) | « Generating… (about 10–30 seconds) » | « Generating… » | délai 10–30 s jamais mesuré ; le libellé du bouton « Generate Image » est inchangé |
| image-upscaler/page.jsx:145 (sous-titre) | « …with an AI model that rebuilds real detail » | « …with a super-resolution AI model » | « rebuilds real detail » est une qualité non prouvée ; le modèle MoSR est bien un modèle de super-résolution (`upscale.py:3`) |

Revérifiées et laissées telles quelles :
- **Background Remover**, « matches the largest limit offered by remove.bg, Pixian, and PhotoRoom » : relevé daté dans `lib/quota/limits.js:13-15`.
- **Image Captioner**, « so large photos work » : mesuré jusqu'à 58 MB, `limits.js:100-102`.

Contrôles après ces changements :
- `content-verify --only=ai-tools/` : 0 défaut ;
- `instructions.mjs` : 0 écart ;
- `privacy-claims.mjs` : 0 défaut.

## Corrections après deuxième passe (06/10)

Les 12 défauts D1-D12 de `relecture/ai.md` (« Deuxième passe ») sont tous acceptés et corrigés.

### Exactitude
- **D1, Image Upscaler** : chaîne d'interface `app/lib/localUpscale.js:33`.
  - Grep fait : `localUpscale.js` n'est importé que par `app/tools/ai-tools/image-upscaler/page.jsx`.
  - Avant : « Loading the AI model (first time only, about 25 MB) ».
  - Après : « Loading the AI model (about 17 MB from this site, plus the AI engine from cdn.jsdelivr.net; once per visit) ».
  - Le modèle fait 17 288 863 octets (`public/models/4xNomos2_hq_mosr-web.onnx`). Le moteur se charge depuis cdn.jsdelivr.net (`localUpscale.js:35`). La session est gardée en mémoire pour la visite (`localUpscale.js:29-41`).
- **D2, Image Captioner, FAQ 2** : « Can I use a HEIC photo from an iPhone? » → « Yes in Safari, which opens HEIC itself; in Chrome, Edge or Firefox, convert it first with HEIC to JPG… ». Preuve : `heic-to-jpg/page.jsx:32-39` (heic2any pour les navigateurs qui ne lisent pas le HEIC).

### Doublons
- **D3, About** : Background Remover dit maintenant « a photo of up to … MB, from a phone or a camera, as JPG, PNG, WebP or another type your browser reads » ; Image Captioner, « JPEG, PNG and WebP open in every browser, and a HEIC photo opens in Safari ».
- **D4, privacy d'Image Captioner** : réécrite sur l'image redessinée en JPEG, côté ≤ ${VISION_MAX_SIDE} px, transparence en blanc. La tournure de Background Remover n'est plus reprise.
- **D5, Audio Transcriber, FAQ 4** : réécrite sans la phrase d'audio-to-text. Le fichier est remis à Whisper intact et son message de refus est affiché. Les fichiers de musique chiffrés sont arrêtés avant l'envoi (`page.jsx:21`).

### Ouverture des réponses
- **D6-D9** : « No, not … » remplace « Not … » sur AI Writer, Sentiment Analyzer, Text Summarizer et Image Upscaler. Upscaler ajoute « Otherwise yes: … ».
- **D10, Background Remover** : la question devient « Is there a limit on cut-outs? », réponse « Yes. … ».

### Longueur des textes de confidentialité
- **D11, Text Summarizer** : 57 mots. Ajout : un texte trop long est refusé avant l'envoi, jamais coupé ; seul le résumé revient.
- **D12, Sentiment Analyzer** : 52 mots. Ajout : chaque avis est une requête séparée, rien n'est gardé d'une analyse à l'autre.

### Ajustement imposé par `privacy-claims`
Deux phrases nouvelles nommaient l'appareil sans l'envoi : la confidentialité de Captioner (« Before it is sent, your image is redrawn on your device… ») et celle de Summarizer (« …refused before sending… »). Elles ont été reformulées.

### Contrôles finaux
- `content-verify --only=ai-tools/` : 0 défaut (C6 compris) ;
- `instructions.mjs` : 0 écart ;
- `privacy-claims.mjs` : 0 défaut.
