# RAPPORT P27 — texte des PDF/A, vraie conversion .doc, Gotenberg 8.37, vitesse, accessibilité, clarté (03-04/10)

Demandé par le propriétaire (prompt P27), mises en production comprises, y compris en son absence (jusqu'au 04/10
vers 17 h). Branche `p27-nuit`, repère de restauration `restauration-avant-p27-04-10` = `ffe978a7` (master avant P27).
Autorisations : Railway (pdf-tools, Gotenberg) pour les phases 1 à 3 seulement, aux conditions de P26 ; ConvertAPI
0,05 $ au plus pour la phase 2 ; aucune autre dépense, rien sur Supabase. Rapport complété après chaque phase.

## 0. Récapitulatif

| Phase | Contenu | État |
|---|---|---|
| 1 | PDF/A 1b/2b/3b : texte exactement celui du source, sinon message clair | ✅ **en production** (pdf-tools `83a62d4c` puis `0901abe9` ; site `g0lpolk68` = `98b84eba`) |
| 2 | PDF to Word : vraie conversion .doc et .rtf > 4 Mo sur www | ✅ faites et rouvertes ; **défaut trouvé et corrigé** (accents perdus par ConvertAPI), en production |
| 3 | Gotenberg 8.37 à côté de 8.36, comparaison au pixel et au texte | ⛔ **bloquée** : le déploiement de 8.37 sur `gotenberg-fonts` a été refusé par le garde-fou des permissions de Claude Code (« Production Deploy ») — décision du propriétaire (§3) |
| 4 | Vitesse mobile (Lighthouse) des 238 pages, en local | à faire |
| 5 | Accessibilité AA (axe) des 238 pages + clavier | à faire |
| 6 | Clarté d'usage (zone d'envoi, bouton, menu, pied de page) | à faire |
| 7 | Restes de P23 (gros fichier sur une ligne, borne téléphone) | à faire |

## 1. Phase 1 — PDF/A 1b, 2b, 3b : le texte n'est plus jamais altéré

### 1.1 Constat repris de P26 et cause
En production, les niveaux b étaient la sortie de Ghostscript telle quelle (validée par veraPDF, qui ne vérifie pas
le texte) : grec « Ελληνικά » → « Ε½½ην»¼ά », « section » → « sec琀椀on », « données » → « donnees ». Cause mesurée
cette nuit pour une partie des cas : LibreOffice (sous Windows, police Cambria par exemple) et Chromium dessinent
certains accents en deux glyphes (« e » + accent) et ligatures / arabe en glyphes sans texte, et portent le bon texte
dans un `/ActualText` ; Ghostscript ne le garde pas toujours, et son propre lecteur de texte (`txtwrite`) **l'ignore**
(« données » y est lu « donne\x08es » dans la source même) — un contrôle fait avec lui seul aurait laissé passer une
sortie fautive.

### 1.2 Correction (service pdf-tools)
Même méthode que les niveaux u de P26, pour 1b/2b/3b et pour le niveau b atteint par abaissement :
1. le PDF source **gardé tel quel** (pikepdf : profil sRGB, métadonnées XMP, drapeaux des annotations ; pour 1b,
   version 1.4 sans flux d'objets et un `CIDSet` construit depuis le programme de police intégré — Chromium n'en écrit
   pas ; définition de veraPDF mesurée : tous les glyphes du programme), validé par veraPDF ;
2. sinon Ghostscript, accepté seulement si veraPDF passe **et** si son texte est celui du source pour **deux
   lecteurs** : Ghostscript `txtwrite` et Poppler `pdftotext` (qui lit `/ActualText`) — `poppler-utils` ajouté à
   l'image (GPL-2, programme séparé, non modifié) et contrôlé par `/health` ;
3. sinon aucun fichier, et une phrase : le texte aurait changé, et comment archiver quand même (exporter en PDF/A
   depuis Word ou LibreOffice).
Limite de durée : 200 s pour tous les niveaux (deux validations et deux lectures de texte de plus au pire).

### 1.3 Revue indépendante (obligatoire)
1 critique, 1 sérieux, 5 moyens, 6 mineurs — **tous traités avant la mise en ligne** : `poppler-utils` absent du
Dockerfile (ajouté, et `pdftotext -v` à la construction : un oubli aurait fait refuser tous les PDF/A) ; le chemin
« gardé » des niveaux u/a était livré **sans** contrôle du texte et **rendait visibles les annotations cachées**
(un tampon caché « CONFIDENTIAL DRAFT » devenait visible) → une seule règle pour tous les niveaux (texte vérifié avant
toute livraison), annotation cachée retirée (rien de visible ne change), annotation « impression seulement » non
gardable (Ghostscript, contrôlé, décide) ; intention de sortie PDF/A existante (CMJN) gardée au lieu d'être remplacée ;
messages exacts (fichier protégé, conversion impossible) ; comparaison « mêmes caractères pour les deux lecteurs, mêmes
mots pour au moins un » (un espace placé autrement par un lecteur ne fait plus refuser) ; espaces insécables comptés
comme du texte ; texte de la source lu sur une copie déchiffrée quand un verrou de copie gêne un lecteur ; `CIDSet`
pour toutes les polices (pages, formulaires, apparences), GID 0 exclu ; délai de la route borné par `maxDuration` en
comptant l'arrivée d'un gros fichier ; refus « texte » sans rapport veraPDF trompeur.

### 1.4 Mesures
- **Corpus permanent** `scripts/p27/pdfa-corpus/` (31 PDF) : les 20 vrais PDF de P26 + Chromium (Calibri, Arial,
  balisé / non balisé), LibreOffice (grec, arabe, chinois, accents, ligatures, Cambria à accents décomposés), pdf-lib
  (polices en sous-ensemble), annotation cachée, annotation « impression seulement », verrou propriétaire. Fabriqué
  par `make.mjs` et `make_extra.py`.
- **Banc** `scripts/p26/e2/pdfa-bench.mjs` : désormais **tout** fichier livré (b compris) est comparé mot pour mot à
  son source par xpdf `pdftotext` (indépendant de Ghostscript et de Poppler qu'utilise le service), et revalidé par un
  veraPDF local.
- **En local** (Ghostscript 10.07) : 166/166 avant arrêt volontaire (banc relancé sur le service en ligne) + les 3 cas
  de la revue 12/12.
- **Service en ligne** (pdf-tools `83a62d4c`, commit `ed388b30`, Ghostscript 10.00, Poppler 22.12) : **341/341**,
  0 texte altéré. Livrés : b 125 (122 gardés, 3 par Ghostscript contrôlé), u 110 (104 gardés, 6 Ghostscript), a 32.
  Refusés avec la raison : 4 niveaux b sur 93 (le PDF « impression seulement » ×3 — Ghostscript non conforme, comme
  avant ; `site-mobi` en 1b — Ghostscript aurait altéré le texte, la page conseille l'export PDF/A depuis l'original).
- **Ancien comportement inchangé** (5 vrais PDF, au pixel et au texte) : réparation et compression **9/9 identiques**.
- **Rendu** : les PDF/A b livrés sont **identiques au pixel et au texte à leur source** (11/11) ; avant, la sortie de
  Ghostscript différait du source au texte sur 12/15.

## 2. Phase 2 — PDF to Word : vraies conversions sur www (≈ 0,02 $ de ConvertAPI)

Deux documents LibreOffice réalistes construits pour l'occasion (rapport de 3 pages avec titres, tableau, accents ;
le même avec une photo de 24 Mpx, PDF de **9,9 Mo**, 4 pages). Par la page de www, comme un visiteur
(`scripts/p27/word-www.mjs`) :

| Conversion | Résultat | Word 16 | LibreOffice 26 |
|---|---|---|---|
| PDF texte (66 Ko) → .doc | 61 952 o, conteneur Word 97, 4,0 s | s'ouvre : 3 pages, 1 tableau | s'ouvre |
| PDF 9,9 Mo → .rtf (service média) | 331 565 o, 10,6 s, 1 travail du service média | s'ouvre : 4 pages, 1 tableau, la photo | s'ouvre |

**Défaut trouvé (production, ancien, ConvertAPI)** : dans les deux fichiers, le texte courant a ses accents abîmés —
« données » → « donne% es », « être » → « e, tre ». Cause mesurée : ce PDF (LibreOffice, Cambria) dessine « é » en
« e » + un glyphe d'accent sans texte et porte le bon mot dans `/ActualText` (420 fois) ; Poppler et xpdf le lisent
juste, **ConvertAPI l'ignore**. Les sorties ConvertAPI antérieures (P25) gardaient leurs accents : le défaut tient à
cette famille de PDF (0 `/ActualText` dans les PDF que fabrique notre site, 99 dans un export LibreOffice Windows,
83 dans un PDF de Chromium avec ligatures). Voir §2.1 pour la suite donnée.

### 2.1 Suite donnée au défaut ConvertAPI — corrigé, en production
Options de ConvertAPI relues (PDF → DOCX : Layout, OcrMode, OcrLanguage, OcrEngine…) : aucune pour `/ActualText`.
Moyen retenu : avant ConvertAPI, donner aux glyphes d'accent sans texte **l'accent que leur propre `/ActualText`
indique** (nouveau point d'entrée `/v1/unicode-from-actualtext` de pdf-tools, additif ; seuls les flux ToUnicode
changent, rien n'est deviné). Expérience décisive avant de construire : le PDF ainsi complété → ConvertAPI écrit
« Les données numérisées doivent être conservées » (1 conversion). pdf.js, qui ignore aussi ActualText, passe de 375
mots faux à 15 (ordre de lecture) sur ce document.
**Revue indépendante** (obligatoire : un changement qui pourrait écrire un mauvais texte) : 3 sérieux, 4 moyens —
écritures lues dans l'ordre visuel (arabe, hébreu, indiennes) qui auraient reçu de mauvaises lettres, flux ToUnicode
partagés entre deux polices, chiffrement retiré, fichiers réparés réécrits, `q/Q` non suivis, syntaxes de CMap mal
lues. **Tout traité en restreignant au cas mesuré** : seules des marques combinantes (catégorie Unicode M), une par
lettre de base déjà lue ; jamais d'écriture droite-à-gauche ni réordonnée ; jamais un code déjà lu ; flux partagé, CMap
non comprise, Type0 non Identity, fichier chiffré ou réparé : laissés tels quels. Les deux PDF piégés du réviseur :
0 entrée ajoutée ; les 6 PDF LibreOffice concernés du corpus : 2-3 entrées chacun, texte Poppler/xpdf inchangé.
Câblage : `lib/providers/convertApi.js` (Word, RTF, Excel, PowerPoint), au mieux (service absent, lent > 30 s, ou
réponse autre qu'un PDF → octets d'origine, comme avant).
**Mis en production** (service `0901abe9` par fusion additive `a3dbff9e`, vérifié en ligne : 200 + 2 entrées / 204 ;
ancien comportement 23/23 identique ; site `98b84eba`). **Sur www**, le même PDF d'origine → .docx : « Les données
numérisées doivent être conservées », 0 « % ».
**Dépense ConvertAPI de la nuit : 4 conversions ≈ 0,04 $** (plafond 0,05 $) : .doc, RTF de 9,9 Mo, le PDF complété
(diagnostic), le contrôle final sur www.

## 3. Phase 3 — Gotenberg 8.37 : bloquée par une permission, mesures faites
- **Fait** : 8.37.0 relu (Chromium 152.0.7977.82, LibreOffice 26.8.0 ; 100.64/10 et 198.18/15 internes ; identifiants
  d'URL ignorés pour les listes ; bornes contre les pages hostiles ; formules mathématiques DOCX rétablies —
  `libreoffice-math` rajouté ; ≈ 75 Mo de moins par Chromium). Empreinte du registre lue : `8.37.0@sha256:f29984bd…`.
- **Banc élargi** `scripts/p27/gotenberg-compare.mjs` : 43 conversions (Word, Excel, PowerPoint dans tous les formats
  acceptés, documents de fidélité, HTML, EPUB, MOBI, URL, plus `math.docx` et `multilingual.docx` construits pour
  l'occasion). Sur la 8.36 actuelle (`gotenberg-fonts`) : **deux passages identiques au pixel, 43/43**.
- **Défaut trouvé en 8.36 (production)** : les **équations Office d'un DOCX disparaissent** du PDF (seul le texte
  autour reste) — c'est le défaut que 8.37 corrige.
- **Bloqué** : le déploiement de 8.37 sur `gotenberg-fonts` (service sans trafic de production) par `railway up` a
  été **refusé par le garde-fou des permissions de Claude Code** (« Production Deploy »), et la lecture d'état Railway
  qui a suivi aussi. Conformément à la règle, aucun contournement n'a été tenté. **Pour reprendre** : le propriétaire
  autorise cette action (règle de permission Bash pour `railway up` vers `gotenberg-fonts`) ou la lance lui-même ;
  ensuite banc 43 documents au pixel 8.36 / 8.37, sondes d'adresses internes, revue de sécurité, décision.
- **Recommandation** : passer en 8.37 (équations Word, plages internes, mémoire), **seulement** après le banc.
