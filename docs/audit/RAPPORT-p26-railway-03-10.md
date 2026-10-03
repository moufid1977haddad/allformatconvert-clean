# RAPPORT P26 — services Railway : sécurité Gotenberg, PDF/A 2u/3u/2a/3a, DOC, gros RTF (03/10)

Demandé par le propriétaire (prompt P26), mises en production comprises, y compris en son absence. Branche
`p26-railway`, repère de restauration `restauration-avant-p26-03-10` = `11910e7a` (master avant P26). Autorisation
Railway de ce chantier : Gotenberg, pdf-tools, service média, leurs réglages et variables de lancement nécessaires,
version précédente notée, nouveau comportement vérifié en ligne avant de brancher les pages, aucune autre variable,
aucun nouveau service payant. Rapport complété après chaque lot.

Outils : Railway par la CLI officielle déjà connectée (`npx @railway/cli`, compte du propriétaire), lecture de l'API
Railway (mêmes droits) ; aucun identifiant affiché ni écrit (les scripts lisent les variables en mémoire).

## 0. Récapitulatif

| Lot | Contenu | État |
|---|---|---|
| 1 | Gotenberg : adresses privées interdites (+ webhook, downloadFrom) | ✅ **en production** (Railway `gotenberg-v2` déploiement `930bc129`, 03/10 23 h 54 UTC) |
| 2 | E2 : PDF/A 2u, 3u, 2a, 3a | ✅ **en production** (pdf-tools `bf8a5d74`, site `arram1kr8` = `35f6cccb`) |
| 3 | E1 : PDF to Word en .doc, RTF et DOC au-delà de 4 Mo | ✅ **en production** (même déploiement ; service média `c04f9c3c`) |

## 1. Lot 1 — Gotenberg : un fichier HTML déposé ne peut plus faire charger une adresse interne

### 1.1 État lu avant de toucher (règle zéro, corollaire 5)
- Railway, projet `fortunate-manifestation`, environnement `production` : `gotenberg-v2` (production : les journaux
  montrent les appels de Vercel ; 1 réplica ; image `gotenberg/gotenberg:8.36.0@sha256:87c16b9f…` de
  `services/gotenberg/Dockerfile`, déploiement `515a1679` du 22/09) et `gotenberg-fonts` (même dossier, même image ;
  ne reçoit que les appels de la machine locale — bancs —, c'est le filet de repli de 2026-09-18).
- Variables de `gotenberg-v2` : valeurs propres (aucune référence vers `gotenberg-fonts`, vérifié par l'API).
- Version la plus récente de Gotenberg : 8.37.0 (11/09). Drapeaux vérifiés **dans le code source de 8.36.0** (pas
  seulement dans la documentation, qui suit la dernière version) : `chromium-deny-private-ips`,
  `libreoffice-deny-private-ips`, `webhook-deny-private-ips`, `api-download-from-deny-private-ips`, `webhook-disable`,
  `api-disable-download-from` existent tous.

### 1.2 Mesure de la faille (avant, sur `gotenberg-fonts`, configuration identique à la production)
`scripts/p26/gotenberg-probe.mjs` envoie à Gotenberg, comme nos routes, une page HTML « déposée » qui contient une
iframe vers une adresse, puis lit le texte du PDF. **Avant** : le PDF imprimait la réponse de `127.0.0.1:3000`,
`localhost`, `[::1]`, `[::ffff:127.0.0.1]`, `0.0.0.0`, `gotenberg-v2.railway.internal`, `gotenberg-fonts.railway.internal`,
**pdf-tools** (`allformatconvert-clean.railway.internal:8080/health` : versions de Ghostscript, qpdf, veraPDF) et le
**service média** (`media-processing.railway.internal:8080/health`). `169.254.169.254` : délai dépassé. Un webhook
vers la boucle locale était accepté (204). Le constat de P25 est donc confirmé par l'expérience.

### 1.3 Ce qui est activé (variables de lancement, l'équivalent des drapeaux, sur les deux Gotenberg)
| Variable | Rôle |
|---|---|
| `CHROMIUM_DENY_PRIVATE_IPS=true` | Chromium refuse toute navigation ou ressource dont l'adresse résolue n'est pas publique (boucle locale, RFC 1918, lien local, IPv6 locales, IPv4 cachées dans IPv6) ; depuis 8.32 un mandataire interne résout le nom une fois et se connecte à l'adresse vérifiée (pas de « DNS rebinding ») |
| `LIBREOFFICE_DENY_PRIVATE_IPS=true` | même règle pour ce que LibreOffice irait chercher depuis un document Office |
| `WEBHOOK_DENY_PRIVATE_IPS=true`, `API_DOWNLOAD_FROM_DENY_PRIVATE_IPS=true` | les deux autres modules sortants (configuration recommandée par la documentation de Gotenberg pour un service exposé : les quatre) |
| `WEBHOOK_DISABLE=true`, `API_DISABLE_DOWNLOAD_FROM=true` | ces deux fonctions ne servent pas au site (aucun usage dans le code, vérifié) : fermées |
| `CHROMIUM_DENY_LIST=^file:(?!//\/tmp/).*,^[a-z]+://([^/]*@)?(100\.(6[4-9]\|[7-9][0-9]\|1[01][0-9]\|12[0-7])\|198\.1[89])\.` | la règle par défaut de Gotenberg (`file://` hors du dossier de la conversion) **gardée**, plus les plages 100.64.0.0/10 et 198.18.0.0/15 écrites en clair, que 8.36.0 ne classe pas encore comme internes (8.37.0 le fait) |

**Pourquoi pas la 8.37.0 maintenant** : elle change Chromium (152) et LibreOffice (26.8) — le résultat des conversions
ne serait plus le même, contraire à la demande. Ce qui reste ouvert en 8.36.0 (revue indépendante, gravité moyenne) :
un nom DNS public qui ne pointerait que sur une adresse 100.64/10 ou 198.18/15 (Railway ne documente pas sa plage IPv4
interne ; les noms `*.railway.internal` ont aussi une adresse IPv6 interne et sont refusés, mesuré). **À faire dans un
chantier à part** : passer à 8.37.0 sur `gotenberg-fonts` d'abord, banc des 18 documents au pixel, puis production.

### 1.4 Mise en ligne sans coupure
Suivant `RAPPORT-gotenberg-versionne.md` (nouvelle version d'abord à côté de la production, ancienne gardée en repli,
production en dernier) : le service « à côté » est `gotenberg-fonts`, déjà existant et sans trafic de production ; pas
de nouveau service (aucun coût en plus) ni de variable Vercel touchée.
1. `gotenberg-fonts` : variables posées → redéploiement `08ac2455` puis `55fa4c41` (liste de refus).
2. Mesure complète sur `gotenberg-fonts` (ci-dessous), revue indépendante (§1.6), puis
3. `gotenberg-v2` : mêmes variables → Railway construit, attend le `/health`, puis bascule (`930bc129`, 23 h 54 UTC).
**Retour arrière prêt** : Railway → `gotenberg-v2` → déploiement `515a1679` → « Rollback » (restaure l'image ET les
variables d'avant) ; ou retirer les 7 variables.

### 1.5 Preuves (après)
- **Refus** (`gotenberg-fonts` puis `gotenberg-v2` en production) : les 13 adresses — les 10 ci-dessus + 100.64.0.1,
  198.18.0.1, `file:///etc/hostname` — ne sont plus imprimées ; les journaux de Gotenberg disent « targets a non-public
  address » ou « matches the expression from the denied list ». 169.254.169.254 est refusé tout de suite (plus d'attente
  de 60 s). Webhook : ignoré (PDF rendu directement) ; downloadFrom : ignoré.
- **Le public marche toujours** : `example.com` en iframe, une police Google Fonts et une image publique chargées.
- **Mêmes résultats qu'avant** (`scripts/p26/compare-pdfs.mjs` : nombre et taille des pages, texte `pdftotext`, chaque
  page rendue à 72 dpi **au pixel près** ; méthode d'abord vérifiée sur deux passages « avant » identiques) :
  - 18 conversions directes — Word (docx ×3, odt, rtf), Excel (xlsx ×4, xls), PowerPoint (pptx ×3), HTML ×3 (dont celui
    du banc de fidélité et un fichier qui charge police et image publiques), le HTML que nos pages EPUB et MOBI
    construisent (capturé par `capture-book-html.mjs`) : **18/18 identiques** sur `gotenberg-fonts` et sur `gotenberg-v2` ;
  - **www**, une vraie conversion par outil par les pages (`gotenberg-tools-www.mjs`) : Word (.odt), Excel, PowerPoint,
    HTML déposé, EPUB, MOBI, URL → PDF : **7/7 réussies et identiques** à la référence prise avant le changement.
- Le contrôle cron `/health` appelle Gotenberg directement (pas par Chromium) : non concerné, `/health` répond `up`.

**Dépense imprévue, signalée** : la première référence www de Word to PDF a été faite avec un `.docx` — en production
le `.docx` passe par **ConvertAPI** (`CONVERTAPI_ENABLED`), pas par Gotenberg : **1 conversion ConvertAPI (≈ 0,01 $)**.
Le banc utilise désormais un `.odt` (Gotenberg).

### 1.6 Revue indépendante (sécurité, obligatoire)
Verdict : feu vert, aucun point critique. Points retenus et traités : liste de refus de Chromium pour 100.64/10 et
198.18/15 en gardant la règle `file://` par défaut (fait, vérifié) ; vérifier que `gotenberg-v2` n'avait pas bougé avec
`gotenberg-fonts` et n'utilise pas de références (vérifié) ; même image après reconstruction (prouvé par les 18 + 7
documents identiques au pixel). Points restants, mineurs : JavaScript reste actif dans Chromium (les envois UDP de
WebRTC ne passent pas par le mandataire, mais aucune réponse ne peut être imprimée ; couper JavaScript pourrait changer
des pages déposées, non fait) ; montée en 8.37.0 (§1.3).

### 1.7 Facture Railway
Aucun service ajouté. Mesure mémoire / processeur : §6.

## 2. Lot 2 — E2 : PDF/A 2u, 3u, 2a, 3a

### 2.1 Moyen retenu (recherche de P25, confirmée)
Comme iLovePDF (`conformance` + `allow_downgrade`) : le niveau demandé est visé, et seulement si le visiteur l'a
accepté, le niveau inférieur est essayé — et **dit**. Chemins, dans `services/pdf-tools` (`src/pdfa.js`,
`py/pdfa_fix.py`) :
- **u** (2u, 3u) : Ghostscript comme pour b (il écrit les tables Unicode), l'étiquette XMP passée à U, puis veraPDF U ;
- **a** (2a, 3a) : seulement si le PDF source est **balisé** (arbre de structure + `/MarkInfo /Marked true`) ;
  Ghostscript perdrait la structure, donc le source est gardé tel quel (pikepdf : profil sRGB, XMP depuis les infos du
  document, `/MarkInfo`, drapeaux des annotations conformes à 6.3.2 — LibreOffice écrit ses liens sans `/F`) ; **le
  contenu des pages n'est pas touché** (4 PDF balisés : rendus source et 2a identiques au pixel) ; puis veraPDF A ;
- abaissement (si coché) : a → u → b de la même partie ; sinon refus avec la raison ;
- **1b/2b/3b : même chemin de code qu'avant, même limite de 60 s**. Les nouveaux niveaux ont 200 s (jusqu'à trois
  conversions + validations).
- 1a : non proposé (aucun outil libre ne l'atteint, mesure de P25).

### 2.2 Mesure sur de vrais fichiers (20 PDF, chaque fichier livré revalidé à part par un veraPDF 1.30.2 local)
Fichiers : Chromium balisé / non balisé ; LibreOffice 26.2 (Word, Excel, PowerPoint, ODT ; il balise même par défaut) ;
8 PDF fabriqués par le site (Gotenberg : Word, Excel, PowerPoint, HTML, MOBI…), un PDF pdf-lib. Banc
`scripts/p26/e2/pdfa-bench.mjs` : en local **220/220** ; niveaux atteints **sans** abaissement : 1b/2b/3b 20/20,
2u/3u 12/20, 2a/3a 7/20 (5 des 7 PDF balisés).

**Pourquoi 2u ou 2a échoue quand il échoue** (veraPDF, règle 6.2.11.7.2, seule règle en échec) : le PDF **source**
contient des glyphes sans texte Unicode — LibreOffice imprime « ti » (sec**ti**on, ac**ti**on) en une ligature et
« é » en « e » + accent combinant, sans leur donner de texte (vérifié dans les tables du PDF d'origine, avant
Ghostscript). Deviner ces caractères serait inventer du contenu : le niveau n'est pas atteint et la page le dit
(« some characters in this PDF have no Unicode text behind them (often ligatures…) »), ou livre 2b si le visiteur l'a
permis. Les PDF de Chromium et de Gotenberg en HTML passent 2u ; les PDF balisés de Chromium, d'Excel, de PowerPoint
et d'ODT passent 2a et 3a.

### 2.3 Défaut trouvé en route : veraPDF « U » ne prouve pas que le texte est juste
Sur le vrai service (Ghostscript 10.00 de Debian), 2u passait sur des PDF de LibreOffice **en perdant la ligature
« ti »** (« section » → « secon ») : veraPDF vérifie qu'un texte Unicode **existe** pour chaque glyphe, pas qu'il est
le bon. Correction (avant toute page) : un niveau u est d'abord tenté **sur le PDF source tel quel** (texte inchangé par
construction) ; sinon Ghostscript, **accepté seulement si son texte est celui du source, mot pour mot** (extraction par
Ghostscript `txtwrite`) ; sinon le niveau n'est pas atteint et la raison est dite. Le banc vérifie en plus chaque
fichier u ou a livré **mot pour mot contre le source avec pdftotext** (outil indépendant du service).

**Défaut ANCIEN, en production avant P26, non corrigé ici (consigne : ancien comportement identique)** : les niveaux
**1b/2b/3b** ont la même altération du texte (aspect des pages juste, recherche / copier-coller faux) — mesuré sur la
production d'avant P26 : PDF Chromium « Ελληνικά » → « Ε½½ην»¼ά » ; PowerPoint du site « Répartition » →
« Répar琀椀琀椀on » ; un document LibreOffice : 491 mots sur 612 altérés (« données » → « donnees », « section » →
« sec琀椀on »). Ghostscript 10.07 local : même famille de pertes. **Correction mesurée, à faire dans un lot dédié** :
même méthode que les niveaux u (source gardé d'abord ; Ghostscript seulement si le texte est inchangé, sinon livrer en
le disant). Inscrit au plan.

## 3. Lot 3 — E1 : PDF to Word en .doc, et RTF / DOC au-delà de 4 Mo

### 3.1 Moyen retenu
ConvertAPI n'écrit aucun .doc (P25). Comme CloudConvert / iLovePDF : LibreOffice. Le PDF devient un DOCX comme pour
« Word (.docx) » (ConvertAPI, même coût), puis `/v1/docx-to-doc` de **pdf-tools** le passe en Word 97-2003
(`soffice --convert-to "doc:MS Word 97"`, profil propre à chaque demande, 2 conversions à la fois au plus, sortie
vérifiée : conteneur Compound File). **Pourquoi pdf-tools** (le plus économe) : il tourne en permanence, une conversion
ne coûte que ses secondes ; le service média dort au repos et chaque réveil facturerait ses minutes d'attente ; le
LibreOffice de Gotenberg n'écrit que du PDF. Gros fichiers : le service média accepte désormais les sorties `rtf` et
`doc` (signature vérifiée au dépôt) ; la route choisit le type selon la demande.

### 3.2 Mesures (fichiers rouverts dans Word 16 et LibreOffice 26)
- 10 DOCX, dont **les 2 seules vraies sorties ConvertAPI disponibles** (lettre de 3 pages, rapport avec tableau ; P25)
  et un DOCX Word avec une image en ligne et une flottante : **texte courant → .doc identique** — Word compte les
  mêmes mots, pages, tableaux, images ; LibreOffice imprime le même texte. ConvertAPI écrit du texte courant (aucun
  cadre, vrais tableaux : vérifié dans ses RTF).
- **Limite de l'ancien format, dite sur la page** : du texte placé dans des **zones de texte de taille fixe** peut être
  coupé dans le .doc (DOCX issus de l'import PDF de LibreOffice, une zone par ligne : 4 à 5 % des mots perdus). La
  page prévient avant l'envoi, et le dit après quand le document a des zones de texte (comptées dans le DOCX).
- Si l'étape .doc échoue (taille, délai) alors que ConvertAPI a déjà facturé le DOCX : **le DOCX payé est livré, et la
  page le dit** — jamais une deuxième conversion payante, jamais rien.

- **Page** : formats Word (.docx), Word 97-2003 (.doc), Rich Text (.rtf) pour toute taille acceptée (99 Mo) ;
  « RTF jusqu'à 4 Mo » retiré ; note sur la limite des zones de texte ; politique de confidentialité mise à jour (le
  DOCX passe par notre serveur pour le .doc).

## 4. Mise en production (règle d'usage Vercel : lourd en local, une passe sur la préversion, léger sur www)

**Service d'abord (« additif d'abord »), trois fusions de `services/` seuls sur master, chacune vérifiée en ligne** :
| Fusion | Contenu | Vérifié en ligne |
|---|---|---|
| `96ede7de` | pdf-tools u/a + `/v1/docx-to-doc` ; service média rtf/doc | ancien comportement **24/24 identique** (PDF/A 1b/2b/3b, réparation, compression sur 5 vrais PDF, au pixel) ; nouveau code présent (`soffice` dans `/health`) |
| `aa2f0688` | corrections de la revue (§5) | 24/24 identique ; E2 en ligne **160/160**, texte mot pour mot |
| `d191ddb0` | LibreOffice 25.2 (rétroportages Debian) | 24/24 identique ; Ghostscript 10.00, qpdf 11.3, veraPDF 1.30.2 inchangés ; .doc : texte courant 6/6 identique |

**Bancs locaux sur la construction de production** (`next build` + `next start`) :
- E2 : `pdfa-bench` 20 PDF × 7 niveaux (avec et sans abaissement) **220/220** puis **160/160** sur le code final, chaque
  fichier revalidé par un veraPDF à part et, pour u/a, comparé mot pour mot au source ; page PDF/A **8/8 sous
  Chromium, Firefox et WebKit** (non balisé : 2a/3a éteints et dit ; balisé : 2a vérifié ; sans Unicode : abaissement dit
  ou refus avec la raison ; 2b par défaut inchangé ; PDF de 5,7 Mo par le service média → 3u vérifié).
- E1 : page PDF to Word **7/7 sous Chromium, Firefox et WebKit** — .doc, .docx, .rtf petits ; **RTF et DOC d'un PDF de
  5,7 Mo par le service média** (le RTF déposé est la sortie ConvertAPI octet pour octet) ; document à zones de texte :
  la page le dit. **Sans dépense ni Supabase** : un module de banc chargé dans le seul serveur local
  (`scripts/p26/e1/fake-providers.mjs`) répond à la place de ConvertAPI avec de **vraies sorties ConvertAPI antérieures**
  et à la place de Supabase (28 + 128 appels interceptés, aucun envoyé) ; pdf-tools et le service média réels (leurs
  clés lues dans Railway, en mémoire). Fichiers rouverts : Word 16 (mots, pages, tableaux, images identiques au DOCX)
  et LibreOffice 26.
- Solidité (fichier vide, abîmé, faux) : **tous les outils sous Chromium 522/522** (le code partagé `convertOffice` /
  `respondStaged` a changé) ; outils touchés sous Firefox **45/45** et WebKit **45/45** ; les 7 conversions Gotenberg par
  les pages + un HTML de 6 Mo par le service média.
- File .doc : 5 demandes simultanées avec un délai court → 4 converties, 1 coupée proprement (504), la suivante servie ;
  aucun LibreOffice laissé en vie. `runprocess.test.mjs` 2/2.

**Préversion, une fois** (`onlineconvertools-rktt3w3r9`, commit `8cb6914d`, jeton OIDC de développement limité à son
origine) : page PDF/A 8/8 (vrai pdf-tools, vrai service média) ; 7 conversions Gotenberg **identiques au pixel** à la
référence de www + HTML de 6 Mo ; PDF to Word contrôlé **sans conversion** (une vraie serait payante) : 3 formats, note
.doc, boutons actifs pour 5,7 Mo.

**Fusion** `35f6cccb` (code du site = celui de la préversion, vérifié) → production Vercel **`onlineconvertools-arram1kr8`**.
**www** : contrôle léger 29/29, RAW 7/7, PDF/A 8/8 réelles (gratuites), PDF to Word contrôlé sans conversion, 7
conversions Gotenberg identiques au pixel à la référence du début de nuit, adresses internes toujours refusées.
**Aucun retour arrière.** Retour arrière prêt : Vercel → promouvoir `onlineconvertools-3qifwbvs0` (site d'avant les
pages P26) ; Railway → pdf-tools `4e9a95db` (d'avant P26), Gotenberg `515a1679`, service média `ba834c25`.

**Pas fait, par règle** : aucune vraie conversion PDF → .doc avec ConvertAPI (≈ 0,01 $, « aucune dépense hors facture
Railway ») — l'étape ConvertAPI est le code inchangé du DOCX ; à faire à la première occasion sur www.

## 5. Revues indépendantes
- **Sécurité (point 1, obligatoire)** : feu vert (§1.6).
- **Code des lots 2-3** (non obligatoire, faite avant la production) : 1 critique, 3 sérieux, 4 moyens, 3 mineurs —
  **tous corrigés et mesurés** : demande .doc dont le délai expire pendant l'attente → service bloqué (défaut ancien de
  `runProcess`, rendu atteignable) ; LibreOffice orphelin après une coupure (groupe de processus) ; 60 s des anciens
  niveaux PDF/A pendant l'envoi pas strictement identiques (rétablies dès le début de la demande) ; .doc qui échoue
  après la facture ConvertAPI → rien livré (désormais le DOCX payé, dit) ; PDF chiffré annoncé « non balisé » ; règles
  veraPDF du mauvais niveau affichées ; Ghostscript relancé pour rien ; double lecture du balisage en retard ; règle
  « balisé » différente entre la page et le service ; lecture de 80 Mo dans le navigateur (20 Mo) ; LibreOffice qui
  pouvait rendre tout `/health` rouge.

## 6. Facture Railway (mesurée, API de mesures Railway ; tarif : 10 $/Go/mois de mémoire, 20 $/vCPU/mois)
| Service | Avant P26 | Après P26 |
|---|---|---|
| gotenberg-v2 (production) | 0,55 à 1,1 Go (la mémoire monte avec le temps), CPU ≈ 0 | 0,48-0,52 Go après redémarrage, CPU ≈ 0 — **aucune hausse** due aux protections (le mandataire existe depuis 8.32) |
| gotenberg-fonts (repli) | 0,4-0,8 Go | 0,44 Go — inchangé |
| pdf-tools | 0,017-0,035 Go au repos | **0,025 Go au repos** : LibreOffice ne reste pas en mémoire (lancé par demande) |
| service média | en veille | en veille — inchangé |
Coût par usage : un .doc ≈ 1 s, ≈ 0,25 Go, 1 vCPU → **≈ 0,00001 $** ; un PDF/A u/a ≈ 3-10 s → **≈ 0,00005 $**. Les bancs
de cette nuit ≈ **0,03-0,05 $** de Railway. Aucun nouveau service, aucune dépense ailleurs, sauf **1 conversion
ConvertAPI imprévue (≈ 0,01 $)** au début (§1.5).

## 7. Fin
**Production : Vercel `onlineconvertools-arram1kr8` = `35f6cccb` ; Railway : gotenberg-v2 `930bc129`, gotenberg-fonts
`55fa4c41`, pdf-tools `bf8a5d74`, service média `c04f9c3c`. Aucun retour arrière.**

**Ce qui manque** (au plan) :
1. **Défaut ancien, grave, des PDF/A 1b/2b/3b** : texte altéré par Ghostscript (§2.3) — lot dédié, correction mesurée.
2. **Gotenberg 8.37.0** (CGNAT/198.18 derrière un nom DNS, bornes contre les pages hostiles) — chantier dédié, banc au pixel.
3. Une vraie conversion PDF → .doc sur www (≈ 0,01 $).
4. **E3** : en attente du compte Google Cloud du propriétaire (liste au plan, tableau P25).
5. Les DOCX à zones de texte fixes perdent 4-5 % du texte en .doc (limite de l'ancien format, dite sur la page).
6. Word ne sait pas imprimer en PDF par automatisation sur cette machine (il bloque) : les comparaisons Word sont faites
   par ses propres comptes (mots, pages, tableaux, images), le rendu visuel par LibreOffice.
