# Kit Product Hunt — prêt à l'emploi (29/09/2026)

**Document de contenu.** Il remplace `03-textes-en.md` (textes) et complète `01-recherche-lancements.md` (lancements de 2015-2026 déjà étudiés). Rien n'est publié. Les passages entre **⟦crochets doubles⟧** sont personnels : le propriétaire les écrit ou les ajuste, Claude n'a inventé aucun fait personnel. **Aucune date de lancement n'est proposée ici** (règle absolue du propriétaire : pas de date tant que le site n'est pas fiable à 100 % et audité).

---

## 1. Règles et formats actuels — relevés en direct le 29/09/2026

Sources : **A** = `producthunt.com/launch/preparing-for-launch` (page officielle « Prepare for your launch ») ; **B** = `help.producthunt.com/en/articles/479557-how-to-post-a-product` (centre d'aide officiel).

| Élément | Règle relevée | Ce que nous faisons |
|---|---|---|
| Nom | le nom du produit seul, **sans description ni émoji** (A, B) | `OnlineConverTools` |
| Tagline | **60 caractères au plus** (A) ; « sans gimmick ni langage excessif » (A) | 44 caractères |
| Description | **500** caractères (A) **ou 260** (B) : les deux pages officielles se contredisent toujours | **≤ 260** (tient dans les deux) : 227 |
| Vignette | carrée, **240 × 240** recommandé, **< 3 Mo** ; GIF permis, s'anime au survol, première image = vignette (A, B) | `galerie/thumbnail.png` 240×240 |
| Galerie | **1270 × 760** recommandé ; **au moins 2 images** pour que la fiche soit visible ; réordonnable ; GIF animés permis (A, B) | 8 images 1270×760, 71-200 Ko chacune |
| Vidéo | **YouTube seulement**, adresse complète (pas de lien raccourci), vidéo non privée (A, B) ; ≈ 53 % des « produits du jour » depuis 2021 en avaient une (A) | **aucune pour l'instant** (voir §6) |
| Premier commentaire | « très recommandé » ; **70 %** des produits du jour/semaine/mois en avaient un ; fonctionnalités, public, histoire, demande de retours ; **ne jamais demander de votes, demander des retours** (A) | brouillon §4 |
| Heure | classement sur 24 h, **heure du Pacifique** ; lancer à **00 h 01 PST** (A, B) ; programmation jusqu'à **1 mois** à l'avance, ou brouillon (A, B) | 00 h 01 PT = **3 h 01 à Montréal** |
| Jour | officiel : « quand vous êtes prêt », selon l'audience (A) ; étude tierce de 50 lancements (uprowshub.com, 2026) : **mardi 32 %** et **mercredi 26 %** des top 5 ; **0 % de top 5 après 6 h PT** | à choisir par le propriétaire le moment venu |
| Topics | « quelques-uns, ceux qui collent le mieux » (B) ; 3 au plus (A, lu le 28/09) | Productivity, Developer Tools, Privacy |
| Lien du produit | **pas de lien raccourci ni de paramètre de suivi (UTM)** (A) | `https://www.onlineconvertools.com` |
| Doublon | ne pas republier le même produit sans changement **dans les 6 mois** (A) | premier lancement |

## 2. Lancements comparables — ce qui a marché, et par quel moyen

Complète le tableau de `01-recherche-lancements.md` (remove.bg, CloudConvert, Photopea, ezGIF…). Relevés sur les pages Product Hunt le 28-29/09/2026.

| Produit | Date | Résultat | Moyen observé |
|---|---|---|---|
| **TabTasker** — « Zero servers. Total privacy. Your new favorite toolbox. » | 31/05/2026 | **n° 4 du jour, 236 points** | le traitement local EST l'argument, jusque dans la tagline ; le premier commentaire donne **une preuve que le lecteur peut refaire** (onglet Réseau : aucun envoi) et nomme la technique (WebAssembly, ONNX dans le navigateur) ; réponses techniques détaillées dans le fil ; 5 captures, **une par outil**, pas de vidéo |
| **10015 Tools** — « All Online Tools in One Box » | 2024 | **n° 4 du jour, 307 points** | premier commentaire : **problème personnel** (outils en ligne mal faits) → boîte à outils faite pour soi → **chiffres d'audience réels** (350 000 visites/mois, 25 000 inscrits) ; argument : interface soignée ; 4 images, pas de vidéo |
| **IT Tools** — « Collection of handy online tools for devs, with great UX » | 09/05/2022 | **n° 5 du jour, 144 points** | public étroit nommé (développeurs), « couteau suisse… par des développeurs » ; code ouvert ; 4 images |
| **CompressImage.io** — « Reduce Image Size upto 90% in seconds. Free & Works Offline! » | 18/08/2022 | **n° 4 du jour, 254 votes** | un chiffre de résultat dans la tagline ; « hors ligne », « aucun envoi » ; premier commentaire : ce que fait l'outil → différences → « essayez » |
| Étude de 50 lancements (uprowshub.com, 2026 — source tierce, non vérifiable) | — | — | premier commentaire détaillé et sincère : **+166 % de votes** en moyenne ; **6 captures ou plus** : 321 votes contre 198 ; vidéo : 384 contre 167 ; 89 % des top 5 : le fondateur **répond à chaque commentaire** ; 100 votes avant 4 h PT → 82 % de chances de finir dans le top 10 |

**Ce que nous en retenons (décidé, conformément à la règle de décision) :**
1. **Une collection plafonne vers la 4ᵉ place** (TabTasker, 10015, IT Tools, CompressImage : n° 4-5). Viser au moins ce niveau, avec l'argument qui a porté les deux lancements « navigateur » : **le traitement local, prouvé**.
2. **Preuve vérifiable plutôt que promesse** (moyen de TabTasker) : notre image 2 affiche une mesure faite pendant la capture (aucune requête d'envoi pendant la compression) et invite à la refaire dans l'onglet Réseau. **Au-dessus de TabTasker** sur un point : nous ne disons pas « zéro serveur », parce que c'est faux pour 44 de nos outils ; nous disons lesquels en utilisent un.
3. **Des résultats mesurés face à un concurrent nommé** dans chaque image (aucun des 4 lancements ne le fait) — c'est notre différence réelle.
4. **8 images** (au-dessus du seuil de 6 de l'étude), **une par outil**, comme TabTasker.
5. Premier commentaire sur le schéma gagnant : **problème personnel → ce qui est différent (preuves) → demande de retours**, sans demander de votes.
6. **Répondre à chaque commentaire le jour même** : tâche du propriétaire (§6).

## 3. Textes (anglais)

**Name:** `OnlineConverTools`

**Tagline (44/60):**
> 225 free tools. Most never upload your file.

*(Validée par le propriétaire le 28/09 ; identique au slogan de l'accueil. « 225 » = compteur gardé par le build ; « most » = ≈ 181 sur 225, recompté dans le code le 28/09.)*

**Description (227/260):**
> 225 free tools for PDF, images, audio, video, archives and developers, no sign-up. About 180 run entirely in your browser: the file never leaves your device. Our main tools are tested against the market leader on the same file.

**Topics:** Productivity · Developer Tools · Privacy

**Link:** `https://www.onlineconvertools.com` (sans UTM, règle A)

## 4. Premier commentaire du fondateur — brouillon

> Hi Product Hunt 👋
>
> ⟦**Your name, and one or two lines on who you are and why you started — in your own words. Nothing here was invented for you.**⟧
>
> Online converters all look alike, so I set myself one rule: each tool should do **at least as well as the site people usually use for that job, on the same file**. I've been testing them one by one — the most-used ones first — and where a tool still falls short or has a limit, its page says so before you pick a file. A few results so far:
>
> - **PDF compression**: the lossless level shrinks a 15-page paper by 35.4 %, every page pixel-identical to the original (iLovePDF "recommended": −35.0 %, with its images re-compressed).
> - **Archives**: RAR, 7z, ZIP and 40+ formats open in the browser; on the same 1.99 GB RAR, the first file comes out in 5.1 s vs 7.25 s at ezyZip.
> - **AI image upscaler**: closer to the real photo than iLoveIMG on our test (perceptual distance 0.107 vs 0.164), up to 6 megapixels — and on your own device when your browser supports WebGPU.
> - **Barcodes**: 37 types, and every file is scanned back by an independent reader before you download it (102 of 102 in our test; barcode-maker.com: 65 of 68).
> - **Hashes**: 17 algorithms; a 760 MiB file hashed in 11.7 s vs 31.8 s on the reference site.
>
> About 180 of the 225 tools run entirely in your browser — you can check it yourself in the Network tab: nothing is uploaded. The others (video conversion, Office ↔ PDF, AI tools) need a server; their pages say so.
>
> It's free and there's no sign-up. ⟦**Optional, your own words: what you plan next / how the site is funded.**⟧ I'd love to hear which tool you'd test against which site — and where we still fall short.

*Sources (pour le propriétaire, pas pour publication) : `RAPPORT-ecarts-marche.md` §3a (PDF), §3c (agrandisseur), `RAPPORT-amelioration-15.md` (archives), `RAPPORT-amelioration-14.md` (codes-barres), `RAPPORT-ecarts-marche.md` (empreintes), `RAPPORT-global-28-09.md` points 3 et 6 (≈ 180, 6 Mpx, WebGPU).*
*Retiré exprès : le correcteur de grammaire (25/25 en anglais, mais en dessous de LanguageTool en russe — l'honnêteté ne tient pas en une ligne) ; la vitesse de la conversion vidéo (plus rapide que FreeConvert et Convertio sur notre test, mais ils gardent plus de qualité dans des fichiers plus gros) ; tout ce qui concerne Safari tant que la passe réelle 9-30 n'est pas faite.*

## 5. Galerie — ordre proposé et légendes

Images : `docs/lancement/galerie/`, **1270 × 760**, captures Playwright du **build local** de `croissance-29-09` (même interface que le déploiement 2), régénérables en une commande : `node docs/lancement/galerie.mjs http://localhost:3100` (ou l'adresse www une fois déployé — **à refaire juste avant le lancement**, P5). Les chiffres du compteur et du réseau sont **mesurés pendant la capture** ; le script refuse d'écrire l'image 2 si une requête a transporté un corps.

| Ordre | Image | Légende (champ Product Hunt) | Source du chiffre |
|---|---|---|---|
| 1 | `01-hero.png` (accueil) | 225 free tools, no sign-up — about 180 run entirely in your browser. | compteur `/api/tool-counts` lu à la capture ; recomptage du 28/09 |
| 2 | `02-never-upload.png` (Image Compressor, vraie compression) | Compress an image here and watch your Network tab: nothing is uploaded. | mesuré pendant la capture : 0 requête d'envoi |
| 3 | `03-all-tools.png` (/tools) | 225 tools in 12 categories: PDF, image, video, audio, archives, developer, AI… | compteur lu à la capture (57 · 39 · 37 · 17 · 16 · 15 · 11 · 11 · 9 · 6 · 4 · 3) |
| 4 | `04-zip-extractor.png` (archive RAR ouverte) | RAR, 7z, ZIP and 40+ formats in the browser — first file out in 5.1 s vs 7.25 s at ezyZip (same 1.99 GB RAR). | `RAPPORT-amelioration-15.md` |
| 5 | `05-pdf-compress.png` | Lossless PDF compression: −35.4 %, every page pixel-identical to the original. | `RAPPORT-ecarts-marche.md` §3a |
| 6 | `06-image-upscaler.png` | AI upscaling ×2/×4 that stays closer to the real photo (LPIPS 0.107 vs 0.164 for iLoveIMG), up to 6 megapixels. | `RAPPORT-ecarts-marche.md` §3c ; 6 Mpx : `RAPPORT-global-28-09.md` |
| 7 | `07-hash-generator.png` | 17 hash algorithms, files of any size, nothing uploaded — 760 MiB in 11.7 s vs 31.8 s. | `RAPPORT-ecarts-marche.md` |
| 8 | `08-barcode-generator.png` | 37 barcode types; every file is scanned back by an independent reader before you download it. | `RAPPORT-amelioration-14.md` |
| vignette | `thumbnail.png` 240×240 | — | — |

**Pourquoi cet ordre :** l'image 1 sert aussi d'aperçu au partage (A) → la promesse entière ; l'image 2 la **prouve** (moyen de TabTasker) ; l'image 3 montre l'étendue ; 4 à 8 = un outil phare par image, chacun avec un résultat mesuré face à un concurrent nommé.

## 6. Ce qui reste, pour le propriétaire (inscrit dans le plan)

- **Relire et compléter le premier commentaire** (§4, passages ⟦…⟧).
- **Choisir le jour** le moment venu (aucune date ici). Heure : **00 h 01 PT**.
- Le jour J : **répondre à chaque commentaire** (89 % des top 5 le font, étude tierce).
- **Régénérer la galerie sur www juste avant** (P5) : `node docs/lancement/galerie.mjs https://www.onlineconvertools.com`, puis vérifier les 8 images à l'œil.
- *Facultatif :* une vidéo YouTube de 30-60 s (≈ 53 % des produits du jour en ont une) — exige une chaîne YouTube, donc un compte : non fait.
