# Passage manuel du propriétaire — feuille de test

> Bloquant 11 du `plan-de-travail.md`. Préparé le 13 septembre 2026.
> **Sept tests, dans un ordre pratique.** Chacun : le fichier à utiliser, le geste, le résultat attendu, et une case pour le verdict.
>
> Ordre choisi sur deux critères : **regrouper ce qui réutilise le même fichier et la même session de navigateur**, et **finir par le seul test qui écrit en base**.
>
> Durée totale estimée : **1 h 15 à 1 h 45** si les fichiers sont prêts. Les tests 1 et 2 seuls : **15 minutes**.
>
> *Note du 28/09 : cette feuille vivait jusqu'ici uniquement dans le Projet claude.ai (créée le 13/09), jamais commitée. Copiée telle quelle dans le dépôt le 28/09 ; c'est désormais cette copie qui fait foi.*

---

## Les fichiers à avoir sous la main AVANT de commencer

| # | Fichier | Où le trouver | Sert aux tests |
|---|---|---|---|
| A | **Un MP4 réel**, 10 à 30 s, scène claire et contrastée | n'importe quelle vidéo de téléphone | 1, 2 |
| B | **Un MP4 vertical** (portrait, filmé au téléphone) | idem | 1, 2 |
| C | **Un vrai export Excel français** : ouvrir un classeur dans Excel en français → *Enregistrer sous* → **CSV (séparateur : point-virgule)** | Excel, sur ta machine | 3 |
| D | **Un MP3** (44,1 kHz, stéréo) **et un WAV** (48 kHz, mono, PCM 16 bits) | deux sources différentes — surtout **pas** deux exports du même fichier | 4 |
| E | **Un `.doc`** (Word 97-2003), **un `.ppt`** (PowerPoint 97-2003), **un `.ods`** (LibreOffice Calc) | *Enregistrer sous* dans le format ancien | 5 |
| F | **Un PDF scanné en français** (photo de page, texte non sélectionnable) | scan ou photo imprimée | 6 |

**Le fichier C est le seul non substituable.** Un CSV écrit à la main ne prouve rien : ce qu'on teste, c'est ce qu'Excel FR produit réellement — point-virgules **et** virgules décimales **et** BOM UTF-8 éventuel.

---

## Test 1 — `video-screenshot` en JPG *(jamais vérifié)*

**Page :** `/tools/video-tools/video-screenshot` · **Fichier :** A, puis B

**Gestes :**
1. Charger le MP4, **lancer la lecture puis mettre en pause** sur une image claire.
2. Capturer en **PNG**. Télécharger. Ouvrir le fichier.
3. Basculer sur **JPG**. Capturer. Télécharger. Ouvrir le fichier.
4. Refaire les étapes 1-3 avec la vidéo verticale (B).

**Résultat attendu :** les deux fichiers montrent **la même image**, celle qui était à l'écran. Le JPG n'est **ni noir, ni transparent devenu noir, ni décalé**.

**Ce qu'on cherche vraiment :** un canevas dont l'image n'a pas encore été décodée, ou dont la couche alpha est vide, donne un **JPG entièrement noir sans aucune erreur** — exactement le motif des neuf profondeurs de bits TIFF du 9 septembre. Une capture faite **avant** d'avoir joué la vidéo reproduit le cas ; c'est la variante à essayer si le JPG sort correct du premier coup.

**Verdict :** ⬜ PASS ⬜ ÉCHEC — notes :

---

## Test 2 — les cinq cas de `video-watermark`

**Page :** `/tools/video-tools/video-watermark` · **Fichier :** A, puis B

Les cinq cas sont les **cinq positions** proposées par l'outil. Même vidéo, même texte, on change seulement la position :

| # | Position | Résultat attendu |
|---|---|---|
| 2.1 | `top-left` | texte entièrement dans l'image, lisible, non collé au bord |
| 2.2 | `top-right` | texte **entièrement visible** — pas tronqué à droite |
| 2.3 | `center` | texte centré horizontalement, à mi-hauteur |
| 2.4 | `bottom-left` | texte entier — **le bas des lettres à jambage (`g`, `p`, `y`) ne doit pas être coupé** |
| 2.5 | `bottom-right` | ni tronqué à droite, ni coupé en bas |

**Gestes :** charger A, lecture puis pause, taper un texte contenant **au moins une majuscule et une lettre à jambage** — par exemple `Mon Type © 2026` — puis capturer une fois par position et ouvrir les cinq images.

**Puis refaire les cinq sur la vidéo verticale (B).** C'est là que les positions de droite cassent le plus facilement : la largeur du texte y occupe une bien plus grande part de l'image.

**Résultat attendu global :** cinq images (puis dix), texte intégralement visible dans chacune, à la position annoncée.

**Verdict :** 2.1 ⬜ · 2.2 ⬜ · 2.3 ⬜ · 2.4 ⬜ · 2.5 ⬜ — vertical : ⬜ — notes :

---

## Test 3 — délimiteur CSV avec un vrai export Excel français

**Fichier :** C (le `.csv` à point-virgules produit par Excel FR)

**Pages, dans cet ordre :**
1. `/tools/developer-tools/csv-to-json`
2. `/tools/developer-tools/csv-to-excel`
3. `/tools/developer-tools/csv-to-tsv`

**Résultat attendu :** les colonnes sont **séparées correctement** — une colonne par colonne réelle, pas une seule colonne géante contenant `nom;prix;quantité`. Et les nombres décimaux (`12,50`) ne doivent **ni disparaître, ni se scinder en deux colonnes, ni devenir `1250`**.

**Le piège précis :** un analyseur CSV qui coupe sur `,` en dur voit `12,50` comme deux champs. Avec des points-virgules comme séparateurs **et** des virgules décimales, les deux erreurs se combinent et le résultat peut être **plausible mais faux** — le pire cas, celui qui passe inaperçu.

**À noter aussi :** si l'outil annonce « détecte automatiquement le délimiteur » dans sa page de description alors qu'il ne le fait pas, c'est une **promesse fausse en ligne**, au même titre que les « professional-grade fidelity » du bloquant 2. Le signaler avec le verdict.

**Verdict :** csv-to-json ⬜ · csv-to-excel ⬜ · csv-to-tsv ⬜ — notes :

---

## Test 4 — `audio-merger`, MP3 + WAV de codecs différents

**Page :** l'outil `audio-merger` dans `/tools/audio-tools` · **Fichiers :** D

Cet outil est l'une des **sept lignes du tableau d'audit démenties par la lecture du code** — il n'a jamais été prouvé sur fichiers réels. C'est exactement le cas « listé n'est pas prouvé ».

**Gestes :** charger le MP3 **puis** le WAV, fusionner, télécharger, **écouter le résultat en entier**.

**Résultat attendu :**
- le fichier de sortie contient **les deux pistes, l'une après l'autre**, dans l'ordre donné ;
- la durée totale ≈ somme des deux durées ;
- **aucun changement de vitesse ni de hauteur de son** au passage de la première à la seconde — c'est le symptôme d'un ré-échantillonnage manqué entre 44,1 et 48 kHz ;
- si l'un des deux est mono et l'autre stéréo, la partie mono doit s'entendre **sur les deux oreilles**, pas sur une seule.

**Puis inverser l'ordre** (WAV d'abord, MP3 ensuite) et réécouter : certains défauts n'apparaissent que dans un sens.

**Verdict :** ⬜ PASS ⬜ ÉCHEC — notes :

---

## Test 5 — `.doc`, `.ppt`, `.ods` sur les outils PDF

**Fichiers :** E · **Pages :** les outils Office → PDF de `/tools/pdf-tools`

| Fichier | Résultat attendu |
|---|---|
| `.doc` (Word 97-2003) | un PDF lisible **ou** un refus clair et explicite. Jamais une erreur technique brute, jamais un PDF vide. |
| `.ppt` (PowerPoint 97-2003) | idem — une diapositive par page |
| `.ods` (LibreOffice Calc) | idem — les cellules lisibles, pas de colonne écrasée |

**Le critère n'est pas « ça marche »**, c'est : **est-ce que le visiteur comprend ce qui s'est passé ?** Un format ancien non pris en charge est acceptable ; un message d'erreur technique ou un fichier vide téléchargé sans avertissement ne l'est pas.

**À noter séparément :** les carrés vides dus à Wingdings/Webdings sont **déjà connus et sans solution légale** (bloquant 2) — ne pas les compter comme un échec de ce test.

**Verdict :** `.doc` ⬜ · `.ppt` ⬜ · `.ods` ⬜ — notes :

---

## Test 6 — recherche de langue dans `pdf-ocr`

**Page :** `pdf-ocr` dans `/tools/pdf-tools` · **Fichier :** F (PDF scanné en français)

**Gestes :**
1. Ouvrir le sélecteur de langue. **Taper `fran`** dans le champ de recherche.
2. Vérifier que « French / Français » remonte. Essayer aussi **`fr`**, puis **`français` avec la cédille**.
3. Sélectionner le français, lancer l'OCR sur F, lire le texte extrait.

**Résultat attendu :** la recherche trouve la langue avec une saisie **partielle**, en anglais comme en français, **accents et cédille inclus**. Puis le texte extrait comporte de vrais accents (`é`, `à`, `ç`) et non des caractères de remplacement.

**Le moteur est Tesseract.js**, seul outil du site sur ce moteur : un échec ici ne concerne qu'une page.

**Verdict :** recherche ⬜ · extraction ⬜ — notes :

---

## Test 7 — provoquer un vrai plantage et vérifier `tool_errors` *(à faire en dernier)*

**⚠️ Ce test écrit une ligne réelle dans la table de production.** À faire sur **l'URL de prévisualisation** si elle est encore debout, et non sur `onlineconvertools.com`.

**Ce qu'on veut prouver :** `app/error.jsx` ne se contente pas d'afficher un écran d'erreur propre — il **écrit effectivement** dans `tool_errors`. Les quatre tests de la balise du 9 septembre couvraient les échecs **d'outils**, pas le plantage **de page React**. C'est le trou restant.

**Gestes :**
1. Noter l'heure exacte (à la minute).
2. Provoquer un plantage de rendu réel — une entrée que la page ne sait pas traiter, ou le cas connu **Google Translate contre React** : activer la traduction de la page, puis déclencher un téléchargement (c'était la cause corrigée au commit `ab77de51`, mais c'est un déclencheur de plantage fiable).
3. Vérifier que l'écran d'erreur du site s'affiche — pas une page blanche, pas l'écran de Vercel.
4. Supabase → *Table Editor* → `tool_errors` → trier par date décroissante.

**Résultat attendu :** une ligne **nouvelle**, horodatée à la minute notée, avec le nom de l'outil et le type d'erreur — et **aucun nom de fichier, aucun contenu de fichier** dedans. C'est la même exigence de confidentialité que le troisième test de la balise.

**Si aucune ligne n'apparaît :** l'écran d'erreur est cosmétique et la remontée ne couvre pas les plantages de page. À écrire dans le plan de travail comme fait mesuré, sans corriger dans la foulée.

**Verdict :** ligne écrite ⬜ · aucune fuite de nom de fichier ⬜ — heure du plantage : ______ — notes :

---

## Les contrôles des vagues 1 et 2 — à sortir du dépôt

Les vagues 1 et 2 comptent **cinq contrôles** (vague 1) et **trois outils** (vague 2 : `excel-to-json`, `xml-to-json`, `audio-merger`). Deux d'entre eux sont **déjà couverts ici** : `audio-merger` par le test 4, et la famille CSV/Excel par le test 3.

**La liste exacte des cinq contrôles de la vague 1 n'est pas dans les documents de pilotage** — elle est dans les rapports du dépôt, `docs/audit/RAPPORT-*` aux commits `50527805` et `b77f988b`, qui ne sont pas synchronisés ici. À reprendre depuis le dépôt avant de cocher cette ligne ; je ne l'invente pas.

Restent donc, hors de cette feuille : **les cinq contrôles de la vague 1**, et **`excel-to-json` + `xml-to-json`** de la vague 2.

---

## Après la session

Reporter les sept verdicts dans le **bloquant 11** du `plan-de-travail.md`, et **ce qui a échoué dans la section des bloquants**, jamais dans « CLOS ». Un test passé se note avec sa preuve : le fichier utilisé et ce qui a été observé.

**Rappel de la doctrine, couche 5 :** *« Le passage manuel du propriétaire. Irremplaçable. »* Le 12 septembre, c'est ce passage-là qui a renversé un diagnostic de deux jours.
