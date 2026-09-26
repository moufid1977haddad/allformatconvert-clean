# RAPPORT — Amélioration 14 : générateur de codes-barres (barcode-generator)

**Dates :** 25-26 septembre 2026 · **Branche :** `licence-ameliorations` · **État :** **prête pour la préversion** (code, suites et mesures faits en local, build de production). **Non déployée** : le propriétaire a suspendu tout déploiement pendant son absence (message du 26/09 après-midi).
**Reprise :** après le redémarrage imprévu de Windows dans la nuit du 26/09, depuis `23beef99` (étape 2). Rien de perdu : seuls `next-env.d.ts` (régénéré par `next dev`) et `.serena/` (dossier d'outil) étaient hors commit, laissés tels quels. 11 processus Firefox de Playwright orphelins (profil d'une autre session, parent mort, lancés à 11 h 03 après le démarrage de 10 h 57) arrêtés.

⚠️ **Préversion automatique.** Le push de `4a7a5613` (fait quelques minutes avant la consigne « aucun déploiement ») a pu lancer une build de préversion Vercel : l'`ignoreCommand` de `vercel.json` ne saute que les changements limités à `docs/` et aux `.md`. Je ne l'ai ni ouverte ni testée. Les pushs suivants, demandés après chaque étape, déclenchent la même build automatique ; aucune préversion n'est ouverte, testée ou promue par moi.

---

## 0. En une table

| Point | Verdict | Preuve |
|---|---|---|
| Lecture des fichiers produits (17 codes communs, tous les formats) | ✅ **nous 102/102** ; barcode-maker 65/68 lus (3 SVG illisibles) **et 34 « JPG »/« GIF » qui sont des PNG renommés** ; barqode 50/50 mais **10 codes sur 17** seulement | §2.1 |
| Taille réelle à l'impression (EAN-13 à 100 %) | ✅ nous **0,330 mm** (SVG/PDF/EPS exacts, PNG/JPG 0,339 mm = 4 points à 300 dpi, dpi écrits) ; barqode **1,058 mm** en PDF/EPS (321 %, **hors norme GS1** qui s'arrête à 200 %), rien de déclaré en SVG/PNG ; barcode-maker aucun dpi | §2.2 |
| Saisies fautives | ✅ nous : tout refusé avec la raison ; barqode : chiffre de contrôle faux → **bouton muet, sans message** ; `café` en Code 128 → **fichier qui se lit « cafÃ© »** ; minuscules en Code 39 **silencieusement mises en capitales** (les deux références) | §2.3 |
| Lot de 1000 EAN-13 (ZIP, chacun relu par le banc) | ❌→✅ **26,5 s contre 8,3-8,7 s** au départ ; **pool de Workers** : Chromium **4,9-5,6 s contre 7,7-8,7 s**, Firefox **4,1-5,2 s contre 8,9-10,9 s**, chaque code relu (barcode-maker ne relit rien) | §3.1 |
| Planches d'étiquettes (barcode-maker les a) | ❌→✅ **adopté et amélioré** : A4/Letter Avery, rouleaux thermiques, départ à l'étiquette N, copies ; le code **garde sa taille** au lieu d'être étiré | §3.2 |
| Add-ons EAN-5/EAN-2, texte libre sous les barres, import CSV (barcode-maker les a) | ❌→✅ adoptés ; add-on dessiné à 9 modules car **zxing-cpp ne le trouve pas à l'écart par défaut de BWIPP (12)** | §3.3 |
| Suites | ✅ **67/67 Chromium, 67/67 Firefox** (build de production locale) | §4 |

---

## 1. Les références et ce qu'elles font (lu le 26/09)

| | **Nous** | **barcode-maker.com** | **barqode.io** |
|---|---|---|---|
| Moteur | bwip-js dans le navigateur | bwip-js pour la 2D, DataBar, GS1-128 ; un autre moteur pour EAN/UPC/Code 39 (d'après la structure de ses SVG) | bwip-js |
| Types | **37** | 36 pages (dont Code 128 A/B/C forcés, MSI par schéma, EAN-5/EAN-2 seuls) | 10 |
| Formats | PNG, JPG, GIF, SVG, PDF, EPS | PNG, « JPG », « GIF » (= PNG), SVG | SVG, EPS, PNG, PDF, JPG |
| Taille | module en mm/mil/px + dpi, écrits dans le fichier | largeur/hauteur en **pixels** | **aucun réglage** |
| Relecture avant téléchargement | **oui, chaque code** (zxing-cpp) | non | non |
| Lot | liste, série, CSV/TSV ; ZIP ou planches d'étiquettes | liste, série, CSV ; ZIP ; planches d'étiquettes | non |

**Banc** : `scripts/browser-tests/barcode-generator-vs-references.mjs` — les **mêmes 17 codes** tapés sur les trois sites, **chaque fichier proposé** téléchargé, puis lu par le **même lecteur indépendant** (zxing-cpp ; SVG dessiné par le navigateur, PDF par pdf.js **et** Ghostscript, EPS par Ghostscript) ; vrai type du fichier contrôlé par ses premiers octets ; module EAN-13 mesuré sur le rendu, et relecture après une impression simulée à 300 points (Ghostscript 300 dpi pour PDF/EPS, rééchantillonnage au plus proche pour les images, à la résolution qu'elles déclarent, 96 dpi sinon).

## 2. Mesure face aux références (26/09, build locale ; Chromium, puis Firefox pour confirmer)

### 2.1 Les fichiers se lisent-ils, et sont-ils ce qu'ils disent ?

| | Fichiers | Lus exactement | Vrai format |
|---|---|---|---|
| **Nous** (17 codes × 6 formats) | 102 | **102** | 102 |
| barcode-maker (17 × 4) | 68 | 65 — SVG **GS1-128** et **DataBar Expanded** illisibles à 7 échelles de rendu, **DataBar Omni** à 3 sur 7 | **34 « .jpg »/« .gif » sont des PNG** |
| barqode (10 × 5) | 50 | 50 | 50 |

Sous **Firefox**, même banc : nous 102/102 ; barcode-maker 66/68 lus (2 SVG illisibles), mêmes 34 PNG déguisés ; barqode 50/50. (Un premier passage comptait 4 ISBN barcode-maker en échec : mon banc lui tapait la forme sans tirets destinée à barqode, qu'il refuse ; corrigé et rejoué, 4/4 lus.)

### 2.2 Taille à l'impression — EAN-13 5901234123457 à 100 %

| | Déclaré | Module | Relu après impression 300 points |
|---|---|---|---|
| Nous PNG/JPG | 300 dpi écrits (pHYs, JFIF) | **0,339 mm** (4 px, barres entières) | oui |
| Nous SVG/PDF/EPS | 38,6 × 19,0 mm | **0,330 mm** (nominal GS1) | oui |
| Nous GIF | le format n'a pas de résolution | — | oui |
| barcode-maker PNG | aucun dpi (à 96 dpi : 0,529 mm) | dépend du logiciel | oui |
| barcode-maker SVG | 68,8 × 21,2 mm (260 px) | 0,346 mm | — |
| barqode PDF/EPS | page de 137,9 × 85,4 mm | **1,058 mm = 321 %** (GS1 : 80-200 %) | oui |
| barqode SVG / PNG | rien / aucun dpi | dépend du logiciel | oui |

### 2.3 Saisies fautives

| Saisie | Nous | barcode-maker | barqode |
|---|---|---|---|
| EAN-13 `5901234123458` (contrôle faux) | refus : « Incorrect EAN-13 check digit » | refus : « Invalid barcode value » | **aucun fichier, aucun message** |
| EAN-13 `590123412345` (12 chiffres) | 5901234123457 | idem | idem |
| UPC-A / ITF-14, contrôle faux | refus, raison donnée | refus | **muet** |
| Code 39 `abc-12` | refus : caractères permis listés | **fichier « ABC-12 »** sans le dire | **fichier « ABC-12 »** sans le dire |
| Code 128 `café` | refus : « scanned back as "cafÃ©" » (relecture) | refus | **fichier qui se lit « cafÃ© »** |

## 3. Ce qui était en dessous, et le moyen adopté

### 3.1 Vitesse du lot (étape 4, `b2114aff`)
Mesuré au départ : **26,5 s** pour 1000 EAN-13 contre **8,3-8,7 s** chez barcode-maker (un premier chiffre de 12,9 s pour eux était faux : mon banc leur ajoutait 3 s d'attente fixe ; corrigé avant toute conclusion). Cause : dessin, relecture et encodage de chaque code l'un après l'autre sur le fil principal. **Moyen** : chaque code entier (bwip-js sur `OffscreenCanvas`, zxing-cpp, encodage) dans jusqu'à 4 Workers, l'ordre de la liste gardé ; repli sur l'ancien chemin sans `OffscreenCanvas` (Safari < 16.4), testé en supprimant `OffscreenCanvas` de la page.
**Écarté par la mesure :** relire sans « try harder » — sur les 32 types relisibles, **pas plus rapide** (16 ms contre 25 ms au total) **et rate le DataBar Expanded Stacked**.

| 1000 EAN-13, ZIP de PNG | Nous | barcode-maker |
|---|---|---|
| Chromium | **4,9 · 5,1 · 5,3 · 5,3 · 5,4 · 5,6 · 5,6 s** (7 passages) | 7,7 · 8,3 · 8,5 · 8,7 s (4 passages valides) |
| Firefox | **4,1 · 4,8 · 5,1 · 5,2 s** (4 passages) | 8,9 · 9,6 · 10,9 s (3 passages valides) |
| Codes relus avant d'être mis dans le ZIP | **1000** | 0 |

Passages « valides » pour barcode-maker : ceux mesurés après la suppression de l'attente fixe que mon banc lui imposait (les chiffres de 11,0-11,4 s obtenus avant sont écartés).
(ZIP plus lourd chez nous : 9,1 Mo contre 4,7 Mo, car nos PNG sont à 300 dpi, 4 px par module, contre 2 px.)

### 3.2 Planches d'étiquettes (étape 5, `752fca19`)
barcode-maker imprime sur planches (A4/Letter, rouleaux Zebra/TSC) mais son aperçu **étire chaque code à la largeur de l'étiquette** : le module dépend de l'étiquette. (Son « Download PDF » ne produisait rien en Chromium sans tête en 20 s : PDF non mesuré.) **Adopté** : gabarits Avery A4 L7160, L7163, L7651, L7674, US Letter 5160, 5163, 5167, papier à découper, 10 tailles de rouleau (une étiquette par page), mise en page libre ; départ à l'étiquette N, copies, contours pour caler la planche. **Mieux** : le code garde la taille réglée, réduit seulement s'il ne tient pas — la page dit de combien et signale le minimum GS1 — ou « remplir l'étiquette » à la demande. PDF vectoriel, un Form XObject compressé par code (copies réutilisées), chaque code relu avant d'être posé.
En route : avertissement sous le **module minimum GS1** (EAN/UPC 0,264 mm ; **ITF-14 0,495 mm — notre 0,33 mm par défaut est trop petit pour l'ITF-14**).

### 3.3 Add-ons, texte libre, CSV (étape 6, `4a7a5613`)
- **Add-ons** tapés après le code (`978-1-56581-231-4 51299`, `0311-175X 00 05`) sur EAN-13, UPC-A, UPC-E, ISBN, ISMN, ISSN ; EAN-5 et EAN-2 seuls (37 types). **Mesuré** : zxing-cpp trouve l'add-on à 7 et 9 modules d'écart, **pas à 12** (valeur par défaut de BWIPP, borne haute GS1 7-12) → dessiné à 9, relu avec l'add-on exigé.
- **Texte libre** sous les barres (un code seul, ou après une tabulation dans la liste).
- **Import CSV/TSV** (séparateur deviné, guillemets RFC 4180) : 1re colonne la valeur, 2e le texte.

### Restent en dessous ou différents (non adoptés, à décider)
- barcode-maker propose **Code 128 A/B/C forcés** et une **page par schéma MSI** ; ici Code 128 choisit le jeu le plus court (même texte lu) et MSI a un sélecteur de schéma. Pas d'écart de résultat mesuré.
- barcode-maker a un **lien d'API d'image** (`/api/barcode/<type>/<valeur>`) : hors du modèle « tout dans le navigateur » de ce site.

## 4. Suites

`scripts/browser-tests/barcode-generator.mjs` (vraie page, build de production locale) : les 37 types dans les 6 formats, chaque fichier lu par un lecteur indépendant (zxing-cpp ; pour MSI, Pharmacode, Code 11, EAN-5, EAN-2, décodeurs du test, **parité EAN-5/EAN-2 vérifiée**) ; contrôles, contrastes, dpi, tailles, rotation, transparence ; lots liste/série ; add-ons relus en PNG et en PDF rendu par Ghostscript ; texte libre ; import d'un CSV à points-virgules et guillemets ; planches L7160 relues **cellule par cellule** (départ 3, 25 codes, 2 pages, étiquettes vides vérifiées vides), **module mesuré 0,330 mm sur la page** ; rouleau 50×30 avec copies ; réduction signalée ; annulation pendant 5000 codes ; repli sans `OffscreenCanvas`.
**Chromium 67/67, Firefox 67/67.**

## 5. Préversion et production

**Non faites** — consigne du propriétaire du 26/09 (absence) : aucun déploiement. À faire à son retour : préversion (protégée : accès à convenir avec lui, sans `vercel link` ni fichier d'environnement), suites et banc sur la préversion, puis production et vérification sur www sous Chromium et Firefox.

## 6. Ce qui reste vrai et non fait

- Safari réel / iPhone : non éprouvé (repli sans `OffscreenCanvas` testé en le retirant sous Chromium).
- Le PDF d'étiquettes de barcode-maker n'a pas pu être téléchargé (Chromium sans tête) : comparaison faite sur son aperçu.
- Plafonds (5000 codes par ZIP, 5000 étiquettes par PDF) : non mesurés au-delà de 5000.
