# P36 — Lot 2, audit du lot « ai » (16 outils, `app/tools/ai-tools/*`)

Source du texte : `docs/audit/p36/contenu-avant.json` (identique au code des pages, vérifié outil par outil) ; code lu le 05/10/2026,
branche `p36`. Aucune valeur de variable d'environnement lue : seuls les NOMS sont cités.

## Références communes (citées dans les tableaux par leur sigle)

- **[G] garde partagée** (`lib/quota/guard.js:15-38`) : appelée par `/api/ai` (`app/api/ai/route.ts:23-24`), `/api/ai-vision`
  (`app/api/ai-vision/route.ts:26-27`), `/api/ai-transcribe` (`app/api/ai-transcribe/route.ts:37-38`), `/api/remove-bg`
  (`app/api/remove-bg/route.ts:44-45`), `/api/ai-image` (`app/api/ai-image/route.ts:42`). Deux couches :
  1. limite **par réseau** (IP hachée, `lib/quota/ipHash.js:25-44`), **par heure et par jour UTC**, valeurs dans
     `IP_RATE_LIMIT_PER_HOUR` / `IP_RATE_LIMIT_PER_DAY` (`lib/quota/config.js:13-14`, obligatoires, sans valeur par défaut) ;
     **un seul compteur commun à tous les outils payants** (`lib/quota/ipRateLimit.js:4-8`) : un visiteur qui a utilisé le
     Chatbot a moins de requêtes pour le Translator. Refus 429 « Too many requests from this network. Try again in about N
     minutes. » (`guard.js:20-24`) ;
  2. **plafond de dépense mensuel du site** `GLOBAL_SPEND_CAP_USD` (défaut 20 $ dans le code, `lib/quota/config.js:6`), réservé
     au pire cas avant l'appel (`lib/quota/globalSpend.js:22-29`) ; refus 503 « This tool has reached its usage limit for the
     month — that's a site-wide limit, not something on your end. It resets on <1er du mois suivant> (UTC). » (`guard.js:29-37`).
- **[P] 8 000 caractères** : `MAX_PROMPT_CHARS = 8000` (`lib/quota/limits.js:5`) ; au-delà le texte est **refusé** (pas tronqué)
  avec « Text is limited to 8,000 characters — this input is N. » (`lib/quota/limits.js:126-133`), côté page puis côté serveur
  (`app/api/ai/route.ts:20-21`).
- **[O] réponse bornée** : `model: "gpt-4o-mini"`, `max_tokens: 1000` (`app/api/ai/route.ts:34-35`) — une réponse plus longue est coupée.
- **[S] aucune inscription** : aucune des routes de ce lot ne lit d'en-tête `Authorization` ni de session
  (`app/api/ai/route.ts`, `ai-vision/route.ts`, `ai-transcribe/route.ts`, `ai-image/route.ts`, `ai-detect/route.ts`,
  `remove-bg/route.ts`, `image-upscale/route.ts`, `media/ticket/route.js` lus en entier) ; seul `app/api/quota/me/route.ts:13-17`
  exige un jeton, et aucun outil de ce lot ne l'appelle.

Règle appliquée : une affirmation juste n'est pas dans les tableaux. « TROMPEUR » sur la FAQ « free » des outils sous [G] =
la limite heure/jour est dite, mais pas le plafond mensuel du site ni le caractère commun du compteur.

---

## 1. AI Chatbot — `/tools/ai-tools/ai-chatbot`

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| ai-chatbot | titre | « Use Openai's Gpt-4o Mini Model Online Free » | FAUX | graphie fausse des marques (« OpenAI », « GPT-4o mini ») ; modèle `gpt-4o-mini` (`app/api/ai/route.ts:34`) ; le titre ne dit pas la tâche | « AI Chatbot — Free Chat with OpenAI's GPT-4o mini, No Signup » |
| ai-chatbot | méta + about | « provide instant answers » | INVÉRIFIABLE | aucune mesure de délai de `/api/ai` dans `docs/audit/` | supprimer « instant » |
| ai-chatbot | about | « the reply is streamed back to your chat window » | FAUX | la route attend la réponse complète d'OpenAI puis renvoie un seul JSON `{ text }` (`app/api/ai/route.ts:51-53, 88-89`) ; la page lit ce JSON (`page.jsx:33-34`) ; aucun flux | « the full reply appears in the chat when it is ready » |
| ai-chatbot | FAQ 1 | « there is an hourly and daily limit per connection » | TROMPEUR | [G] : compteur commun à tous les outils IA + plafond mensuel du site non dits ; [P] message ≤ 8 000 caractères non dit ici | dire : limite par réseau heure/jour partagée avec les autres outils IA, plafond mensuel du site (message affiché), 8 000 caractères par message |
| ai-chatbot | astuce 1 | « Be specific and detailed in your questions… » | GÉNÉRIQUE | — | remplacer par un fait propre : historique envoyé dans la limite de 8 000 caractères (`app/lib/aiClient.js:16-26`) |
| ai-chatbot | astuce 2 | « Use natural language, as you would speak to a person… » | GÉNÉRIQUE | — | supprimer ou remplacer par un fait du code |
| ai-chatbot | astuce 3 | « Break complex questions into smaller parts… » | GÉNÉRIQUE | — | supprimer ou remplacer |

## 2. AI Detector — `/tools/ai-tools/ai-detector`

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| ai-detector | about | « in English, French and many other languages » | INVÉRIFIABLE | mesures du site sur en, fr, de, es, it seulement (`docs/audit/RAPPORT-p17-30-09.md:75-76`) ; `lib/ai/pangram.js:6` dit seulement « supports French » | « measured on English, French, German, Spanish and Italian texts; other languages are less certain » (le caveat de la page le dit déjà, `page.jsx:72`) |
| ai-detector | FAQ 1 | « Yes: 2,000 words a day, free, with no signup… » | TROMPEUR | budget mensuel propre de 50 $ (`lib/quota/aiDetect.js:8-10, 18`) ; une fois atteint, refus 503 pour tous : « The AI detector has reached its monthly budget… » (`aiDetect.js:74-82`) ; non dit | ajouter le plafond mensuel propre et son message |
| ai-detector | FAQ 2 | « It splits the text into segments, labels each one AI-written, AI-assisted or human » | TROMPEUR | la page ne montre que le verdict et trois parts en % (`page.jsx:66-69`) ; seuls `prediction_short`, `fraction_ai`, `fraction_ai_assisted`, `fraction_human`, `headline` sont lus (`lib/ai/pangram.js:75-88`), les segments (`windows`) ne sont ni lus ni affichés | décrire ce que voit le visiteur : un verdict (3 libellés, `page.jsx:15-19`) et trois parts |
| ai-detector | FAQ 4 | « 1,000 words (12,000 characters) covers an essay page » | TROMPEUR | deux limites distinctes (`pangram.js:18, 30`) ; le compteur affiché est le nombre de mots **facturables** = le plus grand de trois comptes, dont 1 mot par 8 caractères (`pangram.js:31-53`) : il peut dépasser le compte d'un traitement de texte | « up to 1,000 words and 12,000 characters; the counter can count more words than a word processor (hyphenated words, long words) » |
| ai-detector | FAQ 4 | « In Chinese, Japanese and Thai, each character counts as a word » | TROMPEUR | liste incomplète : aussi lao, khmer, birman, tibétain, javanais, balinais (`pangram.js:38-40`) | donner la liste complète |

## 3. AI Paraphraser — `/tools/ai-tools/ai-paraphraser`

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| ai-paraphraser | titre | « Use Openai's Gpt-4o Mini Model Online Free » | FAUX | graphie fausse ; ne dit pas la tâche ; modèle `app/api/ai/route.ts:34` | « AI Paraphraser — Reword Text Free with GPT-4o mini » |
| ai-paraphraser | FAQ 1 | « there is an hourly and daily limit per connection » | TROMPEUR | [G] compteur commun + plafond mensuel non dits ; [P] non dit | voir ai-chatbot FAQ 1 |
| ai-paraphraser | FAQ 2 | « Very long text may be truncated by the underlying AI model's response limit » | TROMPEUR | au-delà de 8 000 caractères le texte est **refusé** avant envoi [P] (`page.jsx:22-23`) ; seule la réponse est coupée à 1 000 jetons [O] | « up to 8,000 characters per request; the rewritten text is limited to about 1,000 tokens » |
| ai-paraphraser | FAQ 4 | « Do I need to create an account… No account is necessary » | GÉNÉRIQUE | [S] | fusionner dans la FAQ 1 |
| ai-paraphraser | astuce 3 | « Always review the paraphrased content… » | GÉNÉRIQUE | — | supprimer |
| ai-paraphraser | astuce 4 | « Combine AI Paraphraser with your own manual editing… » | GÉNÉRIQUE | — | supprimer |
| ai-paraphraser | page entière | (about, étapes, FAQ) | MINCE | ne disent pas : 8 000 caractères [P], réponse ≤ 1 000 jetons [O], bouton « Download » (paraphrased.txt, `page.jsx:54`), texte envoyé à OpenAI via notre serveur (dit nulle part sur cette page) | ajouter specs + privacy |

## 4. AI Translator — `/tools/ai-tools/ai-translator`

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| ai-translator | titre | « Translate AI Online Free » | FAUX | l'outil traduit un texte, pas « AI » (`lib/ai/toolPrompts.js:28`) | « AI Translator — Translate Text into 10 Languages Free » |
| ai-translator | interface (sous-titre) | « Translate text to any language with AI » | FAUX | 10 langues cibles seulement (`page.jsx:10`), toute autre refusée par le serveur « Unsupported targetLang. » (`lib/ai/toolPrompts.js:10-13, 113-114`) | « Translate text into 10 languages with AI » |
| ai-translator | about + FAQ 2 | « It automatically detects the language of your input text » / « The source language is detected automatically » | INVÉRIFIABLE | aucune détection dans le code ; la consigne envoyée est seulement « Translate the provided text to <langue> » (`toolPrompts.js:28`) ; aucune langue source affichée | « you don't choose the source language: the model reads it from your text » |
| ai-translator | FAQ 1 | « there is an hourly and daily limit per connection » | TROMPEUR | [G] + [P] non dits | voir ai-chatbot FAQ 1 |
| ai-translator | FAQ 4 | « generally handles technical and industry-specific vocabulary well » | INVÉRIFIABLE | aucune mesure de traduction dans `docs/audit/` | supprimer l'évaluation, garder « have critical documents reviewed » |
| ai-translator | astuce 2 | « Always proofread translated content… » | GÉNÉRIQUE | — | supprimer |
| ai-translator | astuce 4 | « When translating between languages with very different grammar, review… » | GÉNÉRIQUE | — | supprimer |
| ai-translator | page entière | (about, étapes, FAQ) | MINCE | ne disent pas : 8 000 caractères [P], traduction coupée au-delà de 1 000 jetons [O] (un texte long peut revenir incomplet), bouton « Download » (translation.txt, `page.jsx:64`) | ajouter specs |

## 5. AI Writer — `/tools/ai-tools/ai-writer`

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| ai-writer | titre | « Use Openai's Gpt-4o Mini Model Online Free » | FAUX | graphie fausse ; ne dit pas la tâche | « AI Writer — Free AI Text Generator (GPT-4o mini) » |
| ai-writer | FAQ 1 | « there is an hourly and daily limit per connection » | TROMPEUR | [G] + [P] non dits | voir ai-chatbot FAQ 1 |
| ai-writer | FAQ 2 | « content generated by AI Writer can be used for commercial purposes » | INVÉRIFIABLE | aucune source dans le dépôt sur les conditions d'utilisation d'OpenAI | renvoyer aux conditions d'OpenAI sans affirmer, ou supprimer |
| ai-writer | FAQ 3 | « Most content is generated within a few seconds » | INVÉRIFIABLE | aucune mesure de délai de `/api/ai` | supprimer, ou dire « the text appears when the model has finished (no live typing) » |
| ai-writer | FAQ 4 | « you should review and verify it before publishing » | GÉNÉRIQUE | — | supprimer |
| ai-writer | astuce 3 | « Always proofread and personalize AI-generated content… » | GÉNÉRIQUE | — | supprimer |
| ai-writer | page entière | (about, étapes, FAQ) | MINCE | ne disent pas : 8 000 caractères de description [P], texte produit ≤ 1 000 jetons [O] (≈ 750 mots — aucun « long article »), bouton « Download » (text.txt, `page.jsx:54`), envoi à OpenAI | ajouter specs + privacy |

## 6. Audio Transcriber — `/tools/ai-tools/audio-transcriber`

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| audio-transcriber | about | « returns an editable text transcript » | FAUX | le champ « Transcript » est en lecture seule (`page.jsx:55`, `readOnly`) | « returns the transcript as text you can copy or download (TXT, SRT, VTT) » |
| audio-transcriber | FAQ 3 (texte servi) | « Uploads are limited to 4 MB — the maximum the transcription engine (OpenAI Whisper) itself accepts » | FAUX | Whisper accepte 25 MiB (`lib/quota/limits.js:7-10, 83-84`) ; 4 MiB est le plafond de la plateforme Vercel, appliqué quand `NEXT_PUBLIC_MEDIA_SERVICE_URL` est absent (`app/lib/officeUpload.js:85`, `limits.js:43-53`) ; avec le service, 25 MB | dire la vraie raison de chaque chiffre ; vérifier la valeur servie en production (voir faits, NON TROUVÉ) |
| audio-transcriber | FAQ 2 | « and most other formats your browser can select as an audio file » | FORMAT | `accept="audio/*"` (`page.jsx:49`) ; le fichier est envoyé tel quel à Whisper, sans conversion (`app/api/ai-transcribe/route.ts:41-43`) ; un format que Whisper refuse revient en erreur OpenAI (`route.ts:88`) ; `docs/audit/RAPPORT-safari-defauts.md:40` « formats limités côté serveur Whisper » | ne lister que les formats acceptés par Whisper (liste à confirmer, absente du dépôt) et dire que les autres sont refusés |
| audio-transcriber | FAQ 5 | « Your audio file is sent directly to the transcription API… It is not stored on our servers » | FAUX | pas « directly » : il passe par notre route Vercel (`app/lib/officeUpload.js:103-107`), et au-delà de 4 MiB par notre service media-processing (Railway) en morceaux (`officeUpload.js:99-101`), gardé jusqu'à la fin de la transcription puis supprimé (`lib/media/stagedRoute.ts:99-111`) | « sent through our server (and, above 4 MB, our upload service, which deletes it once the transcript is made) to OpenAI Whisper » |
| audio-transcriber | FAQ 1 | « there is an hourly and daily limit per connection » | TROMPEUR | [G] compteur commun + plafond mensuel non dits | voir ai-chatbot FAQ 1 |
| audio-transcriber | astuce 2 | « works well for interviews, meetings, lectures, and podcasts » | INVÉRIFIABLE | aucune mesure de transcription dans `docs/audit/` | supprimer |
| audio-transcriber | astuce 1 | « use audio that is clear with minimal background noise » | GÉNÉRIQUE | — | supprimer |
| audio-transcriber | astuce 3 | « Review and manually correct the transcript afterward… » | GÉNÉRIQUE | — | supprimer |

## 7. Background Remover — `/tools/ai-tools/background-remover`

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| background-remover | méta + about | « instantly removes… giving you a transparent PNG in one click » | INVÉRIFIABLE | mesuré ≈ 4,3-5 s veille comprise (`docs/audit/RAPPORT-detourage-phase2.md:267`) : pas « instantly » ; il faut choisir l'image, cliquer « Remove Background », puis « Download » (`page.jsx:233-249`) | « removes the background in a few seconds and gives a transparent PNG » |
| background-remover | interface (sous-titre) | « Remove any background instantly with AI » | INVÉRIFIABLE | « instantly » non mesuré ; « any » : le service ne garde que le plus grand sujet d'un seul tenant (`services/background-removal/app/infer.py:10-13, 137-153`) | « Remove the background of a photo with AI » |
| background-remover | about | « Perfect for product photos, portraits, and professional graphics » | GÉNÉRIQUE | — | remplacer par un fait (résolution d'origine gardée, 50 MB) |
| background-remover | FAQ 1 | « free to use with no account creation or watermarks » | TROMPEUR | la route passe par [G] (`app/api/remove-bg/route.ts:44-45`) : limite par réseau heure/jour (commune aux outils IA) et plafond mensuel du site, **rien n'est dit** | ajouter les deux limites et leurs messages |
| background-remover | FAQ 2 | « accepts common image formats like JPG and PNG » | FORMAT | l'interface dit JPG, PNG, WEBP (`page.jsx:229`) ; `accept="image/*"` (`page.jsx:232`) et décodage par le navigateur (`page.jsx:23-29`, `app/lib/bigImage.js:337-343`) : tout format que le navigateur ouvre | « JPG, PNG, WebP and any other image your browser can open (e.g. HEIC on Safari); output PNG » |
| background-remover | interface | « JPG, PNG, WEBP supported » | FORMAT | idem : `accept="image/*"` (`page.jsx:232`) | même formulation que la FAQ corrigée |
| background-remover | FAQ 4 | « Do I need to install any software or create an account? No… » | GÉNÉRIQUE | [S] | supprimer (doublon de la FAQ 1) |
| background-remover | astuce 3 | « try a higher-resolution source image » | FAUX | le serveur ne voit qu'une copie ≤ 1 024 px (`page.jsx:21, 36-47` ; `infer.py:53` `MODEL_INPUT_SIZE (1024, 1024)`) et l'affinage des bords travaille sur ≤ 1 Mpx (`app/lib/mattingRefine.js:23`, `page.jsx:68`) : une source plus grande n'améliore pas la détection | supprimer ; dire plutôt que le résultat garde la résolution d'origine |
| background-remover | astuce 1 | « use images with clear contrast between the subject and background » | GÉNÉRIQUE | — | supprimer ou garder une seule astuce de ce type |
| background-remover | astuce 2 | « Simple, uniform backgrounds are removed more cleanly… » | GÉNÉRIQUE | — | supprimer |

## 8. Data Extractor — `/tools/ai-tools/data-extractor`

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| data-extractor | FAQ 1 | « there is an hourly and daily limit per connection » | TROMPEUR | [G] + [P] non dits | voir ai-chatbot FAQ 1 |
| data-extractor | FAQ 3 | « …which you can copy. There is no direct file download to CSV or Excel » | TROMPEUR | un bouton « Download » donne `extracted-data.txt` (`page.jsx:54`) — non dit | « copy it, or download it as a .txt file; no CSV/Excel file » |
| data-extractor | astuce 1 | « Use clear, well-formatted source text… » | GÉNÉRIQUE | — | supprimer |
| data-extractor | astuce 3 | « Test with a small sample first… » | GÉNÉRIQUE | — | supprimer |
| data-extractor | page entière | (about, étapes) | MINCE | ne disent pas : 8 000 caractères [P], réponse ≤ 1 000 jetons [O] (un grand tableau peut revenir coupé) | ajouter specs |

## 9. Email Generator — `/tools/ai-tools/email-generator`

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| email-generator | FAQ 1 | « there is an hourly and daily limit per connection » | TROMPEUR | [G] + [P] non dits | voir ai-chatbot FAQ 1 |
| email-generator | FAQ 2 | « suitable for both personal and professional business communications » | GÉNÉRIQUE | — | remplacer par les 5 tons réels (`page.jsx:10`, `toolPrompts.js:14`) |
| email-generator | FAQ 4 | « No account is necessary; you can start generating emails immediately » | GÉNÉRIQUE | [S] | fusionner dans la FAQ 1 |
| email-generator | astuce 3 | « Review and edit the generated content before sending… » | GÉNÉRIQUE | — | supprimer |
| email-generator | page entière | (about, étapes, FAQ) | MINCE | ne disent pas : 8 000 caractères [P], bouton « Download » (email.txt, `page.jsx:64`), envoi à OpenAI | ajouter specs + privacy |

## 10. Grammar Fixer — `/tools/ai-tools/grammar-fixer`

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| grammar-fixer | titre | « Use Openai's Gpt-4o Mini Model Online Free » | FAUX | graphie fausse ; ne dit pas la tâche | « Grammar Fixer — Free Grammar & Spelling Checker, See Every Change » |
| grammar-fixer | FAQ 1 | « there is an hourly and daily limit per connection » | TROMPEUR | [G] + [P] non dits | voir ai-chatbot FAQ 1 |
| grammar-fixer | FAQ 2 | « as part of rewriting your text » | FAUX | la consigne interdit de réécrire : « Make MINIMAL, PRECISE edits. DO NOT rewrite, paraphrase or reorder anything. » (`lib/ai/toolPrompts.js:47-48, 54`) | « it corrects only the errors and leaves correct sentences as written » |
| grammar-fixer | FAQ 5 | « Portuguese, German, Italian, Spanish and Arabic… it corrects most errors while changing few correct sentences » | TROMPEUR | consigne actuelle (température 0, `toolPrompts.js:66`), corrections exactes sur 40 phrases : pt 29, de 16-17, it 9, es 11, ar 6 (`docs/audit/RAPPORT-deploiement-28-09.md:64-77`) : « most » faux pour de, it, es, ar | donner les chiffres mesurés ou dire « fewer than half of the sentences in German, Italian, Spanish and Arabic were corrected exactly » |
| grammar-fixer | astuce 3 | « Use Grammar Fixer before submitting important documents… » | GÉNÉRIQUE | — | supprimer |
| grammar-fixer | astuce 4 | « Combine Grammar Fixer with your own proofreading… » | GÉNÉRIQUE | — | supprimer |

## 11. Image Captioner — `/tools/ai-tools/image-captioner`

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| image-captioner | titre | « Use Openai's Gpt-4o Mini Vision Model » | FAUX | graphie fausse ; ne dit pas la tâche | « Image Captioner — Free AI Image Caption Generator » |
| image-captioner | méta + about | « a descriptive caption for any image you upload » | TROMPEUR | seulement les images que le navigateur décode (`app/lib/imageForVision.js:12-41`), ≤ 80 MB (`lib/quota/limits.js:103`) ; zones transparentes peintes en blanc (`imageForVision.js:52-54`) | « for a JPG, PNG, WebP… image up to 80 MB » |
| image-captioner | about | « anyone who needs quick alt text » | TROMPEUR | la consigne demande « a creative, descriptive caption » (`lib/ai/toolPrompts.js:87`), pas un texte alternatif | « a descriptive caption (review it before using it as alt text) » |
| image-captioner | FAQ 1 | « there is an hourly and daily limit per connection » | TROMPEUR | [G] (`app/api/ai-vision/route.ts:26-27`) : compteur commun + plafond mensuel non dits | voir ai-chatbot FAQ 1 |
| image-captioner | FAQ 2 | « common image formats including JPG, PNG, GIF, and WebP » | FORMAT | `accept="image/*"` (`page.jsx:69`) ; tout format décodable par le navigateur (`imageForVision.js:12-28`) ; GIF animé : une seule image est décrite (dessin unique sur canvas, `imageForVision.js:56`) | lister « JPG, PNG, WebP, GIF (first frame), and any image your browser opens » |
| image-captioner | FAQ 4 | « Your image is sent to OpenAI's API… » | TROMPEUR | c'est une **copie réduite** (JPEG ≤ 2 048 px, qualité 0,85) faite dans le navigateur qui part, l'original ne quitte pas l'appareil (`imageForVision.js:9-10, 45-63` ; `page.jsx:45-46`), via notre route (`app/api/ai-vision/route.ts:30-44`) | le dire (c'est un argument de confidentialité) |
| image-captioner | FAQ 3 | « you should review and edit the caption before relying on it… » | GÉNÉRIQUE | — | supprimer |
| image-captioner | astuce 1 | « Use specific, keyword-rich edits… for better SEO » | GÉNÉRIQUE | — | supprimer |
| image-captioner | astuce 2 | « Add relevant hashtags or brand details manually… » | GÉNÉRIQUE | — | supprimer |

## 12. AI Image Generator — `/tools/ai-tools/image-generator`

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| image-generator | about | « among the highest-rated image models in independent blind comparisons » | TROMPEUR | le classement cité concerne gpt-image-2 **high** ; le site utilise `quality: "low"` (`app/api/ai-image/route.ts:11, 57`), non mesuré (`docs/audit/RAPPORT-ecarts-marche.md:155, 182`) | supprimer, ou « the model family ranks first in blind votes at its high setting; this tool uses its low (fastest) setting » |
| image-generator | about | « like the daily limits of the best-known free generators » | TROMPEUR | références du code : Bing 15/jour (avec compte), Ideogram ≈ 10/jour (`lib/quota/imageGen.js:3-4`) ; 5 est en dessous | supprimer la comparaison |
| image-generator | FAQ 1 | « Yes: 5 images per day per visitor, no signup and no watermark » | TROMPEUR | aussi : [G] limite par réseau heure/jour commune aux outils IA (`route.ts:42`), budget mensuel propre 5 $ (`imageGen.js:14, 36-38`) et plafond mensuel du site [G] — non dits | ajouter les trois et leurs messages |
| image-generator | FAQ 2 | « at its fast quality setting » | TROMPEUR | réglage `"low"`, le plus bas (`route.ts:11`) | « at its low quality setting (the fastest and cheapest) » |
| image-generator | FAQ 3 | « OpenAI's terms assign you the rights to images you create » | INVÉRIFIABLE | aucune source dans le dépôt | citer la page d'OpenAI vérifiée, ou supprimer |
| image-generator | interface + étape 3 | « get it in seconds » / « about 10–30 seconds » / « wait 10 to 30 seconds » | INVÉRIFIABLE | deux images mesurées, 16 s chacune (`RAPPORT-ecarts-marche.md:41, 160`) ; pas de mesure de l'écart 10-30 s | « usually under half a minute (16 s measured) » ou mesurer |
| image-generator | astuce 3 | « Text inside images works best when short and put in quotes » | INVÉRIFIABLE | aucune mesure | supprimer |

## 13. AI Image Upscaler — `/tools/ai-tools/image-upscaler`

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| image-upscaler | FAQ 1 | « Yes, it's free with no signup and no watermark » | TROMPEUR | sur notre serveur : billets du service limités par réseau, heure et jour (`app/api/media/ticket/route.js:28, 36-42`, variables `MEDIA_JOBS_PER_HOUR_PER_IP` / `MEDIA_JOBS_PER_DAY_PER_IP`, `lib/media/ticket.js:49-50` ; une image > 2 Mpx envoyée en bandes consomme un billet par bande, `app/lib/localUpscale.js:193-194, 200-239`) et budget mensuel propre de 5 $ (`lib/quota/upscaleBudget.js:14, 46-49`) ; non dits | dire : illimité sur l'appareil (WebGPU) ; sur notre serveur, limite par connexion heure/jour et plafond mensuel |
| image-upscaler | about | « than the leading online upscaler's (LPIPS… 0.107 against 0.164) » | INVÉRIFIABLE | la mesure existe contre **iLoveIMG** (`docs/audit/RAPPORT-ecarts-marche.md:126-139`) ; « leading » n'est pas prouvé | nommer iLoveIMG, retirer « leading » |
| image-upscaler | FAQ 5 | « (current Chrome, Edge and Safari, and Firefox on Windows) » | INVÉRIFIABLE | liste tirée d'une recherche (`docs/audit/RAPPORT-global-28-09.md:119`) ; seul Chromium avec WebGPU testé (`ibid.:127`) ; le code teste seulement `navigator.gpu` (`localUpscale.js:17-23`) | « when your browser offers WebGPU (the page detects it) » |
| image-upscaler | astuce 4 | « downloads the AI model (about 25 MB) » | INVÉRIFIABLE | le fichier du modèle fait 17 288 863 octets (`public/models/4xNomos2_hq_mosr-web.onnx`) ; le moteur ONNX Runtime 1.30.0 vient de cdn.jsdelivr.net (`localUpscale.js:13, 35`), taille non mesurée dans le dépôt | « about 17 MB of model plus the AI engine » ou mesurer le total |
| image-upscaler | FAQ 3 | « Up to 6 megapixels (for example 3000×2000) » | TROMPEUR | limite de fichier de 30 MB non dite (`page.jsx:16, 44` ; `services/background-removal/app/upscale.py:41`) | ajouter « and 30 MB » |

## 14. Keyword Extractor — `/tools/ai-tools/keyword-extractor`

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| keyword-extractor | FAQ 1 | « there is an hourly and daily limit per connection » | TROMPEUR | [G] + [P] non dits | voir ai-chatbot FAQ 1 |
| keyword-extractor | astuce 2 | « long-tail phrases… often have less competition » | INVÉRIFIABLE | l'outil ne donne aucune donnée de volume ni de concurrence (consigne `toolPrompts.js:69`) | supprimer |
| keyword-extractor | astuce 1 | « Use the extracted keywords to inform your meta descriptions… » | GÉNÉRIQUE | — | supprimer |
| keyword-extractor | page entière | (about, étapes, FAQ) | MINCE | ne disent pas : 8 000 caractères [P] (≈ 1 300 mots : un long article est refusé), bouton « Download » (keywords.txt, `page.jsx:54`) ; jumeau sans IA `text-tools/word-counter` (densité, `KeywordDensity`) non cité | ajouter specs, différence avec Word Counter |

## 15. Sentiment Analyzer — `/tools/ai-tools/sentiment-analyzer`

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| sentiment-analyzer | FAQ 1 | « there is an hourly and daily limit per connection » | TROMPEUR | [G] + [P] non dits | voir ai-chatbot FAQ 1 |
| sentiment-analyzer | FAQ 2 | « It works best with English » | INVÉRIFIABLE | aucune mesure par langue | « it reads any language the model knows; no accuracy figure is published » |
| sentiment-analyzer | astuce 1 | « provide complete sentences rather than single words… » | GÉNÉRIQUE | — | supprimer |
| sentiment-analyzer | page entière | (about, étapes, FAQ) | MINCE | ne disent pas : 8 000 caractères [P], format réel du résultat (texte libre du modèle : classe + pourcentage + explication, `toolPrompts.js:72`), bouton « Download » (sentiment.txt, `page.jsx:54`) | ajouter specs |

## 16. Text Summarizer — `/tools/ai-tools/text-summarizer`

| Outil | Endroit | Phrase exacte | Type | Ce que dit le code | Correction attendue |
|---|---|---|---|---|---|
| text-summarizer | about | « get back a shorter version in seconds » | INVÉRIFIABLE | aucune mesure de délai | supprimer « in seconds » |
| text-summarizer | FAQ 1 | « there is an hourly and daily limit per connection » | TROMPEUR | [G] + [P] non dits | voir ai-chatbot FAQ 1 |
| text-summarizer | FAQ 2 | « There's no fixed word limit, but very long input may be truncated » | FAUX | limite fixe de 8 000 caractères, texte **refusé** au-delà avec un message [P] (`page.jsx:22-23`, `app/api/ai/route.ts:20-21`) | « up to 8,000 characters (about 1,300 words) per summary; split longer texts » |
| text-summarizer | FAQ 3 | « It works best with English content » | INVÉRIFIABLE | aucune mesure par langue | supprimer l'évaluation |
| text-summarizer | astuce 4 | « Use Text Summarizer alongside your reading… » | GÉNÉRIQUE | — | supprimer |
| text-summarizer | page entière | (about, étapes) | MINCE | ne disent pas : 8 000 caractères, bouton « Download » (summary.txt, `page.jsx:54`), jumeau `pdf-tools/pdf-ai-summary` (même route, `pdf-ai-summary/page.jsx:60`) | ajouter specs + lien vers PDF AI Summary |

---

## Synthèse du lot « ai » (16 outils lus, 103 défauts)

| Type | Nombre |
|---|---|
| FAUX | 14 |
| INVÉRIFIABLE | 19 |
| TROMPEUR | 29 |
| GÉNÉRIQUE | 29 |
| MINCE | 8 |
| LIBELLÉ | 0 |
| FORMAT | 4 |

Aucun bouton cité par une page n'est faux : « Send », « Detect AI Content », « Paraphrase », « Translate », « Generate Content »,
« Extract Data », « Generate Email », « Fix Grammar », « Keep all / Undo all », « Generate Caption », « Generate Image »,
« Upscale Image », « Remove Background », « Download », « Copy » existent tous avec ce nom.
