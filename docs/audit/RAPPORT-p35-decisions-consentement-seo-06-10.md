# RAPPORT — P35 : décisions P33, consentement Europe, SEO technique S1-S3 (06/10)

Propriétaire absent (retour 18 h, UTC-4) ; aucune question posée ; ce qui lui revient est au plan (`claude/plan-de-travail.md`,
section P35). Branche `p35`, repère de restauration `restauration-avant-p35-06-10` = `739aad96`. Chaque lot est commité
et poussé avec sa partie de ce rapport avant le suivant.

## Résumé (06/10)
- **Production** : Vercel `onlineconvertools-gbnnrjftd` = `206684a1` (lots 1, 2, 3) ; pdf-tools `c92b907b` (+ reconstructions
  sur les poussées de master, même service), `MEDIA_SERVICE_URL` privée. Trois cycles préversion → production, **aucun
  retour arrière**, www-light 29/29 après chacun.
- **Lot 1** : OCR serveur 2 à la fois / 1 par visiteur / file avec la place affichée ; réseau privé Railway pour pdf-tools →
  média ; Redact garde le texte hors des zones noircies (31 PDF piégés : 0 fuite, Chromium et WebKit) ; PDF OCR ne double
  plus le texte ; D4 : pas de confirmation.
- **Lot 2** : Google Analytics plus du tout chargé dans l'EEE, au Royaume-Uni, en Suisse ni pour un pays inconnu.
- **Lot 3** : 0 titre cassé, canonical et H1 justes, « Related tools » et JSON-LD sur les 225 pages d'outil.
- **Échecs / limites** : aucun déploiement en échec ; non vérifiable d'ici : Analytics vu depuis un vrai pays européen
  sur www (P35-3) ; banc « mot le plus fréquent » de Redact sur le corpus fait à 6/35 (le balayage Node de 252
  rédactions le couvre) ; aucune passe Firefox pour Redact.
- **Dépense : 0 $** (aucun fournisseur payant appelé ; Vercel Pro : 3 préversions + 5 constructions de production
  dont 2 sans changement de site ; Railway : 4 reconstructions de pdf-tools ; validateur schema.org gratuit).
- **Sous-agents** : 4 (Redact D3, carte des outils liés, 2 relectures : sécurité D1, conformité lot 2) ; règles des secrets
  copiées dans chaque consigne ; aucun n'a lu de fichier de secrets.

## Lot 1 — décisions P33 tranchées par le propriétaire

### D1 — OCR serveur : 2 à la fois, 1 par visiteur, file d'attente avec la place

**Marché** : iLovePDF, Smallpdf et PDF24 font toute l'OCR sur leurs serveurs, sans place affichée (barre de progression
seule) ; OCR2Edit (famille online-convert) annonce « no waiting » comme avantage payant, donc une file pour l'offre
gratuite. Personne n'affiche la place ; nous la donnons parce que l'attente peut atteindre quelques minutes sur iPhone.

**Fait** (service `services/pdf-tools/src/ocrQueue.js`, `ocr.js`, `server.js` ; site `lib/pdfOcr.js`,
`app/api/pdf-ocr/route.ts`, `app/lib/serverPageOcr.js`, page PDF OCR) :
- **2 reconnaissances à la fois** sur le service (`OCR_CONCURRENCY` = 2), **1 par visiteur** : la clé du visiteur est un
  HMAC (clé de service du site) de l'adresse IPv4 ou du **préfixe /64** d'une IPv6 — jamais l'IP, jamais écrite dans les
  journaux ; une connexion IPv6 possède souvent tout un /64 (relecture).
- **Au-delà : file d'attente côté serveur**, premier arrivé premier servi (une requête qui attend son propre visiteur ne
  bloque pas les autres). La page reçoit des lignes JSON : sa place à chaque changement (et toutes les 10 s pour qu'aucun
  proxy ne coupe), « started » au début de sa reconnaissance (répété pendant), puis le résultat. Message affiché :
  « Waiting for our OCR service, which is busy with other pages: yours is number 3 in line. It starts by itself; keep this
  page open. » puis « yours is next ». **Aucun échec ni secours inutile** : la page attend.
- **Bornes de la file** (refus avec une phrase, jamais une attente sans fin) : 20 requêtes en attente au total, 2 par
  visiteur, 200 s d'attente au plus (+ 50 s de reconnaissance comptées à partir de son début ; fonction Vercel 300 s).
- La copie d'un gros PDF (staged) n'est prise qu'**une fois le créneau obtenu** : la file ne garde aucun fichier de
  44 Mo en attente.
- **Compatibilité** : sans l'en-tête `X-OCR-Stream: 1` (site d'avant P35), le service répond exactement comme P33 (JSON,
  20 s d'attente puis 503 « busy », 50 s en tout). Service publié seul d'abord.
- `/health` du service : `ocr: {concurrency: 2, line: true}` (aucun compteur de visiteurs).

**Tests** : `scripts/p35/ocr-queue.test.mjs` 16/16 (logique pure : 2 au plus, 1 par visiteur, ordre, places décroissantes,
file pleine, attente expirée, annulation) ; `scripts/p35/ocr-line.test.mjs` **18/18** contre le vrai service local
(Tesseract) : 7 requêtes simultanées de 4 visiteurs → toutes servies, jamais plus de 2 en même temps ni 2 d'un même
visiteur, places annoncées 5 → 4 → 3 → 2 → 1 ; le 4ᵉ envoi d'un visiteur qui en a déjà 2 en attente refusé (429, sa
phrase, pas d'alerte) ; un visiteur qui ferme la page sort de la file (`line_aborted`) et celui de derrière avance de 2 à
1 ; ancien appelant : JSON, deux servis, le troisième « busy » ; aucune IP ni clé dans les journaux ; aucune ligne « en
file » après le début de la reconnaissance. Non-régression P33 : service 34/34, route 37/37. **Navigateur** (WebKit
iPhone, page locale, 6 autres visiteurs devant) : la page affiche « number 5 → 4 → 3 → 2 in line », « yours is next »,
puis le texte des 3 pages, 3/3 ; `scripts/p33/ocr-fallback.mjs` (WebKit iPhone) : voir §Lot 1 — tests finaux.

**Relecture de sécurité** (sous-agent) : **GO avec conditions** ; appliqué : (1) la ligne de maintien répétait la place
pendant la reconnaissance (la page aurait réaffiché « number 2 in line ») → « started » ; (2) une exception après le
début du flux laissait la connexion ouverte jusqu'à 285 s → erreur rendue dans la dernière ligne ; (3) IPv6 : clé par /64 ;
(8) refus « déjà en attente » reconnu par un champ `reason` et non par le texte ; (9) clé = HMAC et non SHA-256 nu
(réversible en IPv4). **Notes acceptées** : un refus de la file (pleine, expirée) consomme quand même la page du quota
horaire du visiteur (le quota est réservé avant l'envoi, comme P33) ; mémoire : 2 Tesseract × ≤ 1,5 Go d'espace
d'adresses (mesuré en P33 : 0,7-1 Go sur une page dense de 25 Mpx), aucune limite de mémoire posée sur le service
Railway (`limitOverride` nul) ; le bouton d'annulation de la page n'existe pas : seule la fermeture de l'onglet libère la
place.

**En production** : pdf-tools `c92b907b` (déploiement Railway `cc305b32`, 05/10 07 h 51, heure de Montréal) ; `/health`
`concurrency 2, line true`, 102 langues ; ancien site sur www : un appel `/api/pdf-ocr` (page 2, eng+fra) 200 en 3,1 s ;
www-light 29/29.

### D2 — `MEDIA_SERVICE_URL` de pdf-tools en réseau privé

- Lecture par `scripts/p35/railway-vars.mjs` / `media-url-private.mjs` (la CLI Railway est lue dans le processus, seul un
  booléen est affiché) : **privé : non** (adresse publique).
- Port du service média : aucune variable `PORT` ; Railway injecte `PORT=8080` à l'exécution, gunicorn écoute
  `0.0.0.0:$PORT` ; le réseau privé Railway résout en IPv4 et IPv6 pour les environnements créés après le 16/10/2025
  ([Railway](https://docs.railway.com/networking/private-networking/how-it-works)) ; le trafic privé réveille un service en
  veille ([Railway, App Sleeping](https://docs.railway.com/reference/app-sleeping)).
- **Bascule** (`scripts/p35/media-url-switch.mjs private`, ancienne valeur gardée hors dépôt pour le retour arrière) :
  `http://${{media-processing.RAILWAY_PRIVATE_DOMAIN}}:8080` → **privé : oui** ; redéploiement pdf-tools `fa232a69`
  (07 h 54).
- **Contrôle** : chemin « gros PDF » de bout en bout sur www (`scripts/p32/staged-render-preview.mjs` : billet du site,
  envoi au service média, pages 1 et 6 dessinées par pdf-tools qui va chercher le fichier **par le réseau privé**,
  suppression) : **7/7**, avant (adresse publique) comme après ; www-light 29/29 (outil média Media Player compris).
  Aucun retour arrière nécessaire.

### D3 — Redact : texte sélectionnable hors des zones noircies

**Marché** : Adobe Acrobat, iLovePDF et Smallpdf retirent le contenu choisi et gardent le reste sélectionnable ; PDF24
aplatissait la page entière en image, comme nous jusqu'ici (P33 §2b).

**Fait** (sous-agent dans une copie de travail isolée, commit `ad3f7020` repris ; `app/lib/pdfRedact.js`, page PDF
Redact) : chaque page noircie reste une image (rien de l'original n'est recopié) **plus une couche de texte invisible**
(mode de rendu 3, Helvetica WinAnsi, largeur ajustée mot par mot) des **mots hors des zones noircies**. Exclus : tout mot
touché par une correspondance, tout mot dont la boîte (élargie comme une boîte noire) touche une boîte noire (texte ou
annotation), le texte vertical ; puis la recherche des termes et motifs est **refaite sur les mots gardés mis bout à
bout** et tout ce qui reformerait un terme est retiré. Le contrôle final du fichier (`verifyRedacted`, P33) est
inchangé et refuse toujours un fichier où un terme se trouve. Textes de la page (résumé, description, FAQ, astuces)
alignés : image de la page + couche invisible des mots hors des boîtes ; mots voisins d'une boîte, texte vertical et
alphabets que Helvetica ne sait pas écrire (grec, cyrillique, arabe, asiatique, certains accents) non gardés.

**Bancs** (construction de production locale) :
- **31 PDF piégés de P33** (Chromium, avec OCR Tesseract de chaque page noircie) : **31 acceptés, 0 refus, 0 fuite**
  (pdftotext, formes redessinées, octets, PDF.js, OCR) ; « Adobe » (g5) accepté comme en P33. WebKit : voir tests finaux.
- Kit `photo-2` : `scripts/p33/redact-truth.mjs` **12/12** WebKit iPhone et Chromium ; `scripts/p35/redact-text-layer.mjs`
  **7/7** sur les deux moteurs : page 2 garde 7 mots sur 9 (« Page 2 - PDF avec images Image »), « d'origine » et « : »
  retirés car voisins de la boîte, terme absent du fichier, écart de position ≤ 0,97 pt ; page à MediaBox décalée,
  /Rotate 90 et texte à 30° : 15/15, ≤ 0,70 pt.
- **Faux refus** : « the » sur les 35 PDF réels : 0 refus, 0 fuite ; balayage Node de la relecture n° 3 de P33 (≈ 38 termes
  par fichier) : **252 rédactions acceptées, 0 refus, 0 fuite**, 76 247 mots gardés sur 561 pages noircies.
- **Limites dites** : les mots voisins immédiats d'une zone noircie ne sont pas gardés ; positions approximatives quand la
  police espace les lettres (Tc/Tw) ; liens et champs des pages noircies toujours retirés ; alphabets hors WinAnsi non
  gardés (une couche dans la police d'origine demanderait de la recopier, ce que P33 a interdit pour fermer les fuites).

### D4 et autres décisions P33 ouvertes

- **D4 — confirmation avant d'envoyer une page au service de rendu (iPhone)** : **non ajoutée**. Marché : iLovePDF,
  Smallpdf et PDF24 envoient toujours le fichier sans confirmation ; chez nous l'envoi n'a lieu qu'en secours, l'avis est
  affiché avant (en permanence sur iPhone/iPad) et après. Une confirmation ajouterait un geste au cas où l'appareil a déjà
  échoué.
- **P33 P3 — sur un PDF qui a déjà du texte, la couche OCR doublait le texte copié** : **tranché et fait**. Marché :
  OCRmyPDF saute par défaut les pages qui ont du texte (`--skip-text`), Adobe Acrobat refuse de les reconnaître (« page
  contains renderable text »). Désormais une page dont le propre texte fait au moins la moitié du texte reconnu ne reçoit
  pas la couche (le texte reconnu reste affiché, et la page le dit : « Pages 1, 2 and 3 already had selectable text: … not
  doubled ») ; un scan avec seulement un tampon texte (« Scanned by … ») reçoit toujours la couche. Test
  `scripts/p35/ocr-text-layer.mjs` 5/5 (PDF avec texte : « photo-2.jpg » une seule fois ; scan : couche ajoutée).

### Lot 1 — tests finaux (construction de production locale avec tout le lot)
- WebKit (iPhone simulé) sur les 31 PDF piégés, avec OCR : **31 acceptés, 0 refus, 0 fuite** (seul signal : « Adobe » dans
  `/Registry (Adobe)` d'une police, comme en P33) ; 41 mots gardés sur 38 pages noircies.
- `scripts/p33/ocr-fallback.mjs` WebKit iPhone (route réelle + pdf-tools local) : **21/21** (non-régression P33).
- `scripts/p35/ocr-line-browser.mjs` (WebKit iPhone, 6 visiteurs devant) : 3/3 ; `ocr-text-layer.mjs` 5/5.
- `npm run build` et ses gardes verts.

### Lot 1 — mise en ligne
- **Préversion, une seule fois** : `onlineconvertools-2e77vjplb` (= `3324ed50`), par le relais `vercel-preview-proxy` (jeton
  en mémoire), route réelle et **pdf-tools de production** : file d'attente `scripts/p35/ocr-line-deployed.mjs` **3/3**
  (une page à la fois pour un même visiteur, les deux autres reçoivent leur place puis leur texte) ; Redact kit WebKit
  iPhone 12/12 ; couche de texte 7/7 ; PDF OCR WebKit iPhone 21/21.
- **Production** : master `3324ed50` (avance rapide) → Vercel **`onlineconvertools-jccwufjem`** ; www-light **29/29** ;
  `ocr-line-deployed` sur www **3/3** ; pdf-tools reconstruit sur master, `/health` ok, `MEDIA_SERVICE_URL` toujours
  privée. **Aucun retour arrière.** Retour arrière prêt : promouvoir `onlineconvertools-2lg294nt3` (site de P34) ;
  pdf-tools : annuler `c92b907b` par un commit ; D2 : `scripts/p35/media-url-switch.mjs rollback` (ancienne valeur gardée
  hors dépôt).

## Lot 2 — consentement Europe (audit A1)

**Constat** (audit lot C) : `gtag` `G-7GFHW05JLH` chargé pour tous, sans `gtag('consent', …)` : cookies `_ga` posés sans
consentement pour les visiteurs de l'UE. **Marché** : Smallpdf, iLovePDF et PDF24 affichent une bannière de consentement
(CMP) aux visiteurs européens (connaissance générale, non revérifiée depuis l'Europe) ; ne rien charger du tout en Europe
est plus strict qu'une bannière et ne demande aucun compte.

**Fait** :
- `app/lib/analyticsRegion.js` : Analytics **seulement si le pays est connu et hors** EEE (27 + Islande, Liechtenstein,
  Norvège), Royaume-Uni, Suisse — plus leurs territoires à code propre (Åland, régions ultrapériphériques et territoires
  français hors UE, îles Anglo-Normandes, île de Man, Gibraltar). **Pays inconnu** (absent, `XX`, `EU`, `T1`, illisible)
  = Europe.
- `app/api/analytics-consent/route.js` : le **serveur** décide à partir de `x-vercel-ip-country` (posé par Vercel) ;
  réponse `private, no-store` (jamais servie à un autre pays par un cache), le pays n'est pas renvoyé. Sur une
  **préversion exécutée sur Vercel seulement**, l'en-tête `x-oct-test-country` remplace celui de Vercel (tests) ; la
  production ne le lit jamais (un serveur local avec `VERCEL_ENV=preview` venu du `.env` non plus).
- `app/components/Analytics.jsx` remplace les deux `<Script>` du `<head>` : rien de Google n'est demandé avant la
  réponse ; réponse négative ou absente = rien ; sinon `gtag` comme avant (après le chargement, navigateur au repos).
  Réponse négative : les cookies `_ga` laissés par une visite antérieure sont **supprimés**.
- Aucun autre traceur sur le site (relecture : seuls tiers contactés au chargement en Europe = taux de change de Currency
  Converter ; Google Translate seulement si le visiteur choisit une langue ; polices servies par le site).
- `/privacy` (daté du 6 octobre) : Analytics seulement hors EEE / Royaume-Uni / Suisse (territoires compris), « not
  loaded at all » là (aucun cookie, rien envoyé, anciens cookies supprimés), pays inconnu idem, pays tiré de l'IP par
  Vercel et non conservé ; ligne ajoutée pour les fournisseurs que le navigateur contacte lui-même (taux de change,
  cdn.jsdelivr.net pour le moteur d'OCR, le modèle d'Upscaler et les polices de Text to PDF).

**Tests (local, en-tête de pays simulé)** : `scripts/p35/analytics-region.test.mjs` 11/11 ; `scripts/p35/consent-check.mjs`
**33/33** : FR, FR avec d'anciens `_ga`, DE, GB, CH, RE, pays inconnu → **0 requête** vers googletagmanager /
google-analytics, **aucun cookie `_ga`** (seul `oct_automation`, marqueur de robot de test jamais posé chez un visiteur),
réponse `false` ; CA et US → gtag chargé, `/g/collect` envoyé, `_ga` posé (inchangé).

**Relecture de conformité** (sous-agent) : **GO avec conditions**, aucune bloquante ; appliqué : politique complétée (tiers
contactés par le navigateur ; territoires), 6 territoires français hors UE ajoutés, suppression des anciens `_ga`, en-tête
de test limité à l'exécution sur Vercel. **Note pour plus tard** : activer AdSense rouvre la question (le message de
consentement d'AdSense voudra activer Analytics que ce lot bloque en Europe ; une seule liste de régions à partager) —
au plan.

**Mise en ligne du lot 2** :
- **Préversion, une seule fois** (`onlineconvertools-r0z8mwt4j` = `d932fc59`, relais `vercel-preview-proxy`, en-tête de test
  `x-oct-test-country`) : FR, FR avec d'anciens `_ga`, DE, GB, CH, RE → 0 requête Google Analytics, aucun `_ga`, réponse
  `false` ; CA, US → Analytics comme avant ; `XX`, `T1`, valeur illisible → `false`. Le cas « pays inconnu » sans en-tête
  ne se simule pas sur une préversion : Vercel y pose le vrai pays (ici CA, réponse `true`, attendu) ; il est couvert en
  local et par `XX`.
- **Production** : master `d932fc59` → Vercel **`onlineconvertools-hj3yae3it`** ; www-light **29/29** ; sur www :
  `/api/analytics-consent` `private, no-store`, **l'en-tête de test est ignoré** (FR demandé → `true`, le vrai pays CA),
  la page d'accueil ne contient plus de balise googletagmanager, `/privacy` « Last updated: October 6, 2026 ». La
  vérification depuis un vrai pays européen sur www demande un accès depuis l'Europe (non disponible ici) : mini-test au
  plan pour le propriétaire (VPN ou un proche en Europe, outils de développement → onglet Réseau : aucune requête
  google-analytics). Retour arrière prêt : promouvoir `onlineconvertools-jccwufjem` (lot 1).

## Lot 3 — SEO technique S1, S2, S3

Mesuré par `scripts/p34/seo-audit.mjs` (243 pages, HTML brut sans JavaScript) sur la construction de production locale ;
« avant » = audit du lot C (même outil, même code que www le 05/10).

| Mesure | Avant | Après |
|---|---|---|
| Titres cassés (« — Be a … », « Free … Online Free », nom doublé) | **8** + `/about` doublé + `/tools` | **0** |
| Titres en double / descriptions en double | 0 / 0 | 0 / 0 |
| Titres > 60 caractères | 21 | 21 (les 8 nouveaux titres font 48 à 59 caractères) |
| Canonical absent ou faux | 2 (`/`, `/about`) | **0** |
| Pages avec un nombre de H1 ≠ 1 | 1 (accueil : 2) | **0** |
| Liens contextuels vers d'autres outils par page d'outil | 0 sur 215 pages, 4 sur 10 | **4 à 6 sur 225** (médiane 5, 1 123 liens) |
| Pages d'outil avec données structurées | 10 / 225 | **225 / 225** (WebApplication + BreadcrumbList + FAQPage) |
| Erreurs du validateur schema.org (Google, validator.schema.org) | — | **0 erreur, 0 avertissement** sur 25 pages tirées sur tout le site |

### S1 — titres, canonical, H1
**Marché** : motif « X to Y — verbe … Free » déjà le nôtre ; aucun ton nouveau (S4 reste au propriétaire). Nouveaux titres,
tirés de la description de chaque page : JPG to PDF — Combine Images Into One PDF Online Free ; SCSS to CSS — Lightweight
SCSS to CSS Transform Online Free ; JSON to YAML — Convert JSON to Indented YAML Online Free ; Image Editor — Free Photo
Editor in Your Browser ; Subtitle Generator — Build SRT Subtitles Online Free ; Find and Replace — Find and Replace Text
Online Free ; Lorem Ipsum Generator — Placeholder Text Online Free ; Text Truncator — Cut Text to a Set Length Online
Free ; `/about` → « About | OnlineConverTools » ; `/tools` → « All Tools — Browse 225 Free File Converters Online ».
Canonical : `/about` et l'accueil (la page d'accueil, composant client, passe dans `app/HomeClient.jsx` ; `app/page.jsx`
ne fait qu'héberger ses métadonnées). Accueil : le second titre « All Tools » devient un `h2` aux mêmes classes (aucun
changement visible).

### S2 — « Related tools » sur chaque page d'outil
**Marché** : Smallpdf (≈ 20 liens par outil), FreeConvert et iLoveIMG (autres formats) lient leurs outils voisins ; nous
n'en avions aucun sur 215 pages. **Fait** : `app/lib/relatedTools.js` (carte choisie à la main par un sous-agent : 4 à 6
voisins par outil — conversion inverse, même famille, étape suivante logique ; 372 paires réciproques, 262 liens vers une
autre catégorie ; outils à voisinage mince listés au rapport du sous-agent : MOBI to EPUB, Sticky Notes, Cron, Regex
Tester, Color Picker…), vérifiée par `scripts/p35/related-tools-check.mjs` (225 outils, aucune page en noindex, aucun lien
vers soi ni vers un homonyme). Chaque `layout.tsx` d'outil (225) enveloppe la page dans `ToolSeo` (composant serveur : la
carte entière reste sur le serveur, seuls les 4 à 6 liens de la page partent au navigateur) ; `SeoContent` affiche le bloc
**dans le HTML serveur**, au même style que ses autres cartes, après les astuces. Les 10 pages du 29/09 gardent leurs
liens annotés en tête, complétés jusqu'à 4-6. Le nom de chaque lien = le titre visible de l'outil. Seul changement
visible du lot ; 390 et 1280 px : aucun débordement, aucune erreur de console.

### S3 — données structurées
`SeoContent` rend un JSON-LD **construit à partir des textes qu'il affiche** : `WebApplication` (nom = titre de la page,
description = paragraphe « About », `offers` à 0, gratuit), `BreadcrumbList` (Accueil > catégorie > outil) et `FAQPage`
**seulement si la FAQ est sur la page** (elle l'est sur les 225). Les 10 pages du 29/09 avaient une description de
balisage = leur méta-description, **absente de la page** : remplacée par le même modèle (l'ancien composant
`ToolJsonLd` est supprimé). `scripts/p35/seo-lot3-check.mjs` vérifie sur les 225 pages : JSON valide, prix 0, fil
d'Ariane, chaque nom, description, question et réponse **présents dans le texte visible**, FAQPage ⇔ FAQ visible : **ALL
PASS**. **Aucun gain promis** : Google limite l'affichage des FAQ enrichies aux sites d'autorité (gouvernement, santé)
depuis août 2023 ; le fil d'Ariane et le type d'application sont les seuls effets probables.

**Mise en ligne du lot 3** :
- **Préversion, une seule fois** (`onlineconvertools-3vw17vjk8` = `206684a1`) : `seo-lot3-check` **ALL PASS** (225 pages :
  bloc 4-6 liens, JSON-LD valide et identique au texte visible) ; audit des 243 pages : 0 page en erreur, 0 canonical
  faux, 0 page à H1 ≠ 1, 0 titre en double ; 390 et 1280 px : aucun débordement, aucune erreur de console ; Redact
  (page fonctionnelle sous la nouvelle enveloppe) 7/7.
- **Production** : master `206684a1` → Vercel **`onlineconvertools-gbnnrjftd`** ; www-light **29/29** ; sur www, PDF to
  Word et JPG to PDF : bloc présent, 1 JSON-LD, 1 H1, canonical juste, nouveau titre ; accueil : 1 H1, canonical.
  Retour arrière prêt : promouvoir `onlineconvertools-hj3yae3it` (lot 2).

## Contexte stratégique — internationalisation (pour mémoire, rien construit)

Décision du projet du 11/09/2026, **à trancher par le propriétaire** : site en anglais seul, widget Google Translate non
indexé ; recommandation : sous-répertoires `/fr/`, `/es/`, `/de/`, **3 langues choisies sur les volumes réels**,
traduction relue des chaînes communes et des **20 outils les plus porteurs**, retrait du widget sur les pages traduites,
mesure dans la Search Console après 6 à 8 semaines. Le plan garde S10 **gelé jusqu'à un trafic organique réel** (relevé
de novembre des 10 pages travaillées) ; ce lot n'y change rien.

## Décisions STRATÉGIQUES de l'audit qui attendent le propriétaire (effet attendu ; effort)

| # | Décision | Effet attendu | Effort |
|---|---|---|---|
| S10 | Langues : dégeler l'internationalisation (`/fr/ /es/ /de/`, 3 langues sur volumes réels, 20 outils) | le plus fort potentiel (tous les concurrents sauf CloudConvert ont 14 à 25 langues indexées) | plusieurs semaines |
| S4 | Titres et méta-descriptions au motif du marché (« X to Y Converter — … Free », ≤ 155 caractères, bénéfices) sur les 50 outils les plus demandés — ton et marque | moyen à fort (clics par impression), à mesurer après le relevé de novembre | 1-2 jours |
| S5 | Pages d'atterrissage par format (compress-jpg, mp3-converter, wav-to-mp3…), texte propre à chaque format | fort sur la longue traîne ; risque « pages minces » si bâclées | ≈ 1 semaine pour ~40 pages |
| S6 | Contenu à écrire : enrichir les 40 outils < 300 mots (texte, image, développeur) avec exemple réel et vraies questions | moyen, et condition AdSense « faible valeur » | 2-3 jours |
| S9 | Pages à créer : guides de blog liés depuis les outils | moyen à long terme | continu |
| S8 | Note réelle (vote après un résultat, AggregateRating au-delà d'un seuil de vrais votes) | moyen à terme (étoiles) | ≈ 1 jour + collecte |
| A1/P35-1 | AdSense : choix de la CMP certifiée (Google Privacy & messaging recommandé, gratuit) au moment de la demande | conformité ; Analytics pourrait revenir en Europe **avec** consentement | ≈ ½ jour |
| A2 | AdSense : section « Advertising » de `/privacy`, `/terms` §6, `/about` enrichi (éditeur, Québec), `ads.txt` après l'ID | condition d'approbation | ≈ 2 h |
| S11 / S7 | Techniques restantes, sans décision de fond : LCP mobile 3,2 s → < 2,5 s (≈ 450 Ko de JS par page) ; `lastmod` réel et redirection en 1 saut | faible à moyen / faible | 1-2 jours / 2 h |
