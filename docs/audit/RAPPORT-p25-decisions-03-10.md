# RAPPORT P25 — décisions E1 à E7 du propriétaire + remontée des erreurs de tous les outils (03/10)

Demandé par le propriétaire (prompt P25), mises en production comprises, y compris en son absence. Branche
`p25-decisions`, repère de restauration `restauration-avant-p25-03-10` = `5cabf4f2` (master avant P25). Règle d'usage
Vercel du plan : bancs lourds en local sur la construction de production, une seule fois sur la préversion, contrôle
léger sur www. Rapport complété après chaque lot.

## 0. Récapitulatif

| # | Décision | État |
|---|---|---|
| E1 | PDF to Word en DOC et RTF | RTF : fait (voir §3). DOC : **impossible chez ConvertAPI** (aucun de ses 332 convertisseurs n'écrit de .doc, lu dans son OpenAPI le 03/10) — chiffré au plan |
| E2 | PDF/A 1a, 2a, 2u, 3a, 3u | recherche et chiffrage (§6) : le service `pdf-tools` est sur Railway, que seule E5 autorise à modifier |
| E3 | PDF Translate du document entier | code prêt, revu deux fois, **désactivé** tant que le propriétaire n'a pas créé le compte Google Cloud (§4) |
| E4 | HTML to PDF depuis une URL | fait (§2), revue de sécurité indépendante ×2 |
| E5 | Options vidéo (service ffmpeg sur Railway) | §5 |
| E6 | Phrase de passe EFF | fait (§1) |
| E7 | Historique des devises | fait (§1) |
| + | Remontée des erreurs de tous les outils | fait (§1) |

## 1. Lot 1 — E6, E7, remontée des erreurs (commit `81767c7b`)

**E6 — Password Generator, phrase de passe.** Moyen des concurrents relevé (Bitwarden : 3-20 mots, 6 recommandés depuis
2025, séparateur, majuscules, chiffre ; 1Password : mêmes réglages). Liste EFF Large Wordlist téléchargée de eff.org
(7 776 mots, SHA-256 `addd3553…903e`, inscrite dans `app/lib/effWordlist.js`), chargée seulement au premier tirage.
Tirage par `crypto.getRandomValues` avec rejet (aucun biais de modulo). Attribution EFF + CC BY 3.0 US sur la page.
Entropie affichée : 12,92 bits par mot (+ log2(10·n) pour le chiffre). Banc : 20 phrases de 8 mots, toutes de la liste,
majuscules, un chiffre chacune, 109 bits ; 3 000 mots tirés, 2 496 distincts (attendu pour un tirage uniforme : ≈ 2 489).

**E7 — Currency Converter, historique.** Frankfurter v2 (api.frankfurter.dev ; v1 répond « Deprecation ») : 165 devises,
historique depuis 1948, CORS ouvert, gratuit, usage commercial permis. **Couverture mesurée : 158 de nos 166 devises** ;
sans historique : BGN, CLF, FOK, HRK, KID, SLL, TVD, ZWL (la page le dit) ; quelques-unes commencent plus tard (ZWG 2024,
XCG 2025, VES 2018…, la page le dit). Comme xe.com et Wise : 1 sem., 1 mois, 6 mois, 1 an, 5 ans, 10 ans ; haut, bas,
moyenne, variation ; survol au doigt ou à la souris ; CSV par le composant de téléchargement du site. « Taux de
référence quotidiens des banques centrales, pas des cotations en continu » écrit sous le graphique.

**Remontée des erreurs.** Avant : 24 fichiers remontaient leurs erreurs. Après :
- `useToolError` (remplace `useState` de l'état d'erreur) : tout message d'erreur **affiché** est remonté, type
  `ToolMessage` (distingué des pannes levées) ; 153 pages et composants convertis par un script ;
- `reportShownMessage` aux autres points d'affichage (champs de sortie des outils développeur, statuts, copie dans le
  presse-papiers) : 29 + 9 fichiers ;
- `ToolErrorWatch`, monté dans `app/tools/layout.tsx` : toute exception non rattrapée ou promesse rejetée non gérée sur
  une page d'outil (filet sous les 225 outils) ; erreurs d'autres origines (Google Translate, extensions) ignorées.
- Couverture (`scripts/p25/error-coverage.mjs`) : **203 outils** remontent directement, **22** par le filet seul — des
  calculs purs (convertisseurs d'unités, compteurs…) dont la validation pendant la frappe n'est volontairement pas
  remontée (un état intermédiaire de saisie n'est pas une erreur de l'outil).
- **Aucune donnée personnelle** : le nettoyage existant (noms de fichiers, chemins) est complété : texte entre
  guillemets, URL, e-mails, nombres de 7 chiffres ou plus (un JSON invalide de V8 cite le texte saisi). Tests :
  `scripts/error-reporting-tests/01-sanitize.js` (lancé par `node_modules/.bin/jiti`).
- **Plafonds** : un même message une seule fois par onglet, 5 rapports au plus par outil et par onglet ; côté serveur,
  aux limites par visiteur existantes (20/h, 100/jour) s'ajoute **2 000 lignes par jour pour tout le site**, réservées
  dans le même appel atomique. L'alerte quotidienne compte à part les messages affichés (seuil 50/jour/outil) et les
  pannes (seuil inchangé, 10).
- Banc : un message affiché par json-formatter part une fois, en `ToolMessage`, sans le texte saisi ; une exception non
  rattrapée part en `UncaughtTypeError` ; rien depuis l'accueil. Route en local : 204, rien écrit (pas la production).

Bancs locaux (construction de production) : lot 1 Chromium 12/12, Firefox 8/8, WebKit 8/8 ; dev-lot de P24 46/46 ×2,
WebKit 45/46 (le cas connu de P24 : le moteur de Safari résout `(a+)+$` en moins de 2 s) ; solidité de tous les outils
Chromium **522/522**, WebKit **522/522**, Firefox 518/522 puis **13/13** en relançant les 4 outils seuls (ils avaient
tourné pendant les encodages x265 des mesures du §5 : le processeur saturé, pas l'outil).
**Préversion** `onlineconvertools-akguf8bxu` (commit `81767c7b`) : lot 1 ×3 moteurs 12 · 8 · 8, solidité de tous les
outils (une fois, Chromium) **522/522**. Fusion `a1aa8f83` (code = `81767c7b`, vérifié) → production
`onlineconvertools-md3dfcxsk` (`5cbfc044`). **www** : contrôle léger 29/29, RAW 7/7, lot 1 Chromium 12/12 dont l'erreur
provoquée **écrite** dans `tool_errors` (`X-Tool-Error-Recorded: yes` ; 2 lignes, outil json-formatter, vers 21 h 54 UTC
le 02/10 à l'horloge de la machine — à ignorer à la prochaine lecture de la table). Retour arrière prêt : `r0igmm5wa`.

## 2. Lot 2 — E4, HTML to PDF depuis une URL

**Moyen des concurrents** (relevé 03/10) : iLovePDF passe l'URL à un Chromium (options : taille d'écran, format,
orientation, marges, « une seule longue page » ; API iLoveAPI : `view_width`, `page_size`, `page_orientation`,
`page_margin`, `single_page`). Le chemin équivalent chez nous (route `url` de Gotenberg) ferait charger la page, ses
ressources et ses redirections **par le Chromium de Gotenberg, sur Railway, à côté de nos autres services** : aucune
de nos règles SSRF ne s'y appliquerait. Gotenberg ≥ 8.32 sait se protéger lui-même (`--chromium-deny-private-ips`, avec
un mandataire qui épingle l'adresse résolue) mais c'est un réglage du service Railway, non autorisé ici (plan, E4).

**Construit** : la page est récupérée **par notre fonction Vercel** (`lib/urlFetch/safeFetch.js`) — http/https,
ports 80/443, pas d'identifiants dans l'adresse ; nom résolu ici et **toutes** les adresses doivent être publiques
(privées, locales, de lien, 169.254.169.254, CGNAT, multidiffusion, documentation, IPv6 locales, IPv4 cachées dans
IPv6 — mappée, NAT64, 6to4, Teredo) ; connexion **épinglée** sur l'adresse vérifiée (pas de « DNS rebinding ») ;
chaque redirection revérifiée (5 au plus) ; 15 s et 5 Mo décompressés pour la page, 3 Mo par ressource, 25 Mo et
150 ressources en tout, 40 s pour l'ensemble, résolution DNS coupée à 5 s. Puis `lib/urlFetch/snapshot.mjs` :
analyse HTML par parse5 ; retrait des scripts, iframe, object, embed, base, link, template, meta http-equiv,
gestionnaires `on*`, liens `javascript:` ; feuilles de style (avec `@import`), images (src, srcset, data-src
paresseux), polices et fonds CSS récupérés par la même garde et **intégrés au document** ; contenu de `<noscript>`
montré ; **politique de sécurité (CSP) placée en tête** : le Chromium de Gotenberg ne peut rien charger ni rien
exécuter ; le résultat est **réanalysé comme Chromium le lira** et refusé si quoi que ce soit d'interdit y survit.
Options, comme iLovePDF : taille d'écran (1920, 1440, 1024, 768, 390 px ou largeur du papier — par l'échelle
d'impression), format, orientation, marges, une seule longue page, style d'impression du site. Limites : 20 conversions
par heure et 60 par jour et par visiteur (IPv6 groupée par /56), 300 par heure pour tout le site.
**Prix de la sécurité, dit sur la page** : les scripts de la page ne sont pas exécutés ; une page construite en
JavaScript peut sortir incomplète (détectée : peu de texte et beaucoup de scripts → la page le dit).

**Revue indépendante (sécurité), deux passages.** Premier passage : 2 **critiques** vérifiés par expérience — une
feuille de style contenant `</style><meta http-equiv=refresh …>` sortait de son élément ; une astuce
`<template><noscript>` (analyse différente entre parse5 et Chromium) faisait apparaître un meta refresh — plus une
expression régulière quadratique (320 Ko de CSS = 77 s), la limite de 25 Mo non tenue avec 8 téléchargements
parallèles, la limite par adresse IPv6 contournable, le délai global non tenu, l'imbrication profonde. Tout corrigé
(échappement de `<` dans le CSS inséré, `template` retiré, réanalyse, analyseur CSS linéaire, réservation des octets,
délai unique, IPv6 par /56 + plafond global). Second passage : aucun critique ni grave ; deux moyens corrigés (la mise
en page ajoutée après le contrôle → désormais dans l'arbre contrôlé ; le jeu de caractères repoussé au-delà de 1 Ko par
des commentaires → commentaires de tête retirés, `<meta charset>` en premier).
Bancs (`scripts/p25/lot2-url-pdf.mjs`, PDF téléchargés et relus par pdf.js) : en local et sur la préversion
`onlineconvertools-5738y6qeq` (vrai Vercel, vrai Gotenberg) — example.com et Wikipedia (11 pages, images intégrées),
une longue page Letter paysage, et **7 refus** dans le navigateur (127.0.0.1, 169.254.169.254, 10.0.0.1, redirection
publique vers 127.0.0.1, nom public qui pointe sur 127.0.0.1, file://, port 8080) : Chromium 10/10, Firefox et WebKit
2/2 ; banc PDF de P24 23/23 (la mise en page commune a été déplacée) sur la préversion, ×3 en local.
Tests : `scripts/p25/safe-fetch.test.mjs` 56/56 (dont un serveur local refusé par adresse et par un nom public qui
pointe sur 127.0.0.1, une redirection publique vers 169.254.169.254 refusée), `scripts/p25/snapshot.test.mjs` 19/19
(dont les attaques de la revue, et l'analyse CSS < 1,5 s sur 5 Mo hostiles). Vraies pages instantanées : Wikipedia
(126 ressources, 2,2 s), BBC News, react.dev, Hacker News — aucune adresse distante restante hors des liens.

**Constat hors E4, pour le propriétaire** : l'outil HTML to PDF accepte depuis toujours un **fichier HTML** déposé par
le visiteur, que le Chromium de Gotenberg rend avec ses ressources distantes ; une page déposée peut donc lui faire
charger une adresse du réseau privé de Railway (`<iframe src="http://….railway.internal">`) et l'imprimer. Nos services
internes demandent tous une clé ou un billet, mais la bonne fermeture est `--chromium-deny-private-ips` sur Gotenberg
(un drapeau, 0 $) : à décider (plan, E4).

## 3. Lot 3 — E1 (RTF) et E3 (préparé, désactivé)

### E1 — PDF to Word en DOC et RTF
- **RTF** : ConvertAPI a `pdf/to/rtf` (même moteur, même prix, 0,01 $ la conversion ; lu dans son OpenAPI le 03/10).
  Choix « Word (.docx) / Rich Text (.rtf) » sur la page ; contrôle du résultat (`{\rtf` au début) ; nom `.rtf`.
  **Limite dite sur la page** : RTF pour les PDF jusqu'à 4 Mo. Au-delà, le PDF passe par le service média (envoi par
  morceaux), qui ne garde que des sorties pdf/docx/xlsx/pptx/png ; y ajouter rtf/doc est une modification Railway non
  autorisée pour E1 (plan).
- **DOC** : **ConvertAPI n'écrit le .doc dans aucun de ses 332 convertisseurs** (seul `doc/to/docx` existe ; lu dans
  `v2.convertapi.com/info/openapi` le 03/10) — le plan de P24 le supposait à tort. Le moyen de CloudConvert / iLovePDF
  pour le .doc : LibreOffice (`--convert-to doc`). Chez nous, le LibreOffice de Gotenberg ne sort que du PDF : il
  faudrait un point d'entrée LibreOffice sur un service (Railway) → chiffré au plan, non fait.

### E3 — PDF Translate du document entier, mise en page gardée
**Moyens relevés (03/10)** :
| Moyen | Prix | Contrainte |
|---|---|---|
| DeepL API (document) | 25 €/M caractères, **minimum 50 000 caractères facturés par PDF** (≈ 1,25 $ même pour 1 page) | — |
| Azure Translator (document) | 15 $/M caractères | PDF **en lots seulement** (stockage Blob Azure, jetons SAS, attente) : l'appel synchrone ne prend pas le PDF |
| Réécrire le texte dans le PDF (OpenAI, déjà payé) | ≈ 0,002 $/page | polices pour 100+ écritures, recalage des lignes : un chantier à part, résultat inférieur aux trois services |
| **Google Cloud Translation (translateDocument)** | **0,08 $/page** | un appel synchrone ; PDF natif jusqu'à 300 pages / 20 Mo, scanné 20 pages ; 133 langues offertes (iLovePDF : 50+) |

**Retenu : Google.** Code complet, **désactivé** tant que le propriétaire n'a pas créé le compte (plan, E3) :
`lib/providers/googleTranslate.js` (jeton OAuth par compte de service, signé ici), `lib/quota/pdfTranslate.js`
(20 pages par visiteur et par jour, IPv6 par /64, 20 pages par document, **budget propre de 30 $/mois** réservé à
0,10 $/page pour couvrir une page dense comptée double, alerte à 50/80/100 %), `app/api/pdf-translate-document`
(GET : disponible ou non ; POST direct et par morceaux), page : le mode « Whole PDF (layout kept) » n'apparaît que si
le serveur dit disponible — **aucune promesse sur la page avant**. Tests `scripts/p25/pdf-translate.test.mjs` 26/26
(compteurs en mémoire, faux Google qui vérifie la signature du jeton et la requête).

**Revue indépendante (argent et quotas), deux passages.** Premier : 1 **critique vérifié par expérience** — le nombre
de pages se falsifie (pdf-lib lit les objets dans l'ordre du fichier sans suivre la table xref : un fichier forgé
donne 1 page à pdf-lib et 25 à pdf.js ; on aurait réservé 0,10 $ pour 300 pages facturées) ; 1 grave — sur délai
dépassé, le budget était rendu alors que Google peut avoir facturé ; plus : un résultat de plus de 4,5 Mo facturé mais
jamais livré, le texte statique de la page contraire au mode document, la requête du jeton sans délai. Corrigés :
**le document envoyé à Google est reconstruit à partir des seules pages comptées** (arbre de pages neuf), délai/réseau
→ seules les pages du visiteur sont rendues, jamais l'argent ; « facturé » dès la réponse reçue ; résultat toujours
déposé sur le service média (le mode n'est offert que si celui-ci est configuré) ; textes de la page selon le mode ;
jeton coupé à 15 s. Second passage : la ré-écriture seule ne suffisait pas (nœuds de pages sans `/Type` : 1 contre 25)
→ reconstruction, vérifiée sur les 5 variantes forgées. **Garde-fou dur demandé au propriétaire** : un quota de pages
par jour sur Cloud Translation et une alerte de budget à 30 $ dans Google Cloud (le mois de Google suit l'heure du
Pacifique, le nôtre l'UTC).

## 6. E2 — PDF/A 1a, 2a, 2u, 3a, 3u : recherche, mesure, chiffrage (non construit)

**Moyen d'iLovePDF** (API iLoveAPI, lue le 03/10) : `conformance` = pdfa-1b, 1a, 2b, 2u, 2a, 3b, 3u, 3a et
`allow_downgrade` (vrai par défaut : « autorise à baisser le niveau en cas d'erreur de conversion »). Autrement dit,
les niveaux « a » et « u » sont **visés, puis abaissés** quand le fichier ne s'y prête pas. Un niveau « a » exige un PDF
**balisé** (arbre de structure) ; aucun outil libre ne balise de façon fiable un PDF qui ne l'est pas (les baliseurs
automatiques sont commerciaux : Adobe Auto-Tag, Apryse, callas, PDFix).

**Mesure locale (03/10, `scripts/p25/e2/`, veraPDF 1.30.2, Ghostscript 10.07.1 comme le service, pikepdf)** sur la même
page imprimée par Chromium, balisée et non balisée :

| Chemin | 1a | 1b | 2a | 2u | 2b | 3a | 3u | 3b |
|---|---|---|---|---|---|---|---|---|
| A. Ghostscript, comme `pdf-tools` aujourd'hui | — | ✅ | ❌ structure perdue | — | ✅ | ❌ | — | ✅ |
| C. A + niveau « U » écrit dans les métadonnées | — | — | — | ✅ (balisé et non balisé) | — | — | ✅ (les deux) | — |
| B. pikepdf seul, **structure gardée** | ❌ (6.3.5, polices) | ❌ | ✅ **si balisé**, ❌ sinon | ✅ | ✅ | ✅ si balisé | ✅ | ✅ |

**Conclusion** : 2u et 3u sont atteignables pour presque tout PDF (Ghostscript écrit les tables Unicode) ; 2a et 3a
pour les PDF **déjà balisés** (exports Word, Google Docs, Chrome) par un chemin qui garde la structure, sinon
abaissement dit au visiteur (comme `allow_downgrade`) ; 1a n'est pas atteint par les outils libres mesurés. **Chaque
résultat doit être validé par veraPDF avant d'être livré** (le service le fait déjà pour 1b/2b/3b).
**Pourquoi non construit** : tout se passe dans le service `pdf-tools` sur Railway, que P25 n'autorise à modifier que
pour E5. **Chiffrage** : 0 $ de plus (Ghostscript, pikepdf et veraPDF y sont déjà), ≈ 4-6 h, une modification
additive de `pdf-tools` (nouveaux niveaux, anciens identiques) puis la page. Recommandation au plan.

## 5. E5 — options vidéo (service ffmpeg sur Railway, puis pages)

**Moyen des concurrents** (relevé 03/10) : FreeConvert (« réglages avancés » : codec, CRF, taille, i/s, rotation,
miroir, coupe, volume, fondu en entrée et en sortie), 123apps (miroir, vitesse 0,25×-4×, recadrage libre avec formes
fixes, volume), Clideo (vitesse, volume), Kapwing (recadrage, fondus). **Boucle du GIF** : déjà livrée par P24
(Video → GIF « joué une fois / 3 fois / sans fin », gifsicle dans le navigateur), vérifiée sur la préversion de P24.

**Service (`services/media-processing`, additif)** : `flip` (h, v, hv), `crop` {x, y, w, h} (dans l'image affichée,
borné par ffmpeg), `speed` (0,25 à 4 ; le son suit par `atempo` sans changer de hauteur ; la fréquence d'images de la
source est gardée), `volume` (0 à 300 %), `fadeIn` / `fadeOut` (0-10 s, sur la durée de SORTIE, vitesse et coupe
comprises) et `fadeVideo` (l'image aussi, depuis / vers le noir), `codec` (h264, h265 en MP4 ou MOV, av1 en MP4) et
`crf` exact (0-51, AV1 0-63 ; un seul encodage, livré même plus gros, et dit). La fréquence d'images est lue par la
sonde (`ProbeResult.fps`, 0 si inconnue). `/health` renvoie `edits: 2` : seul ce code le dit (preuve qu'il tourne).
**Additif prouvé octet pour octet** : 342 requêtes d'avant (toutes les cibles × 3 qualités, compressions, éditions,
coupes, GIF, Opus) construisent exactement la même commande que le code précédent (`tests/run_p25_edit_tests.py`,
qui charge l'ancien `ffmpeg_ops.py` depuis git). Tests réels (ffmpeg local) : miroir (pixels), recadrage (taille et
pixels, boîte hors image bornée), vitesses 0,25/0,5/2/4 (durées image ET son, 30 i/s gardées), volume 50 % (RMS ÷ 2)
et 0, fondus (silence au début et à la fin, première image noire), H.265 (hevc, `hvc1`) et AV1, CRF 40 contre 18,
compression H.265. Suites existantes : édition 34/34, coupe 23/23, GIF 7/7, débit Opus 12/12 ; suite de bout en bout
100/106 — **les 6 mêmes échecs sur le code d'avant avec le même échantillon** (ils attendent la vraie vidéo de caméra à
5,7 Mbit/s de la suite ; l'échantillon synthétique d'ici fait grossir les vieux codecs) : pas une régression.

**Niveaux du compresseur en H.265 / AV1, mesurés (VMAF, ffmpeg local)** sur deux clips 1080p de 10 s
(test-videos.co.uk) — caméra (Jellyfish) et animation (Big Buck Bunny) :

| Niveau | H.264 (inchangé) | H.265 (CRF 27/30/34) | AV1 (CRF 42/48/55) |
|---|---|---|---|
| Caméra — léger | 4,93 Mo · VMAF 86,2 | 3,00 Mo · 86,5 (−39 %) | 2,55 Mo · 86,0 (−48 %) |
| Caméra — équilibré | 3,58 Mo · 79,9 | 2,14 Mo · 80,1 (−40 %) | 1,78 Mo · 79,7 (−50 %) |
| Caméra — fort | 2,41 Mo · 68,8 | 1,36 Mo · 68,7 (−44 %) | 1,13 Mo · 69,3 (−53 %) |
| Animation — léger | 3,71 Mo · 82,2 | 3,25 Mo · 86,0 | 4,85 Mo · 92,2 |
| Animation — équilibré | 2,33 Mo · 74,8 | 1,96 Mo · 80,1 | 3,40 Mo · 91,0 |
| Animation — fort | 1,26 Mo · 60,9 | 1,00 Mo · 67,9 | 2,00 Mo · 88,2 |

Sur la caméra (le cas courant), même qualité pour 40 % (H.265) à 50 % (AV1) de poids en moins ; sur l'animation, H.265
est plus léger ET meilleur, AV1 plus lourd mais bien meilleur — la page le dit ainsi, sans promesse générale.

**Pages** : Video Rotator — miroir gauche-droite / haut-bas, seul (« No rotation ») ou avec une rotation ; Video Resizer
— mode « Crop » : cadre déplaçable et redimensionnable au doigt ou à la souris sur l'image, formes libre, 1:1, 16:9,
9:16, 4:5, 4:3, valeurs exactes en pixels ; Video Converter — « More options » pour MP4 (H.264/H.265/AV1), MOV, M4V :
vitesse, miroir, volume, fondus, CRF exact ; Video Compressor — codec H.264 / H.265 / AV1 et CRF exact.
