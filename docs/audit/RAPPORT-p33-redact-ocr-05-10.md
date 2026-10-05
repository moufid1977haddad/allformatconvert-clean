# RAPPORT — P33 : PDF Redact, PDF OCR, et deux limites honnêtes (05/10)

Branche de travail `p33-redact-ocr`, branche publiée `p33-deploy` (même arbre, deux commits : service puis site),
repère de restauration `restauration-avant-p33-05-10` = `57f7f977`.
**Règle (P21, P31, P32)** : aucune des deux pannes du 4 octobre au soir n'est reproduite en WebKit simulé ; statut maximal
**« corrigé, à confirmer sur iPhone »**.

## 0. Résumé

| Point | Statut | Preuve principale |
|---|---|---|
| 1 PDF to JPG — qui a dessiné ? | **le téléphone lui-même** | aucune requête `/api/pdf-render` sur Vercel ni `/v1/render-page` sur pdf-tools pendant le test (méthode validée sur l'appel de contrôle P32 de 23 h 50) |
| 2 PDF Redact | **corrigé, à confirmer sur iPhone** — panne non reproduite ; l'interface répond toujours ; **vraie suppression** vérifiée et **renforcée** après deux relectures indépendantes : 21 fuites prouvées sur des PDF piégés (dont plusieurs réalistes : sommaire qui pointe vers la page noircie, champ de formulaire lié, ressources partagées, lien mailto), **toutes présentes en production avant P33**, corrigées | banc `redact-truth` (pdftotext, PDF.js, octets, OCR de chaque page, pages orphelines) sur 31 PDF ; audit PDF n° 2 ; Safari 16.4 simulé |
| 3 PDF OCR | **corrigé, à confirmer sur iPhone** — une seule liste avec recherche (1 à 3 langues, langue du navigateur) ; sur iPhone / iPad, 20 s sans progrès ou échec → OCR serveur (Tesseract sur pdf-tools), avis avant et après ; 102 langues installées en production | service 34/34, route 37/37, navigateur 21/21 (WebKit et Chromium iPhone), bureau 12/12, **préversion + pdf-tools de production 21/21** ; revue de sécurité « GO avec conditions », conditions appliquées |
| 3f Autres OCR dans le navigateur | **aucun** : PDF OCR est le seul (pas d'outil « Image to Text » sur le site) | recherche `tesseract` / `createWorker` / `ocr` dans `app/` |
| 4 Limites téléphone | **48 Mpx partout** (Image Compressor, JPG to PDF, Image to PDF) avec le même « Reduce to 48 MP » ; HEIC/AVIF enfin bornés ; « JPEG photos of any size » remplacé par ce qui est mesuré (jusqu'à 200 Mpx) | mesures WebKit/Firefox/Chromium §4 |

## 1. PDF to JPG — qui a dessiné les pages ? (test du 05/10, 00 h 30-00 h 36 UTC)

- **Vercel** (`vercel logs --environment production --source serverless`, 00 h 20 → 01 h 15 UTC) : trois invocations seulement,
  toutes `GET /api/tool-counts`. **Aucun `/api/pdf-render`, aucun `/api/report-error`, aucun `/api/pdf-ocr`.** Contrôle de la
  méthode : la même requête sur 23 h 30 → 00 h 20 montre bien `POST /api/pdf-repair`, `/api/pdf-compress` et
  `POST /api/pdf-render` à 23 h 50 min 06 s (le contrôle de P32).
- **Railway pdf-tools** : chaque requête écrit une ligne de métrique (`logMetric`). Le déploiement actif pendant le test
  (`1f697240`, du 04/10 23 h 51 au 05/10 03 h 34) n'a **aucune** ligne de requête ; le précédent (`43106653`) montre bien la
  ligne `/v1/render-page` de 23 h 50 (`rendered_full`, 96 759 o). Les journaux HTTP de Railway sont vides pour ce service
  (non disponibles par la CLI) ; aucune IP n'est affichée.
- **Conclusion (1c)** : le téléphone a dessiné les trois pages lui-même. La panne du 3 et du 4 octobre a disparu **sans cause
  prouvée** ; le secours serveur reste tel quel. L'avis après résultat ne manquait donc pas (il n'apparaît que si le service a
  dessiné).
- Constat annexe : aucune erreur n'a été remontée par Redact ni par l'OCR pendant la soirée (pas de `/api/report-error`) : ni
  message d'erreur affiché, ni exception non rattrapée.

## 2. PDF Redact

### 2a. Reproduction et cause
- Même fichier, même terme `photo-2`, aucune case cochée : **WebKit iPhone simulé 2,2 s, Chromium iPhone 2,1 s** → « Blacked out
  1 occurrence on page 2 », fichier proposé (`scripts/p33/redact-repro.mjs`). Non reproduit.
- Ce qui est **prouvé** sur l'iPhone : aucune requête de rendu (donc pas de page restée 20 s sans dessin), aucune erreur
  affichée ni remontée. Hypothèses classées : (1) le résultat est apparu **sous le clavier / sous la ligne de flottaison**
  (le résumé et le bouton Download s'affichaient sous le bouton, sans défilement) ; (2) une étape **sans limite de temps** est
  restée bloquée avant le dessin : lecture du texte (`getTextContent`, itération de flux complétée par `polyfills.js`),
  annotations, ouverture par pdf-lib — l'écran restait alors sur « Redacting... » ; (3) le toucher n'a pas atteint le bouton
  (clavier ouvert). Aucune n'est prouvée.
- **Correctif d'interface (2d)** : progression par page (« Page 2 of 3: reading its text… », « blacking out 1 occurrence… »,
  « drawing it on our PDF service… », « Checking the redacted PDF… ») ; chaque étape a une limite de 60 s et, au-delà, une
  phrase qui **nomme l'étape** (elle part aussi dans `tool_errors` : la prochaine panne réelle dira laquelle) ; aucune
  occurrence → « No match found for “photo-9” in this PDF's text (3 pages searched)… », sans fichier ; sinon « Blacked out 1
  occurrence (page 2: 1)… » puis le bloc Download / Save / Share ; le résultat ou le message est **ramené à l'écran**.

### 2b. Marché
Adobe Acrobat, iLovePDF et Smallpdf retirent le contenu choisi de la structure du PDF et gardent le reste sélectionnable ;
**PDF24 aplatit les pages touchées en image**, comme nous ([iLovePDF](https://www.ilovepdf.com/redact-pdf),
[Smallpdf](https://smallpdf.com/redact-pdf), [PDF24](https://tools.pdf24.org/en/redact-pdf),
[Adobe](https://helpx.adobe.com/acrobat/using/removing-sensitive-content-pdfs.html)).

### 2c. Vraie suppression ? — oui pour la page noircie dès l'origine ; **non pour le reste du fichier avant P33**
Banc `scripts/p33/redact-truth.mjs`, quatre contrôles indépendants puis deux de plus après la relecture : pdftotext, PDF.js
(texte + annotations), octets du fichier (flux décompressés, texte, hexadécimal, UTF-16), **OCR Tesseract de chaque page** à
300 dpi (témoin : le terme est lu sur l'original), objets `/Page` orphelins.
- Kit (`photo-2`) : page 2 aplatie à 144 dpi, « photo-2 » absent partout, Tesseract ne le lit plus ; le texte « Photo 2 »
  **dessiné dans la photo** reste (ce n'est pas le terme ; une image n'est jamais cherchée — comme chez Adobe sans OCR).
- **Fuites trouvées et corrigées** (toutes existaient en production) :
  - par nous : une adresse présente **seulement dans un lien mailto** (texte « Write to us ») restait dans le fichier ;
  - relecture indépendante n° 1 (NO-GO) : `copyPages` d'une page **sans** correspondance recopiait tout ce qu'elle atteint —
    la page d'origine noircie revenait par un **lien de sommaire** (`/Dest`), par un **champ de formulaire** lié (`/Parent` →
    `/Kids`), par des **ressources partagées**, `/PieceInfo` ; un **tampon**, une **pièce jointe**, un commentaire en **texte
    riche**, un lien **JavaScript** gardaient le terme ; un mot **coupé en fin de ligne** ou avec un **accent** dessiné à part
    (LaTeX) n'était pas trouvé ; le bord de « SECRET » (espacement des lettres) restait visible ;
  - relecture n° 2 : apparence d'un rectangle (`Square`), masque doux et `/Properties` partagés, `/DV` d'un champ ; un nom
    échappé (`/Im#31`) faisait disparaître une image légitime ; et **faux refus** du terme « Adobe » (présent dans toute
    police intégrée).
- **Correctif** (`app/lib/redactSanitize.js`, `app/lib/pdfRedact.js`) : deux passes — toutes les pages sont cherchées
  d'abord ; les pages noircies de la **source** deviennent des coquilles vides avant toute copie ; chaque page copiée garde
  seulement les ressources que son contenu nomme (toutes catégories, récursivement, noms échappés décodés), une liste blanche
  de clés de page et d'annotation, aucune annotation illisible (tampon, pièce jointe, média), aucun lien vers une page
  noircie ou à script, aucune apparence hors champs et liens ; la recherche ignore accents et traits d'union (des deux
  côtés : sur-noircir est le côté sûr) et lit liens, texte riche, sujets, scripts, pièces jointes ; boîte de la ligne entière
  quand la mesure dévie de plus de 3 % ; enfin **le fichier fini est relu** (texte et annotations par PDF.js, pièces
  jointes, chaînes de tous les dictionnaires, chaînes des flux de contenu, pages orphelines) et **refusé** si un terme y est
  encore : « This PDF could not be redacted safely … No file is given. »
- **Ce qui est conservé** (2c) : pages sans correspondance — texte sélectionnable identique, images, liens web et liens vers
  des pages gardées, champs de formulaire ; pages noircies — une image à 144 dpi (2 × 72), **plus de texte sélectionnable,
  plus de liens ni de champs** ; poids : kit 371 → 600 Ko (page photo ré-encodée en PNG), PDF de texte 3 → 29 Ko. Retirés des
  autres pages et dits dans le résumé : tampons, pièces jointes, médias, liens vers une page noircie ou à script.

### 2e. Relecture indépendante (sous-agent réviseur)
- Tour 1 (sur `ed12bbdb`) : **NO-GO** — 8 fuites + mots non trouvés + bords de lettres (liste au §2c).
- Tour 2 (sur `89d5211c`) : les 13 cas du tour 1 corrigés ; **NO-GO** encore pour 4 fuites sur PDF construits exprès (texte
  CID) + un faux refus réaliste (« Adobe »).
- Correctifs du tour 2 (`81c98da8`) rejoués : **31 PDF piégés** des deux tours, tous les contrôles passent (sauf, voulu : le
  texte des pages non touchées change quand un tampon / l'apparence d'un rectangle portant le terme en est retiré ; « Adobe »
  est accepté, le contrôle littéral du banc le voit encore dans `/Registry (Adobe)` d'une police, pas dans le texte) ; les
  formes recopiées de g2/g2b redessinées et lues : 0 occurrence ; 100 pages (terme en page 50) : ≈ 2 s.
- Tour 3 demandé sur la version en production : voir §7.
- **Limites dites** : un terme écrit dans une image (scan, photo) n'est jamais trouvé (comme partout sans OCR) ; un PDF qui
  cache un terme dans un objet que ni PDF.js ni le contrôle final ne lisent (texte codé CID dans une forme non dessinée,
  polices Type 3 sans correspondance Unicode) reste théoriquement possible ; la page noircie perd tout son texte
  sélectionnable (PDF24 fait pareil ; Acrobat / iLovePDF / Smallpdf le gardent). Proposition chiffrée au plan.

## 3. PDF OCR

### 3a. Une seule commande (combobox)
`app/components/LanguageCombobox.jsx` : champ `role="combobox"` + liste `role="listbox"` (ARIA 1.2), recherche par nom
anglais, nom natif ou code, sans accents ; puces des langues choisies avec bouton « Remove … » ; **1 à 3 langues** (iLovePDF
demande « les langues principales » du PDF ; Smallpdf et Adobe une seule) ; langue du navigateur présélectionnée si elle est
proposée (`fr-CA` → French) ; cibles ≥ 44 px, aucun débordement à 390 px ; clavier ↑ ↓ Entrée Échap Retour arrière.

### 3b. Cause — hypothèses classées (non reproduite : WebKit 4 s, Chromium 6 s, même fichier)
L'écran « Page 1 of 3 … 0 % » prouve que le moteur et l'anglais étaient chargés (la page n'affiche « Page 1 » qu'après) : le
blocage est au **dessin de la page** ou à la **reconnaissance**. (1) dessin pdf.js de la page sans fin sous iOS 26
(l'hypothèse de P32 : `FontFace.loaded` des polices standard), sans limite de temps dans l'OCR ; (2) le worker Tesseract
(cœur WebAssembly `relaxedsimd`/`simd` chargé depuis cdn.jsdelivr.net, 3,9 Mo + 2,9 Mo d'anglais) arrêté ou bloqué par iOS
sans message — Tesseract.js ne rejette jamais dans ce cas ; (3) mémoire. Pas de CSP sur le site (rien ne bloque le CDN).
Le test du soir n'a laissé aucune trace côté serveur (tout est dans le navigateur).

### 3c-3e. Correctif garanti, couverture, sécurité
- **Page** (`app/tools/pdf-tools/pdf-ocr/page.jsx`, `app/lib/serverPageOcr.js`) : sur iPhone / iPad, chaque étape (préparer
  le moteur, ouvrir, dessiner, reconnaître) a 20 s **sans progrès** ; à l'expiration ou à l'échec, cette page **et les
  suivantes** passent par `/api/pdf-ocr`. Avis avant (« On iPhone and iPad, a page your device cannot recognize within 20
  seconds is recognized by our own OCR service instead: your PDF is sent there, then deleted. ») et après (« This device could
  not recognize pages 1, 2 and 3, so our own OCR service recognized them… »). Sur ordinateur : rien n'est envoyé ; une étape
  sans progrès 90 s s'arrête avec une phrase. Échec du service : les pages déjà lues restent affichées.
- **Service** (`services/pdf-tools/src/ocr.js`) : `/v1/ocr-page` et `/v1/ocr-page-staged` ; `pdftoppm -gray` 300 dpi puis
  `tesseract … -c textonly_pdf=1 txt pdf` : le texte + le PDF texte seul de Tesseract, posé par la page sur la page
  **d'origine** (comme le chemin navigateur — même moteur). **OCRmyPDF non utilisé** : il renvoie tout le PDF réécrit (trop
  lourd pour revenir par Vercel) et, sur une page qui a déjà du texte, la saute (`--skip-text`) ou la transforme en image
  (`--force-ocr`). Qualité : scan 7 pt à 300 dpi, **CER 0,0 %** par le service (navigateur 0,8 %).
- **Langues** : les **102** de la liste sont installées (paquets Debian `tesseract-ocr-*`, contrôle au build), vérifié sur
  la production : `/health` → `tesseract: ok`, 102 modèles, `scripts/p33/ocr-languages.test.mjs` 4/4.
- **Limites (3e)** — mêmes que le rendu P32 : 4 Mo direct / 44 Mo par le service média (objet de ticket `pdf-ocr`), une page
  par requête, 300 pages/h et 1 000/jour par IP, 3 000/h pour tous (compteurs `pdf_ocr:*` séparés), autre site refusé, rien
  gardé. **Revue de sécurité** (sous-agent) : « GO avec conditions », aucun point bloquant ; appliqué : **1 OCR à la fois**
  et **12 Mpx** au plus (Tesseract ≈ 0,7-1 Go sur 25 Mpx dans un conteneur partagé), **copies staged bornées à 4** (rendu et
  OCR), réponse entière ≤ 4,2 Mo, Tesseract **ne bloque pas** `/health`. **Reste (décision propriétaire)** : une IP peut
  occuper l'unique créneau OCR avec des pages très denses (50 s chacune, sous les 300 pages/h) — même modèle que P32 ; à
  vérifier : `MEDIA_SERVICE_URL` de pdf-tools en réseau privé `railway.internal`.
- **Textes** : sous-titre, description, FAQ « Is my PDF uploaded? », métadonnées de la page et `/privacy` (« Sent to our own
  servers ») ne disent plus « entirely in your browser » sans réserve ; garde `privacy-claims` verte.

### 3f. Autres OCR dans le navigateur
Aucun autre outil : Data Extractor, PDF Extract Text, PDF to Word… lisent la couche texte et le disent.

## 4. Limites annoncées sur téléphone (sous-agent, commit `3c2b4cf1` repris)
- Borne téléphone commune `PHONE_MAX_PIXELS` = 48 771 072 px (la photo 48 Mpx du kit, 8064 × 6048, passe sans message) ;
  cible de réduction ≤ 48 000 000 (panorama → 12 220 × 3 927).
- Image Compressor : « … and 48 on a phone (48 MP phone photos fit; a larger image can be reduced to 48 MP first) », message
  « the limit is 48 megapixels » ; FAQ ajoutée.
- JPG to PDF / Image to PDF : non-JPEG > 48 Mpx → même avertissement à la sélection et « Reduce to 48 MP then convert to
  PDF » (réduction dans un worker, l'image réduite va dans le PDF). « JPEG photos of any size » → « JPEG photos go into the PDF
  as they are, without being decoded (measured up to 200 megapixels) » : mesuré dans WebKit (agent iPhone) jusqu'à un JPEG de
  200 Mpx / 103 Mo (541-734 Mo, JPEG intact octet pour octet).
- Mesures après (pic de l'onglet, Mo, Firefox / Chromium ; référence iPhone 961 Firefox) : panorama WebP réduit 968-970 /
  1 166-1 182 (avant 1 467) ; PNG réduit en PNG 728-755 ; WebP 48 Mpx sans message 964-969 (avant 1 150).
- En plus : HEIC et AVIF n'avaient **aucune borne** (taille non lue) — lue maintenant (boîte `ispe`).
- Reste : AVIF dans Firefox 1 066-1 235 Mo en mémoire vive (privée au niveau de la référence) ; HEIC non mesurable hors
  iPhone ; temps de réduction sur iPhone non mesuré.
- Marché : iLovePDF et Smallpdf bornent la taille du fichier, sans avertissement en mégapixels ni réduction proposée.
- Note : le sous-agent a tenté de copier `.env.local` dans sa copie de travail ; **bloqué par les permissions** ; il a
  construit avec des valeurs factices en ligne de commande, sans aucune clé réelle.

## 5. Mise en ligne (cycle unique)
1. **Bancs lourds en local** (construction de production, `npm run build` et ses gardes verts) : §2-§4, plus audit PDF n° 2
   (Redact 5/5, OCR 2/2, WebKit et Chromium), simulation Safari 16.4 (Redact, OCR, PDF to JPG, PDF to Image), P32 rendu
   service 25/25 + route 25/25 (non régression).
2. **pdf-tools d'abord, seul** : commit `281dada4` (service uniquement, additif) en avance rapide sur master → déploiement
   `85aa2c7b` SUCCESS ; `/health` vert (tesseract ok, **102 modèles**, `ocr-languages.test` contre la production 4/4) ;
   ancien comportement sur www : PDF Repair 200 (qpdf, texte identique, 3 pages), Compress 200 (371 → 91 Ko), rendu P32 200.
3. **Préversion, une seule fois** : `onlineconvertools-jwfybpxst` (commit `a24d51a2` ; la préversion créée par l'API en double
   a été annulée), par `vercel-preview-proxy` (jeton frais en mémoire) : **OCR WebKit iPhone 21/21 avec la vraie route et le
   pdf-tools de production** (3 pages reconnues par le serveur, CDN bloqué, panne en page 2, eng+fra), Redact kit + PDF
   difficile + f1, appareil et page dessinée par le service : 12/12, 35/35, 12/12, 35/35, 11/11.
4. **Production** : master `81c98da8` (avance rapide ; seul écart avec la préversion : le correctif Redact du tour 2,
   uniquement côté navigateur, testé en local) → Vercel **`onlineconvertools-6j94la1q7`** prête ; pdf-tools reconstruit sur
   le même service (`82579ade`, SUCCESS).
5. **Contrôle léger sur www** : www-light **29/29** ; `/health` 102 langues ; **un** appel `/api/pdf-ocr` (page 2, eng+fra) :
   200 en 2,7 s, texte et couche lus ; méta-descriptions et « 48 on a phone » en ligne. **Aucune régression, aucun retour
   arrière.**
- **Retours arrière prêts** : Vercel → promouvoir `onlineconvertools-4wlsf2hp8` (site de P32, service P33) ou
  `onlineconvertools-l0fs94z0x` (P32 complet) ; pdf-tools → annuler `281dada4` par un commit sur master (les anciens points
  d'entrée sont inchangés).
- **Dépenses** : 0 $ (aucun fournisseur payant) ; Railway : trois reconstructions de pdf-tools (image plus lourde : 102
  modèles Tesseract) ; Supabase : rien de modifié (les compteurs `pdf_ocr`, `pdf_render`, `office_rate` ont été incrémentés
  par l'appel de contrôle et les bancs de la préversion, comme tout usage réel).

## 6. Mini-passe iPhone (4 vérifications, fichiers déjà sur l'iPhone)

| # | Page | Fichier | Geste exact | Résultat attendu |
|---|---|---|---|---|
| 1 | PDF Redact | `kit-iphone-p21/pdf-avec-images.pdf` | Choisir le fichier ; dans « Text to redact », taper `photo-2` ; toucher **Redact PDF** | Sous le bouton, une ligne grise change : « Page 1 of 3: reading its text… » … « Page 2 of 3: blacking out 1 occurrence(s)... » … « Checking the redacted PDF… » ; puis, ramené à l'écran : « Blacked out 1 occurrence (page 2: 1). This page is now a flattened image, and the finished file was checked… » et la ligne `redacted.pdf` avec **Download** et **Save / Share**. Ouvrir : page 2 avec « photo-2 » noirci, le reste lisible. **Si ça bloque : noter la dernière phrase grise affichée** (elle nomme l'étape) |
| 2 | PDF Redact | même PDF | Remplacer le texte par `photo-9` ; **Redact PDF** | En rouge : « No match found for “photo-9” in this PDF's text (3 pages searched)… », aucun fichier |
| 3 | PDF OCR | même PDF | Toucher le champ « Language of the document » (le français doit déjà y être si l'iPhone est en français) ; taper `eng`, toucher **English** ; toucher hors de la liste ; **Run OCR** | Avant de toucher : la phrase grise « On iPhone and iPad, a page your device cannot recognize within 20 seconds… ». Puis soit le texte des 3 pages en moins d'une minute (le téléphone l'a fait), soit après ~20 s « Page 1 of 3 — Recognizing it on our OCR service... » puis « This device could not recognize pages 1, 2 and 3, so our own OCR service recognized them… ». **Noter lequel** (c'est la preuve qui manque). Puis **Download** de `pdf-avec-images-searchable.pdf` |
| 4 | Image to PDF | `kit-iphone-p19/photo-48mpx.heic` | Choisir le fichier ; **Convert to PDF** | Aucun message ambre (48 Mpx est la limite téléphone) ; un PDF d'une page ; la page ne se recharge pas |

## 7. Relecture finale de Redact (tour 3)
