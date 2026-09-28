# Sources de domaines référents — liste classée, hors Product Hunt (29/09/2026)

**Pourquoi :** bloquant 1 et OBJECTIF — position moyenne 74,7, **zéro domaine référent** contre 7 600 chez FreeConvert. Product Hunt était la seule source prévue. Ce document en donne **24 autres**, légitimes, classées par valeur, chacune avec son texte prêt à coller. **Rien n'a été soumis** (aucun compte créé, aucun envoi) : chaque soumission est une tâche du propriétaire, inscrite dans le plan dans cet ordre.

**Exclu par principe :** tout achat de lien, échange de liens, ferme ou réseau de sites, annuaire « payez pour un lien suivi », commentaires ou profils créés pour le lien, texte d'ancre imposé — tout ce que les règles anti-spam de Google appellent *link schemes*. Un lien doit venir d'une page où un humain nous recommande réellement.

---

## 1. D'où viennent réellement les liens des concurrents — le moyen

**Limite de méthode, dite d'emblée :** la liste des domaines référents d'un site n'est publique nulle part sans compte. Les pages publiques d'Ahrefs donnent les **totaux** (ezgif.com : DR 81, ≈ 11 000 domaines référents en août 2026) ; le vérificateur gratuit qui donnerait la liste est derrière une vérification anti-robot, que je ne contourne pas. J'ai donc relevé les sources **par familles**, en retrouvant sur le web public les pages qui lient les concurrents, puis **en lisant l'attribut `rel` du lien dans le HTML réel** (29/09/2026, `curl` + recherche du lien sortant) :

| Famille de source | Exemple trouvé (concurrent lié) | Lien suivi ? (lu dans le HTML) | Ce que ça enseigne |
|---|---|---|---|
| **Guides de bibliothèques universitaires (LibGuides)** | UC San Diego « Digital Media », Hagerstown CC, USC Lancaster → **TinyWow** ; Monroe College, Sarah Lawrence, South Piedmont CC → **CloudConvert** | **SUIVI** (UCSD → `tinywow.com`, aucun `rel`) | des bibliothécaires listent des convertisseurs gratuits pour les étudiants ; lien suivi, domaine universitaire, **obtenu par recommandation, pas par soumission** |
| **Show HN / Hacker News** | VERT (convertisseur dans le navigateur) : **601 points, 112 commentaires** (12/04/2025) ; Convert.now : 4 points | **SUIVI quand le sujet perce** (VERT : lien sans `rel`) ; **nofollow sinon** (Convert.now : `rel="nofollow"`) | un seul sujet réussi fait un lien suivi **et** déclenche la presse : MakeUseOf a consacré un article à VERT le 20/05/2026, avec lien |
| **Presse tech « j'ai trouvé un outil »** | MakeUseOf → vert.sh (20/05/2026) | lien présent (article) | l'effet d'entraînement d'un lancement communautaire réussi |
| **Listes « awesome » sur GitHub** | `davisonio/awesome-gif` → ezgif ; `awesome-no-upload-browser-tools`, `awesome-privatool-fot` → outils locaux | **nofollow** (GitHub : `rel="nofollow"` sur ezgif) | pas de valeur directe de classement, mais très recopiées (miroirs, agrégateurs) et lues par des rédacteurs |
| **Sites d'alternatives** | SaaSHub → CloudConvert ; AlternativeTo → VERT, TinyWow | SaaSHub **nofollow** (lu, **contrairement à ce qu'affirment plusieurs guides** « dofollow ») ; AlternativeTo : **non vérifiable** (page bloquée aux robots) | trafic qualifié (« alternative à iLovePDF… »), et référencement des pages d'alternatives elles-mêmes |
| **Communautés de fondateurs** | Indie Hackers (produits) | **nofollow** (lu) | visibilité, pas de lien suivi |
| **Réponses Stack Overflow / Super User, articles dev.to / Medium** | nombreuses réponses citent ezgif | page protégée aux robots, non lu | lien de réponse utile, avec divulgation obligatoire de l'affiliation |

**Conclusion (décidée selon la règle de décision) :** les liens **suivis** de valeur ne s'obtiennent pas en remplissant des annuaires ; ils viennent de **recommandations** (bibliothécaires, journalistes, articles) déclenchées par **de la visibilité** (Show HN, Reddit, listes). L'ordre ci-dessous suit donc la valeur réelle : d'abord ce qui peut faire naître des liens éditoriaux suivis, puis les profils à fort trafic, puis les annuaires.

**Nos atouts à mettre en avant partout, parce qu'ils sont mesurés :** 225 outils, aucune inscription, ≈ 180 entièrement dans le navigateur (vérifiable dans l'onglet Réseau), résultats face au concurrent nommé (voir `product-hunt.md` §4). **Ne jamais écrire « 100 % local » pour le site entier** : 44 outils passent par un serveur.

---

## 2. La liste classée (24 cibles)

Légende — **Valeur** : ★★★ peut produire des liens suivis éditoriaux ou un lien suivi direct ; ★★ fort trafic qualifié ou lien suivi incertain ; ★ visibilité, lien nofollow. **Suivi** : vérifié dans le HTML le 29/09 quand indiqué « lu », sinon « non vérifié ». **Délai** : jusqu'à la mise en ligne, ordre de grandeur relevé sur les pages des services quand elles le disent, sinon « inconnu ».

| # | Cible | Valeur | Suivi | Compte requis | Règles clés | Délai |
|---|---|---|---|---|---|---|
| 1 | **Show HN** (news.ycombinator.com) | ★★★ | suivi si le sujet perce, nofollow sinon (lu) | oui, gratuit (HN) | quelque chose qu'on peut **essayer sans inscription** ; titre « Show HN: … » ; **ne jamais demander à des amis de voter ou commenter** ; le fondateur répond aux questions | immédiat |
| 2 | **Bibliothèques universitaires (LibGuides)** — courriel aux auteurs des guides qui listent déjà des convertisseurs | ★★★ | **suivi (lu)** | non (courriel) | un courriel personnel par guide, pas d'envoi en masse ; proposer, ne pas insister | semaines, réponse incertaine |
| 3 | **Presse tech** — MakeUseOf, How-To Geek, Lifehacker (formulaires ou adresses de suggestions de leurs pages Contact) | ★★★ | lien d'article (non vérifié à l'avance) | non | un court message factuel ; **après** un Show HN ou un Reddit réussi, avec le lien de la discussion | semaines, incertain |
| 4 | **r/InternetIsBeautiful** | ★★ | nofollow (Reddit) | oui (Reddit) | **aucune inscription sur le site présenté** (nous : ✓) ; site réellement nouveau ou remarquable ; règle 90/10 d'autopromotion ; **relire le règlement de la communauté le jour même** | immédiat |
| 5 | **AlternativeTo** — fiche du site + « alternative à » ezgif, iLovePDF, TinyWow, CloudConvert | ★★ | non vérifiable (bloqué aux robots) | oui | fiche factuelle, catégories exactes, pas de faux avis | modération, jours |
| 6 | **SaaSHub** — fiche + alternatives | ★★ | **nofollow (lu)** | oui | fiche factuelle | jours |
| 7 | **awesome-no-upload-browser-tools** (GitHub) — outils **locaux** seulement | ★★ | nofollow (GitHub, lu) | oui (GitHub, existant) | n'y proposer **que** des outils qui ne téléversent rien (ZIP Extractor, Image Compressor, Hash Generator…) ; suivre le format de la liste | revue de la PR, jours à semaines |
| 8 | **awesome-privatool-fot** (GitHub) — même règle | ★★ | nofollow | oui (GitHub) | « 100 % dans le navigateur, sans envoi, sans connexion » → **outils locaux seulement, jamais le site entier** | idem |
| 9 | **r/SideProject** | ★★ | nofollow | oui (Reddit) | autopromotion admise dans le fil principal, **à condition d'échanger** avec les autres projets | immédiat |
| 10 | **r/webdev — Showoff Saturday** (le samedi seulement) | ★★ | nofollow | oui (Reddit) | **le samedi uniquement**, contenu **technique**, pas commercial | le samedi suivant |
| 11 | **Article technique sur dev.to** (et/ou Hashnode) : « comment nous mesurons chaque outil contre le leader du marché » | ★★ | non vérifié | oui | article réellement utile (méthode, chiffres), lien vers les outils cités ; pas une publicité | immédiat |
| 12 | **awesome-gif** (`davisonio/awesome-gif`) — outils GIF | ★ | nofollow (lu) | oui (GitHub) | vérifier que la liste accepte encore des contributions avant d'ouvrir la PR | jours à semaines |
| 13 | **Stack Overflow / Super User** — répondre à de vraies questions (ouvrir un RAR dans le navigateur, empreinte d'un gros fichier…) | ★ | non vérifié (page protégée) | oui | **divulguer l'affiliation** dans chaque réponse (« I built this ») ; répondre à la question même sans le lien | immédiat |
| 14 | **Indie Hackers** — page produit | ★ | **nofollow (lu)** | oui | profil de produit honnête | immédiat |
| 15 | **Uneed** (uneed.best) | ★ | non vérifié | oui | lancement du jour en file d'attente gratuite | file d'attente, jours à semaines |
| 16 | **Fazier** (fazier.com) | ★ | non vérifié (bloqué aux robots) | oui | lancement gratuit | jours |
| 17 | **MicroLaunch** (microlaunch.net) | ★ | non vérifié | oui | lancement sur un mois | semaines |
| 18 | **Peerlist Launchpad** | ★ | non vérifié | oui (Peerlist) | lancement hebdomadaire | semaine suivante |
| 19 | **DevHunt** (devhunt.org) — la catégorie développeur (57 outils) | ★ | non vérifié | oui (GitHub) | outils pour développeurs seulement | semaines |
| 20 | **There's An AI For That** — seulement les outils IA réels (Image Upscaler, Background Remover, Grammar Fixer) | ★ | non vérifié | oui | un outil IA par fiche ; jamais « AI » pour un outil qui n'en a pas | jours |
| 21 | **Toolify.ai** — mêmes outils IA | ★ | non vérifiable (bloqué aux robots) | oui | idem | jours |
| 22 | **Futurepedia** — mêmes outils IA | ★ | non vérifié | oui | idem ; certaines offres de mise en avant sont payantes → **n'utiliser que la soumission gratuite** | semaines |
| 23 | **Slant** — répondre aux questions « What are the best online file converters? » | ★ | non vérifié | oui | proposition argumentée, pas de votes arrangés | jours |
| 24 | **Launching Next** / **StartupStash** | ★ | non vérifié | oui ou formulaire | soumission gratuite seulement (pas d'option payante) | semaines |

**Écartés :** BetaList (réservé aux produits pas encore lancés) ; Wikipedia (l'autopromotion y est interdite, et ses liens sortants sont nofollow) ; tout annuaire qui vend le lien suivi.

---

## 3. Textes prêts à coller (anglais)

### 3.1 Blocs communs (pour tous les annuaires et fiches)

**Nom :** OnlineConverTools — **Adresse :** https://www.onlineconvertools.com (sans paramètre de suivi)

**Une ligne (≤ 60 car.) :** `225 free tools. Most never upload your file.`

**Court (≈ 50 mots) :**
> 225 free online tools for PDF, images, audio, video, archives and developers — no sign-up. About 180 of them run entirely in your browser, so the file never leaves your device (you can check the Network tab). The rest (video, Office ↔ PDF, AI) use our server and say so on the page.

**Long (≈ 150 mots) :**
> OnlineConverTools is a free collection of 225 tools for PDF, images, GIF, audio, video, archives, text, math and developers. There is no sign-up. About 180 of the tools run entirely in your browser — files are processed on your device and never uploaded; you can verify it in your browser's Network tab. The others (video conversion, Office ↔ PDF, AI tools) need a server, and their pages say so and state their size limits before you pick a file.
> Each main tool is tested against the site people usually use for the same job, on the same file: for example, lossless PDF compression −35.4 % with every page pixel-identical, RAR/7z/ZIP and 40+ archive formats opened in the browser (first file out of a 1.99 GB RAR in 5.1 s vs 7.25 s at ezyZip), and barcodes re-read by an independent decoder before download (102 of 102).

**Catégories / étiquettes :** File converter · PDF tools · Image tools · Privacy · Developer tools · Free · Web app · No sign-up

**Alternatives à indiquer (AlternativeTo, SaaSHub, Slant) :** iLovePDF, Smallpdf, TinyWow, CloudConvert, FreeConvert, Convertio, ezgif, 123apps.

### 3.2 Show HN (cible 1)

**Titre (≤ 80 car.) :** `Show HN: 225 free file tools, most run in the browser and never upload your file`

**Texte :**
> ⟦One line in your own words: who you are and why you built it.⟧
>
> It's a collection of 225 free tools (PDF, images, audio, video, archives, dev tools), no sign-up. About 180 run entirely client-side — WebAssembly (7-Zip, ffmpeg.wasm, MozJPEG/OxiPNG, Tesseract), Canvas, Web Workers — so the file never leaves your machine; the Network tab shows no upload. The other ~44 (video transcoding, Office ↔ PDF, AI) go through a server, and each of those pages says so and states its size limit before you choose a file.
>
> The rule I set myself: each tool must do at least as well as the site people usually use for that job, on the same file. Some measurements: lossless PDF compression −35.4 % with pages pixel-identical (iLovePDF "recommended": −35.0 %, images re-compressed); first file out of a 1.99 GB RAR in 5.1 s vs 7.25 s at ezyZip; barcodes re-read by zxing-cpp before download, 102/102.
>
> I'd really like to hear where it falls short, and which tool you'd compare against which site.

*(Consignes : poster un jour de semaine, rester disponible plusieurs heures pour répondre, ne demander à personne de voter.)*

### 3.3 Courriel aux bibliothécaires (cible 2) — un par guide, personnalisé

Pages repérées qui listent déjà des convertisseurs : UC San Diego « Digital Media » (`ucsd.libguides.com/digital-scholarship/digital-media`), Hagerstown CC « Study & Computer Skills », USC Lancaster « Presentation Aids », Monroe College « Computers, Printing, WiFi », Sarah Lawrence « Podcasting », South Piedmont CC « Converting Audio Files to MP3 ». *(Le nom et l'adresse de l'auteur figurent sur chaque guide.)*

> **Subject:** A free converter that keeps students' files on their own computer — for your "⟦guide name⟧" guide
>
> Hello ⟦librarian's name⟧,
>
> Your guide "⟦guide name⟧" recommends free online converters to students. I built one that may be worth considering for files students would rather not upload (coursework, recordings, scans): about 180 of its 225 tools run entirely in the browser, so the file never leaves the student's computer. It's free, with no sign-up.
>
> The tools most relevant to your guide: ⟦2-3 links, e.g. https://www.onlineconvertools.com/tools/audio-tools/audio-converter⟧. Tools that do need a server (video conversion, Office to PDF, AI) say so on their page.
>
> If it's useful, feel free to add it; if not, no reply needed. Thank you for maintaining the guide.
>
> ⟦Your name⟧ — OnlineConverTools

### 3.4 Presse tech (cible 3) — à envoyer APRÈS un Show HN ou un Reddit réussi

> **Subject:** Tip: 225 free file tools, most of which never upload your file
>
> Hi, a tip in case it fits your "useful sites" coverage: OnlineConverTools (https://www.onlineconvertools.com) is a free collection of 225 file tools with no sign-up; about 180 of them run entirely in the browser, which you can verify in the Network tab. Each main tool is measured against the usual site for the job on the same file (e.g., lossless PDF compression −35.4 % with pages pixel-identical). ⟦Link to the HN/Reddit discussion.⟧ Happy to answer any question. — ⟦Your name⟧

### 3.5 Reddit (cibles 4, 9, 10)

**r/InternetIsBeautiful — titre :** `A free site with 225 file tools where most of them never upload your file — conversion happens in your browser`

**r/SideProject — titre :** `I built 225 free file tools and tested each main one against the site people usually use` — texte : le bloc « Long » + « What would you compare it against? ».

**r/webdev Showoff Saturday — titre :** `Opening a 2 GB RAR in the browser with 7-Zip compiled to WebAssembly — first file out in 5 s` — texte technique : 7-Zip et zip.js dans le navigateur, aucun envoi (détails à relire dans le code de la page avant publication) ; lien vers ZIP Extractor ; questions ouvertes aux développeurs.

### 3.6 Listes « awesome » (cibles 7, 8, 12) — une ligne par outil local, au format de la liste

```
- [ZIP Extractor (OnlineConverTools)](https://www.onlineconvertools.com/tools/file-tools/zip-extractor) - Open ZIP, RAR, 7z and 40+ archive formats in the browser, password-protected and split archives included; nothing is uploaded.
- [Image Compressor (OnlineConverTools)](https://www.onlineconvertools.com/tools/image-tools/image-compressor) - Compress JPG, PNG, WebP and SVG in the browser (MozJPEG, OxiPNG, libwebp in WebAssembly), format kept, nothing uploaded.
- [Hash Generator (OnlineConverTools)](https://www.onlineconvertools.com/tools/developer-tools/hash-generator) - 17 hash algorithms for text or files of any size, computed in the browser.
```
Pour `awesome-gif` : une ligne vers le GIF Maker (outil local) — **vérifier avant** dans le code de la page qu'il n'appelle aucun serveur (les GIF faits **depuis une vidéo** passent par le serveur).

### 3.7 Stack Overflow / Super User (cible 13) — modèle de fin de réponse

> *(réponse complète à la question d'abord, utile même sans le lien)* … If you'd rather not install anything, a browser tool I built does this client-side (the file isn't uploaded): ⟦link⟧. Disclosure: I'm the developer.

### 3.8 Outils IA (cibles 20-22) — une fiche par outil réel

**Image Upscaler :** `AI image upscaler ×2/×4, up to 6 megapixels; runs on your device with WebGPU when available, otherwise on our server. Free, no sign-up.`
**Background Remover :** `Remove image backgrounds with a self-hosted IS-Net model; files up to 50 MB, full-resolution result. Free, no sign-up.`
**Grammar Fixer :** `Grammar and spelling fixes shown word by word, each one can be undone. Free, no sign-up.` *(ne pas annoncer une qualité égale dans toutes les langues : mesuré en dessous de LanguageTool en russe.)*
