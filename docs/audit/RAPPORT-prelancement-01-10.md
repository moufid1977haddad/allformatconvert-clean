# RAPPORT — Passe « prêt au lancement » (prelancement-01-10), 30/09/2026

Travail seul, en local, branche **`prelancement-01-10`** partie de master `04dbd0a2` (repère `restauration-avant-prelancement-01-10`). **Aucune poussée, aucune préversion, aucune mise en production, aucune dépense, aucun compte, aucun appel payant, aucun appel à www pour un outil média ou IA** (seules trois pages de www ont été chargées, sans usage d'outil, pour la mesure de vitesse). Aucun secret lu ni affiché. Aucun outil supprimé ni renommé.

## En bref

| Partie | Résultat |
|---|---|
| 1 — plan | chaque ligne classée (§1) ; tableau **« Reste avant Product Hunt »** en tête du plan ; 5 lignes « en attente » étaient **déjà faites** (grammaire T0, agrandisseur 6 Mpx, coupe précise sur le service, Opus, veille pdf-tools périmée) — marquées |
| 2 — vitesse et qualité | 243 pages, mobile : **pages outils 55 → 83**, accueil 53 → 86, catégories 65 → 86 ; **accessibilité 100 et bonnes pratiques 100 partout** ; LCP médian 6,6 → 3,8 s, TBT 600 → 279 ms ; **0 audit hors performance en échec** (avant : 9 audits, jusqu'à 243 pages) ; **au-dessus d'iLovePDF, FreeConvert, 123apps et TinyWow** sur les pages comparables |
| 3 — AdSense | exigences relevées en direct (**TCF v2.3** depuis le 01/03/2026, et non v2.2) ; CMP retenue : celle de Google (certifiée, gratuite) ; politique de confidentialité **exacte outil par outil**, conditions et 6 textes du site corrigés ; consentement, bloc, `/ads.txt`, lien « Privacy choices » **construits et éteints** ; plan d'emplacements ; gestes du propriétaire (≈ 45 min, au seuil de 20-50 visiteurs/jour) |
| 4 — Product Hunt | kit à jour (faits prouvés depuis le 29/09), **« about 175 » recompté** (176 ; « about 180 » était périmé), galerie de 10 images régénérée, premier commentaire relu |
| 5 — AI Detector sur www | script prêt tel quel ; **commande : `node scripts/ai-detector/www-check-p17.mjs`** ce soir après 20 h 00 (Toronto) |
| Trouvé en route | PDF Sign : signature tapée ou importée ; Password Generator, URL Decoder, Sticky Notes ; **309 boutons** au texte presque noir sur l'indigo ; 6 textes qui disaient faux sur la confidentialité (About « everything runs locally », FAQ Image Tools « processed on our servers »…) ; **régression WebKit trouvée par le banc et corrigée** (traduction chargée à la demande) |

## 1. Passe « prêt au lancement » sur le plan — chaque ligne classée

Légende : ✅ **FAIT ET PROUVÉ** (preuve citée) · 🛠️ **FAIT MAINTENANT** (cette session, en local, branche `prelancement-01-10`) · ⏸️ **SCIEMMENT REPORTÉ** (raison) · 👤 **PROPRIÉTAIRE** (durée). Le tableau court « Reste avant Product Hunt » est en tête de `claude/plan-de-travail.md`.

### 1.1 Bloquants

| Ligne du plan | État | Preuve / raison / durée |
|---|---|---|
| 1 — classement : 10 pages travaillées, données structurées | ✅ | en production `ceb538f3` (P12), indexation demandée le 29/09 par le propriétaire |
| 1 — relevé de position des 10 pages | ⏸️ calendrier | pas avant 4-6 semaines : **10-24 novembre 2026** (Search Console → Performances) ; 👤 20 min ce jour-là |
| 1 — travail de contenu de json-to-rust, json-to-php, env-to-json | ⏸️ | attend le relevé des 10 pages (décision du 29/09 : mesurer avant d'étendre) |
| 2 — promesses de fidélité Office, D1, D2, D6, D3, D4 | ✅ | voir tableau D du plan (production 19/09) |
| 2 — D5 (graphique Excel), D7 (repli LibreOffice non mesuré), D9 (zones de texte `wrap="none"`) | ⏸️ après le lancement | décision écrite du plan (« D7/D9 après le lancement ») ; aucune promesse en ligne ne dépend d'eux ; D7 doit être mesuré **avant** toute coupure de ConvertAPI |
| 2 bis — D8/D10, plafonds déclarés et mesurés | ✅ | production `aed1e753`, `RAPPORT-plafonds-mesures.md` |
| 2 bis — sort de `gotenberg-fonts` | ⏸️ décidé le 22/09 | veille activée ; suppression **après plusieurs semaines post-lancement** (déclencheur existant) |
| 3 — détourage | ✅ | clos, `RAPPORT-detourage-phase2.md` |
| 4 — plafond pdf-translate | ✅ | `c6ae956a` |
| 5 — 36 outils mis en avant, 17 améliorations, audits n° 1 et n° 2 | ✅ | production 22/09 → 29/09 (`828cfe75`) ; tableaux du plan |
| 5 — AI Detector | ✅ sous réserve | Pangram en production `5969cdb1`, corpus 0/57 et 40/40 ; **reste la vérification sur www** → 👤 2 min ce soir après 20 h (`node scripts/ai-detector/www-check-p17.mjs`, script rendu autonome : 🛠️ `548b74bc`) |
| 5 — écarts de couverture : Sign sans signature tapée/importée, Password Generator, URL Decoder « + » | 🛠️ | fermés en local (§4 du rapport), bancs 3 moteurs |
| 5 — Text to PDF en bengali et emoji | ⏸️ | exige un moteur de mise en forme (HarfBuzz) ; refus déjà propre ; aucune demande mesurée |
| 5 — « trouvé en route » ① onnxruntime sur 48 cœurs (détourage) | ⏸️ | à mesurer sur Railway, réglage déjà validé le 14/09, pas de défaut visible ; après le lancement |
| 5 — ② SVG absent d'Image Compressor | ⏸️ | écart de couverture réel mais mineur (iLoveIMG le fait) ; aucun visiteur ne le signale ; après le lancement |
| 5 — ③ Opus des trois outils audio | ✅ | production 26/09 (`95e7125f` service, `98a32e95` site) — la question « ❓ accord » du plan était périmée, marquée |
| 5 — ④ licence du modèle de l'agrandisseur (coquille « CC-BY-0.4 ») | 👤 15 min | un courriel à l'auteur pour confirmation écrite ; recommandé, pas bloquant (licence permissive dans tous les cas) |
| 5 — agrandisseur au-delà de 1 Mpx (« ❓ accord pour P1 ? ») | ✅ | **périmé** : 6 Mpx en production depuis P7 (`723992b8` dans `2cc1848d`), marqué dans le plan |
| 6 — architecture vidéo | ✅ | production 20/09, `RAPPORT-video-deploiement.md` |
| 6 — saturation avant Product Hunt | 👤 + Claude | étape 7 du tableau (15 min + 1 h de présence ; ≈ 3 h Claude) |
| 6 — comparaison chiffrée MP4/H.265/AV1/compresseur | ⏸️ | aucune promesse publiée sur ces sorties (règle n° 20 respectée) ; après le lancement |
| 6 — essai d'un fichier de 1 Go | ⏸️ non faisable | écrit au plan (mémoire de la fonction Vercel) |
| 6 — première facture Railway | ⏸️ calendrier | facture de septembre relevée (2,65 $) ; octobre à relever début novembre |
| 7 — stubs | ✅ | 23/09 |
| 8 — fréquence de la surveillance | ⏸️ | « après le lancement » par construction (sans trafic, inutile) |
| 9 — Safari | 👤 ≈ 2 h puis Claude 2-8 h | étapes 4-5 ; Mac réel 38/40 puis corrigé (P17) ; iPhone : liste P16/P17 |
| 10 — navbar | ✅ | 0 px à 8 largeurs |
| 11 — tests manuels, vague 1 | ✅ | P2 clos 28/09 ; **défaut latent sticky-notes** : 🛠️ corrigé (note mal formée ignorée) |

### 1.2 Administratif

| Ligne | État | Preuve / raison / durée |
|---|---|---|
| Poids des déploiements | ✅ | 18,3 % lu le 25/09 |
| Search Console, 7 pages « de notre faute » | ✅ | diagnostiquées le 22/09 |
| Indépendance `gotenberg-v2` | ✅ | 6/6 outils prouvés le 22/09 |
| Replis de `lib/quota/config.js` (8 restants) | ⏸️ « juste après » | ordre obligatoire : le propriétaire crée d'abord 5 variables Vercel (👤 10 min), puis Claude retire les replis ; les valeurs de repli sont les valeurs voulues (écart de forme) |
| Veille Serverless de `pdf-tools` | ⏸️ | raison d'origine périmée (le service sert Compress/Repair/PDF/A) ; à décider sur la facture |
| Supprimer `Downloads\fidelite-01..06.pdf` | 👤 1 min | fichiers locaux verrouillés par Chrome |
| `REMOVEBG_API_KEY` | ✅ | n'existe plus (27/09) |
| Adresse de facturation des 5 fournisseurs | 👤 15 min | tableaux de bord des fournisseurs |
| DPA ConvertAPI | ⏸️ facultatif | conditions déjà applicables sans signature (27/09) |
| Centraliser les notifications fournisseurs | 👤 15 min | vers `contact@onlineconvertools.com` |
| Rapport de bug Claude Code | 👤 5 min | texte dans le plan |
| `RESEND_API_KEY` / `GOTENBERG_PASSWORD` lisibles | 👤 10 min | les passer en « Sensitive » dans Vercel si le plan le permet ; jamais affichées |

### 1.3 Déclencheurs « AVANT le lancement » et ligne d'arrivée

| Ligne | État | Preuve / raison / durée |
|---|---|---|
| Gotenberg à 3 réplicas plusieurs jours avant (P8/C3) | Claude 1 h | accord P8 donné le 29/09 ; coût notifié avant (étape 9) |
| Galerie Product Hunt juste avant (P5) | 🛠️ + Claude 15 min | kit et galerie à jour du build local (§4) ; à régénérer sur www juste avant (étape 11) |
| Trancher la saturation (P3/C2) | 👤 + Claude | étape 7 |
| DPA ConvertAPI | ✅ n'est pas un bloquant | 27/09 |
| P0, P2, P4, P7, P9, P12, P13, P14, P15, P16 | ✅ | voir la ligne d'arrivée (dates et commits de production) |
| P1 passe Safari | 👤 ≈ 2 h | étape 4 |
| P3 saturation | 👤 15 min + 1 h | étape 7 |
| P5 galerie | 🛠️ | §4 ; reste la régénération sur www (étape 11) |
| P6 décisions | 👤 30 min | étape 6 |
| P8 | ✅ approuvé | exécution = C3 |
| P10 premier commentaire | 👤 20 min | relu et mis à jour (§4) ; deux passages ⟦…⟧ |
| P11 liens | 👤 3-5 h | après le lancement, Show HN d'abord |
| P17 restes | 👤 | ① vérification www ce soir (2 min) ; ② **changer le mot de passe** (5 min) ; ③ Safari Blur/Rotator (dans P1) |
| C1 | Claude 2-8 h | après P1 |
| C2 test de charge | Claude ≈ 3 h | avec le propriétaire |
| C6 correcteur de grammaire | ✅ | **périmé** : minimale + T0 + mention en production `03f34e53`, marqué dans le plan |
| Coupe précise par le service (Firefox/Safari) | ✅ | **périmé** : en production depuis P7 (`225fcb7f`), marqué dans le plan |
| Slogan de l'accueil | ✅ | en production (28/09) |
| AdSense (déclencheur trafic) | 🛠️ préparé, éteint | §3 ; 👤 ≈ 45 min au seuil de 20-50 visiteurs/jour |
| Relire trois contrats (le jour de la demande AdSense) | ⏸️ déclencheur | inchangé |
| Internationalisation, `?dpl=`, WebGPU détourage, DMARC, référence Adobe/Microsoft | ⏸️ déclencheurs | inchangés, non liés au lancement |

## 2. Vitesse et qualité des pages

### 2.1 Méthode

- **Build de production local** (`npm run build` puis `next start -p 3100`), **Lighthouse 13.5.0** (installé hors du dépôt), Chromium de Playwright, **profil mobile par défaut de Lighthouse** (Moto G Power émulé, 4G lente simulée, processeur ralenti ×4), une page à la fois ; banc `scripts/perf/lighthouse-pages.mjs`, comparaison `scripts/perf/lighthouse-compare.mjs`, résultats bruts `docs/audit/perf/*.json`.
- **Toutes les pages** : accueil, `/tools`, about, privacy, terms, contact, 12 catégories, 225 outils = **244 pages**, avant puis après.
- Core Web Vitals **de laboratoire** : LCP, CLS, et **TBT** comme indicateur d'INP (l'INP réel exige des interactions de visiteurs ; Lighthouse en navigation ne le mesure pas — c'est la doctrine de Google pour le laboratoire).
- Nos propres visites ne comptent pas dans Google Analytics (requêtes `collect` bloquées pendant la mesure ; la bibliothèque gtag est bien chargée et mesurée).
- **Limite honnête** : le serveur local répond en quelques millisecondes ; en production, Vercel ajoute sa latence (≈ 200 ms mesurés le 12/09). Les **écarts avant/après** sont fiables (mêmes conditions) ; les valeurs absolues de LCP sont un peu optimistes. Pour la même raison, les concurrents sont mesurés **sur leur site réel** et nous aussi (www, avant les correctifs), dans les mêmes conditions.

### 2.2 Ce qui nous plaçait sous les concurrents — trouvé dans la mesure, pas supposé

| Cause (mesurée, mobile) | Où | Correctif | Preuve |
|---|---|---|---|
| **Police arabe (166 Ko) préchargée en priorité haute sur chaque page**, alors qu'elle ne sert qu'à une page traduite en arabe | `app/layout.tsx` (`Noto_Sans_Arabic`) | `preload: false` : téléchargée seulement quand du texte arabe l'utilise | banc : aucune police > 100 Ko préchargée |
| **Google Translate chargé pour tous** (≈ 100 Ko de JS + CSS + images, ≈ 0,3 s de travail ; appel en `http://`, avertissement de cookie tiers → « Bonnes pratiques » 77) | `app/layout.tsx` | chargé à l'ouverture du menu de langue, ou d'emblée **seulement** si une traduction est active (cookie `googtrans`) — `app/lib/googleTranslate.js`, `GoogleTranslateLoader.jsx` ; même script, mêmes options | banc 3 moteurs : non chargé à l'arrivée ; menu → chargé ; « Français » traduit ; page suivante retraduite ; retour à l'anglais |
| **Supabase (≈ 205 Ko de code) dans la barre de navigation de chaque page** pour afficher « Sign In » | `Navbar.jsx` | importé après le premier affichage ; « Sign In » affiché comme avant | banc : lien présent, aucune erreur |
| **Les ≈ 150 icônes des méga-menus** dans le code de chaque page alors que les menus ne sont pas dans la page tant qu'on ne les ouvre pas | `Navbar.jsx`, `toolIcons.js` | icônes chargées après l'affichage (préchargées quand le navigateur est au repos) ; couleurs séparées dans `toolColors.js` | banc : menu PDF ouvert → 39 liens, 39 icônes |
| **Google Analytics** chargé « afterInteractive » (≈ 180 Ko, ≈ 0,3 s) en concurrence avec l'outil | `app/layout.tsx` | `lazyOnload` : après le chargement, au repos ; les visites restent comptées | banc : gtag chargé |
| **pdf-lib chargé avec la page** sur 9 outils PDF | 8 pages + `pdfImages.js`, `textPdf.js` | chargé au clic | banc 3 moteurs : les 8 outils produisent un PDF lisible (ou chiffré pour Protect) |
| **Moteur cron** (cron-parser + cronstrue) exécuté au chargement, bloc « prochaines exécutions » ajouté après → TBT ≈ 1,1 s, CLS 0,11-0,22 | 2 pages cron | chargé après l'affichage, hauteur réservée | CLS 0 ; voir tableau |
| **Décalages de mise en page** : lignes « jusqu'à … on this device » qui changent de longueur après détection du mobile ; résultat de Currency Converter ajouté après le chargement | 13 pages (Image Converter 0,24 ; PDF Split 0,21 ; Currency 0,12 ; ZIP 0,10 …) | hauteur réservée | pire CLS des pages outils 0,24 → 0,033 |
| **Aucun repère `<main>`** | toutes | `<main id="main-content">` autour du contenu | Lighthouse `landmark-one-main` 243 → 0 |
| **Contrastes sous 4,5:1** : sous-titre de chaque outil (4,34), gris `-400` (2,4-2,6), erreurs `text-red-400` (2,8), résultats `text-indigo-400`/`green-400` (1,9-2,9), **309 boutons colorés sans couleur de texte** (texte presque noir sur l'indigo, 2,8:1 — invisible à Lighthouse tant qu'ils sont désactivés, visible dès qu'on les active), boutons verts (3,2) | globales + 166 fichiers | teinte plus foncée en mode clair (le mode sombre inchangé), `text-white` sur les boutons colorés, vert foncé | `color-contrast` 243 → 0 page |
| **Champs sans nom accessible** (libellé visible mais non relié) | 70 pages, 167 champs | `aria-label` = le texte du libellé visible (codemod contrôlé : aucune insertion dans un texte) ; 20 à la main | `label` 70 → 0, `select-name` 20 → 0 |

**Aucun outil n'a perdu une fonction** : le banc `prelancement-01-10.mjs` rejoue chaque changement dans les 3 moteurs ; les bancs existants des outils touchés sont repassés (§6).

### 2.3 Avant / après, par gabarit (243 pages, mobile, médianes ; « pire » = la plus mauvaise page du gabarit)

| Gabarit | Pages | Performance | Accessibilité | Bonnes pratiques | SEO | LCP | CLS | TBT | JS transféré | Poids total | Pire performance | Pire CLS |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Accueil | 1 | 53 → **86** | 94 → **100** | 77 → **100** | 100 → **100** | 6.8 s → **3.8 s** | 0 → **0** | 681 ms → **207 ms** | 538 Ko → **461 Ko** | 818 Ko → **567 Ko** | 53 → **86** | 0 → **0** |
| Liste des outils | 1 | 75 → **86** | 94 → **100** | 81 → **100** | 100 → **100** | 4.4 s → **3.4 s** | 0 → **0** | 371 ms → **270 ms** | 607 Ko → **535 Ko** | 899 Ko → **652 Ko** | 75 → **86** | 0 → **0** |
| Catégorie (12) | 12 | 65 → **86** | 94 → **100** | 77 → **100** | 100 → **100** | 5.6 s → **3.7 s** | 0 → **0** | 359 ms → **195 ms** | 635 Ko → **555 Ko** | 933 Ko → **682 Ko** | 54 → **85** | 0 → **0** |
| Outil (225) | 225 | 55 → **83** | 94 → **100** | 77 → **100** | 100 → **100** | 6.6 s → **3.8 s** | 0 → **0** | 600 ms → **279 ms** | 602 Ko → **526 Ko** | 878 Ko → **628 Ko** | 36 → **69** | 0.24 → **0.033** |
| Pages du site (about, privacy, terms, contact) | 4 | 58 → **87** | 90 → **100** | 77 → **100** | 100 → **100** | 5.2 s → **3.3 s** | 0 → **0** | 585 ms → **187 ms** | 538 Ko → **461 Ko** | 812 Ko → **566 Ko** | 56 → **86** | 0 → **0** |

| Audit en échec (hors performance) | Pages avant | Pages après |
|---|---|---|
| accessibility:color-contrast | 243 | 0 |
| accessibility:landmark-one-main | 243 | 0 |
| best-practices:is-on-https | 243 | 0 |
| best-practices:inspector-issues | 212 | 0 |
| accessibility:label | 70 | 0 |
| accessibility:select-name | 20 | 0 |
| accessibility:link-in-text-block | 1 | 0 |
| accessibility:heading-order | 1 | 0 |
| accessibility:button-name | 1 | 0 |

**Pages de performance ≥ 80 : 208 sur 243** (avant : aucune au-dessus de 75). Pire page après : 69 (`video-converter` ; au premier passage complet la pire était `audio-waveform` à 71 et `video-converter` au-dessus — variance de ± 3-5 points d’un passage à l’autre).

### 2.4 Face aux concurrents (mêmes conditions : profil mobile Lighthouse, 30/09 ; eux sur leur site réel)

| Page | Performance | Accessibilité | Bonnes pratiques | LCP | TBT | CLS | JS |
|---|---|---|---|---|---|---|---|
| **Nous, accueil** — www avant → build après | 61 → **86** | 94 → **100** | 96 → **100** | 6,4 → **3,8 s** | 386 → **207 ms** | 0 | 543 → **461 Ko** |
| **Nous, Image Compressor** — www avant → après | 53 → **83** | 94 → **100** | 96 → **100** | 6,5 → **3,8 s** | 743 → **280 ms** | 0 | 596 → **530 Ko** |
| **Nous, PDF Compress** — www avant → après | 54 → **82** | 94 → **100** | 96 → **100** | 6,6 → **3,8 s** | 675 → **313 ms** | 0,011 | 595 → **530 Ko** |
| iLovePDF, accueil | 79 | 93 | 100 | 4,5 s | 271 ms | 0 | 264 Ko |
| iLovePDF, Compress PDF | 71 | 83 | 77 | 4,0 s | 643 ms | 0 | 669 Ko |
| FreeConvert, accueil | 47 | 89 | 54 | 3,2 s | 6 606 ms | 0,135 | 2 308 Ko |
| FreeConvert, Image Compressor | 41 | 89 | 54 | 4,8 s | 5 324 ms | 0,002 | 2 338 Ko |
| FreeConvert, Compress PDF | 24 | 89 | 73 | 7,0 s | 8 816 ms | 0,227 | 2 302 Ko |
| 123apps, accueil | 72 | 60 | 65 | 2,7 s | 1 161 ms | 0,005 | 541 Ko |
| 123apps, Audio Converter | 42 | 77 | 62 | 6,9 s | 2 324 ms | 0,056 | 806 Ko |
| TinyWow, accueil | 54 | 83 | 100 | 5,5 s | 700 ms | 0,014 | 775 Ko |
| TinyWow, Compress PDF | 45 | 86 | 100 | 12,9 s | 1 013 ms | 0,001 | 1 273 Ko |
| TinyWow, Compress Image | — | — | — | — | — | — | page sans affichage en 45 s sous Lighthouse (NO_FCP) |

**Lecture honnête.** Avant, nous étions **sous iLovePDF** partout (accueil 61 contre 79, page outil 53-54 contre 71) et au niveau de TinyWow ; au-dessus de FreeConvert et de 123apps seulement. Après : **au-dessus de tous les concurrents mesurés sur les pages outils** (82-83 contre 71 pour la meilleure page outil concurrente) et **au-dessus d'iLovePDF sur l'accueil** (86 contre 79) ; **accessibilité 100** sur les 243 pages (le meilleur concurrent : 93). **Deux réserves** : ① nos chiffres « après » viennent du build local (serveur sans latence réseau) — le gain réel sur www sera un peu moindre que 61 → 86 ; à remesurer sur www après la mise en production (même banc, 5 min) ; ② nous restons **plus lourds en JavaScript qu'iLovePDF sur son accueil** (461 contre 264 Ko) : le socle React/Next de chaque page (≈ 400 Ko) est le plancher actuel ; le descendre demanderait de passer les pages en composants serveur — chantier structurel, non fait (225 outils, risque de régression sans bénéfice de classement démontré : nous sommes déjà au-dessus de la concurrence).

### 2.5 Mesures intermédiaires (transparence)

Échantillon de 7 pages après le premier lot (build 2) : accueil 79, PDF Compress 82, Image Converter 77, catégorie PDF 85. Premier passage complet (build 3) : outils 83, contraste encore en échec sur 15 pages → lot a11y final (boutons sans couleur de texte, vert, contact, footer) → build 5, passage complet ci-dessus. Le correctif WebKit de la traduction (build 6) ne touche qu'au clic sur une langue : il n'entre pas dans la mesure au chargement.

## 3. Préparation AdSense — tout est prêt, rien n'est activé

### 3.1 Exigences relevées en direct (30/09/2026)

| Exigence | Source (lue le 30/09) | Ce que nous avons |
|---|---|---|
| **Consentement EEE, Royaume-Uni, Suisse** : CMP **certifiée par Google** et intégrée au **TCF de l'IAB** pour servir des annonces personnalisées (EEE et R.-U. depuis le 16/01/2024, Suisse depuis le 31/07/2024) ; sinon « you will not be eligible to serve personalized ads » | support.google.com/adsense/answer/13554020 | prévu : la CMP de Google elle-même (ci-dessous) |
| **Version du TCF** : ce n'est plus la v2.2 demandée dans la consigne — **TCF v2.3 obligatoire pour toute nouvelle chaîne de consentement depuis le 28/02-01/03/2026** ; une CMP restée en v2.2 fait tomber les annonces en « Limited Ads » | annonces IAB/Google relayées (secureprivacy.ai, CookieYes, Usercentrics) ; Google : les messages « European regulations » de Privacy & messaging sont passés en v2.3, segment « disclosed vendors » compris | la CMP de Google est à jour en v2.3 |
| **CMP de Google** : les messages « European regulations » de l'onglet **Privacy & messaging** d'AdSense **sont** des CMP certifiées ; gratuites ; diffusées par la balise AdSense elle-même (rien d'autre à charger) ; message « US state regulations » disponible aussi | support.google.com/adsense/answer/10924669, /13790256 ; aide Ad Manager 13554116 | choisie (voir 3.2) |
| **Politique de confidentialité** : dire que des tiers, dont Google, utilisent des cookies pour diffuser des annonces selon les visites antérieures ; que les cookies publicitaires de Google permettent la personnalisation ; liens de désactivation **Ads Settings** et **aboutads.info** | support.google.com/adsense/answer/1348695 | section « Advertising » écrite mot pour mot, **affichée seulement quand les annonces sont actives** |
| **ads.txt** : `google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0` (identifiant sans le préfixe `ca-`) | aide AdSense « Ads.txt guide » 12171612 et FAQ 9785052 | `/ads.txt` généré depuis la variable (404 tant qu'elle est absente) |
| **Emplacements** : pas près des boutons de téléchargement ou de navigation (clics accidentels) ; libellé « Advertisements » ou « Sponsored Links » seulement ; pas de rafraîchissement sans action ; pas plus de trois fenêtres surgissantes | support.google.com/adsense/answer/1346295 | respecté par construction (3.3) |

### 3.2 Choix de la CMP — et pourquoi

**Les concurrents, relevés dans leur HTML le 30/09 :** 123apps (online-audio-converter.com) : **AdSense direct**, 2 blocs visibles dans le HTML (bandeau de 90 px sous l'en-tête, bloc vertical ≥ 250 px), chacun avec une hauteur **réservée** (`min-height`) ; iLovePDF : Google Ad Manager (`gpt.js`) ; FreeConvert : Prebid (enchères) ; TinyWow : Freestar (régie, 33 références). Leur CMP n'apparaît pas dans le HTML servi depuis le Canada (chargée selon le pays).

**Décision : la CMP de Google (Privacy & messaging).** Certifiée, TCF v2.3, gratuite, sans compte supplémentaire, livrée par la balise AdSense (aucun script de plus). Les CMP tierces certifiées (Cookiebot, CookieYes, Usercentrics…) demandent un compte et un abonnement au-delà d'un palier gratuit, pour le même résultat à notre volume. Une régie (Freestar, Ezoic, Raptive) exige un trafic que nous n'avons pas.

### 3.3 Ce qui est construit (éteint)

| Fichier | Rôle | Éteint = |
|---|---|---|
| `app/lib/ads.js` | lit `NEXT_PUBLIC_ADSENSE_CLIENT` et `NEXT_PUBLIC_ADSENSE_SLOT_TOOL_FOOTER` ; une valeur mal formée, ou le client sans l'emplacement, **fait échouer le build** avec un message (aucune valeur de repli) ; liste des 32 pays à consentement | variable absente |
| `app/components/AdsScripts.jsx` | **Consent Mode v2** par défaut « refusé » dans l'EEE, au R.-U. et en Suisse (Analytics compris) avant tout script Google, « accordé » ailleurs ; balise AdSense en **`lazyOnload`** (après le chargement, navigateur au repos) | rien n'est rendu |
| `app/components/AdSlot.jsx` | un bloc « Display » : hauteur **réservée** (280 px, pas de décalage de mise en page), demandé seulement à l'approche de l'écran (IntersectionObserver), libellé « Advertisement » ; premier emplacement : **bas des pages outils**, après l'outil, son résultat et ses explications, avant le pied de page — jamais dans la zone de travail ni près d'un bouton Download | rien n'est rendu |
| `app/components/PrivacyChoicesLink.jsx` | lien « Privacy choices » du pied de page : rouvre le message de consentement (`googlefc.showRevocationMessage`) | rien n'est rendu |
| `app/ads.txt/route.js` | `/ads.txt` construit depuis l'identifiant | 404 |
| `app/privacy/page.jsx` | politique réécrite, exacte outil par outil ; section « Advertising » conditionnelle | section absente |
| `app/terms/page.jsx` | §5 : les trois fournisseurs (ConvertAPI, OpenAI, Pangram) ; §6 : publicité **sans** « en utilisant le site vous consentez » (un consentement RGPD ne se donne pas par l'usage) | texte valable dans les deux états |

**Prouvé :** `scripts/ads-tests/ads-config.mjs` 7/7 (absente → éteint ; paire valide → allumé ; vide, sans `ca-`, sans emplacement, emplacement mal formé → build refusé) ; le banc `prelancement-01-10.mjs` vérifie sur le build local, 3 moteurs, qu'aucun script AdSense, aucun bloc, aucun lien « Privacy choices » et aucune section « Advertising » n'existent éteint, et que `/ads.txt` répond 404. **Allumé** (build de test `NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-0000000000000000`, jamais déployé, lu en HTML sans navigateur pour ne rien demander à Google) : `scripts/ads-tests/ads-on-build.mjs` **13/13** — valeurs par défaut du consentement (refusé dans les 32 pays) avant tout script Google, balise AdSense chargée au repos, **un** bloc de 280 px réservés sur une page outil et **aucun** sur l'accueil, libellé « Advertisement », lien « Privacy choices », section « Advertising » avec les mentions exigées par Google, `/ads.txt` = `google.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0`. Le `.next` local a ensuite été reconstruit **éteint** (vérifié : aucune trace de la valeur de test).

### 3.4 Plan d'emplacements (à appliquer après la mise en service, dans cet ordre, en mesurant)

| # | Emplacement | Pages | Format | Pourquoi / garde-fou |
|---|---|---|---|---|
| 1 | **Bas de page outil** (construit) | 225 pages outils | Display responsive, 280 px réservés | ne gêne jamais l'usage ; CLS 0 par la hauteur réservée ; chargé à l'approche |
| 2 | **Entre l'outil et le texte d'explication** | pages outils (≈ 15 gabarits à toucher : le bloc SEO commun `SeoContent`) | Display responsive, 250 px réservés | le moyen de 123apps (bloc sous la zone de travail) ; **à au moins 150 px du bouton Download**, jamais pendant un traitement |
| 3 | **Colonne de droite ≥ 1280 px** | pages outils sur grand écran | 300×600 collant dans sa colonne | le contenu tient dans 42-48 rem : l'espace existe ; aucune annonce collante sur mobile |
| 4 | *Mobile, facultatif* | — | ancre (« anchor ») des annonces automatiques de Google, seule | aucune annonce interstitielle, aucune autre annonce automatique (elles se glissent dans les outils) ; à mesurer sur le taux de réussite des outils |

**Budget de vitesse (PARTIE 2) :** balise en `lazyOnload`, blocs demandés à l'approche, hauteurs réservées → pas d'effet attendu sur LCP ni CLS ; la charge des annonces tombe après l'interaction. **À mesurer à l'allumage** (Lighthouse sur 10 pages, même banc) ; si le TBT des pages outils monte de plus de 100 ms, retirer l'emplacement 2 d'abord.

**Densité :** au plus 2 blocs par page outil sur mobile, 3 sur grand écran (123apps en affiche 2 dans le HTML d'une page outil).

### 3.5 Seuil et gestes du propriétaire

**Seuil (plan) : 20 à 50 visiteurs réels par jour**, pas avant (une demande AdSense sur un site sans trafic est souvent refusée pour « contenu de faible valeur » et le revenu serait nul). À ce moment, ≈ 45 min :
1. créer le compte AdSense (site `www.onlineconvertools.com`, adresse de paiement) ;
2. AdSense → **Confidentialité et messages** → créer et publier le message **« Réglementations européennes »** (EEE, R.-U., Suisse ; option « Gérer les options » visible) ; facultatif : message « Réglementations des États américains » ;
3. créer **un bloc d'annonces Display** (responsive) ;
4. Vercel → Settings → Environment Variables (Production) : `NEXT_PUBLIC_ADSENSE_CLIENT` = `ca-pub-` + 16 chiffres, `NEXT_PUBLIC_ADSENSE_SLOT_TOOL_FOOTER` = l'identifiant du bloc (10 chiffres) ; puis demander à Claude le redéploiement et la vérification (balise, `/ads.txt`, message de consentement vu depuis un VPN européen, Lighthouse) ;
5. dans AdSense, « Sites » → valider le site (le code et `/ads.txt` seront en place) ;
6. le jour même, **relire les trois contrats** du déclencheur (Vercel Hobby → Pro : usage commercial ; Adobe ; OpenAI).

## 4. Kit Product Hunt à jour

**Règles relues en direct le 30/09** (`producthunt.com/launch/preparing-for-launch`) : galerie **1270 × 760**, vignette **240 × 240**, fichiers **< 3 Mo**, accroche **60 caractères**, description **500** (page A ; le centre d'aide dit 260 : on reste sous 260), vidéo YouTube seulement, premier commentaire chez ≈ 70 % des produits du jour.

**Faits ajoutés (tous mesurés, sources dans le kit) :** AI Detector 0/57 humains dits IA et 40/40 IA reconnues (`RAPPORT-p17-30-09.md` §1.3) ; photos de 48 Mpx dans les outils image, sous la limite de canvas de l'iPhone simulée (P16, 42/42 ×3 moteurs sur www ; vrai Safari du Mac 38/40) ; flou 12/24/48 Mpx en 1,5 / 2,3 / 4,7 s dans le moteur de Safari (WebKit sur www) ; coupe précise à l'image (120 images, 4,000 s) ; tout sans envoi quand l'outil est local.

**Chiffre corrigé :** « about 180 run entirely in your browser » était périmé — P15 a passé Video Rotator, Resizer, Filter et Merger sur le service. **Recompté dans le code : 176 outils entièrement locaux, 49 utilisent un serveur dans au moins un cas** (`scripts/count-server-tools.mjs`, même liste que la politique de confidentialité, établie à la main puis retrouvée à l'identique par le script). Textes : « about 175 » (arrondi par défaut). La galerie recompte à chaque capture et s'arrête si le code et le compteur du site divergent.

**Premier commentaire relu :** 7 résultats, chacun avec sa source ; retiré volontairement ce qui n'est pas prouvé (« testé sur un vrai iPhone » — la passe iPhone de P16 n'est pas faite, on écrit « within the iPhone's memory limit », qui est mesuré) ; les deux passages ⟦…⟧ restent au propriétaire.

**Galerie régénérée** depuis le build local de cette branche (`af6dbed1`) : 10 images 1270 × 760 (59-200 Ko) + vignette 240 × 240 ; pendant la capture : compteur 225, **176 outils locaux recomptés dans le code**, **0 requête d'envoi** pendant la compression de l'image 2 ; regardées (accueil, AI Detector, Image Blur).

## 5. Vérification AI Detector sur www — prête

`scripts/ai-detector/www-check-p17.mjs` (commit `548b74bc`) se lance tel quel **depuis le dossier du dépôt** (chemins relus à côté du script) ; il affiche l'heure UTC, un PASS/FAIL par texte, et **distingue la limite du jour** : « NOT RUN … daily limit » avec le **code de sortie 2** (rien facturé) au lieu d'un faux échec.

**Commande pour le propriétaire, ce soir après 20 h 00 (heure de Toronto = 00 h 00 UTC) :**

```
node scripts/ai-detector/www-check-p17.mjs
```

Attendu : `PASS LIGO 2016 abstract (human) -> expected human got human …`, `PASS ai-… (AI) -> expected ai got ai …`, puis `RESULT: both verdicts right`. Coût ≈ 0,25 $ de crédits Pangram. Code 2 = relancer plus tard ; code 1 = me transmettre les lignes affichées.

## 6. Tests sur tout ce qui a changé (build local final, 3 moteurs)

| Banc | Chromium | Firefox | WebKit | Ce qu'il couvre |
|---|---|---|---|---|
| `prelancement-01-10.mjs` (nouveau, 64 contrôles) | **ALL PASS** | **ALL PASS** | **ALL PASS** | `<main>`, police, Translate à la demande (menu → traduit → page suivante retraduite), Analytics différé, Sign In, méga-menu avec icônes, pages légales, AdSense éteint (`/ads.txt` 404, aucun bloc), PDF Sign tapé et importé, 8 outils PDF à pdf-lib différé, Password Generator (300 tirages), URL Encoder ×2, Sticky Notes |
| `qualite-29-09.mjs` (audit du 29/09) | 76/76 | 76/76 | 75/75 (1 impossible dans ce WebKit, comme avant) | cron, Text to PDF, PDF Rotate chiffré, JPG to PDF, extraction, etc. |
| `pdf-audit-2.mjs` | 31/31 | 31/31 | 31/31 | PDF Sign (placement), Forms, Redact, Crop… |
| `seo-pages-29-09.mjs` | 10/10 | 10/10 | 10/10 | les 10 pages SEO (JSON-LD, exemples rejoués dans l'outil, liens) |
| `currency-converter.mjs` | PASS | PASS | — (non prévu pour WebKit) | taux, 166 devises, date des taux |
| `ads-config.mjs` (Node) | 7/7 | | | valeurs absentes / valides / mal formées |
| `all-pages-load.mjs` (238 pages : accueil, 12 catégories, 225 outils) | **238/238** | **238/238** | **238/238** | statut 200, `<h1>`, aucune erreur JavaScript |
| Build « annonces allumées » (valeurs de test, jamais déployé ; HTML servi seulement) | **13/13** (`ads-on-build.mjs`) | | | consentement, balise, bloc, lien, section Advertising, `/ads.txt` |

**Défaut trouvé par ces bancs et corrigé (`41725464`) :** sous WebKit, le choix d'une langue était perdu — la liste cachée de Google existe avant d'être remplie, et, maintenant que le script arrive à la demande, notre code y écrivait trop tôt (Chromium passait par chance de minutage). Vérifié contre la production : le même WebKit y traduit (script chargé depuis longtemps) ; ce n'était donc **pas** un défaut en ligne, mais une régression de cette branche, fermée avant tout déploiement.

## 7. État à l'arrêt

- Commits : voir `git log --oneline restauration-avant-prelancement-01-10..prelancement-01-10`.
- Aucun processus laissé (serveur local, navigateurs de test) ; `.serena/` et `pip.log` laissés tels quels (non suivis, antérieurs).
- **Ce qui attend le propriétaire, dans l'ordre** : le tableau « Reste avant Product Hunt » en tête du plan (étapes 1 à 13).

