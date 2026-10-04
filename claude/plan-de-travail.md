# PLAN DE TRAVAIL — OnlineConverTools

> **📍 EMPLACEMENT DE CE DOCUMENT — lire en premier.**
> Jusqu'au 19 septembre 2026, ce document vivait **uniquement dans le Projet claude.ai**, invisible depuis le dépôt. Claude Code a donc travaillé des semaines sans la RÈGLE ZÉRO, sans les interdits permanents et sans la liste des pièges — et a redécouvert à ses frais des choses déjà écrites ici. **Il vit désormais dans le dépôt, à `claude/plan-de-travail.md`, et c'est la seule copie qui fait foi.** À lire au début de chaque chantier.

## 💳 RÈGLE PERMANENTE — crédits des fournisseurs payants (P30, 04/10, tous les chantiers suivants)

**Constat** (`docs/audit/RAPPORT-p30-convertapi-alertes-04-10.md` §1) : le crédit ConvertAPI s'est épuisé le 02/10 avec
**au plus 1 conversion de visiteur sur 93** passées par le site depuis le 04/09 ; le reste : nos bancs et essais (www et
préversions) et les documents du propriétaire — **aucun appel inconnu** (tableau de bord ConvertAPI, 03/10 : 119 conversions
depuis l'ouverture, dont 100 réussies et 9 échouées du 25/08 au 03/10). L'essai (250 conversions) a expiré par sa durée de
30 jours, pas par consommation. *Les « ≈ 157 conversions hors du site » écrites d'abord étaient fausses : corrigé par P31 le 03/10.*
1. **Simulation par défaut.** Un banc n'appelle jamais un fournisseur payant réel : en local, `scripts/p26/e1/fake-providers.mjs`
   (jeton factice `local-bench-fake`) ; les préversions n'ont pas les jetons payants. **Le code l'impose pour ConvertAPI** :
   appel réel seulement par la production Vercel (repère d'exécution vérifié), refusé avant tout envoi ailleurs.
2. **Appels réels comptés et plafonnés.** Sur www, uniquement avec le budget donné par le propriétaire dans le prompt du
   chantier, chaque appel inscrit **avant** l'envoi dans `docs/audit/depenses-fournisseurs.jsonl` par
   `scripts/p30/paid-ledger.mjs` (`reservePaid`), qui refuse au-delà du budget. Un appel non facturé (refus) est rendu
   (`refundPaid`).
3. **Le site compte lui-même** les conversions ConvertAPI facturées sur la période du forfait (« Developer » : 1 000/mois,
   57,49 CAD taxes comprises, renouvellement le **3**, 200 Mo par fichier, **1 conversion simultanée**) et alerte à 50, 80,
   100 % ; au-delà, ConvertAPI facture le surplus. Une requête traitée puis échouée compte aussi (conditions de ConvertAPI).
4. **Alertes fournisseurs** : ConvertAPI, OpenAI, Pangram — téléphone (ntfy) + courriel, une fois par incident, puis au
   rétablissement (`lib/providerIncident.js`). Vérifier le canal : `vercel crons run /api/cron/alert-test`.

## 📱 P32 — 04/10 : deux pannes iPhone restantes + essai BRIA + interligne arabe (`docs/audit/RAPPORT-p32-iphone-bria-04-10.md`, repère `restauration-avant-p32-04-10` = `39e4ff69`) — **en production : Vercel `onlineconvertools-l0fs94z0x` = `8a6137e7` (04/10), pdf-tools `43106653`, www 29/29 ; retour arrière : `onlineconvertools-cs2bhpt77`**

**Règle (P21/P31, permanente)** : statut maximal « corrigé, à confirmer sur iPhone ». Mini-passe iPhone de 5 vérifications : rapport §6.

| Point | État | Reste (priorité) |
|---|---|---|
| 1 PDF to JPG mode Pages (iPhone) | corrigé, à confirmer : cause non prouvée (hypothèse n° 1 : `FontFace.loaded` des polices standard jamais résolu sous iOS 26 — le rendu l'attend, Extract non) ; **correctif garanti** : sur iPhone / iPad, page non dessinée en 20 s → `/api/pdf-render` (pdftoppm sur pdf-tools, même dpi / qualité / pages), avis avant et après, textes de confidentialité et méta-descriptions exacts ; PDF to Image et PDF Redact protégés aussi ; revue de sécurité « GO avec conditions », conditions appliquées | **P1** propriétaire : mini-passe §6 n° 1-2 ; P2 : PDF OCR dépend du même rendu (non protégé, rendu non livré) — à essayer sur iPhone ; P2 : test d'alignement du noircissement Redact sur page Poppler (police TrueType non incorporée, CropBox décalée) ; P3 : confirmation explicite avant envoi pour Redact (décision propriétaire) |
| 2 Image Compressor panorama 63 Mpx | corrigé, à confirmer : cause mesurée (MozJPEG q95 4:4:4 dans la page, 1 050 Mio jamais rendus + 765 dans le worker) ; réduction dans le worker, un seul encodage ; cible téléphone **48 Mpx** (12 220 × 3 927) ; pic ≤ référence 48 Mpx (Firefox 953-958 contre 961-963 Mo) | P1 : §6 n° 3 ; **P2 décision propriétaire** : JPG to PDF / Image to PDF avec un WebP/HEIC/AVIF/BMP/GIF de 63 Mpx reste au-dessus de la référence (1 467 Mo) — borne téléphone 40-48 Mpx, PDF en bandes ou PNG |
| 3 BRIA RMBG 2.0 (fal) | **non branché** : pas meilleur partout (mieux 4, égal 6, mixte 9, moins bien 9 sur 28) ; enlève la nappe d'IMG_2433 (1 419 px → 0) mais garde le dessous de verre ; 0,638 $ réservés / ≈ 0,54 $ facturés sur 1 $ | **P3 décision propriétaire** : BRIA = 18 $ / 1 000 images (≈ 6 × IS-Net) ; piste : second avis seulement quand IS-Net garde un morceau de fond en haut |
| 4 Text to PDF interligne arabe | pas d'écart propre à l'arabe (pas fixe 19,20 pt, mesuré) ; l'impression vient de l'alignement à droite ; corrigé au passage : arabe/hébreu du service en Noto au lieu de DejaVu | si le propriétaire voit encore un écart : capture + texte exact |

**➡️ Prochain chantier après P32 : référencement Google (trafic)** — plan détaillé donné par le propriétaire.

**Pièges notés (P32)** : (1) l'interception de Playwright (`route.request().postDataBuffer()`) **ne contient pas la partie
fichier** d'un multipart — pour tester une route locale avec un fichier, la servir sur son propre port
(`scripts/p32/local-render-route.mjs`) ; (2) `pdf-tools` sur Railway est relié à GitHub et **se redéploie à chaque push
sur master** (pas de chemin surveillé) : un changement de service = commit additif sur master d'abord ; (3) heredoc bash :
encore une barre oblique inverse perdue (Dockerfile) — Edit/Write pour tout fichier qui en contient ; (4) `TaskStop` d'un
`npx next start` laisse le vrai processus Node en écoute : le tuer par son PID.

## 📱 P31 — 03→04/10 : correctifs de la passe iPhone (26 tests) + AJOUT ConvertAPI (`docs/audit/RAPPORT-p31-iphone-correctifs-04-10.md`, repère `restauration-avant-p31-04-10` = `fb2d1db3`) — **en production : `onlineconvertools-ooe79sko9` = `4b74d592` (04/10), www 29/29, retour arrière : `onlineconvertools-osaer8a95`**

**Règle (leçon P21, permanente)** : rien n'est « corrigé sur iPhone » tant que l'iPhone ne l'a pas confirmé — statut maximal
« corrigé, à confirmer sur iPhone ». Mini-passe iPhone de 10 vérifications : rapport §12.

| Point | État | Reste (priorité) |
|---|---|---|
| 1 Download iOS (13, 14, 17, 21) | corrigé, à confirmer sur iPhone : **Blob retypé `application/octet-stream` + attribut `download`, jamais de navigation**, sur les 195 outils (annexe A) ; Save / Share garde le vrai type ; `/zipdl/f/` abandonné ; banc `scripts/p31/download-names.mjs` (8 formats × 3 moteurs + iPhone) ; revue indépendante appliquée | **P1** propriétaire : mini-passe §12 n° 1-3 |
| 2 M4R `.m4r.html` (22) | corrigé, à confirmer : c'était la page 404 du site (adresse du service worker) ; sorties audio contrôlées octet par octet ; table extension → MIME testée (69) ; aide sonnerie 40 s / GarageBand / Finder-iTunes | P1 : §12 n° 4 |
| 3 PDF to JPG figé (20) | corrigé, à confirmer : pdf.js sans `ImageDecoder`/`OffscreenCanvas` sur Safari (attente sans délai, cause la plus probable) ; délai de garde 60 s par page avec message ; `app/lib/canvasLimit.js` appliqué aux canvas d'échelle libre (8 fichiers, 46 inventoriés) | P1 : §12 n° 5-6 |
| 4 Background Remover (18) | liseré réduit (4,91 → 3,90 % sur 28 cas, décontamination Germer 2020) ; **morceau de fond en haut non corrigé** (modèle IS-Net) ; aucun modèle meilleur partout ; 0 $ | **P2 décision propriétaire** : tester BRIA RMBG 2.0 (API fal, 0,018 $/image) sur 29 photos ≈ 0,52 $ — compte fal requis ; P1 : §12 n° 7 |
| 5 Code Formatter (16) | corrigé, à confirmer : 13 langages, 20 dialectes SQL, auto-détection, erreurs ligne/colonne, chargement à la demande | P1 : §12 n° 8 |
| 6 Panorama 63 Mpx (26) | corrigé, à confirmer : taille lue à la sélection (Image Compressor, JPG/Image to PDF) ; « Reduce to 50 MP then compress » | P1 : §12 n° 9 |
| 7 Quality sur PNG | ✅ curseur factice masqué (PNG, BMP, GIF, ICO, TIFF) ; Image Compressor : réel (palette) | — |
| 8 Affichage tactile (23) | corrigé, à confirmer : 239 pages × 390/375 px, 0 débordement, 0 cible < 44 px (`scripts/p31/layout-iphone.mjs`) | P3 : écrans de résultat et menu mobile ouvert non mesurés |
| A Compteur ConvertAPI | ✅ code : renouvellement le **3** ; période 03/10 → 03/11 démarrée à **6** (`CONVERTAPI_PLAN_BASELINE`) ; seuils inchangés | — |
| B Coût réel | ✅ `ConversionCost` (toujours 1, taille et durée sans effet) ; une requête traitée puis échouée compte (conditions ConvertAPI), le site la compte maintenant. **Fin de l'essai — confirmée par le tableau de bord du propriétaire : première conversion le 02/09/2026, panne le 02/10/2026, soit 30 jours = expiration de l'essai (119 conversions utilisées sur 250)** | — |
| C Rapport P30 | ✅ « ≈ 157 hors du site » corrigé (faux) | — |
| D 1 conversion simultanée | ✅ file d'attente serveur sur 503/429 (10 tests simulés). **Mesure réelle sur www le 04/10 (autorisée par le propriétaire, 2 conversions du forfait)** : 2 requêtes parallèles arrivées dans la même seconde → **2 PDF faits par ConvertAPI (2,5 s et 3,0 s), aucun 503, aucun secours, aucun échec** ; le second visiteur reçoit simplement son PDF. La file n'a pas été sollicitée en réel (ConvertAPI a accepté les deux) | P3 : si un 503 « No available conversion PODs » apparaît un jour dans les journaux, vérifier la ligne `[convertapi] busy … try 2 in 3 s` |
| E 200 Mo | ✅ rien au-dessus de 100 Mo annoncé ; Merge PDF contrôle les fichiers Office avant l'envoi | — |
| F Jeton `.env.local` | ✅ **fait par le propriétaire le 04/10** (`sed` par le nom de la variable, vérifié par les noms seuls : plus aucune variable `CONVERTAPI…` dans `.env.local`) | — |

**✅ Fait par P32 (voir section P32) — ~~Prochain chantier : P32 — essai de BRIA RMBG 2.0 (Background Remover)~~** : via l'API fal, **0,018 $ par image**,
licence commerciale (API ; les poids auto-hébergés sont CC BY-NC, exclus). Test sur les 29 photos (28 du banc + IMG_2433)
≈ **0,52 $**, avec `scripts/p31/bg/` et le registre `scripts/p30/paid-ledger.mjs` (budget fixé par le propriétaire). La clé
**`FAL_KEY` sera placée par le propriétaire lui-même dans `.env.local`** (jamais affichée ni demandée dans le terminal).
Brancher seulement si BRIA bat IS-Net sur toutes les photos (morceau de nappe en haut d'IMG_2433 compris) ; sinon chiffrer.

**Pièges notés (P31)** : (1) jamais `npm ci` dans le dépôt principal pendant que des sous-agents y ont une jonction
`node_modules` ou qu'un `next start` tourne (il vide tout puis échoue) — `npm install` à la place ; (2) heredoc bash : une double barre
oblique inverse devient simple (déjà vu P29) — écrire les fichiers par l'outil d'écriture ; (3) Playwright-Firefox : `click()` d'un lien de
Blob `octet-stream` ne rend pas la main → `noWaitAfter: true` ; (4) WebKit de Playwright n'a ni `ImageDecoder` ni
`OffscreenCanvas` : les chemins de pdf.js et des workers d'image du vrai Safari n'y sont **jamais** exercés.

## 🔔 P30 — 04/10 : panne ConvertAPI, secours, alertes, Chromium isolé (`docs/audit/RAPPORT-p30-convertapi-alertes-04-10.md`, repère `restauration-avant-p30-04-10` = `bce5e714`)

| Lot | État | Reste |
|---|---|---|
| 1 Rétablissement + cause | ✅ Word to PDF (.docx), PDF to Word, Excel, PowerPoint **fonctionnent sur www** (5 vraies conversions, 0,05 $) ; cause : ≥ 99 % de la consommation passée par le site = nos bancs (rapport §1) ; règle permanente ci-dessus | ~~Retirer le vrai jeton ConvertAPI de `.env.local`~~ : fait par le propriétaire le 04/10 (P31 F). *(« ≈ 157 conversions hors du site » : faux, corrigé par P31 le 03/10 — aucune conversion inconnue au tableau de bord.)* |
| A Alertes + secours | ✅ **en production** (`onlineconvertools-gjjrs94r8` = `f8db1de9`) : téléphone + courriel une fois par incident (ConvertAPI, OpenAI, Pangram) et au rétablissement ; seuils 50/80/100 % du forfait ConvertAPI (1 000/mois) ; secours LibreOffice **annoncé** (Word to PDF, Merge PDF) ; « try again later » (PDF to Word/Excel/PowerPoint) ; **alerte de test envoyée le 03/10 à 23 h 06 UTC (ntfy=sent, email=sent)** ; revue indépendante ×2 appliquée | Le propriétaire confirme avoir reçu la notification de test. Si le forfait change : `lib/providers/convertApiPlan.js` (2 valeurs). Retour arrière : promouvoir `onlineconvertools-fo109wbpv` |
| 4 Équations .docx | ✅ identiques à Word (0,0 % de pixels différents) ; MathType rendu ; rien à corriger | — |
| 5 Chromium isolé | ✅ **en production** : Chromium de Gotenberg dans le projet Railway **`oct-chromium-isolated`** (service `chromium`, déploiement `883863bd`, aucun secret, réseau privé du nôtre **injoignable — mesuré** : 5 noms, 10 adresses × 4 ports, métadonnées) ; `gotenberg-v2` (`3236df60`) n'a plus de Chromium et relaie, signé Ed25519 (relais `oct-edge`, `services/gotenberg/edge`) ; **66/66 et 6/6 identiques au pixel**, 27 adresses internes refusées, 0/18 script, www 29/29 + 9/9 + 2/2 + 6/6 ; revue de sécurité « GO avec conditions », conditions remplies ; mémoire nette ≈ inchangée (isolée 0,27 Go, gotenberg-v2 0,69 → 0,13 Go, à relire) | **Ne jamais supprimer ni renommer le service `chromium` ni son domaine tant qu'une image front y renvoie** (reprise du nom possible). Si le mot de passe Basic Auth de Gotenberg change : `scripts/p30/edge-pubkey.mjs`, nouvelle clé dans le Dockerfile, redéployer les trois services. Retour arrière : `gotenberg-v2` → `1bb98768` |

## ✅ INCIDENT 402 DU 03/10 — CLOS (compte passé en Pro par le propriétaire, plafond de dépense 50 $/mois)

**Constat chiffré** (API d'usage Vercel `/v2/usage?type=requests`, lue le 03/10, cycle du 03/09 au 02/10, heure de la machine) :
- **Limite dépassée : les requêtes Edge** — Hobby en permet **1 million par mois** ; le cycle en compte **2 980 834**, et le
  million a été franchi le **29/09**. Transfert sortant du cycle : **20,5 Go** (sous les 100 Go de Fast Data Transfer, mais
  au-dessus des 10 Go de Fast Origin Transfer si ce compteur est celui de l'origine — l'API ne le précise pas).
  Invocations de fonctions (2 504) et durée (4,5 Go-h) : très loin des limites.
- **Notre part : ≈ 96 %.** Avant le 26/09, le site faisait ≈ 3 560 requêtes et 27 Mo par jour ; du 26/09 au 02/10 :
  2 899 025 requêtes et 19,9 Go — dont **2 874 127 requêtes (96,4 % du cycle) et 19,7 Go (96 %) au-dessus de ce niveau**,
  soit les bancs de P17 → P23 sur www et sur les préversions (le site n'est pas lancé : pas d'autre source de trafic).

**RÈGLE PERMANENTE — usage Vercel (03/10, tous les chantiers suivants)** :
1. Les bancs lourds (solidité complète, téléchargements, gros fichiers, RAW, toutes les pages) tournent **en local** sur la
   construction de production (`next build` + `next start`).
2. **Une seule fois** sur la préversion, avant la fusion (ce qui demande la vraie plate-forme : routes de service,
   téléchargements par étapes, service vidéo).
3. Sur www, après fusion : **vérification légère seulement** — pages principales, un outil par catégorie, RAW, un
   téléchargement. Jamais un passage complet de solidité sur www.

### 📋 État P24 — TERMINÉ ET EN PRODUCTION (03/10 après-midi, production `r0igmm5wa` = `4048f934`)
- Tout P24 est en ligne, mis en production en **6 étapes** (PDF, image, GIF, vidéo/audio/fichiers/dev/texte/maths,
  relevé n° 2 lots 1-4, lots 5-9), chacune : préversion + bancs du commit + fusion vérifiée + contrôle léger sur www
  (29/29) + RAW (7/7). **Aucun retour arrière.** Repère : `restauration-avant-p24-prod-03-10` = `70c35846`.
  Vidéo → GIF vérifié sur la préversion avec le vrai service (durée raccourcie et annoncée, une fois / 3 fois,
  compression). Détail : `docs/audit/RAPPORT-p24-couverture-03-10.md` §11.
- **Reste au propriétaire** : décisions E1-E7 ci-dessous (non tranchées par Claude).

## 🚀 RESTE AVANT PRODUCT HUNT — établi le 30/09 → 01/10 (passe « prêt au lancement », `docs/audit/RAPPORT-prelancement-01-10.md` §1 : chaque ligne du plan classée, preuve à l'appui)

**Dans l'ordre.** Aucune date n'est proposée (règle absolue) : la date se fixe à l'étape 8, pas avant.

| # | Qui | Quoi | Durée |
|---|---|---|---|
| 1 | Propriétaire → Claude | ✅ **FAIT le 30/09 (P18) — en production `61b066d8`** (préversion `jw8cuokp9` verte ×3 ; www : 238 pages ×3 propres, `prelancement-01-10` ALL PASS ×3). **Lighthouse mobile sur www : accueil 61 → 84, pages outils 53-54 → 85-91 (médiane 90), accessibilité / bonnes pratiques / SEO 100 partout** ; le même jour, iLovePDF 79 (accueil) et 69 (Compress PDF) (`RAPPORT-p18-01-10.md` §1) | — |
| 2 | Propriétaire → Claude | ✅ **FAIT le 30/09 à 20 h 11 (P19, à la demande du propriétaire)** : `node scripts/ai-detector/www-check-p17.mjs` sur www → **« RESULT: both verdicts right »** (résumé LIGO 2016 = humain 100 %, texte d'IA = IA 100 %) ; ≈ 0,25 $ de crédits Pangram, dépense notifiée (`RAPPORT-p19-01-10.md` §6) | — |
| 3 | Propriétaire | ✅ **FAIT (30/09)** : mot de passe apparu en clair le 30/09 changé par le propriétaire | — |
| 4 | Propriétaire | **P1 — passe Safari réelle** : ✅ **Mac fait la nuit du 30/09** (Safari 17.6, 225 outils : 187 réussis, 9 échoués, 5 non testables, 24 payants non lancés — rapport `RAPPORT-tests-mac-complet.md` sur le Bureau du Mac ; les 9 échecs corrigés par P18) ; ✅ **① repasse Mac après P18 faite (57/59 ; les 2 écarts corrigés par P19, en production `f7569b1d`)** ; ✅ **① bis passe Safari 17.6 réelle du Mac après P19 : 67/68 réussies, 0 échec réel, 1 non testé (payant)** — question avant de quitter, Audio Splitter et Code Formatter confirmés ; la perte de lettres du 30/09 était un artefact du banc Mac (touche Cmd restée enfoncée), pas un défaut du site ; ✅ **② iPhone P15–P19, tests 1 à 8 : 8/8 réussis (02/10, noté au bloquant 9)** ; **reste : ① ter la liste courte de `RAPPORT-p20-01-10.md` §7 (dépôt de fichier, Merge PDF glisser, Whitespace Remover, dictée) ; ② bis l'iPhone, tests 9 à 16** (liste de `RAPPORT-p16-photos-iphone-30-09.md` + Image Blur 24/48 Mpx, Video Rotator deux modes, AI Detector, et le téléchargement « Save / Share » de P18) | ≈ 2 h |
| 5 | Claude | **C1 — corriger ce que P1 remonte** : ✅ **fait pour le Mac (P18, en production `106dbfdf`, puis `7a13f02c` pour Text to PDF)** — 9 outils PDF (Safari ≤ 18.1), téléchargement sur tous les outils (iPad compris), Markdown to PDF, Video to GIF, Code Formatter (non reproduit : le banc), MOBI de test  ; ✅ **repasse Mac du 01/10 (57/59) : P19, en production `f7569b1d`** — confirmation avant de quitter sur tout le site, Audio Splitter (milieu, parts égales), Code Formatter (champ non contrôlé) ; reste ce que l'iPhone remontera | selon l'iPhone |
| 6 | Propriétaire | **P6 — décider** la priorité de chaque défaut remonté | 30 min |
| 7 | Propriétaire + Claude | **P3 / C2 — saturation** : accord sur la proposition chiffrée (`RAPPORT-seance-27-09.md` §4), clé de test générée par le propriétaire (annexe B), test de charge (copie jetable du service ffmpeg < 0,50 $ ; Gotenberg sur www ≈ 0,05-0,20 $), puis dimensionnement | 15 min + 1 h de présence · ≈ 3 h Claude |
| 8 | Propriétaire | **Fixer la date** — seulement quand 1 à 7 sont faits (critère de lancement) | — |
| 9 | Claude | **C3 — Gotenberg à 3 réplicas plusieurs jours avant** (accord P8 déjà donné ; coût ≈ +16 $/mois notifié avant) puis retest des 5 outils | ≈ 1 h |
| 10 | Propriétaire | **P10 — compléter le premier commentaire** (`docs/lancement/product-hunt.md` §4, deux passages ⟦…⟧) | 20 min |
| 11 | Claude | **P5 — régénérer la galerie sur www juste avant** (`node docs/lancement/galerie.mjs https://www.onlineconvertools.com`), le propriétaire regarde les 10 images | 15 min |
| 12 | Propriétaire | **Jour J, 00 h 01 PT (3 h 01 à Montréal)** : publier, répondre à chaque commentaire | la journée |
| 13 | Propriétaire | **P11 — soumissions de liens**, Show HN d'abord (`docs/lancement/sources-de-liens.md`) | 3-5 h réparties |

**Après le lancement, sur déclencheur :** AdSense à **20-50 visiteurs/jour réels** (propriétaire : compte AdSense, message « European regulations » dans Privacy & messaging, 2 variables Vercel — ≈ 45 min ; tout le reste est prêt, `RAPPORT-prelancement-01-10.md` §3) ; relevé Search Console des 10 pages entre le **10 et le 24 novembre** ; décisions « juste après » du tableau des déclencheurs.

## 🔒 P29 — 04/10 : sécurité de Chromium (Gotenberg), équations .docx (`docs/audit/RAPPORT-p29-securite-chromium-04-10.md`, repère `restauration-avant-p29-04-10` = `e578eeaa`)

| Lot | État | Reste |
|---|---|---|
| 1 Chromium | ✅ **en production, puis isolé par P30** (`gotenberg-v2` `1bb98768`, fusion `5af581aa`, Vercel `fo109wbpv`) : **Chromium 154 de Debian** (CVE-2026-87491 corrigée, sans attendre Gotenberg) ; **JavaScript bloqué dans tout Chromium** (option de Gotenberg + politique d'entreprise : un cadre d'un autre site exécutait encore son script avec l'option seule — trouvé par la revue indépendante) ; V8 sans JIT ; visionneuse PDF coupée ; 0/18 + 4 cas bloqués ; 65/65 conversions et 6/6 options URL identiques au pixel ; 27 adresses internes refusées ; www 29/29 + 11 vraies conversions. **Bac à sable impossible sur Railway** (mesuré) | ✅ **Instance Chromium séparée : faite par P30** (section P30). Retour arrière P29 : `gotenberg-v2` → `8e8e178d`, Vercel → `jcglmx2uu` |
| 2 Équations .docx | ✅ **fait par P30** (identiques à Word ; crédits rechargés par le propriétaire) — ancien constat : **crédits ConvertAPI épuisés** depuis le 02/10 ≈ 19 h 52 → Word to PDF (.docx), PDF to Word, PDF to Excel, PDF to PowerPoint en échec sur www (HTTP 403 `quota_exceeded`, 0 $ dépensé) | **Propriétaire : recharger ConvertAPI**, puis `scripts/p29/docx-equations-www.mjs` (≈ 0,02 $, commande au rapport §2) |

**À surveiller (règle permanente)** : Chromium de Gotenberg suit désormais l'archive de sécurité de Debian
(`services/gotenberg/Dockerfile`, trois valeurs : version, horodatage snapshot.debian.org, SHA-256). À chaque nouvelle
version de Chromium dans trixie-security corrigeant une faille exploitée, ou à chaque version de Gotenberg — **depuis
P30, l'image sert trois services : `gotenberg-v2` (déployé par master), `gotenberg-fonts` et l'instance isolée `chromium`
(projet `oct-chromium-isolated`, `railway up` à la main, procédure dans `services/gotenberg/RAILWAY.md`) ; c'est
l'instance isolée qui fait tourner Chromium** : mêmes bancs (`scripts/p27/gotenberg-compare.mjs --extra-html` + `scripts/p29/url-snapshots.mjs`, `scripts/p26/gotenberg-probe.mjs`,
`scripts/p29/js-probe.mjs`) sur `gotenberg-fonts` d'abord.

## 🧮 P28 — 04/10 : Gotenberg 8.37, équations Word, PDF Repair (`docs/audit/RAPPORT-p28-gotenberg-04-10.md`, repère `restauration-avant-p28-04-10` = `6a8af4be`)

**Décisions du propriétaire (prompt P28, 04/10)** : **Google Analytics reste chargé comme aujourd'hui** (les statistiques
complètes priment sur 1-2 points de vitesse) — sujet clos ; **le panorama iPhone de 63 Mpx est dans sa passe iPhone
(test 26)**.

| Lot | État | Reste |
|---|---|---|
| 1 Gotenberg 8.37.0 | ✅ **en production** (`gotenberg-v2` `26130544`, fusion `e060eb63`) : banc 59 documents dont 16 à équations, fidélité égale ou meilleure partout (rapport §1.3), adresses internes toujours refusées (27 sondes), revue de sécurité « GO avec conditions » (conditions vérifiées) ; www 8/8 | Retour arrière : `gotenberg-v2` → `930bc129` |
| 1b Aptos (trouvé en route) | ✅ **en production** (`8e8e178d`, fusion `df37f58e`) : Aptos → Liberation Sans au lieu de Noto Serif ; classeur Excel 2024 : 1 page comme Excel (2 avant) | — |
| 2 Équations des ODT écrits par Word | ✅ **en production** (fusion `03aa60d1`, `lib/odtWordMath.js`) : MathML « à plat » de Word rendu lisible (Smallpdf les perd, iLovePDF = Word) ; revue indépendante appliquée | **Non mesuré** : équations d'un `.docx` (ConvertAPI en production, ≈ 0,01 $ à dépenser pour le vérifier — décision propriétaire) ; reste mineur : crochets de matrice non étirés, équations RTF alignées à gauche (Word : centrées) |
| 3 PDF Repair | ✅ **en production** (pdf-tools `ab0077fd`, site `onlineconvertools-jcglmx2uu`) : texte contrôlé par Ghostscript et Poppler avant toute livraison ; méthodes Poppler et reconstruction de l'arbre des pages ; en ligne sur 248 PDF abîmés : **19 textes altérés en silence → 0**, refus 64 → 25 ; revue indépendante appliquée (3 défauts sérieux corrigés) | Écart restant avec iLovePDF (3-Heights) : PDF chiffré AES-256 dont la fin est perdue (pages dans des flux d'objets chiffrés). Retour arrière : pdf-tools `538d1590`, Vercel `onlineconvertools-1q669xcht` |

**Risque de sécurité ancien (revue indépendante P28) — traité par P29 (section ci-dessus)** : Chromium de Gotenberg tourne sans bac à sable avec
JavaScript actif, et HTML to PDF lui passe le HTML déposé tel quel ; Chromium 152 (Gotenberg 8.37) ne corrige pas
CVE-2026-87491 (V8, exploitée, corrigée en 153). À faire : passer à la prochaine Gotenberg embarquant Chromium ≥ 153 dès sa
sortie (même banc : `scripts/p27/gotenberg-compare.mjs` + sondes), et mesurer `CHROMIUM_DISABLE_JAVASCRIPT=true` ou un
nettoyage du HTML déposé comme `lib/urlFetch/snapshot.mjs` (ce qu'on perdrait sur HTML/EPUB/MOBI to PDF).

## 🌙 P27 — nuit du 03 au 04/10 (`docs/audit/RAPPORT-p27-nuit-04-10.md`, repère `restauration-avant-p27-04-10` = `ffe978a7`)

**P27 terminé le 04/10 : 6 phases sur 7 en production, aucun retour arrière.** Production **`onlineconvertools-g8bo4cvv9` = `b264efbc`** (repère du dernier lot `restauration-avant-p27-lot2` = `8399d22f` = `a5xwln359`) ; pdf-tools code `5c51f840`. Dépenses : ConvertAPI ≈ 0,04 $ (sur 0,05 $), Railway ≈ 0,05 $ (bancs), facture au repos inchangée (pdf-tools 0,023 Go). **Reste au propriétaire** : ~~phase 3~~ (faite par P28), un panorama iPhone de 63 Mpx dans Image Compressor (dans sa passe iPhone, test 26), ~~décision Google Analytics~~ (gardé, P28), ~~contrôle du texte de PDF Repair~~ (fait par P28).

| Phase | État | Reste |
|---|---|---|
| 1 PDF/A b : texte | ✅ **en production** : tout PDF/A (b, u, a, abaissement) n'est livré que si son texte est celui du source pour deux lecteurs (Ghostscript, Poppler) ; source gardé d'abord ; sinon refus expliqué. Service en ligne 341/341, 0 texte altéré ; revue indépendante faite. Corpus et banc permanents `scripts/p27/pdfa-corpus`, `scripts/p26/e2/pdfa-bench.mjs` | 4 niveaux b sur 93 refusés à raison (un PDF « impression seulement », `site-mobi` en 1b) |
| 2 PDF to Word réel | ✅ .doc et RTF de 9,9 Mo sur www, rouverts dans Word et LibreOffice ; **défaut ConvertAPI trouvé** (accents de PDF LibreOffice perdus : « donne% es ») et **corrigé en production** (`/v1/unicode-from-actualtext` avant ConvertAPI, revue indépendante) ; 0,04 $ dépensés sur 0,05 $ | — |
| 3 Gotenberg 8.37 | ✅ **fait par P28** (en production le 04/10, voir la section P28) | — |
| 4 Vitesse mobile | ✅ **en production** : **243 pages ≥ 90** (Lighthouse mobile, construction locale servie en HTTP/2 : accueil 94, médiane 94, min 92) ; Supabase plus chargé pour les visiteurs sans compte, préchargements retirés, accueil sans fondu, Currency Converter 88 → 93-94 ; JS du premier affichage −90 à −140 Ko | Google Analytics coûte ≈ 120 ms de TBT — **décision du propriétaire (P28) : il reste chargé comme aujourd'hui**, clos |
| 5 Accessibilité AA | ✅ **en production** : **axe 0 violation** sur 972 pages-modes (avant 248 graves/critiques) ; mode sombre contrasté, focus visible, zones d'envoi au clavier (A11yBridge), annonces ; clavier 40/40 ×3 moteurs (local, préversion, www) | — |
| 6 Clarté d'usage | ✅ **en production** : « Click or drop… » / « Choose… » selon l'appareil (112 zones), mots sous les icônes, 12 catégories au pied de page ; action déjà cachée avant fichier partout | — |
| 7 Restes P23 | ✅ **en production** : TextArea (gros textes sans blocage), bornes mesurées (Compressor 140 Mpx ordinateur / 50 téléphone ; images PDF 268 / 90), chien de garde | Propriétaire : un panorama iPhone de 63 Mpx dans Image Compressor (au-dessus de 50) |
| Trouvé en route | ✅ **en production** (lot 3) : PDF Extract Text, Compare, **Redact** (ne trouvait pas « données »), Translate, AI Summary, PDF to HTML, PDF to Excel lisent juste les PDF LibreOffice-Windows à accents décomposés (`app/lib/pdfActualText.js`, mise à jour incrémentale, NFC dans `app/lib/pdfjs.js`, revue indépendante) ; bancs corrigés (préversion protégée comptée « propre », barre Vercel, jeton) | ✅ **PDF Repair : contrôle du texte fait par P28** (en production) |

> **P26 (03/10) terminé : Gotenberg protégé, E1 et E2 en production, aucun retour arrière** — tableau P26 ci-dessous.
> Reste après P27 : ~~Gotenberg 8.37.0~~ (fait par P28), E3 (compte Google). PDF/A b et vraie conversion .doc : faits par P27.

## 📋 P25 — décisions E1 à E7 + remontée des erreurs (03/10, `docs/audit/RAPPORT-p25-decisions-03-10.md`)

**P25 terminé le 03/10 : 5 lots en production, aucun retour arrière** (production `onlineconvertools-m16uybh8j` =
`ffcb8764` ; repère de restauration `restauration-avant-p25-03-10` = `5cabf4f2`). Dépenses : ConvertAPI ≈ 0,03 $ (E1,
sur 0,05 $ autorisés) ; Google (E3) 0 $ (pas de compte). **Reste au propriétaire** : E3 (compte Google Cloud, ci-dessous),
et trois autorisations Railway à décider — `pdf-tools` pour E2 (2u/3u, 2a/3a), un point d'entrée LibreOffice pour le DOC
(E1) et le drapeau `--chromium-deny-private-ips` de Gotenberg (E4 + fichiers HTML déposés). → **accordées et faites par P26.**

| # | État | Ce qui manque / ce que le propriétaire doit faire |
|---|---|---|
| E1 | RTF : ✅ **en production** (`2el17n5su` = `708a019b`, code `ae7719cb`) ; 3 vrais PDF → RTF rouverts dans Word et LibreOffice sur la préversion (≈ 0,03 $). **DOC : impossible chez ConvertAPI** (aucun de ses 332 convertisseurs n'écrit de .doc, OpenAPI lue le 03/10) | **DOC** : un point d'entrée LibreOffice (`--convert-to doc`) sur un service Railway (`pdf-tools` ou Gotenberg) — 0 $ de moteur, ≈ 2-3 h, **autorisation Railway**. **RTF au-delà de 4 Mo** : ajouter `rtf` (et `doc`) aux sorties du service média (`STAGE_OUTPUTS`, 2 lignes additives) — même autorisation |
| E2 | Recherché et **mesuré** (veraPDF) ; non construit | **Recommandation : autoriser une modification additive de `pdf-tools` sur Railway** (0 $, ≈ 4-6 h) : 2u/3u pour presque tout PDF (Ghostscript + niveau U, validé veraPDF sur les fichiers mesurés), 2a/3a pour les PDF déjà balisés (chemin pikepdf qui garde la structure), abaissement dit sinon (comme `allow_downgrade` d'iLovePDF) ; 1a non atteint par les outils libres (commercial : Adobe Auto-Tag, Apryse — non recommandé) |
| E3 | Code prêt, revu ×2, **en production désactivé** (`2el17n5su` ; aucune promesse sur la page, vérifié sur www) | **Le propriétaire crée** : un projet Google Cloud avec facturation ; active « Cloud Translation API » ; un compte de service avec le rôle « Cloud Translation API User » ; une clé JSON de ce compte ; dans Vercel, une variable **sensible** `GOOGLE_TRANSLATE_SERVICE_ACCOUNT` (Production et Preview) = le contenu JSON ; dans Google Cloud, une **alerte de budget à 30 $** et un **quota journalier** sur Cloud Translation (garde-fou dur). Puis Claude : test ≤ 2 $ sur préversion, texte SEO de la page, mise en production |
| E4 | ✅ **en production** (`e61uoxp4x` = `d908d935`, code `94623a0c`) ; www vérifié (conversion réelle, 169.254.169.254 refusé) ; revue de sécurité ×2 | **À décider** : `--chromium-deny-private-ips` sur Gotenberg (un drapeau, 0 $) — ferme aussi le cas des **fichiers HTML déposés** qui peuvent faire charger au Chromium de Gotenberg une adresse interne de Railway (constat P25) et permettrait ensuite un mode « avec scripts » comme iLovePDF |
| E5 | ✅ **en production** : service Railway (`48be81c4` + correctif AV1 `ea8858d8`, `/health` → `edits: 2`) puis pages (`m16uybh8j` = `ffcb8764`) ; miroir, recadrage libre, vitesse, volume, fondus, codec H.265/AV1, CRF ; boucle du GIF déjà livrée par P24 ; www vérifié | Version précédente du service = code `d914f612` (retour arrière : révoquer les fusions sur master) |
| E6 | ✅ **en production** (`md3dfcxsk` = `5cbfc044`, code `a1aa8f83`) ; www vérifié | — |
| E7 | ✅ **en production** (même déploiement) ; www vérifié | — |
| Erreurs | ✅ **en production** : 203 outils directs + filet sur les 225 ; une erreur provoquée par le banc **écrite** dans `tool_errors` sur www (02/10 ≈ 21 h 54 UTC, outil json-formatter, 2 lignes à ignorer) | — |

## 🛠️ P26 — services Railway : sécurité Gotenberg, PDF/A u/a, DOC, gros RTF (03/10, `docs/audit/RAPPORT-p26-railway-03-10.md`)

Repère de restauration `restauration-avant-p26-03-10` = `11910e7a`. Railway piloté par la CLI officielle déjà connectée
(compte du propriétaire) ; aucun service ajouté, aucune variable Vercel touchée.

| # | État | Ce qui manque |
|---|---|---|
| Gotenberg (E4 + HTML déposés) | ✅ **en production** (`gotenberg-v2` déploiement `930bc129`, et `gotenberg-fonts` `55fa4c41`) : `CHROMIUM/LIBREOFFICE/WEBHOOK/API_DOWNLOAD_FROM_DENY_PRIVATE_IPS`, `WEBHOOK_DISABLE`, `API_DISABLE_DOWNLOAD_FROM`, `CHROMIUM_DENY_LIST` (règle `file://` par défaut + 100.64/10, 198.18/15) ; faille prouvée avant (pdf-tools, service média, boucle locale imprimés), 13 adresses refusées après ; 18 conversions directes + 7 par les pages de www identiques au pixel ; revue de sécurité indépendante : feu vert | **Gotenberg 8.37.0** (classe CGNAT/198.18 comme internes même derrière un nom DNS, bornes contre les pages hostiles) : change Chromium 152 / LibreOffice 26.8 → chantier dédié, banc des 18 documents au pixel sur `gotenberg-fonts` d'abord. Retour arrière : déploiement `515a1679` (Rollback Railway) |
| E2 PDF/A | ✅ **en production** : 2u, 3u ; 2a, 3a pour les PDF balisés (structure gardée) ; abaissement seulement si coché, et dit ; texte du source vérifié mot pour mot (pdf-tools `bf8a5d74`, site `arram1kr8` = `35f6cccb`) ; www 8/8 réelles | **1a non proposé** (aucun outil libre). **Défaut ANCIEN trouvé (grave, non corrigé : consigne « ancien comportement identique »)** : les niveaux **1b/2b/3b** en production altèrent le texte (Ghostscript) — grec, ligatures « ti/fi », accents (491 mots sur 612 sur un document LibreOffice) ; pages visuellement justes. **Correction mesurée** (celle des niveaux u) : PDF source gardé d'abord, Ghostscript seulement si le texte est inchangé, sinon livrer en le disant — à faire dans un lot dédié avec `scripts/p26/e2/pdfa-bench.mjs` (contrôle mot à mot) |
| E1 DOC + RTF > 4 Mo | ✅ **en production** : .doc (DOCX ConvertAPI puis LibreOffice 25.2 sur pdf-tools ; DOCX payé livré et dit si le .doc échoue), RTF et DOC jusqu'à 99 Mo par le service média (`c04f9c3c`) ; rouverts dans Word et LibreOffice ; page 7/7 ×3 moteurs en local | Aucune vraie conversion ConvertAPI faite (règle P26 : aucune dépense hors Railway) : bancs avec de vraies sorties ConvertAPI antérieures ; **à la première occasion, une vraie conversion PDF → .doc sur www** (≈ 0,01 $) |
| E3 | en attente du **compte Google Cloud du propriétaire** (liste au tableau P25) | inchangé |
| Facture Railway | mesurée (rapport §6) : aucune hausse au repos ; ≈ 0,00003 $ par .doc | — |

## 🧑‍⚖️ Décisions du propriétaire — P21 (02/10, `docs/audit/RAPPORT-p21-nuit-jour-02-10.md`)

| # | Quoi | Coût | Recommandation |
|---|---|---|---|
| D1 | **Détourage : morceaux de fond gardés par le modèle** (segmentation d'IS-Net ; le liseré et le halo sont corrigés par P21 dans le navigateur). Changer de modèle sur Railway a été **mesuré en local** : BiRefNet-lite pire (voile 4,4 % contre 3,2 %) ; BiRefNet complet très inégal (chat sur champ 17,7 % → 0 %, mais chat sur feuille 30 % → 133 %) et 31 s/image sur 8 cœurs, donc carte graphique nécessaire | carte graphique à la demande ≈ 0,001-0,003 $/image + compte chez un fournisseur (non choisi) ; ou 0 $ si on ne change rien | **ne rien changer maintenant** ; si le propriétaire peut confier la photo réelle de la tasse (sans donnée personnelle), la passer au banc `scripts/p21/bg-bench/` pour vérifier le cas exact |
| D3 ✅ **FAIT par P22** (voir ci-dessous) | **Image Converter : fichiers RAW d'appareil photo** (CR2, CR3, NEF, ARW, DNG, ORF, RW2, RAF…), que prennent iLoveIMG, CloudConvert et Convertio. Seul moteur sérieux : LibRaw. Sa version WebAssembly publiée sur npm (`libraw-wasm`) est compilée avec les fils d'exécution : elle exige l'isolation inter-origines (qui casserait Analytics et Google Translate) et **bloque la construction Turbopack** (mesuré le 02/10). Un fork mono-fil existe mais a une semaine, 0 étoile, ~200 téléchargements : binaire non vérifiable, non retenu | **0 $** ; ≈ 2-3 h de Claude | **compiler nous-mêmes LibRaw officiel (LGPL-2.1/CDDL) en WebAssembly mono-fil** (emsdk, sources signées), puis brancher le décodeur déjà écrit et le banc `p21-psd.mjs` (vrais RAW de raw.pixls.us) — à faire dans une session dédiée ; PSD est déjà ajouté |
| D2 ✅ **CLOS par P23 (02/10)** : 5 lignes depuis le 28/09, une seule cause (Image Converter refusait sur iPhone les photos de 12,19 Mpx « au-delà de 12 »), déjà corrigée par `cd0c2ad9` le 29/09, reproduite et couverte par `big-image.mjs --device=iphone` (`RAPPORT-p23-02-10.md` §1) | **Erreurs réelles des visiteurs (phase 2)** : `tool_errors` n'est lisible qu'avec la clé service (interdite à Claude) ; les journaux Vercel Hobby ne gardent qu'**1 heure** | 5 min ; Observability Plus de Vercel si l'on veut 7-30 jours de journaux (payant, non chiffré ici) | exécuter `docs/audit/p21-tool_errors-lecture.sql` dans Supabase → SQL Editor, télécharger les 2 résultats en CSV dans Téléchargements ; Claude reproduira et corrigera chaque cause |

**Décisions prises par le propriétaire le 02/10 (prompt P22) :**
- **D1 détourage — ne rien changer au modèle** (mesuré par P21). La vérification de la tasse sur le vrai iPhone dira s'il reste un cas à traiter.
- **D3 RAW — accepté : compiler LibRaw nous-mêmes, 0 $** → fait par P22 (voir la section P22 ci-dessous et `docs/audit/RAPPORT-p22-raw-02-10.md`).
- **D2 `tool_errors` — le propriétaire lance lui-même la requête de lecture** (`docs/audit/p21-tool_errors-lecture.sql`) le soir du 02/10 ; Claude reproduira et corrigera chaque cause à partir des CSV. → ✅ **fait par P23** : une seule cause, déjà corrigée, reproduite (`RAPPORT-p23-02-10.md` §1). À refaire après le lancement, quand il y aura du trafic (même requête).

## 📷 P22 — fichiers RAW dans Image Converter (02/10, `docs/audit/RAPPORT-p22-raw-02-10.md`)

| Quoi | État |
|---|---|
| LibRaw 0.22.2 officiel compilé par nous en WebAssembly mono-fil (`scripts/libraw-wasm/`, sources vérifiées par comparaison libraw.org ↔ GitHub, SHA-256 inscrit) — 881 Ko, 354 Ko compressé, chargé au premier RAW | ✅ |
| 23 formats vérifiés sur de vrais fichiers (raw.pixls.us) : pixels **identiques** au `dcraw_emu` officiel (écart moyen 0,0000) | ✅ |
| Sigma X3F refusé avec une phrase (couleurs fausses mesurées) ; fichier tronqué ou faux : refusé, jamais une fausse image (162 coupes mesurées) | ✅ |
| Licence CDDL-1.0 + sources servies (`/wasm/libraw-LICENSE.txt`, `/wasm/LibRaw-0.22.2.tar.gz`), FAQ et textes de la page | ✅ |
| Préversion, bancs 3 moteurs + iPhone/iPad, production, vérification sur www | ✅ **en production `bf960651`** (`onlineconvertools-awc0el292`) ; www : RAW tout vert ×3 moteurs + iPhone/iPad, téléchargement, 238 pages ×3 — aucun retour arrière |
| **Défauts préexistants trouvés par le banc de solidité complet** (mêmes échecs sur la production d'avant P22) : Duplicate Image Finder, Video Watermark, QR Generator « giant », Image Cropper et Video Merger sous Firefox — silencieux sur fichier vide/abîmé/faux | ✅ **corrigés par P23** (02/10), avec 8 autres trouvés en chemin (Image to Base64 figé 84 s sous Safari, JPG to PDF figé sur 900 Mpx, Image Compressor bloqué sur une image de 400 Mpx / 49 Ko…) ; banc de solidité vert sur les 3 moteurs (`RAPPORT-p23-02-10.md`) |
| **Reste au propriétaire** : un vrai RAW de son appareil (ou d'un proche) sur iPhone/iPad dans Image Converter → JPG ; un ProRAW 48 Mpx d'iPhone 14/15/16 Pro (aucun sur raw.pixls.us : seuls des ProRAW 12 Mpx ont été testés). **Non mesuré faute d'échantillon** : un DNG compressé en JPEG XL (DNG 1.7) — LibRaw ne le lit qu'avec le DNG SDK d'Adobe, non compilé ici ; à vérifier avec un vrai fichier | ⏳ |

## 🧑‍⚖️ Décisions du propriétaire — P24 (03/10, `docs/audit/RAPPORT-p24-couverture-03-10.md`)

| # | Quoi | Coût | Recommandation de Claude |
|---|---|---|---|
| E1 | **PDF to Word en DOC / RTF** (CloudConvert les offre ; iLovePDF : format non vérifié) : ConvertAPI sait le faire, même prix par conversion, mais le prouver demande de vrais appels payants (interdits cette nuit) | ≈ 0,01-0,05 $ de test ; aucun coût fixe | **oui, plus tard** : quelques appels de test sur préversion, puis l'ajouter |
| E2 | **PDF/A 1a, 2a, 2u, 3a, 3u** (iLovePDF les offre ; CloudConvert : 1b/2b/3b comme nous) : les niveaux « a » exigent un PDF balisé (structure), que Ghostscript ne crée pas ; « u » demande un texte Unicode garanti | nouveau moteur (veraPDF ne corrige pas ; il faudrait un outil de balisage) | **ne rien faire** : nos 1b/2b/3b égalent CloudConvert |
| E3 | **PDF Translate du document entier** (iLovePDF : 50+ langues, mise en page gardée) : aujourd'hui 5 pages / 3 000 caractères, texte seul, OpenAI payant | ≈ 0,002 $ par page avec gpt-4o-mini, plafonds à revoir | décision de budget ; garder tel quel avant le lancement |
| E5 | **Vidéo : miroir, vitesse, recadrage libre, volume / fondu, choix du codec (H.265/AV1) et du CRF, boucle d'un GIF** (123apps, Clideo, FreeConvert les offrent) : le service ffmpeg sur Railway ne les accepte pas aujourd'hui (paramètres à ajouter à `ffmpeg_ops.py`) | 0 $ de plus en fonctionnement ; ≈ 2-3 h ; modification de Railway (interdite sans le propriétaire) | **oui, après le lancement**, selon la règle « additif d'abord » (service rétrocompatible sur master, puis pages) |
| E6 | **Password Generator : phrase de passe** (Bitwarden, 1Password la proposent) : demande la liste de mots de l'EFF (7 776 mots, ≈ 60 Ko, licence CC BY 3.0, attribution sur la page) ajoutée au dépôt | 0 $ ; ≈ 1 h | **oui** si l'attribution EFF sur la page vous convient |
| E7 | **Currency Converter : historique et graphique des taux** (xe.com, Wise) : ExchangeRate-API ne donne l'historique qu'en offre payante ; Frankfurter (BCE, gratuit, 30 devises) le donne | 0 $ avec Frankfurter (30 devises seulement) ; ≈ 2 h | **plus tard** : utile mais secondaire, et un deuxième fournisseur à surveiller |
| E4 | **HTML to PDF depuis une URL** (iLovePDF le fait) : Gotenberg sait (route url) mais une URL saisie par un visiteur expose aux requêtes vers notre réseau interne (SSRF) : liste d'interdiction d'adresses privées et délai à concevoir | 0 $ ; ≈ 2 h + revue de sécurité | oui après le lancement, avec revue de sécurité |

**Décisions prises par le propriétaire le 03/10 (prompt P25, `docs/audit/RAPPORT-p25-decisions-03-10.md`) — toutes OUI, mises en production demandées, y compris en son absence :**
- **E1** PDF to Word en DOC et RTF — oui ; dépense de test ≤ 0,05 $ (ConvertAPI sur préversion), prouvé sur de vrais PDF rouverts.
- **E2** PDF/A 1a, 2a, 2u, 3a, 3u — oui ; recherche du moyen des concurrents d'abord ; chaque niveau annoncé **validé par veraPDF** ; s'il faut un moteur payant ou un nouveau service : chiffrer ici avec recommandation, ne pas le faire.
- **E3** PDF Translate du document entier, mise en page gardée — oui ; meilleur rapport qualité/coût, quota gratuit par visiteur, **plafond global 30 $/mois** (modèle du budget AI Detector), réviseur indépendant ; test ≤ 2 $. Clé ou compte manquant : tout préparer, écrire ici ce que le propriétaire doit créer, aucune fausse promesse.
- **E4** HTML to PDF depuis une URL — oui, avec protection SSRF (adresses privées, locales, de lien, de métadonnées interdites après résolution DNS et à chaque redirection ; délai et taille max) ; réviseur indépendant (sécurité).
- **E5** options vidéo (miroir, vitesse, recadrage libre, volume et fondu, H.265/AV1, CRF, boucle du GIF) — oui ; **Railway autorisé pour E5 seulement**, « additif d'abord », version précédente notée, déploiement vérifié avant de brancher les pages ; aucune variable modifiée, aucune dépense.
- **E6** Password Generator, phrase de passe EFF (7 776 mots, CC BY 3.0) — oui, attribution sur la page, tirage cryptographique sans biais.
- **E7** Currency Converter, historique et graphique (Frankfurter, BCE) — oui, pour ses devises, annoncé honnêtement.
- **En plus** : tous les outils branchés sur `reportToolError` (aucune donnée personnelle ni contenu de fichier, plafond), erreur provoquée par un banc vérifiée à l'arrivée.

## 🛡️ P23 — erreurs réelles des visiteurs + solidité (02/10, `docs/audit/RAPPORT-p23-02-10.md`)

| Quoi | État |
|---|---|
| D2 : lecture des deux CSV `tool_errors` (5 lignes, 1 cause, déjà corrigée le 29/09, reproduite) | ✅ clos |
| Solidité : les 6 outils de P22 + 8 défauts trouvés en chemin ; vérifications partagées `fileChecks.js` ; cas « bomb » (400 Mpx, 49 Ko) ajouté au banc ; banc résistant à la mort du navigateur ; réviseur indépendant ×2 (rien de grave) | ✅ |
| `big-image.mjs` remis à jour (`--device=iphone|ipad`) | ✅ |
| Préversion, bancs 3 moteurs + iPhone/iPad, production, vérification sur www | voir le rapport §4-5 |
| **Reste** : messages des outils non branchés sur `reportToolError` (24 fichiers seulement remontent leurs erreurs) ; champs texte **modifiables** remplis par un gros fichier sur une seule ligne (non mesuré, les sorties à lignes courtes sont rapides) ; une borne « téléphone » mesurée pour Image Compressor / PDF (aujourd'hui 268 Mpx partout) | ⏳ à décider par Claude dans un prochain chantier, aucune urgence |

> ## ═══ RÈGLE QUI PRIME SUR TOUT LE RESTE, posée fermement par le propriétaire le 23 septembre ═══
>
> **RECHERCHE AVANT TOUTE DÉCISION — sans exception, et quelle que soit la taille de la décision.**
> Cela ne vaut pas seulement pour les outils : cela vaut pour le moindre détail technique, d'interface
> ou esthétique — une bibliothèque, une architecture, un plafond, un libellé, une disposition, une
> couleur. Avant de choisir, tu regardes comment les sites de référence font, et par quel moyen.
>
> **Établir le MOYEN, pas seulement constater le RÉSULTAT.** Mesurer qu'un concurrent fait mieux ne
> sert à rien si on ne sait pas comment il s'y prend. Ne jamais optimiser à l'intérieur d'une solution
> sans avoir vérifié que c'est la bonne famille de solution.
>
> **Point de départ obligatoire : tout ce que propose ce site existe déjà ailleurs sur le web.** Des
> concurrents le font sans se ruiner, donc un moyen viable EXISTE. Conclure « trop cher » ou
> « impossible » à partir du tarif d'un seul fournisseur est une faute de méthode.
>
> **Aucune suppression d'outil ne peut même être PROPOSÉE avant une recherche documentée montrant
> qu'aucune solution de qualité n'existe — et la décision appartient au propriétaire, toujours.**
>
> Le résultat doit être ÉGAL OU SUPÉRIEUR aux sites de référence, jamais inférieur.

> ## ═══ RÈGLE DE DÉCISION — posée par le propriétaire le 28 septembre ═══
>
> **Le propriétaire n'est pas développeur. Claude ne lui soumet aucun choix technique, d'interface ou de formulation.** Pour chaque choix : rechercher comment les meilleurs concurrents font et par quel moyen, retenir une solution au moins égale à la leur, et s'il existe un moyen plus court ou moins coûteux pour le même résultat, l'appliquer immédiatement.
> **Claude ne s'arrête pour demander que ce que le propriétaire seul peut faire :** une dépense au-delà des plafonds existants, un compte ou un abonnement, un secret à générer, un geste physique, ou la suppression de données de production.

> ## 🚦 RÈGLE ZÉRO — MESURER AVANT DE CONSTRUIRE
>
> **Avant d'ouvrir un chantier, répondre à trois questions. Aucune exception.**
>
> 1. **Quelle donnée dit que ce chantier compte ?** Si la réponse est « c'est évident », ce n'est pas une réponse.
> 2. **De quand date cette donnée ?** Un tableau de bord affiche toujours sa date de mise à jour. **La lire AVANT de lire le chiffre.**
> 3. **Existe-t-il une vérification en direct, moins chère, qui la confirme ou l'infirme ?**
>
> **Ce qui a coûté deux jours :** le rapport « Indexation des pages » annonçait 35 pages indexées sur 248. Il était **figé depuis neuf jours**. Cinq minutes dans « Inspection de l'URL » auraient montré le contraire immédiatement.
>
> **Ce qui a coûté 2 h 15 le 18 septembre :** un chantier « déployer Gotenberg versionné » lancé sans vérifier l'état réel. Le service `gotenberg-fonts` avait **déjà** le Root Directory et les Watch Paths depuis le 1er septembre, et s'était **déjà** redéployé tout seul sur le commit à digest épinglé. Le travail était fait avant de commencer.
>
> **Corollaire 1 :** *chaque gros chantier incertain contient une mesure courte qui tue l'incertitude. Faire la mesure d'abord, toujours.*
> **Corollaire 2 :** *un bloquant qu'on ne revérifie pas reste ouvert même après avoir été réglé.*
> **Corollaire 3 :** *vérifier que le fournisseur existera encore.*
> **Corollaire 4 :** *un service qui répond n'exécute pas forcément ton code.* Un déploiement Railway qui plante ne fait pas tomber le service : l'ancienne version reste en ligne. Seul un comportement propre à la nouvelle version le prouve.
> **Corollaire 5 :** *l'état réel d'une infrastructure se lit avant de la modifier, pas après.*


> ## ⭐ RÈGLE QUI PRIME SUR TOUT LE RESTE — posée par le propriétaire le 20 septembre 2026
>
> **Chaque outil doit FONCTIONNER comme annoncé, sur tous les navigateurs, et donner un résultat ÉGAL OU SUPÉRIEUR aux sites de référence du marché — jamais inférieur.** Un message d'erreur honnête n'est pas une solution. Le coût n'est pas un obstacle, la durée non plus. L'ordre est toujours : **recherche, analyse, décision, puis construction.** Si la mesure contredit une hypothèse, on **change de solution**, on ne l'aménage pas.

---

# 🗓️ PLAN DE LA SEMAINE 1 — accepté le 12 septembre

| Jour | Quoi | État |
|---|---|---|
| **1** | Navbar (10) · plafond `pdf-translate` (4) · chiffrage des stubs (7) | ✅ **FAIT** |
| **2** | **MESURER** la fidélité Office → PDF *(bloquant 2)* | ✅ **MESURÉ** — promesses corrigées en ligne · défauts ouverts D1→D10 |
| **3** | Détourage *(bloquant 3)* | ✅ **CLOS** |
| **4** | **TESTER** Safari sur les 20 outils les plus mis en avant *(bloquant 9)* | 🟡 **feuille prête** (`tests-safari-proprietaire.md`) — **en attente du propriétaire**, ~2 h |

---

> ## 📌 COMMENT UTILISER CE DOCUMENT
>
> **C'est le SEUL document de pilotage du projet.** Toute tâche, tout point reporté, toute décision est ici.
>
> **Au début de chaque session, ce document est relu et la section « Déclencheurs » est vérifiée.** Si une condition est remplie, **le propriétaire en est averti immédiatement, sans qu'il ait à le demander.**
>
> **Ne jamais affirmer que « tout est noté » sans avoir relu ce document en entier.**
>
> ### Les autres documents — rôle distinct, aucune tâche autonome
> - `REFERENCE-projet.md` — encyclopédie technique
> - `decision-internationalisation.md` — dossier de décision sur le multilingue
> - **`tests-manuels-proprietaire.md`** — feuille de test du **bloquant 11**. Ses verdicts se reportent ici ; ce qui échoue remonte dans les bloquants, jamais dans « CLOS ».
> - **`tests-safari-proprietaire.md`** — feuille de test du **bloquant 9** (Safari iPhone + MacBook, 20 outils). Même règle : verdicts reportés ici, ce qui échoue remonte dans le bloquant 9.
> - `docs/audit/RAPPORT-*.md` — traces de chantier, jamais des tâches
> - `session-etat-*.md` — archives datées
>
> ⚠️ **Aucun autre document de tâches ne doit exister.**

---

## LE STANDARD

> *« Je veux que mon site soit une référence pour tous les outils qu'il affiche. Je ne veux qu'aucun concurrent n'offre une qualité plus que moi. Tous mes outils doivent traiter les demandes des clients parfaitement et offrir le maximum de variété. »*

**Deux critères par outil, jamais un seul :** la **qualité** comparée au site de référence sur le même fichier, et la **couverture** des formats comparée au marché.

**Aucun outil supprimé ni renommé sans accord explicite préalable.**

## 🎯 OBJECTIF : 10 000 $US/mois — **le plus rapidement possible**

> ### ⏱️ Horizon révisé le 17 septembre 2026
>
> **L'échéance « 2 à 4 ans » est retirée.** La consigne du propriétaire est désormais : *le plus vite possible.*
>
> **Ce que ça change — l'ORDRE :** entre deux options, choisir systématiquement celle qui atteint un visiteur, puis un visiteur payant, le plus tôt. Un chantier qui n'avance ni le lancement, ni le trafic, ni le revenu attend.
>
> **Ce que ça NE change PAS — le NIVEAU.** « Vite » n'autorise pas un outil livré à 80 %. Le standard ci-dessus reste entier, et une promesse fausse en ligne reste un bloquant, quel que soit le calendrier. Les deux exigences ne sont pas en conflit : ce qui a coûté du temps sur ce projet, ce n'est jamais la qualité — c'est d'avoir travaillé sur le mauvais chantier faute de mesure.
>
> **Ce que ça ne peut pas accélérer :** le référencement naturel. Position moyenne 74,7, zéro domaine référent contre 7 600 chez le concurrent de référence. Cet écart se comble en mois ou en années quel que soit l'effort fourni. **Aucune urgence ne le raccourcit.**
>
> **Où porter l'effort, en conséquence :**
> 1. **Lancer.** C'est la seule chose réellement rapide, et rien ne commence avant.
> 2. **Obtenir des domaines référents.** C'est le verrou du classement. ~~Product Hunt est la seule source prévue — il en faut d'autres.~~ **✅ 29/09 : 24 autres sources légitimes relevées, classées et prêtes à soumettre** (`docs/lancement/sources-de-liens.md`, textes à coller compris). Le moyen des concurrents, relevé sur le web public : les liens **suivis** viennent de recommandations (guides de bibliothèques universitaires → TinyWow, CloudConvert ; presse tech après un Show HN réussi → VERT) ; annuaires, GitHub, SaaSHub et Indie Hackers donnent des liens **nofollow** (lu dans leur HTML). Ordre : Show HN, bibliothécaires, presse, Reddit, puis fiches. Soumissions = tâches du propriétaire **P11** (ligne d'arrivée).
> 3. **Les voies de revenu qui ne dépendent pas de Google.** À trancher après le lancement, sur données d'usage réel.

**Chemin :** site fiable → lancement Product Hunt → indexation → AdSense **une fois 20-50 visiteurs/jour** → Premium grand public → offre API/B2B.

> **Correction honnête :** l'offre API/B2B avait été présentée comme « le levier le plus court ». Ce n'était pas vérifié. Affronter CloudConvert, ConvertAPI, Adobe et Zamzar, seul, sur un plan Vercel Hobby dont les conditions interdisent l'usage commercial — 40 clients à 250-500 $/mois, c'est 12 à 24 mois de prospection. **Ce n'est pas plus rapide, c'est un autre marathon.**
>
> **La contrainte réelle n'est pas le produit, c'est la distribution.**

---

# 🔴 BLOQUANTS AVANT LE LANCEMENT

## 1 — Le vrai problème n'est pas l'indexation, c'est le **classement**

### ⚠️ Le chiffre de « 35 pages indexées » est FAUX

Rapport **Indexation des pages** **figé au 03/09/2026**, vérifié deux fois. **La source fiable est « Inspection de l'URL », en direct.**

### L'expérience du 12 septembre

Sur **21 URL testées en direct** : **7 déjà indexées**, **3 indexées en moins de 2 minutes** après demande manuelle, 4 en attente, 2 bloquées par le quota. Le 13 septembre : **10 catégories sur 12 confirmées indexées.**

> **Les pages du site ne posent AUCUN problème à Google.**

### Le vrai problème

**5 clics en 6 mois. 841 impressions. Position moyenne 74,7 — page 8.**

Les dix premières requêtes sont des recherches **de marque visant le concurrent**. **Une seule porte une intention réelle : `percentage calculator online`** — issue de `math-tools` (6 outils), alors que `developer-tools` en compte 54 et n'a jamais été travaillée.

### Décision du 13 septembre : arrêter les demandes manuelles quotidiennes

Les carrefours sont indexés ; Google trouvera le reste seul. Et indexer une page classée en position 74 ne rapporte rien. **Garder les demandes pour les 10 à 15 pages qu'on va réellement travailler, et les demander APRÈS les avoir améliorées.**

### Le diagnostic technique — `RAPPORT-indexation.md` (`21374d83`)

Serveur à **224 ms** · sitemap **240/240 en 200** · contenu SEO **dans le HTML brut sans JS** · **0 page orpheline**, 2 clics max · 0 lien absolu non-www · **247 pages**.
**Exploration (90 j) :** ~12 requêtes/jour. Actualisation 94 % · découverte 6 %. JS 61 % · HTML 10 %.

### ✅ 29/09 — les 10 pages travaillées (branche `croissance-29-09`, NON déployée — `RAPPORT-croissance-29-09.md` §4)

Choisies sur trois critères : **demande réelle** (suggestions Google ; Search Console pour le pourcentage), **concurrence battable** (petits sites d'outils en tête, sauf le pourcentage), **outil déjà au niveau** des pages en tête (json-to-rust, json-to-php et env-to-json **écartés** : en dessous du marché). Chaque page : titre et description réécrits, FAQ répondant aux vraies questions, exemple réel vérifié dans l'outil, liens internes, **données structurées** (WebApplication + BreadcrumbList + FAQPage — le site n'en avait aucune ; schema.org : 0 erreur). **Indexation à demander APRÈS le déploiement (P12)**, dans cet ordre :
1. `/tools/math-tools/percentage-calculator` 2. `/tools/developer-tools/csv-to-sql` 3. `/tools/developer-tools/sql-to-csv` 4. `/tools/developer-tools/csv-to-json` 5. `/tools/developer-tools/toml-to-json` 6. `/tools/developer-tools/json-to-toml` 7. `/tools/developer-tools/csv-to-tsv` 8. `/tools/developer-tools/tsv-to-csv` 9. `/tools/developer-tools/hash-generator` 10. `/tools/qr-barcodes-tools/barcode-generator`
**✅ Déployées le 29/09 (`ceb538f3`) et indexation demandée le 29/09 par le propriétaire** : `percentage-calculator` était déjà indexée (ancienne version, réindexation demandée) ; les 9 autres n'étaient **pas** indexées avant la demande. **📅 Relevé de position à faire entre le 10 et le 24 novembre 2026 (4 à 6 semaines après)** : Search Console → Performances → filtrer chaque page (clics, impressions, position moyenne) et Inspection de l'URL pour confirmer l'indexation des 9 nouvelles. **À faire ensuite (non fait) :** relever leur position dans Search Console 4 à 6 semaines après l'indexation, avant de toucher à d'autres pages. **✅ 29/09 (branche `qualite-29-09`) : les 3 outils écartés sont désormais ÉLIGIBLES** — `json-to-rust` (structures imbriquées, snake_case + `#[serde(rename…)]`, `Option`, `Vec`, par quicktype, le moteur d'app.quicktype.io), `json-to-php` (« PHP array » + classes PHP 8), `env-to-json` (règles de dotenv : `export`, multi-lignes, guillemets, commentaires, types, `${VAR}`) ; code au niveau du marché, **contenu SEO NON touché** (seuls les textes qui décrivaient une capacité fausse ont été corrigés ; titres et métadonnées inchangés). Leur travail de contenu attend la mesure des 10 pages ci-dessus (`RAPPORT-qualite-29-09.md` §2).

## 2 — ✅ **Fidélité Office → PDF — MESURÉE, promesses corrigées en ligne**

### Ce qui est clos, avec preuve — 19 septembre 2026

Les promesses fausses **ne sont plus en ligne**. *« professional-quality »* a disparu des cinq outils (`word-to-pdf`, `excel-to-pdf`, `ppt-to-pdf`, `pdf-to-word`, `html-to-pdf`), remplacé par des formulations adossées à des mesures écrites — **5 à 7 occurrences de « In our tests… » par page**, balises `<meta description>` comprises, divulgation de la substitution de police incluse sur `ppt-to-pdf`. Vérifié en production sur le HTML servi.

**Corpus de mesure reproductible** : `docs/audit/fixtures-fidelite/` — six fichiers déterministes générés par script et versionnés, couvrant tableaux fusionnés, colonnes, notes de bas de page, table des matières, mise en forme conditionnelle, formules, graphiques, dégradés et substitution de police. Rejouable à chaque changement de moteur.

**Deux erreurs de SEO corrigées au passage :** `word-to-pdf` annonçait « LibreOffice » alors que le `.docx` passe par ConvertAPI ; `pdf-to-word` décrivait encore une extraction de texte brut dans le navigateur, en contradiction avec sa propre page.

**Rapports :** `RAPPORT-fidelite-office.md`, `RAPPORT-fidelite-corrections.md`, montages et scripts dans `docs/audit/fidelite-marche/`.

### ⚠️ Limite de la comparaison marché — à ne pas surévaluer

**Deux sorties exploitables sur trois**, et les deux ne sont probablement **pas indépendantes** : FreeConvert et Online2PDF rendent des `.pptx` quasi identiques entre eux, signe d'un même moteur sous-jacent. CloudConvert bloqué par son quota gratuit (10 crédits/jour), iLovePDF fige l'onglet au téléchargement. **Il manque une référence réellement indépendante** — Adobe ou Microsoft, qui n'utilisent pas LibreOffice.

### Ce qui reste ouvert — les défauts chiffrés

| # | Défaut | État | Coût |
|---|---|---|---|
| **D1** | Gras Excel en police à empattements | ✅ **CORRIGÉ et vérifié en production.** Cause réelle : les polices `.xlsx` **sans nom** (ce qu'écrit `openpyxl` pour `Font(bold=True)`) ; Excel les lit comme la police par défaut du classeur, LibreOffice tombe sur une police à empattements. `lib/xlsxDefaultFont.js` les nomme avant conversion. Fixtures 03 et 04 sortent en **Carlito-Bold**, comme chez les deux concurrents. **`.xls`, `.ods` et `.csv` non mesurés.** | fait |
| **D2** | Substitution de Segoe UI | ✅ **Selawik intégrée** — dépôt officiel Microsoft, **SIL OFL 1.1**, redistribution commerciale permise, TTF non modifiés, SHA-256 vérifiées au build. **Compatibilité métrique mesurée, pas supposée : 93/93 glyphes de largeur identique, normal et gras.** Le README Microsoft ne l'annonce pas et signale un crénage non aligné. | fait |
| **D6** | `pdf-to-word` basculait **silencieusement** vers du texte brut quand `PDF_TO_WORD_CONVERTAPI_ENABLED` est coupé | ✅ **CORRIGÉ** — répond désormais **503 avec message clair**. Testé en local. Interdit permanent n° 3 respecté. | fait |
| **D9** | LibreOffice **replie** les zones de texte `wrap="none"` plus étroites que leur texte ; PowerPoint les laisse déborder. Le titre de la fixture 06 perd sa seconde ligne. **C'est la vraie cause de l'objectif D2 « titre 06 sur une ligne » non atteint** malgré Selawik. | ⬜ **ouvert** — défaut de fidélité réel, indépendant de la police (reproduit avec la vraie Segoe UI). La fixture n'a **pas** été retouchée pour faire passer le test. | non chiffré |
| **D3** | Table des matières Word non recalculée | ✅ **Non corrigeable** — identique chez les concurrents ; **divulgué** en ligne | — |
| **D4** | Feuilles Excel larges découpées sur plusieurs pages | ✅ Comportement par défaut ; **divulgué** en ligne | — |
| **D5** | Graphique Excel rendu différemment des concurrents | ⬜ **ouvert**, gravité inconnue | non chiffré |
| **D7** | Le repli LibreOffice pour `.docx` (actif si `CONVERTAPI_ENABLED` est coupé), et les formats `.doc`, `.xls`, `.ppt`, `.csv`, `.ods`, **n'ont jamais été mesurés** | ⬜ **ouvert** — règle de couverture. **À mesurer avant toute coupure de ConvertAPI**, mêmes fixtures via un Gotenberg de test. | à chiffrer |

## 2 bis — ✅ **D8 / D10 — le plafond de ≈ 4,5 Mo : CODE FAIT, PROUVÉ SUR PRÉVERSION (21 septembre 2026)** — `RAPPORT-office-envoi-morceaux.md`

> **Fait le 21/09, en production (`aed1e753`) :** les routes `convert-to-pdf` (Word, Excel, PowerPoint), `convert-html-to-pdf` (HTML, EPUB, MOBI), `pdf-to-word`, `pdf-repair`, `pdf-to-pdfa` et `ai-transcribe` (audio) passent par l'envoi par morceaux (service : type de job `stage`, billet « serveur » distinct ; fusionné sur `master` en premier). Petits fichiers : le nouveau chemin est plus lent de 1 à 6 s → **l'ancien chemin est gardé jusqu'à 4 Mio** (`OFFICE_STAGED_THRESHOLD_BYTES`).
>
> **✅ 22/09 — plafonds remesurés après correction de deux vraies causes** (`RAPPORT-plafonds-mesures.md`) : ① `API_TIMEOUT` de Gotenberg de production passé de 60 s à 240 s ; ② un vrai défaut trouvé et corrigé — le service de stockage (Railway) s'endormait pendant une longue conversion (veille Serverless) et perdait le job en mémoire, faisant échouer une conversion pourtant réussie (signal de vie ajouté toutes les 45 s, vérifié deux fois sur le fichier qui avait échoué). `image-captioner` corrigé : redimensionnement dans le navigateur avant l'envoi (comme le détourage), plus de plafond base64.
>
> **Plafonds annoncés, avec la nature de chaque limite (⚙️ = architecture actuelle, tombera avec l'unification à venir ; 🔒 = vraie limite, moteur/format/fournisseur, restera) :**
>
> | Outil | Plafond annoncé | Plus gros succès mesuré | Cause de l'échec suivant | Nature |
> |---|---|---|---|---|
> | Word / PowerPoint | **100 Mo** | 148,6 Mio (72-88 s) | mémoire de la fonction Vercel | ⚙️ architecture |
> | Excel | **60 Mo** | 69,8 Mio (247-251 s) | `API_TIMEOUT` Gotenberg (240 s) | 🔒 réelle (moteur) |
> | PDF vers Word | **99 Mo** | 100,3 Mio (204,6 s) | mémoire de la fonction Vercel | ⚙️ architecture |
> | HTML/EPUB/MOBI | **100 Mo** | 149,9 Mio (90,4 s), pas d'échec trouvé | — | non déterminée |
> | PDF Repair / PDF/A | **44 Mo** | 45,4 Mio (22-30 s) | config du service `pdf-tools` (50 Mo) | ⚙️ architecture légère (variable d'env) |
> | Image Captioner | **80 Mo** | 58 Mo / 80 MP (3,4-6,0 s), pas d'échec trouvé | — | corrigé (redimensionnement navigateur) |
> | Audio | **25 Mo** | 24,1 Mio (48,5 s) | limite de Whisper | 🔒 réelle (fournisseur) |
>
> **Concurrence des workers Gotenberg** : au moins 2 conversions lourdes (~250 s chacune) simultanées sans dégrader les autres outils — non éprouvé au-delà.
> **Coût ConvertAPI mesuré, pas de risque à un seul visiteur** : flat 0,01 $/conversion (confirmé 10 à 148 Mio) ; la garde réserve exactement ce montant, donc elle est déjà exacte. Une IP est plafonnée à 1 $/jour (limite par IP partagée, 100/jour). 2000 conversions dans le mois, tous visiteurs confondus, épuisent le plafond global de 20 $ — vrai avant D8 comme après, pas un risque nouveau.
> **Correction après coup (revérifiée en production) :** PDF Repair/PDF/A et PDF vers Word annonçaient d'abord 45 et 100 Mo, pile la taille du fichier de preuve (45,38 et 100,25 Mio) — pas une erreur de fond (un plafond sous un succès prouvé reste valide), mais resserré à **44 et 99 Mo** pour une vraie marge, revérifié avec des fichiers de 40 et 90 Mio.
> **Décision Gotenberg (au propriétaire) :** `gotenberg-fonts` confirmé par les journaux de requêtes comme **ne servant aucune conversion** depuis 3 jours (`gotenberg-v2` sert tout) ; coût mesuré ≈ 0,7-5,7 $/mois selon la charge, pour zéro travail utile. Recommandation : copier ses 8 variables référencées vers `gotenberg-v2` (préalable sans risque), puis le supprimer. Rien fait, décision en attente.
> **`.claude/settings.local.json` nettoyé** : 23 règles trop larges retirées (guillemet fermé avant la fin de la commande, interpréteurs/réseau/Git sans contrainte).


> **C'est le plus gros écart mesuré du projet, et il pèse plus que la fidélité.**

**Mesuré le 19 septembre, fichier à l'appui :** un fichier de **4 412 819 octets passe**, un de **4 517 676 octets est refusé** par Vercel (`FUNCTION_PAYLOAD_TOO_LARGE`). Vaut pour `.xlsx`, `.pptx`, `.docx` et `pdf-to-word`. **Ces routes envoient du multipart brut — pas d'inflation base64**, contrairement au détourage.

- **Le « 25 Mo » n'existe que dans un message d'erreur serveur inatteignable.** Aucune page ne l'affiche.
- ✅ **D10 CORRIGÉ et vérifié en production le 19 septembre** (`RAPPORT-plafonds-declares.md`) : plafond de **4 Mio** annoncé avant la sélection, contrôlé dans le navigateur, message honnête, sur les 4 routes + html/epub/mobi-to-pdf, pdf-repair, pdf-to-pdfa (qui annonçaient 50 Mo), audio-to-text et audio-transcriber (10 Mo), image-captioner (3 Mio, base64). Le plafond lui-même n'est pas relevé (D8 reste ouvert).
- **D10 — ce que voyait le visiteur (avant correction) :** un fichier de 5 à 25 Mo affiche *« Conversion failed. Please try again. »* Il réessaie, ça échoue encore, il part. **C'est un mensonge par omission et un bloquant de lancement.**
- **Écart marché :** **~33×** moins qu'Online2PDF (150 Mo), **~230×** moins que FreeConvert (1 Go). *(Tailles affichées par leurs pages, non éprouvées.)*
- **📌 DÉCISION DU PROPRIÉTAIRE, 20 septembre 2026 : D8 PASSE AVANT LE LANCEMENT.** La règle « jamais inférieur au marché » l'emporte sur le report : ≈ 4,5 Mo contre 1 Go chez les concurrents, c'est ~200× moins, et l'argument du report (1 à 4 jours) est tombé — **le mécanisme d'envoi par morceaux existe et tourne déjà en production pour la vidéo**, le chantier coûte **8 à 12 h**. **Mécanisme :** billet signé émis par Vercel + envoi direct par morceaux vers le service Railway (c'est ce que FreeConvert fait) ; le navigateur dépose le fichier (opération « stage »), la route lit le fichier de serveur à serveur, convertit, redépose le PDF. **À faire dans une session neuve dédiée (hygiène de session), preuve contre un Gotenberg de préversion.** ✅ **Contradiction « 100 Mo » TRANCHÉE le 20 septembre par mesure en production** (route `/api/convert-to-pdf`, fichier `.txt` refusé par l'application avant tout quota) : 1 Mio et 4 Mio passent (400 applicatif), **4 493 821 octets acceptés, 4 493 924 refusés** (`FUNCTION_PAYLOAD_TOO_LARGE`, plafond ≈ 4,5 Mo de corps de requête), et **tout ce qui est plus gros est refusé** (4,4 Mio, 6, 10, 26, 60, 100 Mio). **La note « Vercel accepte 100 Mo » est FAUSSE pour ce projet.** ✅ **Textes corrigés le 20-21/09 :** le commentaire de `app/api/convert-to-pdf/route.ts` (« Vercel Functions accept request bodies up to 100 MB… ») et deux FAQ de catégorie qui annonçaient un plafond faux (`pdf-tools` : « jusqu'à 100 Mo » → 700 Mo/100 Mo navigateur, 4 Mo serveur ; `audio-tools` : « jusqu'à 500 Mo » → aucun plafond fixé côté navigateur, 4 Mo pour Audio to Text). Aucun autre plafond faux trouvé dans les pages, FAQ et métadonnées (recensement par expression régulière sur `page.*` et `layout.*`). ✅ **Seconde correction faite le 21/09 avec les plafonds mesurés (voir ci-dessus et le rapport).**

**Chiffrage (ANTÉRIEUR au 20/09, PÉRIMÉ — le mécanisme retenu coûte 8-12 h, voir ci-dessus ; estimations non vérifiées) :** contrôle côté navigateur + message honnête = **quelques heures**. Envoi via **Vercel Blob** = 1 à 2 jours, risque non mesuré sur la taille du PDF renvoyé. Sortir ces routes de Vercel = 2 à 4 jours.

**Décision prise (19 septembre) :** ① le message honnête et le contrôle avant l'envoi partent **tout de suite** — interdit permanent n° 12, *les plafonds ne se lèvent pas, ils se déclarent* ; ② ~~relever réellement le plafond est un chantier à part, après le lancement~~ — **ANNULÉ le 20 septembre par le propriétaire : D8 passe avant le lancement (voir ci-dessus).**

### Valeurs de production réellement lues — 19 septembre

| Variable | Valeur |
|---|---|
| `USER_QUOTA_PDF_CONVERSIONS` | **5 par mois** — ne concerne que `.docx` et `pdf-to-word` |
| `IP_RATE_LIMIT_PER_HOUR` | **30** |
| `IP_RATE_LIMIT_PER_DAY` | **100** |
| `GLOBAL_SPEND_CAP_USD` | **20** |

> **Correction d'un rapport antérieur :** les valeurs « 10/h et 30/jour » étaient fausses. **`.xlsx`, `.pptx` et les autres formats passant par Gotenberg n'ont ni quota utilisateur ni limite par IP.**

## 3 — ✅ CLOS — Détourage : fournisseur remplacé par un service auto-hébergé

**remove.bg fermait le 1er décembre 2026** et le compte était à zéro crédit. L'API migrait vers Leonardo.Ai : nouvelle clé, crédits variables, débit ÷5, aucun palier gratuit.

**Solution livrée :** service d'inférence **auto-hébergé sur Railway**, modèle **IS-Net general-use** (ONNX, Apache-2.0), filtre « plus grande région connexe », veille Serverless active.

| Preuve | Mesure |
|---|---|
| Qualité vs marché | Dans la **dispersion normale** remove.bg ↔ Pixian sur 4 photos/6 ; le seul décrochage (objet transparent, IoU 0,74) réparé par le filtre → **IoU 0,97** |
| Licences | 2 modèles sur 5 éliminés **sur la licence seule** — AGPL-3.0 et non commerciale |
| Vitesse | 6,7-9,9 s → **1,1-3,7 s** *(le filtre tournait sur le masque pleine résolution au lieu du masque natif 1024×1024)* |
| Réveil après veille | **~4-5 s** |
| Coût | **0,00 $/mois à trafic nul** · ~5-6 $/mois à 500 images · contre **52,35 $ chez Leonardo.Ai** |
| Sécurité | Clé d'API + quota + CORS sur le motif de `services/pdf-tools`, `hmac.compare_digest`. **401 sans clé, prouvé en production.** |
| Coût de quota | `REMOVEBG_PER_IMAGE_DOLLARS` : **0,20 $ → 0,0031 $**. À 0,20 $, cent détourages épuisaient le plafond global de 20 $ et bloquaient les 15 outils IA, ConvertAPI et Adobe. |
| Fichiers 3,3-12 Mo | **Corrigé.** Le navigateur réduit avant l'envoi, le service renvoie le **masque seul**, le navigateur recompose **en pleine résolution** — vérifié jusqu'à **74 mégapixels**. |
| Plafond | **50 Mo**, le plus généreux du marché, **annoncé avant la sélection du fichier** |

**Cinq correctifs issus de la revue indépendante**, dont deux graves : le **cron de santé surveillait l'API remove.bg retirée**, et la **politique de confidentialité et les conditions d'utilisation citaient encore Remove.bg comme sous-traitant** — des documents juridiques qui disaient faux.

## 4 — ✅ CLOS — Plafond de `pdf-translate` déclaré

Motif d'`audio-to-text` reproduit à l'identique, **avant** l'upload (`c6ae956a`).

## 5 — Les outils jamais ouverts — **borné à l'usage**

> **Bornage accepté le 12 septembre : auditer les 30 à 40 outils que le site met lui-même en avant** — **pas les 185.** Commencer par les outils **déjà indexés**, les seuls qu'un visiteur peut atteindre.

**📌 01/10 — P18, balayage des 225 outils pour le téléchargement (`RAPPORT-p18-01-10.md` §3) :** 191 outils font un fichier et l'offrent désormais par **un seul composant** (`app/components/FileDownload.jsx` : nom, format, taille, « Download », « Download all (ZIP) », « Save / Share » iPhone/iPad) ; 34 ne font aucun fichier, listés avec la raison ; **gardé par le build** (`scripts/check-downloads.js`) et par le banc `download-guard.mjs` (24 outils jusqu'au fichier réel, 3 moteurs, iPhone et iPad simulés). Deux outils ne tenaient pas leur nom ou leur promesse de fichier, corrigés : **Video Tools › Video to GIF** (ne faisait aucun GIF) et **Markdown to PDF** (seulement la boîte d'impression).

### ✅ AUDITÉ le 22 septembre 2026 — `docs/audit/RAPPORT-outils-mis-en-avant.md` (verdict et preuve par outil)

**Le vrai nombre (tranché, gardé par le build) : 225 dossiers d'outils, dont 3 « Coming Soon » → 222 outils qui fonctionnent.** Par catégorie : PDF 37 · Image 37 · GIF 11 · Audio 11 · Vidéo 15 · Fichiers 9 · QR 3 · Convertisseurs 4 · Développeur 57 · Maths 6 · IA 15 · Texte 17. 4 slugs existent dans deux catégories (`base64-encoder`, `number-base-converter`, `url-encoder`, `video-to-gif`). Sitemap : 240 URL (6 + 12 + 222). Build : 247 routes. **« 232 » n'existe nulle part** ; le site affichait « 225+ » → corrigé en 222 partout ; `check-tool-links.js` fait échouer le build si un compteur codé en dur diverge. « 190+ Countries » (non mesuré) et « No limits » (faux) retirés. `public/og-image.png` porte encore « 225 » (préparation de lancement, non touché).

**Périmètre : 36 outils** = 6 « Popular Tools » + 36 noms des cartes de catégorie (6 en commun) ; le pied de page n'ajoute rien.

**Résultat :** 13 FONCTIONNE sans réserve · 23 avec un écart de qualité, de couverture ou un défaut visible · **10 rendaient un résultat faux sans le dire — tous corrigés et vérifiés en production** : `image-compressor` (fichier plus lourd livré « compressé », fond noir), `image-converter` (fond noir sans aperçu), `tar-extractor` (en-têtes PAX livrés comme fichiers, dont un sous le vrai nom), `json-formatter` (12345678901234567890 → …7000), `xml-to-json` (0612345678 → 612345678), `number-base-converter` (« 1012 » binaire → 5 ; 2⁶⁴−1 faux), `unit-converter` (1 mm = « 0.0000 » mile), `percentage-calculator` (« 0.00 »), `roman-numeral-converter` (« IM » → 999), `currency-converter` (heure du navigateur affichée comme date des taux).

**Écarts mesurés contre le marché, même fichier :** `pdf-compress` −17,6 % / −0,1 % contre iLovePDF −35 % / −15,4 % ; `image-compressor` ~28 % plus lourd qu'iLoveIMG à PSNR égal ; `image-upscaler` netteté 1,27 contre 3,46 (iLoveIMG IA), sous un bicubique, rangé dans « AI Tools » sans IA ; `mp4-to-gif` écrase les vidéos verticales ; `video-to-gif` 18 Mo pour 3 s ; `image-resizer` sans verrou de proportions ; Opus cassé dans `audio-converter`.

**✅ 29/09 — audit « résultats faux sans avertissement » des outils JAMAIS audités (branche `qualite-29-09`, NON déployée — `docs/audit/RAPPORT-qualite-29-09.md` §1, tableau par outil).** Méthode : cas limites réalistes (grands nombres, zéros en tête, Unicode/émoji, guillemets, CRLF, BOM, entrées invalides) comparés à un oracle (bibliothèque de référence, spécification ou valeur exacte) ; tests ajoutés (`scripts/converter-tests/01` à `10`, banc navigateur `scripts/browser-tests/qualite-29-09.mjs`). **106 outils audités : 84 corrigés — 68 rendaient un résultat faux sans le dire, 16 étaient sous le marché, annonçaient une capacité absente ou échouaient avec un message obscur — et 22 lus sans défaut** (liste et preuve de chacun dans le rapport). Les plus graves : **10 outils PDF** (merge, split, compress, rotate, delete/reorder/number pages, watermark, protect, éditeur) rendaient un **PDF cassé** à partir d'un PDF chiffré qui s'ouvre sans mot de passe (relevés bancaires) ; les **3 minifieurs JavaScript** cassaient le code sans point-virgule ; **Excel to CSV/JSON** changeaient les émojis en caractère invisible (fichiers pandas/openpyxl) et Excel to JSON sortait les dates en nombres de série ; **File/Text Encryptor** : XOR, mot de passe faux = fichier corrompu sans erreur → AES-256-GCM ; **Text to PDF** refusait tout .txt Windows ; **PDF Extract Text** mettait chaque page sur une ligne ; **SVG to PNG** et **PNG to ICO** étiraient les images non carrées ; **File Converter** écrivait un CSV sans guillemets et un HTML non échappé ; **Image Metadata** annonçait l'EXIF sans le lire ; **sous Safari, Brightness/Contrast et Image Blur rendaient l'image inchangée** (pas de `ctx.filter`) et Video Filter la vidéo sans filtre ; **JPG/Image to PDF et PDF Editor couchaient les photos portrait de téléphone** (orientation EXIF) ; GIF to APNG trouait les GIF optimisés ; Audio Equalizer écrêtait ; **PNG/WebP to JPG** : transparence noire ; JSON Minifier/YAML/CSV/XML arrondissaient les entiers 64 bits ; TypeScript to JS supprimait `: 1` des objets ; SCSS to CSS ne compilait rien ; Lorem Ipsum « 5 phrases » = 5 paragraphes ; Text Sorter, Character Counter, Duplicate Remover, Statistics (valeurs ignorées), Scientific (1/3e12 = « 0 »), Fraction, Timestamp (ms lues en s), cron (« validate » sans validation).
**✅ 29/09 (audit n° 2) — les outils restants de la liste ci-dessus ont été audités (branche locale `qualite-2-29-09`, NON poussée, NON déployée → P14 ; `docs/audit/RAPPORT-qualite-2-29-09.md`, tableau par outil).** Même méthode, défaut reproduit sur le build d'avant chaque correction. **76 outils audités, 57 corrigés, dont 30 rendaient un résultat faux ou incomplet sans avertissement** — entre autres : PDF Redact laissait dans le fichier une phrase coupée par un changement de police ou un retour à la ligne ; PDF Crop rognait depuis (0,0) de la MediaBox ; PDF Unlock / Organize perdaient formulaires et signets ; PDF Forms effaçait les valeurs existantes ; PDF Sign posait un rectangle gris opaque et déformait la signature ; MOBI to EPUB livrait des EPUB aux images et styles introuvables ; GIF to MP4 écourtait la dernière image ; APNG/Image to GIF noircissaient la transparence ; Video Rotator/Filter/Resizer coupaient la fin après une pause ; Audio Waveform ne dessinait que le canal gauche, à l'envers ; AI Chatbot envoyait chaque message sans la conversation. **1 faille** corrigée (Markdown to PDF exécutait le HTML du fichier sur l'origine du site). Couverture comblée face aux concurrents : PDF OCR interrogeable, limiteur d'Audio Booster, WebVTT, choix de page/coin pour la signature, format d'origine gardé par 13 filtres image, vue des différences d'Image Comparison, doublons perceptifs. Tests : `scripts/browser-tests/{image,gif,pdf,av,misc}-audit-2.mjs` (76 contrôles ; 3 moteurs, voir le rapport) et `scripts/converter-tests/12` à `14`.

**✅ 30/09 — appels payants faits sur www (≈ 0,04 $ au total, plafond 2 $ ; `docs/audit/RAPPORT-safari-iphone-30-09.md` §Partie 3)** : PDF AI Summary résume dans la langue du document (fr, es) ; AI Chatbot garde le contexte sur 3 messages ; Audio Transcriber 42/42 mots, **export SRT et VTT ajouté** (`10d3fe9f`) ; Image Generator OK ; **AI Detector FAUX** (« 70 % humain » pour un texte d'IA, en anglais et en français) → **refait selon RAIDAR (ICLR 2024)** avec seuils mesurés sur 20 textes (aucun texte humain dit IA ; 4/9 IA reconnus, 4 sans verdict, 1 manqué ; la page l'affiche) (`058ef5af`, local → P15). **✅ 30/09 — écarts fermés en local (→ P15)** : Organize garde les signets (`d713c20d`), Sign avec placement libre glisser/redimensionner (`ab0d0f75`), Text to PDF en grec, cyrillique, arabe, hébreu, hindi, tamoul, thaï, CJK… (`fdf4842c` ; bengali refusé proprement, emoji refusés par leur nom).

**🔴 30/09 (nuit) — AI Detector au niveau des concurrents : DÉCISION = API Pangram, 💶 COÛT À NOTIFIER, RIEN SOUSCRIT** (`docs/audit/RAPPORT-ai-detector-30-09.md`, branche locale `ai-detector-30-09`, non poussée). **Constat majeur : l'outil en production a dit « IA » d'un texte humain** (résumé arXiv LIGO 2016, similarité RAIDAR 0,905 ≥ 0,90) — cause : RAIDAR mesure combien un modèle veut réécrire, et un texte célèbre, très relu, à 15 % de formules intouchables est à peine réécrit ; seuils de la veille fixés sur 20 textes sans résumé scientifique. Corpus de 97 textes (57 humains d'avant 2022 en/fr/de/es/it, 40 d'IA de claude-opus-5-5, sonnet-5, haiku-4-5, fable-5-1, gpt-4o-mini). **Aucune méthode gratuite ne tient la règle** : notre outil (37 textes mesurés sur www avant la limite) 1/19 humain dit IA, 9/18 IA reconnues ; classifieurs ouverts tmr/desklib 6/57 humains dits IA, fakespot 21/57 ; Binoculars/Fast-DetectGPT (Qwen2.5) AUROC ≈ 0,6. Concurrents non mesurables (compte obligatoire pour les six) ; études indépendantes : Pangram ≈ 0 faux positif, 96-98 % d'IA reconnues (Chicago Booth 2025). **Coût Pangram (0,05 $/100 mots) : ≈ 15 $ / 150 $ / 1 500 $ par mois pour 100 / 1 000 / 10 000 analyses de 300 mots** ; ⚠️ le plafond global de 20 $/mois l'arrêterait vers ≈ 130 analyses. **À toi :** compte Pangram + `PANGRAM_API_KEY` dans Vercel, puis demander la mise en service. **Prêt hors service :** `lib/ai/pangram.js`, route `/api/ai-detect` (503 + alerte sans clé), tests 6/6 ; la page n'y est pas reliée. **Palliatif gratuit fait en local :** seuil IA 0,93 (plus aucun humain dit IA sur les 37, mais 5/18 IA reconnues), textes de précision de la page mis à jour, bancs 4/4 ×3 moteurs — à déployer à ta demande. Reste : finir la mesure RAIDAR en local (la clé OpenAI de `.env.local` est vide ; script `raidar-local.mjs` prêt) ; supprimer la ligne `error_alert:ai-detect` écrite par erreur dans `usage_counters` (rapport §5).

**✅ P17 (30/09) — AI Detector PAR PANGRAM, EN PRODUCTION (`5969cdb1`)** (`docs/audit/RAPPORT-p17-30-09.md` §1). Budget **propre** de 50 $/mois (`lib/quota/aiDetect.js`, clé `aidetect_spend_micros`), **hors** plafond global de 20 $ (le détecteur n'y réserve plus rien) ; **2 000 mots gratuits/jour par visiteur**, sans compte (= l'offre gratuite de Pangram ; GPTZero 10 000/mois, Originality 3 analyses/jour), IPv6 par /64 ; comptage de mots prudent (espaces invisibles, tirets, écritures sans espaces) ; réviseur indépendant : 4 défauts d'argent trouvés et corrigés. **Corpus de 97 textes mesuré par la route du site sur la préversion : 0/57 humain dit IA (résumé LIGO 2016 : humain, 0 % d'IA), 40/40 IA reconnues, 100 % de verdicts, 5 langues, 5 modèles** (production avant P17 : 1/19 humain dit IA, 9/18 IA reconnues). Dépense Pangram ≈ 9,40 $ (borne haute 9,45 $), **crédits restants ≈ 15,60 $** (à confirmer dans le tableau de bord Pangram). **Reste : vérification LIGO + texte d'IA sur www** (`node scripts/ai-detector/www-check-p17.mjs`, ≈ 0,25 $) — refusée le 30/09 par la limite de 2 000 mots de l'adresse, déjà consommée par la mesure du corpus (preuve réelle du refus par visiteur, message clair) : à refaire après minuit UTC. **Le bloquant 5 est clos pour l'AI Detector** sous réserve de cette vérification.

**Restent à faire (plus tard)** : **Safari réel** (P1) — PDF Sign au doigt, PDF Forms, PDF OCR interrogeable, impression de Markdown to PDF, Screen Recorder, Video Rotator/Filter/Resizer (pause), Audio Waveform ; **écarts de couverture connus** — ✅ **fermés le 30/09 en local (`prelancement-01-10`, → étape 1 du tableau « Reste avant Product Hunt »)** : PDF Sign accepte une signature **tapée** (police manuscrite Dancing Script, OFL) ou **importée** (PNG/JPG/WebP, papier blanc retiré), comme iLovePDF et Smallpdf ; Password Generator garantit un caractère de chaque famille choisie (comme Bitwarden et 1Password), tirage sans biais ; URL Decoder lit « + » comme une espace (case cochée par défaut, comme `urldecode` de PHP ; notre encodeur n'écrit jamais de « + » brut) ; Sticky Notes ignore une note mal formée au lieu de planter (défaut latent du bloquant 11). ⏸️ **SCIEMMENT REPORTÉ : Text to PDF en bengali (conjointes) et en emoji** — il faut un moteur de mise en forme des écritures complexes (HarfBuzz) dans le navigateur ; refus déjà propre et nommé ; aucune demande mesurée ; après le lancement.

**📌 23/09 — les 17 améliorations chiffrées, inscrites ici avec leur coût** (`RAPPORT-ecarts-marche.md` pour 1-6, `RAPPORT-outils-mis-en-avant.md` §4 pour 7-17 ; estimations = estimations). Les six premières sont **faites et vérifiées en production le 23/09** ; les onze autres restent des **bloquants de qualité ouverts** — aucune ne se perd.

| # | Outil | Écart mesuré | Proposition | Coût | État |
|---|---|---|---|---|---|
| 1 | pdf-compress | −17,6 % / −0,1 % contre iLovePDF −35 % / −15,4 % | Optimisation en place (pikepdf + `tx` d'Adobe) sur `pdf-tools`, 3 niveaux, jusqu'à 200 Mo | ~10 h fait · 0 $ fixe | ✅ **fait** — sans perte −35,4 % (rendu identique), recommandé −40,6 %, extrême −43,0 % / −78,8 % |
| 2 | image-compressor | ~28 % plus lourd qu'iLoveIMG ; JPEG forcé | MozJPEG + palette PNG + WebP dans le navigateur, lot + ZIP | ~6 h fait · 0 $ | ✅ **fait** — égal ou mieux sur les 4 fichiers |
| 3 | video-to-gif, mp4-to-gif (+ mov/avi/webm-to-gif) | 18 Mo pour 3 s ; vidéo verticale écrasée | Service ffmpeg : début, durée, largeur, i/s | ~3 h fait · ≈ 0 $ | ✅ **fait** — proportions gardées, 5 outils |
| 4 | image-upscaler | netteté 1,27 contre 3,46 ; « IA » sans IA | Modèle MoSR 4xNomos2_hq auto-hébergé | ~8 h fait · ≈ 0,002 $/image de 1 Mpx | ✅ **fait** — LPIPS 0,107 contre 0,164 chez iLoveIMG |
| 5 | image-resizer | déformation ; PNG forcé (×5,2) | Verrou de proportions, %, format conservé | ~1 h fait | ✅ **fait** |
| 6 | audio-converter | Opus cassé | Opus via le service (libopus) ; encodeur natif ailleurs | ~2 h fait | ✅ **fait** |
| 7 | pdf-split | ni « chaque page », ni « toutes les N pages », ni ZIP | Ces modes + ZIP | 3-4 h | ✅ **production 23/09** — modes gratuits d'iLovePDF + ZIP ; plages invalides refusées au lieu d'un PDF vide |
| 8 | text-reverser / case-converter / word-counter | emoji cassés ; Sentence case faux ; phrases mal comptées | `Intl.Segmenter`, casse par phrase | 2-3 h (les trois) | ✅ **production 23/09** — 18 mots / 6 phrases là où wordcounter.net compte 13 / 5 |
| 9 | hash-generator | ni MD5 ni fichiers | MD5, SHA-384, CRC32, fichiers en Worker | 2-3 h | ✅ **production 24/09** (`44ae126c`) — moyen de la référence (html-code-generator : Web Crypto ≤ 700 Mio + hash-wasm en flux) repris, puis dépassé : 17 algorithmes contre 9, HMAC, vérification d'un hash attendu, `checksums.txt` vérifié par `sha256sum -c`, algorithmes répartis sur 4 Workers. **Même fichier, 5 algorithmes (nous / réf.) :** Chromium 3 Mo 0,2/0,4 s · 300 Mio 4,0/5,0 s · 760 Mio 11,7/31,8 s (www) ; Firefox 0,4/0,4 · 9,0/14,6 · 66,7/104,3 s. 5 Gio : 52 s, SHA-256 exact. Chaque algorithme contrôlé contre une implémentation indépendante (OpenSSL, blake3, xxhash, crc32c) |
| 10 | currency-converter | 24 devises / 166 ; API v4 dépréciée | Toutes les devises, source durable (à vérifier en direct) | 1-2 h | ✅ **production 23/09** — 166 devises (open.er-api v6), écart BCE 0,055 % |
| 11 | qr-generator | 400 px, ni couleurs, ni logo, ni types | 2000 px, couleurs, correction, Wi-Fi/vCard | 3-4 h | ✅ **production 24/09** (`eb4e67a9`) — 8 types, 2000 px, logo, PDF ; chaque code relu par jsQR avant d'être proposé (QRCode Monkey ne le fait pas) ; 11/11 Chromium + Firefox sur préversion puis sur www |
| 12 | image-converter | 4 sorties | BMP, GIF, ICO, TIFF, PDF | 3-4 h | ✅ **production 24/09** (`eb4e67a9`) — 5 sorties ajoutées (celles de CloudConvert/Convertio) ; GIF 30 Mpx en 3,9 s ; 8/8 Chromium + Firefox sur préversion puis sur www. GIF face à CloudConvert : non mesuré |
| 13 | grammar-fixer | pas de surlignage | Diff mot à mot | 2-3 h | ✅ **production 26/09** (`98a32e95`, `docs/audit/RAPPORT-mise-en-production-26-09.md`) —  — changements montrés mot à mot en place, chacun défait/rétabli d'un clic (moyen de LanguageTool) ; tout garder = la correction, tout défaire = l'original, à l'octet près ; suites Chromium 11/11, Firefox 10/10 (IA jouée par le test). Qualité de la correction face à LanguageTool non mesurée (IA non appelée en local). |
| 14 | barcode-generator | 5 symbologies | ITF-14, Codabar, MSI ; DataMatrix, PDF417 | 2-4 h | ✅ **production 26/09** (`98a32e95`, `docs/audit/RAPPORT-mise-en-production-26-09.md`) —  — 37 types relus par zxing-cpp avant téléchargement ; face à barcode-maker.com et barqode.io sur 17 codes : nous 102/102 fichiers lus, barcode-maker 65/68 et 34 « JPG/GIF » qui sont des PNG, barqode 10 types, EAN-13 à 321 % en PDF. Moyens des références adoptés quand on était en dessous : lot en Workers (1000 EAN-13 : 4,9-5,6 s contre 7,7-8,7 s Chromium, chacun relu), planches d'étiquettes à taille réelle, add-ons EAN-5/2, texte libre, CSV. Suites 67/67 Chromium + Firefox. **À faire au retour du propriétaire : préversion, puis production.** |
| 15 | zip-extractor | ZIP seul | RAR/7z/ZIP chiffré, découpé, 40+ formats, « tout télécharger » | 4-6 h | ✅ **production 26/09** (`a3e2cf56`, `docs/audit/RAPPORT-amelioration-15.md`) — 7-Zip 24.09 WASM + zip.js, liste puis extraction à la demande. Même RAR de 1,99 Go face à ezyZip, www, Chromium : premier fichier **médiane 5,1 s contre 7,25 s** (10 paires, 8 gagnées) ; tout extraire dans un dossier **9,2-11,8 s contre 31,0-32,6 s**. Firefox : 3,71 Gio téléchargés sans plantage (figé à 2,8 Gio avant) ; ezyZip n'y ouvrait aucun RAR le 26/09 (404 sur son serveur). Plafond par fichier **1,9 Go**, mesuré (plus bas réel ≈ 1,96 Go). Reste : « all as ZIP » plafonné à 1,9 Go sous Firefox/Safari |
| 16 | unit-converter / color-converter | catégories / espaces manquants | Temps, données, pression, énergie ; HSV, CMYK | 3-4 h + 1-2 h | ✅ **production 26/09** (`98a32e95`, `docs/audit/RAPPORT-mise-en-production-26-09.md`) —  — 11 catégories (+ Temps, Données, Pression, Énergie, Puissance), facteurs = définitions NIST ; face à unitconverters.net sur 11 conversions : moins précis à 10 chiffres sur 6 → 12 chiffres, au moins aussi exacts partout (eux : mmHg à 133,322, année 365,25) ; saisie invalide refusée. Couleurs : HSV, CMYK (= RapidTables 7/7), HEX invalide signalé. Suites 30/30 Chromium + Firefox. |
| 17 | gif-maker, qr-scanner, audio-trimmer | options | Ajuster au lieu d'étirer ; caméra ; dixième de seconde + fondus | 2-3 h chacun | ✅ **production 26/09** (`98a32e95`, `docs/audit/RAPPORT-mise-en-production-26-09.md`) —  — GIF : ajuster/rogner/étirer, taille « la plus grande » par défaut (moyen d'ezgif, mesuré), ordre, boucles ; QR : caméra, dépôt (annoncé mais absent) et collage ; découpe audio au dixième, fondus, coupe à l'échantillon sans perte pour WAV/AIFF/FLAC 16 bits (copie WAV : ±37 ms avant). Suites Chromium 20/20, Firefox 18/18. |

> **Amélioration 15 — terminée le 26/09**, en production et vérifiée sur www (Chromium + Firefox). Détail, mesures et limites restantes : `docs/audit/RAPPORT-amelioration-15.md`. Banc : `scripts/browser-tests/archive-fixtures.mjs` et `make-big-rar.mjs` (fichiers d'essai), `zip-extractor.mjs` (suite), `-cap.mjs`, `-huge.mjs`, `-vs-ezyzip.mjs` ; préversions protégées : `node --env-file=.env.local` après `vercel link` (`vercel-preview-auth.mjs`, et `vercel-preview-proxy.mjs` pour Firefox). **Prochaines (non commencées, à la demande du propriétaire) : 13, 14, 16, 17, et l'Opus des trois outils audio.**
>
> **✅ 26/09 (soir, propriétaire présent) — 14, 16, 13, 17 et l'Opus des trois outils audio MIS EN PRODUCTION** (`docs/audit/RAPPORT-mise-en-production-26-09.md`) : service `kbps` d'abord (master `95e7125f`, Railway), préversion vérifiée Chromium + Firefox (suites + Opus de bout en bout avec le vrai service + IA de grammaire 25/25 contre 15/25 pour LanguageTool + vrai collage QR), fusion `98a32e95`, vérification sur www dans le rapport. L'état de reprise ci-dessous est **périmé**.
>
> **✅ 26/09 (nuit) — Audio Merger : choix du format de sortie + jonction exacte, EN PRODUCTION** (`d4f4b12c`, `docs/audit/RAPPORT-audio-merger-format-sortie.md`). Mesuré avant : la « copie sans réencodage » était fausse pour 5 cas sur 7 (FLAC lu 5 s sur 12 dans les deux navigateurs, silences de 18-40 ms MP3/AAC, Opus faussé aux jonctions). Désormais : 14 formats (Clideo en livre 14 sur 16 annoncés), débit au choix, sans perte par défaut quand toutes les entrées le sont, Opus par libopus sur le service. ~~Reste face au marché : réordonner les fichiers et le fondu enchaîné~~ → **✅ fait le 26/09 (nuit), en production `c60c0167`** (`docs/audit/RAPPORT-audio-merger-ordre-fondu.md`) : glisser-déposer + flèches, ajout en plusieurs fois ; fondu **désactivé par défaut** (Clideo et onlineconverter aussi ; 123apps l'impose, 1,5-3 s, sans réglage), 0,1-10 s, puissance constante ou linéaire, avec ou sans chevauchement, jonction par jonction, fondus de début et de fin, durée annoncée = durée obtenue à l'échantillon. Corrigé en route : la barre de progression d'Audio Merger restait figée en production.
>
> **🔖 ÉTAT DE REPRISE — 26/09 au soir (propriétaire absent ; consigne : aucun déploiement, local seulement).** Branche `licence-ameliorations`, dernier commit poussé = celui qui contient cette note ; **master (production) inchangé sur `a3e2cf56`** ; aucune fusion, aucune préversion ouverte ni testée, aucune mise en production.
> - **14 barcode-generator — prête pour la préversion** (`RAPPORT-amelioration-14.md`, suites 67/67 Chromium + Firefox). Reste : préversion, suites + `barcode-generator-vs-references.mjs` dessus, production, vérification sur www.
> - **16 unit-converter / color-converter — prête pour la préversion** (`RAPPORT-amelioration-16.md`, `unit-color-converter.mjs` 30/30 + 30/30).
> - **Opus des trois outils audio — code prêt, en attente d'accord** (`RAPPORT-opus-trois-outils-audio.md`). ❓ **Question : mettre en ligne d'abord le service Railway (paramètre `kbps`, additif, via master seul : `ffmpeg_ops.py` + tests), lancer `run_tests.py` sur le service, puis le site ?** Booster et Splitter n'en dépendent pas ; le Compressor si. Corrige aussi, dans Audio Converter en production, les « .opus » enregistrés « .ogg » sous Firefox.
> - **13 grammar-fixer — prête pour la préversion** (`RAPPORT-amelioration-13.md`, 11/11 + 10/10). La qualité de correction face à LanguageTool reste à mesurer avec l'IA réelle (préversion).
> - **17 gif-maker / qr-scanner / audio-trimmer — prête pour la préversion** (`RAPPORT-amelioration-17.md`, 20/20 + 18/18).
> - ⚠️ **Préversions automatiques** : chaque push qui touche du code déclenche une build de préversion Vercel (`ignoreCommand` ne saute que docs/ et .md) — le premier push (`4a7a5613`) est parti avant la consigne ; les suivants ont été faits parce que demandés. Aucune n'a été ouverte ni testée.
> - Laissés tels quels : `.serena/` (non suivi), `next-env.d.ts` (régénéré par Next). Serveurs locaux et tâches de fond arrêtés. La build locale `.next` est une build normale (sans URL de service de test).
> - Ordre suggéré au retour : préversion unique de la branche (14, 16, 13, 17 + pages audio) → suites sur la préversion (accès protégé : à convenir, sans `vercel link` ni fichier d'environnement) → décision sur le service Opus → production.
>
> **✅ 28/09 (nuit), en local, NON déployé (`6a760fce`) — « Download all as ZIP » au-delà de 1,9 Go sous Firefox et Safari : fait par l'idée ci-dessous (service worker limité à `/zipdl/`, page → worker par un MessagePort, un morceau à la fois).** Référence d'abord : **ezyZip n'offre « Save All » que sous Chrome/Edge**, et rien d'autre que les fichiers un par un sous Firefox/Safari (sa page le dit) — nous étions déjà au-dessus jusqu'à 1,9 Go, nous le sommes maintenant sans plafond total. **Mesuré :** ZIP de 2,2 Go (deux fichiers de 1,1 Go + un petit), rouvert par `tar.exe`, **octets identiques** : Firefox 67-70 s, WebKit de Playwright 25 s ; avant : refus. Sous 1,9 Go, le chemin en mémoire éprouvé est gardé ; suites `zip-extractor.mjs` Firefox, Chromium, WebKit sans régression. **Reste : le vrai Safari** (feuille, n° 1). *(Ancien énoncé :)* — « Download all as ZIP » sous Firefox et Safari plafonné à 1,9 Go. Ces navigateurs n'ont pas `showSaveFilePicker` : le ZIP est construit en entier en mémoire (Blob), d'où le plafond (`ZIP_IN_MEMORY_MAX`, `config.js`) ; au-delà, l'outil dit de télécharger les fichiers un par un (« Save all to a folder » n'y existe pas non plus). **Idée :** téléchargement en flux par Service Worker (technique de StreamSaver.js) — la page envoie les morceaux du ZIP (client-zip) au Service Worker, qui les sert comme une réponse `Content-Disposition: attachment` ; le ZIP n'est alors jamais tenu en mémoire. À mesurer sous Firefox et Safari réel avant d'annoncer quoi que ce soit ; ezyZip ne peut pas servir de référence sous Firefox au 26/09 (ses RAR n'y s'ouvrent pas).

**Trouvé en route le 23/09, à traiter (chiffré dans `RAPPORT-ecarts-marche.md` §8) :** ① le service de détourage fait tourner onnxruntime sur les **48 cœurs de l'hôte** au lieu de ses 8 vCPU (même cause qui rendait l'agrandisseur 6× trop lent) — à mesurer avant de toucher (réglage déjà validé autrement le 14/09) ; ② SVG absent de `image-compressor` (iLoveIMG le compresse) ; ③ Opus des trois autres outils audio : encodeur natif de ffmpeg, **qualité face à libopus non prouvée** — ✅ **tranché le 24/09 : INFÉRIEUR.** ViSQOL (23/09) le donnait au-dessus ; une seconde métrique indépendante, **Zimtohrli** (Google, Apache-2.0, modèle psychoacoustique distinct), sur les mêmes fichiers à taille égale, donne **libopus plus proche de la source 6 fois sur 6** (MOS 64k : 4,60 contre 4,72 instrumental, 4,69 contre 4,72 chanté ; écart qui se resserre à 128k), comme le dit la documentation de ffmpeg. ViSQOL récompense la fidélité de forme d'onde, pas la perception. **Correctif connu, à faire : encoder l'Opus d'Audio Booster, Audio Splitter et Audio Compressor sur le service (libopus), comme Audio Converter** (`scripts/browser-tests/opus-zimtohrli.py`) — 🟡 **code prêt le 26/09, NON déployé** (`docs/audit/RAPPORT-opus-trois-outils-audio.md`) : FLAC rendu dans le navigateur puis libopus sur le service ; paramètre `kbps` ajouté au service pour le Compressor ; défaut Firefox trouvé (« .opus » enregistré « .ogg », touchait aussi Audio Converter en production) corrigé. ~~❓ QUESTION AU PROPRIÉTAIRE : accord pour mettre d'abord en ligne le service…~~ ✅ **fait le 26/09 (service `95e7125f`, site `98a32e95`)** ; ④ licence du modèle de l'agrandisseur écrite « CC-BY-0.4 » par son auteur (coquille, voir rapport) — confirmation écrite recommandée.

## 6 — ✅ Architecture vidéo — **DÉPLOYÉE et PROUVÉE EN PRODUCTION le 20 septembre 2026** (`docs/audit/RAPPORT-video-architecture.md`, `docs/audit/RAPPORT-video-deploiement.md`)

**Décision : service ffmpeg auto-hébergé sur Railway** (modèle de `background-removal`), branché sur `video-compressor` et `video-converter` ; `video-trimmer` **reste dans le navigateur** (ffmpeg.wasm, coupe sans ré-encodage).

**Déploiement (fait par l'agent avec la CLI/API Railway, secret posé par le propriétaire)** : service `media-processing` dans `fortunate-manifestation` / `production`, Root Directory `services/media-processing`, Watch Paths `/services/media-processing/**`, healthcheck `/health`, veille Serverless, 1 réplica, domaine `media-processing-production-d2f4.up.railway.app`. `/health` 200 ; `POST /v1/jobs` sans billet → **401** (le service exécute bien le nouveau code). `MEDIA_TICKET_SECRET` : Railway + Vercel Production + Vercel Preview (Sensitive). Interrupteur `NEXT_PUBLIC_MEDIA_SERVICE_URL` posé en Preview puis Production ; production `dpl_2YUPUH3a`, commit `f0d5faeb`. Origine de préversion ajoutée à `ALLOWED_ORIGINS` le temps du test puis **retirée et prouvée** (plus d'en-tête CORS pour elle). Retour arrière : retirer `NEXT_PUBLIC_MEDIA_SERVICE_URL` et redéployer (un redéploiement sans diff de code est annulé par l'`ignoreCommand` : passer par un commit de code).

**Prouvé** (Chromium en Preview ET en production, Firefox en Preview ; vraies pages, vrai service, fichiers rouverts par ffmpeg : durées exactes, 0 erreur de décodage) : progression réelle affichée (12 à 90 valeurs distinctes), file d'attente visible, annulation. Réveil après veille : **+1,05 s** en HTTP direct (1,23 s contre 0,17 s), **+2,6 s** vu de la page (« Preparing… » affiché). **Non prouvé : Safari réel / iPhone, WebKit de Playwright** (bloquant 9) ; plafond de 1 Go jamais éprouvé avec un fichier de 1 Go (essais réels jusqu'à 72 Mo en production). Mesures faites depuis une connexion de bureau rapide.

### 🔬 Chantier qualité du 20-21 septembre 2026 (`docs/audit/RAPPORT-video-qualite.md`)

**Le premier tableau du marché comparait des sorties de qualité inégale — il est remplacé par celui-ci** (temps total perçu, téléversement compris · taille · qualité **mesurée** = VMAF moyen contre la source, la source valant 100 ; protocole : les deux flux normalisés à cadence constante avant comparaison, car les horodatages WebM en millisecondes désalignent ~3 % des images et faussaient tous les VMAF WebM d'environ 15 points — **les chiffres VMAF publiés plus tôt le 20/09 étaient faux et sont retirés**). Vidéo de référence 1 : 30 s, 1080p, 21,7 Mo, séquence à main levée en sous-bois (contenu très difficile). Vidéo 2 : 3 min, 720p, 71,8 Mo.

| MP4 → WebM, 30 s | Temps | Taille | VMAF |
|---|---|---|---|
| **Nous** (production, 21/09) | **83,7 s** | **18,8 Mo** | **91,9** |
| Online-Convert | ≈ 100 s | 9,9 Mo | 82,3 |
| FreeConvert | 203 s | 44,1 Mo | 98,9 |
| Convertio | 251 s | 117,5 Mo | 99,98 |
| Zamzar | non fini à 400 s | — | — |

| MP4 → WebM, 3 min | Temps | Taille | VMAF |
|---|---|---|---|
| **Nous** | **147,0 s** | **52,2 Mo** | **93,5** |
| FreeConvert | 223 s | 56,9 Mo | 94,6 |
| Online-Convert | non fini à 500 s | — | — |

**Conclusion franche.** *Vitesse* : plus rapides chez tous les concurrents mesurés (WebM 30 s : 2,4× FreeConvert, 1,2× Online-Convert ; 3 min : 1,5× FreeConvert) — mais **moins qu'avant** : nous avons volontairement dépensé du temps pour la qualité (première version : 18 s, à qualité inférieure). *Qualité à taille égale* : **équivalents à ± 1 VMAF** — 30 s : nous sommes environ 2 points au-dessus de la droite Online-Convert ↔ FreeConvert à 18,8 Mo (interpolation, indicative) ; 3 min : 0,5 à 1 point sous FreeConvert pour 8 % de fichier en moins. **Ce que nous ne faisons pas, volontairement :** produire un fichier plus lourd que la source (FreeConvert : 44 Mo pour une source de 21,7 Mo, VMAF 98,9) — règle du propriétaire ; à 42,6 Mo notre mode lent mesure 98,4. **Non mesuré chez les concurrents :** MP4, H.265, AV1 et le compresseur (aucun temps ni qualité concurrents pour ces sorties) — ne pas écrire « meilleur que le marché » pour eux.

Nos autres sorties, mêmes conditions (production) : **30 s** — MP4 37,0 s · 19,4 Mo · VMAF 94,5 ; H.265 20,3 s · 18,0 Mo · 90,0 ; AV1 19,4 s · 18,1 Mo · 93,7 ; compresseur (équilibré) 15,8 s · 13,5 Mo · 88,4. **3 min** — MP4 36,6 s · 61,0 Mo · 94,7 ; H.265 58,7 s · 29,8 Mo · 84,9 ; AV1 29,0 s · 36,4 Mo · 89,5 ; compresseur 34,6 s · 30,9 Mo · 82,2.

**Réglages d'encodage corrigés (tout est mesuré, rien n'est supposé) :** ① VP9 rapide (`realtime`) ≈ 1 à 2 points sous les concurrents à taille égale → mode lent (`good`, cpu-used 5) jusqu'à 90 « secondes 1080p » : +2 VMAF à taille égale, ~6× le temps ; ② x264 `veryfast` → `faster` : ~23 % de fichier en moins à qualité égale, ~2× le temps ; niveaux du compresseur recalés (27/30/34) ; ③ **règle « jamais plus lourd que la source » : un plafond de débit (VBV/maxrate) a été essayé puis REJETÉ par la mesure** — il affame les premières secondes complexes (5 % des images sous VMAF 60, minimum 15 sur 3 min) ; remplacé par une **échelle de réencodage adaptative** (CRF calculé d'après l'écart mesuré ou projeté, 3 essais au plus, essai abandonné dès 12 % si la projection dépasse 125 % de la source) ; si tout échoue, le fichier est livré et signalé (`larger`) ; ④ **compresseur : jamais un fichier plus gros, dit honnêtement** — niveau supérieur essayé une fois, sinon le service ne renvoie aucun fichier (`notSmaller`, HTTP 410) et la page explique que la vidéo est déjà bien compressée (testé : source déjà très compressée, 320×180). Exception documentée : la famille MPEG-2 (MPG, MPEG, VOB), dont l'encodeur ne peut pas descendre sous ~+0,3 à +2,2 % de la source sur ce contenu difficile.

**Couverture de formats : 34 sorties (avant : 19)** — vidéo (22) : MP4 H.264, **H.265/HEVC**, **AV1**, MOV, MKV, WebM, AVI, **AVI XviD**, WMV, **ASF**, FLV, **F4V**, MPG, **MPEG**, **VOB**, TS, **M2TS**, **MTS/AVCHD**, 3GP, **3G2**, M4V, OGV ; image : GIF animé ; audio (11) : MP3, M4A, **AAC**, WAV, **AIFF**, OGG, Opus, FLAC, **WMA**, **AC3**, **AMR** (en gras : ajoutés). Listes annoncées par les concurrents (non éprouvées) : Convertio 37 sorties vidéo dont HEVC et AV1 · CloudConvert 28 · Online-Convert 11 (ni HEVC ni AV1) · FreeConvert 60+ formats en entrée. **Hors de portée, avec la raison :** RM/RMVB (aucun encodeur RealMedia dans ffmpeg), MXF (profils stricts, aucune demande courante), DV (résolution fixe SD), CAVS, WTV/DVR (conteneurs d'enregistrement TV sans encodeur), AAF, SWF (Flash obsolète), MJPEG brut. Entrées : le service lit tout ce que ffmpeg lit ; la liste d'entrées du sélecteur n'a pas été comparée à celles des concurrents.

**H.265 et AV1 — le service tient.** L'image portait libx265 mais **pas SVT-AV1** (libaom : ~250 s pour 30 s de 1080p, inutilisable). ffmpeg 7.0.2 (johnvansickle, figé depuis 2024) remplacé par **BtbN n8.1.2**, étiquette immuable `autobuild-2026-08-31-13-27`, SHA-256 `c733b4b2…` vérifiée au build (archive de 126 Mo contre 42 Mo). Temps en production, 30 s / 3 min : H.265 **20 s / 59 s**, AV1 **19 s / 29 s**. Aucun changement de dimensionnement nécessaire à ce volume.

**Saturation (production, 4 visiteurs simultanés, compresseur, 30 s).** 2 traitements en parallèle et 10 places d'attente : les deux premiers finissent en 30-34 s, les deux suivants **voient « vous êtes le n° 1 / n° 2 dans la file »** et attendent 14 à 17 s (total 47-49 s, contre 15,8 s seul). Tous réussis. **Ordre de grandeur (extrapolé, non mesuré au-delà de 4) :** un traitement léger ≈ 15 s → attente ≈ 7 à 8 s par rang ; **acceptable jusqu'au rang ~6 pour les jobs légers (≈ 1 min)**, mais **dès le rang 2-3 pour les jobs lourds** (WebM 3 min = 147 s, soit > 2 min d'attente). File pleine (10) + 2 en cours : le 13ᵉ voit « All conversion slots are busy » et son navigateur réessaie toutes les 3 s pendant 10 min (comportement prouvé en local avec 1 place ; **non éprouvé en production : la limite de 20 billets/heure/IP interdit de tester au-delà**). Le registre des jobs est **en mémoire** : monter en charge = agrandir le service (verticalement), **pas** ajouter des réplicas.

**Coût réel mesuré (API d'usage Railway, tarifs lus le 20/09 : 20 $/vCPU-mois, 10 $/Go-mois, 0,05 $/Go sortant ; ce n'est PAS une facture).** Lot connu de 4 compressions de 30 s : **4,5 vCPU-min, 1,66 Go-min, 0,058 Go sortis** → **≈ 0,0013 $ par conversion légère** (**estimation, non mesurée :** un job lourd comme un WebM de 3 min ≈ 20 vCPU-min, ≈ 0,012 $). Consommation totale depuis le déploiement (≈ 36 h, une centaine de conversions d'essai) : 130,8 vCPU-min, 27,1 Go-min, 2,15 Go sortis ≈ **0,17 $**. **Coût retenu : 0,00 $ à trafic nul, ≈ 1 à 2 $/mois à 500 conversions, ≈ 10 à 20 $/mois à 5 000** (extrapolation selon la part de jobs lourds). **Remplace l'estimation de 1,2 $**, qui restait dans la même fourchette.

**✅ Facture réelle de septembre relevée le 22/09 : 2,65 $ pour tous les services Railway confondus** (`RAPPORT-stockage-et-indexation.md` §3 — chiffre du tableau de bord, qui fait foi ; ma propre mesure via l'API d'usage donne un ordre de grandeur comparable, ~1,8 $ extrapolé, mais reste imprécise, un service n'étant pas résolu dans les noms). **La veille de `gotenberg-fonts`, activée le 22/09** (il tournait 24 h/24 sans une seule requête depuis 3 jours, `RAPPORT-gotenberg-independance.md`), **doit faire baisser ce chiffre — à vérifier au prochain relevé.**

**Coût réel Office « stage » (mesuré le 21/09, même API d'usage, ce n'est pas une facture) :** depuis le 20/09 00:00 UTC (~46 h), `media-processing` : 135,0 vCPU-min, 38,5 Go-min, 5,83 Go sortis ≈ **0,36 $** ; les seules ~60 conversions Office d'essai du 21/09 (jusqu'à 400 Mo) ≈ **0,18 $**, presque tout en bande passante sortante (**2 × la taille du fichier**), CPU quasi nul. **Office 10 Mo ≈ 0,001 $ ; 100 Mo ≈ 0,01 $ ; 500 conversions de 10 Mo ≈ 0,5 $/mois.** *Observation mesurée :* `gotenberg-v2` a consommé 2 048 Go-min sur la même fenêtre (≈ 0,47 $ pour ~46 h), la mémoire résidente de Gotenberg pèse plus que tout le reste.

**📌 À TRANCHER AVANT le lancement Product Hunt — saturation.** Au-delà du rang 2-3 sur les jobs lourds, les visiteurs attendent (WebM 3 min : 147 s par rang). Le registre des jobs est en mémoire : **monter en charge = agrandir le service, pas ajouter des réplicas.** Les jobs Office « stage » ne prennent aucun emplacement ffmpeg ; leur goulot est la mémoire de la fonction Vercel et Gotenberg (3 réplicas avant le lancement). La vague de trafic simultané de Product Hunt arrive d'un coup : décider le dimensionnement AVANT, pas après.

**Reste** : ① Safari réel (macOS, iPhone) sur les deux outils vidéo, `image-converter` (AVIF), `video-trimmer` ; ② comparaison chiffrée aux concurrents pour MP4, H.265, AV1 et le compresseur ; ③ essai réel d'un fichier proche de 1 Go ; ④ première facture Railway ; ⑤ ~~D8 (branchement Office)~~ ✅ fait sur préversion le 21/09, voir 2 bis ; ⑥ **essai d'un fichier de 1 Go : non faisable** (la fonction Vercel cède vers ~150-200 Mo pour Office).

## 7 — ✅ Les trois stubs — **construits, vérifiés, publiés le 23/09** (`RAPPORT-ecarts-marche.md` §3d, §5)

> **23/09 :** `pdf-to-excel` et `pdf-to-ppt` construits sur ConvertAPI (même tuyau que `pdf-to-word`, gestionnaire partagé `lib/pdfToOfficeRoute.ts`) — **structurellement identiques à iLovePDF** sur les fichiers du corpus de fidélité (mêmes tableaux, mêmes valeurs typées, mêmes diapositives). `image-generator` construit sur **gpt-image-2 « low »** (≈ 0,006 $/image) après recherche documentée (fournisseurs, paliers gratuits, auto-hébergement impossible sur Railway sans GPU, bornage des concurrents) : 5 images/jour/visiteur et **budget propre de 5 $/mois** qui ne peut pas entamer le plafond global de 20 $. Option moins chère prête pour plus tard : FLUX.2 [klein] 4B (Apache-2.0) chez Cloudflare Workers AI, 0,00115 $/image, ~96 gratuites/jour — **exige un jeton API que seul le propriétaire peut créer**. Compteur passé à **225** ; image OG régénérée ; badges « Coming soon » devenus sans objet (le mécanisme reste pour un futur stub).

*(Historique ci-dessous, périmé par ce qui précède.)*

Les retirer coûte **20 lignes sur 5 fichiers, dont 2 partagées avec de vrais outils**, et crée des **pages orphelines de façon certaine**. Or « Coming Soon » + `noindex` + absents du sitemap, **c'est honnête**.

**📌 22/09 — chiffré et recommandé, DÉCISION AU PROPRIÉTAIRE** (`RAPPORT-outils-mis-en-avant.md` §5). Constat nouveau : les pages catégorie PDF et IA listent les 3 stubs **comme des outils normaux** (« Convert PDF tables to Excel ») — la carte promet ce que la page n'a pas. Le marché (iLovePDF, Smallpdf, Adobe) ne publie pas de page d'outil vide. **Recommandation :** ① **construire `pdf-to-excel` (4-6 h) puis `pdf-to-ppt` (3-4 h)** sur ConvertAPI (`pdf/to/xlsx` et `pdf/to/pptx` existent, OCR inclus), même tuyau que `pdf-to-word`, 0,01 $/conversion ; ② **retirer `image-generator` des listes ou le supprimer** : 0,011-0,167 $/image, 500 images moyennes ≈ 21 $ épuisent seules le plafond global de 20 $, et `gpt-image-1` est annoncé retiré le 23/10/2026 ; ③ en attendant, un badge « Coming soon » sur les 3 cartes (≈ 15 min). Rien n'a été fait.

## 8 — Fréquence de la surveillance *(après le lancement)*

Vercel **Hobby** = **une tâche planifiée par jour**. **Sans trafic, ça ne sert à rien.**

## 9 — 🔴 Safari **à moitié testé** : macOS mesuré, iPhone à faire par le propriétaire *(bloquant de lancement)*

**📌 02/10 — P21 (`docs/audit/RAPPORT-p21-nuit-jour-02-10.md`). PASSE SUR LE VRAI iPHONE DU PROPRIÉTAIRE (P15–P19, tests 1 à 8) : 8/8 RÉUSSIS** — Split PDF (Download, Save / Share, ZIP), Image Compressor 48 Mpx (8064×6048 conservés, −63 %), Image Converter HEIC 48 Mpx → JPG en 8064×6048 et JPG → WebP/AVIF/PNG, Image Resizer 24 Mpx → 2856×2142, Brightness & Contrast et Image Blur 24 Mpx (flou en ≈ 2 s), JPG to PDF portrait droit, QR Scanner (caméra, envoi, collage), Background Remover. **Tests 9 à 16 encore à faire par le propriétaire : le bloquant 9 reste OUVERT.** Défauts vus pendant la passe, traités par P21 phase 1 : JPG to PDF « Download » ouvre le PDF au lieu de l'enregistrer ; Background Remover (morceau de fond, liseré bleu, halo autour de l'anse) ; Image Converter « 443% larger » / « 100% larger » sans explication.

**📌 01/10 — P20 (`docs/audit/RAPPORT-p20-01-10.md`).** **Passe Safari 17.6 RÉELLE du Mac après P19 : 67/68 réussies, 0 échec réel, 1 non testé (payant)** ; la perte de lettres du 30/09 = artefact du banc Mac (touche Cmd restée enfoncée). Passe iPhone P15–P19 : fiche et kit prêts, en attente du propriétaire. P20 a ajouté le dépôt de fichier sur ≈ 95 pages (`FileDropBridge`) et le glisser de Merge PDF : à vérifier sur Safari réel (§7 du rapport). **Le bloquant 9 reste ouvert jusqu'à la passe iPhone.**

**📌 01/10 — P19 (`docs/audit/RAPPORT-p19-01-10.md`).** **Passe Safari 17.6 RÉELLE du MacBook après P18 : 57/59 réussies** (les 9 outils PDF, le téléchargement, Markdown to PDF, Video to GIF, Text to PDF avec emoji, MOBI, Upscaler, filtres et outils texte vérifiés finement). Les 2 écarts — **confirmation avant de quitter absente** sur QR Generator, JSON Formatter et Hash Generator (P18 exemptait résultats texte et générateurs) et **Code Formatter** (« Éloi » pour « Élodie » une fois sous safaridriver : événement `input` perdu par le WebDriver, React #10687) — **plus le défaut d'Audio Splitter (coupe par défaut à 5,9 s sur 6 s)** sont **corrigés et en production `f7569b1d`** (rouge sur www avant, vert après, ×3 moteurs + iPhone/iPad simulés). **Reste : repasser ces 3 points sur le Mac (rapport P19 §7), puis l'iPhone.** Le bloquant reste OUVERT.

**📌 30/09 → 01/10 — P18 (`docs/audit/RAPPORT-p18-01-10.md`).** **Passe Safari RÉELLE COMPLÈTE du MacBook (nuit du 30/09, Safari 17.6, les 225 outils, rapport `RAPPORT-tests-mac-complet.md` sur le Bureau du Mac) : 187 réussis, 9 échoués, 5 non testables, 24 payants non lancés.** Les 9 échecs (Compare PDF, PDF Editor, Extract Text, PDF OCR, Organize PDF, Redact PDF, PDF to HTML, PDF to Image, PDF to JPG : « Promise.try is not a function ») sont **corrigés et en production** (build « legacy » de PDF.js + polyfills ; un 2ᵉ défaut trouvé par la simulation — pas d'itération asynchrone des flux avant Safari 26.4 — aurait encore cassé les 7 outils qui lisent le texte). **Plancher garanti : Safari / iOS / iPadOS 16.4** (syntaxe ES2022 vérifiée à chaque build, simulation Safari 16.4 dans les bancs, page ET Workers ; prouvé sur appareil réel : 17.6 seulement). Aussi corrigés : téléchargement explicite sur les 191 outils qui font un fichier (iPad compris, « Save / Share » iOS, ZIP, question avant de quitter), Markdown to PDF (vrai PDF), Video Tools › Video to GIF (vrai GIF animé), Code Formatter (151 s non reproduits : cause = le banc du Mac), MOBI de test versionné (`docs/audit/fixtures-safari/safari-book.mobi`, relu par KindleUnpack), et Text to PDF (emoji en couleur et toutes les écritures courantes, bengali compris, par notre Chromium et les polices Noto). **Le bloquant reste OUVERT : la liste du rapport §9 est à repasser sur le Mac, puis l'iPhone.**

**C'est le dernier bloquant technique avant le lancement.** Firefox et Chrome confirmés. Safari = l'essentiel du trafic iPhone et Mac. Casse typiquement : Web Workers, téléchargements, WASM, `OffscreenCanvas`. **Nécessite un iPhone ou un Mac.**

**✅ Feuille opérationnelle prête (19 septembre 2026) : `tests-safari-proprietaire.md`**, comme le bloquant 11 a la sienne. 20 outils classés par risque lu dans le code, fichiers d'essai fournis (`docs/audit/fixtures-safari/`), séances iPhone puis MacBook, **~2 h**, la moitié la plus risquée en premier (séances A puis C, ~1 h). **Le propriétaire a un iPhone et un MacBook réels : aucun service de test, aucun compte à ouvrir.** **Le bloquant reste OUVERT tant que la feuille n'est pas remplie** ; **les verdicts remontent ici**, et chaque ÉCHOUÉ devient un défaut chiffré dans ce bloquant, jamais dans « CLOS » sans retest sur le vrai Safari.

**📌 DÉCISION du 19 septembre — exception assumée à l'interdit n° 8 :** les deux outils payants de la feuille Safari (**Background Remover** et **Grammar Fixer**) sont testés **en PRODUCTION, une fois chacun, coût mesuré ~0,003 $**. La règle n° 8 vise la dépense non maîtrisée ; ici la dépense est bornée et connue, et c'est **la production** qu'il faut prouver sur Safari, pas une préversion protégée par une connexion. Ne vaut que pour ces deux tests, une fois chacun.

**📌 MESURÉ le 19 septembre — vrai Safari 17.6 / macOS 14.8.9 (safaridriver) : 5 outils sur 20 échouent, causes WebKit, donc valables sur iPhone.** Chaque défaut entre dans le bloquant avec sa gravité (détail, balayage fichier:ligne et chiffrage : `docs/audit/RAPPORT-safari-defauts.md`) :

| # | Défaut | Gravité | État |
|---|---|---|---|
| S2 | `voice-recorder` : MP4 étiqueté `audio/webm`, sans erreur | **HAUTE — mensonge** | 🟡 corrigé et **déployé en production** (fusion `safari-defauts`, déploiement `9e46af54`, 19/09), **retest Safari réel requis** |
| S3 | `image-converter` (+ `jpg-to-webp`, `png-to-webp`) : PNG livré sous nom `.webp`, 86 % plus lourd, sans avertissement | **HAUTE — mensonge** | 🟡 corrigé et déployé en production (`9e46af54`), retest Safari réel requis |
| S4 | `image-upscaler` ×8 : canvas 32000×24000, fichier vide, interface « réussie » (URL réelle `/tools/ai-tools/image-upscaler`) | **HAUTE — mensonge** | 🟡 corrigé et déployé en production (`9e46af54`), retest Safari réel requis |
| S1 | `video-compressor` / `video-converter` / `video-trimmer` : `captureStream()` absent de `<video>`, MediaRecorder sans WebM | Moyenne — panne franche | 🟡 `video-trimmer` **refait sur ffmpeg.wasm** (retest Safari requis) ; compressor et converter : **service ffmpeg déployé et prouvé en production le 20/09 (bloquant 6)** — retest Safari réel requis |
| S5 | `mp4-to-gif` refuse les `.mov` (donc toute vidéo iPhone) | Moyenne — refus franc | 🟡 `accept` élargi, déployé (`9e46af54`), retest Safari réel requis |

**📌 28/09 (nuit) — passe PRÉALABLE sous le WebKit de Playwright (pas Safari : ne clôt rien)** — détail outil par outil dans `tests-safari-proprietaire.md` §8. Les 29 outils de la feuille + les 5 à MediaRecorder passés ; services et outils payants **joués par le test** (aucun appel payant, aucun secret). **7 défauts corrigés en local** (un commit chacun, testés WebKit + Chromium + Firefox) : Audio Trimmer et Audio Splitter bloqués sans message sur un format que le lecteur ne lit pas ; Video Trimmer idem (AVI, WMV) ; **Image Resizer déformait sous WebKit** (879×1500 au lieu de 879×659) ; Voice Recorder et QR Scanner donnaient une fausse cause ; textes « toujours WebM » faux sous Safari. Trouvé en route : **Video Merger ne finissait jamais sous Firefox et perdait le son** → corrigé. Les 5 outils MediaRecorder **disent avant** qu'ils ne peuvent pas tourner dans ce WebKit (sans MediaRecorder) ; **à vérifier sur le vrai Safari** (il en a un, en MP4). Envoi par morceaux prouvé sous WebKit sur Video Compressor/Converter, GIF, Upscaler, Opus : octets reçus identiques au fichier.
**📌 28/09 — TESTS 1 À 8 FAITS PAR LE PROPRIÉTAIRE sur iPhone et MacBook (macOS 14, Safari 17.6).** **Le test 7 (Opus) est RÉUSSI sur les deux** : le fichier `.opus` est produit ; si macOS ne l'ouvre pas, c'est qu'Apple ne fournit pas d'application Opus. **Les tests 9 à 30 restent à faire** (après le déploiement 2 : la feuille décrit l'état déployé). Défauts relevés, traités la nuit du 28 au 29/09 **en local** (commits `2cbb8476`, `c0ad4c7a`, `bf2755e3`, `a06d4a21`, `71e4ef16` ; tests `night-28-09.mjs` Chromium/Firefox/WebKit) — **à déployer avec le propriétaire, puis à retester sur son Safari** :

| # | Défaut (passe Safari du 28/09) | État |
|---|---|---|
| 1a | Opus : lecteur « Error » sur Safari Mac (audio-converter, booster, compressor) | 🟡 corrigé en local : lecteur commun `PlayablePreview` (`canPlayType` puis l'erreur du lecteur) → phrase « Your browser can't play … » sur tous les outils audio et vidéo concernés ; retest Safari Mac requis |
| 1b | Audio Compressor rend **plus gros** (0,05 → 0,10 Mo, « Saved −95,4 % » en vert) | 🟡 corrigé en local : débit de la source mesuré et jamais dépassé ; résultat plus gros → ambre, « keep your original » ; même règle au GIF Compressor ; retest requis |
| 1c | Vidéo choisie dans Photothèque réduite par iOS (29,44 → 9,88 Mo) ; aperçu noir sur iPhone | 🟡 **iOS réencode, aucun attribut ne l'empêche** : consigne iPhone (« Save to Files » puis « Choose Files ») sur les outils vidéo et Image Compressor ; première image affichée sur iOS ; **retest iPhone requis** |
| 1d | zip-extractor, `safari-winrar.rar` : le 2ᵉ fichier affiche des 0 et des 1 | ✅ **pas un défaut** : `long.txt` contient réellement 1 Mo de « 0 »/« 1 » (CRC identique à WinRAR) ; feuille corrigée |
| 1e | Barcode Generator : SVG trop petit à l'écran | 🟡 corrigé en local : aperçu = SVG agrandi ; le fichier garde sa taille d'impression en mm |
| 1f | 7z « Wrong password » | ✅ pas un défaut (mot de passe du RAR tapé ; celui du 7z est `data-only`) |

**📌 29/09 — PASSE iPHONE DU PROPRIÉTAIRE (production `828cfe75`) :** **RÉUSSI 1 à 8, 11, 13, 15, 31, 34, 39 ; ÉCHOUÉ 9, 10, 25, 30, 36.** Le **test 34 était juste** : 4,91 MB = 5 151 217 octets en unités binaires ; l'erreur venait de la valeur attendue de la feuille (corrigée, `tests-safari-proprietaire.md` §10). **Défauts A à I traités le 30/09, en local, branche `safari-iphone-30-09` (NON poussée, NON déployée → P15)**, détail et preuves : `docs/audit/RAPPORT-safari-iphone-30-09.md` :

| # | Défaut (iPhone, 29/09) | Correctif (30/09) | État |
|---|---|---|---|
| A | Image Converter : photo d'iPhone refusée (plafond 12 Mpx), WebP désactivé, AVIF/HEIC→JPG en échec, avertissement WebP hors de propos | 50 Mpx téléphone / 100 ordinateur ; bandes + encodeurs WebAssembly au-delà des 16,7 Mpx de canvas d'iOS ; WebP par libwebp (Squoosh) ; HEIC décodé par Safari | 🟡 local, à retester |
| B | QR Scanner : pas de « Coller » à l'appui long | bouton Paste image (clipboard.read) + zone de collage éditable | 🟡 local, à retester |
| C | Background Remover : onglet tué au Download PNG (12 Mpx) | recomposition par bandes de 4 Mpx dans un seul PNG, pleine résolution | 🟡 local, à retester |
| D | Rotator/Merger/Resizer/Filter/Screen Recorder : WebM illisible par Photos, plein écran, temps réel, plus lourd | Rotator : matrice de rotation (instantané, sans perte) ; Merger : jonction sans réencodage, sinon clips alignés sur le service ; Resizer/Filter : service ffmpeg ; MP4 partout ; `playsinline` partout | 🟡 local ; **service média à déployer d'abord** ; à retester |
| E | Brightness & Contrast / Blur : URL data: → rien d'enregistré | toutes les URL data: de téléchargement du site remplacées par des Blob nommés d'après l'original | 🟡 local, à retester |
| F | PDF : Download ouvre le PDF | sur iOS, réponse « Content-Disposition: attachment » par le service worker `/zipdl/` pour chaque téléchargement du site (moyen d'iLovePDF/Smallpdf) | 🟡 local, à retester (39) |
| G | Barcode : SVG minuscule | plein écran à l'ouverture, taille en mm à l'impression | 🟡 local |
| H | 4,91 MB au lieu de 5,2 MB | unités décimales partout (Apple, Squoosh) | 🟡 local |
| I | Upscaler « made on your device » ; aperçu blanc de Video Trimmer | phrase claire ; aperçu chargé | 🟡 local |

**📌 30/09 (nuit) — PASSE SAFARI RÉELLE DU MACBOOK (macOS 14.8, Safari 17.6 piloté par safaridriver, production `828cfe75`) :** **RÉUSSI 1c, 9, 10 (AVIF, BMP, TIFF, PDF, HEIC ; photo de 12 Mpx acceptée sur Mac), 11 (« made on our server »), 12 à 25, 27 à 29, 32, 33, 35, 36, 38, 39.** Trois défauts, corrigés le 30/09 sur `safari-iphone-30-09` (→ P15) :

| # | Défaut (Safari 17.6, Mac) | Cause | Correctif (30/09) | État |
|---|---|---|---|---|
| J | Tar Extractor : `t.tar.gz` refusé à la sélection (« One or more files could not be selected ») ; `t.tgz` passe ; extraction correcte | Safari et les sélecteurs macOS/iOS ne comparent que la DERNIÈRE extension (« gz ») : `.tar.gz` dans `accept` ne correspond jamais | `accept` = extensions simples + types MIME (`.tar,.tgz,.gz,.taz`, `application/x-tar`, `application/gzip`…) ; un `.gz` qui n'est pas un TAR renvoie vers le ZIP Extractor ; **audit de tous les `accept` : seul cas du site** ; garde de build `scripts/check-accept-extensions.js` (refuse toute double extension) | 🟡 à retester sur Safari |
| K | Video Rotator / Merger / Resizer : ≈ 20 images/s, plus longs que la source (8,29 s pour 5 s ; 16,63 s pour 10 s ; 6,69 s pour 5 s) ; Resizer 480p : vertical 1080×1920 → paysage 854×480 | ancienne voie MediaRecorder (remplacée par D, non encore déployée) ; préréglages 480p/720p/1080p fixés en paysage ; **trouvé en vérifiant la nouvelle voie** : jonction de clips différents avec un trou à chaque raccord (8,019 s, cadence lue « 60 i/s ») car le son AAC dépassait l'image de quelques ms | nouvelle voie vérifiée image par image (ffprobe) ; préréglages = côté court dans l'orientation de la vidéo (480p vertical = 480×854), vertical par défaut pour une vidéo verticale ; service : image et son de chaque clip de jonction de même durée exacte (`tpad` + `apad` + `-t`) | 🟡 à retester sur Safari |
| L | Video Trimmer, coupe précise 1 s → 5 s à 30 i/s : 118 images (3,933 s), son 3,99 s | `-ss` avant `-i` est décalé par le début du conteneur : dans le morceau envoyé au service, le son commence à 0,046 s et l'image à 0,067 s → coupe 1-2 images trop tard, puis `-t` coupait la fin (reproduit : 119 images, première image n° 32 au lieu de 30) | coupe sur l'horloge du fichier (`-copyts`), recherche grossière 5 s avant puis `trim`/`atrim` exacts — service ET navigateur | 🟡 à retester sur Safari |

**P15 (30/09)** : J, K, L et A-I déployés sur www (`0b6cb6cf`) ; **défaut E non prouvé sur le chemin iPhone** (outils image au-delà de 16,7 Mpx : « Could not load this image » en simulation) → à corriger ; décision de garder ou retirer P15 au propriétaire (rapport P15).

**✅ P16 (30/09) — défaut E corrigé et en production (`333e7950`, Vercel `onlineconvertools-aw2y2owe3`), `docs/audit/RAPPORT-p16-photos-iphone-30-09.md`.** P15 vérifié jusqu'au bout sur www : D/K (Rotator 90°, Merger de deux sources, Resizer 480p vertical = 480×854 : durée exacte, 30 i/s, son), L (120 images, 4,000 s), 238 pages Chromium, AI Detector (aucun verdict faux ; les textes d'IA courts restent souvent « sans verdict », limite de la méthode, bloquant 5) — **tout PASS**. Cause de E : `decodeToRaster` refusait la photo quand le recadrage natif n'est pas fiable (Chromium) au lieu de se replier ; repli ImageBitmap + bandes, simulation transmise aux Workers. **La simulation de la limite de canvas de l'iPhone est désormais OBLIGATOIRE et active par défaut dans tous les bancs image** (`scripts/browser-tests/lib/ios-canvas-cap.mjs` : aucun canvas > 16,7 Mpx, page et Workers ; un canvas trop grand tenté = échec, même avec un résultat affiché). Sur www, chaque outil image à 24 et 48 Mpx avec la simulation : 42/42 + 18/18 sur Chromium, Firefox et WebKit. **Reste : le vrai iPhone** (temps et mémoire à 24/48 Mpx — liste dans le rapport P16) ; le bloquant 9 reste ouvert jusque-là.

**📌 30/09 — PASSE SAFARI RÉELLE DU MACBOOK sur P15/P16 (banc `tests-safari-scripts`, Safari 17.6) : 38/40.** Réussis : **J** (Tar `t.tar.gz`), **K** (Rotator, Merger de deux sources, Resizer 480p vertical), **L** (Trimmer coupe précise), WebP, Video Filter, **photos de 24 et 48 Mpx**. Les 2 restants : **Image Blur trop lent** (44 s à 12 Mpx, 69 s à 24, 160 s à 48 ; Safari n'a pas `ctx.filter`) → **corrigé par P17** (flou sur le GPU, sinon CPU réécrit : sous WebKit avec simulation iPhone, 12 Mpx 6,5 → 1,6-2,0 s, 48 Mpx → 4,8 s, au niveau d'Inverter), et **Video Rotator** (rotation par métadonnée, que l'ancien Windows Media Player ignore) → **P17 : choix « Compatible everywhere » (par défaut, image réellement tournée) / « Instant, lossless »**. **À refaire sur le Mac et l'iPhone : Image Blur à 12, 24 et 48 Mpx (temps), Video Rotator dans les deux modes** (`RAPPORT-p17-30-09.md`).

**Banc Safari automatisé sur le MacBook** (Bureau, dossier `tests-safari-scripts` : `tests.py`, `make_report.py`, `run.sh`) : il rejoue la passe Mac par safaridriver **sans le propriétaire** après chaque déploiement.

**Audit systématique des 4 causes iOS sur tout le site (30/09)** : URL data: de téléchargement (0 restante), sortie WebM (0 par défaut ; WebM seulement si le visiteur le choisit ou sous Firefox pour un enregistrement, avec conversion MP4 proposée), canvas > 16,7 Mpx (tous les outils image, PDF, QR, upscaler, détourage, GIF traités), PDF qui s'ouvre (pont iOS pour tout le site) — liste outil par outil dans le rapport. **À refaire sur iPhone après P15 : 9, 10, 25, 30, 36, 39 (téléchargement).** Tests Mac : faits le 30/09 par safaridriver (voir ci-dessus, défauts J-L).

**Passe préalable WebKit n° 2 des tests 9 à 30 (nuit du 28 au 29/09, build local) :** feuille §9 — tout ce que ce WebKit peut exécuter passe ; 10, 13 et 30 restent entièrement pour le vrai Safari (pas d'OffscreenCanvas ni de MediaRecorder ici).

Le balayage a trouvé **9 `MediaRecorder` sans `isTypeSupported`** (pas 5) — *28/09 : relu dans le code, les 4 outils vidéo et Screen Recorder passent désormais par `videoReRecordSupport` / `finishRecording` (détection faite le 19/09, `9786eb63`) ; ce qui restait non testé l'est maintenant sous Chromium/Firefox (`mediarecorder-tools.mjs`), le vrai Safari reste à faire* : `video-merger/filter/rotator/resizer` et `screen-recorder` s'ajoutent, non testés sous Safari. La classe « succès annoncé sans vérifier la sortie » est traitée site-wide via `app/lib/mediaSupport.js` (tests : `scripts/media-support-tests/`). **Le bloquant 9 reste OUVERT** : ces correctifs ne sont prouvés que contre des faux, pas sur un Safari réel.

**✅ 28/09 — identifiée :** l'erreur `navigator.storage.persisted` vient de la **barre de commentaires que Vercel injecte sur les préversions** (`vercel.live/_next-live/feedback`, pile relevée), pas du site ; bloquée, 238 pages propres sous WebKit ; absente de www (238/238 propres sans filtre). `all-pages-load.mjs --no-vercel-toolbar`. *(Énoncé d'origine :)* **📌 22/09 — point à surveiller lors de la passe Safari réel :** une erreur WebKit non identifiée (`TypeError: undefined is not an object (evaluating 'navigator.storage.persisted')`) est apparue une fois pendant un essai `image-captioner` par ailleurs réussi (WebKit de Playwright). Recherchée dans le code du projet : aucune trace de `storage.persisted` nulle part — ne vient pas de ce projet. Non reproduite au rechargement. **Si elle apparaît sur un vrai Safari lors de la passe du propriétaire, l'identifier plus précisément avant de la classer bénigne.**

**📌 20 septembre — suite (détail : `docs/audit/RAPPORT-formats-navigateurs.md`).** Production vérifiée (déploiement `9e46af54` READY, `.mov` accepté). **AVIF — mensonge découvert le 20/09, puis option RÉTABLIE honnêtement.** Mesuré : Chrome 153, Chromium 151 et Firefox 153 rendaient **du PNG** quand `image-converter` leur demandait de l'AVIF (3 API sur 3) : l'option trompait TOUS les visiteurs depuis toujours, pas seulement Safari. Elle avait d'abord été désactivée (textes réécrits), puis a été **RÉTABLIE le 20/09** parce que le marché l'offre (Squoosh, TinyPNG, CloudConvert, Convertio, iLoveIMG) et que la règle de couverture impose de l'offrir aussi — **cette fois avec un vrai encodeur WebAssembly** (`@jsquash/avif` 2.1.1, Apache-2.0, 1,1 Mo sur le réseau, dans le navigateur : l'image ne quitte pas l'appareil). **Prouvé en production (20/09, `e2e-avif.mjs`) :** un PNG de 2 602 Ko donne un AVIF de 187 Ko (boîte `ftypavif`), décodé par Chromium (3,0 s) et par Firefox (11,2 s : **Firefox est ≈ 6× plus lent que Chromium**) ; sur un autre PNG, 4,8 Mo → 0,46 Mo. **Non prouvé : le WebKit de Playwright n'a pas `OffscreenCanvas`** (`image-converter` n'y tourne pour aucun format), donc l'AVIF y est **non testable et reste à vérifier sur un vrai Safari** (bloquant 9). WebP : OK sous Chrome et Firefox, PNG sous Safari (S3). Reste de la classe traité : 5 outils GIF (plus d'`alert()`, plus de GIF d'images vides), `video-to-gif`, `pdf-sign` (**signait avec un cadre vide et ne pouvait pas se tracer au doigt sur iPhone**), `pdf-editor`, `audio-waveform`, QR, codes-barres. **`video-trimmer` passé sur ffmpeg.wasm (stream copy)** : coupe en 0,2-0,9 s pour 30 s comme pour 2 min (ancien moteur : 1× le temps réel), moteur ~10 Mo sur le réseau (32 Mo décompressé), **la coupe s'aligne sur l'image-clé (+2 à +3 s mesurés) et la page le dit**. **Non prouvé : iPhone/Safari, plafond mobile 100 Mo (choix prudent).** **DÉCISION vidéo (révisée le 20/09 par la règle qui prime) : trimmer fait dans le navigateur ; `video-compressor` et `video-converter` sont passés sur le service ffmpeg (bloquant 6, **déployé et prouvé en production le 20/09**) — « honnête mais en panne sous Safari » n'est plus acceptable.** Le build local passe (variables IP documentées dans `REFERENCE-projet.md`).

**Suspects lus dans le code (état initial, avant les mesures ; RÉSOLUS le 19-20/09 : ① confirmé → S1, ② → S2, ③ → S3, ④ → S4 pour `image-upscaler` (`background-remover` non confirmé, non testé), ⑤ corrigé avec délai de garde) — conservés pour mémoire, à ne pas lire comme des hypothèses ouvertes :** ① `video-compressor`, `video-converter`, `video-trimmer` appellent `captureStream()` + `MediaRecorder` en `video/webm` **sans détection de support** ; ② `voice-recorder` étiquette `audio/webm` un enregistrement que Safari produit en MP4 ; ③ `image-converter` : WebP par défaut via `OffscreenCanvas.convertToBlob` (Safari peut renvoyer du PNG) ; ④ `image-upscaler` (jusqu'à ×8) et `background-remover` (recomposition pleine résolution) dépassent probablement la limite de canvas de Safari iOS ; ⑤ `video-to-gif` attend `seeked` **sans délai de garde** (contrairement à `mp4-to-gif`).

## 10 — ✅ CLOS — Bug de débordement de la navbar

8 largeurs de 1024 à 1536 px, barre + 3 enfants directs : **0 px partout**.

## 11 — Les tests manuels du propriétaire

**Feuille opérationnelle : `tests-manuels-proprietaire.md`.** Sept tests, 1 h 15 à 1 h 45.
**Restent hors de la feuille — les contrôles de la « vague 1 » de l'audit de couverture (`docs/audit/2026-09-06-couverture-formats.md`), à faire par le propriétaire.** *Note d'honnêteté : les messages des commits `50527805` et `b77f988b` ne contiennent pas de liste intitulée « contrôles » ; la liste ci-dessous est reconstituée à partir de ce que ces commits (et ceux qui ont clos leurs renvois) ont réellement modifié.* Le commit `50527805` (« stop 3 tools from misleading visitors ») cite **cinq outils** ; deux d'entre eux ont vu leur texte reporté à la vague 3, faite depuis :
1. **`image-converter` — TIFF** : la page dit que le TIFF n'est pas pris en charge ici et renvoie vers `tiff-to-jpg` / `tiff-to-png` (commit `50527805`). *À vérifier :* le texte de la FAQ et de l'interface, puis un vrai `.tif` sur `tiff-to-jpg`. *(Depuis, `990b99a3` a branché un décodeur TIFF réel dans `image-converter` : contrôler que le texte actuel est cohérent avec cela.)*
2. **`audio-trimmer` — extension** : le fichier téléchargé porte l'extension et le type MIME **du fichier d'origine** (avant : toujours `.mp3`). *À vérifier :* couper un `.wav` → le résultat s'appelle `.wav` et se lit ; couper un `.mp3` → `.mp3`.
3. **`audio-transcriber` — plafond** : la FAQ annonçait 25 Mo, le plafond appliqué était 10 Mo (`50527805`) ; il est aujourd'hui de 4 Mo (plafond de plateforme, D10). *À vérifier :* la page annonce 4 Mo avant la sélection et refuse un fichier de 5 Mo sans l'envoyer.
4. **`word-to-pdf` — `.doc`** (texte reporté, fait dans `eaddc44e`) : `.doc` accepté. *À vérifier :* un vrai `.doc` binaire → PDF, et que la FAQ ne prétend plus « même moteur LibreOffice » pour le `.docx`.
5. **`tar-extractor` — `.tar.gz`/`.tgz`** (texte reporté, fait dans `990b99a3`). *À vérifier :* une archive `.tar.gz` réelle s'extrait.
**✅ 28/09 (nuit) — les 7 contrôles de la vague 1 AUTOMATISÉS et PASSÉS sur www, comme un visiteur, sans aucun appel payant, Chromium ET Firefox 12/12** (`scripts/browser-tests/vague1-controls.mjs`, fichiers fabriqués et résultats rouverts par le script) : ① `image-converter` liste le TIFF et ne dit nulle part qu'il n'est pas pris en charge ; un vrai `.tif` → `tiff-to-jpg` → JPEG 640×480 ; ② `audio-trimmer` : `.wav` coupé → `trimmed_tone.wav` (WAV réel), `.mp3` → `.mp3` (MP3 réel) ; ③ `audio-transcriber` : **le plafond est désormais de 25 Mo** (envoi par morceaux, D8 — le « 4 Mo » ci-dessous est périmé), écrit avant le choix du fichier ; un fichier de 26 Mo est refusé avec un message, **aucune requête envoyée** ; ④ `word-to-pdf` : `.doc` accepté par le sélecteur, plus aucune mention « même moteur LibreOffice » (la conversion elle-même n'a pas été lancée : payante pour `.docx`, et un vrai `.doc` a déjà été prouvé en production le 22/09) ; ⑤ `tar-extractor` : un `.tar.gz` fait par `tar.exe` → `a.txt` et `sub/b.bin` listés, octets identiques, aucun `PaxHeader` ; ⑥ `xml-to-json` : la page se charge sans erreur, `id="5"` → `"@_id": "5"` ; ⑦ `excel-to-json` : noms des feuilles affichés dès la lecture, JSON indexé par feuille (`Clients`, `Stock`). **Rien ne reste au propriétaire pour la vague 1.**
~~La feuille `tests-manuels-proprietaire.md` n'existe pas dans le dépôt~~ → **versée le 28/09 (`a5fdc576`).**
**✅ 28/09 — les SEPT TESTS automatisés et exécutés** (`scripts/browser-tests/b11-tests-proprietaire.mjs`, `b11-test7-crash.mjs` ; détail et preuves : `docs/audit/RAPPORT-deploiement-28-09.md` §4). Sur **www** (production `77a47594`), Chromium + Firefox ; test 7 sur la préversion `fd7g34cq7`. **Fichier C produit par le vrai Excel 16 de ce poste** (« CSV » local = « CSV (séparateur : point-virgule) », Windows-1252, et « CSV UTF-8 ») avec les séparateurs propres à Excel réglés en français, Windows non touché ; A/B = mires H.264 synthétiques (paysage, portrait, portrait par matrice de rotation 90°) — aucune vidéo de téléphone sur ce poste.
| Test | Verdict | Preuve (fichier · observé) |
|---|---|---|
| 1 video-screenshot, lecture puis pause | ✅ PASS | A, B, B-rot · JPG = PNG = image affichée (PSNR 32-48 dB), non noir, bonne orientation, Chromium + Firefox |
| 1 bis capture AVANT lecture (variante de la feuille) | ❌ **ÉCHEC Chromium** (Firefox ✅) | **JPG 1920×1080 entièrement blanc, livré sans message** → défaut **B11-1** ci-dessous |
| 2 video-watermark, 5 positions ×3 formes | ✅ PASS 30/30 | `Mon Type © 2026` entier, hors des bords, à la bonne place, jambages intacts (recadrages regardés) |
| 3 CSV Excel FR | ❌ **ÉCHEC** | `csv-to-json`/`csv-to-excel` ✅ en CSV UTF-8 (`;` détecté, 6 colonnes, `12,5` intact) mais ❌ en « CSV (point-virgule) » Windows-1252 : `Café` → `Caf�` → **B11-2** ; `csv-to-tsv` ❌ coupe sur `,` : 1/3/3/2/3/4 colonnes, `12,5` scindé → **B11-3** |
| 4 audio-merger MP3 44,1 k stéréo + WAV 48 k mono | ✅ PASS (2 ordres) | 10,000 s, 440/660 Hz puis 1 000 Hz exacts (pas de changement de hauteur), mono sur les deux oreilles |
| 5 `.doc` `.ppt` `.ods` → PDF | ✅ PASS ×3 | PDF lisibles : 3 pages, 3 diapositives → 3 pages, colonnes lisibles ; 0,6-1,9 s |
| 6 pdf-ocr recherche | ❌ **ÉCHEC** | `fran`, `français` → 0 résultat (libellés anglais seulement) → **B11-4** |
| 6 pdf-ocr extraction (français choisi) | ✅ PASS | 27/27 accents, 36/36 mots |
| 6 bis (trouvé) | ❌ **résultat faux silencieux** | liste filtrée affiche « French », OCR lancé en **anglais** (13/27 accents) → **B11-5** |
| 7 plantage React → `tool_errors` | ✅ **PASS** (écran + rapport ; **lignes 165 à 167 lues par le propriétaire le 28/09** : sticky-notes, 27/09 16:54-16:55 UTC, adresse masquée en `[path]`, aucun nom de fichier) | écran d'erreur du site, rapport accepté (204) sans nom ni contenu de fichier ; **3 lignes attendues 16:54:25 / 16:54:43 / 16:55:02 UTC, outil `sticky-notes`** (Supabase → Table Editor → `tool_errors`) |

**✅ Défauts issus du bloquant 11 — CORRIGÉS et en production le 28/09 (`03f34e53`, préversion puis www, Chromium/Firefox/WebKit ; `docs/audit/RAPPORT-global-28-09.md` §1) :** B11-1 (capture attend une image décodée), B11-2 et B11-3 (famille CSV : encodage détecté comme ConvertCSV/TableConvert, virgule décimale, csv-to-tsv sur l'analyseur commun), B11-4 et B11-5 (recherche par nom anglais/natif/code sans accents ; langue utilisée = langue affichée ; 102 modèles vérifiés, `kur`/`tgl` absents du CDN remplacés par `kmr`/`fil`). *(Constat d'origine :)*
- **B11-1 — `video-screenshot`** : capture faite avant qu'une image soit décodée → JPG blanc (PNG transparent) livré comme réussi, Chromium. Cause : `capture()` ne vérifie pas `readyState ≥ 2` ; `checkedDataURL` ne contrôle que le format. Gravité **haute** (succès annoncé, fichier vide).
- **B11-2 — `csv-to-json`, `csv-to-excel`** : un CSV Windows-1252 (l'export « CSV (séparateur : point-virgule) » d'Excel FR, le plus courant) est lu en UTF-8 → accents remplacés par `�`, sans avertissement. Gravité **haute** (résultat faux silencieux). Remarque : `csv-to-excel` écrit les décimales `12,5` en texte, pas en nombre.
- **B11-3 — `csv-to-tsv`** : séparateur `,` codé en dur, pas de détection → colonnes fausses sur tout CSV à `;` (et « plausible mais faux »). Gravité **haute**.
- **B11-4 — `pdf-ocr`** : la recherche ignore les noms de langue dans leur langue (`français`, `español`…) et la saisie partielle française (`fran`). Gravité moyenne.
- **B11-5 — `pdf-ocr`** : la langue utilisée n'est pas celle que la liste filtrée affiche (état React ≠ option visible) → OCR dans la mauvaise langue sans le dire. Gravité **haute**.
- *Latent* — `sticky-notes` plante (écran d'erreur) sur une note mal formée en `localStorage` au lieu de l'ignorer. Faible.
Et les deux outils de données : **`xml-to-json`** (`b77f988b`, guillemets échappés invalides dans l'attribut JSX `description` : la page doit se charger sans erreur et convertir un XML avec attribut `id="5"` en clé `@_id`) ; **`excel-to-json`** (`adf0f1c5` : les noms de feuilles s'affichent dès la lecture du classeur, avant l'export ; un classeur à plusieurs feuilles donne un JSON indexé par nom de feuille — l'affirmation de l'audit « seule la première feuille est convertie » était fausse pour cet outil).

---

# 🟢 ADMINISTRATIF — sans condition

- **✅ Poids réel d'un déploiement — cause trouvée et corrigée le 22/09** (`RAPPORT-poids-deploiement.md`). Le mauvais diagnostic de la veille (« réduire le nombre de déploiements ») a été remplacé : la vraie cause était le **poids unitaire**, pas le nombre. Un vrai `next build` local a montré que les cartes de source serveur (`.js.map`) pesaient **64,2 Mo sur 141 Mo de `.next/server` (45 %)** — jamais servies à un visiteur. Réglage d'une ligne trouvé dans la doc Next.js embarquée (`experimental.serverSourceMaps: false`, distinct de `productionBrowserSourceMaps` qui vise le navigateur) : `.next` passe de **157 Mo à 89 Mo (-43 %)**, `.next/server` de 141 à 73 Mo. **Déployé (commit `3b201855`, `dpl_2x83tYtnNQ2N8Cmq6UPDCPHXo1st`), revérifié servir exactement les mêmes pages avant et après** (accueil, une page outil, une page catégorie, une redirection legacy). Marge de retour arrière ensuite réduite de 5 à 3 déploiements (production toujours vérifiée intacte). **Le pourcentage du tableau de bord Vercel (7,79 Go / 10 Go = 77,9 %) n'a pas bougé après ces deux actions, revérifié deux fois en direct** — probablement un chiffre agrégé à cadence quotidienne plutôt qu'en temps réel (non prouvé avec certitude). **Projection si le tableau de bord finit par refléter les 3 déploiements actuels : ≈ 267 Mo, environ 2,7 % du palier — à confirmer par une nouvelle lecture d'ici 1 à 2 jours, le chiffre officiel reste 77,9 % jusque-là.**
- **✅ Search Console — les 7 pages « de notre faute », URL relevées et diagnostiquées le 22/09 par Claude in Chrome (Indexation → Pages → chaque catégorie).** Aucune des 7 n'est cassée aujourd'hui ; détail par catégorie :
  - **3 « Introuvable (404) »** — `onlineconvertools.com/tools/yaml-to-json`, `/tools/epub-to-pdf`, `/tools/file-encryptor` (domaine nu, anciens chemins plats, derniers crawls 12-25 juillet 2026). **C'était une vraie panne à l'époque** : la table `lib/legacyRedirects.ts` qui les corrige a été créée le **31/08/2026**, après ces crawls. **Déjà corrigé, rien à faire côté code** — vérifié en direct : 200 en 2 sauts (apex→www puis ancien chemin→chemin catégorisé).
  - **3 « Page avec redirection »** — les 3 variantes non canoniques de la page d'accueil : `http://www.onlineconvertools.com/`, `http://onlineconvertools.com/`, `https://onlineconvertools.com/`, toutes → `https://www.onlineconvertools.com/`. **Comportement voulu** (canonicalisation standard de domaine/protocole) : Google signale exactement ce qu'on veut qu'il fasse — n'indexer que la version canonique. **Pas un défaut, rien à corriger.**
  - **1 « Erreur liée aux redirections »** — `https://www.onlineconvertools.com/tools/media-tools` (détectée 15/09, dernier crawl 12/09/2026). Vérifiée en direct : redirection légitime et fonctionnelle vers `/tools/video-tools` (`lib/legacyRedirects.ts` ligne 229), **un seul saut, 200 à l'arrivée, destination non bloquée par `robots.txt`**. **Aucune anomalie reproduite aujourd'hui** — cause la plus probable : un aléa transitoire au moment précis du passage de Googlebot (ex. décrochage/froid de fonction Vercel), pas un défaut permanent. Rien à corriger côté code faute de défaut reproductible.
  **Aucune URL saine retirée du sitemap ni passée en `noindex`.** **✅ 22/09 : validation demandée pour les 3 « 404 » uniquement** (accord explicite reçu) — Search Console répond « État de la validation : commencé, début 22/09/2026 ». **Aucune validation demandée pour les 3 « Page avec redirection » ni pour l'« Erreur liée aux redirections »**, comme convenu (rien à valider pour les premières, anomalie non reproduite pour la dernière).
- ✅ ~~Inscrire le service de détourage dans `REFERENCE-projet.md`~~ — fait le 19 septembre (service détourage, références croisées des deux Gotenberg, quotas lus).
- **✅ CLOS le 22/09 — indépendance de `gotenberg-v2` prouvée à 6 outils sur 6 ; `gotenberg-fonts` gardé, veille Serverless activée** (`RAPPORT-gotenberg-independance.md`). Les 8 variables encore référencées de `gotenberg-v2` (le 9ᵉ, `API_TIMEOUT`, était déjà propre depuis le passage à 240 s le même jour) ont été copiées en valeurs propres sans jamais être lues ni affichées (copie serveur à serveur via l'API GraphQL, seule la longueur en caractères a été journalisée) ; `gotenberg-v2` a été redéployé et vérifié en production avec de vrais fichiers sur les **6 outils** qui en dépendent : `excel-to-pdf`, `ppt-to-pdf`, `html-to-pdf`, `epub-to-pdf`, `mobi-to-pdf` — **et `word-to-pdf` sur son repli `.doc`**, prouvé avec un vrai `.doc` binaire fabriqué via LibreOffice installé localement (`soffice --convert-to doc:"MS Word 97"`, PASS en 1,3 s en production). **Tous les 6 passent.**
  **Décision du propriétaire, 22/09 : ne pas supprimer `gotenberg-fonts` maintenant.** Il tournait 24 h/24 sans une seule requête depuis 3 jours (coût réel mesuré ≈ 0,7-5,7 $/mois) : **la veille Serverless a été activée à sa place** (même mécanisme que le détourage), récupérant le coût immédiatement avec un retour arrière en un clic. **Vérifié par lecture directe du réglage** : `sleepApplication` lu `false` avant, mutation appliquée, relu `true` après. `gotenberg-v2` non touché (toujours actif sans veille, comme il se doit en production) et **revérifié servir la production normalement juste après** (le test `word-to-pdf`/`.doc` ci-dessus). **La suppression de `gotenberg-fonts` est reportée après le lancement**, une fois prouvé sur plusieurs semaines qu'il n'a servi à rien — voir le déclencheur correspondant plus bas.
- *(Historique, périmé par ce qui précède)* Deux services Railway font tourner la **même image au même digest** : `gotenberg-fonts` (historique) et `gotenberg-v2` (production depuis le 18 septembre). ⚠️ **NON VÉRIFIÉ — ne pas lire comme un fait établi (19 septembre 2026).** Que les variables de `gotenberg-v2` soient des références croisées vers `gotenberg-fonts` **est une hypothèse, pas un constat** : deux sources écrites l'affirment (ce plan, et `RAPPORT-gotenberg-versionne.md` ligne 138 — qui dit avoir ajouté les 9 variables par `${{gotenberg-fonts.NOM_VAR}}` **sans jamais lire leurs valeurs**), une source l'infirme (`RAPPORT-fidelite-office.md` ligne 23 : « aucune référence croisée », lecture d'API où une référence peut apparaître comme une valeur). **Aucune n'a été vérifiée contre l'état réel de Railway** ; cette ligne avait été recopiée de document en document. **Tentative du 19 septembre : impossible** — la CLI Railway n'est **pas installée** sur ce poste (absente du PATH et des emplacements usuels ; seul le dossier de configuration `~/.railway` subsiste), donc pas de lecture possible sans clic dans le tableau de bord, interdit. **⚠️ PÉRIMÉ le 20/09 :** la CLI s'utilise **sans installation** (`npx --yes @railway/cli`), l'authentification du 18/09 est valide et l'API GraphQL répond avec le jeton local — la lecture est donc **possible** (les réglages d'un service se lisent sans jamais toucher aux valeurs de variables). Elle reste **reportée après le lancement** (décision du 19/09) ; le filtre « noms seulement » reste obligatoire ; l'installation globale `npm i -g` évoquée plus bas est remplacée par `npx`. **Règle en attendant : traiter la dépendance comme réelle** (le coût d'une erreur est asymétrique : supprimer à tort tue la production Office → PDF). **Pour trancher :** installer la CLI (`npm i -g @railway/cli`, aval du propriétaire), puis lire les variables de `gotenberg-v2` **par un petit script qui n'imprime que le NOM et un booléen « la valeur commence par `${{` »** — ⚠️ la CLI, elle, imprime les valeurs : ne jamais lancer `railway variables` sans ce filtre, sa sortie contient des secrets. Résoudre les références en valeurs propres AVANT toute suppression. **Décision : le garder comme retour arrière tant que les correctifs de polices ne sont pas stabilisés en production.**
- **📌 DÉCISION du 19 septembre : la vérification des références croisées Gotenberg est REPORTÉE APRÈS LE LANCEMENT.** Elle ne sert qu'à décider de supprimer un service à ~2 $/mois qu'on a décidé de garder ; aucun risque ne pèse sur le lancement. Quand elle se fera : `npx @railway/cli` (sans installation — remplace l'installation globale évoquée ci-dessus), et **jamais sans un filtre qui n'affiche que les noms** (et un booléen « commence par `${{` ») — la CLI imprime les valeurs. En attendant, la dépendance reste traitée comme réelle et rien n'est supprimé.
- **Replis silencieux de `lib/quota/config.js` — 2 corrigés le 19 septembre, 8 restent (état réel lu, noms seulement).** `IP_RATE_LIMIT_PER_HOUR` / `_PER_DAY` : le code retombait sur 10/h et 30/jour (production : 30/h et 100/jour) ; **désormais une variable absente ou invalide fait échouer le build/démarrage** (`lib/quota/requiredEnv.js`, test `scripts/quota-tests/16-required-env.js`). **Les 8 autres constantes gardent leur repli.** État réel en production (`vercel env ls`, filtré sur les noms) : **présentes** `GLOBAL_SPEND_CAP_USD`, `USER_QUOTA_PDF_CONVERSIONS`, `USER_QUOTA_IMAGES`, `IP_RATE_LIMIT_PER_HOUR`, `IP_RATE_LIMIT_PER_DAY` (Production + Preview, **jamais Development**) ; **ABSENTES, donc tournant sur leur repli en production** : `TOOL_ERROR_RATE_LIMIT_PER_HOUR` (20), `TOOL_ERROR_RATE_LIMIT_PER_DAY` (100), `TOOL_ERROR_ALERT_THRESHOLD_PER_DAY` (10), `CONTACT_RATE_LIMIT_PER_HOUR` (5), `CONTACT_RATE_LIMIT_PER_DAY` (15). Ces 5 replis sont les valeurs voulues (justifiées dans les commentaires du fichier) : l'écart est de forme, pas de valeur. **Ordre obligatoire pour la suite (« B ») : créer les 5 variables dans Vercel D'ABORD, puis retirer les replis** — l'inverse casse le build. Détail et chiffrage : `RAPPORT-replis-quota.md`.
- ⏸️ **SCIEMMENT REPORTÉ (30/09) — veille Serverless de `pdf-tools`** : la raison d'origine (« ses outils sont Coming Soon ») est périmée — le service sert PDF Compress, PDF Repair et PDF to PDF/A en production depuis le 21-23/09 ; une veille ajouterait un réveil de plusieurs secondes au premier appel. À mesurer après le lancement, sur le coût réel de la facture Railway.
- **Supprimer à la main** `Downloads\fidelite-01..06.pdf` (verrouillés par Chrome) — **toujours présents le 20/09**.
- ✅ **`REMOVEBG_API_KEY` n'existe plus dans Vercel — vérifié le 27/09 par les noms seulement** (`vercel env ls --project onlineconvertools`, sans lien local : 36 variables, aucune ne contient `REMOVEBG`). Rien à supprimer. Le code n'en dépend pas : `REMOVEBG_PER_IMAGE_DOLLARS` et `MAX_REMOVEBG_*` sont des constantes de `lib/quota/config.js` et `lib/quota/limits.js`, pas des variables d'environnement.
- **Vérifier l'adresse de facturation des cinq fournisseurs** (Anthropic, Google Workspace, Railway, Cloudflare, OpenAI).
- ✅ **DPA ConvertAPI — N'EST PLUS UN BLOQUANT DE LANCEMENT (corrigé le 22/09).** Le document légal officiel de ConvertAPI, lu directement (`https://www.convertapi.com/compliance/dpa.pdf`, « Privacy Policy and Data Processing Terms », 7 février 2025 — pas un résumé de seconde main), dit noir sur blanc que ses conditions **s'appliquent déjà, automatiquement, sans signature** : la protection RGPD est donc déjà en place aujourd'hui. `help.convertapi.com` reste injoignable depuis ce poste, mais `convertapi.com` répond. Un DPA individuel signé reste utile (traçabilité contractuelle formelle) mais n'a plus d'urgence de lancement. **Contact officiel confirmé dans le document lui-même : privacy@convertapi.com** (DPO ConvertAPI, UAB, Vilnius, Lituanie). **Courriel prêt à envoyer rédigé dans `RAPPORT-gotenberg-independance.md` §5** (à adapter avec le nom exact de l'entité cliente et l'email du compte avant envoi). **Étapes quand tu voudras le faire (~15 min) :** ① se connecter au tableau de bord ConvertAPI, vérifier le palier tarifaire (Startup/49 $ et au-dessus inclut « Signed NDA & DPA », non vérifié pour ce compte) ; ② chercher une section « Contracts »/« Legal » dans le tableau de bord (signalée par une source indirecte, à confirmer à l'écran) ; ③ à défaut, envoyer le courriel préparé à **privacy@convertapi.com** ; ④ conserver la copie signée ; ⑤ noter la date ici.
- **Centraliser les notifications fournisseurs** vers `contact@onlineconvertools.com`.
- ✅ ~~`PROJET.md` obsolète et trompeur~~ — **supprimé le 23/09 sur décision du propriétaire.** L'inventaire réel est au bloquant 5 (le chiffre affiché est gardé par le build).
- ✅ ~~Supprimer `.claude\worktrees\quota-spend-infra`~~ — **supprimé le 28/09 (nuit)** : dossier **vide** (0 fichier, aucun `.git`, aucun travail non commité), absent de `git worktree list`. ~~Reste sur GitHub une branche distante `origin/worktree-quota-spend-infra`~~ → **supprimée le 28/09** : sa pointe `f3acb3b5` était déjà dans master (0 commit hors master) ; restaurable par `git push origin f3acb3b5:refs/heads/worktree-quota-spend-infra`.
- ✅ ~~Supprimer ou ignorer `_scratch_test_signup.mjs`~~ — **absent de la racine du dépôt** (vérifié le 20/09).
- ✅ ~~Ajouter sur l'écran post-inscription « et marquez-le comme non indésirable »~~ — **fait le 28/09 (nuit), en local** (`82e6b071`) : l'invitation valait seulement pour iCloud/Yahoo ; désormais pour tous : « Found it in spam or junk? Please mark it as “Not spam” (“Not junk” in iCloud, Yahoo and Outlook) and add us to your contacts… » — formulation courante (marquer « non spam » + ajouter l'expéditeur aux contacts). Non vu à l'écran (il faudrait créer un compte) : vérifié par la construction du site.
- **Envoyer le rapport de bug Claude Code** (14 sous-agents dupliqués — et, le 19 septembre, un **agent de fond qui a modifié trois pages d'outils sans autorisation**, puis émis un message « stop editing files » adressé à l'agent principal).

---

# ⏳ EN ATTENTE D'UN DÉCLENCHEUR

## Déclenchés par le calendrier

| Quand | Quoi |
|---|---|
| ✅ **Déclenché le 22/09 — le rapport Indexation a dépassé le 03/09, relevé au 17/09/2026** | **45 pages indexées sur 248, 203 non indexées.** Répartition des 203 : **192 « Détectée, actuellement non indexée »** — autorité de domaine, ne se corrige pas par du code, cohérent avec la position moyenne 74,7 déjà documentée ; **7 imputables au site, toutes relevées et diagnostiquées le 22/09 via Claude in Chrome** (voir ADMINISTRATIF) — aucune n'est cassée aujourd'hui : les 3 « 404 » étaient de vraies pannes avant le 31/08 (corrigées depuis par `lib/legacyRedirects.ts`), les 3 « Page avec redirection » sont des variantes non canoniques de l'accueil (comportement voulu), la 1 « Erreur liée aux redirections » (`/tools/media-tools`) fonctionne aujourd'hui en un seul saut propre (aléa de crawl probable, non reproduit). Aucune URL saine retirée du sitemap ni passée en `noindex`. |
| ✅ **Relu le 25 septembre** | Pourcentage de stockage Vercel — attendu ~2,7 % si l'hypothèse du recalcul quotidien est juste, 77,9 % sinon. **Lu le 25/09/2026 (Usage, 30 derniers jours, 26 août-25 sept.) : « Deployment Storage » 1,83 Go / 10 Go = 18,3 %** (et « Functions Storage » 1,52 Go, affiché à part). **Ni l'un ni l'autre** : le chiffre a bien baissé (77,9 → 18,3 %), donc il n'était pas figé et l'allègement du 22/09 a porté ; mais pas jusqu'aux ~2,7 % projetés, qui supposaient 3 déploiements seulement — des déploiements se sont ajoutés depuis (préversions et production des 23-25/09). Aucune action prise, conformément à la consigne. |
| **Le 24 de chaque mois** (prochain : **24 octobre 2026**) | Renouvellement Anthropic **Max** — passage du forfait Pro au forfait Max le 24/09/2026 (montant à relever sur la facture ; l'ancien Pro coûtait CA$ 32,19) |
| **6 juin 2027** | Renouvellement du domaine chez Cloudflare Registrar — US$ 10,98/an. **Si le domaine tombe, tout tombe.** |

## Déclenchés par le lancement

| Quand | Quoi |
|---|---|
| **Plusieurs jours AVANT** | Remonter Railway de **1 à 3 réplicas** sur **Gotenberg**, puis **retester les cinq outils**. ⚠️ Laisser le conteneur se stabiliser. |
| **Juste AVANT, en dernier** | Refaire la **galerie Product Hunt** (capture du 17 août). **Seule source de domaines référents prévue. Sa valeur est le lien, pas le trafic.** |
| **Juste APRÈS** | **Décider de la direction : référencement de niche ou B2B**, sur les données d'usage réel |
| **Juste APRÈS** | **Vérifier les références croisées Gotenberg** (`npx @railway/cli`, filtre noms seulement) · **Corriger les 8 replis restants (« B »)** : créer d'abord les 5 variables absentes dans Vercel |
| **Juste APRÈS** | **Vague 5 de l'audit** · **purge de `tool_errors`** au-delà de 90 jours · ~~les deux réserves du réviseur (IP falsifiable, compensation non atomique)~~ ✅ **faites le 29/09** sur `qualite-29-09` (IP lue seulement dans `x-real-ip`, écrit par Vercel ; réservations heure/jour atomiques par une fonction SQL) — **se déploient avec P13, migration SQL d'abord** |
| **AVANT (décision du 20/09)** | ~~D8~~ ✅ fait le 21/09 (voir 2 bis) · ~~signer le DPA ConvertAPI — « rendu plus urgent » (22/09, 21 h 29)~~ **✅ n'est pas un bloquant — tranché le 27/09** : ses conditions de traitement s'appliquent déjà sans signature (document légal relu en direct le 27/09, version du 07/02/2025 : *« unless the individual Data Processing Agreement is signed the terms of this Privacy Policy and Data Processing Terms will apply to all our processing »*). L'exposition a bien grandi depuis D8 (`.docx` et PDF jusqu'à 100 Mo par ConvertAPI) mais cela ne change pas le cadre légal ; un DPA signé reste un plus de traçabilité, **facultatif** (voir ADMINISTRATIF) · **trancher la saturation (dimensionnement du service ffmpeg et de Gotenberg) avant Product Hunt** · ~~décider `API_TIMEOUT` de Gotenberg~~ ✅ fait le 22/09 (240 s) · **décider du sort de `gotenberg-fonts`** (voir 2 bis, coût réel + recommandation) |

## Déclenchés par le trafic

| Quand | Quoi |
|---|---|
| **20 à 50 visiteurs/jour réels** | Demander **AdSense**. Pas avant. **✅ Tout est prêt depuis le 30/09, éteint** (`RAPPORT-prelancement-01-10.md` §3 : politique de confidentialité et conditions exactes, consentement certifié Google TCF v2.3 prévu, emplacement en bas des pages outils, `/ads.txt` généré) — **au propriétaire, ≈ 45 min** : ① compte AdSense (site `www.onlineconvertools.com`) ; ② AdSense → Confidentialité et messages → message « Réglementations européennes » (EEE, Royaume-Uni, Suisse) publié ; ③ un bloc d'annonce « Display » ; ④ dans Vercel (Production) `NEXT_PUBLIC_ADSENSE_CLIENT` = `ca-pub-…` et `NEXT_PUBLIC_ADSENSE_SLOT_TOOL_FOOTER` = l'identifiant du bloc, puis demander le redéploiement ; ⑤ vérifier le site dans AdSense (le code et `/ads.txt` seront en place). |
| **Le jour de la demande AdSense** | **Relire trois contrats** : ① Vercel **Hobby → Pro** (Hobby = usage **non commercial**) ② **Adobe PDF Services** palier gratuit ③ **OpenAI** |
| **Quand le volume d'erreurs devient lisible** | Décider de construire la **page d'administration des erreurs** |
| **Si PDF→Excel / PPT dépasse 500 transactions/mois** | Contacter le **commercial Adobe**. **Repli : ConvertAPI**, ~0,004 à 0,01 $/conversion. |
| ~~Si les refus à ≈ 4,5 Mo apparaissent dans `tool_errors`~~ | ✅ D8 fait le 21/09. **Nouveau déclencheur :** si des refus à 15 Mo (Excel) ou 100 Mo (Word/PowerPoint) apparaissent dans `tool_errors`, relever `API_TIMEOUT` puis la mémoire de la fonction (plan Vercel supérieur). |
| **Si le trafic justifie la fiabilité** | **Absence de repli sur les API d'IA** — une clé expirée fait tomber **15 outils** |
| **Si un e-mail retombe en indésirables** | Rouvrir la délivrabilité. La cause serait la **réputation du domaine**. |
| **Si le détourage dépasse ~1 600 images/mois** | Revoir le dimensionnement du service Railway et le coût par appel. |

## Déclenchés par un chantier précédent

| Quand | Quoi |
|---|---|
| 🧊 **GELÉ — trafic organique réel** | **Internationalisation**. Traduire une page en position 74 produit treize pages en position 74. |
| 🅿️ **PARQUÉ — si « Découverte » ne remonte pas 3 semaines après la baisse de fréquence des déploiements** | **Le paramètre `?dpl=`.** Mécanisme réel, **non prouvé sur Googlebot**. |
| **Si la couverture WebGPU dépasse ~90 %** | Envisager l'**hybride** pour le détourage. Aujourd'hui 70 %. |
| **Après plusieurs semaines de DMARC propres** | Reconsidérer `p=none` → `p=quarantine`. **Décision actuelle : ne pas durcir.** |
| **Quand une référence indépendante sera disponible** | Refaire la comparaison de fidélité contre **Adobe ou Microsoft** — FreeConvert et Online2PDF ne sont pas deux avis indépendants. |
| **Après plusieurs semaines post-lancement, si `gotenberg-fonts` ne s'est jamais réveillé** | **Trancher sa suppression** (veille Serverless activée le 22/09, `RAPPORT-gotenberg-independance.md`). `gotenberg-v2` est déjà indépendant (8 variables copiées en valeurs propres, prouvé à 6 outils sur 6) : la suppression est sans risque technique le jour venu, il ne manque qu'assez de recul pour confirmer qu'il ne sert vraiment à rien. |

---

# ⚠️ FRAGILITÉS CONNUES, ASSUMÉES

- **Zéro domaine référent.** Le concurrent en a 7 600. **C'est la cause première du classement en page 8, et ce que l'urgence ne peut pas accélérer.**
- **Le plafond de charge utile des fonctions Vercel est de ≈ 4,5 Mo.** **Mesuré le 19 septembre sur les routes Office (refus entre 4 412 819 et 4 517 676 octets), frontière affinée le 20/09 : 4 493 821 octets acceptés, 4 493 924 refusés.** Ces routes envoient du **multipart brut**. En revanche, tout outil qui encode en **base64** touche le mur dès **3,3 Mo de fichier réel** (inflation ×1,33) — c'est ce qui est arrivé deux fois. **Tout nouvel outil qui fait transiter un fichier par Vercel doit être conçu en le sachant.** ✅ **Mise à jour 21/09 :** ce plafond ne vaut plus que pour les requêtes DIRECTES (≤ 4 Mio) ; les six routes de documents passent au-dessus par l'envoi par morceaux (lib/media/staged.js). Le **plafond de réponse n'est PAS de 4,5 Mo** (un PDF de 10 Mo est renvoyé sans erreur, mesuré). **Nouveau plafond réel des documents : la mémoire de la fonction Vercel (~150-200 Mo).**
- **`RESEND_API_KEY` et `GOTENBERG_PASSWORD` sont signalées par l'API Vercel comme lisibles.** À basculer en variables sensibles si le plan le permet ; ne jamais les afficher entre-temps.
- **Un déploiement Railway qui plante ne fait pas tomber le service** — l'ancienne version reste servie, sans alerte.
- **Deux services Railway servent la même image Gotenberg**, **possiblement** liés par des références croisées de variables (**non vérifié**, voir ADMINISTRATIF).
- **Dépendance à des fournisseurs tiers qui peuvent disparaître.** Les mêmes questions valent pour **ConvertAPI, Adobe PDF Services et OpenAI**.
- **La navbar est à budget de largeur ZÉRO.**
- **Aucun repli sur les API d'IA** — une clé expirée fait tomber **15 outils**
- **Le câblage `try/catch` des quatre `route.ts` de quota n'est couvert que par revue manuelle**
- **Trafic réel : zéro**
- **Les agents de fond de Claude Code ont modifié des fichiers de production sans autorisation** (19 septembre). **Interdire la délégation à un agent de fond sur tout chantier qui touche au contenu du site.**
- **Claude Code a violé trois fois la consigne « aucune boucle de surveillance ni réveil planifié »** (deux fois auto-signalé et annulé ; **troisième fois le 22 septembre 2026, signalé par le propriétaire — « 11 monitors still running »**). **Cause exacte** : dans le chantier « plafonds-mesures », l'agent a utilisé l'outil `Monitor` (boucle `until <condition>; do sleep N; done`) comme substitut à l'attente directe — interdite par le harnais (`sleep` de premier plan bloqué, message d'erreur suggérant explicitement `Monitor` à la place) — pour des constructions Vercel, des déploiements, des scripts de test de bout en bout longs (150-400 s) et un changement d'heure UTC. Au lieu d'un seul appel `Monitor` par attente réelle, l'agent en a rappelé environ 84 au fil de la session, y compris en relançant une nouvelle surveillance après avoir déjà reçu la notification de fin de la précédente sur la même condition — recréant une boucle de sondage par un autre outil que `sleep`, exactement l'anti-patron que l'interdit vise. **Arrêt le 22/09** : `TaskStop` appelé sur les 84 identifiants de tâche `Monitor` retrouvés dans la session ; **les 84 ont répondu « No task found »**, donc aucune n'existait plus côté serveur au moment de l'arrêt — mais aucun outil ne permet à l'agent de lister l'état réel côté interface pour le confirmer lui-même ; **à vérifier par le propriétaire que le compteur affiché est retombé à zéro.** **Correction retenue pour la suite : un seul `Monitor` par attente réelle, jamais de nouvel appel après une notification déjà reçue pour la même condition, et préférer `run_in_background: true` sur `Bash` (notification automatique à la fin, sans sondage) chaque fois que c'est possible.**
- **Un commit a atterri sur master hors du flux de branche** (`a794284c`). Cause et prévention dans `RAPPORT-detourage-phase2.md` §12.

---

# ⛔ NE PAS TOUCHER — pièges déjà identifiés

- **⚠️ NE JAMAIS se fier au rapport « Indexation des pages » sans regarder sa date.** **La source fiable est « Inspection de l'URL », en direct.**
- **Ne JAMAIS piloter Railway au clic dans le navigateur.** 42 appels en 44 minutes, puis 2 h 15 pour quatre réglages. **Railway expose une CLI et une API GraphQL** : c'est par là qu'on passe. Le navigateur sert à lire un écran, jamais à cliquer en série.
- **Ne JAMAIS changer la branche d'un service Railway pour « tester ».** Les services Railway servent la **production** ; une session interrompue laisse le réglage en place sans alerte.
- **Ne JAMAIS bloquer `/_next/static/` dans `robots.txt`.**
- **Ne pas désactiver le paramètre `?dpl=`** sans avoir mesuré l'effet de la baisse de fréquence des déploiements.
- **Ne pas cliquer « VALIDER LA CORRECTION »** tant que rien n'a été corrigé.
- **Le sitemap est sain : 240/240 en 200.**
- **Le bug de navbar n'existe plus.**
- **`send.onlineconvertools.com` n'est PAS orphelin.** C'est le domaine d'enveloppe de Resend ; **c'est sur lui que SPF s'évalue**.
- **La clé anonyme Supabase visible dans le JS de production est publique par conception.** Fausse alerte levée deux fois.
- **Les variables Vercel de type Secret sont en écriture seule** : `vercel env pull` les relit **vides**. Fausse alerte rencontrée trois fois.
- **Dans Railway, ajouter une variable ne suffit pas** — il faut cliquer **« Deploy Changes »**.
- **L'`ignoreCommand` de `vercel.json` annule les redéploiements d'un commit qui ne touche que `docs/**` ou `*.md`.** Ce n'est pas une panne. Contourner au cas par cas, ne jamais modifier le réglage du projet.
- **Ne pas ajouter de policy RLS « admin »** sur `usage_counters`, `usage_events`, `contact_messages`.

---

# ✅ CLOS — avec preuve

| Chantier | Preuve |
|---|---|
| **Sitemap Search Console — tâche retirée le 27/09, NE PLUS JAMAIS LA REPOSER** | Le propriétaire a vérifié plusieurs fois : **il n'existe qu'un seul sitemap dans Search Console, celui en `www` (240 URL)**. La tâche « supprimer le sitemap en double » reposait sur un doublon qui n'existe pas. |
| **Outils mis en avant : 10 résultats faux silencieux (22/09)** | 36 outils ouverts avec de vrais fichiers en production ; 10 corrigés (`30235fe7`, `8b5d5645`, `609ba261`, `46306611`, `bf533569`), tests unitaires sur les entrées fautives, `verify-fixes.mjs` 16/16 sur préversion puis 16/16 en production (`dpl_BXrZoKXq`, 22/09). Écarts de qualité/couverture : chiffrés, en attente (bloquant 5). |
| **Promesses de fidélité Office → PDF** | *« professional-quality »* retiré des **5 outils**, remplacé par des formulations adossées à des mesures écrites ; `<meta description>` corrigées ; substitution de police divulguée sur `ppt-to-pdf`. **Vérifié sur le HTML servi en production.** Corpus reproductible versionné. |
| **Gras Excel (D1)** | Cause réelle identifiée (polices `.xlsx` sans nom), `lib/xlsxDefaultFont.js` + test, **Carlito-Bold en production**, au niveau des deux concurrents. |
| **Repli silencieux `pdf-to-word` (D6)** | **503 avec message clair** au lieu d'un texte brut rendu sans le dire. |
| **Gotenberg versionné** | Image épinglée `8.36.0@sha256`, polices Carlito/Caladea/Liberation Sans Narrow/**Selawik**, empreintes vérifiées au build. |
| **Détourage — fournisseur remplacé** | Service auto-hébergé Railway, IS-Net Apache-2.0, qualité dans la dispersion du marché, 1,1-3,7 s/image, 0,00 $/mois à trafic nul, 401 sans clé prouvé, fichiers jusqu'à 50 Mo et 74 mégapixels. |
| **Bug de débordement navbar** | 8 largeurs de 1024 à 1536 px : **0 px partout**. |
| **Plafond `pdf-translate` déclaré** | Motif d'`audio-to-text` reproduit, avant l'upload (`c6ae956a`). |
| **Déploiements inutiles supprimés** | `ignoreCommand` dans `vercel.json`. **6/30 (20 %)** ne touchaient que `docs/*.md`. |
| **Métadonnées des 7 pages manquantes** | `next build` : **247/247, 0 erreur**. |
| **Les pages du site sont acceptées par Google** | Demande manuelle → **indexées en moins de 2 minutes**. 10 catégories sur 12 confirmées. |
| **Diagnostic technique d'indexation** | `RAPPORT-indexation.md` (`21374d83`). |
| **Délivrabilité — SPF, DKIM, DMARC** | MxToolbox tout vert, **message réel en boîte de réception**. |
| Redirections des anciennes adresses | 202 URL mortes en 301 (`f0ab1ddc`) |
| Surveillance et alertes | `CRON_SECRET` régénéré, deux canaux isolés, testé de bout en bout |
| Système de quotas | Trois couches. 10 requêtes simultanées contre un quota de 5 → exactement 5 passent |
| Tests de quota (4 scripts) | Tous PASS le 6 septembre |
| Rotation des secrets exposés | ConvertAPI, OpenAI, Supabase |
| Audit de confidentialité | 198 pages « traitement local » croisées avec 27 pages à appel réseau → **zéro contradiction** |
| Authentification | Quatre parcours testés en réel |
| Carte bancaire chez les cinq fournisseurs | Fait |
| Audit de couverture, vagues 1 à 4 | `50527805`, `b77f988b`, `eaddc44e`, `4fe2d182`, `a1c826be`, `990b99a3` |
| Blocage TIFF | Web Worker, délai de 20 s **mesuré**, annulation (`036bf63f`) |
| Neuf profondeurs de bits TIFF | 4 à 32 bits (`d4084c8e`) |
| Remontée automatique des échecs | 19 outils instrumentés (`07434b1a`) |
| Détection du format réel | Extension mensongère → message clair + lien vers le bon outil |
| Plantage après téléchargement | Correctif au niveau du site (`ab77de51`) |
| Pièces jointes du formulaire de contact | Images seules, **jamais stockées** (`8ab7fcf0`) |
| Persistance du formulaire de contact | Échec d'insertion alerté et journalisé (`28ad556b`) |

---

# LA DOCTRINE DE VÉRIFICATION

**0. La règle zéro : mesurer avant de construire.** **La couche la plus rentable.**

**1. Lecture du code et comparaison au marché.** Vérifier dans le code que l'écart existe **avant** de corriger — le tableau d'audit se trompe une fois sur trois.

**2. Tests avec de vrais fichiers téléchargés.** La couche la plus productive. **« Listé » n'est jamais « prouvé ».**

**3. Navigateur, sous condition stricte.** Uniquement pour ce qui n'existe que dans un navigateur.

**4. Réviseur indépendant, calibré sur le risque.** **A payé cinq fois sur le seul chantier de détourage**, dont deux documents juridiques qui disaient faux.

**5. Le passage manuel du propriétaire.** Irremplaçable.

**6. La remontée automatique des échecs.** En production depuis le 10 septembre.

**7. Les données Search Console — avec leur date.**

> ### ⚠️ LES LEÇONS
> ① Un tableau de bord a une date. La lire avant d'en tirer une stratégie.
> ② Un mécanisme réel peut ne pas s'appliquer à l'acteur concerné.
> ③ Un bloquant qu'on ne revérifie pas reste ouvert même après avoir été réglé.
> ④ Vérifier que le fournisseur existera encore.
> ⑤ Un service qui répond n'exécute pas forcément ton code.
> ⑥ Mesurer la mémoire, pas seulement le temps. Le mot « lite » dans un nom de modèle ne veut rien dire.
> ⑦ **Un outil mal choisi coûte plus cher qu'un travail mal fait.** Deux heures de clics sur Railway pour quatre réglages qu'une ligne de commande fait en secondes.
> ⑧ **Une doctrine que l'exécutant ne peut pas lire n'existe pas.** Ce document a vécu des semaines hors du dépôt, invisible de Claude Code.
> ⑨ **Une cause « probable » n'est pas une cause.** D1 et D2 avaient tous deux une hypothèse plausible : les deux étaient fausses. Vérifier la cause avant de corriger.
> ⑩ **Le plafond qu'on annonce doit être celui qu'on tient.** 25 Mo annoncés, ≈ 4,5 Mo réels, et un message d'erreur qui ne dit rien.
> ⑪ **Un échec silencieux qui affiche « réussi » est plus grave qu'une panne visible**, parce que l'utilisateur repart avec un fichier faux et ne revient jamais. Un outil n’annonce jamais un succès sans avoir vérifié que la sortie existe et n'est pas vide, nomme le fichier d'après le type réel du blob produit, et dit AVANT l'usage qu'un format est impossible.

---

# LES INTERDITS PERMANENTS DANS LES PROMPTS

1. Ne jamais afficher `.env.local`, `.env` ou tout fichier d'environnement. Seuls les **noms** de variables. **Ne jamais montrer un secret en capture d'écran** — une clé affichée est grillée.
2. Ne jamais générer un secret à la place du propriétaire.
3. Ne jamais ajouter de **valeur de repli silencieuse** dans un fichier de production.
4. Ne jamais modifier un fichier de production pour contourner un problème d'environnement local.
5. Ne jamais supprimer ni renommer un outil sans accord explicite préalable.
6. **Ne créer aucune boucle de surveillance ni réveil planifié** — 3,7 millions de tokens mesurés.
7. **Tout changement de schéma de base passe AVANT le déploiement du code qui l'utilise.**
8. **Tout test qui soumet un formulaire ou déclenche une opération payante se fait sur une préversion.**
9. Vérifier chaque ligne du tableau d'audit dans le code avant de corriger.
10. Avant de conclure « la plateforme ne sait pas faire », vérifier que le code n'interroge pas le mauvais composant.
11. Ajouter systématiquement : *« Écris aussi ton rapport final dans `docs/audit/RAPPORT-<chantier>.md` et commite-le. »*
12. **Les plafonds ne se lèvent pas, ils se déclarent** — avant la sélection du fichier.
13. **Ne jamais poser un `noindex` ni retirer du sitemap une URL saine sans accord explicite.**
14. **Vérifier la licence de tout modèle ou police avant de l'intégrer.** *(A éliminé 2 modèles sur 5 ; a validé Liberation Sans Narrow et Selawik.)*
15. **Avant d'intégrer ou de payer un service tiers, vérifier en direct qu'il ne ferme pas.**
16. **Ne jamais changer la branche d'un service Railway pour tester.**
17. **Ne jamais créer un second compte chez un fournisseur pour récupérer un quota gratuit.**
18. **Ne déléguer aucun travail sur le contenu du site à un agent de fond.**
19. **Plus de vingt minutes sans progrès mesurable = mauvaise approche.** S'arrêter et expliquer, jamais recommencer.
20. **Ne jamais réécrire une promesse avant d'avoir la mesure qui la soutient.**

---

# HYGIÈNE DE SESSION

- **Branche + balise de restauration avant le premier commit** de tout chantier ; `git checkout -b` vérifié juste après la balise (une balise seule a déjà laissé deux commits atterrir sur master)
- **`/clear` entre deux chantiers** · **une session Claude Code neuve par chantier**
- **Lire ce document au début de chaque chantier** — il est dans le dépôt depuis le 19 septembre 2026
- **Prompts ciblés** : nommer le répertoire et la section utile
- **Écrire l'avancement dans le dépôt au fil de l'eau** (`docs/audit/PROGRESS-<chantier>.md`)
- **Vérifier `/usage` avant un chantier long**
- **Permissions** : `.claude/settings.json` porte `deny` sur les `.env` et `ask` sur `rm`, `git push --force`, `vercel env`, `supabase db` ; `~/.claude/settings.json` porte `defaultMode: "auto"`. Dans Claude in Chrome, répondre **2** (*« Allow all actions on ce site for this session »*), jamais 1.

---

# ANNEXE A — la carte des moteurs

| # | Moteur | Où | Outils |
|---|---|---|---|
| 1 | pdfjs-dist (texte seul) | Navigateur | 3 |
| 2 | Gotenberg / LibreOffice | Serveur | 2 |
| 3 | Gotenberg / Chromium | Serveur | 2 |
| 4 | ConvertAPI | Serveur | 2 |
| 5 | pdf-tools-service (Ghostscript, qpdf, veraPDF) | Serveur | 2 |
| 6 | **MediaRecorder** | Navigateur | 6 en service (`voice-recorder`, `screen-recorder`, `video-filter`, `video-merger`, `video-resizer`, `video-rotator`) + 2 en repli d'interrupteur (`video-compressor`, `video-converter`, passés sur le service ffmpeg le 20/09) — relevé dans le code le 20/09 |
| 7 | ffmpeg.wasm | Navigateur | 10 (dont `video-trimmer`, ajouté le 19-20/09 ; relevé dans le code le 20/09) |
| 8 | gifenc | Navigateur | 7 |
| 9 | Web Audio → WAV | Navigateur | 2 |
| 10-12 | OpenAI (texte, vision, Whisper) | Serveur | 16 |
| **13** | **IS-Net general-use (ONNX) — service Railway auto-hébergé** | **Serveur** | **1 — remplace remove.bg** |
| 14 | heic2any | Navigateur | 2 |
| 15 | Tesseract.js | Navigateur | 1 |
| **16** | **ffmpeg natif — service Railway `media-processing`** | **Serveur** | **2** (`video-compressor`, `video-converter`) — depuis le 20/09. **Sert aussi de stockage d'envoi pour 11 outils de documents et d'audio depuis le 21/09 (type de job `stage`)** |
| **17** | **`@jsquash/avif` (encodeur WebAssembly)** | **Navigateur** | **1** (`image-converter`, sortie AVIF) — depuis le 20/09 |
| **18** | **pikepdf + `tx` d'Adobe (AFDKO) — service `pdf-tools`** | **Serveur** | **1** (`pdf-compress`, jusqu'à 200 Mo) — depuis le 23/09. Ghostscript **écarté par la mesure** : sa réécriture perd une figure vectorielle |
| **19** | **MozJPEG / OxiPNG / libwebp (`@jsquash`) + quantifieur de Wu (`image-q`)** | **Navigateur** | **1** (`image-compressor`) — depuis le 23/09 |
| **20** | **MoSR 4xNomos2_hq (ONNX) — service d'images Railway** | **Serveur** | **1** (`image-upscaler`, x2/x4, ≤ 1 Mpx) — depuis le 23/09 |
| **21** | **gpt-image-2 (OpenAI)** | **Serveur** | **1** (`image-generator`) — depuis le 23/09, budget propre 5 $/mois |
| 4 bis | ConvertAPI | Serveur | passe de 2 à **4** outils (`pdf-to-excel`, `pdf-to-ppt` le 23/09) |
| 16 bis | ffmpeg natif `media-processing` | Serveur | + **5 outils GIF** (options début/durée/largeur/i/s) et l'Opus d'`audio-converter` (libopus) — 23/09 |

**Le fait central de l'audit :** la cause dominante des écarts n'est ni la technologie ni le budget, c'est **le bon moteur déjà présent dans le dépôt et simplement pas branché** — ou, comme pour le détourage, pas envisagé au bon endroit.

# ANNEXE B — charger un secret sans le laisser en trace

**Générer un secret sans jamais l'afficher** — il part directement dans le presse-papiers :

```powershell
$b = New-Object byte[] 32; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); [Convert]::ToBase64String($b) | Set-Clipboard
```

Charger des variables dans une session PowerShell, sans trace disque :

```powershell
Get-Content .env.local | ForEach-Object {
    if ($_ -match '^(NEXT_PUBLIC_SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY)="?([^"]*)"?$') {
        [System.Environment]::SetEnvironmentVariable($matches[1], $matches[2], 'Process')
    }
}
```

⚠️ Les scripts de `scripts/quota-tests/` touchent le **vrai** compartiment `global_spend_microusd`.

---

# ANNEXE C — repères du marché, septembre 2026

| Site | Ce qu'il prouve |
|---|---|
| **FreeConvert** — 7 600 domaines référents, DR 77, 11,4 M visites/mois · **plafond annoncé 1 Go** | L'écart de liens entrants est l'obstacle réel. Trafic mondial : Indonésie 19 %, Inde 15 %, États-Unis 14 %. |
| **Online2PDF** — **plafond annoncé 150 Mo** | ~33× notre plafond réel de ≈ 4,5 Mo. |
| **Adobe `pdf-to-word`** — 385 000 visites/mois | **Une seule page** peut porter un site entier. |
| **Omni Calculator** — 2,3 M visites/mois | Un site de **calculateurs** purs atteint ce niveau. |
| **Coolors** — 340 500 visites/mois sur un générateur | Un outil unique bien ciblé bat un catalogue. |
| **Détourage** — remove.bg 12 Mo · PhotoRoom 50 Mo · Leonardo.Ai 0,1047 $/image | Plafond retenu : **50 Mo**. |
| **Fidélité Office → PDF** — FreeConvert et Online2PDF à **0,1-0,24 % de pixels d'écart** de nous sur `.docx` | Nous sommes au niveau du marché gratuit sur la fidélité. **L'écart n'est pas là, il est sur la taille de fichier acceptée.** |

**La règle qui en découle :** viser les requêtes de niche à faible difficulté (KD ≤ 30), jamais les termes génériques tenus par des sites à DR 77.

---

# CRITÈRE DE LANCEMENT

## 🏁 LIGNE D'ARRIVÉE — tout ce qui reste avant le lancement (établi le 27/09)

**Ce que seul le propriétaire peut faire** (durées estimées, pas mesurées)

| # | Quoi | Durée |
|---|---|---|
| P0 | ✅ **FAIT le 28/09 — en production `77a47594`**, préversion puis www vérifiés sous Chromium, Firefox, WebKit (238 pages + toutes les suites ; `RAPPORT-deploiement-28-09.md` §1). *(Énoncé :)* **Déployer les correctifs de la nuit du 28/09** : branche prête **`deploiement-nuit-28-09`** (tout sauf le correcteur de grammaire, remis comme en production ; 17 suites passées) — préversion, puis production ; détail commit par commit dans `docs/audit/RAPPORT-nuit-27-09.md` §3 | ≈ 30 min + ma vérification |
| P1 | **Passe Safari réelle** — **30/09 après P16 : à faire sur iPhone — outils image avec des photos de 24 et 48 Mpx (Brightness & Contrast, Blur, Inverter, Sepia, Grayscale, Rotate, Cropper, PNG to JPG, JPG to WebP, Image Converter, Background Remover, Compressor, Resizer) + 9, 10, 25, 30, 36, 39 ; sur le Mac : J, K, L, 9, 10, 25, 30, 36, 39 (liste exacte : rapport P16)** — **29/09 : iPhone fait (RÉUSSI 1-8, 11, 13, 15, 31, 34, 39 ; ÉCHOUÉ 9, 10, 25, 30, 36 → défauts A-I corrigés en local le 30/09, P15) ; à refaire sur iPhone après P15 : 9, 10, 25, 30, 36, 39 ; Mac 9 à 30 et séance E en cours (safaridriver)** — *(historique :)* **tests 1 à 8 FAITS le 28/09** (iPhone + MacBook ; défauts 1a-1f traités la nuit suivante, voir bloquant 9) ; **reste : tests 9 à 30** après le déploiement 2 (feuille §9) — iPhone : 9, 10, 11, 13, 15, 25, 30 et la coupe précise du n° 4 ; MacBook : le reste ; puis retest 1a, 1b, 1c, 1e. **Ajouté le 29/09 (après P13)** : sous Safari réel, Brightness & Contrast et Image Blur (calcul au pixel quand `ctx.filter` manque), Video Filter (refus clair), Audio Equalizer (le WebKit de Playwright n'a pas de Web Audio : non testé), JPG to PDF avec une photo portrait d'iPhone | ≈ 2 h |
| P7 | ✅ **FAIT le 29/09 — en production `2cc1848d`** (fusion sans poussée forcée ; préversion `onlineconvertools-1olof8w9d` : night-28-09, download-ready, global-28-09, sonde HTML/EPUB/MOBI → PDF ALL PASS ×3 moteurs ; www : 238 pages Chromium propres, night-28-09 ALL PASS, Firefox HTML/EPUB/MOBI → PDF 3/3 `%PDF-`, boutons de téléchargement ALL PASS ; `RAPPORT-deploiement-29-09.md`). *(Énoncé :)* **Déploiement 2 + travail de la nuit du 28 au 29/09, ensemble, devant le propriétaire** : branche `licence-ameliorations`, repère de retour `restauration-avant-deploiement2-28-09` (= `03f34e53`). Déploiement 2 vérifié sur la préversion `lwawb2a6h` (`RAPPORT-global-28-09.md`) ; le travail de la nuit est testé **en local seulement** (`RAPPORT-nuit-28-09.md`) → préversion, puis fusion **sans poussée forcée**, puis vérification sur www. **Règle permanente depuis le 28/09 : aucune mise en production sans que le propriétaire la demande dans le terminal.** **✅ Réserve Firefox (HTML/EPUB/MOBI → PDF) levée le 29/09** : non reproduite en 5 configurations (www ×3 moteurs, build local direct et par le relais, préversion `lwawb2a6h` par le relais, dont le test d'origine 10/10) ; la route est identique à la production ; le déploiement 2 est sûr sur ces 3 outils (`RAPPORT-croissance-29-09.md` §1). Garder Firefox sur ces 3 outils dans la vérification sur www. | ≈ 1 h 30 |
| P8 | ✅ **APPROUVÉ par le propriétaire le 29/09 : 3 réplicas Gotenberg**, à lancer **plusieurs jours avant la date de lancement (non fixée)** ; le coût (≈ **+16 $/mois tant qu'ils tournent**, ≈ 8 $/mois par réplica au repos, mesuré le 28/09) **lui sera notifié avant**. Exécution : C3. | 5 min |
| P9 | ✅ **FAIT le 29/09 par le propriétaire** : 152 lignes supprimées, recomptage 0, contrôle 3. *(Énoncé :)* **Purge SQL de `tool_errors`** : `docs/audit/tool_errors-purge-28-09.sql` dans Supabase → SQL Editor (compter 152, supprimer, contrôle = 3) | 5 min |
| P2 | ✅ **CLOS le 28/09** : sept tests exécutés, test 7 lu en base par le propriétaire (PASS), B11-1 à B11-5 corrigés et en production. *(Énoncé :)* **Tests manuels du bloquant 11** — ~~contrôles de la vague 1~~ **automatisés et passés le 28/09 (12/12, Chromium + Firefox)** ; reste la feuille des « sept tests », **absente du dépôt : à me fournir** pour que j'en automatise ce qui peut l'être | 5 min (me la donner) + ce qui exige un humain |
| P3 | **Trancher la saturation** sur la proposition chiffrée de Claude (`RAPPORT-seance-27-09.md` §4), puis donner l'accord pour le test de charge contre la production | 15 min + 1 h de présence pendant le test |
| P4 | ✅ **Tranché le 28/09 : H1 appliquée**, 40/h (Production + Preview), jour inchangé à 60 ; prouvé sur www (40 billets, le 41ᵉ refusé). *(Énoncé :)* **Trancher la limite de 20 conversions/heure/connexion** — comparaison faite le 28/09 (C4), recommandation H1 : 40/h, jour inchangé | 10 min |
| P5 | 🟡 **30/09 : kit mis à jour** (faits prouvés depuis le 29/09 : AI Detector 0/57 et 40/40, photos de 48 Mpx sous la limite iPhone, flou < 5 s, coupe à l'image ; « about 175 » recompté par `scripts/count-server-tools.mjs` au lieu de « about 180 », périmé depuis P15) et **galerie de 10 images régénérée du build local de `prelancement-01-10`** (`RAPPORT-prelancement-01-10.md` §4). Reste inchangé : régénérer sur www juste avant (étape 11 du tableau de tête). *(État du 29/09 :)* 🟡 **PRÉPARÉ le 29/09** : kit complet `docs/lancement/product-hunt.md` (règles relues en direct, 4 lancements comparables et leur moyen, tagline validée, description, premier commentaire, 8 légendes) et **galerie de 8 images 1270×760 + vignette 240×240** (`docs/lancement/galerie/`, captures du build local, chiffres mesurés pendant la capture). **Reste, juste avant le lancement :** régénérer sur www (`node docs/lancement/galerie.mjs https://www.onlineconvertools.com`) et regarder les 8 images | ≈ 15 min (au lieu de 2 h) |
| P10 | **Relire et compléter le premier commentaire Product Hunt** (`docs/lancement/product-hunt.md` §4 : passages ⟦…⟧ personnels, rien inventé) ; choisir le jour le moment venu (heure : 00 h 01 PT) ; le jour J, répondre à chaque commentaire | ≈ 20 min + le jour J |
| P11 | **Soumissions de liens, dans cet ordre** (textes prêts dans `docs/lancement/sources-de-liens.md` §3 ; aucun achat, rien que du gratuit) : ① **Show HN** (compte HN ; ne demander à personne de voter) ; ② **courriels aux bibliothécaires** des 6 guides LibGuides repérés (lien suivi prouvé) ; ③ **presse tech** (MakeUseOf, How-To Geek, Lifehacker) **après** un Show HN ou un Reddit réussi ; ④ **r/InternetIsBeautiful** ; ⑤ **AlternativeTo** ; ⑥ **SaaSHub** ; ⑦ PR sur **awesome-no-upload-browser-tools** et ⑧ **awesome-privatool-fot** (outils locaux seulement) ; ⑨ **r/SideProject** ; ⑩ **r/webdev** le samedi ; ⑪ article **dev.to** ; ⑫ **awesome-gif** ; ⑬ **Stack Overflow / Super User** (affiliation déclarée) ; ⑭ Indie Hackers ; ⑮ Uneed ; ⑯ Fazier ; ⑰ MicroLaunch ; ⑱ Peerlist ; ⑲ DevHunt ; ⑳-㉒ There's An AI For That, Toolify, Futurepedia (outils IA réels seulement) ; ㉓ Slant ; ㉔ Launching Next / StartupStash | ≈ 3-5 h réparties |
| P12 | ✅ **FAIT le 29/09 — en production `ceb538f3`** (repère `restauration-avant-croissance-29-09` = `2cc1848d` ; préversion `onlineconvertools-ni0vwkf67` : seo-pages-29-09 ALL PASS ×3 ; www : 238 pages Chromium propres, les 10 pages ALL PASS, SQL to CSV multi-lignes + apostrophe MySQL justes). ✅ **Indexation demandée le 29/09 par le propriétaire pour les 10 pages** (état avant demande : `percentage-calculator` déjà indexée dans son ancienne version → réindexation demandée ; les 9 autres n'étaient **pas** indexées). **Reste : relever leur position dans Search Console 4 à 6 semaines après, soit entre le 10 et le 24 novembre 2026** (voir bloquant 1). *(Énoncé :)* **Déployer `croissance-29-09` APRÈS le déploiement 2** (P7) : elle part de `licence-ameliorations` et ajoute 10 pages travaillées pour Google, 2 correctifs de SQL to CSV et le kit de lancement (`RAPPORT-croissance-29-09.md`) ; préversion, fusion sans poussée forcée, vérification sur www ; **puis demander l'indexation** (Search Console → Inspection de l'URL → « Demander une indexation ») des 10 pages listées au bloquant 1 | ≈ 45 min |
| P13 | ✅ **FAIT le 29/09 — en production `48ce5d81`** (migration SQL exécutée d'abord par le propriétaire, contrôles conformes ; repère `restauration-avant-qualite-29-09` = `ceb538f3` ; préversion `onlineconvertools-rn1wvjhpe` : `report-error` 204 par la nouvelle fonction, banc qualité 76/76 Chromium, 76/76 Firefox, 75/75 WebKit ; www : 238 pages Chromium propres, PDF chiffré dans pdf-merge relu, minifieur JS sans point-virgule, File Encryptor AES + ancien fichier XOR relu à l'octet, Excel to JSON dates et émojis, limite de 40 billets/h atteinte puis refusée, fausse IP sans effet). *(Énoncé :)* **Déployer `qualite-29-09` APRÈS `croissance-29-09`** (P12) : elle part de `croissance-29-09` et ajoute l'audit du 29/09 (84 outils corrigés, dont 68 résultats faux silencieux ; 10 outils PDF sur les PDF chiffrés) et les deux réserves du réviseur (`RAPPORT-qualite-29-09.md`). **① D'ABORD la migration SQL** (interdit n° 7 : le schéma avant le code) : ouvrir `docs/audit/migration-quota-atomique-29-09.sql` dans Supabase → SQL Editor ; exécuter la section BEFORE (attendu : les 3 fonctions existantes, pas la nouvelle), puis MIGRATION (transaction + `notify pgrst`), puis AFTER (attendu : `service_role_can_execute = true`, `anon`/`authenticated` = false ; appels de test (a) allowed, (b) refusé sans rien changer ; nettoyage `DELETE 2`). Additive : le code actuellement en production continue de fonctionner après. **② ensuite** préversion, fusion **sans poussée forcée**, vérification sur www (238 pages ×3, `scripts/browser-tests/qualite-29-09.mjs` ×3). Déployé AVANT la migration, chaque route à limite échouerait **fermée** (503 / erreur, aucune dépense). | 10 min (SQL) + ≈ 45 min |
| P17 | ✅ **FAIT le 30/09 — en production `5969cdb1` (AI Detector) puis `9d0f7e71` (Image Blur + Video Rotator)** (`docs/audit/RAPPORT-p17-30-09.md`). AI Detector par Pangram, budget propre 50 $/mois hors plafond global, 2 000 mots gratuits/jour/visiteur ; corpus 97 textes : **0/57 humain dit IA, 40/40 IA reconnues** ; dépense Pangram ≈ 9,40 $, **crédits restants ≈ 15,60 $** (à confirmer au tableau de bord Pangram). Image Blur sur le GPU sous Safari (www, WebKit, simulation iPhone : 1,5 / 2,3 / 4,7 s à 12 / 24 / 48 Mpx, contre 44 / 69 / 160 s sur le Mac avant) ; Video Rotator « Compatible everywhere » (par défaut) / « Instant, lossless ». **Reste : ① `node scripts/ai-detector/www-check-p17.mjs` à partir du 01/10 00 h 00 UTC (**prêt tel quel, `548b74bc` : lançable depuis le dossier du dépôt, « NOT RUN » code 2 si la limite du jour n'est pas encore remise à zéro — étape 2 du tableau de tête, propriétaire, ce soir après 20 h**) (LIGO + texte d'IA sur www, ≈ 0,25 $ ; rejoué le 30/09 à 03 h 51 UTC : encore refusé par la limite du jour, 0 $) ; ② ligne parasite de `docs/audit/tool_errors-purge-28-09.sql` retirée par le propriétaire, absente de tout commit et de toute branche (vérifié par git, rapport §5) — **changer ce mot de passe** ; ③ Safari Mac + iPhone : Blur 12/24/48 Mpx, Rotator deux modes (rapport §Tests à refaire).** *(Ancien énoncé :)* 🟡 **30/09 : clé `PANGRAM_API_KEY` posée par le propriétaire (Vercel, Production + Preview, vérifiée par son nom) ; page reliée à Pangram en local, bancs 7/7 ×3 moteurs. RESTE : demander poussée + préversion + mesure du corpus avec Pangram (≈ 10 $ de crédits Pangram) + mise en production.** *(Énoncé :)* 💶 **AI Detector — décider Pangram (coût notifié : ≈ 15 $ / 150 $ / 1 500 $ par mois pour 100 / 1 000 / 10 000 analyses)** ; créer le compte et la clé `PANGRAM_API_KEY` (Vercel, Production + Preview) ; relever le plafond global si besoin ; puis demander la mise en service. Indépendamment : demander le déploiement du palliatif (seuil 0,93, branche `ai-detector-30-09`) qui supprime le faux positif grave mesuré en production. `RAPPORT-ai-detector-30-09.md`. | 15 min |
| P14 | ✅ **FAIT le 29/09 — en production `828cfe75`** (repère `restauration-avant-qualite-2-29-09` = `0b67804b` ; préversion `onlineconvertools-hy8vmu22r` : bancs Chromium 76/76, Firefox 75/75, WebKit 67/67 exécutables + 7 impossibles dans le WebKit de Playwright ; www : 238/238 Chromium, contrôles ciblés tous PASS ; `docs/audit/RAPPORT-deploiement-qualite-2-29-09.md`). *(Énoncé :)* **Déployer `qualite-2-29-09`** (audit n° 2 du 29/09, `docs/audit/RAPPORT-qualite-2-29-09.md` : 57 outils corrigés dont 30 résultats faux silencieux, 1 faille). Branche locale partie de `master` (`0b67804b`), 7 commits, **aucune migration SQL, aucune variable d'environnement nouvelle**. Étapes, à la demande du propriétaire dans le terminal : repère de restauration sur `master`, poussée de la branche, préversion (`--no-vercel-toolbar` pour les bancs), bancs `image/gif/pdf/av/misc-audit-2.mjs` ×3 moteurs sur la préversion (le service IA et le service de rendu restent joués par les bancs : aucun coût), 238 pages ×3, fusion **sans poussée forcée**, vérification sur www (238 pages ×3, échantillon des bancs). Puis, avec le propriétaire, les appels payants listés au bloquant 5 et la passe Safari (P1) sur les outils nommés. | ≈ 1 h |
| P15 | ✅ **GARDÉ EN LIGNE (décision du propriétaire, 30/09) ; vérification terminée sur www par P16 : D, K, L, 238 pages Chromium, AI Detector PASS ; E corrigé par P16.** *(État précédent :)* 🟠 **DÉPLOYÉ le 30/09, puis ARRÊTÉ au premier échec sur www** (`docs/audit/RAPPORT-deploiement-p15-30-09.md`). Service `media-processing` : `d914f612` (Railway `be919256`), prouvé en production et compatible avec l'ancien site. Site : fusion `0b6cb6cf` (Vercel `onlineconvertools-b64j6mp96`, alias www), préversion verte ×3 moteurs. Sur www : A, B, C, F, G, H, I, J PASS, 238 pages propres (WebKit) ; **E ÉCHOUE sur le chemin iPhone simulé** (`image-tools-big --ios`, photo > 16,7 Mpx : « Could not load this image », tous les outils image essayés ; déjà présent dans la branche, jamais rejoué avec `--ios` ; pas une régression). **Retour arrière refusé par le garde-fou de permissions de Claude Code** : www sert P15. Repères : `restauration-avant-p15-site` / `-service` (`9139aacb`), Railway `83747da5`. D, K, L et AI Detector non revérifiés sur www. | décision |
| P16 | ✅ **FAIT le 30/09 — en production `333e7950`** (repère `restauration-avant-p16` = `92b8e8a0` ; commits `3075f14a` (correctif E), `575e5e77` et `227a2a73` (simulation iPhone obligatoire dans tous les bancs image, nouveaux bancs `image-tools-rest-big` et `p16-video-www`), rapport ; préversion `onlineconvertools-bqleypwvq` verte ×3 moteurs ; www `onlineconvertools-aw2y2owe3` : chaque outil image à 24 et 48 Mpx PASS ×3 moteurs, 238 pages propres ; `docs/audit/RAPPORT-p16-photos-iphone-30-09.md`). Service inchangé (Railway `be919256`). **Reste pour le propriétaire : la passe iPhone (liste du rapport).** | — |
| P18 | ✅ **FAIT le 30/09 → 01/10 — en production `61b066d8` (prelancement-01-10) puis `106dbfdf` (étapes 2 à 5) et `7a13f02c` (étape 4 bis : Text to PDF, emoji et toutes les écritures)** (`docs/audit/RAPPORT-p18-01-10.md`). Repères `restauration-avant-prelancement-01-10` = `04dbd0a2`, `restauration-avant-p18-01-10` = `61b066d8`. Outils PDF sur Safari 16.4-18, téléchargement unique sur tout le site, Markdown to PDF, Video to GIF, Code Formatter, MOBI de test ; Lighthouse sur www accueil 84, outils 85-91. **Reste : ① la liste §9 du rapport sur le banc Safari du Mac ; ② l'iPhone ; ③ la vérification AI Detector sur www après 20 h (ligne 2 du tableau de tête)** | — |
| P19 | ✅ **FAIT le 01/10 — en production `f7569b1d`** (`docs/audit/RAPPORT-p19-01-10.md`). Repère `restauration-avant-p19-01-10` = `2ecb91a7` ; préversion `onlineconvertools-gregicef4` verte ×3 moteurs + iPhone/iPad simulés ; production `onlineconvertools-1boluf4vi` ; www : download-guard 147/147 · 147/147 · 135/135, iPhone/iPad 148/148, Audio Splitter 22/22 ×3, Code Formatter 8/8 ×3, 238 pages ×3 propres. Une seule règle « Quitter la page ? » pour tout le site (fichier produit et non pris : téléchargé, partagé, zippé ou texte copié ; plusieurs formats d'un résultat = un fichier ; exemple au chargement exclu) ; Audio Splitter : milieu par défaut + parts égales + toutes les N secondes ; Code Formatter : champ non contrôlé. Inventaire : aucun commit local jamais poussé ; `.serena/` et `pip.log` non déployés, laissés en place. **AI Detector sur www (Pangram, 20 h 11) : les deux verdicts justes.** | — |
| P20 | ✅ **FAIT le 01/10 — en production `38a6a7b9`** (`docs/audit/RAPPORT-p20-01-10.md`). Repère `restauration-avant-p20-01-10` = `a8071df1` ; préversion `onlineconvertools-2aczsksdf` verte ×3 moteurs + iPhone/iPad simulés ; production `onlineconvertools-1n8j383tq`. Promesses exactes (accueil sans « No data stored » / « Always free », 14 métadonnées de l'ancien moteur, dictée « locale », ConvertAPI nommé, limites dites, Google Translate divulgué) — banc `privacy-claims.mjs` 54 → 0, réviseur indépendant : 7 de plus, corrigés ; « 13 Languages via Google Translate » ; Whitespace Remover sans fusion de lignes (« Join Into One Line ») ; instructions = boutons réels (Merge PDF glisser + flèches ; dépôt de fichier sur ≈ 95 pages qui l'annonçaient sans le faire — `FileDropBridge`) — banc `instructions.mjs` 24 → 0 ; les deux contrôles dans `npm run build`. Aucun retour arrière. |
| P21 | ✅ **FAIT (02/10, nuit et jour, à la demande du propriétaire)** — branche `p21-02-10`, repères `restauration-avant-p21-02-10` = `23a9207c`, `restauration-avant-p21-lot3` = `e9c438be`. **3 mises en production, vertes sur www, aucun retour arrière** : lot 1 `90f3c4d3` (phase 1 : téléchargement iPhone/iPad par lien préparé, bords du détourage — fond resté au bord 11,0 % → 4,8 %, « % larger » expliqué) ; lot 2 `e9c438be` (phase 3 : PDF→images 2 modes / 5 formats, Office +23 formats, audio +7 sorties, JPG/Image to PDF +6 formats et blocage Firefox corrigé, Merge PDF images + Office, PSD/SVG, AVIF) ; lot 3 `9dbb6c8b` (phases 4-6 : débit audio au choix, fichiers vides/corrompus/d'un autre type refusés avec une phrase sur 29 outils — garde-fous relus par un réviseur indépendant, 3 refus de bons fichiers évités —, cibles tactiles 44 px, pages à la largeur de l'iPhone). **Phase 2 🟠 bloquée** (D2 : lecture tool_errors = clé de service ; journaux Vercel gardés 1 h). **Phase 7** : les 5 outils sont en ligne depuis le 23/09, revérifiés. Rapport `docs/audit/RAPPORT-p21-nuit-jour-02-10.md`. Décisions : D1-D3. | — |
| P6 | Décisions sur ce que P1/P2 feront remonter (priorité de chaque défaut trouvé) | ≈ 30 min |

**Ce que Claude fait**

| # | Quoi | Durée |
|---|---|---|
| C1 | Corriger les défauts que P1 (Safari) et P2 feront remonter, puis les retester | 2 à 8 h selon ce qui remonte (inconnu) |
| C2 | **Test de charge** selon la méthode du 27/09 (`RAPPORT-seance-27-09.md` §4 : copie jetable du service ffmpeg sur Railway, < 0,50 $ ; Gotenberg de bout en bout sur www en `.xlsx`/`.pptx`, ≈ 0,05-0,20 $), puis dimensionnement et retest. **Mesuré en local le 27/09 :** ajouter des emplacements parallèles n'augmente pas le débit (ffmpeg prend tous les cœurs), ≈ 80 s de CPU par vidéo 30 s 1080p ; LibreOffice convertit un document à la fois par instance | ≈ 3 h |
| C3 | **Gotenberg à 3 réplicas plusieurs jours avant**, laisser stabiliser, retester les 5 outils (déclencheur « Plusieurs jours AVANT ») | ≈ 1 h |
| C4 | ~~Limite de 20 conversions/h : relever les limites réelles des concurrents~~ ✅ **fait le 28/09** (voir « À FAIRE AVANT LE LANCEMENT ») | — |
| C5 | ~~Audit des outils qui joignent, coupent ou copient sans réencoder~~ ✅ **fait le 28/09**, 4 défauts corrigés en local + mode « coupe précise » de Video Trimmer | — |
| C6 | ✅ **CLOS — décidé et en production le 28/09** (`03f34e53` : « modifications minimales » à température 0, mention honnête pour ru/zh/ja/hi/tr, `50e02a87`) ; vérifié dans master le 30/09 (`lib/ai/toolPrompts.js`, `temperature: 0`). *(Historique :)* ✅ **Mesure TERMINÉE le 28/09** (2 passages T0 + 1 passage de la production, 80 appels ≈ 0,04 $, limite Preview relevée puis remise à l'identique) : condition tenue ou dans la marge de la production partout **sauf le russe** (exactes 14 contre 15-16, empirées 8 contre 14-16) — **décision au propriétaire**, rien en production (`RAPPORT-deploiement-28-09.md` §3). *(Historique :)* Correcteur de grammaire : T **appliquée et mesurée à moitié le 28/09** (6 langues sur 10, arrêt par la limite journalière de 100 appels/IP) ; finir la mesure (≈ 80 appels, ce soir après 20 h ou avec la limite de préversion relevée), puis décision | ≈ 3 h d'horloge (30 appels/h), ≈ 20 min de travail |

**📌 POUR DEMAIN (28/09) — noté le 27/09 au soir à la demande du propriétaire, non traité :**
- **a. Image Upscaler refuse au-delà de 1 Mpx au lieu de réduire.** État documentaire vérifié : la limite a été **fixée d'après une mesure de temps** (1 Mpx ×4 = 34,5 s sur Railway, 8 vCPU lus dans le cgroup — `RAPPORT-ecarts-marche.md` §« image-upscaler », `services/background-removal/app/upscale.py` `UPSCALE_MAX_INPUT_PIXELS`), avec la mention « au-delà non éprouvé » ; **elle n'a jamais été comparée aux limites d'entrée des concurrents** (iLoveIMG, Upscale.media, Let's Enhance…). Probablement en dessous du marché : relever leurs limites réelles sur leurs sites, mesurer le temps au-delà de 1 Mpx, et décider entre relever la limite, réduire dans le navigateur avant l'envoi (comme le détourage), ou les deux.
  **✅ Recherche faite le 27/09 (sans appel payant, sans code) — limites lues sur les pages des concurrents :**

  | Service | Entrée maximale | Agrandissement |
  |---|---|---|
  | **iLoveIMG** (notre référence de qualité, LPIPS 0,164 contre 0,107 pour nous) | **« any image smaller than 6MP »** (outil marqué Premium) | ×2, ×4 |
  | **Upscale.media** | ×4 : **2 500×2 500 (6,25 Mpx) sans compte**, 5 000×5 000 (25 Mpx) avec compte ; ×2 : 5 000×5 000 / 10 000×10 000 | ×1 à ×8 |
  | **Bigjpg** | gratuit **3 000×3 000 (9 Mpx), 5 Mo** ; payant 50 Mo | gratuit ×4, payant ×16 |
  | **LetsEnhance** | entrée non publiée ; **sortie 64 Mpx en gratuit** (soit ≈ 4 Mpx d'entrée en ×4), 512 Mpx payant | ×2 à ×16 |
  | **Nous** | **1 Mpx** | ×2, ×4 |

  **Verdict : 4 à 9 fois en dessous des offres gratuites** (iLoveIMG 6 Mpx, Upscale.media 6,25 Mpx, Bigjpg 9 Mpx). **Réduire dans le navigateur n'est pas une solution** pour un agrandisseur (réduire puis agrandir perd le détail que le visiteur veut garder) : elle ne vaut que comme repli annoncé au-delà du plafond.
  **Le moyen des concurrents** : aucun ne le publie ; ils traitent sur serveur, vraisemblablement sur carte graphique (non vérifié). Notre moyen actuel : modèle MoSR sur **processeur** (8 vCPU Railway), **par tuiles de 256 px** (la mémoire ne dépend donc pas de la taille de l'image) — la limite n'est **que le temps** : 1 Mpx ×4 = **34,5 s** mesurés.
  **Proposition chiffrée (estimations, à mesurer avant toute promesse — interdit n° 20) :**
  - **P1 — relever à 6 Mpx sur le processeur actuel (parité iLoveIMG / Upscale.media sans compte).** Temps estimé ≈ linéaire aux pixels : **≈ 3,5 min pour 6 Mpx ×4** ; coût Railway ≈ 8 vCPU × 207 s ≈ **0,013 $ par image de 6 Mpx** (0,002 $ à 1 Mpx). Risques : le service d'images est **partagé avec le détourage** (un agrandissement de 3,5 min le bloquerait) → file d'attente propre à l'agrandisseur ou service séparé ; progression visible obligatoire. **Travail ≈ 4-6 h** : mesurer 2, 4, 6 Mpx sur Railway, régler `UPSCALE_MAX_INPUT_PIXELS`, file et progression, textes, suites Chromium + Firefox, préversion. **À trancher avec les tests de charge de demain** (même service, même question de capacité).
  - **P2 — carte graphique à la demande** (Modal, RunPod, Replicate… : fournisseur à vérifier en direct, interdit n° 15) pour ramener 6 Mpx à quelques secondes. Coût par image probablement inférieur à P1, mais nouveau fournisseur, compte et clé à créer par le propriétaire. **Travail ≈ 1-2 jours.** Non chiffré précisément tant que le fournisseur n'est pas choisi.
  - **Recommandation : P1 d'abord** (aucun nouveau fournisseur, parité avec les offres gratuites), en gardant P2 si le temps de 3,5 min se révèle rédhibitoire à la mesure.
  - ✅ **30/09 (passe prêt au lancement) : FAIT et en production depuis P7** (`723992b8` du 27/09, dans la fusion `2cc1848d` du 29/09) — 6 Mpx, calcul sur l'appareil par WebGPU sinon serveur en bandes, plafond propre 5 $ (`RAPPORT-global-28-09.md` point 6 ; `MAX_INPUT_PIXELS = 6_000_000` dans master). La ligne ci-dessous est périmée.
  - **28/09 (nuit) — NON construit, laissé en attente de ton accord**, parce que la condition posée n'est pas remplie : **P1 crée un coût par appel** (le service facture le temps de calcul : ≈ 0,002 $ → ≈ 0,013 $ par image de 6 Mpx, ×6) et sa mise en service passe par le **service Railway de production** (réglage `UPSCALE_MAX_INPUT_PIXELS`, file propre), ce qui est interdit cette nuit ; P2 change de fournisseur. **❓ Accord pour P1 ?** Si oui : mesures 2/4/6 Mpx sur une copie du service (avec ta clé de test, comme pour la charge), puis code, suites, préversion.
- **b. Les deux tests de charge sont ACCEPTÉS sur le principe** (`RAPPORT-seance-27-09.md` §4 : copie jetable du service ffmpeg sur Railway, < 0,50 $ ; Gotenberg de bout en bout sur www, ≈ 0,05-0,20 $). **À faire demain AVEC le propriétaire. La clé de test de la copie jetable, c'est LUI qui la génère** (annexe B), jamais Claude.
- **c. Corpus de grammaire français et coréen : facultatifs, pour plus tard** — ils exigent une inscription que seul le propriétaire peut faire (MultiGEC-2025, Kor-Lang8).

**📋 PRÉPARÉ LE 28/09 POUR DÉCISION (rien changé ; chiffres et sources : `docs/audit/RAPPORT-deploiement-28-09.md` §6) :**
- **Slogan de l'accueil** — trois formulations adossées à une mesure ; préférence : « 225 free tools. / Most never upload your file. » (= accroche Product Hunt A ; 198/225 outils locaux, audit de confidentialité).
- **Agrandisseur à 6 Mpx (P1)** — coût réel par image ≈ **0,004-0,006 $ à 1 Mpx** (le « 0,002 $ » du 23/09 ne comptait pas la sortie réseau) → **≈ 0,022-0,034 $ à 6 Mpx ×4**. **⚠️ Constat : l'agrandisseur n'est PAS compté dans `GLOBAL_SPEND_CAP_USD`** (la route ne réserve aucune dépense) : bornes réelles = 60 billets « stage »/jour/connexion (≈ 40-61 $/mois pour une seule connexion à 6 Mpx) et le service saturé (≈ 275-450 $/mois). Préalables recommandés : compter l'agrandisseur dans le plafond global, file ou service propre (une image de 6 Mpx occupe le service ≈ 3,5 min, le détourage attend derrière).
- ✅ **30/09 : FAIT et en production depuis P7** (`225fcb7f` du 27/09, fusion `2cc1848d` ; exacte à l'image depuis P15, contrôle L : 120 images, 4,000 s). Énoncé d'origine : **Coupe précise par le service pour Firefox/Safari (≈ 19 % des pages vues)** — mesuré : ≈ 3 s de CPU par seconde de 1080p (= une compression de même durée), ≈ 0,002 $/coupe ; négligeable à 10-100/jour, mais 10 coupes simultanées occupent les 2 emplacements et 8 places de file → à décider **après** le test de charge P3.

**Ne sont pas des bloquants** (pour éviter qu'ils le redeviennent) : DPA ConvertAPI signé (facultatif, conditions déjà applicables), sitemap Search Console (un seul, en `www`), D7/D9 (après le lancement), `REMOVEBG_API_KEY` (n'existe plus).

**Bloquants avant le lancement : 9 (Safari — macOS mesuré, iPhone et retest des correctifs à faire par le propriétaire) ; ~~D8 (plafond de ≈ 4,5 Mo)~~ ✅ fait le 21/09, **en production et vérifié** (pptx 99 Mio en 53,7 s sur www ; rapport) ; la saturation à trancher avant Product Hunt ; ~~le DPA ConvertAPI~~ ✅ n'est plus un bloquant (22/09 — ses conditions s'appliquent déjà sans signature, voir 2 bis).** Railway Gotenberg à 3 réplicas, et la galerie Product Hunt.

Le bloquant 2 est **mesuré et ses promesses corrigées en ligne** ; ses défauts résiduels (D7, D9) passent après le lancement ; **D8 (plafond) est fait** (décision du propriétaire du 20/09, exécutée le 21/09).

Le bloquant 5 est **borné à l'usage** (30-40 outils mis en avant). Le bloquant 6 est **déployé et prouvé en production** (reste Safari réel, dans le bloquant 9). Les bloquants 7, 8 passent après le lancement.

**📝 À FAIRE AVANT LE LANCEMENT — noté le 26/09 à la demande du propriétaire, non traité :**
- **Limite de 20 conversions par heure et par connexion** (billets du service média, `MEDIA_JOBS_PER_HOUR_PER_IP`) — atteinte le 26/09 par mes seuls essais, en une heure (message clair, rien de cassé). Vérifier qu'elle est au moins aussi généreuse que les offres gratuites des concurrents directs **pour un utilisateur qui convertit un lot de fichiers** (ex. : Audio Splitter consomme un billet par partie en Opus ; un lot de 25 fichiers bute dessus) ; si elle est en dessous, proposer une valeur au propriétaire. Limites réelles des concurrents à relever sur leurs sites, pas de mémoire.
  **✅ Relevé fait le 28/09 (nuit), sur leurs pages, sans rien changer** — [P] = publié par le concurrent, [T] = source tierce :

  | Service | Gratuit, par jour | Par heure | Lot / simultané | Taille |
  |---|---|---|---|---|
  | Zamzar | **2 fichiers / 24 h** [P] (`zamzar.com/faq`) | — | 50 Mo au total [P] | 50 Mo |
  | 123apps (online-video-cutter, online-audio-converter) | **5 fichiers / jour** [P] (`123apps.com/pricing`) | — | lot en ZIP, sans chiffre | 500 Mo |
  | CloudConvert | **10 crédits / jour** avec compte [P] (`cloudconvert.com/pricing`) ; une conversion peut coûter plusieurs crédits [T] | — | 5 tâches simultanées [P] | 1 Go |
  | FreeConvert | **20 « minutes de conversion » / jour** [P] ; un test tiers (21/04/2026) bloqué après **10 fichiers** [T] | — | non publié | 1 Go |
  | Convertio | ≈ 10 min / 24 h [T] (page d'aide en 403, **non vérifié**) | — | 2 simultanées [T] | 1 Go [P] |
  | Online-Convert | « small number of credits », compte requis [P] | — | « Limited » [P] | 75 Mo [P] |
  | ezgif, Clideo, Kapwing, VEED | aucun quota chiffré publié ; limites de durée (ezgif 60 s), filigrane, 720p, compte (Kapwing, VEED) | — | — | — |
  | **Nous** (`media_rate`, par IP) | **60 / jour** | **20 / heure** | 2 en parallèle + 10 en file (service) | 1 Go |

  **Constat :** aucun concurrent ne publie de plafond **horaire** ; par jour, la médiane publiée est **≈ 10 fichiers** (min 2, max 20 annoncé) — **nous sommes 3 à 6 fois plus généreux par jour**. Le seul point où nous sommes en dessous : **un lot dans la même heure** — 25 fichiers vers Opus, ou Audio Splitter en Opus (**2 billets par fichier**), butent sur 20/h alors qu'aucun concurrent n'a de limite horaire (mais aucun n'accepte non plus 25 fichiers par jour gratuitement).
  **Coût d'un billet** (mesuré le 20/09) : ≈ 0,0013 $ léger, ≈ 0,012 $ lourd (WebM 3 min) → pire cas par IP et par jour à 60 billets lourds ≈ **0,72 $** (inchangé quelle que soit la limite horaire).
  **✅ TRANCHÉ le 28/09 par le propriétaire : H1 appliquée** (40/h Production + Preview, jour 60 inchangé ; prouvé sur www : 40 billets accordés, le 41ᵉ refusé). *(Options d'origine :)*
  - **H1 (recommandée) — `MEDIA_JOBS_PER_HOUR_PER_IP` 20 → 40, jour inchangé à 60.** Un lot de 25 fichiers (ou 20 fichiers coupés en Opus) passe dans l'heure ; le pire coût par IP et par jour ne bouge pas (le plafond journalier le borne) ; par jour nous restons 6× au-dessus de la médiane. Risque : un seul visiteur peut occuper les 2 emplacements du service plus longtemps d'affilée → **à trancher avec le test de charge** (même service, même question). Réglage : une variable Vercel + redéploiement (≈ 5 min, par toi).
  - H2 — garder 20/h : déjà au-dessus de tous par jour ; le visiteur d'un gros lot attend l'heure suivante (message clair déjà en place).
  - H3 (complément, code) — **un seul billet pour les 2 parties d'Audio Splitter en Opus** (aujourd'hui 2), ≈ 1 h.
- **Audit des jonctions, coupes et copies sans réencodage — ✅ FAIT le 28/09 (nuit), en local, corrigés commités, rien en production** (`docs/audit/RAPPORT-nuit-27-09.md` §3, banc `scripts/browser-tests/cut-join-audit.mjs`). **Recensement dans le code** (`-c copy`, `concat`, `-t/-ss`, recopie d'octets) : copie de flux dans **Audio Trimmer** (formats compressés sans fondu) et **Video Trimmer** ; coupe dans le graphe de filtres dans Audio Trimmer (PCM, FLAC 16 bits, fondus) ; **Audio Splitter** (réencodage de chaque partie) ; jonctions : **Audio Merger** (mesuré le 26/09) et **Video Merger** (réenregistrement d'un canvas) ; **aucune copie ni concat sur le service ffmpeg** (il bloque même le démultiplexeur `concat`). **Mesures, Chromium + Firefox** (source : bruit blanc, position retrouvée par corrélation) :
  - Audio Trimmer, copie 1,3 → 4,7 s : début décalé de **+0,3 ms (M4A), +19 ms (MP3), +20 ms (Opus), +39,5 ms (OGG)**, longueur 3,367-3,413 s pour 3,4 s, lu jusqu'au bout dans les deux navigateurs — conforme à la FAQ (« a few hundredths of a second »). **Défaut corrigé** : WMA, AC3… (tout sous WebKit) → réglages jamais affichés, sans message (`9f01beac`).
  - Audio Splitter : WAV, MP3, FLAC, OGG → **0 ms** de trou ou de chevauchement, somme = 10,000 s ; M4A : partie 1 + 17 ms (dernière trame AAC) ; WMA : partie 1 − 0,1 s. **Défauts corrigés** (`91dbf2f4`) : WMA bloqué, point de coupe à la seconde seulement, MP3 imposé par défaut (un WAV devenait lossy).
  - Video Trimmer : copie alignée sur l'image-clé (annoncé) : **+0,17 s (MP4), +1,03 s (AVI), +1,06 s (WMV)** avec une image-clé par seconde. **Défaut corrigé** : AVI/WMV acceptés mais impossibles à couper (`11326601`).
  - Video Merger : **ne finissait jamais sous Firefox et perdait le son partout** → corrigé (`85a614bf`), son gardé (−21 dB = source), 6,04-6,16 s pour 6 s.
  ~~Video Trimmer coupe à l'image-clé seulement~~ → **mode « Precise cut » ajouté** (`dbcc52bc`, en local) : image exacte (mesuré : commence à 1,32 s pour 1,3 s demandé, 2,40 s pour 2,4 s), réencodage MP4 dans le navigateur. **❓ Décision :** sous Firefox c'est lent (10 s de 1080p : **292 s**, contre 37 s sous Chromium ; écrit sur la page) — faire la coupe précise sur le service ffmpeg (quelques secondes ; changement du service par toi) ? ~~Video Resizer étire si les proportions diffèrent~~ → **fait** (`ac75f9f0`) : « Fit » (par défaut) / « Fill » / « Stretch », mesuré Chromium + Firefox.
  **Même famille, trouvée en route (28/09, en local) :** Audio Metadata et Video Metadata n'affichaient que nom/taille/type/durée du lecteur (rien pour un format illisible, « edit » annoncé à tort sur les cartes) → **rapport complet par ffprobe dans le navigateur** (`fd8c2d79` : codecs, débits, fréquence, profondeur, images/s, rotation, pistes, sous-titres, tags, chapitres, pochette, JSON ; au-dessus de metadata2go qui envoie le fichier et plafonne à 75 Mo) ; Media Player et Video Screenshot muets ou trompeurs sur un AVI/WMA → message et renvoi au convertisseur (`6d39450b`).
  *(Énoncé d'origine :)* Audit des jonctions, coupes et copies sans réencodage — tous les outils du site (noté le 26/09 à la demande du propriétaire). Audio Merger « copiait sans réencoder » et c'était faux dans 5 cas sur 7 (FLAC lu 5 s sur 12, silences de 18-40 ms aux jonctions MP3/AAC, Opus faussé ; `RAPPORT-audio-merger-format-sortie.md`). **Repérer tous les autres outils qui joignent, coupent ou copient des flux sans réencoder** — au moins `video-merger`, `video-trimmer` (copie de flux, coupe alignée sur l'image-clé), `audio-trimmer` (coupe à l'échantillon annoncée pour WAV/AIFF/FLAC 16 bits), `audio-splitter`, et tout outil dont le code passe `-c copy` / `-c:a copy` / `-c:v copy`, `concat`, ou recopie des octets d'un conteneur (recensement dans le code, pas de mémoire). **Mesurer chacun comme Audio Merger** : durée exacte contre la somme ou la plage demandée, silences, trous ou corruption aux jonctions et aux points de coupe (localisation par corrélation, SNR des 50 ms qui suivent), en-têtes de durée justes, et **lecture complète jusqu'au bout sous Chromium et Firefox** (`<audio>`/`<video>` : durée annoncée, `ended`). Bancs réutilisables : `scripts/browser-tests/audio-merger-join.mjs`, `audio-merger-references/fade-analyse.mjs`.
- **Qualité du correcteur de grammaire hors anglais — ✅ MESURÉE le 27/09** (`RAPPORT-seance-27-09.md` §3 ; 30 appels, ≈ 0,014 $) sur 10 corpus publiés, face à LanguageTool : nous **corrigeons plus d'erreurs dans toutes les langues** (phrases rendues exactes : 88 contre 33 sur les 8 langues communes), **mais nous réécrivons ce qui était juste** (sur-correction des LLM) — **en dessous de LanguageTool sur les phrases empirées en russe, chinois, japonais, espagnol, italien** ; hindi et turc mauvais sans comparaison possible ; **français et coréen non mesurés** (aucun corpus libre utilisable : il faut une inscription du propriétaire, MultiGEC-2025 / Kor-Lang8). **Option A choisie et MESURÉE le 27/09 (nuit)** (`RAPPORT-grammaire-modifications-minimales.md`) : consigne « modifications minimales » + 3 exemples, sur la branche (`4e879162`), **NON mise en production** — anglais 25/25 ×3 et texte sans faute intact ×3, phrases empirées 175 → 109 sur 10 langues, mais **léger recul en es, it, ru** (1-2 phrases sur 40) alors que la condition du propriétaire était « au moins aussi bonne dans chaque langue ». **❓ DÉCISION AU PROPRIÉTAIRE :** recommandation **T** (température 0 pour ce seul outil, remesure ×2, ≈ 1 h, ≈ 0,03 $) puis production si es/it/ru reviennent au niveau ; sinon M1 `gpt-4.1-mini` / M2 `gpt-5-mini` (≈ ×2,6 le coût d'usage) sur les langues encore sous LanguageTool, et W (avertissement honnête) en attendant.
  **🟡 T appliquée et mesurée À MOITIÉ le 28/09 (nuit)** (`608817da`, préversion `ojdqifb4d`, `docs/audit/RAPPORT-nuit-27-09.md` §1) — température 0 réglée **côté serveur pour ce seul outil** (le navigateur ne peut toujours pas l'envoyer, test 17/17). **Arrêtée par la limite JOURNALIÈRE de 100 appels par IP** (`IP_RATE_LIMIT_PER_DAY`, jour UTC : 30 + 55 appels déjà faits le 27/09 UTC par les séances précédentes) après **15 appels** : 1er passage fait pour **6 langues sur 10** ; 2e passage, anglais et passage de contrôle de la production **non faits** (reprise possible à **20 h 00 heure de Montréal**, minuit UTC). Exactes / empirées sur 40 — production (26/09) → minimale temp. défaut (27/09) → **minimale T0** :
  | Langue | Production | Minimale | **Minimale T0** | LanguageTool |
  |---|---|---|---|---|
  | pt | 29 / 3 | 31 / 0 | **29 / 3** | 10 / 10 |
  | de | 10 / 11 | 16 / 4 | **17 / 2** | 5 / 12 |
  | zh | 1 / 24 | 3 / 14 | **3 / 12** | 0 / 1 |
  | it | 8 / 13 | 7 / 8 | **9 / 5** | 3 / 7 |
  | es | 13 / 12 | 11 / 11 | **11 / 9** | 3 / 7 |
  | ru | 15 / 14 | 13 / 15 | **14 / 8** | 12 / 2 |
  | ja, ar, hi, tr | 7/25, 5/15, 1/33, 12/25 | 18/9, 7/3, 4/31, 12/14 | **non mesurées** | 0/0, 0/20, —, — |
  Lecture : à température 0, **les phrases empirées baissent dans les 6 langues** face à la production (es 12 → 9, it 13 → 5, ru 14 → 8, de 11 → 2, zh 24 → 12), l'italien repasse au-dessus de la production sur les deux critères ; **reste un écart sur les phrases exactes en espagnol (−2) et en russe (−1)** face à UN seul passage de la production, dont la part de hasard n'a pas pu être mesurée (c'était le 3e passage prévu). **Pas de mise en production.**
  **Lecture phrase par phrase des « empirées » à T0 (gratuite, faite sur les sorties déjà obtenues ; aucun extrait publié, licences mixtes) :** en **espagnol**, sur 9, **2 erreurs réelles** introduites (une conjonction fautive, un temps verbal changé) ; les 7 autres sont des corrections **justes mais différentes d'une référence stylistique** (le corpus COWS-L2H supprime les pronoms sujets, garde « New York », laisse une faute que nous corrigeons) → l'espagnol est **probablement au niveau**, l'écart vient surtout de la référence. En **russe**, sur 8 : **4 erreurs réelles** (un nom propre modifié, un sens inversé, deux mots « corrigés » à tort), 2 changements е → ё (variante que la consigne interdit de toucher), 2 reformulations → **le russe reste réellement en dessous de LanguageTool** (2 empirées) : candidat à M1/M2 ou à W.
  **✅ 28/09 — mesure TERMINÉE** (O2 : limite journalière relevée sur Preview seulement, puis remise à l'identique ; 80 appels ≈ 0,04 $). Exactes / empirées sur 40 — production n° 1 (26-27/09) · **production n° 2 (28/09)** · **T0 n° 1** · **T0 n° 2** : en 25/25 · **25/25** · **25/25** · **25/25** (texte juste intact partout) ; pt 29/3 · 29/4 · 29/3 · 29/3 ; de 10/11 · 16/7 · 17/2 · 16/5 ; ja 7/25 · 12/18 · 19/7 · 19/7 ; zh 1/24 · 0/23 · 3/12 · 3/11 ; tr 12/25 · 11/25 · 12/14 · 12/16 ; hi 1/33 · 2/33 · 2/32 · 2/32 ; it 8/13 · 10/11 · 9/5 · 9/5 ; es 13/12 · 11/15 · 11/9 · 11/9 ; ar 5/15 · 7/14 · 6/4 · 6/4 ; **ru 15/14 · 16/16 · 14/8 · 14/8**. **Verdict :** T0 au moins aussi bien que la production en en, pt, de, ja, zh, tr, hi ; dans l'écart propre de la production (−1/−2 exactes, bien moins d'empirées) en it, es, ar ; **strictement en dessous en russe sur les exactes** (14 contre 15 et 16) avec deux fois moins d'empirées. Face à LanguageTool, toujours en dessous sur les empirées en ru, es, zh, ja. **❓ DÉCISION AU PROPRIÉTAIRE** (recommandation : minimale + T0 en production avec l'avertissement W sur ru, zh, ja, hi, tr). *(Énoncé d'origine :)* **❓ Pour finir la mesure (≈ 80 appels, ≈ 0,04 $) — au choix :** **O1** la reprendre ce soir après 20 h (nouveau jour UTC ; 3 heures à cause des 30/h) ; **O2** relever temporairement `IP_RATE_LIMIT_PER_DAY` **en Preview seulement** (toi, dans Vercel), la production n'étant pas touchée.

**Le site est indexé et classé en page 8. Une page qui gagne sa requête vaut plus que 225 pages en position 74.**
