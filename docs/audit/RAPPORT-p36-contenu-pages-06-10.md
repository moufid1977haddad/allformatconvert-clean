# RAPPORT — P36 : certificat HTTPS, contenu exact des 225 pages, pages légales et À propos, Analytics Europe, éditeur PDF arabe (06/10)

Branche `p36`, repère de restauration `restauration-avant-p36-06-10` = `f7f0601e`.

## État final (06/10) — à lire d'abord

- **Tout P36 est prêt, vérifié et poussé sur la branche `p36` (`2abe4e87`), mais N'EST PAS EN PRODUCTION.** La
  préversion `onlineconvertools-4jv2udv6j` (= `2abe4e87`) a été contrôlée : 225 pages identiques à la construction
  locale vérifiée, données structurées ALL PASS, contrôle léger 29/29. Le passage en production (avance rapide de
  `master` sur `p36`) a été **refusé par le filtre de permissions de la session** (« Production Deploy ») ; je ne l'ai
  pas contourné. **Geste du propriétaire**, dans le terminal du dépôt : `git push origin p36:master` (avance rapide,
  vérifiée possible : `master` = `f7f0601e`, ancêtre de `p36`). Vercel construit alors la production ; ensuite
  `node scripts/p24/www-light.mjs` sur www. Retour arrière prêt : promouvoir `onlineconvertools-gbnnrjftd`
  (= `206684a1`, production actuelle, P35). Le contrôle quotidien du certificat (lot 0) n'agit qu'une fois en production.
- **Lot 0** : certificat valide de notre côté ; contrôle quotidien du certificat ajouté.
- **Lots 1-2** : gabarit tiré du marché ; audit des 225 pages avant réécriture : **1 435 défauts**.
- **Lots 3-N** : 225 pages d'outil + 12 pages de catégorie réécrites, **relues jusqu'à zéro défaut** par 15 réviseurs
  indépendants (2 à 5 passes) et par les scripts.
- **A2** : À propos (texte du propriétaire, sans aucune mention d'origine), confidentialité, conditions ; ads.txt prêt.
- **EU** : non faisable d'ici (l'outil gratuit est bloqué par le défi anti-robot de Vercel) → reste au propriétaire.
- **R** : étude arabe livrée, rien en ligne.
- **Dépense : 0 $** (aucun appel payant ; 1 préversion Vercel ; aucune action Railway, Supabase, Cloudflare, DNS).
- **Sous-agents** : 33 (marché, étude arabe, 14 auditeurs-rédacteurs, 1 rédacteur des catégories, 15 réviseurs) ;
  règles des secrets copiées dans chaque consigne ; aucun n'a lu de fichier de secrets.
- **Ajout du propriétaire (passe iPhone P33)** : statuts passés à « confirmé sur iPhone le 2026-10-06 » au plan et au
  rapport P33 ; les trois points (OCR iOS direct au serveur, rectangle Redact ajusté, arabe dans la couche de texte de
  Redact) sont au plan comme prochain chantier technique, rien changé en ligne.


## Lot 0 — certificat HTTPS (NET::ERR_CERT_AUTHORITY_INVALID signalé le 06/10 vers 15 h 38, heure du Québec)

**Conclusion : rien de faux de notre côté ; l'erreur vient très probablement du poste ou du réseau du visiteur.**

Constat (05/10 au soir, heure du Québec) :
- **Certificats servis** (`openssl s_client -showcerts`, sur les 4 adresses IP de Vercel pour chaque nom) :
  `www.onlineconvertools.com` → feuille `CN=www.onlineconvertools.com`, émise par **Let's Encrypt YR2**, valide du
  **08/08/2026 au 06/11/2026** ; domaine nu → `CN=onlineconvertools.com`, Let's Encrypt YR2, **07/08 → 05/11/2026**.
  Chaîne **complète** envoyée par le serveur : feuille → YR2 → ISRG Root YR (croisée par **ISRG Root X1**). Vérification
  OpenSSL : `0 (ok)` partout. TLS 1.3.
- **SSL Labs** (Qualys, 05/10) : www **A+** (216.150.16.193) et **A** (216.150.1.193), **0 problème de chaîne**, chemin
  de confiance valide dans les magasins **Mozilla, Apple, Android et Java**.
- **crt.sh** (journaux de transparence) : seuls certificats valides pour le domaine : les deux Let's Encrypt YR2 ci-dessus
  (émis par Vercel), plus deux certificats génériques `*.onlineconvertools.com` du **05/08** (Google Trust Services WE1 et
  Let's Encrypt YE2) — ceux que Cloudflare émet pour une zone qu'il gère (« Universal SSL ») ; ils ne sont servis que si
  un enregistrement passe par le proxy Cloudflare, ce qui n'est pas le cas aujourd'hui. Aucun certificat d'un émetteur
  inconnu.
- **DNS** (lu par DNS-over-HTTPS) : NS Cloudflare (`lamar`, `tani`) ; domaine nu `A 216.150.1.193, 216.150.16.193` ;
  www `CNAME 638aeebda7ed56d7.vercel-dns-017.com` → `216.150.1.1, 216.150.16.1` : adresses **Vercel**, donc Cloudflare en
  **DNS seul** (pas de proxy, sinon on verrait des adresses Cloudflare). Pas d'AAAA. **CAA** : aucune sur le domaine nu
  (toute autorité permise) ; sur www, celles de Vercel (letsencrypt.org, pki.goog, sectigo.com, globalsign.com) : rien ne
  bloque l'émission.
- **HSTS** : `max-age=63072000` (2 ans), sans `includeSubDomains` ni `preload`. **Redirections** : https nu → https www
  (308, 1 saut) ; http nu → https nu → www (2 sauts, connu, S7 de l'audit).

Pourquoi le visiteur a pu voir l'erreur : `ERR_CERT_AUTHORITY_INVALID` = Chrome ne reconnaît pas l'autorité de la chaîne
qu'il reçoit. La nôtre est reconnue par tous les magasins actuels ; le même certificat était servi le 06/10 (émis le
08/08). Les causes habituelles, toutes du côté du visiteur : un **antivirus qui inspecte le HTTPS** (Avast, Kaspersky,
ESET, Bitdefender… remplacent le certificat par le leur), un **réseau d'entreprise ou d'école** qui intercepte le trafic,
un **Wi-Fi public avec portail captif** (hôtel, café) avant connexion, ou un appareil très ancien dont le magasin ne
contient pas ISRG Root X1 (Android antérieur à 7.1.1 avec un vieux Chrome). Une horloge fausse donne en général
`ERR_CERT_DATE_INVALID`, pas celle-ci. **Aucune correction à faire chez Vercel, Cloudflare ou dans le DNS.** Si le
propriétaire peut joindre le visiteur : lui demander l'émetteur affiché en cliquant sur « Non sécurisé » → certificat
(le nom de son antivirus ou de son réseau y apparaîtra).

**Ajouté** : le contrôle quotidien (`/api/cron/health-check`, 08 h UTC) vérifie maintenant le certificat de www **et** du
domaine nu (`lib/certCheck.js`) : chaîne non reconnue par le magasin de Node (Mozilla), **expiration à moins de 14
jours**, émetteur autre que Let's Encrypt (un certificat Google Trust Services voudrait dire que le proxy Cloudflare a été
allumé), nom non couvert. Alerte **ntfy + courriel** sur le canal existant, une fois par incident puis au retour à la
normale (`checkStateTransition`). Test `scripts/p36/cert-check.test.mjs` **17/17** : verdicts purs + vraie poignée de main
(nos deux noms : 32 et 30 jours restants ; 4 certificats cassés de badssl.com tous signalés : racine inconnue, expiré, nom
faux, autosigné). À noter : Vercel renouvelle normalement vers 30 jours avant l'échéance ; si l'alerte « 13 days left »
arrive, le renouvellement a échoué.

## Lot 1 — marché (`docs/audit/GABARIT-CONTENU-P36.md`)

73 pages de 6 concurrents (iLovePDF/iLoveIMG, Smallpdf, CloudConvert, FreeConvert, 123apps, PDF24) pour 24 outils, lues
le 05/10. **Les « People also ask » de Google n'ont pas pu être lus** (l'outil de recherche disponible n'est pas
Google) : les questions viennent des FAQ des concurrents et de 6 recherches, chacune avec sa source. Constat : la
plupart des concurrents répètent un même gabarit d'une page à l'autre et tiennent par l'autorité de leur domaine ;
Smallpdf seul écrit un texte propre à chaque outil ; presque personne ne donne ses vraies limites ni le lieu de
traitement. Gabarit retenu : titre ≤ 60, méta 110-155, About 60-120 mots, exemple réel (texte, développeur, calcul),
étapes avec les vrais libellés, « Formats and limits », « Where your file is processed », 3-6 FAQ, astuces, outils liés.

## Lot 2 — audit des textes avant réécriture (`docs/audit/AUDIT-TEXTES-P36.md`)

Texte servi relu **sur www** (et non sur une construction locale : sans la variable du service média, le local servait
les anciennes pages vidéo). **1 435 défauts** : 203 faux, 137 invérifiables, 394 trompeurs, 453 génériques, 152 minces,
22 libellés, 74 formats. 25 paires de pages à plus de 30 % de phrases identiques (maximum 84 %, les pages vidéo → GIF),
101 phrases répétées sur 3 pages ou plus (« Yes, it's completely free with no signup required » : 92 pages), 43 pages
sous 300 mots.

## Lots 3 à N — réécriture, par catégorie

**Méthode** : chaque auditeur du lot 2 a réécrit les pages qu'il venait d'auditer (il connaissait leur code) selon
`docs/audit/p36/CONSIGNES-REDACTION.md` ; puis **contrôle n° 1** (scripts, sur toutes les pages) et **contrôle n° 2**
(un réviseur indépendant par lot, qui n'a pas écrit les pages et relit tout dans le code, jusqu'à zéro défaut).
Nouvelle structure de page (`SeoContent` : `howToTitle`, `specs`, `privacy`) : About, Exemple, Étapes, **Formats and
limits**, **Where your file is processed**, FAQ, Astuces, Outils liés (P35, inchangés). FAQPage = FAQ visible, à
l'identique (`seo-lot3-check` ALL PASS sur les 225 pages, en local et sur la préversion).

**Contrôle n° 1 — scripts** (`scripts/p36/content-verify.mjs`, nouveau, plus les deux gardes de la construction) :
C0 syntaxe ; C1 titre ≤ 60, méta 110-155, uniques, différents de l'About ; C2 structure ; **C3 chaque nombre avec unité
prouvé dans le code** (`docs/audit/p36/preuves/<lot>.json` : motif retrouvé dans le fichier, ou valeur calculée `${…}`
depuis la constante) ; C4 formats nommés présents dans le code ; C5 lieu de traitement cohérent avec les appels réseau
du code ; C6 phrases interdites et phrases génériques ; C7 phrases identiques entre pages > 30 %.
`instructions.mjs` : chaque libellé cité existe dans le code (1 763 libellés) ; `privacy-claims.mjs` : aucune promesse
« rien n'est envoyé » fausse. **Final : 0 défaut sur les 225 pages pour les trois.** Pendant la rédaction, chaque
rédacteur a corrigé les défauts des scripts avant de rendre (non journalisés un par un) ; ensuite **18 phrases
génériques** relevées par la règle C6 ajoutée en cours de route, et 9 libellés ou preuves cassés par le passage à
l'orthographe américaine, tous corrigés.

**Contrôle n° 2 — réviseurs indépendants** (défauts par passe, `docs/audit/p36/relecture/<lot>.md`) :

| Catégorie (lot) | Pages | Passe 1 | 2 | 3 | 4 | 5 | Final |
|---|---|---|---|---|---|---|---|
| PDF (pdf-1) | 19 | 46 | 6 | 0 | | | **0** |
| PDF (pdf-2) | 20 | 76 | 9 | 0 | | | **0** |
| Image (image-1) | 18 | 60 | 8 | 1 | 0 | | **0** |
| Image (image-2) | 19 | 98 | 19 | 3 | 0 | | **0** |
| Audio + 4 pages vidéo (audio) | 15 | 58 | 12 | 2 | 1 | 0 | **0** |
| Vidéo (video) | 11 | 34 | 10 | 1 | 0 | | **0** |
| GIF + Fichier (gif-file) | 19 | 36 | 8 | 0 | | | **0** |
| Texte (text) | 16 | 48 | 10 | 5 | 0 | | **0** |
| Développeur, données (dev-data) | 16 | 43 | 5 | 0 | | | **0** |
| Développeur, code (dev-code) | 18 | 41 | 10 | 0 | | | **0** |
| Développeur, encodage et jumeaux (dev-encode) | 13 | 79 | 14 | 1 | 1 | 0 | **0** |
| Développeur, divers (dev-misc) | 13 | 22 | 7 | 6 | 0 | | **0** |
| Converter + QR + Math | 12 | 30 | 7 | 0 | | | **0** |
| IA (ai) | 16 | 69 | 12 | 1 | 0 | | **0** |
| **12 pages de catégorie** | 12 | 78 | 16 | 4 | 0 | | **0** |

**Mots par page** (bloc de contenu, liens « Related tools » compris), **unicité**, **affirmations fausses supprimées** :

| Catégorie | Pages | Médiane avant → après | Min–max avant → après | Pages < 300 mots | Phrases identiques avec une autre page (max) | Faux + invérifiables + trompeurs supprimés (audit) |
|---|---|---|---|---|---|---|
| PDF | 39 | 458 → 523 | 255–1133 → 358–723 | 3 → 0 | 68,8 % → 5,0 % | 182 |
| Image | 37 | 305 → 497 | 250–912 → 397–763 | 14 → 0 | 31,8 % → 0,0 % | 123 |
| Audio | 11 | 415 → 630 | 375–977 → 470–743 | 0 → 0 | 45,5 % → 4,3 % | 53 (lot audio, 15 pages) |
| Vidéo | 15 | 428 → 627 | 290–669 → 549–857 | 2 → 0 | 45,5 % → 4,8 % | 38 (lot vidéo, 11 pages) |
| GIF | 11 | 377 → 555 | 316–482 → 461–648 | 0 → 0 | 84,0 % → 4,3 % | 44 (lot gif-file, avec Fichier) |
| Fichier | 9 | 392 → 522 | 287–614 → 438–629 | 1 → 0 | 10,0 % → 4,0 % | (dans gif-file) |
| Texte | 17 | 286 → 554 | 215–460 → 452–618 | 9 → 0 | 25,0 % → 4,0 % | 42 |
| Développeur | 57 | 348 → 573 | 221–971 → 424–854 | 13 → 0 | 55,6 % → 4,5 % | 179 (4 lots) |
| Converter | 4 | 468 → 707 | 398–520 → 635–738 | 0 → 0 | 16,0 % → 3,7 % | 51 (avec QR et Math) |
| QR & codes-barres | 3 | 510 → 750 | 476–928 → 634–867 | 0 → 0 | 5,9 % → 0,0 % | (idem) |
| Math | 6 | 383 → 696 | 287–782 → 483–792 | 1 → 0 | 6,7 % → 0,0 % | (idem) |
| IA | 16 | 353 → 529 | 309–555 → 441–627 | 0 → 0 | 10,5 % → 3,7 % | 62 |

**Unicité sur toutes les paires** (225 pages, `scripts/p36/uniqueness.mjs`, phrases d'au moins 3 mots, titres et
liens exclus) : avant, 5 257 paires partageaient au moins une phrase, 25 dépassaient 30 %, maximum 84 % ; **après,
47 paires, aucune au-delà de 30 %, maximum 5 %**. Les seules phrases encore présentes sur 3 pages ou plus sont des
questions courtes (« Is there a size limit? » : 7 pages, avec des réponses différentes).

**Textes d'interface corrigés** (faux ou invérifiables ; jamais la logique) : environ 60 chaînes, listées dans chaque
`docs/audit/p36/redaction/<lot>.md`, dont les composants partagés `MediaServiceTool` (« works in every browser »,
« deleted as soon as you have downloaded » → « converted on our video server · the uploaded video is deleted when
processing ends, the result once it has been downloaded or after a set time »), `gifEncode` (« 16 megapixels » →
valeur calculée, 16,8), `CronPaste` (conseil AWS faux), `timestamp` (bornes réelles), `localUpscale` (« about 25 MB,
first time only » → 17 MB plus le moteur depuis jsDelivr, une fois par visite), `symbologies` (« most widely used »).
Un correctif de comportement : **Lorem Ipsum** affiche « Enter a whole number of 1 or more. » au lieu de « Result is
empty ». Quatre libellés de contrôle passés à l'orthographe américaine (« Clear center », « Color noise »,
« Outline color », « Stretch (old behavior) ») ; « Normalize instead (even loudness at -16 LUFS) » (le mot
« standard » n'était pas prouvé). **Contrôle visuel** : 239 pages × 375 et 390 px, **0 débordement**, 0 cible tactile
trop petite (`scripts/p31/layout-iphone.mjs`).

**Défauts de CODE trouvés pendant l'audit et la relecture, NON corrigés (hors du périmètre « contenu »), au plan** :
le nettoyeur des rapports d'erreur laisse passer des morceaux d'expression régulière ou de jeton (`reportError.js`) ;
Image Metadata ne lit pas le WebP (exifr sans lecteur WebP) ; aperçu cassé de SVG to PNG ; worker TIFF to JPG sans
test d'OffscreenCanvas ; qualité PDF < 50 % ignorée (Image Converter) ; EPUB to PDF : chapitre manquant = page vide,
compteur jamais atteint ; env-to-json télécharge toujours `env.json` ; excel-to-csv ne reconvertit pas après un
changement d'option ; json-to-csv et json-to-yaml mettent les clés entières en premier ; xml-to-json sans position
d'erreur ; JSON to Python : note `//` invalide en Python ; JSON to PHP (classes) sans `JSON_BIGINT_AS_STRING` ;
TypeScript to JS : JSX détecté seulement avec `return <`, namespaces supprimés ; `csso` non déclaré dans
package.json ; API Tester : adresse relative envoyée à notre site, `content-type` en minuscules ajouté au lieu de
remplacer ; Video Converter refuse « Resolution » + vitesse ou miroir seulement après l'envoi ; estimation de temps de
Video Watermark = durée de vidéo ; Video Rotator garde un mode « lossless » caché après un changement de fichier ;
Audio Compressor affiche « MB MB » ; curseurs d'Audio Equalizer nommés « : dB » ; AC3/MP2 à 128 kbit/s encodé à 192 ;
`.ac3` absent de la liste audio acceptée ; tablettes Android traitées comme des ordinateurs (`isMobileDevice`) ;
Sentence case ne met pas de majuscule après « . » suivi d'une minuscule ; aperçu Markdown probablement sans style
(`prose` sans plugin) ; Color Picker ignore un code sans `#` ; Barcode : 5 types sur 37 non relus ; libellés
d'interface en orthographe britannique sur une vingtaine de contrôles (« Colour », « Bar colour »…), à harmoniser avant
P37. Les pages décrivent le comportement réel actuel ; elles devront suivre si ces défauts sont corrigés.

## 5 pages complètes en exemple (texte rendu)

Texte intégral dans `docs/audit/p36/exemples-5-pages.md` : PDF to Word, Image Compressor, Word Counter, JSON
Formatter, MP4 to GIF. Extrait — **Word Counter** :

> **Word Counter — Words, Characters, Reading Time, Keywords** (56 caractères) · méta (129) : *Count words,
> characters, sentences and paragraphs live, see reading and speaking time, and list your most used words and phrases.*
>
> **About** — Word Counter counts the words, characters with and without spaces, sentences and paragraphs of a text as
> you type, and estimates reading time at 200 words a minute and speaking time at 130. Below the counts, a keyword
> density table lists the most frequent words, or repeated two- and three-word phrases, with their share of all words.
> It relies on your browser's Unicode segmentation, so Chinese, Japanese and Thai are split into words and Mr. or 3.50
> do not end a sentence. It only counts, and it runs in your browser.
>
> **Example** — « Mr. Smith paid $3.50 for coffee. He liked it! The next day he came back. » → Words 15, Characters 73,
> No Spaces 58, Sentences 3, Paragraphs 2 (sortie produite par le vrai code de l'outil).

## Lot A2 — pages légales AdSense et À propos

**Exigences vérifiées sur la documentation officielle de Google (06/10)** :
[answer/1348695](https://support.google.com/adsense/answer/1348695) (trois mentions obligatoires : cookies des
fournisseurs tiers dont Google, cookies publicitaires de Google, refus via Ads Settings ou aboutads.info ; et, si des
annonces de tiers sont servies, les nommer avec leurs liens) ;
[answer/12171612](https://support.google.com/adsense/answer/12171612) (ads.txt fortement recommandé, à la racine, ligne
`google.com, pub-…, DIRECT, f08c47fec0942fa0`) ;
[politique de consentement UE](https://www.google.com/about/company/user-consent-policy/) (consentement valable pour
cookies et personnalisation dans l'EEE, au Royaume-Uni et en Suisse, parties identifiées, retrait possible) ;
[answer/9012903](https://support.google.com/adsense/answer/9012903) (liste des fournisseurs de technologie
publicitaire de Google). La CMP certifiée (answer/13554116) reste la décision P35-1.

**Fait** :
- `/privacy` : responsable nommé (« run by its founder, Moufid Haddad, in Québec, Canada ») ; **tant qu'AdSense est
  coupé**, la politique dit que le site ne montre aucune annonce et ne pose aucun cookie publicitaire, et décrira les
  annonces avant qu'elles apparaissent ; **dès qu'AdSense est activé** (`NEXT_PUBLIC_ADSENSE_CLIENT`), la section
  « Advertising » apparaît avec les trois mentions obligatoires, les cookies (`__gads`, `__gpi`, `IDE`), le lien vers la
  liste des fournisseurs de Google, le message de consentement en Europe, et la phrase « Google Analytics stays off in
  the EEA, the UK and Switzerland, whatever you answer » (cohérent avec P35 : rien n'est chargé en Europe sans
  consentement).
- `/terms` (6 octobre) : §1 exploitant « Moufid Haddad, Québec, Canada » ; §6 publicité au conditionnel exact selon
  l'état d'AdSense ; juridiction Québec, Canada (§10, inchangé).
- **Contact visible depuis chaque page** : lien « Contact » du pied de page (gabarit commun) ; adresse
  contact@onlineconvertools.com sur À propos, Confidentialité et Conditions.
- **ads.txt** : le mécanisme existait déjà (`app/ads.txt/route.js`, construit depuis `NEXT_PUBLIC_ADSENSE_CLIENT`, 404
  tant que la variable est absente) : **aucun identifiant inventé**.
- **À propos** (texte du propriétaire du 06/10 ; **aucune mention d'origine, de nationalité ni de langues**, ni sur la
  page, ni dans les données structurées, ni dans les métadonnées) : titre « About OnlineConverTools — Moufid Haddad,
  Founder » ; chiffres **mesurés à chaque construction** (`app/lib/serverToolCount.json`, vérifié par
  `privacy-claims.mjs`, qui arrête la construction s'ils ne sont plus justes) ; année de création = premier commit du
  dépôt (19 mai 2026) ; données structurées Organization + Person identiques au texte visible.

Texte rendu de la page À propos :

> **About OnlineConverTools** — *Every conversion tool you need, in one place.*
>
> **Why I built it** — I built OnlineConverTools because converting one file often meant visiting five different
> websites. So I brought every tool together — PDF, images, audio, video, text and developer tools — in one place, free
> and easy to use. I want everyone to find the tool they need here, without looking anywhere else.
> **Moufid Haddad, Founder** — Québec, Canada · OnlineConverTools since 2026
>
> **What you will find here** — 225 free tools in 12 categories, for converting, compressing and editing files and for
> everyday text, developer, math and AI tasks. *(12 liens de catégorie)*
>
> **Where your files are processed** — Most tools, 168 of the 225, need no server. These tools run entirely in your
> browser: the file is read and converted on your device and is not sent to us. The other 57 send your file or text to
> a server in at least one case: to our own processing servers, or to a provider named in our privacy policy
> (ConvertAPI, OpenAI, Pangram Labs, Google). For 4 of them this happens only when an iPhone or iPad cannot finish the
> work itself, and the page says so. The privacy policy lists every one of these tools by name.
>
> **Free, with fair-use limits** — Every tool is free to use, and no tool requires an account. Tools that rely on a
> server or a paid provider have hourly and daily limits per connection, and some share a monthly budget for the whole
> site, so that they can stay free for everyone.
>
> **Contact** — Questions, a bug, a tool you would like to see: write to contact@onlineconvertools.com or use the
> contact form.

## Lot EU — Analytics depuis l'Europe (P35-3)

**Non faisable d'ici.** Webbkoll (dataskydd.net, serveur en Suède, gratuit, sans compte, ni IP ni URL conservées)
aurait été l'outil idéal : les 3 analyses (accueil, PDF to Word, Image Compressor) ont été **refusées par le
« Vercel Security Checkpoint »** (HTTP 403, `x-vercel-mitigated: challenge`, nœud Vercel `arn1`, Stockholm). Les autres
scanners européens gratuits demandent un compte ou une adresse courriel, ou exécutent la page dans un vrai navigateur
que je ne peux pas piloter dans cette session (extension Chrome non connectée). **Geste du propriétaire** (5 min,
inchangé, P35-3) : avec un VPN européen ou un proche en Europe, ouvrir www, outils de développement → Réseau : aucune
requête vers google-analytics ou googletagmanager ; Application → Cookies : aucun `_ga`. À noter : le défi anti-robot de
Vercel bloque aussi des outils d'analyse légitimes venant de centres de données (Googlebot n'est pas concerné : Vercel
laisse passer les robots vérifiés).

## Lot R — éditeur de texte PDF arabe (`docs/audit/ETUDE-EDITEUR-PDF-ARABE.md`)

- **Concurrents** (pages lues le 05/10) : Sejda écrit que l'arabe n'est pas pleinement pris en charge (vérifié) ;
  iLovePDF et Smallpdf annoncent l'édition du texte sans parler de l'arabe (la limite « pas d'arabe » vient d'une page
  du concurrent UPDF : **non vérifiable** à la source) ; PDFzorro n'édite pas le texte existant ; Nutrient : éditeur de
  contenu « LTR only » (vérifié), prix sur devis ; Apryse : rien de documenté pour l'arabe, sur devis. Ceux qui le font
  sont des **logiciels de bureau** : UPDF (49,99 $/an ou 79,99 $ à vie) et Acrobat Pro sous Windows (19,99 $/mois ;
  capacité arabe non vérifiable directement, aide Adobe en 403).
- **Chemin à licences permissives** : pdf-lib et fontkit (MIT), pdf.js (Apache-2.0), harfbuzzjs et bidi-js (MIT),
  polices Noto Naskh Arabic et Amiri (OFL) ; tout dans le navigateur. Le moteur Redact actuel (pages rendues en image)
  ne convient pas ; le prototype retire vraiment les glyphes du flux de contenu.
- **Mesuré** sur 8 PDF générés (LibreOffice et Chrome, 7 polices ; Word bloqué par l'automatisation COM ; dossier
  « pdf-arabe-tests » absent des Téléchargements) : 8/8 sur mot, chiffres + mot, titre gras, mot à harakat — ancien texte
  réellement retiré, nouveau texte bien lié, bon ordre, trouvable et copiable ; un simple rectangle blanc laisse l'ancien
  texte extractible (5/5). **Limites** : pas de remise en page (un mot plus long chevauche son voisin, jusqu'à 2,7 pt
  dans 5 cas sur 32) ; police intégrée entière (fichier de ~40 Ko → ~500 Ko, sous-ensemble à faire) ; PDF scannés et
  polices sans table Unicode hors de portée.
- **Effort** : 20 à 30 jours pour « remplacer, supprimer, ajouter sur une ligne » ; paragraphes justifiés en plus.
  **Recommandation** : construire par étapes, seulement après un test du prototype sur une trentaine de **vrais** PDF
  arabes d'utilisateurs (plus de 80 % de lignes réussies). Rien n'est en ligne ni annoncé.
