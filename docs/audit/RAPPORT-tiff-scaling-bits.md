# Rapport — Mise à l'échelle TIFF haute profondeur de bits + délai image-converter

Date : 2026-09-08. Suite de `docs/audit/PROGRESS-famille4.md` et du chantier Worker/délai/annulation
sur tiff-to-jpg/tiff-to-png (commit `036bf63f`).

## 1. Avant / après par profondeur de bits testée

Toutes les mesures viennent de vrais fichiers du corpus libtiff (`pics-3.8.0.tar.gz`, sous-dossier
`libtiffpic/depth/` — série "flower" requantifiée à chaque profondeur — et `ladoga.tif`), décodés
avec `app/lib/tiffDecode.js` avant/après la correction. Valeurs = min/max/moyenne du canal rouge de
la sortie RGBA8 (0 = noir, 255 = blanc).

| Profondeur | Type | Avant | Après | Fichier réel |
|---|---|---|---|---|
| 1 bit | Gris | Correct (mapping exact 0/255, rien à corriger) | Inchangé (volontairement non touché) | fax2d.tif, jim___ah.tif |
| 2 bit | Gris | 0/255/49.0 (déjà correct) | 0/255/49.0 (inchangé) | flower-minisblack-02.tif |
| 2 bit | RVB | **Erreur brute non gérée ("2")** | 0/255/51.9 (correct) | flower-rgb-contig-02.tif |
| 4 bit | Gris | **0/0/0.0 — image 100% noire, aucune erreur** | 0/255/85.0 (correct) | flower-minisblack-04.tif |
| 4 bit | RVB | **Erreur brute ("4")** | 0/255/88.1 (correct) | flower-rgb-contig-04.tif |
| 6 bit | Gris | **0/0/0.0 — noire silencieuse** | 0/255/85.9 (correct) | flower-minisblack-06.tif |
| 8 bit | Gris/RVB | Référence, déjà correct | **Inchangé, aucune régression** | dscf0013.tif, pc260001.tif, cramps.tif, flower-*-08.tif |
| 10 bit | Gris | **0/0/0.0 — noire silencieuse** | 0/255/87.5 (correct) | flower-minisblack-10.tif |
| 10 bit | RVB | **Erreur brute ("10")** | 0/255/96.3 (correct) | flower-rgb-contig-10.tif |
| 12 bit | Gris | **0/0/0.0 — noire silencieuse** | 0/255/87.4 (correct) | flower-minisblack-12.tif |
| 12 bit | RVB | **Erreur brute ("12")** | 0/255/96.4 (correct) | flower-rgb-contig-12.tif |
| 14 bit | Gris | **0/0/0.0 — noire silencieuse** | 0/255/87.5 (correct) | flower-minisblack-14.tif |
| 14 bit | RVB | **Erreur brute ("14")** | 0/255/96.4 (correct) | flower-rgb-contig-14.tif |
| 16 bit | Gris, plage réelle étroite (1290–1681 sur 0–65535) | **5/6/5.0 — quasi noire, résultat valide et FAUX, sans avertissement** (le bug signalé) | 0/255/52.7 — relief/côtes visibles, correct | **ladoga.tif** |
| 16 bit | Gris, plage synthétique déjà pleine | 8/255/93.3 (correct par coïncidence — ce fichier utilise déjà toute la plage) | 0/255/87.5 (correct, cohérent avec les autres profondeurs) | flower-minisblack-16.tif |
| 16 bit | RVB | 0/255/96.4 (déjà correct, plage pleine) | 0/255/96.4 (inchangé) | flower-rgb-contig-16.tif |
| 24 bit | Gris | **0/0/0.0 — noire silencieuse** | 0/255/87.6 (correct) | flower-minisblack-24.tif |
| 24 bit | RVB | **Erreur brute ("24")** | 0/255/96.0 (correct) | flower-rgb-contig-24.tif |
| 32 bit | Gris, entier | **Erreur ("e")** | 0/255/87.5 (correct) | flower-minisblack-32.tif |
| 32 bit | RVB, entier | **0/255/68.0 — image plausible mais FAUSSE** (octets entiers réinterprétés comme flottant IEEE-754) | 0/255/96.4 — correcte, cohérente avec les versions 8/16 bits du même fichier | flower-rgb-contig-32.tif |

Toutes les profondeurs de la série "flower" (2 à 32 bits) convergent après correction vers la même
moyenne (~87–96 selon gris/RVB), confirmant que c'est bien la même photo correctement restituée à
chaque profondeur, vérifié aussi visuellement (rendu PNG comparé : minisblack-08 vs minisblack-12,
rgb-contig-08 vs rgb-contig-32 — images identiques à l'œil).

### Découverte annexe, corrigée en plus (hors des 3 points demandés)

En testant les profondeurs de bits sur le corpus `depth/`, un fichier CMYK a révélé une régression
introduite par le passage en Web Worker de la session précédente (commit `036bf63f`) : le chemin CMYK
d'UTIF2 référence `window.UDOC`, qui n'existe pas dans un Worker (`self`, pas `window`) — plantage
`window is not defined` là où le thread principal l'ignorait silencieusement (`window.UDOC` y est
juste `undefined`). Corrigé en réimplémentant directement la conversion CMYK→RVB d'UTIF2 (sans
UDOC) dans `app/lib/tiffDecode.js`, sans dépendre d'un `window` global.

En creusant ce cas, un second défaut réel est apparu : le chemin CMYK d'UTIF2 ne connaît pas la
profondeur de bits (il lit toujours un octet brut par échantillon) — en 16 bits par canal, ça
produit une image visiblement corrompue (bruit), **sans erreur**. Un garde-fou explicite a été
ajouté : le CMYK à une profondeur autre que 8 bits est maintenant refusé avec un message clair
plutôt que de produire ce bruit.

| Cas CMYK | Avant (avant cette session) | Après | Fichier réel |
|---|---|---|---|
| 8 bits/canal | Plantage `window is not defined` dans le Worker | Décode correctement (0/255/49.6, photo reconnaissable) | flower-separated-contig-08.tif |
| 16 bits/canal | Plantage `window is not defined` | Refus explicite : *"This TIFF uses CMYK color at 16 bits per channel, which this decoder can only read correctly at 8 bits per channel..."* (au lieu de produire du bruit silencieusement) | flower-separated-contig-16.tif |

## 2. Délai automatique ajouté à image-converter (point 2)

Même valeur (`TIFF_DECODE_TIMEOUT_MS = 20000`, `app/lib/tiffDecode.js`) et même message
(`TIFF_DECODE_TIMEOUT_MESSAGE`, désormais exporté une seule fois et importé par les trois outils —
tiff-to-jpg, tiff-to-png et image-converter — pour qu'ils ne puissent plus diverger). Le
chien de garde se réarme à chaque message reçu du Worker (progression, fichier terminé, erreur),
donc un gros lot de fichiers valides ne le déclenche pas, seul un fichier bloqué le fait courir à
son terme. Vérifié en direct dans Chrome avec `quad-lzw.tif` : le message apparaît après ~20s, le
Worker est arrêté, le bouton redevient utilisable immédiatement.

## 3. Nettoyage du scratchpad (point 3)

Fichiers de test temporaires (`decode-one.cjs`, `dev.log`, `dev2.log`, copies `.mjs` du module de
test) supprimés. Le corpus libtiff téléchargé (`scratchpad/tiff-corpus/`, ~23 Mo — `libtiffpic/` et
son sous-dossier `depth/`, plus un fichier réel volumineux de learningcontainer.com) est conservé
tel quel pour les prochains chantiers image, comme demandé.

**Note de fiabilité** : ce répertoire scratchpad est documenté par la plateforme comme
"session-specific" — sa persistance au-delà de cette session n'est pas garantie. Si le corpus n'est
plus là au prochain chantier, l'URL de téléchargement exacte est maintenant consignée dans la mémoire
`reference_local_dev_setup` (`https://download.osgeo.org/libtiff/pics-3.8.0.tar.gz`) pour le
retélécharger en une commande.

## Ce qui n'a pas pu être traité et pourquoi

| Cas | Raison |
|---|---|
| Gris flottant 32 bits (SampleFormat=3) avec plage réelle hors [0,1] | Risque théorique identifié en lisant le code d'UTIF2 (le même style de bug que ladoga.tif pourrait s'y reproduire), mais **aucun fichier réel** de ce type disponible pour le prouver — laissé tel quel plutôt que deviné. Règle du projet : jamais de fichier fabriqué. |
| Palette 16 bits (`flower-palette-16.tif`) | Reste en échec explicite ("16"), inchangé et volontaire : les valeurs d'une image palette sont des index dans une table de couleurs, pas des intensités — les ramener à l'échelle casserait la table au lieu de corriger quoi que ce soit. |
| Échantillons signés (SampleFormat=2) en interprétation Gris/RVB | Gérés de façon défensive dans le lecteur de bits (extension de signe), mais **non testés avec un fichier réel** — les seuls fichiers du corpus avec SampleFormat=2 (`off_l16.tif`, `off_luv24/32.tif`) utilisent une interprétation photométrique exotique (32844/32845, CIE LogL/LogLuv) hors du périmètre de cette correction. |
| `off_l16.tif` (interprétation photométrique 32844 non gérée par UTIF2 du tout) | Défaut préexistant, sans rapport avec la profondeur de bits, non demandé — non traité. |
| TIFF planaires à n'importe quelle profondeur (`flower-rgb-planar-*`) | Toujours interceptés par le garde-fou PlanarConfiguration=2 existant, avant même d'atteindre le nouveau code — comportement inchangé, vérifié sans régression. |

## Tests manuels qui reviennent au propriétaire

| Test | Fichier | Résultat attendu |
|---|---|---|
| Photo scanner/appareil 16 bits réelle, plage étroite | Tout TIFF 16 bits "plat" en main (radiographie, carte d'élévation, sortie de scanner scientifique) | Image visible avec du contraste réel, plus de rendu quasi noir |
| image-converter, gros lot avec un fichier piégé au milieu | Un lot de plusieurs images valides + `quad-lzw.tif` inséré au milieu | Les fichiers valides se terminent normalement, le lot s'arrête proprement ~20s après avoir atteint le fichier piégé, avec le message explicite |
| CMYK 8 bits dans les trois outils | Un vrai TIFF CMYK (impression/prépresse) | Doit se décoder maintenant (plantait avant cette session) |
