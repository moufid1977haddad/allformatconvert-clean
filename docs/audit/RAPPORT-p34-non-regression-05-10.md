# RAPPORT — P34 (lot B de la nuit du 05/10) : non-régression de tous les outils, en local

Construction de production locale (`next build` avec ses gardes, puis `next start` sur le port 3100), lancée avec
`scripts/p34/fake-all-providers.mjs` : **aucun appel payant** (ConvertAPI → une ancienne sortie réelle ; OpenAI, Pangram,
Google Translate, fal → 503 ; ntfy et Resend → avalés, aucune alerte au téléphone du propriétaire) et **rien écrit dans
Supabase** (réponses neutres). Preuve : le journal d'interception (`FAKE_LOG`) ne contient aucune requête de fournisseur
pendant les bancs ; un appel de contrôle à `/api/report-error` montre bien `supabase /rest/v1/rpc/…` intercepté. Les bancs
n'ont rien envoyé à www. Scripts : `scripts/p34/run-all.sh` (vague 1), `run-more.sh` (vague 2), `rerun-failed.sh`,
`rerun-2.sh` ; sorties complètes dans `%TEMP%\p34-out`.

## 1. Résultat global

- **Aucune régression d'outil trouvée.** Les pannes nettes trouvées sont **deux textes faux**, corrigés (§3).
- Vague 1 (≈ 120 lancements) : tests Node 34 fichiers ; chargement de **toutes les pages** ×3 moteurs + Safari 16.4 simulé ;
  lots P24 ×3 ; audits n° 2 (image, GIF, PDF, AV, divers) ×3 ; clavier ×3 ; noms de téléchargement P31 ×3 + iPhone ;
  table des types P31 (`output-formats` 69/69) ; téléchargements iPhone / iPad / Chromium (174 / 174 / 188) ; RAW iPhone et
  iPad 35/35 ; grandes images iPhone / iPad ; mise en page iPhone + iPad (450 pages) et 390 / 375 px ; bancs P31-P33 ;
  **solidité de tous les outils : 522/522 sur Chromium, Firefox et WebKit**.
- Vague 2 : 69 bancs ponctuels d'outil (Chromium) ; ceux qui demandent des arguments absents ici sont listés en §4.

## 2. Tableau outil → résultat → cause

| Outil / banc | Résultat final | Cause de l'échec initial |
|---|---|---|
| Tests Node (34 fichiers) | ✅ tous verts | `ocr-service` : port 3591 occupé par le service local des bancs (34/34 une fois libéré) ; `pdf-images-exif`, `doc-queue`, `sanitize` : lancés sans leur argument obligatoire (relancés avec : verts) |
| Toutes les pages ×3 + Safari 16.4 | ✅ | — |
| Solidité (tous les outils) ×3 | ✅ 522/522 ×3 | — |
| Lots P24 (adds, dev, image, GIF, AV, PDF, TIFF, décodeurs) ×3 | ✅ sauf voir ci-dessous | WebKit/Chromium : **banc** — le lien de résultat n'a son adresse qu'un instant après son apparition (P31) ; le banc lisait la page HTML (« XML does not have <svg> root », « @keyframes ») → attend `[href]` |
| File Splitter (Chromium) | ✅ 46/46 | même cause (banc) |
| Excel to CSV, GIF to APNG (WebKit) | ✅ | même cause (banc) |
| Regex Tester (WebKit) | ⚠️ banc | le moteur d'expressions de WebKit termine le motif « catastrophique » sans emballement : la page affiche « No match » au lieu du message d'arrêt après 2 s ; la page reste réactive — **pas un défaut** |
| Audits n° 2 image ×3 | ✅ 13/13 ×3 | banc : lien lu trop tôt ; type `application/octet-stream` **voulu** depuis P31 (le banc lit maintenant le format dans les octets) |
| Audit GIF / AV (WebKit) | ✅ GIF 7/7 ; AV 2/4 | **environnement** : le WebKit de Playwright sous Windows **n'a pas d'AudioContext** (vérifié) — Audio Waveform / Booster ne peuvent pas décoder ; le vrai Safari en a un |
| Audit divers (Firefox) MOBI to EPUB | ✅ 25/25 | banc (lien lu trop tôt) |
| PDF to Images P21 ×3 | ✅ 12/12 ×3 | banc : « Mode » et « Pages » trouvaient aussi le bouton « Switch to dark mode » (libellé exact) |
| Size preflight (WebKit) | ⚠️ 7/8 | **environnement** : pas d'OffscreenCanvas dans le WebKit de Playwright (Image Compressor « Reduce then compress ») — limite connue (P32) |
| **CSV to SQL — exemple de la page** | ✅ **corrigé** | **panne nette** : l'exemple affichait `VARCHAR(255)`, `DECIMAL(18,6)` et des noms sans guillemets, l'outil donne `"name" VARCHAR(7)`, `DECIMAL(3, 1)` (typage ajusté aux données depuis P24) ; deux réponses de FAQ et un conseil décrivaient aussi l'ancien typage (« Table and column names are written as they are, without quotes » — faux) |
| **Politique de confidentialité — date** | ✅ **corrigé** | **panne nette** : la page promet de changer « Last updated » à chaque nouvel envoi de données ; contenu changé le 04/10 (P32, pages dessinées par notre service) et le 05/10 (P33, OCR) mais date restée au 3 octobre → **5 octobre 2026** |
| Code Minifier (qualité 29/09) | ✅ | banc : une espace est gardée entre deux balises **depuis P24, exprès** (« Helloworld ») |
| Text to PDF (qualité 29/09) | ⚠️ banc | le banc attend « emoji refusé » ; l'outil **dessine maintenant l'emoji** (Noto Color Emoji, vérifié : « я 😀 » visible et copiable) — banc à mettre à jour |
| QR Scanner, caméra / collage | ✅ | banc : deux zones `role=status` sur la page (message correct : « No camera was found. Upload a photo of the code instead. ») |
| Image to Base64 48 Mpx | ⚠️ banc | l'aperçu est volontairement limité à 100 000 caractères (la page le dit ; Copy et Download donnent tout) |
| Bancs P33 (OCR, Redact, réduction 48 Mpx), P32 (rendu) | ✅ | — |

## 3. Corrections nettes (test qui échouait avant, passe après)

1. **CSV to SQL** (`app/tools/developer-tools/csv-to-sql/seo.js`, `page.jsx`) : exemple réécrit d'après la sortie réelle ;
   réponses « types » et « bases de données » et le conseil réécrits d'après `csvToSql.worker.js`. Banc
   `seo-pages-29-09.mjs` : échec → **ALL PASS (10 pages)**.
2. **Politique de confidentialité** : « Last updated: October 5, 2026 ». Banc `prelancement-01-10.mjs` (attente mise à
   jour) : échec → **ALL PASS**.
Aucune refonte, aucune nouvelle fonction, aucun texte marketing modifié. Bancs corrigés (sans toucher aux outils) :
`image-audit-2`, `gif-audit-2`, `av-audit-2`, `misc-audit-2`, `pdf-audit-2`, `safari16-pdf`, `qualite-29-09`,
`prelancement-01-10`, `improvement-17`, `qr-paste-button`, `p21-pdf-to-images`, `p24/adds-lot`, `dev-lot`, `gif-lot`,
`tiff-lot`.

## 4. Non lancés (et pourquoi)

- **Cible www, préversion ou service distant** (règle d'usage Vercel / pas de service configuré en local) :
  `deploiement-29-09-*`, `p16-video-www`, `e2e-*-remote`, `e2e-video-service`, `media-service-*-live`, `staged-remote`,
  `pdf-compress-remote`, `convert-remote`, `trimmer-precise-service`, `audio-opus-service`, `service-tools-mock`.
- **Appel IA réel ou payant** : `ai-real-calls-30-09`, `ai-detector-calibration`, `grammar-*`, `transcript-exports`,
  `upscaler-*`, `p15-units-upscaler-text`, `global-28-09`, `p21-phase7`, `svg-check-calibration`.
- **Arguments absents ici** (chemin de ffprobe / ffmpeg — non installés sur cette machine —, dossiers de fichiers d'essai,
  deuxième site de référence) : `p21-audio-formats` ×3, `audio-*`, `cut-join-audit`, `media-metadata`, `night-28-09`,
  `unplayable-messages`, `ios-video-first-frame`, `mediarecorder-tools`, `screen-recorder-mp4`, `trimmer-*`,
  `video-tools-mp4`, `video-trimmer-*`, `voice-recorder-m4a`, `vague1-controls`, `hash-generator`, `qr-generator`,
  `image-resizer`, `image-converter-formats`, `pdf-split`, `zip-extractor*`, `e2e-image-compressor`, `e2e-avif`,
  `rotation-players`, `*-vs-reference`, `*-vs-ezyzip`.
- **Bancs devenus obsolètes** (attendent des libellés d'avant le composant de téléchargement unique de P18 : « Download
  PDF », « Download Page 2 »…) : `ios-download`, `data-url-downloads`, `image-tools-big`, `image-editor-big`.

## 5. Au plan (plus qu'une correction nette)

- **P3 — maintenance des bancs** : 4 bancs obsolètes (§4) à réécrire sur `FileDownload` ; `qualite-29-09` (emoji) et
  `image-tools-rest-big` (aperçu Base64) à aligner ; installer ffprobe/ffmpeg en local pour rouvrir ≈ 20 bancs audio/vidéo.
- **P3 — environnement** : AudioContext et OffscreenCanvas absents du WebKit de Playwright sous Windows — les outils audio
  et la réduction d'Image Compressor ne sont exercés que par Chromium/Firefox en local (le vrai Safari : passes iPhone).
- Aucun outil n'annonce un résultat qu'il ne livre pas (priorité 1 : aucun cas trouvé hors §3).

## 6. Déploiement (un seul, fin du lot B)
(complété ci-dessous)
