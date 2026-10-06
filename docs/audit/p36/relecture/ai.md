# P36 — relecture indépendante, lot « ai » (16 pages)

Réviseur : agent « ai » (n'a écrit aucune de ces pages). Date : 2026-10-05. Lecture seule ; seul fichier créé : celui-ci.
Aucun appel payant, aucun serveur, aucun navigateur.

Méthode : pour chaque page, lecture de `page.jsx` (props de `<SeoContent>`) et `layout.tsx` (metadata), puis du code
réellement exécuté : routes `app/api/{ai,ai-detect,ai-image,ai-transcribe,ai-vision,remove-bg,image-upscale}`,
`app/api/media/ticket/route.js`, `lib/ai/{toolPrompts,pangram}.js`, `lib/quota/{guard,limits,config,globalSpend,ipRateLimit,
hourDayRateLimit,ipHash,logEvent,counters,aiDetect,imageGen,upscaleBudget}.js`, `lib/media/{staged.js,stagedRoute.ts}`,
`app/lib/{aiClient,officeUpload,mediaJob,imageForVision,localUpscale,bigImage,mattingRefine,mediaSupport,useToolError,
reportError}.js`, `app/components/{FileDownload.jsx,TranscriptExports.jsx,SeoContent.tsx}`,
`services/background-removal/app/{main,infer,upscale}.py`, `services/media-processing/app/{jobs,main}.py`, et les pages
liées citées (Image Editor, Word Counter, PDF AI Summary, PDF Translate, Audio to Text). Chiffres écrits en dur comparés à
`docs/audit/p36/preuves/ai.json` et aux rapports datés (`RAPPORT-p17-30-09.md`, `RAPPORT-ai-detector-30-09.md`,
`RAPPORT-deploiement-28-09.md`, `RAPPORT-ecarts-marche.md`). Structure et doublons mesurés par un script AST (copie de
`scripts/p36/content-verify.mjs` dans le scratchpad) : phrases identiques et 8-grammes partagés contre les 225 pages.
Contrôles automatiques relancés : `content-verify --only=ai-tools/` 0 échec, `instructions.mjs` 0 écart sur 1 742 libellés,
`privacy-claims.mjs` 0 échec — les défauts ci-dessous sont ceux que ces contrôles ne voient pas.

Rappel du code sur les limites (base des lignes « limites partagées ») :
- `guardPaidRoute` (`lib/quota/guard.js`) = un seul seau horaire + journalier par IP (`lib/quota/ipRateLimit.js:4-8`,
  préfixe `ip_rate`) et le budget mensuel du site (`globalSpend.js`, un seul compteur `global_spend_microusd`). Il est appelé
  par `app/api/ai`, `ai-vision`, `ai-transcribe`, `remove-bg`, `ai-image`, **et aussi** `app/api/convert-to-pdf/route.ts:206`
  (Word → PDF par ConvertAPI), `app/api/pdf-to-word/route.ts:143`, `lib/pdfToOfficeRoute.ts:45` (PDF → Excel / PowerPoint).
- Il n'est **pas** appelé par `app/api/ai-detect` (AI Detector : limites propres, `route.ts:11-13`, `lib/quota/aiDetect.js`)
  ni par `app/api/image-upscale` (budget propre `upscaleBudget.js` + billets du service média `office_rate`).
- Donc « shared with / counted together with the (other) AI tools » est faux dans les deux sens : deux outils IA n'y
  entrent pas, et quatre outils de conversion non IA y entrent. Formulation exacte : « shared with the site's other paid
  tools » (déjà employée par les jumeaux pdf-tools).

## Défauts

| # | Page | Endroit | Phrase (citation courte) | Problème | Preuve (fichier:ligne ou calcul) | Correction proposée |
|---|---|---|---|---|---|---|
| 1 | ai-writer | méta + openGraph.description | « Edit it, then copy it or save it as text. » | (1) Faux : le résultat n'est pas modifiable sur la page (zone en lecture seule). | `ai-writer/page.jsx:53` (`readOnly`) ; `layout.tsx:6,10` | « …get a first draft from GPT-4o mini, ready to copy or save as a .txt file. » |
| 2 | ai-chatbot | specs « Usage limits » + FAQ 3 | « shared with the site's other AI tools » / « counted together with the other AI tools on the site » | (1) Inexact : le seau par connexion n'inclut ni AI Detector ni AI Image Upscaler, et inclut Word→PDF, PDF→Word/Excel/PowerPoint. | voir « Rappel du code » | « …shared with the site's other paid tools… » |
| 3 | ai-paraphraser | specs « Usage limits » | « counted together with the other AI tools » | (1) Même inexactitude. | idem | idem |
| 4 | ai-translator | specs « Usage limits » | « capped per hour and per day across all AI tools » | (1) Même inexactitude (« all AI tools » : AI Detector et Upscaler n'y sont pas). | idem | idem |
| 5 | ai-writer | specs « Usage limits » | « A shared hourly and daily allowance per connection for the AI tools » | (1) Même inexactitude. | idem | idem |
| 6 | audio-transcriber | specs « Usage limits » | « limited per hour and per day, together with the other AI tools » | (1) Même inexactitude. | idem | idem |
| 7 | background-remover | specs « Usage limits » + FAQ 5 | « shared with the site's AI tools » / « counted together with the site's AI tools » | (1) Même inexactitude. | idem | idem |
| 8 | data-extractor | specs « Usage limits » | « counted across the site's AI tools » | (1) Même inexactitude. | idem | idem |
| 9 | email-generator | specs « Usage limits » | « shared by all AI tools on the site » | (1) Même inexactitude (« all »). | idem | idem |
| 10 | grammar-fixer | specs « Usage limits » | « shared with the other AI tools » | (1) Même inexactitude. | idem | idem |
| 11 | image-captioner | specs « Usage limits » | « shared by the AI tools » | (1) Même inexactitude. | idem | idem |
| 12 | keyword-extractor | specs « Usage limits » | « across the AI tools » | (1) Même inexactitude. | idem | idem |
| 13 | sentiment-analyzer | specs « Usage limits » | « all AI tools together » | (1) Même inexactitude (« all »). | idem | idem |
| 14 | text-summarizer | specs « Usage limits » | « shared across the site's AI tools » | (1) Même inexactitude. | idem | idem |
| 15 | image-generator | specs « Other limits » + FAQ 1 | « The generator has a monthly budget of its own » / « stops for everyone if its monthly budget runs out, and the site's hourly limit for AI tools applies as well » | (1) Incomplet : la route passe aussi par `guardPaidRoute` (budget mensuel **du site** et limite **journalière** par connexion en plus de l'horaire) ; la FAQ ne cite que l'horaire et le budget propre. | `app/api/ai-image/route.ts:36-50` (reserveImageGen puis guardPaidRoute) ; `guard.js:180-202` | « …its own monthly budget and the site's monthly budget for paid tools; the hourly and daily per-connection limits of the paid tools also apply. » |
| 16 | background-remover | FAQ 3 | « Open the PNG in Image Editor, or in any editor that supports layers, to place the subject on a new background. » | (1) Faux : Image Editor n'a ni calque, ni fond, ni insertion d'image (réglages, rotation, pixels, grain, vignette, coins, bordure, une ligne de texte). Le visiteur est envoyé vers un outil qui ne fait pas ce qui est dit. | `app/tools/image-tools/image-editor/page.tsx:335` (sa propre description), aucun code de fond/calque | « …Open the PNG in an image editor that supports layers to place the subject on a new background. » (sans citer Image Editor) |
| 17 | background-remover | FAQ 1 | « The PNG is built from your original pixels… Only the mask is computed from a reduced copy, then stretched » | (1) Inexact : l'alpha affiné et les couleurs de sujet / fond du bord sont aussi calculés sur une copie ≤ 1 Mpx puis étirés, et les pixels du bord reçoivent la couleur estimée du sujet (correction des couleurs de bord) ; tous les pixels ne sont donc pas les originaux. | `background-remover/page.jsx:60-87,106-120` ; `app/lib/mattingRefine.js:23` (`WORK_PIXELS = 1_000_000`) | « No. The PNG keeps your photo's full width and height and nothing is drawn on it. The mask and the edge clean-up are computed on reduced copies and stretched; edge pixels get the subject's color so no background tint is left. » |
| 18 | background-remover | About + méta + privacy | « a copy reduced to 1,024 pixels on the longest side » / « Only a reduced copy is sent » | (1) Inexact pour une image de 1 024 px ou moins : la copie n'est jamais agrandie ni réduite, elle est seulement réencodée en JPEG à sa taille (la ligne specs « 1,024 px at most » est juste). | `background-remover/page.jsx:37` (`Math.min(1, …)`) | About : « …a JPEG copy of at most 1,024 pixels on the longest side… » ; privacy/méta : « only a JPEG copy, at most 1,024 px… ». |
| 19 | image-captioner | méta + privacy | « Large photos are reduced… » (juste) / privacy « Only a reduced copy is sent… The page draws a reduced JPEG copy » | (1) Même inexactitude pour une image ≤ 2 048 px (copie JPEG à la même taille, fond blanc). | `app/lib/imageForVision.js:45` (`Math.min(1, …)`) | privacy : « Only a JPEG copy, at most 2,048 px on its longest side, is sent: your original file stays on your device. » |
| 20 | audio-transcriber | FAQ 2 | « Can I get subtitles for a video? » — « Yes. … Load them in YouTube, VLC or a video editor. » | (1) Incomplet / trompeur : le sélecteur n'accepte que l'audio ; pour une vidéo il faut d'abord en extraire la piste son, ce que la réponse ne dit pas. | `audio-transcriber/page.jsx:50` (`accept="audio/*"`) | « Yes, from its sound track: extract the audio with Video to Audio, transcribe it here, and the page offers SRT and WebVTT files… » |
| 21 | image-captioner | FAQ 4 | « Either it is over 80 MB or your browser could not read it. In both cases a message gives the reason before anything goes to our server. » | (1) Incomplet : l'image peut aussi être refusée par le serveur (limite horaire / journalière par connexion, budget du site, contrôle 5 MB sur la copie), message affiché après l'envoi. | `app/api/ai-vision/route.ts:20-27` ; `page.jsx:52-54` | Ajouter : « Your connection's hourly or daily limit, or the site's monthly budget, can also stop a request; the message says when to try again. » |
| 22 | ai-chatbot | privacy | « our database records only which tool was used, whether the call worked and what it cost » | (3) Faux par « only » : la base garde aussi, par heure et par jour, un compteur de requêtes rangé sous une empreinte SHA-256 de l'adresse IP (c'est ce qui applique la limite par connexion). | `lib/quota/hourDayRateLimit.js` (clé `ip_rate:hour/day:<id>`) ; `lib/quota/ipHash.js:4-5,35` ; `counters.js:35` (RPC Supabase) | « …our database records which tool was used, whether the call worked, its cost, and a request count per connection (under a hashed IP address) for the limits. » |
| 23 | email-generator | privacy | « only the tool name, the result of the request and its cost are recorded » | (3) Même omission du compteur par connexion (« only… recorded »). | idem | Retirer « only », ou ajouter le compteur haché par connexion. |
| 24 | sentiment-analyzer | privacy | « only the tool name, the outcome and the cost of the call are recorded » | (3) Même omission. | idem | idem |
| 25 | image-generator | howTo étape 3 | « the button shows the usual waiting time » | (4) Invérifiable : cautionne le libellé d'interface « about 10–30 seconds », jamais mesuré (deux mesures de 16 s seulement). | `image-generator/page.jsx:95` ; `docs/audit/AUDIT-TEXTES-P36.md:3218` ; `RAPPORT-ecarts-marche.md:41,160` | « Click "Generate Image" and wait until the image appears. » |
| 26 | image-generator | FAQ 3 | « for example for violent or sexual content or real people in misleading situations » | (4) Invérifiable dans le dépôt : les catégories de la politique d'OpenAI ne sont ni dans le code ni dans un rapport ; la route ne voit que `moderation_blocked`. | `app/api/ai-image/route.ts:86-88` | « Because OpenAI's safety filter blocked it under OpenAI's usage policies. » (sans exemples) |
| 27 | ai-translator ↔ pdf-translate (jumeaux) | FAQ 1 | « Which languages can I translate into? » | (5) Phrase identique entre jumeaux (question mot pour mot). | `ai-translator/page.jsx:90` ; `pdf-tools/pdf-translate/page.jsx:161` | ai-translator : « Which target languages are offered? » |
| 28 | audio-transcriber ↔ audio-to-text (jumeaux) | FAQ 2 | « When Whisper returns timed segments, the page offers SRT and WebVTT files… » | (5) Quasi identique à audio-to-text « when Whisper returns timed segments, the page offers .srt and .vtt files next to the .txt ». | `audio-transcriber/page.jsx:84` ; `audio-tools/audio-to-text/page.jsx:217` | Reformuler ici (ex. « Each line of the SRT and WebVTT files carries its start and end time from Whisper's segments… »). |
| 29 | ai-paraphraser ↔ text-summarizer | FAQ 1 | « How long can the text be? » | (5) Question identique sur deux pages voisines. | `ai-paraphraser/page.jsx:79` ; `text-summarizer/page.jsx` FAQ 1 | ex. paraphraser : « How much text can I reword at once? » |
| 30 | ai-paraphraser | FAQ 1 | « 8,000 characters per request. » | (5) Phrase identique sur 5 pages (paraphraser, translator, data-extractor, keyword-extractor, text-summarizer), plus « Longer text is refused before it is sent » quasi identique paraphraser / keyword-extractor / data-extractor / text-summarizer. | AST : phrase normalisée commune | Varier l'ouverture : « 8,000 characters, counted before sending. », etc. (une formule par page) |
| 31 | ai-translator | FAQ 3 | « 8,000 characters per request. » | (5) idem | idem | idem |
| 32 | data-extractor | FAQ 4 | « 8,000 characters per request. » | (5) idem | idem | idem |
| 33 | keyword-extractor | FAQ 4 | « 8,000 characters per request. » | (5) idem | idem | idem |
| 34 | text-summarizer | FAQ 1 | « 8,000 characters per request. » | (5) idem | idem | idem |
| 35 | data-extractor / keyword-extractor / text-summarizer | specs « Input » | « Pasted text, up to 8,000 characters » | (5) Ligne identique sur 3 pages (et « Plain text, up to 8,000 characters » identique paraphraser / grammar-fixer). Compté 1 par page : 5. | AST | Ajouter l'objet propre à chaque page (« An article or transcript, up to… », « One review or message… »). |
| 36 | ai-paraphraser / grammar-fixer | specs « Input » | « Plain text, up to 8,000 characters » | (5) idem (compté dans le n° 35). | AST | idem |
| 37 | background-remover | FAQ 5 | « Is there a usage limit? » | (5) Question identique sur 5 pages du site (audio-to-text, pdf-ai-summary, pdf-to-excel, pdf-to-word). | AST | « How many cut-outs can I make? » |
| 38 | 11 pages texte / image IA | privacy | « the tool name, the outcome and the cost » (paraphraser, translator, writer, data-extractor, email-generator, grammar-fixer, image-captioner, keyword-extractor, sentiment-analyzer, text-summarizer ; chatbot en variante) | (5) Proposition quasi identique répétée (8-grammes communs sur 7 à 9 pages) : phrase de gabarit. Compté 1 par page : 11. | AST (8-grammes « the tool name the outcome and the cost ») | Une seule mention dans la politique de confidentialité ; sur chaque page, dire seulement ce qui est propre (« your draft is not saved », etc.). |
| 39 | ai-chatbot | FAQ 3 | « Because every reply is a paid request to OpenAI. » | (6) Réponse qui ne commence ni par Yes / No ni par un chiffre (§2d). | GABARIT §2d.4 | Question en oui/non : « Is there a limit on how much I can chat? » — « Yes. … » |
| 40 | ai-detector | FAQ 3, FAQ 4 | « It can be higher on purpose. » / « It means Pangram found… » | (6) idem (2 réponses). | idem | « Can the word count be higher than my word processor's? — Yes… » ; « Can a text be both AI and human? — Yes… » |
| 41 | ai-detector | About, specs, FAQ 2, tip | « 40 to 1000 words » | (6) Anglais / cohérence : « 1000 » sans séparateur alors que la même page écrit « 12,000 » et « 2,000 ». | `ai-detector/page.jsx:77,87,97,102` (`${AI_DETECT_MAX_WORDS}` sans `toLocaleString`) | `${AI_DETECT_MAX_WORDS.toLocaleString('en-US')}` |
| 42 | audio-transcriber | FAQ 4 | « Common ones such as MP3, WAV and M4A. » | (6) idem §2d. | idem | « Does it accept MP3, WAV and M4A? — Yes… » |
| 43 | background-remover | FAQ 2, FAQ 4 | « Any image your browser can open… » / « Because the service keeps only the largest connected subject… » | (6) idem (2 réponses). | idem | « Can I upload a PNG or WebP? — Yes… » ; « Can it keep two separate subjects? — No… » |
| 44 | data-extractor | FAQ 3 | « Write them on the first line of your text… » | (6) idem. | idem | « Can I choose which fields are extracted? — Yes. Write them… » |
| 45 | email-generator | FAQ 2 | « Only the tone word in the instruction… » | (6) idem. | idem | « Does the tone change anything else? — No. Only the tone word… » |
| 46 | grammar-fixer | FAQ 4 | « It varies. » | (6) idem ; de plus « It varies » est l'anti-motif « It depends » (§2e). | GABARIT §2e | « 29 of 40 in Portuguese… » en tête. |
| 47 | image-captioner | FAQ 2, FAQ 4 | « Any format your browser can open… » / « Either it is over 80 MB… » | (6) idem (2 réponses). | idem | « Can I use HEIC or TIFF? — Yes, where your browser opens them… » ; « 80 MB is the limit… » |
| 48 | image-generator | FAQ 2, FAQ 3 | « OpenAI's gpt-image-2 at its low quality setting… » / « Because OpenAI's safety filter blocked it… » | (6) idem (2 réponses). | idem | « Can I choose the model or quality? — No… » ; « Can a description be refused? — Yes… » |
| 49 | image-upscaler | FAQ 5 | « Philip Hofmann trained 4xNomos2_hq_mosr… » | (6) idem (forme). | idem | « Is the AI model open source? — Yes. Philip Hofmann… » |
| 50 | keyword-extractor | FAQ 2, FAQ 3 | « There is no fixed number. » / « Keyword density, in Word Counter, counts… » | (6) idem (2 réponses). | idem | « Is the number of keywords fixed? — No… » ; « Is this the same as keyword density? — No… » |
| 51 | sentiment-analyzer | FAQ 1 | « It is the model's own estimate… » | (6) idem. | idem | « Is the confidence percentage a measured accuracy? — No… » |

Vérifié exact (pas de défaut) — échantillon des affirmations contrôlées : 8 000 caractères (`limits.js:5`, contrôle client
et serveur), 1 000 jetons (`app/api/ai/route.ts:35`), GPT-4o mini partout sauf gpt-image-2 / Whisper / Pangram / service
maison ; consignes réelles de chaque outil (`lib/ai/toolPrompts.js`) ; 10 langues cibles refusées sinon côté serveur ; 5 tons ;
AI Detector 40-1 000 mots, 12 000 caractères, 2 000 mots/jour/visiteur (IPv6 par /64), arrondi à la centaine, triple comptage,
budget propre sans chiffre, exemple LIGO (`RAPPORT-p17-30-09.md:69`), 96-98 % (`RAPPORT-ai-detector-30-09.md:71`) ; Grammar Fixer
25/25, 29 / 16-17 / 11 / 9 / 6 sur 40 (`RAPPORT-deploiement-28-09.md:67-76`, colonnes T0), 10 autres langues, 5 langues à
avertissement, annulation exacte (`diff.js`) ; Audio Transcriber 25 MB, 4 MB direct / au-delà par le service média, effacement
après réponse (`stagedRoute.ts:106-112`), TXT/SRT/VTT, refus des fichiers chiffrés ; Background Remover 50 MB, 1 024 px,
composante connexe la plus grande (`infer.py:137-185`), service en mémoire, Safari 16.4 (`bigImage.js:246`), photo jamais
envoyée (rapport d'erreur : extension et classe de taille seulement) ; Image Captioner 80 MB, 2 048 px, blanc sous la
transparence, GIF = une image ; Image Generator 1 000 caractères, 3 tailles, WebP + PNG local, 5/jour rendus en cas de refus,
journal sans description (`route.ts:100`) ; Upscaler 6 Mpx / 30 MB, WebGPU sur l'appareil, ×2 = ×4 réduit, alpha Lanczos côté
serveur, découpe > 2 Mpx, effacement après téléchargement complet (`media-processing/app/jobs.py:7-9,299-302`), neuf modèles
comparés (`RAPPORT-ecarts-marche.md:126`). Structure : titres 46-58 car., méta 129-154, OG identiques, méta ≠ About, About
80-101 mots, 3-5 étapes, 3-5 FAQ de 25-49 mots, privacy 51-70 mots, mot-clé ≤ 2 fois, 381-529 mots visibles. Libellés : tous
conformes (relus à la main en plus de `instructions.mjs`). Exemples : seul AI Detector en a un, mesuré et daté — conforme.

Hors périmètre (texte d'interface, non réécrit par les rédacteurs, signalé pour information) : Background Remover sous-titre
« Remove any background instantly with AI » (« instantly » invérifiable) ; Image Generator « get it in seconds » et
« about 10–30 seconds » (invérifiables, cf. n° 25) ; Image Upscaler « an AI model that rebuilds real detail ».

## Totaux
- Pages relues : **16** (plus les 3 jumelles pour l'unicité : audio-to-text, pdf-translate, pdf-ai-summary).
- Défauts : **69** (lignes 1-51 ; une ligne groupée compte une fois par page — n° 35-36 = 5, n° 38 = 11 — et une
  ligne à deux réponses FAQ compte 2).
  - (1) Exactitude : **21** (n° 1-21)
  - (2) Libellés : **0**
  - (3) Lieu de traitement / confidentialité : **3** (n° 22-24)
  - (4) Invérifiable : **2** (n° 25-26)
  - (5) Générique / dupliqué : **25** (n° 27-29 = 3 ; n° 30-34 = 5 ; n° 35-36 = 5 ; n° 37 = 1 ; n° 38 = 11)
  - (6) Structure : **18** (17 réponses FAQ qui ne commencent pas par Yes / No / un chiffre — n° 39-40, 42-51 — et « 1000 »
    sans séparateur, n° 41)
  - (7) Exemple : **0**
- Jumeaux : text-summarizer ↔ pdf-ai-summary : aucune phrase commune ; ai-translator ↔ pdf-translate : 1 question identique
  (n° 27) ; audio-transcriber ↔ audio-to-text : 1 phrase quasi identique (n° 28).
- Les plus graves : la phrase « limites partagées avec les (autres) outils IA » fausse sur 13 pages (n° 2-14) ; Background
  Remover renvoie vers Image Editor pour poser un nouveau fond, ce qu'il ne fait pas (n° 16) ; méta d'AI Writer « Edit it »
  alors que le résultat est en lecture seule (n° 1) ; « our database records only… » du Chatbot qui tait le compteur par IP
  hachée (n° 22) ; « usual waiting time » d'Image Generator qui cautionne un délai jamais mesuré (n° 25).
- Pages **sans aucun défaut** : **aucune**. Plus proche : image-upscaler (un seul défaut, de forme : n° 49).

## Deuxième passe (06/10)

J'ai relu en entier les 16 pages après les corrections du rédacteur (`redaction/ai.md`, « Corrections après relecture » et
« Textes d'interface invérifiables corrigés »). Ont été relus :
- les props de `SeoContent` et les `metadata` ;
- toutes les chaînes d'interface : sous-titres, notes, états de bouton, messages, y compris ceux de `app/lib/localUpscale.js`.

La relecture applique la même liste de contrôle que la première passe et les précisions du 06/10 de `CONSIGNES-REDACTION.md`.
Les contrôles automatiques donnent :
- `content-verify --only=ai-tools/` : 0 échec ;
- `instructions.mjs` : 0 écart sur 1 763 libellés ;
- `privacy-claims.mjs` : 0 échec.

Doublons remesurés par le même script (phrases et n-grammes contre les 225 pages).

**Bilan de la première passe.** Les 69 défauts sont corrigés. Chacun a été vérifié dans le code :
- les limites sont désormais « shared with the site's other paid tools » ;
- AI Detector a un budget distinct ;
- Image Generator nomme ses deux budgets et les limites horaire et journalière ;
- Writer dit « read-only » ;
- Background Remover ne renvoie plus vers Image Editor ;
- la confidentialité de Chatbot et d'AI Detector décrit le compteur sous IP hachée ;
- les gabarits de confidentialité sont retirés ;
- l'étape 3 et la FAQ des refus d'Image Generator sont corrigées ;
- les questions sont renommées ;
- « 1,000 » apparaît partout sur AI Detector.

**Interface.** Les 4 chaînes modifiées sont exactes :
- « at full resolution » est vrai : le PNG garde la largeur et la hauteur de l'original (`background-remover/page.jsx:91-131`) ;
- « one AI-made picture » est vrai (`n: 1`, `app/api/ai-image/route.ts:57`) ;
- « Generating… » ;
- « super-resolution AI model ».

La note « matches the largest limit offered by remove.bg, Pixian, and PhotoRoom » est appuyée par
`docs/audit/RAPPORT-detourage-taille-fichiers.md:26-30`.

| # | Page | Endroit | Phrase (citation courte) | Problème | Preuve | Correction proposée |
|---|---|---|---|---|---|---|
| D1 | image-upscaler | interface (message de phase, `app/lib/localUpscale.js:33`) | « Loading the AI model (first time only, about 25 MB) » | (1) Faux / invérifiable. Le modèle pèse 17,3 MB (17 288 863 octets), auquel s'ajoute le runtime ONNX tiré de cdn.jsdelivr.net. « first time only » vaut seulement pour la visite en cours (`sessionPromise` en mémoire), pas pour un rechargement. La SEO a retiré « cached », mais pas l'interface. | `public/models/4xNomos2_hq_mosr-web.onnx` (17 288 863 o) ; `localUpscale.js:28-41` | « Loading the AI model (about 17 MB, once per visit) ». Chaîne d'un fichier partagé : à valider par le contrôleur. |
| D2 | image-captioner | FAQ 2 | « Can I use HEIC or other formats? » — « Yes, where your browser can open them » | (1) Trompeur. Seul Safari décode le HEIC : Chrome, Edge et Firefox le refusent, et la question cite justement HEIC. | `app/tools/image-tools/heic-to-jpg/page.jsx:32-39` (heic2any pour « the browsers that cannot read HEIC ») ; `app/lib/imageForVision.js:12-27` | « Yes in Safari, which opens HEIC itself; in Chrome, Edge or Firefox, convert it first with HEIC to JPG. JPEG, PNG and WebP work everywhere… » |
| D3 | background-remover ↔ image-captioner | About | « …in any format your browser can open, such as JPG, PNG or WebP » / « …in any format your browser can open, such as JPEG, PNG or WebP » | (5) Proposition quasi identique entre deux pages voisines (même structure, même énumération). | AST (6-grammes communs) | Dire ce qui est propre : pour Background Remover « a photo of up to 50 MB (JPG, PNG, WebP…) » ; pour Image Captioner « HEIC in Safari ». |
| D4 | background-remover ↔ image-captioner | privacy | « only a JPEG copy, at most 1,024 px on its longest side, is sent… » / « Only a JPEG copy, at most 2,048 px on its longest side, is sent » | (5) Quasi identique, introduit par la correction des n° 18-19. | AST | Reformuler l'une des deux, par exemple Image Captioner : « The model sees a JPEG redrawn on your device (longest side 2,048 px or less, transparency turned white)… ». |
| D5 | audio-transcriber ↔ audio-to-text (jumeaux) | FAQ 4 | « The file reaches Whisper as it is, without conversion, so a type Whisper cannot read comes back with an error message. » | (5) Quasi identique à audio-to-text : « The file is sent without conversion, so a type Whisper cannot read comes back with its error. » | `audio-transcriber/page.jsx` FAQ 4 ; `audio-tools/audio-to-text/page.jsx` | Reformuler ici, par exemple : « Whisper reads MP3, M4A, WAV, WebM, OGG and FLAC itself; other types return Whisper's own error. » (liste à vérifier sur la doc OpenAI, sinon s'en tenir à « Yes. Encrypted music downloads… ») |
| D6 | ai-writer | FAQ 2 | « Can I set the tone or the length? » — « Not with a setting: » | (6) Question fermée dont la réponse ne commence pas par Yes / No (précision du 06/10). | `CONSIGNES-REDACTION.md`, précisions du 06/10 | « No, not with a setting: … » |
| D7 | sentiment-analyzer | FAQ 3 | « Does it understand sarcasm? » — « Not reliably. » | (6) idem. | idem | « No, not reliably. … » |
| D8 | text-summarizer | FAQ 2 | « Can I summarize a PDF? » — « Not on this page… » | (6) idem. | idem | « No, not on this page… » |
| D9 | image-upscaler | FAQ 1 | « Is my image uploaded? » — « Not when it runs on your device… » | (6) idem. | idem | « No, not when it runs on your device… Otherwise yes: it goes to our own server… » |
| D10 | background-remover | FAQ 5 | « How many cut-outs can I make? » — « A limited number per hour and per day… » | (6) Une question de quantité doit commencer par le chiffre, impossible ici (valeurs dans l'environnement). La question est mal choisie. | `lib/quota/config.js` (`IP_RATE_LIMIT_PER_HOUR/DAY` lus dans l'environnement) | « Is there a limit on cut-outs? » — « Yes. A limited number per hour and per day… » |
| D11 | text-summarizer | privacy | « Summarizing happens at OpenAI… We store neither the text nor the summary. » | (6) 33 mots, sous le minimum de 40 du gabarit (privacy 40-90 mots). | décompte | Ajouter ce qui est propre, par exemple : le texte n'est jamais coupé (refusé au-delà de 8,000 caractères) et seul le résumé revient à la page. |
| D12 | sentiment-analyzer | privacy | « Your text goes to our server… remove names and contact details first. » | (6) 36 mots, sous le minimum de 40. | décompte | Compléter, par exemple : une seule requête par texte, rien n'est gardé entre deux analyses. |

**Remarque, non comptée comme défaut.** Les lignes de specs « Usage limits » se ressemblent sur une dizaine de pages
(« …shared with the site's other paid tools, and a monthly budget for the (whole) site »). Exemples :
- grammar-fixer, image-captioner et background-remover sont presque mot pour mot ;
- même chose pour pdf-to-word et pdf-ai-summary.

C'est la même limite, que le gabarit impose d'écrire sur chaque page. `content-verify` C7 est sous 30 % (maximum de
9,5 % sur le site). À uniformiser ou à varier selon le choix du propriétaire.

### Totaux de la deuxième passe
- Pages relues : **16**, chaînes d'interface comprises.
- Défauts restants : **12**.
  - (1) Exactitude : **2** (D1, D2)
  - (2) Libellés : **0**
  - (3) Lieu de traitement : **0**
  - (4) Invérifiable : **0** (« about 25 MB » est compté en (1))
  - (5) Générique / dupliqué : **3** (D3-D5)
  - (6) Structure : **7** (D6-D12)
  - (7) Exemple : **0**
- Pages sans aucun défaut : ai-chatbot, ai-detector, ai-paraphraser, ai-translator, data-extractor, email-generator,
  grammar-fixer, image-generator, keyword-extractor (9).

## Troisième passe (06/10)

J'ai relu en entier les pages touchées par les corrections de la deuxième passe, texte et interface :
- image-captioner, background-remover, audio-transcriber, ai-writer, sentiment-analyzer, text-summarizer, image-upscaler ;
- `app/lib/localUpscale.js`.

Les trois contrôles automatiques donnent 0 échec, 0 écart sur 1 763 libellés et 0 échec. Les doublons ont été remesurés.

D1 à D12 sont corrigés et vérifiés.

**D1, le message de chargement de l'upscaler, est exact.**
- « about 17 MB from this site » : `public/models/4xNomos2_hq_mosr-web.onnx` fait 17 288 863 octets et est servi depuis `/models/`.
- « plus the AI engine from cdn.jsdelivr.net » : `localUpscale.js:35`.
- « once per visit » est conforme au code. `sessionPromise` est une variable du module (`localUpscale.js:28-41`). Elle est créée une seule fois puis réutilisée pour chaque image tant que la page n'est pas rechargée, y compris après une navigation interne. Elle n'est remise à `null` qu'en cas d'échec du chargement. Un rechargement crée une nouvelle visite, et le message réapparaît.

Les autres points vérifiés :
- **D2** : HEIC est lu par Safari seulement, et la page renvoie vers HEIC to JPG pour les autres navigateurs.
- **D3, D4, D5** : les phrases quasi identiques ont disparu. Il ne reste en commun que les lignes de specs « A JPEG copy, … px at most » (1,024 / 2,048) et « Usage limits », non comptées comme à la deuxième passe.
- **D6 à D10** : les réponses commencent par Yes / No.
- **D11, D12** : les textes de confidentialité font 57 et 52 mots.
- Les nouvelles phrases sont exactes :
  - les fichiers chiffrés sont arrêtés avant l'envoi (`audio-transcriber/page.jsx:21-22`) ;
  - « each review is a separate request » est vrai (aucun historique envoyé) ;
  - « refused before sending, never cut » est vrai (`checkPromptLength` côté client).

| # | Page | Endroit | Phrase (citation courte) | Problème | Preuve | Correction proposée |
|---|---|---|---|---|---|---|
| T1 | background-remover | FAQ 1 | « edge pixels take the subject's color so no tint of the old background is left » | (1) Faux. Le code et son rapport mesurent qu'il reste une part de la couleur du fond sur le bord : 11,0 % → 4,8 %, puis 3,9 %. La phrase promet zéro. Elle était déjà là à la deuxième passe et m'avait échappé. | `background-remover/page.jsx:64-66` (commentaire de mesure) ; `docs/audit/RAPPORT-p21-nuit-jour-02-10.md` | « …edge pixels take the subject's estimated color, which removes most of the old background's tint along the edge. » |

### Totaux de la troisième passe
- Pages relues : **7**, plus `localUpscale.js`. Les 9 autres pages n'ont pas changé depuis la deuxième passe, où elles avaient 0 défaut.
- Défauts restants : **1**, au point (1) Exactitude (T1). Aucun défaut aux points (2) à (7).
- Pages sans aucun défaut : **15 sur 16**. Seule background-remover en a encore un.

## Quatrième passe (06/10)

T1 est corrigé. La FAQ 1 de Background Remover dit maintenant : « edge pixels take the subject's color, which reduces, but
does not fully remove, the old background's tint along the edges ». C'est conforme à la mesure de `page.jsx:64-66`, où la
couleur du fond restée sur le bord passe de 11,0 % à 4,8 %, puis à 3,9 % : elle baisse sans tomber à zéro.

Aucune autre occurrence de « tint » ne subsiste dans la page ni dans `layout.tsx`. La réponse fait environ 55 mots, dans
l'intervalle de 25 à 70 mots, et commence par « No ».

Les trois contrôles automatiques donnent 0 échec, 0 écart sur 1 763 libellés et 0 échec.

**0 défaut.** Les 16 pages du lot « ai » sont sans défaut.
