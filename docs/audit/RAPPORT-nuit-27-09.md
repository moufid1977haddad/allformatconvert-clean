# RAPPORT — Nuit du 27 au 28 septembre 2026 (travail sans surveillance)

**Branche :** `licence-ameliorations` · **Production (`master`) : inchangée sur `4d8ed7ff`** · aucune fusion, aucun déploiement de production, aucun push forcé · préversions automatiques déclenchées par les push (acceptées).

## 1) Une ligne par point

| # | Point | État | Pourquoi |
|---|---|---|---|
| 1 | Grammaire, température 0 | 🟡 **à moitié** | T appliquée (`608817da`) et mesurée sur **6 langues sur 10** ; **arrêtée par la limite JOURNALIÈRE de 100 appels par IP** (jour UTC ; 85 déjà consommés le 27/09 UTC par les séances précédentes), après 15 appels. 2e passage, anglais et passage de contrôle de la production **non faits**. Proxy arrêté, dossier temporaire supprimé. |
| 2 | Passe Safari préalable (WebKit de Playwright) | ✅ fait | Les 29 outils de la feuille + les 5 à MediaRecorder ; **7 défauts corrigés** (un commit chacun, WebKit + Chromium + Firefox) + Video Merger cassé sous Firefox trouvé et corrigé ; feuille annotée outil par outil (§8) et n° 30 ajouté. |
| 3 | Audit coupes / jonctions / copies | ✅ fait | Recensement dans le code, mesures Chromium + Firefox ; **4 défauts corrigés** ; ajout d'un mode « coupe précise » à Video Trimmer (parité avec les références). |
| 4 | Bloquant 11 + vague 1 | 🟡 | **Vague 1 : 7 contrôles automatisés et passés sur www, 12/12 Chromium et Firefox, sans appel payant.** La feuille des « sept tests » (`tests-manuels-proprietaire.md`) **n'existe pas dans le dépôt** (jamais commitée) : impossible de l'automatiser sans toi. |
| 5 | Limite 20/h du service média | ✅ fait (proposition, rien changé) | Aucun concurrent ne publie de limite horaire ; par jour la médiane est ≈ 10 fichiers, nous 60. Recommandation H1 : 40/h. |
| 6 | Agrandisseur 1 Mpx | ⏸ en attente | P1 **crée un coût par appel** (×6 de calcul Railway) et passe par le service de production : condition non remplie. |
| 7 | Écran post-inscription ; dossier `quota-spend-infra` | ✅ fait | Invitation « Not spam / contacts » pour tous (`82e6b071`) ; dossier vide supprimé. |
| 8 | Product Hunt (brouillons) | ✅ fait | Recherche (8 lancements, règles officielles), galerie régénérable en une commande (7 × 1270×760 + vignette), textes anglais. Rien publié. |
| 9 | « Download all as ZIP » > 1,9 Go (Firefox, Safari) | ✅ fait en local | Service worker limité à `/zipdl/` ; 2,2 Go vérifiés octet par octet sous Firefox et WebKit ; ezyZip n'offre rien de tel hors Chrome/Edge. |
| + | Revue indépendante du code de la nuit | ✅ faite | 6 défauts réels trouvés (dont 1 grave : page bloquée « busy » si le téléchargement est annulé), **tous corrigés et retestés**. |

## 2) Décisions qui t'attendent, par importance pour le lancement

1. **Déployer les correctifs de la nuit** (§3). ⚠️ **Ne pas fusionner `licence-ameliorations` telle quelle** : elle contient aussi la consigne « modifications minimales » + température 0 du correcteur de grammaire (`09dc35a0`, `567e089c`, `4e879162`, `608817da`), **non validée**. **Préparé pour toi : la branche `deploiement-nuit-28-09`** (poussée, sa préversion se construit) = `licence-ameliorations` + un commit qui remet le correcteur **à l'identique de la production** (`9e3ce5db` ; `lib/ai` et `app/api/ai` identiques à `4d8ed7ff`, vérifié). **17 suites, 211 vérifications, toutes passées sur cette branche** (build de production local, Chromium ; Firefox pour le ZIP en flux). Options : (a) **recommandée** — préversion de `deploiement-nuit-28-09`, je relance les suites dessus, puis production ; (b) déployer commit par commit (§3) ; (c) fusionner tout, grammaire comprise (non recommandé).
2. **Grammaire — finir la mesure** (≈ 80 appels, ≈ 0,04 $) : **O1 (recommandée)** ce soir après 20 h (nouveau jour UTC ; 3 heures d'horloge à cause des 30/h) ; O2 relever `IP_RATE_LIMIT_PER_DAY` **en Preview seulement** (toi, dans Vercel) pour finir en une fois. Puis, **ma recommandation si le 2e passage confirme le 1er** : mettre en production « minimale + T0 » (les phrases empirées baissent dans toutes les langues mesurées face à la production actuelle ; l'écart espagnol vient surtout de la référence du corpus, voir §4) **avec l'avertissement W** pour le russe, le chinois, le japonais, le hindi et le turc (réellement sous LanguageTool ou sans point de comparaison) ; M1/M2 mesurés ensuite sur ces langues seulement. **Résultat partiel** : les phrases empirées baissent dans les 6 langues mesurées (es 12→9, it 13→5, ru 14→8, de 11→2, zh 24→12, pt 3→3) ; exactes −2 en espagnol, −1 en russe face à un seul passage de la production.
3. **La feuille `tests-manuels-proprietaire.md`** : me la fournir (ou la verser dans `claude/`) — sans elle, le bloquant 11 ne peut pas être fermé.
4. **Limite média 20/h** : **H1 (recommandée)** 40/h, jour inchangé à 60 (le pire coût par IP et par jour ne bouge pas) ; H2 garder 20/h ; H3 (complément code, 1 h) un seul billet pour les 2 parties d'Audio Splitter en Opus. À trancher avec le test de charge (même service).
5. **Saturation / test de charge** : inchangé depuis le 27/09 (P3 de la ligne d'arrivée).
6. **Agrandisseur au-delà de 1 Mpx** : accord pour P1 (6 Mpx sur le processeur actuel, ≈ 0,013 $/image, mesures sur une copie du service avec ta clé de test) ?
7. **Accueil** : j'ai retiré « The fastest way to » (aucune mesure). **Restent** « Convert anything. Instantly. » : « anything » et « instantly » ne sont pas prouvés non plus (une conversion vidéo prend ~1 min) — garder comme accroche de marque, ou reformuler ?
8. **Product Hunt** : choisir l'accroche (recommandée : A, « 225 free online tools — most never upload your file ») et écrire toi-même la première ligne du premier commentaire (ton histoire : je n'ai rien inventé).
9. **Video Trimmer, coupe précise sous Firefox** : faite dans le navigateur (ffmpeg.wasm) ; Chromium ≈ 3,7 × la durée de l'extrait en 1080p ; Firefox beaucoup plus lent (mesure en §5). Si c'est trop lent, la faire sur notre service ffmpeg (changement de service, par toi).
10. **Branche distante `origin/worktree-quota-spend-infra`** : toujours sur GitHub ; la supprimer si elle ne sert plus (non touchée).

## 3) Prêt à déployer, commit par commit

Tous testés en local (build de production `next build` + `next start`, service média remplacé par une adresse de test) ; aucun n'a été vu en préversion ni en production.

| Commit | Contenu | Tests | Dépend de |
|---|---|---|---|
| `9f01beac` | Audio Trimmer : formats sans aperçu (WMA, AC3…) utilisables | `audio-trimmer-no-preview.mjs` WebKit/Chromium/Firefox, `improvement-17.mjs` 3 navigateurs | — |
| `3559d7d4` | QR Scanner : message caméra juste | `improvement-17.mjs` WebKit | — |
| `82e6b071` | Inscription : « Not spam » + contacts pour tous | build | — |
| `e81d4b62` | Image Resizer : plus de déformation (champs actifs après lecture) | `image-resizer.mjs` 3 navigateurs | — |
| `91dbf2f4` + `3f77fad1` | Audio Splitter : coupe exacte, dixième de seconde, format source par défaut, formats sans aperçu | `cut-join-audit.mjs` Chromium + Firefox, `audio-opus-service.mjs` Chromium + WebKit | — |
| `2d101e55` | Voice Recorder : vraie cause dite | `webkit-sheet-rest.mjs` | — |
| `15053bfa` | Textes vidéo « toujours WebM » corrigés (Safari = MP4) | build | — |
| `11326601` | Video Trimmer : AVI/WMV coupables | `video-trimmer-no-preview.mjs` 3 navigateurs | — |
| `85a614bf` | Video Merger : finit sous Firefox, garde le son, bandes noires | `mediarecorder-tools.mjs` Chromium + Firefox | — |
| `6a760fce` | Zip Extractor : ZIP en flux > 1,9 Go (Firefox, Safari) | `zip-extractor-stream-all.mjs` Firefox + WebKit, `zip-extractor.mjs` 3 navigateurs | — |
| `0d3209c7` | Accueil : « The fastest way to » retiré | build | — |
| `ac75f9f0` | Video Resizer : Fit / Fill / Stretch | `mediarecorder-tools.mjs` Chromium + Firefox | — |
| `03272678` | Zip Extractor, flux : annulation et erreurs (revue) | `zip-extractor-stream-all.mjs` (annulation) Firefox + WebKit | `6a760fce` |
| `a87a2fab` | Durée par ffmpeg : WebM sans durée, sonde périmée, fuite, pochette MP3 (revue) | trimmer 3 navigateurs, splitter, video trimmer | `9f01beac`, `91dbf2f4`, `11326601` |
| `714a3b85` | Video Merger : AudioContext dans le clic (revue) | `mediarecorder-tools.mjs` Chromium + Firefox | `85a614bf` |
| `dbcc52bc` | Video Trimmer : mode « Precise cut » (image exacte, réencodage MP4) | `video-trimmer-precise.mjs` Chromium + Firefox (et source de taille impaire) | `11326601`, `a87a2fab` |
| `aded38a6` | Video Resizer : proportions calculées à chaque image (revue) | `mediarecorder-tools.mjs` | `ac75f9f0` |
| `9e3ce5db` | *(branche `deploiement-nuit-28-09` seulement)* correcteur de grammaire remis comme en production | `ai-prompt-tests` 15/15, `grammar-fixer-diff.mjs` | — |
| **À NE PAS déployer seuls** | `09dc35a0`, `567e089c`, `4e879162` (consigne minimale), `608817da` (température 0) | mesure inachevée | décision n° 2 |

Commits de tests et de documents (sans effet sur le site) : `fc2befa7`, `8f0740f6`, `eaf3f593`, `258872de`, `9f7e7886`, les `docs(...)`.

---

## 4) Détail par point

### Point 1 — Grammaire
- **Réglage :** `temperature: 0` dans la définition de `grammar-fixer` (`lib/ai/toolPrompts.js`), transmis par `app/api/ai/route.ts` ; le navigateur ne peut toujours pas l'envoyer (400) — `scripts/ai-prompt-tests/run.js` 17/17.
- **Mesure :** préversion `ojdqifb4d` (commit `608817da`), relais local par `vercel env run` (dossier temporaire ne contenant que `.vercel/project.json`, jeton jamais affiché), mêmes corpus que le 27/09, LanguageTool non rappelé (`--no-lt`). **15 appels réussis (≈ 0,008 $)**, puis `429` avec `Retry-After` de 64 738 s = la limite **journalière** (`IP_RATE_LIMIT_PER_DAY` = 100, jour UTC), que la consigne ne mentionnait pas.
- **Écart à la consigne, signalé :** le passage a démarré à **05:59:56 UTC**, 4 secondes avant la nouvelle heure ; le premier appel est tombé dans l'heure précédente (qui avait encore de la place : aucun refus horaire).
- Résultats (exactes / empirées sur 40) : pt 29/3, de 17/2, zh 3/12, it 9/5, es 11/9, ru 14/8 — tableau complet dans le plan (option T) ; fichiers `docs/audit/grammaire-multilingue/results-t0-run1-partial.json`, comparaison `compare-t0.mjs`.
- **Lecture phrase par phrase des « empirées »** (sans appel, sur les sorties obtenues) : espagnol, 2 erreurs réelles sur 9 (le reste : corrections justes, référence stylistique qui ôte les pronoms sujets) → probablement au niveau ; russe, 4 erreurs réelles sur 8 (nom propre modifié, sens inversé…) + 2 е → ё → **réellement en dessous de LanguageTool**.
- **Fin :** tous les processus `vercel env run` arrêtés (vérifié : 0 restant), dossier `vrelay` supprimé.

### Point 2 — Passe WebKit
Détail outil par outil : `claude/tests-safari-proprietaire.md` §8. Ce WebKit (Playwright, Windows) n'a ni `OffscreenCanvas`, ni `MediaRecorder`, ni caméra, ni micro, ni lecture audio/vidéo : ce qui en dépend reste pour ton Safari. Nouveaux bancs : `service-tools-mock.mjs` (service joué par le test : les octets envoyés par morceaux sont identiques au fichier sous WebKit), `webkit-sheet-rest.mjs`, `mediarecorder-tools.mjs`, `audio-trimmer-no-preview.mjs`, `video-trimmer-no-preview.mjs` ; option `--browser=webkit` ajoutée à toutes les suites.

### Point 3 — Coupes et jonctions
Recensement et mesures : plan, « Audit des jonctions… ». En bref : Audio Trimmer (copie) +0,3 à +39,5 ms au début, conforme à sa FAQ ; Audio Splitter 0 ms en WAV/MP3/FLAC/OGG (M4A +17 ms, trame AAC) ; Video Trimmer rapide aligné sur l'image-clé (annoncé) ; Video Merger réparé. Le service ffmpeg ne fait aucune copie ni concaténation.

### Point 4 — Vague 1
`scripts/browser-tests/vague1-controls.mjs`, sur www, Chromium et Firefox 12/12 : TIFF (texte + vrai `.tif` → JPEG), noms d'Audio Trimmer (`.wav`/`.mp3` réels), plafond d'Audio Transcriber (**25 Mo aujourd'hui**, écrit avant le choix, 26 Mo refusé sans aucune requête), `.doc` accepté et plus de « même moteur LibreOffice », `.tar.gz` extrait à l'octet, `xml-to-json` (`@_id`), `excel-to-json` (feuilles nommées, JSON par feuille). La conversion `.doc` réelle n'a pas été relancée (payante pour `.docx` ; un vrai `.doc` a été prouvé en production le 22/09).

### Point 5 — Limite média
Tableau des concurrents dans le plan (Zamzar 2/24 h, 123apps 5/j, CloudConvert 10 crédits/j, FreeConvert 20 min/j — 10 fichiers au test tiers —, Convertio ≈ 10 min/24 h non vérifié). Aucune valeur changée.

### Point 8 — Product Hunt
`docs/lancement/01-recherche-lancements.md` (faits relevés), `galerie.mjs` + `galerie/` (7 images 1270×760 et vignette 240×240 ; `node docs/lancement/galerie.mjs` régénère tout depuis www), `03-textes-en.md` (accroche, description ≤ 260 caractères, premier commentaire, légendes). Chaque chiffre vient d'un rapport ; ce qui n'était pas prouvé a été retiré (vitesse vidéo, « fastest »).

### Point 9 — ZIP en flux
`public/zipdl/sw.js` (portée `/zipdl/` seulement), `app/lib/streamDownload.js`, intégration dans `zip-extractor/page.jsx` au-delà de `ZIP_IN_MEMORY_MAX` uniquement. 2,2 Go : Firefox 67-70 s, WebKit 25-33 s, octets identiques ; annulation dans le navigateur : message clair, page utilisable.

## 5) Video Trimmer — coupe précise (`dbcc52bc`)

Recherche d'abord : les coupeurs vidéo dans le navigateur proposent deux modes — copie rapide sans perte, alignée sur l'image-clé, et coupe précise qui réencode. Nous n'avions que le premier (une vidéo de téléphone pouvait commencer 2-3 s trop tôt). Ajouté : case « Precise cut » (désactivée par défaut), MP4 H.264/AAC (CRF 18), curseurs au dixième de seconde.
- **Mesuré** (`video-trimmer-precise.mjs`, source à une image-clé toutes les 2 s) : 1,3 → 3,7 s donne **2,40 s qui commencent à l'image de 1,32 s** (première image après 1,3 s ; PSNR 57 dB contre la source), son gardé, Chromium et Firefox ; source de taille impaire (641×361) acceptée.
- **Temps, 10 s de 1080p : 37 s sous Chromium, 292 s sous Firefox** (le WebAssembly de Firefox est bien plus lent) — **écrit sur la page** à côté de la case. **Décision possible** : faire la coupe précise sur notre service ffmpeg (quelques secondes, un billet par coupe, changement du service par toi) au moins pour Firefox et les longues vidéos.
- Revue indépendante : progression fausse (calculée sur toute la vidéo), sous-titres image qui faisaient échouer, fuite d'URL — corrigés avant le commit.

## 6) Hygiène

- Aucun fichier d'environnement lu, affiché, copié ; aucun secret généré (les tests de service **jouent** le service, sans clé) ; `vercel env run` seulement pour le point 1d, arrêté ensuite ; aucune commande `vercel link` / `env pull`.
- Appels payants : **15 appels à l'IA (≈ 0,008 $)**, sous le plafond de 0,20 $. Aucun autre : outils payants testés avec leur route jouée par le test ; contrôles de la vague 1 sur des outils gratuits.
- Aucun réglage changé chez Vercel, Railway, Search Console ; aucune publication, aucun e-mail, aucun compte ; aucun outil ni service supprimé ou renommé.
- Recherches confiées à deux agents (lecture seule) et une revue de code indépendante (lecture seule) ; aucun n'a touché au site.
- Écart de méthode signalé : une attente de démarrage du serveur local a été faite une fois par une petite boucle `until curl` (quelques secondes), puis abandonnée.
